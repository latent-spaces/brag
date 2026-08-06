/**
 * Determinism fingerprinting.
 *
 * "Compile twice, get the same bytes" is the property a scoped revision later
 * depends on: if recompiling an untouched scene produces different output, no
 * one can prove a revision only changed what it claimed.
 *
 * One wrinkle is upstream, not ours. Opening a project with `hyperframes check`
 * rewrites index.html in place — it normalises the markup and injects
 * `data-hf-id="hf-xxxx"` identity attributes for Studio's timeline, freshly
 * generated each time. So the fingerprint compares *semantic* content: foreign
 * identity attributes and HTML normalisation are stripped before hashing, and
 * everything brag actually authored is compared exactly.
 */

import path from "node:path";
import fs from "node:fs";
import { sha256, walkFiles } from "./util.mjs";

const TEXT = /\.(html?|md|json|css|js|mjs|txt|svg)$/i;

/** Remove what HyperFrames stamps into a file it has opened. */
export function normalizeForCompare(rel, contents) {
  if (!/\.html?$/i.test(rel)) return contents;
  return contents
    .replace(/\s*data-hf-id="[^"]*"/g, "")
    .replace(/<!DOCTYPE html>/i, "<!doctype html>")
    /* Studio re-serialises void elements and collapses attribute whitespace;
       neither changes meaning, so neither should fail a determinism check. */
    .replace(/\s*\/>/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

/**
 * @returns {Map<string,string>} relative path → content hash
 */
export function fingerprintTree(root) {
  const out = new Map();
  for (const rel of walkFiles(root)) {
    const abs = path.join(root, rel);
    const buf = fs.readFileSync(abs);
    const hash = TEXT.test(rel)
      ? sha256(normalizeForCompare(rel, buf.toString("utf8")))
      : sha256(buf);
    out.set(rel, hash);
  }
  return out;
}

/**
 * Compare two fingerprints.
 * @returns {{identical: boolean, added: string[], removed: string[], changed: string[]}}
 */
export function diffFingerprints(before, after) {
  const added = [...after.keys()].filter((k) => !before.has(k)).sort();
  const removed = [...before.keys()].filter((k) => !after.has(k)).sort();
  const changed = [...before.keys()]
    .filter((k) => after.has(k) && before.get(k) !== after.get(k))
    .sort();
  return { identical: !added.length && !removed.length && !changed.length, added, removed, changed };
}
