// landmarksYusupov/pavilion.js - the garden pavilion on ulitsa Dekabristova (OSM w70732356 "94 литБ", 243 m2; docs/research/yusupov.md section 7, photos refs/yusupov 39 47 48 50): one storey,
// ochre-yellow (#e3b04a) with white pilasters between six round-arched openings (2.1 m, iron grilles, a gilded monogram disc in every tympanum), a white entablature and a balustrade on the flat roof;
// the garden side (a rounded apse) has plain small windows.  Plus the street fences of the claimed OSM ways: the spear fence beside the pavilion (w108813835, w123246600), the low ring railing in front
// of it (w1287391381) and the small gate-house w123243368.  The pavilion front faces the street (SE), the garden is behind (NW).
import { BUILDINGS, BARRIERS } from '../data/city.js';
import { buildHouse } from './house.js';
import { spearFence, kerbRail } from './fences.js';

const HC = 6.8;

function pavilionFront(K, M) {
  return (e, c) => {
    if (e.hole || e.len < 20) return false;
    const P = K.P, len = c.len, n = 6, pitch = (len - 1.2) / n;
    K.wallQuad(M.pav, 0, len, 0, HC + 0.45, 3);
    // pilasters at the bay boundaries (first and last double), white
    for (let i = 0; i <= n; i++) K.pilaster(M.trim, 0.6 + pitch * i, 0.62, 0.6, HC - 1.0, 0.16, 0.38);
    for (let i = 0; i < n; i++) {
      const x = 0.6 + pitch * (i + 0.5);
      K.window({ x, y: 0.9, w: 2.1, h: 4.1, head: 'arch', sw: 0.24, d: 0.12, surMat: M.trim, sill: false, frame: 'brown', v: 1 });
      for (let k = -4; k <= 4; k++) P.box(M.iron, x + k * 0.23 - 0.012, x + k * 0.23 + 0.012, 0.9, 3.7, 0.2, 0.23, 'kb');       // the grille: vertical bars
      P.box(M.iron, x - 1.05, x + 1.05, 2.0, 2.05, 0.2, 0.24, 'kb'); P.box(M.iron, x - 1.05, x + 1.05, 3.65, 3.7, 0.2, 0.24, 'kb');
      P.cyl(M.gold, [x, 5.95, 0.05], [x, 5.95, 0.1], 0.3, 0.3, 12, true);                                                       // monogram disc
    }
    P.box(M.trim, 0, len, HC - 1.0, HC - 0.3, 0, 0.3, 'kb');
    P.box(M.trim, -0.05, len + 0.05, HC - 0.3, HC + 0.05, 0, 0.5, 'b');
    K.balustrade(0.3, len - 0.3, HC + 0.45, 0.95, 0.3, M.trim);
    for (const x of [0.3, len - 0.3, len / 2]) P.box(M.trim, x - 0.3, x + 0.3, HC + 0.45, HC + 1.5, 0.0, 0.5, 'b');
    return true;
  };
}

export function build(K, ctx) {
  const M = K.M;
  const rec = BUILDINGS.find((b) => b.id === 'w70732356');
  buildHouse(K, { name: 'pavilion', recs: [rec], hc: HC, wall: M.C.pavilion, court: M.C.pavilion, plinth: 0.6, plinthMat: M.granite, floors: [6.2], courtPitch: 3.6, cornice: 'none', roofMat: M.roofDark, railing: false, collideH: 9, front: pavilionFront(K, M) });
  const gh = BUILDINGS.find((b) => b.id === 'w123243368');
  if (gh) buildHouse(K, { name: 'gatehouse', recs: [gh], hc: 4.6, wall: M.C.wall, court: M.C.wall, plinth: 0.5, plinthMat: M.granite, floors: [4.2], courtPitch: 3.4, roofMat: M.roofDark, railing: false, collideH: 6 });
  const bar = (id) => { const w = BARRIERS.find((b) => b.id === id); return w ? [[w.pts[0], w.pts[1]], [w.pts[w.pts.length - 2], w.pts[w.pts.length - 1]]] : null; };
  const f1 = bar('w108813835'), f2 = bar('w1287391381'), f3 = bar('w123246600');
  if (f1) spearFence(K, f1[0], f1[1], { h: 1.85, plinth: 0.45 });
  if (f3) spearFence(K, f3[0], f3[1], { h: 1.85, plinth: 0.45 });
  if (f2) kerbRail(K, f2[0], f2[1], { h: 0.95, collide: false });
  K.svc.fences.push(...[['w108813835', f1], ['w1287391381', f2], ['w123246600', f3]].filter((q) => q[1]).map((q) => ({ id: q[0], pts: q[1] })));
  K.svc.photoSpots.push({ x: -2874, z: 565, yaw: 20, name: 'Садовый павильон на улице Декабристов' });
  void ctx;
}
