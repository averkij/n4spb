// ============================================================================
//  AREA DEFINITION - Vasilyevsky-Okrug 7 (Васильевский–Округ № 7; docs/AREAS.md section 15.v): the fifth area of the world map (maps/intro-draft.html, area 48): the Vasilyevsky island with the okrug 7 / Gavan side,
//  the Petrograd-side bank of the Neva (z -2400 .. -1840) and the Neva Bay south of the island. 11.2 km2 of play rectangles (src/areas/registry.js REGISTRY.vasilyevsky.play, cut from the map outline by
//  tools/area-shape.mjs --k 48 --js vasilyevsky: land outline plus water zones, 63 rectangles VO01 .. VO63), the data cut straight from the source project by tools/area-data-cut.mjs.
//  THIS IS THE FOUNDATION (wave 1): the base modules of the engine, the Academy of Arts with its sphinx pier / garden / Trezzini Square / House of Academicians (landmarksAcademy: all five sub-groups), the Palace and
//  Blagoveshchensky bridges and the water of the data (the Neva, the Smolenka, the Gavan harbour, the Gulf shore). The landmark modules of the island (Strelka, University, Menshikov, Andrew, Makarova, Naval Corps, Mining,
//  Sredny, ModernVO, VOStatues, Smolensky, Kirova, Sevkabel, Sea Terminal) are ported into the marked slots below ("// PORT-...: <module>"), one line each, by the later waves.
//  This area contains NO railway station: no `rail`, no landmarksA / B / C, and ONE purple Zhiguli at the spawn (docs/AREAS.md 13.4). The territory has no metro network module either.
//  vasilyevsky.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
//
//  THE PORT SLOTS (the protocol of the later waves; every slot is ONE line, the slots are separated by an unchanged `// ---` line so that the branches of five parallel agents merge without a conflict):
//    // PORT-IMPORT: <module>   -> `import { GROUPS_LIST as G_X } from '../../world/<module>/groups.js';`
//    // PORT-MODULE: <module>   -> `'<module>',  // what it draws`                          (inside MODULES, in build order)
//    // PORT-LABEL: <module>    -> `<module>: 'loading words',`                               (inside LABELS)
//    // PORT-GROUPS: <module>   -> `GROUPS.<module> = G_X;`   (a filter of the list when a group lies outside the territory)
//    // PORT-AREAS: <module>    -> the rows of the HUD location table (makeAreas)
//    // PORT-CLAIMED: <module>  -> `{ id: '<OSM id>', by: '<module>', group: '<key>' },`        (TEST.claimed: one row per module)
//    // PORT-PRUNE: <module>    -> `'<module>',` inside PRUNE_SERVICES (a module whose `entrances` should clear the trees)
//  and the rings of a module (water pits, keep-outs, paved ground) go to src/areas/vasilyevsky/rings.js (its own protocol, PORT-IMPORT / PORT-SOURCE).
// ============================================================================
import { GROUPS_LIST as G_BR } from '../../world/bridges/groups.js';
import { GROUPS_SW } from '../../world/bridges/groups-sw.js';
import * as G_ACADEMY from '../../world/landmarksAcademy/groups.js';
import { WATER_RINGS as RINGS_WATER, KEEP_OUT as RINGS_KEEP_OUT, PAVED_RINGS as RINGS_PAVED } from './rings.js';
// ---
// PORT-IMPORT: landmarksStrelka
// ---
// PORT-IMPORT: landmarksUniversity
// ---
// PORT-IMPORT: landmarksMenshikov
// ---
import { GROUPS_LIST as G_ANDREW } from '../../world/landmarksAndrew/groups.js';
// ---
// PORT-IMPORT: landmarksMakarova
// ---
// PORT-IMPORT: landmarksNavalCorps
// ---
// PORT-IMPORT: landmarksMining
// ---
import { GROUPS_LIST as G_SREDNY } from '../../world/landmarksSredny/groups.js';
// ---
import { GROUPS_LIST as G_MODERNVO } from '../../world/landmarksModernVO/groups.js';
// ---
// PORT-IMPORT: landmarksKirova
// ---
// PORT-IMPORT: landmarksSmolensky
// ---
// PORT-IMPORT: landmarksSevkabel
// ---
// PORT-IMPORT: landmarksSeaTerminal
// ---
import { GROUPS_LIST as G_VOSTATUES } from '../../world/landmarksVOStatues/groups.js';
// ---
// PORT-IMPORT: landmarksGavan

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'vasilyevsky';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/vasilyevsky/';
/** A missing or stale bake is an error card, never a minutes-long procedural build (a hand-off lands here). */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No `rail` and no landmarksA / B / C (no station, no tracks), no metro network. The island's landmark modules are added in
 *  the PORT-MODULE slots (in this order). tools/modules-list.mjs parses this list: one quoted name per line (comment lines are ignored). */
