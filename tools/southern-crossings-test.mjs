// CPU-only integrated test: node tools/area.mjs kolomna tools/southern-crossings-draft-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { SOUTHERN_CROSSINGS } from '../src/world/landmarksSouthernCrossings.js';

const { ctx, errors, built, marks } = await buildWorld();
assert.deepEqual(errors, []);
assert.equal(built.filter(n => n === 'landmarksSouthernCrossings').length, 1, 'bridge visuals must build exactly once');
const [before, after] = marks.landmarksSouthernCrossings;
const result = ctx.services.southernCrossings;
assert.equal(SOUTHERN_CROSSINGS.length, 6);
assert(result.triangles > 0);
assert(result.rails.panels > 0, 'no breakable bridge rail panels survived road clearance');
assert(after > before, 'rails created no colliders');
const items = ctx.physics.items.slice(before, after), sites = {};
for (const s of SOUTHERN_CROSSINGS) {
  const at = items.filter(it => Math.hypot(it.cx-s.c[0],it.cz-s.c[1]) < (s.bank[1]-s.bank[0])/2+s.w/2+2);
  assert(at.length > 0, `${s.id}: no railing colliders survived road clearance`);
  assert(at.every(it => it.y0 > -1), `${s.id}: a new solid reaches the boat level`);
  const bay = at.find(it => it.source?.knock?.kind === 'fence');
  assert(bay, `${s.id}: rail has no knock record`);
  const rec = bay.source.knock;
  assert(ctx.knock.snap(rec, 1, 0, 15), `${s.id}: railing cannot be knocked`);
  assert.equal(rec.state, 'fly', `${s.id}: railing did not move`);
  assert(!ctx.physics.items.includes(bay), `${s.id}: hit did not clear its standing collider`);
  assert(ctx.physics.groundHeight(...s.c, .5) > -.5, `${s.id}: no usable bridge floor at the centre`);
  sites[s.id] = at.length;
}
console.log(JSON.stringify({ sites, triangles: result.triangles, railBays: result.rails.panels, newColliders: items.length }));
