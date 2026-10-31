import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksKamennoostrovsky - Kamennoostrovsky prospekt, Lev Tolstoy Square, Austrian Square and the Art Nouveau showpieces of Bolshoy pr. P. S. (the Petrograd side, regions P1 north / P3 / P4).
// Dossier docs/research/kamennoostrovsky.md (photos refs/kamennoostrovsky/NN_*.jpg, OSM-measured footprints); the ordinary houses of both avenues: docs/research/kamennoostrovsky-houses.json (for `city`).
// Files: landmarksKamennoostrovsky/groups.js (claims) · kit.js common.js house.js (the stucco-facade kit of the Nevsky landmark houses, copied; kit.js adds Parts.stamp, common.js K.capture) ·
// nouveau.js (the Art Nouveau vocabulary: rough stone, toothed surrounds, bay windows, pointed arches, balustrades, mansards, turrets, label reservation) · tenement.js (one data-driven builder: a
// house = a config of ~15 lines) · reliefs.js · towers.js (the House with Towers) · austrian.js (the five houses of Austrian Square) · tolstoy.js (the other six houses of Lev Tolstoy Square, the
// Petrogradskaya vestibule) · showpieces.js (House with Owls, Benois house, Voeykova house) · emir.js (House of the Emir of Bukhara, Lensovet Palace of Culture) · lenfilm.js (Lenfilm portico
// building, Aleksandrov tenements 10 / 12, Bykhovsky house 9, Cavos house 24) · bolshoy.js (Alyushinsky 69, Badaev 49, Antonova 74).  Tools: tools/landmarksKamennoostrovsky-houses.mjs (the houses table), -svc.mjs (service sanity).
// Numbers (tools/check.mjs): ~296 k triangles, build 0.8-0.95 s, 26 OSM houses claimed in 10 sub-groups (groups.js).  ?kam=towers,austrian limits the parts in the browser (KAM=... in node).
// Publishes ctx.services.landmarksKamennoostrovsky = { houses, entrances, photoSpots, monuments, crowd, fences, benches, parts, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// User rules: no flags / flagpoles, no logos (plain wordmarks), Russian text; every facade label reserves its rectangle (ctx.services.labels) and openings keep clear of the street plates.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { makeKit } from './landmarksKamennoostrovsky/common.js';
import { makeNouveau } from './landmarksKamennoostrovsky/nouveau.js';

const part = (file) => () => import(`./landmarksKamennoostrovsky/${file}.js`).then((m) => m.build);
const PARTS = [
  ['towers', part('towers')],
  ['austrian', part('austrian')],
  ['tolstoy', part('tolstoy')],
  ['showpieces', part('showpieces')],
  ['emir', part('emir')],
  ['lenfilm', part('lenfilm')],
  ['bolshoy', part('bolshoy')],
];

async function buildSource(ctx) {
  const t0 = performance.now();
  const root = new THREE.Group(); root.name = 'landmarksKamennoostrovsky';
  const K = makeKit(ctx); K.root = root;
  const N = makeNouveau(K);
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], houses: [], parts: {}, triangles: 0 };
  K.svc = svc;
  const only = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('kam') : (typeof process !== 'undefined' && process.env && process.env.KAM) || null;
  const failed = [];
  for (const [name, load] of PARTS) {
    if (only && !only.split(',').includes(name)) continue;
    const t1 = performance.now();
    K.begin();
    try { const fn = await load(); await fn(K, N, svc); }
    catch (e) { console.error(`[landmarksKamennoostrovsky] ${name} failed:`, e); failed.push(`${name}: ${(e && e.stack) || e}`); }
    const before = K.tris;
    K.flush(root, name);
    svc.parts[name] = { tris: K.tris - before, ms: Math.round(performance.now() - t1) };
  }
  svc.triangles = K.tris;
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKamennoostrovsky = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KAM_DEBUG) console.log('[landmarksKamennoostrovsky] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksKamennoostrovsky parts failed:\n' + failed.join('\n'));
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKamennoostrovsky");
}
