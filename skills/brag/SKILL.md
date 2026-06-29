---
name: brag
description: Turn the current project website into a short, polished, shareable launch video using Hyperframes. Use when someone says "/brag", "let's brag about this", "make a launch video", "turn this into a video", or wants to share what they built. Reads the project code directly — no live URL or screenshots needed.
---

# /brag

You built it. Now let's brag about it.

`/brag` turns the current project website or app into a short, polished, shareable launch video using Hyperframes. It is narrow, opinionated, and fun.

## What this skill does

1. Reads the current project code to understand the app.
2. Plans a short brag concept specific to this project.
3. Scripts and storyboards the video, including a voiceover script.
4. Generates voiceover audio via ElevenLabs API (or prompts for API key).
5. Hands a focused composition brief to Hyperframes.
6. Validates, renders, and writes share copy.

## Parsing the invocation

The user may invoke with natural language or flags:

```
/brag
/brag --tone chaotic
/brag --tone polished --format vertical
/brag this. Make it feel like a ridiculous startup launch.
```

Parse these options:

| Option | Values | Default |
|---|---|---|
| `--tone` | preset or freeform description | inferred |
| `--format` | `landscape`, `vertical`, `square` | `landscape` |
| `--duration` | seconds | auto (15-25s) |
| `--no-music` | flag | music on |
| `--no-sfx` | flag | sfx on |
| `--no-voiceover` | flag | voiceover on |
| `--title` | string | inferred from project |
| `--voice` | ElevenLabs voice ID | `21m00Tcm4TlvDq8ikWAM` (Rachel) |
| `--url` | project URL for browser inspection | auto-detected from project |
| `--no-browser` | flag | browser inspection on |

Tone can be a preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`) or a creative direction such as "fake Series A launch from 2016", "museum exhibit", or "overproduced mobile game ad".

When the user gives freeform tone direction, map it to the nearest preset for pacing and structure, but preserve the user's direction in the plan and composition brief.

---

## ElevenLabs key check and voice selection

Voiceover is generated via the ElevenLabs TTS API when available. Before starting the workflow:

1. **Check for `ELEVENLABS_API_KEY`** in the environment.
2. If not set, ask the user: *"Voiceover uses ElevenLabs. Do you have an ElevenLabs API key? (leave blank to skip voiceover, or provide one)"*
3. If provided, set it as `ELEVENLABS_API_KEY` for the session. **Note:** ElevenLabs requires a paid plan (Starter $5/mo or above) to use library voices via the API. The free tier can only use custom cloned voices. If the API returns a `402` error during generation, fall back to `npx hyperframes tts` (offline, no key needed).
4. If no key is available, skip ElevenLabs and use `npx hyperframes tts` for voiceover (offline Kokoro-82M model), or skip voiceover entirely if the user passed `--no-voiceover`.

Voice ID defaults to the `--voice` option or `21m00Tcm4TlvDq8ikWAM` (Rachel). Users can pass `--voice <id>` to select a different ElevenLabs voice.

---

## Output directory

By default, output goes to `brag-output/`. To avoid overwriting previous runs, use a timestamped directory:

```
brag-output-2026-05-04-143022/
```

Use a timestamp when:
- The user explicitly asks for a new run without overriding previous results
- A `brag-output/` directory already exists in the project

Generate the timestamp at the start of the run (`YYYY-MM-DD-HHmmss`) and use it consistently for all output paths in that run: plan, brief, composition, render, and share copy.

---

## Step 1: Inspect the project

**Read:** [references/step-1-inspect.md](references/step-1-inspect.md)

Scan the project directory and extract the information needed to plan the brag video.

**Read:** [references/playwright-inspect.md](references/playwright-inspect.md)

If `--no-browser` was not passed, use `playwright-cli` to open the project in a real browser. Navigate through pages, interact with UI, take screenshots, and capture snapshots of key pages. This gives you a richer understanding of the product than static files alone, and the screenshots serve as visual references for the Hyperframes composition.

Use `--url` to specify the project URL (e.g. `http://localhost:3000`). If not provided, auto-detect by checking for a local dev server or starting one from the project.

**Gate:** You can answer all 9 questions in the brag planning rubric. Playwright screenshots exist for key pages.

---

## Step 2: Plan and storyboard

**Read:** [references/step-2-plan.md](references/step-2-plan.md)

Write `<output-dir>/brag-plan.md` (where `<output-dir>` is `brag-output/` or the timestamped variant chosen above). Answer the planning rubric. Commit to a creative angle. Write the beat-by-beat storyboard including scenes, text, timing, transitions, and SFX cues.

