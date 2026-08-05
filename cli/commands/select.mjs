/**
 * brag select — score the concepts and lock one.
 *
 * Scoring runs as its own dispatch, separate from generation, and the model
 * rates only what it can legitimately judge. Novelty and
 * difference-from-previous are computed here, and the CLI — not the model —
 * adds up the weighted total and picks the winner. A model scoring its own
 * concepts on originality is grading its own homework.
 *
 * The chosen concept then stops being a suggestion. Every later stage reads it
 * as a constraint, which is what stops an implementation drifting back into
 * another typography video.
 */

import path from "node:path";
import { rankConcepts, WEIGHTS } from "../lib/score/concept.mjs";
import { Memory, resolveProject } from "../lib/state.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { EXIT, gateError, report, say } from "../lib/util.mjs";

const TASK = "concept_scores";

export async function run({ flags, args }) {
  const project = resolveProject(flags);
  project.load();
  if (flags.accept) return accept(project);
  if (args?.[0]) return lockByName(project, args[0]);
  return emit(project);
}

function emit(project) {
  const { concepts } = project.read("concepts.json");
  const positioning = project.read("positioning.json");

  const { specPath } = emitTaskSpec({
    project,
    name: TASK,
    title: "Score the concepts",
    objective:
      "Rate each concept on the five things a reader of the concept can judge. You are not " +
      "choosing the winner and you are not rating originality — those are computed. Rate " +
      "honestly, including your own weakest concept.",
    instructions: [
      "product_clarity: after watching, would a viewer be able to say what the product does?",
      "product_proof: does the concept put real, sourced evidence on screen, or does it assert?",
      "silent_comprehension: does it still work with the sound off? Most feeds autoplay muted.",
      "emotional_strength: does it make a viewer feel the problem, or only describe it?",
      "platform_fit: does it suit where this will actually be watched?",
      "Every score needs a `because` that names the specific thing in that concept. A justification that would fit any concept is not one.",
      "Score every concept, including ones you think are weak. A set where everything is a 5 tells the CLI nothing.",
    ],
    schemaName: "concept_scores",
    context: {
      destination: positioning.audience.destination,
      concepts: concepts.map((c) => ({
        id: c.id,
        name: c.name,
        premise: c.premise,
        central_metaphor: c.central_metaphor,
        visual_rule: c.visual_rule,
        emotional_arc: c.emotional_arc,
        risk: c.risk,
        beats: c.beats,
      })),
      weights: WEIGHTS,
      note: "novelty and difference_from_previous are computed by the CLI and are not yours to rate",
    },
    rejects: [
      "A `because` that could be pasted onto a different concept unchanged.",
      "Identical scores across every concept.",
    ],
  });

  report(
    { ok: true, mode: "emit", spec: specPath, answer: project.answerPath(TASK) },
    [
      `${concepts.length} concepts to score.`,
      "",
      `Read ${path.relative(project.targetRoot, specPath)}, write the JSON, then:`,
      "  brag select --accept",
      "",
      "Or override the scoring entirely: brag select <concept-id>",
    ],
  );
  return EXIT.OK;
}

function accept(project) {
  const { concepts } = project.read("concepts.json");
  const answer = acceptTaskAnswer({ project, name: TASK, schemaName: "concept_scores" });

  const scored = new Set(answer.scores.map((s) => s.concept_id));
  const missing = concepts.filter((c) => !scored.has(c.id)).map((c) => c.id);
  if (missing.length) {
    throw gateError(`these concepts were not scored: ${missing.join(", ")}`);
  }

  const { ranked, winner } = rankConcepts({
    concepts,
    scores: answer.scores,
    history: new Memory().recentFingerprints(10),
  });

  const flat = ranked.map((r) => r.total);
  if (flat.length > 1 && Math.max(...flat) - Math.min(...flat) < 1) {
    say(
      "note: the scores barely separate these concepts, which usually means they are " +
        "closer to each other than the set intended.",
    );
  }

  return lock(project, winner, ranked);
}

/** Skip scoring and lock a named concept — the user's call always wins. */
function lockByName(project, id) {
  const { concepts } = project.read("concepts.json");
  const concept = concepts.find((c) => c.id === id);
  if (!concept) {
    throw gateError(`no concept "${id}". Have: ${concepts.map((c) => c.id).join(", ")}`);
  }
  return lock(
    project,
    { concept, rated: {}, computed: {}, total: 0, justifications: {} },
    [],
    { chosenByHand: true },
  );
}

function lock(project, winner, ranked, { chosenByHand = false } = {}) {
  const c = winner.concept;
  const locked = {
    schema: "brag.selected_concept/1",
    id: c.id,
    name: c.name,
    premise: c.premise,
    central_metaphor: c.central_metaphor,
    visual_rule: c.visual_rule,
    emotional_arc: c.emotional_arc,
    forbidden_motifs: c.forbidden_motifs,
    suggested_world: c.suggested_world,
    beats: c.beats,
    why_this_product: c.why_this_product,
    risk: c.risk,
    selection: {
      total: winner.total,
      rated: winner.rated,
      computed: winner.computed,
      runners_up: ranked
        .slice(1)
        .map((r) => ({ id: r.concept.id, total: r.total, worth_grafting: r.concept.central_metaphor })),
      selected_at: new Date().toISOString(),
    },
  };
  project.write("selected_concept.json", locked);

  report(
    { ok: true, selected: c.id, total: winner.total, ranked: ranked.map((r) => ({ id: r.concept.id, total: r.total })) },
    [
      chosenByHand ? `Locked "${c.name}" by hand.` : `Locked "${c.name}" — ${winner.total} points.`,
      `  metaphor: ${c.central_metaphor}`,
      `  rule: ${c.visual_rule}`,
      c.suggested_world ? `  world: ${c.suggested_world}` : "",
      ...(ranked.length > 1
        ? ["", "Runners-up, worth grafting from:", ...ranked.slice(1).map((r) => `  ${r.total.toFixed(1).padStart(5)}  ${r.concept.id} — ${r.concept.central_metaphor}`)]
        : []),
      "",
      "This is now a constraint, not a suggestion.",
      "Next: brag direct --emit",
    ].filter(Boolean),
  );
  return EXIT.OK;
}
