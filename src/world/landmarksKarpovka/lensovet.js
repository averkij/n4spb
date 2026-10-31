// landmarksKarpovka/lensovet.js - the First Lensovet House (E. A. Levinson, I. I. Fomin, 1931-34; nab. reki Karpovki 13; OSM w50053711).  Dossier docs/research/karpovka.md section 3, photos
// refs/karpovka 30 33 34 35 36 37 (frontal, used for the measures) 31 39 43 48.
// The concave slab = an annular sector in the frame LS (frame.js): 32 bays of 2.75 m along the river arc (R 89.6 m), 14.5 m deep, six storeys: socle storey on the terrace (1.0 .. 4.2 m), the open
// gallery on thin round columns (4.2 .. 7.4), three storeys of small square windows, the top storey with tiny windows, a thin cornice slab at 20.2 m; four stacks of wide recessed loggias (bays 4-5,
// 11-12, 19-20, 26-27); the passage through the slab (bays 13-18, two pillars, three openings); the sharp prows whose end walls run parallel to the wings.  Two five-storey wings (17.7 m) on the OSM
// footprint; the stone terrace with lawns, blue spruces, benches, reliefs, the vase with the footballer, the fountain bowl; two outside stairs to the gallery (walkable: terrace, passage, gallery,
// stairs); the court: stone fence with gates on ul. Literatorov (OSM w261068501), the pavilion (w1109066990), pergola frames on the roofs.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, GREEN } from '../data/city.js';
import * as G from './geo.js';
import { LS, pairs, planFence, rotOf, wallBox } from './frame.js';
import { ringEdges } from './prism.js';
import { inflate, coverFn } from './surfaces.js';
import { plantTrees } from './trees.js';

const TAU = Math.PI * 2;
export const HL = { terr: 1.0, gal: 4.2, f3: 7.4, fl: 3.1, top0: 16.7, roof: 20.2, wing: 17.7 };
const GAL_D = 2.2, PASS0 = 13, PASS1 = 19, LOG = [4, 11, 19, 26];
// chord frame of the terrace: c along the chord from its middle (west -> east), d = depth away from the river
const MID = [-2170.85, -4018.55], TC = [0.9639, 0.2661], MC = [0.2661, -0.9639];
const chord = (c, d) => [MID[0] + TC[0] * c + MC[0] * d, MID[1] + TC[1] * c + MC[1] * d];
const toChord = (p) => [(p[0] - MID[0]) * TC[0] + (p[1] - MID[1]) * TC[1], (p[0] - MID[0]) * MC[0] + (p[1] - MID[1]) * MC[1]];
const CROT = Math.atan2(-TC[1], TC[0]);

/** run fn(len) in the frame of the facet between two world points seen from the side of `toward` ([x, z]): local +x runs left -> right, +z points to the viewer */
function facet(P, a, b, toward, fn) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  let nx = -dz / len, nz = dx / len;
  if (nx * (toward[0] - a[0]) + nz * (toward[1] - a[1]) < 0) { nx = -nx; nz = -nz; }
  const lx = nz, lz = -nx, o = (dx * lx + dz * lz) > 0 ? a : b;                   // local +x in the world; the left end
  P.push(o[0], 0, o[1], Math.atan2(nx, nz));
  try { return fn(len); } finally { P.pop(); }
}
const tile = (P, mat, u0, u1, y0, y1, nu, nv, z = 0) => P.quad(mat, [u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y1, z], [0, 0, 1], [[0, 0], [nu, 0], [nu, nv], [0, nv]]);

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKarpovka] lensovet/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('slab', () => slab(K));
  stage('wings', () => wings(K));
  stage('terrace', () => terrace(K));
  stage('stairs', () => stairs(K));
  stage('court', () => court(K));
  stage('colliders', () => colliders(K));
  const c = LS.arc((LS.A0 + LS.A1) / 2, LS.R + 7);
  K.svc.lensovet = { centre: c, top: HL.roof };
  K.svc.monuments.push({ id: 'w50053711', name: 'Первый жилой дом Ленсовета', x: c[0], z: c[1], h: HL.roof });
  if (errs.length) throw new Error(errs.join('\n'));
}

/** shift of the prow end walls along the facade per metre of depth (west: toward +u, east: toward -u) and the depth gained per metre along the wall */
function endShift() {
  const f = (E, am) => { const t = [-Math.sin(am), Math.cos(am)], n = [-Math.cos(am), -Math.sin(am)], du = E.dir[0] * t[0] + E.dir[1] * t[1], dn = -(E.dir[0] * n[0] + E.dir[1] * n[1]); return [Math.abs(du / dn), dn]; };
  const w = f(LS.westEnd, LS.ang(0.5)), e = f(LS.eastEnd, LS.ang(LS.N - 0.5));
  return [w[0], e[0], w[1], e[1]];
}

