// bridges/kamenny/pieces.js - hand-built pieces of the Kamenny Island bridges, drawn into the Parts collector `P` of kit.js in the CURRENT frame (x = u along the bridge, z = v across, y up):
//   lampKam   the Kamennoostrovsky standard (photos 05 07 12): a green cast pole on a moulded base standing on the pier pedestal, a ring collar, two S-scroll arms along the bridge that carry grey-green
//             round shades with clear globes (two lanterns), ball-and-spike finial; `h` = pole height above its base
//   lampUsh   the Ushakovsky standard (photos 16 19 24): paler green, a taller pole with a ring node, two bracket arms with bowl lanterns, a crown finial
//   columnUsh the fluted dark-green cast-iron column on a bastion (photos 19 21 24): square plinth, base ring, 12-flute shaft, a capital band and the bronze trophy of the Order of Ushakov, drawn as a sheaf
//             of leaf blades round a medallion (an upright bronze group; no flags, no pennants), ~12 m
//   lampPark  the black park lamp of the small Kamenny bridges (photos 29 32 36): slim black pole, a curved arm, a round lantern with a dome cap
//   parkLamp is NOT instanced: a bridge has 2 - 8 of them
import * as THREE from 'three';

const sph = (P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) => P.geo(mat, new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)), x, y, z, 0, 0, 0, rx, ry, rz);
const domeGeo = new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2), halfGeo = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

/** one hanging round lantern: the arm ends at (x, y, z); shade = inverted bowl, clear globe under it */
function bowl(P, M, shade, x, y, z, r) {
  P.cyl(shade, [x, y - 0.02, z], [x, y - 0.12, z], 0.05, 0.05, 5, false);
  P.geo(shade, domeGeo, x, y - 0.3, z, 0, 0, 0, r, r * 0.55, r);
  P.geo(M.lampGlass, halfGeo, x, y - 0.3, z, 0, 0, 0, r * 0.82, r * 0.7, r * 0.82);
}
/** an S-scroll arm from the pole at (x, y, z) outward by `dx` along u (sign = direction) */
function arm(P, mat, x, y, z, dx) {
  const pts = [[0, 0], [0.18, 0.2], [0.5, 0.3], [0.8, 0.12], [1.0, -0.12]];
  for (let k = 0; k + 1 < pts.length; k++) P.cyl(mat, [x + dx * pts[k][0], y + pts[k][1], z], [x + dx * pts[k + 1][0], y + pts[k + 1][1], z], 0.034, 0.03, 5, false);
  return [x + dx * pts[pts.length - 1][0], y + pts[pts.length - 1][1]];
}

export function lampKam(P, M, x, y, z, o = {}) {
  const iron = o.mat || M.ironGreen, dark = M.ironGreenDark, h = o.h ?? 7.2, shade = M.fasKrest || iron;
  P.cyl(dark, [x, y, z], [x, y + 0.5, z], 0.26, 0.16, 8, true);                                   // moulded base
  P.cyl(iron, [x, y + 0.5, z], [x, y + h, z], 0.13, 0.07, 8, false);                              // shaft
  P.cyl(dark, [x, y + 1.2, z], [x, y + 1.36, z], 0.17, 0.17, 8, true);                            // collars
  P.cyl(dark, [x, y + h - 1.0, z], [x, y + h - 0.86, z], 0.14, 0.14, 8, true);
  P.cyl(dark, [x, y + h - 0.04, z], [x, y + h + 0.1, z], 0.1, 0.07, 6, true);
  sph(P, iron, x, y + h + 0.22, z, 0.1, 0.12, 0.1, 6);
  P.cyl(iron, [x, y + h + 0.3, z], [x, y + h + 0.62, z], 0.03, 0.008, 4, false);                  // finial spike
  for (const d of [-1, 1]) { const e = arm(P, iron, x, y + h - 0.5, z, d); bowl(P, M, shade, e[0], e[1], z, 0.3); }
  return { h: h + 0.6 };
}
export function lampUsh(P, M, x, y, z, o = {}) {
  const iron = o.mat || M.ironGreen, dark = M.ironGreenDark, h = o.h ?? 8.6, shade = M.fasKrest || iron;
  P.cyl(dark, [x, y, z], [x, y + 0.6, z], 0.3, 0.17, 8, true);
  P.cyl(iron, [x, y + 0.6, z], [x, y + h, z], 0.12, 0.065, 8, false);
  P.cyl(dark, [x, y + 1.6, z], [x, y + 1.78, z], 0.18, 0.18, 8, true);
  sph(P, dark, x, y + 3.2, z, 0.17, 0.26, 0.17, 8);                                               // the cast node
  P.cyl(dark, [x, y + h - 0.04, z], [x, y + h + 0.12, z], 0.1, 0.07, 6, true);
  P.cyl(iron, [x, y + h + 0.12, z], [x, y + h + 0.48, z], 0.05, 0.008, 5, false);
  for (const d of [-1, 1]) { const e = arm(P, iron, x, y + h - 0.45, z, d * 1.15); bowl(P, M, shade, e[0], e[1], z, 0.32); }
  return { h: h + 0.5 };
}

