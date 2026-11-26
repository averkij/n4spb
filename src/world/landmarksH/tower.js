// landmarksH/tower.js - the gate tower of the Admiralty (Zakharov 1806-23): the arch cube with the two Nymph groups (atlantes with celestial spheres) and the flying Glories, the trophy frieze,
// the white relief attic "Founding of the fleet", the plain cube with the four seated warriors, the 28-column Ionic colonnade with its 28 statues, the gilded cupola with clocks, the lantern, the
// gilded needle (72 m) and the ship weathervane.  Heights measured on refs/admiralty/007 (14 px / m from the 72 m total) and 008 / 004 / 014 / 026 (details):
//   arch outer ring crown 11.6 (r 7.0 about y 4.6), opening r 4.6, Glories 11.5-14.4, trophy panels 14.2-15.7, frieze 15.8-17.1, cornice 17.0-18.4 (projects 1.7), attic 18.4-22.0 with the relief band,
//   attic cap 22-22.6, plain cube 22.6-25.0 (17.4 m wide), colonnade 25.7-32.1 (8 columns per face, pitch 2.2), entablature 32.1-34.6, statues 2.8 m, cupola 37.9-41.4, lantern -45.0, spire 46 -> 69.6.
// Model frame X = a (ENE), Z = -b (towards the garden); the whole tower is pushed at the arch centre with rotY = ROT.  NO flag / mast (user rule); the ship vane stays.
import * as THREE from 'three';
import { TX, TZ, ROT, M2W, W } from './frame.js';
import { ellip } from './sculpt.js';
import { figureMats } from '../lib/figures.js';
import { nymphGroup, warrior } from './statues.js';
import { band } from './kit.js';
import { registerLOD } from '../../core/spatial.js';
import { shipVaneGeometry } from './ship-vane.js';

const FZ = 12, HW = 18;                                    // lower cube: front plane Z = 12, half width 18, depth 24
const RIN = 4.6, ROUT = 7.0, SPR = 4.6;                    // arch: inner radius (opening), archivolt outer radius, springing height
const ringEdges = (hx, hz) => [
  { a: [-hx, hz], b: [hx, hz], n: [0, 1] }, { a: [hx, hz], b: [hx, -hz], n: [1, 0] }, { a: [hx, -hz], b: [-hx, -hz], n: [0, -1] }, { a: [-hx, -hz], b: [-hx, hz], n: [-1, 0] },
].map((e) => ({ ...e, len: Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) }));

/** texture band around a rectangle ring at offset d: u runs along the edge (tile = uTile m), v spans y0..y1 once */
function texBand(P, edges, y0, y1, d, mat, uTile) {
  let acc = 0;
  for (const e of edges) {
    const A = [e.a[0] + e.n[0] * d, e.a[1] + e.n[1] * d], B = [e.b[0] + e.n[0] * d, e.b[1] + e.n[1] * d];
    const xa = (e.b[0] - e.a[0]) / e.len, za = (e.b[1] - e.a[1]) / e.len;
    A[0] -= xa * d; A[1] -= za * d; B[0] += xa * d; B[1] += za * d;
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [e.n[0], 0, e.n[1]], [[acc / uTile, 0], [(acc + L) / uTile, 0], [(acc + L) / uTile, 1], [acc / uTile, 1]]);
    acc += L;
  }
}

/** a standing robed statue 2.8 m (scale s) facing +z of the current frame */
export function statue(K, mat, x, y, z, rotY = 0, s = 1, pose = 0) {
  const P = K.P;
  P.push(x, y, z, rotY);
  P.cyl(mat, [0, 0, 0], [0, 1.45 * s, 0], 0.42 * s, 0.26 * s, 6, true);
  P.cyl(mat, [0, 1.4 * s, 0], [0, 2.15 * s, 0], 0.27 * s, 0.3 * s, 6, true);
  ellip(P, mat, 0, 2.5 * s, 0, 0.19 * s, 0.24 * s, 0.2 * s, 0, 0, 0, 6);
  const side = pose % 2 ? -1 : 1;
  P.cyl(mat, [side * 0.3 * s, 2.1 * s, 0], [side * 0.5 * s, 2.75 * s, 0.1 * s], 0.07 * s, 0.06 * s, 4, true);   // an arm raised
  P.pop();
}

