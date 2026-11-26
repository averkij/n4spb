// Run under tools/area.mjs for each winter district. Samples the actual cut
// polygons so canals, broad rivers and the overlap areas use the same rule.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { seasonFor, buildWinter } from '../src/world/winter.js';
import { createHandling } from '../src/world/drive/handling.js';
import { waterCuts } from '../src/world/environment/river.js';
import { Player } from '../src/core/player.js';

const area = process.env.AREA;
assert.equal(seasonFor(area, new URLSearchParams()), 'winter');
assert.equal(seasonFor(area, new URLSearchParams('season=summer')), 'summer');
assert.equal(seasonFor('admiralty', new URLSearchParams('season=winter')), 'summer');
assert.equal(seasonFor(area, new URLSearchParams('bake=1')), 'summer');
const { ctx, L, THREE } = await buildWorld({ modules: ['environment', 'streets', 'bridges', 'landmarksC', 'landmarksGarden', 'landmarksK'] });
ctx.season = 'winter';
ctx.physics.frozenRivers = true;
buildWinter(ctx);
const trees = ctx.dynamicRoot.children.filter(o => o.name.startsWith('holiday-'));
assert(trees.length > 0, 'this district includes holiday squares');
for (const tree of trees) {
  const { x, z } = tree.position;
  assert(!L.insideBuilding(x, z, 1) && ctx.services.streets.net.cover(x, z, {}) < -0.5, tree.name);
}

const car = createHandling(ctx);
const ph = ctx.physics;
const samples = new Map();
let walked = false, drove = false;
for (const cut of waterCuts()) {
  if (cut.kind === 'slope') continue;
  const [x, z] = cut.poly.reduce(([a,b], p) => [a + p[0]/cut.poly.length, b + p[1]/cut.poly.length], [0,0]);
  const level = L.waterLevelAt(x, z);
  if (level == null || !L.inPlay(x, z) || L.heightAt(x, z) > level) continue;
  const floor = ph.groundHeight(x, z, level, false);
  assert(floor >= level - 1e-5, `gap in ${cut.key} at ${x}, ${z}`);
  samples.set(cut.key, (samples.get(cut.key) || 0) + 1);
  if (floor !== level || !L.inPlay(x,z,12) || L.waterLevelAt(x,z-8) !== level || L.waterLevelAt(x,z+8) !== level) continue;
  if (!drove) {
    car.reset(x,z,0);
    for (let i = 0; i < 90; i++) car.step(1/60, { thr: 0.55, brk: 0, steer: 0 });
    drove = Math.hypot(car.x-x, car.z-z) > 2 && car.depth === 0 && Math.abs(car.y - level - 0.03) < 0.06;
  }
  if (!walked) {
    const p = new Player(new THREE.PerspectiveCamera(), { addEventListener() {} }, ph, L.WORLD.play);
    p.enabled = true;
    p.setPose(x,z,0,0,level + 0.1,{ stand: true });
    p.keys.add('KeyW');
    for (let i=0; i<60; i++) p.update(1/60);
    walked = Math.hypot(p.pos.x-x, p.pos.z-z) > 1 && p.depth < 0.01 && Math.abs(p.pos.y-level) < 0.06;
  }
}
assert(samples.size > 0 && walked && drove, JSON.stringify({ walked, drove, samples: [...samples] }));
if (area === 'palace') {
  // The open, sloping Moika bank by Mikhailovsky Garden. Check a real route
  // up to the bank and down to the ice with the normal car collision shape.
  const input = { thr: 0.75, brk: 0, steer: 0, hand: false, nitro: false };
  const yaw = 0.917225845;
  car.reset(-899.4556, -953.1639, yaw);
  let onBank = false;
  for (let i = 0; i < 240 && !onBank; i++) {
    car.step(1/60, input);
    onBank = L.waterLevelAt(car.x, car.z) == null && car.y > -0.2 && !car.air && !car.fall;
  }
  assert(onBank, 'drive up the Moika bank');
  car.reset(car.x, car.z, yaw + Math.PI);
  let onIce = false;
  for (let i = 0; i < 300 && !onIce; i++) {
    car.step(1/60, input);
    const water = L.waterLevelAt(car.x, car.z);
    onIce = water != null && Math.abs(car.y - water - 0.03) < 0.06 && car.depth === 0 && !car.fall && !car.air;
  }
  assert(onIce, 'drive back down onto the ice');
}
console.log(area, 'PASS', trees.map(t => t.name), Object.fromEntries(samples), 'walking and driving on ice');
