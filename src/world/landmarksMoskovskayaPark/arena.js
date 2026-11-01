// Present-day SKA Arena silhouette: shallow oval silver canopy, glazed bowl,
// and inclined exposed steel lattice. Source: operator and exterior photographs
// in docs/research/moskovskaya-park.md. Closed exterior; no invented interior.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { polyBounds, addPolyColliders } from '../lib/massing.js';
import { site } from './sites.js';

export function arena(ctx,P,M,svc) {
 const b=CITY.BUILDINGS.find(b=>b.id==='w1024552165');
 // Never build a claimed substitute outside the downloaded city footprint.
 if(!b?.polys?.length)return;
 const bb=polyBounds(b.polys[0]),sx=bb.w/2,sz=bb.d/2;
 const q=site(b.id,30.341147,59.869208);P.push(bb.cx,0,bb.cz);
 // Bake the metres into geometry, leaving the instance transform rigid. Scaling
 // a 1 m-radius / 40 m-tall profile by [165,1,140] inflates three.js's aggregate
 // sphere to kilometres; this metre-sized profile retains a ~170 m bound.
 const ring=(key,profile,mat,far)=>{
  const geo=P.geometry(key,()=>{const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r*sx,y)),64);g.scale(1,1,sz/sx);return g;});
  P.shape(key,geo,mat,0,0,0,1,1,1,0,0,0,far);
 };
 ring('arena-podium',[[0,0],[.82,0],[.82,1.2],[0,1.2]],M.granite,1800);
 ring('arena-glass',[[.72,1.2],[.72,28]],M.glass,Infinity);
 ring('arena-canopy',[[0,41.5],[.40,41.3],[.78,39.6],[.97,36.1],[1,35.8],[1,32.8],[.95,32.5],[.78,39.0],[.40,40.7],[0,40.9]],M.silver,Infinity);
 // Radial perimeter fans cross rather than repeating a generic column wall.
 for(let i=0;i<64;i++){
  const a=i/64*Math.PI*2,delta=Math.PI/64,top=[Math.cos(a)*sx*.98,33.15,Math.sin(a)*sz*.98];
  for(const j of [-1,1]){
   const foot=[Math.cos(a+j*delta)*sx*.79,1.2,Math.sin(a+j*delta)*sz*.79];
   P.beam(M.steel,foot,top,.32,1200);
   ctx.physics.addCylinder(bb.cx+foot[0],bb.cz+foot[2],.45,0,3.5);
  }
  const b0=[Math.cos(a)*sx*.80,10,Math.sin(a)*sz*.80],b1=[Math.cos(a+Math.PI/16)*sx*.98,32.9,Math.sin(a+Math.PI/16)*sz*.98];P.beam(M.steel,b0,b1,.19,900);
  P.beam(M.silver,[Math.cos(a)*sx*.723,3,Math.sin(a)*sz*.723],[Math.cos(a)*sx*.723,27,Math.sin(a)*sz*.723],.13,850);
 }
 for(const y of [10,20,27])ring(`arena-glass-band-${y}`,[[.723,y],[.727,y],[.727,y+.18],[.723,y+.18]],M.steel,850);
 // Walking tiles follow the elliptical raised platform, never a huge axis-aligned
 // box reaching the streets. A six-step west stair gives actual pedestrian access.
 for(let i=0;i<64;i++){
  const a=i*Math.PI/32,x=Math.cos(a)*sx*.77,z=Math.sin(a)*sz*.77;
  ctx.physics.addWalkBox(bb.cx+x,bb.cz+z,Math.max(sx,sz)*.11,Math.max(sx,sz)*.104,Math.PI/2-a,1.2,0);
 }
 const stairX=-sx*.82-4.5;P.push(stairX,0,0,Math.PI/2);
 for(let i=0;i<6;i++)P.box(M.granite,0,(i+1)*.1,-4.5+(i+.5)*1.5,22,(i+1)*.2,1.5,900);
 P.pop();ctx.physics.addStairs(bb.cx+stairX,bb.cz,22,9,Math.PI/2,0,1.2,6);
 // Entrance wings are glass with frame mullions; the closed building has walls
 // on every side. Place the wordmark on the silver rim and reserve its rectangle.
 P.label(M.names,0,34.2,sz*.999+.09,28,4,b.id,0,750,26);
 P.pop();
 // The mapped outline includes the roof's projecting colonnade. Its open bays
 // have no perimeter wall: walking can reach the actual glazed inner envelope.
 const inner={o:Array.from({length:64},(_,i)=>{const a=i*Math.PI/32;return [bb.cx+Math.cos(a)*sx*.72,bb.cz+Math.sin(a)*sz*.72];}).flat(),h:[]};
 addPolyColliders(ctx,inner,0,28,.4);
 svc.monuments.push({id:b.id,name:'СКА Арена',x:bb.cx,z:bb.cz,h:41.5});svc.photoSpots.push({x:bb.cx-205,z:bb.cz+155,yaw:-45,name:'Овальная кровля СКА Арены'});
}