export const MODULES = [
  'environment',  // ground, embankment granite, Neva / Malaya Neva / Smolenka water, trees, lawns, flowerbeds, far skyline
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  // PORT-MODULE: landmarksStrelka
  //
  // PORT-MODULE: landmarksUniversity
  //
  'landmarksAcademy', // the Academy of Arts, the Egyptian sphinx pier, the Academic Garden, Trezzini Square, the House of Academicians (docs/AREAS.md 15.z; the last three parts are not knock-adapted yet)
  //
  // PORT-MODULE: landmarksMenshikov
  //
  'landmarksAndrew', // St Andrew's Cathedral, the Andreevsky market and boulevard, the Vasileostrovskaya pavilion, the Pel house, the Annunciation church (docs/vo-m3.md)
  //
  // PORT-MODULE: landmarksMakarova
  //
  // PORT-MODULE: landmarksNavalCorps
  //
  // PORT-MODULE: landmarksMining
  //
  'landmarksSredny', // the tram depot and museum, the Gorny Institut pavilions, the Geological Committee, Dom Evangelia, the Frank mansion, the Chernikhov tower (docs/vo-m3.md)
  //
  'landmarksModernVO', // twelve Art Nouveau hero houses of the island (docs/vo-m3.md)
  //
  // PORT-MODULE: landmarksKirova
  //
  // PORT-MODULE: landmarksSmolensky
  //
  // PORT-MODULE: landmarksSevkabel
  //
  // PORT-MODULE: landmarksSeaTerminal
  //
  'landmarksVOStatues', // the monuments, fountain, churches and University-yard gardens of the island (docs/vo-m3.md)
  //
  'bridges',      // the bridges of the area: the Palace Bridge and the Blagoveshchensky Bridge (the bridge wave adds the Birzhevoy, Tuchkov, Uralsky, Smolensky, Nalichny and Novo-Andreevsky)
  'landmarksPalaceBridge', // the Palace Bridge's two opening bascule leaves (docs/AREAS.md 13.10): `bridges` leaves the central span to it; after streets (the NPC stop lines) and bridges, before traffic / people
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses, trams + parked cars
  'people',       // pedestrians, tourists, groups with guides, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the purple Zhiguli (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksAcademy: 'Академия художеств, Египетские сфинксы, Академический сад',
  // ---
  // PORT-LABEL: landmarksStrelka
  // ---
  // PORT-LABEL: landmarksUniversity
  // ---
  // PORT-LABEL: landmarksMenshikov
  // ---
  landmarksAndrew: 'Андреевский собор, Андреевский рынок и бульвар, Благовещенская церковь',
  // ---
  // PORT-LABEL: landmarksMakarova
  // ---
  // PORT-LABEL: landmarksNavalCorps
  // ---
  // PORT-LABEL: landmarksMining
  // ---
  landmarksSredny: 'Трамвайный парк, Геологический комитет, Дом Евангелия, башня Чернихова',
  // ---
  landmarksModernVO: 'Северный модерн: дома Васильевского острова',
  // ---
  // PORT-LABEL: landmarksKirova
  // ---
  // PORT-LABEL: landmarksSmolensky
  // ---
  // PORT-LABEL: landmarksSevkabel
  // ---
  // PORT-LABEL: landmarksSeaTerminal
  // ---
  landmarksVOStatues: 'Памятники, фонтаны и церкви Васильевского острова',
  // ---
  landmarksPalaceBridge: 'Дворцовый мост · разводные пролёты',
  drive: 'машина на старте',
};

