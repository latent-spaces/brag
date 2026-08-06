/**
 * Visual fingerprints and the anti-sameness gates.
 *
 * Adding templates to a system like this eventually produces more repetitive
 * templates, so repetition is measured rather than hoped against. A fingerprint
 * describes how a video is *made* — where content sits, how cuts travel, how
 * deep the frame is — not what it says. Two videos about different products can
 * still be the same video.
 *
 * The comparison is deliberately structural. Copy differs every time; that is
 * exactly why copy must not be part of the signature.
 */

import { assignLayouts } from "../worlds.mjs";
import { gateError } from "../util.mjs";

/**
 * @returns {object} fingerprint
 */
export function fingerprint({ graph, world }) {
  const scenes = graph.scenes;
  const assigned = assignLayouts(world, scenes, graph.seams ?? []);

  /* A scene that inherited its layout because something is handed into it is
     the same shot continuing, not the same shot again, so it does not count
     against the overuse ceiling. Counting it would make declaring a carrier —
     the strongest kind of continuity there is — look like repetition. */
  const layoutCounts = {};
  for (const a of assigned) {
    if (a.carried) continue;
    layoutCounts[a.layout.id] = (layoutCounts[a.layout.id] ?? 0) + 1;
  }

  const seams = graph.seams ?? [];
  const families = new Set(
    seams.map((s) => familyOf(s.technique)).filter(Boolean),
  );

  const anchors = new Set(assigned.map((a) => a.layout.anchor));
  const aligns = new Set(assigned.map((a) => a.layout.align));

  return {
    schema: "brag.fingerprint/1",
    world: world.id,
    dominant_layouts: Object.entries(layoutCounts)
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .map(([id, n]) => ({ id, scenes: n })),
    transition_families: [...families].sort(),
    camera_usage: world.camera_model,
    depth_usage: world.depth_levels,
    typography_mode: `${world.typography?.lead_family ?? "sans"}-${world.typography?.case ?? "sentence"}-${world.typography?.display_scale ?? 1}`,
    object_motifs: [
      ...new Set((graph.objects ?? []).map((o) => o.kind)),
      ...new Set(assigned.map((a) => a.layout.chrome ?? "none")),
    ].sort(),
    composition_shape: [...anchors].sort().join("/") + "|" + [...aligns].sort().join("/"),
    scene_count: scenes.length,
    carrier_seams: seams.filter((s) => s.carrier).length,
    transformation_scenes: scenes.filter(isTransformation).length,
  };
}

/** Which transition family a technique belongs to. */
export function familyOf(technique) {
  if (!technique) return "cut";
  const t = String(technique).toLowerCase();
  if (t.includes("morph") || t.includes("match")) return "morph";
  /* cut-the-curve is lateral partial travel, so it belongs with the slides
     despite the name; only a change of depth counts as a zoom. */
  if (t.includes("curve") || t.includes("slide") || t.includes("wipe")) return "slide";
  if (t.includes("zoom") || t.includes("push") || t.includes("dolly")) return "zoom";
  if (t.includes("mask") || t.includes("blind") || t.includes("reveal")) return "mask";
  if (t.includes("dissolve") || t.includes("fade") || t.includes("crossfade")) return "dissolve";
  if (t.includes("rotate") || t.includes("flip")) return "rotate";
  return "cut";
}

/**
 * A scene that transforms what is already on screen, rather than replacing it
 * with the next thing. Objects that persist across a scene boundary and change
 * state are the cheapest honest signal of this.
 */
function isTransformation(scene) {
  return (scene.objects ?? []).some(
    (o) => o.start_state && o.end_state && o.start_state !== o.end_state,
  );
}

/* ------------------------------------------------------------------ similarity */

const tokens = (fp) =>
  new Set([
    `world:${fp.world}`,
    `camera:${fp.camera_usage}`,
    `depth:${fp.depth_usage}`,
    `type:${fp.typography_mode}`,
    `shape:${fp.composition_shape}`,
    ...fp.dominant_layouts.map((l) => `layout:${l.id}`),
    ...fp.transition_families.map((f) => `family:${f}`),
    ...fp.object_motifs.map((m) => `motif:${m}`),
  ]);

