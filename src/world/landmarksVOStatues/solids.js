// landmarksVOStatues/solids.js - small solid builders on top of the Parts collector (kit.js) and the figure-kit loft (lib/figures.js): lathe (revolved profile), prism (extruded polygon), step stacks,
// tube / blob placement with the current vertex tint, and a tinted figure placement.  Every builder works in the CURRENT frame of the collector (origin on the ground, +z = front of the monument).
import * as THREE from 'three';
import { tube, blob, blobBetween, Figure } from '../lib/figures.js';

/** revolved profile [[r, y], ...] from the bottom up around the y axis; flat caps where the end radius > 0.  uv: u around, v along the profile in metres */
export function lathe(P, mat, prof, seg = 20, o = {}) {
  const pts = prof.map((p) => new THREE.Vector2(Math.max(0.0005, p[0]), p[1]));
  const g = new THREE.LatheGeometry(pts, seg, o.phi0 ?? 0, o.phi ?? Math.PI * 2);
  P.geo(mat, g, o.x ?? 0, o.y ?? 0, o.z ?? 0, 0, 0, 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? o.sx ?? 1); g.dispose();
  if (o.caps !== false) {
    const a = prof[0], b = prof[prof.length - 1], x = o.x ?? 0, y = o.y ?? 0, z = o.z ?? 0, sx = o.sx ?? 1, sy = o.sy ?? 1, sz = o.sz ?? sx;
    const ring = (r, yy) => Array.from({ length: seg }, (_, i) => { const t = i / seg * Math.PI * 2; return [x + Math.cos(t) * r * sx, y + yy * sy, z + Math.sin(t) * r * sz]; });
    if (a[0] > 0.01 && o.bottom) P.fan(mat, ring(a[0], a[1]).reverse(), [0, -1, 0], (p) => [p[0], p[2]]);
    if (b[0] > 0.01) P.fan(mat, ring(b[0], b[1]), [0, 1, 0], (p) => [p[0], p[2]]);
  }
  return P;
}

/** extruded polygon ring [[x, z], ...] from y0 to y1 (top cap, optional bottom cap), flat shaded sides.  uv in metres */
export function prism(P, mat, ring, y0, y1, o = {}) {
  let A = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; A += a[0] * b[1] - b[0] * a[1]; }
  const pts = A < 0 ? ring.slice().reverse() : ring.slice();          // counter-clockwise in the (x, z) plane read as (x right, z up): then the outward edge normal is (dz, -dx)
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [dz / l, 0, -dx / l], [[acc, y0], [acc + l, y0], [acc + l, y1], [acc, y1]]);
    acc += l;
  }
  if (o.top !== false) P.cap(mat, pts, y1, true, 1);
  if (o.bottom) P.cap(mat, pts, y0, false, 1);
  return P;
}

/** regular polygon ring (n sides, circumradius r, rotation a0) */
export const ngon = (r, n = 8, a0 = 0, cx = 0, cz = 0) => Array.from({ length: n }, (_, i) => { const t = a0 + i / n * Math.PI * 2; return [cx + Math.cos(t) * r, cz + Math.sin(t) * r]; });
/** rectangle ring centred at (cx, cz), half sizes hw, hd */
export const rectRing = (hw, hd, cx = 0, cz = 0) => [[cx - hw, cz - hd], [cx + hw, cz - hd], [cx + hw, cz + hd], [cx - hw, cz + hd]];

/** a stack of centred boxes: layers [[halfW, halfD, y0, y1], ...] (skip the bottom faces) */
export function stack(P, mat, layers, cx = 0, cz = 0) {
  for (const [hw, hd, y0, y1] of layers) P.box(mat, cx - hw, cx + hw, y0, y1, cz - hd, cz + hd, 'b');
  return P;
}

/** a lofted tube (figure-kit `tube`) in the current frame with the current tint */
export function loft(P, mat, path, rad, o = {}) { const g = tube(path, rad, o); P.geo(mat, g); g.dispose(); return P; }
/** an ellipsoid (figure-kit `blob`) in the current frame with the current tint */
export function ball(P, mat, c, r, o = {}) { const g = blob(c, r, o); P.geo(mat, g); g.dispose(); return P; }
export function ballBetween(P, mat, p, q, ra, rb, o = {}) { const g = blobBetween(p, q, ra, rb, o); P.geo(mat, g); g.dispose(); return P; }

/** a flat disc (fan) at height y, facing up; uv in metres * 1/uvs */
export function disc(P, mat, r, y, seg = 28, uvs = 2, cx = 0, cz = 0, up = true) {
  const pts = Array.from({ length: seg }, (_, i) => { const t = i / seg * Math.PI * 2; return [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]; });
  P.fan(mat, up ? pts : pts.slice().reverse(), [0, up ? 1 : -1, 0], (p) => [p[0] / uvs, p[2] / uvs]);
  return P;
}

