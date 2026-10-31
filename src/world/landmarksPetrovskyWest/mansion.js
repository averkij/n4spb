// landmarksPetrovskyWest/mansion.js - the GOTE MANSION (Петровский проспект, 20 корп. 3; OSM w44425059, 20-vertex plan): the wooden house of 1882-83 (A. A. Ritter, V. I. Schaub) of the rope-works owners, on a high
// stone basement, renovated in 2019.  Photos refs/petrovsky-west g06 (corner, spring: tan-pink weatherboard, black window frames, bracketed cornice, pediment with relief, iron fence on a low stone wall), g07 (the pediment and
// cornice close up), g11 (the long front from the avenue: a projecting wing with a blind arched window at the left, a pedimented central wing, a pedimented right bay, a dozen chimneys, the low hipped roofs).
// Plan (local frame u along bearing 18 deg [x east, z south], v to the south-west; the ring measured in PE4): A west wing u -16.1..-10.5 x v +-10.3, B main body u -10.5..5.3 x v +-8.3, C mid wing u 5.3..10.5 x v +-10.4,
// D east body u 10.5..14.7 x v -9.2..8.9, E east bay u 14.7..19.3 x v -2.7..2.4.  One storey on a 1.3 m rusticated basement (small basement windows), wall to 6.3 m, bracketed cornice to 6.6 m, grey zinc roofs:
// gables over the wings A, C and the east bay E (pediments with a round relief on their ends), a low gable over B between the wings, a hip over D; chimneys of pink stucco.  The iron fence on a low stone wall runs along the north side.
// Weatherboard 'board' tile 1 m, windows = the 'mansionWin' tile (1.8 x 2.7 m with wide casing).  The house is closed (exterior only, solid).
import * as L from '../layout.js';
import { IDS, ringOf, ringEdges, edgeFrame, toWorld, DEG } from './frame.js';

const YB = 1.3, YE = 6.3, YC = 6.65;                       // basement top, wall top (cornice start), cornice top
const ROT = -18 * DEG;
const C0 = [-4796.1, -3050.1];                             // frame origin: the ring centroid
const cS = Math.cos(18 * DEG), sS = Math.sin(18 * DEG);
const toUV = (x, z) => ({ u: (x - C0[0]) * cS + (z - C0[1]) * sS, v: -(x - C0[0]) * sS + (z - C0[1]) * cS });

