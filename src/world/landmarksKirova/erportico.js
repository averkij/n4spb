// landmarksKirova/erportico.js - the EIGHT-COLUMN PORTICO of the Erarta museum (Roman Doric / Tuscan, white, three floors high) and everything above the terrace of the centre bay, frame FE.
//   terrace     the floor at 10.1 (behind the balustrade), pedestals at every column axis, 0.9 m balustrade 0.4 m in front of the base wall, cheek walls where the terrace meets the wings
//   wall        the wall behind the columns at r' -2.0: small beige ashlar, floors 3-5 with real window openings (white hoods over the third-floor windows)
//   columns     8 x D 1.55 m, axes q' = -0.9 + 3.6 (k - 3.5), standing on 0.9 m plinths (hidden by the balustrade from the street), shaft 11.0 .. 20.8: torus base, swollen shaft (lathe, 22 sides), echinus, abacus
//   entablature architrave 20.8 .. 21.7, frieze, a row of dentils, the corona projecting 0.85 m (22.9); attic 22.9 .. 24.5 with the museum line in dark capitals; the red roof sign ERARTA (erlet.js)
// Dossier 11.2 / 11.4, photos er05 (level frontal view, 45.4 px/m), er04, er06.
import { ER, ROOF_SIGN } from './frame.js';
import { revolve } from './geo.js';
import { opOf, dentils, balustrade } from './erwin.js';
import { windowed } from './erfront.js';
import { roofSign } from './erlet.js';

const hash = (x, k = 0) => (Math.abs(Math.round(x * 13) * 31 + k * 17) >>> 0) % 97;
/** column profile [[r, y]] from the bottom of the base (y = 11.0): torus base 0.45, shaft 8.85 with entasis, echinus + abacus 0.5 (top 20.8) */
const PROF = [[0.92, 0], [0.92, 0.12], [0.86, 0.17], [0.86, 0.3], [0.79, 0.36], [0.775, 0.45], [0.79, 2.0], [0.775, 5.0], [0.74, 7.5], [0.70, 9.3], [0.72, 9.36], [0.86, 9.54], [0.95, 9.68]].map(([r, y]) => [r, y + 11.0]);

export function build(K) {
  const { P, M } = K, zw = ER.wall, za = ER.colAxisR, [q0, q1] = ER.centre, cols = ER.cols, y0 = ER.corniceTop;
  // terrace floor (the top face of the base cornice covers z 0.1 .. 0.6)
  P.quad(M.eTerrace, [q0, y0, zw], [q1, y0, zw], [q1, y0, ER.centreR], [q0, y0, ER.centreR], [0, 1, 0], [[q0 / 2, zw / 2], [q1 / 2, zw / 2], [q1 / 2, ER.centreR / 2], [q0 / 2, ER.centreR / 2]]);
  // the wall behind the columns
  const bays = cols.slice(0, 7).map((c) => c + 1.8), ops = [];
  bays.forEach((x) => { for (const k of ['u3', 'u4', 'u5']) ops.push(opOf(M, k, x, hash(x, 4), { w: 1.5 })); });
  windowed(K, { x0: q0, x1: q1, ya: y0, yb: ER.entTop, z: zw, tu: 2.8, tv: 1.4, wall: M.eAshlar, ops });
  // balustrade across the front of the terrace (pedestals under every column axis) and cheek walls at both ends
  const zb = ER.centreR + 0.3;
  balustrade(P, M, q0, q1, zb, [q0, ...cols, q1], y0, ER.parapet);
  for (const x of [q0, q1]) { const l = x < 0; P.box(M.eYellow, l ? x : x - 0.3, l ? x + 0.3 : x, y0, ER.parapet - 0.1, -1.45, zb + 0.2, '', 2); P.box(M.eWhite, l ? x - 0.04 : x - 0.34, l ? x + 0.34 : x + 0.04, ER.parapet - 0.1, ER.parapet, -1.49, zb + 0.24, 'b', 2); }
  // eight columns on square plinths
  for (const cx of cols) {
    P.box(M.eWhite, cx - 0.98, cx + 0.98, y0, 10.95, za - 0.98, za + 0.98, 'b', 2); P.box(M.eWhite, cx - 1.04, cx + 1.04, 10.95, 11.0, za - 1.04, za + 1.04, 'b', 2);
    revolve(P, M.eWhite, PROF, 22, { cx, cz: za, uRep: 3, vTile: 2, capTop: M.eWhite });
    P.box(M.eWhite, cx - 1.0, cx + 1.0, 20.64, 20.8, za - 1.0, za + 1.0, '', 2);                                 // abacus (the echinus top is at 20.64)
    // a04 / a06: square foot uplight behind each balustrade pedestal;
    // visible when walking the terrace, using the existing flat and lit bases.
    const ly = y0 + 0.14, lz = za + 1.09;
    P.box(M.eLampBlack, cx - 0.12, cx + 0.12, y0, ly + 0.2, lz - 0.11, lz + 0.11, 'b', 1);
    P.quad(M.eLampWhite, [cx - 0.095, ly, lz + 0.125], [cx + 0.095, ly, lz + 0.125], [cx + 0.095, ly + 0.17, lz + 0.055], [cx - 0.095, ly + 0.17, lz + 0.055], [0, 0.4, 1]);
  }
  // the entablature: architrave over the columns (front z -0.95), frieze, dentils, corona (front z -0.1), then the attic
  const e0 = q0 - 0.12, e1 = q1 + 0.12;
  P.box(M.eWhite, e0, e1, 20.8, 21.7, za - 1.0, -0.95, 'k', 2);
  P.box(M.eFrieze, e0, e1, 21.7, 22.25, za - 1.0, -0.98, 'k', 2);
  dentils(P, M.eWhite, e0, e1, 22.25, 22.55, -0.98, 0.3);
  P.box(M.eWhite, e0 - 0.2, e1 + 0.2, 22.55, 22.82, zw, -0.12, 'k', 2); P.box(M.eWhite, e0 - 0.24, e1 + 0.24, 22.82, ER.entTop, zw, -0.08, 'kb', 2);
  // attic with the museum line, a pale cap and the red roof sign
  const ay0 = ER.entTop, ay1 = ER.atticTop;
  P.box(M.eFrieze, e0 + 0.1, e1 - 0.1, ay0, ay1, zw - 0.4, -0.9, 'k', 2);
  P.box(M.eWhite, e0, e1, ay1, ay1 + 0.15, zw - 0.4, -0.8, 'kb', 2);
  if (K.erartaLabels?.attic !== false) P.quad(M.eFriezeText, [-11.5, ay0 + 0.28, -0.87], [9.5, ay0 + 0.28, -0.87], [9.5, ay0 + 1.28, -0.87], [-11.5, ay0 + 1.28, -0.87], [0, 0, 1]);        // reserved before drawing; 3 cm off the attic face
  if (ROOF_SIGN) K.svc.roofSign = roofSign(P, M, -0.9, ay1 + 0.15, -1.5);
}
