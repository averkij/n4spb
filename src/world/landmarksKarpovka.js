import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKarpovka - THE KARPOVKA EMBANKMENT (Petrograd side / Aptekarsky island, play rectangle P8; docs/PETRO-BRIEF.md): the IOANNOVSKY CONVENT (N. N. Nikonov, 1900-08: the Neo-Byzantine church of
// two-tone striped glazed brick on the river, five helmet domes with gilded crosses, the bell tower, the two-tier apse, the cell ranges, the pink wall with the Holy Gate; burial place of St John of
// Kronstadt) and the FIRST LENSOVET HOUSE (E. A. Levinson, I. I. Fomin, 1931-34: the concave constructivist slab on a stone terrace, the open gallery on thin columns, the passage on pillars, the two
// outside stairs, loggia stacks, the two wings, the court with its stone fence).  Dossier docs/research/karpovka.md (+ karpovka-houses.json), photos refs/karpovka.  User rules: no flags, no alarm sounds
// (the bells are silent props).  The quay walls / railings of the river belong to `environment`, the bridges to `bridges` (docs/research/petro-requests-landmarksKarpovka.md).
// Files: landmarksKarpovka/frame.js (frames CV / LS, fence planner) art.js mats.js (every texture / material key starts with 'lmKarp-') · convent.js · lensovet.js · groups.js (claims) · kit.js geo.js
// inst.js prism.js surfaces.js trees.js treegeo.js leafmat.js util.js (copies of landmarksTroitskaya / landmarksNikolsky).  Tools: tools/landmarksKarpovka-walk.mjs (walk probe), -houses.mjs (houses JSON).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksKarpovka = { convent, lensovet, monuments, photoSpots, entrances, crowd, fences, benches, trees, parts } and
// merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksKarpovka/kit.js';
import { makeMats } from './landmarksKarpovka/mats.js';
import { CV } from './landmarksKarpovka/frame.js';
import { GROUPS_LIST } from './landmarksKarpovka/groups.js';

const PARTS = [
  ['convent', 'ioannovsky', () => import('./landmarksKarpovka/convent.js')],
  ['lensovet', 'lensovet', () => import('./landmarksKarpovka/lensovet.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKarpovka';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], trees: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksKarpovka] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKarpovka] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- photo spots / crowd (the people module reads them)
  const spot = (x, z, tx, tz, name, pitch = 8) => { if (!L.insideBuilding(x, z, 0.6) && !L.isOnRoad(x, z, 0.3) && !L.inRiver(x, z)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  if (svc.convent) {
    const c = svc.convent.centre, a = CV.W(18, 13.5), b = CV.W(-6, 12.5);
    spot(a.x, a.z, c[0], c[1], 'Иоанновский монастырь с набережной Карповки', 24);
    spot(b.x, b.z, c[0], c[1], 'Иоанновский монастырь: купола и колокольня', 22);
    const d = CV.W(22, 6);
    svc.crowd.push({ id: 'ioannovsky-front', kind: 'photo', x: d.x, z: d.z, r: 5, n: 10 });
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKarpovka = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KARP_DEBUG) console.log('[landmarksKarpovka] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksKarpovka parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKarpovka");
}
