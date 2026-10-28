// landmarksUniversity/fronts.js - the other fronts of the row (docs/research/university-embankment.md section 7):
//   the RECTOR'S WING (Университетская наб., 9; A. Shchedrin 1840-42; OSM w28567239): red and white, 5 axes on the embankment under a segmental pediment (re_01 re_02 tc_01);
//   the PALACE OF PETER II (Университетская наб., 11; D. Trezzini 1727 - I. Borchardt 1761; r2870005; the Philological faculty): the 98 m pale green and white front, three storeys in
//     the middle and two in the wings, orange-red roofs, the gate beside the Rector's wing (p2_01 p2_03 p2_04 p2_09 em_12); the courtyard is closed (not modelled);
//   NOVOBIRZHEVOY GOSTINY DVOR (Менделеевская линия, 5; G. Quarenghi 1800-15, third storey 1936; r455384; the History faculty): the pale yellow trapezoid with the arcaded ground
//     floor round its four sides (gd_01 .. gd_09).
// Edge-based shells (shell.js) with the bay textures of mats.js.
import * as THREE from 'three';
import * as L from '../layout.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, insetRoof, ringRoof, hipRect, chimney, shellColliders, edgeNear, texQuad, plainQuad, ringFromFlat } from './shell.js';
import { plate } from './plaques.js';

export function rector(K) {
  const { ctx, P, M } = K;
  const b = L.buildingById ? L.buildingById('w28567239') : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Rector\'s wing footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), EV = 9.8;
  const edges = shellWalls(P, poly, { def: { mat: M.reBay, bayW: 4.0, texH: EV, eave: EV, plain: M.tc, minBay: 3.2 } });
  shellCornice(P, poly, EV, M, { d: 0.42, h: 0.4 });
  insetRoof(P, ring, EV, M.rectorRoof, { inset: 3.4, rise: 2.0, chimney: M.tc, cap: M.white, chimneyStep: 10 });
  shellColliders(ctx, poly, EV + 2);
  const front = edgeNear(edges, -2835.2, -852.1, -2852.1, -841.4, 2.5);
  if (front) onEdge(P, front, (len) => {
    const cx = len / 2, y0 = EV, s = new THREE.Shape();
    s.moveTo(cx - 4.6, y0); s.lineTo(cx + 4.6, y0); s.lineTo(cx + 4.6, y0 + 0.7); s.quadraticCurveTo(cx + 3.2, y0 + 0.8, cx + 2.6, y0 + 1.7); s.quadraticCurveTo(cx, y0 + 4.9, cx - 2.6, y0 + 1.7); s.quadraticCurveTo(cx - 3.2, y0 + 0.8, cx - 4.6, y0 + 0.7); s.lineTo(cx - 4.6, y0);
    P.extrude(M.white, s, -0.25, 0.5, 1, 6);
    P.box(M.tc, cx - 2.0, cx + 2.0, y0 + 0.5, y0 + 1.9, 0.25, 0.27, 'kb'); P.box(M.white, cx - 0.62, cx + 0.62, y0 + 0.55, y0 + 2.5, 0.27, 0.3, 'kb'); P.box(M.glass, cx - 0.45, cx + 0.45, y0 + 0.7, y0 + 2.3, 0.3, 0.32, 'kb');
    for (let i = 0; i <= 5; i++) P.box(M.white, Math.max(0, (len * i) / 5 - 0.48), Math.min(len, (len * i) / 5 + 0.48), 0.86, 8.6, 0, 0.13, 'kb');
  });
  const sb = L.buildingById('w216655310');
  if (sb && sb.polys && sb.polys.length) { shellWalls(P, sb.polys[0], { def: { mat: null, plain: M.tc, eave: 4.2 } }); shellCornice(P, sb.polys[0], 4.2, M, { d: 0.25, h: 0.25 }); insetRoof(P, ringFromFlat(sb.polys[0].o), 4.2, M.rectorRoof, { inset: 2.2, rise: 1.2 }); shellColliders(ctx, sb.polys[0], 6); }
  K.svc.monuments.push({ id: 'rector-wing', name: 'Ректорский флигель', x: b.cx, z: b.cz, h: EV + 3, r: 0 });
}

