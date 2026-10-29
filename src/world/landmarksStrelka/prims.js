// landmarksStrelka/prims.js - small geometry helpers on top of the Parts collector (kit.js), all in the CURRENT Parts frame: horizontal plates split into cells, vertical wall quads with bay uv,
// lathe bodies (columns, shafts, bowls, domes), sloped slabs, vertical polygons, arcs of wall around a centre (the semicircle of the Spit).
import * as THREE from 'three';

export const TAU = Math.PI * 2;

/** horizontal rectangle at height y, split into cells of at most `cell` m (no huge triangles), uv = model metres / tile; up = false faces down */
export function plate(P, mat, x0, x1, z0, z1, y, o = {}) {
  const cell = o.cell ?? 14, tile = o.tile ?? 2.4, up = o.up !== false;
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), nz = Math.max(1, Math.ceil((z1 - z0) / cell));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const a = x0 + (x1 - x0) * i / nx, b = x0 + (x1 - x0) * (i + 1) / nx, c = z0 + (z1 - z0) * j / nz, d = z0 + (z1 - z0) * (j + 1) / nz;
    P.quad(mat, [a, y, d], [b, y, d], [b, y, c], [a, y, c], [0, up ? 1 : -1, 0], [[a / tile, d / tile], [b / tile, d / tile], [b / tile, c / tile], [a / tile, c / tile]]);
  }
}
/** vertical quad from a = [x, z] to b = [x, z], y0..y1, normal n = [nx, nz]; uv: u from u0 to u1 along a -> b, v from v0 to v1 upward */
export function vquad(P, mat, a, b, y0, y1, n, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
  P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [n[0], 0, n[1]], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
}
/** vertical wall with uv in metres / tile (plain or tiled materials), split along its length */
export function wall(P, mat, a, b, y0, y1, n, tile = 2.4, tileY = tile / 2, cell = 16) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(len / cell));
  for (let i = 0; i < k; i++) {
    const p = [a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k], q = [a[0] + (b[0] - a[0]) * (i + 1) / k, a[1] + (b[1] - a[1]) * (i + 1) / k];
    vquad(P, mat, p, q, y0, y1, n, len * i / k / tile, len * (i + 1) / k / tile, y0 / tileY, y1 / tileY);
  }
}
/** a body of revolution around the vertical axis at (cx, cz): profile [[r, y], ...] bottom to top; smooth normals; uv u = angle * uRep, v = along the profile */
export function lathe(P, mat, cx, cz, profile, seg = 16, uRep = 1) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);
  if (uRep !== 1) { const ua = g.attributes.uv; for (let i = 0; i < ua.count; i++) ua.setX(i, ua.getX(i) * uRep); }
  P.geo(mat, g, cx, 0, cz); g.dispose();
}
/** a lathe BufferGeometry (for instancing) */
export function latheGeo(profile, seg = 16) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg); }
/** sloped rectangle: corners a, b at height ya (edge 1) and c, d at height yb (edge 2), a-b parallel to d-c; normal up; split along a-b; uv in metres / tile along both directions */
export function slope(P, mat, a, b, ya, d, c, yb, o = {}) {
  const tile = o.tile ?? 0.6, len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(len / (o.cell ?? 14)));
  const run = Math.hypot(d[0] - a[0], d[1] - a[1], yb - ya);
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  for (let i = 0; i < k; i++) {
    const t0 = i / k, t1 = (i + 1) / k, p0 = lerp(a, b, t0), p1 = lerp(a, b, t1), q0 = lerp(d, c, t0), q1 = lerp(d, c, t1);
    P.quad(mat, [p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [q1[0], yb, q1[1]], [q0[0], yb, q0[1]], o.n || [0, 1, 0], [[len * t0 / tile, 0], [len * t1 / tile, 0], [len * t1 / tile, run / tile], [len * t0 / tile, run / tile]]);
  }
}
/** vertical polygon in the plane through a = [x, z] with unit direction t = [tx, tz]: pts [[s, y], ...] (s along t), facing n = [nx, nz]; uv from uvf(s, y) */
export function vpoly(P, mat, a, t, pts, n, uvf) {
  P.fan(mat, pts.map(([s, y]) => [a[0] + t[0] * s, y, a[1] + t[1] * s]), [n[0], 0, n[1]], uvf ? (p) => { const s = (p[0] - a[0]) * t[0] + (p[2] - a[1]) * t[1]; return uvf(s, p[1]); } : (p) => [((p[0] - a[0]) * t[0] + (p[2] - a[1]) * t[1]) / 2.4, p[1] / 1.2]);
}
/** point on a circle around c = [x, z]: angle a measured from +z toward +x */
export const pol = (c, R, a) => [c[0] + Math.sin(a) * R, c[1] + Math.cos(a) * R];
/** vertical wall along an arc (radius R around c, from a0 to a1), y0..y1 may be functions of the angle; outward = normal away from the centre; uv metres / tile */
export function arcWall(P, mat, c, R, a0, a1, y0, y1, outward = true, o = {}) {
  const tile = o.tile ?? 2.4, tileY = o.tileY ?? 1.2, n = Math.max(1, Math.ceil(Math.abs(a1 - a0) * R / (o.step ?? 2.2)));
  const f0 = typeof y0 === 'function' ? y0 : () => y0, f1 = typeof y1 === 'function' ? y1 : () => y1;
  for (let i = 0; i < n; i++) {
    const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n, p = pol(c, R, b0), q = pol(c, R, b1), bm = (b0 + b1) / 2, s = outward ? 1 : -1;
    const u0 = R * b0 / tile, u1 = R * b1 / tile;
    P.quad(mat, [p[0], f0(b0), p[1]], [q[0], f0(b1), q[1]], [q[0], f1(b1), q[1]], [p[0], f1(b0), p[1]], [Math.sin(bm) * s, 0, Math.cos(bm) * s], [[u0, f0(b0) / tileY], [u1, f0(b1) / tileY], [u1, f1(b1) / tileY], [u0, f1(b0) / tileY]]);
  }
}
/** flat or sloped ring sector between radii R0 and R1 around c, from a0 to a1, at height y (number or fn(angle)); up = normal +y; uv = model metres / tile */
export function arcFlat(P, mat, c, R0, R1, a0, a1, y, up = true, o = {}) {
  const tile = o.tile ?? 1.2, n = Math.max(1, Math.ceil(Math.abs(a1 - a0) * Math.max(R0, R1) / (o.step ?? 2.2))), fy = typeof y === 'function' ? y : () => y;
  const nr = Math.max(1, Math.ceil(Math.abs(R1 - R0) / (o.cellR ?? 6)));
  for (let i = 0; i < n; i++) for (let j = 0; j < nr; j++) {
    const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n, r0 = R0 + (R1 - R0) * j / nr, r1 = R0 + (R1 - R0) * (j + 1) / nr;
    const p = pol(c, r0, b0), q = pol(c, r0, b1), r = pol(c, r1, b1), s = pol(c, r1, b0);
    P.quad(mat, [p[0], fy(b0), p[1]], [q[0], fy(b1), q[1]], [r[0], fy(b1), r[1]], [s[0], fy(b0), s[1]], [0, up ? 1 : -1, 0], [[p[0] / tile, p[1] / tile], [q[0] / tile, q[1] / tile], [r[0] / tile, r[1] / tile], [s[0] / tile, s[1] / tile]]);
  }
}
/** an ashlar block (box) with the wall mapping on its sides (courses 0.6 m) and a plain top; skip: letters of the sides to omit (f +z, k -z, l -x, r +x, t top) */
export function gbox(P, mat, top, x0, x1, y0, y1, z0, z1, skip = '') {
  if (!skip.includes('f')) wall(P, mat, [x0, z1], [x1, z1], y0, y1, [0, 1]);
  if (!skip.includes('k')) wall(P, mat, [x0, z0], [x1, z0], y0, y1, [0, -1]);
  if (!skip.includes('l')) wall(P, mat, [x0, z0], [x0, z1], y0, y1, [-1, 0]);
  if (!skip.includes('r')) wall(P, mat, [x1, z0], [x1, z1], y0, y1, [1, 0]);
  if (!skip.includes('t')) plate(P, top, x0, x1, z0, z1, y1, { tile: 2.4 });
}
