// landmarksAurora/school.js - the NAKHIMOV NAVAL SCHOOL = the Peter the Great City School House (A. I. Dmitriev with A. N. Benois, 1909-12), Petrogradskaya emb. 2-4, on the baked footprint
// w28712204 (36 points).  Dossier docs/research/aurora.md section 3; photos 31 (east front from the river), 34 (south front, frontal), 36 (tower risalit: clock, bust), 35, 38, 42.
// FIVE storeys (OSM says 4): L1 0-4.5 and L2 4.5-8.9 = the grey-green base with white rusticated piers, string course 8.9-9.4, L3 9.4-13.7 and L4 13.7-18.0 sky blue with white lesenes /
// giant columns, entablature 18.0-18.9, attic L5 18.9-21.9 (oval oculi on the long wing, rectangular windows on the risalits and the south front), top cornice 21.9-22.4, a mansard roof
// «с переломом» (dark graphite-brown since 2018), the big segmental pediments (south front: relief; tower risalit: the clock on a white cartouche), the bronze bust of Peter I in a white
// cartouche on the tower risalit, the tower: hipped dome roof, platform, octagonal blue-and-white lantern (29.6-34.4), dark cap, needle spire with the gilded ship: tip 50.3 m.
// Edge styles (ring index = edge from point i to i + 1): 0 = south front, 31 = east main wing (tower risalit centred 16 m from its north end, a 3-bay gabled risalit at its south end),
// 33 = the recess, 35 = the south pavilion, 30 = the north end: modelled relief; every other edge (court, hall wing) = flat walls with painted windows.
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { bust, figureMats, cached } from '../lib/figures.js';
import { ringEdges, onEdge, band } from './kit.js';
import { hipRoof } from './roofs.js';
import * as G from './geo.js';
import { SCHOOL_ID, pairs } from './frame.js';

const Y = { L2: 4.5, band0: 8.9, L3: 9.4, L4: 13.7, ent: 18.0, L5: 18.9, cor: 21.9, eave: 22.4, brk: 25.3 };
const TOWER_FROM_NORTH = 16, RISALIT_W = 16;

