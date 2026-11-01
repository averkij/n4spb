// ============================================================================
//  WORLD LAYOUT CONTRACT - the Nevsky strip of Saint Petersburg (Санкт-Петербург): Moscow Railway Station, Vosstaniya Square, Nevsky Prospekt,
//  Fontanka + Anichkov Bridge, Kazan Cathedral, Palace Square + the Hermitage, the Admiralty and the Senate Square; single source of truth shared by every module.
//  Units: metres. +Y up. +X = east, -Z = north, +Z = south.  Origin = 59.932421 N, 30.351279 E (data/city.js ORIGIN = the `ll` of the user's Yandex URL).
//  Model convention: every model's "front / forward" is its local +Z.
//  rotY follows three.js (rotation.y): rotY=0 faces +Z (south), rotY=PI faces -Z (north), +PI/2 faces +X (east),
//  -PI/2 faces -X (west). Camera yaw (degrees) for shots / player: 0 looks north (-Z), 90 west, 180 south, -90 east.
//  All footprints / roads / water come from OpenStreetMap (data/city.js, baked by tools/bake-osm.mjs; registered to
//  docs/reference/yandex-center.png, see docs/reference/calibration.md: 0.934 m/px).
//
//  ORIGIN is on the Nevsky roadway at Mayakovskogo ul., NOT in the middle of the play area. The Moscow station is ~300 m south-east of Vosstaniya Square's obelisk (592, 165).
//  Always use the exports below, never raw numbers.
//  The map is the strip Moscow station -> Nevsky -> Admiralty (8 play rectangles, data/city.js PLAY_RECTS) plus 120 m of scenery around it; the specialist modules of every other part of the city are not in this repo.
//
//  The city is FLAT (y = 0 = street level). The Fontanka lies in a granite trench: water surface y = RIVER_Y.water (-3.2), river bed RIVER_Y.bed; heightAt() returns the
//  bed inside the river polygon (the quay walls enclose it; water is reachable: a walker steps off an open edge or through a broken fence, a car falls in and drives on the bed, docs/AREAS.md 13.7). Sidewalks are +0.12 m visually only (SURFACE.sidewalk): the player's feet stay at y = 0.
//  UNDERGROUND: the metro lies 51-64 m below the street (docs/UNDERGROUND.md); the ground plane (y = 0) is a drawn mesh with holes over the shafts (GROUND_HOLES).
//  The street grid is not axis aligned: Nevsky runs at bearing ~104 deg (WNW-ESE), Ligovsky / Marata ~17 deg, Liteyny / Vladimirsky ~1.5 deg.
// ============================================================================
import * as CITY from './data/city.js';
const { ORIGIN, EXTENT, PLAY, BUILDINGS, ROADS, AREAS: AREA_DATA, RIVER } = CITY;
const PLAY_RECTS = CITY.PLAY_RECTS || [PLAY], EXTENT_RECTS = CITY.EXTENT_RECTS || [EXTENT];   // an old single-rectangle bake has no rectangle lists
import { SHAFTS, DOORWAYS } from './data/metro.js';
import { WATERWAYS, waterwayAt as _waterwayAt, shoreDistance as _shoreDistance, slopeHeightAt } from './environment/waterways.js';
import * as A from './area.js';        // the strip's tables (the page of another area remaps this URL to its own area module: docs/AREAS.md)
import { HEIGHT_PATCHES } from './lib/area-tables.js';        // the area's terrain patches (the strip's list is empty)
export { ORIGIN, EXTENT, PLAY, PLAY_RECTS, EXTENT_RECTS };

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- names
export const NAMES = A.NAMES;

