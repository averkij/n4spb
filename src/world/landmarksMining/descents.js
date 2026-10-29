// landmarksMining/descents.js - the two granite DESCENTS of the Lieutenant Schmidt embankment (docs/research/mining.md 8.1, 8.2; photos refs/mining 05 08 45 61 24; model: landmarksStrelka/descent.js): the rings are handed to
// the water owner through groups.js WATER_RINGS (the generic quay opens 0.5 m round them), so everything inside is drawn here: walls, flights, landings, bastions, barriers.
//   D1  the axial descent in front of the portico, frame P: a recess u -11.1 .. 10.6, w 22.65 .. 30.8: two massive pink-granite side walls (1.2 m, rolled top +1.0, a pylon at the head, a rounded BASTION with a plinth ring at
//       the water end), ONE flight of 18 steps (rise 0.178, tread 0.34) down to a slab landing at -3.2 (0.2 m over the water).
//   D2  the amphitheatre descent beside the bow of the Krasin, a 27 m wedge between the diagonal retaining wall and the round granite curb of the lawn: 16 broad steps (rise 0.175, tread 0.55) follow the land edge
//       (offset lines of the polyline), a landing at -2.8 (0.6 m over the water) with a kerb and an invisible barrier at the water edge.  Colours: pink granite `#9a7a6e` (sunlit medians `#ac8677`).
// The Neva is at -3.4.  Nobody walks on the water: every water edge has a barrier collider.
// mining-fix 2026-10-09 (water owner's review, docs/research/vo-requests-landmarksMining.md): D2's floors are CLIPPED to the ring (tread colliders = the band rectangles cut at the water edge G -> A and filled with
// walk boxes by fillBoxes(); the landing = rows of boxes that stay inside the ring), the river-side barrier now reaches +1.25 (physics skips a box whose top is not above feet + 0.45: the old top -2.1 let a walker on
// the top treads step over it; the review raised +0.7 to +1.25 because a jump, apex 0.74 m, still cleared +0.7; the D1 landing barrier likewise), the tread ends along the water edge are closed with granite faces, the WEST FLANK A -> B has a granite cheek (flush with the ring, coping +0.17, visual only) and the two mouth corners
// A and G have a granite plug against the 0.5 m quay opening.  Proof: node tools/environment-vo-seal.mjs --flood --modules landmarksAcademy,landmarksMenshikov,landmarksNavalCorps,landmarksMining,landmarksSeaTerminal,landmarksSevkabel -> RESULT OK (0 real leaks).
import * as L from '../layout.js';
import { P as FP, S as FS } from './frame.js';
import { DESCENT_D2 } from './groups.js';

