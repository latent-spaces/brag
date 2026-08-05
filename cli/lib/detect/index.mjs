/**
 * Layer 2 detectors: what a person would notice looking at the frames.
 *
 * Each returns findings shaped `{code, scene, at, message, fix}`. They are
 * deliberately conservative — a review that cries wolf gets switched off, and
 * a switched-off review is worse than none.
 */

import { hamming } from "../watch/pixels.mjs";

/** Where the caption band starts, as a fraction of frame height. */
const CAPTION_ZONE = 0.83;

/**
 * Moments where something is supposed to be on screen and composed.
 *
 * Frames sampled on and just after a cut are mid-transition by construction:
 * the outgoing scene has left and the incoming one has not arrived. Judging
 * those as black frames or as content in the wrong place reports the technique
 * as the defect, and a detector that flags every cut is one nobody reads.
 */
const COMPOSED = new Set(["frame_zero", "midpoint", "settled_read", "final"]);

/**
 * A frame with no tonal range: black, white, or a fade caught mid-dip.
 * Frame zero is judged hardest, because it is the thumbnail.
 */
export function detectFlatFrames(frames) {
  const out = [];
  for (const f of frames) {
    if (!f.tone.flat) continue;
    if (!COMPOSED.has(f.kind)) continue;
    /* The final frame is allowed to rest on a clean ground. */
    if (f.kind === "final") continue;
    out.push({
      code: f.tone.dark ? "black_frame" : "flat_frame",
      scene: f.scene ?? null,
      at: f.at,
      message:
        f.kind === "frame_zero"
          ? `frame zero is ${f.tone.dark ? "black" : "flat"} (tonal range ${f.tone.stdDev}) — that is the thumbnail every platform will show`
          : `${f.at}s is ${f.tone.dark ? "black" : "flat"} (tonal range ${f.tone.stdDev})${f.scene ? ` in "${f.scene}"` : ""}`,
      fix:
        f.kind === "frame_zero"
          ? "bake a settled frame as frame zero"
          : "move the cut, or give the moment something to show",
    });
  }
  return out;
}

/**
 * Content sitting in the caption band, where a platform's own subtitles land.
 * Measured from ink rather than DOM boxes, so it catches whatever is actually
 * visible there.
 */
export function detectCaptionZone(frames, { zone = CAPTION_ZONE, minInk = 0.35 } = {}) {
  const out = [];
  for (const f of frames) {
    if (!f.ink?.length) continue;
    if (!COMPOSED.has(f.kind)) continue;
    const firstRow = Math.floor(f.ink.length * zone);
    const band = f.ink.slice(firstRow);
    const worst = Math.max(0, ...band);
    if (worst < minInk) continue;
    const row = firstRow + band.indexOf(worst);
    out.push({
      code: "caption_zone_collision",
      scene: f.scene ?? null,
      at: f.at,
      message:
        `content sits in the caption band at ${f.at}s${f.scene ? ` in "${f.scene}"` : ""} ` +
        `(ink ${worst.toFixed(2)} at ${(row / f.ink.length * 100).toFixed(0)}% down the frame)`,
      fix: `keep meaningful content above ${(zone * 100).toFixed(0)}% of the frame height, or mark the element as intentional lower-third copy`,
    });
  }
  return out;
}

/**
 * Two scenes that look the same.
 *
 * Compares one representative frame per scene, so a repeated layout is caught
 * while a scene's own frames — which should of course resemble each other —
 * are not. A repeat is only interesting between *different* scenes.
 */
export function detectRepeatedLayouts(frames, { maxDistance = 1 } = {}) {
  const byScene = new Map();
  for (const f of frames) {
    if (!f.scene || f.kind !== "midpoint") continue;
    if (!byScene.has(f.scene)) byScene.set(f.scene, f);
  }

  const entries = [...byScene.values()];
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      const sa = layoutSignature(a);
      const sb = layoutSignature(b);
      if (sa === null || sb === null) continue;

      const distance = hamming(sa, sb);
      if (distance > maxDistance) continue;
      out.push({
        code: "repeated_layout",
        scene: b.scene,
        at: b.at,
        message:
          `"${a.scene}" and "${b.scene}" put content in the same places ` +
          `(layout distance ${distance}) — the video shows the same picture twice with different words in it`,
        fix: "change the composition, the camera, or what is on screen — not only the copy",
      });
    }
  }
  return out;
}

/**
 * A layout signature: which horizontal bands actually carry content.
 *
 * Average-hash over the whole frame is the obvious choice and the wrong one
 * here. On a dark, sparse composition almost every frame is mostly background,
 * so two genuinely different scenes land a few bits apart and the threshold has
 * to be set so loose it stops meaning anything. Layout is *where content sits*,
 * so the signature is built from the ink profile: sixteen bands, one bit each.
 */
export function layoutSignature(frame, { bands = 16, threshold = 0.2 } = {}) {
  if (!frame.ink?.length) return null;
  let bits = 0n;
  for (let b = 0; b < bands; b++) {
    const from = Math.floor((b / bands) * frame.ink.length);
    const to = Math.max(from + 1, Math.floor(((b + 1) / bands) * frame.ink.length));
    const slice = frame.ink.slice(from, to);
    if (Math.max(0, ...slice) >= threshold) bits |= 1n << BigInt(b);
  }
  return bits;
}

/**
 * Copy that cannot be read in the time it is given. Static: it comes from the
 * timing plan rather than the pixels, because the number is knowable before a
 * single frame is rendered.
 */
export function detectUnreadableCopy(tight) {
  return tight.flatMap(({ scene, lines }) =>
    lines.map((line) => ({
      code: "reading_floor_violated",
      scene: scene.id,
      at: line.settled,
      message:
        `"${line.text}" needs ${line.floor}s to read but "${scene.id}" gives it ` +
        `${Math.max(0, scene.start + scene.duration - line.settled).toFixed(2)}s settled`,
      fix: "lengthen the scene or shorten the line — the reading floor does not move",
    })),
  );
}

export function summarize(findings) {
  const byCode = {};
  for (const f of findings) byCode[f.code] = (byCode[f.code] ?? 0) + 1;
  return byCode;
}
