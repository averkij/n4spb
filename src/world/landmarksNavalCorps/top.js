// landmarksNavalCorps/top.js - everything above the cornice of the Naval Cadet Corps: the two pavilion ATTICS with the flat zinc DOMES, the round TURRET and the unmapped compound skyline behind the Corps
// (docs/research/navalcorps.md 4.5 / 4.6 / 4.8, photos a07 g_pavW g_center, a04, a05, a02).
//   ATTIC     a 13.5 m wide block on each pavilion risalit, 13.3 .. 16.4 m (cornice 15.7 .. 16.4): the lunette (half-round window 3.5 x 1.8 m, radial bars) and two blind roundels (d 1.7 m) on the west face,
//             two small cream stacks (west) / seven big ones (east); the drum (lower ring dia 10.3 m with a ribbon of small dark openings, upper ring dia 9.3 m), the flat spherical cap dia 8.9 m rising
//             3.2 m to 20.9 m with 28 meridian standing seams and a 0.5 m metal ring band at its base, a gilded ball and a rod to 22.8 m; the WEST dome carries a small gilded cross, the east none.
//             Domes follow the PHOTO axes (west u 24.0, east u 110.0): the OSM parts are 1.2 .. 2.0 m east of them (tracing parallax).  NO flags.
//   TURRET    plain cylinder dia 6.7 m at (65.6, -9.0): drum 16.6 .. 22.4, a belt at 20.0, a band of five groups of paired six-light sashes round the river half (20.5 .. 21.4), a stepped cornice, the platform
//             at 23.0 with a black iron railing of vertical bars 1.0 m high (top 24.0).  The mast with the ensign is left out (user rule).
//   SKYLINE   [?] a red-brick block (5-6 floors, gabled, apparent top 21.8 m) and two slim chimneys that rise behind the Corps in the frontal photograph (not in OSM): plain extrusions.
import { K, HT, PAV_W, PAV_E, TURRET } from './frame.js';
import { revolve } from './geo.js';

const TAU = Math.PI * 2;
/** profile of the flat spherical cap: base radius a, rise h, from y0 */
function cap(a, h, y0, n = 7) {
  const R = (a * a + h * h) / (2 * h), tm = Math.asin(a / R), cm = Math.cos(tm), p = [];
  for (let i = 0; i <= n; i++) { const t = tm * (1 - i / n); p.push([R * Math.sin(t), y0 + R * (Math.cos(t) - cm)]); }
  return p;
}

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNavalCorps] top/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P;
  P.push(K.x, 0, K.z, K.rot);
  try {
    stage('pavW', () => pavilion(Q, PAV_W, true));
    stage('pavE', () => pavilion(Q, PAV_E, false));
    stage('turret', () => turret(Q));
    stage('skyline', () => skyline(Q));
  } finally { P.pop(); }
  Q.svc.corps = { top: 24.0, domes: [PAV_W.dome, PAV_E.dome], turret: [TURRET.u, TURRET.v] };
  if (errs.length) throw new Error(errs.join('\n'));
}

