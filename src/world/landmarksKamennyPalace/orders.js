// landmarksKamennyPalace/orders.js - the architectural vocabulary of the module as Parts geometry (dossier docs/research/kamenny-2026.md 5.1; photos P04 P05 P08 P20 P22):
//   tuscan()       one smooth unfluted TUSCAN column (square plinth, torus, shaft with entasis, astragal, echinus, square abacus), built at the origin, y 0 = foot (the river colonnade, the court portico, the gate piers)
//   entabRing()    the wall entablature round a ring of edges (mitred bands): architrave, frieze (yellow metopes + white triglyph blocks), dentil band, corona, cymatium
//   balustrade()   the white roof balustrade along a straight run in a facade frame: piers every ~5.5 m, rails, the alpha sheet of turned balusters
//   hip()          a hipped roof over a rectangle (world / local frame), copper
// Columns are placed as separate small meshes (objs.js `put`) so that the engine classes them by size and hides the capitals at distance.
import * as THREE from 'three';
import { Q } from './facade.js';
import { band } from './kit.js';

export const TAU = Math.PI * 2;

const latheCache = new Map();
/** exact lathe (profile [[r, y]..], no resampling) placed at (x, y, z) */
export function latheRaw(P, mat, key, prof, x, y, z, sr = 1, sy = 1, seg = 20, rot = 0) {
  const k = `${key}|${seg}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z, 0, rot, 0, sr, sy, sr);
}

/** a Tuscan column of total height H (base 0.38 + shaft + capital 0.52), foot radius 0.46 * s.  mat = white */
export function tuscan(P, mat, H = 8.9, o = {}) {
  const s = o.s ?? 1, seg = o.seg ?? 18, baseH = 0.36 * s, capH = 0.52 * s, shH = H - baseH - capH;
  const r0 = 0.46 * s, r1 = 0.385 * s;
  P.box(mat, -0.62 * s, 0.62 * s, 0, 0.16 * s, -0.62 * s, 0.62 * s, 'b');                                           // plinth
  latheRaw(P, mat, `tbase|${s}`, [[0.57 * s, 0.16 * s], [0.6 * s, 0.2 * s], [0.6 * s, 0.26 * s], [0.56 * s, 0.31 * s], [0.5 * s, 0.34 * s], [0.46 * s, 0.36 * s]], 0, 0, 0, 1, 1, seg);
  const prof = [[r0, 0], [r0 * 1.01, shH * 0.12], [r0 * 0.985, shH * 0.35], [(r0 + r1) / 2 * 1.0, shH * 0.6], [r1 + (r0 - r1) * 0.2, shH * 0.85], [r1, shH]];
  latheRaw(P, mat, `tshaft|${s}|${shH.toFixed(2)}`, prof, 0, baseH, 0, 1, 1, seg);
  const yc = baseH + shH;
  latheRaw(P, o.capMat || mat, `tcap|${s}`, [[0.36 * s, 0], [0.40 * s, 0.01 * s], [0.405 * s, 0.05 * s], [0.375 * s, 0.07 * s], [0.375 * s, 0.13 * s], [0.43 * s, 0.17 * s], [0.52 * s, 0.24 * s], [0.58 * s, 0.31 * s], [0.57 * s, 0.34 * s], [0.0, 0.34 * s]], 0, yc, 0, 1, 1, seg);
  P.box(mat, -0.66 * s, 0.66 * s, yc + 0.34 * s, yc + capH, -0.66 * s, 0.66 * s, '');                              // abacus
}

/**
 * the entablature of a ring of edges (mitred): y0 = the bottom of the architrave.  M: white, wall (the frieze field), dentil, shade (the soffit).  Heights: architrave 0.45, frieze 0.8, dentil 0.25, corona 0.35, cymatium 0.15.
 * Returns the top y.  `proj` multiplies the projections (1 = main cornice, 0.7 for small buildings).
 */
export function entabRing(P, M, edges, y0, o = {}) {
  const k = o.proj ?? 1, draw = o.draw, hA = o.arch ?? 0.45, hF = o.frieze ?? 0.8, hD = o.dentil ?? 0.25, hC = o.corona ?? 0.35, hY = o.cyma ?? 0.15;
  let y = y0;
  band(P, edges, y, y + hA, 0.14 * k, { front: M.white, top: M.white, under: M.shade }, { draw, uvs: 3 }); y += hA;
  band(P, edges, y, y + hF, 0.06 * k, { front: M.wall, top: null, under: null }, { draw, uvs: 3 }); y += hF;
  band(P, edges, y, y + hD, 0.30 * k, { front: M.dentil, top: null, under: M.shade }, { draw, uvs: 1.02 }); y += hD;
  band(P, edges, y, y + hC, 0.72 * k, { front: M.white, top: M.white, under: M.shade }, { draw, uvs: 3 }); y += hC;
  band(P, edges, y, y + hY, 0.58 * k, { front: M.white, top: M.white, under: null }, { draw, uvs: 3 }); y += hY;
  return y;
}

/** triglyph-like blocks on the frieze of one facade edge in the facade frame: white blocks 0.3 x 0.62 with three grooves, every ~1.1 m, between x0 and x1 */
export function triglyphs(P, M, x0, x1, y, o = {}) {
  const pitch = o.pitch ?? 1.1, hh = o.h ?? 0.62, z = o.proud ?? 0.1, n = Math.max(1, Math.round((x1 - x0) / pitch));
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * (x1 - x0) / n;
    P.box(M.white, x - 0.15, x + 0.15, y, y + hh, 0, 0.06 + z, 'kb', 1);
    for (const gx of [-0.06, 0.06]) P.box(M.shade, x + gx - 0.012, x + gx + 0.012, y + 0.03, y + hh - 0.05, 0.06 + z, 0.06 + z + 0.004, 'kb', 1);
  }
}

/** a white balustrade run along x at depth z (base y) in a facade frame: piers every `step` m (and at both ends), rails and the sheet M.balust.  o.noStart / o.noEnd leave an end pier to the neighbouring run */
export function balustrade(P, M, x0, x1, y, z, o = {}) {
  const h = o.h ?? 1.0, step = o.step ?? 5.5, len = x1 - x0, n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    if ((i === 0 && o.noStart) || (i === n && o.noEnd)) continue;
    const x = x0 + len * i / n;
    P.box(M.white, x - 0.3, x + 0.3, y, y + h + 0.18, z - 0.3, z + 0.3, 'b', 2);
    P.box(M.white, x - 0.36, x + 0.36, y + h + 0.18, y + h + 0.3, z - 0.36, z + 0.36, 'b', 2);                 // the cap slab
  }
  const a = o.noStart ? x0 : x0 - 0.3, b = o.noEnd ? x1 : x1 + 0.3;
  P.box(M.white, a, b, y + h - 0.08, y + h + 0.06, z - 0.1, z + 0.1, 'b', 2);                                    // the handrail
  P.box(M.white, a, b, y, y + 0.14, z - 0.1, z + 0.1, 'b', 2);                                                  // the foot rail
  const cnt = Math.max(1, Math.round(len / 1.8)), k = len / cnt;
  for (let i = 0; i < cnt; i++) Q(P, M.balust, [x0 + k * i + 0.02, y + 0.14, z], [x0 + k * (i + 1) - 0.02, y + 0.14, z], [x0 + k * (i + 1) - 0.02, y + h - 0.08, z], [x0 + k * i + 0.02, y + h - 0.08, z], [0, 0, 1]);
}

/** a hipped roof over the rectangle x0..x1, z0..z1 (frame of the current Parts transform), eave height ye, ridge height yr, uniform pitch (the ridge runs along the longer side, shortened by the hips).  Returns { ridge: [[x,z],[x,z]], yr } */
export function hip(P, mat, x0, x1, z0, z1, ye, yr, uvs = 1.24, ridgeMat = null) {
  const along = (x1 - x0) >= (z1 - z0), w = along ? z1 - z0 : x1 - x0, L = along ? x1 - x0 : z1 - z0, half = w / 2, rise = yr - ye;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rl = Math.max(0, L / 2 - half);
  const R0 = along ? [cx - rl, yr, cz] : [cx, yr, cz - rl], R1 = along ? [cx + rl, yr, cz] : [cx, yr, cz + rl];
  const A = [x0, ye, z0], B = [x1, ye, z0], C = [x1, ye, z1], D = [x0, ye, z1];
  const uv = (p) => [p[0] / uvs, (along ? p[2] * Math.hypot(1, rise / half) : p[0] * Math.hypot(1, rise / half)) / uvs];
  const face = (pts, n) => { const q = pts.map(uv); if (pts.length === 4) P.quad(mat, pts[0], pts[1], pts[2], pts[3], n, q); else P.fan(mat, pts, n, (p) => uv(p)); };
  const sl = rise / half, nl = Math.hypot(1, sl);
  if (along) {
    face([A, B, [R1[0], yr, R1[2]], [R0[0], yr, R0[2]]], [0, 1 / nl, -sl / nl]);                   // north-ish slope (z0 side): normal tilts toward -z
    face([C, D, [R0[0], yr, R0[2]], [R1[0], yr, R1[2]]], [0, 1 / nl, sl / nl]);
    if (rl > 0.01) { face([D, A, [R0[0], yr, R0[2]]], [-sl / nl, 1 / nl, 0]); face([B, C, [R1[0], yr, R1[2]]], [sl / nl, 1 / nl, 0]); }
    else { face([D, A, [R0[0], yr, R0[2]]], [-sl / nl, 1 / nl, 0]); face([B, C, [R1[0], yr, R1[2]]], [sl / nl, 1 / nl, 0]); }
  } else {
    face([D, A, [R0[0], yr, R0[2]], [R1[0], yr, R1[2]]], [-sl / nl, 1 / nl, 0]);
    face([B, C, [R1[0], yr, R1[2]], [R0[0], yr, R0[2]]], [sl / nl, 1 / nl, 0]);
    face([A, B, [R0[0], yr, R0[2]]], [0, 1 / nl, -sl / nl]);
    face([C, D, [R1[0], yr, R1[2]]], [0, 1 / nl, sl / nl]);
  }
  if (ridgeMat) {                                                                                       // the ridge and the four hips as thin seam rolls (the roof reads as a hipped roof from afar)
    const rr = 0.1, e = (a, b) => P.cyl(ridgeMat, a, b, rr, rr, 4, false);
    if (rl > 0.01) e(R0, R1);
    e(R0, along ? A : A), e(R0, along ? D : B); e(R1, along ? B : C); e(R1, along ? C : D);
  }
  return { ridge: [[R0[0], R0[2]], [R1[0], R1[2]]], yr };
}
