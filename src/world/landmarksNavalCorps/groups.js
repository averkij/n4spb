// landmarksNavalCorps/groups.js - the layout.GROUPS sub-groups of module landmarksNavalCorps (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/navalcorps.md section 1.3).
// A part of the module is built only when its key is listed here (landmarksNavalCorps.js PARTS): flip a claim on together with its part.
// NOT claimed on purpose: the military landuse w818073729, the footways / lawns / lamps / quay wall ways (streets / environment), the church compound wings r17488567 and w107214821 (ordinary houses).
// HAND-OVER to environment (environment/owners.js reads WATER_RINGS / KEEP_OUT / PAVED_RINGS from here, switched on by a NON-EMPTY GROUPS_LIST): the arrays stay EMPTY until the stair is drawn.
export const GROUPS_LIST = [
  { key: 'naval-corps', name: 'Морской кадетский корпус', nameEn: 'Naval Cadet Corps (Volkov 1796-98): the 136 m river front, the colonnade, the pavilion domes, the turret, the compound ring', ids: ['r1242815', 'w82802180'], osm: [], at: [-4047.5, -336.6],
    note: 'outline r1242815 (baked skip 0: the generic city drew a 9.9 m block) with its parts w818073724 / 25 / 27 claimed through the parent id; w82802180 = the 42 m2 shed inside courtyard H2; the landuse w818073729 stays' },
  { key: 'krusenstern', name: 'Памятник И. Ф. Крузенштерну и историческая лестница к Неве', nameEn: 'Krusenstern monument (1873) and the heritage stair to the Neva', ids: [], osm: ['n1612810138', 'w628627388', 'w628627390'], at: [-3984.4, -241.4],
    note: 'statue node, the two OSM steps ways of the stair (13 m each, wrong in length: the stair is 8 m deep); the module draws the tumba, the stair, the end blocks, the railing, the pedestal, the statue and the paved terrace; r15853955 is not a baked id' },
  { key: 'dormition', name: 'Успенская церковь подворья Оптиной пустыни', nameEn: 'Church of the Dormition (Kosyakov 1895-97) and the front house of the compound', ids: ['r17488566', 'r4164973'], osm: [], at: [-4240, -110],
    note: 'church (the part r17488566 of r4164970) + the front house r4164973; the courtyard wing r17488567 and the Reserve house w107214821 stay generic / KNOWN; r4164970 itself is not claimed' },
  { key: 's189', name: 'Подводная лодка-музей С-189', nameEn: 'Submarine museum S-189 (Project 613, 1954) and its floating pier', ids: ['w133084707'], osm: ['w945633057', 'w945633056'], at: [-4245.3, 34.2],
    note: 'replaces the generic wooden ship; the pier and the footbridge are drawn by the module; the water belongs to environment' },
];

// The stair is landmark-owned like landmarksStrelka/descent.js: the ring below becomes water (the quay opens there), the module draws the steps and every wall of the pit.
export const WATER_RINGS = [{ id: 'krusenstern-stair', ring: [[-3995.0, -236.9], [-3975.8, -247.9], [-3971.8, -241.0], [-3991.1, -230.0]] }];   // frame K u 55.4 .. 77.6, v 39.4 .. 47.4
export const KEEP_OUT = [{ id: 'krusenstern', c: [-3983.5, -239.0], r: 16 },
  { id: 's189', c: [-4245.3, 34.2], ax: [0.7336, -0.6796], hl: 44, hw: 14 }];                                                              // the berth: hull axis bearing 47.2 deg
export const PAVED_RINGS = [[[-4004.5, -244.6], [-3978.5, -259.5], [-3972.8, -249.6], [-3998.9, -234.7]]];                                  // the paved terrace u 51 .. 81, v 28 .. 39.4
