// landmarksDekabristov/lutheran.js - the SMOLENSKY LUTHERAN CEMETERY (Смоленское лютеранское кладбище, the old German cemetery, founded 1747; GREEN r7738342, 94 572 m2, 451 x 463 m, Kamskaya st. / Smolenka embankment):
// the grounds of site.js (floor, 18 footways, the 1.8 m picket fence in breakable bays with its gates, the old trees, the grave field) plus the things the data names:
//  * the four mapped tombs: the grave of A. G. Faberge n13002399501 (a dark granite stele in a kerb frame), the grave of G. Bauermeister n13002359701, the Gorvits crypt n13002362201 (a gable-roofed chapel-tomb) and the
//    grave of Josif de Ribas n14155179601 (a granite sarcophagus): the names stay in the monuments service, NEVER on the stone (the Smolensky convention: no invented text);
//  * the Bekman family tomb w1167374971 (OSM: "Могила А. фон Бекмана", Alexander von Bekman 1807 - 1883 and later family burials; the "Gazebo of the German" of the film Brat, n9798534217): the OSM outline is a 4 m2 mapping stub,
//    the open pavilion on four piers (3.2 m) is drawn round its centre and turned to its long axis (generic: no photo);
//  * the plaque to Ya. I. Essen-Stenbock-Fermor n6558720506 beside the south gate (the Smolenka side) (the OSM inscription, word for word, on a granite slab).
// Solid on purpose (structures): the tombs, the crypt, the pavilion, the plaque slab, the graves of the field (granite monuments: no wall, none near water), the tree trunks.  Breakable: the fence (bays), nothing else is furniture here.
import * as THREE from 'three';
import { buildSite } from './site.js';
import { lutheranSite, LUTHERAN_NAMED, GAZEBO } from './sites.js';
import { monumentById, buildingById, gatesInBox } from './data.js';
import { inRing } from './plan.js';
import { plateMat } from './art.js';
import * as MON from './mon.js';
import { hash2 } from './util.js';
import { roadTest } from './surfaces.js';

