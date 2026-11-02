// landmarksF/garden.js - Kazan Square and its garden (docs/research/kazan-cathedral.md section 4, photos 40 48 49 53 56 57 64): the granite-slab paving of the square (OSM w638329474), the garden
// "bell" (w115318448) with gravel paths, four lawns, clipped hedges, two rose beds, the fountain (wide pink-granite rim, cone of jets), 27 white benches, the black spear fence along the garden edge and a low
// fence in front of the north portico steps, and the two monument plazas: Kutuzov (east) and Barclay de Tolly (west) on red-grey granite pedestals inside rings of chain bollards.
// Everything is drawn in the cathedral model frame (frame.js); OSM world coordinates are converted with Mdl().
import * as THREE from 'three';
import { GREEN, AREAS, BARRIERS, FURNITURE, FOUNTAINS, ROADS } from '../data/city.js';
import { liveFountain } from '../lib/live-fountain.js';
import * as L from '../layout.js';
import { C0, ROT, Mdl, W, boxAt, cylAt } from './frame.js';
import { mound, arcWall, arcFlat } from './prims.js';
import { figureMats } from '../lib/figures.js';
import { kutuzov, barclay, trophies } from './statues.js';
import { templateOf } from './util.js';
import { knockInstances } from '../lib/knock-inst.js';
import { knockBays, unitProfile, faceLeft } from '../lib/fence-bays.js';
const TAU = Math.PI * 2;

const AREA_ID = 'w638329474', PARK = 'w115318448';
const PATH_Y = 0.158, LAWN_Y = 0.14, PAVE_Y = 0.10;

/** the slab cap of the square minus the carriageways that cross it (streets is built before this module): the polygon is triangulated, the triangles near a road are split to <= 3 m and
 *  those whose centre or inner corners lie on asphalt are dropped. `cov(mx, mz)` = asphalt cover of a model point (> 0 inside a carriageway). */
function carvedCap(P, mat, ring, y, uvs, cov) {
  const todo = THREE.ShapeUtils.triangulateShape(ring.map((p) => new THREE.Vector2(p[0], p[1])), []).map((t) => t.map((i) => ring[i]));
  while (todo.length) {
    const t = todo.pop(), e = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => Math.hypot(t[j][0] - t[i][0], t[j][1] - t[i][1])), k = e.indexOf(Math.max(...e)), l = e[k];
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cz = (t[0][1] + t[1][1] + t[2][1]) / 3, c = cov(cx, cz);
    const keep = () => P.fan(mat, t.map((p) => [p[0], y, p[1]]), [0, 1, 0], (p) => [p[0] / uvs, p[2] / uvs]);
    if (l <= 12 && c < -l) { keep(); continue; }                                                                                   // cover() sees 14 m around: no road can reach this triangle
    if (l > 3) { const a = t[k], b = t[(k + 1) % 3], o = t[(k + 2) % 3], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; todo.push([a, m, o], [m, b, o]); continue; }
    if (c < -0.1 && t.every((p) => cov(p[0] * 0.6 + cx * 0.4, p[1] * 0.6 + cz * 0.4) < -0.1)) keep();
  }
}

