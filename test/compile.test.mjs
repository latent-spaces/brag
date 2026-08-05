/**
 * Phase 1 gate, minus the browser.
 *
 * The two slow gates — `hyperframes check` and the seam gate — run in
 * `brag compose` against a real Chrome. These cover what can be proven without
 * one, including the two bugs that a render caught rather than a test:
 * reading lines scheduling out of order, and non-deterministic compiles.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildLedger,
  buildMotionJson,
  buildStoryboard,
  readingFloor,
  scheduleReading,
  tightScenes,
  totalDuration,
  withStarts,
} from "../cli/lib/compile/targets.mjs";
import { buildIndexHtml } from "../cli/lib/compile/composition.mjs";
import { loadWorlds } from "../cli/lib/worlds.mjs";
import { normalizeForCompare } from "../cli/lib/determinism.mjs";
import { validate } from "../cli/lib/schema.mjs";

const model = {
  name: "Tapedeck",
  one_line: "Records what your terminal printed.",
  surface_type: "cli",
  problem: "A recorded demo drifts.",
  mechanism: "It captures the byte stream.",
  proof: [{ id: "byte_identical", claim: "frames replay byte-identical", strength: "measured", evidence: [{ file: "README.md" }] }],
  visual_surfaces: [{ id: "terminal", kind: "terminal", description: "the session" }],
  forbidden_claims: [],
  verbatim_copy: [],
  identity: {},
};

const positioning = {
  audience: { who: "developers who publish demos", destination: ["x"] },
  angle: "A hand-recorded demo is already out of date.",
  claims: [{ text: "frames replay byte-identical", proof_ref: "byte_identical" }],
  action: "npm i -g tapedeck",
};

const graph = {
  schema: "brag.scene_graph/1",
  format: { width: 1920, height: 1080, fps: 30 },
  objects: [{ id: "line", kind: "text", importance: 4 }],
  scenes: [
    {
      id: "hook",
      role: "Hook",
      purpose: "Show the drift.",
      duration: 4.5,
      reading: [{ text: "A recorded demo drifts from what the tool really prints." }],
    },
    {
      id: "mechanism",
      role: "Product_Intro",
      purpose: "Show the capture.",
      duration: 5.5,
      /* A short command followed by a long sentence: the exact shape that
         used to invert, because the longer line has the longer floor. */
      reading: [
        { text: 'tapedeck record "npm test"' },
        { text: "It captures the byte stream and replays it as data." },
      ],
      required_proof: ["byte_identical"],
    },
  ],
  seams: [
    { from: "hook", to: "mechanism", at: 4.5, technique: "cut-the-curve LEFT", vector: { axis: "x", direction: "left" } },
  ],
};

test("reading floor scales with word count and never drops below a readable minimum", () => {
  assert.equal(readingFloor("Ship"), 0.8);
  assert.equal(readingFloor("one two three"), 0.8);
  assert.ok(readingFloor("a line of exactly seven words here") >= 1.8);
});

test("reading lines schedule in source order, however long each one is", () => {
  const scene = { ...graph.scenes[1], start: 4.5 };
  const lines = scheduleReading(scene);
  assert.equal(lines.length, 2);
  assert.ok(
    lines[0].settled < lines[1].settled,
    `line 0 settles at ${lines[0].settled}, line 1 at ${lines[1].settled} — order inverted`,
  );
  assert.ok(lines[0].enter >= scene.start, "a line cannot enter before its scene");
});

test("the last line still gets its full reading floor", () => {
  const scene = { ...graph.scenes[1], start: 4.5 };
  const lines = scheduleReading(scene);
  const last = lines.at(-1);
  const end = scene.start + scene.duration;
  assert.ok(
    end - last.settled >= last.floor - 0.01,
    `last line settles at ${last.settled} with ${(end - last.settled).toFixed(2)}s left, needs ${last.floor}s`,
  );
});

