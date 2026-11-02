// landmarksH/garden.js - the Alexander Garden (Александровский сад, "Сашкин сад", 9 ha), the Admiralty (Neva) garden strip and the lawns of Senate Square.
// Dossier docs/research/admiralty-stisaac.md section 4-5, photos refs/admiralty 007 033 040 041 042 043 044 047 049 131.  The claimed GREEN polygons (groups.js 'gardens') are drawn here:
//   lawns        the park polygons r1604351 / r11492646 and the Senate Square grass at y 0.012 under the footways of the street layer (the OSM paths stay as they are)
//   alley gravel the central alley (a +-7 from the arch to the fountain) and the ring round the fountain in red-brown gravel #B07A66
//   fountain     w74168797 at (-2334.8, -494.8) on the gate axis: grey-green granite basin (wall 0.9 m, r 13.3 m), water, 17 m central jet, 8 inner jets, 40 outer arc jets (animated), 4 busts on granite
//                pedestals (Gorchakov, Glinka, Lermontov, Gogol) at the compass points
//   monuments    Zhukovsky bust, Flora Farnese, Przhevalsky on a boulder (4.8 m), Hercules Farnese, two cannons on red granite blocks, torchere lamps round the fountain and along the alley
//   trees        gtrees.js: lindens / elms / maples / ash / oak in alley rows and thickets, open sight lines to the tower and the Horseman
// NO flags (user rule).  Benches / bins are the props module's (OSM furniture); lamps of the street network are streets'.
// KNOCKABLE (core/knock.js, lib/knock-inst.js): with ctx.knock the 14 torcheres are instanced (iron body + glowing lantern, Dynamic, per 384 m cell, LOD 300 m) and registered, anchored at 20 km/h: a car
// at the break speed knocks one over at the foot and its lantern goes dark. Without ctx.knock they are drawn into the module's Parts as before. Cannons and anchors (bronze) stay solid.
import * as THREE from 'three';
import * as L from '../layout.js';
import { GREEN, AREAS } from '../data/city.js';
import { ringFromFlat } from '../lib/massing.js';
import { Parts } from './kit.js';
import { knockInstances } from '../lib/knock-inst.js';
import { GROUPS_LIST } from './groups.js';
import { statue } from './tower.js';
import { figureMats } from '../lib/figures.js';
import { hercules, flora, bustOf, przhevalskyCamel } from './statues.js';
import { ellip } from './sculpt.js';
import { buildGardenTrees } from './gtrees.js';
import { W, AB } from './frame.js';
import { liveFountain } from '../lib/live-fountain.js';

const FOUNTAIN = [-2334.8, -494.8];
const BUSTS = [['gorchakov', 'А. М. Горчаков', -2352.2, -507.8], ['glinka', 'М. И. Глинка', -2340.7, -516], ['lermontov', 'М. Ю. Лермонтов', -2316.4, -508], ['gogol', 'Н. В. Гоголь', -2352, -480.7]];

