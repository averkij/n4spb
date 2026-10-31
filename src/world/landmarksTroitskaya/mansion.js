// landmarksTroitskaya/mansion.js - the KSHESINSKAYA MANSION (A. I. von Gogen 1904-06, Kronverksky pr. 1 / ul. Kuybysheva 2-4), the 1957 link block and the Brant mansion (R.-F. Meltser 1909):
// today one museum footprint (OSM w43679385, State Museum of Political History of Russia).  Dossier docs/research/troitskaya.md section 3, photos refs/troitskaya 30 31 33.
// Frame KS (frame.js): origin = vertex 18, local x = s along Kronverksky to the SSE, local z = -t (t = depth behind the Kronverksky face).  Volumes in (s, t), measured on the footprint:
//   K2  the two-storey block s 0..13.3, t 0..25.7 (cornice 11.8 m, attic 12.9) + a north annex; the octagonal TURRET at (11.64, 1.2) r 2.6 in the corner of the set-back;
//   KW  the one-storey reception wing s 13.3..32, t 5.6..22.4 (cornice 6.3, roof terrace) with the WINTER GARDEN block at its south end (glazed half-cylinder);
//   LINK (1957) s -15..14, t 26..55; REAR s -26..7, t 53..87; BRANT s 7..33, t 65..95 (white, two round bays).
// Materials: red granite base, grey rock-faced granite, pale yellow glazed brick, dark blue majolica frieze, grey metal.  The Lenin balcony on the Kronverksky face; plaques with real text.
// Fences: Kronverksky = grey iron panels between round granite posts on a red granite base (OSM w85426960, w85427334), Kuybysheva = brick piers and wall with grilles (w85427333).  No flags.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as G from './geo.js';
import { KS, pairs, planFence, panelQuad } from './frame.js';
import { walls, zones, baySheet, slabRing, capRing, rect, onSeg } from './prism.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { plantTrees } from './trees.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
const st = (s, t) => [s, -t];                                       // (s, t) -> local (x, z)
const HK = { base: 1.0, gran: 4.4, frieze: 10.3, corn: 11.5, attic: 12.9 };
const HW = { base: 0.8, gran: 2.3, frieze: 5.4, corn: 6.0, par: 7.0, wg: 8.0 };
const TUR = { s: 11.64, t: 1.2, r: 2.6 };

/** a mansion window: sheet + grey granite lintel with ears + sill */
function kwindow(P, M, u, y0, w, h, mat = null) {
  G.pane(P, mat || M.kwin, u - w / 2, u + w / 2, y0, y0 + h, 0.05);
  P.box(M.granKFlat, u - w / 2 - 0.25, u + w / 2 + 0.25, y0 + h, y0 + h + 0.32, 0, 0.14, 'kb');
  P.box(M.granKFlat, u - w / 2 - 0.14, u - w / 2, y0, y0 + h, 0, 0.08, 'kb'); P.box(M.granKFlat, u + w / 2, u + w / 2 + 0.14, y0, y0 + h, 0, 0.08, 'kb');
  P.box(M.granKFlat, u - w / 2 - 0.2, u + w / 2 + 0.2, y0 - 0.14, y0, 0, 0.16, 'k');
}
/** the wall zones of the two-storey block */
const k2zones = (P, M, len) => zones(P, len, [[0, HK.base, M.redGranite, 2], [HK.base, HK.gran, M.granK, 2, 1.4], [HK.gran, HK.frieze, M.brick, 1, 0.5], [HK.frieze, HK.corn, M.frieze, 2.2, 1.2], [HK.corn, HK.attic, M.brick, 1, 0.5]]);
const kwZones = (P, M, len, top = HW.par) => zones(P, len, [[0, HW.base, M.redGranite, 2], [HW.base, HW.gran, M.granK, 2, 1.4], [HW.gran, HW.frieze, M.brick, 1, 0.5], [HW.frieze, HW.corn, M.frieze, 2.2, 0.6], [HW.corn, top, M.brick, 1, 0.5]]);

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksTroitskaya] mansion/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(KS.x, 0, KS.z, KS.rot);
  stage('k2', () => k2(K));
  stage('turret', () => turret(P, M));
  stage('wing', () => wing(P, M));
  stage('link', () => linkAndBrant(P, M));
  P.pop();
  stage('grounds', () => grounds(K));
  stage('colliders', () => { const rec = L.buildingById('w43679385'); if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 14, 0.9); });
  const c = KS.W(11.6, -4);
  K.svc.monuments.push({ id: 'w43679385', name: 'Особняк Кшесинской (Музей политической истории России)', x: KS.W(8, -8).x, z: KS.W(8, -8).z, h: 17 });
  K.svc.entrances.push({ x: KS.W(-9, 1.5).x, z: KS.W(-9, 1.5).z, rotY: KS.faceRot(0, 1), kind: 'museum gate' });
  K.svc.crowd.push({ id: 'kshesinskaya-balcony', kind: 'photo', x: c.x, z: c.z, r: 3, n: 8 });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the two-storey block
