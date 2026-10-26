// landmarksYusupov/groups.js - the layout.GROUPS sub-groups of module landmarksYusupov (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
// Everything listed here is DRAWN by landmarksYusupov (docs/research/yusupov.md): the palace ring w123243367 (Moika front, east wing, house-theatre end, courtyard faces) with the courtyard
// colonnade wall / gate block / fences, the small service sheds of the courtyard, the garden "сад дворца Юсуповых" (park polygon, its gravel paths, the hill with the staircase, lamps, trees),
// the garden pavilion on ulitsa Dekabristova with the fence in front of it and the small gate-house.  The service blocks east of the court (w70732366 / w150616244) and all other houses of the
// Moika / Bolshaya Morskaya / Pirogova / Dekabristov stay with `city` (docs/research/yusupov-houses.json).  The Moika quay and its railing stay with `environment`.
export const GROUPS_LIST = [
  { key: 'yusupov-palace', name: 'Юсуповский дворец на Мойке', nameEn: 'Yusupov Palace on the Moika: 89.8 m ochre front with the six-column portico, east wing with the house theatre, courtyard with the colonnade wall and gate block',
    ids: ['w123243367', 'w123246602', 'w70732352', 'w70732354', 'w123243375'],
    osm: ['w123243373', 'w123243374', 'w108952920', 'w123243370', 'w123243371'],
    at: [-2933, 337],
    note: 'OSM w123243367 (22-vertex ring, museum, wikidata Q2991838, levels missing: real cornice 18.6 m), the courtyard walls w123243374 (rusticated wall with blind arches + curved colonnade) / w123243373 (arc) / w108952920, the small litera sheds w70732352 / w70732354 / w123243375 / w123246602' },
  { key: 'yusupov-garden', name: 'Сад Юсуповского дворца', nameEn: 'The Yusupov garden: lawns, gravel paths, the hill with the staircase, old limes, cast-iron lamps',
    ids: [],
    osm: ['w108952921', 'w123243372', 'w134519662', 'w123099605', 'w123246597', 'w123099608', 'w123246598', 'w123099604', 'w108952917', 'w108952919'],
    at: [-2905, 470],
    note: 'park polygon w108952921 (22 vertices, 165 m long strip from the courtyard wall to Dekabristov street) and its footways' },
  { key: 'yusupov-pavilion', name: 'Садовый павильон Юсуповского сада', nameEn: 'The garden pavilion on ulitsa Dekabristov with its arches, balustrade and the iron fence, and the small gate-house',
    ids: ['w70732356', 'w123243368'],
    osm: ['w108813835', 'w1287391381', 'w123246600'],
    at: [-2879, 546],
    note: 'w70732356 (243 m2, one storey, five arches on the street front) + w123243368 (97 m2 gate-house) + the fence pieces w108813835 / w1287391381 / w123246600' },
];
