// landmarksMariinsky/portico.js - the PORTICO BLOCK of the Mariinsky Theatre (dossier docs/research/mariinsky.md 3.1; photos 09, 05, 08): the central five bays (22.8 m, OSM edge (-3053.6,746.6)-(-3063,725.9))
// with four free-standing white Corinthian columns in front of five recessed arched windows with mascarons, a second row of small windows between pilasters, an entablature with round medallions, a white balustrade
// with posts and urns; the rusticated ground floor with three double doors under the flat glass-and-iron canopy; the two avant-corps (5.5 m wide, 1.8 m proud) with shell-framed ground windows, tall arched niches,
// round windows in stucco cartouches, heavy cornices, attic blocks crowned by the two sculptural groups (genii round a medallion) and the two iron crests behind them.
// Frame: x runs along the facade to the NORTH from the south end of the block (x = 16.6 - u), z = n out of the facade, y up; scale 1 m = 1 unit (photo 09: 40 px per metre at the facade plane).
// No flags: the real roof carries one: omitted.
import * as THREE from 'three';
import { frameAt, TW } from './frame.js';
import { archPath } from './kit.js';

export const XA0 = 5.3, XA1 = 28.1, XE = 33.6, ZP = 1.8;
export const BAYS = [7.5, 11.9, 16.3, 20.7, 25.1], COLS = [9.7, 14.1, 18.5, 22.9], DOORS = [11.9, 16.3, 20.7];
export const H_CORNICE = 18.5, H_TOP = 19.9;

const archFill = (P, mat, x, y0, w, h, z) => {                                   // flat filled round-headed shape (the recess of a niche)
  const r = w / 2, hs = Math.max(0.05, h - r), seg = 10, pts = [[x - r, y0, z], [x + r, y0, z], [x + r, y0 + hs, z]];
  for (let i = 1; i < seg; i++) { const a = Math.PI * i / seg; pts.push([x + Math.cos(a) * r, y0 + hs + Math.sin(a) * r, z]); }
  pts.push([x - r, y0 + hs, z]);
  P.fan(mat, pts.slice(0, 4), [0, 0, 1]);
  P.fan(mat, [[x, y0 + hs, z]].concat(pts.slice(2)), [0, 0, 1]);
};
const sphere = (P, mat, x, y, z, sx, sy, sz, seg = 8) => P.geo(mat, new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)), x, y, z, 0, 0, 0, sx, sy, sz);

/** a stone urn on a post: foot, belly, neck, lip */
function urn(P, mat, x, y, z, s = 1) {
  P.cyl(mat, [x, y, z], [x, y + 0.2 * s, z], 0.2 * s, 0.26 * s, 8, true);
  P.cyl(mat, [x, y + 0.2 * s, z], [x, y + 0.55 * s, z], 0.26 * s, 0.34 * s, 10, false);
  P.cyl(mat, [x, y + 0.55 * s, z], [x, y + 0.82 * s, z], 0.34 * s, 0.2 * s, 10, false);
  P.cyl(mat, [x, y + 0.82 * s, z], [x, y + 1.0 * s, z], 0.2 * s, 0.27 * s, 8, true);
  P.cyl(mat, [x, y + 1.0 * s, z], [x, y + 1.12 * s, z], 0.27 * s, 0.06 * s, 8, true);
}

