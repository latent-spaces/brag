/**
 * The visual world catalogue.
 *
 * Worlds are data, loaded and validated at run time. The distinctness gate is
 * the point: fifteen names for three looks is the obvious failure mode of a
 * catalogue like this, so two worlds declaring the same
 * camera × depth × transition-family triple are rejected rather than shipped.
 *
 * The catalogue is deliberately small and grows as each new world is shown to
 * render differently from the others. A world that does not change the frame
 * is a name, not a look.
 */

import fs from "node:fs";
import path from "node:path";
import { assertValid } from "./schema.mjs";
import { REPO_ROOT } from "./state.mjs";
import { gateError } from "./util.mjs";

const DIR = path.join(REPO_ROOT, "worlds");

let cache = null;

export function loadWorlds() {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) throw gateError(`no world catalogue at ${DIR}`);

  const worlds = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      return assertValid(REPO_ROOT, "visual_world", parsed, { source: f });
    });

  assertDistinct(worlds);
  cache = worlds;
  return worlds;
}

export function getWorld(id) {
  const world = loadWorlds().find((w) => w.id === id);
  if (!world) {
    throw gateError(
      `no visual world "${id}". Available: ${loadWorlds().map((w) => w.id).join(", ")}`,
    );
  }
  return world;
}

/** The triple that has to be unique for a world to be worth having. */
export const worldSignature = (w) =>
  `${w.camera_model}|${w.depth_levels}|${[...w.transition_families].sort().join("+")}`;

export function assertDistinct(worlds) {
  const seen = new Map();
  const clashes = [];
  for (const w of worlds) {
    const sig = worldSignature(w);
    if (seen.has(sig)) clashes.push(`"${w.id}" and "${seen.get(sig)}" both declare ${sig}`);
    else seen.set(sig, w.id);
  }
  if (clashes.length) {
    throw gateError(
      "two visual worlds are the same look under different names:\n" +
        clashes.map((c) => `  - ${c}`).join("\n") +
        "\n\nGive one a different camera, depth or transition vocabulary, or delete it.",
    );
  }
  return true;
}

/** Worlds that suit a product surface, best first. */
export function worldsFor(surfaceType) {
  const all = loadWorlds();
  const suited = all.filter((w) => w.suits_surfaces?.includes(surfaceType));
  return suited.length ? suited : all;
}

/**
 * Assign a layout to every scene.
 *
 * Scenes prefer a layout listed for their narrative role, but never the layout
 * the previous scene used, and no layout may carry more than 40% of the film.
 * Consecutive scenes composed identically is what makes a video read as a
 * slideshow, and it is cheap to prevent here rather than detect later.
 */
export function assignLayouts(world, scenes, seams = []) {
  const layouts = world.layouts;
  /* Matches the 40% ceiling the sameness gate enforces. Rounding up instead
     would let the assigner produce a film the gate then refuses. */
  const budget = Math.max(1, Math.floor(scenes.length * 0.4));
  const used = new Map();
  const out = [];
  const byScene = new Map();
  let previous = null;

  /* A seam that hands an element across the cut needs that element in the same
     place and at the same size on both sides. Matching only the scale is not
     enough: the gate measures the carrier's centre and calls a shifted one
     position drift, which is exactly right — an object that jumps 127px has
     not been handed across, it has been replaced.

     So a carried cut pins the incoming scene to the outgoing scene's layout.
     That is in tension with rotating layouts for variety, and the carrier wins:
     visual continuity across the cut is the whole point of declaring one. The
     layout-overuse gate still caps how much of a film any one layout carries,
     so this cannot quietly collapse into a single composition. */
  const carriedInto = new Map();
  for (const seam of seams) {
    if (seam.carrier) carriedInto.set(seam.to, seam.from);
  }

  for (const scene of scenes) {
    const preferred = layouts.filter((l) => !scene.role || l.best_for?.includes(scene.role));
    let ordered = [...(preferred.length ? preferred : layouts), ...layouts];

    const carriedFrom = carriedInto.get(scene.id);
    const inherited = carriedFrom ? byScene.get(carriedFrom) : null;

    const pick =
      inherited ??
      ordered.find((l) => l.id !== previous && (used.get(l.id) ?? 0) < budget) ??
      ordered.find((l) => l.id !== previous) ??
      layouts[0];

    used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
    previous = pick.id;
    byScene.set(scene.id, pick);
    out.push({ scene: scene.id, layout: pick, carried: Boolean(inherited) });
  }
  return out;
}
