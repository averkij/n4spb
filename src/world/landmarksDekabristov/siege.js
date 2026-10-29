// landmarksDekabristov/siege.js - the MEMORIAL CEMETERY "ОСТРОВ ДЕКАБРИСТОВ" of the siege of Leningrad (GREEN w23426250, 48 723 m2, 419 x 297 m; the same OSM way is its closed fence, 1 095 m): the grounds of site.js (mown
// lawn floor, five walkways, a sparse planting of lime / birch / maple, the plain picket railing 1.3 m in breakable bays with its two gates) and the things the data names:
//  * the OBELISK "Героическим защитникам Ленинграда 1941-1943 гг." n3188963779 (-5788.5, -1709.5): a tapered granite obelisk on a three-step plinth in a paved apron (R 11 m, PAVED_RINGS), wreaths at its foot;
//  * the memorial to the crew of the submarine Shch-323 n1861951657: a granite plinth with a conning-tower fin and a periscope (generic: no photo);  * the memorial "ЧАЭС" n3188961906: a granite stele;
//  * the eight MASS GRAVES (братские могилы: n11510705243 .. 49 and n3188961950): each a kerbed lawn mound with a granite stele and a few bunches of flowers; the names stay in the monuments service, never on the stone.
// The single grave n11554194879 (a private person who died in 2024) is neither claimed nor drawn.  Heights of the obelisk (~17.9 m) and the fin are generic (OWNER CHECK, docs/gdm-D1.md).
// Solid on purpose (structures): the obelisk and its plinth, the memorials, the steles, the trunks.  Breakable: the railing (bays).  A crowd of mourners stays calm (HOOKS.inGarden = cemetery.js).
import { buildSite } from './site.js';
import { siegeSite, SIEGE } from './sites.js';
import { monumentById } from './data.js';
import * as MON from './mon.js';
import * as G from './geo.js';
import { hash2 } from './util.js';
import { fillPolyFine } from './surfaces.js';

