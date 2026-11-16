import * as THREE from 'three';
import {entryPose,ease} from './entry-poses.js';
import {blendPose,fitDriver,placeHips,solveLimb,leanTorso,headTop} from '../character/pose.js';

const vec=a=>new THREE.Vector3(...a);
const world=(vehicle,p)=>vehicle.root.localToWorld(vec(p));
const pole=(vehicle,p)=>vec(p).transformDirection(vehicle.root.matrixWorld);
function torsoBase(rig){let spine=rig.chest;while(spine.parent?.isBone&&spine.parent!==rig.hips)spine=spine.parent;return spine;}
function posed(actor,vehicle,hip,sit,yaw=0,lean=0,duck=false) {
  blendPose(actor,sit);vehicle.root.getWorldQuaternion(actor.root.quaternion);actor.root.rotateY(yaw);
  if(duck)actor.root.rotateX(-lean);
  placeHips(actor.rig,world(vehicle,hip));if(!duck)leanTorso(actor.rig,lean);
}
function fittedSeat(actor,vehicle){
  const s=vehicle.spec,seat=[...s.seat],roof=vehicle.roofHeight?.()??s.roof??s.height,minHip=Math.max(s.floor+.10,seat[1]-.07);let lean=0;
  if(Number.isFinite(actor.seatedTop)&&Number.isFinite(roof)){
    const samples=actor.seatedClearance||[{lean:0,top:actor.seatedTop}];
    for(const sample of samples){lean=sample.lean;seat[1]=Math.min(s.seat[1],Math.max(minHip,roof-.075-sample.top));if(seat[1]+sample.top<=roof-.075+1e-6)break;}
  }
  return {seat,lean};
}
function driver(actor,vehicle,steering=0) {
  blendPose(actor,1);vehicle.root.getWorldQuaternion(actor.root.quaternion);
  const s=vehicle.spec,fit=fittedSeat(actor,vehicle),seat=fit.seat;leanTorso(actor.rig,fit.lean);leanTorso({...actor.rig,chest:actor.rig.head},fit.lean*.45);
  if(actor===vehicle.npc){actor.reaction='seated';actor.animation=null;seat[1]-=.16;leanTorso(actor.rig,-.4);leanTorso({...actor.rig,chest:actor.rig.head},.4);}
  fitDriver(actor.rig,vehicle.root,seat,s.wheel,steering,s.floor-(actor===vehicle.npc ? .08 : 0));
}
function grip(actor,vehicle,side,target) {solveLimb(actor.rig.arms[side],target,pole(vehicle,[side==='l'?-1:1,-.6,.1]));}
// Door reaches use the actor's shoulder frame: a car-space pole can put the
// elbow across the spine when the actor turns sideways to the car. Keep the
// hand on its own side and ahead of the shoulder, even on a short-armed rig.
function doorGrip(actor,side,target){
  const sign=side==='l'?-1:1,local=actor.root.worldToLocal(target.clone()),shoulder=actor.root.worldToLocal(actor.rig.arms[side].upper.getWorldPosition(new THREE.Vector3()));
  local.x=sign*Math.max(.04,local.x*sign);local.z=Math.min(local.z,shoulder.z-.06);
  solveLimb(actor.rig.arms[side],actor.root.localToWorld(local),vec([sign,-.65,-.35]).applyQuaternion(actor.root.quaternion));
}
export function insidePull(vehicle,actor){
  const s=vehicle.spec,side=s.entrySide??-1;
  const reach=vehicle.door.worldToLocal(actor?actor.rig.arms.l.upper.getWorldPosition(new THREE.Vector3()):world(vehicle,[s.seat[0],s.seat[1]+.35,s.seat[2]]));
  return vehicle.door.localToWorld(vec([-side*.06,Math.max(.1,s.seat[1]+.35-s.hinge[1]),Math.max(.24,Math.min(s.front-s.rear-.15,reach.z))]));
}
function leanToPull(actor,target,amount){
  if(!amount)return;
  const spine=torsoBase(actor.rig);
  const arm=actor.rig.arms.l,base=spine.quaternion.clone(),shoulder=arm.upper.getWorldPosition(new THREE.Vector3()),reach=shoulder.distanceTo(arm.lower.getWorldPosition(new THREE.Vector3()))+arm.lower.getWorldPosition(new THREE.Vector3()).distanceTo(arm.end.getWorldPosition(new THREE.Vector3()))-.015;
  const direction=target.clone().sub(shoulder);direction.y=0;const axis=new THREE.Vector3(0,1,0).cross(direction.normalize()).normalize(),parent=spine.parent.getWorldQuaternion(new THREE.Quaternion()),worldQ=parent.clone().multiply(base);let angle=0;
  for(;angle<.45;angle+=.05){spine.quaternion.copy(parent.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle).multiply(worldQ)));spine.updateWorldMatrix(false,true);if(arm.upper.getWorldPosition(new THREE.Vector3()).distanceTo(target)<=reach)break;}
  spine.quaternion.copy(parent.invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis,Math.min(.45,angle)*amount).multiply(worldQ)));spine.updateWorldMatrix(false,true);
}
function groundFeet(actor,vehicle,hip,phase=0,stride=0,floor=0) {
  for(const [side,z,offset] of [['l',-.13,0],['r',.13,Math.PI]]){
    const step=Math.sin(phase+offset);
    solveLimb(actor.rig.legs[side],world(vehicle,[hip[0]+step*stride,floor+.10+Math.max(0,step)*stride*.7,hip[2]+z]),pole(vehicle,[1,.4,0]));
  }
}

