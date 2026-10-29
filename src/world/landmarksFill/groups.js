// landmarksFill/groups.js - the layout.GROUPS sub-groups of module landmarksFill (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
//   fill-construction   the land fill "Новый намыв острова Декабристов" (OSM landuse=construction + natural=sand, way w1053534560, 1.49 km2 in the Dekabristov cut): the module dresses its empty west part as a young
//                       district under construction. The polygon is claimed as the module's own ground; no generic module consumes a claimed landuse (the ground class `construction` of environment/field.js keeps
//                       applying: gravel / dirt), so the claim only documents the ownership and gives tools/landmarks-groups-check.mjs a record to verify.
// NO water ring, NO keep-out: nothing of the module touches the water (docs/gdm-D2.md); NO paved ring: the dressing paves nothing that grows trees (the ground is bare fill).
export const GROUPS_LIST = [
  { key: 'fill-construction', name: 'Новый намыв острова Декабристов', nameEn: 'New land fill of Dekabristov Island: a young district under construction (haul roads, site plots, cranes, container yards)',
    ids: [], osm: ['w1053534560'], at: [-8400, -3000],
    note: 'OSM landuse=construction polygon w1053534560; real OSM holds no building on its west part, the module dresses it (docs/gdm-D2.md): planned street roadbeds, site plots with frames and cranes, container yards, a batching plant, floodlight masts' },
];

/** the HUD polygon of the dressed part of the fill (the outline of the OSM polygon w1053534560 without its built east tail, x > -7760: the Morskaya Embankment quarter keeps the names of its streets); world metres, flat [x, z, ...] */
export const ZONE_RING = [
  -9285, -2564, -9180, -2921, -9139, -3020, -9075, -3107, -8976, -3195, -8853, -3251, -8047, -3507, -7890, -3544, -7762, -3554,
  -7749, -3142,
  -7786, -3110, -7808, -3078, -7841, -3009, -7872, -2943, -7888, -2949, -7903, -2909, -7957, -2790, -7949, -2781, -7989, -2646, -8064, -2407, -8105, -2247, -8154, -2263, -8178, -2214, -8273, -2211,
  -8474, -2276, -8602, -2313, -8929, -2418, -9045, -2489, -9037, -2511, -9120, -2611, -9147, -2614, -9197, -2611, -9258, -2549, -9286, -2555,
];