/** a seated warrior (Achilles / Ajax / Pyrrhus / Alexander): stone seat, torso, crested helmet, spear / shield; 3 m */
function seatedWarrior(K, M, x, y, z, rotY, k = 0) {
  const P = K.P;
  P.push(x, y, z, rotY);
  P.box(M.creamShade, -0.95, 0.95, 0, 0.84, -0.8, 0.45, 'b');                 // rock seat
  warrior(k).place(P, figureMats(K.ctx).keys('plaster', 'plaster'), 0, 0, 0, 0, 1.7);
  P.pop();
}

/** the Nymph group: three women carrying a celestial sphere (white-cream), standing on y = 0 at the origin of the frame, facing +z */
function nymphs(K, M, x, y, z, rotY) {
  const P = K.P;
  P.push(x, y, z, rotY);
  P.box(M.creamShade, -1.4, 1.4, 0, 0.4, -1.1, 1.2, 'b');
  nymphGroup().place(P, figureMats(K.ctx).keys('plaster', 'plaster'), 0, 0.4, 0, 0, 1.85);
  P.pop();
}

export function build(K, ctx, H) {
  const P = K.P, M = H.M, T = H.THREE;
  K.svc.tower = { x: TX, z: TZ, h: 72 };
  P.push(TX, 0, TZ, ROT);

  // ============================================================ the lower cube: wall pieces of each face
  const wallFace = (hw, o = {}) => {
    const arch = !!o.arch;
    // granite base 0 - 1.0 and rusticated ochre 1.0 - 4.6 (gap for the arch)
    const spans = arch ? [[-hw, -RIN], [RIN, hw]] : [[-hw, hw]];
    for (const [x0, x1] of spans) {
      P.box(M.granite, x0, x1, 0, 1.0, 0, 0.16, 'kb', 1.0);
      K.wallQuad(M.rust, x0, x1, 1.0, SPR, 2.4, 0.0, 1.1);
      P.box(M.white, x0 - (x0 === -hw ? 0.2 : 0), x1 + (x1 === hw ? 0.2 : 0), SPR, SPR + 0.5, 0, 0.26, 'kb');          // impost / string course
    }
    // smooth wall with the arch notch up to the frieze (y 15.8), frieze strip, wall to the attic base
    const s = new T.Shape(); s.moveTo(-hw, SPR + 0.5);
    if (arch) { s.lineTo(-RIN, SPR + 0.5); s.lineTo(-RIN, SPR); s.absarc(0, SPR, RIN, Math.PI, 0, true); s.lineTo(RIN, SPR + 0.5); }
    s.lineTo(hw, SPR + 0.5); s.lineTo(hw, 15.8); s.lineTo(-hw, 15.8); s.closePath();
    P.face(M.wall, s, 0, 3, 10);
    K.wallQuad(M.wall, -hw, hw, 17.1, 18.4, 3);
    P.quad(M.frieze, [-hw, 15.8, 0], [hw, 15.8, 0], [hw, 17.1, 0], [-hw, 17.1, 0], [0, 0, 1], [[0, 0], [2 * hw / 2.8, 0], [2 * hw / 2.8, 1], [0, 1]]);
  };
  const faces = [
    { name: 'front', x: 0, z: FZ, rot: 0, hw: HW, arch: true, front: true },
    { name: 'back', x: 0, z: -FZ, rot: Math.PI, hw: HW, arch: true },
    { name: 'east', x: HW, z: 0, rot: Math.PI / 2, hw: FZ, arch: false },
    { name: 'west', x: -HW, z: 0, rot: -Math.PI / 2, hw: FZ, arch: false },
  ];
  for (const f of faces) {
    P.push(f.x, 0, f.z, f.rot);
    wallFace(f.hw, f);
    if (f.arch) archFace(K, M, H, f);
    else sideFace(K, M, H, f);
    P.pop();
  }
  passage(K, M, H);
  // entablature wrapped round the cube: architrave 15.0-15.8, mutules 17.0-17.5, corona 17.5-18.4
  const E = ringEdges(HW, FZ);
  band(P, E, 15.0, 15.8, 0.3, { front: M.white, top: M.white, under: M.whiteShade });
  texBand(P, E, 17.0, 17.5, 1.0, M.mutule, 1.2);
  band(P, E, 17.5, 18.4, 1.7, { front: M.white, top: M.white, under: M.whiteShade });
  band(P, E, 17.0, 17.5, 1.0, { top: null, under: M.whiteShade });
  // the cornice returns on the wings of the roof: top of the cube cornice is a roof ledge at 18.4 (the attic stands behind)

  // ============================================================ attic with the white relief band, cap, roof
  const AH = 17.0, AD = 11.0, AY0 = 18.4, AY1 = 22.0;
  for (const f of faces) {
    const hw = f.front || f.name === 'back' ? AH : AD, dz = f.front || f.name === 'back' ? AD : AH;
    P.push(f.x === 0 ? 0 : Math.sign(f.x) * AH, 0, f.z === 0 ? 0 : Math.sign(f.z) * AD, f.rot);
    const w = hw;
    if (f.name === 'front' || f.name === 'back') {
      K.wallQuad(M.wall, -w, -14.0, AY0, AY1, 3); K.wallQuad(M.wall, 14.0, w, AY0, AY1, 3);
      K.wallQuad(M.wall, -14.0, 14.0, AY0, 19.0, 3); K.wallQuad(M.wall, -14.0, 14.0, 21.6, AY1, 3);
      P.quad(M.attic, [-14, 19.0, 0], [14, 19.0, 0], [14, 21.6, 0], [-14, 21.6, 0], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    } else {
      K.wallQuad(M.wall, -w, w, AY0, AY1, 3);
      // two laurel wreath roundels on the side faces (photo 004)
      for (const [wx, wy] of [[-4.5, 20.4], [4.5, 20.4]]) wreath(K, M, wx, wy, 0.05, 1.5);
    }
    P.pop();
  }
  const E2 = ringEdges(AH, AD);
  band(P, E2, 22.0, 22.6, 0.6, { front: M.white, top: M.white, under: M.whiteShade });
  P.box(M.roofTex, -AH, AH, 22.55, 22.58, -AD, AD, 'b');
  // roof of the cornice ledge between the attic and the cornice edge (y 18.4): zinc
  { const t = 0.03; P.quad(M.zincTex, [-HW, 18.4 + t, FZ], [HW, 18.4 + t, FZ], [HW, 18.4 + t, -FZ], [-HW, 18.4 + t, -FZ], [0, 1, 0], [[0, 0], [8, 0], [8, 5], [0, 5]]); }

  // ============================================================ the four seated warriors at the corners of the attic roof
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) seatedWarrior(K, M, sx * 15.4, 22.6, sz * 9.6, Math.atan2(sx * 0.6, sz), (sx > 0 ? 1 : 0) + (sz > 0 ? 0 : 1));

  // ============================================================ the plain cube 22.6 - 25.0 (17.4 m) with one small window per face
  const UW = 8.7;
  P.box(M.wall, -UW, UW, 22.6, 25.0, -UW, UW, 'b');
  for (const [rot, hz] of [[0, UW], [Math.PI, UW], [Math.PI / 2, UW], [-Math.PI / 2, UW]]) {
    P.push(0, 0, 0, rot);
    P.box(M.dark, -0.5, 0.5, 23.2, 24.5, hz + 0.0, hz + 0.05, 'kb');
    P.box(M.white, -0.65, 0.65, 24.5, 24.65, hz, hz + 0.18, 'kb'); P.box(M.white, -0.65, -0.5, 23.15, 24.5, hz, hz + 0.1, 'kb'); P.box(M.white, 0.5, 0.65, 23.15, 24.5, hz, hz + 0.1, 'kb');
    P.pop();
  }
  band(P, ringEdges(UW, UW), 24.55, 25.0, 0.5, { front: M.white, top: M.white, under: M.whiteShade });
  // stylobate slab 25.0 - 25.7 and the low balustrade ring
  P.box(M.white, -9.3, 9.3, 25.0, 25.7, -9.3, 9.3, 'b');

  // ============================================================ the Ionic colonnade: 28 columns on the ring +-7.7, pitch 2.2
  const CR = 7.7, PITCH = 2.2, CY0 = 25.7, CY1 = 32.1;
  P.box(M.wallShade, -6.6, 6.6, CY0, CY1, -6.6, 6.6, 'b');
  const cols = [];
  for (let i = 0; i < 8; i++) { const x = -CR + PITCH * i; cols.push([x, CR], [x, -CR]); }
  for (let i = 1; i < 7; i++) { const z = -CR + PITCH * i; cols.push([CR, z], [-CR, z]); }
  for (const [x, z] of cols) K.column(M.white, x, z, CY0, CY1, 0.42, { capH: 0.85, seg: 10 });
  // low white balustrade between the columns (a solid rail with a base at 0.9 m)
  for (const [x0, x1, z0, z1] of [[-8.2, 8.2, 8.0, 8.25], [-8.2, 8.2, -8.25, -8.0], [8.0, 8.25, -8.0, 8.0], [-8.25, -8.0, -8.0, 8.0]]) P.box(M.whiteShade, x0, x1, CY0, CY0 + 0.95, z0, z1, 'b');
  // entablature 32.1 - 34.6
  const E3 = ringEdges(8.6, 8.6);
  band(P, E3, 32.1, 33.0, 0.55, { front: M.white, top: M.white, under: M.whiteShade });
  band(P, E3, 33.0, 33.9, 0.45, { front: M.wallPale, top: M.white, under: M.whiteShade });
  band(P, E3, 33.9, 34.6, 1.0, { front: M.white, top: M.white, under: M.whiteShade });
  P.box(M.white, -8.6, 8.6, 33.9, 34.6, -8.6, 8.6, 'b');
  // the 28 statues above the columns (stand on the entablature, facing outwards)
  const stat = [];
  for (let i = 0; i < 8; i++) { const x = -CR + PITCH * i; stat.push([x, 8.9, 0], [x, -8.9, Math.PI]); }
  for (let i = 1; i < 7; i++) { const z = -CR + PITCH * i; stat.push([8.9, z, Math.PI / 2], [-8.9, z, -Math.PI / 2]); }
  stat.forEach(([x, z, r], i) => statue(K, M.white, x, 34.6, z, r, 1, i));

  // ============================================================ attic of the drum 34.6 - 37.4, the gilded cupola with four clocks
  P.box(M.wall, -6.6, 6.6, 34.6, 37.1, -6.6, 6.6, 'b');
  band(P, ringEdges(6.6, 6.6), 37.0, 37.4, 0.3, { front: M.white, top: M.white, under: M.whiteShade });
  P.cyl(M.white, [0, 37.35, 0], [0, 37.9, 0], 5.75, 5.6, 28, true);
  {
    const prof = []; const N = 14;
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI / 2; prof.push(new T.Vector2(Math.max(0.01, 5.5 * Math.cos(a)), 37.9 + 3.55 * Math.sin(a))); }
    P.geo(M.goldD, new T.LatheGeometry(prof, 28), 0, 0, 0);
    for (let k = 0; k < 4; k++) {
      P.push(0, 0, 0, k * Math.PI / 2);
      P.cyl(M.goldDeep, [0, 39.0, 5.0], [0, 39.0, 5.28], 1.18, 1.18, 16, true);                  // gilded hood
      P.cyl(H.clock, [0, 39.0, 5.28], [0, 39.0, 5.32], 1.0, 1.0, 16, true);
      P.pop();
    }
  }
  // lantern, balcony, cap
  P.cyl(M.lantern, [0, 41.4, 0], [0, 45.0, 0], 2.45, 2.45, 24, true);
  P.cyl(M.white, [0, 41.4, 0], [0, 41.7, 0], 3.1, 3.1, 24, true);
  K.railing(Array.from({ length: 25 }, (_, i) => [Math.cos(i / 24 * 6.2832) * 3.0, Math.sin(i / 24 * 6.2832) * 3.0]), 41.7, 0.9, true);
  for (let i = 0; i < 8; i++) {                                                                  // arched windows
    P.push(0, 0, 0, i * Math.PI / 4 + Math.PI / 8);
    P.box(M.dark, -0.4, 0.4, 42.3, 44.0, 2.4, 2.5, 'kb');
    P.cyl(M.dark, [0, 44.0, 2.4], [0, 44.0, 2.5], 0.4, 0.4, 8, true);
    P.pop();
  }
  P.cyl(M.lanternCap, [0, 45.0, 0], [0, 45.45, 0], 2.95, 2.6, 24, true);
  P.cyl(M.lanternCap, [0, 45.45, 0], [0, 45.95, 0], 2.55, 1.2, 24, true);

  // ============================================================ the gilded needle and the ship (four-sided, faces to the facades)
  P.push(0, 0, 0, Math.PI / 4);
  P.cyl(M.gold, [0, 45.9, 0], [0, 56.0, 0], 3.0, 1.7, 4, true);                                  // the needle is drawn ~1.4x thicker than the real one (3 m at the foot) so that it reads from 2 km
  P.cyl(M.gold, [0, 56.0, 0], [0, 69.7, 0], 1.7, 0.2, 4, true);
  P.pop();
  ellip(P, M.gold, 0, 70.15, 0, 0.55, 0.62, 0.55, 0, 0, 0, 8);                                    // the "apple"
  ship(K, M, 70.7);
  P.pop();
  farSpire(ctx, T);

  // ============================================================ colliders: the pylons beside the passage, the two sculpture pedestals, the walls are the OSM ring (facade.js)
  const box = (a0, a1, b0, b1, y1, y0 = 0) => { const [cx, cz] = W((a0 + a1) / 2, (b0 + b1) / 2); ctx.physics.addBox(cx, cz, a1 - a0, b1 - b0, ROT, y0, y1); };
  box(-HW, -RIN, -FZ, FZ, 24); box(RIN, HW, -FZ, FZ, 24);
  K.svc.passage = { a0: -RIN, a1: RIN, b0: -FZ, b1: FZ };
  K.svc.monuments.push({ id: 'admiralty-spire', name: 'Адмиралтейство, шпиль', nameEn: 'Admiralty spire (72 m)', x: TX, z: TZ, h: 72 });
}

