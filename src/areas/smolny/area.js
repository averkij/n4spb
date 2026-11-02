// ============================================================================
//  AREA DEFINITION - Smolninskoye (Смольнинское; docs/AREAS.md section 13): the second area of the world map (maps/intro-draft.html, area 96) with its walkable overlaps: Smolny (the cathedral and the
//  Institute), the Tauride Palace and Garden, the Paradny Quarter, the Suvorov Museum and Kirochnaya Street, Chernyshevskaya, Vosstaniya Square with the Moscow Railway Station, the Nevsky Centre, the
//  Oktyabrsky Concert Hall on Ligovsky Prospekt. 7.0 km2 of play rectangles (src/areas/registry.js REGISTRY.smolny.play, cut from the map outline by tools/area-shape.mjs), the data cut straight from the source
//  project by tools/area-data-cut.mjs.
//  It starts from the module of the old North (src/areas/north/area.js, now the PARKED area 'north'; its landmark modules are reused as they are) and adds the station end of Nevsky from the strip's module
//  (landmarksA, landmarksB, rail). Sights that lie in the neighbour area (Dom Muruzi, the Transfiguration Cathedral, the National Library, the church of Simeon and Anna) are not built here.
//  smolny.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file); the hook set (../north/hooks.js) is shared code, not an area module. The values that the engine reads from every area
//  (NAMES, SQUARE, OBELISK, STATION) are COPIES of the strip's: the style of a block follows its distance to SQUARE (city/archetypes.js, streets/style.js), so the same street looks the same in every area.
//  Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
// ============================================================================
// The claims of the landmark modules (M5): each groups.js is PURE DATA (ids and names) and is read by the module, by layout.js and by the tools.
import { GROUPS_LIST as G_NORTHFULL } from '../../world/landmarksNorthFull/groups.js';
import { GROUPS_LIST as G_SMOLNY } from '../../world/landmarksSmolny/groups.js';
import { GROUPS_LIST as G_SUVOROV } from '../../world/landmarksSuvorov/groups.js';
import { GROUPS_LIST as G_KIROCHNAYA } from '../../world/landmarksKirochnaya/groups.js';
import { GROUPS_LIST as G_TAURIDE } from '../../world/landmarksTauride/groups.js';
import { GROUPS_LIST as G_OKTYABRSKY, KAPODISTRIAS_GROUP } from '../../world/landmarksOktyabrsky/groups.js';
import { GROUPS_LIST as G_EAST } from '../../world/landmarksEast/groups.js';
import { GROUPS_LIST as G_EASTBRIDGES } from '../../world/eastBridges/groups.js';
import { GROUPS_LIST as G_NORTHBRIDGES } from '../../world/northBridges/groups.js';

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'smolny';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/smolny/';
/** A page reached by a hand-off: a missing or stale bake is an error card, never a minutes-long procedural build. */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No metro network (the surface rotunda of Vosstaniya is a generic building) and no Belinsky / library parts (the
 *  neighbour area). tools/modules-list.mjs parses this list from the file: keep one quoted name per line. */
export const MODULES = [
  'environment',  // ground, embankment granite, Fontanka / Neva water, trees, lawns, flowerbeds, far skyline
  'landmarksEast', // the eastern edge: the Lavra gate church, the Alexander Nevsky monument and Hotel Moscow on Alexander Nevsky Square (the rest of the Lavra lies beyond the territory: only 'east-lavra-gate' and 'east-hotel-moscow' are claimed); before streets / city, it claims its buildings
  'eastBridges',  // the Alexander Nevsky Bridge (clipped to the data of the area) and the Lavra / Obvodny canal crossings; before streets, it claims 21 bridge ways
  'landmarksNorthFull', // the Chernyshevskaya vestibule (the other sub-groups of the module lie in Palace-Liteyny: only 'north-chernyshevskaya' is claimed here)
  'landmarksSmolny', // Smolny Cathedral and the convent / Institute (docs/research/north-smolny.md)
  'landmarksSuvorov', // the Suvorov Memorial Museum on Kirochnaya (7 OSM footprints, mosaics, tower)
  'landmarksKirochnaya', // the Elena Pavlovna Clinical Institute, Kirochnaya 41: 20 OSM footprints, garden campus (lawn, service lanes, trees, fence); before streets, it claims 14 service ways
  'landmarksTauride', // the Tauride Palace and the Paradny Quarter (T1 of docs/TAURIDE-REMAKE.md), the garden (T2-T6), the nursery lot (T8b); before streets / city, it claims its sub-groups and switches the Paradny hooks on
  'northBridges', // the Bolsheokhtinsky Bridge over the Neva (raised steel-arch deck, 7 m, published as services.northBridges.deckY: cars, walkers and the wires read it); before streets / city, it claims its 8 mapped ways (the Liteyny deck lies in Palace-Liteyny: not claimed here)
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'rail',         // Moscow Railway Station tracks, platforms, canopies, catenary, signals, trains
  'landmarksA',   // Moscow Railway Station building + clock tower + Vosstaniya Square (obelisk, hotel Oktyabrskaya)
  'landmarksB',   // the Nevsky Centre (the Nevsky Atrium lies outside the territory and the other sub-groups lie in Palace-Liteyny: only 'nevsky-centre' is claimed here)
  'landmarksOktyabrsky', // Bolshoy Concert Hall Oktyabrsky on Ligovsky Prospekt and the Kapodistrias monument at the mouth of the Nekrasov Garden
  'props',        // benches, bins, kiosks, bus shelters, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, groups, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows + ambience triggers
  'drive',        // the cars at the Moscow station (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksSmolny: 'Смольный собор и институт',
  props: 'скамейки, урны и киоски', traffic: 'машины и троллейбусы', people: 'прохожие', drive: 'машины у Московского вокзала',
  landmarksNorthFull: 'Чернышевская',
  landmarksSuvorov: 'Музей Суворова',
  landmarksKirochnaya: 'Клинический институт на Кирочной',
  landmarksTauride: 'Таврический дворец и Парадный квартал',
  landmarksOktyabrsky: 'БКЗ «Октябрьский» и памятник Каподистрии',
  landmarksEast: 'Надвратная церковь Лавры · гостиница «Москва»', eastBridges: 'мост Александра Невского · мосты Лавры',
  northBridges: 'Большеохтинский мост',
};

