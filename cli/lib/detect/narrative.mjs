/**
 * Layer 3: did the video communicate what it was built to communicate?
 *
 * The reviewer sees the frames and the text that reached the screen, and
 * nothing else — no scene graph, no purposes, no claim list. That constraint is
 * the whole design. An agent handed the plan alongside the render will grade
 * the plan; the only question worth asking is what someone takes away from
 * watching, and you cannot ask that of a reviewer who has been told the answer.
 *
 * Agreement is computed here rather than rated by the reviewer, for the same
 * reason. And the result is a report, not a gate: a stochastic grader must not
 * block a delivery until its accuracy has been measured against labelled
 * fixtures and found good enough to trust.
 */

const loose = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (s) => new Set(loose(s).split(" ").filter((w) => w.length > 3));

/** How much of `expected` the answer covers, 0 to 1. */
function overlap(answer, expected) {
  const a = words(answer);
  const e = words(expected);
  if (!e.size) return 1;
  let hit = 0;
  for (const w of e) if (a.has(w)) hit++;
  return Number((hit / e.size).toFixed(2));
}

export const QUESTIONS = [
  "product",
  "problem",
  "proof",
  "scenes",
  "unsupported",
  "silent",
  "readable",
  "ending",
];

/**
 * Compare a blind review against what the video was supposed to do.
 *
 * @returns {{agreement: number, checks: object[], findings: object[]}}
 */
export function scoreNarrative({ answers, model, positioning, graph }) {
  const checks = [];
  const findings = [];
  const add = (id, ok, detail, weight = 1) => checks.push({ id, ok, detail, weight });

  /* Did they come away knowing what it is? */
  const productHit =
    loose(answers.product).includes(loose(model.name)) ||
    overlap(answers.product, model.one_line ?? "") >= 0.3;
  add("product", productHit, `said "${answers.product}"`, 2);
  if (!productHit) {
    findings.push({
      code: "product_unclear",
      scene: null,
      at: null,
      message: `a viewer watching this called it "${answers.product}" — the product model says ${model.name}`,
      fix: "put the product's own name and what it does on screen, plainly",
    });
  }

  const problemScore = overlap(answers.problem, model.problem ?? "");
  add("problem", problemScore >= 0.25, `${(problemScore * 100).toFixed(0)}% overlap with the stated problem`, 2);
  if (problemScore < 0.25) {
    findings.push({
      code: "problem_not_conveyed",
      scene: null,
      at: null,
      message: `the problem read as "${answers.problem}" rather than what the product model states`,
      fix: "show the problem happening instead of naming it",
    });
  }

  /* Proof: did the evidence the video was built around actually land? */
  const required = new Set((graph?.scenes ?? []).flatMap((s) => s.required_proof ?? []));
  const claimed = (answers.proof ?? []).join(" ");
  const landed = [...required].filter((id) => {
    const proof = (model.proof ?? []).find((p) => p.id === id);
    return proof && overlap(claimed, proof.claim) >= 0.25;
  });
  add(
    "proof",
    required.size === 0 || landed.length > 0,
    `${landed.length}/${required.size} required proofs recognised`,
    2,
  );
  for (const id of [...required].filter((r) => !landed.includes(r))) {
    findings.push({
      code: "proof_did_not_land",
      scene: null,
      at: null,
      message: `proof "${id}" is required by a scene but a blind viewer did not report seeing it`,
      fix: "show the evidence longer, larger, or as the only thing on screen",
    });
  }

  /* Scene count, loosely: a viewer who saw half the moments watched a
     different video from the one that was planned. */
  const planned = (graph?.scenes ?? []).length;
  const seen = (answers.scenes ?? []).length;
  const closeEnough =
    planned === 0 || Math.abs(seen - planned) <= Math.max(1, Math.floor(planned * 0.34));
  add("scenes", closeEnough, `${seen} moments reported against ${planned} planned`);

  /* Anything read as unsupported is worth more than the rest of the review. */
  add(
    "unsupported",
    (answers.unsupported ?? []).length === 0,
    `${(answers.unsupported ?? []).length} unsupported claim(s) reported`,
    2,
  );
  for (const claim of answers.unsupported ?? []) {
    findings.push({
      code: "read_as_unsupported",
      scene: null,
      at: null,
      message: `a blind viewer read "${claim}" as unsupported`,
      fix: "show the evidence beside the claim, or drop the claim",
    });
  }

  const wantsSilent = graph?.audio?.silent_comprehension !== false;
  add("silent", !wantsSilent || answers.silent?.yes === true, answers.silent?.because ?? "");
  if (wantsSilent && answers.silent?.yes === false) {
    findings.push({
      code: "needs_sound",
      scene: null,
      at: null,
      message: `the video is meant to work muted, but a viewer said it does not: ${answers.silent.because}`,
      fix: "carry the argument in the picture, not only the copy",
    });
  }

  add(
    "readable",
    (answers.readable ?? []).length === 0,
    `${(answers.readable ?? []).length} unreadable moment(s)`,
    2,
  );
  for (const line of answers.readable ?? []) {
    findings.push({
      code: "read_too_fast",
      scene: null,
      at: null,
      message: `a viewer could not read "${line}" in the time it was up`,
      fix: "raise its reading floor, or cut the line",
    });
  }

  const endingHit = overlap(answers.ending, positioning?.action ?? "") >= 0.2;
  add("ending", !positioning?.action || endingHit, `read the ending as "${answers.ending}"`);

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const scored = checks.reduce((n, c) => n + (c.ok ? c.weight : 0), 0);

  return {
    agreement: Number((scored / Math.max(1, total)).toFixed(2)),
    checks,
    findings,
  };
}
