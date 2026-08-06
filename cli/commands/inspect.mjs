/**
 * brag inspect — classify the product surface and extract verified truth.
 *
 * Two phases. `--emit` runs the deterministic scan and writes a task spec.
 * `--accept` validates the returned product model and, more importantly,
 * re-checks it against the filesystem: a source that does not exist, or a
 * verbatim string that is not actually in the file it claims, fails here
 * rather than at render time.
 */

import fs from "node:fs";
import path from "node:path";
import { scanProduct } from "../lib/inspect/scan.mjs";
import { resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { EXIT, gateError, report, warn } from "../lib/util.mjs";

const TASK = "product_model";

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();
  return flags.accept ? accept(project) : emit(project);
}

/* ------------------------------------------------------------------ emit */

function emit(project) {
  const signals = scanProduct(project.targetRoot);
  project.write("signals.json", signals);

  const best = signals.surface.best;
  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: "Build the product model",
    objective:
      "Establish what this product is, who it is for, and exactly which claims a video is " +
      "allowed to make about it. Everything downstream — concepts, scenes, the fidelity " +
      "check — resolves against this document, so a claim with no source is worse than a " +
      "missing claim.",
    instructions: [
      "Read the scan below, then read the files it points at. The scan finds signals; it does not understand the product.",
      "Classify `surface_type`. The scan's ranking is evidence, not a verdict — override it if the evidence is thin, but say why in your reply to the user.",
      "For a `cli` surface, treat the terminal as the product interface, not as supporting material. The same holds for an `api` and its request/response exchange, and a `library` and its call site.",
      "Write `problem` in the user's terms, not the feature's absence. \"Context is lost when switching agents\" is a problem; \"lacks a context store\" is not.",
      "For every claim the video might make, add a `proof` entry with real evidence and an honest `strength`. Prefer `measured` and `demonstrated`; mark anything you inferred as `inferred`.",
      "List `visual_surfaces` — the things that can actually be put on screen — and how each would be captured.",
      "Extract `verbatim_copy`: strings that must appear exactly, each with the file it came from. Set `whitespace_significant` for aligned CLI output, trees and code.",
      "Fill `forbidden_claims` with anything true-adjacent but unsupported, and anything the project explicitly does not claim about itself.",
      "If the project ships a logo, check whether it survives on a dark background and record `logo_usable_on_dark`.",
    ],
    schemaName: "product_model",
    context: signals,
    rejects: [
      "A `proof` entry whose evidence file does not exist.",
      "A `verbatim_copy` string that is not byte-for-byte present in its stated source file.",
      "`surface_type: \"mixed\"` without `primary_surface`.",
      "Marketing language in `one_line` or `problem`. Use the project's own vocabulary.",
    ],
  });

  report(
    {
      ok: true,
      mode: "emit",
      spec: specPath,
      answer: project.answerPath(TASK),
      surface_guess: best,
      signals_path: project.path("signals.json"),
    },
    [
      `Scanned ${signals.file_count} files.`,
      best
        ? `  surface signals: ${signals.surface.scored.map((s) => `${s.surface}(${s.score})`).join("  ")}`
        : "  no strong surface signal — classification is entirely yours",
      signals.git ? `  ${signals.git.recent_commits.length} commits of real history available` : "",
      `  ${signals.candidate_commands.length} candidate commands, ${signals.palette.length} palette entries`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON it asks for, then:`,
      "  brag inspect --accept",
    ].filter(Boolean),
  );
  return EXIT.OK;
}

/* ------------------------------------------------------------------ accept */

function accept(project) {
  const model = acceptTaskAnswer({ project, name: TASK, schemaName: "product_model" });
  const problems = [];
  const root = project.targetRoot;
  const fileOf = (src) => path.join(root, src.file);

  /* Every source must exist. A model that cites a file it invented is exactly
     the failure this stage exists to prevent. */
  const checkSource = (src, label) => {
    if (!fs.existsSync(fileOf(src))) problems.push(`${label} cites ${src.file}, which does not exist`);
  };

  for (const p of model.proof) {
    for (const ev of p.evidence) checkSource(ev, `proof "${p.id}"`);
  }
  for (const v of model.verbatim_copy) checkSource(v.source, `verbatim "${v.id}"`);
  if (model.identity?.logo) checkSource(model.identity.logo, "identity.logo");

  /* Verbatim strings must actually be verbatim. */
  for (const v of model.verbatim_copy) {
    const abs = fileOf(v.source);
    if (!fs.existsSync(abs)) continue;
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (text.includes(v.text)) continue;
    const collapsed = text.replace(/\s+/g, " ");
    if (collapsed.includes(v.text.replace(/\s+/g, " ").trim())) {
      problems.push(
        `verbatim "${v.id}" matches ${v.source.file} only after collapsing whitespace — ` +
          "fix the text, because the fidelity check compares exactly",
      );
    } else {
      problems.push(`verbatim "${v.id}" is not present in ${v.source.file}`);
    }
  }

  if (model.surface_type === "mixed" && !model.primary_surface) {
    problems.push('surface_type is "mixed" but primary_surface is not set');
  }

  /* Classification disagreement is a warning: the scan only counts files,
     the model actually read them. */
  const signals = project.read("signals.json", { optional: true });
  const best = signals?.surface?.best;
  if (best && best !== model.surface_type && model.surface_type !== "mixed") {
    warn(
      `scan ranked "${best}" highest but the model says "${model.surface_type}". ` +
        "That may be right — say why in your reply.",
    );
  }

  if (problems.length) {
    throw gateError(
      "the product model does not hold up against the filesystem:\n" +
        problems.map((p) => `  - ${p}`).join("\n") +
        `\n\nFix ${path.relative(root, project.answerPath(TASK))} and re-run \`brag inspect --accept\`.`,
    );
  }

  project.write("product_model.json", {
    ...model,
    generated_at: model.generated_at ?? new Date().toISOString(),
  });

  const measured = model.proof.filter((p) => p.strength === "measured").length;
  report(
    {
      ok: true,
      mode: "accept",
      surface_type: model.surface_type,
      proof_count: model.proof.length,
      verbatim_count: model.verbatim_copy.length,
      path: project.path("product_model.json"),
    },
    [
      `Recorded product_model.json — surface: ${model.surface_type}`,
      `  ${model.proof.length} proofs (${measured} measured), ${model.verbatim_copy.length} verbatim strings, all sources verified`,
      `  ${model.visual_surfaces.length} visual surfaces`,
      "",
      "Next: brag position --emit",
    ],
  );
  return EXIT.OK;
}
