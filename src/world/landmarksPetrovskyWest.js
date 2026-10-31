import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksPetrovskyWest - the west-middle of PETROVSKY ISLAND between Petrovsky pr. and the Zhdanovka: the derelict Bavaria brewery MALTHOUSE with its three stepped brick gables and the roofless brick ruin beside it
// (Ремесленная 7 лит. К), the GOTE ROPE WORKS at Petrovsky pr. 20 (the brick hall lit. V with its arched windows, the wooden mansion corp. 3, the yellow water tower) and the ALMAZ shipyard office (Петровский пр. 26,
// with the stone relief of workers at its corner).  The Savina Veterans' Home stands in landmarksPetrovskyYacht (the yacht builder drew it), the yacht club and the stadium in their own modules; Petrovskaya square has
// nothing distinctive (a lawn roundabout, lamps by the streets module).  All of it is closed territory: exterior only, solid walls and fences.
// Dossier docs/research/petrovsky-zhdanovka-2026.md (CRITIC LOG wins; BUILD LOG of landmarksPetrovskyWest at its end), photos refs/petrovsky-west (g01..g11 Gote works, t21..t24 malthouse) and refs/petrovsky-zhdanovka-2026/misc.
// User rules: no flags, no pennants, no alarms, no logos (the Almaz sign is the plain wordmark; the ship emblem and the banner order are not drawn).
// Files: landmarksPetrovskyWest/frame.js (ring / edge frames) kit.js (Parts collector with authored LOD ranges) art.js mats.js (canvas textures / materials, keys 'lmpwest-' / 'pwest-')
// malthouse.js mansion.js hallv.js tower.js almaz.js (the sights; each pushes its monuments / photoSpots into K.svc, merged below) groups.js (claims).  A part is built only when its claim key is in groups.js.
// Tools: tools/landmarksPetrovskyWest-walk.mjs.  Publishes ctx.services.landmarksPetrovskyWest = { monuments, photoSpots, entrances, parts, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Budget: about 60 k triangles, <= 20 materials, no per-frame callbacks, every mesh registered with an authored LOD range (kit.js).
export const OWNS_GROUPS = true;

import { Parts } from './landmarksPetrovskyWest/kit.js';
import { makeMats } from './landmarksPetrovskyWest/mats.js';
import { GROUPS_LIST } from './landmarksPetrovskyWest/groups.js';
import * as THREE from 'three';

const PARTS = [
  ['malthouse', 'pwest-malthouse', () => import('./landmarksPetrovskyWest/malthouse.js')],
  ['mansion', 'pwest-mansion', () => import('./landmarksPetrovskyWest/mansion.js')],
  ['hallv', 'pwest-hallv', () => import('./landmarksPetrovskyWest/hallv.js')],
  ['tower', 'pwest-tower', () => import('./landmarksPetrovskyWest/tower.js')],
  ['almaz', 'pwest-almaz', () => import('./landmarksPetrovskyWest/almaz.js')],
];
const FORCE = (typeof process !== 'undefined' && process.env && process.env.PWEST_FORCE ? process.env.PWEST_FORCE.split(',') : []);   // diagnostics only: build a part whose claim is still off

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksPetrovskyWest';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key) && !FORCE.includes(name)) continue;                                // built only when the claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, shared };
    try {
      const m = await load();
      m.build(K);
    } catch (e) { console.error(`[landmarksPetrovskyWest] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksPetrovskyWest] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const built = K.P.build(root, { name: 'pwest-' + name });
    for (const { mesh, mat } of built) if (M.decals.has(mat) || M.cutouts.has(mat)) ctx.noOutline(mesh);
    svc.triangles += K.P.tris; svc.parts[name] = { tris: K.P.tris, meshes: built.length, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksPetrovskyWest = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.PWEST_DEBUG) console.log('[landmarksPetrovskyWest] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksPetrovskyWest parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksPetrovskyWest");
}