export function peter2(K) {
  const { ctx, P, M } = K;
  const b = L.buildingById ? L.buildingById('r2870005') : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Palace of Peter II footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), holes = poly.h.map(ringFromFlat), EV = 9.8, EC = 15.0, TEX = 15, DEPTH = 14;
  const wing = { mat: M.p2Bay, bayW: 3.4, texH: TEX, eave: EV, plain: M.p2, minBay: 2.9 };
  const isCentre = (e) => !!edgeNear([e], -2878.3, -822.7, -2908.2, -805.9, 3), isGate = (e) => !!edgeNear([e], -2852.1, -841.4, -2878.3, -822.7, 3);
  const edges = shellWalls(P, poly, { style: (e) => (isCentre(e) || isGate(e) ? 'skip' : wing), def: wing });
  const GW = 6.2;
  for (const e of edges.filter(isGate)) onEdge(P, e, (len) => {                                 // the east wing: nine axes and the gate beside the Rector's wing
    const n = Math.max(1, Math.round((len - GW) / 3.0)), x1 = len - GW;
    texQuad(P, M.p2Bay, 0, x1, 0, EV, 0, n, TEX);
    for (let k = 0; k < 3; k++) { P.box(M.white, (x1 * k) / 3, (x1 * (k + 1)) / 3 + (k === 2 ? 0.42 : 0), EV - 0.4, EV, 0, 0.42, 'k'); P.box(M.white, (x1 * k) / 3, (x1 * (k + 1)) / 3, EV - 0.72, EV - 0.4, 0, 0.18, 'kt'); }
    P.box(M.tcWall, x1, len, 0, 5.2, -0.3, 0.0, 'b', 0.84); P.box(M.white, x1 - 0.05, len, 5.2, 5.45, -0.4, 0.1, '');
    const gx = x1 + GW / 2, s = new THREE.Shape(); s.moveTo(gx - 1.9, 0); s.lineTo(gx + 1.9, 0); s.lineTo(gx + 1.9, 2.5); s.absarc(gx, 2.5, 1.9, 0, Math.PI, false); s.lineTo(gx - 1.9, 0);
    const hole = new THREE.Path(); hole.moveTo(gx - 1.55, 0); hole.lineTo(gx - 1.55, 2.5); hole.absarc(gx, 2.5, 1.55, Math.PI, 0, true); hole.lineTo(gx + 1.55, 0); hole.lineTo(gx - 1.55, 0); s.holes.push(hole);
    P.extrude(M.white, s, 0.0, 0.14, 1, 8);
    const op = new THREE.Shape(); op.moveTo(gx - 1.55, 0); op.lineTo(gx + 1.55, 0); op.lineTo(gx + 1.55, 2.5); op.absarc(gx, 2.5, 1.55, 0, Math.PI, false); op.lineTo(gx - 1.55, 0);
    P.face(M.glass, op, 0.05, 1, 8);                                                               // the dark passage behind the iron gates
    P.quad(M.ironwork, [gx - 1.55, 0, 0.1], [gx + 1.55, 0, 0.1], [gx + 1.55, 3.0, 0.1], [gx - 1.55, 3.0, 0.1], [0, 0, 1], [[0, 0], [3, 0], [3, 3], [0, 3]]);
  });
  for (const e of edges.filter(isCentre)) onEdge(P, e, (len, f) => {                            // the three-storey centre: front, sides and back above the wing roofs, its hip roof
    const n = 2 * Math.round((len / 3.4 - 1) / 2) + 1, p = len / n, world = (x, z) => [f.x + f.xa[0] * x + e.n[0] * z, f.z + f.xa[1] * x + e.n[1] * z];
    texQuad(P, M.p2Bay, 0, len, 0, EC, 0, n, TEX);
    for (let i = 0; i <= n; i++) P.box(M.white, Math.max(0, (len * i) / n - 0.42), Math.min(len, (len * i) / n + 0.42), 0.95, 14.0, 0, 0.14, 'kb');
    P.box(M.white, -0.5, len + 0.5, EC - 0.45, EC, -DEPTH - 0.5, 0.5, 'b'); P.box(M.white, -0.2, len + 0.2, EC - 0.8, EC - 0.45, -DEPTH - 0.2, 0.2, 'tb');
    for (const x of [0, len]) P.quad(M.p2, [x, EV, -DEPTH], [x, EV, 0], [x, EC - 0.8, 0], [x, EC - 0.8, -DEPTH], [x ? 1 : -1, 0, 0]);
    P.quad(M.p2, [len, EV, -DEPTH], [0, EV, -DEPTH], [0, EC - 0.8, -DEPTH], [len, EC - 0.8, -DEPTH], [0, 0, -1]);
    hipRect(P, M.p2Roof, 0, len, -DEPTH, 0, EC + 0.04, 3.0, { over: 0.5 });
    for (const x of [len * 0.25, len * 0.75]) chimney(P, M.p2, M.white, x, -DEPTH / 2 - 2.5, EC + 1, EC + 4.2, 0.9, 1.3);
    const cx = len / 2;
    P.box(M.white, cx - 1.2, cx + 1.2, 0, 3.6, 0, 0.12, 'kb'); P.box(M.door, cx - 0.95, cx + 0.95, 0, 3.1, 0.12, 0.17, 'kb'); P.box(M.granitePlain, cx - 1.6, cx + 1.6, 0, 0.16, 0, 0.9, 'kb');
    plate(K, { id: 'r2870005', x: cx - 1.5 * p, y: 2.1, w: 1.1, h: 0.75, key: 'p2-name', style: 'board', world, n: e.n, size: 40, lines: ['САНКТ-ПЕТЕРБУРГСКИЙ', 'ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ', 'ФИЛОЛОГИЧЕСКИЙ ФАКУЛЬТЕТ'] });
    plate(K, { id: 'r2870005', x: cx + 1.5 * p, y: 2.1, w: 1.1, h: 0.75, key: 'p2-name2', style: 'board', world, n: e.n, size: 40, lines: ['САНКТ-ПЕТЕРБУРГСКИЙ', 'ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ', 'ВОСТОЧНЫЙ ФАКУЛЬТЕТ'] });
    const d = world(cx, 1.6); K.svc.entrances.push({ x: d[0], z: d[1], rotY: Math.atan2(e.n[0], e.n[1]), name: 'Филологический факультет', closed: true });
  });
  shellCornice(P, poly, EV, M, { d: 0.42, h: 0.4, draw: (e) => !isCentre(e) && !isGate(e) });
  // the gate is open to the sky (re_01): the roof ring is cut back from the corner beside the Rector's wing and the end of the east wing is closed by a wall
  let roofRing = ring;
  {
    const dV = (q) => Math.hypot(q[0] + 2852.1, q[1] + 841.4), vi = ring.reduce((bi, q, i) => (dV(q) < dV(ring[bi]) ? i : bi), 0), V = ring[vi];
    if (dV(V) < 2) {
      const N = ring.length, toward = (q, d) => { const l = Math.hypot(q[0] - V[0], q[1] - V[1]) || 1; return [V[0] + ((q[0] - V[0]) * d) / l, V[1] + ((q[1] - V[1]) * d) / l]; };
      const A = toward(ring[(vi + N - 1) % N], GW), B = toward(ring[(vi + 1) % N], GW), mx = V[0] - (A[0] + B[0]) / 2, mz = V[1] - (A[1] + B[1]) / 2, ml = Math.hypot(mx, mz) || 1;
      roofRing = ring.slice(0, vi).concat([A, B], ring.slice(vi + 1));
      P.quad(M.p2, [A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], EV, B[1]], [A[0], EV, A[1]], [mx / ml, 0, mz / ml]);
    }
  }
  ringRoof(P, roofRing, holes, EV, M.p2Roof, { inset: 3.6, rise: 1.9 });
  shellColliders(ctx, poly, EC + 2);
  K.svc.monuments.push({ id: 'peter2-palace', name: 'Дворец Петра II', x: -2893, z: -814, h: 18, r: 0 });
}

