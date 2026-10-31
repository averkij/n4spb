// Source omitted the 2nd Park Bridge. Use its mapped single-span axis/width,
// a shallow structural deck and breakable rails, leaving the channel open below.
import { ROADS } from '../data/city.js';
import { splitBays } from '../lib/fence-bays.js';
import { portedRailings } from '../lib/ported-railings.js';
export function buildMappedPark({ctx,P,M}) {
  const r=ROADS.find(r=>r.id==='w85039118');if(!r)return null;
  const [ax,az,bx,bz]=r.pts,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx),hw=(r.w||7.2)/2+1.2;
  P.push((ax+bx)/2,0,(az+bz)/2,rot);
  P.box(M.steel,-len/2,len/2,-.4,.015,-hw,hw,'',3);
  P.box(M.asphalt,-len/2,len/2,.016,.04,-hw+1.2,hw-1.2,'',3);
  for(const side of [-1,1])P.box(M.pave,-len/2,len/2,.04,.12,side>0?hw-1.2:-hw,side>0?hw:-hw+1.2,'',2);
  P.pop();
  ctx.physics.addWalkBox((ax+bx)/2,(az+bz)/2,len,hw*2,rot,.04,-.4);
  const bays=[];
  for(const side of [-1,1]){const ox=-dz/len*hw*side,oz=dx/len*hw*side;bays.push(...splitBays(ax+ox,az+oz,bx+ox,bz+oz,2.5,{y:.12}));}
  portedRailings(ctx,'parkovy2-rails',bays,M.steel,{height:1.1});
  return {id:'parkovy2',name:r.name,nameEn:'2nd Park Bridge',x:(ax+bx)/2,z:(az+bz)/2,B:{deckAt:(x,z)=>{const u=((x-ax)*dx+(z-az)*dz)/len,v=(-(x-ax)*dz+(z-az)*dx)/len;return u>=-.1&&u<=len+.1&&Math.abs(v)<=hw?.04:null;},anchors:[]}};
}
