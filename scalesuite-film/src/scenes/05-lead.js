/* S7 The lead (18.0–21.7).
   The dark stage has contracted into a search bar; a query types; a sponsored result appears; a
   tap turns it into one clean object — LEAD VENDEUR — that rides one continuous route:
   Google Ads → ScaleSuite → Courtier 03 (the right broker, highlighted) → CRM. */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;
  const T = { head1: 18.12, type0: 18.42, type1: 19.02, ad: 18.98, tap: 19.34, route: 19.2, pill: 19.42,
    seg1: [19.48, 19.86], seg2: [19.98, 20.4], seg3: [20.5, 20.86], head2: 19.9, out: 21.3, end: 21.75 };
  const QUERY = 'vendre maison Lévis';
  const S = SS.SEARCH;
  const G = SS.pick({
    head1: 330, head2: 346, hSize: 104, h2Size: 100, ad: { x: 540, y: 826, w: 900, h: 196 }, node: { x: 540, y: 1086, r: 54 },
    brokers: { y: 1270, xs: [196, 418, 662, 884] }, crm: { x: 662, y: 1452, w: 250, h: 84 }, cam: -84, qSize: 36,
  }, {
    head1: 150, head2: 170, hSize: 88, h2Size: 84, ad: { x: 540, y: 556, w: 900, h: 160 }, node: { x: 540, y: 742, r: 46 },
    brokers: { y: 900, xs: [196, 418, 662, 884] }, crm: { x: 662, y: 1072, w: 240, h: 78 }, cam: -42, qSize: 32,
  });
  const HOT = 2; // Courtier 03
  SS.LEAD = G;

  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const lines = SS.svg('svg', { class: 'lines', width: SS.W, height: SS.H }, root);
    // search bar
    const bar = SS.el('div', 'abs', root);
    Object.assign(bar.style, { width: S.w + 'px', height: S.h + 'px', borderRadius: S.h / 2 + 'px', background: '#fff', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', padding: '0 34px', gap: '20px', boxSizing: 'border-box' });
    const ic = SS.el('span', 'ico', bar, SS.icon.search(SS.C.soft));
    ic.style.width = ic.style.height = S.h * 0.36 + 'px';
    ic.querySelector('svg').style.width = ic.querySelector('svg').style.height = '100%';
    const q = SS.el('span', '', bar);
    Object.assign(q.style, { fontSize: G.qSize + 'px', fontWeight: 550, letterSpacing: '-.015em', color: SS.C.ink, whiteSpace: 'pre' });
    const caret = SS.el('span', '', bar);
    Object.assign(caret.style, { width: '3px', height: G.qSize * 1.1 + 'px', background: SS.C.turq, marginLeft: '-16px' });
    // sponsored result
    const ad = SS.el('div', 'abs card', root);
    Object.assign(ad.style, { width: G.ad.w + 'px', height: G.ad.h + 'px', borderRadius: '26px', padding: SS.pick('26px 34px', '20px 32px'), boxSizing: 'border-box' });
    ad.innerHTML = `<div style="display:flex;align-items:center;gap:12px;font-size:${SS.pick(21, 19)}px;font-weight:750;color:${SS.C.ink}">Sponsorisé<span style="font-weight:500;color:${SS.C.soft}">· votreagence.ca</span></div>
      <div style="margin-top:${SS.pick(12, 8)}px;font-size:${SS.pick(34, 30)}px;font-weight:650;letter-spacing:-.02em;color:#1F5FAD">Vendre votre propriété à Lévis</div>
      <div class="skel" style="margin-top:${SS.pick(16, 12)}px;width:78%;height:12px"></div>
      <div class="skel" style="margin-top:10px;width:52%;height:12px"></div>`;
    const ripple = SS.el('div', 'abs', root);
    Object.assign(ripple.style, { width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(43,191,179,.25)', boxShadow: `inset 0 0 0 3px ${SS.C.turq}` });
    // route structure
    const mkPath = (op, wdt) => SS.svg('path', { fill: 'none', stroke: SS.C.turq, 'stroke-opacity': op, 'stroke-width': wdt, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, lines);
    const dim = { a: mkPath(0.3, 2.5), b: G.brokers.xs.map(() => mkPath(0.3, 2.5)), c: mkPath(0.3, 2.5) };
    const hot = { a: mkPath(1, 4.5), b: mkPath(1, 4.5), c: mkPath(1, 4.5) };
    const node = SS.el('div', 'abs', root);
    Object.assign(node.style, { width: G.node.r * 2 + 'px', height: G.node.r * 2 + 'px', borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow)', display: 'grid', placeItems: 'center' });
    const nodeRing = SS.el('div', 'abs', root);
    Object.assign(nodeRing.style, { width: G.node.r * 2 + 'px', height: G.node.r * 2 + 'px', borderRadius: '50%', boxShadow: `0 0 0 3px ${SS.C.turq}` });
    const nlogo = SS.logo(node, G.node.r * 1.05, { word: false });
    nlogo.el.style.position = 'static'; nlogo.el.style.transform = 'none';
    nlogo.mark(1);
    const nodeLabel = SS.el('div', 'abs', root, 'ScaleSuite');
    Object.assign(nodeLabel.style, { fontSize: SS.pick(24, 21) + 'px', fontWeight: 750, letterSpacing: '-.02em', color: SS.C.ink2 });
    const gLabel = SS.el('div', 'abs', root, 'Google Ads');
    Object.assign(gLabel.style, { fontSize: SS.pick(22, 19) + 'px', fontWeight: 700, color: SS.C.soft, letterSpacing: '-.01em' });
    const brokers = G.brokers.xs.map((bx, i) => {
      const el = SS.el('div', 'abs', root);
      const av = SS.pick(74, 64);
      el.innerHTML = `<div class="avatar" style="width:${av}px;height:${av}px;margin:0 auto;border-radius:50%;box-shadow:0 8px 20px -10px rgba(18,74,66,.4)">${SS.icon.person()}</div>
        <div class="bl" style="margin-top:10px;text-align:center;font-size:${SS.pick(21, 18)}px;font-weight:700;white-space:nowrap;color:${SS.C.soft}">Courtier ${String(i + 1).padStart(2, '0')}</div>`;
      const ring = SS.el('div', '', el);
      Object.assign(ring.style, { position: 'absolute', left: '50%', top: 0, width: av + 'px', height: av + 'px', marginLeft: -av / 2 + 'px', borderRadius: '50%', boxShadow: `0 0 0 4px ${SS.C.turq}, 0 0 30px 4px rgba(43,191,179,.45)`, opacity: 0 });
      return { el, ring, label: el.querySelector('.bl'), x: bx, av };
    });
    const crm = SS.el('div', 'abs card', root);
    Object.assign(crm.style, { width: G.crm.w + 'px', height: G.crm.h + 'px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', padding: '0 22px', boxSizing: 'border-box', fontSize: SS.pick(28, 25) + 'px', fontWeight: 780, letterSpacing: '-.01em' });
    crm.innerHTML = `<span class="ico" style="font-size:${SS.pick(34, 30)}px">${SS.icon.crm(SS.C.green)}</span><span>CRM</span>`;
    const crmChk = SS.check(crm, SS.pick(40, 36), SS.C.green);
    crmChk.el.style.marginLeft = 'auto';
    const recu = SS.el('div', 'abs', root, 'Lead reçu');
    Object.assign(recu.style, { fontSize: SS.pick(24, 21) + 'px', fontWeight: 700, color: SS.C.green });
    // the lead
    const pill = SS.el('div', 'abs chip dark', root);
    Object.assign(pill.style, { fontSize: SS.pick(25, 22) + 'px', fontWeight: 800, letterSpacing: '.06em', padding: '.72em 1.15em .72em .95em', gap: '.6em' });
    pill.innerHTML = `<span style="width:.62em;height:.62em;border-radius:50%;background:${SS.C.turq};box-shadow:0 0 0 5px rgba(43,191,179,.25)"></span>LEAD VENDEUR`;
    // headlines
    const h1 = SS.text(root, 'Un lead entre.', { size: G.hSize, maxW: 930 });
    const h2 = SS.text(root, 'Le *bon_courtier*\nle reçoit.', { size: G.h2Size, maxW: 930, lh: 1.1 });
    R = { root, lines, bar, q, caret, ad, ripple, dim, hot, node, nodeRing, nodeLabel, gLabel, brokers, crm, crmChk, recu, pill, h1, h2 };
  }

  const vline = (a, b) => `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  const curve = (a, b) => `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${a.x.toFixed(1)},${lerp(a.y, b.y, 0.62).toFixed(1)} ${b.x.toFixed(1)},${lerp(a.y, b.y, 0.38).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  function curveAt(a, b, u) {
    const c1 = { x: a.x, y: lerp(a.y, b.y, 0.62) }, c2 = { x: b.x, y: lerp(a.y, b.y, 0.38) }, m = 1 - u;
    return { x: m * m * m * a.x + 3 * m * m * u * c1.x + 3 * m * u * u * c2.x + u * u * u * b.x, y: m * m * m * a.y + 3 * m * m * u * c1.y + 3 * m * u * u * c2.y + u * u * u * b.y };
  }

  function leadPos(t, cam) {
    const A = { x: G.ad.x, y: G.ad.y + cam }, N = { x: G.node.x, y: G.node.y + cam };
    const B = { x: G.brokers.xs[HOT], y: G.brokers.y + cam }, Cc = { x: G.crm.x, y: G.crm.y + cam };
    const u1 = p(t, T.seg1[0], T.seg1[1], E.inOut), u2 = p(t, T.seg2[0], T.seg2[1], E.inOut), u3 = p(t, T.seg3[0], T.seg3[1], E.inOut);
    if (t < T.seg2[0]) return { x: A.x, y: lerp(A.y, N.y, u1), u1, u2, u3 };
    if (t < T.seg3[0]) { const q = curveAt(N, B, u2); return { x: q.x, y: q.y, u1, u2, u3 }; }
    return { x: B.x, y: lerp(B.y, Cc.y, u3), u1, u2, u3 };
  }

  function render(t) {
    const cam = G.cam * p(t, T.pill, T.seg3[1] + 0.1, E.inOutSoft);
    const out = p(t, T.out, T.out + 0.35, E.inOut);
    const fadeAll = 1 - out;
    const lift = -out * 40;
    // search bar (takes over from the S6 panel at T.bar)
    SS.set(R.bar, { x: S.x, y: S.y + cam + lift, o: (t >= 18.3 ? 1 : 0) * fadeAll });
    const n = Math.round(QUERY.length * p(t, T.type0, T.type1, E.linear));
    R.q.textContent = QUERY.slice(0, n);
    R.caret.style.opacity = t > T.type1 + 0.35 || Math.floor((t - 18.3) * 3) % 2 === 1 ? 0 : 1;
    // ad
    const ka = p(t, T.ad, T.ad + 0.5, E.out);
    const press = Math.sin(Math.PI * p(t, T.tap, T.tap + 0.22, E.linear));
    SS.set(R.ad, { x: G.ad.x, y: G.ad.y + cam + (1 - ka) * 40 + lift, s: lerp(0.96, 1, ka) * (1 - press * 0.02), o: Math.min(ka * 1.3, fadeAll) });
    const kr = p(t, T.tap, T.tap + 0.55, E.out);
    SS.set(R.ripple, { x: G.ad.x - 120, y: G.ad.y + cam + 4, s: lerp(0.15, 1.3, kr), o: t > T.tap ? (1 - kr) * 0.9 : 0 });

    // route structure
    const kR = (d) => p(t, T.route + d, T.route + d + 0.5, E.out);
    const A = { x: G.ad.x, y: G.ad.y + G.ad.h / 2 + cam }, N = { x: G.node.x, y: G.node.y + cam };
    const Nb = { x: N.x, y: N.y + G.node.r };
    const Bt = (i) => ({ x: G.brokers.xs[i], y: G.brokers.y + cam - SS.pick(37, 32) });
    const Bb = { x: G.brokers.xs[HOT], y: G.brokers.y + cam + SS.pick(72, 62) };
    const Ct = { x: G.crm.x, y: G.crm.y + cam - G.crm.h / 2 };
    R.dim.a.setAttribute('d', vline(A, { x: N.x, y: N.y - G.node.r }));
    R.dim.a.setAttribute('stroke-dashoffset', (1 - kR(0)).toFixed(4));
    R.dim.b.forEach((pth, i) => { pth.setAttribute('d', curve(Nb, Bt(i))); pth.setAttribute('stroke-dashoffset', (1 - kR(0.12 + i * 0.05)).toFixed(4)); });
    R.dim.c.setAttribute('d', vline(Bb, Ct));
    R.dim.c.setAttribute('stroke-dashoffset', (1 - kR(0.3)).toFixed(4));
    [R.dim.a, R.dim.c, ...R.dim.b].forEach((pth) => pth.setAttribute('opacity', fadeAll.toFixed(3)));
    const L = leadPos(t, cam);
    R.hot.a.setAttribute('d', vline(A, { x: N.x, y: N.y - G.node.r }));
    R.hot.a.setAttribute('stroke-dashoffset', (1 - L.u1).toFixed(4));
    R.hot.b.setAttribute('d', curve(Nb, Bt(HOT)));
    R.hot.b.setAttribute('stroke-dashoffset', (1 - L.u2).toFixed(4));
    R.hot.c.setAttribute('d', vline(Bb, Ct));
    R.hot.c.setAttribute('stroke-dashoffset', (1 - L.u3).toFixed(4));
    [R.hot.a, R.hot.b, R.hot.c].forEach((pth) => pth.setAttribute('opacity', fadeAll.toFixed(3)));

    const kn = kR(0.05);
    SS.set(R.node, { x: N.x, y: N.y + lift, s: lerp(0.6, 1, kn), o: Math.min(kn * 1.4, fadeAll) });
    const pulse = p(t, T.seg1[1] - 0.05, T.seg1[1] + 0.55, E.out);
    SS.set(R.nodeRing, { x: N.x, y: N.y + lift, s: lerp(1, 1.7, pulse), o: t > T.seg1[1] - 0.05 ? (1 - pulse) * fadeAll : 0 });
    SS.set(R.nodeLabel, { x: N.x + G.node.r + 26, y: N.y + lift, ax: 0, o: Math.min(kR(0.2), fadeAll) });
    SS.set(R.gLabel, { x: A.x + 26, y: (A.y + N.y - G.node.r) / 2 + lift, ax: 0, o: Math.min(kR(0.1), fadeAll) * 0.9 });
    const hotK = p(t, T.seg2[1] - 0.08, T.seg2[1] + 0.3, E.out);
    R.brokers.forEach((b, i) => {
      const kb = kR(0.16 + i * 0.06);
      const dimK = i === HOT ? 0 : hotK;
      SS.set(b.el, { x: b.x, y: G.brokers.y + cam + SS.pick(18, 16) + lift, s: lerp(0.7, 1, kb) * (i === HOT ? lerp(1, 1.1, hotK) : 1), o: Math.min(kb, fadeAll) * lerp(1, 0.4, dimK) });
      if (i === HOT) {
        b.ring.style.opacity = hotK.toFixed(3);
        b.label.style.color = hotK > 0.5 ? SS.C.turqText : SS.C.soft;
      }
    });
    const kcrm = kR(0.36);
    const arrive = p(t, T.seg3[1] - 0.04, T.seg3[1] + 0.3, E.out);
    SS.set(R.crm, { x: G.crm.x, y: G.crm.y + cam + lift, s: lerp(0.8, 1, kcrm) * (1 + Math.sin(Math.PI * arrive) * 0.05), o: Math.min(kcrm, fadeAll) });
    R.crmChk.set(p(t, T.seg3[1], T.seg3[1] + 0.5, E.linear));
    SS.set(R.recu, { x: G.crm.x + G.crm.w / 2 + 24, y: G.crm.y + cam + lift, ax: 0, o: Math.min(p(t, T.seg3[1] + 0.12, T.seg3[1] + 0.45, E.out), fadeAll) });

    // the lead pill (speed-scaled blur for motion)
    const kp = p(t, T.pill, T.pill + 0.4, E.out);
    const prev = leadPos(t - 1 / 60, cam);
    const speed = Math.hypot(L.x - prev.x, L.y - prev.y);
    const dock = p(t, T.seg3[1] - 0.06, T.seg3[1] + 0.2, E.inOut);
    SS.set(R.pill, { x: L.x, y: L.y + lift, s: lerp(0.6, 1, kp) * lerp(1, 0.25, dock), o: t < T.pill ? 0 : Math.min(kp * 1.5, 1 - dock), blur: Math.min(5, speed * 0.22) });

    // headlines
    SS.set(R.h1.el, { x: 540, y: G.head1 });
    SS.words(R.h1, t, { inT: T.head1, st: 0.07, outT: T.head2 - 0.26, outSt: 0.02, outDur: 0.3 });
    SS.set(R.h2.el, { x: 540, y: G.head2 });
    SS.words(R.h2, t, { inT: T.head2, st: 0.06, outT: T.out, outSt: 0.02 });
  }

  SS.scenes.push({ name: 'lead', a: 18.0, b: T.end, build, render });
  SS.leadCRM = (t) => ({ x: G.crm.x, y: G.crm.y + G.cam });
})();
