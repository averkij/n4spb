// Pure geometry shared by ground drawing, placement hooks and area ownership.
import { ISLANDS, PROMENADES } from './waterfront-data.js';
import { WATERFRONT_MAINLAND_BANK } from './waterfront-channels.js';

export const ringPairs = o => Array.from({ length: o.length / 2 }, (_, i) => [o[i * 2], o[i * 2 + 1]]);
export function ringContains(o, x, z) {
  let hit = false;
  for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2)
    if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) hit = !hit;
  return hit;
}
export function ribbonRing(o, width) {
  const pts = ringPairs(o), left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], p = pts[i], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len * width / 2, nz = dx / len * width / 2;
    left.push([p[0] + nx, p[1] + nz]); right.push([p[0] - nx, p[1] - nz]);
  }
  return left.concat(right.reverse());
}
export const islandRing = s => s.banks.flatMap((b, i) => ringPairs(b.pts).slice(i ? 1 : 0)).slice(0, -1);
export const ISLAND_RINGS = ISLANDS.map(islandRing);
export const PROMENADE_WIDTH = 8; // photograph-derived; mapped centrelines, not an OSM measured width
export const PROMENADE_RINGS = PROMENADES.map(r => ribbonRing(r.pts, PROMENADE_WIDTH));
export const ACCESS_RINGS = ISLANDS.map(s => ribbonRing(s.bridge.pts, 3));
// Park and beach polygons stop on opposite sides of the western promenade.
// Fill the mapped interstitial strip as paving, rather than the generic yard
// mix. The short west shoreline follows the post-construction photo inference
// in waterfront-channels.js; the long edges use exact mapped path / sand points.
const beachInner = [[-8969.1,-5601.4],[-8957.7,-5594.6],[-8907.1,-5574.3],[-8861.4,-5562.5],[-8839.5,-5558.9],[-8820.7,-5564.2],[-8800.1,-5566],[-8762.7,-5565.1],[-8730.2,-5563.3],[-8709.5,-5560.5],[-8691.8,-5555.7]];
const path = ringPairs(PROMENADES.find(p => p.id === 'w37898228').pts);
export const MAINLAND_PAVING_RING = [...WATERFRONT_MAINLAND_BANK.slice(1), ...beachInner, ...path.reverse(), [-9065.3,-5740]];
// Exact interstitial dry bank between the sand outline and the gulf's mapped
// retaining bank, including the mainland end of the middle island approach.
// It is narrow curving paving, not a new rectangular terrace over the sea.
export const SEA_BANK_APRON_RING = [
  [-8987,-5568],[-8978.2,-5564.9],[-8961.1,-5555.6],[-8937.5,-5552.3],[-8908.5,-5551.1],[-8889.4,-5544.7],[-8875.5,-5538.5],[-8862.9,-5530.6],[-8855.7,-5522.4],
  [-8853.1,-5505.9],[-8851.4,-5496.4],[-8860,-5502.5],[-8864.2,-5516.6],[-8878,-5530.9],[-8896.9,-5540.6],[-8933.7,-5544.2],[-8952.2,-5547.2],[-8974,-5554],[-8986.7,-5550.2],[-8996.7,-5551.9],
];
export const WATERFRONT_PAVED_RINGS = [...ISLAND_RINGS, ...ACCESS_RINGS, ...PROMENADE_RINGS, MAINLAND_PAVING_RING, SEA_BANK_APRON_RING];
// These are physical, drawn islands and decks. A bank hand-over opens the
// generic city quay; it does not reclassify neighbouring open water as land.
export const WATERFRONT_BANK_RINGS = [...ISLAND_RINGS, ...ACCESS_RINGS].map((ring, i) => ({ id: 'park300-hydraulic-' + i, ring }));
export const WATERFRONT_GROUPS_LIST = [{
  key: 'okrug65-waterfront', name: 'Набережная и гидротехнические острова', nameEn: 'Park 300 waterfront and hydraulic islands',
  ids: ISLANDS.map(s => s.building.id),
  osm: [...ISLANDS.flatMap(s => [...s.banks.map(b => b.id), s.bridge.id]), ...PROMENADES.map(p => p.id)],
  at: [-8849.3, -5388.9],
  note: 'Three 50 m hydraulic islands with low glazed circular pavilions and 3 m access bridges, from OSM and the engineer PGS_16-2024 dossier; clean mapped mainland promenade.',
}];

// A bounded, immutable index for the tuft and tree startup queries. It has no
// renderer imports, per-frame work or whole-district scans.
const cells = new Map(), CELL = 32;
for (const ring of WATERFRONT_PAVED_RINGS) {
  const o = ring.flat(), xs = ring.map(p => p[0]), zs = ring.map(p => p[1]);
  const b = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  for (let x = Math.floor(b[0] / CELL); x <= Math.floor(b[1] / CELL); x++) for (let z = Math.floor(b[2] / CELL); z <= Math.floor(b[3] / CELL); z++) {
    const k = x + ',' + z, a = cells.get(k); if (a) a.push(o); else cells.set(k, [o]);
  }
}
export const inWaterfrontPaving = (x, z) => cells.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL))?.some(o => ringContains(o, x, z)) || false;
