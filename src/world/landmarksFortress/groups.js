// landmarksFortress/groups.js - the layout.GROUPS sub-groups of module landmarksFortress (data only: the id lists come from the generated osm-data.js, no layout import). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Everything on Zayachy Island is DRAWN by landmarksFortress (docs/research/fortress.md):
// the ramparts, ravelins and gates, the cathedral and the Grand Ducal Burial Vault, every house inside, the ground (cobbles, lawns, paths, beach, banks), the furniture and both island bridges.
// ISLAND_RING ([[x, z], ...]) is re-exported for the environment's claim mask (no generic trees / lawns on the island) and for people / props.
import { ISLAND_RING, ON_ISLAND } from './osm-data.js';

export { ISLAND_RING };
const B = ON_ISLAND.buildings;
const FORT = ['r227969', 'r2594679', 'r2594690', 'r16219162', 'r16219164', 'w422056236'];                       // main rampart, Ioannovsky + Alekseevsky ravelins, batardeaux, Flagstaff tower
const CHURCH = ['r2594681', 'r2594692', 'r8857004'];                                                              // cathedral, burial vault + gallery, Boathouse
const BRIDGES = ['w373635641', 'r5555259', 'w373634486', 'w916794286', 'w916794288', 'r5555211', 'w1360562178', 'w1377364608', 'w1377364609', 'w1377367596', 'w530434783'];
const BR = new Set([...BRIDGES, ...ON_ISLAND.bridgeRoads]);
// every id once: a way can sit in two lists of the extract (steps are roads too, a pitch is a green), the bridge ways belong to the bridges group
const GROUNDS = [...new Set([...ON_ISLAND.greens, ...ON_ISLAND.roads, ...ON_ISLAND.areas, ...ON_ISLAND.barriers, ...ON_ISLAND.walls, ...ON_ISLAND.steps, ...ON_ISLAND.pitches, ...ON_ISLAND.parking, ...ON_ISLAND.crossings, ...ON_ISLAND.nodes, 'w51399031', 'n1521079740'])].filter((id) => !BR.has(id) && !B.includes(id));
export const GROUPS_LIST = [
  { key: 'fortress-walls', name: 'Петропавловская крепость: бастионы, куртины, равелины, ворота', nameEn: 'Peter and Paul Fortress: bastions, curtains, ravelins, gates, Flagstaff tower', ids: FORT.filter((id) => B.includes(id)),
    osm: [], at: [-1945, -1969], note: 'r227969 the main rampart (six bastions, six curtains), r2594679 Ioannovsky ravelin, r2594690 Alekseevsky ravelin, r16219162 / r16219164 batardeaux, w422056236 Flagstaff tower' },
  { key: 'fortress-cathedral', name: 'Петропавловский собор, Великокняжеская усыпальница, Ботный дом', nameEn: 'Peter and Paul Cathedral, Grand Ducal Burial Vault, Boathouse', ids: CHURCH.filter((id) => B.includes(id)),
    osm: [], at: [-1947, -1982], note: 'r2594681 cathedral (bell tower 122.5 m), r2594692 vault + gallery, r8857004 Boathouse' },
  { key: 'fortress-houses', name: 'Здания крепости: Монетный двор, Комендантский и Инженерный дома, гауптвахта, цейхгауз, тюрьма Трубецкого бастиона', nameEn: 'Houses of the fortress: Mint, Commandant\'s and Engineers\' houses, Guardhouse, Zeughaus, Trubetskoy prison, officers\' houses, archive, kiosks',
    ids: B.filter((id) => !FORT.includes(id) && !CHURCH.includes(id)), osm: [], at: [-1936, -1911], note: 'every other building footprint of the island (generated list: osm-data.js ON_ISLAND.buildings)' },
  { key: 'fortress-grounds', name: 'Заячий остров: площадь, аллеи, газоны, пляж, берега', nameEn: 'Zayachy Island grounds: Cathedral square, alleys, lawns, beach, banks, fences, steps, furniture, monuments',
    ids: [], osm: GROUNDS,
    at: [-1900, -1960], note: 'green polygons, footways / service ways, areas, barriers, steps, lamps, benches, trees, monuments inside ISLAND_RING (generated); w51399031 the Commandant pier; n1521079740 the Hare on its pile' },
  { key: 'fortress-bridges', name: 'Иоанновский и Кронверкский мосты', nameEn: 'Ioannovsky Bridge and Kronverksky Bridge (timber bridges of the island)', ids: [],
    osm: [...BR], at: [-1619, -2191],
    note: 'Ioannovsky: deck r5555259 + way w373635641; Kronverksky: deck r5555211 + ways w373634486 / w916794286 / w916794288; the temporary bypass bridge of 2025-26 (w1360562178, deck w1377364608, footways w1377364609 / w1377367596) is claimed and NOT drawn; w530434783 the stairs of the Naryshkin bastion' },
];
