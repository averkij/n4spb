// Krestovsky Ostrov: stone arcade crossing a bronze-framed dark glass cube.
// Surveyed photograph and OSM plan: docs/research/krestovsky-2026.md.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { polyBounds, addPolyColliders, MeshBuilder, addWalls, addCap } from '../lib/massing.js';
import { safeSpot } from '../landmarksVictoryPark/kit.js';

export function pavilion(ctx,P,M,svc) {
  const b=CITY.BUILDINGS.find(b=>b.id==='w44389559');
  if(!b?.polys?.length)return;
  const bb=polyBounds(b.polys[0]),w=Math.min(bb.w,bb.d)*.66,d=w,rot=Math.PI/4;
  // Raised stylobate follows the mapped compound footprint, never the AABB
  // corners outside it. A footprint ring is also used by the roof-map pass.
  const podium=new MeshBuilder();
  for(const poly of b.polys){addWalls(podium,poly.o.reduce((a,v,i)=>{if(i%2===0)a.push([v,poly.o[i+1]]);return a;},[]),.12,.79);addCap(podium,poly,.79);}
  const pm=new THREE.Mesh(podium.build(),M.granite);pm.name='krestovsky-metro-stylobate';pm.castShadow=pm.receiveShadow=true;ctx.addStatic(pm);
  P.push(bb.cx,0,bb.cz);
  // OSM traces the rotated glass cube. The photograph shows the external
  // stone arcade's square stylobate extending beyond those diagonal sides.
  // Its final whole footprint is checked, and its rendered top has matching support.
  const platformW=bb.w*1.02,platformD=bb.d*1.02,hasPlatform=safeSpot(ctx,bb.cx,bb.cz,platformW,platformD);
  if(hasPlatform){
    P.box(M.granite,0,.365,0,platformW,.73,platformD,1100);
    ctx.physics.addWalkBox(bb.cx,bb.cz,platformW,platformD,0,.73,0);
  }
  P.push(0,0,0,rot);
  P.box(M.glass,0,5.95,0,w,10.3,d,Infinity);
  P.box(M.bronze,0,11.2,0,w+.25,.23,d+.25,1100);
  for(const face of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    P.push(0,0,0,face);
    for(let i=0;i<=8;i++)P.box(M.bronze,-w/2+i*w/8,5.97,d/2+.035,.12,10.4,.12,750);
    for(const y of [1.1,4.25,7.6,11.1])P.box(M.bronze,0,y,d/2+.045,w,.12,.12,750);
    P.pop();
  }
  P.pop();
  const sw=bb.w,sd=bb.d;
  for(const face of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const len=(face===0||face===Math.PI)?sw:sd,spacing=(len-1.6)/3,front=(face===0||face===Math.PI)?sd/2:sw/2;
    P.push(0,0,0,face);
    const key='metro-arcade-'+len.toFixed(3),g=P.geometry(key,()=>{
      const sh=new THREE.Shape();sh.moveTo(-len/2,.79);sh.lineTo(len/2,.79);sh.lineTo(len/2,7.05);sh.lineTo(-len/2,7.05);sh.closePath();
      for(let i=0;i<3;i++){
        const x=-len/2+.8+(i+.5)*spacing,r=(spacing-1.55)/2,hole=new THREE.Path();
        hole.moveTo(x-r,.79);hole.lineTo(x-r,4.1);
        for(let j=0;j<=24;j++){const a=Math.PI-j*Math.PI/24;hole.lineTo(x+r*Math.cos(a),4.1+2.3*Math.sin(a));}
        hole.lineTo(x+r,.79);hole.closePath();sh.holes.push(hole);
      }
      const geo=new THREE.ExtrudeGeometry(sh,{depth:.86,bevelEnabled:false,curveSegments:18});geo.translate(0,0,-.43);return geo;
    });
    P.shape(key,g,M.stone,0,0,front,1,1,1,0,0,0,1100);
    for(let i=0;i<4;i++){
      const x=-len/2+.8+i*(len-1.6)/3;
      P.box(M.stone,x,3.25,front,1.55,5,.98,1000);
      P.box(M.stoneShade,x,5.36,front,1.8,.25,1.05,600);
      P.box(M.stone,x,5.60,front,2,.22,1.1,850);
      P.box(M.stone,x,6.86,front,2,.38,1.25,850);
      const px=bb.cx+Math.cos(face)*x+Math.sin(face)*front,pz=bb.cz-Math.sin(face)*x+Math.cos(face)*front;
      ctx.physics.addBox(px,pz,1.55,.85,face,.79,5.8);
    }
    P.box(M.stone,0,7.35,front,len+1,.63,1.22,1100);
    P.box(M.stoneShade,0,7.0,front+.07,len+.4,.12,1.33,850);
    if(face===0)P.label(M.names,0,7.34,front+.685,len*.57,.42,b.id,0,650,1);
    P.pop();
  }
  P.pop();
  // Only emit approach steps when their entire final footprint clears asphalt.
  const stepZ=bb.cz+sd/2+2.15;
  if(hasPlatform&&safeSpot(ctx,bb.cx,stepZ,sw*.67,3.8)){
    for(let i=0;i<7;i++)P.box(M.granite,bb.cx,(i+1)*.055,stepZ+1.56-i*.52,sw*.67,(i+1)*.11,.52,650);
    ctx.physics.addStairs(bb.cx,stepZ,sw*.67,3.64,Math.PI,0,.77,7);
  }
  // Glass cube has a complete closed envelope; open exterior stone bays are intentional.
  const c=Math.cos(rot),s=Math.sin(rot),ring=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[bb.cx+c*u+s*v,bb.cz-s*u+c*v]).flat();
  addPolyColliders(ctx,{o:ring,h:[]},.79,11.2,.22);
  svc.monuments.push({id:b.id,name:'Павильон «Крестовский остров»',x:bb.cx,z:bb.cz,h:11.3});
  svc.pavilion={id:b.id,x:bb.cx,z:bb.cz,w:bb.w,d:bb.d};
  const photo={x:bb.cx-4,z:bb.cz+48,yaw:0,name:'Аркада павильона «Крестовский остров»'};
  if(!ctx.L.insideBuilding(photo.x,photo.z,1)&&!ctx.L.isOnRoad(photo.x,photo.z,.5))svc.photoSpots.push(photo);
}
