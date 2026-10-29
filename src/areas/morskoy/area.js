// ============================================================================
//  AREA DEFINITION - Morskoy (Морской; docs/AREAS.md section 15.v, the Vasilyevsky protocol): map area 47 (letter M) of the world map (maps/intro-draft.html): the west coast of Vasilyevsky Island - the Marine Facade passenger port on its
//  land fill, Pribaltiyskaya Square with the hotel and the monuments of Peter I, the Creators of the Fleet and Admiral Nakhimov, the cruiser Kirov memorial, the Golden City quarter, the Nalichny and Shipbuilders' bridges, the mouth of the
//  Smolenka with the four Smolensky bridges, the Western High-Speed Diameter - with the Gulf of Finland off the coast. 8.9 km2 of play rectangles (src/areas/registry.js REGISTRY.morskoy.play, territory policy B600: the land outline of the map plus
//  the water cells within 600 m of the land, tools/area-shape.mjs --k 47 --water-band 600 --js morskoy: 49 rectangles M01 .. M49), the data cut straight from the source project by tools/area-data-cut.mjs.
//  THE MODULES (built in the order of MODULES below): the base modules of the engine; landmarksMarineFacade (the port, the galleries, the liners, the Golden City spire); landmarksPribaltiyskaya (the hotel, Peter I, the Creators of the Fleet, the Kirov
//  memorial, Nakhimov); the polar explorers monument (landmarksVOStatues, filtered to the one piece that stands here); the bridges (the Nalichny Bridge with its four corner stairs and the Novo-Andreevsky footbridge that Vasilyevsky already ported, the
//  Shipbuilders' Bridge and the 1st - 4th Smolensky bridges of the Smolenka mouth, the WHSD with its crossings: bridges/groups-mo.js) and the water of the data (the Smolenka mouth with the Kovsh, the Gulf of Finland).
//  This area contains NO railway station: no `rail`, no landmarksA / B / C, no metro module, and ONE purple Zhiguli at the spawn (docs/AREAS.md 13.4).
//  morskoy.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this file) and NO import of another area's
//  module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
//
//  THE PORT SLOTS (the protocol of the later waves; every slot is ONE line, the slots are separated by an unchanged `// ---` line so that the branches of parallel agents merge without a conflict):
//    // PORT-IMPORT: <module>   -> `import { GROUPS_LIST as G_X } from '../../world/<module>/groups.js';`
//    // PORT-MODULE: <module>   -> `'<module>',  // what it draws`                          (inside MODULES, in build order)
//    // PORT-LABEL: <module>    -> `<module>: 'loading words',`                               (inside LABELS)
//    // PORT-GROUPS: <module>   -> `GROUPS.<module> = G_X;`   (a filter of the list when a group lies outside the territory; `bridgesMo` -> `GROUPS.bridges = GROUPS.bridges.concat(G_BRMO);`)
//    // PORT-AREAS: <module>    -> the rows of the HUD location table (makeAreas)
//    // PORT-HAVE: <module>     -> a row of TEST.mustHaveAreas ({ x, z, has }) for the HUD rows it added
//    // PORT-CLAIMED: <module>  -> `{ id: '<OSM id>', by: '<module>', group: '<key>' },`        (TEST.claimed: one row per module)
//    // PORT-PRUNE: <module>    -> `'<module>',` inside PRUNE_SERVICES (a module whose `entrances` should clear the trees)
//    // PORT-ZONES: bridgesMo   -> the BRIDGE_ZONES / BRIDGE_SHADES rows of the bridges that bridgesMo adds (one slot in each table)
//  and the rings of a module (water pits, keep-outs, paved ground) go to src/areas/morskoy/rings.js (its own protocol, PORT-IMPORT / PORT-SOURCE).
// ============================================================================
import { GROUPS_VO } from '../../world/bridges/groups-vo.js';
import { GROUPS_LIST as G_VOSTATUES } from '../../world/landmarksVOStatues/groups.js';
import { WATER_RINGS as RINGS_WATER, KEEP_OUT as RINGS_KEEP_OUT, PAVED_RINGS as RINGS_PAVED } from './rings.js';
// ---
import { GROUPS_LIST as G_MARINEFACADE } from '../../world/landmarksMarineFacade/groups.js';
// ---
import { GROUPS_LIST as G_PRIBALTIYSKAYA } from '../../world/landmarksPribaltiyskaya/groups.js';
// ---
import { mo as MO_ROWS } from '../../world/bridges/groups-mo.js';      // bridgesMo: the Shipbuilders' and the four Smolensky mouth bridges, the WHSD (bridges/groups-mo.js: imported only by the new areas)

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'morskoy';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/morskoy/';
/** A missing or stale bake is an error card, never a minutes-long procedural build (a hand-off lands here). */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No `rail` and no landmarksA / B / C (no station, no tracks), no metro network, no Palace Bridge. The landmark modules of the area are added
 *  in the PORT-MODULE slots (in this order: the port first, then Pribaltiyskaya, as in the source project). tools/modules-list.mjs parses this list: one quoted name per line (comment lines are ignored). */
