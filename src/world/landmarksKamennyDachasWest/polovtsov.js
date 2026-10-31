// landmarksKamennyDachasWest/polovtsov.js - the POLOVTSOV DACHA (Дача Половцова, I. A. Fomin 1912-16, OSM w60703042, the Navy officers' club since 2008): the white stucco mass of the OSM outline (a 28 m spine with the semicircular
// glazed winter garden on the WEST (river) side, two wings and a portico block facing the garden on the EAST), the dentil cornice round the whole ring, tall slender windows, copper-green hipped roofs with the glass lantern over
// the hall, the hexastyle Ionic portico of the garden front, the bay of nine engaged Ionic columns with the big glazed grid (V05 V08).  Exterior only.  Frame FP = the world axes with the origin at the middle of the ring.
// Heights [E from V02 V05 V08, the fence is 2.0 m on a 0.9 m socle]: plinth 0.9, windows 3.9 .. 7.3, cornice 8.7 .. 9.95, eaves 9.95, ridge 13.35.
import * as THREE from 'three';
import { FP, RING_POL } from './frame.js';
import { ringEdges, polyOf, band } from './kit.js';
import { Q } from './facade.js';
import { onE, spread, rq, hip, gable, spin, chimney, win, TAU } from './util.js';

const PL = 0.9, YC0 = 8.7, YC1 = 9.95, EAVE = 9.95, ZC = 0.65;
export const BAY = { cx: -23.9, cz: -3.05, R: 8.64, a: 81, n: 8 };
export const PORT = { x: 24.9, depth: 4.0, cols: [-8.0, -4.8, -1.6, 1.6, 4.8, 8.0] };         // u across the front (the centre line is z = ZC)

