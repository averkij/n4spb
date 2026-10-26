// landmarksAcademy/frame.js - the model frame and the fixed numbers of the module (dossier docs/research/academy.md sections 2-6, critic-checked 2026-10-07).
//   ACAD  frame of the Academy of Arts block: origin = the centre of the round court (-3432.0, -601.6), local +x = u along the river front (bearing 59.8 deg, ENE), local +z = v toward the Neva
//         (bearing 149.8 deg, SSE), y up; the river front faces local +z.  three.js rotation.y = +0.5271 rad (= L.rotYBearing(149.8)).  The sphinx pier, the garden, the Trezzini square and the
//         Dom Akademikov are all placed in THIS frame (u, v): the whole block stands on the rotated Petrine grid.
//         world(u, v) = A + u * (0.8643, -0.5030) + v * (0.5030, 0.8643).
//   The outer ring of OSM r165182 (32 vertices) and its five holes (4 light courts + the round court) are read from the baked data (fallback = the dossier numbers) so that the walls close on the data.
import * as L from '../layout.js';

export const ACAD = { x: -3432.0, z: -601.6, rot: 0.5271 };
const C = Math.cos(ACAD.rot), S = Math.sin(ACAD.rot);
/** academy (u, v) -> world { x, z } */
export const W = (u, v) => ({ x: ACAD.x + C * u + S * v, z: ACAD.z - S * u + C * v });
/** world (x, z) -> academy { u, v } */
export const M = (x, z) => ({ u: C * (x - ACAD.x) - S * (z - ACAD.z), v: S * (x - ACAD.x) + C * (z - ACAD.z) });
/** world direction of the frame axes */
export const U_DIR = [C, -S], V_DIR = [S, C];
/** world yaw (camera convention: 0 north, 90 west) of a view looking along +v (toward the Neva) */
export const YAW_NEVA = L.yawToward ? L.yawToward(ACAD.x, ACAD.z, W(0, 100).x, W(0, 100).z) : 0;

/** the main numbers (m above the street) */
export const H = {
  plinth: 0.9, ground: 6.9, string: 7.0, first: 13.9, top: 17.7, eave: 20.2,      // the three tiers and the entablature top (cornice 20.3 +- 0.6)
  podium: 7.0,                                                                       // balcony slab over the door
  pedApex: 23.3, attic: 24.0, ring: 26.0, crown: 28.6, drum: 29.7, minerva: 33.8,    // front dome stack
  rearApex: 24.3, rearRing: 26.0, rearCrown: 27.8, rearCross: 31.0,
};

/** the pier (in academy u, v): axis u = -1.2, quay face v = 109.3 */
export const PIER = { u: -1.2, vWall: 109.3, ped: [-23.5, 21.1], pedW: 6.2, pedY: 1.8, vTop: 104.3, vBack: 106.4, vLand0: 107.6, vLand1: 108.7, vEnd: 111.8, yLand: -2.28, yWater: -3.4, yLow: -3.12 };

// ------------------------------------------------------------------------------------------------ the footprint (baked data first, dossier numbers as fallback)
const FALL_OUT = [[-70.5, -58.4], [-54.5, -58.4], [-54.4, -47.1], [-12.6, -47.1], [-12.6, -53.3], [10.1, -53.3], [10.1, -47.1], [52, -47.2], [51.9, -58.4], [67.7, -58.5], [68, 61], [52.2, 60.9], [52.2, 57.2], [10.3, 57.3],
  [10.3, 59.6], [8.4, 59.6], [8.1, 61.2], [7.5, 62.2], [6.5, 62.8], [5.1, 63], [5.1, 65.6], [-7, 65.6], [-7.1, 63], [-8.5, 62.9], [-9.5, 62.2], [-10.2, 61.2], [-10.3, 59.7], [-12.3, 59.7], [-12.4, 57.2], [-54.2, 57.3], [-54.2, 61], [-70.2, 61]];
const toLocal = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const q = M(flat[i], flat[i + 1]); r.push([Math.round(q.u * 100) / 100, Math.round(q.v * 100) / 100]); } return r; };
function fromData() {
  try {
    const b = L.buildingById('r165182');
    if (!b || !b.polys || !b.polys.length) return null;
    const p = b.polys[0], out = toLocal(p.o);
    if (out.length !== FALL_OUT.length || !out.every((q, i) => Math.hypot(q[0] - FALL_OUT[i][0], q[1] - FALL_OUT[i][1]) < 1.5)) return null;
    return { out, holes: p.h.map(toLocal), poly: p };
  } catch (e) { return null; }
}
const D = fromData();
/** outer ring of the Academy (u, v), counter-clockwise from the rear-west corner as in the dossier */
export const OUT = D ? D.out : FALL_OUT;
/** the holes: { ring, kind: 'round' | 'court' } (u, v) */
export const HOLES = D ? D.holes.map((r) => ({ ring: r, kind: r.length === 20 ? 'round' : 'court' })) : [];
/** the baked polygon { o, h } in world metres (or null) */
export const POLY = D ? D.poly : null;
export const FROM_DATA = !!D;

/** frame helpers for physics: boxes / cylinders at academy (u, v) */
export const AF = {
  box(ph, u, v, du, dv, y0, y1) { const p = W(u, v); ph.addBox(p.x, p.z, du, dv, ACAD.rot, y0, y1); },
  cyl(ph, u, v, r, y0, y1) { const p = W(u, v); ph.addCylinder(p.x, p.z, r, y0, y1); },
  walk(ph, u, v, du, dv, top, bottom) { const p = W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, ACAD.rot, top, bottom); },
  /** thin wall box between two (u, v) points */
  wall(ph, a, b, y0, y1, t = 0.4) {
    const A = W(a[0], a[1]), B = W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
    if (len < 0.05) return;
    ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
  },
};
