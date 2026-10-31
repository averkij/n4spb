// landmarksVladimir/cathedral.js - the Prince Vladimir Cathedral (A. Rinaldi 1766-73, I. Starov 1783-89) in the model frame CATH (frame.js: origin = the central dome, local +z = WEST to the
// bell tower and the main door, +x = south).  Dossier docs/research/vladimir.md section 2; photos refs/vladimir cath_04_aerial (massing, aisle roofs, transept door), cath_05_aerial, cath_15
// (segmental pediment, oval window, drums), cath_14_tower (tower tiers), cath_11_door (portico, gilded angels), cath_01.
// Plan (OSM w109067002 + parts): body |x| <= 14, z -14.1 .. 36; west porch to 38.6 (|x| <= 7.3); apse r 7 on (0, -14.1); two-storey five-dome core z -14.1 .. 14.1; clerestory |x| <= 7.3 to
// z 23.3; one-storey aisles with lean-to roofs; bell tower 10 x 10 m on (0, 28.3).  Heights: lower order to 9.6, main cornice 17.8, small domes ~35, central cross 44.7, tower cross 57.5.
// Pale yellow walls, white Doric order, SILVER-GREY domes, gilded orbs and crosses.  ~45 k triangles, all merged by Parts.
import * as L from '../layout.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import * as THREE from 'three';
import { CATH, onWall } from './frame.js';
import { rectPath, archPath } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';

export const Y = { pl: 0.9, c1: 8.5, e1: 9.6, c2: 16.6, e2: 17.8, fl: 1.1 };
export const HW = 14.0, ZE = -14.1, ZW = 36.0, ZC = 14.1, ZP = 38.6, PW = 7.3, ZT = 28.3, ZN = 23.3;
const TAU = Math.PI * 2;
const DOME = [[1.0, 0], [1.0, 0.06], [0.985, 0.2], [0.93, 0.4], [0.83, 0.6], [0.68, 0.78], [0.48, 0.92], [0.25, 0.985], [0.08, 1.0]];
const BELL = [[0.82, 0.0], [0.8, 0.04], [0.55, 0.18], [0.38, 0.45], [0.3, 0.8], [0.22, 0.98], [0.0, 1.0]];

