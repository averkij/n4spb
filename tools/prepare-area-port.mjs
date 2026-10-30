// Prepare source-data drafts for the two southern map areas. These files are not
// live scenes; the area definitions, water, landmarks, gates and bakes still need
// integration. Re-run after changing the planning map before integrating them.
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from '../src/areas/registry.js';
import { mapData, rectsOfRings } from './area-shape.mjs';
import { cutArea } from './area-data-cut.mjs';

const drafts = [
  { id: 'kolomna', mapId: 42, prefix: 'K' },
  { id: 'semyonovsky', mapId: 45, prefix: 'I' },
];
const origIndex = process.argv.indexOf('--orig');
const orig = origIndex < 0 ? null : process.argv[origIndex + 1];
if (!orig) throw new Error('Pass --orig with the merged southern source data directory; see docs/research/south-osm-data.md');
const map = mapData();
for (const draft of drafts) {
  const a = map.areas.find((area) => area.k === draft.mapId);
  if (!a) throw new Error(`Map area ${draft.mapId} is missing`);
  const rects = rectsOfRings([], 80, 4, [a.fp, a.wz], 600)
    .map((r, i) => ({ name: draft.prefix + String(i + 1).padStart(2, '0'), ...r }));
  if (draft.id === 'kolomna') {
    // Overlap at the Neva edge and at the southern border with Semyonovsky:
    // the unadjusted raster creates transition dead strips of 320 and 400 m.
    const expected = [['K01', -320, -3440], ['K39', 3280, -3440], ['K40', 3360, -3440], ['K41', 3600, -3600]];
    for (const [name, z0, x1] of expected) {
      const r = rects.find((q) => q.name === name);
      if (!r || r.z0 !== z0 || r.x1 !== x1) throw new Error(`Map changed: review the ${name} transition adjustment`);
      if (name === 'K01') r.z0 = -400;
      else r.x1 = -3120;
    }
    // Keep navigable canals and river inlets connected at the raster boundary.
    // These narrow extensions follow water that otherwise falls just outside
    // the play area and leaves isolated, visible pockets of water.
    for (const [name, edge, before, after] of [
      ['K08', 'x1', -3280, -3200], ['K09', 'x1', -3280, -3200],
      ['K10', 'x0', -3040, -3120], ['K34', 'x0', -5440, -5520],
      ['K44', 'x0', -5920, -6000], ['K45', 'x0', -5840, -6000],
      ['K46', 'x0', -5760, -6000], ['K47', 'x0', -5760, -6000],
    ]) {
      const r = rects.find((q) => q.name === name);
      if (!r || r[edge] !== before) throw new Error(`Map changed: review the ${name} water boundary adjustment`);
      r[edge] = after;
    }
  }
  REGISTRY[draft.id] = { id: draft.id, play: rects };
  const command = `node tools/prepare-area-port.mjs --orig ${orig}`;
  const result = await cutArea({ area: draft.id, orig, command });
  const dir = path.resolve('src/areas', draft.id, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(result.parts.map((p) => p.file).concat('city.js'));
  for (const file of fs.readdirSync(dir)) if (/^city(-[\w]+)?\.js$/.test(file) && !keep.has(file)) fs.rmSync(path.join(dir, file));
  result.parts.forEach((p, i) => fs.writeFileSync(path.join(dir, p.file), result.partTexts[i]));
  fs.writeFileSync(path.join(dir, 'city.js'), result.facade);
  const buildings = result.parts.reduce((n, p) => n + p.arrays.get('BUILDINGS').length, 0);
  console.log(`${draft.id}: ${rects.length} draft rectangles, ${buildings} buildings, source ${result.commit}`);
}
