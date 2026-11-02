// Real-context, no-GPU regression: fountain motion, replay, complete bounds,
// shared rendering resources, spatial scheduling and unchanged water physics.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createContext } from '../src/core/ctx.js';
import { LOD } from '../src/core/lod.js';
import { liveFountain } from '../src/world/lib/live-fountain.js';

const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
const ctx = createContext({ scene, camera, quality: { name: 'high' }, sunDir: new THREE.Vector3(0, 1, 0) });
const physics = [ctx.physics.items.length, ctx.physics.dynamic.length, ctx.physics.waters.length];
const a = liveFountain(ctx, { id: 'near-ring', x: 20, z: -12, y: .4, r: 3.2, height: 2.6 });
const authored = liveFountain(ctx, { id: 'tiered-mouth', x: -30, z: -20, y: .7, nozzles: [
  { x: -2, y: 2.3, z: 1.8, target: [3, -.65, -2.8], height: 1.1, width: .16 },
  { x: .4, y: -.3, z: -.8, target: [-1, 1.5, .2], height: 3.5 },
] });
const empty = liveFountain(ctx, { id: 'empty', x: 0, z: 0, nozzles: [] });
const far = liveFountain(ctx, { id: 'far-radial', x: 6000, z: 6000, r: 4, pattern: 'radial' });
const distant = Array.from({ length: 180 }, (_, i) => liveFountain(ctx, { id: `distant-${i}`, x: 9000 + i * 512, z: 9000, jets: 3 }));
const all = [a, authored, empty, far, ...distant], meshes = all.flatMap(f => f.meshes);
assert.equal(ctx._updates.length, 1, 'all fountains share one context callback');
assert.equal(ctx.services.liveFountains.records.length, all.length, 'stable registry contains every authored fountain');
assert.equal(ctx.services.liveFountains.stats, a.controllerStats);
assert.equal(new Set(meshes.map(m => m.material)).size, 3, 'three materials shared by every fountain');
assert.equal(new Set(meshes.map(m => m.geometry)).size, 3, 'three immutable shared unit geometries');
assert.equal(authored.stats.jets, 2, 'authored nozzles replace the generated pattern');
assert.equal(empty.stats.jets, 0, 'an explicit empty nozzle list remains empty');
for (const f of all) {
  assert.equal(f.meshes.length, 3); assert.equal(f.group.visible, false);
  for (const m of f.meshes) {
    assert.equal(m.count, 0); assert.equal(m.instanceMatrix.version, 0, 'far fountains never upload initial identity buffers');
    assert.equal(m.instanceMatrix.usage, THREE.DynamicDrawUsage); assert.equal(m.userData.dynamic, true);
    assert.equal(m.castShadow, false); assert.equal(m.receiveShadow, false); assert.equal(m.frustumCulled, true);
    assert.equal(m.layers.mask, 1 << ctx.LAYER_NO_OUTLINE); assert.ok(Number.isFinite(LOD.of(m).far));
  }
}

const update = t => { for (const fn of ctx._updates) fn(1 / 60, t); };
camera.position.set(0, 2, 0); update(2.345);
assert.equal(a.stats.active, true); assert.equal(authored.stats.active, true); assert.equal(empty.stats.active, false);
assert.equal(far.stats.uploads, 0); assert.equal(a.controllerStats.active, 2);
assert.ok(a.controllerStats.candidates < 5, 'candidate work is local rather than scanning the complete fountain list');
assert.equal(a.stats.night, 0);
const snapshot = a.meshes.map(m => m.instanceMatrix.array.slice());
update(3.345);
assert.notDeepEqual(a.meshes[0].instanceMatrix.array, snapshot[0], 'flowing jet segments move');
assert.notDeepEqual(a.meshes[1].instanceMatrix.array, snapshot[1], 'sparkling droplets move');
assert.notDeepEqual(a.meshes[2].instanceMatrix.array, snapshot[2], 'impact ripples expand');
update(2.345);
a.meshes.forEach((m, i) => assert.deepEqual(m.instanceMatrix.array, snapshot[i], 'replaying t reconstructs identical matrices'));
for (const f of [far, ...distant]) for (const m of f.meshes) assert.equal(m.instanceMatrix.version, 0, 'remote buffers remain untouched');

