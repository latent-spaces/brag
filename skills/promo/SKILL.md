---
name: promo
description: Turn a folder of real photos and videos (plus an optional brief) into a short promo video with music, on-screen text in any language, a poster frame and a ready-to-post caption. Can generate or edit images through the codex image bridge to fill story gaps. Use when someone says "/promo", "make a promo from these photos/videos", "promo video", "make a reel from this footage", "ad from these clips", or points at a folder of media and wants a promo. Not for launch videos of a code project or website (that's /brag).
---

# /promo

Real footage in, a postable promo out. You cut the whole thing yourself: pick the shots, find the story, set the type, mix the sound, render. `footage.py` handles the fiddly footage steps (HEIC, rotation, HDR, frame rates, audio length) the same way every run.

It should look like it was cut by a good editor: the best shots only, clean type, a soundtrack that fits, nothing that doesn't earn its place.

`<skill-dir>` is the directory holding this SKILL.md (Claude Code prints it as "Base directory for this skill"). Below, `F=<skill-dir>/scripts/footage.py`.

Usage: `/promo [folder] [options]`. Flags or plain language.

| Option | Default |
|---|---|
| `[folder]` | current directory if it holds media; otherwise ask |
| `--brief <file or text>` | `brief.md` / `brief.txt` in the folder |
| `--lang <code>` | from the brief → text visible in the footage → ask |
| `--tone <preset or freeform>` | inferred; `default` if nothing clearly fits |
| `--format vertical\|landscape\|square` | vertical 1080×1920 (landscape 1920×1080, square 1080×1080), 30fps |
| `--duration <s>` | ~20 (15–30) |
| `--music <file>\|none` | an audio file in the folder, else a bundled track picked by tone |
| `--no-ai` | AI images on when the bridge works |

Write deliverables to `promo-output/` in the current directory (`promo-output-YYYY-MM-DD-HHmmss/` if that exists). Every intermediate goes in its `work/` subfolder. **Never modify, move or delete anything in the source folder.**

Needs ffmpeg/ffprobe with zscale (tested on 5.1), ImageMagick (6 or 7), Python 3, Node and a Chromium. Check once at the start. If one is missing, say which and stop. Everything runs locally; only the optional AI images leave the machine (see below).

## 1. Inventory and look

1. List the folder's media, subfolders included: photos, videos, audio files (music candidates), `logo.*`, and a brief file. Skip dotfiles and any `promo-output*/` folder from earlier runs (`prep` drops them too).
2. Run `python3 $F prep <out>/work <files...>`. It writes:
   - `work/manifest.jsonl`: one line per file with `index`, `kind`, display `width`/`height` (rotation applied), `fps`, `duration`, `hdr`, `has_audio`, `cuts` (hard cuts inside a clip, in seconds), or `error` when a file can't be read. Tell the user which files failed and carry on without them.
   - `work/stills/NNN.jpg`: every photo decoded (HEIC, GIF and BMP too), upright, converted to sRGB (iPhone photos are Display P3) and metadata stripped so GPS never travels.
   - `work/sheets/`: contact sheets. `photos-NN.jpg` holds 12 photos labelled by index; `video-NNN.jpg` holds 12 frames per clip (the opening frame, then its scene cuts, up to 11, then evenly spaced frames) with the index and timestamp burned in.
3. **Look at the sheets, not the originals.** Read every sheet first. Only then open full-size stills, or pull a frame (`python3 $F shot <clip> <t> 0.034 <W>x<H> 0.5 work/peek/` at the clip's own size from the manifest, which tone-maps HDR the way the render will), for the candidates. This keeps big folders affordable. Judge like an editor: sharp, steady, well lit, subject clear, something happening. Drop blurry, shaky, dark and near-duplicate shots.
4. **The words.** Footage has no copy, so the text comes from:
   - the brief (`--brief`, or `brief.md` / `brief.txt` in the folder): name, what it is / the offer, who it's for, CTA (phone, URL, address, handle), lines that must appear, colors, font, language, don'ts;
   - text visible in the footage (signs, packaging, menus, screens);
   - the brand's own website, when the user points you at it: scrape a few key pages (home, about, services, contact) and quote them. Prefer its own wording in the promo's language (many sites have `/fa`, `/ar` versions) over translating.
   If the name, the CTA or the language is still unknown, ask **one** question that lists everything missing. Never guess a phone number, a price or an address.
5. Before planning, answer: What is it (one sentence)? Who is it for? What's the offer? What's the hero shot? What order tells the story? What's the CTA? Which tone? What does the story need that the footage doesn't show? What's the one-line caption?

## 2. Plan → `promo-plan.md`

The angle, the hook, then a shot list. For each shot: source (manifest index + file; copy the path from that index's manifest line, never infer it from sort order), in/out points (clip) or motion (photo), on-screen text (verbatim from the brief or the footage), duration, transition. Then: tone, music track and the cue timestamps you'll cut on, an **AI assets table** (file · prompt · purpose · shot · footage-only fallback), and the CTA end card. Durations add up to the target.

If the user points at one thing (a new dish, opening night, one product), make that the focus.

**Shape:** Hook (the strongest moving shot, 1–2s, not a logo) → what it is → 2–4 best moments → the offer or proof → CTA end card, held ≥2s. A starting shape, not a template.

Not enough material for the target length? Hold shots longer or make it shorter (15s is fine). Don't loop a shot, and don't pad with AI images.

## Rules

- **Short.** 15–30s; ~20s is the sweet spot.
- **Hook first.** The first 1–2 seconds decide whether anyone keeps watching.
- **Clear to a stranger.** After one viewing, they know what it is, who it's for and how to get it.
- **Real footage first.** The user's material is the star. Best shots only; no abstract filler.
- **Truthful.** Text comes only from the brief, the footage or the brand's own site. No invented prices, discounts, stats or testimonials. Third-party brands visible in the footage (logos on props, vehicles, screens) stay out of frame or get blurred, so the promo doesn't imply a partnership. AI imagery never depicts the actual product, place or people as something they aren't: no fake rooms, dishes or product shots. Edits only remove or clean up; they never extend or re-stage a real scene. Fully generated images appear only as clearly illustrative, title or background elements.
- **Readable.** A line meant to be read stays fully on screen about 0.3s per word (at least ~1s), counted from when the whole line has landed. Fast in, then hold.
- **Private stays private.** The footage, the render and the plan stay on the machine; never upload them. AI images send the prompt, and for edits the source still, to OpenAI through codex, so skip AI (`--no-ai`) for confidential footage. No EXIF locations, stray phone numbers or addresses (unless they're in the brief), and no documents or screens with personal data. Flag licence plates and bystanders' faces in the plan, and blur them if the user wants.
- **Every frame postable.**

## Tones

Presets are defaults. A freeform direction ("90s VHS travel ad") refines or overrides them.

| Tone | Feel | Cutting |
|---|---|---|
| `default` | Warm, upbeat, clean | 6–8 shots; soft cuts landing on beats |
| `premium` | Slow, elegant, lots of space | 4–5 long shots; slow push-ins; slow fades |
| `energetic` | Fast and punchy | 10–14 shots, some under 1s; hard cuts and zoom punches on beats |
| `recap` | Event highlights building to a peak | Many short shots, rough chronology; crowd sound up at the peak |
| `cinematic` | Trailer-scale | Wide shots, big type, dramatic wipes |

## 3. Build

### Footage

- **Clips:** `python3 $F shot <clip> <start_s> <dur_s> <W>x<H> <cx> work/frames/<shot>/` writes exactly round(dur×30) upright JPGs (`00001.jpg`…), HDR tone-mapped to SDR, scaled to cover the frame and cropped at horizontal position `cx` (0 = left, 0.5 = center, 1 = right). Pick `cx` per shot so the subject stays in frame when landscape footage goes vertical. The manifest's `cuts` lists the hard cuts inside each clip; keep shots from straddling them. Start shots on stable, sharp moments.
- **Photos:** use `work/stills/NNN.jpg` as `still` shots and let the kit move them with a slow push-in (`push`; `origin` sets where it zooms toward, so an off-centre origin reads as a drift). It doesn't pan a cropped photo sideways: for a landscape photo in a vertical promo use `panel`. Don't pre-render photo motion with `zoompan`; it jitters. Next to video, give photos a little grain (`grain: 0.06`) so they sit in the same world.
- **Other-aspect media** (a landscape clip or photo in a vertical promo, or the reverse): `panel: true` shows the whole frame over a blurred copy of itself instead of cropping people out. Cut the clip at its own aspect (e.g. `1080x608` for 16:9 in vertical).

### The page

Start from the kit: copy `<skill-dir>/kit/scene.html` and `<skill-dir>/kit/kit.js` into `work/`, then
- write `work/timeline.js` as `window.PROMO = { width, height, duration, end, grain, fonts, shots: [...] }`. Shots come in order, each `{ a, b }` in seconds plus `clip: "frames/s01", n` (from `shot`) or `still: "stills/004.jpg"`, and optionally `panel`, `push: [from, to]`, `origin`, `filter` (e.g. a dimmed, blurred background behind a list card), `grade` and `grain`. `kit.js` documents every field;
- put the `@font-face` rules for the downloaded woff2 files in `work/fonts.css` (the template links it; a missing file fails the capture);
- put the captions and the end card in `scene.html`: `.cap.low|.high|.mid` with `data-a`/`data-b` (on screen from/to), each line a `[data-at]` element (when it lands), `data-scrim="top|bottom"`. Set the brand tokens (`--ink`, `--paper`, `--accent`, fonts) in `:root`.
The kit keeps every frame a pure function of t, looks up clip frames with the rounding fix (`floor((t - a) * 30 + 1e-6) + 1`), and scales type and safe zones to the format. So the same timeline renders vertical, landscape or square: change `width`/`height` and re-cut the clip frames at the new size. Anything custom you add must also be a pure function of t: no timers, and no CSS transitions or animations of its own.

Capture with the bundled script, run from `work/` after `npm i --prefix . playwright-core`:
- `node <skill-dir>/scripts/capture.mjs stills 1.2 3.4 …` writes PNG stills to `work/check/`.
- `node <skill-dir>/scripts/capture.mjs frames` writes every frame to `work/out/00000.jpg…`, split across parallel pages (4 on a 16-core box; `CAPTURE_WORKERS=n` to change). It uses `/usr/bin/chromium` when present (`CHROMIUM=path` to override) and exits non-zero on any page error.

### Text in any language

- The page draws all text. Never use ffmpeg `drawtext` for on-screen text: most builds have no text shaper and can't join Persian/Arabic letters.
- Set `lang` and `dir` on every text element: `dir="rtl"` for Persian, Arabic, Hebrew, Urdu.
- Inside RTL text, wrap phone numbers, URLs, prices and Latin brand names in `<bdi dir="ltr">` so they don't come out reversed or jumbled. Use the digits the brief uses.
- Font: the brief's font; otherwise a Google Font that covers the script (Vazirmatn for Persian, the matching Noto family otherwise). Download the woff2 into `work/` and load it with `@font-face`, so capture never waits on the network.
- **Animate joined scripts (Arabic, Persian, Urdu, Devanagari…) by word or line, never per character.** Per-character spans break the letter joining. Per-character is fine for Latin.
- Safe zones: keep text and the CTA out of the top ~12% and bottom ~20% in vertical (8% / 10% in landscape), where platform UI sits, with ~6% side margins. The kit's `.cap.low` grows upward from that line, so longer text can't cross it.
- No letter-spacing on Arabic-script text: it pulls joined letters apart (the kit already turns it off for `lang="fa|ar|ur"`).

### Brand

Use the logo file and brief colors if given (logo files often sit on a white box or carry a thin frame line; make the background transparent and check the edges); otherwise a restrained palette taken from the footage itself. Titles sit on the footage with a soft scrim for contrast, not on flat color slides.

### Sound

- **Music.** A `--music` file or an audio file in the folder wins. Otherwise pick from `<skill-dir>/assets/music/` (linked to /brag's bundled music; a standalone install has none, so ask for a track or render with a silent track): 5 upbeat "Business Moves" tracks, each with `cues/<track>.music-cues.md` (tempo, beat grid, strong cues). For `premium` or `cinematic`, tell the user the bundled tracks are upbeat and suggest they supply one. For a user track, get cues with `uv run --project <skill-dir>/scripts python <skill-dir>/scripts/analyze_music_cues.py <track> --output-json work/cues.json --output-md work/cues.md`.
- **Cutting.** `energetic` and `recap` cut on beats, with major moments on strong cues (within ~0.1s). Other tones cut where the shot wants and let big moments land near a strong cue.
- **Live sound.** Check `has_audio`. Keep sound that adds something (ambience, cheers, sizzle, a laugh) about 15 dB under the music, with 50–100 ms fades at each cut. Mute wind and handling noise. Don't cut in the middle of someone speaking; `silencedetect` shows the gaps.
- Mix to `work/mix.wav` with the music faded in and out; the fade-out must finish by the video's last frame. Its length doesn't have to match: `encode` pads or trims it to the video, and a mix that runs long gets cut off at that point.

### AI images (codex bridge)

Optional dependency: [gpt-image-bridge](https://github.com/oakplank/gpt-image-bridge) (installed at `~/.claude/skills/gpt-image-bridge/bin/gpt-image-2`, or `gpt-image-2` on `PATH`) plus a logged-in `codex`. Skip this section, and say so, if `--no-ai` is set, the bridge is missing, or `codex login status` isn't logged in. Edits need a bridge that accepts `--image`; if `grep -q -- --image <bridge>` finds nothing, use gap-fill only.

- **Gap-fill** (prompt only): title or background plates, textures, or a clearly illustrative scene for a beat the footage can't show (e.g. a line-art route map behind a services card).
  - **Frame for the crop:** the bridge makes 2:3 (`--size 1024x1536`) or 3:2 (`--size 1536x1024`), so ask for the subject centred and a quiet middle where text will sit. Say "no text, letters, logos" unless text is the point, because it invents lettering.
  - **Match the footage:** describe its light, palette and grade in the prompt, then finish in the timeline with `grade` (e.g. `saturate(.9) contrast(1.05) sepia(.06)`) and `grain` (~0.1). A clean render next to phone footage looks pasted in.
  - **Cache:** save as `work/ai/<name>.png` with the prompt in `work/ai/<name>.prompt.txt`. Re-cuts and other formats reuse the file unless the prompt changes; don't spend quota twice.
- **Edits** (`--image <source still>`): only to remove or clean up something in a region with no text, logos, faces or product detail. The model re-renders the *whole* image. In testing it removed a toy truck cleanly but changed "31st" to "31th" on an award plaque and shifted the framing (its sizes are 2:3/3:2/1:1, so a 9:16 source gets reframed). So its output is a draft, never the final frame:
  - pad the still to the bridge's aspect (2:3 for a vertical still, 3:2 for a landscape one) and pass the matching `--size 1024x1536` or `--size 1536x1024`, so the result lines up with the source;
  - composite only the edited region back onto the original through a feathered mask;
  - compare every text, face and product area with the source.
  If it won't align or anything else changed, do the edit with ImageMagick/ffmpeg (crop, blur, grade) or skip it. Anything with text on it gets ImageMagick/ffmpeg, not the bridge.
- Each call takes 4–6 minutes and uses the user's ChatGPT quota: **at most 3 per run** unless the user asks for more. Start them in the background right after the plan so they run while you build. Read every result, and reject anything off-brand, uncanny, carrying invented text, or against the Truthful rule. A failed or rejected image never blocks the render; use the plan's footage-only fallback.
- **Label it:** list AI shots in the plan's AI table and in your report, and add a short "Includes AI-generated illustration" line to `caption.txt` (in its language). Some platforms ask for this.

### Check before the full render

Capture stills (`capture.mjs stills …`) in the middle of every shot, at every transition, and on the first frame after every cut (clips that were already edited hide dissolves, blurs and light leaks there), and look at them:
- Upright?
- HDR clips not washed out?
- Text joined and running in the right direction, numbers not reversed?
- Inside the safe zones?
- No overflow, collisions or low contrast, and no captions laid over signage or lettering in the footage?

A plain crossfade between two busy shots makes a muddy double exposure: dip through black or the brand color, or cut. Fix, re-check, then capture every frame.

### Encode

Pick the poster frame first (see Deliver) and copy the chosen `work/out/NNNNN.jpg` to `<out>/promo.jpg`. Don't copy it over frame 0: a settled poster frame followed by the opening frames flashes for one frame at the start and on every loop. Then run `python3 $F encode work/out work/mix.wav <out>/promo.mp4 --poster <out>/promo.jpg`. `--poster` embeds it as cover art, which players and file browsers show. Pass `none` instead of the wav for a silent track (a video with no audio track turns into a GIF on Telegram).

It writes BT.709-tagged H.264 yuv420p + AAC with `+faststart`, exactly frames/30 seconds long, loudness-normalized to −14 LUFS (two-pass, true peak under −1.5). It refuses a frame folder that mixes PNG and JPG, has gaps in its numbering, or has a file that isn't really the format its name says, and it checks the frame count of what it wrote.

## 4. Deliver

- **`promo.jpg`:** the strongest *settled* frame (text fully in, not mid-transition). It's embedded as cover art. Platforms that let you pick a cover (Instagram, YouTube) should get this file.
- **`caption.txt`:** in the promo's language, 1–3 sentences plus the CTA, and optionally 3–5 hashtags. Specific, in the tone, no "excited to share".
- `promo-plan.md` and `work/` stay.
- **Tell the user:** where the video and caption are, one sentence on the angle, which shots are AI-generated or AI-edited, and an offer to re-cut a shot, try another tone, or render another format (reusing `work/`).
