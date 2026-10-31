// landmarksKronverk/display.js - the OPEN-AIR DISPLAY of the Artillery Museum (dossier docs/research/kronverk.md section 3; photos refs/kronverk 05 07 20 21 22 and the type list of the Commons geosearch):
// an exhibit kit of 17 recognisable types (towed howitzers and long guns, the tracked B-4, self-propelled guns, the Pion, the Tyulpan mortar, a T-80, Shilka, Krug / Kub / Tor SAM vehicles, Grad / Uragan /
// Smerch rocket trucks, the Elbrus missile truck, the seven-axle Topol launcher, the S-75 on its launcher, the silver "Dal" missile on a trailer, AA guns, old bronze barrels and cannons) and their placement:
// the 14 named pieces of the embankment forecourt and the 3 vehicles of the west lawn on their OSM nodes, rows on the twelve court lawns (types and colours true, positions representative), the eleven old
// barrels, the two yard cannons and the two monuments (M. T. Kalashnikov, Grand Duke Mikhail Nikolaevich).  All exhibits are SILENT static props (no sounds, no flags), merged by material (5 draw calls);
// each one gets a box collider.  The court lawns (claimed GREEN: no generic wood between the exhibits) are laid here with their low black rails.
// Exhibit frame: forward (the muzzle) = local +z, y up, the piece stands on y = 0.
import * as THREE from 'three';
import { GREEN, MONUMENTS } from '../data/city.js';
import { pairs, inRing, ringArea, centroid, dist, rotOut } from './frame.js';
import { COURT_GREEN, YARD_GREEN } from './groups.js';
import { GATE } from './arsenal.js';
import { human, bust, cached, figureMats } from '../lib/figures.js';
import { Parts } from './kit.js';
import { coverFn } from './surfaces.js';

const DEG = Math.PI / 180;
const dirOf = (el) => [0, Math.sin(el * DEG), Math.cos(el * DEG)];
const along = (p, d, t) => [p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t];

// ---------------------------------------------------------------- primitives
function wheel(P, M, x, y, z, r, w = 0.36, seg = 8) { P.cyl(M.tyre, [x - w / 2, y, z], [x + w / 2, y, z], r, r, seg, true); const s = Math.sign(x) || 1; P.cyl(M.oliveD, [x + s * w / 2, y, z], [x + s * (w / 2 + 0.03), y, z], r * 0.5, r * 0.42, 6, true); }
/** a convex profile [[z, y]..] extruded across x0..x1 */
function prism(P, mat, x0, x1, prof) {
  const n = prof.length; let cz = 0, cy = 0; for (const p of prof) { cz += p[0] / n; cy += p[1] / n; }
  for (let i = 0; i < n; i++) { const a = prof[i], b = prof[(i + 1) % n]; let nz = b[1] - a[1], ny = -(b[0] - a[0]); if (nz * ((a[0] + b[0]) / 2 - cz) + ny * ((a[1] + b[1]) / 2 - cy) < 0) { nz = -nz; ny = -ny; } P.quad(mat, [x0, a[1], a[0]], [x1, a[1], a[0]], [x1, b[1], b[0]], [x0, b[1], b[0]], [0, ny, nz]); }
  P.fan(mat, prof.map((p) => [x1, p[1], p[0]]), [1, 0, 0]); P.fan(mat, prof.map((p) => [x0, p[1], p[0]]), [-1, 0, 0]);
}
function tracks(P, M, hw, len, h = 0.95, tw = 0.5, n = 6) {
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? hw - tw : -hw, x1 = x0 + tw;
    prism(P, M.track, x0, x1, [[-len / 2 + 0.45, 0], [len / 2 - 0.45, 0], [len / 2, h * 0.6], [len / 2 - 0.25, h], [-len / 2 + 0.25, h], [-len / 2, h * 0.6]]);
    for (let i = 0; i < n; i++) { const z = -len / 2 + 0.75 + i * (len - 1.5) / (n - 1); P.cyl(M.oliveD, [s * (hw - 0.02), h * 0.42, z], [s * (hw + 0.03), h * 0.42, z], h * 0.36, h * 0.36, 8, true); }
  }
}
const hull = (P, M, hw, len, y0, y1, nose = 1.1) => prism(P, M.olive, -hw, hw, [[-len / 2, y0], [len / 2 - 0.25, y0], [len / 2, y0 + (y1 - y0) * 0.45], [len / 2 - nose, y1], [-len / 2, y1]]);
/** a gun tube from a pivot: breech `back` m behind, muzzle L m ahead, optional muzzle brake and recoil cradle */
function tube(P, M, pivot, el, L, r, o = {}) {
  const d = dirOf(el), mz = along(pivot, d, L), br = along(pivot, d, -(o.back ?? 0.9));
  P.cyl(o.mat || M.olive, br, mz, r * 1.45, r, 8, true);
  if (o.cradle !== false) P.cyl(M.oliveD, along(pivot, d, -(o.back ?? 0.9) * 0.9), along(pivot, d, L * 0.3), r * 2.5, r * 2.3, 6, true);
  if (o.brake) P.cyl(M.oliveD, along(mz, d, -0.5), mz, r * 1.9, r * 1.9, 6, true);
  if (o.fume) P.cyl(M.oliveD, along(pivot, d, L * 0.55), along(pivot, d, L * 0.7), r * 1.7, r * 1.7, 6, true);
  return mz;
}
/** a missile along `d` from `p`: body, nose cone, four fins at the tail (thin boxes in the local frame are approximated by crossed quads, double faced) */
function missile(P, M, p, el, L, r, o = {}) {
  const d = dirOf(el), mat = o.mat || M.silver, nose = o.nose ?? r * 4, a = along(p, d, L - nose);
  P.cyl(mat, p, a, r, r, 10, true); P.cyl(o.noseMat || mat, a, along(p, d, L), r, 0.02, 10, false);
  if (o.booster) P.cyl(o.boostMat || M.silverD, along(p, d, -o.booster), p, r * 1.3, r * 1.3, 10, true);
  const fin = o.fin ?? r * 2.6, fl = o.finLen ?? L * 0.16, base = o.booster ? along(p, d, -o.booster) : p;
  const up = [0, Math.cos(el * DEG), -Math.sin(el * DEG)];
  for (const [ux, uy, uz] of [[1, 0, 0], [-1, 0, 0], up, [-up[0], -up[1], -up[2]]]) {
    const q0 = base, q1 = along(base, d, fl), t0 = [q0[0] + ux * (r + fin), q0[1] + uy * (r + fin), q0[2] + uz * (r + fin)], t1 = [q1[0] + ux * r, q1[1] + uy * r, q1[2] + uz * r], b0 = [q0[0] + ux * r, q0[1] + uy * r, q0[2] + uz * r];
    const nrm = [uy * d[2] - uz * d[1], uz * d[0] - ux * d[2], ux * d[1] - uy * d[0]];
    for (const s of [1, -1]) P.fan(o.finMat || M.silverD, [b0, t0, t1].map((q) => [q[0] + nrm[0] * 0.02 * s, q[1] + nrm[1] * 0.02 * s, q[2] + nrm[2] * 0.02 * s]), [nrm[0] * s, nrm[1] * s, nrm[2] * s]);
  }
}

