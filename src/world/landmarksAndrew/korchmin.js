// landmarksAndrew/korchmin.js - the two monuments of the boulevard's Sredny end (docs/research/andrew.md 5.5, 5.6; photos refs/andrew 84 85 86 87 88 89):
//   * the MONUMENT TO BOMBARDIER VASILY KORCHMIN (n951472000, 2003, G. Lukyanov / S. Sergeev): a young bombardier of Peter's time (wig, tricorn, long coat, breeches, boots) sits sideways on a bronze cannon, a long clay
//     pipe in his raised right hand, the left hand on the barrel; the carriage block with a lion head and a ring, a coil of rope, a pyramid of cannonballs; on a rough rose-red granite pedestal with a green-patina
//     plate, two half-round granite steps and two round stools; at B(238.2, -6.0) in the paved pocket of the west promenade, facing the ENE, the barrel toward Sredny pr. (-s);
//   * the HORSE-TRAM MONUMENT (n1352801081, "Памятник конке": a full-size copy of a 1872-78 Putilov-pattern car, 2004, bronze horses 2005, coachman 2009): a blue car with gold beading, seven windows a side, end
//     platforms and an open upper deck with a yellow banner board, two bronze horses with a coachman in front, on a paved platform with two rails inside a black lattice railing, with the steel plaque (the real text),
//     at B(21.3, 10.8), the car along the street, the horses toward Bolshoy pr.
// The figures come from the shared figure kit (lib/figures.js: human / horse).  Colliders: the pedestal block, the barrel and carriage, the enclosure rails, the car, the horses.
import * as THREE from 'three';
import { FB } from './frame.js';
import * as G from './geo.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { wallBoxes } from './ringkit.js';
import { knockBays, splitBays, unitPanel } from '../lib/fence-bays.js';
import { human, horse, cached, figureMats } from '../lib/figures.js';

const KORCHMIN = { s: 238.2, q: -6.0 }, KONKA = { s: 21.3, q: 10.8 };

