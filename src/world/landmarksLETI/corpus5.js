// landmarksLETI/corpus5.js - CORPUS 5, the red-brick teaching complex of LETI (1970s-80s), from its three baked rings: the low auditorium hall r11983462 (the entrance front with the stair), the tall laboratory wing r11983463
//   and the tall auditorium wing r11983464 (comb-shaped, with the north tower in front of which the Vologdin bust stands, photo 62).  Photos 60 (entrance, stair, round brick towers), 62 (north tower), 64 (round pylon, gate booth),
//   B8 (the court with the ribbon wings and the war memorial).  Heights [E]: the OSM levels say 5 x 3.3 = 16.5 m for the wings; the hall carries the entrance box (8.4 m).
//   Walls: storey-tiled brick quads (tile 3.6 x 3.3 m) with ribbon windows (c5A, edges >= 24 m) or punched window pairs (c5B); grey concrete belts at every floor line, brick pylons at the corners and every ~15 m, a brick parapet with a
//   concrete coping, a flat bitumen roof.  Party walls between the three blocks are cut away (brick.js partyRuns).  The entrance (stair, box, sign) is entrance5.js.
import { ringOf, IDS } from './frame.js';
import { ringEdges, polyOf, onEdge, frameOf } from './kit.js';
import { partyRuns, wallPieces, tiledWall, belt, pylon, roundTowerBrick } from './brick.js';
import { addPolyColliders } from '../lib/massing.js';
import { stage } from './shell.js';

export const C5 = { hall: 8.4, wing: 16.5, storey: 3.3, parapet: 0.9 };
const BLOCKS = [
  { key: 'hall', id: IDS.c5aud, h: C5.hall },
  { key: 'lab', id: IDS.c5lab, h: C5.wing },
  { key: 'aud', id: IDS.c5aud2, h: C5.wing },
];

/**
 * the NORTH TOWER of the tall auditorium wing (photos 62 / leti/14, the Vologdin bust stands in front of it): the 16 x 12.5 m block made of edges 11 / 12 / 13 of r11983464 rises to ~23 m, its faces carry heavy brick
 * pilasters with slot windows (tile c5T), a flat roof with a brick parapet; the open south side above the wing eaves is plain brick.
 */
export const TOWER = { edges: [11, 12, 13], h: 23.4 };
function towerWalls(K, B, e) {
  const P = K.P, D = K.D, M = K.M, H = TOWER.h;
  onEdge(P, e, (L) => {
    tiledWall(P, M.c5T, 0, L, 0, H, 0, 4.0, C5.storey);
    tiledWall(P, M.brick5, 0, L, H, H + C5.parapet, 0, 2.4, 1.2);
    belt(P, M.conc, 0, L, H + C5.parapet, H + C5.parapet + 0.14, 0.14, 2.4);
    onEdge(D, e, () => {
      for (const y of [C5.storey * 5]) belt(D, M.conc, 0, L, y - 0.17, y + 0.17, 0.13, 2.4);                   // the floor belt where the wing eaves meet the tower
      for (const x of [0.5, L - 0.5]) pylon(D, M.brick5, M.conc, x, 1.0, 0, H + C5.parapet + 0.3, 0.45, 2.4);      // the corner pylons run above the parapet
    });
  });
}
/** the south face of the tower above the wing roof (the one side that is not an outer edge), its roof cap and its collider */
function towerTop(K, B) {
  const P = K.P, M = K.M, H = TOWER.h, ring = B.ring, v = (i) => ring[i];
  const quad = [v(11), v(12), v(13), v(14)];
  P.cap(M.roofc, quad, H, true, 6, []);
  const a = v(14), b = v(11), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const cx = (a[0] + b[0] + v(12)[0] + v(13)[0]) / 4, cz = (a[1] + b[1] + v(12)[1] + v(13)[1]) / 4;
  let n = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  if ((cx - a[0]) * n[0] + (cz - a[1]) * n[1] > 0) n = [-n[0], -n[1]];
  onEdge(P, { a, b, len, n }, (L) => {
    tiledWall(P, M.brick5, 0, L, B.h, H, 0, 2.4, 1.2);
    tiledWall(P, M.brick5, 0, L, H, H + C5.parapet, 0, 2.4, 1.2);
    belt(P, M.conc, 0, L, H + C5.parapet, H + C5.parapet + 0.14, 0.14, 2.4);
  });
}

function blockWalls(K, B, others) {
  const P = K.P, D = K.D, M = K.M, h = B.h, n = Math.round(h / C5.storey);
  for (const e of B.edges) {
    if (e.len < 0.9) continue;
    if (B.key === 'aud' && TOWER.edges.includes(e.i)) { towerWalls(K, B, e); continue; }
    const runs = partyRuns(e, others), pieces = wallPieces(e.len, h, runs), kindA = e.len >= 24;
    onEdge(P, e, (L) => {
      onEdge(D, e, () => {
        for (const pc of pieces) {
          const x0 = pc.x0, x1 = pc.x1, y0 = pc.y0;
          if (x1 - x0 < 0.2) continue;
          tiledWall(P, kindA ? M.c5A : M.c5B, x0, x1, y0, h, 0, 3.6, C5.storey);
          tiledWall(P, M.brick5, x0, x1, h, h + C5.parapet, 0, 2.4, 1.2);                                      // the parapet (brick)
          belt(P, M.conc, x0, x1, h + C5.parapet, h + C5.parapet + 0.14, 0.14, 2.4);                           // the concrete coping
          for (let k = 1; k <= n; k++) { const y = k * C5.storey; if (y > y0 + 0.4 && y < h + 0.1) belt(D, M.conc, x0, x1, y - 0.17, y + 0.17, 0.13, 2.4); }
          // pylons at the ends of the piece and every ~15 m between
          const span = x1 - x0, nIn = span > 26 ? Math.floor(span / 15) : 0, xs = [x0 + 0.7, x1 - 0.7];
          for (let i = 1; i <= nIn; i++) xs.push(x0 + span * i / (nIn + 1));
          for (const x of xs) if (span > 3) pylon(D, M.brick5, M.conc, x, 1.3, y0, h + C5.parapet + 0.3, 0.42, 2.4);
        }
      });
    });
  }
  P.cap(M.roofc, B.ring, h, true, 6, B.holes);
  if (B.key === 'aud') towerTop(K, B);
}

export async function build(K) {
  const ctx = K.ctx, M = K.M;
  const blocks = BLOCKS.map((b) => {
    const ring = ringOf(b.id), holes = [];
    if (!ring) throw new Error(b.id + ' missing');
    return { ...b, ring, holes, edges: ringEdges(polyOf(ring, holes)) };
  });
  K.shared.c5 = { blocks };
  stage(K, 'walls', () => { for (const B of blocks) blockWalls(K, B, blocks.filter((o) => o !== B)); });
  stage(K, 'colliders', () => {
    for (const B of blocks) addPolyColliders(ctx, polyOf(B.ring, B.holes), 0, B.h + 1.4);
    const aud = blocks.find((b) => b.key === 'aud');                                                         // the tower above the wing eaves
    addPolyColliders(ctx, polyOf([aud.ring[11], aud.ring[12], aud.ring[13], aud.ring[14]], []), aud.h + 1.4, TOWER.h + C5.parapet + 0.4);
  });
  { const m = await import('./entrance5.js'); stage(K, 'entrance', () => m.build(K)); }
  if (K.errs) throw new Error(K.errs.join('\n'));
}