// ---------------------------------------------------------------- playable bounds
// The play area is a UNION of axis-aligned rectangles (WORLD.rects = PLAY_RECTS: the first build + the western extension, docs/reference/west-frame.md) with empty notches:
// WORLD.play is only its BOUNDING BOX (how big is the world, where to scatter things); to ask "may I stand here" use inPlay(x, z, margin) and clampToPlay(x, z, margin).
export const WORLD = {
  play: { x0: PLAY.x0, x1: PLAY.x1, z0: PLAY.z0, z1: PLAY.z1 },   // bounding box of the play area (do NOT clamp the player to it: use clampToPlay)
  rects: PLAY_RECTS,                                               // the play area = the union of these rectangles { x0, x1, z0, z1 } (first = the old area)
  data: EXTENT,                                                    // bounding box of the OSM data extent (= every play rectangle grown by 120 m of scenery)
  dataRects: EXTENT_RECTS,                                         // the data extent = the union of these rectangles
};
// ---- unions of rectangles (the same tests as tools/osm-lib.mjs: inPlay / inExtent / clampToPlay)
const _inR = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const _bcache = new Map();
function _boundary(rs) {   // boundary segments [ax, az, bx, bz] of the union (edges shared by two rectangles are interior)
  let c = _bcache.get(rs); if (c) return c; c = [];
  const sub = (a, b, cut) => { let rem = [[a, b]]; for (const [c0, c1] of cut) { const nr = []; for (const [s, e] of rem) { if (c1 <= s || c0 >= e) { nr.push([s, e]); continue; } if (c0 > s) nr.push([s, c0]); if (c1 < e) nr.push([c1, e]); } rem = nr; } return rem.filter(([s, e]) => e - s > 1e-9); };
  rs.forEach((r, i) => {
    const o = rs.filter((_, j) => j !== i);
    for (const [s, e] of sub(r.x0, r.x1, o.filter((q) => q.z0 < r.z0 && q.z1 >= r.z0).map((q) => [q.x0, q.x1]))) c.push([s, r.z0, e, r.z0]);
    for (const [s, e] of sub(r.x0, r.x1, o.filter((q) => q.z0 <= r.z1 && q.z1 > r.z1).map((q) => [q.x0, q.x1]))) c.push([s, r.z1, e, r.z1]);
    for (const [s, e] of sub(r.z0, r.z1, o.filter((q) => q.x0 < r.x0 && q.x1 >= r.x0).map((q) => [q.z0, q.z1]))) c.push([r.x0, s, r.x0, e]);
    for (const [s, e] of sub(r.z0, r.z1, o.filter((q) => q.x0 <= r.x1 && q.x1 > r.x1).map((q) => [q.z0, q.z1]))) c.push([r.x1, s, r.x1, e]);
  });
  _bcache.set(rs, c); return c;
}
function _distBoundary(rs, x, z) { let d = Infinity; for (const [ax, az, bx, bz] of _boundary(rs)) { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)) : 0; d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; }
/** (x,z) inside the union of rectangles `rs`, at least m metres from its boundary (m < 0: also up to -m outside). */
function _inUnion(rs, x, z, m = 0) {
  if (m > 0) for (let i = 0; i < rs.length; i++) { const r = rs[i]; if (x >= r.x0 + m && x <= r.x1 - m && z >= r.z0 + m && z <= r.z1 - m) return true; }      // m deep inside one rectangle: at least m from the union boundary (no boundary walk)
  const ins = rs.some((r) => _inR(r, x, z)); if (m === 0) return ins; return m > 0 ? ins && _distBoundary(rs, x, z) >= m : ins || _distBoundary(rs, x, z) <= -m;
}
/** True when (x,z) is inside the play area (the union of WORLD.rects) at least `m` metres from its edge (m = 0: just inside; m < 0: also up to -m outside). */
export const inPlay = (x, z, m = 0) => _inUnion(PLAY_RECTS, x, z, m);
/** True when (x,z) is inside the baked data extent (the union of WORLD.dataRects), at least m metres from its edge. */
export const inExtent = (x, z, m = 0) => _inUnion(EXTENT_RECTS, x, z, m);
/** The nearest point of the play area (inset by m; m < 0 grows it) to (x,z): [x, z]. Used to keep the player / the car inside the map (a slide along the edge, never a stop). */
export function clampToPlay(x, z, m = 0) {
  if (_inUnion(PLAY_RECTS, x, z, m)) return [x, z];
  let best = null, bd = Infinity;
  for (const r of PLAY_RECTS) {
    const a = { x0: r.x0 + m, x1: r.x1 - m, z0: r.z0 + m, z1: r.z1 - m }; if (a.x0 > a.x1 || a.z0 > a.z1) continue;
    const px = Math.min(a.x1, Math.max(a.x0, x)), pz = Math.min(a.z1, Math.max(a.z0, z)), d = Math.hypot(px - x, pz - z);
    if (d < bd) { bd = d; best = [px, pz]; }
  }
  return best || [x, z];
}

