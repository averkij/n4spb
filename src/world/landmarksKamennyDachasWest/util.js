// landmarksKamennyDachasWest/util.js - helpers shared by the parts of the module: facade frames pushed on several collectors, windows (decal pane in the shell + surround in the near detail), roof builders (hip, gable,
// ogee tent) with metre texture coordinates, chimneys, balls / domes.  Coordinates: the CURRENT Parts frame of each house (y up); facade frame of an edge: x to the right seen from outside, z out.
import * as THREE from 'three';
import { frameOf } from './kit.js';
import { Q, surround, archSurround } from './facade.js';
import { archPts } from './geo.js';

export const TAU = Math.PI * 2;

/** run fn(len, frame) in the facade frame of edge e on every collector of Ps */
export function onE(Ps, e, fn) {
  const f = frameOf(e);
  for (const P of Ps) P.push(f.x, 0, f.z, f.rot);
  try { return fn(f.len, f); } finally { for (const P of Ps) P.pop(); }
}

/** evenly spaced centres along a wall of length len: margin from both ends, about `pitch` apart (at least one when len > 2 * margin) */
export function spread(len, pitch, margin) {
  const n = Math.max(0, Math.round((len - 2 * margin) / pitch));
  if (len - 2 * margin < 0.5) return [];
  if (n <= 1) return [len / 2];
  const out = []; for (let i = 0; i < n; i++) out.push(margin + (len - 2 * margin) * (i + 0.5) / n);
  return out;
}

/** a quad (roof plane / wall) with uv in metres / tu: u along p0->p1, v along p0->p3; the winding is flipped to face `hint` (default up) */
export function rq(P, mat, p0, p1, p2, p3, tu = 1.2, hint = [0, 1, 0]) {
  const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), l2 = Math.hypot(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]);
  P.quad(mat, p0, p1, p2, p3, hint, [[0, 0], [l1 / tu, 0], [l1 / tu, l2 / tu], [0, l2 / tu]]);
}
/** a triangle (gable / hip end) facing `hint`, uv by x / y in metres / tu (frame of the gable) */
export function tri(P, mat, a, b, c, hint, tu = 2.7, uvf) {
  P.fan(mat, [a, b, c], hint, uvf || ((p) => [(p[0] + p[2]) / tu, p[1] / tu]));
}

/** a hip roof over x0..x1, z0..z1 (eave at y, ridge at y + rise, overhang ov): ridge along the longer side; a square plan gives a pyramid */
export function hip(P, mat, o) {
  const { x0, x1, z0, z1, y, rise, ov = 0.5, tu = 1.2 } = o;
  const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2, w = X1 - X0, d = Z1 - Z0, yt = y + rise;
  let r0, r1;                                                        // ridge ends
  if (w >= d) { r0 = [X0 + d / 2, yt, cz]; r1 = [X1 - d / 2, yt, cz]; } else { r0 = [cx, yt, Z0 + w / 2]; r1 = [cx, yt, Z1 - w / 2]; }
  const c00 = [X0, y, Z0], c10 = [X1, y, Z0], c11 = [X1, y, Z1], c01 = [X0, y, Z1];
  rq(P, mat, c00, c10, r1, r0, tu);                                  // north (z0) slope
  rq(P, mat, c11, c01, r0, r1, tu);                                  // south slope
  P.fan(mat, [c01, c00, r0], [-1, 0.6, 0], (p) => [(p[2]) / tu, p[1] / tu]);   // west end
  P.fan(mat, [c10, c11, r1], [1, 0.6, 0], (p) => [(p[2]) / tu, p[1] / tu]);    // east end
}
/** a gable roof: ridge along `axis` ('x' or 'z'); the two gable ends are filled with gmat (a triangle in the wall plane, ovG = how far the roof overhangs the gable); optional gmat = null leaves them open */
export function gable(P, mat, gmat, o) {
  const { x0, x1, z0, z1, y, rise, ov = 0.5, ovG = 0.4, axis = 'x', tu = 1.2, gtu = 2.7 } = o;
  if (axis === 'x') {
    const X0 = x0 - ovG, X1 = x1 + ovG, Z0 = z0 - ov, Z1 = z1 + ov, cz = (z0 + z1) / 2, yt = y + rise;
    rq(P, mat, [X0, y, Z0], [X1, y, Z0], [X1, yt, cz], [X0, yt, cz], tu, [0, 1, -0.2]);
    rq(P, mat, [X1, y, Z1], [X0, y, Z1], [X0, yt, cz], [X1, yt, cz], tu, [0, 1, 0.2]);
    if (gmat) {
      for (const [xx, nx] of [[x0, -1], [x1, 1]]) P.fan(gmat, [[xx, y, z0], [xx, y, z1], [xx, yt, cz]], [nx, 0, 0], (p) => [p[2] / gtu, p[1] / gtu]);
    }
  } else {
    const Z0 = z0 - ovG, Z1 = z1 + ovG, X0 = x0 - ov, X1 = x1 + ov, cx = (x0 + x1) / 2, yt = y + rise;
    rq(P, mat, [X0, y, Z1], [X0, y, Z0], [cx, yt, Z0], [cx, yt, Z1], tu, [-0.2, 1, 0]);
    rq(P, mat, [X1, y, Z0], [X1, y, Z1], [cx, yt, Z1], [cx, yt, Z0], tu, [0.2, 1, 0]);
    if (gmat) {
      for (const [zz, nz] of [[z0, -1], [z1, 1]]) P.fan(gmat, [[x0, y, zz], [x1, y, zz], [cx, yt, zz]], [0, 0, nz], (p) => [p[0] / gtu, p[1] / gtu]);
    }
  }
}

