// ASCII occupancy map of the station forecourt (where the garage cars park), from the REAL scene (reduced module set, headless Edge, one browser job).
//   node tools/drive-garage-recon.mjs [--x 579 --z 219 --r 24 --step 1] [--only environment,streets,city,traffic,people,drive] [--eval "js"]
// Legend:  # inside a building   R real asphalt (streets net.cover >= -0.5)   S a solid / column (physics)   c / t / l / r a parked garage car box (coupe, truck, lada, roadster)   . free pavement / forecourt
// Prints the map (z down the page, x across; the origin of a row is its left x) and, for every garage car, its parked pose + the occupancy of its footprint.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const CX = Number(args.x ?? 579), CZ = Number(args.z ?? 219), R = Number(args.r ?? 24), STEP = Number(args.step ?? 1);
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
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=900,500'], defaultViewport: { width: 900, height: 500, deviceScaleFactor: 1 }, protocolTimeout: 300000 });
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
  const q = new URLSearchParams({ w: '900', h: '500', t: '0', q: 'performance', shot: '1', only: args.only || 'environment,streets,city,drive', baked: args.baked || 'force' });
  q.set('cam', `${CX},${CZ},0,0`);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  for (const e of await page.evaluate(() => window.__errors || [])) console.log(`MODULE ERROR [${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  const out = await page.evaluate(async (CX, CZ, R, STEP) => {
    await Promise.race([window.__regions?.ensureAt(CX, CZ), new Promise((r) => setTimeout(r, 60000))]);
    const ctx = window.__ctx, L = ctx.L, ph = ctx.physics, net = ctx.services.streets?.net, d = window.__drive;
    const boxes = (d.fleet || []).map((v) => { const sy = Math.sin(v.parked.yaw), cy = Math.cos(v.parked.yaw); return { id: v.id, x: v.parked.x + sy * v.spec.centerZ, z: v.parked.z + cy * v.spec.centerZ, yaw: v.parked.yaw, hw: v.spec.W / 2, hd: v.spec.len / 2 }; });
    const inCar = (x, z) => boxes.find((b) => { const dx = x - b.x, dz = z - b.z, sy = Math.sin(b.yaw), cy = Math.cos(b.yaw); return Math.abs(dx * cy - dz * sy) < b.hw && Math.abs(dx * sy + dz * cy) < b.hd; });
    const cell = (x, z) => {
      const c = inCar(x, z); if (c) return c.id[0];          // c coupe, t truck, l lada, r roadster
      if (L.insideBuilding(x, z)) return '#';
      if (net && net.cover(x, z, {}) >= -0.5) return 'R';
      if (ph.columnBlocked(x, z, 0.3, 0.3, 1.7)) return 'S';
      return '.';
    };
    const rows = [];
    for (let z = CZ - R; z <= CZ + R; z += STEP) { let s = ''; for (let x = CX - R; x <= CX + R; x += STEP) s += cell(x, z); rows.push(`${String(Math.round(z)).padStart(5)} ${s}`); }
    const cars = (d.fleet || []).map((v) => ({ id: v.id, x: +v.parked.x.toFixed(2), z: +v.parked.z.toFixed(2), yawDeg: +(v.parked.yaw * 180 / Math.PI).toFixed(1), len: v.spec.len, W: v.spec.W, mass: v.spec.mass }));
    return { rows, cars, header: `x from ${CX - R} to ${CX + R} step ${STEP}` };
  }, CX, CZ, R, STEP);
  console.log(out.header); for (const r of out.rows) console.log(r);
  console.log(JSON.stringify(out.cars));
  if (args.eval) console.log('eval:', JSON.stringify(await page.evaluate(args.eval)));
} catch (e) {
  console.log('RECON FAILED:', e.message); process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
