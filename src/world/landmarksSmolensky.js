// landmarksSmolensky - the SMOLENSKY ORTHODOX CEMETERY (Смоленское православное кладбище, Vasilievsky Island, 51.7 ha, founded 1738): the Church of the Smolensk Icon (A. A. Ivanov 1786-90: sky-blue walls, six-column
// portico, silver dome on a 14-bay drum, two-tier bell tower with a grey spire), the Chapel of St Xenia of Petersburg (A. A. Vseslavin 1902: pale-green walls, scaly dark tent, gilded onion; the pilgrims queue
// here all day), the Trinity memorial chapel (S. V. Samusenko 2001: a white open pavilion with a lead-grey onion), the Holy Gates with the almshouse (L. I. Rusca 1807-09: ochre-yellow, a barrel-vaulted arch
// at the end of Kamskaya st.), the Resurrection church (V. A. Demyanovsky 1901-04: Naryshkin baroque, red brick with white belts, gilded crown over an octagon), the 2.4 km fence and wall, the forest of ~7 000
// old limes, maples, birches and ashes and the graves along the alleys (instanced, generic archetypes: no invented names, only documented plaque texts).
// Dossier docs/research/smolensky.md (read with the critic log 14b), houses docs/research/smolensky-houses.json, photos refs/smolensky.  User rules: no flags / flagpoles, no alarm sounds (the church bells
// stay silent), a calm place: no skulls, no horror.
// Files: landmarksSmolensky/frame.js (frames CH GA RE XE TR, outlines, the cemetery polygon) art.js mats.js (every texture / material key starts with 'lmsmol-') stucco.js (columns, windows, pediments) ·
// church.js (Smolensk church) tower.js (its bell tower) xenia.js trinity.js gates.js resurrection.js · fence.js (bar fence, wall, cast-iron lot fence, gates) · grounds.js (forest floor, forest, bank trees, paths of
// pavers, graves) furniture.js (lamps, benches, plates, bins, flowers) · groups.js (claims) · kit.js geo.js inst.js surfaces.js util.js treegeo.js leafmat.js trees.js (copies of landmarksOktyabrsky).
// Tools: tools/landmarksSmolensky-walk.mjs (walk probe).  A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksSmolensky = { monuments, photoSpots, entrances, crowd, fences, gates,
// benches, lamps, trees, paths, triangles, parts } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksSmolensky.js and landmarksSmolensky/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksSmolensky), not
// when the module's own groups.js lists it; (2) world rules (docs/AREAS.md 13, 15.v): the 2.4 km fence and the walls (fence.js) are rows of breakable bays (lib/fence-bays.js knockBays), the lanterns, the poles, the benches and the bin
// (furniture.js) are knock records (lib/knock-furniture.js), a shrub within 14 m of water has no collider (forest.js); solid on purpose: the churches and chapels, the church shop (a building), the graves, crosses and memorials (granite
// monuments), the boulder, the trunks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksSmolensky/kit.js';
import { makeMats } from './landmarksSmolensky/mats.js';
import { GROUPS_LIST } from './landmarksSmolensky/groups.js';

const PARTS = [
  ['church', 'smolensky-church', () => import('./landmarksSmolensky/church.js')],
  ['tower', 'smolensky-church', () => import('./landmarksSmolensky/tower.js')],
  ['xenia', 'smolensky-xenia', () => import('./landmarksSmolensky/xenia.js')],
  ['trinity', 'smolensky-trinity', () => import('./landmarksSmolensky/trinity.js')],
  ['gates', 'smolensky-gates', () => import('./landmarksSmolensky/gates.js')],
  ['resurrection', 'smolensky-resurrection', () => import('./landmarksSmolensky/resurrection.js')],
  ['fence', 'smolensky-grounds', () => import('./landmarksSmolensky/fence.js')],
  ['grounds', 'smolensky-grounds', () => import('./landmarksSmolensky/grounds.js')],
  ['furniture', 'smolensky-grounds', () => import('./landmarksSmolensky/furniture.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksSmolensky';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], gates: [], benches: [], lamps: [], trees: [], paths: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksSmolensky) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksSmolensky] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksSmolensky] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    if (typeof process !== 'undefined' && process.env && process.env.SMOL_BOUNDS) {        // debug: a mesh far from its sight shows an unbalanced push / pop
      for (const k of K.P.b.values()) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < k.pos.length; i += 3) { x0 = Math.min(x0, k.pos[i]); x1 = Math.max(x1, k.pos[i]); z0 = Math.min(z0, k.pos[i + 2]); z1 = Math.max(z1, k.pos[i + 2]); } if (x1 - x0 > Number(process.env.SMOL_BOUNDS) || z1 - z0 > Number(process.env.SMOL_BOUNDS)) console.log(`[bounds] ${name} ${k.mat.name} x ${x0.toFixed(0)}..${x1.toFixed(0)} z ${z0.toFixed(0)}..${z1.toFixed(0)}`); }
    }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksSmolensky = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.SMOL_DEBUG) console.log('[landmarksSmolensky] parts', JSON.stringify(svc.parts), JSON.stringify(svc.treeStats || {}), JSON.stringify(svc.fenceStats || {}));
  if (failed.length) throw new Error('landmarksSmolensky parts failed:\n' + failed.join('\n'));
  void L;
}
