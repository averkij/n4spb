// landmarksC/frame.js - the local frame of the Anichkov Bridge and its arch / deck profile (shared by bridge.js, closure.js, horses.js, boats.js).
//
// FRAME: origin = the middle of the bridge (CX, CZ), +u along the bridge axis toward the ESE (bearing 104.2 deg: the Nevsky axis), +v across it toward the SSW
// (downstream, the river flows along v), +y up.  A Group / Parts frame pushed with rotY = -TH maps local (x, z) = (u, v) to the world.  Numbers (docs/research/fontanka.md,
// section "Modelling spec" 5): deck 54.6 m between the abutment faces (u = +-27.3), 37.9 m wide (roadway 31.9 + 2 x 3.0 granite-slab pavements), three segmental arches 12.6 / 12.5 / 12.6 m
// with springing y -2.8 and crown soffit y +0.2 (rise 3.0), piers 3.6 m thick; the roadway is a gentle hump (+0.06 at the abutments, +1.5 at the crown).  The OSM river banks
// run along v at u = +-27.3 (east bank slightly converging): the structure is continued 2.2 m into the land at both ends (EXT) so that no sliver of water remains at the corners.
export const TH = 14.2 * Math.PI / 180;
export const CU = Math.cos(TH), SU = Math.sin(TH);
export const CX = -441.5, CZ = -91.8;
export const HALF = 27.3, EXT = 29.5;
export const FACE = 18.6, EDGE = 18.95, ROAD = 15.95;           // spandrel face / outer face of the cornice / half width of the roadway
import { NAVIGABLE_WATER_Y } from '../environment/water-level.js';
export const SPRING = -2.8, CROWN = 0.2, WATER = NAVIGABLE_WATER_Y, FOOT = WATER - 0.35, STAIN_TOP = -1.35;
export const H0 = 0.06, H1 = 1.5;
export const ARCHES = [[-22.45, -9.85], [-6.25, 6.25], [9.85, 22.45]];

/** deck level (roadway surface) at u */
export const yDeck = (u) => { const a = Math.min(Math.abs(u), HALF) / HALF; return H0 + (H1 - H0) * (1 - a * a); };
/** dy / du of the deck */
export const slope = (u) => (Math.abs(u) >= HALF ? 0 : -2 * (H1 - H0) * u / (HALF * HALF));
/** local (u, v) -> world (x, z) */
export const toWorld = (u, v) => ({ x: CX + u * CU - v * SU, z: CZ + u * SU + v * CU });
/** world (x, z) -> local (u, v) */
export const toUV = (x, z) => ({ u: (x - CX) * CU + (z - CZ) * SU, v: -(x - CX) * SU + (z - CZ) * CU });
/** rotY of a physics box whose local x runs along u (addBox / addWalkBox) and of a ramp whose local z runs along +u (addWalkRamp) */
export const BOX_ROT = -TH, RAMP_ROT = Math.atan2(CU, SU);

/** soffit height of arch k at u (segmental arch: chord 12.5-12.6, rise 3.0) */
export function archY(k, u) {
  const [a, b] = ARCHES[k], hw = (b - a) / 2, uc = (a + b) / 2, h = CROWN - SPRING, R = (hw * hw + h * h) / (2 * h);
  const d = u - uc; if (Math.abs(d) > hw) return SPRING;
  return CROWN - R + Math.sqrt(R * R - d * d);
}
/** u where the soffit of arch k is at height y (side: -1 left, +1 right) */
export function archU(k, y, side) {
  const [a, b] = ARCHES[k], hw = (b - a) / 2, uc = (a + b) / 2, h = CROWN - SPRING, R = (hw * hw + h * h) / (2 * h);
  const dy = y - (CROWN - R); return uc + side * Math.sqrt(Math.max(0, R * R - dy * dy));
}
/** sample stations along the deck (u values): both ends, the abutment faces and a station every ~1.36 m */
export const STATIONS = (() => { const s = [-EXT]; for (let i = 0; i <= 40; i++) s.push(-HALF + i * (2 * HALF / 40)); s.push(EXT); return s; })();
