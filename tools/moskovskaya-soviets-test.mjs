// CPU-only geometry/physics audit, using actual area OSM records.
// node tools/area.mjs moskovskaya tools/moskovskaya-soviets-test.mjs
// During data preparation --source <city.js> can inspect the same source family.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {buildWorld} from './lib/headless-world.mjs';
import {makeKit,roadClear} from '../src/world/landmarksMoskovskaya/common.js';
import {soviets,lenin} from '../src/world/landmarksMoskovskaya/soviets.js';
import {GROUPS_LIST} from '../src/world/landmarksMoskovskaya/soviets-groups.js';

const {ctx,L,THREE,errors}=await buildWorld({modules:[]});
assert.deepEqual(errors,[]);
const sourceArg=process.argv.indexOf('--source');
const data=sourceArg>=0?await import(pathToFileURL(process.argv[sourceArg+1]).href):await import('../src/world/data/city.js');
const records=data.BUILDINGS.filter(b=>b.id==='r5933725'||b.parent==='r5933725');
const monument=data.MONUMENTS.find(m=>m.id==='w189982684');
assert.equal(records.length,5,'outline and all four source parts must be imported');
assert(monument,'mapped Lenin monument must be imported');
assert(GROUPS_LIST.some(g=>g.ids.includes('r5933725')));
assert(GROUPS_LIST.some(g=>g.osm.includes(monument.id)));
const root=new THREE.Group(),svc={houses:[],monuments:[],photoSpots:[],entrances:[],parts:{},triangles:0};
const K=makeKit(ctx,root,svc),updates=ctx._updates.length;
K.begin();soviets(K,records);K.flush('soviets');
K.begin();lenin(K,monument);K.flush('moskovskaya-lenin');ctx.addStatic(root);
assert.equal(ctx._updates.length,updates,'static ensemble adds no frame callbacks');
assert.equal(svc.houses.length,4,'only parts draw, avoiding an extra parent mass');
assert(svc.parts.soviets.triangles<65000,'detailed architecture stays bounded');
assert.equal(svc.monuments.filter(m=>m.id===monument.id).length,1);
assert.equal(svc.soviets.columns.length,14,'photographed central portico has fourteen shafts');
assert(svc.soviets.front.length>101&&svc.soviets.front.length<103,'frontage keeps the measured OSM span');
root.updateMatrixWorld(true);
const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
for(const mesh of meshes){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)),'all geometry positions are finite');
  assert(!mesh.userData.noBatch,'architecture uses maintained static batching');
}
const ray=new THREE.Raycaster(),ph=ctx.physics,F=svc.soviets.front;
ray.layers.enableAll();
function frontHit(x,z){ray.set(new THREE.Vector3(x+F.nx*3,12,z+F.nz*3),new THREE.Vector3(-F.nx,0,-F.nz));return ray.intersectObjects(meshes,false)[0];}
let shaftProbes=0,gapProbes=0;
const cols=svc.soviets.columns.toSorted((a,b)=>(a.x-b.x)*F.ux+(a.z-b.z)*F.uz);
for(const c of cols){
  assert(roadClear(ctx,c.x,c.z,c.r+.22),'column footprint remains outside asphalt');
  assert(ph.columnBlocked(c.x,c.z,.1,12,13),'drawn shaft is physically solid');
  const hit=frontHit(c.x,c.z);assert(hit&&hit.distance>1.8&&hit.distance<2.25,'front-facing shaft mesh matches the physical support');shaftProbes++;
}
for(let i=0;i+1<cols.length;i++){
  const a=cols[i],b=cols[i+1],x=(a.x+b.x)/2,z=(a.z+b.z)/2;
  assert(!ph.columnBlocked(x,z,.28,10,11),'open intercolumn bay must remain passable');
  const hit=frontHit(x,z);assert(hit&&hit.distance>4.3,'no invisible or drawn wall fills the open portico bay');gapProbes++;
}
const inside=(x,z,h)=>{let yes=false;for(let i=0,j=h.length-2;i<h.length;j=i,i+=2){const ax=h[i],az=h[i+1],bx=h[j],bz=h[j+1];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)yes=!yes;}return yes;};
let courts=0,courtProbes=0;
for(const p of records.find(b=>!b.part).polys)for(const hole of p.h){
  courts++;const xs=hole.filter((_,i)=>i%2===0),zs=hole.filter((_,i)=>i%2);
  // Interior samples independently ray-test the real roofs rather than trusting
  // the builder's count or bounding boxes for preserved open courtyard holes.
  for(let x=Math.min(...xs)+2;x<Math.max(...xs)-2;x+=4)for(let z=Math.min(...zs)+2;z<Math.max(...zs)-2;z+=4){
    if(!inside(x,z,hole)||![-.8,.8].every(d=>inside(x+d,z,hole)&&inside(x,z+d,hole)))continue;
    ray.set(new THREE.Vector3(x,50,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(meshes,false)[0];
    assert(!hit||hit.point.y<.8,'surveyed courtyard has been filled by roof geometry');
    assert(!ph.columnBlocked(x,z,.15,1,2),'surveyed courtyard has a phantom building collider');courtProbes++;
  }
}
assert.equal(courts,3);assert(courtProbes>100);
assert(ph.columnBlocked(monument.x,monument.z,.1,1,2),'Lenin granite plinth has collision');
assert(!ph.columnBlocked(monument.x+2,monument.z,.1,1,2),'narrow real plinth has no oversized invisible box');
ray.set(new THREE.Vector3(monument.x,25,monument.z),new THREE.Vector3(0,-1,0));
const head=ray.intersectObjects(meshes,false)[0];assert(head&&head.point.y>14.5&&head.point.y<16.1,'mapped statue has its recognizable sixteen-metre silhouette');
console.log(JSON.stringify({triangles:svc.triangles,architecture:svc.parts.soviets.triangles,shaftProbes,gapProbes,courts,courtProbes,callbacks:ctx._updates.length-updates}));
console.log('PASS measured House of Soviets parts, physical open portico, three open courts and Lenin monument.');
