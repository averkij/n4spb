// Real natural-bank meshes, terrain and two-way walking; no GPU.
// node tools/area.mjs <area> tools/natural-bank-test.mjs [--mutant-flat]
// The mutant restores the old flat invisible bank floor and must fail.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorld } from './lib/headless-world.mjs';
import { slopeRuns, slopeSurfaces, WATERWAYS, pointInFlat } from '../src/world/environment/waterways.js';
import { WATER } from '../src/world/data/city.js';
import { Player } from '../src/core/player.js';
const {ctx,L,THREE,errors}=await buildWorld({});
assert.deepEqual(errors,[]);
const ph=ctx.physics,surfaces=slopeSurfaces(),runs=slopeRuns();
// End caps close the dry bank only. Extending the submerged shelf to street
// height creates a freestanding wall across open water at each run endpoint.
for(const s of surfaces.filter(s=>s.kind==='cap'))assert(
  s.points.every(p=>p[1]>=WATERWAYS[s.key].water-.12-1e-6),
  'bank end cap rises from the underwater shelf: '+s.bank.id);
if(process.argv.includes('--mutant-flat'))ph.heightAt=(x,z)=>{const k=L.waterwayAt(x,z);return k?WATERWAYS[k].bed:0;};
ctx.staticRoot.updateMatrixWorld(true);
const mesh=[];ctx.staticRoot.traverse(o=>{if(o.isMesh&&/^env-quay-(grass|coping-|submerged-bank)/.test(o.name))mesh.push(o);});
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
ray.layers.enableAll(); // submerged surfaces deliberately have no black outlines
let triangles=0,drawProbes=0,maxError=0;
for(const s of surfaces){if(!s.walk)continue;
  for(const ids of [[0,1,2],[0,2,3]]){
    const p=ids.map(i=>s.points[i]),x=p.reduce((a,p)=>a+p[0],0)/3,z=p.reduce((a,p)=>a+p[2],0)/3,y=p.reduce((a,p)=>a+p[1],0)/3;
    // At a mitred corner the neighbouring strip can cover this lower face;
    // physical ground must match the top visible surface, not a hidden one.
    assert(L.heightAt(x,z)>=y-.002,`missing bank floor ${s.bank.id} at ${x},${z}`);
    const floor=ph.surfaceAt(x,z,10,false,{});
    if(floor.kind==='terrain')assert.equal(floor.y,L.heightAt(x,z),`no phantom flat terrain above the drawn slope ${s.bank.id} ${x},${z}`);
    if(triangles++%29)continue;
    ray.set(new THREE.Vector3(x,5,z),down);const hit=ray.intersectObjects(mesh,false)[0];
    assert(hit,`front-facing bank surface missing ${s.bank.id} ${s.kind} at ${x},${z}: ${JSON.stringify(s.points)}`);
    const err=Math.abs(hit.point.y-L.heightAt(x,z));maxError=Math.max(maxError,err);
    assert(err<.025,`render/terrain disagree ${s.bank.id} ${x},${z}: mesh${hit.point.y} terrain${L.heightAt(x,z)}`);drawProbes++;
  }
}
let closed=0;for(const r of runs)if(r.closed){const a=r.fr[0],b=r.fr.at(-1);assert(Math.hypot(a.mx*a.k-b.mx*b.k,a.mz*a.k-b.mz*b.k)<1e-8,'closed bank has two different joins');closed++;}

const touched=new Set(),routes=[];let rejected=0,steps=0;
const at=(q,d)=>[q.x+q.mx*q.k*d,q.z+q.mz*q.k*d];
function pondAt(x,z){return WATER.find(w=>w.polys?.some(p=>pointInFlat(x,z,p.o)&&!p.h.some(h=>pointInFlat(x,z,h))));}
function move(start,end){
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(start[0],start[1],0,0);
  p.keys.add('KeyW');let minY=p.pos.y,rescues=0;p.onRescue=()=>rescues++;
  for(let f=0;f<1200;f++){
    const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z;if(Math.hypot(dx,dz)<.14)break;
    p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);steps++;minY=Math.min(minY,p.pos.y);
  }
  p.keys.clear();p.vel.set(0,0,0);for(let f=0;f<60;f++){p.time+=1/60;p.update(1/60);minY=Math.min(minY,p.pos.y);}
  assert.equal(rescues,0,'shore traversal triggers a fall rescue');
  assert(minY>Math.min(...Object.values(WATERWAYS).map(w=>w.bed))-.1,'walker falls below scene');
  assert(Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z)<.2,`cannot traverse bank ${start} -> ${end}; reached ${p.pos.x},${p.pos.y},${p.pos.z}`);
  assert(Math.abs(p.pos.y-L.heightAt(p.pos.x,p.pos.z))<.09,`walker floats above/below visible bank at ${p.pos.x},${p.pos.z}: feet${p.pos.y},terrain${L.heightAt(p.pos.x,p.pos.z)},support${p.supportItem?.type}`);
  return p;
}
for(const r of runs){for(let i=0;i+1<r.fr.length;i++){
  const a=r.fr[i],b=r.fr[i+1],q={x:(a.x+b.x)/2,z:(a.z+b.z)/2,mx:(a.mx*a.k+b.mx*b.k)/2,mz:(a.mz*a.k+b.mz*b.k)/2,k:1};
  const {water,bed}=WATERWAYS[r.reach.key],shelf=Math.max(3,(water-bed)*2.5),land=at(q,r.reach.run+.7),wet=at(q,-shelf-.5);
  if(!L.inPlay(...land)||!L.inPlay(...wet)||ph.waterLevel(...land)!==null||ph.waterLevel(...wet)===null)continue;
  const pond=pondAt(...wet),id=pond?.id||r.reach.id;
  if(touched.has(id)&&routes.filter(q=>q.id===id).length>=4)continue;
  let clear=true;
  for(let t=0;t<=1.0001;t+=.025){const x=land[0]+(wet[0]-land[0])*t,z=land[1]+(wet[1]-land[1])*t,y=L.heightAt(x,z);if(ph.columnBlocked(x,z,.33,y,1.7)||L.insideBuilding(x,z,.33)){clear=false;break;}}
  if(!clear){rejected++;continue;}
  const outward=move(land,wet);assert(ph.waterLevel(outward.pos.x,outward.pos.z)!==null,'walk never enters water');
  const inward=move(wet,land);assert.equal(ph.waterLevel(inward.pos.x,inward.pos.z),null,'walk cannot leave water');
  routes.push({id,bank:r.bank.id,land,wet});touched.add(id);
}}
if(process.env.AREA==='moskovskaya')for(const id of ['r77680','r109994','r11008649','r11010469','r147758','r1380826','r11010790','r11014824','r11016386'])assert(touched.has(id),'no two-way real walk tested for park pond '+id);
const json=process.argv.indexOf('--json');if(json>=0)fs.writeFileSync(process.argv[json+1],JSON.stringify({routes},null,2));
console.log(JSON.stringify({area:process.env.AREA,runs:runs.length,closed,triangles,drawProbes,maxRenderError:maxError,routes:routes.length,ponds:[...touched],rejectedForRealStructure:rejected,walkingSteps:steps}));
console.log('PASS natural-bank geometry, terrain, closed seams and actual two-way walking');
