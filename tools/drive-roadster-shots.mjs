// Screenshots of a standalone drivable car MODEL (the Tesla Roadster by default) with the REAL renderer (headless Edge), reduced module set (environment only), one browser job. Needs ?baked=force (set below): the committed bake is stale after any src edit.
//   node tools/drive-roadster-shots.mjs [--views front,side,rear,q34f,q34r,top,chase,cockpit,cockpitL,cockpitR,cockpitUp,cockpitBack,cockpitBL,cockpitDown,cockpitDownR] [--out shots/drive/roadster/a] [--tod night] [--w 1400 --h 800]
//        [--dmg front=0.8,rear=0.3,left=0,right=0 (applies drive/damage.js with the model's own spec)] [--yaw 0] [--lights 1] [--brake 1] [--boost 1] [--speed 120] [--module /src/world/drive/cars/roadster.js --factory createRoadsterModel --opts '{"plate":"RDSTR"}']
// The model is created in the page (import of the module, ctx = window.__ctx), added to the scene at the Moscow Station spot (579, 219) and posed with model.set(...).
// Views: orbit cameras round the car (az 0 = in front, 90 = its left side, 180 = behind; el = elevation) with a narrow fov for the pure side / front / top silhouettes,
// and the driver's eye (cockpit*, model.setView(true), near 0.12 m, fov 72). Prints draw calls / triangles of the model itself (visible meshes) and of the whole frame.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const W = Number(args.w || 1400), H = Number(args.h || 800);
const out = args.out || 'shots/drive/roadster/a';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });
const MODULE = args.module || '/src/world/drive/cars/roadster.js', FACTORY = args.factory || 'createRoadsterModel', OPTS = args.opts ? JSON.parse(args.opts) : {};

