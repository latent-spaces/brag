/* Background: off-white base, drifting mint light, the mint panel (Motif C) that blooms out of
   the ScaleSuite node in S3 and carries S3–S5, and a static grain that dithers soft gradients. */
(function () {
  const SS = window.SS;
  const { p, E, lerp } = SS;
  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const blobA = SS.el('div', 'abs', root), blobB = SS.el('div', 'abs', root);
    [blobA, blobB].forEach((b, i) => Object.assign(b.style, {
      width: '1300px', height: '1300px', borderRadius: '50%',
      background: `radial-gradient(closest-side, ${i ? 'rgba(43,191,179,.13)' : 'rgba(29,158,117,.10)'}, rgba(232,249,247,0))`,
    }));
    const mint = SS.el('div', 'abs', root);
    Object.assign(mint.style, { borderRadius: '50%', background: 'radial-gradient(closest-side, #F1FCFA 0%, #E8F9F7 62%, #DDF5F1 100%)' });
    const glow = SS.el('div', 'abs', root);
    Object.assign(glow.style, { width: '1100px', height: '1100px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))' });
    R = { root, blobA, blobB, mint, glow };
  }
  function render(t) {
    const H = SS.H;
    SS.set(R.blobA, { x: 540 + Math.sin(t * 0.31) * 160 - 220, y: H * 0.28 + Math.cos(t * 0.27) * 120, o: 1 });
    SS.set(R.blobB, { x: 540 + Math.cos(t * 0.23) * 180 + 260, y: H * 0.74 + Math.sin(t * 0.29) * 140, o: 1 });
    // mint panel: blooms from the node (5.42–6.05), holds through S5, covered by S6's dark stage
    const C = SS.NODE;
    const k = p(t, 5.42, 6.1, E.inOut);
    const rMax = Math.hypot(Math.max(C.x, SS.W - C.x), Math.max(C.y, H - C.y)) * 1.05;
    const r = lerp(12, rMax, k);
    R.mint.style.width = R.mint.style.height = (2 * r).toFixed(1) + 'px';
    SS.set(R.mint, { x: C.x, y: C.y, o: t > 5.42 && t < 15.2 ? 1 : 0 });
    const g = p(t, 5.7, 6.4, E.out) * (1 - p(t, 7.5, 8.2, E.inOut));
    SS.set(R.glow, { x: 540, y: SS.pick(930, 690), o: g * 0.9, s: lerp(0.7, 1, g) });
  }
  SS.scenes.push({ name: 'background', a: -1, b: 99, build, render });
})();