/** the face with the arch (front / back): archivolt with voussoirs, trophy panels, Glories, pedestals + Nymph groups (front only) */
function archFace(K, M, H, f) {
  const P = K.P, T = H.THREE;
  // archivolt: white annulus + ochre voussoirs with white joints
  const ring = new T.Shape(); ring.moveTo(RIN, SPR); ring.lineTo(ROUT, SPR); ring.absarc(0, SPR, ROUT, 0, Math.PI, false); ring.lineTo(-RIN, SPR); ring.absarc(0, SPR, RIN, Math.PI, 0, true); ring.closePath();
  P.extrude(M.white, ring, 0, 0.34, 1, 24);
  const N = 22, g = 0.012;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N + g, a1 = Math.PI * (i + 1) / N - g, r0 = RIN + 0.04, r1 = ROUT - 0.04, z = 0.355;
    const p = (a, r) => [Math.cos(a) * r, SPR + Math.sin(a) * r, z];
    P.quad(M.wall, p(a0, r0), p(a1, r0), p(a1, r1), p(a0, r1), [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // the decorated mouth of the passage: a recessed white ring (relief of ships, trophies) between r 3.7 and 4.6 at depth 0.9
  const mouth = new T.Shape(); mouth.moveTo(-RIN, 0); mouth.lineTo(RIN, 0); mouth.lineTo(RIN, SPR); mouth.absarc(0, SPR, RIN, 0, Math.PI, false); mouth.lineTo(-RIN, 0);
  const hole = new T.Path(); hole.moveTo(-3.7, 0); hole.lineTo(-3.7, SPR); hole.absarc(0, SPR, 3.7, Math.PI, 0, true); hole.lineTo(3.7, 0); hole.lineTo(-3.7, 0); mouth.holes.push(hole);
  P.face(M.whiteShade, mouth, -0.9, 3, 16);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i + 0.5) / 9, r = 4.15; P.box(M.cream, Math.cos(a) * r - 0.22, Math.cos(a) * r + 0.22, SPR + Math.sin(a) * r - 0.22, SPR + Math.sin(a) * r + 0.22, -0.9, -0.78, 'kb'); }
  // the barrel vault and the walls of the passage (shared by both faces: built once from the front)
  // Glories (flying angels with trumpets) above the arch and the two trophy panels
  const GW = 6.6, GH = 3.3;
  P.quad(H.glory, [-3.6 - GW / 2, 11.5, 0.07], [-3.6 + GW / 2, 11.5, 0.07], [-3.6 + GW / 2, 11.5 + GH, 0.07], [-3.6 - GW / 2, 11.5 + GH, 0.07], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(H.glory, [3.6 + GW / 2, 11.5, 0.07], [3.6 - GW / 2, 11.5, 0.07], [3.6 - GW / 2, 11.5 + GH, 0.07], [3.6 + GW / 2, 11.5 + GH, 0.07], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const sx of [-1, 1]) {
    P.quad(H.panelWreaths, [sx * 11.6 - 2.4, 13.9, 0.0], [sx * 11.6 + 2.4, 13.9, 0.0], [sx * 11.6 + 2.4, 15.5, 0.0], [sx * 11.6 - 2.4, 15.5, 0.0], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.white, sx * 11.6 - 2.5, sx * 11.6 + 2.5, 13.8, 13.95, 0, 0.1, 'kb'); P.box(M.white, sx * 11.6 - 2.5, sx * 11.6 + 2.5, 15.45, 15.6, 0, 0.1, 'kb');
  }
  // pink-granite pedestals with the Nymph groups
  for (const sx of [-1, 1]) {
    const x = sx * 11.8;
    P.box(M.granRust, x - 1.8, x + 1.8, 0, 4.35, 0, 2.4, 'kb', 2.4);
    P.box(M.graniteLight, x - 2.0, x + 2.0, 4.35, 4.8, -0.0, 2.6, 'kb');
    P.box(M.granite, x - 2.0, x + 2.0, 0.0, 0.5, 0, 2.6, 'kb');
    if (f.front) nymphs(K, M, x, 4.8, 1.25, sx > 0 ? -0.15 : 0.15);
  }
}

/** the vault + side walls of the passage, z from FZ-0.0 to -FZ; reveal r 4.6 for 0.9 m, then r 3.7 */
function passage(K, M, H) {
  const P = K.P;
  const vault = (r, ys, z0, z1) => {
    const len = Math.abs(z1 - z0), seg = 20;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg, mid = (a0 + a1) / 2, n = [-Math.cos(mid), -Math.sin(mid), 0];
      const p = (a, z) => [Math.cos(a) * r, ys + Math.sin(a) * r, z];
      P.quad(H.coffer, p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1), n, [[i / seg * 3, 0], [(i + 1) / seg * 3, 0], [(i + 1) / seg * 3, len / 3], [i / seg * 3, len / 3]]);
    }
    for (const s of [-1, 1]) P.quad(M.wallShade, [s * r, 0, z0], [s * r, 0, z1], [s * r, ys, z1], [s * r, ys, z0], [-s, 0, 0], [[z0 / 3, 0], [z1 / 3, 0], [z1 / 3, ys / 3], [z0 / 3, ys / 3]]);
  };
  vault(RIN, SPR, FZ, FZ - 0.9);
  vault(3.7, SPR, FZ - 0.9, -FZ + 0.9);
  vault(RIN, SPR, -FZ + 0.9, -FZ);
  // paving of the passage
  P.quad(M.graniteLight, [-RIN, 0.06, FZ + 1.0], [RIN, 0.06, FZ + 1.0], [RIN, 0.06, -FZ - 1.0], [-RIN, 0.06, -FZ - 1.0], [0, 1, 0], [[0, 0], [3, 0], [3, 10], [0, 10]]);
}

