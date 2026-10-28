// landmarksNavalCorps/stair.js - the heritage STAIR TO THE NEVA in front of the Naval Cadet Corps (OSM relation r15853955 = steps w628627388 / w628627390 and the walls around; "Пристань" 1870, listed with
// the Krusenstern monument), landmark-owned like landmarksStrelka/descent.js (docs/research/navalcorps.md 5.2, photos refs/navalcorps b10 b03 b08 a07 g_stair q_w q_e d01).
// Frame K: the stair is 22.2 m wide (u 55.4 .. 77.6) and 8 m deep (v 39.4 .. 47.4).  From the street (y 0) five treads of 0.65 m drop 0.30 m each, then the LANDING of big slabs at -1.8 (v 42.65 .. 44.6, the
// sixth riser), then a lower flight of four treads of 0.70 m (risers 0.35 m) to the wet bottom step at -3.2 (the Neva is -3.4).  In the middle stands the TUMBA, a 3.7 x 3.65 m granite block (u 64.7 .. 68.4,
// v 39.35 .. 43.0, top +0.15) carrying the pedestal; its river face drops to the landing.  The two END BLOCKS (the stair "wings") join the quay parapet: west u 53.2 .. 55.4 (top 1.06), east u 77.6 .. 81.2 (top 2.1,
// the rounded outer corner of radius 1.2 m at its river end).  MODES: `sunk` (the water ring of groups.js is honoured: layout.inRiver at the stair) draws all of this; otherwise a FLAT fallback (a granite
// deck at street level with the tumba and the blocks) so nobody falls in.  Colliders: walk boxes for every tread and the landing (sticky), solid tumba and blocks, a barrier at the bottom step.
import * as L from '../layout.js';
import { K, STAIR } from './frame.js';
import { coverFn, fillPolyClipped } from './surfaces.js';

export const Y_LAND = -1.8, Y_BOT = -3.2;
const UP = [0.65, 0.3, 5], LO = 0.7, RISE_LO = 0.35;

