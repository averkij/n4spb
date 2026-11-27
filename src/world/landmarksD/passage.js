// landmarksD/passage.js - the Vladimirskaya square surroundings south of the cathedral: the Vladimirsky Passage (Владимирский пассаж, Vladimirsky pr. 19, Art Nouveau; OSM w70216607), the Renaissance Hall
// block (w38578114) with the arched entrance of the Dostoevskaya metro vestibule, and the Dostoevsky monument (n4326752745).   Photos: refs/landmarksD/passage 01 02 (the Passage), statue 01-03.
//   Passage: ochre-orange roughcast (#cf9a6c) with cream-pink bays (#eed5c0), a grey granite ground floor (6 m) with big arched shop windows, 4 upper floors, two three-storey bay windows and a
//   round corner turret with a green onion cap on the Vladimirsky pr. front (35 m), cornice 24.5 m, a dark copper mansard (#7b5a48, top 29 m).  Long sides: the same storeys, shop fronts, plain bays.
//   Renaissance Hall: 8 levels -> a pale stucco (#dccfae) block, ground floor 5.2 m shopfronts, cornice 27 m + attic; the north front carries the metro entrance: layout.DOORWAYS 'dostoevskaya-in'
//   (w 3.4 m at (-277.1, 452.4)) is left as a REAL opening (collider gap by lib/massing addPolyColliders): a stone-framed arch 4.7 m high with a short vaulted passage behind it (sides + ceiling).
//   Monument: a seated bronze Dostoevsky (1997, K. Rukavishnikov-like pose) on a low granite plinth at (-209, 553), facing the cathedral.
import * as THREE from 'three';
import { dostoevsky } from './statues.js';
import { buildHouse } from './house.js';
import { centralExtraDoors } from '../metro/central-locations.js';
import { findEdge, localOnEdge } from './kit.js';
import { cup, onion } from './parts.js';

const SAND = '#cf9a6c', BAY = '#eed5c0', GRANITE = '#9b9a98', COPPER = '#7b5a48', GREEN = '#6f9d86';
const PHC = 24.5, PATT = 4.5, UP = 0.45;
const RHC = 27.0, RATT = 3.0;
const NAMES = ['Кофейня', 'Аптека', 'Книги', 'Цветы', 'Пекарня', 'Сувениры', 'Часы', 'Ресторан'];

export function build(K) {
  const L = K.L, M = K.mats;
  const recs = L.groupMembers('dostoevsky').filter((r) => !r.skip);
  const pass = recs.find((r) => r.id === 'w70216607'), ren = recs.find((r) => r.id === 'w38578114');
  K.svc.houses.push({ id: 'w70216607', name: 'Владимирский пассаж', nameEn: 'Vladimirsky Passage', x: -290, z: 420 }, { id: 'w38578114', name: 'Ренессанс-холл', nameEn: 'Renaissance Hall', x: -285, z: 470 });
  K.svc.monuments.push({ id: 'n4326752745', name: 'Памятник Ф. М. Достоевскому', x: -209, z: 553, h: 3.2 });
  K.svc.photoSpots.push({ x: -222, z: 430, yaw: L.yawToward(-222, 430, -240, 440), pitch: 10, name: 'Владимирский пассаж' });
  const door = (L.DOORWAYS || []).find((d) => d.id === 'dostoevskaya-in') || { x: -277.1, z: 452.4, w: 3.4 };
  K.svc.entrances.push({ x: door.x, z: door.z, rotY: door.rotY ?? 0, bldg: 'w38578114', kind: 'metro-entrance' });

  if (pass) {
    const east = (e) => !!findEdge([e], -233.0, 420.1, -243.9, 453.5, 0.6);
    buildHouse(K, {
      name: 'passage', recs: [pass], hc: PHC, wall: SAND, court: '#c9936a', plinth: 0.0, cornice: 'none', roofMat: K.mat(COPPER, { name: 'lmD-roof-pass' }), roofHc: PHC + PATT, upstand: UP, railing: false,
      bands: [{ y0: PHC - 0.9, y1: PHC, d: 0.3, mat: M.cream }],
      front: (e, c) => { if (east(e)) passageFront(K, c.len, PHC); else sideFacade(K, e, c.len, PHC, PATT, SAND, { granite: true, ground: 5.6 }); return true; },
    });
  }
  if (ren) {
    const entrances = [door, ...centralExtraDoors.filter(d => d.bldg === ren.id)];
    buildHouse(K, {
      name: 'renaissance', recs: [ren], doorways: entrances, hc: RHC, wall: '#dccfae', court: '#d2c4a2', plinth: 0.0, cornice: 'none', roofMat: K.mat('#8e969b', { name: 'lmD-roof-ren' }), roofHc: RHC + RATT, upstand: UP, railing: false,
      bands: [{ y0: RHC - 1.0, y1: RHC, d: 0.35, mat: M.cream }],
      front: (e, c) => {
        const opening = entrances.map(d => ({ entry:d, ...localOnEdge(e, d.x, d.z) }))
          .find(p => Math.abs(p.d) < 1.6 && p.u > 0 && p.u < c.len);
        sideFacade(K, e, c.len, RHC, RATT, '#dccfae', { ground: 5.2, door: opening?.u, doorW: opening?.entry.w, useExistingArch: opening?.entry === door });
        return true;
      },
    });
  }
  monument(K, -209, 553);
}

