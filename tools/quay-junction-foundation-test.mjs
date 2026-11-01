// Different water datums expose a vertical grade face at their shared edge.
// node tools/area.mjs palace tools/quay-junction-foundation-test.mjs
// Other live areas: node tools/area.mjs <area> tools/quay-junction-foundation-test.mjs --geometry-only
// --mutant-no-foundation removes the actual repair mesh and must fail.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { waterLevelSeams } from '../src/world/environment/quay-foundations.js';
import { waterGeo, WATERWAYS } from '../src/world/environment/waterways.js';
const AREA=process.env.AREA,geometryOnly=process.argv.includes('--geometry-only');
assert(AREA==='palace'||geometryOnly,'other areas require --geometry-only; reported rays belong to Palace');
assert(!geometryOnly||!process.argv.includes('--mutant-no-foundation'),'the reported-hole mutation requires Palace ray assertions');
const ring=(key,o,owner)=>({key,o,...(owner?{owner}:{})});
const deep=ring('deep',[0,0,2,0,2,2,0,2]),shallow=ring('shallow',[2,0,4,0,4,2,2,2]),
  remote=ring('shallow',[20,20,22,20,22,22,20,22]);
const rings=[deep,shallow,remote],level=k=>k==='deep'?-3.2:-1.2,original=JSON.stringify(rings);
for(const r of rings){Object.freeze(r.o);Object.freeze(r);}Object.freeze(rings);
const seams=waterLevelSeams(rings,level);
assert.equal(seams.length,1,'only the opposing, adjacent unequal-level edge receives a face');
assert.deepEqual(seams[0],{key:'deep',a:[2,0],b:[2,2],n:[-1,0],bottom:-3.3200000000000003,top:-1.3199999999999998});
assert.equal(JSON.stringify(rings),original,'classification never changes the water polygons');
const reverse=o=>{const pairs=[];for(let i=0;i<o.length;i+=2)pairs.push(o.slice(i,i+2));return pairs.reverse().flat();};
const reversed=waterLevelSeams(rings.map(r=>({...r,o:reverse(r.o)})),level);
assert.equal(reversed.length,1,'either ring winding is supported');
assert.deepEqual(reversed[0].a,[2,2]);assert.deepEqual(reversed[0].b,[2,0]);
assert.equal(reversed[0].n[0],-1);assert(Math.abs(reversed[0].n[1])<1e-10);
assert.deepEqual(waterLevelSeams(rings,()=>-1.2),[],'equal-level navigable joins stay open');
assert.deepEqual(waterLevelSeams([deep,remote],level),[],'an unrelated island generates no transverse face');
assert.deepEqual(waterLevelSeams([deep,ring('shallow',deep.o)],level),[],'overlapping same-interior rings are not a grade seam');
assert.deepEqual(waterLevelSeams([deep,{...shallow,owner:'landmark'}],level),[],'landmark-owned water remains with its owner');

