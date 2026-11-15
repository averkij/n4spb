// A hinged panel deforms in the car's closed rest frame even while its door is open.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCarDamage } from '../src/world/drive/damage.js';
import { addMechanicalInterior } from '../src/world/drive/breakable.js';
const spec = { W: 1.82, len: 4.14, hgt: 1.3, front: 2.12, rear: -2.02, wb: 2.62 };
const make = nested => {
  const root = new THREE.Group(); root.position.set(80, 3, -150); root.rotation.y = .7;
  const hinge = new THREE.Group(); hinge.position.set(.86, .75, .38); hinge.rotation.y = .12;
  root.add(hinge); hinge.updateMatrix();
  const geometry = new THREE.BoxGeometry(.06, .65, 1.12, 1, 3, 4).toNonIndexed(); geometry.translate(0, 0, -.4);
  const material = new THREE.MeshBasicMaterial(); material.name = 'drive-body';
  const panel = new THREE.Mesh(geometry, material); panel.position.set(.015, -.03, -.08);
  panel.updateMatrix();
  const rest = new THREE.Matrix4().multiplyMatrices(hinge.matrix, panel.matrix);
  if (nested) hinge.add(panel);
  else { geometry.applyMatrix4(rest); panel.position.set(0, 0, 0); root.add(panel); }
  const pristine = panel.geometry.attributes.position.array.slice();
  const damage = createCarDamage({ root, body: panel }, { spec, meshes: [panel] });
  return { root, hinge, panel, rest, damage, pristine };
};
const flat = make(false), nested = make(true);
nested.hinge.rotation.y = -1.1;
for (const model of [flat, nested]) model.damage.hit({ type: 'hit', v: 42, localX: .9, localZ: 0, localNX: -1, localNZ: 0 });
assert.equal(nested.hinge.rotation.y, -1.1, 'damage preserves the animated hinge angle');
const flatPos = flat.panel.geometry.attributes.position, nestedPos = nested.panel.geometry.attributes.position;
for (let i = 0; i < flatPos.count; i++) {
  const actual = new THREE.Vector3().fromBufferAttribute(nestedPos, i).applyMatrix4(nested.rest);
  const expected = new THREE.Vector3().fromBufferAttribute(flatPos, i);
  assert(actual.distanceTo(expected) < 2e-7, 'nested door shares adjoining body deformation in the closed rest frame');
}
assert.deepEqual(nested.panel.geometry.index.array, flat.panel.geometry.index.array, 'nested triangle damage classification agrees');
nested.damage.repair();
assert.deepEqual(nestedPos.array, nested.pristine, 'fixture reset restores exact panel geometry');
assert.equal(nested.hinge.rotation.y, -1.1, 'fixture reset preserves hinge animation');
// The open-cabin interior stays below the floor or inside the bonnet nose.
const shell = new THREE.Mesh(new THREE.BoxGeometry(spec.W, spec.hgt, spec.len).toNonIndexed(), new THREE.MeshBasicMaterial());
addMechanicalInterior(shell, spec, 'hood');
const protectedPoints = shell.geometry.attributes.aProtected, positions = shell.geometry.attributes.position;
let mechanicalVertices = 0;
for (let i = 0; i < positions.count; i++) if (protectedPoints.getX(i)) {
  mechanicalVertices++;
  assert(positions.getY(i) <= .126 || positions.getZ(i) >= spec.front - .64, 'interior never fills the seat or foot space');
  assert(Math.abs(shell.geometry.attributes.uv.getX(i)-.5)<1e-7&&Math.abs(shell.geometry.attributes.uv.getY(i)-.008)<1e-7,'mechanical interior samples only the blank atlas margin');
}
assert(mechanicalVertices > 100, 'mechanical detail remains under detached panels');
// Detached nested glass is emitted in the same car frame as top-level glass.
const fragments = [];
for (const nestedPanel of [false, true]) {
  const model = make(nestedPanel); model.panel.material.name = 'pb-car-glass';
  const emitted = [];
  const d = createCarDamage({ root: model.root, body: model.panel }, { spec, meshes: [model.panel], onDetach: part => emitted.push(part) });
  d.hit({ type: 'hit', v: 65, localX: 0, localZ: -2, localNX: 0, localNZ: 1 });
  fragments.push(emitted);
}
assert(fragments[0].length > 0, 'rear glass fragments actually detach');
assert.equal(fragments[0].length, fragments[1].length, 'nested and flat glass use the same break groups');
for (let i = 0; i < fragments[0].length; i++) {
  const a = fragments[0][i].geometry.attributes.position.array, b = fragments[1][i].geometry.attributes.position.array;
  assert.equal(a.length, b.length);
  for (let j = 0; j < a.length; j++) assert(Math.abs(a[j] - b[j]) < 2e-7, 'fragment vertices use the car frame');
}
console.log('PASS nested door damage matches body rest frame, hinge animation persists, fragments use car space, exact fixture reset');
