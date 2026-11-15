#!/usr/bin/env node

// /brag bundles a copy of /brag-slim (skills/brag/slim.md) so its model hand-off
// works no matter how /brag was installed. The two files must stay identical.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = "skills/brag-slim/SKILL.md";
const copy = "skills/brag/slim.md";

const [a, b] = await Promise.all([source, copy].map((p) => readFile(path.join(root, p), "utf8")));

if (a !== b) {
  console.error(`${copy} is out of sync with ${source}. Fix it with:\n  cp ${source} ${copy}`);
  process.exit(1);
}

console.log(`${copy} matches ${source}.`);
