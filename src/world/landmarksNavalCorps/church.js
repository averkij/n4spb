// landmarksNavalCorps/church.js - the CHURCH OF THE DORMITION of the Optina metochion (Успенская церковь, Lt Schmidt emb. 27; V. A. Kosyakov with B. K. Pravdzik, 1895-97; OSM r17488566): the shell.
// Dossier docs/research/navalcorps.md section 6, photos refs/navalcorps c16 (the reading photograph across the Neva) c17 c09 c10 c14 c18 c28.  Frame C (u along the long axis to the apses, v to the Neva).
//   PLAN     a rectangle u 0 .. 27.2 x v 0 .. 24 and the NE apse group: a hexagonal central apse (three facets, to u 31.8) between two smaller side apses; the OSM rectangle 31.9 x 24.0 is its bounding box.
//   TIERS    granite plinth 1.3 m (rough dark grey) -> yellow-tan Riga brick walls with sandstone belts, arcature friezes and majolica squares (texture) to the cornice 14.1 m (arcature band 12.6 .. 13.5 and a belt 13.5 ..
//            14.1; the side apses 11.4 m) -> dark vault roofs: the transverse keel-arched vault (u 4.9 .. 14.0) with the big GABLE of the Neva face (spring 15.2, apex 19.1: archivolt rolls, a gold mosaic field,
//            an arched niche window), the longitudinal vault to the apses, the grey hipped roofs of the apse group; the central drum (dia 9.5, 14.1 .. 28.0, 8 tall windows, kokoshnik frieze) with the dome
//            (domes.js), four corner towers with silver onions, three small gilded domes on grey stalks over the apses; tall arched windows (1.0 x 4.3 m, sill 6.0) with sandstone frames; THREE PORTALS with stepped
//            archivolts and boarded ochre doors at the foot of the apse facets (not on the flat Neva face).
//   The front house, its gate portal and the fences are in fronthouse.js.  No flags.
import * as THREE from 'three';
import { C, CH_PLAN, HT } from './frame.js';
import { ringEdges, onEdge, band } from './kit.js';
import { keelPts, archPts, shapeOf, planeShape, frameRing, ogeePts } from './geo.js';
import { centralDome, cornerTower, smallDome } from './domes.js';
import { revolve } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2, H_MAIN = 14.1, H_SIDE = 11.4, Y_PL = 1.3;
export const SMALL = [[28.4, 3.4, 13.6, 19.7, 1.05, 'diamond'], [30.4, 12.0, 15.6, 20.7, 1.25, 'spiral'], [28.4, 20.6, 13.6, 19.3, 0.9, 'diamond']];   // u, v, stalk base, cross tip, belly radius, gilding
const TOWERS = [[5.5, 3.5], [24.7, 3.5], [5.5, 20.5], [24.7, 20.5]];

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNavalCorps] church/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P;
  const poly = { o: CH_PLAN.flat(), h: [] }, edges = ringEdges(poly);
  P.push(C.x, 0, C.z, C.rot);
  try {
    stage('walls', () => walls(Q, edges));
    stage('roofs', () => roofs(Q));
    stage('drum', () => drum(Q));
    stage('domes', () => { centralDome(P, Q.M, 14.9, 12.0); for (const [u, v] of TOWERS) cornerTower(P, Q.M, u, v); for (const [u, v, yb, tip, r, st] of SMALL) smallDome(P, Q.M, u, v, yb, tip, r, st); });
    stage('portals', () => portals(Q, edges));
  } finally { P.pop(); }
  // the church is solid: thin wall boxes on the plan (world coordinates)
  stage('colliders', () => {
    const w = CH_PLAN.flatMap(([u, v]) => { const p = C.W(u, v); return [p.x, p.z]; });
    addPolyColliders(Q.ctx, { o: w, h: [] }, -0.3, 20, 0.9);
    Q.ctx.physics.addCylinder(C.W(14.9, 12).x, C.W(14.9, 12).z, 4.9, 14, 30);
  });
  const c = C.W(15.5, 12);
  Q.svc.monuments.push({ id: 'r17488566', name: 'Успенская церковь подворья Оптиной пустыни', x: c.x, z: c.z, h: 40 });
  if (errs.length) throw new Error(errs.join('\n'));
}

