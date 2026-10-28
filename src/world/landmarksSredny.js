// landmarksSredny - Sredny pr. and the 18th-25th lines of Vasilievsky Island: the VASILEOSTROVSKY TRAM DEPOT and its MUSEUM (three red-brick car sheds of 1906-09 with the arched gates 1-24, the admin blocks 79A / 79B,
// the gatehouse, the Brush plot with the monument car, the Leonov bust, the yard fence, static cars), the GEOLOGICAL COMMITTEE building (Sredny 74, A. A. Poleschuk 1912-14: rusticated granite base, six-column portico,
// attic lettering, glass dome, green wings), the DOM EVANGELIA (24th line, Baptist prayer house of 1910-11, abandoned), the FRANK MANSION (21st line 8A, V. Schaub 1898-1900, Art Nouveau), the CHERNIKHOV WATER TOWER
// and the rope shop of the Red Nailer plant (1930-31, restored 2025) and the three surface pavilions of the metro station GORNY INSTITUT (2024).
// Dossier docs/research/sredny.md (+ sredny-houses.json; critic log C1..C17), brief docs/VO-BRIEF.md, plan docs/research/vo-roster.json, photos refs/sredny, requests docs/research/vo-requests-landmarksSredny.md.
// User rules: no flags / flagpoles (the Geological Committee stair flagpoles, the pennants of the museum trams are left out), no alarm sounds, summer day, plain wordmarks only.
// Files: landmarksSredny/frame.js (frames D / G / E / F / T) artA.js artB.js artC.js mats.js (every texture / material key starts with 'lmsredn-') wall.js (wall-with-openings, roofs, fences) ·
// gorny.js (the three pavilions) · tower.js · frank.js · evangelia.js · geolkom.js · depot.js (sheds, admin blocks, gatehouse) · yard.js (Brush plot, Leonov bust, fence, static cars) · groups.js (claims) ·
// kit.js geo.js inst.js surfaces.js util.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksSredny-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksSredny = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, metro: { signs: true }, parts, ... }
// and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksSredny.js and landmarksSredny/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksSredny), not when the module's own groups.js lists it; (2) lamps are knock records, fences / railings / low walls are knock bays, docs/vo-m3.md.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksSredny/parts.js';
import { makeMats } from './landmarksSredny/mats.js';
import { GROUPS_LIST } from './landmarksSredny/groups.js';

const PARTS = [
  ['gorny', 'gorny-pavilions', () => import('./landmarksSredny/gorny.js')],
  ['tower', 'chernikhov-tower', () => import('./landmarksSredny/tower.js')],
  ['frank', 'frank-mansion', () => import('./landmarksSredny/frank.js')],
  ['evangelia', 'dom-evangelia', () => import('./landmarksSredny/evangelia.js')],
  ['geolkom', 'geolkom', () => import('./landmarksSredny/geolkom.js')],
  ['depot', 'tram-depot', () => import('./landmarksSredny/depot.js')],
  ['yard', 'tram-depot', () => import('./landmarksSredny/yard.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const matsMs = Math.round(performance.now() - t0);
  const root = new THREE.Group(); root.name = 'landmarksSredny';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], plaques: [], triangles: 0, parts: {}, metro: { signs: false } };
  const shared = {};
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksSredny) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, S: shared };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksSredny] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksSredny] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name: 'lmsredn-' + name, noCast: M.noCast });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1), meshes: meshes.length };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksSredny = { ...svc, matsMs, tilesMs: M.tiles && M.tiles.ms, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.SREDNY_DEBUG) console.log('[landmarksSredny] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksSredny parts failed:\n' + failed.join('\n'));
}
