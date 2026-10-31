// landmarksYelaginPalace/frame.js - the model frame and the fixed numbers of the module (dossier docs/research/yelagin-palace-2026.md sections 5, 9, 12; photos pal_01 pal_04 pal_05 pal_06 pal_20 pal_26 pal_27 pal_28 lion_05 lion_07).
//   PA  palace frame  origin (-4558.0, -5225.85) = the west wall plane at the palace axis; local +x = u runs SOUTH along the west front (to the right of a visitor who looks at the palace from
//                     the Oil Meadow), local +z = w points WEST (out of the west front); rotation.y = -90 deg.  World(u, w) = (-4558.0 - w, -5225.85 + u).  The east front is w < 0.
//   y is metres above the lawn (the island is flat: ground y = 0).  F = the terrace / ground-floor level (13 stair steps + the landing wall = 2.8 m).
// Measured on the photos (scale = the 47.3 m OSM width of the front, 33.2 px/m in pal_01): column axes u = +-1.7 +-5.1 +-8.5 (six singles, pitch 3.4) and +-(16.05 +- 0.7), +-(21.75 +- 0.7) (the four
// pairs), pavilion pediments u 14.0..23.65, arched windows u = 0, +-3.4, +-6.8, upper windows u = 0 .. +-13.6 (pitch 3.4) and +-18.9, attic block u +-12.2 with seven windows and six small
// columns 1 + 2 + 2 + 1; the east rotunda: six columns on a semicircle R 6.0 at 36 deg pitch (+-18, +-54, +-90 deg), its stylobate R 7.0.
// RESULT of the first build (dossier BUILD LOG, ratio comparison of the render with pal_01 at the same camera): columns 7.9 m west / 8.3 m rotunda (capital top / main cornice = 0.86 in the photo), main cornice F + 9.55, attic cornice F + 14.4, dome apex F + 19.6 = 22.4 m above the lawn.
const R2D = Math.PI / 180;
export const PA = { x: -4558.0, z: -5225.85, rot: -90 * R2D };
/** palace (u, w) -> world { x, z } */
export const W = (u, w) => ({ x: PA.x - w, z: PA.z + u });
/** world (x, z) -> palace { u, w } */
export const M = (x, z) => ({ u: z - PA.z, w: PA.x - x });
/** world yaw (camera convention: 0 north, 90 west, 180 south, -90 east) of a camera looking along the palace axis from the west at the palace */
export const YAW_TO_PALACE = -90;

export const F = 2.8;                      // terrace / floor level above the lawn
/** heights are given ABOVE F (add F for the lawn datum) */
export const H = {
  col: 7.9, colE: 8.3,                     // column with base and capital: west front / rotunda
  ent: 7.9, cornice: 9.55, pedApex: 11.55,   // entablature starts / main cornice top / pediment apex (west + east pavilions)
  atticBase: 9.55, atticCornice: 14.4, atticTop: 15.4,   // central attic block (u +-12.2, w -8 .. -24.5) and its balustrade
  rotCornice: 9.95, tierTop: 14.1, balTop: 16.45, domeSpring: 16.6, domeTop: 19.6,
  sill: 5.7, win2: 7.7,                    // upper windows
};
/** plan numbers (palace frame) */
export const P = {
  halfLen: 23.65,                          // the body spans u +-23.65 (47.3 m)
  wallW: 0.0, wallE: -24.5,                // the west wall plane / the east wall plane of the central body
  colW: 2.0,                               // west column axis (w)
  colE: -26.5,                             // east pavilion column axis
  pavU: 14.0,                              // inner edge of the end pavilions
  atticU: 12.2, atticW0: -8.0, atticW1: -24.5,
  rotC: -24.5, rotRc: 6.0, rotRw: 5.0, rotRs: 7.0, rotRt: 5.7, domeR: 5.85,
  singles: [-8.5, -5.1, -1.7, 1.7, 5.1, 8.5],
  pairs: [-22.45, -21.05, -16.75, -15.35, 15.35, 16.75, 21.05, 22.45],
  arch: [-6.8, -3.4, 0, 3.4, 6.8],
  terrace: { wFront: 7.6, zN: -5240.5, zS: -5212.8 },   // terrace front edge w = 7.6 (X -4565.6), OSM footprint w173206736
  stair: { n: 13, tread: 0.42, top: 2.0, wFoot: 15.0, wTop: 9.54, half: 5.35, cheekW: 3.0 },     // 13 granite steps (tread 0.42, rise 0.154), the landing at 2.0 (w 7.6 .. 9.54), cheek blocks u 5.35 .. 8.35
  lions: [[-4571.8, -5220.0], [-4571.4, -5232.4]],     // OSM n3761709952 / n3761709953 (the plinth centres: w 13.8 / 13.4, u +5.85 / -6.55; the module mirrors them to u +-6.85)
};
/** the ring of the OSM footprint w717881701 (dossier 3.1, 45 vertices) for the collider fallback and the audit */
export const PALACE_ID = 'w717881701', PART_ID = 'w738578593', TERRACE_ID = 'w173206736';

/** the ramps (OSM w173206736 vertices converted to (u, w)): A = the palace-side wall, B = the lawn-side wall, from the terrace end to the tip */
export const RAMP_N = {
  A: [[-16.95, 1.2], [-21.25, 3.1], [-24.85, 4.8], [-27.55, 6.6], [-29.95, 8.3], [-32.05, 10.2], [-34.65, 12.6], [-38.25, 16.5]],
  B: [[-14.65, 6.4], [-18.25, 6.9], [-21.65, 8.5], [-25.25, 10.6], [-28.35, 13.0], [-31.55, 16.1], [-35.15, 19.5], [-36.55, 18.1]],
};
export const RAMP_S = {
  A: [[16.15, 3.0], [18.95, 4.2], [21.75, 5.9], [24.45, 7.7], [26.55, 9.6], [30.35, 13.2], [32.75, 16.7], [35.95, 21.8]],
  B: [[13.05, 7.7], [20.95, 12.7], [24.65, 16.0], [28.15, 20.4], [31.15, 24.8], [33.65, 23.2]],
};
/** the floor polygon of the terrace / podium at F (u, w), clockwise from the north-east corner; `open` = the edge that STARTS at this vertex is a ramp end (no wall, no railing) or a stair opening */
export const FLOOR = [
  [-26.0, -34.2], [-26.0, 5.7], [-24.85, 4.8], [-21.25, 3.1], { p: [-16.95, 1.2], open: true }, [-14.65, 6.4], [-10.9, 6.5], [-10.9, 9.54], { p: [-9.4, 9.54], open: true }, [-9.4, 7.6], { p: [9.4, 7.6], open: true }, [9.4, 9.54], [10.9, 9.54], [10.9, 6.5],
  { p: [14.0, 6.6], open: true }, [16.15, 3.0], [18.95, 4.2], [21.75, 5.9], [24.45, 7.7], [26.0, 8.9], [26.0, -34.2], { p: [10.0, -34.2], open: true }, [-10.0, -34.2],
];
export const EAST_STAIR = { half: 10.0, wTop: -34.2, run: 8.2, n: 14 };
