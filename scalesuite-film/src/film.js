/* Film runner: builds every scene once fonts are ready, then exposes SS.renderFrame(t).
   ?format=vertical|feed  ?t=12.3 (static frame)  ?play (real-time preview in a browser) */
(function () {
  const SS = window.SS;
  // Film clock (V2 by default, see timemap.js) → scenes' animation clock.
  SS.DURATION = Math.round(SS.FILM_DURATION * 1000) / 1000;
  SS.POSTER_T = SS.toFilm(2.2); // settled hook frame, baked in as frame 0 for thumbnails

  async function boot() {
    const stage = document.getElementById('stage');
    stage.style.height = SS.H + 'px';
    document.body.style.width = SS.W + 'px';
    document.body.style.height = SS.H + 'px';
    await document.fonts.load('800 100px Inter');
    await document.fonts.load('500 40px Inter');
    await document.fonts.ready;
    SS.scenes.forEach((s) => {
      s.build(stage);
      s.root = stage.lastElementChild;
    });
    const grain = SS.el('div', 'layer', stage);
    Object.assign(grain.style, { backgroundImage: `url(${SS.grain(256, 256, 9)})`, pointerEvents: 'none', opacity: 0.5 });
    SS.renderFrame = (tFilm) => {
      const t = SS.toAnim(tFilm);
      for (const s of SS.scenes) {
        const on = t >= s.a && t <= s.b;
        if (s.root) s.root.style.display = on ? '' : 'none';
        (s.extra || []).forEach((e) => { e.style.display = on ? '' : 'none'; });
        if (on) s.render(t);
      }
    };
    const q = new URLSearchParams(location.search);
    if (q.has('play')) {
      const t0 = performance.now() - (parseFloat(q.get('t')) || 0) * 1000;
      const tick = () => { SS.renderFrame(((performance.now() - t0) / 1000) % SS.DURATION); requestAnimationFrame(tick); };
      tick();
    } else {
      SS.renderFrame(parseFloat(q.get('t')) || 0);
    }
    SS.ready = true;
  }
  window.addEventListener('load', () => boot().catch((e) => { SS.error = String(e && e.stack || e); console.error(e); }));
})();
