/**
 * brag deliver — render, pick a poster, bake it as frame zero, write the manifest.
 *
 * The poster is not an afterthought. A bare .mp4 has no poster attribute, and
 * every platform that regenerates thumbnails server-side grabs frame 0 — so an
 * unhandled render advertises itself with whatever happens to be at t=0, which
 * on a well-made video is usually an empty background mid-fade. Brag picks the
 * strongest settled moment it can name and makes frame 0 *be* that frame.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { withStarts, readingFloor } from "../lib/compile/targets.mjs";
import { hyperframes } from "../lib/hyperframes.mjs";
import { resolveProject, Memory } from "../lib/state.mjs";
import {
  EXIT,
  ensureDir,
  envError,
  gateError,
  report,
  say,
  writeFileAtomic,
  writeJson,
} from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  const info = project.load();
  const model = project.read("product_model.json");
  const positioning = project.read("positioning.json");

  const index = project.read("compositions/index.json");
  /* Default to the most recently compiled variant. Taking the first key
     silently delivered an older composition while using the current graph to
     pick its poster — two different videos spliced into one claim. */
  const variant =
    flags.variant ??
    Object.entries(index.variants)
      .sort((a, b) => String(b[1].compiled_at ?? "").localeCompare(String(a[1].compiled_at ?? "")))
      .map(([name]) => name)[0];
  const entry = index.variants[variant];
  if (!entry) {
    throw gateError(
      `no compiled variant named "${variant}". Have: ${Object.keys(index.variants).join(", ") || "(none)"}`,
    );
  }

  const compDir = project.path("compositions", variant);
  /* The graph this variant was compiled from, not the project's current one. */
  const graph =
    project.read(`compositions/${variant}/scene_graph.json`, { optional: true }) ??
    project.read("scene_graph.json");
  const renderDir = ensureDir(project.path("renders"));
  const deliveryDir = ensureDir(project.path("delivery"));
  const mp4 = path.join(renderDir, `${variant}.mp4`);
  const jpg = path.join(deliveryDir, `${variant}.jpg`);
  const finalMp4 = path.join(deliveryDir, `${variant}.mp4`);

  /* ---------------------------------------------------------------- render */

  const quality = flags.draft ? "draft" : "high";
  say(`Rendering ${variant} at ${quality} quality…`);
  const render = hyperframes(["render", "--quality", quality, "--output", mp4], { cwd: compDir });
  if (render.status !== 0 || !fs.existsSync(mp4)) {
    throw gateError(`render failed:\n${tail(render.stderr || render.stdout)}`);
  }

  const probed = probe(mp4);
  if (!probed.duration) throw gateError(`rendered file has no readable duration: ${mp4}`);

  /* ---------------------------------------------------------------- poster */

  const poster = choosePoster(graph);
  say(`Poster: ${poster.why} at ${poster.at}s`);

  run_(["-v", "error", "-ss", String(poster.at), "-i", mp4, "-frames:v", "1", "-q:v", "2", jpg, "-y"]);
  if (!fs.existsSync(jpg)) throw gateError("ffmpeg produced no poster frame");

  /* Replace only frame 0's pixels; every other frame, the duration and the
     audio pass through untouched. At 30fps the poster shows for 1/30s. */
  const baked = `${finalMp4}.tmp.mp4`;
  run_([
    "-y", "-v", "error",
    "-i", mp4,
    "-i", jpg,
    "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",
    "-map", "[v]", "-map", "0:a?",
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-c:a", "copy", "-movflags", "+faststart",
    baked,
  ]);
  fs.renameSync(baked, finalMp4);

  const finalProbe = probe(finalMp4);
  if (Math.abs(finalProbe.duration - probed.duration) > 0.1) {
    throw gateError(
      `baking the poster changed the duration (${probed.duration}s → ${finalProbe.duration}s); refusing to deliver`,
    );
  }

  /* ---------------------------------------------------------------- copy + manifest */

  const shareCopy = buildShareCopy({ model, positioning });
  writeFileAtomic(path.join(deliveryDir, `${variant}.share-copy.txt`), shareCopy);

  const manifest = {
    schema: "brag.delivery/1",
    project: info.name,
    variant,
    format: entry.format,
    duration: finalProbe.duration,
    has_audio: finalProbe.hasAudio,
    bytes: fs.statSync(finalMp4).size,
    video: path.relative(project.dir, finalMp4).split(path.sep).join("/"),
    poster: path.relative(project.dir, jpg).split(path.sep).join("/"),
    poster_at: poster.at,
    poster_reason: poster.why,
    share_copy: `delivery/${variant}.share-copy.txt`,
    scenes: graph.scenes.map((s) => ({ id: s.id, purpose: s.purpose, proof: s.required_proof ?? [] })),
    claims: positioning.claims,
    delivered_at: new Date().toISOString(),
  };
  writeJson(path.join(deliveryDir, "manifest.json"), manifest);

  new Memory().appendVideo({
    id: `${info.name}:${variant}:${manifest.delivered_at}`,
    project: info.name,
    variant,
    delivered_at: manifest.delivered_at,
    fingerprint: project.read("fingerprint.json", { optional: true }),
  });

  report(
    { ok: true, ...manifest },
    [
      `Delivered ${variant}.`,
      `  ${path.relative(project.targetRoot, finalMp4)}  ${(manifest.bytes / 1e6).toFixed(1)} MB · ${manifest.duration}s${manifest.has_audio ? " · audio" : " · silent"}`,
      `  poster baked as frame 0 from ${poster.at}s (${poster.why})`,
      `  ${path.relative(project.targetRoot, path.join(deliveryDir, `${variant}.share-copy.txt`))}`,
    ],
  );
  return EXIT.OK;
}

