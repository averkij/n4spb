// landmarksBotanicalGreenhouses/palm.js - the Palm House group: the GREAT PALM HOUSE no. 26 (Kitner + de Rochefort 1896-99, 23.5 m: a tall octagon of iron and glass, vertical walls with X-bracing,
// an eaves gutter and railing, a clerestory band, a first glass hip, a small second drum with railing and a second hip; the east portal "1899"), the MANGROVE HOUSE no. 27 and its glass link, the
// VICTORIA HOUSE no. 28 (octagon 19 m, tent roof with a lantern) and the RAIN-FOREST HOUSE no. 18 (a T of two gables).
// Dossier docs/research/aptekarsky-2026.md 4.1a (OSM ring 40.9 x 27.8, 12 vertices = an elongated octagon + the 3.7 x 2.5 m portal projection on the east face), photos 04 08 10 12 (the Palm House;
// NB: photos 02 / 99 show the Great Subtropical house, see n1.js).  Heights [E, photo proportions]: wall 15.0, clerestory 16.5, first hip 19.9, second drum 21.0, top 22.9 + finials 23.5.
// The plan comes from the baked footprints (the numbers below are the pf() frame values of r13561149 / r13561147 / r13561150 / r13561136); no flags: only plain finials.
import * as L from '../layout.js';
import { hangPlate, pf, inset, loftRing, capRing, railRing, postsRing, bar, tileQuad, wallFlat, glassWallTiles, lerp, centroid, rectOf, rectRing, EU, EV } from './geo.js';
import { gable } from './house.js';

const HULL = [[9.9, -13.9], [18.8, -6.7], [19.0, 5.5], [10.2, 13.9], [-9.8, 14.2], [-19.4, 5.9], [-19.6, -6.2], [-10.1, -13.6]];
const UV_UPPER = [[0, 0.5], [1, 0.5], [1, 1], [0, 1]];