// ------------------------------------------------------------------------------------------------ the concave slab
function slab(K) {
  const P = K.P, M = K.M, R = LS.R, RB = R + LS.DEPTH, A = (i) => LS.ang(i);
  const isPass = (i) => i >= PASS0 && i < PASS1, isLog = (i) => LOG.includes(i) || LOG.includes(i - 1);
  const labels = K.ctx.services.labels;
  // the prow end walls are parallel to the wings, not radial: behind the facade the end bays are cut obliquely (shift of the wall along the facade per metre of depth)
  const [kW, kE] = endShift();
  // ---- river face
  for (let i = 0; i < LS.N; i++) {
    if (LOG.includes(i - 1)) continue;                                           // second bay of a loggia pair
    const nb = LOG.includes(i) ? 2 : 1, a = LS.arc(A(i)), b = LS.arc(A(i + nb));
    facet(P, a, b, LS.C, (w) => {
      // socle storey and the gallery (not in the passage)
      if (!isPass(i)) {
        tile(P, M.baySocle, 0, w, HL.terr, HL.gal - 0.25, nb, 1);
        const uL = i === 0 ? kW * GAL_D : 0, uR = i + nb === LS.N ? w - kE * GAL_D : w;
        if (uL === 0 && uR === w) P.box(M.concrete, 0, w, HL.gal - 0.25, HL.gal, -GAL_D, 0.1, 'k');
        else { P.box(M.concrete, 0, w, HL.gal - 0.25, HL.gal, 0, 0.1, 'kt'); P.quad(M.concrete, [0, HL.gal, 0.1], [w, HL.gal, 0.1], [uR, HL.gal, -GAL_D], [uL, HL.gal, -GAL_D], [0, 1, 0]); }
        tile(P, M.glaze, uL, uR, HL.gal, HL.f3, nb, 1, -GAL_D);
        P.quad(M.slabD, [0, HL.f3, 0], [w, HL.f3, 0], [uR, HL.f3, -GAL_D], [uL, HL.f3, -GAL_D], [0, -1, 0]);
        P.box(M.rail, 0, w, HL.gal + 1.0, HL.gal + 1.06, -0.06, 0, ''); P.box(M.rail, 0, w, HL.gal + 0.5, HL.gal + 0.54, -0.05, -0.01, '');
        if (i % 2 === 0) P.col(M.column, 0, -0.2, HL.gal - 0.25, HL.f3, 0.19, 0.19, 10, false); else P.box(M.rail, -0.02, 0.02, HL.gal, HL.gal + 1.06, -0.05, -0.01, 'b');
        if (nb === 2 && i % 2 === 1) P.col(M.column, w / 2, -0.2, HL.gal - 0.25, HL.f3, 0.19, 0.19, 10, false);
        if (i + nb === LS.N) P.col(M.column, w, -0.2, HL.gal - 0.25, HL.f3, 0.19, 0.19, 10, false);
      }
      // upper storeys
      if (nb === 1) {
        tile(P, M.bayWin, 0, w, HL.f3, HL.top0, 1, 3);
        tile(P, i % 3 === 1 ? M.bayTop : M.slab, 0, w, HL.top0, HL.roof, 1, 1);
      } else {
        for (let k = 0; k < 4; k++) {
          const y0 = HL.f3 + k * HL.fl, y1 = k === 3 ? HL.roof : y0 + HL.fl, a0 = y0 + 1.0, a1 = y0 + 2.9, p = 0.45, dz = 1.3;
          G.wall(P, M.slab, 0, w, y0, a0, 0, 2.75, 3.1); G.wall(P, M.slab, 0, w, a1, y1, 0, 2.75, 3.1); G.wall(P, M.slab, 0, p, a0, a1, 0, 2.75, 3.1); G.wall(P, M.slab, w - p, w, a0, a1, 0, 2.75, 3.1);
          G.pane(P, M.logBack, p, w - p, a0, a1, -dz);
          P.quad(M.slabD, [p, a0, 0], [p, a0, -dz], [p, a1, -dz], [p, a1, 0], [1, 0, 0]); P.quad(M.slabD, [w - p, a0, -dz], [w - p, a0, 0], [w - p, a1, 0], [w - p, a1, -dz], [-1, 0, 0]);
          P.quad(M.slabD, [p, a0, 0], [w - p, a0, 0], [w - p, a0, -dz], [p, a0, -dz], [0, 1, 0]); P.quad(M.slabD, [p, a1, -dz], [w - p, a1, -dz], [w - p, a1, 0], [p, a1, 0], [0, -1, 0]);
        }
      }
      P.box(M.concrete, -0.02, w + 0.02, HL.roof, HL.roof + 0.28, -0.4, 0.9, 'k');
      // the passage: side piers, pillars
      if (i === PASS0) P.box(M.slab, 0, 0.8, HL.terr, HL.f3, -0.9, 0, 'kb', 2.75);
      if (i === PASS1 - 1) P.box(M.slab, w - 0.8, w, HL.terr, HL.f3, -0.9, 0, 'kb', 2.75);
      if (i === PASS0 + 2 || i === PASS0 + 4) P.box(M.terraceL, -0.38, 0.38, HL.terr, HL.f3, -0.76, 0, 'b', 1);
      // the dark entrance block right of the passage and the memorial plaque left of it
      if (i === PASS1) { P.box(M.darkStone, 0.1, w - 0.1, HL.terr, HL.gal - 0.25, 0, 1.4, 'kb'); G.pane(P, M.entrance, 0.1, w - 0.1, HL.terr, HL.gal - 0.25, 1.42); }
      if (i === PASS0 - 2) {
        const pw = LS.arc(A(i) + LS.DA * 1.5), n = LS.nrm(A(i) + LS.DA);
        if (!labels || labels.reserve('w50053711', pw[0] + n[0] * 0.05, 2.6, pw[1] + n[1] * 0.05, 0.9, 0.6, n[0], n[1], 'plaque') !== false)
          G.pane(P, K.M.text('В этом доме с 1937 года по 1948 год жил\nнародный артист Союза ССР\nЮрий Михайлович ЮРЬЕВ', { bg: '#77726a', fg: '#2a2622', rim: '#4a4640', w: 384, h: 256 }), w * 0.75 - 0.45, w * 0.75 + 0.45, 2.3, 2.9, 0.035);
      }
    });
  }
  // ---- passage: soffit, floor, side walls, back pillars
  for (let i = PASS0; i < PASS1; i++) {
    const a = LS.arc(A(i)), b = LS.arc(A(i + 1)), c = LS.arc(A(i + 1), RB), d = LS.arc(A(i), RB), c2 = LS.arc(A(i + 1), RB - 2.95), d2 = LS.arc(A(i), RB - 2.95);
    P.quad(M.slabD, [a[0], HL.f3, a[1]], [b[0], HL.f3, b[1]], [c[0], HL.f3, c[1]], [d[0], HL.f3, d[1]], [0, -1, 0]);
    // the floor at terrace level; the steps down into the court lie 1.2 .. 3.0 m inside the passage (the asphalt of the court drive w261068500 reaches 0.6 m into it)
    P.quad(M.paversTop, [a[0], HL.terr + 0.01, a[1]], [b[0], HL.terr + 0.01, b[1]], [c2[0], HL.terr + 0.01, c2[1]], [d2[0], HL.terr + 0.01, d2[1]], [0, 1, 0], [[a[0] / 3, a[1] / 3], [b[0] / 3, b[1] / 3], [c2[0] / 3, c2[1] / 3], [d2[0] / 3, d2[1] / 3]]);
  }
  const mid = LS.arc((A(PASS0) + A(PASS1)) / 2, R + 7);
  for (const i of [PASS0, PASS1]) facet(P, LS.arc(A(i)), LS.arc(A(i), RB), mid, (w) => G.wall(P, M.slab, 0, w, 0, HL.f3, 0, 2.75, 3.1));
  for (const i of [PASS0 + 2, PASS0 + 4]) { const p = LS.arc(A(i), RB - 0.4); P.push(p[0], 0, p[1], -A(i)); P.box(M.terraceL, -0.38, 0.38, 0, HL.f3, -0.38, 0.38, 'b', 1); P.pop(); }
  // ---- court face (same bay grid, clipped at the wings)
  const far = LS.arc((LS.A0 + LS.A1) / 2, RB + 60);
  for (let i = 0; i < LS.N; i++) {
    const a0 = Math.max(A(i), LS.westEnd.back), a1 = Math.min(A(i + 1), LS.eastEnd.back); if (a1 - a0 < 0.004) continue;
    const fr = (a1 - a0) / LS.DA;
    facet(P, LS.arc(a0, RB), LS.arc(a1, RB), far, (w) => {
      if (!isPass(i)) { G.wall(P, M.terrace, 0, w, 0, HL.terr, 0, 1, 1); tile(P, M.baySocle, 0, w, HL.terr, HL.gal, fr, 1); tile(P, M.bayWin, 0, w, HL.gal, HL.f3, fr, 1); }
      tile(P, M.bayWin, 0, w, HL.f3, HL.top0, fr, 3); tile(P, i % 2 ? M.bayTop : M.slab, 0, w, HL.top0, HL.roof, fr, 1);
      P.box(M.concrete, -0.02, w + 0.02, HL.roof, HL.roof + 0.28, -0.3, 0.35, 'k');
    });
  }
  // ---- the prows: end walls parallel to the wings (the gallery opens in the first 2.2 m from the tip)
  for (const E of [LS.westEnd, LS.eastEnd]) {
    const tip = E.tip, back = [tip[0] + E.dir[0] * E.len, tip[1] + E.dir[1] * E.len], west = E === LS.westEnd;
    const out = [tip[0] + (west ? -30 : 30), tip[1] - 8];
    facet(P, tip, back, out, (w) => {
      // u = 0 at the left end seen from outside: for the west wall the left end is the back, for the east wall the tip
      const U = (s) => (west ? w - s : s), seg = (s0, s1, y0, y1, mat = M.slab) => G.wall(P, mat, Math.min(U(s0), U(s1)), Math.max(U(s0), U(s1)), y0, y1, 0, 2.75, 3.1);
      seg(0, GAL_D, HL.terr, HL.gal); seg(0, GAL_D, HL.f3, HL.roof); seg(GAL_D, E.open, HL.terr, HL.roof); seg(E.open, w, HL.wing, HL.roof);
      for (let k = 0; k < 4; k++) { const y = HL.f3 + k * HL.fl + 0.95; G.pane(P, M.logDecal, Math.min(U(0.5), U(3.3)), Math.max(U(0.5), U(3.3)), y, y + 1.7, 0.04, [[0, 0], [0.55, 0], [0.55, 1], [0, 1]]); }
      P.box(M.concrete, -0.3, w + 0.02, HL.roof, HL.roof + 0.28, -0.3, 0.5, 'k');
    });
  }
  // ---- roof
  const ring = [];
  for (let i = 0; i <= LS.N; i++) ring.push(LS.arc(A(i)));
  const nb = 26; for (let k = 0; k <= nb; k++) ring.push(LS.arc(LS.eastEnd.back + (LS.westEnd.back - LS.eastEnd.back) * k / nb, RB));
  P.cap(M.roofL, ring, HL.roof + 0.305, true, 4);
  K.slabRing = ring;
}

