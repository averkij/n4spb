// ============================================================================
//  AREA DEFINITION - Vladimirsky-Ligovka (Владимирский–Лиговка; docs/AREAS.md section 13 and 15.x): the third area of the world map (maps/intro-draft.html, area 97), the Vladimirsky and Ligovka districts with their walkable
//  overlaps: the Vladimirsky Cathedral and the bell tower, the Tolstoy House on the Fontanka, Vladimirskaya and Dostoevskaya, Zagorodny and Ligovsky Prospekts, the Alexandrinsky Theatre with Rossi Street and Ostrovsky Square,
//  Nevsky Prospekt from the Anichkov Bridge to Vosstaniya Square with the Moscow Railway Station (the station complex whole: rectangle ST), the Obvodny canal and the Alexander Nevsky Square with the Lavra gate church, the Trinity
//  Cathedral and the Feodorovsky Cathedral. 8.63 km2 of play rectangles (src/areas/registry.js REGISTRY.vladimirsky.play, cut from the map outline by tools/area-shape.mjs), the data cut straight from the source project by
//  tools/area-data-cut.mjs.
//  It starts from the module of Palace-Liteyny (src/areas/palace/area.js: the station end of Nevsky, the Anichkov Bridge, the Fontanka, the library) and takes the south from the strip's: landmarksD with all four sub-groups,
//  landmarksE (Alexandrinsky Theatre, Rossi Street, Ostrovsky houses, Anichkov Palace), landmarksEast (the Lavra and Hotel Moscow, from Smolninskoye's module) and the canal crossings (bridges/sites-south.js, eastBridges).
//  vladimirsky.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file); the hook set (../north/hooks.js) is shared code, not an area module. The values that the engine reads from every area
//  (NAMES, SQUARE, OBELISK, STATION) are COPIES of the strip's: the style of a block follows its distance to SQUARE (city/archetypes.js, streets/style.js), so the same street looks the same in every area.
//  Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
// ============================================================================
import { GROUPS_LIST as G_NORTHFULL } from '../../world/landmarksNorthFull/groups.js';
import { GROUPS_LIST as G_E } from '../../world/landmarksE/groups.js';
import { GROUPS_LIST as G_D } from '../../world/landmarksD/groups.js';
import { GROUPS_LIST as G_EAST } from '../../world/landmarksEast/groups.js';
import { GROUPS_LIST as G_EASTBRIDGES } from '../../world/eastBridges/groups.js';
import { SOUTH_GROUPS } from '../../world/bridges/sites-south.js';

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'vladimirsky';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/vladimirsky/';
/** A page reached by a hand-off: a missing or stale bake is an error card, never a minutes-long procedural build. */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No metro network (the surface rotunda of Vosstaniya and the vestibules of Vladimirskaya / Dostoevskaya are generic buildings),
 *  no St Isaac's / Admiralty / Senate, no Palace Square (Palace-Liteyny and the Admiralty area), no Tauride / Smolny (Smolninskoye). tools/modules-list.mjs parses this list: one quoted name per line. */
