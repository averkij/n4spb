// landmarksFill - the land fill "Новый намыв острова Декабристов" (OSM landuse=construction w1053534560, 1.49 km2 of reclaimed Gulf coast, west of the Morskaya Embankment quarter) DRESSED as a young district under construction.
// AUTHORED for n4spb (docs/gdm-D2.md): the source project never drew the fill (its review calls the area wasteland, docs/research/gaps-vo-2026.md G08 / G23) and OpenStreetMap holds no building and (west of x -7900) no street there,
// so the module invents NOTHING that claims to be real: it draws the generic fabric of any new district being built on a fill, on the ground class `construction` that the engine already applies to the polygon.
//   plan.js    the planned grid, parallel to the coast: embankment roadbed (t 120), three more avenues, cross streets every 260 m, cut wherever it meets a real road, a building, a green / parking polygon or the water;
//              the plots are chosen by their distance to the built corner: topped-out frames with their cladding half done, bare frames, foundation fields, container yards, one concrete batching plant, graded pads
//   roads.js   the roadbeds (hardcore with shoulders, decals)      site.js  frames, foundation fields, tower cranes, the batching plant, pads (static parts + solid structure colliders)
//   stuff.js   hoarding (knock bays), containers, site cabins, pallets, big-bags, pipe piles, excavators, dump trucks and floodlight masts (knock records)
// WORLD RULES (docs/AREAS.md 13): water is reachable: no site, mast or roadbed lies within 40 m (roadbeds 22 m) of the water, and nothing is built along the shore (no fence, no wall); every hoarding bay and every item of the yards
// is a knock bay / record; solid on purpose: the columns, cores and first-floor walls of the frames, the crane masts and bases, the silos, the mixer house and the aggregate bunkers (structures); no colliders: the roadbeds, the pads, the
// foundation fields (ankle height, flat) and the heaps. No flags, no flagpoles, no aircraft lights.
// Publishes ctx.services.landmarksFill = { triangles, sites, roads, colliders, knock, bays, parts }. Provenance: new module (no source file); the Parts collector (kit.js) and the instancing helpers (inst.js) are copies, see their headers.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksFill/kit.js';
import { makeMats } from './landmarksFill/mats.js';
import { makePlan } from './landmarksFill/plan.js';
import { frame, foundation, crane, plant, pad } from './landmarksFill/site.js';
import { makeGeos, siteStuff, hoarding, flushStuff, flushHoarding, embankmentMasts } from './landmarksFill/stuff.js';
import { roadsGeometry } from './landmarksFill/roads.js';
import { GROUPS_LIST } from './landmarksFill/groups.js';

const FENCED = { topped: 'nsew', frame: 'nsew', pit: 'nse', yard: 'nw', plant: 'nsew', graded: '' };

function addParts(K, name) {
  const meshes = K.P.build(K.root, { name });
  for (const m of meshes) {
    if (m.material === K.M.road) { m.castShadow = false; K.ctx.noOutline(m); } else if (m.material === K.M.lattice || m.material === K.M.vc2) K.ctx.noOutline(m);
  }
  const n = K.P.tris; K.svc.triangles += n; K.P = new Parts(); return n;
}

export function build(ctx) {
  const t0 = performance.now();
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksFill) || GROUPS_LIST).map((g) => g.key));
  const root = new THREE.Group(); root.name = 'landmarksFill';
  const M = makeMats(ctx), plan = makePlan(ctx);
  const svc = { triangles: 0, sites: {}, roads: plan.roads.length, roadLength: plan.stats.roadLen, colliders: 0, knock: 0, bays: 0, parts: {} };
  if (!claimed.has('fill-construction')) { ctx.services.landmarksFill = { ...svc, skipped: true }; return; }
  const K = { ctx, M, THREE, root, svc, plan, geos: makeGeos(M), acc: new Map(), bays: [], extraTris: 0, P: new Parts() };

  roadsGeometry(K, plan.roads); addParts(K, 'lmfill-roads');
  for (const S of plan.sites) {
    const rng = ctx.rng(S.seed), t = S.type, hw = S.w / 2;
    K.P.push(S.cx, 0, S.cz, S.rot);
    if (t === 'topped' || t === 'frame' || t === 'pit') {
      const tower = rng() < 0.4, bw = tower ? 26 : 54 + rng() * 10, bd = tower ? 26 : 16, bx = tower ? -14 : (rng() - 0.5) * 8, bz = -26, floors = t === 'topped' ? 9 + Math.floor(rng() * 6) : 3 + Math.floor(rng() * 4);
      if (t === 'pit') foundation(K, S, { x: bx, z: bz, w: bw, d: bd }, rng);
      else frame(K, S, { x: bx, z: bz, w: bw, d: bd, floors, clad: t === 'topped' ? floors - 3 : 0 }, rng);
      const cH = t === 'pit' ? 36 : Math.max(36, floors * 3.2 + 15);
      crane(K, S, { x: tower ? bx + bw / 2 + 11 : bx + (rng() * 2 - 1) * 16, z: tower ? bz : bz + bd / 2 + 9, H: cH, L: 42 + rng() * 14, a: rng() * Math.PI * 2, white: rng() < 0.3 }, rng);
      pad(K, S, { x: 0, z: 22, w: S.w - 16, d: 52, color: '#8a867c' });
    } else if (t === 'yard') {
      pad(K, S, { x: 0, z: -30, w: S.w - 8, d: 60, color: '#9a9588' }); pad(K, S, { x: 0, z: 40, w: S.w - 8, d: 36, color: '#8a867c' });
    } else if (t === 'plant') {
      plant(K, S, { x: -2, z: -10 }, rng); pad(K, S, { x: 0, z: -4, w: S.w - 8, d: 100, color: '#938f84' });
    } else pad(K, S, { x: 0, z: 0, w: S.w - 6, d: S.d - 6, color: '#7d796f' });
    K.P.pop();
    const nT = addParts(K, 'lmfill-site-' + S.id); (svc.byType ||= {})[t] = (svc.byType[t] || 0) + nT;
    siteStuff(K, S, rng);
    hoarding(K, S, FENCED[t], rng);
    svc.sites[t] = (svc.sites[t] || 0) + 1;
  }
  embankmentMasts(K, plan.roads, plan);
  const tStuff = flushStuff(K), tHoard = flushHoarding(K);
  ctx.addStatic(root);
  svc.parts = { static: svc.triangles, knock: tStuff, hoarding: K.extraTris };
  svc.triangles += tStuff + K.extraTris;
  svc.buildMs = Math.round(performance.now() - t0);
  ctx.services.landmarksFill = { ...svc, tHoard };
  if (typeof process !== 'undefined' && process.env && process.env.FILL_DEBUG) console.log('[landmarksFill]', JSON.stringify(ctx.services.landmarksFill));
}