const WATER = -3.4;

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMining/descents] ${name}:`, e); } };
  // ------------------------------------------------------------------------------------------ D1
  step('D1', () => {
    P.push(FP.x, 0, FP.z, FP.rot);
    try {
      const wT = 22.65, TR = 0.34, RI = 0.178, N = 18, uW = -10.5, uE = 10.0, wEdge = (u) => 30.65 - 0.0229 * u, yL = -RI * N;
      // apron: the generic ground hole starts 0.5 m before the ring; a granite slab closes the gap at the head and the sides
      P.quad(M.granite, [-11.7, 0.012, 21.9], [11.2, 0.012, 21.9], [11.2, 0.012, wT], [-11.7, 0.012, wT], [0, 1, 0], [[-4.9, 9.1], [4.7, 9.1], [4.7, 9.4], [-4.9, 9.4]]);
      // the flight
      for (let k = 1; k <= N; k++) {
        const w0 = wT + TR * (k - 1), w1 = wT + TR * k, y0 = -RI * (k - 1), y1 = -RI * k;
        P.quad(M.graniteStep, [uW, y0, w0], [uE, y0, w0], [uE, y1, w0], [uW, y1, w0], [0, 0, 1], [[uW / 2.4, y0 / 2.4], [uE / 2.4, y0 / 2.4], [uE / 2.4, y1 / 2.4], [uW / 2.4, y1 / 2.4]]);
        P.quad(M.granite, [uW, y1, w0], [uE, y1, w0], [uE, y1, w1], [uW, y1, w1], [0, 1, 0], [[uW / 2.4, w0 / 2.4], [uE / 2.4, w0 / 2.4], [uE / 2.4, w1 / 2.4], [uW / 2.4, w1 / 2.4]]);
      }
      // the landing and its water edge
      const wL = wT + TR * N, wA = wEdge(uW), wB = wEdge(uE);
      P.quad(M.slabs, [uW, yL, wL], [uE, yL, wL], [uE, yL, wB], [uW, yL, wA], [0, 1, 0], [[uW / 1.8, wL / 1.8], [uE / 1.8, wL / 1.8], [uE / 1.8, wB / 1.8], [uW / 1.8, wA / 1.8]]);
      P.quad(M.granite, [uW, WATER - 0.4, wA], [uE, WATER - 0.4, wB], [uE, yL, wB], [uW, yL, wA], [0, 0, 1], [[0, 0], [8.5, 0], [8.5, 0.3], [0, 0.3]]);
      P.quad(M.graniteWet, [uW, WATER - 0.4, wA + 0.002], [uE, WATER - 0.4, wB + 0.002], [uE, WATER + 0.1, wB + 0.002], [uW, WATER + 0.1, wA + 0.002], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // the two side walls with pylons at the head and the rounded bastions with plinth rings at the water end
      for (const s of [-1, 1]) {
        const a = s < 0 ? -11.7 : 10.0, b = s < 0 ? -10.5 : 11.2, uc = s < 0 ? -11.1 : 10.6, wc = 30.0;
        P.box(M.granite, a, b, WATER - 0.4, 1.0, wT, wc, 'b', 2.4);
        P.box(M.granite, a - 0.04, b + 0.04, 1.0, 1.1, wT, wc, 'b', 2.4);                              // the rolled top
        const pa = s < 0 ? -12.0 : 9.7, pb = s < 0 ? -10.2 : 11.5;
        P.box(M.granite, pa, pb, 0, 1.9, wT, wT + 1.9, 'b', 2.4); P.box(M.granite, pa - 0.08, pb + 0.08, 1.9, 2.05, wT - 0.08, wT + 1.98, 'b', 2.4);   // the pylon
        P.cyl(M.granite, [uc, WATER - 0.5, wc], [uc, 1.0, wc], 1.3, 1.3, 20, false); P.cyl(M.granite, [uc, 1.0, wc], [uc, 1.1, wc], 1.34, 1.34, 20, true);
        P.cyl(M.graniteStep, [uc, WATER - 0.5, wc], [uc, -3.0, wc], 1.8, 1.8, 20, true);               // the plinth ring at the foot
      }
      // colliders: the walls and bastions are solid; 18 steps down; the landing; a barrier at the water edge
      FP.box(ph, -11.1, 26.3, 1.2, 7.4, 0, -6, 1.1); FP.box(ph, 10.6, 26.3, 1.2, 7.4, 0, -6, 1.1);
      FP.cyl(ph, -11.1, 30.0, 1.3, -6, 1.1); FP.cyl(ph, 10.6, 30.0, 1.3, -6, 1.1);
      FP.stairs(ph, (uW + uE) / 2, wT + TR * N / 2, uE - uW, TR * N, 0, 0, yL, N);
      FP.walk(ph, (uW + uE) / 2, 22.56, uE - uW + 0.2, 0.22, 0, 0, -6);      // (review 2026-10-09) the head edge of the ring runs from w 22.70 (west) to 22.57 (east) while the flight starts at 22.65: a floor strip closes the 8 cm crack at the east end of the head
      FP.walk(ph, (uW + uE) / 2, (wL + 30.6) / 2, uE - uW, 30.6 - wL, 0, yL, yL - 3);
      // n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the invisible barrier along the water edge of the landing is GONE (water is reachable: the walker steps off the landing into the Neva); the source's note: (review 2026-10-09: a jump (vy 4.2, apex 0.74 m) cleared the old top yL + 0.7 from the landing and from the steps: the barrier now ends at the height of the generic quay colliders)
      const c = FP.W(0, 27.0); svc.crowd.push({ x: c.x, z: c.z, r: 7, n: 6, kind: 'quay', y: yL, name: 'Спуск к Неве у Горного университета' });
      const v = FP.W(0, 29.8), t = FP.W(0, -6); svc.photoSpots.push({ name: 'Спуск к Неве: портик над пилонами', x: v.x, z: v.z, yaw: L.yawToward(v.x, v.z, t.x, t.z), pitch: 14, y: yL });
    } finally { P.pop(); }
  });
  // ------------------------------------------------------------------------------------------ D2: the offset-band steps along the land edge
  step('D2', () => {
    const ring = DESCENT_D2.map((p) => [p[0], p[1]]), A = ring[0], G = ring[ring.length - 1];
    const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length, cz = ring.reduce((a, p) => a + p[1], 0) / ring.length;
    const S0 = ring;                                                        // the land edge A -> B -> C ... G (the open polyline)
    const N = 16, TR = 0.42, RI = 0.175, yL = -RI * N - 0.005;
    // inward normals and mitred offsets of the open polyline
    const nrm = []; for (let i = 0; i + 1 < S0.length; i++) { const dx = S0[i + 1][0] - S0[i][0], dz = S0[i + 1][1] - S0[i][1], l = Math.hypot(dx, dz) || 1; let nx = dz / l, nz = -dx / l; const mx = (S0[i][0] + S0[i + 1][0]) / 2, mz = (S0[i][1] + S0[i + 1][1]) / 2; if (nx * (cx - mx) + nz * (cz - mz) < 0) { nx = -nx; nz = -nz; } nrm.push([nx, nz]); }
    const offset = (d) => S0.map((p, i) => {
      if (i === 0) return [p[0] + nrm[0][0] * d, p[1] + nrm[0][1] * d];
      if (i === S0.length - 1) return [p[0] + nrm[i - 1][0] * d, p[1] + nrm[i - 1][1] * d];
      const n1 = nrm[i - 1], n2 = nrm[i], dot = n1[0] * n2[0] + n1[1] * n2[1], det = 1 - dot * dot;
      if (det < 1e-4) return [p[0] + n2[0] * d, p[1] + n2[1] * d];
      const s = d * (1 - dot) / det, t = s;                                // mitre: p + (n1 + n2) * d / (1 + dot)
      let qx = (n1[0] + n2[0]) * d / (1 + dot), qz = (n1[1] + n2[1]) * d / (1 + dot); const l = Math.hypot(qx, qz), lim = 2.2 * Math.abs(d) + 0.01; if (l > lim) { qx *= lim / l; qz *= lim / l; }
      void s; void t; return [p[0] + qx, p[1] + qz];
    });
    // the half plane of the water edge G -> A: keep points on the side of the ring centroid
    const gx = A[0] - G[0], gz = A[1] - G[1], gl = Math.hypot(gx, gz), ex = gz / gl, ez = -gx / gl, sg = Math.sign(ex * (cx - G[0]) + ez * (cz - G[1])) || 1;
    const dist = (p) => sg * (ex * (p[0] - G[0]) + ez * (p[1] - G[1]));
    const clip = (poly) => {                                               // Sutherland-Hodgman against dist >= 0.05 (the water edge)
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], da = dist(a) - 0.05, db = dist(b) - 0.05;
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      return out;
    };
    const rings = []; for (let k = 0; k <= N; k++) rings.push(offset(TR * k));
    const W0 = WATER - 0.4, nOut = [-ex * sg, -ez * sg];                    // nOut: the horizontal normal of the water edge G -> A, pointing to the Neva
    // a vertical granite face between two plan points p -> q (the wanted normal n picks the winding)
    const face = (p, q, y0, y1, n) => {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]); if (len < 0.02 || y1 - y0 < 0.02) return;
      P.quad(M.granite, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], [n[0], 0, n[1]], [[0, y0 / 2.4], [len / 2.4, y0 / 2.4], [len / 2.4, y1 / 2.4], [0, y1 / 2.4]]);
    };
    // the landing: the whole ring slightly under the last step
    P.cap(M.slabs, ring.map((p) => [p[0], p[1]]), yL - 0.004, true, 1.8);
    for (let k = 0; k < N; k++) {
      const yTop = -RI * (k + 1), yPrev = -RI * k, o0 = rings[k], o1 = rings[k + 1];
      for (let i = 0; i + 1 < S0.length; i++) {
        const quad = clip([o0[i], o0[i + 1], o1[i + 1], o1[i]]);
        if (quad.length >= 3) {
          const pts = quad.map((p) => [p[0], yTop, p[1]]);
          P.fan(M.graniteStep, pts, [0, 1, 0], (p) => [p[0] / 2.4, p[2] / 2.4]);
          // the tread ends on the water edge (the cut G -> A) are open to the Neva: close each with a granite face from the landing up to the tread (no sawtooth with the sky behind it)
          for (let j = 0; j < quad.length; j++) {
            const p = quad[j], q = quad[(j + 1) % quad.length];
            if (Math.abs(dist(p) - 0.05) < 1e-6 && Math.abs(dist(q) - 0.05) < 1e-6) face(p, q, yL, yTop, nOut);
          }
        }
        // the riser along the outer offset line k (facing the water side = away from the land edge)
        const a = o0[i], b = o0[i + 1], da = dist(a) - 0.05, db = dist(b) - 0.05;
        if (da < 0 && db < 0) continue;
        let pa = a, pb = b;
        if (da < 0) { const t = da / (da - db); pa = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } else if (db < 0) { const t = da / (da - db); pb = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
        const n = nrm[i], len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
        if (len > 0.02) P.quad(M.granite, [pa[0], yPrev, pa[1]], [pb[0], yPrev, pb[1]], [pb[0], yTop, pb[1]], [pa[0], yTop, pa[1]], [n[0], 0, n[1]], [[0, yPrev / 2.4], [len / 2.4, yPrev / 2.4], [len / 2.4, yTop / 2.4], [0, yTop / 2.4]]);
      }
    }
    // the water edge of the landing: a kerb face down to the water
    const GA = [G, A];
    P.quad(M.granite, [G[0], WATER - 0.4, G[1]], [A[0], WATER - 0.4, A[1]], [A[0], yL, A[1]], [G[0], yL, G[1]], [-ex * sg, 0, -ez * sg], [[0, 0], [gl / 2.4, 0], [gl / 2.4, 0.3], [0, 0.3]]);
    void GA;
    // the round granite curb of the lawn: a coping 0.4 m high, 0.5 m wide along B -> G (the lawn side)
    for (let i = 1; i + 1 < S0.length; i++) {
      const a = S0[i], b = S0[i + 1], n = nrm[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue;
      const h = 0.4, w = 0.5, ax = a[0] - n[0] * w, az = a[1] - n[1] * w, bx = b[0] - n[0] * w, bz = b[1] - n[1] * w;
      P.quad(M.granite, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], [n[0], 0, n[1]], [[0, 0], [l / 2.4, 0], [l / 2.4, h / 2.4], [0, h / 2.4]]);
      P.quad(M.granite, [a[0], h, a[1]], [b[0], h, b[1]], [bx, h, bz], [ax, h, az], [0, 1, 0], [[0, 0], [l / 2.4, 0], [l / 2.4, w / 2.4], [0, w / 2.4]]);
    }
    // (mining-fix 2026-10-09, water owner's review) the WEST FLANK: a granite cheek along the ring edge A -> B (the side that borders the generic port wall), flush with the ring: an
    // inner face from the water bed to the coping (+0.17, the level of the quay coping), a flat coping 0.68 m wide that also covers the 0.5 m ground opening of the quay, the outer rim
    // above the ground and an end face on the water edge.  Without it the sky showed under the first treads from the Neva.  Visual only (a kerb: the walk over it stays open).
    {
      const n0 = nrm[0], TOP = 0.17, dIn = 0.06, dOut = -0.62;
      const wall = clip([[A[0] + n0[0] * dOut, A[1] + n0[1] * dOut], [A[0] + n0[0] * dIn, A[1] + n0[1] * dIn], [S0[1][0] + n0[0] * dIn, S0[1][1] + n0[1] * dIn], [S0[1][0] + n0[0] * dOut, S0[1][1] + n0[1] * dOut]]);
      if (wall.length >= 3) {
        P.fan(M.granite, wall.map((p) => [p[0], TOP, p[1]]), [0, 1, 0], (p) => [p[0] / 2.4, p[2] / 2.4]);
        let wx = 0, wz = 0; for (const p of wall) { wx += p[0] / wall.length; wz += p[1] / wall.length; }
        for (let j = 0; j < wall.length; j++) {
          const p = wall[j], q = wall[(j + 1) % wall.length], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
          let nx = dz / l, nz = -dx / l; if (nx * (mx - wx) + nz * (mz - wz) < 0) { nx = -nx; nz = -nz; }          // outward normal of this wall edge
          face(p, q, W0, TOP, [nx, nz]);
        }
      }
    }
    // the two mouth corners A and G: the generic quay wall / parapet ends 0.5 m short of the ring (the quay opening) and a slot of 10-40 cm showed the sky from the landing and the Neva; a granite plug
    // 8 cm behind the wall plane (no coplanar faces with the generic wall), 0.9 m long along the quay line, with a coping on top, closes it.  The quay line runs on from A to the south and from G to the north
    for (const [C, dir] of [[A, [0.051, 0.9987]], [G, [(G[0] - A[0]) / gl, (G[1] - A[1]) / gl]]]) {
      let wx = -dir[1], wz = dir[0]; if (wx * (cx - C[0]) + wz * (cz - C[1]) < 0) { wx = -wx; wz = -wz; }      // the land side (towards the ring centre)
      const p0 = [C[0] + wx * 0.08, C[1] + wz * 0.08], p1 = [p0[0] + dir[0] * 0.9, p0[1] + dir[1] * 0.9], TOP = 0.17;
      face(p0, p1, W0, TOP, [-wx, -wz]);
      P.fan(M.granite, [[p0[0], TOP, p0[1]], [p1[0], TOP, p1[1]], [p1[0] + wx * 0.6, TOP, p1[1] + wz * 0.6], [p0[0] + wx * 0.6, TOP, p0[1] + wz * 0.6]], [0, 1, 0], (p) => [p[0] / 2.4, p[2] / 2.4]);
    }
    // colliders (water owner's review: every floor stays INSIDE the ring and the river edge is a wall higher than any walker's step)
    // a convex plan polygon is filled with walk boxes along the frame (origin a, tangent t, inward normal nn): columns 0.1 m wide, neighbours of nearly equal depth are merged, so a floor follows
    // the oblique water edge to within ~0.1 m and nothing overshoots the ring (a box may grow 4 cm past the polygon: the polygon stops 5 cm inside the ring edge)
    const fillBoxes = (poly, a, t, nn, yTop) => {
      const Q = poly.map((p) => [(p[0] - a[0]) * t[0] + (p[1] - a[1]) * t[1], (p[0] - a[0]) * nn[0] + (p[1] - a[1]) * nn[1]]);
      let umin = 1e9, umax = -1e9; for (const q of Q) { umin = Math.min(umin, q[0]); umax = Math.max(umax, q[0]); }
      const span = (u) => {
        let lo = 1e9, hi = -1e9;
        for (let i = 0; i < Q.length; i++) {
          const p = Q[i], q = Q[(i + 1) % Q.length]; if ((p[0] - u) * (q[0] - u) > 0) continue;
          if (Math.abs(q[0] - p[0]) < 1e-9) { lo = Math.min(lo, p[1], q[1]); hi = Math.max(hi, p[1], q[1]); continue; }
          const v = p[1] + (q[1] - p[1]) * (u - p[0]) / (q[0] - p[0]); lo = Math.min(lo, v); hi = Math.max(hi, v);
        }
        return hi > lo ? [lo, hi] : null;
      };
      const rot = Math.atan2(-t[1], t[0]), DU = 0.1, EPS = 0.005, GROW = 0.04;           // only columns of EQUAL depth merge; every box grows 4 cm so that no hairline crack stays between neighbours
      let run = null;
      const flush = () => {
        if (run && run.hi - run.lo >= 0.05 && run.u1 - run.u0 >= 0.05) {
          const uc = (run.u0 + run.u1) / 2, vc = (run.lo + run.hi) / 2;
          ph.addWalkBox(a[0] + t[0] * uc + nn[0] * vc, a[1] + t[1] * uc + nn[1] * vc, run.u1 - run.u0 + 2 * GROW, run.hi - run.lo + 2 * GROW, rot, yTop, -6);
        }
        run = null;
      };
      for (let u = umin; u < umax - 1e-6; u += DU) {
        const u1 = Math.min(umax, u + DU), s0 = span(Math.max(u, umin + 1e-6)), s1 = span(Math.min(u1, umax - 1e-6));
        if (!s0 || !s1) { flush(); continue; }
        const lo = Math.max(s0[0], s1[0]), hi = Math.min(s0[1], s1[1]); if (hi - lo < 0.05) { flush(); continue; }
        if (run && Math.abs(lo - run.rlo) <= EPS && Math.abs(hi - run.rhi) <= EPS) { run.u1 = u1; run.lo = Math.max(run.lo, lo); run.hi = Math.min(run.hi, hi); }
        else { flush(); run = { u0: u, u1, lo, hi, rlo: lo, rhi: hi }; }
      }
      flush();
    };
    for (let k = 0; k < N; k++) for (let i = 0; i + 1 < S0.length; i++) {
      const a = rings[k][i], b = rings[k][i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.1) continue;
      const t = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], nn = nrm[i], v0 = k === 0 ? -0.4 : 0, at = (u, v) => [a[0] + t[0] * u + nn[0] * v, a[1] + t[1] * u + nn[1] * v];
      // the band as a rectangle (0.15 m longer at both ends so that the mitres of neighbouring bands overlap, band 0 reaches 0.4 m past the land edge: the walk is continuous over the ring boundary), cut at the water edge
      const poly = clip([at(-0.15, v0), at(len + 0.15, v0), at(len + 0.15, TR), at(-0.15, TR)]); if (poly.length < 3) continue;
      fillBoxes(poly, a, t, nn, -RI * (k + 1));
    }
    const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const inR = (x, z) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < (ring[j][0] - ring[i][0]) * (z - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c; return c; };
    const dl = (x, z) => { let best = 1e9; for (let i = 0; i + 1 < S0.length; i++) { const a = S0[i], b = S0[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return best; };
    // the landing (under the last steps too: the higher step surface wins): rows 0.5 m deep, each filled with boxes over the runs of x whose whole row stays inside the ring
    for (let z = z0; z < z1; z += 0.5) {
      const za = z, zb = z + 0.5, zm = z + 0.25; let xa = null, xb = null;
      const put = () => { if (xa !== null && xb - xa >= 0.1) ph.addWalkBox((xa + xb) / 2, zm, xb - xa + 0.1, 0.56, 0, yL, yL - 3); xa = xb = null; };
      for (let x = x0 - 0.2; x <= x1 + 0.2; x += 0.1) {
        if (inR(x, za) && inR(x, zm) && inR(x, zb) && dl(x, zm) > TR * N - 1.2) { if (xa === null) xa = x; xb = x; } else put();
      }
      put();
    }
    // the river edge: a barrier from the bed up to +1.25 (the top tread lies at -0.175 and physics skips a box whose top is not above feet + 0.45; a jump has vy 4.2 / g 12 = apex 0.74 m, so +0.7 was cleared by a
    // jump from the first two treads and from street level at the G corner (review 2026-10-09, jump probe); +1.25 is the height of the generic quay colliders and cannot be cleared from any tread), outside the ring
    // (n4spb: the invisible barrier along the river edge of D2 is GONE as well, see D1: water is reachable)
    const mid = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
    svc.crowd.push({ x: mid[0], z: mid[1], r: 7, n: 5, kind: 'quay', y: yL, name: 'Амфитеатр у ледокола' });
    const sv = FS.W(33.0, 40.0); const tg = FS.W(0, 40); svc.photoSpots.push({ name: 'Ледокол «Красин» с амфитеатра', x: sv.x, z: sv.z, yaw: L.yawToward(sv.x, sv.z, tg.x, tg.z), pitch: 4, y: 0 });
  });
}
