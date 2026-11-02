// SOURCE: 102_3d_piter src/world/landmarksTauride/paradny-courts.js, commit 0568f7af, copied verbatim (T1 of docs/TAURIDE-REMAKE.md; only this provenance line is new).
import * as THREE from 'three';
import { PARADNY_PODIUM,PARADNY_Y as Y,PARADNY_STAIRS,PARADNY_FLIGHTS,PARADNY_LANDINGS,PARADNY_FOUNTAINS,inParadny,paradnyDeckY } from './paradny-surface.js';
import { PARADNY_FLOOR } from './paradny-floor.js';
import { knockBays } from '../lib/fence-bays.js';
import { liveFountain } from '../lib/live-fountain.js';
const pairs=r=>Array.from({length:r.length/2},(_,i)=>[r[i*2],r[i*2+1]]);
const edges=r=>pairs(r).map((a,i,all)=>[a,all[(i+1)%all.length]]);
const dseg=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};

export function paradnyCourts(K,root){
 const {ctx,P,mats:M}=K;
 const paving=ctx.tex.draw(512,512,(g,w,h)=>{g.fillStyle='#a99d8f';g.fillRect(0,0,w,h);for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const t=(row*17+col*13)%7;g.fillStyle=['#b8a99a','#aa9785','#b7a491','#a8917d','#b5a08c','#ac9989','#beae9d'][Math.abs(t)];g.fillRect(col*64+(row%2)*32+1,row*32+1,62,30);}},{key:'paradny-paving-v2',repeat:[1,1]});
 const tile=ctx.mat.toon('#e0cfc0',{map:paving,paint:.025}),granite=K.rust('#6f706b'),rim=K.mat('#444b4b'),soil=K.mat('#514b3e'),grass=K.mat('#76905e'),hedge=K.mat('#527044');
 const polygon=pairs(PARADNY_PODIUM.o),vs=polygon.map(p=>new THREE.Vector2(...p));
 const tri=(a,b,c)=>{const es=[[a,b,c],[b,c,a],[c,a,b]].sort((u,v)=>u[0].distanceToSquared(u[1])-v[0].distanceToSquared(v[1]));const[u,v,w]=es[2];if(u.distanceToSquared(v)>144){const m=u.clone().add(v).multiplyScalar(.5);tri(u,m,w);tri(m,v,w);return;}P.fan(tile,[[a.x,Y,a.y],[b.x,Y,b.y],[c.x,Y,c.y]],[0,1,0],p=>[p[0]/2,p[2]/2]);};
 for(const poly of PARADNY_FLOOR){const o=pairs(poly.o).map(p=>new THREE.Vector2(...p)),h=poly.h.map(r=>pairs(r).map(p=>new THREE.Vector2(...p))),all=[o,...h].flat();for(const t of THREE.ShapeUtils.triangulateShape(o,h))tri(...t.map(i=>all[i]));}
 // Closed podium walls, with openings for the actual mapped stair approaches.
 for(const[a,b]of edges(PARADNY_PODIUM.o)){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/2),rot=Math.atan2(dx,dz);
  for(let i=0;i<n;i++){
   const x=a[0]+dx*(i+.5)/n,z=a[1]+dz*(i+.5)/n;
   if(PARADNY_STAIRS.some(s=>{for(let j=0;j+3<s.pts.length;j+=2)if(dseg(x,z,s.pts.slice(j,j+2),s.pts.slice(j+2,j+4))<2)return true;return false;}))continue;
   if(K.L.isOnRoad(x,z,.9))continue;   // a mapped service way runs through the podium foot: leave it open instead of walling the lane (streets is built later: layout width + 0.9 m for its parking pocket / fillet)
   P.push(x,0,z,rot);P.box(granite,-.22,.22,0,Y-.04,-len/n/2,len/n/2);P.box(M.graniteWarm,-.3,.3,Y-.035,Y+.05,-len/n/2,len/n/2);P.pop();ctx.physics.addBox(x,z,.5,len/n,rot,0,Y);
  }
 }
 // Walking floor strips follow polygon scanlines; the pure height helper provides
 // the exact edge and is also used by NPCs and by the shared terrain service.
 const zs=polygon.map(p=>p[1]);for(let z=Math.min(...zs)+.5;z<Math.max(...zs);z+=1){
  const xs=[];for(const[a,b]of edges(PARADNY_PODIUM.o))if((a[1]>z)!==(b[1]>z))xs.push(a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]));xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2){let spans=[[xs[i],xs[i+1]]];
   for(const s of PARADNY_STAIRS){const xx=s.pts.filter((_,i)=>i%2===0),zz=s.pts.filter((_,i)=>i%2===1);if(z<Math.min(...zz)-2||z>Math.max(...zz)+2)continue;const lo=Math.min(...xx)-2,hi=Math.max(...xx)+2;spans=spans.flatMap(([a,b])=>b<=lo||a>=hi?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([a,b])=>b-a>.01));}
   for(const[a,b]of spans)ctx.physics.addWalkBox((a+b)/2,z,b-a,1,0,Y,0);
  }
 }
 for(const s of PARADNY_FLIGHTS){
  let total=0;for(let i=0;i+3<s.pts.length;i+=2)total+=Math.hypot(s.pts[i+2]-s.pts[i],s.pts[i+3]-s.pts[i+1]);let along=0;
  const start=s.start,end=s.end;
  for(let i=0;i+3<s.pts.length;i+=2){const ax=s.pts[i],az=s.pts[i+1],bx=s.pts[i+2],bz=s.pts[i+3],len=Math.hypot(bx-ax,bz-az),rot=Math.atan2(bx-ax,bz-az),a=start+(end-start)*along/total,b=start+(end-start)*(along+len)/total,n=Math.max(1,Math.round((b-a)/.15));
   P.push((ax+bx)/2,0,(az+bz)/2,rot);for(let j=0;j<n;j++)P.box(M.graniteWarm,-s.w/2,s.w/2,0,a+(b-a)*(j+1)/n,-len/2+j*len/n,-len/2+(j+1)*len/n);P.pop();ctx.physics.addStairs((ax+bx)/2,(az+bz)/2,s.w,len,rot,a,b,n);
   for(const side of[-1,1])P.cyl(M.ironSoft,[ax+Math.cos(rot)*side*(s.w/2-.12),a+.95,az-Math.sin(rot)*side*(s.w/2-.12)],[bx+Math.cos(rot)*side*(s.w/2-.12),b+.95,bz-Math.sin(rot)*side*(s.w/2-.12)],.035,.035,8,true);along+=len;
  }
 }
 for(const p of PARADNY_LANDINGS){P.box(M.graniteWarm,p.x-p.w/2,p.x+p.w/2,0,p.y+.015,p.z-p.w/2,p.z+p.w/2);ctx.physics.addWalkBox(p.x,p.z,p.w,p.w,0,p.y+.015,0);}
 // Two surveyed triangular black-granite basins. The fountain contractor records
 // 13 jets per basin, with the central jet reaching 5m.
 const jets=[],rimBays=[],waterMat=ctx.mat.toon('#779b9d',{paint:.06}),spray=ctx.mat.toon('#c7e0df',{paint:.08,emissive:'#6bcbd5',emissiveIntensity:.08});
 K.decalMats.add(waterMat);
 for(const f of PARADNY_FOUNTAINS)for(const poly of f.polys){
  const firstJet=jets.length;
  const pts=pairs(poly.o),cx=pts.reduce((s,p)=>s+p[0],0)/pts.length,cz=pts.reduce((s,p)=>s+p[1],0)/pts.length;
  P.cap(rim,pts,Y+.12,true,2);const inner=pts.map(p=>[cx+(p[0]-cx)*.88,cz+(p[1]-cz)*.92]);P.cap(waterMat,inner,Y+.6,true,2);
  ctx.physics.addWater({ring:inner.flat(),level:Y+.6});
  for(const[a,b]of edges(poly.o)){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),rot=Math.atan2(b[0]-a[0],b[1]-a[1]);P.push((a[0]+b[0])/2,0,(a[1]+b[1])/2,rot);P.box(rim,-.32,.32,Y+.12,Y+.77,-len/2,len/2);P.pop();rimBays.push({x0:a[0],z0:a[1],x1:b[0],z1:b[1],y:Y,ghost:true});}
  jets.push({x:cx,z:cz,h:5});for(let side=0;side<3;side++)for(let i=0;i<4;i++){const a=inner[side],b=inner[(side+1)%3],t=(i+.5)/4;jets.push({x:cx+((a[0]+(b[0]-a[0])*t)-cx)*.68,z:cz+((a[1]+(b[1]-a[1])*t)-cz)*.68,h:1.2+1.8*(1-Math.abs(t-.5)*2)});}
  liveFountain(ctx,{id:f.id,x:cx,z:cz,y:Y+.6,r:5,drawStreams:false,far:300,nozzles:jets.slice(firstJet).map(j=>({x:j.x-cx,y:.01,z:j.z-cz,height:j.h,width:.035,target:[j.x-cx+.12,0,j.z-cz]}))});
 }
 knockBays(ctx,{name:'paradny-fountain-rims',bays:rimBays,parts:[],far:300,collider:{y0:Y,y1:Y+.8,thick:.65},rec:{kind:'fence',mass:700,h:.8,anchored:12,hitK:.3,metal:false,minDv:0}});
 const jetGeo=new THREE.CylinderGeometry(.045,.12,1,7,4),mesh=new THREE.InstancedMesh(jetGeo,spray,jets.length),foam=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),spray,jets.length*8),mat=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3();
 const update=t=>{const n=ctx.shared.uNight?.value||0,sunY=ctx.shared.uSunDir?.value?.y??1;spray.emissiveIntensity=.08+1.3*Math.max(0,Math.min(1,Math.max((.22-sunY)/.22*.55,(n-.03)/.55)));jets.forEach((j,i)=>{const h=j.h*(.95+.05*Math.sin(t*2.2+i));v.set(j.x,Y+.61+h/2,j.z);scale.set(1,h,1);mat.compose(v,q,scale);mesh.setMatrixAt(i,mat);
  for(let k=0;k<8;k++){const f=((t*.48+k/8+i*.137)%1),yy=4*f*(1-f)*h,r=.07+.12*(1-f);v.set(j.x+Math.sin(i+k*2.4)*f*.48,Y+.62+yy,j.z+Math.cos(i+k*2.4)*f*.48);scale.set(r,r*1.6,r);mat.compose(v,q,scale);foam.setMatrixAt(i*8+k,mat);}
 });mesh.instanceMatrix.needsUpdate=true;foam.instanceMatrix.needsUpdate=true;};update(0);for(const m of[mesh,foam]){m.computeBoundingSphere();m.boundingSphere.radius+=3;ctx.noOutline(m);ctx.add(m);}ctx.onUpdate((dt,t)=>update(t));
 // Symmetric planted beds and seating retain the mapped central axial paths.
 const beds=[[881,-1040,12,6],[911,-1040,12,6],[875,-1016,9,17],[918,-1016,9,17],[881,-992,12,6],[911,-992,12,6],[875,-962,14,8],[923,-962,14,8],[873,-1102,12,8],[917,-1102,12,8],[993,-1020,12,11],[801,-1020,9,14],[851,-926,8,12],[933,-927,9,12],[1018,-1150,10,15]];
 beds.push([1030,-987,4,7],[1031,-1037,4,7],[1033,-1080,4,7]);
 const treeGeo=new THREE.IcosahedronGeometry(1,1),leaf=K.mat('#75915b'),flowers=[K.mat('#d99faa'),K.mat('#dac987'),K.mat('#c7c2d8')];
 for(const[x,z,w,d]of beds){if(K.L.insideBuilding(x,z,Math.min(w,d)/2+.3))continue;
  P.box(granite,x-w/2-.18,x+w/2+.18,Y,Y+.38,z-d/2-.18,z+d/2+.18);P.box(soil,x-w/2,x+w/2,Y+.39,Y+.41,z-d/2,z+d/2);P.box(grass,x-w/2+.1,x+w/2-.1,Y+.43,Y+.45,z-d/2+.1,z+d/2-.1);
  for(const side of[-1,1])P.box(hedge,x-w/2+.3,x+w/2-.3,Y+.46,Y+.98,z+side*(d/2-.5)-.3,z+side*(d/2-.5)+.3);
  for(let k=0;k<Math.max(3,Math.floor(w));k++){const fx=x-w/2+.5+k*(w-1)/Math.max(2,Math.floor(w)-1);P.geo(flowers[k%3],treeGeo,fx,Y+1.025,z-d/2+.5,0,0,0,.18,.12,.18);}
  const tx=x,tz=z;P.col(M.doorWood,tx,tz,Y+.4,Y+3.7,.14,.09,8);P.geo(leaf,treeGeo,tx,Y+4.3,tz,0,0,0,1.7,2.1,1.7);ctx.physics.addCylinder(tx,tz,.2,Y,Y+4);
  const bz=z+d/2+1.3;for(let k=0;k<5;k++)P.box(M.doorWood,x-1.65,x+1.65,Y+.46,Y+.52,bz-.24+k*.12,bz-.15+k*.12);
  for(const sx of[-1.3,1.3]){P.box(M.ironSoft,x+sx-.04,x+sx+.04,Y,Y+.5,bz-.3,bz+.3);P.box(M.ironSoft,x+sx-.035,x+sx+.035,Y+.45,Y+1.08,bz+.27,bz+.33);}for(let k=0;k<3;k++)P.box(M.doorWood,x-1.65,x+1.65,Y+.69+k*.13,Y+.79+k*.13,bz+.27,bz+.34);
 }
 // Narrow ornamental cast-iron lanterns sit at the plaza corners.
 for(const[x,z]of[[867,-1046],[927,-1046],[867,-986],[927,-986],[898,-1060],[897,-970]]){
  P.col(M.ironSoft,x,z,Y,Y+3.8,.1,.055,10);P.box(M.ironSoft,x-.22,x+.22,Y+3.75,Y+4.28,z-.22,z+.22);P.box(M.cream,x-.15,x+.15,Y+3.84,Y+4.18,z-.15,z+.15);P.col(M.ironSoft,x,z,Y+4.28,Y+4.5,.32,0,4);ctx.physics.addCylinder(x,z,.14,Y,Y+4.5);
 }
 return{deckY:paradnyDeckY,podium:PARADNY_PODIUM,fountains:PARADNY_FOUNTAINS.map(f=>f.id),jets:jets.length};
}
