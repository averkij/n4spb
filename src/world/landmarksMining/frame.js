// landmarksMining/frame.js - the two model frames and the fixed numbers of the module (docs/research/mining.md sections 2, 4, 5, 8, 9; every number is re-measured on the baked OSM footprints).
//   P  frame of the Mining University portico: origin world (-4566.8, 358.4) = the middle of the OSM front line of the portico (ring vertices 17 / 18 of r2902646), three.js rotation.y = 0.9320 rad:
//      local +x = u along the front to the NE (bearing 36.6 deg, to the RIGHT of a viewer who looks at the building from the river), local +z = w OUTWARD to the Neva (bearing 126.6 deg, SE),
//      local -z = into the building, y up, y = 0 = the street / pavement.  world = O + u * (0.5962, -0.8028) + w * (0.8028, 0.5962).
//   S  frame of the icebreaker Krasin: origin world (-4598.35, 509.5) = the middle of the OSM hull, rotation.y = 2.9130 rad: local +z = the BOW (bearing 13.1 deg, NNE, up river), local +x = PORT (WSW, the quay side),
//      y = street level, waterline y = -3.4.  world = O + X * (-0.9739, -0.2269) + Z * (0.2269, -0.9739).
// Both frames reproduce the OSM nodes of the dossier to 0.1 m (sculpture nodes, bust, gangway ends).  Helpers: P.W(u, w) -> { x, z }, P.M(x, z) -> { u, w }, the physics shortcuts P.box / cyl / walk / ramp / stairs.
import * as L from '../layout.js';

export const DEG = Math.PI / 180;
const mk = (x, z, rot) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  return {
    x, z, rot, cs, sn,
    /** local (a, b) -> world { x, z }  (a = u / X, b = w / Z) */
    W: (a, b) => ({ x: x + a * cs + b * sn, z: z - a * sn + b * cs }),
    /** world (px, pz) -> local { a, b } with aliases u / w */
    M: (px, pz) => { const dx = px - x, dz = pz - z, a = dx * cs - dz * sn, b = dx * sn + dz * cs; return { a, b, u: a, w: b, X: a, Z: b }; },
    /** world direction of local +a, +b */
    A: [cs, -sn], B: [sn, cs],
    box(ph, a, b, w, d, r, y0, y1) { const p = this.W(a, b); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl(ph, a, b, rad, y0, y1) { const p = this.W(a, b); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk(ph, a, b, w, d, r, top, bottom) { const p = this.W(a, b); return ph.addWalkBox(p.x, p.z, w, d, r + rot, top, bottom); },
    /** ramp whose local +z (after r) rises from yA at -d/2 to yB at +d/2 */
    ramp(ph, a, b, w, d, r, yA, yB, thick) { const p = this.W(a, b); return ph.addWalkRamp(p.x, p.z, w, d, r + rot, yA, yB, thick); },
    stairs(ph, a, b, w, d, r, y0, y1, n) { const p = this.W(a, b); return ph.addStairs(p.x, p.z, w, d, r + rot, y0, y1, n); },
  };
};
export const P = mk(-4566.8, 358.4, 0.9320);
export const S = mk(-4598.35, 509.5, 2.9130);

/** heights of the portico block (y above the street), dossier section 4 / 5 */
export const HT = {
  stair: 1.95, riser: 0.15, tread: 0.48, nSteps: 13, stairW: 31.8, stairW0: 0.36, stairW1: 6.6,   // 13 granite steps from w 6.6 to the stylobate at +1.95
  colTop: 10.45, colBase: 1.95, shaftTop: 9.45, colFoot: 0.81, colNeck: 0.59, colW: -0.9,          // 12 Doric columns: axis at w = -0.9
  archTop: 11.55, friezeTop: 12.8, corniceTop: 14.0, apex: 19.8, tymp: 18.9,
  back: -5.5,                                                                                       // the gallery back wall
  ceil: 10.3,
  wing: 11.0,                                                                                       // eave of the wings / ranges (uniform: the real 10.7 .. 12.8)
};
/** the 12 column axes (u): +-1.77, +-5.32, +-8.86, +-12.41, +-15.95, +-19.50 (pitch 3.545 m) */
export const COLS = [-19.5, -15.955, -12.41, -8.865, -5.32, -1.775, 1.775, 5.32, 8.865, 12.41, 15.955, 19.5];
/** the 11 bay centres between the columns (the door bay is u = 0) */
export const BAYS = [-17.73, -14.18, -10.64, -7.09, -3.545, 0, 3.545, 7.09, 10.64, 14.18, 17.73];

/** hull axis offset of the Krasin in frame S (the OSM outline is NOT symmetric about X = 0): axis +0.6, half beam 10.8 (port edge +11.4) */
export const SHIP = { axis: 0.6, half: 10.8, zBow: 49.0, zStern: -50.8, quay: 11.8 };

/** world point of the portico front line ends and the stair (for the audits) */
export const STAIR_TOP = P.W(0, 0.4);
/** the ring of the main building r2902646 in frame P, from the baked footprint (fallback: the dossier numbers) */
export const RING_P = [[66.9, -74.2], [70.7, -72.5], [72.9, -76.9], [79.2, -91.6], [88.7, -87.4], [90.7, -92.0], [97.4, -89.1], [95.3, -84.4], [97.3, -83.6], [88.7, -64.5], [90.5, -63.8], [83.4, -47.5], [81.6, -48.1], [71.9, -25.1], [32.3, -7.7], [32.4, -4.9], [21.7, -4.5], [21.8, 0.0], [-21.8, 0.0], [-22.0, -6.5], [-34.2, -6.1], [-34.4, -8.9], [-61.2, -18.1], [-74.8, -23.6], [-51.6, -77.7], [-31.4, -68.9], [18.8, -47.5], [12.2, -32.5], [15.9, -30.9], [13.0, -24.5], [33.7, -25.3], [22.2, -29.3], [29.2, -44.9], [49.6, -35.5]];
export const HOLE_P = [[0, -37.6], [-43.3, -56.0], [-52.9, -34.0], [-30.7, -24.2], [-26.0, -35.5], [-4.4, -26.7]];

/** distance clearance to asphalt: negative = clear by that many metres (net.cover when the streets module is built, else layout.isOnRoad) */
export function coverOf(ctx) {
  const net = ctx.services && ctx.services.streets && ctx.services.streets.net;
  return net && net.cover ? (x, z) => net.cover(x, z, {}) : (x, z) => (L.isOnRoad(x, z, 0) ? 1 : -5);
}
