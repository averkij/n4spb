// landmarksSevkabel/groups.js - the layout.GROUPS sub-groups of module landmarksSevkabel (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/sevkabel.md section 11.1).
// A part of the module is built only when its key is listed here (landmarksSevkabel.js PARTS): flip a claim on together with its part.
export const GROUPS_LIST = [
  { key: 'sevkabel-hall', name: 'Севкабель Порт: главный корпус, набережная, площадь у причала', nameEn: 'Sevkabel Port: the 157 m main hall with the comb of ribs, the gantry gallery and stair tower, the alley bridge, the timber embankment, the pier plaza',
    ids: ['r8702908', 'w635347587', 'w1089553936', 'w1239372698', 'w1239372696'], osm: [], at: [-6172, 921],
    note: 'hall r8702908 (baked industrial h 20), the gantry gallery w635347587 (baked min_height 16: a raised part), the yellow stair tower w1089553936, the alley bridge w1239372698 (a building polygon at 6.5 m) and the SE-plaza kiosk w1239372696 (a 9 m cube in the generic city); the deck, lawn, slab path, rail, pavers and gravel are ground paving drawn by the module (the quay itself stays environment)' },
  { key: 'sevkabel-yard', name: 'Севкабель Порт: кирпичные корпуса Сименса и Гальске, ворота, «катушка Тесла»', nameEn: 'Sevkabel Port yard: the Siemens & Halske brick blocks 40D / 40E, the 1970s block 40A, the 42 m brick chimney, the Corten gate, the generator, spool towers',
    ids: ['r8702907', 'r8702906', 'r8702909', 'w559797551'], osm: ['n5987479287', 'w559480717', 'w559486264'], at: [-6181, 826],
    note: 'r8702907 boiler house + management building, r8702906 the administrative corps, r8702909 the block with the prism (a 28-node relation baked as 5 vertices), w559797551 the 42 m brick chimney (a 6.5 m box in the generic city); the Corten pylons stand in the gate n5987479287; '
      + 'review 2026-10-09: the two service ways of the yard (w559480717 inner alley, w559486264 round the NW end) are claimed: streets then makes them pedestrianOnly + skipDraw (no asphalt ribbon, no lane graph, no markings) and the module pavers run over them (the real alley / sea square / inner square are pavers, photos 003 018 019 021)' },
  { key: 'brusnitsyn', name: 'Брусницынский квартал на Кожевенной линии', nameEn: 'The Brusnitsyn quarter: the mansion (1884-86), the pink house 27/1 with its porticoes, the leather factory 28-30, the skyway over the street',
    ids: ['r4743691', 'r4743693', 'r8702898', 'w335462132'], osm: [], at: [-5640, 1085],
    note: 'mansion r4743691 (baked 2 levels, h 6.6: real cornice 12.8 m), the pink house r4743693 (the roster called it the tannery), the brick factory r8702898 (4 levels, 204 m front) and the skyway w335462132 (a building polygon at 5..8.8 m over the street); the Brusnitsyn Hall node and the POIs stay generic' },
  { key: 'sevkabel-istkabel', name: 'Исткабель: восточная часть «Севкабель Порта»', nameEn: 'Istkabel, the eastern third of Sevkabel Port: the white former printed-cotton factory (the river wing, the north wing, the courtyard blocks)',
    ids: ['r8702903', 'w1056867780', 'w1056867782'], osm: [], at: [-5916, 1036],
    note: 'r8702903 (skip: it owns 17 parts, claimed through the parent id) + the two glazed galleries between the wings (building=bridge); the courtyard stays environment ground' },
  { key: 'almshouse', name: 'Дом призрения Брусницыных (Морская академия)', nameEn: 'The Brusnitsyn almshouse (P. Suzor 1895-96, today the Makarov maritime university): brick U-house, stepped gable, porch, anchors, fence',
    ids: ['w61411170'], osm: [], at: [-5415, 767],
    note: 'w61411170 (4 levels in OSM: 3 in the middle, 4 in the wings); the two anchor nodes and the fence are drawn by the module; the wing w136790139 stays generic' },
  { key: 'skobsky', name: 'Скобский дворец', nameEn: 'The Skobsky Palace: a 165 m six-storey L-tenement on Kozhevennaya / Kosaya lines',
    ids: ['w136791761'], osm: [], at: [-5470, 1135],
    note: 'w136791761 (baked 6 levels h 19.8, generic city 23.5 m: real cornice about 22.5 m)' },
  { key: 'chp7', name: 'Василеостровская ТЭЦ-7: три трубы и главный корпус', nameEn: 'CHP-7: the three red-and-white 120 m chimneys and the sheet-clad plant block (closed site, exterior only)',
    ids: ['w136790127'], osm: ['w815734026', 'w815734027', 'w815734028'], at: [-5800, 800],
    note: 'block w136790127 (baked: industrial, no height, the generic city made 21 m; real parapet about 28 m); the chimneys have no building record (MANMADE kind chimney only) and are drawn by the module; the plot r2583512 stays environment ground; round tanks and pipelines stay generic' },
  { key: 'baltic-cranes', name: 'Балтийский завод: портальные краны', nameEn: 'Baltic Shipyard: 14 lattice portal cranes on their five runways (instanced silhouettes, closed territory)',
    ids: [], osm: ['w747160236', 'w747160237', 'w747160238', 'w747160239', 'w747160240'], at: [-5100, 1380],
    note: 'the five crane runway ways (MANMADE kind crane, drawn by nobody before); the yard hall w133084710 stays generic' },
];

// Hand-over to environment (environment/owners.js reads these from the module that has claims): no generated landing stage / boat along the hall quay and at the pier; the paved ground (no grass tufts through the pavers / deck / lawn).
const C = Math.cos(-0.6458), S = Math.sin(-0.6458);
const HW = (u, v) => [-6172.2 + C * u + S * v, 921.0 - S * u + C * v];     // frame H (frame.js) -> world
export const KEEP_OUT = [
  { id: 'sevkabel-pier', c: [-6125, 1020], r: 30 },
  { id: 'sevkabel-quay', c: HW(-20, 45), ax: [C, -S], hl: 140, hw: 24 },
];
export const PAVED_RINGS = [
  [HW(-128, -99), HW(111, -99), HW(111, 52), HW(78.6, 52), HW(78.6, 25), HW(-78.6, 25), HW(-78.6, 52), HW(-128, 52)],
  [HW(-78.6, 25), HW(78.6, 25), HW(78.6, 52), HW(-78.6, 52)],
];
