// landmarksKirova/dkparts.js - the PORTAL, the TOWER (shaft with window columns, the glazed drum, the pale concrete box with its cantilever slab) and the small details of the Kirov Palace (docs/research/kirova.md 5.5,
// 6; photos dk14 dk38 dk01 dk28).  Pushed frame FD (x = r, z = -q).
//   PORTAL  r -6.95 .. 10.3, front q -35.5, 7.1 m: dark rough stone, three bays (a double door 2.0 x 2.6 under a four-pane window 1.9 x 1.7) at the photographed pitch 5.25 m round the portal centre, stiles 1.6 m,
//           three stepped cornice bands, a red-brown flashing, a square double-faced clock on the right.
//   TOWER   shaft r 62 .. 73, q -22 .. -8 (36 m), four rows of small windows per face, stepped cornice at 36, the glass drum 36 .. 39 (D 7.6) + plaster cap to 39.8.
import { FRONT as F, DKH as H, DOORS_R, FD } from './frame.js';
import { windowWall } from './facade.js';
import { dkOp, dkWindowed } from './dkwin.js';
import { tube } from './geo.js';

function portal(K) {
  const { P, M } = K, r0 = F.portal[0], r1 = F.portal[1], q = F.portalQ, PC = (r0 + r1) / 2;
  const ops = [];
  for (const c of DOORS_R) {
    ops.push({ x: c, w: 2.0, y0: 0.15, y1: 2.75, kind: 'door', glass: M.door, glassUv: [[0, 0], [2, 0], [2, 1], [0, 1]] });
    ops.push({ x: c, w: 1.9, y0: 3.3, y1: 5.0, glass: M.portalWin });
  }
  windowWall(P, { x0: r0, x1: r1, y0: 0, y1: 6.1, z0: -q, tu: 3, tv: 3, wall: M.portalStone, reveal: M.portalStone, depth: 0.25, ops });
  // pale timber frames round the windows over the doors, a kick plate under each door
  for (const c of DOORS_R) {
    P.box(M.doorWin, c - 1.05, c + 1.05, 3.2, 3.3, -q, -q + 0.06, 'k', 1); P.box(M.doorWin, c - 1.05, c + 1.05, 5.0, 5.1, -q, -q + 0.06, 'k', 1);
    P.box(M.doorWin, c - 1.05, c - 0.95, 3.3, 5.0, -q, -q + 0.06, 'k', 1); P.box(M.doorWin, c + 0.95, c + 1.05, 3.3, 5.0, -q, -q + 0.06, 'k', 1);
    P.box(M.portalStone, c - 1.1, c + 1.1, 0, 0.15, -q + 0.05, -q + 0.3, 'k', 2);                          // the sill (door level +0.15)
  }
  // the stepped cornice (three bands) and the sheet-metal flashing
  P.box(M.portalStone, r0 - 0.05, r1 + 0.05, 6.1, 6.45, -q, -q + 0.18, 'k', 2);
  P.box(M.portalStone, r0 - 0.1, r1 + 0.1, 6.45, 6.8, -q, -q + 0.3, 'k', 2);
  P.box(M.portalStone, r0 - 0.15, r1 + 0.15, 6.8, H.portal, -q, -q + 0.42, 'k', 2);
  P.box(M.flash, r0 - 0.2, r1 + 0.2, H.portal, H.portal + 0.07, -q - 0.0, -q + 0.5, 'b', 1);
  // the square double-faced wall clock on a bracket from the right-hand pier (0.55 x 0.55 x 0.25)
  const clock = FD.W(PC + 7.55, q - 0.56), labels = K.ctx.services.labels;
  if (!labels?.reserve || labels.reserve('w45966107', clock.x, 4.7, clock.z, 0.6, 0.6, FD.s, FD.c, 'clock')) {
    const x = PC + 7.55; P.box(M.clockCase, x - 0.04, x + 0.04, 4.3, 4.45, -q + 0.02, -q + 0.3, 'k', 1);
    P.box(M.clockCase, x - 0.3, x + 0.3, 4.4, 5.0, -q + 0.3, -q + 0.55, '', 1);
    P.quad(M.clockFace, [x - 0.25, 4.45, -q + 0.56], [x + 0.25, 4.45, -q + 0.56], [x + 0.25, 4.95, -q + 0.56], [x - 0.25, 4.95, -q + 0.56], [0, 0, 1]); }
  // house plate area and the heritage plaque are streets' (labels) - nothing here
}

