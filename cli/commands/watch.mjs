/**
 * brag watch — turn a render into something a reviewer can actually look at.
 *
 * No skill exists for watching a video, so this builds the artifact one would
 * need: stills at the moments the video was designed around, a contact sheet,
 * and a measurement per frame. A reviewer — human or agent — reads those.
 *
 * `--deep` would additionally send the file for scene-by-scene analysis, which
 * is opt-in on purpose: it uploads the render to a third party, takes minutes,
 * and is the wrong default for a loop that runs on every revision.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildBundle } from "../lib/watch/bundle.mjs";
import { resolveProject } from "../lib/state.mjs";
import { EXIT, ensureDir, envError, gateError, report, say, writeJson } from "../lib/util.mjs";

export async function run({ flags, args }) {
  const project = resolveProject(flags);
  project.load();
  const graph = project.read("scene_graph.json");

  const video = resolveVideo({ project, flags, args });
  const duration = probeDuration(video);

  const variant = path.basename(video, path.extname(video));
  const outDir = ensureDir(project.path("reviews", variant));

  say(`Watching ${path.relative(project.targetRoot, video)} (${duration}s)…`);

  const { frames, contactSheet } = buildBundle({ video, graph, duration, outDir });

  const bundle = {
    schema: "brag.watch_bundle/1",
    video: path.relative(project.dir, video).split(path.sep).join("/"),
    duration,
    frame_count: frames.length,
    contact_sheet: contactSheet
      ? path.relative(project.dir, contactSheet).split(path.sep).join("/")
      : null,
    audio: probeAudio(video),
    frames,
    watched_at: new Date().toISOString(),
  };
  writeJson(path.join(outDir, "watch.json"), bundle);

  if (flags.deep) {
    say(
      "--deep would upload this render for third-party scene analysis; that path is " +
        "declared but not wired, so nothing left the machine.",
    );
  }

  report(
    { ok: true, ...bundle, frames: frames.length },
    [
      `Watched ${frames.length} frames across ${duration}s.`,
      contactSheet ? `  ${path.relative(project.targetRoot, contactSheet)}` : "  (no contact sheet)",
      `  ${path.relative(project.targetRoot, path.join(outDir, "watch.json"))}`,
      "",
      "Next: brag review",
    ],
  );
  return EXIT.OK;
}

/* ------------------------------------------------------------------ helpers */

export function resolveVideo({ project, flags, args = [], variant = null }) {
  /* A named variant means that variant's delivered file, not whatever the
     manifest happens to point at. */
  if (variant) {
    const named = project.path("delivery", `${variant}.mp4`);
    if (fs.existsSync(named)) return named;
  }
  const explicit = args[0] ?? flags.video;
  if (explicit) {
    const p = path.isAbsolute(explicit) ? explicit : path.join(project.targetRoot, explicit);
    if (!fs.existsSync(p)) throw gateError(`no such video: ${p}`);
    return p;
  }

  const manifest = project.read("delivery/manifest.json", { optional: true });
  if (manifest?.video) {
    const p = path.join(project.dir, manifest.video);
    if (fs.existsSync(p)) return p;
  }

  const renders = project.path("renders");
  const candidates = fs.existsSync(renders)
    ? fs.readdirSync(renders).filter((f) => f.endsWith(".mp4")).sort()
    : [];
  if (!candidates.length) {
    throw gateError("no render to watch. Run `brag deliver` first, or pass a path.");
  }
  return path.join(renders, candidates[0]);
}

export function probeDuration(video) {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
    { encoding: "utf8", timeout: 60_000 },
  );
  if (res.error?.code === "ENOENT") throw envError("ffprobe is not on PATH");
  const d = Number(String(res.stdout).trim());
  if (!Number.isFinite(d) || d <= 0) throw gateError(`could not read a duration from ${video}`);
  return Number(d.toFixed(3));
}

function probeAudio(video) {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "csv=p=0", video],
    { encoding: "utf8", timeout: 60_000 },
  );
  const codec = String(res.stdout).trim().split(/\r?\n/)[0];
  return codec ? { present: true, codec } : { present: false, codec: null };
}
