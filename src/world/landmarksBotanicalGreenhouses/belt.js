// landmarksBotanicalGreenhouses/belt.js - the belt of the two greenhouse squares (dossier 4.1a house table, aerial F1, photo 36): 18 lean-to houses (court side glass roof and glass wall, a 6.8 m cream
// stucco back wall with two rows of tall windows and a white cornice towards the park), the stock houses and the glass links, the 3-storey stucco block of house 12 with its red-brick tower, the
// stucco walls along houses 10-11 and 13-14, the two 2-storey pavilions of the passage 8-21 (Overpass r13561126 / 127: heritage "Переход между оранжереями № 8 и № 21", 1913), the sheds,
// and the decorated "Sherlock Holmes door" n9346535790.   [?] which outer faces are glass and which are stucco is not verified by any photo (dossier open question 2): the park-side faces are stucco.
// Back directions (u+ ENE, v+ SSE of the 20.8 deg frame) are chosen from the plot of the 36 OSM parts: the glass slope always falls towards a court.
import * as L from '../layout.js';
import { ringOfPoly, rectOf, outNormals, inset, len2, wallTiles, wallFlat, tileQuad, loftRing, capRing, bar, EU, EV, rectRing } from './geo.js';
import { ringEdges, band } from './kit.js';
import { leanTo, gable } from './house.js';

const neg = (v) => [-v[0], -v[1]];
const DIR = { 'u+': EU, 'u-': neg(EU), 'v+': EV, 'v-': neg(EV) };

// [id, back, hb, eave]
const LEAN = [
  ['r13561145', 'u+', 6.8, 3.0], ['r13561144', 'v-', 6.8, 3.0], ['r13561143', 'v-', 6.8, 3.0], ['r13561142', 'v-', 6.8, 3.0], ['r13561141', 'v-', 6.8, 3.0], ['r13561140', 'u-', 6.8, 3.0],
  ['r13561133', 'u-', 6.8, 3.0], ['r13561134', 'v+', 6.8, 3.0], ['r13561135', 'v+', 6.8, 3.0], ['r13561138', 'v+', 6.8, 3.0], ['r13561137', 'v+', 6.8, 3.0], ['r13561148', 'u+', 6.8, 3.0],
  ['r13561124', 'v-', 6.0, 2.8], ['r13561125', 'v-', 6.0, 2.8], ['r13561129', 'v-', 6.4, 2.8], ['r13561130', 'v-', 8.4, 3.0],
];
const GABLE = [['r13561132', 2.6, 5.4], ['w28692711', 2.6, 5.4], ['r13561131', 2.6, 5.4], ['r13561128', 3.4, 5.6], ['r20398367', 2.6, 3.8]];

const ringOf = (id) => { const r = ringOfPoly(L.buildingById(id)); if (!r) console.warn('[landmarksBotanicalGreenhouses] footprint missing:', id); return r; };

