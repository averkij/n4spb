// One reproducible coastal territory rule for registry scaffolding and OSM data.
// The base is the planning map's B600 raster. Tiny transition refinements are
// explicit cells, never a relaxed gate/dead-strip test or a water exclusion.
import { mapData, rectsOfRings } from './area-shape.mjs';
const CONFIG={ 'morskie-vorota':{k:71,prefix:'M'},okrug65:{k:100,prefix:'O'} };
const CELL=80;
export const COASTAL_REFINEMENTS={
  'morskie-vorota':{add:[
    {x0:-6880,x1:-6320,z0:1120,z1:1520},
    {x0:-5360,x1:-4880,z0:1440,z1:1520},
    {x0:-8080,x1:-6560,z0:800,z1:1440},
    // Keep the Olhovka edge reach and a Gulf raster corner joined to the bay.
    {x0:-5600,x1:-5520,z0:3920,z1:4000},
    {x0:-10560,x1:-10480,z0:5360,z1:5440},
  ],remove:[]},
  // Two isolated water cells created a non-working accidental Dekabristov gate.
  okrug65:{add:[
    // Real Kamenka water through the northern raster staircase.
    {x0:-9200,x1:-9120,z0:-8320,z1:-8240},
    {x0:-9120,x1:-9040,z0:-8400,z1:-8240},
    {x0:-9040,x1:-8960,z0:-8560,z1:-8320},
    {x0:-8960,x1:-8880,z0:-8560,z1:-8480},
    {x0:-8880,x1:-8800,z0:-8640,z1:-8560},
    {x0:-8800,x1:-8720,z0:-8800,z1:-8720},
    {x0:-8720,x1:-8640,z0:-8880,z1:-8800},
    {x0:-8640,x1:-8560,z0:-9040,z1:-8960},
    // Wet connection around Krestovsky's western shore, clear of Dekabristov.
    {x0:-7920,x1:-7840,z0:-4720,z1:-4080},
    {x0:-7840,x1:-7680,z0:-4160,z1:-4080},
  ],remove:[{x0:-7600,x1:-7520,z0:-4160,z1:-4000}]},
};
const eachCell=(r,fn)=>{for(let x=r.x0/CELL;x<r.x1/CELL;x++)for(let z=r.z0/CELL;z<r.z1/CELL;z++)fn(x+','+z);};
export function coastalRects(id) {
  const c=CONFIG[id];if(!c)throw new Error('Unknown coastal territory '+id);
  const a=mapData().areas.find(a=>a.k===c.k),cells=new Set();
  for(const r of rectsOfRings(a.fp,CELL,4,[a.fp,a.wz||[]],600))eachCell(r,k=>cells.add(k));
  for(const r of COASTAL_REFINEMENTS[id].add)eachCell(r,k=>cells.add(k));
  for(const r of COASTAL_REFINEMENTS[id].remove)eachCell(r,k=>cells.delete(k));
  // A water connection around a stepped shoreline must not enclose an internal
  // territory wall on the adjoining land. Fill only finite raster holes; the
  // flood-connected outside remains outside, including every coastal notch.
  const points=[...cells].map(k=>k.split(',').map(Number));
  const x0=Math.min(...points.map(p=>p[0]))-1,x1=Math.max(...points.map(p=>p[0]))+1,z0=Math.min(...points.map(p=>p[1]))-1,z1=Math.max(...points.map(p=>p[1]))+1;
  const outside=new Set([x0+','+z0]),queue=[[x0,z0]];
  for(let i=0;i<queue.length;i++)for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const x=queue[i][0]+dx,z=queue[i][1]+dz,k=x+','+z;
    if(x<x0||x>x1||z<z0||z>z1||cells.has(k)||outside.has(k))continue;
    outside.add(k);queue.push([x,z]);
  }
  for(let x=x0+1;x<x1;x++)for(let z=z0+1;z<z1;z++){const k=x+','+z;if(!outside.has(k))cells.add(k);}
  const rows=new Map();for(const key of cells){const[x,z]=key.split(',').map(Number);if(!rows.has(z))rows.set(z,[]);rows.get(z).push(x);}
  const zs=[...rows.keys()].sort((a,b)=>a-b),out=[];let open=new Map();
  for(let z=zs[0];z<=zs.at(-1)+1;z++){
    const xs=(rows.get(z)||[]).sort((a,b)=>a-b),runs=[];
    for(let i=0;i<xs.length;){const start=xs[i++];let end=start+1;while(i<xs.length&&xs[i]===end){end++;i++;}runs.push([start,end]);}
    const next=new Map();for(const[x0,x1]of runs){const k=x0+','+x1,r=open.get(k)||{x0:x0*CELL,x1:x1*CELL,z0:z*CELL};r.z1=(z+1)*CELL;next.set(k,r);open.delete(k);}
    out.push(...open.values());open=next;
  }
  return out.sort((a,b)=>a.z0-b.z0||a.x0-b.x0).map((r,i)=>({name:c.prefix+String(i+1).padStart(2,'0'),...r}));
}
