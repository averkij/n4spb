// landmarksAcademy/orders.js - the architectural orders of the Academy facades as Parts geometry (docs/research/academy.md 3.2, 3.3, 5.5, 7).
//   pilaster()      flat giant pilaster of the wings (width 1.6, proud 0.35, base 0.4, stepped capital)             - facade frame (x along the wall, z out)
//   romanDoric()    smooth Roman-Doric column of the portico (shaft 1.45 -> 1.25, base, neck, echinus, abacus)       - any frame (vertical axis at x, z)
//   greekDoric()    fluted baseless Doric column of the garden pavilion (24 flutes as a 16-gon faceted shaft)
//   entabl()        architrave + frieze + corona block between two x and over a depth z0..z1 (a projecting entablature)
//   baluster()      a baluster railing run (plinth, rail, textured balusters)
// Materials come from M (mats.js).  Every function draws only the faces that can be seen (skip strings of kit.js box()).
import { TAU } from './geo.js';

/** a flat giant pilaster centred at x on the wall (z = 0 is the wall plane, +z out), shaft y0..y1 */
export function pilaster(P, M, x, y0, y1, o = {}) {
  const w = o.w ?? 1.6, pr = o.proj ?? 0.35, mat = o.mat || M.order, h = w / 2;
  P.box(mat, x - h - 0.15, x + h + 0.15, y0, y0 + 0.4, 0, pr + 0.07, 'kb', 3);                               // base
  P.box(mat, x - h, x + h, y0 + 0.4, y1 - 0.7, 0, pr, 'kb', 3);                                               // shaft
  P.box(M.orderShade, x - h, x - h + 0.04, y0 + 0.4, y1 - 0.7, pr - 0.001, pr + 0.002, 'kbt', 3);              // a shadow line down the left arris (reads as a fluting edge)
  P.box(mat, x - h - 0.1, x + h + 0.1, y1 - 0.7, y1 - 0.38, 0, pr + 0.07, 'kb', 3);                           // neck + echinus
  P.box(mat, x - h - 0.2, x + h + 0.2, y1 - 0.38, y1, 0, pr + 0.14, 'kb', 3);                                 // abacus
}

/** a smooth Roman-Doric column with the axis at (x, z); y0 = foot of the base, y1 = top of the abacus; r = shaft radius at the foot */
export function romanDoric(P, M, x, z, y0, y1, r = 0.725, o = {}) {
  const mat = o.mat || M.order, seg = o.seg ?? 16, bh = 0.5, ch = 1.0;
  P.box(mat, x - r * 1.32, x + r * 1.32, y0, y0 + 0.24, z - r * 1.32, z + r * 1.32, 'b', 3);                    // plinth block
  P.cyl(mat, [x, y0 + 0.24, z], [x, y0 + bh, z], r * 1.2, r * 1.02, seg, false);                               // torus base
  P.cyl(mat, [x, y0 + bh, z], [x, y1 - ch, z], r, r * 0.86, seg, false);                                       // the shaft (entasis ignored)
  P.cyl(mat, [x, y1 - ch, z], [x, y1 - ch + 0.16, z], r * 0.92, r * 0.92, seg, false);                         // neck ring
  P.cyl(mat, [x, y1 - ch + 0.16, z], [x, y1 - 0.26, z], r * 0.92, r * 1.18, seg, false);                       // echinus
  P.box(mat, x - r * 1.3, x + r * 1.3, y1 - 0.26, y1, z - r * 1.3, z + r * 1.3, '', 3);                         // abacus
}

/** a half-round engaged column of the corner pavilions (axis at (x, z) a little in front of the wall plane z = 0) */
export function engaged(P, M, x, z, y0, y1, r = 0.75, o = {}) {
  const mat = o.mat || M.order, seg = o.seg ?? 14, ch = 0.9;
  const z0 = o.z0 ?? 0;                                                    // the wall plane in the host frame (0 in a facade frame, e.g. v of the wall in the academy frame)
  P.box(mat, x - r * 1.3, x + r * 1.3, y0, y0 + 0.4, z0, z + r * 1.3, 'kb', 3);
  P.cyl(mat, [x, y0 + 0.4, z], [x, y1 - ch, z], r, r * 0.88, seg, false);
  P.cyl(mat, [x, y1 - ch, z], [x, y1 - 0.3, z], r * 0.9, r * 1.14, seg, false);
  P.box(mat, x - r * 1.28, x + r * 1.28, y1 - 0.3, y1, z0, z + r * 1.28, 'kb', 3);
}

