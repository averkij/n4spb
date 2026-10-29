// tools/strip-data-clip.mjs - cut the OSM part files of an AREA (the strip: src/world/data/city-*.js; another area: src/areas/<id>/data/city-*.js) down to the union of its EXTENT_RECTS.
//
// The strip (Moscow station -> Nevsky -> Admiralty / Palace Square) is the first 8 rectangles of the original city: its part files were copied whole, and a record belongs to a part
// by its representative point (tools/bake-osm.mjs regionIdx), so lines and polygons still run far outside the strip, and records that START outside it (whole ways kept by their first
// vertex) were lost although they cross into it. This script, run on the part files in place:
//   1. CLIPS every line / polygon record to the UNION of the EXTENT rectangles (osm-lib.mjs clipLineUnion / clipRingUnion, the clip the bake used): a line becomes one record per
//      piece (same id, same fields, new pts), a polygon record keeps its fields and gets the clipped rings (holes go to the piece that contains them), a record with nothing left is
//      dropped. A line / ring that lies inside the union is not touched (the record stays byte-identical). Pieces and clip points are rounded to 0.1 m like the bake does.
//      RIVER and WATER are clipped to the union of the EXTENT rectangles grown by a further WATER_RING (600 m): the far Neva / canal scenery is drawn beyond the extent.
//   2. TREE_ROWS: rows that lie entirely outside are dropped (rows that cross the edge stay whole: trees.js rejects the candidates outside the extent itself, and a cut row would shift
//      the tree spacing). TREES / point records (x, z) outside the union are dropped. TROLLEY / TRAM_ROUTES: lines clipped, stops kept inside the extent, routes with nothing left dropped.
//      SUBWAY_ROUTES, BUS_ROUTES (no geometry) are kept whole (the metro net resolves the stops by name). BUILDINGS: never cut (a building belongs to the extent by its centroid),
//      only the records entirely outside are dropped, with the OVERLAPS that name them.
//   3. --recover <dir>: RECOVERS records of the original city (dir = the src/world/data of the full build, its city.js facade) that are not in the strip files although they cross the
//      strip extent (their first vertex lay in a region that is gone: e.g. the Moika / Swan Canal WATER polygons the bridges look up by id). They are clipped as in 1 and appended to
//      the part of their first vertex (the bake's region rule). BUILDINGS are not recovered. Every recovered record is deterministic, so a second run recovers nothing new.
// Usage: node tools/strip-data-clip.mjs [--recover <orig data dir>] [--in <dir>] [--out <dir>] [--check] [--water-ring 600]
//   --in <dir>    read the part files + the city.js facade from there (default src/world/data)
//   --out <dir>   write the part files there instead of over the inputs
//   --check       write nothing; exit 1 when a part file would change (idempotence test)
// Idempotent: a second run on its own output changes nothing (--check).
//
// LIBRARY (tools/area-data-cut.mjs imports it, so a cut can be computed and printed without writing a file): clipParts(parts, { extRects, waterRing, recover }) clips the parts IN MEMORY
// (parts = [{ file, arrays: Map(name -> records) }]), countLinesOf(parts) and facadeTextOf(facade, parts) produce the facade text, partFileText(lines, arrays) the text of a part file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { clipLineUnion, clipRingUnion, pointInRing, ringArea, round1 } from './osm-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const NOSPLIT = new Set(['SUBWAY_ROUTES', 'TROLLEY', 'TRAM_ROUTES', 'BUS_ROUTES', 'RIVER']);
const WATERISH = new Set(['WATER', 'RIVER']);
const KEEP_WHOLE = new Set(['SUBWAY_ROUTES', 'BUS_ROUTES', 'EXTENT_RECTS']);
/**
 * RECORDS that stay WHOLE (not cut to the union of the extent rectangles) when they touch it: array name -> Set of ids (gdm cluster B, docs/gdm-B.md). A polygon cut by the union becomes one polygon per slab of the
 * union (7 pieces for the cemetery in Dekabristov), and a landmark module that reads polys[0] and INDEXES the vertices of the original ring would see a 14 % piece of it:
 *   GREEN r2736670  the Smolensky Orthodox Cemetery (54 ha): landmarksSmolensky/frame.js cemeteryRing() takes polys[0] and place.js / fence.js classify its edges by index (edges 13 .. 27 = the river, 0 .. 12 = the Maly /
 *                   Beringa fence). In Vasilyevsky the polygon lies inside the union and is never touched; the Dekabristov territory reaches only 85 % of it, so the same record is kept whole there as well (the 15 % beyond the
 *                   extent is scenery that no player reaches; a vertex of the ring outside the extent is allowed for these records, tools/area-data-test.mjs). A record that does not touch the union at all is dropped as before.
 */