/**
 * Jaccard overlap of structural tokens, 0 (nothing shared) to 1 (identical).
 */
export function similarity(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size && !tb.size) return 1;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  const union = ta.size + tb.size - shared;
  return union === 0 ? 1 : Number((shared / union).toFixed(3));
}

/* ------------------------------------------------------------------ gates */

export const SIMILARITY_CEILING = 0.45;
const LAYOUT_SHARE_CEILING = 0.4;

/**
 * @param {object} fp
 * @param {object[]} history previous fingerprints, newest first
 * @returns {{ok:boolean, violations:object[], nearest:object|null}}
 */
export function checkSameness(fp, history = []) {
  const violations = [];

  /* 1. Not too close to something already made. */
  let nearest = null;
  for (const prior of history) {
    const score = similarity(fp, prior);
    if (!nearest || score > nearest.score) nearest = { score, world: prior.world };
  }
  if (nearest && nearest.score >= SIMILARITY_CEILING) {
    violations.push({
      code: "too_similar",
      message:
        `this is ${(nearest.score * 100).toFixed(0)}% the same construction as a recent video ` +
        `(ceiling ${SIMILARITY_CEILING * 100}%, nearest used the "${nearest.world}" world)`,
      fix: "choose a different visual world, or a concept that needs a different kind of frame",
    });
  }

  /* 2. No single layout carries the film. */
  const total = fp.dominant_layouts.reduce((n, l) => n + l.scenes, 0);
  for (const layout of fp.dominant_layouts) {
    const share = layout.scenes / total;
    if (share > LAYOUT_SHARE_CEILING + 1e-9) {
      violations.push({
        code: "layout_overused",
        message: `layout "${layout.id}" carries ${layout.scenes} of ${total} scenes (${(share * 100).toFixed(0)}%, ceiling ${LAYOUT_SHARE_CEILING * 100}%)`,
        fix: "give some scenes a different composition, or pick a world with more layouts",
      });
    }
  }

  /* 3. More than one kind of cut.
     The spec asks for three families; a film with two seams cannot spend
     three, so the requirement is the smaller of three and the number of cuts
     the film actually has. Demanding the impossible would just teach everyone
     to switch the gate off. */
  const seamCount = fp.transformation_scenes + fp.carrier_seams >= 0 ? fp.scene_count - 1 : 0;
  const required = Math.min(3, Math.max(1, seamCount));
  if (fp.transition_families.length < required) {
    violations.push({
      code: "one_note_transitions",
      message: `${fp.transition_families.length} transition family (${fp.transition_families.join(", ") || "none"}) across ${seamCount} cuts; wanted ${required}`,
      fix: "vary how the cuts travel — a film with one move in it reads as a slideshow",
    });
  }

  /* 4 and 5 are reported, not enforced, until the scene graph routinely
     carries object states and carriers. Enforcing them now would fail every
     honest outline before the frame workers exist to satisfy them. */
  const advisories = [];
  if (fp.transformation_scenes === 0) {
    advisories.push({
      code: "no_transformation",
      message: "every scene replaces the last rather than transforming it",
      fix: "give at least one object a start and end state that differ",
    });
  }
  if (fp.carrier_seams === 0) {
    advisories.push({
      code: "no_carrier",
      message: "no cut is driven by a product element crossing it",
      fix: "hand something concrete across a seam — a cursor, a panel, a value",
    });
  }

  return { ok: violations.length === 0, violations, advisories, nearest };
}

export function assertSameness(fp, history) {
  const result = checkSameness(fp, history);
  if (!result.ok) {
    throw gateError(
      "this video is too much like the ones before it:\n" +
        result.violations.map((v) => `  - ${v.message}\n    fix: ${v.fix}`).join("\n"),
    );
  }
  return result;
}
