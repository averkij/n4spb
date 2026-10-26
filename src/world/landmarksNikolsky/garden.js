// landmarksNikolsky/garden.js - Nikolsky Garden (Никольский сад) and the cathedral precinct ground (docs/research/nikolsky.md sections 2.3, 6): lawns over the claimed park polygons, the dark asphalt apron of the
// cathedral (disc r 36 m) and the avenue to the bell tower, gravel footways (the OSM ways listed in groups.js), the lawn belt inside the pylon fence, lime / maple trees from the OSM nodes + a procedural
// infill, white benches with black ends (OSM bench nodes), twin-lantern black lamps, the two frog fountains, the Tsushima obelisk (1908) with its bronze eagle.  Ribbons are clipped at `net.cover`
// (road integrity); everything stands off the real asphalt.  Photos refs/nikolsky 071 072 075 036 054.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ROADS, GREEN, TREES, FURNITURE, FOUNTAINS } from '../data/city.js';
import { ribbon, pairs, fillPoly, fillPolyFine, inflate, inRing, distToLine, roadTest, coverFn } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import { plantTrees } from './trees.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { C0, UV, toUV, dC, ROT } from './frame.js';
import { FOOT_IDS, GARDEN_GREEN } from './groups.js';

const TAU = Math.PI * 2;
export const KEYHOLE_R = 45.5, APRON_R = 36.0;

