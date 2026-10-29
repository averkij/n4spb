// landmarksGavan/guard.js - the GUARDHOUSE of Galerny Harbour (Караульный дом, 1825-26, A. N. Shtaubert, a second storey added 1904-05; Shkipersky protok 21 k1; frame G, the portico FRONT = +v = SSE) (docs/research/gavan.md 7.6;
// photos refs/gavan 49 50 51 55).  26.3 x 15.7 m, eaves 11.3 m, pediment peak 13.0 m (OSM 2 levels h 6.6: wrong), pale-yellow plaster, white trim, window frames DARK RED (2022 state).
//   FRONT    7 axes (2 + 3 + 2): a central risalit 12.3 m wide, 0.5 m proud, with a loggia in antis (two wall piers 1.8 m and two free Tuscan columns 3.2 m apart, three arched glazed doors 2.2 m back), a white
//            balustrade-like band, a triangular pediment with a round window; four granite steps 9 m wide; two arched windows + two upper windows on the west wing, one arched window + the gate opening on the east wing.
//   SIDES    the west short side has 5 axes of arched / rectangular windows; the rear and the east end carry plain axes.  A low hipped zinc roof (to 13.2 m).  A lawn 5-9 m deep in front.
// Closed: exterior only, solid.
import * as L from '../layout.js';
import { FG } from './frame.js';
import { shapeOf } from './geo.js';
import { hipRoof } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';
import { coverFn, fillPolyClipped } from './surfaces.js';

const HL = 13.15, HW = 7.85, PLINTH = 0.7, E = 11.3;

