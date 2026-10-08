// V3 render helpers: same static server as V2 (lib.mjs, reused), page = index-v3.html.
import { chromium, serve, args } from './lib.mjs';
export { chromium, serve, args };

export async function openFilmV3(browser, base, scale = 1, shotScale = 1) {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await page.goto(`${base}/index-v3.html?format=vertical`);
  await page.waitForFunction(() => window.SS && (window.SS.ready || window.SS.error), null, { timeout: 60000 });
  const err = await page.evaluate(() => window.SS.error);
  if (err) throw new Error(err);
  const cdp = await ctx.newCDPSession(page);
  const shot = async (t) => {
    await page.evaluate((tt) => new Promise((r) => { window.SS.renderFrame(tt); requestAnimationFrame(() => r()); }), t);
    const opt = { format: 'png', optimizeForSpeed: true };
    if (shotScale !== 1) opt.clip = { x: 0, y: 0, width: 1080, height: 1920, scale: shotScale }; // quick checks only
    const { data } = await cdp.send('Page.captureScreenshot', opt);
    return Buffer.from(data, 'base64');
  };
  return { page, ctx, shot };
}
