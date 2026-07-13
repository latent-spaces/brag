---
name: flex
description: Turn a project you can actually run into a short launch video built from REAL captured footage of the running product, not a CSS recreation of it. Use when someone says "/flex", "make a launch video from the real app", "brag but with real footage", or is about to post a demo video to Twitter/X, LinkedIn, or a community. Drives the live product on its real surface (browser, terminal, or desktop app), records real interactions, and refuses to fake the product. Requires the app to be runnable; use /brag instead when it is not.
---

# /flex

You built it. Now show it. The actual thing.

`/flex` is `/brag` with one law added and enforced: **the product footage is real.** No reconstructed dashboards, no CSS mockups of your own UI, no "close enough" screenshots hand-built from reading the source. The single exception is `--allow-recreation`, off by default, and it does not waive the law so much as force it into the open: every reconstructed frame it permits must be declared in the plan (`flex-plan.md`), where the gates can check it, and recorded again in the honesty report. Silent recreation never happens.

## Why this exists

`/brag` reads project code and rebuilds the UI in CSS. That is a deliberate, reasonable tradeoff: it works on any project, including one you cannot run. It also has a failure mode that gets worse over time.

A reconstructed UI drifts. The real product ships a "Stop" button and the video's mock has two buttons. The real status line says "Running locally" and the mock says "Daemon online". Nobody set out to lie; the mock was built from an older reading of the code and the product moved. The result is a launch video whose product shots are subtly, checkably wrong.

Developers are the one audience that catches this instantly, and a demo video is aimed straight at them. A mocked UI reads as vaporware even when the product is real and good. **If you can run the thing, film the thing.**

Use `/brag` when the project genuinely cannot be run (a concept, a library with no UI, a dead prototype). Use `/flex` when it can.

## What this skill does

