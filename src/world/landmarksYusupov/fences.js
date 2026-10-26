// landmarksYusupov/fences.js - black wrought-iron fences between granite posts (the palace estate: spear tips, 2 m, photo 42 / 47) and the low ring-and-arc railing of the street kerb (photo 39).
// `spearFence(K, a, b, o)` draws one straight run in the Parts frame of the segment and adds its collider; o = { h, plinth, gap, post, collide }.
import * as THREE from 'three';
import { frameAngle, dist } from './lines.js';

const RING = new THREE.TorusGeometry(0.13, 0.014, 4, 10);

export function spearFence(K, a, b, o = {}) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const l = dist(a, b); if (l < 0.5) return;
  const h = o.h ?? 1.85, plinth = o.plinth ?? 0.45, gap = o.gap ?? 3.0, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
  P.push(a[0], 0, a[1], frameAngle(tx, tz));
  if (plinth > 0) P.box(M.graniteWarm, 0, l, 0, plinth, -0.18, 0.18, 'b');
  P.box(M.iron, 0, l, plinth + 0.1, plinth + 0.15, -0.025, 0.025, ''); P.box(M.iron, 0, l, plinth + h - 0.2, plinth + h - 0.15, -0.025, 0.025, '');
  const m = Math.max(2, Math.round(l / 0.14));
  for (let k = 0; k <= m; k++) { const x = k / m * l; P.box(M.iron, x - 0.011, x + 0.011, plinth, plinth + h, -0.011, 0.011, 'bt'); P.cyl(M.iron, [x, plinth + h, 0], [x, plinth + h + 0.23, 0], 0.026, 0.002, 4, false); }
  const np = Math.max(1, Math.round(l / gap));
  for (let k = 0; k <= np; k++) { const x = k / np * l; P.box(M.graniteWarm, x - 0.2, x + 0.2, 0, plinth + h + 0.1, -0.2, 0.2, 'b'); P.cyl(M.graniteWarm, [x, plinth + h + 0.1, 0], [x, plinth + h + 0.4, 0], 0.17, 0.04, 6, false); }
  P.pop();
  if (o.collide !== false) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.2, 0.4, frameAngle(tx, tz), 0, plinth + h + 0.4);
}

/** the low street-kerb railing (1.0 m, linked rings under a top rail, granite stumps every 3 m) */
export function kerbRail(K, a, b, o = {}) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const l = dist(a, b); if (l < 0.5) return;
  const h = o.h ?? 0.95, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
  P.push(a[0], 0, a[1], frameAngle(tx, tz));
  P.box(M.iron, 0, l, h - 0.05, h, -0.03, 0.03, ''); P.box(M.iron, 0, l, 0.18, 0.22, -0.02, 0.02, '');
  const n = Math.max(2, Math.round(l / 0.32));
  for (let k = 0; k < n; k++) { const x = (k + 0.5) / n * l; P.geo(M.iron, RING, x, h - 0.2, 0); P.box(M.iron, x - 0.012, x + 0.012, 0.22, h - 0.33, -0.012, 0.012, 'bt'); }
  const np = Math.max(1, Math.round(l / 3.0));
  for (let k = 0; k <= np; k++) { const x = k / np * l; P.box(M.graniteWarm, x - 0.17, x + 0.17, 0, h + 0.25, -0.17, 0.17, 'b'); }
  P.pop();
  if (o.collide !== false) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.2, 0.34, frameAngle(tx, tz), 0, 1.2);
}
