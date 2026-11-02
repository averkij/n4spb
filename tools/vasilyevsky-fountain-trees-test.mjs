// Pure mask/hook regressions plus optional real environment tree/tuft build.
// node tools/area.mjs vasilyevsky tools/vasilyevsky-fountain-trees-test.mjs --integrated
// --mutant restores the former area hooks and must expose basin intruders.
import assert from 'node:assert/strict';
import { FOUNTAIN_SITES } from '../src/areas/vasilyevsky/fountain-rings.js';
import { makeFountainKeepout,withFountainKeepouts } from '../src/areas/fountain-keepout.js';
import { HOOKS,MODULES } from '../src/areas/vasilyevsky/area.js';
import { makeHooks } from '../src/areas/north/hooks.js';
import * as CITY from '../src/areas/vasilyevsky/data/city.js';

const expected=new Map();
for(const f of[...CITY.FOUNTAINS,...CITY.WATER.filter(w=>w.kind==='fountain')]){
  const old=expected.get(f.id);expected.set(f.id,{id:f.id,x:f.x??old?.x,z:f.z??old?.z,polys:f.polys?.length?f.polys:old?.polys||[]});
}
assert.deepEqual(FOUNTAIN_SITES,JSON.parse(JSON.stringify([...expected.values()])),'area fountain planting masks drifted from exact source rings/holes');
const fixture=[{id:'donut',polys:[{o:[0,0,20,0,20,20,0,20],h:[[6,6,6,14,14,14,14,6]]}]},{id:'point',x:50,z:50,polys:[]}];
const mask=makeFountainKeepout(fixture);
assert(mask(2,2));assert(!mask(10,10),'dry fountain island loses its planting');
assert(mask(6.5,10,.75),'trunk margin does not clear the inner basin edge');assert(!mask(6.5,10,.25),'tuft keepout expands across a dry island');
assert(mask(20.5,10,.75));assert(!mask(20.8,10,.75));assert(!mask(25,25));
assert(mask(52,50,.75));assert(!mask(52.2,50,.75),'point fountain clears unrelated planting');
const oldTree=ctx=>(x,z)=>x===99?'prior-tree':null,oldTuft=ctx=>(x,z)=>z===99,oldParking=()=>false,oldGarden=()=>true;
const composed=withFountainKeepouts({treeReject:oldTree,tuftReject:oldTuft,parkingReject:oldParking,inGarden:oldGarden},fixture);
assert.equal(composed.treeReject({})(99,0),'prior-tree');assert(composed.tuftReject({})(0,99));
assert.equal(composed.parkingReject,oldParking);assert.equal(composed.inGarden,oldGarden);
const realMask=makeFountainKeepout(FOUNTAIN_SITES),tree=HOOKS.treeReject({buildList:MODULES}),tuft=HOOKS.tuftReject({buildList:MODULES});
assert.equal(tree(-5198,-2072.2),'fountain');assert(tuft(-5198,-2072.2));
assert(!realMask(-5190,-2072.2),'fountain keepout expands across unrelated courtyard trees');
let actualTrees=0,tuftProbes=0;
if(process.argv.includes('--integrated')){
  assert.equal(process.env.AREA,'vasilyevsky','integrated test needs the Vasilyevsky import-map remap');
  if(process.argv.includes('--mutant')){
    const before=makeHooks(MODULES);HOOKS.treeReject=before.treeReject;HOOKS.tuftReject=before.tuftReject;
  }
  const {buildWorld}=await import('./lib/headless-world.mjs');
  const {mainModules}=await import('./modules-list.mjs');
  const {ctx,errors}=await buildWorld({modules:[]});assert.deepEqual(errors,[]);ctx.buildList=mainModules();
  const environment=await import('../src/world/environment.js');await environment.build(ctx);
  const bad=ctx.services.environment.trees.filter(t=>realMask(t.x,t.z,Math.max(.25,t.tr)));
  assert.deepEqual(bad.map(t=>({x:t.x,z:t.z,sp:t.sp,tr:t.tr})),[],'actual environment stems intersect mapped fountain water');
  actualTrees=ctx.services.environment.trees.length;
  // Exercise the dynamic tuft writer at the photographed basin; checking
  // actual matrix origins catches a missing hook call in the live/cache path.
  ctx.camera.position.set(-5198,3,-2072.2);
  for(const fn of ctx._updates)fn(1/60,20);
  const tufts=[];ctx.scene.traverse(o=>{if(o.isInstancedMesh&&/tuft/i.test(o.name))tufts.push(o);});
  assert(tufts.length,'integrated environment exposes no grass-tuft instance mesh');
  const mat=new ctx.THREE.Matrix4();
  for(const mesh of tufts)for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,mat);const x=mat.elements[12],z=mat.elements[14];
    assert(!realMask(x,z,.25),`actual tuft grows through fountain water at ${x},${z}`);tuftProbes++;
  }
}
console.log(`Vasilyevsky fountain planting PASS: ${FOUNTAIN_SITES.length} exact mapped sites, dry-hole/trunk-margin/hook-composition regressions, ${actualTrees} actual environment stems and ${tuftProbes} live tuft matrices checked.`);
