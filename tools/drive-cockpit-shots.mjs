// Cockpit (camera mode 2) screenshots of the drivable car with the REAL renderer (headless Edge, reduced module set), one browser job.
//   node tools/drive-cockpit-shots.mjs [--only environment,streets,city,traffic,drive] [--scenes rest,speed,...] [--out shots/drive/cockpit/a] [--tod night] [--w 1600 --h 800] [--q medium] [--eval "js"]
// Scenes (each teleports the car, optionally drives, sets the camera mode / mouse look, waits 3 frames, takes a PNG named <out>_<scene>.png):
//   rest speed nitro left right lookL lookR lookUp lookBack chase far bridge vo   (see SCENES below; --scenes picks a comma list, default: rest,speed,left,right,lookL,lookR)
// Prints calls / triangles for each shot, so the draw-call cost of mode 2 against mode 0 (chase) is visible.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const W = Number(args.w || 1600), H = Number(args.h || 800);
const out = args.out || 'shots/drive/cockpit/a';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });

// x, z, yaw (deg, car heading: 0 = +Z, 90 = +X), then what to do
const SPAWN = { x: 579, z: 219, yaw: 99 };
const SCENES = {
  rest: { ...SPAWN, mode: 2 },
  speed: { ...SPAWN, mode: 2, sim: [{ s: 3.0, thr: 1 }, { s: 1.2, thr: 1, nitro: true }] },
  nitro: { ...SPAWN, mode: 2, sim: [{ s: 2.0, thr: 1 }, { s: 2.5, thr: 1, nitro: true }] },
  left: { ...SPAWN, mode: 2, sim: [{ s: 2.2, thr: 1 }, { s: 0.7, thr: 0.6, steer: 1 }] },
  right: { ...SPAWN, mode: 2, sim: [{ s: 2.2, thr: 1 }, { s: 0.7, thr: 0.6, steer: -1 }] },
  lookL: { ...SPAWN, mode: 2, look: [1.0, 0.0] },
  lookR: { ...SPAWN, mode: 2, look: [-1.0, 0.0] },
  lookUp: { ...SPAWN, mode: 2, look: [0.0, 0.6] },
  lookBack: { ...SPAWN, mode: 2, look: [3.0, 0.0] },
  chase: { ...SPAWN, mode: 0 },
  far: { ...SPAWN, mode: 1 },
  bridge: { x: -405, z: -97, yaw: 270, mode: 2, sim: [{ s: 1.2, thr: 1 }] },                   // Nevsky, the Anichkov Bridge ahead
  vo: { x: -3985.1, z: -1247.7, yaw: 300, mode: 2, sim: [{ s: 2.0, thr: 1 }] },                 // Vasilievsky Island (the spot of tools/islands-check.mjs)
};
const names = (args.scenes || 'rest,speed,left,right,lookL,lookR').split(',').filter(Boolean);
for (const n of names) if (!SCENES[n]) { console.log('unknown scene', n, 'known:', Object.keys(SCENES).join(',')); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: 300000 });
const logs = [];
try {
  const page = await browser.newPage();
  await (await import('./font-transport.mjs')).installFontTransport(page);
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (fs.existsSync(threeRoot)) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
      if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
      req.continue();
    });
  }
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning' || t === 'warn') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(args.t ?? 0), q: args.q || 'medium', shot: '1', only: args.only || 'environment,streets,city,traffic,drive' });
  if (args.tod) q.set('tod', args.tod);
  q.set('cam', `${SPAWN.x},${SPAWN.z},0,0`);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  const errs = await page.evaluate(() => window.__errors || []);
  for (const e of errs) console.log(`MODULE ERROR [${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  for (const name of names) {
    const sc = SCENES[name];
    await page.evaluate(async (sc) => {
      const d = window.__drive;
      if (d.active) d.exit(true);
      await window.__regions?.ensureAt(sc.x, sc.z);
      window.__setCam(sc.x, null, sc.z, 0, 0);
      d.enter(); d.setView(sc.mode); d.teleport(sc.x, sc.z, sc.yaw * Math.PI / 180);
      d.view.orbitY = 0; d.view.orbitP = 0;
      if (sc.sim) for (const st of sc.sim) d.sim(st.s, { thr: st.thr || 0, steer: st.steer || 0, nitro: !!st.nitro });
      else d.sim(0.02, {});
      if (sc.look) { d.view.orbitY = sc.look[0]; d.view.orbitP = sc.look[1]; d.view.idle = 0; }
    }, sc);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const file = path.resolve(root, `${out}_${name}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => { const d = window.__drive, c = d.car, cam = window.__camera; return { calls: window.__stats.calls, tris: window.__stats.triangles, kmh: +c.speed.toFixed(0), fov: +cam.fov.toFixed(1), near: cam.near, steer: +c.steer.toFixed(2), roll: +c.roll.toFixed(3), x: +c.x.toFixed(1), z: +c.z.toFixed(1) }; });
    console.log(`saved ${path.relative(root, file)}`, JSON.stringify(st));
  }
  if (args.eval) console.log('eval:', JSON.stringify(await page.evaluate(args.eval)));
  await page.evaluate(() => { const d = window.__drive; if (d.active) d.exit(true); });
} catch (e) {
  console.log('SHOT FAILED:', e.message); process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
