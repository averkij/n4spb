import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginRossi - the ROSSI PARK PAVILIONS of Yelagin Island (K. I. Rossi, 1818-25; federal heritage): the MUSIC PAVILION on the Srednyaya Nevka alley (two cubic wings, a loggia of six grey marble
// columns, a half rotunda with arches), the EAST PAVILION on the granite pier of the east spit (the oval Doric portico of 10 columns toward the Neva, 8 columns on the park face; NO flagstaff, NO flag, no mast)
// with its paved spit, the granite stair and the cast-iron ring railing, the GUARDHOUSE SITE (a cleared plot behind a printed hoarding: the pavilion burnt in 1996 and is NOT drawn standing) and the small
// ISLAND PAVILION (four white square piers under a sheet-metal roof) on the west islet of the 3rd Southern pond.  Dossier docs/research/yelagin-park-2026.md (5.8, 13 and the BUILD LOG), photos
// refs/yelagin-park-2026/rossi 01-18.  User rules: no flags / flagpoles, no alarm sounds.  The pond / Neva banks, the lawns, the paths and the trees are other owners' (requests file).
// Files (landmarksYelaginRossi/): frame.js (measured frames) kit.js (geometry collector with authored LOD ranges) mats.js (19 materials) orders.js (revolve, sweep, Tuscan and Doric columns)
//   music.js east.js (pavilion) spit.js (pier terrace, railing, stair) island.js guard.js groups.js (claims + hand-over data).  Tools: tools/landmarksYelaginRossi-walk.mjs, -view.mjs, -env.mjs.
// Publishes ctx.services.landmarksYelaginRossi = { monuments, photoSpots, entrances, benches, lamps, parts, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Statics only (no frame callbacks); budget about 45 k triangles, <= 20 materials.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksYelaginRossi/kit.js';
import { makeMats } from './landmarksYelaginRossi/mats.js';
import { GROUPS_LIST } from './landmarksYelaginRossi/groups.js';
import { music } from './landmarksYelaginRossi/music.js';
import { east } from './landmarksYelaginRossi/east.js';
import { spit } from './landmarksYelaginRossi/spit.js';
import { island } from './landmarksYelaginRossi/island.js';
import { guard } from './landmarksYelaginRossi/guard.js';
import { sightWater } from './environment/owners.js';

const PARTS = [
  ['music', 'rossi-music', music],
  ['east', 'rossi-east', east],
  ['spit', 'rossi-east', (ctx, P, M, svc) => spit(ctx, P, M, svc, handedOver())],
  ['island', 'rossi-island', island],
  ['guard', 'rossi-guard', guard],
];
/** is the stair pit of the granite pier handed over to this module in environment/owners.js (WATER_RINGS)?  Without it the quay wall stays closed and no stair is drawn */
const FORCE_STAIR = !!((typeof process !== 'undefined' && process.env && process.env.ROSSI_STAIR) || (typeof window !== 'undefined' && window.__ROSSI_STAIR));          // diagnostics: draw the stair as if registered
const handedOver = () => { try { return FORCE_STAIR || sightWater().some((w) => w.owner === 'landmarksYelaginRossi'); } catch (e) { return false; } };
const FORCE = (typeof process !== 'undefined' && process.env && process.env.ROSSI_FORCE ? process.env.ROSSI_FORCE.split(',') : []);   // diagnostics only: build a part whose claim is still off

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYelaginRossi';
  const svc = { monuments: [], photoSpots: [], entrances: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  for (const [name, key, fn] of PARTS) {
    if (!claimed.has(key) && !FORCE.includes(name) && !(typeof window !== 'undefined' && window.__ROSSI_ALL)) continue;      // built only when the claim is on: no double drawing with the generic city
    const t1 = performance.now(), P = new Parts();
    try { fn(ctx, P, M, svc); } catch (e) { console.error(`[landmarksYelaginRossi] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYelaginRossi] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const built = P.build(root, { name: 'rossi-' + name });
    for (const { mesh, mat, keep } of built) {
      if (M.decals.has(mat) || M.cutouts.has(mat)) ctx.noOutline(mesh);
      if (keep) ctx.noBatch(mesh);                                    // an exclusive near / far pair (fluted + smooth columns): the static batch must not merge it (kit.js ranged())
    }
    svc.triangles += P.tris; svc.parts[name] = { tris: P.tris, meshes: built.length, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginRossi = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (failed.length) throw new Error('landmarksYelaginRossi parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginRossi");
}
