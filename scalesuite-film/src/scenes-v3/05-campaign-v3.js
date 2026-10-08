/* Scenes 5–7 · Créées. / Suivies. / Optimisées. (10.7–18.0 s), one campaign workspace in the world.
   5: row 03 opens into the campaign card (shared element: the card starts as an exact copy of the
      row). Fields type themselves, the landing page builds in the agency's colours, the ad is
      written, the "Lancer" button is pressed and the status flips Brouillon → Active.
   6: the camera tilts down the same card to "Performance": counters roll up, the weekly curve
      draws itself, the Leads tile ticks +1 (camera zoom on it).
   7: whip right to the "Optimisation" panel: a keyword grows, a weak one is struck and leaves, a
      new one slides in, the ad headline is rewritten, a toast confirms. The camera then pushes into
      the ad while the panel tightens around it: the ad becomes the sponsored search result (scene 8). */
(function () {
  const SS = window.SS;
  const ROW = SS.ROW, HOT = SS.HOT, D = SS.DASH;
  const C = { left: D.left, w: D.w, top: ROW.top0 + HOT * ROW.pitch, h: 1660 };
  C.cy = C.top + C.h / 2;
  const O = { cx: 1500, w: 900, top: C.top + 1040, h: 920 };
  O.cy = O.top + O.h / 2;
  const AD = { scale: 0.85, y: O.top + 646, screenY: 820 }; // ad preview (scene 8 picks it up at screenY)
  SS.AD = AD;
  const T = { morph: 10.72, head1: 11.02, title: 11.05, f1: 11.4, f2: 11.62, thumb: 11.95, f4: 12.4, tap: 13.18, launch: 13.26,
    tilt: 13.7, swap1: 13.86, perf: 13.9, count: 14.12, chart: 14.25, zoom: 14.95, plus: 15.2, whip: 15.62, swap2: 15.74,
    opt: 15.95, grow: 16.25, strike: 16.45, add: 16.9, rewrite: 16.95, toast: 17.33, headOut: 17.5, push: 17.6, end: 18.0 };
  const AGENCY = '#2F5D8C'; // "your agency's colours" (not ScaleSuite's)
  const clip = (t, r, b, l, rad) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;
  const OPEN = clip(-80, -80, -80, -80, 114); // fully open, shadow included

  // Sponsored result card, shared by the optimisation panel (world) and the search page (scene 8).
  SS.adCard = (parent, title) => {
    const el = SS.el('div', 'a3', parent);
    Object.assign(el.style, { width: '900px', height: '250px', borderRadius: '26px', background: '#fff', boxSizing: 'border-box', padding: '30px 36px',
      boxShadow: '0 1px 2px rgba(18,44,40,.06), 0 14px 34px -14px rgba(18,74,66,.26), 0 0 0 1px rgba(26,26,26,.045)' });
    el.innerHTML = `<div class="sp" style="font-size:30px;font-weight:750;color:${SS.C.ink};white-space:nowrap">Sponsorisé<span style="font-weight:500;color:${SS.C.soft}"> · votreagence.ca</span></div>
      <div class="ti" style="margin-top:10px;height:56px;font-size:44px;font-weight:650;letter-spacing:-.02em;color:#1F5FAD;white-space:nowrap"><span class="tx">${title}</span><span class="ca" style="display:inline-block;width:4px;height:44px;margin-left:3px;vertical-align:-6px;background:${SS.C.turq};opacity:0"></span></div>
      <div class="skel" style="margin-top:22px;width:78%;height:14px"></div><div class="skel" style="margin-top:12px;width:52%;height:14px"></div>`;
    return { el, sp: el.querySelector('.sp'), ti: el.querySelector('.ti'), tx: el.querySelector('.tx'), ca: el.querySelector('.ca') };
  };

  // label + typed value (skeleton until typing starts)
  function field(parent, top, label, w = 840) {
    const lab = SS.text(parent, label, { size: 30, weight: 650, color: SS.C.soft, tracking: -0.01, align: 'left' });
    gsap.set(lab.el, { x: 30, y: top, xPercent: 0, yPercent: 0 });
    SS.hideWords(lab);
    const sk = SS.el('div', 'a3 skel', parent);
    Object.assign(sk.style, { left: '30px', top: top + 58 + 'px', width: Math.min(w, 420) + 'px', height: '18px', transformOrigin: 'left center' });
    const val = SS.el('div', 'a3', parent);
    Object.assign(val.style, { left: '30px', top: top + 44 + 'px', height: '50px', fontSize: '40px', fontWeight: 680, letterSpacing: '-.015em', color: SS.C.ink, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' });
    const tx = SS.el('span', '', val);
    const ca = SS.el('span', '', val);
    Object.assign(ca.style, { width: '4px', height: '42px', marginLeft: '3px', background: SS.C.turq, opacity: 0 });
    return { lab, sk, val, tx, ca };
  }

  let R;
  function build(stage) {
    const world = SS.world;
    // ================================================================ campaign card (scene 5–6)
    const card = SS.el('div', 'a3', world);
    Object.assign(card.style, { width: C.w + 'px', height: C.h + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 40px 80px -30px rgba(18,74,66,.40), 0 0 0 1px rgba(26,26,26,.05)' });
    const ROWCLIP = clip(0, 18, C.h - ROW.h, 18, 18);
    SS.place(card, 540, C.cy, { autoAlpha: 0, clipPath: ROWCLIP });
    SS.tl.set(card, { autoAlpha: 1 }, T.morph);
    SS.tl.fromTo(card, { clipPath: ROWCLIP }, { clipPath: OPEN, duration: 0.55, ease: SS.EZ.inOut }, T.morph);
    SS.cue(T.morph, 'morph');
    // header line = an exact copy of dashboard row 03 (so the card starts as the row)
    const line = SS.el('div', 'a3', card);
    SS.rowStyle(line, HOT);
    line.innerHTML = SS.rowHTML(HOT, { draft: true });
    Object.assign(line.style, { left: '18px', top: '0px' });
    const st = line.querySelector('.st');
    st.style.position = 'relative';
    st.innerHTML = `<span class="pill" style="position:absolute;left:-18px;right:-18px;top:-9px;bottom:-9px;border-radius:999px;background:${SS.C.mint};box-shadow:inset 0 0 0 2px rgba(43,191,179,.45)"></span>
      <span class="sd" style="position:relative;width:14px;height:14px;border-radius:50%;background:#B7C2C0"></span>
      <span style="position:relative;display:inline-block;overflow:hidden;height:40px;line-height:40px"><span class="s1" style="display:block">Brouillon</span><span class="s2" style="position:absolute;left:0;top:0;color:${SS.C.green}">Active</span></span>`;
    const pill = st.querySelector('.pill'), sd = st.querySelector('.sd'), s1 = st.querySelector('.s1'), s2 = st.querySelector('.s2');
    gsap.set(pill, { scale: 0.5, autoAlpha: 0 });
    gsap.set(s2, { yPercent: 110 });
    // title + divider
    const title = SS.el('div', 'a3', card);
    Object.assign(title.style, { left: '30px', top: '100px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '46px', fontWeight: 760, letterSpacing: '-.025em', whiteSpace: 'nowrap', overflow: 'hidden', height: '62px' });
    title.innerHTML = `<span style="display:inline-flex;gap:16px;align-items:center" class="w3"><span style="width:44px;height:44px;display:block">${SS.icon.target(SS.C.green)}</span>Campagne Google Ads</span>`;
    const titleIn = title.querySelector('.w3');
    gsap.set(titleIn, { yPercent: 130 });
    SS.tl.fromTo(titleIn, { yPercent: 130 }, { yPercent: 0, duration: 0.6, ease: SS.EZ.out }, T.title);
    const div = SS.el('div', 'a3', card);
    Object.assign(div.style, { left: '30px', top: '180px', width: '840px', height: '2px', background: '#EDF3F2', transformOrigin: 'left center' });
    gsap.set(div, { scaleX: 0 });
    SS.tl.fromTo(div, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: SS.EZ.out }, T.title + 0.05);

    // fields
    const F = [field(card, 200, 'Type de campagne'), field(card, 312, 'Territoire'), field(card, 424, 'Page de destination'), field(card, 790, 'Annonce')];
    F[2].sk.style.display = 'none'; F[2].val.style.display = 'none';
    F.forEach((f, k) => SS.wordsIn(f.lab, T.title + 0.12 + k * 0.06, { st: 0.04, dur: 0.55 }));
    F[3].tx.style.color = '#1F5FAD';
    F[3].tx.style.fontWeight = 650;
    const typed = [[F[0], 'Vendeur', T.f1, 0.22], [F[1], 'Lévis · rayon de 15 km', T.f2, 0.42], [F[3], 'Vendre votre propriété à Lévis', T.f4, 0.5]];
    typed.forEach(([f, txt, at, dur]) => {
      SS.tl.fromTo(f.sk, { scaleX: 1 }, { scaleX: 0, duration: 0.16, ease: SS.EZ.in }, at - 0.08);
      SS.typer(f.tx, [{ at, dur, to: txt }], f.ca);
    });
    // landing page thumbnail, agency colours
    const th = SS.el('div', 'a3', card);
    Object.assign(th.style, { left: '30px', top: '470px', width: '840px', height: '300px', borderRadius: '22px', overflow: 'hidden', background: '#EEF4F9', boxShadow: 'inset 0 0 0 2px rgba(47,93,140,.12)' });
    th.innerHTML = `<div class="bar" style="position:absolute;left:0;right:0;top:0;height:70px;background:${AGENCY};display:flex;align-items:center;gap:16px;padding:0 26px">
        <span style="width:30px;height:30px;border-radius:8px;background:#fff;opacity:.9"></span>
        <span style="font-size:30px;font-weight:800;letter-spacing:.12em;color:#fff">VOTRE AGENCE</span>
        <span style="margin-left:auto;width:70px;height:10px;border-radius:5px;background:rgba(255,255,255,.4)"></span><span style="width:70px;height:10px;border-radius:5px;background:rgba(255,255,255,.4)"></span></div>
      <div style="position:absolute;left:30px;top:100px;height:60px;overflow:hidden"><div class="hero" style="font-size:44px;font-weight:800;letter-spacing:-.025em;color:${SS.C.ink};white-space:nowrap">Vendre votre maison à Lévis</div></div>
      <div style="position:absolute;left:30px;top:166px;height:44px;overflow:hidden"><div class="sub" style="font-size:30px;font-weight:600;color:${SS.C.soft};white-space:nowrap">Courtier 03 · Votre agence</div></div>
      <div class="btn" style="position:absolute;right:30px;bottom:28px;height:62px;padding:0 30px;border-radius:31px;background:${AGENCY};color:#fff;font-size:30px;font-weight:720;display:flex;align-items:center">Me contacter</div>`;
    const bar = th.querySelector('.bar'), hero = th.querySelector('.hero'), sub = th.querySelector('.sub'), btn = th.querySelector('.btn');
    gsap.set(th, { autoAlpha: 0, y: 24 });
    SS.tl.fromTo(th, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: SS.EZ.out }, T.title + 0.3);
    gsap.set(bar, { yPercent: -100 }); gsap.set([hero, sub], { yPercent: 120 }); gsap.set(btn, { scale: 0, autoAlpha: 0 });
    SS.tl.fromTo(bar, { yPercent: -100 }, { yPercent: 0, duration: 0.4, ease: SS.EZ.out }, T.thumb);
    SS.tl.fromTo(hero, { yPercent: 120 }, { yPercent: 0, duration: 0.5, ease: SS.EZ.out }, T.thumb + 0.1);
    SS.tl.fromTo(sub, { yPercent: 120 }, { yPercent: 0, duration: 0.5, ease: SS.EZ.out }, T.thumb + 0.17);
    SS.tl.fromTo(btn, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.42, ease: SS.EZ.pop }, T.thumb + 0.26);
    SS.cue(T.thumb, 'thumb');
    // launch button
    const launch = SS.el('div', 'a3', card);
    Object.assign(launch.style, { left: '30px', top: '920px', width: '840px', height: '100px', borderRadius: '50px', overflow: 'hidden',
      background: 'linear-gradient(135deg,#2BBFB3 0%,#1D9E75 100%)', boxShadow: '0 20px 40px -18px rgba(29,158,117,.6), inset 0 1px 0 rgba(255,255,255,.25)' });
    launch.innerHTML = `<div class="l1" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:16px;color:#fff;font-size:40px;font-weight:760;letter-spacing:-.02em">Lancer la campagne<span style="width:40px;height:40px;display:block">${SS.icon.arrow('#fff')}</span></div>
      <div class="mint" style="position:absolute;inset:0;background:${SS.C.mint};box-shadow:inset 0 0 0 3px rgba(43,191,179,.55);border-radius:50px"></div>
      <div class="l2" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:16px;color:${SS.C.green};font-size:42px;font-weight:780;letter-spacing:-.02em"><span style="width:20px;height:20px;border-radius:50%;background:${SS.C.green};box-shadow:0 0 0 7px rgba(29,158,117,.18)"></span>Active</div>
      <div class="rip" style="position:absolute;left:520px;top:-70px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.45)"></div>`;
    const l1 = launch.querySelector('.l1'), l2 = launch.querySelector('.l2'), rip = launch.querySelector('.rip'), mint = launch.querySelector('.mint');
    // (no clip until it turns into the pill, so it keeps its shadow)
    gsap.set(launch, { autoAlpha: 0, y: 20 }); gsap.set(l2, { yPercent: 110 }); gsap.set(rip, { scale: 0.1, autoAlpha: 0 }); gsap.set(mint, { autoAlpha: 0 });
    SS.tl.fromTo(launch, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: SS.EZ.out }, T.title + 0.42);
    // tap: anticipation squash, ripple, follow-through; then the status flips with a 12 % pop
    SS.tl.fromTo(launch, { scale: 1 }, { scale: 0.965, duration: 0.08, ease: 'power2.out' }, T.tap);
    SS.tl.fromTo(launch, { scale: 0.965 }, { scale: 1, duration: 0.36, ease: 'back.out(3)' }, T.tap + 0.08);
    SS.tl.fromTo(rip, { scale: 0.1, autoAlpha: 0.9 }, { scale: 4, autoAlpha: 0, duration: 0.6, ease: SS.EZ.out }, T.tap + 0.02);
    SS.tl.fromTo(l1, { yPercent: 0 }, { yPercent: -110, duration: 0.24, ease: SS.EZ.in }, T.launch);
    SS.tl.fromTo(l2, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: SS.EZ.out }, T.launch + 0.16);
    // the button becomes the campaign's status: it tightens into an "● Active" pill (≈ 10 % overshoot)
    SS.tl.fromTo(mint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' }, T.launch + 0.06);
    SS.tl.set(launch, { clipPath: 'inset(0px 0px 0px 0px round 50px)' }, T.launch + 0.055);
    SS.tl.fromTo(launch, { clipPath: 'inset(0px 0px 0px 0px round 50px)' }, { clipPath: 'inset(0px 230px 0px 230px round 50px)', duration: 0.5, ease: SS.EZ.pop }, T.launch + 0.06);
    SS.tl.fromTo(s1, { yPercent: 0 }, { yPercent: -110, duration: 0.22, ease: SS.EZ.in }, T.launch + 0.04);
    SS.tl.fromTo(s2, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: SS.EZ.out }, T.launch + 0.12);
    SS.tl.fromTo(sd, { backgroundColor: '#B7C2C0' }, { backgroundColor: SS.C.green, duration: 0.3, ease: 'power1.out' }, T.launch + 0.1);
    SS.tl.fromTo(pill, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: SS.EZ.pop12 }, T.launch + 0.1);
    SS.cue(T.tap, 'tap'); SS.cue(T.launch, 'launch');

    // ---- performance (scene 6)
    const perf = SS.el('div', 'a3', card);
    Object.assign(perf.style, { left: '0px', top: '1070px', width: C.w + 'px', height: '590px' });
    const ptitle = SS.el('div', 'a3', perf);
    Object.assign(ptitle.style, { left: '30px', top: '0px', height: '56px', overflow: 'hidden', fontSize: '42px', fontWeight: 760, letterSpacing: '-.02em', whiteSpace: 'nowrap' });
    ptitle.innerHTML = '<div class="w3">Performance</div>';
    const pchip = SS.el('div', 'a3 chip3', perf);
    Object.assign(pchip.style, { left: 'auto', right: '30px', top: '4px', fontSize: '30px', height: '48px', padding: '0 18px', boxSizing: 'border-box' });
    pchip.textContent = 'Suivi hebdomadaire';
    const ptIn = ptitle.querySelector('.w3');
    gsap.set(ptIn, { yPercent: 120 }); gsap.set(pchip, { scale: 0.6, autoAlpha: 0 });
    SS.tl.fromTo(ptIn, { yPercent: 120 }, { yPercent: 0, duration: 0.5, ease: SS.EZ.out }, T.perf);
    SS.tl.fromTo(pchip, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: SS.EZ.pop }, T.perf + 0.1);
    const TILES = [['Impressions', 2418], ['Clics', 186], ['Leads', 6]];
    const tiles = TILES.map(([lab, v], k) => {
      const el = SS.el('div', 'a3', perf);
      Object.assign(el.style, { left: 30 + k * 288 + 'px', top: '75px', width: '264px', height: '200px', borderRadius: '24px', background: '#F4FAF9', boxShadow: 'inset 0 0 0 2px #E6F0EE' });
      el.innerHTML = `<div style="position:absolute;left:24px;top:22px;font-size:30px;font-weight:650;color:${SS.C.soft}">${lab}</div>
        <div class="v" style="position:absolute;left:24px;top:72px;font-size:72px;font-weight:800;letter-spacing:-.03em;font-feature-settings:'tnum' 1;color:${k === 2 ? SS.C.green : SS.C.ink}">0</div>`;
      gsap.set(el, { autoAlpha: 0, scale: 0.94, y: 18 });
      SS.tl.fromTo(el, { autoAlpha: 0, scale: 0.94, y: 18 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: SS.EZ.dock }, T.perf + 0.06 + k * 0.06);
      return { el, v: el.querySelector('.v') };
    });
    SS.counter(tiles[0].v, [{ at: T.count, dur: 1.1, from: 0, to: 2418 }]);
    SS.counter(tiles[1].v, [{ at: T.count + 0.08, dur: 1.0, from: 0, to: 186 }]);
    SS.counter(tiles[2].v, [{ at: T.count + 0.16, dur: 0.9, from: 0, to: 6 }, { at: T.plus, dur: 0.16, from: 6, to: 7, ease: 'power2.out' }]);
    SS.cue(T.count, 'count');
    // +1 on the Leads tile
    const plus = SS.el('div', 'a3 chip3', perf);
    Object.assign(plus.style, { left: 30 + 2 * 288 + 150 + 'px', top: '40px', fontSize: '32px', height: '52px', padding: '0 18px', boxSizing: 'border-box', background: SS.C.green, color: '#fff', boxShadow: '0 10px 22px -10px rgba(29,158,117,.7)' });
    plus.textContent = '+1';
    gsap.set(plus, { autoAlpha: 0, scale: 0.4, y: 20 });
    SS.tl.fromTo(plus, { autoAlpha: 0, scale: 0.4, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: SS.EZ.pop12 }, T.plus);
    const tring = SS.el('div', 'a3', perf);
    Object.assign(tring.style, { left: 30 + 2 * 288 - 6 + 'px', top: '69px', width: '276px', height: '212px', borderRadius: '28px', boxShadow: `0 0 0 3px ${SS.C.turq}, 0 0 36px 2px rgba(43,191,179,.35)` });
    gsap.set(tring, { autoAlpha: 0, scale: 1.06 });
    SS.tl.fromTo(tring, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: SS.EZ.out }, T.plus);
    SS.cue(T.plus, 'plusone');
    // weekly curve: line draws left → right, the area follows, the end dot pops
    const CW = 840, CH = 250;
    const pts = [0.18, 0.26, 0.22, 0.38, 0.47, 0.58, 0.8].map((v, k) => [20 + (k * (CW - 40)) / 6, CH - 40 - v * (CH - 70)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], mx = (x0 + x1) / 2;
      d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    const chart = SS.el('div', 'a3', perf);
    Object.assign(chart.style, { left: '30px', top: '300px', width: CW + 'px', height: CH + 30 + 'px' });
    const svg = SS.svg('svg', { width: CW, height: CH, viewBox: `0 0 ${CW} ${CH}` }, chart);
    svg.style.overflow = 'visible';
    const defs = SS.svg('defs', {}, svg);
    const grad = SS.svg('linearGradient', { id: 'perfg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    SS.svg('stop', { offset: 0, 'stop-color': SS.C.turq, 'stop-opacity': 0.28 }, grad);
    SS.svg('stop', { offset: 1, 'stop-color': SS.C.turq, 'stop-opacity': 0 }, grad);
    [0.25, 0.5, 0.75].forEach((g) => SS.svg('line', { x1: 0, x2: CW, y1: g * CH, y2: g * CH, stroke: '#E6EFEE', 'stroke-width': 2 }, svg));
    const area = SS.svg('path', { d: `${d} L${pts[6][0]},${CH} L${pts[0][0]},${CH} Z`, fill: 'url(#perfg)' }, svg);
    const path = SS.svg('path', { d, fill: 'none', stroke: SS.C.turq, 'stroke-width': 6, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, svg);
    const dot = SS.svg('circle', { cx: pts[6][0], cy: pts[6][1], r: 13, fill: SS.C.green, stroke: '#fff', 'stroke-width': 5 }, svg);
    const days = SS.el('div', 'a3', chart);
    Object.assign(days.style, { left: '0px', top: CH + 'px', width: CW + 'px', display: 'flex', justifyContent: 'space-between', padding: '0 8px', boxSizing: 'border-box', fontSize: '30px', fontWeight: 650, color: SS.C.faint });
    days.innerHTML = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((c) => `<span>${c}</span>`).join('');
    gsap.set(path, { attr: { 'stroke-dashoffset': 1 } });
    gsap.set(area, { clipPath: 'inset(0px 100% 0px 0px)' });
    gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(days, { autoAlpha: 0, y: 12 });
    SS.tl.fromTo(path, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.85, ease: SS.EZ.inOut }, T.chart);
    SS.tl.fromTo(area, { clipPath: 'inset(0px 100% 0px 0px)' }, { clipPath: 'inset(0px 0% 0px 0px)', duration: 0.85, ease: SS.EZ.inOut }, T.chart);
    SS.tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, T.chart + 0.8);
    SS.tl.fromTo(days, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: SS.EZ.out }, T.chart - 0.1);
    SS.cue(T.chart, 'chart', { dur: 0.85 });

    // ================================================================ optimisation panel (scene 7)
    const opt = SS.el('div', 'a3', world);
    Object.assign(opt.style, { width: O.w + 'px', height: O.h + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 40px 80px -30px rgba(18,74,66,.40), 0 0 0 1px rgba(26,26,26,.05)' });
    SS.place(opt, O.cx, O.cy, { clipPath: OPEN });
    const oh = SS.el('div', 'a3', opt);
    Object.assign(oh.style, { left: '30px', top: '34px', height: '62px', overflow: 'hidden', fontSize: '46px', fontWeight: 760, letterSpacing: '-.025em', whiteSpace: 'nowrap' });
    oh.innerHTML = '<div class="w3">Optimisation</div>';
    const ohIn = oh.querySelector('.w3');
    const by = SS.text(opt, 'Par notre IA et notre équipe.', { size: 30, weight: 600, color: SS.C.soft, tracking: -0.01, align: 'left' });
    gsap.set(by.el, { x: 30, y: 108, xPercent: 0, yPercent: 0 });
    const kwl = SS.text(opt, 'Mots-clés', { size: 30, weight: 650, color: SS.C.soft, align: 'left' });
    gsap.set(kwl.el, { x: 30, y: 178, xPercent: 0, yPercent: 0 });
    gsap.set(ohIn, { yPercent: 120 }); SS.hideWords(by); SS.hideWords(kwl);
    SS.tl.fromTo(ohIn, { yPercent: 120 }, { yPercent: 0, duration: 0.55, ease: SS.EZ.out }, T.opt);
    SS.wordsIn(by, T.opt + 0.08, { st: 0.04, dur: 0.55 });
    SS.wordsIn(kwl, T.opt + 0.12, { dur: 0.5 });
    const KW = [['courtier immobilier lévis', 0.62, SS.C.green], ['propriété à vendre lévis', 0.45, SS.C.green], ['évaluation gratuite', 0.14, '#E8A33D'], ['vendre maison lévis', 0.7, SS.C.green]];
    const kws = KW.map(([txt, v, col], k) => {
      const el = SS.el('div', 'a3', opt);
      const slot = Math.min(k, 2);
      Object.assign(el.style, { left: '30px', top: 226 + slot * 90 + 'px', width: '840px', height: '76px', borderRadius: '18px', background: k % 2 ? '#F6FBFA' : '#fff',
        boxShadow: 'inset 0 0 0 2px #EEF4F3', display: 'flex', alignItems: 'center', gap: '18px', padding: '0 22px', boxSizing: 'border-box', whiteSpace: 'nowrap' });
      el.innerHTML = `<span class="kt" style="position:relative;font-size:36px;font-weight:650;letter-spacing:-.015em;color:${SS.C.ink}">${txt}<span class="strike" style="position:absolute;left:-4px;right:-4px;top:52%;height:4px;border-radius:2px;background:${SS.C.ink}"></span></span>
        ${k === 3 ? `<span class="chip3" style="position:static;font-size:30px;height:46px;padding:0 15px;box-sizing:border-box">Ajouté</span>` : ''}
        <span style="margin-left:auto;position:relative;width:170px;height:16px;border-radius:8px;background:#EAF1F0"><span class="fill" style="position:absolute;left:0;top:0;bottom:0;width:170px;border-radius:8px;background:${col};transform-origin:left center"></span></span>`;
      const fill = el.querySelector('.fill'), strike = el.querySelector('.strike');
      gsap.set(fill, { scaleX: v }); gsap.set(strike, { scaleX: 0, transformOrigin: 'left center' });
      if (k < 3) {
        gsap.set(el, { autoAlpha: 0, y: 20 });
        SS.tl.fromTo(el, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: SS.EZ.out }, T.opt + 0.15 + k * 0.05);
      }
      return { el, fill, strike };
    });
    // a keyword grows, a weak one is struck and leaves, a new one slides into its slot
    SS.tl.fromTo(kws[1].fill, { scaleX: 0.45 }, { scaleX: 0.9, duration: 0.5, ease: SS.EZ.dock }, T.grow);
    SS.tl.fromTo(kws[2].strike, { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: SS.EZ.out }, T.strike);
    SS.tl.fromTo(kws[2].el, { x: 0, autoAlpha: 1 }, { x: -120, autoAlpha: 0, duration: 0.26, ease: SS.EZ.in }, T.strike + 0.24);
    gsap.set(kws[3].el, { x: 140, autoAlpha: 0 });
    SS.tl.fromTo(kws[3].el, { x: 140, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: SS.EZ.dock }, T.add);
    SS.cue(T.grow, 'grow'); SS.cue(T.strike, 'strike'); SS.cue(T.add, 'add');
    const adl = SS.text(opt, 'Annonce', { size: 30, weight: 650, color: SS.C.soft, align: 'left' });
    gsap.set(adl.el, { x: 30, y: 490, xPercent: 0, yPercent: 0 });
    SS.hideWords(adl);
    SS.wordsIn(adl, T.opt + 0.3, { dur: 0.5 });
    const toast = SS.el('div', 'a3 chip3', opt);
    Object.assign(toast.style, { left: '450px', top: '820px', fontSize: '32px', height: '62px', padding: '0 24px 0 16px', boxSizing: 'border-box', gap: '12px' });
    toast.innerHTML = `<span class="ck" style="width:36px;height:36px;display:block"></span>Optimisation appliquée`;
    const tck = SS.check(toast.querySelector('.ck'), 36, SS.C.green);
    gsap.set(toast, { xPercent: -50, autoAlpha: 0, scale: 0.7, y: 16 });
    SS.tl.fromTo(toast, { autoAlpha: 0, scale: 0.7, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: SS.EZ.pop }, T.toast);
    const P = { ck: 0 };
    SS.tl.fromTo(P, { ck: 0 }, { ck: 1, duration: 0.45, ease: 'none' }, T.toast + 0.08); // check.set() eases internally
    SS.cue(T.toast, 'toast');
    // the ad (a sibling of the panel, so the panel's clip never cuts its shadow)
    const ad = SS.adCard(world, 'Vendre votre propriété à Lévis');
    SS.place(ad.el, O.cx, AD.y, { scale: AD.scale, autoAlpha: 0, y: AD.y + 20 });
    SS.tl.fromTo(ad.el, { autoAlpha: 0, y: AD.y + 20 }, { autoAlpha: 1, y: AD.y, duration: 0.5, ease: SS.EZ.out }, T.opt + 0.32);
    SS.typer(ad.tx, [{ at: 0, dur: 0.001, to: 'Vendre votre propriété à Lévis', silent: true }, { at: T.rewrite, dur: 0.4, to: 'Vendre votre maison à Lévis' }], ad.ca);
    // zoom-through: the panel tightens around the ad while the camera pushes in
    const adH = 250 * AD.scale, adW = 900 * AD.scale, adTop = AD.y - O.top - adH / 2;
    SS.tl.fromTo(opt, { clipPath: OPEN }, { clipPath: clip(adTop, (O.w - adW) / 2, O.h - adTop - adH, (O.w - adW) / 2, 22), duration: 0.36, ease: SS.EZ.inOut }, T.push);
    SS.cue(T.push, 'push');

    // ================================================================ headline (screen space)
    const layer = SS.el('div', 'layer', stage);
    const sc = SS.scrim(layer, 520);
    gsap.set(sc, { autoAlpha: 0 });
    SS.tl.fromTo(sc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power1.out' }, T.morph + 0.15);
    SS.tl.fromTo(sc, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, T.headOut + 0.1);
    const band = SS.band(layer, 190, 220);
    const W = ['Créées.', 'Suivies.', '*Optimisées.*'].map((w) => {
      const tx = SS.text(band, w, { size: 150, maxW: 940, tracking: -0.045 });
      SS.place(tx.el, 540, 100);
      SS.hideWords(tx);
      return tx;
    });
    SS.wordsIn(W[0], T.head1, { dur: 0.7 });
    SS.wordsOut(W[0], T.swap1, { dur: 0.16 });
    SS.wordsIn(W[1], T.swap1 + 0.12, { dur: 0.45 });
    SS.wordsOut(W[1], T.swap2, { dur: 0.16 });
    SS.wordsIn(W[2], T.swap2 + 0.12, { dur: 0.45 });
    SS.wordsOut(W[2], T.headOut, { dur: 0.24 });
    SS.cue(T.head1, 'word', { k: 0 }); SS.cue(T.swap1 + 0.12, 'word', { k: 1 }); SS.cue(T.swap2 + 0.12, 'word', { k: 2 });

    // ================================================================ camera
    SS.camTo(10.75, 0.6, SS.EZ.cam, { y: C.top + 340, s: 1.16 });
    SS.camTo(11.9, 0.6, SS.EZ.inOut, { y: C.top + 640 });
    SS.camTo(12.92, 0.4, SS.EZ.inOut, { y: C.top + 700, s: 1.06 });
    SS.camTo(T.tilt, 0.5, SS.EZ.inOut, { y: C.top + 1330, s: 1.08 });
    SS.camTo(T.zoom, 0.4, SS.EZ.inOut, { x: 700, y: C.top + 1250, s: 1.28 });
    SS.camTo(T.whip, 0.36, 'expo.inOut', { x: O.cx, y: O.top + 330, s: 1.12 });
    SS.camFx(T.whip + 0.04, 0.16, 'power2.in', { blur: 0 }, { blur: 8 });
    SS.camFx(T.whip + 0.2, 0.2, 'power2.out', { blur: 8 }, { blur: 0 });
    SS.camTo(16.92, 0.45, SS.EZ.inOut, { y: O.top + 470 });
    const sAd = 1 / AD.scale; // the ad reaches scale 1 on screen, centred on the search layout's card
    SS.camTo(T.push, 0.38, SS.EZ.inOut, { y: AD.y + (960 - AD.screenY) / sAd, s: sAd });
    SS.cue(T.whip, 'whip');

    R = { layer, tck, P, ad };
  }

  function render() { R.tck.set(R.P.ck); }
  const scene = { name: 'campaign', a: -1, b: 99, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.layer, 10.7, T.end]]; };
  SS.scenes.push(scene);
})();
