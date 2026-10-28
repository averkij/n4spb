// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/sculpt6.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/sculpt6.js - small pieces of the second pass of the Vasilievsky Island bridges (docs/research/vo-bridges-wave2.md), drawn into the Parts collector `P` of kit.js in the CURRENT frame like sculpt5.js
// (x, z on the deck plane, y up; `rot` turns a piece about the vertical; local z = across the bridge, toward the carriageway):
//   obeliskGranite  Nalichny: a massive granite-faced obelisk (stepped plinth, a square tapering shaft, a cornice and a low pyramid; photos n01 n02), h = total height
//   lampTwin        a galvanised street pole with TWO cobra-head arms (one over each carriageway; photo n02: poles with several heads on the verges of Nalichny)
//   pedestalLamp    Korablestroiteley: an RC pedestal faced with granite carrying a steel pole with a twin arm (Wikipedia: "на постаментах установлены металлические столбы освещения")
//   torchereFoot    Novo-Andreevsky footbridge: a slim dark steel post with a collar, two curved arms and two cream globes (photos f01 f02)
//   stairFlight     a granite flight of steps with cheek walls (the wide corner stairs of Nalichny / Korablestroiteley / the mouth bridges): geometry only, the caller adds the colliders
// NO flags / flagpoles (user rule); no beacons.
import * as THREE from 'three';

const sph = (P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) => P.geo(mat, new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)), x, y, z, 0, 0, 0, rx, ry, rz);

/** a granite-faced obelisk: stepped plinth, a square tapering shaft, a cornice, a low pyramid; (x, y, z) = the foot, h = total height (photos n01 n02: about 8 m, the shaft 1.35 m square at the foot) */
export function obeliskGranite(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 8.6, g = o.mat || M.obeliskNal, base = o.base || g;
  P.push(x, y, z, rot);
  P.box(base, -1.25, 1.25, 0, 0.8, -1.25, 1.25, 'b', 1.6);                                         // the plinth
  P.box(M.coping, -1.33, 1.33, 0.8, 0.95, -1.33, 1.33, '', 1.4);                                    // its cornice (projects 8 cm)
  P.box(g, -0.98, 0.98, 0.95, 1.4, -0.98, 0.98, '', 1.6);                                           // the second step
  P.box(M.coping, -1.04, 1.04, 1.4, 1.5, -1.04, 1.04, '', 1.4);
  P.push(0, 1.5, 0, Math.PI / 4); P.cyl(g, [0, 0, 0], [0, h - 1.5 - 1.05, 0], 0.955, 0.64, 4, true); P.pop();   // the shaft: a 4-sided tapering column (1.35 m square at the foot, 0.9 m at the top), turned 45 deg so that its faces follow the plinth
  P.box(M.coping, -0.52, 0.52, h - 1.05, h - 0.9, -0.52, 0.52, '', 1.2);
  P.push(0, h - 0.9, 0, Math.PI / 4); P.cyl(g, [0, 0, 0], [0, 0.9, 0], 0.47, 0.025, 4, true); P.pop();   // the low pyramid
  P.pop();
}

/** a galvanised pole, 10 m, with two cobra-head arms along local z (one each way); (x, y, z) = the foot */
export function lampTwin(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 10, m = o.mat || M.poleGalv, arm = o.arm || 1.9;
  P.push(x, y, z, rot);
  P.cyl(m, [0, 0, 0], [0, 0.4, 0], 0.24, 0.2, 8, true);
  P.cyl(m, [0, 0.4, 0], [0, h, 0], 0.125, 0.06, 8, false);
  for (const sg of [-1, 1]) {
    P.cyl(m, [0, h - 0.4, 0], [0, h + 0.18, sg * arm], 0.045, 0.035, 5, false);
    P.box(m, -0.15, 0.15, h + 0.08, h + 0.2, Math.min(sg * (arm - 0.1), sg * (arm + 0.65)), Math.max(sg * (arm - 0.1), sg * (arm + 0.65)), '', 1);
    P.box(M.lampGlass, -0.12, 0.12, h + 0.05, h + 0.08, Math.min(sg * arm, sg * (arm + 0.58)), Math.max(sg * arm, sg * (arm + 0.58)), 't', 1);
  }
  P.pop();
}

/** an RC pedestal with a granite facing (1.5 x 1.5 x hp) with a steel pole and a twin arm on top; returns the top y of the pedestal (local to the foot) */
export function pedestalLamp(P, M, x, y, z, rot = 0, o = {}) {
  const hp = o.hp || 1.15, g = o.mat || M.graniteKor, h = o.h || 9;
  P.push(x, y, z, rot);
  P.box(g, -0.85, 0.85, 0, hp - 0.14, -0.85, 0.85, 'b', 1.6);
  P.box(M.coping, -0.93, 0.93, hp - 0.14, hp, -0.93, 0.93, '', 1.4);
  lampTwin(P, M, 0, hp, 0, 0, { h, arm: o.arm || 1.7 });
  P.pop();
  return hp;
}

