// landmarksGavan/tower.js - the WATER TOWER of Galerny Harbour (Водонапорная башня, 1894, N. D. Kutorga and G. S. Yakovlev for the pyroxylin works; Shkipersky protok 25; frame T, local +x along the long axis, the harbour at -v)
// (docs/research/gavan.md 7.5; photos refs/gavan 35 36 39 40 41 42 44, critic n01 n02).  Height 18.5 m [E +-2: no published figure].
//   BASE     8.1 x 8.1 m block (local x -7.4 .. 0.7), 4.8 m, dark red-brown brick, two narrow dark-red doors on the road side and one big double door on the harbour side, flat roof with an iron vent; the lower annex
//            (x 0.7 .. 7.3, 6.6 x 6 m, 3.5 m) with a flat brown roof.
//   SHAFT    6.4 x 6.4 m with 1.0 m chamfered corners, tapering to 5.8 m at the top, y 4.8 .. 13.2: brick with lighter recessed panels and three tiers of narrow windows (texture towerShaft).
//   CORNICE  corbelled brick frieze 13.2 .. 14.0 projecting 0.35 m, over it a ring of slanted TIMBER STRUTS that carries the overhanging tank storey.
//   TANK     a chamfered square 8.2 m, y 14.0 .. 17.4, boards under GREEN CONSTRUCTION NETTING (SW.TOWER_TANK = 'net', every 2014-19 photo) or bare boards, small white-framed windows, a low hipped tarred roof to 18.5 m.
// Closed private property: exterior only, solid.
import * as L from '../layout.js';
import { FT, SW } from './frame.js';
import { loft, bar } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';

/** the 8 points of a square (half a x half b) with chamfers c, at height y: local (x, y, z) */
const cham = (a, b, c, y) => [[a - c, y, b], [a, y, b - c], [a, y, -b + c], [a - c, y, -b], [-a + c, y, -b], [-a, y, -b + c], [-a, y, b - c], [-a + c, y, b]];

