// tools/area-data-cut.mjs - cut the data facade of ONE AREA (docs/AREAS.md, docs/AREAS-DATA.md) from the data of the full city.
//
// The strip was cut from 102_3d_piter by hand (docs/STRIP.md) and extended rectangle by rectangle (tools/strip-data-extend.mjs, hard-wired to one rectangle). An AREA is cut in one go from the
// rectangles of its registry row (src/areas/registry.js REGISTRY[area].play): PLAY_RECTS = those rectangles, EXTENT_RECTS = each grown by MARGIN (120 m of scenery), RECT_NAMES = their names, and
// the facade, src/areas/<id>/data/city.js, has the shape of the strip's src/world/data/city.js (the same 52 exports) with one part file per rectangle (city-<name>.js).
//   node tools/area-data-cut.mjs --area north --orig D:/git2/agi-fun-tests/102_3d_piter/src/world/data --out src/areas/north/data [--dry] [--water-ring 600] [--margin 120]
//   --dry   writes NOTHING: the cut is computed in memory (the same code, tools/strip-data-clip.mjs clipParts) and only the counts are printed.
// SELECTION (the rule documented at the top of the strip's city.js, tools/bake-osm.mjs regionIdx): a record belongs to the FIRST extent rectangle, in RECT_NAMES order, that contains its
// representative point: BUILDINGS the centroid (cx, cz), points x,z, lines / polygons / tree rows the first vertex. TREES (a flat x,z list) point by point. Two additions the strip got from
// strip-data-clip --recover: a line / polygon whose first vertex lies outside every extent rectangle but which crosses one is kept too (it belongs to the first rectangle its bounding box
// touches) and is clipped to the union like every other record; WATER / RIVER are selected against the extent grown by --water-ring. BUILDINGS are never cut (only whole buildings with the
// centroid in the union are taken, the OVERLAPS between two taken buildings come with them). There is NO dedupe against another area: records that lie in two areas are in both.
// SUBWAY_ROUTES, TROLLEY, TRAM_ROUTES, BUS_ROUTES and RIVER are not split in the source either: they are taken whole into the first part and clipped there.
// Then strip-data-clip.mjs (clipParts) cuts every line / polygon to the UNION of the extent rectangles, drops what lies outside, and writes the Counts lines of the facade. The result is a
// fixpoint of `node tools/strip-data-clip.mjs --in <out> --check`. The source commit and this command go into the header of the facade.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';
import { clipParts, facadeTextOf, partFileText, grow, NOSPLIT } from './strip-data-clip.mjs';
import { applyAreaDataCorrections } from './lib/area-data-corrections.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ORIG = 'D:/git2/agi-fun-tests/102_3d_piter/src/world/data';

const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const boxHit = (b, r) => b.x1 >= r.x0 && b.x0 <= r.x1 && b.z1 >= r.z0 && b.z0 <= r.z1;
const flatBox = (f, b = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }) => { for (let i = 0; i + 1 < f.length; i += 2) { b.x0 = Math.min(b.x0, f[i]); b.x1 = Math.max(b.x1, f[i]); b.z0 = Math.min(b.z0, f[i + 1]); b.z1 = Math.max(b.z1, f[i + 1]); } return b; };
const hasLen = (a) => Array.isArray(a) && a.length > 0;
const bboxOf = (rs) => ({ x0: Math.min(...rs.map((r) => r.x0)), x1: Math.max(...rs.map((r) => r.x1)), z0: Math.min(...rs.map((r) => r.z0)), z1: Math.max(...rs.map((r) => r.z1)) });

