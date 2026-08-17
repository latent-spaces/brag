/**
 * The HyperFrames bridge.
 *
 * Brag does not own motion vocabulary, rendering, or linting — HyperFrames
 * does. This module locates the installed skill pack and reads its indices at
 * runtime. Nothing is ever vendored: a copied rule list silently desyncs on the
 * next HyperFrames upgrade, and a stale vocabulary produces compositions that
 * cite motion ids which no longer exist.
 *
 * `brag doctor` fails loudly when anything here cannot be resolved.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { envError, exists, warn } from "./util.mjs";

/* ------------------------------------------------------------------ location */

const CANDIDATE_ROOTS = () =>
  [
    process.env.BRAG_SKILLS_DIR,
    process.env.CLAUDE_SKILLS_DIR,
    path.join(os.homedir(), ".claude", "skills"),
    path.join(process.cwd(), ".claude", "skills"),
    path.join(os.homedir(), ".agents", "skills"),
  ].filter(Boolean);

let cachedRoot;

/** Directory containing hyperframes-core, hyperframes-animation, … */
export function skillsRoot() {
  if (cachedRoot !== undefined) return cachedRoot;
  for (const root of CANDIDATE_ROOTS()) {
    if (exists(path.join(root, "hyperframes-core")) && exists(path.join(root, "hyperframes-animation"))) {
      cachedRoot = root;
      return root;
    }
  }
  cachedRoot = null;
  return null;
}

export function requireSkillsRoot() {
  const root = skillsRoot();
  if (!root) {
    throw envError(
      "cannot find the HyperFrames skill pack.\n" +
        "Install it with `npx hyperframes skills`, then restart the agent session.\n" +
        `Looked in:\n${CANDIDATE_ROOTS().map((r) => `  ${r}`).join("\n")}`,
    );
  }
  return root;
}

/** Every path brag depends on, and what breaks without it. */
export function requiredPaths(root = requireSkillsRoot()) {
  return [
    {
      id: "frame-packets-core",
      file: path.join(root, "hyperframes-core", "scripts", "lib", "frame-packets-core.mjs"),
      why: "builds frame-worker packets and validates cited motion rule ids",
    },
    {
      id: "rules-index",
      file: path.join(root, "hyperframes-animation", "rules-index.md"),
      why: "the atomic motion vocabulary a scene may cite",
    },
    {
      id: "blueprints-index",
      file: path.join(root, "hyperframes-animation", "blueprints-index.md"),
      why: "time-coded scene blueprints mapped to storyboard roles",
    },
    {
      id: "transition-registry",
      file: path.join(root, "hyperframes-animation", "transitions", "TRANSITION-REGISTRY.md"),
      why: "the machine-readable transitions a seam may use",
    },
    {
      id: "seam-gate",
      file: path.join(root, "motion-doctrine", "scripts", "seam-gate.mjs"),
      why: "numerically verifies every seam against the vector ledger",
    },
    {
      id: "seam-stamp",
      file: path.join(root, "motion-doctrine", "scripts", "seam-stamp.mjs"),
      why: "stamps ledger rows onto the master timeline",
    },
    {
      id: "storyboard-format",
      file: path.join(root, "hyperframes-core", "references", "storyboard-format.md"),
      why: "the STORYBOARD.md contract brag compiles into",
    },
    {
      id: "frame-worker-core",
      file: path.join(root, "hyperframes-core", "references", "frame-worker-core.md"),
      why: "the frame-worker role contract brag's delta extends",
    },
  ];
}

export const animationDir = (root = requireSkillsRoot()) =>
  path.join(root, "hyperframes-animation");

export const seamGateScript = (root = requireSkillsRoot()) =>
  path.join(root, "motion-doctrine", "scripts", "seam-gate.mjs");

export const seamStampScript = (root = requireSkillsRoot()) =>
  path.join(root, "motion-doctrine", "scripts", "seam-stamp.mjs");

/* ------------------------------------------------------------------ vocabulary */

/**
 * Motion rule ids, read through HyperFrames' own parser so brag can never
 * disagree with the frame-worker packet builder about what exists.
 */
