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
const orig = 'D:/git2/agi-fun-tests/102_3d_piter/src/world/data';
const map = mapData();
for (const draft of drafts) {
  const a = map.areas.find((area) => area.k === draft.mapId);
  if (!a) throw new Error(`Map area ${draft.mapId} is missing`);
  const rects = rectsOfRings([], 80, 4, [a.fp, a.wz], 600)
    .map((r, i) => ({ name: draft.prefix + String(i + 1).padStart(2, '0'), ...r }));
  REGISTRY[draft.id] = { id: draft.id, play: rects };
  const result = await cutArea({ area: draft.id, orig, command: 'node tools/prepare-area-port.mjs' });
  const dir = path.resolve('src/areas', draft.id, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(result.parts.map((p) => p.file).concat('city.js'));
  for (const file of fs.readdirSync(dir)) if (/^city(-[\w]+)?\.js$/.test(file) && !keep.has(file)) fs.rmSync(path.join(dir, file));
  result.parts.forEach((p, i) => fs.writeFileSync(path.join(dir, p.file), result.partTexts[i]));
  fs.writeFileSync(path.join(dir, 'city.js'), result.facade);
  const buildings = result.parts.reduce((n, p) => n + p.arrays.get('BUILDINGS').length, 0);
  console.log(`${draft.id}: ${rects.length} draft rectangles, ${buildings} buildings, source ${result.commit}`);
}