function k2(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const ring = [st(0, 0), st(13.3, 0), st(13.3, 25.7), st(6.2, 25.7), st(-0.1, 25.7), st(-0.1, 19.4), st(-3.8, 19.4), st(-3.8, 7.5), st(0, 7.5)];
  const labels = ctx.services.labels;
  walls(P, ring, (len, e) => {
    k2zones(P, M, len);
    const face = (p, q) => onSeg(e, st(...p), st(...q));
    if (face([0, 0], [13.3, 0])) {
      // Kronverksky face (photo 33): ground floor windows in the granite, first floor double windows, the balcony door
      for (const u of [1.4, 3.2, 5.0]) kwindow(P, M, u, 1.9, 1.0, 2.3);
      for (const u of [6.9, 8.3]) kwindow(P, M, u, 1.9, 0.95, 2.3);
      for (const u of [1.3, 2.3, 4.0, 5.0]) kwindow(P, M, u, 6.3, 0.8, 2.7);
      kwindow(P, M, 7.6, 6.05, 2.4, 3.1, M.kwin3);
      balcony(P, M, 6.1, 9.1, 5.85, 1.35);
      // majolica panel under the balcony and the two memorial plaques
      G.pane(P, M.cobalt, 6.3, 8.9, 4.5, 5.2, 0.03);
      const plaque = (u, text) => {
        const w = 1.05, h = 1.9, y = 1.75, p = KS.W(u, 0.06);
        if (labels && !labels.reserve('w43679385', p.x, y + h / 2, p.z, w, h, Math.sin(KS.rot), Math.cos(KS.rot), 'plaque')) return;
        P.box(M.graniteDarkK, u - w / 2, u + w / 2, y, y + h, 0, 0.05, 'kb'); G.pane(P, M.text(text, { w: 256, h: 448, fg: '#d9b23c' }), u - w / 2 + 0.05, u + w / 2 - 0.05, y + 0.05, y + h - 0.05, 0.062);
      };
      plaque(6.0, 'В ЭТОМ ЗДАНИИ\nВ МАРТЕ — ИЮНЕ\n1917 ГОДА\nПОМЕЩАЛИСЬ\nЦЕНТРАЛЬНЫЙ\nИ ПЕТРОГРАДСКИЙ\nКОМИТЕТЫ\nРСДРП(б)');
      plaque(9.25, 'С БАЛКОНА\nЭТОГО ДОМА\nВ АПРЕЛЕ — ИЮЛЕ\n1917 ГОДА\nНЕОДНОКРАТНО\nВЫСТУПАЛ\nВ. И. ЛЕНИН');
      const sp = KS.W(0.95, 0.06);
      if (!labels || labels.reserve('w43679385', sp.x, 1.95, sp.z, 1.3, 0.7, Math.sin(KS.rot), Math.cos(KS.rot), 'plaque')) {
        P.box(M.dark, 0.3, 1.6, 1.6, 2.3, 0, 0.04, 'kb'); G.pane(P, M.text('ГОСУДАРСТВЕННЫЙ МУЗЕЙ\nПОЛИТИЧЕСКОЙ ИСТОРИИ\nРОССИИ', { w: 384, h: 192, fg: '#e8e2d0' }), 0.34, 1.56, 1.64, 2.26, 0.052);
      }
    } else if (face([13.3, 0], [13.3, 25.7])) {
      // south side: free only for t 0..5.6 (the wing joins behind) and above the wing roof
      for (const u of [1.6, 3.6]) { if (u < 5.2) { kwindow(P, M, u, 1.9, 0.95, 2.3); kwindow(P, M, u, 6.3, 0.9, 2.7); } }
      for (const u of [9, 12.5, 16, 19.5, 23]) kwindow(P, M, u, 7.4, 1.0, 2.2);
    } else if (face([-3.8, 7.5], [-3.8, 19.4]) || face([0, 0], [0, 7.5])) {
      for (let u = 1.6; u < len - 1; u += 2.6) { kwindow(P, M, u, 1.9, 0.95, 2.3); kwindow(P, M, u, 6.3, 0.9, 2.7); }
    } else if (len > 5) for (let u = 1.8; u < len - 1.2; u += 3.0) kwindow(P, M, u, 6.3, 1.0, 2.7);
  });
  // the wide cornice on brackets and the attic coping
  slabRing(P, ring, HK.corn, HK.corn + 0.28, 0.95, M.metalLight);
  walls(P, ring, (len) => { for (let u = 0.8; u < len; u += 1.9) P.box(M.metal, u - 0.07, u + 0.07, HK.corn - 0.75, HK.corn, 0, 0.8, 'kt'); });
  slabRing(P, ring, HK.attic, HK.attic + 0.14, 0.12, M.granKFlat);
  capRing(P, M.roofGreen, ring, HK.attic);
}
/** the Lenin balcony: granite slab on two heavy brackets, an iron railing with rings (alpha sheet) */
function balcony(P, M, u0, u1, y, d) {
  P.box(M.granKFlat, u0, u1, y - 0.24, y, 0, d, 'k');
  for (const u of [u0 + 0.25, u1 - 0.25]) { P.box(M.granKFlat, u - 0.16, u + 0.16, y - 1.5, y - 0.24, 0, 0.35, 'k'); P.box(M.granKFlat, u - 0.16, u + 0.16, y - 0.75, y - 0.24, 0.35, d * 0.85, 'k'); }
  const r = (a, b) => P.quad(M.kfence, a, b, [b[0], y + 1.02, b[2]], [a[0], y + 1.02, a[2]], null, [[0, 0.33], [Math.hypot(b[0] - a[0], b[2] - a[2]) / 1.4, 0.33], [Math.hypot(b[0] - a[0], b[2] - a[2]) / 1.4, 1], [0, 1]]);
  r([u0, y, d - 0.04], [u1, y, d - 0.04]); r([u0 + 0.04, y, 0.05], [u0 + 0.04, y, d - 0.04]); r([u1 - 0.04, y, d - 0.04], [u1 - 0.04, y, 0.05]);
  for (const u of [u0 + 0.06, u1 - 0.06]) P.box(M.granKFlat, u - 0.1, u + 0.1, y, y + 1.12, d - 0.2, d, 'b');
}

