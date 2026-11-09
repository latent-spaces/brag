import assert from "node:assert/strict";
import test from "node:test";
import { heroMutePresentation } from "../docs/hero-controls.js";

test("a muted hero asks the viewer to turn sound on", () => {
  assert.deepEqual(heroMutePresentation(true), {
    pressed: "true",
    label: "unmute brag video",
    hint: "tap for sound",
  });
});

test("an unmuted hero tells the viewer sound is on", () => {
  const presentation = heroMutePresentation(false);
  assert.equal(presentation.pressed, "false");
  assert.equal(presentation.label, "mute brag video");
  assert.equal(presentation.hint, "sound on");
});
