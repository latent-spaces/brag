#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function classifyDocReference(docsDir, value) {
  if (!value || value.startsWith("#") || value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return { local: false };
  }
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean) return { local: true, ok: true };
  if (path.isAbsolute(clean)) return { local: true, ok: false, reason: `absolute path ${value}` };

  const root = path.resolve(docsDir);
  const target = path.resolve(root, clean);
  const inside = target === root || target.startsWith(root + path.sep);
  if (!inside) return { local: true, ok: false, reason: `leaves docs/: ${value}` };
  return { local: true, ok: true, target };
}

export function escapingReferences(docsDir, html) {
  const problems = [];
  for (const match of html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)) {
    const verdict = classifyDocReference(docsDir, match[1]);
    if (verdict.local && !verdict.ok) problems.push(verdict.reason);
  }
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const docsDir = path.join(root, "docs");
  const html = await readFile(path.join(docsDir, "index.html"), "utf8");
  const problems = escapingReferences(docsDir, html);
  if (problems.length > 0) {
    console.error("Docs path check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log("Docs path check passed: local references stay inside docs/.");
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
