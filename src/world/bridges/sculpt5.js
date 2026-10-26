// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/bridges/sculpt5.js) for Admiralty-Haymarket (docs/AREAS.md 15.2); this line is the only change.
// bridges/sculpt5.js - the standards and small pieces of the Vasilievsky Island bridges (docs/research/vo-bridges-wave1.md), drawn into the Parts collector `P` of kit.js in the CURRENT frame like sculpt4.js
// (x, z on the deck plane, y up; `rot` turns a piece about the vertical; local z = across the bridge, toward the carriageway):
//   lampBlag       the historic standard of the Blagoveshchensky Bridge (22 of them, the 1906 Peretyatkovich lanterns re-used [W-ru]; photos b02 b03 b07 b10 b12): an octagonal granite-grey plinth, a
//                  fluted sage column with collars, a cast capital, two cage lanterns on curved arms (hexagonal milk glass under a pyramid cap), a spike finial; h = total height
//   pavilionBlag   a round control pavilion on a bascule pier balcony: a pale body, a ribbon of dark glass with mullions, a flat roof with a rim and a small cap (photos b04 b11 b12)
//   tumba          a granite round pedestal (cornice ring, cap) that carries a standard over a pier head (photo b07)
//   obeliskShip    Uralsky Bridge: a pale granite tumba, a slender shaft with a cornice and a gilded sailing ship on a ball (photos u01 u02 u03)
//   torchereSmol   Smolensky Bridge: a bundle of black rods with three rosette medallions and two hexagon bands, a crown of spear points, an arrow-bracket arm with a hanging hexagonal lantern (photo s01)
// NO flags / flag holders (user rule): the ship of the Uralsky obelisk is a bare gilded vane without pennant.
import * as THREE from 'three';

const sph = (P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) => P.geo(mat, new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)), x, y, z, 0, 0, 0, rx, ry, rz);
const dome = (P, mat, x, y, z, r, h, seg = 10) => P.geo(mat, new THREE.SphereGeometry(1, seg, 3, 0, Math.PI * 2, 0, Math.PI / 2), x, y, z, 0, 0, 0, r, h, r);

/** a cage lantern: hexagonal milk glass, black frame bars, pyramid cap, drop finial; (x, y, z) = the bottom centre */
function cageLantern(P, M, x, y, z, s = 1) {
  P.cyl(M.blagCage, [x, y - 0.06 * s, z], [x, y + 0.04 * s, z], 0.07 * s, 0.17 * s, 6, true);
  P.cyl(M.lampGlass, [x, y + 0.04 * s, z], [x, y + 0.5 * s, z], 0.19 * s, 0.22 * s, 6, false);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a); P.cyl(M.blagCage, [x + c * 0.2 * s, y + 0.04 * s, z + sn * 0.2 * s], [x + c * 0.225 * s, y + 0.5 * s, z + sn * 0.225 * s], 0.012 * s, 0.012 * s, 4, false); }
  P.cyl(M.blagCage, [x, y + 0.5 * s, z], [x, y + 0.72 * s, z], 0.25 * s, 0.03 * s, 6, true);
  P.cyl(M.blagCage, [x, y + 0.72 * s, z], [x, y + 0.82 * s, z], 0.03 * s, 0.006, 4, false);
}

/** the standard of the Blagoveshchensky Bridge; (x, y, z) = the foot, h = total height (default 10.5), arms along local z */
export function lampBlag(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 10.5, m = M.blagLamp, yl = h - 1.55;
  P.push(x, y, z, rot);
  P.cyl(m, [0, 0, 0], [0, 0.18, 0], 0.4, 0.37, 8, true);                                   // the plinth
  P.cyl(m, [0, 0.18, 0], [0, 0.95, 0], 0.31, 0.27, 8, false);
  P.cyl(m, [0, 0.95, 0], [0, 1.08, 0], 0.34, 0.34, 8, true);
  P.cyl(m, [0, 1.08, 0], [0, yl - 0.5, 0], 0.215, 0.135, 12, false);                      // the fluted column (tapering)
  for (const yy of [2.4, 4.9, yl - 1.4]) P.cyl(m, [0, yy, 0], [0, yy + 0.12, 0], 0.24 - (yy / h) * 0.08, 0.24 - (yy / h) * 0.08, 10, true);
  P.cyl(m, [0, yl - 0.5, 0], [0, yl - 0.3, 0], 0.17, 0.2, 8, true);                        // the capital
  P.cyl(m, [0, yl - 0.3, 0], [0, yl + 0.42, 0], 0.1, 0.08, 8, false);
  for (const s2 of [-1, 1]) {                                                              // two curved arms with a cage lantern each
    P.cyl(m, [0, yl - 0.1, 0], [0, yl + 0.18, s2 * 0.42], 0.035, 0.03, 4, false);
    P.cyl(m, [0, yl + 0.18, s2 * 0.42], [0, yl + 0.26, s2 * 0.86], 0.03, 0.028, 4, false);
    P.cyl(m, [0, yl + 0.26, s2 * 0.86], [0, yl + 0.1, s2 * 0.88], 0.03, 0.02, 4, false);
    cageLantern(P, M, 0, yl - 0.55, s2 * 0.88, 1.0);
  }
  P.cyl(m, [0, yl + 0.42, 0], [0, yl + 0.5, 0], 0.15, 0.15, 8, true);
  sph(P, m, 0, yl + 0.62, 0, 0.12, 0.12, 0.12, 7);
  P.cyl(m, [0, yl + 0.7, 0], [0, h, 0], 0.045, 0.008, 5, false);                           // the spike finial
  P.pop();
}