export const MODULES = [
  'environment',  // ground, embankment granite, Fontanka / Obvodny canal water, trees, lawns, flowerbeds, far skyline
  'landmarksEast', // the eastern edge: the Lavra gate church, the Trinity Cathedral, the Lavra wings, the Feodorovsky Cathedral and Hotel Moscow on Alexander Nevsky Square; before streets / city, it claims its buildings
  'eastBridges',  // the Alexander Nevsky Bridge (clipped to the data of the area) and the Lavra / Obvodny canal crossings; before streets, it claims the bridge ways east of x 1000
  'landmarksNorthFull', // the Podpisnye Izdaniya bookstore (Nevsky 40; the other sub-groups of the module lie in Palace-Liteyny / Smolninskoye: only 'north-podpisnye' is claimed here)
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'rail',         // Moscow Railway Station tracks, platforms, canopies, catenary, signals, trains
  'landmarksA',   // Moscow Railway Station building + clock tower + Vosstaniya Square (obelisk, hotel Oktyabrskaya), the Galereya mall
  'landmarksB',   // Nevsky Prospekt landmarks between Vosstaniya Square and Fontanka
  'landmarksC',   // Fontanka embankment, Anichkov Bridge + horse tamers, the Beloselsky-Belozersky palace, boats
  'landmarksD',   // the National Library and the Mariinsky hospital block ('library'), the Vladimirsky Cathedral ('vladimirsky'), the Tolstoy House ('tolstoy'), the Passage and the Dostoevsky monument ('dostoevsky')
  'landmarksE',   // Alexandrinsky Theatre, Rossi Street, Ostrovsky houses, Anichkov Palace (the Gostiny Dvor and the Catherine Garden lie in Palace-Liteyny)
  'bridges',      // the canal crossings of the south: the Fontanka bridges (Lomonosov, Leshtukov, Semenovsky) and the Obvodny canal bridges west of x 1000 (bridges/sites-south.js)
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, tourists, groups, station crowd, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the cars at the Moscow station (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksEast: 'Надвратная церковь Лавры · Троицкий собор · гостиница «Москва»', eastBridges: 'мост Александра Невского · мосты Лавры',
  landmarksNorthFull: 'Подписные Издания',
  landmarksD: 'Владимирский собор · Толстовский дом · Достоевская',
  landmarksE: 'Александринский театр · улица Зодчего Росси',
  bridges: 'мосты Фонтанки и Обводного канала',
  drive: 'машины у Московского вокзала',
};

export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: {
    // ---- the strip's names (a copy of src/world/area.js NAMES.streets: the engine's lookups read them)
    nevsky: 'Невский проспект', ligovsky: 'Лиговский проспект', mayakovskogo: 'улица Маяковского', marata: 'улица Марата', vladimirsky: 'Владимирский проспект',
    liteyny: 'Литейный проспект', fontanka: 'набережная реки Фонтанки', zhukovskogo: 'улица Жуковского', pushkinskaya: 'Пушкинская улица', vosstaniya: 'улица Восстания',
    goncharnaya: 'Гончарная улица', suvorovsky: 'Суворовский проспект', kuznechny: 'Кузнечный переулок', kolokolnaya: 'Колокольная улица', rubinsteina: 'улица Рубинштейна',
    zagorodny: 'Загородный проспект', razyezzhaya: 'Разъезжая улица', stremyannaya: 'Стремянная улица', bolshayaMoskovskaya: 'Большая Московская улица',
    sadovaya: 'Садовая улица', malayaSadovaya: 'Малая Садовая улица', gorokhovaya: 'Гороховая улица', admiralteysky: 'Адмиралтейский проспект', voznesensky: 'Вознесенский проспект',
    moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова', ostrovskogoSq: 'площадь Островского', karavannaya: 'Караванная улица', chekhova: 'улица Чехова',
    // ---- the south and the south-east of the territory (names exactly as in OSM, ROADS[].name of src/areas/vladimirsky/data; the long streets by length inside the play rectangles, m: Obvodny canal embankment 11031, Nevsky 5926,
    //      Ligovsky 4717, Marata 4258, Fontanka embankment 3278, Kremenchugskaya 2426, Obukhovskoy Oborony 2314, Zagorodny 2197, Borovaya 1816, Chernyakhovskogo 1722, Razyezzhaya 1696, Zvenigorodskaya 1627 ...)
    obvodnyNab: 'набережная Обводного канала', kremenchugskaya: 'Кременчугская улица', obukhovskoyOborony: 'проспект Обуховской Обороны', borovaya: 'Боровая улица', chernyakhovskogo: 'улица Черняховского',
    zvenigorodskaya: 'Звенигородская улица', dnepropetrovskaya: 'Днепропетровская улица', sinopskayaNab: 'Синопская набережная', mirgorodskaya: 'Миргородская улица', zaslonova: 'улица Константина Заслонова',
    atamanskaya: 'Атаманская улица', lomonosova: 'улица Ломоносова', kolomenskaya: 'Коломенская улица', voennaya: 'Военная улица', borodinskaya: 'Бородинская улица', voronezhskaya: 'Воронежская улица',
    dostoevskogo: 'улица Достоевского', telezhnaya: 'Тележная улица', poltavskaya: 'Полтавская улица', sotsialisticheskaya: 'Социалистическая улица', alexanderNevskySq: 'площадь Александра Невского',
    vladimirskayaSq: 'Владимирская площадь', rossi: 'улица Зодчего Росси', alexanderNevskogo: 'улица Александра Невского', pravdy: 'улица Правды', svechnoy: 'Свечной переулок', romenskaya: 'Роменская улица',
    nevskyBridge: 'мост Александра Невского',
  },
};

// ---------------------------------------------------------------- the local frames: the anchors are the strip's (see the header)
/** Vosstaniya Square: the paved square w638352776 (centre 589, 173); the Hero City obelisk (36 m) stands at (592, 165) on an island between the two Nevsky carriageways. */
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
/** Moscow Railway Station: faces NNW (facade normal bearing ~348 deg) onto the square with the obelisk on its axis; the tracks run SSE (bearing ~167 deg). Clock tower base (602, 246). */
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