export function animateInteraction(actor,vehicle,transition) {
  const {phase,progress,occupied}=transition,spec=vehicle.spec,entrySide=spec.entrySide??-1,entryZ=spec.entryZ??spec.seat[2];
  const p=entryPose(spec,phase,progress,occupied),npc=vehicle.npc;
  const fit=fittedSeat(actor,vehicle);p.hip=[...p.hip];p.hip[1]+=(fit.seat[1]-spec.seat[1])*p.sit;p.lean+=fit.lean*p.sit;
  const pullAmount=entrySide===1?0:phase==='climb'?ease((p.boarding-.65)/.35):phase==='close'?1-ease((progress-.65)/.35):0;
  const pull=insidePull(vehicle),pullLocal=vehicle.root.worldToLocal(pull.clone()),dx=pullLocal.x-spec.seat[0],dz=pullLocal.z-spec.seat[2],distance=Math.hypot(dx,dz),perch=Math.min(.07,Math.max(0,distance-.52))*pullAmount;
  if(distance){p.hip[0]+=dx/distance*perch;p.hip[2]+=dz/distance*perch;}
  posed(actor,vehicle,p.hip,p.sit,p.yaw,p.lean,phase==='climb'&&entrySide!==1);
  if(p.sit<1)leanTorso({...actor.rig,chest:actor.rig.head},fit.lean*.45*p.sit);
  if(p.sit===1){driver(actor,vehicle);if(pullAmount)placeHips(actor.rig,world(vehicle,p.hip));}
  leanToPull(actor,pull,pullAmount);
  if((phase==='climb'||phase==='close')&&entrySide!==1){
    // Fit the duck to this rig's head/hat and the actual roof, without scanning
    // skinned vertices each frame. The leg IK below keeps the support foot down.
    const head=vehicle.root.worldToLocal(actor.rig.head.getWorldPosition(new THREE.Vector3()));
    const overlap=ease((spec.halfWidth+.12-Math.abs(head.x))/.2)*ease((head.z+spec.front)/.2)*ease((-spec.rear+.05-head.z)/.2);
    const ceiling=(vehicle.roofHeight?.()??spec.roof)-.035,excess=Math.max(0,headTop(actor,vehicle.root)-ceiling)*overlap;
    if(excess){p.hip[1]=Math.max(fit.seat[1],p.hip[1]-excess);placeHips(actor.rig,world(vehicle,p.hip));}
    if(overlap>.1&&headTop(actor,vehicle.root)>ceiling){
      const base=actor.root.quaternion.clone();let lo=0,hi=1.2;
      const bend=angle=>{actor.root.quaternion.copy(base);actor.root.rotateX(-angle);placeHips(actor.rig,world(vehicle,p.hip));};
      // Continuous angle avoids visible steps as the head clears the roof.
      for(let i=0;i<8;i++){const angle=(lo+hi)/2;bend(angle);if(headTop(actor,vehicle.root)>ceiling)lo=angle;else hi=angle;}
      bend(hi);
    }
  }
  if(phase==='close'&&pullAmount){
    grip(actor,vehicle,'r',world(vehicle,[spec.wheel[0]+.165,spec.wheel[1]+.025,spec.wheel[2]+.045]));
    for(const [side,sign]of [['l',-1],['r',1]])solveLimb(actor.rig.legs[side],world(vehicle,[spec.seat[0]+sign*.105,spec.floor+(actor.rig.soleOffsets?.[side]||0),spec.seat[2]-.66]),pole(vehicle,[0,1,-.4]));
  }
  if(['open','reach','extract','recover'].includes(phase))groundFeet(actor,vehicle,p.hip,progress*Math.PI*2,phase==='recover'?.22:phase==='extract'?.15:.06,p.footFloor);
  if(occupied&&npc&&['open','reach','extract','recover'].includes(phase)) {
    if(phase==='open'||phase==='reach')driver(npc,vehicle);
    else {
      const hip=[...p.npcHip];hip[1]+=(npc.standHip-.94)*(1-p.npcSit)+(fittedSeat(npc,vehicle).seat[1]-spec.seat[1]-.16)*p.npcSit;
      const npcFit=fittedSeat(npc,vehicle);
      posed(npc,vehicle,hip,p.npcSit,phase==='recover'?entrySide*Math.PI/2*(1+ease(progress)):entrySide*Math.PI/2*ease(progress),p.npcLean+(npcFit.lean-.4)*p.npcSit);
      leanTorso({...npc.rig,chest:npc.rig.head},(.4+npcFit.lean*.45)*p.npcSit);
      if(phase==='recover')groundFeet(npc,vehicle,p.npcHip);
      if(phase==='extract')for(const [side,sign,delay] of [['l',-1,0],['r',1,.2]]){
        const t=ease((progress-delay)/(.85-delay));
        const foot=vec([spec.seat[0]+sign*.105,spec.floor-.08,spec.seat[2]-.66]);
        foot.lerp(vec([entrySide*(spec.halfWidth+.82),.03,entryZ+.65+sign*.12]),t);foot.y+=Math.sin(t*Math.PI)*.22;
        solveLimb(npc.rig.legs[side],vehicle.root.localToWorld(foot),pole(vehicle,[-1,1,0]));
      }
      // The passenger braces against the door frame while being pulled out.
      if(phase==='extract'){
        const release=ease(progress/.3);
        const right=world(vehicle,[spec.wheel[0]+.165,spec.wheel[1]+.025,spec.wheel[2]+.045]);
        grip(npc,vehicle,'r',right.lerp(world(vehicle,[entrySide*spec.halfWidth,.9,entryZ+.23]),release));
        const left=world(vehicle,[spec.wheel[0]-.165,spec.wheel[1]+.025,spec.wheel[2]+.045]);
        grip(npc,vehicle,'l',left.lerp(npc.rig.arms.l.end.getWorldPosition(new THREE.Vector3()),release));
      }
    }
  }
  const handle=vehicle.door.localToWorld(vehicle.handle.clone());
  if(phase==='open')doorGrip(actor,(entrySide===1?'l':'r'),handle);
  if((phase==='reach'||phase==='extract')&&npc) {
    const amount=phase==='reach'?ease(progress):1;
    npc.root.updateWorldMatrix(true,true);
    for(const side of ['l','r']) {
      const shoulder=npc.rig.arms[side].upper.getWorldPosition(new THREE.Vector3());
      const hand=actor.rig.arms[side].end.getWorldPosition(new THREE.Vector3());
      grip(actor,vehicle,side,hand.lerp(shoulder,amount));
    }
  }
  if(phase==='climb') {
    const u=ease(progress),outside=entryPose(spec,'climb',0,occupied).hip;
    for(const [side,sign,delay] of [['r',1,0],['l',-1,.3]]) {
      const t=entrySide===1?ease((progress-delay)/(1-delay)):ease((p.boarding-(side==='l'?.40:0))/(side==='l'?.50:.52));
      const ankle=spec.floor+(actor.rig.soleOffsets?.[side]||0),sill=[entrySide*(spec.halfWidth+.30),.12,entryZ+.12+sign*.13];
      const start=vec([outside[0],.12,outside[2]+sign*.13]);if(entrySide!==1)start.lerp(vec(sill),p.approach);
      const foot=start.lerp(vec([spec.seat[0]+sign*.105,ankle,spec.seat[2]-.66]),t);
      if(entrySide===1){const start=vec([outside[0],.12,outside[2]+sign*.13]),aisle=vec([.15,ankle,entryZ+.1+sign*.1]),target=vec([spec.seat[0]+sign*.105,ankle,spec.seat[2]-.66]);foot.copy(progress<.45?start.lerp(aisle,ease(progress/.45)):aisle.lerp(target,ease((progress-.45)/.55)));}
      foot.y+=Math.sin(t*Math.PI)*.22;
      solveLimb(actor.rig.legs[side],vehicle.root.localToWorld(foot),pole(vehicle,[0,1,-.4]));
    }
    const hand=actor.rig.arms.r.end.getWorldPosition(new THREE.Vector3());
    grip(actor,vehicle,'r',hand.lerp(world(vehicle,[spec.wheel[0]+.165,spec.wheel[1]+.025,spec.wheel[2]+.045]),entrySide===1?u:ease(p.boarding/.7)));
    const brace=world(vehicle,entrySide===1?[entrySide*spec.halfWidth,.9,entryZ+.32]:[entrySide*spec.halfWidth,Math.min(spec.wheel[1],p.hip[1]+.30),spec.wheel[2]+.05]);
    const release=entrySide===1?world(vehicle,[spec.wheel[0]-.165,spec.wheel[1]+.025,spec.wheel[2]+.045]):insidePull(vehicle,actor);
    doorGrip(actor,'l',brace.lerp(release,entrySide===1?ease((progress-.7)/.3):pullAmount));
  }
  if(phase==='close'&&entrySide!==1) {
    const wheel=actor.rig.arms.l.end.getWorldPosition(new THREE.Vector3());
    // Release the inside handle as the latch catches, then return to the wheel.
    doorGrip(actor,'l',insidePull(vehicle,actor).lerp(wheel,ease((progress-.65)/.35)));
  }
}

