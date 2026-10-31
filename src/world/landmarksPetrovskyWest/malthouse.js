// landmarksPetrovskyWest/malthouse.js - the former BAVARIA BREWERY MALTHOUSE ("Солодовня пивоваренного завода «Новая Бавария»", Ремесленная улица 7 лит. К, heritage object) and the roofless brick ruin beside it.
// Photos refs/petrovsky-west t21 t22 t23 (the three gables from the construction yard, 27 Mar 2021) and t24 (the roofscape from the water): a derelict seven-floor brick hall of ~69 m with THREE stepped gables of ~14.5 m
// (ogee outline, a dentil coping, five vertical brick ribs and three tall slit windows in the tip, four columns x five rows of small EMPTY windows with pale stone sills and lintels below), between the first and the second
// gable a RECESSED bay with a big round-arched loading opening (a concrete slab ledge at its foot), at the right end (north) a taller flat-roofed block of six floors with a railing; every window is an empty dark hole, white lime streaks
// run down the red brick, the roofs are gone (a flat concrete deck with birch saplings growing on it).  In front: a grey corrugated hoarding with blue and grey site cabins and portable toilets (photos 2021: [?] whether they
// still stand in Oct 2026, built as the last known state).  The ruin w44425076 (OSM ruins=yes, 33 x 20.1 m): a roofless shell of walls 6.4-9.6 m high with window holes, the top edge broken, birches inside.
// Frames: F = the EAST edge of the rectangle w938558332 (the photographed front [?]: the ruin stands 7.6 m in front of the west edge; local x runs along the front to the viewer's right = NORTH, z = the outward normal to the EAST), depth D = 23.1 m
// behind it.  Each of the three wings has a gable at BOTH ends (the ridges run through the whole depth), so the west side gets the same three gables; the arch bay and the taller block belong to the front.  Gable x ranges are scaled to the real length.
// Everything is solid (closed construction site): collider boxes; the hoarding yard in front is open (a gate gap) but the building is not enterable.
import * as L from '../layout.js';
import * as THREE from 'three';
import { IDS, ringOf, edgeToward, edgeFrame, toWorld, toLocal, ringEdges } from './frame.js';

const HS = 16.0, HB = 19.2, FL = 3.2;                       // deck / shoulder height of the gable wings (5 floors), height of the taller south block (6 floors), floor height
const PROF = [[0, 8.7], [2.2, 6.9], [4.4, 4.9], [5.5, 3.4], [6.1, 2.1], [6.5, 1.1], [7.3, 0]];     // half outline of one gable above the shoulder: [distance from the axis, height above HS] (photos t21 t22: ~40 deg near the tip, steepening to ~68 deg, a flared foot)

