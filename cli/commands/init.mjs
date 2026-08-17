/**
 * brag init — create the working directory for a product.
 */

import path from "node:path";
import { resolveProject } from "../lib/state.mjs";
import { EXIT, report, slug } from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  const name = flags.name ?? path.basename(project.targetRoot);

  const created = project.init({
    name,
    targetSurfaceHint: flags.surface ?? null,
    force: flags.force,
  });

  report(
    { ok: true, project: created, dir: project.dir },
    [
      `Created ${path.relative(process.cwd(), project.dir) || "brag/"} for "${name}".`,
      "",
      "Next: brag inspect --emit",
    ],
  );
  return EXIT.OK;
}

export const describe = {
  summary: "create brag/ in the current project",
  slugFor: slug,
};