// ------------------------------------------------------------------------------------------------ the Vladimirsky pr. front of the Passage (Art Nouveau)
function passageFront(K, len, hc) {
  const M = K.mats, P = K.P, wall = K.wall(SAND), bay = K.mat(BAY), top = hc + UP, G = 5.8;
  K.wallQuad(wall, 0, len, G, top, 3);
  K.wallQuad(K.rust(GRANITE), 0, len, 0, G, 2.4, 0, 1.2);
  K.shopfront(1.0, len - 1.0, { pitch: 4.1, y0: 0.9, y1: 4.6, head: 'arch', names: NAMES.slice(0, 8), awn: [], v: 1, pier: 0.9 });
  P.box(K.mat('#8a8987'), 0, len, G - 0.15, G + 0.15, 0, 0.2, 'k');
  const rows = [7.0, 10.9, 14.8, 18.7], mid = len / 2;
  const bayX = [4.7, len - 4.7];
  // plain bays between the bay windows and the turret
  for (const x of [8.6, 11.0, 13.4, len - 8.6, len - 11.0, len - 13.4]) {
    if (Math.abs(x - mid) < 3.0) continue;
    rows.forEach((y) => K.window({ x, y, w: 1.15, h: 2.0, sw: 0.18, d: 0.08, frame: 'brown', surMat: bay, sill: true }));
    K.window({ x, y: 22.2, w: 1.1, h: 1.7, sw: 0.14, d: 0.07, frame: 'brown', surMat: bay, sill: false });
  }
  // two bay windows (three floors + the top floor) in cream-pink stucco
  for (const bx of bayX) {
    P.box(bay, bx - 2.6, bx + 2.6, 5.8, 20.6, 0, 1.15, 'kb');
    P.box(bay, bx - 2.9, bx + 2.9, 20.6, 21.0, 0, 1.35, 'k');
    P.push(0, 0, 1.15, 0);
    [7.0, 10.9, 14.8, 18.4].forEach((y, r) => { for (const dx of [-1.55, 0, 1.55]) K.window({ x: bx + dx, y, w: 0.95, h: r < 3 ? 2.0 : 1.5, sw: 0.1, d: 0.05, frame: 'brown', surMat: M.cream, sill: false }); });
    P.pop();
    // top-floor gable over the bay, with a small window
    const g = new THREE.Shape(); g.moveTo(bx - 2.7, 21.0); g.lineTo(bx + 2.7, 21.0); g.lineTo(bx + 1.5, 26.3); g.lineTo(bx - 1.5, 26.3); g.lineTo(bx - 2.7, 21.0);
    P.extrude(bay, g, 0, 0.9, 1, 4);
    K.window({ x: bx, y: 22.4, w: 0.9, h: 1.3, sw: 0.08, d: 0.05, frame: 'brown', surMat: M.cream, sill: false, v: 1 });
    P.cyl(K.mat('#7fa690'), [bx, 26.3, 0.3], [bx, 28.6, 0.3], 0.5, 0.05, 8, false);
  }
  // round turret over the entrance: a cylinder from the first floor, glazed windows on its front, a green onion cap
  const tx = mid, tz = 1.5, tr = 1.9;
  P.cyl(bay, [tx, 6.0, tz], [tx, hc + 3.6, tz], tr, tr, 18, false);
  P.cyl(M.cream, [tx, 6.0, tz], [tx, 6.5, tz], tr + 0.35, tr + 0.35, 18, true);
  P.push(tx, 0, tz + tr * 0.99, 0);
  [7.4, 11.1, 14.8, 18.5, 22.2].forEach((y) => K.window({ x: 0, y, w: 1.3, h: 2.0, sw: 0.1, d: 0.05, frame: 'brown', surMat: M.cream, sill: false }));
  P.pop();
  P.cyl(M.cream, [tx, hc + 3.6, tz], [tx, hc + 4.3, tz], tr + 0.4, tr + 0.4, 18, true);
  onion(K, K.mat(GREEN), tx, hc + 4.3, tz, 2.1, 0.75);
  P.cyl(K.mat('#d0b060'), [tx, hc + 4.3 + 3.5, tz], [tx, hc + 4.3 + 5.2, tz], 0.07, 0.03, 5, false);
  // mansard: copper-brown wall with dormer windows
  K.wallQuad(K.mat(COPPER), 0, len, top, top + PATT, 3);
  for (let x = 2.5; x < len - 1.5; x += 3.2) if (Math.abs(x - mid) > 3.2) K.window({ x, y: top + 1.2, w: 1.0, h: 1.6, sw: 0.1, d: 0.1, frame: 'brown', surMat: M.cream, sill: false });
  for (const x of [0.5, len - 0.5]) K.downpipe(x, 0.9, hc - 1.2, M.shade);
}

