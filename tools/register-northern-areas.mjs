// Refresh the two planning areas' registry territories from the committed map.
// The area-specific modules, page text and scene data are authored separately.
import fs from 'node:fs';
import { mapData, rectsOfRings, km2 } from './area-shape.mjs';
import { REGISTRY } from '../src/areas/registry.js';
import { coastalRects } from './marine-data-territory.mjs';

const specs = [
  { id: 'komendantsky', k: 89, page: 'komendantsky.html', prefix: 'Q' },
  { id: 'sampson', k: 52, page: 'sampson.html', prefix: 'L' },
];
const areas = mapData().areas;
let source = fs.readFileSync('src/areas/registry.js', 'utf8');
for (const { id, k, page, prefix } of specs) {
  const area = areas.find(a => a.k === k);
  if (!area) throw new Error(`Missing planning area ${k}`);
  const territoryFile = `src/areas/${id}/territory.json`;
  const planned = id === 'komendantsky' ? coastalRects(id)
    : fs.existsSync(territoryFile) ? JSON.parse(fs.readFileSync(territoryFile, 'utf8')).rects
    : rectsOfRings(area.fp, 80, 4, [area.fp, area.wz || []], 600);
  const rects = planned.map((r, i) => ({ name: `${prefix}${String(i + 1).padStart(2, '0')}`, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }));
  const current = REGISTRY[id] || {};
  const row = {
    id, page, bake: `baked/${id}/`, requireBake: true,
    ...(current.status ? { status: current.status } : {}),
    title: area.ru, titleEn: area.en, sights: current.sights || [], approxMB: current.approxMB || 65, dev: false, mapId: k,
    remap: {
      ...current.remap,
      'src/world/data/city.js': `src/areas/${id}/data/city.js`,
      'src/world/area.js': `src/areas/${id}/area.js`,
      'src/world/city/known-data.js': `src/areas/${id}/known-data.js`,
      'src/world/lib/owns-table.js': `src/areas/${id}/owns-table.js`,
    },
    play: rects,
  };
  const begin = `// ${id.toUpperCase()}-AREA-BEGIN`;
  const end = `// ${id.toUpperCase()}-AREA-END`;
  const block = `${begin}\nREGISTRY[${JSON.stringify(id)}] = ${JSON.stringify(row, null, 2)};\n${end}`;
  const re = new RegExp(`${begin}[\\s\\S]*?${end}`);
  if (re.test(source)) source = source.replace(re, block);
  else source = source.replace('// NARVSKY-AREA-BEGIN', `${block}\n\n// NARVSKY-AREA-BEGIN`);
  console.log(`${id}: ${rects.length} rectangles, ${km2(rects).toFixed(2)} km2`);
}
fs.writeFileSync('src/areas/registry.js', source);
