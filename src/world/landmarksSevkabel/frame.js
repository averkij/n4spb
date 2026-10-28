// landmarksSevkabel/frame.js - the model frames of the module (docs/research/sevkabel.md section 2; every frame is rotated to the Petrine grid / the plant axes, nothing is axis-aligned).
//   H  the Sevkabel hall 40B (OSM r8702908) and the whole Sevkabel yard: origin (-6172.2, 921.0) = centre of the hall, local +x = SE (bearing 127 deg, along the hall), local +z = SW (bearing 217) = the RIVER face,
//      rotation.y = -0.6458 rad.  The hall lies at lx -78.6..78.6, lz -25..25 (157.2 x 50 m); the NW gable faces the sea square (lx -78.6), the SE gable the pier plaza (lx +78.6).
//   M  the Brusnitsyn mansion r4743691 and the lane (also the pink house 27/1, the factory 28-30, the skyway): origin (-5654.3, 1078.0) = the west end of the street front, local +x = ESE (bearing 114),
//      local +z = SSW = towards Kozhevennaya line; the buildings lie behind the street line (lz < 0), the factory across the lane (lz > 15).  rotation.y = -0.4189.
//   K  the Skobsky Palace w136791761: origin (-5533.0, 1132.4) = the corner of Kozhevennaya and Kosaya lines, local +x along Kozhevennaya line (bearing 114.5), local +z = street (SSW); wing A lx 0..165 / lz -17.5..0,
//      wing B (Kosaya line) lx 0..18.4 / lz -94..0.  rotation.y = -0.4276.
//   A  the Brusnitsyn almshouse w61411170: origin (-5414.5, 807.3), local +x = NNE (bearing 24.5, along Kosaya line), local +z = ESE (bearing 114.5) = the front towards Kosaya line.  rotation.y = +1.1432.
// world(u, v) = origin + u * (cos, -sin) + v * (sin, cos)   [three.js group rotation.y = rot].  `fr.box / wall / cyl / walk` place colliders in a frame like landmarksOktyabrsky/frame.js.
import * as L from '../layout.js';

export function makeFrame(x, z, rot) {
  const C = Math.cos(rot), S = Math.sin(rot);
  const fr = {
    x, z, rot,
    /** frame (u, v) -> world { x, z } */
    W: (u, v) => ({ x: x + C * u + S * v, z: z - S * u + C * v }),
    /** world (x, z) -> frame { u, v } */
    M: (px, pz) => ({ u: C * (px - x) - S * (pz - z), v: S * (px - x) + C * (pz - z) }),
    U: [C, -S], V: [S, C],
    /** world [x, z] pair of frame point (u, v) */
    p: (u, v) => [x + C * u + S * v, z - S * u + C * v],
    /** thin solid wall box between two frame points a, b ([u, v]) from y0 to y1 */
    wall(ph, a, b, y0, y1, t = 0.5) {
      const A = fr.W(a[0], a[1]), B = fr.W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
      if (len < 0.05) return;
      ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
    },
    /** solid box centred at frame (u, v), size du x dv, y range */
    box(ph, u, v, du, dv, y0, y1) { const p = fr.W(u, v); ph.addBox(p.x, p.z, du, dv, rot, y0, y1); },
    cyl(ph, u, v, r, y0, y1) { const p = fr.W(u, v); return ph.addCylinder(p.x, p.z, r, y0, y1); },      // (n4spb: returns the collider, a knock record's item)
    /** walk box (floor / step) centred at frame (u, v) */
    walk(ph, u, v, du, dv, top, bottom) { const p = fr.W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, rot, top, bottom); },
    /** a closed rectangle ring of thin wall boxes (u0..u1, v0..v1) */
    ring(ph, u0, u1, v0, v1, y0, y1, t = 0.5) { fr.wall(ph, [u0, v0], [u1, v0], y0, y1, t); fr.wall(ph, [u1, v0], [u1, v1], y0, y1, t); fr.wall(ph, [u1, v1], [u0, v1], y0, y1, t); fr.wall(ph, [u0, v1], [u0, v0], y0, y1, t); },
    /** a polygon ring [[u, v] ..] of thin wall boxes */
    poly(ph, pts, y0, y1, t = 0.5) { for (let i = 0; i < pts.length; i++) fr.wall(ph, pts[i], pts[(i + 1) % pts.length], y0, y1, t); },
  };
  return fr;
}

export const H = makeFrame(-6172.2, 921.0, -0.6458);
export const M = makeFrame(-5654.3, 1078.0, -0.4189);
export const K = makeFrame(-5533.0, 1132.4, -0.4276);
export const A = makeFrame(-5414.5, 807.3, 1.1432);

/** the hall (frame H) */
export const HALL = { lx0: -78.6, lx1: 78.6, lz0: -25, lz1: 25, roof: 20.5, parapet: 21.3, rib: 22.1, pitch: 12.05, ribX0: -63.6, ribN: 11 };
/** the quay edge (water edge) along the hall river face in frame H: lz as a function of lx (measured with layout.inRiver 2026-10: 29.5 at lx -126, 50.75 from lx 0 to the SE) */
export const quayLz = (lx) => (lx <= -7.7 ? 29.2 + 0.1822 * (lx + 126.8) : 50.75 + (lx > 55 ? 0.0045 * (lx - 55) : 0));
/** a point of frame H is on dry land of the strip (not in the river) */
export const dryH = (lx, lz) => { const p = H.W(lx, lz); return !L.inRiver(p.x, p.z); };

/** the three chimneys of CHP-7 (OSM w815734026 / 27 / 28) and the Sevkabel boiler chimney (w559797551) */
export const CHIMNEYS = [{ x: -5773.0, z: 729.8 }, { x: -5815.5, z: 775.0 }, { x: -5846.5, z: 805.4 }];
export const BOILER_CHIMNEY = { x: -6178.1, z: 797.9 };
/** the shipyard crane runways (OSM crane ways, centre lines in world metres [x, z]) */
export const RUNWAYS = {
  A_W: [[-5241.7, 1508.6], [-5122.9, 1190.8]], A_E: [[-5194.0, 1535.8], [-5081.1, 1215.9]],
  B_W: [[-4925.9, 1426.9], [-4939.6, 1170.6]], B_E: [[-4878.0, 1423.8], [-4891.7, 1167.5]],
  QUAY: [[-4673.8, 710.3], [-4692.0, 781.0], [-4752.0, 1091.3], [-4843.7, 1357.2]],
};