/** a round granite pedestal over a pier head: radius r, from y 0 to hgt, cornice ring + cap; returns the top y (local) */
export function tumba(P, M, x, y, z, r, hgt, mat) {
  P.cyl(mat, [x, y, z], [x, y + hgt - 0.28, z], r, r * 0.97, 14, false);
  P.cyl(M.coping, [x, y + hgt - 0.28, z], [x, y + hgt - 0.1, z], r + 0.12, r + 0.12, 14, true);
  P.cyl(M.coping, [x, y + hgt - 0.1, z], [x, y + hgt, z], r + 0.04, r - 0.02, 14, true);
  P.cyl(M.copingDark, [x, y + 0.5, z], [x, y + 0.58, z], r + 0.05, r + 0.05, 14, true);   // a faint belt of the courses
  return y + hgt;
}

/** the round control pavilion; (x, y, z) = the middle of its floor */
export function pavilionBlag(P, M, x, y, z, R = 1.95) {
  P.cyl(M.pavBlag, [x, y, z], [x, y + 0.95, z], R, R, 14, true);                           // the solid lower body
  P.cyl(M.coping, [x, y + 0.95, z], [x, y + 1.05, z], R + 0.07, R + 0.07, 14, true);
  P.cyl(M.darkGlass, [x, y + 1.05, z], [x, y + 2.35, z], R - 0.04, R - 0.04, 14, false);   // the glazed ribbon
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; P.cyl(M.pavBlag, [x + Math.cos(a) * (R - 0.02), y + 1.05, z + Math.sin(a) * (R - 0.02)], [x + Math.cos(a) * (R - 0.02), y + 2.35, z + Math.sin(a) * (R - 0.02)], 0.055, 0.055, 4, false); }
  P.cyl(M.pavBlag, [x, y + 2.35, z], [x, y + 2.6, z], R + 0.12, R + 0.1, 14, true);        // the cornice
  P.cyl(M.pavBlagRoof, [x, y + 2.6, z], [x, y + 2.72, z], R + 0.04, R * 0.9, 14, true);    // the shallow roof
  dome(P, M.pavBlagRoof, x, y + 2.72, z, R * 0.55, 0.32, 10);
  P.cyl(M.pavBlagRoof, [x, y + 3.0, z], [x, y + 3.25, z], 0.04, 0.01, 5, false);
}