const flatToModel = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const m = Mdl(flat[i], flat[i + 1]); r.push([m.mx, m.mz]); } return r; };
const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
const centroid = (r) => { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; };
const greenRing = (id) => { const g = GREEN.find((q) => q.id === id); return g ? flatToModel(g.polys[0].o) : null; };

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, svc = K.svc;
  const rng = ctx.rng(2210);
  P.push(C0.x, 0, C0.z, ROT);

  // ------------------------------------------------------------------------------------------------ paving of the square
  const sq = AREAS.find((a) => a.id === AREA_ID);
  // the way "Казанская площадь" is the pedestrian square itself (slabs stay on it); every other carriageway crossing the square is asphalt, flush: no slabs, no skirt on it
  const net = ctx.services.streets && ctx.services.streets.net, own = net ? net.ways.filter((w) => w.name === 'Казанская площадь') : [];
  const cov = net ? (mx, mz) => { const q = W(mx, mz); return net.cover(q.x, q.z, { skip: own[0], skip2: own[1] }); } : () => -1e9;
  if (sq) for (const p of sq.polys) {
    const ring = flatToModel(p.o);
    carvedCap(P, M.slab, ring, PAVE_Y, 2.8, cov);
    const ccw = area(ring) > 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[j], b = ring[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05 || cov((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) > -0.1) continue;
      let nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l; if (!ccw) { nx = -nx; nz = -nz; }
      P.quad(M.step, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], PAVE_Y, b[1]], [a[0], PAVE_Y, a[1]], [nx, 0, nz]);
    }
  }

  // ------------------------------------------------------------------------------------------------ garden ground
  // one lawn over the whole garden, the mapped paths as pink-gravel ribbons (photos 40 53 56)
  const park = greenRing(PARK);
  if (park) P.cap(M.lawn, park, LAWN_Y, true, 4);
  if (park) gardenPaths(P, M, park);
  // clipped hedges on the scrub polygons: packed balls (photos 40 49 64: dense dark-green rounded humps 2-3 m high)
  ['w1216771443', 'w1216771444', 'w1216771445', 'w1216771446'].map(greenRing).filter(Boolean).forEach((r, k) => hedgeBalls(P, M, r, rng, k));
  // trees (lilacs / limes) at the two ends of the garden: they frame the colonnade without hiding the portico (photos 40 48 49)
  for (const [x, z, h, rad] of [[-48, 34, 8, 2.8], [-44, 22, 7, 2.5], [-40, 41, 8.5, 3], [-36, 30, 6.5, 2.4], [-47, 46, 7.5, 2.8], [47, 36, 8, 2.8], [43, 24, 7, 2.5], [40, 43, 8.5, 3], [37, 31, 6.5, 2.4], [46, 48, 7.5, 2.8], [-53, 12, 7, 2.5], [53, 14, 7, 2.5]]) {
    const zz = -z; if (!park || !pointIn(park, x, zz)) continue;
    tree(P, M, x, zz, h, rad, rng); cylAt(ph, x, zz, 0.35, 0, 8);
  }
  // rose beds: low ellipses along the lawn edges (pink and red mounds)
  const roses = [[-8, -1.2, 6.5, 2.2, 0.2], [8.5, -0.5, 6.0, 2.0, -0.25], [-30, -22, 8, 2.0, 0.55], [32, -22, 8, 2.0, -0.55], [-5, 8, 6, 1.6, 0.1], [5, 8, 6, 1.6, -0.1]];
  roses.forEach(([cx, cz, rx, rz, a], i) => {
    const ring = []; for (let k = 0; k < 14; k++) { const t = k / 14 * Math.PI * 2; ring.push([cx + Math.cos(t) * rx * Math.cos(a) - Math.sin(t) * rz * Math.sin(a), cz + Math.cos(t) * rx * Math.sin(a) + Math.sin(t) * rz * Math.cos(a)]); }
    mound(P, M.hedge2, ring, LAWN_Y - 0.02, 0.9, { bump: (x, z, j) => (j ? Math.sin(x * 3.1 + z * 2.3) * 0.12 : 0) });
    for (let k = 0; k < 16; k++) { const t = rng() * Math.PI * 2, r = Math.sqrt(rng()), x = cx + Math.cos(t) * r * rx * 0.85, z = cz + Math.sin(t) * r * rz * 0.85; P.box([M.rose1, M.rose2, M.rose3][(k + i) % 3], x - 0.13, x + 0.13, 0.9, 1.1, z - 0.13, z + 0.13, 'b'); }
  });

  // ------------------------------------------------------------------------------------------------ fountain
  const fo = fountainAt();
  function fountainAt() { const f = FOUNTAINS.find((q) => q.id === 'w101292107'); const m = Mdl(f.x, f.z); return { x: m.mx, z: m.mz }; }
  fountain(P, M, fo.x, fo.z);
  const nozzles = [{ height: 6.8, width: 0.045, target: [0.18 * Math.cos(ROT), 0, -0.18 * Math.sin(ROT)] }];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU + ROT, s = Math.sin(a), c = Math.cos(a);
    nozzles.push({ x: s * 2.4, y: 0.06, z: c * 2.4, height: 6.0, width: 0.018, target: [s * 0.4, 0, c * 0.4] });
  }
  const fw = W(fo.x, fo.z);
  liveFountain(K.ctx, { id: 'w101292107', x: fw.x, z: fw.z, y: 0.34, r: 7.4, nozzles, far: 380 });
  {                                                                                    // WATER IS REACHABLE (docs/AREAS.md 13.7): no solid disc any more: the basin is 0.34 m of shallow water to wade in, the rim 40 breakable bays, the middle pillar solid
    const R = 8.2, r0 = 7.4, h = 0.5, seg = 40, bays = [], at = (t, r) => W(fo.x + Math.sin(t) * r, fo.z + Math.cos(t) * r);
    for (let i = 0; i < seg; i++) {
      const t0 = i / seg * TAU, t1 = (i + 1) / seg * TAU, tm = (t0 + t1) / 2, p = at(t0, R), q = at(t1, R), c = at(tm, R - 1);       // (local +z = toward the middle of the basin)
      bays.push(faceLeft(p.x, p.z, q.x, q.z, c.x - (p.x + q.x) / 2, c.z - (p.z + q.z) / 2, { y: 0 }));
    }
    knockBays(K.ctx, { name: 'lmF-fountain-rim', bays, far: 300,
      parts: [{ geo: unitProfile([[0, 0], [0, h], [R - r0, h], [R - r0, h - 0.16]], { caps: false, uLen: 1.3, uvs: 1.3, vFn: (y) => y }), mat: M.rim, name: 'rim', far: 300, stretch: true }],
      collider: () => ({ y0: 0, y1: 0.6, thick: R - r0 + 0.1, off: (R - r0) / 2, e0: 0.1, e1: 0.1 }),
      rec: () => ({ kind: 'fence', mass: 500, h, r: 0.4, anchored: 10, hitK: 0.3, metal: false, minDv: 0 }) });
    ph.addWater({ ring: Array.from({ length: 40 }, (_, k) => { const p = at(k / 40 * TAU, r0); return [p.x, p.z]; }).flat(), level: h - 0.16 });
    cylAt(ph, fo.x, fo.z, 0.5, 0, 1.0);
  }
  { const ring = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; ring.push([fo.x + Math.sin(t) * 10.6, fo.z + Math.cos(t) * 10.6]); } fenceRun(P, M, ring, 0.55, true, 0.16); }

  // ------------------------------------------------------------------------------------------------ monuments
  const plazas = [['w1216771447', 'barclay'], ['w1216771448', 'kutuzov']];
  for (const [id, who] of plazas) {
    const r = greenRing(id); if (!r) continue;
    const [cx, cz] = centroid(r);
    monument(K, who, cx, cz);
  }

  // ------------------------------------------------------------------------------------------------ fences (black spears): garden edge + the low fence before the north portico
  const gb = BARRIERS.find((b) => b.id === PARK);
  if (gb) fenceRun(P, M, flatToModel(gb.pts), 1.1, true);
  for (const id of ['w1216771449', 'w1216771450', 'w1216771451']) { const b = BARRIERS.find((q) => q.id === id); if (b) fenceRun(P, M, flatToModel(b.pts), 0.9, false); }

  // ------------------------------------------------------------------------------------------------ benches (OSM nodes inside the garden)
  const inGarden = (m) => park && pointIn(park, m.mx, m.mz);
  let nb = 0; const benchSpots = [];
  for (const f of FURNITURE) {
    if (f.kind !== 'bench') continue; const m = Mdl(f.x, f.z); if (!inGarden({ mx: m.mx, mz: m.mz })) continue;
    const dx = fo.x - m.mx, dz = fo.z - m.mz, near = Math.hypot(dx, dz) < 26;
    const rot = near ? Math.atan2(dx, dz) : (m.mx < 0 ? Math.PI / 2 : -Math.PI / 2);
    if (ctx.knock) benchSpots.push({ x: f.x, y: 0.12, z: f.z, rotY: rot + ROT }); else bench(P, M, m.mx, m.mz, rot);
    nb++; (svc.benchPoints ||= []).push({ x: f.x, z: f.z });
  }
  P.pop();
  // knockable (core/knock.js): the same bench model as instances (iron ends + white slats), free; the benches had no collider before: the car now meets (and throws) them
  if (benchSpots.length) knockInstances(ctx, {
    name: 'lmF-kazan-benches', parts: templateOf((T) => bench(T, M, 0, 0, 0, 0)).map((t) => ({ geo: t.geo, mat: t.mat, name: t.mat === M.iron ? 'iron' : 'slats' })),
    spots: benchSpots, items: (i, s) => ph.addBox(s.x, s.z, 1.6, 0.5, s.rotY, 0, 0.9), far: 220,
    rec: { kind: 'bench', mass: 40, h: 0.9, w: 1.6, d: 0.5, hitK: 0.25, minDv: 0.5 },
  });
  K.svc.benches = nb;
  svc.photoSpots.push({ x: W(0, -75).x, z: W(0, -75).z, yaw: L.yawToward(W(0, -75).x, W(0, -75).z, W(0, 40).x, W(0, 40).z), pitch: 8, name: 'Казанский собор с Невского' });
  svc.photoSpots.push({ x: W(0, -22).x, z: W(0, -22).z, yaw: L.yawToward(W(0, -22).x, W(0, -22).z, W(0, 72).x, W(0, 72).z), pitch: 14, name: 'Фонтан в Казанском сквере' });
  svc.crowd.push(...[[fo.x + 9, fo.z], [fo.x - 9, fo.z], [-46, -40], [46, -40]].map(([a, b]) => { const w = W(a, b); return { x: w.x, z: w.z }; }));
  svc.monuments.push({ id: 'n318501546', name: 'М. И. Кутузов', x: W(50, -31).x, z: W(50, -31).z, h: 7.6 }, { id: 'n318501570', name: 'М. Б. Барклай-де-Толли', x: W(-49.4, -32).x, z: W(-49.4, -32).z, h: 7.5 });
}

