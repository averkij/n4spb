// Independent OSM-vs-scene check of the Kolomna park ponds, their islands,
// rendered water cuts, and open-bank walking. Run via the area remap:
// node tools/area.mjs kolomna tools/south-pond-independent-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { WATER } from '../src/world/data/city.js';
import { waterCuts } from '../src/world/environment/river.js';

const { ctx, L, THREE, errors } = await buildWorld({ log: null });
assert.equal(errors.length, 0, errors.slice(0, 3).join('\n'));
const ph = ctx.physics, ids = ['w97038685','w97038687','w229047990','r3077578','r2306262','r18515609'];
const pointIn = (x, z, a) => { let hit = false; for (let i = 0, j = a.length - 2; i < a.length; j = i, i += 2) if ((a[i+1] > z) !== (a[j+1] > z) && x < (a[j] - a[i]) * (z - a[i+1]) / (a[j+1] - a[i+1]) + a[i]) hit = !hit; return hit; };
const bounds = (a) => { let x0=Infinity,z0=Infinity,x1=-Infinity,z1=-Infinity; for(let i=0;i<a.length;i+=2){x0=Math.min(x0,a[i]);x1=Math.max(x1,a[i]);z0=Math.min(z0,a[i+1]);z1=Math.max(z1,a[i+1]);}return {x0,x1,z0,z1}; };
const records = ids.map(id => { const w = WATER.find(r => r.id === id); assert.ok(w, `OSM water missing: ${id}`); return w; });
const wetByOsm = (x,z) => records.some(r => r.polys.some(p => pointIn(x,z,p.o) && !(p.h || []).some(h => pointIn(x,z,h))));
const cuts = waterCuts().filter(c => c.kind !== 'slope');
const rendered = (x,z) => cuts.some(c => x >= c.box[0] && x <= c.box[1] && z >= c.box[2] && z <= c.box[3] && pointIn(x,z,c.poly.flat()));
let waterN=0, missingLevel=0, missingMesh=0, dryIslandN=0, floodedIsland=0, waterBlocked=0;
const examples=[];
for(const rec of records) for(const poly of rec.polys){
  const b=bounds(poly.o);
  for(let x=Math.ceil(b.x0/5)*5;x<=b.x1;x+=5) for(let z=Math.ceil(b.z0/5)*5;z<=b.z1;z+=5){
    if(!L.inPlay(x,z)||!pointIn(x,z,poly.o))continue;
    const inHole=(poly.h||[]).some(h=>pointIn(x,z,h));
    if(inHole && !wetByOsm(x,z)) {dryIslandN++; if(ph.waterLevel(x,z)!==null||rendered(x,z)){floodedIsland++;if(examples.length<8)examples.push(['flooded island',rec.id,x,z]);} continue;}
    if(inHole)continue;
    waterN++; const level=ph.waterLevel(x,z);
    if(level===null){missingLevel++;if(examples.length<8)examples.push(['dry water',rec.id,x,z]);continue;}
    if(!rendered(x,z)){missingMesh++;if(examples.length<8)examples.push(['no water mesh',rec.id,x,z]);}
    if(!L.insideBuilding(x,z)) {const p={x,z};ph.resolve(p,0.35,L.heightAt(x,z),1.7);if(Math.hypot(p.x-x,p.z-z)>0.05){waterBlocked++;if(examples.length<8)examples.push(['solid',rec.id,x,z,[...ph.querySolids(x,z,1)].map(o=>({type:o.type,x:o.cx,z:o.cz,y0:o.y0,y1:o.y1})).slice(0,4)]);}}
  }
}
console.log(JSON.stringify({waterN,missingLevel,missingMesh,dryIslandN,floodedIsland,waterBlocked,examples}));
assert.ok(waterN>200 && dryIslandN>10, 'sample the ponds and both islands');
assert.equal(missingLevel,0,`mapped pond cells must be wet: ${JSON.stringify(examples)}`);
assert.equal(missingMesh,0,`mapped pond cells must have rendered water: ${JSON.stringify(examples)}`);
assert.equal(floodedIsland,0,`islands must be dry and uncovered by water: ${JSON.stringify(examples)}`);
// The inlet w229047990 meets the Yekateringofka: it must share the river
// datum and have no false wall through the join.
for (let x = -5290; x <= -5270; x++) {
  assert.equal(ph.waterLevel(x, 3082), -3.4, `connected inlet level at ${x},3082`);
  const p = { x, z: 3082 }; ph.resolve(p, 0.35, L.heightAt(x, 3082), 1.7);
  assert.ok(Math.hypot(p.x-x,p.z-3082)<0.05, `no barrier across inlet at ${x},3082`);
}

const { Player } = await import('../src/core/player.js');
let tested=0, reached=0, attempts=[];
for(const s of ctx.services.environment.quay.segments.filter(s=>s.key==='moat'&&s.slope)){
  if(tested>=35)break;
  const len=Math.hypot(s.bx-s.ax,s.bz-s.az);if(len<4)continue;
  const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2,sx=mx+s.nx*(s.slope+1.5),sz=mz+s.nz*(s.slope+1.5);
  if(!L.inPlay(sx,sz,3)||L.insideBuilding(sx,sz,1)||ph.waterLevel(sx,sz)!==null||ph.columnBlocked(sx,sz,0.4,0.3,1.7))continue;
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ph,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;
  p.setPose(sx,sz,Math.atan2(s.nx,s.nz)*180/Math.PI,0);p.keys.add('KeyW');
  let wet=false;for(let t=0;t<9;t+=1/60){p.time+=1/60;p.update(1/60);if(ph.waterLevel(p.pos.x,p.pos.z)!==null){wet=true;break;}}
  tested++;if(wet)reached++;else if(attempts.length<8)attempts.push([+mx.toFixed(1),+mz.toFixed(1),+p.pos.x.toFixed(1),+p.pos.z.toFixed(1)]);
}
console.log({tested,reached,attempts});
assert.ok(tested>0 && reached>0,'at least one natural pond bank permits actual walking into water');
console.log('PASS independent mapped pond, island, visible-water and open-bank checks');
