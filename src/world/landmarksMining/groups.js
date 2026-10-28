// landmarksMining/groups.js - the layout.GROUPS sub-groups of module landmarksMining (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/mining.md section 11).
// A part of the module is built only when its key is listed here (landmarksMining.js PARTS): flip a claim on together with its part.
//   mining-university  portico.js wings.js sculpt.js street.js: the relation r2902646 (outer way w116609899 is NOT baked; the relation id is), the rear range w116609897, the two sculpture nodes, the portico steps way.
//   mining-descents    descents.js: the two granite descents D1 (axial, in front of the portico) and D2 (amphitheatre at the bow of the Krasin); WATER_RINGS below hand the two rings to the water owner.
//   krasin             ship.js terrace.js: the icebreaker r3283438 (a 21 m yellow tenement in the generic city), its gangway canopy w693966848 (a BUILDING record, kind roof), the Amundsen bust, the gangway steps way.
// NOT claimed on purpose: the three rear blocks w116609896 / w691719152 / w369536605 (city draws them from docs/research/mining-houses.json), the footways, the embankment ways, the Neva wall and the
// retaining walls of the berth (environment), the lawn w558607477 (environment; the module only adds its granite curb), the lamps, the four flagpoles n8754378137..40 (never drawn), the fence w98330315
// (environment draws it; the module adds nothing on it).
export const GROUPS_LIST = [
  { key: 'mining-university', name: 'Горный университет', nameEn: 'Mining University (A. N. Voronikhin, 1806-11): the 12-column Doric portico on its stair, the links, wings and ranges, the sculpture groups, the chain bollards',
    ids: ['r2902646', 'w116609897'], osm: ['n4349628892', 'n4349646989', 'w628622358'], at: [-4567, 359],
    note: 'relation r2902646 (outer ring of 34 vertices + the museum courtyard hole) and the long rear range w116609897 (flat roof, 4 storeys); the sculpture nodes Hercules / Antaeus n4349628892 and Pluto / Proserpine n4349646989 are drawn by the module; w628622358 = the OSM steps way of the portico stair (streets would draw a flat pale rectangle)' },
  { key: 'krasin', name: 'Ледокол-музей «Красин»', nameEn: 'Icebreaker museum Krasin (1916-17): hull, superstructure, funnel, masts, boats, gangway; the quay terrace with the Amundsen bust',
    ids: ['r3283438', 'w693966848'], osm: ['n6449209085', 'w693966849'], at: [-4600.4, 512.2],
    note: 'the ship r3283438 (a 21 m yellow tenement in the generic city) and the gangway canopy w693966848 (a BUILDING record, kind roof); the Amundsen bust n6449209085 and the gangway steps way w693966849 are drawn by the module' },
  { key: 'mining-descents', name: 'Спуски набережной Лейтенанта Шмидта у Горного университета', nameEn: 'The two granite descents of the Lieutenant Schmidt embankment (axial D1 in front of the portico, amphitheatre D2 at the Krasin bow)',
    ids: [], osm: ['w628622359', 'w1172768048', 'w1172768051', 'w1172768053', 'w1172768054'], at: [-4580, 420],
    note: 'the pier relations r15853956 / r15853957 of the two descents are not baked (the rings are in DESCENT_D1 / DESCENT_D2 below); w628622359 = the OSM steps way of D1; the baked D1 side edges w1172768048 / 51 and the D2 edges w1172768053 / 54 are redrawn by descents.js; NOT claimed: the berth wall w1172768050 and the Neva wall w1172768043 (environment)' },
];

// The hand-over to the water owner (environment/owners.js: switched on by the claims above; descents.js draws walls, flights, landings and colliders in the rings).
// D1 = the axial descent in front of the portico (recess 21.7 x 8.2 m, frame P u -11.1 .. 10.6, w 22.7 .. 30.8); D2 = the amphitheatre descent beside the bow of the Krasin (27 m long wedge between the retaining wall
// w1172768054 and the water).  Rings in world metres [x, z].  Not exported as active until mining-descents is claimed: the lists stay empty while the part does not exist (no hole in the quay).
export const DESCENT_D1 = [[-4548.6, 385.7], [-4555.2, 380.9], [-4542.4, 363.4], [-4536.0, 368.0]];
export const DESCENT_D2 = [[-4613.5, 477.2], [-4626.9, 453.6], [-4622.5, 450.9], [-4619.2, 453.6], [-4615.4, 455.1], [-4610.9, 455.3], [-4607.3, 454.3]];
export const WATER_RINGS = GROUPS_LIST.some((g) => g.key === 'mining-descents') ? [{ id: 'descent-1', ring: DESCENT_D1 }, { id: 'descent-2', ring: DESCENT_D2 }] : [];
// no generated landing stage / boat / descent at the Krasin berth and at the two descents
export const KEEP_OUT = [{ id: 'krasin-berth', c: [-4600, 510], r: 62 }, { id: 'descent-1', c: [-4545.5, 374.5], r: 22 }, { id: 'descent-2', c: [-4617, 458], r: 20 }];
// Ground the module paves itself (claims.js: no trunks, hedges, beds or grass tufts there; listed only while the module is in the build list): the forecourt strip in front of the stair, the stair footprint, the Krasin terrace.
export const PAVED_RINGS = [
  [[-4588.3, 398.5], [-4534.7, 326.2], [-4531.1, 328.8], [-4584.8, 401.1]],
  [[-4576.0, 371.4], [-4557.0, 345.9], [-4552.0, 349.6], [-4571.0, 375.1]],
  [[-4611.6, 509.7], [-4628.3, 505.8], [-4621.2, 475.4], [-4613.5, 477.2], [-4606.0, 490.3]],
];
