#!/usr/bin/env node

// Thin wrapper over the shared packet builder in hyperframes-core — this file
// only pins the paths specific to brag. The logic (frame splitting, rule
// citation, packet bounds, `_role.md` assembly) has one owner:
// hyperframes-core/scripts/lib/frame-packets-core.mjs
//
// The paths are resolved at runtime rather than vendored, because the skills
// are a moving upstream and a copied rule index goes stale silently.

import { resolve } from "node:path";
import { skillsRoot } from "./lib/hyperframes.mjs";

const PLUGIN_ROOT = resolve(import.meta.dirname, "..");

function config() {
  const root = skillsRoot();
  return {
    animationDir: resolve(root, "hyperframes-animation"),
    corePath: resolve(root, "hyperframes-core", "references", "frame-worker-core.md"),
    deltaPath: resolve(PLUGIN_ROOT, "skills", "brag", "sub-agents", "frame-worker.md"),
  };
}

async function core() {
  const root = skillsRoot();
  const url = new URL(
    `file:///${resolve(root, "hyperframes-core", "scripts", "lib", "frame-packets-core.mjs").replace(/\\/g, "/")}`,
  );
  return import(url.href);
}

export async function buildRolePayload({ outDir }) {
  return (await core()).buildRolePayload({ ...config(), outDir });
}

export async function buildFramePackets(options) {
  return (await core()).buildFramePackets({ ...config(), ...options });
}
