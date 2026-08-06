# Frame worker — brag delta

You are building one frame of a launch video for a real, working product. The
core contract above holds in full. This adds what is specific to brag.

## What is different here

**There is no narration.** Brag films are usually silent, and there is no
caption track. So the constraint that visible text must be a hero word rather
than a sentence is *relaxed* — your frame's reading lines ARE the voice, and
they must be legible and held. The block quoted under **Must be readable
here** in your storyboard block is copy the film has committed to: render it
exactly, and let it settle for at least the stated time.

Everything else about text still applies: nothing else on screen should be a
paragraph, and the reading lines are the only sentences in the frame.

**Captions are disabled, and the keep-out still holds.** Keep every element
above `y ≈ 0.83 × height`. It is a bottom-edge consistency rule, not a caption
rule, and a review layer measures it from rendered pixels.

## Fill the frame

This is the one that gets failed most, and in portrait it gets failed worst.
A single line of type floating in the middle of a 1080×1920 canvas is not a
composition — it is a placeholder that survived to the render.

- Anchor the hero high, around `0.2–0.35 × height`, and let supporting
  material flow down from it.
- Compose the whole region above the keep-out. If you have one line of copy,
  the frame needs something else in it: the product surface, a structural
  element the world calls for, a figure, the object the scene is about.
- Scale the hero toward full-bleed rather than setting it at body size in the
  middle of an empty page.

## Build what the world says exists

`frame.md` carries a **visual world** — a camera model, a number of depth
levels, and a transition vocabulary. These are not decoration and they are not
optional. A world that declares `camera_model: push` and `depth_levels: 5`
describes a frame with real depth in it: a `perspective` lens on the stage, a
`preserve-3d` world, and elements sitting on distinct Z planes that the camera
moves through. If your frame renders as flat type on a flat page, you have not
built the world — you have ignored it.

Use the documented CSS-perspective camera (`hyperframes-animation`'s
`3d-camera-flight` rule). Three.js is out of scope.

## brag's own storyboard fields

Your block carries `brag_*` keys alongside the standard ones. They are the
scene graph speaking:

- `brag_scene_id` — the scene's id in the graph. Prefix your authored ids and
  class names with the frame id, as the core contract requires.
- `brag_role` — how the storyboard files this scene: `Hook`, `Problem`,
  `Product_Intro`, `Key_Feature`, `Benefits`, `Social_Proof`, `CTA`,
  `Brand_Outro`. **Never render it.** It is brag's filing system, and a frame
  that prints `SOCIAL PROOF` on itself both leaks internal vocabulary and makes
  a claim about third parties that the frame usually cannot support.
- `brag_objects` — the objects this scene shows, with the focal one starred.
  The starred object is the hero; build the frame around it.
- `brag_proof` — the proof id this scene is required to show. If it is present,
  the frame must *show* that evidence, not assert it in a sentence.
- `brag_continuity_in` / `brag_continuity_out` — the neighbouring scenes. What
  travels across those cuts is stamped at the root; you do not author it.
- `brag_start` — where this frame sits on the film's clock, for reference.

## Captured surfaces are real, and they are the point

If your dispatch names a capture (a terminal session, a screenshot, an API
exchange), it holds bytes the product actually produced. Render it as the
product's own interface, at a size someone can read — for a CLI the terminal
*is* the product, not evidence pasted onto a slide.

Never hand-write terminal output, invent a log line, or extend a captured
session with plausible-looking rows. A verification layer compares every
rendered string against the capture and against the product model, and an
invented line fails it as capture drift.

## Everything on screen must be sourced

Any string you render has to trace to something the project actually says or
prints: a verbatim string from the product model, a line from a capture, or a
claim bound to a proof. Do not write connective copy, taglines, feature names,
or numbers of your own. If a frame feels like it needs a line that does not
exist, that is a storyboard problem — build what you were given.
