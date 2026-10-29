// landmarksSmolensky/famous.js - the GRAVES OF FAMOUS PEOPLE of the Smolensky Orthodox Cemetery (docs/vo-monuments.md: every person, the sources, the position, verified yes / no).
// Authored here (each one read from at least two sources for the burial place, the look and roughly where it stands; positions are alley based or the OSM node of the grave):
//   Alexander Blok (1880-1921)   the memorial of his FIRST grave at the Blokovskaya alley (he was reburied at the Literatorskie mostki in 1944): a restored white wooden cross on a mound and a modest grey
//                                stone tablet "На этом месте был похоронен Александр Блок" (pravoslavie.ru 14193, Wikipedia ru, reveal.world)
//   Fyodor Sologub (1863-1927)   a white marble slab "Писатель Фёдор Кузьмич Сологуб / Тетерников / 1863-1927" in a low forged fence, with his wife beside him, at the corner of the Petrogradskaya and Troitskaya alleys
//   Alexei Balabanov (1959-2013) a grey granite cross in the manner of the Pskov monastery crosses, the surname and "НИКА" (fontanka.ru 2022, Wikipedia ru); the OSM node n10795096805; visitors leave a scarf and a toy hedgehog
//   Anna Samokhina (1963-2010)   a 2 m polished black granite stele made as a theatre stage framed by a red curtain, a full-length portrait, a film cassette at the foot (aif.ru, gazeta.spb.ru); OSM node n14247802502
//   Eduard Khil (1934-2012)      a 2 m monument near the chapel of St Xenia: the bronze bust (right hand on the chest) on a stone base whose plan is a heart / a piano lid (KP.ru 2014, kleo.ru, rambler)
//   Taras Shevchenko (1814-1861) the existing granite boulder of his first grave (furniture.js) gets its gold inscription "Здесь 12 марта 1861 г. было первое захоронение Великого поэта Украины Тараса Шевченко"
// Knock policy (the Admiralty rule, docs/AREAS.md 13): a stone tablet, stele, cross and the heart pedestal are STRUCTURES (solid, like the module's other granite memorials: they stand 1 m off the alley edge,
// never across a footpath); the forged plot fence of the Sologub grave is a row of breakable bays (lib/fence-bays.js); grave lamps, flower pots and the toy are knock records (lib/knock-furniture.js).
// Built BEFORE the grounds (landmarksSmolensky.js PARTS): it clears the discs of its monuments in the shared plan (plots, trees, shrubs stay off them), so no grave of the field and no trunk stands in one.
// The two OSM memorial nodes it replaces (n10795096805, n14247802502) are switched off for furniture.js' generic granite stele (their kind is renamed, nothing else reads it).
import * as THREE from 'three';
import * as L from '../layout.js';
import { plan, inRing } from './place.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { partsGeos, kBays } from './inst.js';
import { knockFurniture } from '../lib/knock-furniture.js';
import { splitBays, unitPanel } from '../lib/fence-bays.js';
import { MONUMENTS } from '../data/city.js';

const BOULDER = { x: -5618.2, z: -1486.8, y: 0.38, ry: 0.6, sx: 0.8, sy: 0.5, sz: 0.58 };            // furniture.js: the Shevchenko boulder (a faceted unit sphere scaled)

/** nearest alley point to (x, z): { x, z, gap (distance to the edge), tx, tz } or null */
function nearestAlley(pl, x, z, id) {
  let best = null;
  for (const p of pl.paths) if (!id || p.id === id) for (let i = 0; i + 1 < p.pts.length; i++) {
    const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
    const qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz) - p.hw;
    if (!best || d < best.gap) best = { x: qx, z: qz, gap: d, hw: p.hw, id: p.id };
  }
  return best;
}
const pathById = (pl, id) => pl.paths.find((p) => p.id === id) || null;
/** point at arc length s (negative: from the end) along a path, with the unit tangent */
function along(p, s) {
  const pts = p.pts; let len = 0; for (let i = 0; i + 1 < pts.length; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  if (s < 0) s += len;
  s = Math.max(0, Math.min(len, s));
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= l || i === pts.length - 2) { const t = l ? s / l : 0; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / (l || 1), tz: (b[1] - a[1]) / (l || 1) }; }
    s -= l;
  }
  return null;
}

