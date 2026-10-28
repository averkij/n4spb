// landmarksKirova/dkpave.js - the granite-slab PAVEMENT between the DK front and the pavement of streets (user check 2026-10-09: the strip q -32 .. -42 in front of the palace, 200 m long, was blotchy generic ground
// with grass tufts, no polygon covers it, docs/research/vo-requests-landmarksKirova.md "streets").  A decal (y 0.052, polygon offset) laid along the front line of the palace, clipped at the real asphalt
// (net.cover, road integrity), with the SAME slab painting and world-space uv as streets/walks.js (a copy of the 'pt-slab' painter, tile 2.8 m): where it overlaps the pavement of streets the two are indistinguishable, so no z-fight shows.
// PAVE_FD is the ring in plan coordinates (r, q) of frame FD (frame.js); the same ring in world metres is PAVED_RINGS of groups.js (environment claims: no grass tufts / trunks on it).
import { FD } from './frame.js';
import { fillPolyClipped, coverFn } from './surfaces.js';

const OUT = -42.0;                               // the outer edge: the inner edge of the slab pavement of streets
/** wall line of the front (west to east, as in frame.js FRONT), then the outer edge back (east to west) */
export const PAVE_FD = [
  [-71.2, -32.4], [-6.95, -32.4], [-6.95, -35.5], [10.3, -35.5], [10.3, -32.1], [56.4, -32.1], [56.4, -35.5], [103.5, -35.5], [103.6, -40.0], [121.8, -40.0], [121.8, -35.6], [129.0, -35.6],
  [129.0, OUT], [-71.2, OUT],
];

export function build(K) {
  const { ctx, P, M } = K, cover = coverFn(ctx);
  const ring = PAVE_FD.map(([r, q]) => { const p = FD.W(r, q); return [p.x, p.z]; });
  fillPolyClipped(P, M.dkPave, ring, 0.052, cover, { margin: 0.3, maxEdge: 4, tile: 2.8 });
}