export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: {
    // ---- the strip's names (a copy of src/world/area.js NAMES.streets: the 200 m band and the engine's lookups read them)
    nevsky: 'Невский проспект', ligovsky: 'Лиговский проспект', mayakovskogo: 'улица Маяковского', marata: 'улица Марата', vladimirsky: 'Владимирский проспект',
    liteyny: 'Литейный проспект', fontanka: 'набережная реки Фонтанки', zhukovskogo: 'улица Жуковского', pushkinskaya: 'Пушкинская улица', vosstaniya: 'улица Восстания',
    goncharnaya: 'Гончарная улица', suvorovsky: 'Суворовский проспект', kuznechny: 'Кузнечный переулок', kolokolnaya: 'Колокольная улица', rubinsteina: 'улица Рубинштейна',
    zagorodny: 'Загородный проспект', razyezzhaya: 'Разъезжая улица', stremyannaya: 'Стремянная улица', bolshayaMoskovskaya: 'Большая Московская улица',
    sadovaya: 'Садовая улица', malayaSadovaya: 'Малая Садовая улица', gorokhovaya: 'Гороховая улица', bolshayaMorskaya: 'Большая Морская улица', malayaMorskaya: 'Малая Морская улица',
    bolshayaKonyushennaya: 'Большая Конюшенная улица', malayaKonyushennaya: 'Малая Конюшенная улица', admiralteysky: 'Адмиралтейский проспект', voznesensky: 'Вознесенский проспект',
    moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова', dvortsovayaNab: 'Дворцовая набережная', admiralteyskayaNab: 'Адмиралтейская набережная',
    angliyskayaNab: 'Английская набережная', universitetskayaNab: 'Университетская набережная', winterCanalNab: 'набережная Зимней канавки', swanCanalNab: 'набережная Лебяжьей канавки',
    millionnaya: 'Миллионная улица', dvortsovyProezd: 'Дворцовый проезд', konnogvardeysky: 'Конногвардейский бульвар', pochtamtskaya: 'Почтамтская улица',
    kazanskaya: 'Казанская улица', inzhenernaya: 'Инженерная улица', italyanskaya: 'Итальянская улица', mikhailovskaya: 'Михайловская улица', bankovsky: 'Банковский переулок',
    tsaritsynsky: 'Царицынский проезд', yakubovicha: 'улица Якубовича', galernaya: 'Галерная улица',
    dvortsovayaSq: 'Дворцовая площадь', isaakievskayaSq: 'Исаакиевская площадь', senatskayaSq: 'Сенатская площадь', ostrovskogoSq: 'площадь Островского', konyushennayaSq: 'Конюшенная площадь',
    iskusstvSq: 'площадь Искусств', birzhevayaSq: 'Биржевая площадь', kazanskayaSq: 'Казанская площадь',
    // ---- the old North's streets (names exactly as in OSM, ROADS[].name; the main roads by length inside the play rectangles of the OLD North, m: Shpalernaya 4948, Liteyny 3622 (Palace-Liteyny: no HUD row here), Kirochnaya 3341,
    //      Voskresenskaya embankment 2272, Furshtatskaya 2135, Vosstaniya 1998, Nekrasova 1906, Zhukovskogo 1817, Zakharyevskaya 1663, Potemkinskaya 1436, Chaikovskogo 1381, Tavricheskaya 1345, Chernyshevskogo 1306 ...)
    shpalernaya: 'Шпалерная улица', kirochnaya: 'Кирочная улица', voskresenskayaNab: 'Воскресенская набережная', furshtatskaya: 'Фурштатская улица', nekrasova: 'улица Некрасова',
    zakharyevskaya: 'Захарьевская улица', potemkinskaya: 'Потёмкинская улица', chaikovskogo: 'улица Чайковского', tavricheskaya: 'Таврическая улица', chernyshevskogo: 'проспект Чернышевского',
    tverskaya: 'Тверская улица', lafonskaya: 'Лафонская улица', mokhovaya: 'Моховая улица', baskov: 'Басков переулок', radishcheva: 'улица Радищева', kavalergardskaya: 'Кавалергардская улица',
    kutuzovaNab: 'набережная Кутузова', smolnogo: 'улица Смольного', smolnyProspekt: 'Смольный проспект', ryleeva: 'улица Рылеева', paradnaya: 'Парадная улица', pestelya: 'улица Пестеля',
    korolenko: 'улица Короленко', chekhova: 'улица Чехова', tavricheskyPereulok: 'Таврический переулок', preobrazhenskayaSq: 'Преображенская площадь', proletarskoyDiktatury: 'площадь Пролетарской Диктатуры',
    // ---- the east and south-east of the territory (names exactly as in OSM, ROADS[].name of src/areas/smolny/data; the long streets by length inside the play rectangles, m: Sinopskaya embankment 6040, Novgorodskaya 3021,
    //      Mytninskaya 2002, 8th Sovetskaya 1959, Bakunina 1927, Khersonskaya 1831, Moiseenko 1758, Degtyarny pereulok 1466, Tulskaya 1378, Grecheskiy 1317, Degtyarnaya 1057, Ispolkomskaya 921 ...)
    sinopskayaNab: 'Синопская набережная', novgorodskaya: 'Новгородская улица', mytninskaya: 'Мытнинская улица', bakunina: 'проспект Бакунина', khersonskaya: 'Херсонская улица', moiseenko: 'улица Моисеенко',
    degtyarnyPereulok: 'Дегтярный переулок', tulskaya: 'Тульская улица', grecheskiy: 'Греческий проспект', degtyarnaya: 'Дегтярная улица', ispolkomskaya: 'Исполкомская улица',
    maloohtinskayaNab: 'Малоохтинская набережная', kirillovskaya: 'Кирилловская улица', krasnogoTekstilshchika: 'улица Красного Текстильщика', ambarnaya: 'Амбарная улица', poltavskaya: 'Полтавская улица',
    konnaya: 'Конная улица', obukhovskoyOborony: 'проспект Обуховской Обороны',
  },
};