// ------------------------------------------------------------------------------------------------ the wings (OSM footprint)
function wings(K) {
  const P = K.P, M = K.M, V = LS.V, RB = LS.R + LS.DEPTH, labels = K.ctx.services.labels;
  const Wb = LS.arc(LS.westEnd.back, RB), Eb = LS.arc(LS.eastEnd.back, RB);
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3;
  const WINGS = [
    { key: 'west', ring: [V[22], V[23], V[0], V[1], V[2], Wb], skip: (e) => near(e.a, Wb) || near(e.b, Wb), river: [V[22], V[23]], street: [V[23], V[0]] },
    { key: 'east', ring: [V[12], Eb, V[9], V[10], V[11]], skip: (e) => near(e.a, V[12]) && near(e.b, Eb) || near(e.b, V[12]) && near(e.a, Eb), river: [V[11], V[12]], street: [V[10], V[11]] },
  ];
  const isEdge = (e, pq) => (near(e.a, pq[0]) && near(e.b, pq[1])) || (near(e.a, pq[1]) && near(e.b, pq[0]));
  for (const Wg of WINGS) {
    for (const e of ringEdges(Wg.ring, 0.3)) {
      if (Wg.skip(e)) continue;
      const river = isEdge(e, Wg.river), street = isEdge(e, Wg.street), east = Wg.key === 'east';
      G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
        const n = Math.max(1, Math.round(e.len / 2.75)), w = e.len / n, y0 = river ? HL.terr : 0;
        if (!river) G.wall(P, M.terrace, 0, e.len, 0, HL.terr, 0, 1, 1);
        for (let i = 0; i < n; i++) {
          const u0 = i * w, u1 = u0 + w;
          // the east wing's street face: ribbed shop base at the embankment corner, "ladders" of small staircase windows, portholes under the cornice
          const fromRiver = east && street ? i : -1;                                                // bay index counted from the embankment end (seen from pr. Medikov the left end of this face is the south one)
          const ladder = fromRiver >= 0 && (fromRiver === 5 || fromRiver === 11 || fromRiver === 16);
          if ((east && river) || (fromRiver >= 0 && fromRiver < 4)) G.wall(P, M.ribbed, u0, u1, y0, HL.gal, 0, 1, 1); else tile(P, M.baySocle, u0, u1, HL.terr, HL.gal, 1, 1);
          tile(P, ladder ? M.bayLadder : M.bayWin, u0, u1, HL.gal, HL.top0, 1, 4);
          tile(P, east && street ? M.porthole : M.slab, u0, u1, HL.top0, HL.wing, 1, east && street ? 1 : 0.32);
          // small stacked balconies on the street faces
          if (street && !ladder && i % 4 === 2) for (let k = 1; k < 4; k++) { const y = HL.gal + k * HL.fl + 0.75; P.box(M.concrete, u0 + 0.5, u1 - 0.5, y - 0.12, y, 0, 0.9, 'k'); P.box(M.concrete, u0 + 0.5, u1 - 0.5, y, y + 0.95, 0.82, 0.9, 'b'); P.box(M.concrete, u0 + 0.5, u0 + 0.58, y, y + 0.95, 0, 0.82, 'kb'); P.box(M.concrete, u1 - 0.58, u1 - 0.5, y, y + 0.95, 0, 0.82, 'kb'); }
        }
        // the end walls on the embankment: a wide corner loggia two storeys high at the outer corner
        if (river) { const lw = Math.min(7.4, e.len - 1.6), u0 = east ? 0.8 : e.len - 0.8 - lw; for (const k of [2, 3]) G.pane(P, M.logDecal, u0, u0 + lw, HL.gal + k * HL.fl + 0.9, HL.gal + k * HL.fl + 2.9, 0.04); }
        if (street && east) {
          const mx = e.o[0] + e.n[1] * 2.6 + e.n[0] * 0.05, mz = e.o[1] - e.n[0] * 2.6 + e.n[1] * 0.05;
          if (!labels || labels.reserve('w50053711', mx, 2.6, mz, 0.9, 0.6, e.n[0], e.n[1], 'plaque') !== false)
            G.pane(P, M.text('В этом доме с 1939 по 1949 год жил\nвыдающийся государственный деятель\nПётр Георгиевич ЛАЗУТИН', { bg: '#77726a', fg: '#2a2622', rim: '#4a4640', w: 384, h: 256 }), 2.15, 3.05, 2.3, 2.9, 0.035);
        }
        P.box(M.concrete, -0.02, e.len + 0.02, HL.wing, HL.wing + 0.25, -0.3, 0.45, 'k');
      });
    }
    P.cap(M.roofL, Wg.ring, HL.wing + 0.275, true, 4);
    K.wingRings = (K.wingRings || []).concat([Wg]);
  }
  // pergola frames (the solarium) along the court side of the wing roofs
  for (const [a, b] of [[V[1], V[2]], [Eb, V[9]]]) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), rot = rotOf(a, b), n = Math.max(2, Math.round(len / 3.2));
    P.push(a[0], 0, a[1], rot);
    for (let i = 0; i <= n; i++) { const u = i * len / n; P.box(M.concrete, u - 0.14, u + 0.14, HL.wing + 0.25, HL.wing + 2.1, -0.5, -0.22, 'b'); P.box(M.concrete, u - 0.14, u + 0.14, HL.wing + 0.25, HL.wing + 2.1, 0.22, 0.5, 'b'); }
    for (const z of [-0.36, 0.36]) P.box(M.concrete, 0, len, HL.wing + 2.1, HL.wing + 2.35, z - 0.16, z + 0.16, '');
    P.pop();
  }
  // three round balconies on the north-west corner of the west wing
  for (let k = 0; k < 3; k++) { const y = HL.f3 + k * HL.fl; G.tube(P, M.concrete, V[0][0], V[0][1], y - 0.15, y + 0.95, 1.5, 1.5, 14, 1, 1, { capTop: M.concrete, capBot: M.concrete }); }
}