/** side faces (east / west of the cube): plain ochre with a small window */
function sideFace(K, M, H, f) {
  const P = K.P;
  for (const x of [-4.5, 4.5]) {
    P.box(M.dark, x - 0.55, x + 0.55, 6.0, 8.8, 0.0, 0.05, 'kb');
    P.box(M.white, x - 0.7, x + 0.7, 8.8, 9.0, 0, 0.2, 'kb'); P.box(M.white, x - 0.7, x - 0.55, 5.95, 8.8, 0, 0.12, 'kb'); P.box(M.white, x + 0.55, x + 0.7, 5.95, 8.8, 0, 0.12, 'kb');
  }
  wreath(K, M, 0, 12.2, 0.06, 1.6);
}

/** a laurel wreath roundel (torus ring + a ribbon knot) facing +z of the current frame */
function wreath(K, M, x, y, z, r) {
  const P = K.P;
  P.geo(M.white, K.wreathGeo || (K.wreathGeo = new THREE.TorusGeometry(1, 0.13, 6, 18)), x, y, z, 0, 0, 0, r, r, r);
  P.box(M.white, x - 0.18, x + 0.18, y - r - 0.3, y - r + 0.2, z - 0.05, z + 0.12, '');
}

/** Pierced copper broadside, bent sails, rigging and crown from the Blender model. */
function ship(K, M, y0) {
  const vane = new THREE.Mesh(shipVaneGeometry(), M.gold);
  vane.name = 'admiralty-ship-vane';
  vane.position.set(TX, y0, TZ);
  vane.rotation.y = ROT;
  K.root.add(vane);
  vane.updateMatrixWorld();
  registerLOD(vane, 500);
  K.tris += vane.geometry.index.count / 3;
}
void M2W;