export const KEEP_WHOLE_IDS = { GREEN: new Set(['r2736670']) };

export const grow = (r, g) => ({ x0: r.x0 - g, x1: r.x1 + g, z0: r.z0 - g, z1: r.z1 + g });
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const inUnion = (rs, x, z) => rs.some((r) => inRect(r, x, z));

// ---- part file I/O: `export const NAME = JSON.parse("<json string>");` one export per line (tools/bake-osm.mjs j2)
export const EXPORT_RE = /^export const (\w+) = JSON\.parse\((".*")\);$/;
export const j2 = (v) => `JSON.parse(${JSON.stringify(JSON.stringify(v))})`;
/** the text of a part file: the lines of the original with every changed array re-serialised (lines = null: a new file, `header` + one line per array in `names` order) */
export function partFileText(lines, order, arrays, orig = null) {
  const out = lines.slice();
  for (const [name, i] of order) {
    const arr = arrays.get(name);
    if (orig) { const m = EXPORT_RE.exec(orig[i]); if (JSON.stringify(JSON.parse(JSON.parse(m[2]))) === JSON.stringify(arr)) continue; }
    out[i] = `export const ${name} = ${j2(arr)};`;
  }
  return out.join('\n');
}
export function readPart(dataDir, f) {
  const lines = fs.readFileSync(path.join(dataDir, f), 'utf8').split('\n');
  const arrays = new Map(), order = [];
  lines.forEach((ln, i) => { const m = EXPORT_RE.exec(ln); if (m) { arrays.set(m[1], JSON.parse(JSON.parse(m[2]))); order.push([m[1], i]); } });
  return { file: f, lines, arrays, order, size: lines.join('\n').length };
}

// ---- geometry helpers
const unflat = (a) => { const r = []; for (let i = 0; i < a.length; i += 2) r.push([a[i], a[i + 1]]); return r; };
const flatten = (pts) => { const o = []; for (const p of pts) o.push(round1(p[0]), round1(p[1])); return o; };
const same = (a, b) => a.length === b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);
const dedupe = (pts) => pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
const plen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
const MIN_PIECE = 0.05;   // m: a piece that only touches the border

/** pieces of an open polyline (flat) inside the union: [flat] (the very same array when nothing is cut) */
function linePieces(f, rs) {
  const pts = unflat(f), res = clipLineUnion(pts, rs);
  if (res.length === 1 && same(res[0], pts)) return [f];
  const out = [];
  for (let l of res) { l = dedupe(l.map((p) => [round1(p[0]), round1(p[1])])); if (l.length >= 2 && plen(l) >= MIN_PIECE) out.push(flatten(l)); }
  return out;
}
const closeRing = (r) => r.concat([r[0]]);
const ringInside = (closed, rs) => { const res = clipLineUnion(closed, rs); return res.length === 1 && same(res[0], closed); };
function ringPieces(flatRing, rs) {   // clipped closed rings (arrays of [x,z], closed, rounded)
  const out = [];
  for (let o of clipRingUnion(closeRing(unflat(flatRing)), rs)) {
    o = dedupe(o.map((p) => [round1(p[0]), round1(p[1])]));
    if (o.length < 4 || Math.abs(ringArea(o)) < 0.5) continue;
    out.push(o);
  }
  return out;
}
/** polys [{o, h}] clipped like the bake's bakePolys: whole rings stay as they are; null = unchanged */
function polyPieces(polys, rs) {
  let changed = false; const out = [];
  for (const p of polys) {
    const ring = closeRing(unflat(p.o));
    if (ringInside(ring, rs) && p.h.every((h) => ringInside(closeRing(unflat(h)), rs))) { out.push(p); continue; }
    changed = true;
    const pieces = ringPieces(p.o, rs).map((ring) => ({ ring, o: flatten(ring.slice(0, -1)), h: [] }));
    for (const h of p.h) for (const hh of ringPieces(h, rs)) {
      const owner = pieces.length === 1 ? pieces[0] : pieces.find((q) => pointInRing(hh[0], q.ring));
      if (owner) owner.h.push(flatten(hh.slice(0, -1)));
    }
    for (const q of pieces) out.push({ o: q.o, h: q.h });
  }
  return changed ? out : null;
}

