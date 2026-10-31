// landmarksPetrovskyStadium/groups.js - the layout.GROUPS sub-groups of module landmarksPetrovskyStadium (pure data, no imports).  Claims are ON only for what the module draws:
//   * the bowl r9073800 (the stands ring with the arena hole), the stadium area r2270942, the pitch r4588176 and the track r4587232 (moved here from landmarksVladimir/stadium.js, which builds nothing now)
//   * the four lighting towers n7617998960..63 (twin-leg lattice, masts.js)
//   * the ticket office w119931739, the boiler house w44425138 and its chimney n7629436124 (apronprops.js)
//   * the Small Sports Arena (its area r4587617 too: kind 'stadium', else the generic tree scatter plants the islet): the covered stand r4609068, the seat-block strip r4609067, the track r4609069, the pitch w328040082 and the three poles n7617998956 / 58 / 59 (arena.js)
// NOT claimed (the water owner / props owner keep them): the Svetlana marina w985984623 and its piers / roofs w864833776..784 / w864833782 / w1268704914 / the checkpoint w240108244 (no photo, boats not built),
// the decks w44425124 / w816883273 / w1172866679 (walk decks stay as they are), the benches n11783386738 / 40.
import { TIP, offsetRing } from './geom.js';

export const GROUPS_LIST = [
  { key: 'petrovsky-stadium', name: 'Стадион «Петровский»', nameEn: 'Petrovsky stadium (1925 / 1957-61): colonnaded bowl, four twin-leg floodlight towers, apron, ticket office, boiler house', ids: ['r9073800', 'w119931739', 'w44425138'],
    osm: ['r2270942', 'r4588176', 'r4587232', 'n7617998960', 'n7617998961', 'n7617998962', 'n7617998963', 'n7629436124'], at: [-3635.9, -2174.4],
    note: 'stands ring r9073800 (with the arena hole); stadium area r2270942, pitch r4588176 and track r4587232 are drawn by field.js; the four lighting towers by masts.js; the ticket office, the boiler house and the chimney by apronprops.js' },
  { key: 'petrovsky-small-arena', name: 'Малая спортивная арена «Петровский»', nameEn: 'Petrovsky small sports arena: covered stand, seat blocks, track, pitch, three poles', ids: ['r4609068', 'r4609067'],
    osm: ['r4587617', 'r4609069', 'w328040082', 'n7617998956', 'n7617998958', 'n7617998959'], at: [-3862, -2262],
    note: 'the two straight strips r4609068 (covered stand with the blue roof) / r4609067 (bare seat blocks), the track r4609069 and the pitch w328040082 on the islet west of the stadium; floodlight poles n7617998956 / 58 / 59' },
];

// ---- hand-over data for environment/owners.js (registered by the lead: docs/research/islands2-requests-landmarksPetrovskyStadium.md): ground that the module paves itself (no trunks, hedges, grass tufts)
const ARENA = [[-3791.1, -2245.0], [-3787.4, -2237.6], [-3785.6, -2226.5], [-3786.6, -2214.7], [-3790.5, -2204.2], [-3796.1, -2195.2], [-3803.5, -2187.2], [-3813.2, -2181.9], [-3825.5, -2177.8], [-3836.3, -2177.3], [-3845.3, -2177.8], [-3854.1, -2180.5], [-3861.1, -2184.5], [-3866.9, -2190.3], [-3870.7, -2187.9], [-3879.2, -2200.9], [-3878.0, -2201.8], [-3939.6, -2295.9], [-3930.1, -2301.2], [-3929.4, -2310.6], [-3925.9, -2318.3], [-3922.0, -2324.6], [-3915.4, -2332.1], [-3907.4, -2338.2], [-3890.6, -2344.4], [-3880.4, -2344.8], [-3871.6, -2343.9], [-3864.7, -2341.9], [-3857.5, -2339.3], [-3849.2, -2331.9]];
export const PAVED_RINGS = [{ id: 'apron', ring: offsetRing(TIP, -0.7) }, { id: 'small-arena', ring: offsetRing(ARENA, 4) }];
// the towers: no generated descent, landing stage or boat within 9 m of the node (the legs stand 5.7 m either side of it); the quay posts / railing panels near the legs are the water owner's QUAY_CLEAR (waterways.js: radius 4.2 at the node is too small, see the requests file)
export const KEEP_OUT = [[-3530.49, -2189.92], [-3656.47, -2279.09], [-3744.06, -2159.99], [-3617.48, -2067.51]].map(([x, z], i) => ({ id: 'tower' + i, c: [x, z], r: 9 }));
