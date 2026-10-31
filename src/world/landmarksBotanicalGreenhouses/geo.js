// landmarksBotanicalGreenhouses/geo.js - the geometry vocabulary of the module (world metres, y up, x east, z SOUTH).
//   Frame of the complex: the axis of the greenhouse squares is 20.8 deg north of east (dossier 4.1a): EU = (cos 20.8, -sin 20.8) runs ENE, EV = (sin 20.8, cos 20.8) runs SSE.
//   pf(u, v) = world point of the dossier frame measured from the centre of the Palm House (-1523.3, -4154.1): the numbers of the OSM rings (Palm House u -19.6..21.5, v -13.9..14.2; Great
//   Subtropical u 81.4..106.7, v -151.8..-108.8; vestibule u 80.8..107.1, v -108.9..-91.0) are written in this frame in palm.js / n1.js / vest.js.
//   tileQuad: a bilinear grid of tiles with uv in [0,1] each (the atlas rule of art.js).   loftRing / capRing: walls and roof facets between two (inset) rings of a convex footprint.
//   rectOf: the oriented rectangle (longest edge) of a ring; leanTo / gable in house.js build on it.
import * as THREE from 'three';
import { ringFromFlat, signedArea } from '../lib/massing.js';

export const DEG = Math.PI / 180;
export const AXD = 20.8;
export const EU = [Math.cos(AXD * DEG), -Math.sin(AXD * DEG)], EV = [Math.sin(AXD * DEG), Math.cos(AXD * DEG)];
export const PALM_O = [-1523.3, -4154.1];
export const toXZ = (u, v, o = PALM_O) => [o[0] + u * EU[0] + v * EV[0], o[1] + u * EU[1] + v * EV[1]];
export const toUV = (x, z, o = PALM_O) => [(x - o[0]) * EU[0] + (z - o[1]) * EU[1], (x - o[0]) * EV[0] + (z - o[1]) * EV[1]];
export const pf = (u, v) => toXZ(u, v, PALM_O);

