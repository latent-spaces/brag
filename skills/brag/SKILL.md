---
name: brag
description: Turn the current project website into a short, polished, shareable launch video using Hyperframes. Use when someone says "/brag", "let's brag about this", "make a launch video", "turn this into a video", or wants to share what they built. Reads the project code directly — no live URL or screenshots needed.
---

# /brag

You built it. Now let's brag about it.

## Invocation dispatch (must happen first)

**Model check.** If you are Claude Opus 5.5 and the invocation doesn't ask for the full workflow (`--full`, "use the full brag") or for voiceover (`--voice`, which brag-slim doesn't do), switch to brag-slim: read `<skill-dir>/slim.md` (the /brag-slim skill, bundled here) and follow it for the rest of this run instead of this file. Pass along the user's input, and pass any other options (`--no-music`, `--title`, …) as plain-language direction. Tell the user in one line first, e.g. "You're on Opus 5.5, so I'm using /brag-slim: I build the whole video myself. Say 'use the full brag' to switch back." If you are any other model, or can't tell which model you are, skip this check.

Before inspecting the project, parse the complete `/brag` invocation. If the
invocation contains `--voice`, set `voice.enabled = true`. Enable narration
only for that run. Do not enable narration automatically and do not fall back
to the normal no-voice workflow.

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
/brag --sections 5 --tone "deadpan, polished, polished, cinematic, app-store"
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
| `--sections` | count | off (single composition) |

Voice is opt-in. If `--voice` is present, use Kokoro via Hyperframes and do
not add any provider-selection logic. The voice workflow is intentionally
single-provider.

Tone can be a preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`) or a creative direction such as "fake Series A launch from 2016", "museum exhibit", or "overproduced mobile game ad".

When the user gives freeform tone direction, map it to the nearest preset for pacing and structure, but preserve the user's direction in the plan and composition brief.

`--tone` also accepts a comma-separated list, one tone per section. It is only
valid alongside `--sections`, and the list length must equal the section count.
A single tone with `--sections` applies that tone to every section.

## Long-form dispatch

`/brag` is short by default. Switch to the long-form pipeline only when the
user asks for a longer video, or passes `--sections`, or passes a `--duration`
over 25 seconds. Never choose it yourself.

With `--duration` but no `--sections`, plan `ceil(duration / 12)` sections,
clamped to 4-6.

When it is switched on, **read [references/long-form.md](references/long-form.md)
before Step 1** and follow it alongside the four steps below. It changes what
each step produces: the plan gains a section table, the composition step writes
one composition per section instead of one for the whole film, and delivery
renders each section and joins them.

Everything else — the rubric, the gates, the creative laws — is unchanged and
applies inside every section.

## Narration guidance

When `--voice` is enabled, write narration that complements the visuals, does
not simply read visible text, matches scene pacing, sounds natural and
conversational, and moves smoothly between scenes. Keep the script concise and
specific to the product so the voice feels like part of the edit rather than a
separate narration track.

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

## Skill directory

`<skill-dir>` is the directory containing this `SKILL.md`. Claude Code prints it as "Base directory for this skill" when the skill loads; for other agents it's wherever the skill was installed. Bundled assets are under `<skill-dir>/assets/` and scripts under `<skill-dir>/scripts/`. Don't guess an install path: a plugin install, a `~/.claude/skills/` copy, and this repo all put it somewhere different.

---

## Step 1: Inspect the project

**Read:** [references/step-1-inspect.md](references/step-1-inspect.md)

Scan the project directory and extract the information needed to plan the brag video.

**Gate:** You can answer all 9 questions in the brag planning rubric.

---

## Step 2: Plan and storyboard

**Read:** [references/step-2-plan.md](references/step-2-plan.md)

Write `<output-dir>/brag-plan.md` (where `<output-dir>` is `brag-output/` or the timestamped variant chosen above). Answer the planning rubric. Commit to a creative angle. Write the beat-by-beat storyboard including scenes, text, timing, transitions, and SFX cues.

When music is selected, include a compact `Music cue guidance` section: read the bundled track's cue preset from `<skill-dir>/assets/music/cues/` if present, otherwise note cues will be detected at composition time (any track now supports beat sync — see `references/audio.md`). Cue metadata is optional timing guidance only: story, readability, pacing, and product clarity stay primary.

**Gate:** `<output-dir>/brag-plan.md` exists with a full storyboard. Scene durations sum to 15–25 seconds.

**Long-form gate:** the plan carries a section table — directory, tone, and a
whole-frame length per section — and each section's scene durations sum to that
section's length.

---

## Step 3: Hand off to Hyperframes

**Read:** The Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview or route into its generic promo / launch-video workflow.
**Read:** [references/step-3-compose.md](references/step-3-compose.md)
**Read:** [references/audio.md](references/audio.md)

Write the composition brief and use Hyperframes to create the video implementation in `<output-dir>/composition/`.

`/brag` owns the product angle, source material, storyboard, tone, format, audio selection, music cue guidance, and delivery expectations. Hyperframes owns the concrete composition structure, exact animation timing, animation mechanics, runtime choices, linting rules, and render workflow.

**Gate:** `npx hyperframes check` passes with zero errors inside `<output-dir>/composition/` (the single browser gate before render — see hyperframes-cli for what it audits).

**Long-form gate:** the compositions live in `<output-dir>/clips/<nn>-<name>/`
instead, and `npx hyperframes check` passes with zero errors in every one of
them. One section with an error is a failed gate for the whole film.

---

## Step 4: Validate, render, and deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

Validate, preview, render to `<output-dir>/brag.mp4`, pick the best poster frame into `<output-dir>/brag.jpg`, bake that poster as the video's frame 0 so it's the idle thumbnail everywhere, and write `<output-dir>/share-copy.txt`.

**Gate:** `<output-dir>/brag.mp4` exists. A best-frame poster `<output-dir>/brag.jpg` is picked (not an arbitrary frame) and baked as frame 0 of `brag.mp4`. Share copy is written.

**Long-form gate:** every section is rendered to `<output-dir>/renders/`, and
`scripts/join-sections.mjs` joined them without a parity refusal. The poster is
baked into the joined film, not into a section.

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

The one sanctioned reason is a user asking for a longer video. That is the
long-form pipeline in [references/long-form.md](references/long-form.md): a
sectioned film, one tone per section, each section held to the same laws. It is
not a licence to let a single composition drift past 25 seconds.

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
