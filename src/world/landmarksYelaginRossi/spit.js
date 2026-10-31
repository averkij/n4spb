// landmarksYelaginRossi/spit.js - the EAST SPIT and the GRANITE PIER of Yelagin Island (OSM r2590123 "Восточная стрелка" 31.6 x 30.3 m, r12316492 "Гранитная пристань"): the paved gravel terrace round the
// East pavilion, its granite kerbs, the cast-iron RING RAILING along the shore and round the stair notch (square posts with ball finials, panels of a hexagon lattice over a ring chain; photos rossi 07, 08,
// 11, 12) and the wide curved granite STAIR that goes down to the Neva in the notch (r12316492).  World coordinates (no frame).  The Neva bank itself (quay wall, bed, water) is the water owner's: the terrace ends
// at the quay line (OSM walls w907143572-74); only the stair pit is hand-over data (groups.js WATER_RINGS, active once environment/owners.js lists this module: docs/research/islands2-requests-landmarksYelaginRossi.md).
import { SPIT_RING, PIER_RING, TIP_SHORE, WATER } from './frame.js';
import { railing } from './ironwork.js';
import { TERR } from './east.js';

const PAV = [-4361, -5376];                                      // the middle of the pavilion: "inward" for the offsets
const inward = (p, d) => { const dx = PAV[0] - p[0], dz = PAV[1] - p[1], l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * d, p[1] + dz / l * d]; };
/** n points at equal arc length of a polyline */
function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = [];
  for (let k = 0; k < n; k++) { const s = L[L.length - 1] * k / (n - 1); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]); }
  return out;
}

/** a polygon [[x, z]..] cut into horizontal slabs of `step` m: [[cx, cz, w, d]..] boxes that lie INSIDE the polygon (the x intervals at the top, the middle and the bottom line of the slab are intersected) */
function slabs(ring, step) {
  const zs = ring.map((p) => p[1]), z0 = Math.floor(Math.min(...zs)), z1 = Math.ceil(Math.max(...zs)), out = [];
  const spans = (z) => {
    const xs = [];
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; if ((a[1] <= z) !== (b[1] <= z)) xs.push(a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])); }
    xs.sort((p, q) => p - q); const r = []; for (let i = 0; i + 1 < xs.length; i += 2) r.push([xs[i], xs[i + 1]]); return r;
  };
  for (let z = z0; z < z1; z += step) {
    let cur = spans(z + 0.02);
    for (const zz of [z + step / 2, z + step - 0.02]) {
      const o = spans(zz), next = [];
      for (const a of cur) for (const b of o) { const l = Math.max(a[0], b[0]), r = Math.min(a[1], b[1]); if (r - l > 0.2) next.push([l, r]); }
      cur = next;
    }
    for (const [l, r] of cur) out.push([(l + r) / 2, z + step / 2, r - l, step]);
  }
  return out;
}

const inPoly = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
/** the `out` argument of P.wallAlong (+1 = the face looks to the right of the walking direction, x east / z south) that makes the wall of the polyline look INTO (wantInside) or OUT OF the polygon `ring`: tested at the middle
 *  of the longest segment (the faces of the cheeks and of the coping stood the wrong way round when the sign was written by hand: back-face culled, a hole to the sky beside the stair) */
function faceOut(pts, ring, wantInside) {
  let best = 0, bi = 0; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (l > best) { best = l; bi = i; } }
  const a = pts[bi], b = pts[bi + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, mx = (a[0] + b[0]) / 2 - dz / l * 0.25, mz = (a[1] + b[1]) / 2 + dx / l * 0.25;
  return inPoly(mx, mz, ring) === wantInside ? 1 : -1;
}
/** the same for a wall that must look TOWARD the point `at` (want = true) or away from it */
function faceToward(pts, at, want) {
  let best = 0, bi = 0; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (l > best) { best = l; bi = i; } }
  const a = pts[bi], b = pts[bi + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  return ((at[0] - mx) * nx + (at[1] - mz) * nz > 0) === want ? 1 : -1;
}

