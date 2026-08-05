/**
 * brag revise — change one thing without rebuilding everything.
 *
 * The value is in what does *not* change. A revision that quietly regenerates
 * the whole film costs you every decision you had already accepted, so this
 * takes an intent, scopes it to named scenes, and proves afterwards that every
 * frame it did not name came out byte-identical.
 *
 * That proof is only possible because compiling is deterministic. It is the
 * property the first phase was built around, and this is what it was for.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diffFingerprints, fingerprintTree } from "../lib/determinism.mjs";
import { resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { EXIT, gateError, report, say, writeJson } from "../lib/util.mjs";

const TASK = "revision";

export async function run({ flags, args }) {
  const project = resolveProject(flags);
  project.load();
  return flags.accept ? accept(project, flags) : emit(project, args?.join(" "));
}

function emit(project, intent) {
  if (!intent) {
    throw gateError('say what to change: brag revise "make the opening more aggressive"');
  }
  const graph = project.read("scene_graph.json");
  const concept = project.read("selected_concept.json", { optional: true });

  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: `Revise: ${intent}`,
    objective:
      "Apply one change to the scene graph and touch nothing else. Name the scenes you are " +
      "changing before you change them; everything unnamed must come out of the compiler " +
      "byte-identical, and that is checked.",
    instructions: [
      `The change asked for: ${intent}`,
      "List the scene ids you intend to touch in `scenes_touched`, then give the replacement scene objects in `scenes`.",
      "Do not renumber, reorder or rename scenes. A revision that reshuffles the film is a rewrite wearing a smaller name.",
      "Keep every `required_proof` intact: a revision may change how a scene argues, never whether it still shows its evidence.",
      "Obey the locked concept's visual rule and forbidden motifs — those did not change because the copy did.",
      "If the change cannot be made within the named scenes, say so in `blocked` rather than widening the scope quietly.",
    ],
    schemaName: "revision",
    context: {
      intent,
      concept: concept
        ? { visual_rule: concept.visual_rule, forbidden_motifs: concept.forbidden_motifs }
        : null,
      scenes: graph.scenes.map((s) => ({
        id: s.id,
        role: s.role,
        purpose: s.purpose,
        duration: s.duration,
        reading: s.reading,
        required_proof: s.required_proof,
      })),
    },
    rejects: [
      "Touching a scene not listed in `scenes_touched`.",
      "Dropping a `required_proof` from any scene.",
      "Adding or removing scenes — that is a new storyboard, not a revision.",
    ],
  });

  report(
    { ok: true, mode: "emit", spec: specPath, intent },
    [
      `Revision: ${intent}`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON, then:`,
      "  brag revise --accept",
    ],
  );
  return EXIT.OK;
}

function accept(project, flags) {
  const answer = acceptTaskAnswer({ project, name: TASK, schemaName: "revision" });
  if (answer.blocked) {
    throw gateError(
      `the revision reports it cannot be made within the scenes it named: ${answer.blocked}`,
    );
  }

  const graph = project.read("scene_graph.json");
  const touched = new Set(answer.scenes_touched);
  const replacements = new Map(answer.scenes.map((s) => [s.id, s]));

  for (const id of replacements.keys()) {
    if (!touched.has(id)) {
      throw gateError(`scene "${id}" was changed but not declared in scenes_touched`);
    }
  }
  const known = new Set(graph.scenes.map((s) => s.id));
  for (const id of touched) {
    if (!known.has(id)) throw gateError(`scenes_touched names "${id}", which is not a scene`);
  }

  const next = {
    ...graph,
    scenes: graph.scenes.map((scene) => {
      const replacement = replacements.get(scene.id);
      if (!replacement) return scene;
      /* Proof survives a revision by construction rather than by review. */
      return { ...scene, ...replacement, required_proof: scene.required_proof };
    }),
  };

  const index = project.read("compositions/index.json", { optional: true });
  const variant =
    flags.variant ?? Object.keys(index?.variants ?? {})[0] ?? next.format?.name ?? "landscape";
  const outDir = project.path("compositions", variant);

  const before = fingerprintTree(outDir);
  project.write("scene_graph.json", next);
  project.write(path.join("tasks", "scene_graph.json"), next);

  say(`Recompiling ${variant} after touching ${[...touched].join(", ")}…`);
  const res = spawnSync(
    process.execPath,
    [
      path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "brag.mjs"),
      "compose",
      "-C",
      project.targetRoot,
      "--variant",
      variant,
      "--skip-gates",
    ],
    { stdio: "inherit" },
  );
  if (res.status !== 0) return res.status ?? EXIT.GATE;

  /* The whole claim of a scoped revision, checked: anything not named should
     be identical, and a frame file belongs to the scene whose id it carries. */
  const after = fingerprintTree(outDir);
  const diff = diffFingerprints(before, after);
  const strayed = diff.changed.filter((file) => {
    if (!file.startsWith("compositions/frames/")) return false;
    return ![...touched].some((id) => file.includes(id));
  });

  if (strayed.length) {
    throw gateError(
      "a scoped revision changed frames it did not name:\n" +
        strayed.map((f) => `  - ${f}`).join("\n") +
        "\n\nThat means the change was not really scoped, and nothing else it claims can be trusted.",
    );
  }

  report(
    {
      ok: true,
      mode: "accept",
      intent: answer.intent,
      touched: [...touched],
      changed: diff.changed,
      untouched_identical: true,
    },
    [
      `Revised ${touched.size} scene(s): ${[...touched].join(", ")}`,
      `  ${diff.changed.length} file(s) changed, and every frame outside those scenes is byte-identical.`,
      "",
      `Next: brag deliver --variant ${variant}`,
    ],
  );
  return EXIT.OK;
}
