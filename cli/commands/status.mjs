/**
 * brag status — what is done, what is next.
 *
 * Stage completion is derived from artifacts on disk, so this is always true
 * even if a previous run crashed halfway.
 */

import path from "node:path";
import { resolveProject } from "../lib/state.mjs";
import { EXIT, report } from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  const info = project.load();
  const stages = project.stageStatus();
  const next = project.nextStage();

  const lines = [
    `${info.name} — brag ${info.brag_version}`,
    "",
    ...stages.map(
      (s) => `  ${s.done ? "done" : "    "}  ${s.id.padEnd(11)} ${s.done ? s.path : `→ brag ${s.command} --emit`}`,
    ),
    "",
    next
      ? `Next: brag ${next.command} --emit   (produces ${next.artifact})`
      : "Every stage has an artifact. Run `brag deliver` again to re-cut, or `brag variant <format>`.",
  ];

  report(
    {
      ok: true,
      name: info.name,
      dir: path.relative(process.cwd(), project.dir),
      stages: stages.map(({ id, command, artifact, done }) => ({ id, command, artifact, done })),
      next: next?.id ?? null,
    },
    lines,
  );
  return EXIT.OK;
}
