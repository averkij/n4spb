// ============================================================================
//  AREA DEFINITION - Admiralty-Haymarket (Адмиралтейский-Сенной; docs/AREAS.md sections 13 and 15.2): the third area of the world map (maps/intro-draft.html, area 46), the merge of the Admiralteysky and Sennoy
//  municipal districts and the 78th okrug with their walkable overlaps: the Admiralty and the Alexander Garden, Senate Square with the Bronze Horseman, St Isaac's Cathedral and its square, Nevsky Prospekt from the
//  Admiralty to the Fontanka, Kazan Cathedral, Gostiny Dvor and the Anichkov Bridge, the Moika and the Griboedov Canal with their bridges, the Mariinsky Theatre, New Holland, the Yusupov Palace, the Nikolsky
//  Naval Cathedral, the Haymarket (Sennaya) and the Trinity-Izmailovsky Cathedral. 7.3 km2 of play rectangles (src/areas/registry.js REGISTRY.admiralty.play, cut from the map outline by tools/area-shape.mjs --k 46),
//  the data cut straight from the source project by tools/area-data-cut.mjs.
//  It starts from the palace's area module: the landmark modules whose sights lie in the territory are listed in MODULES with their claims in GROUPS (a module that is group-aware draws only what is claimed; the
//  modules ported for this area, landmarksMariinsky / Nikolsky / NewHolland / Yusupov / CentralSouth, draw their whole group list, and every group of it lies in this territory). This area contains NO railway station:
//  no `rail`, no landmarksA / B, and ONE purple Zhiguli at the spawn (docs/AREAS.md 13.4). The sights of the neighbours (the Russian Museum, the Saviour on Blood, the castle, the Summer Garden, the Mars Field, the
//  Tauride Garden) are not built here.
//  admiralty.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
// ============================================================================
import { GROUPS_LIST as G_E } from '../../world/landmarksE/groups.js';
import { GROUPS_LIST as G_F } from '../../world/landmarksF/groups.js';
import { GROUPS_LIST as G_G } from '../../world/landmarksG/groups.js';
import { GROUPS_LIST as G_H } from '../../world/landmarksH/groups.js';
import { GROUPS_LIST as G_I } from '../../world/landmarksI/groups.js';
import { GROUPS_LIST as G_J } from '../../world/landmarksJ/groups.js';
import { GROUPS_LIST as G_BR } from '../../world/bridges/groups.js';
import { GROUPS_SW, GROUPS_SOUTH } from '../../world/bridges/groups-sw.js';
import { LIBRARY_GROUP } from '../../world/landmarksD/groups.js';
import { GROUPS_LIST as G_MARIINSKY } from '../../world/landmarksMariinsky/groups.js';
import { GROUPS_LIST as G_NIKOLSKY } from '../../world/landmarksNikolsky/groups.js';
import { GROUPS_LIST as G_NEWHOLLAND } from '../../world/landmarksNewHolland/groups.js';
import { GROUPS_LIST as G_YUSUPOV } from '../../world/landmarksYusupov/groups.js';
import { GROUPS_LIST as G_CENTRALSOUTH } from '../../world/landmarksCentralSouth/groups.js';

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'admiralty';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/admiralty/';
/** A missing or stale bake is an error card, never a minutes-long procedural build (a hand-off lands here). */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No `rail` and no landmarksA / B (no station, no tracks), no metro network, no Palace Square sub-modules of the neighbour
 *  (the Mikhailovsky / Summer Garden / Mars / Castle / Tauride sights lie in Palace-Liteyny and Smolninskoye). tools/modules-list.mjs parses this list: one quoted name per line. */
export const MODULES = [
  'environment',  // ground, embankment granite, Neva / Moika / Griboedov / Fontanka / Kryukov / Admiralty canal water, trees, lawns, flowerbeds, far skyline
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'landmarksC',   // Fontanka embankment, Anichkov Bridge + horse tamers, the Beloselsky-Belozersky palace, boats
  'landmarksD',   // the National Library and the Mariinsky hospital block ('library') and the Tolstoy House ('tolstoy')
  'landmarksE',   // Gostiny Dvor, Ostrovsky Square, Alexandrinsky Theatre, Rossi Street, Anichkov Palace, the Catherine Garden
  'landmarksF',   // Kazan Cathedral + square, Singer House
  'landmarksG',   // Palace Square: General Staff, Guards Corps HQ, Alexander Column
  'landmarksH',   // Admiralty, Alexander Garden, Senate and Synod, the Bronze Horseman
  'landmarksI',   // Winter Palace + Hermitage
  'landmarksJ',   // St Isaac's Cathedral + square, Nicholas I monument, Mariinsky Palace, Astoria, Angleterre
  'landmarksNikolsky', // St Nicholas Naval Cathedral and bell tower
  'landmarksMariinsky', // Mariinsky Theatre, Conservatory, Teatralnaya Square, Mariinsky-II
  'landmarksNewHolland', // New Holland island
  'landmarksYusupov', // Yusupov Palace on the Moika
  'landmarksCentralSouth', // Trinity-Izmailovsky Cathedral and the Technological Institute
  'bridges',      // the bridges of the area: the Moika, Griboedov, Kryukov, Admiralty and Fontanka bridges, Blue, Kazansky, the Palace Bridge ...
  'landmarksPalaceBridge', // the Palace Bridge's two opening bascule leaves (docs/AREAS.md 13.10): `bridges` leaves the central span to it; after streets (the NPC stop lines) and bridges, before traffic / people
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, tourists, groups with guides, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the purple Zhiguli (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksC: 'Аничков мост, Фонтанка',
  landmarksD: 'Национальная библиотека, Толстовский дом',
  landmarksH: 'Адмиралтейство, Александровский сад, Медный всадник',
  landmarksJ: 'Исаакиевский собор, Исаакиевская площадь',
  landmarksNikolsky: 'Никольский Морской собор',
  landmarksMariinsky: 'Мариинский театр, Консерватория, Театральная площадь',
  landmarksNewHolland: 'Новая Голландия',
  landmarksYusupov: 'Юсуповский дворец',
  landmarksCentralSouth: 'Троице-Измайловский собор, Технологический институт',
  landmarksPalaceBridge: 'Дворцовый мост · разводные пролёты',
  drive: 'машина на старте',
};

export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: {
    nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова',
    sadovaya: 'Садовая улица', malayaSadovaya: 'Малая Садовая улица', gorokhovaya: 'Гороховая улица', bolshayaMorskaya: 'Большая Морская улица', malayaMorskaya: 'Малая Морская улица',
    bolshayaKonyushennaya: 'Большая Конюшенная улица', malayaKonyushennaya: 'Малая Конюшенная улица', admiralteysky: 'Адмиралтейский проспект', voznesensky: 'Вознесенский проспект',
    dvortsovayaNab: 'Дворцовая набережная', admiralteyskayaNab: 'Адмиралтейская набережная', angliyskayaNab: 'Английская набережная', universitetskayaNab: 'Университетская набережная',
    kryukovNab: 'набережная Крюкова канала', konnogvardeysky: 'Конногвардейский бульвар', kazanskaya: 'Казанская улица', galernaya: 'Галерная улица', yakubovicha: 'улица Якубовича',
    moskovsky: 'Московский проспект', dekabristov: 'улица Декабристов', rimskogoKorsakova: 'проспект Римского-Корсакова', glinki: 'улица Глинки', lomonosova: 'улица Ломоносова',
    izmailovsky: 'Измайловский проспект', zagorodny: 'Загородный проспект', rizhsky: 'Рижский проспект', troitsky: 'Троицкий проспект', borodinskaya: 'Бородинская улица',
    bolshayaPodyacheskaya: 'Большая Подьяческая улица', rubinsteina: 'улица Рубинштейна', vladimirsky: 'Владимирский проспект', marata: 'улица Марата',
    // squares
    dvortsovayaSq: 'Дворцовая площадь', isaakievskayaSq: 'Исаакиевская площадь', senatskayaSq: 'Сенатская площадь', ostrovskogoSq: 'площадь Островского', konyushennayaSq: 'Конюшенная площадь',
    iskusstvSq: 'площадь Искусств', birzhevayaSq: 'Биржевая площадь', kazanskayaSq: 'Казанская площадь', teatralnayaSq: 'Театральная площадь', trudaSq: 'площадь Труда',
  },
};

