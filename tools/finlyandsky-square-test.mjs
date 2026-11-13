// Real basin/physics/effect regression for the former point-only Singing
// Fountains pool. No GPU and no expensive whole-area environment build.
// node tools/area.mjs finlyandsky tools/finlyandsky-square-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
assert.equal(process.env.AREA,'finlyandsky');
const {ctx,THREE,errors}=await buildWorld({modules:['landmarksFinlyandskyStation']});
const {FOUNTAINS}=await import('../src/areas/finlyandsky/data/city.js');
const {placeFountains}=await import('../src/world/props/fountains.js');
const state={ctx,root:new THREE.Group(),stats:{},svc:{},tris:0,levelAt:()=>0};
placeFountains(state);ctx.addStatic(state.root);
assert.equal(errors.length,0,errors.join('\n'));
assert.equal(FOUNTAINS.length,31,'The basin/node reconciliation must not duplicate fountains');
const record=state.svc.fountains.find(f=>f.id==='n11073120673');
assert.equal(record.status,'animated');assert.equal(record.effects.length,1,'One effect owns the complete central pool');
const e=record.effects[0],zs=e.points.map(p=>p[1]);
assert(e.jets>=10,'Central pool must have distributed live nozzles');
assert(Math.max(...zs)-Math.min(...zs)>30,'Jets must span the long pool, not a 1.4m nozzle disk');
for(const p of e.points){
  assert.equal(ctx.physics.waterLevel(...p),e.y,'Drawn effect and physical water disagree');
  const floor=ctx.physics.groundHeight(...p,e.y,false);
  assert(Number.isFinite(floor)&&floor<e.y,'Every nozzle must be above a reachable shallow basin floor');
  assert(floor<.10,'The square paving must not cover the pool');
}
console.log(`PASS central pool: ${e.jets} live jets across ${(Math.max(...zs)-Math.min(...zs)).toFixed(1)}m; one effect, drawn/physical water and reachable floor agree`);
console.log('RESULT: OK');
