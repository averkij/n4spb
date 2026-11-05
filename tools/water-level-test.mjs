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

if(process.argv.includes('--mutant-datum')) WATERWAYS.moika.water += .2;
for(const key of NAVIGABLE_WATER_KEYS){
  assert.equal(WATERWAYS[key].water,Y,`${key}: hydraulic datum`);
  assert.equal(BRIDGE_Y[key],Y,`${key}: bridge waterline`);
  assert(WATERWAYS[key].bed < Y - .9,`${key}: bed remains below the water`);
}
assert.equal(L.RIVER_Y.water,Y);assert.equal(ANICHKOV_Y,Y);assert.equal(NEW_HOLLAND_Y,Y);
assert.equal(TAURIDE_Y,-.45,'isolated Tauride ponds retain their authored level');
const ph=new Physics(L.heightAt,L.waterLevelAt),cuts=waterCuts();
let samples=0;
for(const c of cuts){
  assert.equal(c.y,Y,`rendered water cut ${c.key}`);
  if(c.kind==='slope')continue;
  const [x,z]=c.poly.reduce(([x,z],p)=>[x+p[0]/c.poly.length,z+p[1]/c.poly.length],[0,0]);
  // Scenery can extend beyond the playable/query region. Every wet query
  // must still agree with the actual renderer, whichever polygon owns it.
  if(L.waterLevelAt(x,z)!==null){
    assert.equal(ph.waterLevel(x,z),c.y,`boat physics at ${x},${z}`);samples++;
  }
}
assert(samples>0,'sample real area water, not just an empty table');
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