/** a small street kiosk (2.2 x 1.5 m) with a sloping red canopy over a counter; faces local +z after rot */
function kiosk(P, M, ph, x, z, rot) {
  P.push(x, 0.14, z, rot);
  P.box(M.canopyW, -1.1, 1.1, 0, 2.0, -0.75, 0.75, 'b');
  P.box(M.black, -0.8, 0.8, 1.0, 1.7, 0.74, 0.77, 'kb');                       // service window
  P.box(M.canopyW, -1.2, 1.2, 1.0, 1.05, 0.75, 1.15, 'kb');                    // counter
  P.quad(M.canopy, [-1.5, 2.45, -0.95], [1.5, 2.45, -0.95], [1.5, 2.05, 1.3], [-1.5, 2.05, 1.3], [0, 1, 0.3]);
  for (const sx of [-1.4, 1.4]) P.cyl(M.iron, [sx, 0, 1.2], [sx, 2.08, 1.2], 0.03, 0.03, 4, false);
  P.pop();
  boxAt(ph, x, z, 2.4, 1.8, rot, -1, 2.6);
}

function pointIn(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }

function fountain(P, M, x, z) {
  const R = 8.2, r0 = 7.4, h = 0.5;
  P.push(x, 0, z, 0);
  // (the rim - the outer wall, the top ring, the inner wall above the water - is a row of 40 BREAKABLE bays now: fountainRim() below, docs/AREAS.md 13.7)
  const wp = []; for (let k = 0; k < 40; k++) { const t = k / 40 * TAU; wp.push([Math.sin(t) * r0, h - 0.16, Math.cos(t) * r0]); }
  P.fan(M.water, wp, [0, 1, 0], (q) => [q[0] / 4, q[2] / 4]);                    // water
  P.pop();
  // The bell of water is dynamic (liveFountain above), outside this static collector.
  P.cyl(M.rim, [x, h - 0.15, z], [x, h + 0.25, z], 0.25, 0.25, 8, true);
}

