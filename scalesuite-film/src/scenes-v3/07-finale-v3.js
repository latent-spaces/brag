/* Scenes 9–10 · Thesis and call to action (25.0–31.0 s), screen space.
   9: the notification has thinned into the divider. "Plus de campagnes." above it, "Pas plus de
      gestion." below ("Pas" drops in front, a callback to scene 2). A calm grid of campaign nodes
      ripples in: order, where scene 2 had a pile.
   10: the nodes align on the line, everything converges into one node that grows the ScaleSuite
      mark; the wordmark rises, the tagline, then the button grows out of a node (≈ 10 % overshoot),
      and the URL. Everything is settled by ≈ 29.0 s and held to the end. */
(function () {
  const SS = window.SS;
  const T = { line: 25.05, ends: 25.1, l1: 25.12, l2: 25.2, l3: 25.4, l4: 25.5, pas: 25.72, dots: 25.15, out: 26.9, align: 27.0, merge: 27.42,
    mark: 27.7, letters: 27.88, tag: 28.04, cta: 28.12, url: 28.3, sheen: 29.45, nudge: 30.1, end: 31.0 };
  const G = { cy: SS.LINE.y, size: 118, ys: [690, 810, 1050, 1170], x0: 150, x1: 930, dotsY: [[150, 560], [1300, 1760]],
    LH: 196, LY: 730, tagY: 922, cta: { y: 1096, w: 700, h: 136, size: 50 }, urlY: 1258 };
  const LW = (G.LH * SS.LOGO.w) / SS.LOGO.h;
  const markX = 540 - LW / 2 + 58 * (G.LH / SS.LOGO.h);
  const clip = (t, r, b, l, rad) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;

  let R;
  function build(stage) {
    const layer = SS.el('div', 'layer', stage);
    const svg = SS.svg('svg', { class: 'lines', width: SS.W, height: SS.H }, layer);
    const dots = [];
    const rnd = SS.rng(9);
    G.dotsY.forEach(([y0, y1]) => {
      for (let y = y0; y <= y1; y += 64) for (let x = 92; x <= 988; x += 64) {
        const c = SS.svg('circle', { cx: x, cy: y, r: 0, fill: rnd() < 0.18 ? SS.C.green : SS.C.turq }, svg);
        dots.push({ c, x, y, d: Math.hypot(x - 540, y - G.cy) });
      }
    });
    dots.sort((a, b) => a.x - b.x || a.y - b.y);
    dots.forEach((d, i) => { d.tx = 160 + ((G.x1 - G.x0 - 20) * i) / (dots.length - 1); });
    // the divider (takes over from the notification at 25.05, identical)
    const line = SS.el('div', 'a3', layer);
    Object.assign(line.style, { width: SS.LINE.w + 'px', height: '6px', borderRadius: '3px', background: SS.C.turq });
    SS.place(line, 540, G.cy, { autoAlpha: 0 });
    SS.tl.set(line, { autoAlpha: 1 }, T.line);
    const ends = [G.x0, G.x1].map((x) => {
      const e = SS.el('div', 'a3', layer);
      Object.assign(e.style, { width: '18px', height: '18px', borderRadius: '50%', background: SS.C.green, boxShadow: '0 0 0 6px rgba(43,191,179,.2)' });
      SS.place(e, x, G.cy, { scale: 0 });
      SS.tl.fromTo(e, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, T.ends);
      return e;
    });
    // thesis type
    const opt = { size: G.size, maxW: 940 };
    const l1 = SS.text(layer, 'Plus de', opt), l2 = SS.text(layer, 'campagnes.', opt);
    const l3 = SS.text(layer, '*Pas* plus de', opt), l4 = SS.text(layer, 'gestion.', opt);
    const pasW = l3.words[0].m.getBoundingClientRect().width + G.size * 0.26;
    [l1, l2, l4].forEach((L, i) => { SS.place(L.el, 540, G.ys[[0, 1, 3][i]]); SS.hideWords(L); });
    SS.place(l3.el, 540 - pasW / 2, G.ys[2]);
    SS.hideWords(l3);
    SS.wordsIn(l1, T.l1, { st: 0.07 }); SS.wordsIn(l2, T.l2);
    SS.wordsIn(l3, T.l3, { from: 1, st: 0.07 }); SS.wordsIn(l4, T.l4);
    // "Pas" drops in from above, in front of "plus de gestion", and the line re-centres
    SS.tl.fromTo(l3.words[0].el, { yPercent: -SS.HIDE }, { yPercent: 0, duration: 0.5, ease: SS.EZ.pop }, T.pas);
    SS.tl.fromTo(l3.el, { x: 540 - pasW / 2 }, { x: 540, duration: 0.5, ease: SS.EZ.inOut }, T.pas - 0.05);
    SS.cue(T.pas, 'pas'); SS.cue(T.l1, 'thesis');
    [l1, l2, l3, l4].forEach((L, i) => SS.wordsOut(L, T.out + i * 0.03, { dur: 0.36, dir: i < 2 ? 1 : -1 }));
    // the line contracts into the node that becomes the mark
    SS.tl.fromTo(line, { x: 540, y: G.cy, scaleX: 1 }, { x: markX, y: G.LY, scaleX: 0.008, duration: 0.34, ease: SS.EZ.in }, T.merge);
    SS.tl.fromTo(line, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.06, ease: 'none' }, T.merge + 0.3);
    ends.forEach((e, i) => SS.tl.fromTo(e, { x: [G.x0, G.x1][i], y: G.cy, scale: 1 }, { x: markX, y: G.LY, scale: 0, duration: 0.34, ease: SS.EZ.in }, T.merge));
    const node = SS.el('div', 'a3', layer);
    Object.assign(node.style, { width: '26px', height: '26px', borderRadius: '50%', background: SS.C.green, boxShadow: '0 0 0 9px rgba(43,191,179,.2)' });
    SS.place(node, markX, G.LY, { scale: 0 });
    SS.tl.fromTo(node, { scale: 0 }, { scale: 2.6, duration: 0.3, ease: SS.EZ.out }, T.merge + 0.28);
    SS.tl.fromTo(node, { scale: 2.6 }, { scale: 0, duration: 0.28, ease: SS.EZ.in }, T.mark + 0.08);
    SS.cue(T.merge, 'merge');

    // lockup
    const logo = SS.logo(layer, G.LH);
    SS.place(logo.el, 540, G.LY);
    gsap.set(logo.letters, { y: 150 });
    const P = { mark: 0, sheen: 0 };
    SS.tl.fromTo(P, { mark: 0 }, { mark: 1, duration: 0.66, ease: 'none' }, T.mark); // logo.mark() eases internally
    SS.tl.fromTo(logo.letters, { y: 150 }, { y: 0, duration: 0.6, stagger: 0.03, ease: SS.EZ.out }, T.letters);
    SS.tl.fromTo(P, { sheen: 0 }, { sheen: 1, duration: 0.7, ease: 'sine.inOut' }, T.sheen - 0.3);
    SS.cue(T.mark, 'mark2'); SS.cue(T.letters, 'letters2');
    const tag = SS.text(layer, 'Google Ads pour les équipes immobilières.', { size: 44, weight: 560, color: SS.C.soft, tracking: -0.015, maxW: 900 });
    SS.place(tag.el, 540, G.tagY);
    SS.hideWords(tag);
    SS.wordsIn(tag, T.tag, { st: 0.035, dur: 0.65 });
    // CTA: a node that grows into the button
    const cta = SS.el('div', 'a3', layer);
    Object.assign(cta.style, { width: G.cta.w + 'px', height: G.cta.h + 'px', borderRadius: G.cta.h / 2 + 'px', overflow: 'hidden',
      background: 'linear-gradient(135deg,#2BBFB3 0%,#1D9E75 100%)', boxShadow: '0 22px 44px -18px rgba(29,158,117,.65), inset 0 1px 0 rgba(255,255,255,.25)' });
    cta.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;color:#fff;font-size:${G.cta.size}px;font-weight:760;letter-spacing:-.02em">
        <span class="m" style="display:inline-block;overflow:hidden;padding:.16em .06em .22em;margin:-.16em -.06em -.22em"><span class="w" style="display:inline-block">Demander une démo</span></span>
        <span class="ar" style="width:${G.cta.size * 0.95}px;height:${G.cta.size * 0.95}px;display:block">${SS.icon.arrow('#fff')}</span></div>
      <div class="sh" style="position:absolute;top:-20%;left:-140px;width:90px;height:140%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.45),rgba(255,255,255,0));transform:skewX(-18deg)"></div>`;
    const cw = cta.querySelector('.w'), ar = cta.querySelector('.ar'), sh = cta.querySelector('.sh');
    const side = (G.cta.w - G.cta.h) / 2;
    SS.place(cta, 540, G.cta.y, { autoAlpha: 0, scale: 0.4, clipPath: clip(0, side, 0, side, G.cta.h / 2) });
    gsap.set(cw, { yPercent: SS.HIDE }); gsap.set(ar, { x: -26, autoAlpha: 0 }); gsap.set(sh, { x: 0 });
    SS.tl.set(cta, { autoAlpha: 1 }, T.cta);
    SS.tl.fromTo(cta, { scale: 0.4 }, { scale: 1, duration: 0.42, ease: SS.EZ.pop }, T.cta);
    SS.tl.fromTo(cta, { clipPath: clip(0, side, 0, side, G.cta.h / 2) }, { clipPath: clip(0, 0, 0, 0, G.cta.h / 2), duration: 0.6, ease: SS.EZ.pop }, T.cta + 0.06);
    SS.tl.fromTo(cw, { yPercent: SS.HIDE }, { yPercent: 0, duration: 0.6, ease: SS.EZ.out }, T.cta + 0.2);
    SS.tl.fromTo(ar, { x: -26, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: SS.EZ.out }, T.cta + 0.36);
    SS.tl.fromTo(ar, { x: 0 }, { x: 10, duration: 0.25, ease: 'sine.inOut' }, T.nudge);
    SS.tl.fromTo(ar, { x: 10 }, { x: 0, duration: 0.3, ease: 'sine.inOut' }, T.nudge + 0.25);
    SS.tl.fromTo(sh, { x: 0 }, { x: G.cta.w + 200, duration: 0.6, ease: 'sine.inOut' }, T.sheen);
    SS.cue(T.cta, 'cta'); SS.cue(T.sheen, 'sheen2');
    const url = SS.text(layer, 'scalesuiteqc.ca', { size: 40, weight: 650, color: SS.C.ink2, tracking: -0.01 });
    SS.place(url.el, 540, G.urlY);
    SS.hideWords(url);
    SS.wordsIn(url, T.url, { dur: 0.6 });
    // a barely perceptible drift while the end card holds
    SS.tl.fromTo([logo.el, cta], { scale: 1 }, { scale: 1.012, duration: T.end - 29.0, ease: 'sine.inOut' }, 29.0);

    R = { layer, dots, logo, P };
  }

  const OUT = SS.ease('power3.out'), IO = SS.ease('power2.inOut'), IN = SS.ease('power2.in');
  function render(t) {
    R.logo.mark(R.P.mark);
    R.logo.sheen(R.P.sheen);
    // node grid: ripple in from the centre, align onto the line, converge into the mark
    R.dots.forEach((d) => {
      const kin = OUT(SS.clamp01((t - T.dots - d.d / 1800) / 0.5));
      const dl = (Math.abs(d.y - G.cy) / 1200) * 0.12;
      const a = IO(SS.clamp01((t - T.align - dl) / 0.42));
      let x = d.x + (d.tx - d.x) * a, y = d.y + (G.cy - d.y) * a;
      const md = (Math.abs(d.tx - markX) / 800) * 0.12;
      const mk = IN(SS.clamp01((t - T.merge - md) / 0.3));
      x += (markX - x) * mk; y += (G.LY - y) * mk;
      const o = kin * (0.3 + 0.7 * a) * (1 - mk);
      d.c.setAttribute('cx', x.toFixed(1)); d.c.setAttribute('cy', y.toFixed(1));
      d.c.setAttribute('r', Math.max(0, (5.5 * kin + (4.2 - 5.5 * kin) * a) * (1 - 0.4 * mk)).toFixed(2));
      d.c.setAttribute('opacity', SS.clamp01(o).toFixed(3));
    });
  }

  const scene = { name: 'finale', a: 24.9, b: 99, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.layer, T.line, T.end + 1]]; };
  SS.scenes.push(scene);
})();
