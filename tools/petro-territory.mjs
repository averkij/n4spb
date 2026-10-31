// One extra 80 m transition cell around the planning outline. The tiny southern
// Neva overlap with Admiralty is served through Palace/Vasilyevsky instead:
// its direct 420 m edge had a 100% reverse-trigger share. No planned land lost.
import { mapData, rectsOfRings } from './area-shape.mjs';
import { REGISTRY } from '../src/areas/registry.js';
import { RIVER as SOURCE_RIVER } from 'file:///D:/git2/agi-fun-tests/102_3d_piter/src/world/data/city.js';
import { PETRO_WATER } from '../src/world/environment/petro-water.js';
export function petroTerritory(k,prefix) {
 const a=mapData().areas.find(a=>a.k===k),raw=rectsOfRings(a.fp,80,4,[a.fp,a.wz||[]],600),cells=new Set();
 for(const r of raw)for(let x=r.x0/80;x<r.x1/80;x++)for(let z=r.z0/80;z<r.z1/80;z++){
  const pad=k===86&&z< -2800/80||k===85&&x< -3500/80?1:0;
  for(let dx=-pad;dx<=pad;dx++)for(let dz=-pad;dz<=pad;dz++){
   const xx=x+dx,zz=z+dz;
   if(k===86&&REGISTRY.admiralty.play.some(q=>(xx+.5)*80>q.x0&&(xx+.5)*80<q.x1&&(zz+.5)*80>q.z0&&(zz+.5)*80<q.z1))continue;
   cells.add(xx+','+zz);
  }
 }
 // A complete shared approach at the north end of Troitsky Bridge, avoiding
 // a 360 m raster strip where the Palace page's probe missed this territory.
 if(k===86)for(let x=-1440/80;x< -880/80;x++)for(let z=-2320/80;z< -2000/80;z++)cells.add(x+','+z);
 // Keep the Karpovka bend continuous across the Aptekarsky western edge.
 if(k===84)for(let x=-2880/80;x< -2400/80;x++)for(let z=-4320/80;z< -4000/80;z++)cells.add(x+','+z);
 // Carry the complete Karpovka water corridor to its western river mouth.
 // Otherwise the western bend is a small isolated reach cut by the page edge.
 if(k===84)for(const r of SOURCE_RIVER.filter(r=>r.name==='Карповка').concat(PETRO_WATER.filter(r=>r.id==='r1312629').map(r=>({polys:[{o:r.o}]}))))for(const p of r.polys)for(let i=0;i<p.o.length;i+=2){
  const j=(i+2)%p.o.length,dx=p.o[j]-p.o[i],dz=p.o[j+1]-p.o[i+1],n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/30));
  for(let s=0;s<=n;s++){const x=Math.floor((p.o[i]+dx*s/n)/80),z=Math.floor((p.o[i+1]+dz*s/n)/80);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)cells.add((x+a)+','+(z+b));}
 }
 // Subtracting the tiny Admiralty overlap leaves a lone Neva cell at its
 // corner. Keep the connected territory; neighbours already cover that water.
 const unseen=new Set(cells),parts=[];
 while(unseen.size){const first=unseen.values().next().value,part=new Set(),queue=[first];unseen.delete(first);while(queue.length){const key=queue.pop();part.add(key);const [x,z]=key.split(',').map(Number);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=(x+dx)+','+(z+dz);if(unseen.delete(q))queue.push(q);}}parts.push(part);}
 parts.sort((a,b)=>b.size-a.size);for(const part of parts.slice(1))for(const key of part)cells.delete(key);
 const rows=new Map();for(const key of cells){const [x,z]=key.split(',').map(Number);if(!rows.has(z))rows.set(z,[]);rows.get(z).push(x);}
 let open=new Map(),out=[];
 const zs=[...rows.keys()].sort((a,b)=>a-b);
 for(let z=zs[0];z<=zs.at(-1)+1;z++){
  const xs=(rows.get(z)||[]).sort((a,b)=>a-b),runs=[];
  for(let i=0;i<xs.length;){const start=xs[i++];let end=start+1;while(i<xs.length&&xs[i]===end){end++;i++;}runs.push([start,end]);}
  const next=new Map();for(const [x0,x1] of runs){const key=x0+','+x1;const r=open.get(key)||{x0:x0*80,x1:x1*80,z0:z*80};r.z1=(z+1)*80;next.set(key,r);open.delete(key);}
  out.push(...open.values());open=next;
 }
 return out.sort((a,b)=>a.z0-b.z0||a.x0-b.x0).map((r,i)=>({name:prefix+String(i+1).padStart(2,'0'),...r}));
}
