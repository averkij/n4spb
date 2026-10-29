// landmarksMakarova/row.js - the YAKOVLEV HOUSES (Makarova nab. 16/2 and 14, A. Melnikov 1823-26: OSM w107454280 and w107454310) and the STENBOCK-FERMOR HOUSE (no. 12, V. Zeidler 1900-01: w107454297 + parts),
// one 129 m front on the Malaya Neva (docs/research/makarova.md section 3; photos r01 r02 r03 r04 r05 r07 h39 h40 h41).  Frame R (frame.js): origin = the west corner of the no. 16/2 front, u along the front toward the
// Spit (ESE), v inland; the river is at -v.  Fronts are drawn in WALL FRAMES (x to the right as seen from the river = UE - u, y up, z out = -v).
//   YAKOVLEV FRONT (u 0 .. 67.2, three storeys, ochre #bb8650): granite plinth 0.6 / rusticated ground floor 4.0 / dentil impost band 4.0-4.35 / LOW second floor 4.35-6.3 with HALF-DISC LUNETTES (glass 2.3 x 1.15, white
//     archivolt ring 3.0 m wide) over the west and east pavilions' axes 1, 3, 5 and over every second axis of the 15-axis arcade (u = 20.1 + 5.5 k) / string course 6.3-6.65 / third floor with white frames, palmette lintel
//     friezes and sills (sill 7.3) / cornice 12.5 (pavilions, 5 axes of 2.6 m) and 11.8 (arcade, pitch 2.75) / the stepped attic over u 16..40.  Two closed gateways drawn as 1.5 m deep niches with steel gates: the MID-ARCADE
//     gateway at u 25.6 with the 8 m iron balcony over it, and the EAST gate at u 55.9 (no balcony); five shop awnings; drain pipes at u 16.6 / 34.4 / 52.6; chimneys.
//   NO. 12 (u 67.2 .. 126.2 + the rounded Volkhovsky corner, THREE tall floors, terracotta #8f4a3a with cream ornament): rusticated ground floor, round-headed first floor, ornamented second floor, garland frieze, cornice 16.5;
//     the grand portal at u 79.3 and the second doorway at u 114.1, the 9.6 m iron balcony at u 90.6-100.2, three arched-gable bays with pale warm-grey DOMES (base 6.4 / 4.9 / 4.5 m, crowns 22.7 / 21.9 / 20.7, spires).
// The other edges of the three outlines (bevel, courtyard wing, rear) get plain walls with window rows; flat grey roofs at the cornice.  Colliders: the three outlines.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FR, FALL, ringIn, polyIn, colliders } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { wallHoles, cornice, lathe } from './facade.js';
import { addPolyColliders } from '../lib/massing.js';

const UE = 67.2, UE12 = 126.24, V12 = -0.17;
const AX = { pav: 2.6, arc: 2.75, epav: 2.58, n12: 2.68 };
const ARC_I = Array.from({ length: 15 }, (_, i) => i);
const uArc = (i) => 14.6 + 2.75 * i;
const SHOPS = [2, 6, 8, 10, 12], LUN_ARC = [2, 6, 8, 10, 12], GATE_MID = 4;
const U_WP = [1.3, 3.9, 6.5, 9.1, 11.7], U_EP = [55.59, 58.17, 60.75, 63.33, 65.91];
const K12 = Array.from({ length: 22 }, (_, k) => k), u12 = (k) => 68.54 + 2.68 * k;
const DOMES = [{ k: 4, d: 4.5, crown: 20.7, spire: 23.5 }, { k: 17, d: 4.9, crown: 21.9, spire: 24.8 }, { k: 21, d: 6.4, crown: 22.7, spire: 26.8 }];
const Y_CORN_P = 12.5, Y_CORN_A = 11.8, Y_CORN_12 = 16.5;

