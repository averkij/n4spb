// Reproducible planning-map cut for the three northern districts. Never reads
// the similarly named Roadside Picnic project, which has no Petersburg data.
import fs from 'node:fs';
import { mapData, rectsOfRings } from './area-shape.mjs';
import { REGISTRY } from '../src/areas/registry.js';
import { cutArea } from './area-data-cut.mjs';

export const DISTRICTS = [
  { id: 'kronverk', k: 86, prefix: 'R' },
  { id: 'aptekarsky', k: 84, prefix: 'A' },
  { id: 'islands', k: 85, prefix: 'E' },
];
const map = mapData();
const orig = 'D:/git2/agi-fun-tests/102_3d_piter/src/world/data';
for (const d of DISTRICTS) {
  const a = map.areas.find(a => a.k === d.k);
  const play = rectsOfRings(a.fp, 80, 4, [a.fp, a.wz || []], 600)
    .map((r, i) => ({ name: d.prefix + String(i + 1).padStart(2, '0'), ...r }));
  const row = { id: d.id, page: d.id + '.html', bake: 'baked/' + d.id + '/',
    requireBake: true, status: 'planned', title: a.ru, titleEn: a.en,
    sights: a.sightList || [], approxMB: 60, dev: false, mapId: d.k,
    remap: { 'src/world/data/city.js': `src/areas/${d.id}/data/city.js`,
      'src/world/area.js': `src/areas/${d.id}/area.js`,
      'src/world/city/known-data.js': `src/areas/${d.id}/known-data.js` }, play };
  REGISTRY[d.id] = row;
  const dir = `src/areas/${d.id}`;
  fs.mkdirSync(dir + '/data', { recursive: true });
  fs.writeFileSync(dir + '/territory.json', JSON.stringify(row, null, 2) + '\n');
  const result = await cutArea({ area: d.id, orig, command: 'node tools/prepare-petro-port.mjs' });
  result.parts.forEach((p, i) => fs.writeFileSync(dir + '/data/' + p.file, result.partTexts[i]));
  fs.writeFileSync(dir + '/data/city.js', result.facade);
  console.log(`${d.id}: ${play.length} rectangles, ${result.parts.reduce((n,p)=>n+p.arrays.get('BUILDINGS').length,0)} buildings, source ${result.commit}`);
}
