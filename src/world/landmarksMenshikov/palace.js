// landmarksMenshikov/palace.js - the MENSHIKOV PALACE (Меншиковский дворец, Universitetskaya nab. 15; Fontana / Schedel 1710-27, restored 1956-81; OSM w216655164, 22 vertices, 1469 m2).
// Dossier docs/research/menshikov.md section 2, photos refs/menshikov 01 15 21 23 24 30 114 N04 N05 N16.  Frame PF (frame.js: a along the river front, b toward the Neva).
//   WALLS    one extruded plaster panel per footprint edge with real window openings (3 storeys of pilasters: pitch 2.75 m, cream surrounds, small-pane sashes), granite plinth with cellar grilles,
//            string courses at 4.1 / 8.2 m and a stepped cornice at 12.5 m; the front = the 24.8 m recess (9 axes) between two 8 m RISALITS (2 axes) that carry curved gables with an oval window,
//            black vases with gilded flames and a black crown with a cross on the apex.
//   PORTICO  four cream columns on granite bases, six granite steps (the entrance floor is +1.0 m), a blue-grey sheet canopy = the balcony slab with the iron lattice balustrade, the brown door.
//   ROOFS    the mansard (eaves 12.5, break 16.3, flat top 18.3, diamond sheet) with three dormers, the attic of five sunk panels, three chimneys and the fire ladder; hipped wing roofs (ridge 16.7, green-grey).
// Colliders: thin walls round the footprint (the palace is a closed museum: exterior only).  Claim: groups.js key 'menshikov-palace'.
import * as THREE from 'three';
import * as L from '../layout.js';
import { PF, HP, PALACE_ID, PALACE_RING } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { holedWall, pane, surround, pilaster, band, cornice } from './facade.js';
import { revolve, planeShape } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;

/** the footprint of the palace: the baked polygon (world), fallback the dossier ring through frame PF */
export function palacePoly() {
  try { const b = L.buildingById(PALACE_ID); if (b && b.polys && b.polys[0] && b.polys[0].o.length === 44) return b.polys[0]; } catch (e) { /* fall back */ }
  return { o: PALACE_RING.flatMap(([a, b]) => { const p = PF.W(a, b); return [p.x, p.z]; }), h: [] };
}

