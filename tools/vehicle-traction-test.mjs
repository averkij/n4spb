import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Physics } from '../src/core/physics.js';
import { getCarWrecks } from '../src/world/drive/wrecks.js';
import { bindParkedImpact } from '../src/world/traffic/impact.js';
import { ARCH, CAR_KINDS } from '../src/world/traffic/fleetdata.js';
import { trafficPhysics, trafficSpec, trafficTuning } from '../src/world/drive/vehicle-profiles.js';
import { createDamageState, recordDamage, damageAmount } from '../src/world/drive/damage.js';
import { createHandling } from '../src/world/drive/handling.js';

const physics=new Physics(()=>0),scene=new THREE.Scene();
const ctx={physics,services:{},mat:{toon:()=>new THREE.MeshBasicMaterial()},add:o=>scene.add(o),onUpdate(){},L:{inPlay:()=>true,heightAt:()=>0,insideBuilding:()=>false}};
const wrecks=await getCarWrecks(ctx);
function target(kind,x,z){
  const spec=ARCH[kind],record={kind,x,y:.03,z,s:0,c:1};
  const box=physics.addBox(x,z+(spec.front+spec.rear)/2,spec.wid,spec.len,0,0,spec.hgt);
  return {record,source:bindParkedImpact(box,record,spec,wrecks)};
}
function advance(seconds){for(let i=0;i<seconds*120;i++)wrecks.step(1/120);}
const lateral=target('sedan',0,0);lateral.source.applyCarImpulse(14000,0,0,0);
const initialX=lateral.record.x;advance(2);
assert(Math.abs(lateral.record.wreckSource.vx)<.02,'Lateral tyre scrub stops the car, not an endless exponential slide');
assert(lateral.record.x-initialX>3&&lateral.record.x-initialX<6.5,'A 10m/s sideways strike moves a few metres, not an ice-like 15m');
const rolling=target('sedan',50,0);rolling.source.applyCarImpulse(0,14000,50,0);advance(3);
assert(Math.hypot(rolling.record.wreckSource.vx,rolling.record.wreckSource.vz)<.02,'A struck car brakes to rest');
assert(rolling.record.z>7&&rolling.record.z<13,'Forward tyres allow rolling while brakes dissipate momentum');
const small=target('hatch',100,0),heavy=target('truck',150,0);
small.source.applyCarImpulse(0,14000,100,0);heavy.source.applyCarImpulse(0,14000,150,0);
assert(small.record.wreckSource.vz>heavy.record.wreckSource.vz*3,'Per-archetype masses govern the same impulse');
const before={x:small.record.x,z:small.record.z};small.record.damageState=createDamageState();small.record.damageState.front=.5;
const released=wrecks.release(small.record);assert.equal(small.record.wreckBody,null);assert.equal(small.record.wreckSource,null);assert.equal(released.damageState.front,.5);assert.equal(released.x,before.x);assert.equal(released.z,before.z);
physics.refreshDynamic();assert(!physics._dynItems.some(b=>b.source.record===small.record),'Taking a struck car leaves no old collider');

// Shared crush budget: 1.5 times the former accumulated impact is required.
for(const kind of CAR_KINDS){
  const spec=trafficSpec(kind,ARCH[kind]),state=createDamageState(),p=trafficPhysics(kind,ARCH[kind]);
  assert(spec.mass>1000&&spec.mass<6000);assert(spec.W===ARCH[kind].wid);assert(spec.R>0);
  const event={type:'hit',v:18,localX:0,localZ:spec.front,localNX:0,localNZ:-1};
  recordDamage(state,event,spec);assert(Math.abs(state.front-15/(45*1.5*p.durability))<1e-9,kind);
  for(let i=0;i<20;i++)recordDamage(state,event,spec);assert.equal(damageAmount(state),1,`${kind} still becomes junked`);
  const car=createHandling(ctx,trafficTuning(kind,ARCH[kind]));car.reset(250,0,0);
  for(let i=0;i<120;i++)car.step(1/60,{thr:1,brk:0,steer:0,hand:false,nitro:false});
  assert(car.speed>25&&Number.isFinite(car.z),`${kind} drives with its own profile`);
}
assert.equal(trafficPhysics('sedan',{mass:2970,durability:1.3}).mass,2970,'Explicit garage mass stays authoritative');

// A displaced car retains crush damage when it subsequently strikes scenery.
physics.addBox(350,8,12,.2,0,0,3);const wall=target('sedan',350,0);wall.source.applyCarImpulse(0,42000,350,0);advance(1);
assert(wall.record.damageState?.front>0,'Secondary wall collision damages a displaced car');
assert(wall.record.z<6,'CCD keeps the car in front of the wall');
wrecks.reset();
console.log(JSON.stringify({passed:true,lateralStopDistance:lateral.record.x-initialX,rollingStopDistance:rolling.record.z,archetypes:CAR_KINDS.length}));
