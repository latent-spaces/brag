/**
 * Project state: the `brag/` directory inside the target project, plus the
 * cross-project memory in `~/.brag/`.
 *
 * Two rules hold this together:
 *   1. Nothing mutable ever lives in the plugin directory — it is version
 *      pinned and replaced wholesale on update.
 *   2. A stage is complete when its artifact exists and validates. Never a
 *      flag, never a log line. `brag status` is therefore just a directory
 *      listing with opinions.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  artifactError,
  ensureDir,
  exists,
  readJson,
  writeJson,
} from "./util.mjs";

/** Repo root — three levels up from cli/lib/state.mjs. */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** Cross-project memory. Fingerprint history (§6) and the asset library (§12). */
export const MEMORY_ROOT =
  process.env.BRAG_HOME ?? path.join(os.homedir(), ".brag");

/** The ten pipeline stages, in order. Each names the artifact that proves it. */
export const STAGES = [
  { id: "discover", command: "inspect", artifact: "product_model.json", schema: "product_model" },
  { id: "position", command: "position", artifact: "positioning.json", schema: "positioning" },
  { id: "concept", command: "select", artifact: "selected_concept.json", schema: "selected_concept" },
  { id: "direct", command: "direct", artifact: "direction.json", schema: "direction" },
  { id: "storyboard", command: "storyboard", artifact: "scene_graph.json", schema: "scene_graph" },
  { id: "capture", command: "capture", artifact: "captures/capture_manifest.json", schema: "capture_manifest" },
  { id: "compose", command: "compose", artifact: "compositions/index.json", schema: null },
  { id: "review", command: "review", artifact: "reviews/latest.json", schema: "review_report" },
  { id: "recompose", command: "variant", artifact: "compositions/index.json", schema: null },
  { id: "deliver", command: "deliver", artifact: "delivery/manifest.json", schema: null },
];

export class Project {
  /**
   * @param {string} targetRoot directory of the product being bragged about
   */
  constructor(targetRoot) {
    this.targetRoot = path.resolve(targetRoot);
    this.dir = path.join(this.targetRoot, "brag");
  }

  /* ---------------------------------------------------------------- paths */

  path(...parts) {
    return path.join(this.dir, ...parts);
  }

  get projectFile() {
    return this.path("project.json");
  }

  get exists() {
    return exists(this.projectFile);
  }

  /** Where a task spec is written for the agent to answer. */
  specPath(name) {
    return this.path("tasks", `${name}.task.md`);
  }

  /** Where the agent is told to write its answer. */
  answerPath(name) {
    return this.path("tasks", `${name}.json`);
  }

  /* ---------------------------------------------------------------- lifecycle */

  init({ name, targetSurfaceHint = null, force = false }) {
    if (this.exists && !force) {
      throw artifactError(
        `${this.dir} already exists. Use \`brag status\` to resume, or pass --force to start over.`,
      );
    }
    ensureDir(this.dir);
    for (const sub of [
      "tasks",
      "concepts",
      "captures",
      "product_assets",
      "compositions",
      "reviews",
      "renders",
      "delivery",
    ]) {
      ensureDir(this.path(sub));
    }
    const project = {
      schema: "brag.project/1",
      name,
      created_at: new Date().toISOString(),
      brag_version: readPackageVersion(),
      target_root: ".",
      surface_hint: targetSurfaceHint,
      stages: {},
    };
    writeJson(this.projectFile, project);
    this.writeGitignore();
    return project;
  }

  /**
   * `brag/` holds captures and renders — large, regenerable, and sometimes
   * full of whatever the product printed. Default to keeping it out of git and
   * let the user opt back in.
   */
  writeGitignore() {
    const file = this.path(".gitignore");
    if (exists(file)) return;
    fs.writeFileSync(
      file,
      [
        "# Brag working state. Regenerable from source; captures may contain",
        "# whatever your product printed. Delete these lines to version it.",
        "captures/",
        "renders/",
        "compositions/",
        "delivery/",
        "tasks/",
        "",
      ].join("\n"),
    );
  }

  load() {
    if (!this.exists) {
      throw artifactError(
        `no brag project in ${this.targetRoot}. Run \`brag init\` there first.`,
      );
    }
    return readJson(this.projectFile);
  }

  update(patch) {
    const project = this.load();
    const next = { ...project, ...patch, updated_at: new Date().toISOString() };
    writeJson(this.projectFile, next);
    return next;
  }

  /* ---------------------------------------------------------------- artifacts */

  read(rel, opts) {
    return readJson(this.path(rel), opts);
  }

  write(rel, value) {
    return writeJson(this.path(rel), value);
  }

  has(rel) {
    return exists(this.path(rel));
  }

  /**
   * Stage completion is derived, never stored: the artifact is on disk or the
   * stage did not happen. Returns one row per stage, in pipeline order.
   */
  stageStatus() {
    const seen = new Set();
    return STAGES.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).map((stage) => ({
      ...stage,
      done: this.has(stage.artifact),
      path: stage.artifact,
    }));
  }

  /** The first stage whose artifact is missing — i.e. what to do next. */
  nextStage() {
    return this.stageStatus().find((s) => !s.done) ?? null;
  }
}

/* ------------------------------------------------------------------ memory */

export class Memory {
  constructor(root = MEMORY_ROOT) {
    this.root = root;
  }

  path(...parts) {
    return path.join(this.root, ...parts);
  }

  get historyFile() {
    return this.path("history.json");
  }

  history() {
    return (
      readJson(this.historyFile, { optional: true }) ?? {
        schema: "brag.history/1",
        videos: [],
      }
    );
  }

  /** Append a delivered video's fingerprint. Drives the §6 anti-sameness gate. */
  appendVideo(entry) {
    ensureDir(this.root);
    const history = this.history();
    history.videos = [...history.videos.filter((v) => v.id !== entry.id), entry]
      .sort((a, b) => (a.delivered_at < b.delivered_at ? -1 : 1))
      .slice(-100);
    writeJson(this.historyFile, history);
    return history;
  }

  /** Fingerprints of the N most recent videos, newest first. */
  recentFingerprints(limit = 10, { project = null } = {}) {
    return this.history()
      .videos.filter((v) => !project || v.project === project)
      .slice(-limit)
      .reverse()
      .map((v) => v.fingerprint)
      .filter(Boolean);
  }
}

/* ------------------------------------------------------------------ helpers */

let cachedVersion = null;

export function readPackageVersion() {
  if (cachedVersion) return cachedVersion;
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
    );
    cachedVersion = pkg.version ?? "0.0.0";
  } catch {
    cachedVersion = "0.0.0";
  }
  return cachedVersion;
}

/**
 * Resolve the target project directory. Defaults to cwd, which is the common
 * case: the user is standing in the thing they want to brag about.
 */
export function resolveProject(flags = {}) {
  return new Project(flags.project ?? process.cwd());
}