// ---------------------------------------------------------------- the local frames: anchors of the strip (Vosstaniya Square, the obelisk, the Moscow station)
// The engine reads these from every area (the Nevsky grid origin SQUARE: the style of a block follows its distance to it, city/archetypes.js, streets/style.js): COPIES of the strip's, so every page agrees.
// This territory contains neither the square nor the station (they are 2.5 km east); the values only anchor the grid.
/** Vosstaniya Square: the paved square w638352776 (centre 589, 173); the Hero City obelisk (36 m) stands at (592, 165) on an island between the two Nevsky carriageways. */
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
/** Moscow Railway Station: faces NNW (facade normal bearing ~348 deg) onto the square with the obelisk on its axis; the tracks run SSE (bearing ~167 deg). Clock tower base (602, 246). */
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

// ---------------------------------------------------------------- landmark groups
// The generic `city` module builds every building that no specialist claims. A specialist MODULE owns a list of named SUB-GROUPS. A sub-group claims building ids (`ids`, plus every part whose `parent` is one of them)
// and non-building OSM ids (`osm`: paving, bridge decks, monuments) that the owner draws itself. A claim only takes effect when the owner module says so: it exports `OWNS_GROUPS = true` (every sub-group) or
// `['station', ...]` (only those); until then `city` / `environment` / `streets` still draw the claimed objects as a blockout (see lib/claims.js).
export const GROUPS = {
  // ---- landmarksC: the Fontanka embankment, Anichkov Bridge, the Beloselsky-Belozersky palace and the embankment houses (the north-east corner of the territory)
  landmarksC: [
    { key: 'anichkov-bridge', name: 'Аничков мост', nameEn: 'Anichkov Bridge + Klodt horse tamers', ids: [], osm: ['r5537267', 'w372394912', 'w372394928'], at: [-441, -93], note: 'three-arch pink-granite bridge 54.6 x 37.9 m, four bronze groups on the corners (docs/research/fontanka.md)' },
    { key: 'beloselsky', name: 'Дворец Белосельских-Белозерских', nameEn: 'Beloselsky-Belozersky Palace', ids: ['r1588865'], osm: [], at: [-374, -30], note: 'Nevsky 41, coral-pink neo-baroque at the south-east corner of the bridge' },
    { key: 'fontanka-bank', name: 'Набережная Фонтанки', nameEn: 'Fontanka embankment buildings', ids: ['w28962563', 'w47457765'], osm: [], at: [-540, 60], note: 'Fontanka 33 (SDYUSSHOR-1) and Fontanka 50 (Grebyonka); the granite walls themselves are drawn by environment' },
  ],
  // ---- landmarksD: group-aware (landmarksD.js PARTS): the National Library + the Mariinsky hospital block and the Tolstoy House lie in this territory; the Vladimirsky cathedral and the Vladimirskaya passage do not
  landmarksD: [
    LIBRARY_GROUP,      // landmarksD/groups.js
    { key: 'tolstoy', name: 'Толстовский дом · дом Рубинштейна', nameEn: 'Tolstoy House (Rubinshteyna 15-17) and Rubinshteyna 13', ids: ['r1588827', 'r368263'], osm: [], at: [-480, 330], note: 'corner tower; Zagorodny / Rubinshteyna corner' },
  ],
};
// the specialist modules of the strip and the new west: each one owns the pure-data groups.js of its module
GROUPS.landmarksE = G_E; GROUPS.landmarksF = G_F; GROUPS.landmarksG = G_G; GROUPS.landmarksH = G_H; GROUPS.landmarksI = G_I; GROUPS.landmarksJ = G_J;
// the bridges: only the ones whose OSM ways are in the data of this area (the bridges of the Mars Field / Summer Garden reach and the Winter Canal east of the Hermitage lie in Palace-Liteyny)
const BRIDGE_KEYS = new Set(['kazansky', 'green', 'red', 'blue', 'bankovsky', 'mucny', 'palace', 'kamenny', 'pochtamtsky', 'fonarny', 'hermitage', 'zimny1', 'italyansky']);
GROUPS.bridges = G_BR.filter((b) => BRIDGE_KEYS.has(b.key)).concat(GROUPS_SW, GROUPS_SOUTH);      // + the 24 bridges of the south-west and the six southern Fontanka crossings (bridges/groups-sw.js)
// the ported west and south-west: Nikolsky, Mariinsky, New Holland, Yusupov draw every sub-group of their lists (all in this territory and in its data); CentralSouth draws the Trinity-Izmailovsky Cathedral and the Technological Institute
// (the Vitebsky station lies 200 m outside the data: its sub-group is not claimed)
GROUPS.landmarksNikolsky = G_NIKOLSKY; GROUPS.landmarksMariinsky = G_MARIINSKY; GROUPS.landmarksNewHolland = G_NEWHOLLAND; GROUPS.landmarksYusupov = G_YUSUPOV;
GROUPS.landmarksCentralSouth = G_CENTRALSOUTH.filter((g) => g.key !== 'central-vitebsky');

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist } = h;
  return [
  _deck('Дворцовый мост · Palace Bridge', [-2344.2, -871.2], [-2495.5, -1075.8], 32),
  { name: 'Аничков мост · Anichkov Bridge', c: [-441, -93], r: 42 },
  ..._groupPolys(SUBGROUPS.beloselsky, 8).map((r) => ({ name: 'Дворец Белосельских-Белозерских · Beloselsky-Belozersky Palace', ...r })),
  ..._groupPolys(SUBGROUPS.anichkov, 10).map((r) => ({ name: 'Аничков дворец · Anichkov Palace', ...r })),
  ..._groupPolys(SUBGROUPS.library, 6).map((r) => ({ name: 'Российская национальная библиотека · National Library', ...r })),
  ..._groupPolys(SUBGROUPS.tolstoy, 6).map((r) => ({ name: 'Толстовский дом · Tolstoy House', ...r })),
  // ---- sights (outline of the named OSM building + margin; the circle is the fallback when OSM has no such outline), squares, waterways, streets. The areas find the buildings by their OSM names.
  ..._groupPolys(SUBGROUPS['kazan-cathedral'], 14).map((r) => ({ name: 'Казанский собор · Kazan Cathedral', ...r })),
  ..._named(/Дом Зингера|Дом книги/i, 8, { c: [-1420, -383], r: 32 }).map((r) => ({ name: 'Дом Зингера · Singer House', ...r })),
  ..._named(/Гостиный двор/i, 8, null).map((r) => ({ name: 'Гостиный Двор · Gostiny Dvor', ...r })),
  ..._named(/Александринск/i, 8, null).map((r) => ({ name: 'Александринский театр · Alexandrinsky Theatre', ...r })),
  ..._named(/Строгановск/i, 8, null).map((r) => ({ name: 'Строгановский дворец · Stroganov Palace', ...r })),
  ..._groupPolys(SUBGROUPS.admiralty, 12).map((r) => ({ name: 'Адмиралтейство · Admiralty', ...r })),
  { name: 'Александровский сад · Alexander Garden', c: [-2400, -490], r: 105 },       // after the Admiralty outline (the circle of the Admiralty is only the fallback when OSM has no outline)
  ..._named(/Зимний дворец/i, 10, { c: [-2096, -896], r: 110 }).map((r) => ({ name: 'Зимний дворец · Winter Palace', ...r })),
  ..._named(/Эрмитажный театр/i, 8, { c: [-1862, -1138], r: 50 }).map((r) => ({ name: 'Эрмитажный театр · Hermitage Theatre', ...r })),
  ..._named(/Эрмитаж/i, 8, null).map((r) => ({ name: 'Эрмитаж · The Hermitage', ...r })),
  ..._named(/Главный штаб|Здание Главного штаба/i, 10, null).map((r) => ({ name: 'Здание Главного штаба · General Staff Building', ...r })),
  ..._named(/Штаб Гвардейского корпуса/i, 10, null).map((r) => ({ name: 'Штаб Гвардейского корпуса · Guards Corps Headquarters', ...r })),
  { name: 'Александровская колонна · Alexander Column', c: [-1983, -738], r: 30 },
  ..._named(/Исаакиевский собор/i, 14, { c: [-2523, -185], r: 110 }).map((r) => ({ name: 'Исаакиевский собор · St Isaac\'s Cathedral', ...r })),
  ..._named(/Мариинский дворец/i, 10, null).map((r) => ({ name: 'Мариинский дворец · Mariinsky Palace', ...r })),
  ..._groupPolys(SUBGROUPS['senate-synod'], 10).map((r) => ({ name: 'Сенат и Синод · Senate and Synod', ...r })),
  { name: 'Медный всадник · Bronze Horseman', c: [-2744, -443], r: 40 },
  ..._groupPolys(SUBGROUPS['mariinsky-theatre'], 8).map((r) => ({ name: 'Мариинский театр · Mariinsky Theatre', ...r })),
  ..._groupPolys(SUBGROUPS['mariinsky-conservatory'], 8).map((r) => ({ name: 'Консерватория имени Римского-Корсакова · St Petersburg Conservatory', ...r })),
  ..._groupPolys(SUBGROUPS['mariinsky-two'], 8).map((r) => ({ name: 'Мариинский-2 · Mariinsky-II', ...r })),
  ..._groupPolys(SUBGROUPS['nikolsky-cathedral'], 12).map((r) => ({ name: 'Никольский Морской собор · St Nicholas Naval Cathedral', ...r })),
  { name: 'Никольский сад · Nikolsky Garden', c: [-2900, 1050], r: 75 },
  ..._groupPolys(SUBGROUPS['nikolsky-bell-tower'], 8).map((r) => ({ name: 'Колокольня Никольского собора · Nikolsky bell tower', ...r })),
  ..._groupPolys(SUBGROUPS['yusupov-palace'], 10).map((r) => ({ name: 'Юсуповский дворец · Yusupov Palace', ...r })),
  ..._groupPolys(SUBGROUPS['yusupov-pavilion'], 8).map((r) => ({ name: 'Садовый павильон Юсуповского сада · Yusupov garden pavilion', ...r })),
  ..._groupPolys(SUBGROUPS['nh-warehouses'], 8).map((r) => ({ name: 'Новая Голландия · New Holland warehouses', ...r })),
  ..._groupPolys(SUBGROUPS['nh-bottle'], 8).map((r) => ({ name: 'Бутылка · New Holland Bottle', ...r })),
  { name: 'Новая Голландия · New Holland', c: [-3470, 320], r: 170 },
  { name: 'Троице-Измайловский собор · Trinity-Izmailovsky Cathedral', c: [-2540, 1727], r: 60 },
  ..._groupPolys(SUBGROUPS['central-trinity'], 14).map((r) => ({ name: 'Троице-Измайловский собор · Trinity-Izmailovsky Cathedral', ...r })),
  ..._groupPolys(SUBGROUPS['central-institute'], 10).map((r) => ({ name: 'Технологический институт · Technological Institute', ...r })),
  ..._areaPolys(/Дворцовая площадь/).map((o) => ({ name: 'Дворцовая площадь · Palace Square', poly: o, margin: 6 })),
  ..._areaPolys(/Исаакиевская площадь/).map((o) => ({ name: 'Исаакиевская площадь · St Isaac\'s Square', poly: o, margin: 6 })),
  ..._areaPolys(/Сенатская площадь|площадь Декабристов/).map((o) => ({ name: 'Сенатская площадь · Senate Square', poly: o, margin: 6 })),
  ..._areaPolys(/Казанская площадь/).map((o) => ({ name: 'Казанская площадь · Kazan Square', poly: o, margin: 6 })),
  ..._areaPolys(/площадь Островского/).map((o) => ({ name: 'Площадь Островского · Ostrovsky Square', poly: o, margin: 6 })),
  ..._areaPolys(/Театральная площадь/).map((o) => ({ name: 'Театральная площадь · Teatralnaya Square', poly: o, margin: 6 })),
  ..._areaPolys(/Сенная площадь|площадь Мира/).map((o) => ({ name: 'Сенная площадь · Haymarket (Sennaya) Square', poly: o, margin: 6 })),
  { name: 'Дворцовая площадь · Palace Square', c: [-2000, -740], r: 120 },
  { name: 'Исаакиевская площадь · St Isaac\'s Square', c: [-2470, -90], r: 120 },
  { name: 'Сенатская площадь · Senate Square', c: [-2730, -400], r: 90 },
  { name: 'Казанская площадь · Kazan Square', c: [-1568, -250], r: 90 },
  { name: 'Сенная площадь · Haymarket (Sennaya) Square', c: [-1746, 718], r: 110 },
  { name: 'Театральная площадь · Teatralnaya Square', c: [-3000, 710], r: 90 },
  { name: 'Зимняя канавка · Winter Canal', x0: -1950, x1: -1700, z0: -1180, z1: -880, test: (x, z) => _shoreOf(['winter-canal'], x, z) < 14 },
  { name: 'Мойка · Moika River', x0: -4400, x1: -720, z0: -1180, z1: 740, test: (x, z) => _shoreOf(['moika'], x, z) < 16 },
  { name: 'Канал Грибоедова · Griboedov Canal', x0: -4000, x1: -1180, z0: -1180, z1: 1780, test: (x, z) => _shoreOf(['griboedov'], x, z) < 14 },
  { name: 'Фонтанка · Fontanka River', x0: -4100, x1: -330, z0: -1700, z1: 1900, test: (x, z) => shoreDist(x, z) < 14 },
  { name: 'Нева · Neva River', x0: -4300, x1: -1100, z0: -1500, z1: 330, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Невский проспект · Nevsky Prospekt', road: NAMES.streets.nevsky },
  { name: 'Набережная реки Фонтанки · Fontanka embankment', road: NAMES.streets.fontanka },
  { name: 'Набережная реки Мойки · Moika embankment', road: NAMES.streets.moika },
  { name: 'Набережная канала Грибоедова · Griboedov Canal embankment', road: NAMES.streets.griboedov },
  { name: 'Набережная Крюкова канала · Kryukov Canal embankment', road: NAMES.streets.kryukovNab },
  { name: 'Садовая улица · Sadovaya ulitsa', road: NAMES.streets.sadovaya },
  { name: 'Малая Садовая улица · Malaya Sadovaya ulitsa', road: NAMES.streets.malayaSadovaya },
  { name: 'Гороховая улица · Gorokhovaya ulitsa', road: NAMES.streets.gorokhovaya },
  { name: 'Вознесенский проспект · Voznesensky Prospekt', road: NAMES.streets.voznesensky },
  { name: 'Адмиралтейский проспект · Admiralteysky Prospekt', road: NAMES.streets.admiralteysky },
  { name: 'Конногвардейский бульвар · Konnogvardeysky Boulevard', road: NAMES.streets.konnogvardeysky },
  { name: 'Московский проспект · Moskovsky Prospekt', road: NAMES.streets.moskovsky },
  { name: 'Улица Декабристов · Ulitsa Dekabristov', road: NAMES.streets.dekabristov },
  { name: 'Проспект Римского-Корсакова · Prospekt Rimskogo-Korsakova', road: NAMES.streets.rimskogoKorsakova },
  { name: 'Большая Морская улица · Bolshaya Morskaya ulitsa', road: NAMES.streets.bolshayaMorskaya },
  { name: 'Малая Морская улица · Malaya Morskaya ulitsa', road: NAMES.streets.malayaMorskaya },
  { name: 'Большая Конюшенная улица · Bolshaya Konyushennaya ulitsa', road: NAMES.streets.bolshayaKonyushennaya },
  { name: 'Малая Конюшенная улица · Malaya Konyushennaya ulitsa', road: NAMES.streets.malayaKonyushennaya },
  { name: 'Казанская улица · Kazanskaya ulitsa', road: NAMES.streets.kazanskaya },
  { name: 'Адмиралтейская набережная · Admiralty Embankment', road: NAMES.streets.admiralteyskayaNab },
  { name: 'Дворцовая набережная · Palace Embankment', road: NAMES.streets.dvortsovayaNab },
  { name: 'Английская набережная · English Embankment', road: NAMES.streets.angliyskayaNab },
  { name: 'Университетская набережная · Universitetskaya embankment', road: NAMES.streets.universitetskayaNab },
  { name: 'Галерная улица · Galernaya ulitsa', road: NAMES.streets.galernaya },
  { name: 'Улица Якубовича · Ulitsa Yakubovicha', road: NAMES.streets.yakubovicha },
  { name: 'Улица Глинки · Ulitsa Glinki', road: NAMES.streets.glinki },
  { name: 'Улица Ломоносова · Ulitsa Lomonosova', road: NAMES.streets.lomonosova },
  { name: 'Измайловский проспект · Izmailovsky Prospekt', road: NAMES.streets.izmailovsky },
  { name: 'Загородный проспект · Zagorodny Prospekt', road: NAMES.streets.zagorodny },
  { name: 'Рижский проспект · Rizhsky Prospekt', road: NAMES.streets.rizhsky },
  { name: 'Троицкий проспект · Troitsky Prospekt', road: NAMES.streets.troitsky },
  { name: 'Бородинская улица · Borodinskaya ulitsa', road: NAMES.streets.borodinskaya },
  { name: 'Большая Подьяческая улица · Bolshaya Podyacheskaya ulitsa', road: NAMES.streets.bolshayaPodyacheskaya },
  { name: 'Улица Рубинштейна · Ulitsa Rubinshteyna', road: NAMES.streets.rubinsteina },
  { name: 'Владимирский проспект · Vladimirsky Prospekt', road: NAMES.streets.vladimirsky },
  { name: 'Улица Марата · Ulitsa Marata', road: NAMES.streets.marata },
  { name: 'Дворцовая площадь · Palace Square', road: NAMES.streets.dvortsovayaSq },
  { name: 'Исаакиевская площадь · St Isaac\'s Square', road: NAMES.streets.isaakievskayaSq },
  { name: 'Сенатская площадь · Senate Square', road: NAMES.streets.senatskayaSq },
  { name: 'Площадь Островского · Ostrovsky Square', road: NAMES.streets.ostrovskogoSq },
  { name: 'Конюшенная площадь · Konyushennaya Square', road: NAMES.streets.konyushennayaSq },
  { name: 'Казанская площадь · Kazan Square', road: NAMES.streets.kazanskayaSq },
  { name: 'Театральная площадь · Teatralnaya Square', road: NAMES.streets.teatralnayaSq },
  { name: 'Площадь Труда · Truda Square', road: NAMES.streets.trudaSq },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // Admiralty-Haymarket: 1..0 the great sights of the Admiralty district, Shift + 1..9 the sights of the south-west and the centre, Alt + 1..4 the rest; the Places list also holds the Anichkov Bridge, the library ...
  const HERO = { x: -2329, z: -508, yaw: yawToward(-2329, -508, -2430, -622), pitch: 8 };      // the Alexander Garden, looking at the Admiralty
  const VIEWS = [
    { key: 'Digit1', label: 'Адмиралтейство · Александровский сад', x: -2329, z: -508, yaw: yawToward(-2329, -508, -2430, -622), pitch: 8 },
    { key: 'Digit2', label: 'Исаакиевский собор', x: -2488, z: -63, yaw: yawToward(-2488, -63, -2524, -186), pitch: 18 },
    { key: 'Digit3', label: 'Медный всадник · Сенатская площадь', x: -2735, z: -405, yaw: yawToward(-2735, -405, -2745, -444), pitch: 6 },
    { key: 'Digit4', label: 'Сенат и Синод', x: -2740, z: -380, yaw: yawToward(-2740, -380, -2800, -335), pitch: 10 },
    { key: 'Digit5', label: 'Казанский собор', x: -1470, z: -312, yaw: yawToward(-1470, -312, -1482, -235), pitch: 8 },
    { key: 'Digit6', label: 'Мариинский театр · Театральная площадь', x: -3030, z: 760, yaw: yawToward(-3030, 760, -3058, 736), pitch: 8 },
    { key: 'Digit7', label: 'Юсуповский дворец · Мойка', x: -2950, z: 300, yaw: yawToward(-2950, 300, -2933, 337), pitch: 8 },
    { key: 'Digit8', label: 'Новая Голландия · арка', x: -3339, z: 471, yaw: yawToward(-3339, 471, -3390, 453), pitch: 8 },
    { key: 'Digit9', label: 'Никольский Морской собор', x: -2873, z: 1040, yaw: yawToward(-2873, 1040, -2862, 1105), pitch: 10 },
    { key: 'Digit0', label: 'Дворцовая площадь · Александровская колонна', x: -2095, z: -748, yaw: yawToward(-2095, -748, -1983, -738), pitch: 6 },
    { key: 'ShiftDigit1', label: 'Троице-Измайловский собор', x: -2587, z: 1738, yaw: yawToward(-2587, 1738, -2540, 1777), pitch: 12 },
    { key: 'ShiftDigit2', label: 'Технологический институт', x: -1815, z: 1607, yaw: yawToward(-1815, 1607, -1840, 1565), pitch: 8 },
    { key: 'ShiftDigit3', label: 'Сенная площадь', x: -1746, z: 690, yaw: yawToward(-1746, 690, -1746, 718), pitch: 6 },
    { key: 'ShiftDigit4', label: 'Гостиный Двор · Невский проспект', x: -1123, z: -282, yaw: yawToward(-1123, -282, -1100, -190), pitch: 6 },
    { key: 'ShiftDigit5', label: 'Аничков мост', x: -395, z: -108, yaw: yawToward(-395, -108, -470, -92), pitch: 6 },
    { key: 'ShiftDigit6', label: 'Зимний дворец · Дворцовая набережная', x: -2143, z: -1008, yaw: yawToward(-2143, -1008, -2060, -940), pitch: 10 },
    { key: 'ShiftDigit7', label: 'Дворцовый мост · Дворцовая набережная', x: -2337, z: -848, yaw: yawToward(-2337, -848, -2495, -1075), pitch: 4 },
    { key: 'ShiftDigit8', label: 'Дом Зингера · Казанский мост', x: -1398, z: -345, yaw: yawToward(-1398, -345, -1420, -383), pitch: 12 },
    { key: 'ShiftDigit9', label: 'Синий мост · Исаакиевская площадь', x: -2370, z: 40, yaw: yawToward(-2370, 40, -2370, 84), pitch: 6 },
    // the Places list only
    { key: 'Place.library', label: 'Российская национальная библиотека · Фонтанка', x: -372, z: -300, yaw: yawToward(-372, -300, -334, -311), pitch: 8 },
    { key: 'Place.alexandrinsky', label: 'Александринский театр · Екатерининский сад', x: -801, z: -95, yaw: yawToward(-801, -95, -844, 70), pitch: 8 },
    { key: 'Place.hermitage', label: 'Большой Эрмитаж · Дворцовая набережная', x: -2039, z: -1084, yaw: yawToward(-2039, -1084, -1985, -1050), pitch: 10 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'r1588865', by: 'landmarksC', group: 'beloselsky' },
    { id: 'r3801087', by: 'landmarksD', group: 'library' },
    { id: 'r1588827', by: 'landmarksD', group: 'tolstoy' },
    { id: 'r1147588', by: 'landmarksE', group: 'gostiny-dvor' },
    { id: 'r11763697', by: 'landmarksF', group: 'kazan-cathedral' },
    { id: 'w309796655', by: 'landmarksG', group: 'general-staff' },
    { id: 'r2612859', by: 'landmarksH', group: 'admiralty' },
    { id: 'r1374229', by: 'landmarksH', group: 'senate-synod' },
    { id: 'r69424', by: 'landmarksI', group: 'winter-palace' },
    { id: 'r3229838', by: 'landmarksJ', group: 'st-isaac' },
    { id: 'r2001070', by: 'landmarksJ', group: 'mariinsky' },
    { id: 'r3290873', by: 'landmarksNikolsky', group: 'nikolsky-cathedral' },
    { id: 'r1690283', by: 'landmarksMariinsky', group: 'mariinsky-theatre' },
    { id: 'r3164896', by: 'landmarksNewHolland', group: 'nh-warehouses' },
    { id: 'w123243367', by: 'landmarksYusupov', group: 'yusupov-palace' },
    { id: 'r16834195', by: 'landmarksCentralSouth', group: 'central-trinity' },
    { id: 'w362796524', by: 'bridges', group: 'palace' }, { id: 'w181173664', by: 'bridges', group: 'kazansky' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6',
    'ShiftDigit7', 'ShiftDigit8', 'ShiftDigit9', 'Place.library', 'Place.alexandrinsky', 'Place.hermitage'],
  mustHaveAreas: [
    { x: -441, z: -93, has: 'аничков' }, { x: -2322, z: -805, has: 'адмиралтейство' }, { x: -2523, z: -216, has: 'исаакиевский' }, { x: -2744, z: -443, has: 'всадник' },
    { x: -1484, z: -200, has: 'казанский' }, { x: -3097, z: 735, has: 'мариинский' }, { x: -1746, z: 718, has: 'сенная' }, { x: -2880, z: 1096, has: 'никольский' }, { x: -2861, z: 412, has: 'юсуповский' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [-2330, -300], r: 75, min: 3 },
};


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** the strip under the Palace Bridge that OSM leaves out of both Neva polygons (between the west polygon edge and the east polygon edge) */
const PLUGS = [{ key: 'neva', o: [-2315.3, -885.3, -2320, -892.2, -2330, -906.8, -2471.7, -1114.1, -2460.8, -1097.5] }];

/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). `own`: a bridge the bridges module draws (the quay leaves the parapet / collider open and publishes the zone);
 *  the others get an invisible fallback deck (walk box + parapet boxes). */
const BRIDGE_ZONES = [
  { id: 'kazansky', name: 'Казанский мост', key: 'griboedov', c: [-1393, -302], axis: 104, w: 101, len: 25, own: true },
  { id: 'bankovsky', name: 'Банковский мост', key: 'griboedov', c: [-1473, 27], axis: 139, w: 6.5, len: 25.4, own: true },
  { id: 'italyansky', name: 'Итальянский мост', key: 'griboedov', c: [-1350, -540], axis: 102, w: 5, len: 19.7, own: true },
  { id: 'green', name: 'Зелёный мост', key: 'moika', c: [-1768, -419], axis: 104, w: 39, len: 29.3, own: true },
  { id: 'hermitage', name: 'Эрмитажный мост', key: 'winter-canal', c: [-1920, -1137], axis: 51, w: 16.5, len: 12.2, own: true },
  { id: 'zimny-1', name: '1-й Зимний мост', key: 'winter-canal', c: [-1822, -1008], axis: 49, w: 21.5, len: 15.6, own: true },
  { id: 'palace', name: 'Дворцовый мост', key: 'neva', c: [-2322, -884], axis: 143, w: 30, len: 255, own: true },
  { id: 'anichkov', name: 'Аничков мост', key: 'fontanka', c: [-442, -92], axis: 100, w: 38, len: 55, own: true },
  { id: 'kamenny', name: 'Каменный мост', key: 'griboedov', c: [-1800.4, 218.5], axis: 143, w: 13.9, len: 19.7, own: true },
  { id: 'pochtamtsky', name: 'Почтамтский мост', key: 'moika', c: [-2821.7, 214.3], axis: 166.3, w: 6, len: 41.9, own: true },
  { id: 'fonarny', name: 'Фонарный мост', key: 'moika', c: [-2651.5, 200.3], axis: 142.6, w: 20, len: 40, own: true },
  // ---- the south-west (S1..S5; docs/research/sw-canals-bridges.md section 5): the Griboedov Canal south of the Kamenny Bridge, the Kryukov Canal, the Moika west of the Blue Bridge, the Admiralty canals, the Fontanka
  // (rows of the source project, 0568f7af; the six southern Fontanka decks of bridges/sites-south.js get their zones from environment/river.js)
  { id: 'demidov', name: 'Демидов мост', key: 'griboedov', c: [-2002.6, 414], axis: 154.4, w: 16.1, len: 36, own: true },
  { id: 'sennoy', name: 'Сенной мост', key: 'griboedov', c: [-2017.7, 657.4], axis: 103.6, w: 4.5, len: 22.5, own: true },
  { id: 'kokushkin', name: 'Кокушкин мост', key: 'griboedov', c: [-2105.3, 735.8], axis: 152.5, w: 13.1, len: 22, own: true },
  { id: 'voznesensky', name: 'Вознесенский мост', key: 'griboedov', c: [-2410.4, 662.7], axis: 1.6, w: 20, len: 25, own: true },
  { id: 'podyachesky', name: 'Подьяческий мост', key: 'griboedov', c: [-2549.3, 627.6], axis: 14.2, w: 20.6, len: 19, own: true },
  { id: 'lviny', name: 'Львиный мост', key: 'griboedov', c: [-2788.7, 613.4], axis: 155.4, w: 5.2, len: 22.4, own: true },
  { id: 'kharlamov', name: 'Харламов мост', key: 'griboedov', c: [-2698.1, 902.1], axis: 66.7, w: 22.5, len: 26, own: true },
  { id: 'novo-nikolsky', name: 'Ново-Никольский мост', key: 'griboedov', c: [-2698.7, 1161.8], axis: 155.4, w: 22.6, len: 22.8, own: true },
  { id: 'pikalov', name: 'Пикалов мост', key: 'griboedov', c: [-2955.5, 1284.1], axis: 155.6, w: 10.6, len: 22.8, own: true },
  { id: 'krasnogvardeysky', name: 'Красногвардейский мост', key: 'griboedov', c: [-2910.7, 1262.6], axis: 155.1, w: 8.5, len: 22.5, own: true },
  { id: 'mogilevsky', name: 'Могилёвский мост', key: 'griboedov', c: [-3237.9, 1202.7], axis: 155.3, w: 24, len: 32, own: true },
  { id: 'staro-nikolsky', name: 'Старо-Никольский мост', key: 'kryukov', c: [-2921.2, 1314.3], axis: 66.2, w: 20.2, len: 24.3, own: true },
  { id: 'kashin', name: 'Кашин мост', key: 'kryukov', c: [-3034.1, 1044.8], axis: 66.2, w: 16, len: 23.9, own: true, pad: 4 },      // pad: the asphalt of the approach flares to the wall beside the deck
  { id: 'torgovy', name: 'Торговый мост', key: 'kryukov', c: [-3105.7, 874], axis: 65.9, w: 10.8, len: 24, own: true },
  { id: 'dekabristov', name: 'мост Декабристов', key: 'kryukov', c: [-3162.8, 692.9], axis: 66, w: 23.3, len: 26, own: true },
  { id: 'matveev', name: 'Матвеев мост', key: 'kryukov', c: [-3213, 527.1], axis: 81.1, w: 9.8, len: 26, own: true },
  { id: 'krasnoflotsky', name: 'Краснофлотский мост', key: 'moika', c: [-3196.6, 498.1], axis: 158.2, w: 6, len: 29.8, own: true },
  { id: 'potseluev', name: 'Поцелуев мост', key: 'moika', c: [-3146.5, 472.1], axis: 156, w: 23.5, len: 40, own: true },
  { id: 'khrapovitsky', name: 'Храповицкий мост', key: 'moika', c: [-3689.6, 382.9], axis: 164.1, w: 20.5, len: 42.4, own: true },
  { id: 'krushtein1', name: '1-й мост Круштейна', key: 'admiralty', c: [-3394, 168], axis: 147.7, w: 9.3, len: 14.3, own: true },
  { id: 'krushtein2', name: '2-й мост Круштейна', key: 'admiralty', c: [-3620.7, 314.2], axis: 143.4, w: 10.7, len: 14.8, own: true },
  { id: 'admiralteysky', name: 'Адмиралтейский мост', key: 'admiralty', c: [-3769.6, 238.1], axis: 62.4, w: 14.5, len: 12.8, own: true },
  { id: 'obukhovsky', name: 'Обуховский мост', key: 'fontanka', c: [-1872.8, 1202.1], axis: 178.1, w: 30.9, len: 54, own: true },
  { id: 'izmailovsky', name: 'Измайловский мост', key: 'fontanka', c: [-2428.7, 1456.4], axis: 2.1, w: 15.9, len: 70.5, own: true },
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'palace-deck', key: 'neva', c: [-2415.2, -977.3], axis: 323.5, w: 27.7, len: 254.5 },
  { id: 'blagoveshchensky-deck', key: 'neva', c: [-3448.92, -263.75], axis: 334.3, w: 37.4, len: 332.6 },      // the Blagoveshchensky Bridge (bridges/blag.js)
];

/** reaches: key of the waterway, test(x, z, nx, nz) on a bank point (landward normal n), run = horizontal length of the slope, kerb = banquette top above the water, lip = step from the banquette to the slope */
const SLOPE_REACHES = [];

/**
 * WATER: the water tables of environment/waterways.js (the ring objects of the scenery sources stay there; an area names the ones it draws)
 *   plugs          [{ key, o: [x, z, ...] }]  strips that OSM leaves out of the water polygons (key: the waterway key)
 *   bridgeZones    [{ id, name, key, c: [x, z], axis, w, len, own }]  bridge crossings of the quay (waterways.js documents the fields)
 *   bridgeShades   [{ id, key, c, axis, w, len }]  decks the water shader darkens the water under
 *   clipLines      [['x' | 'z', value], ...]  axis-parallel clip lines of the data besides the borders of the EXTENT rectangles (an edge on one is no bank)
 *   farSources     names of the scenery rings the area draws beyond its data: 'neva-up' | 'neva-down' | 'neva-malaya'
 *   farCenter      [x, z] and farRadius: the window (a square of half-side farRadius) of the far scenery = the horizon ring of environment/far.js
 *   forcedBanks    [[x0, z0, x1, z1], ...]  data edges that are shore although a neighbouring ring touches them
 *   openMouths     [[x0, z0, x1, z1], ...]  segments across the mouth of a waterway that joins another: water on both sides, no bank
 *   dataWater      [{ id, key }]  records of the WATER (not RIVER) data that form a waterway of that key
 *   slopeReaches   [{ id, key, run, kerb, lip, test(x, z, nx, nz), rail(nx) }]  grass-slope banks (waterways.js SLOPE_REACHES documents the fields)
 */
export const WATER = {
  plugs: PLUGS,
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [],
  farSources: ['neva-up', 'neva-down', 'neva-malaya'],
  farCenter: [-2200, 300],              // the middle of the area (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [[-2460.8, -1097.5, -2460.7, -1098.7]],      // the 1.2 m corner edge of the Neva polygon beside the Palace Bridge plug
  openMouths: [],
  dataWater: [{ id: 'r1648982', key: 'nh-inner' }],      // the Kovsh basin of New Holland (a plain pond in the data) is a waterway of the inner canals
  slopeReaches: SLOPE_REACHES,
  // the RIVER records whose data key is null: the Kryukov Canal, the Admiralty and Novo-Admiralty canals round New Holland and the inner canals of the island (East, South)
  keyByName: { 'Крюков канал': 'kryukov', 'Адмиралтейский канал': 'admiralty', 'Ново-Адмиралтейский канал': 'admiralty', 'Восточный канал': 'nh-inner', 'Южный канал': 'nh-inner' },
};

// ---------------------------------------------------------------- PEOPLE (people.js DENSITY, people/zones.js)
/** the Nevsky corridor weight along the grid axis u (people/zones.js nevskyU): [[u, weight], ...] ascending in u (the east part: docs/research/people.md S3, the west: west-life-furniture.md 2.2) */
const PEOPLE_CORRIDOR = [[-3200, 0.9], [-2950, 1.3], [-2850, 1.7], [-2650, 2.0], [-2563, 2.3], [-2430, 2.2], [-2300, 1.9], [-2200, 2.2], [-2100, 2.2], [-2043, 2.6], [-1950, 2.0], [-1850, 2.1], [-1740, 2.0], [-1600, 1.5], [-1450, 1.0], [-1300, 0.7],
  [-1250, 0.55], [-1050, 0.8], [-880, 0.72], [-700, 0.95], [-500, 1.0], [-330, 1.15], [-100, 1.2], [60, 1.45], [200, 0.9]];

/** the hot spots of the zone weight field: [x, z, amplitude, sigma] (the west rows of the source's people/zones.js that lie in this territory, and the south-west block) */
const PEOPLE_HOT = [
  [-441, -93, 1.7, 52],           // the Anichkov Bridge and the Klodt plinths
  [-420, -30, 1.1, 40],           // the Fontanka embankment (north-east quay)
  [-1469, -285, 2.6, 36],         // S3 Kazan garden: the fountain rim, the white benches, pigeons
  [-1415, -285, 1.2, 20],         // S4 Kutuzov plinth (guides stop groups)
  [-1511, -315, 1.2, 20],         // S4 Barclay plinth
  [-1500, -235, 1.3, 40],         // the colonnade forecourt (the cathedral facade seen from Nevsky)
  [-1391, -331, 2.8, 28],         // S1 Kazan bridge: parapets, boats, photographers (~26 per 10 m)
  [-1374, -385, 1.0, 20],         // S2 the Kazan landing stage
  [-1420, -347, 1.6, 26],         // S5 Singer House kerb
  [-1768, -420, 1.8, 30],         // the Green Bridge / Moika pier S16
  [-1500, -470, 0.9, 34],         // S18 painters / caricaturists on the Griboedov embankment
  [-1919, -629, 2.3, 32],         // S6 the General Staff arch: buskers, costume characters
  [-1983, -738, 1.3, 34],         // S7 the Alexander Column ring
  [-2010, -740, 1.0, 95],         // the Palace Square sett field
  [-2096, -870, 1.4, 40],         // S9 the Winter Palace south front
  [-2097, -893, 1.5, 36],         // S8 the Hermitage courtyard queue
  [-2400, -830, 0.9, 30],         // S11 the Palace Bridge landing
  [-2440, -766, 1.2, 62],         // the Admiralty garden
  [-2335, -494, 1.6, 52],         // S12 the Alexander Garden fountain
  [-2480, -500, 0.7, 95],         // the Alexander Garden (9 ha)
  [-2449, -63, 2.0, 58],          // S13 St Isaac's garden and the monument rim
  [-2396, 35, 1.2, 40],           // the Nicholas I monument
  [-2745, -443, 1.4, 42],         // S14 Senate Square / the Bronze Horseman
  [-805, -86, 1.7, 52],           // S15 the Catherine garden: chess, artists at the monument
  [-1050, -215, 1.3, 30],         // S17 Gostiny Dvor metro stairs
  [-1000, -190, 1.9, 22], [-1058, -204, 2.0, 24], [-1115, -218, 1.9, 22],   // the open arcade of Gostiny Dvor (shoppers: the lattice runs through it)
  [-1008, -215, 0.8, 20],         // S19 excursion kiosks
  [-1100, -230, 0.8, 70],         // the Gostiny Dvor front promenade
  [-2029, -412, 1.4, 28],         // the Admiralteyskaya metro doors
  [-1352, -341, 1.2, 24],         // the Nevsky Prospekt / Gostiny Dvor canal exits at the Kazan bridge
  [-1170, -265, 0.8, 24],         // the Nevsky pits
  [-1905, -600, 1.5, 30], [-1895, -545, 1.9, 30], [-1888, -490, 1.9, 30], [-1884, -450, 1.6, 26],       // the pedestrian block of Bolshaya Morskaya to the General Staff arch (tents, buskers: 9 per 10 m)
  [-1545, -475, 0.6, 40], [-1700, -430, 0.9, 26], [-1620, -400, 0.9, 26],                              // Bolshaya Konyushennaya, the Griboedov / Moika banks
  [-2060, -950, 0.8, 50], [-2250, -960, 0.6, 60],                                                      // the Hermitage embankment, the Palace Embankment
  // ---- the PALACE BRIDGE (the first ~170 m of the 255 m deck lie in the play area, the pavements carry the 'k' chains of people/nav.js nav.longs)
  [-2345, -883, 0.45, 26], [-2366, -922, 0.05, 26], [-2380, -950, 0.1, 30], [-2412, -992, 0.12, 28],
  // ---- the SOUTH-WEST (docs/research/mariinsky.md S9, yusupov.md, new-holland.md S10, nikolsky.md): Teatralnaya Square, Yusupov Palace, New Holland, Nikolsky Cathedral
  [-3056, 740, 2.2, 22], [-3040, 735, 1.2, 35], [-3010, 730, 0.6, 60],           // the Mariinsky portico (the three doors, theatre-goers, bouquets), the square in front, Teatralnaya Square
  [-2970, 786, 1.5, 16], [-3026, 661, 1.2, 16], [-2993, 677, 1.0, 18], [-3150, 742, 0.9, 20],      // Glinka, Rimsky-Korsakov, the Conservatory north door (students), Mariinsky-2 terrace
  [-2954, 322, 2.0, 16], [-2975, 300, 1.0, 20], [-2900, 366, 0.9, 18], [-2930, 442, 0.8, 22], [-2921, 462, 0.7, 12],  // Yusupov: the portico queue, the quay opposite, the courtyard, the garden, the mound
  [-3440, 275, 1.6, 40], [-3405, 248, 1.0, 25], [-3398, 346, 1.6, 22], [-3443, 350, 1.3, 16],      // New Holland: the lawn bowl, the stage lawn, the Kovsh pier, the Frigate playground
  [-3548, 337, 1.4, 26], [-3480, 329, 1.0, 14], [-3505, 262, 0.7, 30], [-3392, 175, 1.0, 14], [-3395, 470, 1.2, 18], [-3330, 314, 0.8, 12],   // the Bottle terrace, the Kuznya cafe, the alley, the north gate, the Moika quay in front of the Arch, the east bridge
  [-2896, 1120, 1.8, 16], [-2926, 1131, 1.0, 14], [-2946, 1141, 1.4, 14], [-2878, 1068, 0.9, 14], [-2920, 1090, 0.5, 40], [-2935, 1085, 0.7, 10],   // Nikolsky: the west door, the avenue, the bell tower, the north gate, the garden, the Tsushima obelisk
  [-1746, 718, 0.7, 45], [-2017, 657, 0.5, 14],          // Sennaya Square (low density: a metro square in the middle of the side streets), the Sennoy footbridge
  [-2789, 613, 1.0, 12], [-3163, 693, 0.8, 14], [-3000, 560, 0.35, 60], [-3000, 930, 0.35, 60],          // the Lviny and Dekabristov bridges, the Moika / Kryukov embankments between the sights
];

// ---------------------------------------------------------------- WILDLIFE (wildlife/zones.js zoneTable, crowdTable, CROW_HAUNTS; wildlife.js)
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields), or has `at(ctx)` -> { x, z } | null
 *  instead of x / z: a position that is read from a landmark service of the area (the row is skipped when `at` gives nothing). */