export function build(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const ring = ringOf(IDS.mansion);
  if (!ring) return;
  const net = ctx.services.streets && ctx.services.streets.net;
  const clear = (x, z, m = 0.8) => (net && net.cover ? net.cover(x, z, {}) < -0.5 : !L.isOnRoad(x, z, m));
  const edges = ringEdges(ring);

  // ------------------------------------------------------------------------------------------------ walls, edge by edge (the siding, the basement, the frieze, brackets, windows, corner pilasters)
  const peds = [];
  for (const e of edges) {
    const f = edgeFrame(e), len = e.len;
    if (len < 0.9) continue;
    const mid = toUV((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nu = e.n[0] * cS + e.n[1] * sS, nv = -e.n[0] * sS + e.n[1] * cS;
    P.push(f.S.x, 0, f.S.z, f.rot);
    P.far = 900;
    P.quad(M.basement, [0, 0, 0], [len, 0, 0], [len, YB, 0], [0, YB, 0], [0, 0, 1], [[0, 0], [len, 0], [len, YB], [0, YB]]);
    P.quad(M.board, [0, YB, 0], [len, YB, 0], [len, YE, 0], [0, YE, 0], [0, 0, 1], [[0, YB], [len, YB], [len, YE], [0, YE]]);
    P.box(M.trim, -0.05, len + 0.05, YB - 0.08, YB + 0.1, 0, 0.12, 'kb', 1);                                  // the basement ledge
    P.far = 380;
    // frieze band with brackets, then the cornice
    if (len >= 1.6) {
      P.box(M.trim, 0, len, YE - 1.0, YE, 0, 0.05, 'kb', 1);
      P.box(M.trim, -0.1, len + 0.1, YE, YC, 0, 0.55, 'k', 1);
      P.box(M.stone, -0.12, len + 0.12, YC, YC + 0.1, 0, 0.62, 'k', 1);
      const nb = Math.max(1, Math.round(len / 1.15));
      for (let i = 0; i < nb; i++) { const x = (i + 0.5) * len / nb; P.box(M.trim, x - 0.08, x + 0.08, YE - 0.65, YE + 0.02, 0, 0.3, 'k', 1); }
    }
    // corner pilasters (full height, a little proud)
    for (const x of [0.17, len - 0.17]) P.box(M.trim, x - 0.17, x + 0.17, YB, YE, 0, 0.1, 'kb', 1);
    // the pedimented ends of the wings A / C (facing +-v) and the east bay E (facing +u)
    const isPed = ((Math.abs(nv) > 0.85 && len > 4.7 && len < 6.2 && (Math.abs(mid.u + 13.3) < 1.5 || Math.abs(mid.u - 7.9) < 1.5)) || (nu > 0.85 && len > 4.7 && len < 5.6 && mid.u > 18));
    const isA = isPed && Math.abs(mid.u + 13.3) < 1.5;
    if (isA) {                                                                                   // photo g11: the wing end carries ONE tall round-arched window in a wide casing
      const cx = len / 2, r = 1.0, yb0 = 1.9, ys = 4.55, arc = Array.from({ length: 9 }, (_, i) => { const t = Math.PI - i / 8 * Math.PI; return [Math.cos(t) * r, Math.sin(t) * r]; });
      const outl = (g) => [[cx - r - g, yb0 - g], [cx + r + g, yb0 - g], [cx + r + g, ys], ...arc.slice().reverse().map(([a, b]) => [cx + a * (r + g) / r, ys + b * (r + g) / r]).slice(0, -1), [cx - r - g, ys]];
      P.vpoly(M.trim, outl(0.28), 0.04, +1, 1, 1, 0, 0); P.vpoly(M.dark, outl(0.05), 0.07, +1, 1, 1, 0, 0);
      for (const yy of [yb0 + 0.9, yb0 + 1.8]) P.box(M.trim, cx - r, cx + r, yy - 0.03, yy + 0.03, 0.07, 0.1, 'kb', 1);
      P.box(M.trim, cx - 0.03, cx + 0.03, yb0, ys + r - 0.1, 0.07, 0.1, 'kb', 1);
    }
    // windows
    const nw = isA ? 0 : len < 2.5 ? 0 : len < 3.9 ? 1 : Math.max(2, Math.round((len - 0.9) / 2.9));
    for (let i = 0; i < nw; i++) {
      const x = (i + 0.5) * len / nw, ww = 1.8;
      P.quad(M.mansionWin, [x - ww / 2, 2.0, 0.04], [x + ww / 2, 2.0, 0.04], [x + ww / 2, 4.7, 0.04], [x - ww / 2, 4.7, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.dark, x - 0.5, x + 0.5, 0.45, 0.95, 0, 0.04, 'kb', 1);                                          // the small basement window
    }
    P.pop();
    if (isPed) peds.push({ f, len });
  }

  // ------------------------------------------------------------------------------------------------ pediments with a round relief
  for (const { f, len } of peds) {
    P.push(f.S.x, 0, f.S.z, f.rot);
    P.far = 700;
    const h = (len / 2 + 0.35) * 0.62, y0 = YC, pts = [[-0.35, y0], [len + 0.35, y0], [len / 2, y0 + h]];
    P.vpoly(M.board, pts, 0.1, +1, 1, 1, 0, 0);
    P.beam(M.trim, [[-0.35, y0 + 0.08, 0.2], [len / 2, y0 + h + 0.08, 0.2], [len + 0.35, y0 + 0.08, 0.2]], 0.5, 0.3, [0, 0, 1]);                  // the raking cornice
    P.box(M.trim, -0.4, len + 0.4, y0 - 0.02, y0 + 0.12, 0, 0.62, 'k', 1);
    P.far = 300;
    const rr = Math.min(0.75, h * 0.38);
    P.fan(M.trim, Array.from({ length: 10 }, (_, i) => [len / 2 + Math.cos(i / 10 * Math.PI * 2) * rr, y0 + h * 0.4 + Math.sin(i / 10 * Math.PI * 2) * rr, 0.14]), [0, 0, 1], (p) => [p[0], p[1]]);   // the round relief in the tympanum
    P.pop();
  }

  // ------------------------------------------------------------------------------------------------ roofs (frame u, v)
  P.push(C0[0], 0, C0[1], ROT);
  P.far = 900;
  const zinc = (x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3, n) => P.quad(M.zincRoof, [x0, y0, z0], [x1, y1, z1], [x2, y2, z2], [x3, y3, z3], n, [[0, 0], [(x1 - x0 + z1 - z0) / 1.2, 0], [(x1 - x0 + z1 - z0) / 1.2, 3], [0, 3]]);
  /** a gable roof over the rectangle u0..u1 x v0..v1 with the ridge along v (alongV) or u; pitch p (tan); ov = overhang */
  const gableRoof = (u0, u1, v0, v1, alongV, p, ov = 0.55, ey = YC - 0.05) => {
    if (alongV) {
      const um = (u0 + u1) / 2, h = ((u1 - u0) / 2 + ov) * p, a = u0 - ov, b = u1 + ov, va = v0 - 0.3, vb = v1 + 0.3;
      zinc(a, ey, va, um, ey + h, va, um, ey + h, vb, a, ey, vb, [-p, 1, 0]);
      zinc(b, ey, vb, um, ey + h, vb, um, ey + h, va, b, ey, va, [p, 1, 0]);
      P.box(M.dark, um - 0.1, um + 0.1, ey + h - 0.02, ey + h + 0.1, va, vb, 'b', 1);
      return ey + h;
    }
    const vm = (v0 + v1) / 2, h = ((v1 - v0) / 2 + ov) * p, a = v0 - ov, b = v1 + ov, ua = u0 - 0.3, ub = u1 + 0.3;
    zinc(ua, ey, a, ua, ey + h, vm, ub, ey + h, vm, ub, ey, a, [0, 1, -p]);
    zinc(ub, ey, b, ub, ey + h, vm, ua, ey + h, vm, ua, ey, b, [0, 1, p]);
    P.box(M.dark, ua, ub, ey + h - 0.02, ey + h + 0.1, vm - 0.1, vm + 0.1, 'b', 1);
    return ey + h;
  };
  const hRidge = [];
  hRidge.push(gableRoof(-16.1, -10.5, -10.3, 10.3, true, 0.78));            // A (the pediments face +-v)
  hRidge.push(gableRoof(5.3, 10.5, -10.4, 10.4, true, 0.78));               // C
  hRidge.push(gableRoof(-10.5, 5.3, -8.3, 8.4, false, 0.25, 0.7));          // B between them: low
  hRidge.push(gableRoof(14.7, 19.3, -2.7, 2.4, false, 0.78, 0.5));          // E: ridge along u, the pediment faces +u ... (ridge along u means slopes toward +-v)
  // D: a hip over u 10.5..14.7 x v -9.2..8.9
  {
    const u0 = 10.5 - 0.5, u1 = 14.7 + 0.5, v0 = -9.2 - 0.5, v1 = 8.9 + 0.5, ey = YC - 0.05, um = (10.5 + 14.7) / 2, rv0 = v0 + 2.7, rv1 = v1 - 2.7, h = (um - u0) * 0.5;
    zinc(u0, ey, v0, um, ey + h, rv0, um, ey + h, rv1, u0, ey, v1, [-0.5, 1, 0]);
    zinc(u1, ey, v1, um, ey + h, rv1, um, ey + h, rv0, u1, ey, v0, [0.5, 1, 0]);
    P.quad(M.zincRoof, [u1, ey, v0], [um, ey + h, rv0], [um, ey + h, rv0], [u0, ey, v0], [0, 1, -0.5]);
    P.quad(M.zincRoof, [u0, ey, v1], [um, ey + h, rv1], [um, ey + h, rv1], [u1, ey, v1], [0, 1, 0.5]);
    P.box(M.dark, um - 0.1, um + 0.1, ey + h - 0.02, ey + h + 0.1, rv0, rv1, 'b', 1);
    hRidge.push(ey + h);
  }
  // chimneys of pink stucco
  P.far = 380;
  // [u, v, roof]: roof 0 = A, 1 = C, 2 = B, 3 = E, 4 = D (hRidge order)
  for (const [u, v, roof] of [[-6, 0.4, 2], [-3, -0.4, 2], [0, 0.4, 2], [3.2, -0.3, 2], [-13.3, 4, 0], [-13.3, -4, 0], [7.9, 4.5, 1], [7.9, -4.5, 1], [12.6, 3, 4], [12.6, -3, 4], [16.5, 0, 3]]) {
    const y0 = hRidge[roof] - 0.3, tall = 1.5;
    P.box(M.trim, u - 0.4, u + 0.4, y0, y0 + tall, v - 0.4, v + 0.4, 'b', 1);
    P.box(M.stone, u - 0.5, u + 0.5, y0 + tall, y0 + tall + 0.12, v - 0.5, v + 0.5, '', 1);
  }
  P.pop();

  // ------------------------------------------------------------------------------------------------ the iron fence on a low stone wall along the north side
  {
    const u0 = -17.5, u1 = 20.5, vf = -14.3;
    P.push(C0[0], 0, C0[1], ROT);
    P.far = 380;
    const seg = (ua, ub, vv) => {
      const a = toWorld({ S: { x: C0[0], z: C0[1] }, t: [cS, sS], n: [-sS, cS] }, ua, vv), b = toWorld({ S: { x: C0[0], z: C0[1] }, t: [cS, sS], n: [-sS, cS] }, ub, vv);
      return clear(a.x, a.z, 0.8) && clear(b.x, b.z, 0.8) && clear((a.x + b.x) / 2, (a.z + b.z) / 2, 0.8);
    };
    const step = 4.8, runs = [];
    for (let u = u0; u < u1 - 0.1; u += step) {
      const ub = Math.min(u1, u + step);
      if (!seg(u, ub, vf)) continue;
      runs.push([u, ub]);
      P.box(M.basement, u, ub, 0, 0.55, vf - 0.22, vf + 0.22, 'b', 1);
      P.quad(M.fence, [u, 0.55, vf], [ub, 0.55, vf], [ub, 2.0, vf], [u, 2.0, vf], [0, 0, 1], [[0, 0], [(ub - u) / 2.4, 0], [(ub - u) / 2.4, 1], [0, 1]]);
      P.quad(M.fence, [ub, 0.55, vf], [u, 0.55, vf], [u, 2.0, vf], [ub, 2.0, vf], [0, 0, -1], [[(ub - u) / 2.4, 0], [0, 0], [0, 1], [(ub - u) / 2.4, 1]]);
    }
    for (const [ua] of runs) P.box(M.stone, ua - 0.2, ua + 0.2, 0, 2.15, vf - 0.2, vf + 0.2, 'b', 1);
    if (runs.length) P.box(M.stone, runs[runs.length - 1][1] - 0.2, runs[runs.length - 1][1] + 0.2, 0, 2.15, vf - 0.2, vf + 0.2, 'b', 1);
    P.pop();
    K.shared.mansionFence = { runs, vf };
    if (ph) for (const [ua, ub] of runs) { const c = toWorld({ S: { x: C0[0], z: C0[1] }, t: [cS, sS], n: [-sS, cS] }, (ua + ub) / 2, vf); ph.addBox(c.x, c.z, ub - ua, 0.5, ROT, 0, 2.1); }
  }

  // ------------------------------------------------------------------------------------------------ colliders: the five volumes
  if (ph) {
    const fr = { S: { x: C0[0], z: C0[1] }, t: [cS, sS], n: [-sS, cS] };
    for (const [u0, u1, v0, v1] of [[-16.1, -10.5, -10.3, 10.3], [-10.5, 5.3, -8.3, 8.4], [5.3, 10.5, -10.4, 10.4], [10.5, 14.7, -9.2, 8.9], [14.7, 19.3, -2.7, 2.4]]) {
      const c = toWorld(fr, (u0 + u1) / 2, (v0 + v1) / 2); ph.addBox(c.x, c.z, u1 - u0 + 0.1, v1 - v0 + 0.1, ROT, 0, 9.0);
    }
  }
  K.shared.mansion = { C0, ROT };
  { const sp = toWorld({ S: { x: C0[0], z: C0[1] }, t: [cS, sS], n: [-sS, cS] }, -3, -24);
    if (clear(sp.x, sp.z, 1.2)) K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: Math.round(L.yawToward(sp.x, sp.z, C0[0], C0[1])), name: 'Особняк Готе: деревянный дом 1882 года за чугунной оградой' }); }
  K.svc.monuments.push({ id: IDS.mansion, name: 'Особняк Готе (Петровский проспект, 20, корп. 3)', x: C0[0], z: C0[1], h: 10 });
}
