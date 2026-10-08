/* Scene 2 · Chaos (2.5–5.5 s). A smash zoom lands us inside the grid; the frame stays tight and
   cards are cut by its edges. Tasks drop on the pile faster and faster (≈ 240 ms → 40 ms apart),
   every broker card's unread badge climbs, the headline noun swaps faster each time
   (courtiers → campagnes → gestion) with a camera jolt on each swap, and a handheld shake grows.
   At 5.0 s everything swells by a few percent (anticipation), then the whole pile, cards and
   headline included, is pulled into one green node at the centre of the frame (scene 3). */
(function () {
  const SS = window.SS;
  const T = { smash: 2.2, plus: 2.6, swap1: 3.42, swap2: 4.17, ant: 5.0, implode: 5.13, end: 5.62 };
  const N = 40;
  const NODE = { x: 470, y: 960 }; // world point at the frame centre when the implosion starts
  const TASKS = ['Ajuster le budget', 'Nouvelle annonce', 'Revoir les mots-clés', 'Page de destination', 'Rapport mensuel',
    'Suivi des leads', 'Mots-clés négatifs', 'Tester une annonce', 'Revoir le ciblage', 'Mettre à jour la page',
    'Vérifier les conversions', 'Répartir les leads'];
  // camera framings the tasks land in (one per segment between headline swaps)
  const SEG = [{ t: 0, x: 440, y: 988, s: 1.92 }, { t: T.swap1, x: 610, y: 1110, s: 1.98 }, { t: T.swap2, x: 470, y: 960, s: 2.08 }];
  const spawnT = (i) => 2.62 + 2.14 * Math.pow(i / (N - 1), 0.62); // last landing ends before the anticipation
  const BUMP = SS.ease('power2.out');

  let R;
  function build(stage) {
    const world = SS.world, hook = SS.hook;
    const rnd = SS.rng(2024);
    // ---- tasks (world units; on screen at camera scale ≈ 2 they read at 50+ px)
    const tasks = [];
    for (let i = 0; i < N; i++) {
      const ts = spawnT(i);
      const seg = SEG.filter((s) => ts >= s.t).pop();
      const card = hook.cards[(i * 7 + 3) % 10];
      // rounded so GSAP writes the same transform string whichever tween last set it
      const r2 = (v) => Math.round(v * 100) / 100;
      const x = Math.round(seg.x + (rnd() * 2 - 1) * 205), y = Math.round(seg.y + (rnd() * 1.4 - 0.45) * 250);
      const rot = r2((rnd() * 2 - 1) * 6);
      const el = SS.el('div', 'a3 task3', world);
      Object.assign(el.style, { padding: '18px 22px 18px 20px', minWidth: '300px' });
      el.innerHTML = `<span class="bx"></span><span><div class="tt" style="font-size:27px">${TASKS[(i * 5) % TASKS.length]}</div>
        <div class="ts" style="font-size:22px">Courtier ${card.n}</div></span><span class="dot"></span>`;
      SS.place(el, x, y, { rotation: rot, autoAlpha: 0 });
      // dropped on the pile: from slightly above and larger, lands with a squash-like overshoot
      SS.tl.fromTo(el, { x, y: y - 46, scale: 1.24, rotation: r2(rot * 1.8) }, { x, y, scale: 1, rotation: rot, duration: 0.34, ease: 'back.out(1.6)' }, ts);
      SS.tl.set(el, { autoAlpha: 1 }, ts); // no fade: it is dropped on the pile, fully opaque
      SS.cue(ts, 'task', { i });
      tasks.push({ el, x, y, rot, ts, card });
    }
    hook.cards.forEach((c) => { c.spawns = tasks.filter((k) => k.card === c).map((k) => k.ts); });

    // ---- implosion: everything flies into the node, nearest first, with speed blur
    const items = [...hook.cards.map((c) => ({ el: c.el, x: c.x, y: c.y, rot: 0, ts: 0 })), ...tasks];
    items.forEach((it) => {
      const d = Math.hypot(it.x - NODE.x, it.y - NODE.y);
      // never overlaps the landing tween of the same element (two tweens on one property = order-dependent)
      const at = Math.max(T.implode + Math.min(0.12, (d / 1400) * 0.12), it.ts + 0.35);
      SS.tl.fromTo(it.el, { x: it.x, y: it.y, scale: 1, rotation: it.rot }, { x: NODE.x, y: NODE.y, scale: 0.05, rotation: Math.round(it.rot * 30) / 100, duration: 0.38, ease: 'power3.in' }, at);
      it.at = at;
      SS.tl.fromTo(it.el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.09, ease: 'power1.in' }, at + 0.3);
    });
    SS.cue(T.ant, 'anticipation');
    SS.cue(T.implode, 'implode');

    // ---- screen-space headline: scrim (keeps the type readable over the pile) + "Plus de" + nouns + count
    const scrim = SS.el('div', 'layer', null);
    stage.insertBefore(scrim, hook.layer);
    const sc = SS.el('div', 'a3', scrim);
    Object.assign(sc.style, { width: '1080px', height: '680px', background: 'linear-gradient(180deg, #F7FBFA 0%, #F7FBFA 66%, rgba(247,251,250,.85) 78%, rgba(247,251,250,0) 100%)' });
    gsap.set(sc, { autoAlpha: 0 });
    SS.tl.fromTo(sc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' }, T.smash);
    SS.tl.fromTo(sc, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, T.implode + 0.1);

    const layer = SS.el('div', 'layer', stage);
    const shakeBox = SS.el('div', 'layer', layer);
    const H = SS.HEAD3;
    const plus = SS.text(shakeBox, 'Plus de', { size: H.size });
    SS.place(plus.el, 540, H.yA);
    // the noun swaps happen inside a band that starts just under "Plus de", so a word leaving
    // upward is clipped there instead of sliding over the first line
    const band = SS.el('div', 'a3', shakeBox);
    Object.assign(band.style, { top: H.band + 'px', width: '1080px', height: '190px', overflow: 'hidden' });
    const n2 = SS.text(band, 'campagnes.', { size: H.size });
    const n3 = SS.text(band, 'gestion.', { size: H.size });
    SS.place(n2.el, 540, H.yB - H.band); SS.place(n3.el, 540, H.yB - H.band);
    [plus, n2, n3].forEach(SS.hideWords);
    SS.wordsIn(plus, T.plus, { st: 0.07, dur: 0.55 });
    SS.cue(T.plus, 'line');
    // noun swaps, each one faster than the last; the camera jolts on the cut
    // (the old word is mostly out before the new one rises: a clean roll, not a double exposure)
    SS.tl.fromTo(SS.hookWord.inner, { yPercent: 0 }, { yPercent: -SS.HIDE, duration: 0.16, ease: SS.EZ.in }, T.swap1 - 0.1);
    SS.wordsIn(n2, T.swap1 + 0.02, { dur: 0.42 });
    SS.wordsOut(n2, T.swap2 - 0.1, { dur: 0.15 });
    SS.wordsIn(n3, T.swap2 + 0.01, { dur: 0.38 });
    SS.cue(T.swap1, 'swap', { k: 1 });
    SS.cue(T.swap2, 'swap', { k: 2 });
    const nounW = [SS.hookWord.w, n2.w, n3.w];
    // unread count pinned to the noun (red only lives in this scene)
    const count = SS.el('div', 'a3 badge3', shakeBox);
    Object.assign(count.style, { height: '68px', minWidth: '68px', padding: '0 18px', boxSizing: 'border-box', fontSize: '38px' });
    count.textContent = '1';
    count.style.transform = 'scale(0)';
    // whole headline: anticipation swell, then pulled into the node (frame centre)
    gsap.set(layer, { transformOrigin: '540px 960px', scale: 1, autoAlpha: 1 });
    SS.tl.fromTo(layer, { scale: 1 }, { scale: 1.04, duration: 0.13, ease: 'power2.out' }, T.ant);
    SS.tl.fromTo(layer, { scale: 1.04 }, { scale: 0.04, duration: 0.36, ease: 'power3.in' }, T.implode);
    SS.tl.fromTo(layer, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08, ease: 'power1.in' }, T.implode + 0.28);

    // ---- camera: smash zoom, recoil, creep, two jolts, anticipation, implosion
    SS.camTo(T.smash, 0.3, 'power4.in', { x: 432, y: 986, s: 2.02, r: -1.8 });
    SS.camTo(T.smash + 0.3, 0.24, 'power2.out', { s: 1.9 });
    SS.camTo(2.74, 0.66, 'sine.inOut', { x: 446, y: 992, s: 1.94, r: -1.2 });
    SS.camTo(T.swap1, 0.26, 'expo.inOut', { x: 610, y: 1110, s: 1.98, r: 2.0 });
    SS.camTo(T.swap1 + 0.26, 0.49, 'sine.inOut', { s: 2.01, r: 2.3 });
    SS.camTo(T.swap2, 0.22, 'expo.inOut', { x: 470, y: 960, s: 2.07, r: -2.4 });
    SS.camTo(T.swap2 + 0.22, 0.61, 'sine.inOut', { s: 2.13, r: -2.8 });
    SS.camTo(T.ant, 0.13, 'power2.out', { s: 2.21, r: 0 });
    SS.camTo(T.implode, 0.42, 'power2.in', { s: 2.0 });
    SS.camFx(T.smash + 0.08, 0.2, 'power2.in', { blur: 0 }, { blur: 10 });
    SS.camFx(T.smash + 0.3, 0.2, 'power2.out', { blur: 10 }, { blur: 0 });
    [T.swap1, T.swap2].forEach((ts) => {
      SS.camFx(ts, 0.12, 'power2.in', { blur: 0 }, { blur: 6 });
      SS.camFx(ts + 0.12, 0.14, 'power2.out', { blur: 6 }, { blur: 0 });
    });
    SS.camFx(2.7, 2.3, 'power2.in', { shake: 0, shakeR: 0 }, { shake: 8, shakeR: 0.5 });
    SS.camFx(T.ant + 0.02, 0.1, 'power2.out', { shake: 8, shakeR: 0.5 }, { shake: 0, shakeR: 0 });
    SS.cue(T.smash, 'smash');

    R = { tasks, items, layer, shakeBox, count, nounW };
  }

  // backlog counter: 1 → 99+, accelerating
  const IN2 = SS.ease('power2.in');
  const countAt = (t) => 1 + 98 * Math.pow(SS.clamp01((t - 2.8) / 2.15), 2.3);
  function render(t) {
    // card badges: appear with the card's first task, bump on every new one
    SS.hook.cards.forEach((c) => {
      const n = c.spawns.filter((s) => s <= t).length;
      if (!n) { c.badge.style.transform = 'scale(0)'; return; }
      const appear = gsap.parseEase('back.out(2.2)')(SS.clamp01((t - c.spawns[0]) / 0.3));
      const last = c.spawns[n - 1];
      const bump = n > 1 ? Math.sin(Math.PI * SS.clamp01((t - last) / 0.2)) * 0.22 : 0;
      c.badge.textContent = String(n);
      c.badge.style.transform = `scale(${(appear * (1 + bump)).toFixed(4)})`;
    });
    // speed blur while everything is pulled into the node
    R.items.forEach((it) => SS.blur(it.el, 9 * IN2(SS.clamp01((t - it.at) / 0.38))));
    SS.blur(R.layer, 10 * IN2(SS.clamp01((t - T.implode) / 0.36)));
    // headline count, pinned to the current noun's top-right corner
    const H = SS.HEAD3;
    const k1 = SS.prog(t, T.swap1, 0.3, SS.EZ.inOut), k2 = SS.prog(t, T.swap2, 0.3, SS.EZ.inOut);
    const w = R.nounW[0] + (R.nounW[1] - R.nounW[0]) * k1 + (R.nounW[2] - R.nounW[1]) * k2;
    const c = countAt(t);
    R.count.textContent = c >= 99 ? '99+' : String(Math.floor(c));
    const appear = gsap.parseEase('back.out(2)')(SS.clamp01((t - 2.8) / 0.35));
    const tick = Math.sin(Math.PI * SS.clamp01(((t - 2.8) * 7) % 1)) * 0.06 * SS.clamp01((t - 3) / 1);
    R.count.style.transform = `translate(${(540 + w / 2 - 6).toFixed(1)}px,${(H.yB - 66).toFixed(1)}px) translate(0,-50%) scale(${(appear * (1 + tick)).toFixed(4)})`;
    // the headline shakes with the camera, at 40 %
    const k = SS.camNow(t);
    R.shakeBox.style.transform = `translate(${(k.ox * 0.4).toFixed(2)}px,${(k.oy * 0.4).toFixed(2)}px)`;
  }

  const scene = { name: 'chaos', a: -1, b: T.end, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.layer, 2.2, T.end]]; };
  SS.scenes.push(scene);
})();
