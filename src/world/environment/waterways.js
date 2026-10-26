// environment/waterways.js - the geometry of every waterway of the Nevsky strip, derived from the baked OSM water polygons (RIVER records of data/city.js).
// PURE DATA / GEOMETRY (no three.js): layout.js (water levels, inRiver, heightAt, shoreDist) and the environment builders both use it.
//
// Why this exists: the bake splits every water polygon along the borders of the regional part files, so one real river (the Fontanka has 4 pieces, the Griboedov Canal 3, the Neva 3) is stored as several polygons whose seams run along rectangle
// edges (and the clipper left zero-width "bridge" edges along them). Seams and open water-to-water joins (the mouth of the Winter Canal in the Neva, the Moika in the Fontanka) are NOT quay walls. This file
//   * collects the outer rings of each waterway (key of the RIVER record: fontanka, moika, griboedov, winter-canal, swan-canal, neva; holes are ignored: the OSM "holes" of the
//     Neva are the piers of the Palace Bridge, which the bridge owner draws), plus PLUGS (the strip under the Palace Bridge that OSM leaves out of both Neva polygons),
//   * drops every edge that lies on a clip line (the border of an EXTENT rectangle) or that coincides with an edge of another water polygon (an open join),
//   * stitches what is left into BANK CHAINS (polylines, water on the left of travel: landward normal (tz, -tx), landSide -1) = the quay lines; chains of different pieces join,
//   * adds the scenery banks of the Neva upstream (data/east-water.js) beyond the data,
//   * lists the bridge crossings (BRIDGE_ZONES) where the quay has a gap for the bridge,
//   * keeps the per-waterway cross-section parameters (WATERWAYS: water level, bed, wall, coping, parapet kind).
// WHERE A WATERWAY LEAVES THE STRIP (docs/STRIP.md, tools/strip-data-clip.mjs): RIVER / WATER are clipped to the extent grown by DATA_MARGIN (600 m). The cut edge of a CANAL polygon (Fontanka, Moika, Griboedov Canal,
// Swan Canal) is no clip line of the extent, so it is a bank like any other: the reach beyond the extent is walled and ends in a wall across the water (an invented dead end, no open slit; nothing here continues a canal
// by hand). The NEVA is different: its cut edges (the border of the data) are no banks, and the real OSM polygons of the Neva upstream (data/east-water.js) and downstream (neva-downstream.js) continue the water from there
// out to the horizon ring of far.js (FAR_WIN), with a plain granite wall along their shores (farBanks()): the river reaches the horizon on both sides of the strip. The Malaya Neva (neva-malaya.js), which the data of the
// strip does not hold at all, joins the Neva inside the data region: its ring is a third scenery source that is drawn there too (FAR_SOURCES inData), and the mouth edge that it shares with the data polygon of the Neva is an open join.
// The dead-end walls make the two banks of a canal ONE chain: bank.caps lists the arclengths of those walls, so that quay.js can still tell the banks apart (one descent per site and bank). The seam x = -2670 of the removed
// southern rectangles is a clip line too (_clipLines), since the clipped data still holds the Griboedov Canal pieces that meet there.
// Water levels (street = 0): docs/research/west-canals-bridges.md section 2.5 (Fontanka -3.2, Griboedov -2.9, Moika -3.0, Winter Canal -3.1, Neva -3.4).
// THE AREA TABLES (docs/AREAS.md section 3, src/world/area.js WATER): the plugs, the bridge zones and shades, the extra clip lines, the scenery sources an area draws, the centre and the radius of the far
// window, the forced banks, the open mouths, the data records that form a waterway and the grass-slope reaches are the area's, not this file's. An area that leaves one out gets an empty / inert value.
import { RIVER, WATER, EXTENT_RECTS } from '../data/city.js';
import { EAST_WATER, EAST_WATER_BOUNDS } from '../data/east-water.js';
import { WATER as AREA_WATER } from '../lib/area-tables.js';

import { NEVA_DOWNSTREAM } from './neva-downstream.js';
import { NEVA_MALAYA } from './neva-malaya.js';

