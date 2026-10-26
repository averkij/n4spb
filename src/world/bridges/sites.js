// bridges/sites.js - PURE DATA (no imports): where every bridge of the west stands, its local frame, deck width and deck surface zones.  Other modules (environment quay / water, streets,
// traffic) may import it to open the quay railing / colliders where a deck crosses the water: `import { SITES, deckOf, inDeck } from '../bridges/sites.js'`.
//
// FRAME of a site: origin (cx, cz) = the middle of the deck above the canal centre line; +u along the road axis (compass bearing `b`: u = (sin b, -cos b) in the world x / z), +v across it
// = (-uz, ux) (a quarter turn clockwise seen from above, i.e. v points to the right of the travel direction when z is south), +y up.  World = (cx + u cosT - v sinT, cz + u sinT + v cosT)
// with T = b - 90 deg.  The canal runs roughly along v, the road along u: the deck is the rectangle |v| in [v0, v1] x (bank to bank + EXT).  v0 / v1 are the two FACES of the bridge
// (the planes where the arch fascia / parapet / railing stand, seen from the water); their distance is the "width" of the bridge in the sources (Green 38.7 m, Pevchesky 72.2 m,
// Blue 97.3 m ...).  `zones` = [v from, v to, kind] bands of the deck surface (asphalt roadway, granite pavement, sett paving, plaza).  Sources: docs/research/west-canals-bridges.md
// section 4 (cards), OSM bridge ways (tools: scratchpad br_frames.mjs) and relation r-boxes; heights: street level y = 0, water y per waterway (WATER_Y).
import { SW_SITES } from './sites-sw.js';
import { SOUTH_SITES } from './sites-south.js';      // computed from the facade (the Fontanka south of the Anichkov Bridge, the Obvodny canal); an area builds the ones it lists in GROUPS.bridges
import { PAL_SITES } from './sites-pal.js';      // the Prachechny, Upper Swan and 2nd Engineer bridges of Palace-Liteyny (docs/AREAS.md 15.z): built where the area lists them in GROUPS.bridges
import { BLAG_ZONE } from './sites-vo.js';      // the quay-zone record of the Blagoveshchensky Bridge (kind 'zone': no geometry of its own; siteInArea drops it for every area that does not list the bridge)
import { BRIDGE_GROUP_KEYS } from '../lib/area-tables.js';       // pure data too (the area module's tables)
import { EXTENT_RECTS } from '../data/city.js';
export const EXT = 0.8;                                   // the deck runs this far over the land beyond the bank line (no sliver of water at the corners; the street asphalt ends at the bank, a small overlap)
/** water surface level per waterway key (dossier section 2.5; environment may publish its own: see bridges.js) */
export const WATER_Y = { griboedov: -2.9, moika: -3.0, 'winter-canal': -3.1, neva: -3.4, fontanka: -3.2, 'swan-canal': -2.8, kryukov: -2.9, admiralty: -2.8, moat: -1.2 };

