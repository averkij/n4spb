// landmarksKamennyChurch/church.js - the CHURCH of the Nativity of John the Baptist (Felten 1776-78, neo-Gothic, OSM r10254216 / w28055978): the cross-plan red brick body (nave 9.5 m wide, two cross arms
// 18.6 m over, altar wall flat), the plinth in pink plaster, the white three-tier cornice stepping over square corner piers, eight green copper pinnacles, the low hipped green copper roof, the central DRUM
// (terracotta plaster, eight lancet windows between white strips, a grey scale cone and a gilded cross), the west TOWER (brick shaft, two tapering pink buttresses, the pointed door in a white surround under a
// black iron canopy with lamps, the OPEN belfry with four brick piers, two bells and an iron balustrade, the grey scale pyramid and the cross), the two round bays beside the tower, 14 lancet windows with amber bars and
// iron grilles, the plaques (white name plate, black "Памятник архитектуры", the Pushkin plaque of OSM n1158861685), the porch platform and the blind area of limestone.  Frame CH (frame.js).
// Heights [E from the photos C02 C03 C05 C08 C13]: plinth 1.2, wall 5.6, cornice 6.5, roof to 8.5, drum 8.5-11.4, cone apex 16.4 + cross to 18.4; tower shaft 11.2, belfry 11.45-14.9, spire apex 21.3 + cross to 23.
// Collectors: K.P = the shell (seen from far, LOD 1100 m), K.N = the near detail (windows, frames, plaques, bells, rails, pinnacles: LOD 220 m).
import { CH, PL } from './frame.js';
import { band, ringEdges, rectPath } from './kit.js';
import { tube, frustum, lathe, ball, cross, planeShape, tbox, frameRing, solid, shapeOf } from './geo.js';
import { hipRoof } from './roofs.js';
import { ATLAS } from './art.js';
import { lancetPts, lancetWindow, pierRing, offsetRect, onAll, faceRot, TAU } from './util.js';
import { addPolyColliders } from '../lib/massing.js';

const BELL = [[0.34, 0], [0.33, 0.1], [0.25, 0.32], [0.18, 0.52], [0.1, 0.7], [0.06, 0.8], [0.0, 0.84]];

