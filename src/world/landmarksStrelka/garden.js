// landmarksStrelka/garden.js - Birzhevaya Square around the columns and the semicircular garden of the Spit (Биржевой сквер; laid out 1896, regular plan of L. A. Ilyin 1925-26):
// docs/research/strelka.md 2.5, photos refs/strelka g_07 g_08 g_11 aer_01 wh_02 q_07 ex_02.
//   square: red-brown pavers on the two column platforms (OSM footway areas r10631793 / r10631794), clipped at the asphalt (net.cover);
//   garden: the lawn over the park polygon w216655348, gravel paths on the OSM footways, the round gravel area of the tip, raised begonia beds on the OSM flowerbed polygons, the row of clipped
//   limes inside the parapet (box-shaped on the south arc, ball-shaped on the north arc; the tip stays open), a low hedge, white benches at the OSM bench nodes, black lanterns;
//   the river ANCHOR of 1723 on its round two-step granite platform (OSM node "Якорь") and the bronze MEMORIAL SIGN of 2003 on a granite drum (OSM memorial n6581377209).
// Everything of the garden is laid out in the ensemble frame around SC = the centre of the semicircle (frame.js); angles are measured from the axis (+z) toward +x (north).
import * as THREE from 'three';
import * as L from '../layout.js';
import { ROADS, AREAS, GREEN, FURNITURE, POIS } from '../data/city.js';
import { ROT, W, Wa, M as toModel, SC, DEG } from './frame.js';
import { ribbon, pairs, fillPolyFine, coverFn, inRing } from './surfaces.js';
import { arcWall, arcFlat, pol, lathe, plate } from './prims.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { anchor } from './prows.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): benches and lanterns are knock records,
import { knockBays } from '../lib/fence-bays.js';                                  // the low clipped hedge is a row of breakable (ghost) bays

export const PARK_ID = 'w216655348';
export const PATH_IDS = ['w102582395', 'w496635211', 'w1447887324', 'w1447887325', 'w102582391', 'w102582392', 'w102582396', 'w102582398', 'w1447887326', 'w1447887327'];
export const BED_IDS = ['w764205826', 'w764205823', 'w764205824', 'w764205825', 'w1447719714', 'w1447719715', 'w1447719716'];
const WIDE = new Set(['w496635211', 'w102582391', 'w102582398']);
const R_TREE = 66.6, R_HEDGE = 64.4, R_LAMP = 63.2;
const HEDGE = [[-82, -64], [-61, -43], [-40, -14], [44, 61], [64, 82]];                 // hedge runs (degrees off the axis) with passages between them

/** fill a polygon with triangles no longer than maxEdge, dropping the triangles that touch asphalt */
function fillClipped(P, mat, ring, y, cover, o = {}) {
  const Q = { bucket: (m) => P.bucket(m), _vert: (...a) => P._vert(...a), tris: 0 };
  const k = P.bucket(mat), n0 = k.n, i0 = k.idx.length;
  fillPolyFine(Q, mat, ring, y, { maxEdge: o.maxEdge ?? 5, tile: o.tile ?? 1.6 });
  // drop triangles on the carriageway (centroid or a vertex within 0.15 m of asphalt)
  const keep = [];
  for (let i = i0; i < k.idx.length; i += 3) {
    const v = [k.idx[i], k.idx[i + 1], k.idx[i + 2]].map((q) => [k.pos[q * 3], k.pos[q * 3 + 2]]);
    const cx = (v[0][0] + v[1][0] + v[2][0]) / 3, cz = (v[0][1] + v[1][1] + v[2][1]) / 3;
    if (cover(cx, cz) > -0.15 || v.some((p) => cover(p[0], p[1]) > -0.05)) continue;
    keep.push(k.idx[i], k.idx[i + 1], k.idx[i + 2]);
  }
  k.idx.length = i0; for (const q of keep) k.idx.push(q);
  P.tris += keep.length / 3; void n0;
}

