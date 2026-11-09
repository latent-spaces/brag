#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function collect(dir, extension, prefix = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await collect(path.join(dir, entry.name), extension, rel)));
    else if (entry.name.endsWith(extension)) found.push(rel);
  }
  return found;
}

export function sfxInventoryProblems({ oggPaths, wavPaths, analysis }) {
  const problems = [];
  const listed = (analysis.files || []).map((file) => file.path);
  if (listed.length !== analysis.fileCount) {
    problems.push(`fileCount is ${analysis.fileCount} but files lists ${listed.length}`);
  }
  const ogg = new Set(oggPaths);
  const listedSet = new Set(listed);
  if (listedSet.size !== listed.length) problems.push("files contains duplicate paths");
  for (const file of ogg) {
    if (!listedSet.has(file)) problems.push(`ogg missing from analysis: ${file}`);
  }
  for (const file of listedSet) {
    if (!ogg.has(file)) problems.push(`analysis lists a file that is not on disk: ${file}`);
  }

  const recommended = [];
  for (const item of analysis.recommendations || []) recommended.push(item.path);
  for (const group of Object.values(analysis.recommendationsByUse || {})) {
    for (const item of group || []) recommended.push(item.path);
  }
  for (const file of new Set(recommended)) {
    if (!ogg.has(file)) problems.push(`recommendation is not on disk: ${file}`);
  }

  for (let i = 1; i <= 32; i += 1) {
    const name = `keyboard/keypress-${String(i).padStart(3, "0")}.wav`;
    if (!wavPaths.includes(name)) problems.push(`missing ${name}`);
  }
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const sfxDir = path.join(root, "skills/brag/assets/sfx");
  const analysis = JSON.parse(await readFile(path.join(sfxDir, "sfx-analysis.json"), "utf8"));
  const oggPaths = await collect(sfxDir, ".ogg");
  const wavPaths = await collect(sfxDir, ".wav");
  const problems = sfxInventoryProblems({ oggPaths, wavPaths, analysis });
  if (problems.length > 0) {
    console.error("SFX inventory check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`SFX inventory check passed: ${oggPaths.length} ogg files and ${wavPaths.length} wav files.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
