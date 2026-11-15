// drive-hop-test.mjs - the Roadster's two gas HOPS (X = the simple hop, C = the barrel hop) and THRUST surge (drive/handling.js tuning.hop / tuning.nitroRamp), headless, NO browser: the real handling on a flat world with the real Physics.
//   node tools/drive-hop-test.mjs [--verbose]
// Asserts: (1) the simple hop (X): a ballistic hop (tank too low for the landing cushion) peaks at about 1.86 m (v0 7.6 m/s, g 15.5), hangs for about 1.0 s and lands at about 7.6 m/s; with the cushion the touchdown is soft (about 1.8 m/s);
// (2) both keys start on the very step of the key DOWN (vy > 0 and h > 0 right after that step), an edge: a held key / auto-repeat never retriggers, a one-frame press still launches, there is NO buffer and NO charge; the cooldown and the
// tank rules (X: cost 0.28, needs 0.28; C: cost 0.45, needs 0.45, a short tank = no hop at all and a 'dry' event); the other key does nothing in the air; the car is never below the road;
// (3) in the air: no engine, no brakes, no nitro, a quarter of the steering, the sideways speed is kept; (4) obstacles: a 0.9 m bin stops the ground car but an airborne one passes over it, a 0.4 m kerb is stepped over by both
// (STEP_HEIGHT 0.45), a 2 m fence / wall stops even the airborne car (the solids see it no higher than clearMax 1.5 over the road), a bus shelter or a kiosk (2.6 m) and a 3 m wall stop the barrel hop too, buildings / river stay 2D blockers;
// (5) the other cars are untouched: pressing either hop key does nothing for the coupe / truck / Lada, and a scripted 40 s run of each (gas, brakes, steering, handbrake, nitro, collisions) matches a copy of the
// handling from commit BASE_COMMIT (git show, before the hop existed) bit for bit, state by state; the Roadster without a hop press and without nitro matches it too, and its nitro surge (nitroRamp) is a real lag;
// (6) the barrel hop (C): apex 3.72 m (twice the simple hop), about 1.4 s, a cosmetic 360 degree roll done by 85 % of the ballistic airtime and exactly 0 at touchdown / early landing, a soft cushioned landing (and a safe ballistic one on
// a short tank), the old charge fields are gone from the tuning; (7) the sounds: the hop one-shots, no charge hiss.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Physics } from '../src/core/physics.js';
import { createHandling, hopV0, hopCost } from '../src/world/drive/handling.js';
import { SPEC as COUPE_SPEC } from '../src/world/drive/model.js';
import { MASS, SOUND, tuningFor } from '../src/world/drive/cars/tuning.js';
import { createCarSound } from '../src/world/drive/sound.js';

const VERBOSE = process.argv.includes('--verbose');
const BASE_COMMIT = '231799b';                      // the tree before the hop / surge: createHandling(ctx, tuning) with no vertical dynamics
const ROOT = new URL('..', import.meta.url), DRIVE = new URL('../src/world/drive/', import.meta.url);
const SPECS = {
  coupe: { ...COUPE_SPEC, mass: MASS.coupe },
  truck: { W: 2.03, R: 0.43, wb: 3.80, front: 2.63, rear: -3.05, hgt: 1.80, len: 5.68, centerZ: -0.21, mass: MASS.truck },
  lada: { W: 1.62, R: 0.285, wb: 2.42, front: 2.09, rear: -2.07, hgt: 1.40, len: 4.16, centerZ: 0.01, mass: MASS.lada },
  roadster: { W: 2.00, R: 0.355, wb: 2.96, front: 2.36, rear: -2.26, hgt: 1.22, len: 4.62, centerZ: 0.05, mass: MASS.roadster },
};
const FLAT = { inPlay: () => true, heightAt: () => 0, insideBuilding: () => false };
const DT = 1 / 60, NONE = { thr: 0, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false };
const TAU = Math.PI * 2;
const world = (extra) => { const physics = new Physics(() => 0); if (extra) extra(physics); return { L: FLAT, physics, services: {} }; };
const make = (id, ctx = world(), mod = { createHandling }) => { const car = mod.createHandling(ctx, id === 'coupe' ? null : tuningFor(id, SPECS[id])); car.reset(0, 0, 0); return car; };
const say = (...a) => { if (VERBOSE) console.log(...a); };
const near = (v, a, b, what) => assert(v >= a && v <= b, `${what}: ${v} not in [${a}, ${b}]`);
const evName = (e) => e.type + (e.v ? ' ' + e.v.toFixed(2) : '');

// the numbers of this version: X = the simple hop (apex 1.86 m, v0 7.6 m/s), C = the barrel hop (apex 3.72 m, v0 10.74 m/s), g 15.5
const APEX_X = 1.86, APEX_C = 3.72, KEY_X = 'jump', KEY_C = 'flip';
const car0Refill = (r) => r.car.tuning.nitroRefill * r.air;
// ---------------------------------------------------------------- 1. the hop curve (flat road, standing car)
/** one hop from a standstill: the key `key` (jump = X, flip = C) goes down at t = pressAt s and stays down for `down` frames (1 = a one-frame press, Infinity = for ever); returns the measurements.
 *  boost0 = the tank at the press; dt = the frame time; refill false = no tank refill (no gas for anything but the hop); other = { key, at, for }: the other hop key pressed meanwhile */
