/**
 * The emit/accept contract.
 *
 * The CLI never asks a model to *do* something inline. It writes a task spec —
 * instructions, the inlined JSON Schema, and the exact output path — then the
 * agent writes JSON to that path, then the CLI validates and recomputes
 * whatever it can compute itself. A stage's completion criterion is always the
 * artifact existing on disk and validating, never a claim that it was done.
 *
 * This mirrors the DISPATCH/WAIT contract HyperFrames uses for frame workers.
 */

import fs from "node:fs";
import path from "node:path";
import { assertValid, loadSchema } from "./schema.mjs";
import { REPO_ROOT } from "./state.mjs";
import {
  artifactError,
  exists,
  readJson,
  writeFileAtomic,
} from "./util.mjs";

const REFERENCE_DIR = path.join(REPO_ROOT, "skills", "brag", "references");

/**
 * Inline a creative-doctrine reference so there is exactly one copy of each
 * rule and the agent cannot skip reading it.
 */
export function reference(name) {
  const file = path.join(REFERENCE_DIR, name.endsWith(".md") ? name : `${name}.md`);
  if (!exists(file)) {
    throw artifactError(`missing reference: ${file}`);
  }
  return fs.readFileSync(file, "utf8").trim();
}

const fence = (lang, body) => "```" + lang + "\n" + body + "\n```";

/**
 * Write a task spec for the agent.
 *
 * @param {object} o
 * @param {import("./state.mjs").Project} o.project
 * @param {string} o.name          task id, e.g. "product_model"
 * @param {string} o.title
 * @param {string} o.objective     one paragraph: what this artifact is for
 * @param {string[]} o.instructions ordered, imperative
 * @param {string} o.schemaName    schema the answer must satisfy
 * @param {object} [o.context]     facts the CLI already established
 * @param {string[]} [o.references] reference file names to inline verbatim
 * @param {string[]} [o.rejects]   things that will fail validation, stated plainly
 * @returns {{specPath: string, answerPath: string}}
 */
export function emitTaskSpec({
  project,
  name,
  title,
  objective,
  instructions = [],
  schemaName,
  context = null,
  references = [],
  rejects = [],
}) {
  const specPath = project.specPath(name);
  const answerPath = project.answerPath(name);
  const schema = loadSchema(REPO_ROOT, schemaName);

  const relAnswer = path.relative(project.targetRoot, answerPath).split(path.sep).join("/");

  const parts = [
    `# Task: ${title}`,
    "",
    objective.trim(),
    "",
    "## What to do",
    "",
    ...instructions.map((s, i) => `${i + 1}. ${s}`),
    "",
    "## Where the answer goes",
    "",
    `Write a single JSON document to \`${relAnswer}\`, then run the \`--accept\` form of`,
    `the command that produced this spec. Nothing is recorded until that command exits 0.`,
    "",
  ];

  if (context) {
    parts.push(
      "## What the CLI already established",
      "",
      "These are facts, not suggestions. Do not contradict them; if one is wrong,",
      "say so in your reply to the user rather than silently changing it.",
      "",
      fence("json", JSON.stringify(context, null, 2)),
      "",
    );
  }

  if (rejects.length) {
    parts.push(
      "## What will be rejected",
      "",
      ...rejects.map((r) => `- ${r}`),
      "",
    );
  }

  for (const ref of references) {
    parts.push(`## Reference: ${ref}`, "", reference(ref), "");
  }

  parts.push(
    "## Schema the answer must satisfy",
    "",
    fence("json", JSON.stringify(schema, null, 2)),
    "",
  );

  writeFileAtomic(specPath, parts.join("\n"));
  return { specPath, answerPath };
}

/**
 * Read, validate, and hand back the agent's answer.
 *
 * @param {object} o
 * @param {import("./state.mjs").Project} o.project
 * @param {string} o.name
 * @param {string} o.schemaName
 * @returns {object}
 */
export function acceptTaskAnswer({ project, name, schemaName }) {
  const answerPath = project.answerPath(name);
  if (!exists(answerPath)) {
    throw artifactError(
      `expected an answer at ${answerPath}.\n` +
        `Read ${project.specPath(name)}, write the JSON it asks for, then re-run with --accept.`,
    );
  }
  const data = readJson(answerPath);
  return assertValid(REPO_ROOT, schemaName, data, {
    source: path.basename(answerPath),
  });
}

/**
 * Standard two-phase command body. `build` collects deterministic context,
 * `finish` runs on --accept with the validated answer.
 *
 * @returns {{mode: "emit"|"accept", value: any}}
 */
export function twoPhase({ project, flags, name, schemaName, emit, accept }) {
  if (flags.accept) {
    const answer = acceptTaskAnswer({ project, name, schemaName });
    return { mode: "accept", value: accept(answer) };
  }
  return { mode: "emit", value: emit() };
}
