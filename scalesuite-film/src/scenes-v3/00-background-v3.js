/* V3 background: off-white base, two drifting mint lights (ambient layer), the mint disc that blooms
   out of the ScaleSuite node in scene 3, and a soft white light behind the logo. */
(function () {
  const SS = window.SS;
  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const blobs = [0, 1].map((i) => {
      const b = SS.el('div', 'a3', root);
      Object.assign(b.style, { width: '1300px', height: '1300px', borderRadius: '50%',
        background: `radial-gradient(closest-side, ${i ? 'rgba(43,191,179,.13)' : 'rgba(29,158,117,.10)'}, rgba(232,249,247,0))` });
      return b;
    });
    // mint disc: diameter covers the frame from its centre (scene 3 scales it from the node)
    const D = Math.ceil(2 * Math.hypot(540, 960) * 1.04);
    const mint = SS.el('div', 'a3', root);
    Object.assign(mint.style, { width: D + 'px', height: D + 'px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, #F1FCFA 0%, #E8F9F7 62%, #DDF5F1 100%)' });
    SS.place(mint, 540, 960, { scale: 0.004, autoAlpha: 0 });
    const glow = SS.el('div', 'a3', root);
    Object.assign(glow.style, { width: '1100px', height: '1100px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))' });
    SS.place(glow, 540, 900, { scale: 0.7, autoAlpha: 0 });
    R = { root, blobs, mint, glow };
    SS.bg = R;
  }
  function render(t) {
    // ambient drift (≈ 20 s cycles), counter-moving pair
    gsap.set(R.blobs[0], { x: 320 + Math.sin(t * 0.31) * 160, y: SS.H * 0.28 + Math.cos(t * 0.27) * 120, xPercent: -50, yPercent: -50 });
    gsap.set(R.blobs[1], { x: 800 + Math.cos(t * 0.23) * 180, y: SS.H * 0.74 + Math.sin(t * 0.29) * 140, xPercent: -50, yPercent: -50 });
  }
  SS.scenes.push({ name: 'background', a: -1, b: 99, build, render });
})();
