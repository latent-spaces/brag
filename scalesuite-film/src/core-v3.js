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
  // Camera keys are chained in build order: each move starts exactly where the previous one
  // ended (explicit fromTo), so x/y/s/r tweens never overlap or read live values.
  // (GSAP writes tween settings into the vars objects it receives, so every call gets fresh copies.)
  const KEYS = ['x', 'y', 's', 'r'];
  const pick = (o) => KEYS.reduce((a, k) => ((a[k] = o[k]), a), {});
  let camState = { x: 540, y: 960, s: 1, r: 0 };
  SS.camSet = (st) => { camState = pick(Object.assign({}, camState, st)); gsap.set(SS.cam, pick(camState)); };
  SS.camTo = (at, dur, ease, to) => {
    const end = pick(Object.assign({}, camState, to));
    SS.tl.fromTo(SS.cam, pick(camState), Object.assign(pick(end), { duration: dur, ease }), at);
    camState = end;
    return pick(end);
  };
  // blur / shake envelopes (separate properties from the camera path)
  SS.camFx = (at, dur, ease, from, to) => SS.tl.fromTo(SS.cam, from, Object.assign({ duration: dur, ease }, to), at);
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
    SS.world.style.transform = `translate(${(540 + k.ox).toFixed(2)}px,${(960 + k.oy).toFixed(2)}px) rotate(${k.r.toFixed(3)}deg) scale(${k.s.toFixed(4)}) translate(${(-k.x).toFixed(2)}px,${(-k.y).toFixed(2)}px)`;
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

  // ---- Small helpers ---------------------------------------------------------------------------
  SS.clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  SS.prog = (t, a, d, ease) => { const k = SS.clamp01((t - a) / d); return ease ? ease(k) : k; };
  // Speed blur is procedural, never tweened: a rewound GSAP filter would leave "blur(0px)" behind,
  // which renders text differently from "none" and breaks frame-order independence.
  SS.blur = (el, b) => { el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'; };
})();
