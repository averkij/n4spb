// landmarksVladimir/groups.js - the layout.GROUPS sub-groups of module landmarksVladimir (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws.
// Everything listed here is DRAWN by landmarksVladimir (docs/research/vladimir.md).  The garden round the cathedral (Uspensky skver r3110173), the quays, the bridges and the ordinary houses are NOT claimed.
export const GROUPS_LIST = [
  { key: 'vladimir-cathedral', name: 'Князь-Владимирский собор', nameEn: 'Prince Vladimir Cathedral (Rinaldi / Starov, 1766-89): five silver domes, three-tier bell tower 57.5 m', ids: ['w109067002'],
    osm: [], at: [-3123.5, -2147.1],
    note: 'outline w109067002 (hidden) + its 8 parts (body w496995662, five drums w116531034 / 38 / 40 / 47 / 48, tower w496995661 / w496995660): the parts are claimed with the parent' },
  { key: 'vladimir-chapel', name: 'Часовня Александра Невского', nameEn: 'Chapel of St Alexander Nevsky of the cathedral (N. N. Kovrigin, 1882-86) on the corner of Bolshoy pr. P.S.', ids: ['w117478061'],
    osm: ['w753042753'], at: [-3377.3, -2234.6], note: 'chapel kiosk w117478061; the iron fence of the cathedral enclosure w753042753 (gates n7036256979 / 80 / 81) is drawn by fence.js' },
  { key: 'vladimir-judicial-quarter', name: 'Судебный квартал (стройплощадка)', nameEn: 'Judicial quarter building site (Dance Palace, Judicial Department, housing, Supreme Court, the yard): state of 2026',
    ids: ['w30352230', 'w1390919082', 'w1390919083', 'w1513983337', 'w1390919084'], osm: [], at: [-3020, -1810],
    note: 'the five OSM building=construction PLOTS (not footprints): the real volumes, the blue site fence, the cranes and the builders yard are laid out inside them by quarter.js' },
  { key: 'vladimir-tuchkov-buyan', name: 'Тучков буян', nameEn: 'Tuchkov Buyan hemp warehouses (Dyakov / Dedenev / Rinaldi, 1763-72): two blocks and the weigh-house pavilion', ids: ['w30352025'],
    osm: [], at: [-3398.6, -1848.3], note: 'footprint w30352025 (both L blocks, the pavilion, the gallery links)' },
  { key: 'vladimir-yubileyny', name: 'Дворец спорта «Юбилейный»', nameEn: 'Yubileyny Sports Palace (1967): the 94 m finned drum, the small arena, the annex', ids: ['r2277233'],
    osm: [], at: [-3312.5, -1989.5], note: 'relation r2277233 (hidden outline) with parts r2277231 (hall), w1042578477 (roof ring), r2277234 (small arena), r2277235 (annex): claimed with the parent' },
  // 'vladimir-petrovsky' (r9073800, r2270942, r4588176, r4587232) moved to landmarksPetrovskyStadium/groups.js on 2026-10-13 (islands round 2): stadium.js builds nothing any more.
];
