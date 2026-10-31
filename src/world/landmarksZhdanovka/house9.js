// landmarksZhdanovka/house9.js - ZHDANOVSKAYA EMBANKMENT No. 9, the MEISNER HOUSE (доходный дом А. Е. Мейснера, 1903, architect A. I. Styunkel [Stjunkel], regional heritage list since March 2023; OSM w55440259, 4 levels).
// Photos m02 (straight-on elevation, refs/petrovsky-zhdanovka-2026/misc) and m01 (the entrance arch).  Four storeys, 16.7 m wide, cornice 16.0 m above the pavement.  Measured on m02 (85 px per metre):
//   * ground floor 4.95 m: polished rose-granite plinth 1.3 m (three basement slits with bars), rock-faced courses above (rock texture), a smooth string course at 4.8-4.98 m, three windows between two ROUND ARCHES
//     (left r 1.45 m = the entrance with the carved oak double door in a cobbled recess and a granite step, right = the carriage way into the courtyard); each arch has a ring of eleven rock-faced voussoirs
//     and jamb blocks that stand out of the wall by different amounts, a hung black lantern in the left arch;
//   * above it three storeys of brown pebble-dash (#765a58), FIVE REAL WINDOWS per floor (holes in the wall, stone reveals, glass recessed 0.26 m, stone surround, sill; rows 2-3 under heavy rock-faced lintels), bronze
//     lion-mask plaques between them, the carved stucco frieze (one mask per 1.95 m) under the cornice;
//   * two three-sided ORIELS (erkers) of ochre-framed glass over three levels at both ends, cream plaster aprons; a copper-brown cornice on brackets, two low barrel-roofed dormers over the oriels, two gablets,
//     three brick chimneys, a thin roof rail, a zinc drain pipe at the right end.
// Back and side walls: the courtyard tile (envelope.js).  Solid: the arches are closed at the wall plane (the door and the carriage way are scenery).
import { edgeFrame } from './frame.js';
import { reveal, bayLevel, barrel, wallHoles, windowOpen, surround, downpipe } from './geom.js';
import { envelope } from './envelope.js';
import { hash } from './kit.js';
import { stepper } from './labels.js';

const HW = 15.3, HC = 16.0, HP = 1.3, HS = 4.95, HF = 14.55;
const ARCHES = [{ cx: 2.2, r: 1.45, yc: 2.15, depth: 1.7, door: true }, { cx: 14.8, r: 1.45, yc: 2.05, depth: 3.4, door: false }];
const BAYS = [{ cx: 2.2, w: 2.3 }, { cx: 14.6, w: 2.4 }];
const COLS = [4.47, 6.43, 8.37, 10.27, 12.17];
const ROWS = [[5.5, 7.5, true], [9.1, 11.1, true], [12.6, 14.5, false]];
const GROUND = [[5.5, 1.4], [8.5, 1.7], [11.5, 1.4]], GY0 = 2.1, GY1 = 3.95;
const SLITS = [5.5, 8.5, 11.5];

