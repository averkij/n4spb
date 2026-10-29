// ============================================================================
//  RINGS of Gavan (Гавань) - the ONE file that collects what the landmark modules of this area hand over to the engine (docs/AREAS.md 15.v, the protocol of src/areas/vasilyevsky/rings.js). PURE DATA: it imports only the (pure data) groups.js of the modules.
//  area.js builds from it   WATER.ownerRings (stair pits and descents that count as water; environment/waterways.js ownerWaterAt), WATER.keepOut (no generated descent / landing stage / boat; waterways.js keepOut)
//  and                      PAVED_RINGS      (ground a module paves itself: no trunks, hedges or tufts; src/world/lib/area-tables.js PAVED_RINGS -> environment/claims.js extraClaimRings, only when the module is built).
//
//  PROTOCOL (a module port adds ONE import line and ONE source line, nothing else):
//    1. the module's groups.js exports any of  WATER_RINGS [{ id, key?, ring }],  KEEP_OUT [{ id, c, r } | { id, c, ax, hl, hw }],  PAVED_RINGS [[[x, z], ...], ...]  (a name it lacks is simply empty);
//    2. replace the marker line  `// PORT-IMPORT: <module>`  by  `import * as <NAME> from '../../world/<module>/groups.js';`
//    3. replace the marker line  `// PORT-SOURCE: <module>`  by  `{ module: '<module>', ns: <NAME> },`
//  The markers are separated by an unchanged `// ---` line on purpose: parallel branches that each replace their own marker merge without a conflict. Keep the order of the markers.
//  `paved: false` on a source = the module's PAVED_RINGS are already wired elsewhere; the water rings and the keep-outs are always taken.
//
//  What is wired here and what is still a slot:
//    ready   landmarksKirova (paved ground of the garden), landmarksSevkabel (keep-outs of the pier and the hall quay, paved ground of the hall yard), landmarksSeaTerminal (follows its ON list),
//            landmarksSredny (the Brush paver plaza), bridges (the four corner stairs of the Nalichny Bridge: water rings, keep-outs, paved ground)
//    slots   landmarksGavan (the east-mole stair ring `east-mole-stair` (key 'gavan'), 4 keep-outs, 6 paved rings: scout-gavan.md 3.1), landmarksPribaltiyskaya (5 paved rings)
//    ModernVO and VOStatues hand nothing over (their groups.js export no ring).
// ============================================================================
import * as KIROVA from '../../world/landmarksKirova/groups.js';
// ---
import * as SEVKABEL from '../../world/landmarksSevkabel/groups.js';
// ---
import * as SEATERMINAL from '../../world/landmarksSeaTerminal/groups.js';
// ---
import * as SREDNY from '../../world/landmarksSredny/groups.js';
// ---
// PORT-IMPORT: landmarksGavan
// ---
import * as PRIBALTIYSKAYA from '../../world/landmarksPribaltiyskaya/groups.js';      // five paved rings (the hotel platform and plaza, the Kirov platform); no water ring, no keep-out: the module is inland
// ---
import * as BRIDGES from '../../world/bridges/groups-vo.js';      // the stair pits of the Nalichny Bridge (bridges/pits.js)
// ---

const SOURCES = [
  { module: 'landmarksKirova', ns: KIROVA },
  // ---
  { module: 'landmarksSevkabel', ns: SEVKABEL },      // the baltic-cranes group is not claimed here, but the rings belong to the hall and the pier, which are
  // ---
  { module: 'landmarksSeaTerminal', ns: SEATERMINAL },
  // ---
  { module: 'landmarksSredny', ns: SREDNY },
  // ---
  // PORT-SOURCE: landmarksGavan
  // ---
  { module: 'landmarksPribaltiyskaya', ns: PRIBALTIYSKAYA },
  // ---
  { module: 'bridges', ns: BRIDGES },      // the four corner stairs of the Nalichny Bridge (water rings, keep-outs, paved ground)
  // ---
];

const arr = (v) => (Array.isArray(v) ? v : []);
/** WATER.ownerRings of area.js: the water rings of every source */
export const WATER_RINGS = SOURCES.flatMap((s) => arr(s.ns.WATER_RINGS));
/** WATER.keepOut of area.js: the keep-outs of every source */
export const KEEP_OUT = SOURCES.flatMap((s) => arr(s.ns.KEEP_OUT));
/** PAVED_RINGS of area.js: [{ module, rings }] for the sources whose rings claims.js does not already wire */
export const PAVED_RINGS = SOURCES.filter((s) => s.paved !== false && arr(s.ns.PAVED_RINGS).length).map((s) => ({ module: s.module, rings: s.ns.PAVED_RINGS }));
