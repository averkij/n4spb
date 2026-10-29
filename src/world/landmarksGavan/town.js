// landmarksGavan/town.js - the GAVAN WORKERS' TOWN (Гаванский рабочий городок, 1904-06, N. V. Dmitriev / V. A. Fedorov for D. A. Dril's "Товарищество борьбы с жилищной нуждой"; Gavanskaya 47 / Maly pr. 69-71; frame W)
// (docs/research/gavan.md section 8; photos refs/gavan 62-98).  FIVE five-storey slabs on their baked footprints: A, B, V (east-west, 49.8 x 11.5 m + a west end pavilion 9.2 x 16 m) and G, D (north-south, 38.8 x 12.7 m with two
// 15.8 m pavilions), eaves 18.0 m, ridges 21-21.6 m.
//   FACADE   rusticated grey ground floor 4.5 m (small high windows), then four storeys of 3.375 m: red-brick piers + pale plaster panels with a white-framed window in bays of 3.1 m (textures townGF / townUp, one quad per
//            wall piece), the eaves on wooden brackets over every pier, steep GREEN roofs, FOUR pointed street gables on each long face of A / B / V (ridge 3.6 m over the eaves, dark boarded tympanum, bargeboards, an apex
//            post) with a stack of three small iron balconies (turquoise bases) under each gable axis; the east end wall of A is the MURAL ("Вода - это жизнь"); entrance doors with a stoop at the mapped staircase nodes.
//   ANNEXES / CLUB WING / PLAQUE / FENCE are in townAnnex.js.  Closed to enter, the passages and courtyards are open (colliders = the footprint rings only).
import * as L from '../layout.js';
import { FW } from './frame.js';
import { ringEdges, onEdge, localOnEdge } from './kit.js';
import { gableRoof, hipRoof, bar } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';
import { coverFn } from './surfaces.js';
import { buildAnnex } from './townAnnex.js';

export const PITCH = 3.1, EAVE = 18.0, GF = 4.5, STOREY = 3.375;
/** the five slabs: baked id, long axis, plan rectangles of the main body and the pavilions (frame W: u east, v south), street-gable axes (frame W coordinates along the long axis) */
export const SLABS = [
  { key: 'A', id: 'w17564513', axis: 'u', gables: [43.9, 56.3, 68.7, 81.1], main: [38.9, 88.7, -8.3, 3.15], pav: [[29.7, 38.9, -10.4, 5.6]], mural: true },
  { key: 'B', id: 'w17564532', axis: 'u', gables: [44.2, 56.6, 69.0, 81.4], main: [39.5, 86.2, -44.4, -33.0], pav: [[30.2, 39.5, -46.4, -30.5]] },
  { key: 'V', id: 'w17564539', axis: 'u', gables: [44.2, 56.6, 69.0, 81.4], main: [39.4, 85.5, -80.2, -68.8], pav: [[30.2, 39.4, -82.3, -66.3]] },
  { key: 'G', id: 'w17564584', axis: 'v', gables: [-23.0, -13.9, -4.8], main: [6.0, 18.7, -27.7, 0.1], pav: [[4.5, 20.4, -33.2, -26.4], [4.4, 20.2, -0.8, 5.6]] },
  { key: 'D', id: 'w17564575', axis: 'v', gables: [-72.0, -62.8, -53.6], main: [6.0, 18.6, -76.7, -48.8], pav: [[4.4, 20.2, -82.2, -75.4], [4.2, 20.1, -49.9, -43.4]] },
];
/** OSM entrance=staircase nodes (frame W): doors on the courtyard faces */
const DOORS = [[40.7, -8.3], [53.6, -8.3], [67.6, -8.3], [81.4, -8.3], [64.9, -44.4], [78.8, -44.4], [48.7, -32.9], [63.8, -68.8], [77.1, -68.8], [48.7, -68.7], [18.8, -24.4], [18.7, -2.7], [18.4, -51.6], [18.7, -73.4]];

const faceOf = (e) => { const nu = e.n[0] * FW.U[0] + e.n[1] * FW.U[1], nv = e.n[0] * FW.V[0] + e.n[1] * FW.V[1]; return Math.abs(nu) > Math.abs(nv) ? (nu > 0 ? 'E' : 'W') : (nv > 0 ? 'S' : 'N'); };

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] town/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  for (const s of SLABS) stage('slab-' + s.key, () => slab(Q, s));
  stage('annex', () => buildAnnex(Q));
  const c = FW.W(55, -40);
  Q.svc.monuments.push({ id: 'w17564513', name: 'Гаванский рабочий городок', x: c.x, z: c.z, h: 21.6 });
  Q.svc.photoSpots.push({ x: -6372, z: -590, yaw: -55, pitch: 8, name: 'Гаванский городок: зелёные щипцы' }, { x: -6200, z: -640, yaw: 92, pitch: 6, name: 'Гаванский городок: мурал' }, { x: -6284.5, z: -650.7, yaw: 98, pitch: 3, name: 'Двор Гаванского городка' });         // review: the old spot (-6290, -654, yaw 0) stared at a blank wall 6 m away; this one looks west along the yard A-B
  Q.svc.crowd.push({ id: 'courtyard-AB', kind: 'stand', x: -6284.5, z: -650.7, r: 10, n: 4 }, { id: 'mural-view', kind: 'photo', x: -6200, z: -640, r: 5, n: 3 });
  if (errs.length) throw new Error(errs.join('\n'));
}

