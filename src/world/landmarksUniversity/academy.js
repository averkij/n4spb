// landmarksUniversity/academy.js - the main building of the Academy of Sciences (Университетская наб., 5; G. Quarenghi 1783-89; OSM w28566714), its Museum wing (I. F. Luchini
// 1826-31; w172906284) and the polyclinic in the yard (w28566716): docs/research/university-embankment.md section 4, photos refs/university ac_01 (frontal, the measuring photo)
// ac_02 ac_04 ac_06 lo_11 (portico, stairs, granite storey) lo_14 lo_15 lo_16 mw_01..07 (Museum wing).
//   Academy: a 101 m pale yellow block of 23 window axes (5 + 3 + 7 + 3 + 5) on a granite ground storey, cornice 17.3 m, grey hipped roof with cream chimneys; the PORTICO: eight white
//   Ionic columns 11.9 m high on the podium at 2.8 m (the OSM footprint includes the podium), entablature, plain pediment (apex 22.3 m); two granite stair flights rise along the
//   facade to the landing (walkable), black iron railing between the columns; the heritage plate with its real text (ac_05).
//   Museum wing: the yellow U behind, rusticated arcaded ground floor with lion masks, two low domes over the inner corners.
// Frame AC (frame.js): +x along the river front to the NE, +z out to the Neva.
import * as L from '../layout.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, insetRoof, edgeColliders, shellColliders, texQuad, ringFromFlat } from './shell.js';
import { lathe } from './prims.js';
import { plate } from './plaques.js';
import { AC, AC_P0, AC_P1, AC_PD } from './frame.js';
import { knockBays, unitPanel } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the iron railing between the columns is a row of breakable bays

const ID = 'w28566714', EAVE = 17.3, AH = 17.3, POD = 2.8, YC0 = POD, YC1 = 14.7;

