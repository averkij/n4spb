import assert from 'node:assert/strict';
import * as THREE from 'three';
import {poseDriver} from '../src/world/drive/character-poses.js';
import {createCharacterInteractions} from '../src/world/drive/character-interaction.js';

// The car factories face +Z; the animation cabin is a rotated child, not a
// top-level transform. Test the production pose helper against that hierarchy.
function makeActor(){
  const root=new THREE.Group(),hips=new THREE.Bone();hips.position.y=1;root.add(hips);
  const pose={p:hips.position.clone(),q:hips.quaternion.clone(),s:hips.scale.clone()};
  return {root,standing:[pose],seated:[pose],rig:{root,hips,bones:[hips],arms:{},legs:{}}};
}
for(const yaw of [0,.7,Math.PI,-2.3]){
  const car=new THREE.Group();car.position.set(7,2,-4);car.rotation.set(.08,yaw,-.12,'YXZ');
  const frame=new THREE.Group();frame.rotation.y=Math.PI;car.add(frame);car.updateMatrixWorld(true);
  const actor=makeActor(),cabin={root:frame,spec:{seat:[-.35,.6,.2],wheel:[-.35,1,-.3],floor:.3}};
  poseDriver(actor,cabin);
  const expected=frame.getWorldQuaternion(new THREE.Quaternion());
  assert.ok(actor.root.getWorldQuaternion(new THREE.Quaternion()).angleTo(expected)<1e-6,`driver follows the whole car transform at yaw ${yaw}`);
  const hip=actor.rig.hips.getWorldPosition(new THREE.Vector3()),seat=frame.localToWorld(new THREE.Vector3(...cabin.spec.seat));
  assert.ok(hip.distanceTo(seat)<1e-6,'driver remains seated after car pitch, roll and yaw');
}

function fixture(){
  let driving=false,added=0,dropped=0,inside=false;
  const modelRoot=new THREE.Group(),frame=new THREE.Group();frame.rotation.y=Math.PI;modelRoot.add(frame);
  const door=new THREE.Group();frame.add(door);
  const spec={halfWidth:.9,halfLength:2,seat:[-.35,.5,.2],wheel:[-.35,.9,-.3],floor:.2};
  const v={model:{root:modelRoot,setView(value){inside=value;frame.visible=!value;}},car:{speed:0,air:false,y:0,yaw:0},parked:{y:0},cabin:{root:frame,spec,door,occupied:false,npc:null,npcTime:-1}};
  const player={pos:new THREE.Vector3(3,0,0),vel:new THREE.Vector3(),inputLock:0,facingYaw:0,jump:null,vy:0};
  const characters={busy:false,createNpc:()=>null,override(){},update(){}};
  const ctx={playerObj:player,camera:new THREE.PerspectiveCamera(),physics:{columnBlocked:()=>false},ui:{toast(){},modalOpen:false}};
  const interaction=createCharacterInteractions(ctx,{characters,vehicles:[v],view:{mode:0},active:()=>driving,activeVehicle:()=>v,
    enterNow(){driving=true;player.inputLock++;},exitNow(){driving=false;player.inputLock--;},dropBox(){dropped++;},addBox(){added++;}});
  const finish=()=>{let frames=0;while(interaction.active&&frames++<600)interaction.update(1/60);assert.ok(frames<600,'sequence finishes');};
  return {v,player,characters,ctx,interaction,finish,get driving(){return driving;},get added(){return added;},get dropped(){return dropped;},get inside(){return inside;}};
}
{
  const f=fixture();assert.equal(f.interaction.enter(f.v),true);
  assert.equal(f.player.inputLock,1);assert.equal(f.characters.busy,true);
  assert.equal(f.interaction.enter(f.v),false,'repeat entry cannot stack input locks');
  f.ctx.ui.modalOpen=true;const before=f.player.pos.clone();f.interaction.update(.05);
  assert.equal(f.player.pos.distanceTo(before),0,'modal pauses approach');f.ctx.ui.modalOpen=false;
  f.finish();assert.equal(f.driving,true);assert.equal(f.player.inputLock,1);assert.equal(f.characters.busy,false);
  f.v.car.air=true;assert.equal(f.interaction.exit(),false,'an airborne car cannot start exiting');f.v.car.air=false;
  f.v.model.setView(true);assert.equal(f.interaction.exit(),true);
  assert.equal(f.inside,false,'exit reveals the cabin and animated door before the external camera starts');
  f.finish();assert.equal(f.driving,false);assert.equal(f.player.inputLock,0);assert.equal(f.characters.busy,false);
  assert.equal(f.v.cabin.door.rotation.y,0,'door is closed at sequence completion');
}
{
  const f=fixture();f.interaction.enter(f.v);f.interaction.update(.05);f.interaction.cancel();
  assert.equal(f.interaction.active,false);assert.equal(f.player.inputLock,0);assert.equal(f.characters.busy,false);
  assert.equal(f.added,1,'cancelled parked entry restores its collider');
}
{
  const f=fixture();f.player.pos.set(10,0,0);f.interaction.enter(f.v);
  // An adjacent car obstructs the primary rearward shot, while the other side
  // is clear. The camera must retain a useful distance from the interaction.
  f.ctx.physics.columnBlocked=(x,z)=>z<-.4;
  for(let i=0;i<60;i++)f.interaction.update(1/60);
  assert(f.ctx.camera.position.z>2,'camera selects a clear alternate side');
  assert(f.ctx.camera.position.distanceTo(f.player.pos)>3,'blocked primary shot does not collapse onto actor');
  f.interaction.cancel();
}
{
  const f=fixture();f.player.pos.set(10,0,0);f.interaction.enter(f.v);
  const desired=f.v.cabin.root.localToWorld(new THREE.Vector3(-4.5,2.8,3.3));
  for(let i=0;i<60;i++){
    // Player.applyCamera runs before the driving module in production.
    f.ctx.camera.position.set(100,100,100);f.interaction.update(1/60);
  }
  assert(f.ctx.camera.position.distanceTo(desired)<.001,'interaction eases from its own prior camera despite walker overwrites');
  f.interaction.cancel();
}
console.log('PASS: cabin transforms, seated hips, interaction locks/pause/exit/cancel, blocked-camera alternatives and independent camera convergence');
