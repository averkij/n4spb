// landmarksDekabristov - the memorial and green places of DEKABRISTOV ISLAND (area dekabristov, map k51): the Smolensky LUTHERAN cemetery (the old German cemetery: fence, alleys, old trees, graves, the tombs of the data, the
// Bekman tomb pavilion, the plaque to Essen-Stenbock-Fermor), the Smolensky ARMENIAN cemetery (the church of the Resurrection is landmarksVOStatues: not drawn here), the memorial cemetery of the SIEGE "Остров Декабристов"
// (the obelisk, the Shch-323 submarine memorial, the ChAES memorial, eight mass graves on lawn mounds), the DECEMBRISTS' GARDEN (alleys, lawn, trees, benches, the fenced obelisk to the executed Decembrists, the children's
// memorial) and the SQUARE OF ALEXANDER VOLODIN with the LIGHT-AND-MUSIC FOUNTAIN (a round basin of shallow water, walkable and drivable, a ring of breakable ghost bays, jets and floor lights).
// Authored for n4spb from the data of the area (the real OSM ids, docs/research/dekabristov-data.md) after the pattern of landmarksSmolensky and landmarksAndrew; NO source-project module exists for this island (docs/gdm-D1.md).
// Files: landmarksDekabristov/ groups.js (claims, PAVED_RINGS)  sites.js (the site records)  site.js plan.js plots.js fence.js furniture.js (the common ground work)  lutheran.js armenian.js siege.js garden.js volodin.js (the parts)
//   mon.js (monument vocabulary)  mats.js art.js data.js  kit.js geo.js util.js surfaces.js inst.js treegeo.js leafmat.js forest.js floor.js atlas.js gravemat.js gravearch.js gravefield.js (copies of landmarksSmolensky, see their headers).
// Publishes ctx.services.landmarksDekabristov = { monuments, photoSpots, crowd, fences, gates, benches, lamps, trees, paths, triangles, parts } and merges monuments / photo spots into ctx.services.landmarks.
// WORLD RULES (docs/AREAS.md 13, 15.2): every fence, railing, wall and gate gap is a row of breakable bays (lib/fence-bays.js knockBays); benches, litter bins and lanterns are knock records (lib/knock-furniture.js); the fountain
// basin is physics water (addWater) with a ghost-bay rim; a trunk or a grave never stands within 9 m of water.  Solid on purpose: the tombs, crypt, pavilion, obelisks and memorial walls, steles, graves (granite monuments), trunks.
// Provenance: the copied helper files carry their own header lines; the rest is new.  A part is built only when THE AREA claims its sub-group (layout.GROUPS.landmarksDekabristov), not when groups.js lists it.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksDekabristov/kit.js';
import { makeMats } from './landmarksDekabristov/mats.js';
import { GROUPS_LIST } from './landmarksDekabristov/groups.js';

const PARTS = [
  ['lutheran', 'dek-lutheran', () => import('./landmarksDekabristov/lutheran.js')],
  ['armenian', 'dek-armenian', () => import('./landmarksDekabristov/armenian.js')],
  ['siege', 'dek-siege', () => import('./landmarksDekabristov/siege.js')],
  ['garden', 'dek-garden', () => import('./landmarksDekabristov/garden.js')],
  ['volodin', 'dek-volodin', () => import('./landmarksDekabristov/volodin.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksDekabristov';
  const svc = { monuments: [], photoSpots: [], crowd: [], fences: [], gates: [], benches: [], lamps: [], trees: [], paths: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksDekabristov) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksDekabristov] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksDekabristov] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name: 'lmdek-' + name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksDekabristov = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.DEK_DEBUG) console.log('[landmarksDekabristov] parts', JSON.stringify(svc.parts), JSON.stringify(svc.treeStats || {}), JSON.stringify(svc.fenceStats || {}), JSON.stringify(svc.plotStats || {}));
  if (failed.length) throw new Error('landmarksDekabristov parts failed:\n' + failed.join('\n'));
  void L;
}
