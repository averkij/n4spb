// tools/area-shape.mjs - the play rectangles of an area from its WALKABLE TERRITORY on the draft world map (maps/intro-draft.html, docs/AREAS.md section 12 / 13).
//
// The map holds, for every area (a real municipal district, or a merge of two), `fp`: the outline rings (lon / lat) of its walkable territory = the core plus the overlaps (border streets and one block
// across, shared junctions, bridges). An area of the engine plays in a UNION OF RECTANGLES (src/areas/registry.js `play`; the data cut, the bake, the streamer and inPlay all take rectangles), so the outline is
// rasterised in CELL-metre cells (a cell is in when its centre is inside the rings, even-odd) and the cells are merged into rectangles: runs of a row, then equal runs of neighbouring rows. The result is a
// staircase along the diagonal streets (up to CELL m off the real outline): the border of an area is a street plus a block of overlap, so the step does not show.
//   node tools/area-shape.mjs --k 98                 prints the rectangles (JSON, street frame: metres, x east, z south) and the area
//   node tools/area-shape.mjs --k 98 --js palace     prints them as the `play: [...]` lines of a registry row (names palace: P01, P02 ...)
//   --cell 80    cell size (default 80); --need 4  samples of 9 that must be inside (default 4: a slight outward bias)
//   --water-band 600  keep of the water zones only the cells within 600 m of the land (default off = every water-zone cell; the 'B600' policy of the Gavan / Morskoy / Dekabristov areas: the far Gulf is not territory)
// The WALKABLE TERRITORY is the land outline `fp` PLUS the water zones `wz` of the map (docs/AREAS.md 13.7: every water cell is reachable; --no-water gives the land alone). The map data is read from the embedded JSON of maps/intro-draft.html (the file is committed; maps/intro-draft-src/intro-data.json is git-ignored). The frame is the one of the map and of every area
// (tools/osm-lib.mjs proj: ORIGIN lon 30.351279 lat 59.932421).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { proj } from './osm-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function mapData(file = path.join(root, 'maps', 'intro-draft.html')) {
  const h = fs.readFileSync(file, 'utf8');
  const m = h.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('area-shape: no embedded data in ' + file);
  return JSON.parse(m[1]);
}

