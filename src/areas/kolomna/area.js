// Kolomna–Yekateringof: pure area tables. Data and play boundaries are area-local.
import { GROUPS_SW, GROUPS_SOUTH } from '../../world/bridges/groups-sw.js';
import { SOUTH_GROUPS } from '../../world/bridges/sites-south.js';
import { GROUPS_LIST as MARIINSKY } from '../../world/landmarksMariinsky/groups.js';
import { GROUPS_LIST as NIKOLSKY } from '../../world/landmarksNikolsky/groups.js';
import { GROUPS_LIST as NEW_HOLLAND } from '../../world/landmarksNewHolland/groups.js';
import { GROUPS_LIST as CENTRAL_SOUTH } from '../../world/landmarksCentralSouth/groups.js';
import { GROUPS_LIST as NARVA } from '../../world/landmarksNarva/groups.js';
import { GROUPS_LIST as YEKATERINGOF } from '../../world/landmarksYekateringof/groups.js';
import { GROUPS_LIST as BALTIC } from '../../world/landmarksBaltic/groups.js';
import { YEKATERINGOFKA_RINGS, PARK_POND_RINGS } from './rings.js';
import { makeHooks, makeHeightPatches } from '../north/hooks.js';

export const ID = 'kolomna';
export const BAKE_DIR = 'baked/kolomna/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksMariinsky',
  'landmarksNikolsky',
  'landmarksNewHolland',
  'landmarksCentralSouth',
  'landmarksNarva',
  'landmarksYekateringof',
  'landmarksBaltic',
  'landmarksSouthernCrossings',
  'bridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = {
  landmarksMariinsky: 'Мариинский театр и Театральная площадь',
  landmarksNikolsky: 'Никольский морской собор',
  landmarksNewHolland: 'Новая Голландия',
  landmarksCentralSouth: 'Троицкий собор',
  landmarksNarva: 'Нарвские триумфальные ворота',
  landmarksYekateringof: 'Екатерингофский парк и Молвинская колонна',
  landmarksBaltic: 'Балтийский вокзал',
  drive: 'машина на старте',
};
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' },
};
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