// ---------------------------------------------------------------- the local frames: the anchors are the strip's (see the header: the band stays identical on both pages)
/** Vosstaniya Square (589, 173): the origin of the street grid (toGrid / fromGrid) and the centre of the far scenery; 1.2 km south of the old North's south edge. */
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

// ---------------------------------------------------------------- landmark groups
/** The landmark claims of Smolninskoye (the old North's M5 tables, docs/AREAS.md section 8, plus the station end): module name -> sub-groups { key, name, nameEn, ids, osm, at }. `city` / `environment` / `streets` skip what a group claims (src/world/lib/claims.js).
 *  T1 of the Tauride remake added landmarksTauride: the Palace and the Paradny quarter; T2 added its third sub-group, the garden (the park, 23 woods, the 120 ways, 132 benches, 167 bins: the generic city stops drawing them). */
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
  // ---- landmarksB: only the Nevsky Centre; the Nevsky Atrium (r15081493, Nevsky 71) lies wholly outside this territory (x 159..222, z 86..157, west of S27) and is built by Palace-Liteyny; the other sub-groups lie in Palace-Liteyny ----------
  landmarksB: [
    { key: 'nevsky-centre', name: 'ТЦ «Невский Центр»', nameEn: 'Nevsky Centre (Nevsky 114-116)', ids: ['r1784115'], osm: [], at: [443, 39], note: 'shopping centre at Ligovsky, 6 levels' },
  ],
};
GROUPS.landmarksNorthFull = G_NORTHFULL.filter((g) => g.key === 'north-chernyshevskaya');      // the vestibule only; Dom Muruzi, the cathedral, the bookstore and the corridor houses lie in Palace-Liteyny
GROUPS.landmarksSmolny = G_SMOLNY;
GROUPS.landmarksSuvorov = G_SUVOROV;
GROUPS.landmarksKirochnaya = G_KIROCHNAYA;
GROUPS.landmarksTauride = G_TAURIDE;      // T1: the Tauride Palace r3801092 and the Paradny quarter; T2: the garden (osm ids: park, woods, ways, benches, bins); T8b: the nursery
GROUPS.landmarksEast = G_EAST.filter((g) => g.key === 'east-lavra-gate' || g.key === 'east-hotel-moscow');      // the Lavra gate church r5677834 (1968, 1029) and Hotel Moscow r3132622 (1983, 822); the Trinity Cathedral, the Lavra wings and the Feodorovsky Cathedral lie beyond the territory
GROUPS.eastBridges = G_EASTBRIDGES;      // the 21 bridge ways of the east (the group's osm list is computed from this area's ROADS: the Alexander Nevsky Bridge, the Monastyrka / Obvodny canal / Lavra crossings)
GROUPS.northBridges = G_NORTHBRIDGES.filter((g) => g.osm.length);      // only the sub-groups with mapped ways in THIS data: 'north-bolsheokhtinsky' (8 ways at (2622, -1150)); 'north-liteyny' has none here (it lies in Palace-Liteyny)
GROUPS.landmarksOktyabrsky = [...G_OKTYABRSKY, KAPODISTRIAS_GROUP];      // the concert hall w30324279 (797, -347) and the Kapodistrias monument n1372027612 (797, -461)

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _sqPolys, _groupPolys, _shoreOf, inRiver } = h;
  const S = NAMES.streets;
  return [
  // ---- the sights of the old North that lie in this territory (centres and radii from the source layout, docs/research/north-*.md) ----------------------------------------------------------------------------------------------------
  { name: 'Смольный собор · Smolny Cathedral', c: [2469, -1833], r: 140 },
  { name: 'Смольный институт · Smolny Institute', c: [2518, -1544], r: 115 },
  { name: 'Таврический дворец · Tauride Palace', c: [1379, -1734], r: 95 },
  { name: 'Таврический сад · Tauride Garden', x0: 910, x1: 1500, z0: -1785, z1: -1250 },
  { name: 'Парадный квартал · Paradny Quarter', x0: 790, x1: 1120, z0: -1170, z1: -820 },
  { name: 'Музей А. В. Суворова · Suvorov Museum', c: [1413, -1206], r: 45 },
  { name: 'Клинический институт Елены Павловны · Elena Pavlovna Clinical Institute', x0: 1110, x1: 1343, z0: -1245, z1: -1047 },
  { name: 'Чернышевская · Chernyshevskaya', c: [467, -1351], r: 55 },
  // ---- the station end of Nevsky (the strip's rows) ----------------------------------------------------------------------------------------------------------------------------------
  { name: 'Обелиск «Городу-герою Ленинграду» · Hero City obelisk', c: [592, 165], r: 24 },
  ..._groupPolys(SUBGROUPS.station, 12).map((r) => ({ name: 'Московский вокзал · Moscow Railway Station', ...r })),
  { name: 'Платформы Московского вокзала · Station platforms', x0: 560, x1: 780, z0: 420, z1: 1100 },
  ..._sqPolys.map((o) => ({ name: 'Площадь Восстания · Vosstaniya Square', poly: o })),
  ..._groupPolys(SUBGROUPS.oktyabrskaya, 8).map((r) => ({ name: 'Гостиница «Октябрьская» · Hotel Oktyabrskaya', ...r })),
  ..._groupPolys(SUBGROUPS['nevsky-centre'], 6).map((r) => ({ name: 'Невский Центр · Nevsky Centre', ...r })),
  // ---- the Oktyabrsky Concert Hall (the strip's row in the old 200 m band, z -405 .. -205) -----------------------------------------------------------------------------------------------------------------------------
  { name: 'БКЗ «Октябрьский» · Oktyabrsky Concert Hall', c: [797, -347], r: 55 },
  // ---- the east: Alexander Nevsky Square with the Lavra gate church and the monument, Hotel Moscow, the bridge (rows of the source layout)
  ..._groupPolys(SUBGROUPS['east-hotel-moscow'], 8).map((r) => ({ name: 'Гостиница «Москва» · Hotel Moscow', ...r })),
  { name: 'Площадь Александра Невского · Alexander Nevsky Square', c: [1940, 978], r: 95 },
  { name: 'Александро-Невская лавра · Alexander Nevsky Lavra', x0: 1870, x1: 2195, z0: 1100, z1: 1440 },
  { name: 'Мост Александра Невского · Alexander Nevsky Bridge', road: 'мост Александра Невского' },
  { name: 'Большеохтинский мост · Bolsheokhtinsky Bridge', road: 'Большеохтинский мост' },
  // ---- the waterways: the Neva along the north edge (the play edge is partly in the water; the Fontanka lies in Palace-Liteyny, west of this territory)
  { name: 'Нева · Neva River', x0: -600, x1: 3100, z0: -2800, z1: -1750, test: (x, z) => _shoreOf(['neva'], x, z) < 8 || inRiver(x, z) },
  // ---- the streets (names exactly as in OSM) ---------------------------------------------------------------------------------------------------------------------------------------------------------
  { name: 'Шпалерная улица · Shpalernaya ulitsa', road: S.shpalernaya },
  { name: 'Кирочная улица · Kirochnaya ulitsa', road: S.kirochnaya },
  { name: 'Воскресенская набережная · Voskresenskaya embankment', road: S.voskresenskayaNab },
  { name: 'Фурштатская улица · Furshtatskaya ulitsa', road: S.furshtatskaya },
  { name: 'Суворовский проспект · Suvorovsky Prospekt', road: S.suvorovsky },
  { name: 'Улица Восстания · Ulitsa Vosstaniya', road: S.vosstaniya },
  { name: 'Улица Некрасова · Ulitsa Nekrasova', road: S.nekrasova },
  { name: 'Улица Жуковского · Ulitsa Zhukovskogo', road: S.zhukovskogo },
  { name: 'Захарьевская улица · Zakharyevskaya ulitsa', road: S.zakharyevskaya },
  { name: 'Потёмкинская улица · Potemkinskaya ulitsa', road: S.potemkinskaya },
  { name: 'Улица Чайковского · Ulitsa Chaikovskogo', road: S.chaikovskogo },
  { name: 'Таврическая улица · Tavricheskaya ulitsa', road: S.tavricheskaya },
  { name: 'Проспект Чернышевского · Prospekt Chernyshevskogo', road: S.chernyshevskogo },
  { name: 'Тверская улица · Tverskaya ulitsa', road: S.tverskaya },
  { name: 'Улица Маяковского · Ulitsa Mayakovskogo', road: S.mayakovskogo },
  { name: 'Лафонская улица · Lafonskaya ulitsa', road: S.lafonskaya },
  { name: 'Басков переулок · Baskov pereulok', road: S.baskov },
  { name: 'Улица Радищева · Ulitsa Radishcheva', road: S.radishcheva },
  { name: 'Лиговский проспект · Ligovsky Prospekt', road: S.ligovsky },
  { name: 'Кавалергардская улица · Kavalergardskaya ulitsa', road: S.kavalergardskaya },
  { name: 'Площадь Пролетарской Диктатуры · Proletarskoy Diktatury Square', road: S.proletarskoyDiktatury },
  { name: 'Улица Смольного · Ulitsa Smolnogo', road: S.smolnogo },
  { name: 'Смольный проспект · Smolny Prospekt', road: S.smolnyProspekt },
  { name: 'Улица Рылеева · Ulitsa Ryleeva', road: S.ryleeva },
  { name: 'Таврический переулок · Tavrichesky pereulok', road: S.tavricheskyPereulok },
  { name: 'Парадная улица · Paradnaya ulitsa', road: S.paradnaya },
  // ---- Nevsky and the streets of the station end, the long streets of the east and south-east (the HUD probe: more than half of the road samples of the territory fell to the city row without them)
  { name: 'Невский проспект · Nevsky Prospekt', road: S.nevsky },
  { name: 'Улица Марата · Ulitsa Marata', road: S.marata },
  { name: 'Гончарная улица · Goncharnaya ulitsa', road: S.goncharnaya },
  { name: 'Синопская набережная · Sinopskaya embankment', road: S.sinopskayaNab },
  { name: 'Новгородская улица · Novgorodskaya ulitsa', road: S.novgorodskaya },
  { name: 'Мытнинская улица · Mytninskaya ulitsa', road: S.mytninskaya },
  { name: 'Проспект Бакунина · Prospekt Bakunina', road: S.bakunina },
  { name: 'Херсонская улица · Khersonskaya ulitsa', road: S.khersonskaya },
  { name: 'Улица Моисеенко · Ulitsa Moiseenko', road: S.moiseenko },
  { name: 'Дегтярный переулок · Degtyarny pereulok', road: S.degtyarnyPereulok },
  { name: 'Дегтярная улица · Degtyarnaya ulitsa', road: S.degtyarnaya },
  { name: 'Тульская улица · Tulskaya ulitsa', road: S.tulskaya },
  { name: 'Греческий проспект · Grecheskiy Prospekt', road: S.grecheskiy },
  { name: 'Исполкомская улица · Ispolkomskaya ulitsa', road: S.ispolkomskaya },
  { name: 'Малоохтинская набережная · Maloohtinskaya embankment', road: S.maloohtinskayaNab },
  { name: 'Кирилловская улица · Kirillovskaya ulitsa', road: S.kirillovskaya },
  { name: 'Улица Красного Текстильщика · Ulitsa Krasnogo Tekstilshchika', road: S.krasnogoTekstilshchika },
  { name: 'Амбарная улица · Ambarnaya ulitsa', road: S.ambarnaya },
  { name: 'Полтавская улица · Poltavskaya ulitsa', road: S.poltavskaya },
  { name: 'Конная улица · Konnaya ulitsa', road: S.konnaya },
  { name: 'Проспект Обуховской Обороны · Prospekt Obukhovskoy Oborony', road: S.obukhovskoyOborony },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ name: `${n}-я Советская улица · ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} Sovetskaya ulitsa`, road: `${n}-я Советская улица` })),
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders: node tools/area.mjs smolny tools/views-check.mjs).
  // x, z, yaw (deg, 0 = north, 90 = west), pitch (deg). Smolninskoye from the south-west to the north-east: 1 Chernyshevskaya (the start), 2 Vosstaniya Square and the Moscow station, 3 the station platforms, 4 the Paradny Quarter,
  // 5 the Tauride Garden, 6 the Tauride Palace, 7 / 8 Smolny, 9 the Suvorov Museum, 0 Kirochnaya Street; the Places list only: the Oktyabrsky hall on Ligovsky Prospekt. (Dom Muruzi and the Transfiguration Cathedral lie in Palace-Liteyny: CROSS_PLACES.)
  const HERO = { x: 444, z: -1351, yaw: -90, pitch: 10 };      // Chernyshevskaya: the vestibule of the metro station, looking east
  const VIEWS = [
    { key: 'Digit1', label: 'Чернышевская', x: 444, z: -1351, yaw: -90, pitch: 10 },
    { key: 'Digit2', label: 'Площадь Восстания · Московский вокзал', x: 560, z: 192, yaw: yawToward(560, 192, 598, 235), pitch: 8 },
    { key: 'Digit3', label: 'Платформы Московского вокзала', x: 644.8, z: 520, yaw: yawToward(644.8, 520, 700, 800), pitch: 3 },
    { key: 'Digit4', label: 'Парадный квартал', x: 900, z: -852, yaw: 0, pitch: 16 },       // T1: was ON the podium (915, -1010): the height patch makes it 3.3 m, views-check allows -0.5 .. 1.5; now street level on the south side, looking up the central axis between the two south blocks
    { key: 'Digit5', label: 'Таврический сад', x: 1368, z: -1471, yaw: -4, pitch: 2 },       // T1: was (1390, -1457) on the deck of bridge w81524417; now on w1458068089 at the north end of the memorial island, 8 m from the water (docs/TAURIDE-REMAKE.md section 8)
    { key: 'Digit6', label: 'Таврический дворец', x: 1379, z: -1800, yaw: 180, pitch: 8 },       // T1: was (1379, -1600) in the lake; now in the palace front court, 48 m from the portico (docs/TAURIDE-REMAKE.md section 8)
    { key: 'Digit7', label: 'Смольный собор', x: 2335, z: -1833, yaw: -90, pitch: 21 },
    { key: 'Digit8', label: 'Смольный институт', x: 2461, z: -1471, yaw: yawToward(2461, -1471, 2518, -1544), pitch: 8 },
    { key: 'Digit9', label: 'Музей Суворова · Суворовский проспект', x: 1395, z: -1180, yaw: yawToward(1395, -1180, 1413, -1206), pitch: 8 },
    { key: 'Digit0', label: 'Кирочная улица', x: 1224, z: -1266, yaw: -173, pitch: 10 },       // T1: was (1225, -1243) yaw 180, 5 m from the facade of w232918735 (a wall close-up, M5 GPU QA); now across the street, 28 m from it, looking at the house church
    // the Places list only
    { key: 'Place.oktyabrsky', label: 'БКЗ «Октябрьский» · Лиговский проспект', x: 737.5, z: -344.3, yaw: -50.4, pitch: 8 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs): the rows of the old North's TEST that lie in this territory, plus the station end and the east. */
export const TEST = {
  claimed: [
    { id: 'w22999175', by: 'landmarksNorthFull', group: 'north-chernyshevskaya' },      // the Chernyshevskaya vestibule
    { id: 'r2864743', by: 'landmarksSmolny', group: 'north-smolny-cathedral' },
    { id: 'r2133719', by: 'landmarksSmolny', group: 'north-smolny-ensemble' },
    { id: 'w30198549', by: 'landmarksSuvorov', group: 'north-suvorov-museum' },          // the Suvorov Museum (the museum record)
    { id: 'w232918746', by: 'landmarksSuvorov', group: 'north-suvorov-museum' },         // the Suvorov Museum (the main block, Digit9 looks at it)
    { id: 'r3127704', by: 'landmarksKirochnaya', group: 'kirochnaya-clinical-institute' },
    { id: 'w30324355', by: 'landmarksKirochnaya', group: 'kirochnaya-clinical-institute' },
    { id: 'w30324279', by: 'landmarksOktyabrsky', group: 'oktyabrsky-hall' },
    { id: 'n1372027612', by: 'landmarksOktyabrsky', group: 'kapodistrias' },      // the Kapodistrias monument
    { id: 'r3801092', by: 'landmarksTauride', group: 'tauride-palace' },                  // the Tauride Palace
    { id: 'w102153008', by: 'landmarksTauride', group: 'paradny-quarter' }, { id: 'w102153013', by: 'landmarksTauride', group: 'paradny-quarter' }, { id: 'w145419644', by: 'landmarksTauride', group: 'paradny-quarter' },
    { id: 'r1582734', by: 'landmarksTauride', group: 'tauride-garden' }, { id: 'w1458068121', by: 'landmarksTauride', group: 'tauride-garden' }, { id: 'w425188838', by: 'landmarksTauride', group: 'tauride-garden' },
    { id: 'r2404499', by: 'landmarksA', group: 'station' }, { id: 'w1214651508', by: 'landmarksA', group: 'square' },      // the station end of Nevsky: the Moscow station, the obelisk
    { id: 'r1784115', by: 'landmarksB', group: 'nevsky-centre' },
    { id: 'r5677834', by: 'landmarksEast', group: 'east-lavra-gate' }, { id: 'r3132622', by: 'landmarksEast', group: 'east-hotel-moscow' },      // the east: the Lavra gate church, Hotel Moscow
  ],
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Place.oktyabrsky'],
  mustHaveAreas: [
    { x: 467, z: -1351, has: 'чернышевская' }, { x: 2469, z: -1833, has: 'смольный собор' }, { x: 1379, z: -1734, has: 'таврический дворец' }, { x: 1000, z: -1000, has: 'парадный' },
    { x: 592, z: 165, has: 'обелиск' }, { x: 612, z: 300, has: 'вокзал' }, { x: 1940, z: 978, has: 'александра невского' },
    { x: 178, z: 69, has: 'невский проспект' }, { x: 2613, z: -1307, has: 'синопская' }, { x: 1043, z: -713, has: 'греческий' },      // the street rows of the east, the south-east and Nevsky (each fell to the city row before)
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies all the landmark modules against the data of this area
  roadsNear: { at: [461, -1350], r: 75, min: 3 },
};

// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3.1): what the strip's engine modules used to hard-code. Same names as src/world/area.js; the modules read them through src/world/lib/area-tables.js.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/**
 * Smolninskoye has no bridge crossings of its quay that need a gap: the Belinsky Bridge deck lies in Palace-Liteyny, and the Bolsheokhtinsky deck (module northBridges) crosses the Neva 7 m above the
 * water: its underside (5.9 m) clears the granite wall and the parapet of the Neva quay (top 1.25 m) at both banks (x 2635 and 2957), so it needs no BRIDGE_ZONES row (a non-auto row would also lay an invisible
 * fallback deck at y 0 over the river: quay.js). The source has no row for it either (its east / north bridges got automatic zones from river.js, which this engine does not have). So no plugs, bridge zones,
 * shades or clip lines. The Neva runs beyond the north edge ('neva-up' = the river upstream of the Palace Bridge, the scenery ring the data does not reach).
 * The far window is centred on the middle of this territory's extent.
 */
export const WATER = {
  plugs: [],
  bridgeZones: [],
  bridgeShades: [],
  clipLines: [],
  farSources: ['neva-up'],
  farCenter: [1100, -1100],
  farRadius: 6000,
};

// ---------------------------------------------------------------- ZONES
// the station forecourt: 18 m in front of the clock tower base along the facade normal (bearing 348 deg: sin 0.208, cos 0.978)
const _FC = { x: STATION.tower.x - 0.208 * 18, z: STATION.tower.z - 0.978 * 18 };
const PIGEON_ZONES = [
  { tag: 'chernyshevskaya', kind: 'pigeon', x: 461, z: -1350, spread: 22, n: 2, w: 2.0, r: 4.5, name: 'Голуби у метро «Чернышевская» · Pigeons at Chernyshevskaya metro' },
  { tag: 'tauride-gate', kind: 'pigeon', x: 1226, z: -1268, spread: 24, n: 2, w: 2.2, r: 5, name: 'Голуби у входа в Таврический сад · Pigeons at the Tauride Garden gate' },
  { tag: 'smolny', kind: 'pigeon', x: 2425, z: -1833, spread: 24, n: 1, w: 1.5, r: 5, name: 'Голуби у Смольного собора · Pigeons at Smolny Cathedral' },
  // ---- the station end (the strip's rows)
  { tag: 'obelisk', kind: 'pigeon', x: OBELISK.x, z: OBELISK.z, spread: 22, n: 2, w: 2, name: 'Голуби у обелиска · Pigeons at the obelisk', min: 11 },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x, z: _FC.z, spread: 12, n: 1, w: 1.6, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'forecourt', kind: 'pigeon', x: _FC.x + 25, z: _FC.z + 5, spread: 12, n: 1, w: 1.2, name: 'Голуби на привокзальной площади · Pigeons on the station forecourt' },
  { tag: 'rotunda', kind: 'pigeon', x: 516, z: 92, spread: 12, n: 1, w: 1.2, r: 4, name: 'Голуби у вестибюля метро · Pigeons at the metro rotunda' },
  { tag: 'hotel', kind: 'pigeon', x: 648, z: -1, spread: 12, n: 1, w: 0.8, r: 4, name: 'Голуби у гостиницы · Pigeons at the hotel' },
  { tag: 'tauride-gate', kind: 'sparrow', x: 1230, z: -1290, spread: 16, n: 1, w: 1.6, r: 3, name: 'Воробьи у входа в Таврический сад · Sparrows at the Tauride Garden gate' },
  { tag: 'chernyshevskaya', kind: 'sparrow', x: 478, z: -1362, spread: 14, n: 1, w: 1.2, r: 3, name: 'Воробьи у метро «Чернышевская» · Sparrows at Chernyshevskaya metro' },
];
/** the districts a crow likes: the old limes of the Tauride Garden, the Smolny gardens */
const CROW_HAUNTS = [{ x: 1200, z: -1520, r: 220 }, { x: 2425, z: -1833, r: 130 }];
const CROWDS = { chernyshevskaya: [30, 40, 0.5], 'tauride-gate': [34, 45, 0.55], smolny: [30, 40, 0.5], obelisk: [45, 50, 0.6], forecourt: [32, 45, 0.6], rotunda: [18, 30, 0.5] };
/** the hot spots of the zone weight field: [x, z, amplitude, sigma] or { u, d, a, s } = a spot in the station frame (people/zones.js) */
const PEOPLE_HOT = [
  [461, -1350, 2.2, 40],        // Chernyshevskaya metro: the vestibule and the square in front of it
  [1226, -1268, 1.9, 44],       // the Tauride Garden gate
  [2425, -1833, 1.4, 50],       // the Smolny forecourt
  { u: 0, d: -45, a: 1.6, s: 45 },        // the station forecourt (the square in front of the facade)
  { u: 0, d: -12, a: 2.3, s: 24 },        // the front pavement and the doors
  { u: -2, d: 40, a: 1.6, s: 24 },        // the station vestibule / hall (benches, kiosks, the Peter bust)
  { u: -2, d: 100, a: 1.3, s: 30 },      // the concourse under the departure boards
  { u: -12, d: 165, a: 0.9, s: 30 },    // the turnstiles and the apron
];

export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [],
  // the Moscow-station zone as in the strip (the station lies in this territory); the scripted places of the strip's west (Kazan, Palace Square ... people/west.js) and of the castle (people/mars.js) stand at fixed
  // coordinates of the strip, so they are switched off; garden: the crowd cap of the Tauride Garden (hooks/people.js inGarden, docs/AREAS.md section 9.1)
  peopleDensity: {
    station: { factor: 0.35, maxPeople: 330, radius: 220, fade: 80, rectRadius: 40, segments: [[592, 165, 612, 330]], rects: [[560, 400, 790, 1100]] },
    west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true }, garden: { factor: 0.22, maxPeople: 60 },
  },
  peopleCorridor: [],
  peopleHot: PEOPLE_HOT,
  tramLines: [],
  clearDiscs: [{ x: STATION.tower.x, z: STATION.tower.z + 20, r: 28 }],      // the station forecourt (Vosstaniya Square paving is an AREA already): keep trunks off the facade apron
  farCentres: [{ x: 1100, z: -1100, bias: 900 }],      // the old dense city (Liteyny, Smolny, the Petrograd side beyond the Neva): dense stone blocks round the whole area
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station, which this territory contains (the strip's poses, verified free of lanes / buildings by tools/area-garage-check.mjs: node tools/area.mjs smolny tools/area-garage-check.mjs);
 * an area without the station holds one car, the purple Zhiguli, at its spawn.
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
/** environment.js: the services whose `entrances` clear the trees from the doors of the buildings they list: the generic `city` and every landmark service of this page that publishes an `entrances`
 *  array (landmarksSmolny, landmarksSuvorov, landmarksKirochnaya; landmarksD publishes an array that is empty in the North, as in the strip's list; since M7 (docs/AREAS.md section 10) landmarksNorthFull
 *  publishes the door points of its 17 claimed buildings (landmarksNorthFull/doors.js: the vestibule's door of the G3 gate among them, which must stay clear) and landmarksOktyabrsky the hall's 9
 *  (in Smolninskoye and the parked North only; in the strip its list is empty, so the strip's table need not list it). landmarksBelinskyNorth and landmarksTauride publish none. */
export const PRUNE_SERVICES = ['city', 'landmarksNorthFull', 'landmarksSmolny', 'landmarksSuvorov', 'landmarksKirochnaya', 'landmarksOktyabrsky', 'landmarksA', 'landmarksB', 'landmarksEast'];
// The hook set (milestone M6, docs/AREAS.md section 9): hooks.js builds it from the module list above (a hook that serves a landmark module is dormant until the module is in MODULES).
import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list
/** the hooks of the engine modules (keep-outs of trees / tufts / props / ways / parking, the garden of the crowd cap, the deck services): src/areas/north/hooks.js documents the contract */
import { withFountainKeepouts } from '../fountain-keepout.js';
import { FOUNTAIN_SITES } from './fountain-rings.js';
export const HOOKS = withFountainKeepouts(makeHooks(MODULES), FOUNTAIN_SITES);
/** the height patches of layout.heightAt (the first patch that answers wins): the Paradny podium once 'landmarksTauride' is in MODULES (the Tauride remake), none before; the pond bed of the remake appends after it in hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

// ---------------------------------------------------------------- the places of the OTHER areas (milestone M7, docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of Palace-Liteyny that the HUD Places list offers under that area's name (the list itself exists only with ?teleports=1: the place teleports are off by default, docs/AREAS.md 13.5); a pick travels through the edge gate e2 and lands at this pose (core/gates.js offerPlace, via 'place'). { key, label (Russian),
 * area (the registry id), gate (a gate FROM this area TO that area), view (the VIEWS key of that area whose pose this copies: tools/cross-places-test.mjs pins x, z, yaw, pitch to it), x, z, yaw (deg, 0 = north,
 * 90 = west), pitch }. Not read by any world module.
 */
export const CROSS_PLACES = [
  { key: 'palace-square', label: 'Дворцовая площадь · Александровская колонна', area: 'palace', gate: 'e2', view: 'Digit0', x: -1985, z: -715, yaw: 31.52, pitch: 6 },
  { key: 'winter-palace', label: 'Зимний дворец · Дворцовая набережная', area: 'palace', gate: 'e2', view: 'Digit8', x: -2143, z: -1008, yaw: -129.33, pitch: 10 },
  { key: 'anichkov', label: 'Аничков мост', area: 'palace', gate: 'e2', view: 'Digit5', x: -395, z: -108, yaw: 102.04, pitch: 6 },
  { key: 'kazan', label: 'Казанский собор', area: 'palace', gate: 'e2', view: 'Digit9', x: -1470, z: -312, yaw: 171.14, pitch: 8 },
  { key: 'preobrazhensky', label: 'Спасо-Преображенский собор', area: 'palace', gate: 'e2', view: 'Place.preobrazhensky', x: 22, z: -1186, yaw: -95, pitch: 18 },
  { key: 'muruzi', label: 'Дом Мурузи', area: 'palace', gate: 'e2', view: 'Place.muruzi', x: -167, z: -1157, yaw: -107, pitch: 20 },
  { key: 'library', label: 'Российская национальная библиотека · Фонтанка', area: 'palace', gate: 'e2', view: 'Place.library', x: -372, z: -300, yaw: -73.86, pitch: 8 },
];
