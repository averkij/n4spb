// landmarksPribaltiyskaya/groups.js - the layout.GROUPS sub-groups of module landmarksPribaltiyskaya (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/pribaltiyskaya.md section 11 [C14]).
// A part of the module is built only when its key is listed here (landmarksPribaltiyskaya.js PARTS): flip a claim on together with its part.
//   pribaltiyskaya-hotel  hotel.js hotelfront.js rear.js: w17559880 (the outline; its seven parts w533042815 .. 22 follow through the parent id) + the terrace footway area w619407852, the two steps ways w619407845 / 46, the four
//                         wall ways w619407847 / 48 / 49 / 51 (BARRIERS) and the three lawn beds w534304747 / 46 / 45 (GREEN grass: the environment plants lawn and trees in any unclaimed GREEN polygon).
//   peter-tsereteli       peter.js: the monument w145671729 (a baked MONUMENT with its polygon).
//   creators-fleet        creators.js: the artwork node n5182103813 (the Agayan group).
//   kirov-memorial        kirov.js college.js: the two turret polygons w536759933 / 34 (generic 9 m cylinders), the college wing w17561581 (+ parts w611888545 / 43 / 40), the wreath node, anchors, propellers, the platform
//                         relation r7692261 and the wall w536759938.
//   nakhimov-statue       nakhimov.js: the statue node n3617365016 (the park r19581548 and its fence stay generic by decision: no claimed GREEN, so no trees are lost).
// NOT claimed on purpose: the place=square polygons w638336156 / w638352265 / w272199793 / w638336155 (streets paves them flush; they carry the junction roads), the parking / service roads.
// The three elevated service ways (w156992580 north ramp, w284127645 south ramp, w284127646 drive loop) ARE claimed in the hotel group: for a claimed rank-0 service bridge streets drops lanes / asphalt / furniture (streets.js).
// n4spb: `ON` is the list of groups of this module that an area may claim (as landmarksSeaTerminal/groups.js): GROUPS_LIST (the fallback of `ctx.L.GROUPS.landmarksPribaltiyskaya`) and PAVED_RINGS follow it.
// gavan and morskoy claim all six (the Kirov memorial lies 35 m beyond the gavan rectangles, 100 % inside the 120 m data margin, like kirova-erarta of vasilyevsky); a later area that claims fewer passes its own filtered
// list as GROUPS.landmarksPribaltiyskaya and removes the rings of the groups it leaves out in its rings.js.
const ON = ['pribaltiyskaya-hotel', 'peter-tsereteli', 'creators-fleet', 'kirov-memorial', 'nakhimov-statue', 'pribaltiyskaya-waterville'];
const ALL = [
  { key: 'pribaltiyskaya-hotel', name: 'Гостиница «Прибалтийская»', nameEn: 'Pribaltiyskaya Hotel (Evdokimov, Baranov et al. with Skanska, 1979): the H of three slabs, crown, ears, towers, plinth, stair, plaza',
    ids: ['w17559880'], osm: ['w619407852', 'w619407845', 'w619407846', 'w619407847', 'w619407848', 'w619407849', 'w619407851', 'w534304747', 'w534304746', 'w534304745', 'w156992580', 'w284127645', 'w284127646'], at: [-7647, -711],
    note: 'outline + 7 parts claimed through the parent id; the terrace area, the two stair steps, the four wall ways and the three lawn beds are redrawn by the module; the three elevated service ways (the two ramps w156992580 / w284127645 and the drive loop w284127646) are claimed: streets keeps no lanes / asphalt for them, the module draws the loop on its terrace and the solid platform replaces the ramps' },
  { key: 'peter-tsereteli', name: 'Памятник Петру I (З. К. Церетели)', nameEn: 'Tsereteli\'s monument to Peter I on Pribaltiyskaya Square: the three-slab base, the pilastered shaft, the bronze figure with the decree scroll',
    ids: [], osm: ['w145671729'], at: [-7476, -791], note: 'a baked MONUMENT with its polygon (not a building): the module draws base, shaft, figure, bollards and chain' },
  { key: 'creators-fleet', name: 'Создатели флота России (Е. М. Агаян)', nameEn: 'Agayan\'s bronze group "Creators of the Fleet of Russia" at the top of the hotel stair',
    ids: [], osm: ['n5182103813'], at: [-7573, -747], note: 'the artwork node; pedestal, wave and two figures are drawn by the module' },
  { key: 'kirov-memorial', name: 'Памятник крейсеру «Киров»', nameEn: 'Memorial to the cruiser Kirov: two 180 mm turrets, bronze wreath, granite wall with shell niches, propellers, anchors, the college wing with the frieze',
    ids: ['w536759933', 'w536759934', 'w17561581'], osm: ['n1352795088', 'n5198972326', 'n5198972329', 'n5198972327', 'n5198972328', 'r7692261', 'w536759938'], at: [-7970, -1075],
    note: 'the two turret outlines (generic 9 m cylinders), the college wing + parts (generic 20 + 8 + 10 m blocks), the platform relation r7692261 (streets paved it flush under the +0.55 m slab) and the wall way w536759938 are redrawn' },
  { key: 'nakhimov-statue', name: 'Памятник адмиралу Нахимову и круглое здание сквера', nameEn: 'Nakhimov statue (Lukyanov, 2012) with its pedestal, and the round glass building of the Malye Gavantsy park',
    ids: ['w23010318'], osm: ['n3617365016'], at: [-7309, -804], note: 'the statue node and the generic 9.9 m commercial box of the glass cylinder; the park (r19581548) itself stays generic' },
  { key: 'pribaltiyskaya-waterville', name: 'Бывший аквапарк «Вотервиль»', nameEn: 'Former Waterville aquapark: convex glass front, pink end blocks, neck toward the hotel',
    ids: ['w17559985'], osm: [], at: [-7660, -935], note: 'the generic 6.6 m box is replaced by the 13.8 m building of the baked ring' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// Ground that this module paves or lays itself (claims.js: no trunks, hedges, beds or grass tufts there; listed only while the module is in the build list).
const C = Math.cos(1.9966), S = Math.sin(1.9966);
const hf = (a, b) => [-7573.07 + C * a + S * b, -746.9 - S * a + C * b];
const ring = (pts) => pts.map(([a, b]) => hf(a, b));
const CK = Math.cos(2.0017), SK = Math.sin(2.0017);
const kf = (a, b) => [-7987.21 + CK * a + SK * b, -1067.85 - SK * a + CK * b];
const kring = (pts) => pts.map(([a, b]) => kf(a, b));
export const PAVED_RINGS = [
  // the platform at +3.2 (the base outline), the plaza slab field and the three lawn beds + the grove squares (group pribaltiyskaya-hotel)
  ...(ON.includes('pribaltiyskaya-hotel') ? [
    ring([[-13.9, 1.0], [18.4, 1.0], [18.4, 7.4], [49.3, 10.2], [75.9, 17.5], [76.5, -16.5], [61.4, -16.0], [49.7, -68.3], [65.1, -146.3], [-66.2, -146.3], [-50.9, -68.2], [-62.5, -16.7], [-76.2, -16.5], [-70.0, 17.1], [-41.5, 9.9], [-13.9, 7.4]]),
    ring([[-31, 8.5], [31, 8.5], [31, 88], [-31, 88]]),
    ring([[17, 14.5], [37, 14.5], [37, 43], [17, 43]]), ring([[-31, 14.5], [-20, 14.5], [-20, 43], [-31, 43]]),            // review 2026-10-09: the south grove stands at x -38 .. -20.5 (photos 08 / 01); slab, turf and rings stop at x -31 (service way)
  ] : []),
  // the Kirov platform (+0.55 m, grid paving) with the wreath bump and the three steps on its south-west edge (group kirov-memorial)
  ...(ON.includes('kirov-memorial') ? [kring([[-35.5, -2.5], [37.5, -2.5], [38.5, 56.5], [-35.5, 56.5]])] : []),
];
