// Source-water topology regression, independent of generated bank frames.
// node tools/area.mjs moskovskaya tools/water-bank-topology-test.mjs
// --compare-head reports exact legacy golden probe changes against HEAD.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import * as C from '../src/world/data/city.js';
import * as L from '../src/world/layout.js';
import * as live from '../src/world/environment/waterways.js';
async function headTopology(){const file=pathToFileURL(process.cwd()+'/src/world/environment/waterways.js');const source=execFileSync('git',['show','HEAD:src/world/environment/waterways.js'],{encoding:'utf8'}).replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g,(_,q,s)=>`from ${q}${new URL(s,file).href}${q}`);return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
// Inspect a previous checkpoint without replacing any workspace file. Before
// committing a fix this supplies an independent baseline regression check.
const {waterGeo,waterwayAt,pointInFlat,shoreDistance}=process.argv.includes('--against-head')?await headTopology():live;
const dist=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-dx*t,z-az-dz*t);};
const bankEdges=g=>g.banks.flatMap(b=>b.pts.slice(1).map((p,i)=>({bank:b.id,a:b.pts[i],b:p,closed:b.closed})));
const edges=bankEdges(waterGeo()),nearest=(x,z,es=edges)=>es.reduce((r,e)=>{const d=dist(x,z,...e.a,...e.b);return d<r.d?{d,...e}:r;},{d:Infinity});
if(process.argv.includes('--compare-head')){
 const old=await headTopology();
 const oldEdges=bankEdges(old.waterGeo()),b=L.WORLD.play,pts=[];
 for(let i=0;i<=24;i++)for(let j=0;j<=18;j++)pts.push([b.x0-150+(b.x1-b.x0+300)*i/24,b.z0-150+(b.z1-b.z0+300)*j/18].map(n=>Math.round(n*1e6)/1e6));
 for(const v of L.VIEWS)pts.push([v.x,v.z]);pts.push([L.HERO.x,L.HERO.z]);for(const g of Object.values(L.SUBGROUPS))if(g.at)pts.push(g.at);
 const changed=pts.map(([x,z])=>({x,z,before:old.shoreDistance(x,z),after:shoreDistance(x,z),oldBank:nearest(x,z,oldEdges),newBank:nearest(x,z)})).filter(p=>Math.abs(p.before-p.after)>1e-6);
 const id=e=>[...e.a,...e.b].join(','),oldSet=new Set(oldEdges.map(id)),newSet=new Set(edges.map(id));
 console.log(JSON.stringify({area:process.env.AREA,changed,added:edges.filter(e=>!oldSet.has(id(e))),removed:oldEdges.filter(e=>!newSet.has(id(e)))},null,2));
}else{
 assert.equal(process.env.AREA,'moskovskaya','source-hole regression intentionally covers all surveyed Victory Park islands');
 const waters=C.WATER.filter(w=>w.kind!=='fountain'&&w.polys?.some(p=>p.o.some((x,i)=>i%2===0&&x>-1800&&x< -600&&p.o[i+1]>6500&&p.o[i+1]<7900)));
 const wet=(x,z)=>waters.some(w=>w.polys.some(p=>pointInFlat(x,z,p.o)&&!p.h.some(h=>pointInFlat(x,z,h))));
 let shoreSamples=0,drySamples=0,holes=0;
 for(const w of waters)for(const p of w.polys){
  for(const ring of [p.o,...p.h])for(let i=0;i<ring.length;i+=2){const j=(i+2)%ring.length,ax=ring[i],az=ring[i+1],bx=ring[j],bz=ring[j+1],len=Math.hypot(bx-ax,bz-az),n=Math.ceil(len);
   for(let k=0;k<n;k++){const t=(k+.5)/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,nx=(bz-az)/len*.1,nz=-(bx-ax)/len*.1;if(wet(x+nx,z+nz)===wet(x-nx,z-nz))continue;const bank=nearest(x,z);assert(bank.d<.15,`surveyed shore erased ${w.id}: ${x},${z}, closest ${bank.bank} ${bank.d}m`);shoreSamples++;}
  }
  for(const h of p.h){holes++;const xs=h.filter((_,i)=>i%2===0),zs=h.filter((_,i)=>i%2);
   for(let x=Math.min(...xs)+.19;x<Math.max(...xs);x+=.5)for(let z=Math.min(...zs)+.23;z<Math.max(...zs);z+=.5){if(!pointInFlat(x,z,h))continue;let d=Infinity;for(let i=0;i<h.length;i+=2)d=Math.min(d,dist(x,z,h[i],h[i+1],h[(i+2)%h.length],h[(i+3)%h.length]));if(d<.03)continue;assert.equal(waterwayAt(x,z),null,`seam repair floods source island ${w.id} ${x},${z}`);drySamples++;}
  }
 }
 for(const e of edges){const len=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]),n=Math.ceil(len);for(let k=0;k<n;k++){const t=(k+.5)/n,x=e.a[0]+(e.b[0]-e.a[0])*t,z=e.a[1]+(e.b[1]-e.a[1])*t;if(x< -1800||x> -600||z<6500||z>7900)continue;const nx=(e.b[1]-e.a[1])/len*.1,nz=-(e.b[0]-e.a[0])/len*.1;assert.notEqual(wet(x+nx,z+nz),wet(x-nx,z-nz),`phantom bank across open water ${e.bank}: ${x},${z}`);}}
 assert.equal(holes,11,'all mapped park islands must enter the regression');assert(shoreSamples>8000);assert(drySamples>10000);
 console.log(`PASS: ${holes} surveyed dry islands, ${drySamples} independent interior probes, ${shoreSamples} source shoreline probes; no phantom internal water banks.`);
}
