import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksAurora - PETROVSKAYA and PETROGRADSKAYA embankments (Petrograd side): the cruiser AURORA at her eternal mooring in the Bolshaya Nevka (hull, three funnels, two masts, guns,
// boats, gangway, mooring barrels; all grey as since 2016, NO flags), the NAKHIMOV NAVAL SCHOOL (the Peter the Great City School of 1909-12: blue and white Petrine baroque, tower with the
// spire and the ship), the CABIN OF PETER THE GREAT (the red-brick case of 1844 in its fenced garden, the bronze bust), the SHI-TSZA descent (two Manchurian granite lions at the stairs
// to the Neva) and the fleet monument on the corner lawn.
// Dossier docs/research/aurora.md (+ aurora-houses.json for the houses around that `city` draws), brief docs/PETRO-BRIEF.md, photos SP/refs/aurora, requests to the water / city owners in
// docs/research/petro-requests-landmarksAurora.md.  User rules: no flags / flagpoles (bare staffs on the ship), no alarm sounds.
// Files: landmarksAurora/frame.js (ship / lions frames, OSM points) mats.js · hull.js (hull form) ship.js · school.js · cabin.js · lions.js · quay.js (monuments) · groups.js (claims) ·
// kit.js geo.js inst.js roofs.js (copies of landmarksNewHolland).
// Publishes ctx.services.landmarksAurora = { monuments, photoSpots, entrances, crowd, fences, benches, ship, ... } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { LOD } from '../core/lod.js';
import { SHIP } from './landmarksAurora/frame.js';
import { buildFarShip } from './landmarksAurora/far.js';
import { Parts } from './landmarksAurora/kit.js';
import { makeMats } from './landmarksAurora/mats.js';

const PARTS = [
  ['ship', () => import('./landmarksAurora/ship.js')],
  ['school', () => import('./landmarksAurora/school.js')],
  ['cabin', () => import('./landmarksAurora/cabin.js')],
  ['lions', () => import('./landmarksAurora/lions.js')],
  ['quay', () => import('./landmarksAurora/quay.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksAurora';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], triangles: 0, parts: {} };
  const failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksAurora] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksAurora] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) {
      if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
      // The closed low-detail mass stays underneath; fine ship detail is local.
      if (name === 'ship') LOD.add(m, SHIP.x, SHIP.z, 90, 180);
    }
    svc.triangles += tris; svc.parts[name] = { tris: Math.round(tris), ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksAurora = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.AU_DEBUG) console.log('[landmarksAurora] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksAurora parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksAurora");
  buildFarShip(ctx);
}
