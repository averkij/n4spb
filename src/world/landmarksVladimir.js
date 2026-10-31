import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksVladimir - the WEST OF THE PETROGRAD SIDE (region P2, docs/PETRO-BRIEF.md): the PRINCE VLADIMIR CATHEDRAL (Князь-Владимирский собор, A. Rinaldi / I. Starov 1766-89: pale yellow and
// white, five silver-grey domes, the three-tier bell tower 57.5 m) with its iron fence, gate pylons and the chapel of St Alexander Nevsky; the JUDICIAL QUARTER building site on the Malaya Neva
// (Dance Palace, Judicial Department, housing, Supreme Court: finished cream-stone volumes behind a blue site fence, scaffolding, tower cranes, the builders' yard: state of 2026);
// TUCHKOV BUYAN (the hemp warehouses of 1763-72: two long ochre blocks and the weigh-house pavilion); the YUBILEYNY sports palace (the 94 m finned drum of 1967 and its annexes) and the
// PETROVSKY stadium on its island (the colonnaded bowl and the four floodlight masts).  Dossier docs/research/vladimir.md (+ vladimir-houses.json), photos refs/vladimir.
// User rules: no flags / flagpoles (the stadium rim and the arena forecourt carry none), no alarm sounds (the bells are silent props), no corporate logos.
// Files: landmarksVladimir/frame.js (frames CATH / SITE / BUYAN / CHAPEL) art.js mats.js · cathedral.js · fence.js (enclosure fence, west gate, chapel) · quarter.js (judicial quarter) ·
// buyan.js · yubileyny.js · stadium.js · roofs.js (distance-field hip roofs) · groups.js (claims) · kit.js geo.js stucco.js surfaces.js (copies of landmarksNikolsky).
// Publishes ctx.services.landmarksVladimir = { monuments, photoSpots, entrances, crowd, fences, metroExits, parts, triangles } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksVladimir/kit.js';
import { makeMats } from './landmarksVladimir/mats.js';
import { CATH } from './landmarksVladimir/frame.js';

const PARTS = [
  ['cathedral', () => import('./landmarksVladimir/cathedral.js')],
  ['fence', () => import('./landmarksVladimir/fence.js')],
  ['quarter', () => import('./landmarksVladimir/quarter.js')],
  ['buyan', () => import('./landmarksVladimir/buyan.js')],
  ['yubileyny', () => import('./landmarksVladimir/yubileyny.js')],
  ['stadium', () => import('./landmarksVladimir/stadium.js')],
];
// stair exits of the Sportivnaya pedestrian subway (OSM ENTRANCES ref 1-5): the station has no surface pavilion on this bank (dossier section 7); for the metro owner
const METRO_EXITS = [[1, -3392.0, -2157.1], [2, -3361.6, -2210.0], [3, -3319.7, -2186.8], [4, -3315.7, -2148.2], [5, -3332.7, -2134.5]];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksVladimir';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], metroExits: METRO_EXITS.map(([ref, x, z]) => ({ ref, x, z, station: 'Спортивная' })), triangles: 0, parts: {} };
  const failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksVladimir] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksVladimir] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.flows.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- services for people / props / metro
  const spot = (x, z, tx, tz, name, pitch = 8) => svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name });
  const c = CATH.W(0, 0), door = CATH.W(0, 41.5), gate = CATH.W(-1.9, 73);
  svc.entrances.push({ x: door.x, z: door.z, rotY: CATH.face(0, 1), kind: 'cathedral' });
  svc.crowd.push({ id: 'vladimir-porch', kind: 'photo', x: gate.x, z: gate.z, r: 7, n: 14 });
  svc.monuments.push({ id: 'w109067002', name: 'Князь-Владимирский собор', x: c.x, z: c.z, h: 57.5 });
  { const p = CATH.W(4, 78); spot(p.x, p.z, c.x, c.z, 'Князь-Владимирский собор от западных ворот', 16); }
  { const p = CATH.W(62, 6); spot(p.x, p.z, c.x, c.z, 'Князь-Владимирский собор из Успенского сквера', 12); }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksVladimir = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.VLAD_DEBUG) {
    console.log('[landmarksVladimir] parts', JSON.stringify(svc.parts));
    const mine = new Set(L.groupMembers('landmarksVladimir').map((b) => b.id)), lab = (ctx.services.labels?.list?.() || []).filter((l) => mine.has(l.bld));
    console.log('[landmarksVladimir] facade labels of other modules on claimed buildings:', lab.length, JSON.stringify(lab.slice(0, 12)));
  }
  if (failed.length) throw new Error('landmarksVladimir parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksVladimir");
}