const hOf = (e) => { const mu = (e.a[0] + e.b[0]) / 2, mv = (e.a[1] + e.b[1]) / 2; return mu > 27.15 && (mv < 6.75 || mv > 17.25) ? H_SIDE : H_MAIN; };
function kind(e) {
  const A = e.a, B = e.b;
  if (Math.abs(A[1] - 24) < 0.01 && Math.abs(B[1] - 24) < 0.01) return 'se';
  if (Math.abs(A[1]) < 0.01 && Math.abs(B[1]) < 0.01) return 'nw';
  if (Math.abs(A[0]) < 0.01 && Math.abs(B[0]) < 0.01) return 'sw';
  return hOf(e) === H_SIDE ? 'side' : 'hex';
}

/** a tall arched window in the current edge frame: centre x, sill y, width w, total height h: a sandstone frame ring and the dark glass */
function archWindow(P, M, x, sill, w, h, z = 0) {
  const outer = archPts(x, sill - 0.2, w + 0.55, h + 0.45, 8), inner = archPts(x, sill, w, h, 8);
  frameRing(P, M.belt, outer, inner, z, 0.12, 1);
  planeShape(P, M.winChurch, inner, z + 0.02);
}

/** relief on a wall in the edge frame: brick pilaster strips between the windows and at the ends, proud sandstone belts under and over the window row, an ogee crown (kokoshnik) over every tall window */
function relief(P, M, len, wins, sill, top, H) {
  const xs = [...wins].sort((a, b) => a - b), cuts = [0.3, len - 0.3];
  for (let i = 0; i + 1 < xs.length; i++) if (xs[i + 1] - xs[i] > 2.4) cuts.push((xs[i] + xs[i + 1]) / 2);
  for (const x of cuts) { P.box(M.brickFlat, x - 0.28, x + 0.28, Y_PL, H - 1.5, 0, 0.2, 'bk', 2); P.box(M.belt, x - 0.36, x + 0.36, H - 1.5, H - 1.35, 0, 0.26, 'bk', 1); P.box(M.belt, x - 0.36, x + 0.36, Y_PL, Y_PL + 0.18, 0, 0.26, 'bk', 1); }
  P.box(M.belt, 0, len, sill - 0.55, sill - 0.35, 0, 0.14, 'bk', 2);
  P.box(M.belt, 0, len, top + 1.1, top + 1.28, 0, 0.16, 'bk', 2);
  for (const x of xs) {
    const o = ogeePts(1.9, 0.8, 6); P.push(x, top + 0.2, 0, 0); P.extrude(M.belt, shapeOf(o), 0.0, 0.2, 1, 4); P.pop();
    const o2 = ogeePts(1.35, 0.5, 6); P.push(x, top + 0.28, 0, 0); P.extrude(M.houseTerra, shapeOf(o2), 0.0, 0.26, 1, 4); P.pop();
  }
}

