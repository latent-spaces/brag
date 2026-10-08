import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import sharp from "sharp";
import { deltaE, parseHex } from "../color-math.mjs";

const execFileAsync = promisify(execFile);
const scriptsDir = dirname(dirname(fileURLToPath(import.meta.url)));
const measureScript = join(scriptsDir, "measure-colors.mjs");
const verifyScript = join(scriptsDir, "verify.mjs");

async function createTempDir(t) {
  const dir = await mkdtemp(join(tmpdir(), "design-dna-colors-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function run(script, args, expectedCode = 0) {
  try {
    const result = await execFileAsync(process.execPath, [script, ...args], {
      cwd: scriptsDir,
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(expectedCode, 0, `expected exit ${expectedCode}, got 0`);
    return result;
  } catch (error) {
    assert.equal(error.code, expectedCode, error.stderr || error.message);
    return { stdout: error.stdout, stderr: error.stderr };
  }
}

async function measure(image, args = []) {
  const { stdout } = await run(measureScript, [image, ...args]);
  return JSON.parse(stdout);
}

async function saveSpec(dir, name, spec) {
  const file = join(dir, name);
  await writeFile(file, JSON.stringify(spec));
  return file;
}

async function verify(image, specFile, expectedCode = 0) {
  const { stdout } = await run(verifyScript, [image, specFile], expectedCode);
  return JSON.parse(stdout);
}

async function writeRgb(file, width, height, pixelAt) {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      const color = pixelAt(x, y);
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
    }
  }
  await sharp(data, { raw: { width, height, channels: 3 } }).png().toFile(file);
}

test("measure -> verify reuses the persisted k for plain, embedded, and legacy specs", async (t) => {
  const dir = await createTempDir(t);
  const image = join(dir, "gradient.png");
  await writeRgb(image, 400, 80, (x) => {
    const amount = x / 399;
    return [Math.round(255 * (1 - amount)), 0, Math.round(255 * amount)];
  });

  const defaultMeasurement = await measure(image);
  assert.equal(defaultMeasurement.measurement.k, 8);
  const defaultSpec = await saveSpec(dir, "default.json", defaultMeasurement);
  assert.equal((await verify(image, defaultSpec)).pass, true);

  const legacyMeasurement = structuredClone(defaultMeasurement);
  delete legacyMeasurement.measurement;
  const legacySpec = await saveSpec(dir, "legacy.json", legacyMeasurement);
  const legacyReport = await verify(image, legacySpec);
  assert.equal(legacyReport.measurement.k, 8);
  assert.equal(legacyReport.pass, true);

  const customMeasurement = await measure(image, ["--k", "3"]);
  assert.equal(customMeasurement.measurement.k, 3);
  const customSpec = await saveSpec(dir, "custom.json", customMeasurement);
  const customReport = await verify(image, customSpec);
  assert.equal(customReport.measurement.k, 3);
  assert.equal(customReport.pass, true);

  const embeddedSpec = await saveSpec(dir, "embedded.json", {
    design_system: {
      color: {
        measured_palette: customMeasurement.palette,
        measurement: customMeasurement.measurement,
      },
    },
  });
  const embeddedReport = await verify(image, embeddedSpec);
  assert.equal(embeddedReport.measurement.k, 3);
  assert.equal(embeddedReport.pass, true);
});

test("a significant wrong implementation cluster cannot be averaged away", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "white.png");
  const implementation = join(dir, "white-with-black.png");
  await writeRgb(reference, 100, 100, () => [255, 255, 255]);
  await writeRgb(implementation, 100, 100, (x) =>
    x < 4 ? [0, 0, 0] : [255, 255, 255]
  );

  const specFile = await saveSpec(dir, "white.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  const black = report.implementationClusters.find((c) => c.imageHex === "#000000");
  assert.ok(black);
  assert.equal(black.imageCoverage, 0.04);
  assert.ok(black.deltaE > 90);
  assert.ok(report.maxDeltaE > 90);
  assert.equal(report.pass, false);
});

test("a large wrong region matched to a rare reference color still fails", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "rare-black.png");
  const implementation = join(dir, "large-gray.png");
  await writeRgb(reference, 100, 100, (x, y) =>
    y * 100 + x < 40 ? [0, 0, 0] : [255, 255, 255]
  );
  await writeRgb(implementation, 100, 100, (x, y) =>
    y * 100 + x < 1750 ? [85, 85, 85] : [255, 255, 255]
  );

  const specFile = await saveSpec(dir, "rare.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  const gray = report.implementationClusters.find((c) => c.imageHex === "#555555");
  assert.ok(gray);
  assert.equal(gray.imageCoverage, 0.175);
  assert.ok(gray.deltaE > 20);
  assert.ok(report.coverageDrift < report.thresholds.coverageDrift);
  assert.equal(report.pass, false);
});

