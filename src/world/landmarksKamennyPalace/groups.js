// landmarksKamennyPalace/groups.js - the layout.GROUPS sub-groups of module landmarksKamennyPalace (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (dossier docs/research/kamenny-2026.md section 8 entry 1, 10).
// NOT claimed on purpose: the constructivist blocks w28055970 / w28055974, the substation w366043942, the college w23349923, the unknown "roof" r10254210 (generic), the garden lawns / trees / paths, the roads and
// the embankment road w722921712.  The guardhouse w28055975 (+ its tourist node n8072558417) and the orangery w60962405 ARE drawn here: the lead assigned them to this module, although the dossier critic planned them for a landmarksKamennyAvenue that is not registered.
const ON = ['kamenny-palace', 'kamenny-fence', 'kamenny-service', 'kamenny-garden'];

const ALL = [
  { key: 'kamenny-palace', name: 'Каменноостровский дворец', nameEn: 'Kamennoostrovsky Palace: river colonnade, court portico, wings, roofs',
    ids: ['w28055973'], osm: ['n5278196916'], at: [-2611, -5284],
    note: 'footprint w28055973 (2119 m2); the school POI n5278196916 is a node of the same building' },
  { key: 'kamenny-fence', name: 'Ограда Каменноостровского дворца', nameEn: 'Palace garden fence, parade gate, church gate, checkpoint gates and gate house, yard wall',
    ids: [], osm: ['w741702601', 'w128092321', 'w471360112', 'w546166966', 'w741702583', 'w741702584', 'w471360105', 'w741702582', 'n6066398208', 'n814049729', 'n539610147', 'n2753916822'], at: [-2840, -5330],
    note: 'the garden is closed: the fence is drawn along the mapped walls and the OSM garden ring r10254219 (w128092322, the church plot fence, is the church module claim: the iron fence follows its line, the church module draws only its own chain fence on the west side)' },
  { key: 'kamenny-service', name: 'Кухонный корпус и манеж, дом садовника', nameEn: 'Kitchen block + riding hall, gardener house, service shed',
    ids: ['r10254212', 'w28055968', 'w28055969', 'w28055975', 'w60962405'], osm: ['n8072558417'], at: [-2752, -5277],
    note: 'r10254212 (outer ways w28055971 + w741702585) 179 m long two-storey block; w28055968 probably the gardener house of photo P17 [?]; w28055969 lit. D a plain shed [?]' },
  { key: 'kamenny-garden', name: 'Скамейки парка дворца', nameEn: 'Benches of the palace garden (45 OSM nodes), lamps',
    ids: [], osm: ["n6033036287","n6033036288","n6033026478","n6033026479","n6033026480","n6033026481","n6033026482","n6033026483","n6033026484","n6033036285","n6033036286","n6033036289","n6033036290","n6033036291","n6033036292","n6033036293","n6033036294","n6033036295","n6033036296","n6033036297","n6033036298","n6033036299","n6033036300","n6033036301","n6033036302","n6033036303","n6033036304","n6033036306","n6033036307","n6033036308","n6033036309","n6033036310","n6033036311","n6033036312","n6033036313","n6033036314","n6033036315","n6033036316","n6033036317","n6033036318","n6033036319","n6033036320","n6033036321","n6033036322","n6780790962"], at: [-2700, -5340], note: 'the white slatted benches with cast ends inside the closed garden (props draws them; the lamps are not mapped)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));
