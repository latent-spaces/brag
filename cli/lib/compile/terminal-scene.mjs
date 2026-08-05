/**
 * Rendering a captured terminal session inside a composition.
 *
 * This is what makes a CLI product's video show the product. The states come
 * from a real run — every output byte captured, replayed through a terminal
 * emulator — so what appears on screen is what the tool actually printed,
 * including the way a progress bar rewrote its own line.
 *
 * States are swapped rather than appended, because a rewrite is not an
 * addition: `installing... 40%` becoming `installing... done` is one line
 * changing, and appending both would be a lie about what the terminal did.
 * The swap is a zero-duration set at a threshold, which is seek-safe in both
 * directions — the renderer samples frames out of order and a state built by
 * accumulation would desync.
 */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * ANSI colour index → a role in the film's palette.
 *
 * Terminal colours are mapped rather than reproduced. A captured green is
 * "success" in the tool's vocabulary, and rendering it as the film's own
 * success colour keeps the terminal part of the picture instead of a
 * screenshot pasted into it. Anything outside the basic sixteen falls back to
 * body text, which is the honest reading of "some colour we do not have a role
 * for".
 */
const ANSI_ROLE = {
  1: "--danger", 9: "--danger",
  2: "--success", 10: "--success",
  3: "--warn", 11: "--warn",
  4: "--accent", 12: "--accent",
  5: "--accent", 13: "--accent",
  6: "--accent", 14: "--accent",
  7: "--text", 15: "--text",
  0: "--muted", 8: "--muted",
};

const colourFor = (fg) =>
  fg === null || fg === undefined ? "var(--text)" : `var(${ANSI_ROLE[fg] ?? "--text"}, var(--text))`;

/**
 * Lay the captured states across the scene's own time.
 *
 * Real capture timings are wall-clock and usually far too quick to read, so
 * they are used for *proportion* only: each state keeps its share of the
 * scene, and no state gets less than a readable dwell. A capture whose states
 * cannot all fit at that floor drops its briefest ones rather than flashing
 * them, and says so.
 */
export function scheduleStates(states, { start, duration, minDwell = 0.5, tail = 0.34 }) {
  const usable = Math.max(0.4, duration - tail);
  const maxStates = Math.max(1, Math.floor(usable / minDwell));

  /* Keep the longest-held states: those are the ones a person actually saw. */
  let kept = states;
  let dropped = 0;
  if (states.length > maxStates) {
    const ranked = states
      .map((s, i) => ({ s, i, hold: s.hold_ms ?? 0 }))
      .sort((a, b) => b.hold - a.hold)
      .slice(0, maxStates)
      .sort((a, b) => a.i - b.i);
    kept = ranked.map((r) => r.s);
    dropped = states.length - kept.length;
  }

  const totalHold = kept.reduce((n, s) => n + Math.max(1, s.hold_ms ?? 1), 0);
  let t = start;
  const scheduled = kept.map((state, i) => {
    const share = Math.max(1, state.hold_ms ?? 1) / totalHold;
    const span = i === kept.length - 1 ? start + usable - t : Math.max(minDwell, usable * share);
    const at = Number(t.toFixed(2));
    t = Math.min(start + usable, t + span);
    return { state, at, until: Number(t.toFixed(2)) };
  });

  return { scheduled, dropped };
}

/** One state as absolutely-positioned styled rows. */
function stateHtml(sceneId, index, state, { rowHeight, charWidth }) {
  const rows = state.grid
    .map((row) => {
      const runs = row.runs
        .map(
          (run) =>
            `<span style="left:${(run.col * charWidth).toFixed(1)}px;color:${colourFor(run.fg)}` +
            `${run.bold ? ";font-weight:600" : ""}${run.dim ? ";opacity:.7" : ""}">${esc(run.text)}</span>`,
        )
        .join("");
      return `        <div class="trow" style="top:${(row.row * rowHeight).toFixed(1)}px">${runs}</div>`;
    })
    .join("\n");
  return [
    `      <div class="tstate" id="tstate-${sceneId}-${index}">`,
    rows,
    `      </div>`,
  ].join("\n");
}

/**
 * @returns {{html: string, tweens: string[], css: string, dropped: number}}
 */
export function buildTerminalScene({ scene, session, start, duration, geometry, px }) {
  const cols = session.environment?.cols ?? 100;
  const rows = session.environment?.rows ?? 30;

  /* Sized so the widest captured line fits: the terminal is the product here,
     and reflowing its output would misrepresent it. */
  /* Sized from the widest row that is actually used, not the capture's declared
     width: a session captured at 96 columns whose longest line is 70 wastes a
     third of the frame if sized on the declaration. Rows are never reflowed —
     rewrapping terminal output misrepresents what the terminal did — so a
     capture genuinely too wide for the shape is reported rather than cropped
     silently. */
  const widestUsed = Math.max(
    ...session.states.flatMap((s) =>
      s.grid.map((row) => row.runs.reduce((n, r) => Math.max(n, r.col + r.text.length), 0)),
    ),
    1,
  );
  const effectiveCols = Math.min(cols, widestUsed);
  const charWidth = Math.max(5, Math.floor((geometry.width * 0.82) / effectiveCols));
  const tooWide = charWidth <= 5 && widestUsed * 6 > geometry.width * 0.9;
  const rowHeight = Math.round(charWidth * 2.05);
  const usedRows = Math.max(...session.states.map((s) => (s.grid.at(-1)?.row ?? 0) + 1), 1);

  const { scheduled, dropped } = scheduleStates(session.states, { start, duration });

  const html = [
    `      <div class="term" id="term-${scene.id}" style="--tw:${charWidth}px;--th:${rowHeight}px">`,
    `        <div class="tbar"><span class="tdot"></span><span class="tlabel">${esc(session.invocation.display_command)}</span></div>`,
    `        <div class="tview" style="height:${(usedRows * rowHeight + rowHeight).toFixed(0)}px">`,
    ...scheduled.map(({ state }, i) => stateHtml(scene.id, i, state, { rowHeight, charWidth })),
    `        </div>`,
    `      </div>`,
  ].join("\n");

  /* Every state hidden, then exactly one shown at a time. Zero-duration sets
     at thresholds: the renderer seeks, so a state that depended on having
     passed through the previous one would be wrong on a backwards sample. */
  const tweens = [
    `      tl.set([${scheduled.map((_, i) => `"#tstate-${scene.id}-${i}"`).join(", ")}], { autoAlpha: 0 }, ${Number(start.toFixed(2))});`,
    ...scheduled.flatMap(({ at }, i) => [
      `      tl.set("#tstate-${scene.id}-${i}", { autoAlpha: 1 }, ${at});`,
      ...(i > 0 ? [`      tl.set("#tstate-${scene.id}-${i - 1}", { autoAlpha: 0 }, ${at});`] : []),
    ]),
  ];

  return { html, tweens, dropped, states: scheduled.length, tooWide, columns: effectiveCols };
}

export const TERMINAL_CSS = `
      .term {
        position: relative;
        width: 100%;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        font-family: var(--mono);
      }
      .tbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border);
      }
      .tdot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
      .tlabel { font-size: 0.62em; color: var(--muted); letter-spacing: .01em; }
      .tview { position: relative; padding: 14px 16px; }
      .tstate { position: absolute; inset: 14px 16px; opacity: 0; }
      .trow { position: absolute; left: 0; right: 0; height: var(--th); line-height: var(--th); white-space: pre; }
      .trow span { position: absolute; font-size: calc(var(--tw) * 1.68); }`;
