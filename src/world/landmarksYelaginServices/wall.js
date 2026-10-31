// landmarksYelaginServices/wall.js - the wall vocabulary of the module on top of kit.js / facade.js: the four faces of a rectangle building in its model frame (face frames with the origin at the CENTRE of the face,
// x to the right seen from outside, y up, z out), openings (rectangular + round-headed holes with panes, casings and archivolts), two-storey panels with a string course, roofs (gable, hipped slab), chimneys.
// Face names: F = the south face (z = r.z1, normal +z), R = east (x = r.x1), B = north (z = r.z0), L = west (x = r.x0).  A panel is 0.4 m thick behind its face (WD): the faces R / L of a building are trimmed by WD at
// both ends where they meet F / B, so no two panels overlap (z-fighting on coplanar end caps is a bug class here).
import * as THREE from 'three';
import { holedWall, pane, surround, archSurround } from './facade.js';

export const WD = 0.4;
export const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginServices] ${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

export function faceOf(r, name) {
  const xc = (r.x0 + r.x1) / 2, zc = (r.z0 + r.z1) / 2;
  return { F: { ox: xc, oz: r.z1, rot: 0, len: r.x1 - r.x0 }, R: { ox: r.x1, oz: zc, rot: Math.PI / 2, len: r.z1 - r.z0 }, B: { ox: xc, oz: r.z0, rot: Math.PI, len: r.x1 - r.x0 }, L: { ox: r.x0, oz: zc, rot: -Math.PI / 2, len: r.z1 - r.z0 } }[name];
}
/** run fn(len, face) in the facade frame of face `name` of rect r (origin at the face centre) */
export function onSide(K, r, name, fn) {
  const f = faceOf(r, name); K.P.push(f.ox, 0, f.oz, f.rot);
  try { return fn(f.len, f); } finally { K.P.pop(); }
}
export const rect = (cx, y0, w, h, mat = 'winWhite', sill) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat, sill });
export const arch = (cx, y0, w, h, mat = 'winBrown') => ({ cx, y0, w, h, arch: true, mat });

/** panes + casings of the openings of a panel (facade frame).  h.mat = material key of the pane, h.cas = false: no casing, h.sw = casing width, h.cornice = small cornice over a rectangular opening */
export function openings(K, holes, depth = WD) {
  const P = K.P, M = K.M;
  for (const h of holes) {
    if (!h.nopane) pane(P, M[h.mat || 'winWhite'], h, h.depth ?? depth);
    if (h.cas === false) continue;
    if (h.arch) archSurround(P, M.white, h, { sw: h.sw ?? 0.24, proud: 0.09, sill: h.sillOn ?? false, impost: h.impost ?? false });
    else {
      surround(P, M.white, h, { sw: h.sw ?? 0.16, proud: 0.07, sill: h.sill ?? 0.12 });
      if (h.cornice) { P.box(M.white, h.x0 - 0.3, h.x1 + 0.3, h.y1 + 0.18, h.y1 + 0.28, 0, 0.2, 'k', 3); P.box(M.white, h.x0 - 0.24, h.x1 + 0.24, h.y1 + 0.28, h.y1 + 0.4, 0, 0.14, 'k', 3); }
    }
  }
}

/** a plaster panel x0..x1, y0..y1 (facade frame) with holes and their openings */
export function panel(K, mat, x0, x1, y0, y1, holes = [], o = {}) {
  holedWall(K.P, mat, x0, x1, y0, y1, holes, { depth: o.depth ?? WD, uvs: o.uvs ?? 3 });
  openings(K, holes, o.depth ?? WD);
}

/** the Greek-key band (y0..y1, x0..x1, proud 0.04): tile 1.2 m x 0.5 m */
export function keyBand(P, M, x0, x1, y0, y1, proud = 0.05) {
  const rep = (x1 - x0) / 1.2, v = (y1 - y0) / 0.5;
  P.quad(M.key, [x0, y0, proud], [x1, y0, proud], [x1, y1, proud], [x0, y1, proud], [0, 0, 1], [[0, 0], [rep, 0], [rep, v], [0, v]]);
}

