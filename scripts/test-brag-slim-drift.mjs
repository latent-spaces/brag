import assert from "node:assert/strict";
import test from "node:test";
import { driftMessage, firstMismatch } from "./check-brag-slim.mjs";

test("identical copies have no mismatch", () => {
  assert.equal(firstMismatch("same\n", "same\n"), null);
});

test("reports the first line that drifted", () => {
  const mismatch = firstMismatch("one\ntwo\nthree\n", "one\nTWO\nthree\n");
  assert.equal(mismatch.line, 2);
  assert.match(driftMessage("skills/brag-slim/SKILL.md", "skills/brag/slim.md", mismatch), /line 2/);
});