/** FAR GLINT: from 1-3 km down Nevsky the real needle (3 m at the foot, 0.4 m at the tip) is smaller than a pixel, yet it is THE landmark that ends the vista (and in the sun it flashes like a
 *  gold line).  A camera-facing gold ribbon whose width never drops below ~3 px at the foot / ~1.2 px at the tip is added; within ~600 m it hides inside the real spire. */
function farSpire(ctx, T) {
  const g = new T.BufferGeometry(), pos = new Float32Array(4 * 3);
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array(8), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const mat = ctx.mat.toon('#f0c23c', { emissive: '#8a6410', emissiveIntensity: 0.8, side: 'double', name: 'lmH-farSpire' });
  mat.fog = false;
  const mesh = new T.Mesh(g, mat); mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.name = 'lmH-farSpire';
  ctx.noOutline(mesh); ctx.add(mesh);
  ctx.onUpdate(() => {
    const c = ctx.camera.position, dx = c.x - TX, dz = c.z - TZ, d = Math.hypot(dx, dz) || 1;
    mesh.visible = d > 450;
    const rx = -dz / d, rz = dx / d, k = 1.67e-3 * Math.hypot(d, c.y - 40);       // metres per pixel at this distance
    const hb = Math.max(1.2, 1.6 * k), ht = Math.max(0.15, 0.55 * k);
    const y0 = 47.0, y1 = 70.2, a = pos, ox = dx / d * 4, oz = dz / d * 4;      // QA: the ribbon stands 4 m nearer to the camera than the needle axis (the fog-washed real needle covered its middle: gold edges round a pale triangle)
    a[0] = TX + ox - rx * hb; a[1] = y0; a[2] = TZ + oz - rz * hb;
    a[3] = TX + ox + rx * hb; a[4] = y0; a[5] = TZ + oz + rz * hb;
    a[6] = TX + ox + rx * ht; a[7] = y1; a[8] = TZ + oz + rz * ht;
    a[9] = TX + ox - rx * ht; a[10] = y1; a[11] = TZ + oz - rz * ht;
    g.attributes.position.needsUpdate = true; g.computeBoundingSphere();
  });
}
