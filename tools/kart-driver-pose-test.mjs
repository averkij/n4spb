// Verify the two shipped player rigs against the kart's seat, wheel and pedals.
import './lib/headless-world.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createActor } from '../src/world/character/actor.js';
import { createMaterials } from '../src/core/materials.js';
import { loadKarts } from '../src/world/karting/karts.js';

globalThis.createImageBitmap = async () => ({ width: 1, height: 1 });
globalThis.ProgressEvent ??= class {};
const shared = { uNight: { value: .4 } };
const ctx = { shared, mat: createMaterials(shared), noOutline() {}, add() {} };
const kart = loadKarts(ctx, {})[0].makeModel();
const steering = kart.root.getObjectByName('steering');
for (const name of ['woman-beret', 'man-jacket']) {
  const bytes = fs.readFileSync(new URL(`../assets/characters/${name}.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const actor = createActor(gltf, ctx);
  for (const yaw of [0, 1.3, -2.4]) for (const angle of [-.35, 0, .35]) {
    kart.set({ x: 7, y: .3, z: -11, yaw, pitch: .06, roll: -.05, steerAngle: angle, spin: 0, driven: true });
    kart.poseDriver(actor);
    actor.root.updateWorldMatrix(true, true);
    const local = bone => kart.root.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));
    const hip = local(actor.rig.hips);
    assert.ok(hip.distanceTo(new THREE.Vector3(0, .30, -.22)) < .001, `${name}: pelvis leaves the seat`);
    for (const [side, sign] of [['l', -1], ['r', 1]]) {
      const hand = actor.rig.arms[side].end.getWorldPosition(new THREE.Vector3());
      const grip = steering.localToWorld(new THREE.Vector3(-sign * .112, 0, 0));
      assert.ok(hand.distanceTo(grip) < .035, `${name}: ${side} hand misses the moving wheel by ${hand.distanceTo(grip)} m`);
      const foot = local(actor.rig.legs[side].end);
      assert.ok(foot.z > .48 && foot.z < .72 && foot.y > .12 && foot.y < .28, `${name}: foot misses its pedal (${foot.toArray()})`);
      assert.ok(local(actor.rig.arms[side].lower).x * -sign > -.015, `${name}: elbow crosses the torso`);
    }
  }
}
console.log('PASS kart drivers: both player rigs, seat/pedal fit, hands on turning wheel, yaw/pitch/roll transforms');
