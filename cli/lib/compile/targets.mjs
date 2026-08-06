/**
 * Compile targets: the scene graph becomes files HyperFrames already reads.
 *
 * Nothing here invents a format. BRIEF.md, STORYBOARD.md, frame.md, ledger.json
 * and the motion sidecar all belong to HyperFrames or motion-doctrine; brag's
 * job is to fill them from one upstream source so a variant is a recompile
 * rather than a copied directory.
 *
 * Everything is deterministic — no timestamps, no ordering by object identity —
 * because "compile twice, get the same bytes" is the property that makes every
 * later phase debuggable.
 */

const yamlString = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const secs = (n) => `${Number(n.toFixed(2))}s`;

/** Scene start times, accumulated in graph order. */
export function withStarts(graph) {
  let t = 0;
  return graph.scenes.map((scene) => {
    const withStart = { ...scene, start: scene.start ?? t };
    t = withStart.start + scene.duration;
    return withStart;
  });
}

export const totalDuration = (graph) =>
  Number(withStarts(graph).reduce((max, s) => Math.max(max, s.start + s.duration), 0).toFixed(3));

/* ------------------------------------------------------------------ BRIEF.md */

/**
 * The intent document. Its frontmatter uses the registry vocabulary so that a
 * HyperFrames workflow finding this project can read it without translation.
 */
