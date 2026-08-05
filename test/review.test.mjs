/**
 * Phase 2: the timing solver and the layer-2 detectors.
 *
 * Detectors are exercised against synthetic frames rather than a render, so a
 * threshold change shows up as a failing assertion with a number in it instead
 * of a video someone has to squint at.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectCaptionZone,
  detectFlatFrames,
  detectRepeatedLayouts,
  detectUnreadableCopy,
  layoutSignature,
} from "../cli/lib/detect/index.mjs";
import { aHash, hamming, isFlat, rowInk } from "../cli/lib/watch/pixels.mjs";
import { chooseTimes } from "../cli/lib/watch/bundle.mjs";
import { minimumDuration, solveTiming } from "../cli/lib/solve/timing.mjs";
import { tightScenes } from "../cli/lib/compile/targets.mjs";
import { assignLayouts, assertDistinct, loadWorlds, worldSignature } from "../cli/lib/worlds.mjs";
import { checkSameness, familyOf, fingerprint, similarity } from "../cli/lib/score/fingerprint.mjs";

/* ------------------------------------------------------------------ helpers */

const frame = (over = {}) => ({
  at: 3,
  kind: "midpoint",
  scene: "hook",
  hash: "0",
  ink: new Array(36).fill(0),
  tone: { flat: false, dark: false, mean: 40, stdDev: 30 },
  ...over,
});

/** A synthetic grayscale frame with a band of ink at a given height. */
function grayWithInkAt(fraction, { w = 64, h = 36, bg = 12, ink = 200 } = {}) {
  const data = new Uint8Array(w * h).fill(bg);
  const row = Math.floor(h * fraction);
  for (let y = row; y < Math.min(h, row + 2); y++) {
    for (let x = 4; x < w - 4; x++) data[y * w + x] = ink;
  }
  return { w, h, data };
}

/* ------------------------------------------------------------------ timing */

test("a scene's minimum duration accounts for entry, stagger and the last line's floor", () => {
  const min = minimumDuration({
    reading: [{ text: "short one" }, { text: "a considerably longer line of copy here" }],
  });
  assert.ok(min > 2.5, `expected room for two lines, got ${min}`);
});

test("the solver refuses a target shorter than the copy's reading floor", () => {
  const graph = {
    scenes: [
      { id: "a", duration: 4, reading: [{ text: "a line of about seven words here" }] },
      { id: "b", duration: 4, reading: [{ text: "another line of about seven words here" }] },
    ],
    seams: [],
  };
  const plan = solveTiming(graph, { targetDuration: 2 });
  assert.equal(plan.ok, false);
  assert.equal(plan.violations[0].kind, "target_too_short");
  assert.match(plan.violations[0].message, /the floor does not move/);
});

test("the solver tightens dwell rather than reading time when it can", () => {
  /* Both scenes carry enough copy that their preferred length survives the
     trim, so the only way to reach the target is the dwell above each floor. */
  const graph = {
    scenes: [
      { id: "a", duration: 6, reading: [{ text: "a line of roughly twelve words that takes real time to read" }] },
      { id: "b", duration: 6, reading: [{ text: "another line of roughly twelve words that also takes time to read" }] },
    ],
    seams: [],
  };
  const target = 9;
  const plan = solveTiming(graph, { targetDuration: target });
  assert.equal(plan.ok, true);
  assert.ok(plan.total <= target + 0.01, `expected to fit ${target}s, got ${plan.total}`);
  for (const s of plan.scenes) {
    assert.ok(s.duration >= s.min, `${s.id} fell below its floor: ${s.duration} < ${s.min}`);
  }
  assert.ok(
    plan.relaxations.some((r) => r.kind === "comprehension_dwell"),
    `expected a dwell squeeze, got ${plan.relaxations.map((r) => r.kind).join(", ")}`,
  );
});

test("a cut only moves to a musical cue when the scene can afford it", () => {
  const graph = {
    scenes: [
      { id: "a", duration: 4, reading: [{ text: "one two three" }] },
      { id: "b", duration: 4, reading: [{ text: "four five six" }] },
    ],
    seams: [],
  };
  const cut = solveTiming(graph).scenes[1].start;
  const generous = solveTiming(graph, { strongCues: [cut + 0.1] });
  assert.equal(generous.cut_locks.length, 1);
  assert.equal(generous.cut_locks[0].at, Number((cut + 0.1).toFixed(2)));

  /* A cue that would starve the previous scene is left alone, and said so.
     Since a cue may only pull a cut by 0.15s, starvation is only possible for
     a scene already sitting within that of its own floor — which is exactly
     the case worth protecting. */
  const floor = minimumDuration({ reading: [{ text: "one two three" }] });
  const tightGraph = {
    scenes: [
      { id: "a", duration: floor + 0.06, reading: [{ text: "one two three" }] },
      { id: "b", duration: 4, reading: [{ text: "four five six" }] },
    ],
    seams: [],
  };
  const starved = solveTiming(tightGraph, { strongCues: [floor - 0.06] });
  assert.equal(starved.cut_locks.length, 0, "a cue must not push a scene below its reading floor");
  assert.equal(starved.relaxations.at(-1).kind, "cue_dropped");
  assert.match(starved.relaxations.at(-1).message, /reading floor/);
});