export function gostiny(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const b = L.buildingById ? L.buildingById('r455384') : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Gostiny Dvor footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), holes = poly.h.map(ringFromFlat), EV = 14.5, GA = 5.4, DEEP = 3.6, PIER = 0.9;
  const inner = { mat: M.gdBay, bayW: 4.0, texH: EV, eave: EV, plain: M.gd, margin: 0.9, minBay: 3.2 };
  const edges = shellWalls(P, poly, { style: (e) => (e.hole || e.len < 12 ? inner : 'skip'), def: inner });
  // the four street fronts: a REAL open arcade (piers 1.4 m, arches 2.6 m, a vaulted walk 3.6 m deep with the shop wall behind), the two upper floors from the bay texture
  for (const e of edges.filter((q) => q.skipped)) onEdge(P, e, (len, f) => {
    const m = 0.9, n = Math.max(1, Math.round((len - 2 * m) / 4.0)), p = (len - 2 * m) / n, world = (x, z) => [f.x + f.xa[0] * x + e.n[0] * z, f.z + f.xa[1] * x + e.n[1] * z], rot = Math.atan2(e.n[0], e.n[1]);
    texQuad(P, M.gdBay, m, len - m, GA, EV, 0, n, EV); plainQuad(P, M.gd, 0, m, GA, EV); plainQuad(P, M.gd, len - m, len, GA, EV);
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, GA); s.lineTo(0, GA); s.lineTo(0, 0);
    for (let i = 0; i < n; i++) { const cx = m + (i + 0.5) * p, h = new THREE.Path(); h.moveTo(cx - 1.3, 0); h.lineTo(cx - 1.3, 2.0); h.absarc(cx, 2.0, 1.3, Math.PI, 0, true); h.lineTo(cx + 1.3, 0); h.lineTo(cx - 1.3, 0); s.holes.push(h); }
    P.extrude(M.gdRust, s, -PIER, PIER, 1, 6);
    // the shop wall behind the walk (the walks of two fronts meet in the corner bays: the wall, its collider, the floor and the ceiling stop DEEP before the corners)
    const b0 = m + p, b1 = len - m - p;
    texQuad(P, M.gdBack, b0, b1, 0, GA - 0.2, 0, n - 2, GA - 0.2, -DEEP); plainQuad(P, M.gdIn, DEEP, b0, 0, GA - 0.2, -DEEP); plainQuad(P, M.gdIn, b1, len - DEEP, 0, GA - 0.2, -DEEP);
    const k = Math.max(1, Math.ceil(len / 16)), L1 = len - DEEP;
    for (let i = 0; i < k; i++) {
      const a = (L1 * i) / k, c = (L1 * (i + 1)) / k;
      P.quad(M.gdIn, [a, GA - 0.2, -PIER], [c, GA - 0.2, -PIER], [c, GA - 0.2, -DEEP], [a, GA - 0.2, -DEEP], [0, -1, 0]);
      P.quad(M.slab, [a, 0.035, 0], [c, 0.035, 0], [c, 0.035, -DEEP], [a, 0.035, -DEEP], [0, 1, 0], [[a / 2.4, 0], [c / 2.4, 0], [c / 2.4, DEEP / 2.4], [a / 2.4, DEEP / 2.4]]);
    }
    // colliders: the piers and the shop wall behind the walk; the arches stay open
    for (let i = 0; i <= n; i++) { const x0 = i === 0 ? 0 : m + i * p - 0.7, x1 = i === n ? len : m + i * p + 0.7, c = world((x0 + x1) / 2, -PIER / 2); ph.addBox(c[0], c[1], x1 - x0, PIER, rot, 0, GA); }
    const c = world(len / 2, -DEEP - 0.3); ph.addBox(c[0], c[1], len - 2 * DEEP, 0.6, rot, 0, EV + 2);
    const u = world(len / 2, -PIER / 2); ph.addBox(u[0], u[1], len, PIER, rot, GA - 0.4, EV + 2);
    e.lay = { n, x0: m, pitch: p };
  });
  for (const q of edges.filter((e) => e.hole)) { const dx = q.b[0] - q.a[0], dz = q.b[1] - q.a[1]; ph.addBox((q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2, q.len + 0.4, 0.9, Math.atan2(-dz, dx), 0, EV + 2); }
  shellCornice(P, poly, EV, M, { d: 0.5, h: 0.45 });
  shellCornice(P, { o: poly.o, h: [] }, 5.72, M, { d: 0.22, h: 0.3, holes: false });
  ringRoof(P, ring, holes, EV, M.acRoof, { inset: 4.2, rise: 2.0 });
  const west = edges.filter((e) => !e.hole && e.skipped).sort((m, n) => (m.a[0] + m.b[0]) - (n.a[0] + n.b[0]))[0];
  if (west) onEdge(P, west, (len, f) => {
    const world = (x, z) => [f.x + f.xa[0] * x + west.n[0] * z, f.z + f.xa[1] * x + west.n[1] * z];
    const lay = west.lay || { x0: 0.9, pitch: 4, n: Math.round(len / 4) };
    plate(K, { id: 'r455384', x: lay.x0 + lay.pitch * Math.round(lay.n / 2), y: 2.2, w: 1.1, h: 0.75, key: 'gd-name', style: 'board', world, n: west.n, size: 40, lines: ['САНКТ-ПЕТЕРБУРГСКИЙ', 'ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ', 'ИСТОРИЧЕСКИЙ ФАКУЛЬТЕТ'] });
  });
  K.svc.monuments.push({ id: 'novobirzhevoy-gostiny-dvor', name: 'Новобиржевой Гостиный двор', x: b.cx, z: b.cz, h: EV + 2, r: 0 });
  K.svc.arcade = { id: 'r455384', depth: DEEP };
}
