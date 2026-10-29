// landmarksNavalCorps/frame.js - the three model frames and the fixed dimensions of the module (docs/research/navalcorps.md sections 2, 4, 5, 6, 7; every number was re-measured against the baked OSM rings).
//   K  frame of the Naval Cadet Corps, the Krusenstern monument and its stair: origin = the west end of the river front (-4062.7, -243.6), local +x = u along the front (bearing 60.2, towards the 11th line),
//      local +z = v from the facade towards the Neva (SSE, bearing 150.2); the facade faces +z.  three.js rotation.y = +0.5199.   world(u, v) = O + u (0.86804, -0.49652) + v (0.49652, 0.86804)
//   C  frame of the Dormition church: origin = the west corner of the church rectangle (-4250.3, -123.7), u along the long axis (bearing 60) to the apses, v towards the Neva (SE).  rotation.y = +0.5236.
//   S  frame of the submarine S-189: origin = the hull midpoint (-4245.3, 34.2), local +z = the STERN (SW, bearing 227.2), local -z = the BOW (NE), +x = the pier side (SE).  rotation.y = -0.8238.
// OUT / HOLES: the baked ring of r1242815 (the Corps) expressed in K; the dossier list is the fallback when the baked record is missing.
import * as L from '../layout.js';

export const DEG = Math.PI / 180;
const mkFrame = (x, z, rot) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  return {
    x, z, rot,
    /** frame (u, v) -> world { x, z } */
    W: (u, v) => ({ x: x + c * u + s * v, z: z - s * u + c * v }),
    /** world (x, z) -> frame { u, v } */
    M: (px, pz) => ({ u: c * (px - x) - s * (pz - z), v: s * (px - x) + c * (pz - z) }),
    /** world direction of the axes */
    U: [c, -s], V: [s, c],
    /** wall box / cylinder / walk box helpers for physics (frame coordinates) */
    box(ph, u, v, du, dv, y0, y1) { const p = this.W(u, v); return ph.addBox(p.x, p.z, du, dv, rot, y0, y1); },
    walk(ph, u, v, du, dv, top, bottom) { const p = this.W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, rot, top, bottom); },
    cyl(ph, u, v, r, y0, y1) { const p = this.W(u, v); return ph.addCylinder(p.x, p.z, r, y0, y1); },
    /** thin wall between two frame points a, b ([u, v]) */
    wall(ph, a, b, y0, y1, t = 0.5) {
      const A = this.W(a[0], a[1]), B = this.W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
      if (len < 0.05) return null;
      return ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
    },
  };
};
export const K = mkFrame(-4062.7, -243.6, 0.5199);
export const C = mkFrame(-4250.3, -123.7, 0.5236);
export const S = mkFrame(-4245.3, 34.2, -0.8238);

// ------------------------------------------------------------------------------------------------ the Corps outline in K
const FALL_RING = [[0, 0], [135.9, 0], [135.9, -80.5], [120.0, -80.4], [120.0, -83.4], [73.2, -83.4], [73.2, -88.2], [79.7, -88.2], [79.7, -114.7], [72.1, -114.6], [72.1, -118.9], [116.9, -118.8],
  [116.9, -127.2], [110.0, -127.2], [110.0, -136.1], [82.3, -136.1], [80.1, -139.3], [80.0, -169.9], [82.4, -169.9], [82.5, -178.4], [61.9, -178.4], [61.9, -159.3], [18.2, -159.3], [-0.3, -159.3]];
const FALL_HOLES = [
  [[50.9, -13.1], [60.5, -13.1], [60.5, -59.6], [50.9, -59.6]], [[14.3, -20.1], [37.8, -20.1], [37.8, -80.7], [14.3, -80.7]], [[80.2, -18.4], [125.1, -18.4], [125.1, -69.1], [80.2, -69.1]],
  [[30.1, -75.4], [60.8, -75.4], [60.8, -100.7], [30.1, -100.7]], [[35.2, -116.5], [61.1, -116.5], [61.1, -153.8], [35.2, -153.8]]];
const toK = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const q = K.M(flat[i], flat[i + 1]); r.push([Math.round(q.u * 100) / 100, Math.round(q.v * 100) / 100]); } return r; };
function fromData() {
  try {
    const b = L.buildingById('r1242815');
    if (!b || !b.polys || !b.polys[0] || b.polys[0].o.length < 20) return null;
    const out = toK(b.polys[0].o), holes = b.polys[0].h.map(toK);
    // sanity: the baked ring must reproduce the dossier frame (front edge 135.9 m on v = 0)
    const front = out.filter((q) => Math.abs(q[1]) < 0.3);
    if (front.length < 2 || Math.max(...front.map((q) => q[0])) < 135 || Math.min(...front.map((q) => q[0])) > 1) return null;
    return { out, holes, poly: b.polys[0] };
  } catch (e) { return null; }
}
const D = fromData();
/** outer ring of the Corps in K [[u, v]..] (baked order) */
export const OUT = D ? D.out : FALL_RING;
/** the five courtyards in K */
export const HOLES = D ? D.holes : FALL_HOLES;
/** the baked footprint { o, h } in world coordinates (or null) */
export const POLY = D ? D.poly : null;
/** the footprint { o, h } in world coordinates: the baked one, or the dossier ring converted from K */
export function polyWorld() {
  if (POLY) return POLY;
  const flat = (r) => r.flatMap((q) => { const p = K.W(q[0], q[1]); return [p.x, p.z]; });
  return { o: flat(OUT), h: HOLES.map(flat) };
}