// ------------------------------------------------------------------------------------------------ the corner turret
function turret(P, M) {
  const [cx, cz] = st(TUR.s, TUR.t), R = TUR.r, a0 = Math.PI / 8, yT = 13.3;
  const band = (y0, y1, mat, uRep, vRep, r = R) => G.frustum(P, mat, cx, cz, y0, y1, 8, r, r, a0, uRep, vRep);
  band(0, HK.base, M.redGranite, 1, 0.5); band(HK.base, HK.gran, M.granK, 1, (HK.gran - HK.base) / 1.4); band(HK.gran, 11.2, M.brick, 2, (11.2 - HK.gran) / 0.5);
  band(11.2, 12.5, M.frieze, 1, 1); band(12.5, yT, M.brick, 2, 1.6);
  // narrow windows on the faces that look at the street
  const apo = R * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const tm = a0 + (i + 0.5) * TAU / 8, nx = Math.sin(tm), nz = Math.cos(tm);
    if (nz < 0.2 && nx < 0.2) continue;                                   // faces buried in the house
    P.push(cx + nx * apo, 0, cz + nz * apo, tm);
    kwindow(P, M, 0, 1.9, 0.7, 2.3); kwindow(P, M, 0, 6.3, 0.62, 2.7); kwindow(P, M, 0, 9.6, 0.5, 1.2);
    P.pop();
  }
  // the wide flat eave, the belvedere of brick piers with a metal net, the white dome, a bare rod (no flag)
  G.frustum(P, M.metalLight, cx, cz, yT, yT + 0.25, 8, R + 1.25, R + 1.25, a0, 1, 1, { capTop: M.metalLight });
  P.cap(M.metal, G.ngon(8, R + 1.25, a0, cx, cz), yT, false, 3);
  const rb = 2.05;
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, px = cx + Math.sin(t) * rb, pz = cz + Math.cos(t) * rb;
    P.push(px, 0, pz, t); P.box(M.brickFlat, -0.22, 0.22, yT + 0.25, yT + 1.25, -0.2, 0.2, 'b'); P.pop();
    const t2 = a0 + (i + 1) * TAU / 8, qx = cx + Math.sin(t2) * rb, qz = cz + Math.cos(t2) * rb;
    P.quad(M.kfence, [px, yT + 0.25, pz], [qx, yT + 0.25, qz], [qx, yT + 1.15, qz], [px, yT + 1.15, pz], null, [[0, 0.3], [1, 0.3], [1, 1], [0, 1]]);
  }
  G.frustum(P, M.domeWhite, cx, cz, yT + 0.25, yT + 0.9, 12, 1.75, 1.75, 0, 1, 1);
  G.lathe(P, M.domeWhite, 'kshDome', [[1.75, 0], [1.6, 0.45], [1.25, 0.85], [0.7, 1.15], [0.12, 1.3], [0, 1.32]], cx, yT + 0.9, cz, 1, 1, 16, 8);
  P.col(M.metal, cx, cz, yT + 2.2, yT + 5.2, 0.05, 0.025, 6, false);
}