const hasLen = (a) => Array.isArray(a) && a.length > 0;
/** clip one record: the list of records that replace it ([] = dropped, [rec] = rec itself when unchanged); rs = the rectangles for this array, ext = the extent rectangles (points) */
function clipRecord(name, rec, rs, ext) {
  if (rec === null || typeof rec !== 'object' || Array.isArray(rec)) return [rec];
  const pts = hasLen(rec.pts), polys = hasLen(rec.polys);
  if (name === 'RIVER') {          // centre lines (list of flat polylines) + bank polygons; either may be empty
    const lines = []; let lc = false;
    for (const l of rec.line || []) { const pcs = linePieces(l, rs); if (!(pcs.length === 1 && pcs[0] === l)) lc = true; lines.push(...pcs); }
    const pp = polyPieces(rec.polys || [], rs);
    if (!lc && !pp) return [rec];
    const polysOut = pp || rec.polys || [];
    return polysOut.length || lines.length ? [{ ...rec, line: lines, polys: polysOut }] : [];
  }
  if (pts && polys) throw new Error(name + ' ' + rec.id + ': both pts and polys');
  if (pts) {
    const pcs = linePieces(rec.pts, rs);
    if (pcs.length === 1 && pcs[0] === rec.pts) return [rec];
    return pcs.map((p) => {
      const q = { ...rec, pts: p };
      if (q.closed === 1) q.closed = 0;               // a ring cut by the border is an open chain
      return q;
    });
  }
  if (polys) {
    const pp = polyPieces(rec.polys, rs);
    if (!pp) return [rec];
    if (pp.length && KEEP_WHOLE_IDS[name] && KEEP_WHOLE_IDS[name].has(rec.id)) return [rec];      // a KEEP_WHOLE_IDS record that touches the union stays as it is (see above)
    return pp.length ? [{ ...rec, polys: pp }] : [];
  }
  if (typeof rec.x === 'number' && typeof rec.z === 'number') return inUnion(ext, rec.x, rec.z) ? [rec] : [];
  return [rec];
}

/**
 * Clip the parts IN MEMORY (see the header). parts = [{ file, arrays: Map(name -> records) }], mutated; extRects = the EXTENT rectangles; waterRing (m) grows them for RIVER / WATER;
 * recover = { O: the full-city facade namespace } or null. Returns { stats: { name -> {before, after, dropped, cut, recovered, droppedIds} } }.
 */
