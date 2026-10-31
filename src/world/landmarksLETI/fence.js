// landmarksLETI/fence.js - the LOW FENCE round the south-west corner of Corpus 1 (OSM w141425875, 2.2 m high, 5 vertices wrapping the gable ~4 m out): a rough-plaster plinth wall 0.75 m high, stucco piers 0.55 m square and 2.1 m
//   high every ~3.3 m with a pyramid cap, and between them the black iron grille (spear tips, rings on the middle rail: the 'grille' alpha cut-out), photos 63 and leti/02.  Everything on the detail collector.
//   Road integrity: a pier or wall piece whose centre lies on a carriageway (net.cover) is skipped.  Solid collider boxes along the wall (nobody climbs the fence).
import { frustum } from './geo.js';
import { onRoad } from './frame.js';
import { boxL } from './shell.js';
import { Frame } from './frame.js';

export const FENCE_SW = [[-1763.9, -4316.2], [-1765.9, -4295.6], [-1760.9, -4292.1], [-1743.2, -4297.8], [-1743.7, -4299.2]];

export function build(K) {
  const ctx = K.ctx, D = K.D, M = K.M;
  let skipped = 0, piers = 0;
  for (let s = 0; s + 1 < FENCE_SW.length; s++) {
    const a = FENCE_SW[s], b = FENCE_SW[s + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 0.8) continue;
    const ux = dx / len, uz = dz / len, rot = Math.atan2(-uz, ux), n = Math.max(1, Math.round(len / 3.3)), fr = new Frame(a[0], a[1], rot);
    const bay = len / n;
    if (onRoad(ctx, a[0] + dx / 2, a[1] + dz / 2, 0.2)) { skipped++; continue; }
    D.push(a[0], 0, a[1], rot);
    D.box(M.pier, 0, len, 0, 0.72, -0.17, 0.17, 'b', 1.5);                                                      // the plinth wall
    D.box(M.pier, 0, len, 0.72, 0.8, -0.22, 0.22, 'b', 1.5);                                                    // its cap slab
    for (let i = 0; i <= n; i++) {                                                                             // piers (the joint pier of two segments is drawn by both: skip the first of each segment but the first)
      if (i === 0 && s > 0) continue;
      const x = i * bay;
      D.box(M.pier, x - 0.28, x + 0.28, 0, 1.85, -0.28, 0.28, 'b', 1.5);
      D.box(M.pier, x - 0.34, x + 0.34, 1.85, 2.0, -0.34, 0.34, 'b', 1.5);
      frustum(D, M.pier, x, 0, 2.0, 2.4, 4, 0.34 * 1.4142, 0.0, Math.PI / 4, 1, 1);
      piers++;
    }
    for (let i = 0; i < n; i++) {                                                                              // the grille between the piers
      const x0 = i * bay + 0.28, x1 = (i + 1) * bay - 0.28;
      D.quad(M.grille, [x0, 0.8, 0], [x1, 0.8, 0], [x1, 1.85, 0], [x0, 1.85, 0], [0, 0, 1], [[0, 0], [(x1 - x0) / 3.0, 0], [(x1 - x0) / 3.0, 0.7], [0, 0.7]]);
    }
    D.pop();
    boxL(ctx, fr, len / 2, 0, len, 0.5, 0, 2.0);
  }
  K.svc.fences = (K.svc.fences || []).concat([{ id: 'w141425875', pts: FENCE_SW, h: 2.2 }]);
  if (typeof process !== 'undefined' && process.env && process.env.LETI_DEBUG) console.log('[landmarksLETI] fence piers', piers, 'segments skipped (road)', skipped);
}
