// landmarksKirova/sobchak.js - the MONUMENT TO ANATOLY SOBCHAK (first mayor of Saint Petersburg) in the skver of Bolshoy pr. at the 26-27 line (I. Korneev, V. Bukhaev, 2006; OSM node n793463299 at K (26.4, -258.7);
// docs/research/kirova.md 9, photo sm01): a waist-length BRONZE portrait 1.7 m in the gown of an honorary doctor, speaking from a tribune, on a 2.47 m pedestal of polished dark red-brown granite.
//   paving     a 6 x 6 m platform of red-pink clinker pavers with two 0.4 m light granite stripes running to the base; a dark granite plate 2.0 x 2.0 x 0.15 under the pedestal
//   pedestal   P1 lower block 1.15 x 1.0 x 1.3 with the bronze coat of arms and seven lines (АНАТОЛИЮ / АЛЕКСАНДРОВИЧУ / СОБЧАКУ / (1937-2000) / ВОЗВРАТИВШЕМУ / ИМЯ / ГОРОДУ), P2 a flared cap 0.35 m
//              with a slab, P3 upper block 0.95 x 0.8 x 0.55 with ПЕРВОМУ / МЭРУ / САНКТ-ПЕТЕРБУРГА (cut-out paintings of art.js 2 cm in front of the stone)
//   bronze     a base block 0.5 m + a lip, the half figure (figure.js, scale 1.9) with the right hand on the lectern and the left arm stretched forward; faces SSE (-q) toward the carriageway [?]
// Frame: FK pushed (x = r, z = -q) and the node as origin: the monument faces local +z.
import { FK } from './frame.js';
import { sobchakFig } from './figure.js';
import { figureMats } from '../lib/figures.js';
import { ribbon } from './surfaces.js';

const NODE = [26.4, -258.7];

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  FK.push(P);
  P.push(NODE[0], 0, -NODE[1], 0);
  // paving 6 x 6 (decal), stripes, dark plate
  P.cap(M.sobPaver, [[-3, -3], [3, -3], [3, 3], [-3, 3]], 0.05, true, 2);
  for (const x of [-1.25, 1.25]) P.quad(M.sobStripe, [x - 0.2, 0.06, 0.9], [x + 0.2, 0.06, 0.9], [x + 0.2, 0.06, 3], [x - 0.2, 0.06, 3], [0, 1, 0], [[0, 0], [1, 0], [1, 4], [0, 4]]);
  P.box(M.sobPlate, -1, 1, 0, 0.15, -1, 1, 'b', 1);
  // pedestal: P1 (with the front painting), P2 flared cap + slab, P3 (with the upper painting)
  P.box(M.sobGranite, -0.575, 0.575, 0.15, 1.45, -0.5, 0.5, 'b', 1);
  P.quad(M.sobFront, [-0.575, 0.2, 0.503], [0.575, 0.2, 0.503], [0.575, 1.42, 0.503], [-0.575, 1.42, 0.503], [0, 0, 1]);
  { const y0 = 1.45, y1 = 1.8, a = [0.575, 0.5], b = [0.775, 0.65];                                         // the flared cap: a frustum from 1.15 x 1.0 to 1.55 x 1.3
    const A = [[-a[0], y0, -a[1]], [a[0], y0, -a[1]], [a[0], y0, a[1]], [-a[0], y0, a[1]]], B = [[-b[0], y1, -b[1]], [b[0], y1, -b[1]], [b[0], y1, b[1]], [-b[0], y1, b[1]]];
    P.quad(M.sobGranite, A[3], A[2], B[2], B[3], [0, 0.4, 1]); P.quad(M.sobGranite, A[1], A[0], B[0], B[1], [0, 0.4, -1]); P.quad(M.sobGranite, A[0], A[3], B[3], B[0], [-1, 0.4, 0]); P.quad(M.sobGranite, A[2], A[1], B[1], B[2], [1, 0.4, 0]); }
  P.box(M.sobGranite, -0.8, 0.8, 1.8, 1.92, -0.65, 0.65, 'b', 1);
  P.box(M.sobGranite, -0.475, 0.475, 1.92, 2.47, -0.4, 0.4, 'b', 1);
  P.quad(M.sobUpper, [-0.475, 1.95, 0.403], [0.475, 1.95, 0.403], [0.475, 2.44, 0.403], [-0.475, 2.44, 0.403], [0, 0, 1]);
  // bronze: the base block under the half figure (a flat lectern), the half figure at 1.9 x the kit's man (an oversize waist portrait, the head 0.46 m crown to chin as in sm01), 1.86 m in all
  const fm = figureMats(ctx).keys('bronze', 'bronze');
  P.box(M.sobBronze, -0.45, 0.45, 2.47, 2.75, -0.25, 0.25, 'b', 1);
  P.box(M.sobBronze, -0.48, 0.48, 2.75, 2.79, -0.28, 0.28, 'b', 1);
  sobchakFig().place(P, fm, 0, 0.92, -0.06, 0, 1.9);
  P.pop(); P.pop();
  // colliders: the pedestal is solid; the paving is a flat decal
  { const p = FK.W(NODE[0], NODE[1]); ph.addBox(p.x, p.z, 1.3, 1.1, FK.rot, 0, 4.5); }
  const m = FK.W(NODE[0], NODE[1]);
  K.svc.monuments.push({ id: 'n793463299', name: 'Памятник А. А. Собчаку', x: m.x, z: m.z, h: 4.4, r: 3 });
  const s = FK.W(26, -250);
  K.svc.photoSpots.push({ x: s.x, z: s.z, yaw: 0, pitch: 6, name: 'Памятник А. А. Собчаку', look: [m.x, m.z] });
  K.svc.crowd.push({ id: 'sobchak', kind: 'photo', x: s.x, z: s.z, r: 5, n: 3 });
  void ribbon;
}
