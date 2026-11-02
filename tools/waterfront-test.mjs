import assert from 'node:assert/strict';
import {selectWaterfront,shoreSegments,rectDistance} from './lib/waterfront-selection.mjs';
import {waterfrontCoverage} from '../src/world/environment/waterfront-coverage.js';
import {REGISTRY} from '../src/areas/registry.js';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const box=(id,x,z,extra={})=>({id,cx:x,cz:z,polys:[{o:[x-5,z-5,x+5,z-5,x+5,z+5,x-5,z+5],h:[]}],...extra});
const segments=shoreSegments([{id:'r1114249',polys:[{o:[0,-1000,100,-1000,100,1000,0,1000],h:[]}]}]);
const play=[{x0:-200,x1:-20,z0:-100,z1:100}];
const near=box('near',135,0),inland=box('inland',500,0),far=box('far',135,2000),part=box('part',220,0,{parent:'near'}),underground=box('buried',130,0,{layer:-1});
const chosen=selectWaterfront({buildings:[near,inland,far,part,underground],existing:[],play,segments});
assert.deepEqual(chosen.map(b=>b.id),['near','part']);
assert(chosen.every(b=>b.waterfront));
assert.deepEqual(selectWaterfront({buildings:[near],existing:[near],play,segments}),[]);
assert.deepEqual(selectWaterfront({buildings:[far],existing:[],play:[{x0:-200,x1:-20,z0:4000,z1:4100}],segments}),[]);
const covered=waterfrontCoverage(chosen);assert(covered(135,0));assert(covered(220,0));assert(!covered(800,0));

let total=0;
for(const row of Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned')){
  const C=await import(pathToFileURL(path.resolve(row.remap['src/world/data/city.js'])).href);
  const W=await import(pathToFileURL(path.resolve(path.dirname(row.remap['src/world/data/city.js']),'waterfront.js')).href);
  assert.equal(new Set(C.BUILDINGS.map(b=>b.id)).size,C.BUILDINGS.length,row.id+' has no duplicate building IDs');
  assert.deepEqual(C.PLAY_RECTS,row.play.map(({x0,x1,z0,z1})=>({x0,x1,z0,z1})),row.id+' territory unchanged');
  assert(W.BUILDINGS.every(b=>b.waterfront),row.id+' supplement explicitly tagged');
  const ids=new Set(C.BUILDINGS.map(b=>b.id));
  assert(W.OVERLAPS.every(q=>ids.has(q.a)&&ids.has(q.b)),row.id+' overlaps only reference included buildings');
  for(const g of W.GROUPS)assert(g.ids.every(id=>ids.has(id)),row.id+' complete landmark: '+g.key);
  const A=await import(pathToFileURL(path.resolve(row.remap['src/world/area.js'])).href);
  for(const g of W.GROUPS)assert(!A.MODULES.includes(g.sourceModule),row.id+' no duplicate specialist owner');
  if(['moskovskaya','morskoy','semyonovsky'].includes(row.id))assert.equal(W.BUILDINGS.length,0,row.id+' no irrelevant river district');
  total+=W.BUILDINGS.length;
}
console.log(`waterfront: selection, families, coverage, 16 unchanged territories and ${total} unique supplemental records OK`);

// Run under area.mjs to verify both banks' specialist adapters and the existing
// city's exact physical / navigation records in a receiving area.
if(process.argv.includes('--geometry')){
  const {loadEngine,makeContext}=await import('./tauride/lib/stub-env.mjs');
  const E=await loadEngine(),A=await import('../src/world/area.js'),C=await import('../src/world/data/city.js');
  const city=await import('../src/world/city.js'),panorama=await import('../src/world/landmarksRiverfront.js');
  const before=makeContext(E,A.MODULES.filter(m=>m!=='landmarksRiverfront')).ctx;
  const all=C.BUILDINGS.slice(),local=all.filter(b=>!b.waterfront);
  C.BUILDINGS.splice(0,C.BUILDINGS.length,...local);await city.build(before);
  C.BUILDINGS.splice(0,C.BUILDINGS.length,...all);
  const after=makeContext(E,A.MODULES).ctx;await city.build(after);
  const shape=ctx=>ctx.physics.items.map(it=>Object.fromEntries(Object.entries(it).filter(([k,v])=>typeof v==='number'&&k!=='id')));
  assert.deepEqual(shape(after),shape(before),'existing wall collider positions, extents and heights remain exact');
  assert.deepEqual(after.services.city.entrances,before.services.city.entrances,'existing navigation doors remain exact');
  const remote=makeContext(E,['landmarksRiverfront']).ctx;await panorama.build(remote);
  assert.equal(remote.physics.items.length,0,'architectural panorama adds no collision objects');
  assert.equal(remote._updates.length,0,'architectural panorama adds no frame callbacks');
  assert.deepEqual(Object.keys(remote.services),['landmarksRiverfront'],'panorama publishes no navigation / crowd service');
  let finite=0;remote.staticRoot.traverse(m=>{if(m.isMesh){assert(Number.isFinite(m.userData.lodFar),'every mesh has a finite authored range');finite++;}});
  assert(finite>0);console.log(`geometry: ${finite} bounded meshes, ${remote.services.landmarksRiverfront.triangles} triangles, no added colliders/doors; existing ${after.physics.items.length} colliders and ${after.services.city.entrances.length} doors unchanged`);
}
