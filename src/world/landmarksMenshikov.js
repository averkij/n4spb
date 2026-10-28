// landmarksMenshikov - the MENSHIKOV PALACE (Меншиковский дворец, Universitetskaya nab. 15: three storeys of chrome-yellow plaster, cream pilasters, two crowned risalit gables, the four-column portico under the
// iron-railed balcony, the dark mansard with dormers), the FIRST CADET CORPS (Здание Первого кадетского корпуса, Kadetskaya line 1-3: the 427 m two-storey salmon ribbon with the porticoes of Ionic
// columns, the 1938 four-pair south portico, arched ground-floor windows, red-brick chimneys), the RUMYANTSEV GARDEN (Румянцевский сад: black cast-iron fence on a granite plinth, gravel Greek-cross alleys,
// the 21.3 m granite OBELISK «Румянцова победамъ», two cast-iron fountains, the busts of Surikov and Repin, the music pavilion, limes and oaks) and the RUMYANTSEVSKY DESCENT (a 141 m cobbled apron below the
// embankment behind a pink granite wall with the ring-and-meander railing, a river-tram pontoon).
// Dossier docs/research/menshikov.md (researched and critic-checked 2026-10-07), photos refs/menshikov.  User rules: no flags / flagpoles (none exist on these sights), no alarm sounds.
// Files: landmarksMenshikov/frame.js (frames PF palace / KF Corps / GF garden / DF descent, heights) art.js mats.js (every texture / material key starts with 'lmmensh-') facade.js (plaster panels with real
// openings, pilasters, cornices) · palace.js · forecourt.js (palace fence, hedge, gates, lawns, paths, courts) · corps.js · garden.js · monuments.js (obelisk, fountains, busts, pavilion) · descent.js · groups.js (claims and the hand-over to environment) ·
// kit.js geo.js inst.js surfaces.js trees.js treegeo.js leafmat.js util.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksMenshikov-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksMenshikov = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, trees, parts } and merges monuments / photo spots
// into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksMenshikov.js and landmarksMenshikov/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksMenshikov), not when the module own groups.js lists it;
// (2) benches / bins / lamps are knock records, fences / railings / parapets / low walls are breakable bays, the water-side items keep the water reachable (docs/AREAS.md 13.7, docs/vo-m2.md); (3) the water rings / keep-outs / paved rings go to the area through src/areas/vasilyevsky/rings.js.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksMenshikov/kit.js';
import { makeMats } from './landmarksMenshikov/mats.js';
import { GROUPS_LIST } from './landmarksMenshikov/groups.js';

const PARTS = [
  ['palace', 'menshikov-palace', () => import('./landmarksMenshikov/palace.js')],
  ['forecourt', 'menshikov-palace', () => import('./landmarksMenshikov/forecourt.js')],
  ['corps', 'first-cadet-corps', () => import('./landmarksMenshikov/corps.js')],
  ['garden', 'rumyantsev-garden', () => import('./landmarksMenshikov/garden.js')],
  ['monuments', 'rumyantsev-garden', () => import('./landmarksMenshikov/monuments.js')],
  ['descent', 'rumyantsevsky-descent', () => import('./landmarksMenshikov/descent.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksMenshikov';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], trees: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksMenshikov) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  const shared = {};                                                     // data handed from one part to the next (the palace edges, the garden paths ...)
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, shared };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksMenshikov] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksMenshikov] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksMenshikov = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.MEN_DEBUG) console.log('[landmarksMenshikov] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksMenshikov parts failed:\n' + failed.join('\n'));
  void L;
}