// ---- the Neva scenery beyond the data. tools/strip-data-clip.mjs clips RIVER / WATER to the extent grown by DATA_MARGIN: the data region is DATA_RECTS. Beyond it the real OSM polygons of the Neva continue the river:
// upstream (north-east) the 'Нева' polygon of data/east-water.js, downstream (west) the ring of the Bolshaya Neva of neva-downstream.js. They are drawn outside DATA_RECTS and inside FAR_WIN, the box round Vosstaniya Square
// that holds the horizon ring of far.js (radius 4.7 .. 5.9 km): what lies beyond it is hidden by the ring and the fog.
export const DATA_MARGIN = 600;
export const DATA_RECTS = EXTENT_RECTS.map((r) => ({ x0: r.x0 - DATA_MARGIN, x1: r.x1 + DATA_MARGIN, z0: r.z0 - DATA_MARGIN, z1: r.z1 + DATA_MARGIN }));
// the centre of the far window: WATER.farCenter of the area (the strip: Vosstaniya Square, layout.SQUARE), else the centre of its EXTENT rectangles; FAR_R: the radius of the far scenery
const _ext = (f, k) => f(...EXTENT_RECTS.map((r) => r[k]));
const FAR_C = AREA_WATER.farCenter || [(_ext(Math.min, 'x0') + _ext(Math.max, 'x1')) / 2, (_ext(Math.min, 'z0') + _ext(Math.max, 'z1')) / 2], FAR_R = AREA_WATER.farRadius;
export const FAR_WIN = { x0: FAR_C[0] - FAR_R, x1: FAR_C[0] + FAR_R, z0: FAR_C[1] - FAR_R, z1: FAR_C[1] + FAR_R };
// the scenery rings that exist; an area draws the ones it names in WATER.farSources (kept in this order)
const FAR_SOURCES = [
  { name: 'neva-up', rings: EAST_WATER.filter((p) => p.name === 'Нева').map((p) => p.o), box: EAST_WATER_BOUNDS },      // box: the clip box of the bake: its edges are no banks
  { name: 'neva-down', rings: [NEVA_DOWNSTREAM], box: null },
  // the Malaya Neva (neva-malaya.js) joins the Neva INSIDE the data region (the mouth edge is the closing edge of the data polygon of the Neva), where no data polygon holds it: `inData` = it is drawn there too (water and
  // shore walls; only clipped to FAR_WIN), and the mouth edge, which both rings share, is an open join (no wall on either side)
  { name: 'neva-malaya', rings: [NEVA_MALAYA], box: null, inData: true },
].filter((s) => AREA_WATER.farSources.includes(s.name));
const keyOf = (r) => r.key || AREA_WATER.keyByName[r.name] || AREA_WATER.riverKeys[r.name] || null;      // (WATER.keyByName / WATER.riverKeys of the area: a keyless RIVER record by its name: the canals of the south-west, the Obvodny canal of Vladimirsky-Ligovka; none in the other areas)

/** Cross-section / look parameters per waterway key. water / bed: y of the surface and of the bed (street level = 0). */
export const WATERWAYS = {
  fontanka: { key: 'fontanka', name: 'Фонтанка', water: -3.2, bed: -4.6, wall: 'fontanka', rail: ['lattice', 'clover', 'bars'], post: 'pyramid', postW: 0.45, postH: 1.0, bay: 3.2, width: 61, shadeH: 3.4 },   // 53.5 m NE of Obukhovsky, 60-62 m from there on (the polygon rules)
  griboedov: { key: 'griboedov', name: 'канал Грибоедова', water: -2.9, bed: -4.3, wall: 'pink', rail: ['bars', 'loops'], post: 'twostep', postW: 0.5, postH: 1.1, bay: 2.7, width: 19, shadeH: 3.0 },
  moika: { key: 'moika', name: 'Мойка', water: -3.0, bed: -4.5, wall: 'pink', rail: ['moika'], post: 'twostep', postW: 0.45, postH: 1.0, bay: 2.4, width: 26, shadeH: 3.1 },
  'winter-canal': { key: 'winter-canal', name: 'Зимняя канавка', water: -3.1, bed: -4.3, wall: 'pink', rail: ['lancet'], post: 'pylon', postW: 0.45, postH: 0.95, bay: 2.3, width: 12.8, shadeH: 3.2 },
  // the Swan Canal is NOT a granite-wall canal: grass slopes down to a low granite banquette (SLOPE_REACHES below; docs/research/mars-bridges-canals.md section 2.1): ball-post rail on the Mars Field
  // (west) side, green trellis on the Summer Garden (east) side; water 10-11 m wide (the data polygon)
  'swan-canal': { key: 'swan-canal', name: 'Лебяжья канавка', water: -2.8, bed: -4.0, wall: 'swan-canal', rail: ['ballpost', 'trellis'], post: 'twostep', postW: 0.45, postH: 1.0, bay: 2.0, width: 10.6, shadeH: 1.2, profile: 'slope' },
  // the restored Voskresensky canal = the moat along the south front of the Engineering (Mikhailovsky) Castle (OSM WATER r15750440): narrow, only ~1.3 m below the street; landmarksCastle draws its bridges and railings
  moat: { key: 'moat', name: 'Воскресенский канал', water: -1.2, bed: -2.4, wall: 'moat', rail: [], post: 'twostep', postW: 0.45, postH: 1.0, bay: 2.4, width: 14, shadeH: 1.3 },
  neva: { key: 'neva', name: 'Нева', water: -3.4, bed: -6.0, wall: 'neva', rail: [], post: 'roll', postW: 0.88, postH: 1.0, bay: 2.2, width: 400, shadeH: 3.5 },
  // the south-west (docs/research/new-holland.md section 3; rows of the source project, used only by an area that names these waterways in WATER.keyByName / dataWater): the Kryukov Canal (Nikolsky / Mariinsky side, to the Moika)
  // and the Admiralty / Novo-Admiralty canals round New Holland; the inner canals of New Holland (East, South, the Kovsh basin) are walls + coping only: the loop railing, its colliders, the pier, the stairs and the footbridges are landmarksNewHolland's
  kryukov: { key: 'kryukov', name: 'Крюков канал', water: -2.9, bed: -4.3, wall: 'kryukov', rail: ['vase'], post: 'twostep', postW: 0.5, postH: 1.1, bay: 2.7, width: 22, shadeH: 3.0 },
  admiralty: { key: 'admiralty', name: 'Адмиралтейский канал', water: -2.8, bed: -4.0, wall: 'admiralty', rail: ['moika'], post: 'moika', postW: 0.45, postH: 1.0, bay: 2.4, width: 10, shadeH: 2.8 },
  'nh-inner': { key: 'nh-inner', name: 'Каналы Новой Голландии', water: -2.8, bed: -4.0, wall: 'admiralty', rail: [], post: 'twostep', postW: 0.5, postH: 1.1, bay: 2.7, width: 11, shadeH: 2.8 },
};
const SEAM_TOL = 0.8;