function pavilion(Q, pav, west) {
  const P = Q.P, M = Q.M, u0 = pav.u0, u1 = pav.u1, uc = (u0 + u1) / 2, zf = 0.5, zb = -15, y0 = HT.cornice, y1 = HT.pav;
  // the block: stucco walls up to the attic cornice (15.7), the cornice box (no top face: the zinc cap lies in it), the roof cap
  const wq = (a, b, n) => P.quad(M.stucco, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], 15.7, b[1]], [a[0], 15.7, a[1]], n, [[0, 0], [Math.hypot(b[0] - a[0], b[1] - a[1]) / 4, 0], [Math.hypot(b[0] - a[0], b[1] - a[1]) / 4, 0.6], [0, 0.6]]);
  wq([u0, zf], [u1, zf], [0, 0, 1]); wq([u1, zf], [u1, zb], [1, 0, 0]); wq([u1, zb], [u0, zb], [0, 0, -1]); wq([u0, zb], [u0, zf], [-1, 0, 0]);
  P.box(M.trim, u0 - 0.35, u1 + 0.35, 15.7, y1, zb - 0.35, zf + 0.35, 't', 2);
  P.quad(M.zinc, [u0 - 0.35, y1, zf + 0.35], [u1 + 0.35, y1, zf + 0.35], [u1 + 0.35, y1, zb - 0.35], [u0 - 0.35, y1, zb - 0.35], [0, 1, 0], [[(u0 - 0.35) / 2.4, 0], [(u1 + 0.35) / 2.4, 0], [(u1 + 0.35) / 2.4, 7], [(u0 - 0.35) / 2.4, 7]]);
  // the front of the west attic: lunette 3.5 x 1.8 m (centre height 14.6), two blind roundels d 1.7 at u0 + 1.7 / u1 - 1.7, centre height 14.0
  if (west) {
    P.quad(M.lunette, [uc - 1.75, 13.7, zf + 0.03], [uc + 1.75, 13.7, zf + 0.03], [uc + 1.75, 15.5, zf + 0.03], [uc - 1.75, 15.5, zf + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const x of [u0 + 1.7, u1 - 1.7]) P.quad(M.roundel, [x - 0.85, 14.0 - 0.85, zf + 0.03], [x + 0.85, 14.0 - 0.85, zf + 0.03], [x + 0.85, 14.0 + 0.85, zf + 0.03], [x - 0.85, 14.0 + 0.85, zf + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  } else {
    // the east pavilion keeps the lunette (the same grammar), the roundels likewise
    P.quad(M.lunette, [uc - 1.75, 13.7, zf + 0.03], [uc + 1.75, 13.7, zf + 0.03], [uc + 1.75, 15.5, zf + 0.03], [uc - 1.75, 15.5, zf + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const x of [u0 + 1.7, u1 - 1.7]) P.quad(M.roundel, [x - 0.85, 14.0 - 0.85, zf + 0.03], [x + 0.85, 14.0 - 0.85, zf + 0.03], [x + 0.85, 14.0 + 0.85, zf + 0.03], [x - 0.85, 14.0 + 0.85, zf + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // stacks on the roof: two small cream ones (west) / seven big ones behind the east dome
  if (west) for (const [u, v] of [[20.7, -14.0], [29.7, -14.0]]) { P.box(M.chimneyCream, u - 0.4, u + 0.4, y1, y1 + 1.3, v - 0.4, v + 0.4, 'b', 1); P.box(M.trim, u - 0.5, u + 0.5, y1 + 1.3, y1 + 1.45, v - 0.5, v + 0.5, 'b', 1); }
  else for (let i = 0; i < 7; i++) { const u = u0 + 1.2 + i * (u1 - u0 - 2.4) / 6, v = -16.6; P.box(M.chimneyCream, u - 0.6, u + 0.6, 13.3, 15.9, v - 0.6, v + 0.6, 'b', 1.2); P.box(M.trim, u - 0.72, u + 0.72, 15.9, 16.1, v - 0.72, v + 0.72, 'b', 1); }
  // the drum and the dome at the photo axis
  const [du, dv] = pav.dome;
  revolve(P, M.plaster, [[5.15, y1], [5.15, 17.5], [4.65, 17.5], [4.65, 17.9]], 40, { cx: du, cz: dv, uRep: 8, vTile: 1 });                  // lower ring, shoulder, upper ring
  revolve(P, M.glassDark, [[5.17, 16.8], [5.17, 17.3]], 40, { cx: du, cz: dv, uRep: 1 });                                                       // the ribbon of small dark arched openings
  revolve(P, M.zinc, [[4.65, 17.7], [4.65, 18.2], [4.25, 18.2]], 40, { cx: du, cz: dv, uRep: 8, vTile: 2.4 });                                   // the 0.5 m metal ring band
  revolve(P, M.dome, cap(4.45, 3.2, 17.7), 56, { cx: du, cz: dv, uRep: 14, vTile: 2.4 });                                                       // the flat dome, 28 standing seams
  // ball, rod (and the small gilded cross of the west dome)
  P.col(M.gild, du, dv, 20.9, 21.05, 0.14, 0.12, 8, true);
  P.col(M.iron, du, dv, 21.05, west ? 21.3 : 22.8, 0.03, 0.025, 6, false);
  P.geo(M.gild, new (Q.THREE.SphereGeometry)(0.17, 10, 6), du, 21.2, dv);
  if (west) { P.box(M.gild, du - 0.025, du + 0.025, 21.3, 22.9, dv - 0.025, dv + 0.025, '', 1); P.box(M.gild, du - 0.4, du + 0.4, 22.15, 22.2, dv - 0.02, dv + 0.02, '', 1); P.box(M.gild, du - 0.25, du + 0.25, 22.5, 22.55, dv - 0.02, dv + 0.02, '', 1); }
}

function turret(Q) {
  const P = Q.P, M = Q.M, { u, v, r } = TURRET, ph = Q.ctx.physics;
  revolve(P, M.turret, [[r, 16.4], [r, 20.0]], 32, { cx: u, cz: v, uRep: 6, vTile: 3 });
  revolve(P, M.trim, [[r + 0.07, 19.95], [r + 0.07, 20.15], [r, 20.15]], 32, { cx: u, cz: v, uRep: 6 });                                         // the belt course
  revolve(P, M.turret, [[r, 20.15], [r, 22.4]], 32, { cx: u, cz: v, uRep: 6, vTile: 3 });
  // the ribbon of paired six-light sashes round the river half (v > 0 side of the cylinder): five groups, each 1.1 m wide, 0.8 m tall at y 20.5 .. 21.3
  for (let k = 0; k < 5; k++) {
    const a = (-0.62 + k * 0.31) * Math.PI, rr = r + 0.02;           // angle from the +v axis (toward the river) in the u-v plane
    for (const s of [-1, 1]) {
      const a0 = a + s * 0.18 - 0.1, a1 = a + s * 0.18 + 0.1, P0 = [u + Math.sin(a0) * rr, v + Math.cos(a0) * rr], P1 = [u + Math.sin(a1) * rr, v + Math.cos(a1) * rr], an = (a0 + a1) / 2;
      P.quad(M.glassDark, [P0[0], 20.5, P0[1]], [P1[0], 20.5, P1[1]], [P1[0], 21.3, P1[1]], [P0[0], 21.3, P0[1]], [Math.sin(an), 0, Math.cos(an)]);
      for (const t of [0.33, 0.66]) { const pm = [u + Math.sin(a0 + (a1 - a0) * t) * (rr + 0.01), v + Math.cos(a0 + (a1 - a0) * t) * (rr + 0.01)]; P.cyl(M.trim, [pm[0], 20.5, pm[1]], [pm[0], 21.3, pm[1]], 0.012, 0.012, 4, false); }
    }
  }
  revolve(P, M.trim, [[r + 0.35, 22.4], [r + 0.35, 22.9], [r + 0.0, 22.9]], 32, { cx: u, cz: v, uRep: 6 });                                      // the stepped cornice
  revolve(P, M.zinc, [[r + 0.35, 22.98], [0, 22.98]], 32, { cx: u, cz: v, uRep: 3, vTile: 3, capTop: M.zinc });                                  // the platform slab
  revolve(P, M.trim, [[r + 0.35, 22.9], [r + 0.35, 22.98]], 32, { cx: u, cz: v, uRep: 6 });
  // the railing of round vertical bars, dia 6.0 m, 1.0 m high, top and bottom rails
  const RR = 3.0, nb = 56;
  for (let i = 0; i < nb; i++) { const a = i * TAU / nb; P.cyl(M.iron, [u + Math.sin(a) * RR, 23.0, v + Math.cos(a) * RR], [u + Math.sin(a) * RR, 24.0, v + Math.cos(a) * RR], 0.012, 0.012, 4, false); }
  for (let i = 0; i < 28; i++) for (const y of [23.1, 24.0]) { const a = i * TAU / 28, b = (i + 1) * TAU / 28; P.cyl(M.iron, [u + Math.sin(a) * RR, y, v + Math.cos(a) * RR], [u + Math.sin(b) * RR, y, v + Math.cos(b) * RR], 0.025, 0.025, 4, false); }
  ph.addCylinder(...(() => { const w = K.W(u, v); return [w.x, w.z]; })(), r + 0.3, 16, 24.2);
}

function skyline(Q) {
  const P = Q.P, M = Q.M;
  // the red-brick block behind the colonnade (u 50.5 .. 61.5, v -61 .. -74): walls from the roof level to 25 m, a gabled roof (ridge along v) to 28 m
  const x0 = 50.5, x1 = 61.5, z0 = -61, z1 = -74, ya = 13.3, yb = 25, yr = 28, xm = (x0 + x1) / 2;
  const t = (a, b, c, d, n) => P.quad(M.brickRed, a, b, c, d, n, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  t([x0, ya, z0], [x1, ya, z0], [x1, yb, z0], [x0, yb, z0], [0, 0, 1]); t([x1, ya, z1], [x0, ya, z1], [x0, yb, z1], [x1, yb, z1], [0, 0, -1]);
  t([x1, ya, z0], [x1, ya, z1], [x1, yb, z1], [x1, yb, z0], [1, 0, 0]); t([x0, ya, z1], [x0, ya, z0], [x0, yb, z0], [x0, yb, z1], [-1, 0, 0]);
  P.fan(M.brickRed, [[x0, yb, z0], [x1, yb, z0], [xm, yr, z0]], [0, 0, 1]); P.fan(M.brickRed, [[x1, yb, z1], [x0, yb, z1], [xm, yr, z1]], [0, 0, -1]);
  P.quad(M.zinc, [x0 - 0.3, yb, z0 + 0.3], [xm, yr, z0 + 0.3], [xm, yr, z1 - 0.3], [x0 - 0.3, yb, z1 - 0.3], [-0.6, 0.8, 0], [[0, 0], [2, 0], [2, 5], [0, 5]]);
  P.quad(M.zinc, [xm, yr, z0 + 0.3], [x1 + 0.3, yb, z0 + 0.3], [x1 + 0.3, yb, z1 - 0.3], [xm, yr, z1 - 0.3], [0.6, 0.8, 0], [[0, 0], [2, 0], [2, 5], [0, 5]]);
  // window rows on the gable end facing the river: three rows of small dark windows
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = x0 + 1.3 + c * 2.7, y = 15.8 + r * 2.4; P.box(M.glassDark, x - 0.5, x + 0.5, y, y + 1.4, z0 + 0.01, z0 + 0.03, 'bk', 1); }
  // two slim round chimneys, dark brick (true heights ~ 25 / 28 m): the apparent positions of the photograph seen from the Neva are u ~ 81 / 91, the true ones are further east
  for (const [u, v, h, r0] of [[92.7, -101, 25, 1.0], [104.5, -98, 28, 1.05]]) { P.col(M.chimney, u, v, 0, h, r0, r0 * 0.7, 14, false); P.col(M.chimney, u, v, h, h + 0.35, r0 * 0.78, r0 * 0.78, 14, true); Q.ctx.physics.addCylinder(K.W(u, v).x, K.W(u, v).z, r0 + 0.2, 0, h); }
}