/** place a figure-kit Figure with a tint per key (stone / painted bronze share one vertex-colour material): tints = { main, dark, accent } */
export function placeTinted(P, fig, mat, tints, x = 0, y = 0, z = 0, rotY = 0, s = 1, rx = 0, rz = 0) {
  for (const [key, g] of Object.entries(fig.geos)) { P.tint(tints[key] || tints.main); P.geo(mat, g, x, y, z, rx, rotY, rz, s, s, s); }
  return P;
}
/** place a figure with the materials of a set ({ main, dark, accent } = three.js materials), e.g. M.bronzeSet */
export function placeSet(P, fig, mats, x = 0, y = 0, z = 0, rotY = 0, s = 1, rx = 0, rz = 0) { fig.place(P, mats, x, y, z, rotY, s, rx, rz); return P; }

/**
 * a block with a curved top: x0..x1, z0..z1 footprint, top height hf(x, z) (smooth normals from the numerical gradient), vertical skirts down to y = base.
 * o: nu, nv grid cells along x / z, uv: fn(x, z) -> [u, v] for the top (default metres), skirtUv metres.
 */
export function heightBlock(P, mat, x0, x1, z0, z1, hf, o = {}) {
  const nu = o.nu ?? 16, nv = o.nv ?? 12, base = o.base ?? 0, e = 0.01, uvf = o.uv || ((x, z) => [x, z]);
  const k = P.bucket(mat), b0 = k.n, idxAt = (i, j) => b0 + j * (nu + 1) + i;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const x = x0 + (x1 - x0) * i / nu, z = z0 + (z1 - z0) * j / nv, y = hf(x, z);
    const dx = (hf(x + e, z) - hf(x - e, z)) / (2 * e), dz = (hf(x, z + e) - hf(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
    const uv = uvf(x, z); P._vert(k, x, y, z, -dx / l, 1 / l, -dz / l, uv[0], uv[1]);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = idxAt(i, j), b = idxAt(i + 1, j), c = idxAt(i + 1, j + 1), d = idxAt(i, j + 1); k.idx.push(a, d, c, a, c, b); P.tris += 2; }
  // skirts: each edge a strip from the top profile down to the base
  const sm = o.skirtMat || mat;
  const edge = (pts, n) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      P.quad(sm, [a[0], base, a[1]], [b[0], base, b[1]], [b[0], hf(b[0], b[1]), b[1]], [a[0], hf(a[0], a[1]), a[1]], n, [[a[0] + a[1], base], [b[0] + b[1], base], [b[0] + b[1], hf(b[0], b[1])], [a[0] + a[1], hf(a[0], a[1])]]);
    }
  };
  const line = (ax, az, bx, bz, n) => Array.from({ length: n + 1 }, (_, i) => [ax + (bx - ax) * i / n, az + (bz - az) * i / n]);
  edge(line(x0, z1, x1, z1, nu), [0, 0, 1]); edge(line(x1, z0, x0, z0, nu), [0, 0, -1]); edge(line(x0, z0, x0, z1, nv), [-1, 0, 0]); edge(line(x1, z1, x1, z0, nv), [1, 0, 0]);
  return P;
}

/** a truncated pyramid (rectangular frustum): half sizes (hw0, hd0) at y0 and (hw1, hd1) at y1, flat shaded, top cap; centred at (cx, cz) */
export function frustumBox(P, mat, hw0, hd0, hw1, hd1, y0, y1, cx = 0, cz = 0, o = {}) {
  const c = (sx, sz, y, hw, hd) => [cx + sx * hw, y, cz + sz * hd];
  const A = c(-1, -1, y0, hw0, hd0), B = c(1, -1, y0, hw0, hd0), C = c(1, 1, y0, hw0, hd0), D = c(-1, 1, y0, hw0, hd0);
  const a = c(-1, -1, y1, hw1, hd1), b = c(1, -1, y1, hw1, hd1), cc = c(1, 1, y1, hw1, hd1), d = c(-1, 1, y1, hw1, hd1);
  const nrm = (p, q, r) => { const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n) || 1; return n.map((t) => t / l); };
  const side = (p0, p1, p2, p3, out) => { let n = nrm(p0, p1, p2); if (n[0] * out[0] + n[2] * out[2] < 0) n = n.map((t) => -t); P.quad(mat, p0, p1, p2, p3, n, [[0, y0], [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), y0], [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), y1], [0, y1]]); };
  side(D, C, cc, d, [0, 0, 1]); side(B, A, a, b, [0, 0, -1]); side(A, D, d, a, [-1, 0, 0]); side(C, B, b, cc, [1, 0, 0]);
  if (o.top !== false) P.quad(mat, d, cc, b, a, [0, 1, 0], [[d[0], d[2]], [cc[0], cc[2]], [b[0], b[2]], [a[0], a[2]]]);
  return P;
}

/** a copy of a figure-kit Figure without the triangles that lie entirely below y (the part of a figure that sinks into a plinth) */
export function clipBelow(fig, y) {
  const geos = {}; let tris = 0;
  for (const [key, g] of Object.entries(fig.geos)) {
    const p = g.attributes.position, idx = g.index, keep = [];
    for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2); if (p.getY(a) < y && p.getY(b) < y && p.getY(c) < y) continue; keep.push(a, b, c); }
    if (!keep.length) continue;
    const h = g.clone(); h.setIndex(keep); h.computeBoundingBox(); h.computeBoundingSphere(); geos[key] = h; tris += keep.length / 3;
  }
  return new Figure(geos, Math.round(tris), fig.info);
}
