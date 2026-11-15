// CPU regression on the production Anichkov bridge module, deck, piers and
// terrain. Run: node tools/area.mjs palace tools/anichkov-bus-test.mjs
import assert from 'node:assert/strict';
import {loadEngine,makeContext,buildModules} from './tauride/lib/stub-env.mjs';
import {createHandling} from '../src/world/drive/handling.js';
import {carContact} from '../src/world/drive/collision.js';
import {trafficTuning,trafficSpec} from '../src/world/drive/vehicle-profiles.js';
import {ARCH,BUS_KINDS} from '../src/world/traffic/fleetdata.js';
import {SPEC} from '../src/world/drive/model.js';
import {SPEC_BOAT} from '../src/world/drive/boat/handling.js';
import * as F from '../src/world/landmarksC/frame.js';
import {Physics} from '../src/core/physics.js';

const eng=await loadEngine(),{ctx}=makeContext(eng,['landmarksC']);
await buildModules(eng,ctx,['landmarksC']);
const physics=ctx.physics,services=ctx.services;
let crossings=0;
for(const kind of BUS_KINDS)for(const dir of [1,-1])for(const mode of ['slow','cruise','reverse','diagonal']){
  const car=createHandling({L:eng.L,physics,services},trafficTuning(kind,ARCH[kind]));
  const p=F.toWorld(-dir*42,-dir*5),reverse=mode==='reverse',angle=mode==='diagonal'?.07:0,target=mode==='slow'?2:reverse?4:9;
  car.reset(p.x,p.z,F.RAMP_ROT+(dir<0?Math.PI:0)+(reverse?Math.PI:0)+angle);
  let peak=car.y,finished=false,events=[];
  // Start at rest, including the slowest approach: momentum must not be needed
  // to cross a harmless continuous deck seam. Reverse crosses the entire crest.
  for(let n=0;n<60*65;n++){
    const moving=reverse?-car.vF:car.vF;
    car.step(1/60,{thr:reverse?0:moving<target?.65:0,brk:reverse&&moving<target?.65:0,steer:0,hand:false,nitro:false});
    const uv=F.toUV(car.x,car.z);peak=Math.max(peak,car.y);events.push(...car.events);
    assert([car.x,car.y,car.z,car.slope,car.speed].every(Number.isFinite),`${kind}/${dir}/${mode}: finite state`);
    if(Math.abs(uv.u)<F.HALF-2)assert(car.y>0,`${kind}/${dir}/${mode}: stayed on deck above water`);
    if(dir*uv.u>45){finished=true;break;}
  }
  assert(finished,`${kind}/${dir}/${mode}: stopped at ${JSON.stringify(F.toUV(car.x,car.z))}`);
  assert(peak>1.4&&peak<1.6,`${kind}/${dir}/${mode}: followed the 1.5 m crown (${peak})`);
  assert.equal(events.length,0,`${kind}/${dir}/${mode}: deck generated impacts`);crossings++;
}
for(const kind of BUS_KINDS)for(const dir of [1,-1]){
  const car=createHandling({L:eng.L,physics,services},trafficTuning(kind,ARCH[kind])),p=F.toWorld(0,-dir*5);
  car.reset(p.x,p.z,F.RAMP_ROT+(dir<0?Math.PI:0));
  for(let n=0;n<120;n++)car.step(1/60,{thr:0,brk:0,steer:0,hand:true,nitro:false});
  assert(Math.hypot(car.x-p.x,car.z-p.z)<.01,`${kind}: rests on crown without collision drift`);
  assert(car.y>1.4&&car.y<1.6,`${kind}: rests above the crown`);
  for(let n=0;n<60*25&&dir*F.toUV(car.x,car.z).u<45;n++){
    car.step(1/60,{thr:car.vF<3?.65:0,brk:0,steer:0,hand:false,nitro:false});
    assert.equal(car.events.length,0,`${kind}: restart from crown without impact`);
  }
  assert(dir*F.toUV(car.x,car.z).u>=45,`${kind}: restarts from the crown`);
}

// Real central arch remains accessible from below. Ramps above the roof are
// not road support for a submerged car or a floating boat; stone piers are solid.
for(const [spec,y,floats] of [[SPEC,-4.77,false],[SPEC_BOAT,F.WATER,true]]){
  for(let v=-24;v<=24;v+=.5){
    const p=F.toWorld(0,v),car={...p,y,yaw:F.RAMP_ROT+Math.PI/2,slope:0,floats};
    const hits=[...physics.querySolids(p.x,p.z,6)].filter(b=>carContact(car,spec,b));
    assert.equal(hits.length,0,`central arch passage at v=${v}, floats=${floats}`);
  }
  const p=F.toWorld(8.05,0),car={...p,y,yaw:F.RAMP_ROT+Math.PI/2,slope:0,floats};
  assert([...physics.querySolids(p.x,p.z,6)].some(b=>carContact(car,spec,b)),`stone pier stays solid, floats=${floats}`);
}

const ph=new Physics(()=>0),spec=trafficSpec('bus',ARCH.bus);
const car={x:0,z:0,y:.03,yaw:0,slope:.1};
const wall=ph.addBox(0,5.6,8,.2,0,0,3),step=ph.addWalkBox(0,5.6,8,.2,0,.8);
assert(carContact(car,spec,wall),'a supported slope does not erase a true wall');
assert(carContact(car,spec,step),'a supported slope does not raise the walk-step limit');
const raised=ph.addWalkRamp(0,5.6,8,.2,0,1.5,1.5,2);
assert(carContact({...car,slope:0},spec,raised),'an unsupported raised ramp remains a wall');
const seam=ph.addWalkRamp(0,5.6,8,1,0,.58,.68,2.5);
assert(carContact({...car,slope:0},spec,seam),'flat chassis meets the raised slice');
assert.equal(carContact(car,spec,seam),null,'the physically supported nose clears its own road slice');
for(const flag of ['air','fall','floats']){
  const flat=carContact({...car,slope:0,[flag]:true},spec,seam);
  const tilted=carContact({...car,[flag]:true},spec,seam);
  assert.deepEqual(tilted,flat,`${flag}: support slope must not change contact`);
}
// The extended axle must not borrow support from a disconnected road or a
// raised platform. These service profiles exercise the same ground lookup used
// by the bridge, while keeping the origin on flat ground outside the deck.
for(const gap of [false,true]){
  const inGap=z=>gap&&z>-5&&z<-4,heightAt=(x,z)=>inGap(z)?-3:0,ph=new Physics(heightAt);
  if(gap)ph.addHole(0,-4.5,8,1);
  const deckY=(x,z)=>gap?(z<-.1&&z>-12&&!inGap(z)?-.08*z:null):(z<-8&&z>-12?1.1:null);
  const c=createHandling({physics:ph,L:{inPlay:()=>true,insideBuilding:()=>false,heightAt},services:{landmarksC:{bridge:{deckY}}}},trafficTuning('artic',ARCH.artic));
  c.reset(0,0,0);c.step(1/60,{thr:0,brk:0,steer:0,hand:true,nitro:false});
  assert.equal(c.slope,0,`${gap?'gap':'raised slab'} cannot support the remote axle`);
  assert.equal(c.y,.03,`${gap?'gap':'raised slab'} cannot lift the chassis`);
}
console.log(`PASS Anichkov: ${crossings} crossings (7 buses, both directions, slow/rest, cruise, reverse and diagonal), 14 crest restarts, real under-arch water/bed and piers, wall/step/air and disconnected-support safeguards`);
