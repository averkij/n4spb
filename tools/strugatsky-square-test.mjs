// Real mapped seats, clear carriageways/paths and the memorial's actual home.
// node tools/area.mjs moskovskaya tools/strugatsky-square-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { makeKit } from '../src/world/landmarksMoskovskaya/common.js';
import { square } from '../src/world/landmarksMoskovskaya/square.js';
import { FURNITURE } from '../src/world/data/city.js';

const {ctx,THREE,errors}=await buildWorld({modules:['streets']});
assert.deepEqual(errors,[]);
const svc={triangles:0,parts:{},monuments:[],photoSpots:[]},root=new THREE.Group();
const K=makeKit(ctx,root,svc);square(K);K.flush('strugatsky');ctx.addStatic(root);
assert.equal(svc.strugatskyGardens.length,4,'four distinct mapped gardens');
assert.equal(svc.benches.length,10,'all ten OSM benches around the two southern pads');
for(const bench of svc.benches){
  const mapped=FURNITURE.find(f=>f.id===bench.id);
  assert(mapped&&mapped.x===bench.x&&mapped.z===bench.z,'bench remains at its real mapped node');
  assert(ctx.services.landmarks.benches.includes(bench),'generic props must see and suppress this bench');
  const record=ctx.knock.list.find(r=>r.kind==='bench'&&r.x===bench.x&&r.z===bench.z);
  assert(record&&record.parts.length&&ctx.physics.items.includes(record.item),'visible bench and solid share knock ownership');
}
const net=ctx.services.streets.net;
for(const f of [...svc.strugatskyFixtures,...svc.benches.map(b=>({...b,w:1.9,d:.66}))]){
  const c=Math.cos(f.rotY||0),s=Math.sin(f.rotY||0);
  for(const u of [-f.w/2,0,f.w/2])for(const v of [-f.d/2,0,f.d/2])
    assert(net.cover(f.x+c*u+s*v,f.z-s*u+c*v,{})<-.5,`garden fixture footprint must clear real asphalt: ${JSON.stringify(f)}`);
}
assert(svc.strugatskyPlanting.shrubs>20&&svc.strugatskyPlanting.edging>20,'garden detail is present');
assert(svc.strugatskyPlanting.lawnCells>1000,'mapped gardens must have visible lawn instead of the generic square paving');
assert(svc.strugatskyTrees.length>=20&&svc.strugatskyTrees.length<=48,'restore modest deciduous garden groups');
for(const t of svc.strugatskyTrees)assert(net.cover(t.x,t.z,{})<-3,'tree trunk and crown must clear the carriageway');
const plaque=svc.strugatskyMemorial;
assert.equal(plaque?.building,'w44499732','memorial must be on Boris’s Pobedy 4 home');
assert(plaque.z>8230&&plaque.z<8236&&plaque.x<-2010,'memorial belongs to the Pobedy-side corner face');
assert(ctx.services.labels.list().some(l=>l.bld===plaque.building&&l.kind==='memorial'),'entire plaque reserves its wall rectangle');
const record=ctx.knock.list.find(r=>r.kind==='bench'&&r.x===svc.benches[0].x&&r.z===svc.benches[0].z);
ctx.knock.snap(record,1,0,40);
assert.notEqual(record.state,'stand');assert(!ctx.physics.items.includes(record.item),'a struck bench must leave no invisible collider');
console.log('Strugatsky Square: four gardens, ten mapped breakable seats, shared duplicate suppression, asphalt clearance and Pobedy 4 memorial OK',svc.strugatskyPlanting);
