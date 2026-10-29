// landmarksMakarova - the MAKAROVA EMBANKMENT and its neighbours (docs/research/makarova.md, docs/VO-BRIEF.md): the Yakovlev houses (nos. 14 and 16/2) with the Stenbock-Fermor house no. 12 (A. Melnikov 1823-26, V. Zeidler
// 1900-01), the Church of St Catherine at the Tuchkov Bridge (A. Mikhailov 1811-23, bell tower 1861-63), the Lions pier (Спуск со львами, 1806-09), the Lutheran Church of St Catherine (Yu. Felten 1768-71), the Lutheran
// Church of St Michael (K. Bulmering 1871-76) and the two oval glazed pavilions (exits 6 and 7) of the metro station Sportivnaya-2 (2015).
// Why they are rebuilt: the generic city draws each of them as a window-grid box with a baked height that is wrong (levels x 3.3), the Lions pier is land at street level, exit 6 is a solid shell with no door.
// Files: landmarksMakarova/frame.js (frames R C P E M S6 S7 B + footprint rings) art.js mats.js (every texture / material key starts with 'lmMak-') · sport.js (Sportivnaya-2 pavilions) · lions.js lionfig.js (the pier, the
// two lions) · catherine.js (the church, tower, drum, dome, chapels, fence) · row.js (the Yakovlev houses, no. 12, domes) · lutheran.js (Lutheran St Catherine) · michael.js (St Michael) ·
// groups.js (claims, WATER_RINGS, KEEP_OUT, PAVED_RINGS) · kit.js util.js inst.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksMakarova-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js (flip a claim on together with its part).  Publishes ctx.services.landmarksMakarova = { monuments, photoSpots, entrances, crowd, fences, benches, metro, triangles,
// parts } and merges monuments / photo spots into ctx.services.landmarks.  User rules: no flags / flagpoles, no alarm sounds.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksMakarova.js and landmarksMakarova/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksMakarova), not when the module own groups.js lists it;
// (2) benches / bins / lamps are knock records, fences / railings / parapets / low walls are breakable bays, the water-side items keep the water reachable (docs/AREAS.md 13.7, docs/vo-m2.md); (3) the water rings / keep-outs / paved rings go to the area through src/areas/vasilyevsky/rings.js.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksMakarova/parts.js';
import { makeMats } from './landmarksMakarova/mats.js';
import { GROUPS_LIST } from './landmarksMakarova/groups.js';

const PARTS = [
  ['sport', 'sportivnaya2', () => import('./landmarksMakarova/sport.js')],
  ['lions', 'lions-pier', () => import('./landmarksMakarova/lions.js')],
  ['catherine', 'catherine-church', () => import('./landmarksMakarova/catherine.js')],
  ['row', 'makarova-row', () => import('./landmarksMakarova/row.js')],
  ['lutheran', 'lutheran-catherine', () => import('./landmarksMakarova/lutheran.js')],
  ['michael', 'lutheran-michael', () => import('./landmarksMakarova/michael.js')],
  ['brullov', 'brullov-house', () => import('./landmarksMakarova/brullov.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const matsMs = Math.round(performance.now() - t0);
  const root = new THREE.Group(); root.name = 'landmarksMakarova';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], metro: null, triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksMakarova) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksMakarova] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksMakarova] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name, noCast: M.noCast });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1), meshes: meshes.length };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksMakarova = { ...svc, matsMs, tilesMs: M.tiles && M.tiles.ms, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.MAK_DEBUG) console.log('[landmarksMakarova] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksMakarova parts failed:\n' + failed.join('\n'));
  void L;
}