// ---------------------------------------------------------------- vertical datums (street level = 0)
export const GROUND_Y = 0;
/** Heights of the drawn surfaces above the ground (metres). Only the ground is physical: roads / sidewalks are drawn, never walk boxes. Granite kerb 0.15, pavement +0.12. */
export const SURFACE = { ground: 0, road: 0.03, sidewalk: 0.12, kerb: 0.15, plinth: 1.0, platform: 1.1 };   // platform = rail platform above the rail head level (decks are walk boxes)
/** The Fontanka: water surface and bed below street level (docs/research/fontanka.md: granite wall ~3.2 m). */
export const RIVER_Y = { water: -3.2, bed: -4.6 };
/** Metro datum (docs/research/metro.md): street level = 0, station platforms at -depth (OSM depth tags: Vosstaniya 58, Mayakovskaya 51, Vladimirskaya 55, Dostoevskaya 64). */
export const METRO_DEPTH = { vosstaniya: -58, mayakovskaya: -51, vladimirskaya: -55, dostoevskaya: -64 };

const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
// ---- water: every waterway of the map (Fontanka, Griboedov Canal, Moika, Winter Canal, Swan Canal, Neva incl. the Neva / Obvodny canal / Monastyrka of the east) lies in a granite trench with its own water level
// (environment/waterways.js: the water polygons of the data stitched across the seams of the part files; WATERWAYS = { water, bed, ... } per key).
/** Water level / bed of every waterway (street level = 0): { key: { water, bed, ... } }. RIVER_Y above is the Fontanka (kept for the old modules). */
export { WATERWAYS };
/** Key of the waterway ('fontanka' | 'griboedov' | 'moika' | 'winter-canal' | 'swan-canal' | 'neva') whose water polygon contains (x,z), or null. */
export const waterwayAt = _waterwayAt;
/** y of the water surface at (x,z) when it lies on a waterway, else null. */
export function waterLevelAt(x, z) { const k = _waterwayAt(x, z); return k ? WATERWAYS[k].water : null; }
/** True when (x,z) lies on the water of a waterway (the trench between the granite quays). Bridges are decks above it (walk boxes), they do not change this. */
export function inRiver(x, z) { return _waterwayAt(x, z) !== null; }
/** Terrain height: 0 (street level) everywhere except the bed of the waterway inside the water polygons; the area's HEIGHT_PATCHES come first (array order, box reject, then at(x, z): the first non-null wins). */
export function heightAt(x, z) {
  for (let i = 0; i < HEIGHT_PATCHES.length; i++) { const p = HEIGHT_PATCHES[i], b = p.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; const h = p.at(x, z); if (h != null) return h; }
  const shore=slopeHeightAt(x,z);if(shore!==null)return shore;
  const k = _waterwayAt(x, z); return k ? WATERWAYS[k].bed : GROUND_Y;
}
export const groundAt = heightAt;
/** Distance (m) from (x,z) to the water of any waterway (0 on it; 1e4 when no bank within ~80 m). Used by core/audio.js for the water ambience. */
export function shoreDist(x, z) { return _shoreDistance(x, z); }

