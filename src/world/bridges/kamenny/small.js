// bridges/kamenny/small.js - the small canal / pond bridges of Kamenny Island (the numbered "Kamennoostrovsky" bridges 2 - 20 of the Tikhy Otdykh park and the Bolshoy / Maly canals + two service bridges), data
// in kamenny/spec.js SMALL.  Photos refs/bridges-kamenny 29 - 40 (14th: white steel railing with curl brackets on a flat steel beam with rose granite ramps; the Bolshoy canal bridges: flat reinforced-concrete
// beam on rows of square piles, rope-loop ochre railing, black pole lamps with a curved arm; the 20th / 19th: a low concrete slab with a gold-ochre looped railing; the 6th: black ring-medallion railing).
// One builder: a flat deck of surface strips at +0.05 (continuous with the approach streets; the ways are claimed so streets does not draw them), a concrete slab edge, a pile row under the long ones,
// cast / welded railing panels (instanced), end posts, park lamps at the corners of the road bridges, a walk ramp + side boxes + lamp cylinders as colliders.  The frame origin is the centre of the OSM
// deck polygon, +u along the way, +v right of travel.  NO flags.
import * as THREE from 'three';
import { frameOf, toUV, toWorld, frameBounds } from '../sites.js';
import { lampPark } from './pieces.js';
import { bankU } from '../long.js';
import { closeBankFollow as closeBank } from './wing.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SURF = { asphalt: ['asphalt', 0], pave: ['footAsphalt', 0.12], cobble: ['sett', 0.12], concrete: ['concreteKam', 0.12], flags: ['pave', 0.12], strip: ['pave', 0.12] };

