#!/usr/bin/env node
// brag-desktop: local server that drives the `claude` CLI (your subscription login)
// to run the /brag skill, and streams progress to a browser UI.
import http from 'node:http';
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PRESETS, CATEGORIES, byId, presetBlock } from './presets.js';

const HOST = '127.0.0.1';
const PORT = Number(process.env.BRAG_PORT || 4178);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'), 'brag-desktop');
const SKILL_DIR = path.join(DATA, 'brag');
// Claude Code refuses to copy files *out of* a path containing `skills/` ("sensitive file"), so bundled
// music/SFX are staged in a neutral folder and the agent is told to copy from there.
const ASSETS_DIR = path.join(DATA, 'brag-assets');
const RUNS_FILE = path.join(DATA, 'runs.json');
const LOGS_DIR = path.join(DATA, 'logs');
const BRAG_REPO = 'https://github.com/latent-spaces/brag';
const BRAG_AUDITED = '669ab92'; // commit that was security-audited
fs.mkdirSync(LOGS_DIR, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' };

// ---------- state ----------
const runs = new Map(); // id -> {meta, events[], clients:Set, proc, timer}
function loadRuns() {
  try {
    for (const m of JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'))) {
      if (m.status === 'running') { m.status = 'interrupted'; }
      let events = [];
      try { events = fs.readFileSync(path.join(LOGS_DIR, m.id + '.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch {}
      if (!m.outDir) { const o = [...events].reverse().find(e => e.type === 'outputs' && e.outDir); if (o) m.outDir = o.outDir; }
      runs.set(m.id, { meta: m, events, clients: new Set(), proc: null, timer: null });
    }
  } catch {}
}
function saveRuns() {
  const list = [...runs.values()].map(r => r.meta).sort((a, b) => b.startedAt - a.startedAt).slice(0, 200);
  fs.writeFileSync(RUNS_FILE, JSON.stringify(list, null, 1));
}
loadRuns();

function emit(run, ev) {
  ev.t = Date.now();
  run.events.push(ev);
  fs.appendFile(path.join(LOGS_DIR, run.meta.id + '.jsonl'), JSON.stringify(ev) + '\n', () => {});
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  for (const c of run.clients) c.write(line);
}
function setMeta(run, patch) { Object.assign(run.meta, patch); saveRuns(); emit(run, { type: 'meta', meta: run.meta }); }

// ---------- helpers ----------
const sh = (cmd, args, opts = {}) => new Promise(res => execFile(cmd, args, { timeout: 15000, ...opts }, (e, so, se) => res({ ok: !e, out: (so || '').trim(), err: (se || '').trim() })));
const has = async c => (await sh('which', [c])).ok;
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise((ok, no) => { let b = ''; req.on('data', d => { b += d; if (b.length > 1e6) { no(new Error('too large')); req.destroy(); } }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(e); } }); });
const expandHome = p => (p || '').replace(/^~(?=$|\/)/, os.homedir());

async function skillInstalled() {
  const ok = fs.existsSync(path.join(SKILL_DIR, '.claude-plugin/plugin.json'));
  let rev = null;
  if (ok) rev = (await sh('git', ['-C', SKILL_DIR, 'rev-parse', '--short', 'HEAD'])).out;
  return { installed: ok, rev, audited: !!rev && rev.startsWith(BRAG_AUDITED.slice(0, 7)) };
}
async function stageAssets() {
  const src = path.join(SKILL_DIR, 'skills/brag/assets');
  if (!fs.existsSync(src)) return;
  await fsp.rm(ASSETS_DIR, { recursive: true, force: true });
  await fsp.mkdir(ASSETS_DIR, { recursive: true });
  for (const d of ['music', 'sfx']) if (fs.existsSync(path.join(src, d))) await fsp.cp(path.join(src, d), path.join(ASSETS_DIR, d), { recursive: true });
}
async function installSkill(latest) {
  await fsp.rm(SKILL_DIR, { recursive: true, force: true });
  let r = await sh('git', ['clone', ...(latest ? ['--depth', '1'] : []), BRAG_REPO, SKILL_DIR], { timeout: 180000 });
  if (!r.ok) throw new Error(r.err || 'git clone failed');
  if (!latest) {
    r = await sh('git', ['-C', SKILL_DIR, 'checkout', BRAG_AUDITED]);
    if (!r.ok) throw new Error(r.err || 'checkout failed');
  }
  await stageAssets();
}

async function status() {
  const [ver, auth, ff, node, git] = await Promise.all([sh('claude', ['--version']), sh('claude', ['auth', 'status']), has('ffmpeg'), has('node'), has('git')]);
  let a = {}; try { a = JSON.parse(auth.out); } catch {}
  return { claude: ver.ok ? ver.out : null, loggedIn: !!a.loggedIn, authMethod: a.authMethod || null, apiKeyEnvIgnored: !!process.env.ANTHROPIC_API_KEY,
    ffmpeg: ff, node, git, skill: await skillInstalled(), auditedCommit: BRAG_AUDITED };
}

function buildPrompt(o) {
  const opts = [];
  if (o.tone) opts.push(`tone: ${o.tone}`);
  if (o.format && o.format !== 'landscape') opts.push(`format: ${o.format}`);
  if (o.duration) opts.push(`duration: ${o.duration} seconds`);
  if (o.noMusic) opts.push('no music');
  if (o.noSfx) opts.push('no sound effects');
  if (o.voice) opts.push('voiceover enabled (--voice)');
  if (o.title) opts.push(`title: ${o.title}`);
  if (o.full) opts.push('use the full /brag workflow (--full), not brag-slim');
  const preset = o.preset ? byId(o.preset) : null;
  return [
    'Run the brag skill (the "brag" plugin skill, i.e. /brag) on the project in the current directory.',
    opts.length ? 'Options: ' + opts.join('; ') + '.' : '',
    preset ? presetBlock(preset) : '',
    o.extra ? `Extra creative direction from the user: ${o.extra}` : '',
    `The bundled music and SFX are also staged, identical to <skill-dir>/assets/music and /sfx, at ${ASSETS_DIR}. Copy audio from there (copying from inside the skill directory is blocked by the sandbox).`,
    'This is a non-interactive run: do not ask questions, make sensible choices, and write results to brag-output/ (use a timestamped directory if one already exists).',
    'When finished, state the paths of brag.mp4, brag.jpg and share-copy.txt.'
  ].filter(Boolean).join('\n');
}

const SAFE_TOOLS = ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash(npx:*)', 'Bash(ffmpeg:*)', 'Bash(ffprobe:*)', 'Bash(uv run:*)',
  'Bash(mkdir:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(cp:*)', 'Bash(mv:*)', 'Bash(node:*)', 'Bash(cd:*)', 'Bash(date:*)',
  // read-only helpers the agent chains into pipes (each part of a compound command is checked separately)
  'Bash(head:*)', 'Bash(tail:*)', 'Bash(grep:*)', 'Bash(which:*)', 'Bash(wc:*)', 'Bash(sort:*)', 'Bash(find:*)', 'Bash(echo:*)', 'Bash(pwd:*)', 'Bash(stat:*)', 'Bash(file:*)'];

async function findOutDir(projectDir, since) {
  let best = null;
  try {
    for (const d of await fsp.readdir(projectDir)) {
      if (!d.startsWith('brag-output')) continue;
      const st = await fsp.stat(path.join(projectDir, d));
      if (st.isDirectory() && st.mtimeMs >= since - 2000 && (!best || st.mtimeMs > best.m)) best = { d, m: st.mtimeMs };
    }
  } catch {}
  return best ? path.join(projectDir, best.d) : null;
}
async function scanOutputs(run) {
  const m = run.meta;
  const outDir = m.outDir || await findOutDir(m.projectDir, m.startedAt);
  if (outDir && !m.outDir) m.outDir = outDir;
  if (!outDir) return;
  const f = n => fs.existsSync(path.join(outDir, n));
  const steps = { plan: f('brag-plan.md'), brief: f('composition-brief.md') || f('composition'), video: f('brag.mp4'), poster: f('brag.jpg'), copy: f('share-copy.txt') };
  let copy = null; if (steps.copy) try { copy = fs.readFileSync(path.join(outDir, 'share-copy.txt'), 'utf8'); } catch {}
  const key = JSON.stringify([outDir, steps, copy]);
  if (key !== run.lastScan) { run.lastScan = key; m.outDir = outDir; emit(run, { type: 'outputs', outDir, steps, copy }); saveRuns(); }
}

function startRun(o, resume) {
  const projectDir = path.resolve(expandHome(o.projectDir));
  const id = resume ? resume.meta.id : crypto.randomBytes(5).toString('hex');
  const run = resume || { meta: { id, startedAt: Date.now() }, events: [], clients: new Set(), proc: null, timer: null };
  const prompt = resume ? o.message : buildPrompt(o);
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--plugin-dir', SKILL_DIR, '--add-dir', SKILL_DIR, '--add-dir', ASSETS_DIR];
  if (resume) args.push('--resume', resume.meta.sessionId);
  if (o.model) args.push('--model', o.model);
  if (o.autoApprove) args.push('--permission-mode', 'bypassPermissions');
  else args.push('--permission-mode', 'acceptEdits', '--allowedTools', ...SAFE_TOOLS);

  const env = { ...process.env, npm_config_yes: 'true', CI: '1' };
  delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN; // force subscription login

  if (!resume) {
    Object.assign(run.meta, { projectDir, preset: byId(o.preset)?.name || null, options: { ...o, projectDir }, title: o.title || path.basename(projectDir), status: 'running', startedAt: Date.now(), outDir: null });
    runs.set(id, run);
  } else { run.meta.status = 'running'; run.meta.startedAt = Date.now(); delete run.meta.error; }
  run.lastScan = null;
  saveRuns();
  emit(run, { type: 'meta', meta: run.meta });
  emit(run, { type: 'user', text: resume ? o.message : prompt });

  const proc = spawn('claude', args, { cwd: projectDir, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  run.proc = proc;
  let buf = '', stderr = '';
  proc.stdout.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      if (!line.trim()) continue;
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      handleClaudeEvent(run, ev);
    }
  });
  proc.stderr.on('data', d => { stderr += d; if (stderr.length > 20000) stderr = stderr.slice(-20000); });
  run.timer = setInterval(() => scanOutputs(run), 1500);
  proc.on('error', e => { clearInterval(run.timer); setMeta(run, { status: 'failed', error: e.message }); });
  proc.on('close', async (code, sig) => {
    clearInterval(run.timer); run.proc = null;
    await scanOutputs(run);
    if (run.meta.status === 'running') {
      setMeta(run, run.cancelled ? { status: 'cancelled' } : code === 0 ? { status: 'done' } : { status: 'failed', error: (stderr.trim().split('\n').slice(-3).join(' ') || `exit ${code ?? sig}`) });
    }
    run.cancelled = false;
  });
  return run;
}

