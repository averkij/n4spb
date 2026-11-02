// Actual landmark builders + real Physics/knock, no GPU. Run through area.mjs.
// Also emits review-camera coordinates derived from the built water envelopes.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { FOUNTAINS } from '../src/world/data/city.js';

const cases = {
  palace: { modules: ['landmarksF','landmarksGarden'], count: 10 },
  admiralty: { modules: ['landmarksH','landmarksNikolsky'], count: 3 },
  vasilyevsky: { modules: ['landmarksAndrew','landmarksMenshikov','landmarksVOStatues'], count: 6 },
  dekabristov: { modules: ['landmarksDekabristov'], count: 1 },
  okrug65: { modules: ['landmarksOkrug65'], count: 1 },
  moskovskaya: { modules: ['landmarksMoskovskayaPark'], count: 1 },
  kronverk: { modules: ['landmarksPetrovskyYacht','landmarksKronverk'], count: 2 },
  aptekarsky: { modules: ['landmarksTroitskaya','landmarksKarpovka'], count: 2 },
  smolny: { modules: ['landmarksTauride'], count: 3 },
};
const area = process.env.AREA || 'palace', test = cases[area];
assert.ok(test, 'choose one authored-fountain test area');
const { ctx, errors, THREE, L } = await buildWorld({ modules: test.modules });
assert.deepEqual(errors, [], 'landmark builders must finish without caught errors');
const fountains = ctx.services.liveFountains?.records || [];
assert.equal(fountains.length, test.count, 'every authored fountain registers exactly once');
assert.equal(new Set(fountains.map(f => f.id)).size, test.count);
const sites = [];
for (const f of fountains) {
  const mapped = FOUNTAINS.find(s => s.id === f.id);
  if (mapped && f.id !== 'r5255799') assert.ok(Math.hypot(f.x-mapped.x,f.z-mapped.z) < 4, f.id + ' water must use its actual world frame');
  // The lighthouse is on the long basin's dry island: its frame origin is
  // deliberately offset from the mapped water centroid. Check all landings.
  if (f.id === 'r5255799') assert.ok(f.nozzles.every(j => ctx.physics.waterLevel(f.x+j.tx,f.z+j.tz) !== null), 'lighthouse jets land inside the mapped basin');
  assert.ok(f.nozzles.length, f.id + ' has flowing water');
  ctx.camera.position.set(f.x, 3, f.z);
  for (const fn of ctx._updates) fn(1/60,2);
  assert.equal(f.stats.active,true,f.id + ' water activates nearby');
  const before=f.meshes[1].instanceMatrix.array.slice();
  for (const fn of ctx._updates) fn(1/60,2.7);
  assert.notDeepEqual(f.meshes[1].instanceMatrix.array,before,f.id + ' droplets move');
  if(['n2306201359','steregushchy-seacock'].includes(f.id)){
    const j=f.nozzles[0],x=f.x+j.tx,z=f.z+j.tz,waterY=f.group.position.y+j.ty;
    assert.equal(ctx.physics.waterLevel(x,z),waterY,f.id+' nozzle lands in native water');
    const floor=ctx.physics.groundHeight(x,z,waterY+.1,false);
    assert.ok(!ctx.physics.columnBlocked(x,z,.15,floor+.01,floor+1.7),f.id+' receiving water remains open');
    if(f.id==='n2306201359'){
      const a=(Math.PI/2-16.8*Math.PI/180),dx=Math.sin(a),dz=Math.cos(a);
      const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ctx.physics,L.WORLD.play);
      p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;
      p.setPose(x+dx*1.3,z+dz*1.3,Math.atan2(dx,dz)*180/Math.PI,0);
      p.pos.y=ctx.physics.groundHeight(p.pos.x,p.pos.z,1,false);p.keys.add('KeyW');
      let entered=false;
      for(let i=0;i<90;i++){p.time+=1/60;p.update(1/60);if(ctx.physics.waterLevel(p.pos.x,p.pos.z)!==null){entered=true;break;}}
      p.keys.clear();assert.ok(entered,'real Player enters the 1809 fountain trough from the front');
    }
  }
  if(['w74168797','n950150577','w1501496505','w1501496506'].includes(f.id)){
    assert.equal(f.meshes[0].count,0,f.id+' retains its original stream geometry without duplicate tubes');
    assert.ok(f.meshes[2].count>0,f.id+' adds expanding impact ripples');
  }
  const b=f.bounds,dx=b.max.x-b.min.x,dz=b.max.z-b.min.z,reach=Math.max(7,Math.max(dx,dz)*.8);
  const camera=[f.x+reach,Math.max(2.2,Math.min(9,(b.max.y-b.min.y)*.45)),f.z+reach*.6,
    Math.atan2(reach,reach*.6)*180/Math.PI,Math.min(12,Math.max(2,(b.max.y-3)*.7))];
  sites.push({area,modules:test.modules,id:f.id,x:f.x,z:f.z,nozzles:f.nozzles.length,camera});
}
let basins=0;
for(const basin of ctx.services.fountainBasins||[]){
  const {x,z,r,waterY,bedY,rim}=basin;
  assert.equal(ctx.physics.waterLevel(x+r*.7,z),waterY,basin.id+' registers real shallow water');
  let open=0;
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12,px=x+Math.sin(a)*r*.72,pz=z+Math.cos(a)*r*.72;
    const floor=ctx.physics.groundHeight(px,pz,waterY+.1,false);
    if(floor<=waterY+.01&&!ctx.physics.columnBlocked(px,pz,.15,Math.max(floor,bedY)+.01,Math.max(floor,bedY)+1.7))open++;
  }
  assert.ok(open>=6,basin.id+' basin interior has open walking/driving space');
  assert.ok(rim.items.every(it=>it.source?.knock),basin.id+' every perimeter bay can break');
  basins++;
}
if(area==='smolny'){
  for(const id of ['w1501496505','w1501496506']){
    const f=FOUNTAINS.find(f=>f.id===id);assert.ok(ctx.physics.waterLevel(f.x,f.z)!==null,id+' has native water');
  }
}
// The older animated fountains retain their motion and also brighten after dusk.
const nightMeshes=[];ctx.scene.traverse(m=>{if(['lmH-jet','tauride-fountain-spray'].includes(m.material?.name))nightMeshes.push(m);});
for(const fn of ctx._updates)fn(1/60,3);
const day=nightMeshes.map(m=>m.material.emissiveIntensity);
ctx.shared.uNight.value=1;ctx.shared.uSunDir.value.y=-.3;
for(const fn of ctx._updates)fn(1/60,4);
nightMeshes.forEach((m,i)=>assert.ok(m.material.emissiveIntensity>day[i],'existing live fountain brightens at night'));
await mkdir('shots/fountain-refresh',{recursive:true});
await writeFile(`shots/fountain-refresh/sites-${area}.json`,JSON.stringify(sites,null,2)+'\n');
console.log(`PASS ${area}: ${fountains.length} authored live fountains, ${basins} repaired accessible basins`);