export function build(K, fp, edgeIdx) {
  const { P, M, svc } = K, e = fp.edges[edgeIdx], f = edgeFrame(e), len = f.len;
  K.shared.h9 = { f, len, arches: ARCHES };
  envelope(K, fp, { Hw: HW, Hc: HC, skip: new Set([edgeIdx]), roofMat: M.iron });
  P.push(f.S.x, 0, f.S.z, f.rot);
  P.far = Infinity;
  const arch = ARCHES.map((a) => ({ x0: a.cx - a.r, x1: a.cx + a.r, y0: 0, top: (x) => a.yc + Math.sqrt(Math.max(0, a.r * a.r - (x - a.cx) ** 2)), N: 16 }));
  // ---- the wall in four zones, windows cut out as holes
  wallHoles(P, M.plinth, 0, len, 0, HP, [...arch, ...SLITS.map((u) => ({ x0: u - 0.55, x1: u + 0.55, y0: 0.45, y1: 0.85 }))], (x, y) => [x / 1.9, y / 1.3]);
  wallHoles(P, M.rock, 0, len, HP, HS, [...arch, ...GROUND.map(([u, w]) => ({ x0: u - w / 2, x1: u + w / 2, y0: GY0, y1: GY1 }))], (x, y) => [x / 3.2, y / 2.6]);
  const up = [];
  for (const [yb, yt] of ROWS) for (const u of COLS) up.push({ x0: u - 0.47, x1: u + 0.47, y0: yb, y1: yt });
  wallHoles(P, M.pebble, 0, len, HS, HF, up, (x, y) => [x / 2, y / 2]);
  { const uo = 0.555 / 1.95; P.quad(M.frieze, [0, HF, 0], [len, HF, 0], [len, HW, 0], [0, HW, 0], [0, 0, 1], [[uo, 0], [uo + len / 1.95, 0], [uo + len / 1.95, 1], [uo, 1]]); }
  // ---- openings: reveals + recessed glass
  SLITS.forEach((u) => windowOpen(P, M.granite, M.slate, u - 0.55, u + 0.55, 0.45, 0.85, 0.2));
  GROUND.forEach(([u, w]) => windowOpen(P, M.granite, M.g9g, u - w / 2, u + w / 2, GY0, GY1, 0.3));
  ROWS.forEach(([yb, yt], ri) => COLS.forEach((u, ci) => windowOpen(P, M.stone, M[['g9a', 'g9b', 'g9c'][Math.floor(hash(ri, ci, 91) * 3)]], u - 0.47, u + 0.47, yb, yt, 0.26)));
  // ---- the two arches: reveals (cobbled), floor and back of each opening, the rock-faced ring and jambs
  const lines = ARCHES.map((a) => { const pts = [[a.cx - a.r, 0], [a.cx - a.r, a.yc]]; for (let k = 1; k < 16; k++) { const t = Math.PI - Math.PI * k / 16; pts.push([a.cx + a.r * Math.cos(t), a.yc + a.r * Math.sin(t)]); } pts.push([a.cx + a.r, a.yc], [a.cx + a.r, 0]); return pts; });
  lines.forEach((pts, i) => {
    const a = ARCHES[i];
    reveal(P, M.cobble, pts, a.depth, 8, 4);                                                   // v stays inside 0..1 (an atlas row: a larger v would wrap into the neighbouring row)
    P.quad(M.stone, [a.cx - a.r, 0.02, 0], [a.cx + a.r, 0.02, 0], [a.cx + a.r, 0.02, -a.depth], [a.cx - a.r, 0.02, -a.depth], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const back = pts.map((p) => [p[0], p[1], -a.depth]);
    if (a.door) {
      // the carved oak double door in the back plane (2.0 x 3.2 m with its arched transom) and the cobbled wall round it
      P.fan(M.cobble, back, [0, 0, 1], (p) => [p[0] / 8, p[1] / 4]);
      P.quad(M.door, [a.cx - 1.0, 0.0, -a.depth + 0.04], [a.cx + 1.0, 0.0, -a.depth + 0.04], [a.cx + 1.0, 3.2, -a.depth + 0.04], [a.cx - 1.0, 3.2, -a.depth + 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.granite, a.cx - 1.3, a.cx + 1.3, 0, 0.16, 0, 1.0, 'bk', 1.2);                                              // the granite doorstep
      stepper(K.ctx, f)(a.cx, 0.5, 2.6, 1.0, 0.16);
      P.ranged(160, () => {                                                                                              // the hung black lantern
        P.box(M.black, a.cx - 0.12, a.cx + 0.12, 3.0, 3.4, -0.5, -0.26, '', 1); P.cyl(M.black, [a.cx, 3.4, -0.38], [a.cx, 3.62, -0.38], 0.13, 0.02, 6, false); P.cyl(M.black, [a.cx, 3.62, -0.38], [a.cx, 3.9, -0.38], 0.012, 0.012, 4, false);
      });
    } else {
      P.fan(M.slate, back, [0, 0, 1]);                                                                                    // the dark carriage way
    }
  });
  P.ranged(260, () => {
    const R = (k, a) => 0.05 + hash(k, a, 7) * 0.08;
    ARCHES.forEach((a, ai) => {
      const R0 = a.r + 0.02, R1 = a.r + 0.64, n = 11;
      for (let k = 0; k < n; k++) {
        const t0 = Math.PI * k / n, t1 = Math.PI * (k + 1) / n, z = R(k, ai);
        const c = (R, t) => [a.cx + R * Math.cos(t), a.yc + R * Math.sin(t), z];
        P.quad(M.rock, c(R0, t0), c(R0, t1), c(R1, t1), c(R1, t0), [0, 0, 1], [[k * 0.31, 0], [k * 0.31 + 0.25, 0], [k * 0.31 + 0.25, 0.25], [k * 0.31, 0.25]]);
        const mid = (t) => [Math.cos(t), Math.sin(t)];
        for (const [t, s] of [[t0, -1], [t1, 1]]) { const m = mid(t); P.quad(M.granite, [a.cx + R0 * m[0], a.yc + R0 * m[1], 0], [a.cx + R1 * m[0], a.yc + R1 * m[1], 0], [a.cx + R1 * m[0], a.yc + R1 * m[1], z], [a.cx + R0 * m[0], a.yc + R0 * m[1], z], [-m[1] * s, m[0] * s, 0]); }
      }
      for (const sx of [-1, 1]) for (let y = 0, k = 0; y < a.yc - 0.05; y += 0.62, k++) {
        const z = R(k, ai + 3), x0 = sx < 0 ? a.cx - a.r - 0.64 : a.cx + a.r + 0.02, y1 = Math.min(y + 0.62, a.yc);
        P.box(M.rock, x0, x0 + 0.62, y, y1, 0, z, 'kb', 3.2);
      }
    });
  });
  // ---- the string course, sills, rock-faced lintels, window surrounds, lion-mask plaques
  P.ranged(260, () => {
    P.box(M.granite, 0, len, HS - 0.16, HS + 0.02, 0, 0.1, 'k', 1.2);
    for (const [yb, yt, lintel] of ROWS) for (const u of COLS) {
      surround(P, M.stone, u - 0.47, u + 0.47, yb - 0.0, yt, 0.07, 0.04, 1);
      P.box(M.cream, u - 0.6, u + 0.6, yb - 0.1, yb + 0.02, 0, 0.17, 'k', 1);
      if (lintel) P.box(M.rock, u - 0.74, u + 0.74, yt + 0.0, yt + 0.25, 0, 0.15, 'k', 1.6);
    }
    for (const [u, ww] of GROUND) { surround(P, M.granite, u - ww / 2, u + ww / 2, GY0, GY1, 0.12, 0.06, 1); P.box(M.granite, u - ww / 2 - 0.14, u + ww / 2 + 0.14, GY0 - 0.14, GY0 + 0.0, 0, 0.2, 'k', 1); }
    for (const ym of [6.8, 10.3, 13.75]) for (const u of [5.43, 7.35, 9.3, 11.22]) P.box(M.black, u - 0.11, u + 0.11, ym - 0.11, ym + 0.11, 0, 0.06, 'k', 1);
  });
  // ---- the two oriels: three glazed levels with cream aprons and ledges (y of the glazing from the photo)
  P.ranged(900, () => {
    for (const b of BAYS) {
      const pr = 0.78, run = 0.38;
      bayLevel(P, b.cx, b.w + 0.1, pr + 0.1, run, 4.98, 5.2, M.apron, M.apron, M.cream, { top: true });
      const lv = [[5.2, 7.6], [8.6, 11.25], [12.15, 14.6]];
      lv.forEach(([y0, y1], i) => {
        bayLevel(P, b.cx, b.w, pr, run, y0, y1, M.bayFront, M.bayFlank, M.copper, { top: false, bottom: false });
        if (i < 2) { bayLevel(P, b.cx, b.w, pr, run, y1, lv[i + 1][0] - 0.12, M.apron, M.apron, M.cream, { top: false, bottom: false }); bayLevel(P, b.cx, b.w + 0.1, pr + 0.08, run, lv[i + 1][0] - 0.12, lv[i + 1][0], M.copper, M.copper, M.copper, { top: true, bottom: true }); }
      });
      bayLevel(P, b.cx, b.w, pr, run, 14.6, HW, M.apron, M.apron, M.cream, { top: false, bottom: false });
      bayLevel(P, b.cx, b.w + 0.2, pr + 0.2, run, HW, HC, M.copper, M.copper, M.copper, { top: true, bottom: true });
    }
  });
  // ---- the copper-brown cornice on brackets, the soffit
  P.box(M.copper, -0.25, len + 0.25, HW, HC, 0, 0.78, 'k', 1.2);
  P.box(M.copper, -0.25, len + 0.25, HW - 0.12, HW, 0.02, 0.76, 'k', 1.2);
  P.ranged(200, () => { for (let x = 0.3; x < len; x += 0.62) P.box(M.iron, x - 0.07, x + 0.07, HW - 0.55, HW - 0.12, 0.06, 0.5, 'k', 1); });
  // ---- roof: two low barrel dormers over the oriels, two gablets, three chimneys, a thin roof rail; the zinc drain pipe at the right end
  P.ranged(500, () => {
    for (const b of BAYS) {
      const w = b.w + 0.3;
      P.quad(M.dormer, [b.cx - w / 2, HC, -0.55], [b.cx + w / 2, HC, -0.55], [b.cx + w / 2, HC + 0.72, -0.55], [b.cx - w / 2, HC + 0.72, -0.55], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const sx of [-1, 1]) P.quad(M.copper, [b.cx + sx * w / 2, HC, -0.55], [b.cx + sx * w / 2, HC, -2.1], [b.cx + sx * w / 2, HC + 0.72, -2.1], [b.cx + sx * w / 2, HC + 0.72, -0.55], [sx, 0, 0]);
      P.quad(M.copper, [b.cx - w / 2, HC + 0.72, -0.55], [b.cx + w / 2, HC + 0.72, -0.55], [b.cx + w / 2, HC + 0.72, -2.1], [b.cx - w / 2, HC + 0.72, -2.1], [0, 1, 0]);
      barrel(P, M.verd, b.cx, HC + 0.72, w + 0.16, 0.5, -0.45, -2.2, 10, M.verd);
    }
    for (const u of [6.3, 10.1]) {
      P.box(M.cream, u - 0.45, u + 0.45, HC, HC + 0.35, -1.2, -0.7, 'b', 1);
      P.fan(M.cream, [[u - 0.5, HC + 0.35, -0.7], [u + 0.5, HC + 0.35, -0.7], [u, HC + 0.95, -0.7]], [0, 0, 1]);
      P.quad(M.iron, [u - 0.55, HC + 0.33, -0.65], [u, HC + 0.98, -0.65], [u, HC + 0.98, -1.25], [u - 0.55, HC + 0.33, -1.25], [-0.7, 0.7, 0]);
      P.quad(M.iron, [u, HC + 0.98, -0.65], [u + 0.55, HC + 0.33, -0.65], [u + 0.55, HC + 0.33, -1.25], [u, HC + 0.98, -1.25], [0.7, 0.7, 0]);
    }
    for (const [x0, x1] of [[5.0, 5.7], [7.4, 9.5], [10.6, 11.7]]) { P.box(M.brick, x0, x1, HC, HC + 1.0, -1.7, -1.0, 'b', 1); P.box(M.stone, x0 - 0.06, x1 + 0.06, HC + 1.0, HC + 1.1, -1.76, -0.94, 'b', 1); }
    P.quad(M.rails, [3.7, HC, -0.35], [13.0, HC, -0.35], [13.0, HC + 0.85, -0.35], [3.7, HC + 0.85, -0.35], [0, 0, 1], [[0, 0], [9.3 / 1.9, 0], [9.3 / 1.9, 1], [0, 1]]);
  });
  P.ranged(300, () => downpipe(P, M.zinc, len - 0.12, 0.1, HW));
  P.pop();
  // ---- services
  const mid = { x: f.S.x + f.t[0] * len / 2, z: f.S.z + f.t[1] * len / 2 };
  svc.monuments.push({ id: 'w55440259', name: 'Доходный дом Мейснера, Ждановская наб., 9', x: mid.x, z: mid.z, h: 18 });
  K.shared.h9.mid = mid;
}
