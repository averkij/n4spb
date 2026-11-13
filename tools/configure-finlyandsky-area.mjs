// Register the mapped territory without changing other areas' content closures.
import fs from 'node:fs';
const id = 'finlyandsky';
const { rects } = JSON.parse(fs.readFileSync(`src/areas/${id}/territory.json`, 'utf8'));
const row = {
  id, page: `${id}.html`, bake: `baked/${id}/`, requireBake: true,
  title: 'Финляндский', titleEn: 'Finlyandsky',
  sights: ['Финляндский вокзал', 'Площадь Ленина и фонтаны', 'Кресты', 'Храм Посещения Пресвятой Девой Марией Елизаветы', 'Арсенальная набережная'],
  approxMB: 65, dev: false, mapId: 64,
  remap: {
    'src/world/data/city.js': `src/areas/${id}/data/city.js`,
    'src/world/area.js': `src/areas/${id}/area.js`,
    'src/world/city/known-data.js': `src/areas/${id}/known-data.js`,
    'src/world/lib/owns-table.js': `src/areas/${id}/owns-table.js`,
  }, play: rects,
};
let source = fs.readFileSync('src/areas/registry.js', 'utf8')
  .replace(/\/\/ FINLYANDSKY-AREA-BEGIN[\s\S]*?\/\/ FINLYANDSKY-AREA-END\n?/g, '');
const anchor = '/**\n * Gates between areas:';
if (!source.includes(anchor)) throw new Error('Missing gate documentation anchor');
source = source.replace(anchor, `// FINLYANDSKY-AREA-BEGIN\nREGISTRY["${id}"] = ${JSON.stringify(row, null, 2)};\n// FINLYANDSKY-AREA-END\n\n${anchor}`);
fs.writeFileSync('src/areas/registry.js', source);
console.log(`Configured ${id}: ${rects.length} territory rectangles.`);