1. **Establishes the app is runnable and runs it.** Hard gate. No app, no flex.
2. Inspects the project (reuses `/brag`'s rubric).
3. Plans the concept and storyboard (reuses `/brag`'s planning + tone system).
4. **Captures real footage of the real product**, driving real interactions.
5. Composes with Hyperframes, using the captured footage as the product scenes.
6. Runs the honesty gates against a candidate render, then finalizes and delivers with share copy and a CTA.

Steps 2, 3, 5 borrow `/brag` wholesale. Steps 1, 4, and 6 are what `/flex` adds.

## Dependencies

`/flex` is co-bundled with `/brag` in this plugin (both live under `skills/`), and it reuses brag's 16MB of assets and its tone system rather than duplicating them. Paths below are relative to this skill's directory, so `../brag/` resolves to the sibling brag skill.

| Need | Path |
|---|---|
| Music, SFX, cue presets | `../brag/assets/` |
| Tone presets | `../brag/references/tones.md` |
| Audio direction | `../brag/references/audio.md` |
| Project inspection rubric | `../brag/references/step-1-inspect.md` |
| Planning + storyboard | `../brag/references/step-2-plan.md` |
| Composition rules | `../brag/references/step-3-compose.md` |
| Render + deliver | `../brag/references/step-4-deliver.md` |

Installing this plugin installs brag alongside flex, so the sibling paths above always resolve. If you run flex as a standalone user skill instead, point these paths at wherever brag is installed.

### Reading the borrowed brag references

The brag references were written for standalone `/brag` and were not edited for this fork. Translate four things as you read them, so a fresh agent does not follow brag's literal instructions off a cliff:

- **Provenance (the load-bearing one).** brag assumes a CSS recreation of the product is acceptable, so its references tell you to "recreate the dashboard", "recreate a UI element in HTML", "simulate a swipe", and to show "at least one real element". In `/flex` that assumption is inverted and this is the whole point of the skill: wherever a borrowed reference says to recreate, simulate, or mock a product surface or interaction, you **capture it for real instead** (Step 3 and the real-footage gate). "At least one real element" becomes "every product frame is real". The only recreated frame allowed is one you deliberately declare under `--allow-recreation`. If you catch yourself building a scene in CSS because a borrowed reference told you to, stop: that is the exact failure `/flex` exists to prevent.
- **Paths.** Where a brag reference writes `~/.claude/skills/brag/...` or `skills/brag/...` (the asset roots in `audio.md`, `step-3-compose.md`), read it as `../brag/...`, the sibling brag skill in this plugin. If you installed flex standalone, substitute wherever brag actually lives. The brag references never point at the right place on their own.
- **Output directory.** brag writes to `brag-output/`. flex writes to **`<output-dir>`**, which defaults to `flex-output-<timestamp>/` (create it in Step 2 and reuse it for every artifact). Wherever a brag reference says `brag-output/`, read `<output-dir>/`.
- **Filenames.** brag's `brag-plan.md`, `brag.mp4`, and `brag.jpg` are flex's `flex-plan.md`, `flex.mp4`, and `flex.jpg`. `composition/`, `composition-brief.md`, and `share-copy.txt` keep their names. When a borrowed reference names a `brag-*` file, write the `flex-*` equivalent.

## Invocation

```
/flex
/flex --tone polished
/flex --url http://localhost:3000
/flex --format square --duration 20
```

| Option | Values | Default |
|---|---|---|
| `--url` | where the running app lives | auto-detect |
| `--tone` | any `/brag` preset or freeform | inferred |
| `--format` | `landscape`, `vertical`, `square` | `landscape` |
| `--duration` | seconds | auto (15–25s) |
| `--no-music` / `--no-sfx` | flag | music & SFX on; pass a flag to disable that layer |
| `--allow-recreation` | flag | **off** |

`--allow-recreation` is the escape hatch. It permits a reconstructed scene, and in exchange the run is required to declare every reconstructed frame in `flex-plan.md` (Step 2), which every downstream gate checks and the honesty report records. There is no silent recreation.

---

## Step 0: Prove the app runs

**Read:** [references/capture.md](references/capture.md) → "Getting the app up"

Find how this project runs and run it. Confirm the real product responds on whatever surface it has. Not every project is a web app; capture.md's "Getting the app up" table maps each shape to what you capture: a web app serves a URL, a CLI or TUI runs in a terminal, a desktop app opens a window, a library installs and runs, an API answers real requests.

**Gate:** The actual product is running and you have seen it on its real surface (loaded the URL, run the command, opened the window). If you cannot get it running, **stop and say so.** Do not proceed to build a video of a product you never saw. Offer `/brag` instead, and name the reason.

This gate is the whole point of the skill. Do not soften it.

---

## Step 1: Inspect

**Read:** `../brag/references/step-1-inspect.md`

Same rubric as `/brag`. You now have an advantage it lacks: you can *look* at the running product instead of inferring it from source. Use that. Where the code and the running app disagree, **the running app wins.**

**Gate:** You can answer all 9 rubric questions, and you have seen every screen you intend to show.

---

## Step 2: Plan and storyboard

**Read:** `../brag/references/step-2-plan.md`
**Read:** `../brag/references/tones.md`

Pick `<output-dir>` now (default `flex-output-<timestamp>/`, e.g. `flex-output-2026-07-13-052656/`), `mkdir -p` it, and use it for every artifact from here on. Write `<output-dir>/flex-plan.md`. All of `/brag`'s creative laws apply (short, readable, specific, hook-first, no SaaS language).

Two additional planning rules:

**Storyboard the interactions, not the screenshots.** A real capture can *do* things. Plan the product beats as verbs: select the conversation, type the instruction, send it, watch the handoff land. Static screens are a waste of a running app.

**Budget the product more time than the claims.** Sum your abstract/title scenes and your product scenes. Product must be the larger number. If it isn't, cut a claim.

**Declare any recreation up front.** If you invoked `--allow-recreation`, list every scene you intend to reconstruct in `flex-plan.md` now, with the reason it cannot be captured. This declaration is the authoritative record the capture, composition, and honesty gates all check, so it has to exist before you compose. A recreated scene that is not in the plan is an undeclared recreation, which fails the real-footage gate.

**Gate:** `flex-plan.md` exists. Scene durations sum to 15–25s. Product scene time > abstract scene time. Every intended recreation is declared in it.

---

## Step 3: Capture the real product

**Read:** [references/capture.md](references/capture.md)

Drive the live app and record it. Real cursor, real typing, real state changes, real latency.

Two disciplines from capture.md decide whether the footage is usable, and both are easy to get wrong:

- **Capture at retina.** `surf screenshot` downscales to 1200px by default, and upscaled UI looks fake. Capture with `emulate.viewport --scale 2` and `screenshot --full` so the frame is denser than the slot it fills. This is enforced by the fidelity gate.
- **Clean by construction.** Get private data off the screen before the shutter, not after. Seed innocuous real content, alias real identifiers with the product's own feature, or sanitize live text at the source with a disclosed `surf js` DOM edit. Blurring after the fact wrecks the demo and is the last resort, never the first.

**Gate:** Every product scene in the storyboard has a real captured asset backing it, captured at full fidelity, with no private data on screen. Any scene without a real asset is recaptured or cut. `--allow-recreation` is the only exception, and it forces a declaration in `flex-plan.md`.

---

## Step 4: Compose

**Read:** The `hyperframes` skill (all rules apply)
**Read:** `../brag/references/step-3-compose.md`
**Read:** `../brag/references/audio.md`

Compose in `<output-dir>/composition/`. The captured footage goes in `composition/assets/capture/` and is composited as real media. Motion, type, and transitions are yours; **the pixels of the product are not yours to invent.**

Frame the capture (device chrome, scale, crop, masking) freely. Do not repaint it.

**Gate:** `npx hyperframes lint` passes with zero errors. Every product scene references a file under `assets/capture/`, unless it is a scene declared under `--allow-recreation` in `flex-plan.md`.

---

## Step 5: Run the honesty gates

**Read:** [references/gates.md](references/gates.md)

Seven gates, each a real failure mode I have watched ship. Most run on the composition and the captured frames; three (the muted gate, the CTA gate, and the rendered-frame half of the secrets gate) need a rendered video or the share copy. So Step 5 straddles a **candidate render**: run every gate you can on the composition first, produce a candidate `flex.mp4` and a draft `share-copy.txt`, then run the three that need them. Nothing is delivered until all seven resolve.

1. **Real-footage gate.** *(composition)* Every product frame traces to a capture, or is a scene declared under `--allow-recreation` in `flex-plan.md`.
2. **Drift gate.** *(composition)* Nothing on screen contradicts the running app.
3. **Happy-path gate.** *(composition)* Every flow shown works on a fresh install, with no undocumented setup step.
4. **Secrets gate.** *(captured frames, then the candidate render)* No token, key, QR code, private URL, or PII in any captured frame, and none the composition introduced once rendered. Prefer clean-by-construction and disclosed text substitution (never fabricated rows/counts/state) over blur.
5. **Muted gate.** *(candidate render)* Watch it with the sound off; the story still lands.
6. **CTA gate.** *(draft share copy)* The share copy tells people where to get it.
7. **Fidelity gate.** *(captured frames)* Every captured product frame is at least as dense as the slot it fills. No upscaling. A scene declared under `--allow-recreation` in `flex-plan.md` is exempt; the real-footage gate governs it.

Gates 1–3, the captured-frame half of 4, and 7 run before you render. Then produce the candidate render (`npx hyperframes render`) and draft `share-copy.txt`, and finish 5, 6, and the rendered-frame half of 4 against them.

**Gate:** Secrets, real-footage, and drift **hard-block** and must pass. A secrets failure on a captured frame is fixed before the candidate render; one the composition introduced is fixed and the candidate re-rendered before Step 6. A real-footage failure means an undeclared recreation, and reporting it does not clear it, that is the silent-recreation the skill exists to stop; fix it (real capture, a declared recreation in `flex-plan.md`, or cut the scene). The remaining gates (happy-path, fidelity, muted, CTA) are reported to the user before delivery; a reported failure there is the user's decision to accept, not a silent pass.

---

## Step 6: Finalize and deliver

**Read:** `../brag/references/step-4-deliver.md`

The candidate render from Step 5 becomes the final `<output-dir>/flex.mp4` once its gates pass; re-render only if a reported gate prompted a change to the composition. Pick a real best frame to `<output-dir>/flex.jpg` and finalize `<output-dir>/share-copy.txt`.

Then write `<output-dir>/honesty-report.md`: the seven gates, pass or fail, every reconstructed frame if `--allow-recreation` was used, and every frame whose text was substituted at the source. This file is the receipt. It is what lets someone else trust the video without re-auditing it. When a substitution materially changes what a viewer believes they are seeing, the disclosure also ships with the video or the share copy, not only in this private report.

**Gate:** `flex.mp4` exists. `honesty-report.md` exists and every gate is accounted for.

---

## The laws

Everything in `/brag`'s creative laws, plus:

**Film it, don't paint it.** If the product can be run, its pixels come from the product.

**The running app is the source of truth.** Not the source code, not last week's screenshot, not your memory of the UI.

**Never demo a path that needs an unmentioned step.** If your flow only works after a setup command the video never shows, you are filming a lie with real pixels. Show the step or cut the flow.

**A demo is a promise.** Someone will install this and try to reproduce exactly what they saw. Make that possible.

**Capture dense, not soft.** A blurry product shot reads as fake even when it is real. Film at retina and let the frame be denser than the slot it fills.

**Construct clean, do not blur clean.** Get private data off the screen before you capture. Blur is what a broken demo looks like.
