// Krestovsky Ostrov: stone arcade crossing a bronze-framed dark glass cube.
// Surveyed photograph and OSM plan: docs/research/krestovsky-2026.md.
import { addPavilionEntrance, entrancePoint } from '../lib/metro-pavilion-entrance.js';
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
  const portals=[];
  const entries=CITY.ENTRANCES.filter(e=>e.bldg===b.id);
  // Each side of the dark glass cube is independent. The public doors lie on the
  // opposed diagonal faces; the stone arcade and its square corners stay in place.
  P.box(M.bronze,0,11.2,0,w+.25,.23,d+.25,1100);
  for(const face of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    P.push(0,0,0,face);
    const angle=rot+face, nx=Math.sin(angle), nz=Math.cos(angle);
    const node=entries.find(q=>Math.abs((q.x-bb.cx)*nx+(q.z-bb.cz)*nz-d/2)<3.8);
    const u=node?(node.x-bb.cx)*nz-(node.z-bb.cz)*nx:0, gap=2.40;
    const spans=node ? [[-w/2,u-gap],[u+gap,w/2]] : [[-w/2,w/2]];
    for(const [a,b] of spans)P.box(M.glass,(a+b)/2,2.17,d/2,b-a,2.74,.18,1000);
    P.box(M.glass,0,7.32,d/2,w,7.55,.18,1000);
    for(let i=0;i<=8;i++) {
      const x=-w/2+i*w/8, low=node && Math.abs(x-u)<gap ? 3.54:.79;
      P.box(M.bronze,x,(low+11.15)/2,d/2+.035,.12,11.15-low,.12,750);
    }
    for(const y of [4.25,7.6,11.1])P.box(M.bronze,0,y,d/2+.045,w,.12,.12,750);
    for(const [a,b] of spans)P.box(M.bronze,(a+b)/2,1.1,d/2+.045,b-a,.12,.12,750);
    if(node){
      const door={id:node.id,x:bb.cx+nz*u+nx*d/2,z:bb.cz-nx*u+nz*d/2,rotY:angle,
        y:.79,h:2.74,w:gap*2,leaves:4,style:'bronze'};
      // Distance along the door normal to the outer edge of the square stylobate.
      const edge=Math.min((bb.cx+Math.sign(nx)*platformW/2-door.x)/nx,(bb.cz+Math.sign(nz)*platformD/2-door.z)/nz);
      door.approach=edge+4.1;
      addPavilionEntrance(ctx,door);portals.push(door);
      const foot=entrancePoint(door,0,edge+1.13);
      ctx.physics.addStairs(foot.x,foot.z,5.25,3.75,angle+Math.PI,.02,.79,7);
      for(let i=0;i<7;i++){
        const h=(7-i)*.11,at=entrancePoint(door,0,edge-.74+(i+.5)*3.75/7);
        const pu=(at.x-bb.cx)*nz-(at.z-bb.cz)*nx, pv=(at.x-bb.cx)*nx+(at.z-bb.cz)*nz;
        P.box(M.granite,pu,h/2,pv,5.25,h,3.75/7,550);
      }
      const run=Math.max(1,edge+.23), landing=entrancePoint(door,0,run/2);
      ctx.physics.addWalkBox(landing.x,landing.z,5.25,run,angle,.79,.63);
      P.box(M.granite,u,.738,d/2+run/2,5.25,.105,run,550);
    }
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
  // The collider follows the four glass faces and leaves their actual door gaps clear.
  const c=Math.cos(rot),s=Math.sin(rot),ring=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[bb.cx+c*u+s*v,bb.cz-s*u+c*v]).flat();
  addPolyColliders(ctx,{o:ring,h:[]},.79,11.2,.22,portals);
  svc.monuments.push({id:b.id,name:'Павильон «Крестовский остров»',x:bb.cx,z:bb.cz,h:11.3});
  svc.pavilion={id:b.id,x:bb.cx,z:bb.cz,w:bb.w,d:bb.d};
  const photo={x:bb.cx-4,z:bb.cz+48,yaw:0,name:'Аркада павильона «Крестовский остров»'};
  if(!ctx.L.insideBuilding(photo.x,photo.z,1)&&!ctx.L.isOnRoad(photo.x,photo.z,.5))svc.photoSpots.push(photo);
}
