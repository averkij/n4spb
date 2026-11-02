// Mapped fountains without a specialist model. Preserve surveyed basin rings
// and dry holes, register reachable shallow water, and share the city's live
// spray controller. Explicit specialist IDs stay with their owner even in an
// isolated props preview; claiming a whole park alone is not a fountain model.
import * as L from '../layout.js';
import * as CITY from '../data/city.js';
import * as AREA from '../area.js';
import * as THREE from 'three';
import { Parts, ringEdges, onEdge } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { liveFountain } from '../lib/live-fountain.js';

export const SPECIALIST_FOUNTAINS = Object.freeze({
  w101292107:'landmarksF',n2306201359:'landmarksF',
  w311015864:'landmarksGarden',w311015863:'landmarksGarden',w311015869:'landmarksGarden',w311015870:'landmarksGarden',w311015874:'landmarksGarden',w353713496:'landmarksGarden',n3165417100:'landmarksGarden',n4255789212:'landmarksGarden',
  w214409235:'landmarksAndrew',w214409237:'landmarksAndrew',w84045811:'landmarksMenshikov',w84045881:'landmarksMenshikov',
  r10573022:'landmarksNikolsky',r10573023:'landmarksNikolsky',n12201012355:'landmarksVOStatues',n5808194383:'landmarksVOStatues',
  w1396274666:'landmarksDekabristov',r5255799:'landmarksOkrug65',w32073130:'landmarksMoskovskayaPark',n10245075680:'landmarksTroitskaya',w1109059112:'landmarksKarpovka',
  w74168797:'landmarksH',n950150577:'landmarksTauride',w1501496505:'landmarksTauride',w1501496506:'landmarksTauride',
  w31523998:'landmarksMoskovskaya',w134429977:'landmarksMoskovskaya',
});
// The source dossier describes Latona as a sculpture in a niche, explicitly
// not an operating fountain. Keep that fact if a future data cut includes it.
export const NON_FOUNTAINS = Object.freeze({n4353687690:'Latona niche sculpture'});
const pairs=r=>Array.from({length:r.length/2},(_,i)=>[r[i*2],r[i*2+1]]);
const circle=(x,z,r)=>Array.from({length:24},(_,i)=>[x+Math.cos(i*Math.PI/12)*r,z+Math.sin(i*Math.PI/12)*r]).flat();
const insideRing=(x,z,r)=>{let yes=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const ax=r[i],az=r[i+1],bx=r[j],bz=r[j+1];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)yes=!yes;}return yes;};
const contains=(p,x,z)=>insideRing(x,z,p.o)&&!(p.h||[]).some(h=>insideRing(x,z,h));
const bounds=p=>{const xs=p.o.filter((_,i)=>i%2===0),zs=p.o.filter((_,i)=>i%2);return {x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)};};
const distance=(p,x,z)=>{let d=Infinity;for(const r of[p.o,...(p.h||[])])for(let i=0;i<r.length;i+=2){const ax=r[i],az=r[i+1],dx=r[(i+2)%r.length]-ax,dz=r[(i+3)%r.length]-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-ax-t*dx,z-az-t*dz));}return d;};

export function mappedFountains(city=CITY){
  const sites=new Map();
  for(const f of[...(city.FOUNTAINS||[]),...(city.WATER||[]).filter(w=>w.kind==='fountain')]){
    const old=sites.get(f.id),polys=(f.polys?.length?f.polys:old?.polys)||[];
    const p=polys[0],b=p?bounds(p):null;
    sites.set(f.id,{...old,...f,polys,x:f.x??old?.x??(b.x0+b.x1)/2,z:f.z??old?.z??(b.z0+b.z1)/2});
  }
  return [...sites.values()];
}

function nozzlePoints(poly){
  const b=bounds(poly),points=[];
  for(let i=0;i<7;i++)for(let j=0;j<7;j++){
    const x=b.x0+(b.x1-b.x0)*(i+.5)/7,z=b.z0+(b.z1-b.z0)*(j+.5)/7;
    if(contains(poly,x,z))points.push({x,z,d:distance(poly,x,z)});
  }
  // Triangulation supplies an interior fallback for very narrow/concave
  // basins whose centre or regular sample grid may fall on dry ground.
  const contour=pairs(poly.o).map(p=>new THREE.Vector2(...p)),holes=(poly.h||[]).map(r=>pairs(r).map(p=>new THREE.Vector2(...p))),all=[...contour,...holes.flat()];
  for(const tri of THREE.ShapeUtils.triangulateShape(contour,holes)){
    let x=0,z=0;for(const i of tri){x+=all[i].x/3;z+=all[i].y/3;}
    if(contains(poly,x,z))points.push({x,z,d:distance(poly,x,z)});
  }
  points.sort((a,b)=>b.d-a.d);
  const picked=[],spacing=Math.max(.7,Math.min(b.x1-b.x0,b.z1-b.z0)/4);
  for(const p of points){if(p.d<.55&&picked.length)continue;if(picked.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>spacing))picked.push(p);if(picked.length===16)break;}
  return picked;
}

