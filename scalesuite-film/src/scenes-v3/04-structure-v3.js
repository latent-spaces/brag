/* Scene 4 · One structure (8.5–11.0 s). The dashboard whose header the logo docked into (scene 3)
   unrolls downward in the world layer (900 px wide, 83 % of the frame). Ten broker rows click into
   place one after another with a small overshoot, each with its own campaign type and territory;
   the status dots pulse in a wave. Courtier 03's campaign is still a draft. The camera pushes in,
   the other rows dim, and row 03 opens into the campaign card (scene 5). */
(function () {
  const SS = window.SS;
  const D = SS.DASH; // { x, w, top, headH, logoH, left } from scene 3
  const T = { swap: 8.5, label: 8.52, unroll: 8.52, rows: 8.62, head: 8.72, wave: 9.3, push: 8.95, headOut: 10.18, focus: 10.25, morph: 10.72 };
  const ROW = { left: D.left + 18, w: D.w - 36, h: 72, pitch: 79, top0: D.top + D.headH + 14 };
  ROW.y = (i) => ROW.top0 + ROW.h / 2 + i * ROW.pitch;
  const H = D.top + D.headH + 14 + 9 * ROW.pitch + ROW.h + 19 - D.top; // card height (940)
  const DATA = [['Acheteur', 'Québec'], ['Vendeur', 'Beauce'], ['Vendeur', 'Lévis'], ['Acheteur', 'Lévis'], ['Vendeur', 'Rive-Sud'],
    ['Acheteur', 'Beauport'], ['Vendeur', 'Charny'], ['Acheteur', 'Sillery'], ['Vendeur', 'Limoilou'], ['Acheteur', 'Rive-Sud']];
  const HOT = 2; // Courtier 03
  SS.ROW = ROW; SS.ROWDATA = DATA; SS.HOT = HOT;

  // One dashboard row (also reused, identical, by the campaign card header and the lead list).
  SS.rowHTML = (i, o = {}) => {
    const [type, area] = DATA[i];
    const draft = o.draft;
    const st = draft
      ? `<span class="st" style="margin-left:auto;display:flex;align-items:center;gap:10px;font-size:30px;font-weight:650;color:${SS.C.soft}"><span class="sd" style="width:14px;height:14px;border-radius:50%;background:#B7C2C0"></span>Brouillon</span>`
      : `<span class="st" style="margin-left:auto;display:flex;align-items:center;gap:10px;font-size:30px;font-weight:650;color:${SS.C.green}"><span class="sd" style="width:14px;height:14px;border-radius:50%;background:${SS.C.green}"></span>Active</span>`;
    return `<span class="av" style="width:50px;height:50px;flex:none">${SS.icon.person()}</span>
      <span style="font-size:36px;font-weight:700;letter-spacing:-.02em;color:${SS.C.ink};flex:none">Courtier ${String(i + 1).padStart(2, '0')}</span>
      <span class="chip3" style="position:static;font-size:30px;height:46px;padding:0 15px;box-sizing:border-box;box-shadow:none">${type} · ${area}</span>${st}`;
  };
  SS.rowStyle = (el, i) => Object.assign(el.style, { width: ROW.w + 'px', height: ROW.h + 'px', borderRadius: '18px', background: i % 2 ? '#F6FBFA' : '#fff',
    display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px 0 12px', boxSizing: 'border-box', whiteSpace: 'nowrap' });

  let R;
  function build(stage) {
    const world = SS.world;
    // ---- the dashboard card: at 8.5 it is pixel-identical to scene 3's header card, then unrolls
    const card = SS.el('div', 'a3', world);
    Object.assign(card.style, { width: D.w + 'px', height: H + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.07), 0 30px 60px -28px rgba(18,74,66,.38), 0 0 0 1px rgba(26,26,26,.05)' });
    SS.place(card, D.x, D.top + H / 2, { autoAlpha: 0, clipPath: `inset(0px 0px ${H - D.headH}px 0px round 34px)` });
    SS.tl.set(card, { autoAlpha: 1 }, T.swap);
    SS.tl.fromTo(card, { clipPath: `inset(0px 0px ${H - D.headH}px 0px round 34px)` }, { clipPath: 'inset(0px 0px 0px 0px round 34px)', duration: 0.55, ease: SS.EZ.out }, T.unroll);
    const LW = (D.logoH * SS.LOGO.w) / SS.LOGO.h;
    const logo = SS.logo(world, D.logoH);
    logo.mark(1);
    SS.place(logo.el, D.left + 36 + LW / 2, D.top + D.headH / 2, { autoAlpha: 0 });
    SS.tl.set(logo.el, { autoAlpha: 1 }, T.swap);
    const label = SS.text(world, 'Tableau de bord · Votre agence', { size: 30, weight: 650, color: SS.C.soft, tracking: -0.01 });
    gsap.set(label.el, { x: D.left + D.w - 36, y: D.top + D.headH / 2, xPercent: -100, yPercent: -50 });
    SS.hideWords(label);
    SS.wordsIn(label, T.label, { st: 0.03, dur: 0.5 });
    const div = SS.el('div', 'a3', world);
    Object.assign(div.style, { width: D.w - 44 + 'px', height: '2px', background: '#EDF3F2', transformOrigin: 'left center' });
    SS.place(div, D.x, D.top + D.headH, { scaleX: 0 });
    SS.tl.fromTo(div, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: SS.EZ.out }, T.unroll + 0.08);

    // ---- rows click in one by one (≈ 4.5 % overshoot), a soft tick each
    const rows = DATA.map((d, i) => {
      const el = SS.el('div', 'a3', world);
      SS.rowStyle(el, i);
      el.innerHTML = SS.rowHTML(i, { draft: i === HOT });
      const y = ROW.y(i);
      SS.place(el, D.x, y, { autoAlpha: 0 });
      const at = T.rows + i * 0.05;
      SS.tl.fromTo(el, { y: y - 34, scale: 0.96 }, { y, scale: 1, duration: 0.44, ease: SS.EZ.dock }, at);
      SS.tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'power1.out' }, at);
      SS.cue(at + 0.3, 'row', { i });
      return { el, y, dot: el.querySelector('.sd') };
    });
    // status wave: every active campaign blinks once, top to bottom
    rows.forEach((r, i) => {
      if (i === HOT) return;
      const at = T.wave + i * 0.045;
      SS.tl.fromTo(r.dot, { scale: 1 }, { scale: 1.75, duration: 0.13, ease: 'power2.out' }, at);
      SS.tl.fromTo(r.dot, { scale: 1.75 }, { scale: 1, duration: 0.32, ease: 'back.out(2.4)' }, at + 0.13);
    });
    SS.cue(T.wave, 'wave');

    // ---- headline (screen space)
    const layer = SS.el('div', 'layer', stage);
    const head = SS.text(layer, 'Une seule\n*structure.*', { size: 124, lh: 1.04 });
    SS.place(head.el, 540, 364);
    SS.hideWords(head);
    SS.wordsIn(head, T.head, { st: 0.08, dur: 0.7 });
    SS.wordsOut(head, T.headOut, { st: 0.03, dur: 0.26 });
    SS.cue(T.head, 'line');

    // ---- camera: identity at the swap (the world was reset while hidden), slow push, then focus
    SS.camTo(5.62, 0.02, 'power1.inOut', { x: 540, y: 960, s: 1, r: 0 }); // invisible reset (world hidden)
    SS.camTo(T.push, T.focus - T.push, 'sine.inOut', { y: 990, s: 1.045 });
    SS.camTo(T.focus, 0.5, SS.EZ.inOut, { y: ROW.y(HOT), s: 1.2 });
    // staging: the other rows and the header dim; row 03 gets a turquoise halo
    const dimmed = rows.filter((r, i) => i !== HOT).map((r) => r.el).concat([logo.el, label.el, div]);
    SS.tl.fromTo(dimmed, { opacity: 1 }, { opacity: 0.25, duration: 0.32, ease: 'power1.out' }, T.focus + 0.05);
    const halo = SS.el('div', 'a3', world);
    Object.assign(halo.style, { width: ROW.w + 16 + 'px', height: ROW.h + 16 + 'px', borderRadius: '24px',
      boxShadow: `0 0 0 3px ${SS.C.turq}, 0 0 40px 4px rgba(43,191,179,.35)` });
    SS.place(halo, D.x, ROW.y(HOT), { autoAlpha: 0, scale: 1.04 });
    SS.tl.fromTo(halo, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.36, ease: SS.EZ.out }, T.focus + 0.12);
    SS.tl.fromTo(halo, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.14, ease: 'power1.in' }, T.morph + 0.02);
    SS.cue(T.focus, 'focus');

    R = { layer, card, rows, logo, label };
    SS.dash = R;
  }

  const scene = { name: 'structure', a: 99, b: 99, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[SS.worldWrap, T.swap, 18.0], [R.layer, T.swap, 10.6]]; };
  SS.scenes.push(scene);
})();
