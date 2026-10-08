// Quality checks for the V3 film (run before delivering a render):
//   node render/check-v3.mjs determinism [t1,t2,...]   same frame after different seek histories → DOM + pixel diff
//   node render/check-v3.mjs motion [end]               frame-to-frame change at 30 fps → isolated spikes (jumps, pops)
// Determinism must report "0 DOM differences" (pixel noise ≤ 2/255 is Chrome rasterisation, invisible).
// Motion must report no spike: every big change has to ramp up and down over several frames.
import { chromium, serve, openFilmV3 } from './lib-v3.mjs';

const [mode = 'determinism', arg] = process.argv.slice(2);
const { srv, base } = await serve();
const browser = await chromium.launch();

const diffPixels = (page, A, B) => page.evaluate(async ([x, y]) => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
  const [ia, ib] = await Promise.all([load(x), load(y)]);
  const c = new OffscreenCanvas(ia.width, ia.height), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, ia.width, ia.height).data;
  g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, ia.width, ia.height).data;
  let m = 0, s = 0; for (let i = 0; i < da.length; i += 4) {
    const v = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
    if (v > m) m = v; s += v;
  }
  return { max: m, mean: s / (da.length / 4) };
}, [A.toString('base64'), B.toString('base64')]);

// visual state only: computed styles that affect the picture (raw style strings differ in formatting
// once GSAP has touched an element, and an identity transform equals none)
const dump = (f) => f.page.evaluate(() => {
  const P = ['transform', 'opacity', 'visibility', 'clipPath', 'filter', 'backgroundColor', 'color', 'width', 'height', 'letterSpacing', 'boxShadow'];
  return [...document.querySelectorAll('#stage *')].filter((e) => e.checkVisibility()).map((e) => {
    const c = getComputedStyle(e);
    const v = P.map((k) => (k === 'transform' && c[k] === 'matrix(1, 0, 0, 1, 0, 0)' ? 'none' : c[k]));
    const svg = ['transform', 'stroke-dashoffset', 'cx', 'cy', 'r', 'opacity', 'd'].map((k) => e.getAttribute(k) || '');
    return [...v, ...svg, e.children.length ? '' : e.textContent].join('|');
  });
});

try {
  if (mode === 'determinism') {
    const times = (arg || '0.45,2.35,3.9,5.2,7,8.5,9.4,10.9,12.3,13.4,14.6,15.4,16.8,17.99,18,19.6,20.89,21.9,22.7,24.9,25.05,26.4,28.3,30.9').split(',').map(Number);
    const a = await openFilmV3(browser, base, 1), b = await openFilmV3(browser, base, 1);
    let worst = 0, domBad = 0;
    for (const t of times) {
      const A = await a.shot(t);                                          // page A: increasing order
      for (const x of [30.5, 0.1, t + 1.3]) await b.shot(x);              // page B: jumps around first
      const B = await b.shot(t);
      const [da, db] = [await dump(a), await dump(b)];
      const dd = da.filter((s, i) => s !== db[i]).length;
      const px = await diffPixels(a.page, A, B);
      worst = Math.max(worst, px.max); domBad += dd;
      console.log(`${t.toFixed(2)}s  DOM diffs ${dd}  pixel max ${px.max}/255`);
    }
    console.log(domBad ? `FAIL: ${domBad} DOM differences` : `OK: 0 DOM differences, worst pixel ${worst}/255`);
  } else {
    const end = parseFloat(arg) || 31;
    const f = await openFilmV3(browser, base, 1, 0.25);
    const rows = []; let prev = null;
    for (let i = 0; i <= Math.round(end * 30); i++) {
      const png = await f.shot(i / 30);
      rows.push([i / 30, prev ? (await diffPixels(f.page, png, prev)).mean : 0]);
      prev = png;
    }
    const spikes = rows.filter(([t, d], i) => i > 0 && i < rows.length - 1 && d > 6 && d > 2.2 * Math.max(rows[i - 1][1], rows[i + 1][1], 0.5));
    spikes.forEach(([t, d]) => console.log(`spike at ${t.toFixed(3)}s: ${d.toFixed(2)}`));
    const peak = rows.reduce((m, r) => (r[1] > m[1] ? r : m));
    console.log(spikes.length ? `FAIL: ${spikes.length} isolated spikes` : `OK: no isolated spike (peak ${peak[1].toFixed(1)} at ${peak[0].toFixed(2)}s)`);
  }
} finally { await browser.close(); srv.close(); }
