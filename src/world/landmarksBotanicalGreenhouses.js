import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksBotanicalGreenhouses - the GLASS-HOUSE COMPLEX of the Peter the Great Botanical Garden (Оранжерейный комплекс Ботанического сада Петра Великого, ul. Professora Popova 2, Aptekarsky Island;
// two squares of houses on the 20.8 deg axis, F. B. Fischer 1823-26 and later): the GREAT PALM HOUSE no. 26 (1896-99, 23.5 m) with its east portal "1899", the Mangrove house 27, the Victoria house 28 and the
// rain-forest house 18; the GREAT SUBTROPICAL house no. 1 (stepped hip, barrel-vaulted wings, apse); the lean-to houses 2-4, 6-8, 15-17, 19-21 (stucco back wall towards the park, glass roof towards the court),
// the stock houses 10-14 and 22-24, the 3-storey stucco block of house 12 with its red-brick tower, the passage 8-21 with its two pavilions, the glass links, the VESTIBULE ROTUNDA (1935, colonnaded bow) and
// the BOTANICAL MUSEUM (ochre, 9 bays, relief panels).  Interiors are closed (solid walls, shut doors); the courts are NOT opened to the player.
// Dossier docs/research/aptekarsky-2026.md (researched and critic-checked 2026-10-13; the CRITIC LOG wins), photos refs/aptekarsky 04 08 10 12 (Palm House), 24 (N1), 33 30 (vestibule), 35 36 (museum), F0 F1.
// DRAW-CALL RULE (dossier 4.1c): every glass bay / window bay / roof tile is a quad with uv 0..1 of one tile texture (art.js), which the engine packs into its atlas pages (core/batch2.js): all the glass
// of the complex shares a few materials; only the curved / hipped parts carry real 3D ribs, and those sit in a detail collector hidden beyond DETAIL_FAR.  No update callbacks, no InstancedMesh.
// User rules: no flags / flagpoles (only plain finials), no alarms.  Files: landmarksBotanicalGreenhouses/{art mats geo kit house palm n1 belt museum vest walk groups}.js; tools/landmarksBotanicalGreenhouses-*.mjs.
// Publishes ctx.services.botanicalGreenhouses = { courts, museumDoor, sherlock, entrances, buildings, triangles, parts } and merges monuments / photo spots into ctx.services.landmarks.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksBotanicalGreenhouses/kit.js';
import { makeMats } from './landmarksBotanicalGreenhouses/mats.js';
import { GROUPS_LIST } from './landmarksBotanicalGreenhouses/groups.js';
import { registerLOD } from '../core/spatial.js';

const DETAIL_FAR = 180;                                                    // the 3D ribs, rafters, posts and ornaments disappear beyond this (m before the quality scale)
const PARTS = [
  ['palm', () => import('./landmarksBotanicalGreenhouses/palm.js')],
  ['n1', () => import('./landmarksBotanicalGreenhouses/n1.js')],
  ['belt', () => import('./landmarksBotanicalGreenhouses/belt.js')],
  ['museum', () => import('./landmarksBotanicalGreenhouses/museum.js')],
  ['vest', () => import('./landmarksBotanicalGreenhouses/vest.js')],
  ['walk', () => import('./landmarksBotanicalGreenhouses/walk.js')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksBotanicalGreenhouses';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], triangles: 0, parts: {} };
  if (!GROUPS_LIST.length) return;                                         // no claim: the generic blockout stays and nothing is drawn here
  const P = new Parts(), D = new Parts(), failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now(), t = P.tris + D.tris;
    const K = { ctx, M, THREE, P, D, svc, root };
    try { const m = await load(); await m.build(K); }
    catch (e) { console.error(`[landmarksBotanicalGreenhouses] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    svc.parts[name] = { tris: P.tris + D.tris - t, ms: Math.round(performance.now() - t1) };
    if (typeof process !== 'undefined' && process.env && process.env.GH_DEBUG) for (const [k, B] of [['P', P], ['D', D]]) for (const b of B.b.values()) for (let i = 0; i < b.pos.length; i += 3) if (b.pos[i] > -1000) { console.log(`[gh] stray vertex after ${name} in ${k}/${b.mat.name}:`, b.pos[i].toFixed(1), b.pos[i + 1].toFixed(1), b.pos[i + 2].toFixed(1)); break; }
  }
  for (const [k, B] of [['base', P], ['detail', D]]) for (const b of B.b.values()) { const bad = b.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksBotanicalGreenhouses] ${k}: NaN vertex in ${b.mat.name} at ${bad / 3 | 0}`); }
  const base = P.build(root, { name: 'lmgh' }), detail = D.build(root, { name: 'lmgh-detail' });
  for (const m of base.concat(detail)) { if (M.cutouts.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m); m.userData.ghDetail = detail.includes(m); }
  for (const m of detail) m.castShadow = false;                            // the thin ribs do not need to cast shadows
  svc.triangles = P.tris + D.tris; svc.baseTriangles = P.tris; svc.detailTriangles = D.tris;
  root.updateMatrixWorld(true);
  root.traverse((m) => { if (m.isMesh) registerLOD(m, m.userData.ghDetail ? DETAIL_FAR : Infinity); });
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.botanicalGreenhouses = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.GH_DEBUG) console.log('[landmarksBotanicalGreenhouses]', JSON.stringify({ tris: svc.triangles, base: P.tris, detail: D.tris, parts: svc.parts }));
  if (failed.length) throw new Error('landmarksBotanicalGreenhouses parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksBotanicalGreenhouses");
}