function walls(Q, edges) {
  const P = Q.P, M = Q.M;
  for (const e of edges) {
    const k = kind(e), H = hOf(e);
    onEdge(P, e, (len) => {
      P.quad(M.brick, [0, Y_PL, 0], [len, Y_PL, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, Y_PL / 3.6], [len / 3, Y_PL / 3.6], [len / 3, H / 3.6], [0, H / 3.6]]);
      // granite plinth with its capping slab
      P.box(M.plinthCh, -0.12, len + 0.12, 0, Y_PL - 0.15, 0, 0.18, 'b', 2);
      P.box(M.plinthChLit, -0.18, len + 0.18, Y_PL - 0.15, Y_PL, 0, 0.3, 'b', 2);
      // flood-shutter windows of the basement: small dark openings in the plinth
      if (k === 'se' || k === 'nw') for (let x = 1.6; x < len - 1; x += 3.2) P.box(M.glassDark, x - 0.3, x + 0.3, 0.45, 0.95, 0.17, 0.2, 'bk', 1);
      // windows
      const wins = k === 'se' ? [4.1, 8.1, 9.7, 11.3, 16.2, 21.4, 24.6] : k === 'nw' ? [5.5, 9.0, 12.5, 16.5, 20.5, 24.5].map((u) => 27.2 - u) : k === 'hex' ? [len / 2] : k === 'side' ? [len / 2] : [];
      for (const x of wins) if (k === 'side') archWindow(P, M, x, 4.0, 0.9, 4.4, 0.0); else archWindow(P, M, x, 6.0, 1.0, 4.3, 0.0);
      if (k === 'se' || k === 'nw') relief(P, M, len, wins, 6.0, 10.3, H); else if (k === 'hex') relief(P, M, len, wins, 6.0, 10.3, H); else if (k === 'side') relief(P, M, len, wins, 4.0, 8.4, H);
      // a row of small arched windows in the ornament belt at 11.5 .. 12.8 above the big ones
      if (k === 'se') for (const x of [4.1, 8.1, 9.7, 11.3, 16.2, 21.4, 24.6]) { const o = archPts(x, 11.4, 0.45, 1.1, 6); frameRing(P, M.belt, archPts(x, 11.25, 0.8, 1.4, 6), o, 0, 0.1, 1); planeShape(P, M.winChurch, o, 0.02); }
      if (k === 'se') gable(P, M, 9.45, true);
      if (k === 'nw') gable(P, M, 27.2 - 9.45, false);
    });
  }
  // the cornices: the arcature band and the belt above it, mitred round the whole plan (main 12.6 .. 14.1; side apses 9.9 .. 11.4)
  for (const [ya, yb, yc, h] of [[12.6, 13.5, 14.1, H_MAIN], [9.9, 10.8, 11.4, H_SIDE]]) {
    const draw = (e) => hOf(e) === h;
    band(P, edges, ya, yb, 0.22, { front: M.arcature, top: M.belt, under: M.belt }, { draw, uvs: 0.9 });
    band(P, edges, yb, yc, 0.34, { front: M.belt, top: M.belt, under: M.belt }, { draw, uvs: 1 });
  }
}

/** the big keel-arched GABLE (kokoshnik) of a transverse arm in the edge frame at centre x: spring 15.2, apex 19.1, archivolt rolls, mosaic field (SE face: the real one; the NW face keeps plain brick) */
function gable(P, M, cx, mosaic) {
  const w = 9.1, y0 = H_MAIN, ys = 15.2, hg = 3.9;
  const k = keelPts(w, hg, 10).map((p) => [cx + p[0], ys + p[1]]);
  // the field: a straight lower part (14.1 .. 15.2) and the keel above, brick texture
  const pts = [[cx - w / 2, y0], [cx + w / 2, y0], ...k.slice(1)];
  P.face(M.brick, shapeOf(pts), 0, 3, 4);
  // two rolls: sandstone and terracotta, extruded 0.3 / 0.18 m
  const outer = keelPts(w + 0.9, hg + 0.5, 10).map((p) => [cx + p[0], ys - 0.05 + p[1]]), mid = keelPts(w + 0.3, hg + 0.15, 10).map((p) => [cx + p[0], ys - 0.02 + p[1]]), inner = keelPts(w - 0.3, hg - 0.2, 10).map((p) => [cx + p[0], ys + 0.02 + p[1]]);
  frameRing(P, M.belt, outer, mid, 0, 0.28, 1);
  frameRing(P, M.houseTerra, mid, inner, 0, 0.2, 1);
  if (mosaic) {
    const mo = keelPts(w - 1.0, hg - 0.7, 10).map((p) => [cx + p[0], ys + 0.1 + p[1]]);
    planeShape(P, M.mosaic, mo, 0.22);
    // the gilded abstract inscription band along the curve: a thin gold ring just inside the roll
    const gi = keelPts(w - 0.5, hg - 0.4, 10).map((p) => [cx + p[0], ys + 0.06 + p[1]]);
    frameRing(P, M.gild, gi, keelPts(w - 0.9, hg - 0.65, 10).map((p) => [cx + p[0], ys + 0.08 + p[1]]), 0, 0.2, 1);
    // the tall arched niche window in the middle (1.2 x 3.6 m) with its stone frame
    const nw = archPts(cx, 14.6, 1.2, 3.6, 8);
    frameRing(P, M.belt, archPts(cx, 14.4, 1.9, 4.2, 8), nw, 0, 0.25, 1);
    planeShape(P, M.winChurch, nw, 0.1);
  }
}

