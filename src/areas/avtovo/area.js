// Автово, planning-map area 70. Mapped 2026-11-12 OSM geometry extends from the
// Kirov industrial quarter and Stachek avenue to the harbours and Neva Bay.
import { RIVER, WATER as DATA_WATER } from './data/city.js';
import { COASTAL_BRIDGES, COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES } from '../../world/coastalBridges/sites.js';
// Clipped OSM bridge ways can have several deck segments with one original ID.
// The builder keeps every segment; the ownership table needs one claim per way.
const BRIDGE_GROUPS = [...new Map(COASTAL_BRIDGE_GROUPS.map(g => [g.key, g])).values()];
const inRing = (x, z, o) => {
  let inside = false;
  for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2)
    if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) inside = !inside;
  return inside;
};
const PONDS = DATA_WATER.filter(w => ['pond', 'lake'].includes(w.kind)).flatMap(w => w.polys);
const inPond = (x, z) => PONDS.some(p => inRing(x, z, p.o) && !(p.h || []).some(h => inRing(x, z, h)));
const BRIDGE_ZONE_KEYS = new Set(COASTAL_BRIDGES.filter(b => {
  for (let i = 0; i + 3 < b.pts.length; i += 2)
    if (inPond((b.pts[i] + b.pts[i + 2]) / 2, (b.pts[i + 1] + b.pts[i + 3]) / 2)) return true;
  return false;
}).map(b => b.id));
// The long pond's mapped bridge segments are oblique. Some segment midpoints
// miss its slim polygon even as the deck and its approaches cross the water.
for (const id of ['w46219801', 'w46219802', 'w173811664', 'w1483891096']) BRIDGE_ZONE_KEYS.add('coast-' + id);
// The shared bridge service sees RIVER polygons; Avtovo's isolated ponds are
// mapped in WATER instead. Their crossings must open the pond banks too.
const BRIDGE_ZONES = COASTAL_BRIDGE_ZONES.map(z => BRIDGE_ZONE_KEYS.has(z.id) ? { ...z, key: 'moat' } : z);

export const ID = 'avtovo';
export const BAKE_DIR = 'baked/avtovo/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment', 'streets', 'city', 'landmarksAvtovoMetro',
  'landmarksAvtovoSites', 'coastalBridges', 'props', 'traffic',
  'people', 'wildlife', 'drive',
];
export const LABELS = {
  environment: 'Рельеф, вода и растительность Автово',
  streets: 'Улицы и проезды Автово',
  city: 'Дома и промышленные здания Автово',
  landmarksAvtovoMetro: 'Наземные павильоны метро «Автово» и «Кировский завод»',
  landmarksAvtovoSites: 'Кировский завод и памятники Автово',
  coastalBridges: 'Мосты, путепроводы и эстакады Автово',
  props: 'Фонари и уличные предметы Автово',
  traffic: 'Движение транспорта Автово',
  people: 'Пешеходы Автово',
  wildlife: 'Птицы Автово',
  drive: 'Машина и катер Автово',
};
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'Автово', squareEn: 'Avtovo',
  station: 'станция метро «Автово»', stationEn: 'Avtovo metro station',
  streets: {
    nevsky: 'проспект Стачек',
    fontanka: 'улица Зайцева',
    moika: 'Кронштадтская улица',
    griboedov: 'Петергофское шоссе',
  },
};
export const SQUARE = { x: -5027.2, z: 7254.5, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: -5102.3, z: 5883.7, h: 8 };
export const STATION = { x: -5027.2, z: 7254.5, facadeBearing: 280, trackBearing: 0, tower: { x: -5027.2, z: 7254.5 } };

