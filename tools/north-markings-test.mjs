// Markings must stay on the raised deck, follow its actual lane plan and
// retain the unpainted junction box at the embankment.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildLaneGraph } from '../src/world/streets/lanegraph.js';
import { planMarkings,drawPlan } from '../src/world/streets/markings.js';
import { MB } from '../src/world/streets/util.js';
import { northDeckHeight } from '../src/world/northBridges/sites.js';

const {ctx,errors}=await buildWorld({modules:['northBridges','streets']});
assert.deepEqual(errors,[]);
const net=ctx.services.streets.net,plan=planMarkings(net,buildLaneGraph(net),{arrows:true});
const raised=plan.lines.filter(l=>l.pts.some(p=>(northDeckHeight(p.x,p.z)??0)>.1));
assert(raised.some(l=>l.kind==='median-double'),'the raised six-lane roadway needs a double solid divider');
assert(raised.some(l=>l.kind==='lane-dash'),'the raised roadway needs dashed lane separators');
const out=new MB(true);drawPlan({...plan,lines:raised,bars:[]},out);
let n=0;
for(let i=0;i<out.pos.length;i+=3){
  const [x,y,z]=out.pos.slice(i,i+3),h=northDeckHeight(x,z);
  if(h===null)continue;
  assert(Math.abs(y-h-.015)<.002,'paint vertices must follow the drawn slab, including the ramp crest');
  n++;
}
assert(n>100);
const bridgeWays=net.ways.filter(w=>w.bridge&&w.skipDraw&&northDeckHeight(w.x[0],w.z[0])!==null);
assert(bridgeWays.length>0,'test the actual claimed bridge ways');
assert(bridgeWays.some(w=>raised.some(l=>l.way===w.i)),'bridge ownership must not suppress the shared markings plan');
console.log(`PASS ${raised.length} raised line pieces, ${n} deck-height vertices and ${bridgeWays.length} claimed bridge ways`);
