// Map 71: newly mapped port territory, B600 open-water band. No source port
// geometry is restored over the newer water, knock or vehicle contracts.
import { GROUPS_LIST } from '../../world/landmarksSeaGates/groups.js';
import { GROUPS_LIST as PORT_CHURCH } from '../../world/landmarksPortChurch/groups.js';
import { RIVER, ROADS } from './data/city.js';
import { COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES } from '../../world/coastalBridges/sites.js';
export const ID = 'morskie-vorota';
export const BAKE_DIR = 'baked/morskie-vorota/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksSeaGates',
  'landmarksPortChurch',
  'coastalBridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { landmarksSeaGates: 'Канонерский остров, морской порт', landmarksPortChurch: 'Богоявленская церковь на Гутуевском острове', coastalBridges: 'Портовые мосты и эстакады', drive: 'катера, контейнеровоз и машина на старте' };
export const NAMES = { place: 'Санкт-Петербург', placeEn: 'Saint Petersburg', square: 'площадь Восстания', squareEn: 'Vosstaniya Square', station: 'Московский вокзал', stationEn: 'Moscow Railway Station', streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' } };
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = { landmarksSeaGates: GROUPS_LIST, landmarksPortChurch: PORT_CHURCH, coastalBridges: COASTAL_BRIDGE_GROUPS };
export function makeAreas() { return [{ name: 'Богоявленская церковь · Epiphany Church', c: [-5259.55, 2633.01], r: 90 }, { name: 'Канонерский остров · Kanonersky Island', c: [-7200, 2800], r: 500 }, { name: 'Морские ворота · Sea Gates', x0: -20000, x1: 20000, z0: -20000, z1: 20000 }]; }
export function makeViews({ yawToward }) { const HERO = { x: -7590, z: 2940, yaw: yawToward(-7590, 2940, -8100, 3350), pitch: 3 }, church = { x: -5320, z: 2630, yaw: -93, pitch: 12 }; return { HERO, VIEWS: [{ key: 'Digit1', label: 'Канонерский остров', ...HERO }, { key: 'Digit2', label: 'Богоявленская церковь', ...church }, { key: 'Place.kanonersky', label: 'Канонерский остров', ...HERO }, { key: 'Place.port-church', label: 'Богоявленская церковь', ...church }] }; }
export const TEST = { claimed: [{ id: 'w34863504', by: 'landmarksPortChurch', group: 'port-epiphany' }], viewKeys: ['Digit1', 'Digit2', 'Place.kanonersky', 'Place.port-church'], mustHaveAreas: [{ x: -5259.55, z: 2633.01, has: 'epiphany' }], farPoint: [-7200, 4500] };
export const WATER = { farCenter: [-7500, 3000], farRadius: 6500, farSources: [], bridgeZones: COASTAL_BRIDGE_ZONES,
  riverKeys: Object.fromEntries(RIVER.map(r => [r.name, r.key || 'neva'])) };
export const ZONES = { peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } }, peopleHot: [], crowHaunts: [], farCentres: [{ x: -6500, z: 3000, bias: 500 }] };
export const GARAGE = { poses: { lada: { x: -7589, z: 2926, yaw: Math.PI } }, spawn: { x: -7589, z: 2926, yaw: Math.PI }, boats: [{ id: 'boat-sea-gates', dock: 'sea-gates', x: -7610, z: 2980, yaw: 2.6 }, { id: 'container-ship', vessel: 'container-ship', dock: 'sea-gates-anchorage', x: -8100, z: 3350, yaw: 150 * Math.PI / 180 }] };
export const PRUNE_SERVICES = ['city', 'landmarksSeaGates'];
// The harbour garage frontage is too narrow for the metre-raster mask to
// contain the widest grass clumps. Keep its actual mapped service lane clear.
const TUFT_FRONTAGE = ROADS.filter(r => r.id === 'w537094874');
export const HOOKS = {
  deckServices: ['coastalBridges'],
  tuftReject() {
    return (x, z) => {
      for (const r of TUFT_FRONTAGE) for (let i = 0; i + 3 < r.pts.length; i += 2) {
        const ax = r.pts[i], az = r.pts[i + 1], dx = r.pts[i + 2] - ax, dz = r.pts[i + 3] - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        if ((x - ax - t * dx) ** 2 + (z - az - t * dz) ** 2 < (r.w / 2 + 2.5) ** 2) return true;
      }
      return false;
    };
  },
};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
