# The honesty gates

Seven checks, run before you deliver. Most run on the composition and the captured frames before you render; three (muted, CTA, and the rendered-frame half of secrets) run against a candidate render and a draft share copy. Each one is a real failure mode that has shipped in a real launch video. Report the result of every gate to the user, then write them to `honesty-report.md`.

A gate that "probably passes" has not been run.

---

## 1. Real-footage gate

**Check:** Every product frame in the composition traces back to a file in `assets/capture/`, or is a scene explicitly declared under `--allow-recreation` in `flex-plan.md`.

Grep the composition for image and video references. Any product surface drawn with divs, CSS, and hand-typed labels is a violation, unless it is a declared `--allow-recreation` scene named in `flex-plan.md`. Recreation with no declaration is exactly the failure this gate exists to catch.

```bash
ls composition/assets/capture/          # should not be empty
grep -o 'assets/capture/[^"]*' composition/index.html | sort -u
```

**The tell:** `assets/` contains only `music/` and `sfx/`. If there is no capture directory, no product was filmed, and the video is a drawing of the product.

**Fail action:** Capture the missing beats. If a beat genuinely cannot be captured, cut it or invoke `--allow-recreation` and declare it in `flex-plan.md`. This gate hard-blocks the render: an undeclared recreation stops the run. Reporting the failure does not clear it, and you do not proceed to Step 6 until every product frame is a real capture or a declared recreation.

---

## 2. Drift gate

**Check:** Nothing on screen contradicts the running app.

Even a real capture can drift: a screenshot from three weeks ago, a beta build, a feature flag that is off in production. Open the running app **now**, side by side with the composition, and compare every product frame.

Look specifically at: status text, button sets, nav labels, counts, and version strings. These are what people zoom in on.

**Real example:** a video's mock showed a status of "Daemon online" and two buttons. The shipped product said "Running locally" and had three. Nobody lied. The mock was built from an older read of the code, and the product moved. That is exactly how drift arrives.

**Fail action:** Recapture. A stale real screenshot is still a false claim.

---

## 3. Happy-path gate

**Check:** Every flow shown works on a fresh install, with no undocumented setup step.

This is the subtlest gate and the most damaging to fail, because the footage is real and the video is still misleading.

Ask, for each product beat: **would this work for someone who just installed it and followed the README?** If it only works because of a setup command the video never shows, a service you happened to have running, or a bridge you enabled last Tuesday, then you are filming a lie with real pixels.

**Real example:** a demo showed an agent handoff landing live in a desktop app. Genuine footage. But that write path only works if the app was launched through a specific bridge command. A viewer who installs, opens the app normally, and reproduces the video exactly gets a failed send.

**Fail action:** Either show the setup step in the video, or cut the flow, or fix the product so the demoed path is the default. Documenting an aspirational happy path is fine **only** if the product will ship that way before the video posts. If it will, say so, and hold the video until it does.

---

## 4. Secrets gate

**Check:** No token, API key, QR code, private URL, tailnet or internal hostname, customer name, email, or file path that reveals something private, in any frame.

This gate never gets waived. Real footage means real data, and the failure is unrecoverable once posted.

Scan every captured frame and every rendered frame. Zoom in. Check: address bars, terminal scrollback, settings screens, notification toasts, browser tabs, window titles.

**QR codes are the sharpest edge.** A QR encoding an access token is a credential rendered in a format your eye does not read as one. Anyone who pauses the video owns it. A settings screen that displays a QR by default will leak it to every viewer.

**Real example:** a dashboard's settings screen rendered a live access-token QR by default. A demo video of that screen would have handed full control of the user's agents to the entire audience.