/** Uralsky Bridge obelisk: tumba (square, tapering), a slender shaft, a cornice, a ball and the gilded sailing ship vane; (x, y, z) = the foot, total height h (default 8.2) */
export function obeliskShip(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 9.2, g = M.obeliskPale, gp = M.graniteUral;
  P.push(x, y, z, rot);
  P.box(gp, -0.95, 0.95, 0, 0.55, -0.95, 0.95, 'b', 1.6);
  P.box(gp, -0.78, 0.78, 0.55, 1.75, -0.78, 0.78, '', 1.6);
  P.box(M.coping, -0.88, 0.88, 1.75, 1.95, -0.88, 0.88, '', 1.4);
  P.push(0, 0, 0, Math.PI / 4); P.cyl(g, [0, 1.95, 0], [0, h - 1.5, 0], 0.5, 0.31, 4, false); P.pop();   // the shaft: a tapering 4-sided column, turned 45 deg so that its faces follow the tumba
  P.box(M.coping, -0.34, 0.34, h - 1.5, h - 1.32, -0.34, 0.34, '', 1.2);
  P.cyl(g, [0, h - 1.32, 0], [0, h - 0.95, 0], 0.26, 0.2, 8, true);
  sph(P, M.gold, 0, h - 0.82, 0, 0.2, 0.2, 0.2, 8);
  P.cyl(M.gold, [0, h - 0.65, 0], [0, h - 0.4, 0], 0.035, 0.035, 5, false);               // the stem of the ship
  // the ship: a hull (curved keel strip), two masts with sails (flat quads), a bowsprit; in the plane across the bridge (local z), gilded
  const yy = h - 0.4;
  P.quad(M.gold, [0, yy, -0.5], [0, yy, 0.5], [0, yy + 0.18, 0.42], [0, yy + 0.18, -0.42], [1, 0, 0]);
  P.quad(M.gold, [0, yy, -0.5], [0, yy, 0.5], [0, yy + 0.18, 0.42], [0, yy + 0.18, -0.42], [-1, 0, 0]);
  P.cyl(M.gold, [0, yy + 0.1, -0.12], [0, yy + 1.0, -0.12], 0.018, 0.012, 4, false); P.cyl(M.gold, [0, yy + 0.1, 0.22], [0, yy + 0.85, 0.22], 0.018, 0.012, 4, false);
  for (const [zz, hh, w] of [[-0.12, 0.85, 0.34], [0.22, 0.7, 0.28]]) { const a = [0, yy + 0.2, zz - w], b = [0, yy + 0.2, zz + w], c = [0, yy + 0.2 + hh, zz + w * 0.45], d = [0, yy + 0.2 + hh, zz - w * 0.45]; P.quad(M.gold, a, b, c, d, [1, 0, 0]); P.quad(M.gold, a, b, c, d, [-1, 0, 0]); }
  P.cyl(M.gold, [0, yy + 0.16, 0.45], [0, yy + 0.26, 0.82], 0.014, 0.01, 4, false);
  P.pop();
}

/** Smolensky Bridge torchere: a bundle of 6 black rods on a square base, three rosette medallions between two hexagon bands, a crown of spear points; an arrow-bracket arm with a hanging hexagonal lantern; h = 5.4 */
export function torchereSmol(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 5.4, m = M.ironBlack, R = 0.2;
  P.push(x, y, z, rot);
  P.box(m, -0.34, 0.34, 0, 0.3, -0.34, 0.34, 'b', 1); P.box(m, -0.27, 0.27, 0.3, 0.42, -0.27, 0.27, '', 1);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; P.cyl(m, [Math.cos(a) * R, 0.42, Math.sin(a) * R], [Math.cos(a) * R, h - 1.1, Math.sin(a) * R], 0.026, 0.026, 4, false); }
  for (const yy of [1.1, 1.75]) P.cyl(m, [0, yy, 0], [0, yy + 0.1, 0], R + 0.06, R + 0.06, 6, true);             // the two hexagon bands
  for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.62; P.cyl(m, [Math.sin(a) * (R + 0.04), 1.43, Math.cos(a) * (R + 0.04)], [Math.sin(a) * (R + 0.075), 1.43, Math.cos(a) * (R + 0.075)], 0.12, 0.12, 10, true); }   // rosette medallions on the front
  P.cyl(m, [0, h - 1.1, 0], [0, h - 1.0, 0], R + 0.04, R + 0.04, 6, true);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; P.cyl(m, [Math.cos(a) * R, h - 1.0, Math.sin(a) * R], [Math.cos(a) * R * 0.9, h - 0.6, Math.sin(a) * R * 0.9], 0.05, 0.005, 4, false); }   // the spear points of the crown
  P.cyl(m, [0, h - 1.0, 0], [0, h - 0.3, 0], 0.05, 0.04, 6, false);
  P.cyl(m, [0, h - 0.5, 0], [0, h + 0.5, 0], 0.045, 0.012, 5, false);                                          // the tall central spike
  // the arrow-bracket: a horizontal rod with two arrowheads, a curved hanger, the lantern hanging from it
  P.cyl(m, [0, h - 0.35, -0.9], [0, h - 0.35, 0.9], 0.015, 0.015, 4, false);
  for (const s2 of [-1, 1]) { P.cyl(m, [0, h - 0.35, s2 * 0.9], [0, h - 0.35, s2 * 1.12], 0.07, 0.005, 4, false); }
  P.cyl(m, [0, h - 0.5, 0.0], [0, h - 0.38, 0.55], 0.02, 0.018, 4, false);
  P.cyl(m, [0, h - 0.38, 0.62], [0, h - 0.62, 0.66], 0.012, 0.012, 4, false);
  P.cyl(m, [0, h - 0.86, 0.66], [0, h - 0.62, 0.66], 0.07, 0.015, 6, true);
  P.cyl(M.lampGlass, [0, h - 1.22, 0.66], [0, h - 0.86, 0.66], 0.1, 0.17, 6, false);
  P.cyl(m, [0, h - 1.28, 0.66], [0, h - 1.22, 0.66], 0.03, 0.1, 6, true);
  P.pop();
}
