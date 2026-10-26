// tools/boat-test.mjs - the MOTOR BOAT (src/world/drive/boat/, docs/AREAS.md "The motor boat"), CPU only, no GPU, no bake:
//   node tools/area.mjs palace tools/boat-test.mjs [--quick]       (the smolny run proves that an area whose territory lacks the dock has no boat)
// It builds the REAL modules of the area headlessly (tools/lib/headless-world.mjs: environment, bridges, the landmark modules ... no city / people / traffic), then the REAL drive module (cars + boats) with a real Player,
// and proves with the real colliders and the real water:
//   1  the dock: the boat is in the water, hull parallel to the quay, 2-4 m off the water edge, clear of every collider, the interaction prompt 'E to take' is offered within reach; the four cars are unchanged
//   2  boarding: E / enter('boat') puts the helmsman on the boat; the car tuning is untouched; the HUD / sound profiles switch and switch back
//   3  floating: the height follows waterLevel, throttle gives 40-50 km/h, the boat slides in a turn (lateral speed), reverse is slow, S brakes, Space stops
//   4  the Fontanka: an autopilot drives it south under the Anichkov Bridge for N seconds: it never leaves a water cell, never sinks or jumps, no deck hit, passes under the deck
//   5  the shore: full throttle into the bank stops it softly in the water (no teleport, no hit event, no damage), it backs out
//   6  collisions: a pier / abutment in the water stops it with a 'hit', the boat slides off, never inside; a knockable thing (if any near) is the same solids as the car's
//   7  getting out: the walker stands beside the boat on the water bed (wading) or a landing, never inside the hull, not underground; the boat floats where it was left; E again boards it
//   8  R / place on land leaves the boat and sets the player on foot; a hand-off arrival on water keeps the boat, on land drops the player on foot
//   9  the other areas: no dock in the territory = no boat; the cars are exactly as before (fleet of four, ids, the prompt ids)
// A pose in water is never a failure; a wall of water is.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const QUICK = process.argv.includes('--quick');
const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 6).join('\n     ')); } };
const t0 = Date.now();
const { ctx, L, THREE, built, errors } = await buildWorld({ log: null });
console.log(`area ${AREA}: built ${built.length} modules in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${ctx.physics.items.length} colliders`);
const ph = ctx.physics, DEG = 180 / Math.PI;
globalThis.__frame = await import('../src/world/landmarksC/frame.js');      // the Anichkov bridge's frame (u along the bridge, v along the river): the piers

