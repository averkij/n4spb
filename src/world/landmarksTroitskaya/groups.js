// landmarksTroitskaya/groups.js - the layout.GROUPS sub-groups of module landmarksTroitskaya (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws (docs/research/troitskaya.md section 1).
// A part of the module is built only when its key is listed here (landmarksTroitskaya.js PARTS): flip a claim on together with its part.
export const PARK_ID = 'r13492538';                                  // Троицко-Петровский сквер: the AREA (hw square) and the GREEN park polygon share this id
/** the 39 lawns (GREEN grass polygons) inside the garden */
export const GARDEN_GREEN = [
  'w916838684', 'w916838685', 'w916838686', 'w916838687', 'w916838688', 'w916838689', 'w916838690', 'w1007404453', 'w1007404454', 'w1007404455', 'w1007404472', 'w1007404473', 'w1007404483',
  'w1007404484', 'w1007404542', 'w1007404550', 'w1007404551', 'w1007404552', 'w1007404553', 'w1007404554', 'w1007404555', 'w1007404560', 'w1007404565', 'w1007404570', 'w1007404571', 'r13492532',
  'r13492533', 'r13492534', 'r13492535', 'r13492537', 'r13492539', 'r13492542', 'r13492553', 'r13492554', 'r13492555', 'r13492556', 'r13495015', 'r13495017', 'r13495016',
];

export const GROUPS_LIST = [
  { key: 'mosque', name: 'Соборная мечеть', nameEn: 'Saint Petersburg Cathedral Mosque (Vasilyev, 1909-20): ribbed turquoise dome, two minarets, majolica portals, the fence', ids: ['w28712430'],
    osm: ['w753042748', 'w1120136547', 'w1120136546', 'w85427337'], at: [-1527.5, -2530.7],
    note: 'body w28712430 (parts: dome w200396163, minarets w200396162 / w200396164 are claimed with the parent); precinct landuse w753042748; fences w1120136547 / w1120136546; the yard wall w85427337' },
  { key: 'kshesinskaya', name: 'Особняк Кшесинской (Музей политической истории России)', nameEn: 'Kshesinskaya mansion (von Gogen, 1904-06) with the Brant mansion and the 1957 link: the Museum of Political History', ids: ['w43679385'],
    osm: ['w85426960', 'w85427333', 'w85427334', 'w85427335', 'n10245075680'], at: [-1485, -2445],
    note: 'one museum footprint w43679385 (turret part w832372334 claimed with the parent); fences w85426960 (Kronverksky), w85427334 (court gate), wall w85427333 (Kuybysheva), w85427335; the garden fountain n10245075680' },
  { key: 'troitskaya-garden', name: 'Троицкая площадь: сквер, часовня Троицы, Соловецкий камень', nameEn: 'Troitskaya Square garden (grit alleys, lawns, hedges, benches, lamps, limes), the Trinity chapel (2003), the Solovetsky stone (2002)',
    ids: ['w116398370'], osm: [PARK_ID, ...GARDEN_GREEN, 'n973767127'], at: [-1442.8, -2296.5],
    note: 'area + park r13492538 (the generic paving / footway ribbons / lawns / trees leave it), its 39 grass polygons, the chapel w116398370 (parts w116398368, w712698043..47 claimed with the parent), the memorial stone n973767127; the 52 hedges, 46 benches, 39 lamps of the garden are drawn from BARRIERS / FURNITURE / LAMPS (nobody else draws them)' },
  { key: 'political-prisoners', name: 'Дом политкаторжан', nameEn: 'House of Political Prisoners (Simonov, Abrosimov, Khryakov, 1929-33): constructivist ribbon with the stair block, Troitskaya pl. 1', ids: ['w28712329'],
    osm: [], at: [-1281, -2266], note: 'footprint w28712329; the part "houses" of the module is built when this key is present' },
  { key: 'lenproekt', name: 'Дом Ленпроекта (Троицкая пл., 3)', nameEn: 'Lenproekt house, Troitskaya pl. 3: yellow, giant order of square pillars toward the square', ids: ['w28712286'], osm: [], at: [-1330, -2338],
    note: 'footprint w28712286 (OSM says 3 levels: really ~29 m)' },
  { key: 'frame-houses', name: 'Дома, обрамляющие площадь: ул. Куйбышева, 1 / Троицкая пл., 5 и Каменноостровский пр., 2', nameEn: 'the two Stalinist houses that frame the sight: the yellow giant-order house NE of the garden, the concave house behind the Gorky monument',
    ids: ['w28712450', 'r3419581'], osm: [], at: [-1361, -2425], note: 'window sheets on the OSM footprints, cornice, balustrade parapet (houses.js stalinBlock)' },
  { key: 'lidval', name: 'Доходный дом Лидваль (Каменноостровский пр., 1-3)', nameEn: 'Lidval house (F. Lidval, 1899-1904): three wings round the cour d\'honneur, the fence with lantern pylons', ids: ['r1273188', 'r21135361'],
    osm: ['w186087236'], at: [-1711, -2742], note: 'relation r1273188 (74 vertices, one hole) + the coach house r21135361; the frontage fence w186087236 with its two gates' },
  { key: 'gorky', name: 'Памятник М. Горькому', nameEn: 'Gorky monument (1968) at the head of Kamennoostrovsky pr.', ids: [], osm: ['n1029463448'], at: [-1757.5, -2711.3],
    note: 'statue node n1029463448 on the island of Kronverksky pr.; the lawn r7633124 of the island stays with the environment' },
];
