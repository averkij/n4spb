// Planning map 52: the Vyborg Side from Sampson Cathedral to Lanskaya.
// The mapped Bolshaya Nevka and Chyornaya Rechka remain reachable terrain.
import { RIVER, ROADS } from './data/city.js';
import { GROUPS as PETRO_BRIDGES } from '../petro/bridge-groups.js';
import { scopeGroups } from '../petro/groups.js';
import { SHADES } from '../petro/zones.js';

export const ID = 'sampson';
export const BAKE_DIR = 'baked/sampson/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksSampson',
  'bridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { landmarksSampson: 'Сампсониевский собор и Выборгская сторона', bridges: 'Сампсониевский и Гренадерский мосты', drive: 'Машина и катер' };
export const NAMES = { place: 'Санкт-Петербург', placeEn: 'Saint Petersburg', square: 'Сампсониевский сад', squareEn: 'Sampsoniyevsky Garden', station: 'Выборгская', stationEn: 'Vyborgskaya', streets: { nevsky: 'Большой Сампсониевский проспект', fontanka: 'Большая Невка', moika: 'Чёрная речка', griboedov: 'Лесной проспект' } };
export const SQUARE = { x: -450, z: -4080, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: -450, z: -4080, h: 0 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };
export const GROUPS = {
  landmarksSampson: [{ key: 'sampson-cathedral', name: 'Сампсониевский собор', nameEn: 'Sampson Cathedral', ids: [
    'r9907863', 'r9907861', 'r9907862', 'r9907864',
    'w50802817', 'w498843964', 'w498843965', 'w498843966', 'w712549226',
    'w498843967', 'w498843968', 'w498843969', 'w498843971', 'w498843972',
    'w498843974', 'w498843976', 'w498843979', 'w498843980', 'w498843983',
    'w498849769',
  ], osm: [], at: [-463, -4010] }],
  bridges: scopeGroups(PETRO_BRIDGES.filter(g => g.key === 'samps' || g.key === 'grenadersky')),
};
export function makeAreas() { return [
  { name: 'Сампсониевский собор · Sampson Cathedral', c: [-463, -4010], r: 68 },
  { name: 'Колокольня Сампсониевского собора · Sampson bell tower', c: [-509, -4001], r: 55 },
  { name: 'Сампсониевский сад · Sampson Garden', c: [-450, -4080], r: 180 },
  { name: 'Выборгская · Vyborgskaya', c: [-99, -4117], r: 125 },
  { name: 'Лесная · Lesnaya', c: [-314, -6030], r: 125 },
  { name: 'Строгановский парк · Stroganovsky Park', c: [-2506, -5670], r: 180 },
  { name: 'Головинский сад · Golovinsky Garden', c: [-1721, -5423], r: 160 },
  { name: 'Ланская · Lanskaya', c: [-1670, -6300], r: 280 },
  { name: 'Сампсониевское–Ланское · Sampsoniyevskoye–Lanskoye', x0: -20000, x1: 20000, z0: -20000, z1: 20000 },
]; }
export function makeViews({ yawToward }) {
  // The open garden path frames the whole cathedral without placing the
  // camera on the busier pedestrian route along its southern edge.
  const hero = { x: -430, z: -4080, yaw: yawToward(-430, -4080, -463, -4010), pitch: 8 };
  const tower = { x: -549, z: -3982, yaw: yawToward(-549, -3982, -509, -4001), pitch: 12 };
  const garden = { x: -430, z: -4080, yaw: yawToward(-430, -4080, -463, -4010), pitch: 8 };
  const lanskaya = { x: -1550, z: -6410, yaw: yawToward(-1550, -6410, -1660, -6290), pitch: 7 };
  const vyborg = { x: -151, z: -4162, yaw: yawToward(-151, -4162, -99, -4117), pitch: 8 };
  const lesnaya = { x: -354, z: -6049, yaw: yawToward(-354, -6049, -314, -6030), pitch: 8 };
  const stroganovsky = { x: -2540, z: -5710, yaw: yawToward(-2540, -5710, -2506, -5670), pitch: 4 };
  const golovinsky = { x: -1782, z: -5455, yaw: yawToward(-1782, -5455, -1721, -5423), pitch: 4 };
  return { HERO: hero, VIEWS: [
    { key: 'Digit1', label: 'Сампсониевский собор', ...hero },
    { key: 'Digit2', label: 'Колокольня Сампсониевского собора', ...tower },
    { key: 'Digit3', label: 'Сампсониевский сад', ...garden },
    { key: 'Digit4', label: 'Ланская', ...lanskaya },
    { key: 'Digit5', label: 'Выборгская', ...vyborg },
    { key: 'Digit6', label: 'Лесная', ...lesnaya },
    { key: 'Place.sampson-cathedral', label: 'Сампсониевский собор', ...hero },
    { key: 'Place.stroganovsky-park', label: 'Строгановский парк', ...stroganovsky },
    { key: 'Place.golovinsky-garden', label: 'Головинский сад', ...golovinsky },
  ] };
}
export const TEST = { claimed: [{ id: 'r9907863', by: 'landmarksSampson', group: 'sampson-cathedral' }], viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Place.sampson-cathedral', 'Place.stroganovsky-park', 'Place.golovinsky-garden'], mustHaveAreas: [{ x: -485, z: -4006, has: 'Собор' }], farPoint: [-1750, -7000] };
// Small OSM road bridges over ponds and canals have no authored visible deck.
// A finite walk floor under each mapped carriageway keeps both cars and people
// at road level. The detailed Sampsonievsky and Grenadersky decks own theirs.
const DRIVABLE = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);
const DETAILED_BRIDGE_WAYS = new Set(GROUPS.bridges.flatMap(g => g.osm));
const BRIDGE_FLOORS = ROADS.filter(r => r.bridge && !r.tunnel && DRIVABLE.has(r.hw) && !DETAILED_BRIDGE_WAYS.has(r.id)).flatMap(r => {
  const zones = [];
  for (let i = 0; i + 3 < r.pts.length; i += 2) {
    const [ax, az, bx, bz] = r.pts.slice(i, i + 4), dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    if (len < .5) continue;
    zones.push({ id: `sampson-floor-${r.id}-${i}`, floor: true, c: [(ax + bx) / 2, (az + bz) / 2], axis: Math.atan2(dx, -dz) * 180 / Math.PI, w: (r.w || 7) + 1, len: len + 2 });
  }
  return zones;
});
export const WATER = {
  farCenter: [-1800, -5400], farRadius: 7000,
  riverKeys: Object.fromEntries(RIVER.filter(r => r.name).map(r => [r.name, r.kind === 'pond' ? 'moat' : 'neva'])),
  // These surveyed Yelagin channels meet the connected Neva system in the
  // overlap with Okrug 65 and the Islands area; keep their shared datum.
  keyById: Object.fromEntries(['r1567031', 'r1567613', 'r9176724', 'r9176723', 'r18509887', 'r8613894'].map(id => [id, 'neva'])),
  isolatedKeys: { moat: 'Mapped isolated park ponds.' }, isolatedLevels: { moat: { water: -1.2, bed: -2.4 } },
  bridgeZones: BRIDGE_FLOORS,
  bridgeShades: SHADES.filter(z => z.id === 'sampsonievsky-deck'),
};
export const ZONES = { peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } }, peopleHot: [[-500, -4010, 1, 30], [-320, -6030, .7, 25]], crowHaunts: [], farCentres: [{ x: -1700, z: -5700, bias: 500 }] };
export const GARAGE = { poses: { lada: { x: -556, z: -4092, yaw: 0 } }, spawn: { x: -556, z: -4092, yaw: 0 }, boats: [{ id: 'boat-sampson', dock: 'sampson-nevka', x: -1040, z: -2860, yaw: -Math.PI / 2 }] };
export const PRUNE_SERVICES = ['city', 'landmarksSampson'];
export const HOOKS = { deckServices: ['bridges'] };
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
