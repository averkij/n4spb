// Focused CPU correctness test using actual city meshes/colliders. It narrows
// only this process's input array; this is not an FPS/loading benchmark.
// node tools/area.mjs narvsky tools/narvsky-height-test.mjs
import assert from 'node:assert/strict';
import { BUILDINGS } from '../src/world/data/city.js';
import { COASTAL_BRIDGES } from '../src/areas/narvsky/bridge-sites.js';
import { buildWorld } from './lib/headless-world.mjs';
const ids=['w49629469','w685882720'],records=ids.map(id=>BUILDINGS.find(b=>b.id===id));
assert(records.every(Boolean));
BUILDINGS.splice(0,BUILDINGS.length,...records);
const {ctx,L,THREE,marks,errors}=await buildWorld({modules:['streets','city','landmarksNarvsky','coastalBridges']});assert.deepEqual(errors,[]);
const inside=(x,z,p)=>{let on=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2)if((p[i+1]>z)!==(p[j+1]>z)&&x<(p[j]-p[i])*(z-p[i+1])/(p[j+1]-p[i+1])+p[i])on=!on;return on;};
const envelopes=new Map(ids.map(id=>[id,{min:Infinity,max:-Infinity,vertices:0}])),point=new THREE.Vector3();
ctx.staticRoot.updateMatrixWorld(true);
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh||!o.geometry.attributes.position)return;
  let city=false;for(let p=o;p;p=p.parent){if(p.name.startsWith('city')||p.name==='narvsky-toll-roof')city=true;if(p.name.startsWith('coastalBridges'))return;}
  if(!city)return;
  const a=o.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
    point.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);
    for(const b of records)if(b.polys.some(p=>inside(point.x,point.z,p.o))){const e=envelopes.get(b.id);e.min=Math.min(e.min,point.y);e.max=Math.max(e.max,point.y);e.vertices++;}
  }
});
const [first,last]=marks.city,colliders=ctx.physics.items.slice(first,last),summaries=[];
for(const b of records){const e=envelopes.get(b.id);assert(e.vertices>0,`${b.id}: inspected actual drawn city buffers`);
  const cs=colliders.filter(c=>b.polys.some(p=>inside(c.cx,c.cz,p.o))||Math.hypot(c.cx-b.cx,c.cz-b.cz)<15),y0=Math.min(...cs.map(c=>c.y0)),y1=Math.max(...cs.map(c=>c.y1));
  if(b.id==='w49629469')assert(cs.length>0,`${b.id}: real city wall colliders present`);summaries.push({id:b.id,layoutHeight:L.heightOf(b),drawn:e,colliders:{count:cs.length,min:y0,max:y1}});console.log('measured',JSON.stringify(summaries.at(-1)));
  if(b.id==='w49629469'){assert(e.max<11,'the corrected low factory roof stays below11m');assert(y1<12,'warehouse wall colliders stay below12m');assert(19.4-e.max>8.4,'the22.025m WHSD deck/19.425m soffit clear the complete drawn roof');}
  else {assert(e.min>6&&Math.abs(e.max-11.345)<.001,'supported toll canopy preserves its .32m roof top');assert(cs.length===0,'claimed canopy has no generic ground wall or floating box');const owner=ctx.physics.items.slice(...marks.landmarksNarvsky),columns=owner.filter(c=>c.type==='cyl'&&Math.hypot(c.cx-b.cx,c.cz-b.cz)<35);const house=ctx.services.landmarksNarvsky.houses.find(h=>h.id===b.id);assert(house?.columns>0,'actual canopy has physical support columns');assert.equal(columns.length,house.columns);for(const c of columns){assert(Math.abs(c.y0-6.025)<.001&&Math.abs(c.y1-11.025)<.001,'support spans deck to roof');assert(ctx.services.streets.net.cover(c.cx,c.cz,{})<-.5,'support lies outside street carriageway');}console.log('supported canopy',JSON.stringify({columns:house.columns,top:house.h,under:house.minH}));assert(!ctx.physics.columnBlocked(b.cx,b.cz,1,6.1,10.9),'covered ramp has its5m clear overhead passage');}
}
const bridgeEnvelope={triangles:0,min:Infinity,max:-Infinity,lowestCentroid:Infinity};
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh||!o.geometry.attributes.position)return;
  let bridge=false;for(let p=o;p;p=p.parent)if(p.name.startsWith('coastalBridges'))bridge=true;
  if(!bridge)return;
  const a=o.geometry.attributes.position,ix=o.geometry.index,v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
  for(let i=0,n=ix?ix.count:a.count;i+2<n;i+=3){
    for(let k=0;k<3;k++)v[k].fromBufferAttribute(a,ix?ix.getX(i+k):i+k).applyMatrix4(o.matrixWorld);
    const x=(v[0].x+v[1].x+v[2].x)/3,z=(v[0].z+v[1].z+v[2].z)/3;
    if(!records[0].polys.some(p=>inside(x,z,p.o)))continue;
    bridgeEnvelope.triangles++;bridgeEnvelope.min=Math.min(bridgeEnvelope.min,...v.map(p=>p.y));bridgeEnvelope.max=Math.max(bridgeEnvelope.max,...v.map(p=>p.y));bridgeEnvelope.lowestCentroid=Math.min(bridgeEnvelope.lowestCentroid,(v[0].y+v[1].y+v[2].y)/3);
  }
});
const canopy=records[1],ramp=COASTAL_BRIDGES.find(b=>b.road.id==='w685882716');let laneSamples=0;
for(let i=0;i+3<ramp.pts.length;i+=2){
  const [ax,az,bx,bz]=ramp.pts.slice(i,i+4),n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.5));
  for(let k=0;k<=n;k++){
    const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;
    if(!canopy.polys.some(p=>inside(x,z,p.o)))continue;
    assert(!ctx.physics.columnBlocked(x,z,1.15,6.1,10.9),'complete vehicle-width lane column clears canopy supports and roof');laneSamples++;
  }
}
assert(laneSamples>=10,'sampled the actual covered ramp through the roof footprint');
console.log('covered ramp clear body-width samples:',laneSamples);
console.log('WHSD actual draw envelope over warehouse:',JSON.stringify(bridgeEnvelope));
assert(bridgeEnvelope.min>=19.35,'actual WHSD solids above factory keep measured clearance');
console.log('PASS Narvsky factory/covered ramp actual geometry:',JSON.stringify(summaries));
