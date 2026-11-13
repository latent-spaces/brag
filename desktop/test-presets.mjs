#!/usr/bin/env node
// Self-check for presets.js: data integrity, samples on disk, and the prompt block handed to /brag.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS, CATEGORIES, validatePresets, presetBlock, byId } from './presets.js';

const root = path.dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.error('FAIL', msg); } };

const errs = validatePresets();
errs.forEach(e => check(false, e));
check(errs.length === 0, 'validatePresets reported problems');

for (const p of PRESETS) {
  if (p.sample) for (const ext of ['mp4', 'jpg']) check(fs.existsSync(path.join(root, 'public/samples', `${p.sample}.${ext}`)), `${p.id}: missing sample file ${p.sample}.${ext}`);
  const block = presetBlock(p);
  check(block.includes(p.name) && p.beats.every(b => block.includes(b.name)), `${p.id}: prompt block is missing the name or a beat`);
  check(/Use only copy, claims, numbers and quotes that exist in the project/.test(block), `${p.id}: prompt block lost the no-invention rule`);
}
for (const c of CATEGORIES) check(PRESETS.some(p => p.category === c.id), `category ${c.id} has no presets`);
check(byId('nope') === null, 'byId should return null for unknown ids');
check(PRESETS.filter(p => p.sample).length === 3, 'expected exactly 3 presets with real samples');
check(PRESETS.filter(p => p.audio.voice).every(p => /Kokoro/.test(p.expect.join(' '))), 'voiceover presets must say they use Kokoro');

console.log(`${PRESETS.length} presets, ${CATEGORIES.length} categories, ${PRESETS.filter(p => p.sample).length} with real samples`);
console.log(failed ? `${failed} check(s) failed` : 'all preset checks passed');
process.exit(failed ? 1 : 0);
