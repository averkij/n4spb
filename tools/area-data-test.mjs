// CPU test of the data facade of an area (docs/AREAS-DATA.md): node tools/area-data-test.mjs [--area north] [--dir src/areas/north/data] [--orig D:/git2/agi-fun-tests/102_3d_piter/src/world/data]
// What it proves: the facade has the 52 exports of the strip's facade with the same shapes, PLAY / EXTENT are the bounding boxes of the rectangle unions (= the registry row), every record lies
// in the extent union, a record is in the part of the first rectangle that contains its representative point, no building id twice, tools/strip-data-clip.mjs --check finds nothing to change
// (idempotence), and - when the full-city data is on disk (--orig) - the files are exactly what tools/area-data-cut.mjs generates today. BAND PARITY: in the band of the strip's own territory
// that the area contains (the area rectangles clipped to the strip's play rectangles), the records of the area and of the strip, both clipped to the band, agree (geometry within 0.3 m / 0.5 m2).
// Then layout-free sanity queries (sights present, landmark claims of the source modules: info only) and the known-data file of the area.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';
import { clipLineUnion, clipRingUnion, ringArea, round1 } from './osm-lib.mjs';
import { EXPORT_RE, NOSPLIT, grow } from './strip-data-clip.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const area = arg('--area', 'north');
const dir = path.resolve(root, arg('--dir', 'src/areas/' + area + '/data'));
const origDir = path.resolve(arg('--orig', 'D:/git2/agi-fun-tests/102_3d_piter/src/world/data'));
const row = REGISTRY[area];
let fails = 0, passes = 0;
const check = (name, fn) => { try { fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 6).join('\n       ')); } };
const info = (s) => console.log('  info ' + s);
const url = (f) => pathToFileURL(f).href;

if (!row) { console.log('FAIL: no registry row for ' + area); process.exit(1); }
const N = await import(url(path.join(dir, 'city.js')));
const S = await import(url(path.join(root, 'src/world/data/city.js')));
const TOL = 0.06;     // m: the clip rounds its points to 0.1 m
const inRect = (r, x, z, t = 0) => x >= r.x0 - t && x <= r.x1 + t && z >= r.z0 - t && z <= r.z1 + t;
const inUnion = (rs, x, z, t = 0) => rs.some((r) => inRect(r, x, z, t));
const bboxOf = (rs) => ({ x0: Math.min(...rs.map((r) => r.x0)), x1: Math.max(...rs.map((r) => r.x1)), z0: Math.min(...rs.map((r) => r.z0)), z1: Math.max(...rs.map((r) => r.z1)) });
const WATERISH = new Set(['WATER', 'RIVER']);
const SPLIT_NAMES = Object.keys(S).filter((k) => Array.isArray(S[k]) && !NOSPLIT.has(k) && !['PLAY_RECTS', 'EXTENT_RECTS', 'RECT_NAMES', 'REGIONS'].includes(k));
const NOSPLIT_NAMES = [...NOSPLIT];

console.log(`area ${area} - ${dir}`);

