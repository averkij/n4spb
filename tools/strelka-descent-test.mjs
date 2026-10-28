// tools/strelka-descent-test.mjs - the focused CPU proof of the Spit of Vasilyevsky Island in Vasilyevsky-Okrug 7 (docs/vo-m1.md), no GPU, no bake:
//   node tools/area.mjs vasilyevsky tools/strelka-descent-test.mjs
// It builds environment + streets + landmarksStrelka headlessly (tools/lib/headless-world.mjs: the real colliders, Physics and Player) and proves
//   1  the descent ring is Neva water for the engine (layout.inRiver in the ring, not in the garden above it) and the module built the SUNK descent (landing at -2.8)
//   2  a walker goes down the north ramp to the landing and steps off the last step into the Neva (no invisible guard at the water)
//   3  the terrace parapet is breakable: before a knock it stops the walker coming from the garden, after it he drops onto the descent
//   4  the outer parapet of a ramp is breakable: before a knock it keeps the walker on the ramp, after it he goes into the Neva
//   5  the bollards and chains round a Rostral column are knock records (the chain bay stops a walker, a knocked one lets him onto the island), the granite base stays solid
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 3).join('\n     ')); } };
const { ctx, L, built } = await buildWorld({ modules: ['environment', 'streets', 'landmarksStrelka'] });
console.log('built', built.join(' '), ctx.physics.items.length, 'colliders,', ctx.knock.stats.registered, 'knock records');
const ph = ctx.physics, hyp = Math.hypot, DEG = Math.PI / 180, RAD = 180 / Math.PI;
const F = await import('../src/world/landmarksStrelka/frame.js');
const D = await import('../src/world/landmarksStrelka/descent.js');
const { Player } = await import('../src/core/player.js');
const THREE = await import('three');
const SC = F.SC, at = (R, a) => F.W(SC[0] + Math.sin(a) * R, SC[1] + Math.cos(a) * R);
function walker(x, z, dx, dz) {
  const dom = { addEventListener() {}, requestPointerLock() {} }, cam = new THREE.PerspectiveCamera();
  const p = new Player(cam, dom, ph, L.WORLD.play);
  p.enabled = true; p.clampXZ = L.clampToPlay; p.solidAt = L.insideBuilding; p.smoothing = 0;
  p.setPose(x, z, Math.atan2(-dx, -dz) * RAD, 0);
  return p;
}
function walk(p, seconds, probe = null) {
  p.keys.add('KeyW'); const dt = 1 / 60;
  for (let t = 0; t < seconds - 1e-9; t += dt) { p.time += dt; p.update(dt); if (probe) probe(p); }
  p.keys.clear();
}
/** the unit direction in the world of the outward radial at angle a (away from SC) */
const outward = (a) => { const p0 = at(10, a), p1 = at(11, a); return { x: p1.x - p0.x, z: p1.z - p0.z }; };
/** the unit tangent (increasing a) */
const tangent = (a) => { const p0 = at(70, a - 0.001), p1 = at(70, a + 0.001), l = hyp(p1.x - p0.x, p1.z - p0.z); return { x: (p1.x - p0.x) / l, z: (p1.z - p0.z) / l }; };
const knockNearest = (kind, x, z, dx, dz, tag) => {
  const r = ctx.knock.hit(x, z, 45, dx, dz, kind); assert(r && hyp(r.x - x, r.z - z) < 4, 'no ' + kind + ' record near ' + tag);
  for (let t = 0; t < 4; t += 1 / 60) ctx.knock.update(1 / 60);
  assert(r.state === 'rest' || r.state === 'lost', 'the ' + tag + ' bay broke: ' + r.state);
  return r;
};

check('1 the descent ring is Neva water, the garden above it is not; the descent is built SUNK', () => {
  const ring = at((D.rIn(0) + D.rOut(0)) / 2, 0), garden = at(D.rIn(0) - 4, 0), outside = at(D.rOut(0) + 6, 0);
  assert(L.inRiver(ring.x, ring.z) && L.waterwayAt(ring.x, ring.z) === 'neva', 'the ring is Neva water');
  assert(!L.inRiver(garden.x, garden.z), 'the garden is land');
  assert(L.inRiver(outside.x, outside.z), 'the Neva lies outside the ring');
  const d = ctx.services.landmarksStrelka.descent;
  assert(d && d.sunk === true && d.landingY === D.Y_LAND, 'the sunk descent: ' + JSON.stringify(d));
});

check('2 a walker goes down the north ramp to the landing and steps off the last step into the Neva', () => {
  const a0 = 85 * DEG, mid = (D.rIn(a0) + D.rOut(a0)) / 2, s = at(mid, a0), t = tangent(a0);
  const p = walker(s.x, s.z, -t.x, -t.z);            // along the ring toward the tip (decreasing a)
  let minY = 9, stepped = false; walk(p, 26, (q) => { minY = Math.min(minY, q.pos.y); });
  assert(minY < D.Y_LAND + 0.25 && minY > D.Y_LAND - 0.3, 'he reached the landing: min y ' + minY.toFixed(2));
  // from the landing straight out to the water
  const l = at((D.rIn(0) + D.rOut(0)) / 2, 0), o = outward(0), ol = hyp(o.x, o.z), q = walker(l.x, l.z, o.x / ol, o.z / ol);
  walk(q, 7); const wl = ph.waterLevel(q.pos.x, q.pos.z);
  stepped = wl !== null && q.pos.y < wl - 0.2 && q.depth > 0.2;
  assert(stepped, `he is in the Neva: water ${wl}, y ${q.pos.y.toFixed(2)}, depth ${q.depth.toFixed(2)}`);
});

