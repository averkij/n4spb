// landmarksGavan/church.js - the CHURCH OF THE MERCIFUL MOTHER OF GOD in Galerny Gavan (Церковь иконы Божией Матери «Милующая», Большой пр. В.О. 100, 1889-98, V. Kosyakov and D. Prussak; OSM w64384715; frame M, u toward the altar
// (NE), v to the right (SE)) (docs/research/gavan.md section 10; photos refs/gavan 102 106-110 123).  The RESTORED state of 2022-25: cream plaster, silvery scale domes with gilded bands, gilded crosses, the gold imperial crown on the bell
// tower; exterior only (the territory is closed): solid walls, the hoarding along Bolshoy pr., the temporary wooden church in front of it.
//   PLAN      the baked 27-vertex ring (46 x 25 m), extruded per region: nave walls 17.5 m (cornice with corbel arches, ornament bands, arched windows), the north and east apse arcs 12 m, the SW lobe 12 m, the south porch 7 m,
//             the narthex / bell-tower block 7 m.
//   DOMES     central drum 15.0 m with 18 arched windows (27 .. 34.5) on an octagonal ornamented collar (17.5 .. 27), silver dome to 41.5 with two gilded bands, gilded lantern ring and ball to 42.0 = the foot of the cross,
//             the gilded cross 4.5 m (tip 46.5); four conch domes on 8-window drums (N (4.1, -5.5) and E (15.3, 0.9) per the ring arcs [C20]; S and W embedded in the nave [?]), top 24 m, gilded crosses; four small gilded
//             chapel domes on windowed drums at the nave corners [?]; the bell tower (7 m body, belfry drum with six open arches, gilded dome, crown, cross: 21 m).
//   FORECOURT the grey corrugated hoarding along Bolshoy pr. (the mapped fence w634473865), its object-passport board, the temporary wooden church w634473943 with its chequered onion.  No flags (the dealer's are left out).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FM, rectOf, rectFacing } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { tube, frustum, revolve, onion, ball, cross } from './geo.js';
import { gableRoof, hipRoof, loft } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';
import { wallBays } from './fence.js';
import { unitPanel, splitBays } from '../lib/fence-bays.js';      // n4spb: the hoarding is a row of breakable bays
import { coverFn } from './surfaces.js';

const AX = { u: 5.0, v: 1.3 };
const NAVE = { u0: -13.1, u1: 14.4, v0: -7.3, v1: 9.9 };
const CONCH = { N: { u: 4.1, v: -5.5, r: 5.9, y0: 12.6, y1: 19.0 }, E: { u: 15.3, v: 0.9, r: 5.4, y0: 12.6, y1: 19.0 }, S: { u: 5.0, v: 5.2, r: 5.0, y0: 17.5, y1: 20.6 }, W: { u: -1.5, v: 1.3, r: 5.0, y0: 17.5, y1: 20.6 } };
const CHAPELS = [[-11.3, -5.6], [12.4, -5.6], [12.4, 8.1], [-11.3, 8.1]];
const BELL = { u: -18.25, v: -3.15 };

/** wall height of the ring edge with the midpoint (u, v) in frame M */
function hOf(u, v) {
  if (u < -13.0) return 7.0;                                  // narthex / bell-tower block
  if (u < -1.8 && v > 2.0) return 12.0;                       // the SW lobe
  if (v > 11.0) return 7.0;                                   // the south porch
  if (u > 6.0 && v > 9.95) return 7.0;
  if (v > 7.2 && u > -2.5 && u < 6.5) return 12.0;            // the south notch (S conch apse)
  if (v < -7.3 || u > 14.0) return 12.0;                      // the north and east apse arcs
  return 17.5;
}

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] church/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const b = L.buildingById('w64384715');
  if (!b || !b.polys || !b.polys[0]) throw new Error('missing footprint w64384715');
  const poly = b.polys[0];
  stage('walls', () => walls(Q, poly));
  stage('top', () => top(Q));
  stage('domes', () => domes(Q));
  stage('tower', () => tower(Q));
  stage('chapel', () => woodChurch(Q));
  stage('hoarding', () => hoarding(Q));
  stage('colliders', () => { addPolyColliders(Q.ctx, poly, -0.3, 22, 0.9); const c = FM.W(AX.u, AX.v); Q.ctx.physics.addCylinder(c.x, c.z, 7.6, 12, 44); });
  const c = FM.W(AX.u, AX.v);
  // review: the old spot (-5962, 514) stood 3.9 m from the hoarding and stared at its sheet metal and the log church's roof; the postcard (photo 109) is taken from the far pavement of Bolshoy pr.
  Q.svc.crowd.push({ id: 'church-pavement', kind: 'photo', x: -5984.3, z: 505.8, r: 4, n: 3 });
  Q.svc.monuments.push({ id: 'w64384715', name: 'Церковь иконы Божией Матери «Милующая»', x: c.x, z: c.z, h: 46.5 });
  Q.svc.photoSpots.push({ x: -5984.3, z: 505.8, yaw: -122, pitch: 20, name: 'Церковь «Милующая»: купола над забором' }, { x: -5910, z: 490, yaw: 153, pitch: 14, name: 'Церковь «Милующая»: апсида и колокольня' });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ walls of the ring