// ---------------------------------------------------------------- the types: (P, M, o) -> footprint { w, z0, z1 }
export const TYPES = {
  /** towed howitzer / gun on a split trail: M-30, D-1, D-20, ML-20, Giatsint-B (o.len barrel, o.cal radius, o.brake, o.dual wheels, o.elev) */
  towed(P, M, o = {}) {
    const L = o.len || 2.9, r = o.cal || 0.075, wy = o.wr || 0.58, hw = o.hw || 0.95;
    for (const s of [-1, 1]) { wheel(P, M, s * hw, wy, 0, wy, 0.3); if (o.dual) wheel(P, M, s * (hw - 0.36), wy, 0, wy, 0.3); }
    P.box(M.oliveD, -hw, hw, wy - 0.11, wy + 0.11, -0.14, 0.14, '', 1);
    prism(P, M.olive, -hw - 0.05, hw + 0.05, [[0.3, wy + 0.1], [0.38, wy + 0.1], [0.52, wy + 1.15], [0.44, wy + 1.15]]);                       // the shield
    P.box(M.oliveD, -0.32, 0.32, wy, wy + 0.75, -0.5, 0.3, '', 1);
    tube(P, M, [0, wy + 0.72, 0.1], o.elev ?? 18, L, r, { brake: o.brake, back: 0.95 });
    for (const s of [-1, 1]) { P.cyl(M.olive, [s * 0.32, wy, -0.25], [s * (o.spread ?? 1.15), 0.14, -(o.trail || 3.4)], 0.1, 0.085, 4, true); P.box(M.oliveD, s * (o.spread ?? 1.15) - 0.22, s * (o.spread ?? 1.15) + 0.22, 0, 0.3, -(o.trail || 3.4) - 0.2, -(o.trail || 3.4) + 0.05, '', 1); }
    return { w: 2.6, z0: -(o.trail || 3.4) - 0.3, z1: Math.max(1, L * 0.95) };
  },
  /** B-4 203 mm howitzer on its tracked carriage */
  b4(P, M) {
    tracks(P, M, 1.25, 4.4, 0.85, 0.55, 5);
    P.box(M.olive, -0.7, 0.7, 0.35, 1.1, -1.9, 1.7, '', 1); P.box(M.oliveD, -0.55, 0.55, 1.1, 2.0, -0.9, 0.5, '', 1);
    tube(P, M, [0, 2.0, 0], 34, 4.3, 0.16, { back: 1.3 });
    P.cyl(M.olive, [0, 0.9, -1.8], [0, 0.2, -5.2], 0.2, 0.16, 4, true); P.box(M.oliveD, -0.7, 0.7, 0, 0.45, -5.5, -5.1, '', 1);
    return { w: 2.8, z0: -5.6, z1: 3.8 };
  },
  /** self-propelled gun with a turret: 2S1 Gvozdika, 2S3 Akatsiya, 2S19 Msta-S, ISU-style when o.casemate */
  spg(P, M, o = {}) {
    const len = o.len || 7.2, hw = o.hw || 1.55, by = 0.5, ty = 1.45, th = o.th || 0.95;
    tracks(P, M, hw, len, 0.95, 0.5, o.n || 6); hull(P, M, hw - 0.12, len, by, ty);
    const t0 = -len / 2 + 0.3, t1 = t0 + (o.tl || 3.4);
    prism(P, M.olive, -hw + 0.35, hw - 0.35, [[t0, ty], [t1 + 0.3, ty], [t1, ty + th], [t0 + 0.25, ty + th]]);
    P.box(M.oliveD, -0.35, 0.1, ty + th, ty + th + 0.22, t0 + 0.6, t0 + 1.3, 'b', 1);
    tube(P, M, [0, ty + th * 0.55, t1 + 0.1], o.elev ?? 8, o.barrel || 4.6, o.cal || 0.08, { brake: o.brake !== false, fume: true, back: 0.4, cradle: false });
    return { w: hw * 2 + 0.2, z0: -len / 2 - 0.2, z1: Math.max(len / 2, t1 + (o.barrel || 4.6)) };
  },
  /** 2S7 Pion: a long open-mounted 203 mm gun on a tracked chassis with a rear spade */
  pion(P, M) {
    const len = 10.4, hw = 1.65;
    tracks(P, M, hw, len, 1.0, 0.55, 7); prism(P, M.olive, -hw + 0.12, hw - 0.12, [[-len / 2, 0.55], [len / 2 - 0.2, 0.55], [len / 2, 1.0], [len / 2 - 0.6, 1.5], [-len / 2, 1.5]]);
    prism(P, M.olive, -hw + 0.2, hw - 0.2, [[len / 2 - 2.5, 1.5], [len / 2 - 0.5, 1.5], [len / 2 - 0.9, 2.25], [len / 2 - 2.4, 2.25]]);
    P.box(M.oliveD, -0.75, 0.75, 1.5, 2.3, -len / 2 + 1.0, -len / 2 + 3.4, '', 1);
    tube(P, M, [0, 2.45, -len / 2 + 2.4], 10, 10.4, 0.13, { back: 1.5 });
    P.box(M.oliveD, -hw, hw, 0.15, 1.3, -len / 2 - 0.45, -len / 2 - 0.2, '', 1);
    return { w: 3.5, z0: -len / 2 - 0.6, z1: len / 2 + 2.6 };
  },
  /** 2S4 Tyulpan: the 240 mm mortar carried on top of a tracked chassis */
  tyulpan(P, M) {
    const len = 7.6, hw = 1.6;
    tracks(P, M, hw, len, 0.95, 0.5, 6); hull(P, M, hw - 0.12, len, 0.5, 1.5); P.box(M.olive, -1.1, 0.2, 1.5, 2.0, 0.6, 2.6, 'b', 1);
    P.cyl(M.olive, [0.45, 1.75, -len / 2 - 0.3], [0.45, 2.65, 2.9], 0.2, 0.17, 10, true); P.cyl(M.oliveD, [0.45, 1.7, -len / 2 - 0.5], [0.45, 1.78, -len / 2 - 0.25], 0.6, 0.6, 10, true);
    return { w: 3.4, z0: -len / 2 - 0.6, z1: len / 2 };
  },
  /** T-80 main battle tank */
  tank(P, M) {
    const len = 7.0, hw = 1.75;
    tracks(P, M, hw, len, 0.95, 0.55, 6); hull(P, M, hw - 0.1, len, 0.5, 1.25, 1.6);
    P.cyl(M.olive, [0, 1.25, -0.2], [0, 1.95, -0.2], 1.45, 1.0, 12, true); P.cyl(M.oliveD, [0.45, 1.95, -0.5], [0.45, 2.2, -0.5], 0.3, 0.26, 8, true);
    tube(P, M, [0, 1.62, 1.0], 3, 5.4, 0.075, { fume: true, back: 0.3, cradle: false });
    return { w: 3.7, z0: -len / 2, z1: 6.5 };
  },
  /** ZSU-23-4 Shilka */
  shilka(P, M) {
    const len = 6.5, hw = 1.55;
    tracks(P, M, hw, len, 0.9, 0.45, 6); hull(P, M, hw - 0.12, len, 0.45, 1.3);
    P.box(M.olive, -1.3, 1.3, 1.3, 2.25, -1.9, 1.1, 'b', 1);
    for (const [x, y] of [[-0.22, 1.75], [0.22, 1.75], [-0.22, 2.0], [0.22, 2.0]]) P.cyl(M.oliveD, [x, y, 1.1], along([x, y, 1.1], dirOf(18), 2.1), 0.035, 0.03, 5, true);
    P.cyl(M.oliveD, [0, 2.25, -1.5], [0, 2.6, -1.5], 0.08, 0.08, 5, false); P.cyl(M.olive, [0, 2.75, -1.6], [0, 2.85, -1.2], 0.75, 0.75, 10, true);
    return { w: 3.2, z0: -len / 2, z1: len / 2 };
  },
  /** tracked SAM launcher: Krug 2P24 (two 8 m missiles) or Kub 2P25 (three slim ones) */
  sam(P, M, o = {}) {
    const len = o.len || 7.3, hw = 1.6, n = o.n || 2, L = o.L || 8.0, r = o.r || 0.42;
    tracks(P, M, hw, len, 0.95, 0.5, 6); hull(P, M, hw - 0.12, len, 0.5, 1.4);
    P.cyl(M.oliveD, [0, 1.4, -0.4], [0, 2.0, -0.4], 0.9, 0.8, 10, true); P.box(M.olive, -1.2, 1.2, 1.95, 2.25, -2.6, 1.4, '', 1);
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * (n === 2 ? 1.5 : 0.85); missile(P, M, [x, 2.25 + r + 0.1, -3.2], o.el ?? 14, L, r, { mat: o.mat || M.olive, noseMat: o.noseMat || M.silver, finMat: M.oliveD, fin: r * 1.6, nose: r * 3.2 }); }
    return { w: 3.4, z0: -len / 2 - 0.6, z1: Math.max(len / 2, -3.2 + L) };
  },
  /** Tor / Osa: a tracked or wheeled hull with a boxy radar turret */
  tor(P, M, o = {}) {
    const len = 7.4, hw = 1.6;
    if (o.wheeled) { for (const z of [-2.6, 0, 2.6]) for (const s of [-1, 1]) wheel(P, M, s * 1.25, 0.6, z, 0.6, 0.42); prism(P, M.olive, -1.4, 1.4, [[-len / 2, 0.55], [len / 2 - 0.9, 0.55], [len / 2, 1.2], [len / 2 - 1.0, 2.0], [-len / 2, 2.0]]); } else { tracks(P, M, hw, len, 0.95, 0.5, 7); hull(P, M, hw - 0.12, len, 0.5, 1.5); }
    const ty = o.wheeled ? 2.0 : 1.5;
    P.box(M.olive, -1.25, 1.25, ty, ty + 1.25, -2.4, 0.9, 'b', 1); P.box(M.oliveD, -1.0, 1.0, ty + 0.25, ty + 1.1, 0.9, 1.25, '', 1);
    P.cyl(M.oliveD, [0, ty + 1.25, -1.4], [0, ty + 2.1, -1.4], 0.1, 0.1, 5, false); P.push(0, ty + 2.5, -1.4, 0.5); P.box(M.olive, -1.0, 1.0, -0.55, 0.55, -0.06, 0.06, '', 1); P.pop();
    return { w: 3.3, z0: -len / 2, z1: len / 2 };
  },
  /** truck chassis with n axles, cab and a load: 'tubes' (Grad / Uragan / Smerch), 'missile' (Elbrus), 'container' (Topol / Pioneer) */
  truck(P, M, o = {}) {
    const len = o.len || 7.3, wr = o.wr || 0.6, n = o.axles || 3, hw = 1.2, cy = wr + 0.25;
    const zs = o.zs || Array.from({ length: n }, (_, i) => -len / 2 + 1.0 + i * (len - 2.6) / Math.max(1, n - 1));
    for (const z of zs) for (const s of [-1, 1]) wheel(P, M, s * (hw - 0.05), wr, z, wr, 0.42);
    P.box(M.oliveD, -hw + 0.25, hw - 0.25, cy - 0.2, cy + 0.15, -len / 2, len / 2, '', 1);
    const cabs = o.split ? [[-hw - 0.05, -0.55], [0.55, hw + 0.05]] : [[-hw - 0.05, hw + 0.05]];
    for (const [x0, x1] of cabs) { prism(P, M.olive, x0, x1, [[len / 2 - (o.cab || 2.0), cy + 0.15], [len / 2, cy + 0.15], [len / 2, cy + 0.9], [len / 2 - 0.45, cy + 1.6], [len / 2 - (o.cab || 2.0), cy + 1.6]]); P.quad(M.glass, [x0 + 0.1, cy + 1.0, len / 2 - 0.05], [x1 - 0.1, cy + 1.0, len / 2 - 0.05], [x1 - 0.1, cy + 1.5, len / 2 - 0.36], [x0 + 0.1, cy + 1.5, len / 2 - 0.36], [0, 0.5, 0.85]); }
    const r0 = -len / 2 + 0.2, r1 = len / 2 - (o.cab || 2.0) - 0.25;
    if (o.load === 'tubes') { const L = Math.min(o.L || 3.2, r1 - r0), h = o.h || 1.0, el = o.el ?? 0; P.push(0, cy + 0.35, r0, 0); const d = dirOf(el); const q = (z, y) => [z * d[2] - y * d[1] * 0 , y + z * d[1]]; prism(P, M.olive, -1.1, 1.1, [[0, 0], [L * d[2], L * d[1]], [L * d[2], L * d[1] + h], [0, h]]); P.quad(M.track, [-1.0, 0.08, -0.01], [1.0, 0.08, -0.01], [1.0, h - 0.08, -0.01], [-1.0, h - 0.08, -0.01], [0, 0, -1]); P.quad(M.track, [-1.0, L * d[1] + 0.08, L * d[2] + 0.01], [1.0, L * d[1] + 0.08, L * d[2] + 0.01], [1.0, L * d[1] + h - 0.08, L * d[2] + 0.01], [-1.0, L * d[1] + h - 0.08, L * d[2] + 0.01], [0, 0, 1]); P.pop(); void q; }
    else if (o.load === 'missile') { missile(P, M, [0, cy + 1.25, r0 + 0.4], 0, len - 1.0, o.r || 0.44, { mat: M.olive, noseMat: M.oliveD, finMat: M.oliveD, fin: 0.45, finLen: 1.0, nose: 2.0 }); for (const z of [r0 + 1.2, r1 - 0.5]) P.box(M.oliveD, -0.6, 0.6, cy + 0.15, cy + 0.85, z - 0.2, z + 0.2, '', 1); }
    else if (o.load === 'container') { P.cyl(M.olive, [0, cy + 1.25, r0 - 0.3], [0, cy + 1.25, len / 2 + (o.over ?? 0.8)], o.r || 0.95, o.r || 0.95, 12, true); for (const z of [r0 + 1, (r0 + r1) / 2, r1 - 0.5]) P.box(M.oliveD, -1.15, 1.15, cy + 0.15, cy + 1.0, z - 0.25, z + 0.25, '', 1); }
    else P.box(M.olive, -hw, hw, cy + 0.15, cy + 1.7, r0, r1, '', 1);
    return { w: 2.8, z0: -len / 2 - 0.5, z1: len / 2 + (o.load === 'container' ? (o.over ?? 0.8) : 0.1) };
  },
  /** S-75 Dvina on its SM-63 launcher */
  s75(P, M) {
    for (const a of [0, 2.09, 4.19]) { P.push(0, 0, 0, a); P.box(M.olive, -0.25, 0.25, 0.1, 0.45, 0, 3.0, '', 1); P.pop(); }
    P.cyl(M.olive, [0, 0, 0], [0, 1.5, 0], 0.75, 0.6, 10, true);
    const el = 32, d = dirOf(el), p = [0, 1.9, -2.2]; P.cyl(M.oliveD, along(p, d, -0.5), along(p, d, 8.2), 0.2, 0.16, 4, true);
    const up = [0, Math.cos(el * DEG) * 0.55, -Math.sin(el * DEG) * 0.55], q = [p[0], p[1] + up[1], p[2] + up[2]];
    missile(P, M, along(q, d, 2.6), el, 8.0, 0.25, { booster: 2.6, fin: 0.75, finLen: 1.4, nose: 2.2 });
    return { w: 5.4, z0: -3.4, z1: 8.2 };
  },
  /** the 16 m "Dal" (V-400) missile on its transport trailer */
  dal(P, M) {
    for (const z of [-5.4, -4.2]) for (const s of [-1, 1]) wheel(P, M, s * 1.1, 0.55, z, 0.55, 0.4); for (const s of [-1, 1]) wheel(P, M, s * 1.0, 0.55, 5.6, 0.55, 0.4);
    P.box(M.olive, -1.0, 1.0, 0.85, 1.1, -7.0, 6.6, '', 1); for (const z of [-5.5, -1.5, 3.0]) P.box(M.oliveD, -0.7, 0.7, 1.1, 1.75, z - 0.2, z + 0.2, '', 1);
    P.cyl(M.oliveD, [0, 0.95, 6.6], [0, 0.8, 8.4], 0.09, 0.09, 4, true);
    missile(P, M, [0, 2.25, -6.6], 0, 15.6, 0.42, { fin: 1.25, finLen: 3.0, nose: 3.2, booster: 0.9 });
    return { w: 3.6, z0: -7.8, z1: 9.2 };
  },
  /** heavy AA gun on a four-wheel cruciform carriage: 52-K, KS-19, KS-30 */
  aa(P, M, o = {}) {
    const s0 = o.big ? 1.25 : 1;
    for (const z of [-1.7 * s0, 1.7 * s0]) for (const s of [-1, 1]) wheel(P, M, s * 0.95, 0.5, z, 0.5, 0.3);
    P.box(M.olive, -0.5, 0.5, 0.45, 0.85, -2.3 * s0, 2.3 * s0, '', 1); P.box(M.olive, -1.9 * s0, 1.9 * s0, 0.5, 0.75, -0.25, 0.25, '', 1);
    P.cyl(M.oliveD, [0, 0.85, 0], [0, 1.6, 0], 0.55, 0.45, 8, true); P.box(M.olive, -0.6, 0.6, 1.3, 2.0, -0.7, 0.5, '', 1);
    tube(P, M, [0, 1.85, 0], o.elev ?? 42, (o.len || 4.6) * s0, 0.06 * s0, { brake: true, back: 1.0 });
    return { w: 3.9 * s0, z0: -2.5 * s0, z1: 3.6 * s0 };
  },
  /** an old bronze barrel on two stands */
  barrel(P, M, o = {}) {
    const L = o.len || 2.4, r = o.r || 0.14, y = 0.62;
    for (const z of [-L * 0.28, L * 0.28]) { P.box(M.wood, -0.38, 0.38, 0, y - r * 0.8, z - 0.14, z + 0.14, 'b', 1); }
    P.cyl(M.oldBronze, [0, y, -L / 2], [0, y, L / 2], r * 1.3, r, 10, true); P.cyl(M.oldBronze, [0, y, L / 2 - 0.12], [0, y, L / 2], r * 1.25, r * 1.3, 10, true);
    P.cyl(M.oldBronze, [0, y, -L / 2 - 0.22], [0, y, -L / 2], r * 0.3, r * 0.9, 8, true); P.cyl(M.oldBronze, [-r * 1.9, y, -L * 0.05], [r * 1.9, y, -L * 0.05], r * 0.4, r * 0.4, 6, true);
    return { w: 0.9, z0: -L / 2 - 0.3, z1: L / 2 + 0.1 };
  },
  /** an old field cannon on a wooden carriage with spoked wheels */
  cannon(P, M) {
    for (const s of [-1, 1]) { P.cyl(M.wood, [s * 0.72, 0.68, 0], [s * 0.8, 0.68, 0], 0.68, 0.68, 12, true); P.cyl(M.iron, [s * 0.7, 0.68, 0], [s * 0.82, 0.68, 0], 0.12, 0.12, 6, true); }
    P.cyl(M.woodGreen, [0, 0.72, 0.3], [0, 0.12, -2.4], 0.16, 0.13, 4, true); P.box(M.woodGreen, -0.4, 0.4, 0.55, 0.85, -0.5, 0.5, '', 1);
    P.cyl(M.oldBronze, [0, 0.95, -0.8], along([0, 0.95, -0.8], dirOf(6), 2.3), 0.16, 0.11, 10, true); P.cyl(M.oldBronze, [0, 0.95, -0.98], [0, 0.95, -0.8], 0.05, 0.13, 8, true);
    return { w: 1.9, z0: -2.6, z1: 1.7 };
  },
};
/** named variants (key -> [type, options]) */
export const KINDS = {
  m30: ['towed', { len: 2.6, cal: 0.07, elev: 22 }], d1: ['towed', { len: 3.4, cal: 0.085, elev: 20, brake: true }], d20: ['towed', { len: 4.6, cal: 0.085, elev: 16, brake: true, hw: 1.05 }],
  ml20: ['towed', { len: 4.4, cal: 0.085, elev: 20, brake: true, dual: true, hw: 1.05, trail: 4.2 }], giatsint: ['towed', { len: 7.4, cal: 0.085, elev: 12, brake: true, dual: true, hw: 1.1, trail: 4.6, spread: 1.4 }],
  b4: ['b4', {}], aa85: ['aa', { elev: 45 }], ks30: ['aa', { big: true, elev: 40, len: 5.6 }],
  gvozdika: ['spg', { len: 7.0, barrel: 3.6, cal: 0.065, th: 0.8, tl: 3.0 }], akatsiya: ['spg', { len: 7.6, barrel: 4.4, cal: 0.085, elev: 10 }], msta: ['spg', { len: 7.4, barrel: 7.2, cal: 0.085, th: 1.25, tl: 4.2, elev: 6 }],
  pion: ['pion', {}], tyulpan: ['tyulpan', {}], t80: ['tank', {}], shilka: ['shilka', {}], krug: ['sam', { n: 2, L: 8.2, r: 0.42 }], kub: ['sam', { n: 3, L: 5.8, r: 0.17, el: 16, mat: null }],
  tor: ['tor', {}], osa: ['tor', { wheeled: true }],
  grad: ['truck', { len: 7.3, axles: 3, wr: 0.6, load: 'tubes', L: 3.0, h: 0.9 }], uragan: ['truck', { len: 9.6, axles: 4, wr: 0.7, load: 'tubes', L: 5.0, h: 1.15, split: true }],
  smerch: ['truck', { len: 12.2, axles: 4, wr: 0.75, load: 'tubes', L: 7.6, h: 1.2, split: true, cab: 2.4 }], elbrus: ['truck', { len: 13.2, axles: 4, wr: 0.75, load: 'missile', split: true, cab: 2.4 }],
  topol: ['truck', { len: 21.5, axles: 7, wr: 0.8, load: 'container', split: true, cab: 2.6, r: 1.0, over: 1.0 }], pioneer: ['truck', { len: 16.4, axles: 6, wr: 0.8, load: 'container', split: true, cab: 2.6, r: 0.95, over: 0.6 }],
  s75: ['s75', {}], dal: ['dal', {}], barrel: ['barrel', {}], barrelL: ['barrel', { len: 3.2, r: 0.17 }], cannon: ['cannon', {}],
};
const NAMES = { m30: '122-мм гаубица М-30', d1: '152-мм гаубица Д-1', d20: '152-мм пушка-гаубица Д-20', ml20: '152-мм гаубица-пушка МЛ-20', giatsint: '152-мм пушка 2А36 «Гиацинт-Б»', b4: '203-мм гаубица Б-4', aa85: '85-мм зенитная пушка 52-К', ks30: '130-мм зенитная пушка КС-30', gvozdika: '2С1 «Гвоздика»', akatsiya: '2С3 «Акация»', msta: '2С19 «Мста-С»', pion: '2С7 «Пион»', tyulpan: '2С4 «Тюльпан»', t80: 'Т-80', shilka: 'ЗСУ-23-4 «Шилка»', krug: 'ЗРК «Круг»', kub: 'ЗРК «Куб»', tor: 'ЗРК «Тор»', osa: 'ЗРК «Оса»', grad: 'БМ-21 «Град»', uragan: '9К57 «Ураган»', smerch: '9К58 «Смерч»', elbrus: '9К72 «Эльбрус»', topol: 'РТ-2ПМ «Тополь»', pioneer: 'РСД-10 «Пионер»', s75: 'ЗРК С-75 «Двина»', dal: 'ракета 5В11 «Даль»', barrel: 'старинный ствол', barrelL: 'старинный ствол', cannon: 'полевая пушка' };

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, rng = ctx.rng(20261007);
  M.kub = M.kub || M.silver;
  /** place one exhibit: world position, forward direction (dx, dz) */
  const put = (kind, x, z, dx, dz, o = {}) => {
    const [type, opts] = KINDS[kind], rot = rotOut(dx, dz);
    P.push(x, 0.02 + (o.y || 0), z, rot);
    let f; try { f = TYPES[type](P, M, kind === 'kub' ? { ...opts, mat: M.silver, noseMat: M.silverD } : opts); } finally { P.pop(); }
    const cz = (f.z0 + f.z1) / 2, l = f.z1 - f.z0;
    if (!o.noCollide) ph.addBox(x + dx * cz, z + dz * cz, f.w * 0.9, l * 0.9, rot, 0, 2.2);
    svc.exhibits.push({ kind, name: NAMES[kind], x, z, rotY: rot, len: l, w: f.w });
    return f;
  };
  const norm = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  // road integrity: a piece beside a street keeps its whole footprint 0.5 m clear of the asphalt (net.cover); it slides away from the road (up to 6 m) or is left out
  const cover = coverFn(ctx);
  const putSafe = (kind, x, z, dx, dz, away) => {
    const [type, opts] = KINDS[kind], f = TYPES[type](new Parts(), M, opts), rot = rotOut(dx, dz), cz = (f.z0 + f.z1) / 2, hl = (f.z1 - f.z0) / 2, hw = f.w / 2;
    for (let s = 0; s <= 6; s += 0.5) {
      const px = x + away[0] * s, pz = z + away[1] * s; let ok = true;
      for (const [a, b] of [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl], [0, -hl], [0, hl], [0, 0], [-hw, 0], [hw, 0]]) if (cover(px + Math.cos(rot) * a + dx * (cz + b), pz - Math.sin(rot) * a + dz * (cz + b)) > -0.5) { ok = false; break; }
      if (ok) return put(kind, px, pz, dx, dz);
    }
    svc.skippedExhibits = (svc.skippedExhibits || 0) + 1; return null;
  };

  // ================================================================== the court lawns with their rails
  const CC = [-2066, -2330];
  const lawns = [];
  for (const id of [...COURT_GREEN, ...YARD_GREEN]) for (const g of GREEN.filter((q) => q.id === id)) for (const p of g.polys) lawns.push({ id, ring: pairs(p.o), holes: p.h.map(pairs), court: COURT_GREEN.includes(id) });
  for (const L of lawns) {
    // road integrity: a lawn sheet never lies over asphalt (a polygon mapped across a carriageway is left to the generic ground)
    let onRoad = false; for (let i = 0; i < L.ring.length && !onRoad; i++) { const a = L.ring[i], b = L.ring[(i + 1) % L.ring.length], n = Math.max(1, Math.ceil(dist(a, b) / 2)); for (let k = 0; k < n; k++) if (cover(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) > -0.1) { onRoad = true; break; } }
    if (onRoad) { svc.lawnsOnRoad = (svc.lawnsOnRoad || 0) + 1; continue; }
    try { P.cap(M.lawn, L.ring, 0.045, true, 4, L.holes); } catch (e) { /* degenerate */ }
    if (!L.court) continue;
    const r = L.ring; let run = 0;
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = dist(a, b); if (l < 0.4) continue;
      const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, rot = Math.atan2(-uz, ux);
      P.push(a[0], 0, a[1], rot); P.box(M.iron, 0, l, 0.4, 0.45, -0.02, 0.02, '', 1);
      for (let s = (2.5 - run % 2.5) % 2.5; s < l; s += 2.5) P.box(M.iron, s - 0.02, s + 0.02, 0, 0.42, -0.02, 0.02, 'b', 1);
      P.pop(); run += l;
    }
  }
  // ================================================================== rows on the court lawns
  const THEME = {
    r3243641: [['akatsiya', 'gvozdika', 'msta', 'tyulpan', 'pion'], 5.2, 13.5], r3243638: [['krug', 'kub', 'tor', 'osa', 'shilka'], 5.4, 11.5], r3243639: [['grad', 'uragan', 'smerch', 'elbrus'], 5.0, 15.5],
    r3243640: [['topol', 'pioneer', 'dal', 's75', 's75'], 6.5, 25], r3243644: [['t80', 'akatsiya', 'shilka'], 5.5, 10], r3243643: [['ml20', 'd20', 'ks30'], 4.6, 9.5], r3243645: [['aa85', 'ks30', 'd1'], 5.2, 8.5],
    r3243642: [['d20', 'm30', 'd1', 'ml20'], 4.4, 9], r3243646: [['barrelL', 'cannon', 'barrel'], 3.2, 5.5], r3243647: [['giatsint', 'd20'], 4.6, 12], w116404414: [['d1', 'm30', 'aa85'], 4.6, 8.5], w116404421: [['ml20', 'd20', 'm30'], 4.6, 9],
  };
  let nCourt = 0;
  for (const L of lawns) {
    const th = THEME[L.id]; if (!th) continue;
    const [kinds, du, dv] = th, r = L.ring, c = centroid(r);
    // frame: u along the longest edge, v across; exhibits face +-v, toward the court centre (the big alleys)
    let bl = 0, u = [1, 0]; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], l = dist(a, b); if (l > bl) { bl = l; u = norm(b[0] - a[0], b[1] - a[1]); } }
    let v = [-u[1], u[0]]; if (v[0] * (CC[0] - c[0]) + v[1] * (CC[1] - c[1]) < 0) v = [-v[0], -v[1]];
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of r) { const pu = (p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1], pv = (p[0] - c[0]) * v[0] + (p[1] - c[1]) * v[1]; u0 = Math.min(u0, pu); u1 = Math.max(u1, pu); v0 = Math.min(v0, pv); v1 = Math.max(v1, pv); }
    const inside = (x, z) => inRing(r, x, z) && !L.holes.some((h) => inRing(h, x, z));
    const nv = Math.max(1, Math.floor((v1 - v0 - 1) / dv)), nu = Math.max(1, Math.floor((u1 - u0 - 1) / du));
    for (let j = 0; j < nv; j++) {
      const kind = kinds[j % kinds.length], pv = v0 + (v1 - v0 - nv * dv) / 2 + (j + 0.5) * dv;
      for (let i = 0; i < nu; i++) {
        const pu = u0 + (u1 - u0 - nu * du) / 2 + (i + 0.5) * du, x = c[0] + u[0] * pu + v[0] * pv, z = c[1] + u[1] * pu + v[1] * pv;
        const hw = du * 0.42, hl = dv * 0.44; let ok = true;
        for (const [a, b] of [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl], [0, 0]]) if (!inside(x + u[0] * a + v[0] * b, z + u[1] * a + v[1] * b)) { ok = false; break; }
        if (!ok) continue;
        const k2 = kinds.length > 2 && (i + j) % 7 === 6 ? kinds[(j + 1) % kinds.length] : kind;
        // long pieces sit a little back so that the muzzles stay over the lawn
        const [type, opts] = KINDS[k2], back = type === 'truck' ? 0 : type === 'pion' ? 1.2 : type === 'dal' ? 0.6 : type === 'towed' ? -0.8 : 0.6;
        put(k2, x - v[0] * back, z - v[1] * back, v[0], v[1]); nCourt++; void opts;
      }
    }
  }
  svc.courtExhibits = nCourt;

  // ================================================================== the named pieces of the embankment forecourt and the west lawn (OSM nodes)
  const kindOf = (name) => (/Б-4/.test(name) ? 'b4' : /Гиацинт/.test(name) ? 'giatsint' : /МЛ-20|гаубица-пушка/.test(name) ? 'ml20' : /Д-20/.test(name) ? 'd20' : /зенитн/.test(name) ? 'aa85' : /1943|Д-1/.test(name) ? 'd1' : 'm30');
  let nNode = 0;
  for (const m of MONUMENTS) {
    if (m.kind === 'cannon' && m.name && m.x > -2125 && m.x < -1975 && m.z > -2305 && m.z < -2240) {
      // west of the gate the pieces stand along the diagonal wall and look south-east; east of it they look to the strait
      const d = m.x < -2075 ? norm(0.6, 0.8) : norm(GATE.n[0], GATE.n[1]);
      if (putSafe(kindOf(m.name), m.x, m.z, d[0], d[1], m.x < -2075 ? norm(-0.6, -0.8) : [-GATE.n[0], -GATE.n[1]])) nNode++;
    }
  }
  const veh = MONUMENTS.filter((m) => m.kind === 'vehicle' && m.x > -2230 && m.x < -2170 && m.z > -2240 && m.z < -2190);
  veh.forEach((m, i) => { const d = norm(-0.72, 0.69); if (putSafe(['uragan', 'elbrus', 'grad'][i % 3], m.x, m.z, d[0], d[1], norm(-0.69, -0.72))) nNode++; });
  svc.nodeExhibits = nNode;

  // ================================================================== the east yard: eleven old barrels, the two cannons at the yard gate, the bust
  const barrels = MONUMENTS.filter((m) => m.kind === 'cannon' && !m.name && m.x > -1925 && m.x < -1860 && m.z > -2342 && m.z < -2330);
  barrels.forEach((m, i) => put(i % 3 === 1 ? 'barrelL' : 'barrel', m.x, m.z, 0.06, 1));
  for (const m of MONUMENTS.filter((q) => q.kind === 'cannon' && !q.name && q.x > -1948 && q.x < -1940)) put('cannon', m.x, m.z, 1, 0.05);
  const fm = figureMats(ctx), mk = fm.keys('bronze', 'bronze');
  // bust of Grand Duke Mikhail Nikolaevich (2013) on a grey granite pillar, looking south
  { const b = MONUMENTS.find((m) => m.id === 'r12440713') || { x: -1895.6, z: -2329.2 };
    P.box(M.graniteGrey, b.x - 0.55, b.x + 0.55, 0, 0.3, b.z - 0.55, b.z + 0.55, 'b', 2); P.box(M.graniteGrey, b.x - 0.4, b.x + 0.4, 0.3, 2.1, b.z - 0.4, b.z + 0.4, 'b', 2); P.box(M.graniteGreyFlat, b.x - 0.47, b.x + 0.47, 2.1, 2.22, b.z - 0.47, b.z + 0.47, '', 2);
    cached('lmKr-bust-mn', () => bust({ detail: 0.6, outfit: { torso: 'coat', collar: 'stand', epaulettes: true, buttons: true, medals: true }, face: { age: 0.75, hair: 'short', beard: 'full', moustache: true, seed: 12 } })).place(P, mk, b.x, 2.22, b.z, 0, 1.25);
    ph.addBox(b.x, b.z, 1.1, 1.1, 0, 0, 3); svc.monuments.push({ id: 'mikhail-nikolaevich', name: 'Бюст великого князя Михаила Николаевича', x: b.x, z: b.z, h: 3.1 }); }
  // the Kalashnikov monument (2019) before the museum door: a standing bronze figure on a red granite block
  { const k = MONUMENTS.find((m) => m.id === 'n8441492118') || { x: -2076.9, z: -2325.3 }, d = norm(0.25, 0.97), rot = rotOut(d[0], d[1]);
    P.push(k.x, 0, k.z, rot); P.box(M.granitePolish, -1.0, 1.0, 0, 0.25, -1.0, 1.0, 'b', 2); P.box(M.granitePolish, -0.7, 0.7, 0.25, 1.75, -0.7, 0.7, 'b', 2); P.box(M.granitePinkD, -0.78, 0.78, 1.75, 1.87, -0.78, 0.78, '', 2);
    P.quad(M.sign('kalashnikov', 256, 128, ['М. Т. КАЛАШНИКОВ', '1919 - 2013'], { bg: '#4a4034', fg: '#d8c89a' }), [-0.5, 0.75, 0.705], [0.5, 0.75, 0.705], [0.5, 1.25, 0.705], [-0.5, 1.25, 0.705], [0, 0, 1]);
    P.pop();
    cached('lmKr-kalashnikov', () => human({ detail: 0.55, body: { muscle: 0.4 }, pose: { pelvis: [0, 0.95, 0], spine: [0, 0.05, 0], head: [0.05, -0.1, 0], legs: { L: { foot: [0.13, 0, 0.06], pole: [0, 0, 1] }, R: { foot: [-0.12, 0, -0.05], pole: [0, 0, 1] } }, arms: { L: { hand: [0.2, 1.02, 0.26], pole: [0.6, -0.4, -0.3], grip: 'hold' }, R: { hand: [-0.12, 1.12, 0.3], pole: [-0.6, -0.5, -0.2], grip: 'hold' } } }, outfit: { torso: 'coat', hem: 0.3, sleeves: 'long', trousers: 'long', boots: false, collar: 'fall', buttons: true, medals: true }, face: { age: 0.8, hair: 'short', mouth: 'calm', seed: 44 } })).place(P, mk, k.x, 1.87, k.z, rot, 1.35);
    ph.addBox(k.x, k.z, 2.0, 2.0, rot, 0, 4.2); svc.monuments.push({ id: 'kalashnikov', name: 'Памятник М. Т. Калашникову', x: k.x, z: k.z, h: 4.3 }); }
  svc.crowd.push({ x: -2066, z: -2318, r: 14, n: 10, name: 'двор Артиллерийского музея' }, { x: -2056, z: -2284, r: 9, n: 6, name: 'у ворот музея' });
  void THREE; void rng; void ringArea;
}
