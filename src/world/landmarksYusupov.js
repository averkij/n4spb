// landmarksYusupov - the Yusupov Palace on the Moika (Юсуповский дворец, наб. р. Мойки 94): the 89.8 m ochre-yellow Moika front with the six-column Roman-Doric portico, the carved portal, the frieze of
// ring roundels, the attic with the coat of arms and the belvedere; the east wing with the house theatre end and the courtyard faces; the courtyard with the rusticated colonnade wall (Vallin de la Mothe),
// the curved Doric colonnade and the gate block; the garden (hill with a staircase, gravel paths, lamps, old limes) running to ulitsa Dekabristova; the garden pavilion on the street.
// Dossier docs/research/yusupov.md (+ yusupov-houses.json for the ordinary houses), brief docs/SW-BRIEF.md, photos refs/yusupov (scratchpad).  User rules: no flags / flagpoles, no alarm sounds.
// The Moika quay + railing belong to environment, road markings / plates to streets.
// Files: landmarksYusupov/frame.js (palace frame P: u along the front to the NE, d into the complex to the SE) mats.js · palace.js (front, wings, portico, portal, roofs) · courtyard.js (colonnade wall, gate
// block, fences) · garden.js (lawn, paths, hill + stairs, lamps, trees) · pavilion.js (garden pavilion + fence) · small.js (sheds) · groups.js (claims) · kit.js common.js house.js parts.js reliefs.js geo.js
// surfaces.js inst.js trees.js treegeo.js leafmat.js util.js (copies of landmarksMars).
// Publishes ctx.services.landmarksYusupov = { entrances, crowd, fences, photoSpots, lamps, benches, ... } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/landmarksYusupov.js and landmarksYusupov/*); this line is the only change.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksYusupov/kit.js';
import { makeMats } from './landmarksYusupov/mats.js';
import { makeKit } from './landmarksYusupov/common.js';

const PARTS = [
  ['courtyard', () => import('./landmarksYusupov/courtyard.js')],
  ['garden', () => import('./landmarksYusupov/garden.js')],
];
const HOUSES = [
  ['palace', () => import('./landmarksYusupov/palace.js')],
  ['pavilion', () => import('./landmarksYusupov/pavilion.js')],
  ['small', () => import('./landmarksYusupov/small.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYusupov';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], lamps: [], benches: [], triangles: 0, parts: {} };
  const failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksYusupov] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYusupov] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  // the stucco buildings use the facade vocabulary kit
  const KH = makeKit(ctx); KH.svc = svc; KH.root = root; KH.M = M;
  for (const [name, load] of HOUSES) {
    const t1 = performance.now();
    try { const m = await load(); KH.begin(); await m.build(KH, ctx); KH.flush(root, name); } catch (e) { console.error(`[landmarksYusupov] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); KH.begin(); }
    svc.parts[name] = { ms: Math.round(performance.now() - t1) };
  }
  svc.triangles += KH.tris;
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYusupov = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.YUS_DEBUG) console.log('[landmarksYusupov] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksYusupov parts failed:\n' + failed.join('\n'));
}
