// landmarksAcademy/square.js - TREZZINI SQUARE (площадь Трезини), the west end of the Academy frontage: docs/research/academy.md 6, photos th_001 th_003 th_011 th_012 tm_000..004 cr_tm002 ch_000..006 cr_ch004.
//   The TREZZINI HOUSE (OSM w82802160, Университетская наб. 21; the five-star hotel since 2013): pale yellow plaster #ecdc96, 11 axes = 4 + 3 + 4 on 30.3 m (window centres from the west corner at
//   2.3 4.8 7.3 9.7 | 12.8 15.5 18.1 | 21.2 23.5 25.8 28.1 m), a dark granite plinth to 1.6 m, rectangular ground-floor windows, a window in a round-arched niche over a baluster apron on the first floor, a wrought-iron
//   balcony on four granite corbels across the three centre axes, plain second-floor windows, the cornice at 14.5 m, a roof balustrade to 15.9 m over a grey mansard (ridge 17.5 m) with four skylight boxes;
//   the entrance with its glazed iron canopy, two thuja columns, two white globe lamps, the railing; the gold wordmarks of the hotel on both wings.
//   The CHERKASSKY HOUSE (w82802097, Университетская наб. 23; fires 2019, a regional monument): in July 2023 its street front is covered by a flat PRINTED FACADE BANNER (pink wall, 3 x 9 cyan windows, four
//   giant pilasters, two medallions) 0.15 m off a plain dark wall, a pale grey roof with brick chimneys behind it; the lane side and the rear are bare plaster with boarded openings.
//   The TREZZINI MONUMENT (P. Ignatyev, 2013; OSM n2586283111 at u -144.6, v 49.0): the bronze architect 3.2 m on a half-volute pedestal 1.9 m (dark bronze-grey) on a dark granite plinth, 5.5 m in all, with the
//   inscription «АРХИТЕКТОРУ / Доменико / Трезини», the polished apron, seven grey hemispheres, posts joined by chains.  Frame: the academy frame (u, v).
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, band } from './kit.js';
import { texQuad, insetRoof } from './shell.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ACAD, W, M as toLocal, V_DIR } from './frame.js';
import { baluster } from './orders.js';
import { treziniFig } from './monuments.js';
import { figureMats, tube } from '../lib/figures.js';
import { coverFn } from './surfaces.js';
import { lathe } from './prims.js';
import { knockBays, unitPanel } from '../lib/fence-bays.js';        // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the pavement railing in front of the Trezzini house is a row of breakable bays,
import { knockFurniture } from '../lib/knock-furniture.js';          // the hemispheres and the chained posts of the monument are knock records (bollards)

const HH = 12.4;                                                    // the top of the painted hotel wall (the entablature stands above it)
const frontOf = (edges, minLen) => edges.filter((e) => e.len > minLen).reduce((a, e) => ((e.n[0] * V_DIR[0] + e.n[1] * V_DIR[1]) > (a ? a.n[0] * V_DIR[0] + a.n[1] * V_DIR[1] : -9) ? e : a), null);
let _hemi = null;
const hemi = () => _hemi || (_hemi = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));