export const GROUPS = {
  landmarksAvtovoMetro: [
    { key: 'avtovo-metro-avtovo', name: 'Станция метро «Автово»', ids: ['r6440025'], osm: [], at: [-5027.2, 7254.5] },
    { key: 'avtovo-metro-kirovsky', name: 'Станция метро «Кировский завод»', ids: ['w47636754'], osm: [], at: [-4993.1, 5875.7] },
  ],
  landmarksAvtovoSites: [
    { key: 'avtovo-factory-gate', name: 'Главная проходная Кировского завода', ids: ['w128500581'], osm: [], at: [-5215.5, 5889.5] },
    { key: 'avtovo-pillbox', name: 'ДОТ № 930 Кировского вала', ids: ['w119225860'], osm: [], at: [-5130.5, 7953.9] },
  ],
  coastalBridges: BRIDGE_GROUPS,
};
export function makeAreas() {
  return [
    { name: 'Станция метро «Автово» · Avtovo metro station', c: [-5027.2, 7254.5], r: 110 },
    { name: 'Памятник Николаю Путилову · Nikolai Putilov monument', c: [-5102.3, 5883.7], r: 35 },
    { name: 'Памятник Александру Маринеско · Alexander Marinesko monument', c: [-5160.2, 6919.8], r: 32 },
    { name: 'Танк-победитель КВ-85 · KV-85 tank memorial', c: [-5187, 7949.1], r: 28 },
    { name: 'ДОТ № 930 Кировского вала · DOT No. 930', c: [-5130.5, 7953.9], r: 25 },
    { name: 'Кировский завод · Kirov Factory', c: [-5100, 5880], r: 230 },
    { name: 'Блокадный трамвай · Siege tram memorial', c: [-5325.1, 8113.6], r: 85 },
    { name: 'Автово · Avtovo', x0: -20000, x1: 20000, z0: -20000, z1: 20000 },
  ];
}
export function makeViews({ yawToward }) {
  const HERO = { x: -5089, z: 7264, yaw: yawToward(-5089, 7264, -5027.2, 7254.5), pitch: 13 };
  const kirov = { x: -5033, z: 5878, yaw: yawToward(-5033, 5878, -4993.1, 5875.7), pitch: 12 };
  const gate = { x: -5185, z: 5890, yaw: yawToward(-5185, 5890, -5215.5, 5889.5), pitch: 12 };
  const putilov = { x: -5087, z: 5891, yaw: yawToward(-5087, 5891, -5102.3, 5883.7), pitch: 8 };
  const marinesko = { x: -5147.4, z: 6931, yaw: yawToward(-5147.4, 6931, -5160.2, 6919.8), pitch: 8 };
  const kv85 = { x: -5203, z: 7960, yaw: yawToward(-5203, 7960, -5187, 7949.1), pitch: 9 };
  const tram = { x: -5342, z: 8114, yaw: yawToward(-5342, 8114, -5325.1, 8113.6), pitch: 8 };
  const bunker = { x: -5151, z: 7954, yaw: yawToward(-5151, 7954, -5130.5, 7953.9), pitch: 7 };
  return { HERO, VIEWS: [
    { key: 'Digit1', label: 'Станция метро «Автово»', ...HERO },
    { key: 'Digit2', label: 'Станция метро «Кировский завод»', ...kirov },
    { key: 'Digit3', label: 'Проходная Кировского завода', ...gate },
    { key: 'Digit4', label: 'Памятник блокадному трамваю', ...tram },
    { key: 'Digit5', label: 'ДОТ № 930 Кировского вала', ...bunker },
    { key: 'Place.avtovo-metro', label: 'Станция метро «Автово»', ...HERO },
    { key: 'Place.kirovsky-metro', label: 'Станция метро «Кировский завод»', ...kirov },
    { key: 'Place.kirov-factory', label: 'Проходная Кировского завода', ...gate },
    { key: 'Place.putilov', label: 'Памятник Николаю Путилову', ...putilov },
    { key: 'Place.marinesko', label: 'Памятник Александру Маринеско', ...marinesko },
    { key: 'Place.kv85', label: 'Танк-победитель КВ-85', ...kv85 },
    { key: 'Place.blockade-tram', label: 'Памятник блокадному трамваю', ...tram },
    { key: 'Place.kirovsky-val', label: 'ДОТ № 930 Кировского вала', ...bunker },
  ] };
}
export const TEST = {
  claimed: [
    { id: 'r6440025', by: 'landmarksAvtovoMetro', group: 'avtovo-metro-avtovo' },
    { id: 'w47636754', by: 'landmarksAvtovoMetro', group: 'avtovo-metro-kirovsky' },
    { id: 'w128500581', by: 'landmarksAvtovoSites', group: 'avtovo-factory-gate' },
    { id: 'w119225860', by: 'landmarksAvtovoSites', group: 'avtovo-pillbox' },
  ],
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Place.avtovo-metro', 'Place.kirovsky-metro', 'Place.kirov-factory', 'Place.putilov', 'Place.marinesko', 'Place.kv85', 'Place.blockade-tram', 'Place.kirovsky-val'],
  mustHaveAreas: [
    { x: -5027.2, z: 7254.5, has: 'Автово' },
    { x: -5102.3, z: 5883.7, has: 'Путилову' },
    { x: -5160.2, z: 6919.8, has: 'Маринеско' },
    { x: -5187, z: 7949.1, has: 'КВ-85' },
    { x: -5130.5, z: 7953.9, has: 'ДОТ № 930' },
  ],
  farPoint: [-9000, 6200],
};

