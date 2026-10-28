// ============================================================================
//  RINGS of Vasilyevsky-Okrug 7 - the ONE file that collects what the landmark modules of this area hand over to the engine (docs/AREAS.md 15.v). PURE DATA: it imports only the (pure data) groups.js of the modules.
//  area.js builds from it   WATER.ownerRings (stair pits and descents that count as water; environment/waterways.js ownerWaterAt), WATER.keepOut (no generated descent / landing stage / boat; waterways.js keepOut)
//  and                      PAVED_RINGS      (ground a module paves itself: no trunks, hedges or tufts; src/world/lib/area-tables.js PAVED_RINGS -> environment/claims.js extraClaimRings, only when the module is built).
//
//  PROTOCOL (a module port adds ONE import line and ONE source line, nothing else):
//    1. the module's groups.js exports any of  WATER_RINGS [{ id, key?, ring }],  KEEP_OUT [{ id, c, r } | { id, c, ax, hl, hw }],  PAVED_RINGS [[[x, z], ...], ...]  (a name it lacks is simply empty);
//    2. replace the marker line  `// PORT-IMPORT: <module>`  by  `import * as <NAME> from '../../world/<module>/groups.js';`
//    3. replace the marker line  `// PORT-SOURCE: <module>`  by  `{ module: '<module>', ns: <NAME> },`
//  The markers are separated by an unchanged `// ---` line on purpose: five branches that each replace their own marker merge without a conflict. Keep the order of the markers.
//  `paved: false` on a source = the module's PAVED_RINGS are already wired elsewhere (environment/claims.js hard-codes the Academy's); the water rings and the keep-outs are always taken.
// ============================================================================
import * as ACADEMY from '../../world/landmarksAcademy/groups.js';
// ---
// PORT-IMPORT: landmarksStrelka
// ---
// PORT-IMPORT: landmarksUniversity
// ---
// PORT-IMPORT: landmarksMenshikov
// ---
import * as ANDREW from '../../world/landmarksAndrew/groups.js';
// ---
// PORT-IMPORT: landmarksMakarova
// ---
// PORT-IMPORT: landmarksNavalCorps
// ---
// PORT-IMPORT: landmarksMining
// ---
import * as SREDNY from '../../world/landmarksSredny/groups.js';
// ---
// PORT-IMPORT: landmarksModernVO
// ---
// PORT-IMPORT: landmarksKirova
// ---
// PORT-IMPORT: landmarksSmolensky
// ---
// PORT-IMPORT: landmarksSevkabel
// ---
// PORT-IMPORT: landmarksSeaTerminal
// ---
// PORT-IMPORT: landmarksVOStatues
// ---
// PORT-IMPORT: landmarksGavan
// ---
// PORT-IMPORT: bridges (groups-vo.js and the bridge pits / stairs)
// ---

const SOURCES = [
  { module: 'landmarksAcademy', ns: ACADEMY, paved: false },      // all five sub-groups are claimed here; the Academy's PAVED_RINGS stay hard-wired in environment/claims.js
  // ---
  // PORT-SOURCE: landmarksStrelka
  // ---
  // PORT-SOURCE: landmarksUniversity
  // ---
  // PORT-SOURCE: landmarksMenshikov
  // ---
  { module: 'landmarksAndrew', ns: ANDREW },
  // ---
  // PORT-SOURCE: landmarksMakarova
  // ---
  // PORT-SOURCE: landmarksNavalCorps
  // ---
  // PORT-SOURCE: landmarksMining
  // ---
  { module: 'landmarksSredny', ns: SREDNY },
  // ---
  // PORT-SOURCE: landmarksModernVO
  // ---
  // PORT-SOURCE: landmarksKirova
  // ---
  // PORT-SOURCE: landmarksSmolensky
  // ---
  // PORT-SOURCE: landmarksSevkabel
  // ---
  // PORT-SOURCE: landmarksSeaTerminal
  // ---
  // PORT-SOURCE: landmarksVOStatues
  // ---
  // PORT-SOURCE: landmarksGavan
  // ---
  // PORT-SOURCE: bridges
  // ---
];

const arr = (v) => (Array.isArray(v) ? v : []);
/** WATER.ownerRings of area.js: the water rings of every source */
export const WATER_RINGS = SOURCES.flatMap((s) => arr(s.ns.WATER_RINGS));
/** WATER.keepOut of area.js: the keep-outs of every source */
export const KEEP_OUT = SOURCES.flatMap((s) => arr(s.ns.KEEP_OUT));
/** PAVED_RINGS of area.js: [{ module, rings }] for the sources whose rings claims.js does not already wire */
export const PAVED_RINGS = SOURCES.filter((s) => s.paved !== false && arr(s.ns.PAVED_RINGS).length).map((s) => ({ module: s.module, rings: s.ns.PAVED_RINGS }));
