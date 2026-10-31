import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginPalace - the YELAGIN PALACE (Елагин дворец, Елагин остров 4 литА; Carlo Rossi 1818-22): the west (entrance) front with 14 Corinthian columns, five arched French windows, two pedimented
// end pavilions, the attic block with six small columns and the zinc dome; the east (garden) front with the six-column rotunda, its balcony, drum and dome, the wide stair with four marble vases and two
// lattice planters; the west terrace with its balustrade, the 13-step granite stair between two ashlar cheek blocks that carry the two WHITE CAST-IRON LIONS (Kazyonny foundry 1822, paw on a ball),
// the two curved carriage ramps with granite balls, Rossi lantern posts, the two park gates.  NOT drawn here: the Kitchen block and its 14 statues (landmarksYelaginKitchen), the Stable, Orangery and service
// houses (landmarksYelaginServices).  Interior closed: solid walls, closed doors.
// Dossier docs/research/yelagin-palace-2026.md (researched and critic-checked 2026-10-13; the CRITIC LOG wins), photos refs/yelagin-palace-2026 (pal_*, lion_*).  User rules: no flags / flagpoles, no alarms.
// Files: landmarksYelaginPalace/frame.js (frame PA, heights, plan numbers) art.js mats.js (every texture / material key starts with 'lmyepal-') orders.js (column, entablature, pediment, balustrade)
// body.js (walls, cornices, roofs, attic) west.js (west terrace, stair, cheeks, ramps) east.js (rotunda, east stair) sculpt.js (lions, vases, lamps, spheres, planters) walk.js (colliders) groups.js (claims)
// · kit.js geo.js inst.js facade.js objs.js (copies / helpers).  Tools: tools/landmarksYelaginPalace-walk.mjs (walk probe).  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksYelaginPalace = { monuments, photoSpots, entrances, lamps, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksYelaginPalace/kit.js';
import { makeMats } from './landmarksYelaginPalace/mats.js';
import { GROUPS_LIST } from './landmarksYelaginPalace/groups.js';

const PARTS = [
  ['body', 'yelagin-palace', () => import('./landmarksYelaginPalace/body.js')],
  ['top', 'yelagin-palace', () => import('./landmarksYelaginPalace/top.js')],
  ['west', 'yelagin-palace', () => import('./landmarksYelaginPalace/west.js')],
  ['east', 'yelagin-palace', () => import('./landmarksYelaginPalace/east.js')],
  ['sculpt', 'yelagin-palace', () => import('./landmarksYelaginPalace/sculpt.js')],
  ['walk', 'yelagin-palace', () => import('./landmarksYelaginPalace/walk.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYelaginPalace';
  const svc = { monuments: [], photoSpots: [], entrances: [], lamps: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  const shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, shared };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksYelaginPalace] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYelaginPalace] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginPalace = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.YEP_DEBUG) console.log('[landmarksYelaginPalace] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksYelaginPalace parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginPalace");
}
