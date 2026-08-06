/**
 * Layer 4: does the video only say things the product can back up?
 *
 * Every string that reaches the screen must resolve to a source — a verbatim
 * string extracted from the project, a line a captured command actually
 * printed, or a claim bound to a proof. Anything else is the video asserting
 * something on the product's behalf, which is the failure mode that makes a
 * launch video embarrassing rather than wrong.
 *
 * This reads the compiled composition rather than the scene graph. The graph
 * is what brag intended; the composition is what a viewer will see, and the
 * gap between those two is exactly what a fidelity check is for.
 */

const norm = (s) =>
  String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const loose = (s) => norm(s).toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();

/**
 * Visible strings in a compiled composition, tagged by where they sit.
 *
 * Terminal rows are read per row rather than per run, since a row is what a
 * viewer reads; runs are a styling detail.
 */
/**
 * Every file a viewer's eyes end up reading.
 *
 * `index.html` stopped being the whole composition the moment frames became
 * sub-compositions: it holds the mounts, and the copy lives in the files those
 * mounts point at. Reading only the index returned zero strings and reported
 * `0/0 resolve to a source`, which prints as a pass. A fidelity layer that
 * checks nothing is worse than one that fails, because nobody investigates a
 * tick.
 *
 * @param read (relativePath) => string|null — resolves a `data-composition-src`
 */
export function extractRenderedTree(indexHtml, read) {
  const out = extractRenderedText(indexHtml);
  const seen = new Set();
  for (const m of indexHtml.matchAll(/data-composition-src="([^"]+)"/g)) {
    const src = m[1];
    if (seen.has(src)) continue;
    seen.add(src);
    const contents = read(src);
    if (contents) out.push(...extractAuthoredText(contents));
  }
  return out;
}

/**
 * Visible strings in a frame nobody generated.
 *
 * The scaffold's extractor matches its own class names, which a designed frame
 * has no reason to use. So this reads structurally instead: strip anything
 * that is not rendered, then take the text of every leaf element. It over-reads
 * rather than under-reads on purpose — a string wrongly listed is a finding
 * someone dismisses, and a string missed is a claim nobody checked.
 */
export function extractAuthoredText(html) {
  const body = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const out = [];
  /* Leaf elements only: an ancestor's text is its descendants' concatenated,
     which would report "tapedeck recordnpm test" as an unsourced line of its own. */
  for (const m of body.matchAll(/<([a-z][\w-]*)\b([^>]*)>([^<]*)<\/\1>/gi)) {
    const value = norm(m[3]);
    if (!value) continue;
    const id = (m[2].match(/(?:^|\s)id="([^"]*)"/) ?? [])[1] ?? null;
    out.push({ kind: "copy", text: value, id });
  }
  return out;
}

export function extractRenderedText(html) {
  const out = [];
  const push = (kind, text, id) => {
    const value = norm(text);
    if (value) out.push({ kind, text: value, id: id ?? null });
  };

  /* Attribute order is not ours to assume. Opening a project with
     `hyperframes check` rewrites index.html and injects its own identity
     attribute ahead of the class, and a checker that matched on position
     silently found nothing at all — a fidelity layer reporting 0/0 strings is
     worse than one that fails, because it reads as a pass. */
  const tag = (name, cls) =>
    new RegExp(
      "<" + name + '\\b[^>]*class="[^"]*\\b(' + cls + ')\\b[^"]*"[^>]*>([\\s\\S]*?)</' + name + ">",
      "g",
    );
  /* Anchored to an attribute boundary: a bare /id="/ also matches inside
     `data-hf-id="hf-1"`, which would attribute every finding to HyperFrames'
     injected identity instead of the scene that owns the line. */
  const idOf = (open) => (open.match(/(?:^|\s)id="([^"]*)"/) ?? [])[1] ?? null;

  for (const m of html.matchAll(tag("p", "lead|line"))) {
    push("copy", m[2], idOf(m[0]));
  }
  /* The compiler no longer emits kickers — a scene's role is brag's filing
     system, not something a viewer should read. A hand-edited composition may
     still carry one, and it has to keep being classified as structure so the
     fidelity pass does not report it as an unsourced claim. */
  for (const m of html.matchAll(tag("p", "kicker"))) {
    push("kicker", m[2]);
  }
  for (const m of html.matchAll(tag("span", "tlabel"))) {
    push("terminal_command", m[2]);
  }
  for (const m of html.matchAll(tag("div", "trow"))) {
    push("terminal_output", m[2].replace(/<[^>]+>/g, ""));
  }
  return out;
}