/** band of a segmental arc over the chord (cx +- hw) at height y: rise, thickness th (outline points, counter-clockwise) */
export function segBand(cx, y, hw, rise, th, n = 10) {
  const R = (hw * hw + rise * rise) / (2 * rise), cy = y + rise - R, a0 = Math.asin(Math.min(1, hw / R)), inn = [], out = [];
  for (let i = 0; i <= n; i++) { const a = -a0 + 2 * a0 * i / n; inn.push([cx + Math.sin(a) * R, cy + Math.cos(a) * R]); out.push([cx + Math.sin(a) * (R + th), cy + Math.cos(a) * (R + th)]); }
  return [...inn, ...out.reverse()];
}
/** filled circular segment over the chord */
export function segFill(cx, y, hw, rise, n = 10) {
  const R = (hw * hw + rise * rise) / (2 * rise), cy = y + rise - R, a0 = Math.asin(Math.min(1, hw / R)), pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 - 2 * a0 * i / n; pts.push([cx + Math.sin(a) * R, cy + Math.cos(a) * R]); }
  return pts.reverse();
}
/** white Doric pilaster on the wall (current facade frame) */
export function pil(P, M, u, y0, y1, w = 0.95, d = 0.26, zb = 0) {
  P.box(M.white, u - w / 2, u + w / 2, y0, y1, zb, zb + d, 'bk');
  P.box(M.whiteShade, u - w / 2 - 0.08, u + w / 2 + 0.08, y0, y0 + 0.35, zb, zb + d + 0.08, 'bk');
  P.box(M.white, u - w / 2 - 0.1, u + w / 2 + 0.1, y1 - 0.32, y1, zb, zb + d + 0.1, 'bk');
}
/** free-standing Doric column: base, shaft with entasis, echinus and abacus */
export function doric(P, M, x, z, y0, y1, R) {
  P.box(M.whiteShade, x - R * 1.25, x + R * 1.25, y0, y0 + R * 0.4, z - R * 1.25, z + R * 1.25, 'b');
  P.col(M.white, x, z, y0 + R * 0.4, y0 + R * 0.7, R * 1.12, R * 1.02, 14, false);
  P.col(M.white, x, z, y0 + R * 0.7, y1 - R * 0.75, R, R * 0.86, 14, false);
  P.col(M.white, x, z, y1 - R * 0.75, y1 - R * 0.32, R * 0.9, R * 1.2, 14, false);
  P.box(M.white, x - R * 1.3, x + R * 1.3, y1 - R * 0.32, y1, z - R * 1.3, z + R * 1.3, '');
}
/** tall lower window: pane, eared white surround, sill, segmental hood */
function winLower(P, M, u, w = 1.9, y0 = 2.7, h = 4.6) {
  G.pane(P, M.winTall, u - w / 2, u + w / 2, y0, y0 + h, 0.04);
  const b = 0.24, x0 = u - w / 2, x1 = u + w / 2, yt = y0 + h;
  P.box(M.white, x0 - b, x0, y0 - 0.1, yt + b, 0, 0.16, 'bk'); P.box(M.white, x1, x1 + b, y0 - 0.1, yt + b, 0, 0.16, 'bk');
  P.box(M.white, x0, x1, yt, yt + b, 0, 0.16, 'bklr'); P.box(M.white, x0 - 0.42, x1 + 0.42, y0 - 0.34, y0 - 0.1, 0, 0.3, 'k');
  P.box(M.white, x0 - b - 0.14, x0 - b, yt - 0.5, yt + b, 0, 0.13, 'bk'); P.box(M.white, x1 + b, x1 + b + 0.14, yt - 0.5, yt + b, 0, 0.13, 'bk');
  G.solid(P, M.white, segBand(u, yt + b + 0.22, w / 2 + 0.5, 0.42, 0.2, 7), 0, 0.3);
  P.box(M.whiteShade, x0 - 0.3, x0 - 0.06, y0 - 0.78, y0 - 0.34, 0, 0.2, 'bk'); P.box(M.whiteShade, x1 + 0.06, x1 + 0.3, y0 - 0.78, y0 - 0.34, 0, 0.2, 'bk');
}
/** square upper window in a flat white frame */
function winUpper(P, M, u, y0 = 11.5, w = 1.8, h = 2.5) {
  G.pane(P, M.winSq, u - w / 2, u + w / 2, y0, y0 + h, 0.04);
  const b = 0.22, x0 = u - w / 2, x1 = u + w / 2;
  P.box(M.white, x0 - b, x0, y0 - b, y0 + h + b, 0, 0.14, 'bk'); P.box(M.white, x1, x1 + b, y0 - b, y0 + h + b, 0, 0.14, 'bk');
  P.box(M.white, x0, x1, y0 + h, y0 + h + b, 0, 0.14, 'bklr'); P.box(M.white, x0 - 0.1, x1 + 0.1, y0 - b - 0.06, y0, 0, 0.22, 'k');
}
/** one storey of wall in the current facade frame: plinth (lower storey only), yellow field, entablature */
function storey(P, M, u0, u1, lower, zb = 0) {
  if (lower) { P.box(M.plinth, u0, u1, 0, Y.pl, zb, zb + 0.14, 'bk'); P.quad(M.yellow, [u0, Y.pl, zb], [u1, Y.pl, zb], [u1, Y.c1, zb], [u0, Y.c1, zb], [0, 0, 1], [[u0 / 3, 0], [u1 / 3, 0], [u1 / 3, 2.5], [u0 / 3, 2.5]]); }
  else P.quad(M.yellow, [u0, Y.e1, zb], [u1, Y.e1, zb], [u1, Y.c2, zb], [u0, Y.c2, zb], [0, 0, 1], [[u0 / 3, 3], [u1 / 3, 3], [u1 / 3, 5.4], [u0 / 3, 5.4]]);
}
const entLow = (P, M, u0, u1, zb = 0) => { P.push(0, 0, zb, 0); S.entablature(P, M, u0, u1, Y.c1, 0.5, { hA: 0.35, hF: 0.35, hC: 0.4 }); P.pop(); };
const entUp = (P, M, u0, u1, zb = 0) => { P.push(0, 0, zb, 0); S.entablature(P, M, u0, u1, Y.c2, 0.62, { hA: 0.4, hF: 0.4, hC: 0.4 }); P.pop(); };

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] cathedral/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(CATH.ox, 0, CATH.oz, CATH.rot);
  stage('sides', () => { longSide(P, M, 1); longSide(P, M, -1); });
  stage('east', () => east(P, M));
  stage('west', () => west(P, M));
  stage('roofs', () => roofs(P, M));
  stage('drums', () => drums(P, M));
  stage('tower', () => tower(P, M));
  P.pop();
  stage('colliders', () => {
    const rec = L.buildingById('w109067002');
    if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 40, 0.9);
    // west landing and steps (walkable), the two transept door steps
    CATH.walk(ph, 0, ZP + 1.3, 10.6, 2.6, 0, Y.fl, 0);
    for (let i = 0; i < 4; i++) CATH.walk(ph, 0, ZP + 2.6 + 0.17 + i * 0.34, 10.6, 0.34, 0, Y.fl - (i + 1) * 0.22, 0);
    for (const sx of [1, -1]) { CATH.walk(ph, sx * (HW + 0.45 + 0.6), 0, 1.2, 4.4, 0, Y.fl, 0); for (let i = 0; i < 4; i++) CATH.walk(ph, sx * (HW + 0.45 + 1.2 + 0.13 + i * 0.26), 0, 0.26, 4.4, 0, Y.fl - (i + 1) * 0.22, 0); }
    for (const sx of [-1, 1]) for (const cx of [2.7, 4.0]) CATH.cyl(ph, sx * cx, ZP + 1.2, 0.55, 0, 9);
  });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the long north / south sides
