import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksZhdanovka - the four historic houses of the ZHDANOVSKAYA EMBANKMENT on the Petrograd-side bank of the Zhdanovka, opposite the Petrovsky stadium (the "Ждановский остров" of the user = this area):
// No. 9 the Meisner house (1903, heritage 2023: rose granite ground floor with two arches, brown pebble-dash floors, glazed oriels, copper cornice and dormers; the best-documented sight, one painted elevation + real arches,
// oriels, lintels, dormers), No. 7 (1833: salmon plaster, 14 axes, three stacks of cast-iron balconies, the carriage passage with the curved gable), No. 3 (1911-13 at the Tuchkov bridge: olive plaster, oriels, zinc
// mansard with dormers, the corner turret) and No. 11 (1950s corner block).  The city KNOWN table had wrong entries for No. 9 (NORDIC, 5 storeys) and No. 7 (3 storeys): these houses replace the generic blockout.
// Not drawn here (other owners): the Zhdanovka bridges (bridges/long.js), the bank wall, railing and granite posts (environment), the two mooring dolphins (landmarksPetrovskyStadium), benches / bins of the squares
// (props, OSM furniture), shop brand signs and logos (user rule), street plates (streets).
// Dossier docs/research/petrovsky-zhdanovka-2026.md (CRITIC LOG wins; BUILD LOG: landmarksZhdanovka), photos refs/petrovsky-zhdanovka-2026/misc m01 m02 m03 m05.  User rules: no flags, no alarms, no logos.
// Files: landmarksZhdanovka/frame.js (footprints, edge frames) kit.js shapes.js geom.js (wall / arch / oriel / balcony helpers) art.js mats.js (textures 'lmzhd-', materials 'zhd-') envelope.js (walls, roof, colliders)
// house9.js house7.js house11.js house3.js groups.js.  Tools: tools/landmarksZhdanovka-walk.mjs (walk probe).  Publishes ctx.services.landmarksZhdanovka = { monuments, photoSpots, entrances, crowd, parts, triangles,
// buildMs } and merges monuments / photo spots into ctx.services.landmarks.  Budget about 30 k triangles, <= 20 materials, no per-frame callbacks, every mesh registered with an authored LOD range (kit.js).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksZhdanovka/kit.js';
import { makeMats } from './landmarksZhdanovka/mats.js';
import { GROUPS_LIST } from './landmarksZhdanovka/groups.js';
import { footprint, edgeNear, HOUSES } from './landmarksZhdanovka/frame.js';

// [name, claim key, loader, extra(fp) -> the argument of build]
const PARTS = [
  ['h9', 'zhd-h9', () => import('./landmarksZhdanovka/house9.js'), (fp) => edgeNear(fp.edges, -3552.1, -2366.45)],
  ['h7', 'zhd-h7', () => import('./landmarksZhdanovka/house7.js'), (fp) => edgeNear(fp.edges, -3530.05, -2347.8)],
  ['h11', 'zhd-h11', () => import('./landmarksZhdanovka/house11.js'), (fp) => [edgeNear(fp.edges, -3569.7, -2382.2), edgeNear(fp.edges, -3596.4, -2409.35), edgeNear(fp.edges, -3604.7, -2431.8)]],
  ['h3', 'zhd-h3', () => import('./landmarksZhdanovka/house3.js'), () => null],
  ['squares', null, () => import('./landmarksZhdanovka/squares.js'), () => null],           // the furniture of the two squares: no claim (the squares stay generic), always built
];
const FORCE = (typeof process !== 'undefined' && process.env && process.env.ZHD_FORCE ? process.env.ZHD_FORCE.split(',') : []);   // diagnostics only: build a part whose claim is still off

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksZhdanovka';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], triangles: 0, parts: {} };
  const claimed = new Set(GROUPS_LIST.map((g) => g.key));
  const failed = [], shared = {};
  for (const [name, key, load, extra] of PARTS) {
    if (key && !claimed.has(key) && !FORCE.includes(name)) continue;                                // built only when the claim is on: no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, shared };
    try {
      const fp = HOUSES[name] ? footprint(HOUSES[name]) : null;
      if (HOUSES[name] && !fp) throw new Error('footprint ' + HOUSES[name] + ' missing');
      const m = await load();
      m.build(K, fp, extra(fp));
      if (fp) photoSpotFor(K, name, fp);
    } catch (e) { console.error(`[landmarksZhdanovka] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksZhdanovka] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const built = K.P.build(root, { name: 'zhd-' + name });
    for (const { mesh, mat } of built) if (M.cutouts.has(mat)) ctx.noOutline(mesh);
    svc.triangles += K.P.tris; svc.parts[name] = { tris: K.P.tris, meshes: built.length, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  S.benches = (S.benches || []).concat(svc.benches || []);
  ctx.services.landmarksZhdanovka = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.ZHD_DEBUG) console.log('[landmarksZhdanovka] parts', JSON.stringify(svc.parts), JSON.stringify(svc.squares), 'benches', svc.benches && svc.benches.length);
  if (failed.length) throw new Error('landmarksZhdanovka parts failed:\n' + failed.join('\n'));
}

/** a tourist photo spot across the street from the front of a house: the first spot (13..22 m from the wall) that is neither on the road nor inside a building */
function photoSpotFor(K, name, fp) {
  const FR = { h9: 'h9', h7: 'h7' }[name]; if (!FR) return;
  const sh = K.shared[FR]; if (!sh || !sh.mid) return;
  const n = sh.f.n, net = K.ctx.services.streets && K.ctx.services.streets.net;
  for (let d = 13; d <= 24; d += 1.0) {
    const x = sh.mid.x + n[0] * d, z = sh.mid.z + n[1] * d;
    if (L.insideBuilding(x, z, 1) || L.isOnRoad(x, z, 0.8) || (net && net.cover && net.cover(x, z, {}) > -1.0)) continue;
    K.svc.photoSpots.push({ x, z, yaw: Math.round(L.yawToward(x, z, sh.mid.x, sh.mid.z)), name: name === 'h9' ? 'Дом Мейснера на Ждановской набережной, 9' : 'Ждановская набережная, 7' });
    return;
  }
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksZhdanovka");
}
