// Real destination drive module, run with each-live-area.mjs. No GPU required.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { makeHo, encodeHo, decodeHo, validateHo, arrivalUrl } from '../src/core/handoff.js';
import { carHandoff, planArrival } from '../src/core/gates.js';
import { createKart } from '../src/world/karting/karts.js';
import { loadKarts } from '../src/world/karting/fleet.js';
import { mainModules } from './modules-list.mjs';

const { ctx, L } = await buildWorld({ modules: [] });
const A = await import('../src/world/area.js');
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
const { build } = await import('../src/world/drive.js');
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const dom = { addEventListener() {}, requestPointerLock() {} };
const player = new Player(ctx.camera, dom, ctx.physics, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
let terrain = 'asphalt';
ctx.services.environment = { kindAt: () => terrain };
const hasVenue = mainModules().includes('kartingNarvskaya');
if (hasVenue) ctx.services.kartingNarvskaya = { loadVehicles: () => loadKarts(ctx, {}) };
await build(ctx);
assert.equal(ctx.drive.karts.length, hasVenue ? 20 : 0, 'no unsolicited kart fleet outside the venue');
const ids = ['rental', 'club'].flatMap(f => Array.from({ length: 10 }, (_, i) => `narvskaya-${f}-${i + 1}`));
for (const id of ids) {
  const ho = makeHo({ from: 'narvsky', to: A.ID, via: 'place', car: { id, kind: 'kart', view: 1 } });
  assert.equal(validateHo(ho).ok, true);
  assert.deepEqual(decodeHo(encodeHo(ho)).ho, ho);
  const def = createKart(ctx, id, { x: 1, z: 2, yaw: 0 });
  assert.equal(def.id, id); assert.equal(def.tuning.noBoost, true);
  const bad = structuredClone(ho); bad.car.id = 'narvskaya-club-11';
  assert.equal(validateHo(bad).ok, false);
}
for (const id of ['narvskaya-club-0', 'narvskaya-club-01', 'narvskaya-club-11', 'narvskaya-rental-2/xx', 'coupe']) {
  assert.equal(createKart(ctx, id, {}), null);
  assert.equal(validateHo(makeHo({ from: 'narvsky', to: A.ID, car: { id, kind: 'kart' } })).ok, false);
}

for (const [id, legacy] of [['narvskaya-rental-1', false], ['narvskaya-club-10', false], ['narvskaya-rental-7', true]]) {
  const old = ctx.drive;
  if (old.active) old.exit(true);
  for (const v of old.vehicles) { if (v.box) ctx.physics.remove(v.box); v.model.root.removeFromParent(); }
  const ho = makeHo({ from: 'narvsky', to: A.ID, via: 'place', car: { id, kind: legacy ? undefined : 'kart', view: 1 } });
  const url = arrivalUrl({ page: 'index.html', pose: { x: L.HERO.x, z: L.HERO.z, yaw: L.HERO.yaw }, ho });
  const arrival = planArrival({ L, A, params: new URL(url, 'http://local/').searchParams });
  assert.ok(arrival && !arrival.invalid); assert.equal(arrival.mode, 'car');
  ctx.handoff = arrival;
  await build(ctx);
  const d = ctx.drive;
  assert.equal(d.karts.length, hasVenue ? 20 : 1);
  assert.equal(d.vehicles.filter(v => v.id === id).length, 1, 'incoming kart is not duplicated in the pits');
  assert.equal(d.vehicleById(id).box, null, 'incoming kart has no blocking parked collider');
  assert.equal(d.arrive(arrival.ho.car, arrival.pose.x, arrival.pose.z, arrival.pose.yaw), true, `${A.ID}: arrival failed`);
  assert.equal(d.active, true); assert.equal(d.vehicle.kind, 'kart'); assert.equal(d.vehicle.id, id);
  assert.equal(d.view.mode, 1);
  const reference = createKart(ctx, id, {});
  for (const key of ['acc', 'vmax', 'engineFalloff', 'brake', 'steerLock', 'steerOut', 'frontMu', 'rearMu', 'tyres', 'physicalReverseSteer']) {
    assert.equal(d.car.tuning[key], reference.tuning[key], `${key} changed at the border`);
  }
  terrain = 'grass'; assert.equal(d.car.tuning.roughnessAt(d.car.x, d.car.z), 1);
  terrain = 'asphalt'; assert.equal(d.car.tuning.roughnessAt(d.car.x, d.car.z), 0);
  const outgoing = makeHo({ from: A.ID, to: 'kolomna', car: carHandoff(d) });
  assert.equal(outgoing.car.kind, 'kart'); assert.equal(outgoing.car.id, id);
  assert.equal(validateHo(outgoing).ok, true);
  assert.equal(d.exit(true), true);
  assert.ok(d.vehicle.box, 'leaving the kart parks a solid vehicle');
  assert.equal(d.requestEnter(id), true, 'parked kart can be boarded again');
}
console.log(`PASS ${A.ID}: portable rental/club/legacy kart arrivals, departure, tuning, surfaces, boarding and fleet identity; 20 protocol identities`);