export function build(K) {
  const { ctx, P } = K, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] row/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const r16 = ringIn(FR, 'w107454280', FALL.r16), r14 = ringIn(FR, 'w107454310', FALL.r14), r12 = ringIn(FR, 'w107454297', FALL.r12);
  P.push(FR.x, 0, FR.z, FR.rot);
  try {
    stage('yakovlev', () => yakovlevFront(K));
    stage('no12', () => no12Front(K));
    stage('sides', () => sideWalls(K, [[r16, 'o', 11.8], [r14, 'o', 12.5], [r12, 'r', 16.5]]));
    stage('roofs', () => roofs(K, r16, r14, r12));
    stage('domes', () => domes(K));
    stage('corner', () => cornerBalcony(K));
  } finally { P.pop(); }
  stage('colliders', () => { for (const [r, y] of [[r16, 13], [r14, 13], [r12, 17]]) addPolyColliders(ctx, polyIn(FR, r), 0, y, 0.5); });
  const c = FR.W(35, 0), c12 = FR.W(97, 0);
  K.svc.monuments.push({ id: 'w107454280', name: 'Дома Яковлевых (наб. Макарова 14, 16/2)', x: c.x, z: c.z, h: 14.3 }, { id: 'w107454297', name: 'Дом Стенбок-Фермора (наб. Макарова 12)', x: c12.x, z: c12.z, h: 26.8 });
  K.svc.photoSpots.push({ x: -3380, z: -1535, yaw: L.yawToward ? L.yawToward(-3380, -1535, c.x, c.z) : 160, name: 'Дома Яковлевых' });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ small helpers (wall frame: x right, y up, z out)
/** a band with a textured FRONT (tx x ty metres per tile) and plain sides / top */
function band(P, front, plain, x0, x1, y0, y1, z0, z1, tx, ty) {
  P.box(plain, x0, x1, y0, y1, z0, z1, 'fk', 1);
  P.quad(front, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[x0 / tx, y0 / ty], [x1 / tx, y0 / ty], [x1 / tx, y1 / ty], [x0 / tx, y1 / ty]]);
}
/** a half-annulus ring of radii r0..r1 round (x, y0), front at z1, standing 0..z1 proud: the white archivolt of a lunette / an arched window */
function archivolt(P, mat, x, y0, r0, r1, z1, n = 10) {
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    P.quad(mat, [x + c0 * r0, y0 + s0 * r0, z1], [x + c0 * r1, y0 + s0 * r1, z1], [x + c1 * r1, y0 + s1 * r1, z1], [x + c1 * r0, y0 + s1 * r0, z1], [0, 0, 1]);
    P.quad(mat, [x + c0 * r1, y0 + s0 * r1, 0], [x + c1 * r1, y0 + s1 * r1, 0], [x + c1 * r1, y0 + s1 * r1, z1], [x + c0 * r1, y0 + s0 * r1, z1], [(c0 + c1) / 2, (s0 + s1) / 2, 0]);
  }
}
/** a window dressing for a rectangular opening (x centre, sill y0, w x h): white stiles, a sill, the lintel frieze (palmette) and the dark sash cross */
function dressing(P, M, x, y0, w, h, o = {}) {
  const t = o.t ?? 0.12, z = o.z ?? 0.07;
  P.box(M.trim, x - w / 2 - t, x - w / 2, y0, y0 + h, 0, z, 'k', 1); P.box(M.trim, x + w / 2, x + w / 2 + t, y0, y0 + h, 0, z, 'k', 1);
  P.box(M.trim, x - w / 2 - t - 0.05, x + w / 2 + t + 0.05, y0 - 0.1, y0, 0, z + 0.07, 'k', 1);
  if (o.frieze !== false) band(P, M.palmette, M.trim, x - w / 2 - t - 0.05, x + w / 2 + t + 0.05, y0 + h, y0 + h + 0.45, 0, 0.12, 0.9, 0.45);
  if (o.sash !== false) { P.box(M.wood, x - 0.025, x + 0.025, y0, y0 + h, -0.14, -0.1, 'b', 1); P.box(M.wood, x - w / 2, x + w / 2, y0 + h * 0.68, y0 + h * 0.68 + 0.05, -0.14, -0.1, 'b', 1); }
}
/** one zone of a front: a wall field per segment { x0, x1, y1?, ops } */
function zone(P, mat, segs, y0, y1, uvs, reveal) {
  for (const s of segs) wallHoles(P, { mat, x0: s.x0, x1: s.x1, y0, y1: s.y1 ?? y1, uvs, ops: s.ops, reveal: reveal || mat, depth: 0.25 });
}