test("copy that cannot be read in its scene is reported with the numbers", () => {
  const graph = {
    format: { width: 1920, height: 1080, fps: 30 },
    scenes: [
      { id: "hook", duration: 3, reading: [{ text: "fine" }] },
      { id: "rushed", duration: 0.3, reading: [{ text: "six whole words go by here" }] },
    ],
    seams: [],
  };
  const findings = detectUnreadableCopy(tightScenes(graph));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].scene, "rushed");
  assert.equal(findings[0].code, "reading_floor_violated");
  assert.match(findings[0].message, /needs 1\.8s/);
});

/* ------------------------------------------------------------------ pixels */

test("a flat frame is recognised as flat, and a real one is not", () => {
  const black = { w: 8, h: 8, data: new Uint8Array(64).fill(2) };
  assert.equal(isFlat(black).flat, true);
  assert.equal(isFlat(black).dark, true);

  const real = grayWithInkAt(0.4);
  assert.equal(isFlat(real).flat, false);
});

test("row ink finds the band the text is actually on", () => {
  const rows = rowInk(grayWithInkAt(0.5));
  const brightest = rows.indexOf(Math.max(...rows));
  assert.ok(Math.abs(brightest / rows.length - 0.5) < 0.08, `ink found at ${brightest / rows.length}`);
});

test("two different layouts hash differently; the same one does not", () => {
  const a = aHash(grayWithInkAt(0.2));
  const b = aHash(grayWithInkAt(0.8));
  const c = aHash(grayWithInkAt(0.2));
  assert.equal(hamming(a, c), 0);
  assert.ok(hamming(a, b) > 4, `expected distinct layouts, distance was ${hamming(a, b)}`);
});

/* ------------------------------------------------------------------ detectors */

test("a black frame is a finding where content is due, and frame zero says why it matters", () => {
  const black = { flat: true, dark: true, mean: 1, stdDev: 0.4 };
  const findings = detectFlatFrames([
    frame({ kind: "frame_zero", at: 0, tone: black }),
    frame({ kind: "midpoint", at: 12, scene: "proof", tone: black }),
    /* Mid-transition is black by construction — the outgoing scene has left
       and the incoming one has not arrived. Flagging it reports the technique
       as the defect. */
    frame({ kind: "at_cut", at: 4.5, scene: "mechanism", tone: black }),
    frame({ kind: "post_cut", at: 4.75, scene: "mechanism", tone: black }),
  ]);
  assert.equal(findings.length, 2, "only composed moments count");
  assert.equal(findings[0].code, "black_frame");
  assert.match(findings[0].message, /thumbnail/);
  assert.equal(findings[1].scene, "proof");
});

test("the final frame is allowed to rest on a clean ground", () => {
  const findings = detectFlatFrames([
    frame({ kind: "final", tone: { flat: true, dark: true, mean: 1, stdDev: 0.2 } }),
  ]);
  assert.equal(findings.length, 0);
});

test("content in the caption band is caught, above it is not", () => {
  const low = rowInk(grayWithInkAt(0.92)).map((v) => Number(v.toFixed(3)));
  const high = rowInk(grayWithInkAt(0.45)).map((v) => Number(v.toFixed(3)));

  const caught = detectCaptionZone([frame({ ink: low, scene: "outro", at: 12 })]);
  assert.equal(caught.length, 1);
  assert.equal(caught[0].code, "caption_zone_collision");
  assert.equal(caught[0].scene, "outro");

  assert.equal(detectCaptionZone([frame({ ink: high })]).length, 0);
});

