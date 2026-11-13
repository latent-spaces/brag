const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const api = async (p, opts = {}) => {
  const r = await fetch(p, { ...opts, headers: { 'content-type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fileUrl = (p, v) => '/api/file?path=' + encodeURIComponent(p) + (v ? '&v=' + v : '');
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const STATUS_LABEL = { running: 'in progress', done: 'finished', failed: 'failed', cancelled: 'cancelled', interrupted: 'interrupted' };
const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

let current = null, es = null, runs = [], navFocus = false, elapsedTimer = null;
const pendingDelete = new Set();
let S = freshState();
function freshState() { return { steps: {}, outDir: null, status: null, title: null, videoSet: false, posterSet: false, toolEls: {}, denials: [], startedAt: null, ms: null }; }

// ---------- feedback: toasts, announcements, confirm ----------
function announce(text) { const a = $('#announce'); a.textContent = ''; setTimeout(() => { a.textContent = text; }, 50); }
function toast(msg, { kind = '', action, onAction, ms = 5000 } = {}) {
  const t = document.createElement('div'); t.className = 'toast ' + kind;
  t.innerHTML = `<span>${esc(msg)}</span>`;
  const close = () => t.remove();
  if (action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'small'; b.textContent = action; b.onclick = () => { onAction?.(); close(); }; t.appendChild(b); }
  $('#toasts').appendChild(t); setTimeout(close, ms);
  return close;
}
function confirmDialog({ title, body, ok = 'Continue', danger = false }) {
  return new Promise(res => {
    const d = $('#confirm'); $('#confirm-h').textContent = title; $('#confirm-b').textContent = body;
    const y = $('#confirm-yes'); y.textContent = ok; y.className = danger ? 'danger' : 'primary';
    let result = false; const done = v => { result = v; d.close(); };
    y.onclick = () => done(true); $('#confirm-no').onclick = () => done(false);
    d.addEventListener('close', () => res(result), { once: true });
    d.showModal(); $('#confirm-no').focus();
  });
}
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    announce('Copied to clipboard');
    if (btn) { const old = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = old; }, 1500); } else toast('Copied', { kind: 'ok', ms: 2000 });
  } catch { toast('Couldn’t access the clipboard. Select the text and press Ctrl+C.', { kind: 'err' }); }
}

