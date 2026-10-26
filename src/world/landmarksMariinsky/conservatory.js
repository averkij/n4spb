// landmarksMariinsky/conservatory.js - the St Petersburg Conservatory (V. Nicolas 1891-96 inside the walls of the Bolshoi Kamenny theatre; restored 2015-25: cream-yellow and ivory).  OSM r1083410: an 8-vertex ring,
// rectilinear in the frame S of frame.js (u along the north front, n out of it): 88.8 m north front (n = 0), the Great Hall block behind (n -44 .. -82), the Tsar's entrance block projecting on the south (u -0.5 .. 25.8).
// NORTH FRONT (photo 40, 47): rusticated ground floor, piano nobile with hooded windows, second floor, a garland frieze, cornice with dentils, a continuous balustrade; in the middle a balcony and a portico of four
// Ionic columns with a triangular pediment (lyre relief in the tympanum); a pair of doors on the axis, a carriage arch at the right.  WEST / EAST / SOUTH: the Great Hall arcades (tall arched twin windows,
// mascarons, garlands) and the Ionic porch of the Tsar's entrance with a pediment.  Heights from photos 40 41 47 (door 2.6 m): cornice 17.6 m, balustrade 18.8 m, Great Hall block 22 m.
import { BUILDINGS } from '../data/city.js';
import { ringEdges, onEdge, band } from './kit.js';
import { SL, SW, SN, SU } from './frame.js';
import { portico } from './parts.js';
import { plaqueMat, hang } from './plaques.js';
import { ringFlat } from './geo.js';

export const HC = 17.6, HC_HALL = 22.0, NCUT = -44.0;

