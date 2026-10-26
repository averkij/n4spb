// world/lib/knock-furniture.js - the one-call KNOCKABLE version of "an array of instanced furniture" for the landmark modules that were copied from the source project with their furniture drawn by
// addInstanced() (landmarksNikolsky / Mariinsky / NewHolland / Yusupov): benches, litter bins and lamps there were instances of a few Parts geometries with (at best) a static collider each, which the
// owner's rule (docs/AREAS.md 13: objects stay movable and breakable) does not allow. `knockFurniture` takes the very same geometry list (`partsGeos(...)` of the module: { list: [{ mat, geo }], tris }), the
// placements and the colliders and builds the draw structure of core/knock.js through lib/knock-inst.js: dynamic per-cell InstancedMeshes, one knock record per placement (the collider is removed at the knock).
// Without ctx.knock (tools/check.mjs of a single module) the structure is the static InstancedMesh of before. Returns the triangle count (the module adds it to its stats).
import { knockInstances } from './knock-inst.js';

/** the record templates of the furniture kinds (the numbers of the strip's landmark modules: landmarksA/square.js, landmarksE/promenade.js, landmarksH/garden.js) */
export const FURNITURE_REC = {
  bench: { kind: 'bench', mass: 45, h: 0.9, w: 1.9, d: 0.6, hitK: 0.25 },
  bin: { kind: 'bin', mass: 14, h: 0.9, r: 0.3, hitK: 0.12, metal: true },
  lamp: (h = 4.8) => ({ kind: 'lamp', mass: 250, h, r: 0.2, anchored: 22, hitK: 0.5, metal: true }),
};

/**
 * knockFurniture(ctx, name, parts, spots, items, rec, far) -> triangles
 *   parts  { list: [{ mat, geo }] } from the module's partsGeos(): the geometry at the origin, foot at y 0
 *   spots  [{ x, y, z, rotY, s? }]  the placements (y = the foot level)
 *   items  [collider | null] (one per spot, the handles of ctx.physics.add*) | null
 *   rec    a knock record template (FURNITURE_REC) | (spot, i) => template
 */
export function knockFurniture(ctx, name, parts, spots, items, rec, far = 260) {
  if (!spots.length) return 0;
  knockInstances(ctx, { name, parts: parts.list.map(({ geo, mat }, i) => ({ geo, mat, name: 'p' + i })), spots, items: items || null, rec, far });
  let tris = 0; for (const { geo } of parts.list) tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  return tris * spots.length;
}
