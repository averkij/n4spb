// landmarksMining - the MINING UNIVERSITY (Горный университет, A. N. Voronikhin 1806-11: the twelve-column Doric portico of the Paestum order on a granite stair, the pale lemon-yellow wings with green
// copper roofs bending with the river, the two travertine groups of Pluto / Proserpine and Hercules / Antaeus on the stair cheeks, the iron-chained bollards, the two teal five-lantern lamps), the two granite
// DESCENTS of the Lieutenant Schmidt embankment in front of it and at the Krasin berth, and the museum icebreaker KRASIN (Armstrong Whitworth 1916-17, rebuilt in Wismar 1953-60: black hull, green boot-top,
// cream superstructure with the rounded bridge house, one broad funnel with a red band, the lattice foremast, orange boats, the steep lettered gangway) with its quay terrace, the Amundsen bust and the benches.
// Dossier docs/research/mining.md (critic-checked 2026-10-07: heights of the ship, hull axis, back-wall pilasters, claims), photos refs/mining, requests docs/research/vo-requests-landmarksMining.md.
// User rules: no flags / flagpoles (the real building carries four at the stair end and the ship a stern staff: omitted), no sirens / horns, the Soviet emblems (frieze orders, funnel emblem) are a lead decision: omitted.
// Files: landmarksMining/frame.js (frames P and S, heights, ring) art.js mats.js (every texture / material key starts with 'lmMin-') · portico.js (stair, cheeks, columns, entablature, pediment, eagle, gallery) ·
// wings.js (links, wings, ranges, roofs, plaques, rear range) · sculpt.js (the two groups) · street.js (bollards + chains, ornate lamps, forecourt paving) · descents.js (D1, D2) · ship.js (the Krasin) ·
// terrace.js (quay terrace, bust, benches, lawn kerb, lift-gate fence) · groups.js (claims, WATER_RINGS, KEEP_OUT, PAVED_RINGS) · kit.js shell.js prims.js surfaces.js plaques.js (copies).
// A part is built only when its claim key is in groups.js (MINING_ALL=1 forces every part: development).  Tools: tools/landmarksMining-walk.mjs, tools/landmarksMining-houses.mjs.
// Publishes ctx.services.landmarksMining = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, bollards, parts, triangles } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksMining.js and landmarksMining/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksMining), not when the module own groups.js lists it;
// (2) benches / bins / lamps are knock records, fences / railings / parapets / low walls are breakable bays, the water-side items keep the water reachable (docs/AREAS.md 13.7, docs/vo-m2.md); (3) the water rings / keep-outs / paved rings go to the area through src/areas/vasilyevsky/rings.js.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksMining/kit.js';
import { makeMats } from './landmarksMining/mats.js';
import { GROUPS_LIST } from './landmarksMining/groups.js';

const PARTS = [
  ['portico', 'mining-university', () => import('./landmarksMining/portico.js')],
  ['wings', 'mining-university', () => import('./landmarksMining/wings.js')],
  ['sculpt', 'mining-university', () => import('./landmarksMining/sculpt.js')],
  ['street', 'mining-university', () => import('./landmarksMining/street.js')],
  ['descents', 'mining-descents', () => import('./landmarksMining/descents.js')],
  ['ship', 'krasin', () => import('./landmarksMining/ship.js')],
  ['terrace', 'krasin', () => import('./landmarksMining/terrace.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksMining';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], bollards: 0, triangles: 0, parts: {} };
  const force = typeof process !== 'undefined' && process.env && process.env.MINING_ALL === '1';
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksMining) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!force && !claimed.has(key)) continue;                         // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksMining] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksMining] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name: 'lmMin-' + name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksMining = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.MINING_DEBUG) console.log('[landmarksMining] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksMining parts failed:\n' + failed.join('\n'));
}