// ---------------------------------------------------------------- the local frames of the grid and of the station
/** Bearing (deg clockwise from north) of Nevsky Prospekt in the screenshot area (docs/reference/DATA-REPORT.md: 103.9). */
export const GRID_DEG = 103.9;
const _gs = Math.sin(GRID_DEG * Math.PI / 180), _gc = Math.cos(GRID_DEG * Math.PI / 180);
export const SQUARE = A.SQUARE;
export const OBELISK = A.OBELISK;
export const STATION = A.STATION;
/** world (x,z) -> Nevsky frame (u, v): u along Nevsky toward the ESE (bearing 103.9), v toward the NNE; origin = SQUARE. */
export function toGrid(x, z, o = SQUARE) { const dx = x - o.x, dz = z - o.z; return { u: dx * _gs - dz * _gc, v: -dx * _gc - dz * _gs }; }
/** Nevsky frame (u, v) -> world {x, z}. */
export function fromGrid(u, v, o = SQUARE) { return { x: o.x + u * _gs - v * _gc, z: o.z - u * _gc - v * _gs }; }
/** rotY of a model whose front (+Z) must face the world direction (dx, dz). */
export const rotYToward = (dx, dz) => Math.atan2(dx, dz);
/** rotY of a model whose front (+Z) faces a compass bearing (deg clockwise from north). */
export const rotYBearing = (deg) => Math.atan2(Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180));
/** Camera yaw (deg, 0 = north, 90 = west) that looks from (x0,z0) toward (x1,z1). */
export const yawToward = (x0, z0, x1, z1) => { const b = Math.atan2(x1 - x0, -(z1 - z0)) * 180 / Math.PI; return ((-b + 540) % 360) - 180; };

// ---------------------------------------------------------------- building records, heights, footprints
const _byId = new Map(BUILDINGS.map((b) => [b.id, b]));
export const buildingById = (id) => _byId.get(id);
/** Default heights (m) by OSM kind when neither `height` nor `building:levels` is mapped. */
export const DEFAULT_H = { garage: 3, garages: 3, kiosk: 3, service: 4, shed: 3, roof: 5, construction: 12, transportation: 6, yes: 21 };
/** Cornice height Hc (m, above the pavement) of an n-storey building by era (docs/research/architecture.md section A): rent house 1860-1914 / Stalin 1930-60 / panel 1970s / modern infill. */
const HC = {
  rent: [0, 5.0, 9.0, 13.5, 17.5, 21.0, 23.5, 25.5, 27],
  stalin: [0, 4.5, 8.5, 12.5, 17.0, 21.5, 25.0, 28.0, 30],
  panel: [0, 3.5, 6.5, 9.5, 12.5, 15.5, 18.5, 21.5, 24],
  modern: [0, 4.0, 7.0, 11.0, 15.0, 19.0, 22.5, 26.0, 30],
};
/** Era class of a record: 'rent' (default, ~85 % of the centre), 'stalin', 'panel', 'modern' - from start_date when mapped. */
export function eraOf(b) {
  const y = parseInt(b.startDate, 10);
  if (y >= 1990) return 'modern';
  if (y >= 1960) return 'panel';
  if (y >= 1930) return 'stalin';
  return 'rent';
}
const _hCache = new WeakMap();
const _levelsHc = (era, n) => { const t = HC[era]; return n <= 8 ? t[Math.max(1, Math.round(n))] : t[8] + (n - 8) * 3.3; };
/** Best known cornice / eave height of a building or part record: mapped height, else levels via the era table, else an inference (small annexes 2 storeys,
 *  narrow streets 4, everything else 5 storeys = 21 m), else the kind default. Roofs (mansards, gables) are drawn on top by the owner of the building. */
export function heightOf(b) {
  let h = _hCache.get(b);
  if (h !== undefined) return h;
  if (b.id === 'r946930') h = 23.8; // Muruzi: five-storey photo-derived cornice, not the low mapped estimate.
  else if (b.hSrc === 'height' && b.h) h = b.h;
  else if (b.levels) h = _levelsHc(eraOf(b), b.levels);
  else if (b.kind && DEFAULT_H[b.kind] !== undefined && b.kind !== 'yes') h = DEFAULT_H[b.kind];
  else if (b.area && b.area < 150) h = HC.rent[2];
  else {
    const near = b.cx !== undefined ? nearestRoad(b.cx, b.cz, { drivable: true, maxDist: 40 }) : null;
    h = near && roadWidth(near.road) < 9 && (near.road.hw === 'residential' || near.road.hw === 'service' || near.road.hw === 'living_street') ? HC.rent[4] : HC.rent[5];
  }
  _hCache.set(b, h);
  return h;
}

