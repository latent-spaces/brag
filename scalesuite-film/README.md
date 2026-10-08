# ScaleSuite — social film source

Code-built 27.5 s acquisition film for ScaleSuite (Google Ads for Québec real-estate teams).
HTML/CSS/SVG rendered frame-by-frame with Playwright, encoded with FFmpeg; the soundtrack is
synthesised in Python. Everything on screen is a pure function of time.

```
./build.sh preview [v2|v1]          # 540-wide 30 fps previews → ../brag-output/previews/
./build.sh final   [v2|v1]          # 1080×1920 + 1080×1350, 60 fps → ../brag-output/scalesuite-*[-v2].mp4
VO=voice.wav ./build.sh final v2    # same, with the voiceover mixed in (music ducked under speech)
```

**V2** (default) is V1 plus reading holds from `src/timemap.js`. The scenes keep their original
animation clock; the film clock only eases to a near-stop at settled moments. `?v=1` in the browser,
or `v1` in the build, reproduces the original 27.5 s timing and filenames.

**Voiceover:** `audio/mix_vo.py` mixes one take, or one file per line (`--vo l3.wav@6.9`), over the
soundtrack stems in `../brag-output/audio-v2/`. Music is ducked about −9 dB and SFX about −4 dB under
speech, the voice is not compressed, and the mix is normalised to −14 LUFS / −1.5 dBTP. Line timings are
in `../brag-output/voiceover-timing-v2.md`.

Requirements: Node 22 + Playwright (Chromium), FFmpeg, Python 3 with numpy + scipy
(`pip install numpy scipy pillow potracer`).

## Layout

| Path | What |
|---|---|
| `index.html` | Stage; `?format=vertical\|feed`, `?t=12.3` (static frame), `?play` (real-time) |
| `src/core.js` | Easing, `SS.set` placement, masked kinetic text, odometer, icons, logo component |
| `src/timemap.js` | V2 reading holds (shared by picture and `audio/music.py`) |
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
| `audio/music.py` | 120 BPM score + picture-synced effects, one shared reverb; follows the time map; `--stems` |
| `audio/mix_vo.py` | Voiceover mix: ducking, loudness normalisation |
| `assets/` | Inter (the site's font), logo source PNG + `trace_logo.py` |

Each scene keeps its timing in a `T` table and its per-format layout in `SS.pick(vertical, feed)`
tables at the top of the file, so copy, timing and composition can be edited in one place.

Copy is limited to claims verifiable on https://scalesuiteqc.ca/fr (no metrics, prices,
superlatives or client names). Brokers are shown as "Courtier 01…".
