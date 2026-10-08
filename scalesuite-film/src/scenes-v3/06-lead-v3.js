/* Scene 8 · The lead, climax (18.0–25.0 s), in its own world layer with its own camera (cam8).
   a) The optimised ad (scene 7) is now the sponsored result: the search bar drops in and types
      "vendre maison Lévis", a finger taps the ad.
   b) The ad opens into the agency's landing page (its title flies to the hero line); the form fills
      itself; "Envoyer" is tapped.
   c) The page compresses into the dark LEAD VENDEUR token. The camera follows it down through the
      ScaleSuite node, along a route to Courtier 03's row (the row locks, the others dim, 80 ms
      freeze), then down to Courtier 03's phone.
   d) The token unfolds into the notification (12 % overshoot, haptic shake): "Le bon courtier le reçoit."
   Exit: the notification thins into the thesis divider while the phone drops away (scene 9). */
(function () {
  const SS = window.SS;
  const ROW = SS.ROW, HOT = SS.HOT;
  const AGENCY = '#2F5D8C';
  const T = { start: 18.0, bar: 18.02, head1: 18.05, type: 18.3, tap: 19.15, open: 19.3, bar2: 19.55, form: 19.62, f: [19.86, 20.02, 20.17],
    send: 20.42, squeeze: 20.5, label: 20.6, token: 20.9, node: 21.35, lock: 21.85, drop: 22.05, unfold: 22.5, head2: 22.75, crm: 23.0,
    out: 24.45, line: 24.55, end: 25.05 };
  const SEARCH = { y: 600, h: 112 }, ADY = SS.AD.screenY;
  const LP = { top: 470, h: 960, w: 900 };
  const NODE = { x: 540, y: 2250, r: 75 };
  const LIST = { top: 2420 };
  LIST.rowY = (i) => LIST.top + 20 + ROW.h / 2 + i * 80;
  LIST.h = 20 + 9 * 80 + ROW.h + 20;
  const AV = { x: 828, y: LIST.rowY(HOT) }; // where the token lands on row 03 (over its status, the name stays readable)
  const PH = { top: 3800, w: 820, h: 1700 }; // Courtier 03's phone (far enough below for the list to leave the frame)
  const NOTE = { w: 760, h: 300, y: PH.top + 600 };
  const CHIP = { x: 540 - NOTE.w / 2 + 30 + 202, y: NOTE.y - NOTE.h / 2 + 128, s: 0.88 };
  const CAMPH = PH.top + 490; // camera y that puts the phone's top at y 470 on screen
  SS.LINE = { y: 930, w: 780 }; // thesis divider (scene 9) — the notification becomes it
  const clip = (t, r, b, l, rad) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;
  const OPEN = clip(-80, -80, -80, -80, 114);
  const P = { u1: 0, u2: 0, u3: 0, ts: 1, chk: 0, shake: 0 };

  function tokenEl(parent) {
    const el = SS.el('div', 'a3', parent);
    Object.assign(el.style, { width: '460px', height: '100px', borderRadius: '50px', background: SS.C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px',
      color: '#fff', fontSize: '34px', fontWeight: 800, letterSpacing: '.06em', whiteSpace: 'nowrap', boxShadow: '0 18px 40px -16px rgba(0,0,0,.45)' });
    el.innerHTML = `<span style="width:20px;height:20px;border-radius:50%;background:${SS.C.turq};box-shadow:0 0 0 7px rgba(43,191,179,.28)"></span>LEAD VENDEUR`;
    return el;
  }

  let R;
  function build(stage) {
    const wrap = SS.el('div', 'world-wrap', stage);
    const w8 = SS.el('div', 'world', wrap);
    const cam8 = SS.camera({ x: 540, y: 960, s: 1, r: 0, blur: 0 });
    cam8.set({ x: 540, y: 960, s: 1, r: 0 });

    // ================================================================ a) search
    const ad = SS.adCard(w8, 'Vendre votre maison à Lévis');
    SS.place(ad.el, 540, ADY);
    const sbar = SS.el('div', 'a3', w8);
    Object.assign(sbar.style, { width: '900px', height: SEARCH.h + 'px', borderRadius: SEARCH.h / 2 + 'px', background: '#fff', display: 'flex', alignItems: 'center', gap: '22px', padding: '0 40px', boxSizing: 'border-box',
      boxShadow: '0 1px 2px rgba(18,44,40,.06), 0 14px 34px -14px rgba(18,74,66,.26), 0 0 0 1px rgba(26,26,26,.045)' });
    sbar.innerHTML = `<span style="width:44px;height:44px;display:block;flex:none">${SS.icon.search(SS.C.soft)}</span><span class="q" style="font-size:42px;font-weight:560;letter-spacing:-.015em;color:${SS.C.ink};white-space:pre"></span><span class="c" style="width:4px;height:46px;background:${SS.C.turq};margin-left:-18px"></span>`;
    SS.place(sbar, 540, SEARCH.y, { autoAlpha: 0, y: SEARCH.y - 120 });
    SS.tl.fromTo(sbar, { autoAlpha: 0, y: SEARCH.y - 120 }, { autoAlpha: 1, y: SEARCH.y, duration: 0.45, ease: SS.EZ.out }, T.bar);
    SS.typer(sbar.querySelector('.q'), [{ at: T.type, dur: 0.55, to: 'vendre maison Lévis' }], sbar.querySelector('.c'));
    const organic = [1065, 1255].map((y, k) => {
      const el = SS.el('div', 'a3', w8);
      Object.assign(el.style, { width: '900px', height: '160px', borderRadius: '26px', background: '#fff', padding: '30px 36px', boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(18,44,40,.06), 0 14px 34px -14px rgba(18,74,66,.2), 0 0 0 1px rgba(26,26,26,.04)' });
      el.innerHTML = `<div class="skel" style="width:${40 + k * 8}%;height:16px;background:#D6E6F3"></div><div class="skel" style="margin-top:20px;width:${70 - k * 10}%;height:22px;background:#CFDCEA"></div><div class="skel" style="margin-top:16px;width:58%;height:14px"></div>`;
      SS.place(el, 540, y, { autoAlpha: 0, y: y + 70 });
      SS.tl.fromTo(el, { autoAlpha: 0, y: y + 70 }, { autoAlpha: 1, y, duration: 0.5, ease: SS.EZ.out }, T.bar + 0.08 + k * 0.07);
      SS.tl.fromTo(el, { autoAlpha: 1, y }, { autoAlpha: 0, y: y + 420, duration: 0.34, ease: SS.EZ.in }, T.open + 0.02 + k * 0.03);
      return el;
    });
    // the tap
    const rip = SS.el('div', 'a3', w8);
    Object.assign(rip.style, { width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(43,191,179,.22)', boxShadow: `inset 0 0 0 4px ${SS.C.turq}` });
    SS.place(rip, 330, ADY + 10, { scale: 0.15, autoAlpha: 0 });
    SS.tl.fromTo(rip, { scale: 0.15, autoAlpha: 0.95 }, { scale: 1.5, autoAlpha: 0, duration: 0.55, ease: SS.EZ.out }, T.tap);
    SS.tl.fromTo(ad.el, { scale: 1 }, { scale: 0.975, duration: 0.08, ease: 'power2.out' }, T.tap);
    SS.tl.fromTo(ad.el, { scale: 0.975 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, T.tap + 0.08);
    SS.tl.fromTo(sbar, { autoAlpha: 1, y: SEARCH.y }, { autoAlpha: 0, y: SEARCH.y - 260, duration: 0.32, ease: SS.EZ.in }, T.open);
    SS.cue(T.tap, 'tap');

    // ================================================================ b) landing page
    const lp = SS.el('div', 'a3', w8);
    Object.assign(lp.style, { width: LP.w + 'px', height: LP.h + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 40px 80px -30px rgba(18,74,66,.40), 0 0 0 1px rgba(26,26,26,.05)' });
    const adTop = ADY - 125 - LP.top, adClip = clip(adTop, 0, LP.h - adTop - 250, 0, 26);
    SS.place(lp, 540, LP.top + LP.h / 2, { autoAlpha: 0, clipPath: adClip });
    SS.tl.set(lp, { autoAlpha: 1 }, T.open);
    SS.tl.fromTo(lp, { clipPath: adClip }, { clipPath: OPEN, duration: 0.46, ease: SS.EZ.inOut }, T.open);
    SS.tl.set(ad.el, { autoAlpha: 0 }, T.open + 0.47);
    SS.cue(T.open, 'open');
    const lbar = SS.el('div', 'a3', lp);
    Object.assign(lbar.style, { left: 0, top: 0, width: LP.w + 'px', height: '96px', borderRadius: '34px 34px 0 0', background: AGENCY, display: 'flex', alignItems: 'center', gap: '18px', padding: '0 36px', boxSizing: 'border-box' });
    lbar.innerHTML = `<span style="width:38px;height:38px;border-radius:10px;background:#fff;opacity:.92"></span><span style="font-size:30px;font-weight:800;letter-spacing:.12em;color:#fff">VOTRE AGENCE</span>
      <span style="margin-left:auto;width:80px;height:12px;border-radius:6px;background:rgba(255,255,255,.4)"></span><span style="width:80px;height:12px;border-radius:6px;background:rgba(255,255,255,.4)"></span>`;
    gsap.set(lbar, { yPercent: -100 });
    SS.tl.fromTo(lbar, { yPercent: -100 }, { yPercent: 0, duration: 0.42, ease: SS.EZ.out }, T.bar2);
    const lsub = SS.text(lp, 'Courtier 03 · Votre agence', { size: 32, weight: 600, color: SS.C.soft, align: 'left' });
    gsap.set(lsub.el, { x: 36, y: 210, xPercent: 0, yPercent: 0 });
    SS.hideWords(lsub);
    SS.wordsIn(lsub, T.bar2 + 0.12, { st: 0.04, dur: 0.5 });
    // ad title → landing hero (shared element)
    const tr = ad.tx.getBoundingClientRect();
    const fly = SS.el('div', 'a3', w8);
    Object.assign(fly.style, { left: tr.left + 'px', top: tr.top + 'px', fontSize: '44px', fontWeight: 650, letterSpacing: '-.02em', color: '#1F5FAD', whiteSpace: 'nowrap', lineHeight: getComputedStyle(ad.tx).lineHeight, transformOrigin: '0 0' });
    fly.textContent = 'Vendre votre maison à Lévis';
    gsap.set(fly, { autoAlpha: 0 });
    SS.tl.set(fly, { autoAlpha: 1 }, T.open);
    SS.tl.set(ad.ti, { autoAlpha: 0 }, T.open);
    const heroX = 90 + 36 - tr.left, heroY = LP.top + 120 - tr.top, hs = 56 / 44;
    SS.tl.fromTo(fly, { x: 0, y: 0, scale: 1, color: '#1F5FAD' }, { x: heroX, y: heroY, scale: hs, color: SS.C.ink, duration: 0.5, ease: SS.EZ.inOut }, T.open);
    SS.tl.fromTo(ad.sp, { yPercent: 0, autoAlpha: 1 }, { yPercent: -60, autoAlpha: 0, duration: 0.2, ease: SS.EZ.in }, T.open);
    // after the flight the hero is handed to an identical line inside the page (so the page clips it)
    const hero = SS.el('div', 'a3', lp);
    Object.assign(hero.style, { left: '36px', top: '120px', fontSize: '44px', fontWeight: 650, letterSpacing: '-.02em', color: SS.C.ink, whiteSpace: 'nowrap', lineHeight: fly.style.lineHeight, transformOrigin: '0 0', transform: `scale(${hs})` });
    hero.textContent = 'Vendre votre maison à Lévis';
    gsap.set(hero, { autoAlpha: 0 });
    SS.tl.set(hero, { autoAlpha: 1 }, T.open + 0.51);
    SS.tl.set(fly, { autoAlpha: 0 }, T.open + 0.51);
    // form
    const form = SS.el('div', 'a3', lp);
    Object.assign(form.style, { left: '30px', top: '270px', width: '840px', height: '520px', borderRadius: '26px', background: '#EEF4F9' });
    gsap.set(form, { autoAlpha: 0, y: 30 });
    SS.tl.fromTo(form, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: SS.EZ.out }, T.form);
    [['Type de propriété', 'Maison'], ['Ville', 'Lévis'], ['Délai de vente', '3 à 6 mois']].forEach(([lab, val], k) => {
      const top = 30 + k * 160;
      const l = SS.el('div', 'a3', form);
      Object.assign(l.style, { left: '30px', top: top + 'px', fontSize: '30px', fontWeight: 650, color: '#4A5F73' });
      l.textContent = lab;
      const box = SS.el('div', 'a3', form);
      Object.assign(box.style, { left: '30px', top: top + 46 + 'px', width: '780px', height: '86px', borderRadius: '18px', background: '#fff', boxShadow: 'inset 0 0 0 2px #D9E5F0',
        display: 'flex', alignItems: 'center', padding: '0 26px', boxSizing: 'border-box', fontSize: '40px', fontWeight: 650, color: SS.C.ink, whiteSpace: 'pre' });
      const tx = SS.el('span', '', box), ca = SS.el('span', '', box);
      Object.assign(ca.style, { width: '4px', height: '44px', marginLeft: '3px', background: AGENCY, opacity: 0 });
      SS.typer(tx, [{ at: T.f[k], dur: 0.14 + val.length * 0.006, to: val }], ca);
    });
    // "Envoyer" → LEAD VENDEUR
    const send = SS.el('div', 'a3', lp);
    Object.assign(send.style, { left: '30px', top: '820px', width: '840px', height: '100px', borderRadius: '50px', background: AGENCY, overflow: 'hidden' });
    send.innerHTML = `<div class="a" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:40px;font-weight:760;letter-spacing:-.01em">Envoyer</div>
      <div class="b" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;color:#fff;font-size:34px;font-weight:800;letter-spacing:.06em;white-space:nowrap"><span style="width:20px;height:20px;border-radius:50%;background:${SS.C.turq};box-shadow:0 0 0 7px rgba(43,191,179,.28)"></span>LEAD VENDEUR</div>
      <div class="r" style="position:absolute;left:330px;top:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.4)"></div>`;
    const sa = send.querySelector('.a'), sb = send.querySelector('.b'), sr = send.querySelector('.r');
    gsap.set(send, { autoAlpha: 0, scale: 0.9 }); gsap.set(sb, { yPercent: 110 }); gsap.set(sr, { scale: 0.1, autoAlpha: 0 });
    SS.tl.fromTo(send, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: SS.EZ.pop }, T.form + 0.12);
    SS.tl.fromTo(send, { scale: 1 }, { scale: 0.96, duration: 0.08, ease: 'power2.out' }, T.send);
    SS.tl.fromTo(send, { scale: 0.96 }, { scale: 1, duration: 0.24, ease: 'back.out(3)' }, T.send + 0.08);
    SS.tl.fromTo(sr, { scale: 0.1, autoAlpha: 0.9 }, { scale: 4, autoAlpha: 0, duration: 0.5, ease: SS.EZ.out }, T.send);
    SS.cue(T.send, 'send');
    // the page squeezes onto the button (anticipation), the button darkens into the token
    SS.tl.fromTo(lp, { scaleY: 1 }, { scaleY: 0.985, duration: 0.08, ease: 'power2.out' }, T.squeeze - 0.08);
    SS.tl.fromTo(lp, { scaleY: 0.985 }, { scaleY: 1, duration: 0.12, ease: 'power2.out' }, T.squeeze);
    SS.tl.fromTo(lp, { clipPath: OPEN }, { clipPath: clip(820, 30, LP.h - 920, 30, 50), duration: 0.24, ease: SS.EZ.in }, T.squeeze);
    SS.tl.fromTo(lp, { clipPath: clip(820, 30, LP.h - 920, 30, 50) }, { clipPath: clip(820, 220, LP.h - 920, 220, 50), duration: 0.14, ease: SS.EZ.out }, T.squeeze + 0.24);
    SS.tl.fromTo(send, { backgroundColor: AGENCY }, { backgroundColor: SS.C.ink, duration: 0.24, ease: 'power1.inOut' }, T.label - 0.04);
    SS.tl.fromTo(sa, { yPercent: 0 }, { yPercent: -110, duration: 0.16, ease: SS.EZ.in }, T.label);
    SS.tl.fromTo(sb, { yPercent: 110 }, { yPercent: 0, duration: 0.2, ease: SS.EZ.out }, T.label + 0.08); // settled at the token swap
    SS.cue(T.squeeze, 'squeeze');

    // ================================================================ c) routing
    const svg = SS.svg('svg', { class: 'lines', width: 1, height: 1 }, w8);
    const mk = (d, w, op) => SS.svg('path', { d, fill: 'none', stroke: SS.C.turq, 'stroke-width': w, 'stroke-opacity': op, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, svg);
    const A0 = { x: 540, y: LP.top + 870 }, N0 = { x: NODE.x, y: NODE.y - NODE.r }, N1 = { x: NODE.x, y: NODE.y + NODE.r };
    const curve = (a, b) => `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`;
    const PHT = { x: CHIP.x, y: CHIP.y };
    const route1 = mk(`M${A0.x},${A0.y + 50} L${N0.x},${N0.y}`, 5, 1);
    const route2 = mk(curve(N1, { x: AV.x, y: AV.y - 30 }), 5, 1);
    const route3 = mk(curve({ x: AV.x, y: AV.y + 30 }, { x: PHT.x, y: PH.top - 10 }), 5, 1);
    const ghosts = [0, 1, 3, 4].map((i) => mk(curve(N1, { x: 90 + 18 + 12 + 25 + (i % 2) * 380, y: LIST.rowY(i) - 30 }), 3, 0.25));
    SS.tl.fromTo(ghosts, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.5, stagger: 0.05, ease: SS.EZ.out }, T.node - 0.05);
    SS.tl.fromTo(route1, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: T.node - T.token, ease: SS.EZ.inOut }, T.token);
    SS.tl.fromTo(route2, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: T.lock - T.node - 0.07, ease: SS.EZ.inOut }, T.node + 0.07);
    SS.tl.fromTo(route3, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: T.unfold - T.drop, ease: SS.EZ.inOut }, T.drop);
    // once the token has arrived, the route retracts into the phone (it would cross the headline)
    SS.tl.fromTo(route3, { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -1 }, duration: 0.4, ease: SS.EZ.in }, T.unfold + 0.02);
    // node
    const node = SS.el('div', 'a3', w8);
    Object.assign(node.style, { width: NODE.r * 2 + 'px', height: NODE.r * 2 + 'px', borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 24px 50px -20px rgba(18,74,66,.45), 0 0 0 1px rgba(26,26,26,.05)' });
    const nl = SS.logo(node, 84, { word: false });
    nl.el.style.position = 'static'; nl.mark(1);
    SS.place(node, NODE.x, NODE.y, { scale: 0.4, autoAlpha: 0 });
    SS.tl.fromTo(node, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: SS.EZ.pop }, T.token + 0.1);
    const nring = SS.el('div', 'a3', w8);
    Object.assign(nring.style, { width: NODE.r * 2 + 'px', height: NODE.r * 2 + 'px', borderRadius: '50%', boxShadow: `0 0 0 4px ${SS.C.turq}` });
    SS.place(nring, NODE.x, NODE.y, { scale: 1, autoAlpha: 0 });
    SS.tl.fromTo(nring, { scale: 1, autoAlpha: 0.9 }, { scale: 1.9, autoAlpha: 0, duration: 0.6, ease: SS.EZ.out }, T.node);
    const nlab = SS.text(w8, 'ScaleSuite', { size: 36, weight: 760, color: SS.C.ink2, align: 'left' });
    gsap.set(nlab.el, { x: NODE.x + NODE.r + 26, y: NODE.y, xPercent: 0, yPercent: -50 });
    SS.hideWords(nlab);
    SS.wordsIn(nlab, T.token + 0.2, { dur: 0.5 });
    SS.cue(T.node, 'node');
    // the team list (same rows as the dashboard; every campaign is active now)
    const list = SS.el('div', 'a3', w8);
    Object.assign(list.style, { width: '900px', height: LIST.h + 'px', borderRadius: '34px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.07), 0 30px 60px -28px rgba(18,74,66,.38), 0 0 0 1px rgba(26,26,26,.05)' });
    SS.place(list, 540, LIST.top + LIST.h / 2);
    const rows = SS.ROWDATA.map((d, i) => {
      const el = SS.el('div', 'a3', w8);
      SS.rowStyle(el, i);
      el.innerHTML = SS.rowHTML(i);
      SS.place(el, 540, LIST.rowY(i));
      return el;
    });
    const halo = SS.el('div', 'a3', w8);
    Object.assign(halo.style, { width: ROW.w + 16 + 'px', height: ROW.h + 16 + 'px', borderRadius: '24px', boxShadow: `0 0 0 4px ${SS.C.turq}, 0 0 44px 6px rgba(43,191,179,.4)` });
    SS.place(halo, 540, LIST.rowY(HOT), { autoAlpha: 0, scale: 1.06 });
    SS.tl.fromTo(halo, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: SS.EZ.pop }, T.lock);
    SS.tl.fromTo(rows[HOT], { scale: 1, backgroundColor: '#ffffff' }, { scale: 1.03, backgroundColor: SS.C.mint, duration: 0.4, ease: SS.EZ.pop }, T.lock);
    SS.tl.fromTo(rows.filter((r, i) => i !== HOT), { opacity: 1 }, { opacity: 0.3, duration: 0.3, ease: 'power1.out' }, T.lock + 0.04);
    SS.cue(T.lock, 'lock');
    // the token travels: page → node → Courtier 03 → phone (procedural path, see render)
    const token = tokenEl(w8);
    gsap.set(token, { autoAlpha: 0 });
    SS.tl.set(token, { autoAlpha: 1 }, T.token);
    SS.tl.set(lp, { autoAlpha: 0 }, T.token);
    SS.tl.fromTo(P, { u1: 0 }, { u1: 1, duration: T.node - T.token, ease: SS.EZ.inOut }, T.token);
    SS.tl.fromTo(P, { ts: 1 }, { ts: 0.55, duration: 0.22, ease: SS.EZ.in }, T.node - 0.16);
    SS.tl.fromTo(P, { u2: 0 }, { u2: 1, duration: T.lock - T.node - 0.07, ease: SS.EZ.inOut }, T.node + 0.07);
    SS.tl.fromTo(P, { ts: 0.55 }, { ts: 0.62, duration: 0.3, ease: 'back.out(2)' }, T.node + 0.06);
    SS.tl.fromTo(P, { u3: 0 }, { u3: 1, duration: T.unfold - T.drop, ease: SS.EZ.inOut }, T.drop);
    SS.tl.fromTo(P, { ts: 0.62 }, { ts: CHIP.s, duration: T.unfold - T.drop, ease: SS.EZ.inOut }, T.drop);

    // ================================================================ d) the phone and the notification
    const shakeBox = SS.el('div', 'a3', w8);
    const phone = SS.el('div', 'a3', shakeBox);
    Object.assign(phone.style, { width: PH.w + 'px', height: PH.h + 'px', borderRadius: '112px', background: '#FBFDFD',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 50px 90px -40px rgba(18,74,66,.45), 0 0 0 2px #DCE6E4, inset 0 0 0 2px #fff' });
    phone.innerHTML = `<div style="position:absolute;inset:18px;border-radius:96px;background:linear-gradient(170deg,#F1FCFA 0%,#DDF5F1 60%,#CBEFEA 100%);overflow:hidden">
        <div style="position:absolute;left:50%;top:26px;width:150px;height:40px;margin-left:-75px;border-radius:20px;background:#D3DEDC"></div>
        <div class="lk" style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:34px;font-weight:600;color:${SS.C.soft}">mardi 14 octobre</div>
        <div class="lk" style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:170px;font-weight:300;letter-spacing:-.04em;color:${SS.C.ink2};line-height:1.1">10:24</div></div>`;
    SS.place(phone, 540, PH.top + PH.h / 2);
    const note = SS.el('div', 'a3', shakeBox);
    Object.assign(note.style, { width: NOTE.w + 'px', height: NOTE.h + 'px', borderRadius: '40px', background: '#fff',
      boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 30px 60px -24px rgba(18,74,66,.45), 0 0 0 1px rgba(26,26,26,.05)' });
    note.innerHTML = `<div class="nc" style="position:absolute;inset:0">
        <div style="position:absolute;left:30px;top:24px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:750;color:${SS.C.ink}"><span class="mk" style="width:40px;height:40px;display:block"></span>ScaleSuite</div>
        <div style="position:absolute;right:30px;top:28px;font-size:30px;font-weight:550;color:${SS.C.soft}">maintenant</div>
        <div style="position:absolute;left:${30 + 405 + 22}px;top:${128 - 26}px;font-size:40px;font-weight:780;letter-spacing:-.02em;color:${SS.C.ink};white-space:nowrap">Nouveau lead</div>
        <div style="position:absolute;left:30px;top:186px;font-size:32px;font-weight:600;color:${SS.C.soft};white-space:nowrap">Vendeur · Lévis · Maison</div>
        <div style="position:absolute;left:30px;top:236px;display:flex;align-items:center;gap:12px;font-size:32px;font-weight:720;color:${SS.C.green};white-space:nowrap"><span class="ck" style="width:36px;height:36px;display:block"></span>Ajouté à votre CRM</div></div>`;
    const nm = SS.logo(note.querySelector('.mk'), 40, { word: false });
    nm.el.style.position = 'static'; nm.mark(1);
    const chk = SS.check(note.querySelector('.ck'), 36, SS.C.green);
    const nc = note.querySelector('.nc');
    const noteClip = clip(128 - 44, NOTE.w - 30 - 405, NOTE.h - 128 - 44, 30, 44);
    SS.place(note, 540, NOTE.y, { autoAlpha: 0, clipPath: noteClip });
    shakeBox.appendChild(token); // above the notification
    SS.tl.set(note, { autoAlpha: 1 }, T.unfold);
    SS.tl.fromTo(note, { clipPath: noteClip }, { clipPath: OPEN, duration: 0.55, ease: SS.EZ.pop12 }, T.unfold);
    gsap.set(nc, { autoAlpha: 0 });
    SS.tl.fromTo(nc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }, T.unfold + 0.12);
    SS.tl.fromTo(P, { chk: 0 }, { chk: 1, duration: 0.5, ease: 'none' }, T.crm); // check.set() eases internally
    SS.tl.fromTo(P, { shake: 0 }, { shake: 1, duration: 0.42, ease: 'none' }, T.unfold + 0.08); // haptic envelope (decay in render)
    const glow = SS.el('div', 'a3', shakeBox);
    Object.assign(glow.style, { width: NOTE.w + 'px', height: NOTE.h + 'px', borderRadius: '44px', boxShadow: `0 0 0 4px ${SS.C.turq}, 0 0 60px 10px rgba(43,191,179,.4)` });
    SS.place(glow, 540, NOTE.y, { autoAlpha: 0, scale: 0.96 });
    SS.tl.fromTo(glow, { autoAlpha: 0.9, scale: 0.96 }, { autoAlpha: 0, scale: 1.12, duration: 0.8, ease: SS.EZ.out }, T.unfold + 0.15);
    shakeBox.insertBefore(glow, note);
    SS.cue(T.unfold, 'notify'); SS.cue(T.unfold + 0.08, 'haptic'); SS.cue(T.crm, 'crm');

    // ---- exit: the phone drops away, the notification thins into the divider
    SS.tl.fromTo(phone, { y: PH.top + PH.h / 2 }, { y: PH.top + PH.h / 2 + 1700, duration: 0.45, ease: SS.EZ.in }, T.line - 0.05);
    const lineY = CAMPH + (SS.LINE.y - 960);
    SS.tl.fromTo(nc, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.16, ease: 'power1.in' }, T.line);
    SS.tl.fromTo(note, { y: NOTE.y, scaleX: 1, scaleY: 1, backgroundColor: '#ffffff' },
      { y: lineY, scaleX: SS.LINE.w / NOTE.w, scaleY: 6 / NOTE.h, backgroundColor: SS.C.turq, duration: 0.48, ease: SS.EZ.inOut }, T.line);
    SS.tl.fromTo(note, { boxShadow: '0 2px 4px rgba(18,44,40,.08), 0 30px 60px -24px rgba(18,74,66,.45), 0 0 0 1px rgba(26,26,26,.05)' },
      { boxShadow: '0 2px 4px rgba(18,44,40,0), 0 30px 60px -24px rgba(18,74,66,0), 0 0 0 1px rgba(26,26,26,0)', duration: 0.3, ease: 'power1.in' }, T.line);
    SS.tl.fromTo(P, { ts: CHIP.s }, { ts: 0, duration: 0.3, ease: SS.EZ.in }, T.line);
    SS.cue(T.line, 'line8');

    // ================================================================ camera (cam8)
    cam8.to(T.token - 0.02, T.node - T.token + 0.02, 'power2.inOut', { y: 1880, s: 0.92 });
    cam8.fx(T.token + 0.05, 0.16, 'power2.in', { blur: 0 }, { blur: 6 });
    cam8.fx(T.token + 0.21, 0.2, 'power2.out', { blur: 6 }, { blur: 0 });
    cam8.to(T.node, T.lock - T.node, SS.EZ.inOut, { y: 2560, s: 1 });
    cam8.to(T.drop, T.unfold - T.drop + 0.04, SS.EZ.inOut, { y: CAMPH });
    cam8.fx(T.drop + 0.08, 0.15, 'power2.in', { blur: 0 }, { blur: 7 });
    cam8.fx(T.drop + 0.23, 0.2, 'power2.out', { blur: 7 }, { blur: 0 });

    // ================================================================ headlines (screen space)
    const layer = SS.el('div', 'layer', stage);
    const h1 = SS.text(layer, 'Un *lead* entre.', { size: 124, maxW: 940 });
    SS.place(h1.el, 540, 330);
    SS.hideWords(h1);
    SS.wordsIn(h1, T.head1, { st: 0.07 });
    SS.wordsOut(h1, T.label, { st: 0.02 });
    const h2 = SS.text(layer, 'Le *bon_courtier*\nle reçoit.', { size: 116, maxW: 940, lh: 1.04 });
    SS.place(h2.el, 540, 300);
    SS.hideWords(h2);
    SS.wordsIn(h2, T.head2, { st: 0.07 });
    SS.wordsOut(h2, T.out, { st: 0.02 });
    SS.cue(T.head1, 'line'); SS.cue(T.head2, 'line');

    R = { wrap, w8, cam8, token, chk, shakeBox, layer };
  }

  const bez = (a, b, u) => { // cubic with vertical tangents (matches curve())
    const my = (a.y + b.y) / 2, m = 1 - u;
    return { x: m * m * m * a.x + 3 * m * m * u * a.x + 3 * m * u * u * b.x + u * u * u * b.x, y: m * m * m * a.y + 3 * m * m * u * my + 3 * m * u * u * my + u * u * u * b.y };
  };
  function render(t) {
    const c = R.cam8.p;
    R.w8.style.transform = SS.camMatrix(c);
    SS.blur(R.wrap, c.blur);
    // token path
    let pos = { x: 540, y: LP.top + 870 };
    if (P.u1 > 0) pos = { x: 540, y: pos.y + (NODE.y - pos.y) * P.u1 };
    if (P.u2 > 0) pos = bez({ x: NODE.x, y: NODE.y }, AV, P.u2);
    if (P.u3 > 0) pos = bez(AV, { x: CHIP.x, y: CHIP.y }, P.u3);
    const pulse = t > T.lock && t < T.drop ? 1 + 0.06 * Math.sin((t - T.lock) * 30) : 1;
    R.token.style.transform = `translate(${pos.x.toFixed(2)}px,${pos.y.toFixed(2)}px) translate(-50%,-50%) scale(${(P.ts * pulse).toFixed(4)})`;
    // haptic: three damped oscillations
    const k = P.shake;
    const dx = k > 0 && k < 1 ? 7 * Math.sin(k * Math.PI * 2 * 3) * (1 - k) : 0;
    R.shakeBox.style.transform = `translate(${dx.toFixed(2)}px,0px)`;
    R.chk.set(P.chk);
  }

  const scene = { name: 'lead', a: -1, b: 99, render, ranges: [] };
  scene.build = (stage) => { build(stage); scene.ranges = [[R.wrap, T.start, T.end], [R.layer, T.start, T.end]]; };
  SS.scenes.push(scene);
})();
