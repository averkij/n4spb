// Real integrated Park 300 ground / islands / bridge regression, CPU only.
// node tools/area.mjs okrug65 tools/okrug65-waterfront-test.mjs
// The ordinary headless world retains environment, streets, all landmarks,
// bridges and props. Assertions use real meshes, Physics and boat handling.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { ISLANDS } from '../src/world/landmarksOkrug65/waterfront-data.js';
import { ISLAND_RINGS, ringContains } from '../src/world/landmarksOkrug65/waterfront-plan.js';
import { COASTAL_BRIDGES } from '../src/world/coastalBridges/sites.js';
import { BEACH_SLOPES, beachHeightAt } from '../src/world/landmarksOkrug65/beach-plan.js';
import { inBeach } from '../src/world/landmarksOkrug65/park-hooks.js';
import { createBoatHandling } from '../src/world/drive/boat/handling.js';
const { ctx, L, THREE, errors, built } = await buildWorld({});
assert.equal(errors.length, 0, errors.join('\n'));
assert(ctx.services.waterfrontOkrug65?.deckY, 'waterfront deck service missing');
assert.equal(ISLANDS.length, 3);
assert(BEACH_SLOPES.length >= 60, 'broad beach slope set missing');
assert.equal(L.waterLevelAt(-8228, -5216), null, 'east navigation channel floods the mapped exposed beach');
const root = ctx.staticRoot;
root.updateMatrixWorld(true);
console.log('INTEGRATED', built);
let islands=0,access=0,sea=0,road=0;
// Exact dry island interiors stay dry; visible promenade floors support feet.
for(let i=0;i<ISLANDS.length;i++){
 const s=ISLANDS[i],ring=ISLAND_RINGS[i],flat=ring.flat();
 assert(Math.abs(ctx.physics.groundHeight(s.x,s.z,s.y,false)-s.y)<1e-9); islands++;
 assert.equal(L.waterLevelAt(s.x,s.z),null,'hydraulic island made wet');
 for(let a=0;a<Math.PI*2;a+=.1){
  const x=s.x+Math.cos(a)*22,z=s.z+Math.sin(a)*22;
  assert(ringContains(flat,x,z));assert(Math.abs(ctx.physics.groundHeight(x,z,s.y,false)-s.y)<1e-9);assert.equal(L.waterLevelAt(x,z),null,'dry island promenade excavated'); islands++;
  const xx=s.x+Math.cos(a)*29,zz=s.z+Math.sin(a)*29;
  if(!ctx.services.waterfrontOkrug65.paths.some(p=>p.id===s.bridge.id&&Math.hypot(xx-s.bridge.pts[0],zz-s.bridge.pts[1])<30)){
   assert(!ctx.physics.items.some(it=>it.type==='walk'&&Math.abs(xx-it.cx)<it.hw&&Math.abs(zz-it.cz)<it.hd)); sea++;
  }
 }
 const a=ctx.services.waterfrontOkrug65.paths.find(p=>p.id===s.bridge.id).pts;let d=0;
 for(let k=2;k<a.length;k+=2){
  const ax=a[k-2],az=a[k-1],bx=a[k],bz=a[k+1],len=Math.hypot(bx-ax,bz-az),n=Math.ceil(len/.5);
  for(let j=0;j<=n;j++){
   const t=j/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=.075+(s.y-.075)*Math.min(1,(d+len*t)/14);
   assert(Math.abs(ctx.physics.groundHeight(x,z,y,false)-y)<.005,`${s.key} deck gap at ${x},${z}`);access++;
   assert(Math.abs(ctx.services.waterfrontOkrug65.deckY(x,z,y)-y)<.005,`drive deck mismatch ${s.key} ${x},${z} expected${y} actual${ctx.services.waterfrontOkrug65.deckY(x,z,y)}`);
   const clearShelf=Array.from({length:16},(_,q)=>q*Math.PI/8).every(q=>(beachHeightAt(x+Math.cos(q)*.7,z+Math.sin(q)*.7)??-6)<-3.55);
   if(d+len*t>18&&Math.hypot(x-s.x,z-s.z)>28&&clearShelf){assert(!ctx.physics.columnBlocked(x,z,.5,-3.4,-2.7),`${s.key} underdeck obstructed ${x},${z}, sand${beachHeightAt(x,z)}`);sea++;}
  }d+=len;
 }
 console.log(s.key,{water:L.waterLevelAt(s.x,s.z),terrain:L.heightAt(s.x,s.z),accessLength:d.toFixed(2)});
}
root.traverse(o=>{if(!o.isMesh||(!o.name.includes('maintained-lawns')&&o.material?.color?.getHexString()!=='aaa89d'))return;const a=o.geometry.attributes.position,ix=o.geometry.index;
 for(let i=0;i<ix.count;i+=3){const p=Array.from({length:3},(_,j)=>{const k=ix.getX(i+j);return[a.getX(k),a.getZ(k)]});
 const probes=[[(p[0][0]+p[1][0]+p[2][0])/3,(p[0][1]+p[1][1]+p[2][1])/3]];
 // Long ribbon triangles can graze asphalt at their ends while their centre
 // remains clear. Check every vertex and each edge at two-metre spacing too.
 for(let j=0;j<3;j++){const q=p[j],r=p[(j+1)%3],n=Math.max(1,Math.ceil(Math.hypot(r[0]-q[0],r[1]-q[1])/2));for(let k=0;k<n;k++)probes.push([q[0]+(r[0]-q[0])*k/n,q[1]+(r[1]-q[1])*k/n]);}
 for(const[x,z]of probes)assert(ctx._roadPlan.cover(x,z,{})<-.29,`surface ${o.name} covers road at ${x},${z}`);road++;}
});
// Hit this builder's actual rail record, rather than unrelated street furniture.
const accessRails=ctx.knock.list.filter(r=>r.parts.some(p=>p.mesh?.name.startsWith('park300-access-rail')));
assert(accessRails.length>100,'breakable bridge rails missing');
const record=accessRails[0],item=record.item||record.items?.[0];assert(item,'rail has no collision handle');
ctx.knock.hit(record.x,record.z,70,1,0,'railing');assert.notEqual(record.state,'stand');assert(!ctx.physics.items.includes(item));
let shore=0,outside=0,renderProbes=0,maxRenderError=0;const outsideIds=new Set(),ray=new THREE.Raycaster(),sandMeshes=[];
// Raycasts interrogate the real Float32 draw mesh independently of the pure
// terrain function. Submerged shelves must meet that same physical surface.
root.traverse(o=>{if(o.isMesh&&o.material?.color?.getHexString()==='c4b38f')sandMeshes.push(o)});
for(const s of BEACH_SLOPES){
 for(const ids of [[0,1,2],[0,2,3]]){const p=ids.map(i=>s.pts[i]);
  for(let j=1;j<8;j++)for(let k=1;k<8-j;k++){const a=j/8,b=k/8,c=1-a-b,x=p[0][0]*a+p[1][0]*b+p[2][0]*c,z=p[0][2]*a+p[1][2]*b+p[2][2]*c,y=p[0][1]*a+p[1][1]*b+p[2][1]*c;
   const highest=beachHeightAt(x,z);assert(highest>=y-.005,'height below its visible mesh');
   if(ctx.services.waterfrontOkrug65.deckY(x,z,highest)===null)assert(Math.abs(ctx.physics.groundHeight(x,z,highest,false)-highest)<.005,`shore ${s.id} floor mismatch`);
   if(j===3&&k===2){ray.set(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(sandMeshes,false)[0];assert(hit,'missing visible beach slope');const err=Math.abs(highest-hit.point.y);maxRenderError=Math.max(maxRenderError,err);assert(err<.012,`ray mismatch ${s.id} ${err}`);renderProbes++;}
   if(!s.id.endsWith('-submerged')&&!inBeach(x,z)){outside++;outsideIds.add(s.id);}shore++;
  }
 }
}
console.log({islands,access,sea,road,shore,outside,renderProbes,maxRenderError,knock:ctx.knock.stats.byKind.railing,coastalOverlap:COASTAL_BRIDGES.filter(b=>ISLANDS.some(s=>b.road.id===s.bridge.id)).map(b=>b.road.id)});
assert.equal(outside,0,'dry beach triangles extend beyond mapped sand');
assert.equal(COASTAL_BRIDGES.filter(b=>ISLANDS.some(s=>b.road.id===s.bridge.id)).length,0,'generic decks duplicate authored access bridges');
console.log('outside pieces', [...outsideIds]);
let walkSteps=0,walkRoutes=0;
// A walker crosses from the land edge to beyond the six-metre submerged shelf.
for(const s of BEACH_SLOPES){const a=s.pts[0],b=s.pts[1],c=s.pts[2],d=s.pts[3],sx=(a[0]+b[0])/2,sz=(a[2]+b[2])/2,ix=(c[0]+d[0])/2,iz=(c[2]+d[2])/2,run=Math.hypot(ix-sx,iz-sz);
 if(s.id.endsWith('-submerged'))continue;
 if(run<10||Math.hypot(b[0]-a[0],b[2]-a[2])<15)continue;
 const start=[ix,iz],end=[sx-(ix-sx)/run*6.6,sz-(iz-sz)/run*6.6];
 let floor=ctx.physics.groundHeight(...start,1,false),last={x:start[0],z:start[1]};
 if(ctx.services.waterfrontOkrug65.deckY(...start)!==null)continue;
 for(let step=1;step<=75;step++){const t=step/75,p={x:start[0]+(end[0]-start[0])*t,z:start[1]+(end[1]-start[1])*t},target={...p};
   ctx.physics.resolve(p,.32,floor,1.7);assert(Math.hypot(p.x-target.x,p.z-target.z)<.001,'beach blocks walking');
   const y=ctx.physics.groundHeight(p.x,p.z,floor,false);assert(y!==-Infinity&&floor-y<1.21,`beach ${s.id} has a fall/hole at ${p.x},${p.z}: ${floor} to ${y}`);floor=y;last=p;walkSteps++;
 }
 assert(ctx.physics.waterLevel(last.x,last.z)!==null,'shore path does not reach real sea water');walkRoutes++;
}
console.log({walkRoutes,walkSteps});
assert(walkRoutes>=20&&walkSteps>=1500,'land-to-sea walking routes missing');
let sailed=0;
// Straight crossings pass beneath the middle of each physical bridge span,
// through its real wet channel in both directions, with the full boat solver.
for(const s of ISLANDS){const p=s.bridge.pts,ds=[0];for(let i=2;i<p.length;i+=2)ds.push(ds.at(-1)+Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]));
 const mid=s.key==='russia'?31:s.key==='imperial'?24:46;let k=0;while(ds[k+1]<mid)k++;const dx=p[k*2+2]-p[k*2],dz=p[k*2+3]-p[k*2+1],len=ds[k+1]-ds[k],t=(mid-ds[k])/len,cx=p[k*2]+dx*t,cz=p[k*2+1]+dz*t,nx=-dz/len,nz=dx/len;
 for(const direction of [-1,1]){const x0=cx-nx*20*direction,z0=cz-nz*20*direction,boat=createBoatHandling(ctx);boat.reset(x0,z0,Math.atan2(nx*direction,nz*direction));let reached=false,hits=0,off=0;
  for(let frame=0;frame<900;frame++){boat.step(1/60,{thr:.55,brk:0,steer:0,hand:false});hits+=boat.events.filter(e=>e.type==='hit'||e.type==='scrape').length;if(ctx.physics.waterLevel(boat.x,boat.z)===null)off++;if((boat.x-cx)*nx*direction+(boat.z-cz)*nz*direction>=19){reached=true;break;}}
  assert(reached,`${s.key} boat blocked under footbridge (${direction}) at${boat.x},${boat.z}`);assert.equal(hits,0);assert.equal(off,0);sailed++;
 }
}
console.log({realBoatUnderBridgeRoutes:sailed,flagView:{water:L.waterLevelAt(-8840,-5580),terrain:L.heightAt(-8840,-5580)}});
assert.equal(sailed,6,'all three underpasses must be sailed in both directions');
assert.equal(L.waterLevelAt(-8840,-5580),null,'shore photo view moved into water');
console.log('RESULT: OK');
