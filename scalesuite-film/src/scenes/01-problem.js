/* S1 Scroll stopper (0–2.5) + S2 Problem expands (2.5–5.0) + collapse into one node (5.0–5.5).
   One broker card at frame 0; cards multiply while an odometer counts 1 → 10; every broker spawns
   its own "Campagne Google Ads"; every campaign sprouts targeting / landing page / optimisation /
   lead tags. Then everything is pulled into the ScaleSuite node. */
(function () {
  const SS = window.SS;
  const { p, E, lerp, clamp } = SS;
  const V = SS.V;

  const T = {
    chips: 1.1, h2: 1.12, toS2: 2.42, noun2: 3.36, noun3: 4.08, tags0: 2.55, tags1: 4.35,
    collapse: 4.98, end: 5.62,
  };
  const C = SS.pick({ x: 540, y: 1000 }, { x: 540, y: 760 }); // convergence node (shared with S3)
  SS.NODE = C;

  // ---------------------------------------------------------------- layout tables (world coords)
  const LAY = SS.pick(
    {
      head: { size: 112, y1: 298, y2: 420, y3: 542, sizeB: 118, yA: 296, yB: 446, maxW: 930 },
      unit(i) { const c = i % 2, r = (i / 2) | 0; return { x: c ? 788 : 292, y: 704 + r * 168 }; },
      card: { w: 452, h: 100 }, chipOff: { x: 58, y: 84 }, chipLabel: 'Campagne Google Ads', chipSize: 22,
      focus0: { x: 292, y: 704, s: 1.45, ax: 540, ay: 980 }, focus1: { x: 540, y: 1040, s: 1, ax: 540, ay: 1040 },
      tagBox: { x0: 120, x1: 960, y0: 640, y1: 1480 }, tagSize: 19,
    },
    {
      head: { size: 96, y1: 146, y2: 248, y3: 350, sizeB: 104, yA: 146, yB: 276, maxW: 960 },
      unit(i) { const c = i % 5, r = (i / 5) | 0; return { x: 540 + (c - 2) * 198, y: 628 + r * 330 }; },
      card: { w: 184, h: 184 }, chipOff: { x: 0, y: 136 }, chipLabel: 'Campagne', chipSize: 20,
      focus0: { x: 144, y: 628, s: 1.4, ax: 540, ay: 760 }, focus1: { x: 540, y: 790, s: 1, ax: 540, ay: 790 },
      tagBox: { x0: 110, x1: 970, y0: 470, y1: 1270 }, tagSize: 18,
    }
  );
  const TAGS = ['Ciblage', 'Page de destination', 'Optimisation', 'Lead', 'Mots-clés', 'Annonce',
    'Campagne vendeur', 'Campagne acheteur', 'Budget', 'Suivi'];

  // card pop times: card 0 is already there at frame 0
  const pop = (i) => (i === 0 ? -1 : 0.05 + i * 0.094);

  let R;
  function build(stage) {
    const root = SS.el('div', 'layer', stage);
    const lines = SS.svg('svg', { class: 'lines', width: SS.W, height: SS.H }, root);
    const units = [];
    const rnd = SS.rng(42);
    for (let i = 0; i < 10; i++) {
      const u = LAY.unit(i);
      const n = String(i + 1).padStart(2, '0');
      // broker card
      const card = SS.el('div', 'abs card', root);
      card.style.width = LAY.card.w + 'px';
      card.style.height = LAY.card.h + 'px';
      if (V) {
        card.innerHTML = `<div class="avatar" style="position:absolute;left:18px;top:18px;width:64px;height:64px">${SS.icon.person()}</div>
          <div style="position:absolute;left:100px;top:19px;font-weight:720;font-size:29px;letter-spacing:-.02em">Courtier ${n}</div>
          <div style="position:absolute;left:100px;top:57px;font-weight:500;font-size:19px;color:var(--soft)">Courtier immobilier</div>
          <div style="position:absolute;right:22px;top:40px;width:18px;height:18px;border-radius:50%;background:var(--mint);box-shadow:inset 0 0 0 2px rgba(43,191,179,.55)"></div>`;
      } else {
        card.innerHTML = `<div class="avatar" style="position:absolute;left:56px;top:22px;width:72px;height:72px">${SS.icon.person()}</div>
          <div style="position:absolute;left:0;right:0;top:108px;text-align:center;font-weight:720;font-size:24px;letter-spacing:-.02em">Courtier ${n}</div>
          <div style="position:absolute;left:0;right:0;top:142px;text-align:center;font-weight:500;font-size:16px;color:var(--soft)">Courtier immobilier</div>`;
      }
      // campaign chip
      const chip = SS.el('div', 'abs chip mint', root);
      chip.style.fontSize = LAY.chipSize + 'px';
      chip.innerHTML = `${SS.icon.target(SS.C.green)}<span>${LAY.chipLabel}</span>`;
      const cw = chip.getBoundingClientRect().width;
      const cpath = SS.svg('path', { fill: 'none', stroke: SS.C.turq, 'stroke-width': 3, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, lines);
      const cnode = SS.svg('circle', { r: 6.5, fill: SS.C.green }, lines);
      // tags around the campaign
      const tags = [];
      for (let j = 0; j < 4; j++) {
        const label = TAGS[(i * 3 + j * 7) % TAGS.length];
        const tg = SS.el('div', 'abs chip', root);
        tg.style.fontSize = LAY.tagSize + 'px';
        tg.innerHTML = `<span style="width:.55em;height:.55em;border-radius:50%;background:${j % 2 ? SS.C.turq : SS.C.green};display:inline-block"></span><span>${label}</span>`;
        const tw = tg.getBoundingClientRect().width;
        const ang = (j / 4) * Math.PI * 2 + rnd() * 1.2 + i * 0.7;
        const rad = V ? 150 + rnd() * 120 : 120 + rnd() * 110;
        const cx0 = u.x + LAY.chipOff.x, cy0 = u.y + LAY.chipOff.y;
        let tx = cx0 + Math.cos(ang) * rad * 1.25, ty = cy0 + Math.sin(ang) * rad * 0.75;
        tx = clamp(tx, LAY.tagBox.x0 + tw / 2 - 60, LAY.tagBox.x1 - tw / 2 + 60);
        ty = clamp(ty, LAY.tagBox.y0, LAY.tagBox.y1);
        const tpath = SS.svg('path', { fill: 'none', stroke: SS.C.turq, 'stroke-opacity': 0.5, 'stroke-width': 1.8, pathLength: 1, 'stroke-dasharray': '1 1' }, lines);
        const k = i * 4 + j;
        tags.push({ el: tg, x: tx, y: ty, w: tw, path: tpath, t0: T.tags0 + ((k * 37) % 40) / 40 * (T.tags1 - T.tags0), ph: rnd() * 6.28 });
      }
      units.push({ i, x: u.x, y: u.y, card, chip, cw, cpath, cnode, tags, d: rnd() * 0.09 });
    }
    // lines sit under cards: move svg first (already first child). Tags above cards:
    units.forEach((u) => u.tags.forEach((tg) => root.appendChild(tg.el)));

    // ---- headline (screen space)
    const H = LAY.head;
    const odoWrap = SS.el('div', 'abs txt', root);
    Object.assign(odoWrap.style, { fontSize: H.size + 'px', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.04 });
    const odoMask = SS.el('span', 'm', odoWrap);
    const odoInner = SS.el('span', 'w', odoMask);
    const tensWin = SS.el('span', 'odo-win', odoInner);
    tensWin.style.display = 'inline-block';
    const tensCol = SS.el('span', 'odo-col', tensWin);
    SS.el('span', 'odo-d', tensCol, '1');
    const odo = SS.odometer(odoInner, 1);
    odoInner.style.display = 'inline-flex';
    odoInner.style.fontFeatureSettings = "'tnum' 1";
    const digitW = odo.cols[0].win.getBoundingClientRect().width;
    const word = SS.el('div', 'abs txt', root);
    Object.assign(word.style, { fontSize: H.size + 'px', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.04 });
    const wm = SS.el('span', 'm', word);
    const wi = SS.el('span', 'w', wm);
    wi.innerHTML = 'courtier<span class="pl" style="display:inline-block;overflow:hidden;vertical-align:top">s</span>.';
    const pl = wi.querySelector('.pl');
    const sW = pl.getBoundingClientRect().width;
    const wordW = word.getBoundingClientRect().width - sW;
    const spaceW = H.size * 0.26;

    const h2 = SS.text(root, '10 campagnes', { size: H.size, maxW: H.maxW });
    const h3 = SS.text(root, '*Google_Ads* ?', { size: H.size, maxW: H.maxW });
    const hA = SS.text(root, 'Plus de', { size: H.sizeB, maxW: H.maxW });
    const nB2 = SS.text(root, 'campagnes.', { size: H.sizeB, maxW: H.maxW });
    const nB3 = SS.text(root, 'gestion.', { size: H.sizeB, maxW: H.maxW });

    R = { root, lines, units, odoWrap, odoInner, tensWin, tensCol, odo, digitW, word, wi, pl, sW, wordW, spaceW, h2, h3, hA, nB2, nB3 };
  }

  // camera: world → screen
  function camAt(t) {
    const f0 = LAY.focus0, f1 = LAY.focus1;
    const k = p(t, 0, 1.25, E.inOutSoft);
    let s = lerp(f0.s, f1.s, k);
    const fx = lerp(f0.x, f1.x, k), fy = lerp(f0.y, f1.y, k);
    const ax = lerp(f0.ax, f1.ax, k), ay = lerp(f0.ay, f1.ay, k);
    const k2 = p(t, 2.4, 5.1, E.inOut);
    s *= lerp(1, 1.07, k2);
    const rot = lerp(0, -1.6, k2) * Math.PI / 180;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    return (x, y) => {
      const dx = (x - fx) * s, dy = (y - fy) * s;
      return { x: ax + dx * cs - dy * sn, y: ay + dx * sn + dy * cs, s, r: rot * 180 / Math.PI };
    };
  }
  // pull toward the node during the collapse
  function pull(t, pt, d) {
    const k = p(t, T.collapse + d, T.collapse + 0.44 + d, E.in);
    return {
      x: lerp(pt.x, C.x, k), y: lerp(pt.y, C.y, k), k,
      s: lerp(1, 0.1, k), blur: 9 * k, o: 1 - p(t, T.collapse + 0.3 + d, T.collapse + 0.5 + d, E.linear),
    };
  }
  const curve = (a, b, bend = 'down') =>
    bend === 'down'
      ? `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${a.x.toFixed(1)},${(a.y + (b.y - a.y) * 0.9).toFixed(1)} ${(a.x + (b.x - a.x) * 0.2).toFixed(1)},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`
      : `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${lerp(a.x, b.x, 0.5).toFixed(1)},${a.y.toFixed(1)} ${lerp(a.x, b.x, 0.5).toFixed(1)},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;

  function render(t) {
    const cam = camAt(t);
    const jit = p(t, 4.2, 4.95, E.inOut); // tension jitter as management piles up
    R.units.forEach((u) => {
      // card
      const tp = pop(u.i);
      const kp = u.i === 0 ? 1 : p(t, tp, tp + 0.42, E.out);
      const sc = cam(u.x, u.y);
      const pc = pull(t, sc, u.d);
      SS.set(u.card, { x: pc.x, y: pc.y + (1 - kp) * 26, s: sc.s * lerp(0.72, 1, kp) * pc.s, r: sc.r, o: Math.min(kp * 1.6, pc.o), blur: (1 - kp) * 6 + pc.blur });
      // node on the card + campaign chip
      const kc = p(t, T.chips + u.i * 0.045, T.chips + u.i * 0.045 + 0.5, E.out);
      const nodeW = V ? { x: u.x - 150, y: u.y + LAY.card.h / 2 } : { x: u.x, y: u.y + LAY.card.h / 2 };
      const chipW = { x: u.x + LAY.chipOff.x, y: u.y + LAY.chipOff.y };
      const chipLeftW = V ? { x: chipW.x - u.cw / 2, y: chipW.y } : { x: chipW.x, y: chipW.y - 22 };
      const sn = cam(nodeW.x, nodeW.y), sl = cam(chipLeftW.x, chipLeftW.y), sch = cam(chipW.x, chipW.y);
      const pn = pull(t, sn, u.d), pl = pull(t, sl, u.d), pch = pull(t, sch, u.d);
      u.cpath.setAttribute('d', curve(pn, pl, 'down'));
      const kl = p(t, T.chips + u.i * 0.045 - 0.05, T.chips + u.i * 0.045 + 0.3, E.outSoft);
      u.cpath.setAttribute('stroke-dashoffset', (1 - kl).toFixed(4));
      u.cpath.setAttribute('stroke-opacity', (0.95 * pn.o).toFixed(3));
      u.cnode.setAttribute('cx', pn.x.toFixed(1));
      u.cnode.setAttribute('cy', pn.y.toFixed(1));
      u.cnode.setAttribute('r', (6.5 * sc.s * p(t, T.chips - 0.1 + u.i * 0.045, T.chips + 0.15 + u.i * 0.045) * pn.s).toFixed(2));
      u.cnode.setAttribute('opacity', pn.o.toFixed(3));
      SS.set(u.chip, { x: pch.x + (1 - kc) * (V ? -30 : 0), y: pch.y + (V ? 0 : (1 - kc) * -16), s: sc.s * lerp(0.7, 1, kc) * pch.s, r: sc.r, o: Math.min(kc * 1.5, pch.o), blur: (1 - kc) * 5 + pch.blur });
      // tags
      u.tags.forEach((tg, j) => {
        const kt = p(t, tg.t0, tg.t0 + 0.5, E.out);
        const jx = Math.sin(t * 23 + tg.ph) * 1.6 * jit, jy = Math.cos(t * 19 + tg.ph) * 1.6 * jit;
        const st = cam(lerp(chipW.x, tg.x, E.out(kt)) + jx, lerp(chipW.y, tg.y, E.out(kt)) + jy);
        const ps = pull(t, st, u.d * 0.6 + j * 0.012);
        SS.set(tg.el, { x: ps.x, y: ps.y, s: sc.s * lerp(0.5, 1, kt) * ps.s, r: sc.r, o: Math.min(kt * 1.4, ps.o) * 0.97, blur: (1 - kt) * 4 + ps.blur });
        tg.path.setAttribute('d', curve(pch, ps, 'side'));
        tg.path.setAttribute('stroke-dashoffset', (1 - p(t, tg.t0 - 0.05, tg.t0 + 0.35, E.outSoft)).toFixed(4));
        tg.path.setAttribute('stroke-opacity', (0.5 * Math.min(pch.o, ps.o)).toFixed(3));
      });
    });

    // ---- headline
    const H = LAY.head;
    // count 1 → 10
    let count = 1, roll = 1;
    for (let i = 1; i < 10; i++) if (t >= pop(i)) { count = i + 1; roll = p(t, pop(i), pop(i) + 0.17, E.out); }
    const unitsIdx = count - 1 + roll; // column holds 0..9,0 → index = value
    const uiClamped = count === 10 ? 9 + roll : unitsIdx;
    R.odo.cols[0].col.style.transform = `translateY(${(-uiClamped * 1.12).toFixed(4)}em)`;
    const kTens = count === 10 ? roll : 0;
    const tensW = R.digitW * E.outSoft(kTens);
    R.tensWin.style.width = tensW.toFixed(2) + 'px';
    R.tensCol.style.transform = `translateY(${((1 - kTens) * 1.12).toFixed(4)}em)`;
    const kS = p(t, pop(1), pop(1) + 0.22, E.out);
    R.pl.style.width = (R.sW * kS).toFixed(2) + 'px';
    const total = tensW + R.digitW + R.spaceW + R.wordW + R.sW * kS;
    const left = SS.CX - total / 2;

    // S1 → S2: "10" exits, "courtiers." travels to line B, "Plus de" rises
    const kMove = p(t, T.toS2 + 0.14, T.toS2 + 0.74, E.inOut);
    const odoOut = p(t, T.toS2, T.toS2 + 0.4, E.in);
    R.odoInner.style.transform = `translateY(${(-odoOut * SS.HIDE).toFixed(2)}%)`;
    SS.set(R.odoWrap, { x: left, y: H.y1, ax: 0, o: odoOut >= 1 ? 0 : 1 });
    const wx1 = left + tensW + R.digitW + R.spaceW + (R.wordW + R.sW * kS) / 2;
    const wScale = lerp(1, H.sizeB / H.size, kMove);
    // collapse of the headline into the node
    const kc = p(t, T.collapse + 0.05, T.collapse + 0.5, E.in);
    const pullH = (x, y) => ({ x: lerp(x, C.x, kc), y: lerp(y, C.y, kc), s: lerp(1, 0.2, kc), blur: 10 * kc, o: 1 - p(t, T.collapse + 0.3, T.collapse + 0.52, E.linear) });
    const wp = pullH(lerp(wx1, SS.CX, kMove), lerp(H.y1, H.yB, kMove));
    SS.set(R.word, { x: wp.x, y: wp.y, s: wScale * wp.s, o: wp.o, blur: wp.blur });
    const nounOut = p(t, T.noun2, T.noun2 + 0.42, E.in);
    R.wi.style.transform = `translateY(${(-nounOut * SS.HIDE).toFixed(2)}%)`;
    R.wi.style.opacity = (1 - nounOut).toFixed(3);

    SS.set(R.h2.el, { x: SS.CX, y: H.y2 });
    SS.set(R.h3.el, { x: SS.CX, y: H.y3 });
    SS.words(R.h2, t, { inT: T.h2, outT: T.toS2 - 0.14, st: 0.06, outSt: 0.02, outDur: 0.28 });
    SS.words(R.h3, t, { inT: T.h2 + 0.14, outT: T.toS2 - 0.12, st: 0.07, outSt: 0.02, outDur: 0.28 });
    const pa = pullH(SS.CX, H.yA);
    SS.set(R.hA.el, { x: pa.x, y: pa.y, s: pa.s, o: pa.o, blur: pa.blur });
    SS.words(R.hA, t, { inT: T.toS2 + 0.56, st: 0.07, dur: 0.5 });
    const pb = pullH(SS.CX, H.yB);
    SS.set(R.nB2.el, { x: pb.x, y: pb.y, s: pb.s, o: pb.o, blur: pb.blur });
    SS.words(R.nB2, t, { inT: T.noun2 + 0.16, outT: T.noun3 });
    SS.set(R.nB3.el, { x: pb.x, y: pb.y, s: pb.s, o: pb.o, blur: pb.blur });
    SS.words(R.nB3, t, { inT: T.noun3 + 0.16 });
  }

  SS.scenes.push({ name: 'problem', a: -1, b: T.end, build, render });
})();
