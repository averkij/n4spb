// End-to-end test of the GARAGE (four drivable cars at the Moscow Railway Station) in the REAL page (headless Edge / Chrome with GPU, the full game flow like tools/drive-test.mjs):
//   load -> Start -> the four cars stand parked in a row (layout checks: no building, no traffic lane, solid for walkers) -> walk to each car: its own prompt, E gets in
//   (nearest car) -> accelerate 10 s / 14 s, 0-100 km/h, top speed on a long straight, braking from 60 and 100 km/h -> cockpit camera from the car's own eye -> exit (the car stays parked,
//   its box is solid again) -> compare the four cars: top speed and acceleration order truck < coupe < lada < roadster, braking truck longest, the Roadster shortest, mass order lada < coupe < roadster < truck.
//   node tools/drive-garage-test.mjs [--q medium] [--only environment,streets,city,drive] [--out shots/drive/garage] [--shots] [--tod night] [--load-timeout ms]
// The default module set has NO traffic / people (deterministic physics on the long straight; the collision / momentum tests are in tools/drive-garage-damage-test.mjs, the pure handling
// numbers in tools/drive-garage-handling.mjs). Exit code 1 on a page error, a module error or a failed check.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const out = args.out || 'shots/drive/garage';
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
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: 600000 });
const problems = [], logs = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
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
  page.on('console', (m) => { const t = m.type(); if (t === 'error') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ q: args.q || 'medium', t: '30', only: args.only || 'environment,streets,city,drive', baked: args.baked || 'force' });          // baked=force: the developer switch that keeps a stale bake usable while src is edited
  if (args.tod) q.set('tod', args.tod);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: Number(args['load-timeout'] || 600000), polling: 500 });
  for (const e of await page.evaluate(() => window.__errors || [])) problems.push(`[module ${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  await page.click('#go'); await sleep(1500);
  const shot = async (name) => { if (args.shots) await page.screenshot({ path: path.resolve(root, `${out}_${name}.png`) }); };

  // ================================================================= 1. the garage and the layout
  const garage = await page.evaluate(async () => {
    await Promise.race([window.__regions?.ensureAt(584, 218), new Promise((r) => setTimeout(r, 90000))]);
    const ctx = window.__ctx, d = window.__drive, L = ctx.L, ph = ctx.physics, st = ctx.services.streets, net = st.net;
    const res = { cars: [], problems: [] };
    const lanes = st.lanes.filter((l) => l.pts.some((p) => Math.hypot(p[0] - 585, p[1] - 218) < 80));
    const laneGap = (x, z) => { let best = 1e9, rank = -1; for (const l of lanes) { const p = l.pts; for (let i = 0; i + 1 < p.length; i++) { const ax = p[i][0], az = p[i][1], bx = p[i + 1][0], bz = p[i + 1][1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); const dd = Math.hypot(x - ax - t * dx, z - az - t * dz) - (l.width || 3) / 2; if (dd < best) { best = dd; rank = l.rank; } } } return [best, rank]; };
    for (const v of d.fleet) {
      const p = v.parked, S = v.spec, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), lx = cy, lz = -sy;
      const pts = []; for (const a of [S.front - 0.1, (S.front + S.rear) / 2, S.rear + 0.1]) for (const b of [-S.W / 2, 0, S.W / 2]) pts.push([p.x + sy * a + lx * b, p.z + cy * a + lz * b]);
      let building = 0, trafficLane = 0, outside = 0, minGap = 1e9;
      for (const [x, z] of pts) { if (L.insideBuilding(x, z)) building++; if (!L.inPlay(x, z)) outside++; const [g, rank] = laneGap(x, z); if (rank > 0) { minGap = Math.min(minGap, g); if (g < 0.3) trafficLane++; } }
      // the walkers' view: the parked box is a solid at the car's centre and its corners, and a free pavement strip stays on at least one side
      const cx = p.x + sy * S.centerZ, cz = p.z + cy * S.centerZ;
      const solid = (x, z) => ph.columnBlocked(x, z, 0.3, p.y + 0.3, p.y + 1.2);
      const side = (k) => { let free = 0; for (const f of [-S.len / 2 + 0.5, 0, S.len / 2 - 0.5]) { const x = cx + sy * f + lx * k * (S.W / 2 + 1.0), z = cz + cy * f + lz * k * (S.W / 2 + 1.0); if (!solid(x, z) && !L.insideBuilding(x, z)) free++; } return free; };
      // a free way out: 14 m straight ahead of the nose, as wide as the car plus 20 cm each side, no solid (other parked cars included) and no building
      let blockedAhead = 0; for (let f = 0.5; f <= 14; f += 0.5) for (const b of [-S.W / 2 - 0.2, 0, S.W / 2 + 0.2]) { const x = p.x + sy * (S.front + f) + lx * b, z = p.z + cy * (S.front + f) + lz * b; if (ph.columnBlocked(x, z, 0.25, p.y + 0.3, p.y + 1.2) || L.insideBuilding(x, z)) blockedAhead++; }
      res.cars.push({ id: v.id, blockedAhead, x: p.x, z: p.z, yawDeg: +(p.yaw * 180 / Math.PI).toFixed(1), len: S.len, W: S.W, mass: S.mass, durability: S.durability, building, outside, trafficLane, minGapToTrafficLane: minGap > 1e8 ? null : +minGap.toFixed(1),
        solidCentre: solid(cx, cz), solidNose: solid(cx + sy * (S.len / 2 - 0.3), cz + cy * (S.len / 2 - 0.3)), freeLeft: side(1), freeRight: side(-1), coverOnCentre: +net.cover(cx, cz, {}).toFixed(2), interactId: ctx.interact.list().find((i) => i.label === v.def.label)?.id || null });
    }
    // bumper-to-bumper gaps along the row (the footprint centres are on one line)
    const c = res.cars, n = d.fleet.length; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = d.fleet[i], b = d.fleet[j]; const d2 = Math.hypot(a.parked.x - b.parked.x, a.parked.z - b.parked.z); c.push({ pair: a.id + '-' + b.id, centreDistance: +d2.toFixed(2), gap: +(d2 - a.spec.len / 2 - b.spec.len / 2).toFixed(2) }); }
    return res;
  });
  console.log('garage:', JSON.stringify(garage.cars.filter((c) => c.id)));
  console.log('pairs:', JSON.stringify(garage.cars.filter((c) => c.pair)));
  const cars = garage.cars.filter((c) => c.id), pairs = garage.cars.filter((c) => c.pair);
  check(cars.map((c) => c.id).join() === 'coupe,truck,lada,roadster', `the garage holds coupe, truck, lada, roadster (got ${cars.map((c) => c.id)})`);
  for (const c of cars) {
    check(c.building === 0 && c.outside === 0, `${c.id}: the parked footprint is clear of buildings / the map edge`);
    check(c.trafficLane === 0, `${c.id}: the parked footprint is not on a traffic lane (gap to the nearest driven lane ${c.minGapToTrafficLane} m)`);
    check(c.solidCentre && c.solidNose, `${c.id}: the parked car is a solid for the walkers`);
    check(c.freeLeft >= 2 || c.freeRight >= 2, `${c.id}: a free strip stays beside the car (left ${c.freeLeft} / right ${c.freeRight})`);
    check(!!c.interactId, `${c.id}: its own [E] prompt is registered`);
    check(c.blockedAhead === 0, `${c.id}: the way out 14 m ahead of the nose is free (${c.blockedAhead} blocked samples)`);
  }
  for (const p of pairs) check(p.gap >= 0.6, `${p.pair}: cars keep ${p.gap} m between their bumpers (>= 0.6)`);
  await shot('0_row');

  // ================================================================= 2. the prompts: standing at a car offers THAT car; E gets in
  const prompts = {};
  for (const c of cars) {
    await page.evaluate((c) => {
      const d = window.__drive, v = d.vehicleById(c.id), S = v.spec, p = v.parked, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), cx = p.x + sy * S.centerZ, cz = p.z + cy * S.centerZ;
      const rx = cx - cy * 3.0, rz = cz + sy * 3.0, dx = cx - rx, dz = cz - rz;          // 3 m to the car's right side, looking at it
      window.__setCam(rx, null, rz, Math.atan2(-dx, -dz) * 180 / Math.PI, -8);
    }, c);
    await sleep(700);
    prompts[c.id] = await page.evaluate(() => { const el = document.getElementById('interact'); const t = window.__ctx.interact.target; return { text: el.textContent, shown: el.classList.contains('show'), id: t ? t.id : null }; });
    console.log(`prompt at ${c.id}:`, JSON.stringify(prompts[c.id]));
    check(prompts[c.id].shown && prompts[c.id].id === c.interactId, `${c.id}: standing beside it the prompt offers this car (${prompts[c.id].id} vs ${c.interactId})`);
    await shot(`1_prompt_${c.id}`);
  }
  check(/Сесть в машину/.test(prompts.coupe.text), 'coupe prompt text: Сесть в машину');
  check(/такси-пикап/.test(prompts.truck.text) && /taxi pickup/.test(prompts.truck.text), 'truck prompt text: такси-пикап / taxi pickup');
  check(/Жигули/.test(prompts.lada.text) && /Zhiguli/.test(prompts.lada.text), 'lada prompt text: Жигули / Zhiguli');
  check(/Сесть в родстер/.test(prompts.roadster.text) && /Roadster/.test(prompts.roadster.text), 'roadster prompt text: Сесть в родстер / Roadster');
  check(!/Tesla|Cybertruck|ВАЗ|Lada|VAZ/i.test(prompts.truck.text + prompts.lada.text + prompts.roadster.text), 'no brand names in the prompts');

  // ================================================================= 3. enter each car with the real E key, drive, measure, exit
  // candidates: the straightest long runs along the driven lanes (geometry only: the physics of far regions is not loaded yet), then each one is loaded region by region and re-checked with the solids
  const cands = await page.evaluate(() => {
    const ctx = window.__ctx, st = ctx.services.streets, net = st.net, car = window.__drive.car, out = [];
    const run = (x, z, tx, tz, maxLen) => { let n = 0; for (let s = 0; s <= maxLen; s += 6) { const px = x + tx * s, pz = z + tz * s; if (car.blocked(px, pz) || net.cover(px, pz, {}) < -0.5) break; n = s; } return n; };
    for (const l of st.lanes) {
      if (l.rank < 3 || l.bridge || l.pts.length < 3) continue;
      for (let i = 0; i + 1 < l.pts.length; i += 2) {
        const p = l.pts[i], q = l.pts[i + 1]; if (Math.hypot(p[0] - 579, p[1] - 219) > 1500) continue;
        const dx = q[0] - p[0], dz = q[1] - p[1], dd = Math.hypot(dx, dz) || 1, n = run(p[0], p[1], dx / dd, dz / dd, 1400);
        if (n >= 1000) out.push({ x: p[0], z: p[1], tx: dx / dd, tz: dz / dd, len: n, road: l.name || l.road });
      }
    }
    out.sort((a, b) => b.len - a.len); const picked = []; for (const c of out) if (picked.every((p) => Math.hypot(p.x - c.x, p.z - c.z) > 120)) picked.push(c); return picked.slice(0, 6);
  });
  let strait = null;
  for (const c of cands) {
    const v = await page.evaluate(async (c) => {
      const ph = window.__ctx.physics, car = window.__drive.car;
      for (let s = 0; s <= c.len; s += 150) await Promise.race([window.__regions?.ensureAt(c.x + c.tx * s, c.z + c.tz * s), new Promise((r) => setTimeout(r, 60000))]);
      let n = 0; for (let s = 0; s <= c.len; s += 4) { const px = c.x + c.tx * s, pz = c.z + c.tz * s; if (car.blocked(px, pz) || ph.columnBlocked(px, pz, 1.2, 0.3, 1.7)) break; n = s; }
      return { ...c, len: n };
    }, c);
    if (!strait || v.len > strait.len) strait = v;
    if (v.len >= 900) break;
  }
  console.log('straight:', JSON.stringify(strait));
  check(strait && strait.len >= 800, `a straight of >= 800 m exists for the top-speed runs (${strait && strait.len} m)`);
  const M = {};
  for (const c of cars) {
    const id = c.id;
    // the real E key beside the car
    await page.evaluate((c) => { const d = window.__drive, v = d.vehicleById(c.id), S = v.spec, p = v.parked, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), cx = p.x + sy * S.centerZ, cz = p.z + cy * S.centerZ, rx = cx - cy * 3.0, rz = cz + sy * 3.0, dx = cx - rx, dz = cz - rz; window.__setCam(rx, null, rz, Math.atan2(-dx, -dz) * 180 / Math.PI, -8); }, c);
    await sleep(600);
    await page.keyboard.press('KeyE'); await sleep(900);
    let st = await page.evaluate(() => { const d = window.__drive; return { active: d.active, id: d.vehicle.id, boxDropped: !d.vehicle.box, others: d.fleet.filter((f) => f !== d.vehicle).map((f) => !!f.box), toast: document.getElementById('toast')?.textContent || '', nlab: document.querySelector('#drive .d-nlab')?.textContent, spec: { mass: d.vehicle.spec.mass, eye: d.vehicle.spec.eye, fov: d.vehicle.spec.fovRest } }; });
    if (!st.active) { await page.keyboard.press('KeyE'); await sleep(900); st = await page.evaluate(() => { const d = window.__drive; return { active: d.active, id: d.vehicle.id, boxDropped: !d.vehicle.box, others: d.fleet.filter((f) => f !== d.vehicle).map((f) => !!f.box), toast: '', nlab: document.querySelector('#drive .d-nlab')?.textContent, spec: {} }; }); console.log('(the first E bounced; the second entered)'); }
    console.log(`E at ${id}:`, JSON.stringify(st));
    check(st.active && st.id === id, `${id}: E at the car gets into THIS car (got ${st.id})`);
    check(st.boxDropped && st.others.every(Boolean), `${id}: its parked box is removed while driving, the other three stay solid`);
    check(st.nlab === ({ truck: 'BOOST', roadster: 'THRUST' }[id] || 'NITRO'), `${id}: HUD boost label ${st.nlab}`);
    await shot(`2_seated_${id}`);
    // handling numbers on the straight
    M[id] = await page.evaluate((s, id) => {
      const d = window.__drive, car = d.car, DEG = Math.PI / 180, yaw = Math.atan2(s.tx, s.tz), r = { id, mass: d.vehicle.spec.mass };
      const start = () => { d.teleport(s.x, s.z, yaw); car.vx = car.vz = 0; };
      const I = (o) => ({ thr: 0, brk: 0, steer: 0, hand: false, nitro: false, ...o });          // sim() takes a function's result as it is: every field must be there
      const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
      // 0-100, speed after 10 s, top speed after 14 s
      start(); const p0 = { x: car.x, z: car.z };
      d.sim(14, { thr: 1 }, (i, c) => { if (r.t100 === undefined && c.speed >= 100) r.t100 = +(i / 60).toFixed(2); if (i === 599) { r.v10 = +c.speed.toFixed(1); r.d10 = +dist(c, p0).toFixed(0); } });
      r.top = +car.speed.toFixed(1); r.d14 = +dist(car, p0).toFixed(0); r.gearTop = car.gear; r.rpmTop = +car.rpm.toFixed(2); r.blockedAtEnd = car.blocked(car.x, car.z);
      // nitro for 3 s from 60 km/h
      start(); d.sim(6, (t) => I({ thr: 1, nitro: car.speed > 60 }), (i, c) => { if (i === 359) r.nitroKmh6s = +c.speed.toFixed(1); });
      // braking distance from 60 and 100 km/h
      for (const v0 of [60, 100]) {
        start(); let phase = 0, pb = null, key = 'brake' + v0;
        d.sim(14, (t) => (phase === 0 ? I({ thr: 1 }) : I({ brk: 1 })), (i, c) => { if (phase === 0 && c.speed >= v0) { phase = 1; pb = { x: c.x, z: c.z }; } else if (phase === 1 && c.speed < 0.6 && r[key] === undefined) r[key] = +dist(c, pb).toFixed(1); });
      }
      return r;
    }, strait, id);
    console.log(`${id}:`, JSON.stringify(M[id]));
    // the cockpit camera: the driver's eye of THIS car, its own field of view
    const cam = await page.evaluate(async (id) => {
      await Promise.race([window.__regions?.ensureAt(584, 218), new Promise((r) => setTimeout(r, 90000))]);          // the run left the player far away: bring the station's regions back
      const d = window.__drive, camera = window.__camera, THREE_ = window.THREE, v = d.vehicle, e = v.spec.eye, r = {};
      d.teleport(v.parked.x, v.parked.z, v.parked.yaw); d.setView(2); d.sim(0.05, {});
      const w = v.model.root.localToWorld(new THREE_.Vector3(e.x, e.y, e.z));
      r.dEye = +Math.hypot(camera.position.x - w.x, camera.position.y - w.y, camera.position.z - w.z).toFixed(3); r.fov = +camera.fov.toFixed(1); r.fovRest = v.spec.fovRest; r.near = camera.near;
      r.cockpitVisible = !!v.model.cockpit?.group?.visible; r.bodyHidden = !v.model.body.visible;
      d.setView(0); return r;
    }, id);
    console.log(`cockpit ${id}:`, JSON.stringify(cam));
    check(cam.dEye < 0.12, `${id}: the cockpit camera sits at the car's own eye point (off by ${cam.dEye} m)`);
    check(Math.abs(cam.fov - cam.fovRest) < 0.6, `${id}: the cockpit field of view is the car's (${cam.fov} vs ${cam.fovRest})`);
    check(cam.cockpitVisible && cam.bodyHidden, `${id}: the cockpit interior replaces the exterior shell in mode 2`);
    // exit: the car stays where it stopped, solid again; the walker stands beside it
    const ex = await page.evaluate((id) => {
      const d = window.__drive, v = d.vehicle, c = v.car; c.vx = c.vz = 0;
      const ok = d.exit(false); const p = window.__ctx.playerObj;
      return { ok, active: d.active, parkedX: +v.parked.x.toFixed(1), parkedZ: +v.parked.z.toFixed(1), box: !!v.box, walkerDist: +Math.hypot(p.pos.x - v.parked.x, p.pos.z - v.parked.z).toFixed(1), lock: p.inputLock };
    }, id);
    console.log(`exit ${id}:`, JSON.stringify(ex));
    check(ex.ok && !ex.active && ex.box && ex.lock === 0, `${id}: exit leaves the car parked as a solid and gives control back`);
    check(ex.walkerDist < 6, `${id}: the walker stands next to the parked car (${ex.walkerDist} m)`);
  }
  // ================================================================= 4. the comparison
  const Cc = M.coupe, T = M.truck, Ld = M.lada, Rd = M.roadster;
  const rows = ['mass', 't100', 'v10', 'd10', 'top', 'nitroKmh6s', 'brake60', 'brake100'];
  console.log('metric'.padEnd(11), 'coupe'.padStart(9), 'truck'.padStart(9), 'lada'.padStart(9), 'roadster'.padStart(9));
  for (const k of rows) console.log(k.padEnd(11), ...['coupe', 'truck', 'lada', 'roadster'].map((i) => String(M[i][k]).padStart(9)));
  check(T.mass > Rd.mass && Rd.mass > Cc.mass && Cc.mass > Ld.mass, `mass order truck ${T.mass} > roadster ${Rd.mass} > coupe ${Cc.mass} > lada ${Ld.mass}`);
  check(T.mass / Cc.mass > 2.0 && T.mass / Cc.mass < 2.4 && Ld.mass / Cc.mass > 0.6 && Ld.mass / Cc.mass < 0.8, 'masses are about 2.2 x and 0.7 x the coupe');
  check(Rd.mass / Cc.mass > 1.15 && Rd.mass / Cc.mass < 1.35, `the roadster weighs ${(Rd.mass / Cc.mass).toFixed(2)} x the coupe (about 1.25 x)`);
  check(T.top < Cc.top && Cc.top < Ld.top && Ld.top < Rd.top, `top speed (14 s on the straight): truck ${T.top} < coupe ${Cc.top} < lada ${Ld.top} < roadster ${Rd.top}`);
  check(T.v10 < Cc.v10 && Cc.v10 < Ld.v10 && Ld.v10 < Rd.v10, `speed after 10 s: truck ${T.v10} < coupe ${Cc.v10} < lada ${Ld.v10} < roadster ${Rd.v10}`);
  check(T.t100 > Cc.t100 && Cc.t100 > Ld.t100 && Ld.t100 > Rd.t100, `0-100 km/h: truck ${T.t100} s > coupe ${Cc.t100} s > lada ${Ld.t100} s > roadster ${Rd.t100} s`);
  check(Rd.t100 >= 1.3 && Rd.t100 <= 1.6, `the roadster does 0-100 km/h in ${Rd.t100} s (1.3-1.6 s)`);
  check(Rd.top >= 190 && Rd.top <= 210, `the roadster's top speed after 14 s is ${Rd.top} km/h (about 200 without THRUST)`);
  check(Rd.gearTop === 1, `the roadster has one gear (${Rd.gearTop})`);
  check(T.top / Cc.top > 0.8 && T.top / Cc.top < 0.9, `the truck's top speed is ${(T.top / Cc.top * 100).toFixed(0)} % of the coupe's (about 85 %)`);
  check(Ld.top / Cc.top > 1.04 && Ld.top / Cc.top < 1.13, `the lada's top speed is ${(Ld.top / Cc.top * 100).toFixed(0)} % of the coupe's (about 108 %)`);
  check(T.nitroKmh6s < Cc.nitroKmh6s && Cc.nitroKmh6s < Rd.nitroKmh6s, `the truck's boost is weaker (${T.nitroKmh6s} vs ${Cc.nitroKmh6s} km/h after 6 s), the roadster's THRUST stronger (${Rd.nitroKmh6s})`);
  check(T.brake60 > Cc.brake60 && T.brake100 > Cc.brake100, `the truck brakes longer (${T.brake60} / ${T.brake100} m vs ${Cc.brake60} / ${Cc.brake100} m)`);
  check(Ld.brake60 > Cc.brake60, `the lada's old brakes are softer (${Ld.brake60} m vs ${Cc.brake60} m)`);
  check(Rd.brake60 < Cc.brake60 && Rd.brake100 < Cc.brake100, `the roadster brakes shortest (${Rd.brake60} / ${Rd.brake100} m vs ${Cc.brake60} / ${Cc.brake100} m)`);
  for (const id of ['coupe', 'truck', 'lada', 'roadster']) check(!M[id].blockedAtEnd, `${id}: the straight run ended on the road`);

  // ================================================================= 4b. parked cars are drawn only when they can be seen (70 m, or inside the view frustum)
  const vis = {};
  await page.evaluate(() => window.__setCam(1100, null, 219, -90, 0)); await sleep(700);        // 520 m east of the row, looking away from it
  vis.farAway = await page.evaluate(() => window.__drive.fleet.map((v) => v.model.root.visible));
  await page.evaluate(() => window.__setCam(600, null, 330, -135, 0)); await sleep(700);          // 120 m away, looking away (outside the frustum)
  vis.behind = await page.evaluate(() => window.__drive.fleet.map((v) => v.model.root.visible));
  await page.evaluate(() => window.__setCam(640, null, 190, -90, 0)); await sleep(700);           // 60 m away, looking the other way: inside the 70 m ring
  vis.close = await page.evaluate(() => window.__drive.fleet.map((v) => v.model.root.visible));
  await page.evaluate(() => window.__setCam(575, null, 224, -62, -6)); await sleep(700);
  vis.here = await page.evaluate(() => window.__drive.fleet.map((v) => v.model.root.visible));
  console.log('visibility (coupe, truck, lada, roadster):', JSON.stringify(vis));
  check(vis.farAway.every((v) => !v) && vis.behind.every((v) => !v), 'parked cars are hidden far away and when outside the view');
  check(vis.close.every(Boolean) && vis.here.every(Boolean), 'parked cars are drawn within 70 m and in the view');
  // ================================================================= 5. state per car: a dent stays with its car
  const keep = await page.evaluate(() => {
    const d = window.__drive, ph = window.__ctx.physics, f = (id) => d.vehicleById(id), r = {};
    for (const v of d.fleet) { v.damage.repair(); v.car.damage = 0; v.car.collisionSpec = null; }          // start from four pristine cars
    // a real crash on the free forecourt south of the aisle (a wall 10 m ahead), then park it where it stopped
    const l = f('lada'), p = { x: l.parked.x, z: l.parked.z, yaw: l.parked.yaw };
    d.enter('lada'); d.teleport(568, 229, 0);          // 28 m west of the Roadster's spot, on the free forecourt
    const wall = ph.addBox(568, 240, 10, 0.6, 0, 0, 3);
    d.car.vx = 0; d.car.vz = 22; d.sim(2.5, { thr: 0 });
    r.ladaDamage = l.damage.amount; r.ladaStage = l.damage.stage; r.ladaShed = Object.keys(l.damage.state.shed || {}).length;
    d.car.vx = d.car.vz = 0; d.car.speed = 0; d.exit(true); ph.remove(wall);
    r.ladaParkedAt = [+l.parked.x.toFixed(1), +l.parked.z.toFixed(1)];
    r.coupeAfter = f('coupe').damage.amount; r.truckAfter = f('truck').damage.amount; r.roadsterAfter = f('roadster').damage.amount;
    d.enter('coupe'); r.hudDamageCoupe = d.car.damage; d.car.speed = 0; d.exit(true);
    d.enter('lada'); r.hudDamageLada = d.car.damage; r.ladaReenter = d.damage.amount; d.car.speed = 0; d.exit(true);
    // put everything back for the next checks
    d.enter('lada'); d.teleport(p.x, p.z, p.yaw); d.car.speed = 0; d.exit(true); d.enter('lada'); d.repair(); d.car.speed = 0; d.exit(true);
    return r;
  });
  console.log('state per car:', JSON.stringify(keep));
  check(keep.ladaDamage > 0.2, `the Zhiguli took a real dent from the wall (${keep.ladaDamage.toFixed(2)}, ${keep.ladaStage})`);
  check(keep.coupeAfter === 0 && keep.truckAfter === 0 && keep.roadsterAfter === 0, 'the other three cars stay pristine');
  check(keep.hudDamageCoupe === 0 && keep.hudDamageLada > 0.2 && keep.ladaReenter === keep.ladaDamage, 'entering a car shows its own damage in the HUD state');
  await shot('3_after');
  for (const l of logs) problems.push(l);
} catch (e) { problems.push(`[test] ${e.stack || e.message}`); }
finally { await browser.close(); server.close(); }
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('PASS garage: four cars parked clear of the lanes, their own prompts, E enters the nearest, per-car cockpit eye / fov, truck < coupe < lada < roadster in speed and acceleration, truck brakes longest, the roadster shortest, dents stay per car');
