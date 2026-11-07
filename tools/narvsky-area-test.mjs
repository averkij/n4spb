// Area invariants: real southern coverage, surveyed landmarks and physical
// openings. Run under tools/area.mjs narvsky; CPU only.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { BUILDINGS, ROADS, RIVER } from '../src/world/data/city.js';
import { gateFrame } from '../src/world/landmarksNarvsky/gate.js';
import { NAVIGABLE_WATER_Y } from '../src/world/environment/water-level.js';
import { GARAGE } from '../src/world/area.js';
import { SPEC_LADA } from '../src/world/drive/cars/lada2106.js';
import { boatPoseClear,boatBankBoarding,runBoatCourse } from './narvsky-boat-course.mjs';
const fullGarage=process.argv.includes('--garage-world');
const {ctx,L,THREE,errors}=await buildWorld({modules:fullGarage?['environment','streets','city','landmarksNarvsky','coastalBridges','props','traffic','wildlife','drive']:['landmarksNarvsky']});
assert.deepEqual(errors,[]);
const gate=BUILDINGS.find(b=>b.id==='w73174258'),club=BUILDINGS.find(b=>b.id==='w42342130');
assert(gate&&club,'both exact surveyed landmark footprints are present');
assert(BUILDINGS.filter(b=>b.cz>4000).length>500,'the southern source edge is supplemented with real buildings');
assert(ROADS.some(r=>r.pts?.some((v,i)=>i%2&&v>8000)),'the southern railway territory retains actual mapped streets');
assert(RIVER.some(r=>r.id==='r3298255'&&r.polys.length),'Tarakanovka is retained as real navigable water');
const f=gateFrame(gate),c=Math.cos(f.rot),s=Math.sin(f.rot),point=(u,v)=>[f.x+c*u+s*v,f.z-s*u+c*v];
for(const u of [-2.7,0,2.7])for(let v=-8;v<=8;v+=.5){
  const [x,z]=point(u,v);
  assert(!ctx.physics.columnBlocked(x,z,.45,0,2.5),`open gate passage for walker/car at ${u},${v}`);
}
assert(ctx.physics.columnBlocked(...point(7.5,0),.4,0,2.5),'real gate pier remains solid');
assert(ctx.physics.columnBlocked(f.x,f.z,.4,16,18),'the arch is solid above the clear opening');
assert(!L.insideBuilding(f.x,f.z,.5),'the elevated gate data is not a ground wall');
const boatDock=GARAGE.boats.find(b=>b.id==='boat-narvsky');
assert.equal(L.waterLevelAt(boatDock.x,boatDock.z),NAVIGABLE_WATER_Y,'the harbour boat uses the connected datum');
assert(L.inPlay(boatDock.x,boatDock.z),'the boat is inside reachable territory');
const service=ctx.services.landmarksNarvsky;
assert(service.landmarkBuildings.some(b=>b.id===club.id),'Gorky is authored by the specialist');
assert(service.entrances.length>=3,'Gorky has its three street entrances');
for(const e of service.entrances)assert(!ctx.physics.columnBlocked(e.x,e.z,.28,0,1.7),'authored foyer door is physically open');
// The original garage passed a14m check but hit a facade after19m. Sweep the
// whole body35m forward, including its nose and a0.2m side margin. The fast
// path checks mapped ground footprints and actual landmark solids; the full
// --garage-world path also checks generic city/fixture/parked-traffic solids
// and the actual handling acceleration/braking used by the browser playtest.
const pose=GARAGE.poses.lada,S=SPEC_LADA,sy=Math.sin(pose.yaw),cy=Math.cos(pose.yaw);
const vehicle=fullGarage?ctx.drive.fleet.find(v=>v.id==='lada'):null;
if(vehicle)ctx.physics.remove(vehicle.box);
for(let d=0;d<=35;d+=.5)for(const f of [S.rear,0,S.front])for(const w of [-S.W/2-.2,0,S.W/2+.2]){
  const x=pose.x+sy*(d+f)+cy*w,z=pose.z+cy*(d+f)-sy*w;
  assert(!L.insideBuilding(x,z,.3),`35m garage exit touches a mapped building at ${x},${z}, advance${d}`);
  assert(!ctx.physics.columnBlocked(x,z,.3,.3,1.3),`35m garage exit touches a real obstacle at ${x},${z}, advance${d}`);
  assert(L.inPlay(x,z,2)&&Math.abs(L.heightAt(x,z))<.35,'garage exit stays on continuous street ground');
}
if(vehicle){
  const car=vehicle.car;car.reset(pose.x,pose.z,pose.yaw);let impacts=0;
  for(let i=0;i<120;i++){car.step(1/60,{thr:1,brk:0,steer:0,hand:false,nitro:false});impacts+=car.events.filter(e=>e.type==='hit').length;}
  assert(car.speed>10&&Math.hypot(car.x-pose.x,car.z-pose.z)>10,'garage Lada accelerates for2s');
  for(let i=0;i<240;i++){car.step(1/60,{thr:0,brk:0,steer:0,hand:true,nitro:false});impacts+=car.events.filter(e=>e.type==='hit').length;}
  assert.equal(impacts,0,'straight garage acceleration and Space braking hit no obstacle');
  assert(Math.abs(car.speed)<.8,'garage Lada brakes to exit speed');
  console.log(`PASS garage handling:2s throttle +4s Space,${Math.hypot(car.x-pose.x,car.z-pose.z).toFixed(1)}m,0 impacts`);
  const boat=ctx.drive.boats.find(b=>b.id==='boat-narvsky');ctx.physics.remove(boat.box);
  const dock=GARAGE.boats.find(b=>b.id===boat.id);
  const boarding=boatBankBoarding(ctx,boat,dock.x,dock.z,dock.yaw);
  assert(boarding.length,'a real bank/pontoon floor is within the boat E prompt radius');
  for(let d=0;d<=35;d+=.5)assert(boatPoseClear(ctx,boat,dock.x+Math.sin(dock.yaw)*d,dock.z+Math.cos(dock.yaw)*d,dock.yaw),`boat hull/craft/shore clearance over35m launch at${d}`);
  for(const time of [0,30,60]){
    const course=runBoatCourse(ctx,boat,dock,time);
    assert(course.ok,`actual boat W4.5s +W/A1.1s +Space4s at t${time}: ${JSON.stringify(course)}`);
  }
  console.log(`PASS harbour boat:bank/pontoon E range,35m full-hull launch,3 actual timed acceleration/steering/braking courses, preserved other craft`);
}
let vertices=0;const p=new THREE.Vector3();ctx.staticRoot.updateMatrixWorld(true);
ctx.staticRoot.traverse(o=>{if(!o.isMesh||!(/^(narva-gate|narvsky-gorky)/.test(o.name)))return;const a=o.geometry.attributes.position;o.updateMatrixWorld(true);for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);assert([p.x,p.y,p.z].every(Number.isFinite),'finite authored landmark vertices');vertices++;}});
assert(vertices>10000,'test inspected actual detailed landmark geometry');
console.log(`PASS Narvsky: ${BUILDINGS.length} buildings, ${ROADS.length} road pieces; ${vertices} landmark vertices, open gate/car passage, solid supports, Gorky entrances and connected boat datum.`);