function longSide(P, M, sgn) {
  const a = sgn > 0 ? [HW, ZW] : [-HW, ZE], b = sgn > 0 ? [HW, ZE] : [-HW, ZW];
  onWall(P, a, b, [0, 0], (len) => {
    const U = (z) => (sgn > 0 ? ZW - z : z - ZE);
    const c0 = Math.min(U(ZC), U(ZE)), c1 = Math.max(U(ZC), U(ZE)), uc = U(0), RZ = 0.45, rw = 5.6;
    storey(P, M, 0, len, true); entLow(P, M, 0, len);
    storey(P, M, c0, c1, false); entUp(P, M, c0, c1);
    // the middle risalit of the transept end (both storeys), with its own plinth and broken entablatures
    P.box(M.plinth, uc - rw, uc + rw, 0, Y.pl, 0.14, RZ + 0.14, 'bk');
    P.box(M.yellow, uc - rw, uc + rw, Y.pl, Y.c1, 0, RZ, 'bk'); P.box(M.yellow, uc - rw, uc + rw, Y.e1, Y.c2, 0, RZ, 'bk');
    P.push(0, 0, RZ, 0);
    S.entablature(P, M, uc - rw, uc + rw, Y.c1, 0.5, { hA: 0.35, hF: 0.35, hC: 0.4, z0: 0.05 }); S.entablature(P, M, uc - rw, uc + rw, Y.c2, 0.62, { hA: 0.4, hF: 0.4, hC: 0.4, z0: 0.17 });
    for (const du of [-rw + 0.6, -rw + 1.7, rw - 1.7, rw - 0.6]) { pil(P, M, uc + du, Y.pl, Y.c1); pil(P, M, uc + du, Y.e1 + 0.05, Y.c2, 0.85, 0.22); }
    // door with steps, oval window over it, square window above
    const dw = 2.2, dh = 3.7;
    G.pane(P, M.doorSide, uc - dw / 2, uc + dw / 2, Y.fl, Y.fl + dh, 0.04);
    P.box(M.white, uc - dw / 2 - 0.26, uc - dw / 2, Y.fl, Y.fl + dh + 0.26, 0, 0.18, 'bk'); P.box(M.white, uc + dw / 2, uc + dw / 2 + 0.26, Y.fl, Y.fl + dh + 0.26, 0, 0.18, 'bk');
    P.box(M.white, uc - dw / 2, uc + dw / 2, Y.fl + dh, Y.fl + dh + 0.26, 0, 0.18, 'bklr');
    G.solid(P, M.white, segBand(uc, Y.fl + dh + 0.5, dw / 2 + 0.55, 0.5, 0.22, 8), 0, 0.34);
    S.oculus(P, M, uc, 6.9, 0.95, 0.68, { mat: M.winOval, garland: false, putto: false });
    winUpper(P, M, uc);
    P.box(M.granite, uc - 2.2, uc + 2.2, 0, Y.fl, 0, 1.2, 'bk');                 // short flight: the driveway round the cathedral passes 2.8 m from the wall
    for (let i = 0; i < 4; i++) P.box(M.granite, uc - 2.2, uc + 2.2, 0, Y.fl - (i + 1) * 0.22, 1.2 + i * 0.26, 1.46 + i * 0.26, 'bk');
    // segmental pediment: tympanum, cornice arc, an inner moulding
    G.solid(P, M.yellow, segFill(uc, Y.e2, rw + 0.1, 3.0, 12), -0.2, 0.55);
    G.solid(P, M.white, segBand(uc, Y.e2 - 0.02, rw + 0.55, 3.15, 0.42, 12), -0.2, 1.05);
    G.solid(P, M.white, segBand(uc, Y.e2 + 0.55, 3.5, 1.45, 0.2, 10), 0.35, 0.1);
    P.pop();
    // barrel roof of the transept arm behind the pediment
    { const pts = segFill(uc, Y.e2, rw + 0.5, 3.1, 12); for (let i = 0; i + 1 < pts.length; i++) { const p = pts[i], q = pts[i + 1]; P.quad(M.roof, [p[0], p[1], 0.3], [q[0], q[1], 0.3], [q[0], q[1], -9.5], [p[0], p[1], -9.5], [0, 1, 0], [[p[0] / 2.4, 0], [q[0] / 2.4, 0], [q[0] / 2.4, 4], [p[0] / 2.4, 4]]); } }
    // core: flank bays (windows in both storeys), corner pilaster pairs
    for (const z of [-8.9, 8.9]) { winLower(P, M, U(z)); winUpper(P, M, U(z)); }
    for (const z of [-13.4, -12.25, 12.25, 13.4]) { pil(P, M, U(z), Y.pl, Y.c1); pil(P, M, U(z), Y.e1 + 0.05, Y.c2, 0.85, 0.22); }
    // aisle: four bays, pilasters between them
    for (const z of [16.95, 22.35, 27.75, 33.15]) winLower(P, M, U(z));
    for (const z of [19.65, 25.05, 30.45, 35.45]) pil(P, M, U(z), Y.pl, Y.c1);
  });
  // clerestory wall of the nave over the aisle roof
  const ca = sgn > 0 ? [PW, ZN] : [-PW, ZC], cb = sgn > 0 ? [PW, ZC] : [-PW, ZN];
  onWall(P, ca, cb, [0, 18], (len) => {
    P.quad(M.yellow, [0, 11.0, 0], [len, 11.0, 0], [len, Y.c2, 0], [0, Y.c2, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 1.9], [0, 1.9]]);
    entUp(P, M, 0, len);
    for (const u of [len * 0.27, len * 0.73]) winUpper(P, M, u, 13.0, 1.5, 2.0);
  });
}

