// Московский парк Победы: the mapped formal ensemble and SKA Arena adapted
// from 102_3d_piter, plus the pond pavilion, memory portico, lions and carefully
// placed shore planting. References/assumptions: docs/research/moskovskaya-park.md.
// Ponds/islands, lawn, mapped footways and six footbridges stay with the area
// environment/streets/bridges. No per-frame work or barriers around the water.
export const OWNS_GROUPS = true;
import * as THREE from 'three';
import { ParkKit } from './landmarksMoskovskayaPark/kit.js';
import { mats } from './landmarksMoskovskayaPark/mats.js';
import { entrance, fountain } from './landmarksMoskovskayaPark/ensemble.js';
import { heroes } from './landmarksMoskovskayaPark/sculptures.js';
import { arena } from './landmarksMoskovskayaPark/arena.js';
import { pavilions } from './landmarksMoskovskayaPark/pavilions.js';
import { landscape } from './landmarksMoskovskayaPark/landscape.js';
import { furniture } from './landmarksMoskovskayaPark/furniture.js';
import { chapel } from './landmarksMoskovskayaPark/chapel.js';

export function build(ctx) {
  const t0 = performance.now(), root = new THREE.Group();
  root.name = 'landmarksMoskovskayaPark';
  const svc = { monuments: [], photoSpots: [], entrances: [], benches: [], lamps: [], trees: [] };
  const P = new ParkKit(ctx, root), M = mats(ctx);
  P.noOutlineMaterials.add(M.water); P.noOutlineMaterials.add(M.foam);
  entrance(ctx, P, M, svc); fountain(ctx, P, M, svc);
  heroes(ctx, P, M, svc); arena(ctx, P, M, svc);
  pavilions(ctx, P, M, svc); chapel(ctx,P,M,svc); landscape(ctx, P, M, svc);
  const out = P.finish(); ctx.addStatic(root);
  furniture(ctx, M, svc);
  const shared = ctx.services.landmarks ||= {};
  for (const key of ['monuments', 'photoSpots']) (shared[key] ||= []).push(...svc[key]);
  ctx.services.landmarksMoskovskayaPark = { ...svc, triangles: out.tris, buildMs: Math.round(performance.now() - t0), updates: 0 };
}
