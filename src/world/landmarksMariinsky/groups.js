// landmarksMariinsky/groups.js - the layout.GROUPS sub-groups of module landmarksMariinsky (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
// Everything listed here is DRAWN by landmarksMariinsky (docs/research/mariinsky.md): the Mariinsky Theatre (Cavos 1860) with its portico, drum and stage house; the St Petersburg Conservatory;
// the Teatralnaya Square gardens (the two lawns, gravel paths, hedges, beds, fences, lamps, benches, trees) with the Glinka and Rimsky-Korsakov monuments; the covered skybridge over the Kryukov canal;
// the 2013 Mariinsky-II.  The ordinary houses round the square (Teatralnaya 2-18, Glinka, Kryukov canal embankment, Dekabristov) are NOT claimed: the city module draws them (docs/research/mariinsky-houses.json).
export const GROUPS_LIST = [
  { key: 'mariinsky-theatre', name: 'Мариинский театр', nameEn: 'Mariinsky Theatre (A. Cavos 1860): mint-green and white, five-bay Corinthian portico with two avant-corps, glass canopy, auditorium drum, stage house', ids: ['r1690283'],
    osm: [], at: [-3058, 736],
    note: 'relation r1690283 (57-vertex outer ring + 2 light wells, 6 parts r3170454..59 are claimed with the parent); the portico facade is the 22.8 m edge (-3053.6,746.6)-(-3063,725.9)' },
  { key: 'mariinsky-conservatory', name: 'Консерватория имени Римского-Корсакова', nameEn: 'St Petersburg Conservatory (V. Nicolas 1896): cream-yellow, four-column Ionic portico on the north front, the Great Hall arcades, balustrades', ids: ['r1083410'],
    osm: [], at: [-2975, 715],
    note: 'r1083410 (Театральная пл., 3; the OSM university relation r7595285 shares its outer way w68926324); the monuments are separate sub-group' },
  { key: 'teatralnaya-gardens', name: 'Сады Театральной площади и памятники Глинке и Римскому-Корсакову', nameEn: 'Teatralnaya Square gardens with the Glinka (1906) and Rimsky-Korsakov (1952) monuments, the Art Nouveau pavilion', ids: ['w68926317', 'w68926308'],
    osm: ['n1244913802', 'n1244913803', 'w743381941', 'w1287359790', 'r3110157', 'w102589009', 'w102589010', 'w102589016', 'w532005672', 'w743381938', 'w743381939', 'w743381940'], at: [-2990, 700],
    note: 'monument nodes, the lawn bits and the all-garden park r3110157 (south garden), the gravel footways of both gardens (the asphalt sidewalks stay with streets), the pavilions Театральная пл. 5 and 7' },
  { key: 'mariinsky-skybridge', name: 'Переход между театрами', nameEn: 'Covered pedestrian skybridge over the Kryukov canal between the Mariinsky and the Mariinsky-II', ids: ['w220183360'],
    osm: [], at: [-3127, 822],
    note: 'building=bridge w220183360, 2 levels from level 1, flat; deck about 6 m above the street' },
  { key: 'mariinsky-two', name: 'Мариинский-2', nameEn: 'Mariinsky-II (Diamond Schmitt 2013): beige limestone body, glass foyer box, glazed roof canopy', ids: ['w182876241'],
    osm: [], at: [-3189, 806],
    note: 'w182876241 (11 389 m2, OSM height 19 m, photo scale 24 m); the arcaded yellow historic wing at its canal front is part of the same record' },
];
