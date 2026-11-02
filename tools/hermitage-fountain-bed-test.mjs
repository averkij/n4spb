// Real environment flower triangles and generic basin builder, no GPU.
// node tools/area.mjs <palace|admiralty> tools/hermitage-fountain-bed-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { GREEN,FOUNTAINS } from '../src/world/data/city.js';
import { buildSurfaces } from '../src/world/environment/lawns.js';
import { placeFountains } from '../src/world/props/fountains.js';
import { clearHermitageFountainBed,applyAreaDataCorrections } from './lib/area-data-corrections.mjs';

const f=FOUNTAINS.find(f=>f.id==='n9307113823'),garden=GREEN.find(g=>g.id==='w67548566');
assert.ok(f&&garden,'Hanging Garden and mapped fountain remain in the area');
assert.equal(garden.polys[0].h.length,1,'only the basin-sized planting opening is added');
const raw={...garden,polys:garden.polys.map(p=>({...p,h:[]}))};
const corrected=clearHermitageFountainBed([raw],[f]);
assert.deepEqual(corrected[0],garden,'the data generator reproduces the shipped correction');
assert.deepEqual(corrected[0].polys[0].o,raw.polys[0].o,'historic outer planting boundary stays exact');
assert.deepEqual(clearHermitageFountainBed(corrected,[f]),corrected,'regeneration is idempotent');
const unaffected=[{arrays:new Map([['GREEN',[raw]],['FOUNTAINS',[f]]])}];
applyAreaDataCorrections('kronverk',unaffected);
assert.equal(unaffected[0].arrays.get('GREEN')[0],raw,'other areas retain their source data');
const {ctx,THREE,L}=await buildWorld({modules:[]}),root=new THREE.Group(),all=GREEN.slice();
try{GREEN.splice(0,GREEN.length,garden);buildSurfaces(ctx,root,{},new Set());}
finally{GREEN.splice(0,GREEN.length,...all);}
const flowers=root.getObjectByName('env-flowerbed');assert.ok(flowers,'historic flower carpet is still rendered');
const geo=flowers.geometry,pos=geo.attributes.position,ix=geo.index;
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const inside=(a,b,c,p)=>{const s=[cross(a,b,p),cross(b,c,p),cross(c,a,p)];return s.every(x=>x>=-1e-8)||s.every(x=>x<=1e-8);};
const dseg=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);};
const p=[f.x,f.z],far=[f.x+2.4,f.z+3.2];let preserved=false,triangles=0;
for(let i=0;i<(ix?.count??pos.count);i+=3){
  const v=[0,1,2].map(j=>{const k=ix?ix.getX(i+j):i+j;return[pos.getX(k),pos.getZ(k)];});
  const distance=inside(...v,p)?0:Math.min(dseg(p,v[0],v[1]),dseg(p,v[1],v[2]),dseg(p,v[2],v[0]));
  assert.ok(distance>1.58,'no flower triangle covers fountain water or its coping');
  preserved ||= inside(...v,far);triangles++;
}
assert.ok(preserved,'flowers outside the basin remain continuous');
placeFountains({ctx,root,svc:{},stats:{},tris:0,levelAt:()=>0},{FOUNTAINS:[f],WATER:[],FURNITURE:[]},L);
assert.equal(ctx.physics.waterLevel(f.x,f.z),.09,'the real fountain remains live native water');
assert.ok(!ctx.physics.columnBlocked(f.x,f.z,.15,.04,1.74),'cleared basin stays walkable');
assert.ok(ctx.services.liveFountains.records.some(r=>r.id==='mapped-n9307113823-0'),'mapped fountain is not excluded');
console.log(`PASS ${process.env.AREA}: ${triangles} retained flower triangles clear the mapped Hermitage basin`);
