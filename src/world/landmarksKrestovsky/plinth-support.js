// Solid floor under the stadium's accessible outer plinth. Tangent boxes stay
// inside the rendered 96-sided ellipse and outside the closed glass envelope.
// Supports are immutable physics records, with no extra meshes/frame callbacks.
import { safeSpot } from '../landmarksVictoryPark/kit.js';
function inside(poly,x,z){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>z)!==(poly[j][1]>z)&&x<(poly[j][0]-poly[i][0])*(z-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])yes=!yes;return yes;}
function minRadius(corners,rx,rz){let best=Infinity;for(let i=0;i<4;i++){const a=[corners[i][0]/rx,corners[i][1]/rz],b=[corners[(i+1)%4][0]/rx,corners[(i+1)%4][1]/rz],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(a[0]+t*dx,a[1]+t*dz));}return best;}
export function plinthSupport(ctx,bb,rx,rz){
 const outline=Array.from({length:96},(_,i)=>[.9*rx*Math.cos(i*Math.PI/48),.9*rz*Math.sin(i*Math.PI/48)]),n=192;
 let supports=0,minDepth=Infinity;
 for(let i=0;i<n;i++){
  const a=(i+.5)*Math.PI*2/n,c=Math.cos(a),s=Math.sin(a),tl=Math.hypot(rx*s,rz*c),tx=-rx*s/tl,tz=rz*c/tl,nx=tz,nz=-tx;
  const px=.83*rx*c,pz=.83*rz*s,w=.9*tl*Math.PI*2/n*1.025,rot=Math.atan2(-tz,tx);let d=.14*rx*rz/tl,ok=false;
  for(let step=0;step<80;step++){
   const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[px+tx*w*.5*u+nx*d*.5*v,pz+tz*w*.5*u+nz*d*.5*v]);
   if(corners.every(p=>inside(outline,...p))&&minRadius(corners,rx,rz)>=.76){ok=true;break;}d*=.995;
  }
  if(!ok)throw Error('Unable to bound stadium plinth support '+i);
  if(!safeSpot(ctx,bb.cx+px,bb.cz+pz,w,d,rot))throw Error('Stadium plinth support crosses asphalt at sector '+i);
  ctx.physics.addWalkBox(bb.cx+px,bb.cz+pz,w,d,rot,1.15,.18);supports++;minDepth=Math.min(minDepth,d);
 }
 return {supports,top:1.15,bottom:.18,minDepth};
}
