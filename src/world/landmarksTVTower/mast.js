// landmarksTVTower/mast.js - the antenna mast above the lantern (200.8 -> 310 m square lattice, 310 -> 326 m the spire; [W] 126 m of antenna since the 2011 broadband antenna, OSM w192468855 = the
// "10.3 m" body 0..310 m, w192468854 = the spire 310..326 m).  Present state [V refs aptekarsky 69 70, SP/tvt t04 t06]: a square lattice BOX, ~10 m at the lantern roof and ~8.6 m under the top platform
// (it hardly tapers), in aviation bands white / red (frame.js MAST_BANDS), corner legs + X bracing + plan crosses, orange / cream antenna panels on the corners of the lower part, railed platforms at
// 232 / 272 / 310 m.  The top platform carries a bronze cone, the spire = four white and three cream square-section drums (antenna panels), an orange head, a thin cross arm and a rod.  No lights.
import { MAST_BANDS, MAST_W0, MAST_W1, MAST_PLATFORMS, MAST_Y0, SPIRE, lerp } from './frame.js';

export function mast(P, M, svc) {
  const top = MAST_BANDS[MAST_BANDS.length - 1][1], H = top - MAST_Y0;
  const w = (y) => lerp(MAST_W0, MAST_W1, (y - MAST_Y0) / H);
  const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  MAST_BANDS.forEach(([y0, y1, c], bi) => {
    const mat = c === 'r' ? M.red : M.shaft, matDk = c === 'r' ? M.redDk : M.steelMid, h = y1 - y0, n = Math.max(2, Math.round(h / 3.8));
    const tL = 0.42, tH = 0.2, tD = 0.14;
    for (const [sx, sz] of cs) P.bar(mat, [sx * w(y0), y0, sz * w(y0)], [sx * w(y1), y1, sz * w(y1)], tL, tL, true);
    for (let j = 0; j <= n; j++) {
      const ya = lerp(y0, y1, j / n), wa = w(ya);
      for (let e = 0; e < 4; e++) {
        const a = cs[e], b = cs[(e + 1) % 4];
        if (j > 0 || bi === 0) P.bar(mat, [a[0] * wa, ya, a[1] * wa], [b[0] * wa, ya, b[1] * wa], tH);
        if (j < n) {
          const yb = lerp(y0, y1, (j + 1) / n), wb = w(yb), inx = -(a[0] + b[0]) / 2, inz = -(a[1] + b[1]) / 2, d = 0.9 * tD;
          P.bar(mat, [a[0] * wa, ya, a[1] * wa], [b[0] * wb, yb, b[1] * wb], tD);
          P.bar(mat, [b[0] * wa + inx * d, ya, b[1] * wa + inz * d], [a[0] * wb + inx * d, yb, a[1] * wb + inz * d], tD);
        }
      }
      // plan bracing: a cross inside every second level
      if (j > 0 && j < n && j % 2 === 0) { P.bar3(matDk, [-wa, ya - 0.3, -wa], [wa, ya - 0.3, wa], 0.12); P.bar3(matDk, [wa, ya - 0.5, -wa], [-wa, ya - 0.5, wa], 0.12); }
    }
  });

  // ---- railed platforms (deck, kick plate, two rails, posts) at the band joints and on top
  for (const y of MAST_PLATFORMS) {
    const o = w(y) + 0.9, top = y === MAST_PLATFORMS[MAST_PLATFORMS.length - 1];
    P.box(M.steelDk, -o, o, y - 0.12, y + 0.08, -o, o);
    if (top) P.box(M.steelDk, -o - 0.2, o + 0.2, y - 0.45, y - 0.12, -o - 0.2, o + 0.2);      // the heavy edge girder of the top platform [V t06]
    for (const [a, b] of [[[-o, -o], [o, -o]], [[o, -o], [o, o]], [[o, o], [-o, o]], [[-o, o], [-o, -o]]]) {
      P.bar(M.steelMid, [a[0], y + 1.05, a[1]], [b[0], y + 1.05, b[1]], 0.05);
      P.bar(M.steelMid, [a[0], y + 0.5, a[1]], [b[0], y + 0.5, b[1]], 0.04);
      const n = Math.max(2, Math.round(2 * o / 2.6));
      for (let j = 0; j < n; j++) { const t = j / n, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; P.bar3(M.steelMid, [p[0], y + 0.08, p[1]], [p[0], y + 1.05, p[1]], 0.06); }
    }
  }
  // ---- antenna panels: vertical boxes on the corners and the faces of the lower part [V 69]
  const panel = (x, z, y0, h, wx, wz, m) => P.box(m, x - wx / 2, x + wx / 2, y0, y0 + h, z - wz / 2, z + wz / 2);
  for (const [sx, sz] of cs) {
    const w0 = w(210);
    panel(sx * (w0 + 0.45), sz * (w0 * 0.55), 206, 5.2, 0.5, 0.9, M.orange);
    panel(sx * (w0 * 0.55), sz * (w0 + 0.45), 214, 5.2, 0.9, 0.5, M.cream);
    panel(sx * (w0 + 0.4), sz * (w0 * 0.3), 221.5, 4.6, 0.5, 0.8, M.orange);
    panel(sx * (w(240) + 0.4), sz * 1.2, 241, 4.2, 0.45, 0.7, M.orange);
    panel(sx * (w(262) + 0.4), sz * 1.0, 258, 3.6, 0.45, 0.7, M.cream);
  }

  // ---- the top: bronze cone on the platform, then the spire 310 -> 326 [V 70 t06]: white and cream square-section drums, orange head, cross arm, rod
  const [s0, s1] = SPIRE;
  P.cyl(M.bronze, 0, 0, s0 + 0.08, s0 + 3.0, 3.4, 1.0, 12, true);
  const sq = (mat, y0, y1, hw) => P.box(mat, -hw, hw, y0, y1, -hw, hw);
  for (let j = 0; j < 4; j++) sq(j % 2 ? M.steel : M.shaft, s0 + 3.0 + j * 1.5, s0 + 3.0 + (j + 1) * 1.5 - 0.06, 0.95);
  for (let j = 0; j < 3; j++) sq(M.cream, s0 + 9.0 + j * 1.3, s0 + 9.0 + (j + 1) * 1.3 - 0.06, 1.0);
  sq(M.orange, s0 + 12.9, s0 + 14.6, 0.95);
  P.bar(M.steelDk, [-2.4, s0 + 14.9, 0], [2.4, s0 + 14.9, 0], 0.12, 0.12, true);
  P.bar(M.orange, [0, s0 + 14.6, 0], [0, s1, 0], 0.12, 0.06, true);
  svc.mast = { y0: MAST_Y0, y1: s1 };
}
