// landmarksTVTower/trunk.js - the six-leg lattice trunk of the Leningrad TV tower: legs (a pair of chords laced together), the six faces (horizontal ties every ~5 m and X bracing), the five
// walkway rings with railing and brackets, the radial spokes to the shaft, the foundation pads, the skirt struts and the collar under the lantern.
// Dimensions: frame.js (r(y), levels).  Photos refs/aptekarsky/B3 (base, mid, platforms), 67 (night: ring spacing).  [E] the lacing / bracing pattern is a simplification of the photo: a single
// X per panel, the leg pair 1.2 -> 0.75 m apart.  ~16 k triangles.
import { corner, tangent, rAt, KINK_Y, PANEL_Y, PANEL_N, PLATFORMS, SHAFT_R, TRUNK_TOP, lerp } from './frame.js';

const at = (xz, y) => [xz[0], y, xz[1]];
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];

export function trunk(P, D, M, svc) {
  const tally = svc.trunkTris = {}; let mark = P.tris + D.tris; const lap = (n) => { const t = P.tris + D.tris; tally[n] = Math.round(t - mark); mark = t; };
  // ---- the levels of the face lattice
  const levels = [];
  for (let i = 0; i < PANEL_N.length; i++) for (let j = 0; j < PANEL_N[i]; j++) levels.push(lerp(PANEL_Y[i], PANEL_Y[i + 1], j / PANEL_N[i]));
  levels.push(PANEL_Y[PANEL_Y.length - 1]);
  const tH = (y) => lerp(0.3, 0.17, y / TRUNK_TOP), tD = (y) => lerp(0.24, 0.13, y / TRUNK_TOP);
  const off = (y) => lerp(0.62, 0.36, y / TRUNK_TOP), legR = (y) => lerp(0.3, 0.17, y / TRUNK_TOP);

  // ---- faces: ties + X bracing (the second diagonal is pushed 0.9 t towards the axis so that two bars never share a plane)
  for (let k = 0; k < 6; k++) {
    const k1 = (k + 1) % 6;
    for (let i = 0; i < levels.length; i++) {
      const ya = levels[i], ra = rAt(ya), A0 = corner(k, ra), A1 = corner(k1, ra);
      P.bar(M.steel, at(A0, ya), at(A1, ya), tH(ya));
      if (i + 1 >= levels.length) break;
      const yb = levels[i + 1], rb = rAt(yb), B0 = corner(k, rb), B1 = corner(k1, rb);
      const mx = (A0[0] + A1[0]) / 2, mz = (A0[1] + A1[1]) / 2, ml = Math.hypot(mx, mz) || 1, inw = [-mx / ml, -mz / ml], t = tD((ya + yb) / 2);
      P.bar(M.steel, at(A0, ya), at(B1, yb), t);
      const d = 0.9 * t;
      P.bar(M.steel, at(add(A1, inw, d), ya), at(add(B0, inw, d), yb), t);
    }
  }

  lap('faces');
  // ---- legs: two chords per corner (tangent offset), laced every ~2.5 m
  for (let k = 0; k < 6; k++) {
    const tg = tangent(k);
    for (const s of [-1, 1]) {
      for (let i = 0; i + 1 < KINK_Y.length; i++) {
        const ya = KINK_Y[i], yb = KINK_Y[i + 1];
        const pa = add(corner(k, rAt(ya)), tg, s * off(ya)), pb = add(corner(k, rAt(yb)), tg, s * off(yb));
        P.tube(M.steel, at(pa, ya), at(pb, yb), legR(ya), legR(yb), 6);
      }
    }
    const nL = Math.ceil(TRUNK_TOP / 3.4), dy = TRUNK_TOP / nL;
    for (let j = 0; j < nL; j++) {
      const ya = j * dy, yb = ya + dy, ra = rAt(ya), rb = rAt(yb), sg = j % 2 ? 1 : -1;
      const a = add(corner(k, ra), tg, sg * off(ya)), b = add(corner(k, rb), tg, -sg * off(yb));
      D.bar3(M.steelMid, at(a, ya), at(b, yb), 0.11);
      if (j % 3 === 0) D.bar3(M.steelMid, at(add(corner(k, rb), tg, -off(yb)), yb), at(add(corner(k, rb), tg, off(yb)), yb), 0.11);
    }
  }

  lap('legs');
  // ---- walkway rings: deck, rim, railing, brackets, spokes to the shaft
  for (const y of PLATFORMS) {
    const r = rAt(y), rin = r + 0.05, rout = r + 1.35 / 0.866;
    const inn = [], out = [];
    for (let k = 0; k < 6; k++) { inn.push(corner(k, rin)); out.push(corner(k, rout)); }
    for (let k = 0; k < 6; k++) {
      const k1 = (k + 1) % 6, a = inn[k], b = inn[k1], c = out[k1], d = out[k];
      P.quad(M.steelDk, at(a, y), at(b, y), at(c, y), at(d, y), [0, 1, 0]);
      P.quad(M.steelDk, at(a, y - 0.12), at(b, y - 0.12), at(c, y - 0.12), at(d, y - 0.12), [0, -1, 0]);
      const mx = (d[0] + c[0]) / 2, mz = (d[1] + c[1]) / 2;
      P.quad(M.steelMid, at(d, y - 0.12), at(c, y - 0.12), at(c, y + 0.18), at(d, y + 0.18), [mx, 0, mz]);
      // railing: posts every ~2.6 m, top and middle rail
      const L = Math.hypot(c[0] - d[0], c[1] - d[1]), n = Math.max(2, Math.round(L / 3.4));
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = [lerp(d[0], c[0], t), lerp(d[1], c[1], t)];
        D.bar3(M.steelMid, at(p, y + 0.18), at(p, y + 1.1), 0.07);
        if (i < n) {
          const q = [lerp(d[0], c[0], (i + 1) / n), lerp(d[1], c[1], (i + 1) / n)];
          D.bar(M.steelMid, at(p, y + 1.1), at(q, y + 1.1), 0.06);
          // bracket under the deck: from the lattice plane (1.5 m lower) out to the rim
          const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], ml = Math.hypot(mid[0], mid[1]) || 1, inw = [-mid[0] / ml, -mid[1] / ml];
          D.bar3(M.steelDk, at(add(mid, inw, 1.45), y - 1.5), at(mid, y - 0.12), 0.12);
        }
      }
    }
    // spokes: corner -> shaft (a thick tie at the deck level) and a diagonal up / down to the shaft
    for (let k = 0; k < 6; k++) {
      const c = corner(k, r - 0.3), sh = corner(k, SHAFT_R + 0.05), th = y === PLATFORMS[0] ? 0.46 : 0.3;
      P.bar(M.steelDk, at(c, y - 0.35), at(sh, y - 0.35), th);
      D.bar(M.steelMid, at(corner(k, r - 0.3), y - 0.2), at(corner(k, SHAFT_R + 0.05), y + 6.5), th * 0.6);
      D.bar(M.steelMid, at(corner(k, r - 0.3), y - 0.5), at(corner(k, SHAFT_R + 0.05), y - 6.5), th * 0.6);
    }
  }

  lap('rings');
  // ---- feet: foundation pads (square, turned with the leg), shoes, the ground ties and the skirt struts to the foot of the shaft
  const feet = [];
  for (let k = 0; k < 6; k++) {
    const r0 = rAt(0), c = corner(k, r0), a = k * Math.PI / 3;
    P.prism(M.conc, 2.1, 0, 0.9, { n: 4, phase: a + Math.PI / 4, cx: c[0], cz: c[1] });
    const tg = tangent(k);
    for (const s of [-1, 1]) { const p = add(c, tg, s * off(0)); P.prism(M.steelDk, 0.62, 0.9, 1.25, { n: 4, phase: a + Math.PI / 4, cx: p[0], cz: p[1] }); }
    feet.push(c);
    const k1 = (k + 1) % 6, c1 = corner(k1, r0);
    P.bar(M.conc, at(c, 0.3), at(c1, 0.3), 0.6);                               // ground tie beam (the hexagon of the OSM footprint)
    P.bar(M.steelDk, at(corner(k, r0 - 2), 1.2), at(corner(k, 4.2), 1.6), 0.5);       // foot spoke to the pedestal
    P.bar(M.steelMid, at(corner(k, rAt(9)), 9), at(corner(k, 4.2), 4.0), 0.42);       // skirt strut
    P.bar(M.steelMid, at(corner(k, rAt(PLATFORMS[0]) - 0.3), PLATFORMS[0] - 0.4), at(corner(k, 4.2), 11.0), 0.42);
  }
  svc.feet = feet; lap('feet');

  // ---- collar under the lantern (box girder ring joining the six legs)
  const rt = rAt(TRUNK_TOP);
  for (let k = 0; k < 6; k++) P.bar(M.steelDk, at(corner(k, rt), TRUNK_TOP - 1.0), at(corner((k + 1) % 6, rt), TRUNK_TOP - 1.0), 0.8, 0.8, true);
}