function handleClaudeEvent(run, ev) {
  if (ev.type === 'system' && ev.subtype === 'init') { setMeta(run, { sessionId: ev.session_id, model: ev.model }); return; }
  if (ev.type === 'assistant') {
    for (const c of ev.message?.content || []) {
      if (c.type === 'text' && c.text.trim()) emit(run, { type: 'text', text: c.text });
      else if (c.type === 'tool_use') emit(run, { type: 'tool', id: c.id, name: c.name, input: summarizeInput(c.name, c.input) });
    }
  } else if (ev.type === 'user') {
    for (const c of ev.message?.content || []) if (c.type === 'tool_result') {
      const t = typeof c.content === 'string' ? c.content : (c.content || []).map(x => x.text || '').join('');
      emit(run, { type: 'tool_result', id: c.tool_use_id, error: !!c.is_error, text: t.slice(0, 1500) });
    }
  } else if (ev.type === 'result') {
    emit(run, { type: 'result', ok: !ev.is_error, text: ev.result || '', cost: ev.total_cost_usd, ms: ev.duration_ms, denials: (ev.permission_denials || []).map(d => d.tool_name + (d.tool_input?.command ? ': ' + d.tool_input.command : '')) });
    run.meta.sessionId = ev.session_id || run.meta.sessionId;
    setMeta(run, { status: ev.is_error ? 'failed' : 'done', error: ev.is_error ? (ev.result || 'error') : undefined, ms: ev.duration_ms });
  }
}
function summarizeInput(name, i = {}) {
  if (name === 'Bash') return i.command?.slice(0, 400);
  if (i.file_path) return i.file_path;
  if (i.pattern) return i.pattern;
  if (i.skill) return i.skill;
  return JSON.stringify(i).slice(0, 200);
}