function inflate(ring, d) {                                                // + = outward
  const n = ring.length; let a = 0; for (let i = 0; i < n; i++) { const p = ring[i], q = ring[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
  const sgn = a > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n];
    const nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sgn, -dx / l * sgn]; };
    const n1 = nrm(p0, p1), n2 = nrm(p1, p2);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]));
    out.push([p1[0] + mx * d * k, p1[1] + mz * d * k]);
  }
  return out;
}
/** rectangle with a segmental top: w wide, h high in all, the arc rises `rise` over the springing */
const segPts = (cx, y0, w, h, rise, n = 8) => { const pts = [[cx - w / 2, y0], [cx + w / 2, y0]]; for (let i = 0; i <= n; i++) { const u = i / n, x = cx + w / 2 - w * u; pts.push([x, y0 + h - rise + rise * Math.sin(Math.PI * u)]); } return pts; };

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const rec = L.buildingById(SCHOOL_ID); if (!rec) throw new Error('Nakhimov school footprint w28712204 missing');
  const poly = rec.polys[0], ring = pairs(poly.o), edges = ringEdges(poly, 0.05);
  const edgeAt = (i) => edges.find((e) => e.i === i);
  const FRONT = { 0: 'S', 31: 'E', 33: 'C', 35: 'V', 30: 'N', 32: 'R', 34: 'R' };

  // ---------------------------------------------------------------- mitred bands around the whole house: plinth, string course, entablature + cornice shelf, top cornice
  const tr = { front: M.trim, top: M.trim, under: M.trimShade };
  band(P, edges, 0, 0.9, 0.09, { front: M.plinth, top: M.plinth }, { uvs: 2 });
  band(P, edges, Y.band0, Y.L3, 0.2, tr); band(P, edges, Y.L3 - 0.14, Y.L3, 0.34, tr);
  band(P, edges, Y.ent, Y.L5 - 0.3, 0.26, tr); band(P, edges, Y.L5 - 0.3, Y.L5, 0.72, tr);
  band(P, edges, Y.cor, Y.eave - 0.16, 0.3, tr); band(P, edges, Y.eave - 0.16, Y.eave, 0.6, tr);

  // ---------------------------------------------------------------- facade vocabulary (facade frame: x right, y up, z out)
  const quadW = (mat, x0, x1, y0, y1, z = 0, uv) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], uv);
  const frame = (x0, x1, y0, y1, f = 0.16, d = 0.1, z = 0) => {                 // white surround of a rectangular opening
    P.box(M.trim, x0 - f, x0, y0, y1 + f, z, z + d, 'kb'); P.box(M.trim, x1, x1 + f, y0, y1 + f, z, z + d, 'kb');
    P.box(M.trim, x0, x1, y1, y1 + f, z, z + d, 'kb'); P.box(M.trim, x0 - f * 1.3, x1 + f * 1.3, y0 - 0.14, y0, z, z + d + 0.06, 'k');
  };
  const win = (xc, y0, w, h, mat = M.win34, z = 0) => { quadW(mat, xc - w / 2, xc + w / 2, y0, y0 + h, z + 0.035, [[0, 0], [1, 0], [1, 1], [0, 1]]); frame(xc - w / 2, xc + w / 2, y0, y0 + h, 0.16, 0.1, z); };
  const segWin = (xc, y0, w, h, rise = 0.45, mat = M.win34, z = 0) => {
    P.push(0, 0, z, 0);
    G.planeShape(P, mat, segPts(xc, y0, w, h, rise), 0.035);
    G.frameRing(P, M.trim, segPts(xc, y0 - 0.12, w + 0.36, h + 0.3, rise + 0.06), segPts(xc, y0, w, h, rise), 0, 0.1, 1);
    P.box(M.trim, xc - 0.16, xc + 0.16, y0 + h - 0.05, y0 + h + 0.42, 0, 0.16, 'kb');                              // keystone
    P.pop();
  };
  const oculus = (xc, yc, rx, ry, z = 0) => {
    const c = new THREE.CircleGeometry(1, 14); P.geo(M.port, c, xc, yc, z + 0.035, 0, 0, 0, rx, ry, 1); c.dispose();
    const r = new THREE.RingGeometry(1, 1.32, 14); P.geo(M.trim, r, xc, yc, z + 0.06, 0, 0, 0, rx, ry, 1); r.dispose();
  };
  const lesene = (xc, z = 0, w = 0.52) => {                                       // flat giant pilaster L3-L4 with a base block and a capital
    P.box(M.trim, xc - w / 2, xc + w / 2, Y.L3 + 0.5, Y.ent - 0.45, z, z + 0.11, 'kb');
    P.box(M.trim, xc - w / 2 - 0.1, xc + w / 2 + 0.1, Y.L3, Y.L3 + 0.5, z, z + 0.17, 'k'); P.box(M.trim, xc - w / 2 - 0.12, xc + w / 2 + 0.12, Y.ent - 0.45, Y.ent, z, z + 0.2, 'k');
    P.box(M.trimShade, xc - w / 2 + 0.1, xc + w / 2 - 0.1, Y.L4 - 0.9, Y.L4 + 0.5, z + 0.11, z + 0.13, 'k');
  };
  const pier = (xc, z = 0, w = 1.0) => {                                          // white rusticated pier of the base (L1-L2): eleven courses
    for (let k = 0; k < 11; k++) { const y0 = 0.9 + k * 0.727; P.box(M.trim, xc - w / 2, xc + w / 2, y0 + 0.04, y0 + 0.727, z, z + 0.14, 'kb'); }
    P.box(M.trimShade, xc - w / 2 + 0.03, xc + w / 2 - 0.03, 0.9, Y.band0, z, z + 0.1, 'kb');
  };
  const column = (xc, z) => {                                                     // three-quarter giant column on a rusticated pedestal
    P.box(M.trim, xc - 0.62, xc + 0.62, Y.L3, Y.L3 + 1.5, z, z + 0.95, 'k'); for (let k = 1; k < 4; k++) P.box(M.trimShade, xc - 0.63, xc + 0.63, Y.L3 + k * 0.375 - 0.02, Y.L3 + k * 0.375 + 0.02, z, z + 0.96, 'k');
    P.col(M.trim, xc, z + 0.45, Y.L3 + 1.5, Y.ent - 0.7, 0.44, 0.38, 12, false);
    P.col(M.trim, xc, z + 0.45, Y.L3 + 1.5, Y.L3 + 1.72, 0.52, 0.46, 12, false);
    P.box(M.trim, xc - 0.6, xc + 0.6, Y.ent - 0.7, Y.ent, z, z + 1.02, 'k'); P.col(M.trimShade, xc, z + 0.45, Y.ent - 1.0, Y.ent - 0.7, 0.4, 0.58, 12, false);
    P.box(M.trim, xc - 0.7, xc + 0.7, Y.ent, Y.L5, z, z + 1.1, 'k');
  };
  const portal = (xc, w, h, z = 0, wood = true) => {                               // arched door with a white surround and a cartouche hood
    P.push(0, 0, z, 0);
    G.planeShape(P, wood ? M.door : M.winBrown, G.archPts(xc, 0.25, w, h, 10), 0.04);
    G.planeShape(P, M.winBrown, G.archPts(xc, 0.25 + h - w / 2 - 0.1, w * 0.86, w / 2 * 0.9 + 0.1, 8), 0.06);
    G.frameRing(P, M.trim, G.archPts(xc, 0.1, w + 0.7, h + 0.5, 10), G.archPts(xc, 0.25, w, h, 10), 0, 0.2, 1);
    P.box(M.trim, xc - w / 2 - 0.9, xc + w / 2 + 0.9, 0.25 + h + 0.45, 0.25 + h + 0.7, 0, 0.5, 'k');
    const g = new THREE.SphereGeometry(1, 10, 6); P.geo(M.trim, g, xc, 0.25 + h + 0.2, 0.22, 0, 0, 0, w * 0.32, 0.42, 0.2); g.dispose();
    P.box(M.plinth, xc - w / 2 - 0.3, xc + w / 2 + 0.3, 0, 0.25, 0, 0.9, 'kb', 2);
    P.pop();
  };
  /** the big segmental pediment: a gable wall from y0 with a white archivolt; `kind` 'relief' | 'clock' | 'plain' */
  const pediment = (xc, w, y0, rise, z, kind) => {
    P.push(0, 0, z, 0);
    const arc = (ww, r, yy, n = 14) => { const pts = [[xc - ww / 2, yy], [xc + ww / 2, yy]]; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; pts.push([xc + Math.cos(a) * ww / 2, yy + Math.sin(a) * r]); } return pts; };
    G.solid(P, M.blue, arc(w, rise, y0), -0.6, 0.6, 3);
    G.frameRing(P, M.trim, arc(w + 0.9, rise + 0.55, y0), arc(w - 0.5, rise - 0.3, y0), -0.6, 0.95, 1);
    P.box(M.trim, xc - w / 2 - 0.6, xc + w / 2 + 0.6, y0 - 0.25, y0 + 0.08, -0.6, 0.5, '');
    const blob = (x, y, rx, ry, rz = 0.22) => { const g = new THREE.SphereGeometry(1, 9, 6); P.geo(M.trim, g, x, y, 0.05, 0, 0, 0, rx, ry, rz); g.dispose(); };
    if (kind === 'relief') { blob(xc, y0 + rise * 0.42, w * 0.3, rise * 0.24); blob(xc - w * 0.2, y0 + rise * 0.3, w * 0.13, rise * 0.17); blob(xc + w * 0.2, y0 + rise * 0.3, w * 0.13, rise * 0.17); blob(xc, y0 + rise * 0.66, w * 0.07, rise * 0.14, 0.3); blob(xc - w * 0.33, y0 + rise * 0.2, w * 0.07, rise * 0.1); blob(xc + w * 0.33, y0 + rise * 0.2, w * 0.07, rise * 0.1); }
    if (kind === 'clock') {
      blob(xc, y0 + rise * 0.52, w * 0.27, rise * 0.3); blob(xc - w * 0.22, y0 + rise * 0.4, w * 0.11, rise * 0.2); blob(xc + w * 0.22, y0 + rise * 0.4, w * 0.11, rise * 0.2); blob(xc, y0 + rise * 0.8, w * 0.08, rise * 0.1, 0.3);
      const yc = y0 + 1.45, c = new THREE.CircleGeometry(1.08, 20); P.geo(M.clock, c, xc, yc, 0.34); c.dispose();
      const r = new THREE.RingGeometry(1.08, 1.26, 20); P.geo(M.gold, r, xc, yc, 0.345); r.dispose();
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; P.push(xc + Math.sin(a) * 0.9, yc + Math.cos(a) * 0.9, 0.35, 0); P.box(M.roofDark, -0.04, 0.04, -0.09, 0.09, 0, 0.01, 'k'); P.pop(); }
      P.quad(M.roofDark, [xc - 0.05, yc, 0.36], [xc + 0.05, yc, 0.36], [xc + 0.38, yc + 0.5, 0.36], [xc + 0.3, yc + 0.56, 0.36], [0, 0, 1]);          // 10:10 hands
      P.quad(M.roofDark, [xc - 0.04, yc, 0.365], [xc + 0.04, yc, 0.365], [xc - 0.62, yc + 0.5, 0.365], [xc - 0.68, yc + 0.44, 0.365], [0, 0, 1]);
      blob(xc, y0 - 1.0, w * 0.1, 0.5, 0.2);
    }
    P.pop();
  };

  // ---------------------------------------------------------------- walls edge by edge
  for (const e of edges) onEdge(P, e, (len) => {
    const st = FRONT[e.i];
    if (!st || st === 'R') {                                                       // court / hall wing / returns: flat walls, painted windows
      const nb = len < 2.6 ? 0 : Math.max(1, Math.round(len / 3.2));
      if (nb && !st) { quadW(M.backBase, 0, len, 0, Y.band0, 0, [[0, 0], [nb, 0], [nb, 2], [0, 2]]); quadW(M.backBlue, 0, len, Y.L3, Y.ent, 0, [[0, 0], [nb, 0], [nb, 2], [0, 2]]); quadW(M.backBlue, 0, len, Y.L5, Y.cor, 0, [[0, 0], [nb, 0], [nb, 1], [0, 1]]); }
      else { quadW(M.base, 0, len, 0, Y.band0); quadW(M.blue, 0, len, Y.L3, Y.ent); quadW(M.blue, 0, len, Y.L5, Y.cor); }
      return;
    }
    quadW(M.base, 0, len, 0, Y.band0); quadW(M.blue, 0, len, Y.L3, Y.ent); quadW(M.blue, 0, len, Y.L5, Y.cor);
    P.box(M.trim, 0, len, Y.L2 - 0.12, Y.L2 + 0.1, 0, 0.07, 'k');
    const regular = (x0, x1, o = {}) => {                                          // a run of ordinary bays between x0 and x1
      const nb = Math.max(1, Math.round((x1 - x0) / 3.25)), p = (x1 - x0) / nb;
      for (let i = 0; i < nb; i++) {
        const xc = x0 + (i + 0.5) * p;
        win(xc, 1.7, 1.5, 2.2); segWin(xc, 5.25, 2.0, 3.05);
        P.box(M.trim, xc - 0.9, xc + 0.9, Y.L2 + 0.2, Y.L2 + 0.6, 0, 0.05, 'kb');
        win(xc, Y.L3 + 0.85, 1.5, 2.85); win(xc, Y.L4 + 0.75, 1.5, 2.7);
        P.box(M.trim, xc - 0.75, xc + 0.75, Y.L4 - 0.45, Y.L4 + 0.45, 0, 0.05, 'kb');
        if (o.l5 === 'oval') oculus(xc, (Y.L5 + Y.cor) / 2, 0.48, 0.7); else win(xc, Y.L5 + 0.6, 1.3, 1.85, M.win23);
        if (i > 0) lesene(x0 + i * p);
      }
      if (o.ends !== false) { lesene(x0 + 0.3); lesene(x1 - 0.3); }
      if (o.piers) { pier(x0 + 0.55); pier(x1 - 0.55); }
    };
    if (st === 'N' || st === 'V' || st === 'C') { regular(0, len, { l5: 'rect', piers: st !== 'C' }); return; }
    if (st === 'E') {
      const c = len - TOWER_FROM_NORTH, r0 = c - RISALIT_W / 2, r1 = c + RISALIT_W / 2, sr = 10.6;
      regular(0, sr, { l5: 'rect', piers: true });                                 // the 3-bay south risalit of the main wing (curved gable above)
      pediment(sr / 2, sr - 1.6, Y.eave, 3.0, 0, 'plain'); oculus(sr / 2, Y.eave + 1.25, 0.55, 0.75, 0.01);
      regular(sr, r0, { l5: 'oval' });
      regular(r1, len, { l5: 'rect', piers: true });
      // ---- the tower risalit: a block 0.8 m proud with piers, portals, paired giant columns, the bust cartouche, the clock pediment
      const Z = 0.8;
      for (const [x, n] of [[r0, -1], [r1, 1]]) P.quad(M.base, [x, 0, 0], [x, 0, Z], [x, Y.band0, Z], [x, Y.band0, 0], [n, 0, 0]), P.quad(M.blue, [x, Y.L3, 0], [x, Y.L3, Z], [x, Y.cor, Z], [x, Y.cor, 0], [n, 0, 0]);
      quadW(M.base, r0, r1, 0, Y.band0, Z); quadW(M.blue, r0, r1, Y.L3, Y.cor, Z);
      P.box(M.plinth, r0 - 0.09, r1 + 0.09, 0, 0.9, 0, Z + 0.09, 'kb', 2);
      P.box(M.trim, r0 - 0.2, r1 + 0.2, Y.band0, Y.L3, 0, Z + 0.2, 'k'); P.box(M.trim, r0 - 0.34, r1 + 0.34, Y.L3 - 0.14, Y.L3, 0, Z + 0.34, 'k');
      P.box(M.trim, r0 - 0.26, r1 + 0.26, Y.ent, Y.L5 - 0.3, 0, Z + 0.26, 'k'); P.box(M.trim, r0 - 0.72, r1 + 0.72, Y.L5 - 0.3, Y.L5, 0, Z + 0.72, 'k');
      P.box(M.trim, r0 - 0.3, r1 + 0.3, Y.cor, Y.eave - 0.16, 0, Z + 0.3, 'k'); P.box(M.trim, r0 - 0.6, r1 + 0.6, Y.eave - 0.16, Y.eave, 0, Z + 0.6, 'k');
      const bp = RISALIT_W / 5;
      for (let i = 0; i <= 5; i++) pier(r0 + i * bp + (i === 0 ? 0.5 : i === 5 ? -0.5 : 0), Z);
      for (let i = 0; i < 5; i++) {
        const xc = r0 + (i + 0.5) * bp, side = i === 0 || i === 4;
        if (side) portal(xc, 1.9, 3.3, Z); else segWin(xc, 1.2, 1.7, 2.9, 0.85, M.win34, Z);
        segWin(xc, 5.25, side ? 1.5 : 1.8, 3.0, 0.45, M.win34, Z);
        if (i !== 2) { win(xc, Y.L3 + 0.85, side ? 1.2 : 1.5, 2.85, M.win34, Z); win(xc, Y.L4 + 0.75, side ? 1.2 : 1.5, 2.7, M.win34, Z); }
        else { win(xc, Y.L3 + 0.5, 1.5, 1.9, M.win34, Z); win(xc, Y.L4 + 1.95, 1.5, 1.6, M.win23, Z); }
        if (side) win(xc, Y.L5 + 0.6, 1.2, 1.85, M.win23, Z);
      }
      for (const dx of [-RISALIT_W / 2 + 0.75, -bp * 1.5, bp * 1.5, RISALIT_W / 2 - 0.75]) column(c + dx, Z);
      // the bust of Peter I in its white cartouche (between the L3 and L4 windows of the middle bay)
      { const g = new THREE.SphereGeometry(1, 12, 8); P.geo(M.trim, g, c, Y.L4 + 0.45, Z + 0.05, 0, 0, 0, 1.35, 1.75, 0.3); g.dispose();
        const g2 = new THREE.SphereGeometry(1, 12, 8); P.geo(M.blueShade, g2, c, Y.L4 + 0.5, Z + 0.22, 0, 0, 0, 0.92, 1.25, 0.18); g2.dispose();
        for (const [dx, dy, r] of [[-1.25, 1.2, 0.42], [1.25, 1.2, 0.42], [-1.2, -1.15, 0.4], [1.2, -1.15, 0.4], [0, 1.9, 0.5], [0, -1.85, 0.45]]) { const q = new THREE.SphereGeometry(1, 8, 6); P.geo(M.trim, q, c + dx, Y.L4 + 0.45 + dy, Z + 0.12, 0, 0, 0, r, r * 0.8, 0.22); q.dispose(); }
        const mk = figureMats(ctx).keys('bronze', 'bronze');
        cached('lmAu-peterNiche', () => bust({ style: 'bare', detail: 0.55, turn: -0.25, face: { hair: 'curly', beard: 'moustache', age: 0.35 } })).place(P, mk, c, Y.L4 - 0.45, Z + 0.34, 0, 2.5);
        P.box(M.trim, c - 0.75, c + 0.75, Y.L4 - 0.75, Y.L4 - 0.45, Z, Z + 0.75, 'k'); }
      pediment(c, 12.4, Y.cor + 0.5, 4.9, Z, 'clock');
      return;
    }
    // ---- the south front (43 m, symmetrical; photo 34)
    const pil = [1.3, 10.0, 14.8, 28.2, 33.0, 41.7].map((v) => v * len / 43);
    for (const x of pil) { lesene(x, 0, 0.75); pier(x, 0, 1.15); }
    const f = len / 43, cx = len / 2;
    for (const x of [3.9, 7.6, 35.4, 39.1]) { segWin(x * f, 5.25, 2.2, 3.05); win(x * f, Y.L3 + 0.85, 2.2, 2.85); win(x * f, Y.L4 + 0.75, 2.2, 2.7); P.box(M.trim, x * f - 1.1, x * f + 1.1, Y.ent - 0.75, Y.ent - 0.45, 0, 0.3, 'k'); }
    for (const x of [11.5, 13.3, 29.7, 31.5]) { win(x * f, 5.4, 1.1, 2.7, M.win23); win(x * f, Y.L3 + 0.85, 1.1, 2.85, M.win23); win(x * f, Y.L4 + 0.75, 1.1, 2.7, M.win23); }
    for (const x of [17.9, 21.5, 25.1]) { segWin(x * f, 5.25, 2.4, 3.05); for (const d of [-0.75, 0.75]) { win(x * f + d, Y.L3 + 0.85, 1.05, 2.85, M.win23); win(x * f + d, Y.L4 + 0.75, 1.05, 2.7, M.win23); } P.box(M.trim, x * f - 1.5, x * f + 1.5, Y.ent - 0.8, Y.ent - 0.45, 0, 0.32, 'k'); }
    for (const x of [3.0, 5.7, 8.4, 34.6, 37.3, 40.0]) { win(x * f, 1.7, 1.25, 2.1, M.win23); win(x * f, Y.L5 + 0.6, 1.25, 1.85, M.win23); }
    for (const x of [12.4, 30.6]) { portal(x * f, 2.0, 3.4); win(x * f, Y.L5 + 0.6, 1.4, 1.85, M.win23); }
    for (const x of [17.9, 21.5, 25.1]) win(x * f, Y.L5 + 0.6, 1.4, 1.85, M.win23);
    portal(cx, 3.0, 4.0); for (const d of [-3.75, 3.75]) { oculus(cx + d, 2.6, 0.72, 0.72); P.box(M.trim, cx + d - 0.3, cx + d + 0.3, 3.5, 4.0, 0, 0.18, 'k'); }
    pediment(cx, 16.2 * f, Y.eave, 4.4, 0, 'relief');
  });

  // ---------------------------------------------------------------- roof: mansard break around the simplified ring, flat deck, low hips on the three big wings, caps of the stair towers
  const keep = ring.map((_, i) => i).filter((i) => !(i >= 4 && i <= 8) && !(i >= 12 && i <= 16) && !(i >= 24 && i <= 26));
  const R0 = keep.map((i) => ring[i]), RE = inflate(R0, 0.6), RI = inflate(R0, -1.55);
  let sA = 0; for (let i = 0; i < R0.length; i++) { const p = R0[i], q = R0[(i + 1) % R0.length]; sA += p[0] * q[1] - q[0] * p[1]; }
  for (let i = 0; i < R0.length; i++) {
    const j = (i + 1) % R0.length, a = RE[i], b = RE[j], c = RI[j], d = RI[i], dx = R0[j][0] - R0[i][0], dz = R0[j][1] - R0[i][1], l = Math.hypot(dx, dz) || 1, sg = sA > 0 ? 1 : -1;
    P.quad(M.roof, [a[0], Y.eave, a[1]], [b[0], Y.eave, b[1]], [c[0], Y.brk, c[1]], [d[0], Y.brk, d[1]], [dz / l * sg * 0.8, 0.6, -dx / l * sg * 0.8], [[0, 0], [l / 2.4, 0], [l / 2.4, 1.5], [0, 1.5]]);
  }
  P.cap(M.roof, RI, Y.brk, true, 2.4);
  for (const [a, b] of [[3, 9], [11, 17], [23, 27]]) { const q = []; for (let i = a; i <= b; i++) q.push(ring[i]); if (q.length >= 3) P.cap(M.roofDark, q, Y.eave + 0.02, true, 2.4); }
  const eE = edgeAt(31), eS = edgeAt(0);
  const rectIn = (e, a0, a1, depth, inset = 1.7) => {                             // a rectangle behind edge e: along a0..a1 from its `a` end... in the edge's own frame
    const dx = (e.b[0] - e.a[0]) / e.len, dz = (e.b[1] - e.a[1]) / e.len, nx = -e.n[0], nz = -e.n[1];
    const pt = (u, v) => [e.a[0] + dx * u + nx * v, e.a[1] + dz * u + nz * v];
    return [pt(a0 + inset, inset), pt(a1 - inset, inset), pt(a1 - inset, depth - inset), pt(a0 + inset, depth - inset)];
  };
  try {
    hipRoof(P, M.roof, rectIn(eE, 0, eE.len, 14.8), Y.brk, 1.6, 0);
    hipRoof(P, M.roof, rectIn(eS, 0, eS.len, 17.8), Y.brk, 1.6, 0);
  } catch (err) { console.warn('[landmarksAurora] school hips:', err && err.message); }
  // chimneys (blue with white caps) and the small lanterns
  const along = (e, u, v) => { const dx = (e.b[0] - e.a[0]) / e.len, dz = (e.b[1] - e.a[1]) / e.len; return [e.a[0] + dx * u - e.n[0] * v, e.a[1] + dz * u - e.n[1] * v]; };
  const eaN = eE.a[1] < eE.b[1];                                                 // is the edge's `a` end the north one?
  const uE = (fromSouth) => (eaN ? eE.len - fromSouth : fromSouth);
  for (const [e, u, v] of [[eE, uE(20), 7.4], [eE, uE(33), 7.4], [eE, uE(5.3), 5], [eS, eS.len * 0.36, 7.5], [eS, eS.len * 0.64, 7.5]]) { const [x, z] = along(e, u, v); P.box(M.blue, x - 0.55, x + 0.55, Y.brk, Y.brk + 3.4, z - 0.55, z + 0.55, 'b'); P.box(M.trim, x - 0.68, x + 0.68, Y.brk + 3.4, Y.brk + 3.62, z - 0.68, z + 0.68, ''); }
  { const [x, z] = along(eS, eS.len / 2, 6); P.col(M.blue, x, z, Y.brk + 1.2, Y.brk + 3.0, 0.8, 0.8, 8, false); G.lathe(P, M.roofDark, 'lmAuCap', [[1.1, 0], [0.95, 0.35], [0.4, 0.8], [0.1, 1.2], [0, 1.5]], x, Y.brk + 3.0, z, 0.9, 0.9, 10, 8); }

  // ---------------------------------------------------------------- the tower over the risalit
  {
    const c = uE(eE.len - TOWER_FROM_NORTH), [tx, tz] = along(eE, c, 4.4), rot = Math.atan2(eE.n[0], eE.n[1]);
    P.push(tx, 0, tz, rot);                                                       // local +z = out to the river, x along the front
    const hx = RISALIT_W / 2 - 0.4, hz = 5.2, fr = (y0, y1, a0, b0, a1, b1) => {  // one tier of the dome-like hipped roof (rectangular frustum)
      for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = sx ? [[sx * a0, y0, -sx * b0], [sx * a0, y0, sx * b0], [sx * a1, y1, sx * b1], [sx * a1, y1, -sx * b1]] : [[sz * a0, y0, sz * b0], [-sz * a0, y0, sz * b0], [-sz * a1, y1, sz * b1], [sz * a1, y1, sz * b1]];
        P.quad(M.roof, q[0], q[1], q[2], q[3], [sx * 0.7, 0.7, sz * 0.7], [[0, 0], [3, 0], [3, 1.5], [0, 1.5]]);
      }
    };
    fr(Y.eave, 25.6, hx, hz, hx - 1.9, hz - 1.5); fr(25.6, 28.2, hx - 1.9, hz - 1.5, 3.9, 3.2); fr(28.2, 29.6, 3.9, 3.2, 2.9, 2.9);
    P.box(M.trim, -3.1, 3.1, 29.6, 29.85, -3.1, 3.1, '');                           // the platform with its railing
    for (const s of [-1, 1]) { for (let k = 0; k <= 6; k++) { P.cyl(M.iron, [s * 3.0, 29.85, -3 + k], [s * 3.0, 30.8, -3 + k], 0.03, 0.03, 4, false); P.cyl(M.iron, [-3 + k, 29.85, s * 3.0], [-3 + k, 30.8, s * 3.0], 0.03, 0.03, 4, false); } P.box(M.iron, s * 3.0 - 0.03, s * 3.0 + 0.03, 30.76, 30.82, -3, 3, ''); P.box(M.iron, -3, 3, 30.76, 30.82, s * 3.0 - 0.03, s * 3.0 + 0.03, ''); }
    const dirs = G.frustum(P, M.blue, 0, 0, 29.85, 34.3, 8, 1.8, 1.8, Math.PI / 8, 1, 1);     // the octagonal lantern
    for (const d of dirs) { const r = 1.8 * Math.cos(Math.PI / 8); P.push(d.x * r, 0, d.z * r, d.ang); G.planeShape(P, M.mouth, G.archPts(0, 30.7, 0.72, 2.7, 8), 0.02); G.frameRing(P, M.trim, G.archPts(0, 30.55, 1.0, 3.05, 8), G.archPts(0, 30.7, 0.72, 2.7, 8), 0, 0.06, 1); P.pop(); }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; P.cyl(M.trim, [Math.sin(a) * 1.8, 29.85, Math.cos(a) * 1.8], [Math.sin(a) * 1.8, 34.3, Math.cos(a) * 1.8], 0.14, 0.14, 6, false); }
    G.frustum(P, M.trim, 0, 0, 34.3, 34.6, 8, 2.15, 2.25, Math.PI / 8, 1, 1, { capTop: M.trim });
    G.lathe(P, M.roofDark, 'lmAuTowerCap', [[2.1, 0], [1.95, 0.45], [1.35, 1.15], [0.62, 1.75], [0.36, 2.3], [0.3, 2.6]], 0, 34.6, 0, 1, 1, 16, 10);
    P.col(M.roofDark, 0, 0, 37.2, 49.3, 0.3, 0.035, 8, false); P.col(M.roofDark, 0, 0, 37.0, 37.3, 0.42, 0.42, 8, true);
    G.ball(P, M.gold, 0, 49.45, 0, 0.2, 10);
    P.cyl(M.gold, [0, 49.6, 0], [0, 50.35, 0], 0.025, 0.02, 5, false);                                                                                   // the gilded ship weathervane
    for (const s of [0.012, -0.012]) { P.fan(M.gold, [[-0.5, 49.78, s], [0.45, 49.78, s], [0.62, 49.95, s], [-0.42, 49.95, s]], [0, 0, Math.sign(s)]); P.fan(M.gold, [[-0.28, 50.0, s], [0.3, 50.0, s], [0.22, 50.34, s], [-0.2, 50.3, s]], [0, 0, Math.sign(s)]); }
    P.pop();
    svc.tower = { x: tx, z: tz, h: 50.35 };
  }

  // ---------------------------------------------------------------- colliders, services
  addPolyColliders(ctx, poly, 0, 24);
  svc.monuments.push({ id: SCHOOL_ID, name: 'Нахимовское военно-морское училище', x: rec.cx, z: rec.cz, h: 50 });
  { const [x, z] = along(eS, eS.len / 2, -1.2); svc.entrances.push({ x, z, rotY: Math.atan2(eS.n[0], eS.n[1]), bldg: SCHOOL_ID, closed: true }); }
  void ph;
}
