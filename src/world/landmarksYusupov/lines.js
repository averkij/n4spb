// landmarksYusupov/lines.js - polyline helpers for the courtyard walls, colonnade and fences: mitred offsets, even sampling along a line, a 3D strip prism (wall / beam / cornice along a polyline), local frames of a segment.
//   Points are world [x, z].  The "left" normal of a travel direction (dx, dz) is (dz, -dx) seen on the map (x east, z south): a ring that runs clockwise on the map has its inside on the left.
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const lineLen = (pts) => { let s = 0; for (let i = 0; i + 1 < pts.length; i++) s += dist(pts[i], pts[i + 1]); return s; };
export function inRingPts(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }
/** left normals at the vertices (mitre, length-compensated) */
export function vertexNormals(pts) {
  const n = pts.length, out = [];
  const seg = (i) => { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  for (let i = 0; i < n; i++) {
    const d0 = i > 0 ? seg(i - 1) : seg(0), d1 = i < n - 1 ? seg(i) : seg(n - 2);
    let nx = d0[1] + d1[1], nz = -(d0[0] + d1[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    const k = Math.min(2.5, 1 / Math.max(0.4, nx * d1[1] + nz * -d1[0]));
    out.push([nx * k, nz * k]);
  }
  return out;
}
/** the polyline shifted by d to the left (negative = right), mitred */
export function offsetLine(pts, d) { const N = vertexNormals(pts); return pts.map((p, i) => [p[0] + N[i][0] * d, p[1] + N[i][1] * d]); }
/** make the left side of the polyline the inside of `ring` (reverse the points if not); returns the possibly reversed copy */
export function leftIsInside(pts, ring, probe = 1.2) {
  let votes = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const m = lerp2(pts[i], pts[i + 1], 0.5), dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz) || 1; votes += inRingPts(ring, m[0] + dz / l * probe, m[1] - dx / l * probe) ? 1 : -1; }
  return votes >= 0 ? pts : pts.slice().reverse();
}
/** points every `pitch` m along the polyline (margins at both ends): [{ x, z, tx, tz, s }] with the unit tangent */
export function sampleLine(pts, pitch, m0 = 0, m1 = m0) {
  const L = lineLen(pts), inner = L - m0 - m1; if (inner < 0.01) return [];
  const n = Math.max(1, Math.round(inner / pitch)), out = [];
  for (let k = 0; k <= n; k++) {
    const s = m0 + inner * k / n; let acc = 0, i = 0;
    while (i + 1 < pts.length - 1 && acc + dist(pts[i], pts[i + 1]) < s) { acc += dist(pts[i], pts[i + 1]); i++; }
    const a = pts[i], b = pts[i + 1], l = dist(a, b) || 1, t = Math.min(1, Math.max(0, (s - acc) / l));
    out.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l, s });
  }
  return out;
}
/**
 * A prism strip along a polyline: between offsets off0 and off1 (to the left, off0 < off1), from y0 to y1.  mats = { left, right, top, under } (any may be missing).
 * Quads share the mitred vertices, so there are no overlapping faces.  uvs = metres per uv unit.
 */
export function strip3D(P, pts, off0, off1, y0, y1, mats, uvs = 2, o = {}) {
  const A = offsetLine(pts, off0), B = offsetLine(pts, off1);
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const l = dist(pts[i], pts[i + 1]), dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], dl = Math.hypot(dx, dz) || 1, nl = [dz / dl, -dx / dl];
    const a0 = A[i], a1 = A[i + 1], b0 = B[i], b1 = B[i + 1];
    const u0 = acc / uvs, u1 = (acc + l) / uvs, st = (o.stagger ?? 0.004) * (i % 3), Y0 = y0 - st, Y1 = y1 + st;     // segments overlap on the inside of a bend: stagger their tops / bottoms by a few mm so that no two coplanar faces fight
    // winding is fixed by the wanted normal (Parts.quad flips to match)
    if (mats.left) P.quad(mats.left, [a1[0], Y0, a1[1]], [a0[0], Y0, a0[1]], [a0[0], Y1, a0[1]], [a1[0], Y1, a1[1]], [-nl[0], 0, -nl[1]], [[u1, Y0 / uvs], [u0, Y0 / uvs], [u0, Y1 / uvs], [u1, Y1 / uvs]]);
    if (mats.right) P.quad(mats.right, [b0[0], Y0, b0[1]], [b1[0], Y0, b1[1]], [b1[0], Y1, b1[1]], [b0[0], Y1, b0[1]], [nl[0], 0, nl[1]], [[u0, Y0 / uvs], [u1, Y0 / uvs], [u1, Y1 / uvs], [u0, Y1 / uvs]]);
    if (mats.top) P.quad(mats.top, [a0[0], Y1, a0[1]], [a1[0], Y1, a1[1]], [b1[0], Y1, b1[1]], [b0[0], Y1, b0[1]], [0, 1, 0], [[a0[0] / 3, a0[1] / 3], [a1[0] / 3, a1[1] / 3], [b1[0] / 3, b1[1] / 3], [b0[0] / 3, b0[1] / 3]]);
    if (mats.under) P.quad(mats.under, [a0[0], Y0, a0[1]], [b0[0], Y0, b0[1]], [b1[0], Y0, b1[1]], [a1[0], Y0, a1[1]], [0, -1, 0]);
    acc += l;
  }
  if (o.caps) {
    const mk = (p, q, n) => P.quad(o.caps, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], n);
    const dx0 = pts[1][0] - pts[0][0], dz0 = pts[1][1] - pts[0][1], l0 = Math.hypot(dx0, dz0) || 1; mk(B[0], A[0], [-dx0 / l0, 0, -dz0 / l0]);
    const m = pts.length - 1, dx1 = pts[m][0] - pts[m - 1][0], dz1 = pts[m][1] - pts[m - 1][1], l1 = Math.hypot(dx1, dz1) || 1; mk(A[m], B[m], [dx1 / l1, 0, dz1 / l1]);
  }
}
/** push a frame at a point with local +x along (tx, tz) (z to the left-hand side of travel on the map: local +z = (-tz... see parts.fence): use inside P.push / P.pop */
export const frameAngle = (tx, tz) => Math.atan2(-tz, tx);
/** run fn() with the Parts frame at (x, z) whose local +x follows the tangent */
export function atTangent(P, x, z, tx, tz, fn) { P.push(x, 0, z, frameAngle(tx, tz)); try { return fn(); } finally { P.pop(); } }
/** the nearest point of a polyline to (x, z): { s, t (0..1 along), d } */
export function project(pts, x, z) {
  let best = { d: 1e9, s: 0 }, acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
    const d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
    if (d < best.d) best = { d, s: acc + Math.sqrt(l2) * t };
    acc += Math.sqrt(l2);
  }
  return best;
}
