// landmarksSmolensky/furniture.js - lamps, benches, path-name plates, bins, flowers, the church shop and the small monuments of the cemetery (docs/research/smolensky.md sections 3.8, 4.6, 10):
//  * the black cast-iron lantern posts round the Xenia plaza (3.8 m, glass lantern with a pyramidal cap) and the grey concrete poles with cobra heads every ~38 m along the Petrogradskaya and Moskovskaya alleys
//  * six slatted benches with black cast-iron ends (the two mapped ones at the Xenia chapel + four round the plaza), litter bins (black steel drums with a conical lid), the white path-name plates on posts
//    (the 7 mapped information points: Miklashevskaya, Rozhdestvenskaya, Bogoyavlenskaya, Tverskaya, Aleksandrovskaya, Myagkaya, Gelsingforsskaya)
//  * flowers at the foot of the Xenia chapel (bunches on the plinth), the church shop kiosk (OSM w312980917, claimed with the church), the brown granite boulder of the first grave of T. G. Shevchenko
//    (no inscription is invented), the memorial of the Finland Regiment (a dark-grey granite tent obelisk on a stepped platform with four granite balls), the slab of the Delfin submariners and the other
//    mapped memorial / tomb nodes inside the polygon as generic granite steles and slabs (names only in the monuments service, never on the geometry)
// Everything stands inside the cemetery (no carriageway): the lamps / benches are still tested against net.cover.  Publishes svc.lamps, svc.benches, svc.monuments.
import * as THREE from 'three';
import * as L from '../layout.js';
import { CH, GA, XE, RE, TR, ringIn } from './frame.js';
import { plan, inRing } from './place.js';
import { poisInBox } from './data.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { hash2 } from './util.js';
import { partsGeos } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the lanterns, the poles, the benches and the bin are knock records
import { MONUMENTS } from '../data/city.js';

