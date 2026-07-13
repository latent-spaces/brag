# Capturing the real product

The product footage is the reason this skill exists. Everything here serves one outcome: the pixels of the product in the final video came out of the product.

## Getting the app up

Find how the project runs before you decide it cannot.

Look, in order, at: `package.json` scripts (`dev`, `start`, `preview`), `Makefile` targets, `docker-compose.yml`, `Procfile`, a `justfile`, the README's "Getting started" or "Usage" section, and any `.env.example` that hints at required config.

Some projects are not a web app. Adapt rather than give up:

| Project shape | What you capture |
|---|---|
| Web app / dashboard | Drive a browser at its URL |
| CLI | Record a real terminal session |
| TUI | Record the terminal, real keystrokes |
| Desktop app | Screen-record the real window |
| Library with no UI | Real terminal: install it, use it, show the output |
| API | Real requests and real responses, in a terminal or a client |

A library with no interface still has a real surface: the install, the import, the call, the output. Film that. "There's no UI" is not a reason to invent one.

**If you truly cannot run it, stop.** Say which step failed and why (missing credentials, an unavailable service, a broken build). Offer `/brag`, which is designed for exactly this case. Do not quietly fall back to recreating the UI. A silent fallback is the failure this skill exists to prevent.

## Driving a web app

`surf` (Chrome automation) is the primary tool. Check `surf --help`; the useful verbs are `window.new`, `navigate`, `click`, `type`, `screenshot`, `record`, `read`, `emulate.device`, `wait`.

Work in an **isolated window** so you never disturb the user's real browsing:

```bash
surf window.new "http://localhost:3000"      # returns a window id
surf --window-id <id> screenshot --output /abs/path/frame.png
```

Notes learned the hard way:

- The screenshot flag is `--output`, and it wants an **absolute path**.
- Read the accessibility tree (`surf --window-id <id> read --compact`) to get stable element refs before clicking. Do not guess selectors.
- Close the window when you are finished (`surf window.close <id>`). Leave the user's browser as you found it.
- For a mobile beat, `emulate.device "iPhone 14"` and capture the same flow again. Reset the emulation afterward.

Playwright or Puppeteer are fine substitutes if `surf` is unavailable. The tool does not matter. The realness does.

`surf --window-id <id>` scopes every call to your isolated window. Always pass it, especially if another agent may be driving surf at the same time. Two more verbs beyond the basics earn their keep: `emulate.viewport` (set size and device scale, below) and `js` (run JavaScript in the page, used for clean-by-construction below).

## Capture at retina

This is the single biggest quality mistake, and it is invisible until the video is rendered. `surf screenshot` **downscales to `--max-size 1200` by default.** A 1200px capture placed in a browser mock that fills a 1920x1080 frame gets upscaled, and upscaled UI reads as soft, cheap, and fake, which is the exact impression a launch video cannot afford.

Capture denser than the slot the image will fill, never sparser:

```bash
surf --window-id <id> emulate.viewport --width 1600 --height 900 --scale 2   # retina desktop
surf --window-id <id> screenshot --full --output /abs/path/frame.png          # --full skips the 1200px downscale
```

`--scale 2` renders the page at 2x device pixels, and `--full` keeps the native resolution. A 1600x900 viewport at scale 2 yields a 3200x1800 PNG, which stays crisp when composited. For a phone beat, `emulate.viewport --width 400 --height 860 --scale 3 --mobile`. Reset the viewport before you close the window.

Aspect ratio matters more than absolute size: match the capture's aspect to the slot it fills in the composition, then make it dense. A frame at the right aspect and 2-3x density drops into an existing composition and simply renders sharp.

The fidelity gate (see gates.md) checks exactly this: no product frame may be captured at fewer pixels than the region it occupies.

## Capture interactions, not screenshots

A running app can *do* things. A storyboard that only needs static screens is wasting it, and static screens are also what a recreation is good at, so you have given up your only advantage.

For each product beat, capture the **verb**:

- Not "the inbox" but *selecting a conversation and watching the pane fill*.
- Not "the composer" but *typing an instruction and pressing send*.
- Not "the handoff panel" but *a handoff arriving in the other agent*.

`surf record` produces an animated capture of a sequence. Prefer it for any beat with motion. Fall back to a burst of stills only when a real recording is not possible, and note it.

**Let real latency show.** A spinner that resolves, a status that flips from queued to delivered, a row that appears. These are the moments that prove the thing is alive. A recreation cannot fake the feeling of a real state change, which is exactly why it is worth filming.

