// Park 300 is a composition of maintained lawns, allées and mapped sand.
// Photographic / engineering references: docs/research/okrug65-waterfront.md.
import { BEACHES } from './park-data.js';
import { buildWaterfront, flatSurface } from './waterfront.js';
import { BEACH_GROUND_HOLES } from './beach-plan.js';
import { WATERFRONT_OWNER_WATER_RINGS } from './waterfront-channels.js';

export { inPark, inBeach, treeReject, tuftReject, pavedRings } from './park-hooks.js';

/** Exact mapped beaches remain below the path layer. The shoreline is not
 * replaced by a giant rectangular sand plane or an off-map collision wall. */
export function drawBeach(ctx) {
  const sand = flatSurface(ctx, BEACHES.flatMap(b => b.polys), {
    name: 'okrug65-mapped-sand-beach', color: '#c4b38f', y: 0.013,
    cuts: [...BEACH_GROUND_HOLES.map(o => Array.from({ length: o.length / 2 }, (_, i) => [o[i * 2], o[i * 2 + 1]])), ...WATERFRONT_OWNER_WATER_RINGS.map(w => w.ring)],
  });
  return sand + buildWaterfront(ctx);
}
