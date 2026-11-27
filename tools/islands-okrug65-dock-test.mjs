// node tools/area.mjs <islands|okrug65> tools/islands-okrug65-dock-test.mjs [--winter]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build as buildDrive } from '../src/world/drive.js';
import { BEACH_SLOPES } from '../src/world/landmarksOkrug65/beach-plan.js';

const area = process.env.AREA, season = process.argv.includes('--winter') ? 'winter' : 'summer';
assert(['okrug65','islands'].includes(area));
const {ctx,L,errors} = await buildWorld({season});
assert.deepEqual(errors,[]);
document.body.classList = {toggle(){},add(){},remove(){},contains:()=>false};
ctx.audio = {context:null,muted:true,play(){}};
ctx.ui = {toast(){},modalOpen:false};
const player = new Player(ctx.camera,{addEventListener(){},requestPointerLock(){}},ctx.physics,L.WORLD.play);
player.enabled = true;
player.clampXZ = L.clampToPlay;
player.solidAt = L.insideBuilding;
ctx.playerObj = player;
ctx.interact = createInteract({camera:ctx.camera,player,ui:ctx.ui,doc:null});
await buildDrive(ctx);
const craft = ctx.drive.boats.find(v=>v.id==='boat-'+area);
assert(craft,'district craft spawned');
let start, end, landingY;
if (area === 'islands') {
  const st = ctx.services.environment.quay.allStairs.find(s=>s.walk && Math.hypot(s.x+5407.32,s.z+4762.18)<.1);
  assert(st,'north Yelagin Island stairway');
  start = [st.x-st.nx*st.w/2, st.z-st.nz*st.w/2, st.topY];
  end = [st.endX-.6*st.tx, st.endZ-.6*st.tz];
  landingY = st.landingY;
} else {
  const [a,b,c,d] = BEACH_SLOPES.find(s=>s.id==='r2186246-151').pts;
  start = [(c[0]+d[0])/2,(c[2]+d[2])/2,c[1]];
  // Half a metre inland from the waterline on the surveyed sloping sand.
  const x=(a[0]+b[0])/2, z=(a[2]+b[2])/2, length=Math.hypot(start[0]-x,start[1]-z);
  end = [x+.5*(start[0]-x)/length,z+.5*(start[1]-z)/length];
  assert.equal(ctx.physics.waterLevel(...end),null);
  landingY = ctx.physics.groundHeight(...end,1,false);
}
player.setPose(start[0],start[1],Math.atan2(start[0]-end[0],start[1]-end[1])*180/Math.PI,0,start[2]+.1,{stand:true});
player.keys.add('KeyW');
for (let i=0;i<330 && Math.hypot(player.pos.x-end[0],player.pos.z-end[1])>.075;i++) player.update(1/60);
player.keys.clear();
assert(Math.hypot(player.pos.x-end[0],player.pos.z-end[1])<.075,'walked down to the boarding point');
assert(Math.abs(player.pos.y-landingY)<.10,'standing on the landing or dry beach');
const {x,y,z} = craft.parked;
const level = ctx.physics.waterLevel(player.pos.x,player.pos.z);
assert(level == null || player.pos.y-level>.1,'dry shoes before boarding');
ctx.camera.lookAt(x,y+.8,z);
player.inputLock = 0;
assert.equal(ctx.interact.update()?.labelEn,season==='winter'?'Ride snowmobile':'Get in the motor boat');
assert(ctx.interact.use() && ctx.drive.vehicle===craft);
ctx.drive.sim(2.4,{thr:.78});
const travel = Math.hypot(craft.car.x-x,craft.car.z-z);
assert(travel>5,'departed into open water');
assert.notEqual(ctx.physics.waterLevel(craft.car.x,craft.car.z),null);
for (let i=0; i<200 && Math.hypot(craft.car.x-x,craft.car.z-z)>1.4; i++) ctx.drive.sim(.1,{brk:1});
assert(Math.hypot(craft.car.x-x,craft.car.z-z)<1.4,'returned to the boarding point');
ctx.drive.sim(1.2,{hand:true});
assert(ctx.drive.exit() && !ctx.drive.active);
console.log(area,season,'PASS dry approach, E boarding,',travel.toFixed(1),'m departure and normal dismount');
