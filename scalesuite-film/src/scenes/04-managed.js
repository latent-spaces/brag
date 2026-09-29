/* S6 Management + optimisation (14.55–18.4) — the one dark hero stage.
   The top card of the stack expands and darkens into the stage (card → background). A campaign
   card emerges with depth; "Créées. / Suivies. / Optimisées." stack up while the matching steps
   check themselves off. The stage then contracts into S7's search bar (background → object). */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;
  const T = { expand: 14.5, full: 15.05, card: 15.0, w: [15.16, 16.02, 16.8], steps: [15.3, 16.16, 16.94, 17.22], sub: 15.7, fade: 17.8, shrink: 17.92, bar: 18.3, end: 18.36 };
  const SEARCH = SS.pick({ x: 540, y: 640, w: 900, h: 112 }, { x: 540, y: 396, w: 900, h: 96 });
  SS.SEARCH = SEARCH;
  const MAIN = SS.pick({ x: 540, y: 1100, w: 820, h: 560, row: 84, title: 33, label: 31 }, { x: 540, y: 868, w: 800, h: 470, row: 66, title: 30, label: 27 });
  const HEAD = SS.pick({ ys: [262, 372, 482], size: 104, sub: 1450, subSize: 34 }, { ys: [128, 218, 308], size: 86, sub: 1166, subSize: 29 });
  const STEPS = [['Campagne créée', 'Création'], ['Suivi hebdomadaire', 'Suivi'], ['Mots-clés optimisés', 'Optimisation'], ['Annonce mise à jour', 'Optimisation']];
  const LIGHT = '#3FD3C6';

  let R;
  function build(stage) {
    // The stage panel lives on its own layer *below* S5, so it opens behind the white card stack.
    const panelLayer = SS.el('div', 'layer', null);
    stage.insertBefore(panelLayer, SS.scenes.find((s) => s.name === 'personal').root);
    const panel = SS.el('div', 'abs', panelLayer);
    const root = SS.el('div', 'layer', stage);
    root.style.perspective = '1600px';
    SS.scenes.find((s) => s.name === 'managed').extra = [panelLayer];
    const stageBg = SS.el('div', 'abs', root);
    Object.assign(stageBg.style, { width: SS.W + 'px', height: SS.H + 'px' });
    stageBg.innerHTML = `
      <div style="position:absolute;left:50%;top:-18%;width:1500px;height:1100px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side, rgba(43,191,179,.30), rgba(43,191,179,.08) 55%, rgba(43,191,179,0))"></div>
      <div style="position:absolute;left:50%;top:0;width:620px;height:${SS.H * 0.75}px;transform:translateX(-50%);background:linear-gradient(180deg, rgba(160,255,240,.13), rgba(160,255,240,0));clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);filter:blur(26px)"></div>
      <div style="position:absolute;left:50%;top:${MAIN.y + MAIN.h * 0.36}px;width:1200px;height:420px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side, rgba(43,191,179,.20), rgba(43,191,179,0))"></div>`;
    // ghost campaign cards (depth)
    const ghosts = [['Acheteur · Québec', -1], ['Vendeur · Rive-Sud', 1]].map(([label, side]) => {
      const g = SS.el('div', 'abs', root);
      Object.assign(g.style, { width: MAIN.w * 0.62 + 'px', height: MAIN.h * 0.66 + 'px', borderRadius: '26px', background: 'linear-gradient(180deg,#1F2524,#171B1A)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(255,255,255,.06), 0 30px 60px -20px rgba(0,0,0,.6)' });
      g.innerHTML = `<div style="position:absolute;left:28px;top:26px;font-size:24px;font-weight:700;color:rgba(255,255,255,.75)">${label}</div>
        ${[0, 1, 2].map((k) => `<div style="position:absolute;left:28px;top:${84 + k * 52}px;width:30px;height:30px;border-radius:50%;background:rgba(43,191,179,.55)"></div><div style="position:absolute;left:74px;top:${92 + k * 52}px;width:${150 + (k * 47) % 90}px;height:13px;border-radius:7px;background:rgba(255,255,255,.14)"></div>`).join('')}`;
      return { el: g, side };
    });
    // main card
    const main = SS.el('div', 'abs', root);
    Object.assign(main.style, { width: MAIN.w + 'px', height: MAIN.h + 'px', borderRadius: '30px', background: 'linear-gradient(180deg,#232A29 0%,#1A1F1E 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12), 0 0 0 1px rgba(255,255,255,.08), 0 50px 90px -30px rgba(0,0,0,.75), 0 0 80px -20px rgba(43,191,179,.35)', color: '#fff' });
    const pad = 38;
    main.innerHTML = `
      <div style="position:absolute;left:${pad}px;top:${pad - 4}px;font-size:${MAIN.title}px;font-weight:750;letter-spacing:-.02em">Campagne vendeur · Lévis</div>
      <div style="position:absolute;left:${pad}px;top:${pad + MAIN.title * 1.35}px;font-size:${MAIN.title * 0.66}px;font-weight:550;color:rgba(255,255,255,.55)">Courtier 01 · Votre agence</div>
      <div style="position:absolute;left:${pad}px;right:${pad}px;top:${pad + MAIN.title * 2.55}px;height:1.5px;background:rgba(255,255,255,.09)"></div>`;
    const badge = SS.el('div', 'chip', main);
    Object.assign(badge.style, { position: 'absolute', right: pad + 'px', top: pad - 2 + 'px', fontSize: SS.pick(18, 16) + 'px', background: 'rgba(43,191,179,.12)', color: LIGHT, boxShadow: 'inset 0 0 0 1.5px rgba(63,211,198,.45)' });
    badge.innerHTML = `<span class="ico">${SS.icon.lock(LIGHT)}</span>API Google Ads officielle`;
    const listTop = pad + MAIN.title * 2.55 + SS.pick(30, 22);
    const rail = SS.el('div', '', main);
    const railFill = SS.el('div', '', rail);
    const ck = SS.pick(40, 34);
    Object.assign(rail.style, { position: 'absolute', left: pad + ck / 2 - 1.5 + 'px', top: listTop + ck / 2 + 'px', width: '3px', height: MAIN.row * 3 + 'px', background: 'rgba(255,255,255,.1)', borderRadius: '2px' });
    Object.assign(railFill.style, { position: 'absolute', left: 0, top: 0, width: '3px', height: '100%', background: SS.C.turq, transformOrigin: 'top', borderRadius: '2px' });
    const steps = STEPS.map(([label, tag], k) => {
      const row = SS.el('div', '', main);
      Object.assign(row.style, { position: 'absolute', left: pad + 'px', right: pad + 'px', top: listTop + k * MAIN.row + 'px', height: ck + 'px', display: 'flex', alignItems: 'center', gap: '22px' });
      const holder = SS.el('span', '', row);
      Object.assign(holder.style, { width: ck + 'px', height: ck + 'px', borderRadius: '50%', background: '#2A3231', flex: 'none', position: 'relative' });
      const c = SS.check(holder, ck, SS.C.green);
      c.el.style.position = 'absolute'; c.el.style.left = c.el.style.top = 0;
      const lab = SS.el('span', '', row, label);
      Object.assign(lab.style, { fontSize: MAIN.label + 'px', fontWeight: 650, letterSpacing: '-.015em' });
      const tg = SS.el('span', '', row, tag);
      Object.assign(tg.style, { marginLeft: 'auto', fontSize: MAIN.label * 0.62 + 'px', fontWeight: 650, color: LIGHT, letterSpacing: '.02em' });
      return { row, c, lab, tg };
    });
    // headline stack
    const words = ['Créées.', 'Suivies.', 'Optimisées.'].map((w) => SS.text(root, w, { size: HEAD.size, color: '#fff' }));
    const sub = SS.text(root, 'Par notre IA et notre équipe.', { size: HEAD.subSize, weight: 550, color: 'rgba(255,255,255,.72)', tracking: -0.01 });
    R = { root, panel, stageBg, ghosts, main, badge, steps, rail, railFill, words, sub };
  }

  const mixHex = (a, b, k) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
  };

  function render(t) {
    const W = SS.W, H = SS.H, ST = SS.STACK, CARD = SS.CARD;
    // ---- panel: card → stage → search bar
    const ke = p(t, T.expand, T.full, E.inOut);
    const kc = p(t, T.shrink, T.bar, E.inOut);
    let w = lerp(CARD.w * 0.8, W + 60, ke), h = lerp(CARD.h * 0.8, H + 60, ke);
    let x = lerp(ST.x, W / 2, ke), y = lerp(ST.y, H / 2, ke);
    let rad = lerp(Math.min(CARD.w, CARD.h) * 0.4, 0, ke), rot = 0;
    let col = '#141817';
    w = lerp(w, SEARCH.w, kc); h = lerp(h, SEARCH.h, kc); x = lerp(x, SEARCH.x, kc); y = lerp(y, SEARCH.y, kc);
    rad = lerp(rad, SEARCH.h / 2, kc);
    if (kc > 0) col = mixHex('#141817', '#FFFFFF', clamp((kc - 0.8) / 0.18));
    Object.assign(R.panel.style, { width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px', borderRadius: rad.toFixed(1) + 'px', background: col,
      boxShadow: kc > 0.6 ? '0 1px 2px rgba(18,44,40,.06), 0 14px 34px -14px rgba(18,74,66,.26), 0 0 0 1px rgba(26,26,26,.045)' : 'none' });
    SS.set(R.panel, { x, y, r: rot, o: t >= T.expand && t < T.bar + 0.02 ? 1 : 0 });

    // ---- stage content
    const on = p(t, T.full - 0.2, T.full + 0.2, E.linear) * (1 - p(t, T.fade, T.fade + 0.2, E.linear));
    SS.set(R.stageBg, { x: W / 2, y: H / 2, o: on });
    const cam = p(t, T.card, 18.0, E.outSoft);
    const km = p(t, T.card, T.card + 0.7, E.out);
    const fade = 1 - p(t, T.fade, T.fade + 0.22, E.linear);
    SS.set(R.main, { x: MAIN.x, y: MAIN.y + (1 - km) * 160, rx: lerp(28, 5, km) - cam * 3, s: lerp(0.9, 0.97, km) + cam * 0.03, o: Math.min(km * 1.4, fade) });
    R.ghosts.forEach((g, i) => {
      const kg = p(t, T.card + 0.15 + i * 0.08, T.card + 0.95 + i * 0.08, E.out);
      const dx = g.side * SS.pick(300, 340) + g.side * cam * 22, dy = -MAIN.h * 0.2;
      SS.set(g.el, { x: MAIN.x + dx, y: MAIN.y + dy + (1 - kg) * 120, s: 0.92, rx: 8, ry: -g.side * 22, o: Math.min(kg, fade) * 0.7, blur: 3.5 });
    });
    R.badge.style.opacity = p(t, T.card + 0.45, T.card + 0.85, E.out).toFixed(3);
    R.steps.forEach((s, k) => {
      const ks = p(t, T.steps[k] - 0.12, T.steps[k] + 0.35, E.out);
      s.c.set(p(t, T.steps[k], T.steps[k] + 0.55, E.linear));
      s.lab.style.opacity = lerp(0.28, 1, ks).toFixed(3);
      s.tg.style.opacity = ks.toFixed(3);
      s.row.style.transform = `translateX(${((1 - ks) * 16).toFixed(2)}px)`;
    });
    const rf = T.steps.reduce((m, st, k) => (k === 0 ? m : m + p(t, T.steps[k - 1] + 0.2, st, E.inOut)), 0) / 3;
    R.railFill.style.transform = `scaleY(${rf.toFixed(4)})`;

    // ---- headline stack: active word white, earlier words dim, last word turquoise
    R.words.forEach((wd, i) => {
      SS.set(wd.el, { x: 540, y: HEAD.ys[i], o: fade });
      SS.words(wd, t, { inT: T.w[i], dur: 0.7 });
      const next = i < 2 ? p(t, T.w[i + 1], T.w[i + 1] + 0.35, E.out) : 0;
      wd.el.style.color = i === 2 ? mixHex('#FFFFFF', LIGHT, p(t, T.w[2] + 0.3, T.w[2] + 0.8, E.inOut)) : `rgba(255,255,255,${lerp(1, 0.34, next).toFixed(3)})`;
    });
    SS.set(R.sub.el, { x: 540, y: HEAD.sub, o: fade });
    SS.words(R.sub, t, { inT: T.sub, st: 0.04, dur: 0.6 });
  }

  SS.scenes.push({ name: 'managed', a: T.expand - 0.02, b: T.end, build, render });
})();
