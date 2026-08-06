/**
 * brag storyboard — build the scene graph.
 *
 * This is where the locked concept becomes a connected film. Scenes carry
 * purpose, the proof they must show, what a viewer has to read, and continuity
 * edges; seams carry vectors and carriers. A flat list of slides is what this
 * format exists to prevent.
 */

import path from "node:path";
import { blueprintIds, ruleIds, transitionNames } from "../lib/hyperframes.mjs";
import { minimumDuration } from "../lib/solve/timing.mjs";
import { resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { getWorld, worldsFor } from "../lib/worlds.mjs";
import { EXIT, gateError, report } from "../lib/util.mjs";

const TASK = "scene_graph";

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();
  return flags.accept ? accept(project) : emit(project, flags);
}

async function emit(project, flags) {
  const model = project.read("product_model.json");
  const positioning = project.read("positioning.json");
  const concept = project.read("selected_concept.json", { optional: true });

  const world = getWorld(
    flags.world ?? concept?.suggested_world ?? worldsFor(model.surface_type)[0].id,
  );
  const rules = [...(await ruleIds())].sort();

  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: "Build the scene graph",
    objective:
      "Turn the locked concept into a connected film: scenes with a purpose, the proof each " +
      "must show, what has to be readable, and how every cut travels. Not a list of slides — " +
      "the edges between scenes are the part that makes it a film.",
    instructions: [
      "Every scene needs a `purpose` that says why it exists. A scene that cannot state one should be cut.",
      "Put the strongest evidence on screen: `required_proof` names proof ids from the product model, and the fidelity check will look for them in the rendered frame.",
      "`reading` lists what a viewer must actually read. Keep it short — a scene lasts as long as its copy needs plus a beat, and the solver will trim anything longer.",
      "Give scenes `continuity_from` / `continuity_to` so the film has edges, and one `seam` per cut with an axis and direction.",
      "Vary how the cuts travel. A film whose every seam is the same move reads as a slideshow, and the sameness gate will refuse it.",
      "Where an object persists across a cut, name it as the seam's `carrier` — but only if it is genuinely the same size on both sides, or the seam gate will call it drift.",
      "Cite motion by id from the installed pack. Inventing a name fails at compose.",
      "Mark the one deliberately quiet scene with `quiet: true`.",
      "Obey the locked concept's `visual_rule`, and never describe a scene using one of its `forbidden_motifs`.",
    ],
    schemaName: "scene_graph",
    context: {
      concept: concept
        ? {
            id: concept.id,
            central_metaphor: concept.central_metaphor,
            visual_rule: concept.visual_rule,
            emotional_arc: concept.emotional_arc,
            forbidden_motifs: concept.forbidden_motifs,
            beats: concept.beats,
          }
        : null,
      world: {
        id: world.id,
        summary: world.summary,
        camera_model: world.camera_model,
        depth_levels: world.depth_levels,
        transition_families: world.transition_families,
        layouts: world.layouts.map((l) => l.id),
      },
      angle: positioning.angle,
      claims: positioning.claims,
      proofs: model.proof.map((p) => ({ id: p.id, claim: p.claim, strength: p.strength })),
      verbatim_copy: model.verbatim_copy,
      visual_surfaces: model.visual_surfaces,
      available_motion_rules: rules,
      available_blueprints: [...blueprintIds()].sort(),
      available_transitions: [...transitionNames()].sort(),
      format: { width: 1920, height: 1080, fps: 30 },
    },
    rejects: [
      "A scene with no `purpose`.",
      "A `required_proof` id that is not in the product model.",
      "A motion rule or blueprint id that is not in the lists above.",
      "Every seam using the same technique.",
      "A scene described using one of the concept's forbidden motifs.",
    ],
  });

  report(
    { ok: true, mode: "emit", spec: specPath, world: world.id },
    [
      `World: ${world.id} — ${world.layouts.length} layouts, cuts may be ${world.transition_families.join(" / ")}.`,
      `${rules.length} motion rules available to cite.`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON, then:`,
      "  brag storyboard --accept",
    ],
  );
  return EXIT.OK;
}

function accept(project) {
  const graph = acceptTaskAnswer({ project, name: TASK, schemaName: "scene_graph" });
  const model = project.read("product_model.json");

  /* Cheap structural checks here; compose repeats the full set against the
     installed motion vocabulary once a world is chosen. */
  const problems = [];
  const proofIds = new Set(model.proof.map((p) => p.id));
  for (const scene of graph.scenes) {
    for (const ref of scene.required_proof ?? []) {
      if (!proofIds.has(ref)) problems.push(`scene "${scene.id}" requires unknown proof "${ref}"`);
    }
    const min = minimumDuration(scene);
    if (scene.duration < min - 0.01) {
      problems.push(
        `scene "${scene.id}" is ${scene.duration}s but needs ${min}s to show its copy`,
      );
    }
  }
  if ((graph.seams ?? []).length < graph.scenes.length - 1) {
    problems.push(
      `${graph.scenes.length} scenes but only ${(graph.seams ?? []).length} seams — every cut needs one`,
    );
  }

  if (problems.length) {
    throw gateError("the scene graph does not hold together:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  }

  project.write("scene_graph.json", graph);

  report(
    { ok: true, mode: "accept", scenes: graph.scenes.length, seams: (graph.seams ?? []).length },
    [
      `Recorded scene_graph.json — ${graph.scenes.length} scenes, ${(graph.seams ?? []).length} seams.`,
      ...graph.scenes.map((s) => `  ${s.id.padEnd(16)} ${s.duration}s  ${s.purpose.slice(0, 60)}`),
      "",
      "Next: brag compose",
    ],
  );
  return EXIT.OK;
}