function mats(K) {
  const { ctx, M } = K; if (M.kor) return M.kor;
  const T = ctx.mat.toon, tex = ctx.tex, F = tex.FONTS, W = '#ffffff';
  const draw = (w, h, fn, key) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat: [1, 1] });
  const plaqueTex = draw(256, 360, (g, w, h) => {                                      // the stainless plaque of the horse tram (photo 89, text read)
    g.fillStyle = '#c3c7c9'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c9193'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
    const lines = ['Здесь!', 'Установлена модель-копия', 'вагона Санкт-Петербургской «Конки»', 'образца 1872-1878 г.г. выпуска', '(в натуральную величину).', 'Данная модель-копия построена, опираясь',
      'на оригинальные чертежи', 'Путиловского завода,', 'проектировавшего большинство', 'российских «конок».', 'Первые вагоны «конки» пошли по улицам', 'Санкт-Петербурга 13 сентября 1863 года.',
      'Началась эпоха нового общественного', 'транспорта в России.'];
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1e2a3a';
    lines.forEach((t, i) => { let sz = i === 0 ? 20 : 13; g.font = `${i === 0 ? 700 : 500} ${sz}px ${F.serif}`; while (sz > 7 && g.measureText(t).width > w - 22) { sz--; g.font = `${i === 0 ? 700 : 500} ${sz}px ${F.serif}`; } g.fillText(t, w / 2, 24 + i * 23.5); });
  }, 'konkaPlaque');
  const bannerTex = draw(512, 64, (g, w, h) => {                                      // the yellow banner board of the upper deck (plain old-orthography words, no company)
    g.fillStyle = '#f3c431'; g.fillRect(0, 0, w, h); g.fillStyle = '#17120a'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    g.textAlign = 'center'; g.textBaseline = 'middle'; let sz = 40; g.font = `700 ${sz}px ${F.serif}`; while (sz > 12 && g.measureText('ТЕАТРАЛЬНЫЯ КАССЫ').width > w - 40) { sz--; g.font = `700 ${sz}px ${F.serif}`; }
    g.fillText('ТЕАТРАЛЬНЫЯ КАССЫ', w / 2, h / 2 + 2);
  }, 'konkaBanner');
  const winTex = draw(64, 96, (g, w, h) => { g.fillStyle = '#a86a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2a36'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = 'rgba(150,185,215,0.35)'; g.fillRect(6, 6, w - 12, 26); g.fillStyle = '#a86a2a'; g.fillRect(w / 2 - 2, 6, 4, h - 12); }, 'konkaWin');
  const m = {
    fm: figureMats(ctx),
    ped: T('#c08a7e', { map: M.A.graniteGrain, name: 'lmAnd-korPed', paint: 0.05 }), step: T('#c9a090', { map: M.A.graniteGrain, name: 'lmAnd-korStep', paint: 0.04 }),
    plate: T('#3f5a4d', { name: 'lmAnd-korPlate', paint: 0.03 }), barrel: T('#3d3a35', { name: 'lmAnd-korBarrel', paint: 0.02 }), rope: T('#4a4137', { name: 'lmAnd-korRope', paint: 0.03 }),
    // review (2026-10-08): the statues of this module are DARK BROWN-BLACK bronze in the photos (84 85 86 87), not the kit's verdigris green; the wear colour of the edges is a brass brown, not gilt
    bz: T('#4a4137', { name: 'lmAnd-statueBronze', paint: 0.03, emissive: '#140f09', emissiveIntensity: 0.25 }), bzWear: T('#7a6a4a', { name: 'lmAnd-statueWear', paint: 0.02 }),
    blue: T('#2a4fa0', { name: 'lmAnd-konkaBlue', paint: 0.03 }), gold: T('#d8a93a', { name: 'lmAnd-konkaGold', paint: 0.01 }), wood: T('#a86a2a', { name: 'lmAnd-konkaWood', paint: 0.03 }),
    wheel: T('#3a2f2a', { name: 'lmAnd-konkaWheel', paint: 0.02 }), roofC: T('#d9d2c4', { name: 'lmAnd-konkaRoof', paint: 0.03 }), railIron: T('#17191a', { name: 'lmAnd-konkaIron', paint: 0.01 }),
    win: T(W, { map: winTex, name: 'lmAnd-konkaWin', paint: 0, polygonOffset: -1 }), banner: T(W, { map: bannerTex, name: 'lmAnd-konkaBanner', paint: 0.01 }),
    plaque: T(W, { map: plaqueTex, name: 'lmAnd-konkaPlaque', paint: 0 }), setts: T('#9a9690', { map: M.A.sett, name: 'lmAnd-konkaSetts', paint: 0.04, polygonOffset: -3 }),
  };
  M.decals.add(m.win); M.kor = m; return m;
}

/** a prism over a ground polygon [[x, z]..] from y0 to y1: top cap + side walls (no bottom) */
function prism(P, mat, pts, y0, y1, uvs = 2) {
  P.cap(mat, pts, y1, true, uvs);
  let cx = 0, cz = 0; for (const p of pts) { cx += p[0] / pts.length; cz += p[1] / pts.length; }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [mx, 0, mz], [[0, y0 / uvs], [l / uvs, y0 / uvs], [l / uvs, y1 / uvs], [0, y1 / uvs]]);
  }
}
const halfRound = (R, zBack, n = 16) => { const out = [[-R, zBack], [-R, 0]]; for (let i = 1; i < n; i++) { const a = Math.PI - Math.PI * i / n; out.push([Math.cos(a) * R, Math.sin(a) * R]); } out.push([R, 0], [R, zBack]); return out; };

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx), mk = mats(K);
  const bw = (s, q) => FB.W(q, s);
  P.push(FB.ox, 0, FB.oz, FB.rot);
  try {
    try {                                                                    // the paved pocket at the mouth of the 7th-line recess (OSM w80166885: 14 m wide, 16 m deep, a half-round end): granite slabs
      const pk = [[-5.5, 231], [-9.3, 231]]; for (let i = 1; i < 12; i++) { const t = Math.PI * i / 12; pk.push([-9.3 - 7 * Math.sin(t), 238 - 7 * Math.cos(t)]); } pk.push([-9.3, 245], [-5.5, 245]);
      fillPolyClipped(P, M.slabGrey, pk, 0.04, (x, z) => cover(x, z), { margin: 0.3, maxEdge: 3, tile: 3.6 });
    } catch (e) { console.error('[landmarksAndrew] pocket:', e); }
    try { korchmin(K, mk); } catch (e) { console.error('[landmarksAndrew] korchmin:', e); }
    try { konka(K, mk); } catch (e) { console.error('[landmarksAndrew] konka:', e); }
  } finally { P.pop(); }
  // ---- colliders and services
  { const c = bw(KORCHMIN.s, KORCHMIN.q), rot = FB.rot + Math.PI / 2;
    ph.addBox(c.x, c.z, 3.0, 2.6, rot, 0, 3.6); ph.addCylinder(c.x, c.z, 1.6, 0, 3.6);
    K.svc.monuments.push({ id: 'n951472000', name: 'Памятник бомбардиру В. Д. Корчмину', x: c.x, z: c.z, h: 3.4, r: 3.2 });
    K.svc.crowd.push({ id: 'korchmin', kind: 'photo', x: bw(KORCHMIN.s, KORCHMIN.q + 3.5).x, z: bw(KORCHMIN.s, KORCHMIN.q + 3.5).z, r: 7, n: 6 });
    const sp = bw(KORCHMIN.s - 6, KORCHMIN.q + 9.0); if (cover(sp.x, sp.z) < -0.6) K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: 121, pitch: 6, name: 'Памятник Корчмину' }); }
  { const c = bw(KONKA.s, KONKA.q);
    K.svc.monuments.push({ id: 'n1352801081', name: 'Памятник конке', x: c.x, z: c.z, h: 3.0, r: 7 });
    K.svc.crowd.push({ id: 'konka', kind: 'photo', x: bw(KONKA.s, KONKA.q + 4.5).x, z: bw(KONKA.s, KONKA.q + 4.5).z, r: 8, n: 7 });
    const sp = bw(KONKA.s + 10, KONKA.q - 7); if (cover(sp.x, sp.z) < -0.6) K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: 35, pitch: 4, name: 'Памятник конке: вагон и лошади' }); }
}