// ------------------------------------------------------------------------------------------------ the terrace: retaining wall, lawns, steps, benches, reliefs, vase, fountain, spruces
/** depth of the terrace front (negative = toward the river) and of the house line at chord coordinate c */
const TFC = LS.TF.map(toChord);
function frontAt(c) { for (let i = 0; i + 1 < TFC.length; i++) { const a = TFC[i], b = TFC[i + 1]; if (c >= a[0] && c <= b[0]) return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); } return c < TFC[0][0] ? TFC[0][1] : TFC[TFC.length - 1][1]; }
function backAt(c) { const h = 42.27; if (Math.abs(c) <= h) return Math.sqrt(LS.R * LS.R - c * c) - (LS.R - 10.6); return c < 0 ? 5.45 + (c + 41.7) * (6.7 - 5.45) / (-51.07 + 41.7) : 6.4; }
const STEP0 = TFC[2][0] + 2.2, STEP1 = TFC[3][0] - 2.2;                            // the steps in the gap between the lawns

function terrace(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, V = LS.V, TF = LS.TF;
  // top: the paved terrace polygon (front line, east return, the house line, west return)
  const ring = [...TF, V[11], V[12]];
  for (let i = LS.N; i >= 0; i--) ring.push(LS.arc(LS.ang(i)));
  ring.push(V[22], V[23]);
  P.cap(M.paversTop, ring, HL.terr, true, 3);
  // lawns (OSM grass polygons, a paved border left free)
  for (const id of ['w187371636', 'w187371633']) { const g = GREEN.find((q) => q.id === id); if (!g) continue; for (const p of g.polys) { const r = inflate(pairs(p.o), -1.1); try { P.cap(M.lawn, r, HL.terr + 0.035, true, 6); } catch (e) { /* degenerate inset */ } } }
  // retaining wall with a coping; the steps in the middle
  const wallSeg = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.3) return;
    facet(P, a, b, [a[0] - MC[0] * 30, a[1] - MC[1] * 30], () => { G.wall(P, M.terrace, 0, len, 0, HL.terr, 0, 1, 1); P.box(M.terraceL, -0.05, len + 0.05, HL.terr, HL.terr + 0.22, -0.45, 0.08, 'b', 1); });
  };
  const s0 = chord(STEP0, frontAt(STEP0)), s1 = chord(STEP1, frontAt(STEP1));
  wallSeg(TF[0], TF[1]); wallSeg(TF[1], TF[2]); wallSeg(TF[2], s0); wallSeg(s1, TF[3]); wallSeg(TF[3], TF[4]); wallSeg(TF[4], TF[5]); wallSeg(TF[5], TF[6]);
  facet(P, TF[6], V[11], [TF[6][0] + 30, TF[6][1]], (len) => { G.wall(P, M.terrace, 0, len, 0, HL.terr, 0, 1, 1); P.box(M.terraceL, -0.05, len + 0.05, HL.terr, HL.terr + 0.22, -0.45, 0.08, 'b', 1); });
  facet(P, V[23], TF[0], [TF[0][0] - 30, TF[0][1]], (len) => { G.wall(P, M.terrace, 0, len, 0, HL.terr, 0, 1, 1); P.box(M.terraceL, -0.05, len + 0.05, HL.terr, HL.terr + 0.22, -0.45, 0.08, 'b', 1); });
  // steps (five risers) and their flank blocks with the reliefs (ears of rye, tank tracks)
  const sw = STEP1 - STEP0, sc = chord((STEP0 + STEP1) / 2, frontAt((STEP0 + STEP1) / 2));
  P.push(sc[0], 0, sc[1], CROT);                                                    // local +x = along the chord, +z = toward the river
  for (let k = 0; k < 5; k++) P.box(M.terraceL, -sw / 2, sw / 2, 0, HL.terr - (k + 1) * 0.2 + 0.2, k * 0.34, (k + 1) * 0.34, 'kb', 1);
  for (const s of [-1, 1]) {
    const x = s * (sw / 2 + 0.75);
    P.box(M.terrace, x - 0.75, x + 0.75, 0, HL.terr + 0.6, -1.0, 1.9, 'b', 1); P.box(M.terraceL, x - 0.85, x + 0.85, HL.terr + 0.6, HL.terr + 0.78, -1.1, 2.0, 'b', 1);
    G.pane(P, s < 0 ? M.reliefRye : M.reliefTank, x - 0.55, x + 0.55, 0.35, 1.45, 1.93);
  }
  P.pop();
  ph.addStairs(sc[0] - MC[0] * 0.85, sc[1] - MC[1] * 0.85, sw, 1.7, Math.atan2(MC[0], MC[1]), 0, HL.terr, 5);
  // stone benches on the paved border, the square vase with the footballer by the west stair, the fountain bowl in front of the passage
  for (const c of [-30, -18, 16, 28]) { const p = chord(c, frontAt(c) + 0.75); P.push(p[0], 0, p[1], CROT); P.box(M.terraceL, -1.1, 1.1, HL.terr + 0.38, HL.terr + 0.5, -0.28, 0.28, '', 1); P.box(M.terrace, -1.0, -0.7, HL.terr, HL.terr + 0.38, -0.22, 0.22, 'b', 1); P.box(M.terrace, 0.7, 1.0, HL.terr, HL.terr + 0.38, -0.22, 0.22, 'b', 1); P.pop(); }
  const vp = chord(-46.6, frontAt(-46.6) + 1.0);
  P.push(vp[0], 0, vp[1], CROT);
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) P.box(M.terrace, x - 0.18, x + 0.18, HL.terr, HL.terr + 0.3, z - 0.18, z + 0.18, 'b', 1);
  P.box(M.terraceL, -0.82, 0.82, HL.terr + 0.3, HL.terr + 0.5, -0.82, 0.82, '', 1); P.box(M.slabD, -0.72, 0.72, HL.terr + 0.5, HL.terr + 0.66, -0.72, 0.72, 'bt', 1);
  P.box(M.terrace, -0.78, 0.78, HL.terr + 0.66, HL.terr + 1.55, -0.78, 0.78, 'b', 1); P.box(M.terraceL, -0.95, 0.95, HL.terr + 1.55, HL.terr + 1.75, -0.95, 0.95, '', 1);
  G.pane(P, M.reliefFoot, 0.05, 0.75, HL.terr + 0.7, HL.terr + 1.5, 0.8);
  P.pop();
  ph.addBox(vp[0], vp[1], 1.7, 1.7, CROT, HL.terr, HL.terr + 1.8);
  const fp = [-2167.2, -4022.3];
  G.tube(P, M.terraceL, fp[0], fp[1], HL.terr, HL.terr + 0.5, 1.75, 1.55, 16, 6, 0.5, { capTop: M.terraceL }); G.tube(P, M.terrace, fp[0], fp[1], HL.terr + 0.2, HL.terr + 0.52, 1.3, 1.3, 16, 4, 0.3);
  P.cap(M.water, G.ngon(16, 1.3, 0, fp[0], fp[1]), HL.terr + 0.515, true, 2); P.col(M.terrace, fp[0], fp[1], HL.terr + 0.4, HL.terr + 0.9, 0.22, 0.16, 8, true);
  ph.addCylinder(fp[0], fp[1], 1.75, HL.terr, HL.terr + 0.9);
  // blue spruces on the lawns
  const trees = [];
  for (const [c, d, s, fam] of [[-33, 1.6, 1.05, 'spruceA'], [-24, 3.4, 0.9, 'spruceB'], [-13.5, 5.2, 1.15, 'spruceA'], [12.5, 5.6, 1.2, 'spruceA'], [17, 4.6, 1.1, 'spruceB'], [30, 1.2, 0.95, 'spruceA']]) {
    const p = chord(c, d); trees.push({ x: p[0], z: p[1], y: HL.terr + 0.03, fam, s, yaw: c });
  }
  plantTrees(K, trees, 'lmKarp-spruces');
  K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, r: 2, h: 9 })));
  // walk surfaces: the terrace in 4 m slices, the passage, the steps down into the court
  for (let c = -50; c < 54.8; c += 4) {
    const c1 = Math.min(c + 4, 54.8), cm = (c + c1) / 2, f = Math.min(frontAt(c), frontAt(c1), frontAt(cm)) - 0.06;
    const inPass = Math.abs(cm) < 7.6, b = inPass ? backAt(0) + LS.DEPTH - 2.9 : Math.min(backAt(c), backAt(c1), backAt(cm)) + 0.2;
    if ((cm > STEP0 - 0.5 && cm < STEP1 + 0.5) || b - f > 0.5) { const p = chord(cm, (f + b) / 2); ph.addWalkBox(p[0], p[1], c1 - c + 0.04, b - f, CROT, HL.terr); }
  }
  const bk = chord(0, backAt(0) + LS.DEPTH - 2.1);
  ph.addStairs(bk[0], bk[1], 18.4, 1.8, Math.atan2(-MC[0], -MC[1]), 0, HL.terr, 5);
  P.push(bk[0], 0, bk[1], CROT);
  for (let k = 0; k < 5; k++) P.box(M.terraceL, -9.1, 9.1, 0, (k + 1) * 0.2, -0.9 + k * 0.36, -0.9 + (k + 1) * 0.36, 'b', 1);
  P.pop();
  const ps = chord((STEP0 + STEP1) / 2, frontAt(0) - 6);
  if (!L.isOnRoad(ps[0], ps[1], 0.3) && !L.insideBuilding(ps[0], ps[1], 0.6)) K.svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: L.yawToward(ps[0], ps[1], MID[0] + MC[0] * 10, MID[1] + MC[1] * 10), pitch: 12, name: 'Первый жилой дом Ленсовета' });
  K.svc.entrances.push({ x: sc[0] - MC[0] * 3, z: sc[1] - MC[1] * 3, rotY: Math.atan2(-MC[0], -MC[1]), kind: 'passage', bldg: 'w50053711', name: 'Дом Ленсовета: проход во двор' });
}

