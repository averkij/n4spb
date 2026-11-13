// Geography regressions for district64. These detect an accidentally re-cut
// old-source edge, clipped landmark relations and loss of the playable Neva.
// node tools/finlyandsky-area-test.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as D from '../src/areas/finlyandsky/data/city.js';
import { REGISTRY } from '../src/areas/registry.js';
import { KNOWN_DATA } from '../src/areas/finlyandsky/known-data.js';

let checks = 0, failures = 0;
function check(name, fn) { try { fn(); checks++; console.log('PASS', name); } catch (error) { failures++; console.error('FAIL', name, error.message); } }
const inPlay = (x, z) => D.PLAY_RECTS.some(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
const ringContains = (x, z, o) => { let yes = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2)
  if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) yes = !yes; return yes; };
const lengthOf = pts => { let sum = 0; for (let i = 2; i < pts.length; i += 2) sum += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); return sum; };
const boundsOf = b => { const ps = b.polys.flatMap(p => p.o), xs = ps.filter((_, i) => !(i % 2)), zs = ps.filter((_, i) => i % 2);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
const bById = new Map(D.BUILDINGS.map(b => [b.id, b]));
const building = id => { const b = bById.get(id); assert(b, `Missing mapped building ${id}`); return b; };
check('registry, data and territory agree on the reachable geographic footprint', () => {
  const territory = JSON.parse(fs.readFileSync(new URL('../src/areas/finlyandsky/territory.json', import.meta.url), 'utf8'));
  assert.equal(territory.mapId, 64);
  assert.deepEqual(REGISTRY.finlyandsky.play, territory.rects);
  assert.deepEqual(D.PLAY_RECTS, territory.rects.map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 })));
  const area = D.PLAY_RECTS.reduce((sum, r) => sum + (r.x1 - r.x0) * (r.z1 - r.z0), 0) / 1e6;
  assert(area > 15 && area < 19, `District coverage ${area} km²`);
  assert(Math.abs(area - territory.km2) < 1e-6);
});
check('mapped northern neighbourhoods survive beyond the whole-city extract edge', () => {
  const north = D.BUILDINGS.filter(b => b.cz < -5000 && inPlay(b.cx, b.cz));
  assert(north.length > 250, `Only ${north.length} mapped northern buildings`);
  for (const name of ['Полюстровский проспект', 'проспект Маршала Блюхера', 'Бестужевская улица']) {
    const length = D.ROADS.filter(r => r.name === name).reduce((sum, r) => sum + lengthOf(r.pts), 0);
    assert(length > 800, `${name}: only ${length.toFixed(0)} m retained`);
  }
});
check('mapped eastern neighbourhoods retain real buildings and connecting streets', () => {
  const east = D.BUILDINGS.filter(b => b.cx > 2800 && b.cz < -3300 && inPlay(b.cx, b.cz));
  assert(east.length > 120, `Only ${east.length} mapped eastern buildings`);
  const avenue = D.ROADS.filter(r => /Кондратьевский проспект|Пискарёвский проспект/.test(r.name || ''));
  assert(avenue.reduce((sum, r) => sum + lengthOf(r.pts), 0) > 4000, 'Eastern arterial roads truncated');
});
check('Finland Station is an intact deep terminal footprint with its mapped parts', () => {
  const station = building('r2123616'), b = boundsOf(station);
  assert(b.x1 - b.x0 > 100 && b.z1 - b.z0 > 200, 'Station clipped to its front facade');
  assert(b.z0 < -2750 && b.z1 > -2570, 'Terminal hall or forecourt facade missing');
  const family = D.BUILDINGS.filter(b => b.parent === station.id);
  assert.equal(family.length, station.parts);
  for (const id of ['w158544862', 'w158544845', 'w314291447', 'w820662808']) assert(family.some(b => b.id === id), `Missing terminal part ${id}`);
  assert(D.RAILS.some(r => r.pts.some((v, i) => i % 2 && v < -3500)), 'Station yard tracks missing');
});
check('Kresty retains its complete cross-block outline and central church family', () => {
  const block = building('r17026343'), b = boundsOf(block);
  assert(b.x1 - b.x0 > 230 && b.z1 - b.z0 > 120, 'Kresty cropped at the former source edge');
  const children = D.BUILDINGS.filter(b => b.parent === block.id);
  assert.equal(children.length, block.parts);
  assert(children.some(b => b.id === 'r17026341' && /Александра Невского/.test(b.name)), 'Central church missing');
  for (const child of children) assert(child.polys.every(p => p.o.length >= 6), `Empty prison part ${child.id}`);
});
check('Mineralnaya Visitation church keeps its elongated surveyed footprint', () => {
  const church = building('w366423247'), b = boundsOf(church);
  assert(/Посещения/.test(church.name));
  assert(Math.hypot(church.cx - 1000, church.cz + 3770) < 30, 'Church moved away from its mapped street');
  assert(b.x1 - b.x0 > 45 && b.z1 - b.z0 > 25 && church.polys[0].o.length >= 40, 'Transepts or chancel clipped');
});
check('Neva through Liteyny and Arsenal is wet inside reachable territory', () => {
  const neva = D.RIVER.filter(r => r.name === 'Нева');
  assert(neva.some(r => r.key === 'neva'));
  for (const [x, z] of [[0, -2100], [400, -2100], [800, -2200], [1200, -2400], [1600, -2550]]) {
    assert(inPlay(x, z), `Unreachable Neva point ${x},${z}`);
    assert(neva.some(r => r.polys.some(p => ringContains(x, z, p.o) && !(p.h || []).some(h => ringContains(x, z, h)))), `Dry Neva slit at ${x},${z}`);
  }
});
check('stacked Europolis storeys remain visible and duplicate tags require the same vertical interval', () => {
  const floor0 = building('r12118671'), floor1 = building('r12118672'), floor2 = building('r12118673');
  assert(Math.abs(floor0.h - floor1.minH) < .01 && Math.abs(floor1.h - floor2.minH) < .01, 'Mapped mall storeys should meet without gaps');
  for (const floor of [floor0, floor1, floor2]) assert(!floor.skip && !floor.dupOf, `Stacked mall storey ${floor.id} suppressed`);
  for (const b of D.BUILDINGS.filter(b => b.dupOf)) {
    const other = building(b.dupOf), top = b.h ?? b.hEst, otherTop = other.h ?? other.hEst;
    assert(Number.isFinite(top) && Number.isFinite(otherTop), `${b.id}: unknown heights do not prove duplicate volumes`);
    assert(Math.abs((b.minH || 0) - (other.minH || 0)) < .5 && Math.abs(top - otherTop) < .5, `${b.id}: different vertical intervals marked duplicate`);
    assert(Math.min(top, otherTop) > Math.max(b.minH || 0, other.minH || 0), `${b.id}: disjoint stacked intervals marked duplicate`);
  }
});
check('provenance names the complete live map snapshot and inspected original source', () => {
  const source = JSON.parse(fs.readFileSync(new URL('../src/areas/finlyandsky/source-info.json', import.meta.url), 'utf8'));
  assert.equal(source.mapOsm, 1181903);
  assert.equal(source.mapId, 64);
  assert(source.inspectedSource.path.endsWith('/102_3d_piter'));
  assert(/^[0-9a-f]{40}$/.test(source.inspectedSource.commit));
  assert(Number.isFinite(Date.parse(source.timestamp)));
  assert(source.queryBounds.z0 <= D.EXTENT.z0 && source.queryBounds.x1 >= D.EXTENT.x1, 'Raw map snapshot misses northern/eastern scenery');
  assert(Object.keys(KNOWN_DATA).length > 15, 'Existing source architectural dossiers lost');
  for (const id of Object.keys(KNOWN_DATA)) assert(bById.has(id) || D.BUILDINGS.some(b => b.parent === id), `Orphan dossier ${id}`);
});
console.log(`${checks} passed, ${failures} failed`);
process.exitCode = failures ? 1 : 0;
