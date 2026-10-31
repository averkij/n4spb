// landmarksTroitskaya/square.js - the garden of TROITSKAYA SQUARE (Троицко-Петровский сквер, OSM area / park r13492538), the TRINITY CHAPEL (2002-03, w116398370) and the SOLOVETSKY STONE (2002,
// n973767127).  Dossier docs/research/troitskaya.md section 4, photos refs/troitskaya 77 81 87.
// The garden is data driven: a sheet of red granite grit over the park polygon (clipped at the real asphalt), the mapped lawns (39 grass polygons), the clipped hedges (52 OSM hedge lines, 0.9 m),
// white benches at the OSM bench nodes turned to the nearest alley, black lantern posts at the OSM lamp nodes, bins, limes / maples at the OSM tree nodes + an infill on the lawns.
// Chapel (frame: centre, front = west): flared cone base of dark red granite with a pedimented portal and bronze mooring rings, three low annexes with copper roofs, a ring of blocks with chains, the
// drum with the gilded inscription, a glazed lantern with eight pale columns, entablature, gilded helmet dome, ball and cross (17.6 m).  Stone: a boulder 1.7 m on a polished slab with the four
// inscriptions.  Publishes benches / lamps / trees / paths in K.svc (people, props).
import * as THREE from 'three';
import * as L from '../layout.js';
import { GREEN, ROADS, BARRIERS, FURNITURE, WALLS, TREES } from '../data/city.js';
import * as G from './geo.js';
import { frameAt, pairs } from './frame.js';
import { fillPolyFine, fillPolyClipped, inRing, coverFn } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { plantTrees } from './trees.js';
import { GARDEN_GREEN, PARK_ID } from './groups.js';