export function build(K) {
  const { P, M, ctx } = K, rng = ctx.rng(7101), ph = ctx.physics;
  const ring = ringOf(IDS.malt);
  if (!ring) return;
  const e = edgeToward(ring, 1, 0, 30), f = edgeFrame(e);               // the photographed front: the EAST edge (the ruin w44425076 stands 7.6 m in front of the west edge, so the camera of t21..t23 cannot have been there)
  const len = f.len;
  let D = 0; for (const p of ring) D = Math.max(D, -toLocal(f, p[0], p[1]).lz);
  const k = len / 68.8;
  const X = [0, 14.6 * k, 21.2 * k, 35.8 * k, 50.4 * k, len];            // gable 1 | recessed arch bay | gable 2 | gable 3 | the tall south block
  const net = ctx.services.streets && ctx.services.streets.net;
  const clear = (x, z, m = 1.0) => (net && net.cover ? net.cover(x, z, {}) < -0.5 : !L.isOnRoad(x, z, m));
  const vq = (mat, x0, x1, y0, y1, z, sgn, nu, th = FL) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, sgn], [[0, y0 / th], [nu, y0 / th], [nu, y1 / th], [0, y1 / th]]);
  const hq = (mat, x, y0, y1, z0, z1, sgn, nu, th = FL) => P.quad(mat, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [sgn, 0, 0], [[0, y0 / th], [nu, y0 / th], [nu, y1 / th], [0, y1 / th]]);

  P.push(f.S.x, 0, f.S.z, f.rot);
  P.far = 1500;
  // ---------------------------------------------------------------- the north end, the back (east) wall, the south end, the decks
  hq(M.ruinBay, X[0], 0, HS, -D, 0, -1, Math.round(D / 3.4));                                            // north end (faces -x of the front frame = north)
  hq(M.ruinBay, X[5], 0, HB, -D, 0, +1, Math.round(D / 3.4), FL);                                        // south end
  vq(M.ruinBay, X[4], X[5], 0, HB, -D, -1, Math.round((X[5] - X[4]) / 3.4));                              // the back wall of the tall block
  vq(M.ruinBay, X[1], X[2], 0, HS, -D, -1, 2);                                                            // the back wall behind the recessed bay (the back gables stand on both sides of it)
  P.quad(M.conc, [X[0], HS, -D], [X[1], HS, -D], [X[1], HS, 0], [X[0], HS, 0], [0, 1, 0]);
  P.quad(M.conc, [X[1], HS, -D], [X[2], HS, -D], [X[2], HS, -1.4], [X[1], HS, -1.4], [0, 1, 0]);
  P.quad(M.conc, [X[2], HS, -D], [X[4], HS, -D], [X[4], HS, 0], [X[2], HS, 0], [0, 1, 0]);
  P.quad(M.conc, [X[4], HB, -D], [X[5], HB, -D], [X[5], HB, 0], [X[4], HB, 0], [0, 1, 0]);
  // the step between the deck (HS) and the tall block: its north face
  P.quad(M.ruinPlain, [X[4], HS, 0], [X[4], HS, -D], [X[4], HB, -D], [X[4], HB, 0], [-1, 0, 0], [[0, HS / FL], [D / 3.4, HS / FL], [D / 3.4, HB / FL], [0, HB / FL]]);
  // parapets (a low brick lip round the decks, broken here and there: plain boxes)
  for (const [xa, xb, y] of [[X[0], X[4], HS], [X[4], X[5], HB]]) {
    P.box(M.ruinPlain, xa, xb, y, y + 0.55, -D, -D + 0.45, 'b', 1.2);
    P.box(M.dark, xa, xb, y + 0.55, y + 0.72, -D - 0.06, -D + 0.5, 'b', 1.2);
  }
  P.box(M.ruinPlain, X[4], X[5], HB, HB + 0.6, -0.5, 0, 'b', 1.2); P.box(M.dark, X[4], X[5], HB + 0.6, HB + 0.76, -0.56, 0.06, 'b', 1.2);
  P.box(M.ruinPlain, X[5] - 0.45, X[5], HB, HB + 0.6, -D, 0, 'b', 1.2);

  // ---------------------------------------------------------------- the three gables
  const gable = (xa, xb, slits) => {
    const a = (xb - xa) / 2, xc = (xa + xb) / 2, kk = a / 7.3;
    vq(M.ruinBay, xa, xb, 0, HS, 0, +1, 4);
    const left = PROF.slice().reverse().map(([u, h]) => [xc - u * kk, HS + h]), right = PROF.slice(1).map(([u, h]) => [xc + u * kk, HS + h]), pts = left.concat(right);
    P.vpoly(M.ruinPlain, pts, 0, +1, 3.4, FL, xa, 0);
    P.vpoly(M.ruinPlain, pts, -0.75, -1, 3.4, FL, xa, 0);
    P.beam(M.dark, pts.map((p) => [p[0], p[1] + 0.12, -0.375]), 1.0, 0.5, [0, 0, 1]);                      // the dentil coping along the whole outline
    P.beam(M.dark, [[xa - 0.1, HS - 0.1, -0.375], [xa - 0.1, HS + 0.2, -0.375]], 1.0, 0.5, [0, 0, 1]);
    // five vertical ribs and the two sloped ribs
    const hAt = (u) => { u = Math.abs(u) / kk; for (let i = 0; i + 1 < PROF.length; i++) { const [u0, h0] = PROF[i], [u1, h1] = PROF[i + 1]; if (u <= u1) return h0 + (h1 - h0) * (u - u0) / (u1 - u0); } return 0; };
    for (const o of [-0.74, -0.5, -0.25, 0, 0.25, 0.5, 0.74]) { const x = xc + o * a, hh = hAt(o * a) - 0.95; if (hh > 1.3) { P.box(M.ruinPlain, x - 0.13, x + 0.13, HS + 0.5, HS + hh, 0, 0.13, 'bk', 1.2); P.box(M.dark, x + 0.13, x + 0.2, HS + 0.5, HS + hh, 0, 0.1, 'bk', 1); } }
    for (const sg of [-1, 1]) P.beam(M.ruinPlain, PROF.map(([u, h]) => [xc + sg * (u * kk - 0.9 * (u > 0.1 ? 1 : 0)), HS + h - 0.45 * (u > 0.1 ? 1 : 0.2), 0.05]).filter((_, i) => i < PROF.length - 1), 0.12, 0.26, [0, 0, 1]);
    if (slits) for (const o of [-1.7, 0, 1.7]) {
      P.box(M.stone, xc + o - 0.42, xc + o + 0.42, HS + 1.55, HS + 3.75, 0, 0.05, 'bk', 1.2);
      P.box(M.dark, xc + o - 0.27, xc + o + 0.27, HS + 1.7, HS + 3.6, 0, 0.09, 'bk', 1);
    }
  };
  gable(X[0], X[1], false);
  gable(X[2], X[3], true);
  gable(X[3], X[4], true);
  // the same three wings end in three gables on the BACK (west) side too: the ridges run through the whole depth (frame turned about the building: x' = len - x)
  P.push(len, 0, -D, Math.PI);
  gable(len - X[1], len - X[0], false);
  gable(len - X[3], len - X[2], true);
  gable(len - X[4], len - X[3], true);
  P.cyl(M.dark, [len - X[3], 0.1, 0.12], [len - X[3], HS + 0.1, 0.12], 0.07, 0.07, 6, false);
  P.pop();
  // a drainpipe in the joint between gables 2 and 3 and at the south block
  P.cyl(M.dark, [X[3], 0.1, 0.12], [X[3], HS + 0.1, 0.12], 0.07, 0.07, 6, false);
  P.cyl(M.dark, [X[4] + 0.1, 0.1, 0.12], [X[4] + 0.1, HB, 0.12], 0.07, 0.07, 6, false);
  // the south block front
  vq(M.ruinBay, X[4], X[5], 0, HB, 0, +1, Math.round((X[5] - X[4]) / 3.4), FL);

  // ---------------------------------------------------------------- the recessed arch bay (x X1..X2, plane z = -1.4)
  {
    const zb = -1.4, xc = (X[1] + X[2]) / 2, ow = 1.6, y0 = 6.4, ys = 9.7;            // opening: x xc-1.6..xc+1.6, from the ledge at 6.4 to the springline 9.7 and a semicircle above
    vq(M.ruinBay, X[1], X[2], 0, y0, zb, +1, 2);
    const arc = []; for (let i = 0; i <= 10; i++) { const t = Math.PI - i / 10 * Math.PI; arc.push([xc + Math.cos(t) * ow, ys + Math.sin(t) * ow]); }
    const pts = [[X[1], y0], [xc - ow, y0], [xc - ow, ys], ...arc.slice(1), [xc + ow, y0], [X[2], y0], [X[2], HS], [X[1], HS]];
    P.vpoly(M.ruinPlain, pts, zb, +1, 3.4, FL, X[1], 0);
    P.beam(M.stone, arc.map((p) => [p[0], p[1] + 0.07, zb + 0.04]), 0.34, 0.3, [0, 0, 1]);                                // the pale arch ring
    const back = zb - 2.6, ring2 = [[xc - ow, y0], [xc + ow, y0], [xc + ow, ys], ...arc.slice().reverse().slice(1, -1), [xc - ow, ys]];
    P.vpoly(M.dark, ring2, back, +1);                                                                                         // the dark back wall of the opening
    P.quad(M.dark, [xc - ow, y0, zb], [xc - ow, y0, back], [xc - ow, ys, back], [xc - ow, ys, zb], [1, 0, 0]);                  // its two side faces and the arched soffit
    P.quad(M.dark, [xc + ow, y0, back], [xc + ow, y0, zb], [xc + ow, ys, zb], [xc + ow, ys, back], [-1, 0, 0]);
    P.ribbon(M.dark, arc.map((p) => [p[0], p[1], zb]), arc.map((p) => [p[0], p[1], back]), [0, -1, 0], 2);
    P.box(M.conc, xc - ow - 0.15, xc + ow + 0.15, y0 - 0.28, y0 + 0.05, zb - 2.6, zb + 0.5, '', 1.2);                          // the concrete slab ledge sticking out of the opening
    P.box(M.conc, xc - ow, xc + ow, y0 + 0.05, y0 + 0.4, zb - 2.6, zb - 2.0, '', 1.2);
    // returns of the neighbouring gable wings (the bay is 1.4 m behind the gable fronts)
    P.quad(M.ruinPlain, [X[1], 0, 0], [X[1], 0, zb], [X[1], HS, zb], [X[1], HS, 0], [1, 0, 0], [[0, 0], [0.5, 0], [0.5, HS / FL], [0, HS / FL]]);
    P.quad(M.ruinPlain, [X[2], 0, zb], [X[2], 0, 0], [X[2], HS, 0], [X[2], HS, zb], [-1, 0, 0], [[0, 0], [0.5, 0], [0.5, HS / FL], [0, HS / FL]]);
    // the plain brick strip joint above the bay (a wall top lip)
    P.box(M.dark, X[1], X[2], HS, HS + 0.25, zb - 0.1, zb + 0.55, 'b', 1.2);
  }

  // ---------------------------------------------------------------- the roof deck: the tall block's lantern, a few birch saplings
  P.far = 360;
  {
    const lx0 = X[5] - 9, lz0 = -D + 5;
    P.box(M.ruinPlain, lx0, lx0 + 5.5, HB, HB + 3.0, lz0, lz0 + 4, '', 1.2);
    P.quad(M.dark, [lx0 - 0.3, HB + 3.0, lz0 - 0.3], [lx0 + 5.8, HB + 3.0, lz0 - 0.3], [lx0 + 5.8, HB + 3.3, lz0 + 4.3], [lx0 - 0.3, HB + 3.3, lz0 + 4.3], [0, 1, 0]);
    const crown = new THREE.IcosahedronGeometry(1, 0);
    const tree = (x, z, y0, h) => {
      P.col(M.stone, x, z, y0, y0 + h, 0.055, 0.035, 5, false);
      for (let i = 0; i < 3; i++) { const yy = y0 + h * (0.5 + i * 0.22), rr = (0.7 - i * 0.14) * (0.8 + rng() * 0.4); P.geo(M.leaf, crown, x + (rng() - 0.5) * 0.35, yy, z + (rng() - 0.5) * 0.35, rng() * 3, rng() * 3, 0, rr, rr * 0.8, rr); }
    };
    for (let i = 0; i < 26; i++) {
      const onTall = i < 6, x = onTall ? X[4] + 1.5 + rng() * (X[5] - X[4] - 3) : X[0] + 1.5 + rng() * (X[4] - X[0] - 3), z = -1.2 - rng() * (D - 2.5);
      if (onTall) tree(x, z, HB, 3.2 + rng() * 2.6); else if (x < X[1] + 0.5 || x > X[2] - 0.5 || z < -2.5) tree(x, z, HS, 3.6 + rng() * 3.2);
    }
  }
  P.pop();

  // ---------------------------------------------------------------- the construction hoarding with site cabins in front (photos t22 t23)
  P.far = 420;
  P.push(f.S.x, 0, f.S.z, f.rot);
  {
    const zf = 11, x0 = -7, x1 = len + 7, H = 2.4, gate0 = 31 * k, gate1 = 36 * k;
    const okRun = (xa, xb, z) => { for (let x = xa; x <= xb; x += 3) { const w = toWorld(f, x, z); if (!clear(w.x, w.z, 1.2)) return false; } return true; };
    const panel = (xa, xb, z) => { if (!okRun(xa, xb, z)) return false; P.quad(M.corr, [xa, 0, z + 0.04], [xb, 0, z + 0.04], [xb, H, z + 0.04], [xa, H, z + 0.04], [0, 0, 1], [[xa, 0], [xb, 0], [xb, H], [xa, H]]); P.quad(M.corr, [xb, 0, z - 0.04], [xa, 0, z - 0.04], [xa, H, z - 0.04], [xb, H, z - 0.04], [0, 0, -1], [[xb, 0], [xa, 0], [xa, H], [xb, H]]); P.box(M.dark, xa, xb, H, H + 0.1, z - 0.07, z + 0.07, 'b', 1); return true; };
    const runs = [];
    if (panel(x0, gate0, zf)) runs.push([x0, gate0, zf]);
    if (panel(gate1, x1, zf)) runs.push([gate1, x1, zf]);
    const ret = (x) => { let ok = true; for (let z = 0; z <= zf; z += 3) { const w = toWorld(f, x, z); if (!clear(w.x, w.z, 1.2)) ok = false; } if (!ok) return; P.quad(M.corr, [x - 0.04, 0, 0], [x - 0.04, 0, zf], [x - 0.04, H, zf], [x - 0.04, H, 0], [-1, 0, 0], [[0, 0], [zf, 0], [zf, H], [0, H]]); P.quad(M.corr, [x + 0.04, 0, zf], [x + 0.04, 0, 0], [x + 0.04, H, 0], [x + 0.04, H, zf], [1, 0, 0], [[zf, 0], [0, 0], [0, H], [zf, H]]); P.box(M.dark, x - 0.07, x + 0.07, H, H + 0.1, 0, zf, 'b', 1); runs.push([x, x, zf / 2]); };
    ret(x0); ret(x1);
    // site cabins along the inside of the hoarding: blue and grey boxes 6 x 2.4 x 2.6 m, some stacked; portable toilets
    const cabin = (x, z, c2, high) => {
      const w = toWorld(f, x + 3, z + 1.2); if (!clear(w.x, w.z, 3.2)) return;
      P.box(c2 ? M.cabinBlue : M.corr, x, x + 6, 0.3, 2.7, z, z + 2.4, 'b', 1); P.box(M.dark, x, x + 6, 0.2, 0.32, z - 0.05, z + 2.45, 'b', 1); P.box(M.conc, x - 0.05, x + 6.05, 2.7, 2.78, z - 0.05, z + 2.45, 'b', 1);
      P.box(M.dark, x + 1.0, x + 1.9, 0.9, 1.8, z + 2.4, z + 2.43, 'bkb', 1); P.box(M.dark, x + 3.4, x + 4.0, 0.3, 2.3, z + 2.4, z + 2.43, 'bkb', 1);       // a window and a door on the hoarding side... (they face +z: toward the hoarding)
      if (high) { P.box(M.corr, x, x + 6, 2.78, 5.2, z, z + 2.4, 'b', 1); P.box(M.conc, x - 0.05, x + 6.05, 5.2, 5.28, z - 0.05, z + 2.45, 'b', 1); }
      if (ph) { const c = toWorld(f, x + 3, z + 1.2); ph.addBox(c.x, c.z, 6, 2.4, f.rot, 0, high ? 5.3 : 2.8); }
    };
    let cx = 6 * k; let n = 0;
    while (cx + 6 < gate0 - 1 && n < 6) { cabin(cx, zf - 4.2, n % 3 !== 1, n % 3 === 0); cx += 6.6; n++; }
    cx = gate1 + 1.5; n = 0;
    while (cx + 6 < x1 - 1 && n < 6) { cabin(cx, zf - 4.2, n % 2 === 0, n % 4 === 0); cx += 6.6; n++; }
    for (let i = 0; i < 7; i++) {
      const x = 5 + i * 1.35, z = zf - 6.6, w = toWorld(f, x, z); if (!clear(w.x, w.z, 1.5)) continue;
      P.box(i % 3 ? M.leaf : M.cabinBlue, x, x + 1.15, 0, 2.3, z, z + 1.15, 'b', 1); P.box(M.conc, x - 0.04, x + 1.19, 2.3, 2.42, z - 0.04, z + 1.19, 'b', 1);
    }
    if (ph) for (const [xa, xb, z] of runs) { const c = toWorld(f, (xa + xb) / 2, z); if (xa === xb) ph.addBox(c.x, c.z, 0.2, zf, f.rot, 0, H); else ph.addBox(c.x, c.z, xb - xa, 0.2, f.rot, 0, H); }
  }
  P.pop();
  if (ph) { const c = toWorld(f, len / 2, -D / 2); ph.addBox(c.x, c.z, len, D, f.rot, 0, HB + 0.8); }
  K.shared.malt = { f, D, len, X, HS, HB };
  { const c = toWorld(f, len / 2, -D / 2), sp = toWorld(f, len * 0.45, 24);
    K.svc.monuments.push({ id: IDS.malt, name: 'Солодовня пивоваренного завода «Новая Бавария»', x: c.x, z: c.z, h: HS + 8.7 });
    if (clear(sp.x, sp.z, 1.5)) K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: Math.round(L.yawToward(sp.x, sp.z, c.x, c.z)), name: 'Ремесленная, 7: три кирпичных щипца солодовни' }); }

  // ================================================================ the ruin w44425076: a roofless brick shell
  const rr = ringOf(IDS.ruin), crown2 = new THREE.IcosahedronGeometry(1, 0);
  if (!rr) return;
  const re = ringEdges(rr).reduce((a, q) => (q.len > a.len ? q : a)), rf = edgeFrame(re);
  let RD = 0; for (const p of rr) RD = Math.max(RD, -toLocal(rf, p[0], p[1]).lz);
  const RW = rf.len, T = 0.7, hs = [9.6, 9.6, 8.0, 9.6, 6.4, 8.0, 9.6, 9.6, 7.2, 9.6, 9.6, 6.4], r2 = ctx.rng(7102);
  P.push(rf.S.x, 0, rf.S.z, rf.rot);
  P.far = 900;
  // floor of rubble and moss inside
  P.quad(M.conc, [T, 0.05, -RD + T], [RW - T, 0.05, -RD + T], [RW - T, 0.05, -T], [T, 0.05, -T], [0, 1, 0]);
  const wallRun = (name, a0, a1, fixed, side) => {
    // a straight wall along local x (side 'z': plane z = fixed) or along z (side 'x'); the OUTER face looks away from the shell centre
    const len2 = Math.abs(a1 - a0), nb = Math.max(1, Math.round(len2 / 3.3)), pw = len2 / nb;
    let prevH = null;
    for (let i = 0; i < nb; i++) {
      const s0 = a0 + (a1 > a0 ? 1 : -1) * i * pw, s1 = s0 + (a1 > a0 ? 1 : -1) * pw, h = hs[(i * 5 + name.length * 3) % hs.length];
      const outward = side.out, lo = Math.min(s0, s1), hi = Math.max(s0, s1);
      if (side.axis === 'z') {                                                                               // plane z = fixed, spans x lo..hi, outward = +z or -z
        const zo = fixed + (outward > 0 ? T / 2 : -T / 2), zi = fixed - (outward > 0 ? T / 2 : -T / 2);
        P.quad(M.ruinBay, [lo, 0, zo], [hi, 0, zo], [hi, h, zo], [lo, h, zo], [0, 0, outward], [[0, 0], [1, 0], [1, h / FL], [0, h / FL]]);
        P.quad(M.ruinPlain, [lo, 0, zi], [hi, 0, zi], [hi, h, zi], [lo, h, zi], [0, 0, -outward], [[0, 0], [1, 0], [1, h / FL], [0, h / FL]]);
        P.quad(M.dark, [lo, h, zo], [hi, h, zo], [hi, h, zi], [lo, h, zi], [0, 1, 0]);
      } else {                                                                                                // plane x = fixed, spans z lo..hi, outward = +x or -x
        const xo = fixed + (outward > 0 ? T / 2 : -T / 2), xi = fixed - (outward > 0 ? T / 2 : -T / 2);
        P.quad(M.ruinBay, [xo, 0, lo], [xo, 0, hi], [xo, h, hi], [xo, h, lo], [outward, 0, 0], [[0, 0], [1, 0], [1, h / FL], [0, h / FL]]);
        P.quad(M.ruinPlain, [xi, 0, lo], [xi, 0, hi], [xi, h, hi], [xi, h, lo], [-outward, 0, 0], [[0, 0], [1, 0], [1, h / FL], [0, h / FL]]);
        P.quad(M.dark, [xo, h, lo], [xo, h, hi], [xi, h, hi], [xi, h, lo], [0, 1, 0]);
      }
      // the thin end faces (the wall is 0.7 m thick): at a step between two segments (the taller one shows its end, along z and along x alike) and at both free ends of the run
      // (the corners are open slivers otherwise: back faces are culled, so the wall looked hollow and only its outline hung in the sky)
      const e0 = fixed - T / 2, e1 = fixed + T / 2;
      const endFace = (s, ha, hb, nrm) => {
        const uv = [[0, ha / FL], [T / 3.4, ha / FL], [T / 3.4, hb / FL], [0, hb / FL]];                          // the brick tile is 3.4 x 3.2 m: the section of the wall shows plain brick
        return side.axis === 'z'
          ? P.quad(M.ruinPlain, [s, ha, e0], [s, ha, e1], [s, hb, e1], [s, hb, e0], [nrm, 0, 0], uv)
          : P.quad(M.ruinPlain, [e0, ha, s], [e1, ha, s], [e1, hb, s], [e0, hb, s], [0, 0, nrm], uv);
      };
      if (prevH !== null && prevH.h !== h) endFace(s0, Math.min(prevH.h, h), Math.max(prevH.h, h), prevH.h > h ? +1 : -1);          // +1: the previous (lower s) segment is taller: its end looks to +s
      if (i === 0) endFace(lo, 0, h, -1);
      if (i === nb - 1) endFace(hi, 0, h, +1);
      prevH = { h };
    }
  };
  wallRun('front', 0, RW, -T / 2 + 0, { axis: 'z', out: +1 });                         // the long wall along the frame edge (outward +z)
  wallRun('back', 0, RW, -RD + T / 2, { axis: 'z', out: -1 });
  wallRun('west', -RD + T, -T, T / 2, { axis: 'x', out: -1 });                          // short walls (their z spans the gap between the long walls)
  wallRun('east', -RD + T, -T, RW - T / 2, { axis: 'x', out: +1 });
  // a few birches inside and on the wall tops
  for (let i = 0; i < 6; i++) {
    const x = 2 + r2() * (RW - 4), z = -2 - r2() * (RD - 4), h = 3 + r2() * 3.5;
    P.col(M.stone, x, z, 0.05, 0.05 + h, 0.06, 0.035, 5, false);
    for (let j = 0; j < 3; j++) { const yy = 0.05 + h * (0.5 + j * 0.22), q = 0.7 - j * 0.14; P.geo(M.leaf, crown2, x, yy, z, r2() * 3, r2() * 3, 0, q, q * 0.8, q); }
  }
  P.pop();
  if (ph) {
    const w = (lx, lz, wd, d) => { const c = toWorld(rf, lx, lz); ph.addBox(c.x, c.z, wd, d, rf.rot, 0, 9.8); };
    w(RW / 2, -T / 2, RW, T); w(RW / 2, -RD + T / 2, RW, T); w(T / 2, -RD / 2, T, RD); w(RW - T / 2, -RD / 2, T, RD);
  }
  K.shared.ruin = { rf, RW, RD };
}
