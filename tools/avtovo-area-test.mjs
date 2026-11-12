// Focused, dependency-free geography/provenance contract of live Avtovo.
// node tools/area.mjs avtovo tools/avtovo-area-test.mjs
import fs from 'node:fs';
import * as A from '../src/world/area.js';
import * as D from '../src/world/data/city.js';
import * as L from '../src/world/layout.js';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { inUnion } from '../src/core/gates.js';
import { mapData } from './area-shape.mjs';

const problems = [], check = (truth, text) => { if (!truth) problems.push(text); };
const row = REGISTRY.avtovo;
const territory = JSON.parse(fs.readFileSync('src/areas/avtovo/territory.json', 'utf8'));
const shape = mapData().areas.find(a => a.k === 70);
check(A.ID === 'avtovo' && row?.mapId === 70 && territory.mapId === 70 && shape?.ru === 'Автово', 'area identity or planning map ID drifted');
check(JSON.stringify(row.play) === JSON.stringify(territory.rects) &&
  JSON.stringify(D.PLAY_RECTS) === JSON.stringify(territory.rects.map(({ name, ...bounds }) => bounds)),
  'registry, territory and data facade play rectangles differ');
check(territory.rects.length === 93 && territory.km2 > 23 && territory.km2 < 23.3, 'Avtovo territory changed without review');
check(D.BUILDINGS.length >= 3200 && D.ROADS.length >= 7800, 'mapped building or street coverage was lost');
const buildings = new Map(D.BUILDINGS.map(b => [b.id, b]));
for (const [module, id, key] of [
  ['landmarksAvtovoMetro', 'r6440025', 'avtovo-metro-avtovo'],
  ['landmarksAvtovoMetro', 'w47636754', 'avtovo-metro-kirovsky'],
  ['landmarksAvtovoSites', 'w128500581', 'avtovo-factory-gate'],
  ['landmarksAvtovoSites', 'w119225860', 'avtovo-pillbox'],
]) {
  const b = buildings.get(id), g = A.GROUPS[module]?.find(g => g.key === key);
  check(!!b && g?.ids.includes(id) && inUnion(row.play, b.cx, b.cz), `${module}/${id} has no in-play claimed footprint`);
}
check(D.FURNITURE.every(f => !['n3493599134','n3493599146','n3493599148','n5475042374','n6018575167','n6484527470'].includes(f.id)), 'an indoor metro ATM became an exterior prop');
const hall = buildings.get('w49629469'), canopy = buildings.get('w685882720');
check(hall?.kind === 'shed' && hall.h === 9.9 && canopy?.minH === 11.025 && canopy.h === 11.345, 'reviewed WHSD hall/canopy grade separation drifted');
const channel = D.WATER.find(w => w.id === 'r1530921'), pond = D.WATER.find(w => w.id === 'w173060664');
check(channel?.kind === 'canal' && D.RIVER.some(r => r.id === 'r1530921' && r.key === 'neva' && r.polys.length), 'connected Duderhof Channel lost its navigable water surface');
check(pond?.kind === 'pond' && A.WATER.dataWater.some(w => w.id === pond.id && w.key === 'moat') &&
  !D.RIVER.some(r => r.id === pond.id) && A.WATER.isolatedLevels.moat.water !== A.WATER.isolatedLevels.moat.bed,
  'the long inland pond lost its isolated reachable basin');
for (const boat of A.GARAGE.boats) {
  check(inUnion(row.play, boat.x, boat.z) && L.waterwayAt(boat.x, boat.z) === 'neva',
    `${boat.id} is not in navigable water inside the territory`);
}
for (const other of ['morskie-vorota', 'moskovskaya', 'narvsky']) {
  const a = GATES.find(g => g.kind === 'edge' && g.from === 'avtovo' && g.to === other);
  check(a && GATES.some(g => g.id === a.reverse && g.from === other && g.to === 'avtovo'), `missing reverse gate with ${other}`);
}
const source = fs.readFileSync('src/areas/avtovo/data/city.js', 'utf8');
check(source.startsWith('// SOURCE: Overpass API current OSM snapshot 2026-11-12T16:50:23Z'), 'OSM source timestamp/provenance missing');
for (const m of A.MODULES) check(typeof A.LABELS[m] === 'string' && /[А-Яа-яЁё]/.test(A.LABELS[m]), `${m} lacks a Russian loading label`);
console.log(`Avtovo: ${territory.rects.length} rectangles, ${territory.km2} km2; ${D.BUILDINGS.length} buildings, ${D.ROADS.length} roads; 4 building claims and 3 paired gates`);
for (const p of problems) console.log('  -', p);
console.log(problems.length ? 'RESULT: FAIL' : 'RESULT: OK');
if (problems.length) process.exitCode = 1;