// ---------------------------------------------------------------- landmark groups
// A specialist MODULE owns a list of named SUB-GROUPS (docs/AREAS.md section 13.2): a sub-group claims building ids (`ids`, plus every part whose `parent` is one of them) and non-building OSM ids (`osm`) that the owner
// draws itself. The sub-groups of this territory are the ones whose buildings lie in its data; a group-aware module builds only what the area claims.
export const GROUPS = {
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
  landmarksB: [
    { key: 'nevsky-centre', name: 'ТЦ «Невский Центр»', nameEn: 'Nevsky Centre (Nevsky 114-116)', ids: ['r1784115'], osm: [], at: [443, 39], note: 'shopping centre at Ligovsky, 6 levels' },
    { key: 'atrium', name: 'Невский Атриум · вход в метро «Маяковская»', nameEn: 'Nevsky Atrium (house 71, Mayakovskaya entrance)', ids: ['r15081493'], osm: [], at: [194, 122], note: 'Marata 1/71; the metro entrances n4060185664 / n1109163128 lie inside it: the arched openings at Nevsky 71 (docs/research/nevsky.md)' },
    { key: 'yusupova', name: 'Дом Юсуповой · Дом Меняевых', nameEn: 'Yusupova house (Nevsky 84-86), Menyaev house (90-92)', ids: ['w60196034', 'w98396422', 'w60195756', 'w103591279'], osm: [], at: [0, -30], note: 'yellow Ionic portico house 84-86; Bruni house 90-92 (1866-67)' },
    { key: 'nevsky-corner', name: 'Угловые дома Невского', nameEn: 'Other Nevsky landmark corners (Dom Kozhevnikova, Mayakovskogo, Vladimirsky crossroads)', ids: ['r3323319', 'w113458823', 'r936116', 'w60195636', 'w60195635', 'w60195639', 'w245953204', 'r442684', 'w52016434'], osm: [], at: [-130, 39], note: 'see docs/research/nevsky.md block table for more candidates the specialist may add' },
  ],
  landmarksC: [
    { key: 'anichkov-bridge', name: 'Аничков мост', nameEn: 'Anichkov Bridge + Klodt horse tamers', ids: [], osm: ['r5537267', 'w372394912', 'w372394928'], at: [-441, -93], note: 'three-arch pink-granite bridge 54.6 x 37.9 m, four bronze groups on the corners (docs/research/fontanka.md)' },
    { key: 'beloselsky', name: 'Дворец Белосельских-Белозерских', nameEn: 'Beloselsky-Belozersky Palace', ids: ['r1588865'], osm: [], at: [-374, -30], note: 'Nevsky 41, coral-pink neo-baroque at the south-east corner of the bridge' },
    { key: 'fontanka-bank', name: 'Набережная Фонтанки', nameEn: 'Fontanka embankment buildings', ids: ['w28962563', 'w47457765'], osm: [], at: [-540, 60], note: 'Fontanka 33 (SDYUSSHOR-1) and Fontanka 50 (Grebyonka); the granite walls themselves are drawn by environment' },
  ],
};
GROUPS.landmarksD = G_D;      // landmarksD/groups.js: all four sub-groups (library, vladimirsky, tolstoy, dostoevsky): the cathedral, the Tolstoy House, the Passage and the monument lie 700 m south of the library, in this territory
GROUPS.landmarksE = G_E.filter((g) => ['alexandrinsky-theatre', 'anichkov', 'ostrovsky-houses'].includes(g.key));      // the Gostiny Dvor and the Catherine Garden (and the National Library on Sadovaya) lie west of the territory, in Palace-Liteyny
GROUPS.landmarksNorthFull = G_NORTHFULL.filter((g) => g.key === 'north-podpisnye');      // the bookstore only; Dom Muruzi, the cathedral, Chernyshevskaya and the corridor houses lie in the neighbours
GROUPS.landmarksEast = G_EAST;      // the Lavra gate church r5677834, the Trinity Cathedral w28808840, the Lavra wings (5 ids), the Feodorovsky Cathedral r6319253 and Hotel Moscow r3132622: all five sub-groups lie in this territory
GROUPS.eastBridges = G_EASTBRIDGES;      // the bridge ways east of x 1000 (the group's osm list is computed from this area's ROADS: the Alexander Nevsky Bridge, the Obvodny canal / Monastyrka / Lavra crossings)
GROUPS.bridges = SOUTH_GROUPS;      // the canal crossings of the south (bridges/sites-south.js computes them from this area's BRIDGES / ROADS: the Fontanka and the Obvodny canal west of x 1000)

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, inRiver, shoreDist } = h;
  const S = NAMES.streets;
  return [
  // ---- the sights of the south: Vladimirskaya, the Tolstoy House, Rossi Street, the Alexandrinsky Theatre
  ..._groupPolys(SUBGROUPS.vladimirsky, 10).map((r) => ({ name: 'Владимирский собор · Vladimirsky Cathedral', ...r })),
  ..._groupPolys(SUBGROUPS.tolstoy, 8).map((r) => ({ name: 'Толстовский дом · Tolstoy House', ...r })),
  ..._groupPolys(SUBGROUPS.dostoevsky, 8).map((r) => ({ name: 'Владимирская площадь · Vladimirskaya Square (Dostoevskaya)', ...r })),
  ..._groupPolys(SUBGROUPS.library, 6).map((r) => ({ name: 'Российская национальная библиотека · National Library', ...r })),
  { name: 'Аничков мост · Anichkov Bridge', c: [-441, -93], r: 52 },
  ..._groupPolys(SUBGROUPS.beloselsky, 8).map((r) => ({ name: 'Дворец Белосельских-Белозерских · Beloselsky-Belozersky Palace', ...r })),
  ..._groupPolys(SUBGROUPS.anichkov, 10).map((r) => ({ name: 'Аничков дворец · Anichkov Palace', ...r })),
  ..._named(/Александринск/i, 8, null).map((r) => ({ name: 'Александринский театр · Alexandrinsky Theatre', ...r })),
  ..._areaPolys(/площадь Островского/).map((o) => ({ name: 'Площадь Островского · Ostrovsky Square', poly: o, margin: 6 })),
  { name: 'Подписные Издания · Bookshop', c: [-201, -222], r: 40 },
  // ---- the station end of Nevsky
  { name: 'Обелиск «Городу-герою Ленинграду» · Hero City obelisk', c: [592, 165], r: 24 },
  ..._groupPolys(SUBGROUPS.station, 12).map((r) => ({ name: 'Московский вокзал · Moscow Railway Station', ...r })),
  { name: 'Платформы Московского вокзала · Station platforms', x0: 560, x1: 780, z0: 420, z1: 1100 },
  ..._sqPolys.map((o) => ({ name: 'Площадь Восстания · Vosstaniya Square', poly: o })),
  ..._groupPolys(SUBGROUPS.oktyabrskaya, 8).map((r) => ({ name: 'Гостиница «Октябрьская» · Hotel Oktyabrskaya', ...r })),
  ..._groupPolys(SUBGROUPS['nevsky-centre'], 6).map((r) => ({ name: 'Невский Центр · Nevsky Centre', ...r })),
  ..._groupPolys(SUBGROUPS.galereya, 6).map((r) => ({ name: 'ТРЦ «Галерея» · Galereya mall', ...r })),
  // ---- the east: Alexander Nevsky Square with the Lavra gate church, the Trinity Cathedral and the Lavra, Hotel Moscow, the Feodorovsky Cathedral, the bridge
  ..._groupPolys(SUBGROUPS['east-hotel-moscow'], 8).map((r) => ({ name: 'Гостиница «Москва» · Hotel Moscow', ...r })),
  ..._groupPolys(SUBGROUPS['east-trinity'], 10).map((r) => ({ name: 'Троицкий собор Александро-Невской лавры · Trinity Cathedral of the Lavra', ...r })),
  ..._groupPolys(SUBGROUPS['east-feodorovsky'], 8).map((r) => ({ name: 'Феодоровский собор · Feodorovsky Cathedral', ...r })),
  { name: 'Площадь Александра Невского · Alexander Nevsky Square', c: [1940, 978], r: 95 },
  { name: 'Александро-Невская лавра · Alexander Nevsky Lavra', x0: 1870, x1: 2195, z0: 1100, z1: 1440 },
  { name: 'Мост Александра Невского · Alexander Nevsky Bridge', road: S.nevskyBridge },
  // ---- the waterways: the Fontanka from the Anichkov Bridge to the south-west edge, the Obvodny canal across the south (key 'neva': the Neva-style granite trench), the Neva at the east edge (the bend by the Alexander Nevsky Bridge)
  { name: 'Фонтанка · Fontanka River', x0: -2200, x1: -300, z0: -480, z1: 1400, test: (x, z) => shoreDist(x, z) < 14 },
  { name: 'Обводный канал · Obvodny Canal', x0: -2200, x1: 2800, z0: 1300, z1: 2700, test: (x, z) => shoreDist(x, z) < 10 },
  { name: 'Нева · Neva River', x0: 2000, x1: 3100, z0: -480, z1: 1500, test: (x, z) => _shoreOf(['neva'], x, z) < 8 || inRiver(x, z) },
  // ---- the streets (names exactly as in OSM), the long ones first
  { name: 'Невский проспект · Nevsky Prospekt', road: S.nevsky },
  { name: 'Лиговский проспект · Ligovsky Prospekt', road: S.ligovsky },
  { name: 'Улица Марата · Ulitsa Marata', road: S.marata },
  { name: 'Набережная реки Фонтанки · Fontanka embankment', road: S.fontanka },
  { name: 'Набережная Обводного канала · Obvodny Canal embankment', road: S.obvodnyNab },
  { name: 'Владимирский проспект · Vladimirsky Prospekt', road: S.vladimirsky },
  { name: 'Владимирская площадь · Vladimirskaya Square', road: S.vladimirskayaSq },
  { name: 'Загородный проспект · Zagorodny Prospekt', road: S.zagorodny },
  { name: 'Разъезжая улица · Razyezzhaya ulitsa', road: S.razyezzhaya },
  { name: 'Улица Рубинштейна · Ulitsa Rubinshteyna', road: S.rubinsteina },
  { name: 'Улица Достоевского · Ulitsa Dostoevskogo', road: S.dostoevskogo },
  { name: 'Колокольная улица · Kolokolnaya ulitsa', road: S.kolokolnaya },
  { name: 'Кузнечный переулок · Kuznechny pereulok', road: S.kuznechny },
  { name: 'Улица Зодчего Росси · Ulitsa Zodchego Rossi', road: S.rossi },
  { name: 'Площадь Островского · Ostrovsky Square', road: S.ostrovskogoSq },
  { name: 'Улица Ломоносова · Ulitsa Lomonosova', road: S.lomonosova },
  { name: 'Звенигородская улица · Zvenigorodskaya ulitsa', road: S.zvenigorodskaya },
  { name: 'Стремянная улица · Stremyannaya ulitsa', road: S.stremyannaya },
  { name: 'Большая Московская улица · Bolshaya Moskovskaya ulitsa', road: S.bolshayaMoskovskaya },
  { name: 'Литейный проспект · Liteyny Prospekt', road: S.liteyny },
  { name: 'Улица Жуковского · Ulitsa Zhukovskogo', road: S.zhukovskogo },
  { name: 'Пушкинская улица · Pushkinskaya ulitsa', road: S.pushkinskaya },
  { name: 'Улица Восстания · Ulitsa Vosstaniya', road: S.vosstaniya },
  { name: 'Гончарная улица · Goncharnaya ulitsa', road: S.goncharnaya },
  { name: 'Улица Маяковского · Ulitsa Mayakovskogo', road: S.mayakovskogo },
  { name: 'Суворовский проспект · Suvorovsky Prospekt', road: S.suvorovsky },
  { name: 'Площадь Александра Невского · Alexander Nevsky Square', road: S.alexanderNevskySq },
  { name: 'Улица Александра Невского · Ulitsa Alexandra Nevskogo', road: S.alexanderNevskogo },
  { name: 'Проспект Обуховской Обороны · Prospekt Obukhovskoy Oborony', road: S.obukhovskoyOborony },
  { name: 'Синопская набережная · Sinopskaya embankment', road: S.sinopskayaNab },
  { name: 'Кременчугская улица · Kremenchugskaya ulitsa', road: S.kremenchugskaya },
  { name: 'Боровая улица · Borovaya ulitsa', road: S.borovaya },
  { name: 'Улица Черняховского · Ulitsa Chernyakhovskogo', road: S.chernyakhovskogo },
  { name: 'Днепропетровская улица · Dnepropetrovskaya ulitsa', road: S.dnepropetrovskaya },
  { name: 'Миргородская улица · Mirgorodskaya ulitsa', road: S.mirgorodskaya },
  { name: 'Улица Константина Заслонова · Ulitsa Konstantina Zaslonova', road: S.zaslonova },
  { name: 'Атаманская улица · Atamanskaya ulitsa', road: S.atamanskaya },
  { name: 'Коломенская улица · Kolomenskaya ulitsa', road: S.kolomenskaya },
  { name: 'Военная улица · Voennaya ulitsa', road: S.voennaya },
  { name: 'Бородинская улица · Borodinskaya ulitsa', road: S.borodinskaya },
  { name: 'Воронежская улица · Voronezhskaya ulitsa', road: S.voronezhskaya },
  { name: 'Тележная улица · Telezhnaya ulitsa', road: S.telezhnaya },
  { name: 'Полтавская улица · Poltavskaya ulitsa', road: S.poltavskaya },
  { name: 'Социалистическая улица · Sotsialisticheskaya ulitsa', road: S.sotsialisticheskaya },
  { name: 'Улица Правды · Ulitsa Pravdy', road: S.pravdy },
  { name: 'Свечной переулок · Svechnoy pereulok', road: S.svechnoy },
  { name: 'Роменская улица · Romenskaya ulitsa', road: S.romenskaya },
  { name: 'Караванная улица · Karavannaya ulitsa', road: S.karavannaya },
  { name: 'Улица Чехова · Ulitsa Chekhova', road: S.chekhova },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders: node tools/area.mjs vladimirsky tools/views-check.mjs).
  // x, z, yaw (deg, 0 = north, 90 = west), pitch (deg). Vladimirsky-Ligovka from the north-west to the south-east: 1 Vosstaniya Square and the station, 2 the obelisk, 3 Nevsky, 4 the platforms, 5 the Anichkov Bridge,
  // 6 the Vladimirsky Cathedral, 7 the Tolstoy House, 8 the Vladimirsky Passage, 9 the Lavra gate church, 0 Alexander Nevsky Square; the Places list only: the Alexandrinsky Theatre, the National Library, the Trinity Cathedral.
  const HERO = { x: -215, z: 438, yaw: yawToward(-215, 438, -165, 450), pitch: 14 };      // the Vladimirsky Cathedral and the bell tower from Vladimirsky Prospekt
  const VIEWS = [
    { key: 'Digit1', label: 'Площадь Восстания · Московский вокзал', x: 560, z: 192, yaw: yawToward(560, 192, 598, 235), pitch: 8 },
    { key: 'Digit2', label: 'Обелиск Городу-герою Ленинграду', x: 576, z: 209, yaw: yawToward(576, 209, 592, 165), pitch: 22 },
    { key: 'Digit3', label: 'Невский проспект', x: 502, z: 158, yaw: yawToward(502, 158, 380, 130), pitch: 4 },
    { key: 'Digit4', label: 'Платформы Московского вокзала', x: 644.8, z: 520, yaw: yawToward(644.8, 520, 700, 800), pitch: 3 },
    { key: 'Digit5', label: 'Аничков мост', x: -395, z: -108, yaw: yawToward(-395, -108, -470, -92), pitch: 6 },
    { key: 'Digit6', label: 'Владимирский собор и колокольня', x: -215, z: 438, yaw: yawToward(-215, 438, -165, 450), pitch: 14 },
    { key: 'Digit7', label: 'Толстовский дом · Фонтанка', x: -726, z: 292, yaw: yawToward(-726, 292, -615, 282), pitch: 6 },
    { key: 'Digit8', label: 'Владимирский пассаж · Достоевская', x: -217, z: 432, yaw: yawToward(-217, 432, -240, 440), pitch: 10 },
    { key: 'Digit9', label: 'Надвратная церковь Александро-Невской лавры', x: 1939, z: 996, yaw: yawToward(1939, 996, 1968, 1029), pitch: 10 },
    { key: 'Digit0', label: 'Площадь Александра Невского', x: 1940, z: 940, yaw: yawToward(1940, 940, 1983, 822), pitch: 6 },
    // the Places list only
    { key: 'Place.alexandrinsky', label: 'Александринский театр · площадь Островского', x: -800, z: 120, yaw: yawToward(-800, 120, -844, 70), pitch: 8 },
    { key: 'Place.library', label: 'Российская национальная библиотека · Фонтанка', x: -372, z: -300, yaw: yawToward(-372, -300, -334, -311), pitch: 8 },
    { key: 'Place.trinity', label: 'Троицкий собор Лавры', x: 2038, z: 1200, yaw: yawToward(2038, 1200, 2089, 1260), pitch: 12 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'r2404499', by: 'landmarksA', group: 'station' }, { id: 'r16492039', group: 'station' },      // the Moscow station and its clock tower
    { id: 'w1214651508', by: 'landmarksA', group: 'square' },                                              // the Vosstaniya obelisk
    { id: 'r8522850', by: 'landmarksA', group: 'galereya' },
    { id: 'r1784115', by: 'landmarksB', group: 'nevsky-centre' },
    { id: 'r15081493', by: 'landmarksB', group: 'atrium' },
    { id: 'w60196034', by: 'landmarksB', group: 'yusupova' },
    { id: 'r1588865', by: 'landmarksC', group: 'beloselsky' },
    { id: 'r3801087', by: 'landmarksD', group: 'library' },
    { id: 'w38611014', by: 'landmarksD', group: 'vladimirsky' }, { id: 'w38611013', group: 'vladimirsky' },      // the cathedral and its bell tower
    { id: 'r1588827', by: 'landmarksD', group: 'tolstoy' },
    { id: 'w70216607', by: 'landmarksD', group: 'dostoevsky' },
    { id: 'w28893849', by: 'landmarksE', group: 'alexandrinsky-theatre' },
    { id: 'r1517638', by: 'landmarksE', group: 'anichkov' },
    { id: 'w66519297', by: 'landmarksE', group: 'ostrovsky-houses' },
    { id: 'w96123542', by: 'landmarksNorthFull', group: 'north-podpisnye' },
    { id: 'r5677834', by: 'landmarksEast', group: 'east-lavra-gate' }, { id: 'w28808840', by: 'landmarksEast', group: 'east-trinity' }, { id: 'r6319253', by: 'landmarksEast', group: 'east-feodorovsky' },
    { id: 'r3132622', by: 'landmarksEast', group: 'east-hotel-moscow' },
  ],      // one row per landmark module and its main sub-groups
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Place.alexandrinsky', 'Place.library', 'Place.trinity'],
  mustHaveAreas: [
    { x: OBELISK.x, z: OBELISK.z, has: 'обелиск' }, { x: -441, z: -93, has: 'аничков' }, { x: STATION.x, z: STATION.z, has: 'вокзал' },
    { x: -165, z: 450, has: 'владимирский собор' }, { x: 1940, z: 978, has: 'александра невского' }, { x: -844, z: 70, has: 'александринский' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [SQUARE.x, SQUARE.z], r: 75, min: 3 },
};

// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3.1): what the strip's engine modules used to hard-code. Same names as src/world/area.js; the modules read them through src/world/lib/area-tables.js.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** Bridge crossings of the quay. Only the Anichkov Bridge needs a row (the module landmarksC draws it): the crossings of the south are bridges/sites-south.js sites (their quay openings come from the sites, environment/river.js
 *  bridgeZones), the bridge ways east of x 1000 are street-level slabs of eastBridges (auto zones, WATER.riverBridgeZones below). */
const BRIDGE_ZONES = [
  { id: 'anichkov', name: 'Аничков мост', key: 'fontanka', c: [-442, -92], axis: 100, w: 38, len: 55, own: true },
];

/**
 * WATER: the water tables of environment/waterways.js (docs/AREAS.md section 3.1)
 *   riverKeys           name of a RIVER record without a key -> the waterway key it is drawn as (the Obvodny canal is a canal in the Neva-style granite trench, as in the source project; the other areas leave it out: their data holds no
 *                       Obvodny polygon inside the play area, the water ring of Smolninskoye holds a piece that stays unbuilt)
 *   riverBridgeZones    the bridge road pieces (OSM bridge=yes) of eastBridges that cross these waterways make auto quay openings (environment/river.js)
 */
export const WATER = {
  plugs: [],
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: [],
  clipLines: [],
  farSources: ['neva-up'],      // the Neva upstream, the scenery ring the data does not reach (the bend at the east edge)
  farCenter: [800, 1100],
  farRadius: 6000,
  riverKeys: { 'Обводный канал': 'neva' },
  riverBridgeZones: ['neva'],
};

