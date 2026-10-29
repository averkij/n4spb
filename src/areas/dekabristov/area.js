// ============================================================================
//  AREA DEFINITION - Dekabristov Island (Остров Декабристов; docs/AREAS.md section 15.v and the area-gdm notes): the island between the Smolenka, the Malaya Neva and the Gulf of Finland, the map's area 51 (letter D, maps/intro-draft.html):
//  the Smolensky Lutheran and Armenian cemeteries, the memorial cemetery of the siege, Primorskaya, the Decembrists' garden, the Smolenka bridges and the land fill of the west end, with the water round it. The territory is 11.08 km2 of
//  play rectangles (src/areas/registry.js REGISTRY.dekabristov.play, D01 .. D51: tools/area-shape.mjs --k 51 --water-band 600 --js dekabristov = the map's land outline plus the water-zone cells within 600 m of the land, policy B600);
//  most of it is water (the Gulf and the Malaya Neva, drawn from the scenery rings that this table lists as data rings: WATER below).
//  THE DATA is NOT cut from the source project's baked data alone: the island's west two thirds (the land fill, the north shore) were never baked there. src/areas/dekabristov/data = the source bake 0568f7af + a scratch bake with five
//  regions DK1 .. DK5 fetched from OpenStreetMap (docs/research/dekabristov-data.md holds the recipe and the fetch log), cut by tools/area-data-cut.mjs.
//  THE MODULES: the base modules of the engine, the Smolensky Orthodox Cemetery (the seam: the same cemetery stands in the Vasilyevsky area, 2.45 km2 of the two territories overlap, the same four bridges stand in both: Uralsky, Smolensky,
//  Nalichny, Novo-Andreevsky), the three monuments of the island that landmarksVOStatues draws (the Armenian church of the Resurrection, the Komitas monument, the monument to the polar explorers) and the bridges. The island's own landmark
//  modules are ported later into the marked slots below (landmarksDekabristov: the Lutheran / Armenian cemeteries, the siege cemetery, the Decembrists' garden and the Light-and-Music fountain square; landmarksPrimorskaya: the metro
//  pavilion, the Metro Museum, the square; landmarksFill: the construction-site dressing of the fill).
//  This area contains NO railway station: no `rail`, no landmarksA / B / C, and ONE purple Zhiguli at the spawn (docs/AREAS.md 13.4). The territory has no metro network module either.
//  dekabristov.html remaps ./src/world/area.js to this file with an import map (tools/area.mjs does the same for the headless tools). PURE DATA: no three.js, no import of layout.js (layout.js imports this file) and NO import of another
//  area's module (the remap would hand back this very file). Same export names as src/world/area.js; the engine tables at the end are read through src/world/lib/area-tables.js.
//
//  THE PORT SLOTS (the protocol of the Vasilyevsky waves; every slot is ONE line, the slots are separated by an unchanged `// ---` line so that parallel branches merge without a conflict):
//    // PORT-IMPORT: <module>   -> `import { GROUPS_LIST as G_X } from '../../world/<module>/groups.js';`
//    // PORT-MODULE: <module>   -> `'<module>',  // what it draws`                          (inside MODULES, in build order)
//    // PORT-LABEL: <module>    -> `<module>: 'loading words',`                               (inside LABELS)
//    // PORT-GROUPS: <module>   -> `GROUPS.<module> = G_X;`   (a filter of the list when a group lies outside the territory)
//    // PORT-AREAS: <module>    -> the rows of the HUD location table (makeAreas)
//    // PORT-CLAIMED: <module>  -> `{ id: '<OSM id>', by: '<module>', group: '<key>' },`        (TEST.claimed: one row per module)
//    // PORT-PRUNE: <module>    -> `'<module>',` inside PRUNE_SERVICES (a module whose `entrances` should clear the trees)
//  and the rings of a module (water pits, keep-outs, paved ground) go to src/areas/dekabristov/rings.js (its own protocol, PORT-IMPORT / PORT-SOURCE). The people / wildlife rows of a module (PEOPLE_HOT, PIGEON_ZONES, CROWDS) are
//  plain lines of their tables: append them at the end of the table, after the marker comment line `// PORT-ZONES`.
// ============================================================================
import { GROUPS_VO } from '../../world/bridges/groups-vo.js';
import { GROUPS_LIST as G_SMOLENSKY } from '../../world/landmarksSmolensky/groups.js';
import { GROUPS_LIST as G_VOSTATUES } from '../../world/landmarksVOStatues/groups.js';
import { WATER_RINGS as RINGS_WATER, KEEP_OUT as RINGS_KEEP_OUT, PAVED_RINGS as RINGS_PAVED } from './rings.js';
import { GROUPS_LIST as G_DEKABRISTOV } from '../../world/landmarksDekabristov/groups.js';
import { LUTHERAN_RING, ARMENIAN_RING, SIEGE_RING, GARDEN_RING, VOLODIN_RING } from './cemetery.js';      // the HUD rows of the cemeteries, the garden and the square (the rings are copies of the GREEN records, cemetery.js)
// ---
// PORT-IMPORT: landmarksPrimorskaya
// ---
// PORT-IMPORT: landmarksFill
// ---
import { mo as MO_ROWS } from '../../world/bridges/groups-mo.js';      // bridgesMo: the bridges of the Smolenka mouth, the Shipbuilders' Bridge, the WHSD portals (bridges/groups-mo.js: imported only by the new areas)

