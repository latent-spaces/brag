#!/usr/bin/env node
/**
 * brag — turn a project into a short, shareable launch video.
 *
 * Brag 1.0 is a direction and verification layer. It owns product truth,
 * positioning, concept, scene graph, visual world, timing, review and
 * variants; it compiles all of that into the artifacts HyperFrames already
 * consumes, and HyperFrames owns everything from the DOM down.
 *
 * Every command exits non-zero on failure. That is the whole contract.
 */

import { parseArgs } from "node:util";
import { readPackageVersion } from "./lib/state.mjs";
import {
  BragError,
  EXIT,
  configureOutput,
  fail,
  say,
} from "./lib/util.mjs";

/** Command registry. `load` is lazy so a broken command can't break `--help`. */
const COMMANDS = {
  init: { blurb: "create brag/ in the current project", load: () => import("./commands/init.mjs") },
  status: { blurb: "show which pipeline stages are done and what is next", load: () => import("./commands/status.mjs") },
  doctor: { blurb: "verify HyperFrames, ffmpeg and the skill pack are usable", load: () => import("./commands/doctor.mjs") },

  inspect: { blurb: "classify the product surface and extract verified product truth", load: () => import("./commands/inspect.mjs") },
  position: { blurb: "map audience, angle and every claim to a source", load: () => import("./commands/position.mjs") },
  concepts: { blurb: "generate at least three distinct creative concepts", load: () => import("./commands/concepts.mjs") },
  select: { blurb: "score the concepts and lock one", load: () => import("./commands/select.mjs") },
  direct: { blurb: "choose the visual world and derive the design truth", load: () => import("./commands/direct.mjs") },
  storyboard: { blurb: "build the scene graph", load: () => import("./commands/storyboard.mjs") },
  capture: { blurb: "record the real product surface", load: () => import("./commands/capture.mjs") },
  compose: { blurb: "compile the scene graph into a HyperFrames project", load: () => import("./commands/compose.mjs") },
  frames: { blurb: "build frame packets and list the frames still to design", load: () => import("./commands/frames.mjs") },
  watch: { blurb: "turn a render into a reviewable bundle of frames and facts", load: () => import("./commands/watch.mjs") },
  review: { blurb: "run the four verification layers against a render", load: () => import("./commands/review.mjs") },
  revise: { blurb: "apply a scoped change without regenerating everything", load: () => import("./commands/revise.mjs") },
  variant: { blurb: "recompose the scene graph for another format", load: () => import("./commands/variant.mjs") },
  deliver: { blurb: "render, pick a poster, write share copy and the manifest", load: () => import("./commands/deliver.mjs") },
};

/** Flags every command understands. */
const GLOBAL_OPTIONS = {
  project: { type: "string", short: "C" },
  json: { type: "boolean", default: false },
  quiet: { type: "boolean", short: "q", default: false },
  help: { type: "boolean", short: "h", default: false },
  version: { type: "boolean", short: "v", default: false },
  // two-phase contract
  emit: { type: "boolean", default: false },
  accept: { type: "boolean", default: false },
  // common modifiers
  force: { type: "boolean", default: false },
  name: { type: "string" },
  variant: { type: "string" },
  world: { type: "string" },
  run: { type: "boolean", default: false },
  narrative: { type: "boolean", default: false },
  "accept-narrative": { type: "boolean", default: false },
  duration: { type: "string" },
  video: { type: "string" },
  deep: { type: "boolean", default: false },
  strict: { type: "boolean", default: false },
};

function printHelp() {
  const width = Math.max(...Object.keys(COMMANDS).map((c) => c.length));
  say(`brag ${readPackageVersion()} — turn a project into a launch video`);
  say("");
  say("Usage: brag <command> [options]");
  say("");
  say("Pipeline");
  for (const [name, { blurb }] of Object.entries(COMMANDS)) {
    say(`  ${name.padEnd(width)}  ${blurb}`);
  }
  say("");
  say("Options");
  say("  -C, --project <dir>  the project to brag about (default: cwd)");
  say("      --emit           write a task spec for the agent to answer");
  say("      --accept         validate the agent's answer and record it");
  say("      --json           machine-readable output");
  say("  -q, --quiet          suppress progress output");
  say("  -h, --help           this text");
  say("");
  say("A stage is done when its artifact exists and validates. Run `brag status`");
  say("at any point to see what is finished and what comes next.");
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: GLOBAL_OPTIONS,
      allowPositionals: true,
      strict: false,
    });
  } catch (e) {
    throw new BragError(e.message, EXIT.USAGE);
  }

  const { values: flags, positionals } = parsed;
  configureOutput({ json: flags.json, quiet: flags.quiet });

  if (flags.version) {
    say(readPackageVersion());
    return EXIT.OK;
  }

  const [commandName, ...rest] = positionals;

  if (!commandName || flags.help) {
    printHelp();
    return EXIT.OK;
  }

  const entry = COMMANDS[commandName];
  if (!entry) {
    const near = Object.keys(COMMANDS).filter((c) => c.startsWith(commandName[0]));
    throw new BragError(
      `unknown command "${commandName}"` +
        (near.length ? `. Did you mean: ${near.join(", ")}?` : ". Run `brag --help`."),
      EXIT.USAGE,
    );
  }

  const mod = await entry.load();
  if (typeof mod.run !== "function") {
    throw new BragError(`command "${commandName}" is not implemented yet`, EXIT.USAGE);
  }
  const code = await mod.run({ flags, args: rest });
  return typeof code === "number" ? code : EXIT.OK;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    if (err instanceof BragError) {
      fail(err.message);
      process.exit(err.code);
    }
    fail(err?.stack ?? String(err));
    process.exit(EXIT.GATE);
  });
