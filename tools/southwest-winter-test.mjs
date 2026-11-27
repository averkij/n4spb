// Run through tools/area.mjs with morskie-vorota, narvsky or avtovo [--summer].
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { SOUTHWEST_SQUARES } from '../src/world/winter-southwest.js';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build as buildDrive } from '../src/world/drive.js';
import { modelParts as bells } from '../src/world/landmarksPortChurch/bell-model.js';
import { modelParts as leaves } from '../src/world/landmarksNarvsky/door-model.js';
import { modelParts as trophies } from '../src/world/landmarksAvtovo-trophy.js';

const areas={
  'morskie-vorota':{sites:['kanonersky-garden','gutuevsky-church'],figure:'kanonersky-light-ship',count:1,
    detail:bells,triangles:1686,root:'landmarksPortChurch',probe:[-5272.8,2632.8,23.58-(1.05+.23)*.65/.60,2],
    craft:'boat-sea-gates',bank:[-7582.79,2957.22,0]},
  narvsky:{sites:['gorky-palace-court','kirov-square'],figure:'stachek-light-engine',count:1,
    detail:leaves,triangles:472,root:'narvsky-gorky',probe:[-4248,3564.9,3.02,14],
    craft:'boat-narvsky',bank:[-5592.323,3479.677,-3.08]},
  avtovo:{sites:['avtovo-vestibule','kirovsky-zavod-forecourt'],figure:'avtovo-crystal-lantern',count:3,
    detail:trophies,triangles:1176,root:'landmarksAvtovoMetro',probe:[-5040.7,7256.9,11.03+1.28*1.13,13],
    craft:'boat-avtovo',bank:[-6769.361,7497.731,0]},
};
const area=process.env.AREA,config=areas[area];
const winter=!process.argv.includes('--summer'),season=winter?'winter':'summer';
// The same physical site is also loaded from the Kolomna side.
function checkStadium(ctx){
  const root=ctx.scene.getObjectByName('karting-narvskaya');
  for(const [name,cold,warm] of [['narvskaya-lawn','#dce4e5','#64794d'],
    ['circuit-graded-verges','#cbd7db','#63784c'],['kirovets-football-field','#d5dfe1','#4f744d']]){
    assert.equal(root.getObjectByName(name).material,ctx.mat.toon(winter?cold:warm),name);
  }
  const stems=root.getObjectByName(winter?'karting-bare-trees':'karting-tree-trunks');
  assert(stems?.count>0);
  const crowns=root.getObjectByName('karting-leafy-crowns');
  assert.equal(crowns?.count||0,winter?0:stems.count*3);
  assert.equal(root.getObjectByName('narvskaya-asphalt').material,ctx.mat.toon('#42464d'));
}
if(area==='kolomna'){
  const {ctx,errors}=await buildWorld({season,modules:['streets','kartingNarvskaya']});
  assert.deepEqual(errors,[]);checkStadium(ctx);console.log(area,season,'PASS shared stadium');process.exit(0);
}
assert(config);
const {ctx,L,THREE,errors}=await buildWorld({season,skip:['drive']});
assert.deepEqual(errors,[]);
document.body.classList={toggle(){},add(){},remove(){},contains:()=>false};
ctx.ui={toast(){},modalOpen:false};ctx.audio={context:null,muted:true,play(){}};
const player=new Player(ctx.camera,{addEventListener(){},requestPointerLock(){}},ctx.physics,L.WORLD.play);
player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;ctx.playerObj=player;
ctx.interact=createInteract({camera:ctx.camera,player,ui:ctx.ui,doc:null});
await buildDrive(ctx);
if(winter)buildWinter(ctx);
let failures=0;
function check(label,fn){
  try{fn();console.log('PASS',label);}catch(e){failures++;console.error('FAIL',label,e.message);}
}
if(area==='narvsky')check('karting and stadium vegetation in season',()=>checkStadium(ctx));
check('historical landmark and its Blender detail',()=>{
  const parts=config.detail();
  assert.equal(parts.reduce((n,[,g])=>n+(g.index?.count??g.attributes.position.count)/3,0),config.triangles);
  for(const [,g]of parts){assert(g.attributes.normal);g.dispose();}
  // Sample a distinctive moulded level inside the owner's final material batches.
  const [x,z,y,radius]=config.probe,owner=ctx.scene.getObjectByName(config.root);
  const v=new THREE.Vector3();let matches=0;
  owner.updateMatrixWorld(true);
  owner.traverse(o=>{
    const pos=o.geometry?.attributes.position;
    for(let i=0;i<(pos?.count||0);i++){
      v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
      if(Math.abs(v.y-y)<.001&&Math.hypot(v.x-x,v.z-z)<radius)matches++;
    }
  });
  assert(matches>=6,'model profile vertices in full scene '+matches);
});
check('mapped fountains in the selected season',()=>{
  const coverage=ctx.services.fountainCoverage;assert(coverage);
  const effects=coverage.records.flatMap(site=>site.effects||[]);
  assert.equal(effects.length,area==='avtovo'?1:0);
  for(const effect of effects)assert.equal(!!ctx.scene.getObjectByName('snow-filled-'+effect.id),winter);
  assert.equal(ctx.services.liveFountains?.records?.length||0,winter?0:effects.length);
});
for(const site of SOUTHWEST_SQUARES.filter(s=>config.sites.includes(s.id))){
  check(site.id+' fir',()=>assert.equal(!!ctx.scene.getObjectByName('holiday-'+site.id),winter));
  for(const [prefix,points]of [['festive-arch',site.arches],['festive-bauble',site.orbs],['festive-market-hut',site.huts||[]]]){
    for(const [x,z]of points)check(site.id+' '+prefix+' '+[x,z],()=>assert.equal(
      ctx.knock.list.some(r=>r.x===x&&r.z===z&&r.parts.some(p=>p.mesh?.name.startsWith(prefix))),winter));
  }
  if(site.snow)check(site.id+' snowman',()=>assert.equal(
    ctx.knock.list.some(r=>r.kind==='snowman'&&r.x===site.snow[0]&&r.z===site.snow[1]),winter));
}
check('local light sculpture, E colour switch and independent knock',()=>{
  const figures=ctx.knock.list.filter(r=>r.kind===config.figure);
  assert.equal(figures.length,winter?config.count:0);
  if(!winter)return;
  for(const [i,f]of figures.entries()){
    const prompt=ctx.interact.list().find(it=>it.id===config.figure+'-'+i);assert(prompt);
    const lamps=f.parts.find(p=>p.mesh.name.startsWith(config.figure+'-garland'));
    player.setPose(f.x+2.55,f.z,0,0,.2,{stand:true});player.inputLock=0;
    const at=prompt.at();ctx.camera.lookAt(at.x,at.y,at.z);
    assert.equal(ctx.interact.update()?.id,prompt.id);
    const before=new THREE.Color(),after=new THREE.Color();
    lamps.mesh.getColorAt(lamps.index,before);assert(ctx.interact.use());
    lamps.mesh.getColorAt(lamps.index,after);assert(!before.equals(after));
  }
  assert.equal(ctx.knock.hit(figures[0].x,figures[0].z,48,1,0,config.figure),figures[0]);
  assert.equal(figures[0].state,'fly');
  assert(figures.slice(1).every(f=>f.state==='stand'&&f.items.length));
});
const drive=ctx.drive;
check('board small craft with E, depart, reverse to launch and dismount',()=>{
  const craft=drive.boats.find(b=>b.id===config.craft);assert(craft);
  const p={...craft.parked},[x,z,y]=config.bank;
  const stand=ctx.physics.groundHeight(x,z,y+.13,false);
  assert(stand>=p.y+.15, 'boarding point must be on a quay or landing above water');
  player.setPose(x,z,0,0,y+.1,{stand:true});player.inputLock=0;
  ctx.camera.lookAt(p.x,p.y+.8,p.z);
  assert.equal(ctx.interact.update()?.labelEn,winter?'Ride snowmobile':'Get in the motor boat');
  assert(ctx.interact.use()&&drive.vehicle===craft);
  const distance=()=>Math.hypot(craft.car.x-p.x,craft.car.z-p.z);
  drive.sim(2.2,{thr:.87});
  assert(distance()>5,'departure distance '+distance());
  for(let i=0;i<180&&distance()>1.4;i++)drive.sim(.10,{brk:1});
  assert(distance()<1.4,'return distance '+distance());
  drive.sim(1.2,{hand:true});assert(drive.exit()&&!drive.active);
});
if(area==='morskie-vorota')check('working cargo ship at its dry stern quay',()=>{
  const ship=drive.boats.find(b=>b.def.vessel==='container-ship'),p={...ship.parked};
  const x=p.x-209*Math.sin(p.yaw),z=p.z-209*Math.cos(p.yaw);
  assert.equal(ctx.physics.waterLevel(x,z),null);
  player.setPose(x,z,0,0,.1,{stand:true});player.inputLock=0;
  const prompt=ctx.interact.list().find(it=>it.id==='drive-boat-'+ship.id+'-stern');
  const at=prompt.at();ctx.camera.lookAt(at.x,at.y,at.z);assert.equal(ctx.interact.update()?.id,prompt.id);
  assert(ctx.interact.use()&&drive.vehicle===ship);drive.sim(20,{thr:.85});
  assert(Math.hypot(ship.car.x-p.x,ship.car.z-p.z)>20);
  drive.sim(14,{hand:true});assert(drive.exit()&&!drive.active);
});
console.log(area,season,failures+' failures');process.exitCode=Number(!!failures);
