import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKronverk - the KRONVERK and ALEXANDER PARK (Кронверк, Александровский парк): the Arsenal = the Artillery Museum (red-brick horseshoe of 1850-60 with the crenellated end pavilions, the main gate
// and the south wall), its open-air display (guns, self-propelled guns, rocket launchers, missiles: silent props), the Decembrists obelisk, the two granite Artillery bridges over the mouths of the moat,
// the Gorkovskaya metro pavilion ("flying saucer"), the Steregushchy monument, the grotto, the bronze mini-city, the "Architects" group and the apostle Peter, the Narodny Dom row (Baltic House, Planetarium,
// Music Hall, Velikan Park), the Zoo entrance pavilion, the Orthopaedic Institute, park lamps and benches.
// Dossier docs/research/kronverk.md (+ kronverk-houses.json), brief docs/PETRO-BRIEF.md, photos refs/kronverk.  User rules: no flags / flagpoles (the museum roof and the theatres normally carry them: omitted),
// no alarm sounds (the exhibits are silent).
// Files: landmarksKronverk/groups.js (claims) frame.js mats.js house.js · arsenal.js · display.js (exhibit kit + placement) · park.js (obelisk, bridges, monuments, furniture) · gorkovskaya.js · narodny.js ·
// zoo.js (entrance pavilion + the picket fences) · kit.js geo.js surfaces.js (copies of landmarksFortress).  Tools: tools/landmarksKronverk-walk.mjs (walk probe), tools/landmarksKronverk-houses.mjs (houses table).
// The generic park (lawns, trees, alleys), the OSM benches (props) and the OSM lamps (streets) are NOT redrawn here.
// Publishes ctx.services.landmarksKronverk = { monuments, photoSpots, entrances, gates, metro, exhibits, benches, lamps, crowd, fences, bridges, ... } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksKronverk/kit.js';
import { makeMats } from './landmarksKronverk/mats.js';
import { GROUPS_LIST } from './landmarksKronverk/groups.js';

// a part is built only when its claim key is present in groups.js (flip a claim on together with its part)
const PARTS = [
  ['arsenal', 'kronverk-arsenal', () => import('./landmarksKronverk/arsenal.js')],
  ['display', 'kronverk-display', () => import('./landmarksKronverk/display.js')],
  ['park', 'alexander-park', () => import('./landmarksKronverk/park.js')],
  ['gorkovskaya', 'gorkovskaya-pavilion', () => import('./landmarksKronverk/gorkovskaya.js')],
  ['narodny', 'narodny-dom', () => import('./landmarksKronverk/narodny.js')],
  ['zoo', 'zoo-entrance', () => import('./landmarksKronverk/zoo.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKronverk';
  const svc = { monuments: [], photoSpots: [], entrances: [], gates: [], crowd: [], fences: [], benches: [], lamps: [], exhibits: [], bridges: [], metro: null, triangles: 0, parts: {} };
  const keys = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!keys.has(key)) continue;
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksKronverk] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKronverk] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris: Math.round(tris), ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKronverk = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KRON_DEBUG) console.log('[landmarksKronverk] parts', JSON.stringify(svc.parts), 'tris', svc.triangles, 'exhibits', svc.exhibits.length, 'court', svc.courtExhibits, 'nodes', svc.nodeExhibits, 'mini', (svc.miniCity || []).length, 'fence m', svc.fenceLength, 'lions', svc.zooLions, 'bridges', JSON.stringify(svc.bridges.map((b) => [b.key, Math.round(b.len), Math.round(b.w), Math.round(b.span)])));
  if (failed.length) throw new Error('landmarksKronverk parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKronverk");
}
