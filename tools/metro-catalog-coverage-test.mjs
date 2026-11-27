// node tools/metro-catalog-coverage-test.mjs audits every live page. The area
// runner also supports checking one page, e.g. node tools/area.mjs kronverk tools/metro-catalog-coverage-test.mjs.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';

const script=fileURLToPath(import.meta.url), root=fileURLToPath(new URL('../',import.meta.url));
const area=process.env.AREA;
if(!area) {
  const rows=new Map(),cuts=Object.values(REGISTRY).filter(c=>!c.parked && !c.dev);
  for(const cut of cuts) {
    const out=execFileSync(process.execPath,['tools/area.mjs',cut.id,script],{cwd:root,encoding:'utf8'});
    const report=JSON.parse(out.trim());
    for(const [id,kind,play] of report) {
      const prev=rows.get(id);
      assert(!prev||prev.kind===kind,id+' changes classification on '+cut.id);
      rows.set(id,{kind,play:play||prev?.play||false});
    }
  }
  const count=kind=>[...rows.values()].filter(r=>r.kind===kind).length;
  assert.equal(cuts.length,21);assert.equal(rows.size,142);
  assert.equal(count('surface'),128);assert.equal(count('inside'),5);
  assert.equal(count('underground'),8);assert.equal(count('closed'),1);
  assert.equal([...rows.values()].filter(r=>!r.play).length,1);
  console.log('21 pages, 142 distinct OSM markers: 128 exterior (127 in play), 5 interior, 8 below street, 1 closed.');
}else{
  const {buildWorld}=await import('./lib/headless-world.mjs');
  const {mainModules}=await import('./modules-list.mjs');
  const {ENTRANCES}=await import('../src/world/data/city.js');
  // Run the page's real builders in page order. Roads, crowd simulation and
  // terrain are exercised separately in the actual passage/steps playtests.
  const owners=new Set(['props','landmarksAvtovoMetro','landmarksBaltic','landmarksAndrew','landmarksFinlyandskyStation',
    'landmarksKamennoostrovsky','landmarksKronverk','landmarksKrestovsky','landmarksMakarova','landmarksNorthFull',
    'landmarksPrimorskaya','landmarksSredny']);
  const {ctx,errors,L}=await buildWorld({modules:mainModules().filter(m=>owners.has(m))});
  assert.deepEqual(errors,[]);
  const s=ctx.services,doors=s.metroPavilionDoors||[],central=s.centralMetroEntrances||{};
  const all=[...doors,...(s.regionalUnderpasses||[]),...(central.doors||[]),...(central.pits||[])];
  const runtime=new Set(all.flatMap(d=>[d.id,d.osm].filter(Boolean)));
  const authored={
    n808071410:['nevsky-pit-4'],n808071481:['nevsky-pit-3'],n9177013551:['nevsky-pit-1'],n9177013556:['nevsky-pit-2'],
    n946973293:['gorkovskaya-exit'],n990212227:['gorkovskaya-entrance'],
    n2112794338:['kirovsky-zavod-2'],n2112794353:['kirovsky-zavod-1'],n1735167407:['avtovo-1','avtovo-2','avtovo-3'],
    n12456266888:['gorny-in'],n12456266895:['gorny-out'],n3566607199:['sportivnaya2-6'],n5927391593:['sportivnaya2-7'],
  };
  const publicEnds={
    n2112824099:['n1735167424','n3090777561'],n1206756228:['n268479754','n5599406490'],
    n5628361779:['gostiny-sadovaya'],n7473625772:['dostoevskaya-passage-in'],n7473625773:['dostoevskaya-passage-out'],
  };
  const report=[];
  for(const e of ENTRANCES) {
    const play=L.inPlay(e.x,e.z), id=e.id;
    let kind;
    if(e.layer<0) {
      kind='underground';assert(!runtime.has(id),area+' draws a below-street marker as a surface door: '+id);
    } else if(publicEnds[id]) {
      kind='inside';
      if(play) for(const end of publicEnds[id])assert(runtime.has(end),area+' lacks the public entrance '+end+' serving '+id);
    } else if(id==='n4271098476') {
      kind='closed';
      if(play)assert(ctx.staticRoot.getObjectByName('metro-reconstruction-w52111190')&&!runtime.has(id),area+' missing closure');
    } else {
      kind='surface';
      // The only extent-only marker in the whole catalogue is Moskovskaya #3.
      if(play||id==='n648222973')for(const k of authored[id]||[id])assert(runtime.has(k),area+' has no exterior for '+id+' ('+k+')');
    }
    report.push([id,kind,play]);
  }
  console.log(JSON.stringify(report));
}
