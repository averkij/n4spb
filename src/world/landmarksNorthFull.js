// Mapped central-north landmarks: the FULL copy of the source module landmarksNorth (102_3d_piter, src/world/landmarksNorth.js + landmarksNorth/{bookstore,muruzi,groups}.js),
// pinned to the source commit 0568f7af (the same commit as the data of the North, docs/AREAS-DATA.md). It draws five parts: the Spaso-Preobrazhensky cathedral, the Podpisnye
// Izdaniya bookstore, the Chernyshevskaya metro vestibule (with the ЧЕРНЫШЕВСКАЯ sign), the corridor houses (14 addresses) and Dom Muruzi. It is used by the North (src/areas/north/area.js).
// The Nevsky strip keeps its OWN trimmed copy, src/world/landmarksNorth.js (the bookstore and the 5 corridor addresses that lie in the strip data): the strip's scene and its bake
// must not drift, and the cathedral, the vestibule and Dom Muruzi are far outside the strip. The functions corridor() and bookstore() are the same text in both modules (the 200 m
// band of the North looks like the strip); the group KEYS and ids are the same too, so a claim is the same in both areas. Research and approximation limits in
// docs/research/north-corridor.md. All custom solids have closed geometry. Renamed from the source: the import paths (./landmarksNorthFull/...), root.name and the ctx.services key.
// M7 (docs/AREAS.md section 10): the captured-cannon fence of the cathedral is knockable (landmarksNorthFull/fence.js: piers and chain spans as ctx.knock instances with colliders, the strip's
// pattern), the three signs of the vestibule glow at night (litFascia: the sign texture as its emissive map on the kit's uNight list, like the strip's lit signs), the module publishes the door
// points of its claimed buildings (lib/door-points.js, from the facade's entrance nodes) and merges its monuments / photo spots into ctx.services.landmarks like the strip's modules.
import * as THREE from 'three';
import { ENTRANCES } from './data/city.js';
import { addPavilionEntrance } from './lib/metro-pavilion-entrance.js';
import { localOnEdge, frameOf } from './landmarksD/kit.js';
import { addPolyColliders } from './lib/massing.js';
import * as L from './layout.js';
import { makeKit } from './landmarksD/common.js';
import { buildHouse } from './landmarksD/house.js';
import { bookstore } from './landmarksNorthFull/bookstore.js';
import { muruzi } from './landmarksNorthFull/muruzi.js';
import { dome, drum, cross, ringWindows, roundCornice, portico } from './landmarksD/parts.js';
import { CORRIDOR_ADDRESSES, GROUPS_LIST } from './landmarksNorthFull/groups.js';
import { cannonFence } from './landmarksNorthFull/fence.js';
import { doorPoints } from './lib/door-points.js';
export const OWNS_GROUPS = true;

