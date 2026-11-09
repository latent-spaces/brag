import assert from "node:assert/strict";
import test from "node:test";
import { sfxInventoryProblems } from "./check-sfx-inventory.mjs";

const wavs = Array.from({ length: 32 }, (_, i) => `keyboard/keypress-${String(i + 1).padStart(3, "0")}.wav`);

test("accepts an inventory that matches the disk", () => {
  const problems = sfxInventoryProblems({
    oggPaths: ["ui/click1.ogg"],
    wavPaths: wavs,
    analysis: {
      fileCount: 1,
      files: [{ path: "ui/click1.ogg" }],
      recommendations: [{ path: "ui/click1.ogg" }],
      recommendationsByUse: { tap: [{ path: "ui/click1.ogg" }] },
    },
  });
  assert.deepEqual(problems, []);
});

test("reports an ogg the analysis forgot", () => {
  const problems = sfxInventoryProblems({
    oggPaths: ["ui/click1.ogg", "ui/click2.ogg"],
    wavPaths: wavs,
    analysis: { fileCount: 1, files: [{ path: "ui/click1.ogg" }], recommendations: [], recommendationsByUse: {} },
  });
  assert.ok(problems.some((problem) => problem.includes("ui/click2.ogg")));
});
