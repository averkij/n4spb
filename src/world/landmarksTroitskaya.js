import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksTroitskaya - TROITSKAYA SQUARE and the beginning of Kamennoostrovsky pr. (Petrograd side, docs/PETRO-BRIEF.md): the CATHEDRAL MOSQUE (Vasilyev 1909-20: grey granite, the ribbed
// turquoise dome 39 m, two 48 m minarets, majolica portals with a stalactite vault, the turquoise fence), the KSHESINSKAYA MANSION (von Gogen 1904-06: glazed brick, grey and red granite, the corner
// turret, the Lenin balcony, the winter garden, the iron fence; with the Brant mansion and the 1957 link = the Museum of Political History), the garden of the square (grit alleys, lawns, hedges,
// benches, lamps, limes), the Trinity chapel (2003), the Solovetsky stone, the House of Political Prisoners (constructivism 1929-33), the Lenproekt house, the Lidval house (Kamennoostrovsky 1-3,
// cour d'honneur with its fence), the Gorky monument and the two Stalinist houses that frame the sight (Kuybysheva 1, Kamennoostrovsky 2).  Dossier docs/research/troitskaya.md (+ troitskaya-houses.json), photos refs/troitskaya.  User rules: no flags / flagpoles, no alarm sounds.
// Files: landmarksTroitskaya/frame.js (frames, pointed arch, fence planner) art.js mats.js prism.js (ring walls, window sheets) · mosque.js · mansion.js · square.js (garden, chapel, stone) ·
// houses.js (Political Prisoners, Lenproekt, Lidval, the framing houses) · gorky.js · groups.js (claims) · kit.js geo.js inst.js surfaces.js (+ fillPolyClipped) trees.js treegeo.js leafmat.js util.js
// (copies of landmarksNikolsky).  Tools: tools/landmarksTroitskaya-plan.mjs (labelled plan), -walk.mjs (walk probe), -houses.mjs (houses JSON).  A part is built only when its claim key is in groups.js.
// Publishes ctx.services.landmarksTroitskaya = { mosque, monuments, photoSpots, entrances, crowd, fences, benches, lamps, trees, paths, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksTroitskaya/kit.js';
import { makeMats } from './landmarksTroitskaya/mats.js';
import { MQ } from './landmarksTroitskaya/frame.js';
import { GROUPS_LIST } from './landmarksTroitskaya/groups.js';

const PARTS = [
  ['mosque', 'mosque', () => import('./landmarksTroitskaya/mosque.js')],
  ['mansion', 'kshesinskaya', () => import('./landmarksTroitskaya/mansion.js')],
  ['square', 'troitskaya-garden', () => import('./landmarksTroitskaya/square.js')],
  ['houses', 'political-prisoners', () => import('./landmarksTroitskaya/houses.js')],
  ['gorky', 'gorky', () => import('./landmarksTroitskaya/gorky.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksTroitskaya';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], trees: [], paths: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksTroitskaya] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksTroitskaya] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- photo spots / crowd (people module reads them)
  const spot = (x, z, tx, tz, name, pitch = 8) => { if (!L.insideBuilding(x, z, 0.6) && !L.isOnRoad(x, z, 0.3)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  if (svc.mosque) {
    spot(-1578, -2548, MQ.x, MQ.z, 'Соборная мечеть с Кронверкского проспекта', 14);
    spot(-1556, -2586, MQ.x, MQ.z, 'Соборная мечеть: минареты и северный портал', 16);
    svc.monuments.push({ id: 'w28712430', name: 'Соборная мечеть', x: MQ.x, z: MQ.z, h: 48 });
    svc.crowd.push({ id: 'mosque-portal', kind: 'photo', x: -1562, z: -2546, r: 6, n: 14 });
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksTroitskaya = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.TROI_DEBUG) console.log('[landmarksTroitskaya] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksTroitskaya parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksTroitskaya");
}
