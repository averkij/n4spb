// landmarksYelaginServices/orders.js - the Doric order of the Stable colonnade and the cornice / pediment vocabulary of the Rossi service buildings (dossier docs/research/yelagin-palace-2026.md 6.3; photos stb_01 stb_03 stb_06 stb_07 stb_11).
//   doric()      one column: plain lower third (the lower 1.6 m are smooth, upper two thirds carry 20 flutes: stb_01 / stb_06), slight entasis, necking, echinus, square abacus; built at the origin, y 0 = the floor
//   cornice()    dentil + corona cornice of a straight run (copy of the palace helper);  entablatureD() architrave + plain frieze + dentil cornice;  pediment()  raking dentil cornice (copy)
import * as THREE from 'three';

export const TAU = Math.PI * 2;

const latheCache = new Map();
/** exact lathe (profile [[r, y]..], no resampling) placed at (x, y, z) */
export function latheRaw(P, mat, key, prof, x, y, z, sr = 1, sy = 1, seg = 20, rot = 0) {
  const k = `${key}|${seg}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z, 0, rot, 0, sr, sy, sr);
}


/** fluted shaft section: n flutes, arris radius r0 at y0 -> r1 at y1, flute depth d, `rings` rings (entasis); flat shaded quads */
function fluted(P, mat, y0, y1, r0, r1, n = 20, rings = 2, d = 0.036) {
  const pts = (k) => {
    const t = k / rings, r = r0 + (r1 - r0) * t + 0.015 * Math.sin(t * Math.PI), y = y0 + (y1 - y0) * t, out = [];
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n, b = (i + 0.5) * TAU / n;
      out.push([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(b) * (r - d), y, Math.sin(b) * (r - d)]);
    }
    return out;
  };
  const rowsA = [];
  for (let k = 0; k <= rings; k++) rowsA.push(pts(k));
  for (let k = 0; k < rings; k++) {
    const a = rowsA[k], b = rowsA[k + 1], m = a.length;
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m, nx = (a[i][0] + a[j][0]) / 2, nz = (a[i][2] + a[j][2]) / 2;
      P.quad(mat, a[i], a[j], b[j], b[i], [nx, 0, nz], [[i / m * 4, k / rings], [(i + 1) / m * 4, k / rings], [(i + 1) / m * 4, (k + 1) / rings], [i / m * 4, (k + 1) / rings]]);
    }
  }
}

/** a Doric column of the Stable colonnade, total height H (default 4.9 m), lower diameter 2 * r0 (0.92 m).  y 0 = the floor, built around the origin. */
export function doric(P, mat, H = 4.9, o = {}) {
  const r0 = o.r0 ?? 0.46, plainH = o.plain ?? 1.62, capH = 0.5, abH = 0.2, neckY = H - capH, r1 = r0 * 0.84, seg = o.seg ?? 20;
  // plain lower third: a lathe-like cylinder (slightly swelling)
  P.cyl(mat, [0, 0, 0], [0, plainH, 0], r0 * 1.0, r0 * 1.0, seg, false);
  // the fluted upper shaft with entasis
  fluted(P, mat, plainH, neckY - 0.08, r0, r1, 20, 3);
  // necking ring + echinus (flaring quarter round) + abacus
  P.cyl(mat, [0, neckY - 0.08, 0], [0, neckY, 0], r1 * 0.97, r1 * 0.97, seg, false);
  const ech = [[r1 * 0.97, neckY], [r1 * 1.0, neckY + 0.04], [r1 * 1.08, neckY + 0.12], [r1 * 1.25, neckY + 0.22], [r1 * 1.45, neckY + 0.28], [r1 * 1.55, neckY + 0.3]];
  for (let i = 0; i + 1 < ech.length; i++) P.cyl(mat, [0, ech[i][1], 0], [0, ech[i + 1][1], 0], ech[i][0], ech[i + 1][0], seg, i + 2 === ech.length);
  const ab = r1 * 1.6, y0 = H - abH, y1 = H;
  P.box(mat, -ab, ab, y0 + 0.1, y1, -ab, ab, '', 1);
  P.box(mat, -ab * 0.97, ab * 0.97, y0, y0 + 0.1, -ab * 0.97, ab * 0.97, 'b', 1);
  return H;
}

/** architrave (plain, 0.5 m) + frieze (0.6 m) + dentil cornice over a run x0..x1: y = the bottom (top of the abaci), zc = z of the column axis, zb = z of the back wall plane; returns the top y */
export function entablatureD(P, M, x0, x1, y, zc, zb, o = {}) {
  const zf = zc + 0.62;
  P.box(M.white, x0, x1, y, y + 0.5, zb, zf, o.closed ? '' : 'b', 3);
  P.box(M.white, x0, x1, y + 0.5, y + 1.1, zb, zf - 0.04, '', 3);
  return cornice(P, M, x0, x1, y + 1.1, zf + 0.5, zb, o);
}

/** the dentil + corona cornice of a straight run, in a facade frame.  x0..x1 along, ycor = bottom of the cornice, zf = how far the corona projects (z of its front), zb = z of the wall behind.
 *  Returns the top y.  Materials: M.white (blocks), M.dark (the soffit shadow line). */
export function cornice(P, M, x0, x1, y, zf, zb, o = {}) {
  const dent = o.dentil !== false, hBed = 0.12, hDen = 0.2, hCor = 0.24, hCym = 0.14;
  P.box(M.white, x0, x1, y, y + hBed, zb, zf - 0.34, 'b', 3);                                          // bed mould
  let yy = y + hBed;
  if (dent) {
    P.box(M.dark, x0, x1, yy, yy + hDen, zb, zf - 0.30, '', 3);                                         // dark core: the gaps between the teeth
    const n = Math.max(1, Math.floor((x1 - x0) / 0.3));
    for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; P.box(M.white, x - 0.095, x + 0.095, yy, yy + hDen, zb, zf - 0.26, 'bk', 3); }
  } else P.box(M.white, x0, x1, yy, yy + hDen, zb, zf - 0.3, '', 3);
  yy += hDen;
  P.box(M.white, x0, x1, yy, yy + hCor, zb, zf, 'b', 3);                                               // the corona (overhang)
  P.quad(M.white, [x0, yy, zf], [x1, yy, zf], [x1, yy, zf - 0.3], [x0, yy, zf - 0.3], [0, -1, 0]);        // its underside
  yy += hCor;
  P.box(M.white, x0, x1, yy, yy + hCym, zb, zf - 0.06, 'b', 3);                                         // cymatium
  return yy + hCym;
}

/** a triangular pediment on a straight front: tympanum from x0 to x1 at depth zt, base y, apex y + rise.  The raking cornice is a dentil run along both slopes. */
export function pediment(P, M, x0, x1, y, rise, zf, zt) {
  const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2, slope = Math.atan2(rise, hw), len = Math.hypot(hw, rise);
  // the tympanum: a triangle at depth zt (recessed), plus the slab behind it
  P.fan(M.white, [[x0 + 0.2, y, zt], [x1 - 0.2, y, zt], [xm, y + rise - 0.2, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
  P.fan(M.white, [[x0, y, zt - 0.5], [xm, y + rise + 0.0, zt - 0.5], [x1, y, zt - 0.5]], [0, 0, 1]);
  // the raking cornice: for each slope a sloped bar (corona + cymatium) and a dentil strip under it; built from rotated boxes
  for (const sgn of [-1, 1]) {
    const cx = xm + sgn * hw / 2, cy = y + rise / 2;
    const rz = sgn * -slope;                                                                              // the left slope rises to the apex: rotate about z
    const proj = zf - zt;
    const bar = new THREE.BoxGeometry(len + 0.5, 0.3, proj + 0.1);
    P.geo(M.white, bar, cx, cy + 0.12, zt + proj / 2 - 0.02, 0, 0, sgn < 0 ? slope : -slope); bar.dispose();
    const strip = new THREE.BoxGeometry(len + 0.3, 0.2, proj - 0.1);
    P.geo(M.white, strip, cx + (sgn < 0 ? 0.0 : 0.0), cy - 0.08, zt + (proj - 0.1) / 2, 0, 0, sgn < 0 ? slope : -slope); strip.dispose();
    const n = Math.floor(len / 0.34), dg = new THREE.BoxGeometry(0.17, 0.22, proj - 0.2);
    const ux = Math.cos(sgn < 0 ? slope : -slope), uy = Math.sin(sgn < 0 ? slope : -slope);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; P.geo(M.white, dg, cx + t * len * ux, cy - 0.27 + t * len * uy * (sgn < 0 ? 1 : 1), zt + (proj - 0.2) / 2 + 0.02, 0, 0, sgn < 0 ? slope : -slope); }
    dg.dispose();
    void rz;
  }
}
