// node tools/area.mjs sampson tools/sampson-dock-test.mjs [--winter]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build as buildDrive } from '../src/world/drive.js';

assert.equal(process.env.AREA, 'sampson');
const winter = process.argv.includes('--winter');
const { ctx, L, errors } = await buildWorld({ season: winter ? 'winter' : 'summer' });
assert.deepEqual(errors, []);
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const player = new Player(ctx.camera, { addEventListener() {}, requestPointerLock() {} }, ctx.physics, L.WORLD.play);
player.enabled = true;
player.clampXZ = L.clampToPlay;
player.solidAt = L.insideBuilding;
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
await buildDrive(ctx);
const boat = ctx.drive.boats.find(b => b.id === 'boat-sampson');
assert(boat, 'configured craft must spawn on in-play water');

const stairs = ctx.services.environment.quay.allStairs.find(st => st.pier?.id === 'w1180036225#0');
assert(stairs?.walk, 'quay descent by the mapped pontoon');
const start = { x: stairs.x - stairs.nx*stairs.w/2, z: stairs.z - stairs.nz*stairs.w/2 };
const end = { x: stairs.endX - .6*stairs.tx, z: stairs.endZ - .6*stairs.tz };
const left = () => Math.hypot(player.pos.x - end.x, player.pos.z - end.z);
player.setPose(start.x, start.z, Math.atan2(-stairs.tx, -stairs.tz)*180/Math.PI, 0, stairs.topY, { stand: true });
player.keys.add('KeyW');
for (let i = 0; i < 240 && left() > .075; i++) player.update(1/60);
player.keys.clear();
assert(left() < .075 && Math.abs(player.pos.y - stairs.landingY) < .08, 'walked down to the dry lower tread');

const p = boat.parked;
ctx.camera.lookAt(p.x, p.y + .8, p.z);
player.inputLock = 0;
assert.equal(ctx.interact.update()?.labelEn, winter ? 'Ride snowmobile' : 'Get in the motor boat');
assert(ctx.interact.use() && ctx.drive.vehicle === boat);
const { x, z } = boat.car;
ctx.drive.sim(2.4, { thr: .78 });
assert(Math.hypot(boat.car.x - x, boat.car.z - z) > 5, 'clear departure along the embankment');
assert.notEqual(ctx.physics.waterLevel(boat.car.x, boat.car.z), null);
assert(ctx.drive.exit(true) && !ctx.drive.active);
console.log('PASS descent from Vyborgskaya Embankment, dry E boarding, departure and exit in ' + (winter ? 'winter' : 'summer'));
