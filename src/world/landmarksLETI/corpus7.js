// landmarksLETI/corpus7.js - CORPUS 7, the dark-red-brick "archive" building of LETI (1890s, OSM w28370226: a CROSS-shaped plan of 12 edges of ~12.5 m, 4 levels = a 2.4 m semi-basement + three 3.6 m storeys, 13.2 m).
//   Photos 04 (the arm end with the plate "КОРПУС 7", from the north-west) and 61 (the corner of two arms, the hipped roof in the middle, the downpipes): dark red brick with lighter courses, narrow windows in pairs with white
//   sloped sills and brick lintels, a dentil frieze under every storey line, a corbelled cornice, stepped corner buttresses with white caps, at each arm end a central projecting tower rising in three steps above the
//   eaves (the stepped gable of photo 04), the hip roof of rust-red sheet metal.  The plate reserves its rectangle through the labels registry.
import { ringOf, IDS } from './frame.js';
import { ringEdges, polyOf, onEdge } from './kit.js';
import { tiledWall, belt } from './brick.js';
import { hipRoof } from './roof.js';
import { offsetRing } from './ring.js';
import { addPolyColliders } from '../lib/massing.js';
import { stage, arch } from './shell.js';
import { pane } from './facade.js';
import { archRing } from './c1common.js';
import { plaqueUV } from './art.js';
import { makeLabels } from '../streets/labels.js';

export const C7 = { base: 2.4, storey: 3.6, h: 13.2, tower: 17.0 };

