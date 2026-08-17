/**
 * The narrative grader, measured before it is trusted.
 *
 * A stochastic reviewer that has never been scored against known answers has
 * no business failing a delivery. These fixtures are the measurement: three
 * reviews written as a viewer who followed the film, two as one who did not.
 * The confusion matrix they produce is printed, and the threshold is only
 * defensible for as long as it separates them.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { scoreNarrative } from "../cli/lib/detect/narrative.mjs";

const dir = path.join(import.meta.dirname, "fixtures", "narrative");
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const { model, positioning, graph } = read("context.json");

const cases = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && f !== "context.json")
  .map((f) => ({ name: f.replace(/\.json$/, ""), ...read(f) }));

/** Agreement at or above this is treated as "followed the film". */
const THRESHOLD = 0.7;

test("the grader separates a viewer who followed the film from one who did not", () => {
  const matrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const rows = [];

  for (const c of cases) {
    const { agreement } = scoreNarrative({ answers: c.answers, model, positioning, graph });
    const predictedGood = agreement >= THRESHOLD;
    const actuallyGood = c.label === "good";
    rows.push({ name: c.name, label: c.label, agreement, predictedGood });

    if (actuallyGood && predictedGood) matrix.tp++;
    else if (!actuallyGood && predictedGood) matrix.fp++;
    else if (!actuallyGood && !predictedGood) matrix.tn++;
    else matrix.fn++;
  }

  /* Printed on every run, so the number is never a claim in a commit message
     that has quietly stopped being true. */
  console.log(`\n  narrative grader, threshold ${THRESHOLD}`);
  for (const r of rows) {
    console.log(
      `    ${r.name.padEnd(20)} labelled ${r.label.padEnd(5)} agreement ${r.agreement.toFixed(2)} → ${r.predictedGood ? "good" : "bad"}`,
    );
  }
  console.log(`    tp ${matrix.tp}  fp ${matrix.fp}  tn ${matrix.tn}  fn ${matrix.fn}\n`);

  const good = cases.filter((c) => c.label === "good").length;
  const bad = cases.length - good;

  /* A grader that misses a bad review is the dangerous direction: it would
     wave through a video nobody understood. */
  assert.equal(matrix.fp, 0, "a review from a lost viewer was scored as good");
  assert.equal(matrix.tn, bad, "every bad review must be caught");
  assert.ok(matrix.tp >= good - 1, `only ${matrix.tp}/${good} good reviews recognised`);
});

test("it stays a report, not a gate, until that matrix is better than this", () => {
  /* Documented as an assertion so removing the caveat requires removing this
     test, which is harder to do by accident than editing a comment. */
  const source = fs.readFileSync(
    path.join(import.meta.dirname, "..", "cli", "commands", "review.mjs"),
    "utf8",
  );
  assert.match(source, /gating: false/, "the narrative layer must not gate delivery yet");
});