// ------------------------------------------------------------------------------------------------ heights and dimensions of the Corps (dossier section 4)
export const HT = {
  plinth: 0.4, gf: 4.1, str0: 4.1, str1: 4.3, f1: 9.5, belt0: 9.4, belt1: 9.6, tf: 12.1, cornice: 13.3,
  corniceProj: 0.9,
  ent0: 12.2, ent1: 14.1, attic1: 15.4,                      // colonnade entablature and the attic of the central block
  pav: 16.4,                                                 // the attic block of the pavilions
  ridge: 15.9,                                               // the hip roof of the wings
};
/** window types of the three floors: [sill, head, width] */
export const WIN = { gf: [1.55, 3.7, 1.2], f1: [5.35, 7.95, 1.2], tf: [10.3, 11.75, 1.15] };
/** the 43 window axes of the river front (u), dossier 4.2; 23.9 and 110.0 carry the doors + balconies */
export const BAYS = [3.1, 6.0, 9.4, 12.7, 15.9, 19.0, 21.5, 23.9, 26.3, 28.9, 31.9, 35.2, 38.4, 41.9, 44.8, 48.3, 50.9, 54.65, 57.45, 60.35, 63.2, 66.05, 68.9, 71.7, 74.55, 77.35,
  80.9, 84.4, 87.4, 91.2, 94.0, 97.0, 99.9, 103.5, 107.0, 110.0, 112.9, 119.5, 123.0, 126.4, 130.5, 133.0, 116.2];
export const DOORS = [23.9, 110.0];
export const PAV_W = { u0: 17.2, u1: 30.7, dome: [24.0, -8.0] };
export const PAV_E = { u0: 103.3, u1: 116.7, dome: [110.0, -10.0] };
export const COL = { n: 10, u0: 53.35, pitch: 2.83, v: 1.2, shaftY0: 5.3, shaftY1: 11.2, capY1: 12.2, plinthY0: 4.1, shelf: 2.0 };
export const TURRET = { u: 65.6, v: -9.0, r: 3.35 };
export const CENTRAL = { u0: 52.6, u1: 79.4 };

// ------------------------------------------------------------------------------------------------ monument and stair (frame K)
export const MON = { u: 66.55, v: 41.15, axis: 66.1 };
export const STAIR = { u0: 55.4, u1: 77.6, v0: 39.4, v1: 47.4, tumba: [64.7, 68.4, 39.35, 43.0], landing: -1.8, bottom: -3.2 };
export const QUAY_V = (u) => (u < 55.9 ? 53.3 + (47.5 - 53.3) * Math.max(0, (u + 18.7)) / (55.9 + 18.7) : u < 77.6 ? 47.4 : 46.8 + (46.0 - 46.8) * Math.min(1, (u - 77.6) / (140 - 77.6)));

// ------------------------------------------------------------------------------------------------ the church (frame C, dossier 6.1)
export const CH = { u: 31.9, v: 24.0, plinth: 1.3, cornice: 14.1, drum: [14.9, 12.0] };
/** the plan of the church in C [[u, v]..] counter-clockwise from the SW corner: the rectangle u 0..27.2 plus the NE apse group (a hexagonal central apse of three facets between two smaller side apses of three facets each);
 *  the OSM rectangle 31.9 x 24 is its bounding box (dossier 6.1: the NE end is polygonal, the exact plan is [E] +-2 m) */
export const CH_PLAN = [[0, 0], [27.2, 0], [29.97, 1.6], [29.97, 5.0], [27.2, 6.7], [31.79, 9.35], [31.79, 14.65], [27.2, 17.3], [29.97, 19.0], [29.97, 22.4], [27.2, 24], [0, 24]];

// ------------------------------------------------------------------------------------------------ the submarine (frame S)
export const SUB = { half: 38.03, beam: 6.64, draught: 4.55, deck: 2.3, sailZ: -16 };
/** pier w945633057: the NW edge line / the axis of the hull in S (the hull lies 3.2 m off the NW edge, pier 9 m wide) */
export const PIER = { x0: 3.2, x1: 12.2, z0: -168.6, z1: 49.2 };
