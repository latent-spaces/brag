#!/usr/bin/env node
// Deterministic color measurement for the design-dna skill.
//
// Instead of perceiving colors from a screenshot (which drifts toward familiar
// palette defaults), this measures them: k-means clustering over the actual
// pixels, perceptual (CIE ΔE) merging of near-duplicate clusters, and coverage
// fractions. The output is meant to be merged into `design_system.color` of
// a Design DNA JSON — exact hexes with evidence, not guesses.
//
// Usage:
//   node scripts/measure-colors.mjs <screenshot.(png|jpg|webp)> [--k 8]
//
// Output (stdout): JSON
//   {
//     "source": { "file", "width", "height" },
//     "measurement": { "k", "sampling" },
//     "palette": [ { "hex", "coverage", "role" } ... ],
//     "measured": true
//   }

import sharp from "sharp";
import { basename, extname } from "node:path";
import { deltaE, hex, hsv } from "./color-math.mjs";

const args = process.argv.slice(2);
const kIdx = args.indexOf("--k");
const file = args.find(
  (argument, index) =>
    !argument.startsWith("--") && (kIdx < 0 || index !== kIdx + 1)
);
if (!file) {
  console.error("usage: node scripts/measure-colors.mjs <image> [--k 8]");
  process.exit(1);
}
const requestedK = kIdx >= 0 ? Number(args[kIdx + 1]) : 8;
const K = Number.isFinite(requestedK)
  ? Math.max(2, Math.min(16, Math.trunc(requestedK)))
  : 8;
const MAX_SAMPLED_PIXELS = 160_000;

// ---------- k-means ----------

function kmeans(pixels, k, iters = 24) {
  // deterministic farthest-point init: start from the darkest pixel, then
  // repeatedly add the pixel farthest from its nearest existing center, so
  // small but distinct color regions get their own cluster
  const sorted = [...pixels].sort(
    (a, b) => a[0] * 3 + a[1] * 6 + a[2] - (b[0] * 3 + b[1] * 6 + b[2])
  );
  const centers = [[...sorted[0]]];
  const nearest = new Array(pixels.length).fill(Infinity);
  while (centers.length < k) {
    const last = centers[centers.length - 1];
    let far = 0, fd = -1;
    for (let p = 0; p < pixels.length; p++) {
      const dx = pixels[p][0] - last[0];
      const dy = pixels[p][1] - last[1];
      const dz = pixels[p][2] - last[2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < nearest[p]) nearest[p] = d;
      if (nearest[p] > fd) (fd = nearest[p]), (far = p);
    }
    if (fd <= 0) break; // fewer distinct colors than k
    centers.push([...pixels[far]]);
  }
  k = centers.length;
  const assign = new Array(pixels.length).fill(0);
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let p = 0; p < pixels.length; p++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const dx = pixels[p][0] - centers[c][0];
        const dy = pixels[p][1] - centers[c][1];
        const dz = pixels[p][2] - centers[c][2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) (bd = d), (best = c);
      }
      if (assign[p] !== best) (assign[p] = best), (moved = true);
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let p = 0; p < pixels.length; p++) {
      const s = sums[assign[p]];
      s[0] += pixels[p][0]; s[1] += pixels[p][1]; s[2] += pixels[p][2]; s[3]++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3] > 0) {
        centers[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
      }
    }
    if (!moved) break;
  }
  const counts = new Array(k).fill(0);
  for (const a of assign) counts[a]++;
  return centers
    .map((center, i) => ({ center, share: counts[i] / pixels.length }))
    .filter((c) => c.share > 0)
    .sort((a, b) => b.share - a.share);
}

// merge perceptually-identical clusters (anti-aliasing / jpeg noise)
function mergeSimilar(clusters, maxDE = 2.5) {
  const merged = [];
  for (const c of clusters) {
    const near = merged.find((m) => deltaE(m.center, c.center) <= maxDE);
    if (near) {
      const total = near.share + c.share;
      near.center = near.center.map(
        (v, i) => (v * near.share + c.center[i] * c.share) / total
      );
      near.share = total;
    } else {
      merged.push({ center: [...c.center], share: c.share });
    }
  }
  return merged.sort((a, b) => b.share - a.share);
}

// ---------- role assignment ----------

