// Markings must stay on the raised deck, follow its actual lane plan and
// retain the unpainted junction box at the embankment.
// --mutant-underpass-undraw removes generated underpass paint; a mapped
// input expectation must still fail (proved on Finlyandsky).
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildLaneGraph } from '../src/world/streets/lanegraph.js';
import { planMarkings,drawPlan,edgesOf,RULES } from '../src/world/streets/markings.js';
import { MB } from '../src/world/streets/util.js';
import { northDeckHeight } from '../src/world/northBridges/sites.js';
import { buildCrossings } from '../src/world/streets/surface.js';
import { wayAt,nearCrossing } from '../src/world/streets/net.js';
import { latAt } from '../src/world/streets/lanes.js';

const {ctx,errors}=await buildWorld({modules:['northBridges','streets']});
assert.deepEqual(errors,[]);
const net=ctx.services.streets.net,plan=planMarkings(net,buildLaneGraph(net),{arrows:true});
if(process.argv.includes('--details'))console.log(JSON.stringify(net.ways.filter(w=>w.name==='Литейный мост'||w.name==='улица Академика Лебедева'&&w.z.some(z=>z>-2440)).map(w=>({id:w.id,bridge:w.bridge,oneway:w.oneway,width:w.w,len:w.L,nF:w.lanes.nF,nB:w.lanes.nB,median:w.med?.filter(Boolean).length,linePieces:plan.lines.filter(l=>l.way===w.i).length}))));
const raised=plan.lines.filter(l=>l.pts.some(p=>(northDeckHeight(p.x,p.z,p.nz,-p.nx)??0)>.1));
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
// The embankment passes below the approach. Its stripes and zebras must stay
// flat even where their plan coordinates lie inside the bridge deck.
const transverseAt=(x,z,tx,tz)=>northDeckHeight(x,z)!==null&&northDeckHeight(x,z,tx,tz)===null;
const beneathWays=new Set(),beneathPoints=new Map(),transversePoints=[];
for(const w of net.ways.filter(w=>w.name?.includes('набережная')))for(let i=0;i+1<w.x.length;i++){
  const dx=w.x[i+1]-w.x[i],dz=w.z[i+1]-w.z[i],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/2));if(!len)continue;
  for(let j=0;j<=n;j++)if(transverseAt(w.x[i]+dx*j/n,w.z[i]+dz*j/n,dx/len,dz/len)){
    const p={x:w.x[i]+dx*j/n,z:w.z[i]+dz*j/n,tx:dx/len,tz:dz/len,way:w.i};transversePoints.push(p);
  }
}
// A road centre under the bridge does not imply a stripe there: a one-lane
// carriageway's median can be outside the footprint, a dash can fall in a gap,
// or a short junction link can correctly lose its lone stub. Establish an
// actual native lane-separator expectation from the mapped lane boundaries
// and ranges BEFORE looking at the generated paint. Three visible dashes
// survive the ordinary stub rule; deleting native underpass paint then fails.
const transverseWays=new Set(transversePoints.map(p=>p.way)),bridgeSkips=new Set(net.ways.filter(q=>q.bridge));
for(const id of transverseWays){
  const w=net.ways[id],b=w.bnd[0];if(b.lw<RULES.laneMin)continue;
  for(const e of edgesOf(w))for(let j=1;j<b.b.length-1;j++){
    if(w.lanes.nB>0&&j===b.mid)continue;
    const r=b.dir[j]>0?e.f:e.b;if(!r)continue;
    const anchor=Math.min(e.f?.lo??1e9,e.b?.lo??1e9),visible=[];
    for(let at=anchor+1.5+RULES.period*Math.ceil((r.lo-anchor-1.5)/RULES.period-1e-9);at+RULES.dash<=r.hi+1e-6;at+=RULES.period){
      const pts=[0,.5,1].map(t=>{const q=wayAt(w,at+RULES.dash*t),lat=latAt(w,q,j);return{x:q.x-q.tz*lat,z:q.z+q.tx*lat,tx:q.tx,tz:q.tz};});
      const clear=pts.every(p=>{
        const crossing=nearCrossing(net,p.x,p.z,RULES.zebraClear),own=northDeckHeight(p.x,p.z,p.tx,p.tz)??.03;
        if(crossing&&Math.abs((northDeckHeight(p.x,p.z,crossing.tx,crossing.tz)??.03)-own)<.25)return false;
        return net.cover(p.x,p.z,{skip:w,skipSet:bridgeSkips})<=.2;
      });
      if(clear)visible.push(pts);
    }
    if(visible.length>=3)for(const pts of visible){const p=pts.find(p=>transverseAt(p.x,p.z,p.tx,p.tz));if(p){beneathWays.add(w.i);beneathPoints.set(w.i,[p.x,p.z]);break;}}
  }
}
if(transversePoints.length){
  const p=transversePoints[Math.floor(transversePoints.length/2)],flat=new MB(true);
  drawPlan({lines:[{kind:'lane-dash',width:.14,pts:[-1,0,1].map(d=>({x:p.x+p.tx*d,z:p.z+p.tz*d,nx:-p.tz,nz:p.tx}))}],bars:[]},flat);
  assert(flat.pos.length>0);
  for(let i=1;i<flat.pos.length;i+=3)assert(Math.abs(flat.pos[i]-.045)<.002,'transverse drawing fixture was lifted onto bridge');
  console.log('PASS drawing a stripe on an actual mapped transverse road stays flat, including junction-only underpasses');
}
// Decide whether this subcase exists from the mapped input, never from the
// generated paint. A missing-paint mutant on a real underpass still fails.
// Paired one-way halves share their divider, so the other half can own native
// paint serving the same mapped underpass. Grade the underpass as a whole.
if(process.argv.includes('--mutant-underpass-undraw'))plan.lines=plan.lines.filter(l=>!(transverseWays.has(l.way)&&l.pts.some(p=>northDeckHeight(p.x,p.z)!==null)));
const beneath=plan.lines.filter(l=>transverseWays.has(l.way)&&l.pts.some(p=>northDeckHeight(p.x,p.z)!==null));
if(process.argv.includes('--details'))console.log('underpass input',JSON.stringify([...beneathWays].map(i=>{const w=net.ways[i],p=beneathPoints.get(i);return{id:w.id,name:w.name,point:p,rank:w.rank,width:w.w,nF:w.lanes.nF,nB:w.lanes.nB,paint:plan.lines.filter(l=>l.way===i).length,rules:plan.rules.filter(r=>r.way===i),cover:net.cover(...p,{skip:w}),coverWithoutBridge:net.cover(...p,{skip:w,skipSet:new Set(net.ways.filter(q=>q.bridge))})};})));
if(beneathWays.size){
  assert(beneath.length>0,'mapped transverse embankment underpass needs actual paint');
  const flat=new MB(true);drawPlan({...plan,lines:beneath,bars:[]},flat);
  for(let i=1;i<flat.pos.length;i+=3)assert(Math.abs(flat.pos[i]-.045)<.002,'underpass line was lifted onto bridge');
  console.log(`PASS ${beneath.length} actual underpass line pieces stay on their own road level`);
}else console.log('NOTE no eligible longitudinal paint stretch below the deck outside mapped junction mouths');
const crossings=net.crossings.filter(c=>c.road.name?.includes('набережная')&&transversePoints.some(p=>p.way===c.road.i&&Math.hypot(c.x-p.x,c.z-p.z)<80));
if(crossings.length){
  const cross=new MB(true);buildCrossings({...net,crossings},cross);
  assert(cross.pos.length>0,'mapped underpass crossing needs actual zebra paint');
  for(let i=1;i<cross.pos.length;i+=3)assert(Math.abs(cross.pos[i]-.045)<.002,'underpass zebra was stretched vertically');
  console.log(`PASS ${crossings.length} mapped underpass crossings / ${cross.idx.length/3} zebra triangles stay on their own road level`);
}else console.log('NOTE no mapped transverse underpass zebra in this area data');