**Fail action, in order:** (1) construct clean state and re-capture (see capture.md "Clean by construction"); (2) substitute the offending **text only** at the source, via the product's own aliasing or a `surf js` DOM edit (never inject rows or alter counts/status), **disclose that edit in the honesty report**, and surface the disclosure to viewers when it changes what they believe they see; (3) crop it out; (4) cut the shot. **Blurring or masking is the last resort, not the first**, because it is the move that makes the hero shot look broken, which is its own kind of failure. **Never repaint pixels to fake a feature or state.** And never deliver past this gate: a secrets failure on a captured frame is fixed before the candidate render, and one that appears only in the rendered composition is fixed and the candidate re-rendered. Fix it first.

---

## 5. Muted gate

**Check:** The video lands with the sound off.

Twitter, LinkedIn, and most feeds autoplay muted. Most viewers will never hear the music bed, the beat grid, or the SFX. That effort still pays off in an embed or a community post, but the feed is muted by default.

Watch the render with the sound off. Does the story still land? Is every claim carried by something visible? If a beat only works because of an audio hit, that beat does not work.

**Fail action:** Move the meaning into the frame. Audio supports; it never carries.

---

## 6. CTA gate

**Check:** The share copy tells people where to get it.

Good copy that ends without a link is a conversion thrown away. The post is the moment someone decides to try it, and they cannot.

Share copy needs: the hook, what it is, and **where to get it** (repo URL, install command, or site). If the license or platform constrains who can use it, say so plainly rather than letting someone discover it after cloning.

**Also check hook coherence.** The first line of the share copy and the first line of the video should be the *same line*. Two different hooks compete with each other; one hook, stated twice, compounds.

**Real example:** a launch post opened "Your agents are already working. They just have no idea what the others are doing," while the video opened "Your agents are working. Just not together." Both are good. Together they are two openings fighting for the same two seconds.

**Fail action:** Add the CTA. Pick one hook.

---

## 7. Fidelity gate

**Check:** Every captured product frame is at least as dense as the region it fills on screen. No upscaling. A scene declared under `--allow-recreation` in `flex-plan.md` is not a capture, so it is exempt here and is governed by the real-footage gate instead.

This is the gate for the failure that is invisible until render: a soft, low-resolution product shot. It happens by default, because `surf screenshot` downscales to 1200px unless told otherwise, and a 1200px image stretched across a 1920x1080 frame is blurry. Soft UI reads as fake, which defeats the entire point of filming the real thing.

For each product capture, compare its pixel dimensions to the pixels it occupies in the composition. A frame that fills a 1450px-wide browser mock must be at least 1450px wide, and 2-3x that is better. See capture.md "Capture at retina".

```bash
# a frame that fills most of a 1920-wide comp should be ~3000px+ wide
ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=s=x:p=0 frame.png
```

**Fail action:** Re-capture with `emulate.viewport --scale 2` and `screenshot --full`. Do not upscale the existing PNG; upscaling adds pixels, not detail.

---

## Writing the report

`honesty-report.md`, in the output directory:

```markdown
# Honesty report

| Gate | Result | Note |
|---|---|---|
| Real footage | PASS | 5 beats, all from assets/capture/ |
| Drift | PASS | compared against localhost:7412 at 05:31 |
| Happy path | FAIL | handoff beat needs `app launch bridge` first; see below |
| Secrets | PASS | settings screen cut; it renders a token QR |
| Muted | PASS | every claim is on screen |
| CTA | PASS | repo link + install line in share copy |
| Fidelity | PASS | frames captured at 3200x1800, drop into a 1450px slot |

## Reconstructed frames
None. (Or: list every one, with the reason.)

## Sanitized frames
None. (Or: list each frame where DOM text was edited via `surf js` or the product's aliasing, what was replaced, and why. The UI, feature, counts, and state stay real; only the disclosed text is demo content. If a substitution materially changed what a viewer believes they are seeing, note the viewer-facing disclosure that ships with the video or share copy.)

## Open risks
The handoff beat documents the intended default, which ships in v0.2.
```

The report is the receipt. It is what lets someone trust the video without re-auditing it, and it is what stops *you* from talking yourself past a gate at 2am.
