// Real Sea Gates environment, landmarks, bridges and drive; CPU only.
// node tools/area.mjs morskie-vorota tools/coastal-ship-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { carContact } from '../src/world/drive/collision.js';
import { CONTAINER_SHIP_SPEC as SHIP, CONTAINER_SHIP_TUNING } from '../src/world/drive/boat/container-ship.js';
import { createBoatHandling, BOAT_TUNING, SPEC_BOAT } from '../src/world/drive/boat/handling.js';
import { Physics } from '../src/core/physics.js';
import { makeHo, encodeHo, decodeHo } from '../src/core/handoff.js';
import { loadBoats } from '../src/world/drive/boat/index.js';

const { ctx, L, built, errors } = await buildWorld({ log: null });
assert.deepEqual(errors, []);
assert.ok(built.includes('environment') && built.includes('landmarksSeaGates') && built.includes('coastalBridges'));
assert.equal(process.env.AREA, 'morskie-vorota', 'Run with tools/area.mjs morskie-vorota');
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const ph = ctx.physics;
const player = new Player(ctx.camera, { addEventListener() {}, requestPointerLock() {} }, ph, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding; player.smoothing = 0;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
await (await import('../src/world/drive.js')).build(ctx);
const d = ctx.drive, ship = d?.boats.find(b => b.def.vessel === 'container-ship'), small = d?.boats.find(b => !b.def.vessel);
assert.ok(ship && small, 'Sea Gates needs both the container ship and its ordinary motor boat');
const anchor = { ...ship.parked }, DEG = Math.PI / 180;
let checks = 0, failures = 0;
function check(name, fn) {
  try { fn(); checks++; console.log('PASS', name); }
  catch (e) { failures++; console.error('FAIL', name, '\n ', e.stack || e); }
}
function hullWet(p, spec = SHIP, wet = (x, z) => ph.waterLevel(x, z) != null && L.inPlay(x, z)) {
  const s = Math.sin(p.yaw), c = Math.cos(p.yaw);
  for (let i = 0; i <= 20; i++) for (const x of [-spec.W / 2, 0, spec.W / 2]) {
    const z = spec.rear + .1 + (spec.len - .2) * i / 20;
    assert.ok(wet(p.x + s * z + c * x, p.z + c * z - s * x), `dry hull probe ${x},${z} at ${p.x},${p.z}`);
  }
}
function resetShip() {
  if (d.active) assert.ok(d.exit(true));
  assert.ok(d.enter(ship.id)); d.teleport(anchor.x, anchor.z, anchor.yaw); d.sim(.05, {});
}
function localPoint(p, x, z) {
  const s = Math.sin(p.yaw), c = Math.cos(p.yaw);
  return { x: p.x + c * x + s * z, z: p.z - s * x + c * z };
}
function lookAtPrompt(prompt, point = null) {
  const at = prompt.at(), p = point || { x: at.x + 1.5, z: at.z };
  player.setPose(p.x, p.z, 0, 0); player.inputLock = 0;
  ctx.camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  ctx.camera.lookAt(at.x, at.y, at.z); ctx.camera.updateMatrixWorld(true);
  return ctx.interact.update();
}

check('station-less garage retains one purple Zhiguli and two distinct watercraft', () => {
  assert.deepEqual(d.fleet.map(v => v.id), ['lada']);
  assert.equal(d.boats.length, 2); assert.equal(ship.kind, 'boat'); assert.equal(small.spec.W, SPEC_BOAT.W);
  assert.equal(ship.spec.len, 399.9); assert.equal(ship.spec.W, 61);
  assert.ok(ship.model.root.userData.containerCount > 4000);
  assert.ok(ship.box && ship.box.y0 <= anchor.y - 16);
});
check('complete parked ship footprint is wet, inside the area and clear of real bridge/harbour solids', () => {
  hullWet(anchor);
  const pose = { ...anchor, floats: true };
  const contacts = [...ph.querySolids(anchor.x, anchor.z, 210)].filter(b => b !== ship.box && carContact(pose, SHIP, b));
  assert.equal(contacts.length, 0, JSON.stringify(contacts.slice(0, 2).map(b => ({ x: b.cx, z: b.cz, y0: b.y0, y1: b.y1 }))));
});
check('ordinary motor boat also starts fully wet and clear of the new harbour fixtures', () => {
  hullWet(small.parked, small.spec);
  const pose = { ...small.parked, floats: true };
  const contacts = [...ph.querySolids(pose.x, pose.z, 8)].filter(b => b !== small.box && carContact(pose, small.spec, b));
  assert.equal(contacts.length, 0, 'motor boat obstructed at its dock');
});
check('the actual E interaction is beside the hull at local +33.5,+76 and boards the ship', () => {
  const prompt = ctx.interact.list().find(i => i.id === 'drive-boat-' + ship.id); assert.ok(prompt);
  const expected = localPoint(anchor, 33.5, 76), at = prompt.at();
  assert.ok(Math.hypot(expected.x - at.x, expected.z - at.z) < .01);
  assert.equal(lookAtPrompt(prompt)?.id, prompt.id);
  assert.ok(ctx.interact.use()); d.sim(.1, {});
  assert.ok(d.active && d.vehicle === ship && d.car.floats && ship.box === null);
  assert.equal(player.inputLock, 1); assert.equal(ship.model.driver.visible, true);
});
check('real integrated ship accelerates slowly, stays on water and turns gradually', () => {
  resetShip(); d.sim(8, { thr: 1 }, (i, p) => { if (i % 60 === 0) hullWet(p); });
  const speed = d.car.speed, yaw = d.car.yaw;
  assert.ok(speed > 8 && speed < 27, `ship speed ${speed}`);
  d.sim(4, { thr: 1, steer: 1 }, (i, p) => { if (i % 60 === 0) hullWet(p); });
  const turn = Math.abs(d.car.yaw - yaw) / DEG;
  assert.ok(turn > 2 && turn < 20, `ship turn ${turn}°`);
  assert.ok(Math.abs(d.car.pitch) < .002 && Math.abs(d.car.roll) < .002);
  console.log(`  speed ${speed.toFixed(1)} km/h after 8 s; turn ${turn.toFixed(1)}° in 4 s`);
});
check('brake slows the real ship, then reverses; emergency stop settles it', () => {
  resetShip(); d.sim(8, { thr: 1 }); const before = d.car.speed;
  d.sim(3, { brk: 1 }); assert.ok(d.car.speed < before * .5);
  d.sim(10, { brk: 1 }); assert.ok(d.car.vF < -.5 && d.car.vF > -3.1, `reverse ${d.car.vF}`);
  d.sim(4, { hand: true }); assert.ok(d.car.speed < .5);
});
check('helm camera is above cargo on the forward bridge; chase fits the entire ship', () => {
  resetShip(); d.setView(2); d.sim(.1, {});
  assert.equal(ship.model.driver.visible, false);
  assert.ok(ctx.camera.position.y > anchor.y + 48 && ctx.camera.position.y < anchor.y + 50);
  const expected = localPoint(d.car, SHIP.eye.x, SHIP.eye.z);
  assert.ok(Math.hypot(ctx.camera.position.x - expected.x, ctx.camera.position.z - expected.z) < .2);
  d.setView(0); d.sim(.1, {}); assert.equal(ship.model.driver.visible, true);
  assert.ok(Math.hypot(ctx.camera.position.x - d.car.x, ctx.camera.position.z - d.car.z) > 240);
});
check('exit places the walker outside the parked hull and the E prompt boards again', () => {
  resetShip(); assert.ok(d.exit()); assert.equal(player.inputLock, 0);
  const dx = player.pos.x - ship.parked.x, dz = player.pos.z - ship.parked.z, s = Math.sin(ship.parked.yaw), c = Math.cos(ship.parked.yaw);
  assert.ok(Math.abs(dx * c - dz * s) > SHIP.W / 2 + .2, 'walker inside ship collider');
  assert.ok(ship.box && !player.isUnderground());
  const prompt = ctx.interact.list().find(i => i.id === 'drive-boat-' + ship.id);
  const exit = { x: player.pos.x, z: player.pos.z };
  assert.equal(lookAtPrompt(prompt, exit)?.id, prompt.id); assert.ok(ctx.interact.use()); assert.equal(d.vehicle, ship);
});
check('blocked boarding exits never fall back inside the large hull; forced exit stays outside its beam', () => {
  resetShip();
  const original = ship.car.walkerBlocked, boarding = ship.def.boarding;
  const candidates = [localPoint(ship.car, boarding.x, boarding.z), localPoint(ship.car, -boarding.x, boarding.z)];
  // These are the two actual exit locations beside the real moored ship. A
  // nearby quay/obstruction can reject both while the water at its centre is
  // clear; the old 3–9 m motorboat search then wrongly accepted that centre.
  ship.car.walkerBlocked = (x, z) => original(x, z) || candidates.some(p => Math.hypot(p.x - x, p.z - z) < 2);
  try {
    assert.equal(d.exit(), false, 'ordinary exit must report no room');
    assert.ok(d.active && d.vehicle === ship && ship.box === null);
    assert.equal(player.inputLock, 1);
    assert.ok(d.exit(true), 'forced exit still releases the helm');
    assert.equal(d.active, false); assert.equal(player.inputLock, 0);
    const dx = player.pos.x - ship.parked.x, dz = player.pos.z - ship.parked.z;
    const side = dx * Math.cos(ship.parked.yaw) - dz * Math.sin(ship.parked.yaw);
    assert.ok(Math.abs(side) > SHIP.W / 2 + .2, 'forced exit inside the parked hull');
    assert.ok(ship.box);
  } finally { ship.car.walkerBlocked = original; }
});
check('R to the real start leaves the ship floating and returns an unlocked walker', () => {
  resetShip(); assert.ok(d.place(L.HERO.x, L.HERO.z, L.HERO.yaw));
  assert.equal(d.active, false); assert.equal(player.inputLock, 0);
  assert.ok(Math.hypot(player.pos.x - L.HERO.x, player.pos.z - L.HERO.z) < 1.5);
  hullWet(ship.parked); assert.ok(ship.box);
});

function synthetic(water = () => -3.2, tuning = CONTAINER_SHIP_TUNING) {
  const physics = new Physics(() => -5); physics.waterLevel = water;
  const layout = { inPlay: () => true, heightAt: () => -5, insideBuilding: () => false };
  const car = createBoatHandling({ physics, L: layout }, tuning); car.reset(0, 0, 0);
  return { physics, car };
}
function run(car, seconds, input = {}) {
  const events = [], inp = { thr: 0, brk: 0, steer: 0, hand: false, ...input };
  for (let t = 0; t < seconds - 1e-8; t += 1 / 60) { car.step(1 / 60, inp); events.push(...car.events); }
  assert.ok([car.x, car.z, car.y, car.yaw, car.vx, car.vz].every(Number.isFinite));
  return events;
}
check('full bow/beam collides with an off-centre pier over 200 m from the origin', () => {
  const { car, physics } = synthetic(); const pier = physics.addBox(27, 211, 2, 2, 0, -4, 15);
  car.vz = 6; const events = run(car, 3);
  assert.ok(events.some(e => e.type === 'hit' && e.obstacle === pier), 'missed full-size forward shoulder');
  assert.ok(car.z < 10.5); assert.equal(carContact(car, SHIP, pier), null);
});
check('a low overhead bridge stops the ship while the existing motor boat passes beneath', () => {
  const big = synthetic(), deck = big.physics.addBox(0, 211, 200, 5, 0, 10, 11);
  big.car.vz = 6; assert.ok(run(big.car, 3).some(e => e.type === 'hit' && e.obstacle === deck));
  assert.ok(big.car.z < 9);
  const little = synthetic(() => -3.2, BOAT_TUNING);
  little.physics.addBox(0, 211, 200, 5, 0, 10, 11); little.car.reset(0, 190, 0); little.car.vz = 9;
  assert.equal(run(little.car, 4, { thr: 1 }).filter(e => e.type === 'hit').length, 0);
  assert.ok(little.car.z > 220);
});
check('shoreline contact stops the full bow and reverse can back away without dry hull probes', () => {
  const wet = (x, z) => z < 220 ? -3.2 : null, { car } = synthetic(wet);
  car.vz = 8; run(car, 14, { thr: 1 });
  assert.ok(car.z < 20 && car.speed < 2, `bow crossed bank at origin ${car.z}`);
  hullWet(car, SHIP, (x, z) => wet(x, z) != null);
  const stopped = car.z; run(car, 12, { brk: 1 });
  assert.ok(car.z < stopped - 5 && car.vF < -.5, 'ship cannot reverse from bank');
});
check('both full forward shoulders stop before a narrow dry island at two headings', () => {
  for (const yaw of [0, .73]) for (const side of [-1, 1]) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const wet = (x, z) => {
      const across = (x * c - z * s) * side, along = x * s + z * c;
      return across >= 24 && across <= 28 && along >= 99 && along <= 109 ? null : -3.2;
    };
    const { car } = synthetic(wet);
    assert.equal(car.canPlace(0, 0, yaw), false, 'arrival accepted an island already inside the shoulder');
    car.reset(-125 * s, -125 * c, yaw); car.vx = 8 * s; car.vz = 8 * c;
    run(car, 24, { thr: 1 });
    const along = car.x * s + car.z * c;
    // The real hull still has a 30.5 m half-beam through local z=128 and
    // reaches x=24 at z=164. The old early-taper probes let its shoulder
    // advance 83 m through this island, stopping with the origin at +24 m.
    assert.ok(along < -64, `shoulder crossed island: yaw ${yaw}, side ${side}, origin ${along}`);
    assert.ok(car.speed < .5, 'ship is not stopped at the island');
    run(car, 8, { brk: 1 });
    assert.ok(car.x * s + car.z * c < along - 3, 'ship cannot reverse away from shoulder contact');
  }
});
check('reverse shoreline contact covers the square stern edge and aft shoulders', () => {
  for (const yaw of [0, -.63]) for (const across of [10, 26]) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const wet = (x, z) => {
      const a = x * c - z * s, b = x * s + z * c;
      return a >= across - 2 && a <= across + 2 && b >= -109 && b <= -99 ? null : -3.2;
    };
    const { car } = synthetic(wet);
    car.reset(125 * s, 125 * c, yaw); car.vx = -3 * s; car.vz = -3 * c;
    run(car, 24, { brk: 1 });
    const along = car.x * s + car.z * c;
    assert.ok(along > (across === 10 ? 101 : 94), `stern crossed island: yaw ${yaw}, across ${across}, origin ${along}`);
    assert.ok(car.speed < .5, 'reverse contact is not stopped');
  }
});
check('real ship hand-off refuses a terrain hole wholly inside its forward shoulder', () => {
  if (d.active) assert.ok(d.exit(true));
  const p = localPoint(anchor, 26, 104), hole = ph.addHole(p.x, p.z, 4, 10, anchor.yaw);
  try {
    assert.equal(d.arrive({ id: ship.id, kind: 'boat', vessel: 'container-ship', dock: ship.def.dock, view: 2, d: [0, 0, 0, 0] }, anchor.x, anchor.z, anchor.yaw / DEG - 180), false);
    assert.equal(d.active, false); assert.equal(player.inputLock, 0);
  } finally { ph.remove(hole); }
});
check('real ship hand-off refuses an off-centre pier beyond the origin resolve radius', () => {
  if (d.active) assert.ok(d.exit(true));
  const p = localPoint(anchor, 26, 104), pier = ph.addBox(p.x, p.z, 4, 10, anchor.yaw, anchor.y - 4, anchor.y + 10);
  try {
    assert.equal(d.arrive({ id: ship.id, kind: 'boat', vessel: 'container-ship', dock: ship.def.dock, view: 2, d: [0, 0, 0, 0] }, anchor.x, anchor.z, anchor.yaw / DEG - 180), false);
    assert.equal(d.active, false); assert.equal(player.inputLock, 0);
  } finally { ph.remove(pier); }
});
check('vessel identity survives hand-off encode/decode, destination garage and return', () => {
  const open = { L: { inPlay: () => true }, physics: { waterLevel: () => -3.2 } };
  let carried = { id: ship.id, kind: 'boat', vessel: 'container-ship', dock: ship.def.dock, view: 2, d: [0, 0, 0, 0] };
  for (const [from, to] of [['morskie-vorota', 'sevkabel'], ['sevkabel', 'morskie-vorota']]) {
    const raw = makeHo({ from, to, car: carried }), decoded = decodeHo(encodeHo(raw), { to });
    assert.ok(decoded.ok); assert.equal(decoded.ho.car.vessel, 'container-ship');
    const dock = to === 'morskie-vorota' ? [{ id: ship.id, vessel: 'container-ship', dock: ship.def.dock, x: anchor.x, z: anchor.z, yaw: anchor.yaw }] : [];
    const boats = loadBoats(open, { docks: dock, carry: { ...decoded.ho.car, x: anchor.x, z: anchor.z, yaw: anchor.yaw } });
    assert.equal(boats.length, 1); assert.equal(boats[0].spec.W, 61); assert.equal(boats[0].vessel, 'container-ship');
    carried = { ...decoded.ho.car, id: boats[0].id };
  }
  assert.ok(d.arrive(carried, anchor.x, anchor.z, anchor.yaw / DEG - 180));
  assert.equal(d.vehicle, ship); assert.equal(d.view.mode, 2); d.exit(true);
});

console.log(`Coastal ship: ${checks} passed, ${failures} failed; real world modules ${built.join(', ')}`);
process.exitCode = failures ? 1 : 0;
