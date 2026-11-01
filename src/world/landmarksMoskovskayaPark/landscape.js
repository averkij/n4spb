// The park's regular lime axes contrast with loose silver-green willows and
// birches above natural pond banks (user photos + operator's surveyed map).
// Supplement the generic trees at sparse, checked spots; no second park forest.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { canopyGeometry, trunkGeometry } from '../environment/treegeo.js';
import { safeSpot } from './kit.js';
import { AXIS, FORMAL_LIMES } from './plan.js';

// Formal axis follows the mapped alley between the original six busts and
// Zhukov. Narrow clipped hedge strips leave frequent open cross-path gaps.
export { AXIS } from './plan.js';
const inPark=(x,z)=>x>-1700&&x<-835&&z>6770&&z<7530;
function clear(ctx,x,z,r=1.0) {
  if(!inPark(x,z)||ctx.L.inRiver?.(x,z)||ctx.L.insideBuilding(x,z,r)||!safeSpot(ctx,x,z,r*2,r*2))return false;
  const e=ctx.services.environment;
  if(e?.kindAt&&['footway','asphalt','pavement','water'].includes(e.kindAt(x,z)))return false;
  return true;
}

function tree(ctx,P,M,svc,x,z,fam,s,rot,shore=false) {
  if(!clear(ctx,x,z,.65))return false;
  if(ctx.services.environment?.field&&!ctx.services.environment.field.free(x,z,0,{bld:1.2,road:.8,shore:2.5,onPave:true,claimOk:true}))return false;
  const other=[...(ctx.services.environment?.trees||[]),...svc.trees];
  if(other.some(t=>Math.hypot(t.x-x,t.z-z)<(shore?5.5:5)))return false;
  const leaf=shore?M.willow:M.leaf;
  const canopy=P.geometry(`park-crown-${fam}`,()=>canopyGeometry(fam,1));
  const stem=P.geometry(`park-trunk-${fam}`,()=>trunkGeometry(fam,0));
  P.shape(`park-crown-${fam}`,canopy,leaf,x,.03,z,s,s,s,0,rot,0,900);
  if(stem)P.shape(`park-trunk-${fam}`,stem,fam.startsWith('birch')?M.birch:M.bark,x,.03,z,s,s,s,0,rot,0,650);
  const h=(fam.startsWith('birch')?10:14)*s,r=(fam==='poplar'?2.4:4)*s;
  ctx.physics.addCylinder(x,z,.23*s,0,3.8);
  svc.trees.push({x,z,h,r,sp:fam,tr:.23*s});return true;
}

function willow(ctx,P,M,svc,x,z,s=1,rot=0) {
  if(!clear(ctx,x,z,.9))return false;
  if(ctx.services.environment?.field&&!ctx.services.environment.field.free(x,z,0,{bld:1.2,road:.8,shore:2.5,onPave:true,claimOk:true}))return false;
  if([...(ctx.services.environment?.trees||[]),...svc.trees].some(t=>Math.hypot(t.x-x,t.z-z)<5))return false;
  P.push(x,0,z,rot);
  // Multi-stem willow, open branch forks, irregular spreading/drooping canopy.
  // Shapes are immutable shared low-poly spheres, split by kit cells and range.
  for(let j=0;j<3;j++){
    const a=j*2.1+.3,tx=Math.cos(a)*2*s,tz=Math.sin(a)*2*s;
    P.beam(M.bark,[0,0,0],[tx*.4,4.3*s,tz*.4],.20*s,550);
    P.beam(M.bark,[tx*.4,3.2*s,tz*.4],[tx*1.35,7.4*s,tz*1.35],.12*s,500);
    P.sphere(M.willow,tx*.8,7.3*s,tz*.8,4.3*s,4.7*s,4.2*s,700);
    P.sphere(M.willow,tx*1.7,5.7*s,tz*1.7,2.65*s,5.2*s,2.6*s,700);
  }
  P.pop();ctx.physics.addCylinder(x,z,.32*s,0,4);
  svc.trees.push({x,z,h:10*s,r:6*s,sp:'willow',tr:.32*s});return true;
}

