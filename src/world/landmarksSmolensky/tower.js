// landmarksSmolensky/tower.js - the two-tier BELL TOWER of the Smolensk church (Ivanov 1790, raised by A. Zakharov from 1808; dossier section 4.3 "TOWER, CORRECTED", photos refs/smolensky 99 108 c06 107 12).
// DETAIL PASS 2026-10-09: plan 6.2 m, stack by the catalogue table 4.9 (see the Y table below).  OLD NOTE: plan 7.6 m square at CH (41.3, 12.9), west face flush with the narthex (X 45.1); the base block (to 7.8 m, church.js) is plain blue.  Stack above the plaza, re-read by the builder from photo 99 as FRACTIONS of
// the total height (the stage thicknesses of the critic stand, but the base is 0.21 of the height, not 0.33: the pinhole numbers of the dossier put the first stage 4-5 m too high against the refectory roof):
// first stage 7.8..13.2 (ONE tall arched opening per face with an iron balustrade, white corner pilasters) -> heavy white cornice 13.2..15.1 with dentils -> belfry stage 15.1..21.4 (paired white pilasters at
// the corners and beside the opening, ONE arched bell opening 2.4 x 4.5 per face with the bells visible) -> a small pediment on every face (base 21.55, apex 23.45, a cherub head in the tympanum) -> low silver
// octagonal cap 21.55..24.4 -> silver spire 24.4..34.0 (octagonal needle, four small arched lucarnes at about 26.4 m) -> gilded ball and cross to 36.2 m.  Frame CH.
import { CH } from './frame.js';
import * as G from './geo.js';
import * as S from './stucco.js';

const CX = 42.0, CZ = 12.9, HW = 3.1;                                                // plan 6.2 m square (5.8-7.0 on three photos: [?], the east face looks narrower), west face flush with the narthex X 45.1
// the stack above the plaza (catalogue 4.9 table, two photos: cross top 35.5 m): base cornice 10.0..11.0 (above the refectory ridge), first-stage opening 12.6..16.6, heavy dentil cornice 16.8..18.6,
// belfry opening 18.8..22.5, pediments 22.7..24.8, silver cap to 25.9, spire to 33.7 with lucarnes at 27.5, ball and cross to 35.5
const Y = { base: 7.8, bc0: 10.0, bc1: 11.0, s1t: 16.8, arch: 17.3, frieze: 17.9, corn: 18.6, bel: 18.6, belt: 22.6, ped: 22.7, cap: 25.9 };

export function build(K) {
  const P = K.P, M = K.M;
  P.push(CH.x, 0, CH.z, CH.rot);
  P.box(M.blue, CX - HW, CX + HW, Y.base, Y.bc0, CZ - HW, CZ + HW, 'b', 2);                          // the plain blue base above the 7.8 m block
  P.box(M.white, CX - HW - 0.35, CX + HW + 0.35, Y.bc0, Y.bc1, CZ - HW - 0.35, CZ + HW + 0.35, 'b');   // base cornice (the white band with two sunk panels above the ridge)
  P.box(M.blue, CX - HW, CX + HW, Y.bc1, Y.s1t, CZ - HW, CZ + HW, 'b', 2);                          // first stage
  P.box(M.white, CX - HW - 0.3, CX + HW + 0.3, Y.s1t, Y.arch, CZ - HW - 0.3, CZ + HW + 0.3, 'b');   // architrave
  P.box(M.blue, CX - HW + 0.1, CX + HW - 0.1, Y.arch, Y.frieze, CZ - HW + 0.1, CZ + HW - 0.1, '', 2);// frieze (blue) behind the dentils
  P.box(M.white, CX - HW - 0.45, CX + HW + 0.45, Y.frieze, Y.corn, CZ - HW - 0.45, CZ + HW + 0.45, 'b');   // cornice
  P.box(M.blue, CX - HW + 0.25, CX + HW - 0.25, Y.bel, Y.belt, CZ - HW + 0.25, CZ + HW - 0.25, '', 2);     // belfry stage
  P.box(M.white, CX - HW - 0.05, CX + HW + 0.05, Y.belt, Y.ped, CZ - HW - 0.05, CZ + HW + 0.05, 'b');
  for (let k = 0; k < 4; k++) { P.push(CX, 0, CZ, k * Math.PI / 2); face(P, M); P.pop(); }
  // ---- octagonal cap, spire, lucarnes, ball and cross
  G.frustum(P, M.sheet, CX, CZ, Y.ped, Y.ped + 0.7, 8, 3.0, 2.85, -Math.PI / 8, 8, 1, { capTop: M.sheet });
  const prof = [[1, 0], [0.97, 0.12], [0.88, 0.38], [0.68, 0.68], [0.42, 0.9], [0.2, 0.98], [0, 1]];
  G.lathe(P, M.sheet, 'smol-cap', prof, CX, Y.ped + 0.65, CZ, 2.8, 2.55, 24, 12);
  G.tube(P, M.sheet, CX, CZ, Y.cap - 0.1, Y.cap + 0.1, 1.3, 1.3, 8, 1, 1, { a0: -Math.PI / 8 });
  G.frustum(P, M.spire, CX, CZ, Y.cap, 33.7, 8, 1.25, 0.03, -Math.PI / 8, 1, 4, {});
  for (let k = 0; k < 4; k++) {
    P.push(CX, 0, CZ, k * Math.PI / 2); P.push(0, 0, 0.88, 0);
    G.planeShape(P, M.dark, G.archPts(0, 27.0, 0.42, 0.95, 6), 0.0); S.archRing(P, M.white, 0, 27.0, 0.42, 0.95, 0.09, 0, 0.1);
    P.pop(); P.pop();
  }
  S.crossOn(P, M.goldFlat, CX, 33.6, CZ, 1.9);
  P.pop();
}

