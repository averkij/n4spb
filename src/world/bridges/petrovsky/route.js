// Provenance: copied verbatim from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/route.js), for the Betancourt and Serny bridges of Dekabristov Island (docs/gdm-B.md).
// bridges/petrovsky/route.js - a curved bridge axis as a ribbon of stations (shared by Betancourt, Bolshoy Petrovsky and the WHSD fairway bridge of bridges/petrovsky.js).
//   makeRoute(ctrl, step): Catmull-Rom through the control points [[x, z] ...] (local metres, x east, z south), re-sampled to stations ~step m apart:
//     { pts [[x, z]], S (arc length), tan [[tx, tz]], N, len, at(i, v) -> [x, z] (+v to the RIGHT of travel), pos(s, v) -> { x, z, tx, tz } at any arc length, sOf(x, z) -> nearest station info }
// Pure data + maths, no THREE: tools may import it.
export function makeRoute(ctrl0, step = 4, split = 0) {
  // split > 0: control segments longer than `split` m are cut into equal pieces first, so that the Catmull-Rom tangents of a 4 m end stub and a 250 m neighbour do not overshoot into a hook
  let ctrl = ctrl0;
  if (split > 0) { ctrl = [ctrl0[0]]; for (let i = 1; i < ctrl0.length; i++) { const a = ctrl0[i - 1], b = ctrl0[i], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / split)); for (let j = 1; j <= k; j++) ctrl.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); } }
  const n = ctrl.length, pts = [];
  for (let i = 0; i + 1 < n; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)], m = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; pts.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  pts.push(ctrl[n - 1]);
  const S0 = [0]; for (let i = 1; i < pts.length; i++) S0.push(S0[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = S0[S0.length - 1], K = Math.max(2, Math.round(len / step)), P = [], S = [];
  const raw = (s) => { let lo = 0, hi = S0.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S0[mid] <= s) lo = mid; else hi = mid; } const t = (s - S0[lo]) / ((S0[hi] - S0[lo]) || 1); return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t]; };
  for (let k = 0; k <= K; k++) { const s = len * k / K; S.push(s); P.push(raw(s)); }
  const N = P.length, tan = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
  const at = (i, v) => [P[i][0] - v * tan[i][1], P[i][1] + v * tan[i][0]];
  const find = (s) => { let lo = 0, hi = N - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid] <= s) lo = mid; else hi = mid; } return lo; };
  const pos = (s, v = 0) => {
    const i = find(Math.max(0, Math.min(len, s))), t = Math.max(0, Math.min(1, (s - S[i]) / ((S[i + 1] - S[i]) || 1)));
    const x = P[i][0] + (P[i + 1][0] - P[i][0]) * t, z = P[i][1] + (P[i + 1][1] - P[i][1]) * t;
    let tx = tan[i][0] + (tan[i + 1][0] - tan[i][0]) * t, tz = tan[i][1] + (tan[i + 1][1] - tan[i][1]) * t; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    return { x: x - v * tz, z: z + v * tx, tx, tz };
  };
  /** nearest point of the axis: { i, t, s, lat (+ right), d } (segment i -> i + 1, t 0..1 clamped) */
  const sOf = (x, z) => {
    let best = null;
    for (let i = 0; i + 1 < N; i++) {
      const dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], l2 = dx * dx + dz * dz || 1, t0 = ((x - P[i][0]) * dx + (z - P[i][1]) * dz) / l2, t = Math.max(0, Math.min(1, t0));
      const px = P[i][0] + dx * t, pz = P[i][1] + dz * t, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) { const l = Math.sqrt(l2); best = { i, t, t0, s: S[i] + (S[i + 1] - S[i]) * t, lat: -((x - P[i][0]) * dz - (z - P[i][1]) * dx) / l, d }; }
    }
    return best;
  };
  return { pts: P, S, tan, N, len, at, pos, sOf };
}
/** the centre line of a pair of one-way carriageways: way A (right-hand, in travel order) shifted `off` metres to its LEFT; ctrl nodes of A */
export function leftOffset(A, off) {
  const n = A.length;
  return A.map((p, i) => { const a = A[Math.max(0, i - 1)], b = A[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [p[0] + dz / l * off, p[1] - dx / l * off]; });
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
