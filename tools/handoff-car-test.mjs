// tools/handoff-car-test.mjs - a CAR crossing an EDGE gate arrives WITH the player in it (docs/AREAS.md 14, 15.z): CPU only, no GPU, no bake.
//   node tools/area.mjs <destination-area> tools/handoff-car-test.mjs        (npm run handoffcar runs the four live areas)
// For the DESTINATION area (AREA) and every edge gate that leads into it (e1..e10), the real flow of the page:
//   origin  the gate machine (core/gates.js createGateMachine, the real territories of REGISTRY) is fed a car that approaches the edge along the streets (and a thin sample of off-road approaches) at several
//           speeds until it triggers; go() builds the hand-off (makeHo with the car's id, view and damage, arrivalUrl) at that pose
//   target  planArrival (the page's own, on the destination's real layout) resolves the pose, ctx.handoff is set, the REAL drive module of the destination is built (tools/lib/headless-world.mjs: real
//           colliders; the real Player; the fleet of that area: four cars at the station, ONE purple Zhiguli in admiralty) and main.js applyHandoffAtStart calls drive.arrive(ho.car, x, z, yaw)
// and asserts that the player is IN THE SAME CAR afterwards (drive.active, drive.vehicle.id), within the placement search of the resolved pose, damage carried, and that the garage of the page is the area's own
// plus (only where the area does not keep that car) the carried one. A pose in water is never a failure.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 8).join('\n     ')); } };
const { ctx, L } = await buildWorld({ log: null });
const ph = ctx.physics, DEG = Math.PI / 180;
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
const A = await import('../src/world/area.js');
const { REGISTRY, GATES } = await import('../src/areas/registry.js');
const { createGateMachine, planArrival, inUnion } = await import('../src/core/gates.js');
const { makeHo, arrivalUrl } = await import('../src/core/handoff.js');

// ---------------------------------------------------------------- the page around the drive module (what main.js does)
const toasts = [];
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast: (t) => toasts.push(String(t)), modalOpen: false };
const dom = { addEventListener() {}, requestPointerLock() {} };
const player = new Player(ctx.camera, dom, ph, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding; player.smoothing = 0;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
const driveMod = await import('../src/world/drive.js');
let d = null, HOME = [];
/** build the drive module of the page as main.js does: ctx.handoff (planArrival's result) is set BEFORE the modules are built; the previous build's boxes and models are retired */
async function buildDrive(handoff) {
  if (d) for (const v of d.vehicles) { if (v.box) { ph.remove(v.box); v.box = null; } v.model.root.removeFromParent(); }
  ctx.handoff = handoff || undefined;
  await driveMod.build(ctx);
  d = ctx.drive; assert.ok(d, `area ${AREA}: no drive service`);
  HOME = d.vehicles.map((v) => ({ v, x: v.parked.x, z: v.parked.z, yaw: v.parked.yaw, y: v.parked.y, box: !!v.box }));
  return d;
}
/** the parked cars of a fresh page: restore the vehicles between scenarios (exit() parks the car where it stopped) */
function resetPage() {
  if (d.active) d.exit(true);
  for (const h of HOME) {
    const v = h.v; if (v.box) { ph.remove(v.box); v.box = null; }
    v.parked.x = h.x; v.parked.z = h.z; v.parked.yaw = h.yaw; v.parked.y = h.y;
    const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw), s = v.spec;
    if (h.box) v.box = ph.addBox(h.x + sy * s.centerZ, h.z + cy * s.centerZ, s.W + 0.08, s.len + 0.08, h.yaw, h.y - 0.03, h.y - 0.03 + s.hgt);
    v.car.reset(h.x, h.z, h.yaw);
    v.damage.repair();
  }
  player.inputLock = 0; player.fly = false;
  player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
}
await buildDrive(null);
const fleetIds = d.fleet.map((f) => f.id), baseline = d.fleet.map((f) => ({ id: f.id, x: f.parked.x, z: f.parked.z, yaw: f.parked.yaw }));
console.log(`area ${AREA}: fleet [${fleetIds.join(', ')}], ${ph.items.length} colliders`);

// ---------------------------------------------------------------- the origin side: where does a car trigger an edge gate?
const rectsOf = (id) => REGISTRY[id].play;
const bbox = (rs) => ({ x0: Math.min(...rs.map((r) => r.x0)), x1: Math.max(...rs.map((r) => r.x1)), z0: Math.min(...rs.map((r) => r.z0)), z1: Math.max(...rs.map((r) => r.z1)) });
const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]].map(([x, z]) => { const n = Math.hypot(x, z); return [x / n, z / n]; });
/** The poses at which a car triggers gate g: for every point (lattice `step`) of FROM's territory near the overlap that lies on a drivable lane of the destination's layout (the overlap carries the same streets),
 *  both directions along the lane (`anywhere`: any point, a pseudo-random octant), speeds `speeds` m/s: the machine (fed the last 3 s of a steady approach) offers the gate at q but did not one step (0.1 s) before. */
