// CPU authoring diagnostic. Does not change GARAGE, the registry or any bake.
// node tools/area.mjs narvsky tools/narvsky-garage-probe.mjs
import { buildWorld } from './lib/headless-world.mjs';
const {ctx,L,errors}=await buildWorld({modules:['environment','streets','city','landmarksNarvsky','coastalBridges','props','traffic','drive']});
if(errors.length)throw Error(errors.join('\n'));
const ph=ctx.physics,st=ctx.services.streets,net=st.net,parked=(ctx.services.traffic.parked||[]).filter(p=>p.x> -4500&&p.x< -4200&&p.z>3400&&p.z<3650);
const own=ctx.drive.fleet.find(v=>v.id==='lada');ph.remove(own.box);
const S=own.spec,lanes=st.lanes.filter(l=>l.rank>0),localSegments=[];
for(const l of lanes)for(let i=0;i+1<l.pts.length;i++){const a=l.pts[i],b=l.pts[i+1];if(Math.max(a[0],b[0])< -4450||Math.min(a[0],b[0])> -4255||Math.max(a[1],b[1])<3450||Math.min(a[1],b[1])>3600)continue;localSegments.push({a,b,width:l.width||3});}
const gap=(x,z)=>{let best=Infinity;for(const {a,b,width} of localSegments){
  if(x<Math.min(a[0],b[0])-12||x>Math.max(a[0],b[0])+12||z<Math.min(a[1],b[1])-12||z>Math.max(a[1],b[1])+12)continue;
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  best=Math.min(best,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)-width/2);
}return best;};
const blocked=(x,z)=>!L.inPlay(x,z,2)||L.insideBuilding(x,z,.3)||Math.abs(L.heightAt(x,z))>.35||ph.columnBlocked(x,z,.3,.3,1.3);
function probe(x,z,yaw){
  const sy=Math.sin(yaw),cy=Math.cos(yaw),pt=(f,b)=>[x+sy*f+cy*b,z+cy*f-sy*b];
  let minGap=Infinity;
  for(const f of [S.rear,0,S.front])for(const b of [-S.W/2,0,S.W/2]){
    const [px,pz]=pt(f,b);if(blocked(px,pz)||parked.some(q=>Math.hypot(q.x-px,q.z-pz)<3.2))return null;
    minGap=Math.min(minGap,gap(px,pz));
  }
  if(minGap<.7)return null;
  let clear=0;
  for(let f=0;f<=65;f+=.5){let stop=false;for(const b of [-S.W/2-.35,0,S.W/2+.35]){const p=pt(S.front+f,b);if(blocked(...p)||parked.some(q=>Math.hypot(q.x-p[0],q.z-p[1])<2.8)){stop=true;break;}}if(stop)break;clear=f;}
  const side=k=>[-1.4,0,1.4].every(f=>!blocked(...pt(f,k*(S.W/2+1))));
  return{x,z,yaw,yawDeg:yaw*180/Math.PI,clear,minGap,roadCover:net.cover(x,z,{}),leftFree:side(1),rightFree:side(-1),heroDistance:Math.hypot(x-L.HERO.x,z-L.HERO.z)};
}
const old=probe(-4363,3547,0);console.log('CURRENT',JSON.stringify(old));
const pi=process.argv.indexOf('--pose');
if(pi>=0){
  const [x,z,degrees]=process.argv[pi+1].split(',').map(Number),yaw=degrees*Math.PI/180;
  const result=probe(x,z,yaw);console.log('PROPOSED',JSON.stringify(result));
  const car=own.car;car.reset(x,z,yaw);let impacts=[];
  for(let i=0;i<120;i++){car.step(1/60,{thr:1,brk:0,steer:0,hand:false,nitro:false});impacts.push(...car.events.filter(e=>e.type==='hit'));}
  console.log('THROTTLE2S',JSON.stringify({x:car.x,z:car.z,speed:car.speed,yaw:car.yaw,distance:Math.hypot(car.x-x,car.z-z),impacts}));
  for(let i=0;i<240;i++){car.step(1/60,{thr:0,brk:0,steer:0,hand:true,nitro:false});impacts.push(...car.events.filter(e=>e.type==='hit'));}
  console.log('BRAKE4S',JSON.stringify({x:car.x,z:car.z,speed:car.speed,yaw:car.yaw,distance:Math.hypot(car.x-x,car.z-z),impacts}));
  process.exit(result?.clear>=35&&impacts.length===0&&car.speed<.8?0:1);
}
const candidates=[];
for(let x=-4435;x<=-4270;x+=3)for(let z=3470;z<=3585;z+=3){
  if(blocked(x,z)||net.cover(x,z,{})>-.8)continue;
  const r=L.nearestRoad(x,z,{drivable:true,maxDist:18});if(!r)continue;
  const yaw=Math.atan2(r.tx,r.tz);
  for(const a of [yaw,yaw+Math.PI]){const p=probe(x,z,a);if(p&&p.clear>=38&&(p.leftFree||p.rightFree))candidates.push({...p,street:r.road.name,road:r.road.id});}
}
candidates.sort((a,b)=>a.heroDistance-b.heroDistance||b.clear-a.clear);
console.log('NEAREST_CLEAR',JSON.stringify(candidates.slice(0,20),null,2));
// Evaluate rotating the current pose as well as moving the car.
const rotated=[];for(let d=0;d<360;d+=5){const p=probe(-4363,3547,d*Math.PI/180);if(p&&p.clear>=38)rotated.push(p);}
console.log('CURRENT_ROTATIONS',JSON.stringify(rotated.sort((a,b)=>b.clear-a.clear).slice(0,10),null,2));
