// landmarksMenshikov/forecourt.js - the surroundings of the Menshikov Palace (docs/research/menshikov.md section 2.4; photos refs/menshikov 05 13 24 114 N04 N05 N16; OSM lawns w767617585..91, footways
// w767617581 / 82 / 83 / 84 / 88, fences w216655350 / 51 / w1284290253 / 54, gates n2260468844 / n2260468882):
//   FENCE    black iron railing (spears and fleur-de-lis, two rails, a band of C-scrolls) on a 0.45 m limestone wall, square piers every 2.8 m; the WEST gate (a -43.4) is open = the museum visitors' way to the
//            door of the west wing (P -26.8, -14.6; double door, small canopy, a grey ramp), the EAST gate (a +45.1) is a closed service gate; the museum plate hangs beside the west gate.
//   HEDGE    clipped privet 1.3 x 1.1 m in front of the fence (west a -90.5 .. -4.3 with a gap at the west gate; east a +20.5 .. +79 with a gap at the east gate); plain lawn in front of the east half of the recess.
//   GROUND   mown lawn on the OSM strips, the brick herringbone path 8.6 m wide to the portico, brick path from the west gate to the west-wing door, grey paving footways at the east gate.
//   TREES    two rows of clipped (pleached) limes behind the hedge, the walled-in lime garden west of the west wing (closed: seen over the gallery), the first court (brick paving, two oval box parterres).
import * as THREE from 'three';
import * as L from '../layout.js';
import { GREEN } from '../data/city.js';
import { PF, HP } from './frame.js';
import { ironFence } from './fence.js';
import { hedgeWall, ellipse, lawnPoly } from './plants.js';
import { fillPolyClipped, fillPolyFine, ribbon, coverFn, pairs, inRing } from './surfaces.js';
import { plantTrees } from './trees.js';
import { tbox } from './geo.js';

const LAWNS = ['w767617585', 'w767617586', 'w767617587', 'w767617589', 'w767617590', 'w767617591'];
const pw = (a, b) => { const p = PF.W(a, b); return [p.x, p.z]; };

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMenshikov] forecourt/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const cover = coverFn(K.ctx);
  stage('lawns', () => { for (const g of GREEN) if (LAWNS.includes(g.id)) for (const p of g.polys) lawnPoly(K, pairs(p.o), p.h.map(pairs)); });
  stage('paths', () => paths(K, cover));
  stage('fence', () => fences(K));
  stage('hedges', () => hedges(K));
  stage('trees', () => trees(K));
  stage('court', () => court(K));
  stage('plate', () => details(K));
  stage('services', () => services(K, cover));
  if (errs.length) throw new Error(errs.join('\n'));
}

function paths(K, cover) {
  const { P, M } = K, clip = (x, z) => cover(x, z) > -0.25 || L.insideBuilding(x, z, 0.3);
  // the central brick path to the portico (8.6 m wide; the floor under the balcony slab is the same brick)
  const r1 = [[-4.3, -0.2], [4.3, -0.2], [4.3, 9.4], [-4.3, 9.4]].map(([a, b]) => pw(a, b));
  fillPolyClipped(P, M.brick, r1, 0.04, (x, z) => (L.insideBuilding(x, z, 0.05) ? 1 : cover(x, z)), { margin: 0.2, maxEdge: 3, tile: 1.6 });
  // under the portico beyond the path: a brick floor between the wall and the front columns (a -9 .. 9, b -0.2 .. 3.4)
  const r2 = [[-9, -0.2], [9, -0.2], [9, 3.4], [-9, 3.4]].map(([a, b]) => pw(a, b));
  fillPolyClipped(P, M.brick, r2, 0.035, (x, z) => (L.insideBuilding(x, z, 0.05) ? 1 : cover(x, z)), { margin: 0.2, maxEdge: 3, tile: 1.6 });
  // the visitors' way: from the pavement through the west gate to the door of the west wing (2.4 m, brick)
  const wp = [[-43.4, 9.4], [-43.4, 2.1], [-43.4, -3.5], [-33.5, -9.0], [-27.9, -11.5], [-27.9, -13.6]].map(([a, b]) => pw(a, b));
  ribbon(P, M.brick, wp, 2.4, 0.04, { tile: 1.6, seg: 2.5, clip });
  // east gate path and the footway at a 80 (grey paving)
  ribbon(P, M.paving, [[45.1, 9.4], [45.1, 3.6]].map(([a, b]) => pw(a, b)), 2.0, 0.04, { tile: 1.5, seg: 2.5, clip });
  ribbon(P, M.paving, [[79.9, 9.4], [79.9, 4.0]].map(([a, b]) => pw(a, b)), 1.6, 0.04, { tile: 1.5, seg: 2.5, clip });
}

