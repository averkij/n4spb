// landmarksMakarova/brullov.js - the BRULLOV (SUZOR) HOUSE, Kadetskaya liniya 21 (A. Bryullov 1845; heritage; restored 2025-26, repainted pale yellow; OSM r1257269; docs/research/makarova.md section 4.1; photos r18 r19 r20 h32 h33).
// Frame B (frame.js): origin = the SSE corner of the Kadetskaya-line front, u along the 22.1 m front toward NNW, v into the building; the front faces local -Z (WSW).  The street house is the front block v 0 .. 12.6 m;
// the rest of the 943 m2 outline is the court wings along Tuchkov per. (plain walls with window rows, a court hole 8.8 x 14 m).
//   FRONT (7 axes at u 1.6 / 4.1 / 7.3 / 11.05 / 14.8 / 18.0 / 20.5, three floors): a rusticated ground floor to 3.1 m (low segmental windows, six mascaron consoles, the door 1.6 x 2.8 under the stone balcony slab on two brackets
//   with an iron railing 5.3 m long), a first floor 3.1 .. 8.0 (tall windows, the central one under a triangular hood on brackets, the flanking ones with bracketed cornices, putti reliefs 4.0 x 0.7 over the outer two axes on
//   each side), a second floor 8.0 .. 11.9 (shorter windows, the central one in a blind relieving arch 4 m wide), a GIANT ORDER of four composite pilasters (u 5.5 / 8.6 / 13.4 / 16.6), the cornice to 11.9, the PEDIMENT over the
//   central 12.4 m (apex 13.9), a grey hip roof with two hipped dormers and chimneys.  Pale yellow #d8c48e, white trim #efeadb, roof #8c9094.
// Colliders: the outline and the court ring (thin walls).  Claim: groups.js key 'brullov-house' (r1257269).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FB, FALL, ringIn, holesIn, polyIn, colliders } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { wallHoles, cornice, pilaster, hipRect } from './facade.js';
import { addPolyColliders } from '../lib/massing.js';

const UF = 22.1, XS = [1.6, 4.1, 7.3, 11.05, 14.8, 18.0, 20.5], Y_COR = 11.9, Y_APEX = 13.9;

