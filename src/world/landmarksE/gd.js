// landmarksE/gd.js - Gostiny Dvor (Большой Гостиный двор, Nevsky 35 / Sadovaya 17, Quarenghi / Vallin de la Mothe 1761-85; the Nevsky wing rebuilt 1944-48).
// Dossier docs/research/gostiny-dvor-ostrovsky.md section 3; photos refs/ostrovsky 002 003 004 005 009 014 018 019 021 173.
//   One ring building 21 m deep round a block of courtyards (OSM relation r1147588 + the duplicate ways r9241917 / r8605230 and the inner court buildings).  The OUTER ring is redrawn from four straight
//   lines (Nevsky / Perinnaya / Lomonosova / Sadovaya) with four rounded corners (R 12 / 7 / 7 / 9 m) so that every side is a clean run of bays; the three courtyard holes keep their OSM outlines.
//   Bay (pitch ~3.9 m): white pilaster strip with a white downpipe on a limestone plinth, ground arch (2.6 m wide, crown 4.1 m) into an OPEN GALLERY (4.6 m deep, granite slab floor, groin-vault ceiling,
//   shop windows in the back wall, pendant lanterns), belt course, upper arch (crown 7.6 m) with an iron balconette (circle motif) and a flower box, frieze, white cornice, balustrade between yellow
//   plinth dice, green copper standing-seam roof (a pitched ring, 9.2 -> ~16 m).  The Nevsky front has the 4-column Tuscan portico (u 613.8-631.4, projecting 2 m) with the pediment, the sheaf relief
//   and the scrolled attic; every corner is a convex pavilion with FOUR PAIRS of coupled free columns, a curved entablature and an iron-railed attic.  Colours #e8c46c / #f2efe6 / #5d9b7c.
//   Colliders: the pier of every pilaster, the back wall of the gallery (the offset ring), the courtyard walls.  The gallery is walkable all round the block.  NO flags, no scaffolding, no logos.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, band, rectPath, archPath, edgeToWorld } from './kit.js';
import { toWorld, toUV, ROT, ringOf, inRing } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';
import { centralExtraDoors } from '../metro/central-locations.js';
import { buildHouse } from './house.js';

export const Y = { BELT0: 4.3, BELT1: 4.8, FRI0: 7.75, FRI1: 8.35, COR1: 9.2, BAL1: 10.3, DICE1: 11.0, EAVE: 9.25 };
const PITCH = 3.9, ARCH_W = 2.75, T = 1.2, GAL = 4.6;                 // pier thickness, gallery depth (from the front plane)
const sadovayaDoor = centralExtraDoors.find(d => d.id === 'gostiny-sadovaya');
const NEV = { u0: 522.8, v0: 35.8, u1: 724.9, v1: 34.6 };
const PORT = { u0: 613.8, u1: 631.4, proj: 2.0 };

// ------------------------------------------------------------------------------------------------ the redrawn outer ring
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]), norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
function isect(a0, a1, b0, b1) {
  const d1 = sub(a1, a0), d2 = sub(b1, b0), den = d1[0] * d2[1] - d1[1] * d2[0], t = ((b0[0] - a0[0]) * d2[1] - (b0[1] - a0[1]) * d2[0]) / den;
  return add(a0, mul(d1, t));
}
function corner(p, v, q, R, seg = 3.6) {
  const a = norm(sub(p, v)), b = norm(sub(q, v)), ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), t = R / Math.tan(ang / 2);
  const t1 = add(v, mul(a, t)), t2 = add(v, mul(b, t)), bis = norm(add(a, b)), c = add(v, mul(bis, R / Math.sin(ang / 2)));
  const a0 = Math.atan2(t1[1] - c[1], t1[0] - c[0]);
  let da = Math.atan2(t2[1] - c[1], t2[0] - c[0]) - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const n = Math.max(3, Math.round(R * Math.abs(da) / seg)), pts = [];
  for (let i = 0; i <= n; i++) { const q2 = a0 + da * i / n; pts.push([c[0] + R * Math.cos(q2), c[1] + R * Math.sin(q2)]); }
  return { pts, n };
}
const lineV = (u) => NEV.v0 + (NEV.v1 - NEV.v0) * (u - NEV.u0) / (NEV.u1 - NEV.u0);

/** the ring: vertices in (u, v) with a tag per edge: { kind: 'straight' | 'arc' | 'portico', side, corner, idx, n } */
export function ringUV() {
  const NV = [[NEV.u0, NEV.v0], [NEV.u1, NEV.v1]], PN = [[732.0, 42.7], [827.8, 313.9]], LM = [[822.2, 322.3], [736.1, 355.7]], SD = [[723.5, 346.9], [519.3, 68.7]];
  const c1 = isect(SD[0], SD[1], NV[0], NV[1]), c4 = isect(NV[0], NV[1], PN[0], PN[1]), c3 = isect(PN[0], PN[1], LM[0], LM[1]), c2 = isect(LM[0], LM[1], SD[0], SD[1]);
  // order round the block: Nevsky (c1 -> c4), Perinnaya (c4 -> c3), Lomonosova (c3 -> c2), Sadovaya (c2 -> c1)
  const V = [c1, c4, c3, c2], R = [12, 7, 7, 9], names = ['nevsky', 'perinnaya', 'lomonosova', 'sadovaya'];
  const arcs = V.map((v, i) => corner(V[(i + 3) % 4], v, V[(i + 1) % 4], R[i]));
  const pts = [], tags = [];
  const push = (p, tag) => { pts.push(p); tags.push(tag); };
  for (let s = 0; s < 4; s++) {
    // corner s arc (from the previous side's tangent point to the next side's tangent point), then the straight side s from the end of arc s to the start of arc s+1
    const arc = arcs[s];
    for (let i = 0; i < arc.n; i++) push(arc.pts[i], { kind: 'arc', corner: s, idx: i, cn: arc.n, side: names[(s + 3) % 4] });
    const a = arc.pts[arc.n], b = arcs[(s + 1) % 4].pts[0];
    if (s === 0) {                                                       // Nevsky: split at the portico
      const pa = a, pb = [PORT.u0, lineV(PORT.u0)], pc = [PORT.u1, lineV(PORT.u1)];
      push(pa, { kind: 'straight', side: 'nevsky' }); push(pb, { kind: 'portico', side: 'nevsky' }); push(pc, { kind: 'straight', side: 'nevsky' });
    } else push(a, { kind: 'straight', side: names[s] });
    void b;
  }
  return { pts, tags, c: V, arcs };
}

