// Real destination water and drive module, including areas with local docks.
// node tools/area.mjs smolny tools/handoff-boat-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { makeHo, arrivalUrl } from '../src/core/handoff.js';
import { planArrival, inUnion } from '../src/core/gates.js';
import { GATES, REGISTRY } from '../src/areas/registry.js';

const { ctx, L } = await buildWorld({ log: null });
const A = await import('../src/world/area.js');
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
const drive = await import('../src/world/drive.js');
const { loadBoats } = await import('../src/world/drive/boat/index.js');
const ph = ctx.physics;
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const player = new Player(ctx.camera, { addEventListener() {}, requestPointerLock() {} }, ph, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });

// Pick an actual water overlap with a neighbouring area; all hull probes stay
// wet and the destination inset keeps the boat away from its invisible edge.
const gates = GATES.filter(g => g.kind === 'edge' && g.to === A.ID);
let sample = null;
for (const g of gates) {
  for (const r of REGISTRY[g.from].play) {
    for (let x = r.x0; x <= r.x1 && !sample; x += 20) for (let z = r.z0; z <= r.z1 && !sample; z += 20) {
      if (!L.inPlay(x, z, 30) || !inUnion(REGISTRY[g.from].play, x, z, 30) || L.insideBuilding(x, z, 2)) continue;
      if (![[-6,0],[6,0],[0,-6],[0,6],[0,0]].every(([dx,dz]) => ph.waterLevel(x+dx,z+dz) !== null)) continue;
      if ([...ph.querySolids(x,z,8)].some(s => !s.boatPass && s.type !== 'hole' && s.y0 < ph.waterLevel(x,z)+2 && (s.y1 ?? s.top ?? Infinity) > ph.waterLevel(x,z))) continue;
      sample = { g, x, z };
    }
    if (sample) break;
  }
  if (sample) break;
}
assert.ok(sample, `no free water overlap into ${A.ID}`);
const { g, x, z } = sample;
const existing = loadBoats(ctx).some(v => v.id === 'boat');
if (!existing) assert(!loadBoats(ctx, { carry: { id: 'boat', x: L.HERO.x, z: L.HERO.z, yaw: 0 } }).some(v => v.id === 'boat'), 'a land arrival creates no carried boat on land');
const coast = { L: { inPlay: () => true }, physics: { waterLevel: (px, pz) => Math.hypot(px - 4, pz) < 0.1 ? 0 : null } };
const nearby = loadBoats(coast, { docks: [], carry: { id: 'coast_test', x: 0, z: 0, yaw: 0 } });
assert.equal(nearby.length, 1, 'a wet spot just beside a dry resolved point remains eligible for hull placement');
assert.equal(nearby[0].parked.x, 4);
assert.equal(loadBoats({ L: coast.L, physics: { waterLevel: () => null } }, { docks: [], carry: { id: 'coast_test', x: 0, z: 0, yaw: 0 } }).length, 0, 'no boat is created without nearby water');
const openWater = { L: { inPlay: () => true }, physics: { waterLevel: () => 0 } };
const localDock = [{ id: 'boat', dock: 'local', x: 10, z: 0, yaw: 0 }];
const sameDock = loadBoats(openWater, { docks: localDock, carry: { id: 'boat', dock: 'local', x: 0, z: 0, yaw: 0 } });
assert.equal(sameDock.length, 1, 'a shared named dock keeps one boat');
const differentDock = loadBoats(openWater, { docks: localDock, carry: { id: 'boat', dock: 'elsewhere', x: 0, z: 0, yaw: 0 } });
assert.equal(differentDock.length, 2, 'distinct docks with the same local id keep both boats');
assert.equal(new Set(differentDock.map(v => v.id)).size, 2);
assert.equal(differentDock.find(v => v.carried).carriedFrom, 'boat');
const returnHome = loadBoats(openWater, { docks: localDock, carry: { id: 'boat_carry', dock: 'local', x: 0, z: 0, yaw: 0 } });
assert.equal(returnHome.length, 1, 'a renamed boat reuses its original dock when it returns');
const ho = makeHo({ from: g.from, to: g.to, gate: g.id, car: { id: 'boat', kind: 'boat', view: 1, d: [0,0,0,0] } });
const url = arrivalUrl({ page: REGISTRY[g.to].page, pose: { x, z, yaw: 0, pitch: 0 }, ho });
const h = planArrival({ L, A, params: new URL(url, 'http://localhost/').searchParams });
assert.equal(h.invalid, undefined);
assert.equal(h.ho.car.kind, 'boat');
assert.equal(h.mode, 'car');
assert.equal(h.how, 'direct');
assert.equal(h.pose.x, x); assert.equal(h.pose.z, z);
ctx.handoff = h;
await drive.build(ctx);
const d = ctx.drive;
assert.ok(d);
const v = d.vehicleById('boat');
assert.ok(v && v.def.carried === !existing, 'the destination reuses its dock boat or creates the carried boat');
assert.equal(d.boats.filter(b => b.id === 'boat').length, 1, 'the boat id occurs only once');
if (!existing) assert.equal(v.box, null, 'the carried boat has no parked collider at the arrival pose');
assert.ok(d.arrive(h.ho.car, x, z, h.pose.yaw));
assert.ok(d.active && d.vehicle === v && d.car.floats);
assert.ok(ph.waterLevel(d.car.x, d.car.z) !== null);
assert.equal(d.view.mode, 1);
assert.ok(d.exit(true));
assert.ok(v.box, 'the boat becomes a parked solid when the player exits');
assert.ok(d.enter('boat'), 'the player can board the carried boat again');
if (v.def.carried) {
  assert.ok(d.exit(true));
  v.id = 'boat_carry';
  assert.ok(d.arrive(h.ho.car, x, z, h.pose.yaw), 'arrival resolves a carried boat whose local id was renamed for a dock collision');
  assert.equal(d.vehicle, v);
  v.id = 'boat';
}
assert.ok(d.exit(true));
const oldDock = v.def.dock, oldCarried = v.def.carried;
v.def.dock = 'local'; v.def.carried = false;
assert.ok(d.arrive({ id: 'boat_carry', kind: 'boat', dock: 'local', view: 1, d: [0,0,0,0] }, x, z, h.pose.yaw), 'renamed boat can return to its original dock');
assert.equal(d.vehicle, v);
v.def.dock = oldDock; v.def.carried = oldCarried;
// A future dock may use the same local id as a car. Arrive must honour the
// transported kind, not whichever vehicle happens to appear first in the fleet.
assert.ok(d.exit(true));
const localCar = d.fleet.find(car => car.id === 'lada');
if (localCar) {
  v.id = 'lada';
  assert.ok(d.arrive({ id: 'lada', kind: 'boat', view: 1, d: [0,0,0,0] }, x, z, h.pose.yaw));
  assert.equal(d.vehicle, v, 'boat/car id collision selects the boat');
  assert.ok(d.exit(true));
  const p = localCar.parked, yaw = (p.yaw - Math.PI) * 180 / Math.PI;
  assert.ok(d.arrive({ id: 'lada', view: 0, d: [0,0,0,0] }, p.x, p.z, yaw));
  assert.equal(d.vehicle, localCar, 'legacy hand-offs without kind select a car');
  assert.ok(d.exit(true));
}
// If all hull placement candidates are obstructed, a boat built solely for
// this hand-off must not be left parked inside that obstacle after fallback.
ctx.handoff = { ...h, ho: { ...h.ho, car: { ...h.ho.car, id: 'coupe' } } };
ph.addBox(x, z, 40, 40, 0, -10, 10);
await drive.build(ctx);
const second = ctx.drive, blocked = second.boats.find(b => b.id === 'coupe');
assert.ok(blocked?.def.carried);
assert.equal(second.fleet.length, d.fleet.length, 'a boat id must not create an additional car in the garage');
if (second.fleet.some(car => car.id === 'coupe')) {
  const ids = ctx.interact.list().map(i => i.id);
  assert.ok(ids.includes('drive-car') && ids.includes('drive-boat-coupe'), 'boat and car retain separate interaction keys');
}
assert.equal(second.arrive(ctx.handoff.ho.car, x, z, h.pose.yaw), false);
assert.equal(second.active, false);
assert.ok(blocked.retired && blocked.box === null && blocked.model.root.parent === null);
assert.ok(!second.boats.includes(blocked) && !second.vehicles.includes(blocked));
assert.equal(player.inputLock, 0, 'failure leaves the walker unlocked');
console.log(`PASS ${g.from} -> ${g.to}: boat hand-off at ${x}, ${z}, carried, floating, and boardable after exit`);