// ---------- navigation drawer (narrow windows) ----------
const narrow = matchMedia('(max-width:900px)');
function syncInert() { $('#side').inert = narrow.matches && !document.body.classList.contains('nav-open'); }
function setNav(open, focusBack) {
  document.body.classList.toggle('nav-open', open); $('#scrim').hidden = !open;
  const m = $('#menu'); m.setAttribute('aria-expanded', String(open)); m.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  syncInert(); if (open) $('#new').focus(); else if (focusBack) m.focus();
}
$('#menu').onclick = () => setNav(!document.body.classList.contains('nav-open'));
$('#scrim').onclick = () => setNav(false, true);
narrow.addEventListener('change', () => setNav(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open') && !document.querySelector('dialog[open]')) setNav(false, true); });

// ---------- routing (hash) ----------
function go(hash) { navFocus = true; if (location.hash === hash) route(); else location.hash = hash; }
function route() {
  const m = location.hash.match(/^#\/run\/(\w+)/);
  if (narrow.matches) setNav(false);
  if (m) openRun(m[1]); else showForm();
  navFocus = false;
}
addEventListener('hashchange', route);
function show(v) { $('#form-view').hidden = v !== 'form'; $('#run-view').hidden = v !== 'run'; renderHistory(true); }
function focusHeading(el) { if (navFocus) el.focus({ preventScroll: false }); }
function showForm() {
  closeStream(); current = null; S = freshState(); show('form'); document.title = 'brag desktop';
  focusHeading($('#form-h')); loadRuns();
}

// ---------- health / setup ----------
async function refreshHealth() {
  let h; try { h = await api('/api/status'); } catch { $('#health').innerHTML = '<li class="no">✕ Server not reachable</li>'; return; }
  const f = (ok, t) => `<li class="${ok ? 'ok' : 'no'}"><span aria-hidden="true">${ok ? '✓' : '✕'}</span> ${esc(t)}<span class="sr">${ok ? ' (ok)' : ' (problem)'}</span></li>`;
  $('#health').innerHTML = [
    f(h.claude, 'claude ' + (h.claude || 'missing')),
    f(h.loggedIn, h.loggedIn ? 'signed in (' + h.authMethod + ')' : 'not signed in'),
    f(h.ffmpeg, 'ffmpeg'), f(h.node, 'node'),
    f(h.skill.installed, 'brag ' + (h.skill.rev || 'not installed') + (h.skill.installed && !h.skill.audited ? ' (unaudited)' : ''))
  ].join('');
  const problems = [];
  if (!h.claude) problems.push('Claude Code CLI not found on PATH.');
  else if (!h.loggedIn) problems.push('Claude Code is not signed in. Run <code>claude</code> in a terminal and sign in with your subscription.');
  if (!h.ffmpeg) problems.push('ffmpeg is missing: <code>sudo dnf install ffmpeg-free</code> (or the RPM Fusion build).');
  const s = $('#setup');
  if (!h.skill.installed || problems.length) {
    s.hidden = false;
    s.innerHTML = `<div class="notice" role="region" aria-label="Setup needed">${problems.map(p => '<p>' + p + '</p>').join('')}` +
      (h.skill.installed ? '' : `<p>The brag skill isn’t installed. It will be cloned from GitHub and pinned to the audited commit <code>${esc(h.auditedCommit)}</code>.</p><button type="button" class="primary" id="install">Install Brag</button>`) + '</div>';
    const b = $('#install');
    if (b) b.onclick = async () => {
      b.disabled = true; b.textContent = 'Installing…';
      try { await api('/api/skill/install', { method: 'POST', body: {} }); toast('brag installed', { kind: 'ok' }); }
      catch (e) { toast('Install failed: ' + e.message, { kind: 'err', ms: 9000 }); }
      refreshHealth();
    };
  } else s.hidden = true;
}

// ---------- history ----------
let histSig = '';
let runsLoaded = false;
function renderHistory(force) {
  if (!runsLoaded) return;
  $('#history').removeAttribute('aria-busy');
  const list = runs.filter(r => !pendingDelete.has(r.id));
  const sig = JSON.stringify([list.map(r => [r.id, r.title, r.status]), current]);
  if (sig === histSig && !force) return;
  histSig = sig;
  const focused = document.activeElement?.classList?.contains('hitem') ? document.activeElement.dataset.id : null;
  $('#history').innerHTML = list.length ? list.map(r =>
    `<li><button type="button" class="hitem" data-id="${esc(r.id)}" title="${esc(r.title)}"${current === r.id ? ' aria-current="page"' : ''}>` +
    `<span class="st ${esc(r.status)}" aria-hidden="true"></span><span class="t">${esc(r.title)}</span><span class="sr">, ${STATUS_LABEL[r.status] || esc(r.status)}</span></button></li>`).join('')
    : '<li class="empty">No runs yet. Your first brag will appear here.</li>';
  if (focused) $(`.hitem[data-id="${focused}"]`)?.focus();
}
async function loadRuns() {
  try { runs = await api('/api/runs'); } catch { runsLoaded = true; $('#history').removeAttribute('aria-busy'); return; }
  runsLoaded = true; renderHistory();
  $('#recents').innerHTML = [...new Set(runs.map(r => r.projectDir))].map(d => `<option value="${esc(d)}">`).join('');
}
$('#history').onclick = e => { const b = e.target.closest('.hitem'); if (b) go('#/run/' + b.dataset.id); };
$('#new').onclick = () => go('#/');

// ---------- form ----------
const FIELDS = ['projectDir', 'tone', 'format', 'duration', 'model', 'extra', 'title'], CHECKS = ['noMusic', 'noSfx', 'voice', 'full']; // autoApprove is never remembered
for (const k of FIELDS) { const v = store.get('f.' + k, null); if (v != null) $('#' + k).value = v; }
for (const k of CHECKS) $('#' + k).checked = store.get('f.' + k, false);
if ($('#model').value || $('#full').checked) $('#adv').open = true;
function syncToneUI() { const v = $('#tone').value; const r = $$('input[name="tone-r"]').find(x => x.value === v) || $$('input[name="tone-r"]')[0]; r.checked = true; }
$$('input[name="tone-r"]').forEach(r => r.addEventListener('change', () => { $('#tone').value = r.value; formError(''); }));
syncToneUI();
function persistForm() { for (const k of FIELDS) store.set('f.' + k, $('#' + k).value); for (const k of CHECKS) store.set('f.' + k, $('#' + k).checked); } // autoApprove is never remembered
const formError = msg => { const e = $('#form-error'); e.hidden = !msg; e.textContent = msg || ''; };
$('#form').addEventListener('input', () => formError(''));
$('#form').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('#form').requestSubmit(); } });
$('#pick').onclick = async () => {
  const b = $('#pick'); b.disabled = true; b.textContent = 'Choosing…';
  try { const r = await api('/api/pick', { method: 'POST', body: {} }); if (r.path) $('#projectDir').value = r.path; }
  catch { openBrowser(); }
  finally { b.disabled = false; b.textContent = 'Browse…'; }
};
$('#form').onsubmit = async e => {
  e.preventDefault();
  const o = {};
  for (const k of FIELDS) o[k] = $('#' + k).value.trim();
  for (const k of CHECKS) o[k] = $('#' + k).checked;
  o.autoApprove = $('#autoApprove').checked;
  o.preset = activePreset || undefined;
  if (!o.projectDir) { formError('Enter or choose a project folder.'); $('#projectDir').focus(); return; }
  if (o.duration && (+o.duration < 10 || +o.duration > 40)) { formError('Duration must be between 10 and 40 seconds.'); $('#duration').focus(); return; }
  if (o.autoApprove && !(await confirmDialog({ title: 'Auto-approve everything?', body: 'For this run the agent can run any command without asking you first.', ok: 'Auto-approve', danger: true }))) return;
  for (const k of FIELDS) store.set('f.' + k, $('#' + k).value);
  for (const k of CHECKS) store.set('f.' + k, o[k]);
  o.duration = o.duration ? Number(o.duration) : undefined;
  const go_ = $('#go'); go_.disabled = true; go_.textContent = 'Starting…';
  try { const m = await api('/api/runs', { method: 'POST', body: o }); await loadRuns(); go('#/run/' + m.id); }
  catch (err) { formError(err.message); }
  finally { go_.disabled = false; go_.textContent = 'Generate Brag Video'; }
};

