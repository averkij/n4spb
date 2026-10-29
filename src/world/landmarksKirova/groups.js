// landmarksKirova/groups.js - the layout.GROUPS sub-groups of module landmarksKirova (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/kirova.md section 12).
// A part of the module is built only when its key is listed here (landmarksKirova.js PARTS): flip a claim on together with its part.
// NOT claimed on purpose: Sobchak Square w638355427 (the car park: bays and aisles stay with streets), the parking polygons, the DK pavement, the skver w53348052 (Bolshoy boulevard), the footways outside the garden ring,
// w53344663 (that is the Semenov-Tyan-Shansky skver, not the palace), the transformer w65623777 and the hospital annex w45966115 (generic boxes are fine).
export const GROUPS_LIST = [
  { key: 'kirova-dk', name: 'Дворец культуры им. С. М. Кирова', nameEn: 'Kirov Palace of Culture (outline of 35 vertices + the horseshoe cinema + the courtyard annex)',
    ids: ['w45966107', 'w65623799', 'w65623790'], osm: [], at: [-5444, -153], note: 'outline w45966107 (drawn as a partition into boxes in frame FD), the cinema w65623799 and the annex w65623790 (rings)' },
  { key: 'kirova-erarta', name: 'Музей современного искусства «Эрарта»', nameEn: 'Erarta museum (building, portico, portal, stair, Era and Arta)',
    ids: ['w45966528'], osm: ['n800277882', 'n800277191', 'n6285032864', 'w671154995', 'w671154996', 'w671154997'], at: [-5593, 38], note: 'building w45966528 (frame FE), Era / Arta and Potenza’s Mir v kreste (ermir.js), three foreyard lawn strips with authored larch rows; no duplicate generic sculpture' },
  { key: 'kirova-garden', name: 'Сад «Василеостровец»', nameEn: 'Vasileostrovets garden (fence, south gate, lawns with thuja and hedges, flower beds, playground, court, toilet cabin, ruin patch, Roerich monument and plaza, benches, lamps)',
    ids: ['w65623809', 'w1423396925'], at: [-5273, -221],
    osm: ['w28473627', 'w65623784', 'w65623798', 'w1347749320', 'w1347749321', 'w65623813', 'w65623751', 'n5611461009', 'n5153880821'],
    note: 'the park polygon w28473627 is claimed (its trees are planted by gardentrees.js, the lawn ground class stays; the alleys are OSM footways that streets still draws); claimed and drawn here: the two long lawns, the two flower beds, the playground (+ node), the court, the toilet cabin w65623809, the ruin w1423396925, the Roerich node; the fence, gates, plaza, benches and lamps are new objects' },
  { key: 'kirova-sobchak', name: 'Памятник А. А. Собчаку', nameEn: 'Sobchak monument (bronze half figure on a granite pedestal, clinker platform)',
    ids: [], osm: ['n793463299'], at: [-5297, 66], note: 'the memorial node; the skver polygon w53348052 stays generic' },
];

// Ground that this module paves (world metres [x, z] rings, pure data): see docs/research/vo-requests-landmarksKirova.md.
// 1) the slab pavement in front of the Palace (dkpave.js: PAVE_FD, the wall line of the front to the pavement of streets at q -42.4 of frame FD; environment claims: no grass tufts / trunks on it).
export const PAVED_RINGS = [
  [[-5493.8, -80.9], [-5438.5, -113.6], [-5436.9, -110.9], [-5422.1, -119.7], [-5423.8, -122.6], [-5384.1, -146], [-5382.4, -143.1], [-5341.8, -167.1], [-5339.5, -163.2], [-5323.8, -172.5], [-5326, -176.3], [-5319.8, -180], [-5316.1, -174.3], [-5489, -72.1]],
  // 2) the courtyard of the Palace (dkyard.js YARD_FD: asphalt, worn paths and grass patches as decals; the module plants its own young trees)
  [[-5490.4, -111.8], [-5394, -168.8], [-5443.3, -252.3], [-5539.7, -195.4]],
  // 3) the pale concrete apron of the Erarta stair and the paved gap between the first and the second lawn strip (erplaza.js PLAZA_FE, frame FE q' -9.6 .. 9.6, r' 6.6 .. 24.3)
  [[-5572.3, 28.8], [-5581.8, 12.1], [-5577.3, 9.5], [-5575.8, 12.1], [-5565, 5.9], [-5558.6, 17.1], [-5569.4, 23.3], [-5567.8, 26.2]],
];
