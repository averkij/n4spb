// Run with node tools/area.mjs narvsky tools/narvskaya-karting-test.mjs,
// then again with kolomna. This covers the shared site and the speed targets.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createContext } from '../src/core/ctx.js';
import { Physics } from '../src/core/physics.js';
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
assert.ok(timer.view.direction === 'ccw' && timer.view.elapsed > 0, 'A reverse-direction crossing must start timing');
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
timer.update(null, time);
interval = .04;
for (let i = gateIndex + 2; i >= gateIndex - 1612; i--) sample(i);
assert.equal(timer.view.direction, 'ccw');
assert.ok(Math.abs(timer.view.last - 64.4) < .000001);
assert.equal(timer.view.best, timer.view.last);
timer.update(null, time);
interval = .03;
sample(gateIndex - 2);
sample(gateIndex + 2);
assert.equal(timer.view.best, last, 'The two directions keep separate results');
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
const slipAngles = { gentle: [], partial: [], tap: [], hard: [] };

for (const def of karts) {
  const { x, z } = def.parked;
  assert.ok(L.inPlay(x, z, 1) && !L.insideBuilding(x, z, .65) && !physics.columnBlocked(x, z, .65, .12, .66),
    `Blocked parking spot for ${def.id}`);
  const car = createHandling(ctx, def.tuning);
  const pedalTest = (thr, brk, steer = 0, entrySpeed = 12, steerFrames = 30, brakeDelay = 0) => {
    const initial = line[1300], next = line[1302];
    const yaw = Math.atan2(next.x - initial.x, next.z - initial.z);
    car.reset(initial.x, initial.z, yaw);
    car.vx = Math.sin(yaw) * entrySpeed;
    car.vz = Math.cos(yaw) * entrySpeed;
    let peakSlip = 0;
    for (let i = 0; i < 30; i++) {
      car.step(1 / 60, { thr, brk: i < brakeDelay ? 0 : brk, steer: i < steerFrames ? steer : 0 });
      assert.ok(!car.events.some(event => event.type === 'hit'), def.id + ' hit during brake test');
      peakSlip = Math.max(peakSlip, Math.atan2(Math.abs(car.vL), car.vF));
    }
    return { load: car.frontLoad, speed: car.speed, turn: Math.abs(car.yaw - yaw), peakSlip };
  };
  const coast = pedalTest(0, 0);
  const halfBrake = pedalTest(0, .5);
  const fullBrake = pedalTest(0, 1);
  assert.ok(pedalTest(1, 0).load < coast.load - .025, def.id + ' must transfer load back under throttle');
  assert.ok(fullBrake.load > halfBrake.load && halfBrake.load > coast.load, def.id + ' must transfer load forward under braking');
  assert.ok(coast.speed > halfBrake.speed && halfBrake.speed > fullBrake.speed, def.id + ' must respond to partial braking');
  // At 72 km/h, a small steering input builds a few degrees of slip before
  // larger inputs can rotate the kart. Include a brief full-lock key press.
  const gentle = pedalTest(0, 1, .12, 20);
  const partial = pedalTest(0, .5, .12, 20);
  const trail = pedalTest(0, 1, .12, 20, 30, 8);
  const hard = pedalTest(0, 1, 1, 20);
  const tap = pedalTest(0, 1, 1, 20, 8);
  assert.ok(gentle.turn > .08 && gentle.peakSlip > .015 && gentle.peakSlip < .07,
    `${def.id}: gentle 72 km/h brake turn must build controlled slip (${gentle.peakSlip} rad)`);
  assert.ok(partial.turn > .08 && partial.peakSlip < .13 && partial.speed > gentle.speed,
    `${def.id}: a light turn under partial braking must also stay stable (${partial.peakSlip} rad)`);
  assert.ok(trail.turn > .08 && trail.peakSlip < .11,
    `${def.id}: adding the brake after turn-in must stay stable (${trail.peakSlip} rad)`);
  assert.ok(hard.peakSlip > gentle.peakSlip + .08 && tap.peakSlip < hard.peakSlip,
    `${def.id}: a larger steering demand must produce more slip (tap ${tap.peakSlip}, held ${hard.peakSlip} rad)`);
  assert.ok(gentle.speed > 61 && tap.speed > 58 && tap.peakSlip < .19,
    def.id + ' lost too much speed or grip during a small correction');
  for (const [mode, result] of Object.entries({ gentle, partial, tap, hard })) {
    slipAngles[mode].push(THREE.MathUtils.radToDeg(result.peakSlip));
  }
  // Enter the straight at 61.2 km/h and lift through the right-hand bend.
  // Measure at the owner’s reference before steering left.
  let index = 1278;
  const initial = line[index], next = line[index + 2];
  const yaw = Math.atan2(next.x - initial.x, next.z - initial.z);
  car.reset(initial.x, initial.z, yaw);
  car.vx = Math.sin(yaw) * 17;
  car.vz = Math.cos(yaw) * 17;
  for (let frame = 0; frame < 1200 && index < checkpoint; frame++) {
    index = nearest(Math.max(0, index - 2), Math.min(line.length - 1, index + 14),
      j => Math.hypot(car.x - line[j].x, car.z - line[j].z));
    const ahead = line[index + Math.round(18 + car.speed * .32)];
    const error = Math.atan2(ahead.x - car.x, ahead.z - car.z) - car.yaw;
    const steer = THREE.MathUtils.clamp(Math.atan2(Math.sin(error), Math.cos(error)) * 2.1, -1, 1);
    const lift = index > 1370 && index < 1430;
    car.step(1 / 60, { thr: lift ? .25 : 1, brk: 0, steer, nitro: true });
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
for (const [mode, values] of Object.entries(slipAngles)) {
  console.log(`${mode} steering under braking: ${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)}° peak body slip`);
}
console.log(`${process.env.AREA}: approach, start-finish and all 20 karts OK`);

const kerbNormal = new THREE.Vector3();
let kerb;
for (const u of [.14, .24, .40, .58, .70, .84, .92]) {
  const center = course.racingLine.getPointAt(u);
  const tangent = course.racingLine.getTangentAt(u);
  for (const sign of [-1, 1]) {
    kerbNormal.set(-tangent.z * sign, 0, tangent.x * sign);
    const samples = new Map();
    for (let offset = 3.6; offset < 4.6; offset += .012) {
      const p = center.clone().addScaledVector(kerbNormal, offset);
      const plane = course.kerbAt(p.x, p.z);
      if (plane && !samples.has(plane.section)) samples.set(plane.section, { p, plane });
    }
    if (samples.size === 3) { kerb = [...samples.values()]; break; }
  }
  if (kerb) break;
}
assert.ok(kerb, 'The track must expose the three kerb surfaces to wheel physics');
const [ramp, crown, outside] = kerb;
const grade = ({ plane }) => Math.hypot(plane.gx, plane.gz);
assert.ok(grade(ramp) > .25 && grade(crown) < .20 && grade(outside) > grade(ramp) + .15);
assert.ok(course.deckY(crown.p.x, crown.p.z) > course.deckY(ramp.p.x, ramp.p.z) + .035);

const kart = karts[0];
const model = kart.makeModel();
model.root.updateMatrixWorld(true);
const size = new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3());
assert.ok(Math.abs(size.x - 1.332) < .005 && Math.abs(size.z - 1.914) < .005, 'The Blender model must keep SR5 dimensions');

const kerbCar = createHandling(ctx, kart.tuning);
const yaw = Math.atan2(outside.plane.gx, outside.plane.gz) + .55;
const forwardX = Math.sin(yaw), forwardZ = Math.cos(yaw);
const halfWheelbase = kart.spec.wb * .5, halfTrack = kart.spec.track * .5;
kerbCar.reset(outside.p.x - forwardX * halfWheelbase - forwardZ * halfTrack,
  outside.p.z - forwardZ * halfWheelbase + forwardX * halfTrack, yaw);
kerbCar.vx = forwardX * 11;
kerbCar.vz = forwardZ * 11;
kerbCar.step(1 / 120, { thr: 0, brk: 0, steer: 0 });
assert.ok(kerbCar.flight.n > 0 && kerbCar.vyF > .4 && Math.abs(kerbCar.impactSpin) > .03,
  'A fast, oblique outside-kerb strike must yaw the kart and lift it');

const club = karts[10];
const flat = {
  physics: new Physics(() => 0),
  services: {},
  L: { WORLD: { play: {} }, inPlay: () => true, heightAt: () => 0, insideBuilding: () => false },
};
const flatKart = createHandling(flat, club.tuning);
function stepKart(frames, thr, brk, steer) {
  for (let i = 0; i < frames; i++) flatKart.step(1 / 60, { thr, brk, steer });
}
function cornerExit(releaseFrames) {
  flatKart.reset(0, 0, 0);
  flatKart.vz = 20;
  stepKart(27, 0, 1, .45);
  stepKart(releaseFrames, 0, 0, 0);
  if (releaseFrames) assert.ok(Math.abs(flatKart.steerAngle) < .005, 'The wheel must recenter during a 0.2 s release');
  stepKart(10, 1, 0, 0);
  const slip = Math.atan2(Math.abs(flatKart.vL), flatKart.vF);
  const previousYaw = flatKart.yaw;
  stepKart(12, 1, 0, .25);
  assert.ok(flatKart.yaw > previousYaw + .035 && flatKart.speed > 62,
    'Turning in again under power must carry speed on the corner exit');
  return slip;
}
assert.ok(cornerExit(0) > cornerExit(12) * 2, 'A brief release before throttle must let the rear settle');

flatKart.reset(0, 0, 0);
flatKart.vz = 15;
stepKart(72, .35, 0, 1);
const lateralG = Math.abs(flatKart.aLat) / 9.81;
const turnRadius = (flatKart.vx ** 2 + flatKart.vz ** 2) / Math.abs(flatKart.aLat);
assert.ok(lateralG > 1.08 && lateralG <= 1.21 && turnRadius > 16 && turnRadius < 21,
  `Flat corner grip or radius outside expected range: ${lateralG} g, ${turnRadius} m`);
console.log(`Flat corner: ${lateralG.toFixed(2)} g, radius ${turnRadius.toFixed(1)} m at ${flatKart.speed.toFixed(1)} km/h`);

const moreGrip = createHandling(flat, { ...club.tuning, kerbAt: () => ({ gx: 0, gz: 0 }) });
moreGrip.reset(0, 0, 0);
moreGrip.vz = 15;
for (let i = 0; i < 72; i++) moreGrip.step(1 / 60, { thr: .35, brk: 0, steer: 1 });
assert.ok(Math.abs(moreGrip.aLat) > Math.abs(flatKart.aLat) * 1.12, 'Kerb contact must raise available lateral grip');

for (const steer of [-1, 1]) {
  flatKart.reset(0, 0, 0);
  flatKart.vz = 1.5;
  stepKart(30, 0, 0, steer);
  assert.ok(flatKart.steerAngle * steer > .20 && flatKart.yaw * steer > .05);
  for (const entrySpeed of [0, -1.5]) {
    flatKart.reset(0, 0, 0);
    flatKart.vz = entrySpeed;
    for (let i = 0; i < 45; i++) {
      stepKart(1, 0, 1, steer);
      assert.ok(flatKart.steerAngle * steer > 0, 'The wheels must keep the requested direction as the kart starts to reverse');
    }
    const rearX = flatKart.x - Math.sin(flatKart.yaw) * halfWheelbase;
    assert.ok(flatKart.vF < -1 && flatKart.yaw * steer < -.08 && rearX * steer > 0,
      'The rear must follow the steered direction while reversing');
  }
}

const sampleAsphalt = course.racingLine.getPointAt(.14);
const sampleLawn = crown.p.clone().addScaledVector(kerbNormal, 1);
assert.equal(course.roughnessAt(sampleAsphalt.x, sampleAsphalt.z), 0, 'Track centre must be smooth');
assert.equal(course.roughnessAt(sampleLawn.x, sampleLawn.z), 1, 'Verge beyond the kerb must be rough');
assert.equal(course.roughnessAt(-4670, 3569), 0, 'Paddock pavement must be smooth');
function coastForOneSecond(roughnessAt) {
  const car = createHandling(flat, { ...club.tuning, roughnessAt });
  car.reset(0, 0, 0);
  car.vz = 20;
  for (let i = 0; i < 60; i++) car.step(1 / 60, { thr: 0, brk: 0, steer: 0 });
  return car.speed;
}
const pavedSpeed = coastForOneSecond(() => 0);
const vergeSpeed = coastForOneSecond(x => x > 0 ? 1 : 0);
const lawnSpeed = coastForOneSecond(() => 1);
assert.ok(pavedSpeed > vergeSpeed + 7 && vergeSpeed > lawnSpeed + 7,
  'Two tyres on the verge must slow the kart less than all four tyres on grass');
console.log(`Coasting from 72 km/h for 1 s: asphalt ${pavedSpeed.toFixed(1)}, two wheels on grass ${vergeSpeed.toFixed(1)}, grass ${lawnSpeed.toFixed(1)} km/h`);