/** the avenue between the two pylon fences, in (u, v): from the apron to the bell tower */
const AVENUE_UV = [[-30, -13], [-43, -15.6], [-51.7, -15.6], [-51.7, -6.5], [-90.2, -6.5], [-90.2, -11.5], [-103.5, -11.5], [-103.5, 11.5], [-90.3, 11.5], [-90.3, 4.1], [-51.8, 4.1], [-51.9, 13.2], [-43, 13.2], [-30, 13]];
export const avenueRing = () => AVENUE_UV.map(([u, v]) => { const w = UV(u, v); return [w.x, w.z]; });

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics, rng = ctx.rng(20261007);
  const cover = coverFn(ctx);
  const clip = (x, z) => cover(x, z) > -0.25;
  const stats = {};
  const gardenPolys = GREEN.filter((g) => GARDEN_GREEN.includes(g.id)).flatMap((g) => g.polys.map((p) => ({ id: g.id, o: pairs(p.o), h: p.h.map(pairs), flat: p })));

  // ---------------------------------------------------------------------------------------- lawns
  for (const gp of gardenPolys) fillPolyFine(P, M.lawn, inflate(gp.o, 0.4), 0.02, { maxEdge: 24, tile: 6, holes: gp.h });
  // the lawn belt inside the cathedral enclosure (r 36 - 45 m), minus the avenue mouth (the asphalt polygon lies on top)
  { const ring = [], hole = []; for (let i = 0; i < 48; i++) { const a = i * TAU / 48; ring.push([C0.x + Math.cos(a) * (KEYHOLE_R - 0.6), C0.z + Math.sin(a) * (KEYHOLE_R - 0.6)]); } for (let i = 0; i < 48; i++) { const a = i * TAU / 48; hole.push([C0.x + Math.cos(a) * APRON_R, C0.z + Math.sin(a) * APRON_R]); }
    fillPolyFine(P, M.lawn, ring, 0.02, { maxEdge: 14, tile: 6, holes: [hole] }); }

  // ---------------------------------------------------------------------------------------- apron + avenue (asphalt) and gravel footways
  { const disc = []; for (let i = 0; i < 48; i++) { const a = i * TAU / 48; disc.push([C0.x + Math.cos(a) * APRON_R, C0.z + Math.sin(a) * APRON_R]); }
    fillPoly(P, M.asphalt, disc, 0.05, { tile: 4 });
    fillPoly(P, M.asphalt, avenueRing(), 0.052, { tile: 4 }); }
  // stone sett ring band round the cathedral (a 1.6 m apron right at the walls)
  { const ring = []; for (let i = 0; i < 48; i++) { const a = i * TAU / 48; ring.push([C0.x + Math.cos(a) * 31.5, C0.z + Math.sin(a) * 31.5]); }
    ribbon(P, M.sett, ring, 1.4, 0.062, { closed: true, tile: 2 }); }
  const mine = ROADS.filter((r) => FOOT_IDS.has(r.id) && !r.bridge && !r.tunnel);
  const paths = [];
  for (const r of mine) {
    const pts = pairs(r.pts), asph = r.surface === 'asphalt';
    const w = r.id === 'w123951923' ? 3.0 : r.w || 2.4;
    stats.ribbons = (stats.ribbons || 0) + ribbon(P, asph ? M.asphalt : M.gravel, pts, w, (asph ? 0.056 : 0.040) + (r.id.length % 7) * 0.0015, { clip, tile: 3 });
    paths.push({ id: r.id, pts, w });
  }
  K.svc.paths = paths;

  // ---------------------------------------------------------------------------------------- trees
  const inGarden = (x, z) => gardenPolys.some((gp) => inRing(gp.o, x, z) && !gp.h.some((h) => inRing(h, x, z))) ;
  const inKeyhole = (x, z) => dC(x, z) < KEYHOLE_R - 1.5;
  const avRing = avenueRing();
  const inAvenue = (x, z) => inRing(avRing, x, z);
  const trees = [];
  const fam = [['limeA', 0.46], ['limeB', 0.24], ['mapleA', 0.22], ['elm', 0.08]];
  const pick = () => { let r = rng(), s = 0; for (const [f, w] of fam) { s += w; if (r < s) return f; } return 'limeA'; };
  const nearPath = (x, z, d) => paths.some((p) => distToLine(p.pts, x, z) < d + p.w / 2);
  const fount = FOUNTAINS.filter((f) => f.x > -2960 && f.x < -2840 && f.z > 990 && f.z < 1060);
  const osmT = [];
  for (let i = 0; i + 1 < TREES.length; i += 2) { const x = TREES[i], z = TREES[i + 1]; if (x < -3030 || x > -2740 || z < 950 || z > 1285) continue; osmT.push([x, z]); }
  for (const [x, z] of osmT) {
    if (!(inGarden(x, z) || inKeyhole(x, z) || inAvenue(x, z))) continue;
    if (cover(x, z) > -1.6) continue;
    trees.push({ x, z, fam: pick(), s: 0.95 + rng() * 0.35, yaw: rng() * TAU, y: 0.02, osm: true });
  }
  stats.osmTrees = trees.length;
  // procedural infill of the garden to a realistic canopy cover: every 6.5 m cell, off the paths / fountains / obelisk / monument / keyhole
  const Ob = { x: -2935.2, z: 1084.8 };
  for (let z = 962; z < 1260; z += 6.4) for (let x = -3000; x < -2770; x += 6.4) {
    const px = x + (rng() - 0.5) * 4.6, pz = z + (rng() - 0.5) * 4.6;
    if (!inGarden(px, pz) || dC(px, pz) < KEYHOLE_R + 2.5 || rng() > 0.55) continue;
    if (cover(px, pz) > -2.5 || nearPath(px, pz, 2.0)) continue;
    if (Math.hypot(px - Ob.x, pz - Ob.z) < 7) continue;
    if (fount.some((f) => Math.hypot(px - f.x, pz - f.z) < 7)) continue;
    if (trees.some((t) => Math.hypot(t.x - px, t.z - pz) < 5.2)) continue;
    trees.push({ x: px, z: pz, fam: pick(), s: 0.85 + rng() * 0.4, yaw: rng() * TAU, y: 0.02 });
  }
  // lime rows inside the enclosure belt (between the apron and the fence): a ring of lindens at r 40.5, except the avenue mouth and the gates
  for (let i = 0; i < 26; i++) {
    const a = i * TAU / 26 + 0.12, x = C0.x + Math.cos(a) * 40.8, z = C0.z + Math.sin(a) * 40.8;
    if (inAvenue(x, z) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 4)) continue;
    const uv = toUV(x, z); if (uv.u > 34 && Math.abs(uv.v) < 12) continue;
    trees.push({ x, z, fam: 'limeB', s: 1.0 + rng() * 0.2, yaw: rng() * TAU, y: 0.02 });
  }
  K.svc.treeCount = trees.length;
  plantTrees(K, trees, 'lmN-trees');
  K.svc.trees = trees.map((t) => ({ x: t.x, z: t.z, r: 3.2 * t.s, h: 17 * t.s }));

  // ---------------------------------------------------------------------------------------- benches (OSM nodes) and lamps
  const benchGeo = partsGeos((Q) => benchParts(Q, M)), lampGeo = partsGeos((Q) => lampParts(Q, M));
  const benches = FURNITURE.filter((f) => f.kind === 'bench' && f.x > -3000 && f.x < -2770 && f.z > 960 && f.z < 1240 && (inGarden(f.x, f.z) || inKeyhole(f.x, f.z) || inAvenue(f.x, f.z)) && cover(f.x, f.z) < -1.2);
  const bm = [], bIt = [], bOut = [];      // (knockable since the areas round of 2026-10-26: lib/knock-furniture.js; the colliders are kept as the records' items)
  for (const b of benches) {
    let best = null, bd = 1e9;
    for (const p of paths) { const d = distToLine(p.pts, b.x, b.z); if (d < bd) { bd = d; best = p; } }
    let rot = 0;
    if (best) { const s = nearest(best.pts, b.x, b.z); rot = Math.atan2(s[0] - b.x, s[1] - b.z); } else rot = Math.atan2(C0.x - b.x, C0.z - b.z);
    bm.push({ x: b.x, y: 0, z: b.z, rotY: rot }); bIt.push(ph.addBox(b.x, b.z, 1.8, 0.6, rot, 0, 0.9)); bOut.push({ x: b.x, z: b.z, rotY: rot, len: 1.7 });
  }
  K.extraTris += knockFurniture(ctx, 'lmN-benches', benchGeo, bm, bIt, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
  K.svc.benches = bOut;
  // twin-lantern lamps: along the avenue (both sides, every ~19 m) and along the main garden paths (every ~24 m)
  const lampPts = [];
  for (let u = -58; u > -90; u -= 16) for (const v of [-4.4, 2.0]) { const w = UV(u, v); lampPts.push([w.x, w.z]); }
  for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.39, w = [C0.x + Math.cos(a) * 33.5, C0.z + Math.sin(a) * 33.5]; lampPts.push(w); }
  for (const p of paths) {
    if (p.pts.length < 3) continue;
    let acc = 12;
    for (let i = 0; i + 1 < p.pts.length; i++) { const a = p.pts[i], b = p.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; if (acc > 26 && l > 3) { acc = 0; const t = 0.5, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l; lampPts.push([a[0] + (b[0] - a[0]) * t + nx * (p.w / 2 + 0.9), a[1] + (b[1] - a[1]) * t + nz * (p.w / 2 + 0.9)]); } }
  }
  const lm = [], lIt = [], lOut = [];
  for (const [x, z] of lampPts) {
    if (!(inGarden(x, z) || inKeyhole(x, z) || inAvenue(x, z)) || cover(x, z) > -1.2 || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.6) || dC(x, z) < 26) continue;
    if (lOut.some((o) => Math.hypot(o.x - x, o.z - z) < 9)) continue;
    lm.push({ x, y: 0, z, rotY: rng() * TAU }); lIt.push(ph.addCylinder(x, z, 0.18, 0, 4.4)); lOut.push({ x, z, h: 4.4 });
  }
  K.extraTris += knockFurniture(ctx, 'lmN-lamps', lampGeo, lm, lIt, FURNITURE_REC.lamp(4.4), 300);
  K.svc.lamps = lOut;

  // ---------------------------------------------------------------------------------------- fountains and the Tsushima obelisk
  const fgeo = partsGeos((Q) => fountainParts(Q, M));
  const fm = fount.map((f) => { ph.addCylinder(f.x, f.z, 3.0, 0, 0.55); return mat4(f.x, 0, f.z, 0, 1); });
  K.extraTris += addInstanced(ctx, K.root, 'lmN-fountains', fgeo, fm, { cast: true }).tris;
  K.svc.fountains = fount.map((f) => ({ x: f.x, z: f.z }));
  P.push(Ob.x, 0, Ob.z, ROT);
  obelisk(P, M);
  P.pop();
  ph.addBox(Ob.x, Ob.z, 3.6, 3.6, ROT, 0, 9.0);
  K.svc.monuments.push({ id: 'n1380870522', name: 'Цусимский обелиск (броненосец «Император Александр III»)', x: Ob.x, z: Ob.z, h: 9.0 });
  K.svc.gardenStats = stats;
}