export function buildSmall(env, sp, K) {
  sp={...sp,len:Math.max(9,sp.len)}; // Authored span over the navigable canal neck.
  const { ctx, P, M, rails } = env, f = frameOf(sp), T = f.T;
  const HU = sp.len / 2, Y0 = 0.05, world = (u, v) => toWorld(sp, u, v);
  const vmin = Math.min(...sp.strips.map((s) => s[0])), vmax = Math.max(...sp.strips.map((s) => s[1])), HW = Math.max(-vmin, vmax);
  const B = { id: sp.id, x: f.cx, z: f.cz, yDeck: () => Y0, info: { rails: 0, colliders: 0, tris: 0 }, masts: [] };
  B.crossing={ax:f.c,az:f.s,w:vmax-vmin,len:2*HU};
  B.at = world(0, vmax - 0.6);
  B.bounds = frameBounds(sp, -HU - 0.4, HU + 0.4, vmin - 0.4, vmax + 0.4, 1.5);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return q.u >= -HU - 0.3 && q.u <= HU + 0.3 && q.v >= vmin - 0.3 && q.v <= vmax + 0.3 ? Y0 : null; };
  const slab = K.concreteKam, edge = K.slabEdge, TH = 0.55;
  P.push(f.cx, 0, f.cz, -T);
  // ---- the strips of the deck: surface quads at their own level, a kerb face where two neighbours differ
  const sorted = sp.strips.slice().sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < sorted.length; i++) {
    const [v0, v1, kind] = sorted[i], [mk, off] = SURF[kind] || SURF.asphalt, mat = K[mk] || M[mk], y = Y0 + off;
    P.quad(mat, [-HU, y, v0], [HU, y, v0], [HU, y, v1], [-HU, y, v1], [0, 1, 0], [[-HU / 2.4, v0 / 2.4], [HU / 2.4, v0 / 2.4], [HU / 2.4, v1 / 2.4], [-HU / 2.4, v1 / 2.4]]);
    const nb = sorted[i + 1];
    if (nb) { const yn = Y0 + (SURF[nb[2]] || SURF.asphalt)[1]; if (Math.abs(yn - y) > 0.01) { const lo = Math.min(y, yn), hi = Math.max(y, yn), up = yn > y ? -1 : 1; P.quad(M.kerb, [-HU, lo, v1], [HU, lo, v1], [HU, hi, v1], [-HU, hi, v1], [0, 0, up]); } }
  }
  // ---- slab edge and soffit, end walls (the slab is thicker at its ends: the abutment)
  for (const sg of [-1, 1]) { const v = sg > 0 ? vmax + 0.12 : vmin - 0.12; P.quad(edge, [-HU, Y0 - TH, v], [HU, Y0 - TH, v], [HU, Y0 + 0.12, v], [-HU, Y0 + 0.12, v], [0, 0, sg], [[-HU / 2, 0], [HU / 2, 0], [HU / 2, 0.7], [-HU / 2, 0.7]]); P.quad(edge, [-HU, Y0 + 0.12, v], [HU, Y0 + 0.12, v], [HU, Y0 + 0.12, sg > 0 ? vmax : vmin], [-HU, Y0 + 0.12, sg > 0 ? vmax : vmin], [0, 1, 0]); }
  P.quad(slab, [-HU, Y0 - TH, vmin - 0.12], [HU, Y0 - TH, vmin - 0.12], [HU, Y0 - TH, vmax + 0.12], [-HU, Y0 - TH, vmax + 0.12], [0, -1, 0]);
  for (const su of [-1, 1]) P.quad(slab, [su * HU, Y0 - TH, vmin - 0.12], [su * HU, Y0 - TH, vmax + 0.12], [su * HU, Y0 - 1.6, vmax + 0.12], [su * HU, Y0 - 1.6, vmin - 0.12], [-su, 0, 0]);
  // ---- a row of square piles on a cap beam under the long bridges (photos 30 33 36 38)
  // Short canal spans carry their supports beside the navigable opening.
  const rows = (sp.piers || []).flatMap(u=>Math.abs(u)<3.5?[-4,4]:[u]);
  for (const pu of rows) {
    const n = Math.max(3, Math.round((vmax - vmin) / 1.9)), sx = (vmax - vmin - 0.8) / (n - 1);
    P.box(slab, pu - 0.35, pu + 0.35, Y0 - TH - 0.3, Y0 - TH, vmin + 0.2, vmax - 0.2, 'b', 1.2);
    for (let k = 0; k < n; k++) { const v = vmin + 0.4 + k * sx; P.box(slab, pu - 0.2, pu + 0.2, -3.2, Y0 - TH - 0.3, v - 0.2, v + 0.2, 'tb', 1.2); }
  }
  // ---- railing: instanced panels along both sides between the end posts
  const rv = (sg) => (sg > 0 ? vmax : vmin) - sg * 0.14, ironMat = ctx.mat.toon(sp.rail.hex, { paint: 0.03, name: 'brg-' + sp.id + '-rail' });
  const bays = Math.max(1, Math.round(2 * HU / (sp.rail.bay || 2.0))), bw = 2 * HU / bays;
  for (const sg of [-1, 1]) {
    const v = rv(sg);
    for (let i = 0; i < bays; i++) { const ua = -HU + bw * i, w = world(ua + 0.03, v); rails.add({ kind: sp.rail.kind, hex: sp.rail.hex, x: w.x, y: Y0 + (sp.rail.lift || 0.12), z: w.z, rotY: -T, roll: 0, len: bw - 0.06 }); B.info.rails++; }
    for (let i = 0; i <= bays; i++) { const u = -HU + bw * i; P.box(ironMat, u - 0.07, u + 0.07, Y0 + 0.12, Y0 + 1.18, v - 0.07, v + 0.07, 'b', 1); if (i === 0 || i === bays) P.geo(ironMat, new THREE.SphereGeometry(1, 6, 4), u, Y0 + 1.24, v, 0, 0, 0, 0.1, 0.1, 0.1); }
  }
  // ---- park lamps at the corners of the road bridges
  const lamps = [];
  if (sp.lamps) for (const [su, sg] of sp.lamps) { const lu = su * (HU + 0.8), v = sg * (HW - 0.7), r = lampPark(P, K, lu, Y0, v, -sg); lamps.push({ u: lu, v }); B.masts.push({ ...world(lu, v), y: Y0, h: r.h, kind: 'park' }); }
  // ---- wing walls where a water bank meets a deck corner: the environment opens its quay in the bridge zone, so a corner that touches a water edge (the 14th bridge at the Krestovka mouth, any canal
  //      that arrives later) would let a walker step off beside the railing (environment-banks.mjs zone walk).  The wing follows the real bank line out of the corner (pink granite, parapet 1 m), only
  //      where bankU finds a bank within 9 m of the deck end AND the bank lies in a bridge zone.
  const wings = [], L = ctx.L, zs = [], yb = (env.waterY ?? -0.9) - 0.3;
  if (zs.length) for (const [uu, dir] of [[-HU, 1], [HU, -1]]) for (const sg of [-1, 1]) {
    const hs = (sg > 0 ? vmax : -vmin) + 0.15; let last = -1, g = uu;
    for (let k = 0; k <= 28; k++) { const v = sg * (hs + k * 0.5), ub = bankU(L, sp, v, g, dir); if (ub === null) break; g = ub; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 3.2))) last = k; }
    if (last < 0) continue;
    const len = Math.min(14, Math.max(2.4, (last + 1) * 0.5 + 1.0));
    wings.push({ u: uu, dir, sg, len, hs });
    closeBank({ site: sp, P, M, L, u: uu, dir, sg, v0: hs, len, yTop: Y0, yb, mat: M.granitePink, parapet: M.parapetPink, collide: false });
  }
  B.info.wings = wings.map((w) => w.len);
  P.pop();
  B.info.tris = P.tris;
  B.colliders = () => {
    for (const w of wings) B.info.colliders += closeBank({ site: sp, L, ph: ctx.physics, u: w.u, dir: w.dir, sg: w.sg, v0: w.hs - 0.3, len: w.len, yTop: Y0, draw: false });
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), w = world(0, (vmin + vmax) / 2);
    ph.addWalkRamp(w.x, w.z, vmax - vmin + 0.2, sp.len + 0.6, rampRot, Y0, Y0, 2.5); B.info.colliders++;
    for (const sg of [-1, 1]) { const c = world(0, rv(sg)); ph.addBox(c.x, c.z, sp.len + 0.1, 0.28, -T, -3, Y0 + 1.25); B.info.colliders++; }
    for (const q of lamps) { const c = world(q.u, q.v); ph.addCylinder(c.x, c.z, 0.16, -0.5, 5); B.info.colliders++; }
  };
  return B;
}
