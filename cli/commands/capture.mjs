/**
 * brag capture — record the real product surface.
 *
 * Commands are never inferred and run. The agent proposes a capture plan, the
 * user approves it, and only then does anything execute: this stage runs
 * arbitrary commands from the product's own documentation, and guessing which
 * ones are safe is not a decision a video tool should be making.
 *
 * `--plan` writes the proposal. `--run` executes an approved plan.
 */

import path from "node:path";
import { captureTerminal, sessionText } from "../lib/capture/terminal.mjs";
import { resolveProject } from "../lib/state.mjs";
import { readPackageVersion } from "../lib/state.mjs";
import { EXIT, exists, gateError, report, say, writeJson } from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();
  if (flags.run) return execute(project, flags);
  return plan(project);
}

/* ------------------------------------------------------------------ plan */

function plan(project) {
  const model = project.read("product_model.json");
  const signals = project.read("signals.json", { optional: true });

  const surfaces = model.visual_surfaces.filter((s) => s.capture === "terminal_tape");
  if (!surfaces.length) {
    throw gateError(
      `no visual surface in this product model asks for a terminal tape. ` +
        `Surfaces: ${model.visual_surfaces.map((s) => `${s.id} (${s.capture ?? "none"})`).join(", ")}`,
    );
  }

  const suggested = (signals?.candidate_commands ?? [])
    .map((c) => c.command)
    .filter((c) => !/^(rm|del|sudo|curl|wget|git push|npm publish)\b/.test(c))
    .slice(0, 8);

  const plan = {
    schema: "brag.capture_plan/1",
    approved: false,
    geometry: { cols: 100, rows: 30 },
    invocations: suggested.map((command, i) => ({
      id: `cmd_${i + 1}`,
      display_command: command,
      argv: command.split(/\s+/),
      cwd: ".",
      expect_exit: 0,
      surface: surfaces[0].id,
      include: false,
    })),
    note:
      "Nothing runs until `approved` is true. Set `include: true` on the invocations you " +
      "want captured, fix any argv the naive split got wrong, and check that none of them " +
      "change state you care about — these run for real.",
  };

  const file = project.path("capture_plan.json");
  if (exists(file)) {
    say("A capture plan already exists; leaving it alone. Delete it to regenerate.");
  } else {
    writeJson(file, plan);
  }

  report(
    { ok: true, mode: "plan", path: file, suggested: suggested.length },
    [
      `Proposed ${suggested.length} command(s) from the project's own documentation.`,
      `  ${path.relative(project.targetRoot, file)}`,
      "",
      "These will run for real. Review them, set `include: true` on the ones you want,",
      "set `approved: true`, then:",
      "  brag capture --run",
    ],
  );
  return EXIT.OK;
}

/* ------------------------------------------------------------------ run */

async function execute(project, flags) {
  const plan = project.read("capture_plan.json");

  if (!plan.approved && !flags.force) {
    throw gateError(
      "the capture plan is not approved. These commands run for real against your machine — " +
        "read them, then set `approved: true` in capture_plan.json.",
    );
  }

  const chosen = plan.invocations.filter((i) => i.include);
  if (!chosen.length) {
    throw gateError("no invocation in the plan has `include: true`, so there is nothing to capture.");
  }

  const sessions = [];
  for (const invocation of chosen) {
    say(`Running \`${invocation.display_command}\`…`);
    const session = await captureTerminal({
      id: invocation.id,
      argv: invocation.argv,
      displayCommand: invocation.display_command,
      cwd: path.resolve(project.targetRoot, invocation.cwd ?? "."),
      geometry: plan.geometry,
      expectExit: invocation.expect_exit ?? 0,
      toolVersion: readPackageVersion(),
    });
    writeJson(project.path("captures", "terminal", `${invocation.id}.session.json`), session);
    sessions.push({ invocation, session });
  }

  /* The manifest is what the fidelity check resolves rendered strings against,
     so it carries the text each session actually printed. */
  const manifest = {
    schema: "brag.capture_manifest/1",
    captured_at: new Date().toISOString(),
    sessions: sessions.map(({ invocation, session }) => ({
      id: invocation.id,
      surface: invocation.surface,
      kind: "terminal_tape",
      path: `captures/terminal/${invocation.id}.session.json`,
      display_command: session.invocation.display_command,
      exit_code: session.invocation.exit_code,
      states: session.states.length,
      redactions: session.provenance.redactions,
      pty: session.environment.pty,
      lines: sessionText(session),
    })),
  };
  writeJson(project.path("captures", "capture_manifest.json"), manifest);

  const unresolved = checkVerbatim(project, manifest);

  report(
    {
      ok: true,
      mode: "run",
      sessions: manifest.sessions.map((s) => ({ id: s.id, states: s.states })),
      unresolved,
    },
    [
      `Captured ${sessions.length} session(s).`,
      ...manifest.sessions.map(
        (s) =>
          `  ${s.id.padEnd(10)} ${s.states} settled state(s)` +
          (s.redactions.length ? `  redacted: ${s.redactions.map((r) => `${r.count} ${r.kind}`).join(", ")}` : ""),
      ),
      !sessions.some(({ session }) => session.environment.pty)
        ? "  note: captured without a pty, so spinners a tool only draws to a tty may be missing"
        : "",
      unresolved.length
        ? `  ${unresolved.length} verbatim string(s) still have no capture backing them: ${unresolved.join(", ")}`
        : "  every verbatim string in the product model appears in a capture",
      "",
      "Next: brag compose",
    ].filter(Boolean),
  );
  return EXIT.OK;
}

/**
 * Which verbatim strings the captures actually back up. Reported rather than
 * enforced: some copy legitimately comes from a README rather than a run, and
 * the fidelity layer is where the full accounting belongs.
 */
function checkVerbatim(project, manifest) {
  const model = project.read("product_model.json");
  const haystack = manifest.sessions
    .flatMap((s) => s.lines)
    .join("\n")
    .replace(/\s+/g, " ");

  return (model.verbatim_copy ?? [])
    .filter((v) => v.kind === "output" || v.kind === "command")
    .filter((v) => !haystack.includes(v.text.replace(/\s+/g, " ").trim()))
    .map((v) => v.id);
}
