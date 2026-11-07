// Fast isolated regression of actual paving meshes against independent OSM
// pool/lawn samples. No environment, full city, browser, GPU or bake required.
// node tools/area.mjs moskovskaya tools/moskovskaya-square-paving-test.mjs
// --mutant-pool-fill adds the former blanket surface and must fail.
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import * as CITY from '../src/world/data/city.js';
import {makeKit} from '../src/world/landmarksMoskovskaya/common.js';
import {squareForecourt} from '../src/world/landmarksMoskovskaya/soviets-square.js';
import {MOSCOW_SQUARE_FIELD_RING} from '../src/world/landmarksMoskovskaya/soviets-square-plan.js';

assert.equal(process.env.AREA,'moskovskaya','run through tools/area.mjs moskovskaya');
const basinIds=['r7369984','w74201757','w74201759','w91838567','w91838574','w110521204','w110521205','w110521206','w110521207','w110521208'];
const pools=basinIds.flatMap(id=>{
  const f=CITY.FOUNTAINS.find(f=>f.id===id);assert(f?.polys.length,'surveyed fountain has no basin '+id);
  return f.polys.map((p,i)=>({...p,key:id+':'+i}));
});
assert.equal(pools.length,11,'the two main rectangles and nine other basins remain distinct');
const inRing=(x,z,r)=>{let yes=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2)if((r[i+1]>z)!==(r[j+1]>z)&&x<(r[j]-r[i])*(z-r[i+1])/(r[j+1]-r[i+1])+r[i])yes=!yes;return yes;};
const inPoly=(x,z,p)=>inRing(x,z,p.o)&&!(p.h||[]).some(h=>inRing(x,z,h));
const area=r=>{let sum=0;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2)sum+=r[j]*r[i+1]-r[i]*r[j+1];return Math.abs(sum)/2;};
const pairs=r=>Array.from({length:r.length/2},(_,i)=>[r[i*2],r[i*2+1]]);
const greens=CITY.GREEN.filter(g=>['grass','wood','scrub','garden','flowerbed'].includes(g.kind)).flatMap(g=>g.polys.map(p=>({...p,id:g.id}))).filter(p=>p.o.some((x,i)=>!(i%2)&&x>=-1647&&x<=-1497&&p.o[i+1]>=8825&&p.o[i+1]<=9060));
const {ctx,THREE,errors}=await buildWorld({modules:[]});assert.deepEqual(errors,[]);
const root=new THREE.Group(),svc={parts:{},triangles:0},K=makeKit(ctx,root,svc);
const updates=ctx._updates.length,colliders=ctx.physics.items.length,waters=ctx.physics.waters.length;
K.begin();squareForecourt(K);
if(process.argv.includes('--mutant-pool-fill'))K.body.cap(K.mats.granite,pairs(pools[0].o),.145);
K.flush('soviets-square');root.updateMatrixWorld(true);
assert.equal(ctx._updates.length,updates,'paving must not add frame work');
assert.equal(ctx.physics.items.length,colliders,'visual pavers/lawns must not add collision surfaces');
assert.equal(ctx.physics.waters.length,waters,'generic fountain water must retain its separate owner');
assert(svc.triangles>100&&svc.triangles<15000,'formal square stays within its static geometry budget');
const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let drawnArea=0;
for(const mesh of meshes){
  assert(!mesh.userData.noBatch,'square geometry must remain eligible for normal static batching');
  assert(Number.isFinite(mesh.userData.lodFar),'square surface must have a finite authored range');
  const p=mesh.geometry.attributes.position,idx=mesh.geometry.index;
  for(let i=0;i<p.count;i++){
    assert(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)),'all drawn positions must be finite');
    assert(Math.abs(p.getY(i)-.145)<1e-5||Math.abs(p.getY(i)-.15)<1e-5,'no raised stone platform may replace the visual field');
  }
  for(let i=0;i<(idx?.count||p.count);i+=3){
    a.fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(p,idx?idx.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(p,idx?idx.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
    drawnArea+=Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))/2;
  }
}
// Independent shoelace area of the surveyed outer boundary minus real source
// pools must equal the projected area of actual rendered triangles. Duplicate
// coplanar lawn layers and filled or missing regions change this total.
const expectedArea=area(MOSCOW_SQUARE_FIELD_RING)-pools.reduce((n,p)=>n+area(p.o)-(p.h||[]).reduce((s,h)=>s+area(h),0),0);
assert(Math.abs(drawnArea-expectedArea)<1,'drawn paving/lawn topology does not reconcile with surveyed field minus eleven pool holes');
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),wetBasins=new Set(),greenBeds=new Set();
let pavingProbes=0,lawnProbes=0,waterProbes=0;
function probe(x,z){
  if(!inRing(x,z,MOSCOW_SQUARE_FIELD_RING))return;
  ray.set(new THREE.Vector3(x,.5,z),down);const hits=ray.intersectObjects(meshes,false);
  const wet=pools.find(p=>inPoly(x,z,p));
  if(wet){assert.equal(hits.length,0,'paving covers mapped reachable fountain water at '+x+','+z);wetBasins.add(wet.key);waterProbes++;return;}
  assert(hits.length,'authored formal floor has a gap at '+x+','+z);
  const beds=greens.filter(g=>inPoly(x,z,g)),y=beds.length?.15:.145;
  assert(Math.abs(hits[0].point.y-y)<1e-5,'drawn lawn/paving boundary disagrees with actual mapped green beds at '+x+','+z);
  if(beds.length){lawnProbes++;for(const g of beds)greenBeds.add(g.id);}else pavingProbes++;
}
for(let x=-1646.1;x<-1497.5;x+=2.15)for(let z=8825.8;z<9059;z+=2.15)probe(x,z);
// Additional triangle-interior probes exercise the small surveyed shrub/wood
// and two-metre grass beds that the coarse square grid can pass between.
for(const g of greens){
  const contour=pairs(g.o).map(p=>new THREE.Vector2(...p)),holes=(g.h||[]).map(h=>pairs(h).map(p=>new THREE.Vector2(...p))),vertices=[...contour,...holes.flat()];
  let candidates=0;
  for(const tri of THREE.ShapeUtils.triangulateShape(contour,holes)){
    const x=tri.reduce((n,i)=>n+vertices[i].x/3,0),z=tri.reduce((n,i)=>n+vertices[i].y/3,0);
    if(!inRing(x,z,MOSCOW_SQUARE_FIELD_RING)||pools.some(p=>inPoly(x,z,p)))continue;
    probe(x,z);candidates++;
  }
  if(candidates)assert(greenBeds.has(g.id),'a surveyed lawn/wood/shrub bed lost its drawn surface '+g.id);
}
assert.equal(wetBasins.size,11,'independent rays must exercise every individual water hole');
assert(greenBeds.size>=20,'independent samples must exercise the surveyed small green beds');
assert(pavingProbes>4000&&lawnProbes>1400&&waterProbes>900,'audit must sample substantial actual geometry');
console.log(JSON.stringify({triangles:svc.triangles,pavingProbes,lawnProbes,waterProbes,basins:wetBasins.size,mappedGreenBeds:greenBeds.size,drawnArea,expectedArea,callbacks:ctx._updates.length-updates,colliders:ctx.physics.items.length-colliders}));
console.log('PASS formal square meshes, eleven reachable pool holes, mapped lawns, exact surface area and bounded static cost.');