function slab(Q, s) {
  const P = Q.P, M = Q.M, b = L.buildingById(s.id);
  if (!b || !b.polys || !b.polys[0]) throw new Error('missing footprint ' + s.id);
  const poly = b.polys[0], edges = ringEdges(poly);
  for (const e of edges) { if (e.len < 0.6) continue; wallPiece(Q, s, e); }
  // roofs in the frame W: the main gable roof along the long axis, hip roofs over the pavilions
  FW.on(P, () => {
    const [u0, u1, v0, v1] = s.main, alongU = s.axis === 'u';
    const half = (alongU ? v1 - v0 : u1 - u0) / 2;
    gableRoof(P, M.roofGreen, u0, u1, v0, v1, EAVE, 3.0, alongU, { oe: 0.9, og: 0.12, under: M.townPlaster, gable: s.mural ? null : M.townBrick, uvs: 2.4 });
    if (s.mural) { P.fan(M.townBrick, [[u0, EAVE, v0], [u0, EAVE, v1], [u0, EAVE + 3.0, (v0 + v1) / 2]], [-1, 0, 0], (p) => [p[2] / 3, p[1] / 3]); }
    for (const [a0, a1, c0, c1] of s.pav) hipRoof(P, M.roofGreen, a0, a1, c0, c1, EAVE, 3.0, { oe: 0.9, under: M.townPlaster });
    // two brick chimney stacks on the main ridge
    for (const f of [0.28, 0.72]) { const x = alongU ? u0 + (u1 - u0) * f : (u0 + u1) / 2, z = alongU ? (v0 + v1) / 2 : v0 + (v1 - v0) * f; P.box(M.chimneyBrick, x - 0.5, x + 0.5, EAVE + 1.2, EAVE + 5.6, z - 0.5, z + 0.5, 'b', 1); P.box(M.coping, x - 0.6, x + 0.6, EAVE + 5.6, EAVE + 5.75, z - 0.6, z + 0.6, 'b', 1); }
    void half;
  });
  addPolyColliders(Q.ctx, poly, -0.3, 23, 0.9);
}