function assignRoles(clusters) {
  const entries = clusters.map(({ center, share }) => {
    const [h, s, l] = hsv(center);
    return { center, share, h, s, l, role: "unassigned" };
  });
  const taken = new Set();
  // background: largest coverage
  entries[0].role = "background";
  taken.add(0);
  const bgL = entries[0].l;
  // text: strongest lightness contrast vs background with meaningful coverage
  let text = -1, bestC = 0;
  entries.forEach((e, i) => {
    if (taken.has(i)) return;
    const c = Math.abs(e.l - bgL);
    if (e.share >= 0.005 && c > bestC) (bestC = c), (text = i);
  });
  if (text >= 0 && bestC > 0.25) {
    entries[text].role = "text";
    taken.add(text);
  }
  // Accent: prefer colors that are both saturated and perceptually distinct
  // from the background. Coverage only discounts tiny clusters; once a color
  // reaches 2%, a large tinted surface must not outrank a smaller bright CTA.
  const accents = entries
    .map((e, i) => ({ e, i }))
    .filter(
      ({ e, i }) =>
        !taken.has(i) && e.s >= 0.25 && e.share >= 0.002 && e.l >= 0.08 && e.l <= 0.92
    )
    .map(({ e, i }) => ({
      e,
      i,
      score:
        e.s *
        deltaE(e.center, entries[0].center) *
        Math.sqrt(Math.min(e.share, 0.02) / 0.02),
    }))
    .sort((a, b) => b.score - a.score);
  if (accents.length > 0) {
    entries[accents[0].i].role = "accent";
    taken.add(accents[0].i);
  }
  return entries;
}

// ---------- deterministic bounded sampling ----------

// A single nearest-neighbour resize always samples at the same phase. That can
// erase periodic detail entirely (for example, every other column in 1 px
// stripes). Instead, divide the full row-major pixel sequence into equal
// strata and choose one exact source pixel from each stratum with a fixed hash.
// The sample count is bounded, no interpolated colors are introduced, and the
// varying offset breaks the fixed phase that causes periodic aliasing.
function mix32(value) {
  let x = (value + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return (x ^ (x >>> 15)) >>> 0;
}

function sampleIndex(sample, totalPixels, sampleCount) {
  const start = Math.floor((sample * totalPixels) / sampleCount);
  const end = Math.floor(((sample + 1) * totalPixels) / sampleCount);
  return start + (mix32(sample) % Math.max(1, end - start));
}

async function samplePixels(image, width, height) {
  const totalPixels = width * height;
  const sampleCount = Math.min(totalPixels, MAX_SAMPLED_PIXELS);
  const pixels = [];
  let sample = 0;
  let nextIndex = sampleIndex(sample, totalPixels, sampleCount);
  let pixelIndex = 0;
  let carry = Buffer.alloc(0);

  // Stream raw output so the JavaScript-side sample stays bounded even when
  // the decoded source is much larger than the clustering budget.
  for await (const chunk of image.raw()) {
    const data = carry.length ? Buffer.concat([carry, chunk]) : chunk;
    const usable = data.length - (data.length % 3);
    const firstPixel = pixelIndex;
    const nextChunkPixel = firstPixel + usable / 3;
    while (sample < sampleCount && nextIndex < nextChunkPixel) {
      const offset = (nextIndex - firstPixel) * 3;
      pixels.push([data[offset], data[offset + 1], data[offset + 2]]);
      sample++;
      if (sample < sampleCount) {
        nextIndex = sampleIndex(sample, totalPixels, sampleCount);
      }
    }
    pixelIndex = nextChunkPixel;
    carry = data.subarray(usable);
  }

  if (carry.length !== 0 || pixels.length !== sampleCount) {
    throw new Error(
      `expected ${sampleCount} RGB samples, received ${pixels.length}`
    );
  }
  return pixels;
}

// ---------- main ----------

const img = sharp(file).flatten({ background: "#ffffff" }).toColourspace("srgb");
let width, height;
try {
  ({ width, height } = await img.metadata());
} catch (err) {
  console.error(`error: cannot read ${file}: ${err.message}`);
  process.exit(1);
}
let pixels;
try {
  pixels = await samplePixels(img, width, height);
} catch (err) {
  console.error(`error: cannot sample ${file}: ${err.message}`);
  process.exit(1);
}

// JPEG compression spreads flat colors into wider noise bands than PNG/WebP
const isJpeg = [".jpg", ".jpeg"].includes(extname(file).toLowerCase());
const palette = assignRoles(mergeSimilar(kmeans(pixels, K), isJpeg ? 5 : 2.5));

console.log(
  JSON.stringify(
    {
      source: { file: basename(file), width, height },
      measurement: {
        k: K,
        sampling: {
          method: "deterministic_stratified",
          max_pixels: MAX_SAMPLED_PIXELS,
          sampled_pixels: pixels.length,
        },
      },
      palette: palette.map((p) => ({
        hex: hex(p.center),
        coverage: Number(p.share.toFixed(4)),
        role: p.role,
      })),
      measured: true,
    },
    null,
    2
  )
);
