// V3 single frames: node render/stills-v3.mjs --times=0,2.3,9.5 --out=dir [--scale=0.5] [--names=a,b,c]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, serve, args, openFilmV3 } from './lib-v3.mjs';

const o = args({ times: '0', out: 'stills', scale: '1', names: '' });
const times = o.times.split(',').map(Number);
const names = o.names ? o.names.split(',') : [];
fs.mkdirSync(o.out, { recursive: true });
const { srv, base } = await serve();
const browser = await chromium.launch();
try {
  const film = await openFilmV3(browser, base, parseFloat(o.scale));
  for (let i = 0; i < times.length; i++) {
    const name = names[i] || `v3-${times[i].toFixed(2).padStart(5, '0')}`;
    fs.writeFileSync(path.join(o.out, name + '.png'), await film.shot(times[i]));
  }
  console.log(`wrote ${times.length} stills to ${o.out}`);
} finally { await browser.close(); srv.close(); }
