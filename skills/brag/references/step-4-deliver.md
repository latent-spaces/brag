# Step 4: Validate, render, and deliver

## Validate

```bash
cd brag-output/composition
npx hyperframes check   # brag's single pre-render gate — fix every error it reports
```

Fix all errors. `check` is brag's single pre-render gate — run it and fix everything it reports, including WCAG contrast failures (they gate as errors, not warnings). Each contrast finding carries a suggested compliant color, so apply it or adjust within the palette family and re-run `check` — most fixes need no screenshot. There is no per-element contrast escape hatch for real text; the only bypass is `check --no-contrast`, which skips the entire WCAG pass (all-or-nothing), not a way to accept one borderline element. For exact contrast thresholds, layout escape hatches, and reporting details, follow the current hyperframes-cli `check` guidance. `check`'s layout pass backstops the "keep all text readable" creative law — fix any reported overflow.

For a visual gut-check before rendering, optionally capture key frames:

```bash
npx hyperframes snapshot   # PNG key frames
```

## Preview

```bash
npx hyperframes preview
```

Tell the user the preview is running and give them the localhost URL. Invite them to check it before rendering.

If the user approves or asks to render:

## Render

```bash
npx hyperframes render --output ../brag.mp4
```

This outputs to `brag-output/brag.mp4` (one level up from the composition directory).

For a faster iteration render:
```bash
npx hyperframes render --quality draft --output ../brag.mp4
```

For final delivery:
```bash
npx hyperframes render --quality high --output ../brag.mp4
```

## Pick the poster frame

The poster is the still shown before the video plays — the first thing anyone sees when it's idle or unplayed. Don't leave it to the raw first frame or an arbitrary timestamp; those land on fades, mid-transitions, blank intro backgrounds, or half-rendered text.

You built this composition, so you already know its strongest moment and exactly when it lands — the hook line, the hero reveal, or the final logo. Pick that beat at a **settled** point: text fully animated in, before it exits (the storyboard timings tell you the safe window). Then extract that one frame full-res with ffmpeg. From `brag-output/composition`:

```bash
# use the timestamp of your strongest settled beat, e.g. 3.2s
ffmpeg -ss 3.2 -i ../brag.mp4 -frames:v 1 -q:v 2 ../brag.jpg
```

Aim for a frame that's postable on its own (the "show the thing" law — any frozen frame should be shareable). If the pulled frame lands on a transition or mid-animation, nudge the timestamp a few tenths of a second and re-extract.

### Attach the poster, and make the opening earn frame 0

A bare `.mp4` has no `poster` attribute, so a player picks its own idle image and most thumbnail grabbers take **frame 0**. The tempting fix is to paint the poster over the first frame.

Don't. Frame 0 is what a player shows while the video sits paused — so a spliced poster is the image the viewer stares at *and then* watches jump to something else the instant they press play. It is one frame, and it reads as a glitch rather than as a thumbnail. A blind reviewer called it exactly that on a film that had passed every other gate. "Imperceptible on playback" is not true of the frame a paused video is parked on.

So the poster is attached as an `attached_pic` stream — what players and metadata readers look for — copying the streams rather than re-encoding, which also means delivery cannot degrade the render:

```bash
ffmpeg -y -i brag.mp4 -i brag.jpg \
  -map 0 -map 1 -c copy -c:v:1 mjpeg \
  -disposition:v:1 attached_pic -movflags +faststart brag.poster.mp4 \
  && mv brag.poster.mp4 brag.mp4
```

That leaves the platforms which regenerate thumbnails server-side taking frame 0, and the honest answer to those is an opening worth grabbing rather than a splice. The flat-frame detector fails a frame zero that is black or empty for exactly this reason: if the hook opens on a blank background mid-fade, fix the hook.

The poster (`brag.jpg`) matches the video's dimensions because it was pulled from the same render, so the overlay lines up exactly. Keep `brag.jpg` alongside — it's the custom-thumbnail asset for platforms that accept an upload (Instagram, TikTok, YouTube, Facebook, and the LinkedIn post editor) and the `poster="brag.jpg"` image for any `<video>` that embeds the brag (a gallery card, the user's site).

## Write share copy

Write `brag-output/share-copy.txt`.

The share copy should be:
- One to three sentences max
- Postable as-is to Twitter/X, LinkedIn, or Discord
- Specific to the project — no generic "excited to share" language
- Tone-matched to the brag video

`share-copy.txt` is the canonical single caption. Do not put multi-platform variants, long launch notes, or Product Hunt copy in this file.

If variants are useful, write them to a separate optional file:

```text
brag-output/share-copy-variants.md
```

### Share copy by tone

**`default`:**
```
Made [App Name]. It's [what it does, in the project's own absurd terms].
[The best line from the product.]
```

**`polished`:**
```
Introducing [App Name]: [clean one-liner from the site].
Built with [stack if notable].
```

**`yc-parody`:**
```
We built [App Name] to solve [problem stated completely seriously].
[Deadpan feature or stat.]
```

**`chaotic`:**
```
[ALL CAPS CLAIM].
[App Name] is [wildly overstated description].
Link below.
```

**`deadpan`:**
```
I made [App Name].
It [what it does].
```

**`cinematic`:**
```
[App Name].
[Tagline from the site, verbatim or lightly adapted.]
```

**`app-store`:**
```
[App Name] is now live.
[Feature 1], [Feature 2], and [Feature 3] — all in one place.
```

### Example: Taxi for Taxis

```
Every day, taxis carry us. But who carries the taxis?
Taxi for Taxis: the ride-hailing app for ride-hailing assets.
Available in 12 metros.
```

## Final output structure

After this step, `brag-output/` should contain:

```
brag-output/
  brag.mp4                — the rendered video
  brag.jpg                — the poster (best frame, for <video poster>)
  brag-plan.md            — the plan and storyboard
  composition-brief.md    — the Hyperframes handoff brief
  share-copy.txt          — the share caption
  composition/            — the Hyperframes project
    index.html
    ...
```

## Telling the user

After everything is done, tell the user:
- Where the video is (`brag-output/brag.mp4`)
- Where the share copy is
- One sentence on what the video does creatively
- Optionally: offer to re-roll a scene, change tone, or try a different angle
