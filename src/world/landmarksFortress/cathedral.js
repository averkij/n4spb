// landmarksFortress/cathedral.js - the PETER AND PAUL CATHEDRAL (Trezzini 1712-33): the yellow hall "ship" 61 x 27.5 m with its grey sheet roof, the west front with the portico and the two pairs of
// volutes, the three-tier bell tower, the gilded clock roof, the octagonal stone drum, the gilded crown, the small lantern, the 37 m gilded needle spire, the ball and the angel with the cross (122.5 m),
// the east dome on its octagonal drum and the curved east attic with the fresco.  Dossier docs/research/fortress.md sections 4, 7 (heights measured on the telephoto refs/fortress 044; west front 056).
// Frame (frame.js CATH): origin = the tower centre on the ground, local +x = U (to the altar, ENE), local +z = V (the south side); the building axis is z = AX.  Plan from the baked parts r3216746 / r2594681.
import * as THREE from 'three';
import * as G from './geo.js';
import * as S from './stucco.js';
import { goreGeo, domeProfile } from './domes.js';
import { CATH, cathW } from './frame.js';

const TAU = Math.PI * 2;
const AX = -0.3;                                   // the long axis of the building in the frame (OSM hall -15.2 .. 14.1, tower -3.7 .. 3.8)
const HW = 14.65;                                  // half width of the hall
export const LV = { eave: 19.4, ridge: 27.7, a: 30.1, b: 42.6, c0: 43.1, c: 54.1, roof: 61.0, drum: 67.1, crown: 72.6, lan: 77.5, spire: 114.5, ball: 115.3, top: 122.5 };
const X0 = -3.8, X1 = 51.5, XA = 59.4;             // west wall, east end of the hall, east end of the altar part
const FACES = [[0, 1], [0, -1], [1, 0], [-1, 0]];  // outward directions (x, z) of the four faces of a square in the frame

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const MS = { ...M, white: M.cream, whiteShade: M.creamShade, win36: M.glass, win24: M.glass, win12: M.glass, winBarred: M.glass, blue: M.yellow, blueDeep: M.yellowShade };
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] cathedral/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const face = (h, fx, fz, fn, cx = 0) => { P.push(cx + fx * h, 0, fz * h, Math.atan2(fx, fz)); try { fn(); } finally { P.pop(); } };
  /** cornice ring round a square of half size h (centre cx): three stepped bands, top at y + ht */
  const ring = (cx, h, y, proj, ht, mat = M.cream, shade = M.creamShade) => {
    P.box(shade, cx - h - proj * 0.45, cx + h + proj * 0.45, y, y + ht * 0.4, -h - proj * 0.45, h + proj * 0.45, 'b', 1);
    P.box(mat, cx - h - proj, cx + h + proj, y + ht * 0.4, y + ht, -h - proj, h + proj, '', 1);
  };
  const wallQ = (mat, x0, x1, y0, y1, z, nb) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);

  P.push(CATH.x, 0, CATH.z, CATH.rot); P.push(0, 0, AX, 0);
  // ================================================================== the hall
  stage('hall', () => {
    const H = LV.eave, hallBay = M.fac({ key: 'cathHall', H, bay: 6.9, wall: M.C.yellow, trim: M.C.cream, socle: '#9a958c', socleH: 1.3, glass: '#27323c', frame: '#e6e2d6', cornice: 1.5, lesene: 1.2,
      floors: [{ h: 13.6, win: 'rect', ww: 2.5, wh: 7.4, sill: 2.6, hood: 'ped', band: true }, { h: 3.0, win: 'none', band: false }] });
    const plain = M.fac({ key: 'cathPlain', H, bay: 6.9, wall: M.C.yellow, trim: M.C.cream, socle: '#9a958c', socleH: 1.3, cornice: 1.5, lesene: 1.2, floors: [{ h: 13.6, win: 'arch', ww: 1.6, wh: 4.2, sill: 2.4, band: true }, { h: 3.0, win: 'none', band: false }] });
    const L = X1 - X0, nb = 8;
    // long sides (south +z, north -z): 8 bays
    P.push(X0, 0, HW, 0); wallQ(hallBay, 0, L, 0, H, 0, nb); P.pop();
    P.push(X1, 0, -HW, Math.PI); wallQ(hallBay, 0, L, 0, H, 0, nb); P.pop();
    // altar part (narrower): its three faces + the returns of the hall
    const ha = 11.05;
    P.push(X1, 0, ha, 0); wallQ(plain, 0, XA - X1, 0, H, 0, 1); P.pop();
    P.push(XA, 0, -ha, Math.PI); wallQ(plain, 0, XA - X1, 0, H, 0, 1); P.pop();
    P.push(XA, 0, ha, Math.PI / 2); wallQ(plain, 0, 2 * ha, 0, H, 0, 3); P.pop();
    for (const s of [-1, 1]) { P.push(X1, 0, s * (s > 0 ? HW : ha), Math.PI / 2); wallQ(M.yellow, 0, HW - ha, 0, H, 0, 1); P.pop(); }
    // west wall, both sides of the tower front (the middle is the tower risalit)
    P.push(X0, 0, -HW, -Math.PI / 2); wallQ(plain, 0, HW - 4.7, 0, H, 0, 1); P.pop();
    P.push(X0, 0, 4.7, -Math.PI / 2); wallQ(plain, 0, HW - 4.7, 0, H, 0, 1); P.pop();
    // main cornice (a projecting slab round the hall) and the socle
    const corn = (x0, x1, z0, z1) => { P.box(M.creamShade, x0 - 0.35, x1 + 0.35, H - 0.5, H, z0 - 0.35, z1 + 0.35, 'b', 1); P.box(M.cream, x0 - 0.75, x1 + 0.75, H, H + 0.55, z0 - 0.75, z1 + 0.75, '', 1); };
    corn(X0, X1, -HW, HW); corn(X1, XA, -ha, ha);
    // roof: hipped at the east end, ridge 27.7 along the axis, butting against the tower in the west; the lower gabled roof of the altar part
    const yE = H + 0.55, yR = LV.ridge, xr = X1 - HW * 1.05, R = M.roofHall;
    P.fan(R, [[X0, yE, HW + 0.6], [X1 + 0.6, yE, HW + 0.6], [xr, yR, 0], [X0, yR, 0]], [0, 0.87, 0.5], (q) => [q[0] / 2.4, q[2] / 2.4 + q[1] / 3]);
    P.fan(R, [[X1 + 0.6, yE, -HW - 0.6], [X0, yE, -HW - 0.6], [X0, yR, 0], [xr, yR, 0]], [0, 0.87, -0.5], (q) => [q[0] / 2.4, q[2] / 2.4 + q[1] / 3]);
    P.fan(R, [[X1 + 0.6, yE, HW + 0.6], [X1 + 0.6, yE, -HW - 0.6], [xr, yR, 0]], [0.5, 0.87, 0], (q) => [q[2] / 2.4, q[0] / 2.4 + q[1] / 3]);
    const ya = yE + 3.6;
    P.fan(R, [[X1, yE, ha + 0.5], [XA + 0.5, yE, ha + 0.5], [XA + 0.5, ya, 0], [X1 - 4, ya, 0]], [0, 0.9, 0.4], (q) => [q[0] / 2.4, q[2] / 2.4]);
    P.fan(R, [[XA + 0.5, yE, -ha - 0.5], [X1, yE, -ha - 0.5], [X1 - 4, ya, 0], [XA + 0.5, ya, 0]], [0, 0.9, -0.4], (q) => [q[0] / 2.4, q[2] / 2.4]);
    // the curved east attic with the fresco of the two apostles before Christ
    const fres = M.tex(256, 256, 'fresco', (g, w, h) => {
      g.fillStyle = M.C.yellow; g.fillRect(0, 0, w, h); g.fillStyle = '#efe6c8'; g.beginPath(); g.ellipse(w / 2, h * 0.56, w * 0.36, h * 0.4, 0, 0, 6.3); g.fill();
      g.fillStyle = '#9fb7cf'; g.beginPath(); g.ellipse(w / 2, h * 0.56, w * 0.31, h * 0.35, 0, 0, 6.3); g.fill();
      for (const [cx, col] of [[0.5, '#c8553f'], [0.37, '#3f5f9a'], [0.63, '#c9a24b']]) { g.fillStyle = col; g.beginPath(); g.moveTo(w * cx - 18, h * 0.82); g.lineTo(w * cx - 10, h * 0.5); g.lineTo(w * cx + 10, h * 0.5); g.lineTo(w * cx + 18, h * 0.82); g.closePath(); g.fill(); g.fillStyle = '#e8c9a8'; g.beginPath(); g.arc(w * cx, h * 0.45, 9, 0, 6.3); g.fill(); g.fillStyle = 'rgba(240,210,120,0.55)'; g.beginPath(); g.arc(w * cx, h * 0.45, 14, 0, 6.3); g.fill(); }
    });
    const fm = ctx.mat.toon('#ffffff', { map: fres, name: 'lmFort-fresco', polygonOffset: -1 });
    P.push(XA, 0, 0, Math.PI / 2);
    const pts = [[-ha, H], [ha, H], [ha, H + 2.2]]; for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; pts.push([Math.cos(a) * ha * 0.82, H + 2.2 + Math.sin(a) * 5.4]); } pts.push([-ha, H + 2.2]);
    G.solid(P, M.yellow, pts, -0.5, 0.5, 3);
    P.quad(fm, [-3.6, H + 0.6, 0.03], [3.6, H + 0.6, 0.03], [3.6, H + 6.6, 0.03], [-3.6, H + 6.6, 0.03], [0, 0, 1]);
    G.frameRing(P, M.cream, pts.map((q) => [q[0] * 1.04, H + (q[1] - H) * 1.05]), pts.map((q) => [q[0] * 0.93, H + 0.45 + (q[1] - H) * 0.9]), 0, 0.22, 1);
    P.pop();
    // side porch (south): a small pedimented vestibule
    P.push(36.15, 0, HW, 0); P.box(M.yellow, -4.45, 4.45, 0, 7.2, 0, 4.9, 'bk', 3); P.box(M.cream, -4.75, 4.75, 7.2, 7.8, 0, 5.2, 'b', 1);
    P.fan(M.cream, [[-4.75, 7.8, 5.2], [4.75, 7.8, 5.2], [0, 9.9, 5.2]], [0, 0, 1]); P.fan(M.roofHall, [[-4.75, 7.8, 5.2], [0, 9.9, 5.2], [0, 9.9, 0], [-4.75, 7.8, 0]], [-0.4, 0.9, 0]); P.fan(M.roofHall, [[4.75, 7.8, 0], [0, 9.9, 0], [0, 9.9, 5.2], [4.75, 7.8, 5.2]], [0.4, 0.9, 0]);
    P.box(M.door, -1.1, 1.1, 0.3, 3.9, 4.9, 4.96, 'bk', 1); for (const sx of [-1, 1]) P.box(M.cream, sx * 3.6 - 0.4, sx * 3.6 + 0.4, 0, 7.2, 4.9, 5.1, 'bk', 1);
    P.pop();
    // colliders: the outline of the hall, altar and porch
    const cw = (lx0, lz0, lx1, lz1) => { const a = cathW(lx0, lz0 + AX), b = cathW(lx1, lz1 + AX); ph.addBox((a.x + b.x) / 2, (a.z + b.z) / 2, Math.hypot(b.x - a.x, b.z - a.z) + 0.4, 0.9, Math.atan2(-(b.z - a.z), b.x - a.x), -1, 28); };
    cw(X0, HW, X1, HW); cw(X0, -HW, X1, -HW); cw(X1, ha, XA, ha); cw(X1, -ha, XA, -ha); cw(XA, -ha, XA, ha); cw(X0, -HW, X0, HW); cw(X1, ha, X1, HW); cw(X1, -ha, X1, -HW);
    cw(31.7, HW + 4.9, 40.6, HW + 4.9); cw(31.7, HW, 31.7, HW + 4.9); cw(40.6, HW, 40.6, HW + 4.9);
  });

  // ================================================================== the west front: risalit, portico, volute screens
  stage('west', () => {
    const H = LV.eave, hr = 4.7;
    // the middle bay under the tower (flush with the tower's west face at x = -4.7)
    P.push(-hr, 0, -hr, -Math.PI / 2);
    P.quad(M.yellow, [0, 0, 0], [2 * hr, 0, 0], [2 * hr, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [3, 0], [3, 6], [0, 6]]);
    for (const x of [0.55, 2 * hr - 0.55]) P.box(M.cream, x - 0.55, x + 0.55, 1.3, H - 0.5, 0, 0.22, 'bk', 1);
    S.archWindow(P, MS, hr, 9.6, 2.4, 5.0, { mat: M.glass, b: 0.3 });
    P.box(M.door, hr - 1.25, hr + 1.25, 0.45, 4.6, 0, 0.08, 'bk', 1); P.box(M.cream, hr - 1.6, hr + 1.6, 4.6, 5.1, 0, 0.3, 'bk', 1);
    P.box(M.creamShade, -0.35, 2 * hr + 0.35, H - 0.5, H, 0, 0.35, 'b', 1); P.box(M.cream, -0.75, 2 * hr + 0.75, H, H + 0.55, 0, 0.75, 'b', 1);
    P.pop();
    for (const s of [-1, 1]) P.quad(M.yellow, [-hr, 0, s * hr], [X0, 0, s * hr], [X0, H, s * hr], [-hr, H, s * hr], [0, 0, s]);
    // pilasters of the side bays (3 a side) and their arched niches
    P.push(X0, 0, 0, -Math.PI / 2);
    for (const s of [-1, 1]) {
      for (const z of [5.4, 9.9, 14.1]) P.box(M.cream, s * z - 0.55, s * z + 0.55, 1.3, H - 0.5, 0, 0.2, 'bk', 1);
      for (const z of [7.65, 12.0]) { G.solid(P, M.creamShade, G.archPts(s * z, 2.2, 1.7, 5.0, 8), 0, 0.06, 1); S.archFrame(P, M.cream, s * z, 2.2, 1.7, 5.0, 0.25, 0, 0.14); }
    }
    P.pop();
    // the portico: six Tuscan columns in two triplets, entablature, an iron-railed balcony
    P.push(-hr, 0, 0, -Math.PI / 2);
    for (let k = 0; k < 3; k++) P.box(M.stoneGrey, -4.6 - (2 - k) * 0.35, 4.6 + (2 - k) * 0.35, 0, 0.15 * (k + 1), 0, 4.3 + (2 - k) * 0.35, 'b', 1);
    const col = (x, z) => { P.box(M.creamShade, x - 0.5, x + 0.5, 0.45, 0.75, z - 0.5, z + 0.5, 'b', 1); P.col(M.cream, x, z, 0.75, 6.35, 0.4, 0.34, 12, false); P.col(M.cream, x, z, 6.35, 6.55, 0.42, 0.5, 12, false); P.box(M.cream, x - 0.52, x + 0.52, 6.55, 6.75, z - 0.52, z + 0.52, 'b', 1); };
    for (const s of [-1, 1]) { for (const x of [1.6, 2.6, 3.6]) col(s * x, 3.75); col(s * 3.6, 1.9); }
    P.box(M.cream, -4.15, 4.15, 6.75, 7.9, 0, 4.3, 'b', 1); P.box(M.creamShade, -4.45, 4.45, 7.9, 8.2, 0, 4.6, '', 1);
    for (const [x0, x1, z0, z1] of [[-4.3, 4.3, 4.4, 4.48], [-4.38, -4.3, 0, 4.48], [4.3, 4.38, 0, 4.48]]) { P.box(M.iron, x0, x1, 8.2, 8.3, z0, z1, 'b', 1); P.box(M.iron, x0, x1, 9.2, 9.28, z0, z1, 'b', 1); }
    for (let i = 0; i <= 22; i++) P.box(M.iron, -4.3 + i * 8.6 / 22 - 0.02, -4.3 + i * 8.6 / 22 + 0.02, 8.3, 9.2, 4.42, 4.46, 'tb', 1);
    P.pop();
    // the volute screens: tier A (19.4 .. 30.1) spans the whole front, tier B (30.1 .. 42.6) sits on the tier A cornice
    const bez = (p0, p1, p2, p3, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; });
    const screen = (y0, y1, wBot, wTop, bulge) => {
      const r = [...bez([wBot, y0], [wBot, y0 + (y1 - y0) * 0.42], [wBot - bulge * 0.2, y0 + (y1 - y0) * 0.5], [wBot - bulge, y0 + (y1 - y0) * 0.5], 6), ...bez([wBot - bulge, y0 + (y1 - y0) * 0.5], [wTop + 0.6, y0 + (y1 - y0) * 0.5], [wTop, y0 + (y1 - y0) * 0.62], [wTop, y1], 6).slice(1)];
      const inn = wTop - 0.35;
      for (const s of [-1, 1]) { const w = [[inn, y0], ...r, [inn, y1]].map((q) => [s * q[0], q[1]]); G.solid(P, M.yellow, s > 0 ? w : w.reverse(), -0.9, 0.9, 3); }
      const edge = r.map((q) => [q[0] + 0.14, q[1]]), inner = r.map((q) => [q[0] - 0.42, q[1]]);
      for (const s of [-1, 1]) { const o = edge.map((q) => [s * q[0], q[1]]), ii = inner.map((q) => [s * q[0], q[1]]); G.solid(P, M.cream, s > 0 ? [...o, ...ii.slice().reverse()] : [...ii, ...o.slice().reverse()], -0.02, 0.12, 1); }
      for (const s of [-1, 1]) { const g = new THREE.TorusGeometry(0.85, 0.2, 5, 14, Math.PI * 1.6); P.geo(M.cream, g, s * (wBot - bulge * 0.55), y0 + (y1 - y0) * 0.27, 0.05, 0, 0, s > 0 ? -0.6 : Math.PI + 0.6 - Math.PI * 1.6); g.dispose(); }
    };
    P.push(-hr + 0.05, 0, 0, -Math.PI / 2);
    screen(H + 0.55, LV.a, HW - 0.3, 4.7, 5.4);
    screen(LV.a + 0.5, LV.b, 7.3, 4.5, 2.0);
    P.pop();
  });

  // ================================================================== the bell tower
  stage('tower', () => {
    const tier = (y0, y1, h, kind) => {
      P.box(M.yellow, -h, h, y0, y1, -h, h, 'b', 3);
      for (const [fx, fz] of FACES) face(h, fx, fz, () => {
        for (const sx of [-1, 1]) { P.box(M.cream, sx * (h - 0.55) - 0.5, sx * (h - 0.55) + 0.5, y0 + 0.9, y1 - 0.9, 0, 0.2, 'bk', 1); P.box(M.cream, sx * (h - 0.55) - 0.62, sx * (h - 0.55) + 0.62, y1 - 1.5, y1 - 0.9, 0, 0.3, 'bk', 1); }
        P.box(M.creamShade, -h, h, y0, y0 + 0.9, 0, 0.16, 'bk', 1);
        const ow = kind === 'bell' ? 2.2 : kind === 'a' ? 2.5 : 2.3, oh = kind === 'bell' ? 4.8 : kind === 'a' ? 5.0 : 4.6, oy = y0 + (y1 - y0) * (kind === 'bell' ? 0.3 : 0.26);
        if (kind === 'bell') {
          G.solid(P, M.dark, G.archPts(0, oy, ow, oh, 8), 0.02, 0.03, 1);
          P.col(M.bell, 0, 0.12, oy + 1.5, oy + 3.0, 0.75, 0.3, 10, false); P.col(M.bell, 0, 0.12, oy + 1.38, oy + 1.5, 0.82, 0.76, 10, true);
          S.archFrame(P, M.cream, 0, oy, ow, oh, 0.3, 0, 0.26);
          for (const [bx0, bx1] of [[-ow / 2, ow / 2]]) { P.box(M.iron, bx0, bx1, oy + 1.0, oy + 1.06, 0.2, 0.26, '', 1); for (let i = 0; i <= 6; i++) P.box(M.iron, bx0 + i * ow / 6 - 0.02, bx0 + i * ow / 6 + 0.02, oy, oy + 1.0, 0.21, 0.25, 'tb', 1); }
        } else {
          S.archWindow(P, MS, 0, oy, ow, oh, { mat: M.glass, b: 0.3 });
          if (fx === -1 && kind === 'a') { P.box(M.creamShade, -1.9, 1.9, oy - 0.5, oy - 0.25, 0, 1.0, '', 1); P.box(M.iron, -1.9, 1.9, oy + 0.7, oy + 0.76, 0.94, 1.0, '', 1); for (let i = 0; i <= 10; i++) P.box(M.iron, -1.9 + i * 0.38 - 0.02, -1.9 + i * 0.38 + 0.02, oy - 0.25, oy + 0.7, 0.95, 0.99, 'tb', 1); }
        }
        // pediment over the opening: triangular (tier A) or segmental
        const yt = oy + oh + 0.55, pw = ow * 0.95;
        if (kind === 'a') P.fan(M.cream, [[-pw, yt, 0.24], [pw, yt, 0.24], [0, yt + 1.2, 0.24]], [0, 0, 1]);
        else { const pts = [[-pw, yt]]; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([Math.cos(Math.PI - a) * pw, yt + Math.sin(a) * 0.75]); } G.solid(P, M.cream, pts, 0, 0.24, 1); }
        P.box(M.cream, -pw - 0.1, pw + 0.1, yt - 0.22, yt, 0, 0.32, 'bk', 1);
      });
      ring(0, h, y1 - 0.9, 0.62, 0.9);
    };
    tier(LV.eave, LV.a, 4.7, 'a');
    tier(LV.a, LV.b, 4.5, 'b');
    tier(LV.b, LV.c, 4.3, 'bell');
    // urn finials on the corners of the belfry cornice
    for (const [ax, az] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.urn(P, MS, ax * 4.6, LV.c, az * 4.6, 1.5);
  });

  // ================================================================== the gilded top: clock roof, drum, crown, lantern, spire, ball, angel
  stage('spire', () => {
    const y0 = LV.c, y1 = LV.roof, hb = 4.75, ap = 3.35;                 // square base half size -> octagon apothem
    // eight-pitched roof: 9 rings morphing from the square to the octagon, convex profile
    const rings = [], nr = 8;
    for (let k = 0; k <= nr; k++) {
      const t = k / nr, s = ap + (hb - ap) * Math.pow(Math.cos(t * Math.PI / 2), 0.85), c = 0.04 + (0.586 - 0.04) * Math.pow(t, 0.7), y = y0 + (y1 - y0) * Math.sin(t * Math.PI / 2) ** 0.9;
      const e = s * (1 - c);
      rings.push([[s, e], [e, s], [-e, s], [-s, e], [-s, -e], [-e, -s], [e, -s], [s, -e]].map((q) => [q[0], y, q[1]]));
    }
    for (let k = 0; k < nr; k++) for (let i = 0; i < 8; i++) {
      const a = rings[k][i], b = rings[k][(i + 1) % 8], c = rings[k + 1][(i + 1) % 8], d = rings[k + 1][i];
      const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, ml = Math.hypot(mx, mz) || 1, sl = (Math.hypot(a[0], a[2]) - Math.hypot(d[0], d[2])) / Math.max(0.05, d[1] - a[1]);
      P.quad(M.gold, a, b, c, d, [mx / ml, sl, mz / ml], [[0, k * 0.6], [2, k * 0.6], [2, k * 0.6 + 0.6], [0, k * 0.6 + 0.6]]);
    }
    // four clock dials in white stone frames
    const dial = M.tex(256, 256, 'dial', (g, w, h) => {
      g.fillStyle = '#f4f1e6'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 6.3); g.fill(); g.strokeStyle = '#1c1c1e'; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 12, 0, 6.3); g.stroke();
      g.lineWidth = 9; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * (w / 2 - 22), h / 2 - Math.cos(a) * (w / 2 - 22)); g.lineTo(w / 2 + Math.sin(a) * (w / 2 - 46), h / 2 - Math.cos(a) * (w / 2 - 46)); g.stroke(); }
      g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 44, h / 2 - 40); g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 22, h / 2 - 84); g.stroke();
      g.fillStyle = '#1c1c1e'; g.beginPath(); g.arc(w / 2, h / 2, 9, 0, 6.3); g.fill();
    });
    const dm = ctx.mat.toon('#ffffff', { map: dial, name: 'lmFort-dial', polygonOffset: -2 });
    for (const [fx, fz] of FACES) face(4.82, fx, fz, () => {
      const yc = y0 + 3.0;
      P.box(M.stoneGrey, -1.75, 1.75, y0 + 0.9, yc + 1.75, -1.6, 0.0, 'b', 1);
      const pts = [[-1.75, yc + 1.75]]; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([Math.cos(Math.PI - a) * 1.75, yc + 1.75 + Math.sin(a) * 0.8]); } G.solid(P, M.stoneGrey, pts, -1.6, 1.6, 1);
      const g = new THREE.CircleGeometry(1.2, 24), ua = g.attributes.uv, pa = g.attributes.position; for (let k = 0; k < pa.count; k++) ua.setXY(k, (pa.getX(k) + 1.2) / 2.4, (pa.getY(k) + 1.2) / 2.4);
      P.geo(dm, g, 0, yc, 0.03); g.dispose();
      const rg = new THREE.RingGeometry(1.2, 1.38, 24); P.geo(M.stoneGreyShade, rg, 0, yc, 0.04); rg.dispose();
    });
    // octagonal stone drum with eight arched openings
    const a0 = Math.PI / 8, Rd = ap / Math.cos(Math.PI / 8);
    G.frustum(P, M.stoneGrey, 0, 0, y1 - 0.2, LV.drum, 8, Rd, Rd, a0, 1, 1);
    for (let i = 0; i < 8; i++) {
      const t = a0 + i * TAU / 8, tm = t + TAU / 16;
      P.push(Math.sin(t) * Rd, 0, Math.cos(t) * Rd, t); P.box(M.stoneGreyShade, -0.2, 0.2, y1, LV.drum - 0.2, -0.2, 0.2, 'b', 1); P.pop();
      P.push(Math.sin(tm) * ap, 0, Math.cos(tm) * ap, tm); G.solid(P, M.dark, G.archPts(0, y1 + 1.0, 1.15, 3.6, 8), 0.02, 0.02, 1); S.archFrame(P, M.stoneGreyShade, 0, y1 + 1.0, 1.15, 3.6, 0.16, 0, 0.1); P.pop();
    }
    G.frustum(P, M.stoneGreyShade, 0, 0, LV.drum - 0.35, LV.drum, 8, Rd * 1.1, Rd * 1.1, a0, 1, 1); P.cap(M.stoneGreyShade, G.ngon(8, Rd * 1.1, a0), LV.drum, true, 3);
    // the gilded crown: an ogee octagonal dome
    const crown = [[1.0, 0], [1.0, 0.06], [0.97, 0.2], [0.88, 0.36], [0.74, 0.5], [0.62, 0.62], [0.55, 0.74], [0.52, 0.86], [0.51, 1.0]];
    P.geo(M.gold, goreGeo('crown', crown, 8, 0.02, 3), 0, LV.drum, 0, 0, a0, 0, 3.72, LV.crown - LV.drum, 3.72);
    // the small lantern (octagon 3.7 m) with narrow openings
    const Rl = 1.85 / Math.cos(Math.PI / 8);
    G.frustum(P, M.stoneGrey, 0, 0, LV.crown - 0.1, LV.lan - 0.5, 8, Rl, Rl, a0, 1, 1);
    for (let i = 0; i < 8; i++) { const tm = a0 + i * TAU / 8 + TAU / 16; P.push(Math.sin(tm) * 1.85, 0, Math.cos(tm) * 1.85, tm); G.solid(P, M.dark, G.archPts(0, LV.crown + 0.6, 0.6, 2.6, 6), 0.02, 0.02, 1); P.pop(); }
    G.frustum(P, M.stoneGreyShade, 0, 0, LV.lan - 0.5, LV.lan - 0.2, 8, Rl * 1.14, Rl * 1.14, a0, 1, 1); P.cap(M.stoneGreyShade, G.ngon(8, Rl * 1.14, a0), LV.lan - 0.2, true, 3);
    // the spire: octagonal needle with a flared foot, 37 m
    G.frustum(P, M.gold, 0, 0, LV.lan - 0.2, LV.lan + 1.6, 8, 2.05, 1.55, a0, 2, 1.5);
    G.frustum(P, M.gold, 0, 0, LV.lan + 1.6, LV.lan + 12, 8, 1.55, 1.12, a0, 2, 6);
    G.frustum(P, M.gold, 0, 0, LV.lan + 12, LV.lan + 24, 8, 1.12, 0.72, a0, 2, 6);
    G.frustum(P, M.gold, 0, 0, LV.lan + 24, LV.spire, 8, 0.72, 0.36, a0, 2, 6);
    { const g = new THREE.SphereGeometry(0.78, 14, 10); P.geo(M.goldFlat, g, 0, LV.ball, 0); g.dispose(); }
    // the cross (6.4 m) and the flying angel (3.2 m, wing span 3.8 m): a weather vane, the angel holds the cross with one hand and points up with the other
    const yb = LV.ball + 0.7;
    P.box(M.goldFlat, -0.07, 0.07, yb, LV.top, -0.07, 0.07, '', 1); P.box(M.goldFlat, -0.07, 0.07, LV.top - 1.5, LV.top - 1.36, -1.0, 1.0, '', 1);
    P.push(0, yb + 2.3, 0, 0);
    const g = M.goldFlat, tilt = -0.55;
    const E = (x, y, z, rx, ry, rz, zr = 0) => P.geo(g, sph, x, y, z, 0, 0, zr, rx, ry, rz);
    const sph = new THREE.SphereGeometry(1, 10, 8);
    E(0.95, 0.1, 0, 1.15, 0.36, 0.34, tilt);                             // robe / legs trailing behind
    E(0.25, 0.62, 0, 0.5, 0.36, 0.32, tilt);                             // torso
    E(-0.08, 1.06, 0, 0.22, 0.25, 0.22);                                 // head
    E(-0.1, 1.5, 0.06, 0.09, 0.55, 0.09, 0.12);                          // the arm pointing up along the cross
    E(-0.2, 0.75, -0.3, 0.42, 0.08, 0.08, 0.3);                          // the other arm
    for (const s of [-1, 1]) {                                           // wings swept back
      P.fan(g, [[0.25, 0.85, s * 0.2], [1.5, 1.75, s * 1.9], [1.9, 1.2, s * 1.5], [1.6, 0.6, s * 0.8], [0.7, 0.55, s * 0.25]], [0, 1, 0]);
      P.fan(g, [[0.25, 0.85, s * 0.2], [0.7, 0.55, s * 0.25], [1.6, 0.6, s * 0.8], [1.9, 1.2, s * 1.5], [1.5, 1.75, s * 1.9]], [0, -1, 0]);
    }
    sph.dispose(); P.pop();
  });

  // ================================================================== the east dome
  stage('dome', () => {
    const x = 40.5, a0 = Math.PI / 8, Rd = 5.35 / Math.cos(Math.PI / 8);
    G.frustum(P, M.yellow, x, 0, 23.0, 36.3, 8, Rd, Rd, a0, 2, 3);
    for (let i = 0; i < 8; i++) {
      const t = a0 + i * TAU / 8, tm = t + TAU / 16;
      P.push(x + Math.sin(t) * Rd, 0, Math.cos(t) * Rd, t); P.box(M.cream, -0.36, 0.36, 24, 35.6, -0.36, 0.36, 'b', 1); P.box(M.cream, -0.48, 0.48, 35.2, 35.8, -0.48, 0.48, 'b', 1); P.pop();
      P.push(x + Math.sin(tm) * 5.35, 0, Math.cos(tm) * 5.35, tm); S.archWindow(P, MS, 0, 28.2, 1.5, 5.0, { mat: M.glass, b: 0.22, sill: false }); P.pop();
    }
    G.frustum(P, M.cream, x, 0, 36.3, 36.9, 8, Rd * 1.1, Rd * 1.1, a0, 1, 1); P.cap(M.cream, G.ngon(8, Rd * 1.1, a0, x, 0), 36.9, true, 3);
    P.geo(M.roofHall, goreGeo('edome', domeProfile(0.3, 8, 0.05), 8, 0.03, 4), x, 36.9, 0, 0, a0, 0, 5.6, 5.9, 5.6);
    for (let i = 0; i < 8; i++) { const tm = a0 + i * TAU / 8 + TAU / 16; P.push(x + Math.sin(tm) * 4.9, 0, Math.cos(tm) * 4.9, tm); G.solid(P, M.cream, G.archPts(0, 37.6, 1.3, 2.0, 6), -0.5, 0.75, 1); G.solid(P, M.dark, G.archPts(0, 37.9, 0.7, 1.3, 6), 0.26, 0.02, 1); G.ball(P, M.goldFlat, 0, 39.9, 0.1, 0.16, 6); P.pop(); }
    const Rl = 1.9;
    G.frustum(P, M.stoneGrey, x, 0, 42.4, 46.0, 8, Rl, Rl, a0, 1, 1);
    for (let i = 0; i < 8; i++) { const tm = a0 + i * TAU / 8 + TAU / 16; P.push(x + Math.sin(tm) * Rl * 0.924, 0, Math.cos(tm) * Rl * 0.924, tm); G.solid(P, M.dark, G.archPts(0, 43.0, 0.6, 2.3, 6), 0.02, 0.02, 1); P.pop(); }
    G.frustum(P, M.stoneGreyShade, x, 0, 46.0, 46.3, 8, Rl * 1.18, Rl * 1.18, a0, 1, 1); P.cap(M.stoneGreyShade, G.ngon(8, Rl * 1.18, a0, x, 0), 46.3, true, 3);
    P.geo(M.gold, goreGeo('eonion', [[0.3, 0], [0.55, 0.03], [0.85, 0.12], [1.0, 0.26], [1.02, 0.4], [0.9, 0.56], [0.66, 0.7], [0.4, 0.82], [0.18, 0.92], [0.0, 1.0]], 8, 0.05, 4), x, 46.3, 0, 0, 0, 0, 2.3, 4.5, 2.3);
    G.ball(P, M.goldFlat, x, 51.0, 0, 0.28, 8); G.cross(P, M.goldFlat, x, 51.2, 0, 3.1, Math.PI / 2);
  });
  P.pop(); P.pop();

  // the tower is solid: one box (the portico columns are walk-through), monument + photo spots
  stage('services', () => {
    ph.addBox(CATH.x, CATH.z, 9.4, 9.4, CATH.rot, 0, 80);
    svc.monuments.push({ id: 'r2594681', name: 'Петропавловский собор', x: cathW(27, 0).x, z: cathW(27, 0).z, h: 122.5 });
    svc.cathedral = { tower: [CATH.x, CATH.z], height: LV.top, levels: LV };
    const sq = cathW(-45, 6), so = cathW(20, 60);
    svc.photoSpots.push({ x: sq.x, z: sq.z, yaw: K.ctx.L.yawToward(sq.x, sq.z, CATH.x, CATH.z), pitch: 28, name: 'Петропавловский собор с Соборной площади' }, { x: so.x, z: so.z, yaw: K.ctx.L.yawToward(so.x, so.z, CATH.x, CATH.z), pitch: 30, name: 'Собор со стороны Комендантского дома' });
    svc.entrances.push({ x: cathW(-9.6, 0).x, z: cathW(-9.6, 0).z, rotY: Math.atan2(-0.901, 0.434), kind: 'cathedral' });
    svc.crowd.push({ x: cathW(-22, 0).x, z: cathW(-22, 0).z, r: 9, n: 22, kind: 'photo' });
  });
  if (errs.length) throw new Error(errs.join('\n'));
}
