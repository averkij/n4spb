// landmarksGavan/prims.js - small roof / loft / ring primitives on top of the Parts collector (kit.js), shared by every part of the module.
//   quadSafe   a quad that survives a degenerate edge (a zero-width strip of a loft becomes a triangle with the right normal)
//   loft       a closed or open surface between consecutive rings of 3D points (bell roofs, onion-like caps)
//   gableRoof  a gable roof over an axis-aligned rectangle of the CURRENT frame (ridge along x or z), eaves / rake overhang, soffit, optional gable-end walls
//   hipRoof    a hip roof (four slopes) over a rectangle, optional truncated ridge
//   pyramid    a four-sided or n-sided pyramid roof over a polygon ring
import * as THREE from 'three';

const len3 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

/** quad a b c d with wanted normal n; a zero-length edge turns it into a triangle */
export function quadSafe(P, mat, a, b, c, d, n, uv) {
  if (len3(a, b) < 1e-4) return P.fan(mat, [a, c, d], n, uv ? (p) => [p[0], p[1]] : undefined);
  if (len3(c, d) < 1e-4) return P.fan(mat, [a, b, c], n);
  if (len3(b, c) < 1e-4) return P.fan(mat, [a, b, d], n);
  if (len3(d, a) < 1e-4) return P.fan(mat, [a, b, c], n);
  return P.quad(mat, a, b, c, d, n, uv);
}

/**
 * Surface between consecutive rings (arrays of [x, y, z], all rings the same length).  Normals point away from the axis `ax` = [x, z] (default the mean centre of each ring) and up by `up` (0.6).
 * o: { closed (true), up, uvs: metres per uv unit, flip }.  Returns the triangle count.
 */
export function loft(P, mat, rings, o = {}) {
  const closed = o.closed !== false, up = o.up ?? 0.6, uvs = o.uvs ?? 2, t0 = P.tris;
  for (let i = 0; i + 1 < rings.length; i++) {
    const A = rings[i], B = rings[i + 1], n = A.length, m = closed ? n : n - 1;
    let cx = 0, cz = 0; for (const p of A) { cx += p[0] / n; cz += p[2] / n; }
    for (let j = 0; j < m; j++) {
      const k = (j + 1) % n, a = A[j], b = A[k], c = B[k], d = B[j];
      const mx = (a[0] + b[0] + c[0] + d[0]) / 4 - cx, mz = (a[2] + b[2] + c[2] + d[2]) / 4 - cz, ml = Math.hypot(mx, mz) || 1;
      const nn = [mx / ml, up, mz / ml], s = o.flip ? -1 : 1;
      const uv = [[a[0] / uvs, a[2] / uvs], [b[0] / uvs, b[2] / uvs], [c[0] / uvs, c[2] / uvs], [d[0] / uvs, d[2] / uvs]];
      quadSafe(P, mat, a, b, c, d, [nn[0] * s, nn[1] * s, nn[2] * s], uv);
    }
  }
  return P.tris - t0;
}

/** four-sided roof ring of the bell roofs: the 8 points of a square (half width a, corners doubled) -> octagon (half flat o) at fraction w; side s has normal n_s; y given */
export function squareToOct(a, o, w, y) {
  const q = o * Math.tan(Math.PI / 8), pts = [];
  const N = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (let s = 0; s < 4; s++) {
    const [nx, nz] = N[s], tx = nz, tz = -nx;
    const sa = [a * nx - a * tx, a * nz - a * tz], sb = [a * nx + a * tx, a * nz + a * tz];
    const oa = [o * nx - q * tx, o * nz - q * tz], ob = [o * nx + q * tx, o * nz + q * tz];
    pts.push([sa[0] + (oa[0] - sa[0]) * w, y, sa[1] + (oa[1] - sa[1]) * w], [sb[0] + (ob[0] - sb[0]) * w, y, sb[1] + (ob[1] - sb[1]) * w]);
  }
  return pts;
}

