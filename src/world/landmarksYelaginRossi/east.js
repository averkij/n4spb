// landmarksYelaginRossi/east.js - the EAST PAVILION on the granite pier of Yelagin Island ("Павильон под флагом", K. I. Rossi, 1820s; OSM r2590124; federal heritage).  The flagstaff of the roof
// (the pavilion is named after it) is NOT drawn (user rule: no flagstaff, no flag, no mast).
// A rectangle 17.7 x 8.8 m (long axis N-S) of pale blue-grey stucco: the PARK (west) face carries a portico of 8 white Doric columns in four coupled pairs (arched window | door | arched window between the
// pairs, relief tablets above, balustraded sills), the WATER (east) face an OVAL portico of 10 Doric columns round an arcaded wall; the end walls are plain with garland tablets; a continuous Doric entablature
// (triglyph frieze, mutule cornice), a shallow hipped sheet-metal roof with a cast-iron railing along its deck.  Photos refs/yelagin-park-2026/rossi 07-12 (dossier 5.8, critic 13: 10 + 8 columns).
// LOCAL FRAME: x along the east face (toward the north), z OUT of the east face (east, toward the Neva), y up, origin = middle of the east face line; the west wall lies at z = -8.8.
import * as THREE from 'three';
import { doric, sweep, arcPts, alongPath, normalsOf } from './orders.js';
import { railing, archOpening } from './ironwork.js';
import { stairs } from './phys.js';
import { EAST, toWorld } from './frame.js';

export const FE = 0.5, TERR = 0.12;                                     // pavilion floor, spit terrace top
const HCOL = 4.5, RCOL = 0.375, YC = FE + HCOL, YA = YC + 0.45, YF = YA + 0.05 + 0.55, YK = YF + 0.30;
const AX = 5.1, AZ = 3.7;                                                // axis ellipse of the oval colonnade
const COLS_W = [-7.25, -5.65, -2.95, -1.35, 1.35, 2.95, 5.65, 7.25];     // west portico: four coupled pairs
const ZC = -8.2, ZWALL = -6.9, XE = 8.55;                                // west column axis, west wall plane, half length of the end walls
const OUT_PROFILE = [[0, YC], [0, YA], [0.04, YA], [0.04, YA + 0.05], [0, YA + 0.05], [0, YF], [0.45, YF + 0.02], [0.45, YF + 0.22], [0.4, YK], [0, YK]];

/** n points at equal arc length on the half ellipse (ax, az) from (-ax, 0) over (0, az) to (ax, 0) */
function ovalCols(n) {
  const S = 400, pts = arcPts(0, 0, AX, AZ, Math.PI, 0, S), L = [0];
  for (let i = 1; i <= S; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = [];
  for (let k = 0; k < n; k++) { const s = L[S] * k / (n - 1); let i = 1; while (i < S && L[i] < s) i++; const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]); }
  return out;
}

