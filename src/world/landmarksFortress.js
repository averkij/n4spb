import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
import { solidPiers } from './bridges/piers.js';
// landmarksFortress - the PETER AND PAUL FORTRESS = the whole of Zayachy Island (Петропавловская крепость, Заячий остров): the main rampart (six bastions, six curtains, granite to the Neva, brick to the
// Kronverksky strait), both ravelins, the gates (Petrovsky, Ioannovsky, Nevsky + Commandant pier, Vasilievsky, Nikolsky, Kronverksky), the Peter and Paul Cathedral (bell tower, gilded spire, angel: 122.5 m),
// the Grand Ducal Burial Vault, Boathouse, Mint, Commandant's and Engineers' houses, Guardhouse, Zeughaus, Flagstaff tower (no mast: user rule), Trubetskoy prison, the cobbled square and alleys, lawns, trees,
// the beach and the banks, Shemyakin's Peter I, the Hare, the noon guns (silent props) and the two timber bridges of the island (Ioannovsky, Kronverksky).
// Dossier docs/research/fortress.md, brief docs/PETRO-BRIEF.md, photos refs/fortress.  User rules: no flags / flagpoles, no alarm sounds.
// Files: landmarksFortress/osm-data.js (generated: island ring, id lists) groups.js (claims) frame.js mats.js · walls.js (ramparts, ravelins, bartizans) · gates.js · cathedral.js · vault.js · buildings.js ·
// grounds.js (island ground, banks, beach, colliders) · bridges.js · details.js (statue, hare, guns, lamps, trees) · kit.js geo.js inst.js surfaces.js stucco.js domes.js trees.js treegeo.js leafmat.js util.js
// (copies of landmarksNikolsky).  Tools: tools/landmarksFortress-extract.mjs (osm-data.js), tools/landmarksFortress-walk.mjs (walk probe).
// Publishes ctx.services.landmarksFortress = { ring, gates, bridges, crowd, photoSpots, benches, lamps, monuments, ... } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksFortress/kit.js';
import { makeMats } from './landmarksFortress/mats.js';
import { ISLAND_RING } from './landmarksFortress/osm-data.js';

const PARTS = [
  ['grounds', () => import('./landmarksFortress/grounds.js')],
  ['walls', () => import('./landmarksFortress/walls.js')],
  ['gates', () => import('./landmarksFortress/gates.js')],
  ['cathedral', () => import('./landmarksFortress/cathedral.js')],
  ['vault', () => import('./landmarksFortress/vault.js')],
  ['buildings', () => import('./landmarksFortress/buildings.js')],
  ['bridges', () => import('./landmarksFortress/bridges.js')],
  ['details', () => import('./landmarksFortress/details.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksFortress';
  const svc = { ring: ISLAND_RING, monuments: [], photoSpots: [], entrances: [], gates: [], bridges: [], crowd: [], fences: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const failed = [];
  for (const [name, load] of PARTS) {
    const partItems=name==='bridges'?new Set(ctx.physics.items):null;
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksFortress] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksFortress] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    if(name==='bridges')solidPiers(ctx,meshes);
    if(name==='bridges')adaptPortedSolids(ctx,meshes,ctx.physics.items.filter(it=>!partItems.has(it)),'bridgesFortress');
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris: Math.round(tris), ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksFortress = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.FORT_DEBUG) console.log('[landmarksFortress] parts', JSON.stringify(svc.parts), 'tris', svc.triangles);
  if (failed.length) throw new Error('landmarksFortress parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksFortress");
}