function hotel(K) {
  const { ctx, P, M } = K, ph = ctx.physics, lab = ctx.services?.labels;
  const b = L.buildingById('w82802160');
  if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksAcademy] Trezzini house footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), edges = ringEdges(poly, 0.3), front = frontOf(edges, 20);
  for (const e of edges) {
    onEdge(P, e, (len, f) => {
      if (e === front) {
        texQuad(P, M.hotelW, 0, 11.25, 0, HH, 0, 1, HH, 0, 0); texQuad(P, M.hotelC, 11.25, 19.65, 0, HH, 0, 1, HH, 0, 0); texQuad(P, M.hotelE, 19.65, len, 0, HH, 0, 1, HH, 0, 0);
        // the wrought-iron balcony on four corbels across the centre axes, the entrance
        P.box(M.hotelTrim, 11.5, 19.7, 4.55, 4.78, 0, 1.0, 'k', 3);
        for (const x of [13.0, 14.7, 16.5, 18.2]) P.box(M.graniteGrey, x - 0.2, x + 0.2, 3.85, 4.55, 0, 0.5, 'k', 1);
        P.quad(M.railing, [11.5, 4.78, 1.0], [19.7, 4.78, 1.0], [19.7, 5.68, 1.0], [11.5, 5.68, 1.0], [0, 0, 1], [[0, 0], [8.2, 0], [8.2, 1], [0, 1]]);
        for (const x of [11.5, 19.7]) P.quad(M.railing, [x, 4.78, 0.0], [x, 4.78, 1.0], [x, 5.68, 1.0], [x, 5.68, 0.0], [x > 15 ? 1 : -1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        const xe = 15.6;
        P.box(M.oak, xe - 0.85, xe + 0.85, 0.0, 2.7, -0.0, 0.05, 'kb', 1);                                   // the oak double door
        for (const sx of [-0.42, 0.42]) { P.box(M.planter, xe + sx - 0.34, xe + sx + 0.34, 0.3, 1.25, 0.05, 0.075, 'kb', 1); P.box(M.planter, xe + sx - 0.34, xe + sx + 0.34, 1.4, 2.35, 0.05, 0.075, 'kb', 1); }   // the dark panels of the leaves
        P.box(M.iron, xe - 0.012, xe + 0.012, 0.0, 2.7, 0.05, 0.08, 'kb', 1); P.box(M.iron, xe - 0.85, xe + 0.85, 2.7, 2.78, 0.0, 0.07, 'k', 1);
        P.box(M.hotelWall, xe - 0.85, xe + 0.85, 2.7, 3.1, 0, 0.04, 'k', 1);
        P.box(M.iron, xe - 1.7, xe + 1.7, 3.2, 3.3, 0, 1.3, 'b', 1); P.quad(M.glass, [xe - 1.7, 3.3, 0.02], [xe + 1.7, 3.3, 0.02], [xe + 1.7, 3.3, 1.3], [xe - 1.7, 3.3, 1.3], [0, 1, 0]);    // the glazed canopy
        for (const x of [xe - 1.7, xe + 1.7]) P.box(M.iron, x - 0.03, x + 0.03, 0, 3.2, 1.25, 1.3, '', 1);
        for (const s of [-1, 1]) {
          const x = xe + s * 2.6;
          P.box(M.planter, x - 0.3, x + 0.3, 0, 0.5, 0.5, 1.1, 'b', 1); P.cyl(M.thuja, [x, 0.5, 0.8], [x, 2.3, 0.8], 0.28, 0.2, 8, true); P.geo(M.thuja, hemi(), x, 2.3, 0.8, 0, 0, 0, 0.22, 0.4, 0.22);
          const lx = xe + s * 1.95;
          P.box(M.graniteGrey, lx - 0.17, lx + 0.17, 0, 0.9, 0.65, 0.99, 'b', 1); P.geo(M.globe, new THREE.SphereGeometry(0.19, 10, 8), lx, 1.08, 0.82);
        }
        // the gold wordmarks of the hotel on the wings (between the arches and the second-floor windows)
        for (const [mat, cx, key] of [[M.hotelLetL, 5.5, 'L'], [M.hotelLetR, 24.9, 'R']]) {
          const w = f.x + f.xa[0] * cx + e.n[0] * 0.05, z = f.z + f.xa[1] * cx + e.n[1] * 0.05;
          if (!lab || lab.reserve(b.id, w, 9.6, z, 7.4, 0.5, e.n[0], e.n[1], 'shop')) P.quad(mat, [cx - 3.7, 9.35, 0.04], [cx + 3.7, 9.35, 0.04], [cx + 3.7, 9.85, 0.04], [cx - 3.7, 9.85, 0.04], [0, 0, 1]);
          void key;
        }
      } else texQuad(P, M.hotelSide, 0, len, 0, HH, 0, Math.max(1, Math.round(len / 3.4)), HH, 0, 0);
      baluster(P, M, 0.3, len - 0.3, 14.5, 0.28, { h: 1.4, ped: 0.7, step: 4.0 });                          // the roof balustrade
    });
  }
  band(P, edges, 4.85, 5.15, 0.12, { front: M.hotelTrim, top: M.hotelTrim, under: M.soffit }, { uvs: 3 });
  band(P, edges, HH, 13.0, 0.1, { front: M.hotelTrim, top: M.hotelTrim }, { uvs: 3 });                       // architrave
  band(P, edges, 13.0, 13.6, 0.0, { front: M.hotelTrim }, { uvs: 3 });                                        // frieze
  band(P, edges, 13.6, 13.9, 0.4, { front: M.hotelTrim, top: M.hotelTrim, under: M.soffit }, { uvs: 3 });
  band(P, edges, 13.9, 14.5, 0.7, { front: M.hotelTrim, top: M.hotelTrim, under: M.soffit }, { uvs: 3 });     // corona
  insetRoof(P, ring, 14.5, M.hotelRoof, { inset: 7.0, rise: 3.0, over: 0.0 });
  for (const t of [0.2, 0.4, 0.6, 0.8]) {                                                                      // four skylight boxes on the ridge
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length, ux = V_DIR[1], uz = -V_DIR[0];
    const px = cx + ux * (t - 0.5) * 22, pz = cz + uz * (t - 0.5) * 22;
    P.push(px, 0, pz, Math.atan2(V_DIR[0], V_DIR[1])); P.box(M.hotelRoof, -1.2, 1.2, 17.4, 18.6, -0.7, 0.7, 'b', 1); P.pop();
  }
  addPolyColliders(ctx, poly, 0, 17);
  // the railing along the edge of the pavement in front of the house (on both sides of the entrance)
  if (front) onEdge(P, front, (len, f) => {
    const cover = coverFn(ctx), zz = 2.9, rb = [];
    for (const [a, c] of [[0.6, 13.0], [18.2, len - 0.6]]) {
      const n = Math.max(1, Math.round((c - a) / 4));
      for (let i = 0; i < n; i++) {
        const x0 = a + (c - a) * i / n, x1 = a + (c - a) * (i + 1) / n, wx = f.x + f.xa[0] * ((x0 + x1) / 2) + front.n[0] * zz, wz = f.z + f.xa[1] * ((x0 + x1) / 2) + front.n[1] * zz;
        if (cover(wx, wz) > -0.5) continue;                                                                   // never on a carriageway
        const ax = f.x + f.xa[0] * x0 + front.n[0] * zz, az = f.z + f.xa[1] * x0 + front.n[1] * zz, bx = f.x + f.xa[0] * x1 + front.n[0] * zz, bz = f.z + f.xa[1] * x1 + front.n[1] * zz;
        rb.push({ x0: ax, z0: az, x1: bx, z1: bz, y: 0 });      // n4spb: a breakable bay (the drawn panel between the granite posts, one thin collider, one knock record)
      }
      for (let i = 0; i <= n; i++) { const x = a + (c - a) * i / n, wx = f.x + f.xa[0] * x + front.n[0] * zz, wz = f.z + f.xa[1] * x + front.n[1] * zz; if (cover(wx, wz) > -0.5) continue; P.box(M.graniteGrey, x - 0.14, x + 0.14, 0, 1.0, zz - 0.14, zz + 0.14, 'b', 1); }
    }
    // the panel spans x0 + 0.1 .. x1 - 0.1 of the bay (the posts stand at its ends): inset 0.1 m on both sides; the collider is the whole bay
    knockBays(ctx, { name: 'lmacade-hotel-rail', bays: rb, far: 240,
      parts: [{ geo: unitPanel(0.05, 0.95, { u1: 4 }), mat: M.railing, name: 'panel', stretch: true, inset: 0.1, shadow: false, receive: false }],
      collider: { y0: 0, y1: 1.1, thick: 0.3, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 120, h: 1.0, anchored: 14, hitK: 0.3, metal: true, minDv: 0 }) });
    K.extraTris += rb.length * 2;
  });
  const c = W(-134.6, 37.0);
  K.svc.entrances.push({ x: c.x, z: c.z, rotY: ACAD.rot, name: 'Дворец Трезини, отель', closed: true });
  K.svc.monuments.push({ id: 'trezzini-house', name: 'Дом Трезини', x: b.cx, z: b.cz, h: 17.5, r: 0 });
}