function cathedral(K) {
  const recs = L.groupMembers('north-preobrazhensky'); if (!recs.length) return;
  const b = recs.find(b=>!b.part)||recs[0], cx=b.cx, cz=b.cz, P=K.P,M=K.mats, wall=K.wall('#e4ca88');
  // OSM includes the open west portico. Remove its two projecting corners
  // from the closed nave shell, then restore that footprint with columns.
  const navePolys = rec => rec.polys.map(poly=>({ ...poly, o:poly.o.filter((v,i)=>{
    const x=poly.o[i-i%2]; return x>=cx-18;
  }) }));
  buildHouse(K,{recs,polysOf:navePolys,hc:16.8,wall:'#e4ca88',railing:false,roofMat:M.roofDark,plinth:0.7,
    front:(e,{len})=>{
      K.wallQuad(wall,0,len,0,17.25,3);
      if(len<4)return true;
      const n=Math.max(1,Math.round(len/6.6));
      for(let i=0;i<n;i++){
        const x=(i+.5)*len/n;
        K.window({x,y:2.4,w:2.15,h:7.6,head:'arch',sw:.29,d:.17,frame:'white'});
        K.balustrade(x-1.1,x+1.1,2.4,.8,.4);
        K.plaque(M.cream,x,12.6,Math.min(3.6,len/n-.5),1.2,.12);
        for(let j=-2;j<=2;j++) P.geo(M.trim,new THREE.SphereGeometry(.22,6,4),x+j*.44,13.2,.2,0,0,0,1,1.4,.35);
      }
      return true;
    }});
  P.push(cx,0,cz);
  // Main west portico; four Ionic columns, with capped entablature and door.
  P.push(-15.1,0,0,-Math.PI/2);
  portico(K,{x0:-8.2,x1:8.2,depth:6.1,y0:.3,y1:13.8,r:.72,xs:[-7.1,-2.37,2.37,7.1],ent:2.0,ped:3.0,wallMat:wall,steps:false});
  P.quad(M.trim,[-8.2,13.8,0],[8.2,13.8,0],[8.2,13.8,7.33],[-8.2,13.8,7.33],[0,-1,0]);
  for(const u of [-7.1,-2.37,2.37,7.1])K.ctx.physics.addCylinder(cx-21.2,cz+u,.76,.3,13.8);
  P.box(M.doorWood,-1.45,1.45,.14,5.8,-.1,.18);
  for(const x of [-1.2,0,1.2]) P.box(M.cream,x-.07,x+.07,.2,5.85,.2,.27);
  P.pop();
  // Low central drum and broad dark dome; four narrower bell turrets.
  drum(K,wall,0,0,17.3,25.2,10.0,32);
  ringWindows(K,0,0,10.02,12,{x:0,y:19,w:1.6,h:4.3,head:'arch',sw:.18,frame:'white'},0,32);
  roundCornice(K,M.trim,M.cream,0,0,25.2,10.2,1.0);
  dome(K,M.roofDark,0,26.2,0,10.35,.95);
  const seams=K.wall('#626763'),profile=[[1,.1],[.97,.38],[.86,.66],[.66,.9],[.4,1.06],[.15,1.15],[0,1.18]];
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12;let prev;
    for(const [r,y] of profile){const q=[(r*10.35+.035)*Math.cos(a),26.2+y*10.35*.95,(r*10.35+.035)*Math.sin(a)];if(prev)P.cyl(seams,prev,q,.04,.04,5,true);prev=q;}
  }
  drum(K,M.cream,0,0,37.4,39.0,.7,12); dome(K,M.brass,0,39,0,.8,.65); cross(K,M.brass,0,39.65,0,1.85);
  for(const x of [-11.6,11.6])for(const z of [-11.6,11.6]){
    drum(K,wall,x,z,17.3,20.5,4.1,24); roundCornice(K,M.trim,M.cream,x,z,20.5,4.3,.6);
    drum(K,wall,x,z,21.1,28,3.3,24);
    ringWindows(K,x,z,3.32,4,{x:0,y:22,w:2,h:4.9,head:'arch',sw:.25,frame:'white'});
    roundCornice(K,M.trim,M.cream,x,z,28,3.5,.7); dome(K,M.roofDark,x,28.7,z,3.8,.9); cross(K,M.brass,x,32.5,z,2.2);
  }
  // Captured-cannon fence: each pier is three bronze barrels, joined by chains.
  // Leave the four approach paths open. No broad coplanar paving is added.
  // M7: the 32 piers and the 24 chain spans (48 strands) are knockable instances with colliders (landmarksNorthFull/fence.js), the same geometry the merged part drew before.
  K.extraTris+=cannonFence(K,cx,cz);
  P.pop();
}

/** a sign fascia whose plate GLOWS at night (M7, the M5 GPU QA finding 5: the vestibule signs stayed dark): the sign texture is its own emissive map and the material follows ctx.shared.uNight through the
 *  kit's night list (K.nightMats, landmarksD/common.js), the pattern of the strip's lit signs (landmarksA/tickets.js, landmarksA/mall.js signMat: emissiveMap = map). By day it is K.fascia: the same texture
 *  key (lmD-sign|text|...), the same plane, no transparency. */
function litFascia(K,x0,x1,y0,y1,text,o={}){
  const map=K.signTex(text,{w:o.w||512,h:o.h||96,bg:o.bg,fg:o.fg,font:o.font,weight:o.weight,size:o.size,align:o.align,fill:o.fill});
  const mat=K.ctx.mat.toon('#ffffff',{map,name:'lmD-sign-lit'});
  mat.emissive=new THREE.Color('#ffffff');mat.emissiveMap=map;mat.emissiveIntensity=0;K.nightMats.push(mat);
  K.plane(mat,x0,x1,y0,y1,o.z??0.1);
}


function metro(K){
  const recs=L.groupMembers('north-chernyshevskaya');if(!recs.length)return;
  const M=K.mats,P=K.P,wall=K.wall('#c4b7a2');
  const doors=ENTRANCES.filter(d=>d.bldg==='w22999175').map(d=>({...d,w:5.1}));
  const entryAt=e=>doors.map(d=>({...d,...localOnEdge(e,d.x,d.z)})).find(d=>Math.abs(d.d)<.55 && d.u>0 && d.u<e.len);
  buildHouse(K,{recs,collide:false,noPlinth:e=>!!entryAt(e),hc:9.0,wall:'#c4b7a2',roofMat:M.roofDark,railing:false,plinth:1.0,corniceScale:.55,
    front:(e,{len})=>{
      const d=entryAt(e);
      if(d){
        const f=frameOf(e),center=d.u,a=center-d.w/2,b=center+d.w/2;
        const glass=K.ctx.mat.toon('#789597',{paint:.03});
        K.wallQuad(wall,0,a,0,9.45,3);K.wallQuad(wall,b,len,0,9.45,3);
        K.wallQuad(wall,a,b,3.02,9.45,3);
        const w=Math.min(len-1,Math.min(center,len-center)*2-.65,12);
        K.plane(glass,center-w/2,center+w/2,3.03,6.9,.07);
        for(let i=0;i<=8;i++){const x=center-w/2+i*w/8;P.box(M.graniteDark,x-.04,x+.04,3.0,7.0,.10,.19);}
        for(const y of [3.03,4.9,6.82])P.box(M.graniteDark,center-w/2,center+w/2,y,y+.08,.10,.20);
        for(const x of [a-.2,b+.2])P.box(M.graniteDark,x-.16,x+.16,.08,3.05,.02,.24);
        addPavilionEntrance(K.ctx,{id:d.id,x:f.x+f.xa[0]*center,z:f.z+f.xa[1]*center,rotY:f.rot,
          w:d.w,y:.12,h:2.92,leaves:6,style:'oak',lobby:true});
        litFascia(K,center-4.8,center+4.8,7.85,8.4,'ЧЕРНЫШЕВСКАЯ',{bg:'#c4b7a2',fg:'#454a45',size:.7,z:.2});
        litFascia(K,center-3,center+3,8.48,8.82,'МЕТРОПОЛИТЕН',{bg:'#c4b7a2',fg:'#454a45',size:.55,z:.2});
        litFascia(K,center-.65,center+.65,9.55,10.8,'М',{w:128,h:128,bg:'#d4d2c4',fg:'#1889bd',size:.86,z:.22});
      }else{
        K.wallQuad(wall,0,len,0,9.45,3);
        const n=Math.floor(len/4);for(let i=0;i<n;i++)K.window({x:(i+.5)*len/n,y:3,w:1.8,h:3.8,sw:.12,frame:'brown'});
      }
      return true;
    }});
  for(const rec of recs)for(const poly of rec.polys)addPolyColliders(K.ctx,poly,0,10,.9,doors);
}