// name: [az deg, el deg, dist m, fov deg, target height m, (optional) target offset along the car's z in m]  or { eye: true, look: [yawOffsetDeg, pitchDeg] }
const VIEWS = {
  front: [0, 6, 16, 22, 0.9], side: [90, 3, 26, 17, 0.9], sideR: [-90, 3, 26, 17, 0.9], rear: [180, 6, 16, 22, 0.9],
  q34f: [38, 14, 9.5, 40, 0.8], q34r: [145, 14, 9.5, 40, 0.8], q34fR: [-38, 14, 9.5, 40, 0.8], top: [0, 84, 15, 34, 0.5], low: [25, 2, 6, 55, 0.7], chase: [180, 15, 7.4, 62, 1.0],
  sideC: [90, 3, 12, 17, 0.7], frontC: [0, 6, 8, 25, 0.7], rearC: [180, 8, 8, 25, 0.8], wheelF: [90, 0, 4.5, 20, 0.35, 1.48], wheelR: [90, 0, 4.5, 20, 0.35, -1.48], tailC: [150, 12, 6, 30, 0.6, -1.8], topF: [0, 84, 7, 40, 0.5, 1.3], noseC: [55, 8, 4.5, 40, 0.4, 2.0], noseS: [90, 2, 4.5, 24, 0.5, 2.0], tailS: [125, 8, 5, 40, 0.5, -2.0], frontHi: [20, 35, 6, 35, 0.6, 1.2],
  cockpit: { eye: true, look: [0, 0] }, cockpitL: { eye: true, look: [1.1, 0] }, cockpitR: { eye: true, look: [-1.1, 0] }, cockpitUp: { eye: true, look: [0, 0.6] }, cockpitBack: { eye: true, look: [3.0, 0] }, cockpitBL: { eye: true, look: [2.3, 0.05] }, cockpitDown: { eye: true, look: [0, -0.75] }, cockpitDownR: { eye: true, look: [-0.7, -0.55] },
};
const names = (args.views || 'front,side,rear,q34f,q34r,top').split(',').filter(Boolean);
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
  const X = Number(args.x ?? 579), Z = Number(args.z ?? 219);
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(args.t ?? 0), q: args.q || 'medium', shot: '1', only: args.only || 'environment' });
  if (args.tod) q.set('tod', args.tod);
  q.set('baked', 'force');                                      // the developer switch: any src edit makes the committed bake stale (the page would build the city procedurally otherwise)
  q.set('cam', `${X},${Z},0,0`);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  for (const e of await page.evaluate(() => window.__errors || [])) console.log(`MODULE ERROR [${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  const cfg = { X, Z, yaw: Number(args.yaw || 0) * Math.PI / 180, lights: args.lights ? 1 : 0, brake: args.brake ? 1 : 0, boost: args.boost ? 1 : 0, speed: Number(args.speed || 0), steer: Number(args.steer || 0), dmg: args.dmg ? Object.fromEntries(args.dmg.split(',').map((kv) => kv.split('=')).map(([k, v]) => [k, Number(v)])) : null, module: MODULE, factory: FACTORY, opts: OPTS };
  const info = await page.evaluate(async (c) => {
    const mod = await import(c.module);
    const model = mod[c.factory](window.__ctx, c.opts);
    window.__ctx.add(model.root); window.__model = model; window.__cfg = c;
    if (c.dmg) {
      const d = await import('/src/world/drive/damage.js');
      const dm = d.createCarDamage(model, { spec: model.spec, interior: true, onDetach: () => {} });
      Object.assign(dm.state, c.dmg); dm.state.revision++; dm.sync(); dm.hideDetached(); window.__dm = dm;
    }
    window.__fixedNear = true;
    let tris = 0, calls = 0;
    model.root.traverse((o) => { if (o.isMesh && o.visible && o.geometry) { calls++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    return { calls, tris: Math.round(tris), spec: Object.keys(Object.values(mod).find((v) => v && v.wb) || {}).length };
  }, cfg);
  console.log('model (exterior, visible meshes):', JSON.stringify(info));
  for (const name of names) {
    const v = VIEWS[name];
    await page.evaluate((v, c) => {
      const model = window.__model, cam = window.__camera, S = model.spec;
      const kmh = c.speed, rpm = Math.min(1.05, 0.15 + kmh / 160);
      const pose = (spin) => model.set({ x: c.X, y: 0.03, z: c.Z, yaw: c.yaw, pitch: 0, roll: 0, steer: c.steer, steerAngle: 0.5 * c.steer, spin, brake: c.brake, boost: c.boost, lights: c.lights, glow: 1, dt: 1, kmh, rpm, gear: kmh < 1 ? 'N' : kmh < 40 ? '1' : '3' });
      model.setView(!!v.eye);
      for (let i = 0; i < 12; i++) pose(0.3);                        // a few frames: the boost glow / smoothed values settle, the screen redraws
      model.root.updateMatrixWorld(true);
      const sy = Math.sin(c.yaw), cy = Math.cos(c.yaw);
      if (v.eye) {
        const e = S.eye, p = model.root.localToWorld(new window.THREE.Vector3(e.x, e.y, e.z));
        cam.near = 0.12; cam.fov = S.fovRest || 72; cam.updateProjectionMatrix();
        window.__setCam(p.x, p.y, p.z, (c.yaw + Math.PI) * 180 / Math.PI + v.look[0] * 180 / Math.PI, v.look[1] * 180 / Math.PI);
      } else {
        const [az, el, dist, fov, th, off = 0] = v, a = az * Math.PI / 180 + c.yaw, e = el * Math.PI / 180;
        const tx = c.X + Math.sin(c.yaw) * off, tz = c.Z + Math.cos(c.yaw) * off;
        const cx = tx + Math.sin(a) * Math.cos(e) * dist, cz = tz + Math.cos(a) * Math.cos(e) * dist, cyy = th + Math.sin(e) * dist;
        const dx = tx - cx, dz = tz - cz, hor = Math.hypot(dx, dz);
        cam.near = 0.25; cam.fov = fov; cam.updateProjectionMatrix();
        window.__setCam(cx, cyy, cz, Math.atan2(-dx, -dz) * 180 / Math.PI, Math.atan2(th - cyy, hor) * 180 / Math.PI);
      }
      void sy; void cy;
    }, v, cfg);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const file = path.resolve(root, `${out}_${name}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => ({ calls: window.__stats.calls, tris: window.__stats.triangles, fov: +window.__camera.fov.toFixed(1), near: window.__camera.near }));
    console.log(`saved ${path.relative(root, file)}`, JSON.stringify(st));
  }
  if (args.eval) console.log('eval:', JSON.stringify(await page.evaluate(args.eval)));
} catch (e) {
  console.log('SHOT FAILED:', e.message); process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
