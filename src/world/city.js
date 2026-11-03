import { bakedData } from '../core/baked-world.js';
import { captureRegions, captureSilhouettes } from '../core/region-streamer.js';
// city - every ordinary building of central Saint Petersburg (everything no landmark module owns), built from the OSM footprints of data/city.js.
//
// STATUS (done / not done / next):
//   DONE  wall shader (14 archetypes, shop fronts with interiors, parade doors, arches, belt courses, frieze, wear, restoration nets), edge graph (party walls / firewalls / z-fight safe),
//         carriage arches + vault tunnels + collider gaps (also metro DOORWAYS), cornices, sheet-iron decks (grey / green / red), mansards + dormers, chimneys, balconies, erkers, corner turrets,
//         shop signs (POIS, brands replaced by generic names) + awnings + address plates, steps / canopies, downpipes, AC units, scaffolding, KNOWN Nevsky houses. ~600 k triangles, ~4 ms/frame.
//         No flags / flagpoles are drawn anywhere.
//   WEST (2026-10)  prep.js (raised parts + synthesised bases: no floating houses, no 40 m towers from parts), known.js (research houses of Nevsky Fontanka -> Admiralty: storeys, cornice, colours, trim class,
//         roof, mansard, turret, gate, granite cladding), heights.js (neighbour median for unmapped heights), towers.js (City Duma tower), y-aware party walls for raised parts (edges.js).
//   PETRO (2026-10)  the Petrograd side and the Spit of Vasilievsky Island (regions P1..P5, V1, V2): two archetypes in the wall shader (NORDIC = Northern Modern tenement, NEOCLASSIC1910 =
//         neoclassical revival), bay windows at off-centre feature bays, shaped gables + roof balustrades / attics (gables.js), helm / tent / spire / dome turret tops, a district-aware
//         default (district.js: zone mix, palettes, pavilions, heights), 189 KNOWN houses from the sight dossiers (tools/city-known-petro.mjs). The older regions are frozen:
//         tools/city-signature.mjs --ref HEAD proves that no record and no mesh of them changes. docs/city-api.md "Petrograd-side archetypes".
//   NOT DONE  pitched roofs (decks are flat), glazed rooftop additions of modern infill, wall lanterns, cables, ghost ads, blade signs, interior of the arches beyond a plain vault, per-street tuning of the
//         Stalin / panel / modern variants (only default looks checked), more KNOWN houses (Marata, Ligovsky, Vladimirsky).
//   NEXT  compare more streets with the photos (Marata 37 / Ligovsky 65 / Kolokolnaya 8 types), tune palette weights (CLASSIC share still high), add pitched roofs on simple rectangles.
//
// Owns: src/world/city.js and src/world/city/**   (docs/city-api.md describes the reusable parts: the wall shader wallmat.js, the edge graph, the cornice sweep ...).
// Pipeline (build):
//   1. archetypes.describe(record): archetype (14 types of docs/research/architecture.md), storeys / heights (L.heightOf = the cornice height, era tables in layout.js), colour
//      (neighbour-aware), wear, restoration net; KNOWN = the houses the research photographs describe (Nevsky 100 / 104 / 108 ...).
//   2. edges.analyse: the street wall as a graph: which ring edges are party walls (hidden), blank firewalls above lower neighbours, street / courtyard facing, adjacency.
//   3. passages.js: carriage arches (OSM passage ways) cut the wall (gates), tunnels with vaults behind them, collider gaps.
//   4. walls.js: one quad per sub-wall for the wall shader (windows, shop fronts, doors, balcony bays are painted per fragment); cornice.js sweeps the cornice; roofs.js the decks.
//   5. details: balconies / erkers / turrets, mansards, chimneys, shop signs (POIS), awnings, entrances, plates, scaffolding, AC units ... (details.js)
//   Draw calls: everything is collected into streams per 160 m cell (meshes.js): walls (shader), core stone, fine details (LOD), roofs, railings: ~6 meshes per cell, all noBatch.
// Sources: docs/research/architecture.md + nevsky.md + streets.md, the Commons photos in SP/refs/{architecture,nevsky,streets}, docs/reference/yandex-center.png.
// Services: ctx.services.city = { buildings, triangles, entrances: [{x,z,rotY,bldg}] (rotY faces outward), walls, styles, report, buildMs }
import * as THREE from 'three';
import { BUILDINGS, OVERLAPS } from './data/city.js';
import * as L from './layout.js';
import { hash01 } from './lib/massing.js';
import { ARCH } from './city/wallmat.js';
import { DISTRICT_ROOFS, VO_ROOFS, VO_ROOFS_FLAT, regionOf } from './city/district.js';
import { ownedGroups, isOwned } from './lib/claims.js';
import { describe, assignColours, pickW, PALETTE } from './city/archetypes.js';
import { analyse } from './city/edges.js';
import { buildWalls } from './city/walls.js';
import { addCornice, CORNICE_H, CORNICE_SIMPLE } from './city/cornice.js';
import { addDeck, deckPlan, ROOF_COLOURS } from './city/roofs.js';
import { planPassages, buildPassages, edgeGaps } from './city/passages.js';
import { buildDetails } from './city/details.js';
import { LOD } from './city/instances.js';
import { CityMeshes } from './city/meshes.js';
import { prepare } from './city/prep.js';
import { buildTowers } from './city/towers.js';
import { buildCanopies } from './city/canopies.js';

