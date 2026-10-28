// landmarksStrelka/surfaces.js (copy of landmarksMars/surfaces.js) - ground-level ribbons and fills shared by the Field, the memorial and the Suvorov island: `ribbon()` lays a flat strip of constant width along a polyline (mitred
// corners, world-space uv so that overlapping coplanar strips look identical), clipped against the real asphalt (`net.cover`, road integrity rules of docs/AGENT-BRIEF.md); `fillPoly()` caps a
// polygon; `roadTest(ctx)` returns the carriageway test (streets' net.cover when the streets module is built, else layout.isOnRoad).
import * as THREE from 'three';
import * as L from '../layout.js';

/** true when (x, z) is on (or within `m` m of) real asphalt */
export function roadTest(ctx) {
  const net = ctx.services?.streets?.net;
  if (net && net.cover) return (x, z, m = 0) => net.cover(x, z, {}) > -m - 0.0001;
  return (x, z, m = 0) => L.isOnRoad(x, z, m);
}
/** distance-ish clearance: negative = clear of asphalt by that many metres (net.cover), 0 fallback */
export function coverFn(ctx) {
  const net = ctx.services?.streets?.net;
  return net && net.cover ? (x, z) => net.cover(x, z, {}) : (x, z) => (L.isOnRoad(x, z, 0) ? 1 : -5);
}

export function pairs(flat) { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; }
/** densify a polyline so that no segment is longer than maxLen */
export function densify(pts, maxLen = 2.5, closed = false) {
  const out = [], n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(len / maxLen));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export function chaikin(pts, it = 1, closed = false) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q = [], n = p.length, m = closed ? n : n - 1;
    if (!closed) q.push(p[0]);
    for (let i = 0; i < m; i++) {
      const a = p[i], b = p[(i + 1) % n];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) q.push(p[n - 1]);
    p = q;
  }
  return p;
}

/**
 * A flat strip along `pts` ([[x,z]..]) of width `w` at height y; material mat. o: { closed, tile (m per uv unit, default 3), clip: (x,z)->bool true = this point is on asphalt (the quad is dropped),
 * seg: densify step (2.5), side: shift of the centreline to the left (+) / right (-) in metres, keep: fn(x,z)->false drops quads (extra exclusion) }. Returns the number of quads.
 */
export function ribbon(P, mat, pts0, w, y, o = {}) {
  const closed = !!o.closed, tile = o.tile ?? 3, hw = w / 2;
  let pts = densify(pts0, o.seg ?? 2.5, closed);
  if (pts.length < 2) return 0;
  const n = pts.length;
  const dir = (i) => { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  const L_ = [], R_ = [];
  for (let i = 0; i < n; i++) {
    let d0, d1;
    if (closed) { d0 = dir((i + n - 1) % n); d1 = dir(i); } else { d0 = i > 0 ? dir(i - 1) : dir(i); d1 = i < n - 1 ? dir(i) : dir(i - 1); }
    let nx = -(d0[1] + d1[1]), nz = d0[0] + d1[0]; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    // left normal of a direction (dx, dz) is (-dz, dx)  [x east, z south: "left" is only a name]
    const k = Math.min(1.8, 1 / Math.max(0.35, nx * (-d1[1]) + nz * d1[0]));
    const sh = o.side || 0, p = pts[i];
    L_.push([p[0] + nx * (hw * k + sh), p[1] + nz * (hw * k + sh)]); R_.push([p[0] - nx * (hw * k - sh), p[1] - nz * (hw * k - sh)]);
  }
  const bad = o.clip, keep = o.keep;
  let cnt = 0; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % n, a = L_[i], b = L_[j], c = R_[j], d = R_[i];
    if (bad) {
      const mx = (a[0] + b[0] + c[0] + d[0]) / 4, mz = (a[1] + b[1] + c[1] + d[1]) / 4;
      if (bad(a[0], a[1]) || bad(b[0], b[1]) || bad(c[0], c[1]) || bad(d[0], d[1]) || bad(mx, mz)) continue;
    }
    if (keep) { const mx = (a[0] + b[0] + c[0] + d[0]) / 4, mz = (a[1] + b[1] + c[1] + d[1]) / 4; if (!keep(mx, mz)) continue; }
    P.quad(mat, [a[0], y, a[1]], [d[0], y, d[1]], [c[0], y, c[1]], [b[0], y, b[1]], [0, 1, 0], [[a[0] / tile, a[1] / tile], [d[0] / tile, d[1] / tile], [c[0] / tile, c[1] / tile], [b[0] / tile, b[1] / tile]]);
    cnt++;
  }
  return cnt;
}

/** a horizontal polygon (ring [[x,z]..], optional holes) at height y with world-space uv */
export function fillPoly(P, mat, ring, y, o = {}) { P.cap(mat, ring, y, true, o.tile ?? 3, o.holes || []); }

/** point in ring ([[x,z]..]) */
export function inRing(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }
/** distance from (x, z) to the polyline / ring */
export function distToLine(pts, x, z, closed = false) {
  let best = 1e9; const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); }
  return best;
}

/** ring offset outward by d (miter, any winding) */
export function inflate(ring, d) {
  const n = ring.length; let a = 0; for (let i = 0; i < n; i++) { const p = ring[i], q = ring[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
  const sgn = a > 0 ? 1 : -1, out = [];
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
/** a polygon cap subdivided so that no triangle edge is longer than maxEdge (keeps interpolation precise on huge lawns) */
export function fillPolyFine(P, mat, ring, y, o = {}) {
  const maxEdge = o.maxEdge ?? 24, tile = o.tile ?? 6, holes = o.holes || [];
  const c2 = ring.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const all = ring.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const emit = (A, B, C, depth) => {
    const lab = Math.hypot(B[0] - A[0], B[1] - A[1]), lbc = Math.hypot(C[0] - B[0], C[1] - B[1]), lca = Math.hypot(A[0] - C[0], A[1] - C[1]);
    if (depth < 8 && Math.max(lab, lbc, lca) > maxEdge) {
      if (lab >= lbc && lab >= lca) { const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; emit(A, m, C, depth + 1); emit(m, B, C, depth + 1); }
      else if (lbc >= lca) { const m = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; emit(A, B, m, depth + 1); emit(A, m, C, depth + 1); }
      else { const m = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]; emit(A, B, m, depth + 1); emit(m, B, C, depth + 1); }
      return;
    }
    const cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
    const t = cy > 0 ? [A, B, C] : [A, C, B];                          // face up (+y): same winding rule as Parts.cap
    const k = P.bucket(mat), base = k.n;
    for (const p of t) P._vert(k, p[0], y, p[1], 0, 1, 0, p[0] / tile, p[1] / tile);
    k.idx.push(base, base + 1, base + 2); P.tris++;
  };
  for (const [a, b, c] of tris) emit(all[a], all[b], all[c], 0);
}
