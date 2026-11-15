// Data equality, exact holes/margins and composed area-hook regressions.
// node tools/fountain-planting-test.mjs [--baseline shots/fountain-refresh/tree-interiors/summary.json]
// The optional baseline contains actual environment geometry/trunk findings.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';
import { makeFountainKeepout,withFountainKeepouts } from '../src/areas/fountain-keepout.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),importFile=relative=>import(pathToFileURL(path.join(root,relative)).href);
const fixture=[{id:'donut',polys:[{o:[0,0,20,0,20,20,0,20],h:[[6,6,6,14,14,14,14,6]]}]},{id:'point',x:50,z:50,polys:[]}];
const mask=makeFountainKeepout(fixture);
assert(mask(2,2));assert(!mask(10,10),'dry fountain island loses its planting');
assert(mask(6.5,10,.75));assert(!mask(6.5,10,.25),'tuft keepout expands across a dry island');
assert(mask(20.5,10,.75));assert(!mask(20.8,10,.75));assert(!mask(25,25));
assert(mask(52,50,.75));assert(!mask(52.2,50,.75),'point fountain clears unrelated planting');
const original={treeReject:ctx=>(x,z)=>x===99?'prior-tree':null,tuftReject:ctx=>(x,z)=>z===99,parkingReject:()=>false,inGarden:()=>true,deckServices:['unchanged'],groundHoles:()=>[[1,2,3,4,5,6]]};
const composed=withFountainKeepouts(original,fixture);
assert.equal(composed.treeReject({})(99,0),'prior-tree');assert(composed.tuftReject({})(0,99));
assert.equal(composed.treeReject({})(2,2),'fountain');assert(composed.tuftReject({})(2,2));
for(const key of Object.keys(original).filter(k=>!['treeReject','tuftReject'].includes(k)))assert.equal(composed[key],original[key],`unrelated hook changed: ${key}`);

const areas=new Map();let sites=0;
for(const row of Object.values(REGISTRY).filter(a=>!a.parked&&a.status!=='planned')){
  const dataFile=`src/areas/${row.id}/fountain-rings.js`;if(!fs.existsSync(path.join(root,dataFile)))continue;
  const {FOUNTAIN_SITES}=await importFile(dataFile),city=await importFile(row.remap['src/world/data/city.js']),area=await importFile(row.remap['src/world/area.js']);
  const ids=new Set([...city.FOUNTAINS,...city.WATER.filter(f=>f.kind==='fountain')].map(f=>f.id));
  assert.deepEqual(new Set(FOUNTAIN_SITES.map(f=>f.id)),ids,`${row.id}: mapped site IDs omitted or duplicated`);
  assert.equal(FOUNTAIN_SITES.length,ids.size,`${row.id}: duplicate mask records`);
  for(const f of FOUNTAIN_SITES){
    const sources=[...city.FOUNTAINS,...city.WATER.filter(w=>w.kind==='fountain')].filter(w=>w.id===f.id),polygonSource=sources.find(w=>w.polys?.length);
    assert.deepEqual(f.polys,polygonSource?.polys||[],`${row.id}/${f.id}: exact polygon or dry hole changed`);
    if(!f.polys.length){const point=sources.find(w=>Number.isFinite(w.x));assert.equal(f.x,point.x);assert.equal(f.z,point.z);}
  }
  assert.equal(typeof area.HOOKS.treeReject,'function');assert.equal(typeof area.HOOKS.tuftReject,'function');
  areas.set(row.id,{sites:FOUNTAIN_SITES,hooks:area.HOOKS,modules:area.MODULES,mask:makeFountainKeepout(FOUNTAIN_SITES)});sites+=FOUNTAIN_SITES.length;
}
assert.equal(areas.size,11,'every area with measured fountain/tree intrusions must retain its keepout');
let baselineProbes=0;
const baselineIndex=process.argv.indexOf('--baseline');
if(baselineIndex>=0){
  const baseline=JSON.parse(fs.readFileSync(path.resolve(process.argv[baselineIndex+1]),'utf8'));
  for(const finding of baseline.findings){
    const a=areas.get(finding.area);assert(a,`no fountain planting hook in affected area ${finding.area}`);
    const {x,z}=finding.tree,tree=a.hooks.treeReject({buildList:a.modules});
    assert(tree(x,z),`${finding.area}/${finding.site}: measured trunk survives the actual area hook`);
    assert(a.mask(x,z,.75),`${finding.area}/${finding.site}: measured trunk not covered by fountain mask`);baselineProbes++;
  }
  assert.equal(baselineProbes,38,'all measured environment trunk/site/area overlaps enter the regression');
}
console.log(`Fountain planting PASS: ${areas.size} affected areas,${sites} exact source-site masks,${baselineProbes} actual baseline trunk positions rejected; dry holes,inner/outer trunk margins,point extents and all prior hooks preserved.`);
