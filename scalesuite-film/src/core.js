/* ScaleSuite film — core helpers.
   Everything on screen is a pure function of time: scenes build their DOM once, then
   render(t) sets transforms/opacity from t alone. No CSS transitions or animations. */
(function () {
  const SS = (window.SS = window.SS || {});
  SS.scenes = SS.scenes || [];
  const q = new URLSearchParams(location.search);

  // ---- Format -----------------------------------------------------------------------------
  SS.F = q.get('format') === 'feed' ? 'feed' : 'vertical';
  SS.V = SS.F === 'vertical';
  SS.W = 1080;
  SS.H = SS.V ? 1920 : 1350;
  SS.CX = SS.W / 2;
  SS.pick = (vertical, feed) => (SS.V ? vertical : feed);

  // ---- Colour tokens (brand palette from the brief + scalesuiteqc.ca CSS) --------------------
  SS.C = {
    off: '#F7FBFA', mint: '#E8F9F7', mint2: '#D5F3EF', turq: '#2BBFB3', turqText: '#14A89B',
    turqDark: '#3FD3C6', green: '#1D9E75', ink: '#1A1A1A', ink2: '#2C2C2A', soft: '#5E6B69',
    faint: '#9AA7A4', dark: '#131615',
  };

  // ---- Maths / easing ---------------------------------------------------------------------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x, d = dx(t);
        if (Math.abs(e) < 1e-6) break;
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1;
      if (Math.abs(sx(t) - x) > 1e-4) {
        t = x;
        for (let i = 0; i < 30; i++) { const v = sx(t); if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      }
      return sy(t);
    };
  }
  const E = {
    linear: (t) => t,
    out: bezier(0.16, 1, 0.3, 1), // fast in, long premium settle
    outSoft: bezier(0.22, 1, 0.36, 1),
    outQuart: bezier(0.25, 1, 0.5, 1),
    inOut: bezier(0.65, 0, 0.35, 1),
    inOutSoft: bezier(0.45, 0, 0.25, 1),
    in: bezier(0.7, 0, 0.84, 0),
    inSoft: bezier(0.5, 0, 0.75, 0),
    sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  };
  // progress of t across [a,b], eased
  const p = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));
  // in/out envelope: 0 → 1 over [a, a+din], 1 → 0 over [b, b+dout]
  const env = (t, a, din, b, dout, ein = E.out, eout = E.inOut) =>
    Math.min(p(t, a, a + din, ein), 1 - p(t, b, b + dout, eout));
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  Object.assign(SS, { clamp, lerp, bezier, E, p, env, rng });

  // ---- DOM ---------------------------------------------------------------------------------
  const SVGNS = 'http://www.w3.org/2000/svg';
  SS.el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  SS.svg = (tag, attrs, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  // Place an absolutely positioned element by its centre.
  // o: {x, y, s, sx, sy, r, rx, ry, o (opacity), blur, ax, ay (anchor %, default 50)}
  SS.set = (e, o) => {
    const ax = o.ax == null ? 50 : o.ax, ay = o.ay == null ? 50 : o.ay;
    let tr = `translate3d(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px,0) translate(${-ax}%,${-ay}%)`;
    if (o.rx || o.ry) tr += ` rotateX(${(o.rx || 0).toFixed(3)}deg) rotateY(${(o.ry || 0).toFixed(3)}deg)`;
    if (o.r) tr += ` rotate(${o.r.toFixed(3)}deg)`;
    const sx = (o.s == null ? 1 : o.s) * (o.sx == null ? 1 : o.sx);
    const sy = (o.s == null ? 1 : o.s) * (o.sy == null ? 1 : o.sy);
    if (sx !== 1 || sy !== 1) tr += ` scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    e.style.transform = tr;
    const op = o.o == null ? 1 : clamp(o.o);
    e.style.opacity = op.toFixed(3);
    e.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
    e.style.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : 'none';
  };
  SS.show = (e, on) => { e.style.display = on ? '' : 'none'; };

  // ---- Text ----------------------------------------------------------------------------------
  // SS.text(parent, "Plus de *gestion.*", {size, weight, color, lh, tracking, align, maxW})
  // Lines split on "\n". Words wrapped in *…* get the accent colour; ~…~ get the dim colour.
  // Each word sits in its own overflow mask so it can rise/fall (masked kinetic type).
  SS.text = (parent, src, opt = {}) => {
    const o = Object.assign({ size: 100, weight: 800, color: SS.C.ink, accent: SS.C.turqText, dim: null,
      lh: 1.04, tracking: -0.04, align: 'center', maxW: 0, cls: '' }, opt);
    const root = SS.el('div', 'abs txt ' + o.cls, parent);
    Object.assign(root.style, { fontWeight: o.weight, color: o.color, lineHeight: o.lh,
      letterSpacing: o.tracking + 'em', textAlign: o.align, whiteSpace: 'nowrap' });
    const words = [];
    const lines = src.split('\n').map((ln) => {
      const line = SS.el('div', 'ln', root);
      ln.split(' ').forEach((w, i, arr) => {
        let color = null, tail = '';
        const mk = w.match(/^([*~])(.+)\1([.,?!…:]*)$/);
        if (mk) { color = mk[1] === '*' ? o.accent : o.dim; w = mk[2]; tail = mk[3]; }
        const m = SS.el('span', 'm', line);
        const inner = SS.el('span', 'w', m);
        inner.textContent = w.replace(/_/g, ' ');
        if (color) inner.style.color = color;
        if (tail) { const tl = SS.el('span', '', inner); tl.textContent = tail; tl.style.color = o.color; }
        words.push({ m, el: inner, text: w, line: line });
        if (i < arr.length - 1) line.appendChild(document.createTextNode(' '));
      });
      return line;
    });
    let size = o.size;
    root.style.fontSize = size + 'px';
    if (o.maxW) {
      const w = Math.max(...lines.map((l) => l.getBoundingClientRect().width));
      if (w > o.maxW) { size = Math.floor(size * o.maxW / w); root.style.fontSize = size + 'px'; }
    }
    const r = root.getBoundingClientRect();
    return { el: root, words, lines, size, w: r.width, h: r.height };
  };
  SS.HIDE = 150; // % offset that fully hides a word below/above its mask (mask padding included)
  // Masked word animation. inT: reveal start. outT: exit start (optional).
  // dir: 1 = rise from below / exit upward.
  SS.words = (T, t, a) => {
    const o = Object.assign({ inT: 0, outT: 1e9, st: 0.055, dur: 0.75, outSt: 0.03, outDur: 0.45, dir: 1,
      outDir: null, from: 0, ease: E.out, outEase: E.inSoft, blur: 0 }, a);
    const od = o.outDir == null ? o.dir : o.outDir;
    T.words.forEach((w, i) => {
      if (i < o.from) return;
      const k = i - o.from;
      const pi = p(t, o.inT + k * o.st, o.inT + k * o.st + o.dur, o.ease);
      const po = p(t, o.outT + k * o.outSt, o.outT + k * o.outSt + o.outDur, o.outEase);
      const y = (1 - pi) * SS.HIDE * o.dir - po * SS.HIDE * od;
      w.el.style.transform = `translateY(${y.toFixed(2)}%)`;
      w.el.style.opacity = (1 - po).toFixed(3);
      const b = o.blur * (1 - pi + po);
      w.el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    });
  };

  // ---- Odometer (vertical digit roll, tabular figures) --------------------------------------
  SS.odometer = (parent, digits = 2) => {
    const root = SS.el('span', 'odo', parent);
    const cols = [];
    for (let d = 0; d < digits; d++) {
      const win = SS.el('span', 'odo-win', root);
      const col = SS.el('span', 'odo-col', win);
      for (let n = 0; n <= 10; n++) SS.el('span', 'odo-d', col, String(n % 10));
      cols.push({ win, col });
    }
    return { root, cols };
  };

  // ---- Icons ---------------------------------------------------------------------------------
  SS.icon = {
    person: (fg = SS.C.green, bg = SS.C.mint) => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${bg}"/><circle cx="32" cy="25" r="10.5" fill="${fg}"/><path d="M12.5 53.5c2.6-10 10.4-15.5 19.5-15.5s16.9 5.5 19.5 15.5A31.8 31.8 0 0 1 32 64a31.8 31.8 0 0 1-19.5-10.5z" fill="${fg}"/></svg>`,
    target: (c = SS.C.green) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="${c}"/></svg>`,
    search: (c = SS.C.soft) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/></svg>`,
    pin: (c = SS.C.green) => `<svg viewBox="0 0 24 24"><path d="M12 2.5c-4 0-7 3-7 7 0 5.2 7 12 7 12s7-6.8 7-12c0-4-3-7-7-7z" fill="${c}"/><circle cx="12" cy="9.6" r="2.6" fill="#fff"/></svg>`,
    lock: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`,
    crm: (c = SS.C.green) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10.5" r="2.4"/><path d="M5.8 16.4c.7-1.8 1.9-2.7 3.2-2.7s2.5.9 3.2 2.7M14.5 9.5h4M14.5 13h3"/></svg>`,
    arrow: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/></svg>`,
    page: (c = SS.C.green) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.1" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M4 8h16M7.5 12h9M7.5 15.5h6"/></svg>`,
  };
  // Check circle whose stroke draws itself: returns {el, set(progress)}
  SS.check = (parent, size, color = SS.C.green, ring = true) => {
    const el = SS.el('span', 'chk', parent);
    el.style.width = el.style.height = size + 'px';
    const s = SS.svg('svg', { viewBox: '0 0 24 24' }, el);
    const c = SS.svg('circle', { cx: 12, cy: 12, r: 11, fill: color }, s);
    const path = SS.svg('path', { d: 'M7 12.4l3.3 3.3L17.2 8.6', fill: 'none', stroke: '#fff', 'stroke-width': 2.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 16, 'stroke-dashoffset': 16 }, s);
    return {
      el,
      set(k) {
        const a = clamp(k * 1.6), b = clamp(k * 1.6 - 0.45);
        c.setAttribute('transform', `translate(12 12) scale(${E.out(a).toFixed(3)}) translate(-12 -12)`);
        path.setAttribute('stroke-dashoffset', (16 * (1 - E.out(b))).toFixed(2));
      },
    };
  };

  // ---- Logo (vectorised public logo; per-letter wordmark) ------------------------------------
  let logoId = 0;
  SS.logo = (parent, h, opt = {}) => {
    const L = SS.LOGO, id = 'lg' + logoId++;
    const showWord = opt.word !== false;
    const vbW = showWord ? L.w : 118;
    const s = SS.svg('svg', { viewBox: `0 0 ${vbW} ${L.h}`, width: (h * vbW) / L.h, height: h, class: 'abs logo' }, parent);
    s.style.overflow = 'visible';
    const defs = SS.svg('defs', {}, s);
    const g = SS.svg('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [['0', '#1FBFA4'], ['.42', '#27B6C8'], ['.62', '#2FB0DE'], ['1', '#1FBCA6']].forEach(([o, c]) =>
      SS.svg('stop', { offset: o, 'stop-color': c }, g));
    // diagonal wipe for the mark
    const cp = SS.svg('clipPath', { id: id + 'c' }, defs);
    const wipe = SS.svg('rect', { x: -300, y: 0, width: 720, height: 600 }, cp);
    // clip for letters rising from the baseline
    const cpw = SS.svg('clipPath', { id: id + 'w' }, defs);
    SS.svg('rect', { x: 120, y: -40, width: L.w, height: L.h + 12 }, cpw);
    const markG = SS.svg('g', { 'clip-path': `url(#${id}c)` }, s);
    const markInner = SS.svg('g', {}, markG);
    SS.svg('path', { d: L.mark, fill: `url(#${id}g)`, 'fill-rule': 'evenodd' }, markInner);
    SS.svg('path', { d: L.shade, fill: '#16708F', 'fill-opacity': 0.5, 'fill-rule': 'evenodd' }, markInner);
    const sheen = SS.svg('rect', { x: -60, y: -20, width: 34, height: 220, fill: '#fff', 'fill-opacity': 0,
      transform: 'rotate(28 58 82)' }, markInner);
    const letters = [];
    if (showWord) {
      const wg = SS.svg('g', { 'clip-path': `url(#${id}w)` }, s);
      L.letters.forEach((l) => {
        const lg = SS.svg('g', {}, wg);
        SS.svg('path', { d: l.d, fill: l.word === 'scale' ? (opt.dark ? '#fff' : '#1E1E1E') : '#1FBFA8', 'fill-rule': 'evenodd' }, lg);
        letters.push(lg);
      });
    }
    return {
      el: s, w: (h * vbW) / L.h, h, letters,
      // k: 0..1 mark reveal (diagonal wipe from bottom-left)
      mark(k) {
        const top = lerp(300, -140, E.out(clamp(k)));
        wipe.setAttribute('transform', `rotate(-38 58 82) translate(0 ${top.toFixed(1)})`);
        markInner.setAttribute('transform', `translate(58 82) scale(${lerp(0.82, 1, E.out(clamp(k))).toFixed(4)}) translate(-58 -82)`);
      },
      sheen(k) {
        sheen.setAttribute('x', lerp(-80, 150, clamp(k)).toFixed(1));
        sheen.setAttribute('fill-opacity', (0.55 * Math.sin(Math.PI * clamp(k))).toFixed(3));
      },
      // per-letter rise, t relative progress with stagger
      word(t, t0, st = 0.035, dur = 0.6) {
        letters.forEach((lg, i) => {
          const k = p(t, t0 + i * st, t0 + i * st + dur, E.out);
          lg.setAttribute('transform', `translate(0 ${((1 - k) * 150).toFixed(2)})`);
        });
      },
    };
  };

  // ---- Background grain (static, deterministic) — dithers soft gradients against banding ----
  SS.grain = (w, h, alpha = 10) => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d'), im = x.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (r() * 255) | 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = alpha;
    }
    x.putImageData(im, 0, 0);
    return c.toDataURL();
  };
})();
