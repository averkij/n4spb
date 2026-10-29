// landmarksPribaltiyskaya/ring.js - 2D ring helpers of the module (frame-local rings [[x, z], ...]): outward edge normals, vertical wall quads with tile-unit uv, sloped caps, extruded prisms, and collider helpers
// that take frame-local coordinates (a collider of a box given in a Parts frame F is placed at F.W(cx, cz) with rotY = F.rot + the local turn).
import * as THREE from 'three';

export const area2 = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
/** edges of a closed ring with OUTWARD unit normals n = [nx, nz]: [{ i, a, b, len, n, t }] (t = unit direction a -> b) */
export function edgesOf(ring) {
  const A = area2(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    out.push({ i, a, b, len, n: [dz / len * A, -dx / len * A], t: [dx / len, dz / len] });
  }
  return out;
}
/** one vertical quad on the edge a -> b from y0 to y1 with outward normal n; uv: u from u0 to u1 along the edge, v from v0 to v1 (tile units) */
export function wallQuad(P, mat, a, b, n, y0, y1, u0, u1, v0, v1) {
  P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [n[0], 0, n[1]], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
}
/** a wall quad over [t0, t1] (metres along the edge) of edge e */
export function wallPart(P, mat, e, t0, t1, y0, y1, uPerM, vPerM, vOff = 0, uOff = 0) {
  const a = [e.a[0] + e.t[0] * t0, e.a[1] + e.t[1] * t0], b = [e.a[0] + e.t[0] * t1, e.a[1] + e.t[1] * t1];
  wallQuad(P, mat, a, b, e.n, y0, y1, uOff + t0 * uPerM, uOff + t1 * uPerM, y0 * vPerM + vOff, y1 * vPerM + vOff);
}
/** a cap polygon whose height follows y = yf(x, z) (a plane): normal from the numeric gradient.  pts [[x, z]..], holes [[[x, z]..]] */
export function slopedCap(P, mat, pts, yf, uvs = 4, holes = []) {
  const c2 = pts.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const tris = THREE.ShapeUtils.triangulateShape(c2, h2), all = pts.concat(...holes), k = P.bucket(mat), base = k.n;
  const cx = pts[0][0], cz = pts[0][1], gx = (yf(cx + 1, cz) - yf(cx, cz)), gz = (yf(cx, cz + 1) - yf(cx, cz)), nl = Math.hypot(gx, 1, gz), nx = -gx / nl, ny = 1 / nl, nz = -gz / nl;
  for (const p of all) P._vert(k, p[0], yf(p[0], p[1]), p[1], nx, ny, nz, p[0] / uvs, p[1] / uvs);
  for (const [a, b, c] of tris) {
    const A = all[a], B = all[b], C = all[c], cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
    if (cy > 0) k.idx.push(base + a, base + b, base + c); else k.idx.push(base + a, base + c, base + b);
    P.tris++;
  }
}
/** a prism over a ring: walls from y0 to the top y1 (number or fn(x, z)), a flat (or sloped) cap on top.  mats { wall, top }; uvs metres per uv unit (walls: u along, v up) */
export function prism(P, ring, y0, y1, mats, o = {}) {
  const yf = typeof y1 === 'function' ? y1 : () => y1, uvs = o.uvs ?? 3;
  for (const e of edgesOf(ring)) {
    if (o.skip && o.skip(e)) continue;
    const ya = yf(e.a[0], e.a[1]), yb = yf(e.b[0], e.b[1]), m = typeof mats.wall === 'function' ? mats.wall(e) : mats.wall, L = e.len / uvs;
    P.quad(m, [e.a[0], y0, e.a[1]], [e.b[0], y0, e.b[1]], [e.b[0], yb, e.b[1]], [e.a[0], ya, e.a[1]], [e.n[0], 0, e.n[1]], [[0, y0 / uvs], [L, y0 / uvs], [L, yb / uvs], [0, ya / uvs]]);
  }
  if (mats.top && !o.noTop) { if (typeof y1 === 'function') slopedCap(P, mats.top, ring, yf, uvs, o.holes || []); else P.cap(mats.top, ring, y1, true, uvs, o.holes || []); }
}
export const mirrorX = (ring, k = 0) => ring.map(([x, z]) => [-x - k, z]);
export const bounds = (ring) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { x0, x1, z0, z1 }; };

// ------------------------------------------------------------------------------------------------ colliders in a Parts frame F ({ W, rot })
/** a solid box given in frame coordinates: centre (cx, cz), size w (frame x) x d (frame z), turned by `turn` about y */
export function boxF(ph, F, cx, cz, w, d, y0, y1, turn = 0) { const p = F.W(cx, cz); return ph.addBox(p.x, p.z, w, d, F.rot + turn, y0, y1); }
/** walkable flat top over the frame rectangle [x0, x1] x [z0, z1] (a solid column from `bottom` up to `top`) */
export function walkF(ph, F, x0, x1, z0, z1, top, bottom, turn = 0) { const p = F.W((x0 + x1) / 2, (z0 + z1) / 2); return ph.addWalkBox(p.x, p.z, x1 - x0, z1 - z0, F.rot + turn, top, bottom); }
/** thin wall boxes along the edges of a frame-local ring (y0 .. y1, thickness th): the ring is a closed wall */
export function ringBoxes(ph, F, ring, y0, y1, th = 0.6, closed = true) {
  const n = ring.length, m = closed ? n : n - 1; let c = 0;
  for (let i = 0; i < m; i++) {
    const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.2) continue;
    boxF(ph, F, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len + th * 0.5, th, y0, y1, Math.atan2(-dz, dx)); c++;
  }
  return c;
}
/** a walkable strip behind the edge a -> b of a ring: depth d toward the inside (side = -1) or the outside (+1) of the outward normal */
export function walkStrip(ph, F, a, b, n, d, top, bottom) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), cx = (a[0] + b[0]) / 2 - n[0] * d / 2, cz = (a[1] + b[1]) / 2 - n[1] * d / 2;
  const p = F.W(cx, cz); return ph.addWalkBox(p.x, p.z, len, d, F.rot + Math.atan2(-dz, dx), top, bottom);
}
/** point in ring */
export const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };

// ------------------------------------------------------------------------------------------------ a tapering rectangular block (pedestals): four sides + top, centred on (cx, cz) of the current frame
/** bottom w0 x d0 at y0, top w1 x d1 at y1 (no bottom face); uvs = metres per uv unit */
export function taper(P, mat, cx, cz, w0, d0, w1, d1, y0, y1, uvs = 2, noTop = false) {
  const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], pt = (s, w, d, y) => [cx + s[0] * w / 2, y, cz + s[1] * d / 2];
  for (let i = 0; i < 4; i++) {
    const a = cs[i], b = cs[(i + 1) % 4], n = [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2], len = Math.hypot(pt(b, w0, d0, 0)[0] - pt(a, w0, d0, 0)[0], pt(b, w0, d0, 0)[2] - pt(a, w0, d0, 0)[2]) / uvs;
    P.quad(mat, pt(a, w0, d0, y0), pt(b, w0, d0, y0), pt(b, w1, d1, y1), pt(a, w1, d1, y1), n, [[0, y0 / uvs], [len, y0 / uvs], [len, y1 / uvs], [0, y1 / uvs]]);
  }
  if (!noTop) P.quad(mat, [cx - w1 / 2, y1, cz + d1 / 2], [cx + w1 / 2, y1, cz + d1 / 2], [cx + w1 / 2, y1, cz - d1 / 2], [cx - w1 / 2, y1, cz - d1 / 2], [0, 1, 0]);
}