// ---------------------------------------------------------------- ZONES
// the station forecourt: 18 m in front of the clock tower base along the facade normal (bearing 348 deg: sin 0.208, cos 0.978)
const _FC = { x: STATION.tower.x - 0.208 * 18, z: STATION.tower.z - 0.978 * 18 };
const PIGEON_ZONES = [
  // ---- the station end (the strip's rows)
  { tag: 'obelisk', kind: 'pigeon', x: OBELISK.x, z: OBELISK.z, spread: 22, n: 2, w: 2, name: 'Голуби у обелиска · Pigeons at the obelisk', min: 11 },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x, z: _FC.z, spread: 12, n: 1, w: 1.6, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x + 25, z: _FC.z + 5, spread: 12, n: 1, w: 1.2, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'rotunda', kind: 'pigeon', x: 516, z: 92, spread: 12, n: 1, w: 1.2, r: 4, name: 'Голуби у вестибюля метро · Pigeons at the metro rotunda' },
  { tag: 'hotel', kind: 'pigeon', x: 648, z: -1, spread: 12, n: 1, w: 0.8, r: 4, name: 'Голуби у гостиницы · Pigeons at the hotel' },
  // ---- Vladimirskaya: the cathedral yard and the square before the Passage
  { tag: 'vladimirsky', kind: 'pigeon', x: -190, z: 440, spread: 22, n: 2, w: 1.8, r: 5, name: 'Голуби у Владимирского собора · Pigeons at the Vladimirsky Cathedral' },
  { tag: 'vladimirsky', kind: 'sparrow', x: -200, z: 480, spread: 16, n: 1, w: 1.4, r: 3, name: 'Воробьи у Владимирского собора · Sparrows at the Vladimirsky Cathedral' },
  // ---- Alexander Nevsky Square and the Lavra
  { tag: 'lavra', kind: 'pigeon', x: 1968, z: 1000, spread: 24, n: 2, w: 1.6, r: 5, name: 'Голуби у Александро-Невской лавры · Pigeons at the Alexander Nevsky Lavra' },
];
/** the districts a crow likes: the old limes of the Lavra necropolis, the cathedral yard of Vladimirskaya */
const CROW_HAUNTS = [{ x: 2040, z: 1250, r: 170 }, { x: -170, z: 450, r: 90 }];
const CROWDS = { obelisk: [45, 50, 0.6], forecourt: [32, 45, 0.6], rotunda: [18, 30, 0.5], vladimirsky: [30, 40, 0.55], lavra: [34, 45, 0.5] };
/** the Nevsky corridor weight along the grid axis u (people/zones.js nevskyU): [[u, weight], ...] ascending in u (the part of the strip's table that lies in this territory: Fontanka .. Vosstaniya Square) */
const PEOPLE_CORRIDOR = [[-1050, 0.8], [-880, 0.72], [-700, 0.95], [-500, 1.0], [-330, 1.15], [-100, 1.2], [60, 1.45], [200, 0.9]];
/** the hot spots of the zone weight field: [x, z, amplitude, sigma] or { u, d, a, s } = a spot in the station frame (people/zones.js) */
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
  [-186, 520, 1.5, 44],           // Vladimirskaya (metro, cathedral)
  [-250, 470, 1.2, 36],           // the Passage and the Dostoevsky monument
  [-860, 100, 1.4, 44],           // Ostrovsky Square: the Catherine monument side of the Alexandrinsky Theatre
  { u: -2, d: 40, a: 1.6, s: 24 },        // the station vestibule / hall (benches, kiosks, the Peter bust)
  { u: -2, d: 100, a: 1.3, s: 30 },      // the concourse under the departure boards
  { u: -12, d: 165, a: 0.9, s: 30 },    // the turnstiles and the apron
  [600, 470, 0.9, 40], [640, 520, 0.7, 55], [670, 620, 0.35, 70],   // the platform heads
  [1968, 1000, 1.8, 48],          // the Lavra gate and Alexander Nevsky Square
  [1940, 940, 1.0, 70],
];

