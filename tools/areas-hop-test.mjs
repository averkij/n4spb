// The REAL hop test of the areas system (docs/AREAS.md section 5, milestone M3): headless Edge with the GPU, the REAL baked pages (no fast harness, no fake navigation, no skipped preflight), real key presses:
//   1. strip: boot index.html (q=performance), Start, teleport to (211, -330) facing north, walk until the question of the gate g1 appears, accept, the page navigates (location.replace) to north.html;
//      on north.html press Continue; assert: area north, arrival inside the arrival rectangle of g1 and near the departure x, walking (no car, no flight), no errors, the sim runs;
//   2. north: teleport to (211, -300) facing south, walk until the question of g2 appears, accept; back on index.html, Continue; assert the arrival inside the rectangle of g2, near x 211, walking;
//   3. DRIVING: on that strip page get into the coupe (cockpit view), place it at (204, -330) facing north, drive until the question of g1 appears (the car is held inside the zone), accept; on north.html
//      Continue: the SAME car drives (id, cockpit view), at rest, inside the arrival rectangle, on a drivable lane within 30 degrees of its heading; then drive back through g2 the same way.
// Every arrival records readyMs (ms since navigation start: the intro is ready), the JS heap, draw calls and triangles. Output: shots/areas/hop-test.json (the numbers of docs/AREAS-MEASUREMENTS.md).
//   node tools/areas-hop-test.mjs [--q performance] [--out shots/areas/hop-test.json] [--shots shots/areas/hop] [--no-drive]
// Needs a bake of BOTH areas that matches the sources (node tools/bake-scene.mjs --area all; a stale bake makes the page show its error card). GPU job: run it alone. Exit 1 on any failed check.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { GATES } from '../src/areas/registry.js';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const Q = args.q || 'performance', OUT = path.resolve(root, args.out || 'shots/areas/hop-test.json'), SHOTS = args.shots ? path.resolve(root, args.shots) : path.resolve(root, 'shots/areas/hop');
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.mkdirSync(path.dirname(SHOTS), { recursive: true });
const WALK_X = 211, CAR_X = 500, CAR_STREET = 'улица Восстания';      // the walker: the east pavement of Mayakovskogo ulitsa; the car: the carriageway of Vosstaniya ulitsa (both are N-S streets of the strip that continue into the North band; Vosstaniya runs straight)
/** the pose (x, z, yawDeg) on the centre line of CAR_STREET at z, heading north (tz < 0) or south, looked up with the layout of the page it runs in */
const ROAD_POSE = `(z, north) => { const h = window.__ctx.L.roadsNear(${CAR_X}, z, 30, { drivable: true, name: ${JSON.stringify(CAR_STREET)} })[0]; if (!h) return null; const s = (h.tz < 0) === north ? 1 : -1, tx = h.tx * s, tz = h.tz * s; return { x: h.x, z: h.z, yaw: Math.atan2(-tx, -tz) * 180 / Math.PI }; }`;
const G1 = GATES.find((g) => g.id === 'g1'), G2 = GATES.find((g) => g.id === 'g2');
if (!G1 || !G2) { console.error('the registry has no real gates g1 / g2'); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': /\.[a-f0-9]{20}\.bin\.gz$/.test(f) ? 'public, max-age=31536000, immutable' : 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: 600000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0, passes = 0;
const check = (name, ok, detail = '') => { if (ok) { passes++; console.log('  ok   ' + name); } else { fails++; console.log('  FAIL ' + name + (detail !== '' ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); } };
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const threeRoot = path.join(root, 'node_modules', 'three');
const report = { when: new Date().toISOString(), q: Q, edge: null, arrivals: [], checks: [] };

const errors = [];      // page errors of every document of the run
async function boot(page, url) {
  await page.goto(url.startsWith('http') ? url : `${ORIGIN}/${url}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction("document.body.classList.contains('loaded') || (document.getElementById('fatal') && getComputedStyle(document.getElementById('fatal')).display !== 'none')", { timeout: 400000, polling: 500 });
}
const loaded = (page) => page.waitForFunction("document.body.classList.contains('loaded') || (document.getElementById('fatal') && getComputedStyle(document.getElementById('fatal')).display !== 'none')", { timeout: 400000, polling: 500 });
async function startPlaying(page) { await page.click('#go'); await page.waitForFunction("document.body.classList.contains('playing')", { timeout: 30000 }); }
const state = (page) => page.evaluate(() => {
  const d = window.__ctx.drive, car = d && d.active ? d.car : null, p = window.__ctx.playerObj, L = window.__ctx.L;
  const out = { area: window.__ctx.area.ID, open: !!document.querySelector('#panel:not([hidden]) .confirm'), title: (document.querySelector('#panel .panel-title') || {}).textContent || '', yesDisabled: (document.querySelector('.confirm-yes') || {}).disabled,
    driving: !!car, fly: !!p.fly, x: car ? car.x : p.pos.x, z: car ? car.z : p.pos.z, speed: car ? car.speed : 0, vehicle: car ? d.vehicle.id : null, view: car ? d.view.mode : null,
    fatal: !!(document.getElementById('fatal') && getComputedStyle(document.getElementById('fatal')).display !== 'none'), moduleErrors: (window.__errors || []).map((e) => e.module + ': ' + String(e.message).split('\n')[0]) };
  if (car) { const yaw = car.yaw; const fx = Math.sin(yaw), fz = Math.cos(yaw), lane = L.roadsNear(car.x, car.z, 0, { drivable: true }).find((q) => q.gap <= 0); out.lane = lane ? { dot: Math.abs(lane.tx * fx + lane.tz * fz), name: lane.road.name || '' } : null; out.yawDeg = yaw * 180 / Math.PI; }
  return out;
});
const stats = (page) => page.evaluate(() => ({ readyMs: window.__stats?.timing?.readyMs ?? null, buildMs: window.__stats?.timing?.buildMs ?? null, timing: window.__stats?.timing ?? null, calls: window.__stats?.calls ?? null, triangles: window.__stats?.triangles ?? null, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, regions: window.__regions?.count?.() ?? null, area: window.__ctx?.area?.ID ?? null }));
async function walkUntilOpen(page, key, ms = 90000) { await page.keyboard.down(key); await page.keyboard.down('ShiftLeft'); try { await page.waitForFunction("!!document.querySelector('#panel:not([hidden]) .confirm')", { timeout: ms, polling: 100 }); } catch (e) { /* reported by the caller */ } await page.keyboard.up('ShiftLeft'); await page.keyboard.up(key); }
/** accept the open question (after the 700 ms arming) and follow the navigation to the new document; returns { wallMs } until the new intro is ready */
async function acceptAndFollow(page) {
  await sleep(1000);
  if (!(await page.evaluate(() => !!document.querySelector('#panel:not([hidden]) .confirm')))) throw new Error('no question is open: nothing to accept');
  const t0 = Date.now(), nav = page.waitForNavigation({ waitUntil: 'load', timeout: 240000 });
  await page.keyboard.press('Enter');
  await nav; await loaded(page);
  return { wallMs: Date.now() - t0 };
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}-${name}.png` }).catch(() => {});

try {
  const page = await browser.newPage();
  report.edge = await browser.version();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
    if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.abort('failed');
    req.continue();
  });
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 240)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FAILED/.test(m.text())) errors.push('[console.error] ' + m.text().slice(0, 240)); });
  const arrival = async (label, wall) => { const s = await state(page), st = await stats(page); const row = { label, wallMs: wall ?? null, ...st, pose: { x: +s.x.toFixed(1), z: +s.z.toFixed(1) } }; report.arrivals.push(row); console.log(`  ${label}: ready ${st.readyMs} ms (wall ${wall ?? '-'}), heap ${st.heapMB} MB, ${st.calls} calls, ${st.triangles} tris, area ${st.area}`); return s; };

  // ================================================================= 1. strip -> north, walking
  console.log('1. strip -> north (walking):');
  await boot(page, `index.html?q=${Q}&gateprompt=1&seam=0`);
  let s = await state(page); check('the strip boots from its real bake (no fatal card, no module errors)', s.area === 'strip' && !s.fatal && s.moduleErrors.length === 0, s);
  await arrival('strip (first load)', null);
  await startPlaying(page);
  await page.evaluate((x) => { window.__gates.machine.grace(0); window.__setCam(x, null, -330, 0, 0); }, WALK_X);
  await sleep(800); s = await state(page);
  check(`the gates are on and the walker stands at (${WALK_X}, -330) facing north`, !!(await page.evaluate(() => !!window.__gates)) && Math.abs(s.x - WALK_X) < 2 && Math.abs(s.z + 330) < 2, s);
  const dep1 = { x: 0, z: 0 };
  await walkUntilOpen(page, 'KeyW'); s = await state(page); dep1.x = s.x; dep1.z = s.z;
  check('walking north opens the question of g1 inside its 30 m zone (the strip border is z = -405)', s.open && s.z <= -375 && s.z >= -406, s);
  check('the title names the North', /Север|North/.test(s.title) || /Новая область/.test(s.title), s.title);
  await shot(page, '1-question');
  let r = await acceptAndFollow(page);
  s = await state(page); check('the new document is north.html and it is ready (not the error card)', s.area === 'north' && !s.fatal && s.moduleErrors.length === 0, s);
  await arrival('north (arrival from the strip)', r.wallMs);
  await startPlaying(page); await sleep(1500); s = await state(page);
  check('arrival: walking (no car, no flight)', !s.driving && !s.fly, s);
  check('arrival: inside the arrival rectangle of g1', inRect(G1.arrive, s.x, s.z), { x: s.x, z: s.z, rect: G1.arrive });
  check('arrival: near the departure x (|dx| <= 30 m)', Math.abs(s.x - dep1.x) <= 30, { dep: dep1, now: { x: s.x, z: s.z } });
  check('arrival: the page runs (no page errors, no module errors)', errors.length === 0 && s.moduleErrors.length === 0, { errors, mod: s.moduleErrors });
  await shot(page, '2-north-arrival');

  // ================================================================= 2. north -> strip, walking
  console.log('2. north -> strip (walking):');
  await page.evaluate((x) => { window.__gates.machine.grace(0); window.__setCam(x, null, -300, 180, 0); }, WALK_X);
  await sleep(800); await walkUntilOpen(page, 'KeyW'); s = await state(page);
  check('walking south opens the question of g2 inside its zone (the north border is z = -205)', s.open && s.z >= -235 && s.z <= -204 && s.area === 'north', s);
  const dep2 = { x: s.x, z: s.z };
  r = await acceptAndFollow(page); s = await state(page);
  check('the new document is index.html (the strip) and it is ready', s.area === 'strip' && !s.fatal && s.moduleErrors.length === 0, s);
  await arrival('strip (arrival from the north)', r.wallMs);
  await startPlaying(page); await sleep(1500); s = await state(page);
  check('arrival: walking', !s.driving && !s.fly, s);
  check('arrival: inside the arrival rectangle of g2', inRect(G2.arrive, s.x, s.z), { x: s.x, z: s.z, rect: G2.arrive });
  check('arrival: near the departure x (|dx| <= 30 m)', Math.abs(s.x - dep2.x) <= 30, { dep: dep2, now: { x: s.x, z: s.z } });
  check('no page errors', errors.length === 0, errors);
  await shot(page, '3-strip-arrival');

  // ================================================================= 3. driving through both gates
  if (!args['no-drive']) {
    console.log('3. driving (the car and its view survive both hops):');
    await page.evaluate((fn) => { window.__gates.machine.grace(0); const d = window.__drive, p = new Function('return ' + fn)()(-330, true); d.enter('coupe'); d.setView(2); d.place(p.x, p.z, p.yaw); }, ROAD_POSE);
    await sleep(1200); s = await state(page);
    check(`in the coupe, cockpit view, on the centre line of ${CAR_STREET} at z -330 facing north`, s.driving && s.vehicle === 'coupe' && s.view === 2 && Math.abs(s.z + 330) < 6, s);
    await page.keyboard.down('KeyW');
    try { await page.waitForFunction("!!document.querySelector('#panel:not([hidden]) .confirm')", { timeout: 90000, polling: 100 }); } catch (e) { /* reported below */ }
    await sleep(1500); s = await state(page); await page.keyboard.up('KeyW');
    check('driving north opens the question of g1 inside its zone and the car is held (slow, inside the strip)', s.open && s.driving && s.z >= -406 && s.z <= -330 && s.area === 'strip', s);
    await sleep(2500); const held = await state(page);
    check('the car is held while the question is open (it does not roll on)', held.driving && Math.abs(held.z - s.z) < 6 && held.speed < 8, { before: { z: s.z, v: s.speed }, after: { z: held.z, v: held.speed } });
    r = await acceptAndFollow(page); s = await state(page);
    check('north.html is ready', s.area === 'north' && !s.fatal && s.moduleErrors.length === 0, s);
    await arrival('north (arrival by car)', r.wallMs);
    await startPlaying(page); await sleep(2000); s = await state(page);
    check('arrival: the SAME car drives (coupe), its cockpit view survived, it is at rest', s.driving && s.vehicle === 'coupe' && s.view === 2 && s.speed < 1.5, s);
    check('arrival: inside the arrival rectangle of g1, on a drivable lane within 30 degrees of the heading', inRect(G1.arrive, s.x, s.z) && !!s.lane && s.lane.dot >= Math.cos(30 * Math.PI / 180), s);
    await shot(page, '4-north-car');
    await page.evaluate((fn) => { window.__gates.machine.grace(0); const p = new Function('return ' + fn)()(-300, false); window.__drive.place(p.x, p.z, p.yaw); }, ROAD_POSE);
    await sleep(1200); await page.keyboard.down('KeyW');
    try { await page.waitForFunction("!!document.querySelector('#panel:not([hidden]) .confirm')", { timeout: 90000, polling: 100 }); } catch (e) { /* reported below */ }
    await sleep(1500); s = await state(page); await page.keyboard.up('KeyW');
    check('driving south opens the question of g2 and the car is held', s.open && s.driving && s.area === 'north' && s.z <= -205, s);
    r = await acceptAndFollow(page); s = await state(page);
    check('index.html is ready', s.area === 'strip' && !s.fatal && s.moduleErrors.length === 0, s);
    await arrival('strip (arrival by car)', r.wallMs);
    await startPlaying(page); await sleep(2000); s = await state(page);
    check('arrival: the same car drives, cockpit view, at rest, inside the rectangle of g2', s.driving && s.vehicle === 'coupe' && s.view === 2 && s.speed < 1.5 && inRect(G2.arrive, s.x, s.z), s);
    await shot(page, '5-strip-car');
  }
  check('no page errors in the whole run', errors.length === 0, errors);
  report.errors = errors; report.passes = passes + 0; report.fails = fails;
} catch (e) { fails++; console.log('TEST ERROR:', e.stack || e.message); report.testError = String(e.stack || e.message).slice(0, 600); }
finally { report.passes = passes; report.fails = fails; fs.writeFileSync(OUT, JSON.stringify(report, null, 2)); console.log(`wrote ${path.relative(root, OUT)}`); await browser.close(); server.close(); }
console.log(`areas-hop-test: ${passes} passed, ${fails} failed`);
console.log(fails ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fails ? 1 : 0);
