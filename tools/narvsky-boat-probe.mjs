// CPU only; no runtime/bake mutation. Includes wildlife and actual nearby craft.
// node tools/area.mjs narvsky tools/narvsky-boat-probe.mjs [--pose x,z,degrees]
import { buildWorld } from './lib/headless-world.mjs';
import { boatPoseClear,boatBankBoarding,runBoatCourse } from './narvsky-boat-course.mjs';
const {ctx,errors}=await buildWorld({modules:['environment','streets','city','landmarksNarvsky','coastalBridges','props','traffic','wildlife','drive']});
if(errors.length)throw Error(errors.join('\n'));
const boat=ctx.drive.boats.find(b=>b.id==='boat-narvsky');ctx.physics.remove(boat.box);
const pi=process.argv.indexOf('--pose');
if(pi>=0){const[x,z,d]=process.argv[pi+1].split(',').map(Number),pose={x,z,yaw:d*Math.PI/180};console.log(JSON.stringify({pose,clear:boatPoseClear(ctx,boat,x,z,pose.yaw),boarding:boatBankBoarding(ctx,boat,x,z,pose.yaw),runs:[0,30,60].map(t=>({t,...runBoatCourse(ctx,boat,pose,t)}))},null,2));process.exit(0);}
const current={...boat.parked};console.log('CURRENT',JSON.stringify(runBoatCourse(ctx,boat,current)));
const near=ctx.services.craftSolids.list.filter(c=>Math.hypot(c.box.cx-current.x,c.box.cz-current.z)<100).map(c=>({id:c.id,moving:c.moving,x:c.box.cx,z:c.box.cz,w:c.box.w,d:c.box.d,rot:c.box.rotY}));console.log('PRESERVED_NEARBY_CRAFT',JSON.stringify(near));
const positions=[{x:current.x,z:current.z}];for(const r of [2,4,6,8])for(let k=0;k<8;k++)positions.push({x:current.x+Math.cos(k*Math.PI/4)*r,z:current.z+Math.sin(k*Math.PI/4)*r});
const accepted=[];
for(const p of positions){
  const boarding=boatBankBoarding(ctx,boat,p.x,p.z,0);if(!boarding.length)continue;
  for(let d=0;d<360;d+=10){const yaw=d*Math.PI/180;if(!boatPoseClear(ctx,boat,p.x,p.z,yaw))continue;
    let clear=true;for(let s=2;s<=35;s+=2)if(!boatPoseClear(ctx,boat,p.x+Math.sin(yaw)*s,p.z+Math.cos(yaw)*s,yaw)){clear=false;break;}
    if(!clear)continue;
    const pose={...p,yaw},result=runBoatCourse(ctx,boat,pose);if(result.ok){accepted.push({pose,degrees:d,boarding:boarding[0]||null,result});console.log('ACCEPTED',JSON.stringify(accepted.at(-1)));}
  }
  if(accepted.length>=3)break;
}
console.log('RESULT',JSON.stringify(accepted));process.exit(accepted.length?0:1);