export function build(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, cover = coverFn(Q.ctx);
  const arch = (x, face = 0, y0 = 1.1) => ({ x, y0, kind: 'arch' });
  void arch;
  const win = (mat, xa, xb, ya, yb, z) => P.quad(mat, [xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  const wing = (axes, z, o = {}) => {                                    // arched ground-floor windows and upper windows at the u positions `axes` on the plane z of the current face frame
    for (const x of axes) {
      if (!o.noGF || !o.noGF.includes(x)) win(M.gardArch, x - 0.9, x + 0.9, 1.1, 4.7, z + 0.03);
      win(M.gardRect, x - 0.85, x + 0.85, 6.9, 9.45, z + 0.03);
    }
  };
  FG.on(P, () => {
    P.box(M.gardPlinth, -HL - 0.08, HL + 0.08, 0, PLINTH, -HW - 0.08, HW + 0.08, 'b', 2);
    // the body in pieces so that the loggia of the risalit is a real recess: two wings, the ground block behind the loggia (front = its back wall at v -1.7), the upper block over it
    P.box(M.gardWall, -HL, -6.15, PLINTH, E, -HW, HW, 'tb', 4); P.box(M.gardWall, 6.15, HL, PLINTH, E, -HW, HW, 'tb', 4);
    P.box(M.gardWall, -6.15, 6.15, PLINTH, 5.4, -HW, HW - 2.2, 'tb', 4); P.box(M.gardWall, -6.15, 6.15, 5.4, E, -HW, HW + 0.5, 'tb', 4);
    // string course, main cornice
    P.box(M.trimCream, -HL - 0.06, HL + 0.06, 5.4, 5.9, -HW - 0.06, HW + 0.06, 'tb', 2);
    P.box(M.trimCream, -HL - 0.45, HL + 0.45, 10.6, 11.1, -HW - 0.45, HW + 0.45, 'b', 2);
    P.box(M.trimCream, -HL - 0.6, HL + 0.6, 11.1, 11.4, -HW - 0.6, HW + 0.6, '', 2);
    // rusticated corner quoins
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 9; k++) { const y0 = PLINTH + 0.1 + k * 0.5, long = k % 2 === 0, wx = long ? 0.9 : 0.55, wz = long ? 0.55 : 0.9; const xa = sx * (HL + 0.05), xb = sx * (HL - wx), za = sz * (HW + 0.05), zb = sz * (HW - wz); P.box(M.trimCream, Math.min(xa, xb), Math.max(xa, xb), y0, y0 + 0.44, Math.min(za, zb), Math.max(za, zb), 'tb', 1); }
    // ---- the front (+z): wings and the risalit
    P.push(0, 0, HW, 0);
    wing([-11.65, -8.15], 0);                                              // west wing: two axes
    wing([8.15], 0, { noGF: [11.65] }); win(M.gardRect, 11.65 - 0.85, 11.65 + 0.85, 6.9, 9.45, 0.03);
    P.box(M.glassDark, 10.2, 13.0, PLINTH, 4.0, 0.0, 0.1, 'bkt', 1);                                                              // the dark gate passage of the east wing (3 m), the iron bars in front
    P.box(M.iron, 10.15, 13.1, 4.0, 4.2, 0.04, 0.16, 'bk', 1); P.box(M.iron, 10.15, 13.1, PLINTH, PLINTH + 0.15, 0.04, 0.16, 'bk', 1);
    for (let x = 10.2; x < 13.1; x += 0.2) P.box(M.iron, x - 0.015, x + 0.015, PLINTH, 4.2, 0.05, 0.12, 'bk', 1);
    // risalit: 12.3 m wide, 0.5 m proud; the upper floor over a loggia
    P.box(M.trimCream, -6.2, 6.2, 5.4, 6.0, 0.0, 0.62, 'b', 2);                                                    // the balustrade-like band (the frieze of the portico)
    for (let x = -5.5; x <= 5.5; x += 0.55) P.box(M.trimCream, x - 0.07, x + 0.07, 5.0, 5.4, 0.45, 0.6, 'b', 1);
    for (const x of [-3.6, 0, 3.6]) win(M.gardRect, x - 0.85, x + 0.85, 6.9, 9.45, 0.53);
    for (const s of [-1, 1]) P.box(M.trimCream, s * 6.15 - 0.3, s * 6.15 + 0.3, 5.9, E, 0.0, 0.58, '', 1);       // flat pilasters
    P.quad(M.gardWall, [-6.15, 5.4, -2.2], [6.15, 5.4, -2.2], [6.15, 5.4, 0.5], [-6.15, 5.4, 0.5], [0, -1, 0], [[0, 0], [3, 0], [3, 1], [0, 1]]);    // the ceiling of the loggia
    // the loggia in antis: back wall 2.2 m behind the front plane, wall piers 1.8 m at both ends, three arched glazed doors, two free columns
    for (const x of [-3.6, 0, 3.6]) win(M.gardDoor, x - 0.75, x + 0.75, PLINTH + 0.05, PLINTH + 3.4, -2.17);
    for (const s of [-1, 1]) P.box(M.gardWall, s * 4.35 + (s > 0 ? 0 : -1.8), s * 4.35 + (s > 0 ? 1.8 : 0), PLINTH, 5.4, -2.2, 0.5, '', 4);
    for (const s of [-1, 1]) { P.col(M.trimCream, s * 1.6, 0.2, PLINTH + 0.2, 5.0, 0.36, 0.3, 14, true); P.box(M.trimCream, s * 1.6 - 0.5, s * 1.6 + 0.5, 5.0, 5.4, -0.3, 0.7, '', 1); P.box(M.trimCream, s * 1.6 - 0.45, s * 1.6 + 0.45, PLINTH, PLINTH + 0.2, -0.25, 0.65, '', 1); }
    // four granite steps in front of the portico, 9 m wide
    for (let k = 0; k < 4; k++) P.box(M.stepsStone, -4.5, 4.5, 0, PLINTH - 0.15 * (k + 1) + 0.15 * 0, 0.5 + 0.3 * (k + 1) - 0.3, 0.5 + 0.3 * (k + 1), 'b', 1);
    // the pediment: apex 13.0 (the cornice crown 11.4), round window of 1.0 m
    P.push(0, 0, 0.25, 0); P.extrude(M.trimCream, shapeOf([[-6.4, 11.4], [6.4, 11.4], [0, 13.0]]), 0, 0.4, 1, 4); P.pop();
    win(M.pedWindow, -0.6, 0.6, 11.9, 12.6, 0.67);
    P.pop();
    // ---- the west short side: five axes
    P.push(-HL, 0, 0, -Math.PI / 2);
    wing([-5.6, -2.8, 0, 2.8, 5.6], 0);
    P.pop();
    // ---- the east end: three axes (plain), the rear: five axes
    P.push(HL, 0, 0, Math.PI / 2); wing([-4.5, 0, 4.5], 0); P.pop();
    P.push(0, 0, -HW, Math.PI); wing([-10, -5, 0, 5, 10], 0); P.pop();
    // ---- the low hipped roof of grey zinc, to 13.2 m
    hipRoof(P, M.zincLight, -HL - 0.5, HL + 0.5, -HW - 0.5, HW + 0.5, 11.4, 1.8, { oe: 0.1 });
  });
  // the lawn in front (5-9 m deep) between the steps and the footway / street
  const front = [[-14, 9.9], [14, 9.9], [14, 15.5], [-14, 15.5]].map(([u, v]) => { const p = FG.W(u, v); return [p.x, p.z]; });
  fillPolyClipped(P, M.lawn, front, 0.05, cover, { tile: 6, maxEdge: 4, margin: 0.15 });
  const b = L.buildingById('w303684570');
  if (b && b.polys && b.polys[0]) addPolyColliders(Q.ctx, b.polys[0], -0.3, 13.3, 0.9); else FG.box(ph, 0, 0, 26.3, 15.7, -0.3, 13.3);
  const c = FG.W(0, 0);
  Q.svc.crowd.push({ id: 'guardhouse-lawn', kind: 'photo', x: -6905, z: -118, r: 6, n: 3 });
  Q.svc.monuments.push({ id: 'w303684570', name: 'Караульный дом Галерной гавани', x: c.x, z: c.z, h: 13 });
  Q.svc.photoSpots.push({ x: -6905, z: -118, yaw: -21, pitch: 4, name: 'Караульный дом: портик' });
}