const inRing = (x, z, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, zi] = ring[i], [xj, zj] = ring[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

/** rectangles { x0, x1, z0, z1 } (multiples of `cell`) of the walkable territory rings (lon / lat), sorted by z0, x0 */
export function rectsOfRings(rings, cell = 80, need = 4, groups = null, waterBand = 0) {
  // `groups` = [ringsA, ringsB, ...]: a cell is in when it is in ANY group (each group is tested even-odd on its own: land outline, water-zone outline); without it `rings` is the one group
  // `waterBand` (metres, > 0, needs groups = [land rings, water-zone rings]): the territory is the LAND plus only the water-zone cells within `waterBand` m of the land (chamfer distance between cell centres, at most
  // ceil(waterBand / cell) cells, so the edge of a land cell is about waterBand m away); the water of the open Gulf farther out is dropped. Land and water are rasterised each on its own (a cell is in a group when at least
  // `need` of its 9 samples are in that group), then tidied and merged exactly as without the band. 0 = off: the output is then byte for byte the one of the version without this option (tools-only, 2026-10-29).
  const G = (groups || [rings]).map((rs) => rs.map((r) => r.map((p) => proj(p[0], p[1]))));
  const R = G.flat();
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const r of R) for (const [x, z] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const gx0 = Math.floor(x0 / cell), gx1 = Math.ceil(x1 / cell), gz0 = Math.floor(z0 / cell), gz1 = Math.ceil(z1 / cell), W = gx1 - gx0, H = gz1 - gz0;
  const g = new Uint8Array(W * H);
  // a cell is in when at least `need` of 9 sample points (3 x 3 inside the cell) are inside the rings: a little outward bias, so that the staircase never cuts off the street that is the border
  if (waterBand > 0 && G.length === 2) {
    const cls = [new Uint8Array(W * H), new Uint8Array(W * H)]; // land, water zones
    for (let gi = 0; gi < 2; gi++) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let hit = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const x = (gx0 + i + (a + 0.5) / 3) * cell, z = (gz0 + j + (b + 0.5) / 3) * cell; let n = 0; for (const r of G[gi]) if (inRing(x, z, r)) n++; if (n & 1) hit++; } cls[gi][j * W + i] = hit >= need ? 1 : 0; }
    // two-pass chamfer distance (cells; 1 straight, sqrt 2 diagonal) from every land cell
    const R = Math.ceil(waterBand / cell), S2 = Math.SQRT2, dist = new Float32Array(W * H);
    for (let q = 0; q < W * H; q++) dist[q] = cls[0][q] ? 0 : 1e9;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let v = dist[j * W + i]; if (i > 0) v = Math.min(v, dist[j * W + i - 1] + 1); if (j > 0) { v = Math.min(v, dist[(j - 1) * W + i] + 1); if (i > 0) v = Math.min(v, dist[(j - 1) * W + i - 1] + S2); if (i < W - 1) v = Math.min(v, dist[(j - 1) * W + i + 1] + S2); } dist[j * W + i] = v; }
    for (let j = H - 1; j >= 0; j--) for (let i = W - 1; i >= 0; i--) { let v = dist[j * W + i]; if (i < W - 1) v = Math.min(v, dist[j * W + i + 1] + 1); if (j < H - 1) { v = Math.min(v, dist[(j + 1) * W + i] + 1); if (i < W - 1) v = Math.min(v, dist[(j + 1) * W + i + 1] + S2); if (i > 0) v = Math.min(v, dist[(j + 1) * W + i - 1] + S2); } dist[j * W + i] = v; }
    for (let q = 0; q < W * H; q++) g[q] = cls[0][q] || (cls[1][q] && dist[q] <= R) ? 1 : 0;
  } else
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let hit = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const x = (gx0 + i + (a + 0.5) / 3) * cell, z = (gz0 + j + (b + 0.5) / 3) * cell; let any = false; for (const g of G) { let n = 0; for (const r of g) if (inRing(x, z, r)) n++; if (n & 1) { any = true; break; } } if (any) hit++; } g[j * W + i] = hit >= need ? 1 : 0; }
  // tidy the raster (review of the first cut: a one-cell hole across a street was an invisible wall, four cells touching the territory only at a corner were unwalkable islands): fill every empty cell that has
  // at least 3 of its 4 edge neighbours in, repeatedly; then drop every cell that has no edge neighbour in
  const at = (i, j) => (i >= 0 && j >= 0 && i < W && j < H ? g[j * W + i] : 0);
  for (let pass = 0; pass < 4; pass++) { let ch = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!g[j * W + i] && at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1) >= 3) { g[j * W + i] = 1; ch++; } if (!ch) break; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (g[j * W + i] && !(at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1))) g[j * W + i] = 0;
  const out = []; let open = new Map();
  for (let j = 0; j <= H; j++) {
    const runs = [];
    if (j < H) for (let i = 0; i < W;) { if (g[j * W + i]) { let k = i; while (k < W && g[j * W + k]) k++; runs.push([i, k]); i = k; } else i++; }
    const next = new Map();
    for (const [a, b] of runs) { const key = a + ',' + b, o = open.get(key); if (o) { o.j1 = j + 1; next.set(key, o); open.delete(key); } else next.set(key, { a, b, j0: j, j1: j + 1 }); }
    for (const o of open.values()) out.push(o);
    open = next;
  }
  return out.map((o) => ({ x0: (gx0 + o.a) * cell, x1: (gx0 + o.b) * cell, z0: (gz0 + o.j0) * cell, z1: (gz0 + o.j1) * cell })).sort((p, q) => p.z0 - q.z0 || p.x0 - q.x0);
}

export const km2 = (rs) => rs.reduce((s, r) => s + (r.x1 - r.x0) * (r.z1 - r.z0), 0) / 1e6;

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  const argv = process.argv.slice(2), arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
  const k = Number(arg('--k')), cell = Number(arg('--cell', 80)), need = Number(arg('--need', 4)), js = arg('--js'), band = Number(arg('--water-band', 0));
  const area = mapData().areas.find((a) => a.k === k);
  if (!area) { console.error('area-shape: no area with k = ' + k); process.exit(2); }
  const rs = rectsOfRings(area.fp, cell, need, argv.includes('--no-water') ? null : [area.fp, area.wz || []], argv.includes('--no-water') ? 0 : band);
  if (js) {
    const pad = (n) => String(n).padStart(2, '0');
    console.log(rs.map((r, i) => `      { name: '${js.slice(0, 1).toUpperCase()}${pad(i + 1)}', x0: ${r.x0}, x1: ${r.x1}, z0: ${r.z0}, z1: ${r.z1} },`).join('\n'));
  } else console.log(JSON.stringify({ k, ru: area.ru, en: area.en, cell, km2: +km2(rs).toFixed(3), mapKm2: area.fpKm2, rects: rs }, null, 1));
  console.error(`${area.en}: ${rs.length} rectangles, ${km2(rs).toFixed(2)} km2 (map: ${area.fpKm2})`);
}