// ------------------------------------------------------------------------------------------------ a plain city facade: shop floor, rows of windows, attic
/** o = { granite, ground (height of the shop floor), door: u of the metro entrance or null, doorW } */
function sideFacade(K, e, len, hc, att, color, o) {
  const M = K.mats, P = K.P, G = o.ground ?? 5.4, top = hc + UP, wall = K.wall(color);
  if (len < 2.6) { K.wallQuad(wall, 0, len, 0, top + att, 3); return; }
  const holes = o.door != null ? [{ x: o.door, y0: 0, w: o.doorW, h: 3.0 + o.doorW / 2, head: 'arch' }] : [];
  const lowMat = o.granite ? K.rust(GRANITE) : K.rust(color);
  if (holes.length) { K.wallWithHoles(lowMat, 0, len, 0, G, holes, 2.4, 1.2); K.wallQuad(wall, 0, len, G, top, 3); } else { K.wallQuad(lowMat, 0, len, 0, G, 2.4, 0, 1.2); K.wallQuad(wall, 0, len, G, top, 3); }
  K.wallQuad(K.mat(o.granite ? COPPER : '#8e969b'), 0, len, top, top + att, 3);
  const a = o.door != null ? o.door - o.doorW / 2 - 0.6 : len, b = o.door != null ? o.door + o.doorW / 2 + 0.6 : len;
  if (a > 3.0) K.shopfront(0.8, Math.min(len - 0.8, a), { pitch: 4.3, y0: 0.9, y1: G - 1.2, head: 'arch', names: NAMES.slice((len | 0) % 4), v: (len | 0) % 4, pier: 0.8 });
  if (o.door != null && len - b > 3.0) K.shopfront(b, len - 0.8, { pitch: 4.3, y0: 0.9, y1: G - 1.2, head: 'arch', names: NAMES.slice(3), v: 2, pier: 0.8 });
  if (!(o.door != null) && false) void 0;
  P.box(K.mat('#8a8987'), 0, len, G - 0.15, G + 0.15, 0, 0.18, 'k');
  const fh = (top - G - 1.5) / Math.max(1, Math.round((top - G - 1.5) / 3.8)), nf = Math.round((top - G - 1.5) / fh);
  const xs = K.bays(1.1, len - 1.1, 3.4);
  for (const x of xs) {
    for (let f = 0; f < nf; f++) K.window({ x, y: G + 0.6 + f * fh, w: 1.15, h: Math.min(2.2, fh * 0.58), head: o.granite && f === 1 ? 'arch' : 'flat', sw: 0.16, d: 0.08, frame: 'white', surMat: M.trim, sill: true });
    K.window({ x, y: top + 1.0, w: 1.0, h: 1.5, sw: 0.1, d: 0.06, frame: 'white', surMat: M.cream, sill: false });
  }
  if (o.useExistingArch) {
    // the metro entrance: a stone-framed arch (the wall hole is a real opening) + a short vaulted passage behind it
    const u = o.door, w = o.doorW, hy = 3.0 + w / 2;
    K.gate(u, 0, w, hy, { open: true, sw: 0.5, d: 0.2, ringMat: K.mat('#b9b0a0') });
    P.box(K.mat('#4f5256'), u - w / 2 - 0.2, u - w / 2, 0, hy, -4.5, 0.0, 'kbf');
    P.box(K.mat('#4f5256'), u + w / 2, u + w / 2 + 0.2, 0, hy, -4.5, 0.0, 'kbf');
    P.box(K.mat('#4f5256'), u - w / 2 - 0.2, u + w / 2 + 0.2, hy, hy + 0.3, -4.5, 0.0, 'kbf');
    // blue pictogram M over the arch: plain sign (no logo): a rounded blue plate with a white letter
    K.fascia(u - 0.7, u + 0.7, hy + 0.9, hy + 2.1, 'М', { w: 128, h: 128, bg: '#1f4e9e', fg: '#ffffff', font: K.ctx.tex.FONTS.sans, weight: 700, z: 0.25, size: 0.85 });
  }
  for (const x of [0.5, len - 0.5]) K.downpipe(x, 0.9, hc - 1.2, M.shade);
  void e; void cup;
}

// ------------------------------------------------------------------------------------------------ the Dostoevsky monument (seated bronze figure on a low granite plinth)
function monument(K, x, z) {
  const P = K.P, M = K.mats, bronze = K.mat('#4b4136', { name: 'lmD-bronze' }), granite = K.mat('#7d7f82');
  P.push(x, 0, z, Math.PI / 2);
  P.box(granite, -1.3, 1.3, 0, 0.35, -1.0, 1.0, 'b');
  P.box(M.graniteWarm, -1.0, 1.0, 0.35, 0.8, -0.75, 0.75, 'b');
  // the seated writer (shared figure kit, statues.js) on a block of granite, facing the cathedral
  P.box(granite, -0.5, 0.5, 0.8, 1.38, -0.62, 0.34, 'b');
  dostoevsky().place(P, { main: bronze, dark: K.mat('#14110e', { name: 'lmD-bronzeDark' }), accent: bronze }, 0, 0.8, 0, 0, 1.15);
  P.pop();
  K.ctx.physics.addBox(x, z, 2.6, 2.0, 0, 0, 1.3);
}
