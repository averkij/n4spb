// CPU geometry/raycast coverage for both faces of every production car door.
import './lib/headless-world.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { loadGarage } from '../src/world/drive/cars/index.js';
import { trafficDefinition } from '../src/world/drive/traffic-model.js';
import { DRIVABLE_KINDS } from '../src/world/traffic/fleetdata.js';
import { createVehicleCabin, cabinDamageMeshes } from '../src/world/drive/vehicle-cabin.js';
import { cutBox } from '../src/world/drive/geometry-cut.js';
import { createCarDamage } from '../src/world/drive/damage.js';
import { disposePromotedModel } from '../src/world/drive/promotion-cache.js';
import { createMaterials } from '../src/core/materials.js';

const sharedUniforms = { uNight: { value: .6 } };
const ctx = { rng: () => () => .4, tex: { draw: () => new THREE.Texture() }, shared: sharedUniforms, noOutline() {}, mat: createMaterials(sharedUniforms) };
const defs = await loadGarage(ctx);
assert.equal(defs.length, 4, 'all garage factories are exercised');
defs.push(...DRIVABLE_KINDS.map((kind, i) => trafficDefinition({ id: `traffic-car-${i}`, kind, x: 0, z: 0, color: new THREE.Color('#275c8a'), plate: i, livery: i % 8 })));
for (const def of defs) {
  const model = def.makeModel(ctx), shared = model.body.material, version = shared.version;
  const glassBefore = model.glass.geometry.clone(), glassMaterial = model.glass.material;
  const opacity = glassMaterial.opacity, glassSide = glassMaterial.side;
  const v = { id: def.id, kind: def.kind, def, model, spec: def.spec };
  const cabin = createVehicleCabin(ctx, v), panel = cabin.panels[0], glass = cabin.panels[1];
  const p = panel.geometry.attributes.position, half = p.count / 2;
  assert(half > 3 && half % 3 === 0, `${def.id}: real opaque door triangles exist`);
  assert.equal(panel.material, shared, 'door uses the existing material and draw call');
  assert.equal(shared.version, version, 'shared paint material was not changed');
  assert.equal(shared.side, THREE.FrontSide); assert.equal(shared.transparent, false); assert.equal(shared.opacity, 1);
  for (let i = 0; i < half; i += 3) for (let j = 0; j < 3; j++) {
    const original = i + [0, 2, 1][j], inner = half + i + j;
    assert.deepEqual(new THREE.Vector3().fromBufferAttribute(p, original).toArray(), new THREE.Vector3().fromBufferAttribute(p, inner).toArray(), 'lining has reverse winding at the same surface');
    if (panel.geometry.attributes.uv) { assert(Math.abs(panel.geometry.attributes.uv.getX(inner) - .5) < 1e-7); assert(Math.abs(panel.geometry.attributes.uv.getY(inner) - .008) < 1e-7); }
  }
  assert.equal(glass.material, glassMaterial); assert.equal(glassMaterial.opacity, opacity); assert.equal(glassMaterial.side, glassSide); assert(glassMaterial.transparent, 'window remains transparent');
  const s = cabin.spec, hw = def.spec.W / 2;
  for(const part of cabin.panels)for(let i=0;i<part.geometry.attributes.position.count;i++)assert(part.geometry.attributes.position.getY(i)>=s.doorBottom-1e-6,`${def.id}: fixed sill/chassis strips stay out of the hinge`);
  const right=s.entrySide===1,expectedGlass = cutBox(glassBefore, [right?-hw-.3:hw*.63,s.doorBottom,s.rear],[right?-hw*.63:hw+.3,Math.min(s.roof-.045,right?2.55:Infinity),s.front]);
  assert.deepEqual(glass.geometry.attributes.position.array, expectedGlass.inside.attributes.position.array, 'window triangles are not lined or doubled');
  glassBefore.dispose(); expectedGlass.inside.dispose(); expectedGlass.outside.dispose();
  // A ray from the cabin-facing side must actually hit an open opaque door.
  let best = null;
  for (let i = 0; i < half; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
    const cross = b.clone().sub(a).cross(c.clone().sub(a)), area = cross.length();
    if (cross.x*(right?-1:1) > .5 * area && (!best || area > best.area)) best = { i, area };
  }
  assert(best, `${def.id}: outward side face exists`);
  const checkRay = () => {
    model.root.updateWorldMatrix(true, true);
    const a = panel.localToWorld(new THREE.Vector3().fromBufferAttribute(p, best.i));
    const b = panel.localToWorld(new THREE.Vector3().fromBufferAttribute(p, best.i + 1));
    const c = panel.localToWorld(new THREE.Vector3().fromBufferAttribute(p, best.i + 2));
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), centre = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const ray = new THREE.Raycaster(centre.clone().addScaledVector(n, -.03), n, 0, .06);
    assert(ray.intersectObject(panel, false).length > 0, `${def.id}: opaque inner face is hit with front-side culling`);
  };
  const damage = createCarDamage(model, { spec: def.spec, meshes: cabinDamageMeshes(model, cabin) });
  cabin.door.rotation.y = -.9; checkRay();
  damage.hit({ type: 'hit', v: 30, localX: hw, localZ: 0, localNX: -1, localNZ: 0 }); checkRay();
  assert.equal(cabin.door.rotation.y, -.9, 'damage preserves the opening animation');
  damage.repair(); checkRay();
  damage.state.front = damage.state.rear = 1; damage.state.revision++; damage.sync();
  const kept = new Set(panel.geometry.index.array);
  for (let face = 0; face < half; face += 3) assert.equal(kept.has(face), kept.has(half + face), `${def.id}: both door faces retain/detach together`);
  const disposed = new Set(); for (const part of cabin.panels) part.geometry.addEventListener('dispose', () => disposed.add(part.geometry));
  disposePromotedModel(model);
  assert.equal(disposed.size, cabin.panels.length, 'all door buffers dispose through the normal model lifecycle');
}
console.log(`PASS ${defs.length} garage/traffic doors: inward opaque ray hits, shared materials, transparent windows, damage/reset, disposal`);