const TRIMS = [null, '#f4f1e8', null, '#ecdfba', '#c5c2b8', '#8c867c', '#7c9486'];
// NORDIC stucco has no white trim: its smooth bands are the wall colour lightened (the same mix as the wall shader), so cornice, bay windows and gable copings match the painted bands
const NORDIC_SMOOTH = new THREE.Color().setRGB(0.90, 0.88, 0.82);
const trimColour = (st) => (st.arch === ARCH.NORDIC && !st.trimClass ? st.color.clone().lerp(NORDIC_SMOOTH, 0.34) : st.trimClass === 2 ? st.color.clone().lerp(new THREE.Color('#ffffff'), 0.07) : st.trimClass ? new THREE.Color(TRIMS[st.trimClass]).lerp(st.color, 0.06) : new THREE.Color('#efe8d8').lerp(st.color, 0.10));
const BLOCKOUT = '#c27a5b';        // claimed landmarks whose owner module is not built yet (terracotta blockout)

export async function build(ctx) {
  const { THREE } = ctx;
  const baked = await bakedData(ctx, 'city-base');
  if (baked && ctx.regions) {
    const root = new THREE.Group(); root.name = 'city'; ctx.addStatic(root);
    LOD.items.length = 0; LOD.scale = ctx.quality.lod || 1;
    for (const it of baked.colliders) ctx.physics._insert(it);
    ctx.services.city = baked.service;
    await ctx.regions.register(baked, root);
    ctx.onUpdate(() => LOD.update(ctx.player.position));
    return;
  }
  const colliderStart = ctx.physics.items.length;
  const t0 = performance.now(), T = {}, lap = (k) => { T[k] = Math.round(performance.now() - t0); if(ctx.recordBake)console.log(`[city-bake] ${k}: ${T[k]} ms`); };
  const root = new THREE.Group(); root.name = 'city'; ctx.addStatic(root);
  const owned = await ownedGroups(ctx);
  const panoramaGroups=new Set((L.GROUPS.landmarksRiverfront||[]).map(g=>g.key));
  // Generated supports retain their source's visual owner. Their synthetic
  // IDs are absent from the claim map, but their physics still belongs here.
  const panorama=b=>{const key=L.groupOf(b._fillOf||b.id);return owned.has(key)&&panoramaGroups.has(key);};
  LOD.items.length = 0; LOD.scale = (ctx.quality && ctx.quality.lod) || 1;
  const near = (x, z, m) => L.inPlay(x, z, -m);                              // within m metres of the play area (the union of the eight rectangles, not its bounding box: the notches stay plain scenery)

  // ---- 1. classification
  // draw records: raised parts get their real thickness, bodies under raised parts that have none are synthesised (prep.js); owned buildings only act as occluders
  // The panorama replaces rendering only. Existing wall physics and door
  // records in an overlap must stay exactly as they were before it was added.
  const skip=b=>isOwned(owned,b.id)&&!panorama(b);
  // Scenic neighbours cannot change a local wall's visibility runs, support
  // fill or carriage-arch choice: those runs also define physical walls.
  const localPrep=prepare(BUILDINGS.filter(b=>!b.waterfront),skip);
  const scenicPrep=prepare(BUILDINGS.filter(b=>b.waterfront),skip);
  const prep={list:localPrep.list.concat(scenicPrep.list),occluders:localPrep.occluders.concat(scenicPrep.occluders),fills:localPrep.fills+scenicPrep.fills};
  const described = prep.list.map((b) => ({ b, st: describe(b) }));
  const customs = described.filter((r) => r.st.custom);                      // hand-built towers (towers.js): not drawn by the wall pipeline, still occluders
  // canopies (building=roof) and moored ships of the new regions (st.special, canopies.js) are not houses: no walls, no part in the street-wall graph, no wall colliders
  const specials = described.filter((r) => r.st.special && !r.st.custom);
  const list = described.filter((r) => !r.st.custom && !r.st.special);
  const occluders = prep.occluders.concat(customs.map((r) => ({ b: r.b, H: r.st.H })));
  // same-footprint duplicates (OVERLAPS same = coplanar decks): only the twin that is NOT drawn by this module loses its deck, never both (w1185754667 / w535381121 had no roof at all: the other twin is `dupOf`-dropped by prep)
  const drawnIds = new Set(list.map((r) => r.b.id));
  const decks = deckPlan(OVERLAPS, drawnIds, (id) => { const q = L.buildingById(id); return !!q && !!regionOf(q); }), dupSkip = decks.skip;      // roofs.js: the rule of the older regions is unchanged
  lap('classify');
  // ---- 2. the street wall graph + colours
  const net=analyse(list.filter(r=>!r.b.waterfront),occluders.filter(r=>!r.b.waterfront));
  const scenicNet=analyse(list.filter(r=>r.b.waterfront),occluders);
  for(const [id,r]of scenicNet.rec)net.rec.set(id,r);
  for(const [id,r]of scenicNet.adj)net.adj.set(id,r);
  const styles = new Map(list.map((r) => [r.b.id, r.st]));
  lap('edges');
  assignColours(styles, net.adj, list.map((r) => r.b));
  for (const r of list) {
    const st = r.st;
    if (L.isClaimed(r.b.id)) { st.hex = BLOCKOUT; st.color = new THREE.Color(BLOCKOUT); }
    st.courtColor = new THREE.Color(pickW(hash01(r.b.id + 'ct'), PALETTE.court));
    st.trim = trimColour(st);
  }
  // ---- 3. carriage arches
  const gates = planPassages(ctx, net, list);

  lap('passages');
  // ---- 4. walls, cornices, decks
  const M = new CityMeshes();
  const panoramaMeshes=new CityMeshes();
  const info = [];
  let colliderCount = 0;
  for (const item of list) {
    const rec = net.rec.get(item.b.id), { b, st } = rec;
    const draw=panorama(b)?panoramaMeshes:M;
    const y0 = Math.max(0, b.minH || 0), floating = y0 > 0.2;
    rec.walls = buildWalls(ctx, rec, (x, z) => draw.walls(x, z), {});
    // cornices along the visible pieces
    for (const ring of rec.rings) for (const e of ring.edges) {
      if (!e.pieces.length) continue;
      const simple = e.hole || !e.street;
      const mx = e.a[0] + e.dx * e.len / 2, mz = e.a[1] + e.dz * e.len / 2;
      addCornice(draw.core(mx, mz), e, y0 + st.H, st.trim, 1, simple ? CORNICE_SIMPLE : undefined);
    }
    // deck (flat sheet-iron) on top of the cornice line
    if (!dupSkip.has(b.id)) {
      // Petrograd side / Vasilievsky: the research roof colour where a table gives one, else the zinc-grey mix of the district (one colour per house, parts included); the older regions keep their mix
      const hex = st.dist ? (st.roofKnown || pickW(hash01((st.fam || b.id) + 'rf'), st.fresh ? (st.arch === ARCH.PANEL || st.arch === ARCH.MODERN ? VO_ROOFS_FLAT : VO_ROOFS) : DISTRICT_ROOFS)) : pickW(hash01(b.id + 'rf'), ROOF_COLOURS);
      st.roofHex = hex;
      const dY = y0 + st.H + CORNICE_H + (decks.lift.has(b.id) ? 0.03 : 0);
      const RB = draw.roof(st.ob.cx, st.ob.cz); RB.cur.set(hex);
      for (const poly of b.polys) addDeck(RB, poly, dY);
      st.deckY = dY;
    }
    // colliders: thin wall boxes along the visible pieces (gaps at arches and metro doorways)
    if (!b.waterfront && !floating && near(st.ob.cx, st.ob.cz, 40)) colliderCount += edgeColliders(ctx, rec);
    info.push(rec);
  }
  for(const stream of Object.values(panoramaMeshes.s))stream.clear();
  lap('walls');
  M.seal(); // Bound ordinary-number collectors before the detail passes.
  // ---- 5. passages (tunnel vaults), details
  const towers = buildTowers(ctx, { M, items: customs });
  const canopies = buildCanopies(ctx, { M, items: specials, near });
  for (const r of specials) { r.st.hex = r.st.knownHex || '#8c9195'; r.st.color = new THREE.Color(r.st.hex); styles.set(r.b.id, r.st); }
  const pass = buildPassages(ctx, { M, gates });
  const detailOwners=new Set([...owned].filter(g=>!panoramaGroups.has(g)));
  const details = buildDetails(ctx, { root, M, info, styles, owned:detailOwners, net });
  lap('details');
  const tris = M.flush(ctx, root);
  lap('flush');
  const buildPhases = Object.fromEntries(Object.entries(T).map(([name, ms], i, entries) => [name, ms - (i ? entries[i - 1][1] : 0)]));
  if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] phases(ms, cumulative)', JSON.stringify(T));                       // the detail passes write into the same streams: flush() already counts them
  if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] streams', Object.fromEntries(Object.entries(M.s).map(([k, v]) => [k, v.size])), 'meshes under root', root.children.length, JSON.stringify(root.children.reduce((a, o) => { a[o.name] = (a[o.name] || 0) + 1; return a; }, {})));
  if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city]', JSON.stringify({ tris: Math.round(tris), details: { ...details.report, shops: { ...details.report.shops, entrances: undefined } }, passages: pass.triangles }));
  ctx.onUpdate(() => LOD.update(ctx.player.position));
  ctx.services.city = { buildings: info.length, triangles: Math.round(tris), entrances: details.entrances || [], walls: info.flatMap((r) => r.walls), styles, report: { ...details.report, colliders: colliderCount, gates: gates.length, dossierGates: ctx._cityDossierGates || 0, fills: prep.fills, towers: towers.towers, canopies }, buildMs: Math.round(performance.now() - t0) };
  ctx.services.city.buildPhases = buildPhases;
  if (ctx.recordBake && !ctx.bakeNavOnly) {
    const { styles, buildMs, buildPhases, ...service } = ctx.services.city;      // (no wall-clock field in a product: two bakes of one source must be byte-identical)
    // Keep public wall measurements; build-time edge/record graphs are not runtime services.
    const fields = ['id','bi','a','b','dx','dz','nx','nz','s0','s1','len','N','bw','shop','base','plinth','G','PN','floors','H','hole','street','gate','midX','midZ','flags'];
    service.walls = service.walls.map(w => Object.fromEntries(fields.map(k=>[k,w[k]])));
    service.report = Object.fromEntries(Object.entries(service.report).map(([k,v])=>[k, Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([,a])=>a == null || typeof a !== 'object')) : v]));
    captureRegions(ctx, 'city-base', root, { service, colliders: ctx.physics.items.slice(colliderStart),
      silhouettes: captureSilhouettes(info.filter(r=>!panorama(r.b))) });
    lap('capture');
  }
}

/** Thin wall boxes along the visible edge pieces; arches / doorways cut gaps (passages.edgeGaps). */
function edgeColliders(ctx, rec) {
  let n = 0;
  const { b, st } = rec, y0 = Math.max(0, b.minH || 0);
  for (const ring of rec.rings) for (const e of ring.edges) {
    for (const pc of e.pieces) {
      const lo = pc.yLow > 0.2 ? y0 + pc.yLow : y0, hi = y0 + st.H + 1.0;
      for (const [t0, t1, under] of edgeGaps(e, pc.t0, pc.t1)) {
        const len = t1 - t0; if (len < 0.25) continue;
        const cx = e.a[0] + e.dx * (t0 + t1) / 2, cz = e.a[1] + e.dz * (t0 + t1) / 2;
        ctx.physics.addBox(cx, cz, len + (under ? 0 : 0.3), 0.6, Math.atan2(-e.dz, e.dx), under ? y0 + 4.3 : lo, hi);
        n++;
      }
    }
  }
  return n;
}
