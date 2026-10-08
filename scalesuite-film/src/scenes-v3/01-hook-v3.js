/* Scene 1 · Hook (0–2.5 s). Frame 0: one broker card, very large ("1 courtier."). The camera pulls
   back while nine more cards pop in, the odometer rolls 1 → 10, and every card turns its skeleton
   line into a "Campagne" chip. Ends on a smash zoom into the grid (scene 2 owns the camera from
   2.2 s). The cards live in the world layer and are reused by scene 2. */
(function () {
  const SS = window.SS;
  const GRID = { xs: [315, 765], ys: [715, 887, 1059, 1231, 1403], w: 430, h: 150 };
  const T = { pop0: 0.1, popSpan: 0.72, cam: 0.15, camDur: 1.0, chips: 0.9, h2: 0.95, h3: 1.06, out: 2.06, ten: 2.18, move: 2.28 };
  const HEAD = { size: 124, y1: 268, y2: 396, y3: 524, maxW: 940 };
  SS.HEAD3 = { size: 124, yA: 300, yB: 428, band: 372 }; // scene 2 headline lines ("Plus de" / noun) + clip band top
  const popT = (j) => (j === 0 ? -1 : T.pop0 + T.popSpan * Math.pow(j / 9, 0.72)); // accelerating count
  const ROLL = SS.ease('power3.out');

  let R;
  function build(stage) {
    const world = SS.makeWorld(stage);
    // ---- broker cards (world units; at camera scale 1 the grid spans 880 px = 81 % of the frame)
    const cards = [];
    for (let i = 0; i < 10; i++) {
      const n = String(i + 1).padStart(2, '0');
      const x = GRID.xs[i % 2], y = GRID.ys[(i / 2) | 0];
      const el = SS.el('div', 'a3 card3', world);
      Object.assign(el.style, { width: GRID.w + 'px', height: GRID.h + 'px' });
      el.innerHTML = `<div class="av" style="left:24px;top:35px;width:80px;height:80px">${SS.icon.person()}</div>
        <div class="nm" style="left:124px;top:21px;font-size:40px">Courtier ${n}</div>
        <div class="ln2" style="left:124px;top:80px;width:292px;height:50px">
          <div class="skel" style="position:absolute;left:0;top:17px;width:196px;height:16px"></div>
          <div class="chip3" style="font-size:30px;height:48px;padding:0 18px 0 13px;box-sizing:border-box">${SS.icon.target(SS.C.green)}<span>Campagne</span></div>
        </div>
        <div class="badge3" style="right:-16px;top:-16px;min-width:54px;height:54px;padding:0 13px;box-sizing:border-box;font-size:31px">1</div>`;
      const skel = el.querySelector('.skel'), chip = el.querySelector('.chip3'), badge = el.querySelector('.badge3');
      SS.place(el, x, y, { autoAlpha: 1 });
      gsap.set(chip, { yPercent: 115 });
      badge.style.transform = 'scale(0)';
      const tp = popT(i);
      if (i > 0) {
        gsap.set(el, { autoAlpha: 0 });
        SS.tl.fromTo(el, { y: y + 34, scale: 0.62 }, { y, scale: 1, duration: 0.46, ease: SS.EZ.pop }, tp);
        SS.tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'power1.out' }, tp);
        SS.cue(tp, 'pop', { i });
      }
      // skeleton line → "Campagne" chip (wave in reading order)
      const tc = T.chips + i * 0.035;
      SS.tl.fromTo(skel, { yPercent: 0 }, { yPercent: -260, duration: 0.24, ease: SS.EZ.in }, tc);
      SS.tl.fromTo(chip, { yPercent: 115 }, { yPercent: 0, duration: 0.5, ease: SS.EZ.dock }, tc + 0.06);
      cards.push({ el, x, y, i, skel, chip, badge, n });
    }
    SS.cue(T.chips, 'chips');

    // ---- headline (screen space)
    const layer = SS.el('div', 'layer', stage);
    const odoWrap = SS.el('div', 'a3 txt', layer);
    Object.assign(odoWrap.style, { fontSize: HEAD.size + 'px', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.04 });
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
    const word = SS.el('div', 'a3 txt', layer);
    Object.assign(word.style, { fontSize: HEAD.size + 'px', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.04 });
    const wm = SS.el('span', 'm', word);
    const wi = SS.el('span', 'w', wm);
    wi.innerHTML = 'courtier<span class="pl" style="display:inline-block;overflow:hidden;vertical-align:top">s</span>.';
    const pl = wi.querySelector('.pl');
    const sW = pl.getBoundingClientRect().width;
    const wordW = word.getBoundingClientRect().width - sW;
    const wr = word.getBoundingClientRect(), mr = wm.getBoundingClientRect();
    const maskTop = mr.top - wr.top - wr.height / 2; // mask top relative to the word's centre
    const spaceW = HEAD.size * 0.26;
    SS.hookWord = { el: word, inner: wi, w: wordW + sW };

    const h2 = SS.text(layer, '10 campagnes', { size: HEAD.size, maxW: HEAD.maxW });
    const h3 = SS.text(layer, '*Google_Ads* ?', { size: HEAD.size, maxW: HEAD.maxW });
    SS.place(h2.el, 540, HEAD.y2);
    SS.place(h3.el, 540, HEAD.y3);
    SS.hideWords(h2); SS.hideWords(h3);
    SS.wordsIn(h2, T.h2, { st: 0.07 });
    SS.wordsIn(h3, T.h3, { st: 0.08 });
    SS.cue(T.h2, 'line');
    SS.wordsOut(h2, T.out, { st: 0.02, dur: 0.24 });
    SS.wordsOut(h3, T.out + 0.03, { st: 0.02, dur: 0.24 });
    // "10" leaves upward; "courtiers." slides into scene 2's second line
    SS.tl.fromTo(odoInner, { yPercent: 0 }, { yPercent: -SS.HIDE, duration: 0.26, ease: SS.EZ.in }, T.ten);
    const P = { move: 0 };
    SS.tl.fromTo(P, { move: 0 }, { move: 1, duration: 0.4, ease: SS.EZ.inOut }, T.move);

    // ---- camera: starts tight on card 01, pulls back to the whole grid with a small settle
    SS.camSet({ x: GRID.xs[0], y: GRID.ys[0], s: 1.9, r: 0 });
    SS.camTo(T.cam, T.camDur, SS.EZ.cam, { x: 540, y: 960, s: 1 });

    R = { layer, cards, odoWrap, odoInner, tensWin, tensCol, odo, digitW, word, wm, maskTop, pl, sW, wordW, spaceW, P };
    SS.hook = R;
  }

  function render(t) {
    // count 1 → 10: each pop adds a smooth unit (overlapping rolls simply add up)
    let v = 1;
    for (let j = 1; j < 10; j++) v += ROLL(SS.clamp01((t - popT(j)) / 0.2));
    R.odo.cols[0].col.style.transform = `translateY(${(-v * 1.12).toFixed(4)}em)`; // column 0..9,0
    const kT = SS.clamp01(v - 9);
    const tensW = R.digitW * SS.EZ.soft(kT);
    R.tensWin.style.width = tensW.toFixed(2) + 'px';
    R.tensCol.style.transform = `translateY(${((1 - kT) * 1.12).toFixed(4)}em)`;
    const kS = SS.clamp01(v - 1);
    R.pl.style.width = (R.sW * kS).toFixed(2) + 'px';
    const total = tensW + R.digitW + R.spaceW + R.wordW + R.sW * kS;
    const left = 540 - total / 2;
    R.odoWrap.style.transform = `translate(${left.toFixed(2)}px,${HEAD.y1}px) translate(0,-50%)`;
    const wx = left + tensW + R.digitW + R.spaceW + (R.wordW + R.sW * kS) / 2;
    const m = R.P.move;
    const x = wx + (540 - wx) * m, y = HEAD.y1 + (SS.HEAD3.yB - HEAD.y1) * m;
    R.word.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) translate(-50%,-50%)`;
    // once on scene 2's second line, clip it to the same band as the other nouns
    const clipTop = SS.HEAD3.band - (y + R.maskTop);
    R.wm.style.clipPath = m >= 1 && clipTop > 0 ? `inset(${clipTop.toFixed(1)}px 0 0 0)` : 'none';
  }

  const scene = { name: 'hook', a: -1, b: 99, render, ranges: [] };
  // visibility: the world (cards) lives until the implosion; the headline layer until "courtiers." leaves
  scene.build = (stage) => { build(stage); scene.ranges = [[SS.worldWrap, -1, 5.62], [R.layer, -1, 3.8]]; };
  SS.scenes.push(scene);
})();
