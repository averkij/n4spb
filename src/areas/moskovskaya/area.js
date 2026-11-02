// Planning map 6: Moscow Gate, Moskovsky Prospekt, Victory Park and Chesme.
// Exact source OSM geometry plus surveyed supplemental side streets; water
// remains reachable, islands dry, and the generic bridge service owns its decks.
import { GROUPS_LIST as GATE_GROUPS } from '../../world/landmarksMoskovsky/groups.js';
import { GROUPS_LIST as DISTRICT_GROUPS } from '../../world/landmarksMoskovskaya/groups.js';
import { GROUPS_LIST as PARK_GROUPS, PAVED_RINGS as PARK_PAVED, FOUNTAIN_WATER_BODIES } from '../../world/landmarksMoskovskayaPark/groups.js';
import { inFormalTreeClearing } from '../../world/landmarksMoskovskayaPark/plan.js';
import { COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES } from '../../world/coastalBridges/sites.js';
import { BUILDINGS, GREEN, RIVER } from './data/city.js';
import { FORECOURT_PAVED_RING, FORECOURT_WATER_BODIES, forecourtContains } from '../../world/landmarksMoskovskaya/library-forecourt-plan.js';
import { UNDERPASS_GROUND_HOLES, UNDERPASS_BUILDING_IDS, inUnderpassMouth, inUnderpassPavilion } from '../../world/landmarksMoskovskaya/library-underpass-plan.js';

