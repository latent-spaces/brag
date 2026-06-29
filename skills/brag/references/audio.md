# Audio reference

All SFX are CC0 (Kenney.nl, public domain). Music and SFX should be used by default unless the user passes `--no-music`, `--no-sfx`, the required assets are missing, or the plan explicitly chooses silence as the strongest creative move.

Bias toward a smooth, professional result: one tasteful music bed plus a small number of well-timed SFX usually feels better than silence.

---

## Audio-reactive visuals

When music is present, prefer a subtle audio-reactive treatment unless the tone asks for stillness or deadpan restraint. This does not mean beat detection. It means Hyperframes can pre-extract per-frame audio data and use RMS/frequency-band energy to modulate existing visual elements.

Good uses:
- Hero glow or sky warmth breathes slightly with RMS
- Product card, phone, or metric panel gains subtle presence on bass
- Title, quote, or logo gets a soft treble glow on stronger musical moments
- Background depth, vignette, or light layer gently swells with the bed

Avoid:
- Waveform displays, equalizer bars, musical notes, or generic visualizer graphics
- Strobing, heavy pulsing, or text scaling that hurts readability
- Treating audio-reactivity as a substitute for good scene timing
- Claiming exact beat/BPM sync unless a real beat detector is available

Suggested plan notation:
```
Audio-reactive treatment: subtle; use music RMS/bass to make the hero glow and product card presence breathe. No waveform/equalizer visuals.
```

Hyperframes implementation note: follow the current hyperframes audio-reactive workflow (its `references/audio-reactive.md`) to extract per-frame audio data and sample it synchronously inside the composition timeline. The extraction helper ships with the Hyperframes/GSAP skills — `/brag` does not provide it, so don't hardcode a path to it.

---

## Asset paths

SFX live under `sfx/{casino,impact,interface,ui}/`, and the individual keypress set under `sfx/keyboard/`. The assets root is `~/.claude/skills/brag/assets/` in the installed skill and `skills/brag/assets/` in this repo copy.

Music lives in the installed skill at `~/.claude/skills/brag/assets/music/`. In this repo copy, it lives at `skills/brag/assets/music/`.

Bundled music cue presets live beside the music:

```text
skills/brag/assets/music/cues/<track-stem>.music-cues.md
skills/brag/assets/music/cues/<track-stem>.music-cues.json
~/.claude/skills/brag/assets/music/cues/<track-stem>.music-cues.md
~/.claude/skills/brag/assets/music/cues/<track-stem>.music-cues.json
```

SFX analysis lives beside the SFX library:

```text
skills/brag/assets/sfx/sfx-analysis.md
skills/brag/assets/sfx/sfx-analysis.json
~/.claude/skills/brag/assets/sfx/sfx-analysis.md
~/.claude/skills/brag/assets/sfx/sfx-analysis.json
```

**Critical: copy audio files into the composition project before rendering.** Hyperframes validates and serves assets from the composition directory. Always copy the files you need into `brag-output/composition/assets/` first:

```bash
# Create local asset dirs
mkdir -p brag-output/composition/assets/sfx/interface brag-output/composition/assets/sfx/impact brag-output/composition/assets/sfx/casino brag-output/composition/assets/sfx/ui
mkdir -p brag-output/composition/assets/music

# Copy only the files you plan to use (not the entire library)
# From the repo copy:
cp skills/brag/assets/sfx/interface/bong_001.ogg brag-output/composition/assets/sfx/interface/
cp skills/brag/assets/sfx/impact/impactBell_heavy_000.ogg brag-output/composition/assets/sfx/impact/
cp skills/brag/assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3 brag-output/composition/assets/music/

# From an installed Claude skill, use ~/.claude/skills/brag/assets/... instead.
```

Then in the composition HTML, paths are **relative to the `composition/` directory**:
```
assets/sfx/interface/bong_001.ogg
assets/sfx/impact/impactBell_heavy_000.ogg
assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3
```

Never use absolute paths (starting with `/Users/...`) — they will silently fail in the renderer.

---

## SFX library — approved files

The family SFX (casino, impact, interface, ui) live directly under `sfx/`; the individual keypress set lives in `sfx/keyboard/`.

