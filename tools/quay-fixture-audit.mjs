// CPU geometry audit of actual quay fixture attachment and coastal rail ends.
// Run through tools/area.mjs; no renderer, screenshots or source-text oracle.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const { ctx, THREE, errors } = await buildWorld({});
assert.deepEqual(errors, [], 'the real area builders must load');
ctx.scene.updateMatrixWorld(true);
const wallCells = new Map(), walls = [], fixtures = [], rails = new Map(), railMeshes = [], CELL = 8;
const temp = new THREE.Matrix4(), world = new THREE.Matrix4();
const v = new THREE.Vector3(), normal = new THREE.Vector3();
const triangles = (mesh, matrix, visit) => {
  const geo = mesh.geometry, pos = geo.attributes.position, idx = geo.index;
  for (let i = 0; i < (idx?.count || pos.count); i += 3) {
    const pts = [0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k).applyMatrix4(matrix));
    visit(pts);
  }
};
ctx.scene.traverse(mesh => {
  if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
  if (/^env-quay-(anchor-signs|rings|culverts)$/.test(mesh.name)) fixtures.push(mesh);
  if (/^coastal-rail(?:\||$)/.test(mesh.name)) { rails.set(mesh.geometry.uuid, mesh.geometry); railMeshes.push(mesh); }
  if (!/^env-quay-wall-/.test(mesh.name)) return;
  triangles(mesh, mesh.matrixWorld, points => {
    normal.subVectors(points[1], points[0]).cross(v.subVectors(points[2], points[0])).normalize();
    if (Math.abs(normal.y) > .15) return;
    const tri = { points, normal: normal.clone() }; walls.push(tri);
    const xs = points.map(p => p.x), zs = points.map(p => p.z);
    for (let x = Math.floor((Math.min(...xs) - .1) / CELL); x <= Math.floor((Math.max(...xs) + .1) / CELL); x++)
      for (let z = Math.floor((Math.min(...zs) - .1) / CELL); z <= Math.floor((Math.max(...zs) + .1) / CELL); z++) {
        const key = x + ',' + z; if (!wallCells.has(key)) wallCells.set(key, []); wallCells.get(key).push(tri);
      }
  });
});
const ray = new THREE.Ray(), hit = new THREE.Vector3();
function supported(point, outward) {
  ray.set(point, outward.clone().negate());
  for (const tri of wallCells.get(Math.floor(point.x / CELL) + ',' + Math.floor(point.z / CELL)) || []) {
    if (Math.abs(tri.normal.dot(outward)) < .985) continue;
    if (ray.intersectTriangle(...tri.points, false, hit) && point.distanceTo(hit) <= .075) return true;
  }
  return false;
}
let samples = 0, mounts = 0, attachmentMutant = false;
const bad = [];
for (const mesh of fixtures) {
  mesh.geometry.computeBoundingBox(); const box = mesh.geometry.boundingBox;
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, temp); world.multiplyMatrices(mesh.matrixWorld, temp);
    const outward = new THREE.Vector3(0, 0, 1).transformDirection(world); mounts++;
    for (const x of [box.min.x, 0, box.max.x]) for (const y of [box.min.y, 0, box.max.y]) {
      const point = new THREE.Vector3(x, y, 0).applyMatrix4(world); samples++;
      if (!supported(point, outward)) bad.push(`${mesh.name}[${i}] at ${point.toArray().map(v => v.toFixed(3))}`);
      // Mutation oracle: lifting a real fixture above its wall must fail.
      if (!attachmentMutant && !supported(point.clone().add(new THREE.Vector3(0, 10, 0)), outward)) attachmentMutant = true;
    }
  }
}
assert.equal(bad.length, 0, `wall sprites without backing: ${bad.length}; ${bad.slice(0, 10).join('; ')}`);
// A pond scene legitimately has no industrial wall fixtures. Its reported
// floating-sign location still supplies a non-vacuous unsupported-mount probe.
if (!mounts && process.env.AREA === 'moskovskaya') {
  attachmentMutant = !supported(new THREE.Vector3(-1414.2, .65, 7319.3), new THREE.Vector3(0, 0, 1));
}
if (!mounts && walls.length && !attachmentMutant) {
  const point = walls[0].points.reduce((p, v) => p.add(v), new THREE.Vector3()).multiplyScalar(1 / 3).add(new THREE.Vector3(0, 10, 0));
  attachmentMutant = !supported(point, walls[0].normal);
}
assert(attachmentMutant || !walls.length, 'attachment audit rejects an unsupported fixture mutation');

