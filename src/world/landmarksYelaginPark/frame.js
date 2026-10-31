// landmarksYelaginPark/frame.js - the measured positions of the park sights (local frame: x east, z SOUTH, metres; OSM ids of docs/research/yelagin-park-2026.md; [OSM] = measured on the
// baked data of 2026-10-13, [E] = estimate).  Ground is y = 0 (park ponds: water POND_Y = -0.35, environment/river.js).
export const HERC = { id: 'n1157615795', x: -5544.9, z: -5113.7, tip: [-5549, -5132] };       // Farnese Hercules on the cape of the 4th Southern pond; the tip of the cape lies 18 m NNW (the statue looks over it, hercules 4 / 9 / 10)
export const KIROV = { id: 'n4353822789', x: -5213.7, z: -4908.7, look: [-5217, -4895] };      // the bust opposite the 2nd Yelagin bridge; it looks at the alley w737907890 / the bridge head to the south
export const VENT = { id: 'w107154084', x: -5248.4, z: -4901.8 };                              // metro ventilation pavilion ref 511 (ring of 16 vertices, 7.0 x 6.9 m [OSM])
export const BEAR = { id: 'n1269595927', x: -4615.1, z: -5129.9 };                              // the carved wooden bear with the accordion (OSM name "Старик"), Commons geotag (-4638,-5129)
export const THEATRE = { roofs: ['w717885285', 'w717885286'], stage: 'w717885287', fence: 'w717885288' };
export const PIERS = { boat: 'w100146184', cat: 'w699822919', dock: 'w100868959', stage2: 'w111429666' };
export const POND_Y = -0.35;                                                                    // environment/river.js
export const NEVA_Y = -3.4;                                                                     // the Srednyaya Nevka (WATERWAYS.neva.water)
