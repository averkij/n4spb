// landmarksAndrew/loft.js - small geometry helpers on top of the Parts collector: `loft` joins equal-length rings into a smooth or faceted tube (bell roofs, needle spires, mansard / tent caps, bulbous turret caps),
// `ringAt` samples a rectangle at 2n directions (rectangle -> circle blends), `prismRoof` / `hipRoof` build hipped roofs over a rectangle, `gable` a triangular pediment with a raking cornice.
// Frame: the CURRENT Parts frame (y up).  All faces are wound outward (radial hint) so the vertex normals face away from the axis.
import * as G from './geo.js';

const TAU = Math.PI * 2;

/** rings = [[ [x, y, z] x n ] x m] (bottom -> top, all rings n points in the same angular order); mat; o: { uTile (m per uv unit around, default 2), vTile, smooth (average the normals of neighbouring faces), capTop (mat), capBot (mat), flat } */
export function loft(P, mat, rings, o = {}) {
  const n = rings[0].length, m = rings.length, uT = o.uTile ?? 2, vT = o.vTile ?? 2;
  const cen = rings.map((r) => [r.reduce((s, p) => s + p[0], 0) / n, r.reduce((s, p) => s + p[2], 0) / n]);
  for (let i = 0; i + 1 < m; i++) for (let k = 0; k < n; k++) {
    const k1 = (k + 1) % n, a = rings[i][k], b = rings[i][k1], c = rings[i + 1][k1], d = rings[i + 1][k];
    const mx = (a[0] + b[0] + c[0] + d[0]) / 4 - (cen[i][0] + cen[i + 1][0]) / 2, mz = (a[2] + b[2] + c[2] + d[2]) / 4 - (cen[i][1] + cen[i + 1][1]) / 2;
    const l = Math.hypot(mx, mz) || 1;
    // a face that leans outward (a skirt) gets a slightly upward normal, an inward-leaning cap a slightly upward one too: the radial hint is enough for the winding
    const du = Math.hypot(b[0] - a[0], b[2] - a[2]) / uT;
    P.quad(mat, a, b, c, d, [mx / l, 0.02, mz / l], [[k * du, a[1] / vT], [(k + 1) * du, b[1] / vT], [(k + 1) * du, c[1] / vT], [k * du, d[1] / vT]]);
  }
  const top = rings[m - 1], bot = rings[0];
  if (o.capTop) P.fan(o.capTop, top, [0, 1, 0], (q) => [q[0] / 2, q[2] / 2]);
  if (o.capBot) P.fan(o.capBot, bot, [0, -1, 0], (q) => [q[0] / 2, q[2] / 2]);
}

/** point of the rectangle with half extents (ha along x, hb along z) centred at (cx, cz) in direction angle t (0 = +z, toward +x) */
export function rectDir(cx, cz, ha, hb, t) {
  const sx = Math.sin(t), sz = Math.cos(t), r = Math.min(Math.abs(sx) > 1e-6 ? ha / Math.abs(sx) : 1e9, Math.abs(sz) > 1e-6 ? hb / Math.abs(sz) : 1e9);
  return [cx + sx * r, cz + sz * r];
}
/** a ring of 2n points at height y: the rectangle (ha, hb) blended with the circle of radius rc by w (0 = rectangle, 1 = circle), scaled by s */
export function ringAt(cx, cz, y, ha, hb, rc, w, n = 8, a0 = 0) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = a0 + k * TAU / n, [rx, rz] = rectDir(0, 0, ha, hb, t), cxp = Math.sin(t) * rc, czp = Math.cos(t) * rc;
    out.push([cx + rx * (1 - w) + cxp * w, y, cz + rz * (1 - w) + czp * w]);
  }
  return out;
}
/** a regular n-gon ring at height y */
export const polyRing = (cx, cz, y, r, n = 8, a0 = Math.PI / 8) => Array.from({ length: n }, (_, k) => [cx + Math.sin(a0 + k * TAU / n) * r, y, cz + Math.cos(a0 + k * TAU / n) * r]);

/** smoothstep */
export const sstep = (t) => t * t * (3 - 2 * t);

