// landmarksYelaginPark/groups.js - the layout.GROUPS sub-groups of module landmarksYelaginPark (pure data, no imports: layout.js merges them).  Dossier docs/research/yelagin-park-2026.md.
// Fields as in layout.js GROUPS: { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
// A part of the module is built only when its key is listed here (landmarksYelaginPark.js PARTS), so a claim is on together with the drawing.  Claims are flipped on only for objects the module draws.
// Not claimed on purpose: the lattice fence w717885288 of the theatre (stays the generic fence), the three Yelagin bridges (the bridges owner), the pond footbridges and sluices, the Rossi pavilions.
// The open stage w111429666 (region YE1) is baked since 2026-10-13: its claim is ON (it was in PENDING until the id existed)
const ALL = [
  { key: 'ypark-hercules', name: 'Геракл Фарнезский (мыс 4-го Южного пруда)', nameEn: 'Farnese Hercules on its cape: white marble copy on a pink granite plinth', ids: [], osm: ['n1157615795'], at: [-5544.9, -5113.7],
    note: 'OSM statue node n1157615795; the figure of the kit with the club, the lion skin and the three apples, the plinth 1.45 m, the white slab; solid collider, walkable round it' },
  { key: 'ypark-kirov', name: 'Памятник С. М. Кирову у 2-го Елагина моста', nameEn: 'Kirov bust on a pink granite stele at the park gate of the 2nd Yelagin bridge, with its hostas and the red salvia bed', ids: [], osm: ['n4353822789'], at: [-5213.7, -4908.7],
    note: 'OSM bust node n4353822789 (the sculptor is unknown; Tomsky\'s bust is the Kamenny-side one); bronze bust from the figure kit' },
  { key: 'ypark-theatre', name: 'Летний театр эстрады', nameEn: 'Estradny Theatre: two glulam wave canopies with terraced seating and curved arches, the round arena floor, the stage with its roof', ids: ['w717885285', 'w717885286', 'w717885287'], osm: [], at: [-5235.1, -5340.5],
    note: 'the two building=roof outlines and the building=yes stage polygon of the bandstand; the polygon w717885288 is the lattice FENCE (stays generic and is not claimed)' },
  { key: 'ypark-vent', name: 'Вентиляционный павильон метро', nameEn: 'Metro ventilation pavilion: octagonal limestone base, black louvred drum', ids: ['w107154084'], osm: [], at: [-5248.4, -4901.8],
    note: 'building=service + man_made=mineshaft ref 511 (the same id is in MANMADE); redrawn as an octagon 7.2 m across' },
  { key: 'ypark-piers', name: 'Лодочные станции и причал «Елагин остров»', nameEn: 'Boat rental pier (4th Northern pond), catamaran pier (2nd Southern pond) and the Srednyaya Nevka water-bus dock', ids: [], osm: ['w100146184', 'w699822919', 'w100868959'], at: [-5546, -5409],
    note: 'OSM pier polygons; environment/boats.js skips claimed pier ids; the park ponds themselves stay with environment' },
  { key: 'ypark-bear', name: 'Резной медведь с гармонью («Старик» в OSM)', nameEn: 'Carved wooden bear with an accordion in its round bed (OSM name "Старик")', ids: [], osm: ['n1269595927'], at: [-4615.1, -5129.9],
    note: 'OSM artwork node n1269595927 (material=wood); the photo of the critic shows a bear, not an old man' },
  { key: 'ypark-openstage', name: 'Открытая сцена у Большой площади', nameEn: 'Open stage (timber deck with a flat roof, [E])', ids: ['w111429666'], osm: [], at: [-4746, -5421],
    note: 'OSM building=yes "Открытая сцена" (region YE1, baked 2026-10-13); stage2.js draws it from the baked ring: deck, six posts, flat timber roof, two flights of steps [E, no photo]' },
];
const PENDING = [];
export const GROUPS_LIST = ALL;
export const GROUPS_PENDING = PENDING;

// ---------------------------------------------------------------------------------------------------- hand-over to environment (environment/owners.js SIGHTS: the lead registers this module there)
// PAVED_RINGS: ground the module paves itself (the dark rubber arena of the Estradny Theatre between its two canopies and the stage apron): no grass tufts, trunks, hedges or beds there; 'kirov-bed' = the hosta border and the salvia bed of the Kirov bust (a 3.3 m disc 1.5 m in front of the stele).
export const PAVED_RINGS = [{ id: 'theatre-arena', ring: [[-5240.8,-5330.7],[-5238.3,-5329.5],[-5235.7,-5328.7],[-5233,-5328.3],[-5230.2,-5328.5],[-5227.6,-5329.2],[-5225.1,-5330.4],[-5222.8,-5332],[-5220.9,-5333.9],[-5220,-5337.9],[-5219.4,-5340.5],[-5219.2,-5343.2],[-5219.7,-5345.8],[-5220.6,-5348.4],[-5221.9,-5350.7],[-5223.5,-5352.8],[-5225.6,-5354.5],[-5236.7,-5355],[-5242.5,-5344.1],[-5249.2,-5338]] }, { id: 'kirov-bed', ring: [[-5210.8,-4907.2],[-5210.9,-4906.2],[-5211.4,-4905.3],[-5212.1,-4904.6],[-5213.0,-4904.1],[-5214.1,-4903.9],[-5215.1,-4904.1],[-5216.0,-4904.6],[-5216.7,-4905.3],[-5217.2,-4906.2],[-5217.4,-4907.2],[-5217.2,-4908.3],[-5216.7,-4909.2],[-5216.0,-4909.9],[-5215.1,-4910.4],[-5214.1,-4910.5],[-5213.0,-4910.4],[-5212.1,-4909.9],[-5211.4,-4909.2],[-5210.9,-4908.3]] }];