test("a scene too short for its copy is reported rather than silently reordered", () => {
  const cramped = {
    ...graph,
    scenes: [
      graph.scenes[0],
      { ...graph.scenes[1], duration: 1.0 },
    ],
  };
  const tight = tightScenes(cramped);
  assert.equal(tight.length, 1);
  assert.equal(tight[0].scene.id, "mechanism");
});

test("scene starts accumulate and total duration follows", () => {
  const scenes = withStarts(graph);
  assert.equal(scenes[0].start, 0);
  assert.equal(scenes[1].start, 4.5);
  assert.equal(totalDuration(graph), 10);
});

test("the ledger names one row per seam with matching exit and entry vectors", () => {
  const ledger = buildLedger({ graph });
  assert.equal(ledger.fps, 30);
  assert.equal(ledger.seams.length, 1);
  const [row] = ledger.seams;
  assert.equal(row.exit.selector, "#el-hook");
  assert.equal(row.entry.selector, "#el-mechanism");
  assert.equal(row.exit.axis, row.entry.axis);
  assert.equal(row.exit.dir, row.entry.dir, "a mirrored vector is the seam bug the gate exists to catch");
});

test("motion assertions never contradict the seam technique", () => {
  const motion = buildMotionJson({ graph });

  /* staysInFrame has no time window, so in a film whose scenes travel on exit
     it fails on every non-final scene by design — on the wrapper and on the
     text alike. Layer 2 answers the real question from rendered pixels. */
  assert.equal(
    motion.assertions.filter((a) => a.kind === "staysInFrame").length,
    0,
    "staysInFrame cannot coexist with scenes that travel on exit",
  );

  const moving = motion.assertions.filter((a) => a.kind === "keepsMoving");
  assert.equal(moving.length, 1, "one frozen-shot check for the film, not one per scene");
  assert.equal(moving[0].withinSelector, "#root");
});

test("every reading line gets an appearsBy assertion at its settled time", () => {
  const motion = buildMotionJson({ graph });
  const appears = motion.assertions.filter((a) => a.kind === "appearsBy" && a.selector.startsWith("#read-"));
  assert.equal(appears.length, 3);
  const mech = appears.filter((a) => a.selector.startsWith("#read-mechanism-"));
  assert.ok(mech[0].bySec < mech[1].bySec, "assertions must follow the same order as the composition");
});

test("the storyboard carries brag's payload under keys the parser preserves", () => {
  const md = buildStoryboard({ graph, positioning, model });
  assert.match(md, /^## Frame 1 — /m);
  assert.match(md, /- brag_scene_id: hook/);
  assert.match(md, /- brag_proof: byte_identical/);
  assert.match(md, /- duration: 4.5s/);
  assert.match(md, /format: 1920x1080/);
});

test("compiling the same graph twice produces identical output", () => {
  const world = loadWorlds()[0];
  assert.equal(buildIndexHtml({ model, graph, world }), buildIndexHtml({ model, graph, world }));
});

test("a different world composes the same graph differently", () => {
  const [a, b] = loadWorlds();
  assert.notEqual(
    buildIndexHtml({ model, graph, world: a }),
    buildIndexHtml({ model, graph, world: b }),
    "a world that does not change the frame is a name, not a look",
  );
});

test("determinism comparison ignores the identity attributes HyperFrames injects", () => {
  const authored = '<div id="root" class="a">x</div>';
  const opened = '<div data-hf-id="hf-9zzz" id="root" class="a">x</div>';
  assert.equal(
    normalizeForCompare("index.html", authored),
    normalizeForCompare("index.html", opened),
  );
});

test("the schema validator reports the path and the reason, not just a failure", () => {
  const schema = {
    type: "object",
    required: ["id", "count"],
    properties: { id: { type: "string", minLength: 2 }, count: { type: "integer", minimum: 1 } },
  };
  const { ok, errors } = validate(schema, { id: "a", count: 0 });
  assert.equal(ok, false);
  assert.equal(errors.length, 2);
  assert.match(errors[0].message, /at least 2 characters/);
  assert.equal(errors[1].path, "count");
});