export function garden(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  const clip = (x, z) => cover(x, z) > -0.2;
  // ---------------------------------------------------------------------------------------------- the column platforms (world frame)
  for (const id of ['r10631793', 'r10631794']) {
    const a = AREAS.find((q) => q.id === id); if (!a) continue;
    for (const p of a.polys) fillClipped(P, M.pavers, pairs(p.o), 0.05, cover, { maxEdge: 6 });
  }
  // ---------------------------------------------------------------------------------------------- lawn, paths, beds (world frame)
  const park = GREEN.find((g) => g.id === PARK_ID);
  const ring = park ? pairs(park.polys[0].o) : [];
  if (ring.length) fillPolyFine(P, M.lawn, ring, 0.03, { maxEdge: 22, tile: 6 });
  for (const r of ROADS) {
    if (!PATH_IDS.includes(r.id)) continue;
    ribbon(P, M.gravel, pairs(r.pts), WIDE.has(r.id) ? 4.2 : 3.0, 0.046 + (PATH_IDS.indexOf(r.id) % 5) * 0.0015, { clip, tile: 3, seg: 2.2 });
  }
  const tip = AREAS.find((q) => q.id === 'w1447719717'); if (tip) fillPolyFine(P, M.gravel, pairs(tip.polys[0].o), 0.056, { maxEdge: 8, tile: 3 });
  for (const [i, id] of BED_IDS.entries()) {
    const b = GREEN.find((g) => g.id === id); if (!b) continue;
    const pts = pairs(b.polys[0].o), mat = i % 2 ? M.begoniaPink : M.begonia;
    P.cap(mat, pts, 0.2, true, 0.9);
    for (let k = 0; k < pts.length; k++) { const a = pts[k], c = pts[(k + 1) % pts.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1; P.quad(mat, [a[0], 0.03, a[1]], [c[0], 0.03, c[1]], [c[0], 0.2, c[1]], [a[0], 0.2, a[1]], null, [[0, 0], [l, 0], [l, 0.2], [0, 0.2]]); P.quad(mat, [c[0], 0.03, c[1]], [a[0], 0.03, a[1]], [a[0], 0.2, a[1]], [c[0], 0.2, c[1]], null, [[0, 0], [l, 0], [l, 0.2], [0, 0.2]]); }
  }

  // ---------------------------------------------------------------------------------------------- limes, hedge, benches, lamps (ensemble frame around SC)
  const trees = [];
  for (let a = 14; a <= 80; a += 5.4) trees.push({ a: -a * DEG, kind: 'box' });                 // south arc: a continuous clipped row
  for (let a = 44; a <= 80; a += 7.2) trees.push({ a: a * DEG, kind: 'ball' });                 // north arc: fewer, ball crowns
  const rng = ctx.rng(20261007);
  const crownBox = new THREE.BoxGeometry(6.0, 5.4, 5.4, 3, 3, 3), crownBall = new THREE.IcosahedronGeometry(3.4, 1);
  for (const [g, round] of [[crownBox, 0.3], [crownBall, 1]]) {
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pa, i), n = v.clone().normalize().multiplyScalar(3.5), h = Math.sin(v.x * 2.1 + v.y * 1.3) * Math.cos(v.z * 1.7 + v.y) * 0.22; v.lerp(n, round * 0.35 + (round < 1 ? 0.22 : 0)).multiplyScalar(1 + h * 0.3); pa.setXYZ(i, v.x, v.y * (round < 1 ? 1 : 0.92), v.z); }
    g.computeVertexNormals();
  }
  const trunk = new THREE.CylinderGeometry(0.2, 0.3, 3.6, 7); trunk.translate(0, 1.8, 0);
  crownBox.translate(0, 6.0, 0); crownBall.translate(0, 6.3, 0);
  const tm = (t) => { const p = pol(SC, R_TREE, t.a), w = W(p[0], p[1]); return { w, m: mat4(w.x, 0, w.z, ROT + t.a, 0.94 + rng() * 0.12) }; };
  const placed = trees.map((t) => ({ ...t, ...tm(t) })).filter((t) => !ring.length || inRing(ring, t.w.x, t.w.z));
  for (const kind of ['box', 'ball']) {
    const list = placed.filter((t) => t.kind === kind); if (!list.length) continue;
    const r = addInstanced(ctx, K.root, 'lmSt-limes-' + kind, { list: [{ mat: M.lime, geo: kind === 'box' ? crownBox : crownBall }, { mat: M.bark, geo: trunk }] }, list.map((t) => t.m));
    K.extraTris += r.tris;
  }
  for (const t of placed) ph.addCylinder(t.w.x, t.w.z, 0.32, 0, 4);
  P.push(W(0, 0).x, 0, W(0, 0).z, ROT);
  try {
    // hedge on both arcs between the path and the trees (0.75 m high, 0.8 m wide), open at the tip and at the ends
    for (const [a0, a1] of HEDGE.map(([p, q]) => [p * DEG, q * DEG])) {
      arcWall(P, M.hedge, SC, R_HEDGE + 0.4, a0, a1, 0.03, 0.78, true, { tile: 1.2, tileY: 1.2 }); arcWall(P, M.hedge, SC, R_HEDGE - 0.4, a0, a1, 0.03, 0.78, false, { tile: 1.2, tileY: 1.2 });
      arcFlat(P, M.hedge, SC, R_HEDGE - 0.4, R_HEDGE + 0.4, a0, a1, 0.78, true, { tile: 1.2 });
      for (const a of [a0, a1]) { const p = pol(SC, R_HEDGE - 0.4, a), q = pol(SC, R_HEDGE + 0.4, a); P.quad(M.hedge, [p[0], 0.03, p[1]], [q[0], 0.03, q[1]], [q[0], 0.78, q[1]], [p[0], 0.78, p[1]], null); P.quad(M.hedge, [q[0], 0.03, q[1]], [p[0], 0.03, p[1]], [p[0], 0.78, p[1]], [q[0], 0.78, q[1]], null); }
    }
    monuments(K);
  } finally { P.pop(); }
  // the hedge (0.8 m): its collider is a row of BREAKABLE bays (a ghost bay: the drawn hedge stays, as the drawn panels of the Blagoveshchensky wing walls do; a bump holds, a car pushes through); one bay per 4 degrees of the run
  {
    const hb = [];
    for (const [a0, a1] of HEDGE) { const n = Math.max(1, Math.round((a1 - a0) / 4)); for (let i = 0; i < n; i++) { const p0 = pol(SC, R_HEDGE, (a0 + (a1 - a0) * i / n) * DEG), p1 = pol(SC, R_HEDGE, (a0 + (a1 - a0) * (i + 1) / n) * DEG), w0 = W(p0[0], p0[1]), w1 = W(p1[0], p1[1]); hb.push({ x0: w0.x, z0: w0.z, x1: w1.x, z1: w1.z, y: 0, ghost: true }); } }
    knockBays(ctx, { name: 'lmSt-hedge', bays: hb, parts: [], far: 260, collider: { y0: 0, y1: 0.8, thick: 0.9, e0: 0.05, e1: 0.05 }, rec: () => ({ kind: 'fence', mass: 80, h: 0.8, anchored: 12, hitK: 0.3, metal: false, minDv: 0 }) });
  }

  // benches: white garden sofas at the OSM bench nodes inside the park, facing the lawn (toward SC)
  const benchGeo = partsGeos((Q) => {
    Q.box(M.bench, -1.0, 1.0, 0.4, 0.46, -0.24, 0.24, ''); for (let k = 0; k < 4; k++) Q.box(M.bench, -1.0, 1.0, 0.56 + k * 0.11, 0.63 + k * 0.11, -0.3, -0.26, '');
    for (const x of [-0.94, 0.94]) { Q.box(M.bench, x - 0.04, x + 0.04, 0, 0.98, -0.32, -0.24, 'b'); Q.box(M.bench, x - 0.04, x + 0.04, 0, 0.4, 0.16, 0.24, 'b'); Q.box(M.bench, x - 0.04, x + 0.04, 0.6, 0.66, -0.3, 0.24, ''); }
  });
  const benches = FURNITURE.filter((f) => f.kind === 'bench' && ring.length && inRing(ring, f.x, f.z));
  const bIt = [], bm = benches.map((f) => { const m = toModel(f.x, f.z), a = Math.atan2(m[0] - SC[0], m[1] - SC[1]); K.svc.benches.push({ x: f.x, z: f.z, rotY: ROT + a + Math.PI, len: 2 }); bIt.push(ph.addBox(f.x, f.z, 2.0, 0.6, ROT + a + Math.PI, 0, 0.9)); return { x: f.x, y: 0.04, z: f.z, rotY: ROT + a + Math.PI }; });
  K.extraTris += knockFurniture(ctx, 'lmSt-benches', benchGeo, bm, bIt, { ...FURNITURE_REC.bench, w: 2.0 }, 260);      // (knock records since the areas round of docs/AREAS.md 13.7: the colliders are the records' items)
  // lanterns along the arc path (black post 3.6 m, a glazed lantern)
  const lampGeo = partsGeos((Q) => {
    Q.cyl(M.iron, [0, 0, 0], [0, 0.5, 0], 0.11, 0.08, 8, false); Q.cyl(M.iron, [0, 0.5, 0], [0, 3.3, 0], 0.05, 0.04, 6, false);
    Q.cyl(M.lampGlass, [0, 3.3, 0], [0, 3.75, 0], 0.13, 0.2, 6, false); Q.cyl(M.iron, [0, 3.75, 0], [0, 3.95, 0], 0.24, 0.03, 6, true);
  });
  const lamps = [], lIt = []; for (const a of [-76, -58, -40, -22, 22, 40, 58, 76]) { const p = pol(SC, R_LAMP, a * DEG), w = W(p[0], p[1]); if (ring.length && !inRing(ring, w.x, w.z)) continue; lamps.push({ x: w.x, y: 0.03, z: w.z, rotY: 0 }); K.svc.lamps.push({ x: w.x, z: w.z, h: 3.9 }); lIt.push(ph.addCylinder(w.x, w.z, 0.14, 0, 3.9)); }
  K.extraTris += knockFurniture(ctx, 'lmSt-lamps', lampGeo, lamps, lIt, FURNITURE_REC.lamp(3.9), 300);
  K.svc.crowd.push({ ...W(0, 150), r: 26, n: 14, kind: 'park', name: 'Биржевой сквер' }, { ...W(0, 172), r: 7, n: 8, kind: 'viewpoint', name: 'Стрелка Васильевского острова' });
  K.svc.photoSpots.push({ ...W(0, 173), yaw: 0, name: 'Стрелка: вид на Петропавловскую крепость' }, { ...W(0, 118), yaw: 0, name: 'Биржа из сквера' });
  void L; void Wa; void plate;
}

