// landmarksMenshikov/groups.js - the layout.GROUPS sub-groups of module landmarksMenshikov (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/menshikov.md section 9).
// A part of the module is built only when its key is listed here (landmarksMenshikov.js PARTS): flip a claim on together with its part (ON below).
const ON = ['menshikov-palace', 'first-cadet-corps', 'rumyantsev-garden', 'rumyantsevsky-descent'];

const ALL = [
  { key: 'menshikov-palace', name: 'Меншиковский дворец', nameEn: 'Menshikov Palace (1710-27): the U-shaped house with the crowned risalits, the portico, the mansard, the railing, the hedge and the lawn strips',
    ids: ['w216655164'], osm: ['w216655350', 'w216655351', 'w1284290253', 'w1284290254', 'w767617581', 'w767617582', 'w767617583', 'w767617584', 'w767617588', 'w767617585', 'w767617586', 'w767617587', 'w767617589', 'w767617590', 'w767617591'], at: [-3098.8, -721.1],
    note: 'building w216655164 (22 vertices); fences w216655350 / 351 (street side, gates n2260468844 west = visitors, n2260468882 east = service) and w1284290253 / 54 (court north); footways w767617581 / 82 / 83 (the six steps) / 84 / 88 (brick and paving paths); the six lawn strips w767617585 / 86 / 87 / 89 / 90 / 91; the museum POI / cellar restaurant n4357813991 stays (gate nodes are not claimable)' },
  { key: 'first-cadet-corps', name: 'Здание Первого кадетского корпуса', nameEn: 'First Cadet Corps building, Kadetskaya line 1-3: the 427 m two-storey ribbon with the Ionic porticoes, the south block, the galleries beside the palace',
    ids: ['w28691170'], osm: [], at: [-3178.2, -819.4],
    note: 'ring w28691170 (56 vertices; the whole outline: R1 the Kadetskaya range, the south block R2, the spine, the east ranges and the two galleries); the clinic w28691194 (inner court) and the generator shed w28691177 stay generic' },
  { key: 'rumyantsev-garden', name: 'Румянцевский сад и обелиск «Румянцова победамъ»', nameEn: 'Rumyantsev Garden: the cast-iron fence, gravel alleys, the 21.3 m obelisk, two fountains, the busts of Surikov and Repin, the music pavilion, 20 benches, limes and oaks',
    ids: ['r3277182', 'w216731109'],
    osm: ['r3277181', 'w11399921', 'w84045811', 'w84045881', 'n1271445526', 'n2260468762', 'n2260468761', 'n2214730584',
      'w216655266', 'w216655269', 'w216655275', 'w216655282', 'w216655274', 'w216655254', 'w216655273', 'w216655286', 'w220268867', 'w216655243', 'w216655271', 'w216655279', 'w216655287', 'w767624696',
      'w216655178', 'w216655187', 'w216655211', 'w216655217', 'w216655278', 'w216655290', 'w220268858', 'w220268860', 'w220268866', 'w216655258', 'w220268868', 'w220268869', 'w216655248',
      'n2260468792', 'n2260468817', 'n2260468835', 'n2260468857', 'n2260468778', 'n2260468779', 'n5852346773', 'n2260468803', 'n2293979401', 'n2293979404', 'n2293979406', 'n2260468833', 'n2260468851', 'n2260468888',
      'n2293979411', 'n2293979419', 'n2260468796', 'n2260468840', 'n2293979414', 'n2293979417'],
    at: [-3286, -672],
    note: 'park r3277181 (13 526 m2), fence w11399921, the 27 footways inside it, the fountains, the obelisk node, the busts, the toilets node, the 20 benches, the music pavilion r3277182 and the toilet block w216731109 (redrawn as a kiosk). NOT claimed: the square polygon w638336438 (it would strip the pavements, lamps and bus platforms of the three streets round the garden; streets lays its slab at 0.012 m under the garden), the sidewalks w216655295 / w767624697 outside the fence' },
  { key: 'rumyantsevsky-descent', name: 'Румянцевский спуск', nameEn: 'Rumyantsevsky descent: the 141 m cobbled apron below the Universitetskaya embankment behind its pink granite wall with the ring-and-meander railing, two ramps, the river-tram pontoon',
    ids: [], osm: ['r12712436', 'r12712437', 'w216655355', 'w942921897', 'w942921898', 'w942921900', 'w125586508'], at: [-3245, -590],
    note: 'the apron is the OSM pier relation r15853953 (NOT in the bake: the ring is APRON_RING below, from the raw OSM points); w216655355 = the retaining wall (141.4 m); w942921897 / 98 = the two 2-step flights at the west ramp; w125586508 = the pedestrian setts way across the apron and w942921900 = the footway along its river edge (streets would draw street-level ribbons over the sunken apron); r12712436 (sett, the floor) and r12712437 (paving_stones, the 3 m border of granite flags along the river edge) = the two OSM paving areas of the apron (streets lays them at street level over the pit); the ring is handed to environment as WATER_RINGS (the apron stands over the water pit, the module draws floor, wall, edge, ramps, railing, pontoon)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---------------------------------------------------------------------------------------------------- hand-over to environment (environment/owners.js; switched on by the claims above)
// The Rumyantsevsky apron (frame D: A (-3306.2, -555.1) west end of the wall, 141.4 m to B; river edge c4 -> D 142.9 m; the rounded west end C c1 c2 c3; the diagonal east end B E D): world metres.
export const APRON_RING = [[-3306.2, -555.1], [-3183.7, -625.7], [-3171.3, -615.0], [-3168.3, -612.5], [-3292.7, -542.2], [-3299.2, -540.3], [-3306.2, -539.6], [-3312.9, -539.8], [-3319.0, -541.7]];
export const WATER_RINGS = GROUPS_LIST.some((g) => g.key === 'rumyantsevsky-descent') ? [{ id: 'rumyantsev-apron', key: 'neva', ring: APRON_RING }] : [];
// no generated descent / landing stage / boat: the two roster stairs (vo-banks.js VO_DESCENTS) at the apron's west ramp (-3318, -545) and in front of the palace (-3089, -705: the quay there is one continuous wall, photos 114 N02),
// and the whole apron with its pontoons (frame D a -20 .. 170, b -10 .. 50, axis bearing 60)
export const KEEP_OUT = [{ id: 'rumyantsev-west-ramp', c: [-3318, -545], r: 20 }, { id: 'palace-front', c: [-3089, -705], r: 14 }, { id: 'rumyantsev-apron', c: [-3236.3, -583.9], ax: [0.8660, -0.5], hl: 100, hw: 38 }];
// ground the module paves / plants itself (claims.js: no trunks, hedges, beds or grass tufts there): the garden (inside the fence), the brick paths and the first court of the palace, the gate paths
export const PAVED_RINGS = [
  [[-3306.5, -718.3], [-3255.9, -748.0], [-3252.4, -746.8], [-3202.7, -662.6], [-3203.9, -659.8], [-3316.7, -596.1], [-3319.3, -596.7], [-3366.8, -677.8], [-3365.8, -683.1], [-3316.3, -712.6]],
  [[-3094.1, -703.5], [-3086.7, -707.8], [-3081.9, -699.5], [-3089.3, -695.2]],
  [[-3098.2, -701.2], [-3082.6, -710.2], [-3080.8, -707.1], [-3096.4, -698.1]],
  [[-3124.3, -675.0], [-3122.1, -676.3], [-3128.3, -687.0], [-3122.9, -695.9], [-3118.9, -701.7], [-3120.3, -704.1], [-3122.4, -702.9], [-3121.5, -701.3], [-3124.7, -697.1], [-3131.0, -686.5]],
  [[-3126.7, -731.1], [-3093.6, -750.2], [-3081.5, -729.1], [-3093.2, -722.4], [-3095.7, -727.0], [-3106.1, -720.9], [-3103.7, -716.5], [-3114.7, -710.2]],
  [[-3047.4, -719.4], [-3045.7, -720.4], [-3048.6, -725.4], [-3050.3, -724.4]],
  [[-3017.1, -736.9], [-3015.7, -737.7], [-3018.4, -742.4], [-3019.8, -741.6]],
];
