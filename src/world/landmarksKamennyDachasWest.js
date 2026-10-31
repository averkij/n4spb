import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennyDachasWest - the three closed dachas of the west end of Kamenny Island, exteriors only: the POLOVTSOV DACHA (Fomin 1912-16, OSM w60703042, white neoclassical U-plan with the semicircular glazed winter garden
// on the river side and an Ionic portico on the garden side), the GAUSWALD DACHA (1898, w108029314: pale-green clapboard, steep red-tile gables, a buff-brick wing with a round-arched porch and a round tower with a dark
// conical roof, plus the three small houses of its compound), the FOLLENWEIDER MANSION (Meltzer 1904-05, w108026879: white roughcast, a tall curved tent roof, a round bay, dark half-timber lucarne, balcony, granite plinth)
// and the plot fences (Polovtsov black arc-motif fence on a rose granite socle, Gauswald pale-green fence with red-and-buff brick piers and domed caps, Follenweider black fence with rough granite gate piers).
// Everything is closed territory: the buildings and the fences are solid, the player walks along the embankment road and Bolshaya alleya.  Based on docs/research/kamenny-2026.md (5.4, CRITIC LOG, BUILD LOG at the end) and the photos
// V02..V08, G01..G12, F01..F12.  User rules: no flags, no alarms; plain lamps only.
// Files (landmarksKamennyDachasWest/): frame.js (frames FW / FG / FP, outlines, fence chains, gates) art.js mats.js (every texture / material key starts with 'lmkdw-') kit.js geo.js facade.js util.js
// polovtsov.js gauswald.js follenweider.js compound.js fence.js walk.js groups.js (claims).  Tools: tools/landmarksKamennyDachasWest-walk.mjs.
// Collectors: P = the shell (LOD 1100 m), N = near detail (surrounds, balusters, columns detail; LOD 350 m).  Publishes ctx.services.landmarksKamennyDachasWest and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksKamennyDachasWest/kit.js';
import { makeMats } from './landmarksKamennyDachasWest/mats.js';
import { GROUPS_LIST } from './landmarksKamennyDachasWest/groups.js';

const PARTS = [
  ['polovtsov', 'kamenny-polovtsov', () => import('./landmarksKamennyDachasWest/polovtsov.js')],
  ['gauswald', 'kamenny-gauswald', () => import('./landmarksKamennyDachasWest/gauswald.js')],
  ['compound', 'kamenny-gauswald', () => import('./landmarksKamennyDachasWest/compound.js')],
  ['follenweider', 'kamenny-follenweider', () => import('./landmarksKamennyDachasWest/follenweider.js')],
  ['fence-pol', 'kamenny-dw-fence-pol', () => import('./landmarksKamennyDachasWest/fence.js').then((m) => ({ build: (K) => m.buildFence(K, 'pol') }))],
  ['fence-fol', 'kamenny-dw-fence-fol', () => import('./landmarksKamennyDachasWest/fence.js').then((m) => ({ build: (K) => m.buildFence(K, 'fol') }))],
  ['fence-gau', 'kamenny-dw-fence-gau', () => import('./landmarksKamennyDachasWest/fence.js').then((m) => ({ build: (K) => m.buildFence(K, 'gau') }))],
  ['walk', null, () => import('./landmarksKamennyDachasWest/walk.js')],
];
const FAR_SHELL = 1100, FAR_NEAR = 350;

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKamennyDachasWest';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], triangles: 0, parts: {}, drawn: [] };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], tiers = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (key && !claimed.has(key)) continue;                              // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), N: new Parts(), svc, root, shared, claimed };
    try { const m = await load(); await m.build(K); } catch (e) { if (typeof console !== 'undefined') console.error(`[landmarksKamennyDachasWest] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const [tag, C] of [['shell', K.P], ['near', K.N]]) {
      for (const k of C.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennyDachasWest] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
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
  ctx.services.landmarksKamennyDachasWest = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KDW_DEBUG) console.log('[landmarksKamennyDachasWest] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksKamennyDachasWest parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennyDachasWest");
}