const wrap = (text, n) => { const out = []; let cur = ''; for (const w of String(text).split(/\s+/)) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const S = lutheranSite(); if (!S) { console.warn('[landmarksDekabristov] lutheran: the GREEN polygon r7738342 is missing'); return; }
  const pl = buildSite(K, S);
  const onRoad = roadTest(ctx);
  const mons = LUTHERAN_NAMED.map(monumentById).filter(Boolean);
  const rotAt = (m) => hash2((m.x * 3) | 0, (m.z * 3) | 0, 61) * 6.283;
  // ---- the mapped tombs
  for (const m of mons) {
    if (m.kind !== 'tomb') continue;
    const rot = rotAt(m);
    if (m.id === 'n13002362201') {                                                                                     // the Gorvits crypt: a gable-roofed chapel-tomb 3.0 x 3.8 m, 3.0 m walls
      P.push(m.x, 0, m.z, rot); MON.crypt(P, M.plaster, M.roofGrey, M.lamp, M.stoneGrey, 3.0, 3.8, 3.0, 1.5); G_cross(P, M, 0, 0.35 + 3.0 + 1.5, -1.8); P.pop();
      ph.addBox(m.x, m.z, 3.5, 4.3, rot, 0, 5.2);
    } else if (m.id === 'n14155179601') {                                                                              // de Ribas: a granite sarcophagus on a plinth inside a kerb
      P.push(m.x, 0, m.z, rot); MON.kerbBed(P, M.kerb, M.soil, 2.6, 3.6); MON.sarcophagus(P, M.graniteGrey, M.graniteDark, 1.2, 2.2, 0.8); P.pop();
      ph.addBox(m.x, m.z, 1.8, 2.8, rot, 0, 1.3);
    } else if (m.id === 'n13002399501') {                                                                              // Faberge: a dark granite stele (2.1 m) with a kerb frame and a slab
      P.push(m.x, 0, m.z, rot); MON.kerbBed(P, M.kerb, M.soil, 2.4, 3.4); P.box(M.graniteDark, -0.55, 0.55, 0.14, 0.2, -1.1, 0.7, 'b', 2); MON.stele(P, M.graniteDark, { w: 1.0, t: 0.28, h: 1.9, plinth: 0.35, top: 'peak' }); P.pop();
      ph.addBox(m.x, m.z, 1.5, 0.7, rot, 0, 2.5);
    } else {                                                                                                           // Bauermeister: a grey granite stele with a bed
      P.push(m.x, 0, m.z, rot); MON.kerbBed(P, M.kerb, M.soil, 2.2, 3.2); MON.stele(P, M.graniteGrey, { w: 0.9, t: 0.26, h: 1.7, plinth: 0.3, top: 'peak' }); P.pop();
      ph.addBox(m.x, m.z, 1.4, 0.7, rot, 0, 2.3);
    }
    K.svc.monuments.push({ id: m.id, name: m.name || 'Могила', x: m.x, z: m.z, h: 2.5 });
  }
  // ---- the Bekman family tomb: the pavilion round the centre of the outline, turned to its long axis
  const b = buildingById(GAZEBO.id);
  if (b && b.polys && b.polys[0]) {
    const o = b.polys[0].o, cx = b.cx ?? GAZEBO.x, cz = b.cz ?? GAZEBO.z;
    let rot = 0, best = 0; for (let i = 0; i < o.length; i += 2) { const j = (i + 2) % o.length, dx = o[j] - o[i], dz = o[j + 1] - o[i + 1], l = Math.hypot(dx, dz); if (l > best) { best = l; rot = Math.atan2(dx, dz); } }
    P.push(cx, 0, cz, rot); MON.pavilion(P, M, 3.2, 2.6); P.pop();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = Math.cos(rot), s = Math.sin(rot), lx = sx * 1.45, lz = sz * 1.45; ph.addBox(cx + lx * c + lz * s, cz - lx * s + lz * c, 0.5, 0.5, rot, 0, 3.0); }
    ph.addBox(cx, cz, 1.7, 2.3, rot, 0, 1.1);                                                                      // the sarcophagus inside
    K.svc.monuments.push({ id: GAZEBO.id, name: b.name || 'Могила А. фон Бекмана', x: cx, z: cz, h: 5.8 });
    K.svc.photoSpots.push({ x: cx + Math.sin(rot) * 7, z: cz + Math.cos(rot) * 7, yaw: rot * 180 / Math.PI, name: 'Беседка на Лютеранском кладбище · Pavilion tomb' });
  }
  // ---- the plaque to Essen-Stenbock-Fermor by the south gate (the Smolenka side) (the OSM inscription)
  // the OSM point lies on the gap of the gate (the gate node is 1 m away): the slab stands beside the gap, on the nearest free spot inside the fence, turned to the gate
  const pq = monumentById('n6558720506');
  if (pq) {
    const gates = gatesInBox(pq.x - 12, pq.x + 12, pq.z - 12, pq.z + 12);
    let best = null;
    for (let r = 1.6; r <= 5.2 && !best; r += 0.4) for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, x = pq.x + Math.cos(a) * r, z = pq.z + Math.sin(a) * r;
      if (!inRing(S.ring, x, z) || onRoad(x, z, 0.5) || gates.some((g) => Math.hypot(g.x - x, g.z - z) < 2.1) || pl.grid.gap(x, z) < 1.2 || (ctx.physics.waterLevel && ctx.physics.waterLevel(x, z) !== null)) continue;
      best = { x, z, rot: Math.atan2(pq.x - x, pq.z - z) }; break;
    }
    if (best) {
      const lines = wrap(pq.inscription || '', 26), pm = plateMat(ctx, lines.slice(0, 7), { ratio: 1.15, key: 'essen' });
      M.decals.add(pm);
      P.push(best.x, 0, best.z, best.rot); MON.stele(P, M.graniteGrey, { w: 1.1, t: 0.25, h: 1.7, plinth: 0.2, plateMat: pm, plateW: 0.92, plateH: 0.8, plateY: 0.6 }); P.pop();
      ph.addBox(best.x, best.z, 1.4, 0.55, best.rot, 0, 1.9);
      K.svc.monuments.push({ id: pq.id, name: pq.name || 'Памятная доска', x: best.x, z: best.z, h: 1.9 });
    }
  }
  // ---- the crowd of the cemetery is calm (HOOKS.inGarden): a few pilgrims at the best-known graves
  for (const m of mons) if (m.id === 'n13002399501' || m.id === 'n13002362201') K.svc.crowd.push({ id: m.id, kind: 'photo', x: m.x, z: m.z, r: 8, n: 2 });
  void THREE;
  return pl;
}
// a small iron cross on a gable (Orthodox crosses stand on Orthodox buildings: a plain Latin one for the Lutheran crypt)
function G_cross(P, M, x, y, z) { P.box(M.crossIron, x - 0.03, x + 0.03, y, y + 0.7, z - 0.03, z + 0.03, 'b'); P.box(M.crossIron, x - 0.2, x + 0.2, y + 0.4, y + 0.46, z - 0.03, z + 0.03, ''); }
