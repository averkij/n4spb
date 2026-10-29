// ============================================================================
//  AREA DEFINITION - Vasilyevsky-Okrug 7 (Васильевский–Округ № 7; docs/AREAS.md section 15.v): the fifth area of the world map (maps/intro-draft.html, area 48): the Vasilyevsky island with the okrug 7 / Gavan side,
//  the Petrograd-side bank of the Neva (z -2400 .. -1840) and the Neva Bay south of the island. 11.2 km2 of play rectangles (src/areas/registry.js REGISTRY.vasilyevsky.play, cut from the map outline by
//  tools/area-shape.mjs --k 48 --js vasilyevsky: land outline plus water zones, 63 rectangles VO01 .. VO63), the data cut straight from the source project by tools/area-data-cut.mjs.
//  THE MODULES (all ported, docs/AREAS.md 15.v, docs/vo-m1..m4.md, docs/vo-br.md): the base modules of the engine, the Academy of Arts with its sphinx pier / garden / Trezzini Square / House of Academicians (landmarksAcademy: all five sub-groups),
//  the landmark modules of the island (Strelka, University, Menshikov, Andrew, Makarova, Naval Corps, Mining, Sredny, ModernVO, Kirova, Smolensky, Sevkabel, Sea Terminal, VOStatues), the Palace Bridge with its two bascule leaves and the other
//  bridges of the island (Blagoveshchensky, Birzhevoy, Tuchkov, Uralsky, Smolensky, Nalichny, Novo-Andreevsky) and the water of the data (the Neva, the Malaya Neva, the Smolenka, the Gavan harbour, the Gulf shore). NOT ported: landmarksGavan
//  (its slot below stays empty), the Musa Jalil monument (270 m outside the territory) and the torpedo boat of the Sea Terminal (no ground around it in the data cut).
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
import { GROUPS_VO } from '../../world/bridges/groups-vo.js';
import * as G_ACADEMY from '../../world/landmarksAcademy/groups.js';
import { WATER_RINGS as RINGS_WATER, KEEP_OUT as RINGS_KEEP_OUT, PAVED_RINGS as RINGS_PAVED } from './rings.js';
// ---
import { GROUPS_LIST as G_STRELKA } from '../../world/landmarksStrelka/groups.js';
// ---
import { GROUPS_LIST as G_UNIVERSITY } from '../../world/landmarksUniversity/groups.js';
// ---
import { GROUPS_LIST as G_MENSHIKOV } from '../../world/landmarksMenshikov/groups.js';
// ---
import { GROUPS_LIST as G_ANDREW } from '../../world/landmarksAndrew/groups.js';
// ---
import { GROUPS_LIST as G_MAKAROVA } from '../../world/landmarksMakarova/groups.js';
// ---
import { GROUPS_LIST as G_NAVALCORPS } from '../../world/landmarksNavalCorps/groups.js';
// ---
import { GROUPS_LIST as G_MINING } from '../../world/landmarksMining/groups.js';
// ---
import { GROUPS_LIST as G_SREDNY } from '../../world/landmarksSredny/groups.js';
// ---
import { GROUPS_LIST as G_MODERNVO } from '../../world/landmarksModernVO/groups.js';
// ---
import { GROUPS_LIST as G_KIROVA } from '../../world/landmarksKirova/groups.js';
// ---
import { GROUPS_LIST as G_SMOLENSKY } from '../../world/landmarksSmolensky/groups.js';
// ---
import { GROUPS_LIST as G_SEVKABEL } from '../../world/landmarksSevkabel/groups.js';
// ---
import { GROUPS_LIST as G_SEATERMINAL } from '../../world/landmarksSeaTerminal/groups.js';
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
  'landmarksStrelka', // the Spit: the Old Stock Exchange, the two Rostral columns, Birzhevaya Square garden, the granite descent, the warehouses, the Customs house (docs/vo-m1.md)
  //
  'landmarksUniversity', // Universitetskaya embankment: the Kunstkamera, the Academy of Sciences, the Twelve Collegia, the monuments, the Rector wing, the Palace of Peter II, Novobirzhevoy Gostiny Dvor (docs/vo-m1.md)
  //
  'landmarksAcademy', // the Academy of Arts, the Egyptian sphinx pier, the Academic Garden, Trezzini Square, the House of Academicians (docs/AREAS.md 15.z; the garden, the square and the House of Academicians are knock-adapted in docs/vo-m1.md)
  //
  'landmarksMenshikov', // the Menshikov Palace, the First Cadet Corps, the Rumyantsev Garden with the obelisk, the Rumyantsevsky descent (docs/vo-m2.md)
  //
  'landmarksAndrew', // St Andrew's Cathedral, the Andreevsky market and boulevard, the Vasileostrovskaya pavilion, the Pel house, the Annunciation church (docs/vo-m3.md)
  //
  'landmarksMakarova', // Sportivnaya-2 exits 6 and 7, the Lions pier, St Catherine at the Tuchkov Bridge, the Yakovlev houses, the Lutheran churches, the Brullov house (docs/vo-m2.md)
  //
  'landmarksNavalCorps', // the Naval Cadet Corps, the Krusenstern monument and stair, the Dormition church, the submarine S-189 (docs/vo-m2.md)
  //
  'landmarksMining', // the Mining University, the icebreaker Krasin, the two descents (docs/vo-m2.md)
  //
  'landmarksSredny', // the tram depot and museum, the Gorny Institut pavilions, the Geological Committee, Dom Evangelia, the Frank mansion, the Chernikhov tower (docs/vo-m3.md)
  //
  'landmarksModernVO', // twelve Art Nouveau hero houses of the island (docs/vo-m3.md)
  //
  'landmarksKirova', // the Kirov Palace of Culture, Erarta museum, the Vasileostrovets garden, the Sobchak monument
  //
  'landmarksSmolensky', // the Smolensky Orthodox Cemetery: the Church of the Smolensk Icon and bell tower, St Xenia chapel, Trinity chapel, Holy Gates, Resurrection church, 2.4 km fence, the forest and the graves
  //
  'landmarksSevkabel', // Sevkabel Port (hall, yard, Istkabel), the Brusnitsyn quarter, the almshouse, the Skobsky Palace, CHP-7, the Baltic Shipyard cranes
  //
  'landmarksSeaTerminal', // the Sea Terminal (the two-tier deck, the five berths, the port fence)
  //
  'landmarksVOStatues', // the monuments, fountain, churches and University-yard gardens of the island (docs/vo-m3.md)
  //
  'bridges',      // the bridges of the area: the Palace, Blagoveshchensky, Birzhevoy, Tuchkov, Uralsky, Smolensky, Nalichny and Novo-Andreevsky bridges (docs/vo-br.md)
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
  landmarksStrelka: 'Стрелка, Биржа, Ростральные колонны, Таможня',
  // ---
  landmarksUniversity: 'Кунсткамера, Академия наук, Двенадцать коллегий',
  // ---
  landmarksMenshikov: 'Меншиковский дворец, Румянцевский сад, Кадетский корпус',
  // ---
  landmarksAndrew: 'Андреевский собор, Андреевский рынок и бульвар, Благовещенская церковь',
  // ---
  landmarksMakarova: 'Спуск со львами, Церковь Св. Екатерины, Лютеранские церкви',
  // ---
  landmarksNavalCorps: 'Морской кадетский корпус, Крузенштерн, подлодка С-189',
  // ---
  landmarksMining: 'Горный университет, ледокол Красин',
  // ---
  landmarksSredny: 'Трамвайный парк, Геологический комитет, Дом Евангелия, башня Чернихова',
  // ---
  landmarksModernVO: 'Северный модерн: дома Васильевского острова',
  // ---
  landmarksKirova: 'Дворец культуры Кирова, Эрарта, сад Василеостровец',
  // ---
  landmarksSmolensky: 'Смоленское кладбище, церкви, часовня Ксении Блаженной',
  // ---
  landmarksSevkabel: 'Севкабель Порт, Брусницынский квартал, ТЭЦ-7',
  // ---
  landmarksSeaTerminal: 'Морской вокзал',
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
GROUPS.landmarksStrelka = G_STRELKA;
// ---
GROUPS.landmarksUniversity = G_UNIVERSITY;
// ---
GROUPS.landmarksMenshikov = G_MENSHIKOV;      // every sub-group lies in this territory and in its data
// ---
GROUPS.landmarksAndrew = G_ANDREW;      // all six sub-groups lie in the territory
// ---
GROUPS.landmarksMakarova = G_MAKAROVA;      // every sub-group lies in this territory and in its data
// ---
GROUPS.landmarksNavalCorps = G_NAVALCORPS;      // every sub-group lies in this territory and in its data
// ---
GROUPS.landmarksMining = G_MINING;      // every sub-group lies in this territory and in its data
// ---
GROUPS.landmarksSredny = G_SREDNY;      // all six sub-groups lie in the territory
// ---
GROUPS.landmarksModernVO = G_MODERNVO;      // all twelve houses lie in the territory
// ---
GROUPS.landmarksKirova = G_KIROVA;
// ---
GROUPS.landmarksSmolensky = G_SMOLENSKY;
// ---
GROUPS.landmarksSevkabel = G_SEVKABEL;
// ---
GROUPS.landmarksSeaTerminal = G_SEATERMINAL;
// ---
GROUPS.landmarksVOStatues = G_VOSTATUES.filter((g) => g.key !== 'vo-musa-jalil');      // the Musa Jalil monument (-6258, 50) stands 270 m outside the territory: not claimed
// ---
// the bridges: the Palace Bridge (both ends lie in the territory), the Blagoveshchensky Bridge (bridges/groups-sw.js carries its claim) and the island's other bridges (bridges/groups-vo.js: Birzhevoy and Tuchkov over the Malaya Neva,
// Uralsky, Smolensky and Nalichny over the Smolenka, the Novo-Andreevsky footbridge)
GROUPS.bridges = G_BR.filter((b) => b.key === 'palace').concat(GROUPS_SW.filter((b) => b.key === 'blagoveshchensky'), GROUPS_VO);

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _groupPolys, _shoreOf, _deck, inRiver } = h;
  return [
  _deck('Дворцовый мост · Palace Bridge', [-2344.2, -871.2], [-2495.5, -1075.8], 32),
  { name: 'Благовещенский мост · Blagoveshchensky Bridge', c: [-3449, -264], r: 170 },
  _deck('Биржевой мост · Birzhevoy Bridge', [-2686.3, -1425.7], [-2671.2, -1663.9], 16),
  _deck('Тучков мост · Tuchkov Bridge', [-3739.3, -1752.1], [-3614.3, -1932.6], 20),
  { name: 'Уральский мост · Uralsky Bridge', c: [-4626.9, -1826.9], r: 26 },
  { name: 'Смоленский мост · Smolensky Bridge', c: [-5286.9, -1645.8], r: 26 },
  { name: 'Наличный мост · Nalichny Bridge', c: [-6702.1, -1707.9], r: 48 },
  { name: 'Ново-Андреевский мост · Novo-Andreevsky Bridge', c: [-6328.8, -1603.0], r: 20 },
  // ---
  { name: 'Ростральные колонны · Rostral Columns', c: [-2585.1, -1364.3], r: 22 }, { name: 'Ростральные колонны · Rostral Columns', c: [-2481.4, -1190.1], r: 22 },
  ...h._named(/Санкт-Петербургская Биржа/i, 16, { c: [-2590, -1245], r: 60 }).map((r) => ({ name: 'Биржа · Old Stock Exchange', ...r })),
  { name: 'Пушкинский Дом · Pushkin House (Customs house)', c: [-2797.2, -1380.1], r: 45 },
  { name: 'Стрелка Васильевского острова · Spit of Vasilievsky Island', c: [-2500, -1290], r: 120 },
  // ---
  { name: 'Кунсткамера · Kunstkamera', c: [-2613.3, -1012.9], r: 58 },
  { name: 'Академия наук · Academy of Sciences', c: [-2705.1, -940.4], r: 52 },
  { name: 'Памятник Ломоносову · Lomonosov monument', c: [-2777.2, -905.9], r: 22 },
  ...h._named(/Двенадцати коллегий/i, 14, { c: [-2910, -1030], r: 60 }).map((r) => ({ name: 'Двенадцать коллегий · Twelve Collegia (University)', ...r })),
  // ---
  { name: 'Меншиковский дворец · Menshikov Palace', c: [-3099, -721], r: 62 },
  { name: 'Первый кадетский корпус · First Cadet Corps', c: [-3178, -819], r: 70 },
  { name: 'Румянцевский сад · Rumyantsev Garden', c: [-3286, -672], r: 75 },
  { name: 'Румянцевский спуск · Rumyantsev Descent', c: [-3208, -590], r: 45 },
  // ---
  ..._groupPolys(SUBGROUPS['andrew-cathedral'], 14).map((r) => ({ name: 'Андреевский собор · St Andrew\'s Cathedral', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-market'], 8).map((r) => ({ name: 'Андреевский рынок · Andreevsky Market', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-pavilion'], 14).map((r) => ({ name: 'Станция метро «Василеостровская» · Vasileostrovskaya metro', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-pel'], 6).map((r) => ({ name: 'Дом Пеля · Pel house', ...r })),
  ..._groupPolys(SUBGROUPS['andrew-annunciation'], 10).map((r) => ({ name: 'Благовещенская церковь · Annunciation Church', ...r })),
  { name: 'Андреевский бульвар · Andreevsky Boulevard', c: [-3944, -976], r: 120 },
  // ---
  { name: 'Спуск со львами · Lions pier', c: [-2851, -1442], r: 26 },
  { name: 'Церковь Св. Екатерины у Тучкова моста · Church of St Catherine', c: [-3651, -1556], r: 50 },
  { name: 'Дома Яковлевых · Yakovlev houses', c: [-3392, -1500], r: 45 },
  { name: 'Лютеранская церковь Св. Екатерины · Lutheran Church of St Catherine', c: [-3460, -1041], r: 45 },
  { name: 'Дом Брюллова · Brullov house', c: [-3565, -1396], r: 35 },
  { name: 'Лютеранская церковь Св. Михаила · Lutheran Church of St Michael', c: [-3791, -1325], r: 45 },
  { name: 'Станция Спортивная · Sportivnaya exits', c: [-3773, -1695], r: 25 },
  // ---
  { name: 'Морской кадетский корпус · Naval Cadet Corps', c: [-4047.5, -336.6], r: 90 },
  { name: 'Памятник Крузенштерну · Krusenstern monument', c: [-3984, -242], r: 35 },
  { name: 'Подводная лодка С-189 · Submarine S-189', c: [-4236, 26], r: 50 },
  { name: 'Успенская церковь · Dormition church', c: [-4240, -110], r: 45 },
  // ---
  { name: 'Горный университет · Mining University', c: [-4565, 360], r: 75 },
  { name: 'Ледокол «Красин» · Icebreaker Krasin', c: [-4600, 512], r: 48 },
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
  { name: 'Эрарта · Erarta Museum', c: [-5593, 25], r: 58 },
  { name: 'Дворец культуры имени Кирова · Kirov Palace of Culture', c: [-5449, -145], r: 90 },
  { name: 'Сад Василеостровец · Vasileostrovets Garden', c: [-5273, -221], r: 85 },
  // ---
  { name: 'Смоленская церковь · Smolensk Icon Church', c: [-5612, -1525], r: 50 },
  { name: 'Святые ворота · Holy Gates of the cemetery', c: [-5502.6, -1529.6], r: 30 },
  { name: 'Смоленское православное кладбище · Smolensky Orthodox Cemetery', c: [-5730, -1231], r: 330 },
  // ---
  { name: 'Севкабель Порт · Sevkabel Port', c: [-6149, 933], r: 170 },
  { name: 'Брусницынский квартал · Brusnitsyn quarter', c: [-5640, 1085], r: 70 },
  // ---
  { name: 'Морской вокзал · Sea Terminal', c: [-6519, 709], r: 150 },
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
  // 1..3 the Spit, the Palace Bridge, the Academy of Arts; 4..0 the Rostral columns, Kunstkamera, Twelve Collegia, Menshikov palace, Andrew cathedral, Naval Corps, Mining University; Shift + 1..6 Smolensky cemetery, Kirov DK, Sevkabel, Sea Terminal, Krasin, Chernikhov tower; Places: Lions pier, Customs house, Tuchkov bridge, sphinxes (poses found with a ring search around each sight, then checked by tools/views-check.mjs).
  const HERO = { x: -2508.4, z: -1293.1, yaw: yawToward(-2508.4, -1293.1, -2609.8, -1232.7), pitch: 8 };      // the Spit (Strelka) looking at the Exchange
  const VIEWS = [
    { key: 'Digit1', label: 'Стрелка · Биржа', x: -2508.4, z: -1293.1, yaw: yawToward(-2508.4, -1293.1, -2609.8, -1232.7), pitch: 8 },
    { key: 'Digit2', label: 'Дворцовый мост · Дворцовая набережная', x: -2337, z: -848, yaw: yawToward(-2337, -848, -2495, -1075), pitch: 4 },
    { key: 'Digit3', label: 'Академия художеств', x: -3407.5, z: -497.9, yaw: yawToward(-3407.5, -497.9, -3431, -597), pitch: 10 },
    { key: 'Digit4', label: 'Ростральные колонны · Стрелка', x: -2481.4, z: -1230.1, yaw: yawToward(-2481.4, -1230.1, -2481.4, -1190.1), pitch: 8 },
    { key: 'Digit5', label: 'Кунсткамера · Университетская набережная', x: -2614.7, z: -962.8, yaw: yawToward(-2614.7, -962.8, -2612.7, -1012.8), pitch: 8 },
    { key: 'Digit6', label: 'Двенадцать коллегий · Университет', x: -2871.1, z: -1068.9, yaw: yawToward(-2871.1, -1068.9, -2910, -1030), pitch: 8 },
    { key: 'Digit7', label: 'Меншиковский дворец', x: -3137.7, z: -759.9, yaw: yawToward(-3137.7, -759.9, -3098.8, -721), pitch: 8 },
    { key: 'Digit8', label: 'Андреевский собор · Большой проспект', x: -3784.6, z: -753, yaw: yawToward(-3784.6, -753, -3802.7, -820.6), pitch: 10 },
    { key: 'Digit9', label: 'Морской кадетский корпус · Крузенштерн', x: -4064.7, z: -353.7, yaw: yawToward(-4064.7, -353.7, -4047, -336), pitch: 12 },
    { key: 'Digit0', label: 'Горный университет', x: -4521, z: 341, yaw: yawToward(-4521, 341, -4567, 359), pitch: 8 },
    { key: 'ShiftDigit1', label: 'Смоленское кладбище · церковь Смоленской иконы', x: -5616, z: -1468, yaw: yawToward(-5616, -1468, -5616, -1523), pitch: 8 },
    { key: 'ShiftDigit2', label: 'Дворец культуры имени Кирова', x: -5420.3, z: -194.1, yaw: yawToward(-5420.3, -194.1, -5444, -153), pitch: 8 },
    { key: 'ShiftDigit3', label: 'Севкабель Порт', x: -6140.8, z: 866.9, yaw: yawToward(-6140.8, 866.9, -6172, 921), pitch: 8 },
    { key: 'ShiftDigit4', label: 'Морской вокзал', x: -6519, z: 759, yaw: yawToward(-6519, 759, -6519, 709), pitch: 6 },
    { key: 'ShiftDigit5', label: 'Ледокол «Красин»', x: -4624, z: 550, yaw: yawToward(-4624, 550, -4600, 512), pitch: 6 },
    { key: 'ShiftDigit6', label: 'Водонапорная башня Чернихова · Средний проспект', x: -4796.9, z: 444.2, yaw: yawToward(-4796.9, 444.2, -4850, 430), pitch: 10 },
    // the Places list only
    { key: 'Place.lions', label: 'Спуск со львами · набережная Макарова', x: -2817.4, z: -1408.4, yaw: yawToward(-2817.4, -1408.4, -2851, -1442), pitch: 6 },
    { key: 'Place.customs', label: 'Таможня · Пушкинский Дом', x: -2824.5, z: -1332.4, yaw: yawToward(-2824.5, -1332.4, -2797, -1380), pitch: 8 },
    { key: 'Place.tuchkov', label: 'Тучков мост · набережная Макарова', x: -3715, z: -1723, yaw: yawToward(-3715, -1723, -3725, -1773), pitch: 6 },
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
    { id: 'r3084726', by: 'landmarksStrelka', group: 'exchange' },
    // ---
    { id: 'r3296328', by: 'landmarksUniversity', group: 'kunstkamera' },
    // ---
    { id: 'w216655164', by: 'landmarksMenshikov', group: 'menshikov-palace' },
    // ---
    { id: 'w84046074', by: 'landmarksAndrew', group: 'andrew-cathedral' },
    // ---
    { id: 'w54949806', by: 'landmarksMakarova', group: 'lutheran-catherine' },
    // ---
    { id: 'r1242815', by: 'landmarksNavalCorps', group: 'naval-corps' },
    // ---
    { id: 'r2902646', by: 'landmarksMining', group: 'mining-university' },
    // ---
    { id: 'w45965990', by: 'landmarksSredny', group: 'geolkom' },
    // ---
    { id: 'w108204300', by: 'landmarksModernVO', group: 'modernvo-smirnov' },
    // ---
    { id: 'w45966107', by: 'landmarksKirova', group: 'kirova-dk' },
    // ---
    { id: 'w30351796', by: 'landmarksSmolensky', group: 'smolensky-church' },
    // ---
    { id: 'r8702908', by: 'landmarksSevkabel', group: 'sevkabel-hall' },
    // ---
    { id: 'r6702553', by: 'landmarksSeaTerminal', group: 'sea-terminal' },
    // ---
    { id: 'w111944528', by: 'landmarksVOStatues', group: 'vo-church-armenian' },
    // ---
    { id: 'w362796524', by: 'bridges', group: 'palace' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6',
    'Place.lions', 'Place.customs', 'Place.tuchkov', 'Place.sphinxes'],
  mustHaveAreas: [
    { x: -2420, z: -975, has: 'дворцовый' }, { x: -3378.7, z: -507.7, has: 'сфинкс' }, { x: -3420, z: -502, has: 'университетская' },
    { x: -2481.4, z: -1230.1, has: 'стрелка' }, { x: -2614.7, z: -962.8, has: 'кунсткамера' }, { x: -3137.7, z: -759.9, has: 'меншиков' }, { x: -4521, z: 341, has: 'горный' },
    { x: -5420.3, z: -194.1, has: 'кирова' }, { x: -6140.8, z: 866.9, has: 'севкабель' }, { x: -6519, z: 759, has: 'морской вокзал' },
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
 *  the others get an invisible fallback deck (walk box + parapet boxes). The island's bridges have their rows below (docs/vo-br.md). */
const BRIDGE_ZONES = [
  { id: 'palace', name: 'Дворцовый мост', key: 'neva', c: [-2322, -884], axis: 143, w: 30, len: 255, own: true },
  // the bridges of the island (bridges/groups-vo.js): the quay stays open over the drawn deck (c, axis, w, len = the OSM deck polygons, the rows of the source project's BRIDGE_SHADES); the bridges module closes the rest with wing walls
  { id: 'birzhevoy', name: 'Биржевой мост', key: 'neva', c: [-2678.7, -1544.8], axis: 3.63, w: 27.3, len: 238.7, own: true },
  { id: 'tuchkov', name: 'Тучков мост', key: 'neva', c: [-3676.7, -1842.5], axis: 34.69, w: 36.0, len: 220.1, own: true },
  { id: 'uralsky', name: 'Уральский мост', key: 'smolenka', c: [-4626.9, -1826.9], axis: 144.3, w: 31.0, len: 21.6, own: true },
  { id: 'smolensky', name: 'Смоленский мост', key: 'smolenka', c: [-5286.9, -1645.8], axis: 149.5, w: 28.2, len: 21.3, own: true },
  { id: 'nalichny', name: 'Наличный мост', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7, own: true },
  { id: 'novo-andreevsky', name: 'Ново-Андреевский мост', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3, own: true, foot: true },
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'palace-deck', key: 'neva', c: [-2415.2, -977.3], axis: 323.5, w: 27.7, len: 254.5 },
  { id: 'blagoveshchensky-deck', key: 'neva', c: [-3448.92, -263.75], axis: 334.3, w: 37.4, len: 332.6 },      // the Blagoveshchensky Bridge (bridges/blag.js)
  { id: 'birzhevoy-deck', key: 'neva', c: [-2678.7, -1544.8], axis: 3.63, w: 27.3, len: 238.7 },      // the Birzhevoy Bridge (bridges/long.js)
  { id: 'tuchkov-deck', key: 'neva', c: [-3676.7, -1842.5], axis: 34.69, w: 36.0, len: 220.1 },      // the Tuchkov Bridge (bridges/long.js)
  { id: 'uralsky-deck', key: 'smolenka', c: [-4626.9, -1826.9], axis: 144.3, w: 31.0, len: 21.6 },
  { id: 'smolensky-deck', key: 'smolenka', c: [-5286.9, -1645.8], axis: 149.5, w: 28.2, len: 21.3 },
  { id: 'nalichny-deck', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7 },
  { id: 'novo-andreevsky-deck', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3 },
];

/** bridge sites (bridges/sites.js) left out of this area: the Hermitage Bridge over the Winter Canal (centre (-1919, -1137), deck 16.5 m wide) stands in the data margin, 81 m beyond the east edge of the play rectangles (VO23 ends at x -2000),
 *  so its deck would be built, its quay opened and its pavements walked in a place the player can never reach (it passes sites.js siteInArea only because its centre lies in the data extent) */
export const BRIDGE_SITES_OFF = ['hermitage'];

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
  clipLines: [['x', -4420], ['x', -4430], ['x', -5370], ['x', -6070], ['x', -5000], ['z', 1370], ['z', 1720], ['z', 1770]],      // the part seam of the Bolshaya Neva polygons 2:0 / 2:1 across the bay south of the island: their rims overlap by 10 m (2:0 ends on x = -4430, 2:1 begins on x = -4420) and each stood as a quay wall across the water (1.4 km of wall)
  farSources: ['neva-up', 'neva-down', 'neva-malaya', 'vo-sea'],
  farCenter: [-4500, -200],             // the middle of the area (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [[-2460.8, -1097.5, -2460.7, -1098.7]],      // the 1.2 m corner edge of the Neva polygon beside the Palace Bridge plug
  openMouths: [[-6741.7, 634.8, -6842.3, 2102.6]],      // the closing edge of the Neva Bay polygon = the east edge of the Gulf ring (vo-sea.js): water on both sides, no quay wall (1.5 km of it stood across the open water)
  dataWater: [{ id: 'r1576084', key: 'smolenka' }, { id: 'r1576086', key: 'smolenka' }, { id: 'r1576116', key: 'neva' }],
  dataRings: [{ id: 'malaya-neva', key: 'neva', source: 'neva-malaya' },
    // the Gulf of Finland west of the island (environment/vo-sea.js, the ring VO_SEA of the source): the sea beyond the Sea Terminal and the Gavan, so that the western horizon is water, not flat ground; clipped to the data region like the Malaya Neva
    { id: 'gulf', key: 'neva', source: 'vo-sea' },
    // the Neva Bay south of the island: the data polygons of the Bolshaya Neva end on the lines z 1370 / 1720 / 1770 (the part seams of the source bake), but the territory goes on to z 1920 (the wedge of rectangles VO56 .. VO63 round the bay):
    // three patches of water fill the gap down to the data region's border (z 2640), so that the bay is water to the edge of the play area (the cut lines are clip lines, no wall)
    { id: 'bay-a', key: 'neva', ring: [-7840, 1370, -6070, 1370, -6070, 2640, -7840, 2640] },
    { id: 'bay-b', key: 'neva', ring: [-6070, 1720, -5370, 1720, -5370, 2640, -6070, 2640] },
    { id: 'bay-c', key: 'neva', ring: [-5370, 1770, -5000, 1770, -5000, 2640, -5370, 2640] }],
  pierFit: { 'w74745049#0': { cx: -4353.4, cz: 177.9, ax: -0.602, az: 0.798, len: 256, wid: 9.6 } },      // the mole w74745049: 256 m x 9 m on the line (-4276, 76) .. (-4430, 280); the bounding rectangle of its bumps was 255 x 40 m      // the Malaya Neva (OSM relation 72500, environment/neva-malaya.js) between the Spit and the Gulf: real water with real shores inside the data region (Birzhevoy and Tuchkov bridges cross it)
  slopeReaches: SLOPE_REACHES,
  keyByName: {},
  riverKeys: { 'Смоленка': 'smolenka', 'Кронверкский пролив': 'neva', 'Ждановка': 'neva' },
  ownerRings: RINGS_WATER,
  keepOut: RINGS_KEEP_OUT,
};
/** ground that landmark modules pave themselves (claims.js): from ./rings.js */
export const PAVED_RINGS = RINGS_PAVED;

// ---------------------------------------------------------------- PEOPLE / WILDLIFE
/** the hot spots of the zone weight field: [x, z, amplitude, sigma]. The foundation's four rows (the Spit, the Rostral columns, the sphinx pier, the Academy of Arts) and the gathering places of the ported modules: every row sits on a
 *  crowd / photo spot that the module itself publishes (services.<module>.crowd / .photoSpots, docs/vo-m1..m4.md; amplitude from the crowd size n: ~0.1 per person, a queue or a metro door higher, a quiet corner lower; sigma from the radius r),
 *  inside the play rectangles (every row is inPlay with an 8 m margin, checked in the fix round). Admiralty's rows are the pattern. */
const PEOPLE_HOT = [
  [-2495, -1298, 2.0, 60],        // the Spit: the Birzhevaya Square garden, the descent to the Neva
  [-2481, -1190, 1.4, 30],        // the Rostral columns
  [-3378, -507, 1.5, 25],         // the sphinx pier
  [-3431, -597, 1.0, 40],         // the Academy of Arts
  // ---- the Spit and the Universitetskaya embankment (docs/vo-m1.md)
  [-2453, -1326, 1.0, 14], [-2851, -1441, 0.8, 14], [-2783, -1423, 0.6, 14],        // the Spit's granite descent / pier (landmarksStrelka), the Lions pier, Pushkin House (the Customs house)
  [-2593, -995, 1.4, 26], [-2691, -925, 1.0, 20], [-2770, -895, 0.8, 14], [-2785, -840, 0.6, 16],        // the Kunstkamera front, the Academy of Sciences portico, the Lomonosov monument, the Twelve Collegia
  [-3495, -702, 0.7, 20], [-3532, -487, 0.6, 14],        // the Academic Garden column, the Trezzini monument (landmarksAcademy)
  // ---- the Menshikov palace, the Rumyantsev garden, the Cadet Corps (docs/vo-m2.md)
  [-3086, -699, 1.3, 20], [-3121, -688, 1.1, 14], [-3280, -662, 1.0, 24], [-3304, -703, 0.6, 16], [-3220, -590, 0.9, 22],        // the palace forecourt, the ticket queue, the obelisk garden, the garden pavilion, the pontoons of the apron
  // ---- the Andreevsky market, boulevard and cathedral, the Vasileostrovskaya metro (docs/vo-m3.md)
  [-3708, -671, 1.3, 24], [-3753, -749, 1.1, 22], [-3769, -678, 0.6, 14], [-3828, -796, 1.2, 28],        // the market court and its north front, the Pel house corner, the boulevard at the Bolshoy prospekt
  [-3892, -899, 0.9, 18], [-3969, -1031, 0.9, 18], [-3947, -972, 0.8, 14], [-4041, -1168, 0.8, 16],        // the two boulevard fountains, the Korchmin and the Konka monuments
  [-4080, -1145, 2.0, 22],        // the Vasileostrovskaya metro pavilion (two doors)
  [-4337, -1473, 0.9, 22], [-4361, -1529, 0.7, 16],        // the Annunciation church forecourt and its garden circle
  [-3774, -1686, 1.4, 14], [-3682, -1540, 0.6, 14], [-3445, -1001, 0.6, 14],        // the Sportivnaya exits 6 / 7, the church of St Catherine, the Lutheran church (landmarksMakarova)
  // ---- the Naval Cadet Corps, the Mining University and the Krasin (docs/vo-m2.md)
  [-3990, -250, 0.9, 24], [-4256, -1, 0.8, 16],        // the Krusenstern monument, the S-189 promenade
  [-4564, 361, 1.5, 22], [-4545, 374, 0.8, 14], [-4614, 475, 1.2, 22],        // the Mining stair and colonnade, the descent to the Neva, the Krasin amphitheatre and quay
  // ---- the Sredny prospekt (docs/vo-m3.md)
  [-5036, -5, 1.5, 22], [-4981, -660, 0.8, 16], [-5019, -742, 0.7, 18],        // the Gorny Institut plaza, the Geological Committee stair, the tram depot apron
  // ---- Kirov Palace of Culture, Erarta, the Vasileostrovets garden (docs/vo-m4.md)
  [-5426, -110, 1.3, 22], [-5508, 18, 1.0, 24], [-5248, -179, 0.9, 22], [-5297, -259, 0.6, 14], [-5301, 59, 0.6, 12],        // the DK portal apron, Erarta (its stair and cafe crowds, (-5574, 19), lie 66 m beyond the west border, VO37 / VO38 end at x -5520: the row stands at the nearest inside point), the Roerich plaza, the playground, the Sobchak monument
  // ---- the Smolensky cemetery (docs/vo-m4.md)
  [-5586, -1325, 2.2, 16],        // the queue to the chapel of St Xenia (four pilgrim groups, ~34 people)
  [-5602, -1509, 0.9, 16], [-5603, -1386, 0.6, 12], [-5488, -1530, 0.9, 16], [-5484, -1556, 0.7, 16],        // the Smolensk church portico, the Trinity chapel, the Holy Gates, the Resurrection church
  // ---- Sevkabel Port (docs/vo-m4.md): the hall, its yard, the sea square and the promenade lie mostly beyond the stepped west border (VO49 .. VO52 end at x -6160 .. -6000; the sea square (-6246, 853), the inner alley (-6134, 903) and the promenade
  //      (-6191, 946) are outside), so the rows stand on the nearest inside land: the gate and the yard edge by the hall, the pier plaza edge, the Istkabel courtyard, the Brusnitsyn lane
  [-6140, 868, 1.5, 34], [-6138, 852, 0.7, 12], [-6064, 948, 0.8, 22], [-5900, 990, 0.8, 22], [-5685, 1073, 0.5, 16],
  // ---- the Sea Terminal (docs/vo-m4.md): the Sea Glory square, the car park front (the north-west end, (-6568, 587), is outside)
  [-6371, 685, 1.3, 28], [-6300, 640, 0.9, 24], [-6469, 614, 0.8, 26],
];
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields) */
const PIGEON_ZONES = [
  { tag: 'strelka', kind: 'pigeon', x: -2495, z: -1298, spread: 24, n: 3, w: 2.6, r: 5, name: 'Голуби на Стрелке · Pigeons on the Spit' },
  { tag: 'sphinx', kind: 'pigeon', x: -3378, z: -507, spread: 14, n: 1, w: 1.4, r: 4, name: 'Голуби у сфинксов · Pigeons at the sphinxes' },
  { tag: 'strelka', kind: 'sparrow', x: -2500, z: -1280, spread: 16, n: 1, w: 1.5, r: 3, name: 'Воробьи на Стрелке · Sparrows on the Spit' },
  // ---- the ported modules (the same hot spots as PEOPLE_HOT): the pavements where people stand and feed them
  { tag: 'kunstkamera', kind: 'pigeon', x: -2593, z: -995, spread: 18, n: 2, w: 1.8, r: 4.5, name: 'Голуби у Кунсткамеры · Pigeons at the Kunstkamera' },
  { tag: 'lomonosov', kind: 'pigeon', x: -2770, z: -895, spread: 14, n: 1, w: 1.2, r: 4, name: 'Голуби у памятника Ломоносову · Pigeons at the Lomonosov monument' },
  { tag: 'menshikov', kind: 'pigeon', x: -3086, z: -699, spread: 16, n: 1, w: 1.3, r: 4, name: 'Голуби у Меншиковского дворца · Pigeons at the Menshikov Palace' },
  { tag: 'rumyantsev', kind: 'pigeon', x: -3280, z: -662, spread: 22, n: 2, w: 1.6, r: 4.5, name: 'Голуби в Румянцевском саду · Pigeons in the Rumyantsev Garden' },
  { tag: 'andrew', kind: 'pigeon', x: -3708, z: -671, spread: 20, n: 2, w: 1.7, r: 4.5, name: 'Голуби у Андреевского рынка · Pigeons at the Andreevsky Market' },
  { tag: 'boulevard', kind: 'pigeon', x: -3892, z: -899, spread: 22, n: 2, w: 1.5, r: 4.5, name: 'Голуби на Андреевском бульваре · Pigeons on the Andreevsky Boulevard' },
  { tag: 'mining', kind: 'pigeon', x: -4564, z: 361, spread: 16, n: 1, w: 1.2, r: 4, name: 'Голуби у Горного университета · Pigeons at the Mining University' },
  { tag: 'erarta', kind: 'pigeon', x: -5508, z: 18, spread: 14, n: 1, w: 1.0, r: 4, name: 'Голуби у Эрарты · Pigeons by Erarta' },
  { tag: 'xenia', kind: 'pigeon', x: -5586, z: -1325, spread: 12, n: 1, w: 1.4, r: 3.5, name: 'Голуби у часовни Ксении Блаженной · Pigeons at the chapel of St Xenia' },
  { tag: 'sevkabel', kind: 'pigeon', x: -6140, z: 868, spread: 22, n: 2, w: 1.4, r: 4.5, name: 'Голуби во дворе Севкабеля · Pigeons in the Sevkabel yard' },
  { tag: 'seaglory', kind: 'pigeon', x: -6371, z: 685, spread: 20, n: 1, w: 1.1, r: 4, name: 'Голуби на площади Морской Славы · Pigeons on the Sea Glory Square' },
  { tag: 'rumyantsev', kind: 'sparrow', x: -3304, z: -703, spread: 14, n: 1, w: 1.5, r: 3, name: 'Воробьи в Румянцевском саду · Sparrows in the Rumyantsev Garden' },
  { tag: 'boulevard', kind: 'sparrow', x: -3969, z: -1031, spread: 14, n: 1, w: 1.3, r: 3, name: 'Воробьи на Андреевском бульваре · Sparrows on the Andreevsky Boulevard' },
];
/** the districts a crow likes: crows start on a tree top there when the player is not about (the Smolensky cemetery, the Rumyantsev garden, the Menshikov garden). At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -5850, z: -1400, r: 430 }, { x: -3495, z: -702, r: 120 }, { x: -3270, z: -660, r: 90 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] } */
const CROWDS = {
  strelka: [45, 50, 0.8], sphinx: [22, 30, 0.6],
  kunstkamera: [28, 35, 0.6], lomonosov: [14, 25, 0.45], menshikov: [20, 30, 0.55], rumyantsev: [24, 35, 0.5], andrew: [28, 40, 0.6], boulevard: [24, 35, 0.5],
  mining: [24, 35, 0.6], erarta: [18, 30, 0.55], xenia: [14, 25, 0.7], sevkabel: [34, 45, 0.75], seaglory: [26, 35, 0.5],
};

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
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east; the pose stands on the Spit beside the one-way carriageway of Birzhevaya Square; tools/area-garage-check.mjs measures the nearest point of the footprint 3.8 m from the driven lane) } }  a car without a pose is not built
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
  'landmarksStrelka',
  //
  'landmarksUniversity',
  //
  'landmarksMenshikov',
  //
  'landmarksAndrew',
  //
  'landmarksSredny',
  //
  'landmarksKirova',
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