export function spit(ctx, P, M, svc, handedOver) {
  P.far = 700;
  // ---------------------------------------------------------------- the terrace: pinkish gravel, raised 0.12 m, a granite kerb along the park edges
  P.cap(M.gravel, SPIT_RING, TERR, true, 4);
  const shoreN = [[-4339.6, -5369.1], [-4333.8, -5367.4], [-4331.9, -5371.7], [-4331.2, -5376.1], [-4335.5, -5378.5]];
  const shoreS = [[-4337, -5387.7], [-4334.3, -5391], [-4340.2, -5397], [-4344.2, -5393.8]];
  // park-side edges of the terrace (no railing): a low kerb
  for (const edge of [[[-4339.6, -5369.1], [-4357.2, -5364.5], [-4359.8, -5367.5]], [[-4344.2, -5393.8], [-4359.2, -5391.8], [-4365.3, -5384.4]]]) {
    P.wallAlong(M.granite, edge, 0, TERR + 0.02, faceOut(edge, SPIT_RING, false), 1);
    const inn = edge.map((p) => inward(p, 0.28));
    P.ribbon(M.granite, edge.map((p) => [p[0], TERR + 0.02, p[1]]), inn.map((p) => [p[0], TERR + 0.02, p[1]]), [0, 1, 0], 1);
  }
  // the terrace is walkable at its own level (0.12 m over the lawn): axis-aligned boxes inside the ring, never over the stair pit
  const ph = ctx.physics;
  if (ph) {
    // the ring cut into 1 m slabs (the walk surface follows the gravel: three big boxes lifted the lawn beside the terrace by 12 cm at the west corners)
    for (const [cx, cz, w, d] of slabs(SPIT_RING, 1.0)) ph.addWalkBox(cx, cz, w, d + 0.02, 0, TERR, -0.3);
    if (!handedOver) ph.addWalkBox(-4335.3, -5383.5, 5.5, 15, 0, TERR, -0.3);
  }
  // ---------------------------------------------------------------- the railing: on the terrace edge, 0.4 m inside the quay line, round the stair notch down to the stair head
  const shoreAll = [[-4339.6, -5369.1], [-4333.8, -5367.4], [-4331.9, -5371.7], [-4331.2, -5376.1], [-4331.1, -5380.4], [-4332.2, -5386], [-4334.3, -5391], [-4340.2, -5397], [-4344.2, -5393.8]];
  if (!handedOver) P.cap(M.gravel, PIER_RING, TERR, true, 4);                  // no stair pit: the notch is closed terrace and the railing runs straight along the quay
  const railN = shoreN.map((p) => inward(p, 0.42)), railS = shoreS.map((p) => inward(p, 0.42)), railA = shoreAll.map((p) => inward(p, 0.42));
  const out = [];
  for (const path of (handedOver ? [railN, railS] : [railA])) {
    const { posts, spans } = railing(P, M, path, { y0: TERR, h: 0.95, every: 2.3 });
    out.push(...spans);
    for (const s of spans) { const l = Math.hypot(s[2] - s[0], s[3] - s[1]); ctx.physics && ctx.physics.addBox((s[0] + s[2]) / 2, (s[1] + s[3]) / 2, l + 0.1, 0.24, Math.atan2(s[2] - s[0], s[3] - s[1]) + Math.PI / 2, 0, 1.3); }
    for (const [x, z] of posts) ctx.physics && ctx.physics.addCylinder(x, z, 0.1, 0, 1.3);
    // granite coping stones under the railing (a low kerb 0.45 m wide, top 0.2 above the terrace, as in photo 12)
    const cop = path.map((p) => inward(p, 0.28)), cop2 = path.map((p) => inward(p, -0.35));
    P.ribbon(M.granite, cop2.map((p) => [p[0], TERR + 0.18, p[1]]), cop.map((p) => [p[0], TERR + 0.18, p[1]]), [0, 1, 0], 1);
    P.wallAlong(M.granite, cop2, TERR - 0.02, TERR + 0.18, faceToward(cop2, PAV, false), 1);              // the outer face (toward the quay)
    P.wallAlong(M.granite, cop, TERR - 0.02, TERR + 0.18, faceToward(cop, PAV, true), 1);                 // the inner face: the step up from the gravel (it was missing: the slab looked open in front)
  }
  // ---------------------------------------------------------------- the stair of the granite pier (only when the pit is cut by the hand-over)
  if (handedOver) stair(ctx, P, M, svc);
  svc.spit = { railingSpans: out.length, handedOver };
}