// ------------------------------------------------------------------------------------------------ the Yakovlev front (no. 16/2 + no. 14)
function yakovlevFront(K) {
  const { P, M } = K, X = (u) => UE - u, G = M.glassDark;
  P.push(UE, 0, 0, Math.PI);
  try {
    // ---------- openings
    const seg = { w: { x0: X(13.0), x1: X(0) }, a: { x0: X(54.3), x1: X(13.0) }, e: { x0: X(67.2), x1: X(54.3) } };
    const win = (u, y0, w, h, kind = 'rect', glass = G, depth) => ({ x: X(u), y0, w, h, kind, glass, depth });
    const g1 = { w: [], a: [], e: [] }, g2 = { w: [], a: [], e: [] }, g3 = { w: [], a: [], e: [] };
    // west pavilion: four grilled windows and the red door with a round head at axis 3
    for (const u of U_WP) { if (u === 6.5) g1.w.push(win(u, 0.05, 1.4, 2.3, 'arch', M.doorRed)); else g1.w.push(win(u, 1.2, 1.25, 2.0)); }
    g2.w = [1.3, 6.5, 11.7].map((u) => win(u, 4.6, 2.3, 1.15, 'half'));
    for (const u of U_WP) g3.w.push(win(u, 7.3, 1.15, 2.2));
    // arcade: shops under the lunette axes, windows between, the mid gateway
    for (const i of ARC_I) {
      const u = uArc(i);
      if (i === GATE_MID) g1.a.push(win(u, 0.05, 3.0, 2.4, 'arch', M.gateDark, 1.5));
      else if (SHOPS.includes(i)) g1.a.push(win(u, 0.05, 1.7, 2.9, 'rect', G, 0.3));
      else g1.a.push(win(u, 1.3, 0.95, 1.7));
      if (LUN_ARC.includes(i)) g2.a.push(win(u, 4.6, 2.3, 1.15, 'half'));
      g3.a.push(win(u, 7.3, 1.0, 1.9));
    }
    g2.a.push(win(25.1, 4.85, 0.5, 0.95), win(26.1, 4.85, 0.5, 0.95));                    // the two small windows of the gateway tympanum
    // east pavilion: the gate at its west end, four grilled windows, three lunettes
    g1.e.push(win(55.85, 0.05, 3.0, 2.4, 'arch', M.gateDark, 1.5));
    for (const u of U_EP.slice(1)) g1.e.push(win(u, 1.2, 1.25, 2.0));
    g2.e = [55.59, 60.75, 65.91].map((u) => win(u, 4.6, 2.3, 1.15, 'half'));
    for (const u of U_EP) g3.e.push(win(u, 7.3, 1.15, 2.2));
    const segs = (g, top) => [{ ...seg.w, ops: g.w, y1: top.w }, { ...seg.a, ops: g.a, y1: top.a }, { ...seg.e, ops: g.e, y1: top.e }];
    zone(P, M.rustO, segs(g1, { w: 4.35, a: 4.35, e: 4.35 }), 0, 4.35, 1.1, M.stuccoO);
    zone(P, M.stuccoO, segs(g2, { w: 6.65, a: 6.65, e: 6.65 }), 4.35, 6.65, 4, M.stuccoO);
    zone(P, M.stuccoO, segs(g3, { w: Y_CORN_P, a: Y_CORN_A, e: Y_CORN_P }), 6.65, Y_CORN_P, 4, M.stuccoO);
    // the narrow strips between the zones are bands
    // ---------- plinth (not in front of shop doors and gates), impost band, string course, cornices
    const gaps = [...SHOPS.map((i) => [uArc(i) - 0.85, uArc(i) + 0.85]), [24.1, 27.1], [54.35, 57.35], [5.8, 7.2]].sort((a, b) => a[0] - b[0]);
    let uc = 0; for (const [a, b] of gaps) { if (a > uc) P.box(M.stone, X(a), X(uc), 0, 0.6, 0, 0.08, 'bk', 1.6); uc = b; } if (uc < UE) P.box(M.stone, X(UE), X(uc), 0, 0.6, 0, 0.08, 'bk', 1.6);
    band(P, M.dentil, M.trim, X(UE), X(0), 4.0, 4.35, 0, 0.12, 0.5, 0.35);
    P.box(M.trim, X(UE), X(0), 6.3, 6.65, 0, 0.1, 'k', 1);
    cornice(P, M.trim, M.stuccoO, X(13.0), X(0), 0, 11.3, { e0: 0.0, e1: 0.15, proj: 0.8 });
    cornice(P, M.trim, M.stuccoO, X(54.3), X(13.0), 0, 10.6, { e0: 0, e1: 0, proj: 0.8 });
    cornice(P, M.trim, M.stuccoO, X(67.2), X(54.3), 0, 11.3, { e0: 0.15, e1: 0, proj: 0.8 });
    // ---------- lunette rings, window dressings, balconies, awnings, gates
    for (const g of [g2.w, g2.a, g2.e]) for (const o of g) if (o.kind === 'half') { archivolt(P, M.trim, o.x, o.y0, 1.15, 1.5, 0.1); lunetteBars(P, M, o.x, o.y0, 1.15); }
    for (const o of [...g3.w, ...g3.a, ...g3.e]) dressing(P, M, o.x, o.y0, o.w, o.h);
    for (const o of [...g1.w, ...g1.e, ...g1.a]) if (o.kind === 'rect' && o.depth === undefined && o.y0 > 1) { P.quad(M.bars, [o.x - o.w / 2, o.y0, -0.1], [o.x + o.w / 2, o.y0, -0.1], [o.x + o.w / 2, o.y0 + o.h, -0.1], [o.x - o.w / 2, o.y0 + o.h, -0.1], [0, 0, 1], [[0, 0], [o.w / 1.2, 0], [o.w / 1.2, o.h], [0, o.h]]); P.box(M.trim, o.x - o.w / 2 - 0.1, o.x + o.w / 2 + 0.1, o.y0 - 0.08, o.y0, 0, 0.12, 'k', 1); }
    for (const g of [g1.w, g1.e, g1.a]) for (const o of g) if (o.kind === 'arch') { archivolt(P, M.trim, o.x, o.y0 + o.h, o.w / 2, o.w / 2 + 0.3, 0.1); if (o.depth === 1.5) P.quad(M.bars, [o.x - o.w / 2, o.y0, -1.45], [o.x + o.w / 2, o.y0, -1.45], [o.x + o.w / 2, o.y0 + o.h + o.w / 2, -1.45], [o.x - o.w / 2, o.y0 + o.h + o.w / 2, -1.45], [0, 0, 1], [[0, 0], [o.w / 1.2, 0], [o.w / 1.2, 2.5], [0, 2.5]]); }
    for (const i of SHOPS) awning(P, M, X(uArc(i)));
    ironBalcony(P, M, X(29.5), X(21.5), 6.4, 0.8);                                         // the 8 m balcony over the mid-arcade gateway
    ironBalcony(P, M, X(1.3) - 1.15, X(1.3) + 1.15, 6.4, 0.7);                              // the west pavilion's end window (r05 / r02)
    for (const u of [0.3, 16.6, 34.4, 52.6, 66.9]) P.cyl(M.pipe, [X(u), 11.0, 0.2], [X(u), 0.3, 0.2], 0.07, 0.07, 6, false);
    // ---------- the stepped attic over u 16..40 (set back 4 m behind the cornice) with its own cornice
    const ax0 = X(40), ax1 = X(16);
    P.box(M.stuccoO, ax0, ax1, 11.85, 13.1, -12, -4, 'b', 4);
    cornice(P, M.trim, M.stuccoO, ax0, ax1, -4, 13.1, { e0: 0.2, e1: 0.2, proj: 0.6, modillions: false });
    // chimneys behind the cornice
    for (const u of [5, 22, 38, 50, 60]) { const x = X(u); P.box(M.chimney, x - 0.4, x + 0.4, 11.85, 13.4, -9.4, -8.6, 'b', 1); P.box(M.trim, x - 0.48, x + 0.48, 13.4, 13.5, -9.5, -8.5, 'b', 1); }
  } finally { P.pop(); }
}
/** the fan of white glazing bars of a half-disc lunette (centre x, base y0, radius r): five radial bars and one concentric ring just in front of the glass (photos r03 r05: the lunettes are white-barred, not black holes) */
function lunetteBars(P, M, x, y0, r, z = -0.21) {
  for (let k = 1; k <= 5; k++) { const a = Math.PI * k / 6, c = Math.cos(a), s = Math.sin(a); P.cyl(M.trim, [x + c * 0.08, y0 + s * 0.08, z], [x + c * (r - 0.03), y0 + s * (r - 0.03), z], 0.022, 0.022, 4, false); }
  const n = 8, rr = r * 0.58; for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n; P.cyl(M.trim, [x + Math.cos(a0) * rr, y0 + Math.sin(a0) * rr, z], [x + Math.cos(a1) * rr, y0 + Math.sin(a1) * rr, z], 0.02, 0.02, 4, false); }
}
/** a shop awning: a sloped canvas 0.9 m deep over a 1.9 m opening, with a valance */
function awning(P, M, x) {
  const w = 1.0, y0 = 3.3, y1 = 2.95, z = 0.9;
  P.quad(M.awning, [x - w, y0, 0.05], [x + w, y0, 0.05], [x + w, y1, z], [x - w, y1, z], [0, 1, 0.45], [[0, 0], [2, 0], [2, 1], [0, 1]]);
  P.quad(M.awning, [x - w, y1, z], [x + w, y1, z], [x + w, y1 - 0.18, z], [x - w, y1 - 0.18, z], [0, 0, 1]);
  for (const sx of [-1, 1]) P.fan(M.awning, [[x + sx * w, y0, 0.05], [x + sx * w, y1, z], [x + sx * w, y1 - 0.18, z], [x + sx * w, y0 - 0.0, 0.05]], [sx, 0, 0]);
}
/** an iron balcony between x0 and x1 (wall frame): a slab at y, a railing 1.0 m high with the scroll panel, brackets, returns */
function ironBalcony(P, M, x0, x1, y, depth) {
  if (x1 < x0) [x0, x1] = [x1, x0];
  P.box(M.stone, x0, x1, y - 0.15, y + 0.05, 0, depth, '', 1.6);
  const n = Math.max(2, Math.round((x1 - x0) / 2.2)); for (let i = 0; i <= n; i++) { const x = x0 + 0.2 + (x1 - x0 - 0.4) * i / n; P.box(M.iron, x - 0.015, x + 0.015, y - 0.42, y - 0.15, 0.05, depth - 0.25, 'b', 1); }
  P.quad(M.balcony, [x0, y + 0.05, depth - 0.03], [x1, y + 0.05, depth - 0.03], [x1, y + 1.05, depth - 0.03], [x0, y + 1.05, depth - 0.03], [0, 0, 1], [[0, 0], [(x1 - x0) / 1.6, 0], [(x1 - x0) / 1.6, 1], [0, 1]]);
  for (const x of [x0 + 0.02, x1 - 0.02]) P.quad(M.balcony, [x, y + 0.05, 0.02], [x, y + 0.05, depth - 0.03], [x, y + 1.05, depth - 0.03], [x, y + 1.05, 0.02], [x === x0 + 0.02 ? -1 : 1, 0, 0], [[0, 0], [depth / 1.6, 0], [depth / 1.6, 1], [0, 1]]);
  P.box(M.iron, x0, x1, y + 1.03, y + 1.08, depth - 0.06, depth, 'b', 1);
}

