import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennyPalace - the KAMENNOOSTROVSKY PALACE COMPLEX on Kamenny Island (Каменноостровский дворец, now the "Академия талантов" school; Felten 1776-80, Quarenghi, Rusca 1808-11): the palace
// with its eight-column Tuscan river colonnade and six-column court portico, the main (parade) gate on Kamennoostrovsky prospect with the gilded cipher and crown, the church gate, the two checkpoint gates and
// the gate house on the Malaya Nevka embankment, the iron fence round the closed garden, the long kitchen block + riding hall, the gardener's house, the service-yard wall and the garden's benches and lamps.
// The garden is closed (visitor accounts, dossier 1): everything is exterior only and SOLID, the player walks the avenue, the embankment road up to the checkpoint and the church forecourt.  No flags, no flagpoles
// (the gate crown is a gilded imperial crown); nothing sounds.  Dossier docs/research/kamenny-2026.md (+ BUILD LOG), photos P02 P04 P05 P08 P09 P11 P12 P14 P17 P19 P20 P22 P23.
// Files (landmarksKamennyPalace/): frame.js (palace frame PF, heights, fence chains, gate points) art.js mats.js (every texture / material key starts with 'lmkpal-') orders.js (Tuscan column, entablature, balustrade,
// hipped roof) palace.js (body, roofs, colonnade, porch) gates.js (gate groups, fence line) service.js (kitchen block, gardener's house, yard) props.js (benches, lamps) walk.js (colliders, services) groups.js (claims)
// · kit.js geo.js facade.js objs.js (copies / helpers).  Tools: tools/landmarksKamennyPalace-walk.mjs (walk probe).  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksKamennyPalace = { monuments, photoSpots, entrances, lamps, benches, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksKamennyPalace/kit.js';
import { makeMats } from './landmarksKamennyPalace/mats.js';
import { GROUPS_LIST } from './landmarksKamennyPalace/groups.js';

const PARTS = [
  ['palace', 'kamenny-palace', () => import('./landmarksKamennyPalace/palace.js')],
  ['lodges', 'kamenny-service', () => import('./landmarksKamennyPalace/lodges.js')],
  ['gates', 'kamenny-fence', () => import('./landmarksKamennyPalace/gates.js')],
  ['service', 'kamenny-service', () => import('./landmarksKamennyPalace/service.js')],
  ['props', 'kamenny-garden', () => import('./landmarksKamennyPalace/props.js')],
  ['walk', 'kamenny-palace', () => import('./landmarksKamennyPalace/walk.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKamennyPalace';
  const svc = { monuments: [], photoSpots: [], entrances: [], lamps: [], benches: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  const shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, shared };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksKamennyPalace] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennyPalace] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKamennyPalace = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KP_DEBUG) console.log('[landmarksKamennyPalace] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksKamennyPalace parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennyPalace");
}
