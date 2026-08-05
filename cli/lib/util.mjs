/**
 * Shared primitives: exit codes, output, and atomic filesystem helpers.
 *
 * Exit codes are the contract. Every command must exit non-zero on failure —
 * "looks good" is never a gate.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const EXIT = {
  OK: 0,
  /** A gate failed: the work is real but does not pass. */
  GATE: 1,
  /** The caller invoked us wrongly. */
  USAGE: 2,
  /** The environment is not fit to run: missing HyperFrames, missing ffmpeg. */
  ENV: 3,
  /** A required artifact was absent or failed schema validation. */
  ARTIFACT: 4,
};

export class BragError extends Error {
  constructor(message, code = EXIT.GATE, detail = null) {
    super(message);
    this.name = "BragError";
    this.code = code;
    this.detail = detail;
  }
}

export const usage = (m, d) => new BragError(m, EXIT.USAGE, d);
export const envError = (m, d) => new BragError(m, EXIT.ENV, d);
export const artifactError = (m, d) => new BragError(m, EXIT.ARTIFACT, d);
export const gateError = (m, d) => new BragError(m, EXIT.GATE, d);

/* ------------------------------------------------------------------ output */

let JSON_MODE = false;
let QUIET = false;

export function configureOutput({ json = false, quiet = false } = {}) {
  JSON_MODE = json;
  QUIET = quiet;
}

export const isJsonMode = () => JSON_MODE;

const write = (stream, s) => stream.write(s + "\n");

export function say(msg) {
  if (!QUIET && !JSON_MODE) write(process.stdout, msg);
}

export function detail(msg) {
  if (!QUIET && !JSON_MODE) write(process.stdout, "  " + msg);
}

export function warn(msg) {
  if (!JSON_MODE) write(process.stderr, "warning: " + msg);
}

export function fail(msg) {
  write(process.stderr, "error: " + msg);
}

/** The single structured-output path. Commands print at most one of these. */
export function emitJson(payload) {
  write(process.stdout, JSON.stringify(payload, null, 2));
}

/**
 * Report a command result. In --json mode the payload is the whole output;
 * otherwise `lines` is printed for humans.
 */
export function report(payload, lines = []) {
  if (JSON_MODE) emitJson(payload);
  else for (const l of lines) say(l);
}

/* ------------------------------------------------------------------ filesystem */

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Write atomically via a sibling temp file + rename, so a crashed run can never
 * leave a half-written artifact that a later stage would happily read.
 */
export function writeFileAtomic(file, contents) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
  return file;
}

/** Stable JSON: sorted keys, trailing newline. Byte-identical across runs. */
export function stableStringify(value) {
  const seen = new WeakSet();
  const norm = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) throw new Error("cannot serialize a cycle");
    seen.add(v);
    if (Array.isArray(v)) return v.map(norm);
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (v[k] !== undefined) out[k] = norm(v[k]);
    }
    return out;
  };
  return JSON.stringify(norm(value), null, 2) + "\n";
}

export function writeJson(file, value) {
  return writeFileAtomic(file, stableStringify(value));
}

export function readJson(file, { optional = false } = {}) {
  if (!fs.existsSync(file)) {
    if (optional) return null;
    throw artifactError(`missing artifact: ${file}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    throw artifactError(`${file} is not valid JSON: ${e.message}`);
  }
}

export const exists = (p) => fs.existsSync(p);

export function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function sha256File(file) {
  return sha256(fs.readFileSync(file));
}

/** Recursive file list, relative to `root`, sorted — for determinism checks. */
export function walkFiles(root, { skip = new Set([".git", "node_modules"]) } = {}) {
  const out = [];
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (skip.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(abs, r);
      else if (e.isFile()) out.push(r);
    }
  };
  walk(root, "");
  return out;
}

/* ------------------------------------------------------------------ misc */

export const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "untitled";

export const round = (n, dp = 3) => Number(Number(n).toFixed(dp));

export function pluralize(n, one, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}
