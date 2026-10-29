import { bakedData } from '../core/baked-world.js';
import { ZONES } from './lib/area-tables.js';
// people - the pedestrians of the centre of Saint Petersburg, a July afternoon around 16:30: ~1450 anime people (docs/research/people.md) walking the real pavements, zebras, the paving of
// Vosstaniya Square, the Anichkov Bridge, the Moscow Station forecourt / hall / platforms, going in and out of the metro doors, photographing the Klodt horses and the obelisk, following
// tour guides (a plain coloured UMBRELLA - no flags), queueing at kerbs and taxis, sitting on benches, riding bikes / e-scooters, pushing prams, walking dogs, busking, painting portraits,
// sweeping the pavement, patrolling in pairs.  Cel-shaded instanced figures (people/chars.js: ~70 instanced meshes with persistent per-variant slots: only the people within the render
// radius are drawn), driven by a fixed-step agent simulation (people/sim.js) on a routing graph built from the streets / city / landmarks / rail / metro services (people/nav.js, station.js).
// Population plan: people/scenes.js + vignettes.js.  Interface between the halves: people/contract.js.
// THE WEST (Gostiny Dvor - Nevsky - the Admiralty, Palace Square, the gardens, the canals; docs/research/west-life-furniture.md): the routing graph covers the new pavements, squares, sett fields, the
// bridge decks (pavement bands of bridges/sites.js, at deck height; the first 170 m of the Palace Bridge: a chain of nodes on each pavement, nav.longs / nav.longK), the open arcade of Gostiny Dvor, the three Winter Palace gateways, the Admiralty gate, the Kazan colonnade (stylobate included) and
// keeps off the steps / stylobates / plinths / fountain rims / stair descents of the landmark modules (their walk boxes are keep-out obstacles); the zone field (zones.js) puts the tourist-centre crowd
// (Kazan bridge 26 per 10 m, Kazan, Palace Square, Gostiny Dvor, the gardens) on top of the east table; people/west.js scripts ~25 places from the landmark services (guided groups with umbrellas, the
// Column ring, the Hermitage queue, buskers, painters, weddings, vendors at the kiosks, couples at the canal descents ...); people/metrolife.js puts passengers on the platforms of Gostiny Dvor,
// Nevsky Prospekt and Admiralteyskaya (underground agents, drawn only while the camera is below the street); every metro door of the metro service is a flow goal.
// THE ENGINEERING CASTLE (docs/MARS-BRIEF.md; the Mars Field and the Summer Garden of that brief lie north of the strip): people/area.js rasters the castle footways the landmark module draws itself and the routing lattice runs over them;
// zones.js has the hot spots (the Peter I monument, the south portal ...); people/mars.js scripts the castle places (a busker at the Peter I monument, photographers, couples, a tour group and a school excursion at the portal,
// a small excursion in the court); DENSITY.mars.zones caps the head count of the castle precinct (soft: people pass through).
// Test: node tools/people-test.mjs --minutes 3 --at kazan|palace|gostiny|admiralty|isaac|catherine|alexander|hermitage|kazanbridge|moika|horseman|station|peter|castle [--night] [--q low]
//       (--probe / --eval / --items: debug aids).
//
// Behaviour: routes keep to pavements, zebras, squares, the bridge pavements, the hall and the platforms; signalised zebras are entered on pedState 'walk' only (queues at the kerb), side-street
// mouths and unsignalised zebras when no car is close; benches, bus stops, metro doors (people walk in and fade at the door, others come out), photo spots; nobody appears or vanishes in view
// except at doors; people step around the player and glance at the camera (non-solid: ?psolid=1 makes them colliders).  Night (?tod=night): ~22 % of the people stay.
// Quality: ctx.quality.level (falls back to .name) 'high' | 'medium' | 'low' scales the population 1 / 0.7 / 0.45 and the render radius 250 / 190 / 130 m (the performance tier is level 'low') (URL ?pdens=1.3 multiplies the population, ?prad=300 sets the radius).
// URL: ?people=lineup (characters lineup), ?people=nav (draw the routing graph), ?people=off, ?mars=off (without the castle population).
// Services: ctx.services.people = { walkerPaths: [{id, pts, kind}], crossingBusy(crossingId), crossers(), count, positions(), list(), nav stats, triangles / drawCalls }.
// ================================================================== DENSITY: the tuning table (everything that scales the crowd lives here)
// global     overall population multiplier (1 = the research plan of ~1250 people; quality tiers 'medium' / 'low' scale it by 0.7 / 0.45 on top)
// station    the Moscow-station zone: within `radius` m of the segments (Vosstaniya Square - forecourt - hall) and of the platform rectangles (+ rectRadius m) the people density
//            is `factor` x the plan (hall seats, taxi queues, passengers, photographers, smokers, goals and the player-following re-placement are thinned), fading to 1 over `fade` m.
//            maxPeople: a hard head count for the zone (nobody picks a target / is re-placed there while it is full).
//            The Nevsky pavement crowd between Mayakovskaya and the Fontanka is not touched.
// garden     the garden of the area (HOOKS.inGarden: the Tauride Garden of the North): inside it the people density is `factor` x the plan (nav.densityFactor) and at most `maxPeople` people are in it
//            (people/sim.js crowdedAt / recycle: nobody picks a target / is re-placed there while it is full). `noRiders: true` (vasilyevsky's cemetery): nobody on a bike / scooter / kick scooter / balance bike (nor the parent of such a kid) starts in it, picks a target in it or gets a route through it (sim.js banRide). The neutral row (factor 1, no cap) is the strip's (it has no garden); the North's row is in its area module (ZONES.peopleDensity.garden).
// The area-bound sub-tables (station, west, mars, garden: the numbers and their meaning are in src/world/area.js ZONES.peopleDensity, where the strip's values are) come from the area module; an area that leaves
// one out gets the neutral one (no station zone, scale 1, no quiet zone of the castle, no garden cap). global is the engine's.
const PD = ZONES.peopleDensity;
export const DENSITY = {
  global: 0.72,
  station: PD.station,
  west: PD.west || { scale: 1, platforms: 1 },
  mars: PD.mars || { scale: 1, zones: [] },
  garden: PD.garden || { factor: 1, maxPeople: Infinity },
};
const URLQ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');