const box = new THREE.BoxGeometry(1, 1, 1);

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const net = ctx.services?.streets?.net, cover = net && net.cover ? (x, z) => net.cover(x, z, {}) : () => -5;
  const pl = await plan(ctx);
  const okSpot = (x, z) => cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.4);
  // ------------------------------------------------------------------------------------------ lamps
  const lanternParts = (P) => {
    P.box(M.lamp, -0.14, 0.14, 0, 0.5, -0.14, 0.14, 'b'); P.col(M.lamp, 0, 0, 0.5, 3.0, 0.07, 0.05, 8, false); P.col(M.lamp, 0, 0, 3.0, 3.1, 0.12, 0.12, 8, true);
    P.box(M.lampGlass, -0.2, 0.2, 3.1, 3.7, -0.2, 0.2, 'b'); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(M.lamp, a * 0.2 - 0.02, a * 0.2 + 0.02, 3.1, 3.7, b * 0.2 - 0.02, b * 0.2 + 0.02, 'tb');
    G.frustum(P, M.lamp, 0, 0, 3.7, 4.05, 4, 0.34, 0.0, Math.PI / 4, 1, 1, {}); S.sph(P, M.lamp, 0, 4.12, 0, 0.07, 0.07, 0.07, 6);
  };
  const lamps = { lantern: [], pole: [] };      // { spot, item } per lamp: knockFurniture below
  const lantern = (x, z) => { lamps.lantern.push({ spot: { x, y: 0, z, rotY: 0 }, item: ph.addCylinder(x, z, 0.2, 0, 4) }); K.svc.lamps.push({ x, z, h: 4.1, kind: 'lantern' }); };
  for (const [u, v] of [[2, -2.6], [11, -2.6], [15.4, 12], [-1.6, 12], [8, 13.4], [17, 4]]) { const q = XE.W(u, v); if (okSpot(q.x, q.z)) lantern(q.x, q.z); }
  const poleParts = (P) => {
    P.col(M.poleGrey, 0, 0, 0, 6.0, 0.14, 0.1, 8, false); P.box(M.poleGrey, -0.14, 0.14, 0, 0.7, -0.14, 0.14, 'b');
    P.box(M.poleGrey, -0.05, 0.05, 5.7, 5.78, 0.0, 1.1, ''); P.box(M.lamp, -0.2, 0.2, 5.6, 5.74, 0.9, 1.45, ''); P.box(M.lampGlass, -0.15, 0.15, 5.58, 5.62, 0.95, 1.4, '');
  };
  const pole = (x, z, rot) => { lamps.pole.push({ spot: { x, y: 0, z, rotY: rot }, item: ph.addCylinder(x, z, 0.2, 0, 6) }); K.svc.lamps.push({ x, z, h: 6, kind: 'pole' }); };
  if (pl) {
    let nPoles = 0;
    for (const pth of pl.paths) {
      if (!/Петроградская дорожка|Московская дорожка/.test(pth.name)) continue;
      let acc = 12, side = 1;
      for (let i = 0; i + 1 < pth.pts.length; i++) {
        const a = pth.pts[i], b = pth.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1) continue;
        const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
        while (acc < l) {
          const d = pth.hw + 0.55, x = a[0] + tx * acc - tz * side * d, z = a[1] + tz * acc + tx * side * d;
          if (pl.inside(x, z, 4) && !pl.inZone(x, z, 0) && okSpot(x, z) && !pl.tGrid.near(x, z, 0.6)) { pole(x, z, Math.atan2(tz * side, -tx * side)); nPoles++; side = -side; }
          acc += 38;
        }
        acc -= l;
      }
    }
    K.svc.poleCount = nPoles;
  }
  // ------------------------------------------------------------------------------------------ benches
  const benchParts = (P) => {
    for (const s of [-1, 1]) { P.box(M.benchIron, s * 0.8 - 0.04, s * 0.8 + 0.04, 0, 0.45, -0.22, 0.22, 'b'); P.box(M.benchIron, s * 0.8 - 0.04, s * 0.8 + 0.04, 0.45, 0.85, -0.22, -0.16, 'b'); }
    for (let k = 0; k < 3; k++) P.box(M.benchSlat, -0.9, 0.9, 0.45 + 0.0, 0.5, -0.2 + k * 0.14, -0.1 + k * 0.14, 'b');
    for (let k = 0; k < 3; k++) P.box(M.benchSlat, -0.9, 0.9, 0.58 + k * 0.1, 0.65 + k * 0.1, -0.22, -0.17, 'b');
  };
  const benches = [];
  const bench = (x, z, rot) => {
    if (!okSpot(x, z)) return;
    benches.push({ spot: { x, y: 0, z, rotY: rot }, item: ph.addBox(x, z, 1.9, 0.6, rot, 0, 0.9) }); K.svc.benches.push({ x, z, rotY: rot, len: 1.8 });
  };
  const toChapel = (x, z) => Math.atan2(XE.W(8.8, 4.9).x - x, XE.W(8.8, 4.9).z - z);
  for (const [x, z] of [[-5588.6, -1336.5], [-5598.8, -1333.9]]) bench(x, z, toChapel(x, z) + Math.PI);
  // (the four extra plaza benches of the first build were not seen on any photo: removed, catalogue 3.4 / 9.1 item 11)
  // ------------------------------------------------------------------------------------------ bins
  const bins = [];
  for (const [f, u, v] of [[XE, 18, -2.4]]) {          // one bin at the Xenia plaza (catalogue 5.4: none in the old quarters)
    const q = f.W(u, v); if (!okSpot(q.x, q.z)) continue;
    bins.push({ spot: { x: q.x, y: 0, z: q.z, rotY: 0 }, item: ph.addCylinder(q.x, q.z, 0.32, 0, 1) });
  }
  const binParts = (P) => { P.col(M.bin, 0, 0, 0, 0.8, 0.28, 0.3, 8, false); G.frustum(P, M.bin, 0, 0, 0.8, 0.95, 8, 0.32, 0.05, 0, 1, 1, { capTop: M.bin }); };
  {
    const lanternGeo = partsGeos(lanternParts), poleGeo = partsGeos(poleParts), benchGeo = partsGeos(benchParts), binGeo = partsGeos(binParts);
    const put = (name, geo, list, rec, far) => { K.extraTris += knockFurniture(ctx, name, geo, list.map((q) => q.spot), list.map((q) => q.item), rec, far); };
    put('lmsmol-lanterns', lanternGeo, lamps.lantern, FURNITURE_REC.lamp(4.1), 260);
    put('lmsmol-poles', poleGeo, lamps.pole, FURNITURE_REC.lamp(6), 300);
    put('lmsmol-benches', benchGeo, benches, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
    put('lmsmol-bins', binGeo, bins, FURNITURE_REC.bin, 170);
  }
  // ------------------------------------------------------------------------------------------ path-name plates (the 7 mapped information points)
  const plates = poisInBox(-6300, -5300, -1700, -740).filter((p) => p.kind === 'tourism' && /дорожка/.test(p.name || ''));
  plates.forEach((p, i) => {
    let x = p.x, z = p.z;
    if (pl) { const g = pl.grid.gap(x, z); if (g < 0.5) { let best = null; for (const sg of pl.grid.segs) { const dx = sg[1][0] - sg[0][0], dz = sg[1][1] - sg[0][1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - sg[0][0]) * dx + (z - sg[0][1]) * dz) / l2)), qx = sg[0][0] + dx * t, qz = sg[0][1] + dz * t, d = Math.hypot(x - qx, z - qz); if (d < 12 && (!best || d < best.d)) best = { d, qx, qz, hw: sg[2] }; } if (best) { const dd = Math.max(best.d, 0.01); x = best.qx + (x - best.qx) / dd * (best.hw + 0.5); z = best.qz + (z - best.qz) / dd * (best.hw + 0.5); } } }
    if (!okSpot(x, z)) return;
    const words = (p.name || '').split(' '), map = ctx.tex.draw(128, 64, (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#38393c'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#1d1f22'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, words[0], w / 2, h * 0.32, w - 12, 22, ctx.tex.FONTS.sans, 700); ctx.tex.fitText(g, words.slice(1).join(' '), w / 2, h * 0.72, w - 12, 18, ctx.tex.FONTS.sans, 600); }, { key: 'lmsmol-plateN-' + i, repeat: [1, 1] });
    const mat = ctx.mat.toon('#ffffff', { map: map, name: 'lmsmol-plateMat-' + i, paint: 0 });
    const rot = pl ? hash2(i, 5, 3) * 6.28 : 0;
    P.push(x, 0, z, rot); P.col(M.poleGrey, 0, 0, 0, 1.6, 0.03, 0.03, 6, false); P.quad(mat, [-0.25, 1.3, 0.04], [0.25, 1.3, 0.04], [0.25, 1.62, 0.04], [-0.25, 1.62, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.quad(mat, [0.25, 1.3, -0.04], [-0.25, 1.3, -0.04], [-0.25, 1.62, -0.04], [0.25, 1.62, -0.04], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop();
    M.decals.add(mat);
  });
  // the three path plates read on the photos (sd085 sd087 sd032: white enamel 0.36 x 0.14 m on a flat dark post, two lines) and the small sign by the boulder (sd289): placed beside the mapped ways
  for (const [id, l1, l2, at] of [['w118074295', 'Поперечная', 'дорожка', 5], ['w453130765', 'Аннинская', 'дорожка', 4], ['w101417037', 'Прямая', 'дорожка', 7]]) {
    const pa = pl && pl.paths.find((q) => q.id === id); if (!pa) continue;
    const a = pa.pts[0], b = pa.pts[1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, d = pa.hw + 0.55;
    const x = a[0] + tx * at - tz * d, z = a[1] + tz * at + tx * d; if (!okSpot(x, z) || pl.tGrid.near(x, z, 0.5)) continue;
    const map = ctx.tex.draw(128, 50, (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8c90'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); g.fillStyle = '#1d1f22'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, l1, w / 2, h * 0.32, w - 14, 22, ctx.tex.FONTS.serif, 700); ctx.tex.fitText(g, l2, w / 2, h * 0.72, w - 14, 18, ctx.tex.FONTS.serif, 700); }, { key: 'lmsmol-plateR-' + id, repeat: [1, 1] });
    const mat = ctx.mat.toon('#ffffff', { map, name: 'lmsmol-plateRMat-' + id, paint: 0 }), rot = Math.atan2(tz, -tx);
    P.push(x, 0, z, rot); P.box(M.benchIron, -0.035, 0.035, 0, 1.4, -0.015, 0.015, 'b'); P.quad(mat, [-0.18, 1.18, 0.02], [0.18, 1.18, 0.02], [0.18, 1.32, 0.02], [-0.18, 1.32, 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.quad(mat, [0.18, 1.18, -0.02], [-0.18, 1.18, -0.02], [-0.18, 1.32, -0.02], [0.18, 1.32, -0.02], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop();
    M.decals.add(mat);
  }
  // ------------------------------------------------------------------------------------------ the church shop (OSM w312980917): a light-grey kiosk 5.9 x 5.4 m, hip roof, 3.3 m
  { const r = ringIn(CH, 'w312980917');
    if (r) {
      const cx = (r[0][0] + r[1][0] + r[2][0] + r[3][0]) / 4, cz = (r[0][1] + r[1][1] + r[2][1] + r[3][1]) / 4;
      P.push(CH.x, 0, CH.z, CH.rot); P.push(cx, 0, cz, 0);
      P.box(M.booth, -2.95, 2.95, 0, 2.7, -2.7, 2.7, 'b'); P.box(M.white, -3.1, 3.1, 2.7, 2.95, -2.85, 2.85, 'b');
      roofHip(P, M.zincDark, -3.3, 3.3, -3.05, 3.05, 2.95, 4.3);
      P.quad(M.dark, [-1.4, 0.1, -2.72], [-0.4, 0.1, -2.72], [-0.4, 2.1, -2.72], [-1.4, 2.1, -2.72], [0, 0, -1]); P.quad(M.winGate, [0.4, 1.0, -2.72], [2.0, 1.0, -2.72], [2.0, 2.2, -2.72], [0.4, 2.2, -2.72], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.pop(); P.pop();
      const q = CH.W(cx, cz); ph.addBox(q.x, q.z, 6.0, 5.5, CH.rot, 0, 4);
    } }
  // ------------------------------------------------------------------------------------------ the Shevchenko boulder (no inscription is invented)
  P.geo(M.boulder, new THREE.SphereGeometry(1, 8, 5), -5618.2, 0.38, -1486.8, 0, 0.6, 0, 0.8, 0.5, 0.58); ph.addCylinder(-5618.2, -1486.8, 0.7, 0, 1);
  // ------------------------------------------------------------------------------------------ the flower bed beside the portico steps of the Smolensk church (yellow flowers, photo 99): CH X 7.8 .. 11.8, Z -2.6 .. -1.3
  { P.push(CH.x, 0, CH.z, CH.rot);
    P.box(M.kerb, 7.7, 11.9, 0, 0.22, -2.7, -2.55, 'b'); P.box(M.kerb, 7.7, 7.85, 0, 0.22, -2.55, -1.3, 'b'); P.box(M.kerb, 11.75, 11.9, 0, 0.22, -2.55, -1.3, 'b');
    P.quad(M.soil, [7.85, 0.2, -1.3], [11.75, 0.2, -1.3], [11.75, 0.2, -2.55], [7.85, 0.2, -2.55], [0, 1, 0]);
    for (let i = 0; i < 40; i++) {                                                                                    // blossom heads on short stems (review 2026-10-08: the first version was a field of 0.2 m boxes)
      const x = 8.0 + (i % 10) * 0.39, z = -1.5 - Math.floor(i / 10) * 0.28 - hash2(i, 91, 1) * 0.08, h = 0.42 + hash2(i, 92, 2) * 0.16;
      P.box(M.leafGreen, x - 0.012, x + 0.012, 0.2, h, z - 0.012, z + 0.012, 'b'); S.sph(P, i % 7 === 0 ? M.flowerRed : M.flower, x, h + 0.04, z, 0.1, 0.075, 0.1, 6);
    }
    P.pop(); }
  // ------------------------------------------------------------------------------------------ flowers at the foot of the Xenia chapel (bunches on the plinth, at the NNW door side and the ENE end)
  for (let i = 0; i < 46; i++) {
    const side = i % 3, t = hash2(i, 77, 1), u = side === 0 ? 3.9 + t * 9.8 : side === 1 ? 13.7 + 0.35 : 3.9 + t * 6, v = side === 0 ? -0.35 : side === 1 ? 0.5 + t * 8.8 : 10.15;
    const q = XE.W(u, v), col = [M.flowerWhite, M.flowerRed, M.flower, M.flowerPink][i % 4];
    const fh = 0.26 + hash2(i, 79, 3) * 0.12;                                                                           // a bunch: a green stem and a blossom head
    // review 2026-10-09: a loose BOUQUET laid on the plinth ledge (paper cone, three or four mixed blossoms and a leaf collar) instead of a regular row of single-stem lollipops
    const wrap = i % 5 === 0 ? M.flowerPink : i % 5 === 2 ? M.xGreenDark : M.plate, c2 = [M.flowerRed, M.flowerWhite, M.flower, M.flowerPink];
    P.push(q.x, 0.5, q.z, hash2(i, 78, 2) * 6.28); P.col(wrap, 0, 0, 0, fh * 0.75, 0.025, 0.1, 6, false);
    for (let k = 0; k < 4; k++) { const a = k * 1.9 + hash2(i, 80 + k, 4) * 3, r = k === 0 ? 0 : 0.06 + hash2(i, 85 + k, 5) * 0.03; S.sph(P, k === 0 ? col : c2[(i + k) % 4], Math.cos(a) * r, fh * 0.75 + 0.02 + (k % 2) * 0.03, Math.sin(a) * r, 0.07, 0.06, 0.07, 5); }
    S.sph(P, M.leafGreen, 0, fh * 0.72, 0, 0.12, 0.03, 0.12, 5); P.pop();
  }
  // ------------------------------------------------------------------------------------------ monuments
  monuments(K, pl);
}

function roofHip(P, mat, x0, x1, z0, z1, y0, y1) {
  const alongX = (x1 - x0) >= (z1 - z0), w = alongX ? z1 - z0 : x1 - x0, ins = w / 2;
  const cx0 = alongX ? x0 + ins : (x0 + x1) / 2, cx1 = alongX ? x1 - ins : (x0 + x1) / 2, cz0 = alongX ? (z0 + z1) / 2 : z0 + ins, cz1 = alongX ? (z0 + z1) / 2 : z1 - ins;
  const q = (a, b, c, d, n) => P.quad(mat, a, b, c, d, n, [a, b, c, d].map((p) => [p[0], p[2]]));
  const k = (y1 - y0) / ins, nl = Math.hypot(1, k);
  q([x0, y0, z1], [x1, y0, z1], [cx1, y1, cz1], [cx0, y1, cz1], [0, 1 / nl, k / nl]);
  q([x1, y0, z0], [x0, y0, z0], [cx0, y1, cz0], [cx1, y1, cz0], [0, 1 / nl, -k / nl]);
  q([x1, y0, z1], [x1, y0, z0], [cx1, y1, cz0], [cx1, y1, cz1], [k / nl, 1 / nl, 0]);
  q([x0, y0, z0], [x0, y0, z1], [cx0, y1, cz1], [cx0, y1, cz0], [-k / nl, 1 / nl, 0]);
}

/** the documented memorials and tombs of the polygon (data/city.js MONUMENTS): generic granite steles / slabs, the Finland Regiment obelisk with its platform */
function monuments(K, pl) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const ring = pl ? pl.ring : null;
  const list = MONUMENTS.filter((m) => m.x > -6320 && m.x < -5300 && m.z > -1710 && m.z < -730 && (m.kind === 'memorial' || m.kind === 'tomb') && (!ring || inRing(ring, m.x, m.z)));
  for (const m of list) {
    const rot = hash2((m.x * 3) | 0, (m.z * 3) | 0, 61) * 6.283;
    if (m.id === 'n3188961905') finland(P, M, ph, m.x, m.z);
    else if (m.id === 'n11510705251') {                                                                   // Delfin: a flat dark granite slab 1.2 x 2.6 m with a raised border, in ferns
      P.push(m.x, 0, m.z, rot); P.box(M.stoneBlack, -0.6, 0.6, 0, 0.12, -1.3, 1.3, 'b'); P.box(M.stoneGrey, -0.7, 0.7, 0, 0.06, -1.4, 1.4, 'b'); for (let k = 0; k < 4; k++) P.box([M.flowerRed, M.flowerWhite][k % 2], -0.3 + k * 0.2, -0.22 + k * 0.2, 0.12, 0.2, -0.1, 0.1, 'b'); P.pop();
      ph.addBox(m.x, m.z, 1.5, 2.8, rot, 0, 0.3);
    } else if (m.kind === 'tomb') {                                                                       // a tomb: a granite slab and a small stele
      P.push(m.x, 0, m.z, rot); P.box(M.stoneGrey, -0.7, 0.7, 0, 0.3, -1.0, 1.0, 'b'); P.box(M.stoneBlack, -0.45, 0.45, 0.3, 1.0, -0.95, -0.8, 'b'); P.box(M.flowerRed, -0.15, 0.15, 0.3, 0.4, 0.2, 0.4, 'b'); P.pop();
      ph.addBox(m.x, m.z, 1.6, 2.2, rot, 0, 1);
    } else {                                                                                              // memorial: an upright dark granite stele on a plinth
      P.push(m.x, 0, m.z, rot); P.box(M.stoneGrey, -0.9, 0.9, 0, 0.3, -0.6, 0.6, 'b'); P.box(M.stoneBlack, -0.55, 0.55, 0.3, 2.0, -0.18, 0.18, 'b'); P.box(M.stonePale, -0.04, 0.04, 1.3, 1.8, 0.185, 0.2, ''); P.box(M.stonePale, -0.16, 0.16, 1.62, 1.66, 0.185, 0.2, ''); P.pop();
      ph.addBox(m.x, m.z, 1.9, 1.3, rot, 0, 2.1);
    }
    K.svc.monuments.push({ id: m.id, name: m.name || (m.kind === 'tomb' ? 'Могила' : 'Памятник'), x: m.x, z: m.z, h: 2 });
  }
}
/** the Finland Regiment memorial (OSM n3188961905): a dark-grey granite tent obelisk ~4.5 m (a collar at 1/3, a cross), a stepped platform 6 x 6 m (three steps, 0.6 m), a granite ball on each corner */
function finland(P, M, ph, x, z) {
  P.push(x, 0, z, 0.35);
  for (let i = 0; i < 3; i++) P.box(M.kerb, -3 + i * 0.35, 3 - i * 0.35, 0, 0.2 * (i + 1), -3 + i * 0.35, 3 - i * 0.35, 'b', 2);
  P.box(M.stoneGrey, -1.0, 1.0, 0.6, 1.0, -1.0, 1.0, 'b');
  G.frustum(P, M.stoneGrey, 0, 0, 1.0, 5.3, 4, 1.25, 0.12, Math.PI / 4, 1, 1, { capTop: M.stoneGrey });
  G.frustum(P, M.stoneBlack, 0, 0, 2.4, 2.65, 4, 0.98, 0.9, Math.PI / 4, 1, 1, { capTop: M.stoneBlack });
  G.cross(P, M.crossIron, 0, 5.28, 0, 0.8, 0);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.sph(P, M.stoneGrey, a * 2.7, 0.6 + 0.3, b * 2.7, 0.3, 0.3, 0.3, 8);
  P.pop();
  ph.addBox(x, z, 6.2, 6.2, 0.35, 0, 5.4);
}
