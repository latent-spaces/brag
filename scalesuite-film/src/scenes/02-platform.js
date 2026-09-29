/* S3 The reset (5.0–7.7): the node everything collapsed into grows the ScaleSuite mark; the
   wordmark rises; first calm moment.
   S4 Centralization (7.6–11.4): the lockup shrinks into the header of a central dashboard; five
   brokers connect to it with routing lines; pulses flow in; rows fill in. */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;
  const T = {
    node: 4.95, mark: 5.5, slide: 6.0, letters: 6.02, tagIn: 6.34, tagOut: 7.68,
    toHub: 7.64, hub: 7.78, h1: 7.86, brokers: 8.22, lines: 8.36, h1out: 9.86, h2: 10.12,
    pulses: 9.98, rows: 10.1, exit: 11.08, end: 11.5,
  };
  const LH = SS.pick(176, 150); // lockup height
  const LY = SS.pick(930, 690); // lockup centre y
  const LW = (LH * SS.LOGO.w) / SS.LOGO.h;
  const markOff = -LW / 2 + 58 * (LH / SS.LOGO.h); // mark centre relative to lockup centre
  const HUB = SS.pick({ x: 540, y: 1045, w: 600, h: 440, head: 88, row0: 132, rowH: 62, font: 23 },
    { x: 540, y: 800, w: 560, h: 360, head: 76, row0: 116, rowH: 50, font: 21 });
  HUB.top = HUB.y - HUB.h / 2; HUB.left = HUB.x - HUB.w / 2;
  const HS = SS.pick(46, 40) / LH; // logo scale inside hub header
  const BROKERS = SS.pick(
    [{ x: 180, y: 672, ax: 330, side: 'top' }, { x: 540, y: 646, ax: 540, side: 'top' }, { x: 900, y: 672, ax: 750, side: 'top' },
      { x: 300, y: 1418, ax: 400, side: 'bot' }, { x: 780, y: 1418, ax: 680, side: 'bot' }],
    [{ x: 180, y: 470, ax: 350, side: 'top' }, { x: 540, y: 448, ax: 540, side: 'top' }, { x: 900, y: 470, ax: 730, side: 'top' },
      { x: 300, y: 1138, ax: 410, side: 'bot' }, { x: 780, y: 1138, ax: 670, side: 'bot' }]
  );
  const PILL = SS.pick({ h: 78, av: 56, font: 26 }, { h: 70, av: 50, font: 23 });
  const HEAD = SS.pick({ y1: 286, y2: 398, size: 100, maxW: 930 }, { y1: 136, y2: 232, size: 86, maxW: 960 });
  const TYPES = ['Vendeur', 'Acheteur', 'Vendeur', 'Acheteur', 'Vendeur'];
  SS.HUB = HUB;
  SS.hubRow = (k) => ({ x: HUB.x, y: HUB.top + HUB.row0 + k * HUB.rowH, w: HUB.w - 44, h: HUB.rowH - 10 });

  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const lines = SS.svg('svg', { class: 'lines', width: SS.W, height: SS.H }, root);
    // node + pulse ring
    const ring = SS.el('div', 'abs', root);
    Object.assign(ring.style, { width: '120px', height: '120px', borderRadius: '50%', border: `3px solid ${SS.C.turq}` });
    const node = SS.el('div', 'abs node', root);
    // hub card
    const hub = SS.el('div', 'abs card', root);
    Object.assign(hub.style, { width: HUB.w + 'px', height: HUB.h + 'px', borderRadius: '30px' });
    const hubHalo = SS.el('div', '', hub);
    Object.assign(hubHalo.style, { position: 'absolute', inset: '-2px', borderRadius: '32px', boxShadow: `0 0 0 3px ${SS.C.turq}, 0 0 60px 6px rgba(43,191,179,.35)`, opacity: 0 });
    const hubLabel = SS.el('div', '', hub, 'Tableau de bord · Équipe');
    Object.assign(hubLabel.style, { position: 'absolute', right: '28px', top: (HUB.head / 2 - 13) + 'px', fontSize: SS.pick(20, 18) + 'px', fontWeight: 600, color: SS.C.soft });
    const hubDiv = SS.el('div', '', hub);
    Object.assign(hubDiv.style, { position: 'absolute', left: '22px', right: '22px', top: HUB.head + 'px', height: '2px', background: '#EDF3F2' });
    const rows = [];
    for (let k = 0; k < 5; k++) {
      const r = SS.hubRow(k);
      const row = SS.el('div', '', hub);
      Object.assign(row.style, { position: 'absolute', left: '22px', width: r.w + 'px', height: r.h + 'px', top: (r.y - HUB.top - r.h / 2) + 'px', borderRadius: '14px', background: k % 2 ? '#fff' : '#F6FBFA' });
      const sk = SS.el('div', '', row);
      Object.assign(sk.style, { position: 'absolute', inset: 0 });
      sk.innerHTML = `<div class="skel" style="position:absolute;left:14px;top:${(r.h - 30) / 2}px;width:30px;height:30px;border-radius:50%"></div>
        <div class="skel" style="position:absolute;left:58px;top:${r.h / 2 - 7}px;width:${r.w * 0.34}px;height:14px"></div>
        <div class="skel" style="position:absolute;right:16px;top:${r.h / 2 - 7}px;width:${r.w * 0.2}px;height:14px"></div>`;
      const real = SS.el('div', '', row);
      Object.assign(real.style, { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 14px', fontSize: HUB.font + 'px', fontWeight: 650, letterSpacing: '-.015em' });
      real.innerHTML = `<span class="avatar" style="width:${r.h - 16}px;height:${r.h - 16}px;flex:none">${SS.icon.person()}</span>
        <span style="flex:none">Courtier ${String(k + 1).padStart(2, '0')}</span>
        <span class="chip mint" style="font-size:.74em;padding:.32em .7em;box-shadow:none;background:#E8F9F7">${TYPES[k]}</span>
        <span style="margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.8em;font-weight:650;color:${SS.C.green}"><span style="width:10px;height:10px;border-radius:50%;background:${SS.C.green}"></span>Active</span>`;
      rows.push({ row, sk, real });
    }
    // brokers
    const brokers = BROKERS.map((b, i) => {
      const el = SS.el('div', 'abs chip', root);
      Object.assign(el.style, { fontSize: PILL.font + 'px', height: PILL.h + 'px', padding: `0 26px 0 ${(PILL.h - PILL.av) / 2}px`, gap: '14px', fontWeight: 720 });
      el.innerHTML = `<span class="avatar" style="width:${PILL.av}px;height:${PILL.av}px">${SS.icon.person()}</span><span>Courtier ${String(i + 1).padStart(2, '0')}</span>`;
      const w = el.getBoundingClientRect().width;
      const path = SS.svg('path', { fill: 'none', stroke: SS.C.turq, 'stroke-width': 3, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, lines);
      const anchor = SS.svg('circle', { r: 7, fill: SS.C.green }, lines);
      const pulse = SS.svg('circle', { r: 9, fill: SS.C.turq }, lines);
      const pulseHalo = SS.svg('circle', { r: 22, fill: SS.C.turq, 'fill-opacity': 0.22 }, lines);
      return Object.assign({ el, w, path, anchor, pulse, pulseHalo }, b);
    });
    // logo lockup (moves into the hub header)
    const logo = SS.logo(root, LH);
    // tagline + headlines
    const tag = SS.text(root, "Google Ads pour l'immobilier québécois.", { size: SS.pick(46, 40), weight: 560, color: SS.C.soft, tracking: -0.015, maxW: 900 });
    const h1 = SS.text(root, 'Toute votre équipe\nsur *Google_Ads*.', { size: HEAD.size, maxW: HEAD.maxW, lh: 1.1 });
    const h2 = SS.text(root, 'Une seule\nstructure.', { size: HEAD.size, maxW: HEAD.maxW, lh: 1.1 });
    R = { root, lines, ring, node, hub, hubHalo, hubLabel, hubDiv, rows, brokers, logo, tag, h1, h2 };
  }

  const bez = (a, b) => `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${a.x.toFixed(1)},${lerp(a.y, b.y, 0.55).toFixed(1)} ${b.x.toFixed(1)},${lerp(a.y, b.y, 0.45).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  function cubicAt(a, b, u) {
    const c1 = { x: a.x, y: lerp(a.y, b.y, 0.55) }, c2 = { x: b.x, y: lerp(a.y, b.y, 0.45) };
    const m = 1 - u;
    return { x: m * m * m * a.x + 3 * m * m * u * c1.x + 3 * m * u * u * c2.x + u * u * u * b.x,
      y: m * m * m * a.y + 3 * m * m * u * c1.y + 3 * m * u * u * c2.y + u * u * u * b.y };
  }

  function render(t) {
    const C = SS.NODE;
    // ---------- node (collapse target) → becomes the mark
    const kn = p(t, T.node, T.node + 0.3, E.out);
    const grow = p(t, 5.15, 5.5, E.inOut);
    const toMark = p(t, 5.3, 5.62, E.inOut);
    const nodeFade = 1 - p(t, 5.58, 5.72, E.linear);
    SS.set(R.node, { x: lerp(C.x, 540, toMark), y: lerp(C.y, LY, toMark), s: kn * lerp(1, 2.2, grow), o: nodeFade });
    const kr = p(t, 5.4, 6.1, E.outSoft);
    SS.set(R.ring, { x: C.x, y: C.y, s: lerp(0.2, 3.2, kr), o: (1 - kr) * (t > 5.4 ? 0.8 : 0) });

    // ---------- logo: reveal centred on the mark, slide to lockup, then shrink into hub header
    const slide = p(t, T.slide, T.slide + 0.55, E.inOut);
    let lx = lerp(540 - markOff, 540, slide), ly = LY, ls = 1, lo = t >= T.mark ? 1 : 0;
    const kh = p(t, T.toHub, T.toHub + 0.62, E.inOut);
    const hx = HUB.left + 30 + (LW * HS) / 2, hy = HUB.top + HUB.head / 2;
    lx = lerp(lx, hx, kh); ly = lerp(ly, hy, kh); ls = lerp(1, HS, kh);
    const kx = p(t, T.exit, T.exit + 0.3, E.in);
    SS.set(R.logo.el, { x: lx, y: ly, s: ls * lerp(1, 0.94, kx), o: lo * (1 - kx) });
    R.logo.mark(p(t, T.mark, T.mark + 0.62, E.linear));
    R.logo.sheen(p(t, 6.45, 7.15, E.inOutSoft));
    R.logo.word(t, T.letters, 0.034, 0.62);

    SS.set(R.tag.el, { x: 540, y: LY + LH / 2 + SS.pick(78, 64) });
    SS.words(R.tag, t, { inT: T.tagIn, st: 0.045, dur: 0.7, outT: T.tagOut, outSt: 0.015, outDur: 0.35, outDir: -1 });
    R.tag.el.style.letterSpacing = (lerp(0.04, -0.015, p(t, T.tagIn, T.tagIn + 1.0, E.out))).toFixed(4) + 'em';

    // ---------- hub
    const kHub = p(t, T.hub, T.hub + 0.6, E.out);
    const push = lerp(1, 1.025, p(t, 8.2, 11.1, E.inOutSoft));
    const hubExit = p(t, T.exit, T.exit + 0.34, E.in);
    SS.set(R.hub, { x: HUB.x, y: HUB.y + (1 - kHub) * 36, s: lerp(0.94, 1, kHub) * push * lerp(1, 0.94, hubExit), o: kHub * (1 - hubExit) });
    R.hubLabel.style.opacity = p(t, T.hub + 0.35, T.hub + 0.8, E.out).toFixed(3);
    R.hubDiv.style.transform = `scaleX(${p(t, T.hub + 0.2, T.hub + 0.9, E.out).toFixed(3)})`;
    R.hubDiv.style.transformOrigin = 'left';
    R.rows.forEach((r, k) => {
      const ks = p(t, T.hub + 0.3 + k * 0.05, T.hub + 0.7 + k * 0.05, E.out);
      const kr2 = p(t, T.rows + k * 0.09, T.rows + k * 0.09 + 0.45, E.out);
      r.row.style.opacity = ks.toFixed(3);
      r.sk.style.opacity = (1 - kr2).toFixed(3);
      r.real.style.opacity = kr2.toFixed(3);
      r.real.style.transform = `translateY(${((1 - kr2) * 10).toFixed(2)}px)`;
      if (k === 0) r.row.style.visibility = t > T.exit + 0.02 ? 'hidden' : 'visible'; // row 0 lifts out (S5)
    });
    const glowK = R.brokers.reduce((m, b, i) => Math.max(m, Math.sin(Math.PI * p(t, T.pulses + i * 0.07 + 0.42, T.pulses + i * 0.07 + 0.95, E.linear))), 0);
    R.hubHalo.style.opacity = (glowK * 0.8).toFixed(3);

    // ---------- brokers + routing lines + pulses
    R.brokers.forEach((b, i) => {
      const kb = p(t, T.brokers + i * 0.09, T.brokers + i * 0.09 + 0.55, E.out);
      const out = p(t, T.exit - 0.02, T.exit + 0.3, E.in);
      const dirx = b.x - HUB.x, diry = b.y - HUB.y;
      const bx = HUB.x + (b.x - HUB.x) * push + dirx * 0.35 * out, by = HUB.y + (b.y - HUB.y) * push + diry * 0.35 * out;
      SS.set(b.el, { x: bx, y: by + (1 - kb) * 24, s: lerp(0.7, 1, kb), o: Math.min(kb * 1.5, 1 - out), blur: (1 - kb) * 5 + out * 6 });
      const a = { x: bx, y: by + (b.side === 'top' ? PILL.h / 2 : -PILL.h / 2) };
      const hbY = b.side === 'top' ? HUB.y - (HUB.h / 2) * push * lerp(0.94, 1, kHub) : HUB.y + (HUB.h / 2) * push * lerp(0.94, 1, kHub);
      const hb = { x: HUB.x + (b.ax - HUB.x) * push, y: hbY + (1 - kHub) * 36 };
      b.path.setAttribute('d', bez(a, hb));
      const kl = p(t, T.lines + i * 0.08, T.lines + i * 0.08 + 0.6, E.outSoft);
      b.path.setAttribute('stroke-dashoffset', (1 - kl).toFixed(4));
      b.path.setAttribute('stroke-opacity', (0.9 * (1 - out)).toFixed(3));
      b.anchor.setAttribute('cx', hb.x.toFixed(1)); b.anchor.setAttribute('cy', hb.y.toFixed(1));
      b.anchor.setAttribute('r', (7 * p(t, T.lines + i * 0.08 + 0.4, T.lines + i * 0.08 + 0.7, E.out) * (1 - out)).toFixed(2));
      // pulse travelling broker → hub
      const u = p(t, T.pulses + i * 0.07, T.pulses + i * 0.07 + 0.55, E.inOutSoft);
      const on = u > 0 && u < 1 ? 1 : 0;
      const pt = cubicAt(a, hb, u);
      [b.pulse, b.pulseHalo].forEach((c) => { c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.setAttribute('opacity', on); });
    });

    // ---------- headlines
    SS.set(R.h1.el, { x: 540, y: (HEAD.y1 + HEAD.y2) / 2 });
    SS.words(R.h1, t, { inT: T.h1, st: 0.05, outT: T.h1out - 0.06, outSt: 0.015, outDur: 0.3 });
    SS.set(R.h2.el, { x: 540, y: (HEAD.y1 + HEAD.y2) / 2 });
    SS.words(R.h2, t, { inT: T.h2, st: 0.07, outT: T.exit - 0.1, outSt: 0.02, outDur: 0.32 });
  }

  SS.scenes.push({ name: 'platform', a: 4.9, b: T.end, build, render });
})();
