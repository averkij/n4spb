// A locally bounded repair for the mapped taper between these two one-way
// carriageways. It applies only while both exact OSM ways exist in this area.
import { segInfo, wayAt } from './net.js';
import * as L from '../layout.js';
import { AREAS, GREEN } from '../data/city.js';
import { deckAt } from './decks.js';

const ringHas = (a,x,z) => { let hit=false; for(let i=0,j=a.length-2;i<a.length;j=i,i+=2) if((a[i+1]>z)!==(a[j+1]>z) && x<(a[j]-a[i])*(z-a[i+1])/(a[j+1]-a[i+1])+a[i]) hit=!hit; return hit; };
const islandAt = (x,z) => AREAS.some(a=>a.hw==='traffic_island' && a.polys.some(p=>ringHas(p.o,x,z) && !(p.h||[]).some(h=>ringHas(h,x,z))));

// Fail closed if a future map cut puts a green area anywhere in a repair box.
// Outer bounds intentionally ignore holes: a false overlap only skips a patch.
export function greenOverlapsBox(green, box) {
  return green.some(g => (g.polys || []).some(({ o }) => {
    let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
    for(let i=0;i<o.length;i+=2) { x0=Math.min(x0,o[i]); x1=Math.max(x1,o[i]); z0=Math.min(z0,o[i+1]); z1=Math.max(z1,o[i+1]); }
    return x0<=box[1] && x1>=box[0] && z0<=box[3] && z1>=box[2];
  }));
}

export function localGapSections(net) {
  const sections=[];
  // Local spans reviewed against the mapped twin carriageways. The narrow
  // intervals prevent repairs from spilling into a neighbouring real median.
  const sites=[
    ['w511116164','w142647140',542,550,[-650,-640,1401,1411]],
    ['w459816017','w308301794',90,97,[-1361,-1352,1373,1383]],
  ];
  for(const [id,partner,s0,s1,box] of sites) {
  if(greenOverlapsBox(GREEN, box)) continue;
  const w=net.ways.find(w=>w.id===id),v=net.ways.find(w=>w.id===partner);
  if(!w || !v || !w.oneway || !v.oneway || w.name!==v.name || w.L<s1) continue;
  sections.push(null); // never connect independent sites
  for(let s=s0;s<=s1;s+=0.5) {
    const q=wayAt(w,s), nx=q.tz,nz=-q.tx, ax=q.x+nx*q.hL,az=q.z+nz*q.hL;
    let best=null;
    for(let i=0;i<v.n-1;i++) {
      const p=segInfo(v,i,ax,az), dx=v.x[i+1]-v.x[i],dz=v.z[i+1]-v.z[i],len=Math.hypot(dx,dz)||1;
      const raw=((ax-v.x[i])*dx+(az-v.z[i])*dz)/(len*len);
      if(raw*len<-.2||(raw-1)*len>.2||p.dx*q.tx+p.dz*q.tz>-.85)continue;
      const gap=p.c.d-p.h;
      if(gap<0.02||gap>7.5 || (p.c.x-ax)*nx+(p.c.z-az)*nz<=0)continue;
      if(!best||gap<best.gap) best={p,gap};
    }
    if(!best) {sections.push(null);continue;}
    const {p,gap}=best,ux=(p.c.x-ax)/p.c.d,uz=(p.c.z-az)/p.c.d;
    const a=[ax-ux*.05,az-uz*.05],b=[ax+ux*(gap+.05),az+uz*(gap+.05)],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if([a,b,m].some(([x,z])=>x<box[0]||x>box[1]||z<box[2]||z>box[3]||!L.inPlay(x,z)||L.inRiver(x,z)||L.insideBuilding(x,z,.1)||deckAt(x,z,.3)||islandAt(x,z))) {sections.push(null);continue;}
    sections.push({a,b,gap,s});
  }
  }
  return sections;
}
