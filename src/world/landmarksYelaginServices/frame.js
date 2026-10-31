// landmarksYelaginServices/frame.js - the model frames and fixed numbers of the module (dossier docs/research/yelagin-palace-2026.md sections 6, 9, 12, 14 BUILD LOG; baked footprints of city-k1 / city-ye1).
// Every building of the Rossi service court is turned about 4.6 deg against the world axes (the OSM rings of the Stable and the Orangery are rectangles in a frame tilted by 4.4 .. 4.8 deg: the east end of the
// south front lies 1.7 m north of its west end), so the module draws each building in its OWN frame:  local +x = east-ish (to the right of a visitor who looks at the south front), local +z = SOUTH-ish
// (out of the south front, toward the Oil Meadow), y up from the lawn (the island is flat, y = 0).  World(x, z) = O + x * (cos r, -sin r) + z * (sin r, cos r); this is exactly the frame of Parts.push(ox, 0, oz, rotY = r)
// and of physics.addBox(cx, cz, w, d, rotY = r) where w runs along local x and d along local z.
//   ST  Stable (Конюшенный корпус)  origin = the middle of the south edge of the front court (= the north edge of the colonnade), r = 4.58 deg
//   OR  Orangery (Оранжерея)        origin = the middle of the central pavilion's south front line, r = 4.80 deg
// Local plan numbers are read off the baked rings (tools/landmarksYelaginServices-plan.mjs prints them); see the header of stable.js / orangery.js for the meaning.
const D2R = Math.PI / 180;
export const ST = { x: -4817.1, z: -5287.15, rot: 4.58 * D2R };
export const OR = { x: -4630.5, z: -5326.5, rot: 4.8 * D2R };

/** local (x, z) of a frame -> world { x, z } */
export const toWorld = (F, x, z) => { const s = Math.sin(F.rot), c = Math.cos(F.rot); return { x: F.x + x * c + z * s, z: F.z - x * s + z * c }; };
/** world (x, z) -> local { x, z } of a frame */
export const toLocal = (F, x, z) => { const dx = x - F.x, dz = z - F.z, s = Math.sin(F.rot), c = Math.cos(F.rot); return { x: dx * c - dz * s, z: dx * s + dz * c }; };
/** a frame for a rotated rectangle building: origin (x, z), facing direction (nx, nz) = the outward normal of the main front */
export const frameFacing = (x, z, nx, nz) => ({ x, z, rot: Math.atan2(nx, nz) });

// ------------------------------------------------------------------------------------------------ the Stable (ST frame)
export const STB = {
  // volumes (local metres; x0..x1 across, z0..z1 north..south)
  colo: { x0: -10.6, x1: 10.6, z0: 0.0, z1: 8.2 },                 // the colonnade block between the pavilions (OSM w736544124)
  pav: { x0: 10.6, x1: 22.45, z0: -0.1, z1: 10.0 },               // the east pavilion (mirrored for the west one)
  wing: { x0: 10.6, x1: 20.7, z0: -20.7, z1: -0.1 },               // the east wing
  cross: { x0: -22.4, x1: 22.4, z0: -30.8, z1: -20.7 },            // the cross wall with the arch passage
  court: { x0: -10.6, x1: 10.6, z0: -20.7, z1: 0.0 },              // the front court (cobbles)
  round: { cx: 0.6, cz: -34.8, R: 12.1, R2: 21.1, zCut: -30.8 },   // the round court and the outer arc of the apse ring
  northBlock: { x0: -14.8, x1: 15.9, z0: -68.4, z1: -49.3 },
  hCornice: 8.1, hApex: 10.6,                                      // pavilion cornice / pediment apex
  hWing: 7.4, hCross: 7.6, hApse: 5.0, hColo: 6.55,                 // wing cornice, cross wall cornice, apse wall, colonnade entablature top
  colH: 4.9, colD: 0.92,                                           // Doric column height with capital / lower diameter
  archW: 3.4, archH: 4.0,                                          // the arch through the cross wall
};
// ring of the apse (OSM w736544126) in ST local metres, from the baked data: inner = the round court, outer = arcs + the north block.  Filled by plan() in stable.js (it reads the world ring and converts).
export const APSE_ID = 'w736544126', STABLE_ID = 'r2420060';

// ------------------------------------------------------------------------------------------------ the Orangery (OR frame)
export const ORN = {
  center: { x0: -10.7, x1: 10.6, z0: -15.5, z1: 3.4 },
  galW: { x0: -47.4, x1: -10.8, z0: -8.8, z1: 1.4 },
  galE: { x0: 10.8, x1: 48.2, z0: -9.8, z1: 2.0 },
  endW: { x0: -61.6, x1: -47.4, z0: -18.5, z1: 3.2 },
  endE: { x0: 47.7, x1: 62.1, z0: -18.6, z1: 3.2 },
  hCenter: 9.2, hAttic: 11.0, hEnd: 8.2, hPlinth: 0.9,
};

// ------------------------------------------------------------------------------------------------ the claims (ids of the OSM objects the module draws) used by the layout test
export const IDS = {
  stable: ['r2420060', 'w181423913', 'w181423912', 'w181423915', 'w736544126', 'w736544149', 'w736544124'],
  orangery: ['w23150126', 'w736544144', 'w736544134', 'w736544122', 'w736544136', 'w736544128'],
  houses: ['w181423911', 'w100820382', 'w181423910', 'w181423909', 'w181423904'],
};
