/**
 * The timing solver.
 *
 * Timing conflicts are the most common way a video becomes unreadable, and
 * prose cannot resolve them: "hold long enough to read, but keep the pace, and
 * land on the beat" is three constraints that routinely disagree. So they are
 * stated as numbers and solved.
 *
 * Per scene:
 *   entry      the entrance animation, before anything is settled
 *   reading    every line that must be read, each with its own floor
 *   dwell      comprehension time for non-text content
 *   exit       the outgoing half of the seam
 *   max        the ceiling this scene must not exceed
 *
 * When the constraints cannot all hold, the solver relaxes in a fixed order,
 * which is the audio hierarchy from the spec read as a priority list:
 *
 *   1. reading clarity        never relaxed — copy that cannot be read is a bug
 *   2. narrative timing       scene order and proof placement, never relaxed
 *   3. visual comprehension   dwell can shrink to zero
 *   4. strong cue locks       a scene may leave its musical cue
 *   5. minor beat alignment   dropped first
 *
 * If it still does not fit, the solver refuses. Silently truncating a line is
 * how a video ends up with copy nobody can read.
 */

import { readingFloor } from "../compile/targets.mjs";

const ENTRY = 0.4;
const STAGGER = 0.45;
const EXIT = 0.34;
const CUE_TOLERANCE = 0.15;
const BEAT_TOLERANCE = 0.1;

/** The smallest a scene can be and still show what it promises. */
export function minimumDuration(scene) {
  const lines = scene.reading ?? [];
  const floors = lines.map((r) => r.min_reading_s ?? readingFloor(r.text));

  /* Lines arrive staggered; the last one still needs its whole floor. */
  const copy = floors.length
    ? ENTRY + STAGGER * (floors.length - 1) + floors[floors.length - 1]
    : ENTRY;

  const dwell = scene.dwell_s ?? 0;
  return Number((Math.max(copy, ENTRY + dwell) + EXIT).toFixed(2));
}

/**
 * How long a scene may run past the point where its last line is readable.
 * A held frame is fine; a held frame with nothing left to give is a dead shot,
 * and doctrine treats a scene that finishes entering with seconds to spare as
 * a planning bug rather than a pause.
 */
const HOLD_SLACK = 0.8;

/**
 * What the scene would like, given room — bounded by what its content can
 * actually fill. A declared duration longer than that is trimmed, because the
 * alternative is a frozen shot that the motion sidecar will fail anyway.
 */
export function preferredDuration(scene) {
  const min = minimumDuration(scene);
  const declared = scene.duration ?? min;
  const ceiling = Number((min + HOLD_SLACK + (scene.dwell_s ?? 0)).toFixed(2));
  return Number(Math.max(min, Math.min(declared, ceiling)).toFixed(2));
}

/** Scenes whose declared duration outruns what they have to show. */
export function overlongScenes(graph) {
  return graph.scenes
    .map((scene) => ({
      scene,
      declared: scene.duration ?? 0,
      supported: preferredDuration(scene),
    }))
    .filter((r) => r.declared - r.supported > 0.05);
}

const nearest = (value, candidates) =>
  candidates.length
    ? candidates.reduce((best, c) => (Math.abs(c - value) < Math.abs(best - value) ? c : best))
    : null;

/**
 * Solve scene starts and durations.
 *
 * @param {object} graph
 * @param {object} [opts]
 * @param {number[]} [opts.strongCues]  seconds
 * @param {number[]} [opts.beats]       seconds
 * @param {number} [opts.targetDuration] total the edit is aiming at
 * @returns {{ok, scenes, total, relaxations, violations}}
 */
