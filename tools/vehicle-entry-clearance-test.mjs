// Real parked colliders + production entry controller. No collision stubs.
import './lib/headless-world.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Physics} from '../src/core/physics.js';
import {createMaterials} from '../src/core/materials.js';
import {createActor} from '../src/world/character/actor.js';
import {createCharacterInteractions} from '../src/world/drive/character-interaction.js';
import {entryPose} from '../src/world/drive/entry-poses.js';
import {createVehicleCabin} from '../src/world/drive/vehicle-cabin.js';
import {loadGarage} from '../src/world/drive/cars/index.js';
import {trafficDefinition} from '../src/world/drive/traffic-model.js';
import {DRIVABLE_KINDS} from '../src/world/traffic/fleetdata.js';

// Optional local before/after proof; normal CI needs no historical checkout.
// Only the pose module changes. Controller and real Physics remain identical.
const baselineIndex=process.argv.indexOf('--baseline');let createRegressedInteractions=null;
if(baselineIndex>=0){
  const revision=process.argv[baselineIndex+1];assert(revision&&!revision.startsWith('--'),'--baseline requires a git revision');
  const poseSource=execFileSync('git',['show',`${revision}:src/world/drive/entry-poses.js`],{encoding:'utf8'}),poseURL='data:text/javascript;base64,'+Buffer.from(poseSource).toString('base64');
  const controllerURL=new URL('../src/world/drive/character-interaction.js',import.meta.url);
  const oldSource=fs.readFileSync(controllerURL,'utf8').replace(/from '([^']+)'/g,(_,source)=>`from '${source==='three'?import.meta.resolve('three'):source==='./entry-poses.js'?poseURL:new URL(source,controllerURL).href}'`);
  ({createCharacterInteractions:createRegressedInteractions}=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64')));
}
globalThis.createImageBitmap=async()=>({width:1,height:1});globalThis.ProgressEvent??=class{};
const shared={uNight:{value:.6}},ctxModel={rng:()=>()=>.4,tex:{draw:()=>new THREE.Texture()},shared,noOutline(){},mat:createMaterials(shared),add(){}};
const bytes=fs.readFileSync(new URL('../assets/characters/civilian.glb',import.meta.url));
const npc=createActor(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),ctxModel);
const definitions=await loadGarage(ctxModel);
definitions.push(...DRIVABLE_KINDS.map((kind,i)=>trafficDefinition({id:`traffic-entry-${i}`,kind,color:new THREE.Color('#275c8a'),plate:0})));

function fixture(def,yaw=0,fromOpposite=false,create=createCharacterInteractions){
  const physics=new Physics(()=>0),model=def.makeModel(ctxModel),spec=def.spec;
  const parked={x:13.7,y:0,z:-8.9,yaw},car={...parked,speed:0,air:false,vx:0,vz:0,yawVel:0,steer:0};
  const vehicle={id:def.id,kind:def.kind,def,model,spec,parked,car,box:null};
  const cabin=createVehicleCabin(ctxModel,vehicle),side=cabin.spec.entrySide??-1;
  model.root.position.set(parked.x,parked.y,parked.z);model.root.rotation.y=yaw;model.root.updateMatrixWorld(true);
  const player={pos:cabin.root.localToWorld(new THREE.Vector3(side*(fromOpposite?-1:1)*(cabin.spec.halfWidth+1),0,cabin.spec.entryZ??cabin.spec.seat[2])),vel:new THREE.Vector3(),inputLock:0,facingYaw:0,vy:0,jump:null};
  let driving=false,dropped=0,added=0;const toasts=[];
  // Same OBB dimensions, centre offset and vertical range as drive.js:addBox.
  const addBox=()=>{if(vehicle.box)return;const p=vehicle.parked;vehicle.box=physics.addBox(p.x+Math.sin(p.yaw)*spec.centerZ,p.z+Math.cos(p.yaw)*spec.centerZ,spec.W+.08,spec.len+.08,p.yaw,p.y-.03,p.y-.03+spec.hgt);added++;};
  const dropBox=()=>{if(vehicle.box){physics.remove(vehicle.box);vehicle.box=null;}dropped++;};addBox();
  const characters={busy:false,createNpc:()=>npc,releaseNpc(){},override(){},update(){}};
  const ctx={physics,playerObj:player,camera:new THREE.PerspectiveCamera(),ui:{toast:text=>toasts.push(text),modalOpen:false}};
  const interaction=create(ctx,{characters,vehicles:[vehicle],view:{mode:0},active:()=>driving,activeVehicle:()=>vehicle,dropBox,addBox,
    enterNow(){driving=true;player.inputLock++;},exitNow(_force,target){driving=false;player.inputLock--;player.pos.set(target.x,parked.y,target.z);addBox();}});
  const finish=()=>{let count=0;while(interaction.active&&count++<1800)interaction.update(1/30);assert(count<1800,`${def.id}: sequence stalled`);};
  return {physics,vehicle,cabin,player,interaction,characters,finish,toasts,addBox,dropBox,get driving(){return driving;},get dropped(){return dropped;},get added(){return added;}};
}

