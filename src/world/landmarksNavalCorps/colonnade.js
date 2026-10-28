// landmarksNavalCorps/colonnade.js - the ten-column Ionic COLONNADE of the Naval Cadet Corps and the central block above the wings (docs/research/navalcorps.md 4.4, photos a07 center crop, a04, a05).
// Frame K (u along the front, v from the facade towards the Neva).  TEN free-standing unfluted Ionic columns, pitch 2.83 m (axes u 53.35 .. 78.82, axis of the whole 66.1), shaft 5.3 .. 11.2 m (dia 1.15 -> 1.0),
// square plinth blocks 1.5 x 1.5 m (4.3 .. 5.3), capital 1.0 m (volutes 1.5 m wide), a FLAT entablature 12.2 .. 14.1 (three fascias, plain frieze, dentil row, corona; NO pediment) projecting to v = 2.3, the
// attic wall 14.1 .. 15.4.  The columns stand about 1.8 m in front of the wall on a shelf (the string course widened to 2.0 m at y 3.9 .. 4.3, carried by ten corbels): the ground floor behind is the ordinary
// rusticated wall with its windows, people can walk under the shelf.  The upper block behind the attic: the terrace (roof at 16.6 m) with the X-braced railing, the turret (top.js) and the cream high roof.
import * as THREE from 'three';
import { K, HT, COL, CENTRAL } from './frame.js';
import { revolve } from './geo.js';

