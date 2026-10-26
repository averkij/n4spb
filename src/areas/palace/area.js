// ============================================================================
//  AREA DEFINITION - Palace-Liteyny (Дворцовый-Литейный; docs/AREAS.md section 13): the first area of the world map (maps/intro-draft.html, area 98), the merge of the Dvortsovy and Liteyny municipal districts with
//  their walkable overlaps: the Hermitage and the Winter Palace, Palace Square, the Spilled Blood church, the Russian Museum, the Engineers' Castle and the Summer Garden, Nevsky Prospekt from the Admiralty to
//  Vosstaniya Square and the Moscow station, Liteyny Prospekt with Dom Muruzi and the Transfiguration Cathedral. 5.0 km2 of play rectangles (src/areas/registry.js REGISTRY.palace.play, cut from the map outline by
//  tools/area-shape.mjs), the data cut straight from the source project by tools/area-data-cut.mjs.
//  It starts from the strip's area module (src/world/area.js, now the PARKED area 'strip'): the landmark modules whose sights lie in this territory are listed in MODULES with their claims in GROUPS; the modules of
//  the sights that lie outside (St Isaac's, the Admiralty and the Senate, the Vladimirsky cathedral, the metro network, ...) are not built here but stay in src/world for the neighbour areas.
//  index.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
// ============================================================================
import { GROUPS_LIST as G_NORTHFULL } from '../../world/landmarksNorthFull/groups.js';
import { GROUPS_LIST as G_BELINSKY_NORTH } from '../../world/landmarksBelinskyNorth/groups.js';
import { GROUPS_LIST as G_MARS } from '../../world/landmarksMars/groups.js';
import { GROUPS_LIST as G_E } from '../../world/landmarksE/groups.js';
import { GROUPS_LIST as G_F } from '../../world/landmarksF/groups.js';
import { GROUPS_LIST as G_G } from '../../world/landmarksG/groups.js';
import { GROUPS_LIST as G_I } from '../../world/landmarksI/groups.js';
import { GROUPS_LIST as G_K } from '../../world/landmarksK/groups.js';
import { GROUPS_LIST as G_BELINSKY } from '../../world/landmarksBelinsky/groups.js';
import { GROUPS_LIST as G_BR } from '../../world/bridges/groups.js';
import { GROUPS_PAL } from '../../world/bridges/groups-pal.js';
import { GROUPS_LIST as G_CASTLE } from '../../world/landmarksCastle/groups.js';
import { LIBRARY_GROUP } from '../../world/landmarksD/groups.js';
import { GROUPS_LIST as G_NORTHBRIDGES } from '../../world/northBridges/groups.js';
import { GROUPS_LIST as G_GARDEN, GARDEN_RING } from '../../world/landmarksGarden/groups.js';
import { GROUPS_LIST as G_TROITSKY } from '../../world/landmarksTroitsky/groups.js';

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'palace';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/palace/';
/** The start page of the app: a missing or stale bake is an error card, never a minutes-long procedural build. */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). The sights of the neighbours are not built: no metro network (the surface rotunda of Vosstaniya is a generic building), no
 *  St Isaac's / Admiralty / Senate (landmarksH, landmarksJ: the Admiralty district), no Tauride / Smolny / Suvorov / Kirochnaya / Oktyabrsky (Smolninskoye). tools/modules-list.mjs parses this list: one quoted name per line. */
export const MODULES = [
  'environment',  // ground, embankment granite, Fontanka / Moika / Neva water, trees, lawns, flowerbeds, far skyline
  'landmarksNorthFull', // Dom Muruzi, the Transfiguration Cathedral, the Chernyshevskaya vestibule, the Podpisnye Izdaniya bookstore and the corridor houses
  'landmarksBelinskyNorth', // the church of Simeon and Anna (Mokhovaya 48)
  'northBridges', // the Liteyny Bridge over the Neva (the raised deck; the Bolsheokhtinsky Bridge of the module lies in Smolninskoye); before streets / city, it claims the bridge ways
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'rail',         // Moscow Railway Station tracks, platforms, canopies, catenary, signals, trains
  'landmarksA',   // Moscow Railway Station building + clock tower + Vosstaniya Square (obelisk, hotel Oktyabrskaya)
  'landmarksB',   // Nevsky Prospekt landmarks between Vosstaniya Square and Fontanka
  'landmarksC',   // Fontanka embankment, Anichkov Bridge + horse tamers, palaces, boats
  'landmarksD',   // the National Library and the Mariinsky hospital block (the 'library' sub-group only)
  'landmarksE',   // Gostiny Dvor, Ostrovsky Square, Alexandrinsky Theatre, Rossi Street, Anichkov Palace
  'landmarksF',   // Kazan Cathedral + square, Singer House
  'landmarksG',   // Palace Square: Winter Palace, General Staff, Alexander Column
  'landmarksI',   // Winter Palace + Hermitage
  'landmarksBelinsky', // Ciniselli Circus
  'landmarksK',   // Church of the Saviour on Blood, Mikhailovsky Garden, Russian Museum
  'landmarksGarden', // Summer Garden: the Neva and Moika fences, alleys, ponds, statues, the Summer Palace of Peter I, the Coffee and Tea Houses
  'landmarksMars', // Mars Field, Memorial to the Fighters of the Revolution (Eternal Flame), Suvorov monument, Marble Palace, Saltykov / Betsky houses, Pavlovsky Barracks
  'landmarksCastle', // Engineering (Mikhailovsky) Castle and the Peter I monument
  'bridges',      // the bridges of the area: Kazansky, Green, Palace, Hermitage, the Winter Canal and the Swan Canal bridges ...
  'landmarksTroitsky', // the Troitsky Bridge over the Neva (554 m) with its opening bascule leaf; after streets (the NPC stop lines) and bridges (its deckY wraps theirs), before traffic / people (they read it)
  'landmarksPalaceBridge', // the Palace Bridge's two opening bascule leaves (docs/AREAS.md 13.10): `bridges` leaves the central span to it; after streets (the NPC stop lines) and bridges, before traffic / people
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, tourists, groups with guides, station crowd, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the cars at the Moscow station (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksNorthFull: 'Чернышевская, Спасо-Преображенский собор, дом Мурузи',
  landmarksBelinskyNorth: 'церковь Симеона и Анны',
  northBridges: 'Литейный мост',
  landmarksTroitsky: 'Троицкий мост · разводной пролёт',
  landmarksPalaceBridge: 'Дворцовый мост · разводные пролёты',
  landmarksD: 'Национальная библиотека',
  landmarksGarden: 'Летний сад · ограда',
  landmarksMars: 'Марсово поле, Мраморный дворец, памятник Суворову',
  drive: 'машины у Московского вокзала',
};

export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: {
    nevsky: 'Невский проспект', ligovsky: 'Лиговский проспект', mayakovskogo: 'улица Маяковского', marata: 'улица Марата', vladimirsky: 'Владимирский проспект',
    liteyny: 'Литейный проспект', fontanka: 'набережная реки Фонтанки', zhukovskogo: 'улица Жуковского', pushkinskaya: 'Пушкинская улица', vosstaniya: 'улица Восстания',
    goncharnaya: 'Гончарная улица', suvorovsky: 'Суворовский проспект', kuznechny: 'Кузнечный переулок', kolokolnaya: 'Колокольная улица', rubinsteina: 'улица Рубинштейна',
    zagorodny: 'Загородный проспект', razyezzhaya: 'Разъезжая улица', stremyannaya: 'Стремянная улица', bolshayaMoskovskaya: 'Большая Московская улица',
    // ---- the western extension (names exactly as in OSM, ROADS[].name)
    sadovaya: 'Садовая улица', malayaSadovaya: 'Малая Садовая улица', gorokhovaya: 'Гороховая улица', bolshayaMorskaya: 'Большая Морская улица', malayaMorskaya: 'Малая Морская улица',
    bolshayaKonyushennaya: 'Большая Конюшенная улица', malayaKonyushennaya: 'Малая Конюшенная улица', admiralteysky: 'Адмиралтейский проспект', voznesensky: 'Вознесенский проспект',
    moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова', dvortsovayaNab: 'Дворцовая набережная', admiralteyskayaNab: 'Адмиралтейская набережная',
    angliyskayaNab: 'Английская набережная', universitetskayaNab: 'Университетская набережная', winterCanalNab: 'набережная Зимней канавки', swanCanalNab: 'набережная Лебяжьей канавки',
    millionnaya: 'Миллионная улица', dvortsovyProezd: 'Дворцовый проезд', konnogvardeysky: 'Конногвардейский бульвар', pochtamtskaya: 'Почтамтская улица',
    kazanskaya: 'Казанская улица', inzhenernaya: 'Инженерная улица', italyanskaya: 'Итальянская улица', mikhailovskaya: 'Михайловская улица', bankovsky: 'Банковский переулок',
    tsaritsynsky: 'Царицынский проезд', yakubovicha: 'улица Якубовича', galernaya: 'Галерная улица',
    // ---- the Liteyny half (names exactly as in OSM, ROADS[].name; the keys of src/areas/north/area.js NAMES.streets, plus the streets of the Neva bank and the Mars Field)
    shpalernaya: 'Шпалерная улица', kirochnaya: 'Кирочная улица', voskresenskayaNab: 'Воскресенская набережная', furshtatskaya: 'Фурштатская улица', nekrasova: 'улица Некрасова',
    zakharyevskaya: 'Захарьевская улица', chaikovskogo: 'улица Чайковского', chernyshevskogo: 'проспект Чернышевского', kutuzovaNab: 'набережная Кутузова', mokhovaya: 'Моховая улица',
    pestelya: 'улица Пестеля', baskov: 'Басков переулок', radishcheva: 'улица Радищева', ryleeva: 'улица Рылеева', chekhova: 'улица Чехова', korolenko: 'улица Короленко',
    petrovskayaNab: 'Петровская набережная', gagarinskaya: 'Гагаринская улица', klenovaya: 'Кленовая улица', salny: 'Соляной переулок',
    karavannaya: 'Караванная улица', kovensky: 'Ковенский переулок', marsovoPole: 'Марсово поле', suvorovskayaSq: 'Суворовская площадь', preobrazhenskayaSq: 'Преображенская площадь',
    liteyniBridge: 'Литейный мост', troitskyBridge: 'Троицкий мост',
    // squares
    dvortsovayaSq: 'Дворцовая площадь', isaakievskayaSq: 'Исаакиевская площадь', senatskayaSq: 'Сенатская площадь', ostrovskogoSq: 'площадь Островского', konyushennayaSq: 'Конюшенная площадь',
    iskusstvSq: 'площадь Искусств', birzhevayaSq: 'Биржевая площадь', kazanskayaSq: 'Казанская площадь',
  },
};

