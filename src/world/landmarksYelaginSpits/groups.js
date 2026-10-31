// landmarksYelaginSpits/groups.js - claims and the HAND-OVER data to environment (pure data; environment/owners.js reads WATER_RINGS / BANK_RINGS / KEEP_OUT / PAVED_RINGS from here once the module is registered
// there: docs/research/islands2-requests-landmarksYelaginSpits.md).  Claims are ON only for what the module draws:
//   * the two lions (nodes n1269584659 / n1269584661): the generic monument markers stop (the viewpoint n11283884497 and the misused "cliff" node n300951745 are not baked: nothing to claim)
//   * the wall w1217811692, the returns w1217811694 / w1217811695 and the two flights w1217811699 / w1217811698 (streets draws OSM steps as flat strips across the quay wall)
//   * the footway area w1217811697 (the "unpaved" plaza + wing ring): the module lays its own gravel over it (terrace.js)
//   * the two granite benches n11283867340 / n11283867339 (drawn with S legs)
// NOT claimed: the cobble embankments w1217811700 / w1217811701 (the water owner), the footways and the other benches of the spit.
import { world, flightRing, CORNERS, HL, faceB } from './frame.js';

export const GROUPS_LIST = [
  { key: 'yelagin-spit', name: 'Западная стрелка Елагина острова: терраса со львами', nameEn: 'Yelagin Island west spit: terrace and the two lions', ids: [],
    osm: ['n1269584659', 'n1269584661', 'w1217811692', 'w1217811694', 'w1217811695', 'w1217811698', 'w1217811699', 'w1217811697', 'n11283867339', 'n11283867340'],
    at: [-6417, -5308],
    note: 'Pink granite arc wall 30.4 m (5 courses, parapet 1 m, two returns with granite benches), two corner plinths with the white Pudost limestone lions, two granite flights to the water, raised gravel terrace with low park steps. Cobble wings w1217811700/01 stay with the water owner.' },
];

// a ring of the shore the module draws completely: the wall face, the returns and both flights (+ 2.5 m round them); no wall / parapet / collider of environment on it
const faceRing = () => {
  const out = [], inn = [];
  for (let i = 0; i <= 12; i++) { const a = -HL - 2.5 + (2 * HL + 5) * i / 12, b = a < -HL || a > HL ? 0 : faceB(a); out.push(world(a, b + 1.2)); inn.push(world(a, b - 1.4)); }
  return out.concat(inn.reverse());
};
export const BANK_RINGS = [{ id: 'spit-wall', ring: faceRing() }];
// the two flights are cut into the ground like the Spit descent of landmarksStrelka: their footprints count as water (the module draws the treads, cheeks and colliders)
export const WATER_RINGS = CORNERS.map((c) => ({ id: 'flight-' + c.key, key: 'neva', ring: flightRing(c) }));
// no generated descent, stage or boat on the wall (a circle of 20 m round the middle of the wall)
export const KEEP_OUT = [{ id: 'spit-wall', c: world(0, -2), r: 22 }];
// the terrace is paved by the module: no trunks, hedges or grass tufts of the generic scene on it
export const PAVED_RINGS = [{ id: 'terrace', ring: [world(-14, -0.3), world(14, -0.3), world(14, -13.4), world(-14, -13.4)] }];
