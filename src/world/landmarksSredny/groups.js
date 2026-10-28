// landmarksSredny/groups.js - the layout.GROUPS sub-groups of module landmarksSredny (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/sredny.md section 10).
// A part of the module is built only when its key is listed here (landmarksSredny.js PARTS): flip a claim on together with its part.
// NOT claimed on purpose: w1462599421 (the Imperial Club building site, NOT the tower: dossier correction 0.1), the yard annexes of the depot except the two optional ones, the rear blocks of Sredny 74
// (w45966000 / w45965998), the fire station w45965973 and the factory kitchen w862365657 (the city draws it once, from sredny-houses.json), the fuel station flagpoles n-ids on the 19th line, the totem n11367701365.
export const GROUPS_LIST = [
  { key: 'gorny-pavilions', name: 'Павильоны станции метро «Горный институт»', nameEn: 'Gorny Institut metro pavilions (2024): entrance, exit and lift pavilion No. 3',
    ids: ['w1305590665', 'w1305590664', 'w1346671783'], osm: [], at: [-5036, -5],
    note: 'the shells of the three pavilions of Bolshoy pr. 66 (copper mono-pitch roofs, glass walls with stainless braces, mirror-steel end bays); the metro owner draws the inside; door openings 4.4 m at the DOORWAYS anchors' },
  { key: 'geolkom', name: 'Геологический комитет (ЦНИГР им. Ф. Н. Чернышёва), Средний пр. 74', nameEn: 'Geological Committee building (Poleschuk 1912-14) and the Chernyshev museum: rusticated granite base, six-column portico, attic lettering, glass dome',
    ids: ['w45965990'], osm: ['n3425666979'], at: [-4967, -625],
    note: 'outline w45965990 (24 vertices, baked height 15 = a mapper tag; the real cornice is 20.3 m) replaced by the corrected plan (central block 24 m, critic C2); the museum POI n3425666979; the rear blocks 74 B / 74 V and the yard annexes stay generic' },
  { key: 'tram-depot', name: 'Василеостровский трамвайный парк и музей городского электрического транспорта, Средний пр. 77 / 79', nameEn: 'Vasileostrovsky tram depot and the Museum of Urban Electric Transport: three red-brick car sheds, admin blocks 79A / 79B, gatehouse',
    ids: ['r1839485', 'w136518061', 'w90798030', 'r1839483', 'r1839484', 'r2149589'], osm: ['n1497507516', 'n4349495292', 'n7110900478', 'n8955444708'], at: [-5100, -710],
    note: 'the three sheds (baked 3.3 m: real 8.2 .. 13.5 m), the admin blocks (baked 13.2 m: eaves 16.3 m) and the gatehouse; the nodes: the Brush monument n1497507516, the Leonov bust n4349495292, the blockade plaque n7110900478 (drawn on 79A) and the memorial stone n8955444708; the yard annexes (77 D, 77 E and the others) stay generic; rails, wires and the yard ground are streets' },
  { key: 'chernikhov-tower', name: 'Водонапорная башня Чернихова и канатный цех «Красного гвоздильщика», 25-я линия 4', nameEn: 'Chernikhov water tower and the rope shop of the Red Nailer plant (constructivism 1930-31, restored 2025)',
    ids: ['w117952619'], osm: ['n5955769967'], at: [-4850, 430],
    note: 'outline w117952619 (skip 1) with its four parts w868131738 / 39 / 40 / 41 through the parent id; the water-tower node n5955769967; NOT w1462599421 (that is the Imperial Club building site, a city house)' },
  { key: 'frank-mansion', name: 'Особняк А. Л. Франка (21-я линия В.О., 8А)', nameEn: 'Frank mansion (V. Schaub 1898-1900, Art Nouveau): two timber-gabled risalits, the arched portal with a mask, the oriel',
    ids: ['w100720370'], osm: [], at: [-4746, -21],
    note: 'outline w100720370 (baked as a 6.6 m office: real eaves 10.2 m, gables 13.8 / 14.4 m); the neighbouring yellow-ochre house stays generic' },
  { key: 'dom-evangelia', name: 'Дом Евангелия (24-я линия В.О., 3-7)', nameEn: 'Dom Evangelia (Baptist prayer house, Kaliberda 1910-11), abandoned: the street block with the tall volume, the steep-roofed west wing and its two neighbours',
    ids: ['w117952605', 'w116609892', 'w117952630'], osm: [], at: [-4917, 148],
    note: 'lit. A (baked height null) drawn from the corrected plan; lit. B and D as plain 3-storey ochre blocks; the old bulb sign and the SIVIL project are not drawn' },
];

// Ground that this module paves (world metres [x, z] rings, pure data): the Brush paver plaza on unmapped ground that environment paints as grass (the paving of the Gorny aprons is clipped at the asphalt in gorny.js).
export const PAVED_RINGS = [
  [[-4995.8, -697.0], [-4979.4, -706.6], [-4974.0, -696.7], [-4990.4, -687.2]],                       // the red-brown paver plaza of the Brush monument (D a 68 .. 87, b 111 .. 122)
];
