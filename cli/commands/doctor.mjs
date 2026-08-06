/**
 * brag doctor — is this environment fit to produce a video?
 *
 * HyperFrames is a moving upstream. Brag reads its rule indices at runtime
 * rather than vendoring them, which is correct but means a renamed file or a
 * changed index format degrades brag silently: an empty vocabulary still
 * "works", it just produces compositions that cite nothing. Doctor's job is to
 * turn that class of failure into an exit code.
 */

import {
  HYPERFRAMES_PIN,
  blueprintIds,
  ffmpegAvailable,
  ffprobeAvailable,
  hyperframesVersion,
  requiredPaths,
  ruleIds,
  skillsRoot,
  transitionNames,
} from "../lib/hyperframes.mjs";
import { EXIT, exists, isJsonMode, emitJson, say, warn } from "../lib/util.mjs";

/** An index that parses to fewer than this is a format change, not a small library. */
const FLOOR = { rules: 20, blueprints: 8, transitions: 4 };

export async function run({ flags }) {
  const checks = [];
  const add = (id, ok, note, { fatal = true } = {}) =>
    checks.push({ id, ok, note, fatal });

  /* -------------------------------------------------- node + media tooling */

  const major = Number(process.versions.node.split(".")[0]);
  add("node", major >= 22, `node ${process.versions.node} (need >= 22)`);
  add("ffmpeg", ffmpegAvailable(), ffmpegAvailable() ? "on PATH" : "not on PATH — rendering and poster extraction need it");
  add("ffprobe", ffprobeAvailable(), ffprobeAvailable() ? "on PATH" : "not on PATH — render verification needs it");

  /* -------------------------------------------------- the skill pack */

  const root = skillsRoot();
  add("skills-root", Boolean(root), root ?? "no directory contains hyperframes-core and hyperframes-animation");

  if (root) {
    for (const { id, file, why } of requiredPaths(root)) {
      add(`path:${id}`, exists(file), exists(file) ? file : `missing ${file} — ${why}`);
    }

    /* ------------------------------------------------ vocabulary size */

    try {
      const rules = await ruleIds();
      add(
        "vocab:rules",
        rules.size >= FLOOR.rules,
        `${rules.size} motion rules` +
          (rules.size >= FLOOR.rules ? "" : ` — expected at least ${FLOOR.rules}; the index format probably changed`),
      );
    } catch (e) {
      add("vocab:rules", false, e.message);
    }

    try {
      const blueprints = blueprintIds(root);
      add(
        "vocab:blueprints",
        blueprints.size >= FLOOR.blueprints,
        `${blueprints.size} scene blueprints` +
          (blueprints.size >= FLOOR.blueprints ? "" : ` — expected at least ${FLOOR.blueprints}`),
      );
    } catch (e) {
      add("vocab:blueprints", false, e.message);
    }

    try {
      const transitions = transitionNames(root);
      add(
        "vocab:transitions",
        transitions.size >= FLOOR.transitions,
        `${transitions.size} registry transitions` +
          (transitions.size >= FLOOR.transitions ? "" : ` — expected at least ${FLOOR.transitions}`),
      );
    } catch (e) {
      add("vocab:transitions", false, e.message);
    }
  }

  /* -------------------------------------------------- hyperframes itself */

  const version = flags.quick ? null : hyperframesVersion();
  if (!flags.quick) {
    add(
      "hyperframes",
      Boolean(version),
      version ? `${HYPERFRAMES_PIN} responds (${version})` : `\`npx ${HYPERFRAMES_PIN}\` did not respond`,
      { fatal: false },
    );
  }

  /* -------------------------------------------------- report */

  const failed = checks.filter((c) => !c.ok && c.fatal);
  const soft = checks.filter((c) => !c.ok && !c.fatal);

  if (isJsonMode()) {
    emitJson({ ok: failed.length === 0, checks });
  } else {
    for (const c of checks) {
      const mark = c.ok ? "ok  " : c.fatal ? "FAIL" : "warn";
      say(`  ${mark}  ${c.id.padEnd(22)} ${c.note}`);
    }
    say("");
    if (failed.length === 0 && soft.length === 0) say("Environment is fit.");
    else if (failed.length === 0) say("Usable, with warnings above.");
    else say(`${failed.length} blocking problem${failed.length === 1 ? "" : "s"} above.`);
  }

  for (const c of soft) warn(`${c.id}: ${c.note}`);

  return failed.length === 0 ? EXIT.OK : EXIT.ENV;
}
