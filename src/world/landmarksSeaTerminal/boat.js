// landmarksSeaTerminal/boat.js - the TORPEDO-BOAT MONUMENT «Комсомолец» (project 123K, 20 m, on its granite plinth since 1973, repaired April 2025; OSM w53500959) at the Gavan shore: the riveted lilac-grey boat with its bow
// raised ~6.5 deg on the granite plinth WEDGE (17 x 4.2 m, 1.0 m high at the stern end, 2.5 m at the lettering end, a low stern platform; «1941-45» in dark red and the gold dedication on the long face), two torpedo tubes, the low bridge with the radome mast, the twin 25-mm AA gun in its
// round tub (silent static props), the flat open transom; the 24 x 9 m lawn inside a chain barrier of 22 black cast-iron bollards (1.1 m) with chains, the brick footpath with its granite kerb, the bronze board on its stand
// with the full plaque text.  Dossier docs/research/seaterminal.md section 7 (photos t01 t03 t04 t05 t07).  Frame B (frame.js): +z = BOW (SSW), +x = PORT (ESE, the lettering side), y up.
import * as THREE from 'three';
import * as L from '../layout.js';
import { B, BOAT, STARS } from './frame.js';
import { partsGeos, addInstanced, mat4, kBays } from './inst.js';

import { knockFurniture } from '../lib/knock-furniture.js';      // n4spb: the bronze board on its stand is a knock record      // n4spb (docs/AREAS.md 13.7, 15.v): the bollard chain is a row of breakable bays
import { polyShape, extrudeShape } from './geo.js';

