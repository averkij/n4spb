// landmarksKamennyTheatre/orders.js - the architectural vocabulary of the theatre as Parts geometry (dossier docs/research/kamenny-2026.md 5.3; photos T03 T05 T06 T11 T13):
//   corinthian()   one smooth CORINTHIAN column (square plinth, attic base with two tori, shaft with entasis, necking, a bell with two rows of acanthus leaves and four corner volutes, abacus), foot at y 0
//   entabRing()    the entablature round a ring of edges (mitred bands): architrave, plain frieze (boards), dentil band, corona, cymatium; the same ring runs along the long walls and the portico
//   balustrade()   the white balustrade along a straight run in a facade frame: piers, rails, the alpha sheet of turned balusters
//   rake()         one raking cornice of a pediment: a fascia band, a projecting corona and the sloped dentils (extruded parallelograms), plus the dentil row of the horizontal cornice
// Columns: the shaft is built into the shell collector (P), the capital leaves into the near collector (N).
import * as THREE from 'three';
import { Q } from './facade.js';
import { band } from './kit.js';
import { ball } from './geo.js';

export const TAU = Math.PI * 2;

const latheCache = new Map();
/** exact lathe (profile [[r, y]..], no resampling) placed at (x, y, z) */
export function latheRaw(P, mat, key, prof, x, y, z, sr = 1, sy = 1, seg = 20, rot = 0) {
  const k = `${key}|${seg}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z, 0, rot, 0, sr, sy, sr);
}

/** the column: total height H (base 0.5 + shaft + capital 1.2), foot radius 0.55.  Shaft + base + bell in P, leaves + volutes in N.  mat = white */
export function corinthian(P, N, mat, x, z, H = 9.6, seg = 20) {
  const baseH = 0.5, capH = 1.25, shH = H - baseH - capH, r0 = 0.52, r1 = 0.44;
  P.push(x, 0, z, 0);
  P.box(mat, -0.74, 0.74, 0, 0.2, -0.74, 0.74, 'b');                                                                   // plinth
  latheRaw(P, mat, 'cbase', [[0.66, 0.2], [0.7, 0.24], [0.7, 0.3], [0.64, 0.35], [0.6, 0.38], [0.62, 0.41], [0.62, 0.46], [0.57, 0.5]], 0, 0, 0, 1, 1, seg);
  const prof = [[r0, 0], [r0 * 1.01, shH * 0.1], [r0 * 0.99, shH * 0.35], [(r0 + r1) / 2, shH * 0.62], [r1 + (r0 - r1) * 0.18, shH * 0.87], [r1, shH]];
  latheRaw(P, mat, `cshaft|${shH.toFixed(2)}`, prof, 0, baseH, 0, 1, 1, seg);
  const yn = baseH + shH;                                                                                                 // the necking (astragal) and the bell
  latheRaw(P, mat, 'ccap', [[0.5, 0], [0.54, 0.02], [0.55, 0.08], [0.5, 0.11], [0.5, 0.16], [0.56, 0.3], [0.64, 0.5], [0.72, 0.72], [0.78, 0.92], [0.77, 1.0], [0.0, 1.0]], 0, yn, 0, 1, 1, seg);
  P.box(mat, -0.78, 0.78, yn + 1.0, yn + capH, -0.78, 0.78, '');                                                          // abacus
  // acanthus: two rows of eight curled leaves (each a 5-station strip folded on a central rib, tip drooping outward) and four corner volutes with a diagonal scroll stem (near detail)
  N.push(x, 0, z, 0);
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 8; i++) {
      const t = i * TAU / 8 + (row ? TAU / 16 : 0), c = Math.cos(t), s = Math.sin(t);
      const yb = yn + 0.1 + row * 0.34, rb = 0.5 + row * 0.1, hh = 0.5 + row * 0.2, wb = row ? 0.3 : 0.36, ST = 5;
      const st = [];
      for (let k = 0; k <= ST; k++) {
        const u = k / ST, r = rb + 0.04 * u + (0.1 + row * 0.1) * u * u * u + 0.1 * u * (row ? 0.4 : 1), y = yb + hh * u - 0.07 * u * u * u;
        const w = wb * (0.45 + 0.55 * Math.sin(Math.PI * (0.2 + 0.8 * u))) * (1 - 0.35 * u), rib = 0.05 * (1 - u * 0.5);
        st.push({ r, y, w, rib });
      }
      const pt = (q, side) => { const rr = q.r + (side === 0 ? q.rib : 0), off = side * q.w / 2; return [c * rr - s * off, q.y, s * rr + c * off]; };
      for (let k = 0; k < ST; k++) for (const side of [-1, 1]) {
        N.quad(mat, pt(st[k], 0), pt(st[k + 1], 0), pt(st[k + 1], side), pt(st[k], side), [c, 0.45, s]);
      }
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    ball(N, mat, sx * 0.68, yn + 0.86, sz * 0.68, 0.11, 6);
    N.cyl(mat, [sx * 0.5, yn + 0.45, sz * 0.5], [sx * 0.66, yn + 0.82, sz * 0.66], 0.07, 0.09, 5, false);
  }
  N.pop();
  P.pop();
}

/**
 * the entablature of a ring of edges (mitred): y0 = the bottom of the architrave.  M: white, boards (the frieze field), dentil, shade (the soffit).
 * Heights: architrave 0.45, frieze 0.35, dentil 0.25, corona 0.3, cymatium 0.12 (1.47 in all).  Returns the top y.
 */
export function entabRing(P, M, edges, y0, o = {}) {
  const draw = o.draw, hA = 0.45, hF = 0.35, hD = 0.25, hC = 0.3, hY = 0.12;
  let y = y0;
  band(P, edges, y, y + hA, 0.14, { front: M.white, top: M.white, under: M.shade }, { draw, uvs: 3 }); y += hA;
  band(P, edges, y, y + hF, 0.06, { front: M.boards, top: null, under: null }, { draw, uvs: 3.2 }); y += hF;
  band(P, edges, y, y + hD, 0.5, { front: M.dentil, top: null, under: M.shade }, { draw, uvs: 1.02 }); y += hD;
  band(P, edges, y, y + hC, 0.95, { front: M.white, top: M.white, under: M.shade }, { draw, uvs: 3 }); y += hC;
  band(P, edges, y, y + hY, 0.83, { front: M.white, top: M.white, under: null }, { draw, uvs: 3 }); y += hY;
  return y;
}

/** a white balustrade run along x at depth z (base y) in a facade frame: piers every `step` m (and at both ends), rails and the sheet M.balust */
export function balustrade(P, M, x0, x1, y, z, o = {}) {
  const h = o.h ?? 1.0, step = o.step ?? 4.0, len = x1 - x0, n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    if ((i === 0 && o.noStart) || (i === n && o.noEnd)) continue;
    const x = x0 + len * i / n;
    P.box(M.white, x - 0.22, x + 0.22, y, y + h + 0.12, z - 0.22, z + 0.22, 'b', 2);
    P.box(M.white, x - 0.27, x + 0.27, y + h + 0.12, y + h + 0.22, z - 0.27, z + 0.27, 'b', 2);
  }
  const a = o.noStart ? x0 : x0 - 0.22, b = o.noEnd ? x1 : x1 + 0.22;
  P.box(M.white, a, b, y + h - 0.08, y + h + 0.06, z - 0.1, z + 0.1, 'b', 2);
  P.box(M.white, a, b, y, y + 0.14, z - 0.1, z + 0.1, 'b', 2);
  const cnt = Math.max(1, Math.round(len / 1.8)), k = len / cnt;
  for (let i = 0; i < cnt; i++) Q(P, M.balust, [x0 + k * i + 0.02, y + 0.14, z], [x0 + k * (i + 1) - 0.02, y + 0.14, z], [x0 + k * (i + 1) - 0.02, y + h - 0.08, z], [x0 + k * i + 0.02, y + h - 0.08, z], [0, 0, 1]);
}

/** a parallelogram with vertical sides between the slope lines (x0, ya0)-(x1, ya1) (top) and the same lowered by `th` (bottom), as a Shape extruded z0 .. z0 + depth */
function slab(P, mat, x0, x1, ya0, ya1, th, z0, depth) {
  const sh = new THREE.Shape(); sh.moveTo(x0, ya0 - th); sh.lineTo(x1, ya1 - th); sh.lineTo(x1, ya1); sh.lineTo(x0, ya0); sh.lineTo(x0, ya0 - th);
  P.extrude(mat, sh, z0, depth, 1, 4);
}
/**
 * the raking cornices of a pediment in a facade frame (x across, y up, z out): the eave corners (+-hw, y0), the apex (0, y1) of the TOP of the raking cornice.  Fascia band A (th 0.55, proud 0.45),
 * corona B (th 0.34, proud 0.85) and sloped dentil blocks under A (0.2 x 0.26, every 0.46 m along the slope).  `dent`: collector for the small blocks (N).
 */
export function rake(P, Nn, M, hw, y0, y1) {
  for (const s of [-1, 1]) {
    const xa = s * hw, xb = 0, k = (y1 - y0) / hw;                                    // slope dy/dx magnitude
    const lo = s < 0 ? [xa, xb] : [xb, xa], ya = (x) => y1 - Math.abs(x) * k;
    slab(P, M.white, lo[0], lo[1], ya(lo[0]), ya(lo[1]), 0.55, 0, 0.45);
    slab(P, M.white, lo[0], lo[1], ya(lo[0]), ya(lo[1]), 0.34, 0, 0.85);
    slab(P, M.shade, lo[0], lo[1], ya(lo[0]) - 0.0, ya(lo[1]) - 0.0, 0.55, -0.02, 0.02);
    const L = Math.hypot(hw, y1 - y0), n = Math.floor(L / 0.46);
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.5) / n - 0.22 / n * 0.5 * 0, x = s * hw * (1 - (i + 0.5) / n), wdt = 0.2;
      const xx0 = x - wdt / 2, xx1 = x + wdt / 2, a0 = ya(xx0) - 0.55, a1 = ya(xx1) - 0.55;
      const sh = new THREE.Shape(); sh.moveTo(xx0, a0 - 0.28); sh.lineTo(xx1, a1 - 0.28); sh.lineTo(xx1, a1); sh.lineTo(xx0, a0); sh.lineTo(xx0, a0 - 0.28);
      Nn.extrude(M.white, sh, 0, 0.4, 1, 4); void t0;
    }
  }
}