function shoreTrees(ctx,P,M,svc) {
  const rng=ctx.rng('moskovskaya-park-ponds');
  // Use real outer and island shore rings. For each candidate, probe both
  // normals and retain only genuinely dry land; islands never become water.
  let n=0;
  for(const w of CITY.WATER.filter(w=>['r77680','r11008649','r109994','r147758','r1380826'].includes(w.id))) {
    for(const poly of w.polys)for(const ring of [poly.o,...poly.h]) {
      let travelled=0,next=22+rng()*28;
      for(let i=0;i<ring.length;i+=2){
        const j=(i+2)%ring.length,ax=ring[i],az=ring[i+1],dx=ring[j]-ax,dz=ring[j+1]-az,len=Math.hypot(dx,dz);
        if(len<.01)continue;
        while(next<travelled+len){
          const t=(next-travelled)/len,x=ax+dx*t,z=az+dz*t,off=5.5+rng()*2;
          for(const side of [-1,1]) {
            const px=x-dz/len*off*side,pz=z+dx/len*off*side;
            if(!clear(ctx,px,pz,1)||ctx.L.inRiver?.(px-dz/len*2*side,pz+dx/len*2*side))continue;
            const ok=n%3===0?willow(ctx,P,M,svc,px,pz,.75+rng()*.3,rng()*6.28):tree(ctx,P,M,svc,px,pz,n%2?'birchA':'limeB',.8+rng()*.28,rng()*6.28,true);
            if(ok)n++;break;
          }
          next+=35+rng()*23;
        }
        travelled+=len;
      }
    }
  }
  svc.shoreTrees=n;
}

function pathFurniture(ctx,svc) {
  const candidates=CITY.ROADS.filter(r=>r.hw==='footway'&&!r.bridge&&r.pts?.every((v,i)=>i%2||inPark(v,r.pts[i+1])));
  let count=0;
  for(const r of candidates)for(let i=0;i<r.pts.length-2;i+=2) {
    const ax=r.pts[i],az=r.pts[i+1],dx=r.pts[i+2]-ax,dz=r.pts[i+3]-az,len=Math.hypot(dx,dz);
    if(len<65)continue;
    for(let d=21;d<len-15;d+=72) {
      const off=(r.w||2.4)/2+1.0,side=count++%2?1:-1;
      const x=ax+dx/len*d-dz/len*off*side,z=az+dz/len*d+dx/len*off*side,rotY=Math.atan2(-dz,dx)+(side>0?Math.PI:0);
      if(!clear(ctx,x,z,1.35)||!safeSpot(ctx,x,z,2.3,.85,rotY))continue;
      if([...svc.benches,...(ctx.services.props?.benches||[])].some(b=>Math.hypot(b.x-x,b.z-z)<13))continue;
      if(ctx.services.environment?.trees?.some(t=>Math.hypot(t.x-x,t.z-z)<2))continue;
      svc.benches.push({x,z,rotY,len:2.3});
      // A lantern sits beyond the seat, never on the path or its approaches.
      const lx=x+dx/len*4,lz=z+dz/len*4;
      if(clear(ctx,lx,lz,.55)&&!ctx.services.streets?.lamps?.some(l=>Math.hypot(l.x-lx,l.z-lz)<12))svc.lamps.push({x:lx,z:lz,h:5.9});
      if(svc.benches.length>=46)return;
    }
  }
}

export function landscape(ctx,P,M,svc) {
  const {x0,z0,x1,z1}=AXIS,dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx);
  const rng=ctx.rng('moskovskaya-park-formal');
  // Linden double avenue, with the actual ~22 m bust spacing kept visible.
  for(const {x,z} of FORMAL_LIMES) {
    tree(ctx,P,M,svc,x,z,'limeA',.82+rng()*.13,rot);
  }
  shoreTrees(ctx,P,M,svc);pathFurniture(ctx,svc);
  // The small mapped flower bed belongs to the memorial garden, beside the
  // chapel approach. Keep its surveyed footprint, never paint over a path.
  const bed=CITY.GREEN.find(g=>g.id==='w1277855943');
  if(bed)for(let i=0;i<18;i++) {
    const x=-1462.1+(i%6)*.55,z=7448.6+Math.floor(i/6)*1.0;
    if(ctx.L.inRiver?.(x,z)||!safeSpot(ctx,x,z,.35,.35))continue;
    P.sphere(M.hedge,x,.17,z,.45,.34,.45,240);
    P.sphere(i%3?M.flowers:M.violet,x,.36,z,.30,.15,.30,240);
  }
  svc.photoSpots.push({x:-1447,z:7274,yaw:128,pitch:2,name:'Острова и берега Фонтанного пруда'},
    {x:-1350,z:7320,yaw:-38,pitch:2,name:'Адмиралтейский пруд и остров'},
    {x:-1593,z:7155,yaw:-15,pitch:1,name:'Пруды Очки и Аллея Героев'});
  svc.park={genericPonds:true,genericPaths:true,genericForest:true,source:'OSM + operator map + supplied summer photographs'};
}