function monument(K, who, cx, cz) {
  const P = K.P, M = K.M, ph = K.ctx.physics, east = who === 'kutuzov';
  // soil bed with a granite kerb
  const RB = 5.4, ring = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; ring.push([cx + Math.cos(t) * RB, cz + Math.sin(t) * RB]); }
  P.cap(M.soil, ring, 0.155, true, 4);
  P.cyl(M.slabPink, [cx, 0.0, cz], [cx, 0.17, cz], RB + 0.25, RB + 0.25, 28, false);
  P.cyl(M.slabPink, [cx, 0.17, cz], [cx, 0.171, cz], RB + 0.25, RB, 28, true);
  // round granite platform, stepped base, pedestal, statue
  P.cyl(M.pink, [cx, 0.1, cz], [cx, 0.62, cz], 3.9, 3.9, 24, true);
  P.box(M.pinkDark, cx - 1.75, cx + 1.75, 0.62, 1.05, cz - 1.75, cz + 1.75, 'b');
  P.box(M.pink, cx - 1.4, cx + 1.4, 1.05, 3.65, cz - 1.4, cz + 1.4, '');
  P.box(M.pinkDark, cx - 1.55, cx + 1.55, 3.65, 4.05, cz - 1.55, cz + 1.55, 'b');
  // gilded inscription plate on the front (towards Nevsky = -mz)
  P.box(M.gold, cx - 0.9, cx + 0.9, 1.9, 3.0, cz - 1.43, cz - 1.40, '');
  const rot = Math.PI + (east ? 0.35 : -0.35);
  // the bronze general (shared figure kit, statues.js) and the furled captured standards at his feet (a bundle of cloth, not a flag)
  const mk = figureMats(K.ctx).keys('bronze', 'bronze');
  (east ? kutuzov() : barclay()).place(P, mk, cx, 4.05, cz, rot, east ? 2.34 : 2.29);
  trophies(who).place(P, mk, cx, 4.05, cz, rot, 1.7);
  // four round granite stones on the platform edge
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; P.cyl(M.pink, [cx + Math.sin(a) * 3.3, 0.62, cz + Math.cos(a) * 3.3], [cx + Math.sin(a) * 3.3, 1.2, cz + Math.cos(a) * 3.3], 0.6, 0.55, 10, true); }
  // ring of 14 chain bollards with sagging chains
  const n = 12, pr = RB - 0.45, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + Math.sin(a) * pr, cz + Math.cos(a) * pr]); }
  pts.forEach((p, i) => {
    P.cyl(M.iron, [p[0], 0.16, p[1]], [p[0], 0.78, p[1]], 0.12, 0.09, 6, false);
    P.cyl(M.iron, [p[0], 0.78, p[1]], [p[0], 0.9, p[1]], 0.13, 0.13, 6, true);
    const q = pts[(i + 1) % n];
    for (let k = 0; k < 4; k++) { const t0 = k / 4, t1 = (k + 1) / 4, y = (t) => 0.7 - 0.2 * 4 * t * (1 - t); P.cyl(M.iron, [p[0] + (q[0] - p[0]) * t0, y(t0), p[1] + (q[1] - p[1]) * t0], [p[0] + (q[0] - p[0]) * t1, y(t1), p[1] + (q[1] - p[1]) * t1], 0.018, 0.018, 3, false); }
    cylAt(ph, p[0], p[1], 0.14, 0, 0.9);
  });
  // colliders: the pedestal block and the platform
  boxAt(ph, cx, cz, 3.1, 3.1, 0, -1, 8.5);
  // round planter (concrete tub) beside each plaza
  const px = cx + (east ? 6.4 : -6.4), pz = cz + 3.6;
  P.cyl(M.stoneShade, [px, 0.12, pz], [px, 0.95, pz], 0.62, 0.74, 12, false);
  P.cyl(M.soil, [px, 0.93, pz], [px, 0.94, pz], 0.62, 0.62, 12, true);
}

