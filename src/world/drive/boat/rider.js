import * as THREE from 'three';
import { blendPose, placeHips, solveLimb } from '../../character/pose.js';

// The avatar faces -Z in its bind pose. Craft are authored bow-forward (+Z).
export function riderSeat(root, seat, grips, feet) {
  const frame = new THREE.Group();
  frame.rotation.y = Math.PI;
  root.add(frame);
  const target = new THREE.Vector3(), pole = new THREE.Vector3();
  return actor => {
    blendPose(actor, 1);
    root.updateWorldMatrix(true, false);
    frame.getWorldQuaternion(actor.root.quaternion);
    placeHips(actor.rig, root.localToWorld(target.fromArray(seat)));
    for (const [side, sign] of [['l', 1], ['r', -1]]) {
      const hand = root.localToWorld(target.set(grips[0] + sign * grips[3], grips[1], grips[2]));
      solveLimb(actor.rig.arms[side], hand, pole.set(sign, -.6, -.1).transformDirection(root.matrixWorld));
      const foot = root.localToWorld(target.set(feet[0] + sign * feet[3], feet[1] + (actor.rig.soleOffsets?.[side] || .04), feet[2]));
      solveLimb(actor.rig.legs[side], foot, pole.set(sign * .25, 1, .4).transformDirection(root.matrixWorld));
    }
  };
}
