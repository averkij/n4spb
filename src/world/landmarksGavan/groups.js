// landmarksGavan/groups.js - the layout.GROUPS sub-groups of module landmarksGavan (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/gavan.md section 3).
// A part of the module is built only when its key is listed here (landmarksGavan.js PARTS): flip a claim on together with its part.
// NOT claimed on purpose: the water (environment: canal r1648985 / w10890550, harbour w10890576), the approach roads of the bridge (streets), the steps w697242809 at the east bridge end, the sheds / substation of the
// workers' town (1 storey = right), the Khrushchev blocks round it, the compound wall w634020349 and the barracks of the church compound (ordinary closed blocks), the Priboy range and the Morskaya Rezidentsia blocks
// along the canal (the city's KNOWN houses, docs/research/gavan-houses.json).
// HAND-OVER to environment (environment/owners.js reads WATER_RINGS / KEEP_OUT / PAVED_RINGS from here, switched on by a NON-EMPTY GROUPS_LIST).
export const GROUPS_LIST = [
  { key: 'gavan-kronshpits', name: 'Кроншпицы Галерной гавани и здания МЧС на восточном молу', nameEn: 'Kronshpitses (guard pavilions of 1754) of Galerny Harbour with the MChS buildings on the east mole',
    ids: ['w133197182', 'w133197155', 'w133197170', 'r2615813'], osm: ['w1385391719'], at: [-6958, 402],
    note: 'east pavilion w133197182 (needle 22 m), west pavilion w133197155 (11.5 m), the MChS house w133197170 and the hangar r2615813 drawn as boxes beside the east pavilion; w1385391719 = the mapped vertical ladder at the west mole tip' },
  { key: 'gavan-bridge', name: 'Шкиперский мост (ферма Mabey, 1997)', nameEn: 'Shkipersky bridge (1997 Mabey truss): deck, roadway and footway', ids: [], osm: ['r5576714', 'w374845529', 'w697242808'], at: [-7009.5, -31],
    note: 'the deck polygon r5576714, the road w374845529 and the footway w697242808 on it (precedent: the fortress bridges); NOT claimed: the 4 concrete steps w697242809 at the east end, the water, the approach roads' },
  { key: 'gavan-canal', name: 'Набережная Шкиперского протока: ограда и газон', nameEn: 'Shkipersky canal promenade: the mapped iron fence and its lawn', ids: [], osm: ['w1174466370'], at: [-6950, 170],
    note: 'the mapped fence w1174466370 (the module draws its own fan-panel fence along the same line: a generic one would double it); the path w1174466371 stays the streets carriageway' },
  { key: 'gavan-harbour', name: 'Галерная гавань: паровой кран, водонапорная башня, Караульный дом, ротонда, здание с фронтоном', nameEn: 'Galerny Harbour: steam crane (1854), water tower (1894), guardhouse, rotunda, pedimented works house', ids: ['w746428306', 'w223783421', 'w303684570', 'w1385391721', 'w141136973'], osm: ['w1189608893', 'w1189608894', 'w1189608895', 'w1189608899', 'w1189608900'], at: [-7060, -100],
    note: 'crane w746428306, water tower w223783421, guardhouse w303684570, rotunda w1385391721, the pedimented works house w141136973 (the generic city drew it 21 m high)' },
  { key: 'gavan-workers-town', name: 'Гаванский рабочий городок (1904-06) и мурал «Вода - это жизнь»', nameEn: 'Gavan workers town (1904-06): five brick-and-plaster slabs, annexes, the club wing and the mural wall',
    ids: ['w17564513', 'w17564532', 'w17564539', 'w17564584', 'w17564575', 'w201779451', 'w201779475', 'w201779469', 'w201779474', 'w201779472'], osm: ['n2117942027'], at: [-6289, -667],
    note: 'blocks A B V G D (eaves 18 m, green gables), five annexes; the mural node n2117942027 on the east end wall of A. Left generic: the sheds w201779363 / 362 / w957459698, the substation w201779464, the neighbouring Khrushchev blocks' },
  { key: 'gavan-fire-reserve', name: 'Гаванская пожарная часть (1906-07, Ф. А. Корзухин)', nameEn: 'Gavan fire reserve (1906-07, F. A. Korzukhin): the garage front, the tower, the stepped gable, the rear block', ids: ['w32861970', 'w32861971'], osm: [], at: [-6155, -600],
    note: 'main building w32861970 (the 39-vertex ring is the real stepped outline) and the rear block w32861971; the station stands silent: no beacons, no raised ladders; the mapped property fences stay generic' },
  { key: 'gavan-church', name: 'Церковь иконы Божией Матери «Милующая» и временный деревянный храм', nameEn: 'Church of the Merciful Mother of God (1889-98, 42 m) with the temporary wooden church and the hoarding', ids: ['w64384715', 'w634473943'], osm: ['w634473865'], at: [-5937, 540],
    note: 'church w64384715 (generic 13.5 m, baked 9.9 m: wrong), the temporary wooden church w634473943, the mapped fence w634473865 that the grey hoarding replaces; NOT claimed: the compound wall w634020349, the barracks and the car showroom' },
];

// ground that the module paves / lays out itself (no trunks, hedges, beds or grass tufts of environment there): world rings (frame K / C / ... computed by the module's frames)
// the stair cut into the canal face of the east mole (landmarksGavan/stair.js): K u 15.3 .. 19.75, v -21.8 .. -19.8 (13 steps, 1.9 m wide)
export const WATER_RINGS = [{ id: 'east-mole-stair', key: 'gavan', ring: [[-6943.2, 391.8], [-6938.5, 391.2], [-6938.2, 393.2], [-6943.0, 393.8]] }];
export const KEEP_OUT = [
  { id: 'kronshpits-mouth', c: [-6957, 402], r: 55 },
  { id: 'nevsky-yc-west', c: [-7240, -600], r: 70 }, { id: 'nevsky-yc-east', c: [-7192, -415], r: 28 }, { id: 'canal-berm', c: [-6972, 190], r: 48 },          // the yacht-club pontoons / boats of the module                                       // no generated stage or boat between the two moles
];
export const PAVED_RINGS = [
  [[-6942.4, 386.4], [-6939.0, 413.0], [-6938.1, 414.9], [-6936.4, 415.4], [-6928.9, 415.6], [-6925.7, 413.8], [-6924.6, 412.6], [-6924.3, 409.7], [-6924.4, 401.5], [-6924.1, 399.0], [-6921.0, 396.0], [-6922.5, 383.9]],   // east mole lawn
  [[-6994.6, -29.7], [-6939.3, 406.8], [-6935.9, 370.9], [-6963.1, 141.4], [-6976.8, -10.7]],                                                                                                              // promenade lawn
  [[-6904.0, -131.7], [-6877.7, -141.3], [-6875.8, -136.1], [-6902.1, -126.4]],                                                                                                              // guardhouse lawn
  [[-7064.3, -103.6], [-7057.5, -106.0], [-7055.1, -99.2], [-7061.9, -96.8]],                                                                                                            // crane stump
  [[-6979.4, -14.2], [-6971.0, -16.6], [-6969.8, -12.4], [-6978.2, -10.0]],                                                                                                              // rotunda base
  [[-6973.6, 387.4], [-6969.8, 417.7], [-6972.4, 417.9], [-6980.5, 423.9], [-6998.1, 428.0], [-7002.8, 391.1]],                                                                                                               // west headland
];
