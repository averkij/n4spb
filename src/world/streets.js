// STATUS (streets specialist): DONE - network, asphalt / markings / zebras / lane arrows, kerbs + granite pavements, Nevsky chain bollards, Ligovsky / square guard rails, quay railing,
//   lamps A / D / S / L / L2 (per street, streets/style.js), traffic lights with countdowns, name + house-number plates, bus stops, trolleybus wire network (spans, rosettes, arcs, frogs),
//   lane graph + signal plan, parked slots, tram rails, passages, areas, services (docs/streets-api.md). No flags, no sounds.
//   WEST (session 3, 2026-10-03): the west network on the baked data: Nevsky west = red-brown bus lanes + red / white zebras + a double solid line where the two one-way carriageways meet (no
//   median: net.js fillMedians), grey-pink slabs to the facade (Gostiny Dvor promenade), embankment / Admiralty / Palace lamp families, plates for every west street type, speed cameras,
//   gateway guard stones, Neva granite bollards, NO streets drawing on the bridges' decks (streets/decks.js) or on squares a landmark module paves (Kazan, Palace Square), area polygons on
//   levels (no more coplanar squares: the Isaac's Square flicker), micro-gap / exit connectors in the lane graph, wires test OK on the west.
//   TRIANGLE DIET: 1.87 M -> ~0.86 M triangles, build 5.6 s -> ~3.4 s in the page (open cylinders / icosahedra in the repeated meshes, collinear merging of ribbons, strips and pavements,
//   hashed lookups in the placers). Check: node tools/check.mjs streets; node tools/wires-test.mjs; STREETS_DEBUG=1 prints triangles per mesh and ms per phase.
//   ROAD CLEARANCE RULE (2026-10-05): no pole, lamp, sign, mast, guard stone, chain post or parking slot stands on any asphalt (own pocket, other carriageways, fillets: furn.js poleClear / clearNear / nudgeClear);
//   a base that is not clear slides back along its arm, moves outward / to the nearest clear pavement, else is dropped (signals.js clearSpot, zebra poles, extras.js signs, lamps.js, wires.js, parking.js).
//   MARKINGS / SIGNS / PLATES (2026-10-06): road markings by rule (streets/markings.js, docs/rules/ROAD-MARKINGS.md, audit tools/streets-markings-audit.mjs), GOST sign faces in one place (streets/signs.js),
//   the city's standard name + number plates (streets/plates.js), the facade label registry ctx.services.labels (streets/labels.js, docs/rules/LABELS-API.md); docs/rules/SIGNS-AND-PLATES.md.
//   THE NEVSKY STRIP (n4spb): the extensions of the full city (Petrograd side, Vasilievsky Island, the islands of round 2: tram beds, steel yard rails, sight keep-clear zones, address plates of the sights, island corner patches,
//   strip patches, slab medians, pier / water-ring clipping ...) were cut together with their districts; the eight regions that remain are the ones that were reviewed first and are drawn as they always were.
//   EVERY district: no paving / steps ribbon over an open metro stair pit (streets/holes.js cutHoles: layout.GROUND_HOLES kind 'stairs' + 0.3 m; the carriageway is never cut).
//   NOT DONE / NEXT: bus-lane pictogram, hatched islands, real steps, the Ligovsky median parking, tram wires on the bridge decks (bridges), the boulevard fence of Bolshoy pr.
// streets - everything a pedestrian or driver stands on except the raw ground (environment): asphalt, junction fillets, lane markings, zebra crossings,
// granite kerbs, granite-slab pavements, mapped footways, the Nevsky chain bollards and guard rails, road furniture (flower-bowl lamps, traffic lights, signs,
// navy street-name and house-number plates, bus / trolleybus stops), the trolleybus OVERHEAD WIRES (cross-spans on facade rosettes) and the road LOGIC (lane graph,
// junctions, stop lines, signal plans, parked slots) that the traffic and people modules drive on. Saint Petersburg: docs/research/{streets,nevsky,transport}.md.
// Code: streets/*.js (net = network + junction fillets + kerb runs, surface = asphalt / kerbs / markings / crossings, walks = pavements, lanes + lanegraph = lane graph and
// signal plan, lamps / signals / stops = furniture, wires = the trolleybus network, parking = slots, tex = canvas textures, style = per-street choices).
// Layers: ground 0 < footway 0.02-0.05 < asphalt 0.03 < wear / gutter decals 0.033 < paint 0.037 < pavement 0.12 < kerb top 0.15.
//
// SERVICE  ctx.services.streets = (full contract in docs/streets-api.md)
//   roads [{id, pts, w, hw, name, oneway}], laneAt(x,z), parkedSlots [{x,z,rotY,kind}], crosswalks [{id, pts, w, signalised, signal}], sidewalks [{pts, w}],
//   lanes [{id, road, dir, idx, pts, width, len, from, to, speed, rank}], junctions [{id, x, z, lanes, out, signal, connectors, arms}], connectors [{id, from, to, pts, turn}],
//   stopLines [{lane, s, x, z, signal, approach, give}], signals [{id, x, z, approaches:[{index, bearing, group, lanes, crossing}]}],
//   signalState(signalId, approachIndex, t) -> 'green'|'amber'|'red', pedState(crossingId, t) -> 'walk'|'flash'|'dont',
//   crossingsAt(x,z), lamps [{x,z,h}], busStops [...], guardRails [{id, pts}] (the OSM fences w927528539/40 are drawn here: the city module must skip them)
import * as THREE from 'three';
import { bakedData } from '../core/baked-world.js';
import { packTexture, unpackTexture } from '../core/baked-meshes.js';
import { captureRegions } from '../core/region-streamer.js';
import { MB } from './streets/util.js';
import { VB } from './streets/vb.js';
import { buildNet, packKerbRuns, nearestWay, wayAt, nearCrossing } from './streets/net.js';
import { roadPlan } from './lib/road-plan.js';
import { buildLaneGraph } from './streets/lanegraph.js';
import { makeStreetTextures } from './streets/tex.js';
import { buildAsphalt, buildKerbs, buildMarkings, buildCrossings, buildManholes, buildStopLines, addArrow } from './streets/surface.js';
import { buildWalks } from './streets/walks.js';
import { buildPaths, buildAreas, buildPassages } from './streets/paths.js';
import { buildLamps } from './streets/lamps.js';
import { buildSignals } from './streets/signals.js';
import { planStops, buildStops } from './streets/stops.js';
import { buildBarriers } from './streets/barriers.js';
import { buildQuay } from './streets/quay.js';
import { planParking } from './streets/parking.js';
import { buildWires } from './streets/wires.js';
import { buildLots, buildBayLines, buildStopMarks, buildTramRails, placeParkSigns, buildSpeedCameras, placeBaySigns, TAXI_RANKS, COACH_BAYS } from './streets/extras.js';
import { makePanels, makeKnockPosts, INST_STATS } from './streets/furn.js';
import { makeSigns } from './streets/signs.js';
import { makeLabels } from './streets/labels.js';
import { MeshBuilder } from './lib/massing.js';
import { ownedGroups, isOwned } from './lib/claims.js';
import { HOOKS } from './lib/area-tables.js';
import { AREAS, ENTRANCES, TRAMWAYS, LAMPS } from './data/city.js';
import { SHAFTS } from './data/metro.js';
import { debugScene } from './streets/debug.js';
import { setDecksEnabled, deckAt } from './streets/decks.js';
import { cutHoles } from './streets/holes.js';

