// landmarksGavan - GAVAN, the old naval harbour of Vasilievsky Island: the two KRONSHPITSES (guard pavilions of 1754) at the mouth of the Shkipersky canal with the MChS buildings, the canal promenade with its black
// iron fan fence, the SHKIPERSKY BRIDGE (1997 Mabey truss), GALERNY HARBOUR (steam crane of 1854, the water tower of 1894, the guardhouse, the rotunda, the pedimented works house, the Nevsky Yacht Club pontoons),
// the GAVAN WORKERS' TOWN (1904-06: five brick-and-plaster slabs with green gables and the big mural), the Gavan FIRE RESERVE (1906-07) and the CHURCH OF THE MERCIFUL MOTHER OF GOD (1889-98, 42 m).
// Dossier docs/research/gavan.md (+ gavan-houses.json), brief docs/VO-BRIEF.md, photos refs/gavan, requests to the other owners docs/research/vo-requests-landmarksGavan.md.
// User rules: no flags / flagpoles (the east spire stays bare, the masts and the boom gate are left out), no alarm sounds (the fire reserve stands silent, no beacons, the church bells are silent), summer day.
// Files: landmarksGavan/frame.js (frames K C B R T G Rt W F M) art*.js mats.js (every texture / material key starts with 'lmgavan-') · kron.js (pavilions, mole, MChS) canal.js (promenade fence, lamps) bridge.js (truss) ·
// harbour.js (crane, works house, rotunda) tower.js (water tower) guard.js (guardhouse) club.js (yacht-club pontoons) · town.js + mural (workers' town) fire.js (fire reserve) church.js (church, hoarding) ·
// groups.js (claims, hand-over rings) · kit.js geo.js inst.js prims.js surfaces.js util.js (copies / helpers).  Tools: tools/landmarksGavan-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksGavan = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, bridge: { deckY }, parts } and merges monuments /
// photo spots into ctx.services.landmarks.
// Provenance: copied verbatim from the source project 102_3d_piter, commit 0568f7af (src/world/landmarksGavan.js and landmarksGavan/*); changes for n4spb (docs/gdm-G.md): (1) a part is built when THE AREA claims its sub-group
// (layout.GROUPS.landmarksGavan), not when the module's own groups.js lists it; (2) world rules (docs/AREAS.md 13, 15.2): every fence is a breakable bay (fence.js fenceRun -> lib/fence-bays.js: the canal promenade,
// the crane fence, the town passage, the church hoarding), the canal lamps are knock records, the stair at the east mole lost its invisible guard at the water and its cheek walls are breakable ghost bays, the walk box of
// the Shkipersky bridge ends at the soffit (a boat passes under it), its rails / divider / W-beam and its wing walls are bays; solid on purpose: the walls of every building (kronshpits, MChS, guardhouse, tower, works house,
// town, fire reserve, church), the crane and the rotunda, the two trusses of the bridge, the boulders, the cheek-free stair treads.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksGavan/kit.js';
import { makeMats } from './landmarksGavan/mats.js';
import { GROUPS_LIST } from './landmarksGavan/groups.js';

const PARTS = [
  ['kron', 'gavan-kronshpits', () => import('./landmarksGavan/kron.js')],
  ['stair', 'gavan-kronshpits', () => import('./landmarksGavan/stair.js')],
  ['canal', 'gavan-canal', () => import('./landmarksGavan/canal.js')],
  ['bridge', 'gavan-bridge', () => import('./landmarksGavan/bridge.js')],
  ['harbour', 'gavan-harbour', () => import('./landmarksGavan/harbour.js')],
  ['tower', 'gavan-harbour', () => import('./landmarksGavan/tower.js')],
  ['guard', 'gavan-harbour', () => import('./landmarksGavan/guard.js')],
  ['club', 'gavan-harbour', () => import('./landmarksGavan/club.js')],
  ['town', 'gavan-workers-town', () => import('./landmarksGavan/town.js')],
  ['fire', 'gavan-fire-reserve', () => import('./landmarksGavan/fire.js')],
  ['church', 'gavan-church', () => import('./landmarksGavan/church.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksGavan';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], plaques: [], bridge: null, triangles: 0, parts: {} };
  const shared = {};
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksGavan) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const Q = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, S: shared };
    Object.assign(Q, shared);
    try {
      const m = await load();
      await m.build(Q);
    } catch (e) { console.error(`[landmarksGavan] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of Q.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksGavan] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = Q.P.tris + Q.extraTris;
    const meshes = Q.P.build(root, { name: 'lmgavan-' + name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksGavan = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.GAVAN_DEBUG) console.log('[landmarksGavan] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksGavan parts failed:\n' + failed.join('\n'));
}