const nearest = (pts, x, z) => { let best = pts[0], bd = 1e9; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = [px, pz]; } } return best; };

// ---------------------------------------------------------------------------------------------- instanced furniture
function benchParts(Q, M) {                                         // white slat bench 1.7 m with black cast-iron ends (front +z)
  for (const x of [-0.78, 0.78]) { Q.box(M.benchIron, x - 0.04, x + 0.04, 0, 0.45, -0.24, 0.22, ''); Q.box(M.benchIron, x - 0.04, x + 0.04, 0.4, 0.92, -0.3, -0.22, ''); }
  for (let i = 0; i < 4; i++) Q.box(M.benchWood, -0.86, 0.86, 0.45, 0.49, -0.22 + i * 0.1, -0.14 + i * 0.1, 'b');
  for (let i = 0; i < 3; i++) Q.box(M.benchWood, -0.86, 0.86, 0.55 + i * 0.13, 0.62 + i * 0.13, -0.32, -0.28, 'b');
}
function lampParts(Q, M) {                                          // black cast-iron post with a crossbar and two lanterns, 4.4 m
  Q.box(M.lampBlack, -0.18, 0.18, 0, 0.5, -0.18, 0.18, 'b');
  Q.cyl(M.lampBlack, [0, 0.5, 0], [0, 3.9, 0], 0.09, 0.055, 8, false);
  Q.cyl(M.lampBlack, [0, 0.5, 0], [0, 0.8, 0], 0.15, 0.09, 8, false);
  Q.box(M.lampBlack, -0.55, 0.55, 3.85, 3.92, -0.03, 0.03, '');
  for (const s of [-1, 1]) {
    Q.cyl(M.lampBlack, [s * 0.5, 3.9, 0], [s * 0.5, 3.98, 0], 0.1, 0.1, 6, true);
    Q.cyl(M.lampGlass, [s * 0.5, 3.98, 0], [s * 0.5, 4.38, 0], 0.12, 0.2, 6, false);
    Q.cyl(M.lampBlack, [s * 0.5, 4.38, 0], [s * 0.5, 4.5, 0], 0.22, 0.02, 6, false);
  }
}
function fountainParts(Q, M) {                                      // low granite rim r 2.9 (ring top, inner wall), water disc, 4 bronze frogs spitting, a centre jet
  const n = 20, RO = 2.9, RI = 2.55, YT = 0.52, YW = 0.36;
  const pt = (i, r, y) => [Math.sin(i * TAU / n) * r, y, Math.cos(i * TAU / n) * r];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * TAU / n;
    Q.quad(M.greyGranite, pt(i, RO, 0), pt(i + 1, RO, 0), pt(i + 1, RO, YT), pt(i, RO, YT), [Math.sin(t), 0, Math.cos(t)]);
    Q.quad(M.greyGranite, pt(i, RO, YT), pt(i + 1, RO, YT), pt(i + 1, RI, YT), pt(i, RI, YT), [0, 1, 0]);
    Q.quad(M.greyGranite, pt(i, RI, YT), pt(i + 1, RI, YT), pt(i + 1, RI, YW), pt(i, RI, YW), [-Math.sin(t), 0, -Math.cos(t)]);
  }
  Q.cap(M.water, Array.from({ length: n }, (_, i) => [Math.sin(i * TAU / n) * RI, Math.cos(i * TAU / n) * RI]), YW, true, 4);
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + 0.4, x = Math.sin(a) * 2.72, z = Math.cos(a) * 2.72;
    Q.box(M.frog, x - 0.17, x + 0.17, YT, YT + 0.04, z - 0.17, z + 0.17, 'b');
    S.sph(Q, M.frog, x, YT + 0.16, z, 0.17, 0.12, 0.2, 6);
    Q.cyl(M.water, [x - Math.sin(a) * 0.1, YT + 0.2, z - Math.cos(a) * 0.1], [x - Math.sin(a) * 1.3, YW + 0.02, z - Math.cos(a) * 1.3], 0.015, 0.012, 3, false);
  }
  Q.cyl(M.water, [0, YW, 0], [0, 1.5, 0], 0.035, 0.012, 5, false);
}