When music is selected, include a compact `Music cue guidance` section: read the bundled track's cue preset from `assets/music/cues/` if present, otherwise note cues will be detected at composition time (any track now supports beat sync — see `references/audio.md`). Cue metadata is optional timing guidance only: story, readability, pacing, and product clarity stay primary.

**Write the voiceover script.** If `ELEVENLABS_API_KEY` is set and `--no-voiceover` was not passed, write a `## Voiceover script` section in the plan. The script is a concise spoken summary (~15-25 seconds, 40-70 words) covering: what the project is, the hook, 2-3 key highlights, and the tagline. The voiceover script drives scene timing — each scene's duration must accommodate both its on-screen text and the matching narration segment.

**Gate:** `<output-dir>/brag-plan.md` exists with a full storyboard. Scene durations sum to 15–25 seconds. Voiceover script is included when applicable.

---

## Step 3: Generate voiceover audio

If `ELEVENLABS_API_KEY` is set and `--no-voiceover` not passed, generate the voiceover audio from the script in `brag-plan.md`:

1. **Read:** [references/step-3-compose.md](references/step-3-compose.md) → "Voiceover (ElevenLabs)" section for the full generation workflow.
2. **Read:** [references/audio.md](references/audio.md) → "ElevenLabs API reference" section for API details and voice IDs.
3. Call the ElevenLabs TTS API with the voiceover script text.
4. Save the output to `<output-dir>/composition/assets/voiceover.mp3`.
4. Check the audio duration with `ffprobe` — adjust scene timings in the plan if needed.
5. If ElevenLabs API call fails or the key is unavailable, fall back to `npx hyperframes tts` or skip voiceover.

**Gate:** `<output-dir>/composition/assets/voiceover.mp3` exists, or voiceover is explicitly skipped and noted in the plan.

---

## Step 4: Hand off to Hyperframes

**Read:** The `hyperframes` skill (all rules apply)
**Read:** [references/step-3-compose.md](references/step-3-compose.md)
**Read:** [references/audio.md](references/audio.md)

Write the composition brief and use Hyperframes to create the video implementation in `<output-dir>/composition/`.

`/brag` owns the product angle, source material, storyboard, tone, format, audio selection, music cue guidance, voiceover script, and delivery expectations. Hyperframes owns the concrete composition structure, exact animation timing, animation mechanics, runtime choices, linting rules, and render workflow.

**Gate:** `npx hyperframes lint` passes with zero errors inside `<output-dir>/composition/`.

---

## Step 5: Validate, render, and deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

Validate, preview, render to `<output-dir>/brag.mp4`, and write `<output-dir>/share-copy.txt`.

If voiceover is included, verify the rendered video's audio mix: voiceover should be clear over the music bed. Adjust music ducking or voiceover volume and re-render if needed.

**Gate:** `<output-dir>/brag.mp4` exists. Share copy is written.

---

## Tone system

Seven tone presets ship with `/brag`. Each changes scripting energy, pacing, typography personality, and transition style. Presets are defaults, not limits.

Full definitions: [references/tones.md](references/tones.md)

| Tone | Energy | One-liner |
|---|---|---|
| `default` | Playful, clean, postable | The good-vibes default |
| `polished` | Serious, elegant | For projects that are not jokes |
| `yc-parody` | Deadpan startup energy | Fake seriousness applied to absurd projects |
| `chaotic` | Fast, loud, aggressive | Over-the-top and unhinged |
| `deadpan` | Calm, dry, understated | The joke is that nothing is a joke |
| `cinematic` | Dramatic, trailer-scale | Big motion, bigger claims |
| `app-store` | Smooth, feature-card clean | Corporate but not boring |

Always allow a freeform creative direction to refine or override the preset.

---

## Creative laws

These apply to every brag video regardless of tone.

**Short.** 15–25 seconds. Not one second more without a reason.

**Readable.** Keep the pace high through motion and cuts, never by flashing text. Every line a viewer must read holds long enough to read it (short label ~0.8s settled; a sentence ~0.3s per word). Fast-in, then hold — never fast-in, then gone.

**Specific.** The video must feel like it was made for this exact project, not any project.

**Show the thing.** At least one scene must display actual UI, copy, or a key visual from the product. No abstract filler.

**No generic SaaS language.** "Streamline your workflow" is banned. Use the project's actual copy and claims.

**The hook is everything.** The first 2 seconds determine whether someone keeps watching. Plan the hook before anything else.

**Funny earns its place.** Humor should come from the project's absurdity, not from trying to be funny.

**Pattern:**
```
Hook (2-3s) → Reveal (2-4s) → 2-3 sharp highlights (5-12s) → Punchline/outro (2-4s)
```

Adapt this. Not every project needs exactly 3 highlights. The pattern is a starting shape, not a template.