// ------------------------------------------------------------------------------------------------ the two outside stairs to the gallery (landing along the prow, the flight along the wing's end wall)
function stairs(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, V = LS.V, LW = 1.7;
  for (const S of [{ tip: V[21], corner: V[22], far: V[23], run: 5.6 }, { tip: V[13], corner: V[12], far: V[11], run: 8.6 }]) {
    const e = [S.far[0] - S.corner[0], S.far[1] - S.corner[1]], el = Math.hypot(e[0], e[1]); e[0] /= el; e[1] /= el;                // along the wing's end wall, away from the prow
    const r = [S.tip[0] - S.corner[0], S.tip[1] - S.corner[1]], rl = Math.hypot(r[0], r[1]); r[0] /= rl; r[1] /= rl;                // toward the river (along the prow's end wall)
    const at = (a, b) => [S.corner[0] + e[0] * a + r[0] * b, S.corner[1] + e[1] * a + r[1] * b];
    const rotE = Math.atan2(-e[1], e[0]);                                                                                      // local +x = e; local +z = then either r or -r
    const zs = (Math.sin(rotE) * r[0] + Math.cos(rotE) * r[1]) > 0 ? 1 : -1;                                                     // sign of r along local +z
    P.push(S.corner[0], 0, S.corner[1], rotE);
    const Z = (b0, b1) => [Math.min(zs * b0, zs * b1), Math.max(zs * b0, zs * b1)];
    // landing along the prow (a = 0..LW, b = 0..rl): slab, outer parapet, the end parapet at the tip side is open to the gallery
    let [z0, z1] = Z(0, rl);
    P.box(M.concrete, 0.02, LW, HL.gal - 0.25, HL.gal, z0, z1, '', 2); { const [q0, q1] = Z(LW, rl); P.box(M.concrete, LW - 0.16, LW, HL.gal, HL.gal + 1.05, q0, q1, 'b', 2); }
    [z0, z1] = Z(rl - 0.16, rl); P.box(M.concrete, 0.02, LW, HL.gal, HL.gal + 1.05, z0, z1, 'b', 2);
    for (const b of [0.4, rl - 0.4]) { const [p0, p1] = Z(b - 0.15, b + 0.15); P.box(M.concrete, LW - 0.5, LW - 0.2, HL.terr, HL.gal - 0.25, p0, p1, 'bt', 2); }
    // the flight: a = LW .. LW + run, b = 0 .. LW, from the gallery level down to the terrace; a solid block with a parapet on the river side
    const n = 16, run = S.run;
    for (let k = 0; k < n; k++) { const a0 = LW + k * run / n, y = HL.gal - (k + 1) * (HL.gal - HL.terr) / n; [z0, z1] = Z(0.02, LW - 0.16); P.box(M.concrete, a0, a0 + run / n, HL.terr, y + (HL.gal - HL.terr) / n, z0, z1, 'b', 2); }
    [z0, z1] = Z(LW - 0.16, LW);
    const zo = zs > 0 ? z1 : z0, zi = zs > 0 ? z0 : z1;
    for (const [z, nz] of [[zo, zs], [zi, -zs]]) P.quad(M.concrete, [LW, HL.terr, z], [LW + run, HL.terr, z], [LW + run, HL.terr + 1.05, z], [LW, HL.gal + 1.05, z], [0, 0, nz], [[0, 0], [run / 2, 0], [run / 2, 0.5], [0, 2.1]]);
    P.quad(M.concrete, [LW, HL.gal + 1.05, zi], [LW + run, HL.terr + 1.05, zi], [LW + run, HL.terr + 1.05, zo], [LW, HL.gal + 1.05, zo], [0.4, 0.9, 0]);
    P.quad(M.concrete, [LW + run, HL.terr, zi], [LW + run, HL.terr, zo], [LW + run, HL.terr + 1.05, zo], [LW + run, HL.terr + 1.05, zi], [1, 0, 0]);
    P.pop();
    // physics: landing, flight, parapets
    const lc = at(LW / 2, rl / 2), sc = at(LW + run / 2, LW / 2 - 0.08);
    ph.addWalkBox(lc[0], lc[1], LW, rl, rotE, HL.gal, HL.gal - 0.3);
    ph.addStairs(sc[0], sc[1], LW - 0.2, run, Math.atan2(-e[0], -e[1]), HL.terr, HL.gal, n);
    wallBox(ph, at(LW, LW), at(LW, rl), HL.gal, HL.gal + 1.1, 0.2); wallBox(ph, at(0, rl), at(LW, rl), HL.gal, HL.gal + 1.1, 0.2);
    wallBox(ph, at(LW, LW - 0.08), at(LW + run, LW - 0.08), HL.terr, HL.gal + 1.1, 0.2);
  }
}