function cancelRun(run) {
  if (!run.proc) return;
  run.cancelled = true;
  try { process.kill(-run.proc.pid, 'SIGTERM'); } catch {}
  setTimeout(() => { try { process.kill(-run.proc.pid, 'SIGKILL'); } catch {} }, 4000);
}

// ---------- http ----------
function allowedFile(p) {
  const real = path.resolve(p);
  for (const r of runs.values()) {
    const o = r.meta.outDir; if (!o) continue;
    const base = path.resolve(o);
    if (real === base || real.startsWith(base + path.sep)) return real;
  }
  return null;
}
function serveFile(req, res, file) {
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (range) {
      let s = range[1] ? +range[1] : 0, en = range[2] ? +range[2] : st.size - 1;
      if (s > en || s >= st.size) { res.writeHead(416); return res.end(); }
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${s}-${en}/${st.size}`, 'content-length': en - s + 1 });
      fs.createReadStream(file, { start: s, end: en }).pipe(res);
    } else {
      res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size, 'cache-control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    }
  });
}

const server = http.createServer(async (req, res) => {
  try {
    // DNS-rebinding / CSRF guard: this server can spawn processes, so only accept our own origin.
    const okHosts = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
    if (!okHosts.includes(req.headers.host)) { res.writeHead(403); return res.end('bad host'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const origin = req.headers.origin;
      if (!origin || !okHosts.some(h => origin === 'http://' + h)) { res.writeHead(403); return res.end('bad origin'); }
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const p = url.pathname;

    if (p === '/api/status') return json(res, 200, await status());
    if (p === '/api/skill/install' && req.method === 'POST') {
      const b = await readBody(req);
      await installSkill(!!b.latest);
      return json(res, 200, await skillInstalled());
    }
    if (p === '/api/presets') return json(res, 200, { categories: CATEGORIES, presets: PRESETS });
    if (p === '/api/runs' && req.method === 'GET') return json(res, 200, [...runs.values()].map(r => r.meta).sort((a, b) => b.startedAt - a.startedAt));
    if (p === '/api/runs' && req.method === 'POST') {
      const o = await readBody(req);
      const dir = path.resolve(expandHome(o.projectDir || ''));
      if (!o.projectDir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return json(res, 400, { error: 'Project folder does not exist.' });
      if (o.preset && !byId(o.preset)) return json(res, 400, { error: 'Unknown preset.' });
      if (!(await skillInstalled()).installed) return json(res, 400, { error: 'brag skill is not installed yet.' });
      if (!fs.existsSync(ASSETS_DIR)) await stageAssets();
      if ([...runs.values()].some(r => r.proc && r.meta.projectDir === dir)) return json(res, 409, { error: 'A run is already active for this project.' });
      const run = startRun(o);
      return json(res, 200, run.meta);
    }
    let m;
    if ((m = p.match(/^\/api\/runs\/(\w+)\/(events|cancel|message)$/))) {
      const run = runs.get(m[1]); if (!run) return json(res, 404, { error: 'no such run' });
      if (m[2] === 'events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        for (const ev of run.events) res.write(`data: ${JSON.stringify(ev)}\n\n`);
        run.clients.add(res); req.on('close', () => run.clients.delete(res)); return;
      }
      if (m[2] === 'cancel') { cancelRun(run); return json(res, 200, { ok: true }); }
      if (m[2] === 'message') {
        const b = await readBody(req);
        if (run.proc) return json(res, 409, { error: 'Run is still active.' });
        if (!run.meta.sessionId) return json(res, 400, { error: 'No session to resume.' });
        if (!b.message?.trim()) return json(res, 400, { error: 'Empty message.' });
        if (!fs.existsSync(ASSETS_DIR)) await stageAssets();
        startRun({ ...run.meta.options, ...b }, run);
        return json(res, 200, run.meta);
      }
    }
    if ((m = p.match(/^\/api\/runs\/(\w+)$/)) && req.method === 'DELETE') {
      const run = runs.get(m[1]); if (!run) return json(res, 404, { error: 'no such run' });
      if (run.proc) return json(res, 409, { error: 'Cancel the run first.' });
      runs.delete(m[1]); saveRuns(); fs.rm(path.join(LOGS_DIR, m[1] + '.jsonl'), () => {}); return json(res, 200, { ok: true });
    }
    if (p === '/api/file') {
      const f = allowedFile(url.searchParams.get('path') || '');
      if (!f) { res.writeHead(403); return res.end('forbidden'); }
      return serveFile(req, res, f);
    }
    if (p === '/api/ls') {
      const dir = path.resolve(expandHome(url.searchParams.get('path') || '~'));
      const ents = await fsp.readdir(dir, { withFileTypes: true });
      const dirs = ents.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort((a, b) => a.localeCompare(b));
      return json(res, 200, { path: dir, parent: path.dirname(dir), dirs });
    }
    if (p === '/api/pick' && req.method === 'POST') {
      for (const [cmd, args] of [['zenity', ['--file-selection', '--directory', '--title=Choose a project folder']], ['kdialog', ['--getexistingdirectory', os.homedir()]]]) {
        if (await has(cmd)) { const r = await sh(cmd, args, { timeout: 300000 }); return json(res, 200, { path: r.ok ? r.out : null }); }
      }
      return json(res, 501, { error: 'No native folder dialog found (install zenity).' });
    }
    if (p === '/api/reveal' && req.method === 'POST') {
      const b = await readBody(req); const f = allowedFile(b.path || '');
      if (!f) return json(res, 403, { error: 'forbidden' });
      spawn('xdg-open', [f], { detached: true, stdio: 'ignore' }).unref(); return json(res, 200, { ok: true });
    }

    // static
    let rel = p === '/' ? '/index.html' : p;
    const file = path.join(PUBLIC, path.normalize(rel));
    if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, file);
  } catch (e) { if (!res.headersSent) json(res, 500, { error: String(e.message || e) }); else res.end(); }
});

server.on('error', e => { if (e.code === 'EADDRINUSE') { console.log(`brag-desktop already running on :${PORT}`); process.exit(0); } throw e; });
server.listen(PORT, HOST, () => console.log(`brag-desktop → http://localhost:${PORT}`));
process.on('SIGTERM', () => { for (const r of runs.values()) cancelRun(r); process.exit(0); });