function walls(Q, poly) {
  const P = Q.P, M = Q.M, edges = ringEdges(poly);
  for (const e of edges) {
    if (e.len < 0.4) continue;
    const mid = FM.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), H = hOf(mid.u, mid.v), len = e.len;
    const tile = H > 15 ? M.churchWall17 : H > 9 ? M.churchWall12 : M.churchWall7, th = H > 15 ? 17.5 : H > 9 ? 12.0 : 7.0, n = Math.max(1, Math.round(len / 4));
    onEdge(P, e, () => {
      P.quad(tile, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [n, 0], [n, H / th], [0, H / th]]);
      P.box(M.coping, -0.04, len + 0.04, 0, 0.9, 0, 0.14, 'b', 2);                                               // the granite plinth
      P.box(M.churchRelief, -0.05, len + 0.05, H - 0.45, H + 0.1, 0, 0.45, 'b', 2);                              // the cornice band
    });
  }
  // the west portal under the bell tower (3.2 x 6.5 m, 4 steps), facing -u
  P.push(FM.x, 0, FM.z, FM.rot);
  P.push(-23.5, 0, -3.2, -Math.PI / 2);
  P.quad(M.portalChurch, [-1.6, 0.9, 0.04], [1.6, 0.9, 0.04], [1.6, 7.4, 0.04], [-1.6, 7.4, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (let k = 0; k < 4; k++) P.box(M.coping, -2.2, 2.2, 0, 0.9 - 0.2 * k, 0.04 + 0.3 * k, 0.04 + 0.3 * (k + 1), 'b', 1);
  P.pop(); P.pop();
}

/** Sutherland-Hodgman: the part of `subject` (any simple polygon [[u, v]..]) inside the CONVEX polygon `clipPoly`; review fix: the roof caps were plain rectangles / arcs and stuck out of the ring (floating plates beside the conches) */
function clipPoly(subject, clip) {
  let a2 = 0; for (let i = 0; i < clip.length; i++) { const j = (i + 1) % clip.length; a2 += clip[i][0] * clip[j][1] - clip[j][0] * clip[i][1]; }
  const ca = a2 > 0 ? 1 : -1; let out = subject.slice();
  for (let i = 0; i < clip.length && out.length; i++) {
    const A = clip[i], B = clip[(i + 1) % clip.length], inp = out; out = [];
    const side = (P) => ca * ((B[0] - A[0]) * (P[1] - A[1]) - (B[1] - A[1]) * (P[0] - A[0]));
    for (let k = 0; k < inp.length; k++) {
      const P = inp[k], Q = inp[(k + 1) % inp.length], sp = side(P), sq = side(Q);
      if (sp >= 0) out.push(P);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
    }
  }
  return out;
}
// ------------------------------------------------------------------------------------------------ roofs / caps at the wall tops
function top(Q) {
  const P = Q.P, M = Q.M;
  FM.on(P, () => {
    const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const ringM = (() => { const o = L.buildingById('w64384715').polys[0].o, r = []; for (let i = 0; i < o.length; i += 2) { const q = FM.M(o[i], o[i + 1]); r.push([q.u, q.v]); } return r; })();
    const capBoth = (convex, y) => { const ring = clipPoly(ringM, convex); if (ring.length < 3) return; P.cap(M.zincChurch, ring, y, true, 3); P.cap(M.churchPlain, ring, y - 0.06, false, 3); };       // clipped to the real ring; the underside is closed (a roof cap seen from below is a back face: only its outline was drawn, thin blue wires in the postcard view)
    capBoth(rect(NAVE.u0, NAVE.u1, NAVE.v0, NAVE.v1), 17.52);                              // the nave (flat zinc behind the collar)
    capBoth(rect(-13.1, -1.9, 2.4, 10.7), 12.02);                                          // the SW lobe (to the ring: its south wall bulges to v 10.5)
    capBoth(rect(-13.4, -3.2, -8.6, -7.3), 12.02);                                         // floating-slab fix: the 12 m roof of the sliver between the north ring wall and the nave face
    capBoth(rect(-2.5, 6.4, 7.0, 10.0), 12.02);                                            // the south notch
    capBoth(rect(6.3, 14.5, 9.8, 12.0), 7.02);                                             // the porch
    const arc = (cu, cv, r, t0, t1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return [cu + r * Math.cos(t), cv + r * Math.sin(t)]; });
    capBoth(arc(4.1, -5.5, 7.5, Math.PI + 0.24, 2 * Math.PI - 0.24, 14).concat([]), 12.02);        // the north apse (a half disc over the arc)
    capBoth(arc(15.3, 0.9, 6.4, -1.7, 1.7, 14), 12.02);                                      // the east apse
    // the narthex: a hip roof of grey zinc under the bell tower
    hipRoof(P, M.zincChurch, -23.4, -13.1, -8.0, 1.7, 7.0, 1.7, { oe: 0.25, ridgeLen: 1 });
    P.cap(M.churchPlain, rect(-23.65, -12.85, -8.25, 1.95), 6.88, false, 3);                                  // the soffit of the narthex roof (its underside is seen from the street)
    // review fix: the nave (17.5 m) rises above the lower roofs of the apses, the lobe, the porch and the narthex, but only the ring walls were drawn (12 / 7 m): above every lower roof the nave wall was MISSING and the
    // underside of the nave cap showed from the street as a floating tan plate (the postcard view of photo 109).  Walls a -> b: the outward normal is (-dz, dx); the texture rows continue those of the ring walls (17.5 m per tile).
    const upper = (a, b, y0, y1) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = b[0] - a[0], dz = b[1] - a[1], n = Math.max(1, Math.round(len / 4));
      P.quad(M.churchWall17, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [-dz / len, 0, dx / len], [[0, y0 / 17.5], [n, y0 / 17.5], [n, y1 / 17.5], [0, y1 / 17.5]]);
      P.box(M.churchRelief, Math.min(a[0], b[0]) - 0.05, Math.max(a[0], b[0]) + 0.05, y1 - 0.45, y1 + 0.1, Math.min(a[1], b[1]) - 0.05, Math.max(a[1], b[1]) + 0.05, 'b', 2);
    };
    upper([11.4, -7.3], [-3.2, -7.3], 12.02, 17.5);                                  // above the north apse
    upper([-3.2, -7.3], [-12.3, -7.3], 12.02, 17.5);                                 // floating-slab fix: the north face of the nave west of the apse (ring walls 12 m there) was open up to the cap
    upper([14.4, 9.9], [14.4, -6.1], 12.02, 17.5);                                   // above the east apse and the SE corner (was 7.2 .. -5.4: open at both ends)
    upper([-2.5, 7.0], [6.4, 7.0], 12.02, 17.5);                                     // above the south notch
    upper([-13.1, 2.4], [-1.9, 2.4], 12.02, 17.5);                                   // the north edge of the SW lobe
    upper([-1.9, 2.4], [-1.9, 7.0], 12.02, 17.5);                                    // the east edge of the SW lobe
    upper([6.4, 9.9], [14.4, 9.9], 7.02, 17.5);                                      // above the porch
    upper([-13.1, -7.3], [-13.1, 1.7], 7.02, 17.5);                                  // above the narthex
    upper([-13.1, 2.5], [-13.1, 9.9], 12.02, 17.5);                                  // above the SW lobe, west face
  });
}

