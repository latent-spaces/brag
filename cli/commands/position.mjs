/**
 * brag position — audience, angle, and the claim-to-source map.
 *
 * The gate here is mechanical: every claim the video intends to make must name
 * a proof id that exists in the product model. That is the difference between
 * a video that is persuasive and one that is defensible, and it is checked in
 * code rather than trusted.
 */

import path from "node:path";
import { resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { EXIT, gateError, report } from "../lib/util.mjs";

const TASK = "positioning";
const truncate = (s, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s);

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();
  return flags.accept ? accept(project) : emit(project);
}

function emit(project) {
  const model = project.read("product_model.json");

  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: "Position the product",
    objective:
      "Decide who this video is for, the one sentence it argues, and which claims it will " +
      "make. Each claim must name a proof id from the product model — this is what stops a " +
      "good-sounding line entering the edit unsupported.",
    instructions: [
      "Pick the narrowest audience the video can serve well. A video for everyone directs like a video for no one.",
      "Write `angle` as one sentence the video argues, not a summary of features. It should be arguable — something a reasonable person could disagree with before watching.",
      "List every claim the video will make, each bound to a `proof_ref`. If a claim you want has no proof, either drop it or go back and add the proof with real evidence.",
      "Set `verbatim: true` on claims that must be shown in the product's own words rather than paraphrased.",
      "`destination` changes direction: a feed autoplay cannot assume sound, a README embed can assume patience.",
      "Use `avoid` for framings that would land but are wrong — categories the product is not in, comparisons it does not want to invite.",
    ],
    schemaName: "positioning",
    context: {
      product: {
        name: model.name,
        one_line: model.one_line,
        surface_type: model.surface_type,
        problem: model.problem,
        mechanism: model.mechanism,
      },
      available_proofs: model.proof.map((p) => ({
        id: p.id,
        claim: p.claim,
        strength: p.strength,
        shows_well: p.shows_well ?? null,
      })),
      forbidden_claims: model.forbidden_claims,
    },
    rejects: [
      "A claim whose `proof_ref` is not one of the available proof ids listed above.",
      "A claim that restates or paraphrases anything in `forbidden_claims`.",
      "An `angle` that no one could disagree with.",
    ],
  });

  report(
    { ok: true, mode: "emit", spec: specPath, answer: project.answerPath(TASK) },
    [
      `${model.proof.length} proofs available to build claims from.`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON, then:`,
      "  brag position --accept",
    ],
  );
  return EXIT.OK;
}

function accept(project) {
  const positioning = acceptTaskAnswer({ project, name: TASK, schemaName: "positioning" });
  const model = project.read("product_model.json");

  const known = new Set(model.proof.map((p) => p.id));
  const problems = [];

  for (const claim of positioning.claims) {
    if (!known.has(claim.proof_ref)) {
      problems.push(
        `claim "${truncate(claim.text)}" cites proof "${claim.proof_ref}", which is not in the product model ` +
          `(have: ${[...known].join(", ")})`,
      );
    }
  }

  /* A forbidden claim reappearing as a positioning claim is the most likely
     route by which an unsupported line survives into the edit. */
  const normalise = (s) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  for (const forbidden of model.forbidden_claims ?? []) {
    const f = normalise(forbidden);
    if (!f) continue;
    for (const claim of positioning.claims) {
      if (normalise(claim.text).includes(f)) {
        problems.push(`claim "${truncate(claim.text)}" restates a forbidden claim: "${forbidden}"`);
      }
    }
  }

  if (problems.length) {
    throw gateError(
      "positioning does not resolve against the product model:\n" +
        problems.map((p) => `  - ${p}`).join("\n") +
        `\n\nFix ${path.relative(project.targetRoot, project.answerPath(TASK))} and re-run \`brag position --accept\`.`,
    );
  }

  const unusedStrong = model.proof.filter(
    (p) => p.strength === "measured" && !positioning.claims.some((c) => c.proof_ref === p.id),
  );

  project.write("positioning.json", {
    ...positioning,
    generated_at: positioning.generated_at ?? new Date().toISOString(),
  });

  report(
    {
      ok: true,
      mode: "accept",
      claims: positioning.claims.length,
      unused_measured_proofs: unusedStrong.map((p) => p.id),
      path: project.path("positioning.json"),
    },
    [
      `Recorded positioning.json — ${positioning.claims.length} claims, every one bound to a proof.`,
      `  angle: ${positioning.angle}`,
      unusedStrong.length
        ? `  note: ${unusedStrong.length} measured proof(s) unused (${unusedStrong
            .map((p) => p.id)
            .join(", ")}) — measured evidence is the strongest thing you have`
        : "",
      "",
      "Next: brag concepts --emit",
    ].filter(Boolean),
  );
  return EXIT.OK;
}
