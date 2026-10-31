// landmarksTVTower/fence.js - the fence of the tower territory: a hexagon of circumradius FENCE_R round the six feet (the site is closed to visitors: exterior only), pale blue-grey painted pickets
// (#aebcc4, the same fence as along Aptekarskaya nab., photo refs/aptekarsky/71) between steel posts every ~2.7 m with three rails; 1.9 m high on a low concrete kerb.
// Returns the six sides (local x / z of both ends) for the colliders of the module.
import { corner, lerp } from './frame.js';

export const FENCE_R = 34;

export function fence(P, M, svc) {
  const sides = [];
  for (let k = 0; k < 6; k++) {
    const a = corner(k, FENCE_R), b = corner((k + 1) % 6, FENCE_R), L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 2.7);
    sides.push({ a, b });
    // kerb + rails
    const kerb = (y0, y1, t) => P.bar(M.conc, [a[0], (y0 + y1) / 2, a[1]], [b[0], (y0 + y1) / 2, b[1]], 0.3, 0.3);
    void kerb;
    P.bar(M.conc, [a[0], 0.12, a[1]], [b[0], 0.12, b[1]], 0.3);
    for (const y of [0.45, 1.0, 1.82]) P.bar(M.fence, [a[0], y, a[1]], [b[0], y, b[1]], 0.06);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
      P.bar(M.steelMid, [x, 0, z], [x, 1.95, z], 0.1);
    }
    // pickets every ~0.5 m
    const np = Math.round(L / 0.66);
    for (let i = 1; i < np; i++) {
      const t = i / np, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
      P.bar(M.fence, [x, 0.27, z], [x, 1.86, z], 0.035);
    }
  }
  svc.fence = { sides, r: FENCE_R };
}