// ------------------------------------------------------------------------------------------------ the domes
const ellipseDome = (R, h, n = 9) => Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI / 2; return [Math.max(0.02, R * Math.cos(t)), h * Math.sin(t)]; });

/** a silver scale dome of base radius R rising h at (cu, cv) from y0, with two gilded bands; returns the apex y */
function dome(P, M, cu, cv, y0, R, h, bands = [[0.07, 0.115], [0.42, 0.455]], seg = 40) {
  const prof = ellipseDome(R, h).map(([r, y]) => [r, y0 + y]);
  revolve(P, M.domeSilver, prof, seg, { cx: cu, cz: cv, uRep: Math.round(2 * Math.PI * R), vTile: 1 });
  const at = (f) => { const t = f * Math.PI / 2; return [(R + 0.07) * Math.cos(t), y0 + h * Math.sin(t)]; };
  for (const [a, b] of bands) { const pts = Array.from({ length: 5 }, (_, i) => at(a + (b - a) * i / 4)); revolve(P, M.gildBand, pts, seg, { cx: cu, cz: cv, uRep: Math.round(R * 2.5), vTile: 0.6 }); }
  return y0 + h;
}

function domes(Q) {
  const P = Q.P, M = Q.M;
  FM.on(P, () => {
    // the octagonal collar 17.5 .. 27 under the central drum
    const R8 = 7.9 / Math.cos(Math.PI / 8), a0 = Math.PI / 8;
    frustum(P, M.churchPlain, AX.u, AX.v, 17.5, 26.2, 8, R8, R8 * 0.985, a0, 6, 6);
    frustum(P, M.churchRelief, AX.u, AX.v, 26.2, 27.0, 8, R8 + 0.35, R8 + 0.25, a0, 6, 1, { capTop: M.churchPlain });
    frustum(P, M.churchRelief, AX.u, AX.v, 21.0, 21.8, 8, R8 + 0.1, R8 + 0.1, a0, 6, 1);
    // the central drum 15 m, 18 arched windows
    tube(P, M.drumCentral, AX.u, AX.v, 27.0, 34.5, 7.5, 7.5, 54, 18, 1);
    const yTop = dome(P, M, AX.u, AX.v, 34.5, 7.3, 7.0);
    // gilded lantern ring, ball and the cross (foot at 42.0)
    revolve(P, M.gildBand, [[0.9, yTop - 0.25], [1.15, yTop - 0.1], [1.15, yTop + 0.2], [0.55, yTop + 0.35]], 14, { cx: AX.u, cz: AX.v, uRep: 6, vTile: 0.6 });
    ball(P, M.gild, AX.u, yTop + 0.55, AX.v, 0.55, 12);
    P.cyl(M.gild, [AX.u, yTop + 0.9, AX.v], [AX.u, yTop + 1.2, AX.v], 0.09, 0.09, 6, false);
    cross(P, M.gild, AX.u, yTop + 0.7, AX.v, 4.5, 0.6);
    // the four conch domes
    for (const k of Object.keys(CONCH)) {
      const c = CONCH[k], hDrum = c.y1 - c.y0;
      tube(P, M.drumConch, c.u, c.v, c.y0, c.y1, c.r, c.r, 32, 8, 1);
      const y = dome(P, M, c.u, c.v, c.y1, c.r - 0.2, 4.6, [[0.08, 0.13], [0.45, 0.485]], 32);
      ball(P, M.gild, c.u, y + 0.3, c.v, 0.32, 10); cross(P, M.gild, c.u, y + 0.5, c.v, 2.4, 0.6); void hDrum;
    }
    // the four small gilded chapel domes on windowed drums at the corners of the nave
    for (const [u, v] of CHAPELS) {
      tube(P, M.drumConch, u, v, 17.5, 20.1, 1.5, 1.5, 16, 4, 1);
      revolve(P, M.gildScale, ellipseDome(1.75, 2.2).map(([r, y]) => [r, 20.1 + y]), 16, { cx: u, cz: v, uRep: 5, vTile: 1 });
      ball(P, M.gild, u, 22.5, v, 0.2, 8); cross(P, M.gild, u, 22.6, v, 1.5, 0.6);
    }
  });
}

