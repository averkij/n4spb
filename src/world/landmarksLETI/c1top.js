// landmarksLETI/c1top.js - everything that stands on the roof of Corpus 1 (photos 63, leti/01, leti/02): small octagonal TURRETS with maroon copper domes on the corner pylons of the fronts (base collector: they make the
//   skyline), timber-framed GABLETS (dormers with a zinc roof and a small window) over the middle of every bay group, pale brick CHIMNEYS, and the LANTERN SPIRE behind the west porch: a dark timber octagonal
//   lantern in two tiers with a gallery, a copper spire and a gilded finial (about 11 m above the roof ridge, the tallest vertical of the island's west side).  Roof heights come from the roof height function
//   roofH(x, z) of the hip roof (corpus1.js), so every piece sits on the roof surface.
import * as THREE from 'three';
import { H, TAU } from './frame.js';
import { tube, frustum, lathe } from './geo.js';
import { DOME } from './c1common.js';
import { cylL } from './shell.js';

/** small turret on a pylon: octagon of stucco with slit windows, a cornice, the dome with its spike. (cx, cz) world, y0 = base */
export function turret(P, M, cx, cz, y0, o = {}) {
  const r = o.r ?? 0.95, hh = o.h ?? 2.5, a0 = o.a0 ?? Math.PI / 8;
  frustum(P, M.stucco, cx, cz, y0, y0 + hh, 8, r, r * 0.97, a0, 2, hh / 2.4);
  frustum(P, M.stucco, cx, cz, y0 + hh, y0 + hh + 0.22, 8, r + 0.12, r + 0.2, a0, 2, 0.3);
  frustum(P, M.stucco, cx, cz, y0 + hh + 0.22, y0 + hh + 0.4, 8, r + 0.2, r + 0.2, a0, 2, 0.3, { capTop: M.stucco });
  lathe(P, M.dome, 'leti-dome', DOME, cx, y0 + hh + 0.4, cz, 0.42 * (r + 0.2) / 1.0, 0.42, 22, 14);
  const ytip = y0 + hh + 0.4 + 4.7 * 0.42;
  P.cyl(M.gold, [cx, ytip - 0.05, cz], [cx, ytip + 0.9, cz], 0.045, 0.02, 5, true);
  // one slit window on every other face
  for (let k = 0; k < 8; k += 2) {
    const a = a0 + (k + 0.5) * TAU / 8, s = Math.sin(a), c = Math.cos(a), rr = (r + 0.02) * Math.cos(Math.PI / 8) + 0.015, w = 0.17;
    P.quad(M.winS, [cx + s * rr + c * w, y0 + 0.5, cz + c * rr - s * w], [cx + s * rr - c * w, y0 + 0.5, cz + c * rr + s * w], [cx + s * rr - c * w, y0 + hh - 0.45, cz + c * rr + s * w], [cx + s * rr + c * w, y0 + hh - 0.45, cz + c * rr - s * w], [s, 0, c], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}

/** a timber gablet: front frame (timber boards) with a small window, a zinc gable roof, on the roof surface at world (x, z) turned so that its front faces (nx, nz); y = the roof height there */
export function gablet(P, M, x, z, y, nx, nz, o = {}) {
  const w = o.w ?? 2.3, hgt = o.h ?? 2.4, depth = o.d ?? 1.7, rot = Math.atan2(nx, nz), hw = w / 2, base = y - 0.7, wallTop = y + hgt * 0.5;
  P.push(x, 0, z, rot);
  P.box(M.timber, -hw, hw, base, wallTop, 0, 0.18, 'bk', 0.6);                                                         // the front frame
  P.fan(M.timber, [[-hw, wallTop, 0.18], [hw, wallTop, 0.18], [0, y + hgt, 0.18]], [0, 0, 1], (p) => [p[0] / 0.6, p[1] / 0.6]);
  P.quad(M.winR, [-0.5, y - 0.1, 0.19], [0.5, y - 0.1, 0.19], [0.5, y + hgt * 0.5 - 0.15, 0.19], [-0.5, y + hgt * 0.5 - 0.15, 0.19], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  const ox = 0.18;                                                                                                      // the roof overhang
  for (const s of [-1, 1]) P.quad(M.zinc, [s * (hw + ox), wallTop - 0.05, 0.3], [s * (hw + ox), wallTop - 0.05, -depth], [0, y + hgt + 0.1, -depth], [0, y + hgt + 0.1, 0.3], [s * hgt * 0.5, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.fan(M.timber, [[-hw, wallTop, -depth], [hw, wallTop, -depth], [0, y + hgt, -depth]], [0, 0, -1], (p) => [p[0] / 0.6, p[1] / 0.6]);
  P.pop();
}

/** a pale brick chimney stack with a stone cap */
export function chimney(P, M, x, z, y, h = 3.2) {
  P.box(M.stripe, x - 0.55, x + 0.55, y - 0.4, y + h, z - 0.55, z + 0.55, 'b', 1.8);
  P.box(M.stucco, x - 0.68, x + 0.68, y + h, y + h + 0.2, z - 0.68, z + 0.68, '', 1.8);
  P.box(M.dark, x - 0.3, x + 0.3, y + h + 0.2, y + h + 0.24, z - 0.3, z + 0.3, 'b', 1);
}

/**
 * the lantern spire at world (cx, cz) on the roof at height y0: an octagonal drum of dark timber (r 3.0, 2.6 m high, a band of slit windows), a stone cap with a gallery railing (the 'bal' cut-out), a second drum (r 2.0, 2.8 m, louvres),
 * a cornice, the copper-maroon octagonal spire (6.2 m) and the gilded finial with a thin needle.
 */
export function lantern(P, M, cx, cz, y0, o = {}) {
  const a0 = o.a0 ?? Math.PI / 8, r1 = 3.0, r2 = 2.05;
  frustum(P, M.stucco, cx, cz, y0 - 0.5, y0 + 0.5, 8, 3.7, 3.3, a0, 4, 1);                                              // the stone base (a low octagonal plinth)
  frustum(P, M.timber, cx, cz, y0 + 0.5, y0 + 3.1, 8, r1, r1 * 0.95, a0, 6, 4.3);                                      // the lower drum, dark boards
  for (let k = 0; k < 8; k++) {                                                                                         // the band of windows
    const a = a0 + (k + 0.5) * TAU / 8, s = Math.sin(a), c = Math.cos(a), rr = r1 * 0.975 * Math.cos(Math.PI / 8) + 0.02, w = 0.62;
    P.quad(M.winR, [cx + s * rr + c * w, y0 + 1.2, cz + c * rr - s * w], [cx + s * rr - c * w, y0 + 1.2, cz + c * rr + s * w], [cx + s * rr - c * w, y0 + 2.7, cz + c * rr + s * w], [cx + s * rr + c * w, y0 + 2.7, cz + c * rr - s * w], [s, 0, c], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  frustum(P, M.zinc, cx, cz, y0 + 3.1, y0 + 3.4, 8, r1 + 0.7, r1 + 0.7, a0, 4, 0.4, { capTop: M.zinc });                // the gallery slab
  for (let k = 0; k < 8; k++) {                                                                                         // the gallery railing: 8 cut-out panels
    const t0 = a0 + k * TAU / 8, t1 = a0 + (k + 1) * TAU / 8, R = r1 + 0.6;
    const p = (t, y) => [cx + Math.sin(t) * R, y, cz + Math.cos(t) * R], tm = (t0 + t1) / 2;
    P.quad(M.bal, p(t0, y0 + 3.4), p(t1, y0 + 3.4), p(t1, y0 + 4.3), p(t0, y0 + 4.3), [Math.sin(tm), 0, Math.cos(tm)], [[0, 0], [1.5, 0], [1.5, 0.9], [0, 0.9]]);
  }
  frustum(P, M.timber, cx, cz, y0 + 3.4, y0 + 6.1, 8, r2, r2 * 0.92, a0, 4, 2.2);                                       // the upper drum
  for (let k = 0; k < 8; k++) {
    const a = a0 + (k + 0.5) * TAU / 8, s = Math.sin(a), c = Math.cos(a), rr = r2 * 0.96 * Math.cos(Math.PI / 8) + 0.02, w = 0.38;
    P.quad(M.winS, [cx + s * rr + c * w, y0 + 3.9, cz + c * rr - s * w], [cx + s * rr - c * w, y0 + 3.9, cz + c * rr + s * w], [cx + s * rr - c * w, y0 + 5.7, cz + c * rr + s * w], [cx + s * rr + c * w, y0 + 5.7, cz + c * rr - s * w], [s, 0, c], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  frustum(P, M.zinc, cx, cz, y0 + 6.1, y0 + 6.5, 8, r2 + 0.45, r2 + 0.45, a0, 4, 0.4, { capTop: M.zinc });
  frustum(P, M.dome, cx, cz, y0 + 6.5, y0 + 12.5, 8, r2 + 0.3, 0.0, a0, 6, 5);                                           // the spire (octagonal pyramid, copper-maroon)
  frustum(P, M.dome, cx, cz, y0 + 6.5, y0 + 7.0, 8, r2 + 0.4, r2 + 0.3, a0, 6, 0.5);
  P.cyl(M.gold, [cx, y0 + 12.3, cz], [cx, y0 + 14.2, cz], 0.07, 0.02, 6, true);
  P.geo(M.gold, new THREE.SphereGeometry(0.26, 8, 6), cx, y0 + 12.9, cz);
  // four small pinnacles at the corners of the gallery
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * 2 + 0.5) * TAU / 8, x = cx + Math.sin(a) * (r1 + 0.62), z = cz + Math.cos(a) * (r1 + 0.62);
    P.box(M.stucco, x - 0.2, x + 0.2, y0 + 3.4, y0 + 4.7, z - 0.2, z + 0.2, 'b', 1);
    P.cyl(M.dome, [x, y0 + 4.7, z], [x, y0 + 5.7, z], 0.24, 0.0, 6, false);
  }
}
export { cylL, tube };
