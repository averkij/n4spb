// landmarksNavalCorps - the Lieutenant Schmidt embankment of Vasilievsky Island between the 11th and the 16th lines: the NAVAL CADET CORPS (Морской кадетский корпус, F. I. Volkov 1796-98: 136 m cream-yellow
// front of three floors, ten-column Ionic colonnade, two flat zinc domes, the round turret), the KRUSENSTERN MONUMENT (I. N. Schroder 1873) with its granite stair in the Neva wall, the DORMITION CHURCH of the
// Optina metochion (V. A. Kosyakov 1895-97: five domes, Russian-revival brick) and the museum SUBMARINE S-189 on its floating pier.
// Dossier docs/research/navalcorps.md (+ navalcorps-houses.json), brief docs/VO-BRIEF.md, photos refs/navalcorps, requests to the other owners docs/research/vo-requests-landmarksNavalCorps.md.
// User rules: no flags / flagpoles (the turret mast, the S-189 ensign and jack staffs, the sail staffs and the relief banners of the monument are left out), no alarm sounds, summer day.
// Files: landmarksNavalCorps/frame.js (frames K = Corps / monument / stair, C = church, S = submarine; the baked ring) art.js mats.js (every texture / material key starts with 'lmnaval-') facade.js (walls with
// openings, hoods, cornice) · corps.js (shell, front, roofs, plaques, colliders) colonnade.js (ten Ionic columns, central block) top.js (attics, flat domes, turret, the unmapped skyline behind) ·
// stair.js (the stair in the Neva wall, tumba, end blocks, paved terrace) monument.js figure.js (railing, pedestal, plates, the bronze admiral) · church.js domes.js (Dormition church and its five domes)
// fronthouse.js (the compound front house, the gate portal, the fence of 1900) · sub.js (S-189, her pier, gangway, tents) · groups.js (claims, hand-over rings) ·
// kit.js geo.js inst.js surfaces.js util.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksNavalCorps-walk.mjs (walk probe), tools/landmarksNavalCorps-figs.mjs (figure sheet).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksNavalCorps = { corps, monuments, photoSpots, entrances, crowd, fences, benches, lamps, plaques, parts }
// and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksNavalCorps.js and landmarksNavalCorps/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksNavalCorps), not when the module own groups.js lists it;
// (2) benches / bins / lamps are knock records, fences / railings / parapets / low walls are breakable bays, the water-side items keep the water reachable (docs/AREAS.md 13.7, docs/vo-m2.md); (3) the water rings / keep-outs / paved rings go to the area through src/areas/vasilyevsky/rings.js.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksNavalCorps/kit.js';
import { makeMats } from './landmarksNavalCorps/mats.js';
import { GROUPS_LIST } from './landmarksNavalCorps/groups.js';

const PARTS = [
  ['corps', 'naval-corps', () => import('./landmarksNavalCorps/corps.js')],
  ['colonnade', 'naval-corps', () => import('./landmarksNavalCorps/colonnade.js')],
  ['top', 'naval-corps', () => import('./landmarksNavalCorps/top.js')],
  ['stair', 'krusenstern', () => import('./landmarksNavalCorps/stair.js')],
  ['monument', 'krusenstern', () => import('./landmarksNavalCorps/monument.js')],
  ['church', 'dormition', () => import('./landmarksNavalCorps/church.js')],
  ['fronthouse', 'dormition', () => import('./landmarksNavalCorps/fronthouse.js')],
  ['sub', 's189', () => import('./landmarksNavalCorps/sub.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksNavalCorps';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], plaques: [], triangles: 0, parts: {} };
  const shared = {};
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksNavalCorps) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const Q = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, S: shared };
    Object.assign(Q, shared);
    try {
      const m = await load();
      await m.build(Q);
    } catch (e) { console.error(`[landmarksNavalCorps] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    Object.assign(shared, { corps: Q.corps || shared.corps });
    for (const k of Q.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksNavalCorps] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = Q.P.tris + Q.extraTris;
    const meshes = Q.P.build(root, { name: 'lmnaval-' + name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksNavalCorps = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.NAVAL_DEBUG) console.log('[landmarksNavalCorps] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksNavalCorps parts failed:\n' + failed.join('\n'));
}
