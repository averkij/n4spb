// landmarksAurora/roofs.js - hipped roofs over convex rings (straight-skeleton facets by half-plane clipping) and small helpers shared by the building files.
//   hipRoof(P, mat, ring, yEaves, rise, over): the roof of the convex ring `ring` ([[x,z]..]); the eaves run `over` m outside the ring, the ridge is `rise` m above yEaves over the wall line of the
//   inscribed middle (slope = rise / inradius, capped), every facet is planar and has its own uv (u along the eaves, v down the slope, 2.4 m tiles: the seams of the sheet run down the slope).
import { inflate } from './surfaces.js';

export const hull = (pts) => {                              // Andrew's monotone chain; returns CCW ring ([x,z] with z south: "CCW" only as a name)
  const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
};
export const signedArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1]; } return a / 2; };

function clipHalf(poly, f) {                                // keep the part where f(p) <= 0
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}

export function hipRoof(P, mat, ring0, yE, rise, over = 0.7, o = {}) {
  let ring = ring0.slice(); if (signedArea(ring) < 0) ring.reverse();
  const n0 = ring.length;
  const wall = ring;                                           // the wall line (inward distances measured from here)
  const R = inflate(ring, over);
  const edges = [];
  for (let i = 0; i < n0; i++) {                               // inward normals of the OFFSET ring edges
    const a = R[i], b = R[(i + 1) % n0], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    edges.push({ a, t: [dx / l, dz / l], m: [-dz / l, dx / l], len: l });
  }
  // inward direction check: the centroid must have positive distance
  let cx = 0, cz = 0; for (const q of R) { cx += q[0]; cz += q[1]; } cx /= R.length; cz /= R.length;
  if ((cx - edges[0].a[0]) * edges[0].m[0] + (cz - edges[0].a[1]) * edges[0].m[1] < 0) for (const e of edges) e.m = [-e.m[0], -e.m[1]];
  const dist = (e, p) => (p[0] - e.a[0]) * e.m[0] + (p[1] - e.a[1]) * e.m[1];
  // inradius by sampling the bounding box (distance to the nearest edge LINE: valid for convex rings)
  let W = 0; { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of R) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) { const p = [x0 + (x1 - x0) * i / 24, z0 + (z1 - z0) * j / 24]; let m = 1e9; for (const e of edges) m = Math.min(m, dist(e, p)); if (m > W) W = m; } }
  const slope = Math.min(o.slopeMax ?? 0.6, rise / Math.max(2, W - over));
  const yEdge = yE - slope * over;
  let tris = 0;
  for (let i = 0; i < n0; i++) {
    const ei = edges[i];
    let poly = R.slice();
    for (let j = 0; j < n0 && poly.length >= 3; j++) {
      if (j === i) continue;
      const ej = edges[j];
      poly = clipHalf(poly, (p) => dist(ei, p) - dist(ej, p) - 1e-9);
    }
    if (poly.length < 3) continue;
    const pts = poly.map((p) => { const d = dist(ei, p); return [p[0], yEdge + slope * d, p[1]]; });
    const A = pts[0], B = pts[1], C = pts[2];
    let nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    // degenerate (collinear) start: use the analytic normal of the facet
    const al = Math.hypot(nx, ny, nz);
    if (al < 1e-6) { nx = -ei.m[0] * slope; ny = 1; nz = -ei.m[1] * slope; } else { nx /= al; ny /= al; nz /= al; }
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const cs = Math.sqrt(1 + slope * slope);
    P.fan(mat, pts, [nx, ny, nz], (q) => [((q[0] - ei.a[0]) * ei.t[0] + (q[2] - ei.a[1]) * ei.t[1]) / 2.4, ((q[0] - ei.a[0]) * ei.m[0] + (q[2] - ei.a[1]) * ei.m[1]) * cs / 2.4]);
    tris += pts.length - 2;
  }
  const height = (x, z) => { let m = 1e9; for (const e of edges) m = Math.min(m, dist(e, [x, z])); return m < 0 ? null : yEdge + slope * m; };
  return { tris, slope, W, ring: R, height };
}
