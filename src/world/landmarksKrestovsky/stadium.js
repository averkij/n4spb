// Gazprom Arena's recognisable 290 m saucer, eight splayed structural pylons,
// pale ETFE shutters and glazed colonnade. Primary roof contractor photograph
// and operator dimensions: docs/research/krestovsky-2026.md. No flags/logos.
// 2026-10-13: 16 visitor stair flights up to the plinth (plinth-stairs.js) and a granite apron round the arena (plaza.js); the plinth wall starts at the ground.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { polyBounds, addPolyColliders, MeshBuilder, addPrism, ringFromFlat } from '../lib/massing.js';
import { safeSpot } from '../landmarksVictoryPark/kit.js';
import { plinthSupport } from './plinth-support.js';
import { plinthStairs } from './plinth-stairs.js';
import { plaza } from './plaza.js';

export function stadium(ctx,P,M,svc) {
  const b=CITY.BUILDINGS.find(b=>b.id==='r8841754'),main=CITY.BUILDINGS.find(b=>b.id==='r8846006');
  if(!b?.polys?.length)return;
  if(!main?.polys?.length)throw new Error('Missing Krestovsky stadium main oval part');
  const bb=polyBounds(main.polys[0]),rx=bb.w/2,rz=bb.d/2;
  if(rx<90||rz<90)throw new Error('Krestovsky arena footprint is incomplete');
  P.push(bb.cx,0,bb.cz);
  const ring=(key,profile,mat,far=Infinity)=>{
    const geo=P.geometry(key,()=>{const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r*rx,y)),96);g.scale(1,1,rz/rx);return g;});
    P.shape(key,geo,mat,0,0,0,1,1,1,0,0,0,far);
  };
  // Profiles carry metre dimensions; no kilometre-radius aggregate instance bound.
  ring('arena-plinth',[[.72,0],[.90,0],[.90,1.15],[.72,1.15]],M.granite,1300);   // wall starts at the ground (was y .18: a gap under the plinth edge)
  const plinth=plinthSupport(ctx,bb,rx,rz);
  const stairs=plinthStairs(ctx,P,M,bb,rx,rz);   // 16 walkable flights up to the plinth (2026-10-13)
  ring('arena-closed-envelope',[[.76,1.15],[.76,43]],M.glass);
  ring('arena-saucer',[[.56,61.2],[.76,57.2],[.95,47.3],[1,47.6],[1,50],[.94,52],[.75,60],[.56,64]],M.silver);
  ring('arena-fascia',[[.998,47.8],[1.006,47.8],[1.006,50],[.998,50]],M.white);
  for(const y of [12,23,34,42])ring('arena-belt-'+y,[[.7605,y],[.775,y],[.775,y+.4],[.7605,y+.4]],M.steel,1050);
  // Broad circular colonnade, with alternating glazing bays and mullion frames.
  for(let i=0;i<80;i++){
    const a=i*Math.PI/40,c=Math.cos(a),s=Math.sin(a),x=c*rx*.89,z=s*rz*.89;
    if(!safeSpot(ctx,bb.cx+x,bb.cz+z,2.2,2.2))throw new Error('Stadium structural column intersects asphalt at bay '+i);
    P.beam(M.stone,[x,1.15,z],[c*rx*.94,47.5,s*rz*.94],.95,1500);
    P.beam(M.bronze,[c*rx*.761,1.4,s*rz*.761],[c*rx*.761,42.9,s*rz*.761],.12,750);
    ctx.physics.addCylinder(bb.cx+x,bb.cz+z,1.05,0,47.5);
  }
  // Eight conical structural roof supports; their silhouette is permanent.
  for(let i=0;i<8;i++){
    const a=Math.PI/8+i*Math.PI/4,c=Math.cos(a),s=Math.sin(a),foot=[c*rx*.75,59,s*rz*.75],top=[c*rx*.86,110,s*rz*.86];
    const d=new THREE.Vector3(...top).sub(new THREE.Vector3(...foot)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),e=new THREE.Euler().setFromQuaternion(q);
    const geo=P.geometry('arena-tapered-pylon',()=>new THREE.CylinderGeometry(.22,1.45,d.length(),10));
    P.shape('arena-tapered-pylon',geo,M.white,(foot[0]+top[0])/2,(foot[1]+top[1])/2,(foot[2]+top[2])/2,1,1,1,e.x,e.y,e.z,Infinity);
    for(const delta of [-.28,-.13,.13,.28]){
      const ta=a+delta;P.beam(M.steel,top,[Math.cos(ta)*rx*.97,51,Math.sin(ta)*rz*.97],.095,1800);
    }
    P.beam(M.steel,top,[c*rx*.56,64,s*rz*.56],.095,1800);
  }
  // Two raised membrane leaves parked apart for a summer open-roof view.
  for(const side of [-1,1]){
    const key='arena-etfe-leaf-'+side,geo=P.geometry(key,()=>{
      const pos=[],uv=[],indices=[],nu=22,nv=36;
      for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
        const z=(j/nv*2-1)*rz*.73,half=rx*.73*Math.sqrt(Math.max(0,1-(z/(rz*.73))**2));
        const x=side*(28+(Math.max(28,half)-28)*i/nu),y=64+11*Math.sqrt(Math.max(0,1-(x/(rx*.85))**2-(z/(rz*.85))**2));
        pos.push(x,y,z);uv.push(i/nu,j/nv);
      }
      for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+2,d=a+nu+1;if(side>0)indices.push(a,d,b,b,d,c);else indices.push(a,b,d,b,c,d);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
    });
    P.shape(key,geo,M.white,0,0,0,1,1,1,0,0,0,Infinity);
    for(let j=-15;j<=15;j++){
      const z=j*rz*.73/18,half=rx*.73*Math.sqrt(Math.max(0,1-(z/(rz*.73))**2)),x1=side*28,x2=side*Math.max(28,half);
      const h=x=>64.12+11*Math.sqrt(Math.max(0,1-(x/(rx*.85))**2-(z/(rz*.85))**2));
      P.beam(M.silver,[x1,h(x1),z],[x2,h(x2),z],.12,1200);
    }
  }
  // Aerial-visible bowl; rows are coloured bands, not thousands of seat meshes.
  ring('arena-bowl',[[.70,42],[.64,40],[.54,29],[.46,18],[.35,6],[.29,2]],M.seats);
  for(let i=0;i<22;i++){const r=.35+i*.015;ring('arena-seat-row-'+i,[[r+.006,6.10+i*1.65],[r,6.10+i*1.65],[r,6+i*1.65]],M.dark,700);}
  P.box(M.pitch,0,.21,0,68,.20,105,1100);
  for(let i=0;i<10;i++)if(i%2===0)P.box(M.pitchLight,0,.325,-47.25+i*10.5,67.9,.025,10.4,850);
  for(const x of [-34,34])P.box(M.white,x,.36,0,.12,.025,105,800);
  for(const z of [-52.5,0,52.5])P.box(M.white,0,.36,z,68,.025,.12,800);
  P.pop();
  const apron=plaza(ctx,M.plaza,bb,rx,rz);       // granite apron round the arena, clipped against asphalt / lawns / buildings (2026-10-13)
  // The mapped parent also includes the two eastern low Kirov-era wings and
  // the southern pitch deployment wing. Keep those real masses on their rings.
  for(const annex of CITY.BUILDINGS.filter(a=>a.parent===b.id&&a.id!==main.id)){
    const walls=new MeshBuilder(),roofs=new MeshBuilder(),h=annex.h||3.3;
    for(const poly of annex.polys){addPrism(walls,roofs,poly,.12,h,{bay:3.4,floor:3.3});addPolyColliders(ctx,poly,0,h,.25);}
    for(const [builder,mat] of [[walls,M.stone],[roofs,M.silver]])if(!builder.empty){const mesh=new THREE.Mesh(builder.build(),mat);mesh.name='krestovsky-arena-annex-'+annex.id;mesh.castShadow=mesh.receiveShadow=true;ctx.addStatic(mesh);}
    if(h>8)for(const poly of annex.polys){const ring=ringFromFlat(poly.o);for(let i=0;i<ring.length;i++){
      const a=ring[i],c=ring[(i+1)%ring.length],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<7)continue;
      const ux=(c[0]-a[0])/len,uz=(c[1]-a[1])/len,rot=Math.atan2(-uz,ux);
      for(let dist=2.7;dist<len-1.5;dist+=3.5)for(const y of [2.2,5.4,8.1]){
        const x=a[0]+ux*dist+uz*.06,z=a[1]+uz*dist-ux*.06;P.box(M.glass,x,y,z,1.3,1.6,.075,600,rot);
      }
    }}
  }
  const wall={o:Array.from({length:80},(_,i)=>{const a=i*Math.PI/40;return [bb.cx+Math.cos(a)*rx*.76,bb.cz+Math.sin(a)*rz*.76];}).flat(),h:[]};
  addPolyColliders(ctx,wall,0,43,.4);
  svc.monuments.push({id:b.id,name:'Стадион на Крестовском острове',x:bb.cx,z:bb.cz,h:110});
  svc.stadium={id:b.id,x:bb.cx,z:bb.cz,rx,rz,roofHeight:75,pylonHeight:110,plinth,stairs,apron};
  const photo={x:bb.cx+260,z:bb.cz+35,yaw:82,name:'Восемь пилонов стадиона на Крестовском'};
  if(!ctx.L.insideBuilding(photo.x,photo.z,1)&&!ctx.L.isOnRoad(photo.x,photo.z,.5))svc.photoSpots.push(photo);
}