/**
 * Gable roof over the rectangle x0..x1, z0..z1 of the current frame, eaves at height y, ridge y + rise.  ridgeAlongX: the ridge runs along x (the slopes face +z and -z).
 * o: { oe: eave overhang (0.3), og: rake overhang (0.15), top: slope material, under: soffit material, gable: material of the end walls (null = open), uvs, thick }.  Returns tris.
 */
export function gableRoof(P, mat, x0, x1, z0, z1, y, rise, ridgeAlongX = true, o = {}) {
  const oe = o.oe ?? 0.3, og = o.og ?? 0.15, t0 = P.tris, uvs = o.uvs ?? 2;
  if (ridgeAlongX) {
    const a = x0 - og, b = x1 + og, zm = (z0 + z1) / 2, za = z0 - oe, zb = z1 + oe, yr = y + rise * (1 + oe / ((z1 - z0) / 2)), ye = y - rise * oe / ((z1 - z0) / 2);
    P.quad(mat, [a, ye, za], [b, ye, za], [b, yr, zm], [a, yr, zm], [0, rise, -(z1 - z0) / 2], [[a / uvs, 0], [b / uvs, 0], [b / uvs, 1.5], [a / uvs, 1.5]]);
    P.quad(mat, [b, ye, zb], [a, ye, zb], [a, yr, zm], [b, yr, zm], [0, rise, (z1 - z0) / 2], [[b / uvs, 0], [a / uvs, 0], [a / uvs, 1.5], [b / uvs, 1.5]]);
    if (o.under) P.quad(o.under, [a, ye - 0.02, za], [b, ye - 0.02, za], [b, ye - 0.02, zb], [a, ye - 0.02, zb], [0, -1, 0]);
    if (o.gable) for (const x of [x0, x1]) P.fan(o.gable, [[x, y, z0], [x, y, z1], [x, y + rise, zm]], [x < (x0 + x1) / 2 ? -1 : 1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
  } else {
    const a = z0 - og, b = z1 + og, xm = (x0 + x1) / 2, xa = x0 - oe, xb = x1 + oe, yr = y + rise * (1 + oe / ((x1 - x0) / 2)), ye = y - rise * oe / ((x1 - x0) / 2);
    P.quad(mat, [xa, ye, b], [xa, ye, a], [xm, yr, a], [xm, yr, b], [-(x1 - x0) / 2, rise, 0], [[b / uvs, 0], [a / uvs, 0], [a / uvs, 1.5], [b / uvs, 1.5]]);
    P.quad(mat, [xb, ye, a], [xb, ye, b], [xm, yr, b], [xm, yr, a], [(x1 - x0) / 2, rise, 0], [[a / uvs, 0], [b / uvs, 0], [b / uvs, 1.5], [a / uvs, 1.5]]);
    if (o.under) P.quad(o.under, [xa, ye - 0.02, a], [xb, ye - 0.02, a], [xb, ye - 0.02, b], [xa, ye - 0.02, b], [0, -1, 0]);
    if (o.gable) for (const z of [z0, z1]) P.fan(o.gable, [[x0, y, z], [x1, y, z], [xm, y + rise, z]], [0, 0, z < (z0 + z1) / 2 ? -1 : 1], (p) => [p[0] / 3, p[1] / 3]);
  }
  return P.tris - t0;
}

/** hip roof over x0..x1, z0..z1: eaves y, ridge y + rise (the ridge is a segment of length max(0, long - short) along the long axis, or `ridgeLen`); overhang oe */
export function hipRoof(P, mat, x0, x1, z0, z1, y, rise, o = {}) {
  const oe = o.oe ?? 0.3, t0 = P.tris, w = x1 - x0, d = z1 - z0, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
  const short = Math.min(w, d), k = 1 + oe / (short / 2), yr = y + rise * k, ye = y - rise * (k - 1);
  const xa = x0 - oe, xb = x1 + oe, za = z0 - oe, zb = z1 + oe;
  const rl = o.ridgeLen ?? Math.max(0, Math.abs(w - d));
  const alongX = w >= d, hx = alongX ? rl / 2 : 0, hz = alongX ? 0 : rl / 2;
  const R0 = [xm - hx, yr, zm - hz], R1 = [xm + hx, yr, zm + hz];
  const A = [xa, ye, za], B = [xb, ye, za], C = [xb, ye, zb], D = [xa, ye, zb];
  const uv = (p) => [p[0] / 2, p[2] / 2];
  if (alongX) {
    P.quad(mat, A, B, R1, R0, [0, 1, -1], [[A[0] / 2, 0], [B[0] / 2, 0], [R1[0] / 2, 1.5], [R0[0] / 2, 1.5]]);
    P.quad(mat, C, D, R0, R1, [0, 1, 1], [[C[0] / 2, 0], [D[0] / 2, 0], [R0[0] / 2, 1.5], [R1[0] / 2, 1.5]]);
    if (rl > 1e-3) { P.fan(mat, [B, C, R1], [1, 1, 0], uv); P.fan(mat, [D, A, R0], [-1, 1, 0], uv); } else { P.fan(mat, [B, C, R1], [1, 1, 0], uv); P.fan(mat, [D, A, R0], [-1, 1, 0], uv); }
  } else {
    P.quad(mat, D, A, R0, R1, [-1, 1, 0], [[D[2] / 2, 0], [A[2] / 2, 0], [R0[2] / 2, 1.5], [R1[2] / 2, 1.5]]);
    P.quad(mat, B, C, R1, R0, [1, 1, 0], [[B[2] / 2, 0], [C[2] / 2, 0], [R1[2] / 2, 1.5], [R0[2] / 2, 1.5]]);
    P.fan(mat, [A, B, R0], [0, 1, -1], uv); P.fan(mat, [C, D, R1], [0, 1, 1], uv);
  }
  if (o.under) P.quad(o.under, [xa, ye - 0.02, za], [xb, ye - 0.02, za], [xb, ye - 0.02, zb], [xa, ye - 0.02, zb], [0, -1, 0]);
  return P.tris - t0;
}

/** pyramid roof over a ring of [x, z] points (convex) from y to the apex (ax, y + rise, az) with overhang `oe` (scale about the apex axis) */
export function pyramid(P, mat, ring, y, rise, o = {}) {
  const t0 = P.tris, n = ring.length;
  let cx = 0, cz = 0; for (const p of ring) { cx += p[0] / n; cz += p[1] / n; }
  const ax = o.ax ?? cx, az = o.az ?? cz, oe = o.oe ?? 0, apex = [ax, y + rise, az];
  const out = ring.map((p) => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * oe, y - rise * oe / (l || 1) * 0, p[1] + dz / l * oe]; });
  for (let i = 0; i < n; i++) {
    const a = out[i], b = out[(i + 1) % n], mx = (a[0] + b[0]) / 2 - cx, mz = (a[2] + b[2]) / 2 - cz, ml = Math.hypot(mx, mz) || 1;
    P.fan(mat, [a, b, apex], [mx / ml, 0.8, mz / ml], (p) => [p[0] / 2, p[2] / 2]);
  }
  return P.tris - t0;
}

/** a box rotated about y inside the current frame (centre cx, cz; half sizes hx, hz; heights y0..y1) */
export function rbox(P, mat, cx, cz, hx, hz, y0, y1, rotY, skip = '', uvs = 1) { P.push(cx, 0, cz, rotY); P.box(mat, -hx, hx, y0, y1, -hz, hz, skip, uvs); P.pop(); }

/** a sphere / ellipsoid in the current frame */
export function blob(P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) { const g = new THREE.SphereGeometry(1, seg, Math.max(4, seg >> 1)); P.geo(mat, g, x, y, z, 0, 0, 0, rx, ry, rz); g.dispose(); }

/** a thin bar between two 3D points (a 4-sided prism of half thickness r, any direction) */
export function bar(P, mat, a, b, r = 0.05, seg = 4) { P.cyl(mat, a, b, r, r, seg, false); }