export async function ruleIds() {
  const root = requireSkillsRoot();
  const core = path.join(root, "hyperframes-core", "scripts", "lib", "frame-packets-core.mjs");
  const mod = await import(`file://${core.split(path.sep).join("/")}`);
  if (typeof mod.knownRuleIds !== "function") {
    throw envError(
      `${core} no longer exports knownRuleIds(). HyperFrames changed shape; brag's bridge needs updating.`,
    );
  }
  return new Set(mod.knownRuleIds(animationDir(root)));
}

/**
 * Blueprint ids, parsed from the `<blueprints>` block. Entries are
 * `<blueprint id="..." roles="..." duration="...">`, so the id is an attribute
 * rather than the tag name — unlike rules-index, where the tag *is* the id.
 */
export function blueprintIds(root = requireSkillsRoot()) {
  const file = path.join(root, "hyperframes-animation", "blueprints-index.md");
  const text = fs.readFileSync(file, "utf8");
  const block = text.match(/<blueprints>([\s\S]*?)<\/blueprints>/);
  const scope = block ? block[1] : text;
  return new Set([...scope.matchAll(/<blueprint\s+id="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * Blueprint id → the storyboard roles it is documented to serve. Used when a
 * scene declares a narrative purpose and brag has to offer motion that fits it.
 */
export function blueprintRoles(root = requireSkillsRoot()) {
  const file = path.join(root, "hyperframes-animation", "blueprints-index.md");
  const text = fs.readFileSync(file, "utf8");
  const out = new Map();
  for (const m of text.matchAll(/<blueprint\s+id="([^"]+)"\s+roles="([^"]*)"/g)) {
    out.set(
      m[1],
      m[2]
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    );
  }
  return out;
}

/**
 * Tier-B transition names, read from the JSON block the injector itself reads.
 * A seam that names anything else will not survive stamping.
 */
export function transitionNames(root = requireSkillsRoot()) {
  const file = path.join(root, "hyperframes-animation", "transitions", "TRANSITION-REGISTRY.md");
  const text = fs.readFileSync(file, "utf8");
  const names = new Set();
  for (const fence of text.matchAll(/```json\s*([\s\S]*?)```/g)) {
    let parsed;
    try {
      parsed = JSON.parse(fence[1]);
    } catch {
      continue;
    }
    const collect = (node) => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (node && typeof node === "object") {
        if (typeof node.name === "string") names.add(node.name);
        Object.values(node).forEach(collect);
      }
    };
    collect(parsed);
  }
  return names;
}

/* ------------------------------------------------------------------ shelling out */

function which(cmd) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
  });
  return probe.status === 0 ? probe.stdout.trim().split(/\r?\n/)[0] : null;
}

export function ffmpegAvailable() {
  return Boolean(which("ffmpeg"));
}

export function ffprobeAvailable() {
  return Boolean(which("ffprobe"));
}

/** Pinned HyperFrames invocation, so a project re-renders identically later. */
export const HYPERFRAMES_PIN = process.env.BRAG_HYPERFRAMES_PIN ?? "hyperframes@0.7.88";

