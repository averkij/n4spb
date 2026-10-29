// landmarksDekabristov/site.js - the common ground work of a site (a cemetery or a park): the plan (plan.js), the floor splat, the alleys laid as ribbons, the fence with its gates (fence.js), the trees and shrubs
// (forest.js: instanced, LOD by the camera), the grave field (gravefield.js: instanced, composed on demand) and the services the people / wildlife modules read.  The shape follows landmarksSmolensky/grounds.js
// (this repository): the GREEN polygon of the site is CLAIMED (groups.js) so the generic modules plant and draw nothing on it; this module plants the trees, lays the alleys it claims and draws the fence.
// S (sites.js): { id, name, ring, floor: { zoneAt, lawnAt }, fence: { runs, gates }, graves: { ... } | false, ...plan options }.
import * as THREE from 'three';
import { planSite, segDist } from './plan.js';
import { planPlots } from './plots.js';
import { buildFence } from './fence.js';
import { makeAtlas } from './atlas.js';
import { plantGraveField } from './gravefield.js';
import { plantForest, LEAF } from './forest.js';
import { SPECIES } from './treegeo.js';
import { fillPolyFine, ribbon, roadTest, inflate } from './surfaces.js';
import { makeFloorTextures, makeMask, makeFloorMaterial } from './floor.js';
import { inRing } from './plan.js';

/** the surface classes of an alley: [material, minimum width, y, uv tile] (one height per class: no coplanar overlap between classes) */
const CLS = (M) => ({ asphalt: [M.asphalt, 3.2, 0.033, 3], narrow: [M.asphalt, 2.4, 0.031, 3], paving: [M.pavers, 2.2, 0.029, 2], gravel: [M.gravel, 1.8, 0.027, 3], earth: [M.gravel, 1.0, 0.025, 3] });
const classOf = (p) => (p.surface === 'asphalt' ? 'asphalt' : /paving|sett|plates|concrete|cobble/.test(p.surface) ? 'paving' : /gravel|compacted|ground|fine/.test(p.surface) ? 'gravel' : p.surface === 'unpaved' ? 'earth' : p.hwClass === 'path' ? 'gravel' : p.hwClass === 'service' ? 'narrow' : 'gravel');

export function buildSite(K, S) {
  const ctx = K.ctx, P = K.P, M = K.M, st = { tris0: P.tris };
  const pl = planSite(ctx, S);
  // ---- the floor: a splat decal (leaf litter, goutweed, moss, mown lawn) over the whole polygon
  if (S.floor !== false) {
    const rx = S.ring.map((q) => q[0]), rz = S.ring.map((q) => q[1]);
    const mask = makeMask([Math.floor(Math.min(...rx) / 3) * 3 - 6, Math.floor(Math.min(...rz) / 3) * 3 - 6, Math.ceil(Math.max(...rx) / 3) * 3 + 6, Math.ceil(Math.max(...rz) / 3) * 3 + 6], { zoneAt: S.zoneAt || (() => 'C'), lawnAt: S.lawnAt });
    const mat = makeFloorMaterial(ctx, mask, makeFloorTextures(ctx), S.key);
    fillPolyFine(P, mat, S.ring, 0.022, { maxEdge: 22, tile: 6 });
  }
  // ---- the alleys: streets draws no way that groups.js claims, the module lays its own ribbons (asphalt / paving / gravel by the surface tag)
  const cls = CLS(M), road = roadTest(ctx), keepIn = (() => { const big = inflate(S.ring, 3); return (x, z) => inRing(big, x, z); })();
  let ribbons = 0;
  for (const p of pl.paths) { const c = cls[classOf(p)]; ribbons += ribbon(P, c[0], p.pts, Math.max(c[1] * (S.pathScale ?? 1), p.w), c[2], { tile: c[3], seg: 2.5, keep: keepIn, clip: (x, z) => road(x, z, 0) }); }
  st.ribbons = ribbons;
  // ---- the fence and the gates: the mapped gate nodes, plus a gap wherever an alley ENDS at the fence (the alley goes on outside: its gate is not mapped, the way through is; 2.4 m, breakable bays on both sides)
  if (S.fence && S.fence.runs.length) {
    const gates = (S.fence.gates || []).slice(), onFence = (x, z) => S.fence.runs.some((r) => { for (let i = 0; i + 1 < r.pts.length; i++) if (segDist(x, z, r.pts[i], r.pts[i + 1]) < 2.2) return true; return false; });
    const have = (x, z) => gates.some((g) => !g.closed && Math.hypot(g.x - x, g.z - z) < 5);
    for (const p of pl.paths) for (const e of [p.pts[0], p.pts[p.pts.length - 1]]) if (onFence(e[0], e[1]) && !have(e[0], e[1])) gates.push({ id: 'alley-' + p.id + '-' + (e === p.pts[0] ? 'a' : 'b'), x: e[0], z: e[1], closed: false });
    buildFence(K, 'lmdek-' + S.key, S.fence.runs, gates);
  }
  // ---- the trees and shrubs
  const col = new THREE.Color(), list = [], all = pl.trees.concat(pl.shrubs);
  all.forEach((t, i) => {
    const F = SPECIES[t.fam]; if (!F) return;
    col.set((LEAF[t.fam] || LEAF.limeA)[i % 3]).multiplyScalar(t.br);
    t.rgb = [col.r, col.g, col.b]; t.tr = Math.max(0.22, F.trunk * t.s * 0.7); list.push(t);
  });
  const forest = list.length ? plantForest(K, list, 'lmdek-' + S.key + '-forest') : { colliders: 0, count: 0 };
  // ---- the graves
  let graves = null, pp = null;
  if (S.graves) {
    const atlas = M.atlas || (M.atlas = makeAtlas(ctx));
    pp = planPlots(ctx, pl, S.graves);
    graves = plantGraveField(K, pp.plots, atlas);
    K.svc.plotStats = { ...(K.svc.plotStats || {}), [S.key]: pp.stats }; K.svc.graveField = { ...(K.svc.graveField || {}), [S.key]: graves.stats };
  }
  // ---- services
  K.svc.paths.push(...pl.paths.map((p) => ({ id: p.id, name: p.name, pts: p.pts, w: p.w, surface: p.surface })));
  K.svc.trees.push(...pl.trees.map((t) => { const F = SPECIES[t.fam]; return { x: t.x, z: t.z, r: F.R * t.s, h: F.H * t.sy, tr: t.tr }; }));
  K.svc.treeStats = { ...(K.svc.treeStats || {}), [S.key]: { trees: pl.trees.length, shrubs: pl.shrubs.length, colliders: forest.colliders, graves: pp ? pp.plots.length : 0, graveColliders: graves ? graves.colliders : 0, ribbons } };
  return pl;
}