/** the Ushakovsky column: (x, y, z) = the foot (top of the bastion balcony) */
export function columnUsh(P, M, x, y, z, o = {}) {
  const col = M.colGreen, dark = M.ironGreenDark, bronze = M.bronzeTroitsky, H = o.h ?? 10.4;
  P.box(M.graniteGrey || M.coping, x - 0.9, x + 0.9, y, y + 0.7, z - 0.9, z + 0.9, 'b', 1.4);                         // plinth
  P.cyl(dark, [x, y + 0.7, z], [x, y + 1.0, z], 0.78, 0.66, 12, true);                                                // base ring
  const nF = 12, r0 = 0.52, r1 = 0.4;
  for (let i = 0; i < nF; i++) {                                                                                      // fluting: 12 flat facets leaning in, alternate shades give the ribs
    const a0 = i / nF * Math.PI * 2, a1 = (i + 1) / nF * Math.PI * 2, am = (a0 + a1) / 2;
    P.quad(i % 2 ? col : dark, [x + Math.cos(a0) * r0, y + 1.0, z + Math.sin(a0) * r0], [x + Math.cos(a1) * r0, y + 1.0, z + Math.sin(a1) * r0], [x + Math.cos(a1) * r1, y + H, z + Math.sin(a1) * r1], [x + Math.cos(a0) * r1, y + H, z + Math.sin(a0) * r1], [Math.cos(am), 0.05, Math.sin(am)]);
  }
  P.cyl(dark, [x, y + 4.4, z], [x, y + 4.6, z], 0.52, 0.52, 12, true);                                                // a lower band (photo 24: the shaft is banded in two tones)
  P.cyl(dark, [x, y + H, z], [x, y + H + 0.35, z], 0.5, 0.62, 12, true);                                              // capital
  P.cyl(dark, [x, y + H + 0.35, z], [x, y + H + 0.7, z], 0.62, 0.78, 12, true);
  P.cyl(bronze, [x, y + H + 0.7, z], [x, y + H + 0.82, z], 0.88, 0.88, 12, true);                                     // the crown disc
  // the trophy: a medallion (the order star: a ring and a boss) in a sheaf of upright blades
  const my = y + H + 1.55;
  P.geo(bronze, new THREE.TorusGeometry(0.42, 0.07, 5, 14), x, my, z, 0, 0, 0);
  sph(P, bronze, x, my, z, 0.2, 0.2, 0.2, 8);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, lean = 0.16 + 0.12 * ((i * 5) % 3), len = 1.55 + 0.35 * ((i * 7) % 4) / 3;
    P.cyl(bronze, [x + Math.cos(a) * 0.12, y + H + 0.82, z + Math.sin(a) * 0.12], [x + Math.cos(a) * (0.12 + lean * len), y + H + 0.82 + len, z + Math.sin(a) * (0.12 + lean * len)], 0.1, 0.012, 4, false);
  }
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; P.cyl(bronze, [x + Math.cos(a) * 0.2, y + H + 0.82, z + Math.sin(a) * 0.2], [x + Math.cos(a) * 0.7, y + H + 1.55, z + Math.sin(a) * 0.7], 0.05, 0.02, 4, false); }   // short leaves
  return { h: H + 2.4 };
}

/** park lamp of the small bridges: (x, y, z) = foot; the arm leans toward `dir` (+1 / -1 along z) */
export function lampPark(P, M, x, y, z, dir = 1, h = 4.4) {
  const iron = M.iron;
  P.cyl(iron, [x, y, z], [x, y + 0.45, z], 0.14, 0.09, 7, true);
  P.cyl(iron, [x, y + 0.45, z], [x, y + h, z], 0.07, 0.05, 7, false);
  const pts = [[0, 0], [0.18, 0.14], [0.45, 0.2], [0.7, 0.12]];
  for (let k = 0; k + 1 < pts.length; k++) P.cyl(iron, [x, y + h - 0.1 + pts[k][1], z + dir * pts[k][0]], [x, y + h - 0.1 + pts[k + 1][1], z + dir * pts[k + 1][0]], 0.035, 0.03, 5, false);
  const lx = z + dir * 0.7, ly = y + h - 0.1 + 0.12;
  P.cyl(iron, [x, ly - 0.02, lx], [x, ly - 0.14, lx], 0.04, 0.04, 5, false);
  P.geo(M.lampGlass, halfGeo, x, ly - 0.14, lx, 0, 0, 0, 0.2, 0.2, 0.2);
  P.geo(iron, domeGeo, x, ly - 0.06, lx, 0, 0, 0, 0.26, 0.18, 0.26);
  return { h };
}