export function build(K) {
  const { ctx, P } = K, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] brullov/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const ring = ringIn(FB, 'r1257269', FALL.brullov), holes = holesIn(FB, 'r1257269');
  const court = holes.length ? holes : [FALL.brullovCourt];
  P.push(FB.x, 0, FB.z, FB.rot);
  try {
    stage('front', () => front(K));
    stage('walls', () => walls(K, ring, court));
    stage('roof', () => roof(K, ring, court));
  } finally { P.pop(); }
  stage('colliders', () => { const poly = { o: polyIn(FB, ring).o, h: court.map((h) => polyIn(FB, h).o) }; addPolyColliders(ctx, poly, 0, 14, 0.5); });
  const c = FB.W(11, 6);
  K.svc.monuments.push({ id: 'r1257269', name: 'Дом Брюллова (Кадетская линия, 21)', x: c.x, z: c.z, h: Y_APEX });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the street front (wall frame x' = 22.1 - u, z out = -v)
function front(K) {
  const { P, M } = K, G = M.glassDark, X = (u) => UF - u;
  P.push(UF, 0, 0, Math.PI);
  try {
    const ops1 = [], ops2 = [], ops3 = [];
    for (const [i, u] of XS.entries()) {
      if (i === 3) ops1.push({ x: X(u), y0: 0.25, w: 1.6, h: 2.8, kind: 'rect', glass: M.gateDark, depth: 0.5, sill: false });
      else ops1.push({ x: X(u), y0: 1.0, w: 1.3, h: 1.2, kind: 'arch', glass: G, depth: 0.3 });
      ops2.push({ x: X(u), y0: 4.2, w: 1.35, h: 2.5, kind: 'rect', glass: G });
      ops3.push({ x: X(u), y0: 8.8, w: 1.35, h: 1.7, kind: 'rect', glass: G });
    }
    wallHoles(P, { mat: M.rustB, x0: 0, x1: UF, y0: 0, y1: 3.1, uvs: 1.1, ops: ops1, reveal: M.stuccoB, depth: 0.3 });
    wallHoles(P, { mat: M.stuccoB, x0: 0, x1: UF, y0: 3.1, y1: 8.0, uvs: 4, ops: ops2, reveal: M.stuccoB, depth: 0.3 });
    wallHoles(P, { mat: M.stuccoB, x0: 0, x1: UF, y0: 8.0, y1: Y_COR, uvs: 4, ops: ops3, reveal: M.stuccoB, depth: 0.3 });
    // ground floor: a stone course, mascaron consoles under the first-floor sills (axes 1, 2, 3, 5, 6, 7), the iron grilles of the low windows
    P.box(M.stone, 0, UF, 0, 0.35, 0, 0.1, 'bk', 1.6);
    for (const [i, u] of XS.entries()) {
      const x = X(u);
      if (i !== 3) { P.fan(M.trim, [[x - 0.35, 3.1, 0.02], [x + 0.35, 3.1, 0.02], [x + 0.18, 2.35, 0.1], [x - 0.18, 2.35, 0.1]], [0, 0, 1]); const mk = new THREE.SphereGeometry(0.17, 8, 6); P.geo(M.trim, mk, x, 2.75, 0.12); mk.dispose(); P.box(M.trim, x - 0.8, x + 0.8, 1.0 - 0.1, 1.0, 0, 0.1, 'k', 1); P.quad(M.bars, [x - 0.62, 1.0, -0.12], [x + 0.62, 1.0, -0.12], [x + 0.62, 2.0, -0.12], [x - 0.62, 2.0, -0.12], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      // first floor dressings: sills; the central hood on brackets, the flanking bracketed cornices
      P.box(M.trim, x - 0.85, x + 0.85, 4.1, 4.2, 0, 0.14, 'k', 1);
      P.box(M.trim, x - 0.78, x - 0.68, 4.2, 6.7, 0, 0.07, 'k', 1); P.box(M.trim, x + 0.68, x + 0.78, 4.2, 6.7, 0, 0.07, 'k', 1);
      if (i === 3) { P.fan(M.trim, [[x - 1.1, 6.95, 0.05], [x + 1.1, 6.95, 0.05], [x, 7.6, 0.05]], [0, 0, 1]); P.box(M.trim, x - 1.1, x + 1.1, 6.78, 6.95, 0, 0.22, 'k', 1); for (const sx of [-0.85, 0.85]) P.box(M.trim, x + sx - 0.06, x + sx + 0.06, 6.2, 6.78, 0.03, 0.2, 'k', 1); }
      else if (i === 2 || i === 4) { P.box(M.trim, x - 1.0, x + 1.0, 6.78, 6.98, 0, 0.26, 'k', 1); for (const sx of [-0.8, 0.8]) P.box(M.trim, x + sx - 0.05, x + sx + 0.05, 6.3, 6.78, 0.03, 0.2, 'k', 1); }
      else P.box(M.trim, x - 0.85, x + 0.85, 6.72, 6.85, 0, 0.12, 'k', 1);
      // second floor: a plain frame and a small sill
      P.box(M.trim, x - 0.9, x + 0.9, 8.7, 8.8, 0, 0.1, 'k', 1); P.box(M.trim, x - 0.8, x + 0.8, 10.5, 10.65, 0, 0.1, 'k', 1);
    }
    // the door: a dark opening with a plain surround under the balcony
    // balcony over the door: a stone slab on two brackets at y 3.1 and an iron railing 5.3 m long (scroll / circle pattern)
    const xc = X(XS[3]);
    P.box(M.stone, xc - 2.8, xc + 2.8, 2.95, 3.15, 0, 1.0, 'b', 1.6);
    for (const sx of [-1.9, 1.9]) P.box(M.stone, xc + sx - 0.12, xc + sx + 0.12, 2.35, 2.95, 0.05, 0.85, 'b', 1.6);
    P.quad(M.balcony, [xc - 2.65, 3.15, 0.97], [xc + 2.65, 3.15, 0.97], [xc + 2.65, 4.15, 0.97], [xc - 2.65, 4.15, 0.97], [0, 0, 1], [[0, 0], [5.3 / 1.6, 0], [5.3 / 1.6, 1], [0, 1]]);
    for (const sx of [-1, 1]) P.quad(M.balcony, [xc + sx * 2.65, 3.15, 0.0], [xc + sx * 2.65, 3.15, 0.97], [xc + sx * 2.65, 4.15, 0.97], [xc + sx * 2.65, 4.15, 0.0], [sx, 0, 0], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
    P.box(M.iron, xc - 2.65, xc + 2.65, 4.12, 4.17, 0.94, 1.0, 'b', 1);
    // putti reliefs 4.0 x 0.7 at y 7.3 .. 8.0 over the outer two axes on each side
    for (const x of [X(2.85), X(19.25)]) P.box(M.trim, x - 2.0, x + 2.0, 7.3, 8.0, 0, 0.08, 'k', 1);
    // the blind relieving arch round the central second-floor window (an archivolt ring of radius 1.8 on the spring at y 9.7)
    const r0 = 1.75, r1 = 2.0, ys = 9.3;
    for (let k = 0; k < 14; k++) { const a0 = Math.PI * k / 14, a1 = Math.PI * (k + 1) / 14, xm = xc; P.quad(M.trim, [xm + Math.cos(a0) * r0, ys + Math.sin(a0) * r0, 0.06], [xm + Math.cos(a0) * r1, ys + Math.sin(a0) * r1, 0.06], [xm + Math.cos(a1) * r1, ys + Math.sin(a1) * r1, 0.06], [xm + Math.cos(a1) * r0, ys + Math.sin(a1) * r0, 0.06], [0, 0, 1]); }
    P.box(M.trim, xc - r1, xc - r0, 8.0, ys, 0, 0.06, 'k', 1); P.box(M.trim, xc + r0, xc + r1, 8.0, ys, 0, 0.06, 'k', 1);
    // giant order: four composite pilasters (shaft 0.85, from 3.2 to 9.9, capital 9.9 .. 10.9) at u 5.5 / 8.6 / 13.4 / 16.6
    for (const u of [5.5, 8.6, 13.4, 16.6]) pilaster(P, M.trim, X(u), 0.85, 3.2, 10.9, 0.3, { capH: 1.0, baseH: 0.45 });
    // cornice to 11.9, the string course at 8.0, the pediment over the central 12.4 m (apex 13.9)
    cornice(P, M.trim, M.stuccoB, 0, UF, 0, Y_COR - 1.2, { e0: 0.1, e1: 0.1, proj: 0.8 });
    P.box(M.trim, 0, UF, 7.95, 8.05, 0, 0.08, 'k', 1);
    const w2 = 6.2, xm = UF / 2;
    P.fan(M.stuccoB, [[xm - w2, Y_COR, 0], [xm + w2, Y_COR, 0], [xm, Y_APEX, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
    for (const m of [1, -1]) {                                                              // raking cornices: a band 0.4 m thick along each slope, 0.3 m proud (mirrored about the axis)
      const X2 = (x) => (m > 0 ? x : UF - x), xa = xm - w2, dx = xm - xa, dy = Y_APEX - Y_COR, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, t = 0.4, nxm = m > 0 ? nx : -nx;
      const A = [X2(xa), Y_COR], B = [X2(xm), Y_APEX], A2 = [X2(xa + nx * t), Y_COR + ny * t], B2 = [X2(xm + nx * t), Y_APEX + ny * t];
      P.quad(M.trim, [A[0], A[1], 0.3], [B[0], B[1], 0.3], [B2[0], B2[1], 0.3], [A2[0], A2[1], 0.3], [0, 0, 1]);
      P.quad(M.trim, [A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], 0.3], [A[0], A[1], 0.3], [-nxm, -ny, 0]);
    }
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the wings and the court: plain walls with window rows
function walls(K, ring, court) {
  const { P, M } = K, glass = M.glassDark;
  const rings = [ring, ...court];
  for (const [ri, r] of rings.entries()) {
    for (const e of ringEdges({ o: r.flat(), h: [] }, 0.3)) {
      if (ri === 0 && e.a[1] < 0.3 && e.b[1] < 0.3 && e.n[1] < -0.9 && Math.abs(e.a[0] - e.b[0]) > 10) continue;       // the street front: drawn above
      // the OSM outline of the rear wings overlaps two service lanes (w216655186 / w216655197): no plinth block on a carriageway (roads-surface-audit flagged lmMak-stone at y 0.35 there, review 2026-10-09)
      const A0 = ri === 0 ? e.a : e.b, B0 = ri === 0 ? e.b : e.a;                                                  // wall frame origin / end in the ring frame
      const onRoadAt = (x, len) => { const t = x / len, w = FB.W(A0[0] + (B0[0] - A0[0]) * t + e.n[0] * 0.4, A0[1] + (B0[1] - A0[1]) * t + e.n[1] * 0.4); return L.isOnRoad(w.x, w.z, 3.4); };
      onEdge(P, ri === 0 ? e : { ...e, n: [-e.n[0], -e.n[1]], a: e.b, b: e.a }, (len) => {
        const pitch = 3.15, n = Math.max(0, Math.floor((len - 1.2) / pitch)), ops = [];
        for (let k = 0; k < n; k++) { const x = (len - (n - 1) * pitch) / 2 + k * pitch; ops.push({ x, y0: 1.0, w: 1.3, h: 1.2, kind: 'rect', glass }, { x, y0: 4.2, w: 1.35, h: 2.5, kind: 'rect', glass }, { x, y0: 8.8, w: 1.35, h: 1.7, kind: 'rect', glass }); }
        wallHoles(P, { mat: M.stuccoB, x0: 0, x1: len, y0: 0, y1: Y_COR, uvs: 4, ops, reveal: M.stuccoB, depth: 0.25 });
        let nearRoad = false; for (let x = 0; x <= len + 1e-6 && !nearRoad; x += 0.5) nearRoad = onRoadAt(Math.min(x, len), len);          // no plinth on an edge that touches a drivable road (the rear wings overlap two service lanes)
        if (!nearRoad) P.box(M.stone, -0.05, len + 0.05, 0, 0.35, 0, 0.06, 'bk', 1.6);
        cornice(P, M.trim, M.stuccoB, 0, len, 0, Y_COR - 1.2, { e0: 0, e1: 0, proj: 0.6, modillions: false });
      });
    }
  }
}
function roof(K, ring, court) {
  const { P, M } = K;
  P.cap(M.roofGrey, ring, Y_COR + 0.05, true, 2.4, court);
  hipRect(P, M.roofGrey, 0, UF, 0, 12.6, Y_COR + 0.05, 2.6, 0.3);
  // two hipped dormers (3 m wide, 1.2 m high) over axes 1-2 and 6-7, chimneys
  for (const u of [3.0, 19.2]) { P.box(M.stuccoB, u - 1.5, u + 1.5, Y_COR + 0.9, Y_COR + 2.3, 3.0, 4.6, 'b', 2); hipRect(P, M.roofGrey, u - 1.5, u + 1.5, 3.0, 4.6, Y_COR + 2.3, 0.7, 0.2); P.quad(M.glassDark, [u - 1.0, Y_COR + 1.2, 2.97], [u + 1.0, Y_COR + 1.2, 2.97], [u + 1.0, Y_COR + 2.1, 2.97], [u - 1.0, Y_COR + 2.1, 2.97], [0, 0, -1]); }
  for (const u of [8.0, 14.5]) { P.box(M.chimney, u - 0.5, u + 0.5, Y_COR + 1.5, Y_COR + 4.0, 5.0, 6.0, 'b', 1); P.box(M.trim, u - 0.6, u + 0.6, Y_COR + 4.0, Y_COR + 4.15, 4.9, 6.1, 'b', 1); }
}
