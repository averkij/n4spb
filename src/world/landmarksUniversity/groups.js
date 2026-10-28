// landmarksUniversity/groups.js - the layout.GROUPS sub-groups of module landmarksUniversity (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws.
// Dossier docs/research/university-embankment.md; requests to the other owners docs/research/petro-requests-landmarksUniversity.md.
export const GROUPS_LIST = [
  { key: 'kunstkamera', name: 'Кунсткамера', nameEn: 'Kunstkamera (1718-34): the turquoise and white river block, the stepped tower with the armillary sphere, the annex on Tamozhenny pereulok, the yard buildings',
    ids: ['r3296328', 'w216655300', 'w28566732'], osm: [], at: [-2612.7, -1012.8],
    note: 'relation r3296328 with its parts r3296329 (the same ring at 3 levels) and w216655364 (the 8 m square of the tower); w216655300 / w28566732 = the two low buildings of the closed yard' },
  { key: 'academy-of-sciences', name: 'Здание Академии наук', nameEn: 'the main building of the Academy of Sciences (Quarenghi 1783-89): eight-column Ionic portico on the granite storey, the two stair flights; the Museum wing (Luchini 1826-31) and the polyclinic in the yard',
    ids: ['w28566714', 'w172906284', 'w28566716'], osm: [], at: [-2705.1, -940.4],
    note: 'w28566714 = Universitetskaya emb. 5 (the footprint includes the podium of the portico); w172906284 = the U-shaped Museum wing (Mendeleevskaya line 1 / Tamozhenny per. 2); w28566716 = the polyclinic of the Academy in the yard' },
  { key: 'twelve-collegia', name: 'Здание Двенадцати коллегий', nameEn: 'the Twelve Collegia (Trezzini 1722-42, the main building of the University): twelve red and white sections, the west gallery, the garden fence, the gate wall on the embankment',
    ids: ['r3170387'], osm: ['w172796325', 'w172796272', 'w142418184'], at: [-2910.2, -1030.5],
    note: 'r3170387 = Universitetskaya emb. 7-9-11 lit. A; the garden fence w172796325 (south half) + w172796272 (north half) and the gate wall w142418184 between the gallery and the Rector\'s wing are drawn by the module' },
  { key: 'university-monuments', name: 'Памятники у Университета', nameEn: 'the Lomonosov monument (1986) between the Academy and the Collegia, the Sakharov monument (2003) on Sakharov Square, the "universants" genius (2007) at the main door', ids: [],
    osm: ['n1584459525', 'n703687330', 'n1584457538'], at: [-2777.2, -905.9],
    note: 'n1584459525 = Lomonosov; n703687330 = Sakharov; n1584457538 (OSM name "Граф Уваров") = the node in the forecourt of the main door, where the module draws the winged genius of the photos' },
  { key: 'rector-wing', name: 'Ректорский флигель', nameEn: 'the Rector wing (Shchedrin 1840-42): red and white, five axes under a segmental pediment', ids: ['w28567239', 'w216655310'], osm: [], at: [-2856.0, -870.2],
    note: 'w28567239 = Universitetskaya emb. 9; w216655310 = the small one-storey building behind it' },
  { key: 'peter2-palace', name: 'Дворец Петра II (Филологический факультет)', nameEn: 'the Palace of Peter II (Trezzini 1727 - Borchardt 1761): the pale green and white embankment front, orange-red roofs, the gate beside the Rector wing', ids: ['r2870005'], osm: [], at: [-2893, -814],
    note: 'one OSM ring with the big courtyard of the Philological faculty (closed, not modelled)' },
  { key: 'novobirzhevoy-gostiny-dvor', name: 'Новобиржевой Гостиный двор', nameEn: 'Novobirzhevoy Gostiny Dvor (Quarenghi 1800-15, third storey 1936): the arcaded yellow trapezoid on Mendeleevskaya line, the History faculty', ids: ['r455384'], osm: [], at: [-2894.8, -1247.7],
    note: 'r455384 = Mendeleevskaya line 5, with its courtyard' },
];
