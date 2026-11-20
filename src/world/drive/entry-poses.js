export const OPEN_DURATION=.82;
export const entryPhases=(occupied,bus=false)=>bus?(occupied?
 [['open',OPEN_DURATION],['reach',.5],['extract',.8],['recover',.22],['climb',.9],['close',.28],['settle',.08]]:
 [['open',OPEN_DURATION],['climb',.9],['close',.28],['settle',.08]]):occupied?
 [['open',OPEN_DURATION],['reach',.22],['extract',.55],['recover',.22],['climb',.68],['close',.28],['settle',.08]]:
 [['open',OPEN_DURATION],['climb',.68],['close',.28],['settle',.08]];

export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function doorHandle(spec,amount){
  const side=spec.entrySide??-1,z=spec.entryZ??spec.seat[2],hinge=spec.hinge||[side*spec.halfWidth,spec.floor+.4,z-.5],handle=spec.handle||[side*(spec.halfWidth+.025),spec.floor+.48,z+.4];
  const a=side*1.15*amount,c=Math.cos(a),s=Math.sin(a),x=handle[0]-hinge[0],dz=handle[2]-hinge[2];
  return[hinge[0]+c*x+s*dz,handle[1],hinge[2]-s*x+c*dz];
}
export function entryPose(spec,phase,progress,occupied) {
  const u=ease(progress),w=spec.halfWidth,z=spec.entryZ??spec.seat[2],side=spec.entrySide??-1,bus=side===1;
  // The closed-door stance is also the walking approach and exit destination.
  // Clear the parked body's 0.04 m margin plus the 0.30 m exit probe, with
  // another 0.06 m for rounding/pose variation. Keep the car solid while the
  // route is checked; an animation handle alone is not a safe walking anchor.
  const handle=doorHandle(spec,0);
  // Stand behind the trailing edge, with the working shoulder towards the car.
  const start=[side*(w+.40),.89,Math.max(handle[2]+.24,-(spec.doorRear??spec.rear)+.12)];
  const reach=bus?[.15,spec.floor+.94,z+.1]:[side*(w+.21),.92,z+.32];
  const stanceYaw=side*.16;
  const pull=[side*(w+1.32),.92,z+.64],climb=[side*(w+.30),.92,z+.12];
  const npcOutside=[side*(w+.82),.91,z+.65];
  let hip=start,yaw=side*Math.PI/2,sit=0,lean=0,door=1,npcHip=spec.seat,npcSit=1,npcLean=0,footFloor=0,boarding=0,approach=1;
  if(phase==='open'){
    yaw=stanceYaw;
    door=ease((progress-.24)/.68);
    const grasp=ease(progress/.24)*(1-ease((progress-.52)/.48));
    hip=[start[0],start[1]-Math.max(0,start[1]-handle[1]+.10)*grasp,start[2]];
    lean=.46*grasp;
  }
  if(phase==='reach'){hip=mix(start,reach,u);yaw=stanceYaw*(1-u)+side*Math.PI/2*u;lean=.4*u;if(bus)footFloor=spec.floor*u;}
  if(phase==='extract') {hip=mix(reach,pull,u);lean=.4*(1-u*.5);npcHip=mix(spec.seat,npcOutside,u);const rise=ease((progress-.3)/.7);npcHip[1]=spec.seat[1]+(npcOutside[1]-spec.seat[1])*rise;npcSit=1-rise;npcLean=.35*Math.sin(u*Math.PI);if(bus)footFloor=spec.floor*(1-u);}
  if(phase==='recover'){hip=mix(pull,climb,u);lean=.2*(1-u);npcHip=mix(npcOutside,[side*(w+1.15),.94,z+1.2],u);npcSit=0;}
  if(phase==='climb'){
    const from=occupied?climb:start;npcSit=0;npcHip=[side*(w+1.15),.94,z+1.2];
    if(bus){hip=progress<.45?mix(from,reach,ease(progress/.45)):mix(reach,spec.seat,ease((progress-.45)/.55));sit=ease((progress-.45)/.55);footFloor=spec.floor*ease(progress/.45);yaw=side*(occupied?Math.PI/2:Math.abs(stanceYaw))*(1-u);lean=.28*Math.sin(u*Math.PI);}
    else {
      // Empty cars start beside the open handle: step back to the sill first.
      // Lead with the inside foot, move hips into the doorway, THEN sit down.
      approach=occupied?1:ease(progress/.22);boarding=Math.max(0,(progress-(occupied?0:.22))/(occupied?1:.78));
      hip=mix(mix(from,climb,approach),spec.seat,ease(boarding/.5));
      const duck=Math.max(0,Math.min(1,(1.9-spec.roof)/.6));
      sit=ease((boarding-.32)/.56);hip[1]=Math.max(spec.seat[1],(from[1]+(climb[1]-from[1])*approach)*(1-sit)+spec.seat[1]*sit-.58*duck*Math.sin(boarding*Math.PI)*(1-sit));
      yaw=side*((occupied?Math.PI/2:Math.abs(stanceYaw))*(1-approach)+Math.PI/2*approach)*(1-ease(boarding/.85));
      lean=.75*duck*Math.sin(Math.min(1,boarding/.85)*Math.PI);
      // Catch the door while entering, so a seated driver can finish pulling
      // it shut without sliding the pelvis back out of the cabin.
      door=1-.84*ease((boarding-.55)/.45);
    }
  }
  if(phase==='close'||phase==='settle'){hip=spec.seat;sit=1;yaw=0;door=phase==='close'?(bus?1:.16)*(1-u):0;npcSit=0;npcHip=[side*(w+1.15),.94,z+1.2];}
  return {hip,yaw,sit,lean,door,npcHip,npcSit,npcLean,footFloor,boarding,approach};
}
