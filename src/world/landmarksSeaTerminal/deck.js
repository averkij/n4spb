// landmarksSeaTerminal/deck.js - the TWO-TIER FORECOURT of the Sea Terminal (dossier 4.5, 4.6, 4.10; photos a01 a07 a17 a23): the concrete deck slab along the NE face (v -17.5 .. 0, underside 3.5, top 6.0, blue-grey fascia 2.5 m),
// the SW apron (v 55.7 .. 66.9) with the same fascia, the light-grey fluted screens (6.0 .. 8.4) and the black railing + cream panels of the apron (CRITIC: the SW side differs from the NE side), the MUSHROOM PIERS under the
// claw junctions (instanced: stem 0.9 m, capital 2.4 m), the NW ramp (u -3.6 .. 3.4, v -77 .. -19: an embankment with 1.1 m concrete walls, asphalt, 10.9 %), its closed gate, the white switchback stair at the SE corner of the
// NE deck, and the asphalt floor under the deck (about 2000 m2 that no OSM area covers: dossier 4.10 CRITIC).  The deck itself is not walkable (no access); the stair, the ramp walls and the piers are solid.
// Frame T: u along the long faces, v toward the sea.
import * as THREE from 'three';
import { T, H, PIER_U, DECK, UNDER, coverFn } from './frame.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';