/** a spear fence along a polyline (model frame): textured picket plane (double sided, alpha cut) + granite-free iron posts every 2.5 m */
function fenceRun(P, M, pts, h, closed, base = 0.1) {
  const n = pts.length, last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.2) continue;
    const tile = 2.5, nt = len / tile;
    P.quad(M.pickets, [a[0], base, a[1]], [b[0], base, b[1]], [b[0], base + h, b[1]], [a[0], base + h, a[1]], [dz / len, 0, -dx / len], [[0, 0], [nt, 0], [nt, 1], [0, 1]]);
    const k = Math.max(1, Math.round(len / tile));
    for (let j = 0; j <= k; j++) { const t = j / k, x = a[0] + dx * t, z = a[1] + dz * t; P.cyl(M.iron, [x, base, z], [x, base + h + 0.12, z], 0.045, 0.045, 5, false); P.cyl(M.iron, [x, base + h + 0.12, z], [x, base + h + 0.2, z], 0.06, 0.0, 5, false); }
  }
}

/** a park bench: white slats on black cast-iron scroll ends; faces local +z after rot (model frame) */
function bench(P, M, x, z, rot, y = 0.12) {
  P.push(x, y, z, rot);
  for (const sx of [-0.7, 0.7]) { P.box(M.iron, sx - 0.03, sx + 0.03, 0.0, 0.45, -0.22, 0.22, 'b'); P.box(M.iron, sx - 0.03, sx + 0.03, 0.45, 0.9, -0.24, -0.18, 'b'); }
  P.box(M.white, -0.8, 0.8, 0.45, 0.5, -0.22, 0.2, 'b');
  P.box(M.white, -0.8, 0.8, 0.62, 0.72, -0.25, -0.21, ''); P.box(M.white, -0.8, 0.8, 0.8, 0.9, -0.25, -0.21, '');
  P.pop();
}
/** pink-gravel ribbons along the mapped footways whose segments lie inside the garden, joints filled with discs; uv from model coordinates so overlaps match */
function gardenPaths(P, M, park) {
  const y = PATH_Y, uvf = (p) => [p[0] / 3, p[2] / 3], seen = new Set();
  for (const r of ROADS) {
    if ((r.hw !== 'footway' && r.hw !== 'path') || r.surface === 'paving_stones') continue;
    const pts = flatToModel(r.pts), w = (r.id === 'w115318449' || r.id === 'w115318454' || r.id === 'w115318458') ? 3.4 : 2.8;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (!(pointIn(park, a[0], a[1]) && pointIn(park, b[0], b[1]) && pointIn(park, mx, mz))) continue;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.05) continue;
      const nx = -dz / l * w / 2, nz = dx / l * w / 2;
      P.quad(M.gravel, [a[0] - nx, y, a[1] - nz], [a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], [0, 1, 0], [[(a[0] - nx) / 3, (a[1] - nz) / 3], [(a[0] + nx) / 3, (a[1] + nz) / 3], [(b[0] + nx) / 3, (b[1] + nz) / 3], [(b[0] - nx) / 3, (b[1] - nz) / 3]]);
      for (const q of [a, b]) {
        const key = q[0].toFixed(1) + ',' + q[1].toFixed(1) + ',' + w; if (seen.has(key)) continue; seen.add(key);
        const ring = []; for (let k = 0; k < 10; k++) { const t = k / 10 * Math.PI * 2; ring.push([q[0] + Math.cos(t) * w / 2, y, q[1] + Math.sin(t) * w / 2]); }
        P.fan(M.gravel, ring, [0, 1, 0], uvf);
      }
    }
  }
}

