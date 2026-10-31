import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennyChurch - the CHURCH of the Nativity of John the Baptist on Kamenny Island (Предтеченская церковь, Yu. M. Felten 1776-78; OSM r10254216, Kamennoostrovsky pr. 83) with its open belfry tower, the drum,
// the white plaques and the Pushkin plaque («Здесь А. С. Пушкин крестил своих детей», OSM n1158861685), the limestone porch platform and the chain fence on granite posts, and the CHAPEL of the Vsetsaritsa icon
// (r10254215, pr. 85: the brick-red round pavilion at the Ushakovsky Bridge on seven concentric limestone steps, wavy white arches, the onion, the mosaic icon on the back).  The church plot is a working church: closed doors,
// exterior only; walkable: the porch platform, the chapel steps and the grounds outside the chain.  NOT drawn here: the palace and its garden fence w128092322 (landmarksKamennyPalace), the theatre.
// Dossier docs/research/kamenny-2026.md (section 5.2, 8 entry 2, CRITIC LOG), photos refs/kamenny-2026 C01..C15 H01..H03 (BUILD LOG at the end of the dossier).  User rules: no flags, no alarms (the bells are silent props), a church cross is fine.
// Files: landmarksKamennyChurch/frame.js (frames CH, CP + plan numbers) art.js mats.js (every texture / material key starts with 'lmKC-') church.js chapel.js fence.js util.js groups.js · kit.js geo.js roofs.js (copies of landmarksVladimir).
// Collectors: P = the shell (LOD 1100 m), N = near detail (windows, frames, plaques, bells, dentils, chain; LOD 350 m).  Publishes ctx.services.landmarksKamennyChurch = { monuments, photoSpots, entrances, plaques, posts, triangles, parts }
// and merges monuments / photo spots into ctx.services.landmarks.  Tools: tools/landmarksKamennyChurch-walk.mjs (walk probe: porch, chain, walls, chapel steps).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksKamennyChurch/kit.js';
import { makeMats } from './landmarksKamennyChurch/mats.js';
import { CH, CP } from './landmarksKamennyChurch/frame.js';

const PARTS = [
  ['church', () => import('./landmarksKamennyChurch/church.js')],
  ['chapel', () => import('./landmarksKamennyChurch/chapel.js')],
  ['fence', () => import('./landmarksKamennyChurch/fence.js')],
];
const FAR_SHELL = 1100, FAR_NEAR = 350;

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKamennyChurch';
  const svc = { monuments: [], photoSpots: [], entrances: [], plaques: [], lamps: [], benches: [], posts: [], triangles: 0, parts: {} };
  const failed = [], tiers = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), N: new Parts(), svc, root };
    try { const m = await load(); await m.build(K); } catch (e) { console.error(`[landmarksKamennyChurch] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const [tag, C] of [['shell', K.P], ['near', K.N]]) {
      for (const k of C.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennyChurch] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
      const meshes = C.build(root, { name: `${name}-${tag}` });
      for (const m of meshes) { if (M.decals.has(m.material) || M.cutouts.has(m.material)) ctx.noOutline(m); tiers.push([m, tag]); }
      svc.triangles += C.tris;
    }
    svc.parts[name] = { tris: K.P.tris + K.N.tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- services
  const spot = (x, z, tx, tz, name, pitch = 6) => { if (!L.insideBuilding(x, z, 1) && !L.isOnRoad(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  const door = CH.W(-0.9, 10.9), doorOut = CH.W(0, 13.0);
  svc.entrances.push({ x: doorOut.x, z: doorOut.z, rotY: CH.face(0, 1), kind: 'church' });
  svc.monuments.push({ id: 'r10254216', name: 'Церковь Рождества Иоанна Предтечи', x: CH.ox, z: CH.oz, h: 23 });
  svc.monuments.push({ id: 'r10254215', name: 'Часовня иконы «Всецарица»', x: CP.ox, z: CP.oz, h: 14 });
  { const p = CH.W(-2.0, 24); spot(p.x, p.z, door.x, door.z, 'Предтеченская церковь с запада', 10); }
  { const p = CP.W(0.5, 12); spot(p.x, p.z, CP.ox, CP.oz, 'Часовня «Всецарица» у Ушаковского моста', 8); }
  root.updateMatrixWorld(true);
  for (const [m, tag] of tiers) registerLOD(m, tag === 'shell' ? FAR_SHELL : FAR_NEAR);
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKamennyChurch = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KCH_DEBUG) console.log('[landmarksKamennyChurch] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksKamennyChurch parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennyChurch");
}
