// landmarksTVTower/frame.js - the local frame and the dimensions of the Leningrad TV tower (Санкт-Петербургская телебашня, 1962, V. S. Vasilkovsky).
// Local frame of the module root: x east, z south, y up (metres), origin O = the axis of the tower, root rotation ROT (the OSM hexagon w49489011 is turned 0.7 deg from the N-S axis).
// Everything that is a number of the tower lives here; dossier docs/research/aptekarsky-2026.md 4.2 + CRITIC LOG, photos refs/aptekarsky/B3 67 68 69 70 (see the BUILD LOG there).
//   OSM [w49489011]: regular hexagon, circumradius 28.45 m, flats facing east / west, corners north / south (49.4 m across the flats), centre (-1696.3,-4915.5)
//   OSM 3D parts: w192468856 lantern hexagon 185..201 m (19.5 m across the corners), w192468855 round 10.3 m (shaft + lattice mast) 0..310 m, w192468854 spire 3.3 m 310..326 m
//   [W] 316 m at the opening (1962), 326 m since 2011; lantern from 187 m with three levels; the trunk = three tapering pyramids with a concrete shaft in red-white bands inside it
//   [V B3] platforms (walkway rings) at 20 / 66.5 / 104.5 / 139.5 / 166 m (re-measured on the photo, scale = lantern floor 187 m), the legs narrow from 57 m across the corners at the feet to ~15 m below the lantern (r 28.45 -> 7.0)
export const O = { x: -1696.0, z: -4915.7 };
export const ROT = -0.7 * Math.PI / 180;                       // root.rotation.y (three.js: negative = clockwise seen from above, like the map)

export const TOTAL = 326;
export const R_FOOT = 28.45;                                    // circumradius of the hexagon at the ground (the feet)
export const KINK_Y = [0, 20, 66.5, 104.5, 187];                    // the leg changes direction here
export const KINK_R = [28.45, 23.2, 15.8, 12.8, 7.0];           // circumradius of the leg axes at the kinks
export const PANEL_Y = [0, 20, 66.5, 104.5, 139.5, 166, 187];         // levels of the face lattice (horizontal ties)
export const PANEL_N = [4, 9, 7, 7, 5, 4];                     // panels between the levels
export const PLATFORMS = [20, 66.5, 104.5, 139.5, 166];               // walkway rings (grating + railing)
export const TRUNK_TOP = 187;

export const SHAFT_R = 2.4;                                     // the concrete shaft (4.8 m across)
export const SHAFT_Y0 = 12.5;
export const SHAFT_RED = [[12.5, 19.7], [36.1, 53.5], [66.2, 79.0], [91.8, 100.3], [108.6, 117.0], [124.7, 133.3], [141.4, 149.7], [157.7, 165.7], [173.6, 181.6]];   // red bands [V B3 re-measured 2026-10-14 by pixel profile of the shaft column, scale from the lantern floor 187 m = 0.2441 m/px: bands 8.4 m + 8.4 m white above 90 m, 13-17 m low down; the top 5 m under the lantern are WHITE]

// lantern: three glazed levels between four hexagonal slabs, the cone under the first slab hides the trunk top
export const LANT = {
  cone: [185.0, 187.4],
  slabs: [[187.4, 188.2, 7.0], [191.6, 192.4, 7.95], [195.8, 196.6, 8.9], [200.0, 200.8, 9.75]],       // [y0, y1, circumradius]
  glassInset: 1.3,                                                                                      // glass plane = slab radius - inset
};
export const MAST_Y0 = 200.8;
// the antenna mast (present state, 126 m since 2011) is a square lattice BOX that hardly tapers: ~10 m at the lantern roof, ~8.6 m under the platform at 310 m [V refs aptekarsky 69 70 + SP/tvt t04 t06, OSM
// w192468855 "10.3 m, 0..310"]: aviation bands white / red; the old needle of photo B3 (310 m era) is gone.  Band list: [y0, y1, colour w / r]
export const MAST_BANDS = [[200.8, 214, 'w'], [214, 232, 'r'], [232, 252, 'w'], [252, 272, 'r'], [272, 294, 'w'], [294, 310, 'r']];
export const MAST_W0 = 5.0, MAST_W1 = 4.3;                    // half width of the square plan at the lantern roof / under the top platform
export const MAST_PLATFORMS = [232, 272, 310];
export const SPIRE = [310, 326];

export const rad = (deg) => deg * Math.PI / 180;
/** circumradius of the leg axes at height y */
export function rAt(y) {
  if (y <= KINK_Y[0]) return KINK_R[0];
  for (let i = 0; i + 1 < KINK_Y.length; i++) if (y <= KINK_Y[i + 1]) return KINK_R[i] + (KINK_R[i + 1] - KINK_R[i]) * (y - KINK_Y[i]) / (KINK_Y[i + 1] - KINK_Y[i]);
  return KINK_R[KINK_R.length - 1];
}
/** local [x, z] of hexagon corner k (0 = north, clockwise seen from above, 60 deg apart) at circumradius r */
export function corner(k, r) { const a = k * Math.PI / 3; return [r * Math.sin(a), -r * Math.cos(a)]; }
/** unit tangent of corner k (perpendicular to the radial direction, in the plan) */
export function tangent(k) { const a = k * Math.PI / 3; return [Math.cos(a), Math.sin(a)]; }
/** local -> world (x, z) of a plan point */
export function world(x, z) { const c = Math.cos(-ROT), s = Math.sin(-ROT); return [O.x + x * c - z * s, O.z + x * s + z * c]; }
export const lerp = (a, b, t) => a + (b - a) * t;