function hopRun(boost0, { key = KEY_X, dt = DT, seconds = 3.2, refill = true, down = 1, steer = 0, thr = 0, vz = 0, pressAt = 0.1, other = null } = {}) {
  const car = make('roadster'), ground = car.groundAt(0, 0);
  const r = { car, hop: car.tuning.hop, peak: 0, peakT: 0, minAboveRoad: Infinity, events: [], air: 0, takeoffT: -1, landT: -1, boostBefore: 0, boostAfter: 0, boostLand: 0, flipMax: 0, flipFull: -1, flipAtLand: null, flipOnAtLand: null, first: null, landV: 0, afterMaxH: 0, reAir: false };
  car.boost = boost0; car.vz = vz; if (!refill) car.tuning.nitroRefill = car.tuning.nitroDriftRefill = 0;
  const press = Math.round(pressAt / dt);
  for (let i = 0; i * dt < seconds; i++) {
    const t = i * dt, wasAir = car.air, on = i >= press && i < press + down;
    if (i === press) r.boostBefore = car.boost;
    const inp = { ...NONE, thr, steer, [key]: on };
    if (other && t >= other.at && t < other.at + other.for) inp[other.key] = true;
    car.step(dt, inp);
    for (const e of car.events) if (e.type === 'hop' || e.type === 'land' || e.type === 'cushion' || e.type === 'dry') r.events.push({ ...e, t });
    if (i === press) r.first = { vy: car.vy, h: car.h, air: car.air, hop: car.events.some((e) => e.type === 'hop') };
    if (!wasAir && car.air) { r.takeoffT = t; r.boostAfter = car.boost; }
    if (wasAir && !car.air) { r.landT = t; r.boostLand = car.boost; r.flipAtLand = car.flip; r.flipOnAtLand = car.flipOn; r.landV = car.events.find((e) => e.type === 'land')?.v ?? 0; }
    else if (r.landT >= 0 && t > r.landT) { r.afterMaxH = Math.max(r.afterMaxH, car.h); if (car.air) r.reAir = true; }
    if (car.air) { r.air += dt; if (car.h > r.peak) { r.peak = car.h; r.peakT = t; } r.flipMax = Math.max(r.flipMax, Math.abs(car.flip)); if (r.flipFull < 0 && Math.abs(car.flip) >= TAU - 1e-9) r.flipFull = t - r.takeoffT; }
    r.minAboveRoad = Math.min(r.minAboveRoad, car.y - ground);
    assert(Number.isFinite(car.y + car.h + car.vy + car.flip), 'finite state');
    if (vz === 0 && r.takeoffT < 0) assert(Math.abs(car.x) < 1e-9 && Math.abs(car.z) < 1e-9, 'a standing car stays put');
  }
  return r;
}
{
  const a = hopRun(0.30, { refill: false }), H = a.hop;                          // 0.30 - 0.28 = 0.02 left and no refill: no gas for the landing cushion, a purely ballistic hop
  say('X ballistic', { peak: +a.peak.toFixed(3), air: +a.air.toFixed(3), events: a.events.map(evName) });
  near(H.v0 ** 2 / (2 * H.g), APEX_X * 0.995, APEX_X * 1.005, 'tuning: v0 7.6 at g 15.5 is an apex of 1.86 m');
  near(a.peak, APEX_X * 0.97, APEX_X * 1.03, 'simple hop (X) peak height (v0^2 / 2g = 1.86 m, +-3 %)');
  near(a.air, 0.92, 1.04, 'simple hop airtime (2 v0 / g = 0.98 s)');
  assert.deepEqual(a.events.map((e) => e.type), ['hop', 'land'], 'one hop event, one land event (no cushion without gas)');
  assert.equal(a.events[0].flip, false, 'the X hop is not a barrel hop'); assert.equal(a.events[1].big, false);
  near(a.events[1].v, 7.2, 7.9, 'touchdown speed without the cushion (v0 = 7.6 m/s)');
  near(a.peakT - a.takeoffT, 0.44, 0.53, 'time to the top (v0 / g = 0.49 s)');
  assert(a.minAboveRoad >= -1e-9, `the car is never below the road (${a.minAboveRoad})`);
  near(a.boostBefore - a.boostAfter, H.cost - 0.01, H.cost + 0.01, 'the tank cost of the simple hop');
  assert(a.car.air === false && a.car.h === 0 && a.car.vy === 0 && Math.abs(a.car.y - a.car.groundAt(0, 0)) < 1e-6, 'back on the road, level');
  assert.equal(a.flipMax, 0, 'the X hop never rolls'); assert.equal(a.car.flip, 0); assert.equal(a.car.barrel, false);
  const b = hopRun(1);                                                          // a full tank: the down-jets fire again before the touchdown
  say('X cushioned', { peak: +b.peak.toFixed(3), air: +b.air.toFixed(3), events: b.events.map(evName) });
  assert.deepEqual(b.events.map((e) => e.type), ['hop', 'cushion', 'land'], 'a full tank: hop, cushion, land');
  near(b.events[2].v, 1.6, 2.1, 'touchdown speed with the cushion (about 1.8 m/s)');
  near(b.air, 1.0, 1.3, 'cushioned airtime'); near(b.peak, APEX_X * 0.97, APEX_X * 1.03, 'cushioned peak height');
  assert(b.minAboveRoad >= -1e-9, 'never below the road (cushioned)');
  near(b.boostAfter + car0Refill(b) - b.boostLand, 0.02, 0.12, 'the tank spent by the landing jets (about 0.04)');
  const c = hopRun(0.30, { dt: 1 / 30, refill: false });                       // a slow frame rate integrates to the same arc (substeps of 1/120 s)
  near(c.peak, APEX_X * 0.97, APEX_X * 1.03, 'peak height at 30 fps'); near(c.air, 0.9, 1.05, 'airtime at 30 fps'); assert(c.minAboveRoad >= -1e-9, 'never below the road at 30 fps');
  const d = hopRun(1, { dt: 1 / 144 }); near(d.peak, APEX_X * 0.97, APEX_X * 1.03, 'peak height at 144 fps'); near(d.air, 1.0, 1.3, 'airtime at 144 fps');
  // the tank gate: below minTank X does nothing (a 'dry' event for the HUD), at minTank it hops
  const e = hopRun(H.minTank - 0.05); assert.deepEqual(e.events.map((x) => x.type), ['dry'], 'not enough gas: no hop, only the dry event'); assert.equal(e.events[0].flip, false); assert.equal(e.peak, 0, 'not enough gas: the car stays on the road');
  const f = hopRun(H.minTank + 0.02); assert.equal(f.events[0]?.type, 'hop', 'just enough gas: it hops');
}

