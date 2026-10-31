// landmarksPetrovskyYacht/savina.js - the SAVINA HOME (Дом ветеранов сцены имени М. Г. Савиной, Петровский пр., 13; M. F. Geisler 1900-02, enlarged 1948-56, federal monument 2001; OSM w31065483, the whole zig-zag
// complex of wings 4 187 m2, axes 17 / 107 deg).  Photos v01 v02 v03 v04 v05 of the dossier PHOTO TABLE: two storeys of CHROME-YELLOW stucco (#e6b83e) with white trim; the first storey rusticated with white joints,
// the second storey with pedimented window hoods, a string course between, a frieze with garlands under the cornice, a granite plinth 1.0 m; a hipped zinc roof (grey, standing seams) with a flat deck, a white
// railing and yellow chimneys; white balustraded balconies on brackets; the central RISALIT of the spine wing has the PORTICO of four white Corinthian columns on a stylobate with three steps, the entablature with
// the inscription ДОМ ВЕТЕРАНОВ СЦЕНЫ, a pediment, a balcony over the brown double door; in the courtyard: black cast three-lantern lamp posts, grey park benches with black ends, the granite basin fountain,
// the bronze bust of M. G. Savina on a stone pedestal (OSM n4907402347; her tomb n4907402348 lies inside the footprint of the house church: not drawn).  Exterior only: solid walls, no entry.  Frame: centre (-5390, -3380), rotation -17 deg.
import { ringEdges, insetRing, pointIn, slopeBetween, fenceAlong } from './shapes.js';
import { bust, cached, figureMats } from '../lib/figures.js';
import * as L from '../layout.js';

export const DEG = Math.PI / 180;
export const SAV = { x: -5390, z: -3380, rot: -17 * DEG };
export const savWorld = (lx, lz) => ({ x: SAV.x + lx * Math.cos(17 * DEG) + lz * Math.sin(17 * DEG), z: SAV.z - lx * Math.sin(17 * DEG) + lz * Math.cos(17 * DEG) });
export const RING = [[63.1, 62.1], [45.7, 61.8], [46.2, 41.8], [21.6, 41.5], [20.9, 61.5], [3, 61.1], [3.5, 40.5], [-3, 40.8], [-5.6, 44.5], [-23.8, 31.7], [-21.4, 27.6], [-21.8, 19.6], [-44, 19.9], [-44.6, 2.3], [-29.1, 2], [-30.6, -25.9], [-51, -25.5], [-52, -71.6], [-20.6, -72.4], [-20.2, -60.9], [-37.5, -60.2], [-37.3, -53.6], [-30.7, -53.8], [-30.3, -44], [-36.8, -43.8], [-36.6, -37.2], [-26.9, -37.7], [-18.9, -37.8], [-18.1, -20.8], [-12.2, -20.8], [-11.1, -1.2], [-16.3, -1.2], [-15.7, 13.4], [-10.8, 12.5], [7.9, 27.7], [7.5, 35.2], [25.1, 35.3], [25.4, 11.7], [42.7, 11.7], [42.5, 35.8], [63.7, 36.6]];
export const PORTICO = { x: -11.65, z: -11.0 };
const PL = 1.0, WT = 9.4, EV = 10.2, DECK = 11.5;
const bustFig = () => cached('pyac-savina-bust', () => bust({ detail: 0.8, style: 'civil', turn: 0.2, pitch: 0.03, roll: 0, face: { age: 0.55, hair: 'long', brow: 0.7, jaw: 0.78, nose: 0.9, seed: 31, mouth: 'closed' } }));