/** walls of a stucco block on its real ring: stone plinth, window bays (rows of 3.0 m), a white cornice */
function blockWalls(K, ring, h, o = {}) {
  const { P, M } = K, N = outNormals(ring), n = ring.length, pl = o.plinth ?? 0.8;
  for (let i = 0; i < n; i++) {
    const A = ring[i], B = ring[(i + 1) % n], l = len2(A, B);
    if (l < 0.15) continue;
    wallFlat(P, M.stone, A, B, 0, pl, pl, N[i]);
    if (l >= 2.4 && !o.plain) { const rows = Math.max(1, Math.round((h - pl) / 3.0)); wallTiles(P, o.mat || M.win, A, B, pl, h, h, o.tw ?? 3.0, (h - pl) / rows, N[i]); }
    else wallFlat(P, M.cream, A, B, pl, h, h, N[i]);
  }
  const edges = ringEdges({ o: ring.flat(), h: [] });
  band(K.P, edges, pl - 0.02, pl + 0.1, 0.06, { front: M.stone, top: M.stone });
  band(K.P, edges, h - 0.5, h, 0.28, { front: M.white, top: M.white, under: M.white });
  if (!o.plain) { const rows = Math.max(1, Math.round((h - pl) / 3.0)); for (let rw = 1; rw < rows; rw++) band(K.P, edges, pl + (h - pl) * rw / rows - 0.1, pl + (h - pl) * rw / rows + 0.1, 0.07, { front: M.white2, top: M.white2 }); }
}
/** a flat tin roof with a low parapet lip */
function flatRoof(K, ring, h) { K.P.cap(K.M.tinFlat, ring, h + 0.04, true, 4); }
/** a hipped tin roof of a rectangle ring: eave h, rise r over the inset d */
function hipRoof(K, ring, h, rise, d) {
  const { P, M } = K;
  loftRing(P, M.tin, inset(ring, -0.32), h - 0.06, inset(ring, d), h + rise, 2.4, 2.4);
  capRing(P, M.tinFlat, inset(ring, d), h + rise);
}
/** a gable roof of tin over the oriented rectangle (ridge along the long axis), eave y, ridge y, overhang of 0.3 m */
function gableTin(K, r, eave, ridge) {
  const { P, M } = K, a = r.ay, b = r.ax, ha = r.hy + 0.3, hl = r.hx + 0.25;
  const pt = (s, t) => [r.c[0] + a[0] * s + b[0] * t, r.c[1] + a[1] * s + b[1] * t];
  const q = (s, t, y) => [pt(s, t)[0], y, pt(s, t)[1]];
  tileQuad(P, M.tin, q(-ha, -hl, eave - 0.18), q(-ha, hl, eave - 0.18), q(0, hl, ridge), q(0, -hl, ridge), 2.4, 2.4, [0, 1, 0]);
  tileQuad(P, M.tin, q(ha, hl, eave - 0.18), q(ha, -hl, eave - 0.18), q(0, -hl, ridge), q(0, hl, ridge), 2.4, 2.4, [0, 1, 0]);
  for (const s of [-1, 1]) { const A = pt(-r.hy, s * r.hx), B = pt(r.hy, s * r.hx), Mi = pt(0, s * r.hx); P.fan(M.cream, [[A[0], eave, A[1]], [B[0], eave, B[1]], [Mi[0], ridge - 0.1, Mi[1]]], [b[0] * s, 0, b[1] * s]); }
  bar(K.D, M.iron, q(0, -hl, ridge + 0.04), q(0, hl, ridge + 0.04), 0.07);
}

export function build(K) {
  const { P, D, M, svc } = K;
  // ---- the lean-to houses and the gable houses (rectangles of the OSM rings)
  for (const [id, back, hb, eave] of LEAN) { const ring = ringOf(id); if (ring) leanTo(K, rectOf(ring), { back: DIR[back], hb, eave }); }
  for (const [id, eave, ridge] of GABLE) { const ring = ringOf(id); if (ring) gable(K, rectOf(ring), { eave, ridge }); }

  // ---- house 12: the 3-storey stucco block (r13572223) with a tin gable roof and the red-brick tower (r13572224)
  { const ring = ringOf('r13572223');
    if (ring) { blockWalls(K, ring, 10.2); gableTin(K, rectOf(ring), 10.2, 12.6); } }
  { const ring = ringOf('r13572224');
    if (ring) { blockWalls(K, ring, 15.6, { mat: M.brickWin, plinth: 0.9 }); hipRoof(K, ring, 15.6, 2.0, 3.6); } }
  // ---- stucco walls along houses 10-11 and 13-14 (2 levels), a roof piece, the passage pavilions, the museum wings, the sheds
  for (const id of ['r13572222', 'r13561122']) { const ring = ringOf(id); if (ring) { blockWalls(K, ring, 6.8); flatRoof(K, ring, 6.8); } }
  { const ring = ringOf('r13561123'); if (ring) { blockWalls(K, ring, 2.4, { plain: true, plinth: 0.4 }); flatRoof(K, ring, 2.4); } }
  for (const id of ['r13561126', 'r13561127']) { const ring = ringOf(id); if (ring) { blockWalls(K, ring, 6.8); hipRoof(K, ring, 6.8, 2.4, 4.4); } }
  for (const id of ['r13561493', 'r13561494']) { const ring = ringOf(id); if (ring) { blockWalls(K, ring, 6.8); flatRoof(K, ring, 6.8); } }
  for (const [id, h] of [['w141816501', 4.2], ['w881416378', 2.6], ['w881416379', 2.8], ['w413439428', 3.6]]) { const ring = ringOf(id); if (ring) { blockWalls(K, ring, h, { plain: h < 3, plinth: 0.35 }); flatRoof(K, ring, h); } }
  sherlockDoor(K);
  boilerStack(K);
  svc.courts = { north: { c: [-1576, -4283], bbox: [-1670, -1480, -4347, -4219] }, south: { c: [-1546, -4215], bbox: [-1642, -1455, -4271, -4158] } };
}

