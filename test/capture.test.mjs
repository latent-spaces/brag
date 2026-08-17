/**
 * Capture: redaction and terminal emulation.
 *
 * Redaction is tested hardest because it is the one part of this pipeline
 * whose failure mode is a credential in a file the user later publishes.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { isClean, redact } from "../cli/lib/capture/redact.mjs";
import { emulate, sessionText } from "../cli/lib/capture/terminal.mjs";

const chunk = (s, t = 0) => ({ t_ms: t, stream: "out", data: Buffer.from(s, "utf8") });

/* ------------------------------------------------------------------ redaction */

test("provider-shaped credentials are removed", () => {
  const cases = [
    "ghp_abcdefghijklmnop0123456789",
    "sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaa",
    "AKIAIOSFODNN7EXAMPLE",
    "xoxb-1234567890-abcdefghij",
  ];
  for (const secret of cases) {
    const { text } = redact(`printing ${secret} now`);
    assert.ok(!text.includes(secret), `${secret} survived redaction`);
    assert.match(text, /\[redacted\]/);
  }
});

test("named secrets in assignments are removed but the key is kept", () => {
  const { text } = redact('api_key="s3cret-value-here"');
  assert.ok(!text.includes("s3cret-value-here"));
  assert.match(text, /api_key=/, "the shape of the line should survive so it still reads as output");
});

test("credentials inside a connection string go, the user does not", () => {
  const { text } = redact("postgres://alice:hunter2@db.example.com:5432/app");
  assert.ok(!text.includes("hunter2"));
  assert.match(text, /postgres:\/\/alice:\[redacted\]@db\.example\.com/);
});

test("a bearer header keeps its scheme", () => {
  const { text } = redact("Authorization: Bearer abcdefghijklmnopqrstuvwxyz");
  assert.match(text, /Bearer \[redacted\]/);
});

test("ordinary output is left completely alone", () => {
  const plain = "2 files written to .tapedeck/\ninstalling... done OK";
  assert.equal(redact(plain).text, plain);
  assert.ok(isClean(plain));
});

test("redaction counts what it removed, by kind", () => {
  const { hits } = redact("ghp_aaaaaaaaaaaaaaaaaaaa and ghp_bbbbbbbbbbbbbbbbbbbb");
  const counts = Object.fromEntries(hits);
  assert.equal(counts.github_token, 2);
});

/* ------------------------------------------------------------------ emulation */

test("a progress bar rewriting its own line collapses to settled screens", async () => {
  const states = await emulate(
    [
      chunk("installing\r", 0),
      chunk("installing... 40%\r", 150),
      chunk("installing... 90%\r", 300),
      chunk("installing... done\n", 450),
    ],
    { geometry: { cols: 40, rows: 5 } },
  );
  assert.equal(states.length, 4, "each redraw that persisted is its own state");
  const last = states.at(-1);
  assert.equal(last.grid[0].runs.map((r) => r.text).join(""), "installing... done");
});

test("a redraw too brief to see is dropped", async () => {
  const states = await emulate(
    [chunk("one\r", 0), chunk("two\r", 5), chunk("three\n", 400)],
    { geometry: { cols: 20, rows: 4 } },
  );
  assert.ok(states.length < 3, `a 5ms flash should not count as a state (got ${states.length})`);
});

test("colour is preserved as a styled run", async () => {
  const states = await emulate([chunk("done \u001b[32mOK\u001b[0m\n")], {
    geometry: { cols: 20, rows: 3 },
  });
  const runs = states.at(-1).grid[0].runs;
  assert.equal(runs.length, 2, "plain text and coloured text are different runs");
  assert.equal(runs[0].text, "done ", "the space before a coloured word must survive");
  assert.equal(runs[1].text, "OK");
  assert.equal(runs[1].fg, 2);
});

test("lines start at column zero, as they would on a real tty", async () => {
  const session = {
    states: await emulate([chunk("first line\nsecond line\n")], { geometry: { cols: 30, rows: 4 } }),
  };
  assert.deepEqual(sessionText(session), ["first line", "second line"]);
});

test("indentation is rebuilt from column positions", async () => {
  const session = {
    states: await emulate([chunk(".tapedeck/\n  session.md\n")], { geometry: { cols: 30, rows: 4 } }),
  };
  assert.deepEqual(sessionText(session), [".tapedeck/", "  session.md"]);
});