// ---- 1. the facade
check('the facade has exactly the 52 exports of the strip facade', () => {
  const a = Object.keys(S).sort(), b = Object.keys(N).sort();
  assert.equal(a.length, 52, 'the strip facade has ' + a.length);
  assert.deepEqual(b, a);
});
check('shapes: every array is an array of the same kind of element as the strip\'s, ORIGIN equals the strip\'s', () => {
  assert.deepEqual(N.ORIGIN, S.ORIGIN);
  for (const k of Object.keys(S)) {
    assert.equal(Array.isArray(N[k]), Array.isArray(S[k]), k);
    if (!Array.isArray(S[k]) || !S[k].length || !N[k].length) continue;
    const kind = (v) => (Array.isArray(v) ? 'array' : typeof v);
    assert.equal(kind(N[k][0]), kind(S[k][0]), k + ' element kind');
    if (kind(S[k][0]) === 'object' && !['PLAY_RECTS', 'EXTENT_RECTS', 'REGIONS'].includes(k)) {
      const sk = new Set(); for (const r of S[k]) for (const f of Object.keys(r)) sk.add(f);
      const odd = new Set(); for (const r of N[k]) for (const f of Object.keys(r)) if (!sk.has(f)) odd.add(f);
      if (odd.size) info(k + ' has fields the strip data never has (source records, optional fields): ' + [...odd].join(','));
    }
  }
});
check('PLAY_RECTS / RECT_NAMES equal the registry row (names and numbers); EXTENT_RECTS are the rectangles grown by 120 m', () => {
  assert.equal(N.PLAY_RECTS.length, row.play.length);
  row.play.forEach((r, i) => { assert.deepEqual(N.PLAY_RECTS[i], { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }, r.name); assert.equal(N.RECT_NAMES[i], r.name); assert.deepEqual(N.EXTENT_RECTS[i], grow(N.PLAY_RECTS[i], 120), r.name + ' extent'); });
});
check('PLAY / EXTENT are the BOUNDING BOXES of the unions of the rectangles', () => { assert.deepEqual(N.PLAY, bboxOf(N.PLAY_RECTS)); assert.deepEqual(N.EXTENT, bboxOf(N.EXTENT_RECTS)); });
check('REGIONS: one per rectangle, rectangles and part files as in the lists', () => {
  assert.equal(N.REGIONS.length, N.RECT_NAMES.length);
  N.REGIONS.forEach((g, i) => { assert.equal(g.name, N.RECT_NAMES[i]); assert.deepEqual(g.playRect, N.PLAY_RECTS[i]); assert.deepEqual(g.extentRect, N.EXTENT_RECTS[i]); assert(fs.existsSync(path.join(dir, g.file)), g.file); assert.equal(g.file, 'city-' + g.name.toLowerCase() + '.js'); });
});
const PARTS = [];     // [{ file, arrays: Map }] as written
check('part files: line 1 a comment, then one `export const NAME = JSON.parse("...")` per array (TREES flat); the first part also holds the five unsplit arrays', () => {
  const names0 = Object.keys(S).filter((k) => Array.isArray(S[k]) && !['PLAY_RECTS', 'EXTENT_RECTS', 'RECT_NAMES', 'REGIONS'].includes(k)).sort();
  N.REGIONS.forEach((g, i) => {
    const lines = fs.readFileSync(path.join(dir, g.file), 'utf8').split('\n');
    assert(lines[0].startsWith('//'), g.file + ' line 1');
    assert.equal(lines[lines.length - 1], '', g.file + ' ends with a newline');
    const arrays = new Map();
    for (const ln of lines.slice(1, -1)) { const m = EXPORT_RE.exec(ln); assert(m, g.file + ': unexpected line ' + ln.slice(0, 60)); arrays.set(m[1], JSON.parse(JSON.parse(m[2]))); }
    const want = names0.filter((k) => i === 0 || !NOSPLIT.has(k));
    assert.deepEqual([...arrays.keys()].sort(), want, g.file + ' exports');
    PARTS.push({ file: g.file, arrays });
  });
});
check('the facade arrays are the concatenation of the part arrays in RECT_NAMES order (NOSPLIT ones: the first part)', () => {
  for (const k of SPLIT_NAMES) assert.equal(N[k].length, PARTS.reduce((n, P) => n + P.arrays.get(k).length, 0), k);
  for (const k of NOSPLIT_NAMES) assert.equal(N[k].length, PARTS[0].arrays.get(k).length, k);
});

