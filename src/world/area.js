// ============================================================================
//  AREA DEFINITION - the Nevsky strip (docs/AREAS.md). Everything in the engine that names WHAT the world is (as opposed to HOW it is built) and that differs between two areas lives
//  in an area module: this file for the strip (index.html), src/areas/<id>/area.js for another area (<id>.html remaps ./src/world/area.js to it with an import map).
//  layout.js re-exports these tables, so the whole engine keeps importing them from layout.js. PURE DATA: no three.js, no import of layout.js (layout.js imports this file);
//  the tables that need layout helpers are factories (makeAreas, makeViews) that layout.js calls with those helpers. The ENGINE TABLES at the end of the file (WATER, ZONES, GARAGE, PRUNE_SERVICES,
//  HOOKS, HEIGHT_PATCHES; docs/AREAS.md section 3.1) are NOT re-exported by layout.js: the modules read them through lib/area-tables.js, which fills what an area leaves out.
//  The rectangles and the OSM data of the area are NOT here: they come from the data facade (src/world/data/city.js, remapped the same way).
// ============================================================================
import { GROUPS_LIST as G_E } from './landmarksE/groups.js';
import { GROUPS_LIST as G_F } from './landmarksF/groups.js';
import { GROUPS_LIST as G_G } from './landmarksG/groups.js';
import { GROUPS_LIST as G_H } from './landmarksH/groups.js';
import { GROUPS_LIST as G_I } from './landmarksI/groups.js';
import { GROUPS_LIST as G_J } from './landmarksJ/groups.js';
import { GROUPS_LIST as G_K } from './landmarksK/groups.js';
import { GROUPS_LIST as G_BELINSKY } from './landmarksBelinsky/groups.js';
import { GROUPS_LIST as G_BR } from './bridges/groups.js';
import { GROUPS_LIST as G_NORTH } from './landmarksNorth/groups.js';
import { GROUPS_LIST as G_CASTLE } from './landmarksCastle/groups.js';
import { GROUPS_LIST as G_OKTYABRSKY } from './landmarksOktyabrsky/groups.js';
import { LIBRARY_GROUP } from './landmarksD/groups.js';

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'strip';
/** Where the baked products of this area live (relative to assets/): the strip keeps the original path, other areas use assets/baked/<id>/. */
export const BAKE_DIR = 'baked/';
/** True when the page must not fall back to a procedural build when its bake is missing or stale (set by the registry for areas reached by a hand-off). */
export const REQUIRE_BAKE = false;

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
    LIBRARY_GROUP,      // landmarksD/groups.js: the one sub-group the North claims too (src/areas/north/area.js)
    { key: 'vladimirsky', name: 'Владимирский собор и колокольня', nameEn: 'Vladimirsky Cathedral and bell tower', ids: ['w38611014', 'w38611013'], osm: [], at: [-160, 440], note: 'Vladimirsky pr. 20: ~40 m domes, ~60 m bell tower (OSM heights are the base only)' },
    { key: 'tolstoy', name: 'Толстовский дом · дом Рубинштейна', nameEn: 'Tolstoy House (Rubinshteyna 15-17) and Rubinshteyna 13', ids: ['r1588827', 'r368263'], osm: [], at: [-480, 330], note: 'corner tower; Zagorodny / Rubinshteyna corner' },
    { key: 'dostoevsky', name: 'Достоевская · Владимирская (улицы метро)', nameEn: 'Vladimirskaya square surroundings (Dostoevsky statue, Passage, Renaissance Hall)', ids: ['w70216607', 'w38578114'], osm: [], at: [-250, 470], note: 'Vladimirsky pr. 19 and 23' },
  ],
  // ---- metro: surface vestibules that are separate buildings (the rest of the metro is underground) --------------------------------------
  metro: [
    { key: 'vosstaniya-rotunda', name: 'Вестибюль метро «Площадь Восстания»', nameEn: 'Ploshchad Vosstaniya vestibule (1955 rotunda with a spire)', ids: ['w28962850'], osm: [], at: [516, 92], note: 'round colonnaded pavilion on the north side of the square (w310869151 is its roof part); the exit n318455870, entrance n318455877' },
  ],
};
// the specialist modules of the strip: each one owns the pure-data groups.js of its module
GROUPS.landmarksBelinsky = G_BELINSKY;
GROUPS.landmarksE = G_E; GROUPS.landmarksF = G_F; GROUPS.landmarksG = G_G; GROUPS.landmarksH = G_H; GROUPS.landmarksI = G_I; GROUPS.landmarksJ = G_J; GROUPS.landmarksK = G_K; GROUPS.bridges = G_BR;
// the north corridor of Nevsky (Podpisnye Izdaniya, the Mayakovskogo / Vosstaniya houses), Mikhailovsky Castle, Bolshoy Concert Hall Oktyabrsky
GROUPS.landmarksNorth = G_NORTH; GROUPS.landmarksCastle = G_CASTLE; GROUPS.landmarksOktyabrsky = G_OKTYABRSKY;

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
  { name: 'Аничков мост · Anichkov Bridge', c: [-441, -93], r: 42 },
  { name: 'Обелиск «Городу-герою Ленинграду» · Hero City obelisk', c: [592, 165], r: 24 },
  ..._groupPolys(SUBGROUPS.station, 12).map((r) => ({ name: 'Московский вокзал · Moscow Railway Station', ...r })),
  { name: 'Платформы Московского вокзала · Station platforms', x0: 560, x1: 780, z0: 420, z1: 1100 },
  ..._sqPolys.map((o) => ({ name: 'Площадь Восстания · Vosstaniya Square', poly: o })),
  ..._groupPolys(SUBGROUPS.oktyabrskaya, 8).map((r) => ({ name: 'Гостиница «Октябрьская» · Hotel Oktyabrskaya', ...r })),
  ..._groupPolys(SUBGROUPS['nevsky-centre'], 6).map((r) => ({ name: 'Невский Центр · Nevsky Centre', ...r })),
  ..._groupPolys(SUBGROUPS.beloselsky, 8).map((r) => ({ name: 'Дворец Белосельских-Белозерских · Beloselsky-Belozersky Palace', ...r })),
  ..._groupPolys(SUBGROUPS.anichkov, 10).map((r) => ({ name: 'Аничков дворец · Anichkov Palace', ...r })),
  ..._groupPolys(SUBGROUPS.vladimirsky, 10).map((r) => ({ name: 'Владимирский собор · Vladimirsky Cathedral', ...r })),
  ..._groupPolys(SUBGROUPS.library, 6).map((r) => ({ name: 'Российская национальная библиотека · National Library', ...r })),
  // ---- the west of the strip: sights (outline of the named OSM building + margin; the circle is the fallback when OSM has no such outline), squares, waterways, streets.
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
  ..._named(/Адмиралтейство|Главное адмиралтейство/i, 12, { c: [-2433, -622], r: 150 }).map((r) => ({ name: 'Адмиралтейство · Admiralty', ...r })),
  { name: 'Александровский сад · Alexander Garden', c: [-2400, -490], r: 105 },       // the view Shift + 7 stands in the garden (the Admiralty circle above is only the fallback when OSM has no outline, so the garden comes second)
  ..._named(/Зимний дворец/i, 10, { c: [-2096, -896], r: 110 }).map((r) => ({ name: 'Зимний дворец · Winter Palace', ...r })),
  ..._named(/Эрмитажный театр/i, 8, { c: [-1862, -1138], r: 50 }).map((r) => ({ name: 'Эрмитажный театр · Hermitage Theatre', ...r })),
  ..._named(/Эрмитаж/i, 8, null).map((r) => ({ name: 'Эрмитаж · The Hermitage', ...r })),
  ..._named(/Главный штаб|Здание Главного штаба/i, 10, null).map((r) => ({ name: 'Здание Главного штаба · General Staff Building', ...r })),
  ..._named(/Штаб Гвардейского корпуса/i, 10, null).map((r) => ({ name: 'Штаб Гвардейского корпуса · Guards Corps Headquarters', ...r })),
  { name: 'Александровская колонна · Alexander Column', c: [-1983, -738], r: 30 },
  ..._named(/Исаакиевский собор/i, 14, { c: [-2523, -185], r: 110 }).map((r) => ({ name: 'Исаакиевский собор · St Isaac\'s Cathedral', ...r })),
  ..._named(/Мариинский дворец/i, 10, null).map((r) => ({ name: 'Мариинский дворец · Mariinsky Palace', ...r })),
  ..._named(/Сенат(?!ор)|Синод/i, 10, { c: [-2815, -350], r: 60 }).map((r) => ({ name: 'Сенат и Синод · Senate and Synod', ...r })),
  { name: 'Медный всадник · Bronze Horseman', c: [-2744, -443], r: 40 },
  ..._areaPolys(/Дворцовая площадь/).map((o) => ({ name: 'Дворцовая площадь · Palace Square', poly: o, margin: 6 })),
  ..._areaPolys(/Исаакиевская площадь/).map((o) => ({ name: 'Исаакиевская площадь · St Isaac\'s Square', poly: o, margin: 6 })),
  ..._areaPolys(/Сенатская площадь|площадь Декабристов/).map((o) => ({ name: 'Сенатская площадь · Senate Square', poly: o, margin: 6 })),
  ..._areaPolys(/Казанская площадь/).map((o) => ({ name: 'Казанская площадь · Kazan Square', poly: o, margin: 6 })),
  ..._areaPolys(/площадь Островского/).map((o) => ({ name: 'Площадь Островского · Ostrovsky Square', poly: o, margin: 6 })),
  { name: 'Дворцовая площадь · Palace Square', c: [-2000, -740], r: 120 },
  { name: 'Исаакиевская площадь · St Isaac\'s Square', c: [-2470, -90], r: 120 },
  { name: 'Сенатская площадь · Senate Square', c: [-2730, -400], r: 90 },
  { name: 'Казанская площадь · Kazan Square', c: [-1568, -250], r: 90 },
  { name: 'Нева · Neva River', x0: -3020, x1: -1630, z0: -1420, z1: -300, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Зимняя канавка · Winter Canal', x0: -1950, x1: -1700, z0: -1180, z1: -880, test: (x, z) => _shoreOf(['winter-canal'], x, z) < 14 },
  { name: 'Мойка · Moika River', x0: -3020, x1: -720, z0: -1180, z1: 340, test: (x, z) => _shoreOf(['moika'], x, z) < 16 },
  { name: 'Канал Грибоедова · Griboedov Canal', x0: -1880, x1: -1180, z0: -1180, z1: 340, test: (x, z) => _shoreOf(['griboedov'], x, z) < 14 },
  { name: 'Лебяжья канавка · Swan Canal', x0: -1100, x1: -420, z0: -1300, z1: -900, test: (x, z) => _shoreOf(['swan-canal'], x, z) < 12 },
  { name: 'Фонтанка · Fontanka River', x0: -720, x1: -330, z0: -1180, z1: 330, test: (x, z) => shoreDist(x, z) < 14 },
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
  { name: 'Кузнечный переулок · Kuznechny pereulok', road: NAMES.streets.kuznechny },
  { name: 'Колокольная улица · Kolokolnaya ulitsa', road: NAMES.streets.kolokolnaya },
  { name: 'Улица Рубинштейна · Ulitsa Rubinshteyna', road: NAMES.streets.rubinsteina },
  { name: 'Загородный проспект · Zagorodny Prospekt', road: NAMES.streets.zagorodny },
  { name: 'Разъезжая улица · Razyezzhaya ulitsa', road: NAMES.streets.razyezzhaya },
  { name: 'Стремянная улица · Stremyannaya ulitsa', road: NAMES.streets.stremyannaya },
  { name: 'Большая Московская улица · Bolshaya Moskovskaya', road: NAMES.streets.bolshayaMoskovskaya },
  { name: 'Дворцовая набережная · Palace Embankment', road: NAMES.streets.dvortsovayaNab },
  { name: 'Адмиралтейская набережная · Admiralty Embankment', road: NAMES.streets.admiralteyskayaNab },
  { name: 'Английская набережная · English Embankment', road: NAMES.streets.angliyskayaNab },
  { name: 'Набережная Зимней канавки · Winter Canal embankment', road: NAMES.streets.winterCanalNab },
  { name: 'Набережная Лебяжьей канавки · Swan Canal embankment', road: NAMES.streets.swanCanalNab },
  { name: 'Набережная реки Мойки · Moika embankment', road: NAMES.streets.moika },
  { name: 'Набережная канала Грибоедова · Griboedov Canal embankment', road: NAMES.streets.griboedov },
  { name: 'Дворцовый проезд · Dvortsovy Proyezd', road: NAMES.streets.dvortsovyProezd },
  { name: 'Адмиралтейский проспект · Admiralteysky Prospekt', road: NAMES.streets.admiralteysky },
  { name: 'Вознесенский проспект · Voznesensky Prospekt', road: NAMES.streets.voznesensky },
  { name: 'Садовая улица · Sadovaya ulitsa', road: NAMES.streets.sadovaya },
  { name: 'Малая Садовая улица · Malaya Sadovaya ulitsa', road: NAMES.streets.malayaSadovaya },
  { name: 'Гороховая улица · Gorokhovaya ulitsa', road: NAMES.streets.gorokhovaya },
  { name: 'Большая Морская улица · Bolshaya Morskaya ulitsa', road: NAMES.streets.bolshayaMorskaya },
  { name: 'Малая Морская улица · Malaya Morskaya ulitsa', road: NAMES.streets.malayaMorskaya },
  { name: 'Большая Конюшенная улица · Bolshaya Konyushennaya ulitsa', road: NAMES.streets.bolshayaKonyushennaya },
  { name: 'Малая Конюшенная улица · Malaya Konyushennaya ulitsa', road: NAMES.streets.malayaKonyushennaya },
  { name: 'Миллионная улица · Millionnaya ulitsa', road: NAMES.streets.millionnaya },
  { name: 'Конногвардейский бульвар · Konnogvardeysky Boulevard', road: NAMES.streets.konnogvardeysky },
  { name: 'Почтамтская улица · Pochtamtskaya ulitsa', road: NAMES.streets.pochtamtskaya },
  { name: 'Казанская улица · Kazanskaya ulitsa', road: NAMES.streets.kazanskaya },
  { name: 'Инженерная улица · Inzhenernaya ulitsa', road: NAMES.streets.inzhenernaya },
  { name: 'Итальянская улица · Italyanskaya ulitsa', road: NAMES.streets.italyanskaya },
  { name: 'Михайловская улица · Mikhailovskaya ulitsa', road: NAMES.streets.mikhailovskaya },
  { name: 'Банковский переулок · Bankovsky pereulok', road: NAMES.streets.bankovsky },
  { name: 'Царицынский проезд · Tsaritsynsky Proyezd', road: NAMES.streets.tsaritsynsky },
  { name: 'Улица Якубовича · Ulitsa Yakubovicha', road: NAMES.streets.yakubovicha },
  { name: 'Галерная улица · Galernaya ulitsa', road: NAMES.streets.galernaya },
  { name: 'Дворцовая площадь · Palace Square', road: NAMES.streets.dvortsovayaSq },
  { name: 'Исаакиевская площадь · St Isaac\'s Square', road: NAMES.streets.isaakievskayaSq },
  { name: 'Сенатская площадь · Senate Square', road: NAMES.streets.senatskayaSq },
  { name: 'Площадь Островского · Ostrovsky Square', road: NAMES.streets.ostrovskogoSq },
  { name: 'Конюшенная площадь · Konyushennaya Square', road: NAMES.streets.konyushennayaSq },
  { name: 'Площадь Искусств · Arts Square', road: NAMES.streets.iskusstvSq },
  { name: 'Биржевая площадь · Birzhevaya Square', road: NAMES.streets.birzhevayaSq },
  { name: 'Казанская площадь · Kazan Square', road: NAMES.streets.kazanskayaSq },
  { name: 'Университетская набережная · Universitetskaya embankment', road: 'Университетская набережная' },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // ---------------------------------------------------------------- viewpoints (keys 1..0, Shift + 1..9, Alt + 1..5) and the hero camera
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // The strip from the Moscow station to the Admiralty: 1..5 the station end of Nevsky, 6..8 / 9 / 0 / Shift + 1..9 the sights of the centre and the west, Alt + 1..4 the metro entrances, Alt + 5 the castle;
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
    { key: 'ShiftDigit7', label: 'Адмиралтейство · Александровский сад', x: -2380, z: -470, yaw: yawToward(-2380, -470, -2433, -621), pitch: 10 },
    { key: 'ShiftDigit8', label: 'Исаакиевский собор', x: -2440, z: -60, yaw: yawToward(-2440, -60, -2523, -185), pitch: 12 },
    { key: 'ShiftDigit9', label: 'Медный всадник · Сенатская площадь', x: -2715, z: -425, yaw: yawToward(-2715, -425, -2745, -444), pitch: 6 },
    // the metro entrances (the seven stations of the strip; Alt + 5 is the castle below)
    { key: 'AltDigit1', label: 'Метро «Площадь Восстания» · ротонда', x: 534, z: 125, yaw: yawToward(534, 125, 516, 92), pitch: 10 },
    { key: 'AltDigit2', label: 'Метро «Маяковская» · Невский Атриум', x: 247, z: 109, yaw: yawToward(247, 109, 216, 115), pitch: 8 },
    { key: 'AltDigit3', label: 'Метро «Гостиный двор» · Невский проспект', x: -985, z: -210, yaw: yawToward(-985, -210, -976, -183), pitch: 6 },
    { key: 'AltDigit4', label: 'Метро «Невский проспект» · канал Грибоедова', x: -1340, z: -298, yaw: yawToward(-1340, -298, -1352, -339), pitch: 6 },
    { key: 'AltDigit5', label: 'Михайловский замок · памятник Петру I', x: -700, z: -715, yaw: yawToward(-700, -715, -745, -840), pitch: 10 },
    // the Places list only
    { key: 'Place.oktyabrsky', label: 'БКЗ «Октябрьский» · Лиговский проспект', x: 737.5, z: -344.3, yaw: -50.4, pitch: 8 },
    { key: 'Place.vladimirskaya-metro', label: 'Метро «Владимирская» · Кузнечный переулок', x: -185, z: 500, yaw: yawToward(-185, 500, -187, 532), pitch: 6 },
    { key: 'Place.circus', label: 'Цирк Чинизелли · Инженерная улица', x: -560, z: -620, yaw: yawToward(-560, -620, -569, -693), pitch: 10 },
    { key: 'Place.library', label: 'Российская национальная библиотека · Фонтанка', x: -372, z: -300, yaw: yawToward(-372, -300, -334, -311), pitch: 8 },
    { key: 'Place.alexandrinsky', label: 'Александринский театр · Екатерининский сад', x: -800, z: -95, yaw: yawToward(-800, -95, -844, 70), pitch: 8 },
    { key: 'Place.hermitage', label: 'Большой Эрмитаж · Дворцовая набережная', x: -2039, z: -1084, yaw: yawToward(-2039, -1084, -1985, -1050), pitch: 10 },
    { key: 'Place.admiralteyskaya-metro', label: 'Метро «Адмиралтейская» · Малая Морская', x: -2058, z: -438, yaw: yawToward(-2058, -438, -2029, -411), pitch: 6 },
  ];
  return { HERO, VIEWS };
}


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the strip places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value. The values below are the strip's, moved VERBATIM.
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
  { id: 'muchnoy', name: 'Мучной мост', key: 'griboedov', c: [-1691, 154], axis: 150, w: 4.5, len: 22, own: true },
  { id: 'italyansky', name: 'Итальянский мост', key: 'griboedov', c: [-1350, -540], axis: 102, w: 5, len: 19.7, own: true },
  { id: 'novo-konyushenny', name: 'Ново-Конюшенный мост', key: 'griboedov', c: [-1273, -921], axis: 101, w: 36, len: 21.1, own: true },
  { id: 'teatralny', name: 'Театральный мост', key: 'griboedov', c: [-1253.3, -1018.1], axis: 115.5, w: 15.6, len: 18, own: true },   // Triple Bridge, west part (dossier mars-bridges-canals.md 4.10)
  { id: 'green', name: 'Зелёный мост', key: 'moika', c: [-1768, -419], axis: 104, w: 39, len: 29.3, own: true },
  { id: 'pevchesky', name: 'Певческий мост', key: 'moika', c: [-1781, -845], axis: 94, w: 73, len: 30, own: true },
  { id: 'red', name: 'Красный мост', key: 'moika', c: [-2011, -63], axis: 143, w: 17, len: 22, own: true },
  { id: 'blue', name: 'Синий мост', key: 'moika', c: [-2368, 84], axis: 156, w: 98, len: 29.4, own: true },
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
  { id: 'kamenny', name: 'Каменный мост', key: 'griboedov', c: [-1800.4, 218.5], axis: 143, w: 13.9, len: 19.7, own: true },
  { id: 'pochtamtsky', name: 'Почтамтский мост', key: 'moika', c: [-2821.7, 214.3], axis: 166.3, w: 6, len: 41.9, own: true },
  { id: 'fonarny', name: 'Фонарный мост', key: 'moika', c: [-2651.5, 200.3], axis: 142.6, w: 20, len: 40, own: true },
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
  [-186, 520, 1.0, 40],           // Vladimirskaya (metro, cathedral)
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
  // ---- the ENGINEERING CASTLE reach (docs/research/mars-field.md S12; amplitudes are the weights of the west table x ~0.5: busy, but this is not Nevsky).
  //      The surfaces themselves carry a base weight (people/area.js); the spots below are the places people stop: the castle and the Peter I monument.
  [-712, -757, 2.2, 22], [-737, -824, 2.0, 22], [-737, -842, 1.2, 16], [-690, -790, 0.7, 40], [-778, -948, 1.0, 16],
  // ---- the PALACE BRIDGE (bridges/palace.js; the first ~170 m of the 255 m deck lie in the play area, the pavements carry the 'k' chains of people/nav.js nav.longs): the bank end (the lattice has to reach the
  //      pavements of the bridge head, or the chains hang in a stub of the pavement graph) and the stretches of the deck where people stop to look at the Neva. The deck weights are ~0.12-0.25 (the full-city table had 0.35-0.65 on a 255 m deck: the lanes of the pavements are 1.15 m wide between the barrier kerb and the lamp standards, and the strip has fewer pavements to share the crowd).
  [-2345, -883, 0.45, 26], [-2366, -922, 0.05, 26], [-2380, -950, 0.1, 30], [-2412, -992, 0.12, 28],
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
  // ---- the Alexander Garden, Senate Square, St Isaac's Square
  { tag: 'alexander', kind: 'pigeon', x: -2335, z: -494, spread: 18, n: 3, w: 3.0, r: 5, name: 'Голуби в Александровском саду · Pigeons in the Alexander Garden' },
  { tag: 'senate', kind: 'pigeon', x: -2745, z: -444, spread: 22, n: 1, w: 1.0, r: 4, min: 14, name: 'Голуби на Сенатской площади · Pigeons on Senate Square' },
  { tag: 'isaac', kind: 'pigeon', x: -2449, z: -63, spread: 20, n: 3, w: 2.6, r: 5, name: 'Голуби в сквере у Исаакия · Pigeons in St Isaac\'s garden' },
  { tag: 'isaac-monument', kind: 'pigeon', spread: 24, n: 1, w: 1.3, r: 4.5, min: 9, name: 'Голуби у памятника Николаю I · Pigeons at the Nicholas I monument',
    at: (ctx) => ctx.services.landmarksJ?.monuments?.find?.((m) => m.id === 'n1123474657') || { x: -2396, z: 35 } },
  // ---- sparrows: the gardens (the terraces are added by birds.js from the props module)
  { tag: 'kazan', kind: 'sparrow', x: -1481, z: -300, spread: 16, n: 1, w: 2, r: 3, name: 'Воробьи в Казанском сквере · Sparrows in the Kazan garden' },
  { tag: 'alexander', kind: 'sparrow', x: -2330, z: -520, spread: 16, n: 1, w: 2, r: 3, name: 'Воробьи в Александровском саду · Sparrows in the Alexander Garden' },
  { tag: 'isaac', kind: 'sparrow', x: -2440, z: -100, spread: 16, n: 1, w: 1.6, r: 3, name: 'Воробьи в сквере у Исаакия · Sparrows in St Isaac\'s garden' },
  { tag: 'catherine', kind: 'sparrow', x: -790, z: -128, spread: 16, n: 1, w: 1.5, r: 3, name: 'Воробьи в Екатерининском саду · Sparrows in the Catherine Garden' },
];
/** the districts a crow likes (the Alexander Garden limes, the Kazan and Isaac gardens): crows start on a tree top there when the player is not about. At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -2335, z: -500, r: 140 }, { x: -1469, z: -290, r: 90 }, { x: -2449, z: -63, r: 90 }, { x: -800, z: -105, r: 90 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] }; a pigeon zone whose tag is not listed gives no crowd */
const CROWDS = {
  column: [70, 70, 0.9], arch: [28, 40, 0.65], 'winter-palace': [45, 45, 0.65],
  kazan: [38, 55, 0.85], 'kazan-bench': [10, 25, 0.6], voronikhin: [18, 30, 0.5], 'kazan-nevsky': [22, 30, 0.6],
  gostiny: [60, 50, 0.7], catherine: [28, 35, 0.55], bridge: [22, 30, 0.6],
  alexander: [32, 45, 0.7], senate: [30, 40, 0.55], isaac: [38, 40, 0.6], 'isaac-monument': [24, 35, 0.5],
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
  fountains: [[-1469, -279, 0.8], [-2334.8, -494.8, 1.0]],      // the Kazan garden fountain and the Alexander Garden fountain (landmarksH garden.js)
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
    mars: { scale: 0.55, zones: [{ name: 'castle', maxPeople: 70 }] },
  },
  peopleCorridor: PEOPLE_CORRIDOR,
  peopleHot: PEOPLE_HOT,
  // the terminals in map metres: the track ends of the strip data, which are clipped at the data extent (tools/strip-data-clip.mjs). The strip holds two tram networks:
  // route 3 (Sadovaya - Apraksin Dvor - Gostiny Dvor - Italyanskaya - Mikhailovsky Castle - Letny Sad, both directions, from the Letny Sad end at the north edge to the Sadovaya end at the west edge of W1) and
  // the Marata / Ligovsky pair of routes 43 and 49, run from the north edge to the south edge (traffic/trams.js explains why the second one runs southbound only)
  tramLines: [
    { refs: ['3'], a: [-924, -1118], b: [-1456, 280], headway: 190 },
    { refs: ['43', '49'], a: [-175, -523], b: [197, 1178], headway: 300 },
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
  clipLines: [['x', -2670]],            // the seam of the removed S rectangles of the whole-city project: the clipped data still holds the Griboedov Canal polygon pieces 5:1 / 5:2 that meet at it (a clip line of the full city, not of the strip's EXTENT_RECTS)
  farSources: ['neva-up', 'neva-down', 'neva-malaya'],
  farCenter: [589, 173],                // Vosstaniya Square (SQUARE)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [[-2460.8, -1097.5, -2460.7, -1098.7]],      // the 1.2 m corner edge of the Neva polygon beside the Palace Bridge plug
  openMouths: [
    [-744, -1034.5, -757.4, -1054.4],      // the Moika leaves the Fontanka under the 1st Engineer Bridge
    [-859.3, -992, -849.4, -997.8],        // the Swan Canal ends on the long north edge of the Moika under the Lower Swan Bridge (the end edge of its polygon; environment/waterways.js splits the Moika edge at its ends)
  ],
  dataWater: [{ id: 'r15750440', key: 'moat' }],            // the castle moat (the data keeps it as a plain pond)
  slopeReaches: SLOPE_REACHES,
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE: where the drivable cars wait and where the player's car appears
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east) } }  a car without a pose is not built; an area with no pose at all has no drive module
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 * The strip: the coupe stays at its old spot on the station's taxi-rank service aisle (OSM way w569726648, highway=service: lane rank 0, which traffic/sim.js never drives); the pickup and the Zhiguli
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
export const PRUNE_SERVICES = ['city', 'landmarksA', 'landmarksB', 'landmarksC', 'landmarksD', 'landmarksNorth'];
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent): none in the strip */
export const HOOKS = {};
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9: `[{ id, box: [x0, x1, z0, z1], at(x, z) -> number | null }]`, the first non-null answer wins): none in the strip */
export const HEIGHT_PATCHES = [];

