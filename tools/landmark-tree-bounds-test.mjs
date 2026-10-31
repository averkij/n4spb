// No-GPU regression of the real landmark tree generators: full placement bounds survive LOD
// repacking, wind displacement, nonuniform scale, empty buckets and the static proxy builder.
// --generators-only checks the dynamic landmark generators independently of the static Ostrovsky splitter regression.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { prepareTreeLods, TREE_WIND_MARGIN } from '../src/world/lib/tree-bounds.js';
import { buildNDProxy } from '../src/core/ndproxy.js';
import { splitInstanced } from '../src/core/spatial.js';
import { LOD } from '../src/core/lod.js';
import { makeTrees } from '../src/world/landmarksE/trees.js';
const world = new URL('../src/world/', import.meta.url);
const modules = fs.readdirSync(world).filter(n => n.startsWith('landmarks') && fs.existsSync(new URL(`${n}/trees.js`, world)) && fs.readFileSync(new URL(`${n}/trees.js`, world), 'utf8').includes('prepareTreeLods'));
let vertices = 0, buckets = 0, queries = 0, coldDraws = 0, culledDraws = 0;
const point = new THREE.Vector3(), matrix = new THREE.Matrix4(), frustum = new THREE.Frustum(), projection = new THREE.Matrix4();
const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.25, 7000);
function inside(mesh, m, wind = true) {
  const p = mesh.geometry.attributes.position, margin = wind ? TREE_WIND_MARGIN : 0;
  for (let i = 0; i < p.count; i++) {
    point.fromBufferAttribute(p, i).applyMatrix4(m);
    assert.ok(point.distanceTo(mesh.boundingSphere.center) + margin <= mesh.boundingSphere.radius + 0.002, `${mesh.name}: complete instance plus sway margin inside persistent sphere`);
    vertices++;
  }
}
for (const module of modules) {
  const { plantTrees, SPECIES } = await import(new URL(`${module}/trees.js`, world));
  const updates = [], colliders = [], root = new THREE.Group();
  const ctx = { rng: () => () => 0.5, shared: {}, tex: { draw: () => null }, mat: { toon: (color, opts = {}) => new THREE.MeshToonMaterial({ color, vertexColors: !!opts.vertexColors, map: opts.map ?? null }) },
    physics: { addCylinder: (...args) => colliders.push(args) }, noBatch: o => { o.userData.noBatch = true; }, onUpdate: f => updates.push(f), player: { position: new THREE.Vector3() } };
  const families = Object.keys(SPECIES);
  const trees = families.flatMap((fam, f) => [0, 1, 2, 3].map(i => ({ fam, x: -2800 + f * 55 + i * 7, z: -900 + i * 75, y: 0.05 + i, yaw: i * 0.8, s: 0.55 + i * 0.6, sy: 0.7 + i * 0.9 })));
  const group = plantTrees({ ctx, root, svc: {} }, trees, module);
  assert.equal(colliders.length, trees.length, 'each placed tree keeps its collider');
  const meshes = group.children.filter(m => m.isInstancedMesh), bounds = meshes.map(m => m.boundingSphere.clone());
  assert.ok(meshes.length > 0);
  for (const m of meshes) {
    assert.equal(m.frustumCulled, true); assert.equal(m.userData.dynamic, true); assert.equal(m.instanceMatrix.usage, THREE.DynamicDrawUsage); buckets++;
  }
  // Static normal/depth proxies must never freeze the initially populated far tree bucket.
  const proxy = buildNDProxy(root);
  assert.equal(proxy.sources, 0, 'camera-repacked trees do not produce stale static outline proxies');
  for (const pose of [[-2800, -900], [-2680, -900], [-2200, -900], [592, 165], [-2800, -900]]) {
    ctx.player.position.set(pose[0], 0, pose[1]); for (const update of updates) update(1 / 60, 20);
    const countByFamily = new Map();
    meshes.forEach((m, i) => {
      assert.equal(m.visible, m.count > 0, 'empty static-root LOD buckets skip render traversal');
      assert.ok(m.boundingSphere.equals(bounds[i]), 'bounds do not shrink to current bucket membership');
      for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, matrix); inside(m, matrix); }
      if (!m.name.includes('-trunk-')) { const family = m.name.slice(module.length + 1).replace(/-[0-9]+$/, ''); countByFamily.set(family, (countByFamily.get(family) || 0) + m.count); }
    });
    for (const family of families) assert.equal(countByFamily.get(family), 4, 'every original tree appears in exactly one crown LOD');
  }
  root.updateMatrixWorld(true);
  // Start street, long Nevsky view and island garden: real city coordinates, all camera orientations.
  for (const [x, y, z] of [[592, 2.4, 165], [-430, 2.4, -70], [-2800, 2.4, -900]]) for (const yaw of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    camera.position.set(x, y, z); camera.rotation.set(0, yaw, 0); camera.updateMatrixWorld(); frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    for (const m of meshes) if (m.count) { coldDraws++; if (frustum.intersectsObject(m)) culledDraws++; queries++; }
  }
}
// Explicitly cover nonuniform scales independently of whether an author uses tree.sy.
const g = new THREE.BoxGeometry(6, 35, 7), m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial(), 3);
const matrices = [new THREE.Matrix4().makeScale(0.5, 4, 0.5), new THREE.Matrix4().compose(new THREE.Vector3(-900, 0, 60), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.8), new THREE.Vector3(3, 0.8, 2))];
prepareTreeLods([{ im: m }], matrices); for (const mat of matrices) inside(m, mat);
// leafmat.js bound, allowing every sine term its simultaneous maximum and wind strength 6.
const maxD = 6 * 1.5 * (0.05 + 0.011) * 1.7 ** 2, maxF = 0.009 * 1.5 * 1.7 ** 2;
assert.ok(Math.hypot(maxD + Math.SQRT2 * maxF, maxF * 0.5 + maxD * maxD * 0.3) < TREE_WIND_MARGIN);
// Immutable Ostrovsky trees can enter the ordinary cell splitter, but unit crown geometry
// must not acquire a short radius-based range: their existing far silhouette stays visible.
if(process.argv.includes('--generators-only')){console.log(`RESULT: OK (${modules.length} generators, ${buckets} buckets, ${vertices.toLocaleString()} transformed vertices, ${queries} frustum queries; wind, nonuniform scales, empty LODs and proxy exclusion)`);process.exit(0);}
const staticRoot = new THREE.Group(), staticTrees = new THREE.Group(); staticRoot.add(staticTrees); LOD.init(staticRoot);
const K = { tris: 0, ctx: { mat: { toon: color => new THREE.MeshToonMaterial({ color }) }, physics: { addCylinder() {} } } };
const E = makeTrees(K);
for (const [x, z] of [[-1200, -100], [-1500, -500], [-1800, -800]]) E.add(x, z, { kind: 'broad', r: 6, h: 23 });
E.build(staticTrees);
const beforeSplit = [];
staticTrees.traverse(o => { if (!o.isInstancedMesh) return; assert.ok(o.frustumCulled); assert.equal(LOD.of(o).far, Infinity); for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, matrix); beforeSplit.push([...matrix.elements].map(Math.fround).join(',')); } });
const split = splitInstanced(staticRoot);
assert.equal(split.split, 2, 'crowns and trunks split by spatial cell');
const afterSplit = [];
staticRoot.traverse(o => { if (!o.isInstancedMesh) return; assert.equal(LOD.of(o).far, Infinity, 'splitting preserves the original distant tree silhouette'); for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, matrix); afterSplit.push([...matrix.elements].map(Math.fround).join(',')); } });
assert.deepEqual(afterSplit.sort(), beforeSplit.sort(), 'spatial split keeps every crown/trunk transform exactly');
console.log(`RESULT: OK (${modules.length} landmark generators, ${buckets} buckets, ${vertices.toLocaleString()} transformed vertices, ${queries} city-pose frustum queries; ${coldDraws} -> ${culledDraws} candidate draws; wind/nonuniform scales/empty LODs/proxy exclusion)`);
