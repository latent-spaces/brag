import assert from "node:assert/strict";
import test from "node:test";
import { manifestMismatches } from "./check-plugin-manifests.mjs";

test("accepts matching manifests", () => {
  const data = { name: "brag", version: "0.5.0", license: "MIT" };
  assert.deepEqual(
    manifestMismatches([
      { file: "plugin.json", data },
      { file: ".codex-plugin/plugin.json", data },
    ]),
    [],
  );
});

test("names the file whose version drifted", () => {
  const problems = manifestMismatches([
    { file: "plugin.json", data: { name: "brag", version: "0.5.0", license: "MIT" } },
    { file: ".claude-plugin/plugin.json", data: { name: "brag", version: "0.4.0", license: "MIT" } },
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /\.claude-plugin\/plugin.json version/);
});