function triggers(g, step, speeds, anywhere = false) {
  const out = [], tb = bbox(rectsOf(g.to)), fb = bbox(rectsOf(g.from)), R = rectsOf(g.from);
  const x0 = Math.max(tb.x0, fb.x0) - 300, x1 = Math.min(tb.x1, fb.x1) + 300, z0 = Math.max(tb.z0, fb.z0) - 300, z1 = Math.min(tb.z1, fb.z1) + 300;
  const offered = (x, z, dx, dz, v) => { const m = createGateMachine({ gates: [g], rectsOf }); m.update({ dt: 7, x: x - dx * v * 3, z: z - dz * v * 3, mode: 'car', blocked: false }); let r; for (let t = 0.1; t < 3.0001; t += 0.1) r = m.update({ dt: 0.1, x: x - dx * v * (3 - t), z: z - dz * v * (3 - t), mode: 'car', blocked: false }); return !!r.offer; };
  for (let sx = x0; sx <= x1; sx += step) for (let sz = z0; sz <= z1; sz += step) {
    if (!inUnion(R, sx, sz, 0)) continue;
    const lane = anywhere ? null : L.roadsNear(sx, sz, 0, { drivable: true }).find((q) => q.gap <= 0); if (!anywhere && !lane) continue;
    for (const sgn of [1, -1]) for (const v of speeds) {
      const k = (Math.round(sx / step) * 3 + Math.round(sz / step) * 5 + (sgn > 0 ? 0 : 4) + 800) % 8;
      const dx = anywhere ? DIRS[k][0] : lane.tx * sgn, dz = anywhere ? DIRS[k][1] : lane.tz * sgn;
      if (!inUnion(R, sx - dx * v * 3, sz - dz * v * 3, 0)) continue;      // the approach itself lies in FROM's territory
      if (offered(sx, sz, dx, dz, v) && !offered(sx - dx * v * 0.1, sz - dz * v * 0.1, dx, dz, v)) out.push({ x: sx, z: sz, v, yaw: Math.atan2(-dx, -dz) / DEG, road: !anywhere });
    }
  }
  return out;
}

// ---------------------------------------------------------------- the target side: the page's arrival for that hand-off (planArrival of the page)
function arrival(g, sc, carId, dmg) {
  const ho = makeHo({ from: g.from, to: g.to, via: 'gate', gate: g.id, car: { id: carId, view: 1, d: dmg }, ret: { x: sc.x, z: sc.z, yaw: sc.yaw, pitch: 0 } });
  const url = arrivalUrl({ page: REGISTRY[g.to].page, pose: { x: sc.x, y: null, z: sc.z, yaw: sc.yaw, pitch: 0 }, tod: 1.5, ho, search: '' });
  const h = planArrival({ L, A, params: new URL(url, 'http://localhost/').searchParams });
  assert.ok(h && !h.invalid, 'the hand-off is not valid: ' + (h && h.invalid));
  return h;
}