export function build(K) {
  const ctx = K.ctx, P = K.P, D = K.D, M = K.M;
  const ring = ringOf(IDS.c7);
  if (!ring) throw new Error('w28370226 missing');
  const edges = ringEdges(polyOf(ring, []));
  K.shared.c7 = { ring, edges };
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length, cz = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  // arm ends: the 4 edges whose neighbours both turn the same way (convex both ends) and whose length is the arm width (12.5 +- 1)
  const isEnd = (e) => { const i = edges.indexOf(e), p = edges[(i + edges.length - 1) % edges.length], q = edges[(i + 1) % edges.length]; const cr = (a, b) => a.n[0] * b.n[1] - a.n[1] * b.n[0]; return cr(p, e) * cr(e, q) > 0 && Math.abs(cr(p, e)) > 0.9 && Math.abs(cr(e, q)) > 0.9; };
  stage(K, 'walls', () => {
    for (const e of edges) onEdge(P, e, (L) => {
      tiledWall(P, M.c7base, 0, L, 0, C7.base, 0, 3.6, C7.base);
      for (let k = 0; k < 3; k++) { const y0 = C7.base + k * C7.storey; P.quad(M.c7, [0, y0, 0], [L, y0, 0], [L, y0 + C7.storey, 0], [0, y0 + C7.storey, 0], [0, 0, 1], [[0, 0], [L / 3.6, 0], [L / 3.6, 1], [0, 1]]); }
      belt(P, M.stucco, 0, L, C7.base - 0.12, C7.base + 0.12, 0.14, 2.4);                              // the plinth string course (white stone)
      belt(P, M.brick7, 0, L, C7.h - 0.05, C7.h + 0.38, 0.28, 2.4);                                      // the corbelled cornice
      belt(P, M.dark, 0, L, C7.h + 0.38, C7.h + 0.5, 0.34, 2.4);                                         // the dark gutter
    });
  });
  const ends = edges.filter((e) => e.len > 11 && e.len < 14 && isEnd(e));
  K.shared.c7.ends = ends;
  stage(K, 'buttresses', () => {                                                                         // stepped corner buttresses wrapping both corners of every arm end
    for (const e of ends) onEdge(D, e, (L) => {
      for (const [x, s] of [[0.2, -1], [L - 0.2, 1]]) {
        D.box(M.brick7, x - 0.8, x + 0.8, 0, 6.8, 0, 0.55, 'kb', 2.4);
        D.box(M.stucco, x - 0.88, x + 0.88, 6.8, 7.05, 0, 0.6, 'kb', 1);                                    // the white cap of the lower step
        D.box(M.brick7, x - 0.6, x + 0.6, 7.05, 13.7, 0, 0.4, 'kb', 2.4);
        D.box(M.stucco, x - 0.68, x + 0.68, 13.7, 13.95, 0, 0.46, 'kb', 1);
        void s;
      }
    });
  });
  stage(K, 'towers', () => {                                                                            // the central stepped towers at the arm ends (photo 04): windows on the faces, three steps above the eaves
    for (const e of ends) onEdge(P, e, (L) => {
      const xm = L / 2, TW = 4.0, z = 1.0;
      // the face of the tower carries the same storey tiles (two windows per storey, symmetric about its axis)
      P.quad(M.c7base, [xm - TW / 2, 0, z], [xm + TW / 2, 0, z], [xm + TW / 2, C7.base, z], [xm - TW / 2, C7.base, z], [0, 0, 1], [[(1.8 - TW / 2) / 3.6, 0], [(1.8 + TW / 2) / 3.6, 0], [(1.8 + TW / 2) / 3.6, 1], [(1.8 - TW / 2) / 3.6, 1]]);
      for (let k = 0; k < 2; k++) { const y0 = C7.base + k * C7.storey; P.quad(M.c7, [xm - TW / 2, y0, z], [xm + TW / 2, y0, z], [xm + TW / 2, y0 + C7.storey, z], [xm - TW / 2, y0 + C7.storey, z], [0, 0, 1], [[(1.8 - TW / 2) / 3.6, 0], [(1.8 + TW / 2) / 3.6, 0], [(1.8 + TW / 2) / 3.6, 1], [(1.8 - TW / 2) / 3.6, 1]]); }
      {                                                                                                  // the top storey of the tower: plain brick with the big round-headed window (photos 04 / leti/15) in a brick archivolt and a dentil frieze under the eaves
        const y0 = C7.base + 2 * C7.storey, y1 = y0 + C7.storey, wA = arch(xm, y0 + 0.55, 1.9, 2.6, 'winA');
        P.quad(M.brick7, [xm - TW / 2, y0, z], [xm + TW / 2, y0, z], [xm + TW / 2, y1, z], [xm - TW / 2, y1, z], [0, 0, 1], [[(xm - TW / 2) / 2.4, y0 / 2.4], [(xm + TW / 2) / 2.4, y0 / 2.4], [(xm + TW / 2) / 2.4, y1 / 2.4], [(xm - TW / 2) / 2.4, y1 / 2.4]]);
        pane(P, M.winA, wA, 0.02 - z);
        onEdge(D, e, () => {
          archRing(D, M.brick7, wA.cx, wA.y0, wA.w, wA.h, 0.22, z + 0.1, 10);
          D.box(M.stucco, xm - 1.2, xm + 1.2, wA.y0 - 0.12, wA.y0 - 0.02, z, z + 0.16, 'kb');                 // the sill
        });
        P.quad(M.c7, [xm - TW / 2, y1 - 0.42, z + 0.01], [xm + TW / 2, y1 - 0.42, z + 0.01], [xm + TW / 2, y1, z + 0.01], [xm - TW / 2, y1, z + 0.01], [0, 0, 1], [[0, 0.88], [TW / 3.6, 0.88], [TW / 3.6, 1], [0, 1]]);
      }
      // the sides of the tower (plain brick), the cap of the first block
      P.box(M.brick7, xm - TW / 2, xm + TW / 2, 0, C7.h + 0.5, 0, z, 'fb', 2.4);
      // the upper two steps above the eaves
      P.box(M.brick7, xm - 1.7, xm + 1.7, C7.h + 0.5, C7.h + 2.4, 0, z - 0.1, 'b', 2.4);
      P.quad(M.winB, [xm - 0.75, C7.h + 0.7, z - 0.095], [xm + 0.75, C7.h + 0.7, z - 0.095], [xm + 0.75, C7.h + 2.2, z - 0.095], [xm - 0.75, C7.h + 2.2, z - 0.095], [0, 0, 1], [[0, 0.1], [1, 0.1], [1, 1], [0, 1]]);
      P.box(M.stucco, xm - 1.82, xm + 1.82, C7.h + 2.4, C7.h + 2.6, 0, z, 'b', 1);
      P.box(M.stucco, xm - TW / 2 - 0.1, xm + TW / 2 + 0.1, C7.h + 0.5, C7.h + 0.62, 0, z + 0.1, 'b', 1);
      P.box(M.stucco, xm - 0.7, xm + 0.7, C7.h + 2.6, C7.h + 3.5, 0.0, z - 0.2, 'b', 1);                     // the small top block
    });
  });
  stage(K, 'plate', () => {                                                                              // the plate "КОРПУС 7" at the north-west arm end (photo 04), 2.3 m up beside the ground-floor door
    const e = (K.shared.c7.ends || []).find((q) => Math.abs(Math.atan2(q.n[0], -q.n[1]) * 180 / Math.PI + 360) % 360 > 310 && Math.abs(Math.atan2(q.n[0], -q.n[1]) * 180 / Math.PI + 360) % 360 < 350) || (K.shared.c7.ends || [])[0];
    if (!e) return;
    const lab = ctx.services.labels || (ctx.services.labels = makeLabels());
    onEdge(P, e, (L, f) => {
      const x = L / 2 - 3.7, w = f.xa;
      const wx = f.x + w[0] * x, wz = f.z + w[1] * x;
      if (lab.reserve('lmleti-c7plate', wx + e.n[0] * 0.03, 3.6, wz + e.n[1] * 0.03, 0.55, 0.55, e.n[0], e.n[1], 'plate')) P.quad(M.plaques, [x - 0.28, 3.32, 0.04], [x + 0.28, 3.32, 0.04], [x + 0.28, 3.88, 0.04], [x - 0.28, 3.88, 0.04], [0, 0, 1], plaqueUV(4));
      // the door of the arm end: a plain dark door in a stone surround at the middle (shut)
      P.box(M.stucco, L / 2 - 0.9, L / 2 + 0.9, 2.2, 2.5, 0, 0.3, 'k', 1);
    });
  });
  stage(K, 'roof', () => {
    const off = offsetRing(ring, 0.55);
    hipRoof(P, M.roof7, off, [], C7.h + 0.45, { slope: 0.62, R: 5.2, cell: 2.4, uvs: 1.2 });
  });
  stage(K, 'colliders', () => { addPolyColliders(ctx, polyOf(ring, []), 0, 18); });
  K.svc.monuments.push({ id: 'w28370226', name: 'ЛЭТИ, корпус 7 (кирпичное здание 1890-х)', x: cx, z: cz, h: 14 });
  if (K.errs) throw new Error(K.errs.join('\n'));
}