// ---- 2. every record lies in the extent union
const EXT = N.EXTENT_RECTS, EXT_W = EXT.map((r) => grow(r, 600));
function vertsOf(rec) {            // every vertex of the geometry of a record: [x, z] pairs, flat
  const v = [];
  const add = (f) => { for (let i = 0; i + 1 < f.length; i += 2) v.push(f[i], f[i + 1]); };
  if (Array.isArray(rec)) add(rec);
  else if (rec && typeof rec === 'object') {
    if (Array.isArray(rec.pts)) add(rec.pts);
    if (Array.isArray(rec.polys)) for (const p of rec.polys) { add(p.o); for (const h of p.h || []) add(h); }
    if (Array.isArray(rec.line)) for (const l of rec.line) add(l);
    if (!v.length && typeof rec.x === 'number') v.push(rec.x, rec.z);
  }
  return v;
}
check('every vertex of every line / polygon / point lies in the extent union (RIVER / WATER: grown by 600 m); BUILDINGS: the centroid; TREE_ROWS may cross the edge but touch it', () => {
  const bad = [];
  for (const k of SPLIT_NAMES) {
    if (k === 'TREES') { for (let i = 0; i < N.TREES.length; i += 2) if (!inUnion(EXT, N.TREES[i], N.TREES[i + 1], TOL)) bad.push('TREES ' + N.TREES[i] + ',' + N.TREES[i + 1]); continue; }
    const rs = WATERISH.has(k) ? EXT_W : EXT;
    for (const rec of N[k]) {
      if (k === 'BUILDINGS') { if (!inUnion(EXT, rec.cx, rec.cz)) bad.push(k + ' ' + rec.id + ' centroid'); continue; }
      if (k === 'OVERLAPS') continue;
      const v = vertsOf(rec);
      if (k === 'TREE_ROWS') { let touch = false; for (let i = 0; i < v.length; i += 2) if (inUnion(EXT, v[i], v[i + 1])) touch = true; if (!touch && clipLineUnion(pairs(rec), EXT).length === 0) bad.push('TREE_ROWS row outside'); continue; }
      for (let i = 0; i < v.length; i += 2) if (!inUnion(rs, v[i], v[i + 1], TOL)) { bad.push(k + ' ' + (rec.id || '') + ' at ' + v[i] + ',' + v[i + 1]); break; }
    }
  }
  for (const k of ['RIVER']) for (const rec of N[k]) { const v = vertsOf(rec); for (let i = 0; i < v.length; i += 2) if (!inUnion(EXT_W, v[i], v[i + 1], TOL)) { bad.push(k + ' ' + rec.id + ' at ' + v[i] + ',' + v[i + 1]); break; } }
  for (const k of ['TROLLEY', 'TRAM_ROUTES']) for (const rec of N[k]) { for (const l of rec.lines) for (let i = 0; i < l.length; i += 2) if (!inUnion(EXT, l[i], l[i + 1], TOL)) { bad.push(k + ' ' + rec.id); break; } for (const q of rec.stops) if (!inUnion(EXT, q.x, q.z)) bad.push(k + ' stop ' + rec.id); }
  assert(bad.length === 0, bad.length + ' outside, e.g. ' + bad.slice(0, 4).join(' | '));
});
function pairs(f) { const r = []; for (let i = 0; i + 1 < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; }
check('selection rule: a building / point record / tree is in the part of the FIRST extent rectangle that contains its centroid / x,z; an overlap in the part of its building a', () => {
  const firstRect = (x, z) => EXT.findIndex((r) => inRect(r, x, z));
  const bad = []; const bpart = new Map();
  PARTS.forEach((P, i) => {
    for (const b of P.arrays.get('BUILDINGS')) { bpart.set(b.id, i); if (firstRect(b.cx, b.cz) !== i) bad.push('building ' + b.id); }
    for (const k of SPLIT_NAMES) {
      if (k === 'BUILDINGS' || k === 'OVERLAPS') continue;
      const arr = P.arrays.get(k);
      if (k === 'TREES') { for (let j = 0; j < arr.length; j += 2) if (firstRect(arr[j], arr[j + 1]) !== i) bad.push('tree ' + arr[j] + ',' + arr[j + 1]); continue; }
      for (const rec of arr) if (!Array.isArray(rec) && !rec.pts && !rec.polys && typeof rec.x === 'number' && firstRect(rec.x, rec.z) !== i) bad.push(k + ' ' + rec.id);
    }
  });
  PARTS.forEach((P, i) => { for (const q of P.arrays.get('OVERLAPS')) if (bpart.get(q.a) !== i || !bpart.has(q.b)) bad.push('overlap ' + q.a + ' ' + q.b); });
  assert(bad.length === 0, bad.length + ' misplaced, e.g. ' + bad.slice(0, 4).join(' | '));
});
check('no building id twice; every OVERLAPS record names two buildings of the facade', () => {
  const ids = new Set();
  for (const b of N.BUILDINGS) { assert(!ids.has(b.id), 'duplicate building ' + b.id); ids.add(b.id); }
  for (const q of N.OVERLAPS) assert(ids.has(q.a) && ids.has(q.b), 'overlap ' + q.a + ' ' + q.b);
});
{   // dangling parent / part references (building families cut by the centroid rule): info
  const family = (M) => {      // BUILDINGS[].parts is the COUNT of the parts of an outline, parent the id of the outline of a part
    const ids = new Set(M.BUILDINGS.map((b) => b.id)), kids = new Map();
    for (const b of M.BUILDINGS) if (b.parent) kids.set(b.parent, (kids.get(b.parent) || 0) + 1);
    return { orphans: M.BUILDINGS.filter((b) => b.parent && !ids.has(b.parent)).length, short: M.BUILDINGS.filter((b) => b.parts > 0 && (kids.get(b.id) || 0) < b.parts).length };
  };
  const fn = family(N), fs_ = family(S);
  info(`building families cut by the centroid rule: ${fn.orphans} parts whose parent outline is not in the facade, ${fn.short} outlines with fewer parts in the facade than they declare (the strip: ${fs_.orphans} / ${fs_.short}, the same effect at its edge)`);
}

// ---- 3. idempotence of the clip, and the files equal what the cut generates
check('tools/strip-data-clip.mjs --in <dir> --check finds nothing to change (idempotent)', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'tools', 'strip-data-clip.mjs'), '--in', dir, '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'strip-data-clip --check: exit ' + r.status + '\n' + (r.stderr || '').slice(0, 300));
});
if (fs.existsSync(path.join(origDir, 'city.js'))) {
  const { cutArea } = await import(url(path.join(root, 'tools', 'area-data-cut.mjs')));
  const head = fs.readFileSync(path.join(dir, 'city.js'), 'utf8').split('\n')[1] || '';
  const m = /git commit ([0-9a-f]{40})\S*(?: \([^)]*\))?\. COMMAND: (.*)$/.exec(head);
  const git = spawnSync('git', ['-C', origDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (!m) check('the facade header carries the source commit and the generating command', () => assert(m));
  else if (git.status === 0 && git.stdout.trim() !== m[1]) info(`regeneration check skipped: the full-city repository is at ${git.stdout.trim().slice(0, 12)}, the facade was cut from ${m[1].slice(0, 12)}`);
  else {
    const r = await cutArea({ area, orig: origDir, command: m[2] });
    check('regenerating from the full-city data gives byte-identical part files and facade', () => {
      assert.equal(fs.readFileSync(path.join(dir, 'city.js'), 'utf8'), r.facade, 'city.js');
      r.parts.forEach((P, i) => assert.equal(fs.readFileSync(path.join(dir, P.file), 'utf8'), r.partTexts[i], P.file));
    });
  }
} else info('the full-city data is not at ' + origDir + ': regeneration check skipped');

// ---- 4. band parity: the part of the strip's own territory inside the area, both datasets clipped to it
const stripPlay = REGISTRY.strip.play;
const BAND = (() => {   // the intersection of the first area rectangle with the strip's OLD rectangle
  const a = N.PLAY_RECTS[0], b = stripPlay[0];
  return { x0: Math.max(a.x0, b.x0), x1: Math.min(a.x1, b.x1), z0: Math.max(a.z0, b.z0), z1: Math.min(a.z1, b.z1) };
})();
const GEOM_KEYS = new Set(['pts', 'polys']);
function bandView(M) {
  const out = new Map();     // 'ARRAY|id' -> { fields: Set, n, len, area, box }
  const byId = new Map(M.BUILDINGS.map((b) => [b.id, b]));
  const add = (key, fields, n, len, area, box) => {
    let g = out.get(key); if (!g) out.set(key, g = { fields: new Set(), n: 0, len: 0, area: 0, box: { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 } });
    g.fields.add(fields); g.n += n; g.len += len; g.area += area;
    g.box.x0 = Math.min(g.box.x0, box.x0); g.box.x1 = Math.max(g.box.x1, box.x1); g.box.z0 = Math.min(g.box.z0, box.z0); g.box.z1 = Math.max(g.box.z1, box.z1);
  };
  const boxOfPts = (pts) => { const b = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const p of pts) { b.x0 = Math.min(b.x0, p[0]); b.x1 = Math.max(b.x1, p[0]); b.z0 = Math.min(b.z0, p[1]); b.z1 = Math.max(b.z1, p[1]); } return b; };
  const plen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
  const dd = (pts) => pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]).map((p) => [round1(p[0]), round1(p[1])]);
  for (const k of SPLIT_NAMES) {
    if (k === 'TREES') { const a = M.TREES; for (let i = 0; i < a.length; i += 2) if (inRect(BAND, a[i], a[i + 1])) add('TREES|' + a[i] + ',' + a[i + 1], '', 1, 0, 0, { x0: a[i], x1: a[i], z0: a[i + 1], z1: a[i + 1] }); continue; }
    for (const rec of M[k]) {
      if (k === 'BUILDINGS') { if (inRect(BAND, rec.cx, rec.cz)) add(k + '|' + rec.id, JSON.stringify(rec), 1, 0, 0, { x0: rec.cx, x1: rec.cx, z0: rec.cz, z1: rec.cz }); continue; }
      if (k === 'OVERLAPS') { const ba = byId.get(rec.a); if (ba && inRect(BAND, ba.cx, ba.cz)) add(k + '|' + rec.a + '|' + rec.b, JSON.stringify(rec), 1, 0, 0, { x0: 0, x1: 0, z0: 0, z1: 0 }); continue; }
      if (Array.isArray(rec)) { if (clipLineUnion(pairs(rec), [BAND]).length) add(k + '|' + JSON.stringify(rec), '', 1, 0, 0, { x0: 0, x1: 0, z0: 0, z1: 0 }); continue; }
      const fields = JSON.stringify(Object.fromEntries(Object.entries(rec).filter(([f]) => !GEOM_KEYS.has(f))));
      const key = k + '|' + (rec.id !== undefined ? rec.id : JSON.stringify(rec).slice(0, 80));
      if (Array.isArray(rec.pts) && rec.pts.length) {
        for (const piece of clipLineUnion(pairs(rec.pts), [BAND])) { const l = dd(piece); if (l.length >= 2 && plen(l) >= 0.05) add(key, fields, 1, plen(l), 0, boxOfPts(l)); }
      } else if (Array.isArray(rec.polys) && rec.polys.length) {
        for (const p of rec.polys) {
          const ring = pairs(p.o); ring.push(ring[0]);
          for (const o of clipRingUnion(ring, [BAND])) { const l = dd(o); if (l.length < 4 || Math.abs(ringArea(l)) < 0.5) continue; add(key, fields, 1, 0, Math.abs(ringArea(l)), boxOfPts(l)); }
        }
      } else if (typeof rec.x === 'number' && inRect(BAND, rec.x, rec.z)) add(key, fields, 1, 0, 0, { x0: rec.x, x1: rec.x, z0: rec.z, z1: rec.z });
    }
  }
  return out;
}
const sameGeom = (a, b) => a.n === b.n && Math.abs(a.len - b.len) <= 0.3 && Math.abs(a.area - b.area) <= Math.max(0.5, 1e-3 * Math.max(a.area, b.area))
  && ['x0', 'x1', 'z0', 'z1'].every((f) => Math.abs(a.box[f] - b.box[f]) <= 0.15);
