// The square's surveyed pool polygons were tagged as water=pond, while their
// actual operating fountain nozzles were separate amenity=fountain nodes.
// Join these real OSM identities before serializing a fresh area import.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readPart,partFileText,facadeTextOf} from './strip-data-clip.mjs';
export const SQUARE_BASIN_IDS = Object.freeze(['r7369984','w74201757','w74201759','w91838567']);
export const SQUARE_NOZZLE_IDS = Object.freeze(['n11050408330','n11050408331','n11050408332','n11050408333','n11050408334']);
export const SQUARE_SMALL_FOUNTAIN_IDS = Object.freeze(['w91838574','w110521204','w110521205','w110521206','w110521207','w110521208']);
const insideRing=(x,z,r)=>{let yes=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2)if((r[i+1]>z)!==(r[j+1]>z)&&x<(r[j]-r[i])*(z-r[i+1])/(r[j+1]-r[i+1])+r[i])yes=!yes;return yes;};
const contains=(p,x,z)=>insideRing(x,z,p.o)&&!(p.h||[]).some(h=>insideRing(x,z,h));
function centre(polys){
  let area=0,x=0,z=0;
  for(const p of polys){let a=0,cx=0,cz=0;for(let i=0;i<p.o.length;i+=2){const j=(i+2)%p.o.length,q=p.o[i]*p.o[j+1]-p.o[j]*p.o[i+1];a+=q;cx+=(p.o[i]+p.o[j])*q;cz+=(p.o[i+1]+p.o[j+1])*q;}const w=Math.abs(a);if(w){x+=cx/(3*a)*w;z+=cz/(3*a)*w;area+=w;}}
  if(!area)throw new Error('Moscow Square fountain polygon has no surveyed area');
  return {x:Math.round(x/area*10)/10,z:Math.round(z/area*10)/10};
}

/** Mutates only supplied flattened arrays; caller redistributes them to parts. */
export function correctMoskovskayaSquareFountains({WATER,RIVER,FOUNTAINS}){
  for(const [name,arr]of Object.entries({WATER,RIVER,FOUNTAINS}))if(!Array.isArray(arr))throw new TypeError(name+' must be a mutable data array');
  const pools=SQUARE_BASIN_IDS.map(id=>{
    const w=WATER.find(r=>r.id===id);
    if(!w?.polys?.length)throw new Error('Missing mapped Moscow Square fountain basin '+id);
    return w;
  });
  const nodes=SQUARE_NOZZLE_IDS.map(id=>{const f=FOUNTAINS.find(r=>r.id===id);if(!f)throw new Error('Missing mapped Moscow Square fountain node '+id);return f;});
  const aliases={};
  for(const f of nodes){
    const matches=pools.filter(w=>w.polys.some(p=>contains(p,f.x,f.z)));
    if(matches.length!==1)throw new Error('Fountain node '+f.id+' must lie within exactly one mapped basin family');
    aliases[f.id]=matches[0].id;
  }
  for(const w of pools){
    w.kind='fountain';w.name||='Музыкальные фонтаны Московской площади';
    const found=FOUNTAINS.find(f=>f.id===w.id),record={...w,...centre(w.polys)};
    if(found)Object.assign(found,record);else FOUNTAINS.push(record);
  }
  let removed=0;
  for(let i=RIVER.length-1;i>=0;i--)if(SQUARE_BASIN_IDS.includes(RIVER[i].id)){RIVER.splice(i,1);removed++;}
  const small=SQUARE_SMALL_FOUNTAIN_IDS.map(id=>{const f=FOUNTAINS.find(r=>r.id===id);if(!f?.polys?.length)throw new Error('Missing small square fountain '+id);return f;});
  const physicalBasins=[...pools,...small].reduce((n,f)=>n+f.polys.length,0);
  if(physicalBasins!==11)throw new Error('Moscow Square must retain eleven surveyed fountain basins');
  return {polygonFamilies:pools.length,physicalBasins,aliases,removedRiverRecords:removed};
}

/** Importer adapter: preserves existing per-record part membership. */
export function correctMoskovskayaSquareParts(parts){
  const names=['WATER','RIVER','FOUNTAINS'];
  const data=Object.fromEntries(names.map(name=>[name,parts.flatMap(P=>P.arrays.get(name)||[])]));
  const locations=Object.fromEntries(names.map(name=>[name,new Map(parts.flatMap((P,i)=>(P.arrays.get(name)||[]).map(r=>[r.id,i])))]));
  const stats=correctMoskovskayaSquareFountains(data);
  for(const name of names){
    for(const P of parts)if(P.arrays.has(name))P.arrays.set(name,[]);
    if(name==='RIVER')parts[0].arrays.set(name,data[name]);
    else for(const r of data[name]){
      const index=locations[name].get(r.id)??locations.WATER.get(r.id)??0;
      if(!parts[index].arrays.has(name))parts[index].arrays.set(name,[]);
      parts[index].arrays.get(name).push(r);
    }
  }
  return stats;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&process.argv.includes('--apply')){
  const dir=fileURLToPath(new URL('../src/areas/moskovskaya/data/',import.meta.url));
  const file=path.join(dir,'city.js'),facade=fs.readFileSync(file,'utf8');
  const filenames=[...facade.matchAll(/^import \* as P\d+ from '\.\/(city-[^']+\.js)';$/gm)].map(m=>m[1]);
  if(!filenames.length)throw new Error('No Moskovskaya data parts in facade');
  const parts=filenames.map(f=>readPart(dir,f)),stats=correctMoskovskayaSquareParts(parts);
  for(const P of parts)fs.writeFileSync(path.join(dir,P.file),partFileText(P.lines,P.order,P.arrays));
  fs.writeFileSync(file,facadeTextOf(facade,parts));
  console.log(JSON.stringify(stats));
}