// ------------------------------------------------------------------------------------------------ Korchmin
function korchmin(K, mk) {
  const { P, M } = K, fm = mk.fm, bronze = { main: mk.bz, dark: fm.dark, accent: mk.bzWear }, cn = KORCHMIN;
  P.push(cn.q, 0, cn.s, Math.PI / 2);                                  // sub-frame: +z = the statue front (ENE, +q), +x = the barrel direction (NNW, -s)
  // steps (two half-round courses), the pedestal, the plate
  prism(P, mk.step, halfRound(3.1, -1.5), 0, 0.15);
  prism(P, mk.step, halfRound(2.6, -1.5), 0.15, 0.30);
  for (const x of [-2.3, 2.3]) { P.col(mk.step, x, 0.2, 0.3, 0.6, 0.45, 0.45, 14, true); }                     // the round stools at the ends of the top step
  // review: photos 84 / 85 show a ROUND drum of rough rose-red granite (about 3 m across), not a rectangular block, under a round verdigris plate
  G.frustum(P, mk.ped, 0, 0, 0.30, 0.98, 20, 1.52, 1.46, 0, 8, 0.7);
  G.frustum(P, mk.ped, 0, 0, 0.98, 1.05, 20, 1.5, 1.58, 0, 8, 0.1, { capTop: mk.ped });                          // the capping course
  G.frustum(P, mk.plate, 0, 0, 1.05, 1.17, 20, 1.66, 1.66, 0, 6, 0.2, { capTop: mk.plate });
  const Y = 1.17;
  // the cannon: carriage block with a lion head and ring, the barrel with reinforcing rings, the breech knob
  P.box(mk.barrel, -0.1, 0.8, Y, Y + 0.55, -0.4, 0.4, 'b', 1);
  P.geo(mk.barrel, new THREE.TorusGeometry(0.12, 0.03, 6, 12), 0.35, Y + 0.28, 0.43, 0, 0, 0, 1, 1, 1);
  P.geo(mk.barrel, new THREE.SphereGeometry(0.1, 8, 6), 0.35, Y + 0.38, 0.43);
  const by = Y + 0.75;
  P.cyl(mk.barrel, [-1.35, by, 0], [1.55, by, 0], 0.25, 0.17, 14, true);
  for (const x of [-1.0, 0.0, 1.2]) P.cyl(mk.barrel, [x, by, 0], [x + 0.1, by, 0], x === 1.2 ? 0.2 : 0.29, x === 1.2 ? 0.2 : 0.29, 14, true);
  P.geo(mk.barrel, new THREE.SphereGeometry(0.2, 10, 8), -1.45, by, 0);
  // rope coil, cannonballs
  for (let i = 0; i < 3; i++) P.geo(mk.rope, new THREE.TorusGeometry(0.4 - i * 0.02, 0.07, 6, 16), 1.0, Y + 0.08 + i * 0.1, 0.75, Math.PI / 2, 0, 0, 1, 1, 1);
  for (const [x, y, z] of [[-1.15, 0, 0.8], [-0.85, 0, 0.8], [-1.0, 0, 1.06], [-1.0, 0.24, 0.9], [0.9, 0, -0.9]]) P.geo(mk.barrel, new THREE.SphereGeometry(0.14, 8, 6), x, Y + 0.14 + y, z);
  // the bombardier: seated sideways on the barrel (the pelvis over the barrel, the legs hanging toward the front), the right hand raised with the pipe
  const fig = cached('lmAnd-korchmin', () => human({
    detail: 0.85, body: { muscle: 0.35, bulk: 1.0 },
    pose: {
      pelvis: [0, 0.5, 0], pelvisRot: [0.05, 0.12, 0], spine: [0.05, -0.25, 0], head: [-0.08, -0.35, 0.05],
      legs: { L: { foot: [0.2, -0.12, 0.42], yaw: 0.2, pole: [0.1, 0.1, 1] }, R: { foot: [-0.1, -0.1, 0.5], yaw: -0.15, pole: [-0.1, 0.1, 1] } },
      arms: { L: { hand: [0.3, 0.5, 0.1], pole: [0.6, -0.2, -0.5], grip: 'flat', palm: [0, 1, 0] }, R: { hand: [-0.55, 0.82, 0.55], pole: [-0.6, -0.5, -0.1], grip: 'hold', palm: [0.3, 0.2, 0.9] } },        // review: the pipe arm out and forward at chest height (photos 84 85), not up at the hat
    },
    outfit: { torso: 'coat', hem: 0.38, flare: 0.3, folds: 0.05, sleeves: 'long', trousers: 'breeches', boots: 0.34, collar: 'fall', buttons: true, epaulettes: false },
    face: { age: 0.15, hair: 'wig', brow: 0.8, jaw: 0.9, mouth: 'smile', seed: 52 },
  }));
  const sc = 1.45, oy = by + 0.22 - 0.5 * sc;
  fig.place(P, bronze, 0.25, oy, 0.0, 0, sc);
  // tricorn hat (a flattened three-sided prism) on the head, a clay pipe in the raised hand
  const hj = fig.info && fig.info.j && fig.info.j.headC;
  if (hj) {
    P.geo(mk.barrel, new THREE.CylinderGeometry(0.2, 0.23, 0.09, 3), 0.25 + hj[0] * sc, oy + (hj[1] + 0.1) * sc, hj[2] * sc, 0, 0.6, 0, 1, 1, 1);
    P.geo(mk.barrel, new THREE.CylinderGeometry(0.08, 0.09, 0.07, 3), 0.25 + hj[0] * sc, oy + (hj[1] + 0.17) * sc, hj[2] * sc, 0, 0.6, 0, 1, 1, 1);
  }
  { const hx = 0.25 - 0.55 * sc, hy = oy + 0.82 * sc + 0.03, hz = 0.55 * sc;                                           // the long clay pipe: a stem from the fist out and up, a small bowl at the end
    P.cyl(mk.bzWear, [hx + 0.02, hy - 0.01, hz - 0.02], [hx - 0.34, hy + 0.06, hz + 0.1], 0.02, 0.014, 6, true);
    P.geo(mk.bzWear, new THREE.SphereGeometry(0.045, 7, 5), hx - 0.35, hy + 0.1, hz + 0.1); }
  P.pop();
}

