// Run with node tools/area.mjs narvsky tools/narvskaya-karting-test.mjs,
// then again with kolomna. This covers the shared site and the speed targets.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createContext } from '../src/core/ctx.js';
import { build } from '../src/world/kartingNarvskaya.js';
import { createLapTimer } from '../src/world/karting/laps.js';
import { WALK_IN } from '../src/world/karting/site.js';
import { createHandling } from '../src/world/drive/handling.js';

const ctx = createContext({
  scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
  quality: { name: 'medium' }, sunDir: new THREE.Vector3(1, 1, 1).normalize(),
});
build(ctx);

const course = ctx.services.kartingNarvskaya;
const line = course.racingLine.getSpacedPoints(1610);
const karts = course.loadVehicles();
assert.equal(karts.length, 20);
assert.equal(new Set(karts.map(kart => kart.id)).size, 20);
assert.ok(course.length > 800 && course.length < 815);
assert.ok(course.start, 'The start-finish gate must intersect the course');

const { L, physics } = ctx;
for (let i = 1; i < WALK_IN.length; i++) {
  const [a, b] = [WALK_IN[i - 1], WALK_IN[i]];
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
  for (let j = 0; j <= n; j++) {
    const x = a[0] + (b[0] - a[0]) * j / n, z = a[1] + (b[1] - a[1]) * j / n;
    const p = { x, z };
    physics.resolve(p, .34, 0, 1.7);
    assert.ok(L.inPlay(x, z, .34) && !L.insideBuilding(x, z, .32) && Math.hypot(p.x - x, p.z - z) < .1,
      `Blocked stadium approach at ${x}, ${z}`);
  }
}

const nearest = (a, b, fn) => {
  let best = a, distance = fn(a);
  for (let i = a + 1; i <= b; i++) {
    const candidate = fn(i);
    if (candidate < distance) { best = i; distance = candidate; }
  }
  return best;
};

const timer = createLapTimer(course);
const gateIndex = nearest(0, line.length - 2, i => Math.hypot(line[i].x - course.start[0], line[i].z - course.start[1]));
const pointAt = i => line[(i + line.length - 1) % (line.length - 1)];
const timedKart = { x: 0, z: 0, poseRevision: 1 };
let time = 0, interval = .03;
function sample(i) {
  const p = pointAt(i);
  timedKart.x = p.x;
  timedKart.z = p.z;
  timer.update(timedKart, time);
  time += interval;
}

assert.equal(timer.view.visible, false);
sample(gateIndex + 2);
sample(gateIndex - 2);
assert.equal(timer.view.elapsed, null, 'A backwards crossing must not start timing');
sample(gateIndex + 2);
assert.ok(timer.view.visible && timer.view.elapsed > 0 && timer.view.elapsed < .03);
sample(gateIndex - 2);
sample(gateIndex + 2);
assert.equal(timer.view.last, null, 'Turning around must not complete a lap');
timer.update(null, time);
for (let i = gateIndex - 2; i <= gateIndex + 1612; i++) sample(i);
assert.ok(Math.abs(timer.view.last - 48.3) < .000001, 'The complete lap uses interpolated crossing times');
assert.equal(timer.view.best, timer.view.last);
const last = timer.view.last;
timedKart.x += 1000;
timer.update(timedKart, time);
assert.equal(timer.view.visible, false);
sample(gateIndex + 2);
assert.equal(timer.view.elapsed, null, 'Returning after leaving the track must reset the current lap');
assert.equal(timer.view.last, last);
sample(gateIndex - 2);
timedKart.poseRevision++;
sample(gateIndex + 2);
assert.equal(timer.view.elapsed, null, 'A respawn across the line must not start timing');
timer.update(null, time);

const [[ax, az], [bx, bz]] = course.startFinish;
const dx = bx - ax, dz = bz - az, span = Math.hypot(dx, dz);
for (const side of [-1, 1]) {
  timedKart.x = bx + 2 * (dx - side * dz) / span;
  timedKart.z = bz + 2 * (dz + side * dx) / span;
  timer.update(timedKart, time);
  time += interval;
}
assert.ok(timer.view.visible && timer.view.elapsed === null, 'Crossing beyond the gate must not start timing');

