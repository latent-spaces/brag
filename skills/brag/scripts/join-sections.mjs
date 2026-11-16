#!/usr/bin/env node
/**
 * join-sections.mjs — join long-form brag section renders into one film.
 *
 * Usage:
 *   node join-sections.mjs --dir <renders-dir> --out <file.mp4>
 *   node join-sections.mjs --out brag.mp4 01.mp4 02.mp4 03.mp4
 *
 * With --dir, every *.mp4 in the directory is used, sorted by filename — so
 * name them 01.mp4, 02.mp4, ... and the order takes care of itself.
 *
 * ffmpeg's concat demuxer with a video stream copy does not re-encode, which
 * is what keeps a joined film frame-exact and fast. Audio is the exception: a
 * stream copy keeps each section's AAC priming (~21ms), leaving a gap at every
 * join, so audio is decoded and re-encoded once. It also does not check that the
 * inputs match. Give it a section whose pixel format or sample rate differs
 * and it writes a file that plays wrong, stops early, or drops audio after
 * the first join — with no error. So this script probes every input first and
 * refuses to run until they all agree.
 *
 * Requires ffmpeg and ffprobe on PATH.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VIDEO_KEYS = ["codec_name", "width", "height", "pix_fmt", "r_frame_rate"];
const AUDIO_KEYS = ["codec_name", "sample_rate", "channels"];

function parseArgs(argv) {
  const out = { dir: null, out: null, files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") {
      out.dir = argv[++i];
    } else if (arg === "--out" || arg === "-o") {
      out.out = argv[++i];
    } else if (arg.startsWith("-")) {
      fail(`unknown option: ${arg}`);
    } else {
      out.files.push(arg);
    }
  }
  return out;
}

function fail(message) {
  console.error(`join-sections: ${message}`);
  process.exit(1);
}

function run(bin, args) {
  try {
    return execFileSync(bin, args, { encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") {
      fail(`${bin} not found on PATH. Install FFmpeg, or add it to PATH.`);
    }
    fail(`${bin} failed: ${error.stderr || error.message}`);
  }
  return "";
}

function probe(file) {
  const raw = run("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_streams",
    "-show_format",
    file,
  ]);
  const data = JSON.parse(raw);
  const video = data.streams.find((s) => s.codec_type === "video");
  const audio = data.streams.find((s) => s.codec_type === "audio");
  if (!video) fail(`${path.basename(file)} has no video stream.`);
  return {
    file,
    name: path.basename(file),
    video,
    audio,
    duration: Number(data.format.duration),
    frames: Number(video.nb_frames) || null,
  };
}

/** Compare every section against the first one. Report all mismatches at once. */
function assertParity(probes) {
  const [first, ...rest] = probes;
  const problems = [];

  for (const p of rest) {
    for (const key of VIDEO_KEYS) {
      if (p.video[key] !== first.video[key]) {
        problems.push(
          `${p.name}: video ${key} is ${p.video[key]}, ` +
          `${first.name} has ${first.video[key]}`
        );
      }
    }
    if (Boolean(p.audio) !== Boolean(first.audio)) {
      problems.push(
        `${p.name}: ${p.audio ? "has" : "has no"} audio, ` +
        `${first.name} ${first.audio ? "has" : "has none"}`
      );
      continue;
    }
    if (!p.audio) continue;
    for (const key of AUDIO_KEYS) {
      if (String(p.audio[key]) !== String(first.audio[key])) {
        problems.push(
          `${p.name}: audio ${key} is ${p.audio[key]}, ` +
          `${first.name} has ${first.audio[key]}`
        );
      }
    }
  }

  if (problems.length > 0) {
    console.error("join-sections: the sections do not match, so a stream copy");
    console.error("would produce a broken file. Fix and re-render:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("\nRender every section from the same composition settings:");
    console.error("same width, height, fps, and the same audio layout.");
    process.exit(1);
  }
}

function concatList(files) {
  // The concat demuxer reads single-quoted paths; escape any quote inside one.
  return files
    .map((f) => `file '${path.resolve(f).replace(/'/g, "'\\''")}'`)
    .join("\n") + "\n";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) fail("--out <file.mp4> is required.");

  let files = args.files;
  if (args.dir) {
    if (!fs.existsSync(args.dir)) fail(`no such directory: ${args.dir}`);
    files = fs
      .readdirSync(args.dir)
      .filter((f) => f.toLowerCase().endsWith(".mp4"))
      .filter((f) => path.resolve(args.dir, f) !== path.resolve(args.out))
      .sort()
      .map((f) => path.join(args.dir, f));
  }

  if (files.length < 2) {
    fail("need at least two section renders to join.");
  }
  for (const f of files) {
    if (!fs.existsSync(f)) fail(`no such file: ${f}`);
  }

  console.log(`Probing ${files.length} sections...`);
  const probes = files.map(probe);
  for (const p of probes) {
    const frames = p.frames === null ? "?" : p.frames;
    console.log(
      `  ${p.name}  ${p.video.width}x${p.video.height}  ` +
      `${p.video.r_frame_rate}fps  ${p.duration.toFixed(3)}s  ${frames} frames`
    );
  }

  assertParity(probes);
  console.log("All sections match. Joining (video stream copy, audio re-encoded once).");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brag-join-"));
  // fail() exits the process, so clean up on exit rather than after the call.
  process.on("exit", () => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const listPath = path.join(tmpDir, "sections.txt");
  fs.writeFileSync(listPath, concatList(files), "utf8");

  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c:v", "copy",
    // A stream copy keeps every section's AAC priming samples, which leaves
    // ~21ms of silence at each join. Decoding drops them; re-encode once.
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    args.out,
  ]);

  const joined = probe(args.out);
  const expected = probes.reduce((sum, p) => sum + p.duration, 0);
  const frames = joined.frames === null ? "?" : joined.frames;

  console.log(
    `\nWrote ${args.out}\n` +
    `  ${frames} frames, ${joined.duration.toFixed(3)}s ` +
    `(sections sum to ${expected.toFixed(3)}s)`
  );

  // A stream copy cannot change length. A gap here means a section was dropped.
  if (Math.abs(joined.duration - expected) > 0.1) {
    console.error(
      "\njoin-sections: the joined length does not match the sections. " +
      "Check every section played through to its end."
    );
    process.exit(1);
  }
}

main();
