import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennyTheatre - the KAMENNOOSTROVSKY THEATRE on Kamenny Island (Каменноостровский театр, the pink wooden theatre of S. L. Shustov 1827, rebuilt by A. K. Cavos 1844, now the second stage of the BDT; OSM w39358614,
// at the 1st Yelagin bridge) and its neighbour the KLEINMICHEL DACHA (Дом приёмов, w60703051) with the timber tower: the body with the ashlar-imitating boards and the real window openings, the 8-column Corinthian portico on
// its granite stylobate with the white relief of the pediment (lyre, masks, thyrsi, instruments), the rear gable with the half-round fanlight, the two low annexes with balustraded terraces, the grey ventilation kiosks, the BDT
// poster kiosk; the dacha's tower, glazed hall and slate-roofed houses; the black iron plot fence (w124708539) with cream gate piers.  Exterior only, forecourt walkable (stylobate and steps).
// The portico faces WNW (bearing 292) onto the Starogo Teatra square; the annexes stand mid-wall, 4 bays from the ESE rear corner (the OSM ring and photos T07 / T12 agree, see the BUILD LOG of docs/research/kamenny-2026.md).
// The Kirov bust of the 1st Yelagin bridgehead belongs to landmarksYelaginPark.  User rules: no flags, no alarms; the gate is a plain iron gate.
// Files (landmarksKamennyTheatre/): frame.js (frames T and K, plan numbers) art.js mats.js (every texture / material key starts with 'lmkth-') kit.js geo.js facade.js util.js orders.js (columns, entablature, balustrade, rake)
// body.js (walls, entablature, pediments, roof, rear landings) portico.js relief.js annex.js props.js kleinmichel.js fence.js walk.js (colliders, services) groups.js (claims).  Tools: tools/landmarksKamennyTheatre-walk.mjs.
// Collectors: P = the shell (LOD 1100 m), N = near detail (surrounds, dentil blocks, relief, balusters; LOD 350 m).  Publishes ctx.services.landmarksKamennyTheatre and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksKamennyTheatre/kit.js';
import { makeMats } from './landmarksKamennyTheatre/mats.js';
import { GROUPS_LIST } from './landmarksKamennyTheatre/groups.js';

const PARTS = [
  ['body', 'kamenny-theatre', () => import('./landmarksKamennyTheatre/body.js')],
  ['portico', 'kamenny-theatre', () => import('./landmarksKamennyTheatre/portico.js')],
  ['annex', 'kamenny-theatre', () => import('./landmarksKamennyTheatre/annex.js')],
  ['props', 'kamenny-theatre', () => import('./landmarksKamennyTheatre/props.js')],
  ['kleinmichel', 'kamenny-kleinmichel', () => import('./landmarksKamennyTheatre/kleinmichel.js')],
  ['fence', 'kamenny-kfence', () => import('./landmarksKamennyTheatre/fence.js')],
  ['walk', 'kamenny-theatre', () => import('./landmarksKamennyTheatre/walk.js')],
];
const FAR_SHELL = 1100, FAR_NEAR = 350;

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKamennyTheatre';
  const svc = { monuments: [], photoSpots: [], entrances: [], plaques: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], tiers = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), N: new Parts(), svc, root, shared };
    try { const m = await load(); await m.build(K); } catch (e) { console.error(`[landmarksKamennyTheatre] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const [tag, C] of [['shell', K.P], ['near', K.N]]) {
      for (const k of C.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennyTheatre] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
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
  ctx.services.landmarksKamennyTheatre = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KTH_DEBUG) console.log('[landmarksKamennyTheatre] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksKamennyTheatre parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennyTheatre");
}