const BASE_SITES = [
  { id: 'belinsky', name: 'Мост Белинского', nameEn: 'Belinsky Bridge', kind: 'road', style: 'belinsky', water: 'r1201709', ww: 'fontanka',
    cx: -452.0, cz: -628.35, b: 78.3, v0: -9.53, v1: 9.53,
    zones: [[-9.53, -6.9, 'pave'], [-6.9, 6.9, 'asphalt'], [6.9, 9.53, 'pave']],
    hump: 0.16, soffitCrown: -0.65, spring: 0.25, at: [-452, -628] },
  { id: 'kazansky', name: 'Казанский мост', nameEn: 'Kazansky Bridge', kind: 'road', style: 'stone', water: 'r3298111', ww: 'griboedov',
    cx: -1391.1, cz: -331.3, b: 103.6, v0: -22.3, v1: 22.3,
    zones: [[-22.3, -8.7, 'pave'], [-8.7, 18.5, 'asphalt'], [18.5, 22.3, 'pave']],
    crown: 0.0, hump: 0.0, soffitCrown: -0.55, spring: 0.35, at: [-1391, -331] },
  { id: 'green', name: 'Зелёный мост', nameEn: 'Green Bridge', kind: 'road', style: 'green', water: 'r1201708', ww: 'moika',
    cx: -1767.6, cz: -420.2, b: 100.6, v0: -18.4, v1: 20.2,
    zones: [[-18.4, -14.2, 'pave'], [-14.2, 16.0, 'asphalt'], [16.0, 20.2, 'pave']],
    hump: 0.35, soffitCrown: -0.35, spring: 0.55, at: [-1768, -420] },
  { id: 'pevchesky', name: 'Певческий мост', nameEn: 'Pevchesky Bridge', kind: 'road', style: 'pevchesky', water: 'r1201708', ww: 'moika',
    cx: -1780.9, cz: -848.2, b: 273.8, v0: -39.2, v1: 33.0,
    zones: [[-39.2, -36.0, 'pave'], [-36.0, -19.6, 'sett'], [-19.6, -15.6, 'asphalt'], [-15.6, 21.6, 'sett'], [21.6, 25.4, 'asphalt'], [25.4, 29.6, 'sett'], [29.6, 33.0, 'pave']],
    hump: 0.2, soffitCrown: -0.45, spring: 0.5, at: [-1781, -845] },
  { id: 'red', name: 'Красный мост', nameEn: 'Red Bridge', kind: 'road', style: 'red', water: 'r1201708', ww: 'moika',
    cx: -2011.1, cz: -62.8, b: 322.8, v0: -8.4, v1: 8.4,
    zones: [[-8.4, -5.2, 'pave'], [-5.2, 5.2, 'asphalt'], [5.2, 8.4, 'pave']],
    hump: 0.55, soffitCrown: -0.1, spring: 0.6, at: [-2011, -63] },
  { id: 'blue', name: 'Синий мост', nameEn: 'Blue Bridge', kind: 'road', style: 'blue', water: 'r1201708', ww: 'moika',
    cx: -2369.8, cz: 84.3, b: 154.2, v0: -48.6, v1: 48.6,
    zones: [[-48.6, -47.0, 'pave'], [-47.0, -39.5, 'asphalt'], [-39.5, -34.0, 'pave'], [-34.0, 31.0, 'plaza'], [31.0, 42.8, 'asphalt'], [42.8, 48.6, 'pave']],
    hump: 0.45, soffitCrown: -0.3, spring: 0.5, at: [-2370, 84] },
  { id: 'novo', name: 'Ново-Конюшенный мост', nameEn: 'Novo-Konyushenny Bridge', kind: 'road', style: 'novo', water: 'r3298111', ww: 'griboedov',
    cx: -1273.5, cz: -920.3, b: 281.0, v0: -18.0, v1: 18.0,
    zones: [[-18.0, -14.5, 'pave'], [-14.5, 14.5, 'asphalt'], [14.5, 18.0, 'pave']],
    hump: 0.15, soffitCrown: -0.5, spring: 0.5, at: [-1273, -921] },
  { id: 'hermitage', name: 'Эрмитажный мост', nameEn: 'Hermitage Bridge', kind: 'road', style: 'stone2', water: 'r3289867', ww: 'winter-canal',
    cx: -1919.0, cz: -1136.7, b: 234.0, v0: -8.25, v1: 8.25,
    zones: [[-8.25, -4.6, 'pave'], [-4.6, 4.6, 'asphalt'], [4.6, 8.25, 'pave']],
    hump: 0.25, soffitCrown: -0.3, spring: 0.2, clear: '2.5', at: [-1919, -1137] },
  { id: 'zimny1', name: '1-й Зимний мост', nameEn: '1st Winter Bridge', kind: 'road', style: 'stone2', water: 'r3289867', ww: 'winter-canal',
    cx: -1822.0, cz: -1008.2, b: 49.4, v0: -10.75, v1: 10.75,
    zones: [[-10.75, -7.2, 'pave'], [-7.2, 7.2, 'asphalt'], [7.2, 10.75, 'pave']],
    hump: 0.3, soffitCrown: -0.2, spring: 0.2, at: [-1822, -1008] },
  { id: 'zimny2', name: '2-й Зимний мост', nameEn: '2nd Winter Bridge', kind: 'road', style: 'stone2', water: 'r3289867', ww: 'winter-canal',
    cx: -1774.9, cz: -945.0, b: 206.2, v0: -5.25, v1: 5.25,
    zones: [[-5.25, -3.4, 'pave'], [-3.4, 3.4, 'asphalt'], [3.4, 5.25, 'pave']],
    hump: 0.25, soffitCrown: -0.3, spring: 0.2, clear: '2.5', at: [-1775, -945] },
  // ---- the Mars Field / Summer Garden reach (docs/research/mars-bridges-canals.md sections 4 and 7).  Extra fields: stone (granite arch generator), bank (fixed bank interval), spans / crowns / pier
  // (three-span arch), trams (v of the two tram tracks), pole (tripod name pole text), ped (a pedestrian deck: closed to cars), clear (board).
  { id: 'swan-lower', name: 'Нижний Лебяжий мост', nameEn: 'Lower Swan Bridge', kind: 'road', style: 'swan-lower', stone: true, water: 'r2653741', ww: 'swan-canal',
    cx: -857.7, cz: -1004.3, b: 67, v0: -10.5, v1: 10.5, bank: [-5.2, 5.5],
    zones: [[-10.5, -7, 'pave'], [-7, 7, 'asphalt'], [7, 10.5, 'pave']],
    hump: 0.5, soffitCrown: -0.3, spring: 0.3, at: [-858, -1004] },
  { id: 'panteleymonovsky', name: 'Пантелеймоновский мост', nameEn: 'Panteleymonovsky Bridge', kind: 'road', style: 'pantel', water: 'r1201709', ww: 'fontanka',
    cx: -725.2, cz: -1082.8, b: 76.5, v0: -11.7, v1: 11.7, pole: 'Пантелеймоновский мост',
    zones: [[-11.7, -8, 'pave'], [-8, 8, 'asphalt'], [8, 11.7, 'pave']],
    hump: 0.45, soffitCrown: -0.35, spring: 0.2, at: [-725, -1083] },
  { id: 'eng1', name: '1-й Инженерный мост', nameEn: '1st Engineer Bridge', kind: 'road', style: 'eng1', water: 'r1201708', ww: 'moika',
    cx: -754.7, cz: -1042.0, b: 326, v0: -5, v1: 5, bank: [-12.1, 12.2],
    zones: [[-5, -3.4, 'pave'], [-3.4, 3.4, 'asphalt'], [3.4, 5, 'pave']],
    hump: 0.3, soffitCrown: -0.5, spring: 0.5, clear: '2.6', at: [-755, -1042] },
  { id: 'garden1', name: '1-й Садовый мост', nameEn: '1st Sadovy Bridge', kind: 'road', style: 'garden1', water: 'r1201708', ww: 'moika',
    cx: -886.4, cz: -962.9, b: 342, v0: -10.5, v1: 10.5, trams: [-1.6, 1.8], pole: 'Садовый мост 1',
    zones: [[-10.5, -8, 'pave'], [-8, 8, 'asphalt'], [8, 10.5, 'pave']],
    hump: 0.35, soffitCrown: -0.4, spring: 0.4, clear: '2.5', at: [-886, -963] },
  { id: 'garden2', name: '2-й Садовый мост', nameEn: '2nd Sadovy Bridge', kind: 'road', style: 'garden2', water: 'r1201708', ww: 'moika',
    cx: -1178.9, cz: -1010.1, b: 192, v0: -10.3, v1: 10.3,
    zones: [[-10.3, -8, 'pave'], [-8, 8, 'asphalt'], [8, 10.3, 'pave']],
    hump: 0.15, soffitCrown: -0.7, spring: 0.8, at: [-1179, -1010] },
  { id: 'bolsh-konyushenny', name: 'Большой Конюшенный мост', nameEn: 'Bolshoy Konyushenny Bridge', kind: 'road', style: 'konyush', water: 'r1201708', ww: 'moika',
    cx: -1574.9, cz: -1072.4, b: 326, v0: -5.8, v1: 5.8,
    zones: [[-5.8, -4, 'pave'], [-4, 4, 'asphalt'], [4, 5.8, 'pave']],
    hump: 0.45, soffitCrown: -0.45, spring: 0.4, at: [-1575, -1072] },
  // the Triple Bridge (Тройной мост): Teatralny over the Griboyedov Canal mouth + Malo-Konyushenny over the Moika; sett decks closed to cars since 2001 = a pedestrian deck (zone 'sett')
  { id: 'teatralny', name: 'Театральный мост', nameEn: 'Teatralny Bridge (Triple)', kind: 'road', style: 'aegis', ped: true, water: 'r3298111', ww: 'griboedov', pole: 'Театральный мост',
    cx: -1253.3, cz: -1018.1, b: 115.5, v0: -7.8, v1: 7.8,
    zones: [[-7.8, -7.3, 'pave'], [-7.3, 7.3, 'sett'], [7.3, 7.8, 'pave']],
    hump: 0.3, soffitCrown: -0.4, spring: 0.4, at: [-1253, -1018] },
  { id: 'malo-konyushenny', name: 'Мало-Конюшенный мост', nameEn: 'Malo-Konyushenny Bridge (Triple)', kind: 'road', style: 'aegis', ped: true, water: 'r1201708', ww: 'moika',
    cx: -1249.8, cz: -1036.4, b: 11, v0: -7.8, v1: 7.8, bank: [-10, 12.2],
    zones: [[-7.8, -7.3, 'pave'], [-7.3, 7.3, 'sett'], [7.3, 7.8, 'pave']],
    hump: 0.3, soffitCrown: -0.4, spring: 0.4, at: [-1250, -1036] },
  { id: 'bankovsky', name: 'Банковский мост', nameEn: 'Bankovsky Bridge (griffins)', kind: 'foot', style: 'bankovsky', water: 'r3298111', ww: 'griboedov',
    cx: -1473.6, cz: 26.5, b: 138.9, v0: -0.95, v1: 0.95, deckW: 1.83,
    zones: [[-0.95, 0.95, 'plank']], hump: 0.0, at: [-1474, 27] },
  { id: 'mucny', name: 'Мучной мост', nameEn: 'Mucny Bridge', kind: 'foot', style: 'mucny', water: 'r3298111', ww: 'griboedov',
    cx: -1691.0, cz: 153.8, b: 149.5, v0: -1.15, v1: 1.15, deckW: 2.3,
    zones: [[-1.15, 1.15, 'plank']], hump: 0.9, at: [-1691, 154] },
  { id: 'italyansky', name: 'Итальянский мост', nameEn: 'Italyansky Bridge', kind: 'foot', style: 'italyansky', water: 'r3298111', ww: 'griboedov',
    cx: -1350.2, cz: -539.8, b: 101.4, v0: -1.5, v1: 1.5, deckW: 3.0,
    zones: [[-1.5, 1.5, 'asphalt']], hump: 0.15, at: [-1350, -540] },
];

