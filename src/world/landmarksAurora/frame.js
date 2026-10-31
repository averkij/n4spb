// landmarksAurora/frame.js - frames and constants of the embankment sights (docs/research/aurora.md sections 2.1, 3, 4, 5).
//   SHIP: the cruiser Aurora (OSM r3272566): origin = the middle of the hull on the water line (-753.05, -2561.8), model +x = toward the bow (0.4168, 0.9090: the bow points SSE, to the Neva),
//         model +z = starboard = toward the quay, y = 0 the WATER LINE (the build pushes the frame down to the water level).  shipW(s, t) -> world.
//   LIONS: the Shi-Tsza descent: origin = the middle between the two lions (-1111.7, -2246.4) on the main quay line, +x (u) = along the quay to the ENE (0.912, -0.410), +z (v) = out to the Neva.
//   SCHOOL / CABIN: baked footprints w28712204 / w28712275 (walls are drawn on their edges: see school.js / cabin.js).
import * as L from '../layout.js';

/** rotY of a model whose +x points along the world direction (dx, dz) (three's Ry: +x -> (cos, -sin), +z -> (sin, cos)) */
export const rotOf = (dx, dz) => Math.atan2(-dz, dx);
const frameOf = (x, z, ax) => { const rot = rotOf(ax[0], ax[1]), zx = [Math.sin(rot), Math.cos(rot)]; return { x, z, ax, zx, rot, w: (u, v) => ({ x: x + ax[0] * u + zx[0] * v, z: z + ax[1] * u + zx[1] * v }), loc: (px, pz) => ({ u: (px - x) * ax[0] + (pz - z) * ax[1], v: (px - x) * zx[0] + (pz - z) * zx[1] }) }; };

export const SHIP = { ...frameOf(-753.05, -2561.8, [0.4168, 0.9090]), LOA: 126.8, beam: 16.8 };
export const LIONS = { ...frameOf(-1111.7, -2246.4, [0.912, -0.410]), half: 10.55, stairHalf: 9.3, front: 4.05 };
export const NEVA_Y = -3.4;
/** water level under the ship: the waterway of the environment when it exists, else the Neva datum */
export function shipWaterY() { try { const y = L.waterLevelAt && L.waterLevelAt(SHIP.x, SHIP.z); if (typeof y === 'number' && y < -0.5) return y; } catch (e) { /* layout without waterways */ } return NEVA_Y; }
export const shipAfloat = () => { try { return L.heightAt(SHIP.x, SHIP.z) < -1; } catch (e) { return false; } };

export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
export const SCHOOL_ID = 'w28712204', CABIN_ID = 'w28712275', BOOTH_ID = 'w1229214445', TICKET_ID = 'w486091825', SHIP_ID = 'r3272566';
export const BUST = { x: -1127.8, z: -2286.6 };                       // OSM n1558527389 (Peter I before his cabin)
export const NAKHIMOV_BUST = { x: -825.9, z: -2563.3 };               // OSM n1829824637
export const CADET = { x: -828.3, z: -2537.8 };                       // OSM n6548233166 «Юный нахимовец»
export const FLEET = { x: -782, z: -2441.7 };                         // OSM n1830948973 «Морякам и создателям флота России»
export const STELE = { x: -791.3, z: -2555 };                         // OSM n6548233165
