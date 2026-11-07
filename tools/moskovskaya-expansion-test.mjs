// Geographic expansion and preservation audit. CPU only, no scene generation.
// node tools/area.mjs moskovskaya tools/moskovskaya-expansion-test.mjs
// --baseline <git-ref> checks conservation against that source snapshot (HEAD
// by default while authoring). --report-only prints differences without failing.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import * as D from '../src/world/data/city.js';
import * as L from '../src/world/layout.js';
import * as A from '../src/world/area.js';
import {WATERWAYS} from '../src/world/environment/waterways.js';
import {NAVIGABLE_WATER_Y} from '../src/world/environment/water-level.js';
import {correctMoskovskayaSquareFountains,SQUARE_BASIN_IDS,SQUARE_NOZZLE_IDS,SQUARE_SMALL_FOUNTAIN_IDS} from './moskovskaya-square-fountains.mjs';

assert.equal(process.env.AREA,'moskovskaya','run through tools/area.mjs moskovskaya');
const arg=process.argv.indexOf('--baseline'),ref=arg>=0?process.argv[arg+1]:'HEAD';
const reportOnly=process.argv.includes('--report-only'),failures=[];
const check=(yes,message)=>{if(!yes)failures.push(message);};
const git=(args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:128e6});
const dir='src/areas/moskovskaya/data';
const facade=git(['show',`${ref}:${dir}/city.js`]);
const files=[...facade.matchAll(/^import \* as P\d+ from '\.\/(city-[^']+\.js)';$/gm)].map(m=>m[1]);
assert(files.length,'baseline facade must refer to generated part files');
const old={};
for(const line of git(['show',...files.map(f=>`${ref}:${dir}/${f}`)]).split('\n')){
  const m=/^export const (\w+) = JSON\.parse\((".*")\);\r?$/.exec(line);
  if(m)(old[m[1]]||=[]).push(...JSON.parse(JSON.parse(m[2])));
}
const oldRects=JSON.parse(facade.match(/^export const PLAY_RECTS = (.*);$/m)[1]);
let preservedCells=0;
for(const r of oldRects)for(let x=r.x0+40;x<r.x1;x+=80)for(let z=r.z0+40;z<r.z1;z+=80){check(L.inPlay(x,z),'former playable cell removed at '+x+','+z);preservedCells++;}
for(const [name,x,z]of[['House of Soviets',-1437,8937],['Lenin monument',-1577.8,8941.8],['north main fountain',-1578.7,8876.9],['south main fountain',-1574.6,9004.7]])check(L.inPlay(x,z),name+' must be playable after expansion');
const families=(rows)=>{const m=new Map();for(const r of rows){const k=r.id??JSON.stringify(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return m;};
const summary={};
const currentTrees=new Set();for(let i=0;i<D.TREES.length;i+=2)currentTrees.add(D.TREES[i]+','+D.TREES[i+1]);
let preservedTrees=0;for(let i=0;i<old.TREES.length;i+=2){check(currentTrees.has(old.TREES[i]+','+old.TREES[i+1]),'prior mapped tree lost at '+old.TREES[i]+','+old.TREES[i+1]);preservedTrees++;}
for(const [name,rows]of Object.entries(old)){
  if(name==='TREES'||name==='OVERLAPS')continue;
  const now=families(D[name]||[]),before=families(rows),missing=[],changed=[];
  for(const [id,rs]of before){const next=now.get(id);if(!next)missing.push(id);else if(JSON.stringify(rs)!==JSON.stringify(next))changed.push(id);}
  summary[name]={before:rows.length,after:D[name]?.length??0,missing,changed};
  // Corrected square basin families deliberately leave the navigable pond mask.
  const lost=missing.filter(id=>!(name==='RIVER'&&SQUARE_BASIN_IDS.includes(id)));
  check(!lost.length,name+' loses prior families: '+lost.slice(0,12).join(', '));
}
const nowBuildings=new Map(D.BUILDINGS.map(r=>[r.id,r]));
let preservedBuildings=0;
for(const b of old.BUILDINGS){
  const n=nowBuildings.get(b.id);if(!n)continue;
  for(const key of['polys','parent','part','skip','minH','h'])check(JSON.stringify(b[key])===JSON.stringify(n[key]),'former building '+b.id+' changed '+key);
  preservedBuildings++;
}
const distanceTo=(x,z,rs)=>{let d=Infinity;for(const r of rs)for(let i=0;i+3<r.pts.length;i+=2){const ax=r.pts[i],az=r.pts[i+1],dx=r.pts[i+2]-ax,dz=r.pts[i+3]-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-ax-t*dx,z-az-t*dz));}return d;};
const roadsNow=families(D.ROADS);let roadProbes=0,splitRoadFamilies=0;
for(const [id,rs]of families(old.ROADS)){
  const next=roadsNow.get(id);if(!next)continue;
  if(rs.length>1)splitRoadFamilies++;
  for(const r of rs)for(let i=0;i+3<r.pts.length;i+=2){
    const ax=r.pts[i],az=r.pts[i+1],dx=r.pts[i+2]-ax,dz=r.pts[i+3]-az,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/20));
    for(let j=0;j<=n;j++){const x=ax+dx*j/n,z=az+dz*j/n;check(distanceTo(x,z,next)<.6,'former road geometry removed from '+id+' at '+x.toFixed(1)+','+z.toFixed(1));roadProbes++;}
  }
}
const pondIds=['r77680','r109994','r11008649','r11010469','r147758','r1380826','r11010790','r11014824','r11016386'];
const inside=(x,z,h)=>{let yes=false;for(let i=0,j=h.length-2;i<h.length;j=i,i+=2)if((h[i+1]>z)!==(h[j+1]>z)&&x<(h[j]-h[i])*(z-h[i+1])/(h[j+1]-h[i+1])+h[i])yes=!yes;return yes;};
let pondProbes=0,islandProbes=0;
for(const id of pondIds){
  const water=D.WATER.find(w=>w.id===id);check(water?.polys.length,'lost Victory Park pond '+id);if(!water)continue;
  const oldWater=old.WATER.find(w=>w.id===id);if(oldWater)check(JSON.stringify(oldWater.polys)===JSON.stringify(water.polys),'surveyed pond/island rings changed for '+id);
  for(const p of water.polys){
    const xs=p.o.filter((_,i)=>i%2===0),zs=p.o.filter((_,i)=>i%2);
    for(let x=Math.min(...xs)+2;x<Math.max(...xs);x+=12)for(let z=Math.min(...zs)+2;z<Math.max(...zs);z+=12){
      if(!inside(x,z,p.o))continue;
      if((p.h||[]).some(h=>inside(x,z,h))){check(L.waterLevelAt(x,z)===null,'dry pond island became water at '+x+','+z);islandProbes++;}
      else{check(L.waterLevelAt(x,z)===-1.2,'Victory Park isolated pond changed hydraulic level at '+x+','+z);pondProbes++;}
    }
  }
}
assert.deepEqual(A.WATER.isolatedLevels.moat,{water:-1.2,bed:-2.4});
for(const [key,w]of Object.entries(WATERWAYS))if(key!=='moat')check(w.water===NAVIGABLE_WATER_Y||A.WATER.isolatedLevels[key],'connected water datum changed for '+key);
check(A.OPEN_GROUND_BUILDING_IDS.includes('w31192359'),'open Basseynaya pilotis protection lost');
for(const id of['w134205326','w134205325'])check(A.OPEN_GROUND_BUILDING_IDS.includes(id),'underpass opening protection lost for '+id);
for(const [id,height]of[['w50224296',16.15],['r1806688',16.5],['w685882720',11.025]])check(nowBuildings.get(id)?.minH===height,'maintained clearance lost for '+id);
// Corrected fountain data is exercised on a clone, so this audit never edits
// generated data even while reviewing an intermediate importer checkpoint.
const corrected=structuredClone({WATER:D.WATER,RIVER:D.RIVER,FOUNTAINS:D.FOUNTAINS});
const fountains=correctMoskovskayaSquareFountains(corrected);
check(fountains.physicalBasins===11&&Object.keys(fountains.aliases).length===5,'square fountain identity/geometry lost');
for(const id of SQUARE_BASIN_IDS){
  check(D.WATER.find(w=>w.id===id)?.kind==='fountain','square basin is incorrectly a navigable pond: '+id);
  check(!D.RIVER.some(w=>w.id===id),'square fountain remains in the deep pond/river mask: '+id);
  check(Boolean(D.FOUNTAINS.find(w=>w.id===id)?.polys.length),'square basin geometry is unavailable to live fountains: '+id);
}
for(const id of [...SQUARE_BASIN_IDS,...SQUARE_SMALL_FOUNTAIN_IDS])check(corrected.FOUNTAINS.find(f=>f.id===id)?.polys.length,'fountain lacks real mapped basin '+id);
for(const id of SQUARE_NOZZLE_IDS)check(Boolean(fountains.aliases[id]),'mapped nozzle has no basin alias '+id);
const correctedOnce=JSON.stringify(corrected);correctMoskovskayaSquareFountains(corrected);
check(JSON.stringify(corrected)===correctedOnce,'fountain data correction must be idempotent');
let sourceSplitFamilies=0,sourceSplitProbes=0;
const sourceArg=process.argv.indexOf('--source');
if(sourceArg>=0){
  const source=await import(pathToFileURL(process.argv[sourceArg+1]).href);
  for(const [id,rs]of families(source.ROADS)){
    if(rs.length<2||!roadsNow.has(id))continue;
    let checked=false;
    for(const r of rs)for(let i=0;i+3<r.pts.length;i+=2){
      const ax=r.pts[i],az=r.pts[i+1],dx=r.pts[i+2]-ax,dz=r.pts[i+3]-az,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/10));
      for(let j=0;j<=n;j++){
        const x=ax+dx*j/n,z=az+dz*j/n;
        if(!D.EXTENT_RECTS.some(b=>x>b.x0+.6&&x<b.x1-.6&&z>b.z0+.6&&z<b.z1-.6))continue;
        check(distanceTo(x,z,roadsNow.get(id))<.6,'split source road geometry lost from '+id+' at '+x.toFixed(1)+','+z.toFixed(1));sourceSplitProbes++;checked=true;
      }
    }
    if(checked)sourceSplitFamilies++;
  }
}
const compact=Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,{before:v.before,after:v.after,missing:v.missing,changed:v.changed.length,...(v.changed.length?{changedExamples:v.changed.slice(0,4)}:{})}]));
console.log(JSON.stringify({baseline:ref,preservedCells,preservedBuildings,preservedTrees,roadProbes,splitRoadFamilies,sourceSplitFamilies,sourceSplitProbes,pondProbes,islandProbes,fountains,summary:process.argv.includes('--verbose')?summary:compact,failures:failures.slice(0,30),failureCount:failures.length}));
if(!reportOnly)assert.equal(failures.length,0,'area expansion conservation failed; see reported geography regressions');
console.log(failures.length?'FAIL expansion conservation':'PASS expanded territory and prior roads/buildings/ponds/open-building clearances.');
