// landmarksBotanicalGarden/stolypin.js - the STOLYPIN MONUMENT: the granite obelisk to the victims of the explosion of 12 Aug 1906 at P. A. Stolypin's dacha (OSM n4119369495 (-1335.0, -4543.3), "Памятник жертвам взрыва
// на даче П. А. Столыпина", R. Marfeld's design of 1908, restored 2006; dossier 4.1b "Stolypin site", photo B0): a pink-grey granite obelisk (about 5 m) on a two-step base with a plinth block and two low
// shoulders, a tapering shaft with a bronze bas-relief plaque, a pyramidion; round it on the small lawn of the square (w158590791) a low fence of dark-green cast-iron posts with balls and sagging chains.
// The front (plaque) faces the Aptekarskaya embankment (the nearest road).  The square's lawn, paths and trees are the environment's; the 6-storey house behind (w49907648) is generic.
import { Frame } from './frame.js';
import { stage } from './shell.js';
import { revolve } from './geo.js';
import * as L from '../layout.js';

const X = -1335.0, Z = -4543.3;

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  let yaw = 0;
  try { const r = L.roadsNear(X, Z, 90, { drivable: true, name: 'Аптекарская набережная' })[0]; if (r) yaw = Math.atan2(r.x - X, r.z - Z); } catch (e) { /* layout without roads: face south */ }
  const fr = new Frame(X, Z, yaw);
  stage(K, 'obelisk', () => {
    P.push(X, 0, Z, yaw);
    P.box(M.graniteP, -1.45, 1.45, 0, 0.5, -0.95, 0.95, 'b', 2);                          // the base slab
    P.box(M.graniteP, -1.1, 1.1, 0.5, 0.85, -0.68, 0.68, 'b', 2);                         // the second step
    P.box(M.graniteP, -0.85, 0.85, 0.85, 1.65, -0.46, 0.46, 'b', 2);                      // the plinth block
    for (const s of [-1, 1]) P.box(M.graniteP, s > 0 ? 0.85 : -1.12, s > 0 ? 1.12 : -0.85, 0.85, 1.35, -0.46, 0.46, 'b', 2);    // the two shoulders (one each side)
    // the shaft: a tapering rectangular prism, 1.15 x 0.7 at 1.65 m to 0.6 x 0.38 at 4.4 m, then the pyramidion
    const y0 = 1.65, y1 = 4.4, w0 = 0.575, d0 = 0.35, w1 = 0.3, d1 = 0.19;
    const c = (w, d, y) => [[-w, y, -d], [w, y, -d], [w, y, d], [-w, y, d]];
    const a = c(w0, d0, y0), b = c(w1, d1, y1), apex = [0, 4.98, 0];
    const mats = M.graniteP;
    const quad = (p0, p1, p2, p3, n) => P.quad(mats, p0, p1, p2, p3, n, [[0, p0[1] / 2], [0.5, p1[1] / 2], [0.5, p2[1] / 2], [0, p3[1] / 2]]);
    quad(a[3], a[2], b[2], b[3], [0, 0.05, 1]); quad(a[1], a[0], b[0], b[1], [0, 0.05, -1]); quad(a[2], a[1], b[1], b[2], [1, 0.05, 0]); quad(a[0], a[3], b[3], b[0], [-1, 0.05, 0]);
    for (let i = 0; i < 4; i++) { const p = b[i], q = b[(i + 1) % 4]; P.fan(mats, [p, q, apex], [(p[0] + q[0]) / 2, 0.5, (p[2] + q[2]) / 2], (r) => [r[0], r[1]]); }
    // the bas-relief plaque on the front of the shaft: a bronze panel (a decal 3 cm proud)
    const t = (y) => (y - y0) / (y1 - y0), zf = (y) => d0 + (d1 - d0) * t(y) + 0.03;
    P.quad(M.plaques, [-0.36, 1.95, zf(1.95)], [0.36, 1.95, zf(1.95)], [0.36, 2.95, zf(2.95)], [-0.36, 2.95, zf(2.95)], [0, 0.05, 1], [[0, 0], [1, 0], [1, 0.5], [0, 0.5]]);
    // the chain fence round the monument: posts at the corners and the middles of a 6.4 x 5.0 m rectangle in front of it, chains sagging 0.18 m
    const hx = 3.4, hz0 = -1.9, hz1 = 3.0, post = [];
    const corners = [[-hx, hz0], [hx, hz0], [hx, hz1], [-hx, hz1]];
    for (let i = 0; i < 4; i++) { const p = corners[i], q = corners[(i + 1) % 4], n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 1.9)); for (let k = 0; k < n; k++) post.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n, i, k, n]); }
    for (const [x, z] of post) {
      revolve(P, M.iron, [[0.13, 0], [0.09, 0.1], [0.075, 0.18], [0.05, 0.28], [0.05, 0.6], [0.08, 0.68], [0.05, 0.75], [0.07, 0.82], [0.08, 0.88], [0.06, 0.93], [0.0, 0.96]], 8, { cx: x, cz: z, crease: 35, uRep: 1, vTile: 1 });
    }
    for (let i = 0; i < post.length; i++) {
      const p = post[i], q = post[(i + 1) % post.length], seg = 4;
      let prev = [p[0], 0.78, p[1]];
      for (let s = 1; s <= seg; s++) { const u = s / seg, y = 0.78 - 0.18 * 4 * u * (1 - u), cur = [p[0] + (q[0] - p[0]) * u, y, p[1] + (q[1] - p[1]) * u]; P.cyl(M.iron, prev, cur, 0.014, 0.014, 4, false); prev = cur; }
    }
    P.pop();
    // colliders: the monument (a box over the base), the posts and chains as a thin ring
    ph.addBox(X, Z, 2.9, 1.9, yaw, 0, 5.0);
    for (const [x, z] of post) { const w = fr.w(x, z); ph.addCylinder(w[0], w[1], 0.12, 0, 0.95); }
    for (let i = 0; i < 4; i++) { const p = corners[i], q = corners[(i + 1) % 4], w = fr.w((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), l = Math.hypot(q[0] - p[0], q[1] - p[1]), vertical = Math.abs(q[0] - p[0]) < 0.01; ph.addBox(w[0], w[1], vertical ? 0.1 : l, vertical ? l : 0.1, yaw, 0, 0.8); }
  });
  const sp = fr.w(0, 9);
  K.svc.monuments.push({ id: 'n4119369495', name: 'Памятник жертвам взрыва на даче П. А. Столыпина', x: X, z: Z, h: 5.0, r: 3 });
  K.svc.photoSpots.push({ x: sp[0], z: sp[1], yaw: Math.round((yaw + Math.PI) * 180 / Math.PI), name: 'Памятник на месте взрыва на Аптекарском острове' });
  if (K.errs && K.errs.length) throw new Error('stolypin: ' + K.errs.join('\n'));
}
