// landmarksKamennyChurch/util.js - shared helpers of the church / chapel parts: the equilateral lancet outline, windows, rings with corner piers, colliders.
import * as THREE from 'three';
import { planeShape, frameRing, solid, shapeOf } from './geo.js';
import { ringEdges } from './kit.js';

export const TAU = Math.PI * 2;

/** equilateral lancet (pointed) opening: width w, total height hTot, bottom y0, centre x -> points counter-clockwise (arcs of radius w about the opposite jamb) */
export function lancetPts(cx, y0, w, hTot, n = 8) {
  const hs = Math.max(0.01, hTot - 0.866 * w), pts = [[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, y0 + hs]];
  for (let i = 1; i <= n; i++) { const t = (Math.PI / 3) * i / n; pts.push([cx - w / 2 + w * Math.cos(t), y0 + hs + w * Math.sin(t)]); }
  for (let i = 1; i < n; i++) { const t = Math.PI * 2 / 3 + (Math.PI / 3) * i / n; pts.push([cx + w / 2 + w * Math.cos(t), y0 + hs + w * Math.sin(t)]); }
  pts.push([cx - w / 2, y0 + hs]);
  return pts;
}

/** run fn with the frames of every collector pushed (x, z, rotY) */
export function onAll(Ps, x, y, z, rot, fn) {
  for (const P of Ps) P.push(x, y, z, rot);
  try { return fn(); } finally { for (const P of Ps) P.pop(); }
}
/** frame of a facade with outward normal (nx, nz) at (x, z): local +x to the right seen from outside, +z out */
export const faceRot = (nx, nz) => Math.atan2(nx, nz);

/**
 * a church lancet window in the CURRENT facade frame (x along the wall, y up, z out): glazing decal, white surround proud of the wall, small sill.
 * o: { mat (decal material), fw (surround width), depth (surround proud) }
 */
export function lancetWindow(N, M, x, y0, w, h, o = {}) {
  const fw = o.fw ?? 0.2, depth = o.depth ?? 0.09, mat = o.mat || M.winLancet;
  planeShape(N, mat, lancetPts(x, y0, w, h), o.dz ?? 0.02);
  const outer = lancetPts(x, y0 - fw * 0.55, w + 2 * fw, h + fw * 0.55 + fw * 1.55), inner = lancetPts(x, y0, w, h);
  const z0 = o.z0 ?? 0;
  frameRing(N, M.white, outer, inner, z0, depth - z0);
  if (o.sill !== false) N.box(M.white, x - w / 2 - fw - 0.07, x + w / 2 + fw + 0.07, y0 - fw * 0.55 - 0.08, y0 - fw * 0.55, 0, depth + 0.1, 'b');
}

/** the ring of a plan with square corner piers at every CONVEX corner: pier = 0.55 m along each wall, 0.22 m proud.  ring: [[x, z]..] -> new ring, plus the convex corners [{ k: [x,z], n1, n2, dir }] */
export function pierRing(ring, pier = 0.55, out = 0.22) {
  const n = ring.length; let A = 0; for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const sgn = A > 0 ? 1 : -1, norm = (d) => (sgn > 0 ? [d[1], -d[0]] : [-d[1], d[0]]);
  const res = [], corners = [];
  for (let i = 0; i < n; i++) {
    const p = ring[(i + n - 1) % n], k = ring[i], q = ring[(i + 1) % n];
    const d1 = [k[0] - p[0], k[1] - p[1]], l1 = Math.hypot(...d1), d2 = [q[0] - k[0], q[1] - k[1]], l2 = Math.hypot(...d2);
    d1[0] /= l1; d1[1] /= l1; d2[0] /= l2; d2[1] /= l2;
    const cr = d1[0] * d2[1] - d1[1] * d2[0];
    if (cr * sgn > 0) {                                                                  // convex
      const n1 = norm(d1), n2 = norm(d2);
      res.push([k[0] - d1[0] * pier, k[1] - d1[1] * pier], [k[0] - d1[0] * pier + n1[0] * out, k[1] - d1[1] * pier + n1[1] * out],
        [k[0] + n1[0] * out + n2[0] * out, k[1] + n1[1] * out + n2[1] * out], [k[0] + d2[0] * pier + n2[0] * out, k[1] + d2[1] * pier + n2[1] * out], [k[0] + d2[0] * pier, k[1] + d2[1] * pier]);
      corners.push({ k, n1, n2 });
    } else res.push(k);
  }
  return { ring: res, corners };
}

/** offset of a RECTILINEAR ring outwards by d (every vertex moves by d * (n1 + n2)) */
export function offsetRect(ring, d) {
  const n = ring.length; let A = 0; for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const sgn = A > 0 ? 1 : -1, norm = (dd) => (sgn > 0 ? [dd[1], -dd[0]] : [-dd[1], dd[0]]);
  return ring.map((k, i) => {
    const p = ring[(i + n - 1) % n], q = ring[(i + 1) % n];
    const d1 = [k[0] - p[0], k[1] - p[1]], d2 = [q[0] - k[0], q[1] - k[1]]; const l1 = Math.hypot(...d1), l2 = Math.hypot(...d2);
    const n1 = norm([d1[0] / l1, d1[1] / l1]), n2 = norm([d2[0] / l2, d2[1] / l2]);
    return [k[0] + (n1[0] + n2[0]) * d, k[1] + (n1[1] + n2[1]) * d];
  });
}

/** thin collider boxes along a local polyline (world positions via frame F): addBox(len, thick) on every segment */
export function lineColliders(F, ph, pts, thick, y0, y1) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.2) continue;
    // local box: w along local x, d along local z -> rotate so that local x runs along the segment
    F.box(ph, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len + thick, thick, Math.atan2(-dz, dx), y0, y1);
  }
}

export { ringEdges, shapeOf, solid, frameRing, planeShape, THREE };