export function hyperframesVersion() {
  try {
    return execFileSync("npx", ["--yes", HYPERFRAMES_PIN, "--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 180_000,
      shell: process.platform === "win32",
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Run a HyperFrames subcommand in `cwd`.
 * @returns {{status: number, stdout: string, stderr: string}}
 */
export function hyperframes(args, { cwd, timeout = 900_000, inherit = false } = {}) {
  const res = spawnSync("npx", ["--yes", HYPERFRAMES_PIN, ...args], {
    cwd,
    encoding: "utf8",
    timeout,
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  return {
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

/**
 * Locate a Chrome the seam gate can drive.
 *
 * The gate finds Chrome itself on most machines but fails hard with
 * "no Chrome found (set CHROME_PATH)" when the only browsers present are the
 * ones HyperFrames and puppeteer downloaded into their own caches — which is
 * the normal state of a machine that has only ever rendered through the CLI.
 */
export function chromePath() {
  if (process.env.CHROME_PATH && exists(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const home = os.homedir();
  const roots = [
    path.join(home, ".cache", "puppeteer", "chrome"),
    path.join(home, ".cache", "hyperframes", "chrome"),
    path.join(home, ".cache", "puppeteer", "chrome-headless-shell"),
  ];
  const names = new Set(["chrome.exe", "chrome", "chrome-headless-shell.exe", "chrome-headless-shell"]);

  const search = (dir, depth = 0) => {
    if (depth > 4 || !exists(dir)) return null;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? 1 : -1));
    } catch {
      return null;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isFile() && names.has(e.name)) return p;
      if (e.isDirectory()) {
        const hit = search(p, depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  };

  for (const root of roots) {
    const hit = search(root);
    if (hit) return hit;
  }

  for (const p of [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ]) {
    if (exists(p)) return p;
  }
  return null;
}

/**
 * The seam gate spawns its own preview server, and that spawn is unreliable on
 * repeated invocations: the same bytes verified once and then failed twice in a
 * row with "HF runtime player never appeared". It is an infrastructure flake,
 * not a finding about the composition, and treating it as one sent this build
 * chasing a scene-id rule that did not exist.
 *
 * So exactly this message is retried, and nothing else. Any real seam failure
 * still fails on the first attempt.
 */
const FLAKE = /runtime player never appeared/i;

function runSeamGate({ cwd, ledger }) {
  const chrome = chromePath();
  const res = spawnSync(
    process.execPath,
    [seamGateScript(), "verify", "--ledger", ledger, "--project", "."],
    {
      cwd,
      encoding: "utf8",
      timeout: 300_000,
      env: chrome ? { ...process.env, CHROME_PATH: chrome } : process.env,
    },
  );
  return { status: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

const pause = (ms) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    /* deliberately blocking: this runs between two child processes */
  }
};

/**
 * Reap orphaned HyperFrames preview servers.
 *
 * Every `check` and every gate run leaves one behind, and they accumulate
 * until a new one cannot come up — which is what the "runtime player never
 * appeared" flake actually is. They are orphans of brag's own child processes,
 * so brag cleans them up, but only once the flake has been seen and never as a
 * matter of course: someone may be running a preview server on purpose.
 */
function reapPreviewServers() {
  const self = new Set([String(process.pid), String(process.ppid)]);
  let killed = 0;
  try {
    if (process.platform === "win32") {
      const list = spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | " +
            "Where-Object { $_.CommandLine -like '*hyperframes*' } | " +
            "Select-Object -ExpandProperty ProcessId",
        ],
        { encoding: "utf8", timeout: 30_000 },
      );
      const pids = String(list.stdout || "")
        .split(/\r?\n/u)
        .map((p) => p.trim())
        .filter((p) => p && !self.has(p));
      for (const pid of pids) {
        const res = spawnSync("taskkill", ["/PID", pid, "/T", "/F"], { encoding: "utf8", timeout: 15_000 });
        if (res.status === 0) killed++;
      }
    } else {
      const res = spawnSync("pkill", ["-f", "hyperframes.*preview"], { encoding: "utf8", timeout: 15_000 });
      if (res.status === 0) killed++;
    }
  } catch {
    /* Best effort: failing to reap is not worth failing the build over. */
  }
  return killed;
}

/** Run motion-doctrine's seam gate over a composition directory. */
export function verifySeams({ cwd, ledger = "ledger.json", attempts = 3 }) {
  let result;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    result = runSeamGate({ cwd, ledger });
    if (result.status === 0) return { ...result, attempts: attempt };
    if (!FLAKE.test(result.stdout + result.stderr)) return { ...result, attempts: attempt };
    if (attempt < attempts) {
      const killed = reapPreviewServers();
      if (killed) warn(`seam gate could not start; reaped ${killed} orphaned preview server(s) and retrying`);
      pause(2500);
    }
  }
  return {
    ...result,
    attempts,
    stderr:
      `${result.stderr}

The seam gate could not start its preview server in ${attempts} attempts. ` +
      "That is an environment problem rather than a fault in the composition; " +
      "check for a stray preview server still holding a port.",
  };
}