/** the sculptural group on an avant-corps: a round stucco medallion (monogram disc) flanked by two seated winged genii, grey-white stone (photo 09) */
function genii(K, M, xc, y, z) {
  const P = K.P, g = M.groupStone;
  P.box(g, xc - 1.9, xc + 1.9, y, y + 0.35, z - 0.55, z + 0.55, 'b');                              // plinth
  P.cyl(g, [xc, y + 1.55, z], [xc, y + 1.55, z + 0.28], 0.78, 0.78, 20, true);                    // medallion disc (axis z)
  P.cyl(M.trim, [xc, y + 1.55, z + 0.28], [xc, y + 1.55, z + 0.38], 0.55, 0.55, 20, true);
  P.cyl(g, [xc, y + 1.55, z + 0.38], [xc, y + 1.55, z + 0.46], 0.3, 0.3, 14, true);
  P.box(g, xc - 0.12, xc + 0.12, y + 0.35, y + 0.78, z - 0.1, z + 0.18, 'b');                      // stalk
  for (const s of [-1, 1]) {
    const cx = xc + s * 1.22;
    sphere(P, g, cx, y + 0.78, z + 0.1, 0.34, 0.42, 0.3);                                           // seated torso
    sphere(P, g, cx - s * 0.02, y + 1.38, z + 0.14, 0.2, 0.22, 0.2);                               // head
    P.cyl(g, [cx, y + 0.5, z + 0.1], [cx - s * 0.4, y + 0.42, z + 0.45], 0.1, 0.07, 6, false);     // leg
    P.cyl(g, [cx - s * 0.18, y + 1.05, z + 0.12], [cx - s * 0.62, y + 1.4, z + 0.3], 0.07, 0.05, 6, false);   // arm to the medallion
    for (const k of [0, 1, 2]) {                                                                    // wing: three feathers fanning out behind
      const a = 0.35 + k * 0.32;
      P.quad(g, [cx + s * 0.1, y + 0.95, z - 0.12], [cx + s * (0.1 + Math.sin(a) * 0.9), y + 0.95 + Math.cos(a) * 1.0, z - 0.2], [cx + s * (0.1 + Math.sin(a) * 0.9 - 0.12), y + 0.95 + Math.cos(a) * 1.0, z - 0.2], [cx + s * 0.02, y + 0.95, z - 0.12], [0, 0, 1]);
      P.quad(g, [cx + s * 0.02, y + 0.95, z - 0.12], [cx + s * (0.1 + Math.sin(a) * 0.9 - 0.12), y + 0.95 + Math.cos(a) * 1.0, z - 0.2], [cx + s * (0.1 + Math.sin(a) * 0.9), y + 0.95 + Math.cos(a) * 1.0, z - 0.2], [cx + s * 0.1, y + 0.95, z - 0.12], [0, 0, -1]);
    }
    P.cyl(g, [cx + s * 0.55, y + 0.35, z + 0.02], [cx + s * 0.9, y + 0.35, z + 0.02], 0.2, 0.17, 6, false);   // drapery fold at the foot
  }
}

/** the iron crest on the roof behind an avant-corps: a mast with two lyre-like scrolls and a finial (black, openwork) */
function crest(K, M, x, y, z) {
  const P = K.P, i = M.iron;
  P.cyl(i, [x, y, z], [x, y + 4.0, z], 0.05, 0.03, 5, false);
  for (const s of [-1, 1]) {
    let px = x, py = y + 0.9;
    for (let k = 0; k < 6; k++) { const a = k / 6 * 2.6, nx = x + s * (0.1 + Math.sin(a) * 0.8), ny = y + 0.9 + (1 - Math.cos(a)) * 0.9 + a * 0.3; P.cyl(i, [px, py, z], [nx, ny, z], 0.025, 0.025, 4, false); px = nx; py = ny; }
    P.cyl(i, [x, y + 2.3, z], [x + s * 0.55, y + 2.0, z], 0.02, 0.02, 4, false);
  }
  P.cyl(i, [x - 0.4, y + 2.9, z], [x + 0.4, y + 2.9, z], 0.02, 0.02, 4, false);
  sphere(P, i, x, y + 4.1, z, 0.1, 0.12, 0.1, 6);
  P.cyl(i, [x, y + 4.0, z], [x, y + 4.5, z], 0.025, 0.005, 4, false);
}