/** where a record is: { rep: [x, z] (its representative point), box } or null (no geometry) */
function locate(name, rec) {
  if (Array.isArray(rec)) { if (rec.length < 2) return null; return { rep: [rec[0], rec[1]], box: flatBox(rec) }; }          // TREE_ROWS rows (flat)
  if (rec === null || typeof rec !== 'object') return null;
  if (name === 'BUILDINGS') {
    const box = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const p of rec.polys || []) flatBox(p.o, box);
    const rep = rec.cx !== undefined && rec.cz !== undefined ? [rec.cx, rec.cz] : [(box.x0 + box.x1) / 2, (box.z0 + box.z1) / 2];
    return { rep, box };
  }
  if (hasLen(rec.pts)) return { rep: [rec.pts[0], rec.pts[1]], box: flatBox(rec.pts) };
  if (hasLen(rec.polys)) { const box = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const p of rec.polys) flatBox(p.o, box); const o = rec.polys[0].o; return { rep: [o[0], o[1]], box }; }
  if (typeof rec.x === 'number' && typeof rec.z === 'number') return { rep: [rec.x, rec.z], box: { x0: rec.x, x1: rec.x, z0: rec.z, z1: rec.z } };
  return null;
}

/** the git commit of the source repository of `orig` (src/world/data of 102_3d_piter) */
function sourceCommit(orig) {
  const h = spawnSync('git', ['-C', orig, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (h.status !== 0) return 'unknown';
  const dirty = spawnSync('git', ['-C', orig, 'status', '--porcelain', '--', '.'], { encoding: 'utf8' });
  return h.stdout.trim() + (dirty.status === 0 && dirty.stdout.trim() ? ' (the data directory had uncommitted changes)' : '');
}

/**
 * Compute the cut. Returns { rects, parts, facade, partTexts, stats, selection, commit }:
 *   parts[i] = { file, name, arrays: Map } (already clipped), facade = the text of city.js, partTexts[i] = the text of parts[i].file
 */
export async function cutArea({ area, orig, margin = 120, waterRing = 600, command = null, clip = true }) {
  const row = REGISTRY[area];
  if (!row || !row.play || !row.play.length) throw new Error('area-data-cut: no play rectangles for area ' + JSON.stringify(area) + ' in src/areas/registry.js');
  const PLAY_RECTS = row.play.map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 }));
  const RECT_NAMES = row.play.map((r) => r.name);
  if (new Set(RECT_NAMES).size !== RECT_NAMES.length) throw new Error('area-data-cut: duplicate rectangle names');
  const EXTENT_RECTS = PLAY_RECTS.map((r) => grow(r, margin));
  const WATER_RECTS = EXTENT_RECTS.map((r) => grow(r, waterRing));
  const PLAY = bboxOf(PLAY_RECTS), EXTENT = bboxOf(EXTENT_RECTS);
  const origDir = path.resolve(orig);
  const O = await import(pathToFileURL(path.join(origDir, 'city.js')).href);
  // the export names of a part file and their order: those of the first part of the full city (it also holds the five unsplit arrays)
  const firstPart = fs.readFileSync(path.join(origDir, 'city-east.js'), 'utf8');
  const NAMES = [...firstPart.matchAll(/^export const (\w+) = /gm)].map((m) => m[1]);
  const SPLIT = NAMES.filter((n) => !NOSPLIT.has(n));
  const fileOf = (n) => 'city-' + n.toLowerCase() + '.js';
  const parts = RECT_NAMES.map((n, i) => ({ file: fileOf(n), name: n, arrays: new Map(NAMES.filter((k) => i === 0 || !NOSPLIT.has(k)).map((k) => [k, []])) }));
  const sel = {};                                  // name -> { source, taken, fromOutside (taken because the geometry crosses in, the first vertex lies outside) }
  const selectedBuildings = new Set();
  const assign = (loc, hitRects, s) => {
    let i = EXTENT_RECTS.findIndex((r) => inRect(r, loc.rep[0], loc.rep[1]));
    if (i < 0) { i = hitRects.findIndex((r) => boxHit(loc.box, r)); if (i >= 0) s.fromOutside++; }
    return i;
  };
  for (const name of NAMES) {
    const src = O[name]; if (!Array.isArray(src)) throw new Error('area-data-cut: the source facade has no array ' + name);
    const s = sel[name] = { source: name === 'TREES' ? src.length / 2 : src.length, taken: 0, fromOutside: 0 };
    if (NOSPLIT.has(name)) { parts[0].arrays.set(name, src.slice()); s.taken = src.length; continue; }
    if (name === 'TREES') {
      for (let i = 0; i + 1 < src.length; i += 2) { const k = EXTENT_RECTS.findIndex((r) => inRect(r, src[i], src[i + 1])); if (k >= 0) { parts[k].arrays.get(name).push(src[i], src[i + 1]); s.taken++; } }
      continue;
    }
    if (name === 'OVERLAPS') continue;             // after the buildings
    const hit = name === 'WATER' ? WATER_RECTS : EXTENT_RECTS;
    for (const rec of src) {
      const loc = locate(name, rec);
      if (!loc) throw new Error('area-data-cut: ' + name + ' record without geometry: ' + JSON.stringify(rec).slice(0, 120));
      let k;
      if (name === 'BUILDINGS') { k = EXTENT_RECTS.findIndex((r) => inRect(r, loc.rep[0], loc.rep[1])); if (k >= 0) selectedBuildings.add(rec.id); }
      else k = assign(loc, hit, s);
      if (k < 0) continue;
      parts[k].arrays.get(name).push(rec); s.taken++;
    }
  }
  {   // OVERLAPS: both buildings taken; the part of building a
    const partOfB = new Map(); parts.forEach((P, i) => { for (const b of P.arrays.get('BUILDINGS')) partOfB.set(b.id, i); });
    const s = sel.OVERLAPS;
    for (const q of O.OVERLAPS) if (selectedBuildings.has(q.a) && selectedBuildings.has(q.b)) { parts[partOfB.get(q.a)].arrays.get('OVERLAPS').push(q); s.taken++; }
  }
  const raw = {}; for (const name of NAMES) raw[name] = parts.reduce((n, P) => n + (P.arrays.get(name) || []).length, 0) / (name === 'TREES' ? 2 : 1);
  const { stats } = clip ? clipParts(parts, { extRects: EXTENT_RECTS, waterRing }) : { stats: {} };      // clip: false = the selection alone (the test of the clip library itself)
  applyAreaDataCorrections(area,parts);

  // ---- the facade
  const commit = sourceCommit(origDir);
  const srcFacade = fs.readFileSync(path.join(origDir, 'city.js'), 'utf8').split('\n');
  const srcLine = (re) => srcFacade.find((ln) => re.test(ln));
  const auditIdx = srcFacade.findIndex((ln) => ln.startsWith('// z-fight audit'));
  const formatLines = srcFacade.slice(auditIdx).filter((ln) => ln.startsWith('//'));
  const J = (v) => JSON.stringify(v);
  const rectList = PLAY_RECTS.map((r, i) => RECT_NAMES[i] + ' ' + J(r)).join('; ');
  const REGIONS = RECT_NAMES.map((n, i) => ({ name: n, file: parts[i].file, playRect: PLAY_RECTS[i], extentRect: EXTENT_RECTS[i] }));
  const head = [
    `// GENERATED by tools/area-data-cut.mjs from OpenStreetMap data (c) OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright) - do not edit by hand: regenerate it (docs/AREAS-DATA.md).`,
    `// SOURCE: the full-city data of 102_3d_piter (src/world/data/city.js), git commit ${commit}. COMMAND: ${command || 'node tools/area-data-cut.mjs --area ' + area}`,
    `// ${row.titleEn || area} (area ${area}, page ${row.page}). Local frame: metres from ORIGIN, the frame of every area (+X east, +Z south, so -Z is north), no rotation. Polygons: {o: outer ring, h: [holes]} as flat [x,z,x,z,...] (not closed).`,
    `// ORIGIN = Yandex ll of docs/reference/yandex-center.png (not its centre: see docs/reference/calibration.md). PLAY = the walkable area = a UNION of rectangles PLAY_RECTS (${rectList}; the PLAY export is only their bounding box: use inPlay / clampToPlay of layout.js to test a point); EXTENT_RECTS = every PLAY rectangle grown by ${margin} m of scenery (EXTENT = bounding box). Everything is clipped to the UNION of EXTENT_RECTS (a ring inside the union stays whole). The ground is flat (y = 0).`,
    `// AREA: this facade holds only the rectangles listed above: tools/area-data-cut.mjs picked the records of the full city and tools/strip-data-clip.mjs cut every line / polygon to the UNION of EXTENT_RECTS (RIVER and WATER to that union grown by ${waterRing} m, TREE_ROWS / TROLLEY / TRAM_ROUTES to what touches it). There is no dedupe against another area: a record that lies in two areas is in both. The Counts lines are those of this area; the z-fight / height audit lines below describe the whole-city bake.`,
    `// SPLIT: the records are stored in part files by region (REGIONS = [{name, file, playRect, extentRect}]; a record belongs to the first EXTENT rectangle, in RECT_NAMES order, that contains its representative point: centroid / x,z / first vertex; a line / polygon that starts outside every rectangle but crosses one belongs to the first rectangle its bounding box touches). This facade concatenates the arrays in that order. SUBWAY_ROUTES, TROLLEY, TRAM_ROUTES, BUS_ROUTES and RIVER are not split (RIVER keeps the order of the full city).`,
    srcLine(/^\/\/ RIVER = /),
    '// Counts:', '// Counts:', '// Counts:',
    ...formatLines,
  ];
  const facadeLines = [
    ...head,
    ...parts.map((P, i) => `import * as P${i} from './${P.file}';`),
    `export const ORIGIN = ${J(O.ORIGIN)};`,
    `export const PLAY = ${J(PLAY)};`,
    `export const EXTENT = ${J(EXTENT)};`,
    `export const PLAY_RECTS = ${J(PLAY_RECTS)};`,
    `export const EXTENT_RECTS = ${J(EXTENT_RECTS)};`,
    `export const RECT_NAMES = ${J(RECT_NAMES)};`,
    `export const REGIONS = ${J(REGIONS)};`,
    `export { ${[...NOSPLIT].join(', ')} } from './${parts[0].file}';`,
    ...SPLIT.map((k) => `export const ${k} = P0.${k}.concat(${parts.slice(1).map((_, i) => `P${i + 1}.${k}`).join(', ')});`),
    '',
  ];
  const facade = facadeTextOf(facadeLines.join('\n'), parts);
  const partTexts = parts.map((P, i) => {
    const lines = [`// GENERATED by tools/area-data-cut.mjs (part ${i + 1}/${parts.length} of src/areas/${area}/data/city.js, region ${P.name}: see the header of city.js) - OpenStreetMap data (c) OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright) - docs/AREAS-DATA.md`];
    const order = [];
    for (const k of P.arrays.keys()) { order.push([k, lines.length]); lines.push(''); }
    return partFileText(lines, order, P.arrays) + '\n';
  });
  return { area, rects: { PLAY_RECTS, EXTENT_RECTS, RECT_NAMES, PLAY, EXTENT }, parts, facade, partTexts, stats, selection: sel, raw, commit, NAMES };
}