/**
 * @returns {{findings: object[], resolved: number, checked: number}}
 */
export function checkFidelity({ rendered, model, positioning, captureLines = [] }) {
  /* What the product can be quoted as saying. */
  const verbatim = (model.verbatim_copy ?? []).map((v) => v.text);
  const claims = (positioning?.claims ?? []).map((c) => c.text);
  const captured = captureLines;

  const exact = new Set([...verbatim, ...captured].map(norm));
  const looseSet = new Set([...verbatim, ...captured, ...claims].map(loose));

  /* Narrative connective tissue a video needs and no source will contain.
     Kickers are the storyboard's own role names, not claims about the tool. */
  const structural = new Set(
    [
      model.name,
      model.one_line,
      positioning?.angle,
      positioning?.action,
      ...(model.proof ?? []).map((p) => p.claim),
    ]
      .filter(Boolean)
      .map(loose),
  );

  const findings = [];
  let resolved = 0;
  let checked = 0;

  for (const item of rendered) {
    if (item.kind === "kicker") continue;
    /* Chrome, not copy. A run with no letters and no digits asserts nothing —
       a shell prompt's `$`, an arrow, a rule. Demanding a source for those
       means either a frame cannot draw a prompt or someone adds "$" to the
       product model, and both are worse than the rule. */
    if (!/[a-z0-9]/i.test(item.text)) continue;
    checked++;

    if (exact.has(item.text)) {
      resolved++;
      continue;
    }
    const key = loose(item.text);
    if (looseSet.has(key) || structural.has(key)) {
      resolved++;
      continue;
    }

    /* A fragment of a sourced string is sourced.
       Splitting a line across elements is ordinary craft — a hero sentence
       revealed clause by clause, a figure labelling the two numbers out of the
       sentence that states them. Reading the rendered tree leaf by leaf sees
       those pieces individually, and reporting each one as an invented claim
       buries the real findings. Showing less of a true string cannot make it
       untrue; showing MORE can, and that is the paraphrase case below. */
    if (key && [...looseSet, ...structural].some((source) => source.includes(key))) {
      resolved++;
      continue;
    }

    /* A terminal row is real by construction — it came out of a command — so a
       row that does not match is a sign the capture and the composition have
       drifted apart, which is a different and more serious problem. */
    if (item.kind === "terminal_output" || item.kind === "terminal_command") {
      findings.push({
        code: "capture_drift",
        scene: item.id,
        at: null,
        message: `the composition shows "${truncate(item.text)}" as terminal output, but no captured session printed it`,
        fix: "recompile after capturing, or stop hand-writing terminal content",
      });
      continue;
    }

    /* Partial credit: copy that contains a sourced string is a paraphrase
       wrapped around real material, which is worth flagging more gently than
       a wholly invented line. */
    const contains = [...verbatim, ...captured].find((v) => v && key.includes(loose(v)) && loose(v).length > 8);
    findings.push({
      code: contains ? "paraphrased_source" : "unsourced_copy",
      scene: item.id,
      at: null,
      message: contains
        ? `"${truncate(item.text)}" wraps a sourced string rather than quoting it`
        : `"${truncate(item.text)}" appears on screen with nothing in the product model behind it`,
      fix: contains
        ? "quote the source exactly, or add the paraphrase as its own verbatim entry"
        : "add it to verbatim_copy with a real source, bind it to a proof, or cut it",
    });
  }

  /* Forbidden claims are checked against everything, kickers included. */
  for (const forbidden of model.forbidden_claims ?? []) {
    const needle = loose(forbidden);
    if (!needle) continue;
    for (const item of rendered) {
      if (loose(item.text).includes(needle)) {
        findings.push({
          code: "forbidden_claim_rendered",
          scene: item.id,
          at: null,
          message: `the composition shows "${truncate(item.text)}", which restates a forbidden claim: "${forbidden}"`,
          fix: "cut it; the product model says this is not a claim this product makes",
        });
      }
    }
  }

  return { findings, resolved, checked };
}

const truncate = (s, n = 64) => (s.length > n ? `${s.slice(0, n)}…` : s);