export function build(K) {
  const { ctx, M, P, N, svc } = K, Ps = [P, N], ph = ctx.physics;
  const { naveHW: hw, armHW: aw, armE, armW, eastZ, westZ, plinthH, wallTop, cornTop } = PL;
  P.push(CH.ox, 0, CH.oz, CH.rot); N.push(CH.ox, 0, CH.oz, CH.rot);

  // ---------------------------------------------------------------- plan
  const R0 = [[-hw, eastZ], [hw, eastZ], [hw, armE], [aw, armE], [aw, armW], [hw, armW], [hw, westZ], [-hw, westZ], [-hw, armW], [-aw, armW], [-aw, armE], [-hw, armE]];
  const PR = pierRing(R0, PL.pier, PL.pierOut);
  const edges = ringEdges({ o: PR.ring.flat(), h: [] });
  const westMid = (e) => Math.abs((e.a[0] + e.b[0]) / 2) < 4.4 && (e.a[1] + e.b[1]) / 2 > westZ - 0.1;     // the middle of the west wall: tower and bays stand in front
  const notWest = (e) => !westMid(e);

  // ---------------------------------------------------------------- walls (brick), plinth, string course, cornice
  band(P, edges, plinthH, wallTop, 0, { front: M.brick }, { uvs: 2.08 });
  band(P, edges, 0, plinthH, 0.06, { front: M.pink, top: M.pink }, { draw: notWest, uvs: 3 });
  band(P, edges, plinthH, plinthH + 0.2, 0.14, { front: M.white, top: M.white, under: M.white }, { draw: notWest });
  band(P, edges, wallTop, wallTop + 0.2, 0.1, { front: M.white, top: M.white, under: M.white }, { draw: notWest });
  band(P, edges, wallTop + 0.2, wallTop + 0.55, 0.36, { front: M.white, top: M.white, under: M.white }, { draw: notWest });
  band(P, edges, wallTop + 0.55, cornTop, 0.6, { front: M.white, top: M.white, under: M.white }, { draw: notWest });
  band(P, edges, 0, 0.1, 0.95, { front: M.stone, top: M.stone }, { draw: notWest, uvs: 3 });            // the limestone blind area round the plinth

  // ---------------------------------------------------------------- the roof: a low hip over the cross, green sheet copper
  const eave = offsetRect(R0, 0.62);
  hipRoof(P, M.roofGreen, eave, cornTop, 0.42, { cap: 2.0, step: 2.5, tile: 2.4 });

  // ---------------------------------------------------------------- pinnacles at the eight convex corners (green copper, 2.6 m)
  for (const c of PR.corners) {
    const x = c.k[0] + (c.n1[0] + c.n2[0]) * 0.27, z = c.k[1] + (c.n1[1] + c.n2[1]) * 0.27;
    frustum(N, M.roofGreen, x, z, cornTop, cornTop + 0.4, 4, 0.58, 0.47, Math.PI / 4, 1, 0.3);
    frustum(N, M.roofGreen, x, z, cornTop + 0.4, cornTop + 2.7, 4, 0.47, 0, Math.PI / 4, 1, 1.4);
  }

  // ---------------------------------------------------------------- drum, cone, cross (centre of the crossing)
  const dcx = 0, dcz = PL.drumZ;
  tube(P, M.roofGreen, dcx, dcz, cornTop + 1.7, cornTop + 2.3, 3.0, 2.7, 24, 4, 0.5);
  tube(P, M.drum, dcx, dcz, cornTop + 2.0, 11.4, 2.6, 2.6, 32, 1, 1);
  for (let k = 0; k < 8; k++) {
    const t = k * Math.PI / 4;
    onAll(Ps, dcx + Math.sin(t) * 2.612, 0, dcz + Math.cos(t) * 2.612, t, () => {
      lancetWindow(N, M, 0, 9.0, 0.95, 2.1, { mat: M.winDrum, fw: 0.1, depth: 0.05, sill: false });
    });
    const t2 = t + Math.PI / 8;
    onAll(Ps, dcx + Math.sin(t2) * 2.625, 0, dcz + Math.cos(t2) * 2.625, t2, () => { P.box(M.white, -0.17, 0.17, cornTop + 2.0, 11.4, -0.06, 0.04); });
  }
  tube(P, M.white, dcx, dcz, 11.4, 11.56, 2.72, 3.1, 24, 4, 0.2, { capTop: M.white });
  frustum(P, M.scales, dcx, dcz, 11.56, 16.4, 24, 3.1, 0.1, 0, 0.7, 4.1);
  ball(P, M.gold, dcx, 16.45, dcz, 0.2, 10); cross(P, M.gold, dcx, 16.55, dcz, 1.8, CH.rot * 0);

  // ---------------------------------------------------------------- the TOWER
  const tcz = (6.5 + PL.towerFront) / 2, thw = PL.towerHW, tf = PL.towerFront, tb = 6.5, SH = 12.4, BT = 16.0, AP = 22.8;   // shaft top, belfry top, spire apex
  // shaft (brick): front, two sides, back above the roof
  P.quad(M.brick, [-thw, 0, tf], [thw, 0, tf], [thw, SH, tf], [-thw, SH, tf], [0, 0, 1], [[-thw / 2.08, 0], [thw / 2.08, 0], [thw / 2.08, SH / 2.08], [-thw / 2.08, SH / 2.08]]);   // down to the ground: the door decal must not float over a hole (its outline crossed the leaves)
  for (const s of [-1, 1]) {
    const x = s * thw, nx = s;
    P.quad(M.brick, [x, plinthH, westZ], [x, plinthH, tf], [x, 6.5, tf], [x, 6.5, westZ], [nx, 0, 0], [[westZ / 2.08, plinthH / 2.08], [tf / 2.08, plinthH / 2.08], [tf / 2.08, 6.5 / 2.08], [westZ / 2.08, 6.5 / 2.08]]);
    P.quad(M.brick, [x, 6.5, tb], [x, 6.5, tf], [x, SH, tf], [x, SH, tb], [nx, 0, 0], [[tb / 2.08, 6.5 / 2.08], [tf / 2.08, 6.5 / 2.08], [tf / 2.08, SH / 2.08], [tb / 2.08, SH / 2.08]]);
  }
  P.quad(M.brick, [thw, 6.5, tb], [-thw, 6.5, tb], [-thw, SH, tb], [thw, SH, tb], [0, 0, -1], [[thw / 2.08, 6.5 / 2.08], [-thw / 2.08, 6.5 / 2.08], [-thw / 2.08, SH / 2.08], [thw / 2.08, SH / 2.08]]);
  // pink plinth + white string course of the tower (three sides), the green copper band under the belfry
  for (const s of [-1, 1]) {                                                         // the door niche between the buttresses has no plinth: only the corner strips and the sides
    const a = s * (thw + 0.06), b = s * 1.7;
    P.box(M.pink, Math.min(a, b), Math.max(a, b), 0, plinthH, westZ, tf + 0.06, 'kb', 3);
    P.box(M.white, Math.min(s * (thw + 0.14), b), Math.max(s * (thw + 0.14), b), plinthH, plinthH + 0.2, westZ, tf + 0.14, 'kb');
  }
  P.box(M.roofGreen, -thw - 0.1, thw + 0.1, SH, SH + 0.25, tb - 0.1, tf + 0.1, 'b');
  // the two tapering buttresses at the front corners (pink plaster): ground footprint x 1.85..3.5, front z 11.8; the top merges into the shaft at y 5.4
  const bt = 5.4;
  for (const s of [-1, 1]) {
    const xi = s * 1.85, xo = s * 3.5, xs = s * thw, zf0 = 11.8, zr = 8.4;
    const n = s;
    P.quad(M.pink, [xi, 0, zf0], [xo, 0, zf0], [xs, bt, tf], [xi, bt, tf], [0, 0.17, 1], [[0, 0], [1.4, 0], [0.4, 1.6], [0, 1.6]]);                                    // front (slanted)
    P.quad(M.pink, [xo, 0, zf0], [xo, 0, zr], [xs, bt, zr], [xs, bt, tf], [n, 0.3, 0], [[0, 0], [1.2, 0], [1.2, 1.6], [0.4, 1.6]]);                              // outer side
    P.quad(M.pink, [xi, 0, zr], [xi, 0, zf0], [xi, bt, tf], [xi, bt, zr], [-n, 0, 0], [[0, 0], [1.2, 0], [1.2, 1.6], [0, 1.6]]);                                  // inner side (toward the door)
    P.quad(M.pink, [xi, bt, tf], [xs, bt, tf], [xs, bt, zr], [xi, bt, zr], [0, 1, 0], [[0, 0], [0.3, 0], [0.3, 1], [0, 1]]);
  }
  // porch platform + step (limestone slabs)
  P.box(M.stone, -4.6, 4.6, 0, 0.34, tf - 0.3, 13.6, 'b', 3);
  P.box(M.stone, -4.95, 4.95, 0, 0.17, 13.6, 14.15, 'b', 3);
  // belfry: four brick piers, floor, ceiling beam deck
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx > 0 ? 1.2 : -thw, x1 = sx > 0 ? thw : -1.2, z0 = sz > 0 ? tf - 1.0 : tb, z1 = sz > 0 ? tf : tb + 1.0;
    tbox(P, M.brick, x0, x1, SH + 0.25, BT, z0, z1, 2.08, 2.08, 'b');
  }
  P.box(M.wood, -thw, thw, BT - 0.35, BT, tb, tf, 't');
  P.box(M.wood, -thw + 0.05, thw - 0.05, SH + 0.2, SH + 0.32, tb + 0.05, tf - 0.05, 'b');
  // iron balustrades in the four open bays (1.0 m high, balusters every 0.19 m, a quatrefoil panel in the middle) and two bells on a beam
  const FL = SH + 0.32, RH = 1.0;
  const rail = (x0, x1, z, along) => {
    const len = x1 - x0, n = Math.round(len / 0.19), xc = (x0 + x1) / 2;
    const bx = (a0, a1, y0, y1, c0, c1) => (along === 'x' ? N.box(M.iron, a0, a1, y0, y1, c0, c1) : N.box(M.iron, c0, c1, y0, y1, a0, a1));
    bx(x0, x1, FL + RH - 0.06, FL + RH, z - 0.035, z + 0.035); bx(x0, x1, FL + 0.08, FL + 0.14, z - 0.03, z + 0.03);
    for (let i = 0; i <= n; i++) { const x = x0 + len * i / n; bx(x - 0.014, x + 0.014, FL + 0.14, FL + RH - 0.06, z - 0.014, z + 0.014); }
    bx(xc - 0.17, xc + 0.17, FL + 0.3, FL + 0.7, z - 0.025, z + 0.025);
    bx(xc - 0.025, xc + 0.025, FL + 0.14, FL + RH - 0.06, z - 0.03, z + 0.03); bx(xc - 0.17, xc + 0.17, FL + 0.49, FL + 0.51, z - 0.03, z + 0.03);
  };
  rail(-1.2, 1.2, tf - 0.12, 'x'); rail(-1.2, 1.2, tb + 0.12, 'x'); rail(tb + 1.0, tf - 1.0, thw - 0.12, 'z'); rail(tb + 1.0, tf - 1.0, -thw + 0.12, 'z');
  N.box(M.wood, -thw + 0.1, thw - 0.1, BT - 1.0, BT - 0.78, tcz - 0.11, tcz + 0.11);
  for (const bx of [-0.6, 0.6]) { N.box(M.wood, bx - 0.05, bx + 0.05, BT - 1.55, BT - 1.0, tcz - 0.05, tcz + 0.05); lathe(N, M.bell, 'kcbell', BELL, bx, BT - 2.4, tcz, 1.1, 1.1, 14, 7); }
  // the spire: skirt + four-sided scale pyramid, gilded ball and cross
  const sq = Math.SQRT2, hw0 = thw + 0.4, hw1 = thw + 0.05;
  frustum(P, M.scales, 0, tcz, BT, BT + 0.65, 4, hw0 * sq, hw1 * sq, Math.PI / 4, 4.2, 0.6);
  frustum(P, M.scales, 0, tcz, BT + 0.65, AP, 4, hw1 * sq, 0, Math.PI / 4, 3.6, 5);
  ball(P, M.gold, 0, AP + 0.05, tcz, 0.22, 10); cross(P, M.gold, 0, AP + 0.15, tcz, 1.9, 0);

  // ---------------------------------------------------------------- the round bays beside the tower: brick, pink plinth, white rings, a green cone
  for (const s of [-1, 1]) {
    const cx = s * PL.bayX, cz = westZ, r = PL.bayR;
    tube(P, M.pink, cx, cz, 0, plinthH, r + 0.06, r + 0.06, 14, 3, 0.5, { capTop: M.white });
    tube(P, M.white, cx, cz, plinthH, plinthH + 0.2, r + 0.14, r + 0.14, 14, 3, 0.1, { capTop: M.white });
    tube(P, M.brick, cx, cz, plinthH + 0.2, wallTop, r, r, 14, 4, 1.8);
    tube(P, M.white, cx, cz, wallTop, wallTop + 0.2, r + 0.1, r + 0.1, 14, 3, 0.1, { capTop: M.white, capBot: M.white });
    tube(P, M.white, cx, cz, wallTop + 0.2, wallTop + 0.55, r + 0.36, r + 0.36, 14, 3, 0.1, { capTop: M.white, capBot: M.white });
    tube(P, M.white, cx, cz, wallTop + 0.55, cornTop, r + 0.6, r + 0.6, 14, 3, 0.1, { capTop: M.white, capBot: M.white });
    frustum(P, M.roofGreen, cx, cz, cornTop, cornTop + 1.7, 14, r + 0.55, 0.05, 0, 1.2, 1.2);
  }

  // ---------------------------------------------------------------- the main door in the tower front (white pointed surround, iron canopy, lamps, small cross)
  onAll(Ps, 0, 0, tf, 0, () => {
    lancetWindow(N, M, 0, 0.34, 2.3, 4.4, { mat: M.door, fw: 0.33, depth: 0.12, sill: false });
    const outer = lancetPts(0, 0.3, 3.36, 4.75), inner = lancetPts(0, 0.3, 3.2, 4.75 - 0.16);
    frameRing(N, M.iron, outer, inner, 0.14, 0.5);                                              // the black iron canopy: an open arch frame, 0.6 m deep
    for (const s of [-1, 1]) { N.box(M.white, s * 1.74 - 0.08, s * 1.74 + 0.08, 2.62, 2.96, 0.42, 0.58); frustum(N, M.iron, s * 1.74, 0.5, 2.96, 3.34, 6, 0.2, 0.04, 0, 1, 1); N.box(M.iron, s * 1.74 - 0.03, s * 1.74 + 0.03, 2.5, 2.62, 0.47, 0.53); }
    N.box(M.iron, -0.1, 0.1, 3.55, 3.95, 0.33, 0.53); N.box(M.white, -0.08, 0.08, 3.62, 3.88, 0.35, 0.51);       // the hanging lantern
    cross(N, M.iron, 0, 4.9, 0.1, 0.62, 0);
    // the small icon above the leaves (atlas)
    const [u0, v0, u1, v1] = ATLAS.icon; N.quad(M.plaques, [-0.15, 3.12, 0.15], [0.15, 3.12, 0.15], [0.15, 3.67, 0.15], [-0.15, 3.67, 0.15], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  });

  // ---------------------------------------------------------------- windows (14 lancets + 1 door) on every face; icons between the arm windows
  const W = (mx, mz, nx, nz, list, fn) => { for (const a of list) onAll(Ps, nx === 0 ? a : mx, 0, nx === 0 ? mz : a, faceRot(nx, nz), () => fn(a)); };
  const win = () => lancetWindow(N, M, 0, 1.55, 1.15, 3.55);
  for (const mx of [-2.9, 0, 2.9]) onAll(Ps, mx, 0, eastZ, faceRot(0, -1), win);                                      // altar wall
  onAll(Ps, 6.8, 0, armE, faceRot(0, -1), win); onAll(Ps, -6.8, 0, armE, faceRot(0, -1), win);                         // arm east returns
  for (const mz of [-3.4, 0.2]) { onAll(Ps, aw, 0, mz, faceRot(1, 0), win); onAll(Ps, -aw, 0, mz, faceRot(-1, 0), win); }  // arm outer faces
  for (const mz of [3.4, 5.9]) { onAll(Ps, hw, 0, mz, faceRot(1, 0), win); onAll(Ps, -hw, 0, mz, faceRot(-1, 0), win); }  // nave west parts
  onAll(Ps, -7.0, 0, armW, faceRot(0, 1), win);                                                                    // north arm west return: window
  onAll(Ps, 7.0, 0, armW, faceRot(0, 1), () => lancetWindow(N, M, 0, 0.17, 1.5, 3.4, { mat: M.door, fw: 0.22, depth: 0.25, dz: 0.21, sill: false }));   // south arm west return: a door
  const icon = (x, z, nx, nz) => onAll(Ps, x, 0, z, faceRot(nx, nz), () => { const [u0, v0, u1, v1] = ATLAS.icon; N.quad(M.plaques, [-0.25, 2.55, 0.02], [0.25, 2.55, 0.02], [0.25, 3.35, 0.02], [-0.25, 3.35, 0.02], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); });
  icon(aw, -1.6, 1, 0); icon(-aw, -1.6, -1, 0);

  // ---------------------------------------------------------------- plaques (reserved in the facade label registry)
  const labels = ctx.services.labels;
  const plate = (rect, mx, y, mz, nx, nz, w, h, kind, tilt = 0) => onAll(Ps, mx, 0, mz, faceRot(nx, nz), () => {
    const wp = CH.W(mx, mz), wn = { x: Math.sin(CH.rot + faceRot(nx, nz)), z: Math.cos(CH.rot + faceRot(nx, nz)) };
    if (labels && !labels.reserve('r10254216', wp.x, y, wp.z, w, h, wn.x, wn.z, kind)) return;
    const [u0, v0, u1, v1] = rect, z = 0.03;
    N.quad(M.plaques, [-w / 2, y - h / 2, z + tilt], [w / 2, y - h / 2, z + tilt], [w / 2, y + h / 2, z - tilt], [-w / 2, y + h / 2, z - tilt], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    svc.plaques.push({ kind, x: wp.x, z: wp.z, y });
  });
  // white name plate on the left buttress (front is slanted: the plate leans with it); black plaque on the south nave wall; Pushkin plaque (OSM n1158861685) beside the south door
  onAll(Ps, -2.3, 0, 11.37, 0, () => {
    const [u0, v0, u1, v1] = ATLAS.white;
    if (!labels || labels.reserve('r10254216', CH.W(-2.3, 11.37).x, 2.4, CH.W(-2.3, 11.37).z, 0.5, 0.75, Math.sin(CH.rot), Math.cos(CH.rot), 'plaque')) {
      N.quad(M.plaques, [-0.25, 2.03, 0.115], [0.25, 2.03, 0.115], [0.25, 2.78, -0.012], [-0.25, 2.78, -0.012], [0, 0.17, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      svc.plaques.push({ kind: 'name', x: CH.W(-2.3, 11.37).x, z: CH.W(-2.3, 11.37).z, y: 2.4 });
    }
  });
  plate(ATLAS.black, hw, 2.2, 7.05, 1, 0, 0.55, 0.82, 'plaque');
  plate(ATLAS.pushkin, 5.55, 1.95, armW, 0, 1, 0.62, 0.5, 'plaque');

  // ---------------------------------------------------------------- downpipes (rust-copper) in the four concave corners
  for (const [x, z] of [[hw, armE], [hw, armW], [-hw, armW], [-hw, armE]]) N.col(M.pipe, x + Math.sign(x) * 0.1, z + (z === armE ? -0.1 : 0.1), 0.2, wallTop + 0.4, 0.045, 0.045, 7);

  // ---------------------------------------------------------------- colliders: the pier ring, the tower, the buttresses, the round bays
  const wp = PR.ring.flatMap(([x, z]) => { const q = CH.W(x, z); return [q.x, q.z]; });
  addPolyColliders(ctx, { o: wp, h: [] }, 0, 12, 0.5);
  CH.box(ph, 0, tcz, 2 * thw, tf - tb, 0, 0, 26);
  for (const s of [-1, 1]) { CH.box(ph, s * 2.7, 10.1, 1.6, 3.6, 0, 0, 6); CH.cyl(ph, s * PL.bayX, westZ, PL.bayR + 0.1, 0, 8); }
  CH.walk(ph, 0, 11.95, 9.2, 3.5, 0, 0.34); CH.walk(ph, 0, 13.88, 9.9, 0.55, 0, 0.17);

  P.pop(); N.pop();
  svc.church = { x: CH.ox, z: CH.oz, tris: 0 };
}
