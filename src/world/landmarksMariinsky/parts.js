// landmarksMariinsky/parts.js - small shared pieces for the landmarksMariinsky buildings: lathe bodies (onion domes, cupolas), gilded crosses, rings of columns / windows around a drum, iron fences with granite posts,
// a classical portico (columns + entablature + pediment) in the current facade frame, and a stucco material cache.  Everything draws through the kit's Parts collector `K.P` (see kit.js).
import * as THREE from 'three';

const geoCache = new Map();
/** LatheGeometry of a profile [[r, y], ...] (unit sizes), cached by key */
export function latheGeo(key, pts, seg = 18) {
  const k = key + '|' + seg;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  return geoCache.get(k);
}
/** place a lathe body: base centre (x, y, z), radius scale sr, height scale sy */
export function lathe(K, mat, key, pts, x, y, z, sr = 1, sy = 1, seg = 18) {
  K.P.geo(mat, latheGeo(key, pts, seg), x, y, z, 0, 0, 0, sr, sy, sr);
}
// onion dome of a Russian church: unit radius 1 at the belly, height ~ 2.35 (neck to the tip)
const ONION = [[0, 0], [0.62, 0], [0.8, 0.12], [1.0, 0.36], [1.06, 0.66], [0.98, 1.0], [0.74, 1.35], [0.42, 1.72], [0.17, 2.05], [0.05, 2.28], [0, 2.36]];
// helmet-like flatter dome (the central dome of the Vladimirsky cathedral, the belfry dome)
const DOME = [[0, 0], [0.98, 0], [1.0, 0.1], [0.97, 0.38], [0.86, 0.66], [0.66, 0.9], [0.4, 1.06], [0.15, 1.15], [0, 1.18]];
const CUP = [[0, 0], [1, 0], [0.98, 0.22], [0.9, 0.5], [0.72, 0.76], [0.45, 0.94], [0.18, 1.02], [0, 1.05]];
export const onion = (K, mat, x, y, z, r, sy = 1) => lathe(K, mat, 'onion', ONION, x, y, z, r, r * sy, 20);
export const dome = (K, mat, x, y, z, r, sy = 1) => lathe(K, mat, 'dome', DOME, x, y, z, r, r * sy, 24);
export const cup = (K, mat, x, y, z, r, sy = 1) => lathe(K, mat, 'cup', CUP, x, y, z, r, r * sy, 20);

/** a gilded Orthodox-style cross of height h standing at (x, y, z) (the user rule is only "no flags": crosses on the domes are real) */
export function cross(K, mat, x, y, z, h) {
  const P = K.P, t = Math.max(0.05, h * 0.028);
  P.box(mat, x - t, x + t, y, y + h, z - t, z + t, 'b');
  P.box(mat, x - h * 0.17, x + h * 0.17, y + h * 0.62, y + h * 0.62 + t * 1.6, z - t * 0.8, z + t * 0.8, '');
  P.box(mat, x - h * 0.11, x + h * 0.11, y + h * 0.82, y + h * 0.82 + t * 1.4, z - t * 0.8, z + t * 0.8, '');
  P.box(mat, x - h * 0.13, x + h * 0.13, y + h * 0.28, y + h * 0.28 + t * 1.4, z - t * 0.8, z + t * 0.8, '');
  P.cyl(mat, [x, y - 0.02, z], [x, y + h * 0.12, z], t * 3.2, t * 1.4, 8, false);
}
/** drum / cylinder wall */
export const drum = (K, mat, x, z, y0, y1, r, seg = 24) => K.P.cyl(mat, [x, y0, z], [x, y1, z], r, r, seg, false);

/** run fn(frame) with the model frame at a point on a circle (z axis pointing outwards) */
export function onRing(K, cx, cz, R, ang, fn) {
  const nx = Math.sin(ang), nz = Math.cos(ang);
  K.P.push(cx + nx * R, 0, cz + nz * R, ang);
  try { fn(); } finally { K.P.pop(); }
}
/** n windows around a drum of radius R (flat quads on the facets, 24-gon: facet radius = R * cos(pi / 24)) */
export function ringWindows(K, cx, cz, R, n, o, phase = 0, seg = 24) {
  const Rf = R * Math.cos(Math.PI / seg);
  for (let i = 0; i < n; i++) onRing(K, cx, cz, Rf, phase + (i / n) * Math.PI * 2, () => K.window(o));
}
/** n columns around a circle of radius R at (cx, cz) from y0 to y1 */
export function colRing(K, mat, cx, cz, y0, y1, R, n, r, o = {}, phase = 0) {
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    K.column(mat, cx + Math.sin(a) * R, cz + Math.cos(a) * R, y0, y1, r, { volutes: false, seg: 10, ...o });
  }
}
/** a ring-shaped cornice (round entablature): a few stacked cylinders */
export function roundCornice(K, mat, matShade, cx, cz, y, R, h = 1.2) {
  const P = K.P;
  P.cyl(mat, [cx, y, cz], [cx, y + h * 0.35, cz], R, R, 28, true);
  P.cyl(mat, [cx, y + h * 0.35, cz], [cx, y + h * 0.7, cz], R * 1.03, R * 1.03, 28, true);
  P.cyl(matShade, [cx, y + h * 0.7, cz], [cx, y + h, cz], R * 1.07, R * 1.07, 28, true);
}

/** cached stucco materials by hex */
export function wallMats(K) { return { wall: K.wall, rust: K.rust }; }