## Clean by construction

An empty app films badly, a fake-looking app films worse, and an app full of the operator's private data cannot ship at all. The move that solves all three is the same: **curate a clean, real, representative state before you capture**, so there is nothing to hide and nothing to blur.

This is the most important lesson in this skill. The instinct when a frame contains something private is to blur or crop it. Blur wrecks the demo. A launch video whose hero screen is a grey smear tells the viewer the product has nothing to show. Do not get into that position. Get the private data off the screen *before* the shutter, not after.

How to construct clean state, in order of preference:

1. **Seed innocuous real content.** Drive the product to produce a genuine but harmless session, record, or job. A real coding agent asked to "rank three chess openings for a beginner" produces a real transcript with zero private paths. The content is real; it just is not sensitive.
2. **Alias real identifiers using the product's own feature.** If the product can rename or alias sessions, users, or records for display, use that. The pixels stay the product's; the private name never renders. This is not repainting, it is using a shipped feature.
3. **Substitute live sensitive text at the source with `surf js`.** When a view shows real data you cannot re-seed (a live queue, an activity log), replace the offending **text** before capturing. Edit text nodes that already exist on screen; do not inject new rows or alter any claim-bearing state:

   ```bash
   surf --window-id <id> js "(function(){ \
     for(var i=1;i<99999;i++){clearInterval(i);}   /* best-effort: kills simple interval polls that would overwrite your edits; misses high timer IDs, requestAnimationFrame, workers, and websocket-driven updates, so re-read the DOM after and confirm the text held before you capture */ \
     document.querySelectorAll('.message-body').forEach(function(el){el.textContent='clean demo text';}); \
     return document.querySelectorAll('.message-body').length; })()"
   ```

   The `js` verb evaluates the code as a single **expression**, so statement forms like top-level `const` and `return` throw; wrap the work in an IIFE (verified against `surf` 2.8.0). Read the app's own source or the live DOM to get the real class names. The timer sweep is blunt: it can also freeze a live interaction you meant to film (a spinner, a status flip, a row that lands). Reserve it for a frame you capture as a still right after sanitizing. If the beat needs a real state change on camera, target the specific poll handle instead of sweeping every ID, and after any sweep exercise the planned interaction to confirm the live transition still fires, not only that the substituted text held. **Substitute only non-claim-bearing text** (a message body, a private name) with clean equivalents. **Do not fabricate claim-bearing state:** never inject a row, bump a count, flip a status, or paint an interaction result the product did not actually produce. Those are claims a viewer reads as product behavior, and a DOM edit that manufactures them is the exact lie this skill exists to prevent. If a beat needs more or different content, produce it by *using the product* (option 1), not by injecting DOM. **Disclose every substitution in the honesty report; and when a substitution materially changes what a viewer believes they are seeing, disclose it to the viewer too** (an on-screen note or a line in the share copy), not only in the private receipt.

Use the product's own commands and interfaces to build state. Do not hand-edit the database. If the *structure* on screen could not have arisen from using the product, you are faking it; if only the *text* is demo content and you disclosed it, you are staging a demo, which is what a demo is.

## What you may and may not change

**You may:** frame, crop, scale, mask, add device chrome, slow down, speed up, cut, and hold. You may put a real screenshot inside a drawn laptop or phone. You may zoom into a corner.

**You may not:** repaint UI, retype labels, recolor status, redraw a button, "clean up" a value, inject a row, bump a count, flip a status the product did not produce, or composite a widget that the app does not render. The product's pixels are not yours.

If a real frame contains something that must not ship (a token, a customer name, a private path), the fix ranks in this order: **construct clean state and re-capture** (best, see "Clean by construction"), **sanitize the offending text at the source** with the product's aliasing or a disclosed `surf js` edit, then **crop it out**, then **cut the shot**. Blurring or masking the content is the last resort, not the first, because it is the move that makes the demo look broken. You still never repaint pixels to fake a feature or a state the product cannot produce.

## Save captures where the composition can find them

```
<output-dir>/composition/assets/capture/
  01-overview.png
  02-select-conversation.gif
  03-send-instruction.gif
  04-handoff-lands.png
  05-mobile.png
```

Name them for the **beat**, not the screen. The name should say what is happening. Every product scene in the composition must reference a file in this directory, and the real-footage gate checks exactly that. The one exception is a scene declared under `--allow-recreation` in `flex-plan.md`, which has no captured file by definition; everything else without a real asset is recaptured or cut.
