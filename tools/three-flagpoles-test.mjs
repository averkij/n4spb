// CPU-only dimensions, GPU-wave contracts and finite culling through a knockdown.
// node tools/area.mjs okrug65 tools/three-flagpoles-test.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildWorld } from './lib/headless-world.mjs';
import { WIND_ROTATION, clothPoint, clothNormal, createFlagMaterials } from '../src/world/landmarksThreeFlags/motion.js';
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
const textiles = meshes.filter(m => m.geometry.attributes.aFlag);
assert.equal(textiles.length, 3, 'wave motion must be local to the three textiles');
assert.equal(new Set(textiles.map(m => m.material)).size, 1, 'all three flags share one colour material');
assert.equal(new Set(textiles.map(m => m.customDepthMaterial)).size, 1, 'all three flags share one moving sun-shadow material');
assert.equal(new Set(textiles.map(m => m.customDistanceMaterial)).size, 1, 'all three flags share one moving point-shadow material');

// Compile hooks can be exercised without a renderer. All three render paths
// must use the core clock and the same local wave before instance transforms.
const materials = { toon: textiles[0].material, depth: textiles[0].customDepthMaterial, distanceRGBA: textiles[0].customDistanceMaterial };
assert(materials.depth?.isMeshDepthMaterial && materials.distanceRGBA?.isMeshDistanceMaterial);
const shaders = Object.entries(materials).map(([kind, material]) => {
  const lib = THREE.ShaderLib[kind], shader = { vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader, uniforms: THREE.UniformsUtils.clone(lib.uniforms) };
  material.onBeforeCompile(shader, null);
  assert.equal(shader.uniforms.uFlagTime, ctx.shared.uTime, `${kind} shadow/colour clock is not shared`);
  assert.equal((shader.vertexShader.match(/attribute vec4 aFlag;/g) || []).length, 1, `${kind} wave attribute is missing or declared twice`);
  assert.equal((shader.vertexShader.match(/uniform float uFlagTime;/g) || []).length, 1, `${kind} clock is missing or declared twice`);
  assert.match(shader.vertexShader, /#include <begin_vertex>\s+transformed = flagPoint\(\);/);
  assert(shader.vertexShader.indexOf('transformed = flagPoint();') < shader.vertexShader.indexOf('#include <project_vertex>'), `${kind} wave must happen before instance projection`);
  assert.match(shader.vertexShader, /#include <beginnormal_vertex>\s+objectNormal = flagNormal\(\);/);
  assert.match(material.customProgramCacheKey(), /three-flags-wave/);
  return shader;
});
assert(shaders[0].uniforms.uPaint && shaders[0].fragmentShader.includes('paintNoise'), 'cloth patch erased the shared toon paint shader');
const waveSource = shader => shader.vertexShader.slice(shader.vertexShader.indexOf('vec3 flagPoint()'), shader.vertexShader.indexOf('vec3 flagNormal()'));
assert.equal(waveSource(shaders[0]), waveSource(shaders[1]), 'sun shadow uses a different wave surface');
assert.equal(waveSource(shaders[0]), waveSource(shaders[2]), 'point shadow uses a different wave surface');
const plain = ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: .015 });
assert.notEqual(plain, materials.toon, 'flag animation contaminated the ordinary material cache');
assert.notEqual(plain.customProgramCacheKey(), materials.toon.customProgramCacheKey());
const again = createFlagMaterials(ctx);
assert.equal(again.cloth, materials.toon, 'repeated builder should reuse its flag material');
const repeated = { vertexShader: THREE.ShaderLib.toon.vertexShader, fragmentShader: THREE.ShaderLib.toon.fragmentShader, uniforms: {} };
again.cloth.onBeforeCompile(repeated, null);
assert.equal((repeated.vertexShader.match(/attribute vec4 aFlag;/g) || []).length, 1, 'repeated builders stack wave shader declarations');

const geometryHashes = new Map([...geometry].map(g => [g, geometryHash(g)]));
function geometryHash(g) {
  const hash = createHash('sha256');
  for (const a of Object.values(g.attributes)) hash.update(Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength));
  return hash.digest('hex');
}

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
  if (!g.attributes.aFlag) assert(sphere.radius - farthest < .01, 'shaft/collar sphere inflated beyond its finite rotation envelope');
}

