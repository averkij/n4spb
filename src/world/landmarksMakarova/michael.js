// landmarksMakarova/michael.js - the LUTHERAN CHURCH OF ST MICHAEL (Sredny pr. 18 / 3rd liniya 32; K. Bulmering 1871-76, facade 1886; OSM r18085303 + four parts; docs/research/makarova.md section 8; photos m01 m02 m04 m05 m06 m07).
// Frame M (frame.js): origin = the west corner of the facade, u across (ENE), v along the nave (SSE); the facade at v = 0 faces NNW onto Sredny pr.  Neo-Gothic, painted cream stucco (not sandstone).
//   * FACADE (16.4 m wide, drawn in the wall frame x' = 15.6 - u): a central mass (u 2.4 .. 12.2, to the parapet 15.5) between two lower aisle fronts (wall 10.8, lean-to roofs), the three-order pointed PORTAL (oak doors 2.5 x 4.2,
//     four granite steps), the steep crocketed gable over it (apex 11.3), two buttresses with gablet pinnacles, the ROSE WINDOW (d 4.1, centre 12.6), cast-iron lanterns, the notice board «СОБОР / Св. Михаила», one tall pointed
//     lancet over a square window on each aisle;
//   * NAVE: six 5.5 m bays each side painted with a pair of lancets over an oculus in a pointed blind arch, pilaster-buttress strips, a corbel table at 10.8, one gable roof (ridge 15.0, dark grey), the SSE gable end;
//   * TOWER (total 46 m): belfry I (square 6.6 m, 15.5 .. 22.9, pointed blind arches, four slim white pinnacle turrets 3.5 m), belfry II (octagon 5.9 m across flats, 22.9 .. 32.9, a tall louvred lancet on each cardinal face,
//     four crocketed gablets, a parapet) and the dark metal octagonal SPIRE (32.9 .. 43.6) with the gold cross to 46.0.
// Colliders: the outline (thin walls, the porch bump replaced by the facade line), the portal steps (physics.addStairs).  Publishes the photo spot and a monument entry; the notice board is reserved through the labels registry.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FM, FALL, ringIn, polyIn, colliders } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { wallHoles, cornice, lathe, gable, headPts } from './facade.js';

const Y_EAVE = 10.8, Y_RIDGE = 15.0, Y_PARAPET = 15.5, FACADE_X = 15.6;
const TOWER = { cx: 7.25, cz: 3.0, h: 3.3 };