/** every bridge site there is: the west + the Mars Field reach (this file) + the three south-west bridges (sites-sw.js: Kamenny, Pochtamtsky, Fonarny); in the strip every centre lies in the data extent (tools/bridges-sites-check.mjs) */
export const ALL_SITES = [...BASE_SITES, ...SW_SITES, ...SOUTH_SITES.filter((s) => BRIDGE_GROUP_KEYS.has(s.id)), ...PAL_SITES.filter((s) => BRIDGE_GROUP_KEYS.has(s.id)), BLAG_ZONE];      // (the south sites only where the area claims them by id: the facades of the other areas hold such decks in their margin, or decks that a BASE site already draws)
/** THE predicate of the area: a site belongs to the area when its id is a sub-group of the area's GROUPS.bridges (the area claims its OSM ways) or its centre lies in the data extent of the area. The strip lists every site
 *  in GROUPS.bridges, so all of them stay; a smaller area (Palace-Liteyny) keeps the ones in its data and does not build, open the quay for or walk over the rest. */
export const siteInArea = (s) => BRIDGE_GROUP_KEYS.has(s.id) || EXTENT_RECTS.some((r) => s.cx >= r.x0 && s.cx <= r.x1 && s.cz >= r.z0 && s.cz <= r.z1);
/** the bridge sites of THIS area: every consumer (bridges.js, streets/decks.js, environment/river.js, props/world.js, people/nav.js, people/west.js) reads this list, never ALL_SITES */
export const SITES = ALL_SITES.filter(siteInArea);
export const siteById = (id) => SITES.find((s) => s.id === id) || null;
const rad = (d) => d * Math.PI / 180;
/** the frame constants of a site: { cx, cz, T (rad), c, s } */
export function frameOf(s) {
  // memoised per site record (toUV runs ~10^6 times at start-up: nav heights, lamps, parking, props): the frame of a record never changes
  const f = s.__frame; if (f && f.b === s.b && f.cx === s.cx && f.cz === s.cz) return f;
  const T = rad(s.b - 90); return (s.__frame = { cx: s.cx, cz: s.cz, T, c: Math.cos(T), s: Math.sin(T), b: s.b });
}
/** world AABB [x0, z0, x1, z1] of the local rectangle u0..u1 x v0..v1 of a site, grown by m metres (a cheap prefilter before deckAt) */
export function frameBounds(s, u0, u1, v0, v1, m = 1) {
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) { const w = toWorld(s, u, v); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); z0 = Math.min(z0, w.z); z1 = Math.max(z1, w.z); }
  return [x0 - m, z0 - m, x1 + m, z1 + m];
}
/** local (u, v) -> world { x, z } */
export function toWorld(s, u, v) { const f = frameOf(s); return { x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c }; }
/** world (x, z) -> local { u, v } */
export function toUV(s, x, z) { const f = frameOf(s); const dx = x - f.cx, dz = z - f.cz; return { u: dx * f.c + dz * f.s, v: -dx * f.s + dz * f.c }; }
/** the deck rectangle of a site as a world ring [x0, z0, x1, z1, ...] (u within +-halfU, default 30 m; v from face to face) */
export function deckOf(s, halfU = 30, grow = 0) {
  const pts = [[-halfU, s.v0 - grow], [halfU, s.v0 - grow], [halfU, s.v1 + grow], [-halfU, s.v1 + grow]];
  return pts.flatMap(([u, v]) => { const w = toWorld(s, u, v); return [w.x, w.z]; });
}
/** true when the world point lies on the deck rectangle of a site (|u| <= halfU, v between the faces, grown by `grow` metres) */
export function inDeck(s, x, z, halfU = 30, grow = 0) { const q = toUV(s, x, z); return Math.abs(q.u) <= halfU + grow && q.v >= s.v0 - grow && q.v <= s.v1 + grow; }
