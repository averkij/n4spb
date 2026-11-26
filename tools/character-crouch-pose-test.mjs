// Measure both shipping rigs through crouch idle, a complete stride and blends.
import './lib/headless-world.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createMaterials} from '../src/core/materials.js';
import {createActor,animateActor} from '../src/world/character/actor.js';
import {groundCrouchBlend,installCrouchActions} from '../src/world/character/crouch.js';

globalThis.createImageBitmap=async()=>({width:1,height:1});
globalThis.ProgressEvent??=class{};
const ctx={mat:createMaterials({uNight:{value:0}}),add(){}};
const sampleBounds=actor=>{
  actor.root.updateMatrixWorld(true);
  actor.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  return new THREE.Box3().setFromObject(actor.root,true);
};

for(const name of ['woman-beret','man-jacket']){
  const data=fs.readFileSync(new URL(`../assets/characters/${name}.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const actor=createActor(gltf,ctx,{dress:name==='woman-beret'});
  installCrouchActions(actor);
  for(const clip of ['CrouchIdle','CrouchWalk']){
    actor.mixer.stopAllAction();actor.activeAction=null;actor.animation='';
    let lift=0;
    for(let i=0;i<64;i++){
      animateActor(actor,clip,1/64,{time:i/64});
      const box=sampleBounds(actor);
      const y=side=>actor.rig.legs[side].end.getWorldPosition(new THREE.Vector3()).y;
      lift=Math.max(lift,Math.abs(y('l')-y('r')));
      assert(box.max.y<1.32&&box.min.y>-.002&&box.min.y<.002,`${name}/${clip}: fit the low ceiling with soles at the floor`);
    }
    assert(clip==='CrouchIdle'?lift<.002:lift>.10,`${name}/${clip}: suitable foot motion for this stance`);
  }
  for(const [before,after] of [['Idle','CrouchIdle'],['CrouchIdle','CrouchWalk'],['CrouchWalk','Idle']]){
    actor.mixer.stopAllAction();actor.activeAction=null;actor.animation='';
    actor.root.position.y=0;animateActor(actor,before,.15);
    for(let i=0;i<12;i++){
      actor.root.position.y=0;
      animateActor(actor,after,1/60);
      groundCrouchBlend(actor);
      const box=sampleBounds(actor);
      assert(Math.abs(box.min.y)<.003,`${name}/${before} → ${after}: transition keeps a foot on the floor`);
    }
  }
}
console.log('PASS: both crouch clips clear the low ceiling, step naturally, and keep soles planted through stance transitions');