export function academy(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const b = L.buildingById ? L.buildingById(ID) : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Academy footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), loc = (p) => AC.M(p[0], p[1]);
  const isPod = (e) => Math.max(loc(e.a)[1], loc(e.b)[1]) > 1.5;
  const wall = { mat: M.acBay4, bayW: 4.05, texH: AH, eave: EAVE, plain: M.ac, minBay: 3.2 }, pod = { mat: null, plain: M.granite, eave: POD };
  const edges = shellWalls(P, poly, { style: (e) => (isPod(e) ? pod : wall), def: wall });
  shellCornice(P, poly, EAVE, M, { d: 0.6, h: 0.55 });
  insetRoof(P, ring, EAVE, M.acRoof, { inset: 5.6, rise: 3.0, chimney: M.acChimney, cap: M.whiteShade, chimneyStep: 7.5, chimneyMin: 12 });
  edgeColliders(ctx, edges, EAVE + 2, isPod);

  // ---------------------------------------------------------------------------------------------- portico (AC frame)
  P.push(AC.O[0], 0, AC.O[1], AC.rot);
  const x0 = AC_P0, x1 = AC_P1, xm = (x0 + x1) / 2, D = AC_PD;
  texQuad(P, M.acBay5, x0, x1, POD, EAVE - 0.6, 0, 7, AH, 0);                                  // the wall behind the columns: seven axes
  P.box(M.white, xm - 1.25, xm + 1.25, POD, 6.9, 0, 0.1, 'kb'); P.box(M.door, xm - 1.0, xm + 1.0, POD, 6.0, 0.1, 0.16, 'kb'); P.box(M.iron, xm - 0.03, xm + 0.03, POD, 6.0, 0.16, 0.18, 'kb');
  P.box(M.glass, xm - 1.0, xm + 1.0, 6.05, 6.75, 0.1, 0.14, 'kb');                              // the door under the portico and its transom
  P.quad(M.granitePlain, [x0, POD, D], [x1, POD, D], [x1, POD, 0], [x0, POD, 0], [0, 1, 0], [[x0 / 2.4, D / 2.4], [x1 / 2.4, D / 2.4], [x1 / 2.4, 0], [x0 / 2.4, 0]]);   // the landing
  P.box(M.white, x0, x1, YC1, EAVE - 0.55, 0.02, D + 0.02, 't');                                // entablature block: its underside is the ceiling of the portico
  P.quad(M.modil, [x0, EAVE - 0.64, D + 0.03], [x1, EAVE - 0.64, D + 0.03], [x1, EAVE - 0.64, D + 0.58], [x0, EAVE - 0.64, D + 0.58], [0, -1, 0], [[0, 0], [58, 0], [58, 1], [0, 1]]);
  const cols = []; for (let k = 0; k < 8; k++) cols.push(x0 + 1.25 + (k * (x1 - x0 - 2.5)) / 7);
  for (const x of cols) column(P, M.white, x, D - 0.92, YC0, YC1, 0.675);
  // pediment: tympanum, raking cornices, the roof of the portico running back into the main roof
  const xa = x0 - 0.65, xb = x1 + 0.65, ya = EAVE, yp = 22.3, zt = D + 0.12, zc = D + 0.62;
  P.fan(M.ac, [[xa + 0.6, ya, zt], [xb - 0.6, ya, zt], [xm, yp - 0.62, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
  for (const s of [1, -1]) {
    const xe = s > 0 ? xb : xa, run = Math.abs(xm - xe), sl = Math.hypot(run, yp - ya), nx = (-s * (yp - ya)) / sl, ny = run / sl;
    P.quad(M.white, [xe, ya, zc], [xm, yp - 0.5, zc], [xm, yp, zc], [xe, ya + 0.5, zc], [0, 0, 1]);
    P.quad(M.modil, [xe, ya, zt], [xm, yp - 0.5, zt], [xm, yp - 0.5, zc], [xe, ya, zc], [-nx, -ny, 0], [[0, 0], [30, 0], [30, 1], [0, 1]]);
    P.quad(M.acRoof, [xe, ya + 0.5, zc + 0.06], [xm, yp, zc + 0.06], [xm, yp, -9], [xe, ya + 0.5, -9], [nx, ny, 0], [[0, 0], [sl / 0.6, 0], [sl / 0.6, 20], [0, 20]]);
  }
  // iron railing between the columns and along the flights; the two granite stair flights (17 steps), their cheek walls
  // (n4spb: the 7 railing panels between the columns are knock bays below, one thin collider + one record + the drawn panel each; the podium front keeps its granite box up to the podium floor)
  const rails = [], railU = Math.round(cols[1] - cols[0] - 1.5);
  for (let k = 0; k < 7; k++) { const a = cols[k] + 0.75, c = cols[k + 1] - 0.75, wa = AC.W(a, D - 0.35), wb = AC.W(c, D - 0.35); rails.push({ x0: wa[0], z0: wa[1], x1: wb[0], z1: wb[1], y: POD }); }
  const RUN = 5.1, N = 17;
  for (const s of [-1, 1]) {
    const xt = s < 0 ? x0 : x1;                                                                // top of the flight; it descends away from the portico
    for (let i = 0; i < N; i++) { const xa2 = xt + s * (RUN * i) / N, xb2 = xt + s * (RUN * (i + 1)) / N, y = POD - (POD * (i + 1)) / N; P.box(M.granitePlain, Math.min(xa2, xb2), Math.max(xa2, xb2), 0, y + POD / N, 0.25, D, 'kb'); }
    const xe = xt + s * RUN, pts = [[xt, 0, D], [xe, 0, D], [xe, 0.5, D], [xt, POD + 0.5, D]];
    P.fan(M.granite, pts, [0, 0, 1], (p) => [p[0] / 2.4, p[1] / 1.2]); P.fan(M.granite, pts.map((p) => [p[0], p[1], D + 0.3]), [0, 0, 1], (p) => [p[0] / 2.4, p[1] / 1.2]);
    P.quad(M.granitePlain, [xt, POD + 0.5, D], [xe, 0.5, D], [xe, 0.5, D + 0.3], [xt, POD + 0.5, D + 0.3], [0, 1, 0]); P.quad(M.granitePlain, [xe, 0, D], [xe, 0, D + 0.3], [xe, 0.5, D + 0.3], [xe, 0.5, D], [s, 0, 0]);
    P.quad(M.ironwork, [xt, POD + 0.5, D + 0.15], [xe, 0.5, D + 0.15], [xe, 1.4, D + 0.15], [xt, POD + 1.4, D + 0.15], [0, 0, 1], [[0, 0], [5, 0], [5, 1], [0, 1]]);
    const c = AC.W(xt + (s * RUN) / 2, (0.25 + D) / 2);
    ph.addWalkRamp(c[0], c[1], D - 0.25, RUN, AC.rot + (s < 0 ? Math.PI / 2 : -Math.PI / 2), 0, POD, 3);
    AC.box(ph, xt + (s * RUN) / 2, D + 0.15, RUN, 0.3, 0, 0, 3.6);
  }
  P.box(M.granite, x0, x1, 0, POD, D, D + 0.3, 'kb', 1.2);                                     // the podium front (granite ashlar) proud of the footprint wall
  P.pop();
  AC.walk(ph, xm, D / 2, x1 - x0, D, 0, POD, 0);
  AC.box(ph, xm, 0, x1 - x0, 0.8, 0, 0, EAVE + 2); AC.box(ph, xm, D + 0.15, x1 - x0, 0.3, 0, 0, POD);
  knockBays(ctx, { name: 'lmU-portico-rail', bays: rails, far: 260,
    parts: [{ geo: unitPanel(0, 1.0, { u1: railU }), mat: M.ironwork, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
    collider: { y0: POD - 0.05, y1: POD + 1.0, thick: 0.3, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 150, h: 1.0, anchored: 14, hitK: 0.3, metal: true, minDv: 0 }) });
  K.extraTris += rails.length * 2;
  for (const x of cols) { const c = AC.W(x, D - 0.92); ph.addCylinder(c[0], c[1], 0.7, POD, YC1); }

  // ---------------------------------------------------------------------------------------------- the heritage plate (real text, ac_05) and the name plate by the west flight
  const front = edges.filter((e) => !isPod(e) && e.len > 15 && Math.abs(loc(e.a)[1]) < 1 && Math.abs(loc(e.b)[1]) < 1 && Math.min(loc(e.a)[0], loc(e.b)[0]) < 5)[0];
  if (front) onEdge(P, front, (len, f) => {
    const world = (x, z) => [f.x + f.xa[0] * x + front.n[0] * z, f.z + f.xa[1] * x + front.n[1] * z];
    plate(K, { id: ID, x: (len * 4) / 5, y: 2.0, w: 0.8, h: 1.0, key: 'ac-heritage', world, n: front.n, size: 40, lines: ['ПАМЯТНИК', 'АРХИТЕКТУРЫ XVIII ВЕКА', 'ЗДАНИЕ', 'АКАДЕМИИ НАУК', 'ПОСТРОЕНО В 1783–1789 гг.', 'АРХИТЕКТОР Д. КВАРЕНГИ', 'ОХРАНЯЕТСЯ ГОСУДАРСТВОМ'] });
    plate(K, { id: ID, x: (len * 3) / 5, y: 2.0, w: 1.1, h: 0.8, key: 'ac-name', world, n: front.n, style: 'board', size: 44, lines: ['РОССИЙСКАЯ АКАДЕМИЯ НАУК', 'САНКТ-ПЕТЕРБУРГСКИЙ', 'НАУЧНЫЙ ЦЕНТР'] });
  });
  const pc = AC.W(xm, D + 14);
  K.svc.monuments.push({ id: 'academy-of-sciences', name: 'Академия наук', x: b.cx, z: b.cz, h: 22.3, r: 0 });
  K.svc.entrances.push({ x: AC.W(xm, D - 2)[0], z: AC.W(xm, D - 2)[1], rotY: AC.rot, name: 'Академия наук', closed: true });
  K.svc.photoSpots.push({ x: pc[0], z: pc[1], yaw: 0, name: 'Академия наук' });
  K.svc.crowd.push({ x: AC.W(xm, D / 2)[0], z: AC.W(xm, D / 2)[1], r: 6, y: POD, name: 'портик Академии наук' });
}

/** an unfluted Ionic column: square plinth, torus base, tapered shaft, volutes, abacus; axis at (x, z), y0 .. y1 */
function column(P, mat, x, z, y0, y1, r) {
  P.box(mat, x - r * 1.3, x + r * 1.3, y0, y0 + 0.28, z - r * 1.3, z + r * 1.3, 'b');
  P.cyl(mat, [x, y0 + 0.28, z], [x, y0 + 0.55, z], r * 1.2, r * 1.04, 16, false);
  P.cyl(mat, [x, y0 + 0.55, z], [x, y1 - 0.75, z], r, r * 0.85, 16, false);
  P.cyl(mat, [x, y1 - 0.75, z], [x, y1 - 0.55, z], r * 0.85, r * 1.02, 16, false);
  for (const s of [-1, 1]) P.cyl(mat, [x + s * r * 1.02, y1 - 0.42, z - r * 0.95], [x + s * r * 1.02, y1 - 0.42, z + r * 0.95], 0.3, 0.3, 10, true);
  P.box(mat, x - r * 1.0, x + r * 1.0, y1 - 0.62, y1 - 0.2, z - r * 0.9, z + r * 0.9, '');
  P.box(mat, x - r * 1.28, x + r * 1.28, y1 - 0.2, y1, z - r * 1.12, z + r * 1.12, '');
}

export function museumWing(K) {
  const { ctx, P, M } = K;
  const b = L.buildingById ? L.buildingById('w172906284') : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Museum wing footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), EV = 13.5;
  shellWalls(P, poly, { def: { mat: M.mwBay, bayW: 3.9, texH: EV, eave: EV, plain: M.mw, margin: 0.7, minBay: 3.2 } });
  shellCornice(P, poly, EV, M, { d: 0.5, h: 0.45 });
  insetRoof(P, ring, EV, M.acRoof, { inset: 4.4, rise: 2.2, chimney: M.acChimney, cap: M.whiteShade, chimneyStep: 9 });
  shellColliders(ctx, poly, EV + 2);
  // the two low domes over the round halls of the inner corners (lo_14, mw_03): a short drum and a flat grey dome
  for (const [x, z] of [[-2717.0, -1013.6], [-2773.2, -974.5]]) {
    lathe(P, M.mw, x, z, [[5.6, EV + 0.6], [5.6, EV + 2.9], [5.85, EV + 2.95], [5.85, EV + 3.15], [5.6, EV + 3.2]], 24);
    lathe(P, M.acRoof, x, z, [[5.6, EV + 3.2], [5.1, EV + 4.1], [4.0, EV + 4.95], [2.4, EV + 5.5], [0.6, EV + 5.75], [0.01, EV + 5.78]], 24, 30);
  }
  K.svc.monuments.push({ id: 'museum-wing', name: 'Музейный флигель Академии наук', x: b.cx, z: b.cz, h: EV + 5.8, r: 0 });
  // the polyclinic in the yard: two storeys of the same vocabulary
  const pb = L.buildingById('w28566716');
  if (pb && pb.polys && pb.polys.length) {
    const pp = pb.polys[0], ev = 10.6;
    shellWalls(P, pp, { def: { mat: M.mwBay, bayW: 3.9, texH: EV, eave: ev, plain: M.mw, margin: 0.5, minBay: 3.2 } });
    shellCornice(P, pp, ev, M, { d: 0.35, h: 0.35 }); insetRoof(P, ringFromFlat(pp.o), ev, M.acRoof, { inset: 3.6, rise: 1.8 }); shellColliders(ctx, pp, ev + 2);
  }
}