test("two scenes with the same layout are reported once, naming both", () => {
  const inkAt = (f) => rowInk(grayWithInkAt(f)).map((v) => Number(v.toFixed(3)));
  const same = inkAt(0.4);
  const findings = detectRepeatedLayouts([
    frame({ scene: "a", kind: "midpoint", ink: same }),
    frame({ scene: "b", kind: "midpoint", ink: same }),
    /* Frames from within one scene must not count as a repeat. */
    frame({ scene: "a", kind: "settled_read", ink: same }),
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, "repeated_layout");
  assert.match(findings[0].message, /"a" and "b"/);
});

test("scenes that place content differently are not called repetitive", () => {
  const inkAt = (f) => rowInk(grayWithInkAt(f)).map((v) => Number(v.toFixed(3)));
  const findings = detectRepeatedLayouts([
    frame({ scene: "a", kind: "midpoint", ink: inkAt(0.25) }),
    frame({ scene: "b", kind: "midpoint", ink: inkAt(0.6) }),
  ]);
  assert.equal(findings.length, 0);
});

test("the layout signature reads bands of content, not overall brightness", () => {
  const sig = (f) =>
    layoutSignature(frame({ ink: rowInk(grayWithInkAt(f)).map((v) => Number(v.toFixed(3))) }));
  assert.equal(hamming(sig(0.3), sig(0.3)), 0);
  assert.ok(hamming(sig(0.2), sig(0.85)) >= 2, "bands far apart must differ");
});

/* ------------------------------------------------------------------ sampling */

test("frame sampling covers the thumbnail, every cut, and the last frame", () => {
  const graph = {
    scenes: [
      { id: "a", duration: 4, reading: [{ text: "one" }] },
      { id: "b", duration: 4, reading: [{ text: "two" }] },
    ],
    seams: [{ from: "a", to: "b", at: 4, vector: { axis: "x", direction: "left" } }],
  };
  const kinds = new Set(chooseTimes(graph, { duration: 8 }).map((t) => t.kind));
  for (const required of ["frame_zero", "midpoint", "settled_read", "pre_cut", "at_cut", "post_cut", "final"]) {
    assert.ok(kinds.has(required), `sampling missed ${required}`);
  }
});

/* ------------------------------------------------------------------ sameness */

test("every visual world is a genuinely different look", () => {
  const worlds = loadWorlds();
  assert.ok(worlds.length >= 3, "a catalogue needs enough worlds to choose between");
  assertDistinct(worlds);
  const signatures = new Set(worlds.map(worldSignature));
  assert.equal(signatures.size, worlds.length, "two worlds share a camera/depth/transition triple");
});

test("two worlds with the same triple are rejected", () => {
  const twin = (id) => ({
    id,
    camera_model: "locked",
    depth_levels: 1,
    transition_families: ["cut", "mask"],
  });
  assert.throws(() => assertDistinct([twin("a"), twin("b")]), /same look under different names/);
});

test("scenes rotate through layouts instead of repeating one", () => {
  const world = loadWorlds().find((w) => w.layouts.length >= 3);
  const scenes = [
    { id: "a", role: "Hook" },
    { id: "b", role: "Product_Intro" },
    { id: "c", role: "Key_Feature" },
    { id: "d", role: "Brand_Outro" },
  ];
  const assigned = assignLayouts(world, scenes);
  for (let i = 1; i < assigned.length; i++) {
    assert.notEqual(
      assigned[i].layout.id,
      assigned[i - 1].layout.id,
      "consecutive scenes must not be composed identically",
    );
  }
});

test("cut-the-curve is a slide, not a zoom", () => {
  assert.equal(familyOf("cut-the-curve LEFT"), "slide");
  assert.equal(familyOf("zoom-through"), "zoom");
  assert.equal(familyOf("inverse zoom-through"), "zoom");
  assert.equal(familyOf(undefined), "cut");
});

test("a film that spends one move on every cut is refused", () => {
  const world = loadWorlds()[0];
  const graph = {
    objects: [],
    scenes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    seams: [
      { from: "a", to: "b", technique: "cut-the-curve LEFT" },
      { from: "b", to: "c", technique: "cut-the-curve LEFT" },
    ],
  };
  const result = checkSameness(fingerprint({ graph, world }), []);
  assert.equal(result.ok, false);
  assert.equal(result.violations[0].code, "one_note_transitions");
});

test("varying the cuts satisfies the gate", () => {
  const world = loadWorlds()[0];
  const graph = {
    objects: [],
    scenes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    seams: [
      { from: "a", to: "b", technique: "cut-the-curve LEFT" },
      { from: "b", to: "c", technique: "zoom-through" },
    ],
  };
  assert.equal(checkSameness(fingerprint({ graph, world }), []).ok, true);
});

test("the same construction twice is caught by similarity", () => {
  const world = loadWorlds()[0];
  const graph = {
    objects: [{ id: "o", kind: "text", importance: 3 }],
    scenes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    seams: [
      { from: "a", to: "b", technique: "cut-the-curve LEFT" },
      { from: "b", to: "c", technique: "zoom-through" },
    ],
  };
  const fp = fingerprint({ graph, world });
  assert.equal(similarity(fp, fp), 1);

  const repeat = checkSameness(fp, [fp]);
  assert.equal(repeat.ok, false);
  assert.equal(repeat.violations[0].code, "too_similar");

  /* A different world changes camera, depth, typography and layouts at once,
     which is what makes it a different video rather than a reskin. */
  const other = loadWorlds().find((w) => w.id !== world.id);
  const fresh = checkSameness(fingerprint({ graph, world: other }), [fp]);
  assert.ok(
    !fresh.violations.some((v) => v.code === "too_similar"),
    `a different world should not read as a repeat (nearest ${fresh.nearest?.score})`,
  );
});
