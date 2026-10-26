// landmarksMariinsky/square.js - the two gardens of Teatralnaya Square (dossier docs/research/mariinsky.md section 5; photos 40, 52, 27, 28, 47): the Rimsky-Korsakov garden (OSM park r3110157 poly 2, 80 x 28 m,
// north of the Conservatory across the one-way street) and the Glinka garden (poly 1, 85 x 17 m, south of it).  Both are drawn in the Conservatory frame S (frame.js: u along the north front towards the ENE,
// n out of it to the NNW): gravel alleys 3 m wide (OSM footways w102589009 / 016 / 010, w743381938 / 39 / 40), granite kerbs round clipped lawns, a granite-paved plaza round each monument, low green
// spear-top railings, two rows of horse chestnuts / limes (instanced, trunk colliders), silver multi-globe cast-iron lamps, wooden benches on the OSM bench nodes, pansy beds, and the two Art Nouveau pavilions
// (Театральная пл. 5 and 7).  Nothing stands on a carriageway: every object is inside the OSM park polygons.  The monuments themselves are in monuments.js.
import * as THREE from 'three';
import { BUILDINGS, FURNITURE } from '../data/city.js';
import { SW, SL, SN, SU } from './frame.js';
import { ringEdges, onEdge, Parts } from './kit.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import { plantTrees } from './trees.js';
import { ringFlat } from './geo.js';

// north garden (S frame): u -37..6.8 (west of the cross alley), n 17..47: alleys A1 n = 36.1, A2 n = 27.1, link u = -16.3
const NG = { u0: -37, u1: 43, n0: 19, n1: 47, ax: 6.8, a1: 36.1, a2: 27.1, link: -16.3 };
// south garden: u -37..48, n -115..-96, alley n = -105.5 (u -37 .. 43), cross alleys u = -20 and 13
const SG = { u0: -37, u1: 48, n0: -115, n1: -96, ay: -105.5, c1: -20, c2: 13 };