/** strips that OSM leaves out of the water polygons: the WATER.plugs of the area (the strip: under the Palace Bridge, between the west polygon edge and the east polygon edge of the Neva) */
const PLUGS = AREA_WATER.plugs;

/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). Dimensions: docs/research/west-canals-bridges.md section 4 + the OSM bridge ways. `own`: a bridge
 *  the bridges module draws (the quay leaves the parapet / collider open and publishes the zone); the others get an invisible fallback deck (walk box + parapet boxes). */
export const BRIDGE_ZONES = AREA_WATER.bridgeZones;      // the area's WATER.bridgeZones (src/world/area.js)

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
export const BRIDGE_SHADES = AREA_WATER.bridgeShades;      // the area's WATER.bridgeShades

// ---------------------------------------------------------------- geometry helpers
const ringArea = (o) => { let a = 0; for (let i = 0; i < o.length; i += 2) { const j = (i + 2) % o.length; a += o[i] * o[j + 1] - o[j] * o[i + 1]; } return a / 2; };
const _clipLines = (() => {                                  // axis-parallel lines of the EXTENT rectangle borders
  const set = new Map();
  for (const r of EXTENT_RECTS) { set.set('x' + r.x0, ['x', r.x0]); set.set('x' + r.x1, ['x', r.x1]); set.set('z' + r.z0, ['z', r.z0]); set.set('z' + r.z1, ['z', r.z1]); }
  for (const [axis, v] of AREA_WATER.clipLines) set.set(axis + v, [axis, v]);      // the area's extra clip lines (WATER.clipLines; the strip: the seam x = -2670 of the removed S rectangles of the whole-city project, where the clipped data still holds the Griboedov Canal polygon pieces 5:1 / 5:2 that meet)
  return [...set.values()];
})();
const _dataLines = (() => {                                  // axis-parallel lines of the DATA_RECTS borders
  const set = new Map();
  for (const r of DATA_RECTS) { set.set('x' + r.x0, ['x', r.x0]); set.set('x' + r.x1, ['x', r.x1]); set.set('z' + r.z0, ['z', r.z0]); set.set('z' + r.z1, ['z', r.z1]); }
  return [...set.values()];
})();
/** an edge on the border of the data region: where a Neva polygon of the data is cut, the river goes on as scenery (farBanks / pieces below), so the cut is no wall */
function onDataLine(ax, az, bx, bz) {
  for (const [axis, v] of _dataLines) {
    if (axis === 'x') { if (Math.abs(ax - v) < SEAM_TOL && Math.abs(bx - v) < SEAM_TOL) return true; }
    else if (Math.abs(az - v) < SEAM_TOL && Math.abs(bz - v) < SEAM_TOL) return true;
  }
  return false;
}
/** t-interval of the segment a -> b inside the open rectangle r, or null */
function slabIn(ax, az, bx, bz, r) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, d, lo, hi] of [[ax, dx, r.x0, r.x1], [az, dz, r.z0, r.z1]]) {
    if (Math.abs(d) < 1e-9) { if (p <= lo || p >= hi) return null; continue; }
    let u0 = (lo - p) / d, u1 = (hi - p) / d; if (u0 > u1) { const q = u0; u0 = u1; u1 = q; }
    t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 >= t1) return null;
  }
  return [t0, t1];
}
/** the parts [t0, t1] of the segment a -> b that lie inside FAR_WIN and outside every rectangle of the data region (the scenery banks start exactly where the data banks stop); inData: the data region does not cut (a source that is drawn inside it) */
function farParts(ax, az, bx, bz, inData = false) {
  const w = slabIn(ax, az, bx, bz, FAR_WIN); if (!w) return [];
  let parts = [w];
  for (const r of inData ? [] : DATA_RECTS) {
    const s = slabIn(ax, az, bx, bz, r); if (!s) continue;
    const next = [];
    for (const [t0, t1] of parts) { if (s[1] <= t0 || s[0] >= t1) { next.push([t0, t1]); continue; } if (s[0] > t0) next.push([t0, s[0]]); if (s[1] < t1) next.push([s[1], t1]); }
    parts = next; if (!parts.length) break;
  }
  const l = Math.hypot(bx - ax, bz - az);
  return parts.filter(([t0, t1]) => (t1 - t0) * l > 0.05);
}
/** the ring o (flat) clipped to the rectangle r, Sutherland-Hodgman: exact for a ring that crosses a border twice (the Malaya Neva at the west border of FAR_WIN) */
function clipRingToRect(o, r) {
  let P = []; for (let i = 0; i < o.length; i += 2) P.push([o[i], o[i + 1]]);
  for (const [k, v, keepAbove] of [[0, r.x0, true], [0, r.x1, false], [1, r.z0, true], [1, r.z1, false]]) {
    const Q = [], inside = (p) => (keepAbove ? p[k] >= v : p[k] <= v);
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      if (inside(a)) Q.push(a);
      if (inside(a) !== inside(b)) { const t = (v - a[k]) / (b[k] - a[k]), c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; c[k] = v; Q.push(c); }
    }
    P = Q;
  }
  return P.flat();
}
/** the shore chains of a scenery ring (water on the left of travel): the edges outside the data region (inData: also inside it) and inside the window, not on the clip box of the source and not (inData) on an edge of a data polygon (an open join: isJoin) */
function farChains(o, box, inData = false, isJoin = null) {
  const n = o.length / 2, area = ringArea(o), onBox = (x, z) => box && (x <= box.x0 + 0.5 || x >= box.x1 - 0.5 || z <= box.z0 + 0.5 || z >= box.z1 - 0.5);
  const chains = []; let cur = null;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, ax = o[i * 2], az = o[i * 2 + 1], bx = o[j * 2], bz = o[j * 2 + 1];
    if (Math.hypot(bx - ax, bz - az) < 0.05 || (onBox(ax, az) && onBox(bx, bz)) || (isJoin && isJoin(ax, az, bx, bz))) continue;
    for (const [t0, t1] of farParts(ax, az, bx, bz, inData)) {
      const sx = ax + (bx - ax) * t0, sz = az + (bz - az) * t0, ex = ax + (bx - ax) * t1, ez = az + (bz - az) * t1;
      if (cur && Math.hypot(cur[cur.length - 1][0] - sx, cur[cur.length - 1][1] - sz) < 0.2) cur.push([ex, ez]);
      else { cur = [[sx, sz], [ex, ez]]; chains.push(cur); }
    }
  }
  if (chains.length > 1) { const a = chains[0], b = chains[chains.length - 1]; if (Math.hypot(b[b.length - 1][0] - a[0][0], b[b.length - 1][1] - a[0][1]) < 0.2) { b.push(...a.slice(1)); chains.shift(); } }      // the ring is closed
  return chains.filter((c) => c.length >= 2).map((c) => (area > 0 ? c : c.slice().reverse()));
}
function onClipLine(ax, az, bx, bz) {
  for (const [axis, v] of _clipLines) {
    if (axis === 'x') { if (Math.abs(ax - v) < SEAM_TOL && Math.abs(bx - v) < SEAM_TOL) return true; }
    else if (Math.abs(az - v) < SEAM_TOL && Math.abs(bz - v) < SEAM_TOL) return true;
  }
  return false;
}
const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)); return Math.hypot(ax + dx * t - px, az + dz * t - pz); };
export function pointInFlat(x, z, o) { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; }
const boxOf = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
const chainLen = (pts) => { let l = 0; for (let j = 0; j + 1 < pts.length; j++) l += Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]); return l; };

