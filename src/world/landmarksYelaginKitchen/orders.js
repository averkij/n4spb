// landmarksYelaginKitchen/orders.js - the Doric order of the two porticos and the cornice of the drum as Parts geometry (dossier 6.1; photos kit_01 kit_06 kit_08 kit_09 kit_13 kit_14).
//   doric()       one column with a grey plinth block and torus base, a smooth shaft with entasis (D 1.07 -> 0.86), a Doric capital (necking with a small rosette, three annulets, echinus, square abacus); y 0 = floor
//   rosette()     a round patera of the frieze (ring, eight petals, boss), facing +z
//   mutules()     a row of mutule blocks (flat blocks under the corona) along x
//   pediment()    tympanum + raking cornice with mutules
//   cornice runs of the drum are built by body.js with kit.js band() (mitred): `drumCornice()` here gives the profile numbers
import * as THREE from 'three';

export const TAU = Math.PI * 2;
const latheCache = new Map();
/** exact lathe (profile [[r, y]..]) placed at (x, y, z) */
export function latheRaw(P, mat, key, prof, x, y, z, seg = 24) {
  const k = `${key}|${seg}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z);
}

/** a Doric column of the Kitchen porticos.  H = total height with base and capital (6.2 m south, 5.7 m north). */
export function doric(P, M, H = 6.2, o = {}) {
  const seg = o.seg ?? 24, rB = 0.535, rT = 0.43, baseH = 0.6, capH = 0.56, shH = H - baseH - capH;
  // plinth block + torus (painted grey in the photos)
  P.box(M.grey, -0.74, 0.74, 0, 0.28, -0.74, 0.74, 'b', 1.8);
  latheRaw(P, M.grey, 'dbase', [[0.62, 0.28], [0.68, 0.32], [0.7, 0.4], [0.68, 0.49], [0.62, 0.56], [0.56, 0.6], [0.0, 0.6]], 0, 0, 0, seg);
  // shaft with entasis, smooth, white
  const prof = [[rB, baseH], [rB + 0.006, baseH + shH * 0.12], [rB - 0.012, baseH + shH * 0.4], [rB - 0.06, baseH + shH * 0.72], [rT + 0.02, baseH + shH * 0.94], [rT, baseH + shH]];
  latheRaw(P, M.white, `dshaft|${H.toFixed(2)}`, prof, 0, 0, 0, seg);
  // capital: necking, three annulets, echinus, abacus
  const y0 = baseH + shH;
  latheRaw(P, M.white, 'dcap', [[rT, 0], [rT, 0.1], [rT + 0.025, 0.1], [rT + 0.025, 0.12], [rT, 0.12], [rT, 0.15], [rT + 0.035, 0.15], [rT + 0.035, 0.18], [rT, 0.18], [rT, 0.21], [rT + 0.045, 0.21], [rT + 0.045, 0.24],
    [rT + 0.12, 0.27], [rT + 0.2, 0.33], [rT + 0.24, 0.4], [rT + 0.25, 0.42], [0, 0.42]], 0, y0, 0, seg);
  P.box(M.white, -0.64, 0.64, y0 + 0.4, y0 + 0.56, -0.64, 0.64, '', 1.8);
  if (o.rosette !== false) rosette(P, M, 0, y0 + 0.07, rT + 0.03, 0.09, 0.4);                         // the small flower on the necking, front
}

/** a patera: a ring, eight petals and a boss, in the facade plane facing +z at (x, y, z); r = radius */
export function rosette(P, M, x, y, z, r, lift = 1) {
  const d = r * 0.35 * lift;
  const ring = new THREE.TorusGeometry(r * 0.94, r * 0.08, 3, 12); P.geo(M.whiteFlat, ring, x, y, z + d * 0.5); ring.dispose();
  const disc = new THREE.CircleGeometry(r * 0.9, 12); P.geo(M.shade, disc, x, y, z + 0.004); disc.dispose();
  const star = []; for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r * 0.35 : r * 0.82; star.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr, z + d * (i % 2 ? 0.8 : 1.0)]); }
  P.fan(M.whiteFlat, [[x, y, z + d * 1.2], ...star, star[0]], [0, 0, 1]);
  const boss = new THREE.SphereGeometry(r * 0.2, 5, 3); P.geo(M.whiteFlat, boss, x, y, z + d * 1.1, 0, 0, 0, 1, 1, 0.7); boss.dispose();
}

/** a row of mutule blocks along x (each 0.46 wide, 0.3 high, projecting from zb to zf) at pitch ~0.6, ending symmetrically in [x0, x1] */
export function mutules(P, M, x0, x1, y, zb, zf, pitch = 0.6) {
  const n = Math.max(1, Math.round((x1 - x0) / pitch));
  P.box(M.shade, x0, x1, y, y + 0.28, zb, zf - 0.04, 'b', 3);                           // the dark core between the blocks
  for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; P.box(M.whiteFlat, x - 0.2, x + 0.2, y, y + 0.3, zb, zf, '', 3); }
}

/** the pediment of a portico on a straight front in a facade frame (x along, z out): the entablature top at y, tympanum from x0 to x1 recessed at zt, apex y + rise, raking cornice projecting to zf */
export function pediment(P, M, x0, x1, y, rise, zf, zt) {
  const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2, slope = Math.atan2(rise, hw), len = Math.hypot(hw, rise);
  P.fan(M.white, [[x0 + 0.25, y, zt], [x1 - 0.25, y, zt], [xm, y + rise - 0.25, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
  const proj = zf - zt;
  for (const sgn of [-1, 1]) {
    const cx = xm + sgn * hw / 2, cy = y + rise / 2, ang = sgn < 0 ? slope : -slope;
    const bar = new THREE.BoxGeometry(len + 0.4, 0.3, proj + 0.05);
    P.geo(M.whiteFlat, bar, cx, cy + 0.14, zt + proj / 2, 0, 0, ang); bar.dispose();
    const strip = new THREE.BoxGeometry(len + 0.2, 0.18, proj - 0.12);
    P.geo(M.shade, strip, cx, cy - 0.06, zt + (proj - 0.12) / 2, 0, 0, ang); strip.dispose();
    const n = Math.floor(len / 0.6), mg = new THREE.BoxGeometry(0.4, 0.2, proj - 0.1), ux = Math.cos(ang), uy = Math.sin(ang);
    for (let i = 0; i < n; i++) { const t = ((i + 0.5) / n - 0.5) * (len - 0.5); P.geo(M.whiteFlat, mg, cx + t * ux, cy - 0.12 + t * uy, zt + (proj - 0.1) / 2 + 0.03, 0, 0, ang); }
    mg.dispose();
  }
}
