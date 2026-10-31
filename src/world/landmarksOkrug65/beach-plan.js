// Pure shoreline plan: the drawn slope, ground cut and terrain height share
// these exact triangles. No renderer imports in the area-data closure.
import { BEACH_SHORES } from './beach-shores.js';
import { BEACHES } from './park-data.js';
import { ringContains } from './waterfront-plan.js';

export const BEACH_LAND_Y = 0.013, BEACH_WATER_Y = -3.42, BEACH_BED_Y = -6;
// Where the mapped sand narrows to a sliver beside a bridge or retaining
// structure, keep that structure's bank. A 3.43 m drop needs at least 4.5 m of
// beach; making the missing width out of adjacent paths would be inaccurate.
const fitsBeach = s => {
  const beach = BEACHES.find(b => s.id.startsWith(b.id + '-'));
  // A thin mapped strip can have all four corners inside yet bend around a
  // non-sand path in its middle. Keep that bank when the whole ramp will not
  // fit, rather than covering the intervening path or open sea.
  for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) for (const v of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const ax = s.a[0] + (s.a[2] - s.a[0]) * v, az = s.a[1] + (s.a[3] - s.a[1]) * v;
    const bx = s.b[0] + (s.b[2] - s.b[0]) * v, bz = s.b[1] + (s.b[3] - s.b[1]) * v;
    const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (!beach.polys.some(p => ringContains(p.o, x, z) && !p.h.some(h => ringContains(h, x, z)))) return false;
  }
  return true;
};
// The small technical strips east of Piterland meet piers / retaining walls;
// this sandy-bank authoring is restricted to the broad Park 300 beach.
const landSlopes = BEACH_SHORES.filter(s => s.id.startsWith('r2186246-') && Math.hypot(s.a[2] - s.a[0], s.a[3] - s.a[1]) >= 4.5 && Math.hypot(s.b[2] - s.b[0], s.b[3] - s.b[1]) >= 4.5 && fitsBeach(s)).map(s => ({
  id: s.id,
  pts: [[s.a[0], BEACH_WATER_Y, s.a[1]], [s.b[0], BEACH_WATER_Y, s.b[1]],
    [s.b[2], BEACH_LAND_Y, s.b[3]], [s.a[2], BEACH_LAND_Y, s.a[3]]],
}));
// The scene's Neva bed is -6 m. Continue six metres beneath the water so a
// walker does not drop 2.6 m from the waterline to that bed. This narrow sandy
// shelf remains real water; it adds terrain, never a boat exclusion or wall.
export const BEACH_SLOPES = landSlopes.flatMap(s => {
  const [a, b, c, d] = s.pts, out = (p, inland) => {
    const dx = inland[0] - p[0], dz = inland[2] - p[2], len = Math.hypot(dx, dz);
    return [p[0] - dx / len * 6, BEACH_BED_Y, p[2] - dz / len * 6];
  };
  return [s, { id: s.id + '-submerged', pts: [out(a, d), out(b, c), b, a] }];
});
// Cut convex triangles separately: sharp mapped beach corners can make an
// offset quad concave, which must never be passed to a convex subtraction.
export const BEACH_GROUND_HOLES = BEACH_SLOPES.flatMap(s => [[0, 1, 2], [0, 2, 3]].map(ids => ids.flatMap(i => [s.pts[i][0], s.pts[i][2]])));
export const BEACH_BANK_RINGS = BEACH_GROUND_HOLES.map((ring, i) => ({ id: 'park300-sand-shore-' + i, ring }));

const CELL = 32, grid = new Map(), triangles = [];
for (const s of BEACH_SLOPES) for (const ids of [[0, 1, 2], [0, 2, 3]]) {
  const pts = ids.map(i => s.pts[i]), [a, b, c] = pts;
  const den = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
  if (Math.abs(den) < 1e-6) continue;
  const xs = pts.map(p => p[0]), zs = pts.map(p => p[2]), box = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const t = { pts, den, box }; triangles.push(t);
  for (let x = Math.floor(box[0] / CELL); x <= Math.floor(box[1] / CELL); x++) for (let z = Math.floor(box[2] / CELL); z <= Math.floor(box[3] / CELL); z++) {
    const key = x + ',' + z, bucket = grid.get(key); if (bucket) bucket.push(t); else grid.set(key, [t]);
  }
}
export function beachHeightAt(x, z) {
  let height = null;
  for (const t of grid.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || []) {
    const q = t.box; if (x < q[0] - 1e-6 || x > q[1] + 1e-6 || z < q[2] - 1e-6 || z > q[3] + 1e-6) continue;
    const [a, b, c] = t.pts, u = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / t.den;
    const v = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / t.den, w = 1 - u - v;
    if (Math.min(u, v, w) < -1e-6) continue;
    const y = u * a[1] + v * b[1] + w * c[1]; height = height == null ? y : Math.max(height, y);
  }
  return height;
}
const xs = BEACH_SLOPES.flatMap(s => s.pts.map(p => p[0])), zs = BEACH_SLOPES.flatMap(s => s.pts.map(p => p[2]));
export const BEACH_HEIGHT_PATCHES = [{ id: 'park300-sandy-shore', box: [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)], at: beachHeightAt }];
