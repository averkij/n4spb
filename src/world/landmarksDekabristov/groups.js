// landmarksDekabristov/groups.js - the layout.GROUPS sub-groups of module landmarksDekabristov (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim ONLY what the module really draws (tools/claims-draw-audit.mjs: an owner that claims a polygon draws it).
// A part of the module is built only when its key is listed in the area's GROUPS (landmarksDekabristov.js PARTS).  The ids are the real OSM ids of the data of the area (src/areas/dekabristov/data, docs/research/dekabristov-data.md).
// NOT claimed on purpose: the Armenian church w111944528 (landmarksVOStatues, group vo-church-armenian), the Komitas monument, the Smolenka bank polygons and the bridges (water / bridges owners), the private grave
// n11554194879 (a person who died in 2024) inside the siege cemetery, the Primorskaya metro and the fill (landmarksPrimorskaya / landmarksFill), the factory fences along the cemeteries, the forest / wood / playground polygons
// inside the garden (environment plants them), the 41 mapped trees of the garden (environment draws them, the planner keeps clear of them), the Light-and-Music fountain's park r10331754 is claimed whole.
export const GROUPS_LIST = [
  { key: 'dek-lutheran', name: 'Смоленское лютеранское кладбище', nameEn: 'Smolensky Lutheran Cemetery (the old German cemetery, Kamskaya st.): the fence, the alleys, the old trees, the graves, the tombs of the data and the Bekman tomb pavilion',
    ids: ['w1167374971'],
    osm: ['r7738342', 'w10707043', 'w605081790', 'n13002399501', 'n13002359701', 'n13002362201', 'n14155179601', 'n6558720506', 'n9798534217',
      'w445150868', 'w445150885', 'w445150871', 'w445150873', 'w445150874', 'w445150881', 'w445150890', 'w445150888', 'w445150864', 'w445150867', 'w445150869', 'w445150887', 'w445150895', 'w445150866', 'w445150880', 'w445150883', 'w445150878', 'w445150865'],
    at: [-5420, -1958], note: 'GREEN r7738342 (cemetery, 94 572 m2, 39 vertices): claiming it stops the generic lawn trees; the module plants the trees and draws the 18 footways (ribbons), the fence w10707043 (closed, 1 533 m: 1.8 m picket fence in breakable bays) and the gate wall w605081790, the graves (instanced), the four mapped tombs (Faberge n13002399501, Bauermeister n13002359701, the Gorvits crypt n13002362201, de Ribas n14155179601: names only in the monuments service), the plaque to Essen-Stenbock-Fermor n6558720506 by the south gate (the Smolenka side) and the Bekman family tomb w1167374971 (the "Gazebo of the German" of the film Brat, n9798534217: a 4 m2 mapping outline, drawn as an open pavilion round it)' },
  { key: 'dek-armenian', name: 'Смоленское армяно-григорианское кладбище', nameEn: 'Smolensky Armenian Cemetery: the fence, the alleys, the trees and the graves round the church of the Resurrection (the church itself is landmarksVOStatues vo-church-armenian)',
    ids: [],
    osm: ['r7738341', 'w29044231', 'w737256683', 'w737256684', 'w737256685', 'w737256686', 'w737256687', 'w737256688', 'w737256689', 'w737256690', 'w737256691', 'w737256692', 'w737256681', 'w737256680', 'w737256682'],
    at: [-5444, -1780], note: 'GREEN r7738341 (cemetery, 11 235 m2, 15 vertices), the closed fence w29044231 (494 m) and its 13 walkways; the church w111944528 is NOT claimed here (the graves keep 15 m clear of it)' },
  { key: 'dek-siege', name: 'Мемориальное кладбище «Остров Декабристов»', nameEn: 'Memorial cemetery "Ostrov Dekabristov" of the siege of Leningrad: the obelisk, the Shch-323 submarine memorial, the Chernobyl memorial, the mass graves on their lawns, the alleys and the fence',
    ids: [],
    osm: ['w23426250', 'w312980935', 'w312980923', 'w312980932', 'w312980933', 'w312980934', 'n3188963779', 'n1861951657', 'n3188961906',
      'n11510705243', 'n11510705244', 'n11510705245', 'n11510705246', 'n11510705247', 'n11510705248', 'n11510705249', 'n3188961950'],
    at: [-5935, -1621], note: 'GREEN w23426250 (cemetery, 48 723 m2, 21 vertices; the same way is the fence, closed, 1 095 m: a plain picket railing in breakable bays), five walkways, the obelisk n3188963779, the Shch-323 memorial n1861951657, the ChAES memorial n3188961906 and the eight mass-grave nodes (lawn plots with a stele and a plate carrying the OSM name); NOT claimed: the single grave n11554194879' },
  { key: 'dek-garden', name: 'Сад Декабристов', nameEn: "Decembrists' Garden (the island's namesake): the alleys, the lawns and trees, the benches, the fenced obelisk to the executed Decembrists and the memorial to the children of the siege",
    ids: [],
    osm: ['w16237335', 'w702732780', 'w702732781', 'w1309425609', 'n1846769112', 'n5025736127',
      'n4082797372', 'n4082797375', 'n4082797376', 'n4082797379', 'n4082797380', 'n4082797385', 'n4082797489', 'n4082797491', 'n4082797493', 'n4082797373', 'n4082797374', 'n4082797377', 'n4082797378', 'n4082797382', 'n4082797386', 'n4082797387', 'n4082797490', 'n4082797492',
      'w156618489', 'w156618492', 'w156618497', 'w156618515', 'w173925492', 'w173927139', 'w173927343', 'w173927734', 'w173927875', 'w173928279', 'w173931985', 'w402789260', 'w402789266', 'w402789271', 'w402789272', 'w406174245', 'w406174265', 'w702277339', 'w702277340', 'w1309425616',
      'w156618495', 'w156618498', 'w156618499', 'w156618510', 'w156618514', 'w156618516', 'w156618517', 'w173925919', 'w173926812', 'w173928290', 'w402789242', 'w406174256', 'w406174271', 'w697219100', 'w697219102', 'w1309425606', 'w1309425610', 'w1309425611', 'w1309425617',
      'w156618506', 'w156618512', 'w697219101', 'w697219103', 'w702277341', 'w702277342'],
    at: [-6272, -2413], note: "GREEN w16237335 (park, 57 137 m2, 33 vertices), 45 walkways, the picket fences w702732780 / w702732781 (a plain railing, breakable) and the enclosure w1309425609 of the obelisk n1846769112 (gate n12124907315), 9 benches and 9 litter bins of the data (props skips claimed ones), the memorial to the children of the siege n5025736127 (on the south edge, in the Anfisa garden next door)" },
  { key: 'dek-volodin', name: 'Сквер Александра Володина · Светомузыкальный фонтан', nameEn: 'Square of Alexander Volodin with the Light-and-Music fountain (the Smolenka mouth): the alleys, the lawns, the benches and the round fountain basin (shallow water, walkable)',
    ids: [],
    osm: ['r10331754', 'w1396274666', 'n11932839820', 'n11932834246', 'n11932905387',
      'w1286770103', 'w1286770932', 'w1419130492', 'w1286543888', 'w1286543895', 'w1286543900', 'w1286543901', 'w1286770106', 'w1286770110', 'w1286771332', 'w1286783786', 'w1286783788', 'w1286543894', 'w1286770102', 'w1286770502'],
    at: [-7908, -2051], note: 'GREEN r10331754 (park, 21 763 m2, 10 vertices), 15 walkways, 3 benches, the fountain w1396274666 (amenity=fountain, a round basin 16 m across at (-7994.7, -2078.9)): the basin is physics water 0.3 m deep ringed by breakable ghost bays, the jets and the lights are drawn' },
];

// ground that the module paves itself (claims.js extraClaimRings: no trunks, hedges or tufts of the engine there), built from the part files' own coordinates
const disc = (x, z, r, n = 20) => Array.from({ length: n }, (_, i) => [Math.round((x + Math.cos(i * 2 * Math.PI / n) * r) * 10) / 10, Math.round((z + Math.sin(i * 2 * Math.PI / n) * r) * 10) / 10]);
export const PAVED_RINGS = [
  disc(-7994.7, -2078.9, 13.5),               // the plaza round the Light-and-Music fountain (volodin.js)
  disc(-5788.5, -1709.5, 11.0),               // the apron of the siege obelisk (siege.js)
  disc(-6368.5, -2409.9, 5.0, 16),            // the paving inside the fence of the Decembrists' obelisk (garden.js)
];
