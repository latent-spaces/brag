// Capture a /promo page to frames. Run from work/, with playwright-core installed there
// (npm i --prefix . playwright-core).
//
//   node capture.mjs frames            every frame -> out/00000.jpg ... (parallel pages)
//   node capture.mjs stills 1.2 3.4    chosen times -> check/t1.20.png ...
//
// Page contract (scene.html): window.ready resolves { fps, duration, width, height };
// window.render(t) draws time t as a pure function of t and resolves once it's painted-ready.
// CAPTURE_WORKERS=n overrides the number of parallel pages; CHROMIUM=path picks the browser.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import os from "node:os";
import { pathToFileURL } from "node:url";

const require = createRequire(process.cwd() + "/");
let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error(`playwright-core isn't installed in ${process.cwd()}; run: npm i --prefix . playwright-core`);
  process.exit(2);
}

const mode = process.argv[2];
if (mode !== "frames" && mode !== "stills") {
  console.error("usage: capture.mjs frames | stills <t>...");
  process.exit(2);
}
const executablePath = process.env.CHROMIUM
  || ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find(existsSync);
const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-gpu"],
});
let errors = 0;

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { errors++; console.error("PAGE ERROR", e.message); });
  page.on("console", (m) => { if (m.type() === "error") { errors++; console.error("CONSOLE", m.text(), m.location().url || ""); } });
  const url = pathToFileURL(process.cwd() + "/scene.html").href;
  await page.goto(url);
  let spec = await page.evaluate(() => window.ready);
  if (spec.fps !== 30) {
    console.error(`scene.html asks for ${spec.fps} fps; encode assumes 30, so render at 30`);
    process.exit(2);
  }
  if (spec.width !== 1080 || spec.height !== 1920) {
    // reload at the real size, so anything the page measured while loading is measured again
    await page.setViewportSize({ width: spec.width, height: spec.height });
    await page.goto(url);
    spec = await page.evaluate(() => window.ready);
  }
  return { page, spec };
}

if (mode === "stills") {
  const { page } = await openPage();
  mkdirSync("check", { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) {
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ path: `check/t${t.toFixed(2)}.png` });
  }
} else {
  // render is a pure function of t, so contiguous chunks can be captured by independent pages
  const workers = Number(process.env.CAPTURE_WORKERS) || Math.max(1, Math.min(4, Math.floor(os.cpus().length / 4)));
  const first = await openPage();
  const total = Math.round(first.spec.fps * first.spec.duration);
  const chunk = Math.ceil(total / workers);
  mkdirSync("out", { recursive: true });
  // clear an earlier render's numbered frames, or a shorter capture would inherit its tail
  for (const f of readdirSync("out")) if (/^\d{5}\.(jpg|png)$/.test(f)) unlinkSync(`out/${f}`);
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const { page, spec } = w === 0 ? first : await openPage();
    for (let i = w * chunk; i < Math.min(total, (w + 1) * chunk); i++) {
      await page.evaluate((t) => window.render(t), i / spec.fps);
      await page.screenshot({ path: `out/${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 95 });
      if (++done % 60 === 0) console.log(`frame ${done} / ${total}`);
    }
  }));
  console.log(`captured ${total} frames with ${workers} workers`);
}
await browser.close();
if (errors) {
  console.error(`${errors} page error(s); frames may be wrong`);
  process.exit(1);
}