/** Area id: <html data-area> must equal it (main.js refuses to run a page whose area module is another one) and the registry (src/areas/registry.js) lists it. */
export const ID = 'dekabristov';
/** Where the baked products of this area live (relative to assets/). */
export const BAKE_DIR = 'baked/dekabristov/';
/** A missing or stale bake is an error card, never a minutes-long procedural build (a hand-off lands here). */
export const REQUIRE_BAKE = true;

/** The modules of this page, in build order (a module reads the services of the earlier ones). No `rail` and no landmarksA / B / C (no station, no tracks), no metro network. The island's own landmark modules are added in
 *  the PORT-MODULE slots (in this order). tools/modules-list.mjs parses this list: one quoted name per line (comment lines are ignored). */
export const MODULES = [
  'environment',  // ground, embankment granite, Smolenka / Malaya Neva / Gulf water, trees, lawns, flowerbeds, far skyline
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module claims: Petersburg facade grammar, roofs, courtyards, entrances
  'landmarksSmolensky', // the Smolensky Orthodox Cemetery: the Church of the Smolensk Icon and bell tower, St Xenia chapel, Trinity chapel, Holy Gates, Resurrection church, the fence, the forest and the graves (the seam with Vasilyevsky)
  //
  'landmarksVOStatues', // of the island's monuments only the Armenian church of the Resurrection, the Komitas monument and the monument to the polar explorers (GROUPS below)
  //
  'landmarksDekabristov', // the Lutheran and Armenian cemeteries, the siege memorial cemetery, the Decembrists' garden, the Volodin square with the Light-and-Music fountain (docs/gdm-D1.md)
  //
  // PORT-MODULE: landmarksPrimorskaya
  //
  // PORT-MODULE: landmarksFill
  //
  'bridges',      // the bridges of the area: the Uralsky, Smolensky, Nalichny and Novo-Andreevsky bridges (the same four as in Vasilyevsky)
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses, trams + parked cars
  'people',       // pedestrians, tourists, groups with guides, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the purple Zhiguli (E to get in) + the driving interface
];
/** Loading-screen words that differ from the strip's (main.js LABELS is the fallback for the rest). */
export const LABELS = {
  landmarksSmolensky: 'Смоленское кладбище, церкви, часовня Ксении Блаженной',
  landmarksVOStatues: 'Армянская церковь, памятник Комитасу, памятник полярникам',
  landmarksDekabristov: 'Лютеранское и Армянское кладбища, мемориал блокады, Сад Декабристов, светомузыкальный фонтан',
  // ---
  // PORT-LABEL: landmarksPrimorskaya
  // ---
  // PORT-LABEL: landmarksFill
  // ---
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
    // the island and its neighbours (names as in the OSM data)
    makarova: 'набережная Макарова', nalichnaya: 'Наличная улица', smolenka: 'набережная реки Смоленки', novosmolenskaya: 'Новосмоленская набережная', uralskaya: 'Уральская улица',
    odoevskogo: 'улица Одоевского', beringa: 'улица Беринга', kamskaya: 'Камская улица',
    korablestroiteley: 'улица Кораблестроителей', morskayaNab: 'Морская набережная', zheleznovodskaya: 'Железноводская улица', kima: 'проспект КИМа', krusenshterna: 'проспект Крузенштерна',
    kakhovskogo: 'переулок Каховского', dekabristov: 'переулок Декабристов', nakhimova: 'улица Нахимова', petrovsky: 'Петровский проспект', admiralsky: 'Адмиральский проезд',
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
// the Smolensky Orthodox Cemetery: all six sub-groups, the same as in Vasilyevsky (the seam of the 2.45 km2 overlap)
GROUPS.landmarksSmolensky = G_SMOLENSKY;
// of the monuments of Vasilyevsky island's list only the three that stand on this island (the territory holds the Armenian cemetery, the Kamsky garden and the AARI plaza); the others lie in the Vasilyevsky area and its east
const VO_KEYS = new Set(['vo-polar', 'vo-komitas', 'vo-church-armenian']);
GROUPS.landmarksVOStatues = G_VOSTATUES.filter((g) => VO_KEYS.has(g.key));
GROUPS.landmarksDekabristov = G_DEKABRISTOV;
// ---
// PORT-GROUPS: landmarksPrimorskaya
// ---
// PORT-GROUPS: landmarksFill
// ---
// the bridges: the four Smolenka bridges that stand in the territory and in Vasilyevsky's (bridges/groups-vo.js: Uralsky, Smolensky and Nalichny drawn by the generic arch machinery, the Novo-Andreevsky footbridge). Not claimed
// yet (the bridge engine round of the area-gdm effort): the Korablestroiteley bridge, the four Smolensky bridges of the Smolenka mouth, the ZSD viaduct, the Betancourt and Serny bridges
const BRIDGE_KEYS = new Set(['uralsky', 'smolensky', 'nalichny', 'novo-andreevsky']);
GROUPS.bridges = GROUPS_VO.filter((b) => BRIDGE_KEYS.has(b.key));
// ---
// bridgesMo (docs/gdm-B.md): the Shipbuilders' Bridge, the 1st .. 4th Smolensky bridges of the Smolenka mouth and the WHSD (here only its tunnel portals and the first 100 m of the at-grade stretch: the rest of the corridor lies in Morskoy)
GROUPS.bridges = GROUPS.bridges.concat(MO_ROWS(['korablestroiteley', 'smol1', 'smol2', 'smol3', 'smol4', 'whsd', 'betancourt', 'serny-bridge', 'whsd-petrovsky'], {
  // the WHSD here: the two tunnel ways of the Smolenka mouth and the first at-grade ways beyond the portals (the viaduct ways lie in Morskoy and Gavan); the fairway bridge of the Petrovsky side claims its own ways (r8840605, w589047643 / w589047646)
  whsd: { osm: ['w130068396', 'w350477987', 'w1257246774', 'w1257246771'], at: [-8147, -1977] },
  'whsd-petrovsky': { osm: ['r8840605', 'w589047643', 'w589047646'], at: [-7540, -3800] } }));
// ---

/**
 * The HUD location table (first match wins), built with the layout helpers `h` ({ NAMES, SUBGROUPS, _sqPolys, _groupPolys, _named, _areaPolys, _shoreOf, _deck, inRiver, shoreDist }).
 * shapes: { poly: [x,z,...], margin? (m around the polygon) } | { c: [x,z], r } | { x0, x1, z0, z1 } | { road: 'Невский проспект' } (nearest road of that name within 22 m)
 */
export function makeAreas(h) {
  const { SUBGROUPS, _groupPolys, _shoreOf, inRiver } = h;
  return [
  { name: 'Уральский мост · Uralsky Bridge', c: [-4626.9, -1826.9], r: 26 },
  { name: 'Смоленский мост · Smolensky Bridge', c: [-5286.9, -1645.8], r: 26 },
  { name: 'Наличный мост · Nalichny Bridge', c: [-6702.1, -1707.9], r: 48 },
  { name: 'Ново-Андреевский мост · Novo-Andreevsky Bridge', c: [-6328.8, -1603.0], r: 20 },
  // bridgesMo (docs/gdm-B.md)
  { name: 'Мост Кораблестроителей · Korablestroiteley Bridge', c: [-7532.2, -1948], r: 52 },
  { name: '1-й Смоленский мост · 1st Smolensky Bridge', c: [-8059.5, -2005.4], r: 20 },
  { name: '2-й Смоленский мост · 2nd Smolensky Bridge', c: [-8008.7, -2182.8], r: 20 },
  { name: '3-й Смоленский мост · 3rd Smolensky Bridge', c: [-7955.6, -1975.4], r: 34 },
  { name: '4-й Смоленский мост · 4th Smolensky Bridge', c: [-7903.2, -2151], r: 34 },
  { name: 'Мост Бетанкура · Betancourt Bridge', c: [-4813, -2778], r: 80 },
  { name: 'Серный мост · Serny Bridge', c: [-4930.1, -2552], r: 22 },
  { name: 'Мост через Петровский фарватер (ЗСД) · WHSD bridge over the Petrovsky fairway', c: [-7540, -3800], r: 220 },
  // ---
  { name: 'Смоленская церковь · Smolensk Icon Church', c: [-5612, -1525], r: 50 },
  { name: 'Святые ворота · Holy Gates of the cemetery', c: [-5502.6, -1529.6], r: 30 },
  { name: 'Часовня Ксении Блаженной · Chapel of St Xenia', c: [-5586, -1325], r: 30 },
  { name: 'Смоленское православное кладбище · Smolensky Orthodox Cemetery', c: [-5730, -1231], r: 330 },
  // ---
  ..._groupPolys(SUBGROUPS['vo-church-armenian'], 10).map((r) => ({ name: 'Армянская церковь · Armenian Church', ...r })),
  { name: 'Памятник Комитасу · Komitas monument', c: [-5017.3, -1745.1], r: 20 },
  { name: 'Памятник всем полярникам · Polar explorers monument', c: [-6686, -1607.2], r: 20 },
  { name: 'Обелиск «Героическим защитникам Ленинграда» · Obelisk to the defenders of Leningrad', c: [-5788.5, -1709.5], r: 22 },
  { name: 'Памятник экипажу подлодки Щ-323 · Shch-323 submarine crew memorial', c: [-5798.3, -1647.1], r: 12 },
  { name: 'Мемориальное кладбище «Остров Декабристов» · Memorial cemetery of the siege', poly: SIEGE_RING, margin: 4 },
  { name: 'Смоленское лютеранское кладбище · Smolensky Lutheran Cemetery', poly: LUTHERAN_RING, margin: 4 },
  { name: 'Смоленское армянское кладбище · Smolensky Armenian Cemetery', poly: ARMENIAN_RING, margin: 4 },
  { name: 'Обелиск казнённым декабристам · Obelisk to the executed Decembrists', c: [-6368.5, -2409.9], r: 14 },
  { name: 'Светомузыкальный фонтан · Light-and-Music fountain', c: [-7994.7, -2078.9], r: 16 },
  { name: 'Сквер Александра Володина · Volodin Square', poly: VOLODIN_RING, margin: 4 },
  { name: 'Сад Декабристов · Decembrists\' Garden', poly: GARDEN_RING, margin: 4 },
  // ---
  // PORT-AREAS: landmarksPrimorskaya
  // ---
  // PORT-AREAS: landmarksFill
  // ---
  { name: 'Станция метро «Приморская» · Primorskaya metro', c: [-6337, -1818], r: 45 },
  // the streets, the embankments before the water rows (a bank point of the Smolenka would otherwise be named after the river)
  { name: 'Морская набережная · Morskaya Embankment', road: NAMES.streets.morskayaNab },
  { name: 'Набережная Макарова · Makarova Embankment', road: NAMES.streets.makarova },
  { name: 'Набережная реки Смоленки · Smolenka Embankment', road: NAMES.streets.smolenka },
  { name: 'Новосмоленская набережная · Novosmolenskaya Embankment', road: NAMES.streets.novosmolenskaya },
  { name: 'Улица Кораблестроителей · Ulitsa Korablestroiteley', road: NAMES.streets.korablestroiteley },
  { name: 'Наличная улица · Nalichnaya ulitsa', road: NAMES.streets.nalichnaya },
  { name: 'Уральская улица · Uralskaya ulitsa', road: NAMES.streets.uralskaya },
  { name: 'Улица Одоевского · Ulitsa Odoevskogo', road: NAMES.streets.odoevskogo },
  { name: 'Улица Беринга · Ulitsa Beringa', road: NAMES.streets.beringa },
  { name: 'Камская улица · Kamskaya ulitsa', road: NAMES.streets.kamskaya },
  { name: 'Железноводская улица · Zheleznovodskaya ulitsa', road: NAMES.streets.zheleznovodskaya },
  { name: 'Проспект КИМа · Prospekt KIMa', road: NAMES.streets.kima },
  { name: 'Проспект Крузенштерна · Prospekt Krusenshterna', road: NAMES.streets.krusenshterna },
  { name: 'Переулок Каховского · Pereulok Kakhovskogo', road: NAMES.streets.kakhovskogo },
  { name: 'Переулок Декабристов · Pereulok Dekabristov', road: NAMES.streets.dekabristov },
  { name: 'Улица Нахимова · Ulitsa Nakhimova', road: NAMES.streets.nakhimova },
  { name: 'Адмиральский проезд · Admiralsky proezd', road: NAMES.streets.admiralsky },
  { name: 'Петровский проспект · Petrovsky prospekt', road: NAMES.streets.petrovsky },
  // the water: the Smolenka (a narrow channel: by the shore distance), the Malaya Neva and the Gulf of Finland (the rest of the water; the Gulf starts west of the mouth of the Malaya Neva)
  { name: 'Смоленка · Smolenka River', x0: -8700, x1: -4000, z0: -2300, z1: -1400, test: (x, z) => _shoreOf(['smolenka'], x, z) < 14 },
  { name: 'Малая Нева · Malaya Neva', x0: -6790, x1: -4000, z0: -4000, z1: -2000, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Финский залив · Gulf of Finland', x0: -9999, x1: -6790, z0: -4200, z1: -2000, test: (x, z) => _shoreOf(['neva'], x, z) < 6 || inRiver(x, z) },
  { name: 'Остров Декабристов · Dekabristov Island', x0: -9999, x1: -4000, z0: -4200, z1: -800 },
  { name: 'Санкт-Петербург · Saint Petersburg', x0: -9999, x1: 9999, z0: -9999, z1: 9999 },
  ];
}

/** HERO (the start pose) and VIEWS (keys 1..0, Shift + 1..9, Alt + 1..5 and the Places list), built with the layout helper yawToward. */
export function makeViews({ yawToward }) {
  // Every pose is a free, walkable spot (tools/layout-test.mjs checks insideBuilding / isOnRoad / line of sight; tools/views-check.mjs adds the colliders; water is allowed, `--land` keeps the camera dry). x, z, yaw (deg, 0 = north, 90 = west), pitch (deg).
  // 1..3 the three cemeteries of the island, 4 Primorskaya, 5 the Decembrists' garden, 6..7 the Smolenka mouth bridges, 8 the Nalichny Bridge, 9 the Smolensky Orthodox Cemetery, 0 the Morskoy Kaskad towers; Shift + 1..4 the fill, the Smolensky bridge,
  // the Xenia chapel, the Komitas monument; Places: the polar explorers monument, the Uralsky bridge (poses found with a ring search around each sight, then checked by tools/views-check.mjs --land).
  const HERO = { x: -6416, z: -1806, yaw: yawToward(-6416, -1806, -6349, -1823), pitch: 8 };      // the Primorskaya square, looking at the metro pavilion
  const VIEWS = [
    { key: 'Digit1', label: 'Лютеранское кладбище', x: -5440, z: -1950, yaw: yawToward(-5440, -1950, -5420, -1958), pitch: 8 },
    { key: 'Digit2', label: 'Армянская церковь Воскресения', x: -5444, z: -1702, yaw: yawToward(-5444, -1702, -5444, -1731), pitch: 8 },
    { key: 'Digit3', label: 'Мемориальное кладбище «Остров Декабристов»', x: -5789, z: -1680, yaw: yawToward(-5789, -1680, -5789, -1709), pitch: 8 },
    { key: 'Digit4', label: 'Станция метро «Приморская»', x: -6416, z: -1806, yaw: yawToward(-6416, -1806, -6349, -1823), pitch: 8 },
    { key: 'Digit5', label: 'Сад Декабристов', x: -6330, z: -2395, yaw: yawToward(-6330, -2395, -6368, -2410), pitch: 8 },
    { key: 'Digit6', label: 'Мост Кораблестроителей', x: -7529, z: -1898, yaw: yawToward(-7529, -1898, -7532, -1948), pitch: 6 },
    { key: 'Digit7', label: 'Светомузыкальный фонтан · Смоленские мосты', x: -7995, z: -2050, yaw: yawToward(-7995, -2050, -7995, -2079), pitch: 6 },
    { key: 'Digit8', label: 'Наличный мост', x: -6704, z: -1682, yaw: yawToward(-6704, -1682, -6702, -1708), pitch: 6 },
    { key: 'Digit9', label: 'Смоленское кладбище · церковь Смоленской иконы', x: -5616, z: -1468, yaw: yawToward(-5616, -1468, -5616, -1523), pitch: 8 },
    { key: 'Digit0', label: 'ЖК «Морской Каскад»', x: -7740, z: -2200, yaw: yawToward(-7740, -2200, -7740, -2233), pitch: 10 },
    { key: 'ShiftDigit1', label: 'Намывная территория', x: -7995, z: -2930, yaw: yawToward(-7995, -2930, -7995, -2960), pitch: 6 },
    { key: 'ShiftDigit2', label: 'Смоленский мост', x: -5287, z: -1620, yaw: yawToward(-5287, -1620, -5287, -1646), pitch: 6 },
    { key: 'ShiftDigit3', label: 'Часовня блаженной Ксении', x: -5587, z: -1359.7, yaw: yawToward(-5587, -1359.7, -5586, -1325), pitch: 8 },      // (moved 0.3 m: with the whole cemetery ring built, gdm cluster B, a grave stood on the old pose (-5586, -1360))
    { key: 'ShiftDigit4', label: 'Памятник Комитасу', x: -5040, z: -1720, yaw: yawToward(-5040, -1720, -5017, -1745), pitch: 8 },
    // landmarksDekabristov (docs/gdm-D1.md): the Bekman tomb pavilion, the obelisk of the siege cemetery, the obelisk to the Decembrists, the Light-and-Music fountain
    { key: 'ShiftDigit5', label: 'Могила А. фон Бекмана · Лютеранское кладбище', x: -5313, z: -1898, yaw: yawToward(-5313, -1898, -5312.7, -1907.4), pitch: 8 },
    { key: 'ShiftDigit6', label: 'Обелиск «Героическим защитникам Ленинграда»', x: -5788, z: -1731, yaw: yawToward(-5788, -1731, -5788.5, -1709.5), pitch: 14 },
    { key: 'ShiftDigit7', label: 'Обелиск казнённым декабристам', x: -6368, z: -2421, yaw: yawToward(-6368, -2421, -6368.5, -2409.9), pitch: 10 },
    { key: 'ShiftDigit8', label: 'Светомузыкальный фонтан', x: -7978, z: -2079, yaw: yawToward(-7978, -2079, -7994.7, -2078.9), pitch: 8 },
    // the Places list only
    { key: 'Place.polar', label: 'Памятник всем полярникам', x: -6688, z: -1585, yaw: yawToward(-6688, -1585, -6686, -1607), pitch: 6 },
    { key: 'Place.uralsky', label: 'Уральский мост', x: -4642, z: -1797, yaw: yawToward(-4642, -1797, -4627, -1827), pitch: 6 },
  ];
  return { HERO, VIEWS };
}

/** The expectations of the CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs; shape: tools/lib/area-test-data.mjs). */
export const TEST = {
  claimed: [
    { id: 'w30351796', by: 'landmarksSmolensky', group: 'smolensky-church' },
    // ---
    { id: 'w111944528', by: 'landmarksVOStatues', group: 'vo-church-armenian' },
    { id: 'w23426250', by: 'landmarksDekabristov', group: 'dek-siege' },
    // ---
    // PORT-CLAIMED: landmarksPrimorskaya
    // ---
    // PORT-CLAIMED: landmarksFill
    // ---
    { id: 'r5574920', by: 'bridges', group: 'nalichny' },
    { id: 'r5574927', by: 'bridges', group: 'korablestroiteley' },
    { id: 'w409159831', by: 'bridges', group: 'betancourt' },
  ],      // one row per landmark module and its main sub-group
  viewKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'ShiftDigit1', 'ShiftDigit2', 'ShiftDigit3', 'ShiftDigit4', 'ShiftDigit5', 'ShiftDigit6', 'ShiftDigit7', 'ShiftDigit8', 'Place.polar', 'Place.uralsky'],
  mustHaveAreas: [
    { x: -6702.1, z: -1707.9, has: 'наличный' }, { x: -5612, z: -1525, has: 'смоленская церковь' }, { x: -5444, z: -1731, has: 'армянская' }, { x: -5017.3, z: -1745.1, has: 'комитас' },
    { x: -6686, z: -1607.2, has: 'полярник' }, { x: -5586, z: -1325, has: 'ксении' }, { x: -6337, z: -1818, has: 'приморская' },
    { x: -7532.2, z: -1948, has: 'кораблестроител' }, { x: -7903.2, z: -2151, has: '4-й смоленский' }, { x: -4813, z: -2778, has: 'бетанкур' },
  ],
  // `kept` is left out on purpose: the default is every key of GROUPS, so tools/landmarks-groups-check.mjs verifies every landmark module of this page against its data
  roadsNear: { at: [-6400, -1800], r: 90, min: 3 },
};


// ============================================================================================================================================
//  ENGINE TABLES (docs/AREAS.md section 3): the places that the engine modules used to hard-code. Every area module exports the same names; a module reads them through
//  src/world/lib/area-tables.js, which fills what an area leaves out with an empty / inert value.
// ============================================================================================================================================

// ---------------------------------------------------------------- WATER (environment/waterways.js)
/** Bridge crossings of the quay. c: centre, axis: bearing (deg) of the deck axis (direction of travel across the water), w: width of the deck measured ALONG the water (= the gap in the
 *  parapet / collider), len: length of the span (the abutments reach 8 m beyond it). `own`: a bridge the bridges module draws (the quay leaves the parapet / collider open and publishes the zone);
 *  the others get an invisible fallback deck (walk box + parapet boxes). The same four rows as in Vasilyevsky (docs/vo-br.md). */
const BRIDGE_ZONES = [
  { id: 'uralsky', name: 'Уральский мост', key: 'smolenka', c: [-4626.9, -1826.9], axis: 144.3, w: 31.0, len: 21.6, own: true },
  { id: 'smolensky', name: 'Смоленский мост', key: 'smolenka', c: [-5286.9, -1645.8], axis: 149.5, w: 28.2, len: 21.3, own: true },
  { id: 'nalichny', name: 'Наличный мост', key: 'smolenka', c: [-6702.1, -1707.9], axis: 16.3, w: 70.9, len: 41.7, own: true },
  { id: 'novo-andreevsky', name: 'Ново-Андреевский мост', key: 'smolenka', c: [-6328.8, -1603.0], axis: 201.7, w: 3.3, len: 22.3, own: true, foot: true },
  // bridgesMo: the Shipbuilders' Bridge and the four bridges of the Smolenka mouth (the numbers of the source's BRIDGE_SHADES rows, environment/waterways.js 259 .. 263; river.js SITE_OF maps the ids to the sites of bridges/sites-vo2.js)
  { id: 'korablestroiteley', name: 'Мост Кораблестроителей', key: 'smolenka', c: [-7532.2, -1948.0], axis: 16.5, w: 70.8, len: 40.7, own: true },
  { id: 'smol1', name: '1-й Смоленский мост', key: 'smolenka', c: [-8059.5, -2005.4], axis: 15.7, w: 16.4, len: 30.8, own: true },
  { id: 'smol2', name: '2-й Смоленский мост', key: 'smolenka', c: [-8008.7, -2182.8], axis: 17.4, w: 15.8, len: 31.5, own: true },
  { id: 'smol3', name: '3-й Смоленский мост', key: 'smolenka', c: [-7955.6, -1975.4], axis: 16.3, w: 51.4, len: 32.2, own: true },
  { id: 'smol4', name: '4-й Смоленский мост', key: 'smolenka', c: [-7903.2, -2151.0], axis: 16.3, w: 51.0, len: 31.3, own: true },
  // the Serny Bridge (bridges/petrovsky/serny.js: frame origin (-4930.11, -2552.04), bearing 30.31, 13 m wide, 18.7 m long): the quay leaves its opening to the bridge's own abutments and wings. The Betancourt Bridge needs no row: a viaduct 10 - 18 m high over the shore, the generic quay stands under it
  { id: 'serny-bridge', name: 'Серный мост', key: 'neva', c: [-4930.1, -2552.0], axis: 30.3, w: 13.0, len: 18.7, own: true },
];

/** The decks of the big bridges as the water shader darkens the water under them (deck rectangle centre, axis, width between the railings, length bank to bank). Shade only: the quay openings come from the BRIDGE_ZONES rows above. */
const BRIDGE_SHADES = [
  { id: 'uralsky-deck', key: 'smolenka', c: [-4626.9, -1826.9], axis: 144.3, w: 31.0, len: 21.6 },
  { id: 'smolensky-deck', key: 'smolenka', c: [-5286.9, -1645.8], axis: 149.5, w: 28.2, len: 21.3 },
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
 * WATER: the water tables of environment/waterways.js (the ring objects of the scenery sources stay there; an area names the ones it draws)
 *   plugs / bridgeZones / bridgeShades / clipLines / farSources / farCenter / farRadius / forcedBanks / openMouths / dataWater / slopeReaches / keyByName / riverKeys / ownerRings / keepOut: see Admiralty's area.js
 *   and src/world/lib/area-tables.js. Here:
 *   dataWater   the Smolenka (r1576084 and its mouth arms r1576086) is a waterway of its own ('smolenka'); the arm r1576116 beside the Petrovsky stadium belongs to the Neva
 *   dataRings   the Malaya Neva and the Gulf of Finland are scenery rings of the engine (environment/neva-malaya.js, vo-sea.js) that this table also makes DATA water (real water: wading, swimming, driving, boats): most of
 *               the territory is water, so that a player can walk into it (docs/AREAS.md 13.7); the area-local table is enough, the shared sources stay as they are
 *   riverKeys   the RIVER records of the data whose key is null: the Petrograd-side straits, the Malaya Nevka and the Zhdanovka are drawn as the Neva (a granite trench of the Neva look), the Smolenka as 'smolenka'
 *   ownerRings / keepOut   collected from the landmark modules by ./rings.js (one line per module there)
 */
export const WATER = {
  plugs: [],
  bridgeZones: BRIDGE_ZONES,
  bridgeShades: BRIDGE_SHADES,
  clipLines: [],
  farSources: ['neva-up', 'neva-down', 'neva-malaya', 'vo-sea'],
  farCenter: [-6960, -2480],            // the middle of the territory bbox (the Neva / Gulf scenery rings are real positions: the window only says how far the far ring reaches)
  farRadius: 6000,                      // the radius of the far scenery
  forcedBanks: [],
  openMouths: [],
  dataWater: [{ id: 'r1576084', key: 'smolenka' }, { id: 'r1576086', key: 'smolenka' }, { id: 'r1576116', key: 'neva' }],
  dataRings: [{ id: 'malaya-neva', key: 'neva', source: 'neva-malaya' },
    // the Gulf of Finland west and north of the island (environment/vo-sea.js, the ring VO_SEA of the source), clipped to the data region like the Malaya Neva
    { id: 'gulf', key: 'neva', source: 'vo-sea' }],
  slopeReaches: SLOPE_REACHES,
  keyByName: {},
  riverKeys: { 'Смоленка': 'smolenka', 'Кронверкский пролив': 'neva', 'Ждановка': 'neva', 'Малая Невка': 'neva' },
  ownerRings: RINGS_WATER,
  keepOut: RINGS_KEEP_OUT,
};
/** ground that landmark modules pave themselves (claims.js): from ./rings.js */
export const PAVED_RINGS = RINGS_PAVED;

// ---------------------------------------------------------------- PEOPLE / WILDLIFE
/** the hot spots of the zone weight field: [x, z, amplitude, sigma]. Every row sits on a crowd / photo spot of the island and lies inside the play rectangles with an 8 m margin (the pattern of Vasilyevsky's table; the rows of the
 *  modules to come are appended after the marker line). */
const PEOPLE_HOT = [
  [-6337, -1818, 2.0, 24],        // the Primorskaya metro exits (the platform pavilion)
  [-6534, -1798, 1.0, 16],        // the western entrances of Primorskaya (the Maksisopot shopping centre side)
  [-6496, -1754, 0.8, 14],        // the Museum of the Petersburg Metro
  [-5444, -1731, 0.9, 16],        // the Armenian church of the Resurrection
  [-5586, -1325, 2.2, 16],        // the queue to the chapel of St Xenia (Smolensky Orthodox Cemetery, four pilgrim groups)
  [-5602, -1509, 0.9, 16], [-5603, -1386, 0.6, 12], [-5488, -1530, 0.9, 16], [-5484, -1556, 0.7, 16],        // the Smolensk church portico, the Trinity chapel, the Holy Gates, the Resurrection church
  [-5789, -1709, 0.6, 14],        // the obelisk of the siege cemetery
  [-6368, -2410, 0.7, 14],        // the obelisk to the executed Decembrists in the Decembrists' garden (landmarksDekabristov)
  [-7995, -2079, 1.2, 16],        // the Light-and-Music fountain of the Volodin square (landmarksDekabristov)
  [-5440, -2038, 0.4, 12],        // the grave of A. G. Faberge, the Lutheran cemetery (landmarksDekabristov; the cemetery crowd is thinned by HOOKS.inGarden)
  // PORT-ZONES
];
/** The pigeon / sparrow zones, in priority order. A row is { tag, kind: 'pigeon' | 'sparrow', x, z, ...overrides of { spread, n, r, w, name, min } } (wildlife/zones.js documents the fields) */
const PIGEON_ZONES = [
  { tag: 'primorskaya', kind: 'pigeon', x: -6337, z: -1818, spread: 18, n: 2, w: 1.8, r: 4.5, name: 'Голуби у станции «Приморская» · Pigeons at Primorskaya' },
  { tag: 'primorskaya', kind: 'sparrow', x: -6350, z: -1805, spread: 14, n: 1, w: 1.4, r: 3, name: 'Воробьи у станции «Приморская» · Sparrows at Primorskaya' },
  { tag: 'xenia', kind: 'pigeon', x: -5586, z: -1325, spread: 12, n: 1, w: 1.4, r: 3.5, name: 'Голуби у часовни Ксении Блаженной · Pigeons at the chapel of St Xenia' },
  { tag: 'volodin', kind: 'pigeon', x: -7995, z: -2064, spread: 12, n: 2, w: 1.4, r: 4, name: 'Голуби у светомузыкального фонтана · Pigeons at the Light-and-Music fountain' },
  { tag: 'garden', kind: 'sparrow', x: -6368, z: -2398, spread: 10, n: 1, w: 1.2, r: 3, name: 'Воробьи в Саду Декабристов · Sparrows in the Decembrists\' Garden' },
  // PORT-ZONES
];
/** the districts a crow likes: crows start on a tree top there when the player is not about (the cemeteries). At least one row is needed where crows live */
const CROW_HAUNTS = [{ x: -5850, z: -1400, r: 430 }, { x: -5430, z: -1900, r: 220 }, { x: -5930, z: -1620, r: 150 }];
/** the tourist crowds the ambience hears (core/audio.js 'crowd' loop): by zone tag { tag: [r (metres of full level), f (fade length), level 0..1] } */
const CROWDS = {
  primorskaya: [30, 40, 0.7], xenia: [14, 25, 0.7],
  volodin: [14, 25, 0.5], garden: [10, 20, 0.35],
  // PORT-ZONES
};

/**
 * ZONES: where the populations gather and the other place-bound lists of the world modules (each key may be left out: the module then does nothing for it); see Admiralty's area.js for the fields.
 *   peopleDensity  the scripted places of the strip's west (Kazan, Palace Square ...; people/west.js) and of the castle (people/mars.js) stand at fixed coordinates of the strip: switched off here
 */
export const ZONES = {
  pigeons: PIGEON_ZONES,
  crowHaunts: CROW_HAUNTS,
  crowds: CROWDS,
  fountains: [],
  peopleDensity: {
    west: { scale: 1, platforms: 1, off: true }, mars: { scale: 1, zones: [], off: true },
    // the cemeteries (HOOKS.inGarden = cemetery.js: the Smolensky Orthodox, the Lutheran, the Armenian and the siege cemetery): a quarter of the density (the zone weight there, hot spots and base alike, is multiplied by 0.22: spawn, goals
    // and re-placements), at most 130 heads inside them, and nobody on a bike / scooter / kick scooter / balance bike (noRiders: people/sim.js, scenes.js)
    garden: { factor: 0.22, maxPeople: 130, noRiders: true },
  },
  peopleCorridor: [],
  peopleHot: PEOPLE_HOT,
  tramLines: [],
  clearDiscs: [],
  farCentres: [{ x: -2430, z: -800, bias: 700 }],      // the historic centre lies far to the east: dense stone blocks beyond the Neva
};

// ---------------------------------------------------------------- GARAGE (drive/cars/index.js PARKING, drive.js SPAWN)
const DEG = Math.PI / 180;
/**
 * GARAGE (docs/AREAS.md 13.4): the four cars stand ONLY at the central station, the Moscow station; this territory does not contain it, so it holds ONE car, the purple Zhiguli (`lada`), on the Primorskaya square.
 *   poses  { coupe, truck, lada, roadster: { x, z, yaw (radians; 0 faces +Z, 99 deg = east; tools/area-garage-check.mjs measures the nearest point of the footprint from the driven lane) } }  a car without a pose is not built
 *   spawn  { x, z, yaw }  the default place of the first car (drive.js SPAWN)
 */
export const GARAGE = {
  poses: {
    lada: { x: -6420, z: -1793, yaw: 105 * DEG },
  },
  spawn: { x: -6420, z: -1793, yaw: 105 * DEG },
};

// ---------------------------------------------------------------- the rest
/** environment.js: the services whose `entrances` ([{ x, z, clearance? }]) clear the trees from the doors of the buildings they list */
export const PRUNE_SERVICES = [
  'city',
  // PORT-PRUNE: landmarksDekabristov
  //
  // PORT-PRUNE: landmarksPrimorskaya
  //
  // PORT-PRUNE: landmarksFill
];
/** the area-specific hooks of the engine modules (milestone M6, docs/AREAS.md section 9: keep-outs of trees / tufts / props / ways / parking, the crowd garden, the deck services; the call sites read
 *  them through lib/area-tables.js and are a no-op for a key that is absent) */
// the hook set of src/areas/north/hooks.js gated by the module list: none of its modules is in this list, so it is inert here, EXCEPT inGarden: the "garden" of the crowd is the four cemeteries of the island (cemetery.js:
// the GREEN polygons r2736670, r7738342, r7738341, w23426250), whose people density is a quarter of the usual and without riders (ZONES.peopleDensity.garden above); the North's own inGarden (the Tauride Garden, x > 915) is never true here
export const HOOKS = { ...makeHooks(MODULES), inGarden: inCemetery };
/** the height patches of layout.heightAt (milestone M6, docs/AREAS.md section 9): the hook set gated by MODULES, see src/areas/north/hooks.js */
export const HEIGHT_PATCHES = makeHeightPatches(MODULES);

import { inCemetery } from './cemetery.js';
import { makeHooks, makeHeightPatches } from '../north/hooks.js';      // shared with the parked North: the hook bodies are gated by the module list

// ---------------------------------------------------------------- the places of the OTHER areas (docs/AREAS.md: core/gates.js, the HUD list "Места · Places")
/**
 * CROSS_PLACES: places of another area the HUD list offers under that area's name (a pick asks the gate question and the hand-off lands at this pose). Empty: places are off in the live areas
 * (the edge gates carry the player across). Not read by any world module.
 */
export const CROSS_PLACES = [];
