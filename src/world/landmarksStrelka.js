// landmarksStrelka - the Spit of Vasilievsky Island (Стрелка Васильевского острова): the Old Stock Exchange (Thomas de Thomon, 1805-10) on its granite podium, the two Rostral columns with their
// prows and seated river gods, Birzhevaya Square (the column platforms), the semicircular garden with the clipped limes, the anchor and the memorial sign, the granite descent (ramps, landing,
// spheres, lion masks), the North and South warehouses (Zoological Museum) and the Customs house (Pushkin House) with its dome and the bust of Pushkin.
// Dossier docs/research/strelka.md (+ strelka-houses.json), brief docs/PETRO-BRIEF.md, photos refs/strelka, requests to the other owners docs/research/petro-requests-landmarksStrelka.md.
// User rules: no flags / flagpoles (the Exchange ridge and the Customs house normally carry one: omitted), no fire in the bowls of the columns, no alarm sounds.
// Files: landmarksStrelka/frame.js (the ensemble frame: +z = the axis of the Exchange toward the tip) mats.js prims.js kit.js inst.js surfaces.js · exchange.js · rostral.js (+ prows.js, statues.js) ·
// square.js · garden.js · descent.js · warehouses.js · customs.js · groups.js (claims + DESCENT_RING).
// Publishes ctx.services.landmarksStrelka = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, descent, parts, triangles } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksStrelka.js and landmarksStrelka/*); changes for n4spb (docs/vo-m1.md): (1) a part is built when THE AREA claims its sub-group
// (layout.GROUPS.landmarksStrelka, fallback groups.js GROUPS_LIST); (2) groups.js hands the descent ring (DESCENT_RING) and the Spit keep-out (hard-coded in the source waterways.js) to the area tables WATER.ownerRings / keepOut;
// (3) the world rules (docs/AREAS.md 13.7, 15.2): benches / lamps / bollards are knock records, the garden hedge, the chain round the columns and the descent parapets are breakable bays, no invisible guard at the water.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksStrelka/kit.js';
import { makeMats } from './landmarksStrelka/mats.js';
import { GROUPS_LIST } from './landmarksStrelka/groups.js';

const PARTS = [
  ['exchange', () => import('./landmarksStrelka/exchange.js'), 'exchange', 'exchange'],
  ['rostral', () => import('./landmarksStrelka/rostral.js'), 'rostral', 'rostral-columns'],
  ['garden', () => import('./landmarksStrelka/garden.js'), 'garden', 'strelka-garden'],
  ['descent', () => import('./landmarksStrelka/descent.js'), 'descent', 'strelka-descent'],
  ['warehouses', () => import('./landmarksStrelka/warehouses.js'), 'warehouses', 'exchange-warehouses'],
  ['customs', () => import('./landmarksStrelka/customs.js'), 'customs', 'customs-house'],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksStrelka';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksStrelka) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, load, fn, key] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m[fn](K);
    } catch (e) { console.error(`[landmarksStrelka] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksStrelka] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name: 'lmSt-' + name });
    for (const m of meshes) if (M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksStrelka = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.STRELKA_DEBUG) console.log('[landmarksStrelka] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksStrelka parts failed:\n' + failed.join('\n'));
}