export function build(K, M, D, svc) {
  const P = K.P, ctx = K.ctx, ph = ctx.physics;
  const T = ctx.mat.toon, tex = ctx.tex;
  const w = (u, n) => SW(u, n);
  const Y_LAWN = 0.06, Y_GRAVEL = 0.075, Y_PAVE = 0.09;
  const quadS = (mat, u0, u1, n0, n1, y, uvs = 4) => { const a = w(u0, n0), b = w(u1, n0), c = w(u1, n1), d = w(u0, n1); P.quad(mat, [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], [0, 1, 0], [[a[0] / uvs, a[1] / uvs], [b[0] / uvs, b[1] / uvs], [c[0] / uvs, c[1] / uvs], [d[0] / uvs, d[1] / uvs]]); };
  /** a straight box strip between two S points (kerbs, rails) */
  const strip = (mat, u0, n0, u1, n1, y0, y1, th) => {
    const a = w(u0, n0), b = w(u1, n1), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.05) return;
    P.push((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, Math.atan2(dx, dz));
    P.box(mat, -th / 2, th / 2, y0, y1, -l / 2, l / 2, '');
    P.pop();
  };
  const kerbRect = (u0, u1, n0, n1) => { for (const [a, b, c, d] of [[u0, n0, u1, n0], [u1, n0, u1, n1], [u1, n1, u0, n1], [u0, n1, u0, n0]]) strip(M.graniteLight, a, b, c, d, 0, 0.14, 0.2); };
  const lawn = (u0, u1, n0, n1) => { quadS(M.lawn, u0, u1, n0, n1, Y_LAWN, 4); kerbRect(u0 - 0.1, u1 + 0.1, n0 - 0.1, n1 + 0.1); };
  /** low green cast-iron railing with spear finials (photo 40, bottom right): rails + posts, 0.55 m, no collider */
  const rail = (u0, n0, u1, n1, h = 0.6) => {
    const a = w(u0, n0), b = w(u1, n1), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.5) return;
    P.push(a[0], 0, a[1], Math.atan2(dx, dz));
    P.box(M.fenceGreen, -0.02, 0.02, h - 0.1, h - 0.05, 0, l, '');
    P.box(M.fenceGreen, -0.02, 0.02, 0.12, 0.17, 0, l, '');
    const n = Math.max(2, Math.round(l / 0.16));
    for (let i = 0; i <= n; i++) { const z = l * i / n; P.box(M.fenceGreen, -0.01, 0.01, 0.1, h - 0.1, z - 0.01, z + 0.01, 'tb'); P.cyl(M.fenceGreen, [0, h - 0.1, z], [0, h + 0.08, z], 0.02, 0.002, 4, false); }
    for (let i = 0; i <= Math.round(l / 2.4); i++) { const z = l * i / Math.max(1, Math.round(l / 2.4)); P.box(M.fenceGreen, -0.04, 0.04, 0, h + 0.1, z - 0.04, z + 0.04, 'b'); }
    P.pop();
  };
  // ------------------------------------------------------------------ north garden
  const g = NG;
  // lawns between the alleys (clipped, with kerbs)
  lawn(-36, g.ax - 1.8, g.a1 + 1.7, g.n1 - 1.4);                  // P1: between the Dekabristov side and alley A1
  lawn(-36, g.ax - 1.8, g.n0 + 1.2, g.a2 - 1.7);                  // P3: between alley A2 and the Teatralnaya street side
  lawn(g.link + 1.7, g.ax - 1.8, g.a2 + 1.7, g.a1 - 1.7);         // P2 east of the link
  // gravel alleys, the cross alley, the link
  quadS(M.gravel, -41, g.ax + 1.5, g.a1 - 1.5, g.a1 + 1.5, Y_GRAVEL);
  quadS(M.gravel, -41, g.ax + 1.5, g.a2 - 1.5, g.a2 + 1.5, Y_GRAVEL);
  quadS(M.gravel, g.ax - 1.5, g.ax + 1.5, g.n0 - 2.5, g.n1 + 0.8, Y_GRAVEL);
  quadS(M.gravel, g.link - 1.5, g.link + 1.5, g.a2, g.a1, Y_GRAVEL);
  // the granite plaza round the Rimsky-Korsakov monument (u -36 .. -17.8, n 27.6 .. 35.4) and its apron of pansies
  const RKU = -22.95, RKN = 31.44;
  quadS(M.paving, -36, g.link - 1.7, g.a2 + 1.7, g.a1 - 1.7, Y_PAVE, 2);
  kerbRect(-36.1, g.link - 1.6, g.a2 + 1.6, g.a1 - 1.6);
  const bed = T('#ffffff', { map: tex.draw(256, 256, (gg, ww, hh) => {
    const r = ctx.rng('lmM-bed'); gg.fillStyle = '#4f8a3a'; gg.fillRect(0, 0, ww, hh);
    const pal = ['#8a4fb8', '#f0c030', '#f2f0e6', '#e87aa0', '#d63a3a', '#5a6fd0'];
    for (let i = 0; i < 700; i++) { gg.fillStyle = pal[Math.floor(r() * pal.length)]; const x = r() * ww, y = r() * hh, s = 2 + r() * 4; gg.beginPath(); gg.arc(x, y, s, 0, 7); gg.fill(); }
  }, { key: 'lmM-bed', repeat: [1, 1] }), name: 'lmM-bedMat', paint: 0.03, polygonOffset: -5 });
  for (const [u0, u1, n0, n1] of [[-29.5, -26.6, 29.0, 33.8], [-19.7, -17.9, 29.0, 33.8], [-27.8, -22.0, 33.4, 34.6], [g.link + 1.7, g.ax - 1.8, 28.0, 29.0]]) { quadS(bed, u0, u1, n0, n1, Y_PAVE + 0.01, 1); kerbRect(u0, u1, n0, n1); }
  // railings on the street sides of the garden (gaps at the cross alley)
  rail(-37, g.n0 - 0.2, g.ax - 2.2, g.n0 - 0.2); rail(g.ax + 2.2, g.n0 - 0.2, g.u1, g.n0 - 0.2);
  rail(-37.5, g.n1 + 0.4, g.ax - 1.8, g.n1 + 0.4);
  // trees: chestnuts down the middle of the long lawns, limes along the street sides
  const trees = [];
  let k = 0;
  for (const [n, fam] of [[g.n1 - 5.2, 'chestnut'], [g.n0 + 4.6, 'chestnut']]) for (let u = -33; u < g.ax - 3; u += 6.2) { trees.push({ ...(() => { const [x, z] = w(u + (k % 3) * 0.4, n + ((k * 7) % 5 - 2) * 0.12); return { x, z }; })(), fam: k % 4 === 3 ? 'limeA' : fam, s: 0.8 + ((k * 13) % 7) * 0.04, yaw: k * 1.7 }); k++; }
  for (const [u, n] of [[-12, 31.5], [-2, 31.5], [g.ax + 6, 24], [g.ax + 12, 40], [g.ax + 20, 24], [g.ax + 28, 41]]) { const [x, z] = w(u, n); trees.push({ x, z, fam: k++ % 2 ? 'chestnut' : 'limeA', s: 0.85, yaw: k }); }
  // ------------------------------------------------------------------ south garden (Glinka)
  const s = SG;
  lawn(s.c1 + 1.7, s.c2 - 1.7, s.ay + 1.7, s.n1 - 1.0);          // N side of the alley (towards the Conservatory), between the cross alleys
  lawn(s.c1 + 1.7, s.c2 - 1.7, s.n0 + 1.0, s.ay - 1.7);
  lawn(s.c2 + 1.7, s.u1 - 1.0, s.ay + 1.7, s.n1 - 1.0);
  lawn(s.c2 + 1.7, s.u1 - 1.0, s.n0 + 1.0, s.ay - 1.7);
  quadS(M.gravel, s.u0, s.u1 - 3, s.ay - 1.5, s.ay + 1.5, Y_GRAVEL);
  quadS(M.gravel, s.c1 - 1.5, s.c1 + 1.5, s.n0, s.n1, Y_GRAVEL);
  quadS(M.gravel, s.c2 - 1.5, s.c2 + 1.5, s.n0, s.n1, Y_GRAVEL);
  quadS(M.paving, s.u0 + 0.5, s.c1 - 1.7, s.n0 + 0.5, s.n1 - 0.5, Y_PAVE, 2);
  kerbRect(s.u0 + 0.4, s.c1 - 1.6, s.n0 + 0.4, s.n1 - 0.4);
  for (const [u0, u1, n0, n1] of [[s.c1 + 2.5, s.c1 + 8, s.ay + 2.2, s.ay + 3.4], [s.c1 + 2.5, s.c1 + 8, s.ay - 3.4, s.ay - 2.2]]) { quadS(bed, u0, u1, n0, n1, Y_LAWN + 0.01, 1); }
  rail(s.u0, s.n0 - 0.3, s.u1, s.n0 - 0.3); rail(s.u0, s.n1 + 0.3, s.u1, s.n1 + 0.3);
  k = 0;
  for (const n of [s.ay + 5.2, s.ay - 5.2]) for (let u = -15; u < s.u1 - 2; u += 6.4) { if (Math.abs(u - s.c2) < 3) continue; const [x, z] = w(u, n); trees.push({ x, z, fam: k % 3 === 2 ? 'limeA' : 'chestnut', s: 0.8 + ((k * 11) % 7) * 0.04, yaw: k * 2.1 }); k++; }
  plantTrees(K, trees, 'lmM-trees');

  // ------------------------------------------------------------------ benches (OSM nodes), lamps
  const alleysN = [[-41, g.a1, g.ax, g.a1], [-41, g.a2, g.ax, g.a2]];
  const benchFace = (u, n) => {                                     // face the nearest alley (S frame): returns the world direction
    let best = null, bd = 1e9;
    const cands = n > 0 ? [[u, g.a1], [u, g.a2]] : [[u, s.ay]];
    for (const [cu, cn] of cands) { const d = Math.abs(n - cn); if (d < bd) { bd = d; best = [cu, cn]; } }
    const sgn = best[1] > n ? 1 : -1;
    return [SN[0] * sgn, SN[1] * sgn];
  };
  void alleysN;
  const benches = [];
  for (const f of FURNITURE) if (f.kind === 'bench') {
    const [u, n] = SL(f.x, f.z);
    const inN = u > g.u0 - 5 && u < g.u1 + 5 && n > g.n0 - 3 && n < g.n1 + 3, inS = u > s.u0 - 5 && u < s.u1 + 5 && n > s.n0 - 3 && n < s.n1 + 3;
    if (inN || inS) benches.push({ x: f.x, z: f.z, u, n });
  }
  // KNOCKABLE (lib/knock-furniture.js, docs/AREAS.md 13): benches and lamps are templates at the origin, instanced as knock records with their colliders
  const tplGeos = (fn) => { const Q = new Parts(), gr = new THREE.Group(); fn(Q); Q.build(gr, { name: 'lmM-furniture' }); return { list: gr.children.map((m) => ({ geo: m.geometry, mat: m.material })) }; };
  const benchGeo = tplGeos((Q) => {
    Q.box(M.bench, -0.9, 0.9, 0.42, 0.48, -0.22, 0.22, 'b');                       // seat slats (two)
    Q.box(M.bench, -0.9, 0.9, 0.46, 0.5, -0.19, 0.19, 'b');
    Q.box(M.bench, -0.9, 0.9, 0.75, 0.88, -0.2, -0.17, 'b'); Q.box(M.bench, -0.9, 0.9, 0.58, 0.7, -0.2, -0.17, 'b');   // back slats
    for (const sx of [-0.78, 0.78]) { Q.box(M.benchIron, sx - 0.04, sx + 0.04, 0, 0.45, -0.2, 0.2, 'b'); Q.box(M.benchIron, sx - 0.04, sx + 0.04, 0.45, 0.92, -0.22, -0.16, 'b'); }
  });
  const benchSpots = [], benchItems = [];
  const bench = (x, z, fx, fz) => {
    const rot = Math.atan2(fx, fz);
    benchSpots.push({ x, y: 0, z, rotY: rot }); benchItems.push(ph.addBox(x, z, 1.8, 0.6, rot, 0, 0.9));
  };
  for (const b of benches) { const [fx, fz] = benchFace(b.u, b.n); bench(b.x, b.z, fx, fz); svc.benches.push({ x: b.x, z: b.z, rotY: Math.atan2(fx, fz), len: 1.8 }); }
  K.extraTris = (K.extraTris || 0) + knockFurniture(K.ctx, 'lmM-benches', benchGeo, benchSpots, benchItems, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
  // silver cast-iron lamp posts: fluted column on a round base, a capital ring, three (or two) opal globes (photos 40, 41, 09)
  const lampGeo = tplGeos((Q) => {      // the three-globe lamp (every lamp of the square has three), at the origin
    const x = 0, z = 0, globes = 3;
    Q.cyl(M.lampSilver, [x, 0, z], [x, 0.5, z], 0.3, 0.22, 10, true);
    Q.cyl(M.lampSilver, [x, 0.5, z], [x, 4.4, z], 0.13, 0.09, 10, false);
    Q.cyl(M.lampSilver, [x, 1.0, z], [x, 1.25, z], 0.19, 0.19, 10, true);
    Q.cyl(M.lampSilver, [x, 4.2, z], [x, 4.6, z], 0.16, 0.12, 10, true);
    for (let i = 0; i < globes; i++) {
      const a = i * 2 * Math.PI / 3 + 0.6, bx = x + Math.cos(a) * 0.62, bz = z + Math.sin(a) * 0.62;
      Q.cyl(M.lampSilver, [x, 4.6, z], [bx, 4.95, bz], 0.035, 0.03, 5, false);
      Q.geo(M.lampGlobe, new THREE.SphereGeometry(0.27, 10, 8), bx, 5.3, bz);
      Q.cyl(M.lampSilver, [bx, 4.95, bz], [bx, 5.05, bz], 0.1, 0.04, 6, true);
    }
    Q.cyl(M.lampSilver, [x, 4.6, z], [x, 5.45, z], 0.045, 0.02, 5, false);
    Q.geo(M.lampGlobe, new THREE.SphereGeometry(0.3, 10, 8), x, 5.75, z);
  });
  const lampSpots = [], lampItems = [];
  const lamp = (x, z) => {
    lampSpots.push({ x, y: 0, z, rotY: 0 }); lampItems.push(ph.addCylinder(x, z, 0.28, 0, 5));
    svc.lamps.push({ x, z, h: 5.9 });
  };
  for (const [u, n] of [[-34, g.a1 + 1.9], [-20, g.a1 - 1.9], [-4, g.a1 + 1.9], [-34, g.a2 - 1.9], [-4, g.a2 - 1.9], [g.link, g.a2 + 3.0], [-30.5, 31.4], [g.ax - 2.0, 22]]) { const [x, z] = w(u, n); lamp(x, z); }
  for (const [u, n] of [[-30, s.ay + 1.9], [-4, s.ay - 1.9], [24, s.ay + 1.9], [40, s.ay - 1.9]]) { const [x, z] = w(u, n); lamp(x, z); }
  K.extraTris = (K.extraTris || 0) + knockFurniture(K.ctx, 'lmM-lamps', lampGeo, lampSpots, lampItems, FURNITURE_REC.lamp(5.9), 300);

  // ------------------------------------------------------------------ the two Art Nouveau pavilions (Театральная пл. 5 and 7)
  const pav = (id) => {
    const rec = BUILDINGS.find((b) => b.id === id); if (!rec) return;
    const poly = rec.polys[0], ring = ringFlat(poly.o);
    const edges = ringEdges(poly, 0.05);
    const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length, cz = ring.reduce((a, p) => a + p[1], 0) / ring.length;
    const pm = T('#d6c7a4', { name: 'lmM-pavWall', paint: 0.04 }), rm = T('#6f8a7a', { name: 'lmM-pavRoof', side: 'double', paint: 0.04 });
    for (const e of edges) onEdge(P, e, (len) => {
      K.wallQuad(pm, 0, len, 0, 3.4, 3, 0);
      P.box(M.trim, 0, len, 3.4, 3.7, 0, 0.18, 'kb');
      if (len > 2.2) K.window({ x: len / 2, y: 0.9, w: 0.9, h: 1.9, head: 'arch', sw: 0.14, d: 0.07, surMat: M.trim, sill: false, frame: 'white' });
    });
    // hip roof to a ridge point, with a small lantern
    const top = 5.6;
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; P.quad(rm, [a[0], 3.7, a[1]], [b[0], 3.7, b[1]], [cx, top, cz], [cx, top, cz], [0, 1, 0]); }
    P.cyl(M.iron, [cx, top, cz], [cx, top + 0.9, cz], 0.04, 0.01, 5, false);
    const wp = [...ring.map((p) => p)]; void wp;
    ph.addBox(cx, cz, 5, 5, 0, 0, 4);
  };
  pav('w68926317'); pav('w68926308');

  // ------------------------------------------------------------------ services
  const [rx, rz] = w(RKU, RKN);
  svc.crowd.push({ x: w(-30, 31.4)[0], z: w(-30, 31.4)[1], r: 6, n: 4, name: 'rk-plaza' }, { x: w(s.c1 - 8, s.ay)[0], z: w(s.c1 - 8, s.ay)[1], r: 7, n: 5, name: 'glinka-plaza' });
  void rx; void rz; void SU;
}