/** one footprint edge: ground floor + upper floors, eaves brackets, gables with balconies, doors, the mural end wall */
function wallPiece(Q, s, e) {
  const P = Q.P, M = Q.M, face = faceOf(e), len = e.len, cover = coverFn(Q.ctx);
  const longFace = len > 20 && (s.axis === 'u' ? (face === 'S' || face === 'N') : (face === 'E' || face === 'W'));
  const endWall = s.axis === 'u' && face === 'E' && len > 10 && len < 13;
  onEdge(P, e, () => {
    if (endWall) {                                                                                   // the east end wall: the mural (A) or plain brick (B, V)
      if (s.mural) {
        const H = EAVE + 3.0;
        P.fan(M.mural, [[0, 0, 0.02], [len, 0, 0.02], [len, EAVE, 0.02], [len / 2, H, 0.02], [0, EAVE, 0.02]], [0, 0, 1], (p) => [p[0] / len, p[1] / H]);
        P.box(M.stoop, 0, len, 0, 0.5, 0, 0.1, 'b', 2);
      } else {
        P.quad(M.townBrick, [0, 0, 0], [len, 0, 0], [len, EAVE, 0], [0, EAVE, 0], [0, 0, 1], [[0, 0], [len / 2.4, 0], [len / 2.4, EAVE / 2.4], [0, EAVE / 2.4]]);
      }
      return;
    }
    if (len < 3.2) { P.quad(M.townBrick, [0, 0, 0], [len, 0, 0], [len, EAVE, 0], [0, EAVE, 0], [0, 0, 1], [[0, 0], [len / 2.4, 0], [len / 2.4, EAVE / 2.4], [0, EAVE / 2.4]]); return; }
    const n = Math.max(1, Math.round(len / PITCH)), pitch = len / n;
    P.quad(M.townGF, [0, 0, 0], [len, 0, 0], [len, GF, 0], [0, GF, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
    P.quad(M.townUp, [0, GF, 0], [len, GF, 0], [len, EAVE, 0], [0, EAVE, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 4], [0, 4]]);
    P.box(M.coping, 0, len, GF - 0.06, GF + 0.06, 0, 0.1, 'bk', 2);                                  // the band between the rusticated ground floor and the brick
    // the eaves: a fascia under the roof edge and wooden brackets over every pier
    P.box(M.townPlaster, -0.05, len + 0.05, EAVE - 0.5, EAVE - 0.2, 0, 0.25, 'b', 2);
    for (let i = 0; i <= n; i++) P.box(M.bracket, i * pitch - 0.1, i * pitch + 0.1, EAVE - 1.25, EAVE - 0.35, 0, 0.62, 'b', 1);
    // entrance doors at the mapped staircase nodes of this face
    for (const [du, dv] of DOORS) {
      const w = FW.W(du, dv), q = localOnEdge(e, w.x, w.z);
      if (Math.abs(q.d) > 0.8 || q.u < 1.0 || q.u > len - 1.0) continue;
      const x = Math.round((q.u / pitch) - 0.5) * pitch + pitch / 2;
      P.quad(M.townDoor, [x - 0.7, 1.0, 0.05], [x + 0.7, 1.0, 0.05], [x + 0.7, 3.3, 0.05], [x - 0.7, 3.3, 0.05], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const out = [w.x + e.n[0] * 0.9, w.z + e.n[1] * 0.9];
      if (cover(out[0], out[1]) > -0.4) continue;                                                      // a service drive runs along this wall: no stoop or canopy on the asphalt
      for (let k = 0; k < 3; k++) P.box(M.stoop, x - 1.0, x + 1.0, 0, 0.9 - 0.3 * k, 0.1, 0.1 + 0.3 * (k + 1), 'b', 1);
      P.box(M.iron, x - 1.0, x + 1.0, 3.45, 3.52, 0.0, 1.0, 'b', 1);
    }
    if (!longFace) return;
    // street gables with their balconies, snapped to the bay axes
    for (const gp of s.gables) {
      const vf = FW.M(e.a[0], e.a[1]), uf = vf.u, vv = vf.v;
      const w = s.axis === 'u' ? FW.W(gp, vv) : FW.W(uf, gp), q = localOnEdge(e, w.x, w.z);
      if (q.u < 4 || q.u > len - 4) continue;
      const x = (Math.round(q.u / pitch - 0.5) + 0.5) * pitch, hw = 3.1, z0 = 0.25, yr = EAVE + 3.6;
      // the tympanum: a boarded triangle in front of the wall, bargeboards along the rake, the apex post
      P.fan(M.gableBoards, [[x - hw, EAVE, z0], [x + hw, EAVE, z0], [x, yr, z0]], [0, 0, 1], (p) => [p[0] / 2.5, p[1] / 2.5]);
      bar(P, M.bracket, [x - hw - 0.06, EAVE - 0.05, z0 + 0.05], [x, yr + 0.05, z0 + 0.05], 0.075, 4); bar(P, M.bracket, [x + hw + 0.06, EAVE - 0.05, z0 + 0.05], [x, yr + 0.05, z0 + 0.05], 0.075, 4);
      P.cyl(M.bracket, [x, yr, z0 + 0.05], [x, yr + 0.9, z0 + 0.05], 0.07, 0.03, 4, true);
      for (const sx of [-1, 1]) for (const dx of [0.5, 1.4, 2.3]) { const xx = x + sx * dx, hh = 0.6 + (2.9 - dx) * 0.55; P.box(M.bracket, xx - 0.05, xx + 0.05, EAVE + 0.1, EAVE + hh, z0, z0 + 0.08, 'b', 1); }   // the fretwork pendants
      // the two roof planes of the cross gable (triangles meeting the main roof at z = 3.55)
      const zb = -3.3, yb = EAVE + 0.526 * -zb;
      for (const sx of [-1, 1]) {
        const F = [x + sx * hw, EAVE, z0], Rf = [x, yr, z0], Rb = [x, yb, zb], B = [x + sx * hw, yb, zb];
        P.fan(M.roofGreen, [F, Rf, Rb], [sx * 0.7, 0.7, 0.3], (p) => [p[0] / 2.4, p[2] / 2.4]); P.fan(M.roofGreen, [F, Rb, B], [sx * 0.7, 0.7, 0.3], (p) => [p[0] / 2.4, p[2] / 2.4]);
      }
      // three stacked iron balconies on this axis (floors 2-4): turquoise slab, black rail
      for (let k = 1; k <= 3; k++) {
        const y = GF + STOREY * k + 0.05;
        P.box(M.balcony, x - 0.85, x + 0.85, y, y + 0.14, 0.0, 0.9, 'b', 1);
        P.box(M.iron, x - 0.85, x + 0.85, y + 0.96, y + 1.0, 0.86, 0.9, 'b', 1);
        for (const dx of [-0.83, 0, 0.83]) P.box(M.iron, x + dx - 0.02, x + dx + 0.02, y + 0.14, y + 0.96, 0.86, 0.9, 'b', 1);
        for (const sx of [-1, 1]) { P.box(M.iron, x + sx * 0.85 - 0.02, x + sx * 0.85 + 0.02, y + 0.96, y + 1.0, 0.0, 0.9, 'b', 1); P.box(M.iron, x + sx * 0.85 - 0.02, x + sx * 0.85 + 0.02, y + 0.14, y + 1.0, 0.86, 0.9, 'b', 1); }
      }
    }
  });
}
