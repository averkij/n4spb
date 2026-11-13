// Finlyandskiy (planning map 64): current mapped geometry beyond the old
// whole-city extract. Reuse the reviewed Sampson converter and water repairs
// unchanged; only its authoring configuration and area-specific trims differ.
// Raw OSM and the generated temporary converter remain in the OS temp folder.
// node tools/prepare-finlyandsky-area.mjs [--shape-only|--fetch-only] [--refresh]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { unproj } from './osm-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = path.join(os.tmpdir(), 'n4spb-finlyandsky-osm');
fs.mkdirSync(scratch, { recursive: true });
const template = path.join(root, 'tools/prepare-sampson-area.mjs');
let source = fs.readFileSync(template, 'utf8');
const replace = (before, after) => {
  if (!source.includes(before)) throw new Error(`Authoring template changed: ${before}`);
  source = source.replace(before, after);
};
replace("const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');", `const root = ${JSON.stringify(root)};`);
replace("const cfg = { k: 52, prefix: 'L' };", "const cfg = { k: 64, prefix: 'F' };");
// Sampson's deliberately removed slivers concern its Kronverk boundary only.
const trimStart = source.indexOf('// Three narrow raster slivers');
const trimEnd = source.indexOf('const pts = [...cells]', trimStart);
if (trimStart < 0 || trimEnd < 0) throw new Error('Cannot find Sampson-only territory trims');
source = source.slice(0, trimStart) + source.slice(trimEnd);
// The southern bank needs a complete shared block: the draft's last three
// narrow runs leave 440–520 m dead transition strips. This reviewed overlap
// keeps the Neva and both banks in the handoff with Palace and Smolny.
replace('const play = rects.sort', `rects.splice(0, rects.length, ...rects.filter(r => r.z0 < -2160), { x0: -400, x1: 1280, z0: -2160, z1: -1680 });\nconst play = rects.sort`);
replace('name: `L${String(i + 1)', 'name: `F${String(i + 1)');
replace('km2: cells.size * CELL * CELL / 1e6', 'km2: play.reduce((n, r) => n + (r.x1 - r.x0) * (r.z1 - r.z0), 0) / 1e6');
source = source.replaceAll('sampson', 'finlyandsky');
source = source.replace(/^import (.+) from '\.\/([^']+)';/gm,
  (_, bindings, file) => `import ${bindings} from '${pathToFileURL(path.join(root, 'tools', file)).href}';`);