/** the first free spot beside an alley: tries the arc lengths s0, s0 + 3, s0 - 3 ... on both sides (prefer first), keeping the monument r off the alley edge by clearance */
function spotBeside(pl, id, s0, prefer, r, clearance = 1.1) {
  const p = pathById(pl, id); if (!p) return null;
  for (let k = 0; k < 14; k++) {
    const s = s0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3;
    const q = along(p, s); if (!q) continue;
    for (const side of [prefer, -prefer]) {
      const d = p.hw + clearance + r, x = q.x - q.tz * side * d, z = q.z + q.tx * side * d;
      if (free(pl, x, z, r)) return { x, z, face: Math.atan2(q.tz * side, -q.tx * side) + 0 };
    }
  }
  return null;
}
function free(pl, x, z, r) {
  if (!inRing(pl.ring, x, z) || !pl.inside(x, z, 3.5) || L.insideBuilding(x, z, r + 1)) return false;
  if (pl.inZone(x, z, r)) return false;
  const na = nearestAlley(pl, x, z);
  return !na || na.gap > r + 0.5;
}
/** the facing (rotY of a frame whose +z looks at the nearest alley) at (x, z) */
function faceAlley(pl, x, z, id) {
  const na = nearestAlley(pl, x, z, id); if (!na) return 0;
  return Math.atan2(na.x - x, na.z - z);
}

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const pl = await plan(ctx);
  if (!pl) { console.warn('[landmarksSmolensky] famous: the plan is missing'); return; }
  const T = ctx.mat.toon;
  const flat = (name, col, o = {}) => T(col, { name: 'lmsmol-fam-' + name, paint: 0.03, ...o });
  const F = {
    granite: flat('granite', '#8a8b8c', { paint: 0.05 }), graniteL: flat('graniteL', '#a8a7a2', { paint: 0.05 }), graniteWarm: flat('graniteWarm', '#8d8782', { paint: 0.05 }),
    black: flat('black', '#17191b', { paint: 0.02 }), marble: flat('marble', '#e6e4dc', { paint: 0.03 }), woodWhite: flat('woodWhite', '#ece9e0', { paint: 0.04 }),
    red: flat('curtain', '#8f1f2b', { paint: 0.03 }), redDark: flat('curtainDark', '#6c1620', { paint: 0.03 }), cream: flat('cream', '#e9e2cc', { paint: 0.02 }),
    hair: flat('hair', '#3d3a36', { paint: 0.03 }), hairBronze: flat('hairBronze', '#4a3c2c', { paint: 0.03 }), gravel: flat('gravel', '#9a958a', { paint: 0.05 }), scarf: flat('scarf', '#a33a3a', { paint: 0.03 }), toy: flat('toy', '#7a5a3c', { paint: 0.03 }),
    lamp: flat('lamp', '#b7352c', { paint: 0.02, emissive: '#7a1410', emissiveIntensity: 0.25 }), vase: flat('vase', '#d9d6cc', { paint: 0.03 }),
  };
  const decal = (key, w, h, draw, o = {}) => { const m = T('#ffffff', { map: ctx.tex.draw(w, h, draw, { key, repeat: [1, 1] }), name: key + 'M', paint: 0, polygonOffset: -3, ...o }); M.decals.add(m); return m; };
  const text = (g, t, x, y, maxW, size, font, weight, col) => { g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, t, x, y, maxW, size, font, weight); };
  const SERIF = ctx.tex.FONTS.serif, SANS = ctx.tex.FONTS.sans;
  const front = (Pn, mat, x0, x1, y0, y1, z) => Pn.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // ---- the monuments: the frame of each is (x, z, rot), local +z looks at the alley, +x to the right of a visitor, the head of the grave at -z
  const R = [];                                                                        // { id, name, x, z, rot, r, h }
  const reg = (id, name, x, z, rot, r, h) => { R.push({ id, name, x, z, rot, r, h }); };
  const W = (m, lx, lz) => ({ x: m.x + lx * Math.cos(m.rot) + lz * Math.sin(m.rot), z: m.z - lx * Math.sin(m.rot) + lz * Math.cos(m.rot) });
  const solids = [];                                                                   // the structure colliders: [m, lx, lz, w, d, y1]
  const lamps = [], pots = [], toys = [];                                               // the knock records: { spot, item }
  const solid = (m, lx, lz, w, d, y1) => { const c = W(m, lx, lz); ph.addBox(c.x, c.z, w, d, m.rot, 0, y1); solids.push([m.id, lx, lz]); };
  const post = (m, lx, lz, r, y1) => { const c = W(m, lx, lz); ph.addCylinder(c.x, c.z, r, 0, y1); };
  const lamp = (m, lx, lz) => { const c = W(m, lx, lz); lamps.push({ spot: { x: c.x, y: 0, z: c.z, rotY: m.rot }, item: ph.addCylinder(c.x, c.z, 0.12, 0, 0.3) }); };
  const pot = (m, lx, lz) => { const c = W(m, lx, lz); pots.push({ spot: { x: c.x, y: 0, z: c.z, rotY: m.rot }, item: ph.addCylinder(c.x, c.z, 0.2, 0, 0.5) }); };
  const toy = (m, lx, lz) => { const c = W(m, lx, lz); toys.push({ spot: { x: c.x, y: 0, z: c.z, rotY: m.rot }, item: ph.addCylinder(c.x, c.z, 0.12, 0, 0.2) }); };
  /** a low kerb frame of a grave (w x l, height h) with the earth / gravel inside */
  const kerb = (Pn, mat, fill, w, l, h = 0.12, t = 0.1) => {
    Pn.box(mat, -w / 2, w / 2, 0, h, l / 2 - t, l / 2, 'b'); Pn.box(mat, -w / 2, w / 2, 0, h, -l / 2, -l / 2 + t, 'b');
    Pn.box(mat, -w / 2, -w / 2 + t, 0, h, -l / 2 + t, l / 2 - t, 'b'); Pn.box(mat, w / 2 - t, w / 2, 0, h, -l / 2 + t, l / 2 - t, 'b');
    Pn.quad(fill, [-w / 2 + t, h - 0.02, l / 2 - t], [w / 2 - t, h - 0.02, l / 2 - t], [w / 2 - t, h - 0.02, -l / 2 + t], [-w / 2 + t, h - 0.02, -l / 2 + t], [0, 1, 0]);
  };
  const flowers = (Pn, x, y, z, n, seed = 0) => {
    const C = [M.flowerRed, M.flowerWhite, M.flowerPink, M.flower];
    for (let i = 0; i < n; i++) { const a = (i + seed) * 2.4, rr = 0.05 + (i % 3) * 0.05; S.sph(Pn, C[(i + seed) % 4], x + Math.cos(a) * rr, y + 0.04 + (i % 2) * 0.03, z + Math.sin(a) * rr * 0.7, 0.07, 0.05, 0.07, 5); }
    S.sph(Pn, M.leafGreen, x, y + 0.01, z, 0.11, 0.03, 0.1, 5);
  };

  // ============================================================================================= A. BLOK: the first grave at the Blokovskaya alley
  // The Blokovskaya alley is not named in the OSM data: the unnamed alley w201779367 (55 m, a branch of the Petrogradskaya alley in the west part, 'a small linden alley', Wikipedia ru and the cemetery guides put it west of Troitskaya and Finlyandskaya) stands for it.
  const blokPlate = decal('lmsmol-fam-blok', 256, 128, (g, w, h) => {
    g.fillStyle = '#6f7275'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a4d50'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
    text(g, 'На этом месте был', w / 2, h * 0.24, w - 24, 25, SERIF, 700, '#ecebe4'); text(g, 'похоронен', w / 2, h * 0.47, w - 24, 25, SERIF, 700, '#ecebe4'); text(g, 'Александр Блок', w / 2, h * 0.76, w - 18, 31, SERIF, 700, '#f4f2ea');
  });
  {
    const sp = spotBeside(pl, 'w201779367', 26, 1, 1.4, 1.2) || { x: -5764, z: -1380, face: 1.5 };
    const m = { id: 'fam-blok', name: 'Александр Блок: место первой могилы (Блоковская дорожка)', x: sp.x, z: sp.z, rot: faceAlley(pl, sp.x, sp.z), r: 2.4, h: 2.1 };
    reg(m.id, m.name, m.x, m.z, m.rot, m.r, m.h);
    P.push(m.x, 0, m.z, m.rot);
    kerb(P, M.kerb, M.soil, 1.1, 2.1);
    S.sph(P, M.soil, 0, 0.1, -0.1, 0.42, 0.15, 0.85, 8);                                  // the mound
    P.box(F.woodWhite, -0.05, 0.05, 0, 2.0, -0.82, -0.72, 'b'); P.box(F.woodWhite, -0.42, 0.42, 1.45, 1.53, -0.805, -0.735, '');               // the restored simple white wooden cross (2005), 2 m
    P.box(F.woodWhite, -0.2, 0.2, 1.7, 1.75, -0.8, -0.74, '');
    P.box(F.granite, -0.52, 0.52, 0, 0.14, 0.58, 1.0, 'b');                                  // the stone: a base slab and an upright tablet with the inscription
    P.box(F.graniteL, -0.43, 0.43, 0.14, 0.68, 0.74, 0.86, 'b'); front(P, blokPlate, -0.38, 0.38, 0.2, 0.63, 0.865);
    flowers(P, -0.28, 0.12, 0.2, 5, 0); flowers(P, 0.3, 0.12, -0.1, 4, 2);
    P.pop();
    solid(m, 0, 0.8, 1.05, 0.5, 0.72); post(m, 0, -0.77, 0.1, 2.05);
    lamp(m, 0.36, 0.5); pot(m, -0.4, 0.5);
    K.svc.monuments.push({ id: m.id, name: m.name, x: m.x, z: m.z, h: 2 });
  }

  // ============================================================================================= B. SOLOGUB (with his wife Chebotarevskaya): the corner of the Petrogradskaya and Troitskaya alleys
  const sologubPlate = decal('lmsmol-fam-sologub', 256, 256, (g, w, h) => {
    g.fillStyle = '#e8e6de'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b6b3a8'; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    text(g, 'Писатель', w / 2, h * 0.17, w - 40, 30, SERIF, 700, '#2b2c2e'); text(g, 'Фёдор Кузьмич', w / 2, h * 0.34, w - 30, 34, SERIF, 700, '#2b2c2e');
    text(g, 'СОЛОГУБ', w / 2, h * 0.52, w - 24, 44, SERIF, 700, '#1c1d1f'); text(g, 'Тетерников', w / 2, h * 0.7, w - 40, 30, SERIF, 700, '#2b2c2e'); text(g, '1863 — 1927', w / 2, h * 0.87, w - 50, 30, SERIF, 700, '#2b2c2e');
  });
  {
    const sp = spotBeside(pl, 'w106951471', -16, -1, 1.6, 1.3) || { x: -5640, z: -1452, face: 1.2 };
    const m = { id: 'fam-sologub', name: 'Фёдор Сологуб (Тетерников), 1863—1927', x: sp.x, z: sp.z, rot: faceAlley(pl, sp.x, sp.z), r: 2.2, h: 1.3 };
    reg(m.id, m.name, m.x, m.z, m.rot, m.r, m.h);
    P.push(m.x, 0, m.z, m.rot);
    kerb(P, M.kerb, M.soil, 2.0, 1.9, 0.14, 0.12);
    S.sph(P, M.soil, -0.45, 0.12, 0.05, 0.3, 0.12, 0.7, 8); S.sph(P, M.soil, 0.45, 0.12, 0.05, 0.3, 0.12, 0.7, 8);          // two mounds: the writer and his wife
    P.box(M.stonePale, -0.62, 0.62, 0, 0.16, -0.78, -0.42, 'b'); P.box(F.marble, -0.5, 0.5, 0.16, 1.2, -0.66, -0.54, 'b'); P.box(F.marble, -0.54, 0.54, 1.2, 1.27, -0.69, -0.51, ''); front(P, sologubPlate, -0.46, 0.46, 0.3, 1.14, -0.535);
    flowers(P, -0.45, 0.2, 0.55, 4, 1); flowers(P, 0.45, 0.2, 0.5, 5, 3);
    P.pop();
    solid(m, 0, -0.6, 1.2, 0.4, 1.3);
    pot(m, 0.8, 0.95);
    // the low forged plot fence (breakable bays, the module's plot-fence panel), the front open between x -0.35 and 0.35
    const w2 = (lx, lz) => W(m, lx, lz), bays = [], hw = 1.18, hl = 1.08;
    const side = (a, b) => { const A = w2(a[0], a[1]), B = w2(b[0], b[1]); bays.push(...splitBays(A.x, A.z, B.x, B.z, 1.15, { y: 0, h: 0.9 })); };
    side([-hw, -hl], [hw, -hl]); side([-hw, -hl], [-hw, hl]); side([hw, -hl], [hw, hl]); side([-hw, hl], [-0.35, hl]); side([0.35, hl], [hw, hl]);
    kBays(K, { name: 'lmsmol-fam-fence', bays, far: 200,
      parts: [{ geo: unitPanel(0, 0.9, { u1: 1 }), mat: M.plotFence, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: 0.95, thick: 0.12 }, rec: () => ({ kind: 'fence', mass: 60, h: 0.9, anchored: 10, hitK: 0.4, metal: true, minDv: 0 }) });
    K.svc.monuments.push({ id: m.id, name: m.name, x: m.x, z: m.z, h: 1.3 });
  }

  // ============================================================================================= C. BALABANOV (OSM node n10795096805): a grey granite cross in the manner of the Pskov monastery crosses
  const balPlate = decal('lmsmol-fam-balabanov', 256, 96, (g, w, h) => {
    g.fillStyle = '#6e6b67'; g.fillRect(0, 0, w, h); text(g, 'БАЛАБАНОВ', w / 2, h / 2, w - 20, 50, SERIF, 700, '#e8e5dc');
  });
  const nikaPlate = decal('lmsmol-fam-nika', 64, 192, (g, w, h) => {
    g.fillStyle = '#8d8782'; g.fillRect(0, 0, w, h); 'НИКА'.split('').forEach((c, i) => text(g, c, w / 2, h * (0.14 + i * 0.24), w - 8, 40, SERIF, 700, '#34322f'));
  });
  {
    const node = MONUMENTS.find((q) => q.id === 'n10795096805') || { x: -5725.2, z: -1053.6 };
    if (node.kind) node.kind = 'authored-' + node.kind;                                                   // furniture.js draws only 'memorial' / 'tomb' nodes: this one is drawn here
    const m = { id: 'fam-balabanov', name: 'Алексей Балабанов, кинорежиссёр (1959—2013)', x: node.x, z: node.z, rot: faceAlley(pl, node.x, node.z), r: 2.2, h: 2.5 };
    reg(m.id, m.name, m.x, m.z, m.rot, m.r, m.h);
    P.push(m.x, 0, m.z, m.rot);
    kerb(P, M.kerb, F.gravel, 1.2, 2.2, 0.12, 0.1);
    P.box(F.graniteWarm, -0.5, 0.5, 0, 0.18, -0.95, -0.45, 'b'); P.box(F.graniteWarm, -0.42, 0.42, 0.18, 0.62, -0.88, -0.52, 'b'); front(P, balPlate, -0.36, 0.36, 0.26, 0.55, -0.515);                       // the stepped base with the surname
    P.box(F.graniteWarm, -0.17, 0.17, 0.62, 2.3, -0.8, -0.6, 'b');                                                                                                                          // the shaft (Pskov type: broad, flared ends)
    P.box(F.graniteWarm, -0.55, 0.55, 1.55, 1.88, -0.795, -0.605, '');                                                                                                                       // the cross arm
    for (const s of [-1, 1]) P.box(F.graniteWarm, s > 0 ? 0.5 : -0.66, s > 0 ? 0.66 : -0.5, 1.5, 1.93, -0.8, -0.6, '');                                                                          // flared arm ends
    P.box(F.graniteWarm, -0.3, 0.3, 2.3, 2.46, -0.8, -0.6, ''); P.box(F.graniteWarm, -0.3, 0.3, 0.62, 0.7, -0.83, -0.57, '');
    front(P, nikaPlate, -0.1, 0.1, 0.78, 1.45, -0.595);                                                                                                                                      // НИКА down the lower shaft
    P.box(F.scarf, 0.4, 0.5, 1.2, 1.62, -0.7, -0.58, ''); P.box(F.scarf, 0.4, 0.5, 1.58, 1.64, -0.8, -0.58, '');                                                                          // a scarf hung over the right arm
    flowers(P, -0.3, 0.12, 0.2, 5, 2); flowers(P, 0.32, 0.12, 0.45, 4, 5);
    P.pop();
    solid(m, 0, -0.7, 1.05, 0.55, 2.4);
    toy(m, -0.3, -0.35); lamp(m, 0.35, 0.1); pot(m, 0.3, 0.7);
    K.svc.monuments.push({ id: m.id, name: m.name, x: m.x, z: m.z, h: 2.5 });
  }

  // ============================================================================================= D. SAMOKHINA (OSM node n14247802502): a black granite stele as a theatre stage with a red curtain, a film cassette at the foot
  const samPlate = decal('lmsmol-fam-samokhina', 256, 384, (g, w, h) => {
    g.fillStyle = '#0f1113'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#23262a'; g.fillRect(34, 64, w - 68, h - 150);                                                     // the stage (polished grey-black)
    for (const s of [0, 1]) {                                                                                         // the curtain: drapes with folds, a valance on top
      const x0 = s ? w - 44 : 0, x1 = s ? w : 44; g.fillStyle = '#8f1f2b'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1, 0); g.lineTo(s ? w - 20 : 24, h - 86); g.lineTo(s ? w - 70 : 0, h - 86); g.closePath(); g.fill();
      g.strokeStyle = '#5c1019'; g.lineWidth = 3; for (let k = 1; k < 4; k++) { const xx = x0 + (x1 - x0) * k / 4; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx + (s ? 10 : -10), h - 90); g.stroke(); }
    }
    g.fillStyle = '#a2212f'; g.fillRect(0, 0, w, 66); g.fillStyle = '#6c1620'; for (let k = 0; k < 9; k++) g.fillRect(k * 30 + 4, 40, 18, 26);
    g.strokeStyle = '#d5d6d3'; g.fillStyle = '#d5d6d3'; g.lineWidth = 2.5;                                          // the full-length portrait: a woman in a long dress (line portrait)
    g.beginPath(); g.arc(128, 124, 17, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(112, 118); g.quadraticCurveTo(106, 150, 118, 168); g.moveTo(144, 118); g.quadraticCurveTo(152, 150, 140, 168); g.stroke();
    g.beginPath(); g.moveTo(116, 144); g.lineTo(106, 165); g.lineTo(112, 232); g.lineTo(84, 300); g.lineTo(172, 300); g.lineTo(144, 232); g.lineTo(150, 165); g.lineTo(140, 144); g.stroke();
    g.beginPath(); g.moveTo(106, 168); g.lineTo(90, 220); g.moveTo(150, 168); g.lineTo(166, 214); g.stroke(); g.beginPath(); g.moveTo(112, 232); g.lineTo(144, 232); g.stroke();
    g.globalAlpha = 0.55; g.beginPath(); g.moveTo(95, 300); g.lineTo(100, 340); g.moveTo(160, 300); g.lineTo(154, 340); g.stroke(); g.globalAlpha = 1;
    text(g, 'АННА САМОХИНА', w / 2, h - 52, w - 20, 24, SERIF, 700, '#e6e4dd'); text(g, '1963 — 2010', w / 2, h - 24, w - 40, 22, SERIF, 700, '#cfcdc6');
  });
  {
    const node = MONUMENTS.find((q) => q.id === 'n14247802502') || { x: -5838.6, z: -997.5 };
    if (node.kind) node.kind = 'authored-' + node.kind;
    const m = { id: 'fam-samokhina', name: 'Анна Самохина, актриса (1963—2010)', x: node.x, z: node.z, rot: faceAlley(pl, node.x, node.z), r: 2.2, h: 2.1 };
    reg(m.id, m.name, m.x, m.z, m.rot, m.r, m.h);
    P.push(m.x, 0, m.z, m.rot);
    kerb(P, M.kerb, F.gravel, 1.5, 2.4, 0.12, 0.1);
    P.box(F.black, -0.78, 0.78, 0, 0.2, -1.0, -0.62, 'b'); P.box(F.black, -0.68, 0.68, 0.2, 2.1, -0.94, -0.78, 'b'); front(P, samPlate, -0.64, 0.64, 0.24, 2.06, -0.775);   // the plinth and the 1.3 x 1.9 m stele
    for (const s of [-1, 1]) P.box(F.red, s * 0.54 - 0.1, s * 0.54 + 0.1, 0.82, 1.98, -0.775, -0.735, '');                    // the drapes stand a little out of the stone
    P.box(F.red, -0.66, 0.66, 1.84, 2.0, -0.78, -0.72, ''); P.box(F.redDark, -0.66, 0.66, 1.78, 1.84, -0.78, -0.725, '');
    P.box(F.black, -0.45, 0.45, 0.2, 0.28, -0.4, 0.2, 'b');                                                                                                                      // the low step of the film cassette
    P.col(F.black, 0, -0.1, 0.28, 0.4, 0.34, 0.34, 14, true);                                                                                                                    // the film cassette (reel): a drum with a ring of cream frames
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; P.push(Math.sin(a) * 0.31, 0.4, -0.1 + Math.cos(a) * 0.31, a); P.box(F.cream, -0.05, 0.05, 0, 0.02, -0.04, 0.04, 'b'); P.pop(); }
    S.sph(P, F.black, 0, 0.4, -0.1, 0.08, 0.03, 0.08, 6);
    flowers(P, -0.55, 0.12, 0.5, 6, 0); flowers(P, 0.55, 0.12, 0.35, 6, 3); flowers(P, 0, 0.12, 0.8, 5, 1);
    P.pop();
    solid(m, 0, -0.8, 1.6, 0.5, 2.1); solid(m, 0, -0.1, 0.8, 0.8, 0.45);
    lamp(m, -0.6, 0.85); lamp(m, 0.6, 0.85); pot(m, 0.2, 0.9);
    K.svc.monuments.push({ id: m.id, name: m.name, x: m.x, z: m.z, h: 2.1 });
  }

  // ============================================================================================= E. KHIL: near the chapel of St Xenia, the bust on the heart-shaped (a piano lid) stone
  const khilPlate = decal('lmsmol-fam-khil', 256, 128, (g, w, h) => {
    g.fillStyle = '#6a6764'; g.fillRect(0, 0, w, h); text(g, 'Эдуард Хиль', w / 2, h * 0.36, w - 24, 44, SERIF, 700, '#ece9e0'); text(g, '1934 — 2012', w / 2, h * 0.74, w - 50, 32, SERIF, 700, '#d8d4ca');
  });
  {
    const sp = spotBeside(pl, 'w120715343', 28, 1, 1.8, 1.2) || { x: -5598, z: -1280, face: 1.5 };
    const m = { id: 'fam-khil', name: 'Эдуард Хиль, певец (1934—2012)', x: sp.x, z: sp.z, rot: faceAlley(pl, sp.x, sp.z), r: 2.3, h: 2.0 };
    reg(m.id, m.name, m.x, m.z, m.rot, m.r, m.h);
    P.push(m.x, 0, m.z, m.rot);
    kerb(P, M.kerb, F.gravel, 1.6, 2.5, 0.12, 0.1);
    // the heart / piano-lid plan: a parametric heart 1.15 x 1.05 m, the point towards the visitor; walls 1.05 m
    const ring = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; ring.push([16 * Math.pow(Math.sin(t), 3) * 0.036, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * 0.036 - 0.55]); }
    const cx = ring.reduce((s, q) => s + q[0], 0) / ring.length, cz = ring.reduce((s, q) => s + q[1], 0) / ring.length;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      if (nx * ((a[0] + b[0]) / 2 - cx) + nz * ((a[1] + b[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
      P.quad(F.graniteWarm, [a[0], 0.14, a[1]], [b[0], 0.14, b[1]], [b[0], 1.1, b[1]], [a[0], 1.1, a[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    P.cap(F.graniteWarm, ring, 1.1, true, 3);
    P.box(F.granite, -0.7, 0.7, 0, 0.14, -1.05, 0.7, 'b');                                                                // the base slab
    // the bronze bust on a small plinth: shoulders, neck, head with hair, the right hand on the chest
    P.box(M.bronze, -0.32, 0.32, 1.1, 1.18, -0.82, -0.52, 'b');
    S.sph(P, M.bronze, 0, 1.38, -0.67, 0.31, 0.24, 0.17, 8); P.col(M.bronzeFace, 0, -0.67, 1.55, 1.7, 0.08, 0.09, 6, false);
    S.sph(P, M.bronzeFace, 0, 1.82, -0.66, 0.115, 0.15, 0.125, 8); S.sph(P, F.hairBronze, 0, 1.93, -0.7, 0.12, 0.075, 0.12, 6);
    P.box(M.bronze, 0.0, 0.17, 1.36, 1.46, -0.52, -0.46, ''); P.box(M.bronze, 0.12, 0.2, 1.3, 1.5, -0.53, -0.47, '');
    P.box(F.graniteWarm, -0.3, 0.3, 0.14, 0.62, -0.03, 0.1, 'b'); front(P, khilPlate, -0.26, 0.26, 0.2, 0.56, 0.105);       // a low die in front of the point of the heart carries the plate
    flowers(P, -0.5, 0.12, 0.75, 5, 4); flowers(P, 0.5, 0.12, 0.95, 5, 1);
    P.pop();
    solid(m, 0, -0.5, 1.2, 1.2, 2.0);
    lamp(m, -0.6, 1.0); lamp(m, 0.6, 1.0); pot(m, 0, 1.0);
    K.svc.monuments.push({ id: m.id, name: m.name, x: m.x, z: m.z, h: 2.0 });
  }

  // ============================================================================================= F. SHEVCHENKO: the gold inscription on the existing boulder (furniture.js draws the stone)
  {
    const B = BOULDER, rot = faceAlley(pl, B.x, B.z, 'w109078569'), dx = Math.sin(rot), dz = Math.cos(rot);
    const loc = (wx, wz) => ({ x: wx * Math.cos(-B.ry) + wz * Math.sin(-B.ry), z: -wx * Math.sin(-B.ry) + wz * Math.cos(-B.ry) });
    const ld = loc(dx, dz), a0 = Math.atan2(ld.x / B.sx, ld.z / B.sz);                                                                   // the azimuth of the alley side in the boulder's frame
    const pt = (a, e, k) => { const lx = B.sx * Math.cos(e) * Math.sin(a) * k, ly = B.sy * Math.sin(e) * k, lz = B.sz * Math.cos(e) * Math.cos(a) * k;
      return [B.x + lx * Math.cos(B.ry) + lz * Math.sin(B.ry), B.y + ly, B.z - lx * Math.sin(B.ry) + lz * Math.cos(B.ry)]; };
    const rx = dz, rz = -dx;                                                                                               // the visitor's right
    const gold = decal('lmsmol-fam-shevchenko', 256, 160, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const L = ['Здесь 12 марта 1861 г.', 'было первое захоронение', 'Великого поэта Украины', 'Тараса Шевченко'];
      L.forEach((t, i) => text(g, t, w / 2, h * (0.14 + i * 0.24), w * 0.78, 23, SERIF, 700, i === 3 ? '#f3d27a' : '#e0b85a'));
    }, { alphaTest: 0.42, side: 'double' });
    const N = 6, span = 0.95, e0 = 0.02, e1 = 0.78, k = 1.05;
    const uOf = (p) => ((p[0] - B.x) * rx + (p[2] - B.z) * rz);
    const uMin = uOf(pt(a0 - span / 2, 0.4, k)), uMax = uOf(pt(a0 + span / 2, 0.4, k));
    for (let i = 0; i < N; i++) {
      const aA = a0 - span / 2 + span * i / N, aB = a0 - span / 2 + span * (i + 1) / N;
      const q = [pt(aA, e0, k), pt(aB, e0, k), pt(aB, e1, k), pt(aA, e1, k)];
      const nm = pt((aA + aB) / 2, (e0 + e1) / 2, 1); const nrm = [nm[0] - B.x, nm[1] - B.y, nm[2] - B.z];
      const gu = (p) => (uOf(p) - uMin) / (uMax - uMin || 1);
      const vv = (e) => (e - e0) / (e1 - e0);
      const lift = (p) => [p[0] + (p[0] - B.x) * 0.04, p[1] + 0.012, p[2] + (p[2] - B.z) * 0.04];
      P.quad(gold, lift(q[0]), lift(q[1]), lift(q[2]), lift(q[3]), nrm, [[gu(q[0]), vv(e0)], [gu(q[1]), vv(e0)], [gu(q[2]), vv(e1)], [gu(q[3]), vv(e1)]]);
    }
    K.svc.monuments.push({ id: 'fam-shevchenko', name: 'Тарас Шевченко: первая могила (валун 1989)', x: B.x, z: B.z, h: 1 });
  }

  // ============================================================================================= the small knock records (grave lamps, flower pots, the toy)
  const lampGeo = partsGeos((Pn) => { Pn.col(F.lamp, 0, 0, 0, 0.2, 0.07, 0.06, 8, true); Pn.col(M.crossIron, 0, 0, 0.2, 0.26, 0.075, 0.03, 8, true); Pn.box(M.crossIron, -0.01, 0.01, 0.26, 0.33, -0.01, 0.01, ''); Pn.box(M.crossIron, -0.04, 0.04, 0.3, 0.315, -0.01, 0.01, ''); });
  const potGeo = partsGeos((Pn) => { Pn.col(F.vase, 0, 0, 0, 0.2, 0.1, 0.14, 8, true); flowers(Pn, 0, 0.2, 0, 7, 1); });
  const toyGeo = partsGeos((Pn) => { S.sph(Pn, F.toy, 0, 0.07, 0, 0.1, 0.07, 0.07, 6); S.sph(Pn, F.toy, 0, 0.06, 0.1, 0.04, 0.04, 0.05, 5); });
  const put = (name, geo, list, rec, far) => { K.extraTris += knockFurniture(ctx, name, geo, list.map((q) => q.spot), list.map((q) => q.item), rec, far); };
  put('lmsmol-fam-lamps', lampGeo, lamps, { kind: 'pot', mass: 2, h: 0.33, r: 0.1, hitK: 0.05, minDv: 0.3, far: 120 }, 140);
  put('lmsmol-fam-pots', potGeo, pots, { kind: 'pot', mass: 8, h: 0.4, r: 0.18, hitK: 0.08, minDv: 0.4, far: 140 }, 150);
  put('lmsmol-fam-toys', toyGeo, toys, { kind: 'pot', mass: 1, h: 0.2, r: 0.1, hitK: 0.04, minDv: 0.2, far: 100 }, 120);

  // ============================================================================================= reserve the ground: no plot of the grave field, no tree, no shrub inside the discs
  pl.famous = R;
  let removed = 0;
  for (const m of R) {
    if (!pl.discs.some((d) => d[3] === m.id)) pl.discs.push([m.x, m.z, m.r, m.id]);
    for (const list of [pl.trees, pl.shrubs]) for (let i = list.length - 1; i >= 0; i--) { const t = list[i]; if (Math.hypot(t.x - m.x, t.z - m.z) < m.r + 1.4) { list.splice(i, 1); removed++; } }
  }
  K.svc.famous = { count: R.length, removedTrees: removed, spots: R.map((m) => ({ id: m.id, x: Math.round(m.x * 10) / 10, z: Math.round(m.z * 10) / 10 })) };
  if (typeof process !== 'undefined' && process.env && process.env.SMOL_DEBUG) console.log('[famous]', JSON.stringify({ ...K.svc.famous, rot: R.map((m) => Math.round(m.rot * 100) / 100) }));
  void G; void solids;
}