export function build(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics;
  const ctrX = -3.35;
  FT.on(P, () => {
    // base block and annex
    P.box(M.brickDark, -7.4, 0.7, 0, 4.8, -4.05, 4.05, 'b', 2.4);
    P.box(M.coping, -7.5, 0.8, 4.8, 4.95, -4.15, 4.15, 'b', 2);
    P.box(M.brickDark, 0.7, 7.3, 0, 3.5, -3.0, 3.0, 'bl', 2.4); P.box(M.timber, 0.65, 7.35, 3.5, 3.65, -3.05, 3.05, 'b', 2);
    P.box(M.iron, -6.9, -6.5, 4.95, 6.1, 2.8, 3.2, 'b', 1);                                              // the iron vent stack at the corner
    for (const x of [-5.6, -1.2]) P.quad(M.doorRed, [x - 0.45, 0, 4.07], [x + 0.45, 0, 4.07], [x + 0.45, 2.3, 4.07], [x - 0.45, 2.3, 4.07], [0, 0, 1]);   // two narrow doors on the road side (+v)
    P.quad(M.doorRed, [ctrX - 1.2, 0, -4.07], [ctrX + 1.2, 0, -4.07], [ctrX + 1.2, 3.0, -4.07], [ctrX - 1.2, 3.0, -4.07], [0, 0, -1]);                       // the big double door on the harbour side
    // the shaft: a tapering chamfered prism, four wide faces with the painted panels / windows, four narrow chamfer faces of plain brick
    P.push(ctrX, 0, 0, 0);
    const B = cham(3.2, 3.2, 1.0, 4.8), T = cham(2.9, 2.9, 1.0, 13.2);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, big = i % 2 === 1, mx = (B[i][0] + B[j][0]) / 2, mz = (B[i][2] + B[j][2]) / 2, ml = Math.hypot(mx, mz);
      P.quad(big ? M.towerShaft : M.brickDark, B[i], B[j], T[j], T[i], [mx / ml, 0, mz / ml], big ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0.3, 0], [0.3, 3.5], [0, 3.5]]);
    }
    P.cap(M.brickDark, T.map((p) => [p[0], p[2]]), 13.2, false, 3);
    // the corbelled frieze and the cornice
    P.box(M.brickDark, -3.25, 3.25, 13.2, 13.65, -3.25, 3.25, 'b', 2.4); P.box(M.timber, -3.4, 3.4, 13.65, 13.8, -3.4, 3.4, 'b', 2); P.box(M.brickDark, -3.3, 3.3, 13.8, 14.0, -3.3, 3.3, 'b', 2.4);
    // the timber struts under the overhanging tank storey: six per side, slanted outwards
    for (let s = 0; s < 4; s++) {
      P.push(0, 0, 0, s * Math.PI / 2);
      for (let k = 0; k < 6; k++) { const x = -2.5 + k, a = [x, 13.65, 3.35], b = [x * 1.3, 14.0, 4.1]; bar(P, M.timber, a, b, 0.11, 4); }
      P.pop();
    }
    // the tank storey: chamfered square 8.2 m, boards, netting, windows, hipped tarred roof
    const R0 = cham(4.1, 4.1, 1.8, 14.0), R1 = cham(4.1, 4.1, 1.8, 17.4);
    P.cap(M.timber, R0.map((p) => [p[0], p[2]]), 14.0, false, 3);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, mx = (R0[i][0] + R0[j][0]) / 2, mz = (R0[i][2] + R0[j][2]) / 2, ml = Math.hypot(mx, mz), big = i % 2 === 1, len = Math.hypot(R0[j][0] - R0[i][0], R0[j][2] - R0[i][2]);
      P.quad(M.towerBoards, R0[i], R0[j], R1[j], R1[i], [mx / ml, 0, mz / ml], [[0, 0], [len / 1.28, 0], [len / 1.28, 3.4 / 1.28], [0, 3.4 / 1.28]]);
      if (SW.TOWER_TANK === 'net') {
        const o = 0.07, nx = mx / ml, nz = mz / ml, q = (p, y) => [p[0] + nx * o, y, p[2] + nz * o];
        P.quad(M.towerNet, q(R0[i], 14.0), q(R0[j], 14.0), q(R1[j], 17.4), q(R1[i], 17.4), [nx, 0, nz], [[0, 0], [len / 1.2, 0], [len / 1.2, 3.4 / 1.2], [0, 3.4 / 1.2]]);
      }
      if (big) {                                                                                          // two small windows on each wide face (the windows show through the net)
        const nx = mx / ml, nz = mz / ml, tx = -nz, tz = nx;
        for (const dx of [-1.1, 1.1]) { const cx = mx + tx * dx + nx * 0.04, cz = mz + tz * dx + nz * 0.04, hw = 0.35; P.quad(M.towerWin, [cx - tx * hw, 15.2, cz - tz * hw], [cx + tx * hw, 15.2, cz + tz * hw], [cx + tx * hw, 16.35, cz + tz * hw], [cx - tx * hw, 16.35, cz - tz * hw], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      }
    }
    const E1 = cham(4.65, 4.65, 2.0, 17.35), E2 = cham(0.7, 0.7, 0.25, 18.3);
    loft(P, M.roofTar, [E1, E2], { uvs: 3, up: 0.9 });
    P.cap(M.roofTar, E1.map((p) => [p[0], p[2]]), 17.35, false, 3);
    P.box(M.roofTar, -0.7, 0.7, 18.2, 18.5, -0.7, 0.7, 'b', 1);                                          // the small square cap at the ridge
    P.pop();
  });
  const b = L.buildingById('w223783421');
  if (b && b.polys && b.polys[0]) addPolyColliders(Q.ctx, b.polys[0], -0.3, 19, 0.9);
  FT.box(ph, ctrX, 0, 8.1, 8.1, -0.3, 19); FT.box(ph, 4.0, 0, 6.6, 6.0, -0.3, 4);
  const c = FT.W(ctrX, 0);
  Q.svc.monuments.push({ id: 'w223783421', name: 'Водонапорная башня Галерной гавани', x: c.x, z: c.z, h: 18.5 });
  Q.svc.photoSpots.push({ x: -7162, z: -228, yaw: -29, pitch: 6, name: 'Водонапорная башня и Галерная гавань' });
}