export function build(K) {
  const { P, D, M, svc } = K;
  const hull = HULL.map(([u, v]) => pf(u, v));
  const R = (d) => inset(hull, d);
  const sh = (ring, y) => ring.map((p) => [p[0], y, p[1]]);
  const Y = { wall: 15.0, gut: 15.38, cler: 16.5, roof1: 19.9, drum: 21.0, top: 22.9 };
  const dd = { gut: -0.32, cler: 0.9, r1: 6.4, ledge: 7.0, r2: 11.2 };

  // ---- walls: stone plinth with a ledge, then the glass wall with X-bracing up to the gutter
  loftRing(P, M.stone, R(-0.12), 0, R(-0.12), 0.7, 0, 0, { vertical: true });
  loftRing(P, M.stone, R(-0.12), 0.7, R(0), 0.7, 0, 0);
  loftRing(P, M.glassWall, R(0), 0.7, R(0), Y.wall, 2.0, 4.4, { vertical: true });
  // the east face is the portal: its glass wall is drawn, the aedicule stands in front (below)
  // ---- the eaves: a copper-brown gutter band standing out 0.3 m, its top and underside
  loftRing(P, M.copper, R(dd.gut), Y.wall - 0.08, R(dd.gut), Y.gut, 0, 0);
  loftRing(P, M.copper, R(dd.gut), Y.gut, R(0.9), Y.gut, 0, 0);
  loftRing(P, M.copper, R(0), Y.wall - 0.08, R(dd.gut), Y.wall - 0.08, 0, 0, { down: true });
  // ---- the clerestory band (a row of vents) and the first glass hip
  loftRing(P, M.glassWall, R(dd.cler), Y.gut, R(dd.cler), Y.cler, 2.0, 2.2, { uv: UV_UPPER, vertical: true });
  loftRing(P, M.glassRoof, R(dd.cler), Y.cler, R(dd.r1), Y.roof1, 2.0, 2.4);
  // the walkway ledge, the second drum, the second hip and the flat top
  loftRing(P, M.iron, R(dd.r1), Y.roof1, R(dd.ledge), Y.roof1, 0, 0);
  loftRing(P, M.glassWall, R(dd.ledge), Y.roof1, R(dd.ledge), Y.drum, 2.0, 2.2, { uv: UV_UPPER, vertical: true });
  loftRing(P, M.glassRoof, R(dd.ledge), Y.drum, R(dd.r2), Y.top, 2.0, 2.4);
  capRing(P, M.tinFlat, R(dd.r2), Y.top);
  // ---- railings: round the eaves walkway, round the first hip, round the top
  railRing(P, M.railing, R(0.28), Y.gut, 1.0);
  railRing(P, M.railing, R(dd.r1 + 0.1), Y.roof1, 1.0);
  railRing(P, M.railing, R(dd.r2 + 0.1), Y.top, 0.7);
  // ---- detail: corner posts and posts every 4.5 m, two horizontal iron belts, the hip ribs and the rafters of both hips, finials
  postsRing(D, M.iron, R(-0.05), 0.7, Y.wall, 4.5, 0.075);
  postsRing(D, M.iron, R(-0.03), 0.7, Y.wall, 2.0, 0.04);                      // the mullions of the wall in relief (every 2 m; the tile carries the 1 m ones)
  for (let i = 0; i < hull.length; i++) { const p = R(-0.06)[i]; D.cyl(M.iron, [p[0], 0.7, p[1]], [p[0], Y.wall + 0.1, p[1]], 0.15, 0.15, 4, false); }
  for (const y of [5.3, 10.2]) loftRing(D, M.iron, R(-0.09), y, R(-0.09), y + 0.14, 0, 0);
  const r0 = R(dd.cler), r1 = R(dd.r1), r2 = R(dd.ledge), r3 = R(dd.r2);
  for (let i = 0; i < hull.length; i++) {
    bar(D, M.iron, [r0[i][0], Y.cler + 0.05, r0[i][1]], [r1[i][0], Y.roof1 + 0.05, r1[i][1]], 0.09);
    bar(D, M.iron, [r2[i][0], Y.drum + 0.05, r2[i][1]], [r3[i][0], Y.top + 0.05, r3[i][1]], 0.08);
    const j = (i + 1) % hull.length, l = Math.hypot(r0[j][0] - r0[i][0], r0[j][1] - r0[i][1]), k = Math.max(1, Math.round(l / 1.35));
    for (let m = 1; m < k; m++) {
      const s = m / k, a0 = [lerp(r0[i][0], r0[j][0], s), lerp(r0[i][1], r0[j][1], s)], a1 = [lerp(r1[i][0], r1[j][0], s), lerp(r1[i][1], r1[j][1], s)];
      bar(D, M.iron, [a0[0], Y.cler + 0.05, a0[1]], [a1[0], Y.roof1 + 0.05, a1[1]], 0.05);
      if (m % 2 === 0) { const b0 = [lerp(r2[i][0], r2[j][0], s), lerp(r2[i][1], r2[j][1], s)], b1 = [lerp(r3[i][0], r3[j][0], s), lerp(r3[i][1], r3[j][1], s)]; bar(D, M.iron, [b0[0], Y.drum + 0.05, b0[1]], [b1[0], Y.top + 0.05, b1[1]], 0.045); }
    }
  }
  for (const i of [0, 4]) { const p = r3[i]; D.cyl(M.iron, [p[0], Y.top, p[1]], [p[0], 23.5, p[1]], 0.07, 0.025, 6, false); }      // plain finials, no flags
  // ---- the east portal (1899)
  portal(K);

  // ---- the Mangrove house no. 27: a tall narrow gable hall, and its glass link to the Victoria house
  const mg = [[-9.8, 14.2], [10.2, 13.9], [10.3, 21.6], [-9.7, 21.8]].map(([u, v]) => pf(u, v));
  gable(K, rectOf(mg), { eave: 3.8, ridge: 7.0 });
  const lk = [[-3.7, 21.7], [4.2, 21.6], [4.3, 26.1], [-3.6, 26.0]].map(([u, v]) => pf(u, v));
  gable(K, rectOf(lk), { eave: 2.6, ridge: 3.9 });
  victoria(K);
  rainForest(K);
  { const c = pf(0, 0); svc.monuments.push({ id: 'r13561149', name: 'Большая пальмовая оранжерея (1899)', x: c[0], z: c[1], h: 23.5 }); }
  { const c = pf(0, 35); svc.monuments.push({ id: 'r13561150', name: 'Викторная оранжерея', x: c[0], z: c[1], h: 11.4 }); }
}

