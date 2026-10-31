// landmarksZhdanovka/envelope.js - the closed envelope every claimed house needs (a claim removes the generic building, so the module draws ALL walls, the cornice and the roof, and the colliders):
// street edges get a stack of atlas rows (windows) + a cornice ledge, every other edge the plain courtyard wall, the roof is one flat iron cap.  Bespoke parts (the arched elevation of No. 9, bays, balconies,
// mansard) are added by the house files; they list the edge indices they draw themselves in `skip`.
import { edgeFrame } from './frame.js';
import { wallRows, courtWall, ledge } from './geom.js';
import { addPolyColliders } from '../lib/massing.js';
import { flat } from './geom.js';

/**
 * fp = frame.js footprint(); o = { Hw (top of the walls), Hc (roof level, top of the cornice), rows(i) -> [{mat,h}] | null for a street edge, skip: Set of edges drawn elsewhere, proj (cornice projection),
 *   ledgeMat, roofMat, minStreet (shortest street edge that gets a cornice), roof: false to leave the roof out }
 */
export function envelope(K, fp, o) {
  const { P, M, ctx } = K, edges = fp.edges, skip = o.skip || new Set(), proj = o.proj ?? 0.6;
  P.far = Infinity;                                                  // masses are never hidden by distance: the generic building they replace had its own far LOD
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]; if (skip.has(i) || e.len < 0.25) continue;
    const rows = o.rows ? o.rows(i, e) : null;
    if (rows && e.len >= (o.minStreet ?? 2.8)) {
      const f = edgeFrame(e);
      P.push(f.S.x, 0, f.S.z, f.rot);
      wallRows(P, rows, e.len, o.wall ? o.wall(i, e) : {});
      if (o.Hc > o.Hw) ledge(P, o.ledgeMat || M.cream, e.len, o.Hw, o.Hc, proj, 0.0, 'k');
      P.pop();
    } else {
      courtWall(P, M.court, e.a, e.b, e.n, o.Hc);
    }
  }
  if (o.roof !== false) P.cap(o.roofMat || M.iron, fp.ring, o.Hc, true, 4);
  // solid walls: the player cannot walk through the house (the arches are closed at the wall plane)
  if (ctx.physics) addPolyColliders(ctx, { o: flat(fp.ring), h: [] }, 0, o.Hc + 1, 0.6);
}
