import assert from "node:assert/strict";
import test from "node:test";
import { examplePageProblems } from "./check-examples.mjs";

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horse Tinder</title>
  <meta name="description" content="Dating, for horses.">
</head>
</html>
`;

test("accepts a page a stranger can identify", () => {
  assert.deepEqual(examplePageProblems(page, { cssExists: true }), []);
});

test("requires a description and a stylesheet", () => {
  const bare = page.replace(/\n\s*<meta name="description"[^>]*>/, "");
  assert.deepEqual(examplePageProblems(bare, { cssExists: false }), [
    "missing meta description",
    "missing styles.css",
  ]);
});
