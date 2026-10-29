// landmarksSmolensky/frame.js - the model frames of the five sights of the Smolensky Orthodox Cemetery and the fixed numbers of the module (docs/research/smolensky.md sections 1-8, critic log 14b).
// Every frame is a rectangle fitted to the OSM footprint (min-area box); local +x = u, local +z = v (three.js rotation.y = rot), y up, origin on the ground at street level (y = 0):
//   CH  Smolensk church   origin (-5590.4,-1519.5) rot -2.7594: +X runs WSW along the 45.1 m long body (apse at X 0 in the east, bell tower at X 45.1), +Z points NNW into the cemetery; the south
//       face with the six-column portico looks to -Z (SSE, onto the Petrogradskaya alley)
//   GA  Holy Gates + almshouse  origin = the OSM gate node (-5493.3,-1527.1) rot -2.8032: +X = into the cemetery (WSW), x 0 = the Kamskaya facade, +Z = NNW; the arch runs along x
//   RE  Resurrection church  origin (-5515.9,-1580.7) rot +0.3471: +X ENE (the three apses at X 29..35), +Z SSE towards Kamskaya street (the south face with the gallery door at Z 25.3)
//   XE  Xenia chapel  origin (-5593.7,-1328.1) rot +0.2661: +X ENE, +Z SSE; the OSM door node at (2.0, 0.0) on the NNW edge; rectangle 13.7 x 9.8
//   TR  Trinity chapel  origin = the centre of the 2.6 m pavilion (-5599.3,-1386.4), rot 0, z towards the south (the open front faces the Troitskaya footway on the east side)
// world(u, v) = o + u (cos rot, -sin rot) + v (sin rot, cos rot).  A frame is applied to a Parts collector with P.push(f.x, 0, f.z, f.rot) (kit.js).
// Also: the outline rings of the claimed OSM records (read from the baked data, local frame coordinates) and the cemetery polygon (GREEN r2736670).
import * as L from '../layout.js';

export function mkFrame(x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return {
    x, z, rot, ux: c, uz: -s, vx: s, vz: c,
    /** frame (u, v) -> world { x, z } */
    W: (u, v) => ({ x: x + u * c + v * s, z: z - u * s + v * c }),
    /** world (x, z) -> frame { u, v } */
    M: (wx, wz) => ({ u: (wx - x) * c - (wz - z) * s, v: (wx - x) * s + (wz - z) * c }),
    /** thin solid box between two frame points [u, v] */
    wall(ph, a, b, y0, y1, t = 0.5) {
      const A = this.W(a[0], a[1]), B = this.W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
      if (len < 0.05) return;
      ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
    },
    /** solid box centred at (u, v), size du x dv in the frame */
    box(ph, u, v, du, dv, y0, y1) { const p = this.W(u, v); ph.addBox(p.x, p.z, du, dv, rot, y0, y1); },
    cyl(ph, u, v, r, y0, y1) { const p = this.W(u, v); ph.addCylinder(p.x, p.z, r, y0, y1); },
    /** walk box (floor / step) centred at (u, v) */
    walk(ph, u, v, du, dv, top, bottom) { const p = this.W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, rot, top, bottom); },
  };
}

export const CH = mkFrame(-5590.4, -1519.5, -2.7594);
export const GA = mkFrame(-5493.3, -1527.1, -2.8032);
export const RE = mkFrame(-5515.9, -1580.7, 0.3471);
export const XE = mkFrame(-5593.7, -1328.1, 0.2661);
export const TR = mkFrame(-5599.3, -1386.4, 0);

/** footprint ring of a baked record in a frame: [[u, v]..] (outer ring of the first polygon) */
export function ringIn(f, id, k = 0) {
  const b = L.buildingById(id); if (!b || !b.polys || !b.polys[k]) return null;
  const o = b.polys[k].o, r = [];
  for (let i = 0; i < o.length; i += 2) { const q = f.M(o[i], o[i + 1]); r.push([Math.round(q.u * 100) / 100, Math.round(q.v * 100) / 100]); }
  return r;
}
/** the 21-vertex outline of the Smolensk church (dossier 4.2), the fallback when the record is missing */
export const CH_OUT = [[1.8, 17.7], [0.5, 13.2], [1.7, 8.3], [4.1, 6.0], [4.1, 1.3], [7.1, 1.3], [7.1, 0.0], [22.4, 0.0], [22.4, 1.2], [40.6, 1.1], [40.6, 5.1], [45.1, 5.1], [45.1, 20.6], [40.7, 20.6], [40.7, 24.6], [22.4, 24.6], [22.4, 27.0], [7.2, 27.1], [7.2, 24.7], [0.0, 24.7], [0.0, 17.7]];
/** the Resurrection church outline (dossier 8.2), 32 vertices */
export const RE_OUT = [[1.9, 2.1], [10, 2.0], [10, 0], [16.2, 0], [16.2, 1.3], [18.9, 1.3], [18.9, 0.1], [29, 0.1], [29, 1.1], [32.2, 1.1], [33.7, 2.6], [34.3, 4.6], [33.8, 6.8], [32.3, 8], [32.3, 8.9], [34.7, 8.8], [34.7, 14.9], [32.3, 14.9], [32.4, 18.3], [33.7, 19.4], [34.3, 21.3], [33.8, 23.6], [32.4, 25.1], [29.3, 25.3], [29.4, 26.7], [19.6, 26.7], [19.6, 25.3], [2.2, 25.4], [2.2, 18.1], [0.1, 18.1], [0, 9], [2, 9]];

/** the cemetery polygon (GREEN r2736670) as [[x, z]..] or null */
export async function cemeteryRing() {
  try {
    const { GREEN } = await import('../data/city.js');
    const g = GREEN.find((q) => q.id === 'r2736670');
    if (!g || !g.polys || !g.polys[0]) return null;
    const o = g.polys[0].o, r = [];
    for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]);
    return r;
  } catch (e) { return null; }
}
