// CPU regression: physical continuity across OSM way/layer changes, traversable
// bridge approaches, source-area overlap and documented navigation clearances.
import assert from 'node:assert/strict';
import { coastalSites, marineWhsdHeight, deckAtSegments, YACHTNY_GROUP } from '../src/world/coastalBridges/sites.js';
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
  assert(!sites.some(s => YACHTNY_GROUP.osm.includes(s.road.id)), 'shared Yacht Bridge has no second generic coastal deck');
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

// Both pages must load the same authored Yacht curve, physical ramps and car
// floor. Run once under each area loader after changing either shore:
// node tools/area.mjs okrug65 tools/marine-data-bridges-test.mjs --yacht
// node tools/area.mjs islands tools/marine-data-bridges-test.mjs --yacht
if (process.argv.includes('--yacht')) {
  const A = await import('../src/world/area.js');
  assert(['okrug65', 'islands'].includes(A.ID), '--yacht needs either shore');
  const { buildWorld } = await import('./lib/headless-world.mjs');
  const names = ['environment', 'streets', 'bridges', 'bridgesPetro'];
  if (A.ID === 'okrug65') names.push('coastalBridges');
  const { ctx, L, THREE, errors } = await buildWorld({ modules: names, log: null });
  assert.deepEqual(errors, []);
  const { STATIONS, pointAt, deckProfile } = await import('../src/world/bridges/krestAptek2/yachtny.js');
  const yacht = ctx.services.bridgesPetro.list.filter(b => b.id === 'yachtny');
  assert.equal(yacht.length, 1, 'exactly one authored Yacht Bridge');
  assert(A.GROUPS.bridges.some(g => g.key === 'yachtny' && g.osm.includes('w419266626')), 'the shared builder owns the mapped road');
  // Geometry is sampled at 2.5 m stations: the analytic profile and a ramp's
  // interpolation agree within centimetres, not floating-point bit identity.
  const yachtNear = (a, b, msg) => assert(a !== null && Math.abs(a - b) <= .02, `${msg}: ${a} vs ${b}`);
  let maxGrade = 0;
  for (let s = 1; s <= STATIONS.L; s++) maxGrade = Math.max(maxGrade, Math.abs(deckProfile(s) - deckProfile(s - 1)));
  assert(maxGrade <= .09, 'Yacht approaches stay within 9% grade');
  const { createHandling } = await import('../src/world/drive/handling.js');
  const car = createHandling(ctx), idle = { thr: 0, brk: 0, steer: 0, hand: true, nitro: false, jump: false, flip: false };
  let samples = 0, peak = 0, worst = 0;
  for (let s = 10; s < STATIONS.L - 10; s += 10) {
    const p = pointAt(s, 0), expected = deckProfile(s), yaw = Math.atan2(p.tx, p.tz);
    yachtNear(yacht[0].B.deckAt(p.x, p.z), expected, 'authored Yacht deck profile');
    yachtNear(ctx.services.bridges.deckY(p.x, p.z, expected + .03), expected, 'public bridge service preserves Yacht floor');
    if (ctx.services.coastalBridges) yachtNear(ctx.services.coastalBridges.deckY(p.x, p.z, expected + .03), expected, 'coastal hook preserves shared Yacht floor');
    car.reset(p.x, p.z, yaw); car.y = expected + .03;
    yachtNear(car.groundAt(p.x, p.z, car.y), expected + .03, 'car resolves the shared Yacht floor');
    for (let i = 0; i < 12; i++) car.step(1 / 60, idle);
    worst = Math.max(worst, Math.abs(car.y - (expected + .03)));
    assert(worst < .08 && !car.air && !car.fall, 'Yacht car stays on its physical ramps');
    peak = Math.max(peak, expected); samples++;
  }
  yachtNear(peak, 14.1, 'same water-datum-adjusted deck peak on either shore');
  // Probe actual drawn soffits from the water. A full clear span on the short
  // plateau must provide 16 m; piers deliberately occupy their own positions.
  ctx.staticRoot.updateMatrixWorld(true);
  const meshes = [];
  ctx.staticRoot.traverse(o => { if (o.isMesh && !o.isInstancedMesh && /^brg-yachtny-/.test(o.name)) meshes.push(o); });
  assert(meshes.length, 'actual Yacht soffit meshes are present');
  const ray = new THREE.Raycaster(), up = new THREE.Vector3(0, 1, 0);
  let clearance = -Infinity, navigationPose = null;
  for (let s = STATIONS.L * .44; s <= STATIONS.L * .54; s += 1) {
    const p = pointAt(s, 0), water = ctx.physics.waterLevel(p.x, p.z);
    if (water === null) continue;
    ray.set(new THREE.Vector3(p.x, water + .05, p.z), up); ray.far = 25;
    const hit = ray.intersectObjects(meshes, false)[0];
    const h = hit ? hit.point.y - water : -Infinity;
    if (h > clearance) { clearance = h; navigationPose = { ...p, water }; }
  }
  yachtNear(clearance, 16, 'actual central soffit gives official 16 m navigation clearance');
  assert(!ctx.physics.columnBlocked(navigationPose.x, navigationPose.z, .5, navigationPose.water + .05, navigationPose.water + .7), 'ordinary boat has a clear physical passage below Yacht midspan');
  const dividers = yacht[0].B.dividers;
  assert.equal(dividers.records.length, 2 * STATIONS.n, 'both full divider runs have one physical panel per curve segment');
  assert(dividers.records.every(r => r && r.parts.length === 1 && r.item?.source?.knock === r), 'every divider owns its drawn instance and collision source');
  assert(dividers.meshes.length <= 8, 'divider draws stay spatially bounded');
  for (const mesh of dividers.meshes) {
    assert.equal(mesh.instanceMatrix.usage, THREE.DynamicDrawUsage);
    assert.equal(mesh.userData.lodFar, 260); assert(Number.isFinite(mesh.boundingSphere.radius));
    const p = mesh.geometry.attributes.position, base = [], top = [];
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getY(i)) < 1e-6) base.push(p.getZ(i));
      if (Math.abs(p.getY(i) - .85) < 1e-6) top.push(p.getZ(i));
    }
    assert(Math.abs(Math.max(...base) - Math.min(...base) - .5) < 1e-6, 'original trapezoid base width');
    assert(Math.abs(Math.max(...top) - Math.min(...top) - .22) < 1e-6, 'original trapezoid top width');
  }
  // Use actual handling and the normal collision-source impulse path, rather
  // than the knock.hit test shortcut. Both divider sides hold a slow bump,
  // then a faster car knocks the exact contacted panel and opens its gap.
  ctx.drive = { active: true, car };
  const driveInput = { ...idle, hand: false };
  for (const side of [-1, 1]) {
    const index = 2 * Math.floor(STATIONS.n * .49) + (side === 1 ? 1 : 0), rec = dividers.records[index], item = rec.item;
    const fr = dividers.frames[index], dx = -fr.tz * side, dz = fr.tx * side, yaw = Math.atan2(dx, dz);
    const part = rec.parts[0], before = new THREE.Matrix4(); part.mesh.getMatrixAt(part.index, before);
    const start = speed => { car.reset(rec.x - dx * 4, rec.z - dz * 4, yaw); car.y = rec.y + .03; car.vx = dx * speed; car.vz = dz * speed; };
    const events = [];
    start(3);
    for (let i = 0; i < 90; i++) { car.step(1 / 60, driveInput); events.push(...car.events); }
    assert(events.some(e => e.obstacle === item), 'slow car physically contacts the divider');
    assert.equal(rec.state, 'stand'); assert(ctx.physics.items.includes(item), 'slow bump retains the physical barrier');
    start(18); events.length = 0;
    for (let i = 0; i < 90 && rec.state === 'stand'; i++) { car.step(1 / 60, driveInput); events.push(...car.events); }
    assert(events.some(e => e.obstacle === item && e.type === 'hit'), 'fast car hits the matching divider collider');
    assert.equal(rec.state, 'fly', 'collision impulse knocks the contacted concrete panel');
    assert(!ctx.physics.items.includes(item) && ![...ctx.physics.querySolids(rec.x, rec.z, 2)].includes(item), 'old blocking collider leaves both physics indexes');
    ctx.knock.update(1 / 30);
    const after = new THREE.Matrix4(); part.mesh.getMatrixAt(part.index, after);
    assert(!after.equals(before), 'matching drawn instance moves with the knocked panel');
    assert(!ctx.physics.columnBlocked(rec.x, rec.z, .1, rec.y + .55, rec.y + .8), 'the knocked panel leaves a real physical gap');
    ray.set(new THREE.Vector3(rec.x - dx * .6, rec.y + .5, rec.z - dz * .6), new THREE.Vector3(dx, 0, dz)); ray.far = 1.2;
    assert.equal(ray.intersectObjects(meshes, false).length, 0, 'no static divider copy remains in the opened gap');
  }
  console.log('PASS Yacht dividers ' + JSON.stringify({ area: A.ID, panels: dividers.records.length, meshes: dividers.meshes.length, testedSides: 2, lowSpeedHeld: true, collisionKnocked: true, physicalGap: true }));
  console.log('PASS Yacht parity ' + JSON.stringify({ area: A.ID, samples, peak, maxGrade, actualSoffitClearance: clearance, worstCarHeightError: worst, bank: yacht[0].B.info.bank, piers: yacht[0].B.info.piers, triangles: yacht[0].B.info.tris }));
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
