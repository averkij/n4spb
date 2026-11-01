// Reproducible registry/page setup; geography is prepared separately by
// prepare-moskovskaya-area.mjs. Keep the existing planning polygons unchanged.
import fs from 'node:fs';
const id = 'moskovskaya';
const { rects } = JSON.parse(fs.readFileSync(`src/areas/${id}/territory.json`, 'utf8'));
const row = {
  id, page: `${id}.html`, bake: `baked/${id}/`, requireBake: true,
  title: 'Московская застава', titleEn: 'Moskovskaya Zastava',
  sights: ['Московские триумфальные ворота', 'Московский парк Победы', 'Площадь Братьев Стругацких', 'Дом со шпилем', 'Российская национальная библиотека', 'Чесменская церковь и дворец', 'Московский райсовет'],
  approxMB: 55, dev: false, mapId: 6,
  remap: {
    'src/world/data/city.js': `src/areas/${id}/data/city.js`,
    'src/world/area.js': `src/areas/${id}/area.js`,
    'src/world/city/known-data.js': `src/areas/${id}/known-data.js`,
    'src/world/lib/owns-table.js': `src/areas/${id}/owns-table.js`,
    'src/world/coastalBridges/sites.js': `src/areas/${id}/bridge-sites.js`,
  }, play: rects,
};
let source = fs.readFileSync('src/areas/registry.js', 'utf8')
  .replace(/\/\/ MOSKOVSKAYA-AREA-BEGIN[\s\S]*?\/\/ MOSKOVSKAYA-AREA-END\n?/g, '');
const anchor = '/**\n * Gates between areas:';
if (!source.includes(anchor)) throw new Error('Missing gate documentation anchor');
source = source.replace(anchor, `// MOSKOVSKAYA-AREA-BEGIN\nREGISTRY["${id}"] = ${JSON.stringify(row,null,2)};\n// MOSKOVSKAYA-AREA-END\n\n${anchor}`);
fs.writeFileSync('src/areas/registry.js', source);
console.log(`Configured ${id}: ${rects.length} territory rectangles.`);
