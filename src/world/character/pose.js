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
  const rig={root,bones,hips:find('hips','lowerbody'),head:find('head'),chest:find('chest','torso','upperbody','spine'),arms:{},legs:{}};
  for(const side of ['l','r']) {
    rig.arms[side]={upper:find('upperarm'+side),lower:find('lowerarm'+side),end:find('hand1'+side,'hand'+side,'palm'+side)};
    rig.legs[side]={upper:find('upperleg'+side),lower:find('lowerleg'+side),end:find('upperfoot'+side,'foot'+side)};
    const limb=rig.legs[side];
    // Kobi's original feet are independent IK controls, unlike the two baked
    // playable rigs. Give the shin a virtual endpoint and move the foot control
    // to the solved ankle, preserving the original skin and animation tracks.
    if(limb.end&&limb.end.parent!==limb.lower){root.updateMatrixWorld(true);limb.tip=new THREE.Object3D();limb.tip.position.copy(limb.lower.worldToLocal(limb.end.getWorldPosition(new THREE.Vector3())));limb.lower.add(limb.tip);}
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
  const endpoint=limb.tip||limb.end;
  const a=position(limb.upper),b=position(limb.lower),c=position(endpoint);
  const l1=a.distanceTo(b),l2=b.distanceTo(c),v=target.clone().sub(a),d=Math.max(.01,Math.min(v.length(),l1+l2-.002));
  v.normalize();const along=(l1*l1-l2*l2+d*d)/(2*d);
  const bend=pole.clone().sub(v.clone().multiplyScalar(pole.dot(v))).normalize();
  const elbow=a.clone().addScaledVector(v,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
  const ankle=a.clone().addScaledVector(v,d);
  aim(limb.upper,limb.lower,elbow);aim(limb.lower,endpoint,ankle);
  if(limb.tip){limb.end.position.copy(limb.end.parent.worldToLocal(ankle));limb.end.updateWorldMatrix(false,true);}
}
export function placeHips(rig,worldTarget) {
  rig.root.updateWorldMatrix(true,true);
  rig.root.position.add(worldTarget.clone().sub(position(rig.hips)));
  rig.root.updateWorldMatrix(true,true);
}
export function fitDriver(rig,car,seat,wheel,steering=0,floor=.49) {
  placeHips(rig,car.localToWorld(new THREE.Vector3(...seat)));
  const turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,.35,.94).normalize(),steering*.6);
  for(const [side,sign] of [['l',-1],['r',1]]) {
    const target=new THREE.Vector3(sign*.165,.025,.045).applyQuaternion(turn).add(new THREE.Vector3(...wheel));
    solveLimb(rig.arms[side],car.localToWorld(target),new THREE.Vector3(sign,-.65,.1).transformDirection(car.matrixWorld));
    const foot=new THREE.Vector3(seat[0]+sign*.105,floor+(rig.soleOffsets?.[side]||0),seat[2]-.66);
    solveLimb(rig.legs[side],car.localToWorld(foot),new THREE.Vector3(0,1,-.4).transformDirection(car.matrixWorld));
  }
}

export function capturePoses(actor) {
  const sample=name=>{
    actor.mixer.stopAllAction();actor.actions[name].reset().play();actor.mixer.update(.1);
    return actor.rig.bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
  };
  actor.standing=sample('Idle');actor.root.updateMatrixWorld(true);actor.standHip=position(actor.rig.hips).y-actor.root.position.y;
  actor.standFeet=Object.fromEntries(['l','r'].map(side=>[side,position(actor.rig.legs[side].end).sub(actor.root.position)]));
  const bounds=()=>{actor.root.updateMatrixWorld(true);actor.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return new THREE.Box3().setFromObject(actor.root,true);};
  const standingBounds=bounds(),soles=standingBounds.min.y;actor.rig.soleOffsets=Object.fromEntries(['l','r'].map(side=>[side,position(actor.rig.legs[side].end).y-soles]));
  // Cache a small support hull of the head, hair and hat at load time. These
  // vertex samples follow their real skinning during a duck, unlike a fixed
  // offset from the head bone. No full mesh scan is needed during interaction.
  actor.headSamples=[];const headY=position(actor.rig.head).y,dirs=[];
  for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1])if(x||y||z)dirs.push(new THREE.Vector3(x,y,z));
  rootHeadSamples(actor,headY,dirs);
  actor.seated=sample('Sitting');
  // Include rigid hats and skinned hair. A few load-time samples allow a
  // damaged low roof to make the driver duck without lowering hips through
  // the seat or scanning mesh vertices during a frame.
  actor.seatedClearance=[0,.2,.4,.6,.8,1,1.2].map(lean=>{blendPose(actor,1);leanTorso(actor.rig,lean);leanTorso({...actor.rig,chest:actor.rig.head},lean*.45);return{lean,top:bounds().max.y-position(actor.rig.hips).y};});
  actor.seatedTop=actor.seatedClearance[0].top;blendPose(actor,1);
  actor.mixer.stopAllAction();
}
function rootHeadSamples(actor,headY,dirs){
  const point=new THREE.Vector3();actor.root.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
    const scores=dirs.map(()=>-Infinity),indices=dirs.map(()=>-1);
    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      mesh.getVertexPosition(i,point);point.applyMatrix4(mesh.matrixWorld);if(point.y<headY-.15)continue;
      for(let j=0;j<dirs.length;j++){const score=point.dot(dirs[j]);if(score>scores[j]){scores[j]=score;indices[j]=i;}}
    }
    const unique=[...new Set(indices.filter(i=>i>=0))];if(unique.length)actor.headSamples.push({mesh,indices:unique});
  });
}
export function headTop(actor,frame){
  let top=-Infinity;const point=new THREE.Vector3(),inverse=frame.matrixWorld.clone().invert(),matrix=new THREE.Matrix4();
  for(const {mesh,indices}of actor.headSamples){mesh.skeleton?.update();matrix.multiplyMatrices(inverse,mesh.matrixWorld);for(const i of indices){mesh.getVertexPosition(i,point);top=Math.max(top,point.applyMatrix4(matrix).y);}}
  return top;
}
// Explicit restoration is necessary after IK: AnimationMixer skips writes for
// unchanged constant tracks, which otherwise leaves last frame's IK in place.
export function blendPose(actor,amount) {
  actor.rig.bones.forEach((b,i)=>{const a=actor.standing[i],z=actor.seated[i];b.position.lerpVectors(a.p,z.p,amount);b.quaternion.slerpQuaternions(a.q,z.q,amount);b.scale.lerpVectors(a.s,z.s,amount);});
}
export function leanTorso(rig,amount) {
  const bone=rig.chest;if(!bone||!amount)return;
  rig.root.updateWorldMatrix(true,true);
  const axis=new THREE.Vector3(1,0,0).applyQuaternion(rig.root.quaternion);
  const q=new THREE.Quaternion().setFromAxisAngle(axis,-amount).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));bone.updateWorldMatrix(false,true);
}