const TAU = Math.PI * 2;
export const CHAPEL = { x: -1428.9, z: -2155.0 }, STONE = { x: -1405.9, z: -2216.8 };
const GARDEN_ROT = 0.431;                                           // the sides of the garden run 24.7 deg off the grid

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksTroitskaya] square/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('garden', () => garden(K));
  stage('chapel', () => chapel(K));
  stage('stone', () => stone(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the garden
function garden(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics, rng = ctx.rng(20261006), cover = coverFn(ctx);
  const parkG = GREEN.find((g) => g.id === PARK_ID); if (!parkG) return;
  const park = pairs(parkG.polys[0].o);
  const inPark = (x, z) => inRing(park, x, z);
  // the grit sheet: subdivided, every triangle that touches the asphalt is dropped (road integrity)
  fillPolyClipped(P, M.grit, park, 0.04, cover, { maxEdge: 12, tile: 5 });
  // lawns
  const lawns = [];
  for (const g of GREEN) { if (!GARDEN_GREEN.includes(g.id)) continue; for (const p of g.polys) { const o = pairs(p.o), h = p.h.map(pairs); lawns.push({ o, h }); fillPolyFine(P, M.lawn, o, 0.06, { maxEdge: 20, tile: 6, holes: h }); } }
  const onLawn = (x, z) => lawns.some((l) => inRing(l.o, x, z) && !l.h.some((h) => inRing(h, x, z)));
  // footways of the garden (for the benches, the people module and the tree infill)
  const paths = [];
  for (const r of ROADS) { if (!/footway|path|pedestrian/.test(r.hw) || r.tunnel || r.bridge) continue; const pts = pairs(r.pts); if (pts.filter(([x, z]) => inPark(x, z)).length * 2 < pts.length) continue; paths.push({ id: r.id, pts, w: r.w || 2.4 }); }
  K.svc.paths.push(...paths);
  const nearPath = (x, z) => { let bd = 1e9, bp = null; for (const p of paths) for (let i = 0; i + 1 < p.pts.length; i++) { const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (d < bd) { bd = d; bp = [qx, qz]; } } return { d: bd, p: bp }; };
  // hedges (clipped, 0.9 m): one box per segment, a square post of leaves at every vertex so the corners close
  let hedges = 0;
  for (const b of BARRIERS) {
    if (b.kind !== 'hedge') continue; const pts = pairs(b.pts); if (pts.filter(([x, z]) => inPark(x, z)).length * 2 < pts.length) continue;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]); if (len < 0.3) continue;
      const rot = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
      P.push(a[0], 0, a[1], rot); P.box(M.hedge, -0.3, len + 0.3, 0.05, 0.9 + (hedges % 3) * 0.012, -0.36, 0.36, 'b', 1.3); P.pop();
      ph.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, len + 0.6, 0.72, rot, 0, 0.9); hedges++;
    }
  }
  // benches, lamps, bins (instanced)
  const benchG = partsGeos((Q) => benchParts(Q, M)), lampG = partsGeos((Q) => lampParts(Q, M)), binG = partsGeos((Q) => { Q.col(M.benchIron, 0, 0, 0.08, 0.78, 0.2, 0.24, 10, true); Q.col(M.benchIron, 0, 0, 0, 0.08, 0.06, 0.06, 6, false); });
  const bm = [], lm = [], nm = [];
  for (const f of FURNITURE) {
    if (!inPark(f.x, f.z) || cover(f.x, f.z) > -0.8) continue;
    if (f.kind === 'bench') { const n = nearPath(f.x, f.z), rot = n.p && n.d > 0.05 ? Math.atan2(n.p[0] - f.x, n.p[1] - f.z) : 0; bm.push(mat4(f.x, 0.04, f.z, rot, 1)); ph.addBox(f.x, f.z, 1.9, 0.6, rot, 0, 0.9); K.svc.benches.push({ x: f.x, z: f.z, rotY: rot, len: 1.8 }); }
    else if (f.kind === 'waste_basket') nm.push(mat4(f.x, 0.04, f.z, 0, 1));
  }
  // lanterns: none are mapped inside the garden, so one every ~26 m along the alleys, 1.1 m off the grit, alternating sides
  const lampAt = [];
  for (const p of paths) {
    let acc = 13, side = p.id.length % 2 ? 1 : -1;
    for (let i = 0; i + 1 < p.pts.length; i++) {
      const a = p.pts[i], b = p.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
      for (let s = 0; s < l; s += 2) { acc += Math.min(2, l - s); if (acc < 26) continue;
        const t = s / l, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, x = a[0] + (b[0] - a[0]) * t + nx * side * (p.w / 2 + 1.1), z = a[1] + (b[1] - a[1]) * t + nz * side * (p.w / 2 + 1.1);
        if (!inPark(x, z) || cover(x, z) > -1.2 || nearPath(x, z).d < p.w / 2 + 0.6 || lampAt.some((q) => Math.hypot(q[0] - x, q[1] - z) < 14)) continue;
        acc = 0; side = -side; lampAt.push([x, z]); } }
  }
  for (const [x, z] of lampAt) { lm.push(mat4(x, 0.04, z, 0, 1)); ph.addCylinder(x, z, 0.16, 0, 4.4); K.svc.lamps.push({ x, z, h: 4.4 }); }
  // the low granite walls round the chapel circle (OSM walls)
  for (const w of WALLS || []) {
    const pts = pairs(w.pts); if (pts.filter(([x, z]) => inPark(x, z)).length * 2 < pts.length) continue;
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], c = pts[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]); if (len < 0.2) continue; const rot = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
      P.push(a[0], 0, a[1], rot); P.box(M.chapelLight, -0.2, len + 0.2, 0.04, 0.5 + (i % 2) * 0.01, -0.22, 0.22, 'b', 2); P.pop(); ph.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, len + 0.4, 0.44, rot, 0, 0.5); }
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmT-benches', benchG, bm).tris + addInstanced(ctx, K.root, 'lmT-lamps', lampG, lm).tris + addInstanced(ctx, K.root, 'lmT-bins', binG, nm).tris;
  // trees: OSM nodes + an infill of old limes on the lawns (off the alleys, the chapel and the stone)
  const trees = [], fam = () => { const r = rng(); return r < 0.5 ? 'limeA' : r < 0.78 ? 'limeB' : r < 0.93 ? 'mapleA' : 'elm'; };
  const far = (x, z, d) => !trees.some((t) => Math.hypot(t.x - x, t.z - z) < d);
  for (let i = 0; i + 1 < TREES.length; i += 2) { const x = TREES[i], z = TREES[i + 1]; if (!inPark(x, z) || cover(x, z) > -1.2 || !far(x, z, 3)) continue; trees.push({ x, z, fam: fam(), s: 1.0 + rng() * 0.3, yaw: rng() * TAU, y: 0.05 }); }
  for (let z = -2400; z < -2130; z += 9.5) for (let x = -1516; x < -1316; x += 9.5) {
    const px = x + (rng() - 0.5) * 6, pz = z + (rng() - 0.5) * 6;
    if (rng() > 0.62 || !inPark(px, pz) || !onLawn(px, pz) || cover(px, pz) > -2.5 || nearPath(px, pz).d < 2.6 || !far(px, pz, 6.5) || lampAt.some((q) => Math.hypot(q[0] - px, q[1] - pz) < 2)) continue;
    if (Math.hypot(px - CHAPEL.x, pz - CHAPEL.z) < 16 || Math.hypot(px - STONE.x, pz - STONE.z) < 9) continue;
    trees.push({ x: px, z: pz, fam: fam(), s: 0.9 + rng() * 0.4, yaw: rng() * TAU, y: 0.05 });
  }
  plantTrees(K, trees, 'lmT-gardenTrees');
  K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, r: 3.2 * t.s, h: 17 * t.s })));
  K.svc.garden = { lawns: lawns.length, hedges, benches: bm.length, lamps: lm.length, trees: trees.length, paths: paths.length };
  K.svc.crowd.push({ id: 'troitskaya-centre', kind: 'stroll', x: -1442.8, z: -2296.5, r: 14, n: 10 });
}
function benchParts(Q, M) {                                         // white slat bench 1.8 m with black cast-iron ends (front +z)
  for (const x of [-0.82, 0.82]) { Q.box(M.benchIron, x - 0.04, x + 0.04, 0, 0.45, -0.24, 0.22, ''); Q.box(M.benchIron, x - 0.04, x + 0.04, 0.4, 0.92, -0.3, -0.22, ''); }
  for (let i = 0; i < 4; i++) Q.box(M.benchWood, -0.9, 0.9, 0.45, 0.49, -0.22 + i * 0.1, -0.14 + i * 0.1, 'b');
  for (let i = 0; i < 3; i++) Q.box(M.benchWood, -0.9, 0.9, 0.55 + i * 0.13, 0.62 + i * 0.13, -0.32, -0.28, 'b');
}
function lampParts(Q, M) {                                          // black post with a cylindrical lantern under a cap, 4.4 m (photo 81)
  Q.col(M.lampBlack, 0, 0, 0, 0.6, 0.16, 0.1, 8, false); Q.col(M.lampBlack, 0, 0, 0.6, 3.6, 0.07, 0.055, 8, false);
  Q.col(M.lampBlack, 0, 0, 3.6, 3.7, 0.2, 0.2, 8, true); Q.col(M.lampGlass, 0, 0, 3.7, 4.2, 0.17, 0.2, 8, false); Q.col(M.lampBlack, 0, 0, 4.2, 4.42, 0.26, 0.03, 8, false);
}

