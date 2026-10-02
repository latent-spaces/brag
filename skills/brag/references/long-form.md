# Long-form brags: one film, several sections

The 15-25 second law is the default and it is right almost every time. A short
brag gets watched. A long one gets scrolled past.

This file is the sanctioned exception. Use it only when the user asks for a
longer video, or passes `--sections`. Never reach for it on your own.

The shape is: **one section per tone, rendered as its own clip, joined with
an ffmpeg video stream copy.** Each section keeps the discipline of a normal
brag — a hook, a hold, a reason to stay — and the tone changes with the story
instead of staying flat for a minute.

---

## When a long cut is justified

Answer all three yes, or cut it back to 25 seconds:

1. **The product has a sequence worth walking.** A real flow with steps that
   depend on each other. Not a feature list.
2. **Each section would survive alone.** If a section only exists to link two
   others, it is a transition, not a section. Fold it in.
3. **The tone genuinely changes.** A problem stated deadpan, a payoff shown
   cinematic. If every section is the same tone, you do not need sections — you
   need one composition.

Target 4 to 6 sections, 9 to 14 seconds each. Under 8 seconds a section cannot
hold a line and land it. Over 15 it is a short film of its own.

---

## Step A — plan the sections

In `brag-plan.md`, add a section table before the storyboard:

| # | Directory | Tone | Length | What it does |
|---|---|---|---|---|
| 1 | `01-problem` | `deadpan` | 10.90s | The thing that goes wrong today |
| 2 | `02-preview` | `polished` | 13.10s | The product shows its work |
| 3 | `03-verify` | `polished` | 13.10s | Proof it actually landed |
| 4 | `04-undo` | `cinematic` | 10.90s | The safety net, working |
| 5 | `05-close` | `app-store` | 10.90s | Scale, mark, one claim |

Then write the storyboard per section, exactly as normal. Scene durations sum to
that section's length, not to 15-25 seconds.

**Tone ordering.** Do not bounce. Move in one direction — quiet to confident, or
cold to warm. A `chaotic` section between two `polished` ones reads as a mistake
in the edit, not as a choice.

---

## Step B — lock the lengths to whole frames

A joined film has no tolerance for a half frame. Round every section to a whole
frame **before** writing any composition.

```
frames  = round(seconds * fps)
seconds = frames / fps
```

At 30fps, 10.90s is 327 frames and 13.10s is 393 frames. Both are exact. A
musical figure of 10.913s is 327.39 frames — it is not. Round it, then use the
rounded number everywhere: the composition `data-duration`, the beat maths, and
the music offsets in step C.

Write the final numbers into the composition brief. They are a contract between
the sections.

---

## Step C — one music bed, sliced across the sections

This is the part that fails if you improvise it.

Each section is its own composition, so each one would start the music from the
top. Five sections, five restarts, five audible seams.

The fix: pick **one** track long enough for the whole film, and give every
section the slice that belongs to it, with `data-media-start`.

```
offset(1) = the track's own start point (often 0)
offset(n) = offset(n-1) + duration(n-1)
```

Using the rounded durations from step B:

| Section | `data-duration` | `data-media-start` |
|---|---|---|
| 1 | 10.90 | 0.267 |
| 2 | 13.10 | 11.167 |
| 3 | 13.10 | 24.267 |
| 4 | 10.90 | 37.367 |
| 5 | 10.90 | 48.267 |

Rules that go with it:

- **Accumulate on the rounded durations**, never the pretty ones. A 0.013s error
  per section is a skipped beat by section five.
- **Only the last section fades out.** Sections 1 to 4 end at their playing level
  and hand over. A fade at every join sounds like five videos.
- **Duck with a `data-automation` volume lane**, per section, in that section's
  own local time. See `audio.md` — a GSAP `volume` tween is ignored when a lane
  is present.
- **Start every section on a bar line.** Then each section's internal beat grid
  is `n * beat` from its own zero, and drift never accumulates.

Check the track is long enough before you start. Total film length must be less
than track length minus the first offset.

---

## Step D — visual continuity across a hard cut

There are no transitions between sections. The last frame of section 1 is
followed immediately by the first frame of section 2. That is a feature — but
only if the two frames agree.

- **Carry state forward with `gsap.set(...)` at time 0.** If section 3 shows the
  same card section 2 left on screen, section 3 opens with that card already
  built: same position, same size, same rows visible. Do not re-animate it in.
- **Match the last and first frame.** Before joining, look at the final frame of
  section N and the first frame of section N+1. Same background, same element
  positions, same opacity. A 40px jump reads as a glitch.
- **Deliberate cuts are fine.** A clean cut to black, or to a completely new
  layout, reads as an edit. A near-match that is slightly off reads as a bug.

---

## Step E — render each section

Each section directory is a full composition. Check and render every one, with
the normal gate.

```bash
for d in 0*/; do
  (cd "$d" && npx hyperframes check) || exit 1
done
```

Zero errors in every section before any render. A lint error switches off the
layout and contrast audits silently, so one bad section hides its own problems.

Then render each to its own file:

```bash
for d in 0*/; do
  (cd "$d" && npx hyperframes render --quality high --output "../../renders/${d%%-*}.mp4")
done
```

---

## Step F — join

Do not hand-roll the ffmpeg call. Use the helper:

```bash
node skills/brag/scripts/join-sections.mjs \
  --dir <output-dir>/renders \
  --out <output-dir>/brag.mp4
```

It probes every render, refuses to join if any two disagree on codec, width,
height, pixel format, frame rate, audio codec, sample rate or channel count,
then runs the concat demuxer with a video stream copy and reports total frames
and duration.

Audio is the one stream it re-encodes. A stream copy keeps each section's AAC
priming samples (~21ms), which leaves a gap in the music bed at every join and
lets audio drift behind video. Decoding drops them, so the helper re-encodes the
audio once. Video stays a stream copy and stays frame-exact.

The parity check is the whole point. `-c copy` on mismatched inputs does not
error — it produces a file that plays wrong, or stops early, or loses audio
after the first join.

If the helper refuses, fix the section that differs and render it again. Do not
re-encode to force a match unless the difference is genuinely unfixable.

---

## Step G — poster and share copy

Identical to a normal brag. See `step-4-deliver.md`.

Pick the poster from the whole film, not from section 1 — the best frame in a
long cut is usually in the middle, at the product's proof moment.

Bake it as frame 0 with the overlay re-encode from `step-4-deliver.md`. Do not
use cover-art metadata: Slack, X and Discord regenerate thumbnails server-side
and ignore it.

Share copy describes the film, not the sections. Nobody cares how it was built.

---

## Final output structure

```
brag-output/
  brag-plan.md
  composition-brief.md
  clips/
    01-problem/index.html
    02-preview/index.html
    03-verify/index.html
    04-undo/index.html
    05-close/index.html
  renders/
    01.mp4 ... 05.mp4
  brag.mp4
  brag.jpg
  share-copy.txt
```

Keep `clips/` and `renders/`. The sections are reusable on their own — a single
10 second section is a perfectly good post.

---

## What still applies

Every creative law in `SKILL.md` holds inside every section. Readable holds.
Show the thing. No generic SaaS language. The hook is everything — and in a long
cut, section 1 carries the whole film. If section 1 is weak, the other four are
never seen.