export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: {
    // the strip's keys that the engine reads (the Nevsky grid corridor and the like): copies, not in this territory
    nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова',
    dvortsovayaNab: 'Дворцовая набережная', admiralteyskayaNab: 'Адмиралтейская набережная', angliyskayaNab: 'Английская набережная', universitetskayaNab: 'Университетская набережная',
    konnogvardeysky: 'Конногвардейский бульвар', dvortsovayaSq: 'Дворцовая площадь', senatskayaSq: 'Сенатская площадь', trudaSq: 'площадь Труда',
    // the island and the okrug (names as in the OSM data)
    bolshoyVO: 'Большой проспект В.О.', sredniyVO: 'Средний проспект В.О.', malyVO: 'Малый проспект В.О.', makarova: 'набережная Макарова', leytenantaShmidta: 'набережная Лейтенанта Шмидта',
    birzhevayaSq: 'Биржевая площадь', birzhevoyProezd: 'Биржевой проезд', lihachevaSq: 'площадь Академика Лихачёва', nalichnaya: 'Наличная улица', smolenka: 'набережная реки Смоленки',
    beringa: 'улица Беринга', odoevskogo: 'улица Одоевского', uralskaya: 'Уральская улица', dobrolyubova: 'проспект Добролюбова', kosayaLiniya: 'Косая линия', kozhevennaya: 'Кожевенная линия',
    novosmolenskaya: 'Новосмоленская набережная', kadetskaya: 'Кадетская линия В.О.', detskaya: 'Детская улица', trezziniSq: 'площадь Трезини', sakharovaSq: 'площадь Академика Сахарова',
  },
};

// ---------------------------------------------------------------- the local frames: anchors of the strip (Vosstaniya Square, the obelisk, the Moscow station)
// The engine reads these from every area (the Nevsky grid origin SQUARE: the style of a block follows its distance to it, city/archetypes.js, streets/style.js): COPIES of the strip's, so every page agrees.
// This territory contains neither the square nor the station (they are 5 km east); the values only anchor the grid.
/** Vosstaniya Square: the paved square w638352776 (centre 589, 173); the Hero City obelisk (36 m) stands at (592, 165) on an island between the two Nevsky carriageways. */
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
/** Moscow Railway Station: faces NNW (facade normal bearing ~348 deg) onto the square with the obelisk on its axis; the tracks run SSE (bearing ~167 deg). Clock tower base (602, 246). */
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

