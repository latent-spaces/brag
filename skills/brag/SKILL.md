---
name: brag
description: Turn the current project website into a short, polished, shareable launch video using Hyperframes. Use when someone says "/brag", "let's brag about this", "make a launch video", "turn this into a video", or wants to share what they built. With --pr it scopes the video to a single pull request instead — use when someone says "/brag --pr 42", "make a demo of this PR", "show what changed in this PR", or wants to demo a shipped change to PMs, stakeholders, or the rest of the team. Reads the project code directly — no live URL or screenshots needed.
---

# /brag

You built it. Now let's brag about it.

## Invocation dispatch (must happen first)

**Model check.** If you are Claude Opus 5.5 and the invocation doesn't ask for the full workflow (`--full`, "use the full brag") or for voiceover (`--voice`, which brag-slim doesn't do), switch to brag-slim: read `<skill-dir>/slim.md` (the /brag-slim skill, bundled here) and follow it for the rest of this run instead of this file. Pass along the user's input, and pass any other options (`--no-music`, `--title`, …) as plain-language direction. Tell the user in one line first, e.g. "You're on Opus 5.5, so I'm using /brag-slim: I build the whole video myself. Say 'use the full brag' to switch back." If you are any other model, or can't tell which model you are, skip this check.

Before inspecting the project, parse the complete `/brag` invocation. If the
invocation contains `--voice`, set `voice.enabled = true`. Enable narration
only for that run. Do not enable narration automatically and do not fall back
to the normal no-voice workflow.

If the invocation contains `--pr`, set `mode = pr`. **Read
[references/pr-mode.md](references/pr-mode.md) before doing anything else** and follow
it for the rest of the run. PR mode changes what gets inspected, what the video shows,
and where the output goes. Do not fall back to the whole-project workflow.

`/brag` turns the current project website or app into a short, polished, shareable launch video using Hyperframes. It is narrow, opinionated, and fun.

## What this skill does

1. Reads the current project code to understand the app — or, in PR mode, reads one pull request's diff to understand a single change.
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
/brag --pr 42
/brag --pr https://github.com/org/repo/pull/42 --format vertical
/brag --pr 42,43,47
/brag the PR I just opened, for the product team.
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
| `--pr` | PR number, URL, comma-separated list, or bare | off (whole-project brag) |
| `--base` | branch or SHA to diff against | the PR's own base branch |

Voice is opt-in. If `--voice` is present, use Kokoro via Hyperframes and do
not add any provider-selection logic. The voice workflow is intentionally
single-provider.

