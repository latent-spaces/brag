import assert from "node:assert/strict";
import test from "node:test";
import { classifyDocReference, escapingReferences } from "./check-doc-paths.mjs";

const docsDir = "/repo/docs";

test("keeps ordinary docs files", () => {
  assert.equal(classifyDocReference(docsDir, "styles.css").ok, true);
  assert.equal(classifyDocReference(docsDir, "examples/horse-tinder/brag.mp4?v=1").ok, true);
});

test("ignores off-site and in-page links", () => {
  assert.equal(classifyDocReference(docsDir, "https://letsbrag.app").local, false);
  assert.equal(classifyDocReference(docsDir, "#install").local, false);
  assert.equal(classifyDocReference(docsDir, "//cdn.example/a.js").local, false);
});

test("rejects paths that leave docs/", () => {
  assert.equal(classifyDocReference(docsDir, "../skills/brag/SKILL.md").ok, false);
  assert.equal(classifyDocReference(docsDir, "/etc/passwd").ok, false);
  const problems = escapingReferences(docsDir, '<a href="../README.md"></a><img src="assets/og.png">');
  assert.deepEqual(problems, ["leaves docs/: ../README.md"]);
});