// ---------------------------------------------------------------- the local frames: anchors of the strip (Vosstaniya Square, the obelisk, the Moscow station)
/** Vosstaniya Square: the paved square w638352776 (centre 589, 173); the Hero City obelisk (36 m) stands at (592, 165) on an island between the two Nevsky carriageways. */
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
/** Moscow Railway Station: faces NNW (facade normal bearing ~348 deg) onto the square with the obelisk on its axis; the tracks run SSE (bearing ~167 deg). Clock tower base (602, 246). */
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

// ---------------------------------------------------------------- landmark groups
// The generic `city` module builds every building that no specialist claims. A specialist MODULE (landmarksA / B / C / D / metro) owns a list of named
// SUB-GROUPS. A sub-group claims building ids (`ids`, plus every part whose `parent` is one of them) and non-building OSM ids (`osm`: paving, bridge decks,
// monuments) that the owner draws itself. A claim only takes effect when the owner module says so: it exports `OWNS_GROUPS = true` (every sub-group) or
// `['station', ...]` (only those); until then `city` / `environment` / `streets` still draw the claimed objects as a blockout (see lib/claims.js).
// `ids` come from docs/research/osm-landmarks.md and docs/reference/landmarks.json.
export const GROUPS = {
  // ---- landmarksA: the Moscow Railway Station building + Vosstaniya Square (the first milestone) -------------------------------------
  landmarksA: [
    { key: 'station', name: 'Московский вокзал', nameEn: 'Moscow Railway Station (Thon, 1851)', ids: ['r2404499', 'r2404500', 'r2404501', 'w662697923', 'w662697920', 'w433164092', 'w595741909'], osm: ['n21596808'], at: [612, 300],
      note: 'main building r2404499 (hidden outline, parts r16492034..39), wings r2404500 / r2404501, canopy w662697923, ticket halls; clock tower base r16492039 (docs/research/station.md). Platforms / tracks / canopies over them belong to the `rail` module.' },
    { key: 'square', name: 'площадь Восстания', nameEn: 'Vosstaniya Square (obelisk "Hero City Leningrad")', ids: ['w1214651508', 'w353314781', 'w1215662501'], osm: ['w638352776'], at: [589, 173],
      note: '36 m obelisk w1214651508 on the island between the Nevsky carriageways, tourist bureau pavilion, kiosk, the paved square w638352776' },
    { key: 'galereya', name: 'ТРЦ «Галерея»', nameEn: 'Galereya shopping mall (Ligovsky 30)', ids: ['r8522850'], osm: [], at: [525, 562],
      note: 'big modern mall on Ligovsky pr. 30 south-west of the station, 5 levels, ~33000 m2 (OSM r8522850, parts if any): glazed / clad facades, entrance rotundas, big wordmark, atrium; research it from Commons photos' },
    { key: 'oktyabrskaya', name: 'Гостиница «Октябрьская» и угловые дома площади', nameEn: 'Hotel Oktyabrskaya and the corner buildings of the square', ids: ['r1598177', 'r1588277', 'w507867255'], osm: [], at: [648, -1],
      note: 'Ligovsky 10/118 (6 levels, 7976 m2) at the Nevsky / Ligovsky corner opposite the station, the Ligovsky wing (Best Western) and the Cosmos hotel (Goncharnaya 4)' },
  ],
  // ---- landmarksB: Nevsky Prospekt landmarks between Vosstaniya Square and the Liteyny crossroads ----------------------------------
  landmarksB: [
    { key: 'nevsky-centre', name: 'ТЦ «Невский Центр»', nameEn: 'Nevsky Centre (Nevsky 114-116)', ids: ['r1784115'], osm: [], at: [443, 39], note: 'shopping centre at Ligovsky, 6 levels' },
    { key: 'atrium', name: 'Невский Атриум · вход в метро «Маяковская»', nameEn: 'Nevsky Atrium (house 71, Mayakovskaya entrance)', ids: ['r15081493'], osm: [], at: [194, 122], note: 'Marata 1/71; the metro entrances n4060185664 / n1109163128 lie inside it: the arched openings at Nevsky 71 (docs/research/nevsky.md)' },
    { key: 'yusupova', name: 'Дом Юсуповой · Дом Меняевых', nameEn: 'Yusupova house (Nevsky 84-86), Menyaev house (90-92)', ids: ['w60196034', 'w98396422', 'w60195756', 'w103591279'], osm: [], at: [0, -30], note: 'yellow Ionic portico house 84-86; Bruni house 90-92 (1866-67)' },
    { key: 'nevsky-corner', name: 'Угловые дома Невского', nameEn: 'Other Nevsky landmark corners (Dom Kozhevnikova, Mayakovskogo, Vladimirsky crossroads)', ids: ['r3323319', 'w113458823', 'r936116', 'w60195636', 'w60195635', 'w60195639', 'w245953204', 'r442684', 'w52016434'], osm: [], at: [-130, 39], note: 'see docs/research/nevsky.md block table for more candidates the specialist may add' },
  ],
  // ---- landmarksC: the Fontanka embankment, Anichkov Bridge, the palaces at the west edge ----------------------------------------------
  landmarksC: [
    { key: 'anichkov-bridge', name: 'Аничков мост', nameEn: 'Anichkov Bridge + Klodt horse tamers', ids: [], osm: ['r5537267', 'w372394912', 'w372394928'], at: [-441, -93], note: 'three-arch pink-granite bridge 54.6 x 37.9 m, four bronze groups on the corners (docs/research/fontanka.md)' },
    { key: 'beloselsky', name: 'Дворец Белосельских-Белозерских', nameEn: 'Beloselsky-Belozersky Palace', ids: ['r1588865'], osm: [], at: [-374, -30], note: 'Nevsky 41, coral-pink neo-baroque at the south-east corner of the bridge' },
    { key: 'fontanka-bank', name: 'Набережная Фонтанки', nameEn: 'Fontanka embankment buildings', ids: ['w28962563', 'w47457765'], osm: [], at: [-540, 60], note: 'Fontanka 33 (SDYUSSHOR-1) and Fontanka 50 (Grebyonka); the granite walls themselves are drawn by environment' },
  ],
  // ---- landmarksD: sights in the north and the south of the map -----------------------------------------------------------------------
  landmarksD: [
    LIBRARY_GROUP,      // landmarksD/groups.js: the one sub-group of the module that lies in this area (Vladimirsky, Tolstoy House and Dostoevskaya are south of it: the module builds only the claimed sub-groups)
  ],
};
// the specialist modules of the strip: each one owns the pure-data groups.js of its module
GROUPS.landmarksBelinsky = G_BELINSKY;      // Ciniselli Circus
GROUPS.landmarksE = G_E; GROUPS.landmarksF = G_F; GROUPS.landmarksG = G_G; GROUPS.landmarksI = G_I; GROUPS.landmarksK = G_K; GROUPS.landmarksCastle = G_CASTLE;
// the bridges: only the ones whose OSM ways are in the data of this area (the Blue, Red, Pochtamtsky, Fonarny, Kamenny and Mucny bridges lie south-west of it: they stay in the strip's table)
GROUPS.bridges = G_BR.filter((b) => !['blue', 'red', 'pochtamtsky', 'fonarny', 'kamenny', 'mucny'].includes(b.key)).concat(GROUPS_PAL);      // + the Prachechny, Upper Swan and 2nd Engineer bridges (bridges/groups-pal.js, docs/AREAS.md 15.z)
// Liteyny: the Chernyshevskaya vestibule, the Transfiguration Cathedral, Dom Muruzi, the Podpisnye Izdaniya bookstore and the corridor houses (they replace the strip's landmarksNorth, same ids), the church of Simeon and Anna
GROUPS.northBridges = G_NORTHBRIDGES.filter((g) => g.osm.length);      // only the sub-groups with mapped ways in THIS data: 'north-liteyny' (the Liteyny Bridge deck, x -123 .. -77, z -1972 .. -2356)
GROUPS.landmarksNorthFull = G_NORTHFULL; GROUPS.landmarksBelinskyNorth = G_BELINSKY_NORTH;
// the Summer Garden (landmarksGarden, OWNS_GROUPS = true: the module draws all five sub-groups from its own pure-data lists, it is not group-aware): the Neva fence, the Moika fence, the garden (359 OSM ids), the Summer
// Palace of Peter I with the gate booths, the Coffee / Tea Houses and the pavilions. Every id is in this area's data and every vertex of the garden relation r2653740 lies inside the data extent (the garden ring x -1059 .. -751,
// z -1695 .. -1015; 94 % of it is in the play rectangles, the rest is the 80 m cell notch round the Moika gate (x -880 .. -800, z -1120 .. -1040) and the strip x -790 .. -770, z -1490 .. -1370).
GROUPS.landmarksGarden = G_GARDEN;
// the Mars Field (the Field, the Eternal Flame memorial, Suvorov Square, the Marble Palace with the Saltykov / Betsky houses, the Adamini house, the Pavlovsky Barracks): all six sub-groups lie in this territory and in its data
GROUPS.landmarksMars = G_MARS;
// the Troitsky Bridge (landmarksTroitsky, OWNS_GROUPS = true): the 554 m bridge over the Neva with its opening leaf, all seven OSM ways of it lie in this territory and in this data (the whole deck is inside the play rectangles up to the north abutment)
GROUPS.landmarksTroitsky = G_TROITSKY;

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist } = h;
  return [
  _deck('Дворцовый мост · Palace Bridge', [-2344.2, -871.2], [-2495.5, -1075.8], 32),
  { name: 'Михайловский замок · Mikhailovsky (Engineers) Castle', c: [-735, -790], r: 130 },
  { name: 'Подписные Издания · Bookshop', c: [-201,-222], r: 40 },
  { name: 'Дом Мурузи · Dom Muruzi', c: [-95, -1125], r: 36 },
  { name: 'Спасо-Преображенский собор · Transfiguration Cathedral', c: [66, -1182], r: 75 },
  { name: 'Чернышевская · Chernyshevskaya', c: [467, -1351], r: 55 },
  { name: 'Аничков мост · Anichkov Bridge', c: [-441, -93], r: 42 },
  { name: 'Обелиск «Городу-герою Ленинграду» · Hero City obelisk', c: [592, 165], r: 24 },
  ..._groupPolys(SUBGROUPS.station, 12).map((r) => ({ name: 'Московский вокзал · Moscow Railway Station', ...r })),
  { name: 'Платформы Московского вокзала · Station platforms', x0: 560, x1: 780, z0: 420, z1: 1100 },
  ..._sqPolys.map((o) => ({ name: 'Площадь Восстания · Vosstaniya Square', poly: o })),
  ..._groupPolys(SUBGROUPS.oktyabrskaya, 8).map((r) => ({ name: 'Гостиница «Октябрьская» · Hotel Oktyabrskaya', ...r })),
  ..._groupPolys(SUBGROUPS['nevsky-centre'], 6).map((r) => ({ name: 'Невский Центр · Nevsky Centre', ...r })),
  ..._groupPolys(SUBGROUPS.beloselsky, 8).map((r) => ({ name: 'Дворец Белосельских-Белозерских · Beloselsky-Belozersky Palace', ...r })),
  ..._groupPolys(SUBGROUPS.anichkov, 10).map((r) => ({ name: 'Аничков дворец · Anichkov Palace', ...r })),
  ..._groupPolys(SUBGROUPS.library, 6).map((r) => ({ name: 'Российская национальная библиотека · National Library', ...r })),
  // ---- the west of the territory: sights (outline of the named OSM building + margin; the circle is the fallback when OSM has no such outline), squares, waterways, streets.
  // The areas find the buildings by their OSM names.
  ..._named(/Казанский собор/i, 14, { c: [-1568, -186], r: 90 }).map((r) => ({ name: 'Казанский собор · Kazan Cathedral', ...r })),
  ..._named(/Дом Зингера|Дом книги/i, 8, { c: [-1420, -383], r: 32 }).map((r) => ({ name: 'Дом Зингера · Singer House', ...r })),
  ..._named(/Гостиный двор/i, 8, null).map((r) => ({ name: 'Гостиный Двор · Gostiny Dvor', ...r })),
  ..._named(/Александринск/i, 8, null).map((r) => ({ name: 'Александринский театр · Alexandrinsky Theatre', ...r })),
  ..._named(/Строгановск/i, 8, null).map((r) => ({ name: 'Строгановский дворец · Stroganov Palace', ...r })),
  ..._named(/Спас на Крови|Воскресения Христова/i, 12, { c: [-1265, -854], r: 60 }).map((r) => ({ name: 'Спас на Крови · Church of the Saviour on Blood', ...r })),
  ..._named(/Михайловский замок|Инженерный замок/i, 10, null).map((r) => ({ name: 'Михайловский замок · Mikhailovsky (Engineers) Castle', ...r })),
  ..._named(/(?<![\p{L}-])Михайловский дворец|Русский музей/iu, 10, null).map((r) => ({ name: 'Михайловский дворец · Mikhailovsky Palace (Russian Museum)', ...r })),
  { name: 'Михайловский сад · Mikhailovsky Garden', c: [-1020, -830], r: 130 },       // after the Saviour church, the castle and the museum above (those outlines win where they overlap)
  ..._named(/Летний дворец/i, 10, { c: [-849, -1650], r: 30 }).map((r) => ({ name: 'Летний дворец Петра I · Summer Palace of Peter I', ...r })),
  { name: 'Летний сад · Summer Garden', poly: GARDEN_RING.flat(), margin: 6 },     // the Summer Garden: the palace first, then the outline of the garden relation (before the water rows below: the Moika and the Neva fences stand on its edge)
  ..._named(/Адмиралтейство|Главное адмиралтейство/i, 12, { c: [-2433, -622], r: 150 }).map((r) => ({ name: 'Адмиралтейство · Admiralty', ...r })),
  { name: 'Александровский сад · Alexander Garden', c: [-2400, -490], r: 105 },       // the view Shift + 7 stands in the garden (the Admiralty circle above is only the fallback when OSM has no outline, so the garden comes second)
  ..._named(/Зимний дворец/i, 10, { c: [-2096, -896], r: 110 }).map((r) => ({ name: 'Зимний дворец · Winter Palace', ...r })),
  ..._named(/Эрмитажный театр/i, 8, { c: [-1862, -1138], r: 50 }).map((r) => ({ name: 'Эрмитажный театр · Hermitage Theatre', ...r })),
  ..._named(/Эрмитаж/i, 8, null).map((r) => ({ name: 'Эрмитаж · The Hermitage', ...r })),
  ..._named(/Главный штаб|Здание Главного штаба/i, 10, null).map((r) => ({ name: 'Здание Главного штаба · General Staff Building', ...r })),
  ..._named(/Штаб Гвардейского корпуса/i, 10, null).map((r) => ({ name: 'Штаб Гвардейского корпуса · Guards Corps Headquarters', ...r })),
  { name: 'Александровская колонна · Alexander Column', c: [-1983, -738], r: 30 },
  ..._named(/Мариинский дворец/i, 10, null).map((r) => ({ name: 'Мариинский дворец · Mariinsky Palace', ...r })),
  ..._areaPolys(/Дворцовая площадь/).map((o) => ({ name: 'Дворцовая площадь · Palace Square', poly: o, margin: 6 })),
  ..._areaPolys(/Казанская площадь/).map((o) => ({ name: 'Казанская площадь · Kazan Square', poly: o, margin: 6 })),
  ..._areaPolys(/площадь Островского/).map((o) => ({ name: 'Площадь Островского · Ostrovsky Square', poly: o, margin: 6 })),
  { name: 'Дворцовая площадь · Palace Square', c: [-2000, -740], r: 120 },
  { name: 'Казанская площадь · Kazan Square', c: [-1568, -250], r: 90 },
  { name: 'Зимняя канавка · Winter Canal', x0: -1950, x1: -1700, z0: -1180, z1: -880, test: (x, z) => _shoreOf(['winter-canal'], x, z) < 14 },
  { name: 'Мойка · Moika River', x0: -3020, x1: -720, z0: -1180, z1: 340, test: (x, z) => _shoreOf(['moika'], x, z) < 16 },
  { name: 'Канал Грибоедова · Griboedov Canal', x0: -1880, x1: -1180, z0: -1180, z1: 340, test: (x, z) => _shoreOf(['griboedov'], x, z) < 14 },
  { name: 'Лебяжья канавка · Swan Canal', x0: -1100, x1: -420, z0: -1300, z1: -900, test: (x, z) => _shoreOf(['swan-canal'], x, z) < 12 },
  { name: 'Фонтанка · Fontanka River', x0: -830, x1: -330, z0: -1700, z1: 330, test: (x, z) => shoreDist(x, z) < 14 },       // down to the mouth at the Neva (the reach x -825 .. -725, z -1685 .. -1095 is Fontanka water)
  // the Neva after the canals (they win where their water meets it) and after the sights; the box is the whole river of the territory, from the Palace Embankment to the Liteyny Bridge and beyond (the bridge decks first)
  { name: 'Литейный мост · Liteyny Bridge', road: NAMES.streets.liteyniBridge },
  { name: 'Троицкий мост · Troitsky Bridge', road: NAMES.streets.troitskyBridge },
  { name: 'Нева · Neva River', x0: -3020, x1: 900, z0: -2400, z1: -300, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Невский проспект · Nevsky Prospekt', road: NAMES.streets.nevsky },
  { name: 'Лиговский проспект · Ligovsky Prospekt', road: NAMES.streets.ligovsky },
  { name: 'Улица Маяковского · Ulitsa Mayakovskogo', road: NAMES.streets.mayakovskogo },
  { name: 'Улица Марата · Ulitsa Marata', road: NAMES.streets.marata },
  { name: 'Владимирский проспект · Vladimirsky Prospekt', road: NAMES.streets.vladimirsky },
  { name: 'Литейный проспект · Liteyny Prospekt', road: NAMES.streets.liteyny },
  { name: 'Набережная реки Фонтанки · Fontanka embankment', road: NAMES.streets.fontanka },
  { name: 'Улица Жуковского · Ulitsa Zhukovskogo', road: NAMES.streets.zhukovskogo },
  { name: 'Пушкинская улица · Pushkinskaya ulitsa', road: NAMES.streets.pushkinskaya },
  { name: 'Улица Восстания · Ulitsa Vosstaniya', road: NAMES.streets.vosstaniya },
  { name: 'Гончарная улица · Goncharnaya ulitsa', road: NAMES.streets.goncharnaya },
  { name: 'Суворовский проспект · Suvorovsky Prospekt', road: NAMES.streets.suvorovsky },
  { name: 'Улица Рубинштейна · Ulitsa Rubinshteyna', road: NAMES.streets.rubinsteina },
  { name: 'Стремянная улица · Stremyannaya ulitsa', road: NAMES.streets.stremyannaya },
  { name: 'Дворцовая набережная · Palace Embankment', road: NAMES.streets.dvortsovayaNab },
  { name: 'Адмиралтейская набережная · Admiralty Embankment', road: NAMES.streets.admiralteyskayaNab },
  { name: 'Набережная Зимней канавки · Winter Canal embankment', road: NAMES.streets.winterCanalNab },
  { name: 'Набережная Лебяжьей канавки · Swan Canal embankment', road: NAMES.streets.swanCanalNab },
  { name: 'Набережная реки Мойки · Moika embankment', road: NAMES.streets.moika },
  { name: 'Набережная канала Грибоедова · Griboedov Canal embankment', road: NAMES.streets.griboedov },
  { name: 'Дворцовый проезд · Dvortsovy Proyezd', road: NAMES.streets.dvortsovyProezd },
  { name: 'Адмиралтейский проспект · Admiralteysky Prospekt', road: NAMES.streets.admiralteysky },
  { name: 'Садовая улица · Sadovaya ulitsa', road: NAMES.streets.sadovaya },
  { name: 'Малая Садовая улица · Malaya Sadovaya ulitsa', road: NAMES.streets.malayaSadovaya },
  { name: 'Гороховая улица · Gorokhovaya ulitsa', road: NAMES.streets.gorokhovaya },
  { name: 'Большая Морская улица · Bolshaya Morskaya ulitsa', road: NAMES.streets.bolshayaMorskaya },
  { name: 'Малая Морская улица · Malaya Morskaya ulitsa', road: NAMES.streets.malayaMorskaya },
  { name: 'Большая Конюшенная улица · Bolshaya Konyushennaya ulitsa', road: NAMES.streets.bolshayaKonyushennaya },
  { name: 'Малая Конюшенная улица · Malaya Konyushennaya ulitsa', road: NAMES.streets.malayaKonyushennaya },
  { name: 'Миллионная улица · Millionnaya ulitsa', road: NAMES.streets.millionnaya },
  { name: 'Казанская улица · Kazanskaya ulitsa', road: NAMES.streets.kazanskaya },
  { name: 'Инженерная улица · Inzhenernaya ulitsa', road: NAMES.streets.inzhenernaya },
  { name: 'Итальянская улица · Italyanskaya ulitsa', road: NAMES.streets.italyanskaya },
  { name: 'Михайловская улица · Mikhailovskaya ulitsa', road: NAMES.streets.mikhailovskaya },
  { name: 'Царицынский проезд · Tsaritsynsky Proyezd', road: NAMES.streets.tsaritsynsky },
  { name: 'Дворцовая площадь · Palace Square', road: NAMES.streets.dvortsovayaSq },
  { name: 'Площадь Островского · Ostrovsky Square', road: NAMES.streets.ostrovskogoSq },
  { name: 'Конюшенная площадь · Konyushennaya Square', road: NAMES.streets.konyushennayaSq },
  { name: 'Площадь Искусств · Arts Square', road: NAMES.streets.iskusstvSq },
  { name: 'Биржевая площадь · Birzhevaya Square', road: NAMES.streets.birzhevayaSq },
  { name: 'Казанская площадь · Kazan Square', road: NAMES.streets.kazanskayaSq },
  { name: 'Университетская набережная · Universitetskaya embankment', road: 'Университетская набережная' },
  // ---- the Liteyny half (north of Nevsky, east of the Fontanka): the streets of the districts between the Mars Field and the Neva embankment, by length inside the play rectangles
  { name: 'Шпалерная улица · Shpalernaya ulitsa', road: NAMES.streets.shpalernaya },
  { name: 'Фурштатская улица · Furshtatskaya ulitsa', road: NAMES.streets.furshtatskaya },
  { name: 'Кирочная улица · Kirochnaya ulitsa', road: NAMES.streets.kirochnaya },
  { name: 'Проспект Чернышевского · Prospekt Chernyshevskogo', road: NAMES.streets.chernyshevskogo },
  { name: 'Улица Чайковского · Ulitsa Chaikovskogo', road: NAMES.streets.chaikovskogo },
  { name: 'Захарьевская улица · Zakharyevskaya ulitsa', road: NAMES.streets.zakharyevskaya },
  { name: 'Набережная Кутузова · Kutuzov embankment', road: NAMES.streets.kutuzovaNab },
  { name: 'Воскресенская набережная · Voskresenskaya embankment', road: NAMES.streets.voskresenskayaNab },
  { name: 'Улица Некрасова · Ulitsa Nekrasova', road: NAMES.streets.nekrasova },
  { name: 'Моховая улица · Mokhovaya ulitsa', road: NAMES.streets.mokhovaya },
  { name: 'Гагаринская улица · Gagarinskaya ulitsa', road: NAMES.streets.gagarinskaya },
  { name: 'Улица Пестеля · Ulitsa Pestelya', road: NAMES.streets.pestelya },
  { name: 'Улица Короленко · Ulitsa Korolenko', road: NAMES.streets.korolenko },
  { name: 'Басков переулок · Baskov pereulok', road: NAMES.streets.baskov },
  { name: 'Кленовая улица · Klenovaya ulitsa', road: NAMES.streets.klenovaya },
  { name: 'Соляной переулок · Solyanoy pereulok', road: NAMES.streets.salny },
  { name: 'Улица Рылеева · Ulitsa Ryleeva', road: NAMES.streets.ryleeva },
  { name: 'Улица Радищева · Ulitsa Radishcheva', road: NAMES.streets.radishcheva },
  { name: 'Караванная улица · Karavannaya ulitsa', road: NAMES.streets.karavannaya },
  { name: 'Улица Чехова · Ulitsa Chekhova', road: NAMES.streets.chekhova },
  { name: 'Ковенский переулок · Kovensky pereulok', road: NAMES.streets.kovensky },
  { name: 'Петровская набережная · Petrovskaya embankment', road: NAMES.streets.petrovskayaNab },
  { name: 'Суворовская площадь · Suvorovskaya Square', road: NAMES.streets.suvorovskayaSq },
  { name: 'Марсово поле · Mars Field', road: NAMES.streets.marsovoPole },
  { name: 'Преображенская площадь · Preobrazhenskaya Square', road: NAMES.streets.preobrazhenskayaSq },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // ---------------------------------------------------------------- viewpoints (keys 1..0, Shift + 1..9, Alt + 1..5) and the hero camera
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // Palace-Liteyny (the strip's poses that lie in this territory): 1..5 the station end of Nevsky, 6..8 / 9 / 0 / Shift + 1..6 the sights of the centre and the west, Alt + 1..4 the metro entrances (the vestibules stand as
  // ordinary buildings: the metro network is not built in this area), Alt + 5 the castle; Shift + 7..9 (the Admiralty, St Isaac's, the Bronze Horseman) lie in the neighbour area;
  // the rest only stand in the Places list (key 'Place.<id>').
  const HERO = { x: 560, z: 192, yaw: yawToward(560, 192, 598, 235), pitch: 8 };      // Vosstaniya Square, looking at the obelisk and the Moscow station's clock tower
  const VIEWS = [
    { key: 'Digit1', label: 'Площадь Восстания · Московский вокзал', x: 560, z: 192, yaw: yawToward(560, 192, 598, 235), pitch: 8 },
    { key: 'Digit2', label: 'Обелиск Городу-герою Ленинграду', x: 576, z: 209, yaw: yawToward(576, 209, 592, 165), pitch: 22 },
    { key: 'Digit3', label: 'Невский проспект', x: 502, z: 158, yaw: yawToward(502, 158, 380, 130), pitch: 4 },
    { key: 'Digit4', label: 'Платформы Московского вокзала', x: 644.8, z: 520, yaw: yawToward(644.8, 520, 700, 800), pitch: 3 },
    { key: 'Digit5', label: 'Аничков мост', x: -395, z: -108, yaw: yawToward(-395, -108, -470, -92), pitch: 6 },
    { key: 'Digit6', label: 'Спас на Крови · канал Грибоедова', x: -1308, z: -798, yaw: yawToward(-1308, -798, -1255, -860), pitch: 14 },
    { key: 'Digit7', label: 'Гостиный Двор · Невский проспект', x: -1123, z: -282, yaw: yawToward(-1123, -282, -1100, -190), pitch: 6 },
    { key: 'Digit8', label: 'Зимний дворец · Дворцовая набережная', x: -2143, z: -1008, yaw: yawToward(-2143, -1008, -2060, -940), pitch: 10 },
    { key: 'Digit9', label: 'Казанский собор', x: -1470, z: -312, yaw: yawToward(-1470, -312, -1482, -235), pitch: 8 },
    { key: 'Digit0', label: 'Дворцовая площадь · Александровская колонна', x: -1985, z: -715, yaw: yawToward(-1985, -715, -2096, -896), pitch: 6 },
    { key: 'ShiftDigit1', label: 'Подписные Издания', x: -173, z: -223, yaw: 90, pitch: 12 },
    { key: 'ShiftDigit2', label: 'Русский музей · площадь Искусств', x: -1075, z: -620, yaw: yawToward(-1075, -620, -1061, -697), pitch: 8 },
    { key: 'ShiftDigit3', label: 'Дворцовый мост · Дворцовая набережная', x: -2337, z: -848, yaw: yawToward(-2337, -848, -2495, -1075), pitch: 4 },
    { key: 'ShiftDigit4', label: 'Дом Зингера · Казанский мост', x: -1398, z: -345, yaw: yawToward(-1398, -345, -1420, -383), pitch: 12 },
    { key: 'ShiftDigit5', label: 'Аничков дворец · набережная Фонтанки', x: -598, z: -22, yaw: yawToward(-598, -22, -641, -64), pitch: 8 },
    { key: 'ShiftDigit6', label: 'Михайловский сад · павильон Росси', x: -971, z: -900, yaw: yawToward(-971, -900, -971, -940), pitch: 8 },
    // the metro entrances (the seven stations of the strip; Alt + 5 is the castle below)
    { key: 'AltDigit1', label: 'Метро «Площадь Восстания» · ротонда', x: 534, z: 125, yaw: yawToward(534, 125, 516, 92), pitch: 10 },
    { key: 'AltDigit2', label: 'Метро «Маяковская» · Невский Атриум', x: 247, z: 109, yaw: yawToward(247, 109, 216, 115), pitch: 8 },
    { key: 'AltDigit3', label: 'Метро «Гостиный двор» · Невский проспект', x: -985, z: -210, yaw: yawToward(-985, -210, -976, -183), pitch: 6 },
    { key: 'AltDigit4', label: 'Метро «Невский проспект» · канал Грибоедова', x: -1340, z: -298, yaw: yawToward(-1340, -298, -1352, -339), pitch: 6 },
    { key: 'AltDigit5', label: 'Михайловский замок · памятник Петру I', x: -700, z: -715, yaw: yawToward(-700, -715, -745, -840), pitch: 10 },
    // the Places list only
    { key: 'Place.preobrazhensky', label: 'Спасо-Преображенский собор', x: 22, z: -1186, yaw: -95, pitch: 18 },
    { key: 'Place.muruzi', label: 'Дом Мурузи', x: -167, z: -1157, yaw: -107, pitch: 20 },
    { key: 'Place.chernyshevskaya', label: 'Чернышевская', x: 444, z: -1351, yaw: -90, pitch: 10 },
    { key: 'Place.circus', label: 'Цирк Чинизелли · Инженерная улица', x: -560, z: -620, yaw: yawToward(-560, -620, -569, -693), pitch: 10 },
    { key: 'Place.library', label: 'Российская национальная библиотека · Фонтанка', x: -372, z: -300, yaw: yawToward(-372, -300, -334, -311), pitch: 8 },
    { key: 'Place.alexandrinsky', label: 'Александринский театр · Екатерининский сад', x: -800, z: -95, yaw: yawToward(-800, -95, -844, 70), pitch: 8 },
    { key: 'Place.hermitage', label: 'Большой Эрмитаж · Дворцовая набережная', x: -2039, z: -1084, yaw: yawToward(-2039, -1084, -1985, -1050), pitch: 10 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'r2404499', by: 'landmarksA', group: 'station' }, { id: 'r16492039', group: 'station' },      // the Moscow station and its clock tower
    { id: 'w1214651508', by: 'landmarksA', group: 'square' },                                              // the Vosstaniya obelisk
    { id: 'r15081493', by: 'landmarksB', group: 'atrium' },
    { id: 'w60196034', by: 'landmarksB', group: 'yusupova' },
    { id: 'r1588865', by: 'landmarksC', group: 'beloselsky' },
    { id: 'r3801087', by: 'landmarksD', group: 'library' },
    { id: 'w28691685', by: 'landmarksBelinsky', group: 'ciniselli-circus' },
    { id: 'r1147588', by: 'landmarksE', group: 'gostiny-dvor' },
    { id: 'r11763697', by: 'landmarksF', group: 'kazan-cathedral' },
    { id: 'w309796655', by: 'landmarksG', group: 'general-staff' },
    { id: 'r2000648', by: 'landmarksG', group: 'alexander-column' },
    { id: 'r69424', by: 'landmarksI', group: 'winter-palace' },
    { id: 'r1067948', by: 'landmarksI', group: 'hermitage-museum' },
    { id: 'w28966446', by: 'landmarksK', group: 'saviour-church' },
    { id: 'r1502547', by: 'landmarksK', group: 'russian-museum' },
    { id: 'r238571', by: 'landmarksCastle', group: 'engineering-castle' },
    { id: 'r5589456', by: 'bridges', group: 'belinsky' }, { id: 'w362796524', by: 'bridges', group: 'palace' },
    { id: 'w114933883', by: 'northBridges', group: 'north-liteyny' },            // the Liteyny Bridge deck
    { id: 'r946930', by: 'landmarksNorthFull', group: 'north-muruzi' },          // Dom Muruzi
    { id: 'r5802451', by: 'landmarksNorthFull', group: 'north-preobrazhensky' },
    { id: 'w22999175', by: 'landmarksNorthFull', group: 'north-chernyshevskaya' },
    { id: 'w96148838', by: 'landmarksBelinskyNorth', group: 'simeon-anna' },
    { id: 'r2653740', by: 'landmarksGarden', group: 'summer-garden' }, { id: 'w41230751', by: 'landmarksGarden', group: 'summer-palace' },
    { id: 'r15745625', by: 'landmarksMars', group: 'mars-field' }, { id: 'r969622', by: 'landmarksMars', group: 'marble-palace' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6',
    'AltDigit1', 'AltDigit2', 'AltDigit3', 'AltDigit4', 'AltDigit5',
    'Place.preobrazhensky', 'Place.muruzi', 'Place.chernyshevskaya', 'Place.circus', 'Place.library', 'Place.alexandrinsky', 'Place.hermitage'],
  mustHaveAreas: [
    { x: OBELISK.x, z: OBELISK.z, has: 'обелиск' }, { x: -441, z: -93, has: 'аничков' }, { x: STATION.x, z: STATION.z, has: 'вокзал' },
    { x: -1983, z: -738, has: 'колонна' }, { x: -900, z: -1450, has: 'летний сад' }, { x: 66, z: -1182, has: 'преображенский' }, { x: -95, z: -1125, has: 'мурузи' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [SQUARE.x, SQUARE.z], r: 75, min: 3 },
};


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value. The values below started as the strip's (moved verbatim) and have been cut to THIS territory: the rows whose place lies outside
//  the play rectangles or has no module here are gone, the tram terminals are the track ends of this data.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** the strip under the Palace Bridge that OSM leaves out of both Neva polygons (between the west polygon edge and the east polygon edge) */
const PLUGS = [{ key: 'neva', o: [-2315.3, -885.3, -2320, -892.2, -2330, -906.8, -2471.7, -1114.1, -2460.8, -1097.5] }];

/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). Dimensions: docs/research/west-canals-bridges.md section 4 + the OSM bridge ways. `own`: a bridge
 *  the bridges module draws (the quay leaves the parapet / collider open and publishes the zone); the others get an invisible fallback deck (walk box + parapet boxes). */
const BRIDGE_ZONES = [
  { id: 'belinsky', name: 'Мост Белинского', key: 'fontanka', c: [-452, -628.35], axis: 78.3, w: 19.06, len: 56.6, own: true },
  { id: 'kazansky', name: 'Казанский мост', key: 'griboedov', c: [-1393, -302], axis: 104, w: 101, len: 25, own: true },
  { id: 'bankovsky', name: 'Банковский мост', key: 'griboedov', c: [-1473, 27], axis: 139, w: 6.5, len: 25.4, own: true },
  { id: 'italyansky', name: 'Итальянский мост', key: 'griboedov', c: [-1350, -540], axis: 102, w: 5, len: 19.7, own: true },
  { id: 'novo-konyushenny', name: 'Ново-Конюшенный мост', key: 'griboedov', c: [-1273, -921], axis: 101, w: 36, len: 21.1, own: true },
  { id: 'teatralny', name: 'Театральный мост', key: 'griboedov', c: [-1253.3, -1018.1], axis: 115.5, w: 15.6, len: 18, own: true },   // Triple Bridge, west part (dossier mars-bridges-canals.md 4.10)
  { id: 'green', name: 'Зелёный мост', key: 'moika', c: [-1768, -419], axis: 104, w: 39, len: 29.3, own: true },
  { id: 'pevchesky', name: 'Певческий мост', key: 'moika', c: [-1781, -845], axis: 94, w: 73, len: 30, own: true },
  { id: 'bolshoy-konyushenny', name: 'Большой Конюшенный мост', key: 'moika', c: [-1574.9, -1072.4], axis: 146, w: 11.6, len: 17.6, own: true },   // 11.6 m wide (OSM footways +-4.5), 17.6 m long (28.8 with the wings)
  { id: 'hermitage', name: 'Эрмитажный мост', key: 'winter-canal', c: [-1920, -1137], axis: 51, w: 16.5, len: 12.2, own: true },
  { id: 'zimny-1', name: '1-й Зимний мост', key: 'winter-canal', c: [-1822, -1008], axis: 49, w: 21.5, len: 15.6, own: true },
  { id: 'zimny-2', name: '2-й Зимний мост', key: 'winter-canal', c: [-1775, -945], axis: 26, w: 10.5, len: 20.5, own: true },
  { id: 'palace', name: 'Дворцовый мост', key: 'neva', c: [-2322, -884], axis: 143, w: 30, len: 255, own: true },
  { id: 'anichkov', name: 'Аничков мост', key: 'fontanka', c: [-442, -92], axis: 100, w: 38, len: 55, own: true },
  { id: 'swan-lower', name: 'Нижний Лебяжий мост', key: 'swan-canal', c: [-857.7, -1004.3], axis: 67, w: 21, len: 11.5, own: true },
  { id: 'panteleymonovsky', name: 'Пантелеймоновский мост', key: 'fontanka', c: [-725.2, -1082.8], axis: 76.5, w: 23.4, len: 43, own: true },
  { id: 'eng1', name: '1-й Инженерный мост', key: 'moika', c: [-754.7, -1042.0], axis: 326, w: 10, len: 24, own: true },
  { id: 'garden1', name: '1-й Садовый мост', key: 'moika', c: [-886.4, -962.9], axis: 342, w: 21, len: 22.4, own: true },
  { id: 'garden2', name: '2-й Садовый мост', key: 'moika', c: [-1178.9, -1010.1], axis: 192, w: 20.6, len: 29.7, own: true },
  { id: 'malo-konyushenny', name: 'Мало-Конюшенный мост', key: 'moika', c: [-1249.8, -1036.4], axis: 11, w: 15.6, len: 24.6, own: true },
  { id: 'troitsky', name: 'Троицкий мост', key: 'neva', c: [-1331.0, -1819.9], axis: 156.99, w: 27, len: 554, own: true },      // the 554 m bridge: the deck centre u = 277 of landmarksTroitsky/frame.js (bearing 336.99 = 156.99 + 180), the quay is open at both banks
  // The three small OSM-deck bridges of the Fontanka mouth, the Swan Canal and the castle moat (docs/AREAS.md 15.z): drawn by the bridges module (bridges/sites-pal.js; they had floor-only rows with an invisible walk floor
  // before): the quay is opened at their decks (c / axis / w come from the site, len = bank to bank).
  { id: 'prachechny', name: 'Прачечный мост', key: 'fontanka', c: [-828.9, -1717.1], axis: 246.86, w: 16.4, len: 37.4, own: true },        // w548349392 + footways w420044392 / w461739409, deck polygon r3808074
  { id: 'swan-upper', name: 'Верхний Лебяжий мост', key: 'swan-canal', c: [-1069.3, -1610.8], axis: 246.8, w: 15.9, len: 11.4, own: true },    // w548349395 + footways w287052711 / w287052712, r3808095
  { id: 'eng2', name: '2-й Инженерный мост', key: 'moat', c: [-636.8, -863.9], axis: 326.6, w: 10.8, len: 18.0, own: true },          // the castle moat: w466200209 + footways w364227577 / w466200212, r15750441
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'palace-deck', key: 'neva', c: [-2415.2, -977.3], axis: 323.5, w: 27.7, len: 254.5 },
];

/** reaches: key of the waterway, test(x, z, nx, nz) on a bank point (landward normal n), run = horizontal length of the slope, kerb = banquette top above the water, lip = step from the banquette to the slope */
const SLOPE_REACHES = [
  { id: 'swan', key: 'swan-canal', run: 4.7, kerb: 0.45, lip: 0.10, test: () => true, rail: (nx) => (nx < 0 ? 'ballpost' : 'trellis') },   // west (Mars Field) side ball posts + tubes, east (garden) side green trellis
  // the Moika along the Mikhailovsky Garden (south bank, between the 1st Sadovy Bridge and the Rossi Pavilion landing): dossier section 2.2 "slope reach x -1000..-880"
  { id: 'moika-mikhailovsky', key: 'moika', run: 4.2, kerb: 0.45, lip: 0.10, test: (x, z, nx, nz) => nz > 0.5 && x >= -1010 && x <= -882, rail: () => null },
];

// ---------------------------------------------------------------- PEOPLE (people.js DENSITY, people/zones.js)
/** the Nevsky corridor weight along the grid axis u (people/zones.js nevskyU): [[u, weight], ...] ascending in u (the east part: docs/research/people.md S3, the west: west-life-furniture.md 2.2) */
const PEOPLE_CORRIDOR = [[-3200, 0.9], [-2950, 1.3], [-2850, 1.7], [-2650, 2.0], [-2563, 2.3], [-2430, 2.2], [-2300, 1.9], [-2200, 2.2], [-2100, 2.2], [-2043, 2.6], [-1950, 2.0], [-1850, 2.1], [-1740, 2.0], [-1600, 1.5], [-1450, 1.0], [-1300, 0.7],
  [-1250, 0.55], [-1050, 0.8], [-880, 0.72], [-700, 0.95], [-500, 1.0], [-330, 1.15], [-100, 1.2], [60, 1.45], [200, 0.9]];

/** the hot spots of the zone weight field: [x, z, amplitude, sigma] or { u, d, a, s } = a spot in the station frame (landmarksA stationFrame, people/frame.js: u along the facade to the east, d into the building) */
const PEOPLE_HOT = [
  [592, 165, 2.6, 48],            // the Hero City obelisk and the square
  [516, 92, 2.8, 36],             // the Vosstaniya rotunda
  { u: 0, d: -45, a: 1.6, s: 45 },        // the station forecourt (the square in front of the facade)
  { u: 0, d: -12, a: 2.3, s: 24 },        // the front pavement and the doors
  [560, 150, 2.0, 40],            // the corner Nevsky / Ligovsky
  [205, 100, 2.2, 38],            // Mayakovskaya (Nevsky Atrium exits)
  [300, 60, 1.5, 38],             // the Marata crossing
  [425, 130, 1.0, 40],            // Nevsky Centre / Pushkinskaya
  [-441, -93, 1.7, 52],           // the Anichkov Bridge and the Klodt plinths
  [-420, -30, 1.1, 40],           // the Fontanka embankment (north-east quay)
  [-210, 20, 1.3, 50],            // Vladimirsky / Liteyny crossroads
  [-110, 20, 0.8, 45],
  [0, 0, 0.6, 50],                // Mayakovskogo
  { u: -2, d: 40, a: 1.6, s: 24 },        // the station vestibule / hall (benches, kiosks, the Peter bust)
  { u: -2, d: 100, a: 1.3, s: 30 },      // the concourse under the departure boards
  { u: -12, d: 165, a: 0.9, s: 30 },    // the turnstiles and the apron
  [600, 470, 0.9, 40], [640, 520, 0.7, 55], [670, 620, 0.35, 70],   // the platform heads
  // ---- the WEST (docs/research/west-life-furniture.md section 2.4, spots S1-S20)
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
  [-2010, -740, 1.0, 95],         // the Palace Square sett field (one person per ~25 m2 in the photos; the scripted groups of west.js come on top)
  [-2096, -870, 1.4, 40],         // S9 the Winter Palace south front
  [-2097, -893, 1.5, 36],         // S8 the Hermitage courtyard queue
  [-1779, -872, 0.9, 30],         // S10 Pevchesky Bridge / Moika 39
  [-2400, -830, 0.9, 30],         // S11 the Palace Bridge landing
  [-2440, -766, 1.2, 62],         // the Admiralty garden
  [-2335, -494, 1.6, 52],         // S12 the Alexander Garden fountain
  [-2480, -500, 0.7, 95],         // the Alexander Garden (9 ha)
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
  // ---- the ENGINEERING CASTLE reach (docs/research/mars-field.md S12; amplitudes are the weights of the west table x ~0.5: busy, but this is not Nevsky).
  //      The surfaces themselves carry a base weight (people/area.js); the spots below are the places people stop: the castle and the Peter I monument.
  [-712, -757, 2.2, 22], [-737, -824, 2.0, 22], [-737, -842, 1.2, 16], [-690, -790, 0.7, 40], [-778, -948, 1.0, 16],
  // ---- the PALACE BRIDGE (bridges/palace.js; the first ~170 m of the 255 m deck lie in the play area, the pavements carry the 'k' chains of people/nav.js nav.longs): the bank end (the lattice has to reach the
  //      pavements of the bridge head, or the chains hang in a stub of the pavement graph) and the stretches of the deck where people stop to look at the Neva. The deck weights are ~0.12-0.25 (the full-city table had 0.35-0.65 on a 255 m deck: the lanes of the pavements are 1.15 m wide between the barrier kerb and the lamp standards, and the strip has fewer pavements to share the crowd).
  [-2345, -883, 0.45, 26], [-2366, -922, 0.05, 26], [-2380, -950, 0.1, 30], [-2412, -992, 0.12, 28],
  // ---- Mars Field (landmarksMars; the rows of the source's people/zones.js, docs/research/mars-field.md S12; the Summer Garden, Trinity / Swan bridge rows of the same block belong to the garden block)
  [-1086, -1243, 2.4, 22],          // the Eternal Flame: the stream of tourists and photographers round the platform
  [-1086, -1243, 0.8, 55],          // the memorial plaza (116 x 75 m gravel)
  [-1186, -1329, 0.55, 30], [-1078, -1381, 0.5, 30], [-1106, -1115, 0.5, 30], [-995, -1161, 0.4, 30],      // the four rondels (strollers, prams, dog walkers)
  [-1135, -1400, 0.5, 40], [-1250, -1310, 0.5, 40],        // the north axial alley, the barracks promenade (pensioners on the white benches)
  [-1060, -1440, 0.45, 40], [-1100, -1050, 0.6, 45], [-1160, -1060, 0.4, 40],     // the Lebyazhya side, the Moika end (ice-cream carts)
  [-1197, -1502, 1.3, 26],          // Suvorov Square: photographers of the monument on the island, from the pavements
  [-1330, -1450, 0.8, 22], [-1290, -1460, 0.6, 30],        // the Marble Palace forecourt fence (the Alexander III monument behind it), the Millionnaya front
  [-1370, -1500, 0.7, 40],          // the Palace Embankment in front of the Marble Palace
  // the eight inscription slabs of the memorial (the source adds them from the landmarksMars crowd service, kind 'slab': FF.W of the slab centres, rounded)
  [-1097, -1262, 0.5, 8], [-1108, -1238, 0.5, 8], [-1081, -1221, 0.5, 8], [-1106, -1232, 0.5, 8], [-1091, -1264, 0.5, 8], [-1067, -1253, 0.5, 8], [-1075, -1223, 0.5, 8], [-1064, -1247, 0.5, 8],
];

// ---------------------------------------------------------------- WILDLIFE (wildlife/zones.js zoneTable, crowdTable, CROW_HAUNTS; wildlife.js)
// The station forecourt: 18 m in front of the clock tower base along the facade normal (bearing 348 deg: sin 0.208, cos 0.978)
const _FC = { x: STATION.tower.x - 0.208 * 18, z: STATION.tower.z - 0.978 * 18 };
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields), or has `at(ctx)` -> { x, z } | null
 *  instead of x / z: a position that is read from a landmark service of the area (the row is skipped when `at` gives nothing). */
