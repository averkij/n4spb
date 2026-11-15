import * as THREE from 'three';
import {animateActor} from '../character/index.js';
import {entryPhases,entryPose} from './entry-poses.js';
import {animateInteraction,animateOccupant,poseDriver} from './character-poses.js';

const point=(c,p)=>c.root.localToWorld(new THREE.Vector3(...p));
const deltaAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
/** Owns only the bounded character/door interaction. Existing game driving,
 * terrain, collision damage and area transitions remain owned by drive.js. */
export function createCharacterInteractions(ctx,{characters,vehicles,enterNow,exitNow,dropBox,addBox,activeVehicle,active,view}){
  const player=ctx.playerObj;let transition=null;
  function ensureNpc(v){const c=v.cabin;if(c?.occupied&&!c.npc)c.npc=characters.createNpc();return c?.npc;}
  function clear(){
    if(!transition)return;const v=transition.vehicle;v.cabin.door.rotation.y=0;v.cabin.doorAmount=0;
    player.inputLock=Math.max(0,player.inputLock-1);characters.busy=false;transition=null;
  }
  function begin(v,exiting=false){
    if(transition||!v.cabin||!player)return false;
    if(exiting&&v.car.air)return false;
    const c=v.cabin,s=c.spec;c.root.updateWorldMatrix(true,true);
    if(exiting&&v.car.speed>5){ctx.ui.toast('Остановитесь, чтобы выйти · Stop before getting out');return false;}
    if(!exiting&&(player.fly||player.riding||player.jump?.phase==='air'))return false;
    ensureNpc(v);const occupied=c.occupied&&!!c.npc;
    const local=c.root.worldToLocal(player.pos.clone()),path=[],outside=entryPose(s,'open',0,occupied).hip,side=s.entrySide??-1;
    if(!exiting){
      if(local.x*side<s.halfWidth+.38){
        const aroundZ=side===1?-s.frontExtent-1:s.halfLength+1;
        if(Math.abs(local.z)>s.halfLength+.4)path.push([side*(s.halfWidth+.68),0,local.z]);
        else if(local.x*side<0)path.push([-side*(s.halfWidth+.7),0,local.z],[-side*(s.halfWidth+.7),0,aroundZ],[side*(s.halfWidth+.7),0,aroundZ]);
        else path.push([side*(s.halfWidth+.7),0,local.z]);
      }
      path.push(outside);
    }
    const worldPath=path.map(p=>point(c,p));let from=player.pos.clone();
    for(const to of worldPath){
      const n=Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.3);
      for(let i=1;i<=n;i++){const t=i/n,x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t;if(ctx.physics.columnBlocked(x,z,.28,v.parked.y+.3,v.parked.y+1.6)){ctx.ui.toast('Нет прохода к двери · Driver door is blocked');return false;}}
      from=to;
    }
    if(exiting){const p=point(c,outside);if(ctx.physics.columnBlocked(p.x,p.z,.3,v.car.y+.3,v.car.y+1.6)){ctx.ui.toast('Нет места у двери · Driver door is blocked');return false;}}
    if(exiting)v.model.setView(false);
    transition={vehicle:v,exiting,occupied,path:worldPath,phases:exiting?[['close',.28],['climb',side===1?.9:.68],['open',.28]]:entryPhases(occupied,side===1),index:exiting?0:-1,phase:exiting?'close':'approach',time:0,progress:exiting?1:0};
    player.inputLock++;characters.busy=true;player.jump=null;player.vy=0;player.vel?.set(0,0,0);dropBox(v);
    v.car.vx=v.car.vz=v.car.yawVel=0;v.car.speed=0;
    return true;
  }
  function camera(c,dt){
    const bus=c.spec.entrySide===1,entryZ=c.spec.entryZ||0;
    const p=player.pos,center=bus?point(c,[c.spec.halfWidth,0,entryZ]):c.root.getWorldPosition(new THREE.Vector3());
    const target=new THREE.Vector3(p.x*.6+center.x*.4,p.y+1.05,p.z*.6+center.z*.4);
    const offsets=[[-4.5,2.8,3.3],[-4.5,3,-3.3],[-4.8,3.4,0],[-3.6,4.8,2],[-3.6,4.8,-2],[0,5.5,4.5],[0,5.5,-4.5]];
    if(bus)for(const offset of offsets){offset[0]*=-1;offset[2]+=entryZ;}
    const sweep=offset=>{
      const desired=point(c,offset),q=new THREE.Vector3();let fraction=1;
      for(let i=1;i<=24;i++){q.copy(target).lerp(desired,i/24);if(ctx.physics.columnBlocked(q.x,q.z,.2,q.y-.15,q.y+.15)){fraction=Math.max(0,(i-1)/24);break;}}
      desired.lerpVectors(target,desired,fraction);return {desired,fraction,distance:desired.distanceTo(target),offset};
    };
    let chosen=sweep(transition.cameraOffset||offsets[0]);
    if(chosen.distance<2.5||chosen.fraction<.75){
      for(const offset of offsets){const candidate=sweep(offset);if(candidate.distance>chosen.distance)chosen=candidate;if(candidate.distance>=3.2&&candidate.fraction>.85){chosen=candidate;break;}}
    }
    transition.cameraOffset=chosen.offset;
    // The walker applies its own camera before module updates. Ease from the
    // previous interaction camera, never from that freshly overwritten view.
    transition.cameraPosition??=ctx.camera.position.clone();
    transition.cameraPosition.lerp(chosen.desired,Math.min(1,dt*16));
    ctx.camera.position.copy(transition.cameraPosition);ctx.camera.lookAt(target);
  }
  function update(dt){
    const t=transition;
    if(t){
      const v=t.vehicle,c=v.cabin;const step=ctx.ui?.modalOpen?0:Math.min(.05,dt);
      if(t.phase==='approach'){
        const to=t.path[0],dx=to.x-player.pos.x,dz=to.z-player.pos.z,d=Math.hypot(dx,dz),move=Math.min(d,3.65*step);
        if(d>.001){player.pos.x+=dx/d*move;player.pos.z+=dz/d*move;player.facingYaw+=deltaAngle(player.facingYaw,Math.atan2(-dx,-dz))*Math.min(1,step*14);}
        if(d<.035){t.path.shift();if(!t.path.length){t.index=0;t.phase=t.phases[0][0];t.time=0;t.progress=0;}}
      }else{
        t.time+=step;const duration=t.phases[t.index][1],u=Math.min(1,t.time/duration);t.progress=t.exiting?1-u:u;
        const pose=entryPose(c.spec,t.phase,t.progress,t.occupied),hip=point(c,pose.hip);
        const previousDoor=c.doorAmount||0;
        player.pos.set(hip.x,v.car.y,hip.z);c.doorAmount=pose.door;c.door.rotation.y=(c.spec.entrySide??-1)*1.15*pose.door;
        // Entry closes in `close`; exit closes in reversed `open`. Detect the
        // physical latch contact, not a phase name or clear()/cancel reset.
        if(previousDoor>0&&pose.door===0&&ctx.audio?.ready&&!ctx.audio.muted&&ctx.audio.context?.state==='running'){
          ctx.audio.play('carDoor',{position:c.door.getWorldPosition(new THREE.Vector3()),volume:.9});
        }
        if(t.time>=duration){
          if(!t.exiting&&t.phase==='recover'&&t.occupied){c.occupied=false;c.npcTime=0;const origin=c.root.getWorldPosition(new THREE.Vector3());c.npcOrigin={x:origin.x,y:origin.y,z:origin.z,yaw:v.car.yaw+Math.PI};}
          t.index++;t.time=0;
          if(t.index<t.phases.length){t.phase=t.phases[t.index][0];t.progress=t.exiting?1:0;}
          else{
            const exit= t.exiting;clear();
            if(exit)exitNow(false,{x:hip.x,z:hip.z});else {c.occupied=false;enterNow(v);}
          }
        }
      }
      if(transition)camera(c,step);
    }
    for(const v of vehicles){
      const c=v.cabin;if(!c)continue;
      const position=c.npcOrigin&&!c.occupied?new THREE.Vector3(c.npcOrigin.x,c.npcOrigin.y,c.npcOrigin.z):c.root.getWorldPosition(new THREE.Vector3()),near=position.distanceToSquared(player.pos)<65*65;
      if(c.occupied&&near)ensureNpc(v);
      if(c.npc){
        if(c.npcTime>=0&&!ctx.ui?.modalOpen)c.npcTime+=dt;
        c.npc.root.visible=near&&(!c.occupied||v.model.root.visible);
        if(c.npc.root.visible)animateOccupant(c,c,dt,transition?.vehicle===v?transition:null);
        if(!near){characters.releaseNpc(c.npc);c.npc=null;}
      }
    }
    const current=transition;
    if(current)characters.override(actor=>{
      const c=current.vehicle.cabin;actor.root.visible=true;
      if(current.phase==='approach'){actor.root.position.copy(player.pos);actor.root.position.y=ctx.visualFloor?.heightAt(player.pos.x,player.pos.z,player.pos.y)??player.pos.y;actor.root.rotation.set(0,player.facingYaw,0);animateActor(actor,'Walk',ctx.ui?.modalOpen?0:dt,{rate:1.75});}
      else animateInteraction(actor,c,current);
    });
    else if(active()&&activeVehicle().cabin)characters.override(actor=>{
      const c=activeVehicle().cabin;poseDriver(actor,c,activeVehicle().car.steer);actor.root.visible=view.mode!==2;
    });
    else characters.override(null);
    characters.update(ctx.ui?.modalOpen?0:dt);
  }
  return {get active(){return!!transition;},get state(){return transition;},enter:v=>begin(v),exit:()=>begin(activeVehicle(),true),update,
    cancel(){if(!transition)return;const v=transition.vehicle,wasActive=active();clear();if(!wasActive)addBox(v);else v.model.setView(view.mode===2);characters.override(null);},ensureNpc};
}
