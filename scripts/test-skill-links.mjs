import assert from "node:assert/strict";
import test from "node:test";
import { SKILL_LINKS, unmarkedLinkPaths } from "./check-skill-links.mjs";

test("flags brag-slim symlinks when only brag is marked", () => {
  const attributes = [
    ".agents/skills/brag -text",
    ".claude/skills/brag -text",
    ".opencode/skills/brag -text",
  ].join("\n");
  assert.deepEqual(unmarkedLinkPaths(attributes), [
    ".agents/skills/brag-slim",
    ".claude/skills/brag-slim",
    ".opencode/skills/brag-slim",
  ]);
});

test("accepts a complete attribute list", () => {
  const attributes = SKILL_LINKS.map(([linkPath]) => `${linkPath} -text`).join("\n");
  assert.deepEqual(unmarkedLinkPaths(attributes), []);
});