export const PORTICO = { ac: -0.3, step: 2.7, zc: 2.3, door: -0.3 };
/** a square pier with chamfered corners: half width w, chamfer c, from y0 to y1 (eight faces, outward normals) */
function chamferPier(P, mat, x, z, y0, y1, w, c) {
  const v = [[-(w - c), w], [w - c, w], [w, w - c], [w, -(w - c)], [w - c, -w], [-(w - c), -w], [-w, -(w - c)], [-w, w - c]];
  for (let i = 0; i < 8; i++) {
    const a = v[i], b = v[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
    P.quad(mat, [x + a[0], y0, z + a[1]], [x + b[0], y0, z + b[1]], [x + b[0], y1, z + b[1]], [x + a[0], y1, z + a[1]], [-dz / l, 0, dx / l], [[0, 0], [l, 0], [l, (y1 - y0) / 3], [0, (y1 - y0) / 3]]);
  }
}
const ROWS = [   // window rows: y0, height, material key, surround key (second-storey windows have a keystone)
  { y0: 1.75, h: 2.0, mat: 'winTall', key: false },
  { y0: 5.35, h: 2.0, mat: 'winTall', key: false },
  { y0: 9.4, h: 1.4, mat: 'winLow', key: true },
];
const STOREYS = [[HP.plinth, HP.s1], [HP.s1t, HP.s2], [HP.s2t, HP.cornice]];

/** one wall of the palace in its facade frame: n axes of windows between pilasters (st.m = margin of the first pilaster, st.n fixed axes, st.plain = no windows, st.skip = [[row, k]] openings left out) */
function bayWall(K, len, st = {}) {
  const P = K.P, M = K.M, m = st.m ?? 0.55;
  const plain = st.plain || len < 2.2;
  const n = plain ? 0 : (st.n ?? Math.max(1, Math.round((len - 2 * m) / 2.75))), pitch = n ? (len - 2 * m) / n : len;
  const holes = [], rows = st.rows || ROWS, skip = st.skip || [];
  for (let k = 0; k < n; k++) {
    const cx = m + pitch * (k + 0.5), hw = Math.min(0.5, pitch * 0.2);
    rows.forEach((r, ri) => { if (!skip.some(([sr, sk]) => sr === ri && sk === k)) holes.push({ x0: cx - hw, x1: cx + hw, y0: r.y0, y1: r.y0 + r.h, row: r }); });
  }
  // granite plinth with cellar grilles every second axis
  P.box(M.plinth, 0, len, 0, HP.plinth, -0.3, 0.1, '');
  P.box(M.plinth, -0.02, len + 0.02, HP.plinth - 0.1, HP.plinth + 0.05, 0, 0.16, 'k');
  for (let k = 0; k < n; k += 2) { const cx = m + pitch * (k + 0.5); P.quad(M.cellar, [cx - 0.5, 0.3, 0.104], [cx + 0.5, 0.3, 0.104], [cx + 0.5, 0.8, 0.104], [cx - 0.5, 0.8, 0.104], [0, 0, 1]); }
  holedWall(P, M.wallY, 0, len, HP.plinth, HP.eave, holes);
  for (const h of holes) {
    pane(P, M[h.row.mat], h);
    surround(P, M.cream, h, { sw: 0.2, key: h.row.key, sill: h.row.y0 < 9 ? 0.1 : 0.06 });
  }
  band(P, M.cream, 0, len, HP.s1, HP.s1t, 0.12);
  band(P, M.cream, 0, len, HP.s2, HP.s2t, 0.12);
  cornice(P, M.cream, 0, len, HP.cornice, HP.eave);
  for (let k = 0; k <= Math.max(n, 1); k++) {
    const x = n ? m + pitch * k : (k ? len - 0.3 : 0.3);
    for (const [y0, y1] of STOREYS) pilaster(P, M.cream, Math.min(len - 0.28, Math.max(0.28, x)), y0, y1, { w: 0.5, proud: 0.12 });
  }
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMenshikov] palace/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const poly = palacePoly();
  K.palace = { poly };
  stage('walls', () => walls(K, poly));
  stage('roofs', () => roofs(K));
  stage('gables', () => gables(K, K.palace.edges));
  stage('portico', () => portico(K));
  stage('colliders', () => addPolyColliders(K.ctx, poly, 0, HP.eave, 0.9));
  const c = PF.W(0, -16);
  K.svc.monuments.push({ id: PALACE_ID, name: 'Меншиковский дворец', x: c.x, z: c.z, h: HP.top });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ walls
function walls(K, poly) {
  const P = K.P, edges = ringEdges(poly, 0.3);
  K.palace.edges = edges;
  const exact = poly.o.length === 44;
  for (const e of edges) {
    // classify by the edge midpoint / normal in frame P
    const am = PF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nA = e.n[0] * PF.ax[0] + e.n[1] * PF.ax[1], nB = e.n[0] * PF.bz[0] + e.n[1] * PF.bz[1];
    e.pa = am.a; e.pb = am.b; e.nA = nA; e.nB = nB;
    let st = {};
    if (exact && nB > 0.9 && am.b > 1.5) { e.kind = 'risalitFront'; st = { m: 0.5, n: 2 }; }
    else if (exact && nB > 0.9 && am.b > -1) { e.kind = 'front'; st = { m: 0.25, n: 9, skip: [[0, 4]] }; }
    else if (exact && Math.abs(nA) > 0.9 && e.len < 3.2) { e.kind = 'risalitSide'; st = { plain: true, m: 0.3 }; }
    else {
      e.kind = 'wall'; if (e.len < 5.4) st = { n: 1, m: 0.7 };
      if (exact && nB > 0.9 && Math.abs(am.a + 26.4) < 1.2 && Math.abs(am.b + 14.6) < 0.6) st = { skip: [[0, 1]] };   // the visitors door of the west wing (forecourt.js)
    }
    e.st = st;
    onEdge(P, e, (len) => bayWall(K, len, st));
  }
}

// ------------------------------------------------------------------------------------------------ roofs (frame PF: x = a, z = b)
/** a sloped quad between a lower edge A-B (points [a, b] at heights ya / yb) and an upper edge D-C; the normal is the upward-facing one */
function slopeQuad(P, mat, A, B, C, D, ya, yb, yc, yd, tu = 0.9, tv = 0.6) {
  const la = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const ux = B[0] - A[0], uz = B[1] - A[1], wy = (yc + yd - ya - yb) / 2, wx = (C[0] + D[0] - A[0] - B[0]) / 2, wz = (C[1] + D[1] - A[1] - B[1]) / 2;
  let nx = -uz * wy, ny = uz * wx - ux * wz, nz = ux * wy;
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
  const lv = Math.hypot(wx, wy, wz);
  P.quad(mat, [A[0], ya, A[1]], [B[0], yb, B[1]], [C[0], yc, C[1]], [D[0], yd, D[1]], [nx, ny, nz], [[0, 0], [la / tu, 0], [la / tu, lv / tv], [0, lv / tv]]);
}
/** a rectangle -> rectangle roof stage (4 sloped faces) from E = [a0, a1, b0, b1] at y0 up to B at y1 */
function hipStage(P, mat, E, y0, B, y1, tu, tv) {
  const e = [[E[0], E[2]], [E[1], E[2]], [E[1], E[3]], [E[0], E[3]]], b = [[B[0], B[2]], [B[1], B[2]], [B[1], B[3]], [B[0], B[3]]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; slopeQuad(P, mat, e[i], e[j], b[j], b[i], y0, y0, y1, y1, tu, tv); }
}
/** a hipped roof over the rectangle a0..a1 x b0..b1 (ridge along b, a 45 degree hip plan), eaves yE with an overhang ov, ridge yR */
function hipRoof(P, mat, a0, a1, b0, b1, yE, yR, ov = 0.45) {
  const cx = (a0 + a1) / 2, hw = (a1 - a0) / 2, hl = (b1 - b0) / 2, cz = (b0 + b1) / 2, half = hw + ov, run = hw, rise = yR - yE;
  const r0 = [cx, cz - hl + run], r1 = [cx, cz + hl - run], zN = cz - hl - ov, zS = cz + hl + ov;
  const lo = (zS - zN) / 0.9, ri = (r1[1] - r0[1]) / 0.9, sl = Math.hypot(half, rise) / 0.6;
  P.quad(mat, [cx - half, yE, zN], [cx - half, yE, zS], [r1[0], yR, r1[1]], [r0[0], yR, r0[1]], [-rise, half, 0], [[0, 0], [lo, 0], [ri, sl], [0, sl]]);
  P.quad(mat, [cx + half, yE, zS], [cx + half, yE, zN], [r0[0], yR, r0[1]], [r1[0], yR, r1[1]], [rise, half, 0], [[0, 0], [lo, 0], [ri, sl], [0, sl]]);
  P.fan(mat, [[cx - half, yE, zN], [cx + half, yE, zN], [r0[0], yR, r0[1]]], [0, half, -rise], (p) => [p[0] / 0.9, (p[1] - yE) / 0.6]);
  P.fan(mat, [[cx + half, yE, zS], [cx - half, yE, zS], [r1[0], yR, r1[1]]], [0, half, rise], (p) => [p[0] / 0.9, (p[1] - yE) / 0.6]);
  return { r0, r1 };
}
function dormer(P, M, a, b, y, face = 1) {
  // a small arched dormer: a box 1.56 wide / 1.55 high with a round-headed window and a little gable roof; face = +1 looks toward +b (the river), -1 toward -b
  P.push(a, 0, b, face > 0 ? 0 : Math.PI);
  P.box(M.dormerWood, -0.78, 0.78, y, y + 1.55, -1.6, 0.0, 'bt');
  const arc = Array.from({ length: 7 }, (_, i) => { const t = Math.PI * (i + 1) / 8; return [Math.cos(t) * 0.5, y + 0.75 + Math.sin(t) * 0.5]; });
  planeShape(P, M.winDormer, [[-0.5, y + 0.2], [0.5, y + 0.2], [0.5, y + 0.75], ...arc, [-0.5, y + 0.75]], 0.012);
  P.box(M.creamFlat, -0.6, -0.5, y + 0.18, y + 0.78, 0.0, 0.05, 'k'); P.box(M.creamFlat, 0.5, 0.6, y + 0.18, y + 0.78, 0.0, 0.05, 'k');
  P.box(M.dormerWood, -0.86, 0.86, y + 1.5, y + 1.66, -1.6, 0.1, '');
  const yr = y + 2.15;
  P.quad(M.roofTop, [-0.9, y + 1.65, 0.12], [-0.9, y + 1.65, -1.6], [0, yr, -1.6], [0, yr, 0.12], [-0.8, 0.7, 0]);
  P.quad(M.roofTop, [0.9, y + 1.65, -1.6], [0.9, y + 1.65, 0.12], [0, yr, 0.12], [0, yr, -1.6], [0.8, 0.7, 0]);
  P.fan(M.dormerWood, [[-0.9, y + 1.65, 0.1], [0.9, y + 1.65, 0.1], [0, yr, 0.1]], [0, 0, 1]);
  P.pop();
}
function chimney(P, M, a, b, y0, y1) {
  P.box(M.wallY, a - 0.6, a + 0.6, y0, y1, b - 0.6, b + 0.6, 'b');
  P.box(M.creamFlat, a - 0.72, a + 0.72, y1, y1 + 0.18, b - 0.72, b + 0.72, '');
  P.box(M.iron, a - 0.2, a + 0.2, y1 + 0.18, y1 + 0.5, b - 0.2, b + 0.2, 'b');
}
function roofs(K) {
  const P = K.P, M = K.M;
  P.push(PF.x, 0, PF.z, PF.rot);
  try {
    const eave = HP.eave + 0.02;
    // ---- the main mansard on the block a -20.1..20.1, b -16.1..-0.2 (hip ends on all four sides)
    const E = [-20.65, 20.65, -16.65, 0.4], Bk = [-17.6, 17.6, -14.0, -2.1], T = [-12.3, 12.3, -9.9, -6.2];
    hipStage(P, M.roofLow, E, eave, Bk, HP.brk, 0.9, 0.6);
    hipStage(P, M.roofTop, Bk, HP.brk, T, HP.top, 1, 1);
    P.cap(M.roofTop, [[T[0], T[2]], [T[1], T[2]], [T[1], T[3]], [T[0], T[3]]], HP.top, true, 3);
    // dark edge strips at the break and the crest
    for (const [yy, R] of [[HP.brk, Bk], [HP.top, T]]) {
      const pts = [[R[0], R[2]], [R[1], R[2]], [R[1], R[3]], [R[0], R[3]]];
      for (let i = 0; i < 4; i++) { const p = pts[i], q = pts[(i + 1) % 4]; const l = Math.hypot(q[0] - p[0], q[1] - p[1]); P.push(p[0], yy, p[1], Math.atan2(-(q[1] - p[1]), q[0] - p[0])); P.box(M.roofEdge, 0, l, -0.05, 0.1, -0.08, 0.08, ''); P.pop(); }
    }
    // decks on top of the risalits (behind their gables) so that no hole shows between the wall tops and the mansard
    for (const [a0, a1] of [[12.1, 20.1], [-20.1, -12.7]]) P.cap(M.roofTop, [[a0, -0.2], [a1, -0.2], [a1, 2.7], [a0, 2.7]], HP.eave - 0.02, true, 3);
    // dormers: three on the river slope, three on the back slope (the slope is steep: run 2.5 m / rise 3.8 m)
    // review fix: the two side dormers stand on the lower slope (a +-9.5, photo 114); the central one stands HIGHER up the slope, behind the attic (photo 114: it peeks over the attic top)
    for (const a of [-9.5, 9.5]) dormer(P, M, a, 0.12, 13.4, 1);
    dormer(P, M, 0, -0.9, 14.45, 1);
    for (const a of [-9.5, 0, 9.5]) dormer(P, M, a, -16.3, 13.4, -1);
    // chimneys on the crest, the fire ladder under the central one (a +1.5)
    for (const a of [-10.5, 1.5, 13.5]) chimney(P, M, a, -7.4, HP.top - 0.2, HP.top + 1.2);
    {
      // review fix: the ladder follows the real two-slope profile of the mansard (the old straight line ran INSIDE the roof and was invisible): from the attic top up the lower slope (1.52 m rise per m), over the break (b -2.1, y 16.3) and up the upper slope to the crest
      const x = 1.5, yr = (b) => (b > -2.1 ? HP.eave + 0.02 + (0.4 - b) * 1.52 : HP.brk + (-2.1 - b) * 0.488) + 0.1;
      const pts = [-0.9, -1.5, -2.1, -3.2, -4.6, -6.0].map((b) => [b, yr(b)]);
      for (let i = 0; i + 1 < pts.length; i++) for (const s of [-0.28, 0.28]) P.cyl(M.iron, [x + s, pts[i][1], pts[i][0]], [x + s, pts[i + 1][1], pts[i + 1][0]], 0.03, 0.03, 4, false);
      for (let i = 0; i + 1 < pts.length; i++) {
        const n = Math.max(2, Math.round(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / 0.4));
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, bb = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, yy = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; P.cyl(M.iron, [x - 0.28, yy, bb], [x + 0.28, yy, bb], 0.015, 0.015, 3, false); }
      }
    }
    // ---- the attic of the recess: a in -7.3..7.3, standing right behind the cornice (review fix: it was set back 0.75 m INTO the lower slope of the mansard and was buried; in photo 114 it is a visible screen wall of five sunk panels in front of the roof), five sunk panels, six iron stubs
    {
      const x0 = -7.3, x1 = 7.3, y0 = HP.eave, y1 = HP.atticTop + 0.3, zf = 0.0;
      P.box(M.creamFlat, x0, x1, y0, y1, zf - 0.5, zf, 'b');
      P.box(M.creamFlat, x0 - 0.1, x1 + 0.1, y1 - 0.18, y1, zf - 0.5, zf + 0.12, '');
      const n = 5, pw = (x1 - x0 - 0.5 * 6) / n;
      for (let i = 0; i < n; i++) { const xa = x0 + 0.5 + i * (pw + 0.5); P.quad(M.wallY, [xa, y0 + 0.35, zf + 0.012], [xa + pw, y0 + 0.35, zf + 0.012], [xa + pw, y1 - 0.4, zf + 0.012], [xa, y1 - 0.4, zf + 0.012], [0, 0, 1], [[0, 0], [pw / 3, 0], [pw / 3, 1], [0, 1]]); }
      for (let i = 0; i <= n; i++) P.box(M.creamFlat, x0 + i * (pw + 0.5), x0 + i * (pw + 0.5) + 0.5, y0 + 0.2, y1 - 0.25, zf, zf + 0.1, 'bk');
      for (let i = 0; i < 6; i++) P.cyl(M.iron, [x0 + 0.25 + i * (x1 - x0 - 0.5) / 5, y1, zf - 0.2], [x0 + 0.25 + i * (x1 - x0 - 0.5) / 5, y1 + 0.35, zf - 0.2], 0.12, 0.1, 6, true);
    }
    // ---- the wings: hipped roofs, eave 12.5, ridge 16.7 (the ridge runs along b), two chimneys each, a dormer on the river-end hip
    for (const [a0, a1, b0, b1] of [[-32.8, -18.9, -40.7, -14.6], [19.7, 33.4, -40.9, -13.0]]) {
      const cx = (a0 + a1) / 2, ov = 0.45;
      const { r0, r1 } = hipRoof(P, M.roofWing, a0, a1, b0, b1, eave, HP.wingRidge, ov);
      P.cap(M.roofWingTop, [[a0, b0], [a1, b0], [a1, b1], [a0, b1]], HP.eave - 0.05, true, 3);
      for (const t of [0.2, 0.8]) chimney(P, M, cx, r0[1] + (r1[1] - r0[1]) * t, HP.wingRidge - 0.3, HP.wingRidge + 1.2);
      dormer(P, M, cx, b1 + ov - 1.6, 13.0, 1);
    }
    // ---- the rear stair bay (a -6.1..6.1, b -21.2..-16.1): a low hip
    {
      const E2 = [-6.5, 6.5, -21.6, -15.7], B2 = [-3.2, 3.2, -19.9, -17.4];
      hipStage(P, M.roofWing, E2, eave, B2, eave + 2.0, 0.9, 0.6);
      P.cap(M.roofWingTop, [[B2[0], B2[2]], [B2[1], B2[2]], [B2[1], B2[3]], [B2[0], B2[3]]], eave + 2.0, true, 3);
    }
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ gables, vases, crowns
function vase(P, M, x, y, z) {
  const prof = [[0, 0], [0.34, 0], [0.34, 0.08], [0.26, 0.16], [0.2, 0.3], [0.38, 0.55], [0.44, 0.72], [0.34, 0.9], [0.2, 0.98], [0.26, 1.02], [0.26, 1.08], [0.14, 1.1]];
  revolve(P, M.vase, prof.map(([r, h]) => [r, y + h]), 14, { cx: x, cz: z, crease: 50 });
  revolve(P, M.gold, [[0.14, y + 1.1], [0.2, y + 1.22], [0.14, y + 1.4], [0.05, y + 1.62], [0.0, y + 1.68]], 8, { cx: x, cz: z, crease: 60 });
}
function crown(P, M, x, y, z) {
  const prof = [[0, 0], [0.62, 0], [0.62, 0.22], [0.5, 0.26], [0.5, 0.4], [0.66, 0.62], [0.58, 0.95], [0.34, 1.2], [0.16, 1.32], [0.1, 1.42]];
  revolve(P, M.crown, prof.map(([r, h]) => [r, y + h]), 16, { cx: x, cz: z, crease: 50 });
  revolve(P, M.crownBand, [[0.64, y + 0.0], [0.64, y + 0.2], [0.52, y + 0.24], [0.52, y + 0.0]], 16, { cx: x, cz: z, crease: 80 });
  P.box(M.crownBand, x - 0.03, x + 0.03, y + 1.42, y + 1.9, z - 0.03, z + 0.03, '');
  P.box(M.crownBand, x - 0.17, x + 0.17, y + 1.66, y + 1.72, z - 0.025, z + 0.025, '');
}
/** the curved baroque gable half-profile (x from the axis, y above the base) */
const GABLE_HALF = [[3.2, 0], [3.2, 0.3], [2.95, 0.72], [2.45, 0.95], [2.2, 1.4], [2.0, 1.95], [1.55, 2.4], [0.95, 2.78], [0.4, 2.97], [0, 3.0]];
function gables(K, edges) {
  const P = K.P, M = K.M;
  for (const e of edges || []) {
    if (e.kind !== 'risalitFront') continue;
    onEdge(P, e, (len) => {
      const cx = len / 2, y0 = HP.eave;
      const outline = (sc) => { const r = GABLE_HALF.map(([x, y]) => [cx + x * sc, y0 + y * sc]); const l = GABLE_HALF.slice(0, -1).reverse().map(([x, y]) => [cx - x * sc, y0 + y * sc]); return r.concat(l); };
      const shp = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      // stack: cream border (full outline), yellow field (inset)
      P.extrude(M.creamFlat, shp(outline(1.0)), -0.05, 0.42, 1, 4);
      P.extrude(M.wallY, shp(outline(0.9).map(([x, y]) => [x, y + 0.04])), 0.37, 0.09, 3, 4);
      // the oval window 1.7 x 1.15 in a cream frame
      const ell = (rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * TAU / n) * rx, y0 + 1.5 + Math.sin(i * TAU / n) * ry]);
      P.extrude(M.creamFlat, shp(ell(0.95, 0.67)), 0.44, 0.06, 1, 4);
      planeShape(P, M.winOval, ell(0.78, 0.5), 0.512);
      // the two scroll "ears" of the baroque gable (a cream roll with a yellow eye) and a small cartouche shell under the oval window
      for (const s of [-1, 1]) {
        P.cyl(M.creamFlat, [cx + s * 2.55, y0 + 0.92, -0.04], [cx + s * 2.55, y0 + 0.92, 0.5], 0.4, 0.4, 14, true);
        P.cyl(M.wallY, [cx + s * 2.55, y0 + 0.92, 0.49], [cx + s * 2.55, y0 + 0.92, 0.53], 0.22, 0.22, 12, true);
        P.cyl(M.creamFlat, [cx + s * 2.55, y0 + 0.92, 0.52], [cx + s * 2.55, y0 + 0.92, 0.58], 0.09, 0.09, 8, true);
        P.cyl(M.creamFlat, [cx + s * 1.75, y0 + 2.0, -0.04], [cx + s * 1.75, y0 + 2.0, 0.46], 0.2, 0.2, 10, true);
      }
      // crown on the apex, vases at the two lower corners of the gable
      crown(P, M, cx, y0 + 3.0, 0.15);
      for (const x of [0.5, len - 0.5]) vase(P, M, x, y0, 0.28);
    });
  }
}