export const ringOfPoly = (b) => (b && b.polys && b.polys[0]) ? ringFromFlat(b.polys[0].o) : null;
export const lerp = (a, b, t) => a + (b - a) * t;
export const len2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export function centroid(ring) { let x = 0, z = 0; for (const p of ring) { x += p[0]; z += p[1]; } return [x / ring.length, z / ring.length]; }
/** outward unit normals of the edges of a ring (edge i runs from ring[i] to ring[i+1]) */
export function outNormals(ring) {
  const n = ring.length, s = signedArea(ring) > 0 ? 1 : -1;
  return ring.map((p, i) => { const q = ring[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [s * dz / l, -s * dx / l]; });
}
/** the ring pushed inwards by d metres with mitred corners (d < 0 pushes outwards); meant for convex footprints */
export function inset(ring, d) {
  const n = ring.length, N = outNormals(ring);
  return ring.map((p, i) => {
    const pn = N[(i + n - 1) % n], en = N[i], dot = pn[0] * en[0] + pn[1] * en[1], det = 1 - dot * dot;
    if (det < 1e-5) return [p[0] - en[0] * d, p[1] - en[1] * d];
    const s = (-d + d * dot) / det, t = (-d + d * dot) / det;
    return [p[0] + pn[0] * s + en[0] * t, p[1] + pn[1] * s + en[1] * t];
  });
}
/** oriented rectangle round a ring: long axis ax (unit, world x/z), short axis ay, centre c, half extents hx (along ax), hy (along ay) */
export function rectOf(ring) {
  let best = 0, bi = 0;
  for (let i = 0; i < ring.length; i++) { const l = len2(ring[i], ring[(i + 1) % ring.length]); if (l > best) { best = l; bi = i; } }
  const a = ring[bi], b = ring[(bi + 1) % ring.length];
  let ax = [(b[0] - a[0]) / best, (b[1] - a[1]) / best];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const ay = [-ax[1], ax[0]];
  for (const p of ring) { const u = p[0] * ax[0] + p[1] * ax[1], v = p[0] * ay[0] + p[1] * ay[1]; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
  const cu = (x0 + x1) / 2, cv = (y0 + y1) / 2;
  let r = { c: [ax[0] * cu + ay[0] * cv, ax[1] * cu + ay[1] * cv], ax, ay, hx: (x1 - x0) / 2, hy: (y1 - y0) / 2 };
  if (r.hy > r.hx) r = { c: r.c, ax: ay, ay: [-ay[1], ay[0]], hx: r.hy, hy: r.hx };
  return r;
}
export const rectRing = (r) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [r.c[0] + r.ax[0] * r.hx * sx + r.ay[0] * r.hy * sy, r.c[1] + r.ax[1] * r.hx * sx + r.ay[1] * r.hy * sy]);

// ------------------------------------------------------------------------------------------------ tiles
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** a bilinear grid of tiles over the quad p0 p1 (bottom edge, left -> right) p2 p3 (top edge, right -> left), every tile has the full uv 0..1; tile size tw x th metres (rounded to whole tiles).
 *  `toward` = a vector the faces must look towards (the outward direction of a wall, up for a roof). */
export function tileQuad(P, mat, p0, p1, p2, p3, tw, th, toward, o = {}) {
  const wb = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), wt = Math.hypot(p2[0] - p3[0], p2[1] - p3[1], p2[2] - p3[2]);
  const hl = Math.hypot(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]), hr = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
  const nu = Math.max(1, Math.round(Math.max(wb, wt) / tw)), nv = Math.max(1, Math.round(Math.max(hl, hr) / th));
  const q = (s, t) => { const bx = lerp(p0[0], p1[0], s), by = lerp(p0[1], p1[1], s), bz = lerp(p0[2], p1[2], s), tx = lerp(p3[0], p2[0], s), ty = lerp(p3[1], p2[1], s), tz = lerp(p3[2], p2[2], s); return [lerp(bx, tx, t), lerp(by, ty, t), lerp(bz, tz, t)]; };
  const uv = o.uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const s0 = i / nu, s1 = (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv;
    P.quad(mat, q(s0, t0), q(s1, t0), q(s1, t1), q(s0, t1), toward, uv);
  }
  return nu * nv;
}
/** a wall strip between two ground points A, B (x, z) from y0 up to the heights hA, hB (a gable end or a lean-to end is a trapezoid); n = outward [nx, nz] */
export function wallTiles(P, mat, A, B, y0, hA, hB, tw, th, n) {
  return tileQuad(P, mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], hB, B[1]], [A[0], hA, A[1]], tw, th, [n[0], 0, n[1]]);
}
/** the glass wall of a house: a low wall (up to 3.3 m) uses the lower half of the glassWall tile (X-bracing bay, 2.2 m), a tall one the full tile (4.4 m: X-bracing below, glazing bars above) */
export function glassWallTiles(P, M, A, B, y0, hA, hB, n) {
  const hmax = Math.max(hA, hB) - y0;
  if (hmax <= 3.3) return tileQuad(P, M.glassWall, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], hB, B[1]], [A[0], hA, A[1]], 2.0, 2.2, [n[0], 0, n[1]], { uv: [[0, 0], [1, 0], [1, 0.5], [0, 0.5]] });
  return wallTiles(P, M.glassWall, A, B, y0, hA, hB, 2.0, 4.4, n);
}
/** the same as one flat colour quad (no tiling) */
export function wallFlat(P, mat, A, B, y0, hA, hB, n) {
  P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], hB, B[1]], [A[0], hA, A[1]], [n[0], 0, n[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
/** facets between two rings of equal length (a at height yA, b at yB): one tile grid / quad per edge; tw > 0 = tiled with mat, 0 = one flat colour quad per edge.
 *  A flat annulus (yA == yB) faces up, or down with o.down; o.uv = the tile part to use (a half tile for a low band) */
export function loftRing(P, mat, ringA, yA, ringB, yB, tw, th, o = {}) {
  const n = ringA.length, N = outNormals(ringA), flat = Math.abs(yB - yA) < 1e-6;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, A0 = ringA[i], A1 = ringA[j], B0 = ringB[i], B1 = ringB[j];
    const out = flat ? [0, o.down ? -1 : 1, 0] : [N[i][0], Math.abs(yB - yA) > 0.3 && (yB - yA) < 0 ? -0.6 : 0.6, N[i][1]];
    if (!flat && o.vertical) out[1] = 0;
    if (tw) tileQuad(P, mat, [A0[0], yA, A0[1]], [A1[0], yA, A1[1]], [B1[0], yB, B1[1]], [B0[0], yB, B0[1]], tw, th, out, o.uv ? { uv: o.uv } : {});
    else P.quad(mat, [A0[0], yA, A0[1]], [A1[0], yA, A1[1]], [B1[0], yB, B1[1]], [B0[0], yB, B0[1]], out, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}
/** a flat polygon cap of a (convex) ring at height y (up) */
export function capRing(P, mat, ring, y, up = true) { P.cap(mat, ring, y, up, 2); }
/** vertical railing panels (alpha, double sided) over the edges of a ring at height y; h = panel height; skip(i) -> true omits edge i */
export function railRing(P, mat, ring, y, h = 1.0, skip) {
  const n = ring.length, N = outNormals(ring);
  for (let i = 0; i < n; i++) {
    if (skip && skip(i)) continue;
    const a = ring[i], b = ring[(i + 1) % n];
    tileQuad(P, mat, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], 1.8, h, [N[i][0], 0, N[i][1]]);
  }
}
/** a slim iron bar (4 sided) between two 3D points */
export function bar(D, mat, a, b, r = 0.045) { D.cyl(mat, a, b, r, r, 4, false); }
/** a pair of 3D points along an edge of a ring at the given s (0..1) for a post of height y0..y1 */
export const along = (a, b, s) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];
/** vertical posts (4-sided bars) every `pitch` metres along the edges of a ring (corners included) */
export function postsRing(D, mat, ring, y0, y1, pitch, r = 0.07, skip) {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    if (skip && skip(i)) continue;
    const a = ring[i], b = ring[(i + 1) % n], l = len2(a, b), k = Math.max(1, Math.round(l / pitch));
    for (let m = 0; m < k; m++) { const p = along(a, b, m / k); D.cyl(mat, [p[0], y0, p[1]], [p[0], y1, p[1]], r, r, 4, false); }
  }
}

/** hang a flat plate (w x h m, centre x y z, outward normal nx nz) on a wall through the shared label registry; returns false when the registry refuses it */
export function hangPlate(K, bld, mat, x, y, z, w, h, nx, nz, kind = 'plate') {
  const labels = K.ctx.services.labels;
  if (labels && labels.reserve && !labels.reserve(bld, x, y, z, w, h, nx, nz, kind)) return false;
  const ex = nz, ez = -nx;                                                           // along the wall (to the right seen from outside)
  const a = [x - ex * w / 2, z - ez * w / 2], b = [x + ex * w / 2, z + ez * w / 2];
  K.P.quad(mat, [a[0], y - h / 2, a[1]], [b[0], y - h / 2, b[1]], [b[0], y + h / 2, b[1]], [a[0], y + h / 2, a[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  return true;
}
