// node tools/area.mjs moskovskaya tools/moskovskaya-winter-test.mjs [--summer]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { MOSKOVSKAYA_SQUARES } from '../src/world/winter-moskovskaya.js';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build as buildDrive } from '../src/world/drive.js';

assert.equal(process.env.AREA,'moskovskaya');
const winter=!process.argv.includes('--summer'),season=winter?'winter':'summer';
const {ctx,L,errors}=await buildWorld({season,skip:['drive']});
assert.deepEqual(errors,[]);
document.body.classList={toggle(){},add(){},remove(){},contains:()=>false};
ctx.ui={toast(){},modalOpen:false};ctx.audio={context:null,muted:true,play(){}};
const player=new Player(ctx.camera,{addEventListener(){},requestPointerLock(){}},ctx.physics,L.WORLD.play);
player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;ctx.playerObj=player;
ctx.interact=createInteract({camera:ctx.camera,player,ui:ctx.ui,doc:null});
await buildDrive(ctx);
if(winter)buildWinter(ctx);
const meshes=[];
ctx.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
const figures=meshes.filter(o=>o.name==='moskovsky-gate-genii');
assert.equal(figures.reduce((n,o)=>n+o.count,0),30);
assert(figures.every(o=>o.geometry.index.count/3>500));
const library=ctx.services.landmarksMoskovskaya.libraryFountain;
assert.equal(library.bowls.length,6);
assert.equal(library.animation.jets>0,!winter);
assert.equal(!!ctx.scene.getObjectByName('rnb-water-jets'),!winter);
assert.equal(!!ctx.scene.getObjectByName('snow-filled-w32073130'),winter);
assert.equal(meshes.some(o=>o.material?.name==='rnb-basin-snow'),winter);
assert.equal(meshes.some(o=>o.name.startsWith('mz-strugatsky-bare-')),winter);
assert.equal(meshes.some(o=>o.name.startsWith('mz-strugatsky-trees-')),!winter);
for(const site of MOSKOVSKAYA_SQUARES){
  assert.equal(!!ctx.scene.getObjectByName('holiday-'+site.id),winter,site.id);
  if(!winter)continue;
  for(const [prefix,points] of [['festive-arch',site.arches],['festive-bauble',site.orbs],['festive-market-hut',site.huts||[]]]){
    for(const [x,z] of points)assert(ctx.knock.list.some(r=>r.x===x&&r.z===z&&r.parts.some(p=>p.mesh?.name.startsWith(prefix))),site.id+' '+prefix+' at '+[x,z]);
  }
}
const horses=ctx.knock.list.filter(r=>r.kind==='troika-horse');
assert.equal(horses.length,winter?3:0);
assert.equal(ctx.knock.list.filter(r=>r.kind==='troika-sleigh').length,winter?1:0);
if(winter){
  assert.equal(ctx.knock.hit(horses[0].x,horses[0].z,48,1,0,'troika-horse'),horses[0]);
  assert.equal(horses[0].state,'fly');
  assert(horses.slice(1).every(h=>h.state==='stand'&&h.items.length===1));
}

// Stand on the dry north bank and use the normal camera/E prompt.
const drive=ctx.drive,craft=drive.boats.find(v=>v.id==='boat-victory-admiralty');
assert(craft);
const p=craft.parked,bank={x:-1182.1,z:7319.5};
assert.equal(ctx.physics.waterLevel(bank.x,bank.z),null);
player.setPose(bank.x,bank.z,180,0,.1,{stand:true});
ctx.camera.lookAt(p.x,p.y+.8,p.z);player.inputLock=0;
assert.equal(ctx.interact.update()?.labelEn,winter?'Ride snowmobile':'Get in the motor boat');
assert(ctx.interact.use()&&drive.active&&drive.vehicle===craft);
const distance=()=>Math.hypot(craft.car.x-p.x,craft.car.z-p.z);
drive.sim(2.2,{thr:.87});
assert(distance()>5,'vessel departs into open pond');
for(let i=0;i<180&&distance()>1.4;i++)drive.sim(.10,{brk:1});
assert(distance()<1.4,'vessel returns to launch');
drive.sim(1.2,{hand:true});
assert(drive.exit()&&!drive.active,'normal dismount at the launch');
player.yaw=Math.atan2(player.pos.x-bank.x,player.pos.z-bank.z);
player.keys.add('KeyW');
for(let i=0;i<300 && ctx.physics.waterLevel(player.pos.x,player.pos.z)!=null;i++)player.update(1/60);
player.keys.clear();
assert.equal(ctx.physics.waterLevel(player.pos.x,player.pos.z),null,'walker returns to the dry shore');
console.log('PASS '+season+' gate reliefs, park planting and fountains, fair, shore boarding, pond departure and return');
