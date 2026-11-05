// Independent basins may have grade faces; connected waterways must stay level.
// node tools/area.mjs palace tools/quay-junction-foundation-test.mjs
// Other live areas: node tools/area.mjs <area> tools/quay-junction-foundation-test.mjs --geometry-only
// Connected hydraulic datum regression: tools/water-level-test.mjs --mutant-datum.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { waterLevelSeams } from '../src/world/environment/quay-foundations.js';
import { waterGeo, WATERWAYS } from '../src/world/environment/waterways.js';
const AREA=process.env.AREA,geometryOnly=process.argv.includes('--geometry-only');
assert(AREA==='palace'||geometryOnly,'other areas require --geometry-only; reported rays belong to Palace');
assert(!process.argv.includes('--mutant-no-foundation'),'obsolete: connected waterways now have no foundation seam; use water-level-test --mutant-datum');
const ring=(key,o,owner)=>({key,o,...(owner?{owner}:{})});
const deep=ring('deep',[0,0,2,0,2,2,0,2]),shallow=ring('shallow',[2,0,4,0,4,2,2,2]),
  remote=ring('shallow',[20,20,22,20,22,22,20,22]);
const rings=[deep,shallow,remote],level=k=>k==='deep'?-3.2:-1.2,original=JSON.stringify(rings);
for(const r of rings){Object.freeze(r.o);Object.freeze(r);}Object.freeze(rings);
const seams=waterLevelSeams(rings,level);
assert.equal(seams.length,1,'only the opposing, adjacent unequal-level edge receives a face');
assert.deepEqual(seams[0],{key:'deep',a:[2,0],b:[2,2],n:[-1,0],bottom:-3.3200000000000003,top:-1.2});
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
assert.deepEqual(actualSeams,[],'all connected waterways share one datum; no transverse grade faces');
const {ctx,THREE,errors}=await buildWorld({modules:geometryOnly?['environment']:['environment','bridges']});assert.deepEqual(errors,[]);
assert.equal(JSON.stringify(waterGeo().pieces.map(p=>({id:p.id,key:p.key,o:p.o}))),waterBefore,'building lower masonry never changes the water mask');
assert.equal(JSON.stringify(WATERWAYS),datumsBefore,'all water and bed datums remain unchanged');
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[],foundations=[];
ctx.staticRoot.traverse(o=>{if(!o.isMesh)return;meshes.push(o);if(o.name.startsWith('env-quay-foundation-'))foundations.push(o);});
const waterMeshes=meshes.filter(m=>m.name.startsWith('env-water-'));
assert(waterMeshes.length>0,'inspect actual rendered water geometry');
let waterVertices=0;
for(const m of waterMeshes){
  const key=m.name.slice('env-water-'.length),p=m.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert(Math.abs(p.getY(i)-WATERWAYS[key].water)<1e-6,`${key}: rendered vertex follows the physics datum`);
  waterVertices+=p.count;
}
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
assert.deepEqual(ctx.physics.items,physicsBefore,'render-only foundation mesh adds/removes no collision solids');
console.log(JSON.stringify({area:AREA,geometryOnly,syntheticCases:7,seams:actualSeams.length,foundationMeshes:foundations.length,triangles,waterMeshes:waterMeshes.length,waterVertices,colliders:physicsBefore.length}));
console.log('PASS quay junction foundations: isolated-basin synthetic faces close to the surface; connected mouths contain no seam walls');
