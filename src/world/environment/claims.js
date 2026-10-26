// environment/claims.js - ground that a landmark module of the strip draws itself, as flat rings [x, z, ...] for the field's `claim` mask (no trunks, hedges, beds or grass tufts of the generic
// generators there). A ring counts only when its owner module is really built (ctx.buildList, like lib/claims.js ownedGroups).
//   landmarksGarden: GARDEN_RING = the Summer Garden relation r2653740 (landmarksGarden/groups.js; mirrors the source's claims.js)
//   landmarksOktyabrsky: PAVED_RINGS = the promenade and the apron of the Kapodistrias monument, paved by the module on unmapped ground
//   landmarksAcademy: PAVED_RINGS = the strip between the Academy front and the Neva quay (the sphinx pier; Admiralty-Haymarket only: the module is in no other area's list)
import * as L from '../layout.js';
import { GARDEN_RING } from '../landmarksGarden/groups.js';
import * as G_OKT from '../landmarksOktyabrsky/groups.js';
import { PAVED_RINGS as ACADEMY_PAVED } from '../landmarksAcademy/groups.js';

//   landmarksMars:   the paved cour d'honneur of the Marble Palace (the polygon of landmarksMars/palace.js, which lays granite slabs over it): copied from the source's claims.js (102_3d_piter 0568f7af)
const MARBLE_COURT = [[-1322, -1401.9], [-1288.2, -1417.4], [-1317, -1489.2], [-1350.7, -1473.9], [-1343.9, -1456], [-1370.3, -1441.4], [-1362.9, -1428.4], [-1356.6, -1417.3], [-1353.7, -1418.9], [-1333.7, -1429.8]];

//   landmarksYusupov: the palace courtyard (the polygon of landmarksYusupov/courtyard.js COURT_RING, which lays the floor; the palace polygon has no courtyard hole); the garden is claimed through its GREEN ids: copied from the source's claims.js (102_3d_piter 0568f7af)
const YUSUPOV_COURT = [[-2944.7, 366.2], [-2917, 339], [-2914.7, 341.5], [-2908.5, 335.3], [-2901.1, 331.4], [-2892.2, 346.9], [-2882.5, 356], [-2874.5, 369.7], [-2877, 372.2], [-2877.8, 387.8], [-2881.7, 394.9], [-2888.9, 398.5], [-2893.1, 401.4], [-2896.2, 402], [-2899.6, 401.8], [-2902.3, 400.7], [-2904.4, 399.2], [-2907.5, 402.3]];

export function extraClaimRings(ctx) {
  const list = ctx.buildList || L.MODULE_KEYS, out = [];
  if (list.includes('landmarksGarden')) out.push(GARDEN_RING.flat());
  if (list.includes('landmarksMars')) out.push(MARBLE_COURT.flat());
  if (list.includes('landmarksYusupov')) out.push(YUSUPOV_COURT.flat());
  // landmarksOktyabrsky: PAVED_RINGS = the promenade and the apron of the Kapodistrias monument, paved by the module on unmapped ground (docs/research/oktyabrsky-requests.md, Review item 1): no grass tufts through the pavers
  // M7 (docs/AREAS.md section 10): where the AREA claims the Kapodistrias monument (the North: layout.GROUPS.landmarksOktyabrsky holds 'kapodistrias'), plaza.js paves the source's longer ring
  // (the promenade + the apron round the monument, groups.js KAPODISTRIAS_PAVED_RINGS), so the tufts must keep off that ring instead; the strip claims no 'kapodistrias' and keeps PAVED_RINGS as before
  if (list.includes('landmarksAcademy')) for (const r of ACADEMY_PAVED) out.push(r.flat());
  if (list.includes('landmarksOktyabrsky')) {
    const kap = (L.GROUPS.landmarksOktyabrsky || []).some((g) => g.key === 'kapodistrias');
    const rings = kap && Array.isArray(G_OKT.KAPODISTRIAS_PAVED_RINGS) ? G_OKT.KAPODISTRIAS_PAVED_RINGS : G_OKT.PAVED_RINGS;
    if (Array.isArray(rings)) for (const r of rings) out.push(r.flat());
  }
  return out;
}
