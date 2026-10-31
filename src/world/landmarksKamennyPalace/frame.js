// landmarksKamennyPalace/frame.js - the frames and the fixed numbers of the module (dossier docs/research/kamenny-2026.md sections 5.1, 8 entry 1 and the BUILD LOG; photos P02 P04 P05 P08 P11 P12 P14 P19 P20 P22 P23).
//   PF  palace frame: origin O = the middle of the river front line (-2599.05, -5277.7), local +x runs along the river front to the NNE (the right hand of a visitor who stands on the river bank and looks
//       at the palace), local +z points OUT of the river front (ESE, bearing 117.9 deg), y is metres above the lawn (the island is flat: ground y = 0).  rotation.y = ROT = 62.1 deg.
//       World(x, z) = O + x * (cos, -sin) + z * (sin, cos).  Footprint (OSM w28055973, 20 vertices, re-measured in this frame: every vertex within 0.3 m): the river front z = 0 from x -34.3 to +34.3,
//       the colonnade terrace x -10.9 .. +11.2 projecting 2.1 m, the central block 21.1 m deep (z 0 .. -21.1), the court porch x -10.5 .. +9.8 (3.3 m deep), the two wings 26 m x 20.9 m set 7.0 m behind the
//       river front (z -7.0 .. -27.7) and standing 7.3 .. 8.0 m past the ends of the block (x -42.35 .. -17.3 and +15.0 .. +41.6).
//   The kitchen block r10254212 (179 m x 10.4 m) lies parallel to the palace axis (along local z, 59 .. 75 m WSW of the palace).
// Heights are measured on the photos (scale: the 68.6 m river front = the 68.6 m OSM front line; window rhythm and storey ratio from P04 / P05 / P11 / P14); [E] = estimate.
const R2D = Math.PI / 180;
export const ROT = 62.1 * R2D;
export const O = { x: -2599.05, z: -5277.7 };
const C = Math.cos(ROT), S = Math.sin(ROT);
/** palace local (x, z) -> world { x, z } */
export const W = (x, z) => ({ x: O.x + x * C + z * S, z: O.z - x * S + z * C });
/** world (x, z) -> palace local [x, z] */
export const Ml = (wx, wz) => { const dx = wx - O.x, dz = wz - O.z; return [dx * C - dz * S, dx * S + dz * C]; };
/** world yaw (camera convention: 0 north, 90 west, 180 south, -90 east) of a camera that looks from the river at the river front */

/** heights above the lawn */
export const H = {
  plinth: 1.9,            // rusticated limestone plinth with the small basement windows (P05 P11: 1.7 .. 1.9 m)
  gSill: 2.75, gTop: 5.55,  // ground-floor windows 2.8 m tall (P05)
  belt: 5.95, beltTop: 6.3,   // white string course between the floors
  uSill: 7.0, uTop: 9.0,    // upper windows 2.0 m tall
  arch: 9.5, frieze: 9.95, dentil: 10.75, corona: 11.0, cornice: 11.5,   // entablature (architrave / frieze with triglyph blocks / dentils / corona / cymatium): main cornice top 11.5
  bal: 1.1,               // roof balustrade (white, piers every ~5.5 m)
  ridge: 15.2,            // hipped copper roof ridge (central block)
  terrace: 1.5,           // the colonnade terrace above the apron
  colTop: 10.4, colBase: 0.5, colCap: 0.55,    // river colonnade: 8 free Tuscan columns from the terrace (1.5) to 10.4, shafts 0.9 m at the base
  portEntTop: 11.95,      // portico entablature top (0.45 m above the main cornice)
  atticTop: 14.5,         // attic block over the colonnade (+2.6 m)
};
/** plan numbers (palace frame) */
export const P = {
  frontHalf: 34.3,        // the river front z = 0, x -34.3 .. +34.3
  court: -21.1,           // court face of the central block (z)
  porch: { x0: -10.5, x1: 9.8, z: -24.4 },       // the court portico: 6 columns on a 3.3 m porch, granite stair
  terrace: { x0: -10.9, x1: 11.2, z: 2.1 },      // the colonnade terrace (OSM jog)
  colAxisZ: 1.35, cols: [-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5],     // the eight river columns (pitch 3.0 m)
  wingS: { x0: -42.35, x1: -17.3, zr: -7.0, zc: -27.7 },     // SSW wing: river-side wall z -7.0, court-side wall z -27.7
  wingN: { x0: 15.0, x1: 41.6, zr: -6.95, zc: -27.7 },       // NNE wing
};
/** the footprint ring of the palace in the palace frame (counter clockwise seen from above is arbitrary: the walls are built from the edges) */
export const RING = [[34.3, 0], [11.2, 0], [11.2, 2.1], [-10.9, 2.1], [-10.9, 0], [-34.3, 0], [-34.35, -7.0], [-42.35, -7.0], [-42.4, -27.7], [-17.3, -27.8], [-17.3, -21.1], [-10.5, -21.1], [-10.5, -24.4],
  [9.8, -24.3], [9.8, -21.1], [15.0, -21.0], [15.0, -27.7], [41.6, -27.7], [41.6, -6.9], [34.3, -6.9]];