// ---------------------------------------------------------------------------------------------- Tsushima obelisk (frame: origin at the centre of the base, y up)
function obelisk(P, M) {
  // three black granite steps
  P.box(M.blackGranite, -1.7, 1.7, 0, 0.2, -1.7, 1.7, 'b');
  P.box(M.blackGranite, -1.4, 1.4, 0.2, 0.4, -1.4, 1.4, 'b');
  P.box(M.blackGranite, -1.1, 1.1, 0.4, 0.6, -1.1, 1.1, 'b');
  // red granite pedestal with black plates, cornice
  P.box(M.redGranite, -0.95, 0.95, 0.6, 0.95, -0.95, 0.95, 'b');
  P.box(M.redGranite, -0.82, 0.82, 0.95, 3.2, -0.82, 0.82, '');
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { P.push(fx * 0.83, 0, fz * 0.83, Math.atan2(fx, fz)); P.quad(M.blackGranite, [-0.5, 1.4, 0], [0.5, 1.4, 0], [0.5, 2.7, 0], [-0.5, 2.7, 0], [0, 0, 1]); P.pop(); }
  P.box(M.redGranite, -1.0, 1.0, 3.2, 3.5, -1.0, 1.0, 'b');
  // the shaft: tapering red granite obelisk 3.5 - 8.3 m
  G.frustum(P, M.redGranite, 0, 0, 3.5, 8.3, 4, 0.72 * Math.SQRT2, 0.38 * Math.SQRT2, Math.PI / 4, 1, 1);
  // bronze eagle with raised wings on top
  const y = 8.3;
  S.sph(P, M.bronze, 0, y + 0.45, 0, 0.26, 0.42, 0.2, 8);
  S.sph(P, M.bronze, 0, y + 0.95, 0.1, 0.13, 0.13, 0.13, 6);
  P.box(M.bronze, -0.02, 0.02, y + 0.92, y + 0.98, 0.15, 0.32, '');
  for (const s of [-1, 1]) P.geo(M.bronze, new THREE.BoxGeometry(1, 1, 1), s * 0.5, y + 0.8, -0.05, 0, 0, s * 0.55, 0.8, 0.07, 0.4);
}