// ---------------------------------------------------------------- the places of the OTHER areas (milestone M7, docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name; a pick asks the gate question (core/gates.js offerPlace, via 'place') and the hand-off lands at this pose
 * instead of the gate's arrival rectangle. `{ key, label (Russian), area (the registry id), gate (a gate FROM this area TO that area), view (the VIEWS key of that area whose pose this copies:
 * tools/cross-places-test.mjs pins x, z, yaw, pitch to it and proves the pose with the predicates of views-check in that area), x, z, yaw (deg, 0 = north, 90 = west), pitch }`.
 * The North's rows copy src/areas/north/area.js makeViews (yaw to 2 decimals: what ?cam= carries). An empty table adds nothing to the list. Not read by any world module (the engine tables of lib/area-tables.js do not know it).
 */
export const CROSS_PLACES = [
  { key: 'smolny-cathedral', label: 'Смольный собор', area: 'north', gate: 'g1', view: 'Digit7', x: 2335, z: -1833, yaw: -90, pitch: 21 },
  { key: 'smolny-institute', label: 'Смольный институт', area: 'north', gate: 'g1', view: 'Digit8', x: 2461, z: -1471, yaw: -37.98, pitch: 8 },
  { key: 'tauride-gate', label: 'Таврический сад · южные ворота · Кирочная улица', area: 'north', gate: 'g1', view: 'Digit0', x: 1224, z: -1266, yaw: -173, pitch: 10 },
  { key: 'chernyshevskaya', label: 'Метро «Чернышевская»', area: 'north', gate: 'g1', view: 'Digit1', x: 444, z: -1351, yaw: -90, pitch: 10 },
  { key: 'preobrazhensky', label: 'Спасо-Преображенский собор', area: 'north', gate: 'g1', view: 'Digit2', x: 22, z: -1186, yaw: -95, pitch: 18 },
  { key: 'suvorov', label: 'Музей Суворова · Суворовский проспект', area: 'north', gate: 'g1', view: 'Digit9', x: 1395, z: -1180, yaw: -34.7, pitch: 8 },
];
