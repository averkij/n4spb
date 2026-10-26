// landmarksAcademy - the IMPERIAL ACADEMY OF ARTS (Императорская Академия художеств, Университетская наб. 17; Vallin de la Mothe, Kokorinov, Felten 1764-88: 138 x 124 m, cornice 20.3 m, a
// pedimented pavilion of four free-standing columns, a bell-skirted silver dome with the gilded Minerva group, a second smaller dome with a cross on the garden side, the round court with the
// Shuvalov monument), the EGYPTIAN SPHINX PIER (Пристань с сфинксами, Thon 1831-34: two real Amenhotep III sphinxes on red-granite pedestals at the head of a stair cut into the Neva wall, four bronze
// griffins, two bronze lamp columns), the ACADEMIC GARDEN (Академический сад: the column of 1847, the Klodt and Khetagurov statues, the garden pavilion with six Doric columns, lawns and old trees,
// the cast-iron fence with its gates), TREZZINI SQUARE (площадь Трезини: the Trezzini house, the Cherkassky house in its 2023 facade banner, the Trezzini monument) and the House of Academicians.
// Dossier docs/research/academy.md (written 2026-10-07, critic-checked), photos refs/academy.  User rules: no flags / flagpoles (none on these sights), no alarm sounds.
// Files: landmarksAcademy/frame.js (the block frame ACAD / W / M, outline, heights) art.js mats.js (every texture / material key starts with 'lmacade-') · academy.js (walls, cornice, roofs, colliders)
// front.js (central pavilion: podium, portico, pediment, attic) dome.js (dome stack, Minerva, rear dome) rear.js (rear central pavilion, corner pavilions) court.js (round court, Shuvalov)
// · pier.js (pit, stairs, benches, pedestals, lamp columns) sculpt.js (sphinx, griffin, statues) · garden.js · square.js · dom.js · orders.js (pilaster, columns, entablature, balusters)
// · groups.js (claims, WATER_RINGS, KEEP_OUT, PAVED_RINGS) · kit.js geo.js inst.js shell.js prims.js surfaces.js trees.js treegeo.js leafmat.js util.js (copies).
// Tools: tools/landmarksAcademy-walk.mjs (walk probe).  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksAcademy = { monuments, photoSpots, entrances, crowd, fences, gates, benches, lamps, trees, parts } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksAcademy.js and landmarksAcademy/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksAcademy; Admiralty-Haymarket claims
// 'academy-of-arts' and 'sphinx-pier' only: the garden, Trezzini Square and the House of Academicians lie outside its data), not when the module's own groups.js lists it; (2) the pier railings and the benches are knock bays / knock records
// (docs/AREAS.md 13.7, 15.z); (3) water ring / keep-out hand-over through the area table WATER.ownerRings / keepOut (environment/waterways.js).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksAcademy/kit.js';
import { makeMats } from './landmarksAcademy/mats.js';
import { GROUPS_LIST } from './landmarksAcademy/groups.js';

const PARTS = [
  ['academy', 'academy-of-arts', () => import('./landmarksAcademy/academy.js')],
  ['pier', 'sphinx-pier', () => import('./landmarksAcademy/pier.js')],
  ['garden', 'academic-garden', () => import('./landmarksAcademy/garden.js')],
  ['square', 'trezzini-square', () => import('./landmarksAcademy/square.js')],
  ['dom', 'dom-akademikov', () => import('./landmarksAcademy/dom.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksAcademy';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], gates: [], benches: [], lamps: [], trees: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksAcademy) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksAcademy] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksAcademy] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksAcademy = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.ACAD_DEBUG) console.log('[landmarksAcademy] parts', JSON.stringify(svc.parts), 'failed', JSON.stringify(svc.failed || []), 'monuments', svc.monuments.length, 'trees', svc.trees.length, 'gates', svc.gates.length, 'fences', svc.fences.length);
  if (failed.length) throw new Error('landmarksAcademy parts failed:\n' + failed.join('\n'));
  void L;
}
