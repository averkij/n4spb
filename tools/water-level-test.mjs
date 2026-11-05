// Run with tools/each-area.mjs: rendered cuts, bridge waterlines and boat
// physics must agree throughout the connected network and area overlaps.
import assert from 'node:assert/strict';
import * as L from '../src/world/layout.js';
import { Physics } from '../src/core/physics.js';
import { waterGeo, WATERWAYS } from '../src/world/environment/waterways.js';
import { waterCuts } from '../src/world/environment/river.js';
import { waterLevelSeams } from '../src/world/environment/quay-foundations.js';
import { NAVIGABLE_WATER_Y as Y, NAVIGABLE_WATER_KEYS } from '../src/world/environment/water-level.js';
import { WATER_Y as BRIDGE_Y } from '../src/world/bridges/sites.js';
import { WATER as ANICHKOV_Y } from '../src/world/landmarksC/frame.js';
import { WATER_DEEP as NEW_HOLLAND_Y } from '../src/world/landmarksNewHolland/frame.js';
import { WATER_Y as TAURIDE_Y } from '../src/world/landmarksTauride/data/ponds.js';
import { WATER as AREA_WATER } from '../src/world/lib/area-tables.js';

if(process.argv.includes('--mutant-datum')) WATERWAYS.moika.water += .2;
if(process.argv.includes('--mutant-isolated')) WATERWAYS.moat.water = Y;
const expected = key => AREA_WATER.isolatedLevels[key]?.water ?? Y;
for(const [key,level] of Object.entries(AREA_WATER.isolatedLevels)){
  assert(AREA_WATER.isolatedKeys[key],`${key}: override must be documented as isolated`);
  assert.equal(WATERWAYS[key].bed,level.bed,`${key}: authored isolated bed`);
}
if(['moskovskaya','kolomna','okrug65'].includes(process.env.AREA)){
  assert.deepEqual(AREA_WATER.isolatedLevels.moat,{water:-1.2,bed:-2.4},'preserve shallow isolated pond datum');
}
for(const key of NAVIGABLE_WATER_KEYS){
  assert.equal(WATERWAYS[key].water,expected(key),`${key}: hydraulic datum`);
  assert.equal(BRIDGE_Y[key],expected(key),`${key}: bridge waterline`);
  assert(WATERWAYS[key].bed < expected(key) - .9,`${key}: bed remains below the water`);
}
assert.equal(L.RIVER_Y.water,Y);assert.equal(ANICHKOV_Y,Y);assert.equal(NEW_HOLLAND_Y,Y);
assert.equal(TAURIDE_Y,-.45,'isolated Tauride ponds retain their authored level');
const ph=new Physics(L.heightAt,L.waterLevelAt),cuts=waterCuts();
let samples=0,isolatedSamples=0;
for(const c of cuts){
  assert.equal(c.y,expected(c.key),`rendered water cut ${c.key}`);
  if(c.kind==='slope')continue;
  const [x,z]=c.poly.reduce(([x,z],p)=>[x+p[0]/c.poly.length,z+p[1]/c.poly.length],[0,0]);
  // Scenery can extend beyond the playable/query region. Every wet query
  // must still agree with the actual renderer, whichever polygon owns it.
  if(L.waterLevelAt(x,z)!==null){
    assert.equal(ph.waterLevel(x,z),c.y,`boat physics at ${x},${z}`);samples++;
    if(AREA_WATER.isolatedLevels[c.key])isolatedSamples++;
  }
}
assert(samples>0,'sample real area water, not just an empty table');
if(['moskovskaya','kolomna','okrug65'].includes(process.env.AREA))assert(isolatedSamples>0,'sample actual isolated pond rendering and physics');
// Identical surveyed Yelagin pond coordinates must agree across both areas,
// even when their imported records assign different style aliases.
if(['okrug65','islands'].includes(process.env.AREA))for(const [x,z] of [[-5155.9,-5396.5],[-5305.3,-5073.733333],[-5794.4,-5358.533333],[-5623.2,-5210.366667],[-5920.333333,-5431.833333],[-4554.033333,-5402.866667]]){
  const cut=cuts.find(c=>c.kind!=='slope'&&pointInside(x,z,c.poly));
  assert(cut,'shared pond rendered in both areas');assert.equal(cut.y,Y,'shared pond render datum');
  const level=ph.waterLevel(x,z);if(level!==null)assert.equal(level,Y,'shared pond physics datum');
}
function pointInside(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;return inside;}
assert.deepEqual(waterLevelSeams(waterGeo().rings,k=>WATERWAYS[k].water),[],
  'connected water mouths must not acquire vertical masonry seams');

// Probe both sides of the reported New Holland / Admiralty mouth and the
// Summer Garden / castle mouths. The same coordinates are checked in each
// overlapping area that contains them, so a handoff cannot change boat height.
let mouthSamples=0;
for(const [cx,cz] of [[-3313.7,128.7],[-857.7,-1004.3],[-636.8,-863.9]])
  for(let dx=-24;dx<=24;dx+=2)for(let dz=-24;dz<=24;dz+=2){
    const y=ph.waterLevel(cx+dx,cz+dz);if(y===null)continue;
    assert.equal(y,Y,`mouth ${cx},${cz} sample ${dx},${dz}`);mouthSamples++;
  }
const isolated=new Physics(()=>-2);isolated.addWater({ring:[0,0,2,0,2,2,0,2],level:TAURIDE_Y});
assert.equal(isolated.waterLevel(1,1),TAURIDE_Y,'independent basin registrations remain supported');
console.log(`PASS ${process.env.AREA}: ${cuts.length} rendered cuts, ${samples} physics samples, ${mouthSamples} mouth samples; no datum seam; isolated basins preserved.`);
