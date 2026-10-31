// landmarksYelaginPalace/groups.js - the layout.GROUPS sub-groups of module landmarksYelaginPalace (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (dossier docs/research/yelagin-palace-2026.md section 10).
// NOT claimed on purpose: the Kitchen block and its statues (landmarksYelaginKitchen), the Stable / Orangery / service houses (landmarksYelaginServices), the footways w98992769 / w98992770 / w717881699 that lead on to
// the ramps (they stay with streets: the ramps draw their own cobbles over the first metres), the Oil Meadow, the trees.
const ON = ['yelagin-palace'];

const ALL = [
  { key: 'yelagin-palace', name: 'Елагин дворец', nameEn: 'Yelagin Palace (Rossi 1818-22): west and east fronts, rotunda, attic and dome, west terrace with the granite stair, the cast-iron lions and the two carriage ramps, east stair with the marble vases',
    ids: ['w717881701', 'w173206736'], osm: ['n3761709952', 'n3761709953', 'w181425608', 'w372618032', 'w372618033', 'w1218272263', 'n6750356708', 'n6750344129', 'n13202125789'], at: [-4552, -5226],
    note: 'footprint w717881701 (the attic part w738578593 follows through the parent id); w173206736 is the TERRACE with its two ramps, not a building (dossier KNOWN ERRORS 7 and 12); the lion nodes, the stair step ways (drawn as flat strips by streets) and the two mapped park gates are drawn by the module; the Trdelnik kiosk n13202125789 (a commercial vendor on the terrace) is dropped' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js SIGHTS lists the modules that may export these; the lead adds landmarksYelaginPalace there): ground the module paves itself, so that the generic
// environment plants no trunks, hedges, beds or grass tufts there.  Rings are world metres (x, z) read from frame.js (the podium floor polygon FLOOR, the two ramps, the aprons at the stair feet).
export const PAVED_RINGS = [
  { id: 'palace-podium', ring: [-4523.8, -5251.8, -4563.7, -5251.8, -4562.8, -5250.7, -4561.1, -5247.1, -4559.2, -5242.8, -4564.4, -5240.5, -4564.5, -5236.7, -4567.5, -5236.7, -4567.5, -5235.2, -4565.6, -5235.2, -4565.6, -5216.5, -4567.5, -5216.5, -4567.5, -5215, -4564.5, -5215, -4564.6, -5211.8, -4561, -5209.7, -4562.2, -5206.9, -4563.9, -5204.1, -4565.7, -5201.4, -4566.9, -5199.8, -4523.8, -5199.8, -4523.8, -5215.8, -4523.8, -5235.8] },
  { id: 'ramp-north', ring: [-4559.2, -5242.8, -4561.1, -5247.1, -4562.8, -5250.7, -4564.6, -5253.4, -4566.3, -5255.8, -4568.2, -5257.9, -4570.6, -5260.5, -4574.5, -5264.1, -4576.1, -5262.4, -4577.5, -5261, -4574.1, -5257.4, -4571, -5254.2, -4568.6, -5251.1, -4566.5, -5247.5, -4564.9, -5244.1, -4564.4, -5240.5] },
  { id: 'ramp-south', ring: [-4561, -5209.7, -4562.2, -5206.9, -4563.9, -5204.1, -4565.7, -5201.4, -4567.6, -5199.3, -4571.2, -5195.5, -4574.7, -5193.1, -4579.8, -5189.9, -4581.2, -5192.2, -4582.8, -5194.7, -4578.4, -5197.7, -4574, -5201.2, -4570.7, -5204.9, -4565.7, -5212.8] },
  { id: 'stair-west-foot', ring: [-4573, -5234.3, -4577, -5234.3, -4577, -5217.3, -4573, -5217.3] },
  { id: 'stair-east-foot', ring: [-4515.6, -5238.2, -4512, -5238.2, -4512, -5213.5, -4515.6, -5213.5] },
  // the two OPEN LAWNS in front of the fronts (review 2026-10-13: from walking height the generic scatter planted park trees over the whole Oil Meadow and hid the palace; photos pal_01 / pal_03 / pal_05: a mown
  // lawn, trees only at its edge): a corridor 40-100 m wide west of the stair foot and one east of the rotunda stair stay free of generic trunks, hedges, beds and grass tufts (Kronverk CLEAR_RINGS do the same)
  { id: 'lawn-west', ring: [-4580, -5246, -4660, -5278, -4660, -5174, -4580, -5206] },
  { id: 'lawn-east', ring: [-4510, -5252, -4440, -5266, -4440, -5186, -4510, -5200] },
];
