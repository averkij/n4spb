// landmarksAcademy/dome.js - the two domes of the Academy (docs/research/academy.md 3.2 / 3.3, heights from three photos, +-0.8 m; verify the ratio Minerva top / cornice = 1.65 in the river shot).
//   FRONT dome stack on the attic (y 24.0): the BELL SKIRT (a four-sided roof with concave flanks, plan 19 x 12.4 m at the attic cornice narrowing to the ring of diameter 10.8 at y 26.0, sheet metal
//   #b9c1c8), a stepped ledge at the ring, the shallow RIBBED DOME (16 ribs, crown 28.6, sphere radius 6.9), the lantern drum (diameter 4.0, flared collar, y 28.6..29.7) and the MINERVA group
//   (sculpt.js: gilded bronze, y 30.0..33.8) on a round plinth.  Centre (u -1.0, v 52.1) = the OSM node of Minerva.
//   REAR dome over the garden-side centre: a square attic (u -9.1..6.9, v -51.1..-35.1, y 20.2..25.3) under an octagonal ribbed grey-blue dome (ring 26.0, crown 27.8), a drum and a gilded Orthodox
//   cross (tip 31.0).  Centre (u -1.1, v -43.1) = the OSM part w866449060.
import { ACAD, H } from './frame.js';
import { prism } from './shell.js';
import { cross, ball } from './geo.js';
import { band } from './kit.js';

const TAU = Math.PI * 2;
export const DOME_C = [-1.0, 52.1];
export const REAR_C = [-1.1, -43.1];

/** superellipse point of half extents (a, b), exponent p, at angle t */
const sup = (a, b, p, t) => { const c = Math.cos(t), s = Math.sin(t), e = 2 / p; return [a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e]; };

