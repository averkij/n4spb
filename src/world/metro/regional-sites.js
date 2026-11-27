// Facades and approach levels identified in docs/research/metro-entrances.md.
// Heights, widths and step counts are modelling dimensions in metres, not survey levels.
import { BUILDINGS, ENTRANCES, ROADS } from '../data/city.js';

const profiles = new Map();
function station(ids, name, kind, stone, trim, options = {}) {
  for (const id of ids.split(' ')) profiles.set(id, { name, kind, stone, trim, ...options });
}
station('w591585501 w591585506','Беговая','skillion','#69848b','#c9d3d3',{shell:7.25, glass:true});
station('r2601777','Выборгская','ribbon','#b3aca0','#91877c',{shell:5.15, glass:true, stripes:true});
station('w88216896','Звенигородская','recess','#c1a58b','#626c6c',{stripes:true});
station('w590181296 w590181280','Зенит','ribbon','#9cabad','#e0e4df',{shell:4.3,glass:true, width:4.75});
station('w28056783','Лесная','ribbon','#bcb7ad','#435851',{shell:4.85,glass:true,stripes:true});
station('w53573863','Лиговский проспект','faceted','#988b81','#7b6e65',{style:'bronze'});
station('w50224297','Московские ворота','flared','#dbd6c9','#f0eadb',{stripes:true,width:4.5});
station('r2030635','Нарвская','cupola','#e3cfac','#537468',{shell:8.25,style:'oak',steps:4,width:5.1});
station('w151741572','Обводный канал','recess','#737576','#3d464b',{});
station('r2077397','Пионерская','folded','#a6a3a0','#ac6b4e',{shell:5.55,glass:true,stripes:true});
station('w28712844','Площадь Ленина','ribbon','#bcb6a6','#a19b92',{shell:4.45,glass:true});
station('w1389288356','Путиловская','gold','#a5a098','#bd9557',{shell:7.25,glass:true,stripes:true});
station('r11737909','Пушкинская','fanlight','#c9b59c','#a08b73',{style:'walnut'});
station('w39036403','Сенная площадь','terrace','#b9b4ac','#636c6a',{shell:5.32,glass:true,steps:6,stripes:true});
station('w245455781','Спасская','rusticated','#9b8172','#775c52',{shell:5.6,style:'bronze'});
station('w23550368','Старая Деревня','arcade','#daceba','#a99a83',{shell:6.4});
station('r2163775','Технологический институт','cornice','#bca992','#d2bea2',{style:'oak'});
station('r2099010','Удельная','clerestory','#c5c1b8','#85959a',{shell:5.6,glass:true,stripes:true});
station('w50064533','Чкаловская','terrace','#9c938c','#505657',{shell:6.8,glass:true,steps:9,stripes:true});
station('r2055290','Чёрная речка','ribs','#ccc5b8','#8a9090',{shell:6.6,glass:true,steps:3,stripes:true});
station('w35064536','Электросила','rounded','#c7b5a6','#857c75',{shell:4.05,glass:true});
station('w1299581152','Юго-Западная','louvres','#a19a91','#b9a48b',{style:'bronze',stripes:true});
station('w52111190','Фрунзенская','closed','#9a9e98','#727d77');
export const regionalBuildings = new Map(BUILDINGS.filter(b=>profiles.has(b.id)).map(b=>[b.id,b]));
export function regionalShellOwns(b) {
  return activeShells.has(b.id) || activeShells.has(b.parent);
}

export function outlineEdges(flat) {
  const points=[];
  for(let i=0;i<flat.length;i+=2){
    if(!points.length || points.at(-1)[0]!==flat[i] || points.at(-1)[1]!==flat[i+1])points.push([flat[i],flat[i+1]]);
  }
  if(points.length>1 && points[0][0]===points.at(-1)[0] && points[0][1]===points.at(-1)[1])points.pop();
  const area=points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a[0]*b[1]-a[1]*b[0];},0);
  return points.map((a,i)=>{
    const b=points[(i+1)%points.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;
    return {a,b,len,dx,dz,nx:Math.sign(area)*dz,nz:-Math.sign(area)*dx};
  });
}

function nearestEdge(x,z,edges){
  let best;
  for(const e of edges){
    const t=Math.max(0,Math.min(e.len,(x-e.a[0])*e.dx+(z-e.a[1])*e.dz));
    const px=e.a[0]+t*e.dx,pz=e.a[1]+t*e.dz,dist=Math.hypot(x-px,z-pz);
    if(!best || dist<best.dist-.12 || (Math.abs(dist-best.dist)<=.12 && e.len>best.e.len))best={e,px,pz,dist};
  }
  return best;
}