export function clipParts(parts, { extRects, waterRing = 600, recover = null }) {
  const RS_EXT = extRects;
  const RS_WATER = RS_EXT.map((r) => grow(r, waterRing));
  const rsFor = (name) => (WATERISH.has(name) ? RS_WATER : RS_EXT);
  const stats = {};     // name -> {before, after, dropped, cut, recovered}
  const st = (n) => stats[n] || (stats[n] = { before: 0, after: 0, dropped: 0, cut: 0, recovered: 0, droppedIds: [] });
  const droppedBuildings = new Set();
  for (const P of parts) {
    for (const [name, arr] of P.arrays) {
      if (!Array.isArray(arr) || KEEP_WHOLE.has(name)) continue;
      const s = st(name); s.before += arr.length;
      let out;
      if (name === 'TREES') {
        out = []; for (let i = 0; i < arr.length; i += 2) if (inUnion(RS_EXT, arr[i], arr[i + 1])) out.push(arr[i], arr[i + 1]);
        s.before -= arr.length / 2; s.dropped += (arr.length - out.length) / 2; s.after += out.length / 2;   // TREES counted in points: before was already += arr.length
      } else if (name === 'TREE_ROWS') {
        out = arr.filter((r) => unflat(r).some((p) => inUnion(RS_EXT, p[0], p[1])) || clipLineUnion(unflat(r), RS_EXT).length > 0);
        s.dropped += arr.length - out.length; s.after += out.length;
      } else if (name === 'TROLLEY' || name === 'TRAM_ROUTES') {
        out = [];
        for (const r of arr) {
          const lines = []; for (const l of r.lines || []) lines.push(...linePieces(l, RS_EXT));
          const stops = (r.stops || []).filter((q) => inUnion(RS_EXT, q.x, q.z));
          if (!lines.length && !stops.length) { s.dropped++; continue; }
          const n = { ...r, lines, stops }; if (JSON.stringify(n) !== JSON.stringify(r)) s.cut++;
          out.push(n);
        }
        s.after += out.length;
      } else if (name === 'BUILDINGS') {
        out = [];
        for (const b of arr) {
          const live = b.polys.some((p) => ringPieces(p.o, RS_EXT).length > 0);
          if (live) out.push(b); else { s.dropped++; droppedBuildings.add(b.id); s.droppedIds.push(b.id); }
        }
        s.after += out.length;
      } else if (name === 'OVERLAPS') {
        out = arr; s.after += arr.length;                // filtered below, once every part knows its dropped buildings
      } else {
        out = [];
        for (const rec of arr) {
          const r = clipRecord(name, rec, rsFor(name), RS_EXT);
          if (!(r.length === 1 && r[0] === rec)) { if (r.length === 0) s.dropped++; else s.cut++; }
          out.push(...r);
        }
        s.after += out.length;
      }
      P.arrays.set(name, out);
    }
  }
  if (droppedBuildings.size) for (const P of parts) {
    const o = P.arrays.get('OVERLAPS'); if (!o) continue;
    const keep = o.filter((q) => !droppedBuildings.has(q.a) && !droppedBuildings.has(q.b));
    st('OVERLAPS').dropped += o.length - keep.length; st('OVERLAPS').after -= o.length - keep.length;
    P.arrays.set('OVERLAPS', keep);
  }

  // ---- 3. recover the records that start outside the strip but cross it
  if (recover) {
    const O = recover.O;
    const have = new Map();   // name -> Set of JSON of every record now in the strip
    const haveOf = (name) => { let s = have.get(name); if (!s) { s = new Set(); for (const P of parts) for (const r of P.arrays.get(name) || []) s.add(JSON.stringify(r)); have.set(name, s); } return s; };
    const inOld = (x, z) => x >= RS_EXT[0].x0 - 0.3 && x <= RS_EXT[0].x1 + 0.3 && z >= RS_EXT[0].z0 - 0.3 && z <= RS_EXT[0].z1 + 0.3;
    const partIdx = (r) => {        // tools/bake-osm.mjs regionIdx
      const geo = []; if (hasLen(r.pts)) geo.push(r.pts); if (r.polys) for (const p of r.polys) geo.push(p.o);
      for (const f of geo) for (let i = 0; i + 1 < f.length; i += 2) if (inOld(f[i], f[i + 1])) return 0;
      if (!geo.length) return 0;
      const k = RS_EXT.findIndex((q) => inRect(q, geo[0][0], geo[0][1])); return k < 0 ? 0 : k;
    };
    const names = Object.keys(O).filter((k) => Array.isArray(O[k]) && !NOSPLIT.has(k) && !['BUILDINGS', 'OVERLAPS', 'TREES', 'TREE_ROWS', 'EXTENT_RECTS', 'PLAY_RECTS', 'RECT_NAMES', 'REGIONS'].includes(k));
    for (const name of names) {
      const mine = haveOf(name), seen = new Set(); const adds = [];
      for (const rec of O[name]) {
        const key = JSON.stringify(rec); if (mine.has(key)) continue;          // already in the strip (whole)
        if (!(hasLen(rec.pts) || hasLen(rec.polys))) continue;                   // point records are not recovered (none cross)
        const touches = hasLen(rec.pts) ? clipLineUnion(unflat(rec.pts), RS_EXT).some((l) => plen(l) >= MIN_PIECE) : rec.polys.some((p) => ringPieces(p.o, RS_EXT).length > 0);
        if (!touches) continue;
        for (const piece of clipRecord(name, rec, rsFor(name), RS_EXT)) { const pk = JSON.stringify(piece); if (mine.has(pk) || seen.has(pk)) continue; seen.add(pk); adds.push(piece); }
      }
      for (const piece of adds) { const P = parts[partIdx(piece)]; P.arrays.get(name).push(piece); st(name).recovered++; st(name).after++; }
    }
  }
  return { stats };
}

