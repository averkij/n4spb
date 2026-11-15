import assert from 'node:assert/strict';
import {createSim} from '../src/world/traffic/sim.js';
import {createTrafficTakeovers} from '../src/world/traffic/takeover.js';
import {ARCH,CAR_KINDS} from '../src/world/traffic/fleetdata.js';
import {createDamageState} from '../src/world/drive/damage.js';

let hidden=false;
const st={lanes:[{id:'test:0',road:'test',pts:[[0,0],[0,180]],len:180,rank:4,speed:12,idx:0,from:null,to:null}],connectors:[],stopLines:[{lane:'test:0',s:90,signal:'red',approach:0}],signals:[{id:'red',approaches:[{index:0,group:0}]}],signalState:()=> 'red',busStops:[],roads:[]};
const rng=()=>{let x=17;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const sim=createSim(st,rng,{trams:false,preroll:0,centre:()=>[0,80],radius:260,hidden:()=>hidden});sim.start();
for(let i=0;i<15*40;i++)sim.step();
const queued=sim.vehicles.find(v=>!v.bus&&v.holding&&v.v<.25&&v.s<91);
assert(queued,'Fixture has a real red-light queue');
queued.wait=171;queued.die=-1;
for(let i=0;i<45;i++)sim.step();
assert(sim.vehicles.includes(queued),'Visible queue head survives deadlock and lifetime cleanup');
hidden=true;sim.step();assert(!sim.vehicles.includes(queued),'Offscreen deadlock cleanup remains bounded');hidden=false;
const edge=sim.vehicles.find(v=>!v.bus);assert(edge);
edge.s=edge.seg.len+20;edge.passS=1e9;
sim.step();assert(sim.vehicles.includes(edge),'A car cannot vanish at a visible lane boundary');assert(edge.v===0);
hidden=true;edge.s=edge.seg.len+20;sim.step();assert(!sim.vehicles.includes(edge));hidden=false;

const boxes=new Set(),physics={addBox(cx,cz,w,d,rotY,y0,y1){const b={cx,cz,w,d,rotY,y0,y1};boxes.add(b);return b;},remove(b){return boxes.delete(b);}};
let refreshes=0,released=0;
const parkedRecords=[],wrecks={release(r){released++;r.x+=r.wrecked?2:0;r.wrecked=false;r.wreckBody=null;r.wreckSource=null;}};
const registry=createTrafficTakeovers({physics,sim,parkedRecords,wrecks,refresh:()=>refreshes++});
for(const [i,kind] of CAR_KINDS.entries()){
 const record={kind,x:i*30,y:.03,z:0,c:1,s:0,color:{r:.4,g:.5,b:.6},plate:i,driver:true,taxi:i===0,police:i===1,amb:i===2,damageState:createDamageState()};
 const a=ARCH[kind],box=physics.addBox(record.x,record.z,a.wid,a.len,0,0,a.hgt);parkedRecords.push(record);
 const d=registry.register(record,null,box);assert.equal(registry.nearestEnterable(record.x,0,4),d);assert(d.occupied);
 const damage=record.damageState,claimed=registry.claim(d);assert.equal(claimed,d);assert(d.wasOccupied&&!d.occupied);assert.equal(d.record.damageState,damage);assert(!boxes.has(box));assert.equal(registry.claim(d),null,'Double claim rejected');
 assert(registry.cancelClaim(d));assert(d.occupied&&d.record.driver);assert.equal(registry.nearestEnterable(record.x,0,4),d);
 assert(registry.claim(d));assert(registry.commitClaim(d));assert(!registry.cancelClaim(d),'Committed ownership cannot be accidentally rolled back');
 assert(registry.release(d,{x:i*30+5,y:0,z:8,yaw:1.2}));assert(!d.occupied);assert.equal(d.record.damageState,damage);assert.equal(registry.nearestEnterable(i*30+5,8,4),d);
}
sim.reset();const moving=sim.vehicles.find(v=>!v.bus);assert(moving);moving.rec={kind:moving.kind,x:moving.x,y:.03,z:moving.z,c:Math.cos(moving.rot),s:Math.sin(moving.rot),driver:true,color:{r:1,g:1,b:1},plate:4};
registry.begin();const md=registry.register(moving.rec,moving);registry.end();const count=sim.vehicles.length;
assert(registry.claim(md));assert.equal(sim.vehicles.length,count-1);assert(!moving.seg.veh.includes(moving));assert.equal(moving.retired,undefined,'Promotion does not destroy the damage record');
assert(registry.cancelClaim(md));assert(parkedRecords.includes(moving.rec));assert.equal(md.vehicle,null,'Cancelled promotion becomes safely parked');
md.record.wrecked=true;md.record.wreckBody={};const x=md.x;
assert(registry.claim(md));assert.equal(md.x,x+2,'Claim uses synchronized wreck pose');assert(!md.record.wreckBody);
assert(registry.commitClaim(md));assert(registry.release(md,{occupied:true}));assert(md.record.driver,'An abandoned interaction preserves the occupant when demoted');
assert(registry.register({kind:'bus',x:0,y:0,z:0,c:1,s:0})===null,'Public transit remains separate');
assert(refreshes>CAR_KINDS.length*3&&released>CAR_KINDS.length);
const carriedRegistry=createTrafficTakeovers({physics,sim,parkedRecords:[],wrecks,reservedIds:['traffic-car-1','traffic-car-3']});
const first=carriedRegistry.register({kind:'sedan',x:0,y:0,z:0,c:1,s:0}),second=carriedRegistry.register({kind:'hatch',x:5,y:0,z:0,c:1,s:0});
assert.equal(first.id,'traffic-car-2');assert.equal(second.id,'traffic-car-4','Local cars never reuse incoming handoff IDs');
console.log(`PASS: visible red-light/sink persistence, offscreen retirement, ${CAR_KINDS.length} car archetypes, stable ownership/damage, claim rollback/release, NPC occupancy, wreck transfer`);
