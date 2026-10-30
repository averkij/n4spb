// landmarksNewHolland/groups.js - the layout.GROUPS sub-groups of module landmarksNewHolland (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  GENERATED once from the baked OSM data (every object of the baked city data whose
// vertices lie inside the island relation r1576204) and then maintained by hand.  Everything listed here is DRAWN by landmarksNewHolland (docs/research/new-holland.md): the three warehouse wings and the
// Arch, the Bottle (naval prison), the small buildings (Commandant's House, Kuznya, Pavilion, Stage, kiosks, WC domes, info centre, guardhouse, Frigate playground) and the park (paths, lawns, herb garden,
// the Kovsh with the East and South canals, the timber pier and stairs, the four island footbridges, fences, steps, benches, litter bins, lamps).  The Admiralty canal, the Kryukov canal, the Moika quay,
// the Krustein bridges and the houses around the island are NOT here (environment / bridges / city).
export const GROUPS_LIST = [
  { key: 'nh-warehouses', name: 'Лесные склады Новой Голландии и Арка', nameEn: 'New Holland timber warehouses I (Dom 12), N, O (with the Pasypkin corner) and the Vallin de la Mothe Arch', ids: ['r3164896', 'w97821643', 'w97821653', 'w128981839'],
    osm: [], at: [-3390, 453],
    note: 'r3164896 Дом 12 (литера И, along the Kryukov canal), w97821643 литера Н (Moika, west of the Arch), w97821653 литера О (Moika + Kryukov wing, SE rounded corner), w128981839 the Arch (roof over the South canal)' },
  { key: 'nh-bottle', name: 'Бутылка (морская тюрьма)', nameEn: 'The Bottle: the ring-plan naval prison (Staubert 1823-29)', ids: ['r1404157'],
    osm: [], at: [-3548, 337.5], note: 'r1404157 two outer rings and two inner courtyards; ring radius 29.5 m' },
  { key: 'nh-buildings', name: 'Дом коменданта, Кузня, Павильон, Сцена, киоски', nameEn: 'Commandant\'s House, Kuznya (forge), Pavilion, Stage, Frigate playground, kiosks, WC domes, info centre, guardhouse', ids: ['r3164895', 'w97821646', 'w472268626', 'w472268623', 'w1000013403', 'w507817409', 'w507817415', 'w507817416', 'w507817417', 'w507817418', 'w507817408'],
    osm: [], at: [-3500, 310], note: 'small buildings of the island on their baked footprints' },
  { key: 'nh-park', name: 'Парк Новой Голландии: Ковш, каналы, дорожки, газоны', nameEn: 'New Holland park: Kovsh basin, East / South canals with their footbridges, paths, lawns, herb garden, fences, steps, furniture', ids: [],
    osm: [
      'w290680471', 'w472268624', 'w507817411', 'w839897506', 'w839897519', 'w839897520', 'w1333267371', 'w1333770777',
      'w410879849', 'w513847288', 'w514284055', 'w514285149', 'w514286258', 'w514286260', 'w514286262', 'w1333267370',
      'w1337768318', 'w417931466', 'w1329669076', 'w1332423198', 'w514284054', 'w1165063513', 'w1165063514', 'w1165063515',
      'w1329669075', 'w1332919350', 'w1333256737', 'w1333261304', 'w1333261305', 'w124244200', 'w373488750', 'w472268625',
      'w507817412', 'w507817413', 'w507817414', 'w513847289', 'w513847290', 'w513847292', 'w513847294', 'w514294329', 'w514294331',
      'w521677863', 'w688189747', 'w821944751', 'w821944752', 'w839897505', 'w839897507', 'w839897508', 'w839897513',
      'w839897514', 'w839897515', 'w839897516', 'w839897517', 'w839897518', 'w1000013402', 'w1164807320', 'w1308844275',
      'w1308844644', 'w1308845384', 'w1308845393', 'w472268629', 'w507817410', 'w514285151', 'w514285165', 'w1064821822',
      'w1213920603', 'w1308844086', 'w514290024', 'w1164816998', 'w472264772', 'w122236935', 'w235115110', 'w472268628',
      'w472268677', 'w513847285', 'w514285150', 'w514285152', 'w514285159', 'w514285160', 'w515788454', 'w515788456',
      'w515788457', 'w839897510', 'w839897511', 'w839897512', 'w921489526', 'w1213920599', 'w1213920600', 'w1213920601',
      'w1213920602', 'w1308846232', 'w1308860444', 'w1333261306', 'w513847287', 'w688189750', 'w1165063516', 'w1333770778',
      'w122236938', 'w514290023', 'w1333770775', 'w1332423194', 'w1332423193', 'w1332423196', 'w1333770776', 'r1648982',
      'r1648986', 'r1648987',
      'n8689813667', 'n8870393896', 'n9980805838', 'n12339731187', 'n12339731196', 'n12339731197', 'n12339731198', 'n12339756105',
      'n12339756122', 'n4972469639', 'n5024740136', 'n5024740137', 'n5024740138', 'n5024740139', 'n5024740140', 'n5024740141',
      'n5024740142', 'n5024740143', 'n4972469385', 'n4972469386', 'n4972469387', 'n4972469388', 'n4972469389', 'n4972469390',
      'n4972469392', 'n4972469393', 'n4972469398', 'n4972469399', 'n4972469410', 'n8870393898', 'n9167515781', 'n12326907159',
      'n12326907189', 'n12326907194', 'n12326914701', 'n12326914716', 'n12326914721', 'n12331173689', 'n12331173696', 'n12331173700',
      'n12331326316', 'n12331373986', 'n12335116059', 'n12335116062', 'n12335116065', 'n12335116066', 'n12335116067', 'n12335116069',
      'n12335116074', 'n12335116075', 'n12335116076', 'n12335116077', 'n12337602211', 'n12337602213', 'n12337602217', 'n12337602221',
      'n12337602223', 'n12337602224', 'n12337602225', 'n12337602227', 'n12337602229', 'n12337602230',
      
      'w1000013399',
    ], at: [-3440, 310],
    note: 'green polygons, footways / service lanes / footbridges, fences, steps, the Kovsh and the two inner canals (r1648982 / r1648986 / r1648987), the timber pier w507817412 and the furniture / lamp nodes inside the island ring (generated)' },
];
export const GROUP_COUNTS = {"greens":29,"roads":63,"barriers":11,"steps":3,"water":3,"nodes":73};
