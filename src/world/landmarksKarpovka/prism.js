// landmarksKarpovka/prism.js - small volume helpers on top of the Parts collector (kit.js) for the houses of the module: `walls()` walks a ring in the CURRENT Parts frame and runs a painter in
// the facade frame of every edge (x along the wall to the right seen from outside, y up, z out), `zones()` stacks textured bands, `baySheet()` lays a window sheet whose tile is one bay x one storey
// (art.js bay*), `cornice()` / `slabRing()` put a mitre-less projecting slab round a ring (convex corners overlap inside each other, concave ones are filled by the neighbour: no coplanar faces
// because every slab ends at its own wall line), `capRing()` closes the top.
import * as G from './geo.js';

/** signed area of a ring [[x,z]..] (positive = counter-clockwise in (x, z)) */
export const area2 = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
/** edges of a ring with outward normals: [{ i, a, b, len, n: [nx, nz], o: left end seen from outside }] */
export function ringEdges(r, minLen = 0.05) {
  const A = area2(r), out = [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < minLen) continue;
    let nx = dz / len, nz = -dx / len; if (A < 0) { nx = -nx; nz = -nz; }
    const fwd = dx * nz + dz * -nx > 0;
    out.push({ i, a, b, len, n: [nx, nz], o: fwd ? a : b, fwd });
  }
  return out;
}
/** run fn(len, edge) in the facade frame of every edge of the ring (skip(edge) === true leaves an edge out) */
export function walls(P, ring, fn, skip) {
  for (const e of ringEdges(ring)) { if (skip && skip(e)) continue; G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => fn(e.len, e)); }
}
/** stacked wall bands: zs = [[y0, y1, mat, tu, tv, z]..] */
export function zones(P, len, zs, u0 = 0) { for (const [y0, y1, mat, tu = 2, tv = tu, z = 0] of zs) G.wall(P, mat, u0, u0 + len, y0, y1, z, tu, tv); }
/** a window sheet: n bays of ~bayW along the wall, floors storeys between y0 and y1 (the tile of the texture = one bay x one storey) */
export function baySheet(P, mat, u0, u1, y0, y1, bayW, floors, z = 0) {
  const n = Math.max(1, Math.round((u1 - u0) / bayW));
  P.quad(mat, [u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y1, z], [0, 0, 1], [[0, 0], [n, 0], [n, floors], [0, floors]]);
  return n;
}
/** a projecting slab along every edge of the ring: from the wall line out to d, y0..y1 (front, underside, top and the two end faces) */
export function slabRing(P, ring, y0, y1, d, mat, skip) {
  walls(P, ring, (len) => P.box(mat, -d, len + d, y0, y1, -0.02, d, 'k'), skip);
}
/** flat cap of a ring at y */
export const capRing = (P, mat, ring, y, tile = 4) => P.cap(mat, ring, y, true, tile);
/** rectangle ring from two corners */
export const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
/** true when the edge lies on the line between p and q (both end points within tol of the segment p-q): used to skip the shared walls of adjoining volumes */
export function onSeg(e, p, q, tol = 0.15) {
  const d = (pt) => { const dx = q[0] - p[0], dz = q[1] - p[1], t = Math.max(0, Math.min(1, ((pt[0] - p[0]) * dx + (pt[1] - p[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(pt[0] - p[0] - dx * t, pt[1] - p[1] - dz * t); };
  return d(e.a) < tol && d(e.b) < tol;
}
