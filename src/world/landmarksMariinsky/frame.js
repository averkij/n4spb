// landmarksMariinsky/frame.js - the frames of the Mariinsky Theatre (dossier docs/research/mariinsky.md section 2.2).
//   Frame T: origin C = the middle of the portico facade (-3058.3, 736.3); n = out of the facade = bearing 65.5 deg (unit (0.912, -0.414)), u = along the facade towards the SSE (unit (0.414, 0.912)).
//   The OSM ring of r1690283 is rectilinear in (u, n): portico facade n = 0, u -11.5..11.3; avant-corps n = 1.8; side-entrance wall u = 23.6; south-east wing n = -33.5 (u 28.1..91.3); canal front n -68..-84.
//   `TW(u, n)` -> world [x, z]; `TL(x, z)` -> [u, n].  `rotT` = rotY of a model whose +z points along n (so model +x = -u = to the north, "right seen from the street").
export const C = { x: -3058.3, z: 736.3 };
export const NX = 0.912, NZ = -0.414;           // n
export const UX = 0.414, UZ = 0.912;            // u
export const ROT_T = Math.atan2(NX, NZ);        // rotY: model +z -> n
export const TW = (u, n) => [C.x + UX * u + NX * n, C.z + UZ * u + NZ * n];
export const TL = (x, z) => { const dx = x - C.x, dz = z - C.z; return [dx * UX + dz * UZ, dx * NX + dz * NZ]; };
/** world frame helper: P.push(...frameAt(u, n, face)) where face = 'n' (model +z -> +n), 'u' (+z -> +u), '-n', '-u' */
export function frameAt(u, n, face = 'n') {
  const [x, z] = TW(u, n);
  const rot = { n: ROT_T, u: Math.atan2(UX, UZ), '-n': Math.atan2(-NX, -NZ), '-u': Math.atan2(-UX, -UZ) }[face];
  return [x, 0, z, rot];
}
// the Conservatory: frame S - origin at the middle of its north front, n_s out of the north front (bearing 25 deg), u_s along it to the east
export const S0 = { x: -2991.65, z: 680.0 };      // middle of (-3031.7,699.1)-(-2951.6,660.9)
const cs = Math.atan2(660.9 - 699.1, -2951.6 + 3031.7);    // direction of the front edge, world angle in the (x, z) plane
export const SU = [Math.cos(cs), Math.sin(cs)];                     // along the front (towards the ENE)
export const SN = [SU[1], -SU[0]];                                  // out of the north front
export const SW = (u, n) => [S0.x + SU[0] * u + SN[0] * n, S0.z + SU[1] * u + SN[1] * n];
export const SL = (x, z) => { const dx = x - S0.x, dz = z - S0.z; return [dx * SU[0] + dz * SU[1], dx * SN[0] + dz * SN[1]]; };
export const MONUMENTS = { glinka: { x: -2970.4, z: 786.4 }, rk: { x: -3025.9, z: 661.5 } };