const sameFields = (a, b) => a.fields.size === b.fields.size && [...a.fields].every((f) => b.fields.has(f));
console.log(`band parity: x ${BAND.x0}..${BAND.x1}, z ${BAND.z0}..${BAND.z1} (the strip's OLD rectangle inside the first area rectangle)`);
const bandDiff = { };
{
  const vn = bandView(N), vs = bandView(S);
  const names = [...new Set([...vn.keys(), ...vs.keys()].map((k) => k.split('|')[0]))];
  for (const k of names) bandDiff[k] = { both: 0, equal: 0, fieldsDiffer: 0, geomDiffers: 0, onlyN: [], onlyS: [] };
  for (const [key, g] of vn) { const k = key.split('|')[0], d = bandDiff[k], o = vs.get(key); if (!o) { d.onlyN.push(key.slice(k.length + 1)); continue; } d.both++; if (!sameFields(g, o)) d.fieldsDiffer++; else if (!sameGeom(g, o)) d.geomDiffers++; else d.equal++; }
  for (const [key] of vs) { const k = key.split('|')[0]; if (!vn.has(key)) bandDiff[k].onlyS.push(key.slice(k.length + 1)); }
  const rows = names.sort().map((k) => { const d = bandDiff[k]; return `${k.padEnd(15)} common ${String(d.both).padStart(5)}  equal ${String(d.equal).padStart(5)}  fields differ ${String(d.fieldsDiffer).padStart(3)}  geometry differs ${String(d.geomDiffers).padStart(3)}  only north ${String(d.onlyN.length).padStart(3)}  only strip ${String(d.onlyS.length).padStart(3)}`; });
  for (const r of rows) console.log('    ' + r);
  for (const k of names) { const d = bandDiff[k]; if (d.onlyN.length || d.onlyS.length || d.fieldsDiffer || d.geomDiffers) console.log(`    ${k}: only north [${d.onlyN.slice(0, 6).join(' ')}] only strip [${d.onlyS.slice(0, 6).join(' ')}]`); }
}
// The band is IDENTICAL today (0 differences in every array). A boundary artefact that is ever explained goes into BAND_BUDGET (array -> number of records allowed to differ), with the reason.
const BAND_BUDGET = {};
check('band parity: every array agrees - the same ids (BUILDINGS with every field and every polygon), the same fields, the same clipped geometry (0.3 m / 0.5 m2)', () => {
  for (const k of Object.keys(bandDiff)) {
    const d = bandDiff[k], budget = BAND_BUDGET[k] || 0;
    assert(d.onlyN.length + d.onlyS.length + d.fieldsDiffer + d.geomDiffers <= budget, `${k}: only north ${d.onlyN.length} [${d.onlyN.slice(0, 4)}], only strip ${d.onlyS.length} [${d.onlyS.slice(0, 4)}], fields differ ${d.fieldsDiffer}, geometry differs ${d.geomDiffers} (budget ${budget})`);
  }
});

