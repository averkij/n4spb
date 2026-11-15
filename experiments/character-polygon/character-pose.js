import * as THREE from 'three';

// The source Sitting clip contains a stand-to-sit lead-in. Looping that clip
// periodically stands the driver up. Driving uses a constant settled sample.
export function settledSitting(clip) {
  const time = Math.min(1, clip.duration * .5);
  return new THREE.AnimationClip('Sitting', 1, clip.tracks.map(track => {
    const values = Array.from(track.createInterpolant().evaluate(time));
    return new track.constructor(track.name, [0, 1], [...values, ...values]);
  }));
}

export function createPoseRig(root) {
  const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
  const normalized=b=>b.name.replace(/[^a-z0-9]/gi,'').toLowerCase();
  const find=(...prefixes)=>bones.find(b=>prefixes.some(prefix=>normalized(b).startsWith(prefix)));
  const rig={root,bones,hips:find('hips','lowerbody'),head:find('head'),chest:find('chest','torso'),arms:{},legs:{}};
  for(const side of ['l','r']) {
    rig.arms[side]={upper:find('upperarm'+side),lower:find('lowerarm'+side),end:find('hand1'+side,'hand'+side,'palm'+side)};
    rig.legs[side]={upper:find('upperleg'+side),lower:find('lowerleg'+side),end:find('upperfoot'+side,'foot'+side)};
  }
  return rig;
}
const position=o=>o.getWorldPosition(new THREE.Vector3());
function aim(bone, child, target) {
  const a=position(bone),axis=position(child).sub(a).normalize(),desired=target.clone().sub(a).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(axis,desired).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
  bone.updateWorldMatrix(false,true);
}
// Analytic two-bone IK: endpoints remain on the rig, no mesh or limb stretching.
export function solveLimb(limb,target,pole) {
  if(!limb?.upper||!limb.lower||!limb.end)return;
  const a=position(limb.upper),b=position(limb.lower),c=position(limb.end);
  const l1=a.distanceTo(b),l2=b.distanceTo(c),v=target.clone().sub(a),d=Math.max(.01,Math.min(v.length(),l1+l2-.002));
  v.normalize();const along=(l1*l1-l2*l2+d*d)/(2*d);
  const bend=pole.clone().sub(v.clone().multiplyScalar(pole.dot(v))).normalize();
  const elbow=a.clone().addScaledVector(v,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
  aim(limb.upper,limb.lower,elbow);aim(limb.lower,limb.end,a.clone().addScaledVector(v,d));
}
export function placeHips(rig,worldTarget) {
  rig.root.updateWorldMatrix(true,true);
  rig.root.position.add(worldTarget.clone().sub(position(rig.hips)));
  rig.root.updateWorldMatrix(true,true);
}
export function fitDriver(rig,car,seat,wheel,steering=0) {
  placeHips(rig,car.localToWorld(new THREE.Vector3(...seat)));
  const turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,.35,.94).normalize(),steering*.6);
  for(const [side,sign] of [['l',-1],['r',1]]) {
    const target=new THREE.Vector3(sign*.165,.025,.045).applyQuaternion(turn).add(new THREE.Vector3(...wheel));
    solveLimb(rig.arms[side],car.localToWorld(target),new THREE.Vector3(sign,-.65,.1).transformDirection(car.matrixWorld));
    const foot=new THREE.Vector3(seat[0]+sign*.105,.49,seat[2]-.66);
    solveLimb(rig.legs[side],car.localToWorld(foot),new THREE.Vector3(0,1,-.4).transformDirection(car.matrixWorld));
  }
}
