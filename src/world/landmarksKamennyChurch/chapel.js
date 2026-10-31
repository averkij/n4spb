// landmarksKamennyChurch/chapel.js - the CHAPEL of the Vsetsaritsa icon (OSM r10254215 / w553610963; 1956 technical pavilion of the Ushakovsky Bridge by V. S. Vasilkovsky, church property since 2002; photos H01 H02 H03 C11):
// a slender round brick pavilion of 8.1 m diameter painted brick red, on a stack of seven concentric pale limestone steps that wrap round the door side; a white plinth, a pointed door in a white surround under a black iron
// canopy, two lancet windows with iron grilles, a white dentil frieze under a projecting cornice, a band with a chain of white wavy arches, a second cornice, a near-flat grey roof, a small red drum with a white cap,
// a silver-grey onion with a gilded ball and cross; on the back (opposite the door) the mosaic of the icon "Всецарица" in a white pointed niche.
// Heights above the steps floor [E from H01 / H02]: base 0.45, wall 5.2, dentils 5.45, cornice 5.85, arcs band to 7.0, cornice 7.35, roof to 8.0, drum 9.3, onion to 11.1, cross 13.0 (the OSM level count says 3.3 m: useless).
// Frame CP (frame.js): origin = the centre (-2832.3, -5459.5), +z = the door side (west, a little south: toward the footway w142041418).
import * as THREE from 'three';
import { CP, CPL } from './frame.js';
import { tube, frustum, onion, ball, cross, frameRing } from './geo.js';
import { ATLAS } from './art.js';
import { lancetPts, lancetWindow, onAll, TAU } from './util.js';

const sin = Math.sin, cos = Math.cos;

/** an annular sector step: outer riser, top, the two radial end faces. angles a0..a1 (0 = +z, p(t) = (sin t, cos t)) */
function sectorTier(P, mat, rIn, rOut, yb, yt, a0, a1, seg) {
  const pt = (t, r, y) => [sin(t) * r, y, cos(t) * r];
  for (let i = 0; i < seg; i++) {
    const t0 = a0 + (a1 - a0) * i / seg, t1 = a0 + (a1 - a0) * (i + 1) / seg, tm = (t0 + t1) / 2, u0 = rOut * t0 / 3, u1 = rOut * t1 / 3;
    P.quad(mat, pt(t0, rOut, yb), pt(t1, rOut, yb), pt(t1, rOut, yt), pt(t0, rOut, yt), [sin(tm), 0, cos(tm)], [[u0, yb / 3], [u1, yb / 3], [u1, yt / 3], [u0, yt / 3]]);
    P.quad(mat, pt(t0, rIn, yt), pt(t1, rIn, yt), pt(t1, rOut, yt), pt(t0, rOut, yt), [0, 1, 0], [[sin(t0) * rIn / 3, cos(t0) * rIn / 3], [sin(t1) * rIn / 3, cos(t1) * rIn / 3], [sin(t1) * rOut / 3, cos(t1) * rOut / 3], [sin(t0) * rOut / 3, cos(t0) * rOut / 3]]);
  }
  for (const [t, s] of [[a0, -1], [a1, 1]]) {
    const n = [cos(t) * s, 0, -sin(t) * s];
    P.quad(mat, pt(t, rIn, 0), pt(t, rOut, 0), pt(t, rOut, yt), pt(t, rIn, yt), n, [[0, 0], [(rOut - rIn) / 3, 0], [(rOut - rIn) / 3, yt / 3], [0, yt / 3]]);
  }
}

