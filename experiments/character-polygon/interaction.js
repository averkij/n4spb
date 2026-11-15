import * as THREE from 'three';
import {entryPose,ease} from './vehicle-specs.js';
import {blendPose,fitDriver,placeHips,solveLimb,leanTorso} from './character-pose.js';

const vec=a=>new THREE.Vector3(...a);
const world=(vehicle,p)=>vehicle.root.localToWorld(vec(p));
const pole=(vehicle,p)=>vec(p).transformDirection(vehicle.root.matrixWorld);
function posed(actor,vehicle,hip,sit,yaw=0,lean=0) {
  blendPose(actor,sit);actor.root.rotation.set(0,vehicle.root.rotation.y+yaw,0);
  placeHips(actor.rig,world(vehicle,hip));leanTorso(actor.rig,lean);
}
function driver(actor,vehicle,steering=0) {
  blendPose(actor,1);actor.root.rotation.set(0,vehicle.root.rotation.y,0);
  const s=vehicle.spec,seat=[...s.seat];
  if(actor===vehicle.npc){actor.reaction='seated';actor.animation=null;seat[1]-=.16;leanTorso(actor.rig,-.4);leanTorso({...actor.rig,chest:actor.rig.head},.4);}
  fitDriver(actor.rig,vehicle.root,seat,s.wheel,steering,s.floor-(actor===vehicle.npc ? .08 : 0));
}
function grip(actor,vehicle,side,target) {solveLimb(actor.rig.arms[side],target,pole(vehicle,[side==='l'?-1:1,-.6,.1]));}
function groundFeet(actor,vehicle,hip,phase=0,stride=0) {
  for(const [side,z,offset] of [['l',-.13,0],['r',.13,Math.PI]]){
    const step=Math.sin(phase+offset);
    solveLimb(actor.rig.legs[side],world(vehicle,[hip[0]+step*stride,.10+Math.max(0,step)*stride*.7,hip[2]+z]),pole(vehicle,[1,.4,0]));
  }
}

export function animateInteraction(actor,vehicle,transition) {
  const {phase,progress,occupied}=transition,spec=vehicle.spec;
  const p=entryPose(spec,phase,progress,occupied),npc=vehicle.npc;
  posed(actor,vehicle,p.hip,p.sit,p.yaw,p.lean);
  if(p.sit===1)driver(actor,vehicle);
  if(['open','reach','extract','recover'].includes(phase))groundFeet(actor,vehicle,p.hip,progress*Math.PI*2,phase==='recover'?.22:phase==='extract'?.15:.06);
  if(occupied&&npc&&['open','reach','extract','recover'].includes(phase)) {
    if(phase==='open'||phase==='reach')driver(npc,vehicle);
    else {
      const hip=[...p.npcHip];hip[1]+=(npc.standHip-.94)*(1-p.npcSit)-.16*p.npcSit;
      posed(npc,vehicle,hip,p.npcSit,phase==='recover'?-Math.PI/2*(1+ease(progress)):-Math.PI/2*ease(progress),p.npcLean-.4*p.npcSit);
      leanTorso({...npc.rig,chest:npc.rig.head},.4*p.npcSit);
      if(phase==='recover')groundFeet(npc,vehicle,p.npcHip);
      if(phase==='extract')for(const [side,sign,delay] of [['l',-1,0],['r',1,.2]]){
        const t=ease((progress-delay)/(.85-delay));
        const foot=vec([spec.seat[0]+sign*.105,spec.floor-.08,spec.seat[2]-.66]);
        foot.lerp(vec([-spec.halfWidth-.82,.03,spec.seat[2]+.65+sign*.12]),t);foot.y+=Math.sin(t*Math.PI)*.22;
        solveLimb(npc.rig.legs[side],vehicle.root.localToWorld(foot),pole(vehicle,[-1,1,0]));
      }
      // The passenger braces against the door frame while being pulled out.
      if(phase==='extract'){
        const release=ease(progress/.3);
        const right=world(vehicle,[spec.wheel[0]+.165,spec.wheel[1]+.025,spec.wheel[2]+.045]);
        grip(npc,vehicle,'r',right.lerp(world(vehicle,[-spec.halfWidth,.9,spec.seat[2]+.23]),release));
        const left=world(vehicle,[spec.wheel[0]-.165,spec.wheel[1]+.025,spec.wheel[2]+.045]);
        grip(npc,vehicle,'l',left.lerp(npc.rig.arms.l.end.getWorldPosition(new THREE.Vector3()),release));
      }
    }
  }
  const handle=vehicle.door.localToWorld(vehicle.handle.clone());
  if(phase==='open')grip(actor,vehicle,'r',handle);
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
      const t=ease((progress-delay)/(1-delay));
      const foot=vec([outside[0],.12,outside[2]+sign*.13]).lerp(vec([spec.seat[0]+sign*.105,spec.floor,spec.seat[2]-.66]),t);
      foot.y+=Math.sin(t*Math.PI)*.22;
      solveLimb(actor.rig.legs[side],vehicle.root.localToWorld(foot),pole(vehicle,[0,1,-.4]));
    }
    const hand=actor.rig.arms.r.end.getWorldPosition(new THREE.Vector3());
    grip(actor,vehicle,'r',hand.lerp(world(vehicle,[spec.wheel[0]+.165,spec.wheel[1]+.025,spec.wheel[2]+.045]),u));
    const brace=world(vehicle,[-spec.halfWidth,.9,spec.seat[2]+.32]);
    grip(actor,vehicle,'l',brace.lerp(handle,ease((progress-.7)/.3)));
  }
  if(phase==='close') {
    const wheel=actor.rig.arms.l.end.getWorldPosition(new THREE.Vector3());
    // Release the inside handle as the latch catches, then return to the wheel.
    grip(actor,vehicle,'l',handle.lerp(wheel,ease((progress-.65)/.35)));
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
  const x=-spec.halfWidth-1.15,z=spec.seat[2]+1.2+distance;
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
