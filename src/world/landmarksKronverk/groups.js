// landmarksKronverk/groups.js - the layout.GROUPS sub-groups of module landmarksKronverk (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws (docs/research/kronverk.md).
// A part of the module is built only when its key is listed here (landmarksKronverk.js PARTS): flip a claim on together with its part.
/** the lawns of the museum court and of the east yard (GREEN grass polygons): claimed so that the generic wood does not grow between the exhibits; the module lays the lawns itself */
export const COURT_GREEN = ['r3243638', 'r3243639', 'r3243640', 'r3243641', 'r3243642', 'r3243643', 'r3243644', 'r3243645', 'r3243646', 'r3243647', 'w116404414', 'w116404421'];
export const YARD_GREEN = ['r12440712', 'r12440714', 'r12440715', 'r12440716'];   // NOT r3297999 / r3297996: those bank strips are mapped across the embankment carriageway (road integrity)
/** forecourts that should stay free of generic trees (rings [[x, z]..]): before the Baltic House portico, the Music Hall front, the Planetarium entrance. Pure data for environment/claims.js extraClaimRings (request in docs/research/petro-requests-landmarksKronverk.md) */
export const CLEAR_RINGS = [[[-2135.7,-2653.9],[-2124.2,-2630.6],[-2163.7,-2611.2],[-2175.1,-2634.5]],[[-2285.9,-2596.2],[-2272.6,-2569.3],[-2312.1,-2549.9],[-2325.3,-2576.8]],[[-2236.8,-2589.2],[-2228,-2571.2],[-2244.1,-2563.3],[-2252.9,-2581.2]]];

export const GROUPS_LIST = [
  { key: 'kronverk-arsenal', name: 'Кронверк: Артиллерийский музей (Арсенал)', nameEn: 'The Arsenal on the Kronverk = the Artillery Museum (P. Tamansky 1850-60): red-brick horseshoe, end pavilions with turrets, south wall with the crenellated main gate, sheds and stores',
    ids: ['r3243636', 'r3243635', 'r3243634', 'w116404529', 'w116404528', 'w530124263', 'w530124264'], osm: [], at: [-2081, -2360],
    note: 'arsenal r3243636; south enclosure r3243635 (wall parts r3243671 / r3243667, gate r3243670, sheds r3243688 / r3243687 / r3243685 / r3243686 are claimed with the parent); stores r3243634, w116404529; substation w116404528; booths w530124263 / w530124264' },
  { key: 'kronverk-display', name: 'Артиллерийский музей: открытая экспозиция', nameEn: 'Open-air display of the Artillery Museum: guns, self-propelled guns, rocket launchers, missiles on the court lawns and the embankment forecourt; Kalashnikov monument, bust of Grand Duke Mikhail Nikolaevich',
    ids: [], osm: [...COURT_GREEN, ...YARD_GREEN,
      'n5148652235', 'n8514862246', 'n8514862247', 'n8514862248', 'n8514862249', 'n8514862250', 'n8514862251', 'n8514862252', 'n8514862253', 'n8514862254', 'n8514862255', 'n8514862256',
      'n8514862240', 'n8514862241', 'n8514862242', 'n8441492118', 'r12440713', 'n8514862270', 'n8514862271',
      'n8514862316', 'n8514862317', 'n8514862318', 'n8514862319', 'n8514862320', 'n8514862321', 'n8514862322', 'n8514862323', 'n8514862324', 'n8514862325', 'n8514862326'],
    at: [-2066, -2330], note: 'the court / yard lawns (GREEN grass polygons: laid here with their rails, no generic trees between the exhibits); the OSM cannon / vehicle / statue nodes of the forecourt, the west lawn and the east yard' },
  { key: 'alexander-park', name: 'Александровский парк: памятники, Артиллерийские мосты, грот, Ортопедический институт', nameEn: 'Alexander Park sights: Decembrists obelisk, East / West Artillery bridges, Steregushchy monument, grotto and pool, bronze mini-city, the Architects, apostle Peter, Orthopaedic Institute with the Madonna panel',
    ids: ['w189064849', 'w30325379'], osm: ['n1579387418', 'r3298017', 'r3298018', 'n339816778', 'w917167807', 'w917167810', 'w609619503', 'n1559808836', 'n1559808835', 'n5144166464'], at: [-1853, -2343],
    note: 'obelisk n1579387418; bridge decks r3298017 (East) / r3298018 (West): vault, parapets, walk decks (the roadway stays with streets); Steregushchy n339816778 + its steps; grotto w189064849 + pool w609619503; statues n1559808836 / n1559808835; institute w30325379 + chimney n5144166464. The park lawns, trees, alleys, benches and lamps stay generic' },
  { key: 'gorkovskaya-pavilion', name: 'Вестибюль станции метро «Горьковская»', nameEn: 'Gorkovskaya metro pavilion (2009, the flying saucer): stylobate, glazed drum, bronze-brown disc', ids: ['w85416499'], osm: [], at: [-1818, -2643],
    note: 'circle w85416499 (r 23.3 m); closed drum: the metro module adds the entrance (services.landmarksKronverk.metro gives the doors)' },
  { key: 'narodny-dom', name: 'Народный дом: Балтийский дом, Планетарий, Мюзик-холл, Великан Парк', nameEn: 'Narodny Dom row: Baltic House (portico, attic arch), Planetarium (Iron Hall wing with the observatory dome), Music Hall (three arches, corner pavilions, dome, stage box), Velikan Park',
    ids: ['r3555515', 'r3555519', 'r3555518', 'w203600211'], osm: [], at: [-2212, -2558],
    note: 'r3555519 = Baltic House r3555514 + Planetarium wing r3555516; r3555515 = Music Hall body r18097683 + link r3555521 + porch r18097684 + the stage block (rest of the outline); service wing r3555518; cinema w203600211' },
  { key: 'zoo-entrance', name: 'Ленинградский зоопарк: входной павильон, ограды', nameEn: 'Leningrad Zoo entrance pavilion (piers, ticket windows, lions, wordmark with the bear), house 1A, picket fences of the zoo and of the museum territory',
    ids: ['r3296319', 'r3296318'], osm: ['w916761500', 'w916761501', 'w135306252', 'w135306251', 'w135306250', 'w310701122', 'w135844803'], at: [-2370, -2346],
    note: 'pavilion r3296319, house r3296318; fence ways (barrier=fence) of the zoo (w310701122, w135844803) and of the Kronverk (w916761500 / w916761501 east yard, w135306252 / w135306251 west lawn, w135306250 island perimeter)' },
];