Read `sfx-analysis.md` before choosing files — it lists safer picks by use case and flags files with high-frequency risk. Prefer low/medium HF risk for polished and repeated moments; reserve high-risk files for tiny isolated accents or chaotic tones.

### `keyboard/` — Individual keypress sounds

32 CC0 single keypress WAV files (`keypress-001.wav` through `keypress-032.wav`). Each is a distinct key sound at a slightly different velocity and character. Use these for per-character typing animations — randomize across the set so repeated characters don't sound robotic.

**Source:** [Keyboard Soundpack #1](https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes) by unicae_games — CC0

### `interface/` — UI sounds

| Files | Character | Use for |
|---|---|---|
| `click_001–005.ogg` | Sharp, precise | Button tap, CTA, any tap action |
| `glitch_002.ogg`, `glitch_004.ogg` | Digital distortion | Tech/AI moment, chaotic accent |
| `error_005–006.ogg` | Negative buzz | Comedic fail, wrong answer |
| `switch_001–002.ogg`, `switch_004–007.ogg` | Toggle switch | Feature switching on, binary state |
| `drop_001–003.ogg` | Soft drop | Element landing, gentle placement |
| `bong_001.ogg` | Deep bell | Dramatic announcement — use sparingly |
| `select_008.ogg` | Selection click | Navigation, item focus |

### `impact/` — Impact sounds

More physical and cinematic. Excellent for big moments and transitions.

| Files | Character | Use for |
|---|---|---|
| `impactSoft_medium_000–004.ogg` | Medium soft thud | Major reveal, hard transition — safest family |
| `impactSoft_heavy_000–004.ogg` | Heavy soft thud | Comedic bonk, weight, silly moment |
| `impactBell_heavy_000.ogg`, `_003.ogg`, `_004.ogg` | Deep resonant bell | Cinematic reveal, logo slam, dramatic moment |
| `impactPunch_heavy_000–004.ogg` | Heavy punch | Aggressive beat, chaotic tone |
| `impactPunch_medium_000–004.ogg` | Medium punch | Impact emphasis |
| `impactWood_light_000–004.ogg` | Light wood knock | Warm, organic tap |
| `impactWood_medium_000–004.ogg` | Wood knock | Warmer accent |
| `impactWood_heavy_000–004.ogg` | Heavy wood hit | Cinematic weight |
| `impactPlank_medium_000–004.ogg` | Plank slap | Comic physical moment |
| `impactPlate_heavy_000–004.ogg` | Metal plate slam | Big hit, aggressive |
| `impactPlate_light_000–004.ogg` | Light metal plate | Notification, crisp accent |
| `impactPlate_medium_000–004.ogg` | Medium plate | Mid-weight accent |
| `impactTin_medium_000–004.ogg` | Tin can hit | Quirky, lo-fi moment |
| `impactGeneric_light_000–004.ogg` | Generic light hit | Versatile small accent |
| `impactMetal_medium_000–004.ogg` | Metal tap | Medium accent |
| `impactMetal_heavy_000.ogg`, `_002.ogg`, `_004.ogg` | Heavy metal clang | Aggressive hit |
| `impactMetal_light_002–003.ogg` | Light metal ping | Small notification |
| `impactGlass_light_001–003.ogg` | Light glass clink | Sparkle, delicate achievement |
| `impactGlass_medium_000.ogg`, `_002.ogg`, `_004.ogg` | Glass tap | Mid-weight accent |
| `impactGlass_heavy_002.ogg` | Glass shatter | Chaotic hit |
| `impactMining_001.ogg` | Mining strike | Industrial, heavy |

### `casino/` — Card and chip sounds

Specific but great for swipe/deal/stack moments.

| Files | Character | Use for |
|---|---|---|
| `card-slide-1–8.ogg` | Card sliding | Swipe action, content sliding in |
| `card-place-1–4.ogg` | Card placement | Item landing, card appearing |
| `card-fan-1–2.ogg` | Cards fanning | Multiple items appearing in sequence |
| `card-shove-1–4.ogg` | Card shoved | Forceful card motion |
| `card-shuffle.ogg` | Shuffle | Transition with motion |
| `chip-lay-1–3.ogg` | Chip placed | Metric placed/confirmed |
| `chips-stack-1–6.ogg` | Chips stacking | Counter incrementing, stacking animation |
| `chips-collide-1–4.ogg` | Chips clinking | Celebratory, success with weight |
| `chips-handle-1–4.ogg`, `chips-handle-6.ogg` | Chips handled | Casual chip movement |
| `dice-shake-1–3.ogg` | Dice shaking | Build-up, anticipation |
| `dice-grab-1–2.ogg` | Dice grabbed | Pick up, quick action |
| `dice-throw-1–3.ogg` | Dice thrown | Chaotic/random moment |
| `die-throw-1–4.ogg` | Single die thrown | Lighter random accent |
| `cards-pack-open-1–2.ogg` | Pack opening | Reveal, product launch moment |

### `ui/` — Clicks and switches

| Files | Character | Use for |
|---|---|---|
| `click1–5.ogg` | Various click tones | Button tap, cleaner than interface clicks |
| `mouseclick1.ogg` | Mouse click | Simulated cursor interaction |
| `rollover1–2.ogg`, `rollover4–5.ogg` | Hover/rollover | Subtle hover feedback, very soft accent |
| `switch1–38.ogg` (most variants) | Switch variants | Toggle, mode change — pick by character |

---

## Tone → SFX energy

| Tone | Energy | Approach |
|---|---|---|
| `default` | Moderate | 3-5 SFX at key moments. `interface/click` or `interface/drop_*` for pop-ins, `impactBell_heavy_000` for success, `impactSoft_medium` for reveals. |
| `polished` | Minimal but present | 2-3 very subtle SFX. `interface/bong_001` for a soft accent. `interface/drop_001` for a gentle reveal. Nothing aggressive. |
| `yc-parody` | Sparse but present | 2-3 restrained cues. One dry reveal hit (`impactSoft_medium`), one UI/card accent, one logo payoff if it fits. |
| `chaotic` | Dense | SFX on every beat, sometimes stacked. Mix `impact/impactPunch_heavy`, `interface/glitch_002`, `casino/dice-throw`, `impact/impactMetal_heavy`. |
| `deadpan` | Very sparse | Prefer one quiet music bed plus 1-2 dry cues. Full silence only when the plan explicitly says silence is the joke. |
| `cinematic` | 2-3 big ones | `impactBell_heavy_000` or `_004` for the hero moment. `impactSoft_medium` for the reveal. `impactBell_heavy_003` for the outro. |
| `app-store` | Consistent light layer | `interface/drop_*` or `interface/click_*` per feature card. `impactBell_heavy_000` on outro. All at 0.65-0.75 volume. |

---

## Moment → sound heuristics

Use these as examples for Hyperframes, not a fixed recipe. Sound should reinforce the edit, not call attention to itself.

| Moment type | Good sound families | Notes |
|---|---|---|
| Sequential cards/items opening | `casino/card-slide-*`, `casino/card-place-*`, `casino/card-fan-*`, `interface/drop_*` | Match the gesture. A card stack uses card sounds; a soft product grid can use drop sounds. For dense sequences, accent the first, last, or rhythmically important items only. |
| Big reveal / payoff | `impact/impactBell_heavy_000`, `_003`, or `_004`, `impact/impactSoft_medium_*`, `interface/bong_001` | One short announcement-style cue when the reveal lands. Keep it brief. |
| Text popping / typed copy | `keyboard/keypress-*.wav` (randomized), `interface/drop_*` | For per-character typing animations, pick a random file from `keyboard/` for each character. For soft label pop-ins, use `drop_001` or `drop_002`. Thin out or skip when copy is dense. |
| Simulated user action | `interface/click_*`, `interface/select_008`, `interface/switch_*`, `ui/mouseclick1`, `ui/switch*` | Use interaction sounds when the video shows a cursor, tap, button, toggle, swipe, or selection. Match the visible action. |
| Success / completion | `impact/impactBell_heavy_000`, `_003`, or `_004`, `casino/chips-collide-*` | Positive accent for approvals, matches, metrics, completed flows, or final CTAs. |
| Chaotic or comedic beat | `interface/glitch_002`, `interface/glitch_004`, `interface/error_005–006`, `impact/impactPunch_heavy_*`, `casino/dice-throw-*` | Reserve louder or weirder cues for tones that can handle them. |

When in doubt, pick fewer cues with better timing. Prefer a coherent sonic palette for the whole video over a grab bag of cute sounds.

---

## Timing rules

These rules apply when Hyperframes is implementing the composition and the motion timings are known:

- Align SFX to the **start** of the animation, not the end
- Entry pop: 0.0–0.1s before the element's first visible frame
- Transition: at the transition start time
- Success ding: at the moment the metric/stat is fully visible
- For staggered elements: usually accent the first, final, or strongest beat; only score every item when that rhythm is intentional and still feels clean

Composition notation:
```
Scene 2 — Reveal — 3s
  "Horse Tinder" scales in at 0.3s  →  SFX: impact/impactSoft_medium_001 at 0.2s
  Tagline fades up at 0.8s          →  (no SFX, let the reveal carry)
  Transition at 3.0s                →  SFX: interface/drop_001 at 2.9s
```

---

## Music

### Available tracks

All tracks are "Happy Beats / Business Moves" by ende.app. Upbeat, clean, corporate-adjacent. Good across multiple tones.

| Filename | Duration | Character | Best for |
|---|---|---|---|
| `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` | 2:44 | Full upbeat track, most energetic | `default`, `app-store` |
| `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` | 1:54 | Mid-energy, slightly more laid-back | `default`, `yc-parody` |
| `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` | 1:00 | Compact loop, punchy | `default`, `chaotic` |
| `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` | 1:28 | Warm and business-y | `yc-parody`, `app-store` |
| `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` | 1:58 | Steady and clean | `polished`, `cinematic` |

For `deadpan` tone: prefer vol-12 at very low volume (0.12-0.18). Skip music only if the plan explicitly chooses silence.

### In a composition

After copying files (see Asset paths above), reference them with relative paths from `composition/`:

```html
<audio id="bg-music" data-start="0" data-duration="[total]" data-track-index="10" data-volume="0.35" src="assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3"></audio>
```

Volume: 0.3-0.4 for normal music beds. Use 0.12-0.22 for deadpan or very restrained parody. Never above 0.5. SFX at 0.55-0.85, with softer values for polished/deadpan.

If the music file doesn't exist, skip it and notify the user after rendering.

### Beat and cue sources

Beat sync needs a cue source. Three are available — use the richest one the environment supports. Beat sync now works on **any** track, not just bundled ones. The two any-track methods (2 and 3) have orthogonal requirements — option 2 needs Python, option 3 needs a recent Hyperframes — so when one is unavailable the other usually covers it.

1. **Bundled track → precomputed preset (richest, instant, no deps).** The bundled tracks ship with cue metadata. Read the matching markdown summary, and pass the JSON path in `composition-brief.md`:

```text
assets/music/cues/<track-stem>.music-cues.md
assets/music/cues/<track-stem>.music-cues.json
```

2. **Any track → extended analysis (richest for custom tracks; needs Python, any Hyperframes version).** For a custom track — or to refresh a bundled one — run `analyze_music_cues.py` on the audio file. It produces the same rich cue JSON/Markdown for any track. Run it via `uv`, which auto-provisions the deps (`librosa`, `numpy`, `scipy`, `soundfile`) from `skills/brag/scripts/pyproject.toml` — no manual `pip install` needed:

```bash
uv run --project skills/brag/scripts \
  python skills/brag/scripts/analyze_music_cues.py <track>.mp3 \
  --output-json <output-dir>/composition/assets/music/cues/<stem>.music-cues.json \
  --output-md  <output-dir>/composition/assets/music/cues/<stem>.music-cues.md
```

This is the fallback when `hyperframes beats` (option 3) is unavailable — e.g. an older pinned Hyperframes. If neither `uv` nor the Python deps are available, use option 3 instead.

3. **Any track → `hyperframes beats` (simple, no Python; needs Hyperframes ≥ 0.6.99).** After the music is wired into the composition, run:

```bash
npx hyperframes beats <output-dir>/composition
```

It writes `beats/<audio>.json` = `{ version, audio, beats: [{ time, strength }] }` — a beat grid with a per-beat `strength` (0-1). There is no `strongCues` array; derive "strong" beats by taking the highest-`strength` ones. `beats` was added in Hyperframes 0.6.99; on an older pinned install it won't exist — fall back to option 2 (the script), or to the `unavailable` note below.

The preset and `analyze_music_cues.py` share the rich schema:

- `duration`, `tempo`
- `beats`: beat-grid points with `time` and normalized `intensity`
- `strongCues`: highest-value landing moments with `time`, `intensity`, and `kind` (`strong_beat` / `onset_peak`)
- `scoring`: feature and normalization metadata

`hyperframes beats` is the simpler floor: `beats[]` with `{ time, strength }` only.

Planning rules (apply to whichever source you have):

- Use cue metadata to bias timing, not control it.
- Major reveals may move toward strong cues within about `±0.15s`.
- Smaller entrances may align to nearby beat points within about `±0.10s`.
- Use 1-3 strong cue locks per 15-25s video.
- Ignore cues when they harm copy readability, scene pacing, or the product story.
- For deadpan or restraint-heavy tones, cues should be rare, quiet, or saved for the final logo.

Cue/beat metadata is not a substitute for Hyperframes audio-reactive visuals: it helps with beat/swell timing; audio-reactive data helps subtle visual properties breathe with the music.

If no source is available (no preset, no Python deps, and `hyperframes beats` not run), write:

```text
Music cue guidance: unavailable; continue without beat/cue sync.
```

### Adding SFX elements

Put the music bed on a low track and give each overlapping SFX its own ascending track-index (e.g. music at 10, SFX from 11 up). Never share a track-index between overlapping audio.

```html
<audio id="sfx-1" data-start="0.2" data-duration="1" data-track-index="11" data-volume="0.80" src="assets/sfx/interface/drop_001.ogg"></audio>
```

Wire each `<audio>` clip per the current hyperframes Data Attributes + Video/Audio contract (`data-track-index`, `data-volume`, `data-start`, `data-duration`). `/brag` owns only the volume policy above and the track-allocation convention; Hyperframes owns the clip schema.

---

## ElevenLabs API reference

Voiceover generation uses the ElevenLabs Text-to-Speech API. Reference for use in Step 3.

### Endpoint

```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
```

### Authentication

Pass the API key in the `xi-api-key` header:

```bash
xi-api-key: ${ELEVENLABS_API_KEY}
```

### Request body

```json
{
  "text": "The text to speak...",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.35,
    "similarity_boost": 0.75,
    "style": 0.15,
    "use_speaker_boost": true
  }
}
```

### Key parameters

| Parameter | Default | Notes |
|---|---|---|
| `voice_id` | `21m00Tcm4TlvDq8ikWAM` (Rachel) | Use `--voice` to override. Available voices: Rachel, Adam (`EXAVITQu4vrVn66Der6B`), Bill (`pqHfZKP75CvOlQylNhV4`), etc. |
| `model_id` | `eleven_multilingual_v2` | Best quality multilingual model. Also supports `eleven_turbo_v2_5` for faster generation. |
| `stability` | `0.35` | Lower = more expressive/emotional variation. 0.25-0.45 for energetic brag tone. 0.5-0.7 for deadpan/stable. |
| `similarity_boost` | `0.75` | Higher = closer to original voice. 0.5-0.85 range. |
| `style` | `0.15` | Exaggeration. 0.0-0.3 range. Keep low for natural delivery. |

### Response

Returns `audio/mpeg` binary stream. Save directly to a `.mp3` file:

```bash
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ ... }' \
  --output <output-dir>/composition/assets/voiceover.mp3
```

### Getting an API key

Users can sign up at https://elevenlabs.io and find their API key under Profile → API Keys.

**Plan requirement:** The free tier cannot use library voices via the API. A paid plan (Starter at $5/mo or above) is required for API access to pre-made voices. Free tier users can still use custom/cloned voices via the API, or skip ElevenLabs and use `npx hyperframes tts` (offline Kokoro-82M model) instead.

### Common voice IDs

| Name | Voice ID | Character |
|---|---|---|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Warm, clear, energetic — best default for brag |
| Adam | `EXAVITQu4vrVn66Der6B` | Deep, confident, authoritative |
| Bill | `pqHfZKP75CvOlQylNhV4` | Deep, serious, storytelling |
| Antoni | `ErXwobaYiN019PkySvjV` | Friendly, warm, approachable |
| Sarah | `ODIxUW2JmhRQrl2I3pwp` | Bright, articulate, professional |
