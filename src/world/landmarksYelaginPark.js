import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginPark - the SIGHTS OF THE YELAGIN ISLAND PARK (Central Park of Culture and Leisure named after Kirov): the Farnese HERCULES on the cape of the 4th Southern pond, the KIROV BUST
// with its hostas and salvia bed at the gate of the 2nd Yelagin bridge, the timber-wave ESTRADNY THEATRE (two glulam canopies with terraced seating, the arena floor, the stage), the octagonal
// METRO VENT PAVILION, the BOAT PIERS of the 4th Northern and 2nd Southern ponds (with pedal catamarans), the passenger DOCK "Елагин остров" on the Srednyaya Nevka, the carved wooden BEAR with an
// accordion in its round bed, and (once its id is baked) the OPEN STAGE of the Big Square.  Ponds, lawns, trees, paths, the lattice fence, the three Yelagin bridges, the pond footbridges and the
// Rossi pavilions belong to other owners (docs/ISLANDS2-BRIEF.md); generic benches and lamps of the park are a request to the props owner (docs/research/islands2-requests-yelagin-park-module.md).
// Dossier docs/research/yelagin-park-2026.md (BUILD LOG at its end), photos refs/yelagin-park-2026 + refs/yelagin-park-build.  User rules: no flags / flagpoles, no alarm sounds, real figures (kit).
// Files: landmarksYelaginPark/frame.js (positions) kit.js (Parts collector with authored LOD ranges) mats.js plants.js physgate.js · hercules.js kirov.js theatre.js vent.js piers.js bear.js stage2.js ·
// groups.js (claims).  A part is built only when its claim key is in groups.js.  Tools: tools/landmarksYelaginPark-walk.mjs (walk probe), tools/landmarksYelaginPark-measure.mjs.
// Publishes ctx.services.landmarksYelaginPark = { monuments, photoSpots, entrances, benches, lamps, parts, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Budget: about 40 k triangles, <= 20 materials (shared with the figure kit: marble, bronze), no per-frame callbacks, every mesh registered with an authored LOD range (kit.js).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksYelaginPark/kit.js';
import { makeMats } from './landmarksYelaginPark/mats.js';
import { GROUPS_LIST } from './landmarksYelaginPark/groups.js';

const PARTS = [
  ['hercules', 'ypark-hercules', () => import('./landmarksYelaginPark/hercules.js')],
  ['kirov', 'ypark-kirov', () => import('./landmarksYelaginPark/kirov.js')],
  ['theatre', 'ypark-theatre', () => import('./landmarksYelaginPark/theatre.js')],
  ['vent', 'ypark-vent', () => import('./landmarksYelaginPark/vent.js')],
  ['piers', 'ypark-piers', () => import('./landmarksYelaginPark/piers.js')],
  ['bear', 'ypark-bear', () => import('./landmarksYelaginPark/bear.js')],
  ['stage2', 'ypark-openstage', () => import('./landmarksYelaginPark/stage2.js')],
];
const FORCE = (typeof process !== 'undefined' && process.env && process.env.YPARK_FORCE ? process.env.YPARK_FORCE.split(',') : []);   // diagnostics only: build a part whose claim is still off

let _dome = null;
const dome = () => _dome || (_dome = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2));

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksYelaginPark';
  const svc = { monuments: [], photoSpots: [], entrances: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key) && !FORCE.includes(name)) continue;                                // built only when the claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, dome };
    try {
      const m = await load();
      m.build(K);
    } catch (e) { console.error(`[landmarksYelaginPark] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksYelaginPark] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const built = K.P.build(root, { name: 'ypark-' + name });
    for (const { mesh, mat } of built) if (M.decals.has(mat) || M.cutouts.has(mat)) ctx.noOutline(mesh);
    svc.triangles += K.P.tris; svc.parts[name] = { tris: K.P.tris, meshes: built.length, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginPark = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.YPARK_DEBUG) console.log('[landmarksYelaginPark] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksYelaginPark parts failed:\n' + failed.join('\n'));
  void L;
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginPark");
}
