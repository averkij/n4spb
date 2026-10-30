// Prepare a merged geographic-data source for the southern area cuts.
// No writes to the whole-city source. The raw snapshots and intermediate bake
// remain outside this repository. Cut the resulting out/ with the area port tool.
// Usage: node tools/prepare-south-osm.mjs <scratch-dir>
// Fetching is resumable (the map API tile cache lives inside the scratch dir).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mapData, rectsOfRings } from './area-shape.mjs';

const source = 'D:/git2/agi-fun-tests/102_3d_piter';
const scratchArg = process.argv[2];
if (!scratchArg || scratchArg.startsWith('--')) throw Error('Provide an isolated scratch directory.');
const scratch = path.resolve(scratchArg);
const inside = (parent, child) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
if ([path.resolve(source), path.resolve('.')].some((p) => inside(p, scratch) || inside(scratch, p)))
  throw Error('Scratch directory must be separate from both source and project.');
const out = path.join(scratch, 'out');
const old = await import(pathToFileURL(path.join(source, 'tools/osm-lib.mjs')).href);
const supplement = [
  ['SW1', { x0: -6000, x1: -4300, z0: 1450, z1: 4500 }],
  ['SW2', { x0: -4300, x1: -3200, z0: 2950, z1: 4500 }],
  ['SW3', { x0: -3200, x1: -2350, z0: 2900, z1: 5900 }],
  ['SW4', { x0: -1150, x1: 300, z0: 2800, z1: 5200 }],
];
const drafts = [{ id: 'kolomna', k: 42, prefix: 'K' }, { id: 'semyonovsky', k: 45, prefix: 'I' }];
const map = mapData();
const grown = supplement.map(([, r]) => ({ x0: r.x0 - 120, x1: r.x1 + 120, z0: r.z0 - 120, z1: r.z1 + 120 }));
const covered = (x, z) => [...old.EXTENT_RECTS, ...grown].some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
for (const d of drafts) {
  const a = map.areas.find((x) => x.k === d.k);
  if (!a) throw Error(`Missing map area ${d.k}`);
  d.rects = rectsOfRings([], 80, 4, [a.fp, a.wz], 600).map((r, i) => ({ name: d.prefix + String(i + 1).padStart(2, '0'), ...r }));
  // Include the 120 m scenery margin, not only the playable footprint.
  for (const r of d.rects) for (let x = r.x0 - 120; x <= r.x1 + 120; x += 40) for (let z = r.z0 - 120; z <= r.z1 + 120; z += 40)
    if (!covered(x, z)) throw Error(`Supplement does not cover ${d.id} scenery at ${x},${z}`);
}
function run(command, args) {
  const r = spawnSync(command, args, { cwd: scratch, stdio: 'inherit' });
  if (r.error || r.status !== 0) throw r.error || Error(`${command} exited ${r.status}`);
}
fs.mkdirSync(path.join(scratch, 'tools'), { recursive: true });
fs.mkdirSync(path.join(scratch, 'data/osm-raw'), { recursive: true });
for (const name of ['bake-osm.mjs', 'osm-lib.mjs', 'late-roads-ids.mjs', 'fetch-osm-map.py', 'fetch-osm.mjs'])
  fs.copyFileSync(path.join(source, 'tools', name), path.join(scratch, 'tools', name));
const lib = path.join(scratch, 'tools/osm-lib.mjs');
const libText = fs.readFileSync(lib, 'utf8');
const marker = '\n];\nexport const RECT_NAMES';
if (!libText.includes(marker)) throw Error('Cannot find source region list terminator');
fs.writeFileSync(lib, libText.replace(marker, `\n  // Southern port supplement (appended after all source regions).\n${supplement.map(([n, r]) => `  ['${n}', ${JSON.stringify(r)}],`).join('\n')}${marker}`));
for (const name of fs.readdirSync(path.join(source, 'data/osm-raw')).filter((n) => n.endsWith('.json'))) {
  const dest = path.join(scratch, 'data/osm-raw', name);
  if (!fs.existsSync(dest)) fs.copyFileSync(path.join(source, 'data/osm-raw', name), dest);
}
run('python', ['tools/fetch-osm-map.py', ...supplement.map(([name]) => name)]);
run('python', [path.resolve('tools/south-water-relations.py'), path.join(scratch, 'data/osm-raw')]);
run('node', ['--max-old-space-size=12000', 'tools/bake-osm.mjs', '--out', out, '--lock', path.join(source, 'src/world/data')]);
