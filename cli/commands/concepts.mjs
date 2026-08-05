/**
 * brag concepts — at least three genuinely different ways to make this video.
 *
 * The step exists because going straight from inspection to one storyboard
 * produces the same film every time. On accept, distinctness is measured
 * rather than trusted: three descriptions of the same idea are rejected before
 * anything gets scored.
 */

import path from "node:path";
import { checkDistinct, DISTINCTNESS_CEILING } from "../lib/score/concept.mjs";
import { Memory, resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { loadWorlds } from "../lib/worlds.mjs";
import { EXIT, gateError, report } from "../lib/util.mjs";

const TASK = "concepts";

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();
  return flags.accept ? accept(project) : emit(project);
}

function emit(project) {
  const model = project.read("product_model.json");
  const positioning = project.read("positioning.json");
  const history = new Memory().recentFingerprints(10);

  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: "Propose at least three ways to make this video",
    objective:
      "Find genuinely different films that all tell the truth about this product. They should " +
      "be hard to choose between. If one is obviously best, the other two were not tried.",
    instructions: [
      "Each concept needs a central metaphor — one idea every scene serves. \"Context is a baton passed between agents\" is a metaphor; \"it is fast and reliable\" is a claim.",
      "Give each a visual rule strong enough that breaking it would be obvious, and an emotional arc: where the viewer starts and ends.",
      "Fill `forbidden_motifs` with what this concept must never drift into — usually the generic version of itself.",
      "Answer `why_this_product` honestly. If the concept would work for any product in the category, it is a template, not a concept.",
      "Vary the *kind* of film, not just the words. Three concepts that are all narrated typography are one concept.",
      "Suggest a visual world where one obviously fits, from the list below.",
      "Name each concept's `risk`: the most likely way it fails in execution.",
    ],
    schemaName: "concept",
    context: {
      product: {
        name: model.name,
        surface_type: model.surface_type,
        problem: model.problem,
        mechanism: model.mechanism,
        visual_surfaces: model.visual_surfaces,
      },
      angle: positioning.angle,
      audience: positioning.audience,
      claims: positioning.claims,
      proofs: model.proof.map((p) => ({ id: p.id, claim: p.claim, strength: p.strength })),
      forbidden_claims: model.forbidden_claims,
      available_worlds: loadWorlds().map((w) => ({
        id: w.id,
        summary: w.summary,
        camera: w.camera_model,
        suits: w.suits_surfaces,
      })),
      recent_videos: history.map((f) => ({ world: f.world, motifs: f.object_motifs })),
    },
    rejects: [
      `Two concepts whose idea words overlap by ${DISTINCTNESS_CEILING * 100}% or more — that is one concept in two costumes.`,
      "A concept that reuses a world and motif set from `recent_videos`.",
      "A `central_metaphor` that is really a feature claim.",
    ],
  });

  report(
    { ok: true, mode: "emit", spec: specPath, answer: project.answerPath(TASK) },
    [
      `${loadWorlds().length} visual worlds available; ${history.length} recent video(s) to differ from.`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON, then:`,
      "  brag concepts --accept",
    ],
  );
  return EXIT.OK;
}

function accept(project) {
  const answer = acceptTaskAnswer({ project, name: TASK, schemaName: "concept" });
  const concepts = answer.concepts;

  const ids = new Set(concepts.map((c) => c.id));
  if (ids.size !== concepts.length) throw gateError("two concepts share an id");

  const distinct = checkDistinct(concepts);
  if (!distinct.ok) {
    throw gateError(
      "these are not different concepts:\n" +
        distinct.pairs
          .map(
            (p) =>
              `  - "${p.a}" and "${p.b}" share ${(p.overlap * 100).toFixed(0)}% of their idea words ` +
              `(ceiling ${DISTINCTNESS_CEILING * 100}%)`,
          )
          .join("\n") +
        "\n\nChange the kind of film, not the wording.",
    );
  }

  project.write("concepts.json", answer);
  for (const concept of concepts) project.write(path.join("concepts", `${concept.id}.json`), concept);

  report(
    { ok: true, mode: "accept", concepts: concepts.map((c) => c.id) },
    [
      `Recorded ${concepts.length} distinct concepts:`,
      ...concepts.map((c) => `  ${c.id.padEnd(20)} ${c.central_metaphor}`),
      "",
      "Next: brag select --emit",
    ],
  );
  return EXIT.OK;
}
