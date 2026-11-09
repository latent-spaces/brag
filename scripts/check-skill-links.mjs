#!/usr/bin/env node

// Discovery symlinks have to stay symlinks. Git on Windows rewrites them into
// text files unless .gitattributes marks them -text.

import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL_LINKS = [
  [".agents/skills/brag", "../../skills/brag"],
  [".agents/skills/brag-slim", "../../skills/brag-slim"],
  [".claude/skills/brag", "../../skills/brag"],
  [".claude/skills/brag-slim", "../../skills/brag-slim"],
  [".opencode/skills/brag", "../../skills/brag"],
  [".opencode/skills/brag-slim", "../../skills/brag-slim"],
];

export function unmarkedLinkPaths(gitattributes, links = SKILL_LINKS) {
  const marked = new Set();
  for (const line of gitattributes.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.endsWith("-text")) continue;
    marked.add(trimmed.slice(0, -"-text".length).trim());
  }
  return links.map(([linkPath]) => linkPath).filter((linkPath) => !marked.has(linkPath));
}

export async function skillLinkProblems(root) {
  const problems = [];
  const attributes = await readFile(path.join(root, ".gitattributes"), "utf8");
  for (const linkPath of unmarkedLinkPaths(attributes)) {
    problems.push(`${linkPath} is missing a -text line in .gitattributes`);
  }

  for (const [linkPath, expected] of SKILL_LINKS) {
    const absolute = path.join(root, linkPath);
    const info = await lstat(absolute).catch(() => null);
    if (!info?.isSymbolicLink()) {
      problems.push(`${linkPath} is not a symlink`);
      continue;
    }
    const target = await readlink(absolute);
    if (target !== expected) {
      problems.push(`${linkPath} points at ${target}, expected ${expected}`);
      continue;
    }
    const linked = await realpath(absolute);
    const wanted = await realpath(path.resolve(path.dirname(absolute), expected));
    if (linked !== wanted) problems.push(`${linkPath} does not resolve to ${expected}`);
  }
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const problems = await skillLinkProblems(root);
  if (problems.length > 0) {
    console.error("Skill link check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Skill link check passed: ${SKILL_LINKS.length} discovery symlinks.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