// ---------- presets ----------
let PRESETS = [], CATS = [], presetCat = 'all', activePreset = null, previewing = null;
const SAMPLE_NAMES = { 'horse-tinder': 'Horse Tinder', 'taxi-for-taxis': 'Taxi for Taxis', 'fish-flight-school': 'Fish Flight School' };
const FORMAT_LABEL = { landscape: 'Landscape 16:9', vertical: 'Vertical 9:16', square: 'Square 1:1' };
const catName = id => CATS.find(c => c.id === id)?.name || id;
const audioLabel = a => { const l = []; if (a.music) l.push('Music'); if (a.sfx) l.push('SFX'); if (a.voice) l.push('Voiceover'); return l.length ? l.join(' + ') : 'Silent'; };
const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s) % 60).padStart(2, '0');
const presetById = id => PRESETS.find(p => p.id === id);

async function loadPresets() {
  try { const r = await api('/api/presets'); PRESETS = r.presets; CATS = r.categories; }
  catch { toast('Couldn’t load presets. You can still fill the form by hand.', { kind: 'err' }); $('#preset-grid').removeAttribute('aria-busy'); $('#preset-grid').innerHTML = ''; return; }
  const saved = store.get('f.preset', null);
  if (saved && presetById(saved)) { activePreset = saved; $('#presets').open = false; }
  renderPresetFilters(); renderPresetGrid(); renderPresetChip();
}
function renderPresetFilters() {
  const all = [{ id: 'all', name: 'All' }, ...CATS];
  $('#preset-filters').innerHTML = all.map(c => `<button type="button" data-cat="${esc(c.id)}" aria-pressed="${presetCat === c.id}">${esc(c.name)}</button>`).join('');
}
$('#preset-filters').onclick = e => { const b = e.target.closest('button[data-cat]'); if (!b) return; presetCat = b.dataset.cat; renderPresetFilters(); renderPresetGrid(); $(`#preset-filters [data-cat="${presetCat}"]`).focus(); };
function renderPresetGrid() {
  const list = PRESETS.filter(p => presetCat === 'all' || p.category === presetCat);
  const g = $('#preset-grid'); g.removeAttribute('aria-busy');
  g.innerHTML = list.map(p =>
    `<li><button type="button" class="pcard" data-id="${esc(p.id)}" data-cat="${esc(p.category)}"${activePreset === p.id ? ' aria-current="true"' : ''}>` +
    `<span class="pc-top"><span class="pc-cat">${esc(catName(p.category))}</span><span class="pc-badge${p.sample ? ' real' : ''}">${activePreset === p.id ? 'Selected' : p.sample ? 'Real sample' : 'Storyboard'}</span></span>` +
    `<strong>${esc(p.name)}</strong><span class="pc-tag">${esc(p.tagline)}</span>` +
    `<span class="pc-meta"><i class="ratio ${esc(p.format)}" aria-hidden="true"></i>${p.duration}s · ${esc(p.format)} · ${esc(audioLabel(p.audio))}</span></button></li>`).join('');
}
$('#preset-grid').onclick = e => { const b = e.target.closest('.pcard'); if (b) openPreset(b.dataset.id); };

