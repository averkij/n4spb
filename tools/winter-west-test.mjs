// node tools/area.mjs {gavan|morskoy|dekabristov} tools/winter-west-test.mjs [--summer]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { build as buildDrive } from '../src/world/drive.js';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { STAIR_PITS } from '../src/world/bridges/pits.js';
import { FK } from '../src/world/landmarksGavan/frame.js';

const area=process.env.AREA, winter=!process.argv.includes('--summer');
const {ctx,L,errors}=await buildWorld({season:winter?'winter':'summer',skip:['traffic','people','wildlife','metro','drive']});
assert.deepEqual(errors,[]);
document.body.classList={toggle(){},add(){},remove(){},contains:()=>false};
ctx.audio={context:null,muted:true,play(){}};
ctx.ui={toast(){},modalOpen:false};
const ph=ctx.physics, player=new Player(ctx.camera,{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
ctx.playerObj=player;ctx.interact=createInteract({camera:ctx.camera,player,ui:ctx.ui,doc:null});
if(winter) buildWinter(ctx);
await buildDrive(ctx);

const primary={
  gavan:['kronspitz-east-dormers','sevkabel-holiday-post',-6237,866],
  morskoy:['fleet-creators-ship-and-propeller','bellingshausen-celestial-globe',-7872,-606],
  dekabristov:['xenia-gilded-cupola','primorskaya-photo-lantern',-6527,-1807],
};
const [modelId,fixtureId,x,z]=primary[area],model=ctx.scene.getObjectByName(modelId);
assert(model,modelId);
assert(model.geometry.index.count>150 && Number.isFinite(model.userData.lodFar),modelId+' mesh/LOD');
const fixtures=ctx.knock.list.filter(o=>o.parts.some(p=>p.mesh?.name.startsWith(fixtureId)));
assert.equal(fixtures.length,winter?1:0,fixtureId);
if(winter && area==='dekabristov') {
  assert(!ph.columnBlocked(x,z,.40,.32,2.15),'photo lantern doorway');
  assert(ctx.scene.getObjectByName('lmsmol-forest-bare-far2'),'leafless forest');
}
if(winter && area!=='gavan') {
  assert.equal(ph.groundHeight(-7994.7,-2078.9,.50).toFixed(3),'0.335','Volodin pedestrian winter surface');
  assert.equal(ctx.services.liveFountains?.records?.length||0,0);
}
if(!winter && area!=='gavan') assert(ctx.services.liveFountains.records.some(f=>f.id==='w1396274666'));
if(winter && area==='gavan') {
  player.setPose(x,z+1.2,0,0,0,{stand:true}); player.inputLock=0;
  ctx.camera.lookAt(x,1.48,z);
  assert.equal(ctx.interact.update()?.id,fixtureId);assert(ctx.interact.use());
  assert.notEqual(ctx.interact.update()?.id,fixtureId,'card was posted only once');
}

function bridgeRoute(id) {
  const ring=STAIR_PITS.find(p=>p.id===id).ring;
  const mid=(a,b)=>({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2});
  const mouth=mid(ring[0],ring[3]),top=mid(ring[1],ring[2]);
  const length=Math.hypot(top.x-mouth.x,top.z-mouth.z);
  return [{x:top.x+.8*(top.x-mouth.x)/length,z:top.z+.8*(top.z-mouth.z)/length},{x:mouth.x+.47*(top.x-mouth.x)/length,z:mouth.z+.47*(top.z-mouth.z)/length}];
}
const landings=area==='gavan'
  ? [['boat-gavan',[FK.W(19.57,-20.80),FK.W(15.90,-20.80)]]]
  : [['boat-morskoy',bridgeRoute('korablestroiteley-s-')],['boat-dekabristov',bridgeRoute('smol4-n-')]];
for(const [id,[top,edge]] of landings) {
  const craft=ctx.drive.boats.find(v=>v.id===id);
  assert(craft,id+' home craft');
  const yaw=Math.atan2(top.x-edge.x,top.z-edge.z)*180/Math.PI;
  player.setPose(top.x,top.z,yaw,0,.12,{stand:true});
  player.inputLock=0;
  const {x,z,y}=craft.parked,level=ph.waterLevel(x,z);
  assert(Number.isFinite(level),id+' home water');
  const label=winter?'Ride snowmobile':'Get in the motor boat';
  player.keys.add('KeyW');
  let dryBoarding=false;
  for(let i=0;i<240;i++) {
    player.update(1/60);
    const height=player.pos.y-level;
    if(!player.onGround || height<=.02 || height>1.12) continue;
    ctx.camera.lookAt(x,y+.8,z);
    if(ctx.interact.update()?.labelEn===label) { dryBoarding=true; break; }
  }
  player.keys.clear();
  assert(dryBoarding,id+' E after walking to the dry landing '+JSON.stringify(player.pos));
  assert(ctx.interact.use() && ctx.drive.vehicle===craft);
  ctx.drive.sim(2.7,{thr:.78});
  assert(Math.hypot(craft.car.x-x,craft.car.z-z)>5,id+' clear departure');
  assert.equal(ph.waterLevel(craft.car.x,craft.car.z),level);assert(ctx.drive.exit(true));
}
console.log('PASS',area, winter?'winter':'summer',landings.map(r=>r[0]).join(', '));