check('3 the terrace parapet stops a walker coming from the garden; knocked, he drops onto the descent', () => {
  const a = 20 * DEG, o = outward(a), ol = hyp(o.x, o.z), dx = o.x / ol, dz = o.z / ol, par = at(D.rIn(a) - 0.27, a), s = { x: par.x - dx * 3, z: par.z - dz * 3 };
  const radial = (q) => { const m = F.M(q.pos.x, q.pos.z); return hyp(m[0] - SC[0], m[1] - SC[1]); };
  const before = walker(s.x, s.z, dx, dz); walk(before, 3);
  assert(radial(before) < D.rIn(a) - 0.3 && before.pos.y > -0.1, 'before the knock the parapet stops him: r ' + radial(before).toFixed(2) + ' wall ' + D.rIn(a).toFixed(2));
  const box = ctx.knock.list.filter((r) => r.kind === 'fence').sort((p, q) => hyp(p.x - par.x, p.z - par.z) - hyp(q.x - par.x, q.z - par.z))[0].item;
  knockNearest('fence', par.x, par.z, dx, dz, 'terrace parapet');
  assert(!ph.items.includes(box), 'its collider is gone');
  const after = walker(s.x, s.z, dx, dz); let low = false; walk(after, 4, (q) => { if (q.pos.y < -2.0) low = true; });
  assert(low || after.pos.y < -2.0, 'after the knock he dropped to the descent: y ' + after.pos.y.toFixed(2));
});

check('4 the outer parapet of the ramp keeps the walker on it; knocked, he goes into the Neva', () => {
  const a = 70 * DEG, o = outward(a), ol = hyp(o.x, o.z), dx = o.x / ol, dz = o.z / ol, par = at(D.rOut(a) - 0.3, a), s = at(D.rOut(a) - 3, a);
  const radial = (q) => { const m = F.M(q.pos.x, q.pos.z); return hyp(m[0] - SC[0], m[1] - SC[1]); };
  const before = walker(s.x, s.z, dx, dz); walk(before, 3);
  assert(radial(before) < D.rOut(a) - 0.5, 'before the knock the parapet stops him: r ' + radial(before).toFixed(2) + ' edge ' + D.rOut(a).toFixed(2));
  knockNearest('fence', par.x, par.z, dx, dz, 'ramp parapet');
  const after = walker(s.x, s.z, dx, dz); walk(after, 5);
  const wl = ph.waterLevel(after.pos.x, after.pos.z);
  assert(radial(after) > D.rOut(a) + 0.3 && wl !== null && after.depth > 0.2, `after the knock he is in the Neva: r ${radial(after).toFixed(2)}, depth ${after.depth.toFixed(2)}`);
});

check('5 the bollards and chains of a Rostral column are knock records; the base stays a solid structure', () => {
  const C = F.COL_S, c = F.W(C[0], C[1]);
  const near = (kind) => ctx.knock.list.filter((r) => r.kind === kind && hyp(r.x - c.x, r.z - c.z) < 13);
  assert(near('bollard').length === 24, 'the 24 bollards of the column: ' + near('bollard').length);
  assert(near('fence').length === 24, 'the 24 chain bays of the column: ' + near('fence').length);
  const chain = near('fence').sort((p, q) => hyp(p.x - c.x, p.z - c.z) - hyp(q.x - c.x, q.z - c.z))[0];
  const dx = (chain.x - c.x) / hyp(chain.x - c.x, chain.z - c.z), dz = (chain.z - c.z) / hyp(chain.x - c.x, chain.z - c.z), s = { x: chain.x + dx * 3, z: chain.z + dz * 3 };
  const rad = (q) => hyp(q.pos.x - c.x, q.pos.z - c.z);
  const before = walker(s.x, s.z, -dx, -dz); walk(before, 3);
  assert(rad(before) > 11.5, 'before the knock the chain stops him outside the island: r ' + rad(before).toFixed(2));
  knockNearest('fence', chain.x, chain.z, -dx, -dz, 'chain');
  const after = walker(s.x, s.z, -dx, -dz); walk(after, 3);
  assert(rad(after) < 9, 'after the knock he walks onto the island up to the granite base: r ' + rad(after).toFixed(2));
  const solids = [...ph.querySolids(c.x + 4.0 * Math.cos(F.ROT), c.z - 4.0 * Math.sin(F.ROT), 0.4)].filter((it) => it.y1 > 2);
  assert(solids.length && !solids.some((it) => ctx.knock.list.some((r) => (r.items || [r.item]).includes(it))), 'the granite base of the column is a solid that no knock record owns');
});

console.log(`\nstrelka-descent-test: ${checks} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