/* ------------------------------------------------------------------ poster */

/**
 * Pick the strongest *settled* moment: a frame where the copy has finished
 * animating and has not begun to leave. Preference goes to the scene carrying
 * the most proof, because that is the frame worth being seen on its own.
 */
function choosePoster(graph) {
  const scenes = withStarts(graph);
  const scored = scenes
    .map((scene) => {
      const reading = scene.reading ?? [];
      const floor = Math.max(
        0.8,
        ...reading.map((r) => r.min_reading_s ?? readingFloor(r.text)),
      );
      const settleAt = Math.max(scene.start + 0.6, scene.start + scene.duration - floor + 0.15);
      const safe = Math.min(settleAt, scene.start + scene.duration - 0.25);
      return {
        at: Number(safe.toFixed(2)),
        score:
          (scene.required_proof?.length ?? 0) * 3 +
          reading.length +
          (scene.role === "Brand_Outro" ? 2 : 0),
        why: `${scene.id} settled${scene.required_proof?.length ? ` (shows ${scene.required_proof.join(", ")})` : ""}`,
      };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0] ?? { at: 0.5, why: "first settled frame" };
}

/* ------------------------------------------------------------------ share copy */

function buildShareCopy({ model, positioning }) {
  const lines = [positioning.angle];
  const strongest = positioning.claims.find((c) => c.verbatim) ?? positioning.claims[0];
  const proof = model.proof.find((p) => p.id === strongest?.proof_ref);
  if (proof && proof.strength === "measured") lines.push(proof.claim + ".");
  else if (model.one_line) lines.push(model.one_line);
  lines.push(positioning.action);
  return lines.filter(Boolean).join("\n") + "\n";
}

/* ------------------------------------------------------------------ ffmpeg */

function run_(args) {
  const res = spawnSync("ffmpeg", args, { encoding: "utf8", timeout: 600_000 });
  if (res.error?.code === "ENOENT") throw envError("ffmpeg is not on PATH");
  if (res.status !== 0) throw gateError(`ffmpeg failed:\n${tail(res.stderr)}`);
  return res;
}

function probe(file) {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-show_entries", "stream=codec_type", "-of", "json", file],
    { encoding: "utf8", timeout: 60_000 },
  );
  if (res.error?.code === "ENOENT") throw envError("ffprobe is not on PATH");
  try {
    const parsed = JSON.parse(res.stdout);
    return {
      duration: Number(Number(parsed.format?.duration ?? 0).toFixed(3)),
      hasAudio: (parsed.streams ?? []).some((s) => s.codec_type === "audio"),
    };
  } catch {
    return { duration: 0, hasAudio: false };
  }
}

const tail = (s, n = 25) =>
  String(s || "").trimEnd().split("\n").slice(-n).join("\n");
