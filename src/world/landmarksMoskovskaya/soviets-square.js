// Formal Moscow Square paving. Exact lawn/pool holes, no raised pavement
// colliders, and no area-wide dynamic work. Fountains remain owned by props.
import {area2,ccw} from '../environment/clip.js';
import {MOSCOW_SQUARE_PAVING,MOSCOW_SQUARE_LAWNS,MOSCOW_SQUARE_POOL_POLYS,squarePartition,MOSCOW_SQUARE_FIELD_RING} from './soviets-square-plan.js';

const Y=.145;
const point=(u,v)=>[-1577.8+u*.02937+v*.99957,8941.8+u*.99957-v*.02937];
const rectangle=(u0,u1,v0,v1)=>ccw([point(u0,v0),point(u1,v0),point(u1,v1),point(u0,v1)]);
function inlayCuts(){
  const cuts=[];
  // The photographed monument court has a double rectangular granite border,
  // aligned with the real facade rather than an axis-aligned world rectangle.
  for(const [u0,u1,v0,v1,w]of[[-21.5,21.5,-61,19.5,.38],[-19.8,19.8,-59.3,17.8,.15]]){
    cuts.push(rectangle(u0,u0+w,v0,v1),rectangle(u1-w,u1,v0,v1),rectangle(u0,u1,v0,v0+w),rectangle(u0,u1,v1-w,v1));
  }
  // Thin granite aprons follow the five large surveyed pool outlines. They
  // alter the material partition only, never cover water or add coping walls.
  for(const p of MOSCOW_SQUARE_POOL_POLYS.filter(p=>['r7369984','w74201757','w74201759','w91838567'].includes(p.id))){
    const sign=area2(p.o.reduce((a,v,i,r)=>i%2?a:[...a,[v,r[i+1]]],[]))>0?1:-1;
    for(let i=0;i<p.o.length;i+=2){const j=(i+2)%p.o.length,ax=p.o[i],az=p.o[i+1],bx=p.o[j],bz=p.o[j+1],dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),nx=sign*dz/l,nz=-sign*dx/l;
      cuts.push(ccw([[ax+nx*.45,az+nz*.45],[bx+nx*.45,bz+nz*.45],[bx+nx*.7,bz+nz*.7],[ax+nx*.7,az+nz*.7]]));
    }
  }
  return cuts;
}

function drawSurface(K,mat,pieces,y,stats){
  const net=K.ctx.services.streets?.net,layout=K.ctx.L,scratch={};
  const clear=(x,z)=>net?net.cover(x,z,scratch)<-.5:!layout.isOnRoad(x,z,.5);
  const emit=t=>{
    // Verify the final triangle against actual asphalt, including its whole
    // interior on a 1 m barycentric grid. A contested triangle is recursively
    // trimmed down to 25 cm pieces; those touching asphalt are omitted.
    const longest=Math.max(...t.map((p,i)=>Math.hypot(p[0]-t[(i+1)%3][0],p[1]-t[(i+1)%3][1])));
    const n=Math.max(1,Math.ceil(longest));let okay=true;
    outer:for(let i=0;i<=n;i++)for(let j=0;j<=n-i;j++){
      const a=i/n,b=j/n,c=1-a-b;
      if(!clear(t[0][0]*a+t[1][0]*b+t[2][0]*c,t[0][1]*a+t[1][1]*b+t[2][1]*c)){okay=false;break outer;}
    }
    if(!okay){
      if(longest<=.25){stats.roadClipped++;return;}
      const lengths=t.map((p,i)=>Math.hypot(p[0]-t[(i+1)%3][0],p[1]-t[(i+1)%3][1])),i=lengths.indexOf(Math.max(...lengths)),j=(i+1)%3,k=(i+2)%3,m=[(t[i][0]+t[j][0])/2,(t[i][1]+t[j][1])/2];
      emit([t[i],m,t[k]]);emit([m,t[j],t[k]]);return;
    }
    K.body.fan(mat,t.map(([x,z])=>[x,y,z]),[0,1,0],p=>[p[0]/4.8,p[2]/3.2]);stats.triangles++;
  };
  for(const p of pieces)for(let i=1;i+1<p.length;i++){
    const t=[p[0],p[i],p[i+1]];if(Math.abs(area2(t))>1e-5)emit(t);
  }
}

export function squareForecourt(K){
  const {ctx}=K;
  const texture=ctx.tex.draw(256,256,(g,w,h)=>{
    g.fillStyle='#a49a91';g.fillRect(0,0,w,h);
    const colors=['#b9b0a5','#b7aea3','#bab1a6','#b8afa4'];
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){g.fillStyle=colors[(i*3+j*5)%4];g.fillRect(i*64+.7,j*64+.7,62.6,62.6);}
  },{key:'moscow-square-formal-granite-slabs',repeat:[1,1]});
  const paving=ctx.mat.toon('#ffffff',{map:texture,paint:.006}),border=ctx.mat.toon('#847a72',{paint:.01}),grass=ctx.mat.toon('#728b4b',{paint:.018});
  let floor=MOSCOW_SQUARE_PAVING,inlay=[];
  for(const cut of inlayCuts()){const divided=squarePartition(floor,cut);floor=divided.outside;inlay.push(...divided.inside);}
  const stats={triangles:0,roadClipped:0,pavingPieces:floor.length,inlayPieces:inlay.length,lawnPieces:MOSCOW_SQUARE_LAWNS.length,basins:MOSCOW_SQUARE_POOL_POLYS.length,ring:MOSCOW_SQUARE_FIELD_RING,y:Y};
  drawSurface(K,paving,floor,Y,stats);drawSurface(K,border,inlay,Y,stats);drawSurface(K,grass,MOSCOW_SQUARE_LAWNS,.15,stats);
  K.svc.sovietsSquare=stats;
}