export function build(K) {
  const { ctx, M, P, N, svc } = K, Ps = [P, N], ph = ctx.physics, R = CPL.R, F = CPL.floor;
  P.push(CP.ox, 0, CP.oz, CP.rot); N.push(CP.ox, 0, CP.oz, CP.rot);

  // ---------------------------------------------------------------- the steps (the door side: +-115 deg) and the walkable boxes
  const A = 2.0, nT = CPL.steps;
  for (let k = 1; k <= nT; k++) {
    const rOut = k === nT ? R + 0.95 : R + 0.95 + 0.3 * (nT - k), rIn = k === nT ? R : rOut - 0.3, yt = CPL.rise * k;
    sectorTier(P, M.stone, rIn, rOut, CPL.rise * (k - 1), yt, -A, A, 22);
    const nb = 14;
    for (let i = 0; i < nb; i++) {
      const t = -A + 2 * A * (i + 0.5) / nb, rm = (rIn + rOut) / 2, w = 2 * rOut * Math.tan(A / nb) + 0.12;
      CP.walk(ph, sin(t) * rm, cos(t) * rm, w, rOut - rIn + 0.04, t, yt);
    }
  }
  // the foundation drum under the floor (the whole circle: the back has no steps), the white base band + the wall
  tube(P, M.stone, 0, 0, 0, F - 0.03, 4.2, 4.2, 28, 12, 0.4, { capTop: M.stone });
  tube(P, M.white, 0, 0, F, F + 0.45, 4.3, 4.3, 28, 12, 0.3, { capTop: M.white });
  tube(P, M.brickPaint, 0, 0, F + 0.45, F + 5.2, R, R, 28, 12, 2.3);
  // the white dentil frieze under the first cornice, the cornice, the band of white wavy arches, the second cornice
  for (let i = 0; i < 84; i++) { const t = i * TAU / 84; onAll(Ps, sin(t) * 4.15, F + 5.2, cos(t) * 4.15, t, () => N.box(M.white, -0.065, 0.065, 0, 0.26, -0.1, 0.1)); }
  tube(P, M.white, 0, 0, F + 5.45, F + 5.85, 4.5, 4.5, 28, 1, 1, { capTop: M.white, capBot: M.white });
  tube(P, M.brickPaint, 0, 0, F + 5.85, F + 7.0, 3.98, 3.98, 28, 12, 0.55);
  const arcG = new THREE.TorusGeometry(0.47, 0.055, 6, 12, Math.PI);
  for (let i = 0; i < 28; i++) { const t = (i + 0.5) * TAU / 28; onAll(Ps, sin(t) * 4.0, F + 5.95, cos(t) * 4.0, t, () => N.geo(M.white, arcG, 0, 0, 0, 0, 0, 0, 1.0, 0.8, 1)); }
  tube(P, M.white, 0, 0, F + 7.0, F + 7.35, 4.22, 4.22, 28, 1, 1, { capTop: M.white, capBot: M.white });
  // the near-flat grey roof, the small drum with its white cap and dentils, the onion, ball and cross
  frustum(P, M.onion, 0, 0, F + 7.35, F + 8.0, 28, 4.22, 1.0, 0, 1, 1);
  tube(P, M.brickPaint, 0, 0, F + 8.0, F + 9.05, 0.95, 0.95, 14, 4, 0.5);
  for (let i = 0; i < 12; i++) { const t = i * TAU / 12; onAll(Ps, sin(t) * 1.02, F + 9.05, cos(t) * 1.02, t, () => N.box(M.white, -0.075, 0.075, 0, 0.22, -0.07, 0.07)); }
  tube(P, M.white, 0, 0, F + 9.27, F + 9.57, 1.18, 1.18, 14, 1, 1, { capTop: M.white, capBot: M.white });
  onion(P, M.onion, 0, F + 9.57, 0, 0.66, 1, 20, 14);
  ball(P, M.gold, 0, F + 11.16, 0, 0.17, 10); cross(P, M.gold, 0, F + 11.26, 0, 1.75, 0);

  // ---------------------------------------------------------------- the door, canopy, lamps; two grilled windows; the mosaic niche on the back
  onAll(Ps, 0, F, R + 0.03, 0, () => {
    lancetWindow(N, M, 0, 0, 2.2, 4.3, { mat: M.door, fw: 0.34, depth: 0.3, z0: -0.4, dz: 0.27, sill: false });
    const outer = lancetPts(0, -0.05, 3.18, 4.55), inner = lancetPts(0, -0.05, 3.02, 4.55 - 0.16);
    frameRing(N, M.iron, outer, inner, 0.3, 0.4);
    for (const s of [-1, 1]) { N.box(M.white, s * 1.62 - 0.08, s * 1.62 + 0.08, 2.5, 2.84, 0.3, 0.46); frustum(N, M.iron, s * 1.62, 0.38, 2.84, 3.22, 6, 0.2, 0.04, 0, 1, 1); }
    N.box(M.iron, -0.1, 0.1, 3.45, 3.85, 0.32, 0.52);
    cross(N, M.iron, 0, 4.85, 0.1, 0.6, 0);
  });
  for (const s of [-1, 1]) {
    const t = s * 1.02;
    onAll(Ps, sin(t) * (R + 0.03), F, cos(t) * (R + 0.03), t, () => lancetWindow(N, M, 0, 1.25, 1.0, 3.65, { fw: 0.17, depth: 0.08, z0: -0.15 }));
  }
  onAll(Ps, 0, F, -(R + 0.03), Math.PI, () => lancetWindow(N, M, 0, 1.3, 1.9, 3.5, { mat: M.mosaic, fw: 0.26, depth: 0.1, z0: -0.4, sill: false }));
  // the plate on the wall, 33 deg to the left of the door
  {
    const t = -0.66, wp = CP.W(sin(t) * (R + 0.04), cos(t) * (R + 0.04)), rot = CP.rot + t, labels = ctx.services.labels;
    if (!labels || labels.reserve('r10254215', wp.x, F + 2.5, wp.z, 0.55, 0.42, sin(rot), cos(rot), 'plaque')) {
      onAll(Ps, sin(t) * (R + 0.04), F, cos(t) * (R + 0.04), t, () => { const [u0, v0, u1, v1] = ATLAS.chapel; N.quad(M.plaques, [-0.28, 2.3, 0.01], [0.28, 2.3, 0.01], [0.28, 2.75, 0.01], [-0.28, 2.75, 0.01], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); });
      svc.plaques.push({ kind: 'chapel', x: wp.x, z: wp.z, y: F + 2.5 });
    }
  }

  // ---------------------------------------------------------------- colliders: the wall (a solid cylinder; the steps are walk boxes above), a door sill
  CP.cyl(ph, 0, 0, R + 0.05, 0, 15);
  P.pop(); N.pop();
}
