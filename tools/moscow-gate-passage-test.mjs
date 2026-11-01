// Moscow Gate: real area data, landmark colliders and car handling. A raised
// entablature must leave the visible bays usable while columns remain solid.
// Run in every area that includes it:
// node tools/area.mjs semyonovsky tools/moscow-gate-passage-test.mjs
// --mutant-ground-footprint restores the defect and must fail the drive case.
import assert from 'node:assert/strict';
import { BUILDINGS } from '../src/world/data/city.js';
import { buildWorld } from './lib/headless-world.mjs';
import { createHandling } from '../src/world/drive/handling.js';
import { carContact } from '../src/world/drive/collision.js';
import { SPEC } from '../src/world/drive/model.js';

const record = BUILDINGS.find((b) => b.id === 'w50224296');
assert(record, 'run under an area containing Moscow Gate');
if (process.argv.includes('--mutant-ground-footprint')) record.minH = 0;
const modules = process.argv.includes('--integrated')
  ? ['environment','streets','city','landmarksMoskovsky'] : ['landmarksMoskovsky'];
const { ctx, L, errors } = await buildWorld({ modules });
assert.deepEqual(errors, []);
assert(ctx.services.landmarksMoskovsky?.triangles > 1000, 'the raised data record must still draw the landmark');

// Surveyed gate centre and the northern OSM footprint edge, independent of the
// builder's collision representation. u follows the facade; v crosses it.
const x = -1780.9, z = 4569.8, yaw = Math.atan2(1.1, 37.9);
const at = (u, v) => ({ x: x + Math.cos(yaw)*u + Math.sin(yaw)*v,
  z: z - Math.sin(yaw)*u + Math.cos(yaw)*v });
for (const u of [-8.3, 0, 8.3]) for (const direction of [-1, 1]) {
  const start = at(u, -18*direction), car = createHandling(ctx);
  car.reset(start.x, start.z, yaw + (direction < 0 ? Math.PI : 0));
  let crossed = false;
  for (let frame = 0; frame < 240; frame++) {
    car.step(1/60, { thr: 1, brk: 0, steer: 0, hand: false, nitro: false });
    const v = (car.x-x)*Math.sin(yaw) + (car.z-z)*Math.cos(yaw);
    if (v*direction > 18) { crossed = true; break; }
  }
  assert(crossed, `red car must drive through bay u=${u} in direction ${direction}`);
}
assert(!L.insideBuilding(-1782.4,4566.8), 'reported location must no longer be a false building wall');
for (const u of [-15,-11.1,-5.5,5.5,11.1,15]) for (const v of [-2.8,2.8]) {
  const p = at(u,v);
  assert(ctx.physics.columnBlocked(p.x,p.z,.2,0,2), 'a real stone/bronze column stays solid');
  assert(ctx.physics.items.some((item) => carContact({ ...p, y:.03, yaw },SPEC,item)), 'car must collide with each real column');
}
const narrow = at(13.05,2.8);
assert(ctx.physics.items.some((item) => carContact({ ...narrow, y:.03, yaw },SPEC,item)), 'a bay narrower than the car must remain blocked by its columns');
assert(!ctx.physics.columnBlocked(x,z,.3,0,2), 'ground-level central bay stays clear for walking');
assert(ctx.physics.columnBlocked(x,z,.3,16.2,18), 'the overhead entablature stays solid');
assert.equal(ctx.physics.groundHeight(x,z,22),21.68, 'the visible top remains a landing surface');
assert.equal(ctx.physics.groundHeight(x,z,0),0, 'the overhead slab must not lift a car or walker');
console.log(`Moscow Gate (${L.AREA || process.env.AREA}): six red-car crossings, twelve solid columns, narrow bays, overhead clearance and roof landing OK`);
