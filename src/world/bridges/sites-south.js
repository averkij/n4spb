// bridges/sites-south.js - the southern Fontanka crossings, registered from the real OSM decks and bridge road axes (docs/AREAS.md 15.2). Ported from the source project (102_3d_piter 0568f7af, bridges/sites-south.js):
// the source picked the decks of its southern rectangles C1 .. (REGIONS names); here the six decks are NAMED (the OSM relation ids below), and a deck becomes a site only when its centre lies in the data extent of THIS area,
// so every other area (the strip, Palace-Liteyny, Smolninskoye) gets an empty list: PURE DATA over the area's own data facade (no three.js).
//   r3319947 Gorstkin Bridge, r5727608 Krasnoarmeysky Bridge, r5489278 Egyptian Bridge (27.6 m clear width), r5599488 Semenovsky Bridge, r5595205 Leshtukov Bridge, r5586238 Lomonosov Bridge (three arches, 16.1 m).
// Geometry + walk ramps + quay openings use this same frame. Mostotrest bridge references: docs/SOUTH-EXTENSION.md of the source project. No invented streets or city-wide updates.
import { BRIDGES, ROADS, WATER, EXTENT_RECTS } from '../data/city.js';
const WANT = new Set(['r3319947', 'r5727608', 'r5489278', 'r5599488', 'r5595205', 'r5586238']);
const insideRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
function contains(o, x, z) { let yes = false; for (let a = 0, b = o.length - 2; a < o.length; b = a, a += 2) if ((o[a + 1] > z) !== (o[b + 1] > z) && x < (o[b] - o[a]) * (z - o[a + 1]) / (o[b + 1] - o[a + 1]) + o[a]) yes = !yes; return yes; }
function centre(o) { let a = 0, x = 0, z = 0; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const k = o[j] * o[i + 1] - o[i] * o[j + 1]; a += k; x += (o[j] + o[i]) * k; z += (o[j + 1] + o[i + 1]) * k; } return Math.abs(a) > 1e-6 ? [x / (3 * a), z / (3 * a)] : [o[0], o[1]]; }
function waterAt(x, z) { return WATER.find((w) => /^(river|canal)$/.test(w.kind) && w.polys.some((p) => contains(p.o, x, z) && !(p.h || []).some((h) => contains(h, x, z)))); }
const waterways = { 'Фонтанка': 'fontanka', 'Обводный канал': 'neva', 'канал Грибоедова': 'griboedov', 'Канал Грибоедова': 'griboedov', 'Мойка': 'moika' };
const candidates = ROADS.filter((r) => r.bridge && !r.tunnel && !['steps', 'service', 'cycleway'].includes(r.hw));
export const SOUTH_SITES = [];
for (const deck of BRIDGES) {
  if (!WANT.has(deck.id) || !deck.name || !deck.polys?.length) continue;
  const o = deck.polys[0].o, [cx, cz] = centre(o);
  if (!EXTENT_RECTS.some((r) => insideRect(r, cx, cz))) continue;
  const ways = candidates.filter((r) => r.name === deck.name && r.pts.some((v, i) => i % 2 === 0 && Math.hypot(v - cx, r.pts[i + 1] - cz) < 150));
  if (!ways.length) continue;
  const road = ways.find((r) => !['footway', 'path', 'pedestrian'].includes(r.hw)) || ways[0], p = road.pts;
  let dx = p[p.length - 2] - p[0], dz = p[p.length - 1] - p[1]; if (dz < 0) { dx = -dx; dz = -dz; } const length = Math.hypot(dx, dz); if (length < 1) continue;
  const ux = dx / length, uz = dz / length, vx = -uz, vz = ux;
  const cross = []; for (let i = 0; i < o.length; i += 2) cross.push((o[i] - cx) * vx + (o[i + 1] - cz) * vz);
  let v0 = Math.min(...cross), v1 = Math.max(...cross); const foot = ['footway', 'path', 'pedestrian'].includes(road.hw);
  // OSM bridge polygons include flared approach aprons / tower projections. Use documented clear deck widths for these two heritage crossings instead of asphalt-filling their monument projections (Mostotrest dimensions).
  const clearWidth = { r5489278: 27.6, r5586238: 16.1 }[deck.id];
  if (clearWidth) { v0 = -clearWidth / 2; v1 = clearWidth / 2; }
  const water = waterAt(cx, cz); if (!water || !waterways[water.name]) continue;
  const pavement = foot ? 0 : Math.min(3, (v1 - v0) * 0.13);
  SOUTH_SITES.push({ id: 'south-' + deck.id, name: deck.name, nameEn: deck.name, kind: foot ? 'foot' : 'road', style: foot ? 'italyansky' : 'rcarch',
    water: water.id, ww: waterways[water.name], cx, cz, b: Math.atan2(ux, -uz) * 180 / Math.PI, v0, v1,
    zones: foot ? [[v0, v1, 'asphalt']] : [[v0, v0 + pavement, 'pave'], [v0 + pavement, v1 - pavement, 'asphalt'], [v1 - pavement, v1, 'pave']],
    deckW: v1 - v0, gapW: v1 - v0 + 0.6, hump: 0, soffitCrown: -0.55, spring: 1.5, hex: '#394843', at: [cx, cz],
    osm: [deck.id, ...ways.map((r) => r.id)], south: true });
  if (deck.id === 'r5586238') Object.assign(SOUTH_SITES.at(-1), { style: 'stone2', stone: true, spans: [18, 17, 18], pier: 2.2, crowns: [-0.35, -0.5, -0.35] });
}
export const SOUTH_GROUPS = SOUTH_SITES.map((s) => ({ key: s.id, name: s.name, nameEn: s.nameEn, ids: [], osm: s.osm, at: s.at, note: 'OSM deck/road axis, bank-to-bank asphalt, walkable ramps and bounded rails.' }));