/** a gable roof: ridge along z (alongZ = true) or x; spans [a, b] across at eave height y with `rise`, from p0 to p1 along the ridge; overhang adds to the eave (m).  Both gable ends are closed with triangles of `endMat`. */
export function gable(P, M, a, b, y, rise, p0, p1, o = {}) {
  const mat = o.mat || M.zinc, endMat = o.endMat || M.white, ov = o.ov ?? 0.3, alongZ = o.alongZ !== false;
  const m = (a + b) / 2, hw = (b - a) / 2 + ov, rr = rise * (hw / ((b - a) / 2)), ye = y - (rr - rise);
  const pt = (u, yy, v) => alongZ ? [u, yy, v] : [v, yy, u];
  const A = a - ov, B = b + ov;
  const q = (u0, y0, u1, y1, n) => P.quad(mat, pt(u0, y0, p0), pt(u0, y0, p1), pt(u1, y1, p1), pt(u1, y1, p0), alongZ ? n : [n[2], n[1], n[0]], [[0, 0], [(p1 - p0) / 1.2, 0], [(p1 - p0) / 1.2, hw * 1.2 / 1.2], [0, hw * 1.2 / 1.2]]);
  q(A, ye, m, y + rise, [-rise, hw, 0]); q(B, ye, m, y + rise, [rise, hw, 0]);
  if (o.ends !== false) {
    const n0 = alongZ ? [0, 0, -1] : [-1, 0, 0], n1 = alongZ ? [0, 0, 1] : [1, 0, 0];
    if (o.end0 !== false) P.fan(endMat, [pt(a, y, p0), pt(b, y, p0), pt(m, y + rise, p0)], n0, (p) => [p[0] / 3, p[1] / 3]);
    if (o.end1 !== false) P.fan(endMat, [pt(a, y, p1), pt(b, y, p1), pt(m, y + rise, p1)], n1, (p) => [p[0] / 3, p[1] / 3]);
  }
}

/** a chimney box (white) at (x, z) from y0 to y1 with a cap */
export function chimney(P, M, x, z, y0, y1, w = 0.9, d = 0.9) {
  P.box(M.white, x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2, 'b', 1.5);
  P.box(M.shade, x - w / 2 - 0.08, x + w / 2 + 0.08, y1, y1 + 0.1, z - d / 2 - 0.08, z + d / 2 + 0.08, 'b', 1.5);
}

/** inset (mitred) copy of a ring (array [x, z]) by `d` metres to the inside of the polygon (d > 0 inwards for a counter-clockwise ring in x-z with z south = clockwise seen from above: the sign is fixed by the area) */
export function insetRing(ring, d) {
  const n = ring.length; let A = 0;
  for (let i = 0; i < n; i++) { const p = ring[i], q = ring[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
  const sg = A > 0 ? 1 : -1;                          // inward normal of edge (dx, dz) is (-dz, dx) * sg ... verified numerically below
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l * sg, dx / l * sg]; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n], a = nrm(p0, p1), b = nrm(p1, p2);
    let bx = a[0] + b[0], bz = a[1] + b[1]; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;
    const cs = Math.max(0.35, bx * a[0] + bz * a[1]);
    out.push([p1[0] + bx * d / cs, p1[1] + bz * d / cs]);
  }
  return out;
}

/** a hipped slab roof over a ring: wall top y, a sloping border `inset` wide rising `rise`, a flat cap on top.  Caps of rings with holes: pass `holes` (inset the other way by the caller). */
export function slabRoof(P, M, ring, y, inset, rise, o = {}) {
  const inner = insetRing(ring, inset), n = ring.length, mat = o.mat || M.zinc;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = ring[i], b = ring[j], c = inner[j], d = inner[i];
    const ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez) || 1;
    const ox = (a[0] + b[0] - c[0] - d[0]) / 2, oz = (a[1] + b[1] - c[1] - d[1]) / 2, ol = Math.hypot(ox, oz) || 1;      // horizontal direction from the cap to the eave = outwards
    P.quad(mat, [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y + rise, c[1]], [d[0], y + rise, d[1]], [ox / ol * rise, inset, oz / ol * rise], [[0, 0], [l / 1.2, 0], [l / 1.2, inset / 1.2], [0, inset / 1.2]]);
  }
  P.cap(mat, inner, y + rise, true, 1.2, o.holes || []);
  return inner;
}

