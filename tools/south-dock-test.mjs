// Headless regression for the southern areas' local motor-boat docks.
// Run through tools/area.mjs with either kolomna or semyonovsky.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';

const { ctx, L, THREE, errors } = await buildWorld({ log: null });
assert.equal(errors.length, 0, errors.join('\n'));
const ph = ctx.physics;
const { GARAGE } = await import('../src/world/lib/area-tables.js');
assert.equal(GARAGE.boats.length, 1);
const dock = GARAGE.boats[0];
assert(L.inPlay(dock.x, dock.z, 10));
const water = ph.waterLevel(dock.x, dock.z);
assert.notEqual(water, null, 'dock is on water');
const { SPEC_BOAT } = await import('../src/world/drive/boat/handling.js');
const { carContact } = await import('../src/world/drive/collision.js');
const sy = Math.sin(dock.yaw), cy = Math.cos(dock.yaw);
for (let u = -2.6; u <= 3.01; u += 0.4) for (const v of [-1.45, 0, 1.45]) {
  const x = dock.x + sy * u + cy * v, z = dock.z + cy * u - sy * v;
  assert.notEqual(ph.waterLevel(x, z), null, `hull or clearance is dry at ${x},${z}`);
}
// Use the real boat collision rules, including clearance under a raised bridge
// ramp. Grow the hull by 0.5 m on each side for the dock clearance check.
const car = { x: dock.x, z: dock.z, y: water, yaw: dock.yaw, floats: true };
const clearance = { ...SPEC_BOAT, W: SPEC_BOAT.W + 1, len: SPEC_BOAT.len + 1 };
for (const it of ph.querySolids(dock.x, dock.z, 10)) {
  assert(!carContact(car, clearance, it), `solid ${it.type} at ${it.cx},${it.cz} intersects the docked hull`);
}

// Find an actual open approach from land to within boarding reach. Simulate a
// player instead of assuming that proximity in the map means physical access.
const dom = { addEventListener() {}, requestPointerLock() {} };
let approach = null;
const starts = process.env.AREA === 'kolomna' ? [[-4570.1, 1868.4]] : [[-1383.7, 793.4]];
for (let r = 6; r <= 25; r += 2) for (let a = 0; a < 360; a += 15) starts.push([dock.x + r * Math.cos(a * Math.PI / 180), dock.z + r * Math.sin(a * Math.PI / 180)]);
for (const [x, z] of starts) {
  if (approach) break;
  if (!L.inPlay(x, z, 4) || ph.waterLevel(x, z) !== null || L.insideBuilding(x, z, 1)) continue;
  const p = new Player(new THREE.PerspectiveCamera(), dom, ph, L.WORLD.play);
  p.enabled = true; p.clampXZ = L.clampToPlay; p.solidAt = L.insideBuilding; p.smoothing = 0;
  p.setPose(x, z, Math.atan2(-(dock.x - x), -(dock.z - z)) * 180 / Math.PI, 0);
  p.keys.add('KeyW');
  for (let n = 0; n < 360; n++) {
    p.time += 1 / 60; p.update(1 / 60);
    if (ph.waterLevel(p.pos.x, p.pos.z) !== null && Math.hypot(p.pos.x - dock.x, p.pos.z - dock.z) < 5) { approach = p; break; }
  }
}
assert(approach, 'no open approach from land to within boarding reach');
approach.keys.clear();
ctx.playerObj = approach;
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
ctx.interact = createInteract({ camera: ctx.camera, player: approach, ui: ctx.ui, doc: null });
const drive = await import('../src/world/drive.js');
await drive.build(ctx);
assert.equal(ctx.drive.boats.length, 1, 'local boat was not built');
assert.equal(ctx.drive.boats[0].id, dock.id);
assert(ctx.drive.enter(dock.id), 'boarding the local boat failed');
assert.equal(ctx.drive.vehicle.id, dock.id);
assert(ctx.drive.exit(true), 'exiting the local boat failed');
console.log(`PASS ${L.ID || process.env.AREA}: ${dock.id} at ${dock.x},${dock.z}; hull clear, open land approach, boarding and exit`);
