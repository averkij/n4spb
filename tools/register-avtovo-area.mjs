// Keep the live Avtovo registry and territory in sync with planning-map area 70.
// node tools/register-avtovo-area.mjs
import fs from 'node:fs';
import { mapData, km2 } from './area-shape.mjs';
import { coastalRects } from './marine-data-territory.mjs';
import { REGISTRY } from '../src/areas/registry.js';

const id = 'avtovo', k = 70;
const area = mapData().areas.find(a => a.k === k);
if (!area) throw new Error(`Missing planning area ${k}`);
const rects = coastalRects(id);
const territory = {
  mapId: k,
  policy: 'Planning-map B600 80 m raster; remove detached northern water cells; fill only finite enclosed holes',
  km2: km2(rects),
  rects,
};
fs.mkdirSync(`src/areas/${id}`, { recursive: true });
fs.writeFileSync(`src/areas/${id}/territory.json`, JSON.stringify(territory, null, 2) + '\n');

const current = REGISTRY[id] || {};
const row = {
  id, page: 'avtovo.html', bake: 'baked/avtovo/', requireBake: true,
  title: area.ru, titleEn: area.en,
  sights: ['Станция метро «Автово»', 'Кировский завод', 'Блокадный трамвай'],
  approxMB: 80, dev: false, mapId: k,
  remap: {
    ...current.remap,
    'src/world/data/city.js': `src/areas/${id}/data/city.js`,
    'src/world/area.js': `src/areas/${id}/area.js`,
    'src/world/city/known-data.js': `src/areas/${id}/known-data.js`,
    'src/world/lib/owns-table.js': `src/areas/${id}/owns-table.js`,
  },
  play: rects,
};
const begin = '// AVTOVO-AREA-BEGIN', end = '// AVTOVO-AREA-END';
const block = `${begin}\nREGISTRY["avtovo"] = ${JSON.stringify(row, null, 2)};\n${end}`;
let source = fs.readFileSync('src/areas/registry.js', 'utf8');
const re = /\/\/ AVTOVO-AREA-BEGIN[\s\S]*?\/\/ AVTOVO-AREA-END/;
if (re.test(source)) source = source.replace(re, block);
else {
  const anchor = '// NARVSKY-AREA-BEGIN';
  if (!source.includes(anchor)) throw new Error('Missing registry insertion point');
  source = source.replace(anchor, `${block}\n\n${anchor}`);
}
fs.writeFileSync('src/areas/registry.js', source);
console.log(`Avtovo: ${rects.length} territory rectangles, ${territory.km2.toFixed(2)} km2`);
