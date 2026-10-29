// landmarksSmolensky/groups.js - the layout.GROUPS sub-groups of module landmarksSmolensky (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/smolensky.md section 15).
// A part of the module is built only when its key is listed here (landmarksSmolensky.js PARTS): flip a claim on together with its part.
// NOT claimed on purpose: the Kamskaya 14-26 church houses, the factory blocks east of the fence, the Beringa slabs (docs/research/smolensky-houses.json), the footways (streets draws them), the Smolenka bank polygon
// r1576084 and the Smolensky Bridge (water / bridges owners), the unclaimed LANDUSE garages r2736671 and the GREEN grassland r15700930 at the polygon edge.
export const GROUPS_LIST = [
  { key: 'smolensky-grounds', name: 'Смоленское православное кладбище: территория', nameEn: 'Smolensky Orthodox Cemetery: the grounds (forest, graves, fence, gates); the GREEN polygon stops the generic trees',
    ids: [], osm: ['r2736670', 'w203893164', 'w203893168', 'w201779490', 'w203893166', 'w453130760', 'w453130759', 'w1160929450', 'w1160929451', 'w312980908'], at: [-5730, -1231],
    note: 'GREEN r2736670 (kind cemetery, 540 647 m2, 33 vertices, the river-side edge 13..28 coincides with the Smolenka polygon): claiming it stops the generic ~2 250 lawn trees; the module plants the forest, the shrubs and the graves itself and draws the fence ways listed (the generic modules draw no OSM fences: documentation only)' },
  { key: 'smolensky-resurrection', name: 'Воскресенская церковь', nameEn: 'Church of the Resurrection of Christ (Demyanovsky 1901-04): red brick with white belts, octagon tower with a gilded crown',
    ids: ['w101396308'], osm: [], at: [-5494.7, -1574.3], note: 'outline w101396308 (baked height null -> the generic 21 m box); the real cross top is 45 m; the module draws the gallery, central block, naves, apses, tower and the two small domes' },
  { key: 'smolensky-gates', name: 'Святые ворота и богадельня (Л. И. Руска)', nameEn: 'Holy Gates with the almshouse of the cemetery (Rusca 1807-09): yellow stucco, barrel-vaulted passage, one-storey wings',
    ids: ['r4198201'], osm: [], at: [-5502.6, -1529.6], note: 'outline r4198201 (skip: parts r4198203 / 4 / 5 follow the parent id); baked 1-2 levels are wrong: the wings are one storey, the arch block has a stepped attic; the module draws the whole building once' },
  { key: 'smolensky-trinity', name: 'Троицкая часовня', nameEn: 'Trinity memorial chapel (2001): a white open pavilion with a lead-grey onion',
    ids: ['w1180085908'], osm: [], at: [-5599.3, -1386.4], note: 'the OSM record is a 1.4 x 1.4 m mapping stub (building=roof): the 2.6 m pavilion is drawn round it; the generic city drew it as a canopy' },
  { key: 'smolensky-church', name: 'Церковь Смоленской иконы Божией Матери · колокольня', nameEn: 'Church of the Smolensk Icon with the bell tower (A. A. Ivanov 1786-90): sky-blue walls, six-column portico, silver dome on a 14-bay drum, two-tier bell tower with a grey spire',
    ids: ['w30351796', 'w312980917'], osm: [], at: [-5616, -1523.6], note: 'outline w30351796 (baked h 9.9 is wrong: the tower is 36 m) and the church shop kiosk w312980917 (drawn by furniture.js); the portico step X 7.1..22.4 of the outline IS the portico block; the module draws walls, portico, windows, drum, dome, lantern and tower' },
  { key: 'smolensky-xenia', name: 'Часовня блаженной Ксении Петербургской', nameEn: "Chapel of St Xenia of Petersburg (1902, A. A. Vseslavin): pale-green hall, scaly dark tent, gilded onion",
    ids: ['w101398309'], osm: [], at: [-5585.8, -1325.2], note: 'outline 13.7 x 9.8 m (baked h 3.3 is wrong: the real chapel is 17 m); the module draws hall, annex, tent, plaza furniture and the pilgrims discs' },
];
