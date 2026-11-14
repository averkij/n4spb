// Run with node tools/area.mjs narvsky tools/narvskaya-karting-test.mjs,
// then again with kolomna. This covers the shared site and the speed targets.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createContext } from '../src/core/ctx.js';
import { build } from '../src/world/kartingNarvskaya.js';
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

const [checkX, checkZ] = course.speedCheck;
const checkpoint = nearest(0, line.length - 1, i => Math.hypot(line[i].x - checkX, line[i].z - checkZ));
const speeds = { rental: [], club: [] };

for (const def of karts) {
  const { x, z } = def.parked;
  assert.ok(L.inPlay(x, z, 1) && !L.insideBuilding(x, z, .65) && !physics.columnBlocked(x, z, .65, .12, .66),
    `Blocked parking spot for ${def.id}`);
  const car = createHandling(ctx, def.tuning);
  // Enter the back straight at 43.2 km/h. A look-ahead steering controller
  // keeps the kart on the course through the bend before the measurement line.
  let index = 1225;
  const initial = line[index], next = line[index + 2];
  const yaw = Math.atan2(next.x - initial.x, next.z - initial.z);
  car.reset(initial.x, initial.z, yaw);
  car.vx = Math.sin(yaw) * 12;
  car.vz = Math.cos(yaw) * 12;
  for (let frame = 0; frame < 1200 && index < checkpoint; frame++) {
    index = nearest(Math.max(0, index - 2), Math.min(line.length - 1, index + 14),
      j => Math.hypot(car.x - line[j].x, car.z - line[j].z));
    const ahead = line[index + Math.round(14 + car.speed * .21)];
    const error = Math.atan2(ahead.x - car.x, ahead.z - car.z) - car.yaw;
    const steer = THREE.MathUtils.clamp(Math.atan2(Math.sin(error), Math.cos(error)) * 2.1, -1, 1);
    car.step(1 / 60, { thr: 1, brk: 0, steer, nitro: true });
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
