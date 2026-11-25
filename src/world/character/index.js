import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createActor,animateActor} from './actor.js';
import {jumpClipTime} from './jump-timing.js';
import {fitJump} from './jump.js';
import {loadCharacterChoice,saveCharacterChoice,installCharacterSettings,CHARACTER_CHOICES} from './settings.js';
export {createActor,animateActor} from './actor.js';
export {blendPose,fitDriver,solveLimb,placeHips,leanTorso} from './pose.js';

const URLS=[
  new URL('../../../assets/characters/woman-beret.glb',import.meta.url).href,
  new URL('../../../assets/characters/man-jacket.glb',import.meta.url).href,
  new URL('../../../assets/characters/civilian.glb',import.meta.url).href,
];
/** Three templates, two player rigs, and a bounded caller-owned NPC pool. The
 * city fleet keeps distant seated drivers instanced; only nearby interaction
 * actors need a full skeleton. No renderer or physics engine is duplicated. */
export async function createCharacters(ctx,{manualUpdate=false,maxNpcs=12}={}) {
  if(ctx.characters)return ctx.characters;
  const loader=new GLTFLoader(),templates=await Promise.all(URLS.map(url=>loader.loadAsync(url)));
  const actors=[createActor(templates[0],ctx,{dress:true}),createActor(templates[1],ctx)],npcs=[],free=[];
  const player=ctx.playerObj;let storage=null;try{storage=globalThis.localStorage;}catch{}
  let index=loadCharacterChoice(storage),override=null,lastOverride=false,footLift=0;
  const cross=globalThis.document?.getElementById('cross');
  const api={
    get actor(){return actors[index];},get selected(){return actors[index];},get index(){return index;},actors,choices:CHARACTER_CHOICES,
    busy:false,ready:true,openSettings(){},
    select(choice){
      choice=Number(choice);if(api.busy||![0,1].includes(choice))return false;
      for(const actor of actors){actor.root.visible=false;actor.mixer.stopAllAction();actor.activeAction=null;actor.animation='';}
      index=choice;saveCharacterChoice(storage,index);api.update(0);return true;
    },
    override(fn){override=typeof fn==='function'?fn:null;},
    createNpc(){
      let actor=free.pop();
      if(!actor){if(npcs.length>=maxNpcs)return null;actor=createActor(templates[2],ctx);npcs.push(actor);}
      actor.root.visible=true;actor.inUse=true;return actor;
    },
    releaseNpc(actor){if(!actor?.inUse)return;actor.inUse=false;actor.root.visible=false;actor.mixer.stopAllAction();actor.activeAction=null;actor.animation='';free.push(actor);},
    update(dt){
      if(!player)return;
      // The dot aims the first-person camera; it should not sit on the avatar
      // in either chase view or during a vehicle interaction.
      if(cross)cross.hidden=!player.firstPerson||!!override;
      const actor=actors[index];
      if(override){lastOverride=true;actor.root.visible=true;override(actor,dt,api);return;}
      if(lastOverride){actor.mixer.stopAllAction();actor.activeAction=null;actor.animation='';lastOverride=false;}
      actor.root.position.copy(player.pos);actor.root.rotation.set(0,player.facingYaw??player.yaw,0);
      // Paving is drawn above the deliberately flat walking collider. Match
      // that visible floor, retaining its takeoff offset through a jump so the
      // animation and physics rise together rather than popping off the kerb.
      if(player.fly||player.ride)footLift=0;
      else if(player.onGround)footLift=(ctx.visualFloor?.heightAt(player.pos.x,player.pos.z,player.pos.y)??player.pos.y)-player.pos.y;
      actor.root.position.y+=footLift;
      actor.root.visible=!player.firstPerson&&player.cameraDistance>.6&&!ctx.drive?.active;
      const name=player.animation||'Idle',speed=player.speed||0;
      const rate=name==='Walk'?1.3*Math.max(.35,Math.min(1.15,speed/player.walk)):name==='Run'?1.65*Math.max(.6,Math.min(1.15,speed/player.run)):1;
      animateActor(actor,name,dt,{rate,time:player.jump?jumpClipTime(player.jump,player.vy):null,blend:player.jump?.phase==='anticipation'?.06:.16});
      if(player.jump)fitJump(actor,player.jump,player.pos.y+footLift);
    },
    dispose(){removeSettings();for(const actor of [...actors,...npcs]){actor.mixer.stopAllAction();actor.root.removeFromParent();}ctx.characters=null;delete ctx.services.characters;},
  };
  ctx.characters=api;ctx.services.characters=api;
  const removeSettings=installCharacterSettings(ctx,api);
  if(!manualUpdate)ctx.onUpdate(dt=>api.update(dt));api.update(0);
  return api;
}