export const ID = 'moskovskaya';
export const BAKE_DIR = 'baked/moskovskaya/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksMoskovsky',
  'landmarksMoskovskaya',
  'landmarksMoskovskayaPark',
  'coastalBridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = {
  landmarksMoskovsky: 'Московские триумфальные ворота',
  landmarksMoskovskaya: 'Московский проспект, площадь Стругацких и Чесма',
  landmarksMoskovskayaPark: 'Московский парк Победы и СКА Арена',
  coastalBridges: 'Мосты и переходы Московской заставы', drive: 'Машина и катера',
};
export const NAMES = { place: 'Санкт-Петербург', placeEn: 'Saint Petersburg', square: 'площадь Восстания', squareEn: 'Vosstaniya Square', station: 'Московский вокзал', stationEn: 'Moscow Railway Station', streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' } };
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = { landmarksMoskovsky: GATE_GROUPS, landmarksMoskovskaya: DISTRICT_GROUPS, landmarksMoskovskayaPark: PARK_GROUPS, coastalBridges: COASTAL_BRIDGE_GROUPS };
export function makeAreas() {
  return [
    { name: 'Московские триумфальные ворота · Moscow Triumphal Gate', c: [-1780.9, 4569.8], r: 100 },
    { name: 'Московский парк Победы · Victory Park', x0: -1720, x1: -600, z0: 6700, z1: 7480 },
    { name: 'площадь братьев Стругацких · Strugatsky Square', c: [-1740, 7890], r: 150 },
    { name: 'Чесменская церковь · Chesme Church', c: [-1139.7, 8408.5], r: 125 },
    { name: 'СКА Арена · SKA Arena', c: [-559.1, 7041.3], r: 210 },
    { name: 'Московская застава · Moskovskaya Zastava', x0: -20000, x1: 20000, z0: -20000, z1: 20000 },
  ];
}
export function makeViews({ yawToward }) {
  const HERO = { x: -1698.5, z: 7075, yaw: -88.2, pitch: 10 };
  const gate = { x: -1812, z: 4603, yaw: -43, pitch: 12 };
  const library = { x: -1760, z: 7456, yaw: yawToward(-1760, 7456, -1893.8, 7457.6), pitch: 12 };
  const spire = { x: -1716, z: 7482, yaw: yawToward(-1716, 7482, -1672.1, 7553.9), pitch: 19 };
  const strugatsky = { x: -1724, z: 7864, yaw: yawToward(-1724, 7864, -1750, 7890), pitch: 5 };
  const chesme = { x: -1202, z: 8443, yaw: yawToward(-1202, 8443, -1139.7, 8408.5), pitch: 15 };
  return { HERO, VIEWS: [
    { key: 'Digit1', label: 'Парк Победы · главный вход', ...HERO },
    { key: 'Digit2', label: 'Московские триумфальные ворота', ...gate },
    { key: 'Digit3', label: 'Российская национальная библиотека', ...library },
    { key: 'Digit4', label: 'Площадь братьев Стругацких', ...strugatsky },
    { key: 'Digit5', label: 'Чесменская церковь', ...chesme },
    { key: 'Place.victory-park', label: 'Московский парк Победы', ...HERO },
    { key: 'Place.moskovsky-gate', label: 'Московские триумфальные ворота', ...gate },
    { key: 'Place.rnb-moskovsky', label: 'Российская национальная библиотека', ...library },
    { key: 'Place.house-with-spire', label: 'Дом со шпилем', ...spire },
    { key: 'Place.strugatsky', label: 'Площадь братьев Стругацких', ...strugatsky },
    { key: 'Place.chesme', label: 'Чесменская церковь', ...chesme },
  ] };
}
export const TEST = {
  claimed: [{ id: 'w50224296', by: 'landmarksMoskovsky', group: 'moskovsky-gate' }, { id: 'r15756570', by: 'landmarksMoskovskayaPark', group: 'victory-park-memorials' }],
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Place.victory-park', 'Place.moskovsky-gate', 'Place.rnb-moskovsky', 'Place.house-with-spire', 'Place.strugatsky', 'Place.chesme'],
  mustHaveAreas: [{ x: -1683, z: 7074, has: 'victory' }], farPoint: [-3200, 6000],
};
export const WATER = {
  farCenter: [-1700, 6100], farRadius: 6500, farSources: [], bridgeZones: COASTAL_BRIDGE_ZONES,
  riverKeys: Object.fromEntries(RIVER.map(r => [r.name, r.key || 'neva'])),
  isolatedKeys: { moat: 'Mapped inland garden ponds of Moskovskaya Zastava and Victory Park; separate basins have no navigable river outlet.' },
  // The photographs show mown grass to the ponds, with no canal embankment.
  // A low banquette and a gentle slope stay open to walkers, cars and boats.
  slopeReaches: [{ id: 'victory-park-natural-banks', key: 'moat', test: (x, z) => z > 6500 && z < 7600 && x > -1800, run: 2, kerb: .1, lip: .04, rail: () => null }],
};
export const ZONES = { peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } }, peopleHot: [[-1683, 7074, 1.1, 40], [-1740, 7890, .7, 40]], crowHaunts: [{ x: -1350, z: 7150, r: 170 }], farCentres: [{ x: -1800, z: 6100, bias: 700 }] };
export const GARAGE = { poses: { lada: { x: -1698, z: 7096, yaw: 0 } }, spawn: { x: -1698, z: 7096, yaw: 0 }, boats: [{ id: 'boat-victory-admiralty', dock: 'victory-admiralty-pond', x: -1180, z: 7333, yaw: 0 }] };
export const PRUNE_SERVICES = ['city', 'landmarksMoskovsky', 'landmarksMoskovskaya', 'landmarksMoskovskayaPark'];
const STRUGATSKY_GARDENS = GREEN.filter(g => ['w29171389', 'w29171421', 'w29382034', 'w31264819'].includes(g.id));
const ringHas = (x, z, p) => { let on = false; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) if ((p[i + 1] > z) !== (p[j + 1] > z) && x < (p[j] - p[i]) * (z - p[i + 1]) / (p[j + 1] - p[i + 1]) + p[i]) on = !on; return on; };
// These low mapped shells include authored halls and open, paved lightwells.
// The generic building height test cannot protect either from generated trees.
const LIBRARY_FOOTPRINTS = BUILDINGS.filter(b=>['r1806688','r3466512'].includes(b.id)).flatMap(b=>b.polys);
const inLibrary = (x,z) => LIBRARY_FOOTPRINTS.some(p=>ringHas(x,z,p.o));
const districtTreeReject = (x, z) => inLibrary(x,z) || forecourtContains(x,z) || inUnderpassPavilion(x,z,1) || inUnderpassMouth(x,z,1) || inFormalTreeClearing(x, z) || STRUGATSKY_GARDENS.some(g => g.polys.some(p => ringHas(x, z, p.o) && !(p.h || []).some(h => ringHas(x, z, h))));
export const HOOKS = {
  // The mapped car park overlaps the newly open pilotis. Keep its central
  // passage free of generated parked cars and bay paint; driving remains open.
  parkingReject: (x,z)=>x>-1300&&x< -1164&&z>7663&&z<7691,
  deckServices: ['coastalBridges'], treeReject: () => {
    const pilotis=BUILDINGS.find(b=>b.id==='w31192359').polys;
    return (x,z)=>districtTreeReject(x,z)||pilotis.some(p=>ringHas(x,z,p.o));
  },
  tuftReject: () => (x,z) => inLibrary(x,z) || forecourtContains(x,z) || inUnderpassMouth(x,z,.5),
  propReject: () => (x,z) => inLibrary(x,z) || forecourtContains(x,z) || inUnderpassPavilion(x,z,.5) || inUnderpassMouth(x,z,.5),
  groundHoles: () => [FORECOURT_PAVED_RING],
  groundWayReject: r => !r.tunnel && !['primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','residential','service','unclassified','living_street'].includes(r.hw) && r.pts?.every(p=>forecourtContains(p[0],p[1])),
  waterBodies: () => [...FOUNTAIN_WATER_BODIES, ...FORECOURT_WATER_BODIES],
};
export const GROUND_HOLES = UNDERPASS_GROUND_HOLES;
export const OPEN_GROUND_BUILDING_IDS = [...UNDERPASS_BUILDING_IDS,'w31192359'];
export const PAVED_RINGS = [{ module: 'landmarksMoskovskayaPark', rings: PARK_PAVED.map(w => w.ring || w) }, { module:'landmarksMoskovskaya', rings:[FORECOURT_PAVED_RING] }];
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