let _built = null;
function build() {
  const rings = [];                                          // { key, o, id, kind }
  RIVER.forEach((r, ri) => {
    const key = keyOf(r);
    if (!key || !WATERWAYS[key]) return;
    r.polys.forEach((p, pi) => rings.push({ key, o: p.o, id: ri + ':' + pi, kind: 'data' }));
  });
  for (const dw of AREA_WATER.dataWater) WATER.forEach((w) => { if (w.id === dw.id) w.polys.forEach((p, i) => rings.push({ key: dw.key, o: p.o, id: dw.key + i, kind: 'data' })); });      // WATER.dataWater of the area (the strip: the castle moat r15750440, which the data keeps as a plain pond; ids 'moat0', 'moat1' ...)
  PLUGS.forEach((p, i) => rings.push({ key: p.key, o: p.o, id: 'plug' + i, kind: 'plug' }));
  for (const g of rings) { g.area = ringArea(g.o); g.waterLeft = g.area > 0; g.n = g.o.length / 2; g.box = boxOf(g.o); }
  const CELL = 64, grid = new Map(), cellsOf = (ax, az, bx, bz, f) => { for (let i = Math.floor(Math.min(ax, bx) / CELL); i <= Math.floor(Math.max(ax, bx) / CELL); i++) for (let j = Math.floor(Math.min(az, bz) / CELL); j <= Math.floor(Math.max(az, bz) / CELL); j++) f(i * 8192 + j); };
  rings.forEach((g, gi) => { for (let i = 0; i < g.n; i++) { const j = (i + 1) % g.n, ax = g.o[i * 2], az = g.o[i * 2 + 1], bx = g.o[j * 2], bz = g.o[j * 2 + 1]; cellsOf(ax, az, bx, bz, (k) => { let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push([gi, ax, az, bx, bz]); }); } });
  // an edge that lies INSIDE another ring of the same waterway is no bank: the overlap seam of two part polygons (the Griboedov canal at the Pikalov / Krasnogvardeysky bridges: the polygons overlap by 7 m, x -2918 .. -2911,
  // and each end edge would otherwise stand as a transverse quay wall in the water)
  const insideSame = (gi, ax, az, bx, bz) => {
    const g = rings[gi], mx = (ax + bx) / 2, mz = (az + bz) / 2;
    for (let oj = 0; oj < rings.length; oj++) {
      if (oj === gi || rings[oj].key !== g.key) continue;
      if (rings[oj].kind === 'plug' && g.kind !== 'plug' && !wetBothSides(ax, az, bx, bz)) continue;      // (a shore edge at the corner of a plug: see wetBothSides)
      const bb = rings[oj].box; if (mx < bb[0] || mx > bb[1] || mz < bb[2] || mz > bb[3]) continue;
      if (pointInFlat(mx, mz, rings[oj].o) && pointInFlat(ax * 0.8 + bx * 0.2, az * 0.8 + bz * 0.2, rings[oj].o) && pointInFlat(ax * 0.2 + bx * 0.8, az * 0.2 + bz * 0.8, rings[oj].o)) return true;
    }
    return false;
  };
  const coincides = (gi, ax, az, bx, bz) => {                // an edge of another ring runs along this edge (open join of two water bodies)
    let hit = false;
    cellsOf(ax, az, bx, bz, (k) => { if (hit) return; for (const [oj, cx, cz, dx, dz] of grid.get(k) || []) { if (oj === gi) continue; const tol = rings[oj].key === rings[gi].key ? 1.8 : 0.8;       // the part polygons of one waterway meet with up to ~1.6 m of slack (Griboedov canal at the Pikalov bridge)
 if (segDist(ax, az, cx, cz, dx, dz) < tol && segDist(bx, bz, cx, cz, dx, dz) < tol) { if (rings[oj].kind === 'plug' && rings[gi].kind !== 'plug' && !wetBothSides(ax, az, bx, bz)) continue; hit = true; return; } } });
    return hit;
  };
  // FORCED BANK: the 1.2 m corner edge of the Neva polygon at the same spot touches the Bolshaya Neva polygon in one vertex, which the 1.8 m slack rule of same-waterway pieces reads as a join: it is shore
  // (land to the west), and without it the two chains end 1.204 m apart (the stitch limit is 1.2 m)
  const FORCED_BANK = AREA_WATER.forcedBanks;                // WATER.forcedBanks of the area (the strip: [[-2460.8, -1097.5, -2460.7, -1098.7]])
  // OPEN MOUTH: the Moika leaves the Fontanka under the 1st Engineer Bridge, but the Moika polygon ends 1-3 m off the Fontanka edge across its mouth, so the join test above misses it and the Fontanka quay wall
  // closed the arch from the Fontanka side. An edge that lies along one of these segments is water on both sides, no bank.
  const OPEN_MOUTHS = AREA_WATER.openMouths;                 // WATER.openMouths of the area (the strip: [[-744, -1034.5, -757.4, -1054.4]])
  const isOpenMouth = (ax, az, bx, bz) => OPEN_MOUTHS.some((e) => segDist(ax, az, e[0], e[1], e[2], e[3]) < 1.5 && segDist(bx, bz, e[0], e[1], e[2], e[3]) < 1.5);
  function isForcedBank(ax, az, bx, bz) { return FORCED_BANK.some((e) => (Math.hypot(e[0] - ax, e[1] - az) < 0.3 && Math.hypot(e[2] - bx, e[3] - bz) < 0.3) || (Math.hypot(e[0] - bx, e[1] - bz) < 0.3 && Math.hypot(e[2] - ax, e[3] - az) < 0.3)); }
  // A PLUG is a hand-made strip (under the Palace Bridge) whose short end edge lies ON the shore of the Spit: there a data edge that runs along it is a real bank (land on one side), not an open join. Until the
  // Petrograd side bake that shore was far scenery; with the rule "any coinciding edge is a join" the Spit quay had a 20 m hole beside the north head of the Palace Bridge ((-2460.8,-1097.5)..(-2471.7,-1114.1)).
  const wetAt = (x, z) => rings.some((r) => x >= r.box[0] && x <= r.box[1] && z >= r.box[2] && z <= r.box[3] && pointInFlat(x, z, r.o));
  function wetBothSides(ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 1.5, nz = dx / l * 1.5, mx = (ax + bx) / 2, mz = (az + bz) / 2;
    return wetAt(mx + nx, mz + nz) && wetAt(mx - nx, mz - nz);
  }
  // OPEN JOIN with a scenery ring that is drawn inside the data region (FAR_SOURCES inData: the Malaya Neva): an edge of a data polygon of the Neva that coincides with an edge of such a ring is water on both sides, no bank;
  // the same edge of the scenery ring is no bank either (joinsData)
  const joinEdges = [];
  for (const src of FAR_SOURCES) if (src.inData) for (const o of src.rings) for (let i = 0; i < o.length / 2; i++) { const j = (i + 1) % (o.length / 2); joinEdges.push([o[i * 2], o[i * 2 + 1], o[j * 2], o[j * 2 + 1]]); }
  const sameEdge = (ax, az, bx, bz, e) => segDist(ax, az, e[0], e[1], e[2], e[3]) < SEAM_TOL && segDist(bx, bz, e[0], e[1], e[2], e[3]) < SEAM_TOL;
  function onFarJoin(ax, az, bx, bz) { return joinEdges.some((e) => sameEdge(ax, az, bx, bz, e)); }
  function joinsData(ax, az, bx, bz) {
    for (const g of rings) { if (g.key !== 'neva') continue; for (let i = 0; i < g.n; i++) { const j = (i + 1) % g.n; if (sameEdge(ax, az, bx, bz, [g.o[i * 2], g.o[i * 2 + 1], g.o[j * 2], g.o[j * 2 + 1]])) return true; } }
    return false;
  }
  // real edges -> chains with the water on the LEFT of travel (normalised)
  const chains = [];
  for (let gi = 0; gi < rings.length; gi++) {
    const g = rings[gi], { o, n } = g, flags = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; const ax = o[i * 2], az = o[i * 2 + 1], bx = o[j * 2], bz = o[j * 2 + 1]; flags.push(isForcedBank(ax, az, bx, bz) || (Math.hypot(bx - ax, bz - az) > 0.05 && !onClipLine(ax, az, bx, bz) && !(g.key === 'neva' && (onDataLine(ax, az, bx, bz) || onFarJoin(ax, az, bx, bz))) && !coincides(gi, ax, az, bx, bz) && !isOpenMouth(ax, az, bx, bz) && !insideSame(gi, ax, az, bx, bz))); }
    if (flags.every(Boolean)) {
      const pts = []; for (let i = 0; i < n; i++) pts.push([o[i * 2], o[i * 2 + 1]]); pts.push(pts[0]);
      chains.push({ key: g.key, pts: g.waterLeft ? pts : pts.reverse(), closed: true });
      continue;
    }
    if (flags.every((f) => !f)) continue;
    let s = 0; while (flags[(s + n - 1) % n] && flags[s]) s++;
    let cur = null;
    for (let k = 0; k < n; k++) {
      const i = (s + k) % n, j = (i + 1) % n;
      if (flags[i]) { if (!cur) cur = [[o[i * 2], o[i * 2 + 1]]]; cur.push([o[j * 2], o[j * 2 + 1]]); } else if (cur) { chains.push({ key: g.key, pts: g.waterLeft ? cur : cur.reverse(), closed: false }); cur = null; }
    }
    if (cur) chains.push({ key: g.key, pts: g.waterLeft ? cur : cur.reverse(), closed: false });
  }
  // stitch chains of one waterway whose end meets another's start (within 1.2 m)
  const stitched = [], per = {};
  for (const c of chains) (per[c.key] = per[c.key] || []).push(c);
  for (const k of Object.keys(per)) {
    const list = per[k].filter((c) => !c.closed), done = new Set();
    for (const c of per[k]) if (c.closed) stitched.push(c);
    const startAt = (p, skip) => { for (const c of list) if (!done.has(c) && c !== skip && Math.hypot(c.pts[0][0] - p[0], c.pts[0][1] - p[1]) < 1.2) return c; return null; };
    for (const c of list) {
      if (done.has(c)) continue;
      let head = c, guard = 0;
      for (;;) { const e = head.pts[0]; const prev = list.find((q) => q !== head && Math.hypot(q.pts[q.pts.length - 1][0] - e[0], q.pts[q.pts.length - 1][1] - e[1]) < 1.2); if (!prev || prev === c || guard++ > 20) break; head = prev; }
      const pts = []; let cur = head; guard = 0;
      while (cur && !done.has(cur) && guard++ < 24) { done.add(cur); for (let i = pts.length ? 1 : 0; i < cur.pts.length; i++) pts.push(cur.pts[i]); cur = startAt(cur.pts[cur.pts.length - 1], cur); }
      stitched.push({ key: k, pts, closed: pts.length > 3 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1.2 });
    }
  }
  // the Neva scenery beyond the data (FAR_SOURCES): a plain granite wall + parapet along the shores, drawn by quay.js outside the data region (the data banks rule inside it)
  const farBanks = [];
  for (const src of FAR_SOURCES) src.rings.forEach((o, ri) => farChains(o, src.box, !!src.inData, src.inData ? joinsData : null).forEach((P, k) => farBanks.push({ id: src.name + '.' + ri + '.' + k, name: src.name + '.' + ri + '.' + k, key: 'neva', pts: P, closed: false, landSide: -1, len: chainLen(P), w: WATERWAYS.neva, far: true })));
  const banks = [];
  // caps: the arclengths (middle) of the dead-end walls on the border of the data region (the cut edge of a canal polygon, see the header): the bank chain goes on behind one with the OTHER bank of the canal (what the full city holds as two chains)
  const capsOf = (pts) => { const out = []; let s = 0; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (l > 0.05 && onDataLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])) out.push(s + l / 2); s += l; } return out; };
  stitched.filter((c) => c.pts.length >= 2 && chainLen(c.pts) > 2).forEach((c, i) => banks.push({ id: c.key + '#' + i, name: c.key + '#' + i, key: c.key, pts: c.pts, closed: c.closed, landSide: -1, len: chainLen(c.pts), w: WATERWAYS[c.key], caps: c.key === 'neva' ? [] : capsOf(c.pts) }));
  // water pieces: every data ring (outer) + plugs; the real Neva polygons beyond the data (clipped against the extents by the builders)
  const pieces = [];
  for (const g of rings) pieces.push({ id: g.id, key: g.key, o: g.o, kind: g.kind, box: g.box });
  // the Neva scenery: the real OSM polygons beyond the data (river.js waterCuts subtracts the data region and clips the rest to FAR_WIN)
  for (const src of FAR_SOURCES) src.rings.forEach((o, ri) => { const q = src.inData ? clipRingToRect(o, FAR_WIN) : o; pieces.push({ id: src.name + '.' + ri, key: 'neva', o: q, kind: 'far', box: boxOf(q), excludeData: !src.inData }); });      // (inData: drawn inside the data region too, so clipped to the window here, not by river.js)
  return { rings, banks, farBanks, pieces };
}
export function waterGeo() { return _built || (_built = build()); }
/** the bank chains of every waterway (water on the left of travel, landSide = -1 as in river.js: the landward normal is (tz, -tx)) */
export const allBanks = () => waterGeo().banks;
export const banksOf = (key) => waterGeo().banks.filter((b) => b.key === key);
/** all water pieces: data rings, plugs, the Neva scenery polygons: [{ id, key, o (flat ring), kind: data|plug|far, excludeData? (far: only outside DATA_RECTS and inside FAR_WIN) }] */
export const waterPieces = () => waterGeo().pieces;