export async function build(K) {
  const { M, P, N } = K;
  const edges = ringEdges(polyOf(RING_POL));
  P.push(FP.ox, 0, FP.oz, 0); N.push(FP.ox, 0, FP.oz, 0);
  const bayEdge = (e) => e.i >= 9 && e.i <= 12;

  // ---- walls, plinth, windows
  for (const e of edges) {
    if (bayEdge(e)) continue;
    onE([P, N], e, (len) => {
      if (e.i === 0) return;                                                           // the portico front is drawn below
      P.quad(M.stucco, [0, 0, 0], [len, 0, 0], [len, EAVE, 0], [0, EAVE, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, EAVE / 3], [0, EAVE / 3]]);
      for (const cx of spread(len, 3.7, 2.1)) {
        win(P, N, M.winPD, M.white, { cx, y0: 3.9, w: 1.0, h: 3.4 }, { sw: 0.16, proud: 0.09, sill: 0.14 });
        win(P, N, M.winPD, M.white, { cx, y0: 1.15, w: 0.8, h: 0.9 }, { sw: 0.1, proud: 0.06, sill: 0.06 });
      }
    });
  }
  band(P, edges.filter((e) => !bayEdge(e)), 0, PL, 0.12, { front: M.granP, top: M.granP }, { uvs: 1.8 });
  const bb = edges.filter((e) => !bayEdge(e));
  band(P, bb, YC0, 9.35, 0.2, { front: M.white, top: M.white, under: M.white }, { uvs: 2 });
  band(N, bb, 9.35, 9.68, 0.4, { front: M.dentil, top: M.white, under: M.white }, { uvs: 1.02 });
  band(P, bb, 9.68, YC1, 0.62, { front: M.white, top: M.white, under: M.white }, { uvs: 2 });

  // ---- the portico of the garden front (EAST): hexastyle Ionic, columns 0.9 m, on a stylobate, a recessed door wall
  {
    const { x, depth, cols } = PORT, H = YC0, hw = 11.15, ante = 1.75;
    P.push(x, 0, ZC, Math.PI / 2); N.push(x, 0, ZC, Math.PI / 2);
    // the frieze wall above the loggia and the recessed wall
    P.quad(M.stucco, [-hw, YC0, 0], [hw, YC0, 0], [hw, EAVE, 0], [-hw, EAVE, 0], [0, 0, 1], [[0, 0], [7, 0], [7, 0.4], [0, 0.4]]);
    P.quad(M.stucco, [-(hw - ante), 0, -depth], [hw - ante, 0, -depth], [hw - ante, H, -depth], [-(hw - ante), H, -depth], [0, 0, 1], [[0, 0], [6, 0], [6, 3], [0, 3]]);
    P.quad(M.white, [-(hw - ante), H, 0], [hw - ante, H, 0], [hw - ante, H, -depth], [-(hw - ante), H, -depth], [0, -1, 0]);   // the ceiling of the loggia
    for (const s of [-1, 1]) P.box(M.stucco, s > 0 ? hw - ante : -hw, s > 0 ? hw : -(hw - ante), 0, H, -depth, 0, 'k', 3);   // the two antae
    P.box(M.granP, -hw - 0.1, hw + 0.1, 0, PL, -depth, 0.5, 'b', 1.8);                                                  // stylobate
    for (let k = 1; k <= 2; k++) P.box(M.granP, -hw + 0.4 * k - 0.1, hw - 0.4 * k + 0.1, 0, PL - 0.3 * k, 0.5, 0.5 + 0.45 * k, 'bk', 1.8);   // two steps
    // the door and the windows of the recess
    Q(P, M.doorPD, [-1.1, PL, -depth + 0.02], [1.1, PL, -depth + 0.02], [1.1, PL + 3.7, -depth + 0.02], [-1.1, PL + 3.7, -depth + 0.02], [0, 0, 1]);
    { const z = -depth; N.box(M.white, -1.35, 1.35, PL + 3.7, PL + 4.1, z, z + 0.14, 'k'); for (const s of [-1, 1]) N.box(M.white, s * 1.1, s * 1.35, PL, PL + 3.7, z, z + 0.14, 'k'); }
    for (const u of [-6.6, -3.5, 3.5, 6.6]) { P.push(0, 0, -depth, 0); N.push(0, 0, -depth, 0); win(P, N, M.winPD, M.white, { cx: u, y0: 3.9, w: 1.0, h: 3.4 }, { sw: 0.16, proud: 0.09, sill: 0.14 }); P.pop(); N.pop(); }
    // the columns: shaft with a little entasis, base, Ionic capital (echinus, abacus, four volute discs)
    for (const u of cols) {
      const z = -1.3;
      P.cyl(M.white, [u, PL + 0.32, z], [u, H - 0.5, z], 0.47, 0.4, 14, false);
      N.box(M.white, u - 0.58, u + 0.58, PL, PL + 0.32, z - 0.58, z + 0.58, 'b', 1);
      N.cyl(M.white, [u, H - 0.5, z], [u, H - 0.3, z], 0.5, 0.5, 14, true);
      N.box(M.white, u - 0.66, u + 0.66, H - 0.3, H, z - 0.66, z + 0.66, 'b', 1);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) N.cyl(M.white, [u + sx * 0.52, H - 0.42, z + sz * 0.6], [u + sx * 0.52, H - 0.42, z + sz * 0.72], 0.19, 0.19, 10, true);
    }
    // the pediment: a plain tympanum with a raking cornice (the roof gable stands behind it)
    const ph = 2.6;
    P.extrude(M.stucco, shape([[-hw, EAVE], [hw, EAVE], [0, EAVE + ph]]), -0.5, 0.52, 3, 4);
    for (const s of [-1, 1]) {
      const a = [s * hw, EAVE, 0], b = [0, EAVE + ph, 0], up = 0.3;
      rq(P, M.white, [a[0], a[1], 0.62], [b[0], b[1], 0.62], [b[0], b[1] + up, 0.62], [a[0], a[1] + up, 0.62], 2, [0, 0, 1]);
      rq(P, M.white, [a[0], a[1] + up, 0.62], [b[0], b[1] + up, 0.62], [b[0], b[1] + up, -0.4], [a[0], a[1] + up, -0.4], 2, [0, 1, 0]);
    }
    P.pop(); N.pop();
  }

  // ---- the semicircular winter garden (WEST): nine engaged Ionic columns, eight glazed bays of a 14 x 5 pane grid, a copper cone roof
  {
    const { cx, cz, R, a, n } = BAY, th = (k) => (-a + 2 * a * k / n) * Math.PI / 180;
    const pc = (t, r) => [cx - r * Math.cos(t), cz + r * Math.sin(t)];
    const out = (t) => [-Math.cos(t), 0, Math.sin(t)];
    for (let k = 0; k < n; k++) {
      const t0 = th(k), t1 = th(k + 1), tm = (t0 + t1) / 2, A = pc(t0, R), B = pc(t1, R), nn = out(tm);
      Q(P, M.winBay, [A[0], 1.0, A[1]], [B[0], 1.0, B[1]], [B[0], 8.55, B[1]], [A[0], 8.55, A[1]], nn);
      P.quad(M.granP, [A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], 1.0, B[1]], [A[0], 1.0, A[1]], nn, [[0, 0], [2, 0], [2, 0.6], [0, 0.6]]);
      P.quad(M.stucco, [A[0], 8.55, A[1]], [B[0], 8.55, B[1]], [B[0], EAVE, B[1]], [A[0], EAVE, A[1]], nn, [[0, 0], [2, 0], [2, 0.4], [0, 0.4]]);
    }
    // the cornice round the arc: frieze, dentils, corona (three stepped strips) on every segment
    const seg = (r, y0, y1, mat, topMat, uvs) => {
      for (let k = 0; k < n; k++) {
        const t0 = th(k), t1 = th(k + 1), A = pc(t0, r), B = pc(t1, r), I = pc(t0, R), J = pc(t1, R), nn = out((t0 + t1) / 2);
        P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], nn, [[0, 0], [Math.hypot(B[0] - A[0], B[1] - A[1]) / uvs, 0], [Math.hypot(B[0] - A[0], B[1] - A[1]) / uvs, 0.3], [0, 0.3]]);
        P.quad(topMat, [A[0], y1, A[1]], [B[0], y1, B[1]], [J[0], y1, J[1]], [I[0], y1, I[1]], [0, 1, 0]);
      }
    };
    seg(R + 0.2, YC0, 9.35, M.white, M.white, 2); seg(R + 0.4, 9.35, 9.68, M.white, M.white, 2); seg(R + 0.62, 9.68, YC1, M.white, M.white, 2);
    for (let k = 0; k <= n; k++) {
      const t = th(k), p = pc(t, R + 0.1), rot = Math.atan2(out(t)[0], out(t)[2]);
      P.cyl(M.white, [p[0], 1.0, p[1]], [p[0], 8.1, p[1]], 0.44, 0.38, 12, false);
      N.push(p[0], 0, p[1], rot);
      N.box(M.white, -0.55, 0.55, 0, 1.0, -0.55, 0.55, 'b', 1);
      N.box(M.white, -0.62, 0.62, 8.1, 8.6, -0.62, 0.62, 'b', 1);
      for (const sx of [-1, 1]) N.cyl(M.white, [sx * 0.5, 8.3, 0.52], [sx * 0.5, 8.3, 0.66], 0.19, 0.19, 10, true);
      N.pop();
    }
    // the copper roof over the arc and the glass lantern behind it
    spin(P, M.copper, cx, cz, [[R + 0.62, EAVE], [R * 0.62, EAVE + 1.1], [R * 0.25, EAVE + 1.7], [0, EAVE + 1.8]], 16, 1.2, -Math.PI, 0);
  }

  // ---- roofs: copper hips over the spine and the wings, a gable over the portico block
  const rf = (o) => hip(P, M.copper, { ov: 0.62, tu: 1.2, ...o });
  rf({ x0: -25.1, x1: 8.0, z0: -25.4, z1: 15.5, y: EAVE, rise: 3.4 });                  // the spine
  rf({ x0: -1.6, x1: 26.4, z0: -38.4, z1: -21.6, y: EAVE, rise: 3.0 });                 // the north wing
  rf({ x0: -3.0, x1: 25.3, z0: 22.6, z1: 37.4, y: EAVE, rise: 3.0 });                   // the south wing
  rf({ x0: -3.0, x1: 7.8, z0: 15.5, z1: 22.6, y: EAVE, rise: 2.0, ov: 0.3 });           // the arm between the spine and the south wing
  gable(P, M.copper, M.stucco, { x0: 8.0, x1: 24.9, z0: -10.6, z1: 11.9, y: EAVE, rise: 3.1, ov: 0.62, ovG: 0.3, axis: 'x', tu: 1.2, gtu: 3 });
  // the glass lantern over the hall: a 6 x 5 m drum of glazing with a truncated glass pyramid and a copper cap
  {
    const x0 = -11.5, x1 = -5.5, z0 = -7.5, z1 = -2.5, y0 = 13.0, y1 = 14.2, y2 = 15.6, i = 1.6;
    Q(P, M.winBay, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
    Q(P, M.winBay, [x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1]);
    Q(P, M.winBay, [x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0]);
    Q(P, M.winBay, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]);
    const t = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], u = [[x0 + i, y2, z0 + i * 0.8], [x1 - i, y2, z0 + i * 0.8], [x1 - i, y2, z1 - i * 0.8], [x0 + i, y2, z1 - i * 0.8]];
    Q(P, M.winBay, t[0], t[1], u[1], u[0], [0, 0.6, -1]); Q(P, M.winBay, t[2], t[3], u[3], u[2], [0, 0.6, 1]);
    Q(P, M.winBay, t[3], t[0], u[0], u[3], [-1, 0.6, 0]); Q(P, M.winBay, t[1], t[2], u[2], u[1], [1, 0.6, 0]);
    P.box(M.copper, x0 + i, x1 - i, y2, y2 + 0.12, z0 + i * 0.8, z1 - i * 0.8, 'b', 1.2);
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) P.box(M.white, x - 0.1, x + 0.1, y0, y1 + 0.1, z - 0.1, z + 0.1, 'b', 1);
  }
  for (const [x, z, y0] of [[10, -30, 12.4], [20, -30, 12.4], [10, 30, 12.4], [20, 30, 12.4], [-20, -3, 10.7], [-12, 10, 11.4], [3, -17, 12.0]]) chimney(P, M, x, z, y0, y0 + 2.5, 1.1, 1.1, M.stucco);

  // colliders (world metres): the blocks of the plan, the bay as a cylinder (the closed plot: nobody gets in)
  const W = (x, z) => [x + FP.ox, z + FP.oz], bx = (x0, x1, z0, z1, h) => { const a = W(x0, z0), b = W(x1, z1); (K.shared.cols ||= []).push({ box: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0] - a[0], b[1] - a[1], 0, h] }); };
  bx(-25.1, 8.0, -25.4, 15.5, 14); bx(-1.6, 26.4, -38.4, -21.6, 13); bx(-3.0, 25.3, 22.6, 37.4, 13); bx(-3.0, 7.8, 15.5, 22.6, 12); bx(8.0, 24.9, -10.6, 11.9, 13);
  { const c = W(BAY.cx, BAY.cz); (K.shared.cols ||= []).push({ cyl: [c[0], c[1], BAY.R + 0.3, 11.5] }); }

  P.pop(); N.pop();
}

function shape(pts) { const s = new THREE.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.lineTo(pts[0][0], pts[0][1]); return s; }
void TAU; void gable;
