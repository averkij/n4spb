// landmarksTVTower/lantern.js - the three-level hexagonal lantern at 185-201 m (OSM w192468856: 19.5 m across the corners, 185..201 m; [W] three levels from 187 m, the lower two empty):
// the cone under the first slab hides the top of the trunk, four cantilevered hexagonal slabs (grey-green steel, rim lighter) widen upwards (R 8.6 -> 9.75), between them a band of dark glass
// with white mullions, a white pipe at every corner and a pair of diagonal struts per face (a lambda, apex up) [V 68 69], a railing on the rim of every slab and two dishes on the roof.
// The mast stands on a square plate in the middle of the roof.  Night lighting of the lantern is NOT modelled (user rule: no flag colours, no aviation beacons).
import { LANT, TRUNK_TOP, rAt, corner, MAST_Y0 } from './frame.js';

const at = (xz, y) => [xz[0], y, xz[1]];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const scale = (p, s) => [p[0] * s, p[1] * s];
const lerp = (a, b, t) => a + (b - a) * t;

export function lantern(P, M, svc) {
  const [c0, c1] = LANT.cone, rt = rAt(TRUNK_TOP), r0 = LANT.slabs[0][2];
  // ---- cone: the trunk collar (r 8.1) widens to the first slab
  for (let k = 0; k < 6; k++) {
    const k1 = (k + 1) % 6, a0 = corner(k, rt), a1 = corner(k1, rt), b0 = corner(k, r0), b1 = corner(k1, r0), m = mid(b0, b1);
    P.quad(M.slab, at(a0, c0), at(a1, c0), at(b1, c1), at(b0, c1), [m[0], -0.5, m[1]]);
  }
  // ---- slabs
  for (let i = 0; i < LANT.slabs.length; i++) {
    const [y0, y1, R] = LANT.slabs[i];
    const rim = P.prism(M.slab, R, y0, y1, { top: false });
    P.cap(M.slabLt, rim, y1, true);
    // railing along the rim (posts at the corners and every ~2 m, top + middle rail)
    for (let k = 0; k < 6; k++) {
      const p = scale(corner(k, 1), R - 0.2), q = scale(corner((k + 1) % 6, 1), R - 0.2), L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.round(L / 2));
      for (let j = 0; j <= n; j++) {
        const t = j / n, a = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        P.bar(M.frame, at(a, y1), at(a, y1 + 1.05), 0.05);
        if (j < n) { const t2 = (j + 1) / n, b = [p[0] + (q[0] - p[0]) * t2, p[1] + (q[1] - p[1]) * t2]; P.bar(M.frame, at(a, y1 + 1.05), at(b, y1 + 1.05), 0.05); P.bar(M.frame, at(a, y1 + 0.55), at(b, y1 + 0.55), 0.04); }
      }
    }
  }
  // ---- glazed levels between the slabs: the glass leans with the inverted pyramid (bottom edge at the radius of the slab below, top edge at the radius of the slab above, both inset) [V 68 69]
  for (let i = 0; i + 1 < LANT.slabs.length; i++) {
    const ya = LANT.slabs[i][1], yb = LANT.slabs[i + 1][0], Rb = LANT.slabs[i][2] - LANT.glassInset, Rt = LANT.slabs[i + 1][2] - LANT.glassInset, h = yb - ya;
    const rad = (t) => lerp(Rb, Rt, t);                                    // glass-plane radius at the fraction t of the height
    for (let k = 0; k < 6; k++) {
      const pb = scale(corner(k, 1), Rb), qb = scale(corner((k + 1) % 6, 1), Rb), pt = scale(corner(k, 1), Rt), qt = scale(corner((k + 1) % 6, 1), Rt), m = mid(pb, qb);
      P.quad(M.glass, at(pb, ya), at(qb, ya), at(qt, yb), at(pt, yb), [m[0], 0, m[1]]);
      // mullions: three between the corner pipes, one transom at the middle
      for (let j = 1; j < 4; j++) {
        const t = j / 4, ab = [pb[0] + (qb[0] - pb[0]) * t, pb[1] + (qb[1] - pb[1]) * t], at2 = [pt[0] + (qt[0] - pt[0]) * t, pt[1] + (qt[1] - pt[1]) * t];
        P.bar(M.frame, at(scale(ab, 1 + 0.06 / Rb), ya), at(scale(at2, 1 + 0.06 / Rt), yb), 0.07);
      }
      const rm = rad(0.5), o1 = scale(corner(k, 1), rm * (1 + 0.06 / rm)), o2 = scale(corner((k + 1) % 6, 1), rm * (1 + 0.06 / rm));
      P.bar(M.frame, at(o1, ya + h * 0.5), at(o2, ya + h * 0.5), 0.07);
      // the lambda of two struts (standing 0.4 m outside the glass) and the corner pipe
      const out = (p, r, d) => scale(p, 1 + d / r);
      const ppb = out(pb, Rb, 0.4), qqb = out(qb, Rb, 0.4), ppt = out(pt, Rt, 0.4), qqt = out(qt, Rt, 0.4);
      const mmt = [(ppt[0] + qqt[0]) / 2, (ppt[1] + qqt[1]) / 2];
      P.tube(M.frame, at(ppb, ya + 0.15), at(mmt, yb - 0.15), 0.16, 0.16, 6);
      P.tube(M.frame, at(qqb, ya + 0.15), at(mmt, yb - 0.15), 0.16, 0.16, 6);
      P.tube(M.frame, at(ppb, ya), at(ppt, yb), 0.26, 0.26, 8);
    }
  }
  // ---- roof: mast plate, two dishes
  const ry = LANT.slabs[LANT.slabs.length - 1][1];
  P.box(M.steelDk, -5.4, 5.4, ry, ry + 0.5, -5.4, 5.4);
  for (const s of [-1, 1]) {
    const x = s * 7.4, z = 2.5, ny = 0.6;
    P.bar(M.frame, [x, ry + 1.05, z], [x, ry + 2.2, z], 0.12);
    P.tube(M.frame, [x, ry + 2.2, z], [x + s * 0.5, ry + 2.7, z], 0.1, 0.9, 12, true);
    void ny;
  }
  svc.lantern = { y0: c0, y1: ry, r: LANT.slabs[3][2] };
  void MAST_Y0;
}