/** a wide curved flight in the notch: 20 treads between the stair head (the inner edge of the ring) and the quay line, down to the landing 0.15 m over the Neva */
function stair(ctx, P, M, svc) {
  const inner = resample([[-4335.5, -5378.5], [-4335.9, -5383.6], [-4337, -5387.7]], 7), outer = resample([[-4331.2, -5376.1], [-4331.1, -5380.4], [-4332.2, -5386], [-4334.3, -5391]], 7);
  const n = 20, top = TERR, land = WATER + 0.15, rise = (top - land) / n;
  const at = (t) => inner.map((p, i) => [p[0] + (outer[i][0] - p[0]) * t, p[1] + (outer[i][1] - p[1]) * t]);
  const yTread = (i) => top - rise * (i + 1);
  for (let i = 0; i < n; i++) {
    const A = at(i / n), B = at((i + 1) / n), y = yTread(i), yPrev = i === 0 ? top : yTread(i - 1);
    P.ribbon(M.granite, A.map((p) => [p[0], y, p[1]]), B.map((p) => [p[0], y, p[1]]), [0, 1, 0], 1);                               // tread
    // riser (faces the water): explicit quads with uv = (arc length, height).  P.ribbon gave the vertical strip a zero width, so every riser sampled the one dark joint row of the granite texture (black stair)
    let acc = 0;
    for (let k = 0; k + 1 < A.length; k++) {
      const l = Math.hypot(A[k + 1][0] - A[k][0], A[k + 1][1] - A[k][1]), nx = B[k][0] - A[k][0] + B[k + 1][0] - A[k + 1][0], nz = B[k][1] - A[k][1] + B[k + 1][1] - A[k + 1][1], nl = Math.hypot(nx, nz) || 1;
      P.quad(M.granite, [A[k][0], yPrev, A[k][1]], [A[k + 1][0], yPrev, A[k + 1][1]], [A[k + 1][0], y, A[k + 1][1]], [A[k][0], y, A[k][1]], [nx / nl, 0, nz / nl], [[acc, yPrev], [acc + l, yPrev], [acc + l, y], [acc, y]]);
      acc += l;
    }
  }
  // cheeks: the two sides of the flight (granite walls from the landing to the terrace, top flush with the terrace)
  const n0 = at(0)[0], nN = at(1)[0], s0 = at(0)[6], sN = at(1)[6];
  // (both cheeks must look INTO the notch: with the hand-written signs they looked out and were culled from the stair, a see-through slit to the sky beside the flight)
  P.wallAlong(M.granite, [n0, nN], land, top, faceOut([n0, nN], PIER_RING, true), 1); P.wallAlong(M.granite, [s0, sN], land, top, faceOut([s0, sN], PIER_RING, true), 1);
  const ph = ctx.physics;
  if (ph) {
    for (let i = 0; i < n; i++) {
      const A = at(i / n), B = at((i + 1) / n);
      for (let k = 0; k + 2 < A.length; k += 2) {
        const kk = Math.min(k + 2, A.length - 1), cx = (A[k][0] + A[kk][0] + B[k][0] + B[kk][0]) / 4, cz = (A[k][1] + A[kk][1] + B[k][1] + B[kk][1]) / 4;
        const w = Math.hypot(A[kk][0] - A[k][0], A[kk][1] - A[k][1]), d = Math.hypot((B[k][0] + B[kk][0] - A[k][0] - A[kk][0]) / 2, (B[k][1] + B[kk][1] - A[k][1] - A[kk][1]) / 2);
        ph.addWalkBox(cx, cz, w + 0.1, d + 0.04, Math.atan2(B[k][0] - A[k][0], B[k][1] - A[k][1]) + Math.PI / 2 * 0 - 0, yTread(i), -4);
      }
    }
    // the end of the landing: nobody steps into the water
    for (let k = 0; k + 1 < 7; k++) { const a = at(1)[k], b = at(1)[k + 1]; ph.addBox((a[0] + b[0]) / 2 + 0.3, (a[1] + b[1]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.2, 0.5, Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2, land - 0.5, 1.0); }
  }
  svc.stair = { treads: n, top, land };
  void PIER_RING; void TIP_SHORE;
}
