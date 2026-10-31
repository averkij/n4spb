// Map 100: Primorsky coast, Park 300th Anniversary and the north-west blocks.
import { GROUPS_LIST, FOUNTAIN_WATER_BODIES, PAVED_RINGS as PARK_PAVED } from '../../world/landmarksOkrug65/groups.js';
import { RIVER } from './data/city.js';
import { treeReject, inBeach } from '../../world/landmarksOkrug65/park-hooks.js';
import { COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES, YACHTNY_GROUP, YACHTNY_BRIDGE_ZONES } from '../../world/coastalBridges/sites.js';
import { scopeGroups } from '../petro/groups.js';
export const ID = 'okrug65';
export const BAKE_DIR = 'baked/okrug65/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksOkrug65',
  'bridges',
  'bridgesPetro',
  'coastalBridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { landmarksOkrug65: 'Парк 300-летия Санкт-Петербурга, Питерлэнд', bridgesPetro: 'Яхтенный мост', coastalBridges: 'Мосты Приморского берега', drive: 'катер и машина на старте' };
export const NAMES = { place: 'Санкт-Петербург', placeEn: 'Saint Petersburg', square: 'площадь Восстания', squareEn: 'Vosstaniya Square', station: 'Московский вокзал', stationEn: 'Moscow Railway Station', streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' } };
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = { landmarksOkrug65: GROUPS_LIST, bridges: scopeGroups([YACHTNY_GROUP]), coastalBridges: COASTAL_BRIDGE_GROUPS };
export function makeAreas() { return [{ name: 'Парк 300-летия Санкт-Петербурга · Park 300th Anniversary', c: [-8370, -5465], r: 300 }, { name: 'Питерлэнд · Piterland', c: [-7870, -5390], r: 160 }, { name: 'Округ № 65 · Okrug 65', x0: -20000, x1: 20000, z0: -20000, z1: 20000 }]; }
export function makeViews({ yawToward }) { const HERO = { x: -8380, z: -5510, yaw: yawToward(-8380, -5510, -8415.3, -5470.7), pitch: 5 }; return { HERO, VIEWS: [{ key: 'Digit1', label: 'Парк 300-летия', ...HERO }, { key: 'Digit2', label: 'Питерлэнд', x: -7955, z: -5292, yaw: yawToward(-7955, -5292, -7870.5, -5389.2), pitch: 12 }, { key: 'Place.park300', label: 'Парк 300-летия', ...HERO }] }; }
export const TEST = { claimed: [{ id: 'w55498111', by: 'landmarksOkrug65', group: 'okrug65-piterland' }], viewKeys: ['Digit1', 'Digit2', 'Place.park300'], mustHaveAreas: [], farPoint: [-7000, -8000] };
export const WATER = { farCenter: [-8100, -5300], farRadius: 6500, farSources: [], bridgeZones: [...COASTAL_BRIDGE_ZONES, ...YACHTNY_BRIDGE_ZONES],
  riverKeys: Object.fromEntries(RIVER.map(r => [r.name, r.key || 'neva'])) };
export const ZONES = { peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } }, peopleHot: [[-8370, -5465, 1, 40]], crowHaunts: [], farCentres: [{ x: -7000, z: -6500, bias: 500 }] };
export const GARAGE = { poses: { lada: { x: -7991, z: -5488, yaw: -.25 } }, spawn: { x: -7991, z: -5488, yaw: -.25 }, boats: [{ id: 'boat-okrug65', dock: 'park300-beach', x: -8500, z: -5100, yaw: Math.PI / 2 }] };
export const PRUNE_SERVICES = ['city', 'landmarksOkrug65'];
export const HOOKS = { deckServices: ['coastalBridges'], waterBodies: () => FOUNTAIN_WATER_BODIES, treeReject: () => treeReject, tuftReject: () => inBeach };
export const PAVED_RINGS = PARK_PAVED;
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