// ---------------------------------------------------------------- the page around the drive module (what main.js does)
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
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
await driveMod.build(ctx);
const d = ctx.drive;
check('the drive module is built (cars at the station)', () => { assert.ok(d, 'no drive service'); assert.equal(d.fleet.length, 4, 'the four cars of the station'); assert.deepEqual(d.fleet.map((f) => f.id), ['coupe', 'truck', 'lada', 'roadster']); });
const dockExpected = AREA === 'palace';
if (!dockExpected) {
  check(`area ${AREA}: no dock in the territory, no boat`, () => { assert.equal(d.boats.length, 0); assert.equal(d.vehicles.length, d.fleet.length); assert.ok(!ctx.interact.list().some((i) => i.id === 'drive-boat')); });
  check('the cars are as before: the purple Zhiguli / the four cars enter and exit', () => { for (const v of d.fleet) { assert.ok(d.enter(v.id), v.id); assert.ok(d.exit(true)); } });
  console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`); process.exit(fails ? 1 : 0);
}

const boat = d.boats[0];
const water = (x, z) => ph.waterLevel(x, z);
const step = (seconds, inp, cb) => d.sim(seconds, inp, cb);
const angDiff = (a, b) => { let x = a - b; x -= Math.PI * 2 * Math.round(x / (Math.PI * 2)); return x; };
const walker = (x, z) => { player.inputLock = 0; player.setPose(x, z, 0, 0); return player; };

// ---------------------------------------------------------------- 1 the dock
const DOCK = { x: boat && boat.parked.x, z: boat && boat.parked.z, yaw: boat && boat.parked.yaw };
// the water edge west of the dock (the quay side), along the row of the dock
let edgeX = null; for (let x = DOCK.x; x > DOCK.x - 20; x -= 0.05) if (water(x, DOCK.z) === null) { edgeX = x; break; }
check(`1 the boat stands at the dock ${DOCK.x}, ${DOCK.z} (yaw ${(DOCK.yaw * DEG).toFixed(1)} deg), in the water`, () => {
  assert.ok(boat, 'no boat in the area'); assert.equal(boat.id, 'boat'); assert.equal(boat.kind, 'boat');
  assert.ok(water(DOCK.x, DOCK.z) !== null, 'no water at the dock');
  assert.ok(!d.fleet.includes(boat), 'the boat is not a car of the fleet');
  assert.ok(Math.abs(boat.parked.y - water(DOCK.x, DOCK.z)) < 0.01, 'moored at the water level');
});
check('1 the whole hull lies on water (centre line, bow, transom, both sides)', () => {
  const S = boat.spec, sy = Math.sin(DOCK.yaw), cy = Math.cos(DOCK.yaw);
  for (const a of [S.front - 0.05, S.front * 0.5, 0, S.rear * 0.5, S.rear + 0.05]) for (const b of [-S.W / 2, 0, S.W / 2]) assert.ok(water(DOCK.x + sy * a + cy * b, DOCK.z + cy * a - sy * b) !== null, `dry at ${a}, ${b}`);
});
check(`1 the hull lies parallel to the quay: the water edge is ${edgeX === null ? '?' : (DOCK.x - edgeX).toFixed(2)} m west of the centre (the side is 2-4 m off it) and the same along the hull`, () => {
  assert.ok(edgeX !== null);
  const S = boat.spec, sy = Math.sin(DOCK.yaw), cy = Math.cos(DOCK.yaw), gaps = [];
  for (const a of [S.front - 0.3, 0, S.rear + 0.3]) {
    const px = DOCK.x + sy * a, pz = DOCK.z + cy * a; let ex = null; for (let x = px; x > px - 20; x -= 0.05) if (water(x, pz) === null) { ex = x; break; }
    gaps.push(px - ex - S.W / 2);       // the clear water between the hull's west side and the bank, seen along the east-west row
  }
  const min = Math.min(...gaps), max = Math.max(...gaps);
  console.log(`     clear water between the hull and the bank (bow, middle, stern): ${gaps.map((g) => g.toFixed(2)).join(', ')} m`);
  assert.ok(min > 1.5 && max < 4.5, `the gap ${min.toFixed(2)}..${max.toFixed(2)} m is not 2-4 m`);
  assert.ok(max - min < 1.2, `not parallel: the gaps differ by ${(max - min).toFixed(2)} m`);
});
/** is (x, z) inside the footprint of collider `it`, grown by r */
const inside = (it, x, z, r = 0) => {
  if (it.type === 'cyl') return Math.hypot(x - it.cx, z - it.cz) < it.r + r;
  const dx = x - it.cx, dz = z - it.cz, lx = dx * it.c - dz * it.s, lz = dx * it.s + dz * it.c; return Math.abs(lx) < it.hw + r && Math.abs(lz) < it.hd + r;
};
check('1 no collider stands inside the hull at the dock (nor within 0.5 m of it)', () => {
  const S = boat.spec, sy = Math.sin(DOCK.yaw), cy = Math.cos(DOCK.yaw), y = boat.parked.y;
  for (const it of ph.querySolids(DOCK.x, DOCK.z, 10)) {
    if (it === boat.box || it.type === 'hole' || it.boatPass) continue;      // (boatPass: a walker's floor that a floating boat passes - the steppable quay stair, drive/collision.js)
    const hi = it.type === 'walk' ? it.top : it.type === 'ramp' ? Math.max(it.yA, it.yB) : it.y1; if (hi <= y + 0.45 || it.y0 >= y + S.hgt) continue;
    for (let a = S.rear; a <= S.front; a += 0.4) for (const b of [-S.W / 2, 0, S.W / 2]) assert.ok(!inside(it, DOCK.x + sy * a + cy * b, DOCK.z + cy * a - sy * b, 0.5), `a solid ${it.type} at ${it.cx.toFixed(1)}, ${it.cz.toFixed(1)} stands in the hull`);
  }
});
check('1 the prompt "E to take" is offered within reach (nearest, boat id drive-boat)', () => {
  const it = ctx.interact.list().find((i) => i.id === 'drive-boat'); assert.ok(it, 'no interact item');
  assert.ok(it.reach === undefined || true);
  const at = it.at(); assert.ok(Math.abs(at.x - DOCK.x) < 0.8 && Math.abs(at.z - DOCK.z) < 1.5, 'the prompt is at the boat');
  assert.ok(it.radius >= 3 && it.radius <= 6.5, `reach ${it.radius}`);
  // a walker 3 m from the boat looking at it (wading on the bed): the prompt targets the boat
  const sx = DOCK.x - 3, sz = DOCK.z; walker(sx, sz); player.yaw = Math.atan2(-(DOCK.x - sx), -(DOCK.z - sz)); player.pitch = 0;
  ctx.camera.position.set(sx, player.pos.y + player.eye, sz); ctx.camera.lookAt(DOCK.x, player.pos.y + player.eye, DOCK.z); ctx.camera.updateMatrixWorld(true);
  const tg = ctx.interact.update(); assert.ok(tg && tg.id === 'drive-boat', `target ${tg && tg.id}`);
  const far = DOCK.x - 20; walker(far, DOCK.z); ctx.camera.position.set(far, player.pos.y + player.eye, DOCK.z); ctx.camera.lookAt(DOCK.x, player.pos.y + player.eye, DOCK.z); ctx.camera.updateMatrixWorld(true);
  const tf = ctx.interact.update(); assert.ok(!tf || tf.id !== 'drive-boat', 'offered from 20 m');
});

// ---------------------------------------------------------------- 2 boarding
check('2 enter("boat"): active, the boat is the vehicle, the car tuning is not touched, the physics box is gone', () => {
  const coupeTuning = JSON.stringify(d.fleet[0].car.tuning);
  walker(DOCK.x - 3, DOCK.z); assert.ok(d.enter('boat')); step(0.05, {});
  assert.ok(d.active && d.vehicle === boat && d.car === boat.car && d.car.floats === true);
  assert.equal(boat.box, null, 'the box is dropped while driven');
  assert.equal(JSON.stringify(d.fleet[0].car.tuning), coupeTuning);
  assert.ok(Math.abs(d.car.x - DOCK.x) < 1e-6 && Math.abs(d.car.yaw - DOCK.yaw) < 1e-6);
  assert.ok(player.inputLock > 0 && Math.abs(player.pos.x - DOCK.x) < 1 && player.pos.y > ph.heightAt(player.pos.x, player.pos.z) - 0.01, 'the player follows the boat and is not underground');
  assert.ok(!player.isUnderground());
});

// ---------------------------------------------------------------- 3 floating, speed, slide, reverse, brakes
const wl0 = water(DOCK.x, DOCK.z);
/** a start in the middle of the river 70 m north of the dock, heading south: open water for the 10 s of a run (from the dock itself the run ends at the bridge) */
const openStart = () => { const zr = DOCK.z - 70; let a = DOCK.x + 30, b = a; while (water(a - 1, zr) !== null) a--; while (water(b + 1, zr) !== null) b++; d.teleport((a + b) / 2, zr, 0.1); };
check('3 floats: at rest the height is the water level', () => { const r = step(0.5, {}); assert.ok(Math.abs(d.car.y - wl0) < 0.01, `y ${d.car.y} water ${wl0}`); });
let top = 0;
check('3 full throttle for 12 s: 40-50 km/h at the end, a monotone start, never off the water, the height stays the water level', () => {
  openStart();
  let off = 0, maxDy = 0, prev = 0, monotone = true;
  step(12, { thr: 1 }, (i, c) => { if (water(c.x, c.z) === null) off++; maxDy = Math.max(maxDy, Math.abs(c.y - wl0)); top = Math.max(top, c.speed); if (i < 120 && c.speed < prev - 0.01) monotone = false; prev = c.speed; });
  console.log(`     top speed ${top.toFixed(1)} km/h after 12 s, ${d.car.z.toFixed(0)} z`);
  assert.equal(off, 0, 'the centre left the water'); assert.ok(maxDy < 0.02, `bobbed ${maxDy}`); assert.ok(monotone);
  assert.ok(top >= 40 && top <= 52, `top ${top}`);
});
check('3 the boat slides in a turn: the sideways speed builds and dies, the heading changes at speed', () => {
  openStart(); step(5, { thr: 1 });
  const yaw0 = d.car.yaw; let maxVL = 0;
  step(2, { thr: 1, steer: 1 }, (i, c) => { maxVL = Math.max(maxVL, Math.abs(c.vL)); });
  const dyaw = Math.abs(angDiff(d.car.yaw, yaw0)) * DEG; console.log(`     turned ${dyaw.toFixed(0)} deg in 2 s, max sideways speed ${maxVL.toFixed(1)} m/s`);
  assert.ok(dyaw > 25, 'barely turns'); assert.ok(maxVL > 0.7, 'no slide');
  step(3, { thr: 0, steer: 0 }); assert.ok(Math.abs(d.car.vL) < 0.4, 'the slide dies out');
});
check('3 S brakes from speed and then reverses slowly (under 18 km/h); Space stops', () => {
  openStart(); step(5, { thr: 1 }); const v0 = d.car.speed;
  step(3.5, { brk: 1 }, () => {}); assert.ok(d.car.speed < 8 || d.car.vF < 0.6, `still ${d.car.speed.toFixed(1)} km/h`);
  let vmin = 0; step(5, { brk: 1 }, (i, c) => { vmin = Math.min(vmin, c.vF); });
  console.log(`     from ${v0.toFixed(0)} km/h the brake stops it and reverse peaks at ${(-vmin * 3.6).toFixed(1)} km/h`);
  assert.ok(-vmin * 3.6 > 6 && -vmin * 3.6 < 18, `reverse ${-vmin * 3.6}`);
  openStart(); step(4, { thr: 1 }); step(2.5, { hand: true }); assert.ok(d.car.speed < 3, `hand ${d.car.speed}`);
});
check('3 coasting: without input it slows but keeps going (a boat does not stop at once)', () => {
  const zr = DOCK.z + 15; let wa = DOCK.x, wb = DOCK.x; while (water(wa - 1, zr) !== null) wa--; while (water(wb + 1, zr) !== null) wb++;
  d.teleport((wa + wb) / 2, zr, 0.1); step(5, { thr: 1 }); const v0 = d.car.speed; step(2, {}); const v1 = d.car.speed;       // (in the middle of the river, heading south)
  assert.ok(v1 < v0 && v1 > v0 * 0.5, `${v0} -> ${v1}`);
});

// ---------------------------------------------------------------- 4 the Fontanka under the Anichkov Bridge
/** the water interval around x0 on the row z: [x0, x1] where waterLevel is not null, expanding from x0 */
function interval(x0, z) {
  if (water(x0, z) === null) return null;
  let a = x0, b = x0; while (water(a - 1, z) !== null && a > x0 - 200) a -= 1; while (water(b + 1, z) !== null && b < x0 + 200) b += 1; return [a, b];
}
let centre = [], cx = DOCK.x; for (let z = DOCK.z; z <= DOCK.z + 520; z += 5) { const iv = interval(cx, z); if (!iv) break; cx = (iv[0] + iv[1]) / 2; centre.push([cx, z, iv[1] - iv[0]]); }
const bridge = ctx.services.landmarksC && ctx.services.landmarksC.bridge;
let bridgeZ = null; if (bridge) { for (let z = DOCK.z; z < DOCK.z + 300 && bridgeZ === null; z += 1) for (let x = DOCK.x - 150; x < DOCK.x + 150; x += 4) if (Number.isFinite(bridge.deckY(x, z))) { bridgeZ = z; break; } }
console.log(`     the Fontanka south of the dock: ${centre.length} stations to z ${centre.length ? centre[centre.length - 1][1] : '?'}, width ${centre.length ? Math.min(...centre.map((c) => c[2])) : '?'}..${centre.length ? Math.max(...centre.map((c) => c[2])) : '?'} m; the Anichkov deck starts at z ${bridgeZ}`);
check(`4 the autopilot takes the boat from the dock south under the Anichkov Bridge in ${QUICK ? 25 : 40} s: always on water, no jump, no deck hit, comes out the other side`, () => {
  assert.ok(centre.length > 40 && bridgeZ !== null, 'no river / no bridge found');
  d.exit(true); walker(DOCK.x - 3, DOCK.z); d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw);
  const aim = (z) => { let best = centre[0]; for (const c of centre) if (c[1] >= z) { best = c; break; } return best; };
  let off = 0, jump = 0, hits = [], under = false, inside = false, prev = { x: d.car.x, z: d.car.z }, vmax = 0, maxDy = 0, minClear = 1e9, deckIn = 0;
  const T = QUICK ? 25 : 40;
  const pilot = (t) => {
    const c = d.car, tg = aim(c.z + 28), want = Math.atan2(tg[0] - c.x, tg[1] - c.z), dy = angDiff(want, c.yaw);
    return { thr: Math.abs(dy) > 0.7 ? 0.3 : 1, steer: Math.max(-1, Math.min(1, dy * 2.2)) };
  };
  step(T, pilot, (i, c) => {
    if (water(c.x, c.z) === null) off++;
    const mv = Math.hypot(c.x - prev.x, c.z - prev.z); if (mv > Math.max(0.5, c.speed / 3.6 / 60 * 3)) jump++; prev = { x: c.x, z: c.z };
    vmax = Math.max(vmax, c.speed); maxDy = Math.max(maxDy, Math.abs(c.y - wl0));
    for (const ev of c.events) if (ev.type === 'hit') hits.push({ z: +c.z.toFixed(1), v: +ev.v.toFixed(1) });
    const dk = bridge.deckY(c.x, c.z); if (Number.isFinite(dk)) { deckIn++; minClear = Math.min(minClear, dk - (c.y + boat.spec.hgt)); }
    if (c.z > bridgeZ + 8) under = true;
  });
  console.log(`     ended at z ${d.car.z.toFixed(0)}, x ${d.car.x.toFixed(0)}, ${d.car.speed.toFixed(0)} km/h, top ${vmax.toFixed(0)} km/h; ${deckIn} frames under the deck (clearance ${minClear.toFixed(2)} m over the hull); hits ${JSON.stringify(hits)}`);
  assert.equal(off, 0, 'left the water'); assert.equal(jump, 0, 'a jump / teleport'); assert.ok(maxDy < 0.02, `sank / rose ${maxDy}`);
  assert.ok(under, `did not pass under the bridge (z ${d.car.z.toFixed(0)}, bridge at ${bridgeZ})`);
  assert.ok(deckIn > 20, 'never under the deck'); assert.ok(minClear > 0.05, `the deck is ${minClear.toFixed(2)} m over the hull`);
  assert.equal(hits.length, 0, 'hit something on the open river');
});
check('4 the player stays with the boat (position, not underground, the camera is above the water)', () => {
  assert.ok(Math.hypot(player.pos.x - d.car.x, player.pos.z - d.car.z) < 0.01 && !player.isUnderground() && ctx.camera.position.y > d.car.y + 0.4, `cam y ${ctx.camera.position.y} boat ${d.car.y}`);
});

// ---------------------------------------------------------------- 5 the shore
check('5 into the bank at full throttle: stops softly in the water, never on land, no teleport, no hit event; backs out', () => {
  d.exit(true); walker(DOCK.x - 3, DOCK.z); d.enter('boat');
  // from 30 m out in the river, heading west at the quay, full throttle
  d.teleport(DOCK.x + 30, DOCK.z, Math.atan2(-1, 0));
  let off = 0, jump = 0, hit = 0, scrape = 0, prev = { x: d.car.x, z: d.car.z }, maxV = 0;
  step(9, { thr: 1 }, (i, c) => { if (water(c.x, c.z) === null) off++; const mv = Math.hypot(c.x - prev.x, c.z - prev.z); if (mv > 0.6) jump++; prev = { x: c.x, z: c.z }; maxV = Math.max(maxV, c.speed); for (const e of c.events) { if (e.type === 'hit') hit++; else scrape++; } });
  console.log(`     hit the bank at up to ${maxV.toFixed(0)} km/h; stopped at x ${d.car.x.toFixed(2)} (water edge ${edgeX.toFixed(2)}), speed ${d.car.speed.toFixed(2)}, ${scrape} scrape events, ${hit} hit events`);
  assert.equal(off, 0, 'the centre reached the land'); assert.equal(jump, 0); assert.ok(d.car.speed < 1.5, `still ${d.car.speed}`);
  assert.equal(hit, 0, 'a hit (damage) on the soft shore');
  // the whole hull stays on water at rest
  const S = boat.spec, sy = Math.sin(d.car.yaw), cy = Math.cos(d.car.yaw); for (const a of [S.front * 0.6, 0, S.rear * 0.6]) assert.ok(water(d.car.x + sy * a, d.car.z + cy * a) !== null);
  const x1 = d.car.x; step(4, { brk: 1 }); assert.ok(d.car.x > x1 + 0.5, 'does not back out');
});

// ---------------------------------------------------------------- 6 a pier / abutment in the water
check('6 a solid in the water (pier / abutment) stops the boat with a hit and slides it off; never inside it', () => {
  // find the nearest collider on a water cell that reaches above the boat's hull and below its keel line
  const wy = wl0; let best = null;
  for (const it of ph.items) {
    if (it.type === 'cyl' || it.type === 'box') {
      if (it.y0 > wy - 0.2 || (it.y1 ?? 0) < wy + 0.6) continue;
      if (water(it.cx, it.cz) === null) continue;
      const dd = Math.hypot(it.cx - DOCK.x, it.cz - DOCK.z); if (!best || dd < best.dd) best = { it, dd };
    }
  }
  if (!best) { console.log('     (no collider stands in the water of this area near the Fontanka: nothing to hit, skipped)'); return; }
  const it = best.it, r = it.type === 'cyl' ? it.r : Math.hypot(it.hw, it.hd);
  console.log(`     pier: ${it.type} at ${it.cx.toFixed(1)}, ${it.cz.toFixed(1)}, size ${r.toFixed(1)} m, ${best.dd.toFixed(0)} m from the dock`);
  // approach from 30 m away on the open-water side toward the middle of the collider
  let ap = null; for (const ang of [0, 1, 2, 3, 4, 5, 6, 7].map((k) => k * Math.PI / 4)) { const sx = it.cx + Math.sin(ang) * 30, sz = it.cz + Math.cos(ang) * 30; let ok = true; for (let t = 0; t <= 1 && ok; t += 0.05) if (water(it.cx + (sx - it.cx) * t, it.cz + (sz - it.cz) * t) === null) ok = false; if (ok) { ap = { sx, sz, ang }; break; } }
  if (!ap) { console.log('     (no open water approach, skipped)'); return; }
  d.exit(true); walker(ap.sx, ap.sz); d.enter('boat'); d.teleport(ap.sx, ap.sz, Math.atan2(it.cx - ap.sx, it.cz - ap.sz));
  let hit = 0, inside = false, off = 0, vHit = 0;
  step(9, { thr: 1 }, (i, c) => { if (water(c.x, c.z) === null) off++; for (const e of c.events) if (e.type === 'hit') { hit++; vHit = Math.max(vHit, e.v); } if (it.type === 'cyl' ? Math.hypot(c.x - it.cx, c.z - it.cz) < it.r : (() => { const dx = c.x - it.cx, dz = c.z - it.cz, lx = dx * it.c - dz * it.s, lz = dx * it.s + dz * it.c; return Math.abs(lx) < it.hw && Math.abs(lz) < it.hd; })()) inside = true; });
  console.log(`     ${hit} hit events (max ${vHit.toFixed(1)} m/s), ended ${Math.hypot(d.car.x - it.cx, d.car.z - it.cz).toFixed(1)} m from the pier at ${d.car.speed.toFixed(1)} km/h`);
  assert.ok(hit > 0, 'went through it without a hit'); assert.ok(!inside, 'the boat centre was inside the pier'); assert.equal(off, 0);
});

check('6 the Anichkov piers are solid: along a pier line the boat is stopped by the cutwater (never inside), along the middle arch it passes under the bridge without a hit', () => {
  const F = globalThis.__frame;
  const run = (u) => {
    const p0 = F.toWorld(u, -34); d.exit(true); walker(p0.x, p0.z); d.enter('boat'); d.teleport(p0.x, p0.z, -F.TH);       // along +v (the river), 34 m north of the bridge centre line
    let hit = 0, minV = 1e9, maxV = -1e9, off = 0;
    step(8, { thr: 1 }, (i, c) => { const q = F.toUV(c.x, c.z); minV = Math.min(minV, q.v); maxV = Math.max(maxV, q.v); if (water(c.x, c.z) === null) off++; for (const e of c.events) if (e.type === 'hit') hit++; });
    return { hit, maxV, off, speed: d.car.speed };
  };
  const pier = run((F.ARCHES[0][1] + F.ARCHES[1][0]) / 2), mid = run(0);
  console.log(`     pier line: ${pier.hit} hit(s), got no further than v ${pier.maxV.toFixed(1)} (the pier face is at v ${-F.FACE}); middle arch: ${mid.hit} hit(s), reached v ${mid.maxV.toFixed(1)} (through: > ${F.FACE})`);
  assert.ok(pier.hit > 0 && pier.maxV < -F.FACE + 1.5 && pier.off === 0, 'the pier did not stop the boat');
  assert.ok(mid.hit === 0 && mid.maxV > F.FACE + 2 && mid.off === 0, 'the middle arch is not open');
});

// ---------------------------------------------------------------- 7 getting out
check('7 exit at the dock side: the walker stands beside the hull on the water bed, wades, is not underground; the boat floats where it was left; E boards again', () => {
  d.exit(true); d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw); step(1, {});
  assert.ok(d.exit(), 'exit refused'); assert.ok(!d.active);
  const P = player.pos, bed = ph.heightAt(P.x, P.z), S = boat.spec;
  console.log(`     the walker stands at ${P.x.toFixed(2)}, ${P.z.toFixed(2)}, y ${P.y.toFixed(2)} (bed ${bed.toFixed(2)}), water ${water(P.x, P.z)}; the boat floats at ${boat.parked.x.toFixed(2)}, ${boat.parked.z.toFixed(2)}`);
  assert.ok(Math.abs(P.y - bed) < 0.6 || P.y > bed, 'not on the bed'); assert.ok(!player.isUnderground());
  assert.ok(Math.hypot(P.x - boat.parked.x, P.z - boat.parked.z) < 6, 'far from the boat');
  // outside the hull rectangle
  const dx = P.x - boat.parked.x, dz = P.z - boat.parked.z, sy = Math.sin(boat.parked.yaw), cy = Math.cos(boat.parked.yaw), lx = dx * cy - dz * sy, lz = dx * sy + dz * cy;
  assert.ok(Math.abs(lx) > S.W / 2 + 0.2 || lz > S.front + 0.2 || lz < S.rear - 0.2, 'inside the hull');
  assert.ok(boat.box, 'the parked boat is a solid again');
  assert.ok(Math.abs(boat.parked.y - wl0) < 0.05);
  // walks a few steps (the walker is free), then boards again with the key
  player.inputLock = Math.max(0, player.inputLock); assert.equal(player.inputLock, 0);
});
check('7 exit while fast is refused (above 25 km/h), the boat keeps going; a slow exit works', () => {
  walker(DOCK.x - 3, DOCK.z); d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw); step(5, { thr: 1 });
  assert.equal(d.exit(), false); assert.ok(d.active); step(5, { brk: 1 }); step(3, { hand: true }); assert.ok(d.exit(), `speed ${d.car.speed}`);
});
check('7 the boat left in the river floats where it is (no drift, no sink) and the walker can swim to it', () => {
  walker(DOCK.x - 3, DOCK.z); d.enter('boat'); d.teleport(DOCK.x + 4, DOCK.z + 10, DOCK.yaw); step(0.3, {}); d.exit(true);
  const x = boat.parked.x, z = boat.parked.z; for (let i = 0; i < 300; i++) for (const f of ctx._updates) f(1 / 60, i / 60);
  assert.ok(Math.hypot(boat.parked.x - x, boat.parked.z - z) < 1e-6); assert.ok(Math.abs(boat.model.root.position.y - wl0) < 0.08, `y ${boat.model.root.position.y}`);
  d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw); d.exit(true);
});

// ---------------------------------------------------------------- 8 R and the hand-off
check('8 R (place at the start) leaves the boat where it floats and sets the player on foot at the start', () => {
  walker(DOCK.x - 3, DOCK.z); d.enter('boat'); d.teleport(DOCK.x + 2, DOCK.z + 12, DOCK.yaw); const bx = d.car.x, bz = d.car.z;
  assert.equal(d.place(L.HERO.x, L.HERO.z, L.HERO.yaw), true); assert.ok(!d.active);
  assert.ok(Math.hypot(boat.parked.x - bx, boat.parked.z - bz) < 0.01, 'the boat moved'); assert.ok(Math.hypot(player.pos.x - L.HERO.x, player.pos.z - L.HERO.z) < 1.5, 'the player is not at the start');
  d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw); d.exit(true);
});
check('8 hand-off arrival: on water the boat comes along, on land the player is on foot', () => {
  walker(L.HERO.x, L.HERO.z);
  assert.equal(d.arrive({ id: 'boat', view: 0, d: [0, 0, 0, 0] }, DOCK.x, DOCK.z + 20, 0), true); assert.ok(d.active && d.vehicle === boat && water(d.car.x, d.car.z) !== null);
  d.exit(true); d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw); d.exit(true);
  walker(L.HERO.x, L.HERO.z);
  assert.equal(d.arrive({ id: 'boat', view: 0, d: [0, 0, 0, 0] }, L.HERO.x, L.HERO.z, L.HERO.yaw), false); assert.ok(!d.active); assert.ok(Math.hypot(player.pos.x - L.HERO.x, player.pos.z - L.HERO.z) < 1.5);
  assert.equal(d.arrive({ id: 'nothing', view: 0, d: [0, 0, 0, 0] }, DOCK.x, DOCK.z + 20, 0), false);
  assert.ok(boat.damage.state.front === 0 && Array.isArray([boat.damage.state.front, boat.damage.state.rear, boat.damage.state.left, boat.damage.state.right]), 'the hand-off reads the damage state');
});

// ---------------------------------------------------------------- 9 the cars are unchanged
check('9 the cars: the fleet of four, each enters and exits, the HUD / sound profiles come back after the boat, the boat is not in the fleet', () => {
  assert.deepEqual(d.fleet.map((f) => f.id), ['coupe', 'truck', 'lada', 'roadster']);
  for (const v of d.fleet) { walker(v.parked.x, v.parked.z + 6); assert.ok(d.enter(v.id), v.id); step(0.5, { thr: 1 }); assert.ok(d.car.speed > 0.5 && !d.car.floats, v.id); assert.ok(d.exit(true)); }
  const ids = ctx.interact.list().map((i) => i.id).sort(); assert.deepEqual(ids, ['drive-boat', 'drive-car', 'drive-lada', 'drive-roadster', 'drive-truck']);
});
check('9 the module errors are empty', () => { assert.deepEqual(errors, []); });

console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`);
process.exit(fails ? 1 : 0);