export async function build(K) {
  const { P, M } = K;
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    const [cu, cv] = DOME_C;
    // ---- the bell skirt: sections from a rounded rectangle (19 x 12.4, p 4.5) at y 24.0 to the circle r 5.4 at y 26.0, concave flanks
    const N = 56, S = 8, secs = [];
    for (let k = 0; k <= S; k++) {
      const t = k / S, y = H.attic + 2.0 * Math.pow(t, 1.7), a = 5.4 + (9.5 - 5.4) * (1 - t), b = 5.4 + (6.2 - 5.4) * (1 - t), p = 4.5 + (2 - 4.5) * Math.pow(t, 0.8);
      secs.push({ y, pts: Array.from({ length: N }, (_, i) => { const q = sup(a, b, p, (i / N) * TAU); return [cu + q[0], cv + q[1]]; }) });
    }
    for (let k = 0; k < S; k++) for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, A = secs[k].pts[i], B = secs[k].pts[j], C = secs[k + 1].pts[j], D = secs[k + 1].pts[i];
      const mx = (A[0] + B[0]) / 2 - cu, mz = (A[1] + B[1]) / 2 - cv, ml = Math.hypot(mx, mz) || 1;
      P.quad(M.roofLight, [A[0], secs[k].y, A[1]], [B[0], secs[k].y, B[1]], [C[0], secs[k + 1].y, C[1]], [D[0], secs[k + 1].y, D[1]], [mx / ml * 0.7, 0.8, mz / ml * 0.7], [[i / 4, k / 3], [(i + 1) / 4, k / 3], [(i + 1) / 4, (k + 1) / 3], [i / 4, (k + 1) / 3]]);
    }
    // ---- the ledge at the ring and the ribbed dome (sphere radius 6.9 over the ring r 5.4)
    const ringY = H.ring, Rs = 6.9, yc = H.crown - Rs, r0 = 5.4;
    P.cyl(M.drum, [cu, ringY - 0.02, cv], [cu, ringY + 0.22, cv], r0 + 0.35, r0 + 0.25, 40, true);
    const NS = 8, NA = 48;
    for (let k = 0; k < NS; k++) {
      const y0 = ringY + 0.2 + (H.crown - ringY - 0.2) * k / NS, y1 = ringY + 0.2 + (H.crown - ringY - 0.2) * (k + 1) / NS;
      const ra = Math.sqrt(Math.max(0.0004, Rs * Rs - (y0 - yc) ** 2)), rb = Math.sqrt(Math.max(0.0004, Rs * Rs - (y1 - yc) ** 2));
      for (let i = 0; i < NA; i++) {
        const t0 = (i / NA) * TAU, t1 = ((i + 1) / NA) * TAU, tm = (t0 + t1) / 2, nr = 0.75;
        const pa = (t, r, y) => [cu + Math.sin(t) * r, y, cv + Math.cos(t) * r];
        if (rb < 0.05) P.fan(M.ribs, [pa(t0, ra, y0), pa(t1, ra, y0), [cu, y1, cv]], [Math.sin(tm) * 0.5, 1, Math.cos(tm) * 0.5], (p) => [i / 3, p[1]]);
        else P.quad(M.ribs, pa(t0, ra, y0), pa(t1, ra, y0), pa(t1, rb, y1), pa(t0, rb, y1), [Math.sin(tm) * nr, 0.7, Math.cos(tm) * nr], [[i / 3, 0], [(i + 1) / 3, 0], [(i + 1) / 3, 1], [i / 3, 1]]);
      }
    }
    // ---- lantern drum with a flared collar, the cornice ring, the Minerva plinth
    P.cyl(M.drum, [cu, H.crown - 0.05, cv], [cu, H.crown + 0.18, cv], 2.45, 2.15, 24, true);
    P.cyl(M.drum, [cu, H.crown + 0.18, cv], [cu, H.drum - 0.22, cv], 2.0, 2.0, 24, false);
    P.cyl(M.drum, [cu, H.drum - 0.22, cv], [cu, H.drum, cv], 2.25, 2.25, 24, true);
    P.cyl(M.bronze, [cu, H.drum, cv], [cu, H.drum + 0.3, cv], 1.45, 1.35, 20, true);
    K.minervaAt = { u: cu, v: cv, y: H.drum + 0.3 };
    try { const s = await import('./sculpt.js'); if (s.minerva) s.minerva(K, cu, H.drum + 0.3, cv); } catch (err) { console.warn('[landmarksAcademy] minerva', err.message); }
    // ---- REAR dome: square attic, octagonal ribbed dome, drum, gilded cross
    const [ru, rv] = REAR_C, a = 8.0;
    const rect = [{ a: [ru - a, rv + a], b: [ru + a, rv + a], len: 2 * a, n: [0, 1] }, { a: [ru + a, rv + a], b: [ru + a, rv - a], len: 2 * a, n: [1, 0] }, { a: [ru + a, rv - a], b: [ru - a, rv - a], len: 2 * a, n: [0, -1] }, { a: [ru - a, rv - a], b: [ru - a, rv + a], len: 2 * a, n: [-1, 0] }];
    band(P, rect, H.eave, 24.7, 0.0, { front: M.rearField }, { uvs: 3 });
    band(P, rect, 24.7, 25.0, 0.25, { front: M.order, top: M.order, under: M.soffit });
    band(P, rect, 25.0, 25.5, 0.5, { front: M.order, top: M.order, under: M.soffit });
    P.box(M.rearField, ru - a + 0.6, ru + a - 0.6, 22.2, 23.9, rv + a - 0.05, rv + a, 'kb', 3);              // a blind panel on the front of the attic (the pediment of the rear centre hides most of it)
    prism(P, M.rearDome, ru, rv, [[a - 0.9, 25.5], [a - 0.9, 26.0], [a - 1.6, 26.55], [a - 3.2, 27.3], [a - 5.4, 27.7], [0.06, 27.8]], 8, Math.PI / 8, (s, i) => [[s / 8 + 0, i / 4], [s / 8 + 0.125, i / 4], [s / 8 + 0.125, i / 4 + 0.25], [s / 8, i / 4 + 0.25]]);
    P.cyl(M.rearDome, [ru, 27.75, rv], [ru, 28.7, rv], 0.95, 0.85, 12, true);
    P.cyl(M.rearDome, [ru, 28.7, rv], [ru, 28.85, rv], 1.05, 1.05, 12, true);
    ball(P, M.gold, ru, 29.1, rv, 0.32, 10);
    cross(P, M.gold, ru, 29.3, rv, 1.8, ACAD.rot * 0);
  } finally { P.pop(); }
  K.svc.dome = { crown: H.crown, minerva: H.minerva, rearCross: H.rearCross };
}