const _fpBox = new WeakMap();
const boxOf = (p) => { let b = _fpBox.get(p); if (!b) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); } b = [x0, x1, z0, z1]; _fpBox.set(p, b); } return b; };
// QA fix: the baked duplicate filter sometimes keeps the RAISED part and marks the ground body that carries it `dupOf` (Nevsky 22-24 w535381121, w1331069739, r3300412): city/prep.js draws that body, so it is a ground building here too
const isBaseOfRaised = (b) => (b.minH || 0) < 0.5 && ((_byId.get(b.dupOf) || {}).minH || 0) > 2.5;
let footprints = null;
/** Footprint polygons { o: [x,z,...], h: [[...], ...] } of every building that stands on the ground. The skipped records are outlines
 *  whose parts are listed separately; parts raised above the ground (minH > 3) and underground parts are not ground buildings. */
export function groundFootprints() {
  if (!footprints) footprints = BUILDINGS.filter((b) => !b.skip && (b.minH || 0) <= 3 && !(b.layer < 0) && !b.underground && (!b.dupOf || isBaseOfRaised(b))).flatMap((b) => b.polys);
  return footprints;
}
/** True when (x,z), grown by r metres, lies inside the footprint of a building that stands on the ground (courtyard holes excluded).
 *  The colliders are wall boxes only, so ANYTHING that places the player (views, landing, spawns) must test this. */
export function insideBuilding(x, z, r = 0) {
  const at = (px, pz) => { const c = fpGrid(false).get(cellKey(px, pz)); if (!c) return false; for (const p of c) { const b = boxOf(p); if (px < b[0] || px > b[1] || pz < b[2] || pz > b[3]) continue; if (ringHas(p.o, px, pz) && !p.h.some((h) => ringHas(h, px, pz))) return true; } return false; };
  return at(x, z) || (r > 0 && (at(x + r, z) || at(x - r, z) || at(x, z + r) || at(x, z - r)));
}
// 64 m spatial grids of the footprint boxes (every call used to scan all ~1 700 footprints: ~3 s of the load, the callers are the placement code of every module).
// ground = false: the ground footprints (insideBuilding); true: every (record, polygon) in BUILDINGS order (buildingAt: the first match wins as before).
const FPG = 64, cellKey = (x, z) => Math.floor(x / FPG) * 4096 + Math.floor(z / FPG);
const _fpGrids = [null, null];
function fpGrid(all) {
  const gi = all ? 1 : 0; if (_fpGrids[gi]) return _fpGrids[gi];
  const grid = new Map();
  const add = (p, item) => { const b = boxOf(p); for (let i = Math.floor(b[0] / FPG); i <= Math.floor(b[1] / FPG); i++) for (let j = Math.floor(b[2] / FPG); j <= Math.floor(b[3] / FPG); j++) { const k = i * 4096 + j; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(item); } };
  if (all) { for (const b of BUILDINGS) { if (b.skip || (b.minH || 0) > 3 || b.underground) continue; for (const p of b.polys) add(p, { p, b }); } }
  else for (const p of groundFootprints()) add(p, p);
  return (_fpGrids[gi] = grid);
}
/** The footprint record (outline or part) that contains (x,z), or null. */
export function buildingAt(x, z) {
  const c = fpGrid(true).get(cellKey(x, z)); if (!c) return null;
  for (const { p, b } of c) { const bx = boxOf(p); if (x < bx[0] || x > bx[1] || z < bx[2] || z > bx[3]) continue; if (ringHas(p.o, x, z) && !p.h.some((h) => ringHas(h, x, z))) return b; }
  return null;
}
/** Bounding box { x0, x1, z0, z1, cx, cz } of a list of building records. */
export function boundsOf(list) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const b of list) for (const p of b.polys) { const q = boxOf(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[1]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[3]); }
  return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
}