export function build(K, ctx, H) {
  const P = K.P, M = H.M, T = ctx.mat.toon;
  const ids = new Set(GROUPS_LIST.find((g) => g.key === 'gardens').osm);
  const recs = GREEN.filter((g) => ids.has(g.id));
  const parks = [], woods = [];
  for (const g of recs) for (const p of g.polys) { if (g.kind === 'wood') woods.push(p); else if (g.kind === 'park' || g.kind === 'grass') parks.push({ p, id: g.id }); }

  // ---------------------------------------------------------------- lawns
  const lawnTex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#5f8f2a'; g.fillRect(0, 0, w, h); let sd = 11; const rnd = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; };
    for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(120,170,60,0.35)' : 'rgba(50,90,28,0.35)'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 5, 2 + rnd() * 3); }
  }, { key: 'lmH-lawnTex', repeat: [1, 1] });
  const lawn = T('#ffffff', { map: lawnTex, paint: 0.05, polygonOffset: -1, name: 'lmH-lawn' });
  for (const { p } of parks) {
    const ring = ringFromFlat(p.o), holes = p.h.map(ringFromFlat).filter((h) => h.length >= 3);
    try { P.cap(lawn, ring, 0.012, true, 5, holes); } catch (e) { console.warn('[landmarksH] lawn', e); }
  }

  // ---------------------------------------------------------------- gravel: the central alley and the ring round the fountain
  const gravelTex = ctx.tex.draw(256, 256, (g2, w, h) => { g2.fillStyle = '#b58c78'; g2.fillRect(0, 0, w, h); let sd = 21; const rnd = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; }; for (let i = 0; i < 1400; i++) { g2.fillStyle = rnd() < 0.5 ? 'rgba(210,170,140,0.5)' : 'rgba(120,80,60,0.45)'; g2.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 2); } }, { key: 'lmH-gravelTex', repeat: [1, 1] });
  const gravel = T('#ffffff', { map: gravelTex, paint: 0.05, polygonOffset: -2, name: 'lmH-gravel' });
  {
    const y = 0.015, q = (a0, a1, b0, b1) => { const A = W(a0, b0), B = W(a1, b0), C = W(a1, b1), D = W(a0, b1); P.quad(gravel, [A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [D[0], y, D[1]], [0, 1, 0], [[0, 0], [(a1 - a0) / 5, 0], [(a1 - a0) / 5, Math.abs(b1 - b0) / 5], [0, Math.abs(b1 - b0) / 5]]); };
    q(-7.5, 7.5, -14, -67);
    const seg = 48, cx = FOUNTAIN[0], cz = FOUNTAIN[1];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p = (a, r) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      P.quad(gravel, p(a0, 14.0), p(a1, 14.0), p(a1, 20.6), p(a0, 20.6), [0, 1, 0], [[i * 1.8, 0], [(i + 1) * 1.8, 0], [(i + 1) * 1.8, 1.3], [i * 1.8, 1.3]]);
    }
  }

  // the claimed paved areas of the garden (OSM AREAS: the fountain plaza, the wide alleys) are gravel too
  for (const a of AREAS) {
    if (!ids.has(a.id)) continue;
    for (const p of a.polys) { try { P.cap(gravel, ringFromFlat(p.o), 0.016, true, 5, p.h.map(ringFromFlat).filter((h) => h.length >= 3)); } catch (e) { console.warn('[landmarksH] gravel', e); } }
  }

  // ---------------------------------------------------------------- the fountain
  const stone = T('#7c8c84', { name: 'lmH-fStone', paint: 0.05 }), stoneIn = T('#6a7a72', { side: 'double', name: 'lmH-fStoneIn' }), water = T('#4b86b8', { name: 'lmH-fWater', paint: 0.0 });
  {
    const [cx, cz] = FOUNTAIN, seg = 48, R0 = 13.0, R1 = 13.9;
    P.cyl(stone, [cx, 0, cz], [cx, 0.9, cz], R1, R1, seg, false);
    P.cyl(stoneIn, [cx, 0.55, cz], [cx, 0.9, cz], R0, R0, seg, false);
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p = (a, r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      P.quad(stone, p(a0, R0, 0.9), p(a1, R0, 0.9), p(a1, R1, 0.9), p(a0, R1, 0.9), [0, 1, 0]);
      P.fan(water, [[cx, 0.62, cz], p(a0, R0, 0.62), p(a1, R0, 0.62)], [0, 1, 0]);
    }
    ctx.physics.addCylinder(cx, cz, R1, 0, 0.9);
    // jets: animated (a dynamic group, never merged)
    jets(K, ctx, cx, cz);
  }
  // ---------------------------------------------------------------- the four busts at the compass points
  const [fx, fz] = FOUNTAIN;
  for (const [id, name, x, z] of BUSTS) { bust(K, M, x, z, Math.atan2(fx - x, fz - z) + Math.PI, 2.6, id); K.svc.monuments.push({ id: 'bust-' + id, name, nameEn: id, x, z, h: 3.0 }); ctx.physics.addCylinder(x, z, 0.8, 0, 2.5); }
  bust(K, M, -2216.7, -584.9, rotTowardsSq(-2216.7, -584.9), 3.0, 'zhukovsky'); K.svc.monuments.push({ id: 'zhukovsky', name: 'В. А. Жуковский', nameEn: 'Zhukovsky bust', x: -2216.7, z: -584.9, h: 3.6 }); ctx.physics.addCylinder(-2216.7, -584.9, 0.8, 0, 3);
  // Przhevalsky: a granite boulder with a bronze bust and a camel relief (4.8 m)
  {
    const x = -2450.5, z = -404.2, rock = T('#8f8a84', { name: 'lmH-pRock', paint: 0.07 });
    P.geo(rock, K.rockGeo || (K.rockGeo = new THREE.IcosahedronGeometry(1, 1)), x, 1.1, z, 0, 0.4, 0, 1.8, 1.4, 1.5);
    P.box(M.graniteDark, x - 0.7, x + 0.7, 2.2, 2.7, z - 0.7, z + 0.7, 'b');
    bustOf('przhevalsky').place(P, figureMats(K.ctx).keys('bronze', 'bronze'), x, 2.65, z, rotTowardsSq(x, z), 1.9);
    przhevalskyCamel().place(P, figureMats(K.ctx).keys('bronze', 'bronze'), x + 1.55, 0.05, z + 1.1, rotTowardsSq(x, z) + 1.2, 0.95);       // the loaded camel lying at the foot of the rock
    ctx.physics.addCylinder(x, z, 1.9, 0, 4.5);
    K.svc.monuments.push({ id: 'przhevalsky', name: 'Н. М. Пржевальский', nameEn: 'Przhevalsky monument', x, z, h: 4.8 });
  }
  // Hercules Farnese (2014 copy) and Flora Farnese on marble pedestals
  for (const [x, z, id, name, s] of [[-2547.8, -389, 'hercules', 'Геракл Фарнезский', 1.15], [-2206.9, -654.8, 'flora', 'Флора Фарнезская', 1.05]]) {
    P.box(M.whiteShade, x - 0.9, x + 0.9, 0, 1.9, z - 0.9, z + 0.9, 'b'); P.box(M.white, x - 1.1, x + 1.1, 1.9, 2.2, z - 1.1, z + 1.1, 'b');
    (id === 'hercules' ? hercules() : flora()).place(P, figureMats(K.ctx).keys('marble', 'marble'), x, 2.2, z, rotTowardsSq(x, z), id === 'hercules' ? 1.8 : 1.9);
    void statue; void s;
    ctx.physics.addCylinder(x, z, 1.3, 0, 4.5);
    K.svc.monuments.push({ id, name, nameEn: id, x, z, h: 5.5 });
  }
  // two cannons on red granite blocks in front of the west portico (OSM nodes)
  for (const [x, z] of [[-2507.4, -451.4], [-2483, -470]]) {
    const ang = Math.atan2(-0.6088, 0.7934) + 0.3;
    P.box(M.graniteRed || (M.graniteRed = T('#a8604f', { name: 'lmH-gRed' })), x - 0.9, x + 0.9, 0, 0.8, z - 0.9, z + 0.9, 'b');
    P.cyl(M.iron, [x - Math.cos(ang) * 0.9, 1.0, z - Math.sin(ang) * 0.9], [x + Math.cos(ang) * 0.9, 1.25, z + Math.sin(ang) * 0.9], 0.3, 0.22, 8, true);
    ctx.physics.addCylinder(x, z, 1.0, 0, 1.3);
  }
  // two old ship anchors on pink-granite plinths in front of the gate (dossier 3.4, photo 029)
  for (const a of [-27, 27]) {
    const [x, z] = W(a, -17.5), ang = Math.atan2(-0.6088, 0.7934) + (a < 0 ? 0.35 : -0.35);
    P.box(M.granRust, x - 1.2, x + 1.2, 0, 1.1, z - 0.9, z + 0.9, 'b', 1.2);
    P.push(x, 1.1, z, ang);
    P.cyl(M.iron, [0, 0.0, 0], [0, 2.1, 0], 0.11, 0.09, 6, true);                                // shank
    P.box(M.iron, -0.7, 0.7, 1.95, 2.1, -0.08, 0.08, '');                                             // stock
    P.geo(M.iron, K.anchorArm || (K.anchorArm = new THREE.TorusGeometry(1.0, 0.09, 5, 12, Math.PI)), 0, 0.15, 0, 0, 0, Math.PI, 1, 1, 1);   // the two flukes
    P.geo(M.iron, K.anchorRing || (K.anchorRing = new THREE.TorusGeometry(0.22, 0.05, 5, 8)), 0, 2.25, 0, 0, 0, 0, 1, 1, 1);
    P.pop();
    ctx.physics.addCylinder(x, z, 1.2, 0, 2.4);
  }
  // ---------------------------------------------------------------- torchere lamps: black cast iron, a square lantern with a pointed cap (4.6 m): round the fountain and along the central alley
  const lampMat = M.iron, glow = ctx.mat.emissive ? ctx.mat.emissive('#ffd8a0', 0.5) : M.cream;
  const st = ctx.services.streets;
  const torchModel = (Q, x, z) => {
    Q.cyl(lampMat, [x, 0, z], [x, 0.9, z], 0.26, 0.2, 8, true); Q.cyl(lampMat, [x, 0.9, z], [x, 3.9, z], 0.1, 0.07, 6, true);
    Q.box(lampMat, x - 0.28, x + 0.28, 3.9, 4.0, z - 0.28, z + 0.28, 'b'); Q.box(glow, x - 0.22, x + 0.22, 4.0, 4.55, z - 0.22, z + 0.22, '');
    Q.cyl(lampMat, [x, 4.55, z], [x, 4.95, z], 0.34, 0.02, 4, true);
  };
  const torchSpots = [];                                                                           // (ctx.knock only) { x, y, z, rotY, item }
  const torch = (x, z) => {
    if (st && st.net.cover(x, z, {}) > -0.8) return;                                               // Admiralteysky proezd cuts the garden: no lamp on its asphalt (streets is built before this module)
    const item = ctx.physics.addCylinder(x, z, 0.22, 0, 5); K.svc.lamps.push({ x, z, h: 4.9 });
    if (ctx.knock) torchSpots.push({ x, y: 0, z, rotY: 0, item }); else torchModel(P, x, z);
  };
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.26; torch(FOUNTAIN[0] + Math.cos(a) * 22.5, FOUNTAIN[1] + Math.sin(a) * 22.5); }
  for (let b = -22; b > -70; b -= 24) for (const a of [-9.5, 9.5]) { const [x, z] = W(a, b); torch(x, z); }
  if (torchSpots.length) {                                                                         // the knockable torcheres: iron body + lantern, templates at the origin
    const tp = new Parts(); torchModel(tp, 0, 0);
    const meshes = tp.build(new THREE.Group()), geoOf = (mat) => meshes.find((m) => m.material === mat).geometry;
    knockInstances(ctx, {
      name: 'lmH-torch',
      parts: [{ geo: geoOf(lampMat), mat: lampMat, name: 'body' }, { geo: geoOf(glow), mat: glow, name: 'glow', shadow: false, noOutline: true, hide: true }],
      spots: torchSpots, items: torchSpots.map((s) => s.item), far: 300,
      rec: { kind: 'lamp', mass: 250, h: 4.9, r: 0.22, anchored: 20, hitK: 0.5, metal: true },
    });
  }

  // ---------------------------------------------------------------- trees
  const avoid = [[FOUNTAIN[0], FOUNTAIN[1], 23]];
  for (const m of K.svc.monuments) if (m.x !== undefined && /bust|zhukovsky|prz|hercules|flora/.test(m.id)) avoid.push([m.x, m.z, 4.5]);
  avoid.push([-2507.4, -451.4, 3], [-2483, -470, 3], [-2745.5, -444.2, 34]);
  const noTree = GREEN.filter((q) => ['r11280628', 'r11280629', 'r11280632'].includes(q.id)).flatMap((q) => q.polys);
  const t = buildGardenTrees(K, ctx, H, { woods, parks: parks.filter((q) => q.id === 'r1604351' || q.id === 'r11492646').map((q) => q.p), avoid, noTree, parkDensity: 230 });
  K.svc.trees = t.info; K.svc.treeCount = t.count;
  // ---------------------------------------------------------------- photo spots
  const spots = [[0, -40, 0, 0, 30, 'Адмиралтейство из сада', 'the Admiralty from the garden'], [0, -140, 0, 0, 40, 'Фонтан и шпиль', 'the fountain and the spire'], [130, -150, 0, 0, 40, 'Шпиль от Невского', 'the spire from the Nevsky end']];
  for (const [a, b, ta, tb, ty, name, nameEn] of spots) { const [x, z] = W(a, b), [tx, tz] = W(ta, tb); K.svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch: 12, name, nameEn }); void ty; }
  void AB;
}