/** packed clipped balls inside a polygon (jittered grid, 1.7 m) */
function hedgeBalls(P, M, ring, rng, k) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ring) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const geo = new THREE.IcosahedronGeometry(1, 1);
  for (let x = x0; x <= x1; x += 1.7) for (let z = z0; z <= z1; z += 1.7) {
    const px = x + (rng() - 0.5) * 0.9, pz = z + (rng() - 0.5) * 0.9; if (!pointIn(ring, px, pz)) continue;
    const r = 1.25 + rng() * 0.45, h = 1.05 + rng() * 0.5;
    P.geo((k + Math.round(px)) % 2 ? M.hedge2 : M.hedge, geo, px, LAWN_Y + h * 0.82, pz, rng() * 3, rng() * 3, 0, r, h, r);
  }
  geo.dispose();
}

/** a garden tree: trunk + clumped crown balls */
function tree(P, M, x, z, h, rad, rng) {
  P.cyl(M.bark, [x, LAWN_Y, z], [x, LAWN_Y + h * 0.66, z], 0.3, 0.2, 7, false);
  const geo = new THREE.IcosahedronGeometry(1, 1), n = 4 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2, d = i ? rad * 0.5 : 0, r = rad * (i ? 0.62 + rng() * 0.2 : 0.9);
    P.geo(i % 2 ? M.crownC : M.hedge2, geo, x + Math.cos(a) * d, LAWN_Y + h * (0.66 + (i ? 0.1 * rng() : 0.2)), z + Math.sin(a) * d, rng() * 3, rng() * 3, 0, r, r * 0.85, r);
  }
  geo.dispose();
}
void THREE;