function classify(e) {
  const A = SL(e.a[0], e.a[1]), B = SL(e.b[0], e.b[1]);
  e.S = { ua: A[0], na: A[1], ub: B[0], nb: B[1], um: (A[0] + B[0]) / 2, nm: (A[1] + B[1]) / 2 };
  const t = e.S;
  const dn = e.n[0] * SN[0] + e.n[1] * SN[1], du = e.n[0] * SU[0] + e.n[1] * SU[1];
  e.face = dn > 0.7 ? 'N' : dn < -0.7 ? 'S' : du > 0.7 ? 'E' : du < -0.7 ? 'W' : 'diag';
  return e;
}
/** split an edge at the S-frame line n = cut (when it crosses it) so that every piece has one wall height */
function splitAt(e, cut) {
  const { na, nb } = e.S;
  if (!((na - cut) * (nb - cut) < 0)) return [e];
  const t = (cut - na) / (nb - na);
  const m = [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t];
  const mk = (a, b) => classify({ ...e, a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
  return [mk(e.a, m), mk(m, e.b)];
}

function hOfE(e) { return e.S.nm > NCUT ? HC : HC_HALL; }

/** one north-front wing bay (pitch 3.7 m): ground window, hooded piano-nobile window, second-floor window, garland frieze plaque */
function bayNorth(K, M, i, arch = false) {
  const tr = M.consTrim;
  if (arch) { K.gate(0, 0, 2.6, 3.4, { sw: 0.3, ring: true, doorMat: M.door, ringMat: tr }); }
  else K.window({ x: 0, y: 1.0, w: 1.3, h: 2.2, head: 'flat', sw: 0.16, d: 0.08, surMat: tr, sill: true, frame: 'white', v: i % 4 });
  K.window({ x: 0, y: 5.7, w: 1.4, h: 2.9, head: 'flat', sw: 0.2, d: 0.12, surMat: tr, sill: true, frame: 'white', hood: i % 2 ? 'seg' : 'tri', hoodH: 0.55, v: (i + 1) % 4 });
  K.balustrade(-0.85, 0.85, 5.1, 0.7, 0.14, tr);
  K.window({ x: 0, y: 11.0, w: 1.25, h: 2.3, head: 'flat', sw: 0.16, d: 0.1, surMat: tr, sill: true, frame: 'white', v: (i + 2) % 4 });
  K.window({ x: 0, y: 15.0, w: 0.8, h: 0.7, head: 'flat', sw: 0.1, d: 0.05, surMat: tr, sill: false, frame: 'white', v: i % 4 });
}
/** the Great Hall arcade bay (pitch 4.4): ground arched window, tall twin arched windows with a mascaron, a smaller tier above */
function bayHall(K, M, H, i) {
  const tr = M.consTrim;
  K.window({ x: 0, y: 1.0, w: 1.4, h: 3.2, head: 'arch', sw: 0.2, d: 0.1, surMat: tr, sill: false, frame: 'white', v: i % 4 });
  for (const dx of [-0.85, 0.85]) K.window({ x: dx, y: 5.9, w: 1.2, h: 4.4, head: 'arch', sw: 0.16, d: 0.12, surMat: tr, sill: false, frame: 'white', v: (i + 1) % 4 });
  K.pilaster(tr, 0, 0.3, 5.9, 9.4, 0.14, 0.3);
  K.plane(K.R.mascaron, -0.4, 0.4, 10.5, 11.3, 0.12);
  K.balustrade(-1.9, 1.9, 5.2, 0.65, 0.14, tr);
  if (H > 20) {
    for (const dx of [-0.85, 0.85]) K.window({ x: dx, y: 12.6, w: 1.1, h: 2.4, head: 'arch', sw: 0.14, d: 0.1, surMat: tr, sill: false, frame: 'white', v: (i + 2) % 4 });
    K.window({ x: 0, y: 18.4, w: 1.3, h: 1.6, head: 'flat', sw: 0.12, d: 0.06, surMat: tr, sill: false, frame: 'white' });
  } else K.window({ x: 0, y: 12.2, w: 1.3, h: 2.4, head: 'flat', sw: 0.14, d: 0.1, surMat: tr, sill: true, frame: 'white', v: (i + 2) % 4 });
}

export function build(K, M, D, svc) {
  const P = K.P;
  const rec = BUILDINGS.find((b) => b.id === 'r1083410');
  const poly = rec.polys[0];
  const raw = ringEdges(poly, 0.05).map(classify);
  const edges = raw.filter((e) => !e.hole).flatMap((e) => (e.face === 'E' || e.face === 'W' ? splitAt(e, NCUT) : [e]));
  const inner = raw.filter((e) => e.hole);
  for (const e of edges) e.H = hOfE(e);
  // ---- walls
  for (const e of edges) onEdge(P, e, (len) => { K.wallQuad(M.consRust, 0, len, 0, 4.6, 2.4, 0, 1.2); K.wallQuad(M.cons, 0, len, 4.6, e.H, 3); });
  for (const e of inner) onEdge(P, e, (len) => { K.wallQuad(M.consRust, 0, len, 0, 4.6, 2.4, 0, 1.2); K.wallQuad(M.cons, 0, len, 4.6, HC, 3); });
  // ---- bands
  const draw = (e) => e.len >= 0.3;
  band(P, edges, 0, 0.9, 0.05, { front: M.graniteLight, top: M.graniteLight }, { draw });
  band(P, edges, 4.6, 4.95, 0.14, { front: M.consTrim, top: M.consTrim, under: M.consTrimShade }, { draw });
  band(P, edges, 9.3, 9.65, 0.1, { front: M.consTrim, top: M.consTrim, under: M.consTrimShade }, { draw });
  band(P, edges, (e) => e.H - 2.3, (e) => e.H - 1.9, 0.08, { front: M.consTrim, top: M.consTrim, under: M.consTrimShade }, { draw });
  band(P, edges, (e) => e.H - 1.2, (e) => e.H - 0.85, 0.16, { front: K.mats.dentil, top: M.consTrim, under: M.consTrimShade }, { draw, uvs: 0.6 });
  band(P, edges, (e) => e.H - 0.85, (e) => e.H - 0.0, 0.5, { front: M.consTrim, top: M.consTrim, under: M.consTrimShade }, { draw });
  // garland frieze on the long fronts
  for (const e of edges) if (e.len > 6) onEdge(P, e, (len) => K.strip(K.R.frieze, 0.8, len - 0.8, e.H - 2.25, e.H - 1.25, 0.1, 4));
  // balustrade along the roof edge
  for (const e of edges) onEdge(P, e, (len) => { P.push(0, 0, -0.05); K.balustrade(0.3, len - 0.3, e.H, 1.05, 0.4, M.consTrim); P.pop(); for (let x = 0.3; x < len - 0.2; x += 3.7) P.box(M.consTrim, x - 0.22, x + 0.22, e.H, e.H + 1.15, 0.02, 0.46, 'b'); });
  // ---- bays: north front (pitch 3.7: 24 bays, the middle 4 stay for the portico), west / east / south fronts: the Great Hall arcades
  for (const e of edges) {
    if (e.len < 6) continue;
    if (e.face === 'N') {
      onEdge(P, e, (len) => {
        const n = Math.round(len / 3.7), p = len / n;
        for (let i = 0; i < n; i++) {
          const x = p * (i + 0.5), mid = Math.abs(x - len / 2) < 6.5;
          if (mid) continue;
          P.push(x, 0, 0); try { bayNorth(K, M, i, i === n - 4); } finally { P.pop(); }
        }
        // the centre: ground floor doors and windows under the balcony, the balcony, the Ionic portico with a pediment
        const cx = len / 2;
        for (const dx of [-5.55, -1.85, 1.85, 5.55]) K.window({ x: cx + dx, y: 1.0, w: 1.3, h: 2.2, head: 'flat', sw: 0.16, d: 0.08, surMat: M.consTrim, sill: true, frame: 'white' });
        K.gate(cx, 0.0, 2.4, 3.3, { sw: 0.3, ring: true, doorMat: M.door, ringMat: M.consTrim, open: false });
        P.box(M.consTrim, cx - 7.8, cx + 7.8, 8.7, 9.3, 0, 2.3, '');
        P.push(0, 0, 1.5); K.balustrade(cx - 7.8, cx + 7.8, 9.3, 0.95, 0.5, M.consTrim); P.pop();
        for (const dx of [-7.7, 7.7]) P.box(M.consTrim, cx + dx - 0.3, cx + dx + 0.3, 9.3, 10.4, 1.8, 2.4, 'b');
        for (let i = 0; i < 4; i++) { const x = cx + (i - 1.5) * 3.7; K.window({ x, y: 5.7, w: 1.4, h: 2.9, head: 'flat', sw: 0.2, d: 0.12, surMat: M.consTrim, sill: true, frame: 'white', hood: i % 2 ? 'seg' : 'tri' }); }
        for (const x of [cx - 3.7, cx, cx + 3.7]) K.window({ x, y: 10.6, w: 1.3, h: 3.2, head: 'flat', sw: 0.18, d: 0.08, surMat: M.consTrim, sill: true, frame: 'white' });
        portico(K, { x0: cx - 7.6, x1: cx + 7.6, depth: 1.6, y0: 9.3, y1: 14.9, r: 0.4, xs: [cx - 5.55, cx - 1.85, cx + 1.85, cx + 5.55], ent: 1.6, ped: 2.3, mat: M.consTrim, matShade: M.consTrimShade, wallMat: M.cons, steps: false, ionic: true });
        P.push(0, 0, 0.3); K.plane(K.R.lyre, cx - 1.6, cx + 1.6, 17.6, 19.4, 1.9); P.pop();
      });
    } else if ((e.face === 'W' || e.face === 'E' || e.face === 'S') && !(e.S.nm < -80 && e.len > 20)) {
      onEdge(P, e, (len) => { const n = Math.max(1, Math.round((len - 2.4) / 4.4)), p = (len - 2.4) / n; for (let i = 0; i < n; i++) { P.push(1.2 + p * (i + 0.5), 0, 0); try { bayHall(K, M, e.H, i); } finally { P.pop(); } } });
    }
  }
  // ---- plaques beside the north door (name plate, memorial plaque to the students who fell in the war)
  for (const e of edges) if (e.face === 'N' && e.len > 60) {
    const cx = e.len / 2;
    hang(K, e, cx - 3.55, 1.95, 0.9, 1.1, plaqueMat(K, 'lmM-plq-cons', ['САНКТ-ПЕТЕРБУРГСКАЯ', 'ГОСУДАРСТВЕННАЯ', 'КОНСЕРВАТОРИЯ', 'имени Н. А.', 'РИМСКОГО-КОРСАКОВА'], { w: 512, h: 640, bg: '#25324a', fg: '#f3efe2' }), 'plate-landmark');
    hang(K, e, cx + 3.55, 1.95, 0.9, 1.1, plaqueMat(K, 'lmM-plq-war', ['Светлой памяти', 'студентов, аспирантов,', 'педагогов Ленинградской', 'консерватории, отдавших', 'жизнь за свободу', 'и независимость', 'нашей Родины', '1941—1945'], { w: 512, h: 640, bg: '#3a3d40', fg: '#e3dcc6', rim: '#b9a46a' }), 'plate-landmark');
  }
  // ---- the Tsar's entrance on the south front: Ionic porch on the projecting block
  for (const e of edges) if (e.face === 'S' && e.S.nm < -80 && e.len > 20) onEdge(P, e, (len) => {
    const cx = len / 2;
    portico(K, { x0: cx - 9.5, x1: cx + 9.5, depth: 1.9, y0: 0.35, y1: 9.4, r: 0.55, xs: [cx - 6.2, cx - 2.1, cx + 2.1, cx + 6.2], ent: 1.9, ped: 2.6, mat: M.consTrim, matShade: M.consTrimShade, wallMat: M.cons, steps: true, ionic: true });
    K.gate(cx, 0.35, 2.4, 3.6, { sw: 0.3, ring: true, doorMat: M.door, ringMat: M.consTrim });
    for (const dx of [-5, 5]) K.gate(cx + dx * 0.0 + dx, 0.35, 1.8, 3.2, { sw: 0.25, ring: true, doorMat: M.door, ringMat: M.consTrim });
    // two stucco female figures with lyres at the ends of the pediment (simple standing forms)
    for (const dx of [-8.6, 8.6]) { const x = cx + dx; P.cyl(M.consTrim, [x, 12.0, 2.2], [x, 14.2, 2.2], 0.32, 0.22, 8, true); P.geo(M.consTrim, new (K.THREE.SphereGeometry)(0.22, 8, 6), x, 14.5, 2.2); P.box(M.consTrim, x - 0.4, x + 0.4, 11.7, 12.0, 1.9, 2.5, 'b'); P.box(M.consTrim, x + (dx < 0 ? 0.25 : -0.6), x + (dx < 0 ? 0.6 : -0.25), 13.0, 14.4, 2.1, 2.3, 'b'); }
  });
  // ---- roofs: flat sheet-iron caps (the north block, the Great Hall block), the Hall's clerestory
  const ring = ringFlat(poly.o), wells = poly.h.map(ringFlat);
  P.cap(M.roof, ring, HC + 0.04, true, 1.2, wells);
  const hall = [[-44.4, NCUT], [44.4, NCUT], [44.4, -76.2], [25.8, -76.2], [25.8, -81.7], [-0.4, -81.7], [-0.4, -76.0], [-44.3, -76.0]].map(([u, n]) => SW(u, n));
  P.cap(M.roof, hall, HC_HALL + 0.05, true, 1.2);
  for (const [u, n] of [[-30, -20], [-12, -30], [16, -25], [32, -35], [-34, -60], [-10, -62], [14, -58], [34, -64], [-20, -10]]) { const [x, z] = SW(u, n); const y = n < NCUT ? HC_HALL + 0.05 : HC + 0.04; P.push(x, 0, z, 0); P.box(M.cons, -0.5, 0.5, y, y + 2.2, -0.5, 0.5, 'b'); P.box(M.consTrimShade, -0.62, 0.62, y + 2.2, y + 2.4, -0.62, 0.62, 'b'); P.pop(); }
  // the Great Hall roof lantern (a low glazed clerestory)
  { const [x, z] = SW(-8, -62); P.push(x, 0, z, 0); P.box(M.cons, -9, 9, HC_HALL, HC_HALL + 1.8, -7, 7, 'b'); P.box(M.roof, -9.3, 9.3, HC_HALL + 1.8, HC_HALL + 2.2, -7.3, 7.3, 'b'); P.pop(); }
  // ---- colliders (thin walls) and services
  const ph = K.ctx.physics;
  for (const e of edges) { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue; ph.addBox((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, l + 0.45, 0.9, Math.atan2(-dz, dx), 0, e.H + 1); }
  const [nx, nz] = SW(0, 3.5), [tx, tz] = SW(12.6, -86);
  svc.entrances.push({ x: nx, z: nz, name: 'Консерватория: главный вход', kind: 'main', rotY: Math.atan2(SN[0], SN[1]) }, { x: tx, z: tz, name: 'Консерватория: Царский подъезд', kind: 'tsar', rotY: Math.atan2(-SN[0], -SN[1]) });
  svc.crowd.push({ x: nx, z: nz + 0, r: 8, n: 4, name: 'conservatory-north' });
}