// -- apply / clear / chip
const presetMatches = p => $('#tone').value === p.tone && $('#format').value === p.format && +$('#duration').value === p.duration &&
  $('#noMusic').checked === !p.audio.music && $('#noSfx').checked === !p.audio.sfx && $('#voice').checked === p.audio.voice;
function renderPresetChip() {
  const p = activePreset && presetById(activePreset);
  $('#preset-chip').hidden = !p;
  if (!p) { $('#preset-sum').textContent = ''; return; }
  $('#preset-chip-name').textContent = p.name;
  $('#preset-custom').hidden = presetMatches(p);
  $('#preset-sum').textContent = '· ' + p.name;
}
function applyPreset(p) {
  activePreset = p.id; store.set('f.preset', p.id);
  $('#tone').value = p.tone; syncToneUI();
  $('#format').value = p.format; $('#duration').value = p.duration;
  $('#noMusic').checked = !p.audio.music; $('#noSfx').checked = !p.audio.sfx; $('#voice').checked = p.audio.voice;
  persistForm(); formError(''); renderPresetGrid(); renderPresetChip();
  $('#presets').open = false;
  toast(`Preset applied: ${p.name}. Now choose a project folder.`, { kind: 'ok' });
  announce(`Preset applied: ${p.name}`);
  $('#projectDir').focus();
}
function clearPreset() { activePreset = null; store.set('f.preset', null); renderPresetGrid(); renderPresetChip(); $('#presets').open = true; announce('Preset cleared'); }
$('#preset-clear').onclick = clearPreset;
$('#preset-preview').onclick = () => activePreset && openPreset(activePreset);
$('#form').addEventListener('input', renderPresetChip);
$('#form').addEventListener('change', () => { persistForm(); renderPresetChip(); });

