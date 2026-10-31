import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennyDachasEast - the EAST DACHAS of Kamenny Island, on the Malaya Nevka below the Kamennoostrovsky Bridge: the OLDENBURG DACHA (Дача принца П. Г. Ольденбургского, F. L. Shustov 1831-33, OSM w31065816: the wooden
// square house with the rotunda dome and three six-column Doric porticoes, pale-yellow clapboard, under restoration behind a green plank fence), its WING (w31065814, ochre stucco with white pilaster strips and a hip roof),
// the SPHINX PIER (Пристань со сфинксами, r10254206: the granite stair down to the river with two bronze-green sphinxes on pedestals, public and walkable) and the plot fences (w640543965 with the iron spear fence, w741702547, w640543962).
// The plot is closed: exterior only and solid.  Dossier docs/research/kamenny-2026.md (5.4, 8 entry 5, the BUILD LOG at the end), photos refs/kamenny-2026 O01..O12 S01..S04.  User rules: no flags, no alarms, nothing on a carriageway.
// Files (landmarksKamennyDachasEast/): frame.js (frames D, WG, PR + plan numbers) art.js mats.js (every texture / material key starts with 'lmkde-') kit.js geo.js facade.js (copies of landmarksKamennyTheatre)
// dacha.js wing.js pier.js sphinx.js fence.js walk.js (colliders, services) groups.js (claims).  Tools: tools/landmarksKamennyDachasEast-walk.mjs.
// Collectors: P = the shell (LOD 1100 m), N = near detail (surrounds, column necks, finials; LOD 350 m).  Publishes ctx.services.landmarksKamennyDachasEast and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksKamennyDachasEast/kit.js';
import { makeMats } from './landmarksKamennyDachasEast/mats.js';
import { GROUPS_LIST } from './landmarksKamennyDachasEast/groups.js';

const PARTS = [
  ['dacha', 'kamenny-oldenburg', () => import('./landmarksKamennyDachasEast/dacha.js')],
  ['wing', 'kamenny-wing', () => import('./landmarksKamennyDachasEast/wing.js')],
  ['pier', 'kamenny-sphinx-pier', () => import('./landmarksKamennyDachasEast/pier.js')],
  ['fence', 'kamenny-dfence', () => import('./landmarksKamennyDachasEast/fence.js')],
  ['walk', 'kamenny-oldenburg', () => import('./landmarksKamennyDachasEast/walk.js')],
];
const FAR_SHELL = 1100, FAR_NEAR = 350;

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKamennyDachasEast';
  const svc = { monuments: [], photoSpots: [], entrances: [], plaques: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], tiers = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), N: new Parts(), svc, root, shared };
    try { const m = await load(); await m.build(K); } catch (e) { console.error(`[landmarksKamennyDachasEast] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const [tag, C] of [['shell', K.P], ['near', K.N]]) {
      for (const k of C.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennyDachasEast] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
      const meshes = C.build(root, { name: `${name}-${tag}` });
      for (const m of meshes) { if (M.decals.has(m.material) || M.cutouts.has(m.material)) ctx.noOutline(m); tiers.push([m, tag]); }
      svc.triangles += C.tris;
    }
    svc.parts[name] = { tris: K.P.tris + K.N.tris, ms: Math.round(performance.now() - t1) };
  }
  root.updateMatrixWorld(true);
  for (const [m, tag] of tiers) registerLOD(m, tag === 'shell' ? FAR_SHELL : FAR_NEAR);
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKamennyDachasEast = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KDE_DEBUG) console.log('[landmarksKamennyDachasEast] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksKamennyDachasEast parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennyDachasEast");
}