// ---- 5. sanity queries
const B = new Map(N.BUILDINGS.map((b) => [b.id, b]));
check(area === 'vasilyevsky' ? 'sights (Vasilyevsky-Okrug 7): the Academy of Arts r165182, the House of Academicians w79566434 and the Academic Garden pavilion w82802146 exist' : area === 'vladimirsky' ? 'sights (Vladimirsky-Ligovka): the Moscow station r2404499, Hotel Moscow r3132622, the Lavra gate church r5677834 and the Nevsky Centre r1784115 exist' : 'sights: Tauride Garden bbox (918..1497, -1789..-1259) holds > 20 buildings; Chernyshevskaya vestibule w22999175, the Transfiguration r5802451 and Muruzi r946930 exist', () => {
  if (area === 'vasilyevsky') { for (const id of ['r165182', 'w79566434', 'w82802146']) assert(B.has(id), id + ' is missing'); return; }
  if (area === 'vladimirsky') { for (const id of ['r2404499', 'r3132622', 'r5677834', 'r1784115']) assert(B.has(id), id + ' is missing'); return; }
  const n = N.BUILDINGS.filter((b) => b.cx >= 918 && b.cx <= 1497 && b.cz >= -1789 && b.cz <= -1259).length;
  info('buildings in the Tauride Garden bbox: ' + n);
  assert(n > 20, String(n));
  for (const id of ['w22999175', 'r5802451', 'r946930']) assert(B.has(id), id + ' is missing');
});
check('the Fontanka (RIVER key fontanka) and the Neva (key neva) are in RIVER', () => {
  for (const key of ['fontanka', 'neva']) { const r = N.RIVER.filter((q) => q.key === key); assert(r.length >= 1, key); info(`RIVER ${key}: ${r.length} record(s), index ${N.RIVER.indexOf(r[0])}, ${r.reduce((n, q) => n + q.polys.length, 0)} polygons, ${r.reduce((n, q) => n + q.line.length, 0)} centre lines`); }
});
check('the unsplit arrays exist: SUBWAY_ROUTES 10, BUS_ROUTES >= 40, TROLLEY / TRAM_ROUTES non-empty, ENTRANCES / STATIONS of the Chernyshevskaya line', () => {
  assert.equal(N.SUBWAY_ROUTES.length, 10); assert(N.BUS_ROUTES.length >= 40); assert(N.TROLLEY.length > 0); assert(N.TRAM_ROUTES.length > 0);
  if (area === 'vasilyevsky') { assert(N.STATIONS.some((s) => /Василеостровская|Спортивная|Горный институт/.test(s.name || '')), 'no metro station of Vasilyevsky Island'); return; }
  if (area === 'vladimirsky') { assert(N.STATIONS.some((s) => /Площадь Восстания|Маяковская|Владимирская|Достоевская/.test(s.name || '')), 'no metro station of the Vladimirsky districts'); return; }
  assert(N.STATIONS.some((s) => /Чернышевск/.test(s.name || '')), 'no Chernyshevskaya station');
});
// landmark claims of the source modules (info: the area module of the area claims what it builds)
const claimed = [];
if (fs.existsSync(path.join(origDir, '..', 'landmarksSmolny', 'groups.js'))) {
  const wd = path.join(origDir, '..');
  for (const m of ['landmarksNorth', 'landmarksSmolny', 'landmarksTauride', 'landmarksSuvorov', 'landmarksKirochnaya', 'landmarksOktyabrsky']) {
    const f = path.join(wd, m, 'groups.js'); if (!fs.existsSync(f)) continue;
    try { const G = await import(url(f)); for (const g of G.GROUPS_LIST || []) claimed.push({ module: m, key: g.key, ids: g.ids || [] }); }
    catch (e) { info('groups of ' + m + ' not loadable: ' + String(e.message).split('\n')[0]); }
  }
  let present = 0, absent = 0; const lines = [];
  for (const g of claimed) {
    const miss = g.ids.filter((id) => !B.has(id)); present += g.ids.length - miss.length; absent += miss.length;
    lines.push(`${g.module}/${g.key}: ${g.ids.length - miss.length}/${g.ids.length} present` + (miss.length ? ', absent: ' + miss.slice(0, 8).join(' ') + (miss.length > 8 ? ' ...' : '') : ''));
  }
  info(`landmark claims of the source modules: ${claimed.length} groups, ${present} ids present, ${absent} absent`);
  for (const l of lines) console.log('       ' + l);
} else info('the source landmark modules are not on disk: landmark claims skipped');

