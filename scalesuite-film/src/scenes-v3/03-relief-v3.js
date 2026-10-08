/* Scene 3 · Relief / ScaleSuite (5.5–8.5 s). The node everything collapsed into lands with an impact,
   then breathes alone on an empty frame (0.3 s of silence). It blooms into the mint panel, travels
   into the logo mark, the wordmark rises, then the tagline. Slowest motion of the film (600–900 ms),
   slow dolly-in. Exit: the tagline leaves, the logo shrinks into the header of the dashboard,
   whose card grows out from behind it (scene 4 unrolls the rows from there). */
(function () {
  const SS = window.SS;
  const T = { node: 5.26, impact: 5.53, breath: 5.85, bloom: 5.92, toMark: 6.2, mark: 6.36, slide: 6.64, letters: 6.66,
    tag: 6.98, sheen: 7.22, tagOut: 7.84, dock: 7.94, header: 8.3, end: 8.7 };
  const LH = 176, LY = 900;
  const LW = (LH * SS.LOGO.w) / SS.LOGO.h;
  const markOff = -LW / 2 + 58 * (LH / SS.LOGO.h); // mark centre relative to the lockup centre
  const DOLLY = 1.035;
  // dashboard header (shared with scene 4)
  const DASH = { x: 540, w: 900, top: 560, headH: 124, logoH: 66 };
  DASH.left = DASH.x - DASH.w / 2;
  SS.DASH = DASH;

  let R;
  function build(stage) {
    // dashboard header card sits *below* the relief layer so the logo docks on top of it
    const dash = SS.el('div', 'layer', stage);
    const head = SS.el('div', 'a3', dash);
    Object.assign(head.style, { width: DASH.w + 'px', height: DASH.headH + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.07), 0 30px 60px -28px rgba(18,74,66,.38), 0 0 0 1px rgba(26,26,26,.05)' });
    SS.place(head, DASH.x, DASH.top + DASH.headH / 2, { autoAlpha: 0 });

    const layer = SS.el('div', 'layer', stage);
    const dolly = SS.el('div', 'layer', layer);
    gsap.set(dolly, { transformOrigin: '540px 960px' });
    const ring = SS.el('div', 'a3', dolly);
    Object.assign(ring.style, { width: '140px', height: '140px', borderRadius: '50%', boxShadow: `inset 0 0 0 4px ${SS.C.turq}` });
    SS.place(ring, 540, 960, { scale: 0.2, autoAlpha: 0 });
    const node = SS.el('div', 'a3', dolly);
    Object.assign(node.style, { width: '26px', height: '26px', borderRadius: '50%', background: SS.C.green, boxShadow: '0 0 0 9px rgba(43,191,179,.2)' });
    SS.place(node, 540, 960, { scale: 0, autoAlpha: 0 });
    const logo = SS.logo(dolly, LH);
    const lx0 = 540 - markOff;
    SS.place(logo.el, lx0, LY);
    gsap.set(logo.letters, { y: 150 });
    const tag = SS.text(dolly, "Google Ads pour l'immobilier québécois.", { size: 46, weight: 560, color: SS.C.soft, tracking: -0.015, maxW: 900 });
    SS.place(tag.el, 540, LY + LH / 2 + 84);
    SS.hideWords(tag);
    const P = { mark: 0, sheen: 0 };

    // ---- node arrives with the pile, impact, then breathes alone
    SS.tl.fromTo(node, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: 'none' }, T.node);
    SS.tl.fromTo(node, { scale: 0 }, { scale: 1, duration: 0.22, ease: 'back.out(2)' }, T.node);
    SS.tl.fromTo(node, { scale: 1 }, { scale: 1.7, duration: 0.06, ease: 'power2.out' }, T.impact - 0.04);
    SS.tl.fromTo(node, { scale: 1.7 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, T.impact + 0.02);
    SS.tl.fromTo(ring, { scale: 0.2, autoAlpha: 0.85 }, { scale: 2.6, autoAlpha: 0, duration: 0.9, ease: SS.EZ.out }, T.impact);
    SS.tl.fromTo(node, { scale: 1 }, { scale: 1.14, duration: 0.18, ease: 'sine.inOut' }, T.breath);
    SS.tl.fromTo(node, { scale: 1.14 }, { scale: 1, duration: 0.17, ease: 'sine.inOut' }, T.breath + 0.18);
    SS.cue(T.impact, 'impact');
    SS.cue(T.breath, 'breath');
    // ---- bloom: the mint disc grows out of the node and fills the frame
    SS.tl.set(SS.bg.mint, { autoAlpha: 1 }, T.bloom);
    SS.tl.fromTo(SS.bg.mint, { scale: 0.004 }, { scale: 1, duration: 0.95, ease: 'power2.inOut' }, T.bloom);
    SS.tl.fromTo(SS.bg.glow, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 0.9, scale: 1, duration: 1.0, ease: SS.EZ.soft }, T.bloom + 0.2);
    SS.cue(T.bloom, 'bloom');
    // ---- node travels into the mark and hands over to it
    SS.tl.fromTo(node, { y: 960 }, { y: LY, duration: 0.34, ease: SS.EZ.inOut }, T.toMark);
    SS.tl.fromTo(node, { scale: 1 }, { scale: 2.4, duration: 0.28, ease: SS.EZ.inOut }, T.toMark + 0.01);
    SS.tl.fromTo(node, { scale: 2.4 }, { scale: 0, duration: 0.28, ease: SS.EZ.in }, T.toMark + 0.29);
    SS.tl.fromTo(P, { mark: 0 }, { mark: 1, duration: 0.72, ease: 'none' }, T.mark); // logo.mark() applies its own ease-out
    SS.cue(T.mark, 'mark');
    // ---- lockup slides to centre while the letters rise; tagline; sheen
    SS.tl.fromTo(logo.el, { x: lx0 }, { x: 540, duration: 0.6, ease: SS.EZ.inOut }, T.slide);
    SS.tl.fromTo(logo.letters, { y: 150 }, { y: 0, duration: 0.64, stagger: 0.032, ease: SS.EZ.out }, T.letters);
    SS.cue(T.letters, 'letters');
    SS.wordsIn(tag, T.tag, { st: 0.045, dur: 0.72 });
    SS.tl.fromTo(tag.el, { letterSpacing: '0.04em' }, { letterSpacing: '-0.015em', duration: 1.0, ease: SS.EZ.out }, T.tag);
    SS.cue(T.tag, 'tagline');
    SS.tl.fromTo(P, { sheen: 0 }, { sheen: 1, duration: 0.66, ease: 'sine.inOut' }, T.sheen);
    SS.cue(T.sheen, 'sheen');
    // ---- slow dolly-in for the whole calm beat
    SS.tl.fromTo(dolly, { scale: 1 }, { scale: DOLLY, duration: T.tagOut - T.breath, ease: 'sine.inOut' }, T.breath);

    // ---- exit: tagline leaves, the logo docks into the dashboard header, the header card grows
    SS.wordsOut(tag, T.tagOut, { st: 0.015, dur: 0.26 });
    const hs = DASH.logoH / LH;
    const hx = DASH.left + 36 + (LW * hs) / 2, hy = DASH.top + DASH.headH / 2;
    const inv = (v, c) => c + (v - c) / DOLLY; // screen → dolly coordinates (dolly is at its end scale)
    SS.tl.fromTo(logo.el, { x: 540, y: LY, scale: 1 }, { x: inv(hx, 540), y: inv(hy, 960), scale: hs / DOLLY, duration: 0.44, ease: SS.EZ.inOut }, T.dock);
    SS.tl.fromTo(SS.bg.glow, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, T.dock);
    SS.cue(T.dock, 'dock');
    const cut = DASH.w - (36 + LW * hs + 26);
    gsap.set(head, { clipPath: `inset(10px ${cut}px 10px 14px round 30px)` });
    SS.tl.set(head, { autoAlpha: 1 }, T.header);
    SS.tl.fromTo(head, { clipPath: `inset(10px ${cut}px 10px 14px round 30px)` }, { clipPath: 'inset(0px 0px 0px 0px round 34px)', duration: 0.36, ease: SS.EZ.out }, T.header);
    SS.cue(T.header, 'header');

    R = { layer, dash, head, logo, P };
    SS.relief = R;
  }

  function render() {
    R.logo.mark(R.P.mark);
    R.logo.sheen(R.P.sheen);
  }

  const scene = { name: 'relief', a: -1, b: 99, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.layer, 5.2, T.end], [R.dash, 5.2, T.end]]; };
  SS.scenes.push(scene);
})();
