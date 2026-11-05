// The mapped Tsarskoselsky railway decks cross BOTH embankment roads.
// One shared datum keeps the parallel tracks and their switches continuous.
import { BRIDGES } from '../data/city.js';

const deck = BRIDGES.find(b => b.id === 'r11704745');
export const DECK_Y = 6.4, DECK_THICKNESS = .8, APPROACH = 180;
const rings = deck?.polys.map(p => p.o) || [];
const points = rings.flatMap(r => Array.from({length:r.length/2}, (_,i) => [r[i*2],r[i*2+1]]));
const origin = points[0] || [0,0];
let tx=0,tz=1,longest=0;
for(const r of rings) for(let i=0;i<r.length;i+=2){
  const j=(i+2)%r.length, dx=r[j]-r[i], dz=r[j+1]-r[i+1], len=Math.hypot(dx,dz);
  if(len>longest){longest=len;tx=dx/len;tz=dz/len;if(tz<0){tx=-tx;tz=-tz;}}
}
const uv=(x,z)=>[(x-origin[0])*tx+(z-origin[1])*tz,(x-origin[0])*tz-(z-origin[1])*tx];
const local=points.map(p=>uv(...p));
const lo=Math.min(...local.map(p=>p[0])),hi=Math.max(...local.map(p=>p[0]));
const left=Math.min(...local.map(p=>p[1])),right=Math.max(...local.map(p=>p[1]));
function height(u){const d=Math.max(lo-u,0,u-hi);return DECK_Y*Math.max(0,1-d/APPROACH);}
export function railLift(x,z){
  if(!rings.length)return 0;
  const dx=x-origin[0],dz=z-origin[1],u=dx*tx+dz*tz,v=dx*tz-dz*tx;
  // Allow switches and mast footings beside the mapped running tracks.
  // Fade across the yard fan too: tracks entering the side of the approach
  // must not jump vertically at a rectangular influence boundary.
  const side=Math.max(left-12-v,0,v-right-12);
  return height(u)*Math.max(0,1-side/120);
}
export function onObvodnySpan(x,z){const dx=x-origin[0],dz=z-origin[1],u=dx*tx+dz*tz,v=dx*tz-dz*tx;return rings.length>0&&u>=lo&&u<=hi&&v>=left-3&&v<=right+3;}
const world=(u,v,y)=>[origin[0]+tx*u+tz*v,y,origin[1]+tz*u-tx*v];

export function buildObvodnyDecks(ctx,bk){
  for(const ring of rings){
    const p=Array.from({length:ring.length/2},(_,i)=>uv(ring[i*2],ring[i*2+1])).sort((a,b)=>a[0]-b[0]);
    const a=p.slice(0,2).sort((a,b)=>a[1]-b[1]),b=p.slice(-2).sort((a,b)=>a[1]-b[1]);
    const u0=(a[0][0]+a[1][0])/2,u1=(b[0][0]+b[1][0])/2;
    const cuts=[lo,hi],samples=[];
    for(let k=1;k<cuts.length;k++){
      const n=Math.ceil((cuts[k]-cuts[k-1])/6);
      for(let i=0;i<n;i++)samples.push(cuts[k-1]+(cuts[k]-cuts[k-1])*i/n);
    }
    samples.push(cuts.at(-1));
    const section=u=>{const f=Math.max(0,Math.min(1,(u-u0)/(u1-u0)));return [world(u,a[0][1]+(b[0][1]-a[0][1])*f,height(u)),world(u,a[1][1]+(b[1][1]-a[1][1])*f,height(u))];};
    for(let i=1;i<samples.length;i++){
      const [a,b]=section(samples[i-1]),[d,c]=section(samples[i]);
      const mid=[(a[0]+c[0])/2,(a[2]+c[2])/2],B=bk.get('concrete',...mid);
      const down=p=>[p[0],p[1]-DECK_THICKNESS,p[2]], A=down(a),B0=down(b),C=down(c),D=down(d);
      const ctr=[mid[0],(a[1]+c[1])/2-DECK_THICKNESS/2,mid[1]];
      bk.get('ballast',...mid).face(a,d,c,b,null,[a,d,c,b].map(p=>[p[0]/2.2,p[2]/2.2]));
      B.face(A,D,C,B0,null,null,ctr);
      B.face(a,d,D,A,null,null,ctr); B.face(b,B0,C,c,null,null,ctr);
      ctx.physics.addWalkTriangle([a,b,c],DECK_THICKNESS);
      ctx.physics.addWalkTriangle([a,c,d],DECK_THICKNESS);
    }
    // Abutments only beyond the road openings; no pier blocks canal traffic.
    for(const u of [lo-35,hi+35]){
      const [a,b]=section(u),x=(a[0]+b[0])/2,z=(a[2]+b[2])/2;
      if(ctx.L.inRiver(x,z)||ctx.L.isOnRoad(x,z,2))continue;
      const top=height(u)-DECK_THICKNESS,w=Math.hypot(b[0]-a[0],b[2]-a[2]);
      bk.get('concrete',x,z).box(x,top/2,z,w/2,top/2,1.2,Math.atan2(tx,tz));
      ctx.physics.addBox(x,z,w,2.4,Math.atan2(tx,tz),0,top);
    }
  }
}
