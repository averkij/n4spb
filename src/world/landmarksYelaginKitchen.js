import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginKitchen - the KITCHEN BLOCK of the Yelagin complex (Кухонный корпус, Елагин остров 4 литВ; Carlo Rossi 1818-22): the white HALF DRUM (R 29.8 m, cornice 7.9 m) with its limestone plinth and grooved bands,
// ten framed rectangular niches on the arc and FOURTEEN STATUES of S. S. Pimenov (1822, Pudozh stone: Vestal, Juno, Bacchus, Flora, Meleager, Athena, Psyche, Ceres, Priestess, Adonis, Latona, Mercury, Artemis, Apollo; 5 + 4 + 5,
// each a modelled figure on a base with its steel plate; Latona is a niche statue, not a fountain), the SOUTH portico of six Doric columns 6.2 m with a rosette frieze, a pediment and the double wooden door under a round recess,
// the NORTH portico with five arched vase niches and the garland frieze, six more arched vase niches in the flat north wall, the zinc roof with its chimney boxes, the white iron spear fences and gates of the Kitchen yard,
// two Rossi lantern posts and the white bollards of the lawn.  Interior closed: solid walls, the door is painted shut.
// Dossier docs/research/yelagin-palace-2026.md (researched and critic-checked 2026-10-13; the CRITIC LOG wins; the build log in section 14), photos refs/yelagin-palace-2026 (kit_*, misc_01) and refs/yk (the 14 statue photos).
// User rules: no flags / flagpoles, no alarms.  Files: landmarksYelaginKitchen/frame.js (frame K, numbers) art.js mats.js (every texture / material key starts with 'lmyek-') orders.js (Doric column, rosette, mutules, pediment)
// body.js (drum, niches, north wall, cornice, roof, courtyard) porticos.js (both porticos, vases) statues.js (14 figures + plates) iron.js (lamps, bollards, fences, gates) walk.js (colliders, services) groups.js (claims)
// · kit.js geo.js objs.js (copies).  Tools: tools/landmarksYelaginKitchen-walk.mjs (walk probe).  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksYelaginKitchen = { monuments, photoSpots, entrances, lamps, crowd, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksYelaginKitchen/kit.js';
import { makeMats } from './landmarksYelaginKitchen/mats.js';
import { GROUPS_LIST } from './landmarksYelaginKitchen/groups.js';

const PARTS = [
  ['body', 'yelagin-kitchen', () => import('./landmarksYelaginKitchen/body.js')],
  ['porticos', 'yelagin-kitchen', () => import('./landmarksYelaginKitchen/porticos.js')],
  ['statues', 'yelagin-kitchen', () => import('./landmarksYelaginKitchen/statues.js')],
  ['iron', 'yelagin-kitchen', () => import('./landmarksYelaginKitchen/iron.js')],
  ['walk', 'yelagin-kitchen', () => import('./landmarksYelaginKitchen/walk.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYelaginKitchen';
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
    } catch (e) { console.error(`[landmarksYelaginKitchen] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYelaginKitchen] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginKitchen = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.YEK_DEBUG) console.log('[landmarksYelaginKitchen] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksYelaginKitchen parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginKitchen");
}
