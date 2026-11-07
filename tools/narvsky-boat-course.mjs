// CPU-only shared authoring/regression helpers. The caller builds the real
// area, removes only the player's parked hull box and leaves other craft intact.
import { carContact } from '../src/world/drive/collision.js';
export function boatPoseClear(ctx,boat,x,z,yaw,time=30){
  const ph=ctx.physics,L=ctx.L,T=boat.car.tuning,S=boat.spec,water=ph.waterLevel(x,z);
  if(water===null||!L.inPlay(x,z))return false;
  ctx.player.position.set(x,water,z);ctx.time=time;ph.refreshDynamic();
  const sy=Math.sin(yaw),cy=Math.cos(yaw),hf=T.hf+.4,hr=T.hr+.4,hw=T.hw+.4;
  const foot=[[0,0],[hf,0],[hf*.7,hw*.45],[hf*.7,-hw*.45],[hf*.2,hw],[hf*.2,-hw],[-hr*.5,hw],[-hr*.5,-hw],[-hr,hw*.9],[-hr,-hw*.9],[-hr,0]];
  for(const[a,b]of foot){const px=x+sy*a+cy*b,pz=z+cy*a-sy*b;if(ph.waterLevel(px,pz)!==water||L.insideBuilding(px,pz)||ph.inHole(px,pz,.2))return false;}
  const pose={x,z,y:water,yaw,floats:true},contact={};
  for(const b of ph.querySolids(x,z,4))if(carContact(pose,S,b,contact))return false;
  return true;
}
export function boatBankBoarding(ctx,boat,x,z,yaw){
  const ph=ctx.physics,L=ctx.L,water=ph.waterLevel(x,z),out=[];
  for(const r of [2.5,3.5,4.5,5.2])for(let k=0;k<24;k++){
    const a=k*Math.PI/12,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
    if(!L.inPlay(px,pz)||L.insideBuilding(px,pz,.3)||ph.inHole(px,pz,.3))continue;
    const y=ph.groundHeight(px,pz,10,false);
    const promptDistance=Math.hypot(r,y+1.52-(water+.8));
    if(y>water+.15&&y<=.4&&promptDistance<boat.def.reach&&!ph.columnBlocked(px,pz,.3,y+.45,y+1.75))out.push({x:px,z:pz,y,distance:r,promptDistance});
  }
  return out;
}
export function runBoatCourse(ctx,boat,pose,time=30){
  const car=boat.car;car.reset(pose.x,pose.z,pose.yaw);let elapsed=0,contacts=0,wetFailures=0;
  const run=(seconds,input)=>{for(let i=0;i<Math.round(seconds*60);i++){
    ctx.time=time+elapsed;ctx.player.position.set(car.x,car.y,car.z);car.step(1/60,input);elapsed+=1/60;
    contacts+=car.events.filter(e=>e.type==='hit'||e.type==='scrape').length;
    if(i%6===0&&!boatPoseClear(ctx,boat,car.x,car.z,car.yaw,time+elapsed))wetFailures++;
  }};
  run(4.5,{thr:1,brk:0,steer:0,hand:false});
  const launch={x:car.x,z:car.z,speed:car.speed,yaw:car.yaw,distance:Math.hypot(car.x-pose.x,car.z-pose.z)};
  run(1.1,{thr:1,brk:0,steer:1,hand:false});const turn=Math.abs(car.yaw-launch.yaw);
  run(4,{thr:0,brk:0,steer:0,hand:true});
  return{launch,turn,contacts,wetFailures,end:{x:car.x,z:car.z,yaw:car.yaw,speed:car.speed,distance:Math.hypot(car.x-pose.x,car.z-pose.z)},ok:launch.distance>30&&launch.speed>10&&turn>.15&&contacts===0&&wetFailures===0&&car.speed<.8};
}
