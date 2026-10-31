// landmarksZhdanovka/frame.js - footprints and edge frames of the four houses of the Zhdanovskaya embankment (the Petrograd-side bank of the Zhdanovka, opposite the Petrovsky stadium).
// Positions are read at build time from the baked OSM data (src/world/data/city-p2.js, regions P2): w55413101 No. 3 (6 levels, 6 parts), w55440261 No. 7 (4 levels), w55440259 No. 9 the Meisner house (4 levels),
// w55440267 No. 11 (5 levels).  x east, z SOUTH; the river lies SW of the houses, their street fronts face SW (outward normal about (-0.65, +0.76)); walking along a front with the house on the left hand ... see edgeFrame.
// edgeFrame(ring, i): the frame of ring edge i: local +z = the outward normal, local +x runs to the RIGHT as seen by a viewer standing outside (so it is the direction (nz, -nx)), the origin S is the LEFT end of the edge.
//   world = S + lx * t + lz * n, rot = atan2(nx, nz) for P.push(S.x, 0, S.z, rot).
import * as CITY from '../data/city.js';
import { ringEdges } from './shapes.js';

export const HOUSES = { h9: 'w55440259', h7: 'w55440261', h11: 'w55440267', h3: 'w55413101' };

export function footprint(id) {
  const b = CITY.BUILDINGS.find((q) => q.id === id);
  if (!b || !b.polys || !b.polys.length) return null;
  const o = b.polys[0].o, ring = [];
  for (let i = 0; i < o.length; i += 2) ring.push([o[i], o[i + 1]]);
  if (ring.length > 3 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) < 0.01) ring.pop();
  return { id, b, ring, poly: b.polys[0], edges: ringEdges(ring) };
}

/** index of the ring edge whose midpoint is nearest to (x, z) */
export function edgeNear(edges, x, z) {
  let best = 0, bd = 1e9;
  edges.forEach((e, i) => { const d = Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z); if (d < bd) { bd = d; best = i; } });
  return best;
}

export function edgeFrame(e) {
  const nx = e.n[0], nz = e.n[1], tx = nz, tz = -nx;
  const sa = e.a[0] * tx + e.a[1] * tz, sb = e.b[0] * tx + e.b[1] * tz;
  const S = sa <= sb ? e.a : e.b;
  return { S: { x: S[0], z: S[1] }, t: [tx, tz], n: [nx, nz], len: e.len, rot: Math.atan2(nx, nz), e };
}
export const toWorld = (f, lx, lz) => ({ x: f.S.x + lx * f.t[0] + lz * f.n[0], z: f.S.z + lx * f.t[1] + lz * f.n[1] });
export const toLocal = (f, x, z) => ({ lx: (x - f.S.x) * f.t[0] + (z - f.S.z) * f.t[1], lz: (x - f.S.x) * f.n[0] + (z - f.S.z) * f.n[1] });