/** a hipped roof over the rectangle [x0, x1] x [z0, z1] (eave y0, ridge y1) with the ridge along x; west end (x0) hipped, east end (x1) hipped when hipE else open (abutting a wall) */
export function hipRoof(P, mat, x0, x1, z0, z1, y0, y1, o = {}) {
  const zc = (z0 + z1) / 2, hw = (z1 - z0) / 2, ux = o.tile ?? 2.2;
  const xr0 = x0 + hw * (o.hipW === false ? 0 : 1), xr1 = o.hipE ? x1 - hw : x1;
  const uv = (a, b) => [[a[0] / ux, a[2] / ux], [b[0] / ux, b[2] / ux]];
  void uv;
  const q = (p0, p1, p2, p3, n) => P.quad(mat, p0, p1, p2, p3, n, [[p0[0] / ux, p0[2] / ux], [p1[0] / ux, p1[2] / ux], [p2[0] / ux, p2[2] / ux], [p3[0] / ux, p3[2] / ux]]);
  q([x0, y0, z0], [x1, y0, z0], [xr1, y1, zc], [xr0, y1, zc], [0, 0.5, -1]);
  q([x1, y0, z1], [x0, y0, z1], [xr0, y1, zc], [xr1, y1, zc], [0, 0.5, 1]);
  if (o.hipW !== false) P.fan(mat, [[x0, y0, z1], [x0, y0, z0], [xr0, y1, zc]], [-1, 0.5, 0], (p) => [p[2] / ux, p[0] / ux]);
  if (o.hipE) P.fan(mat, [[x1, y0, z0], [x1, y0, z1], [xr1, y1, zc]], [1, 0.5, 0], (p) => [p[2] / ux, p[0] / ux]);
  return { xr0, xr1, zc };
}

/** a rectangular pyramid / hipped roof over a rectangle centred at (cx, cz): half extents ha x hb, eave y0, apex ridge y1 (a flat ridge of length rl along the longer side when rl > 0) */
export function pyramid(P, mat, cx, cz, ha, hb, y0, y1, rl = 0, tile = 2.2) {
  const along = ha >= hb, h = along ? hb : ha, L2 = rl / 2;
  const A = along ? [cx - L2, cz] : [cx, cz - L2], B = along ? [cx + L2, cz] : [cx, cz + L2];
  const c = [[cx - ha, cz - hb], [cx + ha, cz - hb], [cx + ha, cz + hb], [cx - ha, cz + hb]];
  const rid = along ? [A, B, B, A] : [A, A, B, B];     // ridge points at the corners: (-,-) (+,-) (+,+) (-,+)
  void h;
  const V = (p, y) => [p[0], y, p[1]];
  const q = (p0, p1, p2, p3, n) => P.quad(mat, p0, p1, p2, p3, n, [[p0[0] / tile, p0[2] / tile], [p1[0] / tile, p1[2] / tile], [p2[0] / tile, p2[2] / tile], [p3[0] / tile, p3[2] / tile]]);
  const r = [V(rid[0], y1), V(rid[1], y1), V(rid[2], y1), V(rid[3], y1)];
  q(V(c[0], y0), V(c[1], y0), r[1], r[0], [0, 0.6, -1]);
  q(V(c[1], y0), V(c[2], y0), r[2], r[1], [1, 0.6, 0]);
  q(V(c[2], y0), V(c[3], y0), r[3], r[2], [0, 0.6, 1]);
  q(V(c[3], y0), V(c[0], y0), r[0], r[3], [-1, 0.6, 0]);
}

/** a triangular pediment in the facade frame (+z out): base y0 from -hw to hw, apex y0 + rise, depth 0.5 raking cornice (white), tympanum (rose) set back; returns nothing */
export function gable(P, M, hw, y0, rise, o = {}) {
  const t = o.cornice ?? 0.45;
  const outer = [[-hw, y0], [hw, y0], [0, y0 + rise]];
  // inner triangle: inset by t along the slope normals
  const k = t / Math.cos(Math.atan2(rise, hw)), inn = [[-hw + t * 1.9, y0 + t * 0.9], [hw - t * 1.9, y0 + t * 0.9], [0, y0 + rise - k]];
  G.frameRing(P, M.white, outer, inn, 0, o.depth ?? 0.4, 1);
  P.fan(o.tympMat || M.rose, [[inn[0][0], inn[0][1], 0.04], [inn[1][0], inn[1][1], 0.04], [inn[2][0], inn[2][1], 0.04]], [0, 0, 1]);
  P.box(M.white, -hw - 0.15, hw + 0.15, y0 - 0.32, y0, 0, (o.depth ?? 0.4) + 0.15, 'b');                 // the horizontal cornice under the pediment
  P.quad(M.underside, [-hw - 0.15, y0 - 0.32, 0], [hw + 0.15, y0 - 0.32, 0], [hw + 0.15, y0 - 0.32, (o.depth ?? 0.4) + 0.15], [-hw - 0.15, y0 - 0.32, (o.depth ?? 0.4) + 0.15], [0, -1, 0]);
}
