// node tools/area.mjs <admiralty|semyonovsky|aptekarsky> tools/winter-square-placement-test.mjs
// Include city, props and district landmarks: a bare road-plan test misses
// monument bases, planting and other solids that can disqualify a whole site.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';

const required = {
  admiralty: ['sennaya', 'teatralnaya', 'isaac-garden'],
  semyonovsky: ['pionerskaya', 'vitebsky-forecourt', 'baltic-forecourt'],
  aptekarsky: ['troitskaya', 'tolstoy-square'],
};
const area = process.env.AREA;
assert(required[area], 'select a winter expansion district with tools/area.mjs');
const { ctx, errors } = await buildWorld({
  season: 'winter', skip: ['people', 'drive', 'traffic', 'metro', 'wildlife'],
});
assert.deepEqual(errors, []);
buildWinter(ctx);
const objects = ctx.knock.list;
for (const id of required[area]) {
  const tree = ctx.scene.getObjectByName('holiday-' + id);
  assert(tree, 'missing square tree at ' + id);
  assert(objects.some(obj => obj.kind === 'tree' && obj.parts.some(p => p.obj === tree)), id);
  const nearby = objects.filter(obj => obj.parts.some(p => p.mesh?.name.startsWith('festive-')) &&
    Math.hypot(obj.x - tree.position.x, obj.z - tree.position.z) < 20);
  assert(nearby.length >= 2, 'missing square illuminations at ' + id);
  for (const obj of nearby) {
    assert(obj.items.every(c => c.source === obj.src), 'fixture contact must knock its own mesh');
    if (!obj.parts.some(p => p.mesh?.name.startsWith('festive-arch-'))) continue;
    assert(!ctx.physics.columnBlocked(obj.x, obj.z, 0.45, 0.32, 1.95), 'closed arch at ' + id);
  }
}
console.log(area, 'PASS', required[area].join(', '));
