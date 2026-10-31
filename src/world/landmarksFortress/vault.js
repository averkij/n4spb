// landmarksFortress/vault.js - the GRAND DUCAL BURIAL VAULT (Grimm, Tomishko, Benois 1896-1908) north-east of the cathedral and the gallery that joins them (baked parts of r2594692; dossier
// docs/research/fortress.md section 7; photos refs/fortress 044 crop, 047, 050, 061-065): a square block of yellow plaster and pale grey stone with rounded attic gables, an octagonal drum, the big
// maroon-brown ribbed dome with gilded ribs and lucarnes, a gilded lantern with a small dome, onion and cross (about 49 m); low annexes; the one-storey gallery with the west entrance pavilion.
// Frame = the cathedral frame (frame.js CATH: +x = U to the east, +z = V to the south); the block stands at x 83.7 .. 103.5, z -34.8 .. -15.0.
import * as G from './geo.js';
import * as S from './stucco.js';
import { goreGeo, domeProfile } from './domes.js';
import { CATH, cathW, byId, pairs } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
export function build(K) {
  const { P, M, ctx, svc } = K;
  const MS = { ...M, white: M.stoneGrey, whiteShade: M.stoneGreyShade, win36: M.glass, win24: M.glass, win12: M.glass };
  const cx = 93.6, cz = -24.9, h = 9.9, H = 13.6;
  P.push(CATH.x, 0, CATH.z, CATH.rot);
  // ---- the block: four identical faces (pilasters, a tall arched window, a rounded attic gable)
  P.box(M.yellow, cx - h, cx + h, 0, H, cz - h, cz + h, 'b', 3);
  P.box(M.stoneGrey, cx - h - 0.15, cx + h + 0.15, 0, 1.6, cz - h - 0.15, cz + h + 0.15, 'b', 2);
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    P.push(cx + fx * h, 0, cz + fz * h, Math.atan2(fx, fz));
    for (const x of [-9.0, -5.2, 5.2, 9.0]) { P.box(M.stoneGrey, x - 0.6, x + 0.6, 1.6, H - 1.0, 0, 0.28, 'bk', 1); P.box(M.stoneGreyShade, x - 0.72, x + 0.72, H - 1.6, H - 1.0, 0, 0.38, 'bk', 1); }
    S.archWindow(P, MS, 0, 3.4, 3.2, 7.2, { mat: M.glass, b: 0.34 });
    for (const x of [-7.1, 7.1]) S.archWindow(P, MS, x, 4.2, 1.5, 4.6, { mat: M.glass, b: 0.22 });
    P.box(M.stoneGreyShade, -h - 0.3, h + 0.3, H - 1.0, H - 0.5, 0, 0.45, 'b', 1); P.box(M.stoneGrey, -h - 0.6, h + 0.6, H - 0.5, H, 0, 0.8, 'b', 1);
    const pts = [[-5.6, H]]; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; pts.push([-Math.cos(a) * 5.6, H + Math.sin(a) * 3.4]); }
    G.solid(P, M.yellow, pts, -1.2, 1.2, 3); G.frameRing(P, M.stoneGrey, pts.map((q) => [q[0] * 1.06, H + (q[1] - H) * 1.08]), pts.map((q) => [q[0] * 0.9, H + 0.4 + (q[1] - H) * 0.84]), 0, 0.2, 1);
    { const g = new (K.THREE.CircleGeometry)(1.1, 14); P.geo(M.glass, g, 0, H + 1.5, 0.03); g.dispose(); const rg = new (K.THREE.RingGeometry)(1.1, 1.35, 14); P.geo(M.stoneGrey, rg, 0, H + 1.5, 0.05); rg.dispose(); }
    P.pop();
  }
  P.cap(M.roofGrey, [[cx - h, cz - h], [cx + h, cz - h], [cx + h, cz + h], [cx - h, cz + h]], H + 0.02, true, 3);
  // ---- octagonal drum, the maroon dome with gilded ribs and lucarnes
  const a0 = Math.PI / 8, Rd = 8.3 / Math.cos(Math.PI / 8), y1 = 21.6;
  G.frustum(P, M.yellow, cx, cz, H, y1, 8, Rd, Rd, a0, 2, 2);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, tm = t + TAU / 16;
    P.push(cx + Math.sin(t) * Rd, 0, cz + Math.cos(t) * Rd, t); P.box(M.stoneGrey, -0.45, 0.45, H, y1 - 0.4, -0.45, 0.45, 'b', 1); P.pop();
    P.push(cx + Math.sin(tm) * 8.3, 0, cz + Math.cos(tm) * 8.3, tm); S.archWindow(P, MS, 0, H + 1.6, 1.8, 3.6, { mat: M.glass, b: 0.24, sill: false }); P.pop();
  }
  G.frustum(P, M.stoneGrey, cx, cz, y1, y1 + 0.7, 8, Rd * 1.08, Rd * 1.08, a0, 1, 1); P.cap(M.stoneGrey, G.ngon(8, Rd * 1.08, a0, cx, cz), y1 + 0.7, true, 3);
  const yd = y1 + 0.7, Rdm = 8.6, hd = 10.4;
  P.geo(M.maroon, goreGeo('vault', domeProfile(0.27, 9, 0.05), 8, 0.03, 5), cx, yd, cz, 0, a0, 0, Rdm, hd, Rdm);
  for (let i = 0; i < 8; i++) {                                           // gilded ribs along the gore seams + lucarnes on the gores
    const t = a0 + i * TAU / 8, tm = t + TAU / 16, prof = domeProfile(0.27, 9, 0.05);
    for (let k = 0; k + 1 < prof.length; k++) P.cyl(M.goldFlat, [cx + Math.sin(t) * prof[k][0] * Rdm * 1.005, yd + prof[k][1] * hd, cz + Math.cos(t) * prof[k][0] * Rdm * 1.005], [cx + Math.sin(t) * prof[k + 1][0] * Rdm * 1.005, yd + prof[k + 1][1] * hd, cz + Math.cos(t) * prof[k + 1][0] * Rdm * 1.005], 0.14, 0.14, 4, false);
    if (i % 2 === 0) { P.push(cx + Math.sin(tm) * Rdm * 0.86, 0, cz + Math.cos(tm) * Rdm * 0.86, tm); G.solid(P, M.goldFlat, G.archPts(0, yd + 2.4, 1.9, 2.8, 8), -1.0, 1.0, 1); G.solid(P, M.dark, G.archPts(0, yd + 2.8, 1.1, 1.8, 8), 0.01, 0.03, 1); P.pop(); }
  }
  // ---- the gilded lantern: columns round a glazed drum, a small gilded dome, the onion and the cross
  const yl = yd + hd * 0.96, Rl = 2.5;
  P.col(M.goldFlat, cx, cz, yl - 0.2, yl + 0.4, Rl * 1.25, Rl * 1.2, 12, true);
  G.frustum(P, M.stoneGrey, cx, cz, yl + 0.4, yl + 5.2, 8, Rl, Rl, a0, 1, 1);
  for (let i = 0; i < 8; i++) { const t = a0 + i * TAU / 8, tm = t + TAU / 16; P.col(M.goldFlat, cx + Math.sin(t) * (Rl + 0.2), cz + Math.cos(t) * (Rl + 0.2), yl + 0.4, yl + 5.2, 0.2, 0.17, 6, false); P.push(cx + Math.sin(tm) * Rl * 0.924, 0, cz + Math.cos(tm) * Rl * 0.924, tm); G.solid(P, M.dark, G.archPts(0, yl + 1.0, 0.9, 3.4, 6), 0.02, 0.02, 1); P.pop(); }
  P.col(M.goldFlat, cx, cz, yl + 5.2, yl + 5.7, Rl * 1.25, Rl * 1.25, 12, true);
  P.geo(M.gold, goreGeo('vdome2', domeProfile(0.3, 7, 0.05), 8, 0.03, 4), cx, yl + 5.7, cz, 0, a0, 0, Rl * 1.12, 2.6, Rl * 1.12);
  P.col(M.goldFlat, cx, cz, yl + 8.1, yl + 9.4, 0.7, 0.55, 8, false);
  P.geo(M.gold, goreGeo('vonion', [[0.3, 0], [0.6, 0.04], [0.9, 0.16], [1.0, 0.32], [0.96, 0.5], [0.72, 0.7], [0.42, 0.84], [0.16, 0.94], [0.0, 1.0]], 8, 0.05, 4), cx, yl + 9.4, cz, 0, 0, 0, 1.25, 2.6, 1.25);
  G.ball(P, M.goldFlat, cx, yl + 12.15, cz, 0.22, 8); G.cross(P, M.goldFlat, cx, yl + 12.3, cz, 2.6, Math.PI / 2);
  // ---- annexes (west 75.7 .. 83.7, east 103.4 .. 110.1): lower stone-and-plaster wings
  for (const [x0, x1] of [[75.7, 83.7], [103.5, 110.1]]) { P.box(M.yellow, x0, x1, 0, 8.6, cz - h, cz + h, 'b', 3); P.box(M.stoneGrey, x0 - 0.3, x1 + 0.3, 8.6, 9.2, cz - h - 0.3, cz + h + 0.3, 'b', 1); P.box(M.stoneGrey, x0 - 0.1, x1 + 0.1, 0, 1.6, cz - h - 0.1, cz + h + 0.1, 'bt', 2); for (const s of [-1, 1]) { P.push((x0 + x1) / 2, 0, cz + s * h, s > 0 ? 0 : Math.PI); S.archWindow(P, MS, 0, 3.0, 1.6, 3.8, { mat: M.glass, b: 0.22 }); P.pop(); } }
  // ---- the gallery to the cathedral (one storey, grey stone base, yellow wall, arched windows) on its baked ring, the west entrance pavilion
  P.pop();
  const gal = byId('r3243814');
  if (gal) {
    const mat = M.fac({ key: 'gallery', H: 7.2, bay: 3.6, wall: M.C.yellow, trim: '#c8c5bc', socle: '#b9b6ae', socleH: 1.3, floors: [{ h: 5.3, win: 'arch', ww: 1.5, wh: 3.4, sill: 0.8 }], cornice: 0.7 });
    for (const poly of gal.polys) {
      const o = pairs(poly.o), n = o.length;
      let area = 0; for (let i = 0; i < n; i++) { const q = o[(i + 1) % n]; area += o[i][0] * q[1] - q[0] * o[i][1]; }
      for (let i = 0; i < n; i++) {
        const a = o[i], b = o[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.3) continue;
        const sg = area > 0 ? 1 : -1, nx = (b[1] - a[1]) / len * sg, nz = -(b[0] - a[0]) / len * sg, nb = Math.max(1, Math.round(len / 3.6));
        // the edges on the cathedral wall and on the vault annex are party walls: skip them
        const m = [(a[0] + b[0]) / 2 + nx * 0.6, (a[1] + b[1]) / 2 + nz * 0.6], lc = { lx: (m[0] - CATH.x) * 0.901 + (m[1] - CATH.z) * -0.434, lz: (m[0] - CATH.x) * 0.434 + (m[1] - CATH.z) * 0.901 };
        if ((lc.lz > -15.6 && lc.lx > 30 && lc.lx < 44) || (lc.lx > 75.2 && lc.lz < -20 && lc.lz > -35)) continue;
        P.quad(len < 2 ? M.yellow : mat, sg > 0 ? [a[0], 0, a[1]] : [b[0], 0, b[1]], sg > 0 ? [b[0], 0, b[1]] : [a[0], 0, a[1]], sg > 0 ? [b[0], 7.2, b[1]] : [a[0], 7.2, a[1]], sg > 0 ? [a[0], 7.2, a[1]] : [b[0], 7.2, b[1]], [nx, 0, nz], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
      }
      P.cap(M.roofGrey, o, 7.22, true, 3, poly.h.map(pairs));
      addPolyColliders(ctx, poly, 0, 9, 0.8);
    }
  }
  // colliders of the block and the annexes, services
  const c = cathW(92.9, cz + 0), rot = CATH.rot;
  for (const [lx, lz, w, d] of [[92.9, cz - h, 34.4, 0.8], [92.9, cz + h, 34.4, 0.8], [75.7, cz, 0.8, 19.8], [110.1, cz, 0.8, 19.8]]) { const p = cathW(lx, lz); ctx.physics.addBox(p.x, p.z, w, d, rot, -1, 16); }
  svc.monuments.push({ id: 'r2594692', name: 'Великокняжеская усыпальница', x: cathW(cx, cz).x, z: cathW(cx, cz).z, h: 49 });
  svc.vault = { x: c.x, z: c.z, top: yl + 14.9 };
}
