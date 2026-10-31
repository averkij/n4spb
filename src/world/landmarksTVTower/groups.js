// landmarksTVTower/groups.js - claims of the Leningrad TV tower.  The module draws the whole tower (feet, trunk, shaft, lantern, mast, spire) from its own numbers, so the generic city stops
// drawing the hexagon prism (w49489011, 21 m) and its three 3D-parts that OSM carries as separate buildings (w192468854 spire 310..326 m, w192468855 shaft + mast 0..310 m, w192468856 lantern
// 185..201 m): they are the children of w49489011 and are claimed with it (`layout.js`: ids.has(b.id) || ids.has(b.parent)).  environment/far.js skips its own far mast while this list is non-empty.
// NOT claimed: the technical building w28735064 (2 128 m2 office block west and south of the tower: generic blockout + facade shader, nothing photographed).
export const GROUPS_LIST = [
  { key: 'tv-tower', name: 'Ленинградская телебашня', nameEn: 'Leningrad TV tower', ids: ['w49489011'], osm: [],
    at: [-1696, -4916],
    note: 'Steel lattice trunk (three pyramids, six legs, five walkway rings), red-white concrete shaft, hexagonal three-level lantern at 185-201 m, 126 m antenna mast and spire to 326 m; fenced territory.' },
];
