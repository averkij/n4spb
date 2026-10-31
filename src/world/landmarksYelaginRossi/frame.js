// landmarksYelaginRossi/frame.js - the measured frames of the four Rossi park sights of Yelagin Island (local metres: x east, z SOUTH, y up; ground y = 0, Neva water y = -3.4).
// Everything below is MEASURED on the baked OSM records (src/world/data/city-k1.js / city-ka1.js, 2026-10-13) unless it says [E] (estimate from photos, dossier yelagin-park-2026.md 5.8 + 13 + BUILD LOG).
//
// MUSIC PAVILION  w194544053 (-4620.9,-4926.6), 221 m2.  The 9-vertex ring is a rectangle 22.74 m on the FRONT edge (-4623,-4914.3) -> (-4610.5,-4933.3) with the half rotunda bulging 4.8 m behind the two
//   cubic wings.  Local frame: origin = the middle of the front edge, x along the front (u), z OUT of the front (v), toward the Srednyaya Nevka (bearing 123 deg); the body lies at v < 0.
//   rotY = 0.98889 (local +z -> world (0.8354, 0.5496), local +x -> world (0.5496, -0.8354)).  Back wall of the wings v = -7.6 (OSM -7.5 / -7.85), rotunda apex v = -12.43 (OSM -12.43).
// EAST PAVILION  r2590124 (-4365.3,-5375.1), 201 m2: a 17.7 x 8.8 m rectangle (long axis N-S, the park face is the WEST long side) + the oval portico bulging 4.3 m east of the east face.
//   Local frame: origin = the middle of the east face line A (-4359.8,-5367.5) -> D (-4365.3,-5384.4), z OUT of that face (EAST, bearing 72 deg), x along the face (toward the north: local +x -> world
//   (-0.3095, -0.9509)); rotY = 1.8850 (local +z -> world (0.9509, -0.3095)).  The west wall lies at z = -8.8, the oval spans x +-5.6, z 0 .. +4.3 [OSM vertices I H G F E].
// EAST SPIT  r2590123 "Восточная стрелка" (footway area 31.6 x 30.3 m: the paved terrace round the pavilion, 700 m2) and GRANITE PIER r12316492 "Гранитная пристань" (the stair notch at the east shore, 4 x 15 m).
// GUARDHOUSE SITE  w100822197 (-4568.7,-5015.3) building=ruins: ring (-4574.7,-5025.5) (-4559.6,-5022.9) (-4562.6,-5005.1) (-4577.7,-5007.6) = 15.3 x 18.0 m.  No building stands (burnt 1996).
// ISLAND PAVILION  w181430159 "4 литАЖ" (34 m2, an unnamed OSM building: ring (-5341.8,-5116) (-5336.1,-5113.9) (-5338,-5108.7) (-5343.7,-5110.8) = a 6.1 x 5.5 m roof outline, long side 20 deg off the east axis) on the
//   WEST islet of the 3rd Southern pond (r1567613 hole centre (-5344.5,-5109.9), 80 x 46 m).  The address 4АЖ is the heritage address of the Commons category "Small Island Pavilion" (heritage id 7810363024), Wikidata
//   Q136065240 P625 (-5343.1,-5115.7) is 5 m SW of the outline.  (The dossier / critic say "not in OSM" and the geotag (-5480,-5154): both wrong, that is the pond tip.)
export const MUSIC = { id: 'w194544053', x: -4616.75, z: -4923.8, rotY: 0.98889 };
export const EAST = { id: 'r2590124', x: -4362.55, z: -5375.95, rotY: 1.8850 };
export const GUARD = { id: 'w100822197', ring: [[-4574.7, -5025.5], [-4559.6, -5022.9], [-4562.6, -5005.1], [-4577.7, -5007.6]] };
export const ISLAND = { id: 'w181430159', x: -5339.9, z: -5112.3, rotY: -0.3535 };       // local +x -> world (0.938, 0.346) = the long side of the OSM outline
/** the shore of the east tip (OSM quay walls w907143573 / 572 / 574): north to south */
export const TIP_SHORE = [[-4335.5, -5361.6], [-4333.8, -5367.4], [-4331.9, -5371.7], [-4331.2, -5376.1], [-4331.1, -5380.4], [-4332.2, -5386.0], [-4334.3, -5391.0], [-4340.2, -5397.0]];
/** the paved spit r2590123 */
export const SPIT_RING = [[-4365.3, -5384.4], [-4359.2, -5391.8], [-4344.2, -5393.8], [-4340.2, -5397], [-4334.3, -5391], [-4337, -5387.7], [-4335.9, -5383.6], [-4335.5, -5378.5], [-4331.2, -5376.1], [-4331.9, -5371.7], [-4333.8, -5367.4], [-4339.6, -5369.1], [-4357.2, -5364.5], [-4359.8, -5367.5]];
/** the stair notch r12316492 (granite pier) */
export const PIER_RING = [[-4331.2, -5376.1], [-4335.5, -5378.5], [-4335.9, -5383.6], [-4337, -5387.7], [-4334.3, -5391], [-4332.2, -5386], [-4331.1, -5380.4]];
export const WATER = -3.4;       // layout WATERWAYS.neva
/** local (u, v) of a frame -> world [x, z] */
export const toWorld = (F, u, v) => { const c = Math.cos(F.rotY), s = Math.sin(F.rotY); return [F.x + c * u + s * v, F.z - s * u + c * v]; };
/** world (x, z) -> local [u, v] of a frame */
export const toLocal = (F, x, z) => { const c = Math.cos(F.rotY), s = Math.sin(F.rotY), dx = x - F.x, dz = z - F.z; return [c * dx - s * dz, s * dx + c * dz]; };