export function build(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, { u0, u1, v0, v1 } = STAIR;
  const probe = (u, v) => { const w = K.W(u, v); return L.inRiver(w.x, w.z); };
  const sunk = probe(60, 43) && probe(72, 43) && probe(60, 46) && probe(72, 46);
  Q.svc.stair = { sunk };
  paveTerrace(Q);
  const T = STAIR.tumba, [tu0, tu1, tv0, tv1] = T;
  const yT = 0.15;
  P.push(K.x, 0, K.z, K.rot);
  try {
    const ash = (a, b, c, d, n, tuA, tvA, tuB, tvB) => P.quad(M.ashlar, a, b, c, d, n, [[tuA / 3.6, tvA / 2.2], [tuB / 3.6, tvA / 2.2], [tuB / 3.6, tvB / 2.2], [tuA / 3.6, tvB / 2.2]]);
    const slab = (a, b, c, d, n) => P.quad(M.stairGranite, a, b, c, d, n, [[a[0] / 2, a[2] / 2], [b[0] / 2, b[2] / 2], [c[0] / 2, c[2] / 2], [d[0] / 2, d[2] / 2]]);
    // ---------------------------------------------------------------------------------------- the TUMBA (both modes)
    const yb = sunk ? Y_LAND : 0.0;
    ash([tu0, yb, tv1], [tu1, yb, tv1], [tu1, yT, tv1], [tu0, yT, tv1], [0, 0, 1], tu0, yb, tu1, yT);                           // the river face down to the landing
    ash([tu0, yb, tv0], [tu0, yb, tv1], [tu0, yT, tv1], [tu0, yT, tv0], [-1, 0, 0], tv0, yb, tv1, yT);                          // west face
    ash([tu1, yb, tv1], [tu1, yb, tv0], [tu1, yT, tv0], [tu1, yT, tv1], [1, 0, 0], tv1, yb, tv0, yT);                           // east face
    ash([tu1, yb, tv0], [tu0, yb, tv0], [tu0, yT, tv0], [tu1, yT, tv0], [0, 0, -1], tu0, 0, tu1, yT);                           // street side (only 0.15 m above the pavement)
    P.quad(M.blockTop, [tu0, yT, tv1], [tu1, yT, tv1], [tu1, yT, tv0], [tu0, yT, tv0], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.blockTop, tu0 - 0.04, tu1 + 0.04, yT - 0.05, yT, tv0 - 0.04, tv1 + 0.04, 'b', 1);                                    // the thin plinth moulding at the top (+0.1 m on three sides)
    ph.addBox(K.W((tu0 + tu1) / 2, (tv0 + tv1) / 2).x, K.W((tu0 + tu1) / 2, (tv0 + tv1) / 2).z, tu1 - tu0, tv1 - tv0, K.rot, -3, 1.4);
    if (!sunk) {
      // FLAT fallback: the stair mouth as a granite deck at street level; nothing to walk down
      P.quad(M.stairGranite, [u0, 0.04, v0], [u1, 0.04, v0], [u1, 0.04, v1], [u0, 0.04, v1], [0, 1, 0], [[u0 / 2, v0 / 2], [u1 / 2, v0 / 2], [u1 / 2, v1 / 2], [u0 / 2, v1 / 2]]);
      Q.svc.stair.top = 0.04;
      endBlocks(Q, false);
      return;
    }
    // ---------------------------------------------------------------------------------------- the flights
    const flight = (ua, ub, dir) => {
      let v = v0, y = 0;
      for (let k = 1; k <= UP[2]; k++) {                                                                                         // upper treads
        const yk = -UP[1] * k;
        P.quad(M.stairRiser, [ua, y, v], [ub, y, v], [ub, yk, v], [ua, yk, v], [0, 0, 1], [[0, 0], [(ub - ua) / 2, 0], [(ub - ua) / 2, 0.15], [0, 0.15]]);
        slab([ua, yk, v], [ub, yk, v], [ub, yk, v + UP[0]], [ua, yk, v + UP[0]], [0, 1, 0]);
        walk(ua, ub, v, v + UP[0], yk);
        y = yk; v += UP[0];
      }
      void dir;
    };
    const walk = (ua, ub, va, vb, top) => { const c = K.W((ua + ub) / 2, (va + vb) / 2), it = ph.addWalkBox(c.x, c.z, ub - ua + 0.04, vb - va + 0.06, K.rot, top, -5); if (it) it.sticky = true; };
    flight(u0, tu0, -1); flight(tu1, u1, 1);
    const vLand0 = v0 + UP[0] * UP[2];                                                                                          // 42.65
    const vLand1 = 44.6;
    // the sixth riser (to the landing) in front of both upper flights, and the landing itself across the full width (the tumba stands on it)
    for (const [ua, ub] of [[u0, tu0], [tu1, u1]]) P.quad(M.stairRiser, [ua, -UP[1] * UP[2], vLand0], [ub, -UP[1] * UP[2], vLand0], [ub, Y_LAND, vLand0], [ua, Y_LAND, vLand0], [0, 0, 1], [[0, 0], [(ub - ua) / 2, 0], [(ub - ua) / 2, 0.15], [0, 0.15]]);
    slab([u0, Y_LAND, vLand0], [u1, Y_LAND, vLand0], [u1, Y_LAND, vLand1], [u0, Y_LAND, vLand1], [0, 1, 0]);
    walk(u0, u1, vLand0 - 0.05, vLand1, Y_LAND);
    // the lower flight across the full width: four treads of 0.70 m, risers 0.35 m, bottom step at -3.2
    let v = vLand1, y = Y_LAND;
    for (let k = 1; k <= 4; k++) {
      const yk = Y_LAND - RISE_LO * k;
      P.quad(M.stairRiser, [u0, y, v], [u1, y, v], [u1, yk, v], [u0, yk, v], [0, 0, 1], [[0, 0], [(u1 - u0) / 2, 0], [(u1 - u0) / 2, 0.17], [0, 0.17]]);
      slab([u0, yk, v], [u1, yk, v], [u1, yk, v + LO], [u0, yk, v + LO], [0, 1, 0]);
      walk(u0, u1, v - 0.03, v + LO, yk);
      y = yk; v += LO;
    }
    // the front of the bottom step goes down into the water (a wet skirt under the water line closes every crack to the quay wall)
    P.quad(M.ashlar, [u0, -3.7, v1], [u1, -3.7, v1], [u1, Y_BOT, v1], [u0, Y_BOT, v1], [0, 0, 1], [[0, 0], [6, 0], [6, 0.2], [0, 0.2]]);
    // the tumba has its own solid foot below the landing (the landing slab carries it: nothing to draw)
    // (n4spb, docs/AREAS.md 13.7 / docs/vo-m2.md: the source's invisible guard along the bottom step, "nobody steps off the bottom step into the river", is GONE: water is reachable, the walker steps off the last tread into the Neva)
    // the cheek walls of the stair: the inner faces of the end blocks from the water up to the block tops (the steps butt against them)
    endBlocks(Q, true);
    Q.svc.stair.top = 0;
    Q.svc.stair.landing = { u: (u0 + u1) / 2, v: (vLand0 + vLand1) / 2, y: Y_LAND };
  } finally { P.pop(); }
}

