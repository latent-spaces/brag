#!/usr/bin/env node

// /brag bundles a copy of /brag-slim (skills/brag/slim.md) so its Opus 5.5 hand-off
// works no matter how /brag was installed. The two files must stay identical.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SLIM_SOURCE = "skills/brag-slim/SKILL.md";
export const SLIM_COPY = "skills/brag/slim.md";

export function firstMismatch(left, right) {
  if (left === right) return null;
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const count = Math.max(leftLines.length, rightLines.length);
  for (let index = 0; index < count; index += 1) {
    if (leftLines[index] !== rightLines[index]) {
      return {
        line: index + 1,
        source: leftLines[index] ?? "",
        copy: rightLines[index] ?? "",
      };
    }
  }
  return { line: count, source: "", copy: "" };
}

export function driftMessage(source, copy, mismatch) {
  const clip = (line) => line.slice(0, 160);
  return [
    `${copy} is out of sync with ${source} at line ${mismatch.line}.`,
    `  ${source}: ${clip(mismatch.source)}`,
    `  ${copy}: ${clip(mismatch.copy)}`,
    `Fix it with:`,
    `  cp ${source} ${copy}`,
  ].join("\n");
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const [sourceText, copyText] = await Promise.all(
    [SLIM_SOURCE, SLIM_COPY].map((file) => readFile(path.join(root, file), "utf8")),
  );
  const mismatch = firstMismatch(sourceText, copyText);
  if (mismatch) {
    console.error(driftMessage(SLIM_SOURCE, SLIM_COPY, mismatch));
    process.exit(1);
  }
  console.log(`${SLIM_COPY} matches ${SLIM_SOURCE}.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
