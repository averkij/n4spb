// Current mapped axes are shared by geometry, walking, driving and shore gaps.
// OSM layer orders crossings; it is not an elevation or a physical deck ID.
import { ROADS, RIVER } from '../data/city.js';
import { whsdY } from '../bridges/sites-vo2.js';

const pedestrian = r => /^(footway|path|cycleway|pedestrian|steps)$/.test(r.hw);
const whsd = r => r.name === 'ЗСД' || r.ref === 'ЗСД';
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pointKey = (x,z) => `${x.toFixed(1)},${z.toFixed(1)}`;
const direction = r => Math.sign((r.pts.at(-1)-r.pts[1])*(r.oneway===-1?-1:1)) || 1;

// Existing Gavan/Korabelny profile through z2600, then a continuous approach to
// the Sea Canal. Clearance52m is official: gov.spb.ru/press/governor/96074/.
// Deck separation8m is a visual estimate; lane direction stays the same across
// layer2/3 changes. The lower girder soffit is exactly52m above water(-3.4).
export function marineWhsdHeight(z,northbound=false) {
  if(z<=2600)return whsdY(z);
  const lower=51.2;
  const base=z<3300?12+(lower-12)*(z-2600)/700:z<=3900?lower:lower-(lower-18)*clamp((z-3900)/900,0,1);
  return base+(northbound?8*clamp((z-2600)/500,0,1):0);
}

/** Select the floor reachable from the caller's current height. Infinity is an
 * authoring/placement query and returns the highest surface, like other decks. */
export function deckAtSegments(segments,x,z,ref=Infinity) {
  let top=null;
  for(const s of segments){
    const dx=x-s.x,dz=z-s.z,sin=Math.sin(s.yaw),cos=Math.cos(s.yaw),u=dx*sin+dz*cos;
    // Adjacent slabs share a cap. A3cm query margin covers float projection /
    // rounded road probes at that cap without creating a gap in a driving lane.
    if(Math.abs(dx*cos-dz*sin)>s.w/2+.03||Math.abs(u)>s.len/2+.03)continue;
    const y=s.ya+(s.yb-s.ya)*(u/s.len+.5)+.025;
    if(y<=ref+1.2)top=top===null?y:Math.max(top,y);
  }
  return top;
}

function sampleLine(p) {
  const out=p.slice(0,2);
  for(let i=0;i+3<p.length;i+=2){
    const dx=p[i+2]-p[i],dz=p[i+3]-p[i+1],n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/24));
    const ts=Array.from({length:n},(_,j)=>(j+1)/n);
    for(const z of [2600,3100,3300,3900,4800])if(dz&&(z-p[i+1])/dz>0&&(z-p[i+1])/dz<1)ts.push((z-p[i+1])/dz);
    ts.sort((a,b)=>a-b);
    let last=0;for(const t of ts)if(t-last>1e-8){out.push(p[i]+dx*t,p[i+1]+dz*t);last=t;}
  }
  return out;
}

/** Pure constructor also used by the bridge continuity regression fixtures. */
export function coastalSites(roads) {
  const bridges=roads.filter(r=>r.bridge&&!r.tunnel&&r.pts?.length>=4).map(r=>{
    const p=sampleLine(r.pts),isWhsd=whsd(r),northbound=direction(r)<0;
    let len=0;for(let i=2;i<p.length;i+=2)len+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);
    const yacht=/Яхтен/.test(r.name||''),marine=isWhsd&&p.some((z,i)=>i%2&&z>0);
    return {id:'coast-'+r.id,road:r,pts:p,cx:(p[0]+p.at(-2))/2,cz:(p[1]+p.at(-1))/2,len,
      w:yacht?16.5:Math.max(pedestrian(r)?1.8:3,r.w||6),foot:pedestrian(r),whsd:isWhsd,marine,northbound,yacht,
      depth:isWhsd?2.6:yacht?1.6:.65,seaCanal:marine&&p.some((z,i)=>i%2&&z>=2900&&z<=4400)};
  });
  const key=(b,x,z)=>(b.whsd?'whsd'+(b.northbound?'N':'S'):'road')+':'+pointKey(x,z);
  const graph=new Map();
  const target=(b,z)=>b.marine?marineWhsdHeight(z,b.northbound):b.whsd?22:b.yacht?14.2:b.foot?.18:6;
  for(const b of bridges)for(let i=0;i<b.pts.length;i+=2){
    const k=key(b,b.pts[i],b.pts[i+1]);
    if(!graph.has(k))graph.set(k,{edges:[],dist:Infinity,target:0,grade:b.foot?.09:.06});
    const v=graph.get(k);v.target=Math.max(v.target,target(b,b.pts[i+1]));v.grade=Math.min(v.grade,b.foot?.09:.06);
    if(i){const prev=key(b,b.pts[i-2],b.pts[i-1]),d=Math.hypot(b.pts[i]-b.pts[i-2],b.pts[i+1]-b.pts[i-1]);v.edges.push([prev,d]);graph.get(prev).edges.push([k,d]);}
  }
  const plainEnds=new Set();
  for(const r of roads)if(!r.bridge&&!r.tunnel&&r.pts?.length>=4){plainEnds.add(pointKey(r.pts[0],r.pts[1]));plainEnds.add(pointKey(r.pts.at(-2),r.pts.at(-1)));}
  const queue=[];
  for(const b of bridges)for(const i of [0,b.pts.length-2])if(plainEnds.has(pointKey(b.pts[i],b.pts[i+1]))){const k=key(b,b.pts[i],b.pts[i+1]);if(graph.get(k).dist!==0){graph.get(k).dist=0;queue.push(k);}}
  for(let i=0;i<queue.length;i++){const v=graph.get(queue[i]);for(const[k,d]of v.edges)if(graph.get(k).dist>v.dist+d){graph.get(k).dist=v.dist+d;queue.push(k);}}
  for(const b of bridges){
    b.heights=[];b.nodeKeys=[];
    for(let i=0;i<b.pts.length;i+=2){const k=key(b,b.pts[i],b.pts[i+1]),v=graph.get(k);b.nodeKeys.push(k);b.heights.push(Math.min(v.target,.04+v.dist*v.grade));}
    b.y=Math.max(...b.heights);
  }
  return bridges;
}
export const COASTAL_BRIDGES=coastalSites(ROADS);
export const COASTAL_BRIDGE_GROUPS=COASTAL_BRIDGES.map(b=>({key:b.id,name:b.road.name||'Мост',nameEn:'Mapped bridge',ids:[],osm:[b.road.id],at:[b.cx,b.cz]}));
const inRing=(x,z,p)=>{let on=false;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2)if((p[i+1]>z)!==(p[j+1]>z)&&x<(p[j]-p[i])*(z-p[i+1])/(p[j+1]-p[i+1])+p[i])on=!on;return on;};
const inPond=(x,z)=>RIVER.some(r=>r.key==='moat'&&(r.polys||[]).some(p=>inRing(x,z,p.o)&&!(p.h||[]).some(h=>inRing(x,z,h))));
export const COASTAL_BRIDGE_ZONES=COASTAL_BRIDGES.filter(b=>!b.whsd&&b.len<800).map(b=>({id:b.id,key:inPond(b.cx,b.cz)?'moat':'neva',c:[b.cx,b.cz],axis:Math.atan2(b.pts.at(-2)-b.pts[0],b.pts[1]-b.pts.at(-1))*180/Math.PI,w:b.w+1,len:b.len+8,own:true}));