// -- preview dialog
let sbCleanup = null;
function stopPreview() { sbCleanup?.(); sbCleanup = null; $('#pd-stage video')?.pause(); }
function openPreset(id) {
  const p = presetById(id); if (!p) return; previewing = p;
  const d = $('#preset-dlg'); d.dataset.cat = p.category;
  $('#pd-cat').textContent = catName(p.category); $('#pd-title').textContent = p.name; $('#pd-tag').textContent = p.summary;
  $('#pd-facts').innerHTML = [p.duration + ' seconds', FORMAT_LABEL[p.format], 'Tone: ' + p.tone, audioLabel(p.audio)].map(f => `<li>${esc(f)}</li>`).join('');
  $('#pd-expect').innerHTML = p.expect.map(x => `<li>${esc(x)}</li>`).join('');
  $('#pd-beats').innerHTML = p.beats.map(b => `<li><time>${b.s}–${b.e}s</time><div><b>${esc(b.name)}</b><span>${esc(b.note)}</span></div></li>`).join('');
  $('#pd-needs').textContent = p.needs; $('#pd-best').textContent = 'Best for: ' + p.bestFor;
  $('#pd-use').textContent = activePreset === p.id ? 'Apply Again' : 'Use This Preset';
  const modeBox = $('#pd-mode'); modeBox.hidden = !p.sample;
  showPreview(p, p.sample ? 'sample' : 'story');
  if (!d.open) d.showModal();
  $('#pd-use').focus();
}
function showPreview(p, mode) {
  stopPreview();
  $$('#pd-mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  const stage = $('#pd-stage'), cap = $('#pd-caption');
  if (mode === 'sample') {
    stage.innerHTML = `<video class="pd-video" controls preload="none" playsinline poster="/samples/${esc(p.sample)}.jpg" src="/samples/${esc(p.sample)}.mp4" aria-label="Sample video made by /brag for the fictional product ${esc(SAMPLE_NAMES[p.sample] || '')}"></video>`;
    cap.textContent = `Real /brag output for the fictional product “${SAMPLE_NAMES[p.sample] || p.sample}”. Yours will be built from your own project. Music: Sascha Ende (ende.app), CC BY 4.0.`;
  } else {
    sbCleanup = mountStoryboard(stage, p);
    cap.textContent = 'Storyboard preview: it shows the structure and pacing this preset asks for, not final footage. Your video is generated from your own project.';
  }
}
$('#pd-mode').onclick = e => { const b = e.target.closest('button[data-mode]'); if (b && previewing) showPreview(previewing, b.dataset.mode); };

function mountStoryboard(host, p) {
  const dur = p.duration, reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  host.innerHTML = `<div class="sb ${esc(p.format)}" data-cat="${esc(p.category)}" role="group" aria-label="Storyboard preview of ${esc(p.name)}">` +
    `<div class="sb-frame"><div class="sb-meta"></div><div class="sb-name"></div><div class="sb-note"></div></div>` +
    `<div class="sb-ctl"><button type="button" class="small sb-play" aria-label="Play storyboard">▶ Play</button><span class="sb-time" aria-hidden="true"></span></div>` +
    `<div class="sb-seg" role="group" aria-label="Jump to beat">${p.beats.map((b, i) => `<button type="button" data-i="${i}" style="--w:${b.e - b.s}" aria-label="Beat ${i + 1}: ${esc(b.name)}, ${b.s} to ${b.e} seconds"><i></i><span>${esc(b.name)}</span></button>`).join('')}</div></div>`;
  const q = x => host.querySelector(x), frame = q('.sb-frame'), play = q('.sb-play'), segs = [...host.querySelectorAll('.sb-seg button')];
  let t = 0, idx = -1, playing = false, raf = 0, last = 0;
  const beatAt = s => { const i = p.beats.findIndex(b => s >= b.s && s < b.e); return i < 0 ? p.beats.length - 1 : i; };
  function paint() {
    const i = beatAt(t), b = p.beats[i];
    if (i !== idx) {
      idx = i; q('.sb-meta').textContent = `Beat ${i + 1} of ${p.beats.length} · ${b.s}–${b.e}s`; q('.sb-name').textContent = b.name; q('.sb-note').textContent = b.note;
      frame.classList.remove('swap'); void frame.offsetWidth; frame.classList.add('swap');
      segs.forEach((el, k) => k === i ? el.setAttribute('aria-current', 'step') : el.removeAttribute('aria-current'));
    }
    segs.forEach((el, k) => { const bb = p.beats[k]; el.style.setProperty('--p', Math.max(0, Math.min(100, (t - bb.s) / (bb.e - bb.s) * 100)) + '%'); });
    q('.sb-time').textContent = `${clock(t)} / ${clock(dur)}`;
  }
  function stop(ended) { playing = false; cancelAnimationFrame(raf); play.textContent = ended ? '↻ Replay' : '▶ Play'; play.setAttribute('aria-label', ended ? 'Replay storyboard' : 'Play storyboard'); }
  function tick(now) { if (!playing) return; t += (now - last) / 1000; last = now; if (t >= dur) { t = dur - 0.001; paint(); stop(true); return; } paint(); raf = requestAnimationFrame(tick); }
  play.onclick = () => {
    if (playing) { stop(false); play.textContent = '▶ Resume'; play.setAttribute('aria-label', 'Resume storyboard'); return; }
    if (t >= dur - 0.01) { t = 0; idx = -1; }
    playing = true; last = performance.now(); play.textContent = '❚❚ Pause'; play.setAttribute('aria-label', 'Pause storyboard'); raf = requestAnimationFrame(tick);
  };
  q('.sb-seg').onclick = e => { const b = e.target.closest('button[data-i]'); if (!b) return; t = p.beats[+b.dataset.i].s; idx = -1; paint(); };
  paint();
  if (reduce) q('.sb-ctl').insertAdjacentHTML('beforeend', '<span class="muted">Motion reduced: use the beat buttons to step through.</span>');
  return () => { playing = false; cancelAnimationFrame(raf); };
}
$('#pd-use').onclick = () => { const p = previewing; $('#preset-dlg').close(); if (p) applyPreset(p); };
$('#pd-cancel').onclick = $('#pd-close').onclick = () => $('#preset-dlg').close();
$('#preset-dlg').addEventListener('close', () => { stopPreview(); previewing = null; });
$('#preset-dlg').addEventListener('click', e => { if (e.target === $('#preset-dlg')) $('#preset-dlg').close(); }); // click on the backdrop

// ---------- folder browser ----------
async function browse(p) {
  try {
    const r = await api('/api/ls?path=' + encodeURIComponent(p));
    $('#bpath').value = r.path; $('#bup').dataset.p = r.parent; $('#bup').disabled = r.path === r.parent;
    $('#blist').innerHTML = r.dirs.length ? r.dirs.map(d => `<li><button type="button" data-name="${esc(d)}">${esc(d)}</button></li>`).join('') : '<li class="empty">No subfolders</li>';
    ($('#blist button') || $('#bok')).focus();
  } catch (e) { toast(e.message, { kind: 'err' }); }
}
function openBrowser() { $('#browser').showModal(); browse($('#projectDir').value || '~'); }
$('#blist').onclick = e => { const b = e.target.closest('button[data-name]'); if (b) browse($('#bpath').value.replace(/\/$/, '') + '/' + b.dataset.name); };
$('#bup').onclick = () => browse($('#bup').dataset.p);
$('#bok').onclick = () => { $('#projectDir').value = $('#bpath').value; $('#browser').close(); };
$('#bcancel').onclick = () => $('#browser').close();

// ---------- run view ----------
function closeStream() { if (es) { es.close(); es = null; } clearInterval(elapsedTimer); elapsedTimer = null; }
const logEl = () => $('#log');
let pending = [], flushQueued = false;
function atBottom() { const l = logEl(); return l.scrollHeight - l.scrollTop - l.clientHeight < 40; }
function addLog(cls, html) {
  const d = document.createElement('div'); d.className = cls; d.innerHTML = html; pending.push(d);
  if (!flushQueued) { flushQueued = true; requestAnimationFrame(flushLog); }
  return d;
}
function flushLog() {
  flushQueued = false; const l = logEl();
  const stick = atBottom();
  l.querySelector('.load')?.remove();
  const frag = document.createDocumentFragment(); pending.forEach(n => frag.appendChild(n)); pending = [];
  l.appendChild(frag);
  if (stick) l.scrollTop = l.scrollHeight; else $('#jump').hidden = false;
}
$('#log').addEventListener('scroll', () => { if (atBottom()) $('#jump').hidden = true; }, { passive: true });
$('#jump').onclick = () => { const l = logEl(); l.scrollTop = l.scrollHeight; $('#jump').hidden = true; l.focus(); };
function clearLog() { pending = []; S.toolEls = {}; logEl().innerHTML = '<div class="skeleton load" role="status"><span class="sr">Loading run…</span><i class="skel-bar"></i><i class="skel-bar"></i><i class="skel-bar"></i><i class="skel-bar"></i></div>'; $('#jump').hidden = true; }

function openRun(id, { force = false } = {}) {
  if (!force && id === current && es) { show('run'); return; }
  closeStream(); current = id; S = freshState(); show('run');
  $('#result').hidden = true; $('#error').hidden = true; $('#denials').hidden = true; $('#followup').hidden = true;
  $('#cancel').hidden = true; $('#delete').hidden = true; $('#elapsed').textContent = ''; $('#run-title').innerHTML = '<span class="skel-bar skel-title" aria-hidden="true"></span><span class="sr">Loading…</span>';
  refreshSteps(); clearLog();
  es = new EventSource(`/api/runs/${id}/events`);
  es.onopen = clearLog; // every (re)connect replays the whole log, so start clean
  es.onerror = () => {
    if (es && es.readyState === EventSource.CLOSED) { closeStream(); toast('That run could not be found.', { kind: 'err' }); location.hash = '#/'; }
  };
  es.onmessage = m => handle(JSON.parse(m.data));
  focusHeading($('#run-title'));
}

function handle(ev) {
  const fresh = Date.now() - ev.t < 3000;
  if (ev.type === 'meta') renderMeta(ev.meta, fresh);
  else if (ev.type === 'user') addLog('u', '▸ ' + esc(ev.text));
  else if (ev.type === 'text') addLog('a', esc(ev.text));
  else if (ev.type === 'tool') S.toolEls[ev.id] = addLog('tool', `⚙ ${esc(ev.name)} ${esc(ev.input || '')}`);
  else if (ev.type === 'tool_result') { const el = S.toolEls[ev.id]; if (el && ev.error) { el.classList.add('e'); el.insertAdjacentHTML('beforeend', `<div class="r">${esc(ev.text.slice(0, 300))}</div>`); } }
  else if (ev.type === 'result') {
    addLog('a', `<b>${ev.ok ? 'Finished' : 'Failed'}</b>${ev.ms ? ' in ' + fmt(ev.ms) : ''}${ev.cost ? ' · ~$' + ev.cost.toFixed(2) + ' equivalent usage' : ''}`);
    renderDenials(ev.denials);
    if (fresh) bustVideo();
  } else if (ev.type === 'outputs') renderOutputs(ev);
}

function renderMeta(m, fresh) {
  if (m.id !== current) return;
  const changed = m.status !== S.status || m.title !== S.title;
  if (fresh && S.status && m.status !== S.status && m.status !== 'running') announce(`${m.title}: run ${STATUS_LABEL[m.status] || m.status}`);
  S.status = m.status; S.title = m.title; S.startedAt = m.startedAt; S.ms = m.ms;
  $('#run-title').textContent = m.title; document.title = m.title + ' · brag';
  const st = $('#run-status'); st.textContent = STATUS_LABEL[m.status] || m.status; st.className = 'pill ' + m.status;
  const info = [m.preset && 'Preset: ' + m.preset, m.projectDir, m.model].filter(Boolean).join(' · '); const ie = $('#run-info'); ie.textContent = info; ie.title = info;
  $('#cancel').hidden = m.status !== 'running'; $('#delete').hidden = m.status === 'running';
  $('#followup').hidden = m.status === 'running' || !m.sessionId;
  const err = $('#error'); err.hidden = !m.error || m.status === 'running'; err.textContent = m.error || '';
  if (m.status === 'running') $('#denials').hidden = true;
  clearInterval(elapsedTimer);
  const tick = () => { $('#elapsed').textContent = 'Running · ' + fmt(Date.now() - S.startedAt); };
  if (m.status === 'running') { tick(); elapsedTimer = setInterval(tick, 1000); }
  else $('#elapsed').textContent = m.ms ? 'Took ' + fmt(m.ms) : '';
  refreshSteps();
  if (changed) loadRuns();
}

function refreshSteps() {
  let activeSet = false;
  $$('#steps li').forEach(li => {
    const done = !!S.steps[li.dataset.k];
    let state = done ? 'done' : 'todo';
    if (!done && !activeSet && S.status === 'running') { state = 'active'; activeSet = true; }
    li.dataset.state = state;
    li.toggleAttribute('aria-current', state === 'active'); if (state === 'active') li.setAttribute('aria-current', 'step');
    li.querySelector('.sr').textContent = state === 'done' ? ' (done)' : state === 'active' ? ' (in progress)' : ' (pending)';
  });
}

function renderOutputs(ev) {
  S.steps = ev.steps; S.outDir = ev.outDir; refreshSteps();
  const r = $('#result'); r.hidden = !(ev.steps.video || ev.steps.copy);
  const v = $('#video');
  if (ev.steps.video && !S.videoSet) { v.src = fileUrl(ev.outDir + '/brag.mp4'); S.videoSet = true; }
  if (ev.steps.poster && !S.posterSet) { v.poster = fileUrl(ev.outDir + '/brag.jpg'); S.posterSet = true; }
  $('#copy').textContent = ev.copy || 'Share copy is still being written…';
  $('#files').textContent = ev.outDir || '';
  r.dataset.out = ev.outDir;
}
function bustVideo() { // a follow-up re-rendered the same file name: reload it once
  if (!S.videoSet || !S.outDir) return;
  const v = $('#video'), t = Date.now();
  v.src = fileUrl(S.outDir + '/brag.mp4', t); if (S.posterSet) v.poster = fileUrl(S.outDir + '/brag.jpg', t);
}

function renderDenials(list) {
  S.denials = list || [];
  const d = $('#denials');
  if (!S.denials.length) { d.hidden = true; d.innerHTML = ''; return; }
  d.hidden = false; d.open = false;
  d.innerHTML = `<summary>${S.denials.length} command${S.denials.length > 1 ? 's' : ''} blocked by permissions</summary>` +
    `<ul>${S.denials.map((c, i) => `<li><code>${esc(c)}</code><button type="button" class="ghost small" data-copy="${i}" aria-label="Copy command ${i + 1}">Copy</button></li>`).join('')}</ul>` +
    `<div class="row wrap"><button type="button" class="small" id="retry-approve">Retry with auto-approve…</button></div>` +
    `<p class="muted">Only retry if you trust what the agent was trying to run.</p>`;
}
$('#denials').addEventListener('click', async e => {
  const c = e.target.closest('[data-copy]'); if (c) return copyText(S.denials[+c.dataset.copy], c);
  if (e.target.closest('#retry-approve')) {
    if (await confirmDialog({ title: 'Retry with auto-approve?', body: 'The agent will re-run the blocked steps without asking for permission.', ok: 'Retry', danger: true }))
      sendFollowup('Retry the steps that were blocked by permissions.', true);
  }
});

$('#copy-btn').onclick = e => copyText($('#copy').textContent, e.currentTarget);
$('#open-dir').onclick = () => api('/api/reveal', { method: 'POST', body: { path: $('#result').dataset.out } }).catch(e => toast(e.message, { kind: 'err' }));
$('#open-plan').onclick = () => api('/api/reveal', { method: 'POST', body: { path: $('#result').dataset.out + '/brag-plan.md' } }).catch(e => toast(e.message, { kind: 'err' }));
$('#cancel').onclick = () => api(`/api/runs/${current}/cancel`, { method: 'POST', body: {} }).catch(e => toast(e.message, { kind: 'err' }));
$('#delete').onclick = () => {
  const id = current; pendingDelete.add(id); go('#/');
  const timer = setTimeout(async () => { try { await api(`/api/runs/${id}`, { method: 'DELETE' }); } catch {} pendingDelete.delete(id); loadRuns(); }, 6000);
  toast('Run deleted. Output files are kept.', { action: 'Undo', ms: 6000, onAction: () => { clearTimeout(timer); pendingDelete.delete(id); go('#/run/' + id); } });
};

async function sendFollowup(message, autoApprove) {
  const btn = $('#followup .primary'); btn.disabled = true; btn.textContent = 'Sending…';
  try { await api(`/api/runs/${current}/message`, { method: 'POST', body: { message, autoApprove } }); $('#msg').value = ''; openRun(current, { force: true }); }
  catch (err) { toast(err.message, { kind: 'err', ms: 8000 }); }
  finally { btn.disabled = false; btn.textContent = 'Send'; }
}
$('#followup').onsubmit = e => { e.preventDefault(); const m = $('#msg').value.trim(); if (m) sendFollowup(m, $('#autoApprove').checked); };

// ---------- boot ----------
syncInert(); refreshHealth(); loadRuns(); loadPresets(); route();
setInterval(() => { if (!document.hidden) loadRuns(); }, 8000);
