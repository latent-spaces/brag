/**
 * Deterministic product scan.
 *
 * This half of inspection is code, not judgment: file signals, extracted
 * strings with byte offsets, real git history, real palette values. The model
 * is only asked for the things a scan genuinely cannot decide — who this is
 * for, what problem it solves, which of the extracted strings actually matter.
 *
 * Every string this returns carries a source, because §8.4 has to be able to
 * trace a rendered word back to a file.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { exists } from "../util.mjs";

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", ".next", "out", "target",
  "__pycache__", ".venv", "venv", ".tox", "coverage", ".cache",
  "brag", "brag-output", ".pytest_cache", ".mypy_cache", "vendor",
]);

const MAX_FILE_BYTES = 512 * 1024;

/* ------------------------------------------------------------------ walking */

function walk(root, { maxDepth = 6 } = {}) {
  const files = [];
  const stack = [{ dir: root, rel: "", depth: 0 }];
  while (stack.length) {
    const { dir, rel, depth } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      /* Dot-directories are skipped except the few that describe the project
         rather than the machine it was checked out on. */
      if (e.name.startsWith(".") && ![".github", ".claude-plugin"].includes(e.name)) continue;
      if (SKIP_DIRS.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth < maxDepth) stack.push({ dir: abs, rel: r, depth: depth + 1 });
      } else if (e.isFile()) {
        files.push(r);
      }
    }
  }
  return files.sort();
}