export function build(K) {
  const { P, M, ctx, shared } = K, r = ctx.rng(9071);
  const E = ringEdges(RING), colliders = (shared.savina = { edges: [], cols: [], boxes: [], cyls: [], steps: [] });
  P.push(SAV.x, 0, SAV.z, SAV.rot);
  P.far = 900;
  // ---- plinth, walls (a tile of the yellow stucco bay per 3.4 m of edge, windows centred), cornice, roof
  for (const e of E) {
    const n = Math.max(1, Math.round(e.len / 3.4)), a = e.a, b = e.b, nn = [e.n[0], 0, e.n[1]];
    P.quad(M.granite, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], PL, b[1]], [a[0], PL, a[1]], nn, [[0, 0], [e.len / 1.5, 0], [e.len / 1.5, PL / 1.5], [0, PL / 1.5]]);
    if (e.len < 2.8) P.quad(M.yellow, [a[0], PL, a[1]], [b[0], PL, b[1]], [b[0], WT, b[1]], [a[0], WT, a[1]], nn);
    else P.quad(M.savWall, [a[0], PL, a[1]], [b[0], PL, b[1]], [b[0], WT, b[1]], [a[0], WT, a[1]], nn, [[0, 0], [n, 0], [n, 1], [0, 1]]);
    colliders.edges.push({ a, b, len: e.len });
  }
  const O = insetRing(RING, -0.55), Q = insetRing(RING, 2.5), EO = ringEdges(O);
  for (const e of EO) { P.quad(M.white, [e.a[0], WT, e.a[1]], [e.b[0], WT, e.b[1]], [e.b[0], EV, e.b[1]], [e.a[0], EV, e.a[1]], [e.n[0], 0, e.n[1]]); }
  for (let i = 0; i < RING.length; i++) { const j = (i + 1) % RING.length; P.quad(M.white, [O[i][0], WT, O[i][1]], [O[j][0], WT, O[j][1]], [RING[j][0], WT, RING[j][1]], [RING[i][0], WT, RING[i][1]], [0, -1, 0]); }
  slopeBetween(P, M.zinc, O, Q, EV, DECK, 1.2);
  P.cap(M.zinc, Q, DECK, true, 1.2);
  P.ranged(260, () => fenceAlong(P, M.railWhite, Q, DECK, 1.0, 2.0, true));
  for (const [x, z] of [[-45, -66], [-27, -66], [-40, -10], [-24, -30], [-37, 11], [-34, 24], [8, 52], [32, 52], [55, 50], [34, 30], [-17, 6]]) {
    if (!pointIn(Q, x, z)) continue;
    P.box(M.yellow, x - 0.5, x + 0.5, DECK, DECK + 2.8, z - 0.5, z + 0.5, 'b', 1); P.box(M.white, x - 0.65, x + 0.65, DECK + 2.8, DECK + 3.05, z - 0.65, z + 0.65, 'b', 1);
  }

  // ---- balconies on brackets at the second-floor sill height (centre of a bay near the middle of the long edges)
  P.ranged(300, () => {
    for (let i = 0; i < E.length; i++) {
      const e = E[i]; if (e.len < 14 || i === 29) continue;
      const n = Math.max(1, Math.round(e.len / 3.4)), tc = (Math.floor(n / 2) + 0.5) * e.len / n, cx = e.a[0] + e.t[0] * tc, cz = e.a[1] + e.t[1] * tc, rot = Math.atan2(e.n[0], e.n[1]);
      P.push(cx, 0, cz, rot);
      P.box(M.white, -1.5, 1.5, 5.45, 5.65, 0, 1.0, '', 1);
      for (const sx of [-1.0, 1.0]) P.box(M.white, sx - 0.12, sx + 0.12, 4.8, 5.45, 0, 0.8, '', 1);
      P.quad(M.railBal, [-1.5, 5.65, 1.0], [1.5, 5.65, 1.0], [1.5, 6.6, 1.0], [-1.5, 6.6, 1.0], [0, 0, 1], [[0, 0], [1.5, 0], [1.5, 1], [0, 1]]);
      P.quad(M.railBal, [-1.5, 5.65, 1.0], [-1.5, 5.65, 0], [-1.5, 6.6, 0], [-1.5, 6.6, 1.0], [-1, 0, 0], [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]); P.quad(M.railBal, [1.5, 5.65, 0], [1.5, 5.65, 1.0], [1.5, 6.6, 1.0], [1.5, 6.6, 0], [1, 0, 0], [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]);
      P.pop();
    }
  });

  // ---- the portico on the risalit of the spine wing (outward = +x of the ring frame): frame rotated +90 deg, local x runs north, z outward
  P.push(PORTICO.x, 0, PORTICO.z, Math.PI / 2);
  const cH = 7.4, capH = 0.9, eY0 = 0.6 + cH + capH, zc = 3.3;
  P.box(M.granite, -6.4, 6.4, 0, 0.6, 0, 5.0, '', 1.5);                                                      // the stylobate
  for (let k = 0; k < 3; k++) P.box(M.granite, -6.4, 6.4, 0, 0.2 * (k + 1), 5.0, 5.0 + 0.4 * (3 - k), 'bk', 1.5);   // three steps
  for (const u of [-5.25, -1.75, 1.75, 5.25]) {
    P.col(M.white, u, zc, 0.6, 1.0, 0.62, 0.6, 12, true);                                                   // base
    P.col(M.white, u, zc, 1.0, 0.6 + cH, 0.5, 0.43, 14, false);                                             // shaft
    P.col(M.white, u, zc, 0.6 + cH, 0.6 + cH + capH, 0.46, 0.66, 14, true);                                 // capital (flared)
    P.box(M.white, u - 0.7, u + 0.7, eY0 - 0.14, eY0, zc - 0.7, zc + 0.7, '', 1);                          // abacus
    colliders.cols.push({ u, z: zc });
  }
  P.box(M.white, -6.4, 6.4, eY0, eY0 + 0.7, 0, 4.2, '', 2);                                                  // architrave
  P.box(M.white, -6.4, 6.4, eY0 + 0.7, eY0 + 1.4, 0, 4.2, 'f', 2);                                           // frieze (its face carries the inscription)
  P.quad(M.savFrieze, [-6.2, eY0 + 0.74, 4.215], [6.2, eY0 + 0.74, 4.215], [6.2, eY0 + 1.36, 4.215], [-6.2, eY0 + 1.36, 4.215], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.box(M.white, -6.4, 6.4, eY0 + 1.4, eY0 + 1.4 + 0.05, 0, 4.2, 'f', 2);
  P.box(M.white, -6.7, 6.7, eY0 + 1.4, eY0 + 1.75, 0, 4.7, '', 2);                                          // cornice (projects)
  const yb = eY0 + 1.75, yp = yb + 2.1;
  P.fan(M.yellow, [[-6.5, yb, 4.65], [6.5, yb, 4.65], [0, yp, 4.65]], [0, 0, 1], (p) => [p[0], p[1]]);      // tympanum
  P.beam(M.white, [[-6.9, yb - 0.05, 4.7], [0, yp + 0.12, 4.7]], 0.7, 0.4, [0, 0, 1], 1); P.beam(M.white, [[0, yp + 0.12, 4.7], [6.9, yb - 0.05, 4.7]], 0.7, 0.4, [0, 0, 1], 1);
  P.quad(M.zinc, [-6.8, yb, 4.6], [0, yp + 0.1, 4.6], [0, yp + 0.1, 0], [-6.8, yb, 0], [-0.31, 0.95, 0], [[0, 0], [7, 0], [7, 4], [0, 4]]); P.quad(M.zinc, [0, yp + 0.1, 4.6], [6.8, yb, 4.6], [6.8, yb, 0], [0, yp + 0.1, 0], [0.31, 0.95, 0], [[0, 0], [7, 0], [7, 4], [0, 4]]);
  P.fan(M.white, [[-0.45, yb + 0.8, 4.67], [0.45, yb + 0.8, 4.67], [0.55, yb + 1.25, 4.67], [0, yb + 1.45, 4.67], [-0.55, yb + 1.25, 4.67]], [0, 0, 1]);             // the emblem in the tympanum
  // the entrance: brown double door in a white frame under a transom, the balcony over it between the middle columns
  P.box(M.white, -1.35, 1.35, 0.6, 4.7, 0.0, 0.2, '', 1); P.box(M.door, -1.1, 1.1, 0.6, 3.7, 0.2, 0.3, '', 1); P.quad(M.glassGround, [-1.05, 3.75, 0.31], [1.05, 3.75, 0.31], [1.05, 4.55, 0.31], [-1.05, 4.55, 0.31], [0, 0, 1], [[0.05, 0.4], [0.95, 0.4], [0.95, 0.8], [0.05, 0.8]]);
  P.box(M.white, -1.9, 1.9, 5.2, 5.4, 0, 1.2, '', 1); for (const sx of [-1.4, 1.4]) P.box(M.white, sx - 0.14, sx + 0.14, 4.7, 5.2, 0, 1.0, '', 1);
  P.quad(M.railBal, [-1.9, 5.4, 1.2], [1.9, 5.4, 1.2], [1.9, 6.35, 1.2], [-1.9, 6.35, 1.2], [0, 0, 1], [[0, 0], [1.9, 0], [1.9, 1], [0, 1]]);
  P.quad(M.railBal, [-1.9, 5.4, 1.2], [-1.9, 5.4, 0], [-1.9, 6.35, 0], [-1.9, 6.35, 1.2], [-1, 0, 0], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]); P.quad(M.railBal, [1.9, 5.4, 0], [1.9, 5.4, 1.2], [1.9, 6.35, 1.2], [1.9, 6.35, 0], [1, 0, 0], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
  P.pop();

  // ---- courtyard: lamp posts, benches, the fountain basin, the bust and the tomb
  P.ranged(220, () => {
    const lamp = (x, z) => { P.col(M.black, x, z, 0, 0.35, 0.16, 0.12, 8, true); P.col(M.black, x, z, 0.35, 3.4, 0.06, 0.045, 8, false); P.box(M.black, x - 0.18, x + 0.18, 3.4, 3.5, z - 0.18, z + 0.18, '', 1);
      for (const [dx, dz] of [[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]]) P.box(M.white, x + dx - 0.07, x + dx + 0.07, 3.5, 3.95, z + dz - 0.07, z + dz + 0.07, '', 1);
      P.cyl(M.black, [x, 3.95, z], [x, 4.15, z], 0.14, 0.02, 6, true); colliders.cyls.push({ x, z, r: 0.2 }); };
    for (const [x, z] of [[-6.5, -3.5], [-6.5, -18.5], [-3, -27], [2, 8], [14, 6], [33, 5], [-8, 22]]) lamp(x, z);
    const bench = (x, z, rot) => { P.push(x, 0, z, rot); P.box(M.timber, -0.9, 0.9, 0.42, 0.48, -0.25, 0.25, '', 1); P.box(M.timber, -0.9, 0.9, 0.55, 0.9, -0.27, -0.23, '', 1); for (const sx of [-0.8, 0.8]) P.box(M.black, sx - 0.04, sx + 0.04, 0, 0.9, -0.3, 0.26, '', 1); P.pop(); colliders.boxes.push({ x, z, w: 1.9, d: 0.7, rot }); };
    const bR = Math.PI / 2;
    for (const z of [-17, -6.5, 5]) bench(-4.2, z, -bR);
    // fountain: a round granite bowl on a drum, a small jet
    const fx = 6, fz = -5;
    P.col(M.granite, fx, fz, 0, 0.5, 0.7, 0.7, 14, true); P.col(M.granite, fx, fz, 0.5, 0.85, 1.25, 1.05, 14, true); P.col(M.metal, fx, fz, 0.85, 1.7, 0.03, 0.01, 4, true);
    colliders.cyls.push({ x: fx, z: fz, r: 1.3 });
    // the bust on a stone pedestal
    const bx = -3.3, bz = 3.6, FM = figureMats(ctx), bk = FM.keys('bronze', 'bronze'), bf = bustFig();
    P.box(M.granite, bx - 0.55, bx + 0.55, 0, 0.3, bz - 0.55, bz + 0.55, 'b', 1.5); P.box(M.granite, bx - 0.36, bx + 0.36, 0.3, 1.7, bz - 0.36, bz + 0.36, '', 1.5); P.box(M.granite, bx - 0.42, bx + 0.42, 1.7, 1.8, bz - 0.42, bz + 0.42, '', 1.5);
    P.push(bx, 1.8, bz, -Math.PI / 2);
    for (const [key, g] of Object.entries(bf.geos)) P.geo(bk[key] || bk.main, g, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 1.2);
    P.pop();
    colliders.cyls.push({ x: bx, z: bz, r: 0.7 });
  });
  P.pop();
  const ph = K.ctx.physics;
  if (ph) {
    for (const e of colliders.edges) { const w = savWorld((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2); ph.addBox(w.x, w.z, e.len + 0.3, 0.6, SAV.rot + Math.atan2(-(e.b[1] - e.a[1]), e.b[0] - e.a[0]), 0, 12); }
    for (const c of colliders.cols) { const w = savWorld(PORTICO.x + c.z, PORTICO.z - c.u); ph.addCylinder(w.x, w.z, 0.55, 0, 9); }
    for (const c of colliders.cyls) { const w = savWorld(c.x, c.z); ph.addCylinder(w.x, w.z, c.r, 0, 3); }
    for (const b of colliders.boxes) { const w = savWorld(b.x, b.z); ph.addBox(w.x, w.z, b.w, b.d, SAV.rot + b.rot, 0, 1.0); }
    { const w = savWorld(PORTICO.x + 2.5, PORTICO.z); ph.addWalkBox(w.x, w.z, 12.8, 5.0, SAV.rot + Math.PI / 2, 0.6); }
    { const w = savWorld(PORTICO.x + 5.6, PORTICO.z); for (const it of ph.addStairs(w.x, w.z, 12.8, 1.2, SAV.rot - Math.PI / 2, 0, 0.6, 3)) it.sticky = true; }
  }
  { const w = savWorld(PORTICO.x + 3, PORTICO.z), ct = savWorld(-30, -10), pp = savWorld(PORTICO.x + 18, PORTICO.z);
    K.svc.monuments.push({ id: 'w31065483', name: 'Дом ветеранов сцены имени М. Г. Савиной', x: ct.x, z: ct.z, h: 12 });
    K.svc.photoSpots.push({ x: pp.x, z: pp.z, yaw: Math.round(L.yawToward(pp.x, pp.z, w.x, w.z)), name: 'Дом ветеранов сцены: портик с колоннами' }); }
  void r;
}