// ---- 6. known-data of the area
const knownFile = path.join(root, 'src', 'areas', area, 'known-data.js');
if (fs.existsSync(knownFile)) {
  const K = await import(url(knownFile));
  check('known-data.js: KNOWN_DATA is an object whose every id is a building (or the parent of a building) of the facade', () => {
    assert(K.KNOWN_DATA && typeof K.KNOWN_DATA === 'object');
    const ids = new Set(N.BUILDINGS.map((b) => b.id)), parents = new Set(N.BUILDINGS.map((b) => b.parent).filter(Boolean)); const odd = Object.keys(K.KNOWN_DATA).filter((id) => !ids.has(id) && !parents.has(id));      // (a part inherits the entry of its parent outline, also when the outline lies outside the facade: strip-data-known keeps it)
    assert(odd.length === 0, odd.length + ' ids are not buildings of the facade, e.g. ' + odd.slice(0, 4));
    const sids = new Set(S.BUILDINGS.map((b) => b.id));
    info('known-data.js: ' + Object.keys(K.KNOWN_DATA).length + ' rows, ' + Object.keys(K.KNOWN_DATA).filter((id) => !sids.has(id)).length + ' of them for buildings the strip does not have');
  });
  const srcKnown = path.join(origDir, '..', 'city', 'known-data.js');
  if (fs.existsSync(srcKnown)) check('known-data.js equals tools/strip-data-known.mjs --check output for this facade', () => {
    const r = spawnSync(process.execPath, [path.join(root, 'tools', 'strip-data-known.mjs'), '--src', srcKnown, '--facade', path.join(dir, 'city.js'), '--out', knownFile, '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, (r.stderr || r.stdout || '').slice(0, 300));
  });
} else info('no ' + path.relative(root, knownFile) + ' yet');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