function cherkassky(K) {
  const { ctx, P, M } = K;
  const b = L.buildingById('w82802097');
  if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksAcademy] Cherkassky house footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), edges = ringEdges(poly, 0.3), front = frontOf(edges, 18), E = 15.5;
  for (const e of edges) {
    onEdge(P, e, (len) => {
      if (e === front) {
        P.quad(M.cherkDark, [0, 0, 0], [len, 0, 0], [len, E, 0], [0, E, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, E / 3], [0, E / 3]]);
        P.quad(M.banner, [0, 0, 0.15], [len, 0, 0.15], [len, E, 0.15], [0, E, 0.15], [0, 0, 1]);                // the printed facade banner, 0.15 m off the wall
        P.box(M.cherkDark, -0.0, len, 0, 0.0, 0.0, 0.15, 'tbfk', 1);
      } else texQuad(P, M.cherkSide, 0, len, 0, E, 0, Math.max(1, Math.round(len / 3.6)), E, 0, 0);
    });
  }
  band(P, edges, E - 0.5, E, 0.35, { front: M.hotelTrim, top: M.hotelTrim, under: M.soffit }, { uvs: 3, draw: (e) => e !== front });
  insetRoof(P, ring, E, M.cherkRoof, { inset: 6.0, rise: 2.6, chimney: M.brick, cap: M.hotelTrim, chimneyStep: 10, chimneyMin: 8 });
  addPolyColliders(ctx, poly, 0, 18);
  K.svc.monuments.push({ id: 'cherkassky-house', name: 'Дом Черкасского (Риттера)', x: b.cx, z: b.cz, h: 18, r: 0 });
}

