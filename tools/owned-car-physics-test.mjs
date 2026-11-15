import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Physics } from '../src/core/physics.js';
import { getCarWrecks } from '../src/world/drive/wrecks.js';
import { createParkedPhysics } from '../src/world/drive/parked-physics.js';
import { createCarDamage } from '../src/world/drive/damage.js';
import { createHandling } from '../src/world/drive/handling.js';
import { trafficSpec, trafficTuning } from '../src/world/drive/vehicle-profiles.js';
import { ARCH } from '../src/world/traffic/fleetdata.js';

const physics = new Physics(() => 0), scene = new THREE.Scene();
const ctx = { physics, services: {}, mat: { toon: () => new THREE.MeshBasicMaterial() }, add: o => scene.add(o), onUpdate() {},
  L: { inPlay: () => true, heightAt: () => 0, insideBuilding: () => false } };
const wrecks = await getCarWrecks(ctx), owned = createParkedPhysics(wrecks);
function vehicle(kind, x) {
  const spec = trafficSpec(kind, ARCH[kind]);
  const root = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(spec.W, spec.hgt, spec.len), new THREE.MeshBasicMaterial());
  root.add(body);
  const v = { id: 'traffic-car-' + x, kind: 'traffic', def: { traffic: { model: kind } }, spec,
    parked: { x, y: .03, z: 10, yaw: 0 }, car: createHandling(ctx, trafficTuning(kind, ARCH[kind])) };
  v.damage = createCarDamage({ root, body }, { spec });
  v.car.reset(x, 10, 0);
  park(v);
  return v;
}
function park(v) {
  const p = v.parked, spec = v.spec;
  v.box = physics.addBox(p.x, p.z + spec.centerZ, spec.W, spec.len, p.yaw, 0, spec.hgt);
  owned.attach(v, v.box);
}
function driveInto(v) {
  const attacker = createHandling(ctx, trafficTuning('sedan', ARCH.sedan));
  attacker.reset(v.parked.x, 0, 0); attacker.vz = 22;
  for (let i = 0; i < 120; i++) { wrecks.step(1 / 120); attacker.step(1 / 120, { thr: 0, brk: 0, steer: 0 }); owned.sync(v); }
  return attacker;
}
const light = vehicle('hatch', 0), heavy = vehicle('truck', 100);
driveInto(light); driveInto(heavy);
assert(light.parked.z > 10.5, 'an owned/promoted parked car moves after a real player-car collision');
assert(heavy.parked.z > 10.1, 'a heavy owned car also moves');
assert(light.parked.z - 10 > heavy.parked.z - 10, 'own mass controls the displacement');
assert(light.damage.state.rear > 0 && heavy.damage.state.rear > 0, 'both owned shells take damage at the actual contact');
assert.equal(light.damage.state, light.parkedPhysics.record.damageState, 'the rendered shell and wreck keep one damage state');
assert.equal(light.car.z, light.parked.z, 'the logical pose follows the body for entry and shed fragments');
for (let i = 0; i < 600; i++) { wrecks.step(1 / 120); owned.sync(light); owned.sync(heavy); }
assert(Math.abs(light.parkedPhysics.record.wreckSource.vz) < .03, 'owned cars use stopping tyre traction');
const damage = light.damage.amount, pose = { ...light.parked }, oldRecord = light.parkedPhysics.record;
owned.release(light); physics.remove(light.box); light.box = null;
physics.refreshDynamic();
assert.equal(oldRecord.wreckBody, null, 'boarding releases the old body');
assert(!physics._dynItems.some(b => b.source.record === oldRecord), 'boarding leaves no duplicate dynamic collider');
assert.equal(light.damage.amount, damage, 'boarding preserves damage');
assert.deepEqual(light.parked, pose, 'boarding preserves its latest position');
park(light);
const secondSource = light.parkedPhysics.source;
secondSource.applyCarImpulse(light.spec.mass * 5, 0, light.parked.x, light.parked.z);
for (let i = 0; i < 60; i++) { wrecks.step(1 / 120); owned.sync(light); }
assert(light.parked.x > pose.x + .5, 'exiting/reparking creates another movable car, never an immovable duplicate');
owned.release(light); owned.release(heavy);
assert.equal(wrecks.stats.cars, 0, 'demoting/releasing the owned vehicles clears every active body');
const boat = { kind: 'boat' }; owned.attach(boat, {}); assert.equal(boat.parkedPhysics, undefined, 'boat physics stays separate');
console.log('PASS owned cars: real collisions transfer mass-dependent motion and damage, tyre stopping, entry release, repark and clean demotion');
