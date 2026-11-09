#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function musicCueProblems({ filename, data, markdown }) {
  const problems = [];
  const label = filename;
  if (!data) return [`${label}: missing cue JSON`];
  const stem = filename.replace(/\.mp3$/i, "");
  if (data.source?.filename !== filename) problems.push(`${label}: source.filename is ${data.source?.filename}`);
  if (data.source?.trackStem !== stem) problems.push(`${label}: trackStem is ${data.source?.trackStem}`);
  if (!(Number(data.duration) > 0)) problems.push(`${label}: duration must be > 0`);
  if (!(Number(data.tempo) > 0)) problems.push(`${label}: tempo must be > 0`);
  if (!Array.isArray(data.beats) || data.beats.length === 0) {
    problems.push(`${label}: beats must be a non-empty array`);
  } else {
    for (let i = 1; i < data.beats.length; i += 1) {
      if (!(data.beats[i].time > data.beats[i - 1].time)) {
        problems.push(`${label}: beat times must increase`);
        break;
      }
    }
  }
  if (!Array.isArray(data.strongCues) || data.strongCues.length > 64) {
    problems.push(`${label}: strongCues must contain at most 64 cues`);
  }
  if (!markdown || !markdown.includes(filename)) problems.push(`${label}: cue markdown does not name the track`);
  return problems;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const musicDir = path.join(root, "skills/brag/assets/music");
  const tracks = (await readdir(musicDir)).filter((name) => name.endsWith(".mp3")).sort();
  const problems = [];
  for (const filename of tracks) {
    const stem = filename.replace(/\.mp3$/i, "");
    const jsonPath = path.join(musicDir, "cues", `${stem}.music-cues.json`);
    const mdPath = path.join(musicDir, "cues", `${stem}.music-cues.md`);
    let data = null;
    let markdown = "";
    try {
      data = JSON.parse(await readFile(jsonPath, "utf8"));
    } catch {
      data = null;
    }
    try {
      markdown = await readFile(mdPath, "utf8");
    } catch {
      markdown = "";
    }
    problems.push(...musicCueProblems({ filename, data, markdown }));
  }
  if (tracks.length === 0) problems.push("No bundled mp3 tracks found.");
  if (problems.length > 0) {
    console.error("Music cue check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Music cue check passed: ${tracks.length} tracks.`);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();