export function placeFountains(S,city=CITY,layout=L){
  const {ctx}=S,ph=ctx.physics,P=new Parts(),sites=mappedFountains(city),records=[];
  const ownerModules=AREA.MODULES||layout.MODULE_KEYS||[];
  const stone=ctx.mat.toon('#8e8c85',{paint:.025}),water=ctx.mat.toon('#426e7b',{paint:.01,emissive:'#224e63',emissiveIntensity:.08});
  const allPolys=sites.filter(f=>f.polys.length),playgrounds=(city.FURNITURE||[]).filter(f=>f.kind==='playground');
  const stats={mapped:sites.length,animated:0,specialist:0,aliases:0,outside:0,excluded:0,basins:0,flush:0,reused:0,triangles:0};
  for(const f of sites){
    const record={id:f.id,x:f.x,z:f.z,group:layout.groupOf?.(f.id)||null,owner:null,status:null,basins:0};records.push(record);
    if(!layout.inPlay(f.x,f.z)){record.status='outside';stats.outside++;continue;}
    if(NON_FOUNTAINS[f.id]){record.status='not-fountain';record.reason=NON_FOUNTAINS[f.id];stats.excluded++;continue;}
    if(SPECIALIST_FOUNTAINS[f.id]&&ownerModules.includes(SPECIALIST_FOUNTAINS[f.id])){record.status='specialist';record.owner=SPECIALIST_FOUNTAINS[f.id];stats.specialist++;continue;}
    // A separately mapped nozzle node inside a surveyed pool is the same
    // fountain. Keep an explicit alias so the coverage audit can resolve it.
    const alias=!f.polys.length&&allPolys.find(g=>g.id!==f.id&&layout.inPlay(g.x,g.z)&&g.polys.some(p=>contains(p,f.x,f.z)));
    if(alias){record.status='alias';record.alias=alias.id;stats.aliases++;continue;}
    const pointOnly=!f.polys.length,polys=pointOnly?[{o:circle(f.x,f.z,1.4),h:[]}]:f.polys;
    if(pointOnly&&playgrounds.some(p=>Math.hypot(p.x-f.x,p.z-f.z)<2.4)){
      record.status='playground';record.reason='mapped point coincides with playground equipment';stats.excluded++;continue;
    }
    // A mapped nozzle near a service lane may be a dry deck fountain, and
    // the source road envelope can overlap the edge of a surveyed basin.
    // Preserve that site as flush spray over its existing street surface;
    // never invent raised coping/floor/water polygons across asphalt.
    record.flush=polys.some(p=>[...pairs(p.o),[f.x,f.z]].some(([x,z])=>ctx.services.streets?.net?ctx.services.streets.net.cover(x,z,{})>=-.1:layout.isOnRoad?.(x,z,-.1)));
    if(record.flush){record.reason='mapped fountain meets road envelope; existing street surface retained';stats.flush++;}
    record.owner='props';record.status='animated';record.effects=[];
    for(const [pi,p]of polys.entries()){
      if(!p.o||p.o.length<6)continue;
      const points=nozzlePoints(p);if(!points.length)continue;
      const b=bounds(p),cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,r=Math.max(.4,Math.min(b.x1-b.x0,b.z1-b.z0)/2);
      const known=ph.waterLevel(points[0].x,points[0].z),base=S.levelAt?.(cx,cz)??0,y=known??base+(record.flush ? .035 : .09);
      if(known===null&&record.flush){
        ph.addWater({ring:p.o,holes:p.h||[],level:y});
      }else if(known===null){
        const ring=pairs(p.o),holes=(p.h||[]).map(pairs);
        P.cap(stone,ring,base+.025,true,2,holes);P.cap(water,ring,y,true,3,holes);
        // Exact floor triangles retain every hole. No solid basin cylinder,
        // wall of water or blanket collider is introduced by this fallback.
        const floor=new Parts();floor.cap(stone,ring,base+.025,true,2,holes);
        for(const k of floor.b.values())for(let i=0;i<k.idx.length;i+=3)ph.addWalkTriangle([0,1,2].map(j=>{const at=k.idx[i+j]*3;return k.pos.slice(at,at+3);}),.14);
        ph.addWater({ring:p.o,holes:p.h||[],level:y});
        for(const e of ringEdges(p)){
          onEdge(P,e,len=>P.box(stone,0,len,base,base+.18,0,.18));
          const x=(e.a[0]+e.b[0])/2+e.n[0]*.09,z=(e.a[1]+e.b[1])/2+e.n[1]*.09,rot=Math.atan2(-(e.b[1]-e.a[1]),e.b[0]-e.a[0]);
          const it=ph.addWalkBox(x,z,e.len,.18,rot,base+.18,base);it.sticky=true;
        }
        record.basins++;stats.basins++;
      }else stats.reused++;
      const height=Math.max(1.1,Math.min(4,r*.52)),nozzles=points.map((q,i)=>({x:q.x-cx,z:q.z-cz,height:height*(i? .55+.35*(i%3)/2:1),width:r>5?.04:.025,target:[q.x-cx,0,q.z-cz]}));
      const effect=liveFountain(ctx,{id:`mapped-${f.id}-${pi}`,x:cx,z:cz,y,r,height,nozzles});
      record.effects.push({id:effect.id,x:cx,z:cz,y,geometry:known!==null?'existing':record.flush?'flush':'basin',points:points.map(q=>[q.x,q.z]),jets:nozzles.length});
      S.occupy?.(cx,cz,r+.3,'fountain');
    }
    if(record.effects.length)stats.animated++;
    else {record.status='invalid-polygon';record.reason='mapped polygon has no water interior';stats.excluded++;}
  }
  for(const m of P.build(S.root,{name:'pr-mapped-fountains'})){if(m.material===water)ctx.noOutline(m);m.updateMatrixWorld(true);registerLOD(m,500);}
  stats.triangles=P.tris;S.tris=(S.tris||0)+P.tris;S.svc.fountains=records;S.stats.fountains=stats;
  return ctx.services.fountainCoverage={records,stats};
}
