// Surveyed pedestrian perimeter, with exact mapped lawn and fountain holes.
// Safe for area-table imports: no layout, area, context or renderer imports.
import {GREEN,FOUNTAINS} from '../data/city.js';
import {triangulateRing,subtractConvex,clipHalf,boxOfPoly,area2} from '../environment/clip.js';

// North: w91840938 and w1019539996. East: w1019539996. South:
// w1019540001. West: w1019539998 / w155148764 / w91840936.
export const MOSCOW_SQUARE_FIELD_RING=[-1645.9,8828.6,-1560,8826.2,-1504.5,8827.2,-1498.2,9054,-1639.5,9058.1,-1640.7,9013.6,-1643.4,8920];
const containsRing=(x,z,r)=>{let yes=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2)if((r[i+1]>z)!==(r[j+1]>z)&&x<(r[j]-r[i])*(z-r[i+1])/(r[j+1]-r[i+1])+r[i])yes=!yes;return yes;};
export const moscowSquareContains=(x,z)=>containsRing(x,z,MOSCOW_SQUARE_FIELD_RING);
const intersects=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
export const SQUARE_FOUNTAIN_BASIN_IDS=['r7369984','w74201757','w74201759','w91838567','w91838574','w110521204','w110521205','w110521206','w110521207','w110521208'];
const site=triangulateRing(MOSCOW_SQUARE_FIELD_RING),siteBox=boxOfPoly(MOSCOW_SQUARE_FIELD_RING.reduce((a,v,i,r)=>i%2?a:[...a,[v,r[i+1]]],[]));
export const MOSCOW_SQUARE_GREEN_POLYS=GREEN.filter(g=>['grass','wood','scrub','garden','flowerbed'].includes(g.kind)).flatMap(g=>g.polys.filter(p=>intersects(boxOfPoly(p.o.reduce((a,v,i,r)=>i%2?a:[...a,[v,r[i+1]]],[])),siteBox)).map(p=>({...p,id:g.id,kind:g.kind})));
export const MOSCOW_SQUARE_POOL_POLYS=FOUNTAINS.filter(f=>SQUARE_FOUNTAIN_BASIN_IDS.includes(f.id)).flatMap(f=>f.polys.map(p=>({...p,id:f.id})));

/** Partition convex floor pieces exactly, returning inside and outside. */
export function squarePartition(pieces,cut){
  const outside=[],inside=[],box=boxOfPoly(cut);
  for(const p of pieces){
    if(!intersects(boxOfPoly(p),box)){outside.push(p);continue;}
    let q=p;
    for(let i=0;i<cut.length&&q.length>=3;i++)q=clipHalf(q,cut[i],cut[(i+1)%cut.length],true);
    if(q.length<3||Math.abs(area2(q))<1e-5){outside.push(p);continue;}
    inside.push(q);outside.push(...subtractConvex([p],cut).filter(r=>Math.abs(area2(r))>1e-5));
  }
  return {inside,outside};
}

let paving=site,lawns=[];
// Union overlapping grass/wood/shrub records by taking each patch only from
// the unassigned paving. No duplicate coplanar lawn faces are introduced.
for(const p of MOSCOW_SQUARE_GREEN_POLYS)for(const t of triangulateRing(p.o,p.h||[])){
  const cut=squarePartition(paving,t);paving=cut.outside;lawns.push(...cut.inside);
}
for(const p of MOSCOW_SQUARE_POOL_POLYS)for(const t of triangulateRing(p.o,p.h||[])){
  paving=squarePartition(paving,t).outside;
  lawns=squarePartition(lawns,t).outside;
}
export const MOSCOW_SQUARE_PAVING=paving;
export const MOSCOW_SQUARE_LAWNS=lawns;
// Area PAVED_RINGS must claim these pieces, rather than the enclosing field:
// lawn islands retain their existing mapped and generated trees/planting.
export const MOSCOW_SQUARE_PAVED_RINGS=paving.map(p=>p.flat());
export const moscowSquarePavedContains=(x,z)=>moscowSquareContains(x,z)&&!MOSCOW_SQUARE_GREEN_POLYS.some(p=>containsRing(x,z,p.o)&&!(p.h||[]).some(h=>containsRing(x,z,h)))&&!MOSCOW_SQUARE_POOL_POLYS.some(p=>containsRing(x,z,p.o)&&!(p.h||[]).some(h=>containsRing(x,z,h)));