// -------------------------------------------------------------------------------------------------- the anchor and the memorial sign (ensemble frame)
function monuments(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  // ---- the anchor: a round two-step granite platform, the anchor lying on its stock and one fluke
  const ap = POIS.find((p) => p.name === 'Якорь' && Math.abs(p.x + 2513.7) < 30 && Math.abs(p.z + 1288.7) < 30), am = ap ? toModel(ap.x, ap.z) : [-1.1, 111.2];
  lathe(P, M.granitePlain, am[0], am[1], [[3.3, 0.03], [3.3, 0.2], [3.05, 0.2], [2.7, 0.21], [2.7, 0.38], [2.45, 0.39], [0.01, 0.4]], 28);
  anchor().place(P, { main: M.anchor }, am[0] + 0.1, 1.22, am[1], 0.9, 1.55, 0.42, 2.02);
  const aw = W(am[0], am[1]); ph.addWalkBox(aw.x, aw.z, 4.8, 4.8, ROT, 0.38, 0); ph.addBox(aw.x, aw.z, 2.6, 0.5, ROT + 0.7, 0.3, 1.6);
  K.svc.monuments.push({ id: 'strelka-anchor', name: 'Якорь 1723 года', x: aw.x, z: aw.z, h: 1.6, r: 3.3 });
  // ---- the memorial sign: a granite drum with a tilted bronze relief of the Spit as it was in the 1830s
  const sm = toModel(-2472.8, -1314.5);
  lathe(P, M.granitePlain, sm[0], sm[1], [[1.3, 0.03], [1.32, 0.3], [1.22, 0.52], [1.12, 0.58], [0.01, 0.6]], 24);
  const tex = ctx.tex.draw(512, 512, (g, w, h) => {
    g.fillStyle = '#4a5646'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5f6f58'; g.beginPath(); g.arc(256, 256, 250, 0, 6.3); g.fill();
    g.fillStyle = '#48553f'; g.beginPath(); g.arc(256, 256, 196, 0, 6.3); g.fill();
    // the plan: the semicircle of the Spit, the Exchange, the warehouses, the columns, ships on the water
    g.fillStyle = '#6f7f66'; g.beginPath(); g.arc(256, 300, 78, 0, Math.PI, false); g.closePath(); g.fill();
    g.fillStyle = '#93a487'; g.fillRect(206, 196, 100, 70); g.fillStyle = '#7d8e72'; g.fillRect(216, 206, 80, 50);
    g.fillStyle = '#86977b'; g.fillRect(120, 180, 70, 44); g.fillRect(322, 180, 70, 44); g.fillRect(128, 232, 44, 30); g.fillRect(340, 232, 44, 30);
    for (const x of [160, 352]) { g.fillStyle = '#a9b99c'; g.beginPath(); g.arc(x, 300, 9, 0, 6.3); g.fill(); }
    g.strokeStyle = '#3b4635'; g.lineWidth = 2; for (let i = 0; i < 26; i++) { const y = 388 + (i % 4) * 14, x = 96 + i * 13; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - 5, x + 10, y); g.stroke(); }
    g.fillStyle = '#b9c7ab'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const arc = (text, r, a0, a1, size) => { g.font = `700 ${size}px ${ctx.tex.FONTS.serif}`; const n = text.length; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / n; g.save(); g.translate(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); g.rotate(a + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2)); g.fillText(text[i], 0, 0); g.restore(); } };
    arc('СТРЕЛКА ВАСИЛЬЕВСКОГО ОСТРОВА', 222, -Math.PI * 0.86, -Math.PI * 0.14, 26);
    arc('ЗДЕСЬ НАХОДИЛСЯ КРУПНЕЙШИЙ ЦЕНТР ВНЕШНЕЙ ТОРГОВЛИ РОССИЙСКОЙ ИМПЕРИИ', 224, Math.PI * 0.97, Math.PI * 0.03, 17);
    g.font = `600 13px ${ctx.tex.FONTS.serif}`; g.fillText('РЕКОНСТРУКЦИЯ НА 1830-е ГОДЫ', 256, 448);
  }, { key: 'lmSt-sign' });
  const signMat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmSt-sign', paint: 0.03 });
  // the disc faces the Exchange (-z), tilted 14 degrees so that a reader standing west of it sees it upright
  const R = 1.06, n = 28, yc = 0.74, tilt = 0.24, disc = [], uv = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R; disc.push([sm[0] + x, yc + z * Math.sin(tilt), sm[1] + z * Math.cos(tilt)]); uv.push([0.5 - x / (2 * R), 0.5 + z / (2 * R)]); }
  let vi = 0; P.fan(signMat, disc, [0, 1, -0.2], () => uv[vi++ % n]);
  lathe(P, M.bronze, sm[0], sm[1], [[1.1, 0.56], [1.1, 0.66]], 24);
  const sw = W(sm[0], sm[1]); ph.addCylinder(sw.x, sw.z, 1.3, 0, 1.0);
  K.svc.monuments.push({ id: 'strelka-sign', name: 'Памятный знак «Стрелка Васильевского острова»', x: sw.x, z: sw.z, h: 1, r: 1.3 });
}