// ---------------------------------------------------------------- landmark groups: the table is the area module's (src/world/area.js)
// The generic `city` module builds every building that no specialist claims. A specialist MODULE owns a list of named SUB-GROUPS (claims: lib/claims.js).
export const GROUPS = A.GROUPS;
export const MODULE_KEYS = Object.keys(GROUPS);
/** Flat sub-group table { key: { ...subgroup, module } }. */
export const SUBGROUPS = Object.fromEntries(MODULE_KEYS.flatMap((m) => GROUPS[m].map((g) => [g.key, { ...g, module: m }])));

/** Building / part records of a sub-group key ('station') or of every sub-group of a module key ('landmarksA'): outlines + parts. */
export function groupMembers(key) {
  const subs = SUBGROUPS[key] ? [SUBGROUPS[key]] : (GROUPS[key] || []);
  const ids = new Set(subs.flatMap((g) => g.ids));
  return BUILDINGS.filter((b) => ids.has(b.id) || (b.parent && ids.has(b.parent)));
}
/** OSM ids (non-buildings: paving, bridge decks, monuments) claimed by a sub-group / module. */
export const groupOsm = (key) => (SUBGROUPS[key] ? [SUBGROUPS[key]] : (GROUPS[key] || [])).flatMap((g) => g.osm);
const _claim = new Map();      // any claimed id (building, part, monument ...) -> sub-group key
for (const g of Object.values(SUBGROUPS)) {
  for (const id of g.osm) _claim.set(id, g.key);
  for (const id of g.ids) _claim.set(id, g.key);
}
for (const b of BUILDINGS) if (b.parent && _claim.has(b.parent)) _claim.set(b.id, _claim.get(b.parent));
/** Sub-group key that claims this OSM id (or null). */
export const groupOf = (id) => _claim.get(id) || null;
/** Module key ('landmarksB') that claims this OSM id (or null). */
export const claimedBy = (id) => { const g = _claim.get(id); return g ? SUBGROUPS[g].module : null; };
export const isClaimed = (id) => _claim.has(id);
/** Centre / bounds of a sub-group's buildings ({x0,x1,z0,z1,cx,cz}) or null when it has none. */
export function groupBounds(key) { const m = groupMembers(key).filter((b) => !b.skip); return m.length ? boundsOf(m) : null; }

// ---------------------------------------------------------------- roads: simple shared queries (centreline polylines + width)
export const DRIVABLE = new Set(['primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'service']);
export const WALKWAYS = new Set(['footway', 'path', 'steps', 'pedestrian', 'cycleway']);
export const isDrivable = (r) => DRIVABLE.has(r.hw);
/** Width (m) of a road record: the baked `w`, else a default by class. */
export const roadWidth = (r) => r.w ?? ({ primary: 14, primary_link: 8, secondary: 12, secondary_link: 7, tertiary: 9, residential: 7, unclassified: 6, living_street: 5, service: 4, pedestrian: 6, footway: 2.4, path: 1.8, steps: 2.2 }[r.hw] ?? 4);
const RCELL = 32, RKEY = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);      // numeric cell keys (the string keys of before cost more than the distance work)
let _rgrid = null;
function roadGrid() {
  if (_rgrid) return _rgrid;
  const g = new Map(), roads = ROADS.filter((r) => !r.tunnel);
  let n = 0;
  for (const r of roads) {
    const w = roadWidth(r), ri = n++, drv = DRIVABLE.has(r.hw);
    for (let i = 0; i + 3 < r.pts.length; i += 2) {
      const ax = r.pts[i], az = r.pts[i + 1], bx = r.pts[i + 2], bz = r.pts[i + 3], m = w / 2 + 2;
      const c0 = Math.floor((Math.min(ax, bx) - m) / RCELL), c1 = Math.floor((Math.max(ax, bx) + m) / RCELL), d0 = Math.floor((Math.min(az, bz) - m) / RCELL), d1 = Math.floor((Math.max(az, bz) + m) / RCELL);
      const e = { r, i, w, ri, drv, x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };      // the segment box: a cheap rejection before the projection
      for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) { const k = RKEY(cx, cz); let a = g.get(k); if (!a) g.set(k, (a = [])); a.push(e); }
    }
  }
  _rstamp = new Int32Array(n); _rbest = new Array(n).fill(null);
  return (_rgrid = g);
}
let _rstamp = null, _rbest = null, _rseq = 0;      // per-road "seen in this query" stamps instead of a Map per call (the result list keeps the first-found order, then the stable sort by gap, as before)
/** Roads whose EDGE lies within r metres of (x,z) (r = 0: the point is on the road). Returns [{ road, w, dist, gap, x, z, tx, tz }] sorted by `gap`,
 *  dist = distance to the centreline, gap = dist - w/2 (negative inside the carriageway), (x,z) = closest centreline point, (tx,tz) = unit tangent.
 *  opts.drivable: only roads for vehicles (default false = every way, footways included). opts.name: only roads with that name. Tunnels (metro underpasses, building arches) are ignored. */
