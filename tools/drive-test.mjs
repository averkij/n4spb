// End-to-end test of the drivable car in the REAL page (headless Edge / Chrome with GPU, not ?shot, so the HUD is drawn):
//   load -> Start -> walk to the red car -> the "[E] Get in" prompt -> E -> accelerate (W) -> nitro (Shift) -> drift (A + Space) -> look around (mouse) -> brake -> E (get out) -> report.
//   node tools/drive-test.mjs [--q medium|high|low] [--out shots/drive/test] [--only a,b,...] [--tod night] [--params "baked=force"] [--nofuzz] [--lenient-first-e] [--load-timeout ms] [--protocol-timeout ms]
// Screenshots <out>_*.png are written at each stage. Exit code 1 on a page error, a module error or a failed check.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { resolveArea } from './lib/area-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const AREA = resolveArea(args, root);      // --area <id> | --page <file>: test another area's page (default: the strip, index.html)
const out = args.out || 'shots/drive/test';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: Number(args['protocol-timeout'] || 300000) });
const problems = [], logs = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')}`); });
  page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ q: args.q || 'medium', t: '30' }); if (args.only) q.set('only', args.only);
  if (args.tod) q.set('tod', args.tod);
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);   // e.g. --params "baked=force" (the bake is stale after any src edit)
  await page.goto(`http://127.0.0.1:${port}/${AREA.page}?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  for (const e of await page.evaluate(() => window.__errors || [])) problems.push(`[module ${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  await page.click('#go'); await sleep(1500);
  const shot = async (name) => { await page.screenshot({ path: path.resolve(root, `${out}_${name}.png`) }); };
  const st = () => page.evaluate(() => { const d = window.__drive, c = d.car; return { active: d.active, x: +c.x.toFixed(1), z: +c.z.toFixed(1), kmh: +c.speed.toFixed(0), gear: c.gear, rpm: +c.rpm.toFixed(2), boost: +c.boost.toFixed(2), drift: c.drifting, vL: +c.vL.toFixed(1), yaw: +(c.yaw * 180 / Math.PI).toFixed(0), y: +c.y.toFixed(2) }; });

  // ---- walk up to the car and look at it
  const sp = await page.evaluate(() => { const d = window.__drive; return { x: d.parked.x, z: d.parked.z, yaw: d.parked.yaw }; });
  await page.evaluate((s) => window.__setCam(s.x - 3.2, null, s.z + 2.2, -62, -6), sp); await sleep(500);
  const prompt = await page.evaluate(() => ({ text: document.getElementById('interact').textContent, shown: document.getElementById('interact').classList.contains('show') }));
  console.log('prompt:', JSON.stringify(prompt));
  if (!prompt.shown) problems.push('the "[E] Get in the car" prompt is not shown next to the car');
  await shot('0_prompt');
  await page.keyboard.press('KeyE'); await sleep(700);
  let s = await st(); console.log('after E:', JSON.stringify(s));
  if (!s.active) {
    // Known race (src/world/drive.js enter(): state.enteredAt is set BEFORE the first hud.show(), which builds the HUD in ~300 ms; the exit key handler of the SAME keydown
    // event then sees "entered > 350 ms ago" and gets the player out again). Retrying E proves it: the second press enters normally (the HUD exists by then).
    // (the bounce also put the walker beside the car's stale carCenter near the origin: walk back to the car first)
    const sp2 = await page.evaluate(() => { const d = window.__drive; return { x: d.parked.x, z: d.parked.z }; });
    await page.evaluate((q) => window.__setCam(q.x - 3.2, null, q.z + 2.2, -62, -6), sp2); await sleep(500);
    await page.keyboard.press('KeyE'); await sleep(700); s = await st(); console.log('after 2nd E:', JSON.stringify(s));
    const msg = s.active ? 'the FIRST E bounced (enter() + the same keydown exit(): drive.js sets state.enteredAt before the slow first hud.show(); set it at the end of enter()); the second E worked' : 'E did not put the player into the car (also not on the second press)';
    if (s.active && args['lenient-first-e']) console.log('WARNING:', msg); else problems.push(msg);
  }
  await shot('1_seated');
  // ---- drive: gas
  await page.keyboard.down('KeyW'); await sleep(2500); s = await st(); console.log('gas 2.5 s:', JSON.stringify(s)); await shot('2_gas');
  const au = await page.evaluate(() => { const a = window.__ctx.audio, c = a.context; return { ready: a.ready, state: c ? c.state : 'none', meter: a.meter() }; }); console.log('audio:', JSON.stringify(au));
  // ---- nitro
  await page.keyboard.down('ShiftLeft'); await sleep(1800); s = await st(); console.log('nitro:', JSON.stringify(s)); await shot('3_nitro');
  await page.keyboard.up('ShiftLeft');
  // ---- drift
  await page.keyboard.down('KeyA'); await page.keyboard.down('Space'); await sleep(900); s = await st(); console.log('drift:', JSON.stringify(s)); await shot('4_drift');
  await page.keyboard.up('Space'); await sleep(900); await page.keyboard.up('KeyA'); s = await st(); console.log('after drift:', JSON.stringify(s));
  // ---- look around
  await page.keyboard.press('KeyV'); await sleep(900); await shot('5_view2');
  await page.keyboard.press('KeyV'); await sleep(900); await shot('6_cockpit');
  await page.keyboard.press('KeyV'); await sleep(600);
  await page.keyboard.up('KeyW'); await page.keyboard.down('KeyS'); await sleep(1500); await page.keyboard.up('KeyS'); await sleep(1500); s = await st(); console.log('after brake:', JSON.stringify(s));
  if (s.kmh > 25) problems.push(`the car did not stop (${s.kmh} km/h)`);
  await shot('7_stopped');
  await page.keyboard.press('KeyE'); await sleep(800);
  s = await st(); const pl = await page.evaluate(() => { const p = window.__ctx.playerObj; return { x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1), lock: p.inputLock, driving: document.body.classList.contains('driving') }; });
  console.log('after exit:', JSON.stringify(s), JSON.stringify(pl));
  if (s.active || pl.driving || pl.lock !== 0) problems.push('E did not get the player out of the car');
  await shot('8_out');

  // ---- fuzz: scripted random driving from road points all over the map (headless physics, 1/60 s frames): never in a building (water is reachable: the river is no failure), no NaN, no tunnelling
  const fz = args.nofuzz ? { runs: 0, bad: [] } : await page.evaluate(() => {
    const d = window.__drive, L = window.__ctx.L, car = d.car, res = { runs: 0, bad: [], maxKmh: 0, hits: 0, stuck: 0 };
    const roads = []; const seen = new Set();
    for (const hw of ['primary', 'secondary', 'tertiary', 'residential']) for (let x = -560; x < 820; x += 70) for (let z = -380; z < 1040; z += 70) { const r = L.nearestRoad(x, z, { drivable: true, maxDist: 25 }); if (r && r.road.hw === hw && !r.road.bridge && !seen.has(r.road.id + Math.round(r.x / 40) + ':' + Math.round(r.z / 40))) { seen.add(r.road.id + Math.round(r.x / 40) + ':' + Math.round(r.z / 40)); roads.push(r); } }
    let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const picks = roads.sort(() => rnd() - 0.5).slice(0, 36);
    for (const r of picks) {
      d.enter(); d.teleport(r.x, r.z, Math.atan2(r.tx, r.tz));
      if (car.blocked(car.x, car.z)) continue;
      res.runs++;
      const ph = rnd() * 6, k1 = 0.4 + rnd(), k2 = 0.2 + rnd();
      let moved = 0, px = car.x, pz = car.z;
      d.sim(25, (t) => ({ thr: 1, brk: (t % 9 > 8) ? 1 : 0, steer: Math.sin(t * k1 + ph) * Math.cos(t * k2) * 1.2, nitro: (t % 6) < 2.2, hand: (t % 11) > 9.3 }), (i, c) => {
        if (!Number.isFinite(c.x + c.z + c.y + c.speed)) res.bad.push(['nan', r.x, r.z]);
        else if (c.blocked(c.x, c.z)) res.bad.push(['blocked', +c.x.toFixed(1), +c.z.toFixed(1), +(i / 60).toFixed(1)]);
        else if (i % 6 === 0) {      // the body outline (corners + mid points of the sides, 4 cm inside the real outline) must never be inside a building footprint
          const sy = Math.sin(c.yaw), cy = Math.cos(c.yaw), ox = c.x + sy * 0.05, oz = c.z + cy * 0.05;
          for (const [a, b] of [[2.03, 0.87], [2.03, -0.87], [-1.98, 0.87], [-1.98, -0.87], [0, 0.87], [0, -0.87], [2.03, 0], [-1.98, 0]]) if (L.insideBuilding(ox + sy * a + cy * b, oz + cy * a - sy * b)) { res.bad.push(['corner-in-building', +c.x.toFixed(1), +c.z.toFixed(1), +(i / 60).toFixed(1)]); break; }
        }
        res.maxKmh = Math.max(res.maxKmh, c.speed);
        if (i % 60 === 0) { moved += Math.hypot(c.x - px, c.z - pz); px = c.x; pz = c.z; }
      });
      if (moved < 20) res.stuck++;
    }
    d.exit(true);
    res.bad = res.bad.slice(0, 12);
    return res;
  });
  console.log('fuzz:', JSON.stringify(fz));
  if (fz.bad.length) problems.push(`fuzz: the car was somewhere it must not be ${JSON.stringify(fz.bad.slice(0, 5))}`);
  // ---- the Anichkov Bridge: the car rides over the humped deck at the deck height and comes out on the other side
  const br = await page.evaluate(() => {
    const d = window.__drive, c = window.__ctx.services.landmarksC.bridge, car = d.car, F = c.frame, th = F.theta;
    d.enter();
    const ux = Math.cos(th), uz = Math.sin(th);
    d.teleport(F.cx - ux * 40 + Math.sin(th) * 6, F.cz - uz * 40 - Math.cos(th) * 6, Math.atan2(ux, uz)); const y = []; let hitMax = 0;
    d.sim(7, { thr: 1 }, (i, k) => { if (i % 20 === 0) { const dy = c.deckY(k.x, k.z); y.push([+k.x.toFixed(0), +k.y.toFixed(2), dy === null ? null : +dy.toFixed(2)]); } });
    const r = { path: y, endX: +car.x.toFixed(0), endZ: +car.z.toFixed(0), speed: +car.speed.toFixed(0) }; d.exit(true); return r;
  });
  console.log('bridge:', JSON.stringify(br));
} catch (e) { problems.push(`[test] ${e.message}`); }
finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('drive test OK');