// ------------------------------------------------------------------------------------------------ the east end with the apse
function east(P, M) {
  for (const sx of [1, -1]) {
    const a = [sx * HW, ZE], b = [sx * 7.0, ZE];
    onWall(P, a, b, [0, 0], (len) => {
      storey(P, M, 0, len, true); entLow(P, M, 0, len); storey(P, M, 0, len, false); entUp(P, M, 0, len);
      winLower(P, M, len / 2); winUpper(P, M, len / 2);
      for (const k of [0.6, 1.75]) { pil(P, M, (sx > 0 ? 0 : len) + (sx > 0 ? 1 : -1) * k, Y.pl, Y.c1); pil(P, M, (sx > 0 ? 0 : len) + (sx > 0 ? 1 : -1) * k, Y.e1 + 0.05, Y.c2, 0.85, 0.22); }
    });
  }
  const N = 9, R = 7.0, pts = [];
  for (let i = 0; i <= N; i++) { const t = Math.PI * i / N; pts.push([R * Math.cos(t), ZE - R * Math.sin(t)]); }
  for (let i = 0; i < N; i++) {
    onWall(P, pts[i], pts[i + 1], [0, ZE + 2], (len) => {
      storey(P, M, 0, len, true); entLow(P, M, -0.06, len + 0.06); storey(P, M, 0, len, false); entUp(P, M, -0.08, len + 0.08);
      if (i === 1 || i === 4 || i === 7) { winLower(P, M, len / 2, 1.5); winUpper(P, M, len / 2, 11.5, 1.4, 2.4); }
      else if (i % 3 === 0) { pil(P, M, len * 0.5, Y.pl, Y.c1, 0.8); pil(P, M, len * 0.5, Y.e1 + 0.05, Y.c2, 0.75, 0.22); }
    });
  }
  // half-cone roof of the apse
  const ya = Y.e2 + 2.6, yb = Y.e2 + 0.05, RR = R + 0.62;
  for (let i = 0; i < N; i++) {
    const t0 = Math.PI * i / N, t1 = Math.PI * (i + 1) / N, tm = (t0 + t1) / 2;
    P.fan(M.roof, [[RR * Math.cos(t0), yb, ZE - RR * Math.sin(t0)], [RR * Math.cos(t1), yb, ZE - RR * Math.sin(t1)], [0, ya, ZE + 0.2]], [Math.cos(tm) * 0.35, 0.93, -Math.sin(tm) * 0.35], (q) => [q[0] / 2.4, q[2] / 2.4]);
  }
}

