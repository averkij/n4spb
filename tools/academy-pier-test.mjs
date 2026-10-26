// tools/academy-pier-test.mjs - the focused CPU proof of the Egyptian sphinx pier of Admiralty-Haymarket (docs/AREAS.md 15.z), no GPU, no bake:
//   node tools/area.mjs admiralty tools/academy-pier-test.mjs
// It builds environment + streets + landmarksAcademy headlessly (tools/lib/headless-world.mjs: the real colliders, Physics and Player) and proves
//   1  the stair pit is Neva water for the engine (layout.inRiver at the pit, not at the pavement; the quay opens at it: no bank edge of the generic quay inside the ring)
//   2  a walker goes down the central flight of the pier from the pavement, passes the landing (y -2.28) and steps off the last tread into the Neva: wades (no invisible guard at the water)
//   3  the railing along the pit is breakable: before a knock it stops the walker, after it the walker steps onto the shelf behind it (the shelf is pavement, not an invisible wall)
//   4  the two bronze lamp columns are knock records (the collider goes), the granite block stays; the sphinx pedestals are solid and no knock record
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 3).join('\n     ')); } };
const { ctx, L, built } = await buildWorld({ modules: ['environment', 'streets', 'landmarksAcademy'] });
console.log('built', built.join(' '), ctx.physics.items.length, 'colliders,', ctx.knock.stats.registered, 'knock records');
const ph = ctx.physics, hyp = Math.hypot, DEG = 180 / Math.PI;
const { Player } = await import('../src/core/player.js');
const THREE = await import('three');
// the academy frame (landmarksAcademy/frame.js): origin = the round court, u along the river front, v toward the Neva
const A = { x: -3432.0, z: -601.6, rot: 0.5271 }, C = Math.cos(A.rot), S = Math.sin(A.rot);
const W = (u, v) => ({ x: A.x + C * u + S * v, z: A.z - S * u + C * v });
const DIR = { x: S, z: C };                                      // +v: toward the Neva
function walker(x, z, dx, dz) {
  const dom = { addEventListener() {}, requestPointerLock() {} }, cam = new THREE.PerspectiveCamera();
  const p = new Player(cam, dom, ph, L.WORLD.play);
  p.enabled = true; p.clampXZ = L.clampToPlay; p.solidAt = L.insideBuilding; p.smoothing = 0;
  p.setPose(x, z, Math.atan2(-dx, -dz) * DEG, 0);
  return p;
}
function walk(p, seconds, probe = null) {
  p.keys.add('KeyW'); const dt = 1 / 60;
  for (let t = 0; t < seconds - 1e-9; t += dt) { p.time += dt; p.update(dt); if (probe) probe(p); }
  p.keys.clear();
}
const vOf = (p) => { const m = (p.pos.x - A.x) * S + (p.pos.z - A.z) * C; return m; };
const uOf = (p) => (p.pos.x - A.x) * C - (p.pos.z - A.z) * S;

check('1 the stair pit is Neva water, the pavement is not', () => {
  const pit = W(-1.2, 106), pave = W(-1.2, 102), pedestal = W(-23.5, 108);
  assert(L.inRiver(pit.x, pit.z), 'the pit is water');
  assert(!L.inRiver(pave.x, pave.z), 'the pavement in front of it is not');
  assert(!L.inRiver(pedestal.x, pedestal.z), 'the sphinx pedestal stands on land');
  assert(L.waterwayAt(pit.x, pit.z) === 'neva', 'a Neva pit: ' + L.waterwayAt(pit.x, pit.z));
});