export function roadsNear(x, z, r = 0, opts = {}) {
  const g = roadGrid(), out = [], stamp = ++_rseq, drivable = !!opts.drivable, name = opts.name;
  const cx0 = Math.floor((x - r - 10) / RCELL), cx1 = Math.floor((x + r + 10) / RCELL), cz0 = Math.floor((z - r - 10) / RCELL), cz1 = Math.floor((z + r + 10) / RCELL);
  for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) {
    const list = g.get(RKEY(cx, cz)); if (!list) continue;
    for (let q = 0; q < list.length; q++) {
      const s = list[q];
      if (drivable && !s.drv) continue;
      if (name !== undefined && s.r.name !== name) continue;
      const reach = r + s.w / 2; if (x < s.x0 - reach || x > s.x1 + reach || z < s.z0 - reach || z > s.z1 + reach) continue;      // farther than r + w/2 from the segment box: gap > r for sure
      const p = s.r.pts, i = s.i, ax = p[i], az = p[i + 1], dx = p[i + 2] - ax, dz = p[i + 3] - az, l2 = dx * dx + dz * dz || 1;
      let t = ((x - ax) * dx + (z - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz), gap = d - s.w / 2;
      if (gap > r) continue;
      const ri = s.ri;
      if (_rstamp[ri] !== stamp) { _rstamp[ri] = stamp; const l = Math.sqrt(l2); out.push((_rbest[ri] = { road: s.r, w: s.w, dist: d, gap, x: px, z: pz, tx: dx / l, tz: dz / l })); }
      else { const b = _rbest[ri]; if (gap < b.gap) { const l = Math.sqrt(l2); b.dist = d; b.gap = gap; b.x = px; b.z = pz; b.tx = dx / l; b.tz = dz / l; } }
    }
  }
  return out.sort((a, b) => a.gap - b.gap);
}
/** The road with the smallest edge gap around (x,z) within maxDist metres of its edge (default 30), or null. opts.drivable / opts.named (only roads that have a name). */
export function nearestRoad(x, z, opts = {}) {
  const list = roadsNear(x, z, opts.maxDist ?? 30, opts);
  return (opts.named ? list.find((h) => h.road.name) : list[0]) || null;
}
/** True when (x,z) is on a carriageway (or within `margin` metres of its edge). Default: vehicle roads only; pass { all: true } to include footways. */
export function isOnRoad(x, z, margin = 0, opts = {}) { return roadsNear(x, z, margin, { drivable: !opts.all }).length > 0; }

// ---------------------------------------------------------------- lighting
// Direction TO the sun: a summer afternoon at 60 N (docs/research/streets.md: ~15:00 the sun stands in the SW-S at ~46 deg; at ~19:10 it lines up with Nevsky). The `look`
// work (sky / time of day) replaces this by a proper table; it is only the initial direction: azimuth ~225 deg (south-west), elevation ~42 deg.
export const SUN_DIR = [-0.473, 0.707, 0.526];   // day preset from the look work: azimuth 222, 45 deg up (~15:20)

