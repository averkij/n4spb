import * as THREE from 'three';
import {solveLimb} from './pose.js';
import {JUMPS} from './jump-timing.js';
const clamp=t=>Math.max(0,Math.min(1,t));

// Give the fitted waist a few millimetres of clearance over the skinned
// body. The bodice and belt share a seam, so both use the same deformation.
export function easeDressWaist(visual) {
  for(const name of ['dress_0001','dress_1001']){
    const mesh=visual.getObjectByName(name);
    if(!mesh?.isSkinnedMesh)continue;
    mesh.geometry=mesh.geometry.clone();
    const p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const y=p.getY(i),ease=1+.11*clamp(1-Math.abs(y-1.11)/.11);
      p.setXYZ(i,p.getX(i)*ease,y,-.05+(p.getZ(i)+.05)*ease);
    }
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }
}

// The running jump's original split crosses the fitted dress at the waist.
// Tailor the two thigh tracks toward the neutral pose so the skirt clears
// the legs. Keep the arm swing, knee bend, root motion and clip timing.
export function dressRunningJump(clip,idle,rig) {
  const fitted=clip.clone(),pose=new THREE.Quaternion();
  for(const {upper} of Object.values(rig.legs)){
    const name=upper.name+'.quaternion';
    const track=fitted.tracks.find(track=>track.name===name);
    const neutral=idle.tracks.find(track=>track.name===name);
    if(!track||!neutral)continue;
    const rest=new THREE.Quaternion().fromArray(neutral.createInterpolant().evaluate(.1));
    for(let i=0;i<track.values.length;i+=4){
      pose.fromArray(track.values,i).slerp(rest,.65).toArray(track.values,i);
    }
  }
  return fitted;
}

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