function tower(Q) {
  const P = Q.P, M = Q.M;
  FM.on(P, () => {
    const { u, v } = BELL;
    P.box(M.churchPlain, u - 3.5, u + 3.5, 7.0, 12.0, v - 3.5, v + 3.5, 'b', 4);                                 // the body
    P.box(M.churchRelief, u - 3.65, u + 3.65, 11.3, 12.0, v - 3.65, v + 3.65, '', 2);
    P.box(M.churchRelief, u - 3.6, u + 3.6, 8.8, 9.4, v - 3.6, v + 3.6, '', 2);
    for (let k = 0; k < 4; k++) { P.push(u, 0, v, k * Math.PI / 2); P.quad(M.belfry, [-1.0, 9.6, 3.52], [1.0, 9.6, 3.52], [1.0, 11.2, 3.52], [-1.0, 11.2, 3.52], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop(); }
    tube(P, M.belfry, u, v, 12.0, 15.5, 2.8, 2.8, 24, 6, 1);                                                    // the belfry drum with six open arches
    revolve(P, M.churchRelief, [[3.05, 15.5], [3.05, 15.9], [2.7, 15.9]], 24, { cx: u, cz: v, uRep: 6, vTile: 1 });
    revolve(P, M.gildScale, ellipseDome(2.85, 3.0).map(([r, y]) => [r, 15.9 + y]), 24, { cx: u, cz: v, uRep: 7, vTile: 1 });
    revolve(P, M.gild, [[0.9, 18.85], [0.5, 19.0], [0.5, 19.2]], 10, { cx: u, cz: v });
    onion(P, M.gild, u, 19.2, v, 0.6, 0.72, 14, 12);                                                              // the gold imperial crown (a squat onion on its neck)
    cross(P, M.gild, u, 20.8, v, 1.3, 0.6);
  });
}

// ------------------------------------------------------------------------------------------------ the temporary wooden church, the hoarding
function woodChurch(Q) {
  const P = Q.P, M = Q.M, b = L.buildingById('w634473943');
  if (!b || !b.polys || !b.polys[0]) return;
  const poly = b.polys[0], rc = rectFacing(rectOf(poly.o), -0.5, 0.8), hl = rc.len / 2, hw = rc.wid / 2;
  P.push(rc.cx, 0, rc.cz, rc.rotY);
  P.box(M.logs, -hl, hl, 0, 3.0, -hw, hw, 't', 3);
  gableRoof(P, M.metalTile, -hl, hl, -hw, hw, 3.0, 2.6, true, { oe: 0.5, og: 0.4, gable: M.logs, under: M.logs, uvs: 2 });
  P.box(M.logs, hl, hl + 1.6, 0, 2.6, -1.2, 1.2, '', 2); P.box(M.metalTile, hl - 0.1, hl + 1.9, 2.6, 2.8, -1.4, 1.4, '', 2);       // the porch
  P.col(M.logs, hl - 2.6, 0, 5.4, 6.2, 0.6, 0.6, 8, true);
  P.pop();
  const cx = rc.cx + Math.cos(-rc.rotY) * (hl - 2.6), cz = rc.cz + Math.sin(-rc.rotY) * (hl - 2.6);
  revolve(P, M.checker, [[0.0, 6.2], [0.5, 6.25], [0.62, 6.5], [0.7, 6.9], [0.55, 7.3], [0.3, 7.7], [0.08, 8.0]], 12, { cx, cz, uRep: 4, vTile: 1 });
  addPolyColliders(Q.ctx, poly, -0.3, 6.4, 0.9);
}

function hoarding(Q) {
  const P = Q.P, M = Q.M, cover = coverFn(Q.ctx);
  const A = [-5996.3, 538.0], B = [-5924.4, 497.1], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const rot = Math.atan2(-(B[1] - A[1]), B[0] - A[0]);
  if (cover(A[0], A[1]) > -0.3 || cover(B[0], B[1]) > -0.3) { /* the mapped line is 12.5 m from the road axis: kept */ }
  // n4spb (docs/AREAS.md 13.7): the 83 m hoarding is a row of breakable bays of about 3.4 m (the source: one drawn box + one plain 0.3 m x 2.4 m fence box); the two passport sheets belong to the bays they hang on
  const bays = splitBays(A[0], A[1], B[0], B[1], 3.4, { y: 0 }), bl = len / bays.length;
  const sheet = (s, w) => { const k = Math.min(bays.length - 1, Math.floor(s / bl)); let at = (s - k * bl) / bl; at = Math.min(at, (bl - w - 0.05) / bl); (bays[k].sheets ||= []).push({ at, w }); };
  sheet(len * 0.55, 1.0); sheet(len * 0.45, 0.5);
  const sheetPart = (w, y0, y1, tag) => ({ geo: unitPanel(y0, y1, { u1: 1 }), mat: M.passport, name: 'sheet' + tag, v: 0.07, sx: w, shadow: false, receive: false, noOutline: true,
    when: (b) => (b.sheets || []).some((q) => q.w === w), ats: (b) => (b.sheets || []).filter((q) => q.w === w).map((q) => q.at) });
  wallBays(Q, 'lmgavan-hoarding', bays, { h: 2.45, capH: 0.1, mat: M.hoarding, capMat: M.coping, thick: 0.12, capThick: 0.2, uvs: 1, capUvs: 1, tile: 3.4, solidH: 2.4, colThick: 0.3, mass: 500, anchored: 16, metal: false,
    extra: [sheetPart(1.0, 1.2, 1.9, '1'), sheetPart(0.5, 1.0, 1.7, '2')] });
  Q.svc.fences.push({ id: 'w634473865', pts: [A, B], gates: [], kind: 'hoarding' });
}
void THREE; void loft;
