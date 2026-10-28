// landmarksStrelka/groups.js - the layout.GROUPS sub-groups of module landmarksStrelka (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws.
// Dossier docs/research/strelka.md; requests to the other owners docs/research/petro-requests-landmarksStrelka.md.
export const GROUPS_LIST = [
  { key: 'exchange', name: 'Биржа', nameEn: 'Old Stock Exchange (Thomas de Thomon, 1805-10): the temple on the granite podium, 44 Doric columns', ids: ['r3084726'],
    osm: ['w765373941'], at: [-2609.8, -1232.7],
    note: 'relation r3084726 with its 554 building:part records (a mapper\'s 3D model: the measurements of the dossier come from it); w765373941 = the construction fence of the 2014-2025 restoration around the podium (barrier=fence, landuse=construction): claimed and NOT drawn, the restoration is over' },
  { key: 'rostral-columns', name: 'Ростральные колонны', nameEn: 'the two Rostral columns (32 m) with their prows, river gods, granite islands, bollards and chains', ids: ['r3084697', 'r19710429'],
    osm: ['w1441913828', 'w1442398943', 'w1442079762', 'w1442079763'], at: [-2481.4, -1190.1],
    note: 'south column r3084697 (-2481.4, -1190.1), north column r19710429 (-2585.1, -1364.3), each with ~200 building:part records; the chain rings w1441913828 / w1442398943 and the platform railings w1442079762 / w1442079763 (barrier=fence at 27.3 m) are drawn by the module' },
  { key: 'strelka-garden', name: 'Биржевой сквер и площадки колонн', nameEn: 'the semicircular garden of the Spit (lawn, gravel paths, begonia beds, clipped limes, benches, the anchor of 1723, the memorial sign) and the paved platforms of the two columns', ids: [],
    osm: ['w216655348', 'w764205826', 'w764205823', 'w764205824', 'w764205825', 'w1447719714', 'w1447719715', 'w1447719716',
      'w102582395', 'w496635211', 'w1447887324', 'w1447887325', 'w102582391', 'w102582392', 'w102582396', 'w102582398', 'w1447887326', 'w1447887327',
      'r10631793', 'r10631794', 'w1447719717', 'n6581377209', 'n1833271775',
      'n2260469444', 'n2260469452', 'n2260469465', 'n2260469479', 'n2260469488', 'n2260469515', 'n2260469604', 'n2260469608', 'n2260469613', 'n2260469618', 'n2260469620', 'n2260469623'], at: [-2495, -1298],
    note: 'park w216655348 with its seven flowerbeds, ten gravel footways, the footway areas of the column platforms (r10631793 south, r10631794 north) and of the tip (w1447719717), the memorial sign n6581377209, the anchor POI, the 12 bench nodes' },
  { key: 'strelka-descent', name: 'Спуск к Неве на Стрелке', nameEn: 'the granite descent of the Spit: terrace wall, two ramps, the landing, parapets, spheres, lion masks', ids: [],
    osm: ['w496635212', 'w1172768001', 'w1172768002', 'w216655284', 'w216655281', 'w216655292', 'w506191765', 'w506191766'], at: [-2442, -1290],
    note: 'OSM retaining walls w496635212 (terrace), w1172768001 / w1172768002 (outer parapets of the ramps), the sett footways of the ring; the ring itself is DESCENT_RING below' },
  { key: 'exchange-warehouses', name: 'Пакгаузы Биржи (Зоологический музей, Музей почвоведения)', nameEn: 'the North and South warehouses of the Exchange (Luchini 1826-32): yellow twins with white arched bays and 12-column loggias', ids: ['w97552311', 'w28566717', 'r19826133'],
    osm: [], at: [-2680, -1337],
    note: 'north: w97552311 (Makarova emb. 2) + w28566717 (Birzhevoy proezd 6, with its part w216687343), red roofs; south: relation r19826133 with 11 parts (Universitetskaya emb. 1, the Zoological Museum), grey roofs' },
  { key: 'customs-house', name: 'Таможня (Пушкинский Дом)', nameEn: 'the Customs house / Pushkin House (Luchini 1829-32): Ionic portico on the arcade, three copper statues, the drum and dome; the bust of Pushkin', ids: ['w28566721'],
    osm: ['n4350026297'], at: [-2797, -1380],
    note: 'building w28566721 with the dome part w216655349; the bust of Pushkin n4350026297 in front of the door' },
];

// The DESCENT RING of the Spit: the strip between the upper terrace wall of the semicircular garden (OSM retaining wall w496635212) and the outer edge on the Neva (the water polygon edge), from the north
// ramp head around the tip to the south ramp head.  landmarksStrelka draws the two cobbled ramps, the lower landing, the parapets and the spheres there; the environment treats the ring as water (no generic
// ground, no generic quay wall): docs/research/petro-requests-landmarksStrelka.md, request 1.  Points [x, z], outer edge first (north -> tip -> south), then the inner edge back.
export const DESCENT_OUTER = [[-2560.8, -1355.1], [-2553.3, -1359.3], [-2545.4, -1362.8], [-2537.2, -1365.3], [-2528.8, -1367.0], [-2520.2, -1367.7], [-2511.6, -1367.6], [-2503.0, -1366.5], [-2494.7, -1364.6],
  [-2486.5, -1361.7], [-2478.8, -1358.0], [-2471.4, -1353.5], [-2464.6, -1348.3], [-2458.4, -1342.3], [-2452.8, -1335.8], [-2447.7, -1328.2], [-2444.0, -1321.1], [-2440.8, -1313.1], [-2438.4, -1304.8],
  [-2437.0, -1296.3], [-2436.4, -1287.8], [-2436.8, -1279.2], [-2438.1, -1270.7], [-2440.3, -1262.4], [-2443.4, -1254.3], [-2447.3, -1246.7], [-2452.0, -1239.5], [-2457.4, -1232.8], [-2463.5, -1226.8],
  [-2470.2, -1221.4], [-2476.8, -1217.9]];
export const DESCENT_INNER = [[-2481.6, -1227.6], [-2472.1, -1235.2], [-2461.7, -1246.7], [-2457.5, -1252.8], [-2452.6, -1261.8], [-2449.9, -1271.2], [-2448.1, -1283.6], [-2447.8, -1294.7], [-2449.1, -1303.9],
  [-2452.8, -1316.0], [-2457.0, -1323.8], [-2459.8, -1328.1], [-2464.6, -1334.2], [-2468.4, -1338.1], [-2475.5, -1343.6], [-2487.8, -1350.9], [-2499.4, -1355.4], [-2510.5, -1357.4], [-2521.1, -1358.0],
  [-2532.4, -1356.1], [-2544.8, -1352.3], [-2553.8, -1346.7]];
export const DESCENT_RING = DESCENT_OUTER.concat(DESCENT_INNER);

// ---- hand-over to the environment (n4spb: the area tables WATER.ownerRings / WATER.keepOut, src/areas/vasilyevsky/rings.js; the source project hard-coded both in environment/waterways.js)
/** the descent ring counts as Neva water (a hole in the ground, the water surface, layout.inRiver, no bank edge of its own): the module draws the ramps, the landing and the parapets in it */
export const WATER_RINGS = [{ id: 'strelka-descent', key: 'neva', ring: DESCENT_RING }];
/** no generated descent, landing stage or boat on the Spit (the source waterways.js KEEP_OUT row 'strelka') */
export const KEEP_OUT = [{ id: 'strelka', c: [-2519.2, -1286.7], r: 96 }];
