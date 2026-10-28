// landmarksMenshikov/plants.js - clipped hedges and small planting shared by the palace forecourt and the garden: `hedgeWall` lays a flat-topped hedge box along a world polyline (leaf texture, thin collider),
// `hedgeRing` an oval / polygon box-hedge border, `lawnPoly` a lawn polygon (y 0.02, world uv).
import { tbox } from './geo.js';
import { fillPolyFine, pairs } from './surfaces.js';

/** a hedge box (h high, w wide) along the polyline pts [[x, z] ..]; o: { closed, collider (default true), colH, ext (extension at the ends, default w / 2), y0 } */
export function hedgeWall(K, pts, h = 1.3, w = 0.9, o = {}) {
  const { P, M, ctx } = K, n = o.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.1) continue;
    const ux = dx / len, uz = dz / len, e = o.ext ?? w / 2, rot = Math.atan2(-uz, ux), y0 = o.y0 ?? 0;
    P.push(a[0] - ux * e, 0, a[1] - uz * e, rot);
    tbox(P, o.mat || M.hedge, 0, len + 2 * e, y0, y0 + h + i * 0.004, -w / 2, w / 2, 1.2, 1.2, 'b');
    P.pop();
    if (o.collider !== false) ctx.physics.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len + 2 * e, w * 0.85, rot, 0, o.colH ?? 1.4);
  }
}
/** an ellipse (cx, cz, rx, rz, rotation) as a polyline of n points */
export function ellipse(cx, cz, rx, rz, rot = 0, n = 28) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2, x = Math.cos(t) * rx, z = Math.sin(t) * rz; return [cx + x * c - z * s, cz + x * s + z * c]; });
}
/** a lawn polygon from a baked record polys[] ({ o, h }) or a ring [[x, z]..] */
export function lawnPoly(K, ring, holes = [], y = 0.02) {
  fillPolyFine(K.P, K.M.lawn, ring, y, { maxEdge: 20, tile: 6, holes });
}
export { pairs };