// ------------------------------------------------------------------------------------------------ the Trinity chapel
function chapel(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics, cover = coverFn(ctx);
  // paving round the chapel (grey pavers)
  const disc = []; for (let i = 0; i < 32; i++) { const a = i * TAU / 32; disc.push([CHAPEL.x + Math.cos(a) * 11, CHAPEL.z + Math.sin(a) * 11]); }
  fillPolyClipped(P, M.pavers, disc, 0.08, cover, { maxEdge: 6, tile: 2 });
  const F = frameAt(CHAPEL.x, CHAPEL.z, -Math.PI / 2);                // local +z (front, the portal) looks west
  P.push(F.x, 0, F.z, F.rot);
  // the flared cone base and its cornice
  G.lathe(P, M.chapel, 'chapelBase', [[5.5, 0], [5.15, 0.35], [4.85, 1.2], [4.55, 2.6], [4.3, 4.0]], 0, 0, 0, 1, 1, 32, 10);
  G.tube(P, M.chapel, 0, 0, 4.0, 4.3, 4.5, 4.5, 32, 8, 0.2, { capTop: M.chapel });
  // the ring of blocks with chains
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) * TAU / 12, x = Math.sin(a) * 3.85, z = Math.cos(a) * 3.85;
    P.push(x, 0, z, a); P.box(M.chapelLight, -0.3, 0.3, 4.3, 4.85, -0.25, 0.25, 'b', 2); P.pop();
    const a2 = (i + 1.5) * TAU / 12, x2 = Math.sin(a2) * 3.85, z2 = Math.cos(a2) * 3.85, mx = (x + x2) / 2 * 1.02, mz = (z + z2) / 2 * 1.02;
    P.cyl(M.bronzeDark, [x, 4.72, z], [mx, 4.5, mz], 0.035, 0.035, 5, false); P.cyl(M.bronzeDark, [mx, 4.5, mz], [x2, 4.72, z2], 0.035, 0.035, 5, false);
  }
  // the drum with the gilded inscription
  G.tube(P, M.chapel, 0, 0, 4.3, 6.4, 3.05, 2.95, 32, 6, 1);
  G.tube(P, M.text('СЕЙ ХРАМ СООРУЖЕН В ДАР К 300-ЛЕТИЮ САНКТ-ПЕТЕРБУРГА  ✛', { w: 1024, h: 48, repeat: true }), 0, 0, 5.15, 5.75, 3.03, 3.0, 32, 2, 1, { a0: Math.PI * 0.5 });
  G.tube(P, M.chapel, 0, 0, 6.4, 6.65, 3.25, 3.25, 32, 6, 0.2, { capTop: M.chapel });
  // the lantern: dark glass core, eight pale granite columns in four pairs, bronze capitals
  G.frustum(P, M.glassDark, 0, 0, 6.65, 10.6, 8, 1.62, 1.62, Math.PI / 8, 1, 1);
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + Math.PI / 4;
    P.push(Math.sin(a) * 1.5, 0, Math.cos(a) * 1.5, a); P.box(M.chapel, -0.62, 0.62, 6.65, 10.6, -0.2, 0.22, 'b', 2); P.pop();
    for (const da of [-0.2, 0.2]) { const x = Math.sin(a + da) * 2.1, z = Math.cos(a + da) * 2.1; P.col(M.chapel, x, z, 6.65, 6.95, 0.3, 0.3, 10, true); P.col(M.chapelLight, x, z, 6.95, 10.1, 0.23, 0.2, 10, false); P.col(M.bronzeDark, x, z, 10.1, 10.6, 0.22, 0.34, 10, true); }
    // window bars on the open faces
    const b = i * TAU / 4; P.push(Math.sin(b) * 1.52, 0, Math.cos(b) * 1.52, b); P.box(M.bronzeDark, -0.03, 0.03, 6.9, 10.4, 0, 0.05, 'b'); for (const y of [7.8, 8.7, 9.6]) P.box(M.bronzeDark, -0.55, 0.55, y, y + 0.05, 0, 0.05, ''); P.pop();
  }
  // entablature, the gilded helmet dome, ball and cross
  G.tube(P, M.chapel, 0, 0, 10.6, 11.35, 2.45, 2.45, 24, 6, 0.4);
  G.tube(P, M.chapel, 0, 0, 11.35, 11.6, 2.75, 2.75, 24, 6, 0.2, { capTop: M.chapel }); P.cap(M.chapel, G.ngon(24, 2.75), 11.35, false, 2);
  G.lathe(P, M.gold, 'chapelDome', [[2.3, 0], [2.32, 0.5], [2.1, 1.2], [1.6, 1.9], [0.9, 2.45], [0.35, 2.85], [0.2, 3.1]], 0, 11.6, 0, 1, 1, 24, 10);
  G.ball(P, M.goldFlat, 0, 15.1, 0, 0.5, 14);
  G.cross(P, M.goldFlat, 0, 15.5, 0, 2.2, 0);
  // the portal (front): granite frame with a pediment, green bronze doors, two steps; big mooring rings on the cone
  P.box(M.chapel, -1.9, 1.9, 0, 3.3, 3.9, 5.6, 'kb', 2);
  P.fan(M.chapel, [[-2.2, 3.3, 5.75], [2.2, 3.3, 5.75], [0, 4.25, 5.75]], [0, 0, 1]);
  P.quad(M.chapel, [-2.2, 3.3, 5.75], [0, 4.25, 5.75], [0, 4.25, 4.2], [-2.2, 3.3, 4.2], [-0.4, 0.9, 0]); P.quad(M.chapel, [0, 4.25, 5.75], [2.2, 3.3, 5.75], [2.2, 3.3, 4.2], [0, 4.25, 4.2], [0.4, 0.9, 0]);
  P.box(M.chapel, -2.2, 2.2, 3.12, 3.3, 4.2, 5.75, '', 2);
  P.box(M.bronzeGreen, -1.05, 1.05, 0.3, 2.75, 5.6, 5.64, 'kb'); P.box(M.bronzeDark, -0.02, 0.02, 0.3, 2.75, 5.64, 5.66, 'kb');
  for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) P.box(M.bronzeDark, sx * 0.55 - 0.3, sx * 0.55 + 0.3, 0.45 + j * 0.58, 0.9 + j * 0.58, 5.64, 5.655, 'kb');
  for (let k = 0; k < 2; k++) P.box(M.chapelLight, -2.4 - k * 0.3, 2.4 + k * 0.3, 0, 0.3 - k * 0.15, 5.6, 6.2 + k * 0.4, 'b', 2);
  for (const sx of [-1, 1]) { const tor = new THREE.TorusGeometry(0.42, 0.07, 6, 16); P.geo(M.bronzeGreen, tor, sx * 3.35, 2.1, 3.62, -0.1, sx * 0.72, 0); tor.dispose(); G.ball(P, M.bronzeGreen, sx * 3.3, 2.55, 3.55, 0.16, 8); }
  // three low annexes with green copper roofs (north, south, east)
  for (const a of [Math.PI / 2, Math.PI, -Math.PI / 2]) {
    P.push(0, 0, 0, a); P.box(M.chapel, -1.8, 1.8, 0, 2.7, 3.9, 6.0, 'kb', 2);
    P.quad(M.copper, [-1.95, 2.7, 6.15], [1.95, 2.7, 6.15], [1.95, 3.25, 4.2], [-1.95, 3.25, 4.2], [0, 0.96, 0.27]);
    P.fan(M.chapel, [[-1.95, 2.7, 6.15], [-1.95, 3.25, 4.2], [-1.95, 2.7, 4.2]], [-1, 0, 0]); P.fan(M.chapel, [[1.95, 2.7, 6.15], [1.95, 2.7, 4.2], [1.95, 3.25, 4.2]], [1, 0, 0]);
    P.box(M.glassDark, -0.5, 0.5, 0.9, 2.1, 6.0, 6.03, 'kb'); P.pop();
  }
  P.pop();
  ph.addCylinder(CHAPEL.x, CHAPEL.z, 5.6, 0, 16);
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) ph.addBox(CHAPEL.x + dx * 5.2, CHAPEL.z + dz * 5.2, 3.9, 2.4, dx ? Math.PI / 2 : 0, 0, 3.4);
  K.svc.monuments.push({ id: 'w116398370', name: 'Часовня Троицы Живоначальной', x: CHAPEL.x, z: CHAPEL.z, h: 17.7 });
  K.svc.crowd.push({ id: 'trinity-chapel', kind: 'photo', x: CHAPEL.x - 13, z: CHAPEL.z, r: 4, n: 8 });
}