// ------------------------------------------------------------------------------------------------ the west front: narthex wings, porch, portico, steps
function west(P, M) {
  for (const sx of [1, -1]) {
    const a = sx > 0 ? [PW, ZW] : [-HW, ZW], b = sx > 0 ? [HW, ZW] : [-PW, ZW];
    onWall(P, a, b, [0, 0], (len) => {
      storey(P, M, 0, len, true); entLow(P, M, 0, len); winLower(P, M, len / 2);
      pil(P, M, sx > 0 ? len - 0.6 : 0.6, Y.pl, Y.c1);                       // outer corner (the origin of the frame is the north end)
      P.fan(M.yellow, sx > 0 ? [[0, Y.e1, 0], [len, Y.e1, 0], [0, 11.0, 0]] : [[0, Y.e1, 0], [len, Y.e1, 0], [len, 11.0, 0]], [0, 0, 1]);
    });
    // porch flank
    onWall(P, [sx * PW, ZW], [sx * PW, ZP], [0, 30], (len) => { storey(P, M, 0, len, true); entLow(P, M, 0, len); P.quad(M.yellow, [0, Y.e1, 0], [len, Y.e1, 0], [len, 11.3, 0], [0, 11.3, 0], [0, 0, 1]); });
  }
  onWall(P, [-PW, ZP], [PW, ZP], [0, 0], (len) => {
    const uc = len / 2;
    storey(P, M, 0, len, true); entLow(P, M, 0, len);
    // attic of the porch with a small segmental pediment
    P.quad(M.yellow, [0, Y.e1, 0], [len, Y.e1, 0], [len, 11.3, 0], [0, 11.3, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 0.6], [0, 0.6]]);
    P.box(M.white, -0.3, len + 0.3, 11.3, 11.65, -0.3, 0.35, 'b');
    G.solid(P, M.yellow, segFill(uc, 11.65, 4.6, 1.9, 10), -0.25, 0.45); G.solid(P, M.white, segBand(uc, 11.63, 4.95, 2.0, 0.34, 10), -0.25, 0.75);
    // the main door under its fan light, white arch surround, the gilded angels of the Order of St Vladimir
    const dw = 2.8, dh = 5.2;
    S.archGlass(P, M.door, uc, Y.fl, dw, dh, 0.05); S.archFrame(P, M.white, uc, Y.fl, dw, dh, 0.34, 0, 0.22);
    G.pane(P, M.angels, uc - 2.5, uc + 2.5, 6.25, 8.45, 0.09);
    for (const du of [-5.6, 5.6]) winLower(P, M, uc + du, 1.5, 2.7, 4.2);
    for (const du of [-6.75, 6.75]) pil(P, M, uc + du, Y.pl, Y.c1, 0.8);
    // landing, steps, the two pairs of giant Doric columns with their broken entablature blocks
    P.box(M.granite, uc - 5.3, uc + 5.3, 0, Y.fl, 0, 2.6, 'bk');
    for (let i = 0; i < 4; i++) P.box(M.granite, uc - 5.3, uc + 5.3, 0, Y.fl - (i + 1) * 0.22, 2.6 + i * 0.34, 2.94 + i * 0.34, 'bk');
    for (const s of [-1, 1]) {
      for (const cx of [2.7, 4.0]) doric(P, M, uc + s * cx, 1.2, Y.fl, Y.c1, 0.46);
      S.entablature(P, M, uc + s * 3.35 - 1.35, uc + s * 3.35 + 1.35, Y.c1, 1.95, { hA: 0.35, hF: 0.35, hC: 0.4, z0: 0.5 });
      P.box(M.white, uc + s * 3.35 - 1.2, uc + s * 3.35 + 1.2, Y.e1, Y.e1 + 0.5, 0.3, 1.7, 'b');
    }
  });
}

// ------------------------------------------------------------------------------------------------ roofs
function roofs(P, M) {
  const yr = Y.e2 + 0.1, uv = (x, z) => [x / 2.4, z / 2.4];
  // core: a flat sheet-metal deck (the drums and the transept barrels stand on it)
  P.cap(M.roof, [[-HW - 0.3, ZE - 0.3], [HW + 0.3, ZE - 0.3], [HW + 0.3, ZC], [-HW - 0.3, ZC]], yr, true, 2.4);
  // nave clerestory: a low gable to the tower
  const yn = Y.e2 + 0.05, yk = Y.e2 + 1.25;
  for (const s of [1, -1]) P.quad(M.roof, [s * (PW + 0.5), yn, ZC], [s * (PW + 0.5), yn, ZN], [0, yk, ZN], [0, yk, ZC], [s * 0.16, 0.98, 0], [uv(0, ZC), uv(0, ZN), uv(8, ZN), uv(8, ZC)]);
  P.fan(M.yellow, [[-PW, yn, ZN], [PW, yn, ZN], [0, yk, ZN]], [0, 0, 1]);
  for (const s of [1, -1]) P.box(M.yellow, s > 0 ? 5.0 : -PW, s > 0 ? PW : -5.0, 11.0, Y.e2, ZN - 0.3, ZN, 'bk' + (s > 0 ? 'l' : 'r'));
  // aisles: lean-to roofs from the outer cornice to the clerestory wall, a flat deck round the tower foot
  for (const s of [1, -1]) P.quad(M.roof, [s * (HW + 0.45), Y.e1 + 0.04, ZC], [s * (HW + 0.45), Y.e1 + 0.04, ZW + 0.45], [s * PW, 11.0, ZW + 0.45], [s * PW, 11.0, ZC], [s * 0.2, 0.97, 0], [uv(0, ZC), uv(0, ZW), uv(7, ZW), uv(7, ZC)]);
  for (const s of [1, -1]) onWall(P, s > 0 ? [PW, ZC] : [-HW, ZC], s > 0 ? [HW, ZC] : [-PW, ZC], [0, 0], (len) => {   // west wall of the core over the aisle roofs
    storey(P, M, 0, len, false); entUp(P, M, 0, len); winUpper(P, M, len / 2, 12.6, 1.5, 2.0);
    for (const k of [0.6, 1.75]) pil(P, M, s > 0 ? len - k : k, Y.e1 + 0.05, Y.c2, 0.85, 0.22);
  });
  P.cap(M.roof, [[-PW, ZN], [PW, ZN], [PW, ZW + 0.45], [-PW, ZW + 0.45]], 11.0, true, 2.4);
  P.cap(M.roof, [[-PW, ZW], [PW, ZW], [PW, ZP - 0.3], [-PW, ZP - 0.3]], 11.3, true, 2.4);
}