function fences(K) {
  const base = { mat: K.M.lime, h: 0.45, w: 0.36, tu: 3.6, tv: 0.72, cap: K.M.limeTop };
  const common = { panel: K.M.fencePalace, tile: 2.8, top: 1.6, base, posts: 'square', every: 2.8, gatePost: 'square' };
  const west = ironFence(K, { ...common, id: 'palace-w', pts: [[-67.7, 2.0], [-43.4, 2.1], [-20.1, 2.5]].map(([a, b]) => pw(a, b)),
    gates: [{ id: 'n2260468844', x: pw(-43.4, 2.1)[0], z: pw(-43.4, 2.1)[1], w: 3.0, open: true, name: 'Дворец Меншикова: западные ворота (вход для посетителей)' }] });
  const east = ironFence(K, { ...common, id: 'palace-e', pts: [[20.1, 2.7], [45.1, 3.2], [70.4, 3.7]].map(([a, b]) => pw(a, b)),
    gates: [{ id: 'n2260468882', x: pw(45.1, 3.2)[0], z: pw(45.1, 3.2)[1], w: 3.0, open: false, name: 'Дворец Меншикова: восточные ворота (служебные, закрыты)' }] });
  const court = ironFence(K, { ...common, id: 'palace-court', pts: [[19.7, -40.8], [-14.7, -40.6]].map(([a, b]) => pw(a, b)), gates: [] });
  const wall = ironFence(K, { ...common, id: 'palace-ewall', pts: [[33.4, -40.9], [79.9, -41.2]].map(([a, b]) => pw(a, b)), gates: [] });
  for (const [id, f, pts] of [['w216655350', west, 'W'], ['w216655351', east, 'E'], ['w1284290253', court, 'C'], ['w1284290254', wall, 'N']]) {
    K.svc.fences.push({ id, kind: 'iron', h: 2.05, runs: f.runs, gates: f.gates.map((g) => g.id), tag: pts });
    for (const g of f.gates) (K.svc.gates ||= []).push(g);
  }
}

function hedges(K) {
  const run = (a0, a1) => hedgeWall(K, [pw(a0, 5.6), pw(a1, 5.6)], 1.3, 1.1, { ext: 0.3 });
  run(-90.5, -45.9); run(-40.9, -4.3);                     // west: a gap for the west gate path, the brick path gap -4.3 .. +3.3 (the path itself is 8.6 m)
  run(20.5, 43.0); run(47.2, 79.0);                        // east: plain lawn from +3.3 to +20.5 (photos 24 114), a gap for the east gate
}

function trees(K) {
  const rng = K.ctx.rng(5101), list = [];
  // clipped (pleached) limes behind the hedge: bare trunks, round crowns 3 m
  for (let i = 0; i < 5; i++) list.push({ x: pw(22.5 + i * 3, 3.9)[0], z: pw(22.5 + i * 3, 3.9)[1], fam: 'ball', s: 1.0 + rng() * 0.08, yaw: rng() * 6 });
  for (let i = 0; i < 5; i++) list.push({ x: pw(-37.5 + i * 3, 3.5)[0], z: pw(-37.5 + i * 3, 3.5)[1], fam: 'ball', s: 1.0 + rng() * 0.08, yaw: rng() * 6 });
  // the walled-in lime garden west of the west wing (closed): 12-15 m limes
  for (let i = 0; i < 14; i++) {
    const a = -78 + (i % 7) * 6.2 + (rng() - 0.5) * 2.4, b = -38 + Math.floor(i / 7) * 6.6 + (rng() - 0.5) * 2, p = pw(a, b);
    if (L.insideBuilding(p[0], p[1], 3)) continue;
    list.push({ x: p[0], z: p[1], fam: rng() < 0.5 ? 'limeA' : 'limeB', s: 0.9 + rng() * 0.25, yaw: rng() * 6 });
  }
  K.svc.trees.push(...list.map((t) => ({ x: t.x, z: t.z, r: 2.5, h: 8 })));
  plantTrees(K, list, 'lmmensh-fc-trees');
}

function court(K) {
  const { P, M, ctx } = K;
  // the first court: brick herringbone between the two wings, round the rear stair bay; two oval parterres with a white pedestal each
  const ring = [[-18.7, -40.4], [19.5, -40.4], [19.4, -16.1], [6.0, -16.1], [6.1, -21.3], [-6.0, -21.3], [-6.1, -16.2], [-18.8, -16.3]].map(([a, b]) => pw(a, b));
  fillPolyFine(P, M.brick, ring, 0.04, { maxEdge: 6, tile: 1.6 });
  for (const s of [-1, 1]) {
    const c = pw(s * 9.0, -29.0), rot = -PF.rot;
    const oval = ellipse(c[0], c[1], 5.2, 3.3, rot, 24);
    fillPolyFine(P, M.lawn, oval, 0.06, { maxEdge: 4, tile: 3 });
    hedgeWall(K, oval.concat([oval[0]]), 0.5, 0.5, { collider: false, ext: 0.05 });
    // pedestal 0.55 x 0.55 x 1.1 with a small white urn (the statues of the parterres are not modelled)
    P.push(c[0], 0, c[1], PF.rot);
    tbox(P, M.graniteLight, -0.3, 0.3, 0.06, 1.1, -0.3, 0.3, 1.2, 1.2, 'b');
    P.box(M.whiteFlat, -0.38, 0.38, 1.1, 1.2, -0.38, 0.38, 'b', 1);
    P.cyl(M.whiteFlat, [0, 1.2, 0], [0, 1.9, 0], 0.22, 0.12, 10, true);
    P.pop();
    ctx.physics.addCylinder(c[0], c[1], 0.45, 0, 1.9);
  }
}

