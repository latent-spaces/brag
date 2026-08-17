/**
 * The watch bundle: what a render looks like, at the moments that matter.
 *
 * Frames are sampled semantically rather than on a fixed interval. A grid of
 * evenly-spaced stills mostly catches transitions and mostly misses the frames
 * the video was built around; sampling from the timing plan catches the ones
 * that carry the meaning — each settled read, both sides of every cut, the
 * frame every platform will use as the thumbnail, and the last thing on screen.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { scheduleReading, withStarts } from "../compile/targets.mjs";
import fs from "node:fs";
import { ensureDir, envError, gateError } from "../util.mjs";
import { aHash, grabGray, isFlat, rowInk } from "./pixels.mjs";

/**
 * @returns {{at:number, kind:string, scene?:string, why:string}[]} sorted, deduped
 */
export function chooseTimes(graph, { duration }) {
  const scenes = withStarts(graph);
  const out = [];
  const add = (at, kind, why, scene) => {
    if (at < 0 || at > duration) return;
    out.push({ at: Number(at.toFixed(2)), kind, why, scene });
  };

  add(0, "frame_zero", "what every platform grabs as the thumbnail");

  for (const scene of scenes) {
    add(scene.start + scene.duration / 2, "midpoint", `middle of ${scene.id}`, scene.id);
    for (const line of scheduleReading(scene)) {
      /* Just past settle: the copy has arrived and has not started to leave. */
      add(line.settled + 0.12, "settled_read", `"${truncate(line.text)}" settled`, scene.id);
    }
  }

  for (const seam of graph.seams ?? []) {
    add(seam.at - 0.08, "pre_cut", `just before ${seam.from}→${seam.to}`, seam.from);
    add(seam.at + 0.02, "at_cut", `on the cut ${seam.from}→${seam.to}`, seam.to);
    add(seam.at + 0.25, "post_cut", `just after ${seam.from}→${seam.to}`, seam.to);
  }

  add(duration - 0.1, "final", "the last thing on screen");

  const seen = new Set();
  return out
    .sort((a, b) => a.at - b.at)
    .filter((f) => {
      const key = f.at.toFixed(2);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Extract stills and their measurements.
 *
 * @returns {{frames: object[], contactSheet: string|null}}
 */
export function buildBundle({ video, graph, duration, outDir, sheet = true }) {
  const dir = ensureDir(path.join(outDir, "frames"));
  const times = chooseTimes(graph, { duration });
  const frames = [];

  /* Numbered sequentially so the contact sheet can read them as an image
     sequence. Glob input is not reliable across ffmpeg builds on Windows, and
     a sheet that silently fails to build is a review surface nobody sees. The
     semantic name of each frame lives in watch.json instead of the filename. */
  times.forEach((t, i) => {
    const name = `${String(i + 1).padStart(3, "0")}.jpg`;
    const file = path.join(dir, name);
    const res = spawnSync(
      "ffmpeg",
      ["-v", "error", "-ss", String(t.at), "-i", video, "-frames:v", "1", "-q:v", "3", file, "-y"],
      { encoding: "utf8", timeout: 120_000 },
    );
    if (res.error?.code === "ENOENT") throw envError("ffmpeg is not on PATH");
    if (res.status !== 0) throw gateError(`could not extract ${t.at}s: ${res.stderr?.trim()}`);

    const gray = grabGray(video, t.at);
    frames.push({
      ...t,
      file: path.relative(outDir, file).split(path.sep).join("/"),
      hash: aHash(gray).toString(16),
      ink: rowInk(gray).map((v) => Number(v.toFixed(3))),
      tone: isFlat(gray),
    });
  });

  let contactSheet = null;
  if (sheet && frames.length) {
    const target = path.join(outDir, "contact-sheet.jpg");
    const cols = Math.min(4, frames.length);
    const rows = Math.ceil(frames.length / cols);
    const res = spawnSync(
      "ffmpeg",
      [
        "-v", "error", "-y",
        "-i", path.join(dir, "%03d.jpg"),
        "-vf", `scale=480:-1,tile=${cols}x${rows}:padding=8:margin=8:color=0x111318`,
        "-frames:v", "1",
        target,
      ],
      { encoding: "utf8", timeout: 180_000 },
    );
    if (res.status === 0 && fs.existsSync(target)) contactSheet = target;
    else if (res.status !== 0) throw gateError(`contact sheet failed: ${String(res.stderr).trim()}`);
  }

  return { frames, contactSheet };
}

const truncate = (s, n = 42) => (String(s).length > n ? `${String(s).slice(0, n)}…` : String(s));