/** a slab box u0..u1 x v0..v1, y0..y1: top = deck concrete (uv in 5 m), bottom = concrete, the fascia on the listed sides (k = -v side, f = +v side, l = -u side, r = +u side) */
function slab(P, M, u0, u1, v0, v1, y0, y1, fascia = 'kflr', topMat) {
  const hh = y1 - y0, tm = topMat || M.quayDeck;
  P.quad(tm, [u0, y1, v1], [u1, y1, v1], [u1, y1, v0], [u0, y1, v0], [0, 1, 0], [[u0 / 5, v1 / 5], [u1 / 5, v1 / 5], [u1 / 5, v0 / 5], [u0 / 5, v0 / 5]]);
  P.quad(M.soffit, [u0, y0, v0], [u1, y0, v0], [u1, y0, v1], [u0, y0, v1], [0, -1, 0]);
  const fq = (a, b, n, len) => P.quad(M.fascia, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n, [[0, 0], [len / 6.3, 0], [len / 6.3, hh / 2.5], [0, hh / 2.5]]);
  if (fascia.includes('k')) fq([u1, v0], [u0, v0], [0, 0, -1], u1 - u0);
  if (fascia.includes('f')) fq([u0, v1], [u1, v1], [0, 0, 1], u1 - u0);
  if (fascia.includes('l')) fq([u0, v0], [u0, v1], [-1, 0, 0], v1 - v0);
  if (fascia.includes('r')) fq([u1, v1], [u1, v0], [1, 0, 0], v1 - v0);
}
/** a thin screen wall (panel band) along u from (ua, v) to (ub, v) or along v: a box of thickness t, y0..y1, light fluted aluminium */
function screenU(P, M, ua, ub, v, y0, y1, t = 0.3) { P.box(M.aluLight, ua, ub, y0, y1, v - t / 2, v + t / 2, 'b', 1.8); }
function screenV(P, M, u, va, vb, y0, y1, t = 0.3) { P.box(M.aluLight, u - t / 2, u + t / 2, y0, y1, va, vb, 'b', 1.8); }
/** a thin tube between two points of the current frame */
const tube = (P, mat, a, b, r = 0.03) => P.cyl(mat, a, b, r, r, 5, false);

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] deck/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  P.push(T.x, 0, T.z, T.rot);
  try {
    stage('slabs', () => slabs(K));
    stage('screens', () => screens(K));
    stage('ramp', () => ramp(K));
    stage('stair', () => stair(K));
    stage('under', () => under(K));
  } finally { P.pop(); }
  stage('piers', () => piers(K));
  stage('colliders', () => colliders(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

function slabs(K) {
  const P = K.P, M = K.M, ne = DECK.ne, sw = DECK.sw;
  // NE deck with the opening of the SE stair (u 100 .. 108.2, v -17.5 .. -8.5) and the 1.0 m fill in front of the recessed spine (u 34.4 .. 40.3, v 0 .. 1.0)
  slab(P, M, ne.u0, 100.0, ne.v0, ne.v1, H.slabBot, H.slabTop, 'klr');
  slab(P, M, 108.2, ne.u1, ne.v0, ne.v1, H.slabBot, H.slabTop, 'klr');
  slab(P, M, 100.0, 108.2, -8.5, ne.v1, H.slabBot, H.slabTop, 'k');
  P.box(M.concrete, 34.4, 40.3, H.slabBot, H.slabTop, 0, 1.0, 'bk', 2);
  // the ramp landing: the road bends into the ramp at the NW end of the deck (u -3.6 .. 3.4, v -19.4 .. -8)
  slab(P, M, -3.6, ne.u0, -19.4, -8.0, H.slabBot, H.slabTop, 'kl', M.asphalt);
  // SW apron (the long white beam of photo a23): fascia on the sea side and both ends; the 1.0 m fill behind the recessed pylon (u 34.4 .. 40.3, v 54.7 .. 55.7)
  slab(P, M, sw.u0, sw.u1, sw.v0, sw.v1, H.slabBot, H.slabTop, 'flr');
  P.box(M.concrete, 34.4, 40.3, H.slabBot, H.slabTop, 54.7, 55.7, 'bf', 2);
}

function screens(K) {
  const P = K.P, M = K.M, Y = H.slabTop, YT = H.screenTop;
  // NE screen: light-grey fluted panels 6.0 .. 8.4 standing 0.5 m inside the slab edge (v -17.0), the end at the stair opening; joints every 6.3 m are in the texture
  screenU(P, M, 4.0, 99.6, -17.0, Y, YT); screenU(P, M, 108.6, 117.0, -17.0, Y, YT);
  screenV(P, M, 117.0, -17.0, 66.4, Y, YT);                                                  // the SE end (along the annex roof and the apron end)
  // SW apron: a black steel railing 1.5 m high (posts every 3.15 m, top rail, two braced bays) with the cream curved panels BEHIND it, their lower edge 1.5 m above the slab (CRITIC)
  const vr = 66.4, vp = 65.8;
  tube(P, M.black, [0.4, Y + 1.5, vr], [116.6, Y + 1.5, vr], 0.045); tube(P, M.black, [0.4, Y + 0.75, vr], [116.6, Y + 0.75, vr], 0.03);
  for (let u = 0.4; u <= 116.7; u += 3.15) tube(P, M.black, [u, Y, vr], [u, Y + 1.5, vr], 0.04);
  for (let u = 0.4; u < 116; u += 12.6) tube(P, M.black, [u, Y, vr], [u + 3.15, Y + 1.5, vr], 0.025);
  P.box(M.aluLight, 0.6, 116.4, Y + 1.5, Y + 4.3, vp - 0.15, vp + 0.15, 'b', 1.8);
  // the NW end of the apron: a short railing
  tube(P, M.black, [0.4, Y + 1.5, 55.7], [0.4, Y + 1.5, vr], 0.045); for (let v = 55.7; v <= vr; v += 3.7) tube(P, M.black, [0.4, Y, v], [0.4, Y + 1.5, v], 0.04);
  // the stair opening: a black tube railing round its edge (1.1 m) on the slab sides
  tube(P, M.black, [100.0, Y + 1.1, -8.5], [108.2, Y + 1.1, -8.5], 0.04);
}

/** the NW ramp: an embankment (u -3.6 .. 3.4) rising from y 0 at v = -72.7 to the landing (y 6.0) at v = -19.4, asphalt on top, concrete walls 1.1 m higher */
function ramp(K) {
  const P = K.P, M = K.M, u0 = -3.6, u1 = 3.4, va = -72.7, vb = -19.4, Y = H.slabTop, wH = 1.1;
  const yAt = (v) => Y * (v - va) / (vb - va);
  // surface (asphalt) between the walls
  P.quad(M.asphalt, [u0, 0, va], [u1, 0, va], [u1, Y, vb], [u0, Y, vb], [0, 1, 0.1], [[0, 0], [1.75, 0], [1.75, 13.4], [0, 13.4]]);
  // the two retaining walls: outer face (a trapezoid), inner face, top strip
  for (const [u, out] of [[u0, -1], [u1, 1]]) {
    P.quad(M.concrete, [u, 0, va], [u, 0, vb], [u, Y + wH, vb], [u, yAt(va) + wH, va], [out, 0, 0], [[0, 0], [13.4, 0], [13.4, (Y + wH) / 4], [0, wH / 4]]);
    const ui = u - out * 0.5;
    P.quad(M.concrete, [ui, yAt(va), va], [ui, Y, vb], [ui, Y + wH, vb], [ui, yAt(va) + wH, va], [-out, 0, 0], [[0, 0], [13.4, 0], [13.4, wH / 2], [0, wH / 2]]);
    P.quad(M.concreteLight, [u, yAt(va) + wH, va], [u, Y + wH, vb], [ui, Y + wH, vb], [ui, yAt(va) + wH, va], [0, 1, 0]);
  }
  // the foot of the ramp: end faces of the walls and the closed gate across the road (a sliding gate of galvanised panels 7 m wide, 2.2 m, with a booth beside it)
  const gv = va + 4;
  P.box(M.hoard, u0 + 0.5, u1 - 0.5, 0, 2.2, gv - 0.08, gv + 0.08, 'b', 2);
  for (const u of [u0 + 0.5, 0, u1 - 0.5]) P.box(M.hoardPost, u - 0.1, u + 0.1, 0, 2.5, gv - 0.12, gv + 0.12, 'b', 1);
  P.box(M.booth, u1 + 0.4, u1 + 2.8, 0, 2.6, gv - 1.2, gv + 1.2, 'b', 1); P.box(M.boothRoof, u1 + 0.3, u1 + 2.9, 2.6, 2.75, gv - 1.3, gv + 1.3, 'b', 1);
  P.box(M.glassDark, u1 + 0.38, u1 + 0.42, 1.2, 2.2, gv - 0.9, gv + 0.9, 'b', 1);
}

/** the white switchback stair at the SE corner of the NE deck: 2 x 18 risers of 0.1667 m in the opening (u 100 .. 108.2, v -17.5 .. -8.5), a landing at y 3.0 */
function stair(K) {
  const P = K.P, M = K.M, n = 18, rise = 3.0 / n, tread = 0.44, wd = 2.2;
  // flight A: u 100.4 .. 102.6, from v -17.0 (y 0) up toward the NE-face wall to v -9.1 (y 3.0)
  for (let i = 0; i < n; i++) { const y1 = (i + 1) * rise, v = -17.0 + i * tread; P.box(M.stairWhite, 100.4, 100.4 + wd, 0, y1, v, v + tread, 'b', 1.5); }
  // landing across the opening at y 3.0 (v -9.1 .. -8.5)
  P.box(M.stairWhite, 100.4, 107.9, 2.9, 3.0, -9.1, -8.5, 'b', 2);
  // flight B: u 105.7 .. 107.9, back from the landing (y 3.0) to the deck level at v -17.0 (y 6.0)
  for (let i = 0; i < n; i++) { const y1 = 3.0 + (i + 1) * rise, v = -9.1 - (i + 1) * tread; P.box(M.stairWhite, 105.7, 105.7 + wd, 2.9, y1, v, v + tread, 'b', 1.5); }
  // black tube railings: along the outer sides of both flights and the landing
  const rl = (u, vA, vB, yA, yB) => { P.cyl(M.black, [u, yA + 0.95, vA], [u, yB + 0.95, vB], 0.035, 0.035, 5, false); for (let k = 0; k <= 4; k++) { const f = k / 4; tube(P, M.black, [u, yA + (yB - yA) * f, vA + (vB - vA) * f], [u, yA + (yB - yA) * f + 0.95, vA + (vB - vA) * f], 0.025); } };
  rl(100.3, -17.0, -9.1, 0, 3.0); rl(108.0, -9.1, -17.0, 3.0, 6.0); rl(102.7, -17.0, -9.1, 0, 3.0); rl(105.6, -9.1, -17.0, 3.0, 6.0);
}

/** asphalt floor under the deck and in front of it (the lot polygon w60989201 ends at v -21.2): u 3.4 .. 117.5, v -21.0 .. -0.3, laid just above the roads' asphalt (0.03) */
function under(K) {
  const P = K.P, M = K.M, Y = 0.036;
  const U = UNDER;
  P.quad(M.asphalt, [U.u0, Y, U.v1], [U.u1, Y, U.v1], [U.u1, Y, U.v0], [U.u0, Y, U.v0], [0, 1, 0], [[U.u0 / 4, U.v1 / 4], [U.u1 / 4, U.v1 / 4], [U.u1 / 4, U.v0 / 4], [U.u0 / 4, U.v0 / 4]]);
}

/** the mushroom piers (funnel columns) under the claw junctions: stem 0.9 m (y 0 .. 2.3), capital 0.9 -> 2.4 m (2.3 .. 3.5): 7 per long face, instanced */
function piers(K) {
  const M = K.M, ctx = K.ctx;
  const parts = partsGeos((P) => {
    P.box(M.concrete, -0.45, 0.45, 0, 2.3, -0.45, 0.45, 'bt', 2);
    const a = 0.45, b = 1.2, y0 = 2.3, y1 = H.slabBot;
    const q = (p0, p1, p2, p3, n) => P.quad(M.concrete, p0, p1, p2, p3, n);
    q([-a, y0, a], [a, y0, a], [b, y1, b], [-b, y1, b], [0, 0.4, 1]); q([a, y0, -a], [-a, y0, -a], [-b, y1, -b], [b, y1, -b], [0, 0.4, -1]);
    q([a, y0, a], [a, y0, -a], [b, y1, -b], [b, y1, b], [1, 0.4, 0]); q([-a, y0, -a], [-a, y0, a], [-b, y1, b], [-b, y1, -b], [-1, 0.4, 0]);
  });
  const mats = [], cover = coverFn(ctx);
  for (const u of PIER_U) for (const v of [-16.5, 64.5]) { const w = T.W(u, v); if (cover(w.x, w.z) > -1.0) continue; mats.push(mat4(w.x, 0, w.z, T.rot, 1)); }                // never a pier on a carriageway (road integrity)
  const r = addInstanced(ctx, K.root, 'lmseate-piers', parts, mats);
  K.extraTris += r.tris;
  K.svc.piers = mats.length;
}

function colliders(K) {
  const ph = K.ctx.physics;
  const box = (uc, vc, du, dv, y0, y1) => { const w = T.W(uc, vc); return ph.addBox(w.x, w.z, du, dv, T.rot, y0, y1); };
  const cover = coverFn(K.ctx);
  for (const u of PIER_U) for (const v of [-16.5, 64.5]) { const w = T.W(u, v); if (cover(w.x, w.z) > -1.0) continue; box(u, v, 0.9, 0.9, 0, H.slabBot); }
  // the stair block (solid: no way onto the deck), the ramp walls and the closed gate at the ramp foot
  box(104.1, -13.0, 8.2, 9.0, 0, 6.5);
  box(-3.6, -46, 0.6, 53.7, 0, 8); box(3.4, -46, 0.6, 53.7, 0, 8);
  // (n4spb: the thin box of the closed gate at the ramp foot, 7.4 x 0.5 x 3 m at v -70, is gone: it stood INSIDE the ramp embankment box below, a collider on top of a collider)
  box(-0.1, -46, 7.0, 53.7, 0, 8);                                                           // the ramp body between the walls (nobody walks on the visual ramp)
}