// ---------------------------------------------------------------- 2. immediate, edge-triggered, no buffer, no charge; the cooldown; the other key
for (const key of [KEY_X, KEY_C]) {
  const name = key === KEY_X ? 'X' : 'C', apex = key === KEY_X ? APEX_X : APEX_C;
  // (a) both keys start on the very step of the key DOWN: vy > 0 and h > 0 after that one step, the hop event is in that step, whatever the frame rate
  for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
    const r = hopRun(1, { key, dt, seconds: 0.4 });
    assert(r.first.air && r.first.vy > 0 && r.first.h > 0 && r.first.hop, `${name} at ${(1 / dt).toFixed(0)} fps: launched on the first step of the key down (vy ${r.first.vy.toFixed(2)}, h ${r.first.h.toFixed(3)})`);
    const tp = Math.round(0.1 / dt) * dt; near(r.takeoffT, tp - 1e-9, tp + 1e-9, `${name}: take-off on the press frame, not on the release`);
  }
  // (b) a key held for 5 s hops once (auto-repeat is a held level: it never retriggers) and lands once
  { const r = hopRun(1, { key, down: Infinity, seconds: 5 }); assert.equal(r.events.filter((e) => e.type === 'hop').length, 1, `${name}: a held key hops once`); assert.equal(r.events.filter((e) => e.type === 'land').length, 1, `${name}: and lands once`); assert(!r.car.air && r.car.h === 0); }
  // (c) a one-frame press (drive.js latches a keydown + keyup inside one frame into one step of key down) still launches the full hop, and only one
  { const r = hopRun(1, { key, down: 1, refill: false }); assert.equal(r.events.filter((e) => e.type === 'hop').length, 1, `${name}: a one-frame press hops once`); near(r.peak, apex * 0.97, apex * 1.03, `${name}: and it is the full hop`); }
  // (d) the cooldown after the touchdown and NO key buffer: a press in the cooldown is simply lost, one after it hops at once
  {
    const k = make('roadster'), times = []; let tk = 0, landAt = -1;
    const step = (on) => { if (on) k.boost = 1; k.step(DT, { ...NONE, [key]: on }); for (const e of k.events) { if (e.type === 'land') landAt = tk; if (e.type === 'hop') times.push(tk); } tk += DT; };
    for (let i = 0; i < 6; i++) step(false);
    step(true); while (tk < 4 && landAt < 0) step(false);
    assert(landAt > 0 && times.length === 1, `${name}: the first hop landed`);
    while (tk < landAt + 0.2 - 1e-9) step(false); step(true);                    // 0.2 s after the touchdown: inside the cooldown
    while (tk < landAt + 0.45 - 1e-9) step(false); step(true);                   // and 0.45 s: still inside it
    while (tk < landAt + 0.54 - 1e-9) step(false);
    assert.equal(times.length, 1, `${name}: presses inside the cooldown (${k.tuning.hop.cooldown} s) are ignored, and not buffered to hop later`);
    while (tk < landAt + 0.8 - 1e-9) step(false);
    assert.equal(times.length, 1, `${name}: nothing hops by itself when the cooldown ends`);
    step(true); assert.equal(times.length, 2, `${name}: a press after the cooldown hops on that very step`); near(times[1] - landAt, k.tuning.hop.cooldown, k.tuning.hop.cooldown + 0.4, `${name}: the second hop`);
  }
  // (e) a key held through the whole flight, the landing and the cooldown does not hop again
  { const r = hopRun(1, { key, down: Infinity, seconds: 6 }); assert.equal(r.events.filter((e) => e.type === 'hop').length, 1, name + ': holding through the touchdown does not start a second hop'); }
  // (f) the other key in the air does nothing: the flight is identical to the one without it, the tank is not touched, no event; held through the landing it starts nothing either
  {
    const otherKey = key === KEY_X ? KEY_C : KEY_X;
    const ctl = hopRun(1, { key, seconds: 4 }), ex = hopRun(1, { key, seconds: 4, other: { key: otherKey, at: 0.35, for: 6 } });
    assert.equal(ex.peak, ctl.peak, name + ': the other key does not change the flight'); assert.equal(ex.air, ctl.air); assert.equal(ex.car.boost, ctl.car.boost, 'and not the tank');
    assert.deepEqual(ex.events.map((e) => e.type), ctl.events.map((e) => e.type), name + ': no extra event (no dry either) for the other key in the air');
    assert.equal(ex.flipMax, ctl.flipMax);
  }
}
{ // both keys in the same step: the barrel hop wins when the tank can pay it; a tank that can pay only X gets the simple hop
  const car = make('roadster'); car.step(DT, { ...NONE, jump: true, flip: true }); assert(car.air && car.barrel && car.vy > 10, 'both keys, full tank: the barrel hop');
  const low = make('roadster'); low.boost = 0.3; low.step(DT, { ...NONE, jump: true, flip: true }); assert(low.air && !low.barrel && low.vy > 7 && low.vy < 8, 'both keys, tank 0.3: only the simple hop is paid');
}

// ---------------------------------------------------------------- 3. the air: no engine, no brakes, no nitro, a quarter of the steering, the sideways speed is kept
for (const key of [KEY_X, KEY_C]) {
  const gnd = make('roadster'), air = make('roadster');
  for (const c of [gnd, air]) { c.vz = 20; c.boost = 1; }
  // identical inputs, the air car hops at t = 0: gas + nitro + full left steering for 0.5 s
  const inp = { thr: 1, brk: 0, steer: 1, hand: false, nitro: true };
  let boostingInAir = false, brakingInAir = false;
  for (let i = 0; i < 30; i++) {
    gnd.step(DT, { ...inp, jump: false, flip: false }); air.step(DT, { ...inp, jump: false, flip: false, [key]: i === 0 });
    if (air.air && air.boosting) boostingInAir = true; if (air.air && air.braking) brakingInAir = true;
  }
  assert(air.air, 'still in the air after 0.5 s'); assert(!boostingInAir, 'no nitro in the air'); assert(!brakingInAir, 'no brake lights in the air');
  const vA = Math.hypot(air.vx, air.vz), vG = Math.hypot(gnd.vx, gnd.vz);
  near(vA, 18.8, 20.25, 'the speed in the air: no engine, only the drag'); assert(vG > vA + 4, `the car on the road accelerates (${vG.toFixed(1)} vs ${vA.toFixed(1)} m/s)`);
  const yawG = Math.abs(gnd.yaw), yawA = Math.abs(air.yaw - 0);
  assert(yawA > 0.01 && yawA < 0.6 * yawG, `a quarter of the steering in the air (yaw ${yawA.toFixed(3)} vs ${yawG.toFixed(3)} rad)`);
  // the velocity keeps its direction: the nose swings but the car flies straight on
  const heading = Math.atan2(air.vx, air.vz); assert(Math.abs(heading) < 0.03, `the flight path stays straight (${heading.toFixed(3)} rad) while the nose swings`);
  assert(Math.abs(air.vL) > 0.3, 'the sideways speed grows as the nose turns: nothing grips in the air');
}

