// tools/wildlife-boat-test.mjs - the WATER BIRDS FLY AWAY from a vehicle that comes at them (wildlife/threat.js, ducks.js flush, birds.js gulls), CPU only, no GPU, no bake:
//   node tools/area.mjs palace tools/wildlife-boat-test.mjs [--quick]            npm run wildlifeboat
// It builds the REAL modules of the area headlessly (tools/lib/headless-world.mjs: environment, bridges, the landmark modules, the baked city, wildlife), then the REAL drive module (cars + the motor
// boat) with a real Player (the setup of tools/boat-test.mjs) and drives the boat at the birds with the real water, steps every update of the page but the drive's own.
//   1  the threat geometry (threat.js): a hull 17 m/s coming straight at a bird scares it from 55 m, not from 75 m; a boat passing 30 m off, a drifting one 30 m away and one running away do not; a drifting
//      one 8 m off does; a car is the same code with a shorter look-ahead
//   2  ducks, a slow boat far away and the walker: nothing happens (the walker never scared the ducks and still does not; no flush is counted)
//   3  ducks, the boat at speed straight at a group: the group takes off while the hull is still far away (> 25 m), every member is in the air before the hull is 12 m off, nobody is under the hull,
//      the flight crosses no building, is not frozen (it ends), the group lands on water; the boat idling next to the place the group left keeps it away; once the boat is gone the state machine
//      flies the group home to the lane it left (the same lane, in the water)
//   4  the gulls on a moored boat's roof: the boat at speed flushes them from far, a gull on a quay post the same
//   5  a car (a faked drive state with the car shape of ctx.drive.car) flushes the ducks the same way; a walker (no drive) and the pigeon flocks are not touched by any of this
// A pose in water is never a failure; a wall of water is.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const QUICK = process.argv.includes('--quick');
const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 6).join('\n     ')); } };
const t0 = Date.now();
const { ctx, L, THREE, built, errors } = await buildWorld({ skip: ['traffic', 'people', 'metro', 'drive'], log: null });
console.log(`area ${AREA}: built ${built.length} modules in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${ctx.physics.items.length} colliders${errors.length ? '; build errors: ' + errors.join(' | ') : ''}`);
const ph = ctx.physics, svc = ctx.services.wildlife;
assert.ok(svc && svc.debug && svc.debug.ducks, 'the area has no wildlife / no ducks');
const D = svc.debug.ducks, B = svc.debug.birds, W = svc.debug.world, threat = svc.debug.threat;

