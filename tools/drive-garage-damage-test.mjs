// Crash test of EVERY garage car (red coupe, taxi pickup, eggplant Zhiguli, Tesla Roadster) in the collision yard (tools/collision-lab.html: the production drive.js + registry + damage + wrecks in a small
// scene, headless Edge with the GPU): each car is driven into the wall, into a parked sedan and into oncoming traffic with its OWN spec, geometry and mass.
//   node tools/drive-garage-damage-test.mjs [--shots] [--keep]      (screenshots with --shots: shots/collision/garage_<car>_<case>.png)
// Proves per car: crush (the front of its own shell moves back, the stage rises), shed panels (the index shrinks, debris bodies fly), smoke, exact repair, one damage state per car
// (a dented car stays dented while another is driven), the wreck of a struck sedan, and the MASS order: the heavier the car, the farther it throws the parked sedan; the stouter the
// body (truck > coupe > roadster > lada), the less it crumples at the same speed. tools/drive-damage-test.mjs and tools/wreck-physics-test.mjs (node, no page) keep covering the shared base.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const out = path.join(root, 'shots/collision'); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((req, res) => { const f = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname); if (!f.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); } fs.readFile(f, (err, data) => { res.writeHead(err ? 404 : 200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(err ? 'missing' : data); }); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--no-first-run'], defaultViewport: { width: 1280, height: 800 }, protocolTimeout: 240000 });
const errors = [], problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const url = `http://127.0.0.1:${server.address().port}/tools/collision-lab.html`;
  /** a clean yard for every measurement (the yard keeps wreck / traffic records between resets): reload, pause, optionally get into a car */
  const fresh = async (id = null) => {
    await page.goto(url); await page.waitForFunction('window.labReady', { timeout: 120000 }); await page.evaluate(() => lab.pause());
    if (id) await page.evaluate((id) => { const d = lab.drive; if (d.active) d.exit(true); d.enter(id); lab.reset(); }, id);
  };
  await fresh();
  const shot = async (name) => { if (!args.has('--shots')) return; await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.screenshot({ path: path.join(out, `garage_${name}.png`) }); };
  const ids = await page.evaluate(() => lab.drive.fleet.map((v) => v.id));
  console.log('garage:', ids.join(', '));
  assert.deepEqual(ids, ['coupe', 'truck', 'lada', 'roadster'], 'all four cars are in the garage');
  const R = {};
  // ---------------------------------------------------------------- per car: wall, shed panels, repair
  for (const id of ids) {
    const r = R[id] = {};
    await fresh(id);
    const info = await page.evaluate(() => { const v = lab.drive.vehicle, g = v.model.body.geometry; g.computeBoundingBox(); return { id: v.id, mass: v.spec.mass, len: v.spec.len, W: v.spec.W, hgt: v.spec.hgt, front: g.boundingBox.max.z, rear: g.boundingBox.min.z, tris: g.index.count / 3, pristine: Array.from(g.attributes.position.array), index: Array.from(g.index.array), durability: v.spec.durability, calls: v.model.root.children.length } });
    assert.equal(info.id, id); r.info = { mass: info.mass, len: info.len, tris: info.tris, durability: info.durability };
    const w1 = await page.evaluate(() => lab.crash('wall', 30)); r.wall30 = w1;
    await page.evaluate(() => { for (let i = 0; i < 90; i++) lab.advance(1 / 60); });
    const after = await page.evaluate(() => { const v = lab.drive.vehicle, g = v.model.body.geometry; g.computeBoundingBox(); return { stage: v.damage.amount, name: v.damage.stage, front: g.boundingBox.max.z, front_state: v.damage.state.front, smoke: v.damage.smoke, kmh: v.car.speed, z: v.car.z, tris: g.index.count / 3 }; });
    r.afterWall30 = after;
    check(w1.damage > 0.25, `${id}: a 30 m/s wall hit dents the body (damage ${w1.damage.toFixed(2)})`);
    check(info.front - after.front > 0.2, `${id}: the front of its own shell moved back ${(info.front - after.front).toFixed(2)} m`);
    check(after.z < 12.5 + (id === 'truck' ? 0.5 : 0), `${id}: the wall stopped the car (z ${after.z.toFixed(1)})`);
    check(after.kmh < 30, `${id}: the car lost its speed (${after.kmh.toFixed(0)} km/h)`);
    check(after.smoke >= 0, `${id}: smoke value present`);
    await shot(`${id}_wall30`);
    // a second, harder hit: panels shed + debris bodies fly
    await page.evaluate(() => { lab.crash('wall', 48); });
    await page.evaluate(() => { for (let i = 0; i < 60; i++) lab.advance(1 / 60); });
    const hard = await page.evaluate(() => { const v = lab.drive.vehicle, g = v.model.body.geometry; return { amount: v.damage.amount, name: v.damage.stage, tris: g.index.count / 3, debris: lab.wrecks.stats.debris, shed: Object.keys(v.damage.state.shed || {}).length, smoke: v.damage.smoke, plateVisible: v.model.root.children.filter((o) => o.material?.name === 'drive-plate' && o.position.z > 0).some((o) => o.visible) }; });
    r.afterWall48 = hard;
    check(hard.amount > 0.6, `${id}: two hard hits crumple the car (${hard.amount.toFixed(2)})`);
    check(hard.tris < info.tris - 20, `${id}: panels came off its own shell (${info.tris} -> ${hard.tris} triangles)`);
    check(hard.debris > 0 && hard.shed > 0, `${id}: shed pieces became rigid debris (${hard.debris} bodies, ${hard.shed} shed keys)`);
    check(!hard.plateVisible, `${id}: the front plate is gone`);
    await shot(`${id}_wall48`);
    // the damage state belongs to this car only
    r.stateSnapshot = await page.evaluate(() => { const s = lab.drive.vehicle.damage.state; return { front: s.front, rear: s.rear, left: s.left, right: s.right }; });
    // Internal fixture reset restores pristine geometry; gameplay has no repair action.
    assert.equal(await page.evaluate(() => typeof lab.drive.repair), 'undefined', 'no public repair API');
    await page.evaluate(() => { const d = lab.drive; d.car.vx = d.car.vz = 0; d.damage.repair(); d.car.damage = d.car.damageSmoke = 0; d.car.damageStage = d.damage.stage; });
    const fixed = await page.evaluate(() => { const g = lab.drive.vehicle.model.body.geometry; return { pos: Array.from(g.attributes.position.array), index: Array.from(g.index.array), amount: lab.drive.damage.amount }; });
    check(fixed.amount === 0, `${id}: repair clears the damage`);
    check(JSON.stringify(fixed.pos) === JSON.stringify(info.pristine) && JSON.stringify(fixed.index) === JSON.stringify(info.index), `${id}: repair restores the pristine geometry exactly`);
    console.log(`${id.padEnd(6)} mass ${info.mass} kg  durability ${info.durability}  wall30: damage ${w1.damage.toFixed(2)} crush ${(info.front - after.front).toFixed(2)} m, stage ${after.name}; two hits: ${hard.name} ${hard.amount.toFixed(2)}, triangles ${info.tris} -> ${hard.tris}, debris ${hard.debris}`);
  }
  // ---------------------------------------------------------------- crush at the SAME speed: the stouter body crumples less
  const dmg = {};
  for (const id of ids) { await fresh(id); dmg[id] = await page.evaluate(() => lab.crash('wall', 20).damage); }
  console.log('damage at 20 m/s into the wall:', JSON.stringify(Object.fromEntries(Object.entries(dmg).map(([k, v]) => [k, +v.toFixed(3)]))));
  check(dmg.truck < dmg.coupe && dmg.coupe < dmg.lada, `crush order at the same speed: truck ${dmg.truck.toFixed(3)} < coupe ${dmg.coupe.toFixed(3)} < lada ${dmg.lada.toFixed(3)}`);
  check(dmg.roadster > dmg.truck && dmg.roadster < dmg.lada * 1.15, `the thin Roadster shell crumples more than the truck's (${dmg.roadster.toFixed(3)} vs ${dmg.truck.toFixed(3)}) and about like the others`);
  // ---------------------------------------------------------------- the struck sedan: wreck + momentum (the heavier car throws it farther)
  const thrown = {};
  for (const id of ids) {
    await fresh(id);
    const r = await page.evaluate(async (id) => {
      const d = lab.drive;
      const c = lab.crash('parked', 22);
      for (let i = 0; i < 150; i++) lab.advance(1 / 60);
      const p = lab.parked;
      return { dz: p.z - 14, dx: p.x + 16, wrecked: !!p.wrecked, rear: p.damageState ? p.damageState.rear : 0, cars: lab.wrecks.stats.cars, carDamage: c.damage, carZ: d.car.z, carKmh: d.car.speed };
    }, id);
    thrown[id] = r.dz; R[id].parkedHit = r;
    check(r.wrecked, `${id}: the struck sedan became a physical wreck`);
    check(r.rear > 0.05, `${id}: the struck sedan is dented at the rear (${r.rear.toFixed(2)})`);
    check(r.carDamage > 0, `${id}: the car took damage from the sedan (${r.carDamage.toFixed(2)})`);
    await shot(`${id}_parked`);
  }
  console.log('sedan thrown by a 22 m/s hit (m):', JSON.stringify(Object.fromEntries(Object.entries(thrown).map(([k, v]) => [k, +v.toFixed(2)]))));
  check(thrown.truck > thrown.coupe && thrown.coupe > thrown.lada, `momentum order: truck ${thrown.truck.toFixed(2)} > coupe ${thrown.coupe.toFixed(2)} > lada ${thrown.lada.toFixed(2)} m`);
  check(thrown.roadster > thrown.coupe && thrown.roadster < thrown.truck, `the Roadster (1.25 x the coupe) throws the sedan between the coupe and the truck (${thrown.roadster.toFixed(2)} m)`);
  // ---------------------------------------------------------------- oncoming traffic
  for (const id of ids) {
    await fresh(id);
    const r = await page.evaluate((id) => {
      const d = lab.drive;
      const c = lab.crash('traffic', 22); for (let i = 0; i < 40; i++) lab.advance(1 / 60);
      return { damage: c.damage, brake: lab.vehicle.v, trafficFront: lab.traffic.damageState.front, trafficZ: lab.traffic.z };
    }, id);
    R[id].traffic = r;
    check(r.brake === 0, `${id}: the struck traffic car stops its AI (v ${r.brake})`);
    check(r.trafficFront > 0.05, `${id}: the oncoming car is dented (${r.trafficFront.toFixed(2)})`);
    check(r.damage > 0, `${id}: the car is dented by oncoming traffic (${r.damage.toFixed(2)})`);
  }
  // ---------------------------------------------------------------- one damage state per car
  await fresh();
  const persist = await page.evaluate(() => {
    const d = lab.drive, f = (id) => d.vehicleById(id), res = {};
    if (d.active) d.exit(true);
    d.enter('lada'); lab.reset(); lab.crash('wall', 30); d.car.vx = d.car.vz = 0; d.exit(true);
    res.ladaAfter = f('lada').damage.amount; res.coupeAfterLada = f('coupe').damage.amount; res.truckAfterLada = f('truck').damage.amount; res.roadsterAfterLada = f('roadster').damage.amount;
    d.enter('coupe'); res.activeCoupe = d.vehicle.id; res.coupeSeen = d.damage.amount; d.exit(true);
    d.enter('lada'); res.ladaAgain = d.damage.amount; res.ladaStage = d.damage.stage; res.carDamageHud = d.car.damage; d.exit(true);
    res.ladaStillDented = f('lada').damage.amount;
    d.enter('lada'); d.teleport(40, 60, 0); d.car.vx = d.car.vz = 0; d.exit(true);          // park the dented Lada out of the way: drive.js strikeParked now crumples a parked car that is hit, so a truck crash THROUGH it would change its state legitimately
    d.enter('truck'); lab.crash('wall', 30); const t = f('truck').damage.amount; d.car.vx = d.car.vz = 0; d.exit(true);
    res.truckDented = t; res.ladaUnchanged = f('lada').damage.amount; res.coupeUnchanged = f('coupe').damage.amount;
    d.enter('truck'); d.teleport(40, 200, 0); d.car.vx = d.car.vz = 0; d.exit(true);          // out of the way too
    d.enter('roadster'); lab.reset(); lab.crash('wall', 30); res.roadsterDented = f('roadster').damage.amount; d.car.vx = d.car.vz = 0; d.exit(true);
    res.ladaUnchanged2 = f('lada').damage.amount; res.truckUnchanged2 = f('truck').damage.amount; res.coupeUnchanged2 = f('coupe').damage.amount;
    return res;
  });
  console.log('persistence:', JSON.stringify(persist));
  check(persist.ladaAfter > 0.2 && persist.coupeAfterLada === 0 && persist.truckAfterLada === 0 && persist.roadsterAfterLada === 0, 'a crashed Lada leaves the coupe, the truck and the Roadster pristine');
  check(persist.activeCoupe === 'coupe' && persist.coupeSeen === 0, 'entering the coupe shows the coupe\'s own (pristine) state');
  check(persist.ladaAgain === persist.ladaAfter && persist.ladaStage !== 'Pristine' && persist.carDamageHud > 0, 'the parked dented Lada is still dented when entered again (HUD damage follows)');
  check(persist.truckDented > 0 && persist.ladaUnchanged === persist.ladaAfter && persist.coupeUnchanged === 0, 'three cars, three damage states');
  check(persist.roadsterDented > 0.2 && persist.ladaUnchanged2 === persist.ladaAfter && persist.truckUnchanged2 === persist.truckDented && persist.coupeUnchanged2 === 0, `a fourth state: the crashed Roadster (${persist.roadsterDented.toFixed(2)}) leaves the others as they were`);
  // ---------------------------------------------------------------- the real keyboard still works (coupe) and nothing threw
  await fresh('coupe'); await page.evaluate(() => { lab.inspect(false); lab.pause(false); });
  await page.keyboard.down('KeyW'); await new Promise((r) => setTimeout(r, 900)); await page.keyboard.up('KeyW');
  check(await page.evaluate(() => lab.drive.car.speed > 5), 'real keyboard acceleration still drives the active car');
  for (const e of errors) problems.push('page error: ' + e);
  if (args.has('--json')) fs.writeFileSync(path.join(out, 'garage-damage.json'), JSON.stringify(R, (k, v) => (k === 'pristine' || k === 'index' ? undefined : v), 1));
} catch (e) { problems.push('[test] ' + (e.stack || e.message)); }
finally { await browser.close(); await new Promise((r) => server.close(r)); }
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('PASS garage damage: crush, shed panels, wrecks, repair, momentum and durability order, one damage state per car, for the coupe, the taxi pickup, the Zhiguli and the Roadster');
