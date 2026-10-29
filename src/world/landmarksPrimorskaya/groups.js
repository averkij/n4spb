// landmarksPrimorskaya/groups.js - the layout.GROUPS sub-groups of module landmarksPrimorskaya, the rings it hands to the engine (pure data, no imports: layout.js and src/areas/dekabristov/rings.js merge them).
// Fields of a group as in layout.js GROUPS: { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.
//   primorskaya-vestibule  the surface vestibule of the Primorskaya metro station: the hall w149345779 (building=train_station, 1 storey, the three mapped entrances n3870045073 / n3870045075 / n3870045077 on its west
//                          end and its north-west corner) and the two-storey block w149345769 (building=transportation) that adjoins its north side. REAL POSITION: (-6520, -1800), 190 m WEST of the station node
//                          n249307184 (-6337, -1818) / the underground platform w394449823 (-6349, -1823), which lie under the apartment blocks (an underground passage w394449823 / w108191369 joins them): the
//                          scout reports and the first HERO of the skeleton took the station node for the building (docs/gdm-D2.md). NO metro network exists in this build: the entrances are door points and the doors stay shut.
//   primorskaya-square     the square before the west end of the vestibule: the two benches n8048805552 / n10795206854 and the two litter bins n12736971860 / n12736971861 of the OSM data (props/osm.js skips a claimed
//                          bench / bin: the module furnishes them itself, as knock furniture), the totem with the М, lamps and planters; the Smolenka bank stairs (WATER_RINGS below) belong to this group too
//   metro-museum           the Museum of the Petersburg Metro n1938706048 (tourism=museum, inside the office complex w85426975): the module draws only the signboard at its frontage; the building stays the generic city's
// ON: a group is claimed in the area (area.js GROUPS) only when listed in the area's GROUPS; the rings below follow the same switch (the stairs are part of the square).
const ON = ['primorskaya-vestibule', 'primorskaya-square', 'metro-museum'];
const ALL = [
  { key: 'primorskaya-vestibule', name: 'Вестибюль станции метро «Приморская»', nameEn: 'Primorskaya metro station: the surface vestibule (hall and adjoining block)',
    ids: ['w149345779', 'w149345769'], osm: ['n3870045073', 'n3870045075', 'n3870045077'], at: [-6520, -1800],
    note: 'the hall w149345779 and the block w149345769 are redrawn as one glazed vestibule; the three entrance nodes are claimed because the module draws their doors (no generic consumer: the field only keeps trees 7 m off them)' },
  { key: 'primorskaya-square', name: 'Площадь у станции «Приморская»', nameEn: 'The square before the vestibule: benches, bins, the М totem, lamps, planters; the Smolenka bank stairs',
    ids: [], osm: ['n8048805552', 'n10795206854', 'n12736971860', 'n12736971861'], at: [-6538, -1806],
    note: 'props/osm.js leaves a claimed bench / waste basket to the owner: the four nodes are drawn by the module as knock furniture at their OSM positions' },
  { key: 'metro-museum', name: 'Музей Петербургского метрополитена', nameEn: 'Museum of the Petersburg Metro: the signboard at its frontage',
    ids: [], osm: ['n1938706048'], at: [-6496, -1754], note: 'the POI node of the museum (inside the office complex w85426975, which stays generic); the module draws a signboard on the footway before it' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---------------------------------------------------------------- the Smolenka bank stairs
// Two flights of granite stairs down the north bank of the Smolenka, where the embankment footway runs 8 - 10 m inland of the water edge (probe of the water cells: the bank is a straight line here, bearing 15.8 deg).
// NOT mapped in OpenStreetMap (an authored detail, docs/gdm-D2.md, owner check): the recipe of the bridge stairs of the Nalichny Bridge (bridges/pits.js): each flight stands in a PIT that is handed over as a water ring:
// the ring counts as Smolenka water (a hole in the ground), the generic quay opens at it, and the module draws the lower steps, the landing, the 16-step flight and the cheek walls (breakable bays) and adds the walk boxes / ramp.
// Frame of a flight: B = the bank point (the first water cell going south at that x), N = the landward unit vector (north-north-east), T = along the bank; point(d, v) = B + N d + T v, d > 0 landward, d < 0 over the water.
const N = [0.2815, -0.9594], T = [0.9594, 0.2815];
/** geometry constants of a flight (shared with the drawing code): half width, cheek wall thickness, tread depth, lower steps, landing, rise of a lower step, top level, landing level, number of flight steps, ring reach over the water */
export const PIT = { hw: 2.2, cheek: 0.5, run: 0.30, low: 3, riseLow: 0.17, landing: 1.0, top: 0.05, yLand: -2.6, n: 16, over: 0.3, pave: 1.6 };
export const PIT_LR = PIT.low * PIT.run + PIT.landing + PIT.n * PIT.run;      // 6.7 m from the bank line to the street end
const BANKS = [{ id: 'smolenka-stairs-1', x: -6540, z: -1696.3 }, { id: 'smolenka-stairs-2', x: -6470, z: -1676.5 }];
const pt = (b, d, v) => [Math.round((b.x + N[0] * d + T[0] * v) * 100) / 100, Math.round((b.z + N[1] * d + T[1] * v) * 100) / 100];
export const STAIR_PITS = BANKS.map((b) => ({ ...b, N, T, Lr: PIT_LR, c: pt(b, PIT_LR / 2 - 0.15, 0),
  ring: [pt(b, -PIT.over, -PIT.hw), pt(b, PIT_LR, -PIT.hw), pt(b, PIT_LR, PIT.hw), pt(b, -PIT.over, PIT.hw)],
  paved: (() => { const e = PIT.hw + PIT.cheek + PIT.pave; return [pt(b, -PIT.over, -e), pt(b, PIT_LR + PIT.pave, -e), pt(b, PIT_LR + PIT.pave, e), pt(b, -PIT.over, e)]; })() }));
const STAIRS_ON = ON.includes('primorskaya-square');
/** [{ id, key, ring }] for WATER.ownerRings (environment/waterways.js ownerWaterAt): the hole + water of each pit */
export const WATER_RINGS = STAIRS_ON ? STAIR_PITS.map((p) => ({ id: p.id, key: 'smolenka', ring: p.ring })) : [];
/** no generated descent / landing stage / boat near a flight */
export const KEEP_OUT = STAIRS_ON ? STAIR_PITS.map((p) => ({ id: p.id, c: p.c, r: Math.round(PIT_LR / 2 + 3.5) })) : [];
/** the ground the flights pave themselves (no trunks, hedges, beds or grass tufts): the pit, the threshold and 1.6 m round the cheeks (flat rings, claims.js extraClaimRings) */
export const PAVED_RINGS = STAIRS_ON ? STAIR_PITS.map((p) => p.paved) : [];
