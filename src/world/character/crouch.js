// Build crouched idle and walking clips once for each playable skeleton.
// The two-bone rig solver keeps a stance foot planted while the other steps.
import * as THREE from 'three';
import {leanTorso,solveLimb} from './pose.js';

export const CROUCH_STRIDE = .95; // metres travelled in one full cycle
const STANCE = .62;
const SIDES = ['l','r'];
const ankle = new THREE.Vector3();

// Quaternion blending briefly places the ankles below their planted endpoints
// while the pelvis lowers or rises. Lift the visual root by that penetration.
export function groundCrouchBlend(actor) {
  const left = actor.rig.legs.l.end.getWorldPosition(ankle).y-actor.standFeet.l.y;
  const right = actor.rig.legs.r.end.getWorldPosition(ankle).y-actor.standFeet.r.y;
  actor.root.position.y += Math.max(0,actor.root.position.y-Math.min(left,right));
}

function footStep(phase) {
  if (phase < STANCE) return {z:CROUCH_STRIDE*(phase-STANCE/2),y:0};
  const swing = (phase-STANCE)/(1-STANCE);
  const progress = swing*swing*(3-2*swing);
  // Match the stance velocity at both ends of the swing.
  const carry = (1-STANCE)*swing*(1-swing)*(1-2*swing);
  return {z:CROUCH_STRIDE*(STANCE*(.5-progress)+carry),y:.12*Math.sin(Math.PI*swing)**2};
}

export function installCrouchActions(actor) {
  const {root,rig,standing} = actor;
  const restore = () => {
    rig.bones.forEach((bone,i) => {
      const pose = standing[i];
      bone.position.copy(pose.p);bone.quaternion.copy(pose.q);bone.scale.copy(pose.s);
    });
    root.updateWorldMatrix(true,true);
  };
  restore();
  const hips = root.worldToLocal(rig.hips.getWorldPosition(new THREE.Vector3()));
  const feet = SIDES.map(side => rig.legs[side].end.getWorldQuaternion(new THREE.Quaternion()));
  const wrists = SIDES.map(side => root.worldToLocal(rig.arms[side].end.getWorldPosition(new THREE.Vector3())));
  const spine = {...rig,chest:rig.chest.parent};
  const head = {...rig,chest:rig.head};
  const sample = (t,walking) => {
    restore();
    const angle = t*2*Math.PI, gait = walking ? Math.sin(angle) : 0;
    const hip = hips.clone().add(new THREE.Vector3(.018*gait,-.44+.012*Math.cos(walking ? 2*angle : angle),.02));
    rig.hips.position.copy(rig.hips.parent.worldToLocal(root.localToWorld(hip)));
    leanTorso(spine,.62+.04*gait);
    leanTorso(head,-.26);

    for (const [i,side] of SIDES.entries()) {
      const sign = i===0 ? -1 : 1;
      const step = walking ? footStep((t+i*.5)%1) : {z:0,y:0};
      const foot = actor.standFeet[side].clone().add(new THREE.Vector3(sign*.032,step.y,step.z));
      const leg = rig.legs[side];
      solveLimb(leg,root.localToWorld(foot),new THREE.Vector3(sign*.15,0,-1));
      leg.end.quaternion.copy(leg.end.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(feet[i]));
      leg.end.updateWorldMatrix(false,true);

      const wrist = wrists[i].clone().add(new THREE.Vector3(sign*.025,-.27,-.29+gait*sign*.08));
      solveLimb(rig.arms[side],root.localToWorld(wrist),new THREE.Vector3(sign*.7,-.45,.6));
    }
  };

  for (const [name,walking] of [['CrouchIdle',false],['CrouchWalk',true]]) {
    const times = Array.from({length:33},(_,i)=>i/32);
    const values = rig.bones.map(()=>({p:[],q:[],s:[]}));
    for (const time of times) {
      sample(time===1 ? 0 : time,walking);
      rig.bones.forEach((bone,i)=>{
        const {p,q,s} = values[i];
        p.push(...bone.position.toArray());q.push(...bone.quaternion.toArray());s.push(...bone.scale.toArray());
      });
    }
    const tracks = rig.bones.flatMap((bone,i)=>{
      const {p,q,s} = values[i];
      return [
        new THREE.VectorKeyframeTrack(bone.name+'.position',times,p),
        new THREE.QuaternionKeyframeTrack(bone.name+'.quaternion',times,q),
        new THREE.VectorKeyframeTrack(bone.name+'.scale',times,s),
      ];
    });
    actor.actions[name] = actor.mixer.clipAction(new THREE.AnimationClip(name,1,tracks).optimize());
  }
  restore();
}