// ---------------------------------------------------------------- ground holes (shafts of the metro that open in the street ground plane)
/** Rectangles { x, z, w, d, rotY } in which the street ground plane (y = 0) has NO surface because a metro stair / escalator shaft opens there. The metro module
 *  fills it (data/metro is its own business); the environment module's ground mesh skips these cells. Declared in data/metro.js (SHAFTS, owned by the metro module). */
export const GROUND_HOLES = SHAFTS;
/** Openings through building walls (metro portals): colliders are split around them by lib/massing.js; the facade owner draws an arch / door there. Declared in data/metro.js (metro module). */
export { DOORWAYS };

// ---------------------------------------------------------------- named areas for the HUD location toast (first match wins)
// shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
const _sqArea = AREA_DATA.find((a) => a.id === 'w638352776');
const _sqPolys = _sqArea ? _sqArea.polys.map((p) => p.o) : [];
const _groupPolys = (g, m) => groupMembers(g.key).filter((b) => !b.skip).flatMap((b) => b.polys.map((p) => ({ poly: p.o, margin: m })));
const distToRing = (o, x, z) => { let d = 1e9; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const ax = o[j], az = o[j + 1], dx = o[i] - ax, dz = o[i + 1] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; };
/** Footprint polygons (+ margin) of the non-part buildings whose OSM name / alt_name matches `re`; `fallback` ({ c, r } circle) when none is mapped under that name, else nothing. */
function _named(re, margin, fallback) {
  const out = [];
  for (const b of BUILDINGS) { if (b.part || !((b.name && re.test(b.name)) || (b.tags && b.tags.alt_name && re.test(b.tags.alt_name)))) continue; for (const p of b.polys) out.push({ poly: p.o, margin }); }
  return out.length ? out : fallback ? [fallback] : [];
}
/** Outer rings of the named square / paving polygons (AREAS data: place=square, pedestrian areas) whose name matches `re`. */
const _areaPolys = (re) => AREA_DATA.filter((a) => a.name && re.test(a.name)).flatMap((a) => a.polys.map((p) => p.o));
/** Distance (m) from (x,z) to the water edge of the RIVER records with these keys ('moika', 'griboedov', 'winter-canal', 'neva', ...), 0 on the water. */
function _shoreOf(keys, x, z) {
  let d = 1e4;
  for (const r of RIVER || []) { if (!keys.includes(r.key)) continue; for (const l of r.line || []) for (let i = 0; i + 3 < l.length; i += 2) {
    const ax = l[i], az = l[i + 1], dx = l[i + 2] - ax, dz = l[i + 3] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t) - (r.width || 20) / 2);
  } }
  return Math.max(0, d);
}
// a bridge deck as an area: within w/2 of the segment a-b
const _deck = (name, a, b, w) => ({ name, x0: Math.min(a[0], b[0]) - w, x1: Math.max(a[0], b[0]) + w, z0: Math.min(a[1], b[1]) - w, z1: Math.max(a[1], b[1]) + w,
  test: (x, z) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) <= w / 2; } });
// the entries of the table are the area module's (src/world/area.js makeAreas): they only need these helpers
export const AREAS = A.makeAreas({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist });
/** Name of the area at (x,z) for the HUD toast ('' never: the last entry matches everything). */
export function areaAt(x, z) {
  let near = null;
  for (const a of AREAS) {
    if (a.poly) { if (ringHas(a.poly, x, z) || (a.margin && distToRing(a.poly, x, z) <= a.margin)) return a.name; }
    else if (a.test) { if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1 && a.test(x, z)) return a.name; }
    else if (a.c) { if (Math.hypot(x - a.c[0], z - a.c[1]) <= a.r) return a.name; }
    else if (a.road) { near = near || roadsNear(x, z, 22, { drivable: true }); if (near.some((s) => s.road.name === a.road)) return a.name; }
    else if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) return a.name;
  }
  return NAMES.place;
}

// HERO and VIEWS are tables of the area module (src/world/area.js): the viewpoints keys 1..0 / Shift + 1..9 / Alt + 1..5, the Places list and the start pose
const { HERO: _HERO, VIEWS: _VIEWS } = A.makeViews({ yawToward });
export const HERO = _HERO;
export const VIEWS = _VIEWS;
