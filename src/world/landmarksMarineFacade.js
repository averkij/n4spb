// landmarksMarineFacade - the passenger port "Морской фасад" (Marine Facade, A-Len 2008-11: four wedge terminals with a timber-edged roof plane on a fan of inclined struts, seven covered quay galleries and the elevated
// ferry gallery, blue fenders and yellow bollards on the berth wall, 25 m floodlight masts, the security fences and gates), two moored white cruise liners (the lead's decision: no flags, no funnel logos, no
// readable names), the GOLDEN CITY quarter-6 block with the 52 m gold lattice spire (Chelyuskina 2) and the gold box crowns of its neighbours, the helipad, the roundabout, the tip hangar, the yacht marina and the two
// "Маяк" art objects (placeholder).  Scenery class: skyline and promenade only, instanced.  The port is a closed border zone: everything inside the fence is exterior only and solid.
// Dossier docs/research/marinefacade.md (+ marinefacade-houses.json), brief docs/VO-BRIEF.md, requests to the other owners docs/research/vo-requests-landmarksMarineFacade.md.
// User rules: no flags / flagpoles (the four masts in front of the terminals are left out), no alarm sounds (no ship horns, no lift-gate warning), summer day, no corporate logos or ship names.
// Files: landmarksMarineFacade/frame.js (frames F = port, G = spire tower; terminal table; quayEdge) art.js mats.js (every texture / material key starts with 'lmmarin-') · terminals.js (the wedge terminals,
// the control centre) · groups.js (claims, PAVED_RINGS, KEEP_OUT) · kit.js inst.js surfaces.js util.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksMarineFacade-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksMarineFacade = { terminals, monuments, photoSpots, entrances, crowd, fences, benches, lamps, ships, parts }
// and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied verbatim from the source project 102_3d_piter, commit 0568f7af (src/world/landmarksMarineFacade.js and landmarksMarineFacade/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group
// (ctx.L.GROUPS.landmarksMarineFacade, the fallback is the module's own GROUPS_LIST), (2) world rules (docs/AREAS.md 13, 15.v; docs/gdm-M.md): the port fences, the guard rail, the precast walls (fences.js), the thin glazed
// quay-side walls of the galleries (galleries.js) are breakable bays, the lift-gate booths and the pilot kiosks (fences.js, quay.js) and the 18 floodlight masts (masts.js) are knock records; solid on purpose: the walls of every
// building (terminals, control centre, halls, hangar, Golden City), the canopy columns, the lift towers, the liner hulls, the boulders, the Mayak columns.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksMarineFacade/kit.js';
import { makeMats } from './landmarksMarineFacade/mats.js';
import { GROUPS_LIST } from './landmarksMarineFacade/groups.js';

const PARTS = [
  ['terminals', 'mf-terminals', () => import('./landmarksMarineFacade/terminals.js')],
  ['galleries', 'mf-galleries', () => import('./landmarksMarineFacade/galleries.js')],
  ['quay', null, () => import('./landmarksMarineFacade/quay.js')],                 // no claim: the wall belongs to environment
  ['masts', 'mf-furniture', () => import('./landmarksMarineFacade/masts.js')],
  ['fences', 'mf-furniture', () => import('./landmarksMarineFacade/fences.js')],
  ['ships', null, () => import('./landmarksMarineFacade/ships.js')],
  ['goldencity', 'golden-city-spire', () => import('./landmarksMarineFacade/goldencity.js')],
  ['misc', 'mf-sheds', () => import('./landmarksMarineFacade/misc.js')],
  ['shore', 'mf-shore', () => import('./landmarksMarineFacade/shore.js')],
  ['spots', null, () => import('./landmarksMarineFacade/spots.js')],                 // photo spots (needs the terminals and the ships)
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksMarineFacade';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], ships: [], terminals: [], plates: [], counts: {}, triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksMarineFacade) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (key && !claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksMarineFacade] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksMarineFacade] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name: 'lmmarin-' + name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material) || M.unlined.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1), meshes: meshes.length };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksMarineFacade = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.MF_DEBUG) {
    const names = new Set(); root.traverse((o) => { if (o.material) names.add(o.material.name || o.material.type); });
    console.log('[landmarksMarineFacade] parts', JSON.stringify(svc.parts), JSON.stringify(svc.counts));
    console.log('[landmarksMarineFacade] materials in use', names.size, [...names].sort().join(' '));
  }
  if (failed.length) throw new Error('landmarksMarineFacade parts failed:\n' + failed.join('\n'));
}
