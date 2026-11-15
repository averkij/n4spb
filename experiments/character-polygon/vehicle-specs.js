// Playground-only fittings. The red coupe and traffic sedan use the real city
// factories; these seat/door anchors adapt their exterior models for animation.
export const VEHICLES = [
  {id:'blue',name:'Blue sedan',x:4,z:1,halfWidth:.98,halfLength:2.12,height:2,occupied:false,
   seat:[-.37,.73,-.08],wheel:[-.37,1.15,-.51],floor:.49,hinge:[-.78,.8,-.82],handle:[-.81,1.11,.0],radius:.335},
  {id:'coupe',name:'Red Bibliott GT',x:10,z:1,halfWidth:.94,halfLength:2.12,height:1.3,occupied:true,
   seat:[-.4,.35,.23],wheel:[-.4,.88,-.16],floor:.19,hinge:[-.91,.65,-.58],handle:[-.94,.70,.28],radius:.335},
  {id:'traffic',name:'City traffic sedan',x:16,z:1,halfWidth:.9,halfLength:2.28,height:1.5,occupied:true,
   seat:[-.37,.52,.06],wheel:[-.37,1.04,-.35],floor:.24,hinge:[-.87,.7,-.82],handle:[-.9,.85,.22],radius:.31},
];
export const entryPhases=occupied=>occupied?
 [['open',.28],['reach',.22],['extract',.55],['recover',.22],['climb',.68],['close',.28],['settle',.08]]:
 [['open',.28],['climb',.68],['close',.28],['settle',.08]];

export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function entryPose(spec,phase,progress,occupied) {
  const u=ease(progress),w=spec.halfWidth,z=spec.seat[2];
  const start=[-w-.38,.94,z+.42],open=[-w-.68,.94,z+.62],reach=[-w-.21,.92,z+.32];
  const pull=[-w-1.32,.92,z+.64],climb=[-w-.30,.92,z+.12];
  const npcOutside=[-w-.82,.91,z+.65];
  let hip=start,yaw=-Math.PI/2,sit=0,lean=0,door=1,npcHip=spec.seat,npcSit=1,npcLean=0;
  if(phase==='open'){hip=mix(start,open,u);door=u;}
  if(phase==='reach'){hip=mix(open,reach,u);lean=u*.40;}
  if(phase==='extract') {hip=mix(reach,pull,u);lean=.4*(1-u*.5);npcHip=mix(spec.seat,npcOutside,u);const rise=ease((progress-.3)/.7);npcHip[1]=spec.seat[1]+(npcOutside[1]-spec.seat[1])*rise;npcSit=1-rise;npcLean=.35*Math.sin(u*Math.PI);}
  if(phase==='recover'){hip=mix(pull,climb,u);lean=.2*(1-u);npcHip=mix(npcOutside,[-w-1.15,.94,z+1.2],u);npcSit=0;}
  if(phase==='climb'){const from=occupied?climb:open;hip=mix(from,spec.seat,ease((progress-.2)/.8));hip[1]=from[1]+(spec.seat[1]-from[1])*ease(progress/.65);sit=u;yaw=-Math.PI/2*(1-u);lean=.28*Math.sin(u*Math.PI);npcSit=0;npcHip=[-w-1.15,.94,z+1.2];}
  if(phase==='close'||phase==='settle'){hip=spec.seat;sit=1;yaw=0;door=phase==='close'?1-u:0;npcSit=0;npcHip=[-w-1.15,.94,z+1.2];}
  return {hip,yaw,sit,lean,door,npcHip,npcSit,npcLean};
}
