// CPU coverage and real geometry/physics audit across every live area.
// node tools/fountain-coverage-test.mjs
// node tools/area.mjs moskovskaya tools/fountain-coverage-test.mjs --local
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { REGISTRY } from '../src/areas/registry.js';

if(!process.argv.includes('--local')){
  let total=0;const union=new Map();
  for(const area of Object.values(REGISTRY).filter(a=>!a.parked&&a.status!=='planned')){
    const run=spawnSync(process.execPath,['tools/area.mjs',area.id,'tools/fountain-coverage-test.mjs','--local','--report'],{encoding:'utf8',maxBuffer:5e6});
    assert.equal(run.status,0,`${area.id}: ${run.stdout}\n${run.stderr}`);
    for(const line of run.stdout.trim().split('\n')){
      if(!line.startsWith('COVERAGE_JSON ')){console.log(line);continue;}
      for(const r of JSON.parse(line.slice(14)))if(r.status!=='outside'){
        let row=union.get(r.id);if(!row)union.set(r.id,row={id:r.id,status:new Set(),areas:[]});row.status.add(r.status);row.areas.push(area.id);
      }
    }total++;
  }
  const unique=[...union.values()],fallback=unique.filter(r=>r.status.has('animated')).length,specialist=unique.filter(r=>r.status.has('specialist')).length;
  console.log(`Fountain coverage PASS: ${total} live areas; ${unique.length} unique in-play IDs, ${fallback} receive fallback in at least one area, ${specialist} receive specialist water in at least one area; zero unresolved/unanimated in-play sites or duplicate generic effects.`);
  process.exit(0);
}
const {buildWorld}=await import('./lib/headless-world.mjs');
const {placeFountains,mappedFountains,SPECIALIST_FOUNTAINS,NON_FOUNTAINS}=await import('../src/world/props/fountains.js');
const CITY=await import('../src/world/data/city.js');
const {mainModules}=await import('./modules-list.mjs');
const {ctx,L,THREE,errors}=await buildWorld({modules:[]});assert.deepEqual(errors,[]);
const {buildNet}=await import('../src/world/streets/net.js');
ctx.services.streets={net:buildNet(L)}; // Actual asphalt/fillets, not broad centre-line envelopes.
const state=()=>{const root=new THREE.Group();ctx.addStatic(root);return {ctx,root,svc:{},stats:{},tris:0,levelAt:()=>0};};
const S=state(),before=ctx._updates.length,coverage=placeFountains(S),sites=mappedFountains(CITY);
assert.equal(coverage.records.length,new Set(sites.map(f=>f.id)).size,'FOUNTAINS/WATER duplicate ID creates multiple entries');
assert.equal(ctx._updates.length-before,coverage.stats.animated?1:0,'fallback must share one spatial animation controller');
const effects=ctx.services.liveFountains?.records||[],effectIDs=new Set(effects.map(f=>f.id));
assert.equal(effectIDs.size,effects.length,'generic fountain effects have duplicate IDs');
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];S.root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)meshes.push(o);});
const ray=new THREE.Raycaster();ray.layers.enableAll();let waterProbes=0;
for(const record of coverage.records){
  const f=sites.find(f=>f.id===record.id);
  assert(record.status,`unresolved fountain ${f.id}`);
  assert.notEqual(record.status,'invalid-polygon',`invalid mapped fountain ${f.id}`);
  if(!L.inPlay(f.x,f.z)){assert.equal(record.status,'outside');continue;}
  if(SPECIALIST_FOUNTAINS[f.id]&&mainModules().includes(SPECIALIST_FOUNTAINS[f.id])){
    assert.equal(record.status,'specialist');assert.equal(record.owner,SPECIALIST_FOUNTAINS[f.id]);
    assert(!effects.some(e=>e.id.startsWith(`mapped-${f.id}-`)),'specialist fountain receives duplicate generic water');continue;
  }
  if(record.status==='alias'){
    const target=coverage.records.find(f=>f.id===record.alias);
    assert(target&&['animated','specialist'].includes(target.status),'mapped alias has no operating target');continue;
  }
  if(['not-fountain','playground'].includes(record.status)){assert(record.reason);continue;}
  assert.equal(record.status,'animated',`uncovered mapped fountain ${f.id}`);
  assert(record.effects.length,`fountain ${f.id} has no live water`);
  for(const effect of record.effects){
    assert(effectIDs.has(effect.id));
    for(const [x,z]of effect.points){
      assert.equal(ctx.physics.waterLevel(x,z),effect.y,`jet is not above registered native water: ${f.id}`);
      assert(!ctx.physics.columnBlocked(x,z,.05,effect.y+.04,effect.y+1.6),`fountain ${f.id} retains a blocking full-basin body`);
      // Actual authored front-facing water triangles cover each jet landing.
      if(effect.geometry==='basin'){
        ray.set(new THREE.Vector3(x,effect.y+.05,z),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObjects(meshes,false)[0];
        assert(hit&&Math.abs(hit.point.y-effect.y)<.02,`fountain ${f.id} has no drawn water below its spray`);
      } // A reused native waterway is drawn by environment in the normal scene.
      waterProbes++;
    }
  }
}
// Source holes and duplicate representations are tested with a synthetic
// concave basin, rather than relying on the current extract having a hole.
const origin=1000000,poly={o:[origin,origin,origin+16,origin,origin+16,origin+12,origin,origin+12],h:[[origin+5,origin+4,origin+5,origin+8,origin+11,origin+8,origin+11,origin+4]]};
const fixture={FOUNTAINS:[{id:'fixture',x:origin+2,z:origin+2,polys:[poly]}],WATER:[{id:'fixture',kind:'fountain',polys:[poly]}],FURNITURE:[]};
const localLayout={inPlay:()=>true,isOnRoad:()=>false,groupOf:()=>null},T=state(),fixtureCoverage=placeFountains(T,fixture,localLayout);
assert.equal(fixtureCoverage.records.length,1);assert.equal(fixtureCoverage.stats.animated,1);assert.equal(fixtureCoverage.stats.basins,1);
assert.equal(ctx.physics.waterLevel(origin+8,origin+6),null,'surveyed dry hole was filled with native water');
assert(!ctx.physics.columnBlocked(origin+2,origin+2,.2,.2,1.7),'fallback basin blocks wading');
ctx.staticRoot.updateMatrixWorld(true);const fixtureMeshes=[];T.root.traverse(o=>{if(o.isMesh)fixtureMeshes.push(o);});
ray.set(new THREE.Vector3(origin+8,1,origin+6),new THREE.Vector3(0,-1,0));
assert.equal(ray.intersectObjects(fixtureMeshes,false).length,0,'surveyed dry hole is covered by basin/water geometry');
for(const [x,z]of fixtureCoverage.records[0].effects[0].points)assert(x<=origin+5||x>=origin+11||z<=origin+4||z>=origin+8,'jet sprouts through the dry hole');
// Existing authored basins receive spray only; do not duplicate their stone,
// native water registry or colliders when a territory claim lacks live spray.
const U=state(),physicsBefore=ctx.physics.items.length,watersBefore=ctx.physics.waters.length;
const reused=placeFountains(U,{FOUNTAINS:[{id:'reuse',x:origin+2,z:origin+2,polys:[poly]}],WATER:[],FURNITURE:[]},localLayout);
assert.equal(reused.stats.basins,0);assert.equal(reused.stats.reused,1);
assert.equal(ctx.physics.items.length,physicsBefore);assert.equal(ctx.physics.waters.length,watersBefore);assert.equal(U.root.children.length,0);
const ignored=placeFountains(state(),{FOUNTAINS:[{id:Object.keys(NON_FOUNTAINS)[0],x:origin,z:origin,polys:[]}],WATER:[],FURNITURE:[]},localLayout);
assert.equal(ignored.records[0].status,'not-fountain','Latona niche sculpture acquired invented fountain water');
const originalStreets=ctx.services.streets;ctx.services.streets={net:{cover:()=>1}};
const flushState=state(),flushItems=ctx.physics.items.length,flushCoverage=placeFountains(flushState,{FOUNTAINS:[{id:'flush',x:origin+100,z:origin+100,polys:[]}],WATER:[],FURNITURE:[]},localLayout);
assert.equal(flushCoverage.records[0].effects[0].geometry,'flush');assert.equal(flushCoverage.records[0].status,'animated');
assert.equal(flushState.root.children.length,0,'road-touching fountain acquires invented raised basin/water geometry');
assert.equal(ctx.physics.items.length,flushItems,'flush fountain blocks an existing road with new masonry');ctx.services.streets=originalStreets;
const skips=coverage.records.filter(r=>['playground','not-fountain'].includes(r.status)).map(r=>`${r.id}:${r.status}`),flush=coverage.records.filter(r=>r.flush).map(r=>r.id);
console.log(`Fountain ${process.env.AREA}: ${coverage.stats.mapped} mapped,${coverage.stats.animated} fallback,${coverage.stats.specialist} specialist,${coverage.stats.aliases} aliases,${coverage.stats.outside} outside,${coverage.stats.triangles} static triangles,${waterProbes} mesh/native-water probes; flush ${flush.join(',')||'none'}; explicit skips ${skips.join(',')||'none'}.`);
if(process.argv.includes('--report'))console.log('COVERAGE_JSON '+JSON.stringify(coverage.records.map(({id,status,owner})=>({id,status,owner}))));