const PIGEON_ZONES = [
  // ---- Gostiny Dvor / Ostrovsky: the pavement of the arcade (the front runs along Nevsky at grid v 36), the Catherine Garden round the monument
  { tag: 'gostiny', kind: 'pigeon', spread: 40, n: 2, w: 1.8, r: 4, name: 'Голуби у Гостиного двора · Pigeons at Gostiny Dvor',
    at: (ctx) => {                                                    // landmarksE frame: u metres west along Nevsky from the Anichkov Bridge (-441, -93), v south of the axis (rotation 13.77 deg)
      const g = ctx.services.landmarksE?.spots?.gdFront; if (!g) return null;
      const u = (g.u0 + g.u1) / 2, v = g.v + 2, C = 0.9713, S = 0.2379;
      return { x: -441 - C * u - S * v, z: -93 - S * u + C * v };
    } },
  { tag: 'catherine', kind: 'pigeon', spread: 20, n: 2, w: 2, name: 'Голуби в Екатерининском саду · Pigeons in the Catherine Garden',
    at: (ctx) => { const cm = ctx.services.landmarksE?.spots?.garden?.monument || [-800.5, -104.9]; return { x: cm[0], z: cm[1] }; } },
  // ---- Kazan: the round lawn with the fountain, the benches of the north row, the Voronikhin garden, the pavement under the colonnade side
  { tag: 'kazan', kind: 'pigeon', x: -1469, z: -279, spread: 26, n: 4, w: 3.4, r: 5.5, name: 'Голуби в Казанском сквере · Pigeons in the Kazan garden' },
  { tag: 'kazan-bench', kind: 'pigeon', spread: 6, n: 1, w: 2.2, r: 3.5, name: 'Голуби у скамеек Казанского сквера · Pigeons at the Kazan benches',
    at: (ctx) => { const bp = (ctx.services.landmarksF?.benchPoints || []).filter((p) => Number.isFinite(p.x)); return bp.length ? bp[Math.floor(bp.length / 3)] : null; } },
  { tag: 'voronikhin', kind: 'pigeon', spread: 14, n: 1, w: 1.2, name: 'Голуби в саду Воронихина · Pigeons in the Voronikhin garden',
    at: (ctx) => ctx.services.landmarksF?.crowd?.[3] || null },
  { tag: 'kazan-nevsky', kind: 'pigeon', x: -1450, z: -341, spread: 14, n: 1, w: 1.2, r: 4, name: 'Голуби на Невском у Казанского собора · Pigeons on Nevsky by the Kazan Cathedral' },
  // ---- Palace Square: a few on the setts round the Column and by the arch, the Winter Palace frontage
  { tag: 'column', kind: 'pigeon', spread: 30, n: 2, w: 1.7, r: 5, min: 11, name: 'Голуби у Александровской колонны · Pigeons at the Alexander Column',
    at: (ctx) => ctx.services.landmarksG?.spots?.column || { x: -1983, z: -738 } },
  { tag: 'arch', kind: 'pigeon', x: -1905, z: -640, spread: 14, n: 1, w: 1.0, r: 4, name: 'Голуби у арки Главного штаба · Pigeons by the General Staff arch' },
  { tag: 'winter-palace', kind: 'pigeon', spread: 14, n: 1, w: 0.9, r: 4, name: 'Голуби у Зимнего дворца · Pigeons at the Winter Palace',
    at: (ctx) => ctx.services.landmarksG?.spots?.carriages?.[0] || null },
  // ---- the Alexander Garden, Senate Square, St Isaac's Square
  { tag: 'alexander', kind: 'pigeon', x: -2335, z: -494, spread: 18, n: 3, w: 3.0, r: 5, name: 'Голуби в Александровском саду · Pigeons in the Alexander Garden' },
  { tag: 'senate', kind: 'pigeon', x: -2745, z: -444, spread: 22, n: 1, w: 1.0, r: 4, min: 14, name: 'Голуби на Сенатской площади · Pigeons on Senate Square' },
  { tag: 'isaac', kind: 'pigeon', x: -2449, z: -63, spread: 20, n: 3, w: 2.6, r: 5, name: 'Голуби в сквере у Исаакия · Pigeons in St Isaac\'s garden' },
  { tag: 'isaac-monument', kind: 'pigeon', x: -2396, z: 35, spread: 24, n: 1, w: 1.3, r: 4.5, min: 9, name: 'Голуби у памятника Николаю I · Pigeons at the Nicholas I monument' },
  // ---- sparrows: the gardens (the terraces are added by birds.js from the props module)
  { tag: 'kazan', kind: 'sparrow', x: -1481, z: -300, spread: 16, n: 1, w: 2, r: 3, name: 'Воробьи в Казанском сквере · Sparrows in the Kazan garden' },
  { tag: 'catherine', kind: 'sparrow', x: -790, z: -128, spread: 16, n: 1, w: 1.5, r: 3, name: 'Воробьи в Екатерининском саду · Sparrows in the Catherine Garden' },
  { tag: 'alexander', kind: 'sparrow', x: -2330, z: -520, spread: 16, n: 1, w: 2, r: 3, name: 'Воробьи в Александровском саду · Sparrows in the Alexander Garden' },
  { tag: 'isaac', kind: 'sparrow', x: -2440, z: -100, spread: 16, n: 1, w: 1.6, r: 3, name: 'Воробьи в сквере у Исаакия · Sparrows in St Isaac\'s garden' },
];
/** the districts a crow likes (the Alexander Garden limes, the Kazan and Isaac gardens): crows start on a tree top there when the player is not about. At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -2335, z: -500, r: 140 }, { x: -1469, z: -290, r: 90 }, { x: -2449, z: -63, r: 90 }, { x: -800, z: -105, r: 90 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] }; a pigeon zone whose tag is not listed gives no crowd */
const CROWDS = {
  column: [70, 70, 0.9], arch: [28, 40, 0.65], 'winter-palace': [45, 45, 0.65],
  kazan: [38, 55, 0.85], 'kazan-bench': [10, 25, 0.6], voronikhin: [18, 30, 0.5], 'kazan-nevsky': [22, 30, 0.6],
  gostiny: [60, 50, 0.7], catherine: [28, 35, 0.55], bridge: [22, 30, 0.6],      // 'bridge': the Anichkov Bridge pigeons of wildlife/birds.js
  alexander: [32, 45, 0.7], senate: [30, 40, 0.55], isaac: [38, 40, 0.6], 'isaac-monument': [24, 35, 0.5],
};

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it)
 *   pigeons        wildlife/zones.js zoneTable: the pigeon / sparrow zone rows (PIGEON_ZONES above)
 *   crowHaunts     wildlife/zones.js CROW_HAUNTS [{ x, z, r }]
 *   crowds         wildlife/zones.js crowdTable: { tag: [r, f, level] }
 *   fountains      wildlife.js: the positional 'fountain' loops [[x, z, volume], ...] (only those inside the play area play)
 *   peopleDensity  people.js DENSITY: { station, west, mars, garden } (the sub-tables are described there; an area without them gets the neutral ones)
 *   peopleCorridor people/zones.js: the Nevsky corridor weight [[u, weight], ...] (the corridor exists where the roads of NAMES.streets.nevsky do)
 *   peopleHot      people/zones.js: the hot spots of the zone weight field ([x, z, amplitude, sigma] | { u, d, a, s })
 *   tramLines      traffic/trams.js TRAM_LINES: [{ refs: [...], a: [x, z], b: [x, z], headway }] (the terminals are track ends; a line whose terminals are not in the data is skipped)
 *   clearDiscs     environment/field.js: [{ x, z, r }] discs that stay free of trunks, hedges and beds
 *   farCentres     environment/far.js: [{ x, z, bias }] centres of old dense stone city beyond the area: the far blocks within (distance + bias) of one are as dense as those near the area's own centre
 */
