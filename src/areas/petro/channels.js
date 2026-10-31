// The source clips park water at bridge/sluice decks. Author the missing wet
// necks beneath those mapped crossings, keeping the existing road above them.
import { RIVER, WATER, EXTENT_RECTS } from '../../world/data/city.js';
import { PONDS, SLUICES } from '../../world/bridges/yelaginPonds/specs.js';
import { SMALL } from '../../world/bridges/kamenny/spec.js';
import { ISLANDS2_WATER } from '../../world/environment/islands2-context.js';
const inside=(x,z,o)=>{let yes=false;for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])yes=!yes;return yes;};
const mappedWater=[...RIVER,...WATER].flatMap(r=>r.polys.map(p=>p.o)).concat(ISLANDS2_WATER.map(p=>p.o));
const wet=(x,z)=>mappedWater.some(o=>inside(x,z,o));
const rows=[...PONDS,...SLUICES].map(p=>({id:p.id,x:(p.a[0]+p.b[0])/2,z:(p.a[1]+p.b[1])/2,a:Math.atan2(p.b[1]-p.a[1],p.b[0]-p.a[0]),hw:p.hw||p.wd/2})).concat(SMALL.map(p=>({id:p.id,x:p.cx,z:p.cz,a:(p.b-90)*Math.PI/180,hw:Math.max(...p.strips.flatMap(s=>[Math.abs(s[0]),Math.abs(s[1])]))})));
export const CHANNELS=rows.filter(p=>EXTENT_RECTS.some(r=>p.x>=r.x0&&p.x<=r.x1&&p.z>=r.z0&&p.z<=r.z1)).flatMap(p=>{
 const c=Math.cos(p.a),s=Math.sin(p.a),at=(u,v)=>[p.x+c*u-s*v,p.z+s*u+c*v];
 const end=sg=>{for(let d=p.hw+2;d<=60;d+=1){const [x,z]=at(0,sg*d);if(wet(x,z))return sg*(d+4);}return null;};
 const lo=end(-1),hi=end(1);if(lo==null||hi==null)return [];
 return [{id:'channel-'+p.id,key:'neva',ring:[[-3.5,lo],[3.5,lo],[3.5,hi],[-3.5,hi]].flatMap(q=>at(...q))}];
});
