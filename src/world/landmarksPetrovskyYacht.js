import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksPetrovskyYacht - the PETROVSKAYA KOSA (the western spit of Petrovsky Island): the main building of the St Petersburg River Yacht Club (the crystal frame of 1969-80 on Y-shaped concrete pillars with
// its sloped glazed band, lantern and antenna mast, stone podium and steps), the Standart shipyard shed with its cast cannon, anchor and compass-rose sign, the fenced site of the Rops cottage (burned on 6 July 2026), and
// the Savina Veterans' Home with its cast-iron estate fence, and the small office "Петровская коса 3/6" (oval garland window) with its transformer hut and prefab fence.  Club territory is closed: exterior only, solid walls and fences; the lawn, the podium steps and the terrace under the slab can be walked.  NOT drawn here: the harbours, piers,
// the breakwater arc and the granite club shore (water owner), boats (props owner), the boat sheds and hangars (generic city) - see docs/research/islands2-requests-landmarksPetrovskyYacht.md.
// Dossier docs/research/petrovsky-zhdanovka-2026.md (CRITIC LOG wins; BUILD LOG at its end), photos refs/petrovsky-zhdanovka-2026/yacht + misc.  User rules: no flags, no flagpoles, no pennants, no banners, no alarms, no logos.
// Files: landmarksPetrovskyYacht/frame.js (frames, datum) kit.js (Parts collector with authored LOD ranges) art.js mats.js (canvas textures / materials, every key 'lmpyac-' / 'pyac-')
// hall.js (main building) standart.js rops.js savina.js savfence.js kosa3.js walk.js (colliders, services) groups.js (claims, PAVED_RINGS).  A part is built only when its claim key is in groups.js.
// Tools: tools/landmarksPetrovskyYacht-walk.mjs (walk probe).  Publishes ctx.services.landmarksPetrovskyYacht = { monuments, photoSpots, entrances, lamps, crowd, parts, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Budget: about 95 k triangles, <= 20 materials, no per-frame callbacks, every mesh registered with an authored LOD range (kit.js).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksPetrovskyYacht/kit.js';
import { makeMats } from './landmarksPetrovskyYacht/mats.js';
import { GROUPS_LIST } from './landmarksPetrovskyYacht/groups.js';

const PARTS = [
  ['hall', 'pyacht-main', () => import('./landmarksPetrovskyYacht/hall.js')],
  ['standart', 'pyacht-standart', () => import('./landmarksPetrovskyYacht/standart.js')],
  ['rops', 'pyacht-rops', () => import('./landmarksPetrovskyYacht/rops.js')],
  ['savina', 'pyacht-savina', () => import('./landmarksPetrovskyYacht/savina.js')],
  ['kosa3', 'pyacht-kosa3', () => import('./landmarksPetrovskyYacht/kosa3.js')],
  ['savfence', 'pyacht-savfence', () => import('./landmarksPetrovskyYacht/savfence.js')],
  ['walk', 'pyacht-main', () => import('./landmarksPetrovskyYacht/walk.js')],
];
const FORCE = (typeof process !== 'undefined' && process.env && process.env.PYACHT_FORCE ? process.env.PYACHT_FORCE.split(',') : []);   // diagnostics only: build a part whose claim is still off

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksPetrovskyYacht';
  const svc = { monuments: [], photoSpots: [], entrances: [], lamps: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key) && !FORCE.includes(name)) continue;                                // built only when the claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, shared };
    try {
      const m = await load();
      m.build(K);
    } catch (e) { console.error(`[landmarksPetrovskyYacht] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksPetrovskyYacht] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const built = K.P.build(root, { name: 'pyacht-' + name });
    for (const { mesh, mat } of built) if (M.decals.has(mat) || M.cutouts.has(mat)) ctx.noOutline(mesh);
    svc.triangles += K.P.tris; svc.parts[name] = { tris: K.P.tris, meshes: built.length, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksPetrovskyYacht = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.PYACHT_DEBUG) console.log('[landmarksPetrovskyYacht] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksPetrovskyYacht parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksPetrovskyYacht");
}
