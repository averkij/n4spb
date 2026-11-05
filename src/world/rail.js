// STATUS: DONE - tracks, 6 platforms + ramps + colliders, Y-column canopies, furniture, catenary, gantries, far fence, 10 trains with schedule / doors / decals / boards,
//   services (platforms, tracks, trains, gates, edges, walkLines, lanes, benches, bins, clocks, kiosks). No flags, no sounds (user rules).
//   NOT DONE - overbridges, depot sheds, TEM18 shunters, switch blades, level crossings, station-name plates, stair niches along platform edges, Sapsan nose polish.
//   NEXT - hook landmarksA hall floor to rail.gates; people module: use services.rail.lanes / trains[].doorsAt(t); tune train timetable (PLAN in rail/trains.js).
// rail - the Moscow Railway Station track field (Московский вокзал): 11 tracks, 6 high platforms with white Y-column canopies, catenary,
// buffer stops, signals, the throat and the yard to the south, and the trains (arriving / standing / departing as pure functions of t).
// Files: rail/geom.js (paths + platform rows from the OSM data; datums RAIL_TOP 0.28, DECK_TOP 1.38), rail/track.js (ballast, sleepers, rails, buffer stops, signals),
// rail/platform.js (decks, edge bands, yellow lines, mesh walls, 16 m head / tail ramps, colliders), rail/canopy.js (Y columns, soffit, hex-hole girders),
// rail/furniture.js (signs, clocks, car letters, benches, bins, kiosks, trolleys, lamps), rail/catenary.js (wires + masts), rail/yard.js (gantries, far fence),
// rail/trains.js + rail/car.js (rolling stock, schedule as a pure function of t, instancing, colliders), rail/gb.js (geometry buffers).
// Based on docs/research/station.md (photos refs/station/22, 27, 32, 41, 43), ../100_3d_moscow_city/src/world/railway* (sweep / rail profile / catenary).
// ctx.services.rail = { platforms [{ref, tracks, rows, zHead, zTail, y, centre(z)}], tracks [Path: at(s), project, xAtZ], trains [{id, kind, track, phase, state(t), doorsAt(t)}],
//   gates [{x, z, rotY, platform}] (where passengers step from the hall onto a platform ramp), edges (yellow safety lines), walkLines (axes), lanes (two walking lanes per platform),
//   benches, bins, clocks, kiosks, stats }. Platforms are walk boxes at y = 1.38 reached by the head / tail ramps only.
import * as THREE from 'three';
import { buildGeometry, RAIL_TOP, DECK_TOP } from './rail/geom.js';
import { Buckets } from './rail/gb.js';
import { buildTracks, buildTrackFurniture, ballastTexture } from './rail/track.js';
import { buildPlatforms, paverTexture, slabTexture, meshTexture } from './rail/platform.js';
import { buildCanopies, soffitTexture, fasciaTexture } from './rail/canopy.js';
import { buildCatenary } from './rail/catenary.js';
import { buildTrains } from './rail/trains.js';
import { buildYard } from './rail/yard.js';
import { buildObvodnyDecks } from './rail/obvodny.js';
import { buildFurniture, buildHeads, lettersTexture, trackSignTexture, clockTexture } from './rail/furniture.js';