// ---------------------------------------------------------------- the page around the drive module (what main.js does)
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const dom = { addEventListener() {}, requestPointerLock() {} };
const player = new Player(ctx.camera, dom, ph, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding; player.smoothing = 0;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
const upd = ctx._updates.slice();                       // every update of the page up to the drive module: wildlife among them (the drive module's own update steps the car from the keys: not wanted)
const driveMod = await import('../src/world/drive.js');
await driveMod.build(ctx);
const d = ctx.drive;
const boat = d && d.boats && d.boats[0];
if (!boat) { console.log(`area ${AREA}: no boat in the territory: nothing to drive (the water birds need the palace area)`); process.exit(0); }
const water = (x, z) => ph.waterLevel(x, z);
const angDiff = (a, b) => { let x = a - b; x -= Math.PI * 2 * Math.round(x / (Math.PI * 2)); return x; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- the frame loop
const DT = 1 / 30;
let t = 10;
/** one page frame: the car physics (when a vehicle is driven), the player position (main.js stepUpdates), every update of the page */
function frame(inp) {
  if (d.active) d.sim(DT, inp || {});
  ctx.player.position.copy(player.pos);
  ctx.time = t; ctx.shared.uTime.value = t;
  for (const f of upd) f(DT, t);
  t += DT;
}
function run(sec, fn, inp) { const n = Math.round(sec / DT); for (let i = 0; i < n; i++) { frame(typeof inp === 'function' ? inp(i) : inp); if (fn && fn(i) === false) return i; } return n; }
const walkTo = (x, z) => { if (d.active) d.exit(true); player.inputLock = 0; player.setPose(x, z, 0, 0); ctx.player.position.copy(player.pos); };
/** the walker far away from everything, the world settled (the animals follow the player: put him by the group we test so that the director does not move it) */
// the instance matrices: where a duck is drawn
const meshOf = {}; for (const m of D.group.children) meshOf[m.name] = m;
const _m = new THREE.Matrix4(), _v = new THREE.Vector3();
const drawn = (q) => { meshOf['wl-' + q.model + '-body'].getMatrixAt(q.slot, _m); _v.setFromMatrixPosition(_m); return { x: _v.x, y: _v.y, z: _v.z }; };
const waterOfLane = (lane) => lane.y ?? (L.WATERWAYS[lane.key]?.water ?? L.RIVER_Y.water);
const centre = (g) => { const p = D.groupPose(g, t); return { x: p.x, z: p.z }; };
const adults = (g) => g.members.filter((q) => !q.duck);
const airborne = (g, min = 0.3) => g.members.filter((q) => !q.duck).every((q) => drawn(q).y > waterOfLane(g.lane) + min);

// ---------------------------------------------------------------- 1 the threat geometry (no world needed: a faked drive state)
check('1 threat geometry: heading, speed, distance (boat 17 m/s, boat drifting, car)', () => {
  assert.ok(threat && typeof threat.scares === 'function', 'wildlife publishes no threat (svc.debug.threat)');
  const real = ctx.drive;
  const boatAt = (vx, vz) => ({ active: true, car: { x: 0, z: 0, y: 0, vx, vz, floats: true }, vehicle: { kind: 'boat', spec: { front: 3 } } });
  const carAt = (vx, vz) => ({ active: true, car: { x: 0, z: 0, y: 0, vx, vz }, vehicle: { kind: 'car', spec: { front: 2.3 } } });
  const sc = (x, z, near = 7) => threat.scares(x, z, 0, near);
  try {
    ctx.drive = boatAt(0, 17); threat.update();                                 // heading +z (south) at 17 m/s
    assert.ok(threat.active && threat.kind === 'boat');
    assert.ok(sc(0, 55), 'a bird 55 m dead ahead of a boat at 17 m/s');
    assert.ok(!sc(0, 75), 'a bird 75 m ahead is not scared yet');
    assert.ok(!sc(30, 30), 'a bird 30 m abeam of a boat that passes (30 m off, 30 m ahead)');
    assert.ok(!sc(30, 0) && !sc(-30, 0), 'a bird 30 m to the side');
    assert.ok(!sc(0, -25), 'a bird 25 m BEHIND the boat is not scared (it runs away from it)');
    assert.ok(sc(5, 25), 'a bird 5 m off the line 25 m ahead is scared');
    assert.ok(sc(0, -10), 'a bird 10 m behind is inside the near ring at that speed');
    ctx.drive = boatAt(0, 3); threat.update();
    assert.ok(!sc(0, 30), 'a boat drifting at 3 m/s does not scare a bird 30 m ahead');
    assert.ok(sc(0, 18), 'but a bird 18 m ahead of it');
    ctx.drive = boatAt(0, 0.3); threat.update();
    assert.ok(sc(8, 0) && !sc(14, 0), 'a boat lying still scares a bird 8 m off, not 14 m');
    ctx.drive = carAt(0, 15); threat.update();
    assert.ok(threat.kind === 'car' && sc(0, 30), 'a car 15 m/s at a bird 30 m ahead');
    assert.ok(!sc(14, 30), 'a car passing 14 m abeam does not (the look-ahead is short and narrow)');
    ctx.drive = { active: false, car: null }; threat.update();
    assert.ok(!threat.active && !sc(0, 1), 'no vehicle driven: nothing scares');
  } finally { ctx.drive = real; threat.update(); }
});

// ---------------------------------------------------------------- the scenarios
/** a collider that stands in the water at (x, z) and reaches above the surface (a pier pile, a moored hull, an abutment): the boat would hit it */
function solidInWater(x, z) {
  const wl = water(x, z); if (wl === null) return false;
  for (const it of ph.querySolids(x, z, 2.6)) { const hi = it.type === 'walk' ? it.top : it.type === 'ramp' ? Math.max(it.yA, it.yB) : it.y1; if (hi > wl + 0.1 && it.y0 < wl + 1.0) return true; }
  return false;
}
/** a start point 55-90 m off `target`, with water under the whole straight line to a stop point `stop` metres short of it (and 1.6 m to each side); null when no direction works */
function approach(target, stop = 8) {
  for (const R of [80, 70, 60, 90, 55]) for (let k = 0; k < 36; k++) {
    const a = k * Math.PI / 18 + 0.1, sx = target.x + Math.cos(a) * R, sz = target.z + Math.sin(a) * R, yaw = Math.atan2(target.x - sx, target.z - sz);
    let good = true;
    for (let s = 0; s <= R - stop && good; s += 1.5) for (const o of [-1.6, 0, 1.6]) { const x = sx + Math.sin(yaw) * s + Math.cos(yaw) * o, z = sz + Math.cos(yaw) * s - Math.sin(yaw) * o; if (water(x, z) === null || !L.inPlay(x, z, 4) || L.insideBuilding(x, z, 0.5) || solidInWater(x, z)) { good = false; break; } }
    if (good) return { x: sx, z: sz, yaw, R };
  }
  return null;
}
/** the boat at (x, z) heading yaw at speed v m/s (m/s of the hand-off: car.vx / vz), the walker's body following */
function boatTo(x, z, yaw, v) {
  if (!d.active) { walkTo(x, z); d.enter('boat'); }
  d.teleport(x, z, yaw); d.car.vx = Math.sin(yaw) * v; d.car.vz = Math.cos(yaw) * v;
  d.sim(0.02, { thr: 0 }); ctx.player.position.copy(player.pos);
}
/** a pilot that aims at (tx(), tz()) and holds the throttle */
const pilot = (tx, tz, thr = 1) => () => { const c = d.car, want = Math.atan2(tx() - c.x, tz() - c.z); return { thr, steer: clamp(angDiff(want, c.yaw) * 2.2, -1, 1) }; };
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const hullGap = (p) => Math.max(0, dist2({ x: d.car.x, z: d.car.z }, p) - 3);
const settleAt = (g) => { const c = centre(g); walkTo(c.x + 60, c.z + 60); run(1); };      // the player stands where the animals stay and the director has nothing to move

const groups = D.groups.slice();
assert.ok(groups.length >= 3, 'fewer than 3 duck groups');
// the groups with a clear run at them
const plan = [];
for (const g of groups) { const c = centre(g), a = approach(c, 10); if (a) plan.push({ g, a, c }); }
console.log(`     ${groups.length} duck groups, ${plan.length} with a clear water run (${plan.map((p) => p.g.kind + '@' + p.g.lane.key + ' ' + p.a.R + ' m').join(', ')})`);
assert.ok(plan.length >= 2, 'fewer than 2 duck groups can be approached by boat: ' + groups.map((g) => g.kind + '@' + g.lane.key).join(','));

// ---------------------------------------------------------------- 2 nothing happens: a slow boat far away, the walker
{
  const { g, c } = plan[0];
  check('2 the walker stands 2 m from the ducks (in the canal) for 8 s: no flush, they keep swimming', () => {
    const f0 = D.flushes, c0 = centre(g);
    walkTo(c0.x + 2, c0.z); run(8);
    assert.equal(D.flushes, f0, 'a flush by a walker');
    assert.equal(g.st, 'swim');
    for (const q of adults(g)) assert.ok(drawn(q).y < waterOfLane(g.lane) + 0.1, 'a duck is in the air');
  });
  check('2 a boat drifting at 3 m/s straight at the group from 36 m for 3.5 s (it ends 26 m off): the group does not take off', () => {
    settleAt(g);
    const a = approach(centre(g), 20); assert.ok(a, 'no run');
    boatTo(a.x + Math.sin(a.yaw) * (a.R - 36), a.z + Math.cos(a.yaw) * (a.R - 36), a.yaw, 3);
    let flew = false;
    run(3.5, () => { if (g.st === 'fly') flew = true; }, () => ({ thr: 0.05 }));
    console.log(`     the boat does ${threat.speed.toFixed(1)} m/s, the hull ends ${hullGap(centre(g)).toFixed(0)} m off`);
    assert.ok(threat.active && threat.speed > 1.5 && threat.speed < 4.5, `the boat does ${threat.speed.toFixed(1)} m/s`);
    assert.ok(hullGap(centre(g)) > 20, `the hull is ${hullGap(centre(g)).toFixed(0)} m off`);
    assert.ok(!flew && g.st === 'swim', 'flushed by a boat 20+ m away at 3 m/s (state ' + g.st + ')');
    d.exit(true);
  });
}

// ---------------------------------------------------------------- 3 the boat at speed straight at a group
const homeOf = {};
const runs = [plan.find((p) => p.g.kind === 'family'), plan.find((p) => p.g.kind !== 'family')].filter(Boolean);
for (let pi = 0; pi < runs.length; pi++) {
  const { g } = runs[pi];
  const tag = `3 [${g.kind} on the ${g.lane.key}]`;
  settleAt(g); d.active && d.exit(true);
  const home = { lane: g.lane, c: centre(g) }; homeOf[pi] = home;
  const a = approach(home.c, 10);
  boatTo(a.x, a.z, a.yaw, 14);
  const rec = { flushT: -1, dFlush: 0, dAir: -1, minHull: 99, swimUnder: 0, inBuilding: 0, maxY: 0, duckMaxY: 0, frozen: false, nanY: 0, fl: null };
  const wl = waterOfLane(g.lane);
  const nFlush0 = D.flushes;
  run(14, () => {
    const gc = centre(g), gap = hullGap(gc);
    if (g.st === 'fly' && rec.flushT < 0) { rec.flushT = t; rec.dFlush = gap; rec.fl = g.fl; }
    for (const q of g.members) { const p = drawn(q); if (!Number.isFinite(p.x + p.y + p.z)) rec.nanY++; if (g.st === 'fly') { if (q.duck) rec.duckMaxY = Math.max(rec.duckMaxY, p.y - wl); else rec.maxY = Math.max(rec.maxY, p.y - wl); if (L.insideBuilding(p.x, p.z, 0)) rec.inBuilding++; } else if (p.y < wl + 0.15 && !q.duck) rec.minHull = Math.min(rec.minHull, dist2(p, d.car) - 3); }
    if (rec.dAir < 0 && airborne(g)) rec.dAir = gap;
    if (rec.flushT > 0 && g.st === 'fly' && t - rec.flushT > rec.fl.dur + 1.5) rec.frozen = true;
    return rec.flushT > 0 && t - rec.flushT > 6 ? false : true;                // six seconds after the take-off the run is over
  }, pilot(() => home.c.x, () => home.c.z));
  check(`${tag} the group takes off while the hull is still far away (> 25 m) and every duck is in the air before the hull is 12 m off`, () => {
    assert.ok(rec.flushT > 0, 'the group never took off (state ' + g.st + ')');
    assert.ok(rec.dFlush > 25, `took off with the hull ${rec.dFlush.toFixed(1)} m off`);
    assert.ok(rec.dAir > 12, `all in the air only at ${rec.dAir.toFixed(1)} m`);
    assert.ok(D.flushes > nFlush0, 'no flush counted');
    console.log(`     ${g.kind}: took off with the hull ${rec.dFlush.toFixed(0)} m off, all in the air at ${rec.dAir.toFixed(0)} m, flight ${rec.fl.dur.toFixed(1)} s`);
  });
  check(`${tag} nobody swims under the hull, no NaN, the flight crosses no building and stays under 6 m`, () => {
    assert.equal(rec.nanY, 0); assert.ok(rec.minHull > 1.0, `a duck on the water ${rec.minHull.toFixed(1)} m from the hull`);
    assert.equal(rec.inBuilding, 0, 'a duck flew through a building'); assert.ok(rec.maxY < 6 && rec.maxY > 0.5, `flight height ${rec.maxY.toFixed(1)} m`); assert.ok(!rec.frozen, 'a duck hangs in the air');
    if (g.kind === 'family') assert.ok(rec.duckMaxY < 0.4, `a duckling flew ${rec.duckMaxY.toFixed(2)} m high`);
  });
  // keep the boat lying near the place the group left: it must not come home into the boat's face
  run(1, null, { brk: 1 });
  if (!g.home) { check(`${tag} the group remembers the place it left`, () => assert.fail('no home place (the group did not flush)')); d.active && d.exit(true); continue; }
  const hl = g.home.lane, hi = clamp(Math.round(g.home.u / 2.5), 1, hl.n - 2), hp = { x: hl.xs[hi], z: hl.zs[hi] }, hn = { x: -hl.tz[hi], z: hl.tx[hi] };      // the place the group left (the lane point) and the water side of it
  boatTo(hp.x + hn.x * 4, hp.z + hn.z * 4, Math.atan2(hl.tx[hi], hl.tz[hi]), 0);      // the boat lies 4 m from it, nose along the lane: the ducks must not come home into it
  assert.ok(water(d.car.x, d.car.z) !== null, 'the boat was set on dry ground');
  const away = { st: [] };
  run(32, () => { away.st.push(g.st); });
  check(`${tag} lands on water and stays AWAY while the boat lies 4 m from its old place (does not come home into it)`, () => {
    assert.ok(!away.st.includes('fly') || away.st.indexOf('fly') < 90, 'still flying after 3 s');
    assert.equal(g.st, 'away', 'state ' + g.st);
    assert.ok(g.home && g.home.lane === home.lane, 'the home place is remembered'); assert.ok(dist2(centre(g), d.car) > 10, 'the group swims ' + dist2(centre(g), d.car).toFixed(0) + ' m from the boat');
    for (const q of adults(g)) { const p = drawn(q); assert.ok(water(p.x, p.z) !== null, 'a duck on dry ground at ' + p.x.toFixed(0) + ',' + p.z.toFixed(0)); assert.ok(Math.abs(p.y - waterOfLane(g.lane)) < 0.15, 'not on the water'); }
  });
  // the boat leaves (the player gets out far away): the group flies home
  walkTo(hp.x + 100, hp.z + 100);
  const back = { t0: t, flew: false, at: -1 };
  run(70, () => { if (g.st === 'fly') back.flew = true; if (g.st === 'swim' && back.at < 0) { back.at = t - back.t0; return false; } });
  check(`${tag} the boat is gone: the group flies back to the lane it left (state machine away -> fly -> swim)`, () => {
    assert.ok(back.flew, 'it never flew home'); assert.equal(g.st, 'swim'); assert.equal(g.lane, home.lane, 'a different lane');
    assert.ok(back.at > 0 && back.at < 60, `home after ${back.at.toFixed(1)} s`); console.log(`     ${g.kind}: home on its own lane ${back.at.toFixed(0)} s after the boat left`);
    assert.equal(g.home, null);
    for (const q of g.members) { const p = drawn(q); assert.ok(Number.isFinite(p.x) && water(p.x, p.z) !== null, 'a duck on dry ground'); }
    const gp = centre(g); let near = 1e9; for (let i = 0; i < g.lane.n; i++) near = Math.min(near, Math.hypot(g.lane.xs[i] - gp.x, g.lane.zs[i] - gp.z)); assert.ok(near < 3, `${near.toFixed(1)} m off the lane`);
  });
}

// ---------------------------------------------------------------- 4 the gulls: a moored boat's roof and a quay post
{
  const moored = B.boatList.filter((b) => !b.moving);
  const spots = [];
  for (const bt of moored) { const a = bt.at(0), ap = approach(a, 12); if (ap) spots.push({ bt, a, ap }); }
  console.log(`     ${moored.length} moored boats, ${spots.length} with a clear water run`);
  check('4 a gull on the roof of a moored boat takes off when the boat comes at it at speed, from further than before (> 20 m)', () => {
    assert.ok(spots.length, 'no moored boat can be approached');
    const { bt, a, ap } = spots[0], bi = B.boatList.indexOf(bt);
    const gull = B.birds.find((b) => b.sp === 'gull' && !b.dead && b.mode === 'boat');
    assert.ok(gull, 'no boat gull');
    walkTo(a.x + 60, a.z + 60); run(1);
    if (gull.st === 'boat') B.leaveBoat(gull);
    let slot = 0; while (B.boatTaken.has(bi * 16 + slot) && slot < bt.n - 1) slot++;
    B.takeBoat(gull, bi, slot); run(0.2);
    assert.equal(gull.st, 'boat');
    boatTo(ap.x, ap.z, ap.yaw, 12);
    let dAt = -1; run(10, () => { if (gull.st !== 'boat') { dAt = dist2(d.car, gull) - 3; return false; } }, pilot(() => a.x, () => a.z));
    d.exit(true);
    console.log(`     boat-roof gull left with the hull ${dAt.toFixed(1)} m off`);
    assert.ok(dAt > 20, `the gull left only when the hull was ${dAt.toFixed(1)} m off (state ${gull.st})`);
    assert.ok(gull.st === 'fly' || gull.st === 'perch' || gull.st === 'soar', 'state ' + gull.st);
  });
  check('4 a gull on a quay post by the water takes off from a boat coming at speed (> 20 m)', () => {
    let pick = null;
    for (const gl of B.birds) { if (gl.sp !== 'gull' || gl.dead || gl.st !== 'perch' || !gl.perch || gl.perch.kind !== 'post') continue; const ap = approach(gl, 10); if (ap) { pick = { gl, ap }; break; } }
    if (!pick) {      // put a gull on a post near a water run
      for (const p of W.perches) { if (p.kind !== 'post' || p.occ || p.dead) continue; const ap = approach(p, 10); if (ap) { const gl = B.birds.find((b) => b.sp === 'gull' && !b.dead && b.st !== 'boat' && b.mode === 'post'); if (gl) { walkTo(p.x + 70, p.z + 70); B.setPerch(gl, p, t); pick = { gl, ap }; break; } } }
    }
    assert.ok(pick, 'no post gull within reach of a water run');
    const { gl, ap } = pick; walkTo(gl.x + 70, gl.z + 70); run(0.5);
    gl.until = t + 1e3; gl.nextCall = t + 1e3;      // (it sits on its post until the boat comes: no change of post of its own)
    boatTo(ap.x, ap.z, ap.yaw, 12);
    let dAt = -1; run(10, () => { if (gl.st !== 'perch') { dAt = dist2(d.car, gl) - 3; return false; } }, pilot(() => gl.x, () => gl.z));
    d.exit(true);
    console.log(`     post gull left with the hull ${dAt.toFixed(1)} m off`);
    assert.ok(dAt > 20, `the gull left only when the hull was ${dAt.toFixed(1)} m off (state ${gl.st})`);
  });
}

// ---------------------------------------------------------------- 5 a car (faked drive state of the car shape), the pigeons
{
  const { g } = plan[plan.length - 1];
  check('5 a car driven at 15 m/s straight at a duck group flushes it the same way; a walker beside it does not', () => {
    settleAt(g); if (g.st !== 'swim') { run(60, () => g.st !== 'swim' && g.st !== 'fly' ? undefined : (g.st === 'swim' ? false : undefined)); }
    assert.equal(g.st, 'swim', 'the group is not at rest (' + g.st + ')');
    const real = ctx.drive, c0 = centre(g), a = approach(c0, 10) || plan[plan.length - 1].a;
    const car = { x: a.x, y: waterOfLane(g.lane), z: a.z, vx: Math.sin(a.yaw) * 15, vz: Math.cos(a.yaw) * 15 };
    ctx.drive = { active: true, car, vehicle: { kind: 'car', spec: { front: 2.3 } } };
    const f0 = D.flushes; let dAt = -1;
    try { run(8, () => { car.x += car.vx * DT; car.z += car.vz * DT; if (g.st === 'fly' && dAt < 0) { dAt = Math.hypot(car.x - c0.x, car.z - c0.z); return false; } }); } finally { ctx.drive = real; }
    assert.equal(D.flushes, f0 + 1, 'no flush'); assert.ok(dAt > 12, `took off with the car ${dAt.toFixed(1)} m off`);
    ctx.drive = real;
  });
  check('5 the pigeon flocks keep their numbers: a vehicle does not change the walker scare of the flocks (flock scare radius and states are those of birds.js)', () => {
    const f = svc.flocks.find((x) => x.sp === 'pigeon' && x.state === 'rest');
    assert.ok(f, 'no resting pigeon flock'); assert.equal(f.scare, 4.5);
    walkTo(f.site.x + 30, f.site.z + 30); run(1);
    assert.equal(f.state, 'rest');
    walkTo(f.site.x + 2, f.site.z + 2); run(2);
    assert.equal(f.state, 'away', 'a walker 3 m from the flock must lift it (' + f.state + ')');
  });
}

console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`);
process.exit(fails ? 1 : 0);
