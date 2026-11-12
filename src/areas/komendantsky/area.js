// Komendantsky Aerodrom–Ozero Dolgoye, planning-map area 89.
// Current mapped streets/buildings/park and isolated Dolgoye Lake.
import { RIVER, ROADS } from './data/city.js';

export const ID = 'komendantsky';
export const BAKE_DIR = 'baked/komendantsky/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment', 'streets', 'city', 'landmarksKomendantsky',
  'props', 'traffic', 'people', 'wildlife', 'drive',
];
export const LABELS = { landmarksKomendantsky: 'Парк «Озеро Долгое» и память первых авиаторов', drive: 'Машина у парка' };
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'Комендантская площадь', squareEn: 'Komendantskaya Square',
  station: 'Комендантский проспект', stationEn: 'Komendantsky Prospekt',
  streets: {
    nevsky: 'проспект Испытателей', fontanka: 'Ольховая улица',
    moika: 'Комендантский проспект', griboedov: 'Богатырский проспект',
  },
};
export const SQUARE = { x: -5190, z: -8540, name: NAMES.square, nameEn: NAMES.squareEn };
// Compatibility defaults for station-specific strip services; the Moscow
// railway station is outside this territory and is never built here.
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = {};
export function makeAreas() { return [
  { name: 'Парк «Озеро Долгое» · Ozero Dolgoye Park', c: [-4869, -9345], r: 340 },
  { name: 'Первым лётчикам России · First Russian aviators', c: [-5190.9, -9366], r: 65 },
  { name: 'метро Комендантский проспект · Komendantsky Prospekt', c: [-5300, -8679], r: 120 },
  { name: 'метро Пионерская · Pionerskaya', c: [-3071, -8009], r: 105 },
  { name: 'Комендантский аэродром–Озеро Долгое · Komendantsky Aerodrom–Ozero Dolgoye', x0: -20000, x1: 20000, z0: -20000, z1: 20000 },
]; }
export function makeViews({ yawToward }) {
  // South shore of the mapped lake: the open water is just ahead and the
  // eastern basin runs through the frame. The former park-centre
  // pose looked across Olkhovaya street and screened the lake with trees.
  const HERO = { x: -4735, z: -9440, yaw: yawToward(-4735, -9440, -4670, -9380), pitch: 4 };
  const memorial = { x: -5218, z: -9377, yaw: yawToward(-5218, -9377, -5190.9, -9366), pitch: 14 };
  const metro = { x: -5215, z: -8500, yaw: yawToward(-5215, -8500, -5188, -8447), pitch: 8 };
  const pionerskaya = { x: -3100, z: -7820, yaw: yawToward(-3100, -7820, -3062, -7786), pitch: 8 };
  return { HERO, VIEWS: [
    { key: 'Digit1', label: 'Парк «Озеро Долгое»', ...HERO },
    { key: 'Digit2', label: 'Памятник первым лётчикам России', ...memorial },
    { key: 'Digit3', label: 'Комендантский проспект', ...metro },
    { key: 'Digit4', label: 'Пионерская', ...pionerskaya },
    { key: 'Place.lake-dolgoye', label: 'Озеро Долгое', ...HERO },
    { key: 'Place.first-aviators', label: 'Первым лётчикам России', ...memorial },
  ] };
}
export const TEST = {
  claimed: [], viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Place.lake-dolgoye', 'Place.first-aviators'],
  mustHaveAreas: [{ x: -4869, z: -9345, has: 'Долгое' }], farPoint: [-6500, -10000],
};
// These three mapped bridge roads cross the Chernaia Rechka water mask. The
// area has no authored overpass module; their road-height walk floors keep the
// carriageways drivable without blocking the river below or inventing rails.
const BRIDGE_FLOORS = ['w162934079', 'w162934081', 'w376696971'].flatMap(id => {
  const r = ROADS.find(road => road.id === id);
  if (!r) throw new Error(`Missing mapped northern bridge ${id}`);
  const p = r.pts, zones = [];
  for (let i = 0; i + 3 < p.length; i += 2) {
    const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1];
    zones.push({ id: `komendantsky-${id}-${i / 2}`, name: r.name || 'Mapped overpass ramp', floor: true,
      c: [(p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2],
      axis: Math.atan2(dx, -dz) * 180 / Math.PI,
      len: Math.hypot(dx, dz) + 8, w: (r.w || 6) + 6 });
  }
  return zones;
});
export const WATER = {
  farCenter: [-4800, -8000], farRadius: 7000, farSources: [],
  bridgeZones: BRIDGE_FLOORS,
  // Natural lake, without a waterway opening to the Neva: retain its own
  // shallow surface/bed and allow walking, driving and swimming into it.
  keyById: { r6597846: 'moat' },
  isolatedKeys: { moat: 'Standalone Dolgoye Lake and other isolated ponds.' },
  isolatedLevels: { moat: { water: -1.2, bed: -2.4 } },
  riverKeys: Object.fromEntries(RIVER.filter(r => r.name && r.kind !== 'pond').map(r => [r.name, r.key || 'neva'])),
};
export const ZONES = {
  peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } },
  peopleHot: [[-5190, -9366, .85, 30], [-5300, -8679, .75, 30], [-3071, -8009, .7, 25]],
  crowHaunts: [], farCentres: [{ x: -4900, z: -8600, bias: 500 }],
};
export const GARAGE = {
  poses: { lada: { x: -5323.9, z: -8723.5, yaw: Math.PI / 6 } },
  spawn: { x: -5323.9, z: -8723.5, yaw: Math.PI / 6 }, boats: [],
};
export const PRUNE_SERVICES = ['city', 'landmarksKomendantsky'];
export const HOOKS = {};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