test("a missing significant reference color is checked in the reverse direction", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "black-and-white.png");
  const implementation = join(dir, "only-white.png");
  await writeRgb(reference, 100, 100, (x) =>
    x < 10 ? [0, 0, 0] : [255, 255, 255]
  );
  await writeRgb(implementation, 100, 100, () => [255, 255, 255]);

  const specFile = await saveSpec(dir, "black-and-white.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  const missingBlack = report.entries.find((entry) => entry.specHex === "#000000");
  assert.ok(missingBlack);
  assert.equal(missingBlack.nearestImageHex, "#ffffff");
  assert.ok(missingBlack.deltaE > 90);
  assert.equal(report.pass, false);
});

test("a sub-percent remnant does not preserve a significant reference color", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "ten-percent-black.png");
  const implementation = join(dir, "trace-black.png");
  await writeRgb(reference, 100, 100, (x, y) =>
    y * 100 + x < 1000 ? [0, 0, 0] : [255, 255, 255]
  );
  await writeRgb(implementation, 100, 100, (x, y) =>
    y * 100 + x < 10 ? [0, 0, 0] : [255, 255, 255]
  );

  const specFile = await saveSpec(dir, "reference.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  const missingBlack = report.entries.find((entry) => entry.specHex === "#000000");
  assert.ok(missingBlack);
  assert.equal(missingBlack.imageCoverage, 0.001);
  assert.equal(missingBlack.nearestImageHex, "#ffffff");
  assert.ok(missingBlack.deltaE > 90);
  assert.ok(report.coverageDrift < report.thresholds.coverageDrift);
  assert.equal(report.pass, false);
});

test("entry deltaE always describes its nearestImageHex", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "reference.png");
  const implementation = join(dir, "implementation.png");
  await writeRgb(reference, 100, 100, (x) =>
    x < 50 ? [0, 0, 0] : [255, 255, 255]
  );
  await writeRgb(implementation, 100, 100, (x) => {
    if (x < 25) return [20, 20, 20];
    if (x < 50) return [80, 80, 80];
    return [245, 245, 245];
  });

  const specFile = await saveSpec(dir, "reference.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  for (const entry of report.entries) {
    const expected = Number(
      deltaE(parseHex(entry.specHex), parseHex(entry.nearestImageHex)).toFixed(2)
    );
    assert.equal(entry.deltaE, expected);
  }
});

test("bounded sampling preserves both colors in alternating 1 px stripes", async (t) => {
  const dir = await createTempDir(t);
  const stripes = join(dir, "stripes.png");
  await writeRgb(stripes, 800, 400, (x) =>
    x % 2 === 0 ? [255, 0, 0] : [0, 0, 255]
  );

  const result = await measure(stripes);
  assert.equal(result.measurement.sampling.sampled_pixels, 160_000);
  const red = result.palette.find((entry) => entry.hex === "#ff0000");
  const blue = result.palette.find((entry) => entry.hex === "#0000ff");
  assert.ok(red, "red stripe color should be sampled");
  assert.ok(blue, "blue stripe color should be sampled");
  assert.ok(red.coverage > 0.48 && red.coverage < 0.52);
  assert.ok(blue.coverage > 0.48 && blue.coverage < 0.52);
});

test("accent assignment favors perceptual separation over tinted surface area", async (t) => {
  const dir = await createTempDir(t);
  const image = join(dir, "dark-dashboard.png");
  await writeRgb(image, 100, 100, (x, y) => {
    const index = y * 100 + x;
    if (index < 250) return [243, 246, 254];
    if (index < 500) return [110, 231, 255];
    if (index < 1300) return [27, 37, 63];
    return [15, 21, 38];
  });

  const result = await measure(image);
  assert.equal(result.palette.find((entry) => entry.role === "text")?.hex, "#f3f6fe");
  assert.equal(result.palette.find((entry) => entry.role === "accent")?.hex, "#6ee7ff");
  assert.equal(
    result.palette.find((entry) => entry.hex === "#1b253f")?.role,
    "unassigned"
  );
});

test("coverage drift reports enough precision to explain a boundary failure", async (t) => {
  const dir = await createTempDir(t);
  const reference = join(dir, "reference.png");
  const implementation = join(dir, "implementation.png");
  await writeRgb(reference, 100, 100, (x, y) =>
    y * 100 + x < 10 ? [0, 0, 0] : [255, 255, 255]
  );
  await writeRgb(implementation, 100, 100, (x, y) =>
    y * 100 + x < 1761 ? [0, 0, 0] : [255, 255, 255]
  );

  const specFile = await saveSpec(dir, "reference.json", await measure(reference));
  const report = await verify(implementation, specFile, 2);
  assert.equal(report.coverageDrift, 0.3502);
  assert.equal(report.thresholds.coverageDrift, 0.35);
  assert.equal(report.pass, false);
});
