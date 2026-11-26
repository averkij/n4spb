// CPU regression for the playable beret character. Compare the original
// skeleton tracks, then intersect the fitted fabric with the skinned body.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { animateActor, createActor } from '../src/world/character/actor.js';
import { installCrouchActions } from '../src/world/character/crouch.js';
import { fitJump } from '../src/world/character/jump.js';
import { JUMPS } from '../src/world/character/jump-timing.js';

globalThis.ProgressEvent ??= class {};
const bytes = fs.readFileSync(new URL('../assets/characters/woman-beret.glb', import.meta.url));
const file = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const gltf = await new GLTFLoader().parseAsync(file, '');
const actor = createActor(gltf, {
  mat: { toon: () => new THREE.MeshBasicMaterial() },
  add() {},
}, { dress: true });
const motion = {
  Jump: '4ce1ece3ae326a1431c41a2b6e77f80ead933345cf2aaa90bd48d77211c266fc',
  RunningJump: '370439fd4c12b869d05a58dc97b70f572d9234bcbf61a23f1dc53c342a2247af',
};
const trackedBones = new Set(actor.rig.bones.map(bone => bone.name));
for (const [name, expected] of Object.entries(motion)) {
  const tracks = actor.actions[name].getClip().tracks.filter(track => trackedBones.has(track.name.split('.')[0]));
  const keys = tracks.map(({ name, times, values }) => [name, [...times], [...values]]);
  const actual = createHash('sha256').update(JSON.stringify(keys)).digest('hex');
  assert.equal(actual, expected, `${name}: preserve the original bone tracks and keyframes`);
}

function surface(mesh, include) {
  const { position } = mesh.geometry.attributes;
  const index = mesh.geometry.index;
  const vertices = Array.from({ length: position.count }, () => new THREE.Vector3());
  const faces = [];
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const y = ids.map(id => position.getY(id));
    if (include(ids, y)) faces.push({ y, points: ids.map(id => vertices[id]), bounds: new THREE.Box3() });
  }
  assert(faces.length, `Expected triangles on ${mesh.name}`);
  return {
    faces,
    sample() {
      mesh.skeleton?.update();
      vertices.forEach((vertex, id) => mesh.getVertexPosition(id, vertex).applyMatrix4(mesh.matrixWorld));
      for (const face of faces) face.bounds.setFromPoints(face.points);
    },
  };
}

const skin = actor.visual.getObjectByName('girl_0001');
const { skinIndex, skinWeight } = skin.geometry.attributes;
const coveredBones = /^(upperLeg[LR]|lowerLeg[LR]|lowerBody|middleBody|chest)_Armature$/;
function bodyVertex(id) {
  let weight = 0;
  for (let i = 0; i < 4; i++) {
    const joint = skin.skeleton.bones[skinIndex.getComponent(id, i)];
    if (coveredBones.test(joint?.name)) weight += skinWeight.getComponent(id, i);
  }
  return weight > .96;
}
const body = surface(skin, (ids, y) => Math.min(...y) < 1.19 && Math.max(...y) > .74 && ids.every(bodyVertex));
const skirt = surface(actor.visual.getObjectByName('dress_0001'), (_, y) => Math.max(...y) < 1.045);
const belt = surface(actor.visual.getObjectByName('dress_1001'), (_, y) => Math.max(...y) < 1.185);

const ray = new THREE.Ray(), delta = new THREE.Vector3(), hit = new THREE.Vector3();
const triangle = new THREE.Triangle(), barycentric = new THREE.Vector3();
function crossesCloth(edges, target, restY, cutoff) {
  for (let j = 0; j < 3; j++) {
    const origin = edges[j], length = delta.subVectors(edges[(j + 1) % 3], origin).length();
    if (length < 1e-6) continue;
    ray.set(origin, delta.multiplyScalar(1 / length));
    if (!ray.intersectTriangle(...target, false, hit) || hit.distanceToSquared(origin) > length * length + 1e-9) continue;
    if (!triangle.getBarycoord(hit, barycentric)) continue;
    const y = barycentric.x * restY[0] + barycentric.y * restY[1] + barycentric.z * restY[2];
    if (y >= cutoff) return true;
  }
  return false;
}
function firstIntersection(fabric, cutoff) {
  for (const panel of fabric.faces) {
    triangle.set(...panel.points);
    for (const limb of body.faces) {
      if (!panel.bounds.intersectsBox(limb.bounds)) continue;
      if (crossesCloth(panel.points, limb.points, panel.y, cutoff) ||
          crossesCloth(limb.points, panel.points, panel.y, cutoff)) return true;
    }
  }
  return false;
}

installCrouchActions(actor);
const problems = [];
const sequences = [
  ...Object.entries(JUMPS).flatMap(([clip, timing]) => [
    { clip, start: 0, end: timing.takeoff, phase: 'anticipation' },
    { clip, start: timing.takeoff, end: timing.landing, phase: 'air' },
    { clip, start: timing.landing, end: timing.end, phase: 'land' },
  ]),
  ...['CrouchIdle', 'CrouchWalk'].map(clip => ({ clip, start: 0, end: 1 })),
];
const frameCount = 120;
for (const { clip, start, end, phase } of sequences) {
  actor.mixer.stopAllAction();
  actor.activeAction = null;
  actor.animation = '';
  for (let frame = 0; frame <= frameCount; frame++) {
    const time = THREE.MathUtils.lerp(start, end, frame / frameCount);
    actor.root.position.set(0, 0, 0);
    animateActor(actor, clip, 1 / frameCount, { time });
    if (phase) fitJump(actor, { clip, phase, time: frame / frameCount * JUMPS[clip].recovery }, 0);
    actor.fitDress();
    actor.root.updateMatrixWorld(true);
    for (const garment of [body, skirt, belt]) garment.sample();
    // Hem-edge contacts are allowed for the opening below the dress.
    const labels = [firstIntersection(skirt, .803) && 'skirt', firstIntersection(belt, 1.026) && 'waistband'].filter(Boolean);
    if (labels.length) problems.push(`${clip} ${time.toFixed(3)} s ${labels.join('/')}`);
  }
}
assert.equal(problems.length, 0, `Skin crossed the cloth in ${problems.length} samples. First: ${problems.slice(0, 6).join(', ')}`);
console.log(`PASS: original jump tracks and garment clearance in ${sequences.length * (frameCount + 1)} jump and crouch poses`);