// ---------------------------------------------------------------- landmark groups
// The generic `city` module builds every building that no specialist claims. A specialist MODULE owns a list of named SUB-GROUPS. A sub-group claims building ids (`ids`, plus every part whose `parent` is one of them)
// and non-building OSM ids (`osm`: paving, bridge decks, monuments) that the owner draws itself. A claim only takes effect when the owner module says so: it exports `OWNS_GROUPS = true` (every sub-group) or
// `['station', ...]` (only those); until then `city` / `environment` / `streets` still draw the claimed objects as a blockout (see lib/claims.js).
export const GROUPS = {};
// the Academy of Arts (docs/AREAS.md 15.z): all five sub-groups lie in this territory (Admiralty-Haymarket claims only the first two)
GROUPS.landmarksAcademy = G_ACADEMY.GROUPS_LIST;
// ---
// PORT-GROUPS: landmarksStrelka
// ---
// PORT-GROUPS: landmarksUniversity
// ---
// PORT-GROUPS: landmarksMenshikov
// ---
GROUPS.landmarksAndrew = G_ANDREW;      // all six sub-groups lie in the territory
// ---
// PORT-GROUPS: landmarksMakarova
// ---
// PORT-GROUPS: landmarksNavalCorps
// ---
// PORT-GROUPS: landmarksMining
// ---
GROUPS.landmarksSredny = G_SREDNY;      // all six sub-groups lie in the territory
// ---
GROUPS.landmarksModernVO = G_MODERNVO;      // all twelve houses lie in the territory
// ---
// PORT-GROUPS: landmarksKirova
// ---
// PORT-GROUPS: landmarksSmolensky
// ---
// PORT-GROUPS: landmarksSevkabel
// ---
// PORT-GROUPS: landmarksSeaTerminal
// ---
GROUPS.landmarksVOStatues = G_VOSTATUES.filter((g) => g.key !== 'vo-musa-jalil');      // the Musa Jalil monument (-6258, 50) stands 270 m outside the territory: not claimed
// ---
// the bridges: the Palace Bridge (both ends lie in the territory) and the Blagoveshchensky Bridge (bridges/groups-sw.js carries its claim); the bridge wave appends the island's other bridges (a groups-vo.js)
GROUPS.bridges = G_BR.filter((b) => b.key === 'palace').concat(GROUPS_SW.filter((b) => b.key === 'blagoveshchensky'));

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _groupPolys, _shoreOf, _deck, inRiver } = h;
  return [
  _deck('Дворцовый мост · Palace Bridge', [-2344.2, -871.2], [-2495.5, -1075.8], 32),
  { name: 'Благовещенский мост · Blagoveshchensky Bridge', c: [-3449, -264], r: 170 },
  // ---
  // PORT-AREAS: landmarksStrelka
  // ---
  // PORT-AREAS: landmarksUniversity
  // ---
  // PORT-AREAS: landmarksMenshikov
  // ---
  ..._groupPolys(SUBGROUPS['andrew-cathedral'], 14).map((r) => ({ name: 'Андреевский собор · St Andrew\'s Cathedral', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-market'], 8).map((r) => ({ name: 'Андреевский рынок · Andreevsky Market', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-pavilion'], 14).map((r) => ({ name: 'Станция метро «Василеостровская» · Vasileostrovskaya metro', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-pel'], 6).map((r) => ({ name: 'Дом Пеля · Pel house', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-annunciation'], 10).map((r) => ({ name: 'Благовещенская церковь · Annunciation Church', ...r })),
  { name: 'Андреевский бульвар · Andreevsky Boulevard', c: [-3944, -976], r: 120 },
  // ---
  // PORT-AREAS: landmarksMakarova
  // ---
  // PORT-AREAS: landmarksNavalCorps
  // ---
  // PORT-AREAS: landmarksMining
  // ---
  ..._groupPolys(SUBGROUPS['tram-depot'], 10).map((r) => ({ name: 'Василеостровский трамвайный парк · Vasileostrovsky tram depot', ...r })),
  ..._groupPolys(SUBGROUPS['geolkom'], 8).map((r) => ({ name: 'Геологический комитет · Geological Committee', ...r })),
  ..._groupPolys(SUBGROUPS['gorny-pavilions'], 12).map((r) => ({ name: 'Станция метро «Горный институт» · Gorny Institut metro', ...r })),
  ..._groupPolys(SUBGROUPS['dom-evangelia'], 6).map((r) => ({ name: 'Дом Евангелия · Dom Evangelia', ...r })),
  ..._groupPolys(SUBGROUPS['frank-mansion'], 6).map((r) => ({ name: 'Особняк Франка · Frank mansion', ...r })),
  ..._groupPolys(SUBGROUPS['chernikhov-tower'], 8).map((r) => ({ name: 'Башня Чернихова · Chernikhov tower', ...r })),
  // ---
  ..._groupPolys(SUBGROUPS['modernvo-smirnov'], 6).map((r) => ({ name: 'Дом с атлантами · House with the atlantes', ...r })),
  ..._groupPolys(SUBGROUPS['modernvo-erem82'], 6).map((r) => ({ name: 'Дом со шпилем · House with the spire', ...r })),
  ..._groupPolys(SUBGROUPS['modernvo-erem46'], 6).map((r) => ({ name: 'Дом со шпицами · House with the spires', ...r })),
  ..._groupPolys(SUBGROUPS['modernvo-kudryavtsev'], 6).map((r) => ({ name: 'Дом с подсолнухами · House with sunflowers', ...r })),
  // ---
  // PORT-AREAS: landmarksKirova
  // ---
  // PORT-AREAS: landmarksSmolensky
  // ---
  // PORT-AREAS: landmarksSevkabel
  // ---
  // PORT-AREAS: landmarksSeaTerminal
  // ---
  ..._groupPolys(SUBGROUPS['vo-church-armenian'], 10).map((r) => ({ name: 'Армянская церковь · Armenian Church', ...r })),
  { name: 'Фонтан «Пётр Первый» · Peter I fountain', c: [-3006.6, -784], r: 14 },
  { name: 'Раскрытая книга · Open Book', c: [-2946.9, -740.3], r: 10 },
  // ---
  // the Academy of Arts and its neighbours; the embankment road row stands BEFORE the river rows (the Neva quay would be named instead)
  ..._groupPolys(SUBGROUPS['academy-of-arts'], 8).map((r) => ({ name: 'Академия художеств · Academy of Arts', ...r })),
  { name: 'Египетские сфинксы · Egyptian Sphinxes', c: [-3378.7, -507.7], r: 30 },
  ..._groupPolys(SUBGROUPS['academic-garden'], 6).map((r) => ({ name: 'Академический сад · Academic Garden', ...r })),
  ..._groupPolys(SUBGROUPS['trezzini-square'], 6).map((r) => ({ name: 'Площадь Трезини · Trezzini Square', ...r })),
  ..._groupPolys(SUBGROUPS['dom-akademikov'], 6).map((r) => ({ name: 'Дом академиков · House of Academicians', ...r })),
  { name: 'Университетская набережная · Universitetskaya Embankment', road: NAMES.streets.universitetskayaNab },
  { name: 'Набережная Лейтенанта Шмидта · Lieutenant Schmidt Embankment', road: NAMES.streets.leytenantaShmidta },
  { name: 'Набережная Макарова · Makarova Embankment', road: NAMES.streets.makarova },
  { name: 'Дворцовая набережная · Palace Embankment', road: NAMES.streets.dvortsovayaNab },
  { name: 'Адмиралтейская набережная · Admiralty Embankment', road: NAMES.streets.admiralteyskayaNab },
  { name: 'Английская набережная · English Embankment', road: NAMES.streets.angliyskayaNab },
  { name: 'Набережная реки Смоленки · Smolenka Embankment', road: NAMES.streets.smolenka },
  { name: 'Новосмоленская набережная · Novosmolenskaya Embankment', road: NAMES.streets.novosmolenskaya },
  { name: 'Большой проспект В.О. · Bolshoy Prospekt V.O.', road: NAMES.streets.bolshoyVO },
  { name: 'Средний проспект В.О. · Sredny Prospekt V.O.', road: NAMES.streets.sredniyVO },
  { name: 'Малый проспект В.О. · Maly Prospekt V.O.', road: NAMES.streets.malyVO },
  { name: 'Наличная улица · Nalichnaya ulitsa', road: NAMES.streets.nalichnaya },
  { name: 'Улица Беринга · Ulitsa Beringa', road: NAMES.streets.beringa },
  { name: 'Улица Одоевского · Ulitsa Odoevskogo', road: NAMES.streets.odoevskogo },
  { name: 'Уральская улица · Uralskaya ulitsa', road: NAMES.streets.uralskaya },
  { name: 'Проспект Добролюбова · Prospekt Dobrolyubova', road: NAMES.streets.dobrolyubova },
  { name: 'Кожевенная линия · Kozhevennaya liniya', road: NAMES.streets.kozhevennaya },
  { name: 'Косая линия · Kosaya liniya', road: NAMES.streets.kosayaLiniya },
  { name: 'Кадетская линия · Kadetskaya liniya', road: NAMES.streets.kadetskaya },
  { name: 'Детская улица · Detskaya ulitsa', road: NAMES.streets.detskaya },
  { name: 'Биржевая площадь · Birzhevaya Square', road: NAMES.streets.birzhevayaSq },
  { name: 'Площадь Академика Лихачёва · Likhachev Square', road: NAMES.streets.lihachevaSq },
  { name: 'Площадь Трезини · Trezzini Square', road: NAMES.streets.trezziniSq },
  { name: 'Площадь Академика Сахарова · Sakharov Square', road: NAMES.streets.sakharovaSq },
  { name: 'Смоленка · Smolenka River', x0: -7503, x1: -3600, z0: -2100, z1: -1400, test: (x, z) => _shoreOf(['smolenka'], x, z) < 14 },
  { name: 'Нева · Neva River', x0: -7120, x1: -1920, z0: -2400, z1: 1920, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Васильевский остров · Vasilyevsky Island', x0: -7120, x1: -1920, z0: -1840, z1: 1920 },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // Foundation set: the Spit with the Exchange, the Palace Bridge seen from the island, the Academy of Arts and the sphinxes. The ported modules add their poses (the later waves, with the TEST.viewKeys list).
  const HERO = { x: -2508.4, z: -1293.1, yaw: yawToward(-2508.4, -1293.1, -2609.8, -1232.7), pitch: 8 };      // the Spit (Strelka) looking at the Exchange
  const VIEWS = [
    { key: 'Digit1', label: 'Стрелка · Биржа', x: -2508.4, z: -1293.1, yaw: yawToward(-2508.4, -1293.1, -2609.8, -1232.7), pitch: 8 },
    { key: 'Digit2', label: 'Дворцовый мост · Дворцовая набережная', x: -2337, z: -848, yaw: yawToward(-2337, -848, -2495, -1075), pitch: 4 },
    { key: 'Digit3', label: 'Академия художеств', x: -3407.5, z: -497.9, yaw: yawToward(-3407.5, -497.9, -3431, -597), pitch: 10 },
    // the Places list only
    // the Egyptian sphinx pier on Universitetskaya Embankment: the west sphinx six metres to the right, the stair pit to the Neva ahead, the Academy of Arts behind the camera
    { key: 'Place.sphinxes', label: 'Египетские сфинксы · Университетская набережная', x: -3407.5, z: -497.9, yaw: yawToward(-3407.5, -497.9, -3386.8, -504.1), pitch: 6 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'r165182', by: 'landmarksAcademy', group: 'academy-of-arts' },
    // ---
    // PORT-CLAIMED: landmarksStrelka
    // ---
    // PORT-CLAIMED: landmarksUniversity
    // ---
    // PORT-CLAIMED: landmarksMenshikov
    // ---
    { id: 'w84046074', by: 'landmarksAndrew', group: 'andrew-cathedral' },
    // ---
    // PORT-CLAIMED: landmarksMakarova
    // ---
    // PORT-CLAIMED: landmarksNavalCorps
    // ---
    // PORT-CLAIMED: landmarksMining
    // ---
    { id: 'w45965990', by: 'landmarksSredny', group: 'geolkom' },
    // ---
    { id: 'w108204300', by: 'landmarksModernVO', group: 'modernvo-smirnov' },
    // ---
    // PORT-CLAIMED: landmarksKirova
    // ---
    // PORT-CLAIMED: landmarksSmolensky
    // ---
    // PORT-CLAIMED: landmarksSevkabel
    // ---
    // PORT-CLAIMED: landmarksSeaTerminal
    // ---
    { id: 'w111944528', by: 'landmarksVOStatues', group: 'vo-church-armenian' },
    // ---
    { id: 'w362796524', by: 'bridges', group: 'palace' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Place.sphinxes'],
  mustHaveAreas: [
    { x: -2420, z: -975, has: 'дворцовый' }, { x: -3378.7, z: -507.7, has: 'сфинкс' }, { x: -3420, z: -502, has: 'университетская' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [-3400, -520], r: 90, min: 3 },
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
 *  the others get an invisible fallback deck (walk box + parapet boxes). The bridge wave adds the rows of the island's bridges here. */
const BRIDGE_ZONES = [
  { id: 'palace', name: 'Дворцовый мост', key: 'neva', c: [-2322, -884], axis: 143, w: 30, len: 255, own: true },
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
 *   plugs / bridgeZones / bridgeShades / clipLines / farSources / farCenter / farRadius / forcedBanks / openMouths / dataWater / slopeReaches / keyByName / riverKeys / ownerRings / keepOut: see Admiralty's area.js
 *   and src/world/lib/area-tables.js. Here:
 *   dataWater   the Smolenka (r1576084 and its mouth arms r1576086) is a waterway of its own ('smolenka'); the arm r1576116 beside the Petrovsky stadium belongs to the Neva
 *   riverKeys   the RIVER records of the data whose key is null: the Petrograd-side straits and the Zhdanovka are drawn as the Neva (a granite trench of the Neva look), the Smolenka as 'smolenka'
 *   ownerRings / keepOut   collected from the landmark modules by ./rings.js (one line per module there)
 */
export const WATER = {
  plugs: PLUGS,
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [],      // the seams where the cut ends a river polygon in the middle of the river: none known yet (tools/water-reachable-test.mjs names them; the bridge / water wave adds them)
  farSources: ['neva-up', 'neva-down', 'neva-malaya'],
  farCenter: [-4500, -200],             // the middle of the area (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [[-2460.8, -1097.5, -2460.7, -1098.7]],      // the 1.2 m corner edge of the Neva polygon beside the Palace Bridge plug
  openMouths: [],
  dataWater: [{ id: 'r1576084', key: 'smolenka' }, { id: 'r1576086', key: 'smolenka' }, { id: 'r1576116', key: 'neva' }],
  slopeReaches: SLOPE_REACHES,
  keyByName: {},
  riverKeys: { 'Смоленка': 'smolenka', 'Кронверкский пролив': 'neva', 'Ждановка': 'neva' },
  ownerRings: RINGS_WATER,
  keepOut: RINGS_KEEP_OUT,
};
/** ground that landmark modules pave themselves (claims.js): from ./rings.js */
export const PAVED_RINGS = RINGS_PAVED;

// ---------------------------------------------------------------- PEOPLE / WILDLIFE
/** the hot spots of the zone weight field: [x, z, amplitude, sigma] (the Spit, the Rostral columns, the Academy and the sphinxes; the ported modules add theirs) */
const PEOPLE_HOT = [
  [-2495, -1298, 2.0, 60],        // the Spit: the Birzhevaya Square garden, the descent to the Neva
  [-2481, -1190, 1.4, 30],        // the Rostral columns
  [-3378, -507, 1.5, 25],         // the sphinx pier
  [-3431, -597, 1.0, 40],         // the Academy of Arts
];
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields) */
const PIGEON_ZONES = [
  { tag: 'strelka', kind: 'pigeon', x: -2495, z: -1298, spread: 24, n: 3, w: 2.6, r: 5, name: 'Голуби на Стрелке · Pigeons on the Spit' },
  { tag: 'sphinx', kind: 'pigeon', x: -3378, z: -507, spread: 14, n: 1, w: 1.4, r: 4, name: 'Голуби у сфинксов · Pigeons at the sphinxes' },
  { tag: 'strelka', kind: 'sparrow', x: -2500, z: -1280, spread: 16, n: 1, w: 1.5, r: 3, name: 'Воробьи на Стрелке · Sparrows on the Spit' },
];
/** the districts a crow likes: crows start on a tree top there when the player is not about (the Smolensky cemetery, the Rumyantsev garden, the Menshikov garden). At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -5850, z: -1400, r: 430 }, { x: -3495, z: -702, r: 120 }, { x: -3270, z: -660, r: 90 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] } */
const CROWDS = { strelka: [45, 50, 0.8], sphinx: [22, 30, 0.6] };

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it); see Admiralty's area.js for the fields.
 *   peopleDensity  the scripted places of the strip's west (Kazan, Palace Square ...; people/west.js) and of the castle (people/mars.js) stand at fixed coordinates of the strip: switched off here
 *   tramLines      the tourist-free route 40 of the island: from the Petrograd-side end (-3429, -2200) across the Tuchkov Bridge to the Detskaya loop (-5455, 645): buildTramNet finds 8.7 km, nothing missing
 */
export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [],
  peopleDensity: {
    west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true },
  },
  peopleCorridor: [],
  peopleHot: PEOPLE_HOT,
  tramLines: [
    { refs: ['40'], a: [-3429, -2200], b: [-5455, 645], headway: 450, stopTol: 4.3 },
  ],
  clearDiscs: [],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre reaches the Admiralty and over the Neva: dense stone blocks to the east
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station; this territory does not contain it, so it holds ONE car, the purple Zhiguli (`lada`), near the Spit.
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east; the pose stands on the Spit beside the one-way carriageway of Birzhevaya Square, 8 m from its lane) } }  a car without a pose is not built
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 */
export const GARAGE = {
  poses: {
    lada: { x: -2540, z: -1300, yaw: 99 * DEG },
  },
  spawn: { x: -2540, z: -1300, yaw: 99 * DEG },
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = [
  'city',
  // PORT-PRUNE: landmarksStrelka
  //
  // PORT-PRUNE: landmarksUniversity
  //
  // PORT-PRUNE: landmarksMenshikov
  //
  'landmarksAndrew',
  //
  'landmarksSredny',
  //
  // PORT-PRUNE: landmarksKirova
];
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent) */
export const HOOKS = makeHooks(MODULES);      // the hook set of src/areas/north/hooks.js gated by the module list: none of its modules is in this list, so it is inert here
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9): the hook set gated by MODULES, see src/areas/north/hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list

// ---------------------------------------------------------------- the places of the OTHER areas (docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name (a pick asks the gate question and the hand-off lands at this pose). Empty: places are off in the live areas
 * (the edge gates carry the player across). Not read by any world module.
 */
export const CROSS_PLACES = [];