function boundaryEdges(geo) {
  const pos = geo.attributes.position, idx = geo.index, edges = new Map();
  const key = i => [pos.getX(i), pos.getY(i), pos.getZ(i)].map(v => v.toFixed(5)).join(',');
  for (let i = 0; i < (idx?.count || pos.count); i += 3) {
    const ids = [0, 1, 2].map(j => key(idx ? idx.getX(i + j) : i + j));
    for (let j = 0; j < 3; j++) { const edge = [ids[j], ids[(j + 1) % 3]].sort().join('|'); edges.set(edge, (edges.get(edge) || 0) + 1); }
  }
  return [...edges.values()].filter(count => count % 2).length;
}
let railEnds = 0;
for (const geo of rails.values()) {
  geo.computeBoundingBox(); const box = geo.boundingBox, mesh = { geometry: geo };
  const ts = []; triangles(mesh, new THREE.Matrix4(), p => ts.push(p));
  for (const z of [box.min.z + .03, box.max.z - .03]) for (const y of [.2, .8, 1.08]) {
    ray.set(new THREE.Vector3(-1, y, z), new THREE.Vector3(1, 0, 0));
    assert(ts.some(p => ray.intersectTriangle(...p, false, hit)), `rail end has no attached post at y${y}, z${z}`); railEnds++;
  }
  const noPosts = ts.filter(p => !p.some(v => Math.abs(v.y) < 1e-5 || Math.abs(v.y - 1.12) < 1e-5));
  ray.set(new THREE.Vector3(-1, .8, box.max.z - .03), new THREE.Vector3(1, 0, 0));
  assert(!noPosts.some(p => ray.intersectTriangle(...p, false, hit)), 'unsupported cut-bar mutation is detected');
  assert.equal(boundaryEdges(geo), 0, 'all rail faces and terminal tube caps are closed');
  // Remove one triangle: a missing cap must be observable to the geometry audit.
  const broken = geo.clone(); const idx = geo.index;
  broken.setIndex(Array.from({ length: (idx?.count || geo.attributes.position.count) - 3 }, (_, i) => idx ? idx.getX(i + 3) : i + 3));
  assert(boundaryEdges(broken) > 0, 'missing-face mutation is detected'); broken.dispose();
}
let feet = 0;
const deckCells = new Map();
for (const face of ctx.services.coastalBridges?.triangles || []) {
  const p = face.points.map(p => new THREE.Vector3(...p)), xs = p.map(p => p.x), zs = p.map(p => p.z);
  for (let x = Math.floor(Math.min(...xs) / CELL); x <= Math.floor(Math.max(...xs) / CELL); x++) for (let z = Math.floor(Math.min(...zs) / CELL); z <= Math.floor(Math.max(...zs) / CELL); z++) {
    const key = x + ',' + z; if (!deckCells.has(key)) deckCells.set(key, []); deckCells.get(key).push(p);
  }
}
for (const mesh of railMeshes) {
  const box = mesh.geometry.boundingBox;
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, temp); world.multiplyMatrices(mesh.matrixWorld, temp);
    for (const z of [box.min.z + .03, box.max.z - .03]) {
      const foot = new THREE.Vector3(0, 0, z).applyMatrix4(world);
      // A post straddles the deck edge. Check the actual foot footprint rather
      // than requiring its exact mathematical edge point to lie strictly in.
      const supported = [-.045, 0, .045].some(dx => [-.045, 0, .045].some(dz => {
        const x = foot.x + dx, z = foot.z + dz;
        ray.set(new THREE.Vector3(x, foot.y + .05, z), new THREE.Vector3(0, -1, 0));
        return (deckCells.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || []).some(p => ray.intersectTriangle(...p, false, hit) && Math.abs(hit.y - foot.y) <= .05);
      }));
      assert(supported, `${mesh.name}[${i}] post foot has no deck at ${foot.toArray().map(v => v.toFixed(3))}`); feet++;
    }
  }
}
console.log(`quay-fixture-audit (${process.env.AREA || 'strip'}): ${mounts} mounted sprites, ${samples} backing probes, ${walls.length} vertical wall triangles; ${rails.size} rail templates, ${railEnds} terminal-post probes, ${feet} feet on physical decks`);
console.log('RESULT: OK');
