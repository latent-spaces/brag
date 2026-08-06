---
name: brag
description: You built it. Now brag. Turn the project you just shipped into a short, shareable launch video with one command. Use when someone says "/brag", "let's brag about this", "make a launch video", "turn this into a video", or wants to share what they built. Reads the project code directly — no live URL or screenshots needed.
---

# /brag

You built it. Now let's brag about it.

`/brag` turns the current project into a short, polished, shareable launch
video. It is narrow, opinionated, and fun.

**It is still one command.** Run `/brag` and it goes all the way to a finished
video. Everything below describes what happens underneath so you can steer it
when you want to — it is not a checklist for the user to type.

```
/brag
/brag --tone chaotic
/brag --format vertical
/brag this. Make it feel like a ridiculous startup launch.
```

| Option | Values | Default |
|---|---|---|
| `--tone` | preset or freeform description | inferred |
| `--format` | `landscape`, `vertical`, `square` | `landscape` |
| `--duration` | seconds | auto (15-25s) |
| `--no-music` / `--no-sfx` | flag | on |
| `--title` | string | inferred |

Tone can be a preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`,
`cinematic`, `app-store`) or a direction like "fake Series A launch from 2016".
Freeform direction maps to the nearest preset for pacing and is carried through
verbatim so it still shapes the writing. Full definitions:
[references/tones.md](references/tones.md).

## How to run it

The pipeline is a CLI. **You** drive it; the user does not.

```bash
node "$CLAUDE_PLUGIN_ROOT/cli/brag.mjs" doctor
```

Then walk the stages. Each either does its work outright or writes a task spec
for you to answer:

```bash
brag init            # create brag/ in the project
brag inspect --emit  # → read the spec, write the JSON it asks for
brag inspect --accept
brag position --emit     …  brag position --accept
brag concepts --emit     …  brag concepts --accept
brag select              # scores and locks one; `brag select <id>` to choose by hand
brag storyboard --emit   …  brag storyboard --accept
brag capture             # propose a capture plan; --run once the user approves
brag compose             # compile, then check + seam gate
brag deliver             # render, poster, share copy
brag review              # the verification layers
```

`brag status` says what is done and what is next, derived from artifacts on
disk — so a run that died halfway resumes truthfully.

**The contract:** the CLI never asks you to *do* something inline. It writes a
spec with an inlined JSON Schema and an output path; you write that file; the
`--accept` form validates it and recomputes whatever it can compute itself.
Non-zero exit is the only success signal. Never work around a gate — a gate
that fails has found something.

## What the stages are for

**Inspect.** Classify the product surface before reading it: `website`, `cli`,
`library`, `api`, `desktop`, `mobile`, `game`, `hardware`, `research`, `mixed`.
Each gets its own reading. For a CLI the terminal *is* the product interface,
not supporting material; the same holds for an API and its exchange, and a
library and its call site. A deterministic scan supplies file signals,
extracted strings with byte offsets, real git history and the real palette —
you supply only what a scan cannot decide. Every claim carries a source, and
`--accept` re-checks each against the filesystem.

**Position.** Audience, the one sentence the video argues, and every claim
bound to a proof id. A claim with no proof is dropped, not softened.

**Concepts.** At least three genuinely different films, then one is locked.
Going straight from inspection to a single storyboard produces the same video
every time. Distinctness is measured, so three descriptions of one film are
rejected. Scoring runs separately from generation, and novelty is computed
rather than self-rated. Once locked, the concept is a constraint — its
forbidden motifs are enforced at compile time.

**Direct.** A visual world decides how the product physically exists on screen:
camera model, depth, transition vocabulary, typography, and a set of layouts
that scenes rotate through. Worlds live in `worlds/` as data, and two declaring
the same camera × depth × transition triple are rejected — fifteen names for
three looks is how a catalogue like this rots.

**Storyboard.** A connected scene graph, not a list of slides: purpose, the
proof each scene must show, what has to be readable, continuity edges, and one
seam per cut carrying an axis and direction.

**Capture.** Record the real surface. For a CLI that means running the real
command and keeping the byte stream, replayed through a terminal emulator so
carriage returns and line erasure — spinners, progress bars — survive intact.
Commands are never inferred and run: propose a plan, let the user approve it,
then run it. Secrets are redacted before anything touches disk.

**Compose.** The scene graph compiles into the artifacts HyperFrames already
reads — `BRIEF.md`, `STORYBOARD.md`, `frame.md`, `ledger.json`, and a
`*.motion.json` sidecar. Nothing invents a parallel format. Seams are described
as vectors and stamped by motion-doctrine, so they pass its gate by
construction. Timing is solved, not asserted.

**Review.** Four layers — structural, visual, narrative and product fidelity.
`hyperframes check` passing does not mean the video is right; that is the whole
reason the other three exist.

**Variants.** `brag variant vertical` re-solves the same graph for another
shape. A variant is a recompile, never a re-cut: framing and density change,
the argument does not.

## Creative laws

These hold whatever the tone.

**Short.** 15–25 seconds. Not one second more without a reason.

**Readable.** Pace comes from motion and cuts, never from pulling text away
before it can be read. A short label needs about 0.8s settled; a sentence about
0.3s per word. Fast in, then hold. The timing solver enforces this and refuses
an edit that cannot fit its own copy — when it does, cut copy rather than a
floor.

**Specific.** It must feel made for this exact project, not any project.

**Show the thing.** At least one scene shows real UI, real copy, or a real
captured surface. No abstract filler.

**Sourced.** Everything on screen resolves to something the project actually
says or prints. The fidelity layer checks this, and it is the difference
between a launch video that is persuasive and one that is defensible.

**No generic SaaS language.** "Streamline your workflow" is banned.

**The hook is everything.** The first two seconds decide whether anyone sees
the third. Plan it before anything else.

**Funny earns its place.** Humour comes from the product's own absurdity, not
from trying to be funny.

```
Hook (2-3s) → Reveal (2-4s) → 2-3 sharp highlights (5-12s) → Punchline (2-4s)
```

Adapt it. It is a starting shape, not a template.

## Audio

Default posture is music on, SFX sparse and motion-matched. Track choices, the
SFX library, cue sources and the volume policy are in
[references/audio.md](references/audio.md). Cue metadata biases timing; it never
controls it. Readability outranks the beat, always.

## Output

Everything lands under `brag/` in the project: the product model, captures,
compositions, renders, reviews, and `brag/delivery/` with the video, its poster
attached as cover art, and share copy. Add `brag/` to the project's gitignore —
captures hold whatever the product printed when it ran.

## When something fails

Read the message. Every gate names what it found and where:

- *"the edit does not fit its own copy"* — cut a line; the reading floor does
  not move.
- *"this video is too much like the ones before it"* — pick a different visual
  world, or a concept that needs a different kind of frame.
- *"appears on screen with nothing behind it"* — source the line or cut it.
- *"a scene describes X, which the locked concept forbids"* — the
  implementation drifted back toward the generic version of itself.