// ------------------------------------------------------------------------------------------------ no. 12, the Stenbock-Fermor house
function no12Front(K) {
  const { P, M } = K, X = (u) => UE12 - u, G = M.glassDark, x0 = X(UE12), x1 = X(67.18);
  P.push(UE12, 0, V12, Math.PI);
  try {
    const win = (u, y0, w, h, kind = 'rect', glass = G, depth) => ({ x: X(u), y0, w, h, kind, glass, depth });
    const o1 = [], o2 = [], o3 = [];
    for (const k of K12) {
      const u = u12(k);
      if (k === 4) o1.push(win(u, 0.3, 2.4, 2.2, 'arch', M.wood, 0.5)); else if (k === 17) o1.push(win(u, 0.3, 1.6, 2.4, 'arch', M.wood, 0.4)); else o1.push(win(u, 1.1, 1.3, 2.3));
      o2.push(win(u, 5.3, 1.4, 2.1, 'arch'));
      o3.push(win(u, 10.0, 1.3, 2.6));
    }
    zone(P, M.rustR, [{ x0, x1, ops: o1 }], 0, 4.55, 1.1, M.stuccoR);
    zone(P, M.stuccoR, [{ x0, x1, ops: o2 }], 4.55, 9.5, 4, M.stuccoR);
    zone(P, M.stuccoR, [{ x0, x1, ops: o3 }], 9.5, Y_CORN_12, 4, M.stuccoR);
    P.box(M.stone, x0, x1, 0, 1.0, 0, 0.1, 'bk', 1.6);
    P.box(M.creamTrim, x0, x1, 4.3, 4.55, 0, 0.12, 'k', 1); P.box(M.creamTrim, x0, x1, 9.2, 9.5, 0, 0.12, 'k', 1);
    band(P, M.garland, M.creamTrim, x0, x1, 14.7, 15.3, 0, 0.1, 1.2, 0.6);
    cornice(P, M.creamTrim, M.stuccoR, x0, x1, 0, 15.3, { e0: 0.1, e1: 0.1, proj: 0.9 });
    // dressings: ground windows (grilles), first-floor archivolts with a keystone console, second-floor crowns
    for (const k of K12) {
      const x = X(u12(k));
      if (k !== 4 && k !== 17) { P.box(M.creamTrim, x - 0.75, x + 0.75, 3.4, 3.55, 0, 0.1, 'k', 1); P.quad(M.bars, [x - 0.65, 1.1, -0.1], [x + 0.65, 1.1, -0.1], [x + 0.65, 3.4, -0.1], [x - 0.65, 3.4, -0.1], [0, 0, 1], [[0, 0], [1.1, 0], [1.1, 2.3], [0, 2.3]]); }
      archivolt(P, M.creamTrim, x, 7.4, 0.7, 0.98, 0.1, 8);
      P.box(M.creamTrim, x - 0.98, x - 0.7, 5.3, 7.4, 0, 0.08, 'k', 1); P.box(M.creamTrim, x + 0.7, x + 0.98, 5.3, 7.4, 0, 0.08, 'k', 1);
      P.box(M.creamTrim, x - 0.8, x + 0.8, 5.15, 5.3, 0, 0.14, 'k', 1);
      P.box(M.creamTrim, x - 0.12, x + 0.12, 8.1, 8.55, 0, 0.14, 'k', 1);
      P.box(M.creamTrim, x - 0.85, x - 0.65, 10.0, 12.6, 0, 0.08, 'k', 1); P.box(M.creamTrim, x + 0.65, x + 0.85, 10.0, 12.6, 0, 0.08, 'k', 1);
      P.box(M.creamTrim, x - 0.95, x + 0.95, 12.6, 12.85, 0, 0.14, 'k', 1); P.box(M.creamTrim, x - 0.5, x + 0.5, 12.85, 13.6, 0, 0.12, 'k', 1); P.box(M.creamTrim, x - 0.9, x + 0.9, 9.85, 10.0, 0, 0.14, 'k', 1);
    }
    // the grand portal (u 79.3): a stone arch with a console, three steps; the doorway at u 114.1; the iron balcony 9.6 m at u 90.6 .. 100.2 (first-floor sill level)
    for (const k of [4, 17]) { const x = X(u12(k)), w = k === 4 ? 2.4 : 1.6; archivolt(P, M.stone, x, 0.3 + (k === 4 ? 2.2 : 2.4), w / 2, w / 2 + 0.35, 0.18, 10); P.box(M.stone, x - w / 2 - 0.35, x - w / 2, 0.3, 0.3 + (k === 4 ? 2.2 : 2.4), 0, 0.14, 'bk', 1.6); P.box(M.stone, x + w / 2, x + w / 2 + 0.35, 0.3, 0.3 + (k === 4 ? 2.2 : 2.4), 0, 0.14, 'bk', 1.6); }
    for (let s = 0; s < 3; s++) { const x = X(u12(4)); P.box(M.stone, x - 1.4 - 0.2 * s, x + 1.4 + 0.2 * s, 0, 0.45 - 0.15 * s, 0.1 + 0.3 * s, 0.4 + 0.3 * s, 'b', 1.6); }
    ironBalcony(P, M, X(100.2), X(90.6), 5.1, 0.8);
    for (const u of [67.5, 126.0]) P.cyl(M.pipe, [X(u), 15.0, 0.18], [X(u), 0.3, 0.18], 0.07, 0.07, 6, false);
    // the arched-gable bays under the domes (a garland pediment 3.6 m wide above the cornice)
    for (const d of DOMES) { const x = X(u12(d.k)), r = 1.8; P.push(x, 16.5, 0.14, 0); try { gableBay(P, M, r); } finally { P.pop(); } }
  } finally { P.pop(); }
}
/** an arched gable (rect + semicircle of radius r) in front of the roof line, standing on the cornice at y = 0: a cream garland band and a round cartouche */
function gableBay(P, M, r) {
  const s = new THREE.Shape(); s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, 0.9); s.absarc(0, 0.9, r, 0, Math.PI, false); s.lineTo(-r, 0);
  const g = new THREE.ShapeGeometry(s, 10), ua = g.attributes.uv, pa = g.attributes.position; for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / 4, pa.getY(i) / 4);
  P.geo(M.stuccoR, g, 0, 0, 0); g.dispose();
  archivolt(P, M.creamTrim, 0, 0.9, r - 0.05, r + 0.2, 0.12, 10);
  P.box(M.creamTrim, -r - 0.2, -r + 0.15, 0, 0.9, 0, 0.12, 'k', 1); P.box(M.creamTrim, r - 0.15, r + 0.2, 0, 0.9, 0, 0.12, 'k', 1);
  P.box(M.creamTrim, -0.45, 0.45, 1.3, 2.2, 0, 0.12, 'k', 1);
}