export { ribbon } from './streets/paths.js';

const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };

const DBG = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('st')) || '';      // debug: ?st=nolamps,nosig,nostops,nowires,nobody

export async function build(ctx) {
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()), t00 = nowMs();
  const { mat, L } = ctx;
  const root = new THREE.Group(); root.name = 'streets'; ctx.addStatic(root);
  const owned = await ownedGroups(ctx);
  setDecksEnabled(!ctx.buildList || ctx.buildList.includes('bridges'));          // the bridges module draws the decks (streets/decks.js); without it the roads keep crossing the canals
  const textureBake = await bakedData(ctx, 'street-textures');
  const T = textureBake ? Object.fromEntries(await Promise.all(Object.entries(textureBake).map(async ([key, value]) => [key, await unpackTexture(value)]))) : makeStreetTextures(ctx);
  if (ctx.recordBake && !ctx.bakeNavOnly) ctx.recordBake('street-textures', Object.fromEntries(Object.entries(T).map(([key, value]) => [key, packTexture(value)])));
  const net = await roadPlan(ctx);
  if (ctx.recordBake && !ctx.bakeNavOnly) ctx.recordBake('street-kerbs', packKerbRuns(net));
  const pedHook = HOOKS.pedestrianOnly?.(ctx);          // the area's pedestrian ways (the North: the Paradny quarter, which landmarksTauride draws; hooks/keep-out.js), once per build
  for (const w of net.ways) {
    w.pedestrianOnly = !!(pedHook && pedHook(w));
    // the Anichkov deck, its asphalt and kerbs belong to landmarksC once it draws them; the OSM living-street trace round the Palace Square stone field (w217399816 + spurs) belongs to landmarksG's paving (no raised kerb / dashes in the square)
    // service ways / living streets claimed by a landmark module (New Holland's park lanes, a courtyard a landmark paves): the landmark draws them, they carry no cars, lanes or furniture of ours
    // (a claimed bridge keeps its lanes: the bridges module draws the deck, the cars drive over it)
    if (isOwned(owned, w.id) && (w.rank === 0 || w.hw === 'living_street') && !w.bridge) w.pedestrianOnly = true;
    // the pedestrian decks of the bridges module (sites with ped: true, the Triple Bridge: sett decks closed to cars): the ways over them carry no lanes, signals, stop plates, zebras or signs
    if (!w.pedestrianOnly && w.x.filter((x, i) => { const d = deckAt(x, w.z[i]); return d && d.ped; }).length > w.x.length * 0.5) w.pedestrianOnly = true;
    // a tram reservation (net.js tramReservation: the emergency-access way between the two tracks of a paved tram bed) is no road: no cars, lanes, asphalt or furniture; extras.js draws the bed
    if (w.tramBed) w.pedestrianOnly = true;
    w.skipDraw = (isOwned(owned, w.id) && (!!w.bridge || w.hw === 'living_street')) || w.pedestrianOnly;
  }
  const graph = buildLaneGraph(net);
  const stats = { tris: {}, ms: {} };
  let tm = t00;
  const lapMs = (k) => { const n = nowMs(); stats.ms[k] = Math.round(n - tm); tm = n; };
  lapMs('textures+net+graph');

  const M = {
    asphalt: mat.toon('#ffffff', { map: T.asphalt, polygonOffset: -2.2, paint: 0.03, name: 'pt-asphalt' }),
    service: mat.toon('#e4e0da', { map: T.asphalt, polygonOffset: -1.8, paint: 0.04, name: 'pt-service' }),
    cobble: mat.toon('#ffffff', { map: T.cobble, polygonOffset: -2.0, paint: 0.05, name: 'pt-cobble' }),
    brickRoad: mat.toon('#ffffff', { map: T.brick, polygonOffset: -1.6, paint: 0.05, name: 'pt-brickroad' }),
    slab: mat.toon('#ffffff', { map: T.slab, vertexColors: true, paint: 0.04, name: 'pt-slab' }),
    paver: mat.toon('#ffffff', { map: T.paver, vertexColors: true, paint: 0.04, name: 'pt-paver' }),
    strip: mat.toon('#ffffff', { map: T.strip, vertexColors: true, paint: 0.04, name: 'pt-strip' }),
    ramp: mat.toon('#ffffff', { map: T.tactile, paint: 0.02, name: 'pt-ramp' }),
    kerb: mat.toon('#ffffff', { map: T.kerb, vertexColors: true, paint: 0.03, name: 'pt-kerb' }),
    skirt: mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'pt-skirt' }),
    gutter: mat.decal('#ffffff', { map: T.gutter, polygonOffset: -2.7, name: 'pt-gutter' }),
    wear: mat.decal('#ffffff', { map: T.wear, polygonOffset: -2.6, name: 'pt-wear' }),
    paint: mat.decal('#ffffff', { map: T.paint, vertexColors: true, polygonOffset: -3.5, name: 'pt-paint' }),
    busLane: mat.decal('#ffffff', { map: T.paint, vertexColors: true, polygonOffset: -3.1, name: 'pt-buslane' }),
    foot: mat.toon('#ffffff', { map: T.brick, polygonOffset: -1.4, paint: 0.04, name: 'pt-foot' }),
    footSlab: mat.toon('#ffffff', { map: T.slab, vertexColors: true, polygonOffset: -1.4, paint: 0.04, name: 'pt-foot-slab' }),
    footPaver: mat.toon('#ffffff', { map: T.paver, vertexColors: true, polygonOffset: -1.4, paint: 0.04, name: 'pt-foot-paver' }),
    footGravel: mat.toon('#b58c78', { polygonOffset: -1.4, paint: 0.09, name: 'pt-foot-gravel' }),         // surface=compacted / fine_gravel: the pink-tan gravel of the Alexander Garden paths
    footAsph: mat.toon('#ffffff', { map: T.asphalt, polygonOffset: -1.4, paint: 0.04, name: 'pt-foot-asph' }),
    steps: mat.toon('#a8a39d', { polygonOffset: -1.5, paint: 0.04, name: 'pt-steps' }),
    area: mat.toon('#b9b3ad', { map: T.slab, polygonOffset: -1.3, paint: 0.05, name: 'pt-area' }),
    lot: mat.toon('#d9d6d0', { map: T.asphalt, polygonOffset: -1.9, paint: 0.05, name: 'pt-lot' }),
  };
  const add = (b, material, o = {}) => {
    if (b.empty) return null;
    for (let i = 0; i < b.pos.length; i++) if (!Number.isFinite(b.pos[i])) { console.warn('[streets] NaN in ' + (o.name || material.name)); break; }
    const m = new THREE.Mesh(b.build(), material);
    m.name = o.name || material.name; m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false;
    if (o.noOutline) ctx.noOutline(m);
    root.add(m); stats.tris[m.name] = (b.idx ? b.idx.length : 0) / 3;
    return m;
  };
  const plaza = AREAS.filter((a) => a.id === 'w638352776').flatMap((a) => a.polys.map((p) => p.o));
  const inPlaza = (x, z) => plaza.some((o) => ringHas(o, x, z));
  // squares / pedestrian areas that a landmark module paves (Kazan Square, Palace Square: layout.GROUPS osm ids): no pavement, lamps or furniture of ours inside
  const ownedRings = AREAS.filter((a) => (a.hw === 'square' || a.hw === 'pedestrian' || a.hw === 'footway') && isOwned(owned, a.id)).flatMap((a) => a.polys.map((p) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); } return { o: p.o, b: [x0, x1, z0, z1] }; }));
  const inOwnedArea = (x, z) => ownedRings.some((r) => x >= r.b[0] && x <= r.b[1] && z >= r.b[2] && z <= r.b[3] && ringHas(r.o, x, z));

  if (DBG.includes('ground') || DBG.includes('bld')) debugScene(ctx, root, DBG);

  // metro entrances / shaft rectangles: no furniture within a few metres (the metro module builds there)
  const entr = [...ENTRANCES.map((e) => [e.x, e.z]), ...SHAFTS.map((h) => [h.x, h.z])];

  // ---------------------------------------------------------------- ground surfaces
  const stops = planStops(net); lapMs('stops');
  const parkedSlots = planParking(net); lapMs('parking');
  let walks, pathLines;
  const surfaceBake = await bakedData(ctx, 'street-surfaces');
  if (surfaceBake && ctx.regions) {
    walks = surfaceBake.walks; pathLines = surfaceBake.pathLines;
    { const ms = stats.ms; Object.assign(stats, surfaceBake.stats); stats.ms = ms; }        // (the bake carries an empty ms table: keep the laps measured so far, textures+net+graph / stops / parking)
    await ctx.regions.register(surfaceBake, root);
  } else {
  const asph = new MB(), cobb = new MB(), serv = new MB(), brk = new MB(), kerb = new MB(true), gut = new MB(), wear = new MB(), paint = new MB(true);
  buildAsphalt(net, asph, serv, cobb, brk); lapMs('asphalt');
  buildKerbs(net, kerb, gut, paint); lapMs('kerbs');
  const arrows = [], pt0 = () => paint.tris, pmark = {};
  let pm = pt0(); const lap = (k) => { pmark[k] = Math.round(pt0() - pm); pm = pt0(); };
  lap('kerbYellow');
  const redLane = new MB(true);
  const mkPlan = buildMarkings(net, paint, wear, arrows, redLane, graph); lap('markings'); stats.markings = mkPlan.stats.counts;
  for (const a of arrows) addArrow(paint, a); lap('arrows');
  stats.bayLines = buildBayLines(paint, parkedSlots.lines || []); lap('bayLines');
  stats.stopMarks = buildStopMarks(paint, stops); lap('stopMarks');
  stats.crossings = buildCrossings(net, paint); lap('zebras');
  stats.stopLines = buildStopLines(mkPlan, paint); lap('stopLines');
  stats.manholes = buildManholes(net, paint); lap('manholes');
  stats.paintTris = pmark; lapMs('markings+crossings');
  stats.tram = buildTramRails(net, paint, cobb, (id) => isOwned(owned, id));
  const slab = new MB(true), paver = new MB(true), strip = new MB(true), ramp = new MB(), skirt = new MB(true);
  const SPG = new Map();                                                          // stops (9 m) and metro entrances (3.6 m) hashed in 12 m cells: nearStop is asked for every pavement sample
  for (const [x, z, r] of [...stops.map((s) => [s.x, s.z, 9]), ...entr.map((e) => [e[0], e[1], 3.6])]) { const k = Math.floor(x / 12) * 4096 + Math.floor(z / 12); let l = SPG.get(k); if (!l) SPG.set(k, (l = [])); l.push([x, z, r]); }
  const nearStop = (x, z) => { const cx = Math.floor(x / 12), cz = Math.floor(z / 12); for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) for (const p of SPG.get(a * 4096 + b) || []) if (Math.hypot(p[0] - x, p[1] - z) < p[2]) return true; return false; };
  walks = buildWalks(net, { slab, paver, strip, ramp, skirt, paint }, { isOwned: (id) => isOwned(owned, id), nearStop });
  lapMs('walks');
  const foot = new MB(), steps = new MB();
  const footX = { slab: new MB(true), paver: new MB(true), gravel: new MB(), asph: new MB() };
  pathLines = buildPaths(foot, steps, net, footX, (id) => isOwned(owned, id));
  stats.passages = buildPassages(brk);
  const areaB = { road: new MeshBuilder(), slab: new MeshBuilder(), paver: new MeshBuilder(), island: new MeshBuilder() }, areaSkirt = new MB(true), lots = new MeshBuilder();
  stats.lots = buildLots(lots);
  stats.areas = buildAreas(areaB, AREAS, (id) => isOwned(owned, id), areaSkirt, net, inOwnedArea); lapMs('paths+areas');

  // no paving over an open metro stair pit (layout.GROUND_HOLES kind 'stairs' + 0.3 m: streets/holes.js): the WALKING surfaces are cut there (pavement bands, corner patches, ramps,
  // skirts, mapped footways and steps, paving areas, lots); the carriageway (asphalt, kerb, gutter, wear, paint) is never cut
  const walking = [slab, paver, strip, ramp, skirt, foot, steps, footX.slab, footX.paver, footX.gravel, footX.asph, lots, areaB.slab, areaB.paver, areaB.island, areaSkirt];
  stats.holeCuts = walking.reduce((n, b) => n + cutHoles(b), 0);
  lapMs('holes');

  add(asph, M.asphalt); add(cobb, M.cobble); add(serv, M.service); add(brk, M.brickRoad);
  add(kerb, M.kerb, { name: 'pt-kerb' });
  add(slab, M.slab); add(paver, M.paver); add(strip, M.strip); add(ramp, M.ramp); add(skirt, M.skirt);
  add(gut, M.gutter, { noOutline: true }); add(wear, M.wear, { noOutline: true }); add(redLane, M.busLane, { noOutline: true }); add(paint, M.paint, { noOutline: true });
  add(foot, M.foot); add(steps, M.steps);
  add(footX.slab, M.footSlab); add(footX.paver, M.footPaver); add(footX.gravel, M.footGravel); add(footX.asph, M.footAsph);
  if (!lots.empty) { const m = new THREE.Mesh(lots.build(), M.lot); m.name = 'pt-lots'; m.receiveShadow = true; root.add(m); }
  for (const [k, mt] of [['road', M.service], ['slab', M.slab], ['paver', M.paver], ['island', M.paver]]) {
    const b = areaB[k]; if (b.empty) continue;
    const m = new THREE.Mesh(b.build(), k === 'slab' || k === 'paver' || k === 'island' ? mat.toon('#ffffff', { map: k === 'slab' ? T.slab : T.paver, polygonOffset: -1.3, paint: 0.05, name: 'pt-area-' + k }) : mt);
    m.name = 'pt-area-' + k; m.receiveShadow = true; root.add(m);
  }
  add(areaSkirt, M.skirt);

    if (ctx.recordBake && !ctx.bakeNavOnly) captureRegions(ctx, 'street-surfaces', root, {
      walks: { ...walks, rails: walks.rails.map(({pts, side}) => ({pts, side})) }, pathLines, stats: { ...stats, ms: {} }
    }, true);
  }
  // ---------------------------------------------------------------- furniture
  lapMs('meshes');
  const shared = { panels: makePanels(ctx), poles: new VB(), signs: makeSigns(ctx) };
  ctx.services.labels = ctx.services.labels || makeLabels();             // the facade label registry (docs/rules/LABELS-API.md): plates reserve first, the city's shop signs ask later
  const mVC = mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pt-furn' });
  shared.kposts = ctx.knock ? makeKnockPosts(ctx, shared.panels, mVC) : null;      // knockable posts (furn.js): signal poles, mast arms, sign posts, speed cameras are instances with records; null without ctx.knock = the merged pt-poles path
  const signals = DBG.includes('nosig') ? { masts: 0, heads: 0, crossingSigns: 0, plates: 0, bilingual: 0, signTex: {} } : buildSignals(ctx, net, graph, T, shared, { isOwned: (id) => isOwned(owned, id) });
  lapMs('signals'); stats.polesBy = { signals: shared.poles.tris };
  if (signals.roadSign) stats.parkSigns = placeParkSigns(net, parkedSlots, signals.roadSign, signals.signTex.park);
  if (signals.tallSign) stats.baySigns = { taxi: placeBaySigns(net, signals.tallSign, signals.signTex.taxi, TAXI_RANKS), coach: placeBaySigns(net, signals.tallSign, signals.signTex.coach, COACH_BAYS) };
  /** the mapped lamps of the Gostiny Dvor promenade (a second row 6-30 m from the kerb, 10-14 m apart, between the tree rows): the square-lantern model, the crook turned to the avenue */
  const gostinyLamps = () => {
    const out = [];
    for (const l of LAMPS) {
      if (l.x < -1160 || l.x > -995 || l.z < -300 || l.z > -150 || L.insideBuilding(l.x, l.z, 0.3)) continue;
      const h = nearestWay(net, l.x, l.z, 40, 3); if (!h || h.off < 6 || h.off > 32) continue;
      const q = wayAt(h.w, h.w.s[h.i] + (h.w.s[h.i + 1] - h.w.s[h.i]) * h.q.t), dx = q.x - l.x, dz = q.z - l.z, d = Math.hypot(dx, dz) || 1;
      out.push({ x: l.x, z: l.z, rotY: Math.atan2(dx, dz), nx: -dx / d, nz: -dz / d });
    }
    return out;
  };
  const lamps = DBG.includes('nolamps') ? { count: 0, list: [] } : buildLamps(ctx, net, T, root, { owned: new Set([...owned]), inPlaza, skipAt: inOwnedArea, extra: gostinyLamps(), avoid: [...stops.map((s) => [s.x, s.z]), ...entr], tPool: T.pool, poles: shared.poles, panels: shared.panels });
  lapMs('lamps');
  const stopOut = DBG.includes('nostops') ? { stops: 0, shelters: 0, list: [] } : buildStops(ctx, net, stops, shared, root);
  lapMs('stopsBuild'); stats.polesBy.stops = shared.poles.tris - stats.polesBy.signals;
  stats.speedCameras = buildSpeedCameras(ctx, net, shared.poles, shared.kposts);
  const barriers = buildBarriers(ctx, net, walks, shared.poles, root, lamps.list); lapMs('barriers');
  stats.barriers = barriers.stats;
  stats.quay = !DBG.includes('noquay') ? buildQuay(ctx, net, root, [...stops.map((s) => [s.x, s.z]), ...entr]) : null;   // the quay railing is drawn by environment; this adds only the guard stones (?st=noquay skips them)
  const wireOut = DBG.includes('nowires') ? null : buildWires(ctx, net, lamps, { avoid: graph.signals.filter((g) => !g.mid).map((g) => [g.x, g.z]), inPlaza, poles: shared.poles, panels: shared.panels, signTex: signals.signTex && signals.signTex.lane });
  stats.wires = wireOut ? wireOut.stats : null; lapMs('wires'); stats.polesBy.wires = shared.poles.tris - stats.polesBy.signals - stats.polesBy.stops;
  {
    const g = shared.poles.build();
    if (g) { const m = new THREE.Mesh(g, mVC); m.castShadow = true; m.receiveShadow = true; m.name = 'pt-poles'; root.add(m); stats.tris['pt-poles'] = g.index.count / 3; }
    shared.panels.finish(root);
  }
  lapMs('poles');
  if (shared.kposts) { stats.knockPosts = { ...shared.kposts.stats, ...shared.kposts.finish() }; lapMs('knockPosts'); }        // after panels.finish: the atlas tiles of the instanced sign faces exist
  stats.headList = signals.headList;
  stats.furniture = { lamps: lamps.count, masts: signals.masts, heads: signals.heads, crossingSigns: signals.crossingSigns, plates: signals.plates, stops: stopOut.stops, shelters: stopOut.shelters };

  // ---------------------------------------------------------------- services
  const roads = net.ways.map((w) => ({ id: w.id, pts: w.x.map((x, i) => [x, w.z[i]]), w: w.w, hw: w.hw, name: w.name, oneway: w.oneway ? 1 : 0, bridge: w.bridge ? 1 : 0, rank: w.rank, trolley: (w.rec.trolley || []).slice() }));
  const laneAt = (x, z) => {
    const h = nearestWay(net, x, z, 0, 0); if (!h) return null;
    const q = wayAt(h.w, h.w.s[h.i] + (h.w.s[h.i + 1] - h.w.s[h.i]) * h.q.t);
    return { road: h.w.id, x: q.x, z: q.z, tx: q.tx, tz: q.tz, w: h.w.w, dist: h.q.c.d };
  };
  const sigOf = new Map(); for (const s of graph.signals) for (const c of s.crossings || []) sigOf.set(c.id, s.id);
  const crosswalks = net.crossings.map((c) => ({
    id: c.id, pts: [[c.x - c.nx * c.hL, c.z - c.nz * c.hL], [c.x + c.nx * c.hR, c.z + c.nz * c.hR]], w: Math.max(4, c.w + 1), road: c.road.id, x: c.x, z: c.z, nx: c.nx, nz: c.nz, tx: c.tx, tz: c.tz,
    signalised: !!c.signalised, signal: sigOf.get(c.id) || sigOf.get((c.ids || []).find((i) => sigOf.has(i))) || null,
  }));
  // nearest pavement centreline point (for the pedestrian paths): grid of the sidewalk / path segments
  const segs = []; for (const l of [...walks.walkLines, ...pathLines]) for (let i = 0; i + 1 < l.pts.length; i++) segs.push([l.pts[i][0], l.pts[i][1], l.pts[i + 1][0], l.pts[i + 1][1], l.w]);
  const sg = new Map(); const SC = 24;
  for (const e of segs) { const x0 = Math.floor(Math.min(e[0], e[2]) / SC), x1 = Math.floor(Math.max(e[0], e[2]) / SC), z0 = Math.floor(Math.min(e[1], e[3]) / SC), z1 = Math.floor(Math.max(e[1], e[3]) / SC); for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) { const k = cx * 4096 + cz; let a = sg.get(k); if (!a) sg.set(k, (a = [])); a.push(e); } }
  const nearestSidewalk = (x, z, maxD = 20) => {
    let best = null; const r = Math.ceil(maxD / SC);
    for (let cx = Math.floor(x / SC) - r; cx <= Math.floor(x / SC) + r; cx++) for (let cz = Math.floor(z / SC) - r; cz <= Math.floor(z / SC) + r; cz++) for (const e of sg.get(cx * 4096 + cz) || []) {
      const dx = e[2] - e[0], dz = e[3] - e[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - e[0]) * dx + (z - e[1]) * dz) / l2)), px = e[0] + dx * t, pz = e[1] + dz * t, d = Math.hypot(x - px, z - pz);
      if (d < maxD && (!best || d < best.dist)) { const l = Math.sqrt(l2); best = { x: px, z: pz, tx: dx / l, tz: dz / l, w: e[4], dist: d }; }
    }
    return best;
  };
  ctx.services.streets = {
    roads, laneAt, parkedSlots, crosswalks,
    sidewalks: walks.walkLines, paths: pathLines, nearestSidewalk,
    lanes: graph.lanes.map((l) => ({ id: l.id, road: l.road, dir: l.dir, idx: l.idx, width: l.width, pts: l.pts, len: l.len, from: l.from, to: l.to, speed: l.speed, rank: l.rank, hw: l.hw, name: l.name, bridge: net.ways[l.way].bridge ? 1 : 0 })),
    junctions: graph.junctions.filter((j) => !j.trivial).map((j) => ({ id: j.id, x: j.x, z: j.z, lanes: j.lanes, out: j.out, signal: j.signal, connectors: j.connectors, arms: j.arms })),
    connectors: graph.connectors, stopLines: graph.stopLines, signals: graph.signals.map((s) => ({ id: s.id, x: s.x, z: s.z, mid: !!s.mid, cycle: s.cycle, approaches: s.approaches, crossings: s.crossings })),
    signalState: graph.signalState, pedState: graph.pedState, signalInfo: graph.signalInfo, pedInfo: graph.pedInfo,
    crossingsAt: (x, z) => crosswalks.filter((c) => Math.hypot(c.x - x, c.z - z) < Math.max(c.w, 4) + 6 && !!nearCrossing(net, x, z, 3.5)),
    lamps: lamps.list.map((l) => ({ x: l.x, z: l.z, h: l.h, kind: l.kind })), tram: TRAMWAYS.filter((t) => !t.tunnel).map((t) => ({ id: t.id, pts: t.pts })), streetPlates: signals.plateList || [], busStops: stopOut.list, stops: stopOut.list.map((b) => ({ x: b.bay.x, z: b.bay.z, rotY: Math.atan2(b.bay.tx, b.bay.tz), kind: b.kind, routes: b.routes, name: b.name, id: b.id, road: b.road })), guardRails: barriers.guardRails, wires: wireOut ? wireOut.service : null,
    net,
  };
  lapMs('services');
  stats.instanced = INST_STATS;
  ctx.services.streetsStats = stats;
  if (typeof process !== 'undefined' && process.env && process.env.STREETS_DEBUG) console.log('STREETS', JSON.stringify(stats));
}
