// CPU regression: physical continuity across OSM way/layer changes, traversable
// bridge approaches, source-area overlap and documented navigation clearances.
import assert from 'node:assert/strict';
import { coastalSites, marineWhsdHeight, deckAtSegments } from '../src/world/coastalBridges/sites.js';
import { whsdY } from '../src/world/bridges/sites-vo2.js';
import { clipHeightBand } from './lib/vertical-band.mjs';

const road=(id,pts,extra={})=>({id,pts,hw:'service',w:4,bridge:1,layer:1,...extra});
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-7,`${msg}: ${a} vs ${b}`);
// A sloping wall's waterline footprint excludes its head 120 m above the boat.
const leaning = clipHeightBand([[0,-5,0],[14,120,0],[4,-5,0]], -3.35, -2.9);
assert(leaning.length >= 3 && leaning.every(p => p[1] >= -3.35 && p[1] <= -2.9));
assert(Math.max(...leaning.map(p => p[0])) < 4.3, 'high leaning head is not a waterline footing');
assert.deepEqual(clipHeightBand([[0,10,0],[1,10,0],[0,11,1]], -3.35, -2.9), [], 'an overhead triangle has no hull-height footprint');
const double=[10,18].map(y=>({x:0,z:0,yaw:0,w:14,len:100,ya:y,yb:y}));
near(deckAtSegments(double,0,0,10),10.025,'lower-deck car stays on lower deck');
near(deckAtSegments(double,0,0,18),18.025,'upper-deck car stays on upper deck');
near(deckAtSegments(double,0,0),18.025,'placement chooses upper surface');
assert.equal(deckAtSegments(double,0,0,-6),null,'car on bed is not lifted onto bridge');
const fixtures=coastalSites([
  road('a',[0,0,0,60]),road('b',[0,60,0,120],{layer:2}),
  road('in',[-20,0,0,0],{bridge:0}),road('out',[0,120,20,120],{bridge:0}),
]);
const[a,b]=fixtures;
near(a.heights[0],.04,'ordinary-road entrance');near(b.heights.at(-1),.04,'ordinary-road exit');
near(a.heights.at(-1),b.heights[0],'OSM layer changes do not create a step');
assert(a.heights.at(-1)>3,'real ramp rises between approaches');
for(const br of fixtures)for(let i=1;i<br.heights.length;i++){
  const d=Math.hypot(br.pts[2*i]-br.pts[2*i-2],br.pts[2*i+1]-br.pts[2*i-1]);
  assert(Math.abs(br.heights[i]-br.heights[i-1])<=.060001*d,'ordinary-road approach grade');
}

let shared=0,segments=0;
for(const id of['morskie-vorota','okrug65']){
  const data=await import(`../src/areas/${id}/data/city.js`),sites=coastalSites(data.ROADS),nodes=new Map();
  for(const br of sites){
    assert(br.heights.every(Number.isFinite),`${id}/${br.id} finite elevations`);
    for(let i=0;i<br.heights.length;i++){
      // Reconstruct physical connections from coordinates and lane direction,
      // independent of the builder's graph's node key or OSM layer value.
      const dir=br.whsd?(Math.sign((br.road.pts.at(-1)-br.road.pts[1])*(br.road.oneway===-1?-1:1))<0?'N':'S'):'road';
      const key=dir+':'+br.pts[2*i].toFixed(1)+','+br.pts[2*i+1].toFixed(1);
      if(nodes.has(key)){near(nodes.get(key),br.heights[i],`${id} continuous physical joint ${key}`);shared++;}
      else nodes.set(key,br.heights[i]);
      if(i)segments++;
      if(i){const len=Math.hypot(br.pts[2*i]-br.pts[2*i-2],br.pts[2*i+1]-br.pts[2*i-1]);assert(Math.abs(br.heights[i]-br.heights[i-1])/len<=.090001,`${id}/${br.road.id} continuous traversable grade`);}
    }
    const slabs=[];
    for(let i=0;i+3<br.pts.length;i+=2){const ax=br.pts[i],az=br.pts[i+1],bx=br.pts[i+2],bz=br.pts[i+3];slabs.push({x:(ax+bx)/2,z:(az+bz)/2,yaw:Math.atan2(bx-ax,bz-az),len:Math.hypot(bx-ax,bz-az),w:br.w,ya:br.heights[i/2],yb:br.heights[i/2+1]});}
    // Probe the original mapped road independently of its denser authored
    // slabs. Rounded centimetre poses include every original endpoint.
    for(let i=0;i+3<br.road.pts.length;i+=2){
      const p=br.road.pts,dx=p[i+2]-p[i],dz=p[i+3]-p[i+1],n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/2));
      for(let j=0;j<=n;j++){const x=Math.round((p[i]+dx*j/n)*100)/100,z=Math.round((p[i+1]+dz*j/n)*100)/100;assert(Number.isFinite(deckAtSegments(slabs,x,z)),`${id}/${br.road.id} driving floor at original road pose ${x},${z}`);}
    }
  }
  if(id==='morskie-vorota'){
    const byId=new Map(sites.map(s=>[s.road.id,s]));
    near(byId.get('w589047640').heights.at(-1),byId.get('w589047641').heights[0],'Korabelny-to-Kanonersky split');
    near(byId.get('w172999959').heights.at(-1),byId.get('w589047642').heights[0],'Sea Canal layer3-to-layer2 upper carriageway');
    const lower=sites.find(s=>s.road.id==='w589047641');
    for(let i=0;i<lower.heights.length;i++)if(lower.pts[2*i+1]>=3400&&lower.pts[2*i+1]<=3700){
      assert(lower.heights[i]-lower.depth+3.4>=52-1e-6,'Sea Canal52m unobstructed soffit');
    }
  }
  console.log(id,sites.length,'mapped bridges; physical joints continuous');
}
for(const z of[1080,1126,1275,1594,1745,1900,2200,2400,2600]){
  near(marineWhsdHeight(z),whsdY(z),'Gavan source overlap');
  near(marineWhsdHeight(z,true),whsdY(z),'Gavan opposing carriageway overlap');
}
near(marineWhsdHeight(3500)-2.6+3.4,52,'official Sea Canal clearance');
near(marineWhsdHeight(3500,true)-marineWhsdHeight(3500),8,'distinct lower/upper decks');
assert(marineWhsdHeight(2600+.001)-marineWhsdHeight(2600)<.001,'continuous coastal profile');
console.log(`PASS: ${shared} shared nodes, ${segments} physical deck segments; source overlap, ramps and navigation clearance`);

