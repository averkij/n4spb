// landmarksNikolsky/groups.js - the layout.GROUPS sub-groups of module landmarksNikolsky (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
// Everything listed here is DRAWN by landmarksNikolsky (docs/research/nikolsky.md section 8): St Nicholas Naval Cathedral (r3290873 + body r3290874), the bell tower (r3290835 + part r3290839), the white-pylon
// fence of the cathedral enclosure and the lattice fence of the garden, Nikolsky Garden (the park polygons: lawns, trees, gravel footways, benches, lamps, the two frog fountains, the Tsushima obelisk).
// Ordinary houses (clergy houses, church school, Vege house ...), the quays, the canals and the bridges are NOT claimed.  The generic ring road r34 (w123944596) and the service ways stay with streets.
export const GARDEN_GREEN = ['r3290836', 'r10573018', 'r10573021', 'r3290838'];
export const FOOT_IDS_LIST = [
  'w98727713', 'w123944590', 'w123944600', 'w123951921', 'w123951923', 'w123951926', 'w123951930', 'w123951931', 'w123956507', 'w147759135', 'w150944528', 'w150982891', 'w150993731', 'w150993732',
  'w151226988', 'w151226990', 'w151226991', 'w151226992', 'w171682147', 'w171689822', 'w790400771', 'w1106632794', 'w1237362403', 'w123951925', 'w123951929', 'w123956501', 'w123956503', 'w123956506',
  'w123956509', 'w464447893', 'w464447896', 'w464447897', 'w790400770', 'w1237470952', 'w1237470990', 'w1237471008',
];
export const FOOT_IDS = new Set(FOOT_IDS_LIST);

export const GROUPS_LIST = [
  { key: 'nikolsky-cathedral', name: 'Никольский Морской собор', nameEn: 'St Nicholas Naval Cathedral (Chevakinsky, 1753-62): five gold domes, giant order, the white-pylon fence of the enclosure', ids: ['r3290873', 'r3290874'],
    osm: ['w123944613', 'w123944616', 'w762486705', 'w243414863', 'w243414869', 'w243414868', 'w110055474'], at: [-2862, 1105],
    note: 'cathedral relation r3290873 (hidden outline) + body r3290874 (the drawn part, 22 m, mansard 6 m); fence runs w123944613 / w123944616 / w762486705 (r = 45 m circle + the 10.6 m avenue) and the small gate fences' },
  { key: 'nikolsky-bell-tower', name: 'Колокольня Никольского собора', nameEn: 'Bell tower of the cathedral (four tiers, 72 m, clock, gold domes) on the Kryukov Canal', ids: ['r3290835', 'r3290839'],
    osm: [], at: [-2958, 1147], note: 'tower relation r3290835 (hidden outline) + part r3290839; stands 105 m WSW of the dome on the cathedral axis' },
  { key: 'nikolsky-garden', name: 'Никольский сад', nameEn: 'Nikolsky Garden: lawns, lime / maple trees, gravel footways, benches, lamps, two frog fountains, Tsushima obelisk, lattice fence', ids: [],
    osm: [
      'r3290836', 'r10573018', 'r10573021', 'r3290838', 'r10573022', 'r10573023', 'r10982161', 'r10982162', 'w123951932', 'w123956499', 'n1380870522', 'w638333466',
      'w762486706', 'w1106632795', 'w1106632797', 'w1106632796', 'w1106632798',
      ...FOOT_IDS_LIST,
    ], at: [-2900, 1050],
    note: 'park r3290836 (0.725 ha, with the two fountain holes) + the east strip r10573018 + the skver r10573021 + the Chevakinsky boulevard r3290838 (generic lawns / woods / trees leave them); 36 footways of the garden; fences w762486706 (north / east edge), w1106632795 / 97 (west edge); the stele n1380870522; the square polygon w638333466 (the generic flush slab paving would lie coplanar under the lawns: the owner lays the surface)' },
];
