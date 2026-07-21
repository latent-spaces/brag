# Step 3: Hand off to Hyperframes

## Create the composition brief

Write `brag-output/composition-brief.md` before creating or editing the Hyperframes composition.

```markdown
# Hyperframes Composition Brief: [App Name]

## Objective
Create a short launch-style brag video for [App Name].

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: [landscape / vertical / square] — [width]x[height]
- Duration: [15-25 seconds]

## Source Material
- Project root: [path]
- Primary files read: [index.html, styles.css, README, etc.]
- Product name: [name]
- Tagline / strongest claim: [line]
- Key UI or visual moment to recreate: [specific element]
- Copy that must appear verbatim:
  - [line 1]
  - [line 2]

## Creative Direction
- Tone preset: [default / polished / yc-parody / chaotic / deadpan / cinematic / app-store]
- Creative direction: [freeform phrase, inferred or user-provided]
- Interpretation: [how tone affects pacing, writing, visual energy, and restraint]
- Angle: [one paragraph from brag-plan.md]
- Hook: [first 2-3 seconds]
- Outro / punchline: [final line]
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: [exact value from project]
- Text: [exact value from project]
- Accent: [exact value from project]
- Display font: [font or fallback decision]
- Body font: [font or fallback decision]
- Visual references from the project: [short list]

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. [Scene name] — [duration]s — [what must be seen / read]
2. [Scene name] — [duration]s — [what must be seen / read]
3. [...]

## Audio
- Audio role: [warm bed / sparse professional accents / cinematic support / dense rhythmic layer / intentional silence]
- Audio arc: [how sound changes across the video]
- Music: [filename, or none only if disabled, missing, or intentionally silent]
- Music treatment: [volume posture, fade-in/out intent, beat/swell notes; e.g. fade under final logo]
- Music cue guidance: [cue source — bundled preset path, or "detect at composition via analyze_music_cues.py / hyperframes beats" — plus concise optional timing hints; or unavailable]
- Audio-reactive treatment: [none / subtle / expressive; what visual qualities may respond to RMS/frequency energy]
- Audio-coupled moments:
  - [scene/moment] — [typing / beat reveal / counter / card sequence / simulated interaction / final logo]
  - [scene/moment] — [intent]
- SFX selection guidance: [how sound should match motion and interaction; examples only, not rigid rules]
- SFX analysis guidance: [path to sfx-analysis.md/json if present; use lower high-frequency-risk sounds for repeated or polished moments]
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
```

The brief is the boundary: if a detail belongs to product positioning, copy, tone, source material, or selection of moments, `/brag` should specify it. If a detail belongs to composition implementation, Hyperframes should decide it.

---

## Audio asset preparation

Read [audio.md](audio.md). Copy the planned music into `<output-dir>/composition/assets/music/` before building the composition.

```bash
mkdir -p <output-dir>/composition/assets/music
cp <skill-assets>/music/<track>.mp3 <output-dir>/composition/assets/music/
```

When running from an installed Claude skill, `<skill-assets>` is `~/.claude/skills/brag/assets/`. From the repo, it is `skills/brag/assets/`.

Hyperframes copies any SFX it selects into the same `assets/` tree after choosing exact files.

---

## Voiceover (only when the user explicitly asks)

Read [voice.md](voice.md) for the provider contract, defaults, and validation
rules. Voiceover is disabled unless the user explicitly requests it (for
example, "add a voiceover", `--voice`, or "narrate this"). Do not offer or
enable narration during a normal `/brag` run.

When voice is disabled, do not write a voiceover script, call a provider,
transcribe audio, duck music, add a voice track, or merge narration into the
video. The normal video export must remain entirely audio-provider agnostic.

When voice is enabled, validate `voice.provider` before creating the
composition. Use `kokoro` when no provider was specified. Select
`elevenlabs` only when the user explicitly requested it, and require
`ELEVENLABS_API_KEY` before invoking its adapter. Write the narration lines
into `brag-plan.md` under a `## Voiceover script` section, then generate the
audio through the provider contract:

```bash
npx hyperframes tts "<narration text or path to script>" \
  --voice af_heart \
  --output <output-dir>/composition/assets/voiceover.wav
```

The command above is the Kokoro implementation. For ElevenLabs, use the
installed Hyperframes ElevenLabs media adapter with the same input/output
contract; do not add provider-specific calls to the composition or skill
pipeline. Both providers must leave one local audio artifact at
`assets/voiceover.wav` (or an equivalent path passed to the composition).

Run `npx hyperframes tts --list` to see other voices.

Wire it into the composition on its own track. Music ducks to 0.12–0.15 for the duration of the voiceover, then returns to its normal level:

```html
<audio id="vo" data-start="0" data-track-index="3" data-volume="1" src="assets/voiceover.wav"></audio>
```

Scene durations must flex to match the generated audio — check the WAV duration after generation and adjust `data-duration` values accordingly. Do not hardcode scene lengths when voiceover is present; let the voice set the pace.

---

## Audio-reactive extraction (when music is present)