const edges = GATES.filter((g) => g.kind === 'edge' && g.to === AREA);
check(`area ${AREA}: ${edges.length} edge gate(s) lead into it`, () => assert.ok(edges.length > 0, 'none'));
const CARS = ['coupe', 'truck', 'lada', 'roadster'];
const DAMAGE = [[0, 0, 0, 0], [0.3, 0, 0.1, 0]];
// the trigger poses of each gate: on the streets (where a car drives) and a thin sample of poses anywhere (off-road, in a park: the arrival moves the car along the ring or to the HERO, still in the car)
// A trigger pose needs a lattice point within v * 0.1 m (0.8 / 2.2 / 4 m) of the place where the machine first offers the gate, so the number of poses depends on the lattice, not only on the geometry: on a thin overlap strip (the palace / vasilyevsky
// strip of e11: the Palace Bridge head and the University embankment; 3 poses at step 20, 7 at step 10, 13 at step 5) a coarse lattice misses most triggers that exist. The bar stays MIN_POSES; the lattice is refined (20, 10, 5, 2.5 m) only
// until it is met, so a gate that has enough poses at step 20 is sampled exactly as before.
const MIN_POSES = 6, STEPS = [20, 10, 5, 2.5], STEP_OF = new Map();
function streetPoses(g) { let out = []; for (const step of STEPS) { STEP_OF.set(g, step); out = triggers(g, step, [8, 22, 40]); if (out.length >= MIN_POSES) break; } return out; }
const SC = new Map(edges.map((g) => [g, [...streetPoses(g), ...triggers(g, 60, [8, 40], true).filter((_, i) => i % 5 === 0).slice(0, 14)]]));
let total = 0, bad = 0;
const rows = [];
for (const id of CARS) {
  // a page reached by a car hand-off: ctx.handoff exists when the modules are built (main.js), the carried car is in the garage afterwards
  const g0 = edges[0], sc0 = SC.get(g0)[0];
  await buildDrive(arrival(g0, sc0, id, [0, 0, 0, 0]));
  const carriedNew = !fleetIds.includes(id);
  check(`${id}: the page built for a car hand-off has ${carriedNew ? 'the fleet of the area plus the carried car, once, without a parked box' : 'the fleet of the area, unchanged'}`, () => {
    assert.deepEqual(d.fleet.map((f) => f.id).sort(), (carriedNew ? [...fleetIds, id] : fleetIds).slice().sort());
    for (const b of baseline) { const f = d.fleet.find((q) => q.id === b.id); assert.ok(f && f.parked.x === b.x && f.parked.z === b.z && f.parked.yaw === b.yaw, `${b.id} moved from its parking`); }
    if (carriedNew) { const f = d.vehicleById(id); assert.ok(f.def.carried && !f.box, 'the carried car must have no parked box'); }
    assert.equal(d.fleet.filter((f) => f.def.carried).length, carriedNew ? 1 : 0);
  });
  for (const g of edges) {
    const stat = { direct: 0, ring: 0, hero: 0, n: 0, fail: 0, maxPlaced: 0 }; let firstFail = null;
    SC.get(g).forEach((sc, i) => {
      const dmg = DAMAGE[i % 2];
      resetPage(); toasts.length = 0;
      const h = arrival(g, sc, id, dmg);
      assert.equal(h.mode, 'car');
      const ok = d.arrive(h.ho.car, h.pose.x, h.pose.z, h.pose.yaw), v = d.vehicle;      // main.js applyHandoffAtStart
      stat.n++; total++; stat[h.how]++;
      const inCar = ok && d.active && v.id === id && !player.fly;
      const off = inCar ? Math.hypot(d.car.x - h.pose.x, d.car.z - h.pose.z) : -1;
      if (inCar) stat.maxPlaced = Math.max(stat.maxPlaced, off);
      const dmgOk = !inCar || dmg.every((q, j) => Math.abs(d.damage.state[['front', 'rear', 'left', 'right'][j]] - q) < 0.002);
      const placedOk = !inCar || off <= 40.5;      // (placeVehicle searches up to 40 m for a free spot)
      if (!inCar || !dmgOk || !placedOk) { stat.fail++; bad++; if (!firstFail) firstFail = `${id} at (${sc.x.toFixed(0)}, ${sc.z.toFixed(0)}) yaw ${sc.yaw.toFixed(0)} v ${sc.v}: ok=${ok} active=${d.active} vehicle=${v.id} how=${h.how} dmgOk=${dmgOk} placedOk=${placedOk}`; }
    });
    rows.push(`  ${id.padEnd(8)} ${g.id} ${g.from} -> ${g.to}: ${stat.n} arrivals (${SC.get(g).filter((q) => q.road).length} street poses, lattice ${STEP_OF.get(g)} m): ${stat.direct} direct, ${stat.ring} ring, ${stat.hero} hero; farthest car placement ${stat.maxPlaced.toFixed(0)} m; ${stat.fail} without the car`);
    check(`${id} ${g.id} ${g.from} -> ${g.to}: the player is IN the ${id} after the arrival (${stat.n} trigger poses, damage carried)`, () => { assert.ok(stat.n >= MIN_POSES, 'only ' + stat.n + ' poses (lattice step ' + STEP_OF.get(g) + ')'); assert.equal(stat.fail, 0, `${stat.fail} arrivals without the car; first: ${firstFail}`); });
  }
}
console.log(rows.join('\n'));
resetPage();

// ---------------------------------------------------------------- the page without a hand-off, and a car that does not exist
await buildDrive(null);
check('a hand-off whose car does not exist leaves the player on foot, in no car (main.js shows the toast)', () => {
  resetPage();
  const ok = d.arrive({ id: 'no-such-car', view: 0, d: [0, 0, 0, 0] }, 0, 0, 0);
  assert.equal(ok, false); assert.equal(d.active, false);
});
check('a page WITHOUT a hand-off keeps exactly the fleet of its garage (the four cars stand only at the station, admiralty has one Zhiguli)', () => {
  assert.deepEqual(d.fleet.map((f) => f.id), fleetIds); assert.ok(d.fleet.every((f) => !f.def.carried && f.box));
});
resetPage();
console.log(`handoff-car-test ${AREA}: ${total} arrivals, ${bad} without the car`);
console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`);
process.exit(fails ? 1 : 0);