Tone can be a preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`, `changelog`) or a creative direction such as "fake Series A launch from 2016", "museum exhibit", or "overproduced mobile game ad".

When the user gives freeform tone direction, map it to the nearest preset for pacing and structure, but preserve the user's direction in the plan and composition brief.

## PR mode

`--pr` swaps the subject of the video: one shipped change instead of the whole product.
The people watching are usually the ones who did not read the diff — product managers,
design, support, the rest of the team — so the video's job is to show the feature
working, before and after, in the product's own interface.

```
/brag --pr 42
```

Everything in [references/pr-mode.md](references/pr-mode.md) applies for the whole run:
how to gather the PR's context (`gh`, with a plain-git fallback), the PR rubric that
replaces the 9-question one, the before/after law, what to show when the change has no
UI, the storyboard shape, and the honesty rule. Read it first.

Two things are worth stating up front, because they override defaults elsewhere in this
file:

- **The centerpiece is the difference**, not the product. Show the old state, then the
  new one, in the same frame.
- **Only claim what the diff does.** No invented metrics, no adjacent features, no
  "coming soon" dressed up as shipped.

The default tone in PR mode is `changelog`. A user-supplied `--tone` still wins.

## Narration guidance

When `--voice` is enabled, write narration that complements the visuals, does
not simply read visible text, matches scene pacing, sounds natural and
conversational, and moves smoothly between scenes. Keep the script concise and
specific to the product so the voice feels like part of the edit rather than a
separate narration track.

---

## Output directory

By default, output goes to `brag-output/`. PR runs go to `brag-output-pr-<number>/`
(or `brag-output-pr-42-43-47/` for a bundle) so a feature demo never overwrites a
project brag. To avoid overwriting previous runs, use a timestamped directory:

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

## Step 0: Gather the PR context (PR mode only)

**Read:** [references/pr-mode.md](references/pr-mode.md)

Skip this step entirely unless `--pr` was passed.

Resolve the PR, pull its metadata and diff (`gh`, falling back to plain git), read the
changed files at both base and head, and write `<output-dir>/pr-context.md`.

**Gate:** `<output-dir>/pr-context.md` exists, states the user-visible change in one
paragraph a PM would understand, and records the before state and the change class.

---

## Step 1: Inspect the project

**Read:** [references/step-1-inspect.md](references/step-1-inspect.md)

Scan the project directory and extract the information needed to plan the brag video.

In PR mode this is scoped: inspect the change and its surroundings, not the product.
Answer the PR rubric in `pr-mode.md` instead of the 9-question one — but still extract
the project's colors and fonts, because the demo has to look like the real product.

**Gate:** You can answer all 9 questions in the brag planning rubric (or, in PR mode,
all 9 questions in the PR rubric).

---

## Step 2: Plan and storyboard

**Read:** [references/step-2-plan.md](references/step-2-plan.md)

Write `<output-dir>/brag-plan.md` (where `<output-dir>` is `brag-output/` or the timestamped variant chosen above). Answer the planning rubric. Commit to a creative angle. Write the beat-by-beat storyboard including scenes, text, timing, transitions, and SFX cues.

When music is selected, include a compact `Music cue guidance` section: read the bundled track's cue preset from `<skill-dir>/assets/music/cues/` if present, otherwise note cues will be detected at composition time (any track now supports beat sync — see `references/audio.md`). Cue metadata is optional timing guidance only: story, readability, pacing, and product clarity stay primary.

In PR mode, the plan is built on `pr-context.md` rather than the landing page, and the
storyboard follows the before→after shape in `pr-mode.md`. Every claim in it must be
traceable to the diff.

**Gate:** `<output-dir>/brag-plan.md` exists with a full storyboard. Scene durations sum to 15–25 seconds. In PR mode, the storyboard shows both the before state and the after state.

---

## Step 3: Hand off to Hyperframes

**Read:** The Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview or route into its generic promo / launch-video workflow. In PR mode this matters twice over — Hyperframes ships a `pr-to-video` workflow, and `--pr` must not hand off to it. /brag owns the angle, the laws, and the storyboard; the domain skills own the implementation.
**Read:** [references/step-3-compose.md](references/step-3-compose.md)
**Read:** [references/audio.md](references/audio.md)

Write the composition brief and use Hyperframes to create the video implementation in `<output-dir>/composition/`.

`/brag` owns the product angle, source material, storyboard, tone, format, audio selection, music cue guidance, and delivery expectations. Hyperframes owns the concrete composition structure, exact animation timing, animation mechanics, runtime choices, linting rules, and render workflow.

**Gate:** `npx hyperframes check` passes with zero errors inside `<output-dir>/composition/` (the single browser gate before render — see hyperframes-cli for what it audits).

---

## Step 4: Validate, render, and deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

Validate, preview, render to `<output-dir>/brag.mp4`, pick the best poster frame into `<output-dir>/brag.jpg`, bake that poster as the video's frame 0 so it's the idle thumbnail everywhere, and write `<output-dir>/share-copy.txt`.

In PR mode, `share-copy.txt` is written for an internal audience (PR comment, Slack,
sprint review) and posting it to the PR is offered, never done unasked.

**Gate:** `<output-dir>/brag.mp4` exists. A best-frame poster `<output-dir>/brag.jpg` is picked (not an arbitrary frame) and baked as frame 0 of `brag.mp4`. Share copy is written.

---

## Tone system

Eight tone presets ship with `/brag`. Each changes scripting energy, pacing, typography personality, and transition style. Presets are defaults, not limits.

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
| `changelog` | Plain, benefit-first | Showing a shipped change to people who didn't read the diff (PR mode default) |

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

### In PR mode, two more laws apply

**Show the difference.** The old state and the new state, in the same frame. A video
that only shows the new state is an ad, not a demo. The pattern becomes:

```
The problem (2-4s) → Before (2-4s) → After / the new flow (6-10s) → What it unlocks (2-4s)
```

**Only claim what the diff does.** No capability that isn't in the changed code, no
invented metrics, no adjacent work. If the PR is still open, the video says so.
