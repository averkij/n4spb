// landmarksAurora/groups.js - the layout.GROUPS sub-groups of module landmarksAurora (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws (docs/research/aurora.md).
export const GROUPS_LIST = [
  { key: 'aurora-ship', name: 'Крейсер «Аврора»', nameEn: 'Cruiser Aurora at Petrogradskaya embankment (with the gangway pier and the ticket pavilion)', ids: ['r3272566', 'w486091825'],
    osm: ['w518595697'], at: [-753, -2562], note: 'r3272566 the ship (its building:part records are claimed with it), w486091825 the ticket / turnstile pavilion on the quay platform, w518595697 the gangway (OSM pier)' },
  { key: 'aurora-school', name: 'Нахимовское военно-морское училище', nameEn: 'Nakhimov Naval School (the Peter the Great City School House, 1909-12)', ids: ['w28712204'],
    osm: [], at: [-852, -2585], note: 'w28712204 the historic house, Petrogradskaya emb. 2-4; the 2018 campus block r11169679 stays with city' },
  { key: 'aurora-cabin', name: 'Домик Петра I', nameEn: 'Cabin of Peter the Great: the brick case pavilion of 1844 and its ticket booth', ids: ['w28712275', 'w1229214445'],
    osm: [], at: [-1142, -2326], note: 'w28712275 the case, w1229214445 the booth; the fences w1229214446 / w28712277, the bust n1558527389 and the Shi-Tsza lions n4515911157 / n4515911158 are drawn by the module too (nobody else draws barriers / these monuments); the garden GREEN w28712277 stays with environment' },
];