// ---------------------------------------------------------------- 4. obstacles: car.y decides (collision.js carContact), 2D blockers stay
/** drive toward an obstacle (a box across the road at z = 40) at v m/s; hop (or not) with `key` when the nose is lead seconds from it (X 0.2 s, C 0.5 s: in the air, near the top, when it arrives). Returns { contact (any obstacle contact event), z, speed, minAbove } */
function crossing(id, v, top, { hop = true, y0 = 0, kerb = 0, key = KEY_X, lead = key === KEY_C ? 0.5 : 0.2 } = {}) {
  const ctx = world((p) => { p.addBox(0, 40, 14, 0.5, 0, y0, top); if (kerb) p.addWalkBox(0, 25, 14, 6, 0, kerb); });
  const car = make(id, ctx), ground = (x, z) => car.groundAt(x, z), SP = SPECS[id];
  car.vz = v; let contact = 0, minAbove = Infinity, hopped = false, maxH = 0;
  for (let i = 0; i < 6 * 60; i++) {
    const nose = car.z + SP.front, gap = 39.75 - nose, go = hop && !hopped && gap <= lead * car.vz;
    if (go) hopped = true;
    car.step(DT, { thr: 0.12, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false, [key]: go });
    for (const e of car.events) if (e.obstacle) contact++;
    if (car.air) minAbove = Math.min(minAbove, car.y - ground(car.x, car.z)); maxH = Math.max(maxH, car.h || 0);
  }
  return { contact, z: car.z, speed: car.speed / 3.6, minAbove, hopped, maxH };
}
{
  for (const v of [15, 25]) {
    const ground = crossing('roadster', v, 0.9, { hop: false }), hop = crossing('roadster', v, 0.9, { hop: true });
    say('0.9 m bin at', v, 'm/s', { ground, hop });
    assert(ground.contact > 0 && ground.z < 40, `the Roadster on the road is stopped by a 0.9 m bin at ${v} m/s`);
    assert(hop.hopped && hop.contact === 0 && hop.z > 50, `the hopping Roadster flies over a 0.9 m bin at ${v} m/s (contact ${hop.contact}, z ${hop.z.toFixed(1)})`);
    assert(hop.speed > 8, `and keeps its speed (${hop.speed.toFixed(1)} m/s)`);
    assert(hop.minAbove >= -1e-9, 'never below the road over the bin');
    const kerb = crossing('roadster', v, 0.4, { hop: false }), kerbHop = crossing('roadster', v, 0.4, { hop: true });
    assert(kerb.contact === 0 && kerb.z > 50 && kerbHop.contact === 0 && kerbHop.z > 50, `a 0.4 m kerb is no obstacle for either (STEP_HEIGHT 0.45) at ${v} m/s`);
    const planter = crossing('roadster', v, 1.2, { hop: true }); assert(planter.contact === 0 && planter.z > 50, `the simple hop clears a 1.2 m planter at ${v} m/s`);
    const wall = crossing('roadster', v, 2.0, { hop: true });
    assert(wall.contact > 0 && wall.z < 40, `even the airborne Roadster is stopped by a 2 m wall / fence (the solids see it no higher than clearMax 1.5 m, + the 0.45 m step = 1.95 m) at ${v} m/s (z ${wall.z.toFixed(1)})`);
    const shelter = crossing('roadster', v, 2.6, { hop: true }); assert(shelter.contact > 0 && shelter.z < 40, `the simple hop is stopped by a bus-shelter-high (2.6 m) box at ${v} m/s (z ${shelter.z.toFixed(1)})`);
    const coupe = crossing('coupe', v, 0.9, { hop: true });
    assert(!coupe.hopped || coupe.maxH === 0, 'the coupe never leaves the road'); assert(coupe.contact > 0 && coupe.z < 40, `the coupe pressing the hop key is stopped by the bin like any ground car at ${v} m/s`);
    const coupeC = crossing('coupe', v, 0.9, { hop: true, key: KEY_C });
    assert(coupeC.maxH === 0 && coupeC.contact > 0 && coupeC.z < 40, `and so does the coupe pressing the barrel-hop key at ${v} m/s`);
  }
  // a building footprint (and so the river, the same refusal) stays a 2D wall: the hop does not clear it, the car stops at its edge in the air or on the road
  for (const key of [KEY_X, KEY_C]) {
    const ctx = world(); ctx.L = { ...FLAT, insideBuilding: (x, z) => z > 40 }; const car = make('roadster', ctx); car.vz = 25; let hopped = false;
    for (let i = 0; i < 5 * 60; i++) { const go = !hopped && i === 12; if (go) hopped = true; car.step(DT, { thr: 0.2, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false, [key]: go }); }
    assert(car.z + SPECS.roadster.front < 40.3, `the hopping Roadster (${key}) does not enter a building footprint (nose at z ${(car.z + SPECS.roadster.front).toFixed(2)}, the wall is at 40)`);
  }
  // the kerb slab under the hop: the car lands ON it (the road there is 0.25 m up) and is never under it
  const ks = crossing('roadster', 20, 0.4, { hop: true, kerb: 0.25 });
  assert(ks.minAbove >= -1e-9 && ks.minAbove < 1e9 && ks.contact === 0, `hop over a 0.25 m kerb slab: never below the road in the air (${ks.minAbove}), no contact`);
}

