import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksBotanicalGarden - the Botanical Garden of Peter the Great on Aptekarsky Island (Ботанический сад Петра Великого, Prof. Popova 2): the Komarov Botanical Institute (lit A: yellow stucco, two pairs of
// giant fluted columns over the semicircular colonnaded WEST porch, dark red roof), the Director's House (clapboard, loggia, lunette), the staff house lit B, the small garden houses, the ticket pavilion and the
// gates, the bar fence of the garden, the Japanese garden pavilion and zig-zag plank bridge, the bust of Peter I on its tree-trunk pedestal, the garden sculptures, the Stolypin obelisk and the benches / lamps
// kit of the garden.  NOT drawn here: the greenhouses and the museum (landmarksBotanicalGreenhouses), the ponds / paths / trees (environment, streets).
// Dossier docs/research/aptekarsky-2026.md (the CRITIC LOG wins; section 14 BUILD LOG), photos refs/aptekarsky (49 50 53 Institute, 43 Director, 46 workers, 54 56 Japanese garden, 84 Peter, B0 Stolypin, D9 gazebo).
// User rules: no flags / flagpoles, no alarms; statues are modelled figures (lib/figures.js).  Interiors closed: solid walls.
// Files: landmarksBotanicalGarden/frame.js (frames, ids, helpers) art.js mats.js (every texture / material key starts with 'lmbg-') shell.js (wall runs, roofs, colliders) institute.js director.js house.js houses.js houses2.js
// ticket.js gazebo.js fence.js peter.js statues.js figs.js japan.js stolypin.js furniture.js groups.js (claims)  · kit.js geo.js inst.js facade.js objs.js roof.js (copies / helpers).  Tools: tools/landmarksBotanicalGarden-walk.mjs,
// tools/landmarksBotanicalGarden-houses.mjs.  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksBotanicalGarden = { monuments, photoSpots, entrances, benches, lamps, fences, crowd, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksBotanicalGarden/kit.js';
import { makeMats } from './landmarksBotanicalGarden/mats.js';
import { GROUPS_LIST } from './landmarksBotanicalGarden/groups.js';

const PARTS = [
  ['institute', 'institute', () => import('./landmarksBotanicalGarden/institute.js')],
  ['director', 'director', () => import('./landmarksBotanicalGarden/director.js')],
  ['staff', 'staff', () => import('./landmarksBotanicalGarden/houses.js')],
  ['houses', 'houses', () => import('./landmarksBotanicalGarden/houses2.js')],
  ['ticket', 'ticket', () => import('./landmarksBotanicalGarden/ticket.js')],
  ['gazebo', 'gazebo', () => import('./landmarksBotanicalGarden/gazebo.js')],
  ['fence', 'fence', () => import('./landmarksBotanicalGarden/fence.js')],
  ['peter', 'peter', () => import('./landmarksBotanicalGarden/peter.js')],
  ['statues', 'statues', () => import('./landmarksBotanicalGarden/statues.js')],
  ['japan', 'japan', () => import('./landmarksBotanicalGarden/japan.js')],
  ['stolypin', 'stolypin', () => import('./landmarksBotanicalGarden/stolypin.js')],
  ['furniture', 'furniture', () => import('./landmarksBotanicalGarden/furniture.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksBotanicalGarden';
  const svc = { monuments: [], photoSpots: [], entrances: [], benches: [], lamps: [], fences: [], crowd: [], triangles: 0, parts: {} };
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
    } catch (e) { console.error(`[landmarksBotanicalGarden] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksBotanicalGarden] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksBotanicalGarden = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.BG_DEBUG) console.log('[landmarksBotanicalGarden] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksBotanicalGarden parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksBotanicalGarden");
}