export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [],
  // the Moscow-station zone as in the strip (the station lies in this territory); the scripted places of the strip's west (Kazan, Palace Square ... people/west.js) and of the castle (people/mars.js) stand at fixed
  // coordinates of the strip, so they are switched off
  peopleDensity: {
    station: { factor: 0.35, maxPeople: 330, radius: 220, fade: 80, rectRadius: 40, segments: [[592, 165, 612, 330]], rects: [[560, 400, 790, 1100]] },
    west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true },
  },
  peopleCorridor: PEOPLE_CORRIDOR,
  peopleHot: PEOPLE_HOT,
  tramLines: [],
  clearDiscs: [{ x: STATION.tower.x, z: STATION.tower.z + 20, r: 28 }],      // the station forecourt (Vosstaniya Square paving is an AREA already): keep trunks off the facade apron
  farCentres: [{ x: -600, z: 100, bias: 900 }],      // the old dense city (the centre north of Nevsky, Liteyny, the Admiralty district): dense stone blocks to the north and the west of the area
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station, which this territory contains (the strip's poses, verified free of lanes / buildings by tools/area-garage-check.mjs:
 * node tools/area.mjs vladimirsky tools/area-garage-check.mjs); an area without the station holds one car, the purple Zhiguli, at its spawn.
 */