// ---- the city.js facade: its header carries the counts of the area and the rectangle list
const count = (parts, n) => { let c = 0; for (const P of parts) c += (P.arrays.get(n) || []).length; return c; };
const all = (parts, n) => parts.flatMap((P) => P.arrays.get(n) || []);
export function countLinesOf(parts) {
  const B = all(parts, 'BUILDINGS'), c = (n) => count(parts, n);
  return [
    `// Counts: buildings ${B.length} (outlines ${B.filter((b) => !b.part).length}, parts ${B.filter((b) => b.part).length}, hidden outlines ${B.filter((b) => !b.part && b.skip).length}) · roads ${c('ROADS')} (tunnels ${c('TUNNELS')}, steps ${c('STEPS')}) · crossings ${c('CROSSINGS')} (+${c('CROSSING_NODES')} nodes) · areas ${c('AREAS')} · signals ${c('SIGNALS')} · bus stops ${c('BUS_STOPS')} · lamps ${c('LAMPS')} · calming ${c('CALMING')} · doors ${c('DOORS')} · furniture ${c('FURNITURE')}`,
    `// Counts: water ${c('WATER')} (streams ${c('STREAMS')}, river records ${c('RIVER')}) · fountains ${c('FOUNTAINS')} · green ${c('GREEN')} · landuse ${c('LANDUSE')} · pitches ${c('PITCHES')} · parking ${c('PARKING')} · tree rows ${c('TREE_ROWS')} · trees ${all(parts, 'TREES').length / 2} · bridges ${c('BRIDGES')} · walls ${c('WALLS')} · embankments ${c('EMBANKMENTS')} · barriers ${c('BARRIERS')} (+${c('BARRIER_NODES')} nodes) · structures ${c('MANMADE')} · monuments ${c('MONUMENTS')} · pois ${c('POIS')}`,
    `// Counts: rails ${c('RAILS')} · rail nodes ${c('RAIL_NODES')} · platforms ${c('PLATFORMS')} · stations ${c('STATIONS')} · subway ways ${c('SUBWAY')} · subway routes ${c('SUBWAY_ROUTES')} · entrances ${c('ENTRANCES')} · trolleybus routes ${c('TROLLEY')} · tram routes ${c('TRAM_ROUTES')} · bus routes ${c('BUS_ROUTES')} · tramways ${c('TRAMWAYS')} · piers ${c('PIERS')}`,
  ];
}
const STRIP_LINE = '// STRIP: this copy holds only the rectangles listed above (Moscow station - Nevsky Prospekt - Admiralty / Palace Square / Hermitage): every other region part is gone, and tools/strip-data-clip.mjs cut every line / polygon to the UNION of EXTENT_RECTS (RIVER and WATER to that union grown by 600 m, TREE_ROWS / TROLLEY / TRAM_ROUTES to what touches it) and put back the records of the full city that cross it. The Counts lines are those of the strip; the z-fight / height audit lines below describe the whole-city bake.';
/**
 * The facade text with its header refreshed: the three Counts lines of the parts, the rectangle list in the PLAY description ("(NAME {..}; ...; the PLAY export is only"), and, for the strip (a
 * facade that has a `// STRIP:` line), the STRIP line. A facade of another area carries its own `// AREA:` line, which is left alone.
 */