/** a four-sided tent roof with a curved (concave) profile: levels t = 0..1 of the height, half sizes scaled by s(t); hw x hd half sizes at the eave, from y0 to y1 */
export function tent(P, mat, cx, cz, hw, hd, y0, y1, s = (t) => 1 - t, n = 8, tu = 1.5) {
  const lv = []; for (let i = 0; i <= n; i++) { const t = i / n; lv.push({ y: y0 + (y1 - y0) * t, a: hw * s(t), b: hd * s(t) }); }
  for (let i = 0; i < n; i++) {
    const A = lv[i], B = lv[i + 1];
    rq(P, mat, [cx - A.a, A.y, cz - A.b], [cx + A.a, A.y, cz - A.b], [cx + B.a, B.y, cz - B.b], [cx - B.a, B.y, cz - B.b], tu, [0, 0.6, -1]);
    rq(P, mat, [cx + A.a, A.y, cz + A.b], [cx - A.a, A.y, cz + A.b], [cx - B.a, B.y, cz + B.b], [cx + B.a, B.y, cz + B.b], tu, [0, 0.6, 1]);
    rq(P, mat, [cx - A.a, A.y, cz + A.b], [cx - A.a, A.y, cz - A.b], [cx - B.a, B.y, cz - B.b], [cx - B.a, B.y, cz + B.b], tu, [-1, 0.6, 0]);
    rq(P, mat, [cx + A.a, A.y, cz - A.b], [cx + A.a, A.y, cz + A.b], [cx + B.a, B.y, cz + B.b], [cx + B.a, B.y, cz - B.b], tu, [1, 0.6, 0]);
  }
}
/** a round cone / dome-like roof as a revolved profile pts [[r, y]..] around (cx, cz), `seg` sides, uv in metres / tu */
export function spin(P, mat, cx, cz, prof, seg = 16, tu = 1.5, a0 = 0, a1 = TAU) {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    const sl = (r0 - r1) / ((y1 - y0) || 1e-6);
    for (let j = 0; j < seg; j++) {
      const t0 = a0 + (a1 - a0) * j / seg, t1 = a0 + (a1 - a0) * (j + 1) / seg, tm = (t0 + t1) / 2;
      const p = (t, r, y) => [cx + Math.sin(t) * r, y, cz + Math.cos(t) * r];
      const len = Math.hypot(r0 - r1, y1 - y0), arc = r0 * (t1 - t0);
      P.quad(mat, p(t0, r0, y0), p(t1, r0, y0), p(t1, r1, y1), p(t0, r1, y1), [Math.sin(tm), sl * 0.9 + 0.001, Math.cos(tm)], [[0, 0], [arc / tu, 0], [arc * (r1 / (r0 || 1)) / tu, len / tu], [0, len / tu]]);
    }
  }
}
/** a brick chimney: shaft w x d from y0 to y1 with a slab cap */
export function chimney(P, M, x, z, y0, y1, w = 0.9, d = 0.9, mat) {
  const m = mat || M.pierBrick;
  P.box(m, x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2, 'b', 1.2);
  P.box(M.iron, x - w / 2 - 0.1, x + w / 2 + 0.1, y1, y1 + 0.12, z - d / 2 - 0.1, z + d / 2 + 0.1, 'b', 1);
}
/** a low ball / hemisphere of radius r at (x, y, z); `half` = a dome (upper half only) */
export function ball(P, mat, x, y, z, r, seg = 10, half = false, sy = 1) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1), 0, TAU, 0, half ? Math.PI / 2 : Math.PI);
  P.geo(mat, g, x, y, z, 0, 0, 0, 1, sy, 1); g.dispose();
}

/** a rectangular window in the facade frame: pane sheet S (decal) at the wall, surround boxes in N.  h = { cx, y0, w, h } */
export function win(P, N, S, sMat, h, o = {}) {
  const x0 = h.cx - h.w / 2, x1 = h.cx + h.w / 2, y0 = h.y0, y1 = h.y0 + h.h, z = o.z ?? 0.015;
  Q(P, S, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1]);
  if (sMat && N) surround(N, sMat, { x0, x1, y0, y1 }, { sw: o.sw ?? 0.14, proud: o.proud ?? 0.08, sill: o.sill ?? 0.1, key: o.key });
}
/** a round-headed window (arch): the pane is a fan of the arch outline mapped over the cell; surround = archivolt */
export function archWin(P, N, S, sMat, h, o = {}) {
  const z = o.z ?? 0.015, pts = archPts(h.cx, h.y0, h.w, h.h, 12), u = S.uv, x0 = h.cx - h.w / 2;
  P.fan(S.mat, pts.map((p) => [p[0], p[1], z]), [0, 0, 1], (p) => [u[0] + (u[2] - u[0]) * (p[0] - x0) / h.w, u[1] + (u[3] - u[1]) * (p[1] - h.y0) / h.h]);
  if (sMat && N) archSurround(N, sMat, { cx: h.cx, y0: h.y0, w: h.w, h: h.h }, { sw: o.sw ?? 0.14, proud: o.proud ?? 0.07, sill: o.sill, impost: false });
}

export { THREE };