const waterBefore=JSON.stringify(waterGeo().pieces.map(p=>({id:p.id,key:p.key,o:p.o}))),datumsBefore=JSON.stringify(WATERWAYS);
const actualSeams=waterLevelSeams(waterGeo().rings,k=>WATERWAYS[k].water);
assert(actualSeams.every(s=>s.bottom===WATERWAYS[s.key].water-.12&&s.top>s.bottom),'each seam spans only the positive difference between water datums');
const {ctx,THREE,errors}=await buildWorld({modules:geometryOnly?['environment']:['environment','bridges']});assert.deepEqual(errors,[]);
assert.equal(JSON.stringify(waterGeo().pieces.map(p=>({id:p.id,key:p.key,o:p.o}))),waterBefore,'building lower masonry never changes the water mask');
assert.equal(JSON.stringify(WATERWAYS),datumsBefore,'all water and bed datums remain unchanged');
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[],foundations=[];
ctx.staticRoot.traverse(o=>{if(!o.isMesh)return;meshes.push(o);if(o.name.startsWith('env-quay-foundation-'))foundations.push(o);});
assert.equal(foundations.length>0,actualSeams.length>0,'actual mesh presence matches the classified unequal-level seams');
let triangles=0;
for(const m of foundations){
  assert.equal(m.material.side,THREE.FrontSide,'do not hide missing/reversed faces with double-sided material');
  assert(!m.layers.isEnabled(0),'lower foundation is excluded from black outlines');
  const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,ix=m.geometry.index;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3(),normal=new THREE.Vector3();
  for(let i=0;i<ix.count;i+=3){
    const vs=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];a.fromBufferAttribute(p,vs[0]);b.fromBufferAttribute(p,vs[1]);c.fromBufferAttribute(p,vs[2]);
    cross.crossVectors(b.sub(a),c.sub(a));assert(cross.lengthSq()>1e-12,'foundation contains no degenerate triangles');
    normal.set(0,0,0);for(const v of vs)normal.add(new THREE.Vector3().fromBufferAttribute(n,v));
    assert(cross.dot(normal)>0,'actual face winding agrees with the outward shoreline normal');
    assert(Math.abs(cross.clone().normalize().y)<1e-5,'foundation follows a vertical existing shoreline, not a horizontal water plug');triangles++;
  }
}
assert.equal(triangles,actualSeams.length*2,'actual renderer emits exactly one vertical quad per datum seam');
const physicsBefore=ctx.physics.items.slice();
if(process.argv.includes('--mutant-no-foundation'))for(const m of foundations)m.removeFromParent();
const targets=process.argv.includes('--mutant-no-foundation')?meshes.filter(m=>!foundations.includes(m)):meshes;
const camera=new THREE.PerspectiveCamera(62,1280/720,.1,7000),ray=new THREE.Raycaster();ray.layers.enableAll();
camera.rotation.set(0,426.2*Math.PI/180,0,'YXZ');
let coverage=0;const rays=[];
if(!geometryOnly){
// These are the exact two formerly empty screenshot rays (1280x720), plus
// neighbouring eye heights. They hit two separate heights below moat toe -1.32.
for(const eye of [1.40,1.50,1.60])for(const pixel of [[420,480],[410,520]]){
  camera.position.set(-605.7,eye,-858.6);camera.updateMatrixWorld(true);
  ray.setFromCamera(new THREE.Vector2(pixel[0]/640-1,1-pixel[1]/360),camera);
  const hit=ray.intersectObjects(targets,false)[0];
  assert(hit?.object.name.startsWith('env-quay-foundation-'),`reported lower hole must hit real front-sided foundation at eye ${eye},pixel ${pixel}; got ${hit?.object.name||'no face'}`);
  assert(hit.point.y<-1.32-.05&&hit.point.y>-3.32-.01,'coverage is below the old shallow toe and above the deep neighbour toe');
  assert(hit.face.normal.dot(ray.ray.direction)<0,'repair is visible from its actual exposed water side');
  rays.push({eye,pixel,position:hit.point.toArray(),mesh:hit.object.name});coverage++;
}
for(const pixel of [[360,480],[480,480]]){
  camera.position.set(-605.7,1.5,-858.6);camera.updateMatrixWorld(true);ray.setFromCamera(new THREE.Vector2(pixel[0]/640-1,1-pixel[1]/360),camera);
  assert(ray.intersectObjects(targets,false)[0]?.object.name==='env-quay-wall-fontanka','neighbouring original Fontanka wall remains visible');
}
}
assert.deepEqual(ctx.physics.items,physicsBefore,'render-only foundation mesh adds/removes no collision solids');
console.log(JSON.stringify({area:AREA,geometryOnly,syntheticCases:7,seams:actualSeams.length,foundationMeshes:foundations.length,triangles,reportedRays:coverage,colliders:physicsBefore.length,rays}));
console.log('PASS quay junction foundations: lower exposed face, outward normals and unchanged hydraulic geometry');
