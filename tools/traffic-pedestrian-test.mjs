import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { createSim } from '../src/world/traffic/sim.js';

const {ctx}=await buildWorld({modules:['streets']});
let walker=null;
const sim=createSim(ctx.services.streets,()=>ctx.rng('yield-test'),{
  centre:()=>[320,90],preroll:0,trams:false,walker:()=>walker,
});
sim.reset();
for(let i=0;i<30;i++)sim.step();
const v=sim.vehicles.find(v=>v.v>4 && v.seg.kind==='lane' && v.s+22<v.seg.len && !v.bus);
assert(v,'a moving car on a long lane');
const f=[Math.sin(v.rot),Math.cos(v.rot)];
walker={x:v.x+f[0]*(v.arch.front+.3),z:v.z+f[1]*(v.arch.front+.3),y:0};
const at=v.s;
for(let i=0;i<30;i++) sim.step();
assert.equal(v.s,at,'car holds while the pedestrian is in front');
assert(v.brake);
walker.y=5;
for(let i=0;i<30;i++)sim.step();
assert(v.s>at+.5,'car releases when the pedestrian is on a different level');
console.log('PASS traffic yields and releases');