// ------------------------------------------------------------------------------------------------ the five drums and domes
function finial(P, M, x, y, z, rBall, hCross, rot) {
  P.col(M.gold, x, z, y - 0.1, y + rBall * 0.9, rBall * 0.42, rBall * 0.3, 10, false);
  G.ball(P, M.gold, x, y + rBall * 1.7, z, rBall, 12);
  P.col(M.gold, x, z, y + rBall * 2.6, y + rBall * 3.1, rBall * 0.16, rBall * 0.1, 6, false);
  G.cross(P, M.gold, x, y + rBall * 3.0, z, hCross, rot);
  return y + rBall * 3.0 + hCross;
}
function drum(P, M, x, z, y0, y1, R, o) {
  const seg = o.seg, a0 = o.a0 ?? -Math.PI / seg;
  G.tube(P, M.white, x, z, y0, y0 + o.base, R * 1.035, R * 1.035, seg, 1, 1, { a0 });
  P.fan(M.white, G.ngon(seg, R * 1.035, a0, x, z).map(([px, pz]) => [px, y0 + o.base, pz]), [0, 1, 0]);
  G.tube(P, M.yellow, x, z, y0 + o.base, y1, R, R, seg, seg / 2, 2, { a0 });
  const nW = o.windows.length, wy = y0 + o.base + 0.9;
  for (let i = 0; i < nW; i++) {
    const t = o.wa0 + i * TAU / nW, w = o.windows[i];
    P.push(x + Math.sin(t) * R * Math.cos(Math.PI / seg), 0, z + Math.cos(t) * R * Math.cos(Math.PI / seg), t);
    if (w === 'a') { S.archGlass(P, M.winArch, 0, wy, o.ww, o.wh, 0.05); S.archFrame(P, M.white, 0, wy, o.ww, o.wh, o.ww * 0.17, 0, 0.16); P.box(M.white, -o.ww * 0.75, o.ww * 0.75, wy - 0.3, wy - 0.1, 0, 0.26, 'k'); }
    else { G.pane(P, M.winSq, -o.ww / 2, o.ww / 2, wy + 0.3, wy + o.wh * 0.7, 0.05); P.box(M.white, -o.ww / 2 - 0.2, o.ww / 2 + 0.2, wy + o.wh * 0.7, wy + o.wh * 0.7 + 0.22, 0, 0.16, 'bk'); P.box(M.white, -o.ww / 2 - 0.2, -o.ww / 2, wy + 0.1, wy + o.wh * 0.7, 0, 0.12, 'bk'); P.box(M.white, o.ww / 2, o.ww / 2 + 0.2, wy + 0.1, wy + o.wh * 0.7, 0, 0.12, 'bk'); G.solid(P, M.white, segBand(0, wy + o.wh * 0.7 + 0.4, o.ww / 2 + 0.4, 0.4, 0.18, 6), 0, 0.26); }
    P.pop();
    // pilaster strips between the windows
    const tp = t + TAU / nW / 2;
    for (const dt of o.pairs ? [-0.085, 0.085] : [0]) { P.push(x + Math.sin(tp + dt) * R, 0, z + Math.cos(tp + dt) * R, tp + dt); pil(P, M, 0, y0 + o.base, y1, o.pw, 0.2, -0.08); P.pop(); }
  }
  // cornice, attic band, dome seat
  G.tube(P, M.white, x, z, y1, y1 + 0.3, R * 1.06, R * 1.06, seg, 1, 1, { a0 }); G.tube(P, M.white, x, z, y1 + 0.3, y1 + 0.55, R * 1.14, R * 1.14, seg, 1, 1, { a0, capTop: M.white, capBot: M.underside });
  G.tube(P, M.yellow, x, z, y1 + 0.55, y1 + 0.55 + o.attic, R * 0.99, R * 0.99, seg, seg / 2, 1, { a0 });
  G.tube(P, M.white, x, z, y1 + 0.55 + o.attic, y1 + 0.8 + o.attic, R * 1.05, R * 1.05, seg, 1, 1, { a0, capTop: M.white, capBot: M.underside });
  const yd = y1 + 0.8 + o.attic;
  G.lathe(P, M.dome, 'dome', DOME, x, yd, z, o.domeR, o.domeH, 32, 14);
  return yd + o.domeH;
}
function drums(P, M) {
  for (const [dx, dz] of [[9, 9], [9, -9], [-9, 9], [-9, -9]]) {
    const top = drum(P, M, dx, dz, Y.e2, 26.4, 3.5, { seg: 16, base: 1.3, windows: ['a', 'a', 'a', 'a'], wa0: 0, ww: 1.45, wh: 4.3, pw: 0.6, pairs: false, attic: 0.9, domeR: 3.75, domeH: 3.5 });
    finial(P, M, dx, top, dz, 0.4, 2.5, Math.PI / 2);
  }
  const top = drum(P, M, 0, 0, Y.e2, 30.4, 6.3, { seg: 24, base: 1.9, windows: ['a', 's', 'a', 's', 'a', 's', 'a', 's'], wa0: 0, ww: 1.9, wh: 6.0, pw: 0.62, pairs: true, attic: 1.3, domeR: 6.7, domeH: 6.4 });
  P.col(M.dome, 0, 0, top - 0.2, top + 0.7, 0.9, 0.75, 12, true);
  finial(P, M, 0, top + 0.7, 0, 0.62, 3.9, Math.PI / 2);
}

