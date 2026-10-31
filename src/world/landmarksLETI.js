import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksLETI - the LETI campus on Aptekarsky Island (СПбГЭТУ «ЛЭТИ», ul. Professora Popova 5): CORPUS 1, the striped pistachio-green / pale-pink brick building of A. N. Vekshinsky (1899-1903) with the clock
// gable and the two round maroon-domed towers at its south-west corner, the west porch with the lantern spire behind it, small domed turrets, zinc roofs with timber gablets, the pale-pier fence; CORPUS 5 (the red-brick
// 1970s-80s complex with the stair to its pale entrance box); CORPUS 7 (the red-brick archive building with stepped gables); CORPUS D (the professors' house with the Popov memorial flat); the bronze busts of
// A. S. Popov and V. P. Vologdin and the war memorial.  Interiors closed (solid walls, shut doors); the campus paths and the forecourts are walkable.  Plain wordmark only, no emblem, no flags.
// Dossier docs/research/aptekarsky-2026.md (section 4.3, CRITIC LOG 12, BUILD LOG 15), photos refs/aptekarsky 60 61 62 63 64, refs/leti 01 02 04 05 06 (Commons: the 2015 panoramio series, the Popov / Vologdin plaques).
// DRAW-CALL RULE: the walls, bands, roofs and towers are the BASE collector (always drawn); the window surrounds, pilasters, parapets, gablets and ornaments are the DETAIL collector (hidden beyond DETAIL_FAR).
// No update callbacks.  Files: landmarksLETI/{frame art mats shell corpus1 corpus5 corpus7 corpusd busts fence groups}.js, copies kit geo facade roof inst objs; tools/landmarksLETI-*.mjs.
// Publishes ctx.services.landmarksLETI = { monuments, photoSpots, entrances, crowd, triangles, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksLETI/kit.js';
import { makeMats } from './landmarksLETI/mats.js';
import { GROUPS_LIST } from './landmarksLETI/groups.js';
import { registerLOD } from '../core/spatial.js';

const DETAIL_FAR = 170;                                                    // pilasters, surrounds, parapets, gablets and ornaments disappear beyond this (m before the quality scale)
const PARTS = [
  ['corpus1', 'corpus1', () => import('./landmarksLETI/corpus1.js')],
  ['corpus5', 'corpus5', () => import('./landmarksLETI/corpus5.js')],
  ['corpus7', 'corpus7', () => import('./landmarksLETI/corpus7.js')],
  ['corpusD', 'corpusD', () => import('./landmarksLETI/corpusd.js')],
  ['busts', 'busts', () => import('./landmarksLETI/busts.js')],
  ['fence', 'fence', () => import('./landmarksLETI/fence.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  if (!GROUPS_LIST.length) return;                                         // no claim: the generic blockout stays and nothing is drawn here
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksLETI';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const P = new Parts(), D = new Parts(), failed = [], shared = {};
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                       // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now(), t = P.tris + D.tris;
    const K = { ctx, M, THREE, P, D, svc, root, shared, extraTris: 0 };
    try { const m = await load(); await m.build(K); }
    catch (e) { console.error(`[landmarksLETI] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    svc.parts[name] = { tris: P.tris + D.tris - t + K.extraTris, ms: Math.round(performance.now() - t1) };
    svc.triangles += K.extraTris;
  }
  for (const [k, B] of [['base', P], ['detail', D]]) for (const b of B.b.values()) { const bad = b.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksLETI] ${k}: NaN vertex in ${b.mat.name} at ${bad / 3 | 0}`); }
  const base = P.build(root, { name: 'lmleti' }), detail = D.build(root, { name: 'lmleti-detail' });
  for (const m of base.concat(detail)) { if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m); m.userData.letiDetail = detail.includes(m); }
  svc.triangles += P.tris + D.tris; svc.baseTriangles = P.tris; svc.detailTriangles = D.tris;
  root.updateMatrixWorld(true);
  root.traverse((m) => { if (m.isMesh) registerLOD(m, m.userData.letiDetail ? DETAIL_FAR : Infinity); });
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksLETI = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.LETI_DEBUG) console.log('[landmarksLETI]', JSON.stringify({ tris: svc.triangles, base: P.tris, detail: D.tris, parts: svc.parts, mats: [...new Set([...P.b.values(), ...D.b.values()].filter((b) => b.n).map((b) => b.mat.name))], perMat: Object.fromEntries([['base', P], ['detail', D]].map(([k, B]) => [k, [...B.b.values()].filter((b) => b.n).map((b) => b.mat.name.replace('lmleti-', '') + ':' + b.idx.length / 3)])) }));
  if (failed.length) throw new Error('landmarksLETI parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksLETI");
}
