#!/usr/bin/env node
// Verify loop for the design-dna skill.
//
// After generating an implementation from a Design DNA JSON, screenshot the
// result and score it against the reference measurement. This turns "does it
// look right?" into a number the agent can iterate on.
//
// Usage:
//   node scripts/measure-colors.mjs reference.png > measured.json
//   node scripts/verify.mjs implementation.png measured.json
//
// Output (stdout): JSON report with per-color ΔE and coverage drift, plus
// PASS/FAIL on stderr. Exit code 0 = pass, 2 = fail.
//
// Thresholds: mean ΔE ≤ 5, max ΔE ≤ 20, coverage drift ≤ 0.35.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { deltaE, parseHex } from "./color-math.mjs";

const [imgFile, specFile] = process.argv.slice(2);
if (!imgFile || !specFile) {
  console.error("usage: node scripts/verify.mjs <implementation.png> <measured.json>");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specFile, "utf8"));
const specPalette = spec.palette ?? spec.design_system?.color?.measured_palette;
if (!Array.isArray(specPalette)) {
  console.error("measured.json must contain a `palette` array (from measure-colors.mjs)");
  process.exit(1);
}

const configuredK = spec.measurement?.k ?? spec.design_system?.color?.measurement?.k;
const parsedK = Number(configuredK);
const measurementK = Number.isFinite(parsedK)
  ? Math.max(2, Math.min(16, Math.trunc(parsedK)))
  : 8;

// re-measure the implementation with the same deterministic pipeline
const here = dirname(fileURLToPath(import.meta.url));
const out = execFileSync(
  process.execPath,
  [join(here, "measure-colors.mjs"), imgFile, "--k", String(measurementK)],
  { encoding: "utf8" }
);
const impl = JSON.parse(out);

const dE = (a, b) => deltaE(parseHex(a), parseHex(b));
const SIGNIFICANT_COVERAGE = 0.005;

// Partition the implementation's clusters by their nearest spec color, so a
// spec color that re-measures as several nearby clusters is credited with
// their combined coverage instead of a single nearest match.
const assigned = specPalette.map(() => []);
for (const c of impl.palette) {
  let best = 0, bd = Infinity;
  specPalette.forEach((s, i) => {
    const d = dE(s.hex, c.hex);
    if (d < bd) (bd = d), (best = i);
  });
  assigned[best].push({ ...c, deltaE: bd });
}

const significantImagePalette = impl.palette.filter(
  (c) => c.coverage >= SIGNIFICANT_COVERAGE
);

const entries = specPalette.map((s, i) => {
  const group = assigned[i];
  const cov = group.reduce((t, g) => t + g.coverage, 0);
  // A significant reference color must match a significant implementation
  // cluster. A sub-percent remnant does not count as preserving the color.
  const candidates =
    s.coverage >= SIGNIFICANT_COVERAGE && significantImagePalette.length > 0
      ? significantImagePalette
      : impl.palette;
  let nearest;
  let nearestDE = Infinity;
  for (const c of candidates) {
    const distance = dE(s.hex, c.hex);
    if (distance < nearestDE) {
      nearestDE = distance;
      nearest = c.hex;
    }
  }
  return {
    specHex: s.hex,
    role: s.role,
    nearestImageHex: nearest,
    // deltaE always describes the displayed nearestImageHex. Coverage remains
    // the total of all implementation clusters assigned to this spec color.
    deltaE: Number(nearestDE.toFixed(2)),
    specCoverage: s.coverage,
    imageCoverage: Number(cov.toFixed(4)),
  };
});

// Keep every implementation cluster separate for color-error scoring. If a
// wrong color occupies meaningful image area, averaging it into a nearby
// reference group must not hide it.
const implementationClusters = impl.palette.map((c) => {
  let nearestSpec;
  let nearestRole;
  let nearestDE = Infinity;
  for (const s of specPalette) {
    const distance = dE(s.hex, c.hex);
    if (distance < nearestDE) {
      nearestDE = distance;
      nearestSpec = s.hex;
      nearestRole = s.role;
    }
  }
  return {
    imageHex: c.hex,
    imageCoverage: c.coverage,
    nearestSpecHex: nearestSpec,
    nearestSpecRole: nearestRole,
    deltaE: Number(nearestDE.toFixed(2)),
  };
});

// Mean ΔE is weighted by what is actually present in the implementation.
// Coverage drift and the reference-side max still expose omitted colors.
let meanDE = 0, imageWeight = 0, drift = 0;
for (const c of implementationClusters) {
  meanDE += c.deltaE * c.imageCoverage;
  imageWeight += c.imageCoverage;
}
for (const e of entries) {
  drift += Math.abs(e.specCoverage - e.imageCoverage);
}
meanDE = imageWeight > 0 ? meanDE / imageWeight : 0;

const significantImplementation = implementationClusters.filter(
  (c) => c.imageCoverage >= SIGNIFICANT_COVERAGE
);
const significantReference = entries.filter(
  (e) => e.specCoverage >= SIGNIFICANT_COVERAGE
);
const maxImplementationDE = Math.max(
  0,
  ...significantImplementation.map((c) => c.deltaE)
);
// The reverse direction is needed when a significant reference color is
// absent from the implementation and therefore has no image cluster to score.
const maxReferenceDE = Math.max(0, ...significantReference.map((e) => e.deltaE));
const maxDE = Math.max(maxImplementationDE, maxReferenceDE);

const pass = meanDE <= 5 && maxDE <= 20 && drift <= 0.35;
console.log(
  JSON.stringify(
    {
      implementation: imgFile,
      reference: specFile,
      measurement: { k: measurementK },
      entries,
      implementationClusters,
      meanDeltaE: Number(meanDE.toFixed(2)),
      maxDeltaE: Number(maxDE.toFixed(2)),
      // Keep enough precision for the report to explain boundary failures
      // such as 0.3502 > 0.35.
      coverageDrift: Number(drift.toFixed(4)),
      thresholds: {
        meanDeltaE: 5,
        maxDeltaE: 20,
        coverageDrift: 0.35,
        significantCoverage: SIGNIFICANT_COVERAGE,
      },
      pass,
    },
    null,
    2
  )
);
console.error(
  `${pass ? "PASS" : "FAIL"} — mean ΔE ${meanDE.toFixed(2)}, max ΔE ${maxDE.toFixed(2)}, coverage drift ${drift.toFixed(4)}`
);
process.exit(pass ? 0 : 2);
