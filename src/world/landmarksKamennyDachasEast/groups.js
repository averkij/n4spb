// landmarksKamennyDachasEast/groups.js - the layout.GROUPS sub-groups of module landmarksKamennyDachasEast (pure data, no imports: layout.js merges them).  Claims are ON only for what the module draws
// (docs/research/kamenny-2026.md section 8 entry 5, the critic's plan; BUILD LOG at the end of the dossier):
//   * the Oldenburg dacha w31065816 (the rotunda house, exterior only) and its wing w31065814;
//   * the sphinx pier r10254206 (the stair, the cheek walls, the pedestals, the two sphinxes; its member ways w1176854551 w1176854552 w117112644 w741702561 come with the relation);
//   * the plot fences: the river front w640543965 (planks + the iron fence), the west side w741702547 and the north / east side w640543962 (green planks).
// NOT claimed: the inner fence w640543963 (no photo; the generic fence stays), the garages w31065815, the embankment road w1090523248 and the lawn / path ways (streets), the embankment ways w1176854550 / w1176854553
// (water owner), the benches n6034161440..43 and the trees (generic), the Oriental orangery w60962405 (landmarksKamennyPalace).
const ON = ['kamenny-oldenburg', 'kamenny-wing', 'kamenny-sphinx-pier', 'kamenny-dfence'];

const ALL = [
  { key: 'kamenny-oldenburg', name: 'Дача принца П. Г. Ольденбургского', nameEn: 'Oldenburg dacha (F. Shustov 1831-33): wooden square house with a rotunda dome and three six-column Doric porticoes (exterior only, under restoration)',
    ids: ['w31065816'], osm: [], at: [-2991.9, -5073.6], note: 'footprint w31065816 (22 vertices, 36 x 36 m): drawn from the ring and the photos O02 O05 O07 O10 O11; solid' },
  { key: 'kamenny-wing', name: 'Флигель дачи Ольденбургского', nameEn: 'Wing of the Oldenburg dacha: two-storey ochre stucco house with white pilaster strips and a hip roof',
    ids: ['w31065814'], osm: [], at: [-3041.5, -5105.5], note: 'footprint w31065814 (14.1 x 23.1 m); photo O09' },
  { key: 'kamenny-sphinx-pier', name: 'Пристань со сфинксами', nameEn: 'Sphinx pier: granite stair to the Malaya Nevka with two bronze sphinxes on granite pedestals',
    ids: [], osm: ['r10254206'], at: [-2960, -5030], note: 'relation r10254206 (10.7 x 9.4 m ring at the bank); photos S01..S04' },
  { key: 'kamenny-dfence', name: 'Ограда участка дачи Ольденбургского', nameEn: 'Plot fences of the Oldenburg dacha: green plank construction fence, iron spear fence in front of the river side',
    ids: [], osm: ['w640543965', 'w741702547', 'w640543962'], at: [-2996.5, -5040.4], note: 'river front w640543965 (125 m), west w741702547 (70 m), north / east w640543962 (200 m)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- HAND-OVER to environment (pure data; environment/owners.js reads it once this module is registered there and has claims; request 1 of docs/research/islands2-requests-landmarksKamennyDachasEast.md)
// WATER_RINGS: the stair pit of the sphinx pier.  The ring is the footprint of the flight with its cheek walls (|mx| <= 4.15 over mz 0 .. 6.2 of frame PR) widening to the pedestals (|mx| <= 5.3, mz 6.2 .. 10.0, the last
// 0.6 m lie on the water): the ground and the grass slope of the bank are removed inside it, the water surface lies under it, the module draws the steps (solid blocks from y -3.5 up to the treads),
// the cheek walls, the pedestals, the landing and its edge (pier.js).  World coordinates (frame PR: origin (-2962.2, -5033.85), +z = (0.447, 0.894), local x = ENE).
export const WATER_RINGS = [{ id: 'sphinx-pier', key: 'neva', ring: [[-2965.9, -5032.0], [-2958.5, -5035.7], [-2955.7, -5030.2], [-2954.7, -5030.7], [-2953.0, -5027.3], [-2962.5, -5022.5], [-2964.2, -5025.9], [-2963.1, -5026.4]] }];
// KEEP_OUT: no generated descent, landing stage or boat round the pier.
export const KEEP_OUT = [{ id: 'sphinx-pier', c: [-2960, -5029.4], r: 14 }];