function details(K) {
  const { P, M, ctx } = K, labels = ctx.services.labels;
  // ---- the museum plate beside the west gate (fence panel, street side): 0.70 x 0.55 m grey-green metal, the real text of photo 13
  {
    const a = -45.5, b = 2.1 + 0.2, c = PF.W(a, b);
    const ok = !labels || labels.reserve('w216655164', c.x, 1.55, c.z, 0.7, 0.55, PF.bz[0], PF.bz[1], 'plate-landmark');
    if (ok) {
      const tex = M.A.plate('palacePlate', [['ГОСУДАРСТВЕННЫЙ', 0.12], ['ЭРМИТАЖ', 0.12], ['ДВОРЕЦ МЕНШИКОВА', 0.15], ['MENSHIKOV PALACE', 0.14], ['КАССА МУЗЕЯ ОТКРЫТА', 0.075], ['С 10.30 ДО 16.30', 0.075], ['ВЫХОДНОЙ ДЕНЬ — ПОНЕДЕЛЬНИК', 0.075]], 512, 400);
      const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmmensh-palacePlate', paint: 0.01 });
      P.push(PF.x, 0, PF.z, PF.rot);
      P.box(M.iron, a - 0.37, a + 0.37, 1.26, 1.84, b - 0.04, b, 'k', 1);
      P.quad(mat, [a - 0.34, 1.29, b + 0.006], [a + 0.34, 1.29, b + 0.006], [a + 0.34, 1.81, b + 0.006], [a - 0.34, 1.81, b + 0.006], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.pop();
    }
  }
  // ---- the visitors' door in the south end wall of the west wing (P -27.9, -14.6): double door 1.4 x 2.4, a small hipped canopy, a grey ramp
  P.push(PF.x, 0, PF.z, PF.rot);
  {
    const a = -27.9, b = -14.6;
    P.box(M.door, a - 0.7, a + 0.7, 0.02, 2.4, b + 0.04, b + 0.14, 'b');
    P.box(M.creamFlat, a - 0.05, a + 0.05, 0.02, 2.4, b + 0.14, b + 0.17, 'b');
    P.box(M.creamFlat, a - 0.85, a - 0.7, 0.0, 2.55, b + 0.0, b + 0.2, 'b'); P.box(M.creamFlat, a + 0.7, a + 0.85, 0.0, 2.55, b + 0.0, b + 0.2, 'b'); P.box(M.creamFlat, a - 0.85, a + 0.85, 2.4, 2.55, b + 0.0, b + 0.2, '');
    // canopy: two sloped boards
    P.quad(M.dormerWood, [a - 1.2, 2.9, b + 0.02], [a + 1.2, 2.9, b + 0.02], [a + 1.2, 2.55, b + 1.1], [a - 1.2, 2.55, b + 1.1], [0, 0.6, 0.8]);
    P.quad(M.dormerWood, [a - 1.2, 2.88, b + 0.02], [a + 1.2, 2.88, b + 0.02], [a + 1.2, 2.53, b + 1.1], [a - 1.2, 2.53, b + 1.1], [0, -0.6, -0.8]);
    P.box(M.dormerWood, a - 1.2, a - 1.14, 2.5, 2.9, b + 0.0, b + 1.1, '');
    P.box(M.dormerWood, a + 1.14, a + 1.2, 2.5, 2.9, b + 0.0, b + 1.1, '');
  }
  P.pop();
  K.svc.entrances.push({ id: 'palace-visitors-door', ...(() => { const p = PF.W(-27.9, -14.0); return { x: p.x, z: p.z }; })(), rotY: PF.rot, open: false });
}

function services(K, cover) {
  const spot = (a, b, ta, tb, name, pitch = 6) => { const p = PF.W(a, b), t = PF.W(ta, tb); if (cover(p.x, p.z) < -0.6) K.svc.photoSpots.push({ x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch, name }); };
  spot(0, 11, 0, -4, 'Дворец Меншикова: фасад и портик', 10);
  spot(-38, 11, 8, -2, 'Дворец Меншикова: вдоль фасада с запада', 8);
  spot(48, 11, -6, -2, 'Дворец Меншикова: вдоль фасада с востока', 8);
  const c = PF.W(0, 8); K.svc.crowd.push({ id: 'palace-forecourt', kind: 'photo', x: c.x, z: c.z, r: 6, n: 6 });
  const c2 = PF.W(-35, 0); K.svc.crowd.push({ id: 'palace-visitors', kind: 'queue', x: c2.x, z: c2.z, r: 5, n: 4 });
  void HP; void THREE; void inRing;
}