export function solveTiming(graph, { strongCues = [], beats = [], targetDuration = null } = {}) {
  const relaxations = [];
  const violations = [];

  for (const { scene, declared, supported } of overlongScenes(graph)) {
    relaxations.push({
      level: 3,
      kind: "scene_trimmed",
      scene: scene.id,
      message:
        `trimmed "${scene.id}" from ${declared}s to ${supported}s: it has ` +
        `${(scene.reading ?? []).length || 1} line(s) to show and the rest would be a held frame`,
    });
  }

  const scenes = graph.scenes.map((scene) => {
    const min = minimumDuration(scene);
    const preferred = preferredDuration(scene);
    const max = scene.max_duration_s ?? Math.max(preferred, min);
    if (max < min) {
      violations.push({
        scene: scene.id,
        kind: "impossible_ceiling",
        message:
          `scene "${scene.id}" caps at ${max}s but needs ${min}s to show its copy ` +
          `(${(scene.reading ?? []).length} line(s)). Cut a line or raise the ceiling.`,
        needs: min,
        has: max,
      });
    }
    return { id: scene.id, min, preferred, max: Math.max(max, min), duration: preferred, start: 0 };
  });

  /* Fit the total, if one was asked for. Reading floors are never touched, so
     the only slack is the gap between preferred and minimum. */
  if (targetDuration) {
    const preferredTotal = scenes.reduce((n, s) => n + s.preferred, 0);
    const minTotal = scenes.reduce((n, s) => n + s.min, 0);

    if (preferredTotal > targetDuration) {
      if (minTotal > targetDuration) {
        violations.push({
          kind: "target_too_short",
          message:
            `the edit targets ${targetDuration}s but its copy needs ${minTotal.toFixed(2)}s ` +
            `at the reading floor. Cut a scene or cut copy — the floor does not move.`,
          needs: Number(minTotal.toFixed(2)),
          has: targetDuration,
        });
      } else {
        /* Squeeze proportionally into the slack above each minimum. */
        const slack = preferredTotal - minTotal;
        const overflow = preferredTotal - targetDuration;
        for (const s of scenes) {
          const share = slack > 0 ? (s.preferred - s.min) / slack : 0;
          s.duration = Number(Math.max(s.min, s.preferred - overflow * share).toFixed(2));
        }
        relaxations.push({
          level: 3,
          kind: "comprehension_dwell",
          message: `tightened ${overflow.toFixed(2)}s of dwell to reach ${targetDuration}s; no reading floor was touched`,
        });
      }
    }
  }

  /* Lay scenes end to end. */
  let t = 0;
  for (const s of scenes) {
    s.start = Number(t.toFixed(3));
    t += s.duration;
  }

  /* Now try to land cuts on the music, in priority order: a strong cue may
     move a cut by up to 0.15s, a plain beat by 0.10s, and neither may push a
     scene below its minimum. */
  const cutLocks = [];
  for (let i = 1; i < scenes.length; i++) {
    const cut = scenes[i].start;
    const cue = nearest(cut, strongCues);
    const beat = nearest(cut, beats);

    let target = null;
    let level = null;
    if (cue !== null && Math.abs(cue - cut) <= CUE_TOLERANCE) {
      target = cue;
      level = "strong_cue";
    } else if (beat !== null && Math.abs(beat - cut) <= BEAT_TOLERANCE) {
      target = beat;
      level = "beat";
    }
    if (target === null) continue;

    const delta = Number((target - cut).toFixed(3));
    const prev = scenes[i - 1];
    const grown = Number((prev.duration + delta).toFixed(3));

    if (grown < prev.min) {
      relaxations.push({
        level: 4,
        kind: "cue_dropped",
        scene: prev.id,
        message:
          `left the ${level} at ${target}s: honouring it would cut "${prev.id}" to ${grown}s, ` +
          `below its ${prev.min}s reading floor`,
      });
      continue;
    }

    prev.duration = grown;
    for (let j = i; j < scenes.length; j++) {
      scenes[j].start = Number((scenes[j].start + delta).toFixed(3));
    }
    cutLocks.push({ at: target, kind: level, between: [prev.id, scenes[i].id] });
  }

  /* At most three strong-cue locks: more than that and the edit is following
     the music instead of the story. */
  const strong = cutLocks.filter((l) => l.kind === "strong_cue");
  if (strong.length > 3) {
    relaxations.push({
      level: 5,
      kind: "cue_budget",
      message: `${strong.length} strong-cue locks exceeds the budget of 3; keeping the first three`,
    });
    for (const extra of strong.slice(3)) extra.kind = "beat";
  }

  const total = Number(scenes.reduce((max, s) => Math.max(max, s.start + s.duration), 0).toFixed(3));

  return {
    ok: violations.length === 0,
    scenes: scenes.map((s) => ({
      id: s.id,
      start: s.start,
      duration: Number(s.duration.toFixed(2)),
      min: s.min,
      preferred: s.preferred,
      slack: Number((s.duration - s.min).toFixed(2)),
    })),
    total,
    cut_locks: cutLocks,
    relaxations,
    violations,
  };
}

/** Write the solve back into the graph so every later stage reads one answer. */
export function applyTiming(graph, plan) {
  const byId = new Map(plan.scenes.map((s) => [s.id, s]));
  return {
    ...graph,
    duration: plan.total,
    scenes: graph.scenes.map((scene) => {
      const solved = byId.get(scene.id);
      return solved ? { ...scene, start: solved.start, duration: solved.duration } : scene;
    }),
    seams: (graph.seams ?? []).map((seam) => {
      const to = byId.get(seam.to);
      return to ? { ...seam, at: to.start } : seam;
    }),
  };
}
