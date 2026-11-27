// node tools/area.mjs <district> tools/winter-square-placement-test.mjs
// Include city, props and district landmarks: a bare road-plan test misses
// monument bases, planting and other solids that can disqualify a whole site.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';

const required = {
  admiralty: ['sennaya', 'teatralnaya', 'isaac-garden'],
  semyonovsky: ['pionerskaya', 'vitebsky-forecourt', 'baltic-forecourt'],
  aptekarsky: ['troitskaya', 'tolstoy-square'],
  finlyandsky: ['finland-lenin-square', 'simbirsky-garden'],
  kronverk: ['fortress-cathedral-square', 'baltic-house-forecourt', 'petrovskaya-square'],
  vasilyevsky: ['birzhevaya', 'vasileostrovskaya', 'andreevsky-market'],
  sampson: ['klimov-square', 'lesnaya-metro', 'sampson-garden'],
  okrug65: ['park300-lighthouse', 'begovaya-forecourt', 'piterland-waterfront'],
  komendantsky: ['dolgoe-park', 'seleznev-square', 'komendantskaya-square'],
  islands: ['yelagin-grand-square', 'old-theatre-square', 'zenit-square'],
  gavan: ['sea-glory', 'sobchak-square', 'sevkabel-winter-port'],
  morskoy: ['pribaltiyskaya-square', 'europe-square', 'bellingshausen-square'],
  dekabristov: ['primorskaya-holiday', 'volodin-garden', 'baltic-cadets'],
  'morskie-vorota': ['kanonersky-garden', 'gutuevsky-church'],
  narvsky: ['stachek-square', 'gorky-palace-court', 'kirov-square'],
  avtovo: ['avtovo-vestibule', 'kirovsky-zavod-forecourt'],
  kolomna: ['stachek-square', 'kulibina-square', 'repina-square'],
  moskovskaya: ['moscow-square-fair', 'victory-park-entrance', 'national-library-square'],
};
const area = process.env.AREA;
assert(required[area], 'select a winter expansion district with tools/area.mjs');
const { ctx, errors } = await buildWorld({
  season: 'winter', skip: ['people', 'drive', 'traffic', 'metro', 'wildlife'],
});
assert.deepEqual(errors, []);
buildWinter(ctx);
const objects = ctx.knock.list;
for (const id of required[area]) {
  const tree = ctx.scene.getObjectByName('holiday-' + id);
  assert(tree, 'missing square tree at ' + id);
  assert(objects.some(obj => obj.kind === 'tree' && obj.parts.some(p => p.obj === tree)), id);
  const nearby = objects.filter(obj => {
    const distance = Math.hypot(obj.x - tree.position.x, obj.z - tree.position.z);
    if (id === 'birzhevaya') return distance < 70 && obj.kind === 'festival-planet';
    return distance < 20 && obj.parts.some(p => p.mesh?.name.startsWith('festive-'));
  });
  assert(nearby.length >= 2, 'missing square illuminations at ' + id);
  for (const obj of nearby) {
    assert(obj.items.every(c => c.source === obj.src), 'fixture contact must knock its own mesh');
    if (!obj.parts.some(p => p.mesh?.name.startsWith('festive-arch-'))) continue;
    assert(!ctx.physics.columnBlocked(obj.x, obj.z, 0.45, 0.32, 1.95), 'closed arch at ' + id);
  }
}
if (area === 'finlyandsky') assert.equal(objects.filter(obj =>
  obj.parts.some(p => p.mesh?.name.startsWith('kalinin-light-crystal'))).length, 3, 'Kalinin Square crystals');
if (area === 'kronverk') assert.equal(objects.filter(obj =>
  obj.parts.some(p => p.mesh?.name.startsWith('festive-market-hut'))).length, 3, 'Cathedral Square market');
if (area === 'vasilyevsky') {
  assert.equal(objects.filter(obj => obj.kind === 'festival-planet').length, 8, 'planets on the Spit');
  assert.equal(objects.filter(obj => obj.kind === 'festival-star').length, 20, 'lights along the orbits');
}
if (area === 'sampson') assert.equal(objects.filter(obj =>
  obj.parts.some(p => p.mesh?.name.startsWith('klimov-cloud'))).length, 3, 'illuminated clouds at Klimov Square');
if (area === 'kolomna') {
  assert(ctx.scene.getObjectByName('new-holland-rink-ice'), 'ice missing from New Holland');
  assert(objects.some(obj => obj.parts.some(p => p.mesh?.name.startsWith('holland-rink-garlands'))), 'unlit rink');
}
if (area === 'moskovskaya') {
  assert.equal(objects.filter(obj => obj.kind === 'troika-horse').length, 3, 'all three horses on Moscow Square');
  assert.equal(objects.filter(obj => obj.kind === 'troika-sleigh').length, 1, 'missing sleigh');
}
console.log(area, 'PASS', required[area].join(', '));