export const MODULES = [
  'environment',  // ground, embankment granite, the Gulf of Finland, the Smolenka mouth and the Kovsh water, trees, lawns, flowerbeds, far skyline
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'landmarksMarineFacade', // the Marine Facade passenger port (terminals, quay galleries, liners, fences, masts, marina), the Golden City quarter-6 spire (docs/gdm-M.md)
  //
  'landmarksPribaltiyskaya', // the Pribaltiyskaya hotel, Peter I, the Creators of the Fleet, the Nakhimov statue, the Kirov memorial, Waterville
  //
  'landmarksVOStatues', // the monument to all polar explorers (the one piece of the module that stands in this territory, docs/vo-m3.md)
  'bridges',      // the bridges of the area: the Nalichny Bridge and the Novo-Andreevsky footbridge (docs/vo-br.md); the Shipbuilders' and Smolensky bridges of the Smolenka mouth and the WHSD with its crossings (bridgesMo: bridges/groups-mo.js)
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses, trams + parked cars
  'people',       // pedestrians, tourists, groups with guides, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the purple Zhiguli (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksMarineFacade: 'Морской фасад, Golden City',
  // ---
  landmarksPribaltiyskaya: 'Прибалтийская, памятник Петру I, крейсер «Киров»',
  // ---
  landmarksVOStatues: 'Памятник всем полярникам',
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
    // the west of Vasilyevsky Island (names as in the OSM data, tools: the drivable named roads of the data cut by length)
    nalichnaya: 'Наличная улица', smolenka: 'набережная реки Смоленки', beringa: 'улица Беринга', odoevskogo: 'улица Одоевского', novosmolenskaya: 'Новосмоленская набережная', malyVO: 'Малый проспект В.О.',
    kruzenshterna: 'проспект Крузенштерна', shipbuilders: 'улица Кораблестроителей', golovnina: 'бульвар Головнина', morskayaNab: 'Морская набережная', michmanskaya: 'Мичманская улица',
    chirikova: 'улица Чирикова', grina: 'бульвар Александра Грина', chelyuskina: 'улица Челюскина', nakhimova: 'улица Нахимова', lisyanskogo: 'улица Лисянского', vilkitskogo: 'Вилькицкий бульвар',
    miklukhoMaklaya: 'набережная Миклухо-Маклая', pribaltiyskayaSq: 'Прибалтийская площадь', europeSq: 'площадь Европы', whsd: 'ЗСД',
  },
};