timer.update(null, time);
interval = .04;
for (let i = gateIndex - 2; i <= gateIndex + 1612; i++) sample(i);
assert.ok(timer.view.last > last && timer.view.best === last, 'A slower lap must retain the best time');
timer.update(null, time);
assert.equal(timer.view.visible, false);

const [checkX, checkZ] = course.speedCheck;
const checkpoint = nearest(0, line.length - 1, i => Math.hypot(line[i].x - checkX, line[i].z - checkZ));
const speeds = { rental: [], club: [] };

for (const def of karts) {
  const { x, z } = def.parked;
  assert.ok(L.inPlay(x, z, 1) && !L.insideBuilding(x, z, .65) && !physics.columnBlocked(x, z, .65, .12, .66),
    `Blocked parking spot for ${def.id}`);
  const car = createHandling(ctx, def.tuning);
  const pedalTest = (thr, brk, steer = 0) => {
    const initial = line[1290], next = line[1292];
    const yaw = Math.atan2(next.x - initial.x, next.z - initial.z);
    car.reset(initial.x, initial.z, yaw);
    car.vx = Math.sin(yaw) * 12;
    car.vz = Math.cos(yaw) * 12;
    for (let i = 0; i < 30; i++) car.step(1 / 60, { thr, brk, steer });
    return { load: car.frontLoad, speed: car.speed, turn: Math.abs(car.yaw - yaw), slide: Math.abs(car.vL) };
  };
  const coast = pedalTest(0, 0);
  const halfBrake = pedalTest(0, .5);
  const fullBrake = pedalTest(0, 1);
  assert.ok(pedalTest(1, 0).load < coast.load - .025, def.id + ' must transfer load back under throttle');
  assert.ok(fullBrake.load > halfBrake.load && halfBrake.load > coast.load, def.id + ' must transfer load forward under braking');
  assert.ok(coast.speed > halfBrake.speed && halfBrake.speed > fullBrake.speed, def.id + ' must respond to partial braking');
  const brakingTurn = pedalTest(0, 1, .12);
  assert.ok(brakingTurn.turn > .20 && brakingTurn.slide < 1.3, def.id + ' must remain steerable under full braking');
  // Enter the straight at 48.24 km/h and lift through the right-hand bend.
  // Measure at the owner’s reference before steering left.
  let index = 1278;
  const initial = line[index], next = line[index + 2];
  const yaw = Math.atan2(next.x - initial.x, next.z - initial.z);
  car.reset(initial.x, initial.z, yaw);
  car.vx = Math.sin(yaw) * 13.4;
  car.vz = Math.cos(yaw) * 13.4;
  for (let frame = 0; frame < 1200 && index < checkpoint; frame++) {
    index = nearest(Math.max(0, index - 2), Math.min(line.length - 1, index + 14),
      j => Math.hypot(car.x - line[j].x, car.z - line[j].z));
    const ahead = line[index + Math.round(18 + car.speed * .32)];
    const error = Math.atan2(ahead.x - car.x, ahead.z - car.z) - car.yaw;
    const steer = THREE.MathUtils.clamp(Math.atan2(Math.sin(error), Math.cos(error)) * 2.1, -1, 1);
    const lift = index > 1370 && index < 1430;
    car.step(1 / 60, { thr: lift ? .14 : 1, brk: 0, steer, nitro: true });
    assert.ok(!car.boosting && !car.events.some(event => event.type === 'hit'), def.id);
  }
  assert.equal(index, checkpoint, `${def.id} did not reach the speed reference`);
  const group = def.id.includes('-rental-') ? 'rental' : 'club';
  speeds[group].push(car.speed);
  const [min, max] = group === 'rental' ? [65, 67] : [71, 73];
  assert.ok(car.speed >= min && car.speed <= max, `${def.id}: ${car.speed.toFixed(2)} km/h outside ${min}–${max}`);
}

for (const [group, values] of Object.entries(speeds)) {
  assert.equal(values.length, 10);
  console.log(`${group}: ${Math.min(...values).toFixed(2)}–${Math.max(...values).toFixed(2)} km/h`);
}
console.log(`${process.env.AREA}: approach, start-finish and all 20 karts OK`);
