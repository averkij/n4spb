// Pure area hooks for Park 300: mapped groves, all?es and sand.
// No Three.js, renderer, layout, area or runtime imports.
import { PARK, GROVES, TREES, ROWS, BEACHES } from "./park-data.js";

function inRing(x, z, a) {
  let inside = false;
  for (let i = 0, j = a.length - 2; i < a.length; j = i, i += 2) {
    const ax = a[i], az = a[i + 1], bx = a[j], bz = a[j + 1];
    if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
  }
  return inside;
}
const inPoly = (x, z, p) => inRing(x, z, p.o) && !p.h?.some(h => inRing(x, z, h));
const inAny = (x, z, list) => list.some(r => r.polys.some(p => inPoly(x, z, p)));
export const inPark = (x, z) => x >= -9135 && x <= -7937 && z >= -5972 && z <= -5270 && inAny(x, z, [PARK]);
export const inBeach = (x, z) => x >= -8990 && x <= -7585 && z >= -5605 && z <= -5200 && inAny(x, z, BEACHES);
const distSegment = (x, z, ax, az, bx, bz) => {
  const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - ax - t * dx, z - az - t * dz);
};

// Rejecting procedural park candidates is a hot startup path. Index the exact
// same mapped points, row segments and grove polygons once, instead of scanning
// 418 points, 106 rows and 71 groves for every proposed tree. Padding is included
// in the buckets, so a query needs only its own 32 m cell and keeps the original
// strict distance tests, polygon boundaries and priority order unchanged.
const CELL = 32;
function index(items, bounds) {
  const cells = new Map();
  for (const item of items) {
    const [x0, x1, z0, z1] = bounds(item);
    for (let x = Math.floor(x0 / CELL); x <= Math.floor(x1 / CELL); x++) for (let z = Math.floor(z0 / CELL); z <= Math.floor(z1 / CELL); z++) {
      const key = x + ',' + z, bucket = cells.get(key);
      if (bucket) bucket.push(item); else cells.set(key, [item]);
    }
  }
  return cells;
}
const treeCells = index(TREES, p => [p[0] - 1.3, p[0] + 1.3, p[1] - 1.3, p[1] + 1.3]);
const rowCells = index(ROWS, r => [Math.min(r[0], r[2]) - 1.8, Math.max(r[0], r[2]) + 1.8, Math.min(r[1], r[3]) - 1.8, Math.max(r[1], r[3]) + 1.8]);
const groveCells = index(GROVES.flatMap(g => g.polys), p => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); }
  return [x0, x1, z0, z1];
});

/** Pass as HOOKS.treeReject: () => treeReject. Mapped trees and allées stay;
 *  only unrecorded procedural trees on the park's designed lawns are rejected. */
export function treeReject(x, z) {
  if (inBeach(x, z)) return 'park300-beach';
  if (!inPark(x, z)) return null;
  const key = Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  if (treeCells.get(key)?.some(p => Math.hypot(x - p[0], z - p[1]) < 1.3)) return null;
  if (rowCells.get(key)?.some(r => distSegment(x, z, ...r) < 1.8)) return null;
  if (groveCells.get(key)?.some(p => inPoly(x, z, p))) return null;
  return 'park300-open-lawn';
}
export const pavedRings = BEACHES.flatMap(b => b.polys.map(p => Array.from({ length: p.o.length / 2 }, (_, i) => [p.o[i * 2], p.o[i * 2 + 1]])));
