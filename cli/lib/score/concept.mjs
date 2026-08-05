/**
 * Concept distinctness and selection.
 *
 * Two things here are deliberately code rather than judgment.
 *
 * Distinctness: asked for three different concepts, a model will happily
 * produce three descriptions of the same film. Overlap is measured on the
 * words that carry the idea — metaphor, visual rule, premise — and a set that
 * is really one concept in three costumes is rejected before anyone scores it.
 *
 * Novelty and difference-from-previous: the model that wrote the concepts does
 * not get to rate them on originality. Those two numbers are computed, and the
 * CLI adds up the weighted total and picks. The model rates only what it can
 * legitimately judge, in a separate pass from generation.
 */

const STOP = new Set(
  ("a an and are as at be been but by for from has have how in into is it its of on or that the " +
    "their them then there these they this to was were what when where which who will with you your " +
    "video film scene shows show viewer product user")
    .split(" "),
);

/** Content words that actually carry a concept's idea. */
function ideaTokens(concept) {
  const text = [
    concept.central_metaphor,
    concept.visual_rule,
    concept.premise,
    concept.emotional_arc,
    ...(concept.forbidden_motifs ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return new Set(
    text
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function overlap(a, b) {
  const ta = ideaTokens(a);
  const tb = ideaTokens(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return Number((shared / Math.min(ta.size, tb.size)).toFixed(3));
}

/** Above this, two concepts are the same idea wearing different words. */
export const DISTINCTNESS_CEILING = 0.5;

/**
 * @returns {{ok:boolean, pairs:{a:string,b:string,overlap:number}[]}}
 */
export function checkDistinct(concepts, { ceiling = DISTINCTNESS_CEILING } = {}) {
  const pairs = [];
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const score = overlap(concepts[i], concepts[j]);
      if (score >= ceiling) {
        pairs.push({ a: concepts[i].id, b: concepts[j].id, overlap: score });
      }
    }
  }
  return { ok: pairs.length === 0, pairs };
}

/**
 * How unlike the rest of its own batch a concept is. Rewards the one that is
 * not a variation on the others.
 */
export function novelty(concept, all) {
  const others = all.filter((c) => c.id !== concept.id);
  if (!others.length) return 5;
  const worst = Math.max(...others.map((o) => overlap(concept, o)));
  return Number((5 * (1 - worst)).toFixed(2));
}

/**
 * How unlike the videos already made this concept is. Compared against the
 * worlds and motifs of past deliveries, not their copy.
 */
export function differenceFromPrevious(concept, history = []) {
  if (!history.length) return 5;
  const mine = new Set([
    concept.suggested_world,
    ...ideaTokens(concept),
  ].filter(Boolean));

  let worst = 0;
  for (const prior of history) {
    const theirs = new Set(
      [prior.world, ...(prior.object_motifs ?? []), ...(prior.dominant_layouts ?? []).map((l) => l.id)].filter(Boolean),
    );
    if (!theirs.size) continue;
    let shared = 0;
    for (const t of theirs) if (mine.has(t)) shared++;
    worst = Math.max(worst, shared / theirs.size);
  }
  return Number((5 * (1 - worst)).toFixed(2));
}

/**
 * Weights. Clarity and proof dominate because a beautiful video that leaves a
 * viewer unsure what the product does has failed at the only job it had.
 */
export const WEIGHTS = {
  product_clarity: 3,
  product_proof: 2.5,
  silent_comprehension: 2,
  emotional_strength: 1.5,
  platform_fit: 1,
  novelty: 2,
  difference_from_previous: 1.5,
};

/**
 * Score every concept and rank them. The CLI decides; the model only supplies
 * the ratings it is entitled to.
 *
 * @returns {{ranked: object[], winner: object}}
 */
export function rankConcepts({ concepts, scores, history = [] }) {
  const byId = new Map(scores.map((s) => [s.concept_id, s.criteria]));

  const ranked = concepts
    .map((concept) => {
      const rated = byId.get(concept.id);
      if (!rated) {
        throw new Error(`concept "${concept.id}" was not scored`);
      }
      const computed = {
        novelty: novelty(concept, concepts),
        difference_from_previous: differenceFromPrevious(concept, history),
      };

      let total = 0;
      for (const [key, weight] of Object.entries(WEIGHTS)) {
        const value = key in computed ? computed[key] : rated[key]?.score;
        if (typeof value !== "number") throw new Error(`concept "${concept.id}" is missing "${key}"`);
        total += value * weight;
      }

      return {
        concept,
        rated: Object.fromEntries(Object.entries(rated).map(([k, v]) => [k, v.score])),
        justifications: Object.fromEntries(Object.entries(rated).map(([k, v]) => [k, v.because])),
        computed,
        total: Number(total.toFixed(2)),
      };
    })
    /* Ties break toward clarity, then toward the concept that is least like
       anything already made. */
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.rated.product_clarity - a.rated.product_clarity ||
        b.computed.difference_from_previous - a.computed.difference_from_previous,
    );

  return { ranked, winner: ranked[0] };
}
