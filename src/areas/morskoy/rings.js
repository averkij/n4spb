// ============================================================================
//  RINGS of Morskoy - the ONE file that collects what the landmark modules of this area hand over to the engine (docs/AREAS.md 15.v; the Vasilyevsky protocol). PURE DATA: it imports only the (pure data) groups.js of the modules.
//  area.js builds from it   WATER.ownerRings (stair pits and descents that count as water; environment/waterways.js ownerWaterAt), WATER.keepOut (no generated descent / landing stage / boat; waterways.js keepOut)
//  and                      PAVED_RINGS      (ground a module paves itself: no trunks, hedges or tufts; src/world/lib/area-tables.js PAVED_RINGS -> environment/claims.js extraClaimRings, only when the module is built).
//
//  PROTOCOL (a module port adds ONE import line and ONE source line, nothing else):
//    1. the module's groups.js exports any of  WATER_RINGS [{ id, key?, ring }],  KEEP_OUT [{ id, c, r } | { id, c, ax, hl, hw }],  PAVED_RINGS [[[x, z], ...], ...]  (a name it lacks is simply empty);
//    2. replace the marker line  `// PORT-IMPORT: <module>`  by  `import * as <NAME> from '../../world/<module>/groups.js';`
//    3. replace the marker line  `// PORT-SOURCE: <module>`  by  `{ module: '<module>', ns: <NAME> },`
//  The markers are separated by an unchanged `// ---` line on purpose: parallel branches that each replace their own marker merge without a conflict. Keep the order of the markers.
//  `paved: false` on a source = the module's PAVED_RINGS are already wired elsewhere (environment/claims.js hard-codes the Academy's); the water rings and the keep-outs are always taken.
//  Slots of this area: landmarksMarineFacade (BERTH_RINGS, PAVED_RINGS, the KEEP_OUT boxes of the two liners), landmarksPribaltiyskaya (PAVED_RINGS: the hotel platform and plaza, the Kirov platform), bridgesMo
//  (the stair pits of the Shipbuilders' and the 3rd / 4th Smolensky bridges: bridges/pits.js; a new file bridges/groups-mo.js with its own `mine` filter, bridges/groups-vo.js keeps the Nalichny pits).
// ============================================================================
import * as BRIDGES from '../../world/bridges/groups-vo.js';      // the stair pits of the Nalichny Bridge (bridges/pits.js): the bridge lies in the overlap with Vasilyevsky, which draws the same pits
// ---
// PORT-IMPORT: landmarksMarineFacade
// ---
// PORT-IMPORT: landmarksPribaltiyskaya
// ---
import { ringsOf as MO_RINGS } from '../../world/bridges/groups-mo.js';      // bridgesMo: the stair pits of the Shipbuilders' and the 3rd / 4th Smolensky bridges + the grass embankments of the WHSD cutting (paved ground)
const BRIDGES_MO = MO_RINGS(['korablestroiteley-', 'smol3-', 'smol4-'], { cutting: true });
// ---

const SOURCES = [
  { module: 'bridges', ns: BRIDGES },      // the four corner stairs of the Nalichny Bridge (water rings, keep-outs, paved ground)
  // ---
  // PORT-SOURCE: landmarksMarineFacade
  // ---
  // PORT-SOURCE: landmarksPribaltiyskaya
  // ---
  { module: 'bridges', ns: BRIDGES_MO },      // bridgesMo: the pits of the three bridges with corner / abutment stairs, the cutting banks of the WHSD
  // ---
];

const arr = (v) => (Array.isArray(v) ? v : []);
/** WATER.ownerRings of area.js: the water rings of every source */
export const WATER_RINGS = SOURCES.flatMap((s) => arr(s.ns.WATER_RINGS));
/** WATER.keepOut of area.js: the keep-outs of every source */
export const KEEP_OUT = SOURCES.flatMap((s) => arr(s.ns.KEEP_OUT));
/** PAVED_RINGS of area.js: [{ module, rings }] for the sources whose rings claims.js does not already wire */
export const PAVED_RINGS = SOURCES.filter((s) => s.paved !== false && arr(s.ns.PAVED_RINGS).length).map((s) => ({ module: s.module, rings: s.ns.PAVED_RINGS }));