export const GARAGE = {
  poses: {
    coupe: { x: 579, z: 219, yaw: 99 * DEG },
    truck: { x: 590.0, z: 224.0, yaw: 99 * DEG },
    lada: { x: 582.0, z: 228.0, yaw: 99 * DEG },
    roadster: { x: 596.0, z: 232.0, yaw: 99 * DEG },
  },
  spawn: { x: 579, z: 219, yaw: 99 * DEG },      // on the asphalt strip beside the station's taxi rank, facing east, toward Vosstaniya Square
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = ['city', 'landmarksA', 'landmarksB', 'landmarksC', 'landmarksD', 'landmarksNorthFull', 'landmarksEast'];
// The hook set (milestone M6, docs/AREAS.md section 9): hooks.js builds it from the module list above (a hook that serves a landmark module is dormant until the module is in MODULES).
import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list
/** the hooks of the engine modules (keep-outs of trees / tufts / props / ways / parking, the garden of the crowd cap, the deck services): src/areas/north/hooks.js documents the contract */
export const HOOKS = makeHooks(MODULES);
/** the height patches of layout.heightAt (the first patch that answers wins): none of the modules of this area has one */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

// ---------------------------------------------------------------- the places of the OTHER areas (milestone M7, docs/AREAS.md: core/gates.js, the HUD Places list)
/** CROSS_PLACES: places of the neighbour areas that the Places list offers; the edge gates between the live areas are added by the lead's integration step (docs/AREAS.md 14), so the table is empty for now. Not read by any world module. */
export const CROSS_PLACES = [];
