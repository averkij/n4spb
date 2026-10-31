// Regenerate the northern water scenery from the correct Petersburg source.
// Run after refine-petro-territories.mjs; authored geometry is never overwritten.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { clipRingUnion } from './osm-lib.mjs';
import { grow } from './strip-data-clip.mjs';
import { NEVA_MALAYA } from '../src/world/environment/neva-malaya.js';
import { PETRO_WATER } from '../src/world/environment/petro-water.js';
import { ISLANDS2_WATER } from '../src/world/environment/islands2-context.js';
import { VO_SEA } from '../src/world/environment/vo-sea.js';
const source=process.env.PITER_SOURCE||'D:/git2/agi-fun-tests/102_3d_piter';
const {KRESTOVSKY_WATER}=await import(pathToFileURL(path.join(source,'src/world/environment/krestovsky-context.js')));
for(const id of ['kronverk','aptekarsky','islands']){
 const {EXTENT_RECTS,RIVER}=await import(pathToFileURL(path.resolve('src/areas/'+id+'/data/city.js')));
 const rects=EXTENT_RECTS.map(r=>grow(r,600));
 const rings=[{id:'neva-malaya',key:'neva',o:NEVA_MALAYA},{id:'gulf',key:'neva',o:VO_SEA},...PETRO_WATER.filter(p=>p.id==='r1312629'),...KRESTOVSKY_WATER,...ISLANDS2_WATER];
 const context=rings.flatMap(p=>clipRingUnion(Array.from({length:p.o.length/2},(_,i)=>p.o.slice(i*2,i*2+2)),rects).map((ring,i)=>({id:p.id+'-'+i,key:p.key,ring:ring.flat()})));
 // This aggregate OSM relation repeats the individual Yelagin ponds already
 // retained in RIVER/WATER. Duplicate edges erase both copies of a real bank
 // in the shared open-join detector. Keep the individual polygons and islands.
 const names=[...new Set([...rings.map(p=>p.name),...RIVER.filter(r=>r.id==='r8613894').map(r=>r.name)].filter(Boolean))];
 fs.writeFileSync('src/areas/'+id+'/water-context.js','// Source water context clipped to this district plus its scenery band.\nexport const CONTEXT = '+JSON.stringify(context)+';\nexport const CONTEXT_NAMES = '+JSON.stringify(names)+';\n');
 console.log(id,context.length,'water rings');
}
