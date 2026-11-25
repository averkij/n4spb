import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createPoseRig,capturePoses,settledSitting,blendPose} from './pose.js';
import {dressRunningJump,easeDressWaist} from './jump.js';

export function createActor(gltf,ctx,{dress=false}={}) {
  const root=new THREE.Group(),visual=clone(gltf.scene);visual.rotation.y=Math.PI;root.add(visual);
  if(dress)easeDressWaist(visual);
  const materialCache=new Map();
  visual.traverse(o=>{
    if(!o.isMesh)return;
    const convert=m=>{
      if(materialCache.has(m))return materialCache.get(m);
      const material=ctx.mat.toon(m.color,{map:m.map,vertexColors:m.vertexColors,side:m.side===THREE.DoubleSide?'double':m.side===THREE.BackSide?'back':undefined,paint:0,name:'character-'+m.name});
      materialCache.set(m,material);return material;
    };
    o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
    o.castShadow=true;o.receiveShadow=true;
  });
  const mixer=new THREE.AnimationMixer(visual),actions={},rig=createPoseRig(root);
  const idle=gltf.animations.find(clip=>clip.name==='Idle');
  for(const source of gltf.animations){
    let clip=source;
    if(source.name==='Sitting')clip=settledSitting(source);
    if(dress&&idle&&source.name==='RunningJump')clip=dressRunningJump(source,idle,rig);
    const action=mixer.clipAction(clip);
    if(/Jump/.test(clip.name)){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
    actions[clip.name]=action;
  }
  for(const name of ['Idle','Walk','Run','Jump','RunningJump','Sitting'])if(!actions[name])throw Error(`Character missing ${name}`);
  const actor={root,visual,mixer,actions,rig,animation:'',activeAction:null};
  capturePoses(actor);blendPose(actor,0);root.updateMatrixWorld(true);
  // SkeletonUtils clones require current bone matrices before computing their
  // bounds. A bound measured before this update can cull the whole body while
  // leaving an unskinned hat visible. Use a conservative actor-space margin.
  visual.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingSphere();const scale=o.getWorldScale(new THREE.Vector3());o.boundingSphere.radius+=1/Math.max(.0001,Math.min(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z)));}});
  ctx.add(root);ctx.alwaysVisible?.(root);root.visible=false;
  return actor;
}

export function animateActor(actor,name,dt,{rate=1,time=null,blend=.16}={}) {
  if(actor.animation!==name){
    const next=actor.actions[name];if(!next)throw Error(`Unknown character action ${name}`);
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if(actor.activeAction){if(name==='Sitting')actor.activeAction.stop();else next.crossFadeFrom(actor.activeAction,blend,false);}
    actor.activeAction=next;actor.animation=name;
  }
  actor.activeAction.paused=time!==null;
  actor.activeAction.timeScale=rate;
  if(time!==null)actor.activeAction.time=time;
  actor.mixer.update(dt);
}