/** the fluted baseless Greek Doric column of the garden pavilion: a 20-gon shaft with a flared echinus and a square abacus */
export function greekDoric(P, M, x, z, y0, y1, r = 0.62, o = {}) {
  const mat = o.mat || M.order, seg = 20;
  P.cyl(mat, [x, y0, z], [x, y1 - 0.5, z], r, r * 0.8, seg, false);
  P.cyl(mat, [x, y1 - 0.5, z], [x, y1 - 0.2, z], r * 0.82, r * 1.12, 16, false);
  P.box(mat, x - r * 1.2, x + r * 1.2, y1 - 0.2, y1, z - r * 1.2, z + r * 1.2, '', 3);
}

/** entablature between x0 and x1 over the depth z0..z1 (a free-standing block above columns), y0 = bottom: architrave 0.65, frieze 0.9 (M.frieze), corona 0.75 with a soffit; faces +z (front) and both ends */
export function entabl(P, M, x0, x1, y0, z0, z1, o = {}) {
  const ar = 0.65, fr = o.frieze ?? 0.95, co = 0.8, ov = o.over ?? 0.9;
  P.box(M.order, x0, x1, y0, y0 + ar, z0, z1, 'b', 3);
  const yf = y0 + ar, len = x1 - x0, k = Math.max(1, Math.round(len / 2.5));
  const FM = o.friezeMat || M.frieze;
  P.quad(FM, [x0, yf, z1], [x1, yf, z1], [x1, yf + fr, z1], [x0, yf + fr, z1], [0, 0, 1], [[0, 0], [len / 1.25, 0], [len / 1.25, fr / 1.25], [0, fr / 1.25]]);
  P.quad(FM, [x1, yf, z0], [x0, yf, z0], [x0, yf + fr, z0], [x1, yf + fr, z0], [0, 0, -1], [[0, 0], [len / 1.25, 0], [len / 1.25, fr / 1.25], [0, fr / 1.25]]);
  for (const [xx, s] of [[x0, -1], [x1, 1]]) P.quad(FM, [xx, yf, s > 0 ? z1 : z0], [xx, yf, s > 0 ? z0 : z1], [xx, yf + fr, s > 0 ? z0 : z1], [xx, yf + fr, s > 0 ? z1 : z0], [s, 0, 0], [[0, 0], [(z1 - z0) / 1.25, 0], [(z1 - z0) / 1.25, fr / 1.25], [0, fr / 1.25]]);
  P.box(M.order, x0 - 0.42, x1 + 0.42, yf + fr, yf + fr + 0.25, z0 - 0.42, z1 + 0.42, 'b', 3);     // bed mould
  const yc = yf + fr + 0.25;
  P.box(M.order, x0 - ov, x1 + ov, yc, yc + co - 0.25, z0 - ov, z1 + ov, 'b', 3);                                 // corona
  P.quad(M.soffit, [x0 - ov, yc, z1 + ov], [x1 + ov, yc, z1 + ov], [x1 + ov, yc, z0 - ov], [x0 - ov, yc, z0 - ov], [0, -1, 0]);
  void k;
  return yc + co - 0.25;
}

/** a baluster run along x from x0 to x1 at depth z, base y: plinth, rail, textured balusters, pedestals every `step` */
export function baluster(P, M, x0, x1, y, z, o = {}) {
  const h = o.h ?? 0.95, t = o.t ?? 0.3, ped = o.ped ?? 0.6, mat = o.mat || M.order, len = x1 - x0;
  P.box(mat, x0, x1, y, y + 0.18, z - t / 2, z + t / 2, 'b', 3); P.box(mat, x0, x1, y + h - 0.14, y + h, z - t / 2 - 0.03, z + t / 2 + 0.03, '', 3);
  const n = Math.max(1, Math.round(len / (o.step ?? 4.0))), xs = []; for (let i = 0; i <= n; i++) xs.push(x0 + (len * i) / n);
  for (const x of xs) P.box(mat, Math.max(x0, x - ped / 2), Math.min(x1, x + ped / 2), y + 0.18, y + h - 0.14, z - t / 2 - 0.02, z + t / 2 + 0.02, 'tb', 3);
  for (let i = 0; i < n; i++) {
    const a = xs[i] + ped / 2, b = xs[i + 1] - ped / 2; if (b - a < 0.3) continue;
    const k = Math.max(1, Math.round((b - a) / 0.3));
    P.quad(M.balus, [a, y + 0.18, z], [b, y + 0.18, z], [b, y + h - 0.14, z], [a, y + h - 0.14, z], [0, 0, 1], [[0, 0], [k, 0], [k, 1], [0, 1]]);       // (M.balus is double sided: one quad)
  }
}
export { TAU };