function door(K, M, x) {
  const P = K.P;
  P.box(M.trim, x - 1.28, x - 0.98, 0, 3.75, 0, 0.18, 'kb'); P.box(M.trim, x + 0.98, x + 1.28, 0, 3.75, 0, 0.18, 'kb'); P.box(M.trim, x - 1.3, x + 1.3, 3.75, 4.15, 0, 0.24, 'kb');
  P.box(M.door, x - 0.98, x + 0.98, 0, 3.35, 0.02, 0.1, 'kb');                                      // the two leaves
  P.box(M.doorDark, x - 0.02, x + 0.02, 0.02, 3.35, 0.1, 0.115, 'kb');
  for (const sx of [-1, 1]) for (const [y0, y1] of [[0.25, 1.4], [1.6, 3.15]]) P.box(M.doorDark, x + sx * 0.12, x + sx * 0.8, y0, y1, 0.1, 0.13, 'kb');   // raised panels
  K.glass(K.mats.winWhite, x, 3.38, 1.96, 0.35, 'flat', 1, 0.09);                                  // transom light
  P.box(M.trim, x - 0.98, x + 0.98, 3.35, 3.4, 0.02, 0.12, 'kb');
  P.box(M.granite, x - 1.5, x + 1.5, 0, 0.12, 0, 0.5, 'b');                                         // threshold slab
}
function lantern(K, M, x, y) {
  const P = K.P;
  P.cyl(M.iron, [x, y + 0.9, 0.0], [x, y + 0.9, 0.5], 0.03, 0.03, 4, false);                       // bracket
  P.box(M.iron, x - 0.17, x + 0.17, y + 0.55, y + 0.62, 0.35, 0.69, 'b');
  P.box(M.lampGlow, x - 0.13, x + 0.13, y + 0.62, y + 1.0, 0.39, 0.65, 'b');
  P.box(M.iron, x - 0.2, x + 0.2, y + 1.0, y + 1.05, 0.32, 0.72, 'b');
}

function avant(K, M, xc, w) {
  const P = K.P, tr = M.trim;
  // ground floor: small window with a shell surround (ears), cartouche above
  K.window({ x: xc, y: 1.75, w: 0.85, h: 1.55, head: 'flat', sw: 0.28, d: 0.1, surMat: tr, sill: true, frame: 'white', v: 2 });
  K.plane(K.R.shell, xc - 0.75, xc + 0.75, 3.55, 4.4, 0.12);
  P.box(M.graniteLight, xc - w / 2, xc + w / 2, 0, 0.9, 0, 0.12, 'kb');
  // impost course
  P.box(tr, xc - w / 2, xc + w / 2, 5.5, 5.85, 0, 0.22, 'kb');
  // tall blind arched niche between pilasters, a lintel on consoles over it
  archFill(P, M.wallDark, xc, 6.3, 2.3, 6.1, 0.03);
  K.surround(tr, xc, 6.3, 2.3, 6.1, 'arch', 0.3, 0.14);
  for (const s of [-1, 1]) K.pilaster(tr, xc + s * 1.95, 0.5, 6.1, 12.0, 0.16, 0.4);
  P.box(tr, xc - 2.35, xc + 2.35, 12.4, 12.8, 0, 0.3, 'kb');
  for (const s of [-1, 1]) P.box(tr, xc + s * 1.95 - 0.2, xc + s * 1.95 + 0.2, 11.7, 12.4, 0, 0.26, 'kb');
  // second tier: oculus in a big stucco cartouche (the round window 1.0 m)
  K.plane(K.R.cartouche, xc - 1.35, xc + 1.35, 13.4, 16.7, 0.1);
  P.cyl(M.glassDark, [xc, 15.0, 0.1], [xc, 15.0, 0.16], 0.5, 0.5, 18, true);
  P.cyl(tr, [xc, 15.0, 0.1], [xc, 15.0, 0.19], 0.62, 0.55, 18, false);
  // entablature: architrave, frieze, heavy cornice with modillions
  P.box(tr, xc - w / 2, xc + w / 2, 15.9, 16.6, 0, 0.45, 'kb');
  P.box(M.trimShade, xc - w / 2, xc + w / 2, 16.6, 17.5, 0, 0.35, 'kb');
  P.box(K.mats.dentil, xc - w / 2 - 0.1, xc + w / 2 + 0.1, 17.2, 17.5, 0.35, 0.62, 'kb');
  P.box(tr, xc - w / 2 - 0.15, xc + w / 2 + 0.15, 17.5, 18.5, 0, 1.15, 'kb');
  P.box(M.trimShade, xc - w / 2 - 0.15, xc + w / 2 + 0.15, 17.5, 17.62, 0.0, 1.15, 'kb');
  // attic block over the cornice and the group on top
  P.box(M.wall, xc - w / 2 + 0.2, xc + w / 2 - 0.2, 18.5, 21.0, -0.6, 0.6, 'b');
  P.box(tr, xc - w / 2 + 0.05, xc + w / 2 - 0.05, 20.8, 21.1, -0.7, 0.8, 'b');
  K.plane(K.R.panel, xc - 1.6, xc + 1.6, 18.9, 20.5, 0.62);
  genii(K, M, xc, 21.1, 0.0);
  crest(K, M, xc, 21.1, -2.2);
}