// ------------------------------------------------------------------------------------------------ the reception wing and the winter garden
function wing(P, M) {
  const WG0 = 26.4;                                                   // the winter garden block starts here (s)
  const ringW = [st(13.3, 5.6), st(WG0, 5.6), st(WG0, 22.4), st(25.5, 22.4), st(25.5, 24.0), st(13.3, 24.0)];
  const ringG = [st(WG0, 5.6), st(32.0, 5.6), st(32.0, 22.4), st(WG0, 22.4)];
  walls(P, ringW, (len, e) => {
    kwZones(P, M, len);
    if (onSeg(e, st(13.3, 5.6), st(WG0, 5.6))) for (let i = 0; i < 5; i++) kwindow(P, M, 1.5 + i * 2.55, HW.gran, 1.45, 2.9);
    else for (let u = 1.9; u < len - 1.2; u += 3.0) kwindow(P, M, u, HW.gran, 1.3, 2.8);
  }, (e) => onSeg(e, st(13.3, 5.6), st(13.3, 24.0)) || onSeg(e, st(WG0, 5.6), st(WG0, 22.4)));
  slabRing(P, ringW, HW.corn, HW.corn + 0.24, 0.7, M.metalLight, (e) => onSeg(e, st(13.3, 5.6), st(13.3, 24.0)) || onSeg(e, st(WG0, 5.6), st(WG0, 22.4)));
  capRing(P, M.roofSilver, ringW, HW.corn + 0.24);
  // terrace parapet: brick posts and a metal railing on the street side
  G.onFace(P, ...st(13.3, 5.6), 0, 1, () => {
    for (let u = 0.3; u < WG0 - 13.3; u += 2.55) P.box(M.brickFlat, u - 0.25, u + 0.25, HW.corn + 0.24, HW.par + 0.2, -0.5, 0, 'b');
    P.quad(M.kfence, [0, HW.corn + 0.24, -0.25], [WG0 - 13.3, HW.corn + 0.24, -0.25], [WG0 - 13.3, HW.par, -0.25], [0, HW.par, -0.25], null, [[0, 0.4], [9, 0.4], [9, 1], [0, 1]]);
  });
  // the winter garden block: taller, wide cornice, attic; the glazed half-cylinder on the Kronverksky face
  walls(P, ringG, (len, e) => {
    zones(P, len, [[0, HW.base, M.redGranite, 2], [HW.base, HW.gran, M.granK, 2, 1.4], [HW.gran, HW.wg, M.brick, 1, 0.5], [HW.wg, HW.wg + 1.0, M.brick, 1, 0.5]]);
    if (onSeg(e, st(32.0, 5.6), st(32.0, 22.4))) for (let u = 2.2; u < len - 1.5; u += 3.3) kwindow(P, M, u, HW.gran, 1.5, 3.4);
    else if (onSeg(e, st(WG0, 22.4), st(32.0, 22.4))) kwindow(P, M, len / 2, HW.gran, 1.5, 3.4);
  }, (e) => onSeg(e, st(WG0, 5.6), st(WG0, 22.4)) && false);
  slabRing(P, ringG, HW.wg, HW.wg + 0.26, 0.85, M.metalLight);
  capRing(P, M.roofSilver, ringG, HW.wg + 1.0);
  const [gx, gz] = st((WG0 + 32.0) / 2, 5.6), r = 2.15;
  G.tube(P, M.granKFlat, gx, gz, 0, 1.5, r + 0.12, r + 0.12, 20, 1, 1);
  G.tube(P, M.wgarden, gx, gz, 1.5, 6.6, r, r, 20, 14, 5);
  G.tube(P, M.metal, gx, gz, 6.6, 6.85, r + 0.1, r + 0.1, 20, 1, 1, { capTop: M.metal });
  G.lathe(P, M.wgarden, 'wgDome', [[r, 0], [r * 0.92, 0.35], [r * 0.7, 0.62], [r * 0.3, 0.8], [0, 0.84]], gx, 6.85, gz, 1, 1, 20, 6);
  const tor = new THREE.TorusGeometry(0.85, 0.06, 6, 20); P.geo(M.metal, tor, gx, 4.3, gz + r + 0.05); tor.dispose();
  for (const dx of [-1, 1]) P.box(M.metal, gx + dx * 1.1 - 0.09, gx + dx * 1.1 + 0.09, 1.5, 6.6, gz + r * 0.82, gz + r * 0.82 + 0.14, 'b');
  // the chimney tower with the blue tile top (photo 30)
  const [hx, hz] = st(14.6, 15.5);
  G.tbox(P, M.brick, hx - 0.65, hx + 0.65, HW.corn, 10.4, hz - 0.65, hz + 0.65, 1, 0.5, 'b'); G.tbox(P, M.cobalt, hx - 0.72, hx + 0.72, 10.4, 11.0, hz - 0.72, hz + 0.72, 1, 1, 'b');
  P.col(M.metal, hx, hz, 11.0, 11.6, 0.4, 0.5, 10, true);
}

