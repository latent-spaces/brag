/**
 * brag frames — build the frame packets and say which frames still need designing.
 *
 * This is where the boundary actually lands. Brag decides what the video
 * argues, what must be readable, what must be proven and how each cut travels.
 * It does not decide what a frame looks like — HyperFrames owns a catalogue of
 * motion rules and scene blueprints, and a frame worker reading that catalogue
 * designs a far better frame than a compiler emitting a flexbox ever will.
 *
 * The compiler's own per-scene markup is a scaffold and is treated as one: a
 * scene with a designed frame mounts it, a scene without falls back, and
 * `brag compose` never overwrites a frame a worker has authored.
 */

import fs from "node:fs";
import path from "node:path";
import { buildFramePackets } from "../frame-packets.mjs";
import { frameFile, withStarts } from "../lib/compile/targets.mjs";
import { resolveProject } from "../lib/state.mjs";
import { EXIT, gateError, report } from "../lib/util.mjs";

export async function run({ flags }) {
  const project = resolveProject(flags);
  project.load();

  const variant = flags.variant ?? "landscape";
  const dir = project.path("compositions", variant);
  if (!fs.existsSync(path.join(dir, "STORYBOARD.md"))) {
    throw gateError(
      `no composition at compositions/${variant}. Run \`brag compose\` first — the packets are built from its STORYBOARD.md.`,
    );
  }

  const graph = JSON.parse(fs.readFileSync(path.join(dir, "scene_graph.json"), "utf8"));
  const scenes = withStarts(graph);

  const packets = await buildFramePackets({ projectDir: dir });

  const work = scenes.map((scene, i) => {
    const rel = path.posix.join("compositions", "frames", frameFile(i, scene));
    const abs = path.join(dir, rel.split("/").join(path.sep));
    const exists = fs.existsSync(abs);
    const outline = exists && /^<!-- outline frame:/.test(fs.readFileSync(abs, "utf8").trimStart());
    const id = path.basename(rel, ".html");
    return {
      frame_id: id,
      scene: scene.id,
      designed: exists && !outline,
      packet: path.posix.join(".hyperframes", "frame-packets", `${id}.md`),
      write_to: path.posix.join(`compositions/${variant}`, rel),
    };
  });

  const todo = work.filter((w) => !w.designed);

  report(
    { ok: true, project_dir: dir, role: ".hyperframes/frame-packets/_role.md", frames: work, packets: packets.length },
    [
      `${packets.length} packet(s) in ${path.relative(project.targetRoot, dir)}/.hyperframes/frame-packets/`,
      todo.length
        ? `${todo.length} frame(s) still need designing:`
        : "Every frame has been designed. Run `brag compose` to assemble them.",
      ...todo.map((w) => `  ${w.frame_id.padEnd(16)} → ${w.write_to}`),
      todo.length
        ? "\nDispatch one worker per frame. Each reads _role.md and its own packet,\n" +
          "and writes only its assigned file. Then re-run `brag compose`."
        : "",
    ].filter(Boolean),
  );
  return EXIT.OK;
}
