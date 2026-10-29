// The REAL keyboard flow of every garage car in the real page (headless Edge / Chrome with GPU, the HUD is drawn): load -> Start -> for each car (taxi pickup, Zhiguli, Roadster, red coupe, in that order,
// so that "exit one car, enter the next" is exercised three times): walk up -> the car's own prompt -> E -> W (gas) -> Shift (nitro / boost) -> A + Space (handbrake drift) -> G (horn) -> V V V
// (chase / high / cockpit / chase) -> S (brake, then reverse) -> E (exit, the car stays solid) -> the next car.
// The Roadster also hops (hop v3: X = the simple hop 1.86 m, C = the barrel hop 3.72 m with the roll; both launch on the key DOWN) once the gas hops are built into handling.js (the check switches itself on when the car has a `hop` tuning and a height `h`).
//   node tools/drive-garage-keys-test.mjs [--q medium] [--only environment,streets,city,landmarksC,drive] [--shots] [--out shots/drive/keys] [--tod night] [--load-timeout ms]
// Checks per car: the prompt names the car, E gets into THAT car (HUD boost label, one-gear letter D for the pickup and the Roadster), gas speeds up, the nitro lowers the tank and raises the speed, the handbrake
// with A makes the car slide (drifting or a sideways speed) and turns it, the horn is called, V cycles the camera 0 -> 1 -> 2 -> 0 and the cockpit set is visible only in mode 2, S stops the car
// (and reverses it), E at < 25 km/h gets out, the car is a solid box again, the other cars never moved. Exit code 1 on a page error, a module error or a failed check.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const out = args.out || 'shots/drive/keys';
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
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: 900000 });
const problems = [], logs = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); else console.log('  ok:', msg); };
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
  const q = new URLSearchParams({ q: args.q || 'medium', t: '30', only: args.only || 'environment,streets,city,landmarksC,drive', baked: args.baked || 'force' });          // baked=force: the developer switch that keeps a stale bake usable while src is edited
  if (args.tod) q.set('tod', args.tod);
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: Number(args['load-timeout'] || 900000), polling: 500 });
  for (const e of await page.evaluate(() => window.__errors || [])) problems.push(`[module ${e.module}] ${e.message.split('\n').slice(0, 4).join(' | ')}`);
  await page.click('#go'); await sleep(1500);
  const shot = async (name) => { if (args.shots) await page.screenshot({ path: path.resolve(root, `${out}_${name}.png`) }); };
  const st = () => page.evaluate(() => { const d = window.__drive, c = d.car; return { active: d.active, id: d.vehicle.id, x: +c.x.toFixed(1), z: +c.z.toFixed(1), kmh: +c.speed.toFixed(0), vF: +c.vF.toFixed(1), gear: c.gear, rpm: +c.rpm.toFixed(2), boost: +c.boost.toFixed(2), boosting: c.boosting, drift: c.drifting, vL: +c.vL.toFixed(1), yaw: +(c.yaw * 180 / Math.PI).toFixed(0), mode: d.view.mode, braking: c.braking }; });
  await page.evaluate(async () => {
    await Promise.race([window.__regions?.ensureAt(584, 218), new Promise((r) => setTimeout(r, 90000))]);
    const d = window.__drive; window.__horns = 0; const h = d.sound.horn; d.sound.horn = function () { window.__horns++; return h.apply(this, arguments); };
    window.__moved0 = Object.fromEntries(d.fleet.map((v) => [v.id, [v.parked.x, v.parked.z]]));
  });
  // the phases run on a long straight street (a crash into a pole of the station square would fail the test for the wrong reason): the same search as tools/drive-garage-test.mjs
  const cands = await page.evaluate(() => {
    const ctx = window.__ctx, st = ctx.services.streets, net = st.net, car = window.__drive.car, out = [];
    const run = (x, z, tx, tz, maxLen) => { let n = 0; for (let s = 0; s <= maxLen; s += 6) { const px = x + tx * s, pz = z + tz * s; if (car.blocked(px, pz) || net.cover(px, pz, {}) < -0.5) break; n = s; } return n; };
    for (const l of st.lanes) {
      if (l.rank < 3 || l.bridge || l.pts.length < 3) continue;
      for (let i = 0; i + 1 < l.pts.length; i += 2) {
        const p = l.pts[i], q = l.pts[i + 1]; if (Math.hypot(p[0] - 579, p[1] - 219) > 1500) continue;
        const dx = q[0] - p[0], dz = q[1] - p[1], dd = Math.hypot(dx, dz) || 1, n = run(p[0], p[1], dx / dd, dz / dd, 700);
        if (n >= 500) out.push({ x: p[0], z: p[1], tx: dx / dd, tz: dz / dd, len: n });
      }
    }
    out.sort((a, b) => b.len - a.len); return out.slice(0, 4);
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
    if (v.len >= 500) break;
  }
  console.log('straight:', JSON.stringify(strait));
  check(strait && strait.len >= 400, `a straight of >= 400 m exists for the driving phases (${strait && strait.len} m)`);
  const R = {};
  for (const id of ['truck', 'lada', 'roadster', 'coupe']) {
    console.log(`=== ${id}`);
    const sp = await page.evaluate((id) => { const v = window.__drive.vehicleById(id); return { x: v.parked.x, z: v.parked.z, yaw: v.parked.yaw, cz: v.spec.centerZ, label: v.def.label }; }, id);
    // the walker 3 m to the car's right side, looking at it
    await page.evaluate(async (s) => { await Promise.race([window.__regions?.ensureAt(s.x, s.z), new Promise((r) => setTimeout(r, 90000))]); const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw), cx = s.x + sy * s.cz, cz = s.z + cy * s.cz, rx = cx - cy * 3.0, rz = cz + sy * 3.0; window.__setCam(rx, null, rz, Math.atan2(-(cx - rx), -(cz - rz)) * 180 / Math.PI, -8); }, sp);
    await sleep(900);
    const prompt = await page.evaluate(() => { const el = document.getElementById('interact'); return { text: el.textContent, shown: el.classList.contains('show'), id: window.__ctx.interact.target && window.__ctx.interact.target.id }; });
    check(prompt.shown && prompt.id === (id === 'coupe' ? 'drive-car' : 'drive-' + id), `${id}: the prompt belongs to this car (${prompt.id}: ${prompt.text})`);
    await shot(`${id}_0_prompt`);
    await page.keyboard.press('KeyE'); await sleep(900);
    let s = await st();
    if (!s.active) { console.log('(the first E bounced)'); await page.keyboard.press('KeyE'); await sleep(900); s = await st(); }
    check(s.active && s.id === id, `${id}: E gets into this car (${s.id})`);
    const hud = await page.evaluate(() => ({ nlab: document.querySelector('#drive .d-nlab')?.textContent, toast: document.getElementById('toast')?.textContent }));
    check(hud.nlab === ({ truck: 'BOOST', roadster: 'THRUST' }[id] || 'NITRO'), `${id}: the boost bar says ${hud.nlab}`);
    await shot(`${id}_1_seated`);
    await page.evaluate((s) => { const d = window.__drive; d.teleport(s.x, s.z, Math.atan2(s.tx, s.tz)); d.car.vx = d.car.vz = 0; }, strait); await sleep(600);
    // gas
    await page.keyboard.down('KeyW'); await sleep(2500); s = await st(); const gas = s; console.log('gas 2.5 s:', JSON.stringify(s));
    check(s.kmh > 30, `${id}: W speeds the car up (${s.kmh} km/h after 2.5 s)`);
    if (id === 'truck' || id === 'roadster') check(s.gear === 1, `${id}: the electric car has one gear (${s.gear})`);
    if (id === 'lada') check(s.gear >= 2, `${id}: the Zhiguli shifts (${s.gear})`);
    await shot(`${id}_2_gas`);
    // horn
    await page.keyboard.press('KeyG'); await sleep(200);
    check((await page.evaluate(() => window.__horns)) > (R.horns || 0), `${id}: G honks`); R.horns = await page.evaluate(() => window.__horns);
    // drift at the gas speed: A + Space for 0.6 s
    const yaw0 = s.yaw;
    await page.keyboard.down('KeyA'); await page.keyboard.down('Space'); await sleep(600); s = await st(); console.log('drift:', JSON.stringify(s));
    const dyaw = Math.abs(((s.yaw - yaw0 + 540) % 360) - 180);
    check(s.drift || Math.abs(s.vL) > 2, `${id}: A + Space slides the car (vL ${s.vL}, drifting ${s.drift})`);
    check(dyaw > 8 || s.braking, `${id}: ... and turns it (${dyaw} deg)`);
    await shot(`${id}_4_drift`);
    await page.keyboard.up('Space'); await page.keyboard.up('KeyA'); await sleep(300);
    // back to the start of the straight (W stays down), then the nitro / boost after 1.6 s of gas
    await page.evaluate((s) => { const d = window.__drive; d.teleport(s.x, s.z, Math.atan2(s.tx, s.tz)); d.car.vx = d.car.vz = 0; }, strait); await sleep(1700);
    s = await st(); const b0 = s.boost, k0 = s.kmh;
    await page.keyboard.down('ShiftLeft'); await sleep(1200); s = await st(); console.log('nitro:', JSON.stringify(s));
    check(s.boosting && s.boost < b0 - 0.1 && s.kmh > k0 + 5, `${id}: Shift boosts (tank ${b0} -> ${s.boost}, ${k0} -> ${s.kmh} km/h)`);
    await shot(`${id}_3_nitro`);
    await page.keyboard.up('ShiftLeft');
    // the Roadster's gas hops (hop v3, both on the key DOWN): X = up within a third of a second (1.86 m apex, > 0.3 m after 0.3 s), back on the ground inside 2.2 s, the tank pays 0.28 (checked right after the launch);
    // C = the barrel hop: higher than X could ever go (> 2.4 m after 0.5 s), the cosmetic roll turns (|flip| > 0.2 or done) and is exactly 0 on the ground again; the other key in the air does nothing
    const hopOn = await page.evaluate(() => { const d = window.__drive; return !!(d.vehicle.def.tuning.hop && typeof d.car.h === 'number'); });
    if (id === 'roadster') console.log(hopOn ? 'hop: the car has the gas hops' : 'hop: not built into handling.js yet (skipped)');
    if (hopOn) {
      await page.evaluate(() => { window.__drive.car.boost = 1; }); await sleep(100);
      const tank0 = (await st()).boost; await page.keyboard.down('KeyX'); await sleep(60);
      const t1 = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air, boost: +c.boost.toFixed(2), flipOn: !!c.flipOn }; });
      await page.keyboard.up('KeyX'); await sleep(260);
      const up = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air }; });
      await sleep(1900); const down = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air, boost: +c.boost.toFixed(2), flip: c.flip }; });
      console.log('hop X:', JSON.stringify({ tank0, t1, up, down }));
      check(t1.air && t1.h > 0 && !t1.flipOn, `${id}: X launches on the key DOWN (60 ms after the press: ${t1.h} m up, no roll)`);
      check(up.air && up.h > 0.3 && !down.air && down.h === 0, `${id}: X hops (${up.h} m up after 0.3 s, down again: ${down.air ? 'still airborne' : 'landed'})`);
      await page.evaluate(() => { window.__drive.car.boost = 1; }); await sleep(700);        // the cooldown after the touchdown is over
      await page.keyboard.down('KeyC'); await sleep(60);
      const c1 = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air, flipOn: !!c.flipOn }; });
      await page.keyboard.up('KeyC'); await page.keyboard.press('KeyX'); await sleep(440);   // X in the air does nothing
      const c2 = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air, flip: +c.flip.toFixed(2), flipOn: !!c.flipOn }; });
      await sleep(2300); const c3 = await page.evaluate(() => { const c = window.__drive.car; return { h: +c.h.toFixed(2), air: !!c.air, flip: c.flip, flipOn: !!c.flipOn }; });
      console.log('hop C:', JSON.stringify({ c1, c2, c3 }));
      check(c1.air && c1.h > 0 && c1.flipOn, `${id}: C launches on the key DOWN (60 ms after the press: ${c1.h} m up, rolling)`);
      check(c2.air && c2.h > 2.4 && c2.flipOn, `${id}: C is the barrel hop (${c2.h} m up after 0.5 s, higher than the simple hop ever gets; roll ${c2.flip} rad)`);
      check(!c3.air && c3.h === 0 && c3.flip === 0 && !c3.flipOn, `${id}: C lands level (flip ${c3.flip}, ${c3.air ? 'still airborne' : 'landed'})`);
    }
    // cameras
    const modes = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyV'); await sleep(900);
      modes.push(await page.evaluate(() => { const d = window.__drive; return { mode: d.view.mode, cockpit: !!(d.model.cockpit && d.model.cockpit.group.visible), body: d.model.body.visible }; }));
      await shot(`${id}_5_view${modes[i].mode}`);
    }
    check(modes.map((m) => m.mode).join() === '1,2,0', `${id}: V cycles the camera (${modes.map((m) => m.mode)})`);
    check(modes[1].cockpit && !modes[1].body && !modes[0].cockpit && !modes[2].cockpit && modes[2].body, `${id}: the cockpit set is visible only in mode 2`);
    // brake / reverse
    await page.keyboard.up('KeyW'); await page.keyboard.down('KeyS'); await sleep(2200); s = await st(); console.log('brake:', JSON.stringify(s));
    check(s.vF < -1, `${id}: S stops the car and reverses it (vF ${s.vF})`);
    await page.keyboard.up('KeyS'); await sleep(2500); s = await st();
    check(s.kmh < 25, `${id}: it is slow enough to get out (${s.kmh} km/h)`);
    await shot(`${id}_6_stopped`);
    await page.keyboard.press('KeyE'); await sleep(900);
    s = await st(); const pl = await page.evaluate((id) => { const p = window.__ctx.playerObj, v = window.__drive.vehicleById(id); return { lock: p.inputLock, driving: document.body.classList.contains('driving'), box: !!v.box, d: Math.hypot(p.pos.x - v.parked.x, p.pos.z - v.parked.z) }; }, id);
    console.log('exit:', JSON.stringify(s), JSON.stringify(pl));
    check(!s.active && pl.lock === 0 && !pl.driving && pl.box && pl.d < 8, `${id}: E gets out, the car is a solid box again, the walker stands beside it (${pl.d.toFixed(1)} m)`);
    await shot(`${id}_7_out`);
    R[id] = { gas, exit: s };
  }
  const moved = await page.evaluate(() => { const d = window.__drive; return d.fleet.map((v) => [v.id, Math.hypot(v.parked.x - window.__moved0[v.id][0], v.parked.z - window.__moved0[v.id][1])]); });
  console.log('how far each car ended from its start spot:', JSON.stringify(moved));
  const kmh = (id) => R[id].gas.kmh;
  check(kmh('truck') < kmh('coupe') && kmh('coupe') < kmh('lada') && kmh('lada') < kmh('roadster'), `speed after 2.5 s of gas: truck ${kmh('truck')} < coupe ${kmh('coupe')} < lada ${kmh('lada')} < roadster ${kmh('roadster')} km/h`);
} catch (e) {
  problems.push(`[test crashed] ${e.stack || e.message}`);
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 30)) console.log(' ', l.slice(0, 400)); }
  await browser.close(); server.close();
}
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('PASS garage keys: the real keyboard drives the pickup, the Zhiguli, the Roadster and the coupe (gas, nitro, drift, horn, camera, brake, reverse, exit) one after another');