// ------------------------------------------------------------------------------------------------ the pale warm-grey domes of no. 12 (diamond seams, one oculus each) on short drums, thin iron spires
function domes(K) {
  const { P, M } = K;
  for (const d of DOMES) {
    const u = u12(d.k), r = d.d / 2, rise = d.d * 0.5, yb = d.crown - rise, vc = r + 0.35;
    lathe(P, M.stuccoR, [[r, 16.5], [r, yb]], 20, u, vc, 4, 4);                                   // the drum, terracotta like the house
    lathe(P, M.creamTrim, [[r, yb - 0.15], [r + 0.12, yb - 0.15]], 20, u, vc, 4, 4); lathe(P, M.creamTrim, [[r + 0.12, yb - 0.15], [r + 0.12, yb]], 20, u, vc, 4, 4); lathe(P, M.creamTrim, [[r + 0.12, yb], [r, yb]], 20, u, vc, 4, 4);
    const prof = []; for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI / 2; prof.push([Math.max(0.001, (r + 0.12) * Math.cos(t)), yb + rise * Math.sin(t)]); }
    lathe(P, M.domeDiamond, prof, 20, u, vc, 8, 4, false, yb);
    P.cyl(M.iron, [u, d.crown, vc], [u, d.spire, vc], 0.05, 0.02, 5, false);
    const gb = new THREE.SphereGeometry(0.16, 8, 6); P.geo(M.gold, gb, u, d.crown + 0.5, vc); gb.dispose();
    // the oculus: a dark octagon on the river face, 40 degrees up from the horizontal rim
    const phi = 40 * Math.PI / 180, R = r + 0.14, n = [0, Math.cos(phi), -Math.sin(phi)], t1 = [1, 0, 0], t2 = [0, Math.sin(phi), Math.cos(phi)], cen = [u + n[0] * R, yb + n[1] * R * rise / (r + 0.12) + 0.02, vc + n[2] * R];
    const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pts.push([cen[0] + (Math.cos(a) * t1[0] + Math.sin(a) * t2[0]) * 0.45 + n[0] * 0.03, cen[1] + (Math.sin(a) * t2[1]) * 0.45 + n[1] * 0.03, cen[2] + (Math.sin(a) * t2[2]) * 0.45 + n[2] * 0.03]); }
    P.fan(M.oculus, pts, n);
  }
}

