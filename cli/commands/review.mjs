/**
 * brag review — the verification layers, as an exit code.
 *
 * Layer 1 is structural: `hyperframes check` plus the motion sidecar, run
 * against the composition.
 * Layer 2 is visual: the watch bundle's frames, measured.
 *
 * Layers 3 (narrative) and 4 (product fidelity) arrive in a later phase and
 * are reported as `pending` rather than silently counted as passing — a review
 * that quietly skips its hardest layers is worse than one that admits it.
 *
 * The whole point is that `check` passing does not mean the video is right.
 * This session has already produced two proofs of that: a composition whose
 * terminal was half invisible, and a poster showing a scene's second line with
 * the first still missing. Both passed every structural gate.
 */

import fs from "node:fs";
import path from "node:path";
import { tightScenes } from "../lib/compile/targets.mjs";
import {
  detectCaptionZone,
  detectFlatFrames,
  detectRepeatedLayouts,
  detectUnreadableCopy,
  summarize,
} from "../lib/detect/index.mjs";
import { checkFidelity, extractRenderedText, extractRenderedTree } from "../lib/detect/fidelity.mjs";
import { scoreNarrative } from "../lib/detect/narrative.mjs";
import { acceptTaskAnswer, emitTaskSpec } from "../lib/taskspec.mjs";
import { hyperframes } from "../lib/hyperframes.mjs";
import { applyTiming, solveTiming } from "../lib/solve/timing.mjs";
import { resolveProject } from "../lib/state.mjs";
import { buildBundle } from "../lib/watch/bundle.mjs";
import { EXIT, ensureDir, isJsonMode, emitJson, gateError, say, writeJson } from "../lib/util.mjs";
import { probeDuration, resolveVideo } from "./watch.mjs";

