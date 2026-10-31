import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksTransfiguration - the CHURCH of the Transfiguration on Aptekarsky Island (Храм Преображения Господня, K. A. Thon 1840-45, Instrumentalnaya ul. 3A, OSM w28370423) as it stands today, the church
// MOUND with its rubble retaining wall, and the Tributs BUNKER (OSM w412493366).  The church lost its five gilded domes on 15 Apr 1930 (it became a LETI laboratory, a third floor was added; the diocese
// has it again since 2006): a rectangular ochre-stuccoed hall on a granite plinth with a rusticated ground floor, triple Corinthian column groups at the corners and column pairs on every face, a white
// panelled attic, the shaped baroque parapet over the 5-arch window of the long faces, the portal with the name board in the south-west end, and ONE low octagonal drum with a plain cross.  The doors are shut
// (a working church: exterior only).  The terrace is a 1 m rubble-walled platform (the mound is 3 m in reality) with the hedge, one 7-tread stair on the entrance axis and a granite portal stair.
// The bunker is a 2 m trench between leaning armour plates, the red riveted door wall with the grey steel door, the earth mound and the red information board; the painted ensign of the door is NOT drawn.
// The Stolypin obelisk of the same square is drawn by landmarksBotanicalGarden (it claims n4119369495).  No flags, no bell sounds.
// Dossier docs/research/aptekarsky-2026.md (4.4, 8, 10 entry E, 12 CRITIC LOG, BUILD LOG at the end), photos refs/aptekarsky 65 66 and refs/transfiguration 04..16.
// Files: landmarksTransfiguration/frame.js (frames CH + plan numbers) art.js mats.js (every texture / material key starts with 'lmTF-') church.js terrace.js bunker.js groups.js · kit.js geo.js (copies of landmarksVladimir).
// Collectors: P = the shell (LOD 1100 m), N = near detail (windows, frames, capitals' leaves, panels, hedge, posts, door, boards; LOD 350 m).  Publishes ctx.services.landmarksTransfiguration =
// { monuments, photoSpots, entrances, church, terrace, bunker, board, triangles, parts, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Tools: tools/landmarksTransfiguration-walk.mjs (walk probe: terrace stair, portal steps, church walls, bunker trench).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksTransfiguration/kit.js';
import { makeMats } from './landmarksTransfiguration/mats.js';
import { CH, PL, BUNKER } from './landmarksTransfiguration/frame.js';

const PARTS = [
  ['church', () => import('./landmarksTransfiguration/church.js')],
  ['terrace', () => import('./landmarksTransfiguration/terrace.js')],
  ['bunker', () => import('./landmarksTransfiguration/bunker.js')],
];
const FAR_SHELL = 1100, FAR_NEAR = 350;

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksTransfiguration';
  const svc = { monuments: [], photoSpots: [], entrances: [], triangles: 0, parts: {} };
  const failed = [], tiers = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), N: new Parts(), svc, root };
    try { const m = await load(); await m.build(K); } catch (e) { console.error(`[landmarksTransfiguration] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const [tag, C] of [['shell', K.P], ['near', K.N]]) {
      for (const k of C.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksTransfiguration] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
      const meshes = C.build(root, { name: `${name}-${tag}` });
      for (const m of meshes) { if (M.decals.has(m.material)) ctx.noOutline(m); tiers.push([m, tag]); }
      svc.triangles += C.tris;
    }
    svc.parts[name] = { tris: K.P.tris + K.N.tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- services: the entrance, the monuments, free photo spots on the street side
  const portal = CH.W(0, PL.HL + 1.6);
  svc.entrances.push({ x: portal.x, z: portal.z, rotY: CH.face(0, 1), kind: 'church' });
  svc.monuments.push({ id: 'w28370423', name: 'Храм Преображения Господня', x: CH.ox, z: CH.oz, h: PL.TY + PL.drumCapY + PL.crossH });
  svc.monuments.push({ id: 'w412493366', name: 'Бункер Трибуца', x: (BUNKER.S0[0] + BUNKER.E[0]) / 2, z: (BUNKER.S0[1] + BUNKER.E[1]) / 2, h: 2.5 });
  const spot = (cands, tx, tz, name, pitch) => {
    for (const [mx, mz] of cands) {
      const p = CH.W(mx, mz);
      if (L.inPlay && !L.inPlay(p.x, p.z)) continue;
      if (L.insideBuilding(p.x, p.z, 1.5) || L.isOnRoad(p.x, p.z, 1.0)) continue;
      svc.photoSpots.push({ x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, tx, tz), pitch, name }); return;
    }
  };
  spot([[8, 24], [12, 22], [14, 26], [4, 26]], CH.ox, CH.oz, 'Храм Преображения Господня с Инструментальной улицы', 8);
  spot([[24, 6], [22, 2], [26, -2], [20, 10]], CH.ox, CH.oz, 'Храм Преображения Господня с юго-востока', 8);
  root.updateMatrixWorld(true);
  for (const [m, tag] of tiers) registerLOD(m, tag === 'shell' ? FAR_SHELL : FAR_NEAR);
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksTransfiguration = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.TF_DEBUG) console.log('[landmarksTransfiguration] parts', JSON.stringify(svc.parts), 'tris', Math.round(svc.triangles));
  if (failed.length) throw new Error('landmarksTransfiguration parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksTransfiguration");
}
