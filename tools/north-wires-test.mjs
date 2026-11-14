// Exercise actual emitted overhead geometry, not just the elevation helper.
// Run through tools/area.mjs for palace, finlyandsky and smolny.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { northDeckHeight, northWireLift } from '../src/world/northBridges/sites.js';
const {ctx,L}=await buildWorld({modules:[]});
ctx.buildList=['northBridges','streets'];
const parts=[],original=ctx.wires.add.bind(ctx.wires);
ctx.wires.add=(pts,o={})=>{parts.push({pts,kind:o.kind});return original(pts,o);};
await (await import('../src/world/northBridges.js')).build(ctx);
await (await import('../src/world/streets.js')).build(ctx);
let checked=0,min=Infinity;
for(const p of parts) for(let i=1;i<p.pts.length;i++) {
  const a=p.pts[i-1],b=p.pts[i];
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])));
  for(let k=0;k<=n;k++) {
    const t=k/n,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;
    const h=northDeckHeight(x,z);if(h===null||h<.5)continue;
    const clearance=a[1]+(b[1]-a[1])*t-h;
    assert(clearance>=4.9,`${p.kind} has only ${clearance.toFixed(2)} m clearance at ${x},${z}`);
    min=Math.min(min,clearance);checked++;
  }
}
assert(checked>20,'must exercise overheads above an actual raised deck');
// Every emitted cross-span must still end on its published mast or rosette.
const W=ctx.services.streets.wires;
for(const a of W.anchors)if(northWireLift(a.x,a.z)>.1){
  const b=L.buildingAt(a.x-a.nx*.5,a.z-a.nz*.5);
  assert(b&&L.heightOf(b)>a.y,'lifted rosette must remain on its facade');
}
const anchors=[...W.anchors.map(a=>[a.x,a.y,a.z]),...W.masts.map(m=>[m.x,m.y+m.h,m.z])];
for(const p of parts.filter(p=>p.kind==='span'))for(const q of [p.pts[0],p.pts.at(-1)])
  assert(anchors.some(a=>Math.hypot(a[0]-q[0],a[1]-q[1],a[2]-q[2])<.3),'span lost its physical support');
console.log(`PASS ${checked} raised wire samples; minimum clearance ${min.toFixed(2)} m; span anchors connected`);