check('2 a walker goes down the flight, over the landing and into the Neva (no guard at the water)', () => {
  const a = W(-1.2, 99.5), p = walker(a.x, a.z, DIR.x, DIR.z);
  let landingY = null, maxV = 0;
  walk(p, 9, (q) => { const v = vOf(q); maxV = Math.max(maxV, v); if (v > 107.4 && v < 108.4 && landingY === null) landingY = q.pos.y; });
  const wl = ph.waterLevel(p.pos.x, p.pos.z);
  assert(landingY !== null && landingY < -1.9 && landingY > -2.7, 'he stood on the landing at about -2.28: ' + landingY);
  assert(Math.abs(uOf(p) + 1.2) < 4, 'he kept to the flight: u ' + uOf(p).toFixed(1));
  assert(wl !== null && p.pos.y < wl - 0.2 && p.depth > 0.2, `he is in the Neva: water ${wl}, y ${p.pos.y.toFixed(2)}, depth ${p.depth.toFixed(2)}, v ${vOf(p).toFixed(1)}`);
  assert(vOf(p) > 110.5, 'he went past the last tread: v ' + vOf(p).toFixed(1));
});

check('3 the railing bays stop the walker; knocked, they open the way onto the shelf behind them', () => {
  const c = W(-16.3, 104.12);
  const rec = ctx.knock.list.filter((r) => r.kind === 'fence' && hyp(r.x - c.x, r.z - c.z) < 5);
  assert(rec.length >= 1, 'no railing record near the west stretch');
  rec.sort((p, q) => hyp(p.x - c.x, p.z - c.z) - hyp(q.x - c.x, q.z - c.z));
  const r = rec[0], s = { x: r.x - DIR.x * 2.2, z: r.z - DIR.z * 2.2 }, vBay = (r.x - A.x) * S + (r.z - A.z) * C;
  const before = walker(s.x, s.z, DIR.x, DIR.z); walk(before, 3);
  assert(vOf(before) < vBay + 0.1, 'before the knock the railing stops the walker: v ' + vOf(before).toFixed(2) + ' bay ' + vBay.toFixed(2));
  const box = r.item;
  const hit = ctx.knock.hit(r.x, r.z, 45, DIR.x, DIR.z, 'fence'); assert(hit === r, 'the nearest fence record is the railing bay');
  for (let t = 0; t < 4; t += 1 / 60) ctx.knock.update(1 / 60);
  assert(r.state === 'rest' || r.state === 'lost', 'the bay broke: ' + r.state);
  assert(!ph.items.includes(box), 'its collider is gone');
  const after = walker(s.x, s.z, DIR.x, DIR.z); let onShelf = false;
  walk(after, 2.2, (q) => { const v = vOf(q); if (v > vBay + 0.4 && v < 106.2 && Math.abs(q.pos.y - 0.03) < 0.3) onShelf = true; });
  assert(onShelf, 'after the knock he stood on the shelf behind the railing (street level, a floor, no invisible wall)');
});

check('4 the lamp columns are knock records, the sphinx pedestals are solid structures', () => {
  const head = W(-1.2, 104.95), lamps = ctx.knock.list.filter((r) => r.kind === 'lamp' && hyp(r.x - head.x, r.z - head.z) < 14 && Math.abs(r.y - 0.9) < 0.01);      // (the street lamps of streets stand on y 0; the columns on their granite blocks at 0.9)
  assert(lamps.length === 2, 'two lamp records: ' + lamps.length);
  const l = lamps[0], box = l.item;
  assert(box && ph.items.includes(box), 'the column owns its collider');
  const hit = ctx.knock.hit(l.x, l.z, 40, DIR.x, DIR.z, 'lamp'); assert(hit === l, 'the nearest lamp record is the column');
  for (let t = 0; t < 4; t += 1 / 60) ctx.knock.update(1 / 60);
  assert(!ph.items.includes(box), 'the column collider is gone after the knock');
  for (const u of [-23.5, 21.1]) {
    const w = W(u, 107.8), solids = [...ph.querySolids(w.x, w.z, 0.5)];
    const ped = solids.find((it) => it.y1 > 3 && !it.fence); assert(ped, `the pedestal at u ${u} is a tall solid`);
    assert(!ctx.knock.list.some((r) => (r.items || [r.item]).includes(ped)), 'the pedestal collider belongs to no knock record');
  }
});

console.log(`\nacademy-pier-test: ${checks} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);

