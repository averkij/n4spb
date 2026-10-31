// landmarksYelaginSpits/frame.js - the local frame of the west spit of Yelagin Island ("пристань со львами") and every number the other files share.
//
// WHAT THE PLACE IS (dossier docs/research/yelagin-park-2026.md 5.1 + 13, photos refs/yelagin-park-2026/spit 01-28): a granite view terrace on the made-land cape of the island, built by L. A. Ilyin in the 1920s.
// The WALL (OSM w1217811692, 30.4 m) is a shallow arc bulging toward the Gulf (OSM: sagitta 1.9 m, R about 60 m, the dossier says 65), faced with pink granite blocks in five courses; on top a belt of flat stones and
// a blind granite PARAPET 1 m high on three sides: the face and the two short RETURNS (w1217811694 / w1217811695) that carry the granite BENCHES.  At the two corners stand the square granite PLINTHS with a white
// limestone slab each and a Pudost limestone LION on it (paw on a ball); beside each corner a steep granite FLIGHT (w1217811699 / w1217811698, 5.1 / 4.5 m) goes down along the return to the water; cobble slopes
// (the water owner's) continue to both sides.  The terrace is a sand-gravel plaza; broad low steps lead up to it from the park lawn (photo 25).
//
// LOCAL FRAME (this module draws everything in it and the mesh group is turned into the world once):
//   x = a : along the wall, from the NORTH corner A (a = -15.18) to the SOUTH corner B (a = +15.18)
//   z = b : out of the wall toward the water (WSW, azimuth 255.5 deg); the terrace and the park lie at b < 0
//   y     : street level of the engine = 0 (the lawn); the terrace is raised by TERRACE m; the Neva water is WATER = -3.4
// The group is positioned at O (the middle of the chord A-B) and turned by ROT = about -75.5 deg: local +x -> world (0.250, 0.968), local +z -> world (-0.968, 0.250).  Physics boxes use the same convention
// (addBox(cx, cz, w, d, rotY): w along local x, d along local z), so loc() / box() below map a local rectangle to world numbers.
export const A_END = { x: -6424.2, z: -5321.6 };   // OSM w1217811692 north end (wall corner A)
export const B_END = { x: -6416.6, z: -5292.2 };   // south end (corner B)
export const O = { x: (A_END.x + B_END.x) / 2, z: (A_END.z + B_END.z) / 2 };
const ux = B_END.x - A_END.x, uz = B_END.z - A_END.z, ul = Math.hypot(ux, uz);
export const U = [ux / ul, uz / ul];                 // along the wall, north to south
export const N = [-U[1], U[0]];                      // outward normal (to the water): (-0.968, 0.250)
export const ROT = Math.atan2(N[0], N[1]);           // three.js rotation.y of the group
export const HL = ul / 2;                            // half chord length 15.18
export const R_WALL = 60;                            // arc radius fitted to the three OSM vertices (w1217811692: sagitta 1.87 m at a = -3.2)
const SAG = R_WALL - Math.sqrt(R_WALL * R_WALL - HL * HL);
/** b of the wall face (outer face) at a: 0 at the corners, +SAG at the apex */
export const faceB = (a) => Math.sqrt(R_WALL * R_WALL - a * a) - Math.sqrt(R_WALL * R_WALL - HL * HL);
export const APEX = SAG;

export const WATER = -3.4;          // Neva water level of the engine (layout WATERWAYS.neva)
export const FOOT = -3.55;          // wall foot, 15 cm under the water like the generic quay
export const TERRACE = 0.30;        // the plaza is raised by this against the park lawn (3 treads in photo 25 -> 2 risers of 0.15 here)
export const COURSE = (TERRACE - FOOT) / 5;   // five courses from the foot to the terrace level (0.77 m; the dossier: 72 cm blocks)
export const BELT = 0.14;           // the belt of flat stones between the wall and the parapet
export const PARAPET_H = 1.0;       // above the terrace
export const PARAPET_T = 0.55;      // thickness
export const CAP = 0.07;            // the parapet slab sticks out over the face by this
export const PLINTH = { w: 1.9, h: 2.0, capH: 0.2, slabH: 0.15, slabW: 2.08 };
export const PROUD = 0.06;          // the whole drawn wall stands this far in front of the OSM face line: it clears the generic quay face (coplanar faces z-fight) as long as environment still draws its own wall there
export const PLINTH_CZ = (PROUD - PLINTH.w) / 2;   // z' of the middle of a plinth in its corner frame   // granite cube (above the terrace), the red-brown cap course, the white limestone slab
export const RETURN_OSM = { n: [[-15.18, 0], [-13.73, -6.02]], s: [[15.18, 0], [13.89, -5.81]] };   // the returns in the local frame (measured from w1217811694 / w1217811695)
export const TERRACE_E = -13.2;     // east edge of the plaza (the park side) in b

/** local (a, b) -> world [x, z] */
export const world = (a, b) => [O.x + U[0] * a + N[0] * b, O.z + U[1] * a + N[1] * b];
/** world (x, z) -> local [a, b] */
export const local = (x, z) => [(x - O.x) * U[0] + (z - O.z) * U[1], (x - O.x) * N[0] + (z - O.z) * N[1]];
/** physics rectangle of a local rectangle (centre a, b; size w along the wall, d along b), extra rotation r about y */
export const box = (a, b, w, d, r = 0) => { const [x, z] = world(a, b); return [x, z, w, d, ROT + r]; };

/** the wall face as a polyline of n segments from A to B: [[a, b], ...] */
export function faceLine(n = 12) { const r = []; for (let i = 0; i <= n; i++) { const a = -HL + 2 * HL * i / n; r.push([a, faceB(a)]); } return r; }

// ---- corner frames: the plinth, the return and the flight of each corner lie in a frame at the corner whose x' axis is the TANGENT of the arc there (14.6 deg off the chord), z' points to the water
export const PHI = Math.atan2(HL, Math.sqrt(R_WALL * R_WALL - HL * HL));
export const CORNERS = [
  { key: 'n', a: -HL, b: 0, psi: -PHI, sx: 1 },       // sx: the side of x' on which the plinth / return / bench lie (+1 north corner, -1 south corner)
  { key: 's', a: HL, b: 0, psi: PHI, sx: -1 },
];
/** corner frame (x', z') -> local (a, b) */
export const cornerPoint = (c, xp, zp) => [c.a + xp * Math.cos(c.psi) + zp * Math.sin(c.psi), c.b - xp * Math.sin(c.psi) + zp * Math.cos(c.psi)];
/** the descent flights (stairs.js): tread count / sizes, the head z' and the water landing */
export const FLIGHT = { n: 20, rise: 0.16, run: 0.255, w: 1.9, inner: 0.45, outer: 0.3, head: -5.1, yHead: 0, landing: WATER + 0.2, kerb: 0.10 };
/** the footprint of a flight's pit in world coordinates (flat [x, z, ...]): treads + both cheeks from the head to 0.4 m past the water line */
export function flightRing(c) {
  const F = FLIGHT, s = c.sx > 0 ? -1 : 1, xo = s * (F.inner + F.w + F.outer);
  return [[0, F.head], [xo, F.head], [xo, 0.4], [0, 0.4]].flatMap(([xp, zp]) => world(...cornerPoint(c, xp, zp)));
}
