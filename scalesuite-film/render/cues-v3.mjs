// Export the picture's sound cues (collected while the GSAP timeline is built) for audio/music-v3.py:
// node render/cues-v3.mjs > cues.json
import { chromium, serve, openFilmV3 } from './lib-v3.mjs';

const { srv, base } = await serve();
const browser = await chromium.launch();
try {
  const film = await openFilmV3(browser, base, 0.25);
  const data = await film.page.evaluate(() => ({ duration: window.SS.DURATION, cues: window.SS.cues }));
  process.stdout.write(JSON.stringify(data, null, 1) + '\n');
} finally { await browser.close(); srv.close(); }