const countOf = (P, k) => { const a = P.arrays.get(k); return a ? (k === 'TREES' ? a.length / 2 : a.length) : 0; };

async function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
  const area = arg('--area', 'north');
  const origArg = arg('--orig', DEFAULT_ORIG);
  const outArg = arg('--out', 'src/areas/' + area + '/data');
  const DRY = argv.includes('--dry');
  const waterRing = Number(arg('--water-ring', 600)), margin = Number(arg('--margin', 120));
  const outDir = path.resolve(root, outArg);
  const relOut = path.relative(root, outDir).split(path.sep).join('/');
  const command = `node tools/area-data-cut.mjs --area ${area} --orig ${origArg} --out ${relOut.startsWith('..') ? outArg : relOut}` + (waterRing !== 600 ? ` --water-ring ${waterRing}` : '') + (margin !== 120 ? ` --margin ${margin}` : '');
  const t0 = Date.now();
  const r = await cutArea({ area, orig: origArg, margin, waterRing, command });
  const fmt = (n) => String(n).padStart(8);
  console.log(`area ${area}: ${r.rects.RECT_NAMES.length} rectangles, source commit ${r.commit}`);
  console.log('PLAY', JSON.stringify(r.rects.PLAY), 'EXTENT', JSON.stringify(r.rects.EXTENT));
  const B = r.parts.map((P) => P.arrays.get('BUILDINGS'));
  const inPlay = (b) => r.rects.PLAY_RECTS.some((q) => b.cx >= q.x0 && b.cx <= q.x1 && b.cz >= q.z0 && b.cz <= q.z1);
  const all = B.flat();
  console.log(`buildings: ${all.length} in the extent (${all.filter((b) => !b.part).length} outlines, ${all.filter((b) => b.part).length} parts); with the centroid in the PLAY rectangles ${all.filter(inPlay).length} (outlines ${all.filter((b) => !b.part && inPlay(b)).length})`);
  console.log('records per array: source -> selected (of which crossing in from outside) -> after the clip | per part');
  for (const name of r.NAMES) {
    const s = r.selection[name], after = r.parts.reduce((n, P) => n + countOf(P, name), 0);
    console.log(' ', name.padEnd(15), fmt(s.source), '->', fmt(s.taken), `(${String(s.fromOutside).padStart(4)})`, '->', fmt(after), ' |', r.parts.map((P) => P.name + ' ' + countOf(P, name)).join('  '));
  }
  const sizes = r.partTexts.map((t, i) => [r.parts[i].file, Buffer.byteLength(t)]).concat([['city.js', Buffer.byteLength(r.facade)]]);
  console.log('files (bytes):', sizes.map(([f, n]) => f + ' ' + n).join(', '), '| total', sizes.reduce((n, x) => n + x[1], 0));
  const dropped = Object.entries(r.stats).filter(([, s]) => s.droppedIds.length);
  for (const [n, s] of dropped) console.log('dropped', n, s.droppedIds.length, s.droppedIds.slice(0, 10).join(' '));
  if (DRY) { console.log(`--dry: nothing written (${Date.now() - t0} ms)`); return; }
  fs.mkdirSync(outDir, { recursive: true });
  const keep = new Set(r.parts.map((P) => P.file).concat(['city.js']));
  for (const f of fs.readdirSync(outDir)) if (/^city(-[\w]+)?\.js$/.test(f) && !keep.has(f)) { fs.rmSync(path.join(outDir, f)); console.log('removed stale', f); }
  r.parts.forEach((P, i) => fs.writeFileSync(path.join(outDir, P.file), r.partTexts[i]));
  fs.writeFileSync(path.join(outDir, 'city.js'), r.facade);
  // The visual shore strip is a separate product, not wider gameplay data.
  // A live re-cut must reattach/regenerate it without changing PLAY / EXTENT.
  if(outDir===path.join(root,'src','areas',area,'data')&&fs.existsSync(path.join(outDir,'waterfront.js'))){
    const waterfront=spawnSync(process.execPath,[path.join(root,'tools/waterfront-data.mjs'),'--area',area],{cwd:root,stdio:'inherit'});
    if(waterfront.status!==0)throw new Error('waterfront supplement regeneration failed');
  }
  console.log(`written to ${outDir} (${Date.now() - t0} ms)`);
}
if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) await main();