// ------------------------------------------------------------------------------------------------ the 1957 link block, the rear wing, the Brant mansion
const LINK = [[-15.2, 26.6], [-2.1, 26.4], [-0.1, 25.7], [6.2, 25.7], [6.3, 34.8], [8.9, 34.8], [9.0, 39.9], [14.3, 40.0], [14.1, 50.8], [9.1, 50.7], [8.9, 55.6], [6.8, 55.6], [-14.8, 53.1]];
const REAR = [[-14.8, 53.1], [6.8, 55.6], [6.9, 69.0], [6.9, 86.52], [-25.9, 83.4], [-23.9, 52.8]];
const BRANT = [[6.9, 69.0], [17.3, 69.4], [17.7, 67.3], [17.6, 65.8], [18.5, 64.9], [19.7, 64.7], [21.1, 65.4], [30.2, 67.7], [31.4, 67.5], [32.5, 68.3], [32.7, 69.6], [32.0, 70.7], [28.4, 85.1], [29.4, 87.1], [33.5, 88.2],
  [31.7, 95.4], [25.6, 93.8], [26.7, 89.6], [20.0, 88.0], [17.5, 89.9], [13.6, 89.2], [11.9, 87.0], [6.9, 86.52]];
function linkAndBrant(P, M) {
  const HL = 11.2, HR = 12.0, HB = 10.6;
  const link = LINK.map((p) => st(...p)), rear = REAR.map((p) => st(...p)), brant = BRANT.map((p) => st(...p));
  walls(P, link, (len) => {
    zones(P, len, [[0, 0.9, M.granKFlat, 2], [HL - 0.6, HL, M.link, 3]]);
    baySheet(P, M.bayLink, 0, len, 0.9, HL - 0.6, 3.0, 2);
    P.box(M.link, 0, len, HL - 0.6, HL - 0.42, 0, 0.3, 'k');
  }, (e) => onSeg(e, st(-0.1, 25.7), st(6.2, 25.7)) || onSeg(e, st(6.8, 55.6), st(-14.8, 53.1)));
  capRing(P, M.roofSilver, link, HL);
  walls(P, rear, (len) => { zones(P, len, [[0, 0.9, M.granKFlat, 2]]); baySheet(P, M.bayCourt, 0, len, 0.9, HR, 3.2, 3); }, (e) => onSeg(e, st(-14.8, 53.1), st(6.8, 55.6)) || onSeg(e, st(6.9, 69.0), st(6.9, 86.52)));
  capRing(P, M.roofSilver, rear, HR);
  // Brant mansion: light stone, two storeys, cornice, a balustrade parapet, green copper roof
  walls(P, brant, (len) => {
    zones(P, len, [[0, 1.2, M.graniteLightK, 2], [HB, HB + 0.9, M.brant, 3]]);
    if (len > 1.6) baySheet(P, M.bayBrant, 0, len, 1.2, HB, 2.6, 2); else zones(P, len, [[1.2, HB, M.brant, 3]]);
    P.box(M.brant, -0.02, len + 0.02, HB - 0.05, HB + 0.22, 0, 0.42, 'k'); P.box(M.brant, 0, len, 5.65, 5.83, 0, 0.14, 'k');
    if (len > 3) for (let u = 0.4; u < len; u += 2.6) P.box(M.brant, u - 0.2, u + 0.2, HB + 0.22, HB + 1.15, -0.28, 0.06, 'b');
  }, (e) => onSeg(e, st(6.9, 69.0), st(6.9, 86.52)));
  capRing(P, M.copper, brant, HB + 0.9);
}

