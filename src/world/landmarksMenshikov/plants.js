// landmarksMenshikov/plants.js - clipped hedges and small planting shared by the palace forecourt and the garden: `hedgeWall` lays a flat-topped hedge box along a world polyline (leaf texture, thin collider),
// `hedgeRing` an oval / polygon box-hedge border, `lawnPoly` a lawn polygon (y 0.02, world uv).
import { tbox } from './geo.js';
import { fillPolyFine, pairs } from './surfaces.js';
import { knockBays, splitBays, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7): a hedge with a collider is a row of breakable bays

/** a hedge box (h high, w wide) along the polyline pts [[x, z] ..]; o: { closed, collider (default true), colH, ext (extension at the ends, default w / 2), y0 } */
export function hedgeWall(K, pts, h = 1.3, w = 0.9, o = {}) {
  const { P, M, ctx } = K, n = o.closed ? pts.length : pts.length - 1, bays = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.1) continue;
    const ux = dx / len, uz = dz / len, e = o.ext ?? w / 2, rot = Math.atan2(-uz, ux), y0 = o.y0 ?? 0;
    if (o.collider === false) {                                      // a decorative hedge (a parterre border): drawn as before, no collider
      P.push(a[0] - ux * e, 0, a[1] - uz * e, rot);
      tbox(P, o.mat || M.hedge, 0, len + 2 * e, y0, y0 + h + i * 0.004, -w / 2, w / 2, 1.2, 1.2, 'b');
      P.pop();
    } else bays.push(...splitBays(a[0] - ux * e, a[1] - uz * e, b[0] + ux * e, b[1] + uz * e, 2.4, { y: y0 }));      // n4spb: the hedge is a row of breakable bays (one box part + one thin collider + one knock record each)
  }
  if (bays.length) {
    knockBays(ctx, { name: 'lmmensh-hedge', bays, far: 300,
      parts: [{ geo: unitBox(0, h, -w / 2, w / 2, { uLen: 2.4, uvs: 1.2 }), mat: o.mat || M.hedge, name: 'hedge', stretch: true }],
      collider: { y0: 0, y1: o.colH ?? 1.4, thick: w * 0.85, e0: 0, e1: 0 },
      rec: () => ({ kind: 'fence', mass: 350, h, anchored: 18, hitK: 0.4, minDv: 0 }) });
    K.extraTris += bays.length * 10;
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
