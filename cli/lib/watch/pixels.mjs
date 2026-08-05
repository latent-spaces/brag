/**
 * Reading the render's actual pixels.
 *
 * Detection works on the rendered frame, not on the DOM brag authored. That
 * matters: the whole reason a review layer exists is that `check` can pass
 * while the video is wrong, and a check that reads brag's own intent back to
 * itself would repeat the same mistake.
 *
 * Pixels arrive as raw 8-bit grayscale straight from ffmpeg, so nothing here
 * needs an image-decoding dependency and every measurement is reproducible.
 */

import { spawnSync } from "node:child_process";
import { envError, gateError } from "../util.mjs";

/**
 * Grab one frame as a raw grayscale buffer.
 * @returns {{w:number,h:number,data:Uint8Array}}
 */
export function grabGray(video, atSeconds, { w = 64, h = 36 } = {}) {
  const res = spawnSync(
    "ffmpeg",
    [
      "-v", "error",
      "-ss", String(atSeconds),
      "-i", video,
      "-frames:v", "1",
      "-vf", `scale=${w}:${h}:flags=area,format=gray`,
      "-f", "rawvideo",
      "-",
    ],
    { encoding: "buffer", maxBuffer: 16 * 1024 * 1024, timeout: 120_000 },
  );
  if (res.error?.code === "ENOENT") throw envError("ffmpeg is not on PATH");
  if (res.status !== 0) {
    throw gateError(`ffmpeg could not read ${video} at ${atSeconds}s: ${String(res.stderr).trim()}`);
  }
  const data = new Uint8Array(res.stdout);
  if (data.length < w * h) {
    throw gateError(`frame at ${atSeconds}s returned ${data.length} bytes, expected ${w * h}`);
  }
  return { w, h, data: data.subarray(0, w * h) };
}

export const mean = (data) => {
  let sum = 0;
  for (const v of data) sum += v;
  return sum / data.length;
};

export function stdDev(data) {
  const m = mean(data);
  let acc = 0;
  for (const v of data) acc += (v - m) ** 2;
  return Math.sqrt(acc / data.length);
}

/**
 * Per-row ink: how far each row departs from the frame's background level.
 * Text is ink; a flat background is not. Returns one value per row, 0..1.
 */
export function rowInk(frame) {
  const { w, h, data } = frame;

  /* The background is the most common level, approximated by the median —
     robust to a bright headline or a dark panel. */
  const sorted = Array.from(data).sort((a, b) => a - b);
  const background = sorted[Math.floor(sorted.length / 2)];

  const rows = new Array(h);
  let peak = 0;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = 0; x < w; x++) acc += Math.abs(data[y * w + x] - background);
    rows[y] = acc / w;
    if (rows[y] > peak) peak = rows[y];
  }
  return peak > 0 ? rows.map((v) => v / peak) : rows.map(() => 0);
}

/**
 * Average hash: downsample to 8×8, one bit per cell against the mean.
 * Enough to answer "is this the same layout again?", which is what the
 * anti-sameness check actually asks — not "is this the same image".
 */
export function aHash(frame) {
  const { w, h, data } = frame;
  const cells = new Array(64).fill(0);
  const counts = new Array(64).fill(0);
  for (let y = 0; y < h; y++) {
    const by = Math.min(7, Math.floor((y / h) * 8));
    for (let x = 0; x < w; x++) {
      const bx = Math.min(7, Math.floor((x / w) * 8));
      const i = by * 8 + bx;
      cells[i] += data[y * w + x];
      counts[i]++;
    }
  }
  const avg = cells.map((v, i) => (counts[i] ? v / counts[i] : 0));
  const m = mean(avg);
  let bits = 0n;
  for (let i = 0; i < 64; i++) if (avg[i] > m) bits |= 1n << BigInt(i);
  return bits;
}

export function hamming(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

/** A frame with almost no tonal range is black, white, or a dead fade. */
export function isFlat(frame, { maxStdDev = 3, darkBelow = 12 } = {}) {
  const m = mean(frame.data);
  const sd = stdDev(frame.data);
  return {
    flat: sd <= maxStdDev,
    dark: m <= darkBelow,
    mean: Number(m.toFixed(2)),
    stdDev: Number(sd.toFixed(2)),
  };
}
