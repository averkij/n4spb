import RAPIER from './vendor/rapier.mjs';
import { VEHICLES, entryPhases, entryPose } from './vehicle-specs.js';
import {JUMPS} from './jump-timing.js';

export const WALK = 2.7, RUN = 8, STEP = 1 / 60;
export const obstacles = [
  { x: -9, y: 1.9, z: -9, w: 10, h: 3.8, d: .5, kind: 'wall' },
  { x: -14, y: 1.9, z: -5.5, w: .5, h: 3.8, d: 7, kind: 'wall' },
  { x: -7, y: .22, z: -1, w: 2.5, h: .44, d: 2.5, kind: 'step' },
  { x: -7, y: .46, z: -3.5, w: 2.5, h: .92, d: 2.5, kind: 'step' },
  { x: -7, y: .7, z: -6, w: 2.5, h: 1.4, d: 2.5, kind: 'step' },
  { x: 0, y: .75, z: -47.5, w: 96, h: 1.5, d: 1, kind: 'boundary' },
  { x: 0, y: .75, z: 47.5, w: 96, h: 1.5, d: 1, kind: 'boundary' },
  { x: -47.5, y: .75, z: 0, w: 1, h: 1.5, d: 94, kind: 'boundary' },
  { x: 47.5, y: .75, z: 0, w: 1, h: 1.5, d: 94, kind: 'boundary' },
];
const identity = { x: 0, y: 0, z: 0, w: 1 };
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export async function createSimulation() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.timestep = STEP;
  // An exact plane avoids GJK contact-normal noise from a very wide, thin box.
  // That noise occasionally discarded the entire horizontal capsule step.
  world.createCollider(new RAPIER.ColliderDesc(new RAPIER.HalfSpace({ x: 0, y: 1, z: 0 })).setFriction(.8));
  for (const b of obstacles) world.createCollider(RAPIER.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.d / 2).setTranslation(b.x, b.y, b.z));
  const person = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, .92, 5));
  const capsule = world.createCollider(RAPIER.ColliderDesc.capsule(.6, .28), person);
  const controller = world.createCharacterController(.025);
  controller.enableAutostep(.3, .2, false);
  controller.enableSnapToGround(.25);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  const vehicles=VEHICLES.map(spec=>{
    const halfHeight=Math.min(.8,spec.height/2-.05);
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(spec.x,halfHeight+.04,spec.z).enabledRotations(false,true,false).setCcdEnabled(true).setLinearDamping(.2));
    const collider=world.createCollider(RAPIER.ColliderDesc.cuboid(spec.halfWidth,halfHeight,spec.halfLength).setMass(950).setFriction(.02).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(.03),body);
    return {spec,body,collider,halfHeight,x:spec.x,y:0,z:spec.z,yaw:0,speed:0,steering:0,door:0,occupied:spec.occupied,npcTime:-1,npcOrigin:null};
  });
  let car=vehicles[0].body,carCollider=vehicles[0].collider;
  // Tire grip is resolved by the planar controller below. A low minimum contact
  // friction avoids the broad chassis/floor contact cancelling engine acceleration.
  const state = { mode: 'foot', x: 0, y: 0, z: 5, yaw: 0, vx: 0, vz: 0, vy: 0, speed: 0, grounded: true, carX: 4, carY: 0, carZ: 1, carYaw: 0, carSpeed: 0, steering: 0, animation: 'Idle', message: '', messageTime: 0, distance: 0 };
  state.activeVehicle=0;state.nearby=-1;state.interaction=null;state.jump=null;
  const exitShape = new RAPIER.Capsule(.6, .28);
  const cameraShape = new RAPIER.Ball(.19);
  let jumpQueued = false;
  const tell = text => { state.message = text; state.messageTime = 2; };
  function toWorld(v,p) {const c=Math.cos(v.yaw),s=Math.sin(v.yaw);return {x:v.x+c*p[0]+s*p[2],y:v.y+p[1],z:v.z-s*p[0]+c*p[2]};}
  function sync() {
    for(const v of vehicles){const p=v.body.translation(),q=v.body.rotation(),vel=v.body.linvel();v.x=p.x;v.y=p.y-v.halfHeight;v.z=p.z;v.yaw=2*Math.atan2(q.y,q.w);v.speed=-Math.sin(v.yaw)*vel.x-Math.cos(v.yaw)*vel.z;}
    const v=vehicles[state.activeVehicle],p=person.translation();
    state.carX=v.x;state.carY=v.y;state.carZ=v.z;state.carYaw=v.yaw;state.carSpeed=v.speed;state.steering=v.steering;
    if (state.mode === 'foot') { state.x = p.x; state.y = p.y - .88; state.z = p.z; }
    else if(state.mode==='drive'){state.x=v.x;state.y=v.y;state.z=v.z;}
    state.nearby=-1;let distance=3.8;
    for(let i=0;i<vehicles.length;i++){const d=Math.hypot(state.x-vehicles[i].x,state.z-vehicles[i].z);if(d<distance){distance=d;state.nearby=i;}}
  }
  function reset() {
    state.mode = 'foot'; state.vx = state.vz = state.vy = state.speed = state.yaw = state.carSpeed = state.steering = 0;
    state.animation = 'Idle'; state.grounded = true; state.distance = 0; jumpQueued = false;state.jump=null;
    capsule.setEnabled(true);
    person.setTranslation({ x: 0, y: .92, z: 5 }, true);
    person.setNextKinematicTranslation({ x: 0, y: .92, z: 5 });
    state.activeVehicle=0;state.interaction=null;state.messageTime=0;car=vehicles[0].body;carCollider=vehicles[0].collider;
    for(const v of vehicles){v.body.setTranslation({x:v.spec.x,y:v.halfHeight+.04,z:v.spec.z},true);v.body.setRotation(identity,true);v.body.setLinvel({x:0,y:0,z:0},true);v.body.setAngvel({x:0,y:0,z:0},true);v.occupied=v.spec.occupied;v.npcTime=-1;v.npcOrigin=null;v.door=v.steering=0;}
    world.step(); sync();
  }
  function enterExit() {
    if(state.mode==='enter'||state.mode==='exit')return false;
    if(state.mode==='foot') {
      if(!state.grounded||state.jump?.phase==='anticipation'){tell('Land before entering a car');return false;}
      state.jump=null;
      if(state.nearby<0){tell('Move closer to a car to enter');return false;}
      state.activeVehicle=state.nearby;
      const v=vehicles[state.activeVehicle],spec=v.spec;
      car=v.body;carCollider=v.collider;
      const dx=state.x-v.x,dz=state.z-v.z,c=Math.cos(v.yaw),s=Math.sin(v.yaw);
      const local=[dx*c-dz*s,0,dx*s+dz*c],path=[];
      // Walk around the footprint, including approaches from ahead of the bonnet.
      if(local[0]>-spec.halfWidth-.38){
        if(Math.abs(local[2])>spec.halfLength+.35){path.push(toWorld(v,[-spec.halfWidth-.65,0,local[2]]));}
        else if(local[0]>0){
          path.push(toWorld(v,[spec.halfWidth+.65,0,local[2]]));
          path.push(toWorld(v,[spec.halfWidth+.65,0,spec.halfLength+1]));
          path.push(toWorld(v,[-spec.halfWidth-.65,0,spec.halfLength+1]));
        }
        else path.push(toWorld(v,[-spec.halfWidth-.65,0,local[2]]));
      }
      path.push(toWorld(v,entryPose(spec,'open',0,v.occupied).hip));
      let from={x:state.x,y:v.y+1.05,z:state.z};
      for(const point of path){
        const delta={x:point.x-from.x,y:0,z:point.z-from.z};
        const hit=world.castShape(from,identity,delta,exitShape,.02,1,true,undefined,undefined,capsule);
        if(hit){tell('The path to the driver door is blocked');return false;}
        from={x:point.x,y:from.y,z:point.z};
      }
      state.mode='enter';state.interaction={phase:'approach',progress:0,time:0,index:-1,occupied:v.occupied,path,phases:entryPhases(v.occupied)};
      capsule.setEnabled(false);state.vx=state.vz=state.vy=0;state.speed=0;sync();return true;
    }
    if(Math.abs(state.carSpeed)>1.5){tell('Stop the car before getting out');return false;}
    const v=vehicles[state.activeVehicle],p=toWorld(v,[-v.spec.halfWidth-.68,1.02,v.spec.seat[2]+.62]);
    let blocked=false;
    world.intersectionsWithShape(p,identity,exitShape,()=>{blocked=true;return false;},undefined,undefined,capsule,car);
    if(blocked){tell('Driver door is blocked. Move into open space.');return false;}
    state.mode='exit';state.interaction={phase:'close',progress:1,time:0,index:0,occupied:false,phases:[['close',.28],['climb',.68],['open',.28]]};
    return true;
  }
  function interactionStep() {
    const t=state.interaction,v=vehicles[state.activeVehicle];
    if(t.phase==='approach') {
      const point=t.path[0],dx=point.x-state.x,dz=point.z-state.z,d=Math.hypot(dx,dz),distance=Math.min(d,WALK*1.35*STEP);
      if(d>.001){state.x+=dx/d*distance;state.z+=dz/d*distance;state.yaw+=angleDelta(state.yaw,Math.atan2(-dx,-dz))*.25;}
      state.speed=distance/STEP;state.animation='Walk';
      if(d<.04){t.path.shift();if(!t.path.length){t.index=0;t.phase=t.phases[0][0];t.time=0;t.progress=0;state.animation='Idle';}}
      return;
    }
    state.speed=0;t.time+=STEP;
    const duration=t.phases[t.index][1],forward=Math.min(1,t.time/duration);
    t.progress=state.mode==='exit'?1-forward:forward;
    const pose=entryPose(v.spec,t.phase,t.progress,t.occupied),p=toWorld(v,pose.hip);
    state.x=p.x;state.y=v.y;state.z=p.z;state.yaw=v.yaw+pose.yaw;state.animation=pose.sit>.5?'Sitting':'Idle';v.door=pose.door;
    if(t.time+1e-8<duration)return;
    if(state.mode==='enter'&&t.phase==='recover'&&t.occupied){
      v.occupied=false;v.npcTime=0;v.npcOrigin={x:v.x,y:v.y,z:v.z,yaw:v.yaw};
    }
    t.index++;t.time=0;
    if(t.index<t.phases.length){t.phase=t.phases[t.index][0];t.progress=state.mode==='exit'?1:0;return;}
    if(state.mode==='enter'){state.mode='drive';state.animation='Sitting';state.yaw=v.yaw;}
    else {
      state.mode='foot';state.animation='Idle';state.speed=0;state.yaw=v.yaw-Math.PI/2;
      person.setTranslation({x:p.x,y:v.y+.92,z:p.z},true);person.setNextKinematicTranslation({x:p.x,y:v.y+.92,z:p.z});capsule.setEnabled(true);
    }
    v.door=0;state.interaction=null;
  }
  function step(input, cameraYaw) {
    state.messageTime = Math.max(0, state.messageTime - STEP);
    const forward = Number(input.forward) - Number(input.back), sideways = Number(input.right) - Number(input.left);
    for(const v of vehicles){
      if(v.npcTime>=0)v.npcTime+=STEP;
      if(state.mode!=='drive'||v!==vehicles[state.activeVehicle]){const vel=v.body.linvel();v.body.setLinvel({x:vel.x*.8,y:vel.y,z:vel.z*.8},true);v.body.setAngvel({x:0,y:0,z:0},true);}
    }
    if(state.interaction){interactionStep();}
    else if (state.mode === 'foot') {
      let dx = -Math.sin(cameraYaw) * forward + Math.cos(cameraYaw) * sideways;
      let dz = -Math.cos(cameraYaw) * forward - Math.sin(cameraYaw) * sideways;
      const length = Math.hypot(dx, dz); if (length > 1) { dx /= length; dz /= length; }
      const speed = input.run ? RUN : WALK, response = 1 - Math.exp(-14 * STEP);
      state.vx += (dx * speed - state.vx) * response; state.vz += (dz * speed - state.vz) * response;
      if(jumpQueued&&state.grounded&&(!state.jump||state.jump.phase==='land')){state.jump={phase:'anticipation',time:0,clip:state.speed>WALK*1.2?'RunningJump':'Jump'};}
      jumpQueued = false;
      if(state.jump){
        const jump=state.jump,timing=JUMPS[jump.clip];jump.time+=STEP;
        if(jump.phase==='anticipation'&&jump.time>=timing.anticipation){jump.phase='air';jump.time=0;state.vy=6.5;state.grounded=false;}
        else if(jump.phase==='land'&&jump.time>=timing.recovery)state.jump=null;
      }
      state.vy = Math.max(-30, state.vy - 20 * STEP);
      const before = person.translation();
      controller.computeColliderMovement(capsule, { x: state.vx * STEP, y: state.vy * STEP, z: state.vz * STEP });
      const delta = controller.computedMovement();
      state.grounded = controller.computedGrounded();
      if(state.jump?.phase==='anticipation'&&!state.grounded){state.jump.phase='air';state.jump.time=0;}
      if(state.jump?.phase==='air'&&state.grounded&&state.vy<0){state.jump.phase='land';state.jump.time=0;}
      else if(!state.grounded&&!state.jump)state.jump={phase:'air',time:0,clip:state.speed>WALK*1.2?'RunningJump':'Jump'};
      if (state.grounded && state.vy < 0) state.vy = -.5;
      person.setNextKinematicTranslation({ x: before.x + delta.x, y: before.y + delta.y, z: before.z + delta.z });
      state.speed = Math.hypot(delta.x, delta.z) / STEP;
      state.distance += state.speed * STEP;
      if (Math.hypot(state.vx, state.vz) > .15) state.yaw += angleDelta(state.yaw, Math.atan2(-state.vx, -state.vz)) * (1 - Math.exp(-14 * STEP));
      state.animation = state.jump?.clip || (state.speed < .12 ? 'Idle' : state.speed > WALK * 1.2 ? 'Run' : 'Walk');
    } else if(state.mode==='drive') {
      const v = car.linvel(), yaw = state.carYaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      let speed = v.x * fx + v.z * fz;
      const braking = forward && Math.sign(forward) !== Math.sign(speed) && Math.abs(speed) > .4;
      speed += forward * (braking ? 15 : forward < 0 ? 5 : 8) * STEP;
      speed *= Math.exp(-(input.jump ? 5 : forward ? .12 : .9) * STEP);
      speed = Math.max(-7, Math.min(23, speed));
      const lateral = (v.x * rx + v.z * rz) * Math.exp(-(input.jump ? 2.5 : 12) * STEP);
      car.setLinvel({ x: fx * speed + rx * lateral, y: v.y, z: fz * speed + rz * lateral }, true);
      state.steering += (-sideways - state.steering) * (1 - Math.exp(-9 * STEP));
      vehicles[state.activeVehicle].steering=state.steering;
      const turning = state.steering * speed / (3.8 + Math.abs(speed) * .65);
      car.setAngvel({ x: 0, y: turning, z: 0 }, true);
      state.speed = Math.abs(speed); state.animation = 'Sitting';
    }
    world.step(); sync();
    const v = car.linvel(); state.carSpeed = -Math.sin(state.carYaw) * v.x - Math.cos(state.carYaw) * v.z;
    if (state.y < -8 || Math.abs(state.x) > 70 || Math.abs(state.z) > 70) reset();
  }
  // Sweep a sphere, not just a ray: the camera's near plane also needs clearance.
  function cameraFraction(origin, delta) {
    const hit = world.castShape(origin, identity, delta, cameraShape, .04, 1, true, undefined, undefined, capsule, state.mode !== 'foot' ? car : undefined);
    return hit ? Math.max(0, hit.time_of_impact - .025) : 1;
  }
  world.step(); sync();
  return { state, step, reset, enterExit, cameraFraction, jump() { jumpQueued = true; }, dispose() { world.free(); }, world, person, get car(){return car;}, capsule, get carCollider(){return carCollider;}, vehicles };
}
