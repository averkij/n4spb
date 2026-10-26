// landmarksMariinsky/theatre.js - the walls of the Mariinsky Theatre (A. Cavos 1859-60, V. Schroeter 1883-96): every edge of the OSM ring of r1690283 (57 vertices, rectilinear in the theatre frame T of frame.js)
// gets a facade in its own frame.  The portico block (central five bays, two avant-corps, canopy) is drawn by portico.js, the side entrance by side(); the rest is the "Cavos wing" vocabulary read from the
// photos 20 / 22 / 05 / 08: rusticated ground floor with arched openings, two floors of pedimented windows over pierced balustrade panels, an attic row, a stepped cornice.  Mint wall #a8c8ac, cream trim.
// Heights are scaled from the photos (door 3.3 m): block cornice 18.3 m, wings 16 m, the north stage blocks 19-22 m.  docs/research/mariinsky.md sections 2.2, 3.
import { BUILDINGS } from '../data/city.js';
import { ringEdges, onEdge, band } from './kit.js';
import { chainsOf, chainBays } from './geo.js';
import { TL, NX, NZ, UX, UZ, frameAt } from './frame.js';
import { portico as porticoParts } from './parts.js';
import { plaqueMat } from './plaques.js';

export const H_BLOCK = 18.3, H_WING = 16.0, H_NFRONT = 19.0, H_NBACK = 22.0;

export function theatreData() {
  const rec = BUILDINGS.find((b) => b.id === 'r1690283');
  const poly = rec.polys[0];
  const edges = ringEdges(poly, 0.05);
  for (const e of edges) {
    const A = TL(e.a[0], e.a[1]), B = TL(e.b[0], e.b[1]);
    e.T = { ua: A[0], na: A[1], ub: B[0], nb: B[1], um: (A[0] + B[0]) / 2, nm: (A[1] + B[1]) / 2 };
    const dn = e.n[0] * NX + e.n[1] * NZ, du = e.n[0] * UX + e.n[1] * UZ;
    e.face = dn > 0.7 ? '+n' : dn < -0.7 ? '-n' : du > 0.7 ? '+u' : du < -0.7 ? '-u' : 'diag';
    const t = e.T;
    e.kind = (Math.min(t.na, t.nb) >= -2.3 && Math.max(Math.abs(t.ua), Math.abs(t.ub)) <= 17.3 && Math.min(t.ua, t.ub) >= -17.3) ? 'portico'
      : (e.face === '+u' && Math.abs(t.um - 23.6) < 0.6 && t.nm < -8 && t.nm > -20 && e.len > 8) ? 'side' : 'plain';
    e.H = hOf(e);
  }
  return { rec, poly, outer: edges.filter((e) => !e.hole), inner: edges.filter((e) => e.hole) };
}
function hOf(e) {
  const { um, nm } = e.T;
  if (um > 24) return H_WING;
  if (um >= -25 && nm > -21) return H_BLOCK;
  if (um < -24.5 && nm > -36) return H_NFRONT;
  if (um < -24.5) return H_NBACK;
  return H_WING;
}

/** the plain "Cavos wing" bay, drawn in the frame of the chain sample (x = 0 on the bay axis, z out of the wall); H = cornice height of the wall */
export function bayPlain(K, M, H, o = {}) {
  const P = K.P, tr = M.trim;
  const nf = Math.max(1, Math.floor((H - 4.9 - 2.0) / 4.35));
  // ground floor: arched opening with an archivolt, a light stone sill band
  K.window({ x: 0, y: 1.0, w: 1.5, h: 3.3, head: 'arch', sw: 0.2, d: 0.08, surMat: tr, sill: false, frame: 'white', v: (o.i ?? 0) % 4 });
  for (let f = 0; f < nf; f++) {
    const y0 = 4.9 + f * 4.35, h = f === 0 ? 2.45 : 2.2, w = f === 0 ? 1.35 : 1.25;
    K.balustrade(-w / 2 - 0.15, w / 2 + 0.15, y0 + 0.08, 0.78, 0.14, tr);
    K.window({ x: 0, y: y0 + 0.95, w, h, head: 'flat', sw: f === 0 ? 0.2 : 0.15, d: 0.1, surMat: tr, sill: true, frame: 'white', hood: f === 0 ? 'tri' : null, hoodH: 0.5, v: ((o.i ?? 0) + f) % 4 });
  }
  const ya = 4.9 + nf * 4.35 + 0.1;
  if (ya + 1.0 < H - 1.0) K.window({ x: 0, y: ya + 0.25, w: 0.95, h: Math.min(0.9, H - 1.3 - ya - 0.25), head: 'flat', sw: 0.1, d: 0.06, surMat: tr, sill: false, frame: 'white', v: ((o.i ?? 0) + 2) % 4 });
}

