// Behavioral regression for the real park: source islands, pond navigation,
// reachable fountain, open colonnades and furniture knocked off its colliders.
// node tools/area.mjs moskovskaya tools/moskovskaya-park-test.mjs [--integrated]
// --mutant-fountain restores the old invisible filled-basin cylinder (must fail).
import assert from 'node:assert/strict';
import * as CITY from '../src/world/data/city.js';
import { buildWorld } from './lib/headless-world.mjs';
import { createBoatHandling } from '../src/world/drive/boat/handling.js';
import { createHandling } from '../src/world/drive/handling.js';
import { Player } from '../src/core/player.js';

assert.equal(process.env.AREA,'moskovskaya','run through tools/area.mjs moskovskaya');
const integrated=process.argv.includes('--integrated');
const modules=integrated?['environment','streets','city','landmarksMoskovskayaPark','coastalBridges']:['landmarksMoskovskayaPark','coastalBridges'];
const {ctx,L,THREE,errors}=await buildWorld({modules});
assert.deepEqual(errors,[],'all park and bridge builders succeed');
const ph=ctx.physics,svc=ctx.services.landmarksMoskovskayaPark;
assert(svc?.monuments.some(q=>q.id==='w30899425'),'the mapped yellow pavilion is actually built');
assert(svc.monuments.some(q=>q.id==='r11008642'),'the memorial chapel is built');
assert.equal(svc.updates,0,'the authored park adds no per-frame callbacks');

const inRing=(x,z,r)=>{let inside=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const ax=r[i],az=r[i+1],bx=r[j],bz=r[j+1];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;};
const inPoly=(x,z,p)=>inRing(x,z,p.o)&&!p.h.some(h=>inRing(x,z,h));
const bounds=r=>({x0:Math.min(...r.filter((_,i)=>i%2===0)),x1:Math.max(...r.filter((_,i)=>i%2===0)),z0:Math.min(...r.filter((_,i)=>i%2)),z1:Math.max(...r.filter((_,i)=>i%2))});
function interior(r){const b=bounds(r);for(let z=b.z0+1;z<b.z1;z+=1)for(let x=b.x0+1;x<b.x1;x+=1)if([[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([dx,dz])=>inRing(x+dx,z+dz,r)))return {x,z};throw new Error('island has no interior sample');}
const pondIds=['r77680','r109994','r11008649','r11010469','r147758','r1380826','r11010790','r11014824','r11016386'];
let islands=0,boatCourses=0;
for(const id of pondIds){
  const water=CITY.WATER.find(w=>w.id===id);assert(water?.polys.length,'mapped pond '+id);
  for(const p of water.polys)for(const h of p.h){const q=interior(h);assert(!L.waterwayAt(q.x,q.z),`${water.name}: a real island stays dry`);assert.equal(ph.waterLevel(q.x,q.z),null,'no water datum over island');assert(ph.groundHeight(q.x,q.z,1)>=-.01,'island supports a walker');islands++;}
  // Find a genuine 16 m straight hull corridor inside the surveyed polygon.
  // Neither a pond centre nor an axis-aligned bounding box can substitute for
  // this check: both can lie on one of the actual islands.
  let course=null;
  outer:for(const p of water.polys){const b=bounds(p.o);for(let z=b.z0+4;z<b.z1-4;z+=3)for(let x=b.x0+4;x<b.x1-4;x+=3)for(const yaw of [0,Math.PI/2]){
    const sy=Math.sin(yaw),cy=Math.cos(yaw);let okay=true;
    for(let a=-3.5;a<=19.5&&okay;a+=1)for(const v of [-1.4,0,1.4]){const px=x+sy*a+cy*v,pz=z+cy*a-sy*v;if(!inPoly(px,pz,p)||ph.waterLevel(px,pz)===null||L.insideBuilding(px,pz)){okay=false;break;}}
    if(okay){course={x,z,yaw};break outer;}
  }}
  assert(course,'room for a motorboat hull within '+water.name);
  const boat=createBoatHandling(ctx);boat.reset(course.x,course.z,course.yaw);
  for(let f=0;f<114;f++)boat.step(1/60,{thr:1,brk:0,steer:0,hand:false});
  assert(Math.hypot(boat.x-course.x,boat.z-course.z)>6,water.name+': a real boat accelerates across open pond water');
  assert.equal(boat.y,ph.waterLevel(boat.x,boat.z),'boat floats on the actual pond datum');
  const car=createHandling(ctx);assert(!car.blocked(course.x,course.z),'water is legal car terrain: '+water.name);
  boatCourses++;
}
assert(islands>=11,'all eleven mapped park island holes are retained');

function walker(x,z,yaw=0){const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(x,z,yaw,0);return p;}
function advance(p,seconds){p.keys.add('KeyW');for(let f=0;f<seconds*60;f++){p.time+=1/60;p.update(1/60);}p.keys.clear();}
// Traverse the real fountain across a clear chord at x+7 m, away from the
// bronze wreath supports. The previous 12.2 m solid cylinder fails this walk.
const fountain=CITY.FOUNTAINS.find(q=>q.id==='w32073130');
assert.equal(ph.waterLevel(fountain.x+7,fountain.z),.29,'fountain water participates in real water physics');
if(process.argv.includes('--mutant-fountain'))ph.addCylinder(fountain.x,fountain.z,12.2,0,.7);
const walk=walker(fountain.x+7,fountain.z-15,180);advance(walk,10);
assert(walk.pos.z>fountain.z+10,'a walker enters and crosses the shallow fountain water');
for(const dz of [-8,-4,0,4,8])assert(!ph.columnBlocked(fountain.x+7,fountain.z+dz,.3,.23,1.7),'no invisible fountain wall');

// Open central entrance approach and porch bays, with their real columns kept
// solid. Probe at standing height rather than ignoring all roof footprints.
for(let x=-1695;x<=-1668;x+=.4)assert(!ph.columnBlocked(x,7074.5,.3,.32,1.7),'central propylea entrance stays open');
const main=svc.monuments.find(q=>q.id==='w30899425');
assert(!ph.columnBlocked(main.x,main.z-5,.3,.25,1.7),'open yellow-pavilion porch is walkable');
assert(ph.columnBlocked(-1688.24,7063.24,.2,.32,1.7),'an actual propylea column remains solid');

for(const kind of ['bench','lamp']){
  const spot=(kind==='bench'?svc.benches:svc.lamps).find(s=>s.knock?.state==='stand');assert(spot,kind+' is registered through the shared knock service');
  const record=spot.knock;assert(record.items.length,'real collider handles');
  for(const p of record.parts){if(!p.mesh)continue;assert.equal(p.mesh.instanceMatrix.usage,THREE.DynamicDrawUsage,'knock instances are Dynamic');assert(Number.isFinite(p.mesh.userData.lodFar),'finite fixture LOD');}
  const item=record.items[0];assert(ph.items.includes(item),'standing fixture is in physics');
  ctx.knock.hit(record.x,record.z,40,1,0,kind);
  for(let i=0;i<180;i++)ctx.knock.update(1/60);
  assert.notEqual(record.state,'stand',kind+' breaks on a 40 km/h impact');
  assert(!ph.items.includes(item),kind+' original upright collider is removed');
  for(const it of record.items)if(ph.items.includes(it))assert((it.y1??it.top)<=(spot.y||0)+.45,'fallen fixture leaves a passable low obstacle relative to its visible floor');
}
console.log(`moskovskaya-park-test: ${islands} dry islands, ${boatCourses} real boat courses, legal water/car poses, fountain walk, open colonnades and bench/lamp knock OK${integrated?' (integrated)':''}`);