function rotTowardsSq(x, z) { return Math.atan2(-2300 - x, -520 - z); }

/** a bronze bust on a pedestal (2.4 m granite shaft on a red-pink base), facing rotY; total height h */
function bust(K, M, x, z, rotY, h, who) {
  const P = K.P, base = M.granRust, shaft = M.graniteDark;
  P.push(x, 0, z, rotY);
  P.box(base, -0.9, 0.9, 0, 0.4, -0.9, 0.9, 'b', 1.2);
  P.box(shaft, -0.5, 0.5, 0.4, h - 0.5, -0.5, 0.5, 'b');
  P.box(M.graniteLight, -0.6, 0.6, h - 0.5, h - 0.35, -0.6, 0.6, 'b');
  P.box(K.mats.brass, -0.3, 0.3, 1.2, 1.55, 0.5, 0.52, 'kb');                                // the gilded inscription
  bustOf(who).place(P, figureMats(K.ctx).keys('bronze', 'bronze'), 0, h - 0.35, 0, 0, 1.5);                    // the portrait bust (shared figure kit, statues.js)
  P.pop();
}

/** the jets of the fountain: a 17 m central jet, 8 inner jets inclined to the centre, 40 arc jets along the rim; one shimmering group */
function jets(K, ctx, cx, cz) {
  const parts = new Parts(), mat = ctx.mat.toon('#eef6fb', { transparent: true, opacity: 0.78, emissive: '#bcd8ea', emissiveIntensity: 0.35, name: 'lmH-jet' });
  parts.cyl(mat, [cx, 0.6, cz], [cx, 12.5, cz], 0.5, 0.3, 8, false); parts.cyl(mat, [cx, 12.5, cz], [cx, 17.0, cz], 0.3, 0.06, 6, true);
  for (let i = 0; i < 8; i++) {                                                                  // inner jets: rise 6 m, bend over the centre
    const a = i / 8 * Math.PI * 2, r0 = 4.5, p = (r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    parts.cyl(mat, p(r0, 0.6), p(r0 * 0.7, 5.0), 0.17, 0.12, 5, false); parts.cyl(mat, p(r0 * 0.7, 5.0), p(r0 * 0.38, 6.4), 0.12, 0.08, 5, false); parts.cyl(mat, p(r0 * 0.38, 6.4), p(r0 * 0.05, 4.5), 0.08, 0.05, 5, true);
  }
  for (let i = 0; i < 40; i++) {                                                                 // arcs 3.8 m high from r 12.3 to r 8.6
    const a = i / 40 * Math.PI * 2, p = (r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    parts.cyl(mat, p(12.3, 0.65), p(11.3, 2.6), 0.09, 0.07, 4, false); parts.cyl(mat, p(11.3, 2.6), p(10.3, 3.9), 0.07, 0.07, 4, false); parts.cyl(mat, p(10.3, 3.9), p(9.4, 2.6), 0.07, 0.06, 4, false); parts.cyl(mat, p(9.4, 2.6), p(8.8, 0.65), 0.06, 0.05, 4, true);
  }
  const grp = new THREE.Group(); grp.name = 'lmH-jets';
  const meshes = parts.build(grp, { name: 'lmH-jets', cast: false });
  for (const m of meshes) ctx.noOutline(m);
  ctx.add(grp);
  // Keep the authored broad jet silhouettes and their pulse, with advecting
  // spray and impact ripples supplied by the bounded nearby water system.
  const nozzles = [{ height: 16.38, width: .1, target: [.4, 0, 0] }];
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
    nozzles.push({x:c*4.5,z:s*4.5,height:5.8,width:.06,target:[c*.3,0,s*.3]});
  }
  for (let i=0;i<40;i++) {
    const a=i*Math.PI/20,c=Math.cos(a),s=Math.sin(a);
    nozzles.push({x:c*12.3,y:.03,z:s*12.3,height:3.25,width:.04,target:[c*8.8,0,s*8.8]});
  }
  liveFountain(ctx,{id:'w74168797',x:cx,z:cz,y:.62,r:13,nozzles,drawStreams:false,far:420});
  ctx.onUpdate((dt, t) => {
    grp.scale.y = 0.96 + 0.04 * Math.sin(t * 2.3) + 0.02 * Math.sin(t * 5.1);
    const n = ctx.shared.uNight?.value || 0, sunY = ctx.shared.uSunDir?.value?.y ?? 1;
    const lit = Math.max(0, Math.min(1, Math.max((.22-sunY)/.22*.55,(n-.03)/.55)));
    mat.emissiveIntensity = .35 + lit * 1.25;
  });
}
