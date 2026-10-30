// Semyonovsky–Izmailovsky: pure area tables. The central station rule refers
// to Moscow Station, so this area has one purple Zhiguli despite Vitebsky.
import { GROUPS_SW, GROUPS_SOUTH } from '../../world/bridges/groups-sw.js';
import { SOUTH_GROUPS } from '../../world/bridges/sites-south.js';
import { GROUPS_LIST as CENTRAL_SOUTH } from '../../world/landmarksCentralSouth/groups.js';
import { GROUPS_LIST as MOSKOVSKY } from '../../world/landmarksMoskovsky/groups.js';
import { GROUPS_LIST as BALTIC } from '../../world/landmarksBaltic/groups.js';
import { makeHooks, makeHeightPatches } from '../north/hooks.js';

export const ID = 'semyonovsky';
export const BAKE_DIR = 'baked/semyonovsky/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'streetsLocalRepairs',
  'city',
  'landmarksCentralSouth',
  'landmarksMoskovsky',
  'landmarksBaltic',
  'bridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = {
  landmarksCentralSouth: 'Троицкий собор, Технологический институт и Витебский вокзал',
  landmarksMoskovsky: 'Московские триумфальные ворота',
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
const bridgeKeys = new Set(['kokushkin', 'krasnogvardeysky', 'obukhovsky', 'izmailovsky', 'south-r5586238', 'south-r5595205', 'south-r5599488', 'south-r3319947', 'south-r5727608', 'south-r5489278']);
export const GROUPS = {
  landmarksCentralSouth: CENTRAL_SOUTH,
  landmarksMoskovsky: MOSKOVSKY,
  landmarksBaltic: BALTIC,
  bridges: [...GROUPS_SW, ...GROUPS_SOUTH].filter((g) => bridgeKeys.has(g.key)).concat(
    SOUTH_GROUPS.filter((g) => !GROUPS_SW.some((b) => b.name === g.name) && !GROUPS_SOUTH.some((b) => b.key === g.key))),
};
export function makeAreas() {
  return [
    { name: 'Троицкий собор · Trinity Cathedral', c: [-2540, 1777], r: 100 },
    { name: 'Витебский вокзал · Vitebsky Station', c: [-1240, 1420], r: 100 },
    { name: 'Технологический институт · Technological Institute', c: [-1840, 1565], r: 100 },
    { name: 'Московские триумфальные ворота · Moscow Triumphal Gate', c: [-1780.9, 4569.8], r: 100 },
    { name: 'Балтийский вокзал · Baltic Railway Station', c: [-2933.6, 2793], r: 100 },
    { name: 'Семёновский–Измайловский · Semyonovsky–Izmailovsky', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}
export function makeViews({ yawToward }) {
  const HERO = { x: -2557.5, z: 1807.3, yaw: yawToward(-2557.5, 1807.3, -2540, 1777), pitch: 8 };
  return { HERO, VIEWS: [{ key: 'Digit1', label: 'Троицкий собор', ...HERO }, { key: 'Place.trinity', label: 'Троицкий собор', ...HERO }] };
}
export const TEST = {
  claimed: [
    { id: 'r16834195', by: 'landmarksCentralSouth', group: 'central-trinity' },
    { id: 'w50224296', by: 'landmarksMoskovsky', group: 'moskovsky-gate' },
    { id: 'r3225591', by: 'landmarksBaltic', group: 'baltic-entrance' },
  ],
  viewKeys: ['Digit1', 'Place.trinity'], mustHaveAreas: [],
};
export const WATER = {
  bridgeZones: [
    { id: 'kokushkin', key: 'griboedov', c: [-2105.3, 735.8], axis: 152.5, w: 13.1, len: 22, own: true },
    { id: 'krasnogvardeysky', key: 'griboedov', c: [-2910.7, 1262.6], axis: 155.1, w: 8.5, len: 22.5, own: true },
    { id: 'obukhovsky', key: 'fontanka', c: [-1872.8, 1202.1], axis: 178.1, w: 30.9, len: 54, own: true },
    { id: 'izmailovsky', key: 'fontanka', c: [-2428.7, 1456.4], axis: 2.1, w: 15.9, len: 70.5, own: true },
    { id: 'smezhny', floor: true, c: [-2807.4, 1585.7], axis: 64.8, w: 14.5, len: 24 },
  ],
  farCenter: [-1600, 2900], farRadius: 6000,
  keyByName: { 'Крюков канал': 'kryukov' },
  riverKeys: { 'Обводный канал': 'neva', 'Пряжка': 'neva', 'Волковка': 'neva' },
  dataWater: [{ id: 'r11787679', key: 'neva' }],
};
export const ZONES = {
  peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } },
  peopleHot: [[-2540, 1777, 1.2, 30], [-1240, 1420, 1.5, 30], [-1781, 4570, 1, 30]],
  crowHaunts: [{ x: -2540, z: 1777, r: 120 }],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],
};
const DEG = Math.PI / 180;
export const GARAGE = { poses: { lada: { x: -2540.2, z: 1817.3, yaw: 0 * DEG } }, spawn: { x: -2540.2, z: 1817.3, yaw: 0 * DEG },
  boats: [{ id: 'boat-semyonovsky', dock: 'semyonovsky', x: -1378.3, z: 800.5, yaw: 2.224 }] };
export const PRUNE_SERVICES = ['city', 'landmarksCentralSouth'];
export const HOOKS = makeHooks(MODULES);
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);
export const CROSS_PLACES = [];
