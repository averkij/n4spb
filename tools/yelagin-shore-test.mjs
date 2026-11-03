// Independent union-boundary coverage and continuity, including the corners
// that used to lose banks or fold fitted ribbons into impassable cliffs.
// node tools/area.mjs islands tools/yelagin-shore-test.mjs
import assert from 'node:assert/strict';
import { waterGeo, waterwayAt, slopeSurfaces, slopeHeightAt } from '../src/world/environment/waterways.js';
import { yelaginShoreRegion, onYelaginCoast } from '../src/areas/islands/shore.js';
assert.equal(process.env.AREA,'islands','run through tools/area.mjs islands');
const { rings, banks } = waterGeo(), natural = banks.filter(b => b.natural);
assert(natural.length>0,'natural island banks are missing');
const edges = natural.flatMap(b => b.pts.slice(1).map((p, i) => [b.pts[i], p]));
function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
let boundarySamples=0, terrainSamples=0;
for(const ring of rings.filter(r=>!r.owner))for(let i=0;i<ring.o.length;i+=2){
  const j=(i+2)%ring.o.length,a=[ring.o[i],ring.o[i+1]],b=[ring.o[j],ring.o[j+1]],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<.02||!yelaginShoreRegion((a[0]+b[0])/2,(a[1]+b[1])/2))continue;
  const n=Math.ceil(len/3),nx=-dz/len,nz=dx/len;
  for(let k=0;k<n;k++){
    const t=(k+.5)/n,x=a[0]+dx*t,z=a[1]+dz*t;
    if(!!waterwayAt(x+nx*.01,z+nz*.01)===!!waterwayAt(x-nx*.01,z-nz*.01))continue;
    assert(Math.min(...edges.map(([a,b])=>distance(x,z,a,b)))<.02,`exposed shore missing at ${x},${z}`);
    const left=slopeHeightAt(x+nx*.02,z+nz*.02),right=slopeHeightAt(x-nx*.02,z-nz*.02);
    assert(left!==null&&right!==null,`floor missing across shore at ${x},${z}`);
    assert(Math.abs(left-right)<.28,`vertical step across shore at ${x},${z}`);boundarySamples++;
  }
}
for(const s of slopeSurfaces()){
  if(s.reach.id!=='yelagin')continue;
  if(s.kind==='wall'||s.kind==='coping'){
    const x=(s.points[0][0]+s.points[1][0])/2,z=(s.points[0][2]+s.points[1][2])/2;
    assert(onYelaginCoast(x,z),'stone edge inside a park pond');
    if(s.kind==='wall')assert(Math.max(...s.points.map(p=>p[1]))-Math.min(...s.points.map(p=>p[1]))<1,'tall quay wall remains');
    continue;
  }
  for(let i=0;i<4;i++){
    const a=s.points[i],b=s.points[(i+1)%4];
    assert(Math.abs(a[1]-b[1])/Math.hypot(a[0]-b[0],a[2]-b[2])<.6,`folded or compressed bank ${a} -> ${b}`);terrainSamples++;
  }
}
// The previously failing narrow southern corner must have no hidden step.
const a=[-5911.406491133456,-5423.48936634387],b=[-5914.758938505673,-5440.719386559089];let prev=null;
for(let i=0;i<=400;i++){
  const t=i/400,h=slopeHeightAt(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)??0;
  if(prev!==null)assert(Math.abs(h-prev)<.08,'southern corner has an impassable step');prev=h;
}
console.log(`PASS Yelagin: ${natural.length} bank chains, ${boundarySamples} exposed-boundary probes, ${terrainSamples} continuous terrain edges, low outer stone and green inner banks`);
