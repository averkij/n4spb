// ============================================================================
//  AREA DEFINITION - Gavan (Гавань; docs/AREAS.md section 15.v and the Gavan / Morskoy / Dekabristov round): the sixth live area of the world map (maps/intro-draft.html, area 49, letter G): the Gavan side of Vasilyevsky island - Galerny Harbour
//  with the Shkipersky canal and its bridge, the Gavan workers' town, the Sevkabel Port, the Kirov Palace of Culture, Erarta, the Sea Terminal - with the Neva Bay and the coast of the Gulf of Finland round it. The play rectangles
//  (src/areas/registry.js REGISTRY.gavan.play) follow the territory policy B600: the land outline of the map plus the water-zone cells within 600 m of the land (tools/area-shape.mjs --k 49 --water-band 600 --js gavan, G01 .. G54), and
//  the hand-added rectangles G55 .. G59 (the Nalichny Bridge reach and the Smolenka pockets); the data cut straight from the source project by tools/area-data-cut.mjs.
//  THE MODULES: this is the SKELETON (the Vasilyevsky foundation protocol). Ready: the base modules of the engine and every already ported module whose groups lie in this territory (Kirova 4 of 4, Sevkabel 7 of 8 without the
//  Baltic cranes, ModernVO erem82 + Kollan, Sredny tram depot + Dom Evangelia + Gorny pavilions, VOStatues Musa Jalil + Lenin at the Pokrovskaya hospital + the polar explorers, the Sea Terminal itself, the Novo-Andreevsky and Nalichny bridges).
//  Slots (one marker line each, filled by the port clusters): landmarksGavan (the Kronshpits, the Shkipersky canal and bridge, the harbour crane / tower / guardhouse / club, the workers' town, the fire reserve, the church), landmarksPribaltiyskaya
//  (the hotel, Peter I, the Creators of the Fleet, Nakhimov, the Kirov memorial, Waterville), the Shkipersky and WHSD decks of the bridges module, the `gavan` waterway key (PORT-WATER below), the rest of the Sea Terminal (D-2, torpedo boat, Lenexpo).
//  This area contains NO railway station: no `rail`, no landmarksA / B / C, and ONE purple Zhiguli (docs/AREAS.md 13.4). The territory has no metro network module either.
//  gavan.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this
//  file) and NO import of another area's module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
//
//  THE PORT SLOTS (the protocol of the later waves; every slot is ONE line, the slots are separated by an unchanged `// ---` line so that parallel branches merge without a conflict):
//    // PORT-IMPORT: <module>   -> `import { GROUPS_LIST as G_X } from '../../world/<module>/groups.js';`
//    // PORT-MODULE: <module>   -> `'<module>',  // what it draws`                          (inside MODULES, in build order)
//    // PORT-LABEL: <module>    -> `<module>: 'loading words',`                               (inside LABELS)
//    // PORT-GROUPS: <module>   -> `GROUPS.<module> = G_X;`   (a filter of the list when a group lies outside the territory)
//    // PORT-AREAS: <module>    -> the rows of the HUD location table (makeAreas)
//    // PORT-CLAIMED: <module>  -> `{ id: '<OSM id>', by: '<module>', group: '<key>' },`        (TEST.claimed: one row per module)
//    // PORT-PRUNE: <module>    -> `'<module>',` inside PRUNE_SERVICES (a module whose `entrances` should clear the trees)
//    // PORT-WATER: <what>      -> a row of the WATER tables that waits for a shared-engine waterway key (the engine cluster)
//  and the rings of a module (water pits, keep-outs, paved ground) go to src/areas/gavan/rings.js (its own protocol, PORT-IMPORT / PORT-SOURCE).
// ============================================================================
import { GROUPS_VO } from '../../world/bridges/groups-vo.js';
import { GROUPS_LIST as G_KIROVA } from '../../world/landmarksKirova/groups.js';
import { GROUPS_LIST as G_SEVKABEL } from '../../world/landmarksSevkabel/groups.js';
import { GROUPS_LIST as G_SEATERMINAL } from '../../world/landmarksSeaTerminal/groups.js';
import { GROUPS_LIST as G_MODERNVO } from '../../world/landmarksModernVO/groups.js';
import { GROUPS_LIST as G_SREDNY } from '../../world/landmarksSredny/groups.js';
import { GROUPS_LIST as G_VOSTATUES } from '../../world/landmarksVOStatues/groups.js';
import { WATER_RINGS as RINGS_WATER, KEEP_OUT as RINGS_KEEP_OUT, PAVED_RINGS as RINGS_PAVED } from './rings.js';
import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list
// ---
// PORT-IMPORT: landmarksGavan
// ---
import { GROUPS_LIST as G_PRIBALTIYSKAYA } from '../../world/landmarksPribaltiyskaya/groups.js';
// ---

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'gavan';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/gavan/';
/** A missing or stale bake is an error card, never a minutes-long procedural build (a hand-off lands here). */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No `rail` and no landmarksA / B / C (no station, no tracks), no metro network. The Gavan and Pribaltiyskaya modules are added in
 *  the PORT-MODULE slots (before landmarksKirova, in this order; landmarksGavan has to build before `bridges`: the Shkipersky deck service). tools/modules-list.mjs parses this list: one quoted name per line (comment lines are ignored). */
