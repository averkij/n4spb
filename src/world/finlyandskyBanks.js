// Surveyed Sverdlovskaya shoreline: lower promenade, retaining tier, grass
// slope and mapped access stairs. See research/finlyandsky-waterfront.md.
import * as THREE from 'three';
import { Parts } from './landmarksD/kit.js';
import { SURFACES,FRAMES,STAIR_SITES,ACCESS_ROADS,ACCESS_PATHS,LOWER_Y,bankHeight } from '../areas/finlyandsky/bank-profile.js';
import { BANK_RINGS as LANDINGS } from './finlyandskyWaterfront/sites.js';
import { knockBays,faceLeft,unitBox } from './lib/fence-bays.js';
import { registerLOD } from '../core/spatial.js';
export const OWNS_GROUPS=true;
const inRing=(x,z,p)=>{let q=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])q=!q;return q;};
export function build(ctx){
  const P=new Parts(),root=new THREE.Group();root.name='finlyandsky-banks';
  const stone=ctx.mat.toon('#a49b90',{paint:.035}),asphalt=ctx.mat.toon('#686d70'),grass=ctx.mat.toon('#608b44'),coping=ctx.mat.toon('#b6ac9d'),dirt=ctx.mat.toon('#a88f76',{paint:.06});
  const mats={wall:stone,retaining:stone,walk:asphalt,upper:asphalt,grass};
  for(const s of SURFACES){const [a,b,c]=s.p,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],n=s.walk?[0,1,0]:[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];P.fan(mats[s.kind],s.p,n);}
  const bays=[];
  for(let i=0;i+1<FRAMES.length;i++){
    const a=FRAMES[i],b=FRAMES[i+1],mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
    if(LANDINGS.some(r=>inRing(mx,mz,r.ring)))continue;
    const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/2.4));
    for(let j=0;j<n;j++){
      const t=j/n,u=(j+1)/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,xx=a.x+(b.x-a.x)*u,zz=a.z+(b.z-a.z)*u;
      if(LANDINGS.some(r=>[[x,z],[(x+xx)/2,(z+zz)/2],[xx,zz]].some(p=>inRing(...p,r.ring))))continue;
      if(ACCESS_ROADS.some(r=>Math.hypot((x+xx)/2-r.pts.at(-2),(z+zz)/2-r.pts.at(-1))<r.w/2+2))continue;
      bays.push(faceLeft(x,z,xx,zz,a.nx,a.nz,{y:a.y+(b.y-a.y)*t,ye:a.y+(b.y-a.y)*u}));
    }
  }
  // Every low wall is a physical breakable bay, with finite nearby detail.
  knockBays(ctx,{name:'finlyandsky-lower-parapet',bays,parts:[{name:'body',geo:unitBox(0,.83,-.04,.37),mat:stone,stretch:true,far:400},{name:'cap',geo:unitBox(.83,.96,-.09,.42),mat:coping,stretch:true,far:400}],far:400,collider:q=>({y0:Math.min(q.y,q.ye),y1:Math.max(q.y,q.ye)+.96,thick:.46,off:.16,e0:0,e1:0}),rec:()=>({kind:'fence',mass:220,h:.96,r:.08,anchored:14,hitK:.24,minDv:0})});
  let stairs=0;
  for(const {id,f}of STAIR_SITES){
    const rot=Math.atan2(f.nx,f.nz),w=2.1,run=f.width-3.5,n=14;
    P.push(f.x+f.nx*3.5,0,f.z+f.nz*3.5,rot);
    for(let i=0;i<n;i++){const y=LOWER_Y+(i+1)/n*2,z0=run*i/n,z1=run*(i+1)/n;P.box(coping,-w/2,w/2,y-.15,y,z0,z1);ctx.physics.addWalkBox(f.x+f.nx*(3.5+(z0+z1)/2),f.z+f.nz*(3.5+(z0+z1)/2),w,z1-z0+.025,rot,y,y-.15);}
    P.pop();stairs++;
  }
  for(const r of [...ACCESS_ROADS,...ACCESS_PATHS])for(let i=0;i+3<r.pts.length;i+=2){
    const [x,z,xx,zz]=r.pts.slice(i,i+4),dx=xx-x,dz=zz-z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l,n=Math.ceil(l);
    const at=(t,side)=>{const a=x+dx*t+nx*r.w/2*side,b=z+dz*t+nz*r.w/2*side;return[a,(bankHeight(a,b)??0)+.015,b];};
    for(let j=0;j<n;j++)P.quad(r.hw==='path'?dirt:asphalt,at(j/n,-1),at((j+1)/n,-1),at((j+1)/n,1),at(j/n,1),[0,1,0]);
  }
  for(const m of P.build(root,{name:'finlyandsky-bank-terrain'})){registerLOD(m,1400);m.receiveShadow=true;}
  ctx.addStatic(root);ctx.services.finlyandskyBanks={triangles:P.tris,stairs,parapets:bays.length,groundAt:bankHeight,lowerY:LOWER_Y};
}
