// Gorky Palace of Culture, 1925–27, Gegello / Krichevsky / Dmitriev / Raylyan.
// Real OSM perimeter, curved glazed western foyer, paired stair towers and club
// wings; references and estimated vertical dimensions: docs/research/narvsky-constructivism.md.
import * as THREE from 'three';
import { Parts } from '../landmarksD/kit.js';
import { MeshBuilder, addCap, ringFromFlat, signedArea } from '../lib/massing.js';
import { registerLOD } from '../../core/spatial.js';
import { makeLabels } from '../streets/labels.js';

export const GORKY_ID = 'w42342130';
export const OWNS_GROUPS = ['narvsky-gorky'];
export const GORKY_FRAME = { x: -4248, z: 3564.9, rot: -1.192 };
export const GORKY_HEIGHT = 27.2;
const DOORS = [-9, 0, 9], DOOR_WIDTH = 2.5, DOOR_TOP = 3.15;

export function gorkyPoint(u, v) {
  const { x, z, rot } = GORKY_FRAME, c = Math.cos(rot), s = Math.sin(rot);
  return { x: x + c * u + s * v, z: z - s * u + c * v };
}
function localPoint(x, z) {
  const f = GORKY_FRAME, c = Math.cos(f.rot), s = Math.sin(f.rot), dx = x-f.x, dz=z-f.z;
  return [c*dx-s*dz, s*dx+c*dz];
}
function splitDoorSpans(a, b, central) {
  if (!central) return [[0, 1]];
  const du=b[0]-a[0], gaps=[];
  for (const u of DOORS) {
    const t0=(u-DOOR_WIDTH/2-a[0])/du, t1=(u+DOOR_WIDTH/2-a[0])/du;
    const lo=Math.max(0,Math.min(t0,t1)), hi=Math.min(1,Math.max(t0,t1));
    if(hi>lo)gaps.push([lo,hi]);
  }
  gaps.sort((p,q)=>p[0]-q[0]);const spans=[];let t=0;
  for(const [lo,hi] of gaps){if(lo>t)spans.push([t,lo]);t=Math.max(t,hi);}
  if(t<1)spans.push([t,1]);return spans;
}

function roadSafeFootprint(ctx, rec) {
  const source=rec.polys[0],net=ctx.services.streets?.net;
  const onRoad=(x,z)=>net?net.cover(x,z,{})>=-.8:!!ctx.L.isOnRoad?.(x,z,.8);
  // OSM's southern rounded stair projection and the adjacent 4 m service-road
  // approximation overlap by less than a metre. Reconcile any such perimeter
  // vertex towards the palace interior, preserving the continuous closed shell.
  // The 0.8 m clearance also contains the 0.42 m physical wall thickness.
  const o=[];
  for(const [x,z]of ringFromFlat(source.o)){
    const dx=rec.cx-x,dz=rec.cz-z,len=Math.hypot(dx,dz)||1;let shift=0;
    while(shift<5&&onRoad(x+dx/len*shift,z+dz/len*shift))shift+=.2;
    o.push(x+dx/len*shift,z+dz/len*shift);
  }
  return {o,h:source.h};
}