export const regionalMetroSites=[];
// The two Putilovskaya groups face the same long portico. The nearest outline
// segment to the entrance marker is a side return. The outward directions
// below follow OSM covered footways 1462153999/998 and 418563868 (Technologichesky).
const gateDirections={n13411468484:[4.0,-7.7],n13411468486:[2.9,-5.6],n4189482980:[-.8,-1.2]};
const documentedSteps={n1735167440:8,n763045997:7,n763045998:7,n1933529453:10,n353927287:12,n1646568762:7,n1669412333:5,n1132515960:4};
// The eastern stairs of Pionerskaya stand at the edge of the square. Pedestrians
// cross a raised terrace between these flights and the station's actual leaves.
const terraceWays={n1669412333:'w385602211',n1132515960:'w385602212'};
for(const p of ENTRANCES){
  const b=regionalBuildings.get(p.bldg);
  if(!b || p.layer<0 || p.bldgDist>1)continue;
  const profile=profiles.get(b.id), edges=b.polys.flatMap(poly=>outlineEdges(poly.o)), hit=nearestEdge(p.x,p.z,edges);
  if(!hit || hit.dist>12)continue;
  const dir=gateDirections[p.id],yaw=dir?Math.atan2(...dir):Math.atan2(hit.e.nx,hit.e.nz);
  const nx=Math.sin(yaw),nz=Math.cos(yaw);
  // Recessed metal or wood leaves sit at the mapped interior nodes inside the
  // outline of a roof/portico. Find where their outward ray meets the street.
  let inset=0;
  if(hit.dist>.30){
    let first=Infinity;
    for(const e of edges){
      const cross=nx*e.dz-nz*e.dx;
      if(Math.abs(cross)<1e-6)continue;
      const x=e.a[0]-p.x,z=e.a[1]-p.z,t=(x*e.dz-z*e.dx)/cross,u=(x*nz-z*nx)/cross;
      if(t>.02 && u>=-.04 && u<=e.len+.04)first=Math.min(first,t);
    }
    inset=Number.isFinite(first)?first:hit.dist;
  }
  const w=profile.width || 4.4;
  const steps=documentedSteps[p.id] ?? profile.steps ?? 0;
  const way=terraceWays[p.id] && ROADS.find(r=>r.id===terraceWays[p.id]);
  const terrace=way?{way:way.id,lower:{x:way.pts[0],z:way.pts[1]},upper:{x:way.pts.at(-2),z:way.pts.at(-1)},
    via:p.id==='n1132515960'?[{x:p.x+10.4,z:p.z+8.2}]:[]}:null;
  regionalMetroSites.push({id:p.id, name:profile.name, bldg:b.id, kind:p.kind, profile, x:inset?p.x:hit.px,z:inset?p.z:hit.pz,
    rotY:yaw,w,h:2.34,inset,aperture:inset ? (profile.kind==='gold'?5.15:3.50) : 0,steps,terrace,y:.12+steps*.15,style:profile.style||'aluminium',
    stripes:!!profile.stripes, leaves:4, approach:Math.max(inset+1.45,steps ? 1.85+steps*.35+1.25:2.55)});
}

// One cartographic entrance node stands for Narvskaya's three glazed arches.
const narvskaya=regionalMetroSites.find(d=>d.id==='n1735167440');
if(narvskaya)for(const [side,delta] of [['left',-6.35],['right',6.35]]){
  regionalMetroSites.push({...narvskaya,id:narvskaya.id+'-'+side,surveyNode:narvskaya.id,
    x:narvskaya.x+Math.cos(narvskaya.rotY)*delta,z:narvskaya.z-Math.sin(narvskaya.rotY)*delta});
}
const activeShells=new Set(regionalMetroSites.filter(d=>d.profile.shell).map(d=>d.bldg));

// Intersect a facade segment with the rectangular plan of a vestibule. The
// segment can end at a door node, or be a wall of a child building part.
export function portalSpan(e,d,margin=.14){
  const ux=Math.cos(d.rotY),uz=-Math.sin(d.rotY),vx=-uz,vz=ux;
  const x=e.a[0]-d.x,z=e.a[1]-d.z;
  let lo=0,hi=e.len;
  for(const [start,speed,min,max] of [
    [x*ux+z*uz,e.dx*ux+e.dz*uz,-d.w/2-margin,d.w/2+margin],
    [x*vx+z*vz,e.dx*vx+e.dz*vz,-3.05,(d.inset||0)+.80]]){
    if(Math.abs(speed)<1e-7){if(start<min || start>max)return null;continue;}
    const a=(min-start)/speed,b=(max-start)/speed;
    lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
    if(hi-lo<=.01)return null;
  }
  return [lo,hi];
}

export function clipRegionalMetroWalls(net,extras=[]){
  const doors=[...regionalMetroSites.filter(d=>d.profile.kind!=='closed'),...extras];
  if(!doors.length)return;
  for(const [,rec] of net.rec){
    if(rec.b.waterfront || (rec.b.minH||0)>3.5)continue;
    let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
    for(const ring of rec.rings)for(const [x,z] of ring.pts){
      x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);
    }
    for(const d of doors){
      const pad=d.w/2+3.1;
      if(d.x<x0-pad || d.x>x1+pad || d.z<z0-pad || d.z>z1+pad)continue;
      for(const r of rec.rings)for(const e of r.edges){
        const span=portalSpan(e,d);
        if(!span)continue;
        const top=d.aperture || (d.y??.12)+(d.h??2.6)+.17, [lo,hi]=span;
        e.pieces=e.pieces.flatMap(pc=>{
          const left=Math.max(pc.t0,lo),right=Math.min(pc.t1,hi);
          if(right-left<.01 || pc.yLow>=top || pc.h0!=null)return [pc];
          const pieces=[];
          if(pc.t0<left)pieces.push({...pc,t1:left});
          pieces.push({...pc,t0:left,t1:right,yLow:top});
          if(right<pc.t1)pieces.push({...pc,t0:right});
          return pieces;
        });
      }
    }
  }
}
