# ScaleSuite — social film source

Code-built 27.5 s acquisition film for ScaleSuite (Google Ads for Québec real-estate teams).
HTML/CSS/SVG rendered frame-by-frame with Playwright, encoded with FFmpeg; the soundtrack is
synthesised in Python. Everything on screen is a pure function of time.

```
./build.sh preview   # 540-wide 30 fps previews of both formats → ../brag-output/work/preview-*.mp4
./build.sh final     # 1080×1920 + 1080×1350, 60 fps → ../brag-output/scalesuite-*.mp4
```

Requirements: Node 22 + Playwright (Chromium), FFmpeg, Python 3 with numpy + scipy
(`pip install numpy scipy pillow potracer`).

## Layout

| Path | What |
|---|---|
| `index.html` | Stage; `?format=vertical\|feed`, `?t=12.3` (static frame), `?play` (real-time) |
| `src/core.js` | Easing, `SS.set` placement, masked kinetic text, odometer, icons, logo component |
| `src/logo.js` | Generated: the public logo vectorised (mark + per-letter wordmark) |
| `src/scenes/00-background.js` | Off-white base, drifting mint light, the mint panel (Motif C) |
| `src/scenes/01-problem.js` | S1 hook (1 → 10 courtiers) + S2 problem build-up + collapse |
| `src/scenes/02-platform.js` | S3 logo reveal + S4 centralization hub |
| `src/scenes/03-personal.js` | S5 one card → four personalized campaigns |
| `src/scenes/04-managed.js` | S6 dark hero stage: Créées / Suivies / Optimisées |
| `src/scenes/05-lead.js` | S7 search → sponsored result → LEAD VENDEUR → Courtier 03 → CRM |
| `src/scenes/06-finale.js` | S8 thesis + S9 lockup and CTA |
| `src/film.js` | Timeline runner, `SS.renderFrame(t)`, poster time |
| `render/` | Static server, `stills.mjs` (single frames), `frames.mjs` (parallel sequence), `sheet.py` |
| `audio/music.py` | 120 BPM score + picture-synced effects, one shared reverb |
| `assets/` | Inter (the site's font), logo source PNG + `trace_logo.py` |

Each scene keeps its timing in a `T` table and its per-format layout in `SS.pick(vertical, feed)`
tables at the top of the file, so copy, timing and composition can be edited in one place.

Copy is limited to claims verifiable on https://scalesuiteqc.ca/fr (no metrics, prices,
superlatives or client names). Brokers are shown as "Courtier 01…".
