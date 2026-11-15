import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeModel } from '../src/world/traffic/models.js';
import { ARCH } from '../src/world/traffic/fleetdata.js';
import { createFleetDamage } from '../src/world/traffic/damage-fleet.js';
import { createDamageState } from '../src/world/drive/damage.js';
import { bindParkedImpact } from '../src/world/traffic/impact.js';

const scene = new THREE.Scene(), model = makeModel('sedan', 0);
function mesh(g, name, attr, size) {
  const geometry = g.clone();
  if (attr) geometry.setAttribute(attr, new THREE.InstancedBufferAttribute(new Float32Array(8 * size), size));
  return new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ name }), 8);
}
const k = { paint0: mesh(model.paint, 'pb-car-paint', 'aPlate', 1),
  glass: mesh(model.glass, 'pb-car-glass'), lamps: mesh(model.lamps, 'pb-car-lamp', 'aLamp', 3), ex: {} };
k.paint0.setColorAt(0, new THREE.Color('white'));
const pristine = k.paint0.geometry.attributes.position.array.slice();
const pool = createFleetDamage({ add: o => scene.add(o) }, 2);
const record = () => ({ kind: 'sedan', x: 0, y: 0, z: 0, c: 1, s: 0, plate: 1,
  color: new THREE.Color('#dd3322'), lamp: [1, 0, 0], damageState: createDamageState() });
const a = record(), b = record(), c = record();
pool.begin(); assert.equal(pool.push(a, k), false, 'healthy cars stay instanced');
const box = {};
bindParkedImpact(box, a, ARCH.sedan);
box.source.onCarHit(48, { x: 0, z: 2.12, nx: 0, nz: -1 });
assert(a.damageState.front > .5); assert.equal(a.damageState.rear, 0);
assert(pool.push(a, k));
const first = scene.children[0], damaged = first.children[0].geometry.attributes.position.array.slice();
assert.notDeepEqual(damaged, pristine);
assert.deepEqual(k.paint0.geometry.attributes.position.array, pristine, 'shared fleet stays pristine');
assert.notEqual(first.children[0].geometry.attributes.aPlate, k.paint0.geometry.attributes.aPlate);
for (const v of [b, c]) Object.assign(v.damageState, { rear: 1, revision: 1 });
assert(pool.push(b, k)); assert.equal(pool.push(c, k), false, 'visible capacity uses ordinary fallback');
assert.equal(pool.size, 2);
pool.begin(); assert(pool.push(c, k)); assert.equal(first.parent, null, 'old private buffers evicted');
pool.begin(); assert(pool.push(a, k));
const restored = scene.children.find(o => o.visible);
assert.deepEqual(restored.children[0].geometry.attributes.position.array, damaged, 'damage survives eviction');
for (let frame = 0; frame < 100; frame++) { pool.begin(); assert(pool.push(a, k)); }
assert.equal(scene.children.find(o => o.visible), restored, 'stationary cache settles');
for (const m of restored.children) {
  assert(m.boundingSphere.radius > 0 && Number.isFinite(m.boundingSphere.radius));
  assert.equal(m.instanceMatrix.usage, THREE.DynamicDrawUsage);
}
pool.dispose(); assert.equal(scene.children.length, 0);
// A parked vehicle turned 90 degrees receives front damage from world +X.
const turned = record(); turned.c = 0; turned.s = 1;
bindParkedImpact(box, turned, ARCH.sedan);
box.source.onCarHit(35, { x: 2.12, z: 0, nx: -1, nz: 0 });
assert(turned.damageState.front > .3 && turned.damageState.front < .5, '50% more durable, but the rotated front still dents'); assert.equal(turned.damageState.left, 0);
console.log('PASS struck-car locality, shared mesh isolation, dynamic bounds, cache capacity, eviction/recreation, steady reuse and disposal');