const PIGEON_ZONES = [
  // ---- the first build (east of the Fontanka): the obelisk, the station forecourt, the metro rotunda, the Anichkov Bridge, the hotel corner
  { tag: 'obelisk', kind: 'pigeon', x: OBELISK.x, z: OBELISK.z, spread: 22, n: 2, w: 2, name: 'Голуби у обелиска · Pigeons at the obelisk', min: 11 },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x, z: _FC.z, spread: 12, n: 1, w: 1.6, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x + 25, z: _FC.z + 5, spread: 12, n: 1, w: 1.2, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'rotunda', kind: 'pigeon', x: 516, z: 92, spread: 12, n: 1, w: 1.2, r: 4, name: 'Голуби у вестибюля метро · Pigeons at the metro rotunda' },
  { tag: 'hotel', kind: 'pigeon', x: 648, z: -1, spread: 12, n: 1, w: 0.8, r: 4, name: 'Голуби у гостиницы · Pigeons at the hotel' },
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
    // ---- sparrows: the gardens (the terraces are added by birds.js from the props module)
  { tag: 'kazan', kind: 'sparrow', x: -1481, z: -300, spread: 16, n: 1, w: 2, r: 3, name: 'Воробьи в Казанском сквере · Sparrows in the Kazan garden' },
  { tag: 'catherine', kind: 'sparrow', x: -790, z: -128, spread: 16, n: 1, w: 1.5, r: 3, name: 'Воробьи в Екатерининском саду · Sparrows in the Catherine Garden' },
];
/** the districts a crow likes (the Alexander Garden limes, the Kazan and Isaac gardens): crows start on a tree top there when the player is not about. At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -1469, z: -290, r: 90 }, { x: -800, z: -105, r: 90 }, { x: -1020, z: -830, r: 110 }];      // the Kazan garden, the Catherine Garden, the Mikhailovsky Garden (the Alexander Garden and St Isaac's garden belong to the neighbour area)
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] }; a pigeon zone whose tag is not listed gives no crowd */
const CROWDS = {
  column: [70, 70, 0.9], arch: [28, 40, 0.65], 'winter-palace': [45, 45, 0.65],
  kazan: [38, 55, 0.85], 'kazan-bench': [10, 25, 0.6], voronikhin: [18, 30, 0.5], 'kazan-nevsky': [22, 30, 0.6],
  gostiny: [60, 50, 0.7], catherine: [28, 35, 0.55], bridge: [22, 30, 0.6],      // 'bridge': the Anichkov Bridge pigeons of wildlife/birds.js
  obelisk: [45, 50, 0.6], forecourt: [32, 45, 0.6], rotunda: [18, 30, 0.5],
};

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it)
 *   pigeons        wildlife/zones.js zoneTable: the pigeon / sparrow zone rows (PIGEON_ZONES above)
 *   crowHaunts     wildlife/zones.js CROW_HAUNTS [{ x, z, r }]
 *   crowds         wildlife/zones.js crowdTable: { tag: [r, f, level] }
 *   fountains      wildlife.js: the positional 'fountain' loops [[x, z, volume], ...] (only those inside the play area play)
 *   peopleDensity  people.js DENSITY: { station, west, mars, garden } (the sub-tables are described there; an area without them gets the neutral ones; `garden` needs HOOKS.inGarden, the strip has neither)
 *   peopleCorridor people/zones.js: the Nevsky corridor weight [[u, weight], ...] (the corridor exists where the roads of NAMES.streets.nevsky do)
 *   peopleHot      people/zones.js: the hot spots of the zone weight field ([x, z, amplitude, sigma] | { u, d, a, s })
 *   tramLines      traffic/trams.js TRAM_LINES: [{ refs: [...], a: [x, z], b: [x, z], headway }] (the terminals are track ends; a line whose terminals are not in the data is skipped)
 *   clearDiscs     environment/field.js: [{ x, z, r }] discs that stay free of trunks, hedges and beds (the station forecourt apron)
 *   farCentres     environment/far.js: [{ x, z, bias }] centres of old dense stone city beyond the area: the far blocks within (distance + bias) of one are as dense as those near the area's own centre
 */