/** the semicircular balustraded balcony of the rounded Volkhovsky corner of no. 12 (first floor, slab at 5.1 m, radius 1.5 m, white balusters 0.9 m, a console under it); in the R frame (u, v), the chamfer faces (0.683, -0.731) */
function cornerBalcony(K) {
  const { P, M } = K, cx = 127.68, cz = 1.15, nx = 0.683, nz = -0.731, R = 1.5, a0 = Math.atan2(nz, nx), n = 10, y = 5.1;
  const pt = (k) => { const a = a0 - Math.PI / 2 + Math.PI * k / n; return [cx + Math.cos(a) * R, cz + Math.sin(a) * R]; };
  for (let k = 0; k < n; k++) {
    const A = pt(k), B = pt(k + 1);
    P.fan(M.stone, [[cx, y + 0.05, cz], [A[0], y + 0.05, A[1]], [B[0], y + 0.05, B[1]]], [0, 1, 0], (p) => [p[0] / 1.6, p[2] / 1.6]);
    P.fan(M.stone, [[cx, y - 0.15, cz], [B[0], y - 0.15, B[1]], [A[0], y - 0.15, A[1]]], [0, -1, 0], (p) => [p[0] / 1.6, p[2] / 1.6]);
    const mx = (A[0] + B[0]) / 2 - cx, mz = (A[1] + B[1]) / 2 - cz;
    P.quad(M.stone, [A[0], y - 0.15, A[1]], [B[0], y - 0.15, B[1]], [B[0], y + 0.05, B[1]], [A[0], y + 0.05, A[1]], [mx, 0, mz]);
    P.quad(M.balust, [A[0], y + 0.05, A[1]], [B[0], y + 0.05, B[1]], [B[0], y + 0.95, B[1]], [A[0], y + 0.95, A[1]], [mx, 0, mz], [[0, 0], [Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.5, 0], [Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.5, 1], [0, 1]]);
  }
  P.cyl(M.creamTrim, [cx + nx * 0.8, y - 0.15, cz + nz * 0.8], [cx + nx * 0.8, y - 0.9, cz + nz * 0.8], 0.28, 0.1, 6, true);       // the mascaron console under the slab
}