export function buildWalls(K, M, D) {
  const P = K.P;
  const { outer, inner } = D;
  const plain = outer.filter((e) => e.kind !== 'portico');
  for (const e of outer) {
    if (e.kind === 'portico') continue;
    onEdge(P, e, (len) => {
      K.wallQuad(M.wallRust, 0, len, 0.0, 4.6, 2.4, 0, 1.2);
      K.wallQuad(M.wall, 0, len, 4.6, e.H, 3);
    });
  }
  for (const e of inner) onEdge(P, e, (len) => { K.wallQuad(M.wallRust, 0, len, 0, 4.6, 2.4, 0, 1.2); K.wallQuad(M.wall, 0, len, 4.6, H_WING, 3); });
  // ---- mitred bands (granite plinth, string courses, the stepped cornice); heights follow each wall
  const draw = (e) => e.len >= 0.3 && e.kind !== 'portico';
  const Hh = (e) => e.H;
  band(P, outer, 0, 0.9, 0.06, { front: M.graniteLight, top: M.graniteLight }, { draw });
  band(P, outer, 4.6, 4.95, 0.14, { front: M.trim, top: M.trim, under: M.trimShade }, { draw });
  band(P, outer, (e) => (e.H > 17 ? 9.0 : 9.0), (e) => (e.H > 17 ? 9.3 : 9.3), 0.1, { front: M.trim, top: M.trim, under: M.trimShade }, { draw });
  band(P, outer, (e) => e.H - 1.55, (e) => e.H - 1.2, 0.1, { front: M.trim, top: M.trim, under: M.trimShade }, { draw });
  band(P, outer, (e) => e.H - 1.2, (e) => e.H - 0.85, 0.16, { front: K.mats.dentil, top: M.trim, under: M.trimShade }, { draw, uvs: 0.6 });
  band(P, outer, (e) => e.H - 0.85, (e) => e.H - 0.4, 0.5, { front: M.trim, top: M.trim, under: M.trimShade }, { draw });
  band(P, outer, (e) => e.H - 0.4, (e) => e.H + 0.35, 0.24, { front: M.wall, top: M.trim, under: M.trimShade }, { draw });
  void Hh;
  // ---- windows by chains of edges (bays flow along runs of collinear edges); the side-entrance wall and the portico are drawn separately
  const chains = chainsOf(plain.filter((e) => e.kind === 'plain' && e.len >= 2.6), () => true, 0.5);
  let bays = 0;
  for (const ch of chains) {
    for (const b of chainBays(ch, 3.15, 1.1, 1.8, 1.1)) {
      K.P.push(b.x, 0, b.z, b.rot);
      try { bayPlain(K, M, b.edge.H, { i: b.i }); } finally { K.P.pop(); }
      bays++;
    }
  }
  K.bayCount = bays;
  // ---- drainpipes (pale green) at the corners of the long runs
  for (const e of plain) if (e.len > 6 && e.kind === 'plain') onEdge(P, e, (len) => { K.downpipe(0.35, 0, e.H - 1.0, M.pipe); K.downpipe(len - 0.35, 0, e.H - 1.0, M.pipe); });
  // ---- colliders: thin walls on every edge
  const ph = K.ctx.physics;
  for (const e of outer) {
    const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue;
    ph.addBox((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, l + 0.45, 0.9, Math.atan2(-dz, dx), 0, Math.min(e.H + 0.5, 22));
  }
}

/** the side entrance in the south wall of the portico block (edge 36: u = 23.6, n -19.9 .. -8.6): a porch with two columns and a pediment, a brown double door, a tall arched window above */
export function buildSide(K, M, svc) {
  const P = K.P, tr = M.trim;
  const cn = -14.25;
  P.push(...frameAt(23.6, cn, 'u'));
  try {
    // the wall is the generic one of edge 36 (plain rust + mint quads); here: bays + porch
    porticoParts(K, { x0: -2.9, x1: 2.9, depth: 1.25, y0: 0.2, y1: 3.9, r: 0.27, xs: [-1.7, 1.7], ent: 0.9, ped: 1.25, mat: tr, matShade: M.trimShade, wallMat: M.wall, steps: false });
    K.gate(0, 0.2, 1.7, 3.5, { sw: 0.28, ring: true, doorMat: M.door });
    // porch floor / step
    P.box(M.granite, -3.2, 3.2, 0, 0.2, 0, 2.2, 'b');
    K.window({ x: 0, y: 6.4, w: 1.6, h: 3.6, head: 'arch', sw: 0.3, d: 0.14, surMat: tr, sill: false, frame: 'white', v: 1 });
    for (const x of [-3.6, 3.6]) K.window({ x, y: 5.9, w: 1.3, h: 2.4, head: 'flat', sw: 0.2, d: 0.1, surMat: tr, sill: true, frame: 'white', hood: 'tri', hoodH: 0.5 });
    for (const x of [-3.6, 0, 3.6]) K.window({ x, y: 10.6, w: 1.25, h: 2.2, head: 'flat', sw: 0.15, d: 0.1, surMat: tr, sill: true, frame: 'white' });
    for (const x of [-2.2, 2.2]) K.window({ x, y: 1.1, w: 0.9, h: 1.6, head: 'arch', sw: 0.16, d: 0.08, surMat: tr, sill: false, frame: 'white' });
    // memorial plaque «Памяти сотрудников, погибших в Великую Отечественную войну 1941—1945 гг.» right of the porch (1967)
    const labels = K.ctx.services.labels, [lx, lz] = K.TW(23.6 + 0.05, cn + 5.03);
    if (!labels || labels.reserve(0, lx + 0.03 * UX, 2.4, lz + 0.03 * UZ, 0.8, 1.0, UX, UZ, 'plate-landmark')) {
      P.box(K.mats.iron, 4.6, 5.46, 1.87, 2.93, 0.005, 0.025, 'kb');
      K.plane(plaqueMat(K, 'lmM-plq-mar', ['Памяти', 'сотрудников,', 'погибших в', 'Великую', 'Отечественную', 'войну', '1941—1945 гг.'], { w: 512, h: 640, bg: '#3a3d40', fg: '#e3dcc6', rim: '#b9a46a' }), 4.65, 5.41, 1.9, 2.9, 0.03);
    }
  } finally { P.pop(); }
  svc.entrances.push({ x: K.TW(23.6 + 2.2, cn)[0], z: K.TW(23.6 + 2.2, cn)[1], name: 'Боковой вход', kind: 'side' });
}