// ------------------------------------------------------------------------------------------------ the Solovetsky stone
let boulder = null;
function stone(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  if (!boulder) {
    // a rough granite boulder: a deformed, flat-shaded sphere (leaning face on one side, like the real one)
    const g0 = new THREE.IcosahedronGeometry(1, 2), pa = g0.attributes.position, h = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), n = 0.82 + 0.3 * h(Math.round(x * 3), Math.round(y * 3), Math.round(z * 3)) + 0.12 * Math.sin(x * 2.1 + z * 1.3);
      pa.setXYZ(i, x * 1.3 * n, Math.max(-0.55, y * 0.86 * n + (x > 0.2 ? 0.1 : 0)), z * 0.95 * n);
    }
    g0.computeVertexNormals(); const uv = new Float32Array(pa.count * 2); for (let i = 0; i < pa.count; i++) { uv[i * 2] = pa.getX(i) * 0.4 + pa.getZ(i) * 0.3; uv[i * 2 + 1] = pa.getY(i) * 0.4; } g0.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    boulder = g0;
  }
  P.push(STONE.x, 0, STONE.z, GARDEN_ROT);
  P.box(M.slab, -1.3, 1.3, 0, 0.2, -1.28, 1.28, 'b', 2);                                     // the concrete foot
  P.box(M.slab, -1.18, 1.18, 0.2, 0.55, -1.15, 1.15, 'b', 2);                                 // the polished slab 2.35 x 2.3 x 0.35
  P.geo(M.stone, boulder, 0, 0.55 + 0.52, 0);
  const lines = [['УЗНИКАМ ГУЛАГА', 0], ['БОРЦАМ ЗА СВОБОДУ', -Math.PI / 2], ['ЖЕРТВАМ КОММУНИСТИЧЕСКОГО ТЕРРОРА', Math.PI], ['ХОТЕЛОСЬ БЫ ВСЕХ ПОИМЕННО НАЗВАТЬ…  АННА АХМАТОВА', Math.PI / 2]];
  for (const [text, a] of lines) { P.push(0, 0, 0, a); G.pane(P, M.text(text, { w: 512, h: 48 }), -1.08, 1.08, 0.26, 0.5, Math.abs(Math.sin(a)) > 0.5 ? 1.188 : 1.158); P.pop(); }
  P.pop();
  ph.addBox(STONE.x, STONE.z, 2.6, 2.6, GARDEN_ROT, 0, 2.3);
  K.svc.monuments.push({ id: 'n973767127', name: 'Соловецкий камень (памятник жертвам политических репрессий)', x: STONE.x, z: STONE.z, h: 2.3 });
  K.svc.photoSpots.push({ x: STONE.x - 6.5, z: STONE.z + 1, yaw: L.yawToward(STONE.x - 6.5, STONE.z + 1, STONE.x, STONE.z), pitch: 2, name: 'Соловецкий камень' });
  K.svc.crowd.push({ id: 'solovetsky-stone', kind: 'photo', x: STONE.x - 5, z: STONE.z + 1, r: 3, n: 6 });
}
