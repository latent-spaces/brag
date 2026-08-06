/**
 * Terminal capture, without a screen recorder.
 *
 * No recorder exists on this machine — no asciinema, agg, vhs or termtosvg —
 * and a screencast would be the wrong artifact anyway. What gets captured is
 * the byte stream, which is strictly better for this pipeline: it is
 * deterministic to replay, diffable, styleable in the film's own palette,
 * resolution-independent, and re-timable by the timing solver. A .cast or an
 * .mp4 gives none of that.
 *
 * The stream is replayed through a real terminal emulator rather than a
 * hand-rolled ANSI parser. Carriage returns, cursor moves and line erasure are
 * exactly what a spinner or a progress bar is made of — the moments most worth
 * showing in a CLI video — and a regex would turn them into garbage.
 *
 * Typed input is synthesized at a readable cadence, because real keystroke
 * timing is noise. Every *output* byte is real, and provenance records that
 * distinction so a video can never imply the typing was live.
 */

import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { redact } from "./redact.mjs";
import { gateError } from "../util.mjs";

/** A screen must survive this long to count as something a viewer saw. */
const SETTLE_MS = 80;

export const DEFAULT_GEOMETRY = { cols: 100, rows: 30 };

/* ------------------------------------------------------------------ running */

/**
 * Run one command and record its output as timestamped chunks.
 *
 * Without a PTY most tools disable colour and progress rendering, so colour is
 * forced and the absence of a real TTY is recorded rather than hidden. A
 * capture that quietly lost its spinners would be a lie by omission.
 */
/**
 * Quote one argument for cmd.exe.
 *
 * Spawning with `shell: true` is not an option here: Node concatenates the
 * arguments without escaping them, so the command that runs stops being the
 * command that was declared — the exact failure a truth-capturing stage cannot
 * have. Windows still needs a shell to reach `.cmd` shims like npm, so the
 * command line is built explicitly and handed over verbatim.
 */
