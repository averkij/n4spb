// Basseynaya 53 (w31192359), based on the owner's street photograph:
// pale twelve-storey U-shaped house, recessed balconies and an open pilotis
// ground floor. Only the end wings and four stair cores meet the ground.
import { onEdge } from '../landmarksD/kit.js';
import { triangulateRing } from '../environment/clip.js';

export const BASSEYNAYA_ID='w31192359';
export function basseynaya(K,records){
 const r=records.find(r=>r.id===BASSEYNAYA_ID);if(!r)return;
 const {ctx,body:P,detail:D,svc}=K,top=36.5,soffit=5.5;
 const M={wall:ctx.mat.toon('#c6c2b9',{paint:.025}),trim:ctx.mat.toon('#d9d6cc',{paint:.02}),
  glass:ctx.mat.toon('#4c6674',{paint:.01}),frame:ctx.mat.toon('#dadbd6'),dark:ctx.mat.toon('#414d51'),base:ctx.mat.toon('#888c88')};
 // Draw/collide the exact authoritative footprint only ABOVE the arcade.
 const edges=K.shell({...r,minH:soffit},top,M.wall);
 for(const p of r.polys){const ring=[];for(let i=0;i<p.o.length;i+=2)ring.push([p.o[i],p.o[i+1]]);P.cap(M.base,ring,soffit,false);}
 // Excluding a pilotis footprint from the ground-solid mask also excludes it
 // from automatic roof capture. Preserve its exact walkable roof explicitly.
 for(const p of r.polys)for(const t of triangulateRing(p.o,p.h))ctx.physics.addWalkTriangle(t.map(([x,z])=>[x,top,z]),.2);
 for(const e of edges)onEdge(D,e,len=>{
  const n=len>2?Math.max(1,Math.round(len/3.15)):0;
  for(let i=0;i<n;i++)for(let row=0;row<10;row++){
   const u=(i+.5)*len/n,y=6.25+row*2.92,w=Math.min(1.65,len/n-.4);
   D.quad(M.frame,[u-w/2-.1,y-.1,.13],[u+w/2+.1,y-.1,.13],[u+w/2+.1,y+1.85,.13],[u-w/2-.1,y+1.85,.13],[0,0,1]);
   D.quad(M.glass,[u-w/2,y,.155],[u+w/2,y,.155],[u+w/2,y+1.75,.155],[u-w/2,y+1.75,.155],[0,0,1]);
   D.quad(M.frame,[u-.035,y,.21],[u+.035,y,.21],[u+.035,y+1.75,.21],[u-.035,y+1.75,.21],[0,0,1]);
   D.quad(M.trim,[u-w/2-.15,y-.17,.28],[u+w/2+.15,y-.17,.28],[u+w/2+.15,y-.09,.28],[u-w/2-.15,y-.09,.28],[0,0,1]);
  }
 });
 const zAt=x=>7670.8-(x+1284.1)*.027;
 const solid=(x0,x1,z0,z1,mat=M.wall)=>{
  P.box(mat,x0,x1,0,soffit,z0,z1);ctx.physics.addBox((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,0,0,soffit);
 };
 // End wings remain residential; the long centre is genuinely permeable.
 for(const e of edges)if((e.a[0]+e.b[0])/2< -1298||(e.a[0]+e.b[0])/2> -1166){
  onEdge(P,e,len=>P.box(M.wall,0,len,0,soffit,-.35,0));
  ctx.physics.addBox((e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2,e.len,.35,Math.atan2(-(e.b[1]-e.a[1]),e.b[0]-e.a[0]),0,soffit);
 }
 for(const x of[-1278,-1248,-1218,-1187]){
  const z=zAt(x);solid(x-1.7,x+1.7,z+.3,z+14.9,M.dark);
  for(const side of[0,1]){D.push(x,0,z+(side?15:.2),side?0:Math.PI);D.box(M.frame,-.85,.85,.15,2.8,0,.08);D.quad(M.glass,[-.75,.2,.1],[.75,.2,.1],[.75,2.65,.1],[-.75,2.65,.1],[0,0,1]);D.pop();}
 }
 const columns=[];
 for(let x=-1289.25;x< -1169;x+=7.5)for(const dz of[1.1,13.8]){
  const z=zAt(x)+dz;P.push(x,0,z,.027);P.box(M.trim,-.55,.55,0,soffit,-.6,.6);P.pop();
  ctx.physics.addBox(x,z,1.1,1.2,.027,0,soffit);columns.push({x,z});
 }
 // Recessed, dark balcony stacks punctuate the wide street elevation.
 for(const x of[-1278,-1248,-1218,-1187])for(let row=0;row<10;row++){
  const y=6.05+row*2.92,z=zAt(x)-.05;D.push(x,0,z,Math.PI);
  D.box(M.dark,-2.4,2.4,y,y+2.35,.02,.20);
  D.box(M.glass,-2.15,2.15,y+.18,y+2.15,.22,.24);
  D.box(M.trim,-2.55,2.55,y-.15,y,.1,.85);
  D.box(M.base,-2.4,2.4,y+.12,y+.78,.72,.83);
  D.box(M.trim,-2.5,2.5,y+.82,y+.9,.70,.87);D.pop();
 }
 svc.houses.push({id:r.id,name:'Бассейная улица, 53',x:r.cx,z:r.cz,h:top});
 svc.basseynaya={id:r.id,soffit,columns};
}
