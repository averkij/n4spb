import * as THREE from 'three';
import {solveLimb} from './character-pose.js';
import {JUMPS} from './jump-timing.js';
const clamp=t=>Math.max(0,Math.min(1,t));
export function fitJump(actor,jump,groundY) {
  const rig=actor.rig;actor.root.updateWorldMatrix(true,true);
  const height=rig.hips.getWorldPosition(new THREE.Vector3()).y-groundY;
  // The GLB already contains upward root motion. Keep its crouch, but remove
  // the baked flight lift so it is not added on top of the physics trajectory.
  actor.root.position.y-=Math.max(0,height-actor.standHip);
  if(jump.phase==='land')actor.root.position.y-=.07*Math.sin(Math.PI*clamp(jump.time/JUMPS[jump.clip].recovery));
  actor.root.updateWorldMatrix(true,true);
  if(jump.phase!=='air')for(const side of ['l','r']){
    const foot=actor.standFeet[side].clone().applyQuaternion(actor.root.quaternion);
    foot.x+=actor.root.position.x;foot.z+=actor.root.position.z;foot.y+=groundY;
    solveLimb(rig.legs[side],foot,new THREE.Vector3(0,.3,-1).applyQuaternion(actor.root.quaternion));
  }
}