export async function build(ctx) {
  ctx.services.people = { walkerPaths: [], crossingBusy: () => false };
  const mode = URLQ.get('people');
  if (mode === 'lineup') { const m = await import('./people/lineup.js'); await m.buildLineup(ctx); return; }
  if (mode === 'off') return;
  const { THREE } = ctx;
  const [{ buildNav }, { createCrowd }, { createSim, STEP, MICRO }, { populate }] = await Promise.all([import('./people/nav.js'), import('./people/chars.js'), import('./people/sim.js'), import('./people/scenes.js')]);
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const tm = { t0 }, tick = (k) => { tm[k] = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - tm.t0); };
  ctx.navBake = await bakedData(ctx, `nav-${ctx.quality.level || ctx.quality.name}`);
  const qLevel = ctx.quality && (ctx.quality.level || ctx.quality.name), qf = qLevel === 'low' ? 0.45 : qLevel === 'medium' ? 0.7 : 1;        // the quality tiers scale the head-count cap of the castle zone too
  const marsOff = URLQ.get('mars') === 'off' || !!globalThis.__marsOff || !!DENSITY.mars.off;                 // ?mars=off: without the castle population (A / B comparisons)
  const zoneCaps = DENSITY.mars.zones.map((z) => ({ ...z, maxPeople: Math.round(z.maxPeople * qf) }));
  const nav = buildNav(ctx, { ...DENSITY, mars: marsOff ? { off: true, zones: [], scale: 1 } : { ...DENSITY.mars, zones: zoneCaps } }); tick('nav');
  ctx.navBake = null; ctx.baked?.release?.(`nav-${ctx.quality.level || ctx.quality.name}`);
  const crowd = createCrowd(ctx); tick('crowd');
  const sim = createSim(ctx, nav, crowd); tick('sim');
  const q = ctx.quality && (ctx.quality.level || ctx.quality.name), density = (q === 'low' ? 0.45 : q === 'medium' ? 0.7 : 1) * (Number(URLQ.get('pdens')) || 1) * DENSITY.global;
  sim.renderR = Number(URLQ.get('prad')) || (q === 'low' ? 130 : q === 'medium' ? 190 : 250); sim.farR = sim.farEff = q === 'low' ? 40 : q === 'medium' ? 55 : 70; sim.nearCap = q === 'low' ? 120 : q === 'medium' ? 180 : 250;
  const plan = populate(ctx, nav, sim, { density, west: DENSITY.west, mars: DENSITY.mars, qf }); tick('populate');
  crowd.finalize(); tick('finalize');
  sim.init(0); tick('init');

  // ---- update: fixed 0.1 s sim steps driven by t (deterministic: window.__sim steps from t = 0), interpolated render
  const DT = STEP / MICRO; let next = DT, lastNight = -1;
  // (round 3, 2026-10-16) a live frame runs at most MAX_STEPS micro steps (4 = 67 ms of sim): after a long frame (a GC pause, a region attach) the sim no longer replays every missed
  // step inside the next frame (a 500 ms pause = 30 steps = ~150 ms more), it catches up one step per frame; a screenshot's __sim and the headless tests (no ctx.frameStep) stay exact. ?pcap= steps
  const MAX_STEPS = Number(URLQ.get('pcap')) || 4;
  ctx.onUpdate((dt, t) => {
    let guard = 0; const cap = ctx.frameStep ? MAX_STEPS : 60000; while (next <= t + 1e-6 && guard++ < cap) { sim.update(next); next += DT; }
    if (t < next - DT - 1e-3) { /* time went backwards (a new __sim): keep the state, only render */ }
    const nt = ctx.shared.uNight.value; if (Math.abs(nt - lastNight) > 0.1) { lastNight = nt; crowd.setNight(nt); }
    sim.render(t);
  });

  // ---- people are NON-SOLID (lead's brief): they step around the player and are pushed out of the player's circle by the simulation. ?psolid=1 makes the people within 5 m dynamic colliders
  //      (the Yakutsk behaviour: the player cannot walk through them)
  const boxes = [], pp = ctx.player.position;
  if (URLQ.get('psolid') === '1') ctx.physics.addDynamic(() => {
    boxes.length = 0;
    for (const a of sim.agents) {
      if (a.hidden || a.kind === 'sit') continue; const dx = a.x - pp.x, dz = a.z - pp.z; if (dx * dx + dz * dz > 25) continue;
      const w = a.r * 1.7; boxes.push({ cx: a.x, cz: a.z, w, d: w, rotY: 0, y0: a.y - 0.1, y1: a.y + 1.8 });
    }
    return boxes;
  });

  // ---- services
  const wp = []; const st = ctx.services.streets;
  if (st) { for (const s of st.sidewalks || []) wp.push({ id: 'sw', pts: s.pts, kind: 'sidewalk' }); for (const p of st.paths || []) wp.push({ id: p.id, pts: p.pts, kind: 'path' }); }
  const busy = new Set();                                            // crossing record indices with somebody on the zebra (recomputed lazily once per sim step)
  let busyStep = -1;
  const refreshBusy = () => { if (busyStep === sim.steps) return; busyStep = sim.steps; busy.clear(); for (const a of sim.agents) if (!a.hidden && a.crossIdx >= 0) busy.add(a.crossIdx); };
  ctx.services.people = {
    walkerPaths: wp, count: sim.agents.length, plan, nav: nav.stats, sim, crowd,
    positions: () => sim.agents.filter((a) => !a.hidden).map((a) => ({ x: a.x, z: a.z })),
    list: () => sim.agents.map((a) => ({ i: a.i, x: a.x, z: a.z, y: a.y, yaw: a.yaw, kind: a.kind, scene: a.scene, hidden: a.hidden, crossIdx: a.crossIdx, speed: a.speed })),
    /** people on a zebra right now (for the traffic module: cars give way): [{ x, z, crosswalk (street crossing id) }] */
    crossers: () => sim.agents.filter((a) => !a.hidden && a.crossIdx >= 0).map((a) => ({ x: a.x, z: a.z, crosswalk: nav.crosswalks[a.crossIdx].id })),
    /** somebody is on (or waiting to enter) the zebra with this streets crossing id (also the second half of a merged two-carriageway zebra) */
    crossingBusy: (id) => { refreshBusy(); const i = nav.crossIndexById.get(id); return i !== undefined && busy.has(i); },
    trisPerPerson: crowd.trisPerPerson, drawCalls: crowd.drawCalls, shown: () => crowd.shownCount,
  };
  ctx.services.people.triangles = Math.round(crowd.trisPerPerson * 450);
  // ---- a knocked bench (core/knock.js): it flies, the sitters get up and the seats are gone (the nav obstacles stay as baked)
  if (ctx.knock && ctx.knock.listen) ctx.knock.listen((rec) => { if (rec.kind === 'bench') for (const b of nav.benchesNear(rec.x, rec.z)) sim.knockBench(b); });
  if (URLQ.get('people') === 'nav') drawGraph(ctx, nav, THREE);
  ctx.services.people.buildMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0); ctx.services.people.phases = tm;
}

function drawGraph(ctx, nav, THREE) {
  const pos = [], col = [], N = nav.N;
  for (const e of nav.E) { const c = e.kind === 1 ? [1, 0.2, 0.2] : nav.comp[e.a] === nav.main ? [0.3, 0.9, 0.4] : [0.3, 0.6, 1]; pos.push(N.x[e.a], N.y[e.a] + 0.5, N.z[e.a], N.x[e.b], N.y[e.b] + 0.5, N.z[e.b]); col.push(...c, ...c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true })); m.frustumCulled = false; ctx.noOutline(m); ctx.add(m);
}
