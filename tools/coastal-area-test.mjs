// Geographic regressions for newly authored coast data. Run through area.mjs
// for each new area. These assertions exercise the real layout and water mask.
import assert from 'node:assert/strict';
import * as D from '../src/world/data/city.js';
import * as L from '../src/world/layout.js';
import * as A from '../src/world/area.js';
import { REGISTRY } from '../src/areas/registry.js';
import { territoryProblems } from './lib/edge-geometry.mjs';
const marine = A.ID === 'morskie-vorota';
assert(marine || A.ID === 'okrug65', 'run as a coastal area');
assert.equal(territoryProblems(REGISTRY[A.ID].play).length, 0, 'one connected territory, no internal walls');
assert.deepEqual(D.PLAY_RECTS, REGISTRY[A.ID].play.map(({ x0,x1,z0,z1 })=>({x0,x1,z0,z1})), 'registry and data agree');
assert(D.BUILDINGS.length > (marine ? 800 : 2200), 'fresh data includes the source gap');
assert(D.ROADS.length > (marine ? 1500 : 7500), 'mapped roads cover the whole district');
assert.equal(new Set(D.BUILDINGS.map(x=>x.id)).size,D.BUILDINGS.length,'no duplicate building IDs');
assert.equal(new Set(D.ROADS.map(x=>x.id+JSON.stringify(x.pts))).size,D.ROADS.length,'no duplicate road geometry (clipped pieces can share a way ID)');
const ids = marine ? ['w34863504'] : ['w55498111','w317789257'];
for(const id of ids) assert(D.BUILDINGS.some(b=>b.id===id),id+' landmark exists in the OSM extract');
for(const r of D.RIVER) assert(L.WATERWAYS[r.key || A.WATER.riverKeys[r.name]], 'mapped waterway has a water datum: '+r.name);
for(const r of D.RIVER)for(const p of r.polys)assert.equal(p.h.length,0,'islands are subtracted into hole-free water pieces for the real bank index: '+r.id);
for(const[x,z]of marine?[[-5504,3231],[-7397,5489]]:[[-9714,-6881],[-9581,-6853],[-9450,-6770],[-9742,-6629]])
  assert(!L.waterwayAt(x,z),'mapped island stays dry: '+[x,z]);
if(!marine){
  const pondIds=['r1567031','r1567613','r9176724','r9176723','r18509887','r8613894','r1850727'];
  for(const id of pondIds){
    assert(D.WATER.some(w=>w.id===id&&w.kind==='pond'),'explicit OSM pond retains pond category: '+id);
    assert(D.RIVER.some(r=>r.id===id&&r.key==='moat'),'enclosed pond uses shallow pond datum: '+id);
  }
}
for(const id of marine?['r142563','r3082004','r3298255','r1201707']:['r1576173','r1576344','r1850725'])
  assert(D.RIVER.some(r=>r.id===id&&r.polys.length&&r.key==='neva'),'unnamed mapped water polygon reaches the actual water mask: '+id);
for(const z of A.WATER.bridgeZones){
  const r=D.ROADS.filter(r=>'coast-'+r.id===z.id).sort((a,b)=>Math.hypot((a.pts[0]+a.pts.at(-2))/2-z.c[0],(a.pts[1]+a.pts.at(-1))/2-z.c[1])-Math.hypot((b.pts[0]+b.pts.at(-2))/2-z.c[0],(b.pts[1]+b.pts.at(-1))/2-z.c[1]))[0];if(!r)continue;
  const dx=r.pts.at(-2)-r.pts[0],dz=r.pts.at(-1)-r.pts[1],a=z.axis*Math.PI/180;
  // A closed eco-trail viewing loop has no end-to-end crossing direction.
  // Its actual deck segments are tested by marine-data-bridges-test instead.
  if(dx===0&&dz===0){assert(Number.isFinite(z.axis)&&z.len>0,'closed boardwalk has finite zone metadata');continue;}
  assert(Math.abs((dx*Math.sin(a)-dz*Math.cos(a))/Math.hypot(dx,dz))>.999,'bridge opening axis follows the real mapped deck: '+z.id);
}
// Bay probes include the actual port anchorage and the beach, rather than a
// bounding rectangle which could silently flood an island.
const wet = marine ? [[-7731.7,3166.4],[-7610,2980],[-8100,3350]] : [[-8500,-5100],[-8700,-5200]];
for(const [x,z]of wet){ assert(L.inPlay(x,z),`wet probe in territory ${x},${z}`); assert(L.waterwayAt(x,z),`water remains reachable ${x},${z}`); assert(L.heightAt(x,z)<-1, 'the bay has a walkable bed'); }
assert(!L.insideBuilding(L.HERO.x,L.HERO.z,.35),'free walking start');
assert(L.inPlay(L.HERO.x,L.HERO.z,8),'start safely inside area');
assert.deepEqual(Object.keys(A.GARAGE.poses),['lada'],'only the purple Zhiguli outside central station');
for(const d of A.GARAGE.boats){assert(L.waterwayAt(d.x,d.z),'boat dock on water: '+d.id);assert(L.inPlay(d.x,d.z), 'boat dock in territory');}
console.log(`coastal-area-test: ${A.ID} OK; ${D.BUILDINGS.length} buildings, ${D.ROADS.length} roads, ${D.RIVER.length} water bodies`);