/** the foot point of the nearest alley of the plan: { px, pz, gap } or null */
function nearestPath(pl, x, z) {
  let best = null;
  for (const s of pl.grid.segs) { const a = s[0], b = s[1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (!best || d < best.d) best = { d, px: qx, pz: qz }; }
  return best;
}

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const S = siegeSite(); if (!S) { console.warn('[landmarksDekabristov] siege: the GREEN polygon w23426250 is missing'); return; }
  const pl = buildSite(K, S);
  const face = (m) => { const q = nearestPath(pl, m.x, m.z); return q && q.d > 0.5 ? Math.atan2(q.px - m.x, q.pz - m.z) : 0; };
  // ---- the obelisk on its apron
  const ob = monumentById(SIEGE.obelisk);
  if (ob) {
    const rot = face(ob), ring = Array.from({ length: 24 }, (_, i) => [ob.x + Math.cos(i * Math.PI / 12) * 11, ob.z + Math.sin(i * Math.PI / 12) * 11]);
    fillPolyFine(P, M.pavers, ring, 0.036, { maxEdge: 4, tile: 2 });
    P.push(ob.x, 0, ob.z, rot);
    const y = MON.steps(P, M.graniteGrey, 9.0, 9.0, 3, 0.18, 0.8);                                                  // three steps 9 .. 7.4 m
    P.box(M.graniteGrey, -1.8, 1.8, y, 2.9, -1.8, 1.8, 'b', 2);                                                     // the pedestal 3.6 m square
    P.box(M.graniteDark, -2.0, 2.0, 2.9, 3.2, -2.0, 2.0, 'b', 2);                                                   // the cornice
    P.quad(M.bronzeGreen, [-1.0, 1.1, 1.82], [1.0, 1.1, 1.82], [1.0, 2.2, 1.82], [-1.0, 2.2, 1.82], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // a blank bronze plate (no text)
    MON.obelisk(P, M.graniteGrey, M.graniteDark, 3.2, 16.5, 2.6, 1.3, 1.4);
    MON.bunches(P, M, -3.2, 3.95, 0.8, 0, 9, 0.54, 3);
    P.pop();
    ph.addBox(ob.x, ob.z, 7.0, 7.0, rot, 0, 0.6); ph.addBox(ob.x, ob.z, 3.9, 3.9, rot, 0, 18);
    K.svc.monuments.push({ id: ob.id, name: ob.name, x: ob.x, z: ob.z, h: 17.9 });
    K.svc.photoSpots.push({ x: ob.x + Math.sin(rot) * 14, z: ob.z + Math.cos(rot) * 14, yaw: rot * 180 / Math.PI, name: 'Мемориальное кладбище «Остров Декабристов» · siege memorial cemetery' });
    K.svc.crowd.push({ id: 'siege-obelisk', kind: 'photo', x: ob.x + Math.sin(rot) * 7, z: ob.z + Math.cos(rot) * 7, r: 8, n: 3 });
  }
  // ---- the Shch-323 memorial: a granite plinth with a conning-tower fin, a periscope and a rope-ring
  const sub = monumentById(SIEGE.sub);
  if (sub) {
    const rot = face(sub);
    P.push(sub.x, 0, sub.z, rot);
    P.box(M.graniteGrey, -2.6, 2.6, 0, 0.45, -1.4, 1.4, 'b', 2);
    P.box(M.graniteDark, -2.2, 2.2, 0.45, 0.85, -1.0, 1.0, 'b', 2);
    G.frustum(P, M.graniteDark, 0, 0, 0.85, 3.4, 8, 1.15, 0.62, Math.PI / 8, 1, 2, { capTop: M.graniteDark });         // the fin: a tapered octagonal tower
    P.box(M.graniteDark, -0.5, 0.5, 3.4, 3.6, -0.5, 0.5, 'b', 1);
    P.col(M.bronze, 0.2, 0.1, 3.6, 4.7, 0.05, 0.05, 6, true); P.box(M.bronze, 0.1, 0.45, 4.5, 4.7, 0.0, 0.2, '');       // the periscope
    MON.bunches(P, M, -1.6, 1.25, 0.8, 0, 5, 0.45, 5);
    P.pop();
    ph.addBox(sub.x, sub.z, 5.4, 3.0, rot, 0, 4.8);
    K.svc.monuments.push({ id: sub.id, name: sub.name, x: sub.x, z: sub.z, h: 4.7 });
  }
  // ---- the "ЧАЭС" memorial: a granite stele on a base (no text)
  const ch = monumentById(SIEGE.chaes);
  if (ch) {
    const rot = face(ch);
    P.push(ch.x, 0, ch.z, rot); MON.steps(P, M.graniteGrey, 4.0, 3.0, 2, 0.16, 0.4); P.push(0, 0.32, 0, 0); MON.stele(P, M.graniteDark, { w: 1.1, t: 0.3, h: 2.2, plinth: 0.2, top: 'flat' }); P.pop(); MON.bunches(P, M, -0.8, 1.0, 0.4, 0, 5, 0.32, 9); P.pop();
    ph.addBox(ch.x, ch.z, 1.5, 0.8, rot, 0, 2.9);
    K.svc.monuments.push({ id: ch.id, name: ch.name || 'ЧАЭС', x: ch.x, z: ch.z, h: 2.8 });
  }
  // ---- the mass graves: a kerbed lawn mound with a granite stele at its head and a few bunches of flowers
  for (const id of SIEGE.graves) {
    const m = monumentById(id); if (!m) continue;
    const rot = face(m), L = 3.0, W = 1.8;
    P.push(m.x, 0, m.z, rot);
    MON.kerbBed(P, M.kerb, M.lawn, W, L, 0.14, 0.1);
    P.push(0, 0, -L / 2 - 0.35, 0); MON.stele(P, M.graniteGrey, { w: 0.9, t: 0.2, h: 1.0, plinth: 0.18, top: 'flat' }); P.pop();
    for (let i = 0; i < 3; i++) MON.bunch(P, M, -0.5 + i * 0.5, 0.14, -L / 2 + 0.5 + hash2(i, (m.x * 7) | 0, 5) * 0.5, i + (m.x | 0));
    P.pop();
    const c = Math.cos(rot), s = Math.sin(rot);
    ph.addBox(m.x - s * (L / 2 + 0.35), m.z - c * (L / 2 + 0.35), 1.2, 0.5, rot, 0, 1.3);
    K.svc.monuments.push({ id: m.id, name: m.name || 'Братская могила', x: m.x, z: m.z, h: 1.3 });
  }
  return pl;
}