export function buildConstructivism(ctx, svc = {}, suppliedRecord = null) {
  const rec = suppliedRecord || ctx.L.groupMembers('narvsky-gorky').find(b=>b.id===GORKY_ID);
  if (!rec) return null;
  const root=new THREE.Group();root.name='narvsky-gorky';
  const body=new Parts(), medium=new Parts(), fine=new Parts(), decals=new Set();
  const M=Object.fromEntries(Object.entries({stucco:'#c2af87',stone:'#d0c4a7',shade:'#a89372',granite:'#62625b',roof:'#737a77',glass:'#354957',frame:'#acae9f',wood:'#8e6b3d'})
    .map(([key,color])=>[key,ctx.mat.toon(color,{paint:key==='stucco'?.035:.012})]));
  const parts=[body,medium,fine];for(const p of parts)p.push(GORKY_FRAME.x,0,GORKY_FRAME.z,GORKY_FRAME.rot);
  const entrances=[];let wallCount=0;
  const poly=roadSafeFootprint(ctx,rec), ring=ringFromFlat(poly.o).map(([x,z])=>localPoint(x,z));
  const sign=signedArea(ring)>0?1:-1;
  const edgeCollider=(a,b,y0,y1)=>{
    const p=gorkyPoint((a[0]+b[0])/2,(a[1]+b[1])/2),dx=b[0]-a[0],dz=b[1]-a[1];
    if(Math.hypot(dx,dz)<.04)return;
    ctx.physics.addBox(p.x,p.z,Math.hypot(dx,dz),.42,GORKY_FRAME.rot+Math.atan2(-dz,dx),y0,y1);wallCount++;
  };
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(len<.05)continue;
    const n=[sign*dz/len,0,-sign*dx/len],central=i<4;
    const strip=(t0,t1,y0,y1,mat,offset=0)=>{
      const p=[a[0]+dx*t0+n[0]*offset,a[1]+dz*t0+n[2]*offset],q=[a[0]+dx*t1+n[0]*offset,a[1]+dz*t1+n[2]*offset];
      body.quad(mat,[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],n);
    };
    // Open door spans pass through both the visible shell and its thin collider.
    for(const [t0,t1]of splitDoorSpans(a,b,central)){
      strip(t0,t1,0,DOOR_TOP,central?M.granite:M.stucco);
      strip(t0,t1,0,.48,M.granite,.025);
      edgeCollider([a[0]+dx*t0,a[1]+dz*t0],[a[0]+dx*t1,a[1]+dz*t1],0,DOOR_TOP);
    }
    strip(0,1,DOOR_TOP,22.2,central?M.glass:M.stucco);edgeCollider(a,b,DOOR_TOP,22.2);
    if(central){
      // Glazing is opaque architectural glass in the batching palette. No reflection pass.
      for(const y of [4.4,7.2,10.2,13.2,16.2,19.2,21.8]){
        medium.push((a[0]+b[0])/2,y,(a[1]+b[1])/2,Math.atan2(n[0],n[2]));
        medium.box(M.frame,-len/2,len/2,-.045,.045,.025,.1);medium.pop();
      }
      const count=Math.max(2,Math.ceil(len/1.15));
      for(let j=0;j<=count;j++){
        const t=j/count;fine.push(a[0]+dx*t,0,a[1]+dz*t,Math.atan2(n[0],n[2]));
        fine.box(M.frame,-.035,.035,4.5,21.8,.035,.11);fine.pop();
      }
    }else if(len>4.5&&i!==5&&i!==33){
      const count=Math.max(1,Math.floor((len-1.8)/3.5));
      for(let j=0;j<count;j++){
        const t=(j+.5)/count,rot=Math.atan2(n[0],n[2]);
        medium.push(a[0]+dx*t,0,a[1]+dz*t,rot);
        for(const y of [5.9,10.2,14.5,18.8]){
          medium.box(M.shade,-.83,.83,y-1.5,y+1.5,.015,.11);
          medium.box(M.glass,-.7,.7,y-1.36,y+1.36,.115,.145);
          fine.box(M.frame,-.035,.035,y-1.36,y+1.36,.15,.2);
          fine.box(M.frame,-.7,.7,y-.04,y+.04,.15,.2);
        }medium.pop();
      }
    }
    // Continuous perimeter cornice and flat sheet-metal roof edge.
    medium.push((a[0]+b[0])/2,0,(a[1]+b[1])/2,Math.atan2(n[0],n[2]));
    medium.box(M.stone,-len/2,len/2,21.85,22.35,-.08,.32);medium.pop();
  }
  const cap=new MeshBuilder();addCap(cap,poly,22.2);
  const roofMesh=new THREE.Mesh(cap.build(),M.roof);roofMesh.castShadow=true;roofMesh.receiveShadow=true;root.add(roofMesh);registerLOD(roofMesh,2600);
  // Six broad, five-sided pilasters fan around the curved auditorium foyer.
  const arc=ring.slice(0,5);
  const frontV=u=>{for(let i=0;i<arc.length-1;i++){const a=arc[i],b=arc[i+1];if(u>=Math.min(a[0],b[0])&&u<=Math.max(a[0],b[0]))return a[1]+(b[1]-a[1])*(u-a[0])/(b[0]-a[0]);}return -1.9;};
  for(const u of [-13,-7.8,-2.6,2.6,7.8,13]){
    const v=frontV(u);
    // Parts.extrude uses an XY profile, so build the vertical prism directly.
    const points=[[u-.47,v-.05],[u+.47,v-.05],[u+.47,v+.45],[u,v+.7],[u-.47,v+.45]];
    for(let i=0;i<5;i++){const a=points[i],b=points[(i+1)%5];body.quad(M.stucco,[a[0],4.4,a[1]],[b[0],4.4,b[1]],[b[0],21.85,b[1]],[a[0],21.85,a[1]],[b[1]-a[1],0,a[0]-b[0]]);}
  }
  // Paired stair towers: one extra floor, tall vertical glazing and projecting caps.
  // Each tower fans away from the curved centre. Use its own surveyed front
  // edge, so the stair windows lie on its wall rather than floating in front.
  for(const index of[5,33]){
    const a=ring[index],b=ring[index+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),u=(a[0]+b[0])/2,v=(a[1]+b[1])/2;
    const rot=Math.atan2(sign*(b[1]-a[1]),-sign*(b[0]-a[0])),c=Math.cos(rot),s=Math.sin(rot),half=len/2;
    for(const p of parts)p.push(u,0,v,rot);
    body.box(M.stucco,-half,half,22.2,26.7,-12,0);
    body.box(M.stone,-half-.35,half+.35,26.7,27.2,-12.35,.35);
    const corners=[[-half,-12],[half,-12],[half,0],[-half,0]].map(([x,z])=>[u+c*x+s*z,v-s*x+c*z]);
    for(let i=0;i<4;i++)edgeCollider(corners[i],corners[(i+1)%4],22.2,27.2);
    for(const y of [5.8,10.2,14.6,19,24]){
      medium.box(M.shade,-1.02,1.02,y-1.65,y+1.65,.015,.1);
      medium.box(M.glass,-.88,.88,y-1.5,y+1.5,.115,.145);
      fine.box(M.frame,-.035,.035,y-1.5,y+1.5,.15,.2);
      for(const dy of [-.55,.55])fine.box(M.frame,-.88,.88,y+dy-.03,y+dy+.03,.15,.2);
    }
    // The tower roof rail is building architecture, high above the public ground.
    for(const z of[-11.8,-.2]){fine.box(M.roof,-half+.2,half-.2,28.05,28.1,z-.025,z+.025);for(let j=0;j<8;j++){const x=-half+.3+j*(len-.6)/7;fine.box(M.roof,x-.025,x+.025,27.2,28.05,z-.025,z+.025);}}
    for(const x of[-half+.2,half-.2]){fine.box(M.roof,x-.025,x+.025,28.05,28.1,-11.8,-.2);for(let j=0;j<10;j++){const z=-11.8+j*11.6/9;fine.box(M.roof,x-.025,x+.025,27.2,28.05,z-.025,z+.025);}}
    for(const p of parts)p.pop();
  }
  // Metal pitched roof over the trapezoidal auditorium, with a low central
  // ridge. The roof is an authored estimate; the plan remains inside the OSM shell.
  for(const side of[-1,1])body.quad(M.roof,[side*13,22.2,-8],[side*19,22.2,-58],[0,25.1,-58],[0,25.1,-8],[0,1,0]);
  body.fan(M.stucco,[[-13,22.2,-8],[13,22.2,-8],[0,25.1,-8]],[0,0,1]);
  body.fan(M.stucco,[[-19,22.2,-58],[19,22.2,-58],[0,25.1,-58]],[0,0,-1]);
  // Balcony/canopy follows the convex front; its six cube brackets are distinctive.
  for(let i=0;i<arc.length-1;i++){
    const a=arc[i],b=arc[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx);
    body.push((a[0]+b[0])/2,0,(a[1]+b[1])/2,rot);body.box(M.stone,-len/2,len/2,3.6,4.35,-.2,2.2);body.pop();
  }
  for(const u of [-12,-7.2,-2.4,2.4,7.2,12])body.box(M.stone,u-.4,u+.4,3.1,3.7,frontV(u),frontV(u)+1.6);
  for(const u of DOORS){
    const v=frontV(u),p=gorkyPoint(u,v);
    // Open wooden door leaves sit along the reveals, leaving a 2.5 m passage.
    for(const side of[-1,1]){
      medium.box(M.wood,u+side*1.24-.055,u+side*1.24+.055,.08,3.05,v-.85,v+.05);
      fine.box(M.stone,u+side*1.44-.12,u+side*1.44+.12,0,3.45,v-.12,v+.13);
    }
    medium.box(M.wood,u-1.25,u+1.25,3.15,3.4,v-.1,v+.1);
    entrances.push({id:GORKY_ID,name:'ДК имени Горького · вход в фойе',x:p.x,z:p.z,rotY:GORKY_FRAME.rot,w:DOOR_WIDTH,open:true});
  }
  // Accessible street-level foyer behind the entrance. No artificial pavement step.
  const floor=new MeshBuilder(),front=arc.map(([u,v])=>{const p=gorkyPoint(u,v);return[p.x,p.z];});
  const backLeft=gorkyPoint(arc[arc.length-1][0],-9),backRight=gorkyPoint(arc[0][0],-9);
  addCap(floor,{o:[...front.flat(),backLeft.x,backLeft.z,backRight.x,backRight.z],h:[]},0);
  const floorMesh=new THREE.Mesh(floor.build(),M.granite);floorMesh.receiveShadow=true;root.add(floorMesh);registerLOD(floorMesh,650);
  body.box(M.stone,-13.5,13.5,0,3.55,-9.3,-9);
  const lobbyBackA=gorkyPoint(-13.5,-9.15),lobbyBackB=gorkyPoint(13.5,-9.15);
  ctx.physics.addBox((lobbyBackA.x+lobbyBackB.x)/2,(lobbyBackA.z+lobbyBackB.z)/2,27,.3,GORKY_FRAME.rot,0,3.55);
  // Three restrained event panels, registered with the common facade registry.
  ctx.services.labels ||= makeLabels();
  for(const [u,text]of[[-5,'ТЕАТР · МУЗЫКА'],[5,'ДВОРЕЦ ИСКУССТВ']]){
    const v=frontV(u)+.19,p=gorkyPoint(u,v),nx=Math.sin(GORKY_FRAME.rot),nz=Math.cos(GORKY_FRAME.rot);
    if(ctx.tex?.sign&&ctx.services.labels.reserve(GORKY_ID,p.x,1.65,p.z,3.3,1.75,nx,nz,'landmark')){
      const mat=ctx.mat.decal('#ffffff',{map:ctx.tex.sign({text,bg:'#435a66',fg:'#e7dcc1',w:512,h:256,font:'sans'})});decals.add(mat);
      fine.push(u,1.65,v);fine.quad(mat,[-1.65,-.875,0],[1.65,-.875,0],[1.65,.875,0],[-1.65,.875,0],[0,0,1]);fine.pop();
    }
  }
  for(const p of parts)p.pop();
  let meshes=2;for(const [p,far]of[[body,2600],[medium,650],[fine,220]])for(const mesh of p.build(root,{name:'narvsky-gorky'})){
    if(decals.has(mesh.material))ctx.noOutline(mesh);mesh.updateMatrixWorld(true);registerLOD(mesh,far);meshes++;
  }
  ctx.addStatic(root);
  const triangleCount=body.tris+medium.tris+fine.tris+(cap.idx.length+floor.idx.length)/3;
  (svc.entrances ||= []).push(...entrances);
  (svc.photoSpots ||= []).push({name:'ДК имени Горького · площадь Стачек',...gorkyPoint(0,48),yaw:-68,pitch:10});
  (svc.landmarkBuildings ||= []).push({id:GORKY_ID,name:'ДК имени Горького',x:rec.cx,z:rec.cz,h:GORKY_HEIGHT});
  svc.triangles=(svc.triangles||0)+triangleCount;
  return {root,triangles:triangleCount,meshes,wallCount,entrances,record:rec};
}

// Direct helper checks can pass a supplied record; the area wrapper uses the
// single buildConstructivism entry above and publishes its own service object.
export function build(ctx){const svc={};const result=buildConstructivism(ctx,svc);ctx.services.landmarksNarvskyConstructivism=svc;return result;}
