import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginServices - the SERVICE COURT of the Yelagin Palace (Rossi 1818-22), west and north of the Oil Meadow: the STABLE block (Конюшенный корпус: Doric colonnade gate facing the meadow, two pedimented
// pavilions, wings, front court, vaulted arch, round court with the two Manizer bronzes the Discobolus and the Discus-thrower), the ORANGERY (Museum of Art Glass: glass central pavilion with herm pilasters, two dormer
// galleries, two end pavilions), the Stone storerooms, the Fraulein house, the Cavalier / Hoffurier house, the house of the gardener Buk, the glass-blowing workshop, the fences and gates of the yard.
// NOT drawn here: the palace and the Kitchen block with its 14 statues (other modules).  Interiors closed (windows are panes at the back of the reveal, doors painted shut), the courts are walkable through the open gates.
// Dossier docs/research/yelagin-palace-2026.md (the CRITIC LOG wins: the colonnade faces SOUTH, the apse is NORTH), photos refs/yelagin-palace-2026 (stb_*, ora_*, misc_*).  User rules: no flags, no alarms, no logos.
// Files: landmarksYelaginServices/frame.js (frames ST / OR, plan numbers) art.js mats.js (every texture / material key starts with 'lmyesv-') orders.js (Doric column, cornices, pediment) wall.js (faces, openings, roofs)
// stable.js orangery.js houses.js sculpt.js (lamps, vases, bronzes, fences) walk.js (colliders, services) groups.js (claims) · kit.js geo.js facade.js objs.js inst.js (copies of the palace helpers).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksYelaginServices = { monuments, photoSpots, entrances, lamps, crowd, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksYelaginServices/kit.js';
import { makeMats } from './landmarksYelaginServices/mats.js';
import { GROUPS_LIST } from './landmarksYelaginServices/groups.js';

const PARTS = [
  ['stable', 'yelagin-stable', () => import('./landmarksYelaginServices/stable.js')],
  ['orangery', 'yelagin-orangery', () => import('./landmarksYelaginServices/orangery.js')],
  ['houses', 'yelagin-houses', () => import('./landmarksYelaginServices/houses.js')],
  ['sculpt', 'yelagin-stable', () => import('./landmarksYelaginServices/sculpt.js')],
  ['walk', 'yelagin-stable', () => import('./landmarksYelaginServices/walk.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYelaginServices';
  const svc = { monuments: [], photoSpots: [], entrances: [], lamps: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  const shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, shared, claimed };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksYelaginServices] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYelaginServices] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material) || m.material === shared.plateMat) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginServices = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.YES_DEBUG) console.log('[landmarksYelaginServices] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksYelaginServices parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginServices");
}
