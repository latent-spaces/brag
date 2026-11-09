#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function galleryVideos(html) {
  const videos = [];
  for (const match of html.matchAll(/<video\b[\s\S]*?<\/video>/g)) {
    const tag = match[0];
    if (!/\bbrag-video\b/.test(tag)) continue;
    videos.push({
      src: tag.match(/\bsrc=["']([^"']+)["']/)?.[1] ?? "",
      label: tag.match(/\baria-label=["']([^"']+)["']/)?.[1] ?? "",
    });
  }
  return videos;
}

export function galleryProblems(videos) {
  const problems = [];
  if (videos.length === 0) problems.push("No gallery videos with class brag-video.");
  const seen = new Set();
  for (const video of videos) {
    if (!video.label) {
      problems.push(`Gallery video ${video.src || "(unknown)"} is missing an aria-label.`);
      continue;
    }
    if (seen.has(video.label)) problems.push(`Duplicate gallery aria-label: ${video.label}`);
    seen.add(video.label);
  }
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const html = await readFile(path.join(root, "docs/index.html"), "utf8");
  const problems = galleryProblems(galleryVideos(html));
  if (problems.length > 0) {
    console.error("Gallery check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Gallery check passed: ${galleryVideos(html).length} uniquely named videos.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