function roofs(Q) {
  const P = Q.P, M = Q.M;
  // flat dark roof cap of the main rectangle at the cornice (the vaults and the drum rise from it); side apses and the central apse have their own caps / hips
  P.cap(M.vault, [[0, 0], [27.2, 0], [27.2, 24], [0, 24]], H_MAIN, true, 3);
  // the transverse keel vault (u 4.9 .. 14.0, the whole depth, stopping 0.1 m short of both gable faces)
  const w = 9.1, xc = 9.45, ys = 15.2, k = keelPts(w, 3.9, 10).map((p) => [xc + p[0], ys + p[1]]);
  const prof = [[xc - w / 2, H_MAIN], [xc + w / 2, H_MAIN], ...k.slice(1)];
  P.push(0, 0, 24, 0);                                                    // frame of the SE face: local x = u, local z = v - 24
  P.extrude(M.vault, shapeOf(prof), -23.9, 23.8, 2, 4);
  P.pop();
  // the longitudinal vault from the drum to the apses (width 7.4, apex 18.2) in a frame turned to run along +u
  { const wl = 7.4, kl = keelPts(wl, 3.4, 10).map((p) => [p[0], 14.8 + p[1]]), pl = [[-wl / 2, H_MAIN], [wl / 2, H_MAIN], ...kl.slice(1)];
    P.push(27.2, 0, 12, Math.PI / 2); P.extrude(M.vault, shapeOf(pl), -8.4, 8.4, 2, 4); P.pop(); }
  // the central apse: a pyramid of grey sheet iron over the half hexagon
  const hexP = [[27.2, 6.7], [31.79, 9.35], [31.79, 14.65], [27.2, 17.3]], ap = [29.0, H_MAIN + 3.9, 12];
  for (let i = 0; i < 3; i++) { const a = hexP[i], b = hexP[i + 1]; P.fan(M.greyRoof, [[a[0], H_MAIN, a[1]], [b[0], H_MAIN, b[1]], ap], [0, 0.8, 0]); }
  P.fan(M.greyRoof, [[27.2, H_MAIN, 17.3], [27.2, H_MAIN, 6.7], ap], [-1, 0.6, 0]);
  // the two side apses: caps and low pyramids
  for (const [pts, apx] of [[[[27.2, 0], [29.97, 1.6], [29.97, 5.0], [27.2, 6.7]], [28.6, H_SIDE + 2.7, 3.35]], [[[27.2, 17.3], [29.97, 19.0], [29.97, 22.4], [27.2, 24]], [28.6, H_SIDE + 2.7, 20.65]]]) {
    for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; P.fan(M.greyRoof, [[a[0], H_SIDE, a[1]], [b[0], H_SIDE, b[1]], apx], [0, 0.8, 0]); }
  }
  // hip roofs of the porch blocks and the dark patinated copper of the SW end: a low cap over the SW 5 m (the vault does not reach it)
  void THREE;
}

