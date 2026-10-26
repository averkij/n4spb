// landmarksNikolsky - the ST NICHOLAS NAVAL CATHEDRAL (Николо-Богоявленский Морской собор, Chevakinsky 1753-62: Greek-cross Elizabethan baroque in sky blue and white with five gold domes), its free-standing
// four-tier BELL TOWER (72 m, clock, gold domes, needle spire) on the Kryukov Canal, the white-pylon fence of the enclosure and Nikolsky Garden (lime / maple trees, gravel footways, benches, lamps,
// two frog fountains, the Tsushima obelisk, the lattice fence).  Dossier docs/research/nikolsky.md (+ nikolsky-houses.json), brief docs/SW-BRIEF.md, photos refs/nikolsky.  User rules: no flags / flagpoles, no alarm
// sounds (the bells in the belfry are silent props).
// Files: landmarksNikolsky/frame.js (cathedral frame, bell tower position) art.js mats.js · stucco.js (columns, windows, balconies, cartouches, rays) domes.js (gore domes, drums, lanterns, crowns) ·
// cathedral.js · tower.js · fence.js · garden.js · groups.js (claims) · kit.js geo.js inst.js surfaces.js trees.js treegeo.js leafmat.js util.js (copies of landmarksMars).
// Publishes ctx.services.landmarksNikolsky = { cathedral, tower, entrances, photoSpots, crowd, benches, lamps, fences, fountains, trees, ... } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/landmarksNikolsky.js and landmarksNikolsky/*); this line is the only change.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksNikolsky/kit.js';
import { makeMats } from './landmarksNikolsky/mats.js';
import { C0, UV, TOWER_W } from './landmarksNikolsky/frame.js';

const PARTS = [
  ['cathedral', () => import('./landmarksNikolsky/cathedral.js')],
  ['tower', () => import('./landmarksNikolsky/tower.js')],
  ['fence', () => import('./landmarksNikolsky/fence.js')],
  ['garden', () => import('./landmarksNikolsky/garden.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksNikolsky';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], triangles: 0, parts: {} };
  const failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksNikolsky] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksNikolsky] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.flows.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  // ---- services for people / props / traffic
  const yawTo = (x, z, tx, tz) => L.yawToward(x, z, tx, tz);
  const door = (u, v, du, dv, kind) => { const p = UV(u, v), q = UV(u + du, v + dv); return { x: p.x, z: p.z, rotY: Math.atan2(q.x - p.x, q.z - p.z), kind }; };
  svc.entrances.push(door(-25.6, 0, -1, 0, 'cathedral'), door(0, -25.6, 0, -1, 'cathedral'), door(25.6, 0, 1, 0, 'cathedral'), door(-98.4, 0, 1, 0, 'bell tower'));
  const crowd = (id, kind, u, v, r, n) => { const p = UV(u, v); svc.crowd.push({ id, kind, x: p.x, z: p.z, r, n }); };
  crowd('nikolsky-porch', 'photo', -38, 0, 8, 22); crowd('nikolsky-avenue', 'group', -70, -1.2, 4, 12); crowd('nikolsky-tower', 'photo', -92, 0, 6, 14); crowd('nikolsky-north-gate', 'group', 0, -40, 6, 10);
  for (const [u, v, name] of [[-47, 0, 'Никольский собор с аллеи от колокольни'], [-92, 0, 'Колокольня Никольского собора'], [0, -52, 'Никольский собор с севера'], [-6, 55, 'Никольский собор со стороны канала Грибоедова']]) {
    const p = UV(u, v); svc.photoSpots.push({ x: p.x, z: p.z, yaw: yawTo(p.x, p.z, C0.x, C0.z), pitch: 8, name });
  }
  svc.monuments.push({ id: 'r3290873', name: 'Никольский Морской собор', x: C0.x, z: C0.z, h: 64 }, { id: 'r3290835', name: 'Колокольня Никольского собора', x: TOWER_W.x, z: TOWER_W.z, h: 72 });
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksNikolsky = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.NIK_DEBUG) console.log('[landmarksNikolsky] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksNikolsky parts failed:\n' + failed.join('\n'));
}