const bridgeKeys = new Set(['blagoveshchensky', 'lviny', 'kharlamov', 'novo-nikolsky', 'pikalov', 'krasnogvardeysky', 'mogilevsky', 'staro-nikolsky', 'kashin', 'torgovy', 'dekabristov', 'matveev', 'krasnoflotsky', 'potseluev', 'khrapovitsky', 'krushtein1', 'krushtein2', 'admiralteysky', 'izmailovsky', 'south-r5727608', 'south-r5489278']);
export const GROUPS = {
  landmarksMariinsky: MARIINSKY,
  landmarksNikolsky: NIKOLSKY,
  landmarksNewHolland: NEW_HOLLAND,
  landmarksCentralSouth: CENTRAL_SOUTH.filter((g) => g.key === 'central-trinity'),
  landmarksNarva: NARVA,
  landmarksYekateringof: YEKATERINGOF,
  landmarksBaltic: BALTIC,
  bridges: [...GROUPS_SW, ...GROUPS_SOUTH].filter((g) => bridgeKeys.has(g.key)).concat(
    SOUTH_GROUPS.filter((g) => !GROUPS_SW.some((b) => b.name === g.name) && !GROUPS_SOUTH.some((b) => b.key === g.key))),
};
export function makeAreas() {
  return [
    { name: 'Мариинский театр · Mariinsky Theatre', c: [-3058, 736], r: 100 },
    { name: 'Никольский морской собор · St Nicholas Naval Cathedral', c: [-2900, 1100], r: 110 },
    { name: 'Новая Голландия · New Holland', c: [-3440, 310], r: 160 },
    { name: 'Троицкий собор · Trinity Cathedral', c: [-2540, 1777], r: 100 },
    { name: 'Нарвские триумфальные ворота · Narva Triumphal Gate', c: [-4329.2, 3510.4], r: 100 },
    { name: 'Молвинская колонна · Molvinskaya Column', c: [-5215.8, 3531.9], r: 35 },
    { name: 'Балтийский вокзал · Baltic Railway Station', c: [-2933.6, 2793], r: 100 },
    { name: 'Екатерингофский парк · Yekateringof Park', c: [-4834.6, 3203.9], r: 250 },
    { name: 'Коломна–Екатерингофский · Kolomna–Yekateringof', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}
export function makeViews({ yawToward }) {
  const HERO = { x: -3058, z: 771, yaw: yawToward(-3058, 771, -3058, 736), pitch: 8 };
  return { HERO, VIEWS: [{ key: 'Digit1', label: 'Мариинский театр', ...HERO }, { key: 'Place.mariinsky', label: 'Мариинский театр', ...HERO }] };
}
export const TEST = {
  claimed: [
    { id: 'r1690283', by: 'landmarksMariinsky', group: 'mariinsky-theatre' },
    { id: 'r3290873', by: 'landmarksNikolsky', group: 'nikolsky-cathedral' },
    { id: 'r3164896', by: 'landmarksNewHolland', group: 'nh-warehouses' },
    { id: 'r16834195', by: 'landmarksCentralSouth', group: 'central-trinity' },
    { id: 'w73174258', by: 'landmarksNarva', group: 'narva-gate' },
    { id: 'w96846565', by: 'landmarksYekateringof', group: 'yekateringof-rotunda' },
    { id: 'r3225591', by: 'landmarksBaltic', group: 'baltic-entrance' },
  ],
  viewKeys: ['Digit1', 'Place.mariinsky'], mustHaveAreas: [],
};

// The overlaps reuse the authored quay openings from Admiralty. The bridge
// module supplies the southern Fontanka sites itself.
const BRIDGE_ZONES = [
  { id: 'lviny', key: 'griboedov', c: [-2788.7, 613.4], axis: 155.4, w: 5.2, len: 22.4, own: true },
  { id: 'kharlamov', key: 'griboedov', c: [-2698.1, 902.1], axis: 66.7, w: 22.5, len: 26, own: true },
  { id: 'novo-nikolsky', key: 'griboedov', c: [-2698.7, 1161.8], axis: 155.4, w: 22.6, len: 22.8, own: true },
  { id: 'pikalov', key: 'griboedov', c: [-2955.5, 1284.1], axis: 155.6, w: 10.6, len: 22.8, own: true },
  { id: 'krasnogvardeysky', key: 'griboedov', c: [-2910.7, 1262.6], axis: 155.1, w: 8.5, len: 22.5, own: true },
  { id: 'mogilevsky', key: 'griboedov', c: [-3237.9, 1202.7], axis: 155.3, w: 24, len: 32, own: true },
  { id: 'staro-nikolsky', key: 'kryukov', c: [-2921.2, 1314.3], axis: 66.2, w: 20.2, len: 24.3, own: true },
  { id: 'kashin', key: 'kryukov', c: [-3034.1, 1044.8], axis: 66.2, w: 16, len: 23.9, own: true, pad: 4 },
  { id: 'torgovy', key: 'kryukov', c: [-3105.7, 874], axis: 65.9, w: 10.8, len: 24, own: true },
  { id: 'dekabristov', key: 'kryukov', c: [-3162.8, 692.9], axis: 66, w: 23.3, len: 26, own: true },
  { id: 'matveev', key: 'kryukov', c: [-3213, 527.1], axis: 81.1, w: 9.8, len: 26, own: true },
  { id: 'krasnoflotsky', key: 'moika', c: [-3196.6, 498.1], axis: 158.2, w: 6, len: 29.8, own: true },
  { id: 'potseluev', key: 'moika', c: [-3146.5, 472.1], axis: 156, w: 23.5, len: 40, own: true },
  { id: 'khrapovitsky', key: 'moika', c: [-3689.6, 382.9], axis: 164.1, w: 20.5, len: 42.4, own: true },
  { id: 'krushtein1', key: 'admiralty', c: [-3394, 168], axis: 147.7, w: 9.3, len: 14.3, own: true },
  { id: 'krushtein2', key: 'admiralty', c: [-3620.7, 314.2], axis: 143.4, w: 10.7, len: 14.8, own: true },
  { id: 'admiralteysky', key: 'admiralty', c: [-3769.6, 238.1], axis: 62.4, w: 14.5, len: 12.8, own: true },
  { id: 'izmailovsky', key: 'fontanka', c: [-2428.7, 1456.4], axis: 2.1, w: 15.9, len: 70.5, own: true },
  { id: 'smezhny', floor: true, c: [-2807.4, 1585.7], axis: 64.8, w: 14.5, len: 24 },
  // Pryazhka crossings not yet represented by an authored bridge site: their
  // mapped road axes open the quay and supply an open-sided walking/car floor.
  { id: 'matisov', name: 'Матисов мост', key: 'neva', c: [-4044.1, 598.9], axis: -112.62, w: 12.2, len: 36.4, noShade: true },
  { id: 'banny', name: 'Банный мост', key: 'neva', c: [-3923.65, 1028.75], axis: 101.59, w: 12.2, len: 40.3, noShade: true },
  { id: 'bumazhny', name: 'Бумажный мост', key: 'neva', c: [-4993.45, 2935.35], axis: 20.5, w: 20, len: 25, noShade: true },
  { id: 'molvinsky', name: 'Молвинский мост', key: 'neva', c: [-5256.1, 3562.7], axis: 31.7, w: 20, len: 26, noShade: true },
  { id: 'yekateringofsky', name: 'Екатерингофский мост', key: 'neva', c: [-4995.3, 2188.95], axis: 85.8, w: 19, len: 66.6, noShade: true },
  { id: 'gutuevsky', name: 'Гутуевский мост', key: 'neva', c: [-5133.4, 2604.5], axis: 95.5, w: 20, len: 96, noShade: true },
];
// This park canal joins the river and must share its water level. Its banks
// are still landscaped, so identify its shoreline for a grass slope below.
const parkCanal = PARK_POND_RINGS.find((r) => r.id === 'w229047990-1').ring;
function nearParkCanal(x, z) {
  for (let i = 0; i < parkCanal.length; i += 2) {
    const j = (i + 2) % parkCanal.length, ax = parkCanal[i], az = parkCanal[i + 1], dx = parkCanal[j] - ax, dz = parkCanal[j + 1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    if (Math.hypot(x - ax - t * dx, z - az - t * dz) < 1) return true;
  }
  return false;
}
export const WATER = {
  bridgeZones: BRIDGE_ZONES,
  farSources: ['neva-down', 'neva-malaya'], farCenter: [-4200, 1700], farRadius: 6000,
  // The mole's irregular bumps make its bounding rectangle 40 m wide. Use
  // the same measured centreline and 9.6 m width as the neighbouring area.
  pierFit: {
    'w74745049#0': { cx: -4353.4, cz: 177.9, ax: -0.602, az: 0.798, len: 256, wid: 9.6 },
    // The curved mapped floating pier is a narrow L, not a 34 x 20 m block.
    // Fit its long arm rather than filling the water between its two arms.
    'w958679162#0': { cx: -5595.85, cz: 3466.95, ax: -0.613, az: 0.790, len: 26, wid: 5 },
  },
  // A generated granite descent at this channel mouth projected across the
  // fairway and enclosed the mapped floating pier. Keep the channel open.
  keepOut: [{ id: 'yekateringofka-channel', c: [-5575.86, 3477.88], r: 6 }],
  keyByName: { 'Крюков канал': 'kryukov', 'Адмиралтейский канал': 'admiralty', 'Ново-Адмиралтейский канал': 'admiralty', 'Восточный канал': 'nh-inner', 'Южный канал': 'nh-inner' },
  riverKeys: { 'Обводный канал': 'neva', 'Пряжка': 'neva', 'Екатерингофка': 'neva' },
  // The source data has unnamed water polygons for the Bumazhny Canal,
  // Tarakanovka and Olkhovka; their centre lines intersect these OSM relations.
  dataWater: [{ id: 'r1648982', key: 'nh-inner' }, { id: 'r3082004', key: 'neva' }, { id: 'r3298255', key: 'neva' }],
  dataRings: [...YEKATERINGOFKA_RINGS, ...PARK_POND_RINGS],
  // The isolated ponds have a shallow datum; the connected canal shares the
  // river datum. Both have open grass banks, accessible on foot and by car.
  slopeReaches: [
    { id: 'yekateringof-ponds', key: 'moat', run: 6, kerb: 0.1, lip: 0.1, test: () => true, rail: () => null },
    { id: 'yekateringof-canal', key: 'neva', run: 9, kerb: 0.1, lip: 0.1, test: nearParkCanal, rail: () => null },
  ],
  // The park canal meets the river on a shared OSM edge: leave its mouth open
  // so neither a quay wall nor a breakable fence crosses the water.
  openMouths: [
    [-2946.2, 1291.7, -2922.6, 1282.3],
    [-5277.5, 3074.6, -5282.8, 3085.6],
    // Two mapped water-to-water joins whose polygon edges do not coincide:
    // the Matisov Island channel and New Holland's Arch onto the Moika.
    [-4502.3, 1223, -4510.35, 1245.1],
    [-3402.45, 463.57, -3386.48, 469.45],
  ],
};
export const ZONES = {
  peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } },
  peopleHot: [[-3056, 740, 2.2, 22], [-2896, 1120, 1.8, 16], [-3440, 275, 1.6, 40]],
  crowHaunts: [{ x: -3440, z: 275, r: 100 }],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],
};
const DEG = Math.PI / 180;
export const GARAGE = { poses: { lada: { x: -3061.5, z: 790.7, yaw: 225 * DEG } }, spawn: { x: -3061.5, z: 790.7, yaw: 225 * DEG },
  boats: [{ id: 'boat-kolomna', dock: 'kolomna', x: -4572.4, z: 1875.1, yaw: 1.239 }] };
export const PRUNE_SERVICES = ['city', 'landmarksMariinsky', 'landmarksNikolsky', 'landmarksNewHolland'];
export const HOOKS = makeHooks(MODULES);
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);
export const CROSS_PLACES = [];
