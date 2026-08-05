/**
 * brag compose — compile the scene graph into a HyperFrames project.
 *
 * This is the boundary made mechanical. Brag decides what the video is about,
 * what must be readable, what must be proven, and how each cut travels; from
 * here down HyperFrames owns the DOM, the timeline and the render.
 *
 * The compile is deterministic: same graph in, byte-identical project out.
 * That property is what lets a later phase claim a scoped revision touched
 * only the scenes it named.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { buildFrameStub, buildIndexHtml, projectFiles } from "../lib/compile/composition.mjs";
import {
  buildBrief,
  buildFrameMd,
  buildLedger,
  buildMotionJson,
  buildStoryboard,
  frameFile,
  totalDuration,
  withStarts,
} from "../lib/compile/targets.mjs";
import {
  HYPERFRAMES_PIN,
  blueprintIds,
  hyperframes,
  ruleIds,
  seamStampScript,
  transitionNames,
  verifySeams,
} from "../lib/hyperframes.mjs";
import { assertValid } from "../lib/schema.mjs";
import { assertSameness, fingerprint } from "../lib/score/fingerprint.mjs";
import { getWorld, worldsFor } from "../lib/worlds.mjs";
import { applyTiming, solveTiming } from "../lib/solve/timing.mjs";
import { Memory, REPO_ROOT, resolveProject } from "../lib/state.mjs";
import {
  EXIT,
  ensureDir,
  gateError,
  report,
  say,
  stableStringify,
  warn,
  writeFileAtomic,
  writeJson,
} from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  const info = project.load();

  const model = project.read("product_model.json");
  const positioning = project.read("positioning.json");
  let graph = assertValid(REPO_ROOT, "scene_graph", project.read("scene_graph.json"), {
    source: "scene_graph.json",
  });
  const concept = project.read("selected_concept.json", { optional: true });

  await validateGraph({ graph, model, concept });

  /* Solve timing before anything is written, so the composition, the motion
     sidecar and the ledger all read one answer rather than three. */
  const plan = solveTiming(graph, {
    targetDuration: flags.duration ? Number(flags.duration) : null,
    strongCues: graph.audio?.strong_cue_locks ?? [],
  });
  if (!plan.ok) {
    throw gateError(
      "the edit does not fit its own copy:\n" +
        plan.violations.map((v) => `  - ${v.message}`).join("\n") +
        "\n\nThe reading floor is not negotiable; change the copy or the ceiling.",
    );
  }
  for (const r of plan.relaxations) warn(r.message);
  project.write("timing_plan.json", plan);
  graph = applyTiming(graph, plan);

  const world = getWorld(
    flags.world ?? graph.visual_world ?? worldsFor(model.surface_type)[0].id,
  );

  /* Is this the same video again? Measured before anything is rendered, so a
     repeat costs seconds rather than a full render. */
  const fp = fingerprint({ graph, world });
  const sameness = assertSameness(fp, new Memory().recentFingerprints(10));
  for (const a of sameness.advisories) warn(`${a.message} — ${a.fix}`);
  project.write("fingerprint.json", fp);

  const variant =
    flags.variant ?? graph.format.name ?? `${graph.format.width}x${graph.format.height}`;
  const outDir = project.path("compositions", variant);
  ensureDir(outDir);

  /* ---------------------------------------------------------- write targets */

  const written = [];
  const put = (rel, contents) => {
    writeFileAtomic(path.join(outDir, rel), contents);
    written.push(rel.split(path.sep).join("/"));
  };

  for (const [name, contents] of Object.entries(
    projectFiles({ name: `${info.name}-${variant}`, graph, pin: HYPERFRAMES_PIN }),
  )) {
    put(name, contents);
  }

  put("BRIEF.md", buildBrief({ model, positioning, graph, concept }));
  put("STORYBOARD.md", buildStoryboard({ graph, positioning, model }));
  put("frame.md", buildFrameMd({ model, graph, world }));
  /* Captured sessions, keyed by id, so a scene can show the real thing the
     tool printed rather than a paragraph describing it. */
  const captureManifest = project.read("captures/capture_manifest.json", { optional: true });
  const captures = Object.fromEntries(
    (captureManifest?.sessions ?? [])
      .map((entry) => [entry.id, project.read(entry.path, { optional: true })])
      .filter(([, session]) => session),
  );

  put("index.html", buildIndexHtml({ model, graph, world, captures }));
  put("ledger.json", stableStringify(buildLedger({ graph })));
  put("index.motion.json", stableStringify(buildMotionJson({ graph })));
  /* The solved graph travels with the composition it produced, so delivery
     reads the graph this variant was actually built from rather than
     whatever happens to be current in the project. */
  put("scene_graph.json", stableStringify(graph));

  const scenes = withStarts(graph);
  scenes.forEach((scene, i) => {
    put(path.join("compositions", "frames", frameFile(i, scene)), buildFrameStub({ scene, model, graph }));
  });

  const existing = project.read("compositions/index.json", { optional: true }) ?? { variants: {} };
  existing.variants[variant] = {
    path: `compositions/${variant}`,
    compiled_at: new Date().toISOString(),
    format: graph.format,
    duration: totalDuration(graph),
    scenes: scenes.length,
    seams: (graph.seams ?? []).length,
  };
  writeJson(project.path("compositions", "index.json"), existing);

  /* ---------------------------------------------------------- stamp + gates */

  if ((graph.seams ?? []).length) {
    const stamp = spawnSync(
      process.execPath,
      [seamStampScript(), "--ledger", "ledger.json", "--write", "index.html"],
      { cwd: outDir, encoding: "utf8", timeout: 120_000 },
    );
    if (stamp.status !== 0) {
      throw gateError(
        `seam-stamp could not write the seam block:\n${(stamp.stderr || stamp.stdout || "").trim()}`,
      );
    }
  }

  if (flags["skip-gates"]) {
    return finish({ project, variant, outDir, written, graph, gates: null });
  }

  say(`Compiled ${written.length} files into ${path.relative(project.targetRoot, outDir)}. Checking…`);

  const check = hyperframes(["check"], { cwd: outDir });
  const seams = (graph.seams ?? []).length
    ? verifySeams({ cwd: outDir })
    : { status: 0, stdout: "no seams to verify" };

  const gates = {
    check: { ok: check.status === 0, output: tail(check.stdout || check.stderr) },
    seam_gate: { ok: seams.status === 0, output: tail(seams.stdout || seams.stderr) },
  };

  if (!gates.check.ok || !gates.seam_gate.ok) {
    throw gateError(
      [
        "the compiled project does not pass its gates:",
        gates.check.ok ? null : `\n[hyperframes check]\n${gates.check.output}`,
        gates.seam_gate.ok ? null : `\n[seam gate]\n${gates.seam_gate.output}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return finish({ project, variant, outDir, written, graph, gates });
}

/* ------------------------------------------------------------------ validation */

/**
 * Everything checkable before a browser is involved. Cited motion ids are
 * validated against the installed pack, so a scene can never reference a rule
 * that does not exist — the failure the runtime index read exists to prevent.
 */
async function validateGraph({ graph, model, concept }) {
  const problems = [];

  /* A locked concept is a constraint, not a note. If a forbidden motif shows
     up in what the scenes say they are doing, the implementation has drifted
     back into the generic version of itself — which is the exact failure the
     lock exists to catch. */
  if (concept?.forbidden_motifs?.length) {
    const normalise = (t) => String(t).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const surface = graph.scenes
      .map((sc) => [sc.purpose, sc.title, sc.motif, sc.motion?.intent].filter(Boolean).join(" "))
      .join(" • ");
    const haystack = normalise(surface);
    for (const motif of concept.forbidden_motifs) {
      const needle = normalise(motif);
      if (needle && haystack.includes(needle)) {
        problems.push(
          `a scene describes "${motif}", which the locked concept "${concept.id}" forbids`,
        );
      }
    }
  }

  const sceneIds = new Set(graph.scenes.map((s) => s.id));
  const objectIds = new Set((graph.objects ?? []).map((o) => o.id));
  const proofIds = new Set(model.proof.map((p) => p.id));

  if (sceneIds.size !== graph.scenes.length) problems.push("two scenes share an id");

  for (const scene of graph.scenes) {
    for (const ref of scene.required_proof ?? []) {
      if (!proofIds.has(ref)) {
        problems.push(`scene "${scene.id}" requires proof "${ref}", which is not in the product model`);
      }
    }
    for (const o of scene.objects ?? []) {
      if (!objectIds.has(o.id)) {
        problems.push(`scene "${scene.id}" uses object "${o.id}", which is not declared`);
      }
    }
    for (const link of ["continuity_from", "continuity_to"]) {
      const target = scene[link];
      if (target && !sceneIds.has(target)) {
        problems.push(`scene "${scene.id}".${link} points at "${target}", which is not a scene`);
      }
    }
  }

  for (const seam of graph.seams ?? []) {
    if (!sceneIds.has(seam.from)) problems.push(`seam from "${seam.from}" — no such scene`);
    if (!sceneIds.has(seam.to)) problems.push(`seam to "${seam.to}" — no such scene`);
  }

  const cited = graph.scenes.flatMap((s) => s.motion?.rules ?? []);
  const blueprints = graph.scenes.map((s) => s.motion?.blueprint).filter(Boolean);
  if (cited.length || blueprints.length) {
    const rules = await ruleIds();
    for (const id of cited) {
      if (!rules.has(id)) {
        problems.push(`scene motion cites rule "${id}", which is not in the installed pack`);
      }
    }
    const known = blueprintIds();
    for (const id of blueprints) {
      if (!known.has(id)) {
        problems.push(`scene motion cites blueprint "${id}", which is not in the installed pack`);
      }
    }
  }

  const registry = transitionNames();
  for (const seam of graph.seams ?? []) {
    if (!seam.technique) continue;
    const base = seam.technique.split(/\s+/)[0];
    if (!registry.has(seam.technique) && !registry.has(base) && !/^(cut|morph|match-cut)/i.test(seam.technique)) {
      warn(
        `seam ${seam.from}→${seam.to} names "${seam.technique}", which is not in the transition registry ` +
          `(${[...registry].join(", ")}).`,
      );
    }
  }

  if (problems.length) {
    throw gateError("the scene graph does not resolve:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  }
}

/* ------------------------------------------------------------------ output */

function finish({ project, variant, outDir, written, graph, gates }) {
  report(
    {
      ok: true,
      variant,
      path: outDir,
      files: written.length,
      duration: totalDuration(graph),
      scenes: graph.scenes.length,
      gates,
    },
    [
      `Compiled "${variant}" — ${graph.scenes.length} scenes, ${totalDuration(graph)}s, ${written.length} files.`,
      `  ${path.relative(project.targetRoot, outDir)}`,
      gates ? "  hyperframes check: pass" : "  gates skipped",
      gates ? "  seam gate: pass" : "",
      "",
      "Next: brag deliver",
    ].filter(Boolean),
  );
  return EXIT.OK;
}

const tail = (s, lines = 30) =>
  String(s || "")
    .trimEnd()
    .split("\n")
    .slice(-lines)
    .join("\n");