export const IDS = { palace: 'w28055973', kitchen: 'r10254212', gardener: 'w28055968', litD: 'w28055969', school: 'n5278196916' };

/** ------------------------------------------------------------------ the fence chains (world metres), from the OSM garden ring r10254219 and the mapped walls (docs 5.1 [C] "Fence line") */
// A: the garden boundary on the avenue side (w741702601 + the church plot fence w128092322 + the ring along the Bolshaya Nevka shore), from the west end of the kitchen block to the east cape shore
export const CHAIN_A = [[-2834.7, -5323.7], [-2841.9, -5327.8], [-2816.6, -5376.5], [-2819, -5378.8], [-2818.6, -5387.9], [-2810.9, -5399.9], [-2807.6, -5401.2], [-2804.4, -5400.3], [-2775.7, -5458.2],
  [-2761.6, -5454.6], [-2732.6, -5444], [-2686.6, -5424.2], [-2614.1, -5391.3], [-2546.6, -5361.6]];
// the two spurs that seal the 2-4 m strip between the north fence and the Bolshaya Nevka shore (they run into the water): at the church plot corner and at the north-east end (the east cape tongue is inside the garden, its lawn r10254217 reaches the shore)
export const CHAIN_S1 = [[-2775.7, -5458.2], [-2773.5, -5463.0]];
export const CHAIN_S2 = [[-2546.6, -5361.6], [-2546.0, -5368.5]];
// Z: the unmapped west side of the service yard, from the shed (lit. D) to the gardener house
export const CHAIN_Z = [[-2753.6, -5235.2], [-2752.1, -5206.9]];
// C: the checkpoint chain (w546166966 + w741702583 + w741702584 + w471360105 + w741702582): from the quay to the east end of the kitchen block
export const CHAIN_C = [[-2637.4, -5214.5], [-2643.2, -5219.2], [-2648.5, -5223.4], [-2658.8, -5231.6], [-2660.6, -5233], [-2665.1, -5236.6], [-2674.7, -5244.2]];
// W: the service yard (south of the kitchen block): the wall w471360112 from the block to the gardener's house, and the wall w128092321 along the avenue-side end (the yard's west wall)
export const CHAIN_W = [[-2692, -5240.3], [-2713.5, -5226.6], [-2734.3, -5213.6]];
export const CHAIN_Y = [[-2781, -5264], [-2850.4, -5297.4], [-2837.3, -5325.4]];
/** gates in the chains: { id, p: world point on the chain, kind, w: clear width } (n2753916822 church gate, n6066398208 service gate, n814049729 / n539610147 the two checkpoint gates) */
export const GATES = {
  main: { chain: 'A', seg: 1, at: 10, w: 4.4, scale: 1 },                         // the parade gate on the avenue side, 10 m along the wall w741702601 (P20 P22: [E] +-15 m)
  church: { p: [-2816.2, -5391.7], w: 3.2, scale: 0.8 },                          // n2753916822 (private): the church gate at the end of the central alley
  checkRoad: { p: [-2660.6, -5233], w: 4.0 },                                      // n539610147: the road end
  checkQuay: { p: [-2648.5, -5223.4], w: 2.6 },                                    // n814049729: the quay path
  service: { p: [-2713.5, -5226.6], w: 4.0 },                                      // n6066398208: the yard gate
};
/** the kitchen block ring r10254212 (world) */
export const KITCHEN = [[-2674.7, -5244.2], [-2679.6, -5234.2], [-2692, -5240.3], [-2799.2, -5293.6], [-2797.8, -5296.3], [-2838.3, -5316.4], [-2834.7, -5323.7]];
export const GARDENER = [[-2752.1, -5206.9], [-2736.4, -5216.8], [-2728.7, -5204.8], [-2744.4, -5194.8]];       // w28055968
export const LITD = [[-2774.6, -5270.1], [-2747.2, -5241.2], [-2753.6, -5235.2], [-2781, -5264]];                // w28055969
export const ROOF210 = [[-2728.4, -5291.2], [-2745.4, -5300.6], [-2739.4, -5311.5], [-2722.4, -5302.1]];        // r10254210 (an unknown 23 x 20 m "roof", [?]) stays generic
export const GUARD = [[-2814.8, -5149.3], [-2831.4, -5139], [-2837.8, -5152.2], [-2822.4, -5161.9]];       // w28055975 the guardhouse (Kamennoostrovsky 77)
export const ORANGERY = [[-2899.7, -5110.5], [-2879.7, -5121.6], [-2871.9, -5107.5], [-2891.8, -5096.4]];      // w60962405 the Great Stone Orangery (Rusca 1809-11)