export function east(ctx, P, M, svc) {
  P.push(EAST.x, 0, EAST.z, EAST.rotY);
  P.far = 800;
  const cols10 = ovalCols(10);
  const ring = [[8.7, -8.65], [-8.7, -8.65], [-8.7, 0], [-5.55, 0]].concat(arcPts(0, 0, 5.55, 4.15, Math.PI, 0, 20).slice(1, -1)).concat([[5.55, 0], [8.7, 0]]);

  // ---------------------------------------------------------------- stylobate, steps
  { const base = [[8.85, -8.8], [-8.85, -8.8], [-8.85, 0], [-5.6, 0]].concat(arcPts(0, 0, 5.6, 4.3, Math.PI, 0, 20).slice(1, -1)).concat([[5.6, 0], [8.85, 0]]);
    sweep(P, M.granite, base, [[0, TERR - 0.1], [0, FE]], { side: 1, closed: true, uvs: 1 });
    P.cap(M.granite, base, FE, true, 2);
    const oval = arcPts(0, 0, 5.6, 4.3, Math.PI, 0, 20);
    sweep(P, M.granite, oval, [[1.0, TERR], [1.0, FE - 0.19], [0.5, FE - 0.19], [0.5, FE], [0, FE]], { side: 1, uvs: 1 });
    for (let k = 1; k <= 3; k++) P.box(M.granite, -3.3, 3.3, 0, FE - 0.5 / 3 * k, -8.8 - 0.4 * k, -8.8, 'bf', 1);           // the park steps
  }

  // ---------------------------------------------------------------- walls
  P.box(M.stuccoGrey, -XE, XE, FE, YK, ZWALL, 0, 't', 4);
  for (const sg of [-1, 1]) P.box(M.stuccoGrey, sg > 0 ? XE - 0.6 : -XE, sg > 0 ? XE : -XE + 0.6, FE, YK, ZC - 0.45, ZWALL, 't', 4);          // the end walls run out to the portico line
  // ceilings of the west portico and of the oval portico
  P.quad(M.stuccoGrey, [-XE + 0.6, YC, ZC - 0.45], [XE - 0.6, YC, ZC - 0.45], [XE - 0.6, YC, ZWALL], [-XE + 0.6, YC, ZWALL], [0, -1, 0]);
  { const pts = [[-5.55, 0]].concat(arcPts(0, 0, 5.55, 4.15, Math.PI, 0, 20).slice(1, -1)).concat([[5.55, 0]]); P.cap(M.stuccoGrey, pts, YC, false, 4); }

  // ---------------------------------------------------------------- columns (10 on the oval, 8 on the park face): fluted near, smooth cones far
  // (keep = true: the engine's static batch would merge the pair and draw the smooth cone over the flutes: landmarksYelaginRossi.js sets ctx.noBatch on these meshes)
  P.ranged(180, () => { for (const [x, z] of cols10) doric(P, M.white, x, z, FE, HCOL, RCOL, true, M.flute); for (const x of COLS_W) doric(P, M.white, x, ZC, FE, HCOL, RCOL, true, M.flute); }, 0, true);
  if (!(typeof window !== 'undefined' && window.__ROSSI_NEAR)) P.ranged(900, () => { for (const [x, z] of cols10) doric(P, M.white, x, z, FE, HCOL, RCOL, false); for (const x of COLS_W) doric(P, M.white, x, ZC, FE, HCOL, RCOL, false); }, 180, true);

  // ---------------------------------------------------------------- entablature all round, then the hipped roof with its railing
  sweep(P, M.white, ring, OUT_PROFILE, { side: 1, closed: true, uvs: 4 });
  const nr = normalsOf(ring, 1, true), inset = (d) => ring.map((p, i) => [p[0] - nr[i][0] * d * nr[i][2], p[1] - nr[i][1] * d * nr[i][2]]);
  sweep(P, M.roofMetal, ring, [[0.4, YK], [-0.9, YK + 0.7]], { side: 1, closed: true, uvs: 2 });
  P.cap(M.roofMetal, inset(0.9), YK + 0.7, true, 2);
  const roofRail = railing(P, M, inset(0.88), { closed: true, y0: YK + 0.7, h: 0.9, every: 2.4 });
  // the frieze: a triglyph over every column and one between (near only), mutules under the corona
  P.ranged(150, () => {
    const tri = (PP) => { PP.box(M.white, -0.17, 0.17, YA + 0.09, YF - 0.02, 0, 0.05, 'bk', 1); for (const x of [-0.07, 0.07]) PP.box(M.dark, x - 0.015, x + 0.015, YA + 0.15, YF - 0.09, 0.0, 0.055, 'bk', 1); };
    alongPath(P, M.white, ring, 1, 0.92, { s0: 0.0, d0: 0.0, fn: tri });
    alongPath(P, M.white, ring, 1, 0.46, { s0: 0.0, d0: 0.0, fn: (PP) => PP.box(M.white, -0.15, 0.15, YF - 0.06, YF, 0.08, 0.42, 'b', 1) });
  });

  // ---------------------------------------------------------------- the park face: windows, door, relief tablets, balustrades; the oval face: arched openings; ends: tablets
  const west = (x, fn) => { P.push(x, 0, ZWALL, Math.PI); fn(); P.pop(); };
  for (const x of [-4.3, 4.3]) west(x, () => { archOpening(P, M, 1.4, 1.95, { y0: FE + 0.95 }); P.box(M.white, -0.95, 0.95, FE + 0.0, FE + 0.95, 0.0, 0.2, 'bk', 1); });
  west(0, () => archOpening(P, M, 1.5, 2.3, { y0: FE, door: true }));
  P.ranged(250, () => {
    for (const x of [-4.3, 0, 4.3]) west(x, () => P.quad(M.relief, [-0.8, FE + 3.75, 0.025], [0.8, FE + 3.75, 0.025], [0.8, FE + 4.35, 0.025], [-0.8, FE + 4.35, 0.025], [0, 0, 1], M.reliefUV));
    for (const x of [-4.3, 4.3]) west(x, () => { for (let k = 0; k < 6; k++) P.col(M.white, -0.75 + k * 0.3, 0.1, FE + 0.1, FE + 0.88, 0.045, 0.045, 6, false); });         // balusters in the sill boxes
    for (const sg of [-1, 1]) { P.push(sg * XE, 0, -4.0, sg > 0 ? Math.PI / 2 : -Math.PI / 2); P.quad(M.relief, [-0.9, FE + 3.7, 0.025], [0.9, FE + 3.7, 0.025], [0.9, FE + 4.35, 0.025], [-0.9, FE + 4.35, 0.025], [0, 0, 1], M.reliefUV); P.pop(); }
  });
  for (const x of [-3.4, 0, 3.4]) { P.push(x, 0, 0, 0); archOpening(P, M, x === 0 ? 1.6 : 1.5, x === 0 ? 2.3 : 2.1, { y0: FE + (x === 0 ? 0 : 0.5), door: x === 0 }); P.pop(); }
  P.quad(M.dark, [-7.1, FE + 1.7, 0.02], [-6.65, FE + 1.7, 0.02], [-6.65, FE + 2.25, 0.02], [-7.1, FE + 2.25, 0.02], [0, 0, 1]);                                      // the small plaque

  // ---------------------------------------------------------------- colliders
  const ph = ctx.physics;
  if (ph) {
    const rot = EAST.rotY, at = (x, z) => toWorld(EAST, x, z);                      // the frame: u = x, v = z
    { const [cx, cz] = at(0, ZWALL / 2); ph.addBox(cx, cz, 2 * XE, -ZWALL, rot, 0, YK + 1.5); }
    for (const sg of [-1, 1]) { const [cx, cz] = at(sg * (XE - 0.3), (ZC - 0.45 + ZWALL) / 2); ph.addBox(cx, cz, 0.6, ZWALL - ZC + 0.45, rot, 0, YK + 1.5); }
    for (const [x, z] of cols10.concat(COLS_W.map((x) => [x, ZC]))) { const [cx, cz] = at(x, z); ph.addCylinder(cx, cz, 0.42, FE - 0.1, YC); }
    { const [cx, cz] = at(0, (-8.8 + ZWALL) / 2); ph.addWalkBox(cx, cz, 2 * XE - 1.2, ZWALL + 8.8, rot, FE, 0); }                                  // the west porch floor
    { const [cx, cz] = at(0, -9.4); stairs(ph, cx, cz, 6.6, 1.2, rot, 0, FE, 3); }                                                                     // park steps: rises toward +z of its frame (the building lies at larger local z)
    for (let u = -5.4; u <= 5.41; u += 0.6) { const d = Math.sqrt(Math.max(0, 1 - (u / 5.6) * (u / 5.6))) * 4.3 - 0.0, [cx, cz] = at(u, d / 2); ph.addWalkBox(cx, cz, 0.64, d, rot, FE, 0); }   // the oval floor in strips
    for (const sg of [-1, 1]) { const [cx, cz] = at(sg * 7.2, -0.4); ph.addWalkBox(cx, cz, 3.0, 0.8, rot, FE, 0); }
    // the oval steps: two rings of chords round the stylobate edge (0.5 and 1.0 m out)
    const R1 = arcPts(0, 0, 5.6 + 0.75, 4.3 + 0.75, Math.PI, 0, 20), R2 = arcPts(0, 0, 5.6 + 0.25, 4.3 + 0.25, Math.PI, 0, 20);
    for (const [ring2, top, w] of [[R1, TERR + 0.19, 0.5], [R2, FE, 0.5]]) for (let i = 0; i < ring2.length - 1; i++) { const a = ring2[i], b = ring2[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), [cx, cz] = at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); ph.addWalkBox(cx, cz, l + 0.1, w + 0.06, rot + Math.atan2(-dz, dx), top, 0); }
  }
  P.pop();
  const [mx, mz] = toWorld(EAST, 0, 8);
  svc.monuments.push({ id: EAST.id, name: 'Павильон под флагом / Гранитная пристань (К. И. Росси)', x: mx, z: mz, h: 8.4 });
  const [px, pz] = toWorld(EAST, 14, 3), [tx, tz] = toWorld(EAST, 0, -2);
  svc.photoSpots.push({ x: px, z: pz, yaw: yawToward(px, pz, tx, tz), name: 'Павильон на Восточной стрелке со стороны Большой Невки' });
  void THREE; void roofRail;
}
const yawToward = (x0, z0, x1, z1) => { const b = Math.atan2(x1 - x0, -(z1 - z0)) * 180 / Math.PI; return ((-b + 540) % 360) - 180; };