export function facadeTextOf(facade, parts) {
  const countLines = countLinesOf(parts);
  let s = facade;
  const rects = JSON.parse(facade.match(/^export const PLAY_RECTS = (.*);$/m)[1]), names = JSON.parse(facade.match(/^export const RECT_NAMES = (.*);$/m)[1]);
  const list = '(' + rects.map((r, i) => names[i] + ' ' + JSON.stringify(r)).join('; ') + '; the PLAY export is only';
  s = s.replace(new RegExp(`\\(${names[0]} \\{.*?\\}; the PLAY export is only`), () => list);
  const isStrip = facade.split('\n').some((ln) => ln.startsWith('// STRIP:'));
  const out = []; let c = 0;
  for (const ln of s.split('\n')) {
    if (ln.startsWith('// Counts:')) { out.push(countLines[c++] || ln); continue; }
    if (ln.startsWith('// STRIP:')) continue;
    if (ln.startsWith('// SPLIT:') && isStrip) out.push(STRIP_LINE);
    out.push(ln);
  }
  return out.join('\n');
}

// ---- command line
async function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
  const dataDir = path.resolve(arg('--in', path.join(root, 'src', 'world', 'data')));
  const CHECK = argv.includes('--check');
  const outDir = path.resolve(arg('--out', dataDir));   // (--in <dir> reads the parts and the city.js facade from there, default src/world/data)
  const recoverDir = arg('--recover') ? path.resolve(arg('--recover')) : null;
  const WATER_RING = Number(arg('--water-ring', 600));

  const facade = fs.readFileSync(path.join(dataDir, 'city.js'), 'utf8');
  const PART_FILES = [...facade.matchAll(/^import \* as P\d+ from '\.\/(city-[\w-]+\.js)';/gm)].map((m) => m[1]);
  const RS_EXT = JSON.parse(facade.match(/^export const EXTENT_RECTS = (.*);$/m)[1]);
  const parts = PART_FILES.map((f) => readPart(dataDir, f));
  const recover = recoverDir ? { O: await import(pathToFileURL(path.join(recoverDir, 'city.js')).href) } : null;
  const { stats } = clipParts(parts, { extRects: RS_EXT, waterRing: WATER_RING, recover });

  let changedFiles = 0; const sizes = [];
  if (!fs.existsSync(outDir) && !CHECK) fs.mkdirSync(outDir, { recursive: true });
  for (const P of parts) {
    const text = partFileText(P.lines, P.order, P.arrays, P.lines), old = P.lines.join('\n');
    if (text !== old) changedFiles++;
    sizes.push([P.file, Buffer.byteLength(old), Buffer.byteLength(text)]);
    if (!CHECK) fs.writeFileSync(path.join(outDir, P.file), text);
  }
  const ftext = facadeTextOf(facade, parts);
  if (ftext !== facade) changedFiles++;
  sizes.push(['city.js', Buffer.byteLength(facade), Buffer.byteLength(ftext)]);
  if (!CHECK) fs.writeFileSync(path.join(outDir, 'city.js'), ftext);
  const fmt = (n) => String(n).padStart(9);
  console.log('records (before -> after; dropped, cut, recovered)');
  for (const [n, s] of Object.entries(stats).sort()) if (s.dropped || s.cut || s.recovered || s.before !== s.after) console.log(' ', n.padEnd(14), fmt(s.before), '->', fmt(s.after), '  dropped', s.dropped, 'cut', s.cut, 'recovered', s.recovered);
  console.log('files (bytes)');
  for (const [f, a, b] of sizes) console.log(' ', f.padEnd(14), fmt(a), '->', fmt(b));
  console.log('total', sizes.reduce((s, x) => s + x[1], 0), '->', sizes.reduce((s, x) => s + x[2], 0), CHECK ? '(--check: nothing written)' : '(written to ' + outDir + ')');
  if (CHECK && changedFiles) { console.error('--check: ' + changedFiles + ' file(s) would change'); process.exit(1); }
}
if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) await main();