// Optional real handling regression (CPU only):
// node tools/area.mjs morskie-vorota tools/marine-data-bridges-test.mjs --engine
if(process.argv.includes('--engine')){
  const A=await import('../src/world/area.js');
  assert.equal(A.ID,'morskie-vorota','--engine must run with the marine area loader');
  const SE=await import('./tauride/lib/stub-env.mjs'),eng=await SE.loadEngine();
  const names=A.MODULES.filter(n=>!['traffic','people','wildlife','drive'].includes(n));
  const{ctx}=SE.makeContext(eng,names);
  await SE.buildModules(eng,ctx,names);
  const svc=ctx.services.coastalBridges,ss=svc.segments;
  let pose;
  for(const s of ss){
    if(s.z<3400||s.z>3700||s.ya<45)continue;
    for(const off of[-3,0,3]){
      const x=s.x+Math.cos(s.yaw)*off,z=s.z-Math.sin(s.yaw)*off;
      if(eng.L.heightAt(x,z)>-.2)continue;
      const floors=[...new Set(ss.map(q=>deckAtSegments([q],x,z)).filter(Number.isFinite).map(y=>Math.round(y*10000)/10000))].sort((a,b)=>a-b);
      if(floors.length===2&&floors[1]-floors[0]>7){pose={x,z,yaw:s.yaw,lower:floors[0],upper:floors[1]};break;}
    }
    if(pose)break;
  }
  assert(pose,'real mapped WHSD double-deck overlap over water');
  const{createHandling}=await import('../src/world/drive/handling.js');
  const input={thr:0,brk:0,steer:0,hand:true,nitro:false,jump:false,flip:false};
  for(const[label,floor]of[['lower',pose.lower],['upper',pose.upper],['bed',eng.L.heightAt(pose.x,pose.z)]]){
    const car=createHandling(ctx);
    car.reset(pose.x,pose.z,pose.yaw);car.y=floor+.03;
    assert(Math.abs(car.groundAt(pose.x,pose.z,car.y)-(floor+.03))<.001,`${label}: actual createHandling resolves its physical floor`);
    for(let tick=0;tick<180;tick++)car.step(1/60,input);
    assert(Math.abs(car.y-(floor+.03))<.08,`${label}: car stays on its floor after3s idle (y${car.y}, expected${floor+.03})`);
    assert(!car.air&&!car.fall,`${label}: stable grounded state`);
    console.log(`engine ${label}: y${car.y.toFixed(3)}, floor${floor.toFixed(3)} after3s idle`);
  }
  console.log('PASS real marine createHandling double-deck/bed:',JSON.stringify(pose));
}