export function buildPortico(K, M, svc) {
  const P = K.P, tr = M.trim, xc = (XA0 + XA1) / 2;
  K.mats.lampGlow ||= K.ctx.mat.emissive('#ffe9b8', 0.7);
  M.lampGlow = K.mats.lampGlow;
  P.push(...frameAt(16.6, 0, 'n'));
  try {
    // ---------------- wall faces (central part at z = 0, avant-corps at z = ZP) + the four returns
    K.wallQuad(M.wallRust, XA0, XA1, 0, 5.5, 2.4, 0, 1.2); K.wallQuad(M.wall, XA0, XA1, 5.5, 18.5, 3, 0);
    for (const [x0, x1] of [[0, XA0], [XA1, XE]]) { K.wallQuad(M.wallRust, x0, x1, 0, 5.5, 2.4, ZP, 1.2); K.wallQuad(M.wall, x0, x1, 5.5, 18.5, 3, ZP); }
    const ret = (x, z0, z1, nx) => {
      P.quad(M.wallRust, [x, 0, z0], [x, 0, z1], [x, 5.5, z1], [x, 5.5, z0], [nx, 0, 0], [[z0 / 2.4, 0], [z1 / 2.4, 0], [z1 / 2.4, 4.6], [z0 / 2.4, 4.6]]);
      P.quad(M.wall, [x, 5.5, z0], [x, 5.5, z1], [x, 18.5, z1], [x, 18.5, z0], [nx, 0, 0], [[z0 / 3, 5.5 / 3], [z1 / 3, 5.5 / 3], [z1 / 3, 18.5 / 3], [z0 / 3, 18.5 / 3]]);
    };
    ret(XA0, 0, ZP, 1); ret(XA1, 0, ZP, -1); ret(0, -1.8, ZP, -1); ret(XE, -2.2, ZP, 1);
    // granite plinth
    { let x0 = XA0; for (const d of [...DOORS, 1e9]) { const x1 = Math.min(XA1, d - 1.32); if (x1 > x0 + 0.05) P.box(M.graniteLight, x0, x1, 0, 0.9, 0, 0.12, 'kb'); x0 = d + 1.32; } }   // the plinth is interrupted at the doors

    // ---------------- ground floor, central part: doors, windows, lanterns, notice cases
    for (const x of DOORS) door(K, M, x);
    for (const x of [BAYS[0], BAYS[4]]) {
      K.window({ x, y: 1.25, w: 1.3, h: 2.5, head: 'flat', sw: 0.24, d: 0.1, surMat: tr, sill: true, frame: 'white', v: 1 });
      K.plane(K.R.cartouche, x - 0.6, x + 0.6, 4.0, 5.2, 0.12);
    }
    for (const x of [14.1, 18.5]) lantern(K, M, x, 2.4);
    for (const x of [9.7, 22.9]) lantern(K, M, x, 2.4);
    for (const x of [9.55, 13.9, 18.7, 23.05]) { P.box(tr, x - 0.38, x + 0.38, 1.35, 2.4, 0, 0.1, 'kb'); P.box(M.doorDark, x - 0.3, x + 0.3, 1.43, 2.32, 0.1, 0.12, 'kb'); }
    P.box(tr, XA0, XA1, 5.5, 5.85, 0, 0.26, 'kb');                                                // impost course over the ground floor

    // ---------------- canopy (marquise): glass-and-iron, flat, with tie rods
    P.box(M.canopy, 4.3, 28.9, 5.18, 5.43, 0, 3.4, '');
    P.box(M.canopyEdge, 4.3, 28.9, 4.86, 5.18, 3.18, 3.4, 'b');
    for (const x of [5.0, 9.4, 13.8, 18.2, 22.6, 27.0, 28.2]) P.cyl(M.iron, [x, 5.4, 3.3], [x, 7.2, 0.08], 0.03, 0.03, 4, false);

    // ---------------- piano nobile: five arched windows with archivolts and mascarons, four columns, pilasters
    for (let i = 0; i < 5; i++) {
      const x = BAYS[i];
      P.box(tr, x - 1.4, x + 1.4, 6.78, 7.0, 0, 0.34, 'kb');                                      // sill course
      K.window({ x, y: 7.0, w: 2.3, h: 4.4, head: 'arch', sw: 0.34, d: 0.16, surMat: tr, sill: false, frame: 'white', v: i % 2 ? 3 : 1 });
      K.plane(K.R.mascaron, x - 0.5, x + 0.5, 11.9, 12.9, 0.14);
    }
    for (const x of COLS) {
      P.box(M.wall, x - 0.72, x + 0.72, 5.5, 7.0, 0, 1.6, 'b');                                  // the pier that carries the column
      K.column(tr, x, 0.95, 7.0, 15.9, 0.42, { capH: 1.35, volutes: true, seg: 14 });
    }
    for (const x of [XA0 + 0.4, XA1 - 0.4]) K.pilaster(tr, x, 0.8, 7.0, 15.9, 0.16, 0.5);
    // ---------------- mezzanine row: ten small windows between small pilasters
    for (const b of BAYS) {
      for (const dx of [-1.1, 1.1]) K.window({ x: b + dx, y: 13.4, w: 0.85, h: 2.0, head: 'flat', sw: 0.1, d: 0.06, surMat: tr, sill: false, frame: 'white', v: (b > 15 ? 2 : 3) });
      K.pilaster(tr, b, 0.3, 13.2, 15.6, 0.1, 0.25);
    }
    P.box(tr, XA0, XA1, 12.95, 13.2, 0, 0.18, 'kb');                                              // string course under the mezzanine
    // ---------------- entablature (architrave over the columns, frieze with medallions, cornice with modillions), balustrade
    P.box(tr, XA0 - 0.3, XA1 + 0.3, 15.9, 16.6, 0, 1.5, 'kb');
    P.box(M.trimShade, XA0 - 0.3, XA1 + 0.3, 16.6, 17.5, 0, 1.38, 'kb');
    for (const b of BAYS) K.plane(K.R.medallion, b - 0.42, b + 0.42, 16.68, 17.52, 1.39);
    P.box(K.mats.dentil, XA0 - 0.3, XA1 + 0.3, 17.2, 17.5, 1.38, 1.62, 'kb');
    P.box(tr, XA0 - 0.45, XA1 + 0.45, 17.5, H_CORNICE, 0, 2.0, 'kb');
    P.box(M.trimShade, XA0 - 0.45, XA1 + 0.45, 17.5, 17.62, 0, 2.0, 'kb');
    P.push(0, 0, 0.9);
    K.balustrade(XA0 - 0.3, XA1 + 0.3, H_CORNICE, 1.4, 0.55, tr);
    for (const x of [XA0 - 0.2, ...COLS, XA1 + 0.2]) { P.box(tr, x - 0.28, x + 0.28, H_CORNICE, H_TOP + 0.2, 0.02, 0.6, 'b'); }
    for (const x of [XA0 - 0.2, COLS[1], COLS[3], XA1 + 0.2]) urn(P, tr, x, H_TOP + 0.2, 0.3, 0.9);
    P.pop();
    // ---------------- avant-corps
    P.push(0, 0, ZP);
    try { avant(K, M, XA0 / 2, XA0); } finally { P.pop(); }
    P.push(0, 0, ZP);
    try { avant(K, M, (XA1 + XE) / 2, XE - XA1); } finally { P.pop(); }
    // cornice cap line behind the balustrade joins the avant-corps cornices
  } finally { P.pop(); }
  // services: the three doors
  for (const x of DOORS) { const [wx, wz] = TW(16.6 - x, 2.2); svc.entrances.push({ x: wx, z: wz, name: 'Мариинский театр: главный вход', kind: 'main', rotY: Math.atan2(0.912, -0.414) }); }
  void archPath;
}