export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [[-1469, -279, 0.8]],      // the Kazan garden fountain (the Alexander Garden fountain of landmarksH belongs to the neighbour area)
  peopleDensity: {
    // station    the Moscow-station zone: within `radius` m of the segments (Vosstaniya Square - forecourt - hall) and of the platform rectangles (+ rectRadius m) the people density
    //            is `factor` x the plan (hall seats, taxi queues, passengers, photographers, smokers, goals and the player-following re-placement are thinned), fading to 1 over `fade` m.
    //            maxPeople: a hard head count for the zone (nobody picks a target / is re-placed there while it is full).
    //            The Nevsky pavement crowd between Mayakovskaya and the Fontanka is not touched.
    station: { factor: 0.35, maxPeople: 330, radius: 220, fade: 80, rectRadius: 40, segments: [[592, 165, 612, 330]], rects: [[560, 400, 790, 1100]] },
    // the WEST (Gostiny Dvor - the Admiralty; people/west.js): `scale` multiplies the counts of the scripted places (Kazan, Palace Square, the gardens, the bridges ...); `platforms` the passengers on the
    // platforms of the three west metro stations (people/metrolife.js, ~70 at 1). The population total targets 1000-1400 (the walkers follow the player: the crowd around the camera comes from them).
    west: { scale: 0.55, platforms: 0.75 },
    // the ENGINEERING CASTLE reach (people/mars.js, people/area.js): `scale` multiplies the counts of the scripted places; `zones` are head-count caps of the quiet zones (nav.marsZone: 0 the castle precinct): while a zone holds
    // `maxPeople` visible people (scripted ones included) nobody is re-placed / picks a target there. The summer afternoon is busy, but this is not Nevsky.
    mars: { scale: 0.55, zones: [{ name: 'castle', maxPeople: 70 },
      // Mars Field: the cap of the Field + Suvorov Square + Marble Palace zone (150 in the source, people.js DENSITY.mars.zones 'field'). INERT until people/area.js zone() returns this index (this tree's people/area.js knows only zone 0, the castle)
      { name: 'field', maxPeople: 150 }] },
  },
  peopleCorridor: PEOPLE_CORRIDOR,
  peopleHot: PEOPLE_HOT,
  // the terminals in map metres: the track ends of THIS area's data (src/areas/palace/data, clipped at its extent; a terminal needs a degree-1 track end within 90 m, traffic/trams.js). One network runs through
  // the data: route 3 (Gostiny Dvor - Italyanskaya - Mikhailovsky Castle - Letny Sad, both directions) from the track ends (-1526, -2280) at the north edge to (-1360, 200) at the south-west edge, both outside the play
  // area (checked with buildTramNet: 2 routes, 2.95 km, nothing missing). The Marata / Ligovsky pair of routes 43 and 49 has no route here: its rails are cut at (-40, 417) and (-204, 360), the two halves do not meet.
  tramLines: [
    { refs: ['3'], a: [-1526, -2280], b: [-1360, 200], headway: 190 },
  ],
  clearDiscs: [{ x: STATION.tower.x, z: STATION.tower.z + 20, r: 28 }],      // the station forecourt (Vosstaniya Square paving is an AREA already): keep trunks off the facade apron
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre reaches the Admiralty and over the Neva (Vasilievsky, Petrograd side): dense stone blocks there too
};

