---
name: brag
description: Turn the current project website into a short, polished, shareable launch video using Hyperframes. Use when someone says "/brag", "let's brag about this", "make a launch video", "turn this into a video", or wants to share what they built. Reads the project code directly — no live URL or screenshots needed.
---

# /brag

You built it. Now let's brag about it.

## Invocation dispatch (must happen first)

Before inspecting the project, parse the complete `/brag` invocation. If the
invocation contains `--voice`, set `voice.enabled = true`. If it contains
`--voice-provider <value>`, record that exact provider. Do not silently drop
either flag and do not fall back to the normal no-voice workflow.

When `voice.enabled` is true, validate the provider immediately:

- missing provider: use `kokoro`;
- `kokoro`: continue without credentials;
- `elevenlabs`: require `ELEVENLABS_API_KEY`, then use the ElevenLabs adapter;
- any other value: stop and list `kokoro` and `elevenlabs`.

If an enabled provider cannot be used, report the provider-specific error and
stop. Never complete a video while claiming that the requested voice provider
was used when narration was skipped. Include the resolved voice state and
provider in the plan and final handoff.

`/brag` turns the current project website or app into a short, polished, shareable launch video using Hyperframes. It is narrow, opinionated, and fun.

## What this skill does

1. Reads the current project code to understand the app.
2. Plans a short brag concept specific to this project.
3. Scripts and storyboards the video.
4. Hands a focused composition brief to Hyperframes.
5. Validates, renders, and writes share copy.

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
| `--title` | string | inferred from project |
| `--voice` | flag | narration off |
| `--voice-provider` | `kokoro`, `elevenlabs` | `kokoro` (only with `--voice`) |

Voice is opt-in. Selecting a provider does not enable narration by itself.
Read [references/voice.md](references/voice.md) before planning any run that
contains `--voice` or `--voice-provider`.

Reject an unsupported `--voice-provider` immediately and list `kokoro` and
`elevenlabs` as the supported values. If `elevenlabs` is selected with voice
enabled, verify `ELEVENLABS_API_KEY` before inspecting the project or creating
the composition.

Tone can be a preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`) or a creative direction such as "fake Series A launch from 2016", "museum exhibit", or "overproduced mobile game ad".

When the user gives freeform tone direction, map it to the nearest preset for pacing and structure, but preserve the user's direction in the plan and composition brief.

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

**Gate:** You can answer all 9 questions in the brag planning rubric.

---

## Step 2: Plan and storyboard

**Read:** [references/step-2-plan.md](references/step-2-plan.md)

Write `<output-dir>/brag-plan.md` (where `<output-dir>` is `brag-output/` or the timestamped variant chosen above). Answer the planning rubric. Commit to a creative angle. Write the beat-by-beat storyboard including scenes, text, timing, transitions, and SFX cues.

When music is selected, include a compact `Music cue guidance` section: read the bundled track's cue preset from `assets/music/cues/` if present, otherwise note cues will be detected at composition time (any track now supports beat sync — see `references/audio.md`). Cue metadata is optional timing guidance only: story, readability, pacing, and product clarity stay primary.

**Gate:** `<output-dir>/brag-plan.md` exists with a full storyboard. Scene durations sum to 15–25 seconds.

---

## Step 3: Hand off to Hyperframes

**Read:** The Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview or route into its generic promo / launch-video workflow.
**Read:** [references/step-3-compose.md](references/step-3-compose.md)
**Read:** [references/audio.md](references/audio.md)

Write the composition brief and use Hyperframes to create the video implementation in `<output-dir>/composition/`.

`/brag` owns the product angle, source material, storyboard, tone, format, audio selection, music cue guidance, and delivery expectations. Hyperframes owns the concrete composition structure, exact animation timing, animation mechanics, runtime choices, linting rules, and render workflow.

**Gate:** `npx hyperframes check` passes with zero errors inside `<output-dir>/composition/` (the single browser gate before render — see hyperframes-cli for what it audits).

---

## Step 4: Validate, render, and deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

Validate, preview, render to `<output-dir>/brag.mp4`, pick the best poster frame into `<output-dir>/brag.jpg`, bake that poster as the video's frame 0 so it's the idle thumbnail everywhere, and write `<output-dir>/share-copy.txt`.

**Gate:** `<output-dir>/brag.mp4` exists. A best-frame poster `<output-dir>/brag.jpg` is picked (not an arbitrary frame) and baked as frame 0 of `brag.mp4`. Share copy is written.

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
