/* S5 Personalization at scale (11.1–14.9).
   Row "Courtier 01" lifts out of the dashboard and becomes one generic campaign card. It
   duplicates into four; each copy rolls in its own broker, campaign type, territory and landing
   page headline — while every landing page keeps the same agency colours. */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;
  const T = { lift: 11.08, morph: 11.5, h1: 11.4, dup: 11.86, fill: 12.28, h2: 12.9, sweep: 13.35, out: 14.28, stack: 14.6, end: 15.12 };
  const CARD = SS.pick({ w: 456, h: 440, thumbH: 196, hero: 30, name: 27, chip: 21 }, { w: 420, h: 340, thumbH: 140, hero: 25, name: 23, chip: 18 });
  const SLOTS = SS.pick([{ x: 300, y: 790 }, { x: 780, y: 790 }, { x: 300, y: 1256 }, { x: 780, y: 1256 }],
    [{ x: 308, y: 650 }, { x: 772, y: 650 }, { x: 308, y: 1012 }, { x: 772, y: 1012 }]);
  const CENTER = SS.pick({ x: 540, y: 1020, s: 1.12 }, { x: 540, y: 830, s: 1.1 });
  const STACK = SS.pick({ x: 540, y: 1060 }, { x: 540, y: 840 });
  SS.STACK = STACK; SS.CARD = CARD;
  const HEAD = SS.pick({ y1: 290, y2: 402, size: 92, maxW: 930 }, { y1: 132, y2: 228, size: 84, maxW: 960 });
  const DATA = [
    { n: '01', type: 'Vendeur', area: 'Lévis', hero: 'Vendre à Lévis' },
    { n: '02', type: 'Acheteur', area: 'Québec', hero: 'Acheter à Québec' },
    { n: '03', type: 'Vendeur', area: 'Rive-Sud', hero: 'Vendre sur la Rive-Sud' },
    { n: '04', type: 'Acheteur', area: 'Beauce', hero: 'Acheter en Beauce' },
  ];

  function field(parent, style, html, skelW, skelH) {
    const box = SS.el('div', '', parent);
    Object.assign(box.style, { position: 'absolute' }, style);
    const sk = SS.el('div', 'skel', box);
    Object.assign(sk.style, { position: 'absolute', left: 0, top: '50%', width: skelW + 'px', height: skelH + 'px', transform: 'translateY(-50%)', borderRadius: skelH / 2 + 'px' });
    const m = SS.el('span', 'm', box);
    const w = SS.el('span', 'w', m, html);
    return { box, sk, w };
  }

  function makeCard(root, d) {
    const el = SS.el('div', 'abs card', root);
    Object.assign(el.style, { width: CARD.w + 'px', height: CARD.h + 'px', overflow: 'hidden' });
    const content = SS.el('div', '', el);
    Object.assign(content.style, { position: 'absolute', inset: 0 });
    content.innerHTML = `
      <div style="position:absolute;left:18px;top:14px;display:flex;align-items:center;gap:8px;font-size:${CARD.chip - 2}px;font-weight:650;color:${SS.C.soft}"><span class="ico" style="font-size:${CARD.chip}px">${SS.icon.target(SS.C.green)}</span>Campagne Google Ads</div>
      <div style="position:absolute;right:18px;top:15px;display:flex;align-items:center;gap:7px;font-size:${CARD.chip - 3}px;font-weight:650;color:${SS.C.green}"><span style="width:9px;height:9px;border-radius:50%;background:${SS.C.green}"></span>Active</div>`;
    // landing page thumbnail (agency colours are identical on every copy)
    const th = SS.el('div', '', content);
    const tw = CARD.w - 32;
    Object.assign(th.style, { position: 'absolute', left: '16px', top: '50px', width: tw + 'px', height: CARD.thumbH + 'px', borderRadius: '14px', overflow: 'hidden', background: 'linear-gradient(160deg,#F2FBFA,#DDF3EF)', boxShadow: 'inset 0 0 0 1px rgba(26,26,26,.06)' });
    th.innerHTML = `<div style="position:absolute;left:0;right:0;top:0;height:30px;background:${SS.C.ink2};display:flex;align-items:center;padding:0 12px;gap:8px">
        <span style="width:14px;height:14px;border-radius:4px;background:${SS.C.turq}"></span>
        <span style="font-size:11px;font-weight:800;letter-spacing:.14em;color:#fff">VOTRE AGENCE</span>
        <span style="margin-left:auto;width:34px;height:5px;border-radius:3px;background:rgba(255,255,255,.35)"></span>
        <span style="width:34px;height:5px;border-radius:3px;background:rgba(255,255,255,.35)"></span></div>
      <div class="skel" style="position:absolute;left:18px;top:${CARD.thumbH * 0.62}px;width:${tw * 0.52}px;height:9px;background:rgba(26,26,26,.1)"></div>
      <div class="skel" style="position:absolute;left:18px;top:${CARD.thumbH * 0.62 + 16}px;width:${tw * 0.36}px;height:9px;background:rgba(26,26,26,.08)"></div>
      <div style="position:absolute;right:16px;bottom:14px;height:26px;padding:0 14px;border-radius:13px;background:${SS.C.green};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center">Me contacter</div>`;
    const hero = field(th, { left: '18px', top: CARD.thumbH * 0.3 + 'px', height: CARD.hero * 1.3 + 'px', fontSize: CARD.hero + 'px', fontWeight: 800, letterSpacing: '-.025em', whiteSpace: 'nowrap', color: SS.C.ink }, d.hero, tw * 0.62, 16);
    const fy = 50 + CARD.thumbH + SS.pick(22, 16);
    const av = SS.el('div', 'avatar', content, SS.icon.person());
    Object.assign(av.style, { position: 'absolute', left: '18px', top: fy + 'px', width: SS.pick(46, 40) + 'px', height: SS.pick(46, 40) + 'px' });
    const name = field(content, { left: SS.pick(76, 70) + 'px', top: fy + SS.pick(5, 3) + 'px', height: SS.pick(36, 34) + 'px', fontSize: CARD.name + 'px', fontWeight: 720, letterSpacing: '-.02em', whiteSpace: 'nowrap' }, 'Courtier ' + d.n, 140, 14);
    const cy = fy + SS.pick(66, 54);
    const type = field(content, { left: '18px', top: cy + 'px', height: CARD.chip * 2.1 + 'px' },
      `<span class="chip mint" style="font-size:${CARD.chip}px;box-shadow:none;padding:.42em .85em">${d.type}</span>`, 104, CARD.chip * 1.9);
    const typeW = type.w.getBoundingClientRect().width;
    const area = field(content, { left: (18 + typeW + 10) + 'px', top: cy + 'px', height: CARD.chip * 2.1 + 'px' },
      `<span class="chip" style="font-size:${CARD.chip}px;padding:.42em .85em .42em .6em"><span class="ico">${SS.icon.pin(SS.C.green)}</span>${d.area}</span>`, 120, CARD.chip * 1.9);
    const ring = SS.el('div', '', area.box);
    Object.assign(ring.style, { position: 'absolute', left: '-6px', top: '-6px', right: '-6px', bottom: '-6px', borderRadius: '999px', boxShadow: `0 0 0 3px ${SS.C.turq}`, opacity: 0 });
    [type, area].forEach((f) => { f.box.querySelector('.m').style.padding = '6px'; f.box.querySelector('.m').style.margin = '-6px'; });
    return { el, content, fields: [hero, name, type, area], ring };
  }

  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    root.style.perspective = '1800px';
    const cards = DATA.map((d) => makeCard(root, d));
    // morphing panel (dashboard row → card)
    const panel = SS.el('div', 'abs', root);
    Object.assign(panel.style, { background: '#fff', boxShadow: 'var(--shadow)', overflow: 'hidden' });
    // the lifted dashboard row keeps its content while it grows into the card
    const rowC = SS.el('div', '', panel);
    const rh = SS.hubRow(0).h;
    Object.assign(rowC.style, { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: rh + 'px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 14px', fontSize: SS.HUB.font + 'px', fontWeight: 650, letterSpacing: '-.015em', whiteSpace: 'nowrap' });
    rowC.innerHTML = `<span class="avatar" style="width:${rh - 16}px;height:${rh - 16}px;flex:none">${SS.icon.person()}</span><span>Courtier 01</span>
      <span class="chip mint" style="font-size:.74em;padding:.32em .7em;box-shadow:none">Vendeur</span>`;
    root.appendChild(cards[0].el); // card 0 on top of its copies
    const h1 = SS.text(root, 'Centralisé.', { size: HEAD.size, maxW: HEAD.maxW });
    const h2 = SS.text(root, 'Mais *personnalisé.*', { size: HEAD.size, maxW: HEAD.maxW });
    R = { root, cards, panel, rowC, h1, h2 };
  }

  function render(t) {
    // ---- panel morph from the dashboard row
    const HUB = SS.HUB, row = SS.hubRow(0), push = 1.025;
    const r0 = { x: HUB.x, y: HUB.y + (row.y - HUB.y) * push, w: row.w * push, h: row.h * push };
    const km = p(t, T.lift, T.morph, E.inOut);
    const w = lerp(r0.w, CARD.w * CENTER.s, km), h = lerp(r0.h, CARD.h * CENTER.s, km);
    R.panel.style.width = w.toFixed(1) + 'px';
    R.panel.style.height = h.toFixed(1) + 'px';
    R.panel.style.borderRadius = lerp(14, 26 * CENTER.s, km).toFixed(1) + 'px';
    R.panel.style.background = km < 0.5 ? '#F6FBFA' : '#fff';
    SS.set(R.panel, { x: lerp(r0.x, CENTER.x, km), y: lerp(r0.y, CENTER.y, km) - Math.sin(Math.PI * km) * 40, o: t >= T.lift && t < T.morph + 0.12 ? 1 : 0 });
    R.rowC.style.opacity = (1 - p(t, T.lift + 0.14, T.lift + 0.3, E.linear)).toFixed(3);
    R.rowC.style.transform = `translateY(-50%) scale(${lerp(1, 1.25, km).toFixed(3)})`;
    R.rowC.style.transformOrigin = 'left center';

    // ---- cards
    R.cards.forEach((c, i) => {
      const kd = p(t, T.dup + i * 0.075, T.dup + i * 0.075 + 0.62, E.out);
      const s0 = SLOTS[i];
      let x = lerp(CENTER.x, s0.x, kd), y = lerp(CENTER.y, s0.y, kd) - Math.sin(Math.PI * kd) * (i === 0 ? 0 : 50);
      let s = lerp(i === 0 ? CENTER.s : CENTER.s * 0.92, 1, kd);
      let ry = i === 0 ? 0 : Math.sin(Math.PI * kd) * (s0.x < 540 ? -16 : 16);
      let r = 0, blur = i === 0 ? 0 : Math.sin(Math.PI * kd) * 3.2;
      let o = i === 0 ? (t >= T.morph ? 1 : 0) : (kd > 0.001 ? 1 : 0);
      // idle float
      const fl = p(t, T.dup + 0.6, T.dup + 1.2, E.inOut) * (1 - p(t, T.out, T.out + 0.1));
      y += Math.sin(t * 1.7 + i * 1.3) * 4 * fl;
      ry += Math.sin(t * 1.1 + i) * 2 * fl;
      // converge into a stack for S6
      const ks = p(t, T.out, T.stack, E.inOut);
      x = lerp(x, STACK.x + (i - 1.5) * 10, ks); y = lerp(y, STACK.y + (i - 1.5) * -8, ks);
      s = lerp(s, 0.96, ks); r = lerp(r, [-5, 3, -2, 5][i], ks); ry = lerp(ry, 0, ks);
      // the stack sinks away into the dark stage opening behind it
      const sink = p(t, 14.62 + i * 0.03, 15.08 + i * 0.03, E.inOut);
      SS.set(c.el, { x, y: y + sink * 90, s: s * lerp(1, 0.8, sink), r, ry, rx: sink * 18, o: o * (1 - p(t, 14.8 + i * 0.03, 15.08 + i * 0.03, E.linear)), blur: blur + sink * 7 });
      c.content.style.opacity = i === 0 ? p(t, T.morph - 0.12, T.morph + 0.08, E.linear).toFixed(3) : '1';
      // personalise fields
      c.fields.forEach((f, j) => {
        const kf = p(t, T.fill + i * 0.12 + j * 0.06, T.fill + i * 0.12 + j * 0.06 + 0.55, E.out);
        f.sk.style.opacity = (1 - clamp(kf * 2)).toFixed(3);
        f.w.style.transform = `translateY(${((1 - kf) * SS.HIDE).toFixed(2)}%)`;
      });
      const ksw = Math.sin(Math.PI * p(t, T.sweep + i * 0.2, T.sweep + i * 0.2 + 0.55, E.linear));
      c.ring.style.opacity = ksw.toFixed(3);
    });

    // ---- headline
    SS.set(R.h1.el, { x: 540, y: HEAD.y1 });
    SS.words(R.h1, t, { inT: T.h1, outT: T.out });
    R.h1.el.style.color = SS.C.ink;
    SS.set(R.h2.el, { x: 540, y: HEAD.y2 });
    SS.words(R.h2, t, { inT: T.h2, st: 0.09, outT: T.out + 0.03 });
  }

  SS.scenes.push({ name: 'personal', a: T.lift - 0.02, b: T.end, build, render });
})();