export function build(K) {
  const { ctx, P } = K, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] michael/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const ring = ringIn(FM, 'r18085303', FALL.michael);
  P.push(FM.x, 0, FM.z, FM.rot);
  try {
    stage('facade', () => facade(K));
    stage('nave', () => nave(K, ring));
    stage('roofs', () => roofs(K));
    stage('tower', () => tower(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders_(K, ring));
  const c = FM.W(7.25, 3.0);
  K.svc.monuments.push({ id: 'r18085303', name: 'Лютеранская церковь Св. Михаила', x: c.x, z: c.z, h: 46 });
  K.svc.photoSpots.push({ x: -3779, z: -1346, yaw: L.yawToward ? L.yawToward(-3779, -1346, c.x, c.z) : 140, name: 'Лютеранская церковь Св. Михаила' });
  if (errs.length) throw new Error(errs.join('\n'));
}

/** a pointed-arch ring (an order of the portal): the band between two equilateral pointed arches of widths w0 < w1 on the same spring line, standing proud by z1 */
function gothRing(P, mat, x, y0, h, w0, w1, z1) {
  const a = headPts({ kind: 'goth', x, y0, h, w: w0 }, 10), b = headPts({ kind: 'goth', x, y0, h, w: w1 }, 10), yS = y0 + h;
  for (let i = 0; i < a.length - 1; i++) P.quad(mat, [a[i][0], a[i][1], z1], [b[i][0], b[i][1], z1], [b[i + 1][0], b[i + 1][1], z1], [a[i + 1][0], a[i + 1][1], z1], [0, 0, 1]);
  for (const s of [-1, 1]) P.box(mat, s < 0 ? x - w1 / 2 : x + w0 / 2, s < 0 ? x - w0 / 2 : x + w1 / 2, y0, yS, 0, z1, 'k', 1);
}
/** a crocketed gable: a white triangle base..apex with small crockets along both slopes */
function crocketGable(P, M, x, yBase, hw, apexY, z) {
  P.fan(M.stuccoC, [[x - hw, yBase, z], [x + hw, yBase, z], [x, apexY, z]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);                  // the tympanum: plain cream wall
  const dx = hw, dy = apexY - yBase, l = Math.hypot(dx, dy), nx = dy / l, ny = dx / l, t = 0.28;                                        // white bands along the two slopes
  for (const s of [-1, 1]) {
    const A = [x + s * hw, yBase], B = [x, apexY], A2 = [A[0] - s * nx * t * -1 * -1, A[1]], B2 = [B[0], B[1] - t];
    P.quad(M.michaelTrim, [A[0], A[1], z + 0.1], [B[0], B[1], z + 0.1], [B2[0], B2[1], z + 0.1], [A[0] - s * t * 1.4, A[1], z + 0.1], [0, 0, 1]);
    void A2; void ny;
  }
  for (const s of [-1, 1]) for (let i = 1; i <= 7; i++) { const tt = i / 8, px = x + s * hw * (1 - tt), py = yBase + (apexY - yBase) * tt; P.box(M.michaelTrim, px - 0.09, px + 0.09, py, py + 0.28, z, z + 0.14, 'k', 1); }
  P.box(M.michaelTrim, x - 0.1, x + 0.1, apexY, apexY + 0.45, z, z + 0.16, 'k', 1);
}

// ------------------------------------------------------------------------------------------------ the facade (wall frame x' = 15.6 - u, z out = -v)
function facade(K) {
  const { ctx, P, M } = K, xP = 8.35, glass = M.glassDark;
  P.push(FACADE_X, 0, 0, Math.PI);
  try {
    // central mass x' 3.4 .. 13.2: the portal (goth 2.5 wide, springing at 4.25) and the rose window (d 4.1, centre 12.6)
    wallHoles(P, { mat: M.stuccoC, x0: 3.4, x1: 13.2, y0: 0, y1: Y_PARAPET, uvs: 4, reveal: M.michaelTrim, depth: 0.9,
      ops: [{ x: xP, y0: 0.6, w: 2.5, h: 3.65, kind: 'goth', glass: M.oakDoor, depth: 0.9, sill: false }, { x: xP, y0: 10.55, w: 4.1, h: 4.1, kind: 'round', glass: M.roseGlass, depth: 0.5 }] });
    // the two aisle fronts (x' 0 .. 3.4 east, 13.2 .. 16.58 west): a tall lancet over a square window in a pointed blind arch
    for (const [x0, x1, xc] of [[0, 3.4, 1.3], [13.2, 16.58, 14.9]]) {
      wallHoles(P, { mat: M.stuccoC, x0, x1, y0: 0, y1: Y_EAVE, uvs: 4, reveal: M.stuccoC, depth: 0.35,
        ops: [{ x: xc, y0: 2.8, w: 0.9, h: 1.3, kind: 'rect', glass, depth: 0.3 }, { x: xc, y0: 5.3, w: 1.1, h: 2.0, kind: 'goth', glass, depth: 0.35 }] });
      P.box(M.stone, x0, x1, 0, 0.4, 0, 0.1, 'bk', 1.6);
    }
    P.box(M.stone, 3.4, 13.2, 0, 0.4, 0, 0.1, 'bk', 1.6);
    // the white lower zone of the facade (photo m04: painted white to about 1.9 m on both aisles, between the buttresses and round the portal), plates 5 cm proud of the wall
    const wz = (x0, x1, y1 = 1.9) => { if (x1 - x0 > 0.2) P.quad(M.michaelWhite, [x0, 0.4, 0.05], [x1, 0.4, 0.05], [x1, y1, 0.05], [x0, y1, 0.05], [0, 0, 1], [[x0 / 4, 0.1], [x1 / 4, 0.1], [x1 / 4, y1 / 4], [x0 / 4, y1 / 4]]); };
    wz(0, 3.4); wz(13.2, 16.58); wz(3.4, xP - 1.95); wz(xP + 1.95, 13.2);
    // the white zone's cornice line, the parapet and the blind arcade frieze at 15.0 .. 15.7
    P.box(M.michaelTrim, 3.4, 13.2, 14.9, 15.48, 0, 0.3, 'k', 1);
    for (let i = 0; i < 12; i++) { const x = 3.4 + (i + 0.5) * 9.8 / 12; P.box(M.louver, x - 0.18, x + 0.18, 15.05, 15.44, 0.3, 0.37, 'k', 1); }
    P.box(M.michaelTrim, -0.3, 3.4, Y_EAVE - 0.25, Y_EAVE + 0.25, 0, 0.3, 'k', 1); P.box(M.michaelTrim, 13.2, 16.9, Y_EAVE - 0.25, Y_EAVE + 0.25, 0, 0.3, 'k', 1);
    // portal: three orders, the crocketed gable (apex 11.3), the granite steps, the lanterns
    gothRing(P, M.michaelTrim, xP, 0.6, 3.65, 2.5, 3.0, 0.12); gothRing(P, M.michaelTrim, xP, 0.6, 3.65, 3.05, 3.5, 0.2); gothRing(P, M.michaelTrim, xP, 0.6, 3.65, 3.55, 3.9, 0.28);
    crocketGable(P, M, xP, 5.6, 2.1, 11.3, 0.3);
    for (const sx of [3.4, 13.2]) { P.box(M.michaelTrim, sx - 0.5, sx + 0.5, 0.4, 8.5, 0, 0.6, 'k', 1); P.cyl(M.michaelTrim, [sx, 8.5, 0.3], [sx, 9.6, 0.3], 0.5, 0.05, 4, true); }
    for (let s = 0; s < 4; s++) P.box(M.stone, xP - 3.0, xP + 3.0, 0, 0.15 * (4 - s), 0.21 * s, 0.21 * (s + 1), 'b', 1.6);
    P.quad(M.stone, [xP - 1.25, 0.6, 0.0], [xP + 1.25, 0.6, 0.0], [xP + 1.25, 0.6, -0.9], [xP - 1.25, 0.6, -0.9], [0, 1, 0]);                       // the floor of the portal recess
    P.fan(M.stuccoC, [[0, Y_EAVE, 0], [3.4, Y_EAVE, 0], [3.4, 12.8, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]); P.fan(M.stuccoC, [[13.2, Y_EAVE, 0], [16.58, Y_EAVE, 0], [13.2, 12.8, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);   // the wall triangles under the lean-to slopes
    for (const dx of [-2.1, 2.1]) { P.box(M.iron, xP + dx - 0.02, xP + dx + 0.02, 3.2, 3.4, 0.1, 0.4, 'b', 1); P.box(M.iron, xP + dx - 0.12, xP + dx + 0.12, 3.4, 3.9, 0.3, 0.5, 'b', 1); }
    // the rose window's white tracery: 8 spokes and two rings (just in front of the pane)
    const yr = 12.6;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI; P.cyl(M.michaelTrim, [xP - Math.cos(a) * 2.0, yr - Math.sin(a) * 2.0, -0.45], [xP + Math.cos(a) * 2.0, yr + Math.sin(a) * 2.0, -0.45], 0.05, 0.05, 5, false); }
    for (const [r0, r1] of [[0.5, 0.7], [1.9, 2.15]]) for (let i = 0; i < 20; i++) { const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2; P.quad(M.michaelTrim, [xP + Math.cos(a0) * r0, yr + Math.sin(a0) * r0, -0.42], [xP + Math.cos(a0) * r1, yr + Math.sin(a0) * r1, -0.42], [xP + Math.cos(a1) * r1, yr + Math.sin(a1) * r1, -0.42], [xP + Math.cos(a1) * r0, yr + Math.sin(a1) * r0, -0.42], [0, 0, 1]); }
    // the notice board of the church (arched board in a Gothic frame), reserved through the labels registry
    // (review 2026-10-09: the board stood half behind the east buttress at x' 2.9 .. 3.9; photo m04 shows it clear of the buttress on the aisle front: x' 1.6 .. 2.5)
    const wp = FM.W(FACADE_X - 2.05, -0.03), ny = [-FM.V[0], -FM.V[1]], lb = ctx.services && ctx.services.labels;
    if (!lb || lb.reserve('r18085303', wp.x, 1.9, wp.z, 0.9, 1.4, ny[0], ny[1], 'plate')) P.quad(M.michaelBoard, [1.6, 1.2, 0.09], [2.5, 1.2, 0.09], [2.5, 2.6, 0.09], [1.6, 2.6, 0.09], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the nave: painted bays, buttress strips, the corbel table, the SSE gable end
function nave(K, ring) {
  const { P, M } = K;
  // the corner returns of the facade (the facade plane v = 0 ends at u = 15.6 and u = -0.98, the side walls start at v ~ 0.65)
  P.quad(M.stuccoC, [15.6, 0, 0], [15.6, 0, 0.65], [15.6, Y_EAVE, 0.65], [15.6, Y_EAVE, 0], [1, 0, 0], [[0, 0], [0.2, 0], [0.2, 2.7], [0, 2.7]]);
  P.quad(M.stuccoC, [-0.98, 0, 0.7], [-0.98, 0, 0], [-0.98, Y_EAVE, 0], [-0.98, Y_EAVE, 0.7], [-1, 0, 0], [[0, 0], [0.2, 0], [0.2, 2.7], [0, 2.7]]);
  for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.5)) {
    const mu = (e.a[0] + e.b[0]) / 2, mv = (e.a[1] + e.b[1]) / 2, n = e.n;
    if (n[1] < -0.9 || Math.min(e.a[1], e.b[1]) < -0.4) continue;                           // the facade line and the porch bump: drawn above (the chamfered corners stay)
    onEdge(P, e, (len) => {
      if (n[1] > 0.7) {                                                                     // the SSE gable end
        wallHoles(P, { mat: M.stuccoC, x0: 0, x1: len, y0: 0, y1: Y_EAVE, uvs: 4, reveal: M.stuccoC, depth: 0.3, ops: [0.25, 0.5, 0.75].map((k) => ({ x: len * k, y0: 4.0, w: 1.1, h: 2.4, kind: 'goth', glass: M.glassDark })) });
        P.fan(M.stuccoC, [[0, Y_EAVE, 0], [len, Y_EAVE, 0], [len / 2, Y_RIDGE, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
        cornice(P, M.michaelTrim, M.stuccoC, 0, len, 0, Y_EAVE - 1.2, { e0: 0.05, e1: 0.05, proj: 0.4, modillions: false });
        return;
      }
      const nb = Math.max(1, Math.round(len / 5.5));
      for (let i = 0; i < nb; i++) { const x0 = len * i / nb, x1 = len * (i + 1) / nb; P.quad(M.nave, [x0, 0, 0], [x1, 0, 0], [x1, Y_EAVE, 0], [x0, Y_EAVE, 0], [0, 0, 1], [[i, 0], [i + 1, 0], [i + 1, Y_EAVE / 11], [i, Y_EAVE / 11]]); }
      for (let i = 0; i <= nb; i++) { const x = len * i / nb; P.box(M.michaelTrim, x - 0.3, x + 0.3, 0, Y_EAVE - 0.1, 0, 0.4, 'k', 1); }
      P.box(M.stone, 0, len, 0, 0.4, 0, 0.1, 'bk', 1.6);
      P.box(M.michaelTrim, 0, len, Y_EAVE - 0.1, Y_EAVE + 0.2, 0, 0.45, 'k', 1);
    });
  }
}

// ------------------------------------------------------------------------------------------------ roofs: the nave gable (dark grey), the aisle lean-tos, the flat roof of the central mass
function roofs(K) {
  const { P, M } = K, u0 = -0.9, u1 = 15.6, uc = (u0 + u1) / 2, k = (Y_RIDGE - Y_EAVE) / ((u1 - u0) / 2), ov = 0.3;
  // nave gable over v 6.0 .. 34.2 (ridge along v)
  P.quad(M.navRoof, [u0 - ov, Y_EAVE - k * ov, 6.0], [u0 - ov, Y_EAVE - k * ov, 34.35], [uc, Y_RIDGE, 34.35], [uc, Y_RIDGE, 6.0], [-k, 1, 0], [[0, 0], [28 / 2.4, 0], [28 / 2.4, 4], [0, 4]]);
  P.quad(M.navRoof, [u1 + ov, Y_EAVE - k * ov, 34.35], [u1 + ov, Y_EAVE - k * ov, 6.0], [uc, Y_RIDGE, 6.0], [uc, Y_RIDGE, 34.35], [k, 1, 0], [[0, 0], [28 / 2.4, 0], [28 / 2.4, 4], [0, 4]]);
  // the aisle lean-tos in front (v 0 .. 6): from the outer wall (10.8) up to the central mass wall (12.8)
  P.quad(M.aisleRoof, [-1.1, Y_EAVE, -0.15], [2.4, 12.8, -0.15], [2.4, 12.8, 6.0], [-1.1, Y_EAVE, 6.0], [-0.5, 1, 0], [[0, 0], [1.5, 0], [1.5, 2.5], [0, 2.5]]);
  P.quad(M.aisleRoof, [12.2, 12.8, -0.15], [15.75, Y_EAVE, -0.15], [15.75, Y_EAVE, 6.0], [12.2, 12.8, 6.0], [0.5, 1, 0], [[0, 0], [1.5, 0], [1.5, 2.5], [0, 2.5]]);
  P.cap(M.navRoof, [[2.4, -0.1], [12.2, -0.1], [12.2, 6.0], [2.4, 6.0]], Y_PARAPET, true, 2.4);
  // the central mass: the walls above the lean-tos (u = 2.4 and 12.2, from 10.8 to 15.5) and the rear wall above the gable
  P.quad(M.stuccoC, [2.4, Y_EAVE, 0], [2.4, Y_EAVE, 6.0], [2.4, Y_PARAPET, 6.0], [2.4, Y_PARAPET, 0], [-1, 0, 0], [[0, 0], [1.5, 0], [1.5, 1.2], [0, 1.2]]);
  P.quad(M.stuccoC, [12.2, Y_EAVE, 6.0], [12.2, Y_EAVE, 0], [12.2, Y_PARAPET, 0], [12.2, Y_PARAPET, 6.0], [1, 0, 0], [[0, 0], [1.5, 0], [1.5, 1.2], [0, 1.2]]);
  P.quad(M.stuccoC, [2.4, Y_RIDGE - 4, 6.0], [12.2, Y_RIDGE - 4, 6.0], [12.2, Y_PARAPET, 6.0], [2.4, Y_PARAPET, 6.0], [0, 0, 1], [[0, 0], [2.4, 0], [2.4, 1], [0, 1]]);
  void gable;
}

// ------------------------------------------------------------------------------------------------ the tower: belfry I (square), belfry II (octagon), the spire, the cross
function tower(K) {
  const { P, M } = K, T = TOWER, h = T.h;
  P.push(T.cx, 0, T.cz, 0);
  try {
    // belfry I: 15.5 .. 22.9, four faces with pointed blind arches, a cornice, four slim pinnacle turrets
    for (const ph of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      P.push(0, 0, 0, ph);
      try {
        P.push(0, 0, h, 0);
        try {
          wallHoles(P, { mat: M.stuccoC, x0: -h, x1: h, y0: 15.5, y1: 22.9, uvs: 4, reveal: M.stuccoC, depth: 0.2, ops: [{ x: 0, y0: 17.4, w: 2.0, h: 2.6, kind: 'goth', glass: M.glassDark, depth: 0.3 }] });
          P.box(M.michaelTrim, -h - 0.25, h + 0.25, 22.5, 22.9, 0, 0.3, 'k', 1);
          // the white pointed ring round the blind arch
          const a = headPts({ kind: 'goth', x: 0, y0: 17.4, h: 2.6, w: 2.0 }, 8), b = headPts({ kind: 'goth', x: 0, y0: 17.4, h: 2.6, w: 2.4 }, 8);
          for (let i = 0; i < a.length - 1; i++) P.quad(M.michaelTrim, [a[i][0], a[i][1], 0.06], [b[i][0], b[i][1], 0.06], [b[i + 1][0], b[i + 1][1], 0.06], [a[i + 1][0], a[i + 1][1], 0.06], [0, 0, 1]);
        } finally { P.pop(); }
      } finally { P.pop(); }
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (h - 0.15), z = sz * (h - 0.15);
      P.box(M.michaelTrim, x - 0.25, x + 0.25, 22.9, 25.2, z - 0.25, z + 0.25, 'b', 1);
      P.cyl(M.michaelTrim, [x, 25.2, z], [x, 26.4, z], 0.34, 0.03, 4, true);
      for (let i = 1; i <= 3; i++) P.box(M.michaelTrim, x - 0.3, x + 0.3, 22.9 + i * 0.6, 22.9 + i * 0.6 + 0.12, z - 0.3, z + 0.3, 'b', 1);
    }
    P.cap(M.navRoof, [[-h, -h], [h, -h], [h, h], [-h, h]], 22.9, true, 2);
    // belfry II: an octagon 5.9 m across the flats (apothem 2.95): a louvred pointed lancet on the cardinal faces, four crocketed gablets, a parapet at 32.9
    const ap = 2.95, hw = ap * Math.tan(Math.PI / 8);
    for (let k = 0; k < 8; k++) {
      P.push(0, 0, 0, k * Math.PI / 4);
      try {
        P.push(0, 0, ap, 0);
        try {
          const cardinal = k % 2 === 0;
          wallHoles(P, { mat: M.stuccoC, x0: -hw, x1: hw, y0: 22.9, y1: 32.9, uvs: 4, reveal: M.stuccoC, depth: 0.35, ops: cardinal ? [{ x: 0, y0: 27.5, w: 1.1, h: 3.3, kind: 'goth', glass: M.louver, depth: 0.35 }] : [] });
          P.box(M.michaelTrim, -hw - 0.05, hw + 0.05, 32.7, 33.0, 0, 0.18, 'k', 1);
          if (cardinal) { crocketGable(P, M, 0, 30.6, 1.0, 32.6, 0.2); }
        } finally { P.pop(); }
      } finally { P.pop(); }
    }
    P.push(0, 0, 0, Math.PI / 8);
    try {
      lathe(P, M.spire, [[1.89, 32.9], [0.06, 43.6]], 8, 0, 0, 1, 4);                         // the octagonal pyramid (circumradius 1.89 = 3.5 m across the flats)
      lathe(P, M.spire, [[3.19, 32.9], [1.89, 32.9]], 8, 0, 0, 1, 4);
    } finally { P.pop(); }
    P.box(M.gold, -0.06, 0.06, 43.55, 46.0, -0.06, 0.06, '', 1); P.box(M.gold, -0.4, 0.4, 44.9, 45.04, -0.06, 0.06, '', 1); P.box(M.gold, -0.06, 0.06, 44.9, 45.04, -0.4, 0.4, '', 1);
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders_(K, ring) {
  const { ctx } = K, ph = ctx.physics, CL = colliders(FM, ph);
  for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.3)) { if (Math.min(e.a[1], e.b[1]) < -0.4) continue; CL.wall(e.a, e.b, 0, 16, 0.5); }
  // the facade line with the portal recess (u 5.95 .. 8.55, 0.9 m deep, floor +0.6): closed doors at the back, the four steps and the recess floor are walkable
  CL.wall([3.94, 0], [5.95, 0], 0, 16, 0.3); CL.wall([8.55, 0], [10.44, 0], 0, 16, 0.3); CL.wall([5.95, 0], [5.95, 0.9], 0, 16, 0.2); CL.wall([8.55, 0], [8.55, 0.9], 0, 16, 0.2); CL.wall([5.95, 0.95], [8.55, 0.95], 0, 16, 0.2);
  CL.walk(7.25, 0.45, 2.6, 0.9, 0.6, -0.3);
  const c = FM.W(7.25, -0.42);
  ph.addStairs(c.x, c.z, 6.0, 0.84, FM.rot, 0, 0.6, 4);
}
