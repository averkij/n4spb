import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Physics } from '../src/core/physics.js';
import { Player } from '../src/core/player.js';
import { build } from '../src/world/drive.js';
import { createHandling } from '../src/world/drive/handling.js';
import { createKart } from '../src/world/karting/karts.js';

const { ctx, L } = await buildWorld({ modules: [] });
ctx.physics = new Physics(() => 0);
ctx.L = { ...L, inPlay: () => true, heightAt: () => 0, insideBuilding: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
ctx.playerObj = new Player(ctx.camera, { addEventListener() {} }, ctx.physics, L.WORLD.play);
document.body.classList = { toggle() {} };
ctx.services.kartingNarvskaya = { loadVehicles: () => [
  createKart(ctx, 'narvskaya-rental-1', { x: 0, z: 10, yaw: 0 }),
  createKart(ctx, 'narvskaya-rental-2', { x: 30, z: 10, yaw: 0 }),
] };
await build(ctx);

const [target, neighbour] = ctx.drive.karts;
const shell = kart => kart.model.root.getObjectByName('painted').geometry.attributes.position.array;
const pristine = shell(target).slice();
const attacker = createHandling(ctx, ctx.drive.fleet[0].def.tuning);
attacker.reset(0, 0, 0);
attacker.vz = 22;
const wrecks = ctx.services.carWrecks;
for (let i = 0; i < 120; i++) {
  wrecks.step(1 / 120);
  attacker.step(1 / 120, { thr: 0, brk: 0, steer: 0 });
}

assert(target.parkedPhysics.record.z > 10.5, 'the driven car moves the parked kart');
assert(target.damage.state.rear > 0, 'the impact damages the struck end');
assert.notDeepEqual(shell(target), pristine, 'the damaged shell visibly deforms');
assert.deepEqual(shell(neighbour), pristine, 'damage stays on the individual kart');
const displaced = target.parkedPhysics.record.z;
assert.equal(ctx.drive.enter(target.id), true);
assert.equal(target.box, null, 'boarding removes the parked collider');
assert.equal(wrecks.stats.cars, 0, 'boarding releases the struck vehicle body');
assert.equal(target.car.z, displaced, 'boarding starts at the displaced position');
assert(target.damage.state.rear > 0, 'boarding preserves the damage');
console.log('PASS parked kart collision, isolated shell damage and boarding after impact');
