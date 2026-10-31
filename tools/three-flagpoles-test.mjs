// CPU-only dimensions, dry datum and finite culling through a real knockdown.
// node tools/area.mjs okrug65 tools/three-flagpoles-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import {
  SITES, MAST_BASE_Y, MAST_HEIGHT, MAST_DIAMETER_BASE,
  MAST_DIAMETER_TOP, FLAG_WIDTH, FLAG_HEIGHT,
} from '../src/world/landmarksThreeFlags/sites.js';
import { ISLANDS } from '../src/world/landmarksOkrug65/waterfront-data.js';
import { ISLAND_RINGS, ringContains } from '../src/world/landmarksOkrug65/waterfront-plan.js';

const { ctx, L, THREE, built, errors } = await buildWorld({ modules: ['landmarksThreeFlags'] });
assert.deepEqual(errors, []);
assert.deepEqual(built, ['landmarksThreeFlags']);
const flags = ctx.services.landmarksThreeFlags;
assert.equal(flags.masts.length, 3);
assert.equal(ctx.knock.list.length, 3);
assert.equal(ctx.physics.items.length, 24);
assert.equal(ctx._updates.length, 1, 'cloth adds a per-frame callback beyond the shared knock system');
assert.equal(MAST_HEIGHT, 175);
assert.equal(FLAG_WIDTH, 60);
assert.equal(FLAG_HEIGHT, 40);
const near = (a, b, why, eps = 1e-4) => assert(Math.abs(a - b) < eps, `${why}: ${a} versus ${b}`);
near(MAST_BASE_Y - L.WATERWAYS.neva.water, 4.5, 'hydraulic platform above sea');
near(MAST_BASE_Y + MAST_HEIGHT - L.WATERWAYS.neva.water, 179.5, 'mast top above sea');

const meshes = [], geometry = new Set();
for (const site of SITES) {
  const index = ISLANDS.findIndex(s => s.key === site.key), island = ISLANDS[index];
  assert(island, `missing physical island owner for ${site.key}`);
  near(island.x, site.x, 'mast and island x');
  near(island.z, site.z, 'mast and island z');
  near(island.y, site.y, 'mast foot and physical platform datum');
  assert(ringContains(ISLAND_RINGS[index].flat(), site.x, site.z));
  assert.equal(L.waterLevelAt(site.x, site.z), null, `${site.key} stands in the sea mask`);
  const rec = flags.masts.find(s => s.key === site.key).record;
  assert.equal(rec.state, 'stand');
  assert.equal(rec.items.length, 8, 'complete height-banded collision handles');
  assert.equal(rec.parts.length, 3, 'shaft, collars and cloth must share one knock record');
  for (const { mesh, index: instance } of rec.parts) {
    assert.equal(instance, 0);
    assert(mesh.isInstancedMesh && mesh.frustumCulled, 'normal finite, culled instanced draw required');
    assert.equal(mesh.parent, ctx.staticRoot, 'mast must not create an uncullable sector');
    assert.equal(mesh.instanceMatrix.usage, THREE.DynamicDrawUsage);
    assert(Number.isFinite(mesh.userData.lodFar) && mesh.userData.lodFar <= 5500);
    assert(mesh.boundingSphere.radius > 170 && mesh.boundingSphere.radius < 220, 'per-mast finite motion bound');
    meshes.push(mesh); geometry.add(mesh.geometry);
  }
}
assert.equal(meshes.length, 9);

// Read the authored shaft, rather than only checking its dimension constants.
const shaft = meshes.find(m => m.name.includes('-mast|')).geometry;
near(shaft.boundingBox.min.y, 0, 'exposed shaft foot');
near(shaft.boundingBox.max.y, MAST_HEIGHT, 'exposed shaft top');
function sectionRadius(y) {
  const a = shaft.attributes.position;
  let radius = 0;
  for (let i = 0; i < a.count; i++) if (Math.abs(a.getY(i) - y) < .001) radius = Math.max(radius, Math.hypot(a.getX(i), a.getZ(i)));
  return radius;
}
near(sectionRadius(0) * 2, MAST_DIAMETER_BASE, 'lower shaft diameter');
near(sectionRadius(140) * 2, MAST_DIAMETER_TOP, 'upper shaft diameter');
near(sectionRadius(175) * 2, 4.55, 'rotating head hood diameter');

const point = new THREE.Vector3(), matrix = new THREE.Matrix4();
for (const g of geometry) {
  const sphere = g.boundingSphere, box = g.boundingBox, a = g.attributes.position;
  assert(Number.isFinite(sphere.radius) && sphere.radius > 170 && sphere.radius < 190);
  near(sphere.center.length(), 0, 'source motion sphere is centred at the mast foot');
  // The source sphere encloses rotations of every shaft/collar/cloth vertex,
  // including the whole 60 m free edge. Keep the actual standing box tight.
  let farthest = 0;
  for (let i = 0; i < a.count; i++) {
    point.fromBufferAttribute(a, i);
    assert(box.containsPoint(point), 'standing geometry box lost a vertex');
    farthest = Math.max(farthest, point.length());
  }
  assert(farthest <= sphere.radius + 1e-6, 'source sphere clips a rotation about the mast foot');
  assert(sphere.radius - farthest < .01, 'source sphere inflated beyond its finite rotation envelope');
}

let samples = 0, maxRatio = 0;
function checkDrawBounds(frame) {
  for (const mesh of meshes) {
    const a = mesh.geometry.attributes.position, sphere = mesh.boundingSphere;
    mesh.getMatrixAt(0, matrix);
    for (let i = 0; i < a.count; i++) {
      point.fromBufferAttribute(a, i).applyMatrix4(matrix);
      const distance = point.distanceTo(sphere.center);
      assert(distance <= sphere.radius + .002, `${mesh.name} frame ${frame} vertex ${i} is culled outside ${sphere.radius} m`);
      maxRatio = Math.max(maxRatio, distance / sphere.radius); samples++;
    }
  }
}
checkDrawBounds('standing');
for (const rec of ctx.knock.list) {
  assert.equal(ctx.knock.hit(rec.x, rec.z, 75, 1, 0), rec);
  assert.notEqual(rec.state, 'stand', 'real 75 km/h hit did not release the mast');
  for (const item of rec.items) assert(!ctx.physics.items.includes(item), 'fallen mast retains standing collision');
}
for (let frame = 1; frame <= 181; frame++) {
  ctx.knock.update(1 / 60);
  checkDrawBounds(frame);
}
assert(ctx.knock.list.every(r => r.state === 'rest'), 'all three complete masts must settle');
assert.equal(ctx.knock.stats.live, 0);
console.log({
  masts: flags.masts.length, dimensions: '175 m mast; 179.5 m above sea; 60 × 40 m cloth',
  dryPlatformY: MAST_BASE_Y, frames: 181, transformedVertices: samples,
  maxRadiusRatio: maxRatio, meshRadii: meshes.map(m => ({ name: m.name, radius: m.boundingSphere.radius })),
});
console.log('three-flagpoles: dimensions, dry datum, standing and actual 75 km/h knock bounds PASS');