let historicalFailures=0,approaches=0,cycles=0,blocked=0;
for(const def of definitions){
  if(createRegressedInteractions){
    const old=fixture(def,.71,false,createRegressedInteractions),owned=old.vehicle.box;
    assert.equal(old.interaction.enter(old.vehicle),false,`${def.id}: historical 15.1.1 must reproduce blocked entry`);
    assert.equal(old.vehicle.box,owned,'failed begin must retain the car collider');assert.equal(old.dropped,0);assert.equal(old.player.inputLock,0);historicalFailures++;
  }
  for(const yaw of [0,.71,Math.PI,-1.9])for(const opposite of [false,true]){
    const f=fixture(def,yaw,opposite);assert(f.vehicle.box,'owned parked collider exists before begin');
    assert(f.interaction.enter(f.vehicle),`${def.id}, yaw=${yaw}, opposite=${opposite}: clear entry rejected`);
    assert.equal(f.interaction.state.occupied,true);assert.equal(f.vehicle.box,null);assert.equal(f.dropped,1);
    f.interaction.cancel();assert(f.vehicle.box);assert.equal(f.player.inputLock,0);assert.equal(f.characters.busy,false);approaches++;
  }
  const f=fixture(def,-.63,true);assert(f.interaction.enter(f.vehicle));f.finish();assert(f.driving);assert.equal(f.cabin.occupied,false,'occupant was extracted');
  assert(f.interaction.exit(),`${def.id}: exit rejected`);f.finish();assert(!f.driving);assert(f.vehicle.box,'exit restores parked collider');
  assert(!f.physics.columnBlocked(f.player.pos.x,f.player.pos.z,.3,.3,1.6),`${def.id}: exit leaves walker overlapping own car`);
  assert(f.interaction.enter(f.vehicle),`${def.id}: empty re-entry rejected by restored collider`);assert.equal(f.interaction.state.occupied,false);f.finish();assert(f.driving);cycles++;
  // A real wall at the final approach/exit point must still reject entry and
  // exit; removing only the wall must restore both paths.
  const wallCase=fixture(def,.83,false),target=wallCase.cabin.root.localToWorld(new THREE.Vector3(...entryPose(wallCase.cabin.spec,'open',0,true).hip));
  const wall=wallCase.physics.addBox(target.x,target.z,.25,.25,.37,0,2.5);
  assert.equal(wallCase.interaction.enter(wallCase.vehicle),false,`${def.id}: wall must block entry`);assert(wallCase.vehicle.box);assert.equal(wallCase.dropped,0);assert.equal(wallCase.player.inputLock,0);
  wallCase.physics.remove(wall);assert(wallCase.interaction.enter(wallCase.vehicle));wallCase.finish();
  const exitWall=wallCase.physics.addBox(target.x,target.z,.25,.25,.37,0,2.5);
  assert.equal(wallCase.interaction.exit(),false,`${def.id}: wall must block exit`);assert(wallCase.driving);assert.equal(wallCase.characters.busy,false);
  wallCase.physics.remove(exitWall);assert(wallCase.interaction.exit());wallCase.finish();blocked+=2;
}
console.log(`PASS: ${historicalFailures?`${historicalFailures} historical 15.1.1 failures reproduced; `:''}${approaches} real-Physics rotated/both-side approaches; ${cycles} occupied entry/exit/empty re-entry cycles; ${blocked} real-wall rejections`);