// The Duderhof Channel, Ekateringofka, Krasnenkaya and port basins are tidal
// continuations of Neva Bay. The inland mapped ponds have no channel outlet.
export const WATER = {
  farCenter: [-6600, 6600], farRadius: 7400, farSources: [],
  bridgeZones: BRIDGE_ZONES,
  riverKeys: Object.fromEntries(RIVER.map(r => [r.name, r.key || 'neva'])),
  dataWater: DATA_WATER.filter(w => ['pond', 'lake'].includes(w.kind)).map(w => ({ id: w.id, key: 'moat' })),
  isolatedKeys: { moat: 'Mapped inland ponds and lakes without a navigable outlet to Neva Bay.' },
  isolatedLevels: { moat: { water: -1.2, bed: -2.4 } },
  // The 1.5 km long, very narrow mapped pond w173060664 has pinch points:
  // slope run-outs from both banks meet and would become a solid across water.
  slopeReaches: [
    { id: 'avtovo-pond-banks', key: 'moat', run: 3, kerb: .1, lip: .04,
      test: (x, z) => !(x > -6900 && x < -5300 && z > 7520 && z < 7680), rail: () => null },
    { id: 'avtovo-narrow-pond-bank', key: 'moat', run: 1.2, kerb: .1, lip: .04,
      test: (x, z) => x > -6900 && x < -5300 && z > 7520 && z < 7680 &&
        Math.abs(x + 6516) > 80 && Math.abs(x + 6260) > 60, rail: () => null },
  ],
};
export const ZONES = {
  peopleDensity: { west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true } },
  peopleHot: [[-5027, 7255, 1, 35], [-4993, 5876, .8, 30], [-5325, 8114, .5, 24]],
  crowHaunts: [{ x: -5027, z: 7255, r: 125 }],
  farCentres: [{ x: -6500, z: 6700, bias: 600 }],
};
export const GARAGE = {
  poses: { lada: { x: -5090, z: 7295, yaw: 0 } },
  spawn: { x: -5090, z: 7295, yaw: 0 },
  boats: [{ id: 'boat-avtovo', dock: 'avtovo-harbour', x: -6772, z: 7492, yaw: -0.6 }],
};
export const PRUNE_SERVICES = ['city', 'landmarksAvtovoMetro', 'landmarksAvtovoSites'];
const inSights = (x, z) => [
  [-5027.2, 7254.5, 30], [-4993.1, 5875.7, 34],
  [-5215.5, 5889.5, 24], [-5325.1, 8113.6, 22],
  [-5130.5, 7953.9, 15], [-5160.2, 6919.8, 13],
].some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
export const HOOKS = {
  deckServices: ['coastalBridges'],
  treeReject: () => inSights,
  tuftReject: () => inSights,
  propReject: () => inSights,
};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
