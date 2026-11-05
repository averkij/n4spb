// Map 100: Primorsky coast, Park 300th Anniversary and the north-west blocks.
import { GROUPS_LIST, FOUNTAIN_WATER_BODIES, PAVED_RINGS as PARK_PAVED } from '../../world/landmarksOkrug65/groups.js';
import { GROUPS_LIST as LAKHTA_GROUPS } from '../../world/landmarksLakhta/groups.js';
import { GROUPS_LIST as FLAG_GROUPS } from '../../world/landmarksThreeFlags/sites.js';
import { WATERFRONT_GROUPS_LIST, WATERFRONT_PAVED_RINGS, WATERFRONT_BANK_RINGS } from '../../world/landmarksOkrug65/waterfront-plan.js';
import { BEACH_GROUND_HOLES, BEACH_BANK_RINGS, BEACH_HEIGHT_PATCHES } from '../../world/landmarksOkrug65/beach-plan.js';
import { WATERFRONT_OWNER_WATER_RINGS } from '../../world/landmarksOkrug65/waterfront-channels.js';
import { RIVER } from './data/city.js';
import { treeReject, tuftReject } from '../../world/landmarksOkrug65/park-hooks.js';
import { COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES, YACHTNY_GROUP, YACHTNY_BRIDGE_ZONES } from '../../world/coastalBridges/sites.js';
import { scopeGroups } from '../petro/groups.js';
export const ID = 'okrug65';
export const BAKE_DIR = 'baked/okrug65/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksLakhta',
  'landmarksOkrug65',
  'landmarksThreeFlags',
  'bridges',
  'bridgesPetro',
  'coastalBridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { landmarksLakhta: 'Лахта Центр', landmarksThreeFlags: 'Три флагштока', landmarksOkrug65: 'Парк 300-летия Санкт-Петербурга, Питерлэнд', bridgesPetro: 'Яхтенный мост', coastalBridges: 'Мосты Приморского берега', drive: 'катер и машина на старте' };
export const NAMES = { place: 'Санкт-Петербург', placeEn: 'Saint Petersburg', square: 'площадь Восстания', squareEn: 'Vosstaniya Square', station: 'Московский вокзал', stationEn: 'Moscow Railway Station', streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' } };
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = { landmarksLakhta: LAKHTA_GROUPS, landmarksThreeFlags: FLAG_GROUPS, landmarksOkrug65: [...GROUPS_LIST, ...WATERFRONT_GROUPS_LIST], bridges: scopeGroups([YACHTNY_GROUP]), coastalBridges: COASTAL_BRIDGE_GROUPS };
export function makeAreas() { return [{ name: 'Лахта Центр · Lakhta Center', c: [-9683.1, -6084.1], r: 350 }, { name: 'Три флагштока · Three waterfront flagpoles', c: [-8849.3, -5388.9], r: 80 }, { name: 'Парк 300-летия Санкт-Петербурга · Park 300th Anniversary', c: [-8370, -5465], r: 300 }, { name: 'Питерлэнд · Piterland', c: [-7870, -5390], r: 160 }, { name: 'Округ № 65 · Okrug 65', x0: -20000, x1: 20000, z0: -20000, z1: 20000 }]; }
export function makeViews({ yawToward }) {
  const HERO = { x: -8380, z: -5510, yaw: yawToward(-8380, -5510, -8415.3, -5470.7), pitch: 5 };
  const lakhta = { x: -8930, z: -5850, yaw: yawToward(-8930, -5850, -9683.1, -6084.1), pitch: 17.4 };
  const flags = { x: -8840, z: -5580, yaw: yawToward(-8840, -5580, -8849.3, -5388.9), pitch: 24 };
  return { HERO, VIEWS: [
    { key: 'Digit1', label: 'Парк 300-летия', ...HERO },
    { key: 'Digit2', label: 'Питерлэнд', x: -7955, z: -5292, yaw: yawToward(-7955, -5292, -7870.5, -5389.2), pitch: 12 },
    { key: 'Digit3', label: 'Лахта Центр', ...lakhta },
    { key: 'Digit4', label: 'Три флагштока', ...flags },
    { key: 'Place.park300', label: 'Парк 300-летия', ...HERO },
    { key: 'Place.lakhta', label: 'Лахта Центр', ...lakhta },
    { key: 'Place.threeFlags', label: 'Три флагштока', ...flags },
  ] };
}
export const TEST = {
  claimed: [{ id: 'w55498111', by: 'landmarksOkrug65', group: 'okrug65-piterland' }],
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Place.park300', 'Place.lakhta', 'Place.threeFlags'], mustHaveAreas: [], farPoint: [-7000, -8000],
  // BUILDINGS stay whole by centroid (AREAS-DATA §3). The 14-vertex OSM ring
  // of west administrative wing w674245127 is byte-equivalent to the raw
  // 2026-10-31 survey. Its centroid (-10118.6,-6090.8) is in the extent, but
  // corner (-10222.6,-6007.6) reaches 22.6 m west of x=-10200. This existing
  // group-audit allowance preserves the complete real building; it changes
  // neither PLAY_RECTS nor EXTENT_RECTS, source geometry or water predicates.
  extentSlack: { 'okrug65-lakhta': 22.7 },
};
export const WATER = { farCenter: [-8100, -5300], farRadius: 6500, farSources: [], ownerRings: WATERFRONT_OWNER_WATER_RINGS, bankRings: [...WATERFRONT_BANK_RINGS, ...BEACH_BANK_RINGS], bridgeZones: [...COASTAL_BRIDGE_ZONES, ...YACHTNY_BRIDGE_ZONES],
  // Yelagin ponds share the Islands mapping; Lower Buffer Pond retains its
  // independent shallow basin. Source style aliases do not set water levels.
  keyById: Object.fromEntries(['r1567031', 'r1567613', 'r9176724', 'r9176723', 'r18509887', 'r8613894'].map(id => [id, 'neva'])),
  isolatedKeys: { moat: true },
  isolatedLevels: { moat: { water: -1.2, bed: -2.4 } },
  riverKeys: Object.fromEntries(RIVER.map(r => [r.name, r.key || 'neva'])) };
export const ZONES = { peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } }, peopleHot: [[-8370, -5465, 1, 40]], crowHaunts: [], farCentres: [{ x: -7000, z: -6500, bias: 500 }] };
export const GARAGE = { poses: { lada: { x: -7991, z: -5488, yaw: -.25 } }, spawn: { x: -7991, z: -5488, yaw: -.25 }, boats: [{ id: 'boat-okrug65', dock: 'park300-beach', x: -8500, z: -5100, yaw: Math.PI / 2 }] };
export const PRUNE_SERVICES = ['city', 'landmarksLakhta', 'landmarksThreeFlags', 'landmarksOkrug65'];
export const HOOKS = { deckServices: ['waterfrontOkrug65', 'coastalBridges'], waterBodies: () => FOUNTAIN_WATER_BODIES, groundHoles: () => BEACH_GROUND_HOLES, treeReject: () => treeReject, tuftReject: () => tuftReject };
export const PAVED_RINGS = [{ module: 'landmarksOkrug65', rings: [...PARK_PAVED, ...WATERFRONT_PAVED_RINGS] }];
export const HEIGHT_PATCHES = BEACH_HEIGHT_PATCHES;
export const CROSS_PLACES = [];
