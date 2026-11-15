import assert from 'node:assert/strict';
import {createSim} from '../src/world/traffic/sim.js';
import {createTrafficTakeovers} from '../src/world/traffic/takeover.js';
import {ARCH,BUS_KINDS,ARTIC_REAR_OFFSET} from '../src/world/traffic/fleetdata.js';
import {createDamageState} from '../src/world/drive/damage.js';
import {trafficDefinition} from '../src/world/drive/traffic-model.js';
import {entryPhases,entryPose} from '../src/world/drive/entry-poses.js';
import * as THREE from 'three';
import {Physics} from '../src/core/physics.js';
import {getCarWrecks} from '../src/world/drive/wrecks.js';
import {createHandling} from '../src/world/drive/handling.js';
import {trafficTuning} from '../src/world/drive/vehicle-profiles.js';

const st={lanes:[{id:'bus-lane',road:'test',pts:[[0,0],[0,300]],len:300,rank:4,speed:12,idx:0,from:null,to:null}],connectors:[],stopLines:[],signals:[],busStops:[],roads:[]};
const sim=createSim(st,()=>()=>.43,{trams:false,preroll:0,centre:()=>[0,150],hidden:()=>false});sim.start();
const lane=sim.laneSeg.get('bus-lane'),template=sim.vehicles[0];assert(template);
const boxes=new Set(),released=[];
const physics={addBox(...args){const box={args};boxes.add(box);return box;},remove(box){return boxes.delete(box);}};
const parkedRecords=[],wrecks={release(record){released.push(record);record.wrecked=false;record.wreckSource=null;record.wreckBody=null;}};
const registry=createTrafficTakeovers({physics,sim,parkedRecords,wrecks});
for(const [i,kind] of BUS_KINDS.entries()){
 const a=ARCH[kind],record={kind:kind==='artic'?'artic_f':kind,logicalKind:kind,x:i*40,y:.03,z:150,c:1,s:0,color:'#5fc4b8',plate:8,route:60,driver:true,pax:true,door:1,damageState:createDamageState()};
 const tail=kind==='artic'?{...record,kind:'artic_r',logicalKind:undefined,z:150+ARTIC_REAR_OFFSET,driver:false,damageState:{...createDamageState(),front:.2,rear:.25,revision:1}}:null;
 if(tail)record.trailer=tail;
 const v={...template,id:1000+i,kind,arch:a,bus:true,trolley:!!a.trolley,seg:lane,trail:[lane],rec:record,rec2:tail,route:60,dwell:14,at:{id:'stop'},served:new Set(['old-stop']),door:1,pax:true};
 sim.vehicles.push(v);lane.veh.push(v);lane.lastOut=v;
 const d=registry.register(record,v),id=d.id;assert.equal(d.kind,kind);assert.equal(registry.nearestEnterable(d.entryX,d.entryZ,.2),d,'bus is selected at its right front door');
 assert(registry.claim(d));assert(!sim.vehicles.includes(v)&&!lane.veh.includes(v));assert.equal(lane.lastOut,null);
 assert.equal(v.route,null);assert.equal(v.dwell,0);assert.equal(v.at,null);assert.equal(v.door,0);assert.equal(v.served.size,0);assert.equal(v.pax,false);
 assert.equal(record.route,60,'displayed route remains on owned appearance');assert(!record.driver&&!record.pax);assert(d.wasOccupied);
 if(tail){assert(tail.claimed);assert(released.includes(tail));assert.equal(d.damageState.rear,.25,'rear-section damage joins owned bus state');assert.equal(d.damageState.front,0,'trailer hinge damage cannot appear on the bus nose');}
 assert(registry.cancelClaim(d));assert(record.driver&&record.pax,'failed entry restores occupants');if(tail)assert(!tail.claimed&&parkedRecords.includes(tail));
 const damage=record.damageState;assert(registry.claim(d));assert(registry.commitClaim(d));assert(registry.release(d,{x:i*40,y:.2,z:170,yaw:.6,occupied:false}));
 assert.equal(d.id,id);assert.equal(record.damageState,damage);assert(!record.driver&&!record.pax);
 if(tail){assert.notEqual(tail.visualDamageState,record.visualDamageState,'each section has a separate damage render entry');assert.equal(record.visualDamageState.rear,0);assert.equal(tail.visualDamageState.rear,.25);assert.equal(tail.visualDamageState.front,0);assert.equal(d.collider.source.spec.len,a.len);assert.equal(tail.trafficCollider,null);assert(Math.abs(tail.x-record.x-Math.sin(.6)*ARTIC_REAR_OFFSET)<1e-8);}
 const def=trafficDefinition(d);assert(def.spec.bus&&def.spec.mass>=8200);assert.equal(def.traffic.route,60);
 const spec={halfWidth:a.wid/2,seat:[-.48,1.3,-(a.front-.95)],floor:1,entrySide:1,entryZ:-def.boarding.z};
 for(const [phase] of entryPhases(true,true))for(let j=0;j<=50;j++){
   const pose=entryPose(spec,phase,j/50,true);assert(pose.hip.every(Number.isFinite));assert(pose.npcHip.every(Number.isFinite));
   if(phase==='open')assert(pose.hip[0]>spec.halfWidth,'boarding approaches passenger side');
   if(phase==='climb'&&j===25)assert(pose.hip[0]>-.1&&pose.hip[0]<.5,'climb passes through the front aisle before driver seat');
 }
}
assert.equal(registry.register({kind:'tram',x:0,y:0,z:0,c:1,s:0}),null);
// Actual Rapier activation must keep a demoted articulated bus rigid. The rear
// has no second collider/body, and follows both translation and rotation.
const ph=new Physics(()=>0),ctx={physics:ph,services:{},mat:{toon:()=>new THREE.MeshBasicMaterial()},add(){},onUpdate(){}};
const realWrecks=await getCarWrecks(ctx),parked=[];
const realRegistry=createTrafficTakeovers({physics:ph,parkedRecords:parked,wrecks:realWrecks});
const front={kind:'artic_f',logicalKind:'artic',x:0,y:.03,z:0,c:1,s:0,driver:true,damageState:createDamageState()},rear={...front,kind:'artic_r',logicalKind:undefined,z:ARTIC_REAR_OFFSET,driver:false,damageState:createDamageState()};front.trailer=rear;
const articulated=realRegistry.register(front);realRegistry.claim(articulated);realRegistry.commitClaim(articulated);realRegistry.release(articulated,{x:0,y:.03,z:0,yaw:0});
const source=articulated.collider.source;assert.equal(source.spec.mass,18000);assert.equal(source.spec.len,ARCH.artic.len);
source.onCarHit(20,{x:0,z:ARCH.artic.rear,nx:0,nz:1});source.applyCarImpulse(60000,0,0,ARCH.artic.rear);
for(let i=0;i<120;i++)realWrecks.step(1/120);
assert.equal(realWrecks.stats.cars,1,'only one rigid body owns both sections');assert(!rear.wreckBody);assert(Math.abs(front.x)>.2);
assert(Math.abs(rear.x-front.x-front.s*ARTIC_REAR_OFFSET)<1e-8);assert(Math.abs(rear.z-front.z-front.c*ARTIC_REAR_OFFSET)<1e-8);assert.equal(rear.c,front.c);assert.equal(rear.s,front.s);
assert(front.damageState.rear>0);assert.equal(front.visualDamageState.rear,0);assert.equal(rear.visualDamageState.rear,front.damageState.rear);
const identity=front.damageState;assert(realRegistry.claim(articulated));assert.equal(realWrecks.stats.cars,0);assert.equal(front.damageState,identity,'reclaim retains health without double-merging section projections');
const tuning=trafficTuning('artic',ARCH.artic),handlingCtx={physics:new Physics(()=>0),services:{},L:{inPlay:()=>true,heightAt:()=>0,insideBuilding:()=>false}};
const long=createHandling(handlingCtx,tuning),short=createHandling(handlingCtx,{...tuning,steerWheelbase:tuning.spec.wb});
for(const car of [long,short]){car.reset(0,0,0);car.vz=6;car.steer=1;car.step(.01,{thr:0,brk:0,steer:1});}
assert(Math.abs(long.yaw/short.yaw-ARCH.artic.wb/9.325)<.02,'rigid bus turns with its effective rear-bogie wheelbase, not the short front section');
console.log(`PASS ${BUS_KINDS.length} bus variants: real sim detach, stop/route/passenger cleanup, articulated sections, NPC rollback, empty release, damage/identity, right-door aisle`);
