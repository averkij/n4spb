// bridges/kamenny/wing.js - closeBankFollow(o): a copy of bridges/long.js closeBank() (same options, same wing wall + collider) whose bank line is TRACKED: bankU() looks only 9 m either side of its guess, and the
// Kamennoostrovsky / Ushakovsky shores turn away from the deck end at ~45 deg, so the fixed guess lost the bank after ~9 m and the wing ran straight on over land / water (environment-banks.mjs zone walk: open edges at |v| 24 m).
import { frameOf } from '../sites.js';
import { bankU } from '../long.js';

export function closeBankFollow(o) {
  const { site, L, sg, v0, dir } = o, f = frameOf(site), world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const pts = [];
  { let g = o.u; for (let k = 0; k <= 28; k++) { const v = sg * (v0 + k * 0.5), u = bankU(L, site, v, g, dir); if (u !== null) g = u; pts.push(u === null ? null : [u, v]); } }      // (the bank line is FOLLOWED: the guess is the last bank found, so a shore that turns away from the deck end is tracked beyond the 9 m window of bankU)
  let last = null; for (let k = 0; k < pts.length; k++) { if (pts[k]) last = pts[k][0]; else if (last !== null) pts[k] = [last, sg * (v0 + k * 0.5)]; }
  if (!pts[0]) { const first = pts.find((q) => q); if (!first) return 0; for (let k = 0; k < pts.length && !pts[k]; k++) pts[k] = [first[0], sg * (v0 + k * 0.5)]; }
  const nDraw = Math.round((o.len || 3.4) / 0.5), yTop = o.yTop ?? 0.05, yb = o.yb ?? -4.7, th = 0.5;   // (o.yb: the foot of the wing face; a caller may stop it just under the water line so that no toon outline of an underwater edge shows through the water)
  if (o.P && o.draw !== false) {
    const P = o.P, M = o.M, mat = o.mat || M.granite, par = o.parapet || M.parapet;
    for (let k = 0; k < nDraw; k++) {
      const a = pts[k], b = pts[k + 1], ua = a[0] + dir * 0.12, ub = b[0] + dir * 0.12;                              // the face stands 0.12 m in front of the bank line (no sliver of water behind it)
      P.quad(mat, [ua, yb, a[1]], [ub, yb, b[1]], [ub, yTop, b[1]], [ua, yTop, a[1]], [dir, 0, 0], [[a[1] / 2.2, yb / 2.2], [b[1] / 2.2, yb / 2.2], [b[1] / 2.2, yTop / 2.2], [a[1] / 2.2, yTop / 2.2]]);
      P.quad(M.coping, [ua, yTop, a[1]], [ub, yTop, b[1]], [ub - dir * th, yTop, b[1]], [ua - dir * th, yTop, a[1]], [0, 1, 0]);
      for (const [du, nx] of [[0, dir], [-dir * th, -dir]]) P.quad(par, [ua + du, yTop, a[1]], [ub + du, yTop, b[1]], [ub + du, yTop + 1.0, b[1]], [ua + du, yTop + 1.0, a[1]], [nx, 0, 0], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
      P.quad(M.coping, [ua + dir * 0.03, yTop + 1.0, a[1]], [ub + dir * 0.03, yTop + 1.0, b[1]], [ub - dir * (th + 0.03), yTop + 1.0, b[1]], [ua - dir * (th + 0.03), yTop + 1.0, a[1]], [0, 1, 0]);
    }
    const e = pts[nDraw], ue = e[0] + dir * 0.12;                                                                    // the end face of the wing
    P.quad(par, [ue, yTop, e[1]], [ue - dir * th, yTop, e[1]], [ue - dir * th, yTop + 1.0, e[1]], [ue, yTop + 1.0, e[1]], [0, 0, sg], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
  }
  let n = 0;
  if (o.ph && o.collide !== false) {
    const ph = o.ph, probe = { x: 0, z: 0 };
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], um = (a[0] + b[0]) / 2 - dir * 0.15, vm = (a[1] + b[1]) / 2, w = world(um, vm);
      if (k >= nDraw) { probe.x = w.x; probe.z = w.z; ph.resolve(probe, 0.25, 0, 1.7); if (Math.hypot(probe.x - w.x, probe.z - w.z) > 0.04) break; }   // the quay collider of the environment takes over
      const rot = Math.atan2(-(b[0] - a[0]) * f.s - (b[1] - a[1]) * f.c, (b[0] - a[0]) * f.c - (b[1] - a[1]) * f.s);
      ph.addBox(w.x, w.z, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.3, 0.5, rot, -8, yTop + 1.25); n++;
    }
  }
  return n;
}