// ---------------------------------------------------------------- queries used by layout.js (data water only: the area a player can reach)
let _data = null;
/** the pointInFlat test of a ring with its edges bucketed by 16 m bands of z: only the edges whose z range covers the band are visited (the crossing test of pointInFlat is false for
 *  every other edge, so the parity, i.e. the answer, is the one of the full loop; the per-edge expression is the same, with the same operands in the same roles) */
export function ringTester(o, band = 16) {
  let z0 = 1e9, z1 = -1e9; for (let i = 1; i < o.length; i += 2) { z0 = Math.min(z0, o[i]); z1 = Math.max(z1, o[i]); }
  const b0 = Math.floor(z0 / band), nb = Math.floor(z1 / band) - b0 + 1, bands = new Array(nb);
  for (let k = 0; k < nb; k++) bands[k] = [];
  for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) {
    const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1];
    for (let k = Math.floor(Math.min(zi, zj) / band) - b0; k <= Math.floor(Math.max(zi, zj) / band) - b0; k++) bands[k].push(xi, zi, xj, zj);
  }
  return (x, z) => {
    const k = Math.floor(z / band) - b0; if (k < 0 || k >= nb) return false;
    const e = bands[k]; let ins = false;
    for (let q = 0; q < e.length; q += 4) { const xi = e[q], zi = e[q + 1], xj = e[q + 2], zj = e[q + 3]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; }
    return ins;
  };
}
function dataRings() { return _data || (_data = waterGeo().rings.map((g) => ({ key: g.key, o: g.o, box: g.box, test: ringTester(g.o) }))); }
/** waterway key of the water body at (x,z) (data polygons and the bridge plug only) or null */
export function waterwayAt(x, z) {
  const rings = dataRings();
  for (let i = 0; i < rings.length; i++) { const p = rings[i], b = p.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; if (p.test(x, z)) return p.key; }
  return null;
}
let _edges = null;
function edges() {
  if (_edges) return _edges;
  const g = waterGeo(), cell = 128, grid = new Map(), list = [];
  for (const b of g.banks) for (let i = 0; i + 1 < b.pts.length; i++) list.push([b.pts[i][0], b.pts[i][1], b.pts[i + 1][0], b.pts[i + 1][1]]);
  for (const e of g.ownerEdges || []) list.push(e);                        // (a shore drawn by a sight module is a water edge all the same)
  for (const e of list) { const [ax, az, bx, bz] = e; for (let i = Math.floor((Math.min(ax, bx) - 80) / cell); i <= Math.floor((Math.max(ax, bx) + 80) / cell); i++) for (let j = Math.floor((Math.min(az, bz) - 80) / cell); j <= Math.floor((Math.max(az, bz) + 80) / cell); j++) { const k = i * 8192 + j; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(e); } }
  return (_edges = { grid, cell });
}
/** distance (m) from (x,z) to the nearest water edge (0 on the water): the real banks of every waterway (not the seams of the data); 1e4 when nothing within ~80 m */
export function shoreDistance(x, z) {
  if (waterwayAt(x, z) || slopeAt(x, z)) return 0;                        // a grass slope bank counts as water for every "keep away from the water" rule (nobody stands on it)
  const { grid, cell } = edges(), c = grid.get(Math.floor(x / cell) * 8192 + Math.floor(z / cell));
  if (!c) return 1e4;
  let d = 1e4; for (const [ax, az, bx, bz] of c) d = Math.min(d, segDist(x, z, ax, az, bx, bz));
  return d;
}
export function debugBanks() {
  const C = { fontanka: "#c00", moika: "#06c", griboedov: "#090", "winter-canal": "#a0a", "swan-canal": "#c60", neva: "#036" };
  return waterGeo().banks.map((b) => ({ name: b.name + (b.closed ? "c" : ""), pts: b.pts, color: C[b.key] }));
}
void chainLen;
/** the scenery banks of the Neva beyond the data (water on the left of travel, landSide -1): the quay builder draws a plain granite wall + parapet along the parts outside the data region */
export const farBanks = () => waterGeo().farBanks;