/** the footbridge torchere: a slim dark post with a base block and a collar, two curved arms with cream globes; h = 4.3 */
export function torchereFoot(P, M, x, y, z, rot = 0, o = {}) {
  const h = o.h || 4.3, m = M.ironBlack;
  P.push(x, y, z, rot);
  P.box(m, -0.2, 0.2, 0, 0.32, -0.2, 0.2, 'b', 1); P.box(m, -0.15, 0.15, 0.32, 0.4, -0.15, 0.15, '', 1);
  P.cyl(m, [0, 0.4, 0], [0, h - 0.5, 0], 0.075, 0.05, 8, false);
  P.cyl(m, [0, 1.3, 0], [0, 1.4, 0], 0.11, 0.11, 8, true);
  P.cyl(m, [0, h - 0.55, 0], [0, h - 0.4, 0], 0.11, 0.07, 8, true);
  for (const sg of [-1, 1]) {
    P.cyl(m, [0, h - 0.45, 0], [0, h - 0.28, sg * 0.32], 0.028, 0.024, 4, false);
    P.cyl(m, [0, h - 0.28, sg * 0.32], [0, h - 0.34, sg * 0.5], 0.024, 0.02, 4, false);
    P.cyl(m, [0, h - 0.5, sg * 0.5], [0, h - 0.34, sg * 0.5], 0.05, 0.02, 6, true);
    sph(P, M.globeCream, 0, h - 0.18, sg * 0.5, 0.2, 0.2, 0.2, 9);
  }
  P.cyl(m, [0, h - 0.4, 0], [0, h + 0.15, 0], 0.03, 0.01, 5, false);
  P.pop();
}

/**
 * a STAIR PIT (third pass, docs/research/vo-bridges-wave3.md): the wide corner stair of Nalichny / Korablestroiteley / the mouth bridges in a notch of the quay, drawn in the CURRENT frame (x = u, z = v, y up)
 * from the pure-data pit record of pits.js: from the water the lower steps, the landing, then the flight of `n` steps up to the street, between two cheek walls (a retaining wall with a rolled top that falls from
 * `hWater` at the river to `hLand` at the street) that stand OUTSIDE the ring.  d = distance from the bank line landward (u = uB + s d); the front face stands 0.08 m over the water.
 * Treads use M.pave (slabs), risers and the cheek faces the granite of the bridge (o.mat), the tops M.coping.  Geometry only: returns the levels so that the caller adds the colliders.
 * o: { p (pit record), M, mat, par, bed (foot of the walls under the water), PIT (constants) }
 */
