// Verify the two shipped player rigs against the kart's seat, wheel and pedals.
import './lib/headless-world.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createActor } from '../src/world/character/actor.js';
import { createMaterials } from '../src/core/materials.js';
import { loadKarts } from '../src/world/karting/fleet.js';
import { sr5Body } from '../src/world/karting/sr5-body.js';

globalThis.createImageBitmap = async () => ({ width: 1, height: 1 });
globalThis.ProgressEvent ??= class {};
const shared = { uNight: { value: .4 } };
const ctx = { shared, mat: createMaterials(shared), noOutline() {}, add() {} };
const kart = loadKarts(ctx, {})[0].makeModel();
kart.setView(true);
let lastArms;
const steering = kart.root.getObjectByName('steering');
assert.ok(steering.position.distanceTo(new THREE.Vector3(0,.548,.1372647))<1e-6,'Preserve the owner-edited steering position');
assert.ok(steering.quaternion.angleTo(new THREE.Quaternion(.2668812,0,0,.9637294).normalize())<.001,'Preserve the owner-edited steering tilt');
const engine=[];
for(let i=0;i<sr5Body.chassis.vertices.length;i+=3){
  const [x,y,z]=sr5Body.chassis.vertices.slice(i,i+3);
  if(Math.abs(x)>.24 && y>.30 && z<-.36)engine.push(x);
}
assert.ok(engine.length>0 && engine.every(x=>x<0),'Engine belongs on the driver’s right (negative game X)');
for (const name of ['woman-beret', 'man-jacket']) {
  const bytes = fs.readFileSync(new URL(`../assets/characters/${name}.glb`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const actor = createActor(gltf, ctx);
  for (const yaw of [0, 1.3, -2.4]) for (const angle of [-.49, -.35, 0, .35, .49]) {
    kart.set({ x: 7, y: .3, z: -11, yaw, pitch: .06, roll: -.05, steerAngle: angle, spin: 0, driven: true });
    kart.poseDriver(actor);
    actor.root.updateWorldMatrix(true, true);
    kart.root.updateMatrixWorld(true);
    const arms = kart.root.getObjectByName('cockpit-arms');
    assert.ok(arms.children.length > 0, name + ' has renderable cockpit arms');
    assert.ok(arms.children.every(mesh => mesh.isSkinnedMesh && mesh.geometry.index.count > 0));
    assert.ok(!lastArms || arms !== lastArms, 'switching characters replaces the cockpit arms');
    arms.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return;
      let source;
      actor.visual.traverse(object => { if (object.skeleton === mesh.skeleton) source = object; });
      assert.ok(source && mesh.material === source.material, 'hands use the selected character');
      assert.ok(mesh.matrixWorld.elements.every((value, i) => Math.abs(value - source.matrixWorld.elements[i]) < 1e-8));
    });
    const local = bone => kart.root.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));
    const hip = local(actor.rig.hips);
    assert.ok(hip.distanceTo(new THREE.Vector3(0, .30, -.22)) < .001, `${name}: pelvis leaves the seat`);
    const shoulders=local(actor.rig.arms.l.upper).add(local(actor.rig.arms.r.upper)).multiplyScalar(.5);
    assert.ok(shoulders.z<hip.z-.025 && shoulders.z>hip.z-.16,`${name}: use a modest backward lean with the fixed steering wheel`);
    for (const [side, sign] of [['l', -1], ['r', 1]]) {
      const wrist = actor.rig.arms[side].end;
      const finger = wrist.children.find(b => /fingermiddle/i.test(b.name)) ?? wrist.children.find(b => b.isBone);
      const hand = wrist.localToWorld(finger.position.clone().multiplyScalar(.9));
      const grip = steering.localToWorld(new THREE.Vector3(-sign * .100, -.078, 0));
      assert.ok(hand.distanceTo(grip) < .025, `${name}: ${side} palm misses the lower wheel grip by ${hand.distanceTo(grip)} m`);
      const foot = local(actor.rig.legs[side].end);
      assert.ok(foot.z > .48 && foot.z < .72 && foot.y > .12 && foot.y < .28, `${name}: foot misses its pedal (${foot.toArray()})`);
      assert.ok(local(actor.rig.arms[side].lower).x * -sign > -.015, `${name}: elbow crosses the torso`);
    }
  }
  lastArms = kart.root.getObjectByName('cockpit-arms');
}
kart.setView(false);
assert.equal(kart.root.getObjectByName('cockpit-arms'), undefined, 'external cameras and exits remove cockpit arms');
console.log('PASS kart drivers: both player rigs, visible cockpit hands on turning wheel, seat/pedal fit and yaw/pitch/roll transforms');
