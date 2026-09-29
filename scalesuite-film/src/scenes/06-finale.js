/* S8 Thesis (21.3–24.2): the lead's route line flies to centre and becomes the divider between
   "Plus de campagnes." and "Pas plus de gestion." — a calm, ordered grid of campaign nodes
   answers S2's chaos. "Pas" drops in front of S2's "plus de gestion" as a typographic callback.
   S9 CTA (23.9–27.5): the nodes align on the line, converge into one, and the node grows the
   ScaleSuite mark; wordmark, promise, one action, URL. */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;
  const T = { line0: 21.3, line1: 21.56, spread: 21.52, l12: 21.62, l3: 22.24, l4: 22.34, pas: 22.56, dots: 21.7,
    out: 23.92, align: 24.0, merge: 24.44, mark: 24.72, letters: 24.9, tag: 25.08, cta: 25.18, url: 25.36, end: 27.6 };
  const G = SS.pick({ cy: 930, size: 118, ys: [690, 810, 1050, 1170], x0: 150, x1: 930,
    dotsY: [[150, 560], [1300, 1760]], LH: 196, LY: 730, tagY: 922, tagSize: 44, cta: { y: 1096, w: 700, h: 136, size: 50 }, urlY: 1258, urlSize: 40 },
  { cy: 672, size: 100, ys: [470, 572, 772, 874], x0: 150, x1: 930,
    dotsY: [[80, 380], [965, 1275]], LH: 164, LY: 486, tagY: 650, tagSize: 40, cta: { y: 808, w: 640, h: 120, size: 45 }, urlY: 950, urlSize: 36 });
  const LW = (G.LH * SS.LOGO.w) / SS.LOGO.h;
  const markX = 540 - LW / 2 + 58 * (G.LH / SS.LOGO.h);

  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const svg = SS.svg('svg', { class: 'lines', width: SS.W, height: SS.H }, root);
    // campaign node grid
    const dots = [];
    const rnd = SS.rng(9);
    G.dotsY.forEach(([y0, y1]) => {
      for (let y = y0; y <= y1; y += 64) for (let x = 92; x <= 988; x += 64) {
        const c = SS.svg('circle', { cx: x, cy: y, r: 5.5, fill: rnd() < 0.18 ? SS.C.green : SS.C.turq }, svg);
        dots.push({ c, x, y, d: Math.hypot(x - 540, y - G.cy) });
      }
    });
    dots.sort((a, b) => a.x - b.x || a.y - b.y);
    dots.forEach((d, i) => { d.tx = lerp(G.x0 + 10, G.x1 - 10, i / (dots.length - 1)); });
    const line = SS.svg('line', { stroke: SS.C.turq, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
    const endA = SS.svg('circle', { r: 8, fill: SS.C.green }, svg);
    const endB = SS.svg('circle', { r: 8, fill: SS.C.green }, svg);
    const lead = SS.svg('circle', { r: 11, fill: SS.C.turq }, svg);
    // thesis lines
    const opt = { size: G.size, maxW: 940 };
    const l1 = SS.text(root, 'Plus de', opt), l2 = SS.text(root, 'campagnes.', opt);
    const l3 = SS.text(root, '*Pas* plus de', opt), l4 = SS.text(root, 'gestion.', opt);
    const pasW = l3.words[0].m.getBoundingClientRect().width + G.size * 0.26;
    // end lockup
    const logo = SS.logo(root, G.LH);
    const tag = SS.text(root, 'Google Ads pour les équipes immobilières.', { size: G.tagSize, weight: 560, color: SS.C.soft, tracking: -0.015, maxW: 900 });
    const cta = SS.el('div', 'abs', root);
    Object.assign(cta.style, { height: G.cta.h + 'px', borderRadius: G.cta.h / 2 + 'px', overflow: 'hidden',
      background: 'linear-gradient(135deg,#2BBFB3 0%,#1D9E75 100%)', boxShadow: '0 22px 44px -18px rgba(29,158,117,.65), inset 0 1px 0 rgba(255,255,255,.25)' });
    const ctaIn = SS.el('div', '', cta);
    Object.assign(ctaIn.style, { position: 'absolute', left: 0, top: 0, width: G.cta.w + 'px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', color: '#fff', fontSize: G.cta.size + 'px', fontWeight: 760, letterSpacing: '-.02em' });
    const ctaTxt = SS.el('span', 'm', ctaIn);
    const ctaW = SS.el('span', 'w', ctaTxt, 'Demander une démo');
    const arrow = SS.el('span', 'ico', ctaIn, SS.icon.arrow('#fff'));
    Object.assign(arrow.style, { width: G.cta.size * 0.95 + 'px', height: G.cta.size * 0.95 + 'px' });
    arrow.querySelector('svg').style.width = arrow.querySelector('svg').style.height = '100%';
    const sheen = SS.el('div', '', cta);
    Object.assign(sheen.style, { position: 'absolute', top: '-20%', width: '90px', height: '140%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))', transform: 'skewX(-18deg)' });
    const url = SS.text(root, 'scalesuiteqc.ca', { size: G.urlSize, weight: 650, color: SS.C.ink2, tracking: -0.01 });
    R = { root, svg, dots, line, endA, endB, lead, l1, l2, l3, l4, pasW, logo, tag, cta, ctaIn, ctaW, arrow, sheen, url };
  }

  const at = (c, x, y, r, o) => { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', Math.max(0, r).toFixed(2)); c.setAttribute('opacity', clamp(o).toFixed(3)); };

  function render(t) {
    // ---- the lead dot flies from the CRM to centre, then the line spreads into the divider
    const crm = SS.LEAD ? { x: SS.LEAD.crm.x, y: SS.LEAD.crm.y + SS.LEAD.cam } : { x: 540, y: G.cy };
    const kf = p(t, T.line0, T.line1, E.inOut);
    const cx = lerp(crm.x, 540, kf), cy = lerp(crm.y, G.cy, kf) - Math.sin(Math.PI * kf) * 60;
    const ks = p(t, T.spread, T.spread + 0.5, E.out);
    // S9: line shrinks toward the mark as everything merges
    const km = p(t, T.merge, T.merge + 0.34, E.in);
    let xa = lerp(cx, G.x0, ks), xb = lerp(cx, G.x1, ks);
    xa = lerp(xa, markX, km); xb = lerp(xb, markX, km);
    const ly = lerp(cy, G.LY, km);
    const lineOn = t >= T.line0 ? 1 : 0;
    R.line.setAttribute('x1', xa.toFixed(1)); R.line.setAttribute('x2', xb.toFixed(1));
    R.line.setAttribute('y1', ly.toFixed(1)); R.line.setAttribute('y2', ly.toFixed(1));
    R.line.setAttribute('opacity', (lineOn * (ks > 0 ? 1 : 0) * (1 - p(t, T.merge + 0.26, T.merge + 0.34, E.linear))).toFixed(3));
    const endK = p(t, T.spread + 0.2, T.spread + 0.5, E.out) * (1 - km);
    at(R.endA, xa, ly, 8 * endK, endK); at(R.endB, xb, ly, 8 * endK, endK);
    at(R.lead, cx, cy, 11 * (1 - ks), t >= T.line0 && ks < 1 ? 1 : 0);

    // ---- node grid: ripple in, align onto the line, converge into the mark
    const ka = (d) => p(t, T.align + d, T.align + d + 0.42, E.inOut);
    R.dots.forEach((d, i) => {
      const kin = p(t, T.dots + d.d / 1800, T.dots + d.d / 1800 + 0.5, E.out);
      const dl = (Math.abs(d.y - G.cy) / 1200) * 0.12;
      const a = ka(dl);
      let x = lerp(d.x, d.tx, a), y = lerp(d.y, G.cy, a);
      const mk = p(t, T.merge + (Math.abs(d.tx - markX) / 800) * 0.12, T.merge + 0.3 + (Math.abs(d.tx - markX) / 800) * 0.12, E.in);
      x = lerp(x, markX, mk); y = lerp(y, G.LY, mk);
      const o = kin * lerp(0.3, 1, a) * (1 - mk);
      at(d.c, x, y, lerp(5.5 * kin, 4.2, a) * lerp(1, 0.6, mk), o);
    });

    // ---- thesis type
    const SPL = 0.03;
    [R.l1, R.l2].forEach((L, i) => { SS.set(L.el, { x: 540, y: G.ys[i] }); SS.words(L, t, { inT: T.l12 + i * 0.12, st: 0.07, outT: T.out + (1 - i) * SPL, outDur: 0.4 }); });
    // line 3: "plus de" rises centred, then "Pas" drops in and the line re-centres
    const kp = p(t, T.pas, T.pas + 0.55, E.out);
    SS.set(R.l3.el, { x: 540 - (R.pasW / 2) * (1 - E.inOut(p(t, T.pas - 0.05, T.pas + 0.45, E.linear))), y: G.ys[2] });
    SS.words(R.l3, t, { inT: T.l3, from: 1, st: 0.07, outT: T.out + SPL, outDur: 0.4, outDir: -1 });
    const w0 = R.l3.words[0].el;
    const outP = p(t, T.out + SPL, T.out + SPL + 0.4, E.in);
    w0.style.transform = `translateY(${((-(1 - kp) * SS.HIDE) + outP * SS.HIDE).toFixed(2)}%)`;
    w0.style.opacity = (1 - outP).toFixed(3);
    SS.set(R.l4.el, { x: 540, y: G.ys[3] });
    SS.words(R.l4, t, { inT: T.l4, outT: T.out + 2 * SPL, outDur: 0.4, outDir: -1 });

    // ---- end lockup
    const lo = t >= T.mark ? 1 : 0;
    const drift = lerp(1, 1.012, p(t, 25.6, 27.5, E.inOutSoft));
    SS.set(R.logo.el, { x: 540, y: G.LY, s: drift, o: lo });
    R.logo.mark(p(t, T.mark, T.mark + 0.6, E.linear));
    R.logo.word(t, T.letters, 0.032, 0.6);
    R.logo.sheen(p(t, 25.7, 26.4, E.inOutSoft));
    SS.set(R.tag.el, { x: 540, y: G.tagY });
    SS.words(R.tag, t, { inT: T.tag, st: 0.035, dur: 0.65 });
    // CTA: a node that expands into the button (Motif C), then the label rises
    const kc = p(t, T.cta, T.cta + 0.55, E.out);
    const cw = lerp(G.cta.h, G.cta.w, kc);
    R.cta.style.width = cw.toFixed(1) + 'px';
    R.ctaIn.style.left = ((cw - G.cta.w) / 2).toFixed(1) + 'px';
    SS.set(R.cta, { x: 540, y: G.cta.y, s: lerp(0.4, 1, p(t, T.cta, T.cta + 0.3, E.out)) * drift, o: t >= T.cta ? 1 : 0 });
    const kt = p(t, T.cta + 0.2, T.cta + 0.8, E.out);
    R.ctaW.style.transform = `translateY(${((1 - kt) * SS.HIDE).toFixed(2)}%)`;
    const nudge = Math.sin(Math.PI * p(t, 26.2, 26.75, E.inOut));
    R.arrow.style.transform = `translateX(${((1 - p(t, T.cta + 0.35, T.cta + 0.85, E.out)) * -24 + nudge * 9).toFixed(2)}px)`;
    R.arrow.style.opacity = p(t, T.cta + 0.35, T.cta + 0.7, E.out).toFixed(3);
    const sh = p(t, 26.45, 27.05, E.inOutSoft);
    R.sheen.style.left = lerp(-120, G.cta.w + 40, sh).toFixed(1) + 'px';
    R.sheen.style.opacity = sh > 0 && sh < 1 ? 1 : 0;
    SS.set(R.url.el, { x: 540, y: G.urlY });
    SS.words(R.url, t, { inT: T.url, dur: 0.6 });
  }

  SS.scenes.push({ name: 'finale', a: 21.28, b: T.end, build, render });
})();