export function stairPit(P, M, o) {
  const { p, PIT } = o, mat = o.mat, par = o.par, s = p.s, hw = PIT.hw, ck = PIT.cheek, vc = p.vc, top = PIT.top, bed = o.bed;
  const U = (d) => p.uB + s * d, dm = -0.08;                                                // dm: the front face over the water
  const lev = [];                                                                          // [{ d0, d1, y }] treads from the water landward (lower steps, landing, flight)
  let d = dm; const yBot = p.yLand - PIT.riseLow * p.low;
  for (let k = 1; k <= p.low; k++) { lev.push({ d0: d, d1: k * PIT.runLow, y: p.yLand - PIT.riseLow * (p.low - k + 1), kind: 'low' }); d = k * PIT.runLow; }
  lev.push({ d0: d, d1: d + PIT.landing, y: p.yLand, kind: 'landing' }); d += PIT.landing;
  for (let j = 1; j <= p.n; j++) { lev.push({ d0: d, d1: d + PIT.run, y: p.yLand + p.rise * j, kind: 'flight' }); d += PIT.run; }
  const dEnd = lev[lev.length - 1].d1;                                                     // = Lr (+ dm)
  const uvT = (d0, d1, v0, v1) => [[d0 / 2.4, v0 / 2.4], [d1 / 2.4, v0 / 2.4], [d1 / 2.4, v1 / 2.4], [d0 / 2.4, v1 / 2.4]];
  let yPrev = bed;
  for (const L of lev) {
    const va = vc - hw, vb = vc + hw;
    P.quad(M.pave, [U(L.d0), L.y, va], [U(L.d1), L.y, va], [U(L.d1), L.y, vb], [U(L.d0), L.y, vb], [0, 1, 0], uvT(L.d0, L.d1, va, vb));                                // tread
    P.quad(mat, [U(L.d0), yPrev, va], [U(L.d0), yPrev, vb], [U(L.d0), L.y, vb], [U(L.d0), L.y, va], [-s, 0, 0], [[va / 2.2, yPrev / 2.2], [vb / 2.2, yPrev / 2.2], [vb / 2.2, L.y / 2.2], [va / 2.2, L.y / 2.2]]);   // riser
    yPrev = L.y;
  }
  // the threshold: a granite lip that covers the seam between the last tread and the ground beyond the ring
  P.quad(M.pave, [U(dEnd - 0.02), top, vc - hw], [U(dEnd + 0.45), top, vc - hw], [U(dEnd + 0.45), top, vc + hw], [U(dEnd - 0.02), top, vc + hw], [0, 1, 0], uvT(dEnd - 0.02, dEnd + 0.45, vc - hw, vc + hw));
  P.quad(mat, [U(dEnd + 0.45), 0, vc - hw], [U(dEnd + 0.45), 0, vc + hw], [U(dEnd + 0.45), top, vc + hw], [U(dEnd + 0.45), top, vc - hw], [s, 0, 0]);
  // the two cheek walls (outside the ring): inner face from the water bed up, outer face from the street, a rolled top, the end faces
  const wallTop = (dd) => top + PIT.hLand + (PIT.hWater - PIT.hLand) * (1 - (dd - dm) / (dEnd - dm));
  for (const sg of [-1, 1]) {
    const vi = vc + sg * hw, vo = vc + sg * (hw + ck), ya = wallTop(dm), yb = wallTop(dEnd);
    P.quad(mat, [U(dm), bed, vi], [U(dEnd), bed, vi], [U(dEnd), yb, vi], [U(dm), ya, vi], [0, 0, -sg], [[dm / 2.2, bed / 2.2], [dEnd / 2.2, bed / 2.2], [dEnd / 2.2, yb / 2.2], [dm / 2.2, ya / 2.2]]);
    P.quad(par, [U(dm), top, vo], [U(dEnd), top, vo], [U(dEnd), yb, vo], [U(dm), ya, vo], [0, 0, sg], [[dm / 2.8, top / 1.2], [dEnd / 2.8, top / 1.2], [dEnd / 2.8, yb / 1.2], [dm / 2.8, ya / 1.2]]);
    P.quad(M.coping, [U(dm), ya, vi], [U(dEnd), yb, vi], [U(dEnd), yb, vo], [U(dm), ya, vo], [0, 1, 0]);
    P.quad(mat, [U(dm), bed, vi], [U(dm), bed, vo], [U(dm), ya, vo], [U(dm), ya, vi], [-s, 0, 0]);                          // the river end
    P.quad(par, [U(dEnd), top, vi], [U(dEnd), top, vo], [U(dEnd), yb, vo], [U(dEnd), yb, vi], [s, 0, 0]);                  // the street end
  }
  return { levels: lev, dEnd, yBot, wallTop };
}

/**
 * a granite flight with cheek walls: from the foot (u0, y0) rising along `dir` (+1 / -1 along u) over n steps of run `run` and rise `rise`, width w across v, centred at v (all in the CURRENT frame);
 * the cheek walls (0.55 m wide, a rolled coping) follow the stepping; returns the top end u and the top y.
 */
export function stairFlight(P, M, o) {
  const { u0, v, w, dir = 1, n = 12, run = 0.36, rise = 0.17, y0, mat = M.graniteNal, cheek = true } = o;
  for (let k = 0; k < n; k++) {
    const ua = u0 + dir * run * k, ub = u0 + dir * run * (k + 1), top = y0 + rise * (k + 1);
    P.box(mat, Math.min(ua, ub), Math.max(ua, ub), y0 - 0.2, top, v - w / 2, v + w / 2, 'b', 1.4);
  }
  if (cheek) for (const sg of [-1, 1]) {
    const vc = v + sg * (w / 2 + 0.275), ua = u0, ub = u0 + dir * run * n, topA = y0 + 0.5, topB = y0 + rise * n + 0.55;
    P.quad(mat, [ua, y0 - 0.2, vc - 0.275 * sg], [ub, y0 - 0.2, vc - 0.275 * sg], [ub, topB, vc - 0.275 * sg], [ua, topA, vc - 0.275 * sg], [0, 0, -sg]);
    P.quad(mat, [ub, y0 - 0.2, vc + 0.275 * sg], [ua, y0 - 0.2, vc + 0.275 * sg], [ua, topA, vc + 0.275 * sg], [ub, topB, vc + 0.275 * sg], [0, 0, sg]);
    P.quad(M.coping, [ua, topA, vc - 0.3], [ua, topA, vc + 0.3], [ub, topB, vc + 0.3], [ub, topB, vc - 0.3], [0, 1, 0]);
    P.quad(mat, [ub, y0 - 0.2, vc - 0.275], [ub, y0 - 0.2, vc + 0.275], [ub, topB, vc + 0.275], [ub, topB, vc - 0.275], [dir, 0, 0]);
  }
  return { u: u0 + dir * run * n, y: y0 + rise * n };
}