/** one face of the tower (frame: x right, z out of the face; planes at z = HW (first stage) / HW - 0.2 (belfry)) */
function face(P, M) {
  const z1 = HW, z2 = HW - 0.2;
  // ---- first stage: ONE tall arched opening 2.4 x 4.0 (12.6 .. 16.6), white arch ring, iron balustrade across the lower metre, white corner pilasters, dentils under the cornice
  P.push(0, 0, z1, 0);
  S.archPane(P, M.bell, 0, 12.6, 2.4, 4.0, 0.04); S.archRing(P, M.white, 0, 12.6, 2.4, 4.0, 0.24, 0, 0.14);
  P.box(M.barIron, -1.2, 1.2, 12.95, 13.05, 0.0, 0.1, ''); P.box(M.barIron, -1.2, 1.2, 13.6, 13.67, 0.0, 0.1, '');
  for (let i = 0; i < 12; i++) P.box(M.barIron, -1.15 + i * 0.209, -1.1 + i * 0.209, 12.95, 13.67, 0.02, 0.07, '');
  for (const s of [-1, 1]) P.box(M.white, s * (HW - 0.3) - 0.3, s * (HW - 0.3) + 0.3, Y.bc1, Y.s1t, 0.0, 0.1, 'b');
  S.dentils(P, M.white, -HW, HW, Y.frieze, -0.1, 0.7, 0.3, 0.3, 0.5);
  P.pop();
  // ---- belfry stage: paired pilasters at the corners and beside the opening, the arched bell opening 2.2 x 3.7, the iron rail
  P.push(0, 0, z2, 0);
  S.archPane(P, M.bell, 0, 18.8, 2.2, 3.7, 0.04); S.archRing(P, M.white, 0, 18.8, 2.2, 3.7, 0.22, 0, 0.14);
  P.box(M.barIron, -1.1, 1.1, 19.4, 19.48, 0.0, 0.1, '');
  for (const s of [-1, 1]) for (const x of [1.45, 1.8, 2.45, 2.75]) P.box(M.white, s * x - 0.14, s * x + 0.14, 18.7, 22.5, 0.0, 0.1, 'b');
  P.box(M.white, -HW + 0.25, HW - 0.25, 22.4, Y.belt, 0.0, 0.14, 'b');
  P.pop();
  // ---- pediment on the face: base 22.7, apex 24.8, a winged cherub head in the tympanum
  P.push(0, 0, z2 + 0.1, 0);
  S.pediment(P, M.blue, M.white, -HW, HW, Y.ped, 2.1, 0.0, { th: 0.28 });
  S.sph(P, M.white, 0, 23.6, 0.06, 0.26, 0.28, 0.1, 8);
  for (const s of [-1, 1]) S.sph(P, M.white, s * 0.5, 23.5, 0.05, 0.3, 0.1, 0.06, 6);
  P.pop();
}