/** a hipped roof over x0..x1 x z0..z1 at eave height y, rise `rise`, overhang ov; the ridge runs along the longer side */
export function hip(P, M, x0, x1, z0, z1, y, rise, o = {}) {
  const ov = o.ov ?? 0.4, mat = o.mat || M.zinc, w = x1 - x0, d = z1 - z0, long = w >= d, hs = (long ? d : w) / 2 + ov, ye = y - rise * ov / ((long ? d : w) / 2);
  const xa = x0 - ov, xb = x1 + ov, za = z0 - ov, zb = z1 + ov, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, up = rise / hs;
  const t = (a, b) => [[0, 0], [Math.hypot(a[0] - b[0], a[2] - b[2]) / 1.2, 0], [0.5, 1], [0.5, 1]];
  void t;
  if (long) {
    const r0 = [xa + hs, y + rise, zc], r1 = [xb - hs, y + rise, zc];
    P.quad(mat, [xa, ye, zb], [xb, ye, zb], r1, r0, [0, 1, up], [[0, 0], [(xb - xa) / 1.2, 0], [(xb - xa - 2 * hs) / 1.2, hs / 1.2], [2 * hs / 1.2 / 2, hs / 1.2]]);
    P.quad(mat, [xb, ye, za], [xa, ye, za], r0, r1, [0, 1, -up], [[0, 0], [(xb - xa) / 1.2, 0], [(xb - xa - 2 * hs) / 1.2, hs / 1.2], [2 * hs / 1.2 / 2, hs / 1.2]]);
    P.fan(mat, [[xa, ye, za], [xa, ye, zb], r0], [-1, up, 0], (p) => [p[2] / 1.2, p[1] / 1.2]);
    P.fan(mat, [[xb, ye, zb], [xb, ye, za], r1], [1, up, 0], (p) => [p[2] / 1.2, p[1] / 1.2]);
  } else {
    const r0 = [xc, y + rise, za + hs], r1 = [xc, y + rise, zb - hs];
    P.quad(mat, [xa, ye, za], [xa, ye, zb], r1, r0, [-up, 1, 0], [[0, 0], [(zb - za) / 1.2, 0], [(zb - za - 2 * hs) / 1.2, hs / 1.2], [hs / 1.2, hs / 1.2]]);
    P.quad(mat, [xb, ye, zb], [xb, ye, za], r0, r1, [up, 1, 0], [[0, 0], [(zb - za) / 1.2, 0], [(zb - za - 2 * hs) / 1.2, hs / 1.2], [hs / 1.2, hs / 1.2]]);
    P.fan(mat, [[xb, ye, za], [xa, ye, za], r0], [0, up, -1], (p) => [p[0] / 1.2, p[1] / 1.2]);
    P.fan(mat, [[xa, ye, zb], [xb, ye, zb], r1], [0, up, 1], (p) => [p[0] / 1.2, p[1] / 1.2]);
  }
}

/** an iron roof railing round x0..x1 x z0..z1 at y (alpha panels, h metres) */
export function roofRail(P, M, x0, x1, z0, z1, y, h = 0.9) {
  const q = (a, b) => P.quad(M.iron, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], [0, 1, 0], [[0, 0], [Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, 0], [Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, 1], [0, 1]]);
  q([x0, z1], [x1, z1]); q([x1, z1], [x1, z0]); q([x1, z0], [x0, z0]); q([x0, z0], [x0, z1]);
}

/** a sloping iron canopy over a door: from the wall (z = zw, height yw) out to zo (height yo), x0..x1; top dark, underside light, a front edge band; posts at the front corners (optional) */
export function canopy(P, M, x0, x1, zw, zo, yw, yo, posts = true) {
  P.quad(M.dark, [x0, yw, zw], [x1, yw, zw], [x1, yo, zo], [x0, yo, zo], [0, 1, 0.3], [[0, 0], [(x1 - x0) / 1.2, 0], [(x1 - x0) / 1.2, 1], [0, 1]]);
  P.quad(M.shade, [x0, yw - 0.05, zw], [x0, yo - 0.05, zo], [x1, yo - 0.05, zo], [x1, yw - 0.05, zw], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.box(M.dark, x0, x1, yo - 0.16, yo + 0.02, zo - 0.04, zo + 0.04, '', 1);
  for (const x of [x0, x1]) P.box(M.dark, x - 0.025, x + 0.025, yw - 0.05, yo + 0.02, zo - 0.03, zo + 0.03, 'b', 1);
  if (posts) for (const x of [x0 + 0.15, x1 - 0.15]) P.cyl(M.dark, [x, 0, zo - 0.1], [x, yo - 0.15, zo - 0.1], 0.04, 0.04, 6, false);
}
