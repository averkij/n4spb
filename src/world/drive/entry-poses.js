export const entryPhases=(occupied,bus=false)=>bus?(occupied?
 [['open',.28],['reach',.5],['extract',.8],['recover',.22],['climb',.9],['close',.28],['settle',.08]]:
 [['open',.28],['climb',.9],['close',.28],['settle',.08]]):occupied?
 [['open',.28],['reach',.22],['extract',.55],['recover',.22],['climb',.68],['close',.28],['settle',.08]]:
 [['open',.28],['climb',.68],['close',.28],['settle',.08]];

export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function doorHandle(spec,amount){
  const side=spec.entrySide??-1,z=spec.entryZ??spec.seat[2],hinge=spec.hinge||[side*spec.halfWidth,spec.floor+.4,z-.5],handle=spec.handle||[side*(spec.halfWidth+.025),spec.floor+.48,z+.4];
  const a=side*1.15*amount,c=Math.cos(a),s=Math.sin(a),x=handle[0]-hinge[0],dz=handle[2]-hinge[2];
  return[hinge[0]+c*x+s*dz,handle[1],hinge[2]-s*x+c*dz];
}
export function entryPose(spec,phase,progress,occupied) {
  const u=ease(progress),w=spec.halfWidth,z=spec.entryZ??spec.seat[2],side=spec.entrySide??-1,bus=side===1;
  const stance=amount=>{const h=doorHandle(spec,amount);return[h[0]+side*.29,Math.min(.94,h[1]+.02),h[2]+.16];};
  const start=stance(0),open=stance(1),reach=bus?[.15,spec.floor+.94,z+.1]:[side*(w+.21),.92,z+.32];
  const pull=[side*(w+1.32),.92,z+.64],climb=[side*(w+.30),.92,z+.12];
  const npcOutside=[side*(w+.82),.91,z+.65];
  let hip=start,yaw=side*Math.PI/2,sit=0,lean=0,door=1,npcHip=spec.seat,npcSit=1,npcLean=0,footFloor=0;
  if(phase==='open'){hip=stance(u);door=u;const h=doorHandle(spec,u);yaw=Math.atan2(hip[0]-h[0],hip[2]-h[2]);lean=.22;}
  if(phase==='reach'){hip=mix(open,reach,u);yaw=side*(Math.atan2(.29,.16)*(1-u)+Math.PI/2*u);lean=.22+.18*u;if(bus)footFloor=spec.floor*u;}
  if(phase==='extract') {hip=mix(reach,pull,u);lean=.4*(1-u*.5);npcHip=mix(spec.seat,npcOutside,u);const rise=ease((progress-.3)/.7);npcHip[1]=spec.seat[1]+(npcOutside[1]-spec.seat[1])*rise;npcSit=1-rise;npcLean=.35*Math.sin(u*Math.PI);if(bus)footFloor=spec.floor*(1-u);}
  if(phase==='recover'){hip=mix(pull,climb,u);lean=.2*(1-u);npcHip=mix(npcOutside,[side*(w+1.15),.94,z+1.2],u);npcSit=0;}
  if(phase==='climb'){const from=occupied?climb:open;hip=mix(from,spec.seat,ease((progress-.2)/.8));hip[1]=from[1]+(spec.seat[1]-from[1])*ease(progress/.65);sit=u;yaw=side*(occupied?Math.PI/2:Math.atan2(.29,.16))*(1-u);lean=.28*Math.sin(u*Math.PI)+(occupied?0:.22*(1-u));npcSit=0;npcHip=[side*(w+1.15),.94,z+1.2];
    if(bus){hip=progress<.45?mix(from,reach,ease(progress/.45)):mix(reach,spec.seat,ease((progress-.45)/.55));sit=ease((progress-.45)/.55);footFloor=spec.floor*ease(progress/.45);}}
  if(phase==='close'||phase==='settle'){hip=spec.seat;sit=1;yaw=0;door=phase==='close'?1-u:0;npcSit=0;npcHip=[side*(w+1.15),.94,z+1.2];}
  return {hip,yaw,sit,lean,door,npcHip,npcSit,npcLean,footFloor};
}