// ---------------------------------------------------------------------------------------------- the portal
function portal(K) {
  const { P, D, M, svc } = K;
  const o = pf(21.45, -1.1), th = Math.atan2(EU[0], EU[1]);
  P.push(o[0], 0, o[1], th);
  const hw = 1.85;
  P.box(M.stone, -hw - 0.1, hw + 0.1, 0, 0.35, -2.6, 0.08, 'b');                                  // the stone socle
  P.box(M.portalCream, -hw, hw, 0.35, 4.9, -2.5, 0, 'fb');                                           // the stucco body (front: the picture below)
  P.quad(M.portal, [-hw, 0.35, 0.01], [hw, 0.35, 0.01], [hw, 4.9, 0.01], [-hw, 4.9, 0.01], [0, 0, 1], [[0, 0.0], [1, 0.0], [1, 1], [0, 1]]);
  P.box(M.white2, -hw - 0.3, hw + 0.3, 4.9, 5.55, -2.8, 0.36);                                        // entablature with modillion cornice
  for (let i = 0; i < 9; i++) P.box(M.white2, -hw - 0.1 + i * 0.44, -hw + 0.08 + i * 0.44, 4.72, 4.9, 0.0, 0.2);   // modillions
  P.fan(M.white2, [[-hw - 0.3, 5.55, 0.36], [hw + 0.3, 5.55, 0.36], [0, 6.55, 0.36]], [0, 0, 1], (p) => [p[0], p[1]]);        // pediment
  P.quad(M.tinFlat, [-hw - 0.3, 5.55, 0.36], [0, 6.55, 0.36], [0, 6.55, -2.8], [-hw - 0.3, 5.55, -2.8], [-0.5, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(M.tinFlat, [0, 6.55, 0.36], [hw + 0.3, 5.55, 0.36], [hw + 0.3, 5.55, -2.8], [0, 6.55, -2.8], [0.5, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  D.push(o[0], 0, o[1], th);
  D.cyl(M.stoneDark, [0, 5.95, 0.37], [0, 5.95, 0.47], 0.4, 0.34, 12, true);                         // the cartouche
  D.cyl(M.white2, [0, 5.95, 0.47], [0, 5.95, 0.53], 0.26, 0.24, 10, true);
  D.cyl(M.iron, [0, 6.35, 0.4], [0, 6.62, 0.42], 0.1, 0.14, 8, true);                                // the crown, simplified
  for (const s of [-1, 1]) {                                                                           // the two urns on the pediment ends
    const x = s * 1.55;
    D.cyl(M.white2, [x, 5.55, 0.15], [x, 5.9, 0.15], 0.3, 0.3, 8, true);
    D.cyl(M.white2, [x, 5.9, 0.15], [x, 6.15, 0.15], 0.17, 0.2, 8, false);
    D.cyl(M.white2, [x, 6.15, 0.15], [x, 6.55, 0.15], 0.3, 0.12, 8, true);
  }
  D.pop();
  for (let j = 0; j < 3; j++) { const z0 = 0.08 + 0.34 * (2 - j), w = hw + 0.25 - 0.08 * j; P.box(M.stoneGrey, -w, w, 0, 0.14 * (j + 1), z0, z0 + 0.34); }          // three steps
  P.pop();
  // walk boxes of the steps (the door is shut: the player may stand on them)
  const ph = K.ctx.physics;
  if (ph) for (let j = 0; j < 3; j++) {
    const z = 0.08 + 0.34 * (2 - j) + 0.17, c = [o[0] + EU[0] * z, o[1] + EU[1] * z];
    const it = ph.addWalkBox(c[0], c[1], 2 * (hw + 0.25 - 0.08 * j), 0.36, th, 0.14 * (j + 1)); if (it) it.sticky = true;
  }
  { const s = -EV[0], t = -EV[1];                                                              // the plate on the north side wall of the aedicule (outward = -EV)
    hangPlate(K, 'r13561149', M.platePalm, o[0] - EU[0] * 1.3 + s * (hw + 0.03), 1.9, o[1] - EU[1] * 1.3 + t * (hw + 0.03), 0.96, 0.48, s, t, 'plate'); }
  (svc.crowd ||= []).push({ id: 'gh-palm-portal', kind: 'photo', x: o[0] + EU[0] * 6, z: o[1] + EU[1] * 6, r: 5, n: 5 });
  svc.entrances.push({ x: o[0] + EU[0] * 1.6, z: o[1] + EU[1] * 1.6, rotY: th + Math.PI, bldg: 'r13561149' });
  { const sx = o[0] + EU[0] * 12, sz = o[1] + EU[1] * 12; svc.photoSpots.push({ x: sx, z: sz, yaw: Math.round(L.yawToward(sx, sz, o[0], o[1])), name: 'Пальмовая оранжерея: восточный портал 1899 года' }); }
}

// ---------------------------------------------------------------------------------------------- the Victoria house
function victoria(K) {
  const { P, D, M } = K;
  const hull = [[-3.6, 26.0], [4.3, 26.1], [8.7, 29.8], [9.9, 38.5], [5.2, 44.1], [-2.6, 44.9], [-8.8, 39.8], [-9.1, 31.6]].map(([u, v]) => pf(u, v));
  const R = (d) => inset(hull, d);
  loftRing(P, M.stone, R(0), 0, R(0), 0.6, 0, 0);
  loftRing(P, M.glassWall, R(0), 0.6, R(0), 4.0, 2.0, 4.4, { vertical: true });
  loftRing(P, M.iron, R(-0.2), 3.92, R(-0.2), 4.2, 0, 0);
  loftRing(P, M.iron, R(-0.2), 4.2, R(0.5), 4.2, 0, 0);
  const T = [[0.5, 4.2], [2.6, 6.5], [4.8, 8.3], [6.7, 9.4]];
  for (let i = 0; i + 1 < T.length; i++) loftRing(P, M.glassRoof, R(T[i][0]), T[i][1], R(T[i + 1][0]), T[i + 1][1], 2.0, 2.4);
  loftRing(P, M.glassWall, R(7.0), 9.4, R(7.0), 10.3, 2.0, 2.2, { uv: UV_UPPER, vertical: true });
  loftRing(P, M.iron, R(6.7), 9.4, R(7.0), 9.4, 0, 0);
  loftRing(P, M.glassRoof, R(7.0), 10.3, R(8.6), 10.9, 2.0, 2.4);
  capRing(P, M.iron, R(8.6), 10.9);
  railRing(P, M.railing, R(0.15), 4.2, 0.9);
  const c = centroid(hull);
  D.cyl(M.iron, [c[0], 10.9, c[1]], [c[0], 11.5, c[1]], 0.08, 0.03, 6, false);                       // a plain spike, no vane
  // ribs: eight hips, two horizontal rings, posts every 4 m
  const rings = T.map(([d]) => R(d)), ys = T.map((t) => t[1]);
  for (let i = 0; i < hull.length; i++) for (let k = 0; k + 1 < rings.length; k++) bar(D, M.iron, [rings[k][i][0], ys[k] + 0.05, rings[k][i][1]], [rings[k + 1][i][0], ys[k + 1] + 0.05, rings[k + 1][i][1]], 0.08);
  for (let k = 1; k < rings.length; k++) loftRing(D, M.iron, R(T[k][0] - 0.06), ys[k], R(T[k][0] - 0.06), ys[k] + 0.1, 0, 0);
  postsRing(D, M.iron, R(-0.05), 0.6, 4.0, 3.6, 0.07);
}

// ---------------------------------------------------------------------------------------------- the rain-forest house no. 18
function rainForest(K) {
  const bar_ = { c: pf(-2.5, -29.75), ax: EU, ay: EV, hx: 20.5, hy: 5.35 };
  gable(K, bar_, { eave: 3.8, ridge: 8.4 });
  const stem = { c: pf(-0.25, -21.7), ax: EV, ay: [-EU[0], -EU[1]], hx: 8.1, hy: 10.05 };
  gable(K, stem, { eave: 3.8, ridge: 8.4 });
}
