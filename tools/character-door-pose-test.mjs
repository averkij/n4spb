// CPU verification using both shipped skeletons and every enterable model.
import './lib/headless-world.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createActor} from '../src/world/character/actor.js';
import {animateInteraction,poseDriver,insidePull} from '../src/world/drive/character-poses.js';
import {entryPose} from '../src/world/drive/entry-poses.js';
import {createVehicleCabin} from '../src/world/drive/vehicle-cabin.js';
import {loadGarage} from '../src/world/drive/cars/index.js';
import {trafficDefinition} from '../src/world/drive/traffic-model.js';
import {DRIVABLE_KINDS} from '../src/world/traffic/fleetdata.js';
import {createMaterials} from '../src/core/materials.js';
import {createDamageState} from '../src/world/drive/damage.js';
globalThis.createImageBitmap=async()=>({width:1,height:1});globalThis.ProgressEvent??=class{};
const shared={uNight:{value:.6}},ctx={rng:()=>()=>.4,tex:{draw:()=>new THREE.Texture()},shared,noOutline(){},mat:createMaterials(shared),add(){}};
const actors=[];for(const name of ['woman-beret','man-jacket']){const b=fs.readFileSync(new URL(`../assets/characters/${name}.glb`,import.meta.url)),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');actors.push({name,actor:createActor(g,ctx,{dress:name==='woman-beret'})});}
const npcBytes=fs.readFileSync(new URL('../assets/characters/civilian.glb',import.meta.url)),npc=createActor(await new GLTFLoader().parseAsync(npcBytes.buffer.slice(npcBytes.byteOffset,npcBytes.byteOffset+npcBytes.byteLength),''),ctx);
const defs=await loadGarage(ctx);defs.push(...DRIVABLE_KINDS.map((kind,i)=>trafficDefinition({id:`traffic-car-${i}`,kind,color:new THREE.Color('#275c8a'),plate:0})));
const rows=[];
for(const def of defs){
 const model=def.makeModel(ctx),v={id:def.id,kind:def.kind,def,model,spec:def.spec},c=createVehicleCabin(ctx,v),side=c.spec.entrySide??-1;
 for(const {name,actor}of actors){
  // Check the actual intermediate skeleton, not only the final driver pose.
  // A seated character must stay over the cushion while reaching for the door.
  for(const occupied of [false,true])for(const phase of ['climb','close'])for(let step=0;step<=20;step++){
   const progress=step/20,p=entryPose(c.spec,phase,progress,occupied);c.door.rotation.y=side*1.15*p.door;model.root.updateWorldMatrix(true,true);
   animateInteraction(actor,c,{phase,progress,occupied});actor.root.updateWorldMatrix(true,true);
   const hip=c.root.worldToLocal(actor.rig.hips.getWorldPosition(new THREE.Vector3()));
   if(side!==1){
    if(side*hip.x>c.spec.halfWidth-.08)assert(p.sit<.35,`${def.id}/${name}: sits before crossing the sill`);
    if(phase==='close'||progress>=.9)assert(Math.hypot(hip.x-c.spec.seat[0],hip.z-c.spec.seat[2])<=.08,`${def.id}/${name}: seated pelvis slides out to reach the door`);
    const head=c.root.worldToLocal(actor.rig.head.getWorldPosition(new THREE.Vector3()));
    if(phase==='climb'&&Math.abs(head.x)<c.spec.halfWidth-.07&&head.z>-c.spec.front+.15&&head.z<-c.spec.rear-.1){
     actor.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
     assert(new THREE.Box3().setFromObject(actor.root,true).max.y<=c.spec.roof+.015,`${def.id}/${name}/${progress}/${occupied}: head crosses roof during entry`);
    }
   }
  }
  let planted;
  for(const phase of ['open','close'])for(let step=0;step<=20;step++){
   const progress=step/20,p=entryPose(c.spec,phase,progress,false);c.door.rotation.y=side*1.15*p.door;model.root.updateWorldMatrix(true,true);
   animateInteraction(actor,c,{phase,progress,occupied:false});actor.root.updateWorldMatrix(true,true);
   if(phase==='open'){
     const points=[actor.rig.hips,actor.rig.legs.l.end,actor.rig.legs.r.end].map(b=>b.getWorldPosition(new THREE.Vector3()));
     if(!planted)planted=points;
     points.forEach((point,i)=>assert((i===0?Math.hypot(point.x-planted[i].x,point.z-planted[i].z):point.distanceTo(planted[i]))<.005,`${def.id}/${name}: slides while opening`));
     const hipAtDoor=c.door.worldToLocal(points[0].clone());
     const doorLength=c.spec.front-(c.spec.doorRear??c.spec.rear);
     const pastEnd=Math.max(0,-hipAtDoor.z,hipAtDoor.z-doorLength);
     assert(Math.hypot(hipAtDoor.x,pastEnd)>.14,`${def.id}/${name}: opening panel crosses pelvis`);
     if(progress>=.25&&progress<=.40){
       const hand=actor.rig.arms[side===1?'l':'r'].end.getWorldPosition(new THREE.Vector3());
       const error=hand.distanceTo(c.door.localToWorld(c.handle.clone()));
       assert(error<.075,`${def.id}/${name}: misses outside latch by ${error} m`);
     }
   }
   if(phase==='close'&&side===1)continue;
   const handSide=phase==='open'?(side===1?'l':'r'):'l',arm=actor.rig.arms[handSide],sign=handSide==='l'?-1:1;
   const upper=actor.root.worldToLocal(arm.upper.getWorldPosition(new THREE.Vector3())),hand=actor.root.worldToLocal(arm.end.getWorldPosition(new THREE.Vector3())),elbow=actor.root.worldToLocal(arm.lower.getWorldPosition(new THREE.Vector3()));
   assert(hand.x*sign>=-.015,`${def.id}/${name}/${phase}: hand crosses spine`);assert(hand.z<=upper.z+.025,`${def.id}/${name}/${phase}: hand reaches behind shoulder`);assert(elbow.x*sign>=-.015,`${def.id}/${name}/${phase}: elbow crosses spine`);
   if(phase==='close'&&progress<=.65){assert(arm.end.getWorldPosition(new THREE.Vector3()).distanceTo(insidePull(c,actor))<.08,`${def.id}/${name}/${progress}: hand misses inside pull`);}
  }
  poseDriver(actor,c);actor.root.updateMatrixWorld(true);actor.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(actor.root,true),top=box.max.y,hip=actor.rig.hips.getWorldPosition(new THREE.Vector3()).y;
  assert(top<=c.spec.roof-.025,`${def.id}/${name}: head/hat ${top} protrudes through roof ${c.spec.roof}`);
  assert(hip>=c.spec.floor+.01,`${def.id}/${name}: pelvis below cabin floor`);
  animateInteraction(actor,c,{phase:'climb',progress:1,occupied:false});actor.root.updateWorldMatrix(true,true);const seated=actor.rig.bones.map(b=>b.getWorldPosition(new THREE.Vector3()));
  animateInteraction(actor,c,{phase:'close',progress:0,occupied:false});actor.root.updateWorldMatrix(true,true);
  const jump=Math.max(...actor.rig.bones.map((b,i)=>b.getWorldPosition(new THREE.Vector3()).distanceTo(seated[i])));
  assert(jump<.08,`${def.id}/${name}: climb-to-close jump ${jump}`);
  rows.push({id:def.id,name,top,roof:c.spec.roof,hip,floor:c.spec.floor,climbToDriver:jump});
  v.damage={state:createDamageState()};
  for(const severity of [.4,.8,1]){
    Object.assign(v.damage.state,{front:severity,rear:severity,left:severity,right:severity});v.damage.state.revision++;
    for(const steering of [-.7,0,.7]){
      poseDriver(actor,c,steering);actor.root.updateMatrixWorld(true);actor.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
      const bounds=new THREE.Box3().setFromObject(actor.root,true),ceiling=c.roofHeight(),hips=actor.rig.hips.getWorldPosition(new THREE.Vector3()).y;
      assert(bounds.max.y<=ceiling-.01,`${def.id}/${name}/${severity}: damaged-roof clearance ${bounds.max.y} > ${ceiling}`);
      assert(hips>=c.spec.seat[1]-.071,`${def.id}/${name}: pelvis sank through seat cushion`);
      assert(bounds.min.y>=c.spec.floor-.04,`${def.id}/${name}/${severity}: soles below floor ${bounds.min.y} < ${c.spec.floor}`);
    }
  }
  delete v.damage;
 }
 c.npc=npc;v.damage={state:createDamageState()};Object.assign(v.damage.state,{front:1,rear:1,left:1,right:1});v.damage.state.revision++;
 poseDriver(npc,c);npc.root.updateMatrixWorld(true);const npcHead=npc.rig.head.getWorldPosition(new THREE.Vector3()),npcHip=npc.rig.hips.getWorldPosition(new THREE.Vector3());
 animateInteraction(actors[0].actor,c,{phase:'extract',progress:0,occupied:true});npc.root.updateMatrixWorld(true);
 assert(npc.rig.head.getWorldPosition(new THREE.Vector3()).distanceTo(npcHead)<.001,`${def.id}: crushed-roof NPC head pops at extraction`);assert(npc.rig.hips.getWorldPosition(new THREE.Vector3()).distanceTo(npcHip)<.001,`${def.id}: NPC seat pops at extraction`);
}
console.log(`PASS: ${defs.length} cabins x 2 real rigs, forward door reaches, elbow clearance, pristine/crushed roof and sole bounds, seat-cushion minimum and seated transition continuity`);