export async function build(ctx) {
  const t0 = Date.now();
  const { mat } = ctx;
  const root = new THREE.Group(); root.name = 'rail'; ctx.addStatic(root);
  const G = buildGeometry();
  const bk = new Buckets(48);

  const M = {
    sleeper: mat.toon('#ffffff', { paint: 0.05, name: 'rail-sleeper' }),
  };
  const B = {                       // bucket materials
    ballast: { mat: mat.toon('#ffffff', { map: ballastTexture(ctx), paint: 0.06, name: 'rail-ballast' }), receive: true },
    railTop: { mat: mat.toon('#cfd3d6', { paint: 0.03, emissive: '#30363c', name: 'rail-top' }) },
    railSide: { mat: mat.toon('#6e5d55', { paint: 0.08, name: 'rail-side' }) },
    concrete: { mat: mat.toon('#b9b7b0', { paint: 0.05, name: 'rail-concrete' }), cast: true },
    steel: { mat: mat.toon('#59616a', { paint: 0.04, name: 'rail-steel' }), cast: true },
    red: { mat: mat.toon('#c8352d', { paint: 0.03, name: 'rail-red' }), cast: true },
    white: { mat: mat.toon('#eeeeea', { paint: 0.03, name: 'rail-white' }), cast: true },
    signalPole: { mat: mat.toon('#dfe0dc', { paint: 0.03, name: 'rail-sigpole' }), cast: true },
    signalHead: { mat: mat.toon('#2f333a', { paint: 0.02, name: 'rail-sighead' }), cast: true },
    lensRed: { mat: mat.emissive('#ff3b2f', 1.0) },
    lensYellow: { mat: mat.toon('#5a4a20', { paint: 0 }) },
    lensGreen: { mat: mat.toon('#1f3a2a', { paint: 0 }) },
    deckPaver: { mat: mat.toon('#ffffff', { map: paverTexture(ctx), paint: 0.04, name: 'rail-deck-paver' }) },
    deckSlab: { mat: mat.toon('#ffffff', { map: slabTexture(ctx), paint: 0.04, name: 'rail-deck-slab' }) },
    deckEdge: { mat: mat.toon('#b3b3b0', { paint: 0.04, name: 'rail-deck-edge' }) },
    deckLine: { mat: mat.toon('#e6bd2c', { paint: 0.02, name: 'rail-deck-line' }) },
    wallMesh: { mat: mat.toon('#ffffff', { map: meshTexture(ctx), paint: 0.04, name: 'rail-wall-mesh' }), cast: true },
    wallCap: { mat: mat.toon('#b9b8b3', { paint: 0.04, name: 'rail-wall-cap' }), cast: true },
    soffit: { mat: mat.toon('#e3eaf4', { map: soffitTexture(ctx), paint: 0.02, name: 'rail-soffit' }), receive: true },
    roofTop: { mat: mat.toon('#c9ccd0', { paint: 0.03, name: 'rail-roof' }), cast: true },
    fascia: { mat: mat.toon('#ffffff', { map: fasciaTexture(ctx), paint: 0.02, name: 'rail-fascia' }), cast: true, noOutline: false },
    fasciaPlain: { mat: mat.toon('#ecebe6', { paint: 0.02, name: 'rail-fascia-plain' }), cast: true },
    vc: { mat: mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'rail-vc' }), cast: true },
    lamp: { mat: mat.emissive('#fff3d6', 1.15) },
  };
  for (const pl of G.platforms) B['sign:' + pl.ref] = { mat: mat.toon('#ffffff', { map: trackSignTexture(ctx, pl.ref), paint: 0, polygonOffset: -1, name: 'rail-sign-' + pl.ref }) };
  B.clock = { mat: mat.toon('#ffffff', { map: clockTexture(ctx), paint: 0, name: 'rail-clock' }) };
  B.letters = { mat: mat.toon('#ffffff', { map: lettersTexture(ctx), paint: 0, polygonOffset: -2, name: 'rail-letters' }) };
  bk.useColor('vc');

  const stats = buildTracks(ctx, root, G, bk, M);
  buildObvodnyDecks(ctx, bk);
  const furn = buildTrackFurniture(ctx, root, G, bk);
  const plat = buildPlatforms(ctx, G, bk, ctx.physics);
  const canopy = buildCanopies(ctx, G, bk, ctx.physics);
  const cat = buildCatenary(ctx, G, bk, canopy);
  const furnA = buildFurniture(ctx, G, bk, ctx.physics, canopy);
  const heads = buildHeads(ctx, G, bk, ctx.physics, canopy);
  const yard = buildYard(ctx, G, bk, ctx.physics);
  const tris = bk.flush(root, B, ctx);
  // Uploaded meshes own typed copies. Services/callbacks must not retain the
  // builder's large ordinary-number buffers through their shared closure.
  bk.map.clear();
  const tr = buildTrains(ctx, G, root, yard.fenceZ);

  ctx.services.rail = { platforms: G.platforms, tracks: Object.values(G.tracks), trains: tr.trains, gates: plat.gates, edges: plat.edges, walkLines: plat.walkLines, lanes: plat.lanes, benches: furnA.benches, bins: furnA.bins, clocks: furnA.clocks, kiosks: heads.kiosks };
  ctx.services.rail.stats = { ...stats, buffers: furn.buffers, masts: cat.masts, wires: cat.wires, columns: canopy.columns.length, trainTris: tr.tris, bucketTris: tris, ms: Date.now() - t0 };
}