function drum(Q) {
  const P = Q.P, M = Q.M, cx = 14.9, cz = 12.0, r = 4.75;
  revolve(P, M.brick, [[r, 14.0], [r, 19.5]], 32, { cx, cz, uRep: 10, vTile: 3.6 });
  revolve(P, M.arcature, [[r + 0.16, 19.5], [r + 0.16, 20.1], [r, 20.1]], 32, { cx, cz, uRep: 15, vTile: 0.6 });
  revolve(P, M.brick, [[r, 20.1], [r, 25.3]], 32, { cx, cz, uRep: 10, vTile: 3.6 });
  revolve(P, M.arcature, [[r + 0.2, 25.3], [r + 0.2, 26.5], [r, 26.5]], 32, { cx, cz, uRep: 15, vTile: 1.2 });                      // the pierced kokoshnik frieze
  revolve(P, M.belt, [[r + 0.5, 26.5], [r + 0.5, 27.0], [r + 0.25, 27.0], [r + 0.25, 27.5], [r, 27.5], [r, 28.0]], 32, { cx, cz, uRep: 10, vTile: 1 });   // stepped cornice
  revolve(P, M.belt, [[r + 0.5, 27.0], [r + 0.5, 26.5]], 32, { cx, cz, uRep: 10 });
  revolve(P, M.vault, [[r, 28.0], [3.8, 28.05]], 32, { cx, cz });
  // 8 tall arched windows 0.65 x 2.9 (sill 21.1, head 24.0), dark frames, evenly round the drum
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + TAU / 16, px = cx + Math.sin(a) * (r + 0.03), pz = cz + Math.cos(a) * (r + 0.03);
    P.push(px, 0, pz, a);
    const o = archPts(0, 21.1, 0.65, 2.9, 6);
    frameRing(P, M.belt, archPts(0, 20.95, 1.05, 3.3, 6), o, 0, 0.1, 1);
    planeShape(P, M.winChurch, o, 0.02);
    P.pop();
  }
}

/** three portals at the foot of the apse facets (dossier 6.1): a stepped archivolt of stone and brick (4.4 m wide, crest +5.3 m), the boarded ochre door (2.3 x 1.35 m on a +1.1 m sill); no pent roof (removed in the review) */
function portals(Q, edges) {
  const P = Q.P, M = Q.M, pick = [];
  const find = (a, b) => edges.find((e) => (Math.hypot(e.a[0] - a[0], e.a[1] - a[1]) < 0.02 && Math.hypot(e.b[0] - b[0], e.b[1] - b[1]) < 0.02));
  for (const [a, b] of [[[29.97, 22.4], [27.2, 24]], [[31.79, 14.65], [27.2, 17.3]], [[31.79, 9.35], [31.79, 14.65]]]) { const e = find(a, b); if (e) pick.push(e); }
  for (const e of pick) {
    onEdge(P, e, (len) => {
      const x = len / 2, zz = 0.3;
      // two granite steps across the portal (visual: the wall behind stops the walker)
      P.box(M.plinthChLit, x - 2.5, x + 2.5, 0, 0.55, 0, 1.3, 'b', 2); P.box(M.plinthChLit, x - 2.2, x + 2.2, 0.55, 1.1, 0, 0.7, 'b', 2);
      const ring = (w, hh, d, mat, z0) => frameRing(P, mat, archPts(x, 1.1, w, hh, 8), archPts(x, 1.1, w - 0.5, hh - 0.3, 8), z0, d, 1);
      ring(4.4, 4.2, 0.2, M.belt, 0.3); ring(3.9, 3.8, 0.2, M.houseTerra, 0.5); ring(3.4, 3.4, 0.2, M.belt, 0.7);
      const inner = archPts(x, 1.1, 2.9, 3.0, 8);
      planeShape(P, M.plinthCh, inner, 0.32);
      P.quad(M.portalDoor, [x - 0.675, 1.1, 0.34], [x + 0.675, 1.1, 0.34], [x + 0.675, 3.4, 0.34], [x - 0.675, 3.4, 0.34], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // review 2026-10-08: the small dark pent roof that stood 5.7 .. 6.6 m over each portal (a single unsupported sheet, 5.2 m wide, floating in front of the wall in every view at 1-3 m) is removed:
      // c17 / c09 show the arched archivolt only; the dark hipped roofs of c17 belong to the apse facets 8-9 m higher, not to the doors.
      void zz;
    });
  }
}
void HT;
