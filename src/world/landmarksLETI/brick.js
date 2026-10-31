// landmarksLETI/brick.js - the red-brick vocabulary of Corpus 5 (1970s-80s, photos 60 62 64 B8) and Corpus 7 (1890s, photos 04 61): storey-tiled wall quads, party-wall runs between touching blocks, projecting floor belts, pylons,
// a parapet with a coping, the round stair towers.  Everything is drawn in the facade frame of an edge (kit.js onEdge: x along the wall to the right seen from outside, y up, z out of the wall).
//   Party walls: the Corpus 5 blocks (r11983462 / 463 / 464) touch each other along collinear edges; partyRuns() finds the stretches of an edge that another ring covers up to its height, so no two coplanar faces are drawn.
import { frameOf, localOnEdge } from './kit.js';
import { tube } from './geo.js';

/** stretches of edge e hidden by a neighbouring block: [{ t0, t1, hn }] (t in metres along the edge frame, hn = the neighbour height).  others = [{ edges, h }] */
export function partyRuns(e, others, tol = 0.45) {
  const runs = [], f = frameOf(e);
  for (const o of others) for (const g of o.edges) {
    if (g === e) continue;
    if (g.n[0] * e.n[0] + g.n[1] * e.n[1] > -0.97) continue;                          // opposite normals only
    const a = localOnEdge(e, g.a[0], g.a[1]), b = localOnEdge(e, g.b[0], g.b[1]);
    if (Math.abs(a.d) > tol || Math.abs(b.d) > tol) continue;
    const t0 = Math.max(0, Math.min(a.u, b.u)), t1 = Math.min(f.len, Math.max(a.u, b.u));
    if (t1 - t0 > 0.3) runs.push({ t0, t1, hn: o.h });
  }
  runs.sort((p, q) => p.t0 - q.t0);
  return runs;
}

/** split an edge of length L and height h by the party runs into wall pieces [{ x0, x1, y0 }] (y0 = where the wall starts: 0, or the neighbour height) */
export function wallPieces(L, h, runs) {
  const out = []; let x = 0;
  for (const r of runs) {
    if (r.t0 > x + 0.05) out.push({ x0: x, x1: r.t0, y0: 0 });
    if (r.hn < h - 0.05) out.push({ x0: Math.max(x, r.t0), x1: r.t1, y0: r.hn });
    x = Math.max(x, r.t1);
  }
  if (x < L - 0.05) out.push({ x0: x, x1: L, y0: 0 });
  return out;
}

/** a tiled wall quad in the current frame: u in tiles of tw metres along x, v in tiles of th metres up from y = 0 (the floor line stays at a tile bottom) */
export function tiledWall(P, mat, x0, x1, y0, y1, z, tw, th) {
  P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / tw, y0 / th], [x1 / tw, y0 / th], [x1 / tw, y1 / th], [x0 / tw, y1 / th]]);
}

/** a belt (projecting strip) along x0..x1 at heights y0..y1, proud of the wall: front, top and underside only (the ends are hidden by the pylons / corners) */
export function belt(P, mat, x0, x1, y0, y1, proud, uvs = 2.4) {
  P.box(mat, x0, x1, y0, y1, 0, proud, 'klr', uvs);
}

/** a pylon: a box proud of the wall, w wide, from y0 to y1, with a small capping slab */
export function pylon(P, mat, capMat, x, w, y0, y1, proud, uvs = 2.4) {
  P.box(mat, x - w / 2, x + w / 2, y0, y1, 0, proud, 'kb', uvs);
  P.box(capMat, x - w / 2 - 0.08, x + w / 2 + 0.08, y1, y1 + 0.14, 0, proud + 0.08, 'kb', 1);
}

/** a round brick tower (a closed tube with slot windows via the c5S tile), world position, radius r, from y0 to y1 */
export function roundTowerBrick(P, M, cx, cz, r, y0, y1, o = {}) {
  const seg = o.seg ?? 20, circ = 2 * Math.PI * r;
  tube(P, M.c5S, cx, cz, y0, y1, r, r, seg, circ / 1.8, (y1 - y0) / 3.3, { capTop: M.roofc });
  tube(P, M.conc, cx, cz, y1, y1 + 0.22, r + 0.12, r + 0.12, seg, 3, 0.3, { capTop: M.conc });
}
