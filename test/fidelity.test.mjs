/**
 * Layer 4: every string on screen resolves to a source, or the review fails.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFidelity, extractRenderedText } from "../cli/lib/detect/fidelity.mjs";

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