const turn = new THREE.Matrix4().makeRotationY(WIND_ROTATION);
function waveVertex(g, i, time, out) {
  const a = g.attributes.aFlag;
  out.fromArray(clothPoint(a.getX(i), a.getY(i), a.getZ(i), time));
  out.z += a.getW(i);
  return out.applyMatrix4(turn);
}
let waveSamples = 0, hoistSamples = 0, maxWaveStep = 0;
for (const mesh of textiles) {
  assert(mesh.castShadow && mesh.receiveShadow);
  assert.equal(mesh.layers.mask & 1, 0, 'the immutable normal/depth override would draw an unmoving cloth outline');
  const g = mesh.geometry, a = g.attributes.aFlag, positions = g.attributes.position;
  assert.equal(a.itemSize, 4);
  assert.equal(a.count, positions.count, 'emblem vertices lack wave coordinates');
  const initial = new THREE.Vector3(), moved = new THREE.Vector3(), previous = new THREE.Vector3();
  let movingVertices = 0, emblemVertices = 0;
  for (let i = 0; i < a.count; i++) {
    waveVertex(g, i, 0, initial);
    point.fromBufferAttribute(positions, i);
    assert(initial.distanceTo(point) < .00003, 'GPU initial surface/emblem differs from the standing geometry');
    const u = a.getX(i), v = a.getY(i), phase = a.getZ(i);
    assert(u >= 0 && u <= FLAG_WIDTH && v >= 0 && v <= FLAG_HEIGHT);
    if (a.getW(i)) { near(Math.abs(a.getW(i)), .08, 'emblem stays offset from its cloth'); emblemVertices++; }
    waveVertex(g, i, 3, moved);
    if (u > 55 && initial.distanceTo(moved) > 1) movingVertices++;
    // .45 and .65 rad/s have a combined period 40π seconds. Sample the
    // whole beat cycle, rather than only the first few animation frames.
    for (let sample = 0; sample <= 252; sample++) {
      const time = sample * 40 * Math.PI / 252;
      waveVertex(g, i, time, moved);
      assert(g.boundingBox.containsPoint(moved), 'moving cloth escapes its finite source box');
      assert(moved.length() <= g.boundingSphere.radius + .00001, 'moving cloth escapes its finite source rotation sphere');
      if (u === 0) { assert(moved.distanceTo(initial) < 1e-9, 'the hoist waves away from its mast'); hoistSamples++; }
      waveSamples++;
    }
    if (u > 55) for (let time = 0; time < 20; time += .25) {
      waveVertex(g, i, time, previous); waveVertex(g, i, time + .25, moved);
      maxWaveStep = Math.max(maxWaveStep, previous.distanceTo(moved));
    }
    // The shader normal must follow the actual surface, independently checked
    // against central finite differences at several positions and times.
    if (i % 97 === 0) for (const time of [0, 3, 11, 29]) {
      const e = .0001, du = new THREE.Vector3().fromArray(clothPoint(u + e, v, phase, time)).sub(new THREE.Vector3().fromArray(clothPoint(u - e, v, phase, time)));
      const dv = new THREE.Vector3().fromArray(clothPoint(u, v + e, phase, time)).sub(new THREE.Vector3().fromArray(clothPoint(u, v - e, phase, time)));
      const expected = dv.cross(du).normalize(), normal = clothNormal(u, v, phase, time);
      near(normal.length(), 1, 'wave normal is finite and normalized');
      assert(normal.dot(expected) > .999999, 'analytic wave lighting normal disagrees with the moving cloth');
    }
  }
  assert(movingVertices > 10, 'free edge remains static');
  if (mesh.name.includes('ussr')) assert(emblemVertices > 0, 'historical emblem was lost');
}
assert(maxWaveStep > .1 && maxWaveStep < .55, `large cloth flaps too fast or stays static: ${maxWaveStep} m per quarter second`);

let samples = 0, maxRatio = 0;
function checkDrawBounds(frame, time = 0) {
  for (const mesh of meshes) {
    const a = mesh.geometry.attributes.position, sphere = mesh.boundingSphere;
    mesh.getMatrixAt(0, matrix);
    const waves = mesh.geometry.attributes.aFlag ? [time, time + 5, time + 11] : [null];
    for (const waveTime of waves) for (let i = 0; i < a.count; i++) {
      if (waveTime === null) point.fromBufferAttribute(a, i);
      else waveVertex(mesh.geometry, i, waveTime, point);
      point.applyMatrix4(matrix);
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
  checkDrawBounds(frame, frame / 60);
}
assert(ctx.knock.list.every(r => r.state === 'rest'), 'all three complete masts must settle');
assert.equal(ctx.knock.stats.live, 0);
for (const [g, hash] of geometryHashes) assert.equal(geometryHash(g), hash, 'wave animation mutates CPU geometry');
assert.equal(ctx._updates.length, 1, 'motion added a CPU update callback');
console.log({
  masts: flags.masts.length, dimensions: '175 m mast; 179.5 m above sea; 60 × 40 m cloth',
  dryPlatformY: MAST_BASE_Y, frames: 181, transformedVertices: samples,
  maxRadiusRatio: maxRatio, waveSamples, hoistSamples, maxQuarterSecondWaveMetres: maxWaveStep,
  meshRadii: meshes.map(m => ({ name: m.name, radius: m.boundingSphere.radius })),
});
console.log('three-flagpoles: slow GPU waves, fixed hoist, shadows, normals, dry datum and 75 km/h knock bounds PASS');