// ------------------------------------------------------------------------------------------------ portico, balcony, steps, door
function portico(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  P.push(PF.x, 0, PF.z, PF.rot);
  try {
    const { ac, step, zc } = PORTICO, yF = HP.plinth, yI = 3.7, R = 0.42;          // axis, pitch, column z, entrance floor, impost, shaft radius
    // six granite steps between the two inner columns: the run 2.5 m from b 2.4 to -0.1 (OSM w767617583), riser 1/6 of the plinth height, clear width 2.2
    const nS = 6, tread = 2.5 / nS, wS = 2.2;
    for (let i = 0; i < nS; i++) { const b1 = 2.4 - i * tread, b0 = b1 - tread; P.box(M.plinth, ac - wS / 2, ac + wS / 2, 0, yF * (i + 1) / nS, b0, b1, ''); }
    // columns: cream-white shaft 0.84 m, granite square base 1.15 x 1.15 x 0.5 on the paving, impost block 1.1 x 1.1 x 0.35
    // review fix (photo 21): the free supports are SQUARE piers with chamfered corners (not round columns), a moulded base, and a dark metal-sheathed impost block under the balcony slab
    for (const k of [-1.5, -0.5, 0.5, 1.5]) {
      const x = ac + k * step;
      P.box(M.plinth, x - 0.58, x + 0.58, 0, 0.5, zc - 0.58, zc + 0.58, 'b');
      chamferPier(P, M.column, x, zc, 0.5, yI - 0.35, 0.42, 0.13);
      P.box(M.creamFlat, x - 0.5, x + 0.5, 0.5, 0.64, zc - 0.5, zc + 0.5, 'b');                      // the moulded base
      P.box(M.creamFlat, x - 0.5, x + 0.5, yI - 0.35, yI - 0.2, zc - 0.5, zc + 0.5, 'b');            // the collar under the impost
      P.box(M.creamFlat, x - 0.6, x + 0.6, yI - 0.2, yI - 0.08, zc - 0.6, zc + 0.6, '');             // the moulding
      P.box(M.canopy, x - 0.55, x + 0.55, yI - 0.08, yI + 0.35, zc - 0.55, zc + 0.55, '');           // the dark impost block
    }
    // the balcony slab: top flush with the string course (4.45), over the whole recess, front edge b 3.0, faced with blue-grey sheet
    const x0 = -12.9, x1 = 12.3, yB0 = 4.05, yB1 = HP.s1t, zf = 3.0, zw = -0.2;
    P.box(M.canopy, x0, x1, yB0, yB1, zw, zf, '');
    P.box(M.creamFlat, x0, x1, yB0 - 0.08, yB0, zw, zf - 0.05, 't');
    // iron balustrade 1.0 m high: two rails, balusters and a diamond lattice
    const yb = yB1, bh = 1.0;
    const rail = (xa, za, xb, zb) => {
      const len = Math.hypot(xb - xa, zb - za); if (len < 0.1) return;
      P.push(xa, yb, za, Math.atan2(-(zb - za), xb - xa));
      P.box(M.iron, 0, len, bh - 0.05, bh, -0.03, 0.03, '');
      P.box(M.iron, 0, len, 0.05, 0.09, -0.02, 0.02, '');
      const n = Math.max(2, Math.round(len / 0.36));
      for (let i = 0; i <= n; i++) { const x = len * i / n; P.cyl(M.iron, [x, 0.08, 0], [x, bh - 0.05, 0], 0.011, 0.011, 3, false); }
      for (let i = 0; i < n; i++) { const xa2 = len * i / n, xb2 = len * (i + 1) / n; P.cyl(M.iron, [xa2, 0.1, 0], [xb2, bh - 0.08, 0], 0.008, 0.008, 3, false); P.cyl(M.iron, [xa2, bh - 0.08, 0], [xb2, 0.1, 0], 0.008, 0.008, 3, false); }
      for (const x of [0, len]) P.box(M.iron, x - 0.04, x + 0.04, 0, bh, -0.04, 0.04, '');
      P.pop();
    };
    rail(x0 + 0.1, zf - 0.1, x1 - 0.1, zf - 0.1);
    rail(x0 + 0.1, zf - 0.1, x0 + 0.1, zw + 0.3); rail(x1 - 0.1, zf - 0.1, x1 - 0.1, zw + 0.3);
    // the entrance door in a rusticated surround (the central ground-floor bay, a -0.3): a dark brown double door 1.4 x 2.6 under a keystoned lintel
    const dx = PORTICO.door;
    P.box(M.rustic, dx - 1.25, dx - 0.7, yF, yF + 3.0, -0.2, 0.1, '');
    P.box(M.rustic, dx + 0.7, dx + 1.25, yF, yF + 3.0, -0.2, 0.1, '');
    P.box(M.rustic, dx - 1.25, dx + 1.25, yF + 2.6, yF + 3.0, -0.2, 0.1, '');
    P.box(M.door, dx - 0.7, dx + 0.7, yF, yF + 2.6, -0.25, -0.12, 'b');
    P.box(M.creamFlat, dx - 0.03, dx + 0.03, yF, yF + 2.6, -0.12, -0.08, '');
    P.box(M.rustic, dx - 0.2, dx + 0.2, yF + 2.55, yF + 3.15, -0.2, 0.16, '');
    // ---- physics: the six steps are walkable up to the closed door; the columns block
    const c = PF.W(ac, 2.4 - 2.5 / 2);
    ph.addStairs(c.x, c.z, wS, 2.5, PF.rot + Math.PI, 0, yF, nS);
    const lp = PF.W(ac, -0.1 - 0.3); ph.addWalkBox(lp.x, lp.z, wS, 0.6, PF.rot, yF);
    for (const k of [-1.5, -0.5, 0.5, 1.5]) { const p = PF.W(ac + k * step, zc); ph.addCylinder(p.x, p.z, 0.55, 0, yI + 0.4); }
    const dp = PF.W(dx, 0.1); K.svc.entrances.push({ id: 'palace-portico', x: dp.x, z: dp.z, rotY: PF.rot, open: false });
  } finally { P.pop(); }
}