export function animateOccupant(vehicle,state,dt,activeTransition) {
  const actor=vehicle.npc;if(!actor)return;
  actor.root.visible=true;
  if(activeTransition?.occupied&&['extract','recover'].includes(activeTransition.phase))return;
  if(state.occupied){driver(actor,vehicle);return;}
  if(state.npcTime<0)return;
  const elapsed=state.npcTime,distance=Math.min(5,Math.max(0,elapsed-2.2)*1.45),spec=vehicle.spec;
  const origin=state.npcOrigin,c=Math.cos(origin.yaw),s=Math.sin(origin.yaw);
  const x=(spec.entrySide??-1)*(spec.halfWidth+1.15),z=(spec.entryZ??spec.seat[2])+1.2+distance;
  actor.root.position.set(origin.x+c*x+s*z,origin.y+.025,origin.z-s*x+c*z);
  if(elapsed<2.2){
    actor.reaction='angry';blendPose(actor,0);
    actor.root.rotation.set(0,origin.yaw+Math.PI+Math.PI/2*ease(elapsed/.25),0);
    const intensity=ease(elapsed/.2)*ease((2.2-elapsed)/.25);
    leanTorso(actor.rig,.06*intensity);
    for(const [side,sign] of [['l',-1],['r',1]]){
      const wave=Math.sin(elapsed*19+sign*.6),current=actor.rig.arms[side].end.getWorldPosition(new THREE.Vector3());
      const raised=actor.root.localToWorld(vec([sign*(.34+.07*wave),1.66+.1*wave,-.24]));
      solveLimb(actor.rig.arms[side],current.lerp(raised,intensity),vec([sign,-.2,0]).applyQuaternion(actor.root.quaternion));
    }
    return;
  }
  actor.reaction=distance<5?'walking':'idle';
  const name=distance<5?'Walk':'Idle';
  if(actor.animation!==name){actor.mixer.stopAllAction();actor.actions[name].reset().play();actor.animation=name;}
  actor.mixer.update(dt);
  actor.root.rotation.set(0,origin.yaw+Math.PI+Math.PI/2*(1-ease((elapsed-2.2)/.25)),0);
}

export {driver as poseDriver};