// ------------------------------------------------------------------------------------------------ the court: fence on ul. Literatorov, the pavilion
function court(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, cover = coverFn(ctx);
  const fence = BARRIERS.find((b) => b.id === 'w261068501');
  if (fence) {
    const pts = pairs(fence.pts), plan = planFence(pts, 4.2, [{ x: -2125.5, z: -4069.7, half: 2.3 }, { x: -2185.5, z: -4076.2, half: 2.3 }], 0.25);
    for (const q of plan.panels) {
      const mx = (q.a.x + q.b.x) / 2, mz = (q.a.z + q.b.z) / 2; if (cover(mx, mz) > -0.5) continue;
      P.push(q.a.x, 0, q.a.z, q.rot);
      P.box(M.terrace, 0, q.len, 0, 0.4, -0.22, 0.22, 'b', 1);
      for (const [z, nz] of [[0.16, 1], [-0.16, -1]]) P.quad(M.yardWall, [0, 0.4, z], [q.len, 0.4, z], [q.len, 2.0, z], [0, 2.0, z], [0, 0, nz], [[0, 0.1], [q.len / 2, 0.1], [q.len / 2, 0.9], [0, 0.9]]);
      P.box(M.terraceL, -0.02, q.len + 0.02, 2.0, 2.14, -0.24, 0.24, 'b', 1);
      P.pop();
      ph.addBox(mx, mz, q.len, 0.4, q.rot, 0, 2.2);
    }
    for (const p of plan.posts) { if (cover(p.x, p.z) > -0.5) continue; P.push(p.x, 0, p.z, p.rot); P.box(M.terrace, -0.3, 0.3, 0, p.gate ? 2.6 : 2.25, -0.3, 0.3, 'b', 1); P.box(M.terraceL, -0.36, 0.36, p.gate ? 2.6 : 2.25, p.gate ? 2.78 : 2.4, -0.36, 0.36, '', 1); P.pop(); ph.addBox(p.x, p.z, 0.6, 0.6, p.rot, 0, 2.6); }
    K.svc.fences.push({ id: 'w261068501', pts, h: 2.1, kind: 'stone', gates: plan.opens });
  }
  const pav = L.buildingById('w1109066990');
  if (pav) {
    const ring = pairs(pav.polys[0].o);
    for (const e of ringEdges(ring, 0.3)) G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
      G.wall(P, M.terrace, 0, e.len, 0, 0.5, 0, 1, 1); P.quad(M.pavilion, [0, 0.5, 0], [e.len, 0.5, 0], [e.len, 4.2, 0], [0, 4.2, 0], [0, 0, 1]);
      if (e.len > 8) for (let u = 2.2; u < e.len - 1.5; u += 3.4) { P.box(M.concrete, u - 0.9, u + 0.9, 1.15, 3.35, 0, 0.06, 'kb'); G.pane(P, M.glassDark, u - 0.75, u + 0.75, 1.3, 3.2, 0.07); }
      P.box(M.concrete, -0.03, e.len + 0.03, 4.2, 4.5, -0.2, 0.35, 'k');
    });
    P.cap(M.roofL, ring, 4.525, true, 4);
    for (const e of ringEdges(ring, 0.3)) wallBox(ph, e.a, e.b, 0, 4.5, 0.5);
  }
}