// ---------------------------------------------------------------- GRASS-SLOPE BANKS (Swan Canal everywhere, the Moika along the Mikhailovsky Garden): docs/research/mars-bridges-canals.md sections 2.1, 2.2
// A slope bank is NOT a granite wall: a low granite banquette (kerb, `kerb` m above the water) at the water, a grass slope rising to street level over `run` metres, the rail / fence at the top.
// The ground plane must be cut away over the slope (the slope lies BELOW y = 0): slopeQuads() lists the convex ground cuts (river.js waterCuts adds them as kind 'slope'), slopeRuns() the stretches
// of the bank chains (arclength s0..s1) for the quay builder (quay.js sweeps the profile along them), slopeAt() is the point test (shoreDistance counts a slope as water: nothing stands on it).
// A run stops at every bridge zone (the abutments / wings of the bridge module take over: its rectangle |u| <= len / 2 + 14 across the water, |v| <= w / 2 + 1.5 along it).
/** reaches: key of the waterway, test(x, z, nx, nz) on a bank point (landward normal n), run = horizontal length of the slope, kerb = banquette top above the water, lip = step from the banquette to the slope */
export const SLOPE_REACHES = AREA_WATER.slopeReaches;      // the area's WATER.slopeReaches (the strip: the Swan Canal everywhere, the Moika along the Mikhailovsky Garden)
const inZoneGap = (key, x, z, m = 0.06) => {          // the slope stops flush with the deck edge (the abutment face), its cut face rests against it
  for (const zn of BRIDGE_ZONES) {
    if (zn.key !== key) continue;
    const a = zn.axis * Math.PI / 180, ux = Math.sin(a), uz = -Math.cos(a), px = x - zn.c[0], pz = z - zn.c[1], u = px * ux + pz * uz, v = -px * uz + pz * ux;
    if (Math.abs(u) <= zn.len / 2 + 14 && Math.abs(v) <= zn.w / 2 + m) return true;
  }
  return false;
};
let _runs = null;
/** [{ reach, bank, s0, s1, pts (the bank polyline between s0 and s1 incl. the cut ends), fr: [{ x, z, mx, mz, k }] mitre frames of pts (offset point = x + mx * d * k) }] */
export function slopeRuns() {
  if (_runs) return _runs;
  _runs = [];
  for (const reach of SLOPE_REACHES) {
    for (const bank of banksOf(reach.key)) {
      const P = bank.pts, S = [0];
      for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const total = S[S.length - 1];
      let i = 0, cur = null;
      const flush = (s1) => { if (cur !== null && s1 - cur > 3) _runs.push(makeRun(reach, bank, P, S, cur, s1)); cur = null; };
      for (let s = 0; s <= total + 1e-6; s += 0.5) {
        while (i + 2 < S.length && S[i + 1] < s) i++;
        const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = Math.min(1, Math.max(0, (s - S[i]) / ((S[i + 1] - S[i]) || 1)));
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l;
        const ok = reach.test(x, z, nx, nz, bank, s) && !inZoneGap(reach.key, x, z);
        if (ok && cur === null) cur = Math.max(0, s - 0.25);
        else if (!ok && cur !== null) flush(s - 0.25);
      }
      flush(total);
    }
  }
  return _runs;
}
function makeRun(reach, bank, P, S, s0, s1) {
  const at = (s) => { let i = 0; while (i + 2 < S.length && S[i + 1] < s) i++; const t = Math.min(1, Math.max(0, (s - S[i]) / ((S[i + 1] - S[i]) || 1))); return [P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t]; };
  const pts = [at(s0)];
  for (let i = 0; i < P.length; i++) if (S[i] > s0 + 0.3 && S[i] < s1 - 0.3) pts.push([P[i][0], P[i][1]]);
  pts.push(at(s1));
  const seg = [];
  for (let i = 0; i + 1 < pts.length; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz) || 1e-6; seg.push({ tx: dx / l, tz: dz / l, nx: dz / l, nz: -dx / l }); }
  const fr = pts.map((p, i) => {                                   // the same mitre rule as quay.js frames(): landward normal (tz, -tx)
    const a = seg[Math.max(0, i - 1)], b = seg[Math.min(seg.length - 1, i)];
    let mx = a.nx + b.nx, mz = a.nz + b.nz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    return { x: p[0], z: p[1], mx, mz, k: Math.min(2.2, 1 / Math.max(0.35, mx * b.nx + mz * b.nz)) };
  });
  return { reach, bank, s0, s1, pts, fr };
}
let _quads = null, _qgrid = null;
/** the ground cuts of the slopes: flat convex quads [[x,z] x4] (counter-clockwise not guaranteed: river.js orients them) from 0.1 m inside the water edge to run + 0.3 m landward */
export function slopeQuads() {
  if (_quads) return _quads;
  _quads = [];
  for (const r of slopeRuns()) {
    const d0 = -0.1, d1 = r.reach.run + 0.3;
    for (let i = 0; i + 1 < r.fr.length; i++) {
      const a = r.fr[i], b = r.fr[i + 1], q = [[a.x + a.mx * d0 * a.k, a.z + a.mz * d0 * a.k], [b.x + b.mx * d0 * b.k, b.z + b.mz * d0 * b.k], [b.x + b.mx * d1 * b.k, b.z + b.mz * d1 * b.k], [a.x + a.mx * d1 * a.k, a.z + a.mz * d1 * a.k]];
      _quads.push({ reach: r.reach.id, key: r.reach.key, q });
    }
  }
  return _quads;
}
/** true when (x, z) lies on a slope (the strip between the water edge and the slope top): not water (L.inRiver stays false), but nothing may stand or walk there */
export function slopeAt(x, z, grow = 0) {
  const quads = slopeQuads(); if (!quads.length) return false;
  if (!_qgrid) {
    _qgrid = new Map();
    quads.forEach((c, ci) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of c.q) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } c.box = [x0, x1, z0, z1]; for (let i = Math.floor(x0 / 32); i <= Math.floor(x1 / 32); i++) for (let j = Math.floor(z0 / 32); j <= Math.floor(z1 / 32); j++) { const k = i * 8192 + j; let a = _qgrid.get(k); if (!a) _qgrid.set(k, (a = [])); a.push(ci); } });
  }
  const list = _qgrid.get(Math.floor(x / 32) * 8192 + Math.floor(z / 32)); if (!list) return false;
  for (const ci of list) {
    const c = quads[ci], b = c.box; if (x < b[0] - grow || x > b[1] + grow || z < b[2] - grow || z > b[3] + grow) continue;
    let pos = 0, neg = 0;
    for (let e = 0; e < 4; e++) { const p = c.q[e], q = c.q[(e + 1) % 4], cr = (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]); if (cr > -grow) pos++; if (cr < grow) neg++; }
    if (pos === 4 || neg === 4) return true;
  }
  return false;
}
/** the slope strips as closed flat rings [x, z, x, z, ...] (water edge -> slope top + 0.3 m), one per run: other modules treat them like water polygons when they clip surfaces (streets/bld.js grid() stops the
 *  pavement strips 0.45 m before a river ring: add these rings to the RIVER rings there, so a pavement never floats over a slope) */
export function slopeRings() {
  return slopeRuns().map((r) => {
    const left = r.fr.map((q) => [q.x, q.z]), right = r.fr.map((q) => [q.x + q.mx * (r.reach.run + 0.3) * q.k, q.z + q.mz * (r.reach.run + 0.3) * q.k]).reverse();
    return [...left, ...right].flat();
  });
}
