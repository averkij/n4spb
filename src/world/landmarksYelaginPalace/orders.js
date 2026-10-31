// landmarksYelaginPalace/orders.js - the Corinthian order of the palace as Parts geometry (dossier 5.2, 5.3; photos pal_01 lion_05 lion_07 pal_07).
//   corinthian()  one smooth column with an Attic base (plinth, two tori), a shaft with entasis and a Corinthian capital (two rows of acanthus leaves, four volutes, abacus): built at the origin, y 0 = foot
//   entablature() architrave + frieze + dentil cornice along a straight run in a facade frame (x along the wall, z out)
//   pediment()    the triangular tympanum with a raking dentil cornice
//   balustrade()  a lattice run (posts + the textured bar panel M.lattice)
// Columns are placed as separate small meshes (objs.js) so that the engine classes them by size and hides the capitals at distance.
import * as THREE from 'three';

export const TAU = Math.PI * 2;

const latheCache = new Map();
/** exact lathe (profile [[r, y]..], no resampling) placed at (x, y, z) */
export function latheRaw(P, mat, key, prof, x, y, z, sr = 1, sy = 1, seg = 20, rot = 0) {
  const k = `${key}|${seg}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z, 0, rot, 0, sr, sy, sr);
}

const SHAFT = [[0.50, 0.0], [0.505, 0.4], [0.498, 1.2], [0.485, 2.2], [0.47, 3.2], [0.45, 4.2], [0.43, 5.0], [0.415, 5.8]];       // entasis: r over y (the shaft is built from y0)

/**
 * a Corinthian column, smooth shaft, total height H (base 0.46 + shaft + capital 1.2).  mat = white.  s = size scale of the section (1 = D 0.95 m).
 * facing = rotation of the abacus about y (radial columns of the rotunda).
 */
export function corinthian(P, mat, H = 7.4, o = {}) {
  const s = o.s ?? 1, seg = o.seg ?? 20, capH = 1.2 * s, baseH = 0.46 * s, shH = H - capH - baseH, rot = o.rot ?? 0;
  const r0 = 0.5 * s;
  // base: plinth block, lower torus, scotia, upper torus
  P.box(mat, -0.68 * s, 0.68 * s, 0, 0.22 * s, -0.68 * s, 0.68 * s, 'b');
  latheRaw(P, mat, `cbase|${s}`, [[0.62 * s, 0.22 * s], [0.65 * s, 0.27 * s], [0.65 * s, 0.34 * s], [0.6 * s, 0.38 * s], [0.52 * s, 0.38 * s], [0.52 * s, 0.4 * s], [0.57 * s, 0.42 * s], [0.58 * s, 0.46 * s], [0.5 * s, 0.46 * s]], 0, 0, 0, 1, 1, seg);
  // shaft with entasis: a lathe through the SHAFT profile scaled to shH
  const prof = SHAFT.map(([r, y]) => [r * s, baseH + y / 5.8 * shH]);
  prof.push([0.4 * s, baseH + shH]);
  latheRaw(P, mat, `cshaft|${s}|${shH.toFixed(2)}`, prof, 0, 0, 0, 1, 1, seg);
  // astragal + necking
  const yc = baseH + shH;
  latheRaw(P, o.bellMat || mat, `ccap|${s}`, [[0.4 * s, 0.0], [0.43 * s, 0.03 * s], [0.44 * s, 0.07 * s], [0.41 * s, 0.1 * s], [0.4 * s, 0.14 * s],
    [0.41 * s, 0.4 * s], [0.45 * s, 0.7 * s], [0.52 * s, 0.9 * s], [0.56 * s, 0.98 * s], [0.0, 0.98 * s]], 0, yc, 0, 1, 1, seg);
  // acanthus: two rows of 8 leaves.  A leaf is a strip of four quads flaring outward (r, y per row), three lobed tips and a raised midrib; the second row stands between the first and higher
  const leaf = (ang, r0, y0, rise, flare, hw, droop) => {
    const c = Math.cos(ang), sn = Math.sin(ang);
    const pt = (rr, y, lat) => [c * rr - sn * lat, yc + y, sn * rr + c * lat];     // radial direction (c, sn), lateral (-sn, c)
    const n = [c, 0.3, sn];
    const rows = [[r0, y0, hw * 0.8], [r0 + flare * 0.25, y0 + rise * 0.35, hw], [r0 + flare * 0.65, y0 + rise * 0.7, hw * 1.12], [r0 + flare, y0 + rise, hw * 1.05]];
    for (let k = 0; k + 1 < rows.length; k++) {
      const a = rows[k], b = rows[k + 1];
      P.quad(mat, pt(a[0], a[1], -a[2]), pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(b[0], b[1], -b[2]), n);
    }
    const t = rows[3], tipR = t[0] + droop;
    for (const [lat, up] of [[-t[2] * 0.62, 0.02], [0, 0.1], [t[2] * 0.62, 0.02]]) {
      const w2 = t[2] * 0.4;
      P.fan(mat, [pt(t[0], t[1], lat - w2), pt(t[0], t[1], lat + w2), pt(tipR, t[1] + up * s, lat)], n);
    }
    const rib = [pt(rows[0][0] + 0.01, rows[0][1] + 0.02, 0), pt(rows[3][0] + 0.02, rows[3][1] + 0.0, 0)];
    P.cyl(mat, rib[0], rib[1], 0.022 * s, 0.014 * s, 4, false);
  };
  for (let i = 0; i < 8; i++) leaf(i * TAU / 8 + rot, 0.42 * s, 0.12 * s, 0.42 * s, 0.2 * s, 0.15 * s, 0.07 * s);
  for (let i = 0; i < 8; i++) leaf((i + 0.5) * TAU / 8 + rot, 0.46 * s, 0.4 * s, 0.5 * s, 0.2 * s, 0.14 * s, 0.07 * s);
  // volutes (helices): a horn from the bell to each abacus corner ending in a curl (a torus facing outward) and a boss; a flower boss in the middle of every abacus side
  for (let i = 0; i < 4; i++) {
    const a = rot + Math.PI / 4 + i * TAU / 4, c = Math.cos(a), sn = Math.sin(a);
    P.cyl(mat, [c * 0.5 * s, yc + 0.6 * s, sn * 0.5 * s], [c * 0.66 * s, yc + 0.9 * s, sn * 0.66 * s], 0.05 * s, 0.075 * s, 6, false);
    const tg = new THREE.TorusGeometry(0.1 * s, 0.034 * s, 4, 9); P.geo(mat, tg, c * 0.66 * s, yc + 0.9 * s, sn * 0.66 * s, 0.9, -a + Math.PI / 2, 0); tg.dispose();
    const bg = new THREE.SphereGeometry(0.05 * s, 5, 4); P.geo(mat, bg, c * 0.7 * s, yc + 0.9 * s, sn * 0.7 * s); bg.dispose();
    const a2 = rot + i * TAU / 4, c2 = Math.cos(a2), s2 = Math.sin(a2);
    const fg = new THREE.SphereGeometry(0.07 * s, 5, 4); P.geo(mat, fg, c2 * 0.6 * s, yc + 1.0 * s, s2 * 0.6 * s); fg.dispose();
  }
  // abacus: a slab with chamfered corners, concave sides ignored
  const ab = 0.7 * s, ch = 0.16 * s;
  const q = [[-ab + ch, -ab], [ab - ch, -ab], [ab, -ab + ch], [ab, ab - ch], [ab - ch, ab], [-ab + ch, ab], [-ab, ab - ch], [-ab, -ab + ch]];
  const cr = Math.cos(rot), sr = Math.sin(rot), rp = (p) => [p[0] * cr - p[1] * sr, p[0] * sr + p[1] * cr];
  const y0 = yc + 0.96 * s, y1 = yc + 1.2 * s;
  for (let i = 0; i < 8; i++) {
    const a = rp(q[i]), b = rp(q[(i + 1) % 8]), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [dz / l, 0, -dx / l]);
  }
  P.fan(mat, q.map((p) => { const r = rp(p); return [r[0], y1, r[1]]; }), [0, 1, 0]);
  P.fan(mat, q.map((p) => { const r = rp(p); return [r[0], y0, r[1]]; }), [0, -1, 0]);
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

/** architrave (three fasciae) + frieze + cornice: a continuous entablature over the columns.  y = the bottom (top of the capitals), zc = z of the column axis, zb = the wall plane.  Returns the top y. */
export function entablature(P, M, x0, x1, y, zc, zb, o = {}) {
  const zf = zc + 0.62;                                                                                  // the architrave face stands 0.12 m forward of the capital abacus
  P.box(M.white, x0, x1, y, y + 0.45, zb, zf, o.closed ? '' : 'b', 3);                                    // architrave (o.closed: its bottom face is drawn = the soffit of a run that has no portico ceiling of its own; without it the open box shows the sky from below)
  P.box(M.white, x0, x1, y + 0.28, y + 0.32, zb, zf + 0.04, 'k', 3); P.box(M.white, x0, x1, y + 0.41, y + 0.45, zb, zf + 0.07, 'k', 3);      // the fascia lines
  P.box(M.white, x0, x1, y + 0.45, y + 0.95, zb, zf - 0.04, '', 3);                                       // frieze (plain)
  const top = cornice(P, M, x0, x1, y + 0.95, zf + 0.62, zb, o);
  return top;
}

/** the soffit (the ceiling of the portico) as a plain quad with a coffer grid line every 1.6 m */
export function soffit(P, M, x0, x1, y, z0, z1) {
  P.quad(M.dark, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, -1, 0]);
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

/** a lattice balustrade run along x at depth z (base y): posts every `step` m, the bar panel between (M.lattice, one quad double sided), top rail.  o.noStart / o.noEnd leave the end post (and the rail extension)
 *  to the neighbouring run, so that two runs meeting at a corner share ONE post (no coplanar duplicates). */
export function balustrade(P, M, x0, x1, y, z, o = {}) {
  const h = o.h ?? 1.0, step = o.step ?? 1.8, len = x1 - x0, n = Math.max(1, Math.round(len / step));
  const mat = o.mat || M.whiteFlat;
  for (let i = 0; i <= n; i++) {
    if ((i === 0 && o.noStart) || (i === n && o.noEnd)) continue;
    const x = x0 + len * i / n;
    P.box(mat, x - 0.06, x + 0.06, y, y + h + 0.06, z - 0.06, z + 0.06, 'b', 1);
    P.box(mat, x - 0.08, x + 0.08, y + h + 0.06, y + h + 0.1, z - 0.08, z + 0.08, 'b', 1);              // finial cap
  }
  const a = o.noStart ? x0 : x0 - 0.06, b = o.noEnd ? x1 : x1 + 0.06;
  P.box(mat, a, b, y + h - 0.05, y + h + 0.03, z - 0.045, z + 0.045, 'b', 1);                             // top rail
  P.box(mat, a, b, y, y + 0.1, z - 0.045, z + 0.045, 'b', 1);                                              // foot rail
  const k = len / n;
  for (let i = 0; i < n; i++) P.quad(M.lattice, [x0 + k * i + 0.06, y + 0.06, z], [x0 + k * (i + 1) - 0.06, y + 0.06, z], [x0 + k * (i + 1) - 0.06, y + h - 0.02, z], [x0 + k * i + 0.06, y + h - 0.02, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