export const MODULES = [
  'environment',  // ground, embankment granite, Neva Bay / Gulf / Smolenka water, trees, lawns, flowerbeds, far skyline
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  // PORT-MODULE: landmarksGavan
  //
  'landmarksPribaltiyskaya', // the Pribaltiyskaya hotel, Peter I, the Creators of the Fleet, the Nakhimov statue, the Kirov memorial, Waterville
  //
  'landmarksKirova', // the Kirov Palace of Culture, Erarta museum, the Vasileostrovets garden, the Sobchak monument
  //
  'landmarksSevkabel', // Sevkabel Port (hall, yard, Istkabel), the Brusnitsyn quarter, the almshouse, the Skobsky Palace, CHP-7 (not the Baltic Shipyard cranes: they stand beyond this territory)
  //
  'landmarksSeaTerminal', // the Sea Terminal (the two-tier deck, the five berths, the port fence)
  //
  'landmarksModernVO', // two Art Nouveau hero houses: Eremeeva with the spire (Bolshoy 82) and the Kollan house (Bolshoy 92)
  //
  'landmarksSredny', // the tram depot and museum, Dom Evangelia, the Gorny Institut pavilions (the east edge of the territory)
  //
  'landmarksVOStatues', // the monuments of the island that lie here: Musa Jalil, Lenin at the Pokrovskaya hospital, the polar explorers
  //
  'bridges',      // the bridges of the area: the Novo-Andreevsky footbridge and the Nalichny Bridge (docs/vo-br.md); the Shkipersky Bridge and the WHSD decks follow with the engine cluster
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, tourists, groups with guides, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the purple Zhiguli (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  // PORT-LABEL: landmarksGavan
  // ---
  landmarksPribaltiyskaya: 'Прибалтийская, памятник Петру I, крейсер «Киров»',
  // ---
  landmarksKirova: 'Дворец культуры Кирова, Эрарта, сад Василеостровец',
  // ---
  landmarksSevkabel: 'Севкабель Порт, Брусницынский квартал, ТЭЦ-7',
  // ---
  landmarksSeaTerminal: 'Морской вокзал',
  // ---
  landmarksModernVO: 'Северный модерн: дома Васильевского острова',
  // ---
  landmarksSredny: 'Трамвайный парк, Дом Евангелия, павильоны Горного института',
  // ---
  landmarksVOStatues: 'Памятники Васильевского острова',
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
    // the Gavan side of the island (names as in the OSM data)
    bolshoyVO: 'Большой проспект В.О.', sredniyVO: 'Средний проспект В.О.', malyVO: 'Малый проспект В.О.', nalichnaya: 'Наличная улица', smolenka: 'набережная реки Смоленки',
    beringa: 'улица Беринга', odoevskogo: 'улица Одоевского', kosayaLiniya: 'Косая линия', kozhevennaya: 'Кожевенная линия', novosmolenskaya: 'Новосмоленская набережная', detskaya: 'Детская улица',
    shkipersky: 'Шкиперский проток', sredneGavansky: 'Среднегаванский проспект', gavanskaya: 'Гаванская улица', morskayaNab: 'Морская набережная', nakhimova: 'улица Нахимова',
    pribaltiyskayaSq: 'Прибалтийская площадь', kruzensterna: 'проспект Крузенштерна', chirikova: 'улица Чирикова', korablestroiteley: 'улица Кораблестроителей', morskoyGlorySq: 'площадь Морской Славы',
    vilkitsky: 'Вилькицкий бульвар', zsd: 'ЗСД',
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
// A module claimed by two areas is fine: each area passes its own GROUPS.<module> and every ported module gates by it. The lists below are the groups of the module that lie in THIS territory and in its data (scout-gavan.md 2).
const only = (list, keys) => list.filter((g) => keys.includes(g.key));
export const GROUPS = {};
// PORT-GROUPS: landmarksGavan
// ---
GROUPS.landmarksPribaltiyskaya = G_PRIBALTIYSKAYA;      // all six: the hotel, Peter I, the Creators of the Fleet, the Nakhimov statue, Waterville and the Kirov memorial (it lies 35 m beyond the rectangles, 100 % inside the 120 m data margin, like kirova-erarta of vasilyevsky)
// ---
GROUPS.landmarksKirova = G_KIROVA;      // all four groups: the DK, Erarta, the Vasileostrovets garden, the Sobchak monument
// ---
GROUPS.landmarksSevkabel = G_SEVKABEL.filter((g) => g.key !== 'baltic-cranes');      // the cranes (-5100, 1380) stand 3 % inside the territory and their vertices leave the data margin
// ---
GROUPS.landmarksSeaTerminal = G_SEATERMINAL;      // only the terminal itself while landmarksSeaTerminal/groups.js lists it in ON; the D-2, the torpedo boat and the Lenexpo fence join with the widening of ON (the G cluster)
// ---
GROUPS.landmarksModernVO = only(G_MODERNVO, ['modernvo-erem82', 'modernvo-kollan']);      // the other ten houses lie in Vasilyevsky
// ---
GROUPS.landmarksSredny = only(G_SREDNY, ['tram-depot', 'dom-evangelia', 'gorny-pavilions']);      // the three groups that reach this territory (the rest stands beyond the data margin)
// ---
GROUPS.landmarksVOStatues = only(G_VOSTATUES, ['vo-musa-jalil', 'vo-lenin-pokrovskaya', 'vo-polar']);
// ---
// the bridges: the Novo-Andreevsky footbridge and the Nalichny Bridge (bridges/groups-vo.js; the stair pits of Nalichny hand their rings over through ./rings.js). The Shkipersky Bridge (landmarksGavan) and the WHSD decks are the bridge cluster's.
// PORT-GROUPS: bridges
GROUPS.bridges = only(GROUPS_VO, ['novo-andreevsky', 'nalichny']);

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _groupPolys, _shoreOf, inRiver } = h;
  return [
  { name: 'Наличный мост · Nalichny Bridge', c: [-6702.1, -1707.9], r: 48 },
  { name: 'Ново-Андреевский мост · Novo-Andreevsky Bridge', c: [-6328.8, -1603.0], r: 20 },
  // ---
  // PORT-AREAS: landmarksGavan
  // ---
  { name: 'Памятник Петру I · Peter I monument', c: [-7477, -791], r: 40 },
  { name: 'Гостиница «Прибалтийская» · Pribaltiyskaya Hotel', c: [-7600, -735], r: 175 },
  { name: 'Памятник крейсеру «Киров» · Cruiser Kirov monument', c: [-7970, -1075], r: 65 },
  { name: 'Сквер Малые Гаванцы · Malye Gavantsy Square', poly: [-7233.7, -713.7, -7231.8, -709.9, -7237, -707.7, -7239.4, -707.5, -7241.6, -708.5, -7243.1, -709.9, -7258.8, -742.9, -7262.3, -747.4, -7267.2, -750.5, -7273.1, -753.2, -7279, -753.6, -7285.3, -751.8, -7291.1, -748.2, -7294.3, -743.6, -7296, -738.9, -7296.5, -733, -7295.2, -726.5, -7279.6, -693.3, -7279.7, -690.6, -7280.8, -687.8, -7282.7, -685.8, -7331.3, -662.8, -7355, -710.6, -7359, -713.4, -7361.8, -714.2, -7379.7, -716.5, -7404.9, -771.5, -7397.4, -774.9, -7395.4, -771.2, -7376.8, -780.1, -7374.4, -786.2, -7381.7, -789.9, -7384.1, -795.1, -7251.1, -857, -7248.6, -851.9, -7242.8, -854, -7242.5, -856.6, -7241.4, -858.8, -7232.4, -864, -7176.9, -737.9, -7177.5, -735.6, -7179.6, -733.9, -7199.5, -724.9, -7201.4, -728.9], margin: 4 },      // the park r19581548 (the source's GREEN polygon)
  // ---
  { name: 'Дворец культуры имени Кирова · Kirov Palace of Culture', c: [-5449, -145], r: 90 },
  { name: 'Эрарта · Erarta Museum', c: [-5593, 25], r: 58 },
  { name: 'Сад Василеостровец · Vasileostrovets Garden', c: [-5273, -221], r: 85 },
  // ---
  { name: 'Севкабель Порт · Sevkabel Port', c: [-6149, 933], r: 170 },
  { name: 'Брусницынский квартал · Brusnitsyn quarter', c: [-5640, 1085], r: 70 },
  { name: 'Скобский дворец · Skobsky Palace', c: [-5474, 1127], r: 45 },
  // ---
  { name: 'Морской вокзал · Sea Terminal', c: [-6519, 709], r: 150 },
  { name: 'Площадь Морской Славы · Sea Glory Square', c: [-6324, 649], r: 120 },
  // ---
  ..._groupPolys(SUBGROUPS['modernvo-erem82'], 6).map((r) => ({ name: 'Дом со шпилем · House with the spire', ...r })),
  ..._groupPolys(SUBGROUPS['modernvo-kollan'], 8).map((r) => ({ name: 'Дом Коллана · Kollan house', ...r })),
  // ---
  ..._groupPolys(SUBGROUPS['tram-depot'], 10).map((r) => ({ name: 'Василеостровский трамвайный парк · Vasileostrovsky tram depot', ...r })),
  ..._groupPolys(SUBGROUPS['gorny-pavilions'], 12).map((r) => ({ name: 'Станция метро «Горный институт» · Gorny Institut metro', ...r })),
  ..._groupPolys(SUBGROUPS['dom-evangelia'], 6).map((r) => ({ name: 'Дом Евангелия · Dom Evangelia', ...r })),
  { name: 'Памятник Мусе Джалилю · Musa Jalil monument', c: [-6258.3, 50.3], r: 16 },
  // ---
  { name: 'Набережная реки Смоленки · Smolenka Embankment', road: NAMES.streets.smolenka },
  { name: 'Новосмоленская набережная · Novosmolenskaya Embankment', road: NAMES.streets.novosmolenskaya },
  { name: 'Морская набережная · Morskaya Embankment', road: NAMES.streets.morskayaNab },
  { name: 'Шкиперский проток · Shkipersky Protok', road: NAMES.streets.shkipersky },
  { name: 'Большой проспект В.О. · Bolshoy Prospekt V.O.', road: NAMES.streets.bolshoyVO },
  { name: 'Средний проспект В.О. · Sredny Prospekt V.O.', road: NAMES.streets.sredniyVO },
  { name: 'Малый проспект В.О. · Maly Prospekt V.O.', road: NAMES.streets.malyVO },
  { name: 'Среднегаванский проспект · Sredne-Gavansky Prospekt', road: NAMES.streets.sredneGavansky },
  { name: 'Гаванская улица · Gavanskaya ulitsa', road: NAMES.streets.gavanskaya },
  { name: 'Наличная улица · Nalichnaya ulitsa', road: NAMES.streets.nalichnaya },
  { name: 'Улица Беринга · Ulitsa Beringa', road: NAMES.streets.beringa },
  { name: 'Улица Одоевского · Ulitsa Odoevskogo', road: NAMES.streets.odoevskogo },
  { name: 'Улица Нахимова · Ulitsa Nakhimova', road: NAMES.streets.nakhimova },
  { name: 'Прибалтийская площадь · Pribaltiyskaya Square', road: NAMES.streets.pribaltiyskayaSq },
  { name: 'Проспект Крузенштерна · Prospekt Kruzensterna', road: NAMES.streets.kruzensterna },
  { name: 'Улица Чирикова · Ulitsa Chirikova', road: NAMES.streets.chirikova },
  { name: 'Улица Кораблестроителей · Ulitsa Korablestroiteley', road: NAMES.streets.korablestroiteley },
  { name: 'Вилькицкий бульвар · Vilkitsky Boulevard', road: NAMES.streets.vilkitsky },
  { name: 'Кожевенная линия · Kozhevennaya liniya', road: NAMES.streets.kozhevennaya },
  { name: 'Косая линия · Kosaya liniya', road: NAMES.streets.kosayaLiniya },
  { name: 'Детская улица · Detskaya ulitsa', road: NAMES.streets.detskaya },
  { name: 'Западный скоростной диаметр · Western High-Speed Diameter', road: NAMES.streets.zsd },
  { name: 'Смоленка · Smolenka River', x0: -7120, x1: -5900, z0: -2100, z1: -1500, test: (x, z) => _shoreOf(['smolenka'], x, z) < 14 },
  { name: 'Невская губа · Neva Bay', x0: -7900, x1: -4800, z0: 1000, z1: 2000, test: (x, z) => inRiver(x, z) },
  { name: 'Финский залив · Gulf of Finland', x0: -10000, x1: -6000, z0: -2300, z1: 2000, test: (x, z) => inRiver(x, z) },
  { name: 'Васильевский остров · Vasilyevsky Island', x0: -9999, x1: -4800, z0: -1840, z1: 1900 },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..6 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // The poses are the photo spots of the source project's modules (scout-gavan.md 7.5, measured against the data and proved by tools/views-check.mjs --land); the sights of the unported modules (Gavan, Pribaltiyskaya, D-2, the torpedo boat) look at
  // open ground until the port clusters land them. Digit1..0 the Gavan quarter and Pribaltiyskaya, Shift + 1..6 the Sea Terminal side, Places: torpedo boat, Nakhimov, Sea Glory, Tesla coil.
  const HERO = { x: -5984.3, z: 504.8, yaw: -122, pitch: 20 };      // the church "Miluyushchaya" over its hoarding, beside Bolshoy prospekt (the source pose moved 1 m off the carriageway: tools/views-check.mjs --fix)
  const VIEWS = [
    { key: 'Digit1', label: 'Кроншпицы Галерной гавани', x: -6946, z: 345.4, yaw: -166, pitch: 4 },
    { key: 'Digit2', label: 'Шкиперский проток', x: -6970, z: 150.4, yaw: -177, pitch: 2 },
    { key: 'Digit3', label: 'Шкиперский мост', x: -6987.8, z: -27.2, yaw: yawToward(-6987.8, -27.2, -7009.5, -31), pitch: 2 },
    { key: 'Digit4', label: 'Паровой кран · Галерная гавань', x: -7064.5, z: -91.2, yaw: -25, pitch: 3 },
    { key: 'Digit5', label: 'Водонапорная башня · Галерная гавань', x: -7137.9, z: -232.4, yaw: yawToward(-7137.9, -232.4, -7148.9, -251.5), pitch: 6 },
    { key: 'Digit6', label: 'Гаванский городок · зелёные щипцы', x: -6372, z: -588, yaw: -55, pitch: 8 },
    { key: 'Digit7', label: 'Двор Гаванского городка', x: -6284.5, z: -650.7, yaw: 98, pitch: 3 },
    { key: 'Digit8', label: 'Церковь «Милующая» · апсида', x: -5910, z: 490, yaw: 153, pitch: 14 },
    { key: 'Digit9', label: 'Гостиница «Прибалтийская»', x: -7516.6, z: -772.5, yaw: 114.4, pitch: 6 },
    { key: 'Digit0', label: 'Памятник Петру I · Прибалтийская площадь', x: -7464.1, z: -796.1, yaw: 114.4, pitch: 28 },
    { key: 'ShiftDigit1', label: 'Подводная лодка Д-2', x: -6630, z: -25, yaw: -13.6, pitch: 3 },
    { key: 'ShiftDigit2', label: 'Морской вокзал', x: -6371.5, z: 685.3, yaw: 105.8, pitch: 6 },
    { key: 'ShiftDigit3', label: 'Севкабель Порт', x: -6140.8, z: 866.9, yaw: yawToward(-6140.8, 866.9, -6172, 921), pitch: 8 },
    { key: 'ShiftDigit4', label: 'Дворец культуры имени Кирова', x: -5420.3, z: -194.1, yaw: yawToward(-5420.3, -194.1, -5444, -153), pitch: 8 },
    { key: 'ShiftDigit5', label: 'Эрарта', x: -5556.7, z: 8.8, yaw: 119.7, pitch: 12 },
    { key: 'ShiftDigit6', label: 'Брусницынский квартал', x: -5623, z: 1106, yaw: -68, pitch: 14 },
    // the Places list only
    { key: 'Place.torpedo', label: 'Торпедный катер «Комсомолец»', x: -6538, z: 348, yaw: 103.5, pitch: 4 },
    { key: 'Place.nakhimov', label: 'Памятник Нахимову · сквер Малые Гаванцы', x: -7317, z: -800.2, yaw: -65, pitch: 25 },
    { key: 'Place.seaglory', label: 'Площадь Морской Славы', x: -6300, z: 640, yaw: 107.9, pitch: 6 },
    { key: 'Place.tesla', label: 'Севкабель Порт · «катушка Теслы»', x: -6200, z: 858, yaw: 66, pitch: 8 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    // PORT-CLAIMED: landmarksGavan
    // ---
    { id: 'w17559880', by: 'landmarksPribaltiyskaya', group: 'pribaltiyskaya-hotel' },
    // ---
    { id: 'w45966107', by: 'landmarksKirova', group: 'kirova-dk' },
    // ---
    { id: 'r8702908', by: 'landmarksSevkabel', group: 'sevkabel-hall' },
    // ---
    { id: 'r6702553', by: 'landmarksSeaTerminal', group: 'sea-terminal' },
    // ---
    { id: 'w65710570', by: 'landmarksModernVO', group: 'modernvo-kollan' },
    // ---
    { id: 'w117952605', by: 'landmarksSredny', group: 'dom-evangelia' },
    // ---
    { id: 'n2101529725', by: 'landmarksVOStatues', group: 'vo-musa-jalil' },
    // ---
    { id: 'w386219560', by: 'bridges', group: 'novo-andreevsky' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6',
    'Place.torpedo', 'Place.nakhimov', 'Place.seaglory', 'Place.tesla'],
  mustHaveAreas: [
    { x: -5420.3, z: -194.1, has: 'кирова' }, { x: -5556.7, z: 8.8, has: 'эрарта' }, { x: -6140.8, z: 866.9, has: 'севкабель' }, { x: -5623, z: 1106, has: 'брусницын' },
    { x: -6371.5, z: 685.3, has: 'морской вокзал' }, { x: -6300, z: 640, has: 'морской славы' },
    // ---
    { x: -7516.6, z: -772.5, has: 'прибалтийская' }, { x: -7464.1, z: -796.1, has: 'петру' }, { x: -7309, z: -804, has: 'малые гаванцы' },
    // ---
    // PORT-AREAS rows of the port clusters add their own sights here
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [-6000, 520], r: 90, min: 3 },
};


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). `own`: a bridge the bridges module draws (the quay leaves the parapet / collider open and publishes the zone);
 *  the others get an invisible fallback deck (walk box + parapet boxes). The rows of the two Smolenka bridges are copies of Vasilyevsky's (docs/vo-br.md). */
const BRIDGE_ZONES = [
  { id: 'nalichny', name: 'Наличный мост', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7, own: true },
  { id: 'novo-andreevsky', name: 'Ново-Андреевский мост', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3, own: true, foot: true },
  // PORT-WATER: the Shkipersky Bridge row { id: 'shkipersky-deck', name: 'Шкиперский мост', key: 'gavan', c: [-7009.5, -31.0], axis: 79.4, w: 9.0, len: 35.7, own: true } (waits for the waterway key 'gavan')
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'nalichny-deck', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7 },
  { id: 'novo-andreevsky-deck', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3 },
];

/** reaches: key of the waterway, test(x, z, nx, nz) on a bank point (landward normal n), run = horizontal length of the slope, kerb = banquette top above the water, lip = step from the banquette to the slope */
const SLOPE_REACHES = [];

/**
 * WATER: the water tables of environment/waterways.js (the ring objects of the scenery sources stay there; an area names the ones it draws; fields: src/world/lib/area-tables.js). Here:
 *   clipLines   the part seams of the Bolshaya Neva polygons across the bay south of the island (their rims overlap and each stood as a quay wall across the water)
 *   farSources  all four scenery rings: the Neva upstream, the Neva Bay downstream, the Malaya Neva and the Gulf of Finland (the Gulf ring is where the territory's west and south water lies)
 *   dataRings   the Malaya Neva (the north-west corner), the Gulf of Finland (VO_SEA of environment/vo-sea.js) and the Neva Bay south of the island (neva-down) are DATA water inside the data region: real banks, a floor of
 *               the water level, `inRiver` true, so a walker wades and a car drives in (CLAUDE.md: water is reachable). Without them the sea would be a drawn surface over solid ground (scout-sea.md 1.3)
 *   dataWater   the Smolenka (r1576084 and its mouth arms r1576086) is a waterway of its own ('smolenka'); Galerny Harbour (w10890576) and the Shkipersky canal (r1648985) get the key 'gavan' with the engine cluster (PORT-WATER)
 *   riverKeys   the keyless RIVER record of the Smolenka is drawn as 'smolenka'
 *   ownerRings / keepOut   collected from the landmark modules by ./rings.js (one line per module there)
 */
export const WATER = {
  plugs: [],
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [['x', -5370], ['x', -6070], ['x', -5000], ['z', 1370], ['z', 1720], ['z', 1770]],
  farSources: ['neva-up', 'neva-down', 'neva-malaya', 'vo-sea'],
  farCenter: [-7900, 100],              // the middle of the area (the Neva scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [],
  openMouths: [],
  dataWater: [{ id: 'r1576084', key: 'smolenka' }, { id: 'r1576086', key: 'smolenka' },
    // PORT-WATER: { id: 'w10890576', key: 'gavan' } (Galerny Harbour), { id: 'r1648985', key: 'gavan' } (the Shkipersky canal): the waterway key 'gavan' is a shared-engine row (waterways.js, quay.js, water.js, bridges/sites.js, wildlife/world.js)
  ],
  dataRings: [{ id: 'malaya-neva', key: 'neva', source: 'neva-malaya' },
    { id: 'gulf', key: 'neva', source: 'vo-sea' },
    { id: 'bay', key: 'neva', source: 'neva-down' }],
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
/** the hot spots of the zone weight field: [x, z, amplitude, sigma]. The rows of Vasilyevsky that lie in this territory (the gathering places of the ported modules, docs/vo-m4.md; amplitude from the crowd size n: ~0.1 per person,
 *  a queue or a metro door higher, a quiet corner lower) and the photo spots of the Gavan and Pribaltiyskaya modules (the rows wait for the port: a hot spot without its module is a plain pavement). Every row is inside the play
 *  rectangles with an 8 m margin. */
const PEOPLE_HOT = [
  // ---- Sredny prospekt, Kirov Palace of Culture, Erarta, the Vasileostrovets garden (docs/vo-m3.md, vo-m4.md)
  [-5052, -12, 1.2, 20],        // the Gorny Institut plaza (its centre (-5036, -5) lies on the east edge of the territory: the row stands at the nearest inside point)
  [-5426, -110, 1.3, 22], [-5508, 18, 1.0, 24], [-5248, -179, 0.9, 22], [-5297, -259, 0.6, 14], [-5301, 59, 0.6, 12],        // the DK portal apron, Erarta, the Roerich plaza, the playground, the Sobchak monument
  // ---- Sevkabel Port: the gate and the yard edge by the hall, the pier plaza edge, the Istkabel courtyard, the Brusnitsyn lane
  [-6140, 868, 1.5, 34], [-6138, 852, 0.7, 12], [-6064, 948, 0.8, 22], [-5900, 990, 0.8, 22], [-5685, 1073, 0.5, 16],
  // ---- the Sea Terminal: the Sea Glory square, the car park front
  [-6371, 685, 1.3, 28], [-6300, 640, 0.9, 24], [-6469, 614, 0.8, 26],
  // ---- landmarksGavan (scout-gavan.md 7.6; the photo spots of the module)
  [-6946, 345, 1.2, 16], [-6970, 150, 0.8, 16], [-6990, -28, 0.8, 12], [-7064, -91, 0.8, 14],        // the Kronshpits, the Shkipersky canal promenade, the bridge, the steam crane
  [-6372, -590, 1.0, 20], [-6284, -651, 0.9, 16], [-6190, -590, 0.6, 14], [-5984, 505, 1.0, 20],        // the workers' town green gables and yard, the fire reserve, the church
  // ---- landmarksPribaltiyskaya and the Sea Terminal side (the hotel front, the stair foot and the Creators of the Fleet, Peter I, Nakhimov; the D-2 bow, the torpedo boat)
  [-7516, -772, 1.3, 26], [-7561, -759, 1.0, 14], [-7464, -796, 1.2, 18], [-7317, -800, 0.8, 14], [-6630, -25, 0.8, 14], [-6538, 348, 0.6, 14],
];
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields) */
const PIGEON_ZONES = [
  { tag: 'erarta', kind: 'pigeon', x: -5508, z: 18, spread: 14, n: 1, w: 1.0, r: 4, name: 'Голуби у Эрарты · Pigeons by Erarta' },
  { tag: 'sevkabel', kind: 'pigeon', x: -6140, z: 868, spread: 22, n: 2, w: 1.4, r: 4.5, name: 'Голуби во дворе Севкабеля · Pigeons in the Sevkabel yard' },
  { tag: 'seaglory', kind: 'pigeon', x: -6371, z: 685, spread: 20, n: 1, w: 1.1, r: 4, name: 'Голуби на площади Морской Славы · Pigeons on the Sea Glory Square' },
  // ---- the Gavan and Pribaltiyskaya modules (the same hot spots as PEOPLE_HOT)
  { tag: 'gavan-kron', kind: 'pigeon', x: -6946, z: 345, spread: 16, n: 1, w: 1.0, r: 4, name: 'Голуби у Кроншпицев · Pigeons at the Kronshpits' },
  { tag: 'gavan-town', kind: 'pigeon', x: -6372, z: -590, spread: 18, n: 2, w: 1.2, r: 4.5, name: 'Голуби в Гаванском городке · Pigeons in the Gavan workers\' town' },
  { tag: 'gavan-church', kind: 'pigeon', x: -5984, z: 505, spread: 16, n: 1, w: 1.0, r: 4, name: 'Голуби у церкви «Милующая» · Pigeons at the church Miluyushchaya' },
  { tag: 'pribaltiyskaya', kind: 'pigeon', x: -7516, z: -772, spread: 22, n: 2, w: 1.3, r: 4.5, name: 'Голуби на Прибалтийской площади · Pigeons on Pribaltiyskaya Square' },
  { tag: 'peter', kind: 'pigeon', x: -7464, z: -796, spread: 16, n: 1, w: 1.1, r: 4, name: 'Голуби у памятника Петру I · Pigeons at the Peter I monument' },
];
/** the districts a crow likes: crows start on a tree top there when the player is not about (the green courtyards of the Gavan workers' town, the Nakhimov square). At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -6372, z: -588, r: 300 }, { x: -7309, z: -804, r: 150 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] } */
const CROWDS = {
  erarta: [18, 30, 0.55], sevkabel: [34, 45, 0.75], seaglory: [26, 35, 0.5],
  'gavan-kron': [20, 30, 0.45], 'gavan-town': [24, 35, 0.4], 'gavan-church': [22, 30, 0.4], pribaltiyskaya: [30, 40, 0.55], peter: [20, 30, 0.5],
};

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it); see Admiralty's area.js for the fields.
 *   peopleDensity  the scripted places of the strip's west (Kazan, Palace Square ...; people/west.js) and of the castle (people/mars.js) stand at fixed coordinates of the strip: switched off here; no `garden` row (no cemetery here)
 *   tramLines      none: tram 40 loops at (-5455, 645) at the edge of the territory (no transport test in this round)
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
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre is far to the east, beyond the Neva: dense stone blocks that way
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station; this territory does not contain it, so it holds ONE car, the purple Zhiguli (`lada`), in the park beside Bolshoy prospekt
 * 30 m from the church (the start of the HERO pose).
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east; tools/area-garage-check.mjs measures the nearest point of the footprint to the driven lane) } }  a car without a pose is not built
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 */
export const GARAGE = {
  poses: {
    lada: { x: -6012, z: 506, yaw: 120 * DEG },
  },
  spawn: { x: -6012, z: 506, yaw: 120 * DEG },
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = [
  'city',
  // PORT-PRUNE: landmarksGavan
  //
  'landmarksKirova',
  //
  'landmarksSredny',
];
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent) */
// the hook set of src/areas/north/hooks.js gated by the module list: none of its modules is in this list, so it is inert here
export const HOOKS = makeHooks(MODULES);
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9): the hook set gated by MODULES, see src/areas/north/hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

// ---------------------------------------------------------------- the places of the OTHER areas (docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name (a pick asks the gate question and the hand-off lands at this pose). Empty: places are off in the live areas
 * (the edge gates carry the player across). Not read by any world module.
 */
export const CROSS_PLACES = [];
