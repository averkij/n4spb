// Sverdlovskaya's two-level promenade, following the surveyed right bank.
// Mostotrest: retaining wall to Vatutin, then a green slope. Widths and the
// -2m lower walk are photographic estimates constrained by mapped asphalt.
// No water mask changes: these are dry terrain cuts with matching heights.
import { BANK_LINE } from './bank-line.js';
import { ROADS, STEPS } from './data/city.js';
import { BANK_RINGS as LANDINGS } from '../../world/finlyandskyWaterfront/sites.js';
import { NAVIGABLE_WATER_Y } from '../../world/environment/water-level.js';
export const LOWER_Y=NAVIGABLE_WATER_Y+1.4, WALK_WIDTH=3.6;
// Surveyed maintenance access between the two flights at Piskarevsky: it
// descends across the green bank rather than floating at street level.
export const ACCESS_ROADS=ROADS.filter(r=>r.id==='w700719390');
export const ACCESS_PATHS=ROADS.filter(r=>r.id==='w701717146');
const dist=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);};
const inside=(x,z,p)=>{let q=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])q=!q;return q;};
const cuts=LANDINGS.map(r=>r.ring),outsideLandings=(x,z)=>!cuts.some(p=>inside(x,z,p));
const roads=ROADS.filter(r=>['primary','secondary','tertiary','residential','unclassified','living_street','service'].includes(r.hw)&&!ACCESS_ROADS.includes(r)&&!r.bridge&&!r.tunnel).flatMap(r=>Array.from({length:r.pts.length/2-1},(_,i)=>({a:r.pts.slice(i*2,i*2+2),b:r.pts.slice(i*2+2,i*2+4),half:(r.w||7)/2})));
const pts=[BANK_LINE[0]];
for(let i=1;i<BANK_LINE.length;i++){const a=BANK_LINE[i-1],b=BANK_LINE[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/6);for(let j=1;j<=n;j++)pts.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}
let total=0;const lengths=pts.map((p,i)=>{if(i)total+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);return total;});
export const FRAMES=pts.map((p,i)=>{
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const nx=(b[1]-a[1])/len,nz=-(b[0]-a[0])/len;
  const near=roads.filter(r=>Math.min(...[r.a[0],r.b[0]])<p[0]+40&&Math.max(r.a[0],r.b[0])>p[0]-40&&Math.min(r.a[1],r.b[1])<p[1]+40&&Math.max(r.a[1],r.b[1])>p[1]-40);
  let width=4;for(let d=4;d<=18;d+=.5){if(!near.every(r=>dist(p[0]+nx*d,p[1]+nz*d,r.a,r.b)>r.half+2.2))break;width=d;}
  const y=LOWER_Y*Math.min(1,lengths[i]/18,(total-lengths[i])/18);
  return {x:p[0],z:p[1],nx,nz,width,y,s:lengths[i],green:p[0]>1840};
});
// Polygon subtraction keeps bespoke landing surfaces free of coincident floors.
function half(poly,a,b,keep){const out=[],side=p=>((b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*(keep?1:-1);for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=side(p),v=side(q);if(u>=0)out.push(p);if(u*v<0){const t=u/(u-v);out.push(p.map((k,j)=>k+(q[j]-k)*t));}}return out;}
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
const CC=cuts.map(p=>area(p)<0?[...p].reverse():p);
function subtract(poly){let parts=[poly];for(const cut of CC){const out=[];for(let rest of parts)for(let i=0;i<cut.length&&rest.length>=3;i++){const a=cut[i],b=cut[(i+1)%cut.length],q=half(rest,a,b,false);if(q.length>=3)out.push(q);rest=half(rest,a,b,true);}parts=out;}return parts;}
const at=(f,d,y)=>[f.x+f.nx*d,y,f.z+f.nz*d];
export const SURFACES=[],GROUND_CUTS=[],BANK_RINGS=[];
function add(kind,quad,walk=true){for(const poly of subtract(quad))for(let i=1;i+1<poly.length;i++)SURFACES.push({kind,walk,p:[poly[0],poly[i],poly[i+1]]});}
for(let i=0;i+1<FRAMES.length;i++){
  const a=FRAMES[i],b=FRAMES[i+1],wa=Math.min(WALK_WIDTH,a.width-.4),wb=Math.min(WALK_WIDTH,b.width-.4);
  const q=[at(a,0,0),at(b,0,0),at(b,b.width,0),at(a,a.width,0)];
  for(const p of subtract(q)){const ring=p.map(v=>[v[0],v[2]]);GROUND_CUTS.push(ring);BANK_RINGS.push({id:`sverdlovskaya-${i}`,ring});}
  add('wall',[at(a,0,NAVIGABLE_WATER_Y-.15),at(b,0,NAVIGABLE_WATER_Y-.15),at(b,0,b.y),at(a,0,a.y)],false);
  add('walk',[at(a,0,a.y),at(b,0,b.y),at(b,wb,b.y),at(a,wa,a.y)]);
  if(a.green&&b.green)add('grass',[at(a,wa,a.y),at(b,wb,b.y),at(b,b.width,0),at(a,a.width,0)]);
  else{
    add('retaining',[at(a,wa,a.y),at(b,wb,b.y),at(b,wb,0),at(a,wa,0)],false);
    add('upper',[at(a,wa,0),at(b,wb,0),at(b,b.width,0),at(a,a.width,0)]);
  }
}
const cell=32,grid=new Map();
for(const s of SURFACES.filter(s=>s.walk)){const xs=s.p.map(p=>p[0]),zs=s.p.map(p=>p[2]);for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s);}}
export function bankHeight(x,z){if(!outsideLandings(x,z))return null;let height=null;for(const {p:[a,b,c]}of grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-9)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001){const h=u*a[1]+v*b[1]+(1-u-v)*c[1];height=height===null?h:Math.max(height,h);}}return height;}
export const HEIGHT_PATCH={id:'sverdlovskaya-promenade',box:[1100,2950,-3150,-2350],at:bankHeight};
export const STAIR_SITES=STEPS.flatMap(s=>{if(!s.pts?.length)return[];const x=(s.pts[0]+s.pts.at(-2))/2,z=(s.pts[1]+s.pts.at(-1))/2;let best=null,dd=Infinity;for(const f of FRAMES){const d=Math.hypot(x-f.x,z-f.z);if(d<dd){dd=d;best=f;}}return dd<22&&best.green&&outsideLandings(x,z)?[{id:s.id,f:best}]:[];}).filter((s,i,a)=>a.findIndex(q=>Math.abs(q.f.s-s.f.s)<12)===i);
// Only replaced ways are claimed; through streets keep their original asphalt.
export const OWNED_WAYS=[...new Set([...ROADS.filter(r=>['footway','path','steps'].includes(r.hw)&&r.pts.length>=4&&r.pts.every((v,i)=>i%2||bankHeight(v,r.pts[i+1])!==null)).map(r=>r.id),...STAIR_SITES.map(s=>s.id),...ACCESS_ROADS.map(r=>r.id),...ACCESS_PATHS.map(r=>r.id)])];
// The existing walking-surface clip contract also cuts flat ribbons over a
// coastal depression. Short overlapping rectangles cover the variable-width
// strip; the reserved road margin keeps the carriageway intact.
export const PAVING_HOLES=FRAMES.slice(0,-1).map((a,i)=>{const b=FRAMES[i+1],w=Math.min(a.width,b.width),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),nx=dz/l,nz=-dx/l;return{id:`finlyandsky-bank-cut-${i}`,kind:'stairs',x:(a.x+b.x)/2+nx*w/2,z:(a.z+b.z)/2+nz*w/2,w:l+.05,d:w-.55,rotY:Math.atan2(-dz,dx)};});