// REVIEW 2026-10-09 (photos t01 t02 t06 t07): the real plinth is a WEDGE of granite: its top slopes up toward the bow (face 1.0 m at the stern end, 2.5 m at the lettering end) and the boat's keel lies on that slope, the
// forward third of the hull overhanging the plinth end on the rising keel rocker; the first pass had a flat 2.4 m block with a thin 1.35 m deep hull pitched off it (a floating plank).  The hull is now 1.95 .. 2.45 m deep
// at the side (keel to deck), the bow fuller with a raked stem, and the plinth is the wedge with a lower stern platform.
const PL_Y0 = 1.0, PL_Y1 = 2.5;                               // plinth face height at the stern end (z -hl) and at the bow / lettering end (z +hl)
const PITCH = -Math.atan((PL_Y1 - PL_Y0) / 17.0);             // rotation about +x that raises the bow (+z): 5.0 deg, the slope of the plinth top (the keel rocker adds the rest)
const PIV_Z = -9.4, PIV_Y = PL_Y0 - 0.0882 * 0.9;             // the stern end of the keel rests on the plinth top, 0.9 m beyond its stern end (the stern platform is 1.0 m)
// hull stations (boat frame: z' 0 = transom .. 20 = stem tip; y' above the straight keel line): deck half-width, deck height, chine height, keel height
const HS = [0, 2, 5, 8, 11, 13, 15, 17, 18.5, 19.5, 20];
const HWD = [1.75, 1.75, 1.75, 1.75, 1.74, 1.62, 1.40, 1.05, 0.66, 0.34, 0.10];
const HYD = [1.95, 1.97, 2.00, 2.04, 2.10, 2.15, 2.22, 2.30, 2.38, 2.43, 2.46];
const HYC = [0.70, 0.70, 0.70, 0.72, 0.80, 0.92, 1.08, 1.30, 1.58, 1.90, 2.20];
const HYK = [0, 0, 0, 0, 0.05, 0.20, 0.45, 0.85, 1.30, 1.80, 2.20];
const bt = (z) => Math.max(0, Math.min(1, (z - 9) / 11));
const HWC = HWD.map((w, i) => Math.max(0.06, w - 0.05 - 0.18 * Math.pow(bt(HS[i]), 1.4)));          // chine half-width: the topsides flare outward toward the bow
const HKW = HWD.map((w) => Math.min(0.45, w * 0.55));
/** piecewise-linear table lookup at boat z' */
function tab(z, T) { if (z <= HS[0]) return T[0]; for (let i = 0; i + 1 < HS.length; i++) if (z <= HS[i + 1]) { const f = (z - HS[i]) / (HS[i + 1] - HS[i]); return T[i] + (T[i + 1] - T[i]) * f; } return T[T.length - 1]; }
/** x of the hull side at boat z' and height y' (between the chine and the deck edge; the topsides are plates leaning out a little) */
const sideX = (z, y) => { const c = tab(z, HYC), d = tab(z, HYD), wc = tab(z, HWC), wd = tab(z, HWD); return wc + (wd - wc) * Math.max(0, Math.min(1, (y - c) / Math.max(0.01, d - c))); };

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] boat/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  P.push(B.x, 0, B.z, B.rot);
  try {
    stage('plinth', () => plinth(K));
    stage('boat', () => boat(K));
    stage('setting', () => setting(K));
    stage('plaque', () => plaque(K));
  } finally { P.pop(); }
  stage('bollards', () => bollards(K));
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the stepped granite plinth
function plinth(K) {
  const P = K.P, M = K.M, hw = BOAT.plinth.w / 2, hl = BOAT.plinth.len / 2;
  const yT = (z) => PL_Y0 + (PL_Y1 - PL_Y0) * (z + hl) / (2 * hl);                                  // the sloping top
  // base course (0.3 m, 0.35 m proud), the wedge (long faces are trapezoids), the polished sloping top, the lower stern platform (z -hl - 3.4 .. -hl, flush with the stern end face)
  P.box(M.plinth, -hw - 0.35, hw + 0.35, 0, 0.3, -hl - 0.35, hl + 0.35, 'b', 2.8);
  const q = (p0, p1, p2, p3, n, a, b) => P.quad(M.plinth, p0, p1, p2, p3, n, [[0, 0], [a / 2.8, 0], [a / 2.8, b / 2.4], [0, b / 2.4]]);
  q([hw, 0, hl], [hw, 0, -hl], [hw, yT(-hl), -hl], [hw, yT(hl), hl], [1, 0, 0], 2 * hl, PL_Y1);          // the long (ESE) face: the lettering side
  q([-hw, 0, -hl], [-hw, 0, hl], [-hw, yT(hl), hl], [-hw, yT(-hl), -hl], [-1, 0, 0], 2 * hl, PL_Y1);
  q([-hw, 0, hl], [hw, 0, hl], [hw, yT(hl), hl], [-hw, yT(hl), hl], [0, 0, 1], 2 * hw, PL_Y1);           // the bow end face, the tall one
  P.quad(M.plinthTop, [-hw, yT(hl), hl], [hw, yT(hl), hl], [hw, yT(-hl), -hl], [-hw, yT(-hl), -hl], [0, 1, 0.09]);
  const sp0 = -hl - 3.4;                                                                              // the stern platform: a low flat step, as on t06 right of the stern
  P.box(M.plinth, -hw, hw, 0, PL_Y0, sp0, -hl, 'bft', 2.8);
  P.quad(M.plinthTop, [-hw, PL_Y0, -hl], [hw, PL_Y0, -hl], [hw, PL_Y0, sp0], [-hw, PL_Y0, sp0], [0, 1, 0]);
  // the lettering on the long face: «1941-45» (dark red) at the bow end, the dedication in gold; read left to right as seen from the lot (bow on the left).  The quad is a cut-out sheet: where the face is lower
  // than the quad (the stern third) it only carries transparent texels.
  const x = hw + 0.03;
  P.quad(M.plinthText, [x, 0.1, hl], [x, 0.1, -hl], [x, 2.3, -hl], [x, 2.3, hl], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

// ------------------------------------------------------------------------------------------------ the boat (frame b: origin = the stern end of the keel, +z' bow, y' up; pitched up by 8.4 deg about the pivot)
function boat(K) {
  const P = K.P, M = K.M;
  P.push(0, PIV_Y, PIV_Z, 0); P.m.multiply(new THREE.Matrix4().makeRotationX(PITCH));
  try {
    const deckY = (z) => tab(z, HYD);
    for (let i = 0; i + 1 < HS.length; i++) {
      const za = HS[i], zb = HS[i + 1], wa = HWD[i], wb = HWD[i + 1], ya = HYD[i], yb = HYD[i + 1], ca = HYC[i], cb = HYC[i + 1], ka = HYK[i], kb = HYK[i + 1];
      const xa = HWC[i], xb = HWC[i + 1], ea = HKW[i], eb = HKW[i + 1];
      for (const s of [1, -1]) {
        // the riveted topside plates (chine -> deck edge, leaning out a little) and the V bottom plates (keel edge -> chine); the stations are the plate seams
        P.quad(M.boat, [s * xa, ca, za], [s * xb, cb, zb], [s * wb, yb, zb], [s * wa, ya, za], [s, 0, 0], [[za / 2.4, ca / 1.2], [zb / 2.4, cb / 1.2], [zb / 2.4, yb / 1.2], [za / 2.4, ya / 1.2]]);
        P.quad(M.boat, [s * xa, ca, za], [s * ea, ka, za], [s * eb, kb, zb], [s * xb, cb, zb], [s * 0.7, -1, 0], [[za / 2.4, 0], [za / 2.4, 0.4], [zb / 2.4, 0.4], [zb / 2.4, 0]]);
      }
      P.quad(M.boat, [-ea, ka, za], [ea, ka, za], [eb, kb, zb], [-eb, kb, zb], [0, -1, 0]);                                  // the flat keel strip (seen from under the overhanging bow)
      P.quad(M.boatDeck, [-wa, ya, za], [wa, ya, za], [wb, yb, zb], [-wb, yb, zb], [0, 1, 0], [[-wa / 2, za / 2], [wa / 2, za / 2], [wb / 2, zb / 2], [-wb / 2, zb / 2]]);
    }
    // the flat transom with its launch skeg, the stem plate at the tip (a raked, sharp stem: the keel and the chine run up to meet the deck edge at z' 20)
    const n = HS.length - 1;
    P.quad(M.boat, [HWC[0], HYC[0], 0], [-HWC[0], HYC[0], 0], [-HWD[0], HYD[0], 0], [HWD[0], HYD[0], 0], [0, 0, -1], [[0, 0], [3.5 / 2.4, 0], [3.5 / 2.4, 0.9], [0, 0.9]]);
    P.quad(M.boat, [HKW[0], 0, 0], [-HKW[0], 0, 0], [-HWC[0], HYC[0], 0], [HWC[0], HYC[0], 0], [0, -0.5, -1]);
    P.quad(M.boat, [HWC[n], HYC[n], HS[n]], [-HWC[n], HYC[n], HS[n]], [-HWD[n], HYD[n], HS[n]], [HWD[n], HYD[n], HS[n]], [0, 0, 1]);
    // two dark rubbing strakes per side (0.12 x 9 m at y' +1.0 and +1.45 on the topside plates), a round porthole at the stern
    for (const yr of [1.0, 1.45]) for (const s of [1, -1]) { const x = sideX(5, yr + 0.06); P.box(M.strake, s > 0 ? x - 0.02 : -x - 0.05, s > 0 ? x + 0.05 : -x + 0.02, yr, yr + 0.12, 1.0, 10.0, 'b', 1); }
    for (const s of [1, -1]) { const x = sideX(1.3, 1.45); P.cyl(M.boatDark, [s * (x + 0.01), 1.45, 1.3], [s * (x + 0.05), 1.45, 1.3], 0.13, 0.13, 8, true); }
    // the red star on the bow flank (DECISION: STARS): 0.5 m, on both sides at z' 15
    // REVIEW: a plain red star (photo t05: the boat's star carries no number; the shared D-2 star texture has the white 5), a flat 10-point fan from its centre 5 cm off the plate
    if (STARS) for (const s of [1, -1]) {
      const x = s * (sideX(15, 1.7) + 0.05), cy = 1.7, cz = 15, pts = [[x, cy, cz]];
      for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.11 : 0.27; pts.push([x, cy + Math.sin(a) * r, cz + Math.cos(a) * r * s]); }
      P.fan(M.armRed, pts, [s, 0, 0]);
    }
    deckGear(K, HYD[0], deckY);
  } finally { P.pop(); }
}

/** everything on the deck, in the boat frame (z' = z of the boat frame + 10): tubes, bridge, mast, AA tub */
function deckGear(K, yD, deckY) {
  const P = K.P, M = K.M, zc = (z) => z + 10;                   // frame-B z (centre based) -> boat z'
  // two torpedo tubes (D 0.55 x 8.6 m, grey-white, five ring bands) either side of the centre line, from z -7.6 to +1.0
  for (const s of [-0.78, 0.78]) {
    const za = zc(-7.6), zb = zc(1.0), y = deckY(za) + 0.32;
    P.cyl(M.tubeGrey, [s, y, za], [s, y + 0.06, zb], 0.275, 0.275, 12, true);
    for (let k = 0; k < 5; k++) { const f = (k + 0.5) / 5, z = za + (zb - za) * f; P.cyl(M.boatDark, [s, y + 0.06 * f, z - 0.05], [s, y + 0.06 * f, z + 0.05], 0.31, 0.31, 12, false); }
    P.cyl(M.boatDark, [s, y, za - 0.15], [s, y, za], 0.2, 0.275, 10, true);
    P.col(M.boatDark, s, zc(-1.2), y - 0.3, y, 0.07, 0.07, 5, false);
  }
  // the low bridge (1.8 x 1.4 x 1.3 m) at z +1.5: windshield slits, the mast (2.2 m) with the radome (D 1.0 x 1.3), a 4 m whip, an A-frame stay
  const bz = zc(1.5), by = deckY(bz);
  P.box(M.boat, -0.9, 0.9, by, by + 1.3, bz - 0.7, bz + 0.7, 'b', 1.8);
  P.box(M.boatDark, -0.7, 0.7, by + 0.7, by + 1.05, bz + 0.7, bz + 0.73, 'b', 1);
  P.box(M.boatDeck, -0.95, 0.95, by + 1.3, by + 1.38, bz - 0.75, bz + 0.75, 'b', 1);
  P.col(M.radome, 0, bz, by + 1.38, by + 3.6, 0.07, 0.06, 6, true);
  const dome = new THREE.SphereGeometry(1, 12, 8); P.geo(M.radome, dome, 0, by + 4.35, bz, 0, 0, 0, 0.5, 0.65, 0.5); dome.dispose();
  P.cyl(M.boatDark, [0.35, by + 1.38, bz - 0.4], [0.35, by + 5.4, bz - 0.4], 0.02, 0.012, 4, false);
  for (const s of [-0.7, 0.7]) P.cyl(M.boatDark, [s, by + 1.38, bz - 0.6], [0, by + 3.4, bz], 0.03, 0.025, 4, false);
  // the AA tub (D 1.5 x 1.1 m) at z -6.3 with the twin 25-mm gun (barrels 1.0 m, up 30 deg toward the stern) behind a splinter shield: silent static props
  const az = zc(-6.3), ay = deckY(az);
  P.col(M.aaGrey, 0, az, ay, ay + 1.1, 0.75, 0.75, 14, true);
  P.col(M.aaGrey, 0, az, ay + 1.1, ay + 1.18, 0.82, 0.82, 14, true);
  P.box(M.aaGrey, -0.45, 0.45, ay + 1.18, ay + 1.7, az + 0.1, az + 0.55, 'b', 1);
  for (const s of [-0.12, 0.12]) P.cyl(M.boatDark, [s, ay + 1.5, az], [s, ay + 1.5 + 0.5, az - 0.87], 0.04, 0.03, 5, true);
  // the flat open transom with a low rail and two diagonal braces (photo t04)
  P.cyl(M.boatDark, [-1.7, yD + 0.7, 0.05], [1.7, yD + 0.7, 0.05], 0.025, 0.025, 4, false);
  for (const x of [-1.7, -0.57, 0.57, 1.7]) P.cyl(M.boatDark, [x, yD, 0.05], [x, yD + 0.7, 0.05], 0.02, 0.02, 4, false);
  for (const x of [-1.15, 1.15]) P.cyl(M.boatDark, [x - 0.57, yD, 0.05], [x + 0.57, yD + 0.7, 0.05], 0.015, 0.015, 4, false);
  // a short bare bow stub for the (omitted) ensign: nothing; the bow bollards
  for (const s of [-0.5, 0.5]) P.col(M.boatDark, s, 16.5, deckY(16.5), deckY(16.5) + 0.22, 0.07, 0.07, 6, true);
}

// ------------------------------------------------------------------------------------------------ the setting: lawn 24 x 9 m, the brick footpath with its granite kerb on the road side, the lamp stub is the streets'
function setting(K) {
  const P = K.P, M = K.M, lw = BOAT.lawn;
  P.quad(M.lawn, [-lw.hw, 0.04, lw.hl], [lw.hw, 0.04, lw.hl], [lw.hw, 0.04, -lw.hl], [-lw.hw, 0.04, -lw.hl], [0, 1, 0]);
  // brick footpath (2.4 m) along the ESE side of the chain, kerb 0.25 m outside it
  const x0 = lw.hw + 0.4, x1 = x0 + 2.4;
  P.quad(M.brick, [x0, 0.05, 13], [x1, 0.05, 13], [x1, 0.05, -13], [x0, 0.05, -13], [0, 1, 0], [[x0 / 2, 13 / 2], [x1 / 2, 13 / 2], [x1 / 2, -13 / 2], [x0 / 2, -13 / 2]]);
  P.box(M.kerb, x1, x1 + 0.25, 0, 0.15, -13, 13, 'b', 1); P.box(M.kerb, x0 - 0.25, x0, 0, 0.12, -13, 13, 'b', 1);
}

// ------------------------------------------------------------------------------------------------ the bronze board (0.55 x 0.40 m) on a black steel stand, tilted, in front of the plinth near the bow end
function plaque(K) {
  const M = K.M, x = BOAT.plinth.w / 2 + 1.2, zc = 6.5;
  const geo = partsGeos((P) => {      // (frame B local coordinates; moved to the origin of the spot below)
    for (const dz of [-0.22, 0.22]) P.cyl(M.plaqueBack, [x + 0.05, 0, zc + dz], [x - 0.02, 0.98, zc + dz], 0.025, 0.02, 5, false);
    P.quad(M.plaque, [x + 0.12, 0.92, zc + 0.275], [x + 0.12, 0.92, zc - 0.275], [x - 0.12, 1.32, zc - 0.275], [x - 0.12, 1.32, zc + 0.275], [0.8, 0.6, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.plaqueBack, [x - 0.115, 1.32, zc + 0.28], [x - 0.115, 1.32, zc - 0.28], [x + 0.115, 0.92, zc - 0.28], [x + 0.115, 0.92, zc + 0.28], [-0.8, -0.6, 0]);
  });
  for (const { geo: g } of geo.list) { g.translate(-x, 0, -zc); g.computeBoundingSphere(); }
  const w = B.W(x, zc), item = K.ctx.physics.addBox(w.x, w.z, 0.3, 0.7, B.rot, 0, 1.4);
  K.extraTris += knockFurniture(K.ctx, 'lmseate-plaque', geo, [{ x: w.x, y: 0, z: w.z, rotY: B.rot }], [item], { kind: 'sign', mass: 30, h: 1.4, w: 0.3, d: 0.7, anchored: 6, hitK: 0.15, metal: true, minDv: 0 }, 160);
}

// ------------------------------------------------------------------------------------------------ the chain barrier: 22 black bollards (1.1 m) round the lawn, chains with 0.3 m sag
function bollards(K) {
  const M = K.M, ctx = K.ctx, lw = BOAT.lawn, P = K.P;
  const parts = partsGeos((p) => {
    p.col(M.bollard, 0, 0, 0, 0.3, 0.2, 0.15, 8, true); p.col(M.bollard, 0, 0, 0.3, 0.38, 0.19, 0.19, 8, true);
    p.col(M.bollard, 0, 0, 0.38, 0.95, 0.12, 0.1, 8, true); p.col(M.bollard, 0, 0, 0.92, 1.0, 0.16, 0.16, 8, true);
    const ball = new THREE.SphereGeometry(0.11, 8, 6); p.geo(M.bollard, ball, 0, 1.06, 0); ball.dispose();
  });
  // perimeter walk: bollards every ~3.0 m along the rectangle (corners included)
  const R = [[-lw.hw, lw.hl], [lw.hw, lw.hl], [lw.hw, -lw.hl], [-lw.hw, -lw.hl]], pts = [];
  for (let e = 0; e < 4; e++) {
    const a = R[e], b = R[(e + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(len / 3.0);
    for (let k = 0; k < n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  const mats = pts.map((p) => { const w = B.W(p[0], p[1]); return mat4(w.x, 0, w.z, 0, 1); });
  const r = addInstanced(ctx, K.root, 'lmseate-bollards', parts, mats);
  K.extraTris += r.tris; K.svc.bollards = pts.length;
  // the chains: three straight pieces per span with a 0.3 m sag, thin tubes; one breakable bay per span (the unit chain, x 0..1, stretched over the span; its collider is a thin box 1 m high)
  const chainBays = [];
  for (let i = 0; i < pts.length; i++) {
    const a = B.W(pts[i][0], pts[i][1]), b = B.W(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]);
    chainBays.push({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, y: 0 });
  }
  const chainAt = (t) => [t, 0.95 - 0.3 * 4 * t * (1 - t), 0];
  const chainGeo = partsGeos((Q) => { for (let s = 0; s < 3; s++) Q.cyl(M.chain, chainAt(s / 3), chainAt((s + 1) / 3), 0.022, 0.022, 4, false); });
  kBays(K, { name: 'lmseate-chain', bays: chainBays, far: 200,
    parts: chainGeo.list.map((q, i) => ({ geo: q.geo, mat: q.mat, name: 'chain' + i, stretch: true, shadow: false })),
    collider: { y0: 0, y1: 1.0, thick: 0.12, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 40, h: 1.0, anchored: 4, hitK: 0.1, metal: true, minDv: 0 }) });
}

function colliders(K) {
  const ph = K.ctx.physics, lw = BOAT.lawn, pl = BOAT.plinth;
  const box = (a, b, wd, dp, y0, y1, fence) => { const p = B.W(a, b), bx = ph.addBox(p.x, p.z, wd, dp, B.rot, y0, y1); if (fence) bx.fence = true; return bx; };
  box(0, 0, pl.w + 0.7, pl.len + 0.7, 0, PL_Y1 + 0.4);                                    // plinth wedge + base course
  box(0, -pl.len / 2 - 1.7, pl.w, 3.4, 0, PL_Y0 + 0.1);                                   // the low stern platform (a 1 m step: not walkable)
  box(0, 0.55, 3.6, 20.5, PL_Y1 + 0.4, 8.5);                                              // the boat above (nobody climbs the plinth)
  // (the chain round the lawn: breakable bays, see the drawing stage above)
  // (the board stand: a knock record, see plaque())
}

function services(K) {
  const c = B.W(0, 0), foot = B.W(lwX(), 0);
  K.svc.monuments.push({ id: 'w53500959', name: 'Торпедный катер «Комсомолец»', x: c.x, z: c.z, h: 6.4, r: 14 });
  const sp = (name, x, z, tx, tz) => K.svc.photoSpots.push({ name, x, z, yaw: L.yawToward(x, z, tx, tz), pitch: 4 });
  sp('Торпедный катер: борт с дорожки', -6538, 348, c.x, c.z);
  const bb = B.W(2, 22), bt = B.W(0, 9);                               // 22 m ahead of the centre = 12 m beyond the lawn chain; the scene's water edge starts ~31 m ahead (the dossier spot (-6580, 385) is in the water)
  sp('Торпедный катер: приподнятый нос', bb.x, bb.z, bt.x, bt.z);
  K.svc.crowd.push({ id: 'torpedo-boat', kind: 'photo', x: foot.x, z: foot.z, r: 4, n: 3 });
  K.svc.boat = { centre: [c.x, c.z] };
}
function lwX() { return BOAT.lawn.hw + 1.6; }