function quoteForCmd(arg) {
  if (arg === "") return '""';
  if (!/[\s"^&|<>()%!]/.test(arg)) return arg;
  return `"${String(arg).replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, "$1$1")}"`;
}

function spawnArgs(argv) {
  if (process.platform !== "win32") {
    return { file: argv[0], args: argv.slice(1), options: {} };
  }
  const line = argv.map(quoteForCmd).join(" ");
  return {
    file: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", line],
    options: { windowsVerbatimArguments: true },
  };
}

export function runCommand({
  argv,
  cwd,
  env = {},
  geometry = DEFAULT_GEOMETRY,
  timeoutMs = 120_000,
}) {
  return new Promise((resolve, reject) => {
    const started = process.hrtime.bigint();
    const raw = [];
    const at = () => Number((process.hrtime.bigint() - started) / 1_000_000n);

    const { file, args, options } = spawnArgs(argv);
    const child = spawn(file, args, {
      ...options,
      cwd,
      env: {
        ...process.env,
        ...env,
        FORCE_COLOR: "3",
        CLICOLOR_FORCE: "1",
        TERM: "xterm-256color",
        COLUMNS: String(geometry.cols),
        LINES: String(geometry.rows),
        /* Keep the capture reproducible and free of the operator's identity. */
        NO_UPDATE_NOTIFIER: "1",
        CI: "",
      },
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(gateError(`\`${argv.join(" ")}\` did not finish within ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on("data", (d) => raw.push({ t_ms: at(), stream: "out", data: d }));
    child.stderr?.on("data", (d) => raw.push({ t_ms: at(), stream: "err", data: d }));

    child.on("error", (e) => {
      clearTimeout(timer);
      reject(gateError(`could not run \`${argv.join(" ")}\`: ${e.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exit_code: code ?? -1,
        duration_ms: at(),
        raw,
        pty: false,
      });
    });
  });
}

/* ------------------------------------------------------------------ emulation */

let TerminalCtor = null;

async function terminal(geometry) {
  if (!TerminalCtor) {
    try {
      const mod = await import("@xterm/headless");
      TerminalCtor = mod.default?.Terminal ?? mod.Terminal;
    } catch {
      throw gateError(
        "terminal capture needs a terminal emulator.\n" +
          "Run `npm install` in the brag repo, then try again.\n" +
          "Hand-parsing ANSI is not an option here: carriage returns and line erasure are " +
          "what spinners and progress bars are made of, and getting them wrong produces " +
          "garbage rather than a visible failure.",
      );
    }
  }
  return new TerminalCtor({
    cols: geometry.cols,
    rows: geometry.rows,
    allowProposedApi: true,
    scrollback: 0,
    /* A real tty applies ONLCR, turning a bare line feed into a carriage
       return plus line feed. Captured without a pty the stream has bare line
       feeds, so without this every line after the first starts at whatever
       column the last one ended on — a staircase no user has ever seen. */
    convertEol: true,
  });
}

const writeChunk = (term, data) =>
  new Promise((resolve) => term.write(data, () => resolve()));

/** Group a row's cells into runs of identical styling. */
function rowRuns(line, cols) {
  const runs = [];
  let current = null;

  for (let x = 0; x < cols; x++) {
    const cell = line.getCell(x);
    if (!cell) break;
    const chars = cell.getChars() || " ";
    const style = {
      fg: cell.isFgDefault() ? null : cell.getFgColor(),
      bg: cell.isBgDefault() ? null : cell.getBgColor(),
      bold: Boolean(cell.isBold()),
      dim: Boolean(cell.isDim()),
      italic: Boolean(cell.isItalic()),
      underline: Boolean(cell.isUnderline()),
      inverse: Boolean(cell.isInverse()),
    };
    const key = JSON.stringify(style);

    if (current && current.key === key) {
      current.text += chars;
    } else {
      if (current) runs.push(current);
      current = { col: x, text: chars, key, ...style };
    }
  }
  if (current) runs.push(current);

  /* Trailing blanks are padding, not content, so the row is trimmed from the
     right — but only at the row's end. Trimming every run would eat the space
     between a word and the coloured word after it, which is a different style
     and therefore a different run: "done OK" would come back as "doneOK". */
  const trimmed = runs.map(({ key, ...run }) => run);
  while (trimmed.length && !trimmed.at(-1).text.trim()) trimmed.pop();
  if (trimmed.length) {
    const last = trimmed.at(-1);
    last.text = last.text.replace(/\s+$/, "");
  }
  return trimmed;
}

function snapshot(term, geometry) {
  const buffer = term.buffer.active;
  const grid = [];
  for (let y = 0; y < geometry.rows; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;
    const runs = rowRuns(line, geometry.cols);
    if (runs.length) grid.push({ row: y, runs });
  }
  return {
    grid,
    cursor: { row: buffer.cursorY, col: buffer.cursorX },
  };
}

const digestOf = (grid) =>
  grid.map((r) => `${r.row}:${r.runs.map((x) => `${x.col}${x.text}${x.fg ?? ""}`).join("|")}`).join("\n");

/**
 * Replay the byte stream and keep the screens that persisted.
 *
 * @returns {Promise<object[]>} states
 */
export async function emulate(raw, { geometry = DEFAULT_GEOMETRY, settleMs = SETTLE_MS } = {}) {
  const term = await terminal(geometry);
  const seen = [];

  for (const chunk of raw) {
    await writeChunk(term, chunk.data);
    const shot = snapshot(term, geometry);
    const digest = digestOf(shot.grid);
    const last = seen.at(-1);
    if (last && last.digest === digest) continue;
    seen.push({ t_ms: chunk.t_ms, digest, ...shot });
  }

  /* The final screen always counts, however briefly it appeared: it is what
     the command left behind. */
  return seen
    .map((state, i) => {
      const next = seen[i + 1];
      const hold = next ? next.t_ms - state.t_ms : settleMs;
      return { ...state, hold_ms: hold };
    })
    .filter((state, i, all) => i === all.length - 1 || state.hold_ms >= settleMs);
}

/* ------------------------------------------------------------------ capture */

/**
 * Capture one declared invocation end to end.
 *
 * @returns {Promise<object>} a terminal_session artifact
 */
export async function captureTerminal({
  id,
  argv,
  displayCommand,
  cwd,
  env,
  geometry = DEFAULT_GEOMETRY,
  expectExit = 0,
  timeoutMs,
  toolVersion,
}) {
  const run = await runCommand({ argv, cwd, env, geometry, timeoutMs });

  if (expectExit !== null && run.exit_code !== expectExit) {
    throw gateError(
      `\`${argv.join(" ")}\` exited ${run.exit_code}, expected ${expectExit}. ` +
        "A capture is product truth; recording a failed run as though it succeeded is the " +
        "one thing this stage must never do.",
    );
  }

  /* Redact before anything is persisted, and count what was removed.

     Decoding runs through a streaming decoder rather than calling toString on
     each chunk: a process writing UTF-8 splits multi-byte characters across
     chunk boundaries whenever it feels like it, and decoding the halves
     separately turns them into replacement characters. That showed up on
     screen as a stray diamond in the middle of real captured output. */
  const redactions = new Map();
  const decoder = new StringDecoder("utf8");
  const cleaned = run.raw.map((chunk, i) => {
    const decoded =
      decoder.write(chunk.data) + (i === run.raw.length - 1 ? decoder.end() : "");
    const { text, hits } = redact(decoded);
    for (const [kind, n] of hits) redactions.set(kind, (redactions.get(kind) ?? 0) + n);
    return { ...chunk, data: Buffer.from(text, "utf8") };
  });

  const states = await emulate(cleaned, { geometry });

  return {
    schema: "brag.terminal_session/1",
    id,
    tool_version: toolVersion ?? null,
    environment: {
      cwd_rel: ".",
      shell: process.platform === "win32" ? "cmd" : process.env.SHELL ?? "sh",
      term: "xterm-256color",
      cols: geometry.cols,
      rows: geometry.rows,
      pty: run.pty,
      os: process.platform,
    },
    provenance: {
      input: "synthesized",
      output: "captured",
      redactions: [...redactions].map(([kind, count]) => ({ kind, count })),
      note: run.pty
        ? null
        : "captured without a pty: progress bars and spinners may be absent because the tool saw no tty",
    },
    invocation: {
      argv,
      display_command: displayCommand ?? argv.join(" "),
      exit_code: run.exit_code,
      duration_ms: run.duration_ms,
    },
    raw: cleaned.map((c) => ({
      t_ms: c.t_ms,
      stream: c.stream,
      data_b64: c.data.toString("base64"),
    })),
    states: states.map(({ digest, ...state }) => ({ ...state, digest })),
  };
}

/**
 * The lines a session actually printed, in order — what the fidelity check
 * compares a rendered frame against.
 */
export function sessionText(session) {
  const last = session.states.at(-1);
  if (!last) return [];
  return last.grid.map((row) => {
    /* Runs carry their column, so the row is rebuilt by position rather than
       by joining — otherwise indentation and aligned output, which is most of
       what a CLI prints, come back wrong. */
    let out = "";
    for (const run of row.runs) {
      if (run.col > out.length) out += " ".repeat(run.col - out.length);
      out += run.text;
    }
    return out.replace(/\s+$/, "");
  });
}