// ---------------------------------------------------------------- the local frames: anchors of the strip (Vosstaniya Square, the obelisk, the Moscow station)
// The engine reads these from every area (the Nevsky grid origin SQUARE: the style of a block follows its distance to it, city/archetypes.js, streets/style.js): COPIES of the strip's, so every page agrees.
// This territory contains neither the square nor the station (they are 9 km east); the values only anchor the grid.
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
// ---
GROUPS.landmarksMarineFacade = G_MARINEFACADE;      // all 8 sub-groups lie inside the territory (docs/gdm-M.md)
// ---
GROUPS.landmarksPribaltiyskaya = G_PRIBALTIYSKAYA;      // all six: the hotel, Peter I, the Creators of the Fleet, the Kirov memorial, the Nakhimov statue, Waterville (all 100 % inside the territory)
// ---
// the polar explorers monument n5102741821 stands at (-6686, -1607), in the overlap with Vasilyevsky (both areas claim it): the other 18 pieces of the module lie on the island, far outside this territory
GROUPS.landmarksVOStatues = G_VOSTATUES.filter((g) => g.key === 'vo-polar');
// ---
// the bridges that lie in the overlap with Vasilyevsky and are ported there (bridges/groups-vo.js): the Nalichny Bridge (its four corner stairs go through rings.js) and the Novo-Andreevsky footbridge
GROUPS.bridges = GROUPS_VO.filter((b) => b.key === 'nalichny' || b.key === 'novo-andreevsky');
// bridgesMo (docs/gdm-B.md): the Shipbuilders' Bridge, the 1st .. 4th Smolensky bridges of the Smolenka mouth, the WHSD (the part of it that lies in this data extent: the at-grade stretch with its open cutting, the portals, the first 440 m of the viaduct) and the decks
// that cross the at-grade stretch (the Mikhmanskaya overpass, the park footbridges)
GROUPS.bridges = GROUPS.bridges.concat(MO_ROWS(['korablestroiteley', 'smol1', 'smol2', 'smol3', 'smol4', 'whsd', 'whsd-crossings']));

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { _shoreOf, inRiver } = h;
  return [
  { name: 'Наличный мост · Nalichny Bridge', c: [-6702.1, -1707.9], r: 48 },
  { name: 'Ново-Андреевский мост · Novo-Andreevsky Bridge', c: [-6328.8, -1603.0], r: 20 },
  { name: 'Мост Кораблестроителей · Korablestroiteley Bridge', c: [-7532.2, -1948], r: 52 },
  { name: '1-й Смоленский мост · 1st Smolensky Bridge', c: [-8059.5, -2005.4], r: 20 },
  { name: '2-й Смоленский мост · 2nd Smolensky Bridge', c: [-8008.7, -2182.8], r: 20 },
  { name: '3-й Смоленский мост · 3rd Smolensky Bridge', c: [-7955.6, -1975.4], r: 34 },
  { name: '4-й Смоленский мост · 4th Smolensky Bridge', c: [-7903.2, -2151], r: 34 },
  // ---
  { name: 'Памятник всем полярникам · Polar explorers monument', c: [-6686, -1607.2], r: 22 },
  // ---
  ...h._named(/Морской фасад/i, 40, { c: [-9040, -1750], r: 450 }).map((r) => ({ name: 'Морской фасад · Marine Facade', ...r })),
  { name: 'Маяк · арт-объект · Mayak art object', c: [-8683.7, -810.8], r: 12 },
  { name: 'Маяк · арт-объект · Mayak art object', c: [-8666.9, -541.2], r: 14 },
  { name: 'Golden City · квартал 6 со шпилем', c: [-9149, -1078], r: 150 },
  { name: 'Golden City · квартал 6 со шпилем', c: [-8700, -900], r: 140 },
  { name: 'Морской фасад · Marine Facade', x0: -9700, x1: -8570, z0: -2400, z1: -1050, test: (x, z) => !inRiver(x, z) },
  // ---
  { name: 'Памятник Петру I · Peter I monument', c: [-7477, -791], r: 40 },
  { name: 'Гостиница «Прибалтийская» · Pribaltiyskaya Hotel', c: [-7600, -735], r: 175 },
  { name: 'Памятник крейсеру «Киров» · Cruiser Kirov monument', c: [-7970, -1075], r: 65 },
  { name: 'Сквер Малые Гаванцы · Malye Gavantsy Square', poly: [-7233.7, -713.7, -7231.8, -709.9, -7237, -707.7, -7239.4, -707.5, -7241.6, -708.5, -7243.1, -709.9, -7258.8, -742.9, -7262.3, -747.4, -7267.2, -750.5, -7273.1, -753.2, -7279, -753.6, -7285.3, -751.8, -7291.1, -748.2, -7294.3, -743.6, -7296, -738.9, -7296.5, -733, -7295.2, -726.5, -7279.6, -693.3, -7279.7, -690.6, -7280.8, -687.8, -7282.7, -685.8, -7331.3, -662.8, -7355, -710.6, -7359, -713.4, -7361.8, -714.2, -7379.7, -716.5, -7404.9, -771.5, -7397.4, -774.9, -7395.4, -771.2, -7376.8, -780.1, -7374.4, -786.2, -7381.7, -789.9, -7384.1, -795.1, -7251.1, -857, -7248.6, -851.9, -7242.8, -854, -7242.5, -856.6, -7241.4, -858.8, -7232.4, -864, -7176.9, -737.9, -7177.5, -735.6, -7179.6, -733.9, -7199.5, -724.9, -7201.4, -728.9], margin: 4 },      // the park r19581548 (the source's GREEN polygon)
  // ---
  { name: 'ЗСД · Western High-Speed Diameter', road: NAMES.streets.whsd },
  { name: 'Морская набережная · Morskaya Embankment', road: NAMES.streets.morskayaNab },
  { name: 'Новосмоленская набережная · Novosmolenskaya Embankment', road: NAMES.streets.novosmolenskaya },
  { name: 'Набережная Миклухо-Маклая · Miklukho-Maklaya Embankment', road: NAMES.streets.miklukhoMaklaya },
  { name: 'Проспект Крузенштерна · Prospekt Kruzenshterna', road: NAMES.streets.kruzenshterna },
  { name: 'Улица Кораблестроителей · Ulitsa Korablestroiteley', road: NAMES.streets.shipbuilders },
  { name: 'Бульвар Головнина · Bulvar Golovnina', road: NAMES.streets.golovnina },
  { name: 'Бульвар Александра Грина · Bulvar Aleksandra Grina', road: NAMES.streets.grina },
  { name: 'Наличная улица · Nalichnaya ulitsa', road: NAMES.streets.nalichnaya },
  { name: 'Мичманская улица · Michmanskaya ulitsa', road: NAMES.streets.michmanskaya },
  { name: 'Улица Нахимова · Ulitsa Nakhimova', road: NAMES.streets.nakhimova },
  { name: 'Улица Чирикова · Ulitsa Chirikova', road: NAMES.streets.chirikova },
  { name: 'Улица Челюскина · Ulitsa Chelyuskina', road: NAMES.streets.chelyuskina },
  { name: 'Улица Беринга · Ulitsa Beringa', road: NAMES.streets.beringa },
  { name: 'Улица Лисянского · Ulitsa Lisyanskogo', road: NAMES.streets.lisyanskogo },
  { name: 'Улица Одоевского · Ulitsa Odoevskogo', road: NAMES.streets.odoevskogo },
  { name: 'Вилькицкий бульвар · Vilkitsky Bulvar', road: NAMES.streets.vilkitskogo },
  { name: 'Прибалтийская площадь · Pribaltiyskaya Square', road: NAMES.streets.pribaltiyskayaSq },
  { name: 'Площадь Европы · Europe Square', road: NAMES.streets.europeSq },
  { name: 'Малый проспект В.О. · Maly Prospekt V.O.', road: NAMES.streets.malyVO },
  // the mouth of the Smolenka (r1576084, the arms r1576086, the mouth basin w428079227) and the Kovsh (w95646723) are one waterway, 'smolenka'
  { name: 'Смоленка · Smolenka River', x0: -8700, x1: -5900, z0: -2250, z1: -1400, test: (x, z) => _shoreOf(['smolenka'], x, z) < 14 },
  { name: 'Финский залив · Gulf of Finland', x0: -11000, x1: -5900, z0: -4000, z1: 1000, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Морской · Morskoy', x0: -10400, x1: -5900, z0: -3100, z1: 700 },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs --land adds the colliders and the water test). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // 1 the hotel from the square (= HERO), 2 Peter I, 3 the Kirov memorial, 4 Golden City, 5 Terminal 1, 6 the liner berth, 7 Terminal 3 from the east gate, 8 the control centre, 9 Terminal 4 from the bus loop, 0 Nakhimov;
  // Shift + 1..7 Shipbuilders' bridge, the Smolensky mouth bridges, the light-and-music fountain, the WHSD at the Michmanskaya overpass, the viaduct start, the Golden City crown row, the hotel rear;
  // Places: the Nalichny Bridge, the Mayak. (Poses from the scouts' ring searches around each sight, then verified by tools/views-check.mjs --land.)
  const HERO = { x: -7516.6, z: -772.5, yaw: 114.4, pitch: 6 };      // the hotel facade from Pribaltiyskaya Square
  const VIEWS = [
    { key: 'Digit1', label: 'Гостиница «Прибалтийская» · площадь', x: -7516.6, z: -772.5, yaw: 114.4, pitch: 6 },
    { key: 'Digit2', label: 'Памятник Петру I · Прибалтийская площадь', x: -7464.1, z: -796.1, yaw: 114.4, pitch: 28 },
    { key: 'Digit3', label: 'Памятник крейсеру «Киров»', x: -7992.7, z: -1065.3, yaw: -65.3, pitch: 12 },
    { key: 'Digit4', label: 'Golden City · квартал 6', x: -8689.2, z: -805.9, yaw: 5.5, pitch: 18 },
    { key: 'Digit5', label: 'Морской фасад · терминал 1', x: -9285.5, z: -1208.1, yaw: 19.5, pitch: 4 },
    { key: 'Digit6', label: 'Морской фасад · причал лайнера', x: -8700, z: -1500, yaw: 56, pitch: 6 },
    { key: 'Digit7', label: 'Морской фасад · терминал 3 от восточных ворот', x: -8699, z: -1800, yaw: yawToward(-8699, -1800, -9040, -1750), pitch: 4 },
    { key: 'Digit8', label: 'Морской фасад · КПП и залы досмотра', x: -8735, z: -1618, yaw: yawToward(-8735, -1618, -8760, -1750), pitch: 3 },
    { key: 'Digit9', label: 'Морской фасад · терминал 4 от автобусного кольца', x: -9098, z: -2268, yaw: yawToward(-9098, -2268, -9040, -1750), pitch: 6 },
    { key: 'Digit0', label: 'Памятник адмиралу Нахимову', x: -7309, z: -840, yaw: yawToward(-7309, -840, -7309, -804), pitch: 6 },
    { key: 'ShiftDigit1', label: 'Мост Кораблестроителей', x: -7497, z: -1906, yaw: 39.8, pitch: 6 },
    { key: 'ShiftDigit2', label: 'Мосты Смоленского устья', x: -7870, z: -2063, yaw: 90, pitch: 6 },
    { key: 'ShiftDigit3', label: 'Светомузыкальный фонтан · сквер Володина', x: -7975, z: -2079, yaw: 90, pitch: 6 },
    { key: 'ShiftDigit4', label: 'ЗСД · Мичманская улица', x: -8220, z: -1612, yaw: 59.4, pitch: 6 },
    { key: 'ShiftDigit5', label: 'ЗСД · начало эстакады', x: -7830, z: -300, yaw: 90, pitch: 6 },
    { key: 'ShiftDigit6', label: 'Golden City · ряд золотых шпилей', x: -8830, z: -990, yaw: 90, pitch: 6 },
    { key: 'ShiftDigit7', label: 'Гостиница «Прибалтийская» · Ватервиль', x: -7621, z: -928, yaw: 79.8, pitch: 6 },
    // the Places list only
    { key: 'Place.nalichny', label: 'Наличный мост · Смоленка', x: -6700, z: -1739, yaw: yawToward(-6700, -1739, -6702, -1708), pitch: 6 },
    { key: 'Place.mayak', label: 'Маяк · Вилькицкий бульвар', x: -8660, z: -530, yaw: yawToward(-8660, -530, -8667, -541), pitch: 6 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'n5102741821', by: 'landmarksVOStatues', group: 'vo-polar' },
    // ---
    { id: 'r5574920', by: 'bridges', group: 'nalichny' },
    { id: 'r5574927', by: 'bridges', group: 'korablestroiteley' },
    { id: 'w41575292', by: 'landmarksMarineFacade', group: 'mf-terminals' },
    // ---
    { id: 'w17559880', by: 'landmarksPribaltiyskaya', group: 'pribaltiyskaya-hotel' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6', 'ShiftDigit7',
    'Place.nalichny', 'Place.mayak'],
  mustHaveAreas: [
    { x: -6702.1, z: -1707.9, has: 'наличный' }, { x: -6328.8, z: -1603, has: 'ново-андреевский' }, { x: -6686, z: -1607, has: 'полярник' },
    { x: -8699, z: -1800, has: 'морской фасад' }, { x: -8700, z: -900, has: 'golden' },
    // ---
    { x: -7516.6, z: -772.5, has: 'прибалтийская' }, { x: -7464.1, z: -796.1, has: 'петру' }, { x: -7992.7, z: -1065.3, has: 'киров' }, { x: -7309, z: -804, has: 'малые гаванцы' },
    // ---
    { x: -7532, z: -1948, has: 'кораблестроител' }, { x: -8059.5, z: -2005.4, has: '1-й смоленский' }, { x: -8008.7, z: -2182.8, has: '2-й смоленский' }, { x: -7955.6, z: -1975.4, has: '3-й смоленский' }, { x: -7903.2, z: -2151, has: '4-й смоленский' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [-7516, -772], r: 90, min: 3 },
};


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). `own`: a bridge the bridges module draws (the quay leaves the parapet / collider open and publishes the zone);
 *  the others get an invisible fallback deck (walk box + parapet boxes). The first rows are copies of Vasilyevsky's (the bridges lie in the overlap, docs/vo-br.md), then the bridges of the Smolenka mouth (bridgesMo). */
const BRIDGE_ZONES = [
  { id: 'nalichny', name: 'Наличный мост', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7, own: true },
  { id: 'novo-andreevsky', name: 'Ново-Андреевский мост', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3, own: true, foot: true },
  // bridgesMo: the Shipbuilders' Bridge and the four bridges of the Smolenka mouth (the numbers of the source's BRIDGE_SHADES rows, environment/waterways.js 259 .. 263; river.js SITE_OF maps the ids to the sites of bridges/sites-vo2.js)
  { id: 'korablestroiteley', name: 'Мост Кораблестроителей', key: 'smolenka', c: [-7532.2, -1948.0], axis: 16.5, w: 70.8, len: 40.7, own: true },
  { id: 'smol1', name: '1-й Смоленский мост', key: 'smolenka', c: [-8059.5, -2005.4], axis: 15.7, w: 16.4, len: 30.8, own: true },
  { id: 'smol2', name: '2-й Смоленский мост', key: 'smolenka', c: [-8008.7, -2182.8], axis: 17.4, w: 15.8, len: 31.5, own: true },
  { id: 'smol3', name: '3-й Смоленский мост', key: 'smolenka', c: [-7955.6, -1975.4], axis: 16.3, w: 51.4, len: 32.2, own: true },
  { id: 'smol4', name: '4-й Смоленский мост', key: 'smolenka', c: [-7903.2, -2151.0], axis: 16.3, w: 51.0, len: 31.3, own: true },
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'nalichny-deck', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7 },
  { id: 'novo-andreevsky-deck', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3 },
  { id: 'korablestroiteley-deck', key: 'smolenka', c: [-7532.2, -1948.0], axis: 16.5, w: 70.8, len: 40.7 },
  { id: 'smol1-deck', key: 'smolenka', c: [-8059.5, -2005.4], axis: 15.7, w: 16.4, len: 30.8 },
  { id: 'smol2-deck', key: 'smolenka', c: [-8008.7, -2182.8], axis: 17.4, w: 15.8, len: 31.5 },
  { id: 'smol3-deck', key: 'smolenka', c: [-7955.6, -1975.4], axis: 16.3, w: 51.4, len: 32.2 },
  { id: 'smol4-deck', key: 'smolenka', c: [-7903.2, -2151.0], axis: 16.3, w: 51.0, len: 31.3 },
];

/** reaches: key of the waterway, test(x, z, nx, nz) on a bank point (landward normal n), run = horizontal length of the slope, kerb = banquette top above the water, lip = step from the banquette to the slope */
const SLOPE_REACHES = [];

/**
 * WATER: the water tables of environment/waterways.js (the ring objects of the scenery sources stay there; an area names the ones it draws); see Admiralty's area.js and src/world/lib/area-tables.js for the fields. Here:
 *   dataWater   the Smolenka mouth is a waterway of its own ('smolenka'): the river r1576084 (partly in Vasilyevsky), its two mouth arms r1576086 round the island under the Smolensky bridges, the mouth basin w428079227 and the Kovsh basin
 *               w95646723 (a 330 x 400 m harbour basin: keyed 'smolenka' at area level, the granite wall with the bar rail, so that no `kovsh` row has to be added to the shared waterways.js, scout decision D2)
 *   dataRings   the Gulf of Finland (environment/vo-sea.js, the ring VO_SEA of the source): REAL water with real banks inside the data region (the walkable sea of the territory, 34 % of it), scenery beyond (farSources)
 *   riverKeys   the RIVER record of the data whose key is null: the Smolenka is drawn as 'smolenka'
 *   ownerRings / keepOut   collected from the landmark modules by ./rings.js (one line per module there)
 */
export const WATER = {
  plugs: [],
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [],
  farSources: ['neva-up', 'neva-down', 'neva-malaya', 'vo-sea'],
  farCenter: [-8120, -1200],            // the middle of the territory (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [],
  openMouths: [[-6842.3, 2102.6, -6742, 635]],      // the closing edge of the Neva Bay polygon = the east edge of the Gulf ring (vo-sea.js): water on both sides, no quay wall (the part of it inside the data box, 900 m, stood across the open water). The other mask-0 edges of the source ring that hit the data box (15 edges, the coast of the Dekabristov land fill at z -2790 .. -3810) are real shore with land behind them: they stay quay walls
  dataWater: [{ id: 'r1576084', key: 'smolenka' }, { id: 'r1576086', key: 'smolenka' }, { id: 'w428079227', key: 'smolenka' }, { id: 'w95646723', key: 'smolenka' }],
  dataRings: [{ id: 'gulf', key: 'neva', source: 'vo-sea' }],
  pierFit: {},
  slopeReaches: SLOPE_REACHES,
  keyByName: {},
  riverKeys: { 'Смоленка': 'smolenka' },
  ownerRings: RINGS_WATER,
  keepOut: RINGS_KEEP_OUT,
};
/** ground that landmark modules pave themselves (claims.js): from ./rings.js */
export const PAVED_RINGS = RINGS_PAVED;

// ---------------------------------------------------------------- PEOPLE / WILDLIFE
/** the hot spots of the zone weight field: [x, z, amplitude, sigma]. The gathering places of the sights of this territory (amplitude from the crowd size: ~0.1 per person, a queue or a metro door higher, a quiet corner lower; sigma from
 *  the radius), inside the play rectangles with an 8 m margin. The rows of the unported modules stand here already: the weight field is independent of the module that draws the sight. */
const PEOPLE_HOT = [
  [-7569, -749, 0.7, 10], [-7537, -763, 1.0, 16],        // the hotel stair top, the hotel plaza
  [-7476, -791, 1.2, 14],        // Peter I
  [-7992, -1066, 0.7, 14], [-7991, -1086, 0.3, 8],        // the Kirov memorial and its visitors
  [-7309, -804, 0.6, 12],        // Nakhimov
  [-8699, -1800, 1.0, 22], [-9285, -1208, 0.8, 22], [-9098, -2268, 0.6, 20],        // the Marine Facade: Terminal 3 east gate, Terminal 1 from Chelyuskina Street, Terminal 4 bus loop
  [-8689, -806, 0.9, 20],        // Golden City
  [-8660, -528, 0.6, 14],        // Mayak
  [-8092, -401, 0.6, 24], [-7234, -714, 0.6, 24],        // Europe Square park, Malye Gavantsy park
  [-7975, -2079, 0.8, 16],        // the light-and-music fountain
  [-6337, -1818, 1.5, 14],        // the Primorskaya metro entrances
  [-7532, -1900, 0.5, 14],        // the Shipbuilders' bridge
];
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields) */
const PIGEON_ZONES = [
  { tag: 'hotel', kind: 'pigeon', x: -7537, z: -763, spread: 16, n: 2, w: 1.4, r: 4, name: 'Голуби у гостиницы «Прибалтийская» · Pigeons at the Pribaltiyskaya hotel' },
  { tag: 'peter', kind: 'pigeon', x: -7476, z: -791, spread: 14, n: 1, w: 1.4, r: 4, name: 'Голуби у памятника Петру I · Pigeons at the Peter I monument' },
  { tag: 'kirov', kind: 'pigeon', x: -7992, z: -1066, spread: 12, n: 1, w: 1.1, r: 3.5, name: 'Голуби у памятника крейсеру «Киров» · Pigeons at the Kirov memorial' },
  { tag: 'marine', kind: 'pigeon', x: -8699, z: -1800, spread: 20, n: 2, w: 1.5, r: 4.5, name: 'Голуби у Морского фасада · Pigeons at the Marine Facade' },
  { tag: 'golden', kind: 'pigeon', x: -8689, z: -806, spread: 16, n: 1, w: 1.2, r: 4, name: 'Голуби у Golden City · Pigeons at Golden City' },
  { tag: 'volodin', kind: 'pigeon', x: -7975, z: -2079, spread: 14, n: 1, w: 1.2, r: 4, name: 'Голуби у светомузыкального фонтана · Pigeons at the light-and-music fountain' },
  { tag: 'hotel', kind: 'sparrow', x: -7537, z: -763, spread: 14, n: 1, w: 1.3, r: 3, name: 'Воробьи у гостиницы «Прибалтийская» · Sparrows at the Pribaltiyskaya hotel' },
];
/** the districts a crow likes: crows start on a tree top there when the player is not about (the Linear park, the hotel's spruce groves). At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -8162, z: -1659, r: 120 }, { x: -7600, z: -740, r: 100 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] } */
const CROWDS = {
  hotel: [24, 35, 0.55], peter: [18, 30, 0.6], kirov: [16, 28, 0.5], marine: [30, 40, 0.65], golden: [22, 32, 0.5], volodin: [18, 28, 0.5],
};

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it); see Admiralty's area.js for the fields.
 *   peopleDensity  the scripted places of the strip's west (Kazan, Palace Square ...; people/west.js) and of the castle (people/mars.js) stand at fixed coordinates of the strip: switched off here
 *   tramLines      none: the data cut holds no tram route (TRAM_ROUTES is empty); the tram tracks of the Nalichny Bridge stay decorative
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
  tramLines: [],
  clearDiscs: [],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre lies 5 km east over the island and the Neva: dense stone blocks to the east
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station; this territory does not contain it, so it holds ONE car, the purple Zhiguli (`lada`), on Pribaltiyskaya Square east of the Peter I monument.
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east; tools/area-garage-check.mjs measures the nearest point of the footprint from the driven lane) } }  a car without a pose is not built
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 */
export const GARAGE = {
  poses: {
    lada: { x: -7467, z: -764, yaw: 99 * DEG },
  },
  spawn: { x: -7467, z: -764, yaw: 99 * DEG },
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = [
  'city',
  // (landmarksMarineFacade publishes an empty `entrances` list: the terminals are not enterable, so it needs no row here)
  //
  // (landmarksPribaltiyskaya publishes no `entrances`: the hotel is closed, so it needs no row here)
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
