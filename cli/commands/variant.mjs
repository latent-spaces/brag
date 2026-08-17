/**
 * brag variant — recompose the same story for another shape.
 *
 * A variant is a recompile, not a copied directory. One HyperFrames project is
 * one canvas size, but the scene graph sits upstream of any project, so a
 * different format re-solves layout and timing from the same source rather
 * than re-cutting a finished film.
 *
 * What changes is framing and density, never the argument: the scenes, their
 * order, their proof requirements and their reading floors are the same in
 * every shape.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minimumDuration } from "../lib/solve/timing.mjs";
import { resolveProject } from "../lib/state.mjs";
import { EXIT, gateError, report, say, writeJson } from "../lib/util.mjs";

/** Shapes worth having, and what each is for. */
export const FORMATS = {
  landscape: { width: 1920, height: 1080, fps: 30, why: "the default: embeds, README, a link in a thread" },
  vertical: { width: 1080, height: 1920, fps: 30, why: "a feed that autoplays muted and fills the screen" },
  square: { width: 1080, height: 1080, fps: 30, why: "timelines that crop anything taller" },
};

export async function run({ flags, args }) {
  const project = resolveProject(flags);
  project.load();

  const name = args?.[0];
  if (!name || !FORMATS[name]) {
    throw gateError(
      `name a format: ${Object.keys(FORMATS).join(", ")}.\n` +
        Object.entries(FORMATS)
          .map(([k, f]) => `  ${k.padEnd(10)} ${f.width}x${f.height} — ${f.why}`)
          .join("\n"),
    );
  }

  const format = FORMATS[name];
  const graph = project.read("scene_graph.json");
  const recomposed = recompose(graph, { format, name });

  const dropped = graph.scenes.length - recomposed.scenes.length;
  if (dropped) {
    say(`Dropped ${dropped} scene(s) that could not earn their place in this shape.`);
  }

  /* Written where compose reads it, then compose does the rest — one compiler,
     so a variant cannot drift from the shape it is a variant of. */
  writeJson(project.path("tasks", "scene_graph.json"), recomposed);
  writeJson(project.path("scene_graph.json"), recomposed);

  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "brag.mjs");
  const res = spawnSync(
    process.execPath,
    [cli, "compose", "-C", project.targetRoot, "--variant", name, ...(flags["skip-gates"] ? ["--skip-gates"] : [])],
    { stdio: "inherit" },
  );
  if (res.status !== 0) return res.status ?? EXIT.GATE;

  report(
    { ok: true, variant: name, format, scenes: recomposed.scenes.length },
    ["", `Composed "${name}" — ${format.width}x${format.height}, ${recomposed.scenes.length} scenes.`, "", `Next: brag deliver --variant ${name}`],
  );
  return EXIT.OK;
}

/* ------------------------------------------------------------------ solve */

/**
 * Re-solve the graph for a shape.
 *
 * Objects carry their own framing intent, so the solve is a matter of reading
 * it: an object marked `omit` in this orientation leaves, and a scene left
 * with nothing that matters goes with it — unless it is carrying required
 * proof, which no reshape is allowed to drop.
 */
export function recompose(graph, { format, name }) {
  const portrait = format.height > format.width;
  const orientation = portrait ? "portrait" : "landscape";

  const objects = (graph.objects ?? []).filter(
    (o) => (o.layout?.[orientation] ?? "primary") !== "omit",
  );
  const kept = new Set(objects.map((o) => o.id));

  const scenes = graph.scenes
    .map((scene) => ({
      ...scene,
      objects: (scene.objects ?? []).filter((o) => kept.has(o.id)),
    }))
    .filter((scene) => {
      /* Proof outranks framing. A shape that cannot show the evidence is the
         wrong shape, not a reason to quietly ship the claim without it. */
      if ((scene.required_proof ?? []).length) return true;
      return scene.objects.length > 0 || (scene.reading ?? []).length > 0;
    })
    .map((scene) => ({
      /* A narrower frame carries fewer words per line, so copy needs longer,
         not shorter. The floor moves with the shape. */
      ...scene,
      duration: Math.max(scene.duration, minimumDuration(scene) * (portrait ? 1.1 : 1)),
    }));

  const ids = new Set(scenes.map((s) => s.id));
  const seams = (graph.seams ?? []).filter((s) => ids.has(s.from) && ids.has(s.to));

  return {
    ...graph,
    /* `why` is documentation for the operator choosing a shape, not part of
       the compiled format. */
    format: { width: format.width, height: format.height, fps: format.fps, name },
    objects,
    scenes,
    seams,
    audio: { ...(graph.audio ?? {}), silent_comprehension: portrait ? true : graph.audio?.silent_comprehension },
  };
}