// ------------------------------------------------------------------------------------------------ the bell tower
function tower(P, M) {
  const h0 = 5.0, h1 = 4.7, y1 = 28.6, A24 = { a0: -Math.PI / 24 };
  // shaft above the roofs: north / south / west faces from the aisle deck, east face above the nave ridge
  const faces = [[[h0, ZT + h0], [h0, ZT - h0], 11.0], [[-h0, ZT - h0], [-h0, ZT + h0], 11.0], [[-h0, ZT + h0], [h0, ZT + h0], 11.0], [[h0, ZT - h0], [-h0, ZT - h0], Y.e2 - 0.2]];
  faces.forEach(([a, b, yb], fi) => onWall(P, a, b, [0, ZT], (len) => {
    if (fi < 3) { P.quad(M.yellow, [0, yb, 0], [len, yb, 0], [len, Y.c2, 0], [0, Y.c2, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 1.9], [0, 1.9]]); entUp(P, M, -0.02, len + 0.02); }
    if (fi < 3) { for (const u of [0.55, len - 0.55]) pil(P, M, u, yb + 0.3, Y.c2, 0.9, 0.24); G.pane(P, M.winSq, len / 2 - 0.9, len / 2 + 0.9, 12.6, 15.0, 0.04); P.box(M.white, len / 2 - 1.15, len / 2 + 1.15, 15.0, 15.25, 0, 0.14, 'bk'); P.box(M.white, len / 2 - 1.15, len / 2 - 0.9, 12.4, 15.0, 0, 0.14, 'bk'); P.box(M.white, len / 2 + 0.9, len / 2 + 1.15, 12.4, 15.0, 0, 0.14, 'bk'); }
    // tier 1: the lower belfry
    const o = h0 - h1;
    P.push(o, 0, -o, 0);
    const l1 = len - 2 * o;
    { const sh = new THREE.Shape(); rectPath(sh, 0, Y.e2, l1, y1 - 1.2); const hole = new THREE.Path(); archPath(hole, l1 / 2, 19.7, 2.7, 4.65, true); sh.holes.push(hole); P.face(M.yellow, sh, 0, 3); }
    P.quad(M.archDark, [0.3, Y.e2, -1.4], [l1 - 0.3, Y.e2, -1.4], [l1 - 0.3, y1 - 1.2, -1.4], [0.3, y1 - 1.2, -1.4], [0, 0, 1]);
    S.entablature(P, M, -0.02, l1 + 0.02, y1 - 1.2, 0.6, { hA: 0.4, hF: 0.4, hC: 0.4 });
    for (const u of [0.5, 1.5, l1 - 1.5, l1 - 0.5]) pil(P, M, u, Y.e2 + 0.2, y1 - 1.2, 0.8, 0.24);
    S.archFrame(P, M.white, l1 / 2, 19.7, 2.7, 6.0, 0.3, -0.7, 0.86);
    G.lathe(P, M.bell, 'bell', BELL, l1 / 2, 21.9, -0.75, 0.8, 1.5, 12, 8); P.box(M.iron, l1 / 2 - 1.3, l1 / 2 + 1.3, 23.4, 23.62, -0.86, -0.64, '');
    P.quad(M.balus, [l1 / 2 - 1.5, 19.7, 0.2], [l1 / 2 + 1.5, 19.7, 0.2], [l1 / 2 + 1.5, 20.7, 0.2], [l1 / 2 - 1.5, 20.7, 0.2], [0, 0, 1], [[0, 0], [3, 0], [3, 1], [0, 1]]);
    P.box(M.white, l1 / 2 - 1.7, l1 / 2 + 1.7, 19.45, 19.7, 0, 0.42, 'k');
    G.solid(P, M.yellow, segFill(l1 / 2, y1, 3.3, 1.5, 8), -0.2, 0.4); G.solid(P, M.white, segBand(l1 / 2, y1 - 0.02, 3.6, 1.6, 0.3, 8), -0.2, 0.75);
    P.pop();
  }));
  P.cap(M.roof, [[-h1 - 0.5, ZT - h1 - 0.5], [h1 + 0.5, ZT - h1 - 0.5], [h1 + 0.5, ZT + h1 + 0.5], [-h1 - 0.5, ZT + h1 + 0.5]], y1 + 0.02, true, 2.4);
  // tier 2: the clock drum with volute buttresses on the diagonals
  const y2 = 35.6, R2 = 4.2;
  G.tube(P, M.yellow, 0, ZT, y1, y2, R2, R2, 24, 12, 2, A24);
  G.tube(P, M.white, 0, ZT, y1, y1 + 0.6, R2 * 1.04, R2 * 1.04, 24, 1, 1, { capTop: M.white });
  for (let i = 0; i < 4; i++) {
    const t = i * TAU / 4;
    P.push(Math.sin(t) * R2 * 0.992, 0, ZT + Math.cos(t) * R2 * 0.992, t);
    G.pane(P, M.clock, -1.25, 1.25, 31.0, 33.5, 0.07);
    P.extrude(M.white, ringShape(0, 32.25, 1.25, 1.55), 0, 0.14, 1, 20);
    P.pop();
    const td = t + TAU / 8;
    P.push(Math.sin(td) * R2, 0, ZT + Math.cos(td) * R2, td);
    P.push(0, 0, 0, -Math.PI / 2);                                           // a fin in the radial plane: local x = outwards
    G.solid(P, M.white, [[0, y1 + 0.6], [2.0, y1 + 0.6], [2.0, y1 + 1.5], [1.25, y1 + 2.2], [0.62, y1 + 3.6], [0.32, y1 + 5.4], [0.3, y2 - 0.3], [0, y2 - 0.3]], -0.42, 0.84);
    P.pop(); P.pop();
  }
  G.tube(P, M.white, 0, ZT, y2, y2 + 0.5, R2 * 1.1, R2 * 1.1, 24, 1, 1, { capTop: M.white, capBot: M.underside });
  // tier 3: the round upper belfry with paired columns on the diagonals
  const y3 = y2 + 0.5, y4 = 44.2, R3 = 3.4;
  G.tube(P, M.yellow, 0, ZT, y3, y4, R3, R3, 24, 12, 3, A24);
  for (let i = 0; i < 4; i++) {
    const t = i * TAU / 4;
    P.push(Math.sin(t) * R3 * 0.992, 0, ZT + Math.cos(t) * R3 * 0.992, t);
    S.archGlass(P, M.dark, 0, y3 + 1.3, 2.0, 5.0, 0.04); S.archFrame(P, M.white, 0, y3 + 1.3, 2.0, 5.0, 0.26, 0, 0.2);
    P.quad(M.balus, [-1.1, y3 + 1.3, 0.18], [1.1, y3 + 1.3, 0.18], [1.1, y3 + 2.25, 0.18], [-1.1, y3 + 2.25, 0.18], [0, 0, 1], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    P.box(M.white, -1.3, 1.3, y3 + 1.05, y3 + 1.3, 0, 0.36, 'k');
    P.pop();
    const td = t + TAU / 8;
    for (const dt of [-0.2, 0.2]) doric(P, M, Math.sin(td + dt) * (R3 + 0.42), ZT + Math.cos(td + dt) * (R3 + 0.42), y3, y4, 0.3);
  }
  G.tube(P, M.white, 0, ZT, y4, y4 + 0.45, R3 + 0.5, R3 + 0.5, 24, 1, 1); G.tube(P, M.white, 0, ZT, y4 + 0.45, y4 + 0.9, R3 + 0.95, R3 + 0.95, 24, 1, 1, { capTop: M.white, capBot: M.underside });
  G.tube(P, M.yellow, 0, ZT, y4 + 0.9, y4 + 2.1, R3 * 0.98, R3 * 0.98, 24, 12, 1);
  G.tube(P, M.white, 0, ZT, y4 + 2.1, y4 + 2.35, R3 * 1.06, R3 * 1.06, 24, 1, 1, { capTop: M.white, capBot: M.underside });
  const yd = y4 + 2.35, yl = yd + 4.2;
  G.lathe(P, M.dome, 'dome', DOME, 0, yd, ZT, 3.75, 4.3, 32, 14);
  // lantern, cap, orb and cross (57.5 m)
  G.tube(P, M.white, 0, ZT, yl - 0.25, yl + 2.5, 1.0, 1.0, 8, 1, 1);
  for (let i = 0; i < 4; i++) { const t = i * TAU / 4 + TAU / 16; P.push(Math.sin(t) * 0.925, 0, ZT + Math.cos(t) * 0.925, t); S.archGlass(P, M.dark, 0, yl + 0.35, 0.5, 1.6, 0.03); P.pop(); }
  G.tube(P, M.white, 0, ZT, yl + 2.5, yl + 2.7, 1.25, 1.25, 12, 1, 1, { capTop: M.white, capBot: M.underside });
  G.lathe(P, M.dome, 'dome', DOME, 0, yl + 2.7, ZT, 1.15, 1.0, 32, 14);
  finial(P, M, 0, yl + 3.7, ZT, 0.36, 2.3, Math.PI / 2);
}

/** a ring shape (annulus) in the facade plane: centre (cx, cy), inner / outer radius */
function ringShape(cx, cy, r0, r1) {
  const pts = [], hole = [];
  for (let i = 0; i < 24; i++) { const a = i * TAU / 24; pts.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); hole.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
  return G.shapeOf(pts, [hole]);
}