// ------------------------------------------------------------------------------------------------ the roof: a pitched ring (height field on a subdivided triangulation)
export function roofGeo(ring, holes, eave, k, ridge, maxEdge, uvFn) {
  const c2 = ring.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const all = ring.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const segs = []; for (const r of [ring, ...holes]) for (let i = 0; i < r.length; i++) segs.push([r[i], r[(i + 1) % r.length]]);
  const dist = (x, z) => { let d = 1e9; for (const [a, b] of segs) { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d; };
  const pos = [], nrm = [], uv = [], idx = [];
  const yAt = (p) => Math.min(ridge, eave + k * dist(p[0], p[1]));
  const emit = (a, b, c) => {
    const A = [a[0], yAt(a), a[1]], B = [b[0], yAt(b), b[1]], C = [c[0], yAt(c), c[1]];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const flip = ny < 0, base = pos.length / 3;
    for (const P of [A, B, C]) { pos.push(P[0], P[1], P[2]); nrm.push(flip ? -nx : nx, flip ? -ny : ny, flip ? -nz : nz); const t = uvFn(P[0], P[2]); uv.push(t[0], t[1]); }
    if (flip) idx.push(base, base + 2, base + 1); else idx.push(base, base + 1, base + 2);
  };
  const sub2 = (a, b, c, depth = 0) => {
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), m = Math.max(ab, bc, ca);
    if (m <= maxEdge || depth > 14) { emit(a, b, c); return; }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (m === ab) { const d = mid(a, b); sub2(a, d, c, depth + 1); sub2(d, b, c, depth + 1); } else if (m === bc) { const d = mid(b, c); sub2(a, b, d, depth + 1); sub2(a, d, c, depth + 1); } else { const d = mid(c, a); sub2(a, b, d, depth + 1); sub2(d, b, c, depth + 1); }
  };
  for (const t of tris) sub2(all[t[0]], all[t[1]], all[t[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** ring offset by d (positive = outward) with mitres */
export function offsetRing(ring, d) {
  const n = ring.length; let A = 0; for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const sgn = A > 0 ? 1 : -1, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [sgn * dz / l, -sgn * dx / l]; };
  for (let i = 0; i < n; i++) {
    const p = ring[(i + n - 1) % n], q = ring[i], r = ring[(i + 1) % n], n1 = nrm(p, q), n2 = nrm(q, r), k = d / Math.max(0.3, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
    out.push([q[0] + (n1[0] + n2[0]) * k, q[1] + (n1[1] + n2[1]) * k]);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ build
export function build(K, ctx) {
  const P = K.P, G = K.G, M = G.M, KM = K.mats;
  const rec = L.buildingById('r1147588');
  if (!rec) throw new Error('Gostiny Dvor record missing');
  const poly = rec.polys[0];
  const holesW = poly.h.map(ringOf);

  // ---- the ring
  const R = ringUV();
  const ringW = R.pts.map(([u, v]) => toWorld(u, v));
  const E = ringEdges({ o: ringW.flat(), h: [] }, 0);
  E.forEach((e) => { Object.assign(e, R.tags[e.i]); });
  K.gdRing = ringW;
  const holeEdges = ringEdges({ o: poly.o, h: poly.h }, 0.05).filter((e) => e.hole);

  // ---- bands (mitred over the whole ring), the portico and the corner pavilions interrupt some of them
  const notPortico = (e) => e.kind !== 'portico';
  const isArc = (e) => e.kind === 'arc';
  band(P, E, 0, 0.9, 0.1, { front: M.plinth, top: M.plinthFlat }, { draw: (e) => !isArc(e) && notPortico(e), uvs: 2.4 });
  band(P, E, Y.BELT0, Y.BELT1, 0.2, { front: M.white, top: M.white, under: M.whiteShade }, { draw: notPortico });
  band(P, E, Y.FRI0, Y.FRI1, (e) => (isArc(e) ? 1.55 : 0.1), { front: M.gd, top: M.white, under: M.whiteShade }, { draw: notPortico });
  band(P, E, Y.FRI1, Y.FRI1 + 0.45, (e) => (isArc(e) ? 1.85 : 0.5), { front: M.white, top: M.white, under: M.whiteShade }, { draw: notPortico });
  band(P, E, Y.FRI1 + 0.45, Y.COR1, (e) => (isArc(e) ? 2.0 : 0.85), { front: M.white, top: M.white, under: M.whiteShade }, { draw: notPortico });
  // roof balustrade rail: low parapet block + balusters (alpha strip) + yellow dice every 2 bays
  for (const e of E) {
    if (isArc(e) || e.kind === 'portico') continue;
    onEdge(P, e, (l) => {
      P.box(M.white, 0, l, Y.COR1, Y.COR1 + 0.16, 0.14, 0.5, 'b');
      P.box(M.white, 0, l, Y.BAL1 - 0.13, Y.BAL1, 0.14, 0.5, 'b');
      P.quad(M.balust, [0, Y.COR1 + 0.16, 0.33], [l, Y.COR1 + 0.16, 0.33], [l, Y.BAL1 - 0.13, 0.33], [0, Y.BAL1 - 0.13, 0.33], [0, 0, 1], [[0, 0], [l / 1.1, 0], [l / 1.1, 1], [0, 1]]);
      const n = Math.max(1, Math.round(l / PITCH)), p = l / n;
      for (let k = 0; k <= n; k += 2) {
        const x = k * p; if (x < 0.4 || x > l - 0.4) continue;
        P.box(M.gd, x - 0.4, x + 0.4, Y.COR1, Y.DICE1, 0.0, 0.8, 'b'); P.box(M.white, x - 0.46, x + 0.46, Y.DICE1, Y.DICE1 + 0.12, -0.06, 0.86, 'b');
      }
    });
  }

  // ---- every edge: the arcade bays
  const piers = [];
  for (const e of E) {
    if (e.kind === 'portico') continue;
    const side = e.side, full = side === 'nevsky';
    onEdge(P, e, (l) => bays(K, e, l, full, piers));
  }

  // ---- the portico on the Nevsky front
  const pe = E.find((e) => e.kind === 'portico');
  if (pe) onEdge(P, pe, (l) => portico(K, pe, l, piers, ctx));
  for (const pr of piers) ctx.physics.addBox(pr.x, pr.z, pr.w, pr.d, pr.rot, 0, 11);

  // ---- the four corner pavilions: 4 pairs of coupled columns, curved entablature, attic railing
  const corners = [];
  for (let c = 0; c < 4; c++) {
    const es = E.filter((e) => e.kind === 'arc' && e.corner === c);
    if (es.length) cornerPavilion(K, es, c);
    corners.push(es.length);
  }

  // ---- gallery back wall colliders (the offset ring) and the courtyard walls
  const back = offsetRing(ringW, -(GAL + 0.05));
  addPolyColliders(ctx, { o: back.flat(), h: [] }, 0, 11, 0.8, [...L.DOORWAYS,sadovayaDoor]);
  for (const h of poly.h) addPolyColliders(ctx, { o: h, h: [] }, 0, 11, 0.8);

  // ---- courtyard walls: one textured quad per edge (arch windows below, windows above), a cornice
  courtWalls(K, holeEdges);

  // ---- the roof
  const tex = (x, z) => [x / 2.4, z / 2.4];
  P.geo(M.roofGreen, roofGeo(ringW, holesW, Y.EAVE, 0.3, 13.2, 4.5, tex));
  chimneys(K, ringW, holesW);

  // ---- the small buildings of the great court
  { const recs = ['w115428587', 'w115428582', 'w115428590', 'w115428581'].map((id) => L.buildingById(id)).filter(Boolean);
    if (recs.length) buildHouse(K, { name: 'gd-court', recs, hc: 7.6, wall: '#e6c06a', court: '#e6c06a', plinth: 0.6, plinthMat: M.plinthFlat, floors: [3.8, 3.4], courtPitch: 4, upstand: 0.4, roofMat: M.roofZinc, railing: false, collide: true, collideH: 9 }); }
  K.svc.monuments.push({ id: 'gostiny-dvor', name: 'Большой Гостиный двор', nameEn: 'Great Gostiny Dvor', x: -1122, z: -108, h: 14 });
  K.svc.houses.push({ id: 'gostiny-dvor', name: 'Большой Гостиный двор', nameEn: 'Great Gostiny Dvor', x: -1122, z: -108 });
  const sp = toWorld(622, 6), sp2 = toWorld(520, 8);
  K.svc.photoSpots.push({ x: sp[0], z: sp[1], yaw: L.yawToward(sp[0], sp[1], ...toWorld(622, 34)), pitch: 8, name: 'Портик Гостиного двора', nameEn: 'Gostiny Dvor portico' });
  K.svc.photoSpots.push({ x: sp2[0], z: sp2[1], yaw: L.yawToward(sp2[0], sp2[1], ...toWorld(509, 46)), pitch: 8, name: 'Угол Гостиного двора и Садовой', nameEn: 'Gostiny Dvor corner on Sadovaya' });
  K.svc.spots.gdGallery = { start: toWorld(560, 38.5), end: toWorld(700, 38.5) };
  K.svc.spots.gdFront = { u0: 506, u1: 731, v: 36 };
  K.svc.spots.gdArcade = { poly: [toWorld(522.8, 35.8), toWorld(724.9, 34.6), toWorld(724.9, 34.6 + GAL), toWorld(522.8, 35.8 + GAL)], depth: GAL, doors: ['gostiny-in', 'gostiny-out'] };    // QA: the Nevsky arcade strip (people / props / wildlife)
}

// ------------------------------------------------------------------------------------------------ one run of bays (in the edge frame)
function bays(K, e, l, full, piers) {
  const P = K.P, G = K.G, M = G.M, KM = K.mats, arc = e.kind === 'arc';
  const n = Math.max(1, Math.round(l / PITCH)), p = l / n, A = Math.min(ARCH_W, p - 0.95);
  const pierBox = (x) => {
    // world box of the pier at local x (depth T behind the front plane): the frame of the edge -> world
    const f = e, rot = Math.atan2(f.n[0], f.n[1]), xa = [f.n[1], -f.n[0]], fwd = (f.b[0] - f.a[0]) * xa[0] + (f.b[1] - f.a[1]) * xa[1] > 0, o = fwd ? f.a : f.b;
    const cx = o[0] + xa[0] * x - f.n[0] * (T / 2), cz = o[1] + xa[1] * x - f.n[1] * (T / 2);
    piers.push({ x: cx, z: cz, w: 0.9 + (p - A - 0.9), d: T, rot });
  };
  // QA: the two arcade entrances of the metro (layout.DOORWAYS gostiny-in / -out) are REAL openings in the back wall of the gallery (3.4 x 3.3 m, jambs 0.65 m deep to the ticket hall of the metro module)
  const metroAt = new Map();
  if ((full || e.side === 'sadovaya') && e.kind === 'straight') {
    const m = P.m.elements, done = e.metroDone || (e.metroDone = {});
    for (let k = 0; k < n; k++) {
      const cx = k * p + p / 2, wx = m[0] * cx - m[8] * GAL + m[12], wz = m[2] * cx - m[10] * GAL + m[14], q = toUV(wx, wz);
      if (e.side === 'sadovaya' && Math.hypot(wx - sadovayaDoor.x, wz - sadovayaDoor.z) < .1)
        metroAt.set(k, {ue: 'sadovaya', wx, wz});
      if (full) for (const ue of [541.4, 548.0]) if (Math.abs(q.u - ue) < p / 2 + 0.05 && !done[ue]) { done[ue] = 1; metroAt.set(k, { ue, wx, wz }); }
    }
  }
  gallery(K, l, [...metroAt.keys()].map((k) => ({ x: k * p + p / 2, w: 3.4, h: 3.3 })));
  for (let k = 0; k < n; k++) {
    const x0 = k * p, x1 = x0 + p, cx = x0 + p / 2;
    // the wall of the bay with the two arched openings
    K.wallWithHoles(M.gd, x0, x1, 0, Y.FRI0, [{ x: cx, y0: 0.13, w: A, h: 4.1 - 0.13, head: 'arch' }, { x: cx, y0: Y.BELT1, w: A, h: 7.6 - Y.BELT1, head: 'arch' }], 4);
    // jambs and soffits of both openings through the wall thickness T
    for (const [y0, y1] of [[0.13, 4.1], [Y.BELT1, 7.6]]) {
      const sp0 = y1 - A / 2, r = A / 2;
      P.quad(M.gdShade, [cx - r, y0, 0], [cx - r, y0, -T], [cx - r, sp0, -T], [cx - r, sp0, 0], [1, 0, 0]);
      P.quad(M.gdShade, [cx + r, y0, -T], [cx + r, y0, 0], [cx + r, sp0, 0], [cx + r, sp0, -T], [-1, 0, 0]);
      const m = 6;
      for (let i = 0; i < m; i++) {
        const a0 = Math.PI * i / m, a1 = Math.PI * (i + 1) / m;
        P.quad(M.vaultPlain, [cx + r * Math.cos(a0), sp0 + r * Math.sin(a0), 0], [cx + r * Math.cos(a1), sp0 + r * Math.sin(a1), 0], [cx + r * Math.cos(a1), sp0 + r * Math.sin(a1), -T], [cx + r * Math.cos(a0), sp0 + r * Math.sin(a0), -T], [0, -1, 0]);
      }
      // sill / step
    }
    // the upper opening: window behind the balconette (recessed T)
    K.glass(KM.winBrown, cx, Y.BELT1, A, 7.6 - Y.BELT1, 'arch', (k + e.i) % 4, -T + 0.03);
    // balconette (alpha) + the flower box
    P.quad(M.balcony, [cx - A / 2 - 0.02, Y.BELT1, -0.22], [cx + A / 2 + 0.02, Y.BELT1, -0.22], [cx + A / 2 + 0.02, Y.BELT1 + 1.05, -0.22], [cx - A / 2 - 0.02, Y.BELT1 + 1.05, -0.22], [0, 0, 1], [[0, 0], [A / 1.0, 0], [A / 1.0, 1], [0, 1]]);
    const fl = ['#f2eaf0', '#d9558c', '#8a5ab0', '#d03a40', '#f5f1f0', '#e8789c'][(k * 7 + e.i * 3) % 6];
    if ((k + e.i) % 3 !== 2) { P.box(KM.doorWood, cx - 0.8, cx + 0.8, Y.BELT1 + 0.7, Y.BELT1 + 0.95, -0.42, -0.14, ''); P.box(K.mat(fl), cx - 0.78, cx + 0.78, Y.BELT1 + 0.92, Y.BELT1 + 1.2, -0.4, -0.16, 'b'); }
    // archivolts (white rings, 0.3 m)
    for (const [y0, y1] of [[0.13, 4.1], [Y.BELT1, 7.6]]) {
      const s = new THREE.Shape(); archPath(s, cx, y0 + 0.0, A + 0.64, y1 - y0 - 0.32 - (A + 0.64) / 2 + 0.0 + 0.0, false); const hole = new THREE.Path(); archPath(hole, cx, y0, A, y1 - y0 - A / 2, true); s.holes.push(hole);
      P.face(M.white, s, 0.045, 1, 8);
    }
    // the gallery: back wall with a shop window and lanterns
    P.push(0, 0, -GAL, 0);
    const mb = metroAt.get(k), metro = !!mb;
    if (mb) K.svc.entrances.push({ id: 'gd-metro-' + mb.ue, x: mb.wx, z: mb.wz, rotY: Math.atan2(e.n[0], e.n[1]), station: 'Гостиный двор', kind: 'metro' });
    if (metro) {
      // the opening itself is cut in gallery(); the stainless portal, the glass leaves and the oval sign belong to metro/st-gd.js; here only the white reveal band round it
      P.box(M.white, cx - 1.8, cx - 1.7, 0.13, 3.3, -0.02, 0.1, 'kb'); P.box(M.white, cx + 1.7, cx + 1.8, 0.13, 3.3, -0.02, 0.1, 'kb'); P.box(M.white, cx - 1.8, cx + 1.8, 3.3, 3.42, -0.02, 0.1, 'kb');
    } else K.glass(KM.shop, cx, 0.75, Math.min(2.4, p - 1.4), 2.5, 'flat', (k + e.i) % 4, 0.06);
    if (full && k % 2 === 0) {
      P.cyl(M.iron, [cx, 3.7 + 0.5, 2.3], [cx, 3.85 + 0.5, 2.3], 0.012, 0.012, 3, false);
      P.box(M.iron, cx - 0.17, cx + 0.17, 3.0, 3.1, 2.13, 2.47, ''); P.box(M.globe, cx - 0.13, cx + 0.13, 3.1, 3.5, 2.17, 2.43, 'b'); P.box(M.iron, cx - 0.19, cx + 0.19, 3.5, 3.56, 2.11, 2.49, '');
    }
    P.pop();
  }
  // pilaster strips with downpipes, bases and imposts
  for (let k = 0; k <= n; k++) {
    const x = k * p, end = k === 0 || k === n, w = end ? 0.45 : 0.9, xc = end ? (k === 0 ? 0.225 : l - 0.225) : x;
    P.box(M.white, xc - w / 2, xc + w / 2, 0.9, Y.FRI0, 0, 0.17, 'kb');
    P.box(M.plinth, xc - w / 2 - 0.08, xc + w / 2 + 0.08, 0, 0.9, -0.05, 0.3, 'b');
    for (const y of [2.78, 6.28]) P.box(M.white, xc - w / 2 - 0.12, xc + w / 2 + 0.12, y, y + 0.32, 0, 0.27, 'kb');
    if (!end) {
      P.cyl(M.white, [x, 0.45, 0.25], [x, Y.COR1 - 0.9, 0.25], 0.07, 0.07, 6, false);
      P.cyl(M.white, [x, 0.3, 0.25], [x, 0.5, 0.25], 0.09, 0.07, 6, false);
      if (!arc) pierBox(x);
    }
  }
  if (arc) { /* corner chords: the piers are the chord ends */ for (let k = 0; k <= n; k++) pierBox(k * p); }
  // stone steps at the openings (a single low step along the run, broken by the piers)
  for (const [u0, u1] of freeSpans(K, l, 0, 0.28)) P.box(M.plinthFlat, u0, u1, 0, 0.13, 0.0, 0.28, 'bk');
}


/** Road integrity: the raised (0.13 m) floor / step of the arcade is left out where a mapped lane runs through the arches (streets is built before this module; net.cover = asphalt incl. fillets).
 *  Returns the [u0, u1] spans of the row v0..v1 of the current edge frame that stay free of asphalt (1.2 m cells), or the whole run when nothing is covered. */
function freeSpans(K, l, v0, v1) {
  const st = K.ctx.services && K.ctx.services.streets, vm = (v0 + v1) / 2;
  if (!st) return [[0, l]];
  const n = Math.max(1, Math.ceil(l / 1.2)), out = []; let a = null;
  for (let i = 0; i < n; i++) {
    const um = (i + 0.5) * l / n, w = edgeToWorld(um, vm), w2 = edgeToWorld(um, v0 + (v1 - v0) * 0.15), w3 = edgeToWorld(um, v0 + (v1 - v0) * 0.85);
    const cov = !w || [w, w2, w3].some((q) => st.net.cover(q[0], q[1], {}) > -0.1);
    if (!cov && a === null) a = i * l / n;
    if (cov && a !== null) { out.push([a, i * l / n]); a = null; }
  }
  if (a !== null) out.push([a, l]);
  return out;
}

/** the open gallery behind a run of arches: slab floor, segmental vault (spring 3.7, apex 4.35 m) and the plain back wall (windows are added per bay) */
function gallery(K, l, cuts = []) {
  const P = K.P, M = K.G.M;
  const rows = 4, whole = freeSpans(K, l, -GAL, 0);
  if (whole.length === 1 && whole[0][0] === 0 && whole[0][1] === l) P.quad(M.slab, [0, 0.13, 0.0], [l, 0.13, 0.0], [l, 0.13, -GAL], [0, 0.13, -GAL], [0, 1, 0], [[0, 0], [l / 3, 0], [l / 3, GAL / 3], [0, GAL / 3]]);
  else for (let r = 0; r < rows; r++) {
    const z0 = -GAL * r / rows, z1 = -GAL * (r + 1) / rows;
    for (const [u0, u1] of freeSpans(K, l, z1, z0)) P.quad(M.slab, [u0, 0.13, z0], [u1, 0.13, z0], [u1, 0.13, z1], [u0, 0.13, z1], [0, 1, 0], [[u0 / 3, -z0 / 3], [u1 / 3, -z0 / 3], [u1 / 3, -z1 / 3], [u0 / 3, -z1 / 3]]);
  }
  const seg = 6;
  for (let i = 0; i < seg; i++) {
    const z0 = -GAL * i / seg, z1 = -GAL * (i + 1) / seg, y0 = 3.7 + 0.65 * Math.sin(Math.PI * i / seg), y1 = 3.7 + 0.65 * Math.sin(Math.PI * (i + 1) / seg);
    const nb = Math.max(1, Math.round(l / PITCH));
    P.quad(M.vault, [0, y0, z0], [l, y0, z0], [l, y1, z1], [0, y1, z1], [0, -1, 0], [[0, i / seg], [nb, i / seg], [nb, (i + 1) / seg], [0, (i + 1) / seg]]);
  }
  P.push(0, 0, -GAL, 0);
  if (!cuts.length) K.wallQuad(M.gd, 0, l, 0.13, 3.7, 3);
  else {
    // the back wall in pieces round the openings of the metro doors (rect holes y 0.13 .. 0.13 + h), with jambs, a soffit and a floor strip 0.65 m deep (the ticket hall of the metro module starts there)
    const D = 0.65; let xa = 0;
    for (const c of [...cuts].sort((a, b) => a.x - b.x)) {
      const x0 = c.x - c.w / 2, x1 = c.x + c.w / 2, hy = 0.13 + c.h;
      K.wallQuad(M.gd, xa, x0, 0.13, 3.7, 3); K.wallQuad(M.gd, x0, x1, hy, 3.7, 3); xa = x1;
      P.quad(M.gdShade, [x0, 0.13, 0], [x0, 0.13, -D], [x0, hy, -D], [x0, hy, 0], [1, 0, 0]);
      P.quad(M.gdShade, [x1, 0.13, -D], [x1, 0.13, 0], [x1, hy, 0], [x1, hy, -D], [-1, 0, 0]);
      P.quad(M.vaultPlain, [x0, hy, 0], [x1, hy, 0], [x1, hy, -D], [x0, hy, -D], [0, -1, 0]);
      P.quad(M.slab, [x0, 0.13, 0], [x1, 0.13, 0], [x1, 0.13, -D], [x0, 0.13, -D], [0, 1, 0], [[x0 / 3, 0], [x1 / 3, 0], [x1 / 3, D / 3], [x0 / 3, D / 3]]);
    }
    K.wallQuad(M.gd, xa, l, 0.13, 3.7, 3);
  }
  P.pop();
}

// ------------------------------------------------------------------------------------------------ portico (edge frame of the portico edge: x along, z out; the wall line is z = 0, columns 2 m proud)
function portico(K, e, l, piers, ctx) {
  const P = K.P, G = K.G, M = G.M, KM = K.mats;
  const cx = l / 2, proj = PORT.proj;
  // the wall behind: ground storey with three arches (centre passage 3.2 x 5.0), the upper storey with a big arched window and two niche windows
  const holes = [{ x: cx, y0: 0.13, w: 3.4, h: 5.0, head: 'arch' }, { x: cx - 5.1, y0: 0.13, w: 2.2, h: 3.7, head: 'arch' }, { x: cx + 5.1, y0: 0.13, w: 2.2, h: 3.7, head: 'arch' },
    { x: cx, y0: Y.BELT1, w: 3.4, h: 8.0 - Y.BELT1, head: 'arch' }, { x: cx - 5.1, y0: Y.BELT1 + 0.4, w: 2.0, h: 3.4, head: 'arch' }, { x: cx + 5.1, y0: Y.BELT1 + 0.4, w: 2.0, h: 3.4, head: 'arch' }];
  K.wallWithHoles(M.gd, 0, l, 0, Y.COR1 + 0.5, holes, 4);
  gallery(K, l);
  P.push(0, 0, -GAL, 0); for (const x of [cx - 5.1, cx, cx + 5.1]) K.shopWindow(x, 0.75, 2.2, 2.5, { fw: 0.1, d: 0.08, frameMat: M.white }); P.pop();
  P.box(M.white, 0, l, Y.BELT0, Y.BELT1, 0, 0.2, 'bk');
  for (const [a0, a1] of [[0, cx - 6.2], [cx - 4.0, cx - 1.7], [cx + 1.7, cx + 4.0], [cx + 6.2, l]]) {
    const [wx, wz] = worldOf(e, (a0 + a1) / 2, -T / 2); piers.push({ x: wx, z: wz, w: a1 - a0, d: T, rot: Math.atan2(e.n[0], e.n[1]) });
  }
  for (const hl of holes) {
    const w = hl.w, hs = hl.h - w / 2;
    const sh = new THREE.Shape(); archPath(sh, hl.x, hl.y0, w + 0.7, hs, false); const hole = new THREE.Path(); archPath(hole, hl.x, hl.y0, w, hs, true); sh.holes.push(hole);
    P.face(M.white, sh, 0.05, 1, 8);
  }
  // the lobby glazing + poster boards in the side arches, balconettes in the upper ones
  for (const x of [cx - 5.1, cx + 5.1]) { P.quad(M.balcony, [x - 1.0, Y.BELT1 + 0.4, -0.2], [x + 1.0, Y.BELT1 + 0.4, -0.2], [x + 1.0, Y.BELT1 + 1.45, -0.2], [x - 1.0, Y.BELT1 + 0.4 + 1.05, -0.2], [0, 0, 1], [[0, 0], [2, 0], [2, 1], [0, 1]]); K.glass(KM.winBrown, x, Y.BELT1 + 0.4, 2.0, 3.4, 'arch', 1, -0.4); }
  P.quad(M.balcony, [cx - 1.7, Y.BELT1, 0.7], [cx + 1.7, Y.BELT1, 0.7], [cx + 1.7, Y.BELT1 + 1.05, 0.7], [cx - 1.7, Y.BELT1 + 1.05, 0.7], [0, 0, 1], [[0, 0], [3.4, 0], [3.4, 1], [0, 1]]);
  K.glass(KM.winBrown, cx, Y.BELT1, 3.4, 8.0 - Y.BELT1, 'arch', 3, -0.4);
  P.box(M.white, cx - 2.0, cx + 2.0, Y.BELT0, Y.BELT1, 0, 0.9, 'bk');                                    // the balcony slab of the big window
  // steps of the portico: two grey granite steps, 0.6 m high in total
  P.box(M.plinthFlat, 1.4, l - 1.4, 0, 0.3, 0, proj + 1.4, 'b'); P.box(M.plinthFlat, 1.1, l - 1.1, 0, 0.6, 0, proj + 1.05, 'b');
  // four Tuscan columns (spacing 4.3 / 5.1 / 4.3), shaft 1.15 m, height 7.6 m
  const xs = [cx - 6.85, cx - 2.55, cx + 2.55, cx + 6.85];
  for (const x of xs) {
    const zc = proj - 0.7;
    P.box(M.plinth, x - 0.78, x + 0.78, 0.6, 1.05, zc - 0.78, zc + 0.78, 'b');
    P.cyl(M.white, [x, 1.05, zc], [x, 2.0, zc], 0.62, 0.58, 14, false);
    P.cyl(M.white, [x, 2.0, zc], [x, 7.35, zc], 0.58, 0.5, 14, false);
    P.cyl(M.white, [x, 7.35, zc], [x, 7.5, zc], 0.52, 0.52, 14, true);            // necking ring
    P.cyl(M.white, [x, 7.5, zc], [x, 7.95, zc], 0.52, 0.72, 14, false);           // echinus
    P.box(M.white, x - 0.86, x + 0.86, 7.95, 8.2, zc - 0.86, zc + 0.86, 'b');       // abacus
    { const [wx, wz] = worldOf(e, x, zc); ctx.physics.addCylinder(wx, wz, 0.62, 0, 9); }
  }
  // entablature (architrave, frieze, cornice) across the portico, 2.0 m
  const x0 = cx - 8.45, x1 = cx + 8.45, zf = proj + 0.35;
  P.box(M.white, x0, x1, 8.2, 8.8, 0, zf - 0.15, 'b');
  P.box(M.gd, x0 + 0.05, x1 - 0.05, 8.8, 9.45, 0, zf - 0.05, 'b');
  P.box(M.white, x0 - 0.25, x1 + 0.25, 9.45, 10.0, 0, zf + 0.3, 'b');
  // pediment: raking cornice frame + the yellow tympanum with the sheaf relief
  const yb = 10.0, rise = 1.9, mid = cx;
  const sh = new THREE.Shape(); sh.moveTo(x0 - 0.25, yb); sh.lineTo(x1 + 0.25, yb); sh.lineTo(mid, yb + rise + 0.45); sh.lineTo(x0 - 0.25, yb);
  const ho = new THREE.Path(); ho.moveTo(x0 + 0.8, yb + 0.25); ho.lineTo(mid, yb + rise - 0.3); ho.lineTo(x1 - 0.8, yb + 0.25); ho.lineTo(x0 + 0.8, yb + 0.25); sh.holes.push(ho);
  P.extrude(M.white, sh, 0.1, zf + 0.25, 1, 4);
  const fill = new THREE.Shape(); fill.moveTo(x0 + 0.7, yb + 0.15); fill.lineTo(x1 - 0.7, yb + 0.15); fill.lineTo(mid, yb + rise - 0.2); fill.lineTo(x0 + 0.7, yb + 0.15);
  P.extrude(M.gd, fill, 0.1, zf + 0.0, 1, 4);
  K.plane(G.sheaf || (G.sheaf = sheafMat(K)), mid - 2.6, mid + 2.6, yb + 0.25, yb + 1.55, zf + 0.17);
  // the scrolled attic behind the pediment (top 14.5 m) with the dates 1761 and 1785
  const at = new THREE.Shape(); const pts = [[-7.4, 0], [-7.4, 1.5], [-8.1, 2.2], [-7.6, 3.0], [-6.5, 3.15], [-0.0, 4.55], [6.5, 3.15], [7.6, 3.0], [8.1, 2.2], [7.4, 1.5], [7.4, 0]];
  pts.forEach((q, i) => (i ? at.lineTo(cx + q[0], 10.0 + 0.2 + q[1]) : at.moveTo(cx + q[0], 10.0 + 0.2 + q[1])));
  P.extrude(M.gd, at, -2.4, 0.9, 1, 4);
  K.fascia(cx - 6.8, cx - 4.9, 11.5, 12.5, '1761', { w: 256, h: 128, fg: '#e8dcc0', transparent: true, z: -1.46, size: 0.55 });
  K.fascia(cx + 4.9, cx + 6.8, 11.5, 12.5, '1785', { w: 256, h: 128, fg: '#e8dcc0', transparent: true, z: -1.46, size: 0.55 });
  // white dice + railing on the attic ends
  // colliders: behind the columns the wall is the pier ring; the three openings lead to the gallery / passage
}
function worldOf(e, x, z) {
  const rot = Math.atan2(e.n[0], e.n[1]), xa = [e.n[1], -e.n[0]], fwd = (e.b[0] - e.a[0]) * xa[0] + (e.b[1] - e.a[1]) * xa[1] > 0, o = fwd ? e.a : e.b;
  void rot;
  return [o[0] + xa[0] * x + e.n[0] * z, o[1] + xa[1] * x + e.n[1] * z];
}
/** a wheat-sheaf trophy: two sheaves with a cartouche between (alpha, 2.6 : 1) */
function sheafMat(K) {
  const tex = K.ctx.tex, T = K.ctx.mat.toon;
  const map = tex.draw(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const sheaf = (cx, flip) => {
      g.save(); g.translate(cx, h - 8); g.scale(flip, 1); g.fillStyle = '#f3eee2';
      for (let i = -5; i <= 5; i++) { g.save(); g.rotate(i * 0.085); g.beginPath(); g.ellipse(0, -62, 6, 56, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.fillRect(-16, -62, 32, 10); g.fillStyle = '#c4baa6'; g.fillRect(-18, -64, 36, 4); g.restore();
    };
    sheaf(120, 1); sheaf(392, -1);
    g.fillStyle = '#f3eee2'; g.beginPath(); g.ellipse(256, 80, 54, 38, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#f3eee2'; g.lineWidth = 8; g.beginPath(); g.moveTo(150, 130); g.quadraticCurveTo(256, 160, 362, 130); g.stroke();
    g.fillStyle = '#c4baa6'; g.beginPath(); g.ellipse(256, 80, 40, 26, 0, 0, Math.PI * 2); g.fill();
  }, { key: 'lmE-sheaf', repeat: [1, 1] });
  const m = T('#ffffff', { map, alphaTest: 0.45, side: 'double', name: 'lmE-sheaf' }); K.decalMats.add(m); return m;
}

// ------------------------------------------------------------------------------------------------ the rounded corner pavilions (world frame)
function cornerPavilion(K, es, c) {
  const P = K.P, M = K.G.M, n = es.length;
  // pairs of columns at the chord vertices: n = 7 -> 1, 3, 4, 6; n = 5 -> 1, 2, 3, 4; others: all inner vertices
  const verts = n === 7 ? [1, 3, 4, 6] : n === 5 ? [1, 2, 3, 4] : Array.from({ length: n - 1 }, (_, i) => i + 1);
  const outward = (j) => { const a = es[j - 1], b = es[j]; const nx = a.n[0] + b.n[0], nz = a.n[1] + b.n[1], l = Math.hypot(nx, nz) || 1; return [nx / l, nz / l]; };
  for (const j of verts) {
    const v = es[j].a, nn = outward(j), tt = [nn[1], -nn[0]];
    for (const s of [-1, 1]) {
      const x = v[0] + nn[0] * 1.35 + tt[0] * s * 0.78, z = v[1] + nn[1] * 1.35 + tt[1] * s * 0.78;
      P.box(M.plinth, x - 0.75, x + 0.75, 0, 1.2, z - 0.75, z + 0.75, 'b');
      P.cyl(M.white, [x, 1.2, z], [x, 2.2, z], 0.62, 0.6, 14, false);
      P.cyl(M.white, [x, 2.2, z], [x, 7.6, z], 0.6, 0.52, 14, false);
      P.cyl(M.white, [x, 7.6, z], [x, 7.75, z], 0.54, 0.54, 14, true);
      P.cyl(M.white, [x, 7.75, z], [x, 8.15, z], 0.54, 0.74, 14, false);
      P.box(M.white, x - 0.88, x + 0.88, 8.15, 8.4, z - 0.88, z + 0.88, 'b');
      K.ctx.physics.addCylinder(x, z, 0.66, 0, 9);
    }
  }
  // attic: yellow dice over every pair of columns, iron railing along the arc (on the cornice 9.2 -> 10.2)
  for (const j of verts) {
    const v = es[j].a, nn = outward(j);
    const x = v[0] + nn[0] * 1.2, z = v[1] + nn[1] * 1.2, rot = Math.atan2(nn[0], nn[1]);
    P.push(x, 0, z, rot);
    P.box(M.gd, -1.15, 1.15, Y.COR1 + 0.35, Y.DICE1 + 0.7, -0.5, 0.5, 'b'); P.box(M.white, -1.25, 1.25, Y.DICE1 + 0.7, Y.DICE1 + 0.85, -0.6, 0.6, 'b');
    P.pop();
  }
  const pts = es.map((e) => [e.a[0] + e.n[0] * 1.5, e.a[1] + e.n[1] * 1.5]); const last = es[n - 1]; pts.push([last.b[0] + last.n[0] * 1.5, last.b[1] + last.n[1] * 1.5]);
  K.railing(pts, Y.COR1 + 0.3, 0.95, false);
}

// ------------------------------------------------------------------------------------------------ courtyard walls
function courtWalls(K, edges) {
  const P = K.P, M = K.G.M, ctx = K.ctx;
  const tex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#ead08c'; g.fillRect(0, 0, w, h);
    const px = 256 / 3.9, ph = 256 / 9.2;
    // ground arches (dark shop glass), upper windows (white frames)
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 8, h);
    g.fillStyle = '#34414c'; g.beginPath(); g.moveTo(px * 0.8, ph * 4.4); g.lineTo(px * 0.8, ph * 1.6); g.arc(px * 1.95, ph * 1.6, px * 1.15, Math.PI, 0); g.lineTo(px * 3.1, ph * 4.4); g.fill();
    g.fillStyle = '#f2efe6'; g.fillRect(0, ph * 4.3, w, ph * 0.5);
    g.fillStyle = '#34414c'; g.fillRect(px * 1.0, ph * 5.5, px * 1.9, ph * 2.0);
    g.strokeStyle = '#f2efe6'; g.lineWidth = 4; g.strokeRect(px * 1.0, ph * 5.5, px * 1.9, ph * 2.0); g.beginPath(); g.moveTo(px * 1.95, ph * 5.5); g.lineTo(px * 1.95, ph * 7.5); g.stroke();
    g.fillStyle = '#f2efe6'; g.fillRect(0, ph * 8.2, w, ph * 0.8);
  }, { key: 'lmE-court', repeat: [1, 1] });
  const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmE-court' });
  for (const e of edges) {
    if (e.len < 1.2) continue;
    onEdge(P, e, (l) => {
      P.quad(mat, [0, 0.0, 0], [l, 0.0, 0], [l, Y.COR1, 0], [0, Y.COR1, 0], [0, 0, 1], [[0, 0], [l / 3.9, 0], [l / 3.9, 1], [0, 1]]);
      P.box(M.white, -0.05, l + 0.05, Y.COR1 - 0.4, Y.COR1 + 0.1, 0, 0.35, 'bk');
    });
  }
}

// ------------------------------------------------------------------------------------------------ chimneys on the ridges (yellow stacks with white caps)
function chimneys(K, ringW, holesW) {
  const P = K.P, M = K.G.M, rng = K.ctx.rng(8812);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ringW) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const segs = []; for (const r of [ringW, ...holesW]) for (let i = 0; i < r.length; i++) segs.push([r[i], r[(i + 1) % r.length]]);
  const dist = (x, z) => { let d = 1e9; for (const [a, b] of segs) { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d; };
  let cnt = 0;
  for (let x = x0; x < x1; x += 14) for (let z = z0; z < z1; z += 14) {
    const px = x + rng() * 10, pz = z + rng() * 10;
    if (!inRing(ringW, px, pz) || holesW.some((h) => inRing(h, px, pz))) continue;
    const d = dist(px, pz); if (d < 4 || d > 9 || rng() > 0.22) continue;
    const y = Math.min(13.2, Y.EAVE + 0.3 * d);
    P.box(M.gd, px - 0.45, px + 0.45, y - 0.3, y + 2.0, pz - 0.45, pz + 0.45, 'b'); P.box(M.white, px - 0.58, px + 0.58, y + 2.0, y + 2.25, pz - 0.58, pz + 0.58, 'b'); cnt++;
  }
}
void toUV; void ROT; void rectPath;
