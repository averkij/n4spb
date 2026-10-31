// landmarksLETI/frame.js - the fixed numbers and the helpers of the module (dossier docs/research/aptekarsky-2026.md sections 4.3, 10, 12, 15 BUILD LOG; photos 63, leti/01 02 04 05 06, 60 61 62 64).
//   Local frame of every building / facade: `Frame(cx, cz, rot)`: local +x runs along the front to the RIGHT as seen from outside, +z points OUT of the front, y is up (the island is flat: ground y = 0);
//   world = c + R(rot) (x, z) with x' = x cos + z sin, z' = -x sin + z cos; the matching Parts frame is P.push(cx, 0, cz, rot).
// What the photos settle (the CRITIC LOG named the wrong corner; re-derived in the BUILD LOG from the OSM nodes): the striped building of photos 63 / 02 is Corpus 1 (r1915364) seen from the Prof. Popova
// street / Aptekarsky pr. crossing at its SOUTH-WEST corner: OSM edge 21 (14.8 m, normal 213 deg) carries the clock node n10719449916 at its middle, the fence w141425875 wraps it, the two plaques of Popov
// and Vologdin (n10200097305 / 06) hang on the street front east of it (edge 14), the main entrance n1547973236 (-1751, -4380.4) is the middle of the 21.6 m porch block (edge 28) of the WEST face (photo
// leti/01), the lantern spire of photos 01 / 02 stands over the hall behind that front.  Corpus 5 (red brick) entrance: the front of r11983462 edge 2 (17.3 m, facing WSW) at the end of the steps way w141425873.
import * as L from '../layout.js';

export const TAU = Math.PI * 2, DEG = Math.PI / 180;

export const IDS = {
  c1: 'r1915364', cD: 'r11983465', c5aud: 'r11983462', c5lab: 'r11983463', c5aud2: 'r11983464', c7: 'w28370226',
};
/** OSM non-building ids that the module draws */
export const OSM = { bustPopov: 'n10272936450', bustVologdin: 'n10272936442', memorial: 'n6057829971', fenceSW: 'w141425875' };

export const ringOf = (id, k = 0) => {
  const b = L.buildingById(id); if (!b) return null;
  const o = b.polys[k].o, r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]);
  return r;
};
export const holesOf = (id, k = 0) => { const b = L.buildingById(id); return b ? (b.polys[k].h || []).map((h) => { const r = []; for (let i = 0; i < h.length; i += 2) r.push([h[i], h[i + 1]]); return r; }) : []; };
export const bld = (id) => L.buildingById(id);

/** a local frame (x right along the front, z out) at world (cx, cz) turned by rot (the Parts.push rotation) */
export class Frame {
  constructor(cx, cz, rot) { this.cx = cx; this.cz = cz; this.rot = rot; this.c = Math.cos(rot); this.s = Math.sin(rot); }
  /** local (x, z) -> world [x, z] */
  w(x, z) { return [this.cx + x * this.c + z * this.s, this.cz - x * this.s + z * this.c]; }
  /** world (x, z) -> local [x, z] */
  l(x, z) { const dx = x - this.cx, dz = z - this.cz; return [dx * this.c - dz * this.s, dx * this.s + dz * this.c]; }
  /** the yaw (rotation about y) of an object that should face local direction (dx, dz) */
  yaw(dx, dz) { const wx = dx * this.c + dz * this.s, wz = -dx * this.s + dz * this.c; return Math.atan2(wx, wz); }
  /** run fn in the Parts frame */
  on(P, fn) { P.push(this.cx, 0, this.cz, this.rot); try { return fn(); } finally { P.pop(); } }
}

/** world point (x, z) of a distance `d` along an edge of a ring (from its first vertex) and `o` out of it (outward normal given by ringEdges) */
export const onEdgePoint = (e, d, o = 0) => [e.a[0] + (e.b[0] - e.a[0]) * d / e.len + e.n[0] * o, e.a[1] + (e.b[1] - e.a[1]) * d / e.len + e.n[1] * o];

/** is the world point on an asphalt carriageway? (road integrity: nothing stands on it; falls back to the plain layout test before streets exists) */
export function onRoad(ctx, x, z, margin = 0.3) {
  const net = ctx.services.streets && ctx.services.streets.net;
  if (net && net.cover) return net.cover(x, z, {}) > -margin;
  return !!(L.isOnRoad && L.isOnRoad(x, z, -0.1));
}

/** the heights of the old building (m above the pavement; photos 63 / leti 01 / 02, scale by the 1.8 m fence piers and the 1.5 m cars) */
export const H = {
  plinth: 1.5, str1: 5.3, str2: 6.9, wall: 13.1, corniceTop: 14.5, parapet: 15.5,         // plinth top / first string course / second string course / wall top (under the cornice) / cornice top / parapet top
  winG0: 1.95, winG: 3.0, winU0: 7.2, winU: 5.0,                                         // ground-floor arch (y0, total height) / upper arch
  tower: 19.0, domeBase: 18.6, domeTop: 22.3, spike: 23.8,                               // the two round towers of the SW gable
  gableApex: 21.5, gableTop: 24.0,
};