/** the two end blocks ("wings") of the stair; sunk = the inner faces go down to the water */
function endBlocks(Q, sunk) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, { u0, u1, v0, v1 } = STAIR;
  const yb = sunk ? -3.7 : 0, VB = v1 + 0.05;
  const face = (mat, a, b, ya, yh, n, tw) => P.quad(mat, [a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yh, b[1]], [a[0], yh, a[1]], n, [[0, ya / 2.2], [tw / 3.6, ya / 2.2], [tw / 3.6, yh / 2.2], [0, yh / 2.2]]);
  // west block: u 53.2 .. 55.4, top 1.06 (a hair above the quay parapet so the two never z-fight)
  { const ua = 53.2, ub = u0, yh = 1.06, nIn = [1, 0, 0];
    P.quad(M.blockTop, [ua, yh, VB], [ub, yh, VB], [ub, yh, v0], [ua, yh, v0], [0, 1, 0], [[0, 0], [1, 0], [1, 3], [0, 3]]);
    face(M.ashlar, [ua, VB], [ub, VB], yb, yh, [0, 0, 1], ub - ua);                                       // river face
    face(M.ashlar, [ub, v0], [ua, v0], 0, yh, [0, 0, -1], ub - ua);                                        // street end
    face(M.ashlar, [ua, v0], [ua, VB], 0, yh, [-1, 0, 0], VB - v0);                                        // outer side (above the walk)
    face(M.ashlar, [ub, VB], [ub, v0], yb, yh, nIn, VB - v0);                                              // inner face above the steps
    const c = K.W((ua + ub) / 2, (v0 + VB) / 2); ph.addBox(c.x, c.z, ub - ua, VB - v0, K.rot, -4, 1.7); }
  // east block: u 77.6 .. 81.2, top 2.1, the river end rounded (radius 1.2 m)
  { const ua = u1, ub = 81.2, yh = 2.1, r = 1.2, pts = [[ua, v0], [ub, v0], [ub, VB - r]];
    for (let i = 1; i <= 5; i++) { const a = Math.PI / 2 * i / 5; pts.push([ub - r + r * Math.cos(a), VB - r + r * Math.sin(a)]); }
    pts.push([ua, VB]);
    P.cap(M.blockTop, pts, yh, true, 3);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.01) continue;
      const n = [dz / l, 0, -dx / l];                                                                      // outward for the polygon order (ccw seen from +y with z south: checked by the quad winding rule)
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const out = (mid[0] - (ua + ub) / 2) * n[0] + (mid[1] - (v0 + VB) / 2) * n[2] > 0 ? n : [-n[0], 0, -n[2]];
      if (a[0] === ua && b[0] === ua) { const y0 = sunk ? yb : 0; face(M.ashlar, a, b, y0, yh, out, l); continue; }     // the inner face above the steps
      face(M.ashlar, a, b, a[1] > VB - r - 0.01 || b[1] > VB - r - 0.01 ? yb : 0, yh, out, l);
    }
    // the thin plinth band under the top
    P.box(M.blockTop, ua - 0.04, ub + 0.04, yh - 0.35, yh - 0.25, v0 - 0.04, VB - r, 'bt', 1);
    const c = K.W((ua + ub) / 2, (v0 + VB) / 2); ph.addBox(c.x, c.z, ub - ua, VB - v0, K.rot, -4, 2.2); }
}

/** the pinkish paved terrace u 51 .. 81, v 28 .. 39.4 in front of the stair (the lawns stop at u 51 and u 81), clipped at the real asphalt; world coordinates (called with no frame pushed) */
function paveTerrace(Q) {
  const cover = coverFn(Q.ctx), ring = [[51, 28], [81, 28], [81, 39.4], [51, 39.4]].map(([u, v]) => { const w = K.W(u, v); return [w.x, w.z]; });
  const n = fillPolyClipped(Q.P, Q.M.terrace, ring, 0.045, cover, { tile: 3, maxEdge: 3, margin: 0.3 });
  Q.svc.terrace = { triangles: n };
}
