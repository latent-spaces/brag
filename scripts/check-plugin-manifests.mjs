#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANIFESTS = ["plugin.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json"];

export function manifestMismatches(manifests) {
  const problems = [];
  const [first, ...rest] = manifests;
  if (!first) return ["No manifests to compare."];
  for (const key of ["name", "version", "license"]) {
    if (!first.data[key]) problems.push(`${first.file} is missing ${key}`);
  }
  for (const item of rest) {
    for (const key of ["name", "version", "license"]) {
      if (item.data[key] !== first.data[key]) {
        problems.push(`${item.file} ${key} is ${JSON.stringify(item.data[key])}, ${first.file} has ${JSON.stringify(first.data[key])}`);
      }
    }
  }
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const manifests = [];
  for (const file of MANIFESTS) {
    manifests.push({ file, data: JSON.parse(await readFile(path.join(root, file), "utf8")) });
  }
  const problems = manifestMismatches(manifests);
  if (problems.length > 0) {
    console.error("Plugin manifest check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  const { name, version } = manifests[0].data;
  console.log(`Plugin manifest check passed: ${name} ${version} in ${manifests.length} files.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
