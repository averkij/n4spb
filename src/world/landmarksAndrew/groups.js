// landmarksAndrew/groups.js - the layout.GROUPS sub-groups of module landmarksAndrew (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/andrew.md section 10).
// A part of the module is built only when its key is listed here (landmarksAndrew.js PARTS): a claim is flipped on together with its part.
export const GROUPS_LIST = [
  { key: 'andrew-cathedral', name: 'Андреевский собор', nameEn: "St Andrew's Cathedral (1764-86), the Three Hierarchs church, the chapel of St Vladimir, the order obelisk, the Golovin bust, the precinct fence and court",
    ids: ['w84046074', 'w84046107', 'w84045806'], osm: ['n968499248', 'n968189055', 'w1164701388', 'w1060057882', 'w84055332'], at: [-3802.7, -820.6],
    note: 'cathedral w84046074 (46 x 28.5 m, 38 vertices) + Three Hierarchs w84046107 + the chapel w84045806 + the obelisk and the bust nodes: drawn by the module with the fences, the brick court and the lamps' },
  { key: 'andrew-market', name: 'Андреевский рынок', nameEn: 'Andreevsky Market (1789-90): the arcaded two-storey ring with the red hipped roof and the dormers', ids: ['r1198837'], osm: [], at: [-3713.3, -679.3],
    note: 'r1198837 (150.8 x 58.7 m ring + courtyard hole): drawn by the module (arcade, windows, roof, dormers, roof wordmark)' },
  { key: 'andrew-boulevard', name: 'Андреевский бульвар', nameEn: 'Andreevsky boulevard (6th-7th lines, pedestrian zone): promenades, lawn strip with larches, fountains, Korchmin, the horse tram',
    ids: [], at: [-3944, -976],
    osm: ['n951472000', 'n1352801081', 'w214409234', 'w214409235', 'w214409237', 'w80166943', 'w80166918',
      'w214409218', 'w532429067', 'w80166854', 'w214409222', 'w214409221', 'w214409224', 'w214409217', 'w415485777', 'w214409225', 'w214409226', 'w214409220', 'w214409214', 'w214409216', 'w214409231', 'w214409212', 'w214409211', 'w214409228',
      'w481467809', 'w80166810', 'w481467786', 'w481467807', 'w481467811', 'w481467879', 'w481467777', 'w481467878', 'w481467861', 'w1318348711', 'w481467853',
      // review (2026-10-08): four more footways that lie inside the paved strip (the generic ribbons drew paving-stone bands over the module's slabs)
      'w84055331', 'w84055337', 'w84055338', 'w440186053'],
    note: 'Korchmin + the horse tram + the lawn strip (larches) + two fountains + the two pedestrian ways and the footways inside the strip: the module paves the 28 m street between the facades' },
  { key: 'andrew-pavilion', name: 'Станция метро «Василеостровская» (вестибюль)', nameEn: 'Vasileostrovskaya metro pavilion (1967): the stone-and-glass box on 11 granite steps under a deep canopy', ids: ['w183122885'],
    // review (2026-10-08): the metro-door footways inside the pavilion square (the generic asphalt ribbons drew dark strips over the granite slabs: w123598458 / w453130426 ...) and the old step stub
    osm: ['w453130435', 'w123598458', 'w453130426', 'w453130427', 'w453130436', 'w453130424', 'w453130425', 'w123598457'], at: [-4084.3, -1132.1],
    note: 'w183122885: the module draws the shell, the canopy, the steps and the pavilion square; the metro owner keeps the interior and the entrances (n2045866983 / n2045866996 stay ENTRANCES)' },
  { key: 'andrew-pel', name: 'Дом Пеля и Башня грифонов', nameEn: 'Pel house (1907-10) with the Griffins (Digit) Tower in its yard', ids: ['r1193123'], osm: ['n951709427'], at: [-3789.7, -631.1],
    note: 'r1193123 (3070 m2 ring, two light wells) + the yard tower node: drawn by the module (brick bays, mansard, turrets, portal, tower)' },
  { key: 'andrew-annunciation', name: 'Благовещенская церковь и сад', nameEn: 'Annunciation Church (1750-62, belfry 42 m), the forecourt, the Blagoveshchensky garden, the chapel of 1899 and the playground', ids: ['w108116443', 'r1443035'], osm: ['r1443040', 'w216964558', 'w397705457'], at: [-4299.0, -1496.7],
    note: 'church + chapel of 1899 + the garden (the module draws lawn, alleys, trees, lamps) + the playground + the fences with gate pavilions + the forecourt paving' },
];

// Ground that this module paves (world metres rings, pure data): environment/claims.js keeps grass tufts, trunks and hedges off it while the module is in the build list.
export const PAVED_RINGS = [
  // the cathedral precinct court (herringbone clinker): the Three Hierarchs yard, the north strip, the west court in front of the belfry, the south strip in front of the S portal
  [[-3856, -866.1], [-3817.5, -888.3], [-3790.1, -842], [-3783, -829.7], [-3788.2, -813.4], [-3786.2, -810], [-3807.8, -797.6], [-3807, -796.1], [-3811.7, -790.4], [-3814.9, -785.8], [-3837.4, -824.8], [-3833.4, -827.4], [-3837.3, -833.8]],
  // the granite-sett apron of the order obelisk
  [[-3811.1, -768.5], [-3811.7, -766.3], [-3813.3, -764.7], [-3815.5, -764.1], [-3817.7, -764.7], [-3819.3, -766.3], [-3819.9, -768.5], [-3819.3, -770.7], [-3817.7, -772.3], [-3815.5, -772.9], [-3813.3, -772.3], [-3811.7, -770.7]],
  // the Andreevsky boulevard between the facades (q -5.5 .. 22.3, s 0 .. 475.5): promenades, cross paths, the alley and the plazas
  [[-4069.8,-1176.2],[-4045.7,-1190.2],[-3806.5,-779.3],[-3830.5,-765.3]],
  // the pavilion square (granite slabs between the metro pavilion and the first houses of the boulevard)
  [[-4115.1,-1149.8],[-4069.8,-1176.2],[-4034.5,-1115.7],[-4079.9,-1089.3]],
  // the paved pocket of the Korchmin monument (the mouth of the 7th-line recess)
  [[-3953.5,-976.6],[-3956.8,-974.7],[-3959.1,-970.8],[-3959.3,-965.1],[-3954.3,-962.5],[-3949.8,-962.6],[-3946.5,-964.5]],
  // the Annunciation forecourt (granite setts) from the 8th-line gate to the belfry portal
  [[-4395.7,-1466.3],[-4335.1,-1501.3],[-4315,-1466.4],[-4338.1,-1452.9],[-4344.6,-1464.3],[-4382.3,-1443]],
];