export function build(Q) {
  const P = Q.P, M = Q.M, { u0, pitch, v, n } = COL, ua = CENTRAL.u0, ub = CENTRAL.u1;
  P.push(K.x, 0, K.z, K.rot);
  try {
    // ---- the shelf under the plinths: slab 0.4 m thick, 2.0 m deep, with the corbels below it
    P.box(M.trim, ua, ub, 3.9, 4.3, 0, COL.shelf, 'k', 2);
    // under each plinth a wedge-shaped stone console (0.5 m wide, 1.7 m out, 0.8 m deep) carries the shelf
    // (review 2026-10-08: 0.7 m wide wedges read as heavy blocks at 1.7 m; the frontal crop g_center of a07 shows brackets 0.4 .. 0.5 m wide under each plinth)
    for (let k = 0; k < n; k++) {
      const cx = u0 + k * pitch;
      for (const s of [-1, 1]) P.fan(M.trimShade, [[cx + s * 0.25, 3.1, 0], [cx + s * 0.25, 3.9, 0], [cx + s * 0.25, 3.9, 1.7]], [s, 0, 0]);
      P.quad(M.trimShade, [cx - 0.25, 3.1, 0], [cx + 0.25, 3.1, 0], [cx + 0.25, 3.9, 1.7], [cx - 0.25, 3.9, 1.7], [0, -0.7, 0.7]);
    }
    // ---- the columns
    for (let k = 0; k < n; k++) {
      const cx = u0 + k * pitch;
      P.box(M.column, cx - 0.75, cx + 0.75, 4.3, 5.3, v - 0.75, v + 0.75, 'b', 2);                                // plinth block
      P.box(M.trim, cx - 0.82, cx + 0.82, 4.3, 4.42, v - 0.82, v + 0.82, 'b', 1);                                   // its base moulding
      P.col(M.column, cx, v, 5.3, 5.52, 0.74, 0.62, 20, true);                                                    // attic base
      P.col(M.column, cx, v, 5.52, 11.0, 0.575, 0.5, 20, false);                                                  // the shaft
      P.col(M.column, cx, v, 11.0, 11.2, 0.5, 0.56, 20, true);                                                    // necking / astragal
      P.col(M.column, cx, v, 11.2, 11.62, 0.56, 0.66, 20, true);                                                  // echinus
      P.box(M.column, cx - 0.62, cx + 0.62, 11.5, 11.9, v - 0.34, v + 0.34, 'b', 1);                               // the bolster between the volutes
      for (const sx of [-0.6, 0.6]) for (const sz of [-1, 1]) P.cyl(M.column, [cx + sx, 11.62, v + sz * 0.5], [cx + sx, 11.62, v + sz * 0.7], 0.27, 0.27, 12, true);   // the four volute discs
      P.box(M.column, cx - 0.78, cx + 0.78, 11.9, 12.2, v - 0.78, v + 0.78, 'b', 1);                               // abacus
    }
    // ---- the flat entablature over the central block width: soffit, architrave (3 fascias), frieze, cornice with dentils
    P.quad(M.trimShade, [ua, 12.2, 0], [ub, 12.2, 0], [ub, 12.2, 1.9], [ua, 12.2, 1.9], [0, -1, 0], [[ua / 2, 0], [ub / 2, 0], [ub / 2, 1], [ua / 2, 1]]);
    P.box(M.trim, ua, ub, 12.2, 12.4, 0, 1.9, 'bk', 2); P.box(M.trim, ua, ub, 12.4, 12.58, 0, 1.96, 'bk', 2); P.box(M.trim, ua, ub, 12.58, 12.75, 0, 2.02, 'bk', 2);
    P.box(M.trimShade, ua, ub, 12.75, 13.4, 0, 2.0, 'bk', 2);
    P.box(M.trim, ua - 0.1, ub + 0.1, 13.4, 13.55, 0, 2.1, 'bk', 2);
    const nd = Math.floor((ub - ua) / 0.3); for (let i = 0; i < nd; i++) { const x = ua + (i + 0.5) * (ub - ua) / nd; P.box(M.trim, x - 0.08, x + 0.08, 13.55, 13.75, 1.9, 2.22, 'bk', 1); }
    P.box(M.trim, ua - 0.2, ub + 0.2, 13.75, HT.ent1, 0, 2.3, 'bk', 2);
    // ---- attic wall 14.1 .. 15.4 (front face at v = 1.3), its slim cornice; the terrace parapet behind it (to 16.6)
    const ay0 = HT.ent1, ay1 = HT.attic1;
    P.quad(M.stucco, [ua, ay0, 1.3], [ub, ay0, 1.3], [ub, ay1, 1.3], [ua, ay1, 1.3], [0, 0, 1], [[ua / 4, ay0 / 4], [ub / 4, ay0 / 4], [ub / 4, ay1 / 4], [ua / 4, ay1 / 4]]);
    P.box(M.trim, ua - 0.2, ub + 0.2, ay1 - 0.05, ay1 + 0.22, 1.3, 1.75, 'bk', 2);
    for (const [x, nx] of [[ua, -1], [ub, 1]]) {
      P.quad(M.stucco, [x, 13.3, 1.3], [x, 13.3, -18.4], [x, 16.6, -18.4], [x, 16.6, 1.3], [nx, 0, 0], [[0, 3.3 / 4], [19.7 / 4, 3.3 / 4], [19.7 / 4, 4.15], [0, 4.15]]);
    }
    P.quad(M.stucco, [ua, ay1, -1.5], [ub, ay1, -1.5], [ub, 16.6, -1.5], [ua, 16.6, -1.5], [0, 0, 1], [[0, 0], [6.7, 0], [6.7, 0.3], [0, 0.3]]);
    P.quad(M.stucco, [ub, ay1, -18.4], [ua, ay1, -18.4], [ua, 16.6, -18.4], [ub, 16.6, -18.4], [0, 0, -1], [[0, 0], [6.7, 0], [6.7, 0.3], [0, 0.3]]);
    // the terrace: a zinc deck at 16.6 behind the parapet (u 52.6 .. 79.4, v -1.5 .. -18.4); the cream high roof over its east part
    P.quad(M.zinc, [ua, 16.6, -1.5], [ub, 16.6, -1.5], [ub, 16.6, -18.4], [ua, 16.6, -18.4], [0, 1, 0], [[ua / 2.4, 0], [ub / 2.4, 0], [ub / 2.4, 7], [ua / 2.4, 7]]);
    // the roof between the attic wall and the parapet (v 1.3 .. -1.5, y 15.4): a strip of zinc
    P.quad(M.zinc, [ua, ay1, 1.3], [ub, ay1, 1.3], [ub, ay1, -1.5], [ua, ay1, -1.5], [0, 1, 0], [[ua / 2.4, 0], [ub / 2.4, 0], [ub / 2.4, 1.2], [ua / 2.4, 1.2]]);
    highRoof(P, M, 69.2, ub - 0.3, -3.5, -17.2, 16.6, 20.0);
    // the X-braced iron railing 8.0 m long on the terrace in front of the turret (v -2.6), 1.1 m high
    xrail(P, M, 61.6, 69.6, -2.6, 16.6, 1.1);
  } finally { P.pop(); }
}

