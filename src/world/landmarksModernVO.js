// landmarksModernVO - the Art Nouveau (Northern Modern) hero houses of Vasilievsky Island (docs/VO-BRIEF.md; dossier docs/research/modernvo.md + modernvo-houses.json, critic log C1..C17, photos refs/modernvo):
// every house is a full hand-modelled facade (windows as real openings, bays and towers as closed solids, tile / brick / roughcast / granite textures, ornament) instead of the generic archetype of the city:
//   Smirnov / Bennigsen (the house with the atlantes) + its replica wing, Eremeeva 82 (spire) and Eremeeva 46 (steep roofs), Borkhov 54 / 56, Kornilova (round tower), Kornilov 45, Zavarzin 47, Teodoridi (lantern),
//   Kollan (Lidval), the Karl May school, the house with sunflowers (Kudryavtsev), Demidov (tier B).
// A part is built only when its claim key is in groups.js (no double drawing with the generic city).  Frames: modernvo/frame.js (one frame per front, measured on the baked footprints).
// Files: frame.js house.js wallx.js bay.js (shared) art.js mats.js (every texture / material key starts with 'lmmvo-') + one file per house; kit.js geo.js inst.js surfaces.js wall.js are copies of landmarksSredny.
// Publishes ctx.services.landmarksModernVO = { monuments, photoSpots, entrances, crowd, fences, benches, parts, triangles, ... } and merges monuments / photo spots into ctx.services.landmarks.
// User rules: no flags / flagpoles, no alarm sounds, no logos (plain words only), summer day.  Nothing is enterable: every footprint is a solid (thin-wall colliders), bays and balconies overhang the pavement.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksModernVO.js and landmarksModernVO/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksModernVO), not when the module's own groups.js lists it; (2) fences / low walls are knock bays, docs/vo-m3.md.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksModernVO/kit.js';
import { makeMats } from './landmarksModernVO/mats.js';
import { GROUPS_LIST } from './landmarksModernVO/groups.js';
import { makeTileKit } from './landmarksModernVO/tiles.js';

const PARTS = [
  ['kollan', 'modernvo-kollan', () => import('./landmarksModernVO/kollan.js')],
  ['kornilov', 'modernvo-kornilov', () => import('./landmarksModernVO/kornilov.js')],
  ['zavarzin', 'modernvo-zavarzin', () => import('./landmarksModernVO/zavarzin.js')],
  ['karlmay', 'modernvo-karlmay', () => import('./landmarksModernVO/karlmay.js')],
  ['kornilova', 'modernvo-kornilova', () => import('./landmarksModernVO/kornilova.js')],
  ['borkhov', 'modernvo-borkhov', () => import('./landmarksModernVO/borkhov.js')],
  ['erem82', 'modernvo-erem82', () => import('./landmarksModernVO/erem82.js')],
  ['erem46', 'modernvo-erem46', () => import('./landmarksModernVO/erem46.js')],
  ['teodoridi', 'modernvo-teodoridi', () => import('./landmarksModernVO/teodoridi.js')],
  ['smirnov', 'modernvo-smirnov', () => import('./landmarksModernVO/smirnov.js')],
  ['demidov', 'modernvo-demidov', () => import('./landmarksModernVO/demidov.js')],
  ['kudryavtsev', 'modernvo-kudryavtsev', () => import('./landmarksModernVO/kudryavtsev.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx), TK = makeTileKit(ctx, 'lmmvo');
  const root = new THREE.Group(); root.name = 'landmarksModernVO';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], plaques: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksModernVO) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksModernVO] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksModernVO] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = TK.build(K.P, root, { name: 'lmmvo-' + name, noOutline: (m) => M.cutouts.has(m) || M.decals.has(m) || M.glassy.has(m), noCast: (m) => M.decals.has(m), keep: (m) => M.cutouts.has(m) });      // tiles.js: tiled paintings -> one atlas kind, plain colours -> vertex colours
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    for (const m of meshes) if (M.decals.has(m.material)) m.castShadow = false;
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1), meshes: meshes.length };
  }
  TK.finalize();
  if (typeof process !== 'undefined' && process.env && process.env.MVO_KINDS) (await import('./landmarksModernVO/probe.js')).probe(root, 'landmarksModernVO');
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksModernVO = { ...svc, tiles: TK.stats, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.MVO_DEBUG) {
    console.log('[landmarksModernVO] parts', JSON.stringify(svc.parts));
    const names = new Map(); root.traverse((o) => { if (o.material) names.set(o.material.name, (names.get(o.material.name) || 0) + 1); });
    console.log('[landmarksModernVO] materials', names.size, JSON.stringify([...names.entries()]));
  }
  if (failed.length) throw new Error('landmarksModernVO parts failed:\n' + failed.join('\n'));
}
