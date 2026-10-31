// landmarksZhdanovka/shapes.js - COPY of landmarksPetrovskyYacht/shapes.js (small shared geometry helpers: ring edges with outward normals, mitred inset / outset of a footprint ring, walls and railings along a ring, a gable roof, a point-in-polygon test).  Rings are [[x, z], ...] (open).
// a point-in-polygon test.  Rings are [[x, z], ...] (open), in the current Parts frame.
export const signedArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i][0] * r[j][1] - r[j][0] * r[i][1]; } return a / 2; };
/** edges of a ring with OUTWARD unit normals (for area > 0 the outward normal of a->b is (dz, -dx)) */
export function ringEdges(r) {
  const sg = signedArea(r) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1e-6;
    out.push({ i, a, b, len, n: [sg * dz / len, -sg * dx / len], t: [dx / len, dz / len] });
  }
  return out;
}
/** the ring pushed INWARD by d (negative d = outward), mitred corners: vertex - d * (n0 + n1) / (1 + n0.n1) */
export function insetRing(r, d) {
  const E = ringEdges(r), n = r.length, out = [];
  for (let i = 0; i < n; i++) {
    const e0 = E[(i + n - 1) % n], e1 = E[i], dot = e0.n[0] * e1.n[0] + e0.n[1] * e1.n[1], k = d / Math.max(0.2, 1 + dot);
    out.push([r[i][0] - (e0.n[0] + e1.n[0]) * k, r[i][1] - (e0.n[1] + e1.n[1]) * k]);
  }
  return out;
}
export function pointIn(r, x, z) {
  let ins = false;
  for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, zi] = r[i], [xk, zk] = r[k]; if ((zi > z) !== (zk > z) && x < (xk - xi) * (z - zi) / (zk - zi) + xi) ins = !ins; }
  return ins;
}
/** vertical walls along every edge of a ring: u = distance along the edge / tile (continuous), v = y / tileV; skip(e) -> true omits an edge */
export function wallsAlong(P, mat, r, y0, y1, tile = 3.4, tileV = 1, o = {}) {
  let acc = 0;
  for (const e of ringEdges(r)) {
    if (!(o.skip && o.skip(e))) {
      const u0 = o.continuous ? acc / tile : 0, u1 = o.continuous ? (acc + e.len) / tile : e.len / tile;
      const vb = o.vBase || 0; P.quad(mat, [e.a[0], y0, e.a[1]], [e.b[0], y0, e.b[1]], [e.b[0], y1, e.b[1]], [e.a[0], y1, e.a[1]], [e.n[0], 0, e.n[1]], [[u0, (y0 - vb) / tileV], [u1, (y0 - vb) / tileV], [u1, (y1 - vb) / tileV], [u0, (y1 - vb) / tileV]]);
    }
    acc += e.len;
  }
}
/** a flat strip between ring r (outer) and inset ring q at the constant height y (a ledge / top face), facing up */
export function stripBetween(P, mat, r, q, y, uvs = 2) {
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; P.quad(mat, [r[i][0], y, r[i][1]], [r[j][0], y, r[j][1]], [q[j][0], y, q[j][1]], [q[i][0], y, q[i][1]], [0, 1, 0], [[r[i][0] / uvs, r[i][1] / uvs], [r[j][0] / uvs, r[j][1] / uvs], [q[j][0] / uvs, q[j][1] / uvs], [q[i][0] / uvs, q[i][1] / uvs]]); }
}
/** a sloped band between ring r at y0 and its inset q at y1 (an eave slope / mansard), normal up and outward */
export function slopeBetween(P, mat, r, q, y0, y1, uvs = 1.2) {
  const E = ringEdges(r);
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length, e = E[i], dx = (q[i][0] + q[j][0]) / 2 - (r[i][0] + r[j][0]) / 2, dz = (q[i][1] + q[j][1]) / 2 - (r[i][1] + r[j][1]) / 2, run = Math.hypot(dx, dz) || 0.01, ny = run, nl = Math.hypot(ny, y1 - y0);
    const n = [e.n[0] * (y1 - y0) / nl, ny / nl, e.n[1] * (y1 - y0) / nl], sl = Math.hypot(run, y1 - y0);
    P.quad(mat, [r[i][0], y0, r[i][1]], [r[j][0], y0, r[j][1]], [q[j][0], y1, q[j][1]], [q[i][0], y1, q[i][1]], n, [[0, 0], [e.len / uvs, 0], [e.len / uvs, sl / uvs], [0, sl / uvs]]);
  }
}
/** an alpha fence / railing along a ring or polyline: quads of height h, u = length / tile; both faces (the material is double sided) */
export function fenceAlong(P, mat, pts, y0, h, tile = 2.0, closed = false) {
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
    const nx = (b[1] - a[1]) / len, nz = -(b[0] - a[0]) / len;
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y0 + h, b[1]], [a[0], y0 + h, a[1]], [nx, 0, nz], [[0, 0], [len / tile, 0], [len / tile, 1], [0, 1]]);
  }
}
/**
 * A gabled box roof over x0..x1 (ridge along x) and z0..z1: two slopes with eave overhang `ov` (z) and rake overhang `rk` (x), a thin fascia, the two gable-end triangles in `endMat`.
 * The ridge height yR is above the eave line yE.  uvs: texture metres per unit (sheet ribs run down the slope: u = x / uvs).
 */
export function gable(P, mat, endMat, x0, x1, z0, z1, yE, yR, ov = 0.4, rk = 0.3, uvs = 1.6, thick = 0.12) {
  const zc = (z0 + z1) / 2, k = (yR - yE) / ((z1 - z0) / 2), sl = Math.hypot(1, k), nS = [0, 1 / sl, -k / sl].map((v) => v), len = (z1 - z0) / 2 + ov;
  const ya = yE - ov * k;
  for (const sg of [-1, 1]) {                                                               // sg -1: north slope (towards z0), +1: south slope (towards z1)
    const zE = sg < 0 ? z0 - ov : z1 + ov, n = [0, 1 / sl, sg * k / sl], nd = [0, -1 / sl, -sg * k / sl], sLen = Math.hypot(len, yR - ya);
    P.quad(mat, [x0 - rk, ya, zE], [x1 + rk, ya, zE], [x1 + rk, yR, zc], [x0 - rk, yR, zc], n, [[(x0 - rk) / uvs, 0], [(x1 + rk) / uvs, 0], [(x1 + rk) / uvs, sLen / uvs], [(x0 - rk) / uvs, sLen / uvs]]);
    P.quad(mat, [x0 - rk, ya - thick / sl, zE], [x1 + rk, ya - thick / sl, zE], [x1 + rk, yR - thick / sl, zc], [x0 - rk, yR - thick / sl, zc], nd, [[(x0 - rk) / uvs, 0], [(x1 + rk) / uvs, 0], [(x1 + rk) / uvs, sLen / uvs], [(x0 - rk) / uvs, sLen / uvs]]);
    P.quad(mat, [x0 - rk, ya - thick / sl, zE], [x1 + rk, ya - thick / sl, zE], [x1 + rk, ya, zE], [x0 - rk, ya, zE], [0, 0, sg], [[0, 0], [(x1 - x0) / uvs, 0], [(x1 - x0) / uvs, thick / uvs], [0, thick / uvs]]);
  }
  void nS;
  for (const sx of [-1, 1]) {
    const x = sx < 0 ? x0 : x1;
    P.fan(endMat, [[x, yE, z0], [x, yE, z1], [x, yR, zc]], [sx, 0, 0], (p) => [p[2] / uvs, p[1] / uvs]);
  }
}
