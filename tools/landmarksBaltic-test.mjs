// node tools/area.mjs kolomna tools/landmarksBaltic-test.mjs
// node tools/area.mjs semyonovsky tools/landmarksBaltic-test.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as L from '../src/world/layout.js';
import { BUILDINGS } from '../src/world/data/city.js';
import { Physics } from '../src/core/physics.js';
import { buildEntrance } from '../src/world/landmarksBaltic.js';

const rec = BUILDINGS.find(b => b.id === 'r3225591');
assert.ok(rec && rec.parent === 'r2210356', 'mapped Baltic Station entrance missing');
assert.ok(L.inPlay(rec.cx, rec.cz), 'station entrance is outside the area');
const physics = new Physics(() => 0);
const ctx = { physics, mat: { toon: color => new THREE.MeshBasicMaterial({ color }) }, services: {}, addStatic() {} };
const { root, frame, triangles } = buildEntrance(ctx, rec);
assert.ok(triangles > 500 && triangles < 30000, `unexpected geometry count ${triangles}`);
assert.ok(physics.items.length >= 4, 'missing station wall colliders');
for (const wall of physics.items) for (const t of [-.9, 0, .9]) {
  const x = wall.cx + wall.c*wall.hw*t*2, z = wall.cz - wall.s*wall.hw*t*2;
  assert.ok(!L.isOnRoad(x,z,0), `station wall crosses a road at ${x}, ${z}`);
}
const bounds = new THREE.Box3().setFromObject(root);
assert.ok(bounds.max.y > 19 && bounds.max.y < 22);
assert.ok(Math.abs(frame.x-rec.cx)<1 && Math.abs(frame.z-rec.cz)<1);
console.log(`PASS Baltic Station ${process.env.AREA}: mapped entrance, ${triangles} triangles, wall colliders clear of roads, height ${bounds.max.y.toFixed(1)} m`);