export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [[-1469, -279, 0.8], [-2335, -494, 0.8]],      // the Kazan garden fountain, the Alexander Garden fountain
  peopleDensity: {
    // the WEST (Gostiny Dvor - the Admiralty; people/west.js): `scale` multiplies the counts of the scripted places (Kazan, Palace Square, the gardens, the bridges ...). The population total targets 1000-1400.
    west: { scale: 0.55, platforms: 0.75 },
  },
  peopleCorridor: PEOPLE_CORRIDOR,
  peopleHot: PEOPLE_HOT,
  tramLines: [],
  clearDiscs: [],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre reaches the Admiralty and over the Neva (Vasilievsky, Petrograd side): dense stone blocks there too
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station; this territory does not contain it, so it holds ONE car, the purple Zhiguli (`lada`), at its spawn.
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east) } }  a car without a pose is not built
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 */
export const GARAGE = {
  poses: {
    lada: { x: -2330, z: -470, yaw: 99 * DEG },
  },
  spawn: { x: -2330, z: -470, yaw: 99 * DEG },
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = ['city', 'landmarksC', 'landmarksD', 'landmarksMariinsky', 'landmarksNikolsky', 'landmarksNewHolland', 'landmarksYusupov'];
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent) */
export const HOOKS = makeHooks(MODULES);      // the hook set of src/areas/north/hooks.js gated by the module list: none of its modules is in this list, so it is inert here
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9): the hook set gated by MODULES, see src/areas/north/hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list

// ---------------------------------------------------------------- the places of the OTHER areas (docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name (a pick asks the gate question and the hand-off lands at this pose). Empty: the edge gates between the live areas are added by the
 * integration step (docs/AREAS.md 15.2), and so are the rows. Not read by any world module.
 */
export const CROSS_PLACES = [];