export async function run({ flags, args }) {
  const project = resolveProject(flags);
  project.load();

  const index = project.read("compositions/index.json", { optional: true });
  /* Newest first, so a bare `brag review` looks at what was just built rather
     than whichever variant happens to sort first. */
  const variant =
    flags.variant ??
    Object.entries(index?.variants ?? {})
      .sort((a, b) => String(b[1].compiled_at ?? "").localeCompare(String(a[1].compiled_at ?? "")))
      .map(([name]) => name)[0] ??
    null;

  /* The graph this variant was compiled from. Reading the project's current
     graph instead made `review --variant` report the same findings for every
     variant, which is worse than not checking: it looks like verification. */
  const rawGraph =
    (variant && project.read(`compositions/${variant}/scene_graph.json`, { optional: true })) ??
    project.read("scene_graph.json");
  const plan = solveTiming(rawGraph);
  const graph = applyTiming(rawGraph, plan);

  const findings = [];
  const layers = {};

  /* ------------------------------------------------------- L1 structural */

  if (variant) {
    const compDir = project.path("compositions", variant);
    say(`Layer 1 — checking ${variant}…`);
    const check = hyperframes(["check"], { cwd: compDir });
    layers.structural = {
      ok: check.status === 0,
      detail: check.status === 0 ? "hyperframes check passed" : tail(check.stdout || check.stderr),
    };
    if (check.status !== 0) {
      findings.push({
        code: "structural_check_failed",
        scene: null,
        at: null,
        message: "hyperframes check reported errors (layout, contrast, runtime or motion)",
        fix: "read the check output below and fix what it names",
      });
    }
  } else {
    layers.structural = { ok: false, detail: "no compiled variant to check" };
    findings.push({
      code: "nothing_compiled",
      scene: null,
      at: null,
      message: "there is no compiled composition to review",
      fix: "run `brag compose`",
    });
  }

  /* Timing is knowable without rendering, so it is checked whether or not a
     video exists yet. */
  findings.push(...detectUnreadableCopy(tightScenes(graph)));

  /* ------------------------------------------------------- L2 visual */

  let bundle = null;
  try {
    const video = resolveVideo({ project, flags, args, variant });
    const duration = probeDuration(video);
    const outDir = ensureDir(project.path("reviews", path.basename(video, path.extname(video))));
    say(`Layer 2 — watching ${path.basename(video)} (${duration}s)…`);

    bundle = buildBundle({ video, graph, duration, outDir });
    writeJson(path.join(outDir, "watch.json"), {
      schema: "brag.watch_bundle/1",
      video: path.relative(project.dir, video).split(path.sep).join("/"),
      duration,
      frames: bundle.frames,
    });

    findings.push(...detectFlatFrames(bundle.frames));
    findings.push(...detectCaptionZone(bundle.frames));
    findings.push(...detectRepeatedLayouts(bundle.frames));

    layers.visual = {
      ok: true,
      detail: `${bundle.frames.length} frames sampled`,
      contact_sheet: bundle.contactSheet
        ? path.relative(project.dir, bundle.contactSheet).split(path.sep).join("/")
        : null,
    };
  } catch (e) {
    layers.visual = { ok: false, detail: e.message };
    findings.push({
      code: "no_render_to_review",
      scene: null,
      at: null,
      message: e.message,
      fix: "run `brag deliver`, or pass a path to a rendered file",
    });
  }

  /* ------------------------------------------------------- L3 narrative */

  const narrativeAnswer =
    flags.narrative || flags["accept-narrative"]
      ? project.read("tasks/review_narrative.json", { optional: true })
      : null;

  if (narrativeAnswer) {
    const scored = scoreNarrative({
      answers: narrativeAnswer,
      model: project.read("product_model.json"),
      positioning: project.read("positioning.json", { optional: true }),
      graph,
    });
    /* Reported, never gating. Until this grader's accuracy has been measured
       against labelled fixtures, letting it fail a delivery would trade a
       known-good video for an unmeasured opinion. */
    layers.narrative = {
      ok: scored.agreement >= 0.7,
      gating: false,
      agreement: scored.agreement,
      detail:
        `${(scored.agreement * 100).toFixed(0)}% agreement with the plan` +
        (scored.findings.length ? ` — ${scored.findings.length} observation(s), reported not gating` : ""),
      checks: scored.checks,
      observations: scored.findings,
    };
  } else if (bundle) {
    layers.narrative = {
      ok: null,
      detail: "not run — `brag review --narrative` writes the spec for a blind reviewer",
    };
  } else {
    layers.narrative = { ok: null, detail: "no render to review" };
  }

  /* The spec deliberately carries the frames and the rendered text and nothing
     else. Handing over the scene graph would produce a reviewer that grades
     the plan rather than the film. */
  if (flags.narrative && bundle) {
    const { specPath } = emitTaskSpec({
      project,
      name: "review_narrative",
      title: "Watch this video and say what you took away",
      objective:
        "You are seeing a rendered video as a stranger would: a sheet of frames in order, and " +
        "the text that appeared on screen. You have not been told what it is for, and you must " +
        "not go looking. Answer only from what is in front of you.",
      instructions: [
        "Open the contact sheet and the individual frames listed below, in order.",
        "Say what product this is for. If you cannot tell, say so plainly — that answer is more useful than a guess.",
        "Say what problem it claims to solve, in your words.",
        "List the evidence that was actually shown, as distinct from things merely asserted.",
        "List the distinct moments you could make out, in order.",
        "List anything stated that nothing on screen backed up.",
        "Say whether the story survives with the sound off, and why.",
        "List anything you could not read in the time it was up.",
        "Say what a convinced viewer is meant to do next.",
        "Do not read the scene graph, the brief, the storyboard, or any other file in this project. If you have already seen them, say so instead of answering.",
        "When the JSON is written, stop. Someone else runs `brag review --accept-narrative` to record it — you are not expected to find that command, and looking for it would mean browsing the project you were asked to stay out of.",
      ],
      schemaName: "review_narrative",
      context: {
        contact_sheet: layers.visual?.contact_sheet ?? null,
        frames: (bundle.frames ?? []).map((f) => ({ at: f.at, file: f.file })),
        text_on_screen: extractRenderedTree(
          fs.readFileSync(project.path("compositions", variant, "index.html"), "utf8"),
          (src) => {
            const abs = project.path("compositions", variant, ...src.split("/"));
            return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
          },
        ).map((t) => t.text),
      },
      rejects: [
        "An answer that repeats the project's own vocabulary without it having appeared on screen.",
        "Confirming what you assume the video was trying to do rather than what it did.",
      ],
    });
    say("");
    say(`Blind review spec: ${path.relative(project.targetRoot, specPath)}`);
    say("Answer it without reading the plan, then re-run with --accept-narrative.");
  }

  /* ------------------------------------------------------- L4 fidelity */

  if (variant) {
    const htmlPath = project.path("compositions", variant, "index.html");
    if (fs.existsSync(htmlPath)) {
      /* The index holds the mounts; the copy lives in the frames they point
         at, so the whole tree gets read or the layer checks nothing. */
      const rendered = extractRenderedTree(fs.readFileSync(htmlPath, "utf8"), (src) => {
        const abs = project.path("compositions", variant, ...src.split("/"));
        return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
      });
      const manifest = project.read("captures/capture_manifest.json", { optional: true });
      const captureLines = (manifest?.sessions ?? []).flatMap((entry) => [
        ...(entry.lines ?? []),
        entry.display_command,
      ]);

      const fidelity = checkFidelity({
        rendered,
        model: project.read("product_model.json"),
        positioning: project.read("positioning.json", { optional: true }),
        captureLines: captureLines.filter(Boolean),
      });

      findings.push(...fidelity.findings);
      layers.fidelity = {
        ok: fidelity.findings.length === 0,
        detail: `${fidelity.resolved}/${fidelity.checked} rendered strings resolve to a source`,
      };
    } else {
      layers.fidelity = { ok: false, detail: "no compiled composition to read" };
    }
  } else {
    layers.fidelity = { ok: null, detail: "nothing compiled" };
  }

  /* ------------------------------------------------------- report */

  const failed = findings.length > 0;
  const report_ = {
    schema: "brag.review_report/1",
    variant,
    ok: !failed,
    layers,
    findings,
    summary: summarize(findings),
    reviewed_at: new Date().toISOString(),
  };

  const reviewsDir = ensureDir(project.path("reviews"));
  writeJson(path.join(reviewsDir, "latest.json"), report_);
  fs.writeFileSync(
    path.join(reviewsDir, "latest.md"),
    renderMarkdown(report_),
  );

  if (isJsonMode()) {
    emitJson(report_);
  } else {
    say("");
    for (const [name, layer] of Object.entries(layers)) {
      const mark = layer.ok === null ? "…" : layer.ok ? "ok" : "!!";
      say(`  ${mark}  ${name.padEnd(11)} ${layer.detail}`);
    }
    if (findings.length) {
      say("");
      for (const f of findings) {
        say(`  ${f.code}${f.scene ? ` [${f.scene}]` : ""}${f.at !== null ? ` @${f.at}s` : ""}`);
        say(`      ${f.message}`);
        say(`      fix: ${f.fix}`);
      }
    }
    say("");
    say(
      failed
        ? `${findings.length} finding${findings.length === 1 ? "" : "s"}. Not deliverable yet.`
        : layers.narrative.ok === null
          ? "Nothing found. The blind narrative review has not been run — try --narrative."
          : "Nothing found by any layer.",
    );
  }

  if (failed) {
    if (layers.structural.ok === false && layers.structural.detail) {
      say("");
      say(layers.structural.detail);
    }
    return EXIT.GATE;
  }
  return EXIT.OK;
}

/* ------------------------------------------------------------------ output */

function renderMarkdown(report) {
  const lines = [
    `# Review — ${report.variant ?? "(uncompiled)"}`,
    "",
    report.ok ? "No findings from the implemented layers." : `${report.findings.length} findings.`,
    "",
    "| Layer | Result | Detail |",
    "| --- | --- | --- |",
    ...Object.entries(report.layers).map(
      ([k, v]) => `| ${k} | ${v.ok === null ? "pending" : v.ok ? "pass" : "fail"} | ${String(v.detail).split("\n")[0]} |`,
    ),
    "",
  ];
  if (report.findings.length) {
    lines.push("## Findings", "");
    for (const f of report.findings) {
      lines.push(`### \`${f.code}\`${f.scene ? ` — ${f.scene}` : ""}${f.at !== null ? ` at ${f.at}s` : ""}`);
      lines.push("", f.message, "", `**Fix:** ${f.fix}`, "");
    }
  }
  return lines.join("\n");
}

const tail = (s, n = 40) =>
  String(s || "").trimEnd().split("\n").slice(-n).join("\n");
