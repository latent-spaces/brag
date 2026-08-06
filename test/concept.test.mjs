/**
 * Concept distinctness and selection.
 *
 * The two things worth protecting here are that three descriptions of one film
 * are caught before anyone scores them, and that the model which wrote the
 * concepts never gets to rate them on originality.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DISTINCTNESS_CEILING,
  checkDistinct,
  differenceFromPrevious,
  novelty,
  rankConcepts,
  WEIGHTS,
} from "../cli/lib/score/concept.mjs";

const concept = (id, over = {}) => ({
  id,
  name: id,
  premise: "A thing happens on screen and then another thing happens.",
  central_metaphor: "something stands for something else",
  visual_rule: "the rule is never broken",
  emotional_arc: "doubt to belief",
  forbidden_motifs: ["floating cards"],
  ...over,
});

const tape = concept("tape", {
  premise: "The camera travels along a ribbon of terminal output, stopping at moments that matter.",
  central_metaphor: "the session is a tape you can walk along",
  visual_rule: "the camera only moves forward along the ribbon",
});
const tapeAgain = concept("tape-again", {
  premise: "The camera travels along a ribbon of terminal output, pausing at moments that matter.",
  central_metaphor: "the session is a ribbon you can walk along",
  visual_rule: "the camera only travels forward along the ribbon",
});
const witness = concept("witness", {
  premise: "Each claim is pinned up as evidence with its source attached and the links drawn between them.",
  central_metaphor: "every claim is an exhibit with provenance",
  visual_rule: "nothing appears without its source beside it",
});

const rate = (score) => ({ score, because: "a specific reason naming something in this concept" });
const scoresFor = (ids, table = {}) =>
  ids.map((id) => ({
    concept_id: id,
    criteria: {
      product_clarity: rate(table[id]?.product_clarity ?? 3),
      product_proof: rate(table[id]?.product_proof ?? 3),
      emotional_strength: rate(table[id]?.emotional_strength ?? 3),
      platform_fit: rate(table[id]?.platform_fit ?? 3),
      silent_comprehension: rate(table[id]?.silent_comprehension ?? 3),
    },
  }));

test("one concept in two costumes is caught", () => {
  const result = checkDistinct([tape, tapeAgain, witness]);
  assert.equal(result.ok, false);
  assert.equal(result.pairs.length, 1);
  assert.equal(result.pairs[0].a, "tape");
  assert.equal(result.pairs[0].b, "tape-again");
  assert.ok(result.pairs[0].overlap >= DISTINCTNESS_CEILING);
});

test("genuinely different concepts pass", () => {
  assert.equal(checkDistinct([tape, witness]).ok, true);
});

test("novelty rewards the concept least like its own batch", () => {
  const all = [tape, tapeAgain, witness];
  assert.ok(
    novelty(witness, all) > novelty(tape, all),
    "the outlier should score higher than one of a near-identical pair",
  );
});

test("difference from previous is full marks with no history", () => {
  assert.equal(differenceFromPrevious(tape, []), 5);
});

test("a concept reusing a past world and motifs scores lower", () => {
  const history = [{ world: "spatial-terminal", object_motifs: ["ribbon", "terminal"], dominant_layouts: [] }];
  const reuse = differenceFromPrevious(concept("reuse", { suggested_world: "spatial-terminal" }), history);
  const fresh = differenceFromPrevious(concept("fresh", { suggested_world: "kinetic-editorial" }), history);
  assert.ok(reuse < fresh, `reuse ${reuse} should score below fresh ${fresh}`);
});

test("the CLI adds up the total; the model never rates originality", () => {
  assert.ok("novelty" in WEIGHTS && "difference_from_previous" in WEIGHTS);
  const { ranked, winner } = rankConcepts({
    concepts: [tape, witness],
    scores: scoresFor(["tape", "witness"], {
      witness: { product_clarity: 5, product_proof: 5 },
      tape: { product_clarity: 3, product_proof: 3 },
    }),
  });
  assert.equal(winner.concept.id, "witness");
  assert.equal(ranked.length, 2);
  /* Computed values are present and were never supplied by the scorer. */
  assert.ok(typeof winner.computed.novelty === "number");
  assert.ok(typeof winner.computed.difference_from_previous === "number");
});

test("clarity breaks a tie", () => {
  const { winner } = rankConcepts({
    concepts: [tape, witness],
    scores: scoresFor(["tape", "witness"], {
      tape: { product_clarity: 2, emotional_strength: 5 },
      witness: { product_clarity: 5, emotional_strength: 2 },
    }),
  });
  assert.equal(winner.concept.id, "witness", "clarity outweighs feeling when the totals are close");
});

test("an unscored concept fails loudly rather than being skipped", () => {
  assert.throws(
    () => rankConcepts({ concepts: [tape, witness], scores: scoresFor(["tape"]) }),
    /was not scored/,
  );
});
