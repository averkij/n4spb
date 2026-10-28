// landmarksSeaTerminal/quay.js - the port ground round the Sea Terminal (dossier 4.6, 4.10, 4.11; photos a05 a07 a16 a17 a23): the green welded-mesh PORT FENCE round the lot (OSM w452522616, w508629492, w696745611: panels 2.0 m on
// 3 m posts on white foot blocks) with the open lift gate (a raised red-white arm and a booth: the lot is reachable for the player through it), the white / yellow concrete JERSEY BARRIERS that channel the lot (instanced),
// the SW QUAY furniture (black double bollards every 20 m, the dashed black / white edge stripe at the coping, one white covered boarding gangway) and the CLOSURE of the quay strip on its NW side (a mesh fence across
// u = -6, v 55 .. 83; the baked walls close only the SE and NE sides: dossier CRITIC no. 15).  The water, the quay wall and the fenders belong to environment.  Frame T for the quay pieces (u, v), world for the fences.
import * as THREE from 'three';
import { T, QUAY, H, coverFn } from './frame.js';
import { fenceRun, barrierPts } from './fence.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the Jersey barriers are knock records

const LIFT = [-6486.9, 540.0];

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] quay/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('port fence', () => portFence(K));
  stage('lift gate', () => liftGate(K));
  stage('closure', () => closure(K));
  K.P.push(T.x, 0, T.z, T.rot);
  try {
    stage('quay', () => quayFurniture(K));
    stage('gangway', () => gangway(K));
  } finally { K.P.pop(); }
  stage('jersey', () => jersey(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

function portFence(K) {
  const runs = [
    ['w452522616', [-6511.9, 528.7, -6493.2, 540.1, -6490.7, 549.4, -6466.1, 563.3, -6468.3, 567.3, -6403.4, 602.4, -6405.6, 606.4, -6408, 608.1, -6425.3, 640.3, -6413.3, 662.2, -6459, 765.6]],
    ['w508629492', [-6493.2, 540.1, -6480.2, 539.6, -6464, 542.8]],
    ['w696745611', null],
  ];
  let n = 0;
  for (const [id, fb] of runs) {
    const pts = barrierPts(id) || fb;
    if (!pts) continue;
    n += fenceRun(K, pts, { kind: 'mesh', id, gates: [LIFT], gateHalf: 3.6 });
  }
  K.svc.portFence = n;
}

/** the lift gate n4978999665 at (-6486.9, 540.0) on the stub fence: a booth beside the road and a red-white arm raised to 60 deg (open); the arm is not a collider (the lot is a passage) */
function liftGate(K) {
  const P = K.P, M = K.M;
  const ax = -6493.2, az = 540.1, bx = -6480.2, bz = 539.6, dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
  const rot = Math.atan2(-uz, ux), nx = -uz, nz = ux;                                                  // the stub runs ENE; n = the side toward the lot (+z)
  P.push(LIFT[0] - ux * 3.9, 0, LIFT[1] - uz * 3.9, rot);
  try {
    // the booth (2.4 x 2.4 x 2.6 m) beside the roadway, on the lot side; the arm pivots on a box beside it
    P.box(M.booth, -1.2, 1.2, 0, 2.6, 0.5, 2.9, 'b', 1); P.box(M.boothRoof, -1.35, 1.35, 2.6, 2.75, 0.35, 3.05, 'b', 1); P.box(M.glassDark, -0.9, 0.9, 1.1, 2.0, 0.47, 0.5, 'b', 1);
    P.box(M.booth, 1.4, 1.9, 0, 1.1, 0.7, 1.2, 'b', 1);                                                  // the arm housing
    const a = 60 * Math.PI / 180, len = 4.2, x0 = 1.65, y0 = 1.0;
    for (let k = 0; k < 6; k++) { const f0 = k / 6, f1 = (k + 1) / 6; P.cyl(k % 2 ? M.arm : M.armRed, [x0 + Math.cos(a) * len * f0, y0 + Math.sin(a) * len * f0, 0.95], [x0 + Math.cos(a) * len * f1, y0 + Math.sin(a) * len * f1, 0.95], 0.06, 0.06, 5, false); }
  } finally { P.pop(); }
  void nx; void nz;
}

/** close the quay strip on its NW side: a mesh fence across u = -6 from the NW end of the apron (v 56) to the quay edge (v 82.5), solid */
function closure(K) {
  const a = T.W(-6, 55.5), b = T.W(-6, QUAY.water - 0.2);
  fenceRun(K, [a.x, a.z, b.x, b.z], { kind: 'mesh', id: 'quay-closure', closed: true });
  K.svc.fences.push({ id: 'quay-closure', pts: [[a.x, a.z], [b.x, b.z]], solid: true });
}

function quayFurniture(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  // double bollards (black cast, 0.7 x 0.45 x 0.5 m) every 20 m at v 78.5 along the berths (u -20 .. 170), instanced
  const parts = partsGeos((p) => { for (const dz of [-0.2, 0.2]) { p.col(M.bollardQuay, 0, dz, 0, 0.45, 0.17, 0.12, 8, true); p.col(M.bollardQuay, 0, dz, 0.45, 0.52, 0.2, 0.2, 8, true); } p.box(M.bollardQuay, -0.12, 0.12, 0.3, 0.38, -0.35, 0.35, 'b', 1); });
  const mats = [], cover = coverFn(ctx); for (let u = -20; u <= 170; u += 20) { const w = T.W(u, 78.5); if (cover(w.x, w.z) > -0.8) continue; mats.push(mat4(w.x, 0, w.z, T.rot, 1)); }
  const r = addInstanced(ctx, K.root, 'lmseate-quay-bollards', parts, mats); K.extraTris += r.tris;
  // the dashed edge stripe along the coping (0.25 m, black / white, 2 m dashes) at v 79.2 .. 79.45, just above the deck
  for (let u = -22, k = 0; u < 168; u += 2, k++) P.quad(k % 2 ? M.stripeB : M.stripeW, [u, 0.045, 79.45], [u + 2, 0.045, 79.45], [u + 2, 0.045, 79.2], [u, 0.045, 79.2], [0, 1, 0]);
  void H;
}

/** the covered boarding gangway of photo a23: a white tube 2.6 x 2.7 m sloping from the apron edge (y 6.0, v 66.4) down to y 3.5 at v 77, with a short tower at its foot, at u 72 */
function gangway(K) {
  const P = K.P, M = K.M, uc = 72, v0 = 66.6, v1 = 77.0, y0 = 6.0, y1 = 3.5, hw = 1.3, hh = 2.7;
  const q = (a, b, c, d, n) => P.quad(M.tube, a, b, c, d, n);
  const A = (s, y) => [[uc - hw, y, s], [uc + hw, y, s]];
  const aB = A(v0, y0), bB = A(v1, y1), aT = A(v0, y0 + hh), bT = A(v1, y1 + hh);
  q([aT[0][0], aT[0][1], v0], [aT[1][0], aT[1][1], v0], [bT[1][0], bT[1][1], v1], [bT[0][0], bT[0][1], v1], [0, 1, 0.2]);                         // roof
  q([aB[1][0], aB[1][1], v0], [aB[0][0], aB[0][1], v0], [bB[0][0], bB[0][1], v1], [bB[1][0], bB[1][1], v1], [0, -1, 0]);                         // floor
  q([aB[0][0], aB[0][1], v0], [aT[0][0], aT[0][1], v0], [bT[0][0], bT[0][1], v1], [bB[0][0], bB[0][1], v1], [-1, 0, 0]);
  q([aT[1][0], aT[1][1], v0], [aB[1][0], aB[1][1], v0], [bB[1][0], bB[1][1], v1], [bT[1][0], bT[1][1], v1], [1, 0, 0]);
  P.box(M.glassDark, uc - hw - 0.02, uc - hw, y0 + 0.9, y0 + 2.0, v0 + 1.5, v1 - 1.5, 'b', 1);                                                   // a window strip
  P.box(M.tube, uc - 1.6, uc + 1.6, 0, 3.4, v1, v1 + 3.0, 'b', 1); P.box(M.boothRoof, uc - 1.7, uc + 1.7, 3.4, 3.55, v1 - 0.1, v1 + 3.1, 'b', 1);
  void THREE;
}

/** Jersey barriers 2.4 x 0.8 x 0.8 m (white concrete) channelling the lot: two staggered rows in front of the deck (v -23) and a short diagonal run at the SE end, instanced, solid */
function jersey(K) {
  const M = K.M, ctx = K.ctx;
  const parts = partsGeos((p) => {
    // a trapezoid profile along x: base 0.6 wide, top 0.2, 0.8 high, 2.4 long
    const l = 1.2, bw = 0.3, tw = 0.1, h = 0.8;
    p.quad(M.jersey, [-l, 0, bw], [l, 0, bw], [l, h, tw], [-l, h, tw], [0, 0.35, 1]); p.quad(M.jersey, [l, 0, -bw], [-l, 0, -bw], [-l, h, -tw], [l, h, -tw], [0, 0.35, -1]);
    p.quad(M.jersey, [-l, h, tw], [l, h, tw], [l, h, -tw], [-l, h, -tw], [0, 1, 0]);
    p.quad(M.jersey, [l, 0, bw], [l, 0, -bw], [l, h, -tw], [l, h, tw], [1, 0, 0]); p.quad(M.jersey, [-l, 0, -bw], [-l, 0, bw], [-l, h, tw], [-l, h, -tw], [-1, 0, 0]);
  });
  const mats = [], ph = ctx.physics;
  const cover = coverFn(ctx);
  const spots = [], items = [];
  const place = (u, v, rot) => { const w = T.W(u, v); if (cover(w.x, w.z) > -1.2) return; spots.push({ x: w.x, y: 0, z: w.z, rotY: T.rot + rot }); const b = ph.addBox(w.x, w.z, 2.4, 0.6, T.rot + rot, 0, 0.8); b.fence = true; items.push(b); };
  for (let u = 8; u < 116; u += 9.6) { place(u, -23.0, 0); if (((u * 7) | 0) % 3 !== 0) place(u + 2.5, -23.0, 0); }
  for (let k = 0; k < 4; k++) place(112 + k * 1.2, -26 - k * 2.2, 0.5);
  void mats;
  K.extraTris += knockFurniture(ctx, 'lmseate-jersey', parts, spots, items, { kind: 'barrier', mass: 700, h: 0.8, w: 2.4, d: 0.6, hitK: 0.35, metal: false, minDv: 0 }, 260); K.svc.jersey = spots.length;
}
