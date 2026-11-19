import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Physics } from '../src/core/physics.js';
import { createKartRoughness } from '../src/world/karting/surfaces.js';
import { createKart } from '../src/world/karting/karts.js';
import { createHandling } from '../src/world/drive/handling.js';

const { ctx } = await buildWorld({ modules: ['environment','streets'] });
const roughness = createKartRoughness(ctx);
let samples=0, masked=0;
for(const w of ctx.services.streets.net.ways) {
  if(w.skipDraw || w.pedestrianOnly || w.rank<1)continue;
  for(let i=0;i<w.x.length-1;i+=3) {
    const x=(w.x[i]+w.x[i+1])/2,z=(w.z[i]+w.z[i+1])/2;
    if(ctx.services.environment.kindAt(x,z)!=='asphalt')masked++;
    assert.equal(roughness(x,z),0,`${w.name||w.id}: road asphalt inherits ground paint at ${x},${z}`);
    samples++;
  }
}
assert.ok(samples>100,'test needs real street coverage');

const road={},ped={pedestrianOnly:true},bed={tramBed:true};
const patch=(x,ways)=>({box:[x,x+4,0,4],poly:[[x,0],[x+4,0],[x+4,4],[x,4]],ways});
const net={ways:[road,ped,bed],fillets:[patch(20,[road,road]),patch(30,[ped,ped]),patch(40,[bed,bed])],
  cover(x,z,opts){return Math.abs(x)<=2?2-Math.abs(x):-100;}};
const services={streets:{net},environment:{kindAt:()=> 'grass'}};
const flat={services,physics:new Physics(()=>0),L:{WORLD:{play:{}},inPlay:()=>true,heightAt:()=>0,insideBuilding:()=>false}};
const sample=createKartRoughness(flat);
assert.equal(sample(0,0),0);assert.equal(sample(2.01,0),1,'do not extend asphalt over the verge');
assert.equal(sample(22,2),0,'visible asphalt junction fillet stays smooth');
assert.equal(sample(24.01,2),1);assert.equal(sample(32,2),1,'pedestrian fillet is not road asphalt');
assert.equal(sample(42,2),1,'tram bed fillet is not road asphalt');
function coast(x) {
  const kart=createHandling(flat,createKart(flat,'narvskaya-club-1',{}).tuning);
  kart.reset(x,0,0);kart.vz=20;
  for(let i=0;i<60;i++)kart.step(1/60,{thr:0,brk:0,steer:0});
  return kart.speed;
}
const asphalt=coast(0),edge=coast(2),grass=coast(3);
assert.ok(asphalt>69 && asphalt<70,`road still has off-asphalt drag: ${asphalt}`);
assert.ok(edge>56 && edge<59 && grass>47 && grass<50,'each tyre must still lose speed when it leaves the asphalt');
console.log(`PASS ${process.env.AREA||'palace'}: ${samples} real road samples smooth, ${masked} previously masked by non-asphalt ground`);
console.log(`Coast 72 km/h for 1s: road ${asphalt.toFixed(1)}, two tyres off ${edge.toFixed(1)}, grass ${grass.toFixed(1)} km/h`);