// ------------------------------------------------------------------------------------------------ colliders (the gallery, the passage and the mouths of the gallery at the prows stay open)
function colliders(K) {
  const ph = K.ctx.physics, R = LS.R, RB = R + LS.DEPTH, A = (i) => LS.ang(i), TOP = HL.roof + 1;
  const isPass = (i) => i >= PASS0 && i < PASS1, sh = endShift(), GB = GAL_D + 0.2;
  const endPt = (E, dn) => [E.tip[0] + E.dir[0] * GB / dn, E.tip[1] + E.dir[1] * GB / dn];
  for (let i = 0; i < LS.N; i += 1) {
    const a = LS.arc(A(i)), b = LS.arc(A(i + 1));
    if (isPass(i)) wallBox(ph, a, b, HL.f3, TOP);
    else { wallBox(ph, a, b, 0, HL.gal + 1.15, 0.4); wallBox(ph, a, b, HL.f3, TOP); wallBox(ph, i === 0 ? endPt(LS.westEnd, sh[2]) : LS.arc(A(i), R + GB), i === LS.N - 1 ? endPt(LS.eastEnd, sh[3]) : LS.arc(A(i + 1), R + GB), HL.gal, TOP); }
    // gallery floor
    if (!isPass(i)) { const m = LS.arc(A(i) + LS.DA / 2, R + GAL_D / 2 + 0.05), am = A(i) + LS.DA / 2; ph.addWalkBox(m[0], m[1], LS.bayW + 0.12, GAL_D, Math.atan2(-Math.cos(am), -Math.sin(am)), HL.gal, HL.gal - 0.3); }
    const a0 = Math.max(A(i), LS.westEnd.back), a1 = Math.min(A(i + 1), LS.eastEnd.back);
    if (a1 - a0 > 0.004) wallBox(ph, LS.arc(a0, RB), LS.arc(a1, RB), isPass(i) ? HL.f3 : 0, TOP);
  }
  for (const i of [PASS0, PASS1]) { wallBox(ph, LS.arc(A(i)), LS.arc(A(i), RB), 0, TOP, 0.6); wallBox(ph, LS.arc(A(i), R + 0.1), LS.arc(A(i), R + GAL_D), HL.gal, HL.f3, 0.3); }
  for (const i of [PASS0 + 2, PASS0 + 4]) for (const r of [R + 0.4, RB - 0.4]) { const p = LS.arc(A(i), r); ph.addCylinder(p[0], p[1], 0.5, 0, HL.f3); }
  for (const E of [LS.westEnd, LS.eastEnd]) {
    const at = (s) => [E.tip[0] + E.dir[0] * s, E.tip[1] + E.dir[1] * s];
    wallBox(ph, at(0), at(GAL_D), 0, HL.gal - 0.05); wallBox(ph, at(0), at(GAL_D), HL.f3, TOP); wallBox(ph, at(GAL_D), at(E.len), 0, TOP);
  }
  for (const Wg of K.wingRings || []) for (const e of ringEdges(Wg.ring, 0.3)) if (!Wg.skip(e)) wallBox(ph, e.a, e.b, 0, HL.wing + 1, 0.6);
}
