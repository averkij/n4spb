// Reproducible B600 territory and page scaffolding for map areas 71 and 100.
// Run from this checkout; OSM data is generated separately by marine-data tools.
import fs from 'node:fs';
import { km2 } from './area-shape.mjs';
import { coastalRects } from './marine-data-territory.mjs';
const configs = [
  { id: 'morskie-vorota', k: 71, title: 'Морские ворота', en: 'Sea Gates', prefix: 'M', module: 'landmarksSeaGates', sights: ['Канонерский остров', 'Санкт-Петербургский морской порт', 'Портовые краны', 'Контейнеровоз'], center: [-7330, 2980] },
  { id: 'okrug65', k: 100, title: 'Округ № 65', en: 'Okrug 65', prefix: 'O', module: 'landmarksOkrug65', sights: ['Парк 300-летия Санкт-Петербурга', 'Питерлэнд', 'Приморский проспект', 'Берег Финского залива'], center: [-8375, -5465] },
];
let registry = fs.readFileSync('src/areas/registry.js', 'utf8').replace(/\/\/ COASTAL-AREAS-BEGIN[\s\S]*?\/\/ COASTAL-AREAS-END\n?/, '');
let rows = '// COASTAL-AREAS-BEGIN\n';
for (const c of configs) {
  const rects = coastalRects(c.id);
  const row = { id: c.id, page: c.id + '.html', bake: 'baked/' + c.id + '/', requireBake: true, title: c.title, titleEn: c.en, sights: c.sights, approxMB: 40, dev: false, mapId: c.k,
    remap: { 'src/world/data/city.js': `src/areas/${c.id}/data/city.js`, 'src/world/area.js': `src/areas/${c.id}/area.js`, 'src/world/city/known-data.js': `src/areas/${c.id}/known-data.js` }, play: rects };
  rows += `REGISTRY[${JSON.stringify(c.id)}] = ${JSON.stringify(row, null, 2)};\n`;
  fs.mkdirSync(`src/areas/${c.id}`, { recursive: true });
  fs.writeFileSync(`src/areas/${c.id}/territory.json`, JSON.stringify({ mapId: c.k, policy: 'B600', km2: km2(rects), rects }, null, 2) + '\n');
  if (!fs.existsSync(`src/areas/${c.id}/known-data.js`)) fs.writeFileSync(`src/areas/${c.id}/known-data.js`, '// Building attributes come from the fresh OSM extract; no invented heritage dossiers.\nexport const KNOWN_DATA = {};\n');
}
rows += '// COASTAL-AREAS-END\n';
registry = registry.replace('/**\n * Gates between areas:', rows + '\n/**\n * Gates between areas:');
fs.writeFileSync('src/areas/registry.js', registry);
console.log('Configured coastal registry territories.');
