// landmarksMariinsky/roof.js - roofs and the big forms behind the facade of the Mariinsky Theatre (dossier 2.3; photos 05, 08, 16, 20): grey sheet-iron caps over the footprint with the two light wells as holes,
// the portico-block roof, the hipped roof of the south-east wing, the AUDITORIUM DRUM (36 m, a ring of 15 arched windows, cresting railing, shallow cone roof, the lantern with its small dome),
// the gabled STAGE HOUSE with the fan window facing the Kryukov canal, the north stage blocks, chimneys and the black eave railings.  Positions in the theatre frame T (frame.js): drum centre (0, -38),
// stage house u -12.5..15.5, n -72..-54.  No flags (the real roof rim carries one).
import * as THREE from 'three';
import { TW, TL, frameAt, NX, NZ, UX, UZ } from './frame.js';
import { ringFlat } from './geo.js';
import { dome, roundCornice, ringWindows } from './parts.js';
import { H_BLOCK, H_WING } from './theatre.js';

const tw = (pts) => pts.map(([u, n]) => TW(u, n));
const SEG = 30;

export function buildRoofs(K, M, D) {
  const P = K.P;
  const ring = ringFlat(D.poly.o), holes = D.poly.h.map(ringFlat);
  // ---- 1. the base cap at wing level over the whole footprint (light wells are holes)
  P.cap(M.roof, ring, H_WING + 0.02, true, 1.2, holes);
  // ---- 2. the portico-block roof (flat, behind its balustrade) and the north parts
  P.cap(M.roof, tw([[-17, 1.8], [16.6, 1.8], [16.6, -1.8], [23.6, -5.3], [23.6, -19.9], [-24.2, -21.1], [-24.2, -6.2], [-20.6, -6.2], [-17, -2.2]]), H_BLOCK + 0.38, true, 1.2);
  P.cap(M.roof, tw([[-27.9, -21.1], [-24.2, -21.1], [-24.2, -34.6], [-27.9, -34.6]]), 19.4, true, 1.2);
  P.cap(M.roof, tw([[-52, -34.6], [-27.9, -34.6], [-27.9, -68.5], [-52, -68.5]]), 22.4, true, 1.2);
  // ---- 3. the south-east wing: a hip roof (grey sheet iron, flat ridge deck), eaves 16.35 m
  const hip = (u0, u1, n0, n1, y0, rise, inset) => {
    const A = tw([[u0, n1], [u1, n1], [u1, n0], [u0, n0]]), B = tw([[u0 + inset, n1 - inset], [u1 - inset, n1 - inset], [u1 - inset, n0 + inset], [u0 + inset, n0 + inset]]);
    // n1 is the upper bound (near the street), n0 the lower: A / B go round the rectangle
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, a = A[i], b = A[j], c = B[j], d = B[i]; P.quad(M.roof, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0 + rise, c[1]], [d[0], y0 + rise, d[1]], [0, 1, 0], [[a[0] / 1.2, a[1] / 1.2], [b[0] / 1.2, b[1] / 1.2], [c[0] / 1.2, c[1] / 1.2], [d[0] / 1.2, d[1] / 1.2]]); }
    P.cap(M.roof, B, y0 + rise, true, 1.2);
  };
  hip(28.4, 91.3, -82.0, -33.7, H_WING + 0.38, 4.0, 9);
  // wing: ridge-deck skylight box and chimneys
  const chim = (u, n, y, h = 2.2) => { const [x, z] = TW(u, n); P.push(x, 0, z, 0); P.box(M.trimWarm, -0.5, 0.5, y, y + h, -0.5, 0.5, 'b'); P.box(M.trimShade, -0.62, 0.62, y + h, y + h + 0.2, -0.62, 0.62, 'b'); P.pop(); };
  for (const [u, n] of [[40, -45], [52, -45], [64, -45], [76, -45], [40, -70], [52, -70], [64, -70], [76, -70]]) chim(u, n, H_WING + 0.38 + 3.9, 1.8);
  for (const [u, n] of [[-8, -25], [10, -22], [-20, -10], [20, -12], [-36, -50], [-45, -60], [-10, -80]]) chim(u, n, u > -25 && n > -24 ? H_BLOCK + 0.38 : H_WING + 0.02, 2.0);

  // ---- 4. the auditorium drum
  const [dcx, dcz] = TW(0, -38.0), R = 18.0;
  P.cyl(M.wall, [dcx, H_WING, dcz], [dcx, 22.4, dcz], R, R, SEG, false);
  P.cyl(M.trim, [dcx, H_WING + 0.0, dcz], [dcx, H_WING + 0.5, dcz], R + 0.15, R + 0.15, SEG, true);
  P.cyl(M.trim, [dcx, 20.9, dcz], [dcx, 21.3, dcz], R + 0.12, R + 0.12, SEG, true);
  ringWindows(K, dcx, dcz, R, 15, { x: 0, y: 17.4, w: 1.5, h: 3.2, head: 'arch', sw: 0.22, d: 0.1, surMat: M.trim, sill: false, frame: 'white' }, 0.1, SEG);
  ringWindows(K, dcx, dcz, R, 30, { x: 0, y: 21.55, w: 0.8, h: 0.65, head: 'flat', sw: 0.08, d: 0.05, surMat: M.trim, sill: false, frame: 'white' }, 0.0, SEG);
  roundCornice(K, M.trim, M.trimShade, dcx, dcz, 22.4, R + 0.1, 1.4);
  P.cyl(M.wall, [dcx, 23.8, dcz], [dcx, 24.0, dcz], R + 0.3, R + 0.3, SEG, true);
  // cone roof (a flat cone, 12 deg) and the lantern
  P.cyl(M.roof, [dcx, 24.0, dcz], [dcx, 28.4, dcz], R + 0.2, 3.1, SEG, false);
  const rail = []; for (let i = 0; i < SEG; i++) { const a = i / SEG * Math.PI * 2; rail.push([dcx + Math.cos(a) * (R + 0.15), dcz + Math.sin(a) * (R + 0.15)]); }
  K.railing(rail, 24.0, 0.75, true);
  P.cyl(M.wall, [dcx, 28.3, dcz], [dcx, 32.0, dcz], 2.55, 2.55, 16, false);
  P.cyl(M.trim, [dcx, 28.2, dcz], [dcx, 28.7, dcz], 2.8, 2.8, 16, true);
  P.cyl(M.trim, [dcx, 31.6, dcz], [dcx, 32.2, dcz], 2.85, 2.85, 16, true);
  ringWindows(K, dcx, dcz, 2.55, 8, { x: 0, y: 29.1, w: 0.7, h: 2.1, head: 'arch', sw: 0.1, d: 0.06, surMat: M.trim, sill: false, frame: 'white' }, 0.2, 16);
  dome(K, M.roof, dcx, 32.2, dcz, 2.6, 0.8);
  P.cyl(M.iron, [dcx, 34.2, dcz], [dcx, 36.4, dcz], 0.1, 0.03, 6, false);
  P.geo(M.iron, new THREE.SphereGeometry(0.22, 8, 6), dcx, 35.0, dcz);
  K.drum = { x: dcx, z: dcz, top: 36.4 };

  // ---- 5. the stage house: a gabled box behind the drum, its gable with the fan window towards the canal
  const SU0 = -12.5, SU1 = 15.5, SN0 = -72, SN1 = -54, YE = 25.0, YR = 33.0;
  const wq = (c0, c1, nrm) => P.quad(M.wall, [c0[0], H_WING, c0[1]], [c1[0], H_WING, c1[1]], [c1[0], YE, c1[1]], [c0[0], YE, c0[1]], nrm, [[0, H_WING / 3], [4, H_WING / 3], [4, YE / 3], [0, YE / 3]]);
  wq(TW(SU1, SN1), TW(SU1, SN0), [UX, 0, UZ]);                 // south wall (+u)
  wq(TW(SU0, SN0), TW(SU0, SN1), [-UX, 0, -UZ]);               // north wall (-u)
  wq(TW(SU1, SN0), TW(SU0, SN0), [-NX, 0, -NZ]);               // the canal gable wall below the eaves (-n)
  // walls: the +u wall (south), the canal gable wall (n = SN0) and the -u wall are drawn in their frames with windows
  const wallFace = (u, n, face, len, fn) => { P.push(...frameAt(u, n, face)); try { fn(len); } finally { P.pop(); } };
  void wallFace;
  // gable roof: ridge along n at u = 1.5
  const um = (SU0 + SU1) / 2;
  const a0 = TW(SU0, SN0), a1 = TW(SU0, SN1), b0 = TW(SU1, SN0), b1 = TW(SU1, SN1), r0 = TW(um, SN0), r1 = TW(um, SN1);
  P.quad(M.roof, [a0[0], YE, a0[1]], [a1[0], YE, a1[1]], [r1[0], YR, r1[1]], [r0[0], YR, r0[1]], [0, 1, 0]);
  P.quad(M.roof, [b1[0], YE, b1[1]], [b0[0], YE, b0[1]], [r0[0], YR, r0[1]], [r1[0], YR, r1[1]], [0, 1, 0]);
  // gable triangle towards the canal (n = SN0) with the half-round fan window and a cream raking cornice
  P.push(...frameAt(um, SN0 - 0.05, '-n'));
  try {
    const half = (SU1 - SU0) / 2;
    P.fan(M.wall, [[-half, YE, 0], [half, YE, 0], [0, YR, 0]], [0, 0, 1]);
    K.window({ x: 0, y: 27.0, w: 7.0, h: 3.5, head: 'arch', sw: 0.35, d: 0.14, surMat: M.trim, sill: false, frame: 'white', v: 2 });
    P.box(M.trim, -half - 0.4, half + 0.4, YE - 0.5, YE + 0.1, 0, 0.5, 'kb');
    for (const s of [-1, 1]) { const g = new THREE.Shape(); g.moveTo(s * (half + 0.4), YE - 0.5); g.lineTo(s * 0.0, YR + 0.3); g.lineTo(0, YR - 0.2); g.lineTo(s * (half - 0.2), YE - 0.5); P.extrude(M.trim, g, 0, 0.3, 1, 2); }
  } finally { P.pop(); }
  // windows in the long walls of the stage house (south wall faces +u, north wall faces -u)
  for (const [u, face] of [[SU1, 'u'], [SU0, '-u']]) for (const n of [-58, -63, -68]) {
    P.push(...frameAt(u, n, face));
    try { K.window({ x: 0, y: 17.6, w: 1.6, h: 4.2, head: 'arch', sw: 0.22, d: 0.1, surMat: M.trim, sill: false, frame: 'white' }); K.window({ x: 0, y: 22.0, w: 1.3, h: 1.8, head: 'flat', sw: 0.15, d: 0.08, surMat: M.trim, sill: true, frame: 'white' }); } finally { P.pop(); }
  }
  P.cyl(M.trim, [TW(um, SN0)[0], YR + 0.06, TW(um, SN0)[1]], [TW(um, SN1)[0], YR + 0.06, TW(um, SN1)[1]], 0.18, 0.18, 6, false);   // ridge roll

  // ---- 6. black railings along the wing eaves
  for (const e of D.outer) if (e.kind === 'plain' && e.H <= H_WING + 0.1 && e.len > 3) K.railing([e.a, e.b], H_WING + 0.35, 0.8);
}