// ---------------------------------------------------------------- 5. the other cars are untouched
let Base = null;
try {
  let src = execFileSync('git', ['show', `${BASE_COMMIT}:src/world/drive/handling.js`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24, stdio: ['ignore', 'pipe', 'ignore'] });
  src = src.replace("from './model.js'", `from '${new URL('model.js', DRIVE).href}'`).replace("from './collision.js'", `from '${new URL('collision.js', DRIVE).href}'`);
  assert(src.includes(new URL('collision.js', DRIVE).href) && !src.includes('tuning.hop'), 'the baseline copy is the pre-hop handling');
  // Isolate hop/surge behaviour from the later generic collision COM fix.
  // Apply that same pivot correction to the historical non-hop implementation;
  // retain every strict state/event bit-identity assertion below. The separate
  // collision regression proves the pivot correction itself, including buses.
  src = src.replace('const yaw0 = car.yaw, sy0 = sy, cy0 = cy;', 'const yaw0 = car.yaw, sy0 = sy, cy0 = cy, turnX = car.x, turnZ = car.z;')
    .replace('car.yaw += (om + car.impactSpin) * h; sy = Math.sin(car.yaw); cy = Math.cos(car.yaw);', `car.yaw += (om + car.impactSpin) * h; sy = Math.sin(car.yaw); cy = Math.cos(car.yaw);
    const steerYaw = yaw0 + om * h;
    car.x += (Math.sin(steerYaw) - sy) * SPEC.centerZ;
    car.z += (Math.cos(steerYaw) - cy) * SPEC.centerZ;`)
    .replace('!carBlocked(car.x, car.z, sy0, cy0)) { car.yaw = yaw0;', '!carBlocked(turnX, turnZ, sy0, cy0)) { car.yaw = yaw0; car.x = turnX; car.z = turnZ;');
  assert(src.includes('const steerYaw') && src.includes('car.x = turnX'), 'baseline receives the same collision pivot correction');
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'hop-base-')), 'handling-base.mjs'); writeFileSync(file, src);
  Base = await import(pathToFileURL(file).href);
} catch (err) { console.log(`SKIP bit-identity: cannot get handling.js from ${BASE_COMMIT} (${String(err.message).split('\n')[0]})`); }

const KEYS = ['x', 'y', 'z', 'yaw', 'vx', 'vz', 'speed', 'vF', 'vL', 'pitch', 'roll', 'steer', 'steerAngle', 'spin', 'boost', 'rpm', 'gear', 'odo', 'impactSpin', 'aLong', 'aLat', 'throttle'];
const FLAGS = ['boosting', 'drifting', 'braking'];
/** the world for the comparison: a ring of boxes and posts the scripted drive runs into (so the contact code, the events and the push-out are compared as well) */
const rough = () => world((p) => {
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, r = 70 + 25 * (i % 3); p.addBox(Math.sin(a) * r, Math.cos(a) * r - 40, 3 + (i % 4), 1.2, a, 0, 1.4 + (i % 3) * 0.3); }
  for (let i = 0; i < 10; i++) p.addCylinder(-60 + i * 14, 30 - 9 * (i % 4), 0.3, 0, 3);
  p.addBox(0, 160, 120, 2, 0, 0, 3); p.addBox(-90, 60, 2, 240, 0, 0, 3); p.addBox(90, 60, 2, 240, 0, 0, 3);
});
const script = (t, jump, flip = false) => ({ thr: t % 11 < 8 ? 1 : (t % 11 < 9.5 ? 0 : 0.3), brk: t % 11 > 9.5 ? 1 : 0, steer: Math.sin(t * 0.9) * Math.cos(t * 0.31) * 1.2, hand: t % 7 > 6.2, nitro: t % 5 < 1.6, jump, flip });
function compare(id, mkInput, { label, seconds = 40 } = {}) {
  const ctxA = rough(), ctxB = rough(), A = make(id, ctxA, Base), B = make(id, ctxB);
  let frames = 0, hits = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const inp = mkInput(i * DT);
    A.step(DT, { ...inp }); B.step(DT, { ...inp }); frames++;
    for (const k of KEYS) if (!Object.is(A[k], B[k])) assert.fail(`${label || id}: ${k} differs at t = ${(i * DT).toFixed(3)} s: baseline ${A[k]} vs now ${B[k]}`);
    for (const k of FLAGS) assert.equal(A[k], B[k], `${label || id}: ${k} at t = ${(i * DT).toFixed(3)}`);
    assert.equal(A.events.length, B.events.length, `${label || id}: events at t = ${(i * DT).toFixed(3)}`);
    A.events.forEach((e, j) => { assert.equal(e.type, B.events[j].type); assert(Object.is(e.v, B.events[j].v), 'event speed'); if (e.type === 'hit') hits++; });
    assert.equal(B.h, 0); assert.equal(B.air, false);
  }
  return { frames, hits };
}
if (Base) {
  const out = [];
  for (const id of ['coupe', 'truck', 'lada']) {
    out.push(id, 'script', JSON.stringify(compare(id, (t) => script(t, false), { label: id + ' script' })));
    out.push(id, 'X pressed all the time', JSON.stringify(compare(id, (t) => script(t, true), { label: id + ' with the X key held' })));
    out.push(id, 'C pressed all the time', JSON.stringify(compare(id, (t) => script(t, false, true), { label: id + ' with the C key held' })));
    out.push(id, 'X and C tapped', JSON.stringify(compare(id, (t) => script(t, (t * 2) % 1 < 0.1, (t * 3) % 1 < 0.1), { label: id + ' with both hop keys tapped' })));
  }
  // the Roadster without a hop press and without nitro drives exactly like the pre-hop handling given its tuning (the extra keys of the tuning are simply unknown to the baseline)
  out.push('roadster', 'no hop, no nitro', JSON.stringify(compare('roadster', (t) => ({ ...script(t, false), nitro: false }), { label: 'roadster (no hop, no nitro)' })));
  say(out.join(' '));
  // its nitro surge is a real lag: the same launch with the nitro key down is slower for the first 0.4 s than the instant push and just as fast afterwards
  const A = make('roadster', world(), Base), B = make('roadster'), sp = [];
  for (let i = 0; i < 4 * 60; i++) { const inp = { thr: 1, brk: 0, steer: 0, hand: false, nitro: true, jump: false, flip: false }; A.step(DT, inp); B.step(DT, inp); if (i === 12) sp.push(A.speed, B.speed); if (i === 239) sp.push(A.speed, B.speed); }
  assert(sp[1] < sp[0] - 1, `the thrust surge: ${sp[1].toFixed(1)} km/h at 0.2 s against ${sp[0].toFixed(1)} km/h with the instant push`);
  assert(sp[3] > sp[2] - 25 && sp[3] < sp[2] + 1, `after 4 s the surge is spent: ${sp[3].toFixed(1)} vs ${sp[2].toFixed(1)} km/h`);
  say('surge', sp.map((v) => +v.toFixed(1)));
}
// the other cars take both hop keys as no key at all (also without the baseline): no height, no event (not even 'dry'), no roll, no pulse
for (const id of ['coupe', 'truck', 'lada']) {
  const car = make(id); let maxH = 0, ev = 0;
  for (let i = 0; i < 600; i++) { car.step(DT, { ...script(i * DT, i % 5 === 0 || i > 300, i % 7 === 0 || i > 400) }); maxH = Math.max(maxH, car.h); for (const e of car.events) if (e.type === 'hop' || e.type === 'land' || e.type === 'cushion' || e.type === 'dry') ev++; }
  assert(maxH === 0 && ev === 0 && !car.air && car.tuning.hop === undefined && car.tuning.nitroRamp === undefined, `${id}: no hop, no surge`);
  assert(car.flip === 0 && !car.flipOn && !car.barrel && car.pulse0 === 0 && car.jet === 0, `${id}: the hop keys roll nothing and burn nothing`);
}

