// landmarksKamennyDachasEast/fence.js - the FENCES of the Oldenburg plot (photos O05 O06 O07 O12 S03): the plot of the dacha is a construction site (restoration since 2021) behind a green plank fence 2.4 m high on its whole
// perimeter; along the river front (the mapped wall OSM w640543965, 125 m, in front of the dacha, behind the public embankment path) a black iron fence of spear tips and pine-cone finial posts on a granite curb
// stands 0.5 m in front of the planks (O07 O12).  Lines are the OSM ways (local metres): RIVER = w640543965 (iron + planks), WEST = w741702547 and NORTH = w640543962 (planks only).  Solid: the colliders are in walk.js.
import { Q } from './facade.js';
import * as Lay from '../layout.js';

export const RIVER = [[-2945.3, -5069.3], [-2948.5, -5067.1], [-2951.0, -5065.8], [-2953.3, -5064.6], [-2996.5, -5040.4], [-3038.9, -5016.6], [-3041.3, -5015.6], [-3043.5, -5016.2], [-3045.4, -5018.1]];
export const WEST = [[-3045.4, -5018.1], [-3074.3, -5061.5], [-3074.5, -5065.3], [-3072.0, -5069.2], [-3083.3, -5093.9]];
export const NORTH = [[-3055.2, -5147.9], [-2993.8, -5167.7], [-2942.9, -5150.8], [-2908.7, -5091.0], [-2908.6, -5089.1], [-2909.3, -5087.3], [-2944.4, -5067.4], [-2948.5, -5067.1]];
export const PLANK_H = 2.4, IRON_H = 1.5, CURB_H = 0.25, IRON_OFF = 0.55;
const TOWARD = [0.5807, 0.8141];                                            // local +z of the dacha frame = toward the river

export async function build(K) {
  const { M, P, N } = K;
  const planks = (pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.2) continue;
      const rot = Math.atan2(-dz, dx), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
      P.push(cx, 0, cz, rot);
      P.box(M.plank, -L / 2, L / 2, 0, PLANK_H, -0.04, 0.04, '', 1.44);
      P.box(M.dark, -L / 2, L / 2, PLANK_H, PLANK_H + 0.07, -0.07, 0.07, 'b', 1);                              // the cap board
      P.pop();
    }
    for (const p of pts) { P.push(p[0], 0, p[1], 0); P.box(M.plank, -0.09, 0.09, 0, PLANK_H + 0.12, -0.09, 0.09, 'b', 1.44); P.pop(); }
  };
  planks(RIVER); planks(WEST); planks(NORTH);
  // ---- the iron fence in front of the river planks: a granite curb, bays of 2.4 m (the cut-out sheet), square posts with a pine-cone finial
  for (let i = 0; i + 1 < RIVER.length; i++) {
    const a = RIVER[i], b = RIVER[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 1.5) continue;
    const ux = dx / L, uz = dz / L;
    let nx = -uz, nz = ux; if (nx * TOWARD[0] + nz * TOWARD[1] < 0) { nx = -nx; nz = -nz; }                  // the normal pointing to the river
    const rot = Math.atan2(-dz, dx), cx = (a[0] + b[0]) / 2 + nx * IRON_OFF, cz = (a[1] + b[1]) / 2 + nz * IRON_OFF;
    P.push(cx, 0, cz, rot); N.push(cx, 0, cz, rot);
    const nb = Math.max(1, Math.round(L / 2.4)), k = L / nb;
    // a bay is dropped where a drive crosses the line (road integrity: nothing on a carriageway; the plank fence behind stays closed: a plank gate)
    const wx = (u) => [a[0] + ux * (u + L / 2) + nx * IRON_OFF, a[1] + uz * (u + L / 2) + nz * IRON_OFF];
    const onRd = (u) => { const q = wx(u); return Lay.isOnRoad(q[0], q[1], 0.7); };
    const bayOn = Array.from({ length: nb }, (_, j) => { const x0 = -L / 2 + j * k; for (let s = 0; s <= 4; s++) if (onRd(x0 + k * s / 4)) return false; return true; });
    for (let j = 0; j < nb; j++) {
      if (!bayOn[j]) continue;
      const x0 = -L / 2 + j * k, x1 = x0 + k;
      P.box(M.granite, x0, x1, 0, CURB_H, -0.12, 0.12, 'b', 1.8);
      Q(P, M.fenceO, [x0, CURB_H, 0], [x1, CURB_H, 0], [x1, CURB_H + IRON_H, 0], [x0, CURB_H + IRON_H, 0], [0, 0, 1]);
    }
    for (let j = 0; j <= nb; j++) {
      if (!(bayOn[j] || bayOn[j - 1])) continue;
      const x = -L / 2 + j * k;
      P.box(M.iron, x - 0.04, x + 0.04, CURB_H, CURB_H + IRON_H + 0.05, -0.04, 0.04, 'b', 1);
      N.cyl(M.iron, [x, CURB_H + IRON_H + 0.05, 0], [x, CURB_H + IRON_H + 0.3, 0], 0.085, 0.0, 6, false);           // the pine-cone finial
      N.cyl(M.iron, [x, CURB_H + IRON_H + 0.05, 0], [x, CURB_H + IRON_H + 0.09, 0], 0.11, 0.11, 6, true);
    }
    P.pop(); N.pop();
  }
}