When music is present and the treatment is not `none`, the composition can react to per-frame audio data. **Delegate the extraction to the Hyperframes audio-reactive workflow** — `/brag` does not ship an extraction script and must not hardcode a path to one.

In the composition step, follow the audio-reactive guidance owned by the `hyperframes-creative` skill (let that skill locate its own files). It owns the data format, the extraction helper (which ships with that skill, not with `/brag`, so don't hardcode a path to it), and the per-frame sampling pattern. Ask Hyperframes to extract the audio data and wire at least one visual element to it.

If extraction is unavailable (no helper, or ffmpeg missing), note it in the brief and skip audio-reactive — do not block the render.

---

## Beat sync (when a cue source is available)

Get a cue source first (see `audio.md` → "Beat and cue sources"): a bundled preset, `analyze_music_cues.py` on any track (needs Python; run via `uv`), or `npx hyperframes beats` (no Python; needs Hyperframes ≥ 0.6.99). The rich sources (preset / `analyze_music_cues.py`) give two arrays; `hyperframes beats` gives one.

- **`strongCues`** — high-intensity beats (drops, swells, accents). Use for **major moments**: scene transitions, hero reveals, match payoff, logo landing. Lock 1–3 per video. With `hyperframes beats` (no `strongCues`), take the highest-`strength` beats instead.
- **`beats`** — the full beat grid. Use to **snap small sequential events** into the music's pulse: cards arriving one by one, stats popping in, sequenced SFX hits.

### How to implement

**Major moments (strong cues):**
1. Load the cue source: the preset/analysis JSON (`strongCues` + `beats`), or the beat-grid JSON that `hyperframes beats` writes (a plain beat list; see the current hyperframes-cli skill for its location).
2. Pick 1–3 strong timestamps near a planned major visual moment — `strongCues`, or the highest-`strength` beats.
3. Shift the reveal's start time to land within ±0.15s of the cue.
4. Mark it: `// beat-locked: 5.80s`

**Sequential events (beats):**
1. Decide how many sequential items there are (e.g. 3 stats, 4 profile cards).
2. Find the nearest beat to your intended start time for the first item.
3. Use consecutive beats from that point for each subsequent item — snap each within ±0.10s of a beat timestamp.
4. Mark it: `// beat-grid: stat 1 at 12.65s, stat 2 at 13.17s, stat 3 at 13.70s`

**Readable text vs the beat grid:** if the sequential items are text the viewer reads (stat labels, list rows, callouts) and the beats are close (under ~0.6s apart at fast tempos), do not reveal a new line on every beat — it outruns reading (this rushed the bicycles spec rows). Snap to every other beat, or reveal them quickly and hold the full set on screen afterward. Non-text accents (glows, dots, ticks) may still hit every beat. See the reading-time floor in `step-2-plan.md`.

This gives you two layers of musicality: the big moments land on the strongest hits, and the small events tick along with the pulse.

Do not force every tween onto a beat — readability and scene pacing come first. If snapping a tween to a beat hurts copy legibility or the product story, use the natural timing instead.

If SFX are enabled, also pass `skills/brag/assets/sfx/sfx-analysis.md` as selection guidance. Prefer low high-frequency-risk files for repeated or polished moments. SFX on sequential events should fire at the same timestamp as the visual — the sound and motion land together.

---

## Call Hyperframes

After `brag-output/brag-plan.md`, `brag-output/composition-brief.md`, and selected audio assets exist:

1. Load the Hyperframes domain skills (`hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`) to create or update `brag-output/composition/`. /brag is its own workflow — do not enter the `hyperframes` entry-point intent interview or route into its generic promo / launch-video workflow.
2. Pass Hyperframes the composition brief, the brag plan, and the source files it should reference.
3. Let Hyperframes choose the implementation details.
4. Run Hyperframes check (the single gate before render).
5. Render to `brag-output/brag.mp4`.

Do not manually copy stale composition snippets from this skill into the output. The point of delegating is to benefit from the latest Hyperframes guidance.

---

## Self-review checklist

Before moving to delivery, verify:

- [ ] `<output-dir>/composition-brief.md` exists.
- [ ] The brief clearly identifies the exact product moments to show.
- [ ] The composition uses the current Hyperframes workflow, not a hardcoded `/brag` template.
- [ ] Music file is copied into `<output-dir>/composition/assets/music/`.
- [ ] At least one visual element subtly reacts to the music (audio-reactive treatment present), or extraction failure is documented.
- [ ] At least 1 major tween is beat-locked to a strong cue (a `strongCue`, or the highest-`strength` beat from `hyperframes beats`) within ±0.15s, marked `// beat-locked` (or natural timing was chosen for readability).
- [ ] Sequential events (cards, stats, list items) snap to consecutive `beats[]` timestamps (±0.10s), marked `// beat-grid` (or natural timing was chosen for readability).
- [ ] The composition shows at least one real UI, copy, or visual element from the project.
- [ ] Total duration is 15-25 seconds.
- [ ] Hyperframes check passes, or any blocker is documented for the user.
