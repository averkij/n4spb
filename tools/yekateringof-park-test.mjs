// Focused contract for the landmark claims, real mapped positions and openings.
// node tools/yekateringof-park-test.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BUILDINGS, MONUMENTS } from '../src/areas/kolomna/data/city.js';
import { GROUPS_LIST } from '../src/world/landmarksYekateringof/groups.js';
import { build } from '../src/world/landmarksYekateringof.js';

function run(groups) {
  const boxes = [], root = new THREE.Group();
  const ctx = { L: { GROUPS: { landmarksYekateringof: groups } },
    mat: { toon: (color) => new THREE.MeshBasicMaterial({ color }) },
    physics: { addBox: (...args) => boxes.push(args) },
    services: {}, addStatic: (o) => root.add(o) };
  build(ctx); return { boxes, root, svc: ctx.services.landmarksYekateringof };
}
const pavilion = BUILDINGS.find((b) => b.id === 'w96846565');
const column = MONUMENTS.find((m) => m.id === 'n1347500198');
assert.ok(pavilion && column, 'the area cut retains both OSM objects');
assert.ok(Math.hypot(pavilion.cx + 4834.6, pavilion.cz - 3203.9) < 0.3);
assert.ok(Math.hypot(column.x + 5215.8, column.z - 3531.9) < 0.3);
assert.deepEqual(GROUPS_LIST.flatMap((g) => [...g.ids, ...g.osm]).sort(), ['n1347500198', 'w96846565']);

const all = run(GROUPS_LIST), rotunda = run([GROUPS_LIST[0]]), columnOnly = run([GROUPS_LIST[1]]), none = run([]);
assert.deepEqual(all.svc.drawn, ['w96846565', 'n1347500198']);
assert.equal(all.boxes.length, 9);
assert.equal(rotunda.boxes.length, 8);
assert.equal(columnOnly.boxes.length, 1);
assert.equal(none.boxes.length, 0);
assert.deepEqual(none.svc.drawn, []);
// Eight individual posts, no circular wall; an unobstructed person-sized gap
// remains between each pair of adjacent supports.
for (const c of rotunda.boxes) assert.ok(c[2] <= 0.86 && c[3] <= 0.86);
for (let i = 0; i < rotunda.svc.posts.length; i++) {
  const a = rotunda.svc.posts[i], b = rotunda.svc.posts[(i + 1) % 8];
  assert.ok(Math.hypot(a.x - b.x, a.z - b.z) - Math.SQRT2 * 0.86 > 2);
}
assert.ok(all.svc.triangles < 2500, `modest local geometry: ${all.svc.triangles}`);
console.log('Yekateringof landmark claims, OSM positions, open pavilion and colliders: OK');
