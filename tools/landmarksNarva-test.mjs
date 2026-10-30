// node tools/area.mjs kolomna tools/landmarksNarva-test.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as L from '../src/world/layout.js';
import { BUILDINGS } from '../src/world/data/city.js';
import { Physics } from '../src/core/physics.js';
import { buildGate } from '../src/world/landmarksNarva.js';

const rec = BUILDINGS.find(b => b.id === 'w73174258');
assert.ok(rec, 'Narva Gate OSM footprint missing');
const physics = new Physics(() => 0);
const ctx = { physics, mat: { toon: color => new THREE.MeshBasicMaterial({ color }) }, services: {}, addStatic() {} };
const { root, frame, triangles } = buildGate(ctx, rec);
assert.ok(triangles > 1000 && triangles < 100000, `unexpected triangle count ${triangles}`);
const world = (u, v) => [frame.x + Math.cos(frame.rot)*u + Math.sin(frame.rot)*v, frame.z - Math.sin(frame.rot)*u + Math.cos(frame.rot)*v];
// A person and a car can pass under the arch; the piers and columns are solid.
for (let v = -8; v <= 8; v += 1) for (const u of [-2, 0, 2]) {
  const [x,z] = world(u,v); assert.equal(physics.columnBlocked(x,z,.35,0,2), false, `arch blocked at ${u},${v}`);
}
for (const u of [-7,7]) { const [x,z] = world(u,0); assert.ok(physics.columnBlocked(x,z,.3,0,2), 'missing pier collider'); }
for (const u of [-10,-8,-6,6,8,10]) for (const v of [-4.25,4.25]) {
  const [x,z] = world(u,v); assert.ok(physics.columnBlocked(x,z,.1,0,2), 'missing column collider');
}
// Sample the actual ground-level collision footprints against mapped road lanes.
for (const item of physics.items.filter(i => i.y0 < 2)) {
  const radius = item.type === 'cyl' ? item.r : 0;
  const samples = item.type === 'cyl' ? [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]] :
    [-.45,0,.45].flatMap(a => [-.45,0,.45].map(b => [a*item.hw*2,b*item.hd*2]));
  for (const [u,v] of samples) {
    const c = item.c ?? 1, s = item.s ?? 0;
    const x = item.cx + c*u + s*v, z = item.cz - s*u + c*v;
    assert.ok(Number.isFinite(x) && Number.isFinite(z));
    assert.ok(!L.isOnRoad(x,z,0), `gate collider intersects a mapped road at ${x.toFixed(1)},${z.toFixed(1)}`);
  }
}
const bounds = new THREE.Box3().setFromObject(root);
assert.ok(bounds.max.y > 29 && bounds.max.y < 33, `unexpected gate height ${bounds.max.y}`);
console.log(`PASS Narva Gate at ${frame.x}, ${frame.z}: ${triangles} triangles, open arch, solid piers, road clearance, height ${bounds.max.y.toFixed(1)} m`);
