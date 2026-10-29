// The Lada 2106 model inside the REAL scene (reduced module set, headless Edge, one browser job): the car is imported into the running page, parked 5 m behind the red coupe at the
// Moscow station taxi rank and photographed from several cameras (the outline pass, the sky, the sun shadows and the city are the game's own).
//   node tools/drive-lada-game.mjs [--views front34,side,rear34,both,cockpit] [--out shots/drive/lada/g] [--tod night] [--only environment,streets,city,traffic,drive] [--w 1600 --h 800] [--x 574.4 --z 219.8]
// Prints calls / triangles with and without the Lada (its draw-call cost) for every view. (Until the registry owner wires the car into drive.js this is the in-game check.)
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
const out = args.out || 'shots/drive/lada/g';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });
const RED = { x: 579, z: 219, yaw: 99 };                      // the red coupe (drive.js SPAWN)
const LX = Number(args.x ?? 574.4), LZ = Number(args.z ?? 219.8), LYAW = Number(args.yaw ?? 99);
// camera presets relative to the Lada (distance, heading of the CAMERA position around the car in degrees measured from the car's forward, height, fov)
const VIEWS = {
  front34: { r: 6.5, a: 38, h: 1.5, fov: 55 }, side: { r: 7.5, a: 90, h: 1.2, fov: 50 }, rear34: { r: 6.5, a: 142, h: 1.5, fov: 55 }, front: { r: 7.0, a: 0, h: 1.3, fov: 50 },
  both: { r: 9.5, a: 62, h: 2.2, fov: 62, look: [3.5, 0.6, 0] }, close: { r: 3.4, a: 28, h: 1.0, fov: 55, look: [0, 0.7, 1.4] }, eye: { r: 5.0, a: 90, h: 1.7, fov: 70 },
  cockpit: { cockpit: true },
};
const names = (args.views || 'front34,side,rear34,both').split(',').filter(Boolean);
for (const n of names) if (!VIEWS[n]) { console.log('unknown view', n, 'known:', Object.keys(VIEWS).join(',')); process.exit(1); }

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
  q.set('cam', `${RED.x},${RED.z},0,0`);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  const errs = await page.evaluate(() => window.__errors || []);
  for (const e of errs) console.log(`MODULE ERROR [${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  await page.evaluate(async (RED, LX, LZ, LYAW) => {
    await window.__regions?.ensureAt(RED.x, RED.z);
    const m = await import('/src/world/drive/cars/lada2106.js');
    const ctx = window.__ctx;
    const car = m.createLadaModel(ctx); ctx.add(car.root); window.__lada = car;
    const y = window.__drive.car.groundAt(LX, LZ);
    window.__ladaPose = (extra) => car.set(Object.assign({ x: LX, y, z: LZ, yaw: LYAW * Math.PI / 180, pitch: 0, roll: 0, steer: 0, steerAngle: 0, spin: 0, brake: 0, boost: 0, lights: false, glow: 0, dt: 0.016, kmh: 0, rpm: 0.15, gear: 'N' }, extra || {}));
    window.__ladaPose();
  }, RED, LX, LZ, LYAW);
  const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
  for (const name of names) {
    const v = VIEWS[name];
    const cam = await page.evaluate((v, LX, LZ, LYAW) => {
      const car = window.__lada, DEG = Math.PI / 180;
      let x, y, z, yawDeg, pitchDeg;
      if (v.cockpit) {
        car.setView(true); window.__ladaPose({ kmh: 60, rpm: 0.5, gear: '3' }); car.root.updateMatrixWorld(true);
        const e = car.spec.eye, p = car.root.localToWorld(new window.THREE.Vector3(e.x, e.y, e.z));
        x = p.x; y = p.y; z = p.z; yawDeg = LYAW + 180; pitchDeg = -4;
        window.__camera.fov = car.spec.fovRest; window.__camera.near = 0.12; window.__camera.updateProjectionMatrix();
      } else {
        car.setView(false); window.__ladaPose();
        const a = (LYAW + v.a) * DEG, c = v.look || [0, 0.7, 0];
        // camera sits at distance r around the car, looking at the car (+ look offset in the car frame)
        const fx = Math.sin(LYAW * DEG), fz = Math.cos(LYAW * DEG), lx = Math.cos(LYAW * DEG), lz = -Math.sin(LYAW * DEG);
        const tx = LX + lx * c[0] + fx * c[2], tz = LZ + lz * c[0] + fz * c[2], ty = c[1];
        x = LX + Math.sin(a) * v.r; z = LZ + Math.cos(a) * v.r; y = v.h;
        const dx = tx - x, dz = tz - z, dy = ty - y;
        const heading = Math.atan2(dx, dz) / DEG;           // world heading the camera should look along
        yawDeg = heading + 180; pitchDeg = Math.atan2(dy, Math.hypot(dx, dz)) / DEG;
        window.__camera.fov = v.fov; window.__camera.near = 0.15; window.__camera.updateProjectionMatrix();
      }
      window.__setCam(x, y, z, yawDeg, pitchDeg);
      return { x, y, z, yawDeg, pitchDeg };
    }, v, LX, LZ, LYAW);
    await frames();
    const file = path.resolve(root, `${out}_${name}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => { const lada = window.__lada; lada.root.visible = false; return { calls: window.__stats.calls, tris: window.__stats.triangles }; });
    await frames();
    const st2 = await page.evaluate(() => { const lada = window.__lada; const r = { calls: window.__stats.calls, tris: window.__stats.triangles }; lada.root.visible = true; return r; });
    console.log(`saved ${path.relative(root, file)}`, JSON.stringify({ withLada: { calls: st2.calls, tris: st2.tris }, cam: Object.fromEntries(Object.entries(cam).map(([k, x]) => [k, +x.toFixed(1)])) }), 'frame-without-Lada', JSON.stringify(st));
  }
  if (args.eval) console.log('eval:', JSON.stringify(await page.evaluate(args.eval)));
} catch (e) {
  console.log('SHOT FAILED:', e.message); process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
