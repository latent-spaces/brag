/**
 * Layer 4: every string on screen resolves to a source, or the review fails.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFidelity, extractRenderedText, extractRenderedTree } from "../cli/lib/detect/fidelity.mjs";

const model = {
  name: "Tapedeck",
  one_line: "Keeps the working context around your code.",
  verbatim_copy: [
    { id: "tagline", text: "Git keeps the history of your code." },
    { id: "cmd", text: "tapedeck log" },
  ],
  forbidden_claims: ["Tapedeck makes your AI smarter"],
  proof: [{ id: "recall", claim: "100% correct with the context injected, against 17% with none" }],
};
const positioning = { claims: [{ text: "log, diff, blame and restore", proof_ref: "git" }], angle: "An angle." };
const captureLines = ["C588   2026-05-30 21:00  Fix open GitHub roadmap issues"];

const render = (items) => checkFidelity({ rendered: items, model, positioning, captureLines });

test("a verbatim string resolves", () => {
  const r = render([{ kind: "copy", text: "Git keeps the history of your code.", id: "a" }]);
  assert.equal(r.findings.length, 0);
  assert.equal(r.resolved, 1);
});

test("a captured line resolves", () => {
  const r = render([{ kind: "terminal_output", text: captureLines[0], id: null }]);
  assert.equal(r.findings.length, 0);
});

test("a proof's own claim resolves", () => {
  const r = render([
    { kind: "copy", text: "100% correct with the context injected, against 17% with none", id: "b" },
  ]);
  assert.equal(r.findings.length, 0);
});

test("an invented line is caught", () => {
  const r = render([{ kind: "copy", text: "Three times faster than every alternative.", id: "c" }]);
  assert.equal(r.findings.length, 1);
  assert.equal(r.findings[0].code, "unsourced_copy");
  assert.equal(r.findings[0].scene, "c");
});

test("copy wrapped around a real source is flagged more gently", () => {
  const r = render([
    { kind: "copy", text: "As they say, Git keeps the history of your code, and that matters.", id: "d" },
  ]);
  assert.equal(r.findings[0].code, "paraphrased_source");
});

test("terminal content nothing printed is capture drift, not just unsourced", () => {
  const r = render([{ kind: "terminal_output", text: "$ rm -rf /", id: null }]);
  assert.equal(r.findings[0].code, "capture_drift");
});

test("a forbidden claim on screen is caught even where it resolves elsewhere", () => {
  const r = render([{ kind: "copy", text: "Tapedeck makes your AI smarter", id: "e" }]);
  const codes = r.findings.map((f) => f.code);
  assert.ok(codes.includes("forbidden_claim_rendered"));
});

test("kickers are structure, not claims, and are not checked", () => {
  const r = render([{ kind: "kicker", text: "KEY FEATURE", id: null }]);
  assert.equal(r.checked, 0);
  assert.equal(r.findings.length, 0);
});

test("extraction survives the attributes HyperFrames injects", () => {
  const html = `
    <p data-hf-id="hf-1" class="lead" id="read-a-0">Git keeps the history of your code.</p>
    <p class="line" id="read-a-1">A second line.</p>
    <p data-hf-id="hf-2" class="kicker">HOOK</p>
    <span class="tlabel">tapedeck log</span>
    <div data-hf-id="hf-3" class="trow" style="top:0"><span>C588</span><span> Fix issues</span></div>`;
  const items = extractRenderedText(html);
  assert.equal(items.length, 5);
  assert.equal(items[0].id, "read-a-0");
  assert.equal(items[0].kind, "copy");
  assert.equal(items[2].kind, "kicker");
  assert.equal(items.at(-1).text, "C588 Fix issues");
});

/* ------------------------------------------- frames as sub-compositions */

test("the whole tree is read, not just the index that mounts it", () => {
  const index = `<div id="root">
    <div id="el-hook" class="clip" data-composition-id="01-hook"
         data-composition-src="compositions/frames/01-hook.html"></div>
  </div>`;
  const frame = `<template><div id="root" data-composition-id="01-hook">
    <p id="read-hook-0" class="hook-lead">frames replay byte-identical</p>
    <span class="hook-tag">invented label</span>
  </div></template>`;

  /* Reading only the index found nothing at all and reported "0/0 resolve to
     a source", which prints as a pass — the worst way for a gate to fail. */
  assert.equal(extractRenderedText(index).length, 0);

  const tree = extractRenderedTree(index, (src) =>
    src === "compositions/frames/01-hook.html" ? frame : null,
  );
  assert.ok(tree.length >= 2, `expected the frame's copy, got ${tree.length}`);
  assert.ok(tree.some((t) => t.text === "frames replay byte-identical"));
  assert.ok(tree.some((t) => t.text === "invented label"));
});

test("a fragment of a sourced line is sourced; a wrapper around one is not", () => {
  const model = {
    verbatim_copy: [{ text: "Nobody told it. It already knew." }],
    proof: [],
    forbidden_claims: [],
  };

  /* A hero line revealed clause by clause arrives as separate elements. */
  const split = checkFidelity({
    rendered: [
      { kind: "copy", text: "Nobody told it.", id: null },
      { kind: "copy", text: "It already knew.", id: null },
    ],
    model,
  });
  assert.deepEqual(split.findings, []);
  assert.equal(split.resolved, 2);

  /* Showing MORE than the source is the case that can invent a claim. */
  const wrapped = checkFidelity({
    rendered: [{ kind: "copy", text: "Nobody told it. It already knew. Guaranteed.", id: null }],
    model,
  });
  assert.equal(wrapped.findings.length, 1);
  assert.equal(wrapped.findings[0].code, "paraphrased_source");
});

test("punctuation-only chrome is not a claim and is not counted", () => {
  const r = checkFidelity({
    rendered: [
      { kind: "copy", text: "$", id: "prompt" },
      { kind: "copy", text: "→", id: null },
    ],
    model: { verbatim_copy: [], proof: [], forbidden_claims: [] },
  });
  assert.deepEqual(r.findings, []);
  assert.equal(r.checked, 0, "a shell prompt is chrome, not copy to source");
});
