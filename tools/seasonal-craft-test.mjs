import './lib/headless-world.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createActor } from '../src/world/character/actor.js';
import { createMaterials } from '../src/core/materials.js';
import { Physics } from '../src/core/physics.js';
import { loadBoats } from '../src/world/drive/boat/index.js';
import { createBoatHandling } from '../src/world/drive/boat/handling.js';

globalThis.createImageBitmap=async()=>({width:1,height:1});
globalThis.ProgressEvent??=class{};
const shared={uNight:{value:0}}, ctx={shared,mat:createMaterials(shared),noOutline(){},add(){},
  L:{heightAt:()=>-3,inPlay:()=>true,insideBuilding:()=>false},physics:new Physics(()=>-3,()=>0)};
const actors=[];
for(const name of ['woman-beret','man-jacket']){
  const bytes=fs.readFileSync(new URL('../assets/characters/'+name+'.glb',import.meta.url));
  const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  actors.push(createActor(asset,ctx,{dress:name==='woman-beret'}));
}
for(const season of ['winter','summer']){
  ctx.season=season;
  const [v]=loadBoats(ctx,{docks:[{id:'boat',x:0,z:0,yaw:0}]});
  const sled=season==='winter';
  assert.equal(v.nameEn,sled?'Snowmobile':'Motor boat');
  const model=v.makeModel(ctx), seat=sled?[0,.87,-.25]:[.34,.48,-.18];
  for(const actor of actors){
    model.set({x:17,y:-2,z:8,yaw:.7,pitch:.04,roll:.07,steer:.3,steerAngle:.1});
    model.poseDriver(actor);
    const hip=actor.rig.hips.getWorldPosition(new THREE.Vector3());
    assert(hip.distanceTo(model.root.localToWorld(new THREE.Vector3(...seat)))<.001);
    const hand=actor.rig.arms.l.end.getWorldPosition(new THREE.Vector3());
    const grip=sled?[.28,1.04,.13]:[.49,.92,.22];
    assert(hand.distanceTo(model.root.localToWorld(new THREE.Vector3(...grip)))<.23,'left hand reaches control');
  }
  const vehicle=createBoatHandling(ctx,v.tuning);vehicle.reset(0,0,0);
  for(let i=0;i<3600;i++)vehicle.step(1/60,{thr:1,brk:0,steer:0});
  assert(sled?vehicle.speed>105 && vehicle.speed<125:vehicle.speed>40 && vehicle.speed<52);
  console.log(v.nameEn,vehicle.speed.toFixed(1),'km/h; both playable characters at controls');
}