// ------------------------------------------------------------------------------------------------ the horse tram
function konka(K, mk) {
  const { ctx, P, M } = K, ph = ctx.physics, cn = KONKA, bronze = { main: mk.bz, dark: mk.fm.dark, accent: mk.bzWear };
  // platform: granite setts with two rails 1.0 m apart, a black lattice railing round it (13.5 x 4.0 m: q -2 .. +2, s -6.75 .. +6.75 about the centre)
  P.push(cn.q, 0, cn.s, 0);
  const hx = 2.0, hz = 6.75;
  fillPolyClipped(P, mk.setts, [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]], 0.07, () => -5, { margin: 0.2, maxEdge: 3, tile: 2 });
  for (const x of [-0.5, 0.5]) { P.box(mk.railIron, x - 0.03, x + 0.03, 0.07, 0.12, -hz + 0.3, hz - 0.3, 'b', 1); }
  for (let z = -hz + 0.6; z < hz - 0.5; z += 1.2) P.box(M.plinth, -0.9, 0.9, 0.07, 0.09, z - 0.07, z + 0.07, 'b', 1);
  // the railing: posts every 2.4 m, lattice panels (cut-out), solid
  const posts = [], runs = [[[-hx, -hz], [hx, -hz]], [[hx, -hz], [hx, hz]], [[hx, hz], [-hx, hz]], [[-hx, hz], [-hx, -hz]]];
  for (const [a, b] of runs) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 2.4)), step = len / n;
    for (let i = 0; i <= n; i++) { const t = i * step / len; posts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  for (const [x, z] of posts) { P.cyl(mk.railIron, [x, 0.07, z], [x, 1.45, z], 0.06, 0.05, 6, true); P.geo(mk.railIron, new THREE.SphereGeometry(0.09, 6, 4), x, 1.5, z); }
  // the steel plaque on the railing post at the north-west corner of the platform
  P.quad(mk.plaque, [hx + 0.06, 0.55, -hz + 1.4], [hx + 0.06, 0.55, -hz + 0.6], [hx + 0.06, 1.25, -hz + 0.6], [hx + 0.06, 1.25, -hz + 1.4], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // ---- the car (long axis along s): chassis, body, windows, end platforms, roof, upper deck with the banner board, wheels
  const z0 = -5.9, z1 = -0.7, bz0 = -5.2, bz1 = -1.4;
  P.box(mk.railIron, -0.9, 0.9, 0.5, 0.62, z0, z1, 'b', 1);
  P.box(mk.blue, -0.95, 0.95, 0.62, 2.05, bz0, bz1, 'b', 2);
  P.box(mk.gold, -0.97, 0.97, 0.62, 0.72, bz0, bz1, 'b', 2); P.box(mk.gold, -0.97, 0.97, 1.98, 2.05, bz0, bz1, 'b', 2); P.box(mk.gold, -0.97, 0.97, 1.28, 1.31, bz0, bz1, 'b', 2);
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
    const z = bz0 + 0.28 + i * (bz1 - bz0 - 0.56) / 6;
    P.quad(mk.win, [s * 0.975, 1.38, z - 0.2], [s * 0.975, 1.38, z + 0.2], [s * 0.975, 1.95, z + 0.2], [s * 0.975, 1.95, z - 0.2], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  for (const z of [bz0, bz1]) P.box(mk.wood, -0.95, 0.95, 0.62, 2.05, z - (z === bz0 ? 0.05 : -0.0), z + (z === bz0 ? 0.0 : 0.05), 'b', 1);
  P.box(mk.roofC, -1.05, 1.05, 2.05, 2.2, z0 + 0.1, z1 - 0.05, 'b', 2);                                            // roof slab = the deck floor
  for (const z of [z0 + 0.15, z1 - 0.1]) { P.box(mk.wood, -0.95, 0.95, 2.2, 2.3, z - 0.05, z + 0.05, 'b', 1); }
  for (const s of [-1, 1]) {                                                                                       // banner boards along the long sides of the deck
    P.quad(mk.banner, [s * 1.07, 2.25, s > 0 ? z1 - 0.15 : z0 + 0.2], [s * 1.07, 2.25, s > 0 ? z0 + 0.2 : z1 - 0.15], [s * 1.07, 2.95, s > 0 ? z0 + 0.2 : z1 - 0.15], [s * 1.07, 2.95, s > 0 ? z1 - 0.15 : z0 + 0.2], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(mk.railIron, s * 1.065 - 0.01, s * 1.065 + 0.01, 2.2, 2.25, z0 + 0.2, z1 - 0.15, '', 1);
  }
  for (const z of [z0 + 0.2, z1 - 0.15]) for (const x of [-1.0, 1.0]) P.cyl(mk.railIron, [x, 2.2, z], [x, 3.0, z], 0.025, 0.025, 5, true);
  P.box(mk.railIron, -1.02, 1.02, 2.95, 3.0, z0 + 0.15, z0 + 0.25, 'b', 1); P.box(mk.railIron, -1.02, 1.02, 2.95, 3.0, z1 - 0.2, z1 - 0.1, 'b', 1);
  for (const z of [-4.4, -2.0]) for (const s of [-1, 1]) P.cyl(mk.wheel, [s * 0.8, 0.45, z], [s * 0.88, 0.45, z], 0.45, 0.45, 14, true);
  for (const z of [z0, z1]) for (const s of [-1, 1]) { P.cyl(mk.railIron, [s * 0.85, 0.62, z], [s * 0.85, 1.3, z], 0.025, 0.025, 5, true); }
  P.box(mk.railIron, -0.88, 0.88, 1.28, 1.32, z0, z0 + 0.04, 'b', 1); P.box(mk.railIron, -0.88, 0.88, 1.28, 1.32, z1 - 0.04, z1, 'b', 1);
  // ---- two bronze horses side by side with a pole to the car, and the coachman standing at the near horse
  const hf = cached('lmAnd-konka-horse', () => horse({ pose: 'stand', detail: 0.8, seed: 7, mane: 'right' }));
  const hs = 1.07;
  for (const x of [-0.5, 0.5]) hf.place(P, bronze, x, 0.07, 1.9, 0, hs);
  P.cyl(mk.railIron, [-0.5, 1.0, 0.9], [0.0, 0.95, z1], 0.04, 0.04, 6, true); P.cyl(mk.railIron, [0.5, 1.0, 0.9], [0.0, 0.95, z1], 0.04, 0.04, 6, true);
  const cm = cached('lmAnd-konka-coachman', () => human({
    detail: 0.7, body: { muscle: 0.4, bulk: 1.1 },
    pose: { head: [0.05, 0.4, 0], arms: { L: { hand: [0.25, 1.0, 0.35], grip: 'hold', pole: [0.6, -0.3, -0.5] }, R: { hand: [-0.15, 0.9, 0.25], grip: 'fist', pole: [-0.5, -0.3, -0.6] } } },
    outfit: { torso: 'coat', hem: 0.5, flare: 0.4, folds: 0.05, sleeves: 'long', trousers: 'long', boots: 0.4, collar: 'stand', buttons: true, belt: true },
    face: { age: 0.55, hair: 'short', beard: 'full', brow: 0.9, jaw: 1.0, mouth: 'closed', seed: 71 },
  }));
  cm.place(P, bronze, -1.55, 0.07, 3.3, Math.PI, 1.0);
  P.pop();
  // colliders (world): the railing, the car, the horses, the coachman
  const w = (x, z) => FB.W(cn.q + x, cn.s + z), pw = (x, z) => { const p = w(x, z); return [p.x, p.z]; };
  {                                                                              // the lattice railing of the platform: breakable bays of one 2.4 m tile (the panel was a static quad, the collider a plain wall; docs/AREAS.md 13.7); the posts stay drawn
    const bays = [];
    for (const [a, b] of runs) { const A = pw(a[0], a[1]), B = pw(b[0], b[1]); bays.push(...splitBays(A[0], A[1], B[0], B[1], 2.4, { y: 0.1 })); }
    knockBays(ctx, { name: 'lmAnd-konka-rail', bays, far: 240,
      parts: [{ geo: unitPanel(0, 1.1, { u1: 1 }), mat: M.railKonka, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: 1.3, thick: 0.15, e0: 0.05, e1: 0.05 },
      rec: () => ({ kind: 'fence', mass: 120, h: 1.2, anchored: 12, hitK: 0.2, metal: true, minDv: 0 }) });
  }
  { const c = w(0, (z0 + z1) / 2); ph.addBox(c.x, c.z, 2.0, z1 - z0, FB.rot, 0, 3.1); }
  { const c = w(0, 1.9 + 0.2); ph.addBox(c.x, c.z, 2.0, 2.6, FB.rot, 0, 1.8); }
  { const c = w(-1.55, 3.3); ph.addCylinder(c.x, c.z, 0.35, 0, 1.9); }
  void G; void partsGeos; void addInstanced; void mat4;
}
