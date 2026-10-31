// landmarksKronverk/frame.js - small data / geometry helpers of the module (dossier docs/research/kronverk.md): baked-record lookup, rings, offsets, frames.
//   Kit convention (kit.js Parts.push): local +x -> world (cos, -sin rotY), local +z -> world (sin, cos).  rotOf(dx, dz) = the rotY whose local +x is (dx, dz); rotOut(nx, nz) = the rotY whose local +z is (nx, nz).
import { BUILDINGS } from '../data/city.js';

export const rotOf = (dx, dz) => Math.atan2(-dz, dx);
export const rotOut = (nx, nz) => Math.atan2(nx, nz);
export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
const _byId = new Map(BUILDINGS.map((b) => [b.id, b]));
export const byId = (id) => _byId.get(id);
export const partsOf = (id) => BUILDINGS.filter((b) => b.parent === id && b.part);
export const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
export const ringArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1]; } return a / 2; };
export const centroid = (r) => { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; };
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** nearest point of a polyline to p: { p: [x, z], d, i, t } */
export function nearestOnLine(pts, p, closed = false) {
  let best = { p: pts[0], d: 1e9, i: 0, t: 0 }; const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    const q = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { p: q, d, i, t };
  }
  return best;
}
/** densify a polyline: no segment longer than step */
export function densify(pts, step = 3, closed = false) {
  const out = [], n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], k = Math.max(1, Math.ceil(dist(a, b) / step)); for (let j = 0; j < k; j++) out.push(lerp2(a, b, j / k)); }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
/** ring offset by d along the OUTWARD normals (negative = inward), mitred (limit 2.2), any winding */
export function offsetRing(ring, d) {
  const n = ring.length, sgn = ringArea(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n];
    const nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sgn, -dx / l * sgn]; };
    const n1 = nrm(p0, p1), n2 = nrm(p1, p2);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]));
    out.push([p1[0] + mx * d * k, p1[1] + mz * d * k]);
  }
  return out;
}
/** drop vertices closer than tol to the previous one and nearly collinear ones */
export function simplify(r, tol = 0.5) {
  let o = r.filter((p, i) => i === 0 || dist(p, r[i - 1]) > tol);
  if (o.length > 3 && dist(o[0], o[o.length - 1]) < tol) o.pop();
  for (let pass = 0; pass < 2; pass++) o = o.filter((p, i) => { const a = o[(i + o.length - 1) % o.length], b = o[(i + 1) % o.length], cr = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]), l = dist(a, b) || 1; return Math.abs(cr) / l > 0.12 || o.length <= 4; });
  return o;
}
/** a frame at origin O with local +x along the unit vector (ux, uz): W(lx, lz) -> world [x, z]; local +z = the right-hand normal (uz... see rot) */
export function frameAt(ox, oz, ux, uz) {
  const rot = rotOf(ux, uz), zx = Math.sin(rot), zz = Math.cos(rot);
  return { ox, oz, rot, ux, uz, zx, zz, W: (lx, lz) => [ox + ux * lx + zx * lz, oz + uz * lx + zz * lz], L: (x, z) => [(x - ox) * ux + (z - oz) * uz, (x - ox) * zx + (z - oz) * zz] };
}