// ---------------------------------------------------------------------------------------------- the "Sherlock Holmes door" (OSM n9346535790 at -1641, -4193)
function sherlockDoor(K) {
  const { P, M, svc } = K;
  const ring = ringOf('r13561127'); if (!ring) return;
  const N = outNormals(ring), at = [-1641, -4193];
  let best = 0, bd = 1e9;
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], l = len2(a, b), t = Math.max(0, Math.min(1, ((at[0] - a[0]) * (b[0] - a[0]) + (at[1] - a[1]) * (b[1] - a[1])) / (l * l))), d = Math.hypot(a[0] + (b[0] - a[0]) * t - at[0], a[1] + (b[1] - a[1]) * t - at[1]); if (d < bd) { bd = d; best = i; } }
  const a = ring[best], b = ring[(best + 1) % ring.length], l = len2(a, b), n = N[best];
  const t = Math.max(0.2, Math.min(0.8, ((at[0] - a[0]) * (b[0] - a[0]) + (at[1] - a[1]) * (b[1] - a[1])) / (l * l))), cx = a[0] + (b[0] - a[0]) * t, cz = a[1] + (b[1] - a[1]) * t;
  P.push(cx, 0, cz, Math.atan2(n[0], n[1]));
  P.box(M.white2, -0.78, 0.78, 0, 2.55, 0, 0.12, 'bk');                                    // the pale surround (a low relief frame)
  P.box(M.wood, -0.55, 0.55, 0, 2.2, 0.0, 0.18, 'bk');                                      // the door leaf
  P.box(M.iron, 0.34, 0.4, 0.95, 1.1, 0.18, 0.24);                                         // the handle plate
  P.pop();
  svc.sherlock = { x: cx, z: cz };
}

// ---------------------------------------------------------------------------------------------- the boiler stack of the south court (OSM chimney node n4147574681; the pale stack right of the Palm House in the aerial F1)
function boilerStack(K) {
  const { P, M, ctx } = K, x = -1537.4, z = -4189.9;
  P.box(M.stone, x - 1.6, x + 1.6, 0, 1.6, z - 1.6, z + 1.6);                                  // the foot
  P.col(M.stoneGrey, x, z, 1.6, 33.0, 1.0, 0.62, 12, false);                                    // the tapering shaft, a plain pale-grey stack (the aerial reads ~3x the Palm House shoulder)
  P.col(M.stoneDark, x, z, 29.5, 31.0, 0.66, 0.66, 12, false);                                  // a darker band under the head
  P.col(M.stoneDark, x, z, 33.0, 33.4, 0.72, 0.72, 12, true);                                   // the cap
  if (ctx.physics) ctx.physics.addCylinder(x, z, 1.0, 0, 33.4);
}