let vertices = 0;
const p = new THREE.Vector3(), matrix = new THREE.Matrix4();
const persistent = [a, authored].flatMap(f => f.meshes.map(m => ({ m, box: m.boundingBox.clone(), sphere: m.boundingSphere.clone() })));
for (const t of [-31.7, 0, .13, 1.5, 7.7, 28, 103.5]) {
  update(t);
  for (const { m, box, sphere } of persistent) {
    assert.ok(m.boundingBox.equals(box)); assert.ok(m.boundingSphere.equals(sphere), 'bounds persist across every pulse');
    const pa = m.geometry.attributes.position;
    for (let k = 0; k < m.count; k++) {
      m.getMatrixAt(k, matrix);
      for (let v = 0; v < pa.count; v++) {
        p.fromBufferAttribute(pa, v).applyMatrix4(matrix);
        assert.ok(box.distanceToPoint(p) < .0001, `${m.name}: every transformed vertex fits complete box at ${t}`);
        assert.ok(p.distanceTo(sphere.center) <= sphere.radius + .0001, `${m.name}: every transformed vertex fits complete sphere`); vertices++;
      }
    }
    assert.equal(m.instanceMatrix.updateRanges.length, 1, 'unconsumed uploads do not accumulate ranges');
    assert.deepEqual(m.instanceMatrix.updateRanges[0], { start: 0, count: m.count * 16 });
  }
}
ctx.shared.uSunDir.value.y = .02; update(10);
assert.ok(a.stats.night > 0, 'evening sun enables gentle highlighting before the night preset');
const dayEmission = .08; assert.ok(a.meshes[0].material.emissiveIntensity > dayEmission);
ctx.shared.uNight.value = 1; update(10);
assert.equal(a.stats.night, 1); assert.ok(a.meshes[2].material.emissiveIntensity > 1);

const nearVersions = a.meshes.map(m => m.instanceMatrix.version), nearUploads = a.stats.uploads;
camera.position.set(6000, 2, 6000); update(11);
assert.equal(a.group.visible, false); assert.equal(a.stats.active, false); assert.equal(a.stats.uploads, nearUploads);
a.meshes.forEach((m, i) => { assert.equal(m.count, 0); assert.equal(m.instanceMatrix.version, nearVersions[i]); });
assert.equal(far.stats.active, true, 'arriving activates a formerly untouched fountain');
assert.equal(far.stats.uploads, 3); assert.ok(far.controllerStats.candidates < 5);
camera.position.set(-50000, 2, -50000); update(12);
assert.equal(far.group.visible, false); assert.equal(far.controllerStats.active, 0); assert.equal(far.controllerStats.candidates, 0);
const noUploads = far.controllerStats.uploads; update(13);
assert.equal(far.controllerStats.uploads, noUploads, 'an empty neighbourhood performs no matrix uploads');
assert.deepEqual([ctx.physics.items.length, ctx.physics.dynamic.length, ctx.physics.waters.length], physics, 'water and collision registrations remain unchanged');

const otherCtx = createContext({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), quality: { name: 'performance', level: 'low' }, sunDir: new THREE.Vector3(0, 1, 0) });
const low = liveFountain(otherCtx, { jets: 3, pattern: 'vertical' });
otherCtx._updates[0](0, 1);
assert.equal(low.meshes[1].count, 9, 'shipping performance tier uses three droplets per nozzle');
assert.notEqual(low.meshes[0].material, a.meshes[0].material, 'contexts do not share mutable illumination materials');
assert.equal(otherCtx._updates.length, 1);
const preserved = liveFountain(otherCtx, { id: 'authored-jets', jets: 4, drawStreams: false });
otherCtx._updates[0](0, 2);
assert.equal(preserved.meshes[0].count, 0, 'existing authored jets receive no duplicate shared streams');
assert.equal(preserved.meshes[0].visible, false); assert.equal(preserved.meshes[0].instanceMatrix.version, 0, 'disabled streams never upload');
assert.equal(preserved.stats.draws, 2); assert.equal(preserved.stats.uploads, 2);
const preservedDrops = preserved.meshes[1].instanceMatrix.array.slice(); otherCtx._updates[0](0, 3);
assert.notDeepEqual(preserved.meshes[1].instanceMatrix.array, preservedDrops, 'droplets still move around preserved authored jets');
console.log(`RESULT: OK (${all.length + 1} fountains, ${vertices.toLocaleString()} bounded vertices; deterministic flow, dusk/night, three shared draws, spatial scheduling and unchanged physics)`);