function monument(K) {
  const { ctx, P, M } = K, ph = ctx.physics, fm = figureMats(ctx), cover = coverFn(ctx);
  const U = -144.6, Vv = 49.0, mk = { main: M.bronzeMon, dark: fm.dark, accent: M.bronzeMon };
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    P.cap(M.apron, [[U - 2.5, Vv - 2.0], [U + 2.5, Vv - 2.0], [U + 2.5, Vv + 2.0], [U - 2.5, Vv + 2.0]], 0.045, true, 3);                    // the polished dark apron, flush with the paving
    P.box(M.graniteDark, U - 1.6, U + 1.6, 0.04, 0.49, Vv - 1.2, Vv + 1.2, 'b', 1.5);                                                          // the plinth
    // the HALF-VOLUTE pedestal (tm_003, cr_tm002; review-academy 2026-10-08: it was a box with a wheel stuck on): an extruded profile whose lower left swells out into the scroll (0.3 m), a raised
    // ring and a spiral groove on the front of the scroll, a projecting cap
    {
      const y0 = 0.49, y1 = 2.39, sh = new THREE.Shape();
      sh.moveTo(U + 1.0, y0); sh.lineTo(U + 1.0, y1); sh.lineTo(U - 1.0, y1); sh.lineTo(U - 1.0, y0 + 1.3);
      sh.bezierCurveTo(U - 1.0, y0 + 1.1, U - 1.3, y0 + 1.05, U - 1.3, y0 + 0.62);
      sh.bezierCurveTo(U - 1.3, y0 + 0.2, U - 1.12, y0, U - 0.8, y0);
      sh.lineTo(U + 1.0, y0);
      P.extrude(M.pedBronze, sh, Vv - 0.7, 1.4, 1.5, 14);
      P.box(M.pedBronze, U - 1.12, U + 1.12, y1 - 0.14, y1, Vv - 0.82, Vv + 0.82, 'b', 1.5);                                                    // the cap moulding
      const cx = U - 0.64, cy = y0 + 0.6, zf = Vv + 0.7 + 0.02, sp = [];
      for (let i = 0; i <= 44; i++) { const t = i / 44, a = t * 2.3 * Math.PI * 2 + 0.6, r = 0.4 * (1 - 0.84 * t); sp.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, zf]); }
      P.geo(M.bronzeMon, tube(sp, [[0.024, 0.024]], { seg: 5, per: 3, cap: true }));
      const ring = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; ring.push([cx + Math.cos(a) * 0.5, cy + Math.sin(a) * 0.5, zf]); }
      P.geo(M.bronzeMon, tube(ring, [[0.03, 0.03]], { closed: true, seg: 5, rings: 28 }));
    }
    P.quad(M.treziniPed, [U - 0.42, 1.12, Vv + 0.72], [U + 0.96, 1.12, Vv + 0.72], [U + 0.96, 2.16, Vv + 0.72], [U - 0.42, 2.16, Vv + 0.72], [0, 0, 1]);    // «АРХИТЕКТОРУ / Доменико / Трезини»
    treziniFig().place(P, mk, U, 2.39, Vv, 0, 1.83);
    // hemispheres (7) on the road side and chained posts (7) round the apron
    const hemis = [[-148.6, 57.0], [-146.5, 57.4], [-144.4, 57.1], [-142.4, 57.5], [-140.4, 57.1], [-138.4, 57.4], [-136.5, 57.0]];
    // n4spb (docs/AREAS.md 13.7): the 7 hemispheres and the 7 chained posts are knock records (bollards; the chains between the posts are drawn only, as in the source)
    const hSpots = [], hItems = [], pSpots = [], pItems = [];
    for (const [u, v] of hemis) { const w = W(u, v); if (cover(w.x, w.z) > -0.5) continue; hSpots.push({ x: w.x, y: 0, z: w.z, rotY: 0 }); hItems.push(ph.addCylinder(w.x, w.z, 0.28, 0, 0.3)); }
    const posts = [[U - 2.8, Vv - 2.3], [U - 2.8, Vv + 2.3], [U, Vv + 2.3], [U + 2.8, Vv + 2.3], [U + 2.8, Vv - 2.3], [U - 2.8, Vv], [U + 2.8, Vv]];
    const chain = [[0, 5], [5, 1], [1, 2], [2, 3], [3, 6], [6, 4]];
    for (const [u, v] of posts) { const w = W(u, v); if (cover(w.x, w.z) > -0.5) continue; pSpots.push({ x: w.x, y: 0, z: w.z, rotY: ACAD.rot }); pItems.push(ph.addCylinder(w.x, w.z, 0.3, 0, 0.9)); }
    {
      const hg = hemi().clone(); hg.scale(0.25, 0.25, 0.25);
      K.extraTris += knockFurniture(ctx, 'lmacade-hemispheres', { list: [{ mat: M.bollard, geo: hg }] }, hSpots, hItems, { kind: 'bollard', mass: 120, h: 0.3, r: 0.28, anchored: 24, hitK: 0.4 }, 200);
      const pg = new THREE.BoxGeometry(0.45, 0.8, 0.45); pg.translate(0, 0.4, 0);
      K.extraTris += knockFurniture(ctx, 'lmacade-chain-posts', { list: [{ mat: M.post, geo: pg }] }, pSpots, pItems, { kind: 'bollard', mass: 200, h: 0.9, r: 0.3, anchored: 28, hitK: 0.5 }, 200);
    }
    for (const [a, c] of chain) for (const dy of [0.62, 0.52]) P.cyl(M.chain, [posts[a][0], dy, posts[a][1]], [posts[c][0], dy - 0.09, posts[c][1]], 0.012, 0.012, 4, false);
    const w = W(U, Vv);
    ph.addBox(w.x, w.z, 3.5, 2.7, ACAD.rot, -1, 6.0);
    K.svc.monuments.push({ id: 'trezzini-monument', name: 'Памятник Доменико Трезини', x: w.x, z: w.z, h: 5.5, r: 2.2 });
    const sp = W(-140, 62); K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, w.x, w.z), name: 'Памятник Трезини' });
    K.svc.crowd.push({ x: w.x, z: w.z + 0, r: 4, n: 4, kind: 'plaza', name: 'у памятника Трезини' });
  } finally { P.pop(); }
}

export async function build(K) {
  for (const [name, fn] of [['hotel', hotel], ['cherkassky', cherkassky], ['monument', monument]]) {
    try { fn(K); } catch (err) { console.error('[landmarksAcademy] square ' + name + ' failed:', err); (K.svc.failed ||= []).push('square ' + name + ': ' + (err && err.message || err)); }
  }
  void toLocal; void lathe;
}
