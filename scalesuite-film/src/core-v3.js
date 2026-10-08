/* ScaleSuite film V3: additions on top of the V2 helpers (core.js and logo.js, loaded read-only).
   Choreography lives in ONE paused GSAP master timeline (SS.tl). Each captured frame calls
   SS.renderFrame(t), which seeks the timeline to t and then runs every scene's procedural render(t)
   (camera matrix, shake noise, odometer sums). The picture stays a pure function of t, whatever
   order the frames are rendered in. Rules for tweens:
     - fromTo() only, with explicit start values, so no tween ever reads the current state;
     - immediateRender:false on every later tween of the same property;
     - a DOM element is driven either by GSAP or by a render(t) function, never by both
       (procedural values go through plain "proxy" objects that GSAP tweens). */
(function () {
  const SS = window.SS;
  gsap.registerPlugin(CustomEase);
  // 2D transforms only: Chrome re-rasterises text at every camera scale (no blurry zooms).
  gsap.config({ force3D: false, nullTargetWarn: false });
  gsap.ticker.lagSmoothing(0);

  // ---- Brand motion identity (design-dna-v3.json → design_system.motion) --------------------
  SS.EZ = {
    out: CustomEase.create('ss-out', '.16,1,.3,1'), // signature entrance
    soft: CustomEase.create('ss-soft', '.22,1,.36,1'),
    inOut: CustomEase.create('ss-inout', '.65,0,.35,1'), // camera and on-screen moves
    in: CustomEase.create('ss-in', '.7,0,.84,0'), // exits
    cam: CustomEase.create('ss-cam', '.55,0,.18,1.06'), // camera move with a ~1.5 % settle
    pop: 'back.out(1.7)', // ≈ 10 % overshoot: hero UI
    pop12: 'back.out(1.9)', // ≈ 12 %
    dock: 'back.out(1.1)', // ≈ 4.5 %
  };
  SS.ease = (name) => gsap.parseEase(name);

  SS.tl = gsap.timeline({ paused: true, defaults: { ease: SS.EZ.out, duration: 0.5, immediateRender: false } });

  // Sound cues collected while the timeline is built (exported for audio/music-v3.py).
  SS.cues = [];
  SS.cue = (t, type, extra) => SS.cues.push(Object.assign({ t: +(+t).toFixed(4), type }, extra || {}));

  // ---- Placement -------------------------------------------------------------------------------
  // Absolutely placed element centred on (x, y) through GSAP's transform cache.
  SS.place = (el, x, y, extra) => gsap.set(el, Object.assign({ x, y, xPercent: -50, yPercent: -50 }, extra || {}));

  // ---- World camera ----------------------------------------------------------------------------
  // World point (cam.x, cam.y) is shown at the frame centre, at scale cam.s and rotation cam.r.
  // cam.shake (px on screen) and cam.shakeR (deg) add a deterministic handheld jitter.
  SS.cam = { x: 540, y: 960, s: 1, r: 0, blur: 0, shake: 0, shakeR: 0 };
  SS.makeWorld = (stage) => {
    const wrap = SS.el('div', 'world-wrap', stage);
    const world = SS.el('div', 'world', wrap);
    SS.worldWrap = wrap;
    SS.world = world;
    return world;
  };
  // Cameras: keys are chained in build order, each move starting exactly where the previous one
  // ended (explicit fromTo), so x/y/s/r tweens never overlap or read live values.
  // (GSAP writes tween settings into the vars objects it receives, so every call gets fresh copies.)
  const KEYS = ['x', 'y', 's', 'r'];
  const pick = (o) => KEYS.reduce((a, k) => ((a[k] = o[k]), a), {});
  SS.camera = (proxy) => {
    let state = { x: 540, y: 960, s: 1, r: 0 };
    return {
      p: proxy,
      set(st) { state = pick(Object.assign({}, state, st)); gsap.set(proxy, pick(state)); },
      to(at, dur, ease, to) {
        const end = pick(Object.assign({}, state, to));
        SS.tl.fromTo(proxy, pick(state), Object.assign(pick(end), { duration: dur, ease }), at);
        state = end;
        return pick(end);
      },
      fx(at, dur, ease, from, to) { return SS.tl.fromTo(proxy, from, Object.assign({ duration: dur, ease }, to), at); },
      get state() { return pick(state); },
    };
  };
  SS.mainCam = SS.camera(SS.cam);
  SS.camSet = (st) => SS.mainCam.set(st);
  SS.camTo = (at, dur, ease, to) => SS.mainCam.to(at, dur, ease, to);
  // blur / shake envelopes (separate properties from the camera path)
  SS.camFx = (at, dur, ease, from, to) => SS.mainCam.fx(at, dur, ease, from, to);
  // world point (x, y) → screen, for a camera proxy without shake
  SS.toScreen = (c, x, y) => {
    const a = (c.r || 0) * Math.PI / 180, dx = (x - c.x) * c.s, dy = (y - c.y) * c.s;
    return { x: 540 + dx * Math.cos(a) - dy * Math.sin(a), y: 960 + dx * Math.sin(a) + dy * Math.cos(a), s: c.s };
  };
  SS.camMatrix = (c, ox = 0, oy = 0, r = c.r || 0) =>
    `translate(${(540 + ox).toFixed(2)}px,${(960 + oy).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${c.s.toFixed(4)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;
  // smooth pseudo-noise (sum of incommensurate sines), roughly in [-1, 1]
  SS.noise = (t, seed) => 0.5 * Math.sin(t * 61.3 + seed * 1.7) + 0.3 * Math.sin(t * 97.1 + seed * 4.1) + 0.2 * Math.sin(t * 37.7 + seed * 2.9);
  SS.camNow = (t) => {
    const c = SS.cam;
    return {
      x: c.x, y: c.y, s: c.s,
      r: c.r + c.shakeR * SS.noise(t, 3),
      ox: c.shake * SS.noise(t, 1), oy: c.shake * SS.noise(t, 2),
    };
  };
  SS.applyCam = (t) => {
    if (!SS.world) return;
    const k = SS.camNow(t);
    SS.world.style.transform = SS.camMatrix(k, k.ox, k.oy, k.r);
    const b = SS.cam.blur;
    SS.worldWrap.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
  };

  // ---- Masked words (SS.text from core.js) driven by the timeline ------------------------------
  const wordEls = (T, from = 0, to) => T.words.slice(from, to).map((w) => w.el);
  // rise into the mask
  SS.wordsIn = (T, at, o = {}) => {
    const els = wordEls(T, o.from, o.to);
    SS.tl.fromTo(els, { yPercent: SS.HIDE * (o.dir || 1) }, { yPercent: 0, duration: o.dur || 0.7, stagger: o.st == null ? 0.06 : o.st, ease: o.ease || SS.EZ.out }, at);
  };
  // leave through the mask (upward by default)
  SS.wordsOut = (T, at, o = {}) => {
    const els = wordEls(T, o.from, o.to);
    SS.tl.fromTo(els, { yPercent: 0 }, { yPercent: -SS.HIDE * (o.dir || 1), duration: o.dur || 0.26, stagger: o.st == null ? 0.02 : o.st, ease: o.ease || SS.EZ.in }, at);
  };
  // words start hidden below their mask
  SS.hideWords = (T) => gsap.set(wordEls(T), { yPercent: SS.HIDE });

  // ---- Procedural per-frame updates (typing, counters, shakes) ----------------------------------
  SS.procs = [];
  SS.proc = (fn) => SS.procs.push(fn);
  // Typing: segments [{at, dur, to}] (each rewrites from the previous text: backspace to the common
  // prefix, then type). Characters advance one by one (a step, not a spatial ease).
  SS.typer = (el, segs, caret) => {
    let prev = '';
    const S = segs.map((g) => {
      let pre = 0;
      while (pre < prev.length && pre < g.to.length && prev[pre] === g.to[pre]) pre++;
      const o = Object.assign({ from: prev, pre, del: prev.length - pre, add: g.to.length - pre }, g);
      if (!g.silent) SS.cue(g.at, 'type', { n: o.del + o.add, dur: g.dur, del: o.del });
      prev = g.to;
      return o;
    });
    SS.proc((t) => {
      let txt = '', active = false;
      for (const g of S) {
        if (t < g.at) break;
        const ops = g.del + g.add, i = Math.min(ops, Math.floor(((t - g.at) / g.dur) * ops + 1e-6));
        txt = i < g.del ? g.from.slice(0, g.from.length - i) : g.to.slice(0, g.pre + (i - g.del));
        active = t <= g.at + g.dur + 0.45;
      }
      if (el.textContent !== txt) el.textContent = txt;
      if (caret) {
        const near = S.some((g) => !g.silent && t >= g.at - 0.35 && t <= g.at + g.dur + 0.45);
        const typing = S.some((g) => !g.silent && t >= g.at && t <= g.at + g.dur);
        caret.style.opacity = near && (typing || Math.floor(t * 3.4) % 2 === 0) ? 1 : 0;
      }
      return active;
    });
  };
  // Counters: value eases to its target; French thousands separator (narrow no-break space).
  const fmt = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  SS.counter = (el, keys) => { // keys: [{at, dur, from, to, ease}]
    SS.proc((t) => {
      let v = keys[0].from;
      for (const k of keys) if (t >= k.at) v = k.from + (k.to - k.from) * gsap.parseEase(k.ease || 'power3.out')(SS.clamp01((t - k.at) / k.dur));
      const s = fmt(v);
      if (el.textContent !== s) el.textContent = s;
    });
  };

  // ---- Screen-space headlines ------------------------------------------------------------------
  // off-white veil behind a headline that sits over moving UI (validated in scene 2)
  SS.scrim = (parent, h = 680) => {
    const sc = SS.el('div', 'a3', parent);
    Object.assign(sc.style, { width: '1080px', height: h + 'px', background: 'linear-gradient(180deg, #F7FBFA 0%, #F7FBFA 66%, rgba(247,251,250,.85) 78%, rgba(247,251,250,0) 100%)' });
    return sc;
  };
  // a clip band so that words rolling in/out of a line never slide over the line above
  SS.band = (parent, top, h) => {
    const b = SS.el('div', 'a3', parent);
    Object.assign(b.style, { top: top + 'px', width: '1080px', height: h + 'px', overflow: 'hidden' });
    return b;
  };

  // ---- Small helpers ---------------------------------------------------------------------------
  SS.clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  SS.prog = (t, a, d, ease) => { const k = SS.clamp01((t - a) / d); return ease ? ease(k) : k; };
  // Speed blur is procedural, never tweened: a rewound GSAP filter would leave "blur(0px)" behind,
  // which renders text differently from "none" and breaks frame-order independence.
  SS.blur = (el, b) => { el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'; };
})();
