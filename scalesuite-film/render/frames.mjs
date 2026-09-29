// Render the full frame sequence in parallel pages:
// node render/frames.mjs --format=vertical --fps=60 --scale=1 --workers=4 --out=frames-dir [--poster]
// With --poster, frame 0 is the settled poster frame (SS.POSTER_T) for platform thumbnails.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, serve, openFilm, args } from './lib.mjs';

const o = args({ v: '2', format: 'vertical', fps: '60', scale: '1', workers: '4', out: 'frames', start: '0', end: '' });
fs.mkdirSync(o.out, { recursive: true });
const { srv, base } = await serve();
const browser = await chromium.launch();
const t0 = Date.now();
try {
  const films = await Promise.all(Array.from({ length: +o.workers }, () => openFilm(browser, base, o.format, parseFloat(o.scale), o.v)));
  const dur = o.end ? parseFloat(o.end) : await films[0].page.evaluate(() => window.SS.DURATION);
  const poster = await films[0].page.evaluate(() => window.SS.POSTER_T);
  const fps = +o.fps, start = parseFloat(o.start);
  const n = Math.round((dur - start) * fps);
  let next = 0, done = 0;
  await Promise.all(films.map(async (f) => {
    for (;;) {
      const i = next++;
      if (i >= n) return;
      const t = i === 0 && o.poster ? poster : start + i / fps;
      fs.writeFileSync(path.join(o.out, String(i).padStart(5, '0') + '.png'), await f.shot(t));
      if (++done % 120 === 0) console.log(`${done}/${n} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }));
  console.log(`rendered ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${o.out}`);
} finally { await browser.close(); srv.close(); }