// ------------------------------------------------------------------------------------------------ garden, fountain, fences
const GARDEN = [[13.5, 0.3], [45.2, 0.9], [47.5, 2.3], [49.4, 1.8], [50.3, 4.2], [50.2, 11.0], [36.6, 71.4], [32.9, 70.4], [30.2, 67.5], [21.1, 65.2], [18.2, 64.6], [17.2, 69.0], [7.1, 68.8], [7.0, 55.8], [9.1, 55.8], [9.3, 51.0],
  [14.3, 51.0], [14.5, 39.8], [9.2, 39.7], [9.1, 34.6], [6.5, 34.6], [6.4, 25.9], [13.5, 25.9], [13.5, 24.2], [25.7, 24.2], [25.7, 22.6], [32.2, 22.6], [32.2, 5.4], [13.5, 5.4]];
function grounds(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics, cover = coverFn(ctx);
  const ring = GARDEN.map(([s, t]) => { const w = KS.W(s, -t); return [w.x, w.z]; });
  fillPolyClipped(P, M.lawn, ring, 0.05, cover, { maxEdge: 8, tile: 6 });
  // gravel walk to the fountain and the round basin
  const f = KS.W(29.9, -38.7);
  { const n = 20, RO = 2.3, RI = 2.0; const pt = (i, r, y) => [f.x + Math.sin(i * TAU / n) * r, y, f.z + Math.cos(i * TAU / n) * r];
    for (let i = 0; i < n; i++) { const t = (i + 0.5) * TAU / n; P.quad(M.granKFlat, pt(i, RO, 0), pt(i + 1, RO, 0), pt(i + 1, RO, 0.5), pt(i, RO, 0.5), [Math.sin(t), 0, Math.cos(t)]); P.quad(M.granKFlat, pt(i, RO, 0.5), pt(i + 1, RO, 0.5), pt(i + 1, RI, 0.5), pt(i, RI, 0.5), [0, 1, 0]); P.quad(M.granKFlat, pt(i, RI, 0.5), pt(i + 1, RI, 0.5), pt(i + 1, RI, 0.3), pt(i, RI, 0.3), [-Math.sin(t), 0, -Math.cos(t)]); }
    P.cap(M.water, Array.from({ length: n }, (_, i) => [f.x + Math.sin(i * TAU / n) * RI, f.z + Math.cos(i * TAU / n) * RI]), 0.32, true, 4);
    P.col(M.granKFlat, f.x, f.z, 0.3, 1.1, 0.25, 0.18, 8, true); P.col(M.granKFlat, f.x, f.z, 1.1, 1.2, 0.7, 0.6, 12, true);
    ph.addCylinder(f.x, f.z, RO, 0, 0.6); }
  const gp = []; for (const [s, t] of [[36, 12], [44, 20], [40, 34], [45, 8], [20, 30], [24, 46], [34, 56], [22, 58], [38, 46]]) { const w = KS.W(s, -t); gp.push({ x: w.x, z: w.z, fam: (s + t) % 3 ? 'limeA' : 'mapleA', s: 0.9 + ((s * 7 + t) % 5) * 0.05, yaw: s, y: 0.05 }); }
  plantTrees(K, gp, 'lmT-mansionTrees');
  K.svc.trees.push(...gp.map((t) => ({ x: t.x, z: t.z, r: 3.2 * t.s, h: 17 * t.s })));

  const byId = new Map(BARRIERS.map((b) => [b.id, b]));
  const gates = BARRIER_NODES.filter((n) => n.kind === 'gate' && n.x > -1525 && n.x < -1395 && n.z > -2480 && n.z < -2400).map((n) => ({ x: n.x, z: n.z, half: 1.9 }));
  // Kronverksky side: iron panels between round granite posts on a red granite base (photo 30)
  const round = [], fences = [];
  for (const id of ['w85426960', 'w85427334']) {
    const b = byId.get(id); if (!b) continue;
    let pts = pairs(b.pts);
    if (id === 'w85426960') pts = pts.slice(0, 2).map(([x, z], i) => { if (i) return [x, z]; const w = KS.W(14.6, 0.35); return [w.x, w.z]; }).concat(pts.slice(2));   // start clear of the turret
    const plan = planFence(pts, 3.4, gates, 0.25);
    for (const p of plan.posts) round.push(mat4(p.x, 0, p.z, p.rot, p.gate ? 1.2 : 1));
    for (const q of plan.panels) {
      panelQuad(P, M.kfence, q.a, q.b, 0.45, 2.3, 1.4); ph.addBox((q.a.x + q.b.x) / 2, (q.a.z + q.b.z) / 2, q.len, 0.14, q.rot, 0, 2.3);
      P.push(q.a.x, 0, q.a.z, q.rot); P.box(M.redGranite, 0, q.len, 0, 0.45, -0.16, 0.16, 'b', 2); P.pop();
    }
    fences.push({ id, pts, h: 2.3, kind: 'iron', gates: plan.opens });
  }
  const roundG = partsGeos((Q) => { Q.box(M.redGranite, -0.3, 0.3, 0, 0.5, -0.3, 0.3, 'b', 2); Q.col(M.granKFlat, 0, 0, 0.5, 2.35, 0.24, 0.22, 12, false); Q.col(M.granKFlat, 0, 0, 2.35, 2.5, 0.3, 0.3, 12, true); Q.col(M.granKFlat, 0, 0, 2.5, 2.72, 0.2, 0.02, 12, false); });
  K.extraTris += addInstanced(ctx, K.root, 'lmT-kshPosts', roundG, round).tris;
  for (const m of round) ph.addCylinder(m.elements[12], m.elements[14], 0.3, 0, 2.6);
  // Kuybysheva side: brick piers, a low brick wall with iron grilles above (photo 31)
  const piers = [];
  for (const id of ['w85427333', 'w85427335']) {
    const b = byId.get(id); if (!b) continue;
    const pts = pairs(b.pts), plan = planFence(pts, 4.2, gates, 0.3);
    for (const p of plan.posts) piers.push(mat4(p.x, 0, p.z, p.rot, p.gate ? 1.12 : 1));
    for (const q of plan.panels) {
      P.push(q.a.x, 0, q.a.z, q.rot); G.tbox(P, M.brick, 0, q.len, 0, 1.25, -0.2, 0.2, 1, 0.5, 'b'); P.box(M.granKFlat, 0, q.len, 1.25, 1.33, -0.24, 0.24, 'b'); P.pop();
      panelQuad(P, M.kfence, q.a, q.b, 1.33, 2.5, 1.4); ph.addBox((q.a.x + q.b.x) / 2, (q.a.z + q.b.z) / 2, q.len, 0.4, q.rot, 0, 2.5);
    }
    fences.push({ id, pts, h: 2.5, kind: 'brick', gates: plan.opens });
  }
  const pierG = partsGeos((Q) => { G.tbox(Q, M.brick, -0.34, 0.34, 0, 2.7, -0.34, 0.34, 1, 0.5, 'b'); Q.box(M.granKFlat, -0.42, 0.42, 2.7, 2.86, -0.42, 0.42, 'b'); G.frustum(Q, M.granKFlat, 0, 0, 2.86, 3.1, 4, 0.5, 0.1, Math.PI / 4, 1, 1); });
  K.extraTris += addInstanced(ctx, K.root, 'lmT-kshPiers', pierG, piers).tris;
  for (const m of piers) ph.addBox(m.elements[12], m.elements[14], 0.7, 0.7, 0, 0, 3);
  K.svc.fences.push(...fences);
}