/** a hipped roof (cream plaster / paint) from the footprint x0..x1, z0..z1 (z0 front) at eaves y0 to a ridge y1 along x */
function highRoof(P, M, x0, x1, z0, z1, y0, y1) {
  const zm = (z0 + z1) / 2, m = Math.abs(z1 - z0) / 2, inset = m;
  const xa = x0 + inset, xb = x1 - inset;
  const q = (a, b, c, d, n) => P.quad(M.roofCream, a, b, c, d, n);
  if (xb > xa) {
    q([x0, y0, z0], [x1, y0, z0], [xb, y1, zm], [xa, y1, zm], [0, 0.6, 1]);
    q([x1, y0, z1], [x0, y0, z1], [xa, y1, zm], [xb, y1, zm], [0, 0.6, -1]);
    P.fan(M.roofCream, [[x0, y0, z1], [x0, y0, z0], [xa, y1, zm]], [-0.6, 0.6, 0]);
    P.fan(M.roofCream, [[x1, y0, z0], [x1, y0, z1], [xb, y1, zm]], [0.6, 0.6, 0]);
  } else {
    const cx = (x0 + x1) / 2;
    P.fan(M.roofCream, [[x0, y0, z0], [x1, y0, z0], [cx, y1, zm]], [0, 0.6, 1]); P.fan(M.roofCream, [[x1, y0, z1], [x0, y0, z1], [cx, y1, zm]], [0, 0.6, -1]);
    P.fan(M.roofCream, [[x0, y0, z1], [x0, y0, z0], [cx, y1, zm]], [-0.6, 0.6, 0]); P.fan(M.roofCream, [[x1, y0, z0], [x1, y0, z1], [cx, y1, zm]], [0.6, 0.6, 0]);
  }
}

/** black iron railing with X bracing: posts every 1 m, top and bottom rails, a flat-bar X in every bay */
function xrail(P, M, x0, x1, z, y0, h) {
  const n = Math.round(x1 - x0);
  P.box(M.iron, x0, x1, y0 + h - 0.05, y0 + h, z - 0.03, z + 0.03, 'b', 1); P.box(M.iron, x0, x1, y0 + 0.12, y0 + 0.17, z - 0.03, z + 0.03, 'b', 1);
  for (let i = 0; i <= n; i++) { const x = x0 + i * (x1 - x0) / n; P.box(M.iron, x - 0.03, x + 0.03, y0, y0 + h, z - 0.03, z + 0.03, 'b', 1); }
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * (x1 - x0) / n, xb = x0 + (i + 1) * (x1 - x0) / n;
    P.cyl(M.iron, [xa, y0 + 0.17, z], [xb, y0 + h - 0.05, z], 0.012, 0.012, 4, false); P.cyl(M.iron, [xa, y0 + h - 0.05, z], [xb, y0 + 0.17, z], 0.012, 0.012, 4, false);
  }
}
export { xrail };
void THREE; void revolve;