const script = path.join(scratch, 'prepare-local.mjs');
fs.writeFileSync(script, source);
const args = process.argv.slice(2);
if (args.includes('--api-map')) {
  // The ordinary Overpass endpoint may be at capacity. The official OSM map
  // API supplies the same live records in small geographic tiles. Expand
  // every relation used by the converter before deriving Overpass-style geom.
  const shape = spawnSync(process.execPath, [script, '--shape-only'], { cwd: root, stdio: 'inherit' });
  if (shape.status !== 0) process.exit(shape.status || 1);
  const { rects } = JSON.parse(fs.readFileSync(path.join(root, 'src/areas/finlyandsky/territory.json'), 'utf8'));
  const bounds = { x0: Math.min(...rects.map(r => r.x0)) - 720, x1: Math.max(...rects.map(r => r.x1)) + 720,
    z0: Math.min(...rects.map(r => r.z0)) - 720, z1: Math.max(...rects.map(r => r.z1)) + 720 };
  const records = new Map();
  const ingest = data => { for (const e of data.elements) records.set(e.type + e.id, e); };
  const api = 'https://api.openstreetmap.org/api/0.6/';
  async function fetchAPI(key, suffix) {
    const target = path.join(scratch, key + '.json');
    if (fs.existsSync(target) && !args.includes('--refresh')) return JSON.parse(fs.readFileSync(target, 'utf8'));
    let last;
    for (let attempt = 0; attempt < 3; attempt++) try {
      const response = await fetch(api + suffix, { headers: { 'User-Agent': 'n4spb-geography-research/1.0 (contact: nepo7771@gmail.com)' }, signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`OSM API ${response.status}: ${await response.text()}`);
      const data = await response.json();
      if (!Array.isArray(data.elements)) throw new Error('OSM API returned no elements');
      data.fetchedAt = new Date().toISOString();
      fs.writeFileSync(target, JSON.stringify(data));
      console.log(key, data.elements.length, 'records');
      return data;
    } catch (e) { last = e; console.warn(key, e.message); }
    throw last;
  }
  const timestamps = [];
  for (let x = bounds.x0; x < bounds.x1; x += 1700) for (let z = bounds.z0; z < bounds.z1; z += 1700) {
    const [w, n] = unproj(x, z), [e, s] = unproj(Math.min(x + 1700, bounds.x1), Math.min(z + 1700, bounds.z1));
    const box = [w, s, e, n].map(v => v.toFixed(7)).join(',');
    const data = await fetchAPI(`map-${x}-${z}`, `map.json?bbox=${box}`);
    ingest(data); timestamps.push(data.fetchedAt);
  }
  const needsGeometry = e => e.type === 'relation' && e.tags &&
    ['building', 'building:part', 'highway', 'natural', 'landuse', 'leisure', 'waterway', 'water', 'amenity', 'barrier', 'man_made', 'historic', 'tourism', 'railway'].some(t => e.tags[t]);
  for (const rel of [...records.values()].filter(needsGeometry)) {
    const incomplete = (rel.members || []).some(m => !records.has(m.type + m.ref));
    if (!incomplete) continue;
    ingest(await fetchAPI(`relation-${rel.id}-full`, `relation/${rel.id}/full.json`));
  }
  const geom = e => e.type === 'way' ? (e.nodes || []).map(id => records.get('node' + id)).filter(Boolean).map(({ lat, lon }) => ({ lat, lon })) : [];
  const elements = [...records.values()].filter(e => e.tags).map(e => e.type === 'way' ? { ...e, geometry: geom(e) } : e.type === 'relation' ?
    { ...e, members: (e.members || []).map(m => { const part = records.get(m.type + m.ref); return { ...m, ...(m.type === 'way' ? { geometry: part ? geom(part) : [] } : m.type === 'node' && part ? { lat: part.lat, lon: part.lon } : {}) }; }) } : e);
  const snapshot = { version: .6, generator: 'Official OSM map API tiled snapshot', osm3s: { timestamp_osm_base: timestamps.sort().at(-1) }, elements };
  const metadata = { bounds, source: api, query: '1700m map tiles; complete geometry for mapped relations', timestamps };
  for (const name of ['mapped', 'water-ring']) {
    fs.writeFileSync(path.join(scratch, name + '.json'), JSON.stringify(snapshot));
    fs.writeFileSync(path.join(scratch, name + '-query.json'), JSON.stringify(metadata, null, 2));
  }
}
const run = spawnSync(process.execPath, [script, ...args.filter(a => a !== '--api-map' && !(a === '--refresh' && args.includes('--api-map')))], { cwd: root, stdio: 'inherit' });
if (run.status !== 0) process.exit(run.status || 1);
if (args.includes('--shape-only') || args.includes('--fetch-only')) process.exit(0);
const territory = JSON.parse(fs.readFileSync(path.join(root, 'src/areas/finlyandsky/territory.json'), 'utf8'));
const dataDir = path.join(root, 'src/areas/finlyandsky/data');
const expectedParts = new Set(territory.rects.map(r => `city-${r.name.toLowerCase()}.js`));
for (const file of fs.readdirSync(dataDir)) if (/^city-[\w]+\.js$/.test(file) && !expectedParts.has(file)) fs.rmSync(path.join(dataDir, file));

// Keep every existing whole-city building dossier that still has a mapped
// building here. The source was inspected: only151 core buildings fall in the
// planned territory, so its geometry alone cannot author this northern area.
const original = 'D:/git2/agi-fun-tests/102_3d_piter';
const known = spawnSync(process.execPath, [path.join(root, 'tools/strip-data-known.mjs'),
  '--src', `${original}/src/world/city/known-data.js`,
  '--facade', path.join(root, 'src/areas/finlyandsky/data/city.js'),
  '--out', path.join(root, 'src/areas/finlyandsky/known-data.js')], { cwd: root, stdio: 'inherit' });
if (known.status !== 0) process.exit(known.status || 1);
const info = JSON.parse(fs.readFileSync(path.join(scratch, 'source-info.json'), 'utf8'));
const queryInfo = JSON.parse(fs.readFileSync(path.join(scratch, 'mapped-query.json'), 'utf8'));
if (queryInfo.source) {
  info.source = queryInfo.source;
  info.snapshotMethod = queryInfo.query;
  info.timestampMeaning = 'Latest official map-tile download time; OSM API returns current element versions, not an Overpass replication-base timestamp.';
  info.tileDownloadRange = [queryInfo.timestamps.slice().sort()[0], queryInfo.timestamps.slice().sort().at(-1)];
  info.waterQuery = 'Same expanded official OSM map snapshot, completed with full mapped relation geometries.';
  const facadeFile = path.join(dataDir, 'city.js');
  fs.writeFileSync(facadeFile, fs.readFileSync(facadeFile, 'utf8')
    .replace('SOURCE: Overpass API current OSM snapshot', 'SOURCE: Official OSM map API tiled snapshot (download time)')
    .replace('; water ring ', '; completed mapped water relations '));
}
const revision = spawnSync('git', ['-C', original, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
const dirty = spawnSync('git', ['-C', original, 'status', '--porcelain', '--', 'src/world/data', 'src/world/city/known-data.js'], { encoding: 'utf8' });
info.inspectedSource = { path: original, commit: revision.stdout.trim(), dirty: !!dirty.stdout.trim(),
  coreBuildingsInInitialDraftTerritory: 151, sceneryBuildingsInInitialDraftTerritory: 295,
  policy: 'Current OSM geometry fills the original extract edge; existing matching building dossiers retained.' };
fs.writeFileSync(path.join(root, 'src/areas/finlyandsky/source-info.json'), JSON.stringify(info, null, 2) + '\n');