// ---------------------------------------------------------------- 6. hop v3: the barrel hop (C): 3.72 m, the roll, the tank, the soft landing, the obstacles
{
  const H = make('roadster').tuning.hop, apex = (flip) => hopV0(H, flip) ** 2 / (2 * H.g);
  // (a) the tuning: the numbers of the two hops, the costs, the gates; the charge mechanic is gone from the table and from the code
  near(apex(false), APEX_X * 0.995, APEX_X * 1.005, 'tuning: X apex 1.86 m (v0 7.6)'); near(apex(true), APEX_C * 0.995, APEX_C * 1.005, 'tuning: C apex 3.72 m (v0flip 10.74)');
  near(apex(true) / apex(false), 1.98, 2.02, 'tuning: C is twice as high as X'); near(hopV0(H, false), 7.55, 7.65, 'tuning: v0 7.6'); near(hopV0(H, true), 10.70, 10.78, 'tuning: v0flip 10.74');
  near(H.cost, 0.27, 0.29, 'tuning: X cost 0.28'); near(H.costFlip, 0.44, 0.46, 'tuning: C cost 0.45'); assert.equal(hopCost(H, false), H.cost); assert.equal(hopCost(H, true), H.costFlip);
  near(H.minTank, 0.27, 0.29, 'tuning: X needs 0.28'); near(H.minTankFlip, 0.44, 0.46, 'tuning: C needs 0.45'); near(H.flip.frac, 0.8, 0.9, 'tuning: the roll is done by about 85 % of the airtime');
  assert(H.clearMax >= 1.4 && H.clearMax <= 1.6, `tuning: clearMax ${H.clearMax} (+ the 0.45 m step = under 2 m: fences, shelters and kiosks stay solid)`);
  for (const dead of ['chargeT', 'tapT', 'costMax', 'v0max', 'squat']) assert(!(dead in H), `tuning.hop.${dead} (the charge mechanic) is gone`);
  assert(!('at' in H.flip), 'tuning.hop.flip.at (the charge the roll started at) is gone');
  { const src = readFileSync(new URL('handling.js', DRIVE), 'utf8'), car = make('roadster'); for (const dead of ['charging', 'chargeHeld', 'charge', 'hopBuf', 'maxHop']) assert(!(dead in car), `car.${dead} is gone`); assert(!/chargeT|tapT|costMax|hopBuf/.test(src), 'no charge code left in handling.js'); }
  // (b) a ballistic C hop on the exact minimum tank (no refill: no gas for the landing cushion)
  const full = hopRun(H.minTankFlip, { key: KEY_C, refill: false }), halfV = full.landV;
  say('C ballistic', { peak: full.peak, air: full.air, flipFull: full.flipFull, landV: full.landV });
  near(full.peak, APEX_C * 0.97, APEX_C * 1.03, 'barrel hop (C) apex 3.72 m, +-3 %'); near(full.peak / hopRun(0.30, { refill: false }).peak, 1.95, 2.05, 'twice the simple hop');
  near(full.air, 1.30, 1.42, 'barrel hop airtime about 1.4 s (a ballistic one: the tank is spent)');
  assert.deepEqual(full.events.map((e) => e.type), ['hop', 'land'], 'one hop event, one land event'); assert.equal(full.events[0].flip, true, 'the hop event of C carries flip'); assert.equal(full.events[1].big, true, 'and the land event is flagged big');
  near(halfV, 10.2, 11.0, 'a ballistic barrel hop touches down at about 10.7 m/s'); near(full.boostBefore - full.boostAfter, H.costFlip - 0.01, H.costFlip + 0.01, 'the barrel hop costs 0.45 of the tank');
  assert(full.minAboveRoad >= -1e-9, 'never below the road, not even in a hard ballistic landing'); assert(!full.car.air && full.car.h === 0 && full.car.vy === 0 && Math.abs(full.car.y - full.car.groundAt(0, 0)) < 1e-6, 'and it ends on the road, level');
  assert.equal(full.afterMaxH, 0, 'no bounce after the touchdown'); assert.equal(full.reAir, false); assert.equal(full.car.boost, 0, 'the tank is spent');
  assert(!full.events.some((e) => e.type === 'hit'), 'the landing is no collision: no damage event');
  // (c) the roll: one turn of 360 degrees, done by about 85 % of the (ballistic) airtime, exactly 0 at the touchdown; the physics car stays upright
  near(full.flipFull, 1.10, 1.24, 'the roll completes (360 degrees) at about 85 % of the ballistic 1.37 s'); assert(full.flipFull <= full.air * 0.87 + 1e-9, `and well before the touchdown (${full.flipFull.toFixed(2)} of ${full.air.toFixed(2)} s)`);
  assert.equal(full.flipAtLand, 0, 'the roll is exactly 0 at the touchdown'); assert.equal(full.flipOnAtLand, false); assert.equal(full.car.flip, 0); assert(Math.abs(full.flipMax - TAU) < 1e-9, 'one full turn, no more: ' + full.flipMax);
  assert(Math.abs(full.car.roll) < 0.1 && Math.abs(full.car.pitch) < 0.2, 'the physics car stays upright (car.roll / car.pitch are the body lean only)');
  // (d) a C hop on a refilling full tank: the same apex, a soft cushioned landing, the roll is long done when the cushion fires
  const cush = hopRun(1, { key: KEY_C });
  say('C cushioned', { peak: cush.peak, air: cush.air, flipFull: cush.flipFull, landV: cush.landV, events: cush.events.map(evName) });
  near(cush.peak, APEX_C * 0.97, APEX_C * 1.03, 'cushioned barrel hop apex'); assert.deepEqual(cush.events.map((e) => e.type), ['hop', 'cushion', 'land'], 'hop, cushion, land');
  near(cush.landV, 1.5, 2.2, 'the landing cushion softens the barrel hop (about 1.8 m/s)'); near(cush.air, 1.45, 1.75, 'cushioned barrel hop airtime (the landing jets add about 0.25 s over the ballistic 1.37 s)');
  near(cush.boostAfter + car0Refill(cush) - cush.boostLand, 0.03, 0.12, 'the tank spent by the landing jets (about 0.06)'); assert(cush.minAboveRoad >= -1e-9, 'never below the road (cushioned)');
  assert(cush.flipFull < cush.air * 0.8, 'the roll is done before the cushion fires'); assert.equal(cush.flipAtLand, 0); assert.equal(cush.afterMaxH, 0); assert.equal(cush.reAir, false);
  for (const dt of [1 / 30, 1 / 144]) { const r = hopRun(1, { key: KEY_C, dt }); near(r.peak, APEX_C * 0.97, APEX_C * 1.03, `C apex at ${(1 / dt).toFixed(0)} fps`); near(r.landV, 1.5, 2.2, `soft landing at ${(1 / dt).toFixed(0)} fps`); assert(r.minAboveRoad >= -1e-9); assert.equal(r.flipAtLand, 0); }
  // (e) the tank: C needs 0.45 (a short tank = no hop at all, never a half hop, a 'dry' event), X needs 0.28 and C's key does nothing for it
  { const r = hopRun(H.minTankFlip - 0.01, { key: KEY_C, refill: false }); assert.deepEqual(r.events.map((e) => e.type), ['dry'], 'C on a tank of 0.44: nothing but the dry event'); assert.equal(r.events[0].flip, true); assert.equal(r.peak, 0); assert.equal(r.car.boost, H.minTankFlip - 0.01, 'and the tank is untouched'); assert(!r.car.air && r.car.flip === 0 && r.car.vy === 0); }
  { const r = hopRun(0.30, { key: KEY_C, refill: false }); assert.deepEqual(r.events.map((e) => e.type), ['dry'], 'C on a tank of 0.30 (enough for X): no hop at all'); assert.equal(r.peak, 0); assert.equal(r.car.boost, 0.30); }
  { const r = hopRun(H.minTankFlip - 0.01, { key: KEY_X, refill: false }); assert.equal(r.events[0].type, 'hop'); assert.equal(r.events[0].flip, false, 'X on a tank of 0.44 is the simple hop'); }
  { const r = hopRun(H.minTankFlip, { key: KEY_C, refill: false }); assert.equal(r.events[0].type, 'hop', 'C on exactly 0.45 hops'); assert(r.car.boost >= 0, 'the tank never goes negative'); }
  // (f) the roll direction: the held steering picks the side (steer > 0 = left = negative), else to the right
  {
    const dir = (steer) => { const car = make('roadster'); let d = 0; for (let i = 0; i < 100; i++) { car.step(DT, { ...NONE, steer: i < 3 ? 0 : steer, flip: i > 3 }); if (car.air && car.flipOn && Math.abs(car.flip) > 0.2) { d = Math.sign(car.flip); break; } } return d; };
    assert.equal(dir(0), 1, 'no steering: the roll goes to the right (+)'); assert.equal(dir(-1), 1, 'steering right: to the right (+)'); assert.equal(dir(1), -1, 'steering left (steer > 0): to the left (-)');
  }
  { // an early landing (the road came up under the roll) ends it at once: the flip is exactly 0 in the step that lands
    const car = make('roadster'); let landed = false, mid = 0;
    for (let i = 0; i < 200 && !landed; i++) {
      car.step(DT, { ...NONE, flip: i > 3 });
      if (car.air && car.flipOn && car.flipT > 0.3 && !mid) { mid = car.flip; car.y = car.groundAt(0, 0) + 0.02; car.vy = -3; car.h = 0.02; }
      if (car.events.some((e) => e.type === 'land')) { landed = true; assert.equal(car.flip, 0, 'an early landing: the roll is exactly 0'); assert.equal(car.flipOn, false); assert.equal(car.pulse0 + car.pulse1, 0); }
    }
    assert(landed && Math.abs(mid) > 0.3, 'forced an early landing in the middle of the roll (' + mid.toFixed(2) + ' rad)');
  }
  // (g) the simple hop never rolls, burns small jets; the barrel hop's jets are the big ones; the side pulses exist only in the barrel hop
  { const x = hopRun(1, { key: KEY_X, steer: 1 }); assert.equal(x.flipMax, 0, 'X with steering: no roll'); assert.equal(x.car.jetK, 1);
    const car = make('roadster'); car.step(DT, { ...NONE, jump: true }); assert.equal(car.jetK, 1, 'X: small jets'); assert(car.jetT > 0.5 && car.jetT <= 0.55 + 1e-9, 'X: jets burn for about 0.55 s');
    const c = make('roadster'); c.step(DT, { ...NONE, flip: true }); assert(Math.abs(c.jetK - (1 + H.jetBig)) < 1e-9, 'C: big jets'); assert(c.jetT > 0.75 && c.jetT <= 0.8 + 1e-9, 'C: jets burn for about 0.8 s'); }
  // (h) obstacles: the barrel hop clears a 0.9 m bin and a kerb and a 1.6 m box, is stopped by a 2 m fence, a 2.6 m kiosk / bus shelter and a 3 m wall (the solids see the car no higher than clearMax over the road), buildings stay 2D walls
  for (const v of [15, 25]) {
    const o = (top) => crossing('roadster', v, top, { key: KEY_C });
    const bin = o(0.9), wall = o(3.0), kiosk = o(2.6), fence = o(2.0), kerb = o(0.4), low = o(1.6);
    say('barrel hop at', v, { bin: bin.z, wall: wall.z, kiosk: kiosk.z, fence: fence.z, maxH: bin.maxH });
    assert(bin.hopped && bin.maxH > 3.3 && bin.contact === 0 && bin.z > 50, `the barrel hop (apex ${bin.maxH.toFixed(2)} m) flies over a 0.9 m bin at ${v} m/s (contact ${bin.contact}, z ${bin.z.toFixed(1)})`);
    assert(kerb.contact === 0 && kerb.z > 50, 'and over a 0.4 m kerb'); assert(low.contact === 0 && low.z > 50, 'and over a 1.6 m box');
    assert(wall.contact > 0 && wall.z < 40, `a 3 m wall stops the barrel hop (z ${wall.z.toFixed(1)})`); assert(kiosk.contact > 0 && kiosk.z < 40, `a 2.6 m kiosk / bus-shelter-high box stops it too (z ${kiosk.z.toFixed(1)})`); assert(fence.contact > 0 && fence.z < 40, `and a 2 m fence (z ${fence.z.toFixed(1)})`);
    assert(bin.minAbove >= -1e-9, 'never below the road'); assert(bin.speed > 8, 'speed kept');
  }
}