// ------------------------------------------------------------------------------------------------ plain walls of every other edge, roofs
function sideWalls(K, list) {
  const { P, M } = K;
  for (const [ring, kind, top] of list) {
    const stuc = kind === 'r' ? M.stuccoR : M.stuccoO, glass = M.glassDark;
    for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.3)) {
      const front = e.a[1] < 0.4 && e.b[1] < 0.4 && e.n[1] < -0.9 && Math.abs(e.a[0] - e.b[0]) > 5;
      if (front) continue;
      const mu = (e.a[0] + e.b[0]) / 2, hgt = kind === 'o' && mu < 13 ? 12.5 : top;
      onEdge(P, e, (len) => {
        const pitch = 3.0, n = Math.max(0, Math.floor((len - 1.2) / pitch)), ops = [];
        for (let k = 0; k < n; k++) {
          const x = (len - (n - 1) * pitch) / 2 + k * pitch;
          if (kind === 'r') ops.push({ x, y0: 1.1, w: 1.2, h: 2.3, kind: 'rect', glass }, { x, y0: 5.3, w: 1.2, h: 2.6, kind: 'rect', glass }, { x, y0: 10.0, w: 1.2, h: 2.6, kind: 'rect', glass });
          else ops.push({ x, y0: 1.2, w: 1.1, h: 2.0, kind: 'rect', glass }, { x, y0: 4.6, w: 1.1, h: 1.4, kind: 'rect', glass }, { x, y0: 7.3, w: 1.1, h: 2.2, kind: 'rect', glass });
        }
        wallHoles(P, { mat: stuc, x0: 0, x1: len, y0: 0.0, y1: hgt, uvs: 4, ops, reveal: stuc, depth: 0.25 });
        P.box(M.stone, -0.05, len + 0.05, 0, 0.6, 0, 0.06, 'bk', 1.6);
        cornice(P, M.trim, stuc, 0, len, 0, hgt - 1.2, { e0: 0.0, e1: 0.0, proj: 0.6, modillions: false });
      });
    }
  }
}
function roofs(K, r16, r14, r12) {
  const { P, M } = K;
  P.cap(M.roofG, r16, 11.85, true, 2.4); P.cap(M.roofG, r14, 12.55, true, 2.4); P.cap(M.roofG, r12, 16.55, true, 2.4);
  for (const u of [75, 95, 110, 121]) { P.box(M.chimney, u - 0.4, u + 0.4, 16.55, 18.1, 8.6, 9.4, 'b', 1); P.box(M.trim, u - 0.48, u + 0.48, 18.1, 18.2, 8.5, 9.5, 'b', 1); }
}
