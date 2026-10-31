// landmarksPetrovskyYacht/frame.js - the model frames and the fixed numbers of the module (dossier docs/research/petrovsky-zhdanovka-2026.md; all positions re-measured in the baked data PE1..PE3 on 2026-10-13).
//   MAIN  yacht club main building w174319543 (Petrovskaya kosa 9 lit. K): OSM corners (-6238.7,-3607.5) (-6277,-3618.5) (-6266.1,-3656.6) (-6227.7,-3645.7); centre (-6252.375,-3632.075), 39.85 x 39.63 m, long axis
//        bearing 16 deg (x east, z SOUTH): model frame x = u along the south edge (ESE), z = the SOUTH normal (SSW), y up; rotation.y = -16 deg: world = C + (lx cos16 - lz sin16, lx sin16 + lz cos16).
//   Local sides (outward normal = local +z of the side frame): S front (land entrance), N (harbour hall), E, W (terrace).
export const DEG = Math.PI / 180;
export const MAIN = { x: -6252.375, z: -3632.075, rot: -16 * DEG, id: 'w174319543' };
export const mainWorld = (lx, lz) => ({ x: MAIN.x + lx * Math.cos(16 * DEG) - lz * Math.sin(16 * DEG), z: MAIN.z + lx * Math.sin(16 * DEG) + lz * Math.cos(16 * DEG) });
export const mainLocal = (x, z) => { const dx = x - MAIN.x, dz = z - MAIN.z; return { lx: dx * Math.cos(16 * DEG) + dz * Math.sin(16 * DEG), lz: -dx * Math.sin(16 * DEG) + dz * Math.cos(16 * DEG) }; };

/** vertical datum of the main building: y above the lawn (the island is flat, ground y = 0) */
export const H = {
  F: 1.0,                      // terrace A (the ground-floor floor) above the lawn
  apron: 0.5,                  // the lower stone apron round the terrace
  s1b: 4.5, s1t: 5.3,          // first slab: underside / top (F + 3.5 clear height, 0.8 m deep with the waffle beams)
  s2b: 8.4, s2t: 9.2,          // second slab
  top: 12.2,                   // top of the sloped glazed band
  par: 13.3,                   // top of the parapet band; the railing stands on it
};
/** plan numbers (local frame) */
export const P = {
  hx: 19.925, hz: 19.815,      // half sizes of the slab outline
  gi: 2.4,                     // ground-floor wall inset behind the Y pillars
  gi1: 1.3,                    // first-floor glass wall inset (balcony width)
  slope: 2.3,                  // plan inset of the sloped band from the slab edge to the parapet
  terr: 1.8, aprW: 4.6,        // terrace A / apron B widths beyond the slab edge
};

/** podium rectangles in the building frame (x0..x1, z0..z1): terrace A at F (it carries the annexes), the lower apron B; the two annexes of the OSM data: w200731329 (the glazed north hall) and w200731324 (the glazed west pavilion) */
export const POD = { A: { x0: -27.4, x1: 21.7, z0: -27.7, z1: 21.6 }, B: { x0: -31.5, x1: 24.5, z0: -31.5, z1: 24.4 } };
export const ANNEX_N = { id: 'w200731329', x0: -19.9, x1: 1.4, z0: -25.8, z1: -19.9 };
export const ANNEX_W = { id: 'w200731324', x0: -25.3, x1: -19.9, z0: -19.8, z1: -4.5 };

/** the Standart shed w200731337 (19.5 x 15 m): OSM corners; long axis bearing ~105 deg */
export const STANDART = { id: 'w200731337', cx: -5953.6, cz: -3490.2, poly: [[-5958.3, -3501.5], [-5943.9, -3497.6], [-5949, -3478.8], [-5963.4, -3482.8]] };
/** the Rops cottage site (OSM way w31065055, ruined:building=yes, 8 nodes; the house burned on 6 July 2026) */
export const ROPS = { id: 'w31065055', cx: -5906, cz: -3468 };
/** the Savina Veterans' Home complex w31065483 */
export const SAVINA = { id: 'w31065483', cx: -5397, cz: -3376.7 };
