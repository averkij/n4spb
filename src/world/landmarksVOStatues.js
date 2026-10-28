// landmarksVOStatues - the monuments, busts, sculptures and fountains of Vasilievsky Island that no other module draws (docs/research/vo-statues-2026.md = the merged and critic-checked dossier; the BUILD LOG at its end).
// Each monument is a PIECE (run.js): modelled once in a local frame with the figure kit (lib/figures.js: bronze / stone figures, busts, animals) and hand-built forms (solids.js), put at its OSM position as small meshes that the
// engine merges per cell and hides by size class (a monument costs no draw call of its own; plain surfaces share ONE vertex-colour material, mats.js).  Colliders: plinths and basins are solid.  Name plates carry the
// real texts (platetext.js, reserved in ctx.services.labels).  Parts are built only when their claim is on in groups.js (no double drawing).
// User rules: no flags / flagpoles (the faculty pole and the white flag of "Gogol's armoured car" are NOT drawn), no alarm sounds, no bells (the churches are silent), no logos.
// Files: landmarksVOStatues/ kit.js objs.js solids.js (collector, piece sets, solids)  mats.js plates.js platetext.js (materials, plate atlas, texts)  run.js (piece runner)  groups.js (claims)
//   openbook.js musa.js ... (one file per site or kind, each exports PIECES)  churches.js.   Tools: tools/landmarksVOStatues-*.mjs.
// Publishes ctx.services.landmarksVOStatues = { monuments, photoSpots, drawn (OSM ids drawn), triangles, parts, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksVOStatues.js and landmarksVOStatues/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksVOStatues), not when the module's own groups.js lists it; (2) the claims Map is built from the area's groups (the vo-musa-jalil group lies 270 m outside the territory and is not claimed here), docs/vo-m3.md.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { makeMats } from './landmarksVOStatues/mats.js';
import { placePiece } from './landmarksVOStatues/run.js';
import { GROUPS_LIST } from './landmarksVOStatues/groups.js';

// claim key -> part file (the file exports PIECES; a piece is placed when its id is in the claim; or build(K) for the churches)
const F = (name) => () => import(`./landmarksVOStatues/${name}.js`);
const PARTS = [
  ['vo-open-book', F('openbook')], ['vo-musa-jalil', F('musa')], ['vo-lenin-55a', F('lenin')], ['vo-lenin-pokrovskaya', F('lenin')], ['vo-fire-memorial', F('fire')], ['vo-spasovich', F('fire')],
  ['vo-polar', F('polar')], ['vo-zmei', F('zmei')], ['vo-pavlov', F('monuments')], ['vo-komitas', F('monuments')], ['vo-karpinsky', F('monuments')], ['vo-peter-fountain', F('fountain')],
  ['vo-church-armenian', F('churches')], ['vo-church-spyridon', F('churches')], ['vo-church-magdalene', F('churches')], ['vo-church-alexander', F('churches')],
  ['vo-garden-y1', F('park1')], ['vo-garden-y1', F('park2')], ['vo-garden-y2', F('park3')], ['vo-garden-gs', F('park3')], ['vo-garden-mb', F('park3')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksVOStatues';
  const svc = { monuments: [], photoSpots: [], drawn: [], triangles: 0, parts: {}, failed: [] };
  const claims = new Map(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksVOStatues) || GROUPS_LIST).map((g) => [g.key, new Set([...(g.ids || []), ...(g.osm || [])])]));
  const labels = ctx.services.labels || null;
  const K = { ctx, M, root, svc, labels, THREE, claims };
  for (const [key, load] of PARTS) {
    const ids = claims.get(key);
    if (!ids) continue;                                                    // built only when the claim is on: no double drawing with the generic city
    try {
      const m = await load();
      if (m.PIECES) for (const pc of m.PIECES) { if (!ids.has(pc.id)) continue; try { placePiece(K, pc); } catch (e) { console.error(`[landmarksVOStatues] ${key}/${pc.key} failed:`, e); svc.failed.push(`${key}/${pc.key}: ${e && e.stack || e}`); } }
      if (m.build) await m.build({ ...K, ids, key });
    } catch (e) { console.error(`[landmarksVOStatues] ${key} failed:`, e); svc.failed.push(`${key}: ${e && e.stack || e}`); }
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksVOStatues = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.VOS_DEBUG) console.log('[landmarksVOStatues] parts', JSON.stringify(svc.parts), 'tris', svc.triangles, 'drawn', svc.drawn.length);
  if (svc.failed.length) throw new Error('landmarksVOStatues parts failed:\n' + svc.failed.join('\n'));
}