function tower(K) {
  const { P, M } = K, r0 = 62.0, r1 = 73.0, q0 = -22.0, q1 = -8.0, cr = (r0 + r1) / 2, cq = (q0 + q1) / 2, zc = -cq;
  // one column of four small square windows on the south, east and north faces (real reveals; moulded stone frames are the lintel / sill bands): rows centred at 23.5 / 26.9 / 30.3 / 33.7 m
  const rows = [23.5, 26.9, 30.3, 33.7].map((c) => [c - 0.65, c + 0.65]);
  const ops = (cx) => rows.map(([ya, yb], i) => dkOp(M, cx, 1.0, ya, yb, 2, [], i % 2 ? M.dkGlassC : M.dkGlassA, { lintel: true }));
  dkWindowed(K, { x0: r0, x1: r1, ya: 17.5, yb: 36.0, z: -q0, tu: 4, tv: 4, wall: M.wall, ops: ops(cr), depth: 0.25 });                    // south (front) face
  P.push(r1, 0, -q0, Math.PI / 2); dkWindowed(K, { x0: 0, x1: q1 - q0, ya: 17.5, yb: 36.0, z: 0, tu: 4, tv: 4, wall: M.wall, ops: ops((q1 - q0) / 2), depth: 0.25 }); P.pop();   // east face
  P.push(r1, 0, -q1, Math.PI); dkWindowed(K, { x0: 0, x1: r1 - r0, ya: 17.5, yb: 36.0, z: 0, tu: 4, tv: 4, wall: M.wall, ops: ops((r1 - r0) / 2), depth: 0.25 }); P.pop();         // north (courtyard) face
  // the stepped cornice at 36 m
  P.box(M.cornice, r0 - 0.2, r1 + 0.2, 35.1, 35.5, -q1 - 0.2, -q0 + 0.2, 'b', 2); P.box(M.cornice, r0 - 0.5, r1 + 0.5, 35.5, 36.0, -q1 - 0.5, -q0 + 0.5, 'b', 2);
  // the drum: eight tall windows of glass tubes, a 0.8 m plaster cap
  tube(P, M.drum, cr, zc, 36.0, 39.0, 3.8, 3.8, 16, 1, 1, { capTop: M.roof });
  tube(P, M.wall, cr, zc, 39.0, 39.8, 3.95, 3.95, 16, 3, 0.2, { capTop: M.roof });
  // the cantilever slab on the west face of the concrete box
  P.box(M.concreteDark, 54.2, 56.4, 28.7, 29.0, 11, 19, '', 2);
  // roof lettering ('ДВОРЕЦ' / 'ИМЕНИ С.М. КИРОВА' / 'КУЛЬТУРЫ') stood here until 2019 and is gone in 2026: frame.js LETTERS = false
}

/** columns of small windows (A.pavSide decals) on the side faces of the two pavilions, stacks of three above the neighbouring roofs */
function pavilionSides(K) {
  const { P, M } = K;
  const col = (x, qa, nx) => {                                                                          // a stack of three tiles of 1.7 x 3.4 m on the face at r = x, q centred on qa
    for (let i = 0; i < 3; i++) { const y0 = 10.4 + i * 3.4; P.quad(M.pavSide, [x, y0, -(qa - 0.85)], [x, y0, -(qa + 0.85)], [x, y0 + 3.4, -(qa + 0.85)], [x, y0 + 3.4, -(qa - 0.85)], [nx, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  };
  col(F.pl[1] + 0.03, -31.0, 1); col(F.pl[0] - 0.03, -31.0, -1); col(F.pr[0] - 0.03, -30.7, -1); col(F.pr[1] + 0.03, -30.7, 1);
}

function details(K) {
  const { P, M } = K;
  P.box(M.chimney, -67.2, -65.4, 22.2, 30.0, -7.4, -5.0, 'b', 2); P.box(M.cornice, -67.35, -65.25, 30.0, 30.25, -7.55, -4.85, 'b', 1);          // the brick-stuccoed chimney at the NW of the west wing [?]
  // a few roof boxes (stair heads / vents) on the main roofs break the flat plane
  P.box(M.concrete, -40, -36, H.wing, H.wing + 2.3, 14, 20, 'b', 2); P.box(M.concrete, 36, 41, H.wing, H.wing + 2.3, 13, 19, 'b', 2); P.box(M.concrete, 80, 86, H.eastWing, H.eastWing + 2.4, -30, -22, 'b', 2);
}

export function build(K) {
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] dkparts/${name}:`, e); throw e; } };
  stage('portal', () => portal(K)); stage('tower', () => tower(K)); stage('pavilionSides', () => pavilionSides(K)); stage('details', () => details(K));
}
