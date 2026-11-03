// Real OSM seam regressions: moving axles must not take a sideways dogleg,
// and a stopped car must keep its heading without a renderer-only yaw filter.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { createSim } from '../src/world/traffic/sim.js';

const {ctx,errors}=await buildWorld({modules:['streets']});
assert.deepEqual(errors,[]);
const sim=createSim(ctx.services.streets,()=>ctx.rng('traffic'),{
  centre:()=>[-128,-1869],preroll:0,trams:false,
});
let seams=0;
for(const id of ['CLw380874591:0:f0>Lw240691030:0:f0','CLw774645112:0:f1>Lw629291922:0:f1']){
  const c=sim.connSeg.get(id);if(!c)continue;
  assert(c.len>12,`${id}: lane width changes need longitudinal blending room`);
  const a=c.from,n=a.n,dx=a.xs[n-1]-a.xs[n-2],dz=a.zs[n-1]-a.zs[n-2],l=Math.hypot(dx,dz);
  for(let i=1;i<c.n;i++){
    const x=c.xs[i]-c.xs[i-1],z=c.zs[i]-c.zs[i-1];
    assert((x*dx+z*dz)/(Math.hypot(x,z)*l)>.94,`${id}: car must continue forwards through a way seam`);
  }
  seams++;
}
sim.reset();let stopped=0,moving=0;
for(let i=0;i<900;i++){
  const prev=new Map(sim.vehicles.map(v=>[v.id,{x:v.x,z:v.z,r:v.rot}]));
  sim.step();
  for(const v of sim.vehicles){
    const p=prev.get(v.id);if(!p)continue;
    const d=Math.hypot(v.x-p.x,v.z-p.z),a=Math.abs(Math.atan2(Math.sin(v.rot-p.r),Math.cos(v.rot-p.r)));
    if(d<1e-7){assert(a<1e-7,'a stationary NPC must not turn about its vertical axis');stopped++;}
    else {assert(d<3,'a connector must not teleport the car');moving++;}
  }
}
assert(stopped>100 && moving>100,'exercise stopped queues and moving traffic');
if(process.env.AREA==='palace')assert.equal(seams,2,'both reported embankment seams exist');
console.log(`PASS ${seams} real way seams; ${stopped} stationary and ${moving} moving NPC poses`);