// ---------------------------------------------------------------- WATER (the tables above, environment/waterways.js)
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
 *   dataWater      [{ id, key }]  records of the WATER (not RIVER) data that form a waterway of that key (the castle moat)
 *   slopeReaches   [{ id, key, run, kerb, lip, test(x, z, nx, nz), rail(nx) }]  grass-slope banks (waterways.js SLOPE_REACHES documents the fields)
 */
export const WATER = {
  plugs: PLUGS,
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [['x', -2670]],            // the seam of the removed S rectangles of the whole-city project: the clipped data holds the Griboedov Canal polygon pieces 5:1 / 5:2 that meet at it (a clip line of the full city, not a bank); inside this area since the water zones moved the west edge of the data to x -2840
  farSources: ['neva-up', 'neva-down', 'neva-malaya'],
  farCenter: [-900, -900],              // the middle of the area (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [[-2460.8, -1097.5, -2460.7, -1098.7]],      // the 1.2 m corner edge of the Neva polygon beside the Palace Bridge plug
  openMouths: [[-744, -1034.5, -757.4, -1054.4]],           // the Moika leaves the Fontanka under the 1st Engineer Bridge
  dataWater: [{ id: 'r15750440', key: 'moat' }],            // the castle moat (the data keeps it as a plain pond)
  slopeReaches: SLOPE_REACHES,
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE: where the drivable cars wait and where the player's car appears (docs/AREAS.md 13.4: the four cars stand ONLY at the central station, the Moscow station, which this territory contains; an area without the
 * station holds one car, the purple Zhiguli, at its spawn)
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east) } }  a car without a pose is not built; an area with no pose at all has no drive module
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 * Palace-Liteyny (the strip's poses): the coupe stays at its old spot on the station's taxi-rank service aisle (OSM way w569726648, highway=service: lane rank 0, which traffic/sim.js never drives); the pickup and the Zhiguli
 * stand on the free forecourt pavement south of it, staggered so that every car has a free way out to the east (toward Vosstaniya Square); the Roadster has the open forecourt east of x = 596 to itself;
 * docs/research/garage-2026.md (verified free of lanes / buildings by tools/drive-garage-test.mjs).
 */
export const GARAGE = {
  poses: {
    coupe: { x: 579, z: 219, yaw: 99 * DEG },
    truck: { x: 590.0, z: 224.0, yaw: 99 * DEG },            // on the free forecourt pavement just south of the aisle, 5.5 m from the coupe: its way east along the pavement is clear
    lada: { x: 582.0, z: 228.0, yaw: 99 * DEG },             // a row further south, 4 m beside the pickup's line (its way east passes 2.7 m south of the pickup's centre): no car is boxed in
    roadster: { x: 596.0, z: 232.0, yaw: 99 * DEG },         // the south-east corner of the forecourt, 8 m beyond the pickup: 25 m of open pavement ahead of the nose (room for a hop and a thrust run), nobody's way out passes it
  },
  spawn: { x: 579, z: 219, yaw: 99 * DEG },      // on the asphalt strip beside the station's taxi rank, facing east, toward Vosstaniya Square
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = ['city', 'landmarksA', 'landmarksB', 'landmarksC', 'landmarksD', 'landmarksNorthFull', 'landmarksGarden', 'landmarksMars'];      // landmarksNorthFull (not the strip's landmarksNorth, which this page does not build) publishes the door points of its claimed buildings; landmarksGarden the gates of the Summer Garden, landmarksMars the doors of the barracks and the houses of the Mars Field
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent) */
export const HOOKS = makeHooks(MODULES);      // the hook set of src/areas/north/hooks.js gated by the module list: here only the deck service of northBridges is live (the Tauride / Smolny keep-outs wait for their modules)
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9: `[{ id, box: [x0, x1, z0, z1], at(x, z) -> number | null }]`, the first non-null answer wins): the hook set gated by MODULES, see src/areas/north/hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list