/**
 * Iron fence along a polyline of world points [[x, z], ...]: granite posts every ~`gap` m with a ball / spear finial, two rails and vertical pickets (spears).
 * o = { h, post (hex), iron (hex), gap, base (granite plinth height) }.  Instance-free: ~10 triangles per picket box, so keep the polylines short.
 */
export function fence(K, pts, o = {}) {
  const P = K.P, h = o.h ?? 1.7, gap = o.gap ?? 3.2, base = o.base ?? 0.0;
  const iron = o.ironMat || K.mat(o.iron || '#1d2a24'), post = o.postMat || K.mats.graniteWarm;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.3) continue;
    const rot = Math.atan2(dx, dz) - Math.PI / 2;                               // local +x along the segment: rotation of the frame so that +x -> (dx, dz)
    P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
    const n = Math.max(1, Math.round(len / gap)), step = len / n;
    if (base > 0) P.box(post, 0, len, 0, base, -0.2, 0.2, 'b');
    for (let k = 0; k <= n; k++) {
      const x = k * step;
      P.box(post, x - 0.2, x + 0.2, 0, h + 0.15, -0.2, 0.2, 'b');
      P.box(post, x - 0.26, x + 0.26, h + 0.15, h + 0.3, -0.26, 0.26, 'b');
      P.cyl(post, [x, h + 0.3, 0], [x, h + 0.62, 0], 0.17, 0.04, 6, false);
    }
    P.box(iron, 0, len, base + h - 0.22, base + h - 0.16, -0.025, 0.025, '');
    P.box(iron, 0, len, base + 0.28, base + 0.34, -0.025, 0.025, '');
    const m = Math.max(2, Math.round(len / 0.2));
    for (let k = 1; k < m; k++) {
      const x = (k / m) * len; if (Math.abs(x / step - Math.round(x / step)) * step < 0.2) continue;
      P.box(iron, x - 0.012, x + 0.012, base + 0.05, base + h - 0.05, -0.012, 0.012, 'bt');
      P.cyl(iron, [x, base + h - 0.05, 0], [x, base + h + 0.16, 0], 0.03, 0.002, 4, false);
    }
    P.pop();
    void rot;
  }
}

/**
 * Classical portico in the facade frame (x along the wall, z out): a stepped podium, `xs` columns (Corinthian-like or Ionic via o.ionic), an entablature with an optional lettered frieze
 * and a pediment.  o = { x0, x1 (width of the entablature), depth (column axis distance from the wall), y0 (floor), y1 (top of the columns), r (column radius), xs: [centres],
 * ent (entablature height), ped (pediment rise), mat, matShade, wallMat (tympanum), text, textBg, textFg }.
 */
export function portico(K, o) {
  const P = K.P, M = K.mats, mat = o.mat || M.trim, shade = o.matShade || M.cream;
  const { x0, x1, depth, y0, y1, r, xs } = o;
  const ent = o.ent ?? 1.9, zf = depth + r * 1.6 + 0.2;                         // front face of the entablature
  // steps + podium
  if (o.steps !== false) {
  P.box(M.graniteWarm, x0 - 0.5, x1 + 0.5, 0, y0 - 0.17, 0, zf + 1.0, "b");
  P.box(M.granite, x0 - 0.2, x1 + 0.2, 0, y0, 0, zf + 0.45, "b");
  }
  for (const x of xs) K.column(mat, x, depth, y0, y1, r, { volutes: !o.ionic, capH: r * (o.ionic ? 1.3 : 1.8) });
  // entablature: architrave + frieze + cornice
  P.box(mat, x0, x1, y1, y1 + ent * 0.32, 0, zf - 0.12, 'b');
  P.box(shade, x0, x1, y1 + ent * 0.32, y1 + ent * 0.74, 0, zf - 0.05, 'b');
  P.box(mat, x0 - 0.2, x1 + 0.2, y1 + ent * 0.74, y1 + ent, 0, zf + 0.35, 'b');
  if (o.text) K.fascia(x0 + 0.6, x1 - 0.6, y1 + ent * 0.37, y1 + ent * 0.71, o.text, { w: 1024, h: 80, bg: o.textBg || '#e8dcc4', fg: o.textFg || '#6a5a3a', font: K.ctx.tex.FONTS.serif, z: zf - 0.03, size: 0.62 });
  // pediment: a prism + a recessed tympanum
  const yb = y1 + ent, mid = (x0 + x1) / 2, rise = o.ped ?? (x1 - x0) * 0.13;
  const sh = new THREE.Shape(); sh.moveTo(x0 - 0.2, yb); sh.lineTo(x1 + 0.2, yb); sh.lineTo(mid, yb + rise + 0.45); sh.lineTo(x0 - 0.2, yb);
  const hole = new THREE.Path(); hole.moveTo(x0 + 0.9, yb + 0.28); hole.lineTo(mid, yb + rise - 0.25); hole.lineTo(x1 - 0.9, yb + 0.28); hole.lineTo(x0 + 0.9, yb + 0.28);
  sh.holes.push(hole);
  P.extrude(mat, sh, 0.05, zf + 0.3, 1, 4);                                           // raking cornice frame (front at zf + 0.35)
  const fill = new THREE.Shape(); fill.moveTo(x0 + 0.8, yb + 0.2); fill.lineTo(x1 - 0.8, yb + 0.2); fill.lineTo(mid, yb + rise - 0.15); fill.lineTo(x0 + 0.8, yb + 0.2);
  P.extrude(o.wallMat || M.cream, fill, 0.05, zf + 0.05, 1, 4);                       // tympanum (front at zf + 0.1: recessed 25 cm)
  return { top: yb + rise + 0.45, zf };
}
