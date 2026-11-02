// landmarksF - Kazan Cathedral (Voronikhin, 1801-11) with its colonnade, pavilions, porticos and dome, the Kazan Square garden (fountain, lawns, hedges, Kutuzov and Barclay de Tolly monuments),
// the Voronikhin garden with its fence and the 1809 fountain, and Singer House (Dom Knigi, Nevsky 28).  Based on docs/research/kazan-cathedral.md (+ west-nevsky-2, west-life-furniture) and the photos
// refs/kazan.  Files: landmarksF/frame.js (cathedral frame) mats.js prims.js kit.js · cathedral.js (colonnade.js pavilion.js portico.js body.js dome.js interior.js) · garden.js · voronikhin.js · singer.js · groups.js.
// Stage 2 (interior.js): the walkable interior of the cathedral through the open west door (nave, aisles, granite columns, vaults, dome, iconostasis, indoor light zone 'kazan-interior').
// Claims every sub-group of layout.GROUPS.landmarksF.  Publishes ctx.services.landmarksF and merges monuments / photo spots into ctx.services.landmarks.  NO flags / flagpoles, no alarm sounds (user rules).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksF/kit.js';
import { makeMats } from './landmarksF/mats.js';

const PARTS = [
  ['cathedral', () => import('./landmarksF/cathedral.js')],
  ['garden', () => import('./landmarksF/garden.js')],
  ['voronikhin', () => import('./landmarksF/voronikhin.js')],
  ['singer', () => import('./landmarksF/singer.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksF';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], benches: [], triangles: 0, parts: {} };
  const failed = [];
  const cutouts = new Set([M.pickets, M.voron, M.mist, M.jetW]);
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, cols: [], extraTris: 0, interior: false };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksF] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksF] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (cutouts.has(m.material) || m.material.name==='sg-globe') ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  svc.benchPoints = (svc.benchPoints || []).concat((svc.vorBenches || []).map((b) => ({ x: b.x, z: b.z })));        // benches drawn here: props could skip the OSM benches at these points
  ctx.services.landmarksF = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (failed.length) throw new Error('landmarksF parts failed:\n' + failed.join('\n'));
}