// ---------------------------------------------------------------- 7. the sounds: the Roadster thrust hiss + valve thunk and the hop one-shots (no charge hiss); the others keep the old whoosh
{
  const mock = () => {
    const nodes = [];
    const param = (v = 0) => ({ value: v, log: [], setTargetAtTime(x) { this.log.push(x); this.value = x; }, setValueAtTime(x) { this.value = x; }, exponentialRampToValueAtTime(x) { this.value = x; } });
    const node = (kind, extra = {}) => { const n = { kind, connect() { return this; }, start() {}, stop() {}, gain: param(1), frequency: param(440), Q: param(1), type: 'lowpass', ...extra }; nodes.push(n); return n; };
    const ac = { currentTime: 0, state: 'running', sampleRate: 8000, destination: node('dest'), createGain: () => node('gain'), createOscillator: () => node('osc', { type: 'sine' }), createBiquadFilter: () => node('filter'),
      createWaveShaper: () => node('shaper'), createBufferSource: () => node('buf', { buffer: null, loop: false, loopStart: 0 }), createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }) };
    return { audio: { context: ac, muted: false, play() {} }, nodes };
  };
  const st = (o) => ({ rpm: 0.5, throttle: 1, drifting: false, vL: 0, boosting: false, gear: 1, speed: 80, ...o });
  const shots = (m) => m.nodes.filter((n) => n.kind === 'buf').length + m.nodes.filter((n) => n.kind === 'osc').length;
  const rm = mock(), rs = createCarSound(rm.audio, SOUND.roadster); rs.start();
  const hp = rm.nodes.filter((n) => n.kind === 'filter' && n.type === 'highpass')[0];
  assert.equal(hp.frequency.value, SOUND.roadster.jet.hp, 'the Roadster whoosh is high-passed at the jet profile frequency');
  rs.update(st({}), true);
  const before = shots(rm); rs.update(st({ boosting: true }), true); const afterOn = shots(rm); rs.update(st({ boosting: true }), true);
  assert.equal(afterOn - before, 2, 'the thrust opens with one valve thunk (a noise burst + a thump)'); assert.equal(shots(rm), afterOn, 'and not again while it burns');
  const gains = rm.nodes.filter((n) => n.kind === 'gain' && n.gain.log.includes(SOUND.roadster.jet.gain)); assert(gains.length === 1, 'the whoosh gain is the jet profile gain 0.16');
  rs.update(st({}), true); rs.update(st({ boosting: true }), true); assert.equal(shots(rm) - afterOn, 2, 'a new thrust thunks again');
  const s0 = shots(rm); rs.hop(); assert.equal(shots(rm) - s0, 2, 'hop(): a hiss and a thud'); rs.cushion(); assert.equal(shots(rm) - s0, 3, 'cushion(): a hiss'); rs.land(7.6); assert.equal(shots(rm) - s0, 5, 'land(v): a thud and a puff');
  rs.hop(true); assert.equal(shots(rm) - s0, 7, 'hop(true) (the barrel hop): the same two shots, fuller'); rs.flip(); assert.equal(shots(rm) - s0, 8, 'flip(): one whoosh'); rs.land(10.7, true); assert.equal(shots(rm) - s0, 10, 'land(v, big): a deeper thud and a puff');
  // no charge hiss any more: no 0.7-Q band-pass, and a stale c.charge changes nothing
  const sc = shots(rm); assert.equal(rm.nodes.filter((n) => n.kind === 'filter' && n.type === 'bandpass' && n.Q.value === 0.7).length, 0, 'there is no charging hiss band-pass');
  rs.update(st({ charge: 0.9 }), true); assert.equal(shots(rm), sc, 'update() adds no one-shots'); assert(!rm.nodes.some((n) => n.kind === 'gain' && n.gain.log.some((x) => Math.abs(x - (0.02 + 0.13 * 0.9)) < 1e-9)), 'and no charge gain');
  for (const profile of [null, SOUND.truck, SOUND.lada]) {
    const m = mock(), s = createCarSound(m.audio, profile); s.start(); s.update(st({}), true); const b = shots(m); s.update(st({ boosting: true }), true); s.update(st({ boosting: true }), true);
    assert.equal(shots(m), b, 'the other cars have no valve thunk'); assert(m.nodes.some((n) => n.kind === 'gain' && n.gain.log.includes(0.09)), 'and the old whoosh gain 0.09');
    assert(m.nodes.filter((n) => n.kind === 'filter' && n.type === 'highpass')[0].frequency.value === 1200, 'at the old 1200 Hz');
  }
}
console.log('PASS hop v3: X = 1.86 m / 1.0 s, C = 3.72 m / 1.4 s with a barrel roll (done by 85 % of the airtime, exactly 0 at touchdown / early landing); both start on the key-down step, edge only, no buffer, no charge; costs 0.28 / 0.45 with their tank gates (a short tank = a dry press, never a half hop); soft cushioned landing, safe ballistic one; 0.9 m bin cleared by both, a 2 m fence / 2.6 m shelter / 3 m wall stop both; coupe-truck-lada identical to ' + BASE_COMMIT + (Base ? '' : ' (SKIPPED: no git)'));