const readIf = (root, rel) => {
  const abs = path.join(root, rel);
  if (!exists(abs)) return null;
  try {
    const stat = fs.statSync(abs);
    if (stat.size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
};

const parseJsonIf = (root, rel) => {
  const text = readIf(root, rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** Byte offset of `needle` in a file, so a claim can be traced exactly. */
function locate(root, rel, needle) {
  const text = readIf(root, rel);
  if (!text) return { file: rel };
  const idx = text.indexOf(needle);
  if (idx < 0) return { file: rel };
  return {
    file: rel,
    line: text.slice(0, idx).split("\n").length,
    byte_start: Buffer.byteLength(text.slice(0, idx)),
    byte_end: Buffer.byteLength(text.slice(0, idx + needle.length)),
  };
}

/* ------------------------------------------------------------------ surface signals */

/**
 * Score each candidate surface from file evidence. Classification stays the
 * model's call, but it has to argue against these numbers rather than guess.
 */
function surfaceSignals(root, files) {
  const has = (re) => files.filter((f) => re.test(f));
  const pkg = parseJsonIf(root, "package.json");
  const pyproject = readIf(root, "pyproject.toml");
  const cargo = readIf(root, "Cargo.toml");

  const evidence = { cli: [], website: [], library: [], api: [], desktop: [], mobile: [], game: [], research: [] };
  const note = (surface, why) => evidence[surface].push(why);

  if (pkg?.bin) note("cli", `package.json declares bin: ${Object.keys(pkg.bin).join(", ")}`);
  if (pkg?.main || pkg?.exports) note("library", "package.json declares an entry point for importers");
  if (pyproject && /^\s*\[project\.scripts\]/m.test(pyproject)) note("cli", "pyproject declares [project.scripts]");
  if (pyproject && /^\s*\[project\]/m.test(pyproject) && !/\[project\.scripts\]/.test(pyproject))
    note("library", "pyproject declares a distributable package");
  if (cargo && /\[\[bin\]\]/.test(cargo)) note("cli", "Cargo.toml declares [[bin]]");
  if (cargo && /\[lib\]/.test(cargo)) note("library", "Cargo.toml declares [lib]");

  const argparse = has(/\.(py|mjs|js|ts|go|rs)$/).filter((f) => {
    const t = readIf(root, f);
    return t && /(argparse|commander|yargs|click\.|cobra|clap::|parseArgs|ArgumentParser)/.test(t);
  });
  if (argparse.length) note("cli", `argument parsing in ${argparse.slice(0, 3).join(", ")}`);

  const html = has(/(^|\/)(index|home)\.html$/i);
  if (html.length) note("website", `${html.length} top-level HTML page(s)`);
  if (has(/^(src\/)?(pages|app|routes)\//).length) note("website", "a routed page directory");
  if (pkg?.dependencies?.next || pkg?.dependencies?.astro || pkg?.dependencies?.["@sveltejs/kit"])
    note("website", "a site framework in dependencies");

  const openapi = has(/(openapi|swagger)\.(ya?ml|json)$/i);
  if (openapi.length) note("api", `an API description at ${openapi[0]}`);
  if (has(/(routes?|endpoints?|controllers?)\//).length && !html.length)
    note("api", "server route modules with no page directory");

  if (has(/\.(swift|kt)$/).length || exists(path.join(root, "Info.plist")))
    note("mobile", "platform-native mobile sources");
  if (pkg?.dependencies?.electron || pkg?.devDependencies?.electron) note("desktop", "electron in dependencies");
  if (has(/\.(unity|uasset|tscn|godot)$/).length) note("game", "game-engine assets");
  if (has(/\.(tex|bib)$/).length || has(/^(paper|thesis)/i).length) note("research", "paper sources");

  const scored = Object.entries(evidence)
    .map(([surface, why]) => ({ surface, score: why.length, evidence: why }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return { scored, best: scored[0]?.surface ?? null, ambiguous: scored.length > 1 && scored[0]?.score === scored[1]?.score };
}

/* ------------------------------------------------------------------ extraction */

/** CSS custom properties — the project's palette, in its own words. */
function extractPalette(root, files) {
  const out = [];
  for (const rel of files.filter((f) => /\.(css|scss)$/.test(f)).slice(0, 12)) {
    const text = readIf(root, rel);
    if (!text) continue;
    for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\))/g)) {
      out.push({ role: m[1], value: m[2], source: locate(root, rel, m[0]) });
    }
  }
  const seen = new Set();
  return out.filter((c) => (seen.has(c.role) ? false : (seen.add(c.role), true))).slice(0, 24);
}

function extractFonts(root, files) {
  const fonts = new Set();
  for (const rel of files.filter((f) => /\.(css|scss|html)$/.test(f)).slice(0, 12)) {
    const text = readIf(root, rel);
    if (!text) continue;
    for (const m of text.matchAll(/font-family\s*:\s*([^;]+);/g)) fonts.add(m[1].trim());
    for (const m of text.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/g))
      fonts.add(decodeURIComponent(m[1]).replace(/\+/g, " "));
  }
  return [...fonts].slice(0, 8);
}

/**
 * Fenced code blocks in the README — usually the real commands.
 *
 * Every pattern here tolerates CRLF. Checked-out files on Windows routinely
 * have it, and a `\n`-only fence pattern silently finds zero code blocks,
 * which reads as "this project documents no commands" rather than as a bug.
 * Offsets are still computed against the raw bytes, so nothing is normalised.
 */
function extractReadmeBlocks(root) {
  const readme = ["README.md", "readme.md", "Readme.md"].find((f) => exists(path.join(root, f)));
  if (!readme) return { file: null, headings: [], blocks: [], first_paragraph: null };
  const text = readIf(root, readme) ?? "";

  const headings = [...text.matchAll(/^(#{1,6})[ \t]+(.+?)[ \t]*$/gm)].map((m) => ({
    level: m[1].length,
    text: m[2].trim(),
  }));

  const blocks = [...text.matchAll(/```([a-zA-Z]*)[ \t]*\r?\n([\s\S]*?)```/g)]
    .map((m) => ({ lang: m[1].toLowerCase() || null, body: m[2].replace(/\s+$/, "") }))
    .filter((b) => b.body.length < 800)
    .slice(0, 20);

  /* The opening line often sits after a centred logo, a badge row, or a title,
     so scan the whole document rather than only the pre-heading block. */
  const firstPara = text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .find(
      (p) =>
        p.length > 40 &&
        !p.startsWith("<") &&
        !p.startsWith("#") &&
        !p.startsWith("```") &&
        !p.startsWith(">") &&
        !p.startsWith("|") &&
        !/^[[!]/.test(p) &&
        !/^\s*[-*]\s/.test(p),
    );

  return { file: readme, headings: headings.slice(0, 30), blocks, first_paragraph: firstPara ?? null };
}

/** Command-shaped lines in README fences — candidates for a terminal tape. */
function candidateCommands(root, readme) {
  const cmds = [];
  for (const block of readme.blocks) {
    if (block.lang && !["bash", "sh", "shell", "console", "text", ""].includes(block.lang)) continue;
    for (const raw of block.body.split(/\r?\n/)) {
      const line = raw.replace(/^\s*\$\s?/, "").trim();
      if (!line || line.startsWith("#") || line.length > 160) continue;
      if (!/^[a-z][a-z0-9._-]*(\s|$)/i.test(line)) continue;
      cmds.push({ command: line, source: locate(root, readme.file, raw.trim()) });
    }
  }
  const seen = new Set();
  return cmds.filter((c) => (seen.has(c.command) ? false : (seen.add(c.command), true))).slice(0, 24);
}

function gitInfo(root) {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  if (!run(["rev-parse", "--is-inside-work-tree"])) return null;
  const log = run(["log", "--oneline", "-30", "--no-decorate"]) ?? "";
  return {
    url: run(["remote", "get-url", "origin"]),
    default_branch: run(["rev-parse", "--abbrev-ref", "HEAD"]),
    recent_commits: log
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [sha, ...rest] = l.split(" ");
        return { sha, subject: rest.join(" ") };
      }),
  };
}

function findLogos(root, files) {
  return files
    .filter((f) => /(logo|icon|mark|wordmark)[^/]*\.(png|svg|jpg|jpeg|webp)$/i.test(f))
    .slice(0, 6);
}

/* ------------------------------------------------------------------ entry point */

/**
 * @returns {object} signals — everything a scan can establish without judgment
 */
export function scanProduct(root) {
  const files = walk(root);
  const pkg = parseJsonIf(root, "package.json");
  const readme = extractReadmeBlocks(root);
  const surfaces = surfaceSignals(root, files);

  const manifest =
    pkg ??
    (readIf(root, "pyproject.toml")
      ? { _from: "pyproject.toml", raw: readIf(root, "pyproject.toml").slice(0, 4000) }
      : null);

  return {
    scanned_at: new Date().toISOString(),
    root: path.basename(root),
    file_count: files.length,
    surface: surfaces,
    manifest: pkg
      ? {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          bin: pkg.bin ? Object.keys(pkg.bin) : null,
          license: pkg.license,
          keywords: pkg.keywords ?? null,
        }
      : manifest,
    readme,
    candidate_commands: candidateCommands(root, readme),
    palette: extractPalette(root, files),
    fonts: extractFonts(root, files),
    logos: findLogos(root, files),
    docs: files.filter((f) => /^docs?\//.test(f)).slice(0, 40),
    changelog: exists(path.join(root, "CHANGELOG.md")) ? "CHANGELOG.md" : null,
    license: ["LICENSE", "LICENSE.md", "LICENCE"].find((f) => exists(path.join(root, f))) ?? null,
    git: gitInfo(root),
    top_level: files.filter((f) => !f.includes("/")).slice(0, 40),
  };
}