export function buildBrief({ model, positioning, graph, concept }) {
  const fm = [
    "---",
    "workflow: brag",
    "flow: automation",
    "storyboard: yes",
    `message: ${yamlString(positioning.angle)}`,
    `audience: ${yamlString(positioning.audience.who)}`,
    `aspect: ${graph.format.width}x${graph.format.height}`,
    `length: ${secs(totalDuration(graph))}`,
    `angle: ${yamlString(positioning.angle)}`,
    positioning.audience.destination?.length
      ? `destination: ${positioning.audience.destination.join(", ")}`
      : null,
    "---",
  ].filter(Boolean);

  const body = [
    "",
    "## Intent",
    "",
    `${model.name ?? "This product"} is ${model.one_line ?? model.mechanism}`,
    "",
    `It is for ${positioning.audience.who}. The problem: ${model.problem}`,
    "",
    `The video argues one thing: ${positioning.angle}`,
    concept ? `\nThe concept is "${concept.name}" — ${concept.central_metaphor}.` : "",
    "",
    "## Assets",
    "",
    ...(model.visual_surfaces.map((s) => `- ${s.id} — ${s.description} (${s.capture ?? "synthesized"})`)),
    "",
    "## Notes",
    "",
    "Every claim in this video resolves to a proof in the product model:",
    "",
    ...positioning.claims.map((c) => `- ${c.text} → proof \`${c.proof_ref}\``),
    "",
    ...(model.forbidden_claims?.length
      ? [
          "Do not say, imply, or paraphrase:",
          "",
          ...model.forbidden_claims.map((c) => `- ${c}`),
          "",
        ]
      : []),
    ...(positioning.avoid?.length
      ? ["Framings to avoid:", "", ...positioning.avoid.map((a) => `- ${a}`), ""]
      : []),
  ];

  return [...fm, ...body].join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

/* ------------------------------------------------------------------ STORYBOARD.md */

/**
 * One `## Frame N` per scene. Known keys land on the documented bullets; the
 * whole brag payload rides under unknown keys, which the parser preserves
 * verbatim in each frame's `extra` — which is why no parallel format is needed.
 */
export function buildStoryboard({ graph, positioning, model }) {
  const scenes = withStarts(graph);
  const arc = scenes.map((s) => s.role ?? s.id).join(" → ");

  const lines = [
    "---",
    `format: ${graph.format.width}x${graph.format.height}`,
    `duration: ${secs(totalDuration(graph))}`,
    `message: ${yamlString(positioning.angle)}`,
    `arc: ${arc}`,
    `audience: ${yamlString(positioning.audience.who)}`,
    "mode: autonomous",
    "---",
    "",
  ];

  scenes.forEach((scene, i) => {
    const objects = (scene.objects ?? [])
      .map((o) => (o.focal ? `${o.id}*` : o.id))
      .join(", ");
    const reading = scene.reading ?? [];

    lines.push(`## Frame ${i + 1} — ${scene.title ?? scene.id}`);
    lines.push("");
    lines.push(`- scene: ${scene.purpose}`);
    lines.push(`- duration: ${secs(scene.duration)}`);
    lines.push(`- transition_in: ${transitionInFor(graph, scene)}`);
    lines.push(`- status: outline`);
    lines.push(`- src: compositions/frames/${frameFile(i, scene)}`);
    lines.push(`- poster: ${Number((scene.duration * 0.6).toFixed(2))}s`);

    /* Unknown keys — preserved under `extra`, read back by brag's own tooling. */
    lines.push(`- brag_scene_id: ${scene.id}`);
    if (scene.role) lines.push(`- brag_role: ${scene.role}`);
    if (scene.required_proof?.length) lines.push(`- brag_proof: ${scene.required_proof.join(", ")}`);
    if (objects) lines.push(`- brag_objects: ${objects}`);
    if (scene.motif) lines.push(`- brag_motif: ${scene.motif}`);
    if (scene.continuity_from) lines.push(`- brag_continuity_in: ${scene.continuity_from}`);
    if (scene.continuity_to) lines.push(`- brag_continuity_out: ${scene.continuity_to}`);
    if (scene.motion?.blueprint) lines.push(`- brag_blueprint: ${scene.motion.blueprint}`);
    if (scene.motion?.rules?.length) lines.push(`- brag_rules: ${scene.motion.rules.join(", ")}`);
    if (scene.quiet) lines.push(`- brag_quiet: true`);
    lines.push(`- brag_start: ${Number(scene.start.toFixed(2))}`);

    lines.push("");
    lines.push(scene.purpose);
    if (scene.motion?.intent) lines.push("", scene.motion.intent);

    if (reading.length) {
      lines.push("", "Must be readable here:");
      for (const r of reading) {
        const floor = r.min_reading_s ?? readingFloor(r.text);
        lines.push(`- "${r.text}" — settled for at least ${secs(floor)}`);
      }
    }

    if (scene.required_proof?.length) {
      lines.push("", "Proof this frame must actually show:");
      for (const id of scene.required_proof) {
        const proof = model.proof.find((p) => p.id === id);
        lines.push(`- ${id}: ${proof?.claim ?? "(unknown proof)"} [${proof?.strength ?? "?"}]`);
      }
    }

    lines.push("");
  });

  return lines.join("\n");
}

export const frameFile = (i, scene) =>
  `${String(i + 1).padStart(2, "0")}-${scene.id}.html`;

function transitionInFor(graph, scene) {
  const seam = (graph.seams ?? []).find((s) => s.to === scene.id);
  if (!seam) return "cut";
  return seam.technique ?? "cut";
}

/**
 * The reading floor: about 0.3s per word, never under 0.8s for a short label.
 * Stated once here so the storyboard, the motion sidecar and the timing solver
 * cannot drift apart.
 */
export function readingFloor(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0.8;
  if (words <= 3) return 0.8;
  return Math.max(1.2, Number((words * 0.3).toFixed(2)));
}

/** Gap between consecutive reading lines inside one scene. */
const STAGGER = 0.45;
const ENTER = 0.4;

/**
 * Schedule a scene's reading lines.
 *
 * Forward from the scene's start: the first line settles as soon as its
 * entrance completes, and each subsequent line follows one stagger later. Any
 * spare time therefore lands at the *end*, as a settled hold.
 *
 * Two earlier versions of this were wrong in instructive ways. Computing each
 * line's settle time independently from the scene end silently reordered them,
 * because a nine-word sentence has a longer floor than a four-word command and
 * so landed first. Solving backwards from the end fixed the order but packed
 * every line against the closing frames, leaving the opening seconds empty —
 * which a review caught as a dead shot at the scene's own midpoint. Copy
 * arrives promptly and then holds; slack belongs at the end, never the start.
 *
 * @returns {{index, text, floor, enter, settled, tight}[]}
 */
export function scheduleReading(scene) {
  const lines = scene.reading?.length
    ? scene.reading
    : [{ text: scene.title ?? scene.purpose }];
  const end = scene.start + scene.duration;
  const floors = lines.map((r) => r.min_reading_s ?? readingFloor(r.text));

  return lines.map((r, i) => {
    const settled = Number((scene.start + ENTER + i * STAGGER).toFixed(2));
    return {
      index: i,
      text: r.text,
      floor: floors[i],
      enter: Number(Math.max(scene.start, settled - ENTER).toFixed(2)),
      settled,
      /* Tight when the scene ends before this line has been on screen long
         enough to read. */
      tight: end - settled < floors[i] - 0.01,
    };
  });
}

/** Scenes whose copy does not fit their duration. */
export function tightScenes(graph) {
  return withStarts(graph)
    .map((scene) => ({ scene, lines: scheduleReading(scene).filter((l) => l.tight) }))
    .filter((r) => r.lines.length);
}

/* ------------------------------------------------------------------ frame.md */

/**
 * The design truth — palette, type ramp, composition rules. In Phase 3 this is
 * generated from the chosen visual world; for now it is derived from the
 * product's own identity, because a video that invents a palette is already
 * off-brand.
 */
export function buildFrameMd({ model, graph, world = null }) {
  const palette = model.identity?.palette ?? [];
  const pick = (role, fallback) =>
    palette.find((p) => p.role === role || p.role.endsWith(`-${role}`))?.value ?? fallback;

  const bg = pick("bg", "#0c1018");
  const text = pick("text", "#e7edf7");
  const muted = pick("muted", "#94a3b8");
  const accent = pick("accent", "#5272f2");

  return [
    `# Design truth — ${model.name ?? "the product"}`,
    "",
    world ? `Visual world: **${world.name}**. ${world.summary}` : "Derived from the product's own interface, not invented.",
    "",
    "## Palette",
    "",
    "| Role | Value | Source |",
    "| --- | --- | --- |",
    `| background | \`${bg}\` | ${sourceOf(palette, "bg")} |`,
    `| text | \`${text}\` | ${sourceOf(palette, "text")} |`,
    `| muted | \`${muted}\` | ${sourceOf(palette, "muted")} |`,
    `| accent | \`${accent}\` | ${sourceOf(palette, "accent")} |`,
    "",
    ...(palette.length
      ? ["Full extracted palette:", "", ...palette.map((p) => `- \`--${p.role}: ${p.value}\``), ""]
      : ["No palette was extracted from the source, so these are neutral defaults.", ""]),
    "## Type",
    "",
    `- Display: ${renderableFont(model.identity?.display_font, "Inter, system-ui, sans-serif")}`,
    `- Body: ${renderableFont(model.identity?.body_font, "Inter, system-ui, sans-serif")}`,
    `- Mono: ${renderableFont(model.identity?.mono_font, "JetBrains Mono, monospace")}`,
    "",
    "## Composition rules",
    "",
    `- Canvas ${graph.format.width}×${graph.format.height} at ${graph.format.fps}fps.`,
    "- Text a viewer must read is settled — entered, not yet exiting — for its full reading floor.",
    "- Contrast is a gate, not a preference: 4.5:1 for normal text, 3:1 at 24px+.",
    ...(model.identity?.logo_usable_on_dark === false
      ? [
          "- The project's logo is dark-on-transparent and disappears on this background. Use the wordmark in type instead of the mark.",
        ]
      : []),
    "",
    "## What this product looks like",
    "",
    ...model.visual_surfaces.map((s) => `- **${s.id}** (${s.kind}) — ${s.description}`),
    "",
  ].join("\n");
}

const sourceOf = (palette, role) => {
  const hit = palette.find((p) => p.role === role || p.role.endsWith(`-${role}`));
  return hit?.source?.file ? `\`${hit.source.file}\`` : "default";
};

/* ------------------------------------------------------------------ ledger.json */

/**
 * One row per seam, in motion-doctrine's schema. `seam-stamp` writes the actual
 * tweens from this and `seam-gate` verifies them numerically — which is why
 * brag describes seams as vectors and never hand-authors the motion.
 */
export function buildLedger({ graph }) {
  const scenes = withStarts(graph);
  const startOf = new Map(scenes.map((s) => [s.id, s.start]));

  const axisDir = (vector) => {
    const dir = { left: -1, up: -1, out: -1, right: 1, down: 1, in: 1 }[vector.direction] ?? -1;
    return { axis: vector.axis, dir };
  };

  return {
    fps: graph.format.fps,
    seams: (graph.seams ?? []).map((seam) => {
      const { axis, dir } = axisDir(seam.vector);
      const row = {
        id: `${seam.from}→${seam.to}`,
        cut: Number((seam.at ?? startOf.get(seam.to) ?? 0).toFixed(3)),
        technique: seam.technique ?? `cut-the-curve ${seam.vector.direction.toUpperCase()}`,
        exit: { selector: `#el-${seam.from}`, axis, dir },
        entry: { selector: `#el-${seam.to}`, axis, dir },
      };
      /* A carrier claim needs two real elements — one in each scene — whose
         geometry matches across the cut. Naming a single selector describes
         the incoming scene's own stage, which moves *because* of the seam, and
         the gate rightly reads that as a jump rather than a hand-off. So the
         ledger only asserts a carrier when the graph names both sides; the
         plain `carrier` field stays as intent for whoever builds the frames. */
      if (seam.carrier_out && seam.carrier_in) {
        row.carrier = { out: `#${seam.carrier_out}`, in: `#${seam.carrier_in}` };
      }
      return row;
    }),
  };
}

/* ------------------------------------------------------------------ motion.json */

/**
 * Reading floors and proof requirements become gating assertions.
 *
 * This is the line that turns "intelligent timing" from a promise into an exit
 * code: `check` seeks the same timeline the renderer uses and fails when a
 * line a viewer must read has not appeared by the time it is supposed to.
 */
export function buildMotionJson({ graph }) {
  const scenes = withStarts(graph);
  const assertions = [];

  for (const scene of scenes) {
    assertions.push({
      kind: "appearsBy",
      selector: `#el-${scene.id}`,
      bySec: Number((scene.start + 0.5).toFixed(2)),
    });

    /* The deadline, not brag's own tween schedule.
       The requirement is that a line is on screen long enough to read: it must
       appear by the last moment that still leaves its reading floor before the
       scene ends. Asserting `settled` instead pinned the frame to the exact
       entrance the scaffold happened to author, so a designed frame that
       revealed the same line a quarter-second differently — and held it far
       longer than the floor — failed a readability check it comfortably met. */
    scheduleReading(scene).forEach((line) => {
      const deadline = scene.start + scene.duration - line.floor;
      assertions.push({
        kind: "appearsBy",
        selector: `#read-${scene.id}-${line.index}`,
        bySec: Number(Math.max(line.settled, deadline).toFixed(2)),
      });
    });
  }

  for (let i = 1; i < scenes.length; i++) {
    assertions.push({ kind: "before", a: `#el-${scenes[i - 1].id}`, b: `#el-${scenes[i].id}` });
  }

  /* No `staysInFrame` anywhere.
     It has no time window — it fails if a box *ever* leaves the canvas once
     visible — and in a film whose scenes travel on exit, every element in
     every non-final scene leaves by design. Asserting it on the wrapper
     contradicts the seam; asserting it on the text contradicts the seam one
     level down. The real question — "is the copy where a viewer can read it
     while it is being read?" — is answered by measuring ink in the rendered
     frames at their settled times, which is what layer 2 does.

     One frozen-shot check for the whole film, not one per scene.
     `keepsMoving` has no time window, so a per-scene assertion samples the
     wrapper across the entire timeline — including the minutes before that
     scene starts — and reports the wait as a frozen shot. Scoping it to the
     root asks the real question: does the video ever stop moving?
     The allowance is the longest legitimate settled hold, because copy held
     still so it can be read is not a dead shot. */
  const longestHold = Math.max(2, ...scenes.flatMap((s) => scheduleReading(s).map((l) => l.floor)));
  assertions.push({
    kind: "keepsMoving",
    withinSelector: "#root",
    maxStaticSec: Number((longestHold + 1.2).toFixed(2)),
  });

  return { duration: totalDuration(graph), assertions };
}

/**
 * A font stack the renderer can actually supply.
 *
 * The product's own CSS stack is the right *intent* and the wrong thing to
 * hand a frame worker verbatim. A browser falls back silently through a stack
 * until something is installed; the renderer does not have the machine's fonts
 * and fails the build on a family it cannot resolve. One project shipping
 * `ui-monospace, SF Mono, Cascadia Mono, Menlo, monospace` put an unrenderable
 * family into the design truth, and every frame built from it inherited the
 * failure.
 *
 * So the extracted stack is filtered to families the renderer resolves, and
 * the fallback stands in when nothing survives.
 */
const RENDERABLE = new Set([
  "inter", "roboto", "roboto mono", "open sans", "lato", "montserrat", "poppins",
  "source sans pro", "source code pro", "raleway", "oswald", "merriweather",
  "playfair display", "ibm plex sans", "ibm plex mono", "ibm plex serif",
  "jetbrains mono", "fira code", "fira sans", "space grotesk", "space mono",
  "dm sans", "dm mono", "work sans", "nunito", "karla", "manrope", "rubik",
  "system-ui", "sans-serif", "serif", "monospace", "ui-monospace", "ui-sans-serif",
  /* Aliased to a bundled face at render time rather than rejected — the
     checker reports these as info, so keeping them preserves the project's
     intent without risking the build. */
  "sf mono", "sf pro", "menlo", "consolas", "segoe ui", "helvetica", "helvetica neue", "arial",
]);

export function renderableFont(declared, fallback) {
  if (!declared) return fallback;
  const kept = String(declared)
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .filter((f) => f && RENDERABLE.has(f.toLowerCase()));
  if (!kept.length) return fallback;
  /* A generic family has to close the stack, or the renderer has nothing to
     fall back to when the named one is missing. */
  const generic = fallback.split(",").at(-1).trim();
  return kept.includes(generic) ? kept.join(", ") : [...kept, generic].join(", ");
}