// ---------------------------------------------------------------- the places of the OTHER areas (milestone M7, docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name; a pick asks the gate question (core/gates.js offerPlace, via 'place') and the hand-off lands at this pose
 * instead of the gate's arrival rectangle. `{ key, label (Russian), area (the registry id), gate (a gate FROM this area TO that area), view (the VIEWS key of that area whose pose this copies:
 * tools/cross-places-test.mjs pins x, z, yaw, pitch to it and proves the pose with the predicates of views-check in that area), x, z, yaw (deg, 0 = north, 90 = west), pitch }`.
 * The rows copy src/areas/smolny/area.js makeViews (yaw to 2 decimals: what ?cam= carries); Chernyshevskaya and the Transfiguration Cathedral lie in this territory too, so they are not here. An empty table adds nothing to the list. Not read by any world module (the engine tables of lib/area-tables.js do not know it).
 */
export const CROSS_PLACES = [
  { key: 'smolny-cathedral', label: 'Смольный собор', area: 'smolny', gate: 'e1', view: 'Digit7', x: 2335, z: -1833, yaw: -90, pitch: 21 },
  { key: 'smolny-institute', label: 'Смольный институт', area: 'smolny', gate: 'e1', view: 'Digit8', x: 2461, z: -1471, yaw: -37.98, pitch: 8 },
  { key: 'tauride-gate', label: 'Таврический сад · южные ворота · Кирочная улица', area: 'smolny', gate: 'e1', view: 'Digit0', x: 1224, z: -1266, yaw: -173, pitch: 10 },
  { key: 'suvorov', label: 'Музей Суворова · Суворовский проспект', area: 'smolny', gate: 'e1', view: 'Digit9', x: 1395, z: -1180, yaw: -34.7, pitch: 8 },
];