function corridor(K){
  const M=K.mats,P=K.P;
  for(const b of L.groupMembers('north-corridor-houses')){
    const cfg=CORRIDOR_ADDRESSES.find(([s,n])=>b.addr?.street===s&&b.addr?.no===n),color=cfg?.[2]||'#d2c2aa';
    const hc=L.heightOf(b),wall=K.wall(color),floors=Math.max(3,b.levels||5);
    buildHouse(K,{recs:[b],hc,wall:color,court:'#bcb4a3',railing:false,plinth:.9,
      front:(e,{len})=>{
        const mx=(e.a[0]+e.b[0])/2,mz=(e.a[1]+e.b[1])/2;
        const near=L.nearestRoad(mx+e.n[0]*4,mz+e.n[1]*4,{named:true,maxDist:18});
        if(!near||len<9)return false;
        K.wallQuad(wall,0,len,0,hc+.45,3);
        const n=Math.max(2,Math.round(len/3.3)),pitch=len/n,fh=(hc-4.1)/(floors-1);
        K.shopfront(.5,len-.5,{y0:.45,y1:3.4,pitch:6,doors:[0],names:[],pier:1.4});
        for(let f=1;f<floors;f++)for(let i=0;i<n;i++){
          const x=(i+.5)*pitch,y=4.4+(f-1)*fh;
          K.window({x,y,w:1.35,h:Math.min(2.35,fh-.7),head:f===1?'arch':'flat',sw:f===1?.19:.13,d:.12,frame:'white'});
          if(f===1&&i%3===1)K.balcony(x-1.05,x+1.05,y-.24,.65);
          if(f===2&&i%3===0)K.plaque(M.cream,x,y+2.45,1.6,.3,.12);
        }
        for(const x of [.25,len-.25]){K.pilaster(M.cream,x,.45,4,hc-5,.12,.3);K.downpipe(x+.25,.3,hc-.7);}
        P.box(M.cream,0,len,3.75,3.95,.02,.22);
        K.fascia(.7,Math.min(4.7,len-.7),3.0,3.5,b.addr.street.replace('улица ','УЛ. ').toUpperCase(),{bg:'#273e59',fg:'#e6e7db',size:.56,z:.23});
        return true;
      }});
  }
}

export function build(ctx){
  const K=makeKit(ctx),root=new THREE.Group();root.name='landmarksNorthFull';
  K.svc={houses:[],entrances:[],monuments:[],photoSpots:[]};K.extraTris=0;
  for(const [name,fn] of [['preobrazhensky',cathedral],['podpisnye',bookstore],['chernyshevskaya',metro],['corridor',corridor],['muruzi',muruzi]]){K.begin();fn(K);K.flush(root,'north-'+name);}
  ctx.addStatic(root);
  // M7: the door points of every claimed building (lib/door-points.js: the facade's entrance nodes, else the city's parade-door rule) and the merge into the shared landmark services,
  // as the strip's modules do (landmarksD.js:41); the service also lists the instanced triangles of the knockable fence (extraTris) as it listed the merged one
  K.svc.entrances.push(...doorPoints(GROUPS_LIST.flatMap((g)=>L.groupMembers(g.key))));
  const S=(ctx.services.landmarks||={});
  S.monuments=(S.monuments||[]).concat(K.svc.monuments);S.photoSpots=(S.photoSpots||[]).concat(K.svc.photoSpots);
  ctx.services.landmarksNorthFull={triangles:K.tris+K.extraTris,groups:GROUPS_LIST.map(g=>g.key),houses:K.svc.houses,entrances:K.svc.entrances,monuments:K.svc.monuments,photoSpots:K.svc.photoSpots};
}
