// people/sim.js - the behaviour of the pedestrians (simulation half): who walks where, waits for the signals, sits, plays, enters buildings, avoids the player.
//
// A fixed-step (0.1 s) agent simulation driven by the sim time t of ctx.onUpdate (so a screenshot's window.__sim(t) and the game agree), run in MICRO = 6 slices per step (1/6 of the
// agents per slice, a group with its leader together) so that the work is spread over the frames; the render interpolates between each agent's last two states. Every agent is a
// kinematic circle: position, heading, speed, cumulative distance (the characters derive the walk phase from it).
//   movement  routes on the nav graph (nav.js) with a carrot lookahead, a lane offset (keep right), neighbour avoidance from a chained 2.5 m hash, the player as an obstacle,
//             hard constraints after every move (static colliders slide, buildings / beds / water / asphalt outside a zebra corridor are refused); A* is budgeted to 3 routes per slice
//   crossings the route edge of a zebra is entered only on pedState 'walk' with enough time left (or 'free' and no car close: the wide virtual / bridging crossings check 3 points);
//             waiting people queue in slots at the kerb; two-carriageway zebras are merged into one crossing (nav.js)
//   goals     wander (zone weighted, pulled toward the player), door (city doors out of view; metro doors in view: they walk in and vanish at the door, others come out of the doors of the
//             same station), metro, bench (sit), bus stop (wait), spot (photograph the horses / the obelisk / the bust), followers (pairs / families / tour groups slave to a leader's
//             trail, or stand in an arc around a standing leader), custom goals for the vignettes (sim.goTo / vanish / approach / standFor / hooks)
//   density   walkers that are far from the camera (> 270 m) are moved (recycle) to a node 60-290 m away in the busy zones, and everybody is moved around the camera when it jumps
//             (start, view keys): ~1200 people on the map give 8-14 per 10 m of pavement wherever the player is
//   hiding    nobody pops in view except at doors: a person enters / leaves a building only where the camera cannot see (distance / view cone) or at a metro / station door
// Output: crowd.render(i, state, t) for the people within sim.farR (full rig; every frame < 25 m, every 2nd < 50 m, every 3rd < 85 m), crowd.renderFar for the rest of the people within
// sim.renderR (a block figure, every 6th frame), crowd.hide beyond / behind the camera.
import { MODE, GESTURE as G, newState } from './contract.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b);      // (round 4, 2026-10-16: Math.hypot allocates in V8 (117 MB per 20 s of driving); every use in this file has two arguments)

const TAU = Math.PI * 2;
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const STEP = 0.1;
/** the simulation runs in MICRO slices per STEP: every micro step (STEP / MICRO s) updates 1/MICRO of the agents (a group with a leader together), so the work is spread over the frames */
export const MICRO = 6;

export function createSim(ctx, nav, crowd, opts = {}) {
  const { L } = ctx, svc = ctx.services, R = ctx.rng('people-sim'), N = nav.N, st = svc.streets;
  const PAVE = nav.PAVE, ROAD_Y = nav.ROAD_Y;
  const agents = [], sim = { agents, nav, t: 0, steps: 0 };
  const rr = (a, b) => a + (b - a) * R();
  const pickW = (obj) => { let tot = 0; for (const k in obj) tot += obj[k]; let x = R() * tot; for (const k in obj) { x -= obj[k]; if (x <= 0) return k; } return Object.keys(obj)[0]; };

  // ------------------------------------------------------------------ camera / player
  const cam = ctx.camera, camFwd = { x: 0, z: -1 };
  const camPos = { x: 0, z: 0 }, camDir = new ctx.THREE.Vector3();
  const player = { x: 0, z: 0, vx: 0, vz: 0, px: 0, pz: 0, r: 0.38 };
  const refreshCam = () => {
    camPos.x = cam.position.x; camPos.z = cam.position.z;
    cam.getWorldDirection(camDir); const l = hyp(camDir.x, camDir.z) || 1; camFwd.x = camDir.x / l; camFwd.z = camDir.z / l;
  };
  const updateCamera = () => {
    refreshCam();
    const pp = ctx.player && ctx.player.position;
    if (pp) { player.vx = (pp.x - player.px) / STEP; player.vz = (pp.z - player.pz) / STEP; player.px = player.x = pp.x; player.pz = player.z = pp.z; }
  };
  /** could the camera see a person standing at (x, z)? (used to decide where somebody may appear / vanish) */
  const visible = (x, z) => {
    const dx = x - camPos.x, dz = z - camPos.z, d = hyp(dx, dz);
    if (d > 75) return false; if (d < 7) return true;
    return (dx * camFwd.x + dz * camFwd.z) / d > 0.3;
  };
  sim.visible = visible;
  const canVanish = (x, z) => hyp(x - camPos.x, z - camPos.z) > 38 || !visible(x, z);

  // ------------------------------------------------------------------ spatial hash of the visible agents (chained, 2.5 m cells, rebuilt every micro step: cheap)
  const HC = 2.5, HB = 1 << 14, heads = new Int32Array(HB).fill(-1); let nexts = new Int32Array(1);
  const cellHash = (cx, cz) => ((Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663)) >>> 0) & (HB - 1);
  const rebuildHash = () => {
    heads.fill(-1); if (nexts.length < agents.length) nexts = new Int32Array(agents.length * 2);
    for (let i = 0; i < agents.length; i++) { const a = agents[i]; if (a.hidden || a.ug) continue; a.cx = Math.floor(a.x / HC); a.cz = Math.floor(a.z / HC); const h = cellHash(a.cx, a.cz); nexts[i] = heads[h]; heads[h] = i; }
  };

  // ------------------------------------------------------------------ nodes by component, goal helpers
  const kindOK = (k) => k === 's' || k === 'p' || k === 'a' || k === 'h' || k === 'g' || k === 'f' || k === 'k';
  const compNodes = new Map();
  const bigComps = new Set();
  for (let i = 0; i < N.x.length; i++) { if (!kindOK(N.k[i])) continue; const c = nav.comp[i]; let a = compNodes.get(c); if (!a) compNodes.set(c, (a = [])); a.push(i); }
  for (const [c, a] of compNodes) if (a.length >= 250) bigComps.add(c);
  sim.bigComps = bigComps; sim.compNodes = compNodes;
  const compWeight = new Map(); for (const [c, a] of compNodes) { let w = 0; for (const i of a) w += nav.zoneW(N.x[i], N.z[i]); compWeight.set(c, w); }
  const dFac = (d) => { const u = (d - 110) / 85; return 0.06 + Math.exp(-u * u); };
  const night = () => ctx.shared.uNight.value;

  // ------------------------------------------------------------------ routes
  const makeRoute = (nodes) => {
    const n = nodes.length, x = new Float32Array(n), z = new Float32Array(n), cum = new Float32Array(n), cw = new Int16Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      x[i] = N.x[nodes[i]]; z[i] = N.z[nodes[i]];
      if (i > 0) { cum[i] = cum[i - 1] + hyp(x[i] - x[i - 1], z[i] - z[i - 1]); const e = nav.edgeBetween(nodes[i - 1], nodes[i]); if (e && e.kind === 1) cw[i - 1] = e.cid; }
    }
    return { n, x, z, cum, cw, nodes, total: cum[n - 1], seg: 0, s: 0 };
  };
  // (tight test, pad 0.03: a walker pressed against a guard rail stands 0.18 m from it, inside the 0.2 m margin of the default test, and would find no start node at all: it stood there for ever)
  const nodeFor = (a, maxD = 12) => {
    let id = nav.nearestNode(a.x, a.z, maxD, (j) => nav.comp[j] === a.comp && !nav.segBlocked(a.x, a.z, N.x[j], N.z[j], 0.03));
    // a crowd at a rail gate can push a walker round the end post, to the road side of the rail: no node of the graph lies in a straight line from there and the walker would stand for ever (goal after goal fails).
    // The nearest node of its component is taken instead: the move slides along the rail, round its end, toward it.
    if (id < 0 && nav.fenceNear(a.x, a.z)) id = nav.nearestNode(a.x, a.z, maxD, (j) => nav.comp[j] === a.comp);
    return id;
  };
  // route budget: A* over the lattice costs ~3 ms for 150 m, so at most 3 routes are computed per micro step; a request that is denied makes the agent wait 0.12 s and ask again
  let routeBudget = 1e9, farBudget = 1e9, deferred = false;
  // far routes (2026-10-15, plan item 3; sim.farRoute, ?proute=0 = off): an agent beyond the render radius + 90 m (nobody sees it; it steps on 1 turn in 6 or 12) gets at most FAR_ROUTES routes per
  // micro step (the others are deferred like any denied request: the agent asks again on its next turn) and an A* expansion cap of FAR_POPS instead of 60 000 (a target behind a river / the
  // rail yards made single searches run into the 60 000 cap: ~70 ms each, up to 3 per micro step = the 100-220 ms spikes of the people loop; 20 000 keeps nearly every route that succeeds:
  // with 6 000 the far walkers failed so often that fewer of them were recycled round the camera and the station crowd thinned). A route that hits the cap is the best path found so far or none.
  // Agents within that radius route exactly as before.
  const FAR_ROUTES = 1, FAR_POPS = 20000, FAR_OPTS = { maxPops: FAR_POPS }, FAR_OPTS_N = { maxPops: FAR_POPS };
  let farR2 = -1; const FAIL_S = 20;
  // NO RIDERS IN THE GARDEN (people.js DENSITY.garden.noRiders, the Smolensky cemetery of vasilyevsky: nobody on a bike / scooter / kick scooter / balance bike rides between the graves): an area whose garden row has no `noRiders`
  // runs none of this (banRide false: no test, no cache). A "rider" is an agent with a vehicle or the leader of one (the parent a kid on a scooter follows). Riders are not placed in the garden (the start, a re-placement), pick no
  // target in it, are given routes that go round it (its edges cost 40 x their length more) and a route that still runs through it is refused (the goal is dropped), so they never cross it.
  const banRide = nav.gardenActive === true && nav.gardenCfg.noRiders === true;
  const rides = (a) => { if (a.spec.vehicle) return true; for (let i = 0; i < a.followers.length; i++) if (a.followers[i].spec.vehicle) return true; return false; };
  const gCache = banRide ? new Int8Array(N.x.length).fill(-1) : null;
  const gNode = (i) => { if (i >= gCache.length) return nav.inGarden(N.x[i], N.z[i]); let k = gCache[i]; if (k < 0) k = gCache[i] = nav.inGarden(N.x[i], N.z[i]) ? 1 : 0; return k === 1; };
  const rideNoise = (ei) => { const c = nav.E.columns, e = c ? null : nav.E[ei]; return gNode(c ? c.a[ei] : e.a) || gNode(c ? c.b[ei] : e.b) ? (c ? c.len[ei] : e.len) * 40 : 0; };
  const rideOpts = (base) => ({ ...base, noise: (ei) => rideNoise(ei) + (base && base.noise ? base.noise(ei) : 0) });
  /** a route whose nodes touch the garden after the first one that is outside it (the start may stand inside: it must leave) */
  const crossesGarden = (nodes) => { let k = 0; while (k < nodes.length && gNode(nodes[k])) k++; for (; k < nodes.length; k++) if (gNode(nodes[k])) return true; return false; };
  const routeTo = (a, node) => {
    const from = nodeFor(a, 14); if (from < 0 || node < 0 || nav.comp[from] !== nav.comp[node]) return false;
    let far = false; if (sim.farRoute && farR2 >= 0) { const dx = a.x - camPos.x, dz = a.z - camPos.z; far = dx * dx + dz * dz > farR2; }
    if (routeBudget <= 0 || (far && farBudget <= 0)) { deferred = true; sim.stat.deferred++; return false; } routeBudget--; if (far) { farBudget--; sim.stat.farRoutes++; } sim.stat.routes++;
    // (sim.failCap, opt-in ?pfail=1, an experiment) an agent whose last route search ran into the full 60 000-expansion cap without reaching its target (a start pocket whose way out is a detour
    // of kilometres: ~70 ms per failed search, and chooseGoal tries up to 5 goals, 3 per micro step) searches with the far cap for the next FAIL_S seconds. Off by default: in the node test
    // it also failed routes that the full search finds, and the station crowd thinned
    const capped = far || (sim.failCap && sim.t - a.rtFailT < FAIL_S);
    const rideA = banRide && rides(a), ropts = capped ? (a.home >= 0 ? FAR_OPTS : FAR_OPTS_N) : a.home >= 0 ? undefined : ROUTE_OPTS;
    let nodes = nav.route(from, node, rideA ? rideOpts(ropts) : ropts);
    if (nodes && rideA && crossesGarden(nodes)) return false;          // a rider's route through the garden is no route (chooseGoal tries another goal)
    if (!nodes) { if (sim.failCap && !capped && nav.lastPops >= 60000) a.rtFailT = sim.t; return false; } if (nodes.length < 2) nodes = [nodes[0], nodes[0]];            // already there: a degenerate route (arrival at once)
    a.rt = makeRoute(nodes); a.rt.seg = 0; return true;
  };

  // ------------------------------------------------------------------ crossing logic
  const cwOf = (idx) => nav.crosswalks[idx];
  const remaining = (c, t) => { let k = 0; while (k < 60 && nav.pedState(c, t + k) !== 'dont') k++; return k; };
  const carThreatAt = (px, pz, vs) => {
    for (const v of vs) {
      const dx = px - v.x, dz = pz - v.z, d = hyp(dx, dz), sp = Math.abs(v.speed || 0);
      if (d < 4.5) return true;
      if (d < 7 + sp * 2.2 && (dx * Math.sin(v.rotY) + dz * Math.cos(v.rotY)) / d > 0.5 && sp > 1.5) return true;
    }
    return false;
  };
  const carThreat = (c) => {
    const tr = svc.traffic, vs = tr && tr.vehicles; if (!vs || !vs.length) return false;
    if (carThreatAt(c.x, c.z, vs)) return true;
    if (c.len > 14) { const hx = (c.bx - c.ax) / 4, hz = (c.bz - c.az) / 4; if (carThreatAt(c.ax + hx, c.az + hz, vs) || carThreatAt(c.bx - hx, c.bz - hz, vs)) return true; }
    return false;
  };
  const canCross = (a, c, t) => {
    const ps = nav.pedState(c, t);
    if (ps === 'free') return !carThreat(c);
    if (ps !== 'walk') return false;
    const e = nav.edgeBetween(c.na, c.nb), len = e ? e.len : c.len, need = len / Math.max(a.vpref * 1.1, 1.3) + 1.5;
    return remaining(c, t) >= need;
  };
  const waiters = new Map();                                     // kerb node -> agents waiting there
  const slotPos = (a, c, nodeId) => {
    const lst = waiters.get(nodeId) || [], k = Math.max(0, lst.indexOf(a)), fwdSign = nodeId === c.na ? 1 : -1, ux = c.ux * fwdSign, uz = c.uz * fwdSign, vx = -uz, vz = ux;
    const row = Math.floor(k / 3), col = (k % 3) === 0 ? 0 : (k % 3) === 1 ? 1 : -1;
    let px = N.x[nodeId] - ux * (0.15 + 0.62 * row) + vx * col * 0.72, pz = N.z[nodeId] - uz * (0.15 + 0.62 * row) + vz * col * 0.72;
    // (a slot next to a guard rail / chain is no slot: the walker would press against the rail at the edge of its collider and never arrive)
    if (col && (!nav.walkable(px, pz) || nav.cover(px, pz) > -0.35 || nav.obstDist(px, pz, 0.5) < 0.3)) { px = N.x[nodeId] - ux * (0.15 + 0.62 * row); pz = N.z[nodeId] - uz * (0.15 + 0.62 * row); }
    if (!nav.walkable(px, pz) || nav.cover(px, pz) > -0.25 || nav.obstDist(px, pz, 0.5) < 0.3) { px = N.x[nodeId] - ux * 0.5; pz = N.z[nodeId] - uz * 0.5; }
    return { x: px, z: pz, ux, uz };
  };
  const leaveQueue = (a) => { if (a.waitNode >= 0) { const l = waiters.get(a.waitNode); if (l) { const i = l.indexOf(a); if (i >= 0) l.splice(i, 1); } a.waitNode = -1; } a.waitCw = -1; };

  // ------------------------------------------------------------------ agents
  /** create an agent for a spec: sim.spawn(spec, { prefs, scene }) returns the agent (the person index of the crowd is a.i) */
  sim.spawn = (spec, o = {}) => {
    const i = crowd.add(spec);
    const a = {
      i, spec, r: spec.r, vpref: spec.speed, x: 0, z: 0, y: PAVE, yaw: R() * TAU, speed: 0, dist: R() * 50, turn: 0, px: 0, pz: 0, py: PAVE, pyaw: 0, pdist: 0, pspeed: 0,
      tu: 0, zqx: NaN, zqz: NaN, zqk: -1, rtFailT: -1e9, kind: 'walk', hidden: true, rt: null, goal: null, comp: -1, until: 0, lane: (R() < 0.8 ? 1 : -1) * rr(0.15, 0.9), crossIdx: -1, waitCw: -1, waitNode: -1,
      leader: null, side: 0, back: 0, followers: [], mode: spec.vehicle ? MODE.RIDE : MODE.WALK, seatH: 0.45, g: 0, gTarget: 0, gEnd: 0, gk: 0, look: 0, lookK: 0, lookT: 0,
      prefs: o.prefs || { wander: 10, door: 1.5, bench: 1, stop: 1, spot: 1 }, scene: o.scene || 'walk', rank: R(), retire: false, stuck: 0, seat: null, cov: -9, covAge: 9,
      standG: null, wx: 0, wz: 0, noProg: 0, mv: 1, blk: 0, sideS: 0, sideT: 0, smoker: !!o.smoker, emerge: null, playC: null, vcross: 0, pauseT: 0, frame: 0, speedS: 0, zHome: -2,
    };
    a.pyaw = a.yaw; agents.push(a); return a;
  };
  const place = (a, x, z, yaw, y = PAVE) => { y = nav.surfaceY(x, z, y); a.x = a.px = x; a.z = a.pz = z; a.yaw = a.pyaw = yaw; a.y = a.py = y; a.hidden = false; a.speed = a.pspeed = 0; };
  sim.place = place;
  sim.placeAtNode = (a, node, jitter = 1.0) => {
    const x = N.x[node] + (R() - 0.5) * jitter, z = N.z[node] + (R() - 0.5) * jitter;
    const kk = N.k[node], okj = nav.walkable(x, z) && !nav.blocked(x, z) && nav.obstDist(x, z, 0.5) > 0.3 && (!L.insideBuilding || !L.insideBuilding(x, z, 0) || !!(nav.inPassage && nav.inPassage(x, z)) || !!(nav.inHall && nav.inHall(x, z, 0.3)));     // (the jitter must not push a person into a pier / a wall pocket: a person placed there cannot move)
    place(a, okj ? x : N.x[node], okj ? z : N.z[node], R() * TAU, kk === 'p' ? 0.04 : kk === 'f' || kk === 'h' || kk === 'g' || kk === 'k' ? N.y[node] : PAVE); a.comp = nav.comp[node]; a.kind = 'walk'; a.rt = null; a.goal = null;
  };
  sim.follow = (a, leader, side, back) => { a.leader = leader; a.side = side; a.back = back; leader.followers.push(a); a.comp = leader.comp; };

  // ------------------------------------------------------------------ goals
  /** inside the station zone a cell may hold at most ~12 x factor people (3 x 3 hash cells): the absolute density cap that keeps the player-following crowd out of the zone */
  // plus an absolute head count: at most DENSITY.station.maxPeople people may be inside the zone (sf < 0.5); while it is full nobody picks / is placed at a target in it
  // the quiet zone of the castle (people.js DENSITY.mars.zones: a head count cap per zone, nav.marsZone(x, z) = zone index or -1): while a zone is full nobody picks / is re-placed at a target in it
  const mZones = (nav.marsCfg && nav.marsCfg.zones) || [], marsCount = new Int32Array(Math.max(1, mZones.length)), marsFull = (x, z, m = 0) => { if (!mZones.length) return false; const k = nav.marsZone(x, z, m); return k >= 0 && k < mZones.length && (marsCount[k] >= mZones[k].maxPeople || (mZones[k].shut && night() > 0.55)); };   // (the Summer Garden is shut at night: 22:00 - 10:00)
  let zoneCount = 0; const zoneMax = (nav.stationCfg && nav.stationCfg.maxPeople) || 1e9;
  // the garden of the area (nav.inGarden, people.js DENSITY.garden): at most nav.gardenCfg.maxPeople people inside it, counted like the station zone (a recount every MICRO steps, a re-placement reserves at once)
  let gardenCount = 0;
  const gardenOn = nav.gardenActive === true;      // false in an area without a garden (the strip): none of the garden code below runs (no test per candidate, no count, no recount)
  /** the visible members of a party that stand in the garden: a plain loop (recycle() runs hundreds of times in one step at a teleport; it is not called at all while !gardenOn) */
  const gardenHeads = (party) => { let n = 0; for (let i = 0; i < party.length; i++) { const p = party[i]; if (!p.hidden && nav.inGarden(p.x, p.z)) n++; } return n; };
  // a FULL zone is a soft barrier for the routes of the people who do not live there: every edge inside it costs 2.5 x its length more (they walk round it when the detour is shorter than ~2.5 x the way through)
  const shutHere = (x, z) => { const k = nav.marsZone(x, z); return k >= 0 && k < mZones.length && !!mZones[k].shut; };          // zones that are shut at night (none in the strip)
  const nodeMZ = new Int8Array(mZones.length ? N.x.length : 0).fill(-2), mzOf = (i) => { if (i >= nodeMZ.length) return -1; let k = nodeMZ[i]; if (k === -2) k = nodeMZ[i] = nav.marsZone(N.x[i], N.z[i]); return k; };
  const EC0 = nav.E.columns; const zoneNoise = mZones.length ? (ei) => { const c = EC0, e = c ? null : nav.E[ei], k = mzOf(c ? c.a[ei] : e.a); return k >= 0 && k < mZones.length && (marsCount[k] >= mZones[k].maxPeople || (mZones[k].shut && night() > 0.55)) ? (c ? c.len[ei] : e.len) * 2.5 : 0; } : null;
  const ROUTE_OPTS = zoneNoise ? { noise: zoneNoise } : undefined;
  if (zoneNoise) FAR_OPTS_N.noise = zoneNoise;
  const zoneFullFor = (x, z, m, own) => { if (!mZones.length) return false; const k = nav.marsZone(x, z, m); if (k < 0 || k >= mZones.length) return false; if (mZones[k].shut && night() > 0.55) return true; return !(k === own && mZones[k].stay) && marsCount[k] >= mZones[k].maxPeople; };
  const ownZone = (a) => (a.zHome > -2 ? a.zHome : mZones.length && !a.hidden ? nav.marsZone(a.x, a.z) : -1);       // (zHome: set at the start, by a re-placement and by every goal)
  const crowdedAt = (x, z, m = 0, own = -2) => { const f = nav.densityFactor(x, z); return (own > -2 ? zoneFullFor(x, z, m, own) : marsFull(x, z, m)) || (gardenOn && nav.inGarden(x, z) && gardenCount >= nav.gardenCfg.maxPeople) || (f < 0.99 && (localCount(x, z) >= 12 * f || (nav.stationFactor(x, z) < 0.5 && zoneCount >= zoneMax))); };
  const pickNode = (a) => {
    const arr = compNodes.get(a.comp); if (!arr || !arr.length) return -1;
    let best = -1, bw = -1, bestOut = -1, bwOut = -1;
    const sameComp = (id) => nav.comp[id] === a.comp && kindOK(N.k[id]), inZone = nav.densityFactor(a.x, a.z) < 0.9, own = ownZone(a), noG = banRide && rides(a);
    for (let k = 0; k < (inZone ? 10 : 7); k++) {                       // candidates 35-300 m away (people inside the station zone look farther, 35-455 m, to leave it) (the route costs ~ its length: 1000 m routes were the A* hot spot), snapped to the graph
      const r = 35 + (inZone ? 420 : 265) * Math.pow(R(), 1.6), ang = R() * TAU, id = nav.nearestNode(a.x + Math.sin(ang) * r, a.z + Math.cos(ang) * r, 14, sameComp); if (id < 0) continue;
      const d = hyp(N.x[id] - a.x, N.z[id] - a.z); if (d < 25 || (noG && gNode(id))) continue;
      const dcx = N.x[id] - camPos.x, dcz = N.z[id] - camPos.z, near = 1 + 1.8 * Math.exp(-(dcx * dcx + dcz * dcz) / (170 * 170));       // the crowd gathers around the player
      const w = nav.zoneW(N.x[id], N.z[id]) * dFac(d) * (0.4 + R()) * near;
      if (crowdedAt(N.x[id], N.z[id], 40, own)) continue;               // absolute cap of the station zone: no new targets in cells that are already as dense as the zone allows
      if (w > bw) { bw = w; best = id; }
      if (nav.densityFactor(N.x[id], N.z[id]) > 0.9 && w > bwOut) { bwOut = w; bestOut = id; }
    }
    // thinning of the station zone (people.js DENSITY.station): a target inside it is kept with probability `factor`, otherwise the best target outside it is taken
    if (best >= 0 && R() > nav.densityFactor(N.x[best], N.z[best])) best = bestOut;
    return best;
  };
  const pickFrom = (list, a, nodeOf, wOf, okOf = null) => {      // (okOf: round 4, a predicate instead of a filtered copy of the list per call)
    let best = null, bw = -1; const own = ownZone(a), noG = banRide && rides(a);
    for (let k = 0; k < Math.min(8, list.length); k++) {
      const e = list[Math.floor(R() * list.length)]; if (okOf && !okOf(e)) continue; if (nav.comp[nodeOf(e)] !== a.comp) continue; if (noG && gNode(nodeOf(e))) continue;
      if (mZones.length && zoneFullFor(N.x[nodeOf(e)], N.z[nodeOf(e)], 40, own)) continue;          // benches / spots / doors / stops of a full Mars / Garden / castle zone are no targets
      const d = hyp(N.x[nodeOf(e)] - a.x, N.z[nodeOf(e)] - a.z); if (d < 8 || d > 450) continue;
      const w = wOf(e) * dFac(d) * (0.4 + R()); if (w > bw) { bw = w; best = e; }
    }
    return best;
  };
  const chooseGoal = (a, t) => {
    if (a.retire) { const e = pickFrom(nav.entrances, a, (e) => e.node, (e) => 1); if (e && routeTo(a, e.node)) { a.goal = { type: 'door', e, home: true }; return true; } }
    for (let tries = 0; tries < 5; tries++) {
      const type = tries < 3 ? pickW(a.prefs) : 'wander';
      if (type === 'wander') { const n = pickNode(a); if (n >= 0 && routeTo(a, n)) { a.goal = { type: 'wander', node: n }; return true; } }
      else if (type === 'door') { const e = pickFrom(nav.entrances, a, (e) => e.node, (e) => e.w + 0.1); if (e && routeTo(a, e.node)) { a.goal = { type: 'door', e }; return true; } }
      else if (type === 'metro') { const e = nav.metroDoors.length ? pickFrom(nav.metroDoors, a, (e) => e.node, (e) => nav.densityFactor(e.x, e.z)) : null; if (e && routeTo(a, e.node)) { a.goal = { type: 'door', e }; return true; } }
      else if (type === 'bench') {
        const b = nav.benches.length ? pickFrom(nav.benches, a, (b) => b.node, (b) => b.w + 0.1, (b) => !b.knocked && b.seats.some((s) => s.taken < 0)) : null;
        if (b) { const si = b.seats.findIndex((s) => s.taken < 0); if (si >= 0 && routeTo(a, b.node)) { b.seats[si].taken = a.i; a.goal = { type: 'bench', b, si }; return true; } }
      } else if (type === 'stop') {
        const s = nav.stops.length ? pickFrom(nav.stops, a, (s) => s.node, (s) => s.w + 0.1, (s) => s.spots.some((p) => p.taken < 0)) : null;
        if (s) { const si = s.spots.findIndex((p) => p.taken < 0); if (si >= 0 && routeTo(a, s.node)) { s.spots[si].taken = a.i; a.goal = { type: 'stop', s, si }; return true; } }
      } else if (type === 'spot') {
        const p = nav.spots.length ? pickFrom(nav.spots, a, (p) => p.node, (p) => p.w + 0.1, (p) => p.taken < 0) : null;
        if (p && routeTo(a, p.node)) { p.taken = a.i; a.goal = { type: 'spot', p }; return true; }
      }
    }
    return false;
  };
  const newGoal = (a, t) => {
    leaveQueue(a); a.rt = null; a.goal = null;
    if (a.script) { a.script(a, t); return; }
    if (banRide && !a.leader && !a.hidden && nav.inGarden(a.x, a.z) && rides(a) && canVanish(a.x, a.z) && recycle(a, t)) return;          // a rider found in the garden (out of view) is put back on the streets
    deferred = false;
    const got = chooseGoal(a, t); if (got && a.rt && mZones.length) a.zHome = nav.marsZone(a.rt.x[a.rt.n - 1], a.rt.z[a.rt.n - 1]);
    if (!got) { if (deferred) { a.kind = 'stand'; a.until = t + 0.12; a.standG = [G.NONE]; a.goal = null; } else { a.kind = 'stand'; a.until = t + rr(3, 8); a.standG = a.spec.phone ? [G.PHONE, G.NONE] : [G.NONE, G.LOOKAROUND]; } }
    else a.kind = 'walk';
  };
  const releaseGoal = (a) => {
    const g = a.goal; if (!g) return;
    if (g.type === 'bench') g.b.seats[g.si].taken = -1; else if (g.type === 'stop') g.s.spots[g.si].taken = -1; else if (g.type === 'spot') g.p.taken = -1;
  };

  // ------------------------------------------------------------------ gestures / looks
  const pickGesture = (a, moving) => {
    const sp = a.spec, k = a.kind;
    if (sp.guide) return [G.GUIDE, 40];
    if (k === 'sit') { const o = R(); return o < 0.4 && sp.age !== 'child' ? [G.PHONE, rr(10, 40)] : o < 0.55 ? [G.TALK, rr(8, 20)] : o < 0.65 && sp.eats ? [G.EAT, rr(15, 40)] : [G.NONE, rr(6, 25)]; }
    if (k === 'wait') { const o = R(); return o < 0.3 && sp.phone ? [G.PHONE, rr(5, 15)] : o < 0.45 ? [G.WATCH, rr(2.5, 4)] : o < 0.7 ? [G.LOOKAROUND, rr(2, 5)] : [G.NONE, rr(3, 8)]; }
    if (k === 'stand') { const sg = a.standG; if (sg && sg.length) { const g = sg[Math.floor(R() * sg.length)]; return [g, g === G.PHOTO ? rr(4, 9) : g === G.SELFIE ? rr(5, 9) : rr(5, 18)]; } return [G.NONE, rr(4, 12)]; }
    if (a.arc && a.leader && a.leader.kind === 'stand') { const o = R(); return o < 0.4 ? [G.PHOTO, rr(4, 9)] : o < 0.55 ? [G.SELFIE, rr(4, 8)] : o < 0.7 ? [G.PHONE, rr(4, 10)] : o < 0.85 ? [G.TALK, rr(4, 10)] : [G.NONE, rr(3, 8)]; }
    if (a.followers.length || a.leader) return R() < 0.5 ? [G.TALK, rr(4, 14)] : [G.NONE, rr(5, 14)];
    if (moving) { const o = R(); if (sp.phone && o < 0.3) return [G.PHONE, rr(4, 12)]; if (sp.phone && o < 0.36) return [G.CALL, rr(8, 22)]; if (sp.eats && o < 0.5) return [G.EAT, rr(15, 40)]; return [G.NONE, rr(8, 30)]; }
    return [G.NONE, rr(4, 10)];
  };
  const gestureTick = (a, t, moving) => {
    if (a.kind === 'play') return;
    if (t >= a.gEnd) { const [g, d] = pickGesture(a, moving); a.gTarget = g; a.gEnd = t + d; }
    const tg = a.gTarget === G.NONE ? 0 : 1;
    if (a.g !== a.gTarget) { a.gk += clamp(0 - a.gk, -0.3, 0.3); if (a.gk <= 0.02) { a.g = a.gTarget; } } else a.gk += clamp(tg - a.gk, -0.25, 0.25);
    if (a.g === G.NONE) a.gk = 0;
  };
  const lookTick = (a, t) => {
    let tgt = 0, k = 0;
    const dx = camPos.x - a.x, dz = camPos.z - a.z, d = hyp(dx, dz);
    if (d < 6 && a.kind !== 'inside') { const rel = wrap(Math.atan2(dx, dz) - a.yaw); if (Math.abs(rel) < 1.7) { tgt = clamp(rel, -1.25, 1.25); k = 1; } }
    if (!k && a.kind === 'wait' && a.waitCw >= 0) { tgt = Math.sin(t * 0.7 + a.spec.seed) * 0.9; k = 0.8; }
    if (!k && (a.leader || a.followers.length) && a.g === G.TALK) { const o = a.leader || a.followers[0]; const rel = wrap(Math.atan2(o.x - a.x, o.z - a.z) - a.yaw); tgt = clamp(rel, -1.1, 1.1); k = 0.7; }
    a.look += (tgt - a.look) * 0.35; a.lookK += (k - a.lookK) * 0.25;
  };

  // ------------------------------------------------------------------ movement
  const tmp = { x: 0, z: 0 };
  /** one move of length speed*dt along the heading with the hard constraints; returns false when blocked completely */
  const move = (a, dt, allowRoad) => {
    const sp = a.speed * dt; if (sp < 1e-4) return true;
    const nx = a.x + Math.sin(a.yaw) * sp, nz = a.z + Math.cos(a.yaw) * sp;
    a.inAsph = !allowRoad && a.crossIdx < 0 && nav.cover(a.x, a.z) > -0.12 && nav.crosswalkAt(a.x, a.z, 0.5) < 0;
    const fence = sp > 0.2 || nav.fenceNear(a.x, a.z) || nav.fenceNear(nx, nz);     // a guard rail / chain collider within the 6 m cell, or a fast step (> 0.2 m per 0.1 s: riders, runners, a follower catching up)
    const ok = (x, z) => {
      tmp.x = x; tmp.z = z; nav.pushOut(tmp, a.r * 0.8);
      if (nav.inBuilding(tmp.x, tmp.z) || nav.blocked(tmp.x, tmp.z)) return false;
      if (fence && nav.segBlocked(a.x, a.z, tmp.x, tmp.z, 0.03)) return false;       // anti-tunnelling: a fast step (a follower catching up: 0.25 - 0.5 m) must not jump from one side of a thin wall to the other (pushOut would push to the near side only below ~0.28 m)
      if (a.leader && a.crossIdx >= 0) { if (nav.cover(tmp.x, tmp.z) > -0.12 && nav.crosswalkAt(tmp.x, tmp.z, 0.7) < 0) return false; }
      else if (!allowRoad && a.crossIdx < 0) {
        // exact (fast) cover at the new point every step (the 0.4 m cache of the Yakutsk version let walkers step into a fillet polygon whose edge it cannot see); an agent that
        // already stands inside the asphalt (placed there / pushed in) may move out toward its goal
        const cv = nav.cover(tmp.x, tmp.z); a.cov = cv;
        if (cv > -0.12 && nav.crosswalkAt(tmp.x, tmp.z, 0.5) < 0 && !a.inAsph) return false;
      }
      return true;
    };
    const ox = a.x, oz = a.z;
    if (ok(nx, nz)) { a.x = tmp.x; a.z = tmp.z; a.stuck = Math.max(0, a.stuck - 1); a.mv = hyp(a.x - ox, a.z - oz) / sp; return true; }
    if (ok(nx, a.z)) { a.x = tmp.x; a.z = tmp.z; a.stuck++; a.mv = hyp(a.x - ox, a.z - oz) / sp; return true; }
    if (ok(a.x, nz)) { a.x = tmp.x; a.z = tmp.z; a.stuck++; a.mv = hyp(a.x - ox, a.z - oz) / sp; return true; }
    a.speed *= 0.3; a.stuck += 2; a.mv = 0; return false;
  };
  /** desired direction after neighbour / player avoidance; returns the slow factor, writes (ox, oz) */
  const OUT = { x: 0, z: 0, slow: 1 };
  const steer = (a, dx, dz) => {
    let sx = dx, sz = dz, slow = 1; const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), rx = -fz, rz = fx;
    const c0x = Math.floor(a.x / HC), c0z = Math.floor(a.z / HC);
    for (let cz = c0z - 1; cz <= c0z + 1; cz++) { for (let cx = c0x - 1; cx <= c0x + 1; cx++) {
      for (let q = heads[cellHash(cx, cz)]; q >= 0; q = nexts[q]) {
        const b = agents[q]; if (b.cx !== cx || b.cz !== cz || b === a || b.hidden || b === a.leader) continue;
        if (a.followers.length && a.followers.indexOf(b) >= 0) continue;
        const ex = b.x - a.x, ez = b.z - a.z, d2 = ex * ex + ez * ez, Rr = a.r + b.r + 1.3; if (d2 > Rr * Rr) continue;
        const d = Math.sqrt(d2) || 1e-3, nx = ex / d, nz = ez / d, gap = d - a.r - b.r, ahead = nx * fx + nz * fz;
        if (gap < 0.1) { const k = (0.1 - gap) * 5; sx -= nx * k; sz -= nz * k; }
        if (ahead > 0.2 && gap < 1.3) {
          const lat = nx * rx + nz * rz, w = (1 - gap / 1.3) * (0.4 + ahead), side = Math.abs(lat) < 0.18 ? 1 : -Math.sign(lat);
          sx += rx * side * w * 1.7; sz += rz * side * w * 1.7;
          if (ahead > 0.82 && gap < 0.8 && Math.abs(lat) < 0.5) slow = Math.min(slow, 0.35 + gap * 0.8);
        }
      }
    } }
    // the player: a larger, faster-moving obstacle
    { const ex = player.x - a.x, ez = player.z - a.z, d = hyp(ex, ez), rr_ = a.r + player.r + 1.6;
      if (d < rr_ && d > 1e-3) { const nx = ex / d, nz = ez / d, ahead = nx * fx + nz * fz, gap = d - a.r - player.r, lat = nx * rx + nz * rz;
        if (gap < 0.25) { const k = (0.25 - gap) * 6; sx -= nx * k; sz -= nz * k; }
        if (ahead > 0.1) { const side = Math.abs(lat) < 0.18 ? 1 : -Math.sign(lat), w = (1 - Math.min(1, gap / 1.6)) * (0.5 + ahead); sx += rx * side * w * 2.2; sz += rz * side * w * 2.2; if (ahead > 0.7 && gap < 1.0 && Math.abs(lat) < 0.55) slow = Math.min(slow, 0.2 + gap * 0.6); } } }
    const l = hyp(sx, sz) || 1; OUT.x = sx / l; OUT.z = sz / l; OUT.slow = slow;
  };
  const turnAndGo = (a, dt, dx, dz, vdes, allowRoad) => {
    steer(a, dx, dz);
    const want = Math.atan2(OUT.x, OUT.z), dy = wrap(want - a.yaw), maxT = (a.kind === 'play' ? 7 : 5) * dt, step = clamp(dy, -maxT, maxT);
    a.yaw += step; a.turn = step / dt;
    let vt = vdes * OUT.slow * Math.max(0.25, 1 - Math.abs(dy) * 0.45);
    a.speed += clamp(vt - a.speed, -4.5 * dt, 2.4 * dt); if (a.speed < 0.02 && vt < 0.05) a.speed = 0;
    a.dist += a.speed * dt; a.mv = 1; move(a, dt, allowRoad);
    if (a.mv < 0.3 && a.speed > 0.4) { if (++a.blk > 3) { a.blk = 0; a.sideS = a.sideS ? -a.sideS : (R() < 0.5 ? 1 : -1); a.sideT = 2.2; } } else if (a.blk > 0) a.blk--;
    if (a.sideT > 0) a.sideT -= dt;
    // nobody inside the player
    const ex = a.x - player.x, ez = a.z - player.z, d = hyp(ex, ez), mn = a.r + player.r * 0.8;
    if (d < mn && d > 1e-4) { const k = (mn - d) / d; a.x += ex * k * 0.6; a.z += ez * k * 0.6; }
  };
  const groundY = (a, yT) => { a.y += (yT - a.y) * 0.4; };

  // ------------------------------------------------------------------ state updates
  const hide = (a) => { a.hidden = true; a.speed = 0; };
  const enterBuilding = (a, t, e, dur, home) => {
    leaveQueue(a); releaseGoal(a); a.goal = null; a.rt = null; a.kind = 'inside'; hide(a);
    let eo = e; const grp = e && e.group && nav.doorGroups[e.group]; if (grp && grp.length > 1 && R() < 0.75) eo = grp[Math.floor(R() * grp.length)];
    a.until = t + dur; a.emerge = eo ? { x: eo.ax, z: eo.az, yaw: eo.rotY, node: eo.node, door: eo } : null;
    for (const f of a.followers) { f.kind = 'inside'; hide(f); f.until = a.until + 0.8; f.emerge = a.emerge; }
  };
  const emerge = (a, t) => {
    const e = a.emerge; if (!e) { a.kind = 'stand'; a.until = t; return false; }
    const vok = e.door && e.door.visibleOK; if (!vok && visible(e.x, e.z)) { a.until = t + 2.5; return false; }
    if (a.rank > nav.activeFrac) { a.until = t + 8; return false; }
    place(a, e.x + (R() - 0.5) * 0.4, e.z + (R() - 0.5) * 0.4, e.yaw, e.door && e.door.visibleOK ? (e.door.y ?? PAVE) : PAVE); if (e.node >= 0) a.comp = nav.comp[e.node]; a.kind = 'walk'; a.rt = null; a.goal = null; a.retire = false; a.speed = a.vpref * 0.8;
    newGoal(a, t);
    for (const f of a.followers) { const o = f.emerge; if (o) { place(f, e.x + (R() - 0.5) * 1.2, e.z + (R() - 0.5) * 1.2, e.yaw, PAVE); f.comp = a.comp; f.kind = 'walk'; f.speed = f.vpref * 0.8; } }
    return true;
  };
  const sitDown = (a, t) => {
    const g = a.goal, b = g.b, s = b.seats[g.si];
    a.kind = 'sit'; a.x = a.px = s.x; a.z = a.pz = s.z; a.yaw = a.pyaw = b.rotY; a.y = a.py = b.y ?? PAVE; a.speed = 0; a.mode = MODE.SIT; a.seatH = 0.45; a.seat = g; a.rt = null;
    a.until = t + rr(70, 260); a.gEnd = 0; a.g = a.gTarget = G.NONE; a.gk = 0;
  };
  const standUp = (a, t) => {
    const g = a.seat; if (g) { const b = g.b; a.x = a.px = b.ax; a.z = a.pz = b.az; a.yaw = a.pyaw = b.rotY; g.b.seats[g.si].taken = -1; a.seat = null; }
    a.mode = a.spec.vehicle ? MODE.RIDE : MODE.WALK; a.goal = null; a.g = a.gTarget = G.NONE; a.gk = 0; a.y = PAVE;
    if (a.leader) { a.kind = 'walk'; return; }
    if (g) a.comp = nav.comp[g.b.node]; newGoal(a, t);
  };
  const arrive = (a, t) => {
    const g = a.goal; a.rt = null;
    if (!g) { newGoal(a, t); return; }
    if (g.type === 'wander') {
      if (R() < 0.22) { a.kind = 'stand'; a.until = t + rr(3, 12); a.standG = a.spec.phone ? [G.PHONE, G.WATCH, G.NONE] : [G.WATCH, G.LOOKAROUND, G.NONE]; a.goal = null; }
      else newGoal(a, t);
    } else if (g.type === 'door') {
      const e = g.e;
      if (e.visibleOK && !a.smoker) { a.kind = 'approach'; a.tx = e.x + Math.sin(e.rotY) * 0.1; a.tz = e.z + Math.cos(e.rotY) * 0.1; }
      else if (g.home || !visible(e.x, e.z)) { if (a.smoker) { a.kind = 'stand'; a.standG = [G.SMOKE]; a.until = t + rr(25, 90); a.smoker = false; a.goal = { type: 'door', e }; } else enterBuilding(a, t, e, g.home ? rr(60, 200) : rr(20, 140)); }
      else newGoal(a, t);
    } else if (g.type === 'bench') { a.kind = 'approach'; a.goal = g; a.tx = g.b.seats[g.si].x; a.tz = g.b.seats[g.si].z; }
    else if (g.type === 'stop') { const p = g.s.spots[g.si]; a.kind = 'approach'; a.tx = p.x; a.tz = p.z; }
    else if (g.type === 'spot') { a.kind = 'approach'; a.tx = g.p.x; a.tz = g.p.z; }
    else if (g.type === 'custom') { a.goal = null; g.fn(a, t); }
  };
  const finishApproach = (a, t) => {
    const g = a.goal; if (!g) { a.kind = 'stand'; a.until = t + 4; return; }
    if (g.type === 'custom') { a.goal = null; g.fn(a, t); return; }
    if (g.type === 'bench') sitDown(a, t);
    else if (g.type === 'door') { const e = g.e; a.kind = 'inside'; enterBuilding(a, t, e, e.kind === 'metro' ? rr(12, 80) : rr(20, 140), g.home); }
    else if (g.type === 'stop') { a.kind = 'stand'; a.yaw = g.s.rotY; a.standG = a.spec.phone ? [G.PHONE, G.WATCH, G.LOOKAROUND, G.NONE] : [G.WATCH, G.LOOKAROUND, G.NONE]; a.until = t + rr(25, 90); }
    else if (g.type === 'spot') { const p = g.p; a.kind = 'stand'; a.yaw = p.yaw; a.standG = p.type === 'rim' ? [G.NONE, G.PHONE, G.WATCH, G.POINT] : (a.spec.phone || R() < 0.7 ? [G.PHOTO, G.PHOTO, G.SELFIE, G.PHONE, G.LOOKAROUND] : [G.POINT, G.LOOKAROUND]); a.until = t + rr(12, 55); }
  };
  const endStand = (a, t) => {
    const g = a.goal;
    if (g && g.type === 'stop') { const s = g.s; s.spots[g.si].taken = -1; if (!visible(s.x, s.z)) { enterBuilding(a, t, null, rr(30, 120)); a.emerge = { x: s.spots[0].x, z: s.spots[0].z, yaw: s.rotY + Math.PI, node: s.node }; for (const f of a.followers) f.emerge = a.emerge; return; } }
    else if (g && g.type === 'spot') g.p.taken = -1;
    else if (g && g.type === 'door' && g.e) { if (!visible(g.e.x, g.e.z)) { enterBuilding(a, t, g.e, rr(20, 120)); return; } }
    else if (g && g.type === 'custom') { a.goal = null; g.fn(a, t); return; }
    a.goal = null; newGoal(a, t);
  };

  /** every ~3 s: a walker that did not get 0.8 m anywhere gets a new route, after 12 s a snap to the graph (out of view), after 25 s a new start */
  const watchdog = (a, t) => {
    if (hyp(a.x - a.wx, a.z - a.wz) > 0.8 || a.kind !== 'walk') { a.wx = a.x; a.wz = a.z; a.noProg = 0; return; }
    a.noProg++;
    if (a.noProg === 2) { newGoal(a, t); return; }
    if (a.noProg >= 4 && !visible(a.x, a.z)) { const n = nav.nearestNode(a.x, a.z, 30, (id) => nav.comp[id] === a.comp); if (n >= 0) { a.x = N.x[n] + (R() - 0.5) * 0.6; a.z = N.z[n] + (R() - 0.5) * 0.6; a.noProg = 0; a.wx = a.x; a.wz = a.z; newGoal(a, t); } }
  };
  // ------------------------------------------------------------------ density follows the player: a walker that is far from the camera (never drawn) is moved to a node 110-290 m away,
  // preferring the busy zones, so the avenue is as dense around the player as the research says (8-14 people per 10 m of pavement) with ~1200 people on the whole map.
  // A group (pair / family / tour) moves as a unit. Nobody is placed within 110 m (the 'visible' radius is 75 m).
  const allIds = []; for (const [c, arr] of compNodes) if (bigComps.has(c)) for (const id of arr) { const k = N.k[id]; if (k === 's' || k === 'a' || k === 'p') allIds.push(id); }
  const FAR2 = 270 * 270, placed = new Map(), longK = nav.longK && nav.longK.size ? nav.longK : null;
  /** agents within the 3 x 3 hash cells (7.5 m square) of (x, z) plus the ones recycled to the same cell during this micro step */
  const localCount = (x, z) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC); let n = placed.get(cellHash(cx, cz)) || 0; for (let q = heads[cellHash(cx, cz)]; q >= 0; q = nexts[q]) { const b = agents[q]; if (b.cx === cx && b.cz === cz) n++; } for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let q = heads[cellHash(cx + dx, cz + dz)]; q >= 0; q = nexts[q]) { const b = agents[q]; if (b.cx === cx + dx && b.cz === cz + dz) n += 0.5; } return n; };
  /** mass: place anywhere 6-250 m around the camera (start / teleport); otherwise 60-290 m and never in view */
  const recycle = (a, t, mass = false) => {
    const party = [a, ...a.followers.filter(f => f.kind !== 'inside')];
    const gardenBefore = gardenOn ? gardenHeads(party) : 0, noG = banRide && party.some((q) => q.spec.vehicle);
    let best = -1, tot = 0; const lo = mass ? 6 : 60, hi = mass ? 250 : 290, ids = [], ws = [], zOwn = ownZone(a);
    for (let k = 0, kn = mass ? 26 : 14; k < kn; k++) {              // candidate points on the annulus around the camera, snapped to the nearest pavement node (more tries at a teleport: an avenue between quiet side streets fills only a few per cent of the disc)
      const r = lo + (hi - lo) * Math.pow(R(), mass ? 0.85 : 1), ang = R() * TAU, px = camPos.x + Math.sin(ang) * r, pz = camPos.z + Math.cos(ang) * r;
      const id = nav.nearestNode(px, pz, 9, (q) => { const kq = N.k[q]; return (kq === 's' || kq === 'a' || kq === 'p' || (kq === 'k' && longK && longK.has(q))) && nav.mainOK(q); }); if (id < 0) continue;      // (the pavements of the long Neva bridge count: the deck is 255 m long)
      const dx = N.x[id] - camPos.x, dz = N.z[id] - camPos.z, d = hyp(dx, dz);
      if (mass ? (d < 6 || d > 250) : (d < 60 || d > 290 || (d < 110 && visible(N.x[id], N.z[id])))) continue;
      if (localCount(N.x[id], N.z[id]) >= 5 || crowdedAt(N.x[id], N.z[id], 0, zOwn)) continue;      // never pile people up: at most 5 within 2.5 m (a move inside the walker's own zone does not fill it)
      if (noG && gNode(id)) continue;          // riders are not placed in the garden (noRiders)
      if (gardenOn && nav.inGarden(N.x[id], N.z[id]) && gardenCount - gardenBefore + party.length > nav.gardenCfg.maxPeople) continue;
      const zw = nav.zoneW(N.x[id], N.z[id]), w = Math.pow(zw, 0.8) * (1 + 4.5 * Math.exp(-(d * d) / (120 * 120)));
      ids.push(id); ws.push(w); tot += w;
    }
    { let x = R() * tot; for (let k = 0; k < ids.length; k++) { x -= ws[k]; if (x <= 0) { best = ids[k]; break; } } if (best < 0 && ids.length) best = ids[ids.length - 1]; }       // roulette, not argmax
    if (best < 0 || R() > nav.densityFactor(N.x[best], N.z[best])) return false;      // the station zone is thinned: a re-placement there succeeds with probability `factor` (people.js DENSITY.station)
    leaveQueue(a); sim.placeAtNode(a, best, 1.4); a.speed = a.vpref * 0.8; a.crossIdx = -1; if (a.trX) { a.trX.fill(a.x); a.trZ.fill(a.z); a.trY.fill(a.yaw); } a.sideT = 0; a.stuck = 0; a.noProg = 0;
    for (const f of a.followers) { if (f.kind === 'inside') continue; leaveQueue(f); sim.placeAtNode(f, best, 2.2); f.speed = f.vpref * 0.8; f.kind = 'walk'; f.crossIdx = -1; f.stuck = 0; f.comp = a.comp; }
    // Reserve immediately: a camera teleport can place hundreds of agents in
    // one micro-step, before the periodic population recount runs again.
    if (gardenOn) gardenCount += gardenHeads(party) - gardenBefore;
    if (mZones.length) { const k = nav.marsZone(N.x[best], N.z[best]); if (k >= 0 && k < mZones.length && k !== zOwn) marsCount[k] += party.length; for (const q of party) q.zHome = k; }
    placed.set(cellHash(Math.floor(a.x / HC), Math.floor(a.z / HC)), (placed.get(cellHash(Math.floor(a.x / HC), Math.floor(a.z / HC))) || 0) + 1 + a.followers.length);
    newGoal(a, t); a.recycled = (a.recycled || 0) + 1; sim.recycled++; return true;
  };
  sim.marsCount = marsCount;
  sim.recycled = 0; sim.mass = MICRO; sim.lastCam = { x: -1e6, z: -1e6 };

  const stepRoute = (a, t, dt) => {
    const rt = a.rt;
    if (!rt) { newGoal(a, t); return; }
    // progress: advance past segments that were passed (never into a zebra segment before the signal allows it)
    let k = rt.seg;
    while (k < rt.n - 2) {
      const sx = rt.x[k + 1] - rt.x[k], sz = rt.z[k + 1] - rt.z[k], sl = hyp(sx, sz) || 1, pr = ((a.x - rt.x[k]) * sx + (a.z - rt.z[k]) * sz) / sl, dn = hyp(rt.x[k + 1] - a.x, rt.z[k + 1] - a.z);
      if ((pr > sl - 0.35 || dn < 0.7)) { if (rt.cw[k] >= 0 && a.crossIdx === rt.cw[k]) { a.crossIdx = -1; } k++; } else break;
    }
    rt.seg = k;
    // zebra at the start of the segment k?
    const cwI = rt.cw[k];
    if (cwI >= 0 && a.crossIdx !== cwI) {
      const c = cwOf(cwI), nodeId = rt.nodes[k], dn = hyp(rt.x[k] - a.x, rt.z[k] - a.z);
      if (dn < 2.2 || a.waitCw === cwI) {
        if (a.waitCw !== cwI) { a.waitCw = cwI; a.waitNode = nodeId; let l = waiters.get(nodeId); if (!l) waiters.set(nodeId, (l = [])); l.push(a); a.kind = 'wait'; a.gEnd = 0; }
        if (canCross(a, c, t) && hyp(a.x - rt.x[k], a.z - rt.z[k]) < 2.6) { leaveQueue(a); a.crossIdx = cwI; a.kind = 'walk'; const e = nav.edgeBetween(rt.nodes[k], rt.nodes[k + 1]); a.crossLen = e ? e.len : c.len; a.crossEnd = t + a.crossLen / Math.max(a.vpref, 1.2); }
        else { // hold at the kerb in a slot
          const sp = slotPos(a, c, nodeId), dx = sp.x - a.x, dz = sp.z - a.z, d = hyp(dx, dz);
          a.kind = 'wait';
          if (d > 0.25) turnAndGo(a, dt, dx, dz, Math.min(a.vpref, 0.6 + d), false);
          else { a.speed = Math.max(0, a.speed - 5 * dt); const want = Math.atan2(sp.ux, sp.uz), dy = wrap(want - a.yaw); a.yaw += clamp(dy, -3 * dt, 3 * dt); a.turn = 0; }
          groundY(a, nav.surfaceY(a.x, a.z, a.y)); return;
        }
      }
    }
    if (a.kind === 'wait') a.kind = 'walk';
    // carrot
    const sL = hyp(rt.x[k + 1] - rt.x[k], rt.z[k + 1] - rt.z[k]) || 1;
    const look = 0.9 + 0.55 * a.speed; let acc = hyp(rt.x[k + 1] - a.x, rt.z[k + 1] - a.z), kk = k, cx = rt.x[k + 1], cz = rt.z[k + 1], tx = (rt.x[k + 1] - rt.x[k]) / sL, tz = (rt.z[k + 1] - rt.z[k]) / sL;
    while (acc < look && kk < rt.n - 2 && rt.cw[kk + 1] < 0 && rt.cw[kk] === rt.cw[kk + 1]) { const nx = rt.x[kk + 2] - rt.x[kk + 1], nz = rt.z[kk + 2] - rt.z[kk + 1], nl = hyp(nx, nz) || 1, need = look - acc, adv = Math.min(need, nl); cx = rt.x[kk + 1] + nx / nl * adv; cz = rt.z[kk + 1] + nz / nl * adv; tx = nx / nl; tz = nz / nl; acc += adv; if (adv >= nl - 1e-3) kk++; else break; }
    const crossing = a.crossIdx >= 0, lane = crossing ? a.lane * 0.5 : (rt.n - 1 - k < 2 ? a.lane * 0.3 : a.lane);
    const lane2 = lane + (a.sideT > 0 ? a.sideS * 1.0 : 0); let tx2 = cx - tz * lane2, tz2 = cz + tx * lane2;
    // the lane offset (up to 0.9 m, 1.0 m more when sidestepping) must not aim across a guard rail / chain: half the lane, then the route line itself (the walker would grind along the rail)
    if (lane2 !== 0 && nav.fenceNear(a.x, a.z) && nav.segBlocked(a.x, a.z, tx2, tz2)) { tx2 = cx - tz * lane2 * 0.4; tz2 = cz + tx * lane2 * 0.4; if (nav.segBlocked(a.x, a.z, tx2, tz2)) { tx2 = cx; tz2 = cz; } }
    let vd = a.vpref * (a.g === G.PHONE && a.gk > 0.5 ? 0.82 : 1);
    if (crossing) { const c = cwOf(a.crossIdx), ps = nav.pedState(c, t); const left = Math.max(0.5, (a.crossEnd || t + 6) - t); vd = Math.max(vd, 1.25); if (ps !== 'free' && a.crossLen) { const rem = hyp(rt.x[k + 1] - a.x, rt.z[k + 1] - a.z); vd = Math.max(vd, Math.min(2.3, rem / Math.max(0.8, left))); } }
    turnAndGo(a, dt, tx2 - a.x, tz2 - a.z, vd, crossing);
    // heights: the zebra is asphalt (0.03), the pavements 0.12, mapped footways 0.04
    // heights: interpolated between the heights of the route nodes (pavement 0.12, bridge deck hump, hall 0.03, platform ramps ...); a zebra is asphalt (9 cm lower) between its kerbs
    let yT = PAVE; { const nA = rt.nodes[k], nB = rt.nodes[Math.min(k + 1, rt.n - 1)], sx = rt.x[k + 1] - rt.x[k], sz = rt.z[k + 1] - rt.z[k], sl2 = sx * sx + sz * sz || 1, u = clamp(((a.x - rt.x[k]) * sx + (a.z - rt.z[k]) * sz) / sl2, 0, 1); yT = N.y[nA] + (N.y[nB] - N.y[nA]) * u;
      if (crossing) { const dA = hyp(rt.x[k] - a.x, rt.z[k] - a.z), dB = hyp(rt.x[k + 1] - a.x, rt.z[k + 1] - a.z); if (dA >= 0.9 && dB >= 0.9) yT -= PAVE - ROAD_Y; } }
    // T7: on the relief of the area (the Tauride Garden's hills) the ground under the walker is asked every step, not interpolated between two nodes that may stand 20 m apart on a curve (the strip and a service deck: reliefY is null, the interpolation stands)
    if (!crossing) { const ry = nav.reliefY(a.x, a.z); if (ry != null) yT = ry; }
    groundY(a, yT);
    // arrival
    if (k >= rt.n - 2 && hyp(rt.x[rt.n - 1] - a.x, rt.z[rt.n - 1] - a.z) < 0.9) { if (crossing) a.crossIdx = -1; arrive(a, t); }
    else if (a.stuck > 55) { a.stuck = 0; newGoal(a, t); }
  };

  const stepApproach = (a, t, dt) => {
    const dx = a.tx - a.x, dz = a.tz - a.z, d = hyp(dx, dz);
    if (d < 0.25) { finishApproach(a, t); return; }
    turnAndGo(a, dt, dx, dz, Math.min(a.vpref * 0.8, 0.5 + d), false); groundY(a, nav.surfaceY(a.x, a.z, a.y));
    if (a.stuck > 40) { a.stuck = 0; a.x = a.tx; a.z = a.tz; }
  };
  // metro platform people (a.ug = true; people/metrolife.js): they live underground below the buildings, so none of the surface rules (footprints, carriageways, obstacles) applies: a straight walk
  // to (tx, tz) on a pre-validated lane at the height of the platform; at the end fn(a, t) (stand for a while, pick the next lane point)
  const stepUg = (a, t, dt) => {
    const dx = a.tx - a.x, dz = a.tz - a.z, d = hyp(dx, dz);
    if (d < 0.2) { a.speed = 0; const g = a.goal; a.goal = null; a.kind = 'stand'; if (g && g.fn) g.fn(a, t); else a.until = t + 4; return; }
    const want = Math.atan2(dx, dz), dy = wrap(want - a.yaw), step = clamp(dy, -5 * dt, 5 * dt); a.yaw += step; a.turn = step / dt;
    const vt = Math.min(a.vpref * 0.85, 0.4 + d) * Math.max(0.3, 1 - Math.abs(dy) * 0.5); a.speed += clamp(vt - a.speed, -4.5 * dt, 2.4 * dt);
    a.dist += a.speed * dt; a.x += Math.sin(a.yaw) * a.speed * dt; a.z += Math.cos(a.yaw) * a.speed * dt;
  };
  sim.placeUg = (a, x, z, yaw, y) => { a.ug = true; a.rank = 0; a.noMass = true; a.x = a.px = x; a.z = a.pz = z; a.yaw = a.pyaw = yaw; a.y = a.py = y; a.hidden = false; a.speed = a.pspeed = 0; a.kind = 'stand'; };
  /** an underground walk to (x, z); fn(a, t) is called on arrival */
  sim.ugGo = (a, x, z, fn) => { a.kind = 'ugwalk'; a.tx = x; a.tz = z; a.goal = { type: 'custom', fn }; };
  const recordTrail = (a) => {
    if (!a.trX) { a.trX = new Float32Array(64).fill(a.x); a.trZ = new Float32Array(64).fill(a.z); a.trY = new Float32Array(64).fill(a.yaw); a.trH = 0; }
    a.trH = (a.trH + 1) & 63; a.trX[a.trH] = a.x; a.trZ[a.trH] = a.z; a.trY[a.trH] = a.yaw;
  };
  const hasLong = !!(nav.longs && nav.longs.length);
  /** pairs / families: the follower walks where its leader walked 0.4 s ago (always a valid place, also across a zebra) shifted sideways */
  const stepFollower = (a, t, dt) => {
    const l = a.leader;
    if (l.kind === 'inside') { a.kind = 'inside'; hide(a); return; }
    if (l.kind === 'sit' && !a.seat && a.kind !== 'sit') {
      const g = l.seat, s2 = g ? g.b.seats.findIndex((s) => s.taken < 0) : -1;
      if (s2 >= 0) { g.b.seats[s2].taken = a.i; a.seat = { b: g.b, si: s2 }; a.goal = { type: 'bench', b: g.b, si: s2 }; a.tx = g.b.seats[s2].x; a.tz = g.b.seats[s2].z; a.kind = 'approach'; }
    }
    if (a.kind === 'approach') { stepApproach(a, t, dt); return; }
    const moving = l.speed > 0.25, i = (l.trH - (moving ? (a.delay || 4) : 0) + 64) & 63, bx = l.trX[i], bz = l.trZ[i], by = moving ? l.trY[i] : l.yaw, fx = Math.sin(by), fz = Math.cos(by);
    // a follower lags behind its leader by its delay: when the leader has left the zebra the follower may still be on it (it stays 'crossing' while it is inside the corridor, otherwise it is a person on the carriageway)
    const own = l.crossIdx < 0 && nav.fastCover(a.x, a.z) > -0.1 ? nav.crosswalkAt(a.x, a.z, 0.8) : -1, cross = l.crossIdx >= 0 || own >= 0, sd = cross ? a.side * 0.4 : a.side; a.crossIdx = l.crossIdx >= 0 ? l.crossIdx : own;
    let tx = bx - fz * sd - fx * (moving ? 0 : a.back * 0.5), tz = bz + fx * sd - fz * (moving ? 0 : a.back * 0.5);
    if (!moving && a.arc) { const aa = l.yaw + Math.PI + a.arc.ang; tx = l.x + Math.sin(aa) * a.arc.rad; tz = l.z + Math.cos(aa) * a.arc.rad; if (!nav.walkable(tx, tz) || nav.cover(tx, tz) > -0.5) { tx = bx - fz * sd; tz = bz + fx * sd; } }
    if (!cross && (a.sideT > 0 || !nav.walkable(tx, tz) || nav.cover(tx, tz) > -0.3 || nav.deepAt(tx, tz) || (hasLong && nav.longDeck(bx, bz, 0.3)) || nav.obstDist(tx, tz, 0.6) < 0.3 || (nav.fenceNear(tx, tz) && nav.segBlocked(bx, bz, tx, tz)))) { tx = bx; tz = bz; }       // (a side place across a guard rail from the leader's trail, or against a wall / a post, is no place: the follower pins itself on it; on the 1.2 m lane of a long bridge pavement a party walks in single file)
    // a guard rail between the follower and its place (the leader went through a gate, the follower lags on the other side of the rail): head for the newest point of the leader's trail
    // that it can reach in a straight line, i.e. retrace the leader's way through the gate
    if (!cross && nav.fenceNear(a.x, a.z) && nav.segBlocked(a.x, a.z, tx, tz, 0.03)) { for (let q = 1; q < 48; q++) { const j = (i - q + 64) & 63; if (!nav.segBlocked(a.x, a.z, l.trX[j], l.trZ[j], 0.03)) { tx = l.trX[j]; tz = l.trZ[j]; break; } } }
    let dx = tx - a.x, dz = tz - a.z, d = hyp(dx, dz);
    a.kind = (l.kind === 'wait' || l.kind === 'stand' || !moving) && d < 0.6 ? 'stand' : 'walk';
    const v = d < 0.15 ? 0 : clamp(l.speed + (d - 0.3) * 1.2, 0, Math.max(l.vpref, a.vpref) * 1.7);
    if ((d > 7 || a.stuck > 60) && !visible(a.x, a.z) && !cross && nav.cover(bx, bz) < -0.5) { a.x = bx; a.z = bz; a.stuck = 0; a.blk = 0; }
    turnAndGo(a, dt, dx, dz, v, cross);
    if (d < 0.4 && !moving) { const toL = a.arc ? Math.atan2(l.x - a.x, l.z - a.z) : l.yaw, dy = wrap(toL - a.yaw); a.yaw += clamp(dy, -2.5 * dt, 2.5 * dt); }
    groundY(a, nav.reliefY(a.x, a.z) ?? (longK && a.x < -600 && nav.longDeck(a.x, a.z) ? nav.surfaceY(a.x, a.z, l.y) : l.y));          // (on the relief of the area the follower stands on the ground under it, not at the height of its leader 3 m up the slope; the strip: reliefY is null)
  };
  // children in the dry fountain
  const stepPlay = (a, t, dt) => {
    const fo = nav.fountain, c = a.playC;
    if (!a.pt || t >= a.until) {
      if (a.pt && R() < 0.5) { a.pt = null; a.until = t + rr(1.2, 3.5); a.tx = a.x; a.tz = a.z; a.gEnd = 0; a.g = a.gTarget = G.SPLASH; a.gk = 1; }
      else { const ang = R() * TAU, rad = Math.sqrt(R()) * (fo.r - 0.9); a.tx = fo.x + Math.cos(ang) * rad; a.tz = fo.z + Math.sin(ang) * rad; a.pt = 1; a.until = t + rr(3, 7); a.g = a.gTarget = G.NONE; a.gk = 0; a.vrun = rr(1.6, 3.0); }
    }
    const dx = a.tx - a.x, dz = a.tz - a.z, d = hyp(dx, dz);
    if (a.pt && d < 0.6) { a.until = t; }
    const v = a.pt ? a.vrun : 0; turnAndGo(a, dt, dx, dz, a.pt ? v : 0, false);
    const ex = a.x - fo.x, ez = a.z - fo.z, de = hyp(ex, ez); if (de > fo.r - 0.5) { a.x = fo.x + ex / de * (fo.r - 0.5); a.z = fo.z + ez / de * (fo.r - 0.5); }
    if (!a.pt) { a.gEnd = a.until; a.gk += clamp(1 - a.gk, -0.3, 0.3); }
    groundY(a, nav.surfaceY(a.x, a.z, a.y)); void c;
  };

  sim.slowFar = true;      // ?pslow=0 steps everybody at the full rate (A / B)
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('pslow') === '0') sim.slowFar = false;
  sim.stat = { stepped: 0, followers: 0, routes: 0, farRoutes: 0, deferred: 0 };      // running counters (never reset here: a benchmark reads differences)
  // ---- far-agent scheduling (2026-10-15, docs/PERFORMANCE-PLAN-2026-10-15.md item 3): A / B switches, each one exact when off (the loop is then the old one, step for step)
  // (node tools: globalThis.__poff = ['pfar2', ...] switches the same mechanisms off without a URL)
  const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null, qOff = (k) => (!!QS && QS.get(k) === '0') || (Array.isArray(globalThis.__poff) && globalThis.__poff.includes(k));
  sim.zoneCache = !qOff('pzc');      // ?pzc=0: the zone census queries area.zone for every agent every time (see zoneOf)
  sim.grpFar = !qOff('pgrp');        // ?pgrp=0: every group keeps the full rate however far it is (the old exemption; only the island groups were budgeted)
  sim.far2 = !qOff('pfar2');         // ?pfar2=0: one far tier only (1 turn in 6 beyond the render radius + 90 m)
  sim.phaseLists = !qOff('pphase');  // ?pphase=0: every micro step scans the whole agent array for its slice
  sim.farRoute = !qOff('proute');    // ?proute=0: far agents route like near ones (see routeTo)
  sim.failCap = !!QS && QS.get('pfail') === '1';      // OPT-IN ?pfail=1 (see routeTo): it changes the routes of visible people, so it is off by default
  let slowR2 = 0, sleepR2 = 0, far2R2 = 0;
  // persistent slice lists: the agents of each micro-step slice (a.sl) in the order of the agent array, rebuilt when the array grows (sim.spawn pushes only) or sim.slDirty is set
  // (a tool that moves a.sl to another slice sets it); agents spawned during a micro step are visited at its end, as the old array scan visited them
  const slices = []; let slicedN = -1;
  const buildSlices = () => { slices.length = 0; for (let p = 0; p < MICRO; p++) slices.push([]); for (const a of agents) { if (a.sl === undefined) a.sl = (a.leader ? a.leader.i : a.i) % MICRO; if (a.sl >= 0 && a.sl < MICRO) slices[a.sl].push(a); } slicedN = agents.length; sim.slDirty = false; };
  // the zone census (every 0.1 s, every agent) remembers each agent's last zone query: area.zone is a pure function of the point and 5 in 6 of the far people have not moved since the
  // last census (they step on every 6th turn only), so the repeated polygon / grid lookups return the remembered index (exact; sim.zoneCache = false / ?pzc=0 queries every time)
  const zoneOf = (a, x, z) => { if (sim.zoneCache && a.zqx === x && a.zqz === z) return a.zqk; const k = nav.marsZone(x, z); a.zqx = x; a.zqz = z; a.zqk = k; return k; };
  sim.update = (t) => {
    sim.t = t; sim.steps++;
    updateCamera(); slowR2 = (sim.renderR + 90) * (sim.renderR + 90); sleepR2 = (sim.renderR + 290) * (sim.renderR + 290); far2R2 = sleepR2;
    nav.activeFrac = 1 - 0.78 * clamp((night() - 0.15) / 0.7, 0, 1);
    rebuildHash();
    if (sim.steps % MICRO === 0 || sim.steps === 1) { let zc = 0, gc = 0; marsCount.fill(0); for (let i = 0; i < agents.length; i++) { const a = agents[i]; if (!a.hidden) { if (a.inZone) zc++; if (gardenOn && nav.inGarden(a.x, a.z)) gc++; if (mZones.length) { const k = zoneOf(a, a.x, a.z); if (k >= 0 && k < mZones.length) marsCount[k]++; } } else if (mZones.length && a.kind === 'inside' && a.emerge && !a.ug) { const k = zoneOf(a, a.emerge.x, a.emerge.z); if (k >= 0 && k < mZones.length && mZones[k].stay) marsCount[k]++; } } zoneCount = zc; gardenCount = gc; }
    placed.clear(); const phase = sim.steps % MICRO; routeBudget = sim.steps < 2 ? 1e9 : 3; farBudget = sim.steps < 2 ? 1e9 : FAR_ROUTES; farR2 = sim.steps < 2 ? -1 : slowR2;
    if (sim.steps > 1 && hyp(camPos.x - sim.lastCam.x, camPos.z - sim.lastCam.z) > 90) sim.mass = MICRO;
    sim.lastCam.x = camPos.x; sim.lastCam.z = camPos.z;
    const useSlices = sim.phaseLists; if (useSlices && (slicedN !== agents.length || sim.slDirty)) buildSlices();
    const list = useSlices ? slices[phase] : agents, turn = (sim.steps / MICRO) | 0;
    for (let li = 0, ln = list.length; ; li++) {
      let a; if (!useSlices) { if (li >= agents.length) break; a = agents[li]; } else if (li < ln) a = list[li]; else { const j = slicedN + li - ln; if (j >= agents.length) break; a = agents[j]; }      // (the plain scan reads the live length, like for..of)
      if (a.sl === undefined) a.sl = (a.leader ? a.leader.i : a.i) % MICRO;
      if (a.sl !== phase) continue;
      // beyond the render radius (+ a margin) an agent is not drawn: it steps on every 6th turn only (sim.slowFar; the whole city's ~1 400 people cost ~10 ms a frame otherwise)
      // (2026-10-15, plan item 3: sim.grpFar puts every other group under the same budget, decided by its leader, so its followers replay the leader's trail on the leader's turns. The groups of the
      // vignettes stay at the full rate: a scripted / fixed leader (a.script or a.noMass) that is not a zone resident (a.home >= 0: the zone residents wander
      // their zones by homeScript). sim.far2: beyond the render radius + 290 m (sleepR2) the turn comes once in 12 (a subset of the 1-in-6 turns: no agent steps twice as it crosses the line);
      // neither of the two applies during a mass placement (sim.mass, the start / a teleport: every far group and far single is re-placed round the camera as before; without this the
      // start put 1/6 of the far groups round the camera and the station crowd was ~20 % thinner))
      // rf: how many times rarer than before this agent now steps out there (a group newly under the budget 6 x, the second tier 2 x more): its far-walker recycling chance (below) is multiplied
      // by it, so the stream of people re-placed round the camera per second (the crowd the player sees) stays the old one
      let tier2 = false, rf = 1;
      if (sim.slowFar) { const r0 = a.leader || a, single = (r0 === a && !a.followers.length) ; if (single || (sim.grpFar && sim.mass <= 0 && !((r0.noMass || r0.script) && !(r0.home >= 0)))) { const dx = r0.x - camPos.x, dz = r0.z - camPos.z, d2 = dx * dx + dz * dz; if (d2 > slowR2) { tier2 = sim.far2 && sim.mass <= 0 && d2 > far2R2; if (tier2 ? turn % 12 !== r0.i % 12 : turn % 6 !== r0.i % 6) continue; rf = (single ? 1 : 6) * (tier2 ? 2 : 1); } } }
      sim.stat.stepped++; if (a.leader) sim.stat.followers++;
      a.tu = t; a.px = a.x; a.inZone = nav.stationFactor(a.x, a.z) < 0.5; a.pz = a.z; a.py = a.y; a.pyaw = a.yaw; a.pdist = a.dist; a.pspeed = a.speed;
      if (a.followers.length && !a.hidden) recordTrail(a);
      if (!a.hidden && !a.retire && !a.leader && (a.rank > nav.activeFrac || (mZones.length && night() > 0.55 && shutHere(a.x, a.z)))) { a.retire = true; if (a.pier) sim.vanish(a, t, 1e7, null); else if (a.kind === 'stand' && shutHere(a.x, a.z)) a.until = Math.min(a.until, t + R() * 25); }      // (night: the garden people leave)
      if (a.hidden) { if (a.kind === 'inside' && !a.leader && t >= a.until) emerge(a, t); continue; }
      if (sim.mass > 0 && (a.kind === 'walk' || a.kind === 'wait' || (a.kind === 'stand' && !a.goal && !a.seat && !a.script)) && !a.leader && !a.noMass && recycle(a, t, true)) continue;      // the start / a teleport: everybody is re-placed round the camera (before the route step: no route is wasted)
      if (a.leader && a.kind !== 'inside' && a.leader.kind !== 'inside' && a.kind !== 'sit' && a.kind !== 'approach' && a.kind !== 'play') { stepFollower(a, t, STEP); }
      else switch (a.kind) {
        case 'walk': case 'wait': stepRoute(a, t, STEP); break;
        case 'approach': if (a.leader && a.leader.kind !== 'sit') stepFollower(a, t, STEP); else stepApproach(a, t, STEP); break;
        case 'stand': a.speed = Math.max(0, a.speed - 5 * STEP); if (a.speed < 0.05) a.speed = 0; if (a.leader) { stepFollower(a, t, STEP); } if (!a.leader && t >= a.until) endStand(a, t); break;
        case 'sit': if (!a.leader && t >= a.until) standUp(a, t); else if (a.leader && a.leader.kind !== 'sit') standUp(a, t); break;
        case 'play': stepPlay(a, t, STEP); break;
        case 'ugwalk': stepUg(a, t, STEP); break;
        case 'inside': break;
      }
      if (a.leader && a.kind === 'stand' && a.leader.kind !== 'stand' && a.leader.kind !== 'wait') a.kind = 'walk';
      if (a.retire && !a.leader && !a.hidden) {
        if (a.kind === 'play') { a.kind = 'walk'; a.pt = null; a.rt = null; a.g = a.gTarget = G.NONE; a.gk = 0; newGoal(a, t); }
        else if ((a.kind === 'sit' || a.kind === 'stand') && a.until > t + 20) a.until = t + rr(2, 20);
      }
      if (a.retire && !a.leader && a.kind !== 'inside' && a.kind !== 'approach' && a.kind !== 'sit' && canVanish(a.x, a.z)) { const nd = nodeFor(a, 40); enterBuilding(a, t, null, 600); a.emerge = { x: a.x, z: a.z, yaw: a.yaw, node: nd >= 0 ? nd : -1 }; for (const f of a.followers) f.emerge = a.emerge; continue; }
      if (a.kind === 'walk' && !a.leader && (sim.steps % 180) === (a.i % 180)) watchdog(a, t);
      if (a.kind === 'walk' && !a.leader && !a.hidden && !a.noMass && R() < 0.006 * rf) { const ex = a.x - camPos.x, ez = a.z - camPos.z; if (ex * ex + ez * ez > FAR2 && recycle(a, t)) continue; }
      if (sim.debugNaN && !(a.x === a.x && a.z === a.z && a.yaw === a.yaw)) { sim.debugNaN(a, t, phase); sim.debugNaN = null; }
      gestureTick(a, t, a.speed > 0.4); lookTick(a, t);
      if (a.kind === 'stand' && a.leader == null && a.goal && a.goal.type === 'door' && a.until - t < 0) endStand(a, t);
    }
    if (sim.mass > 0) sim.mass--;
    if (phase === 0) for (const h of sim.hooks) h(t);
  };

  // ------------------------------------------------------------------ rendering (interpolated, 0.1 s behind)
  const S = newState();
  let frame = 0;
  sim.renderR = 250; sim.farR = 70; sim.nearCap = 260; sim.farEff = 70; let nearCount = 0;
  sim.render = (t) => {
    frame++; refreshCam();
    // adaptive full-rig radius: in a very dense crowd (the Anichkov plinths, the station forecourt) the radius shrinks so that at most nearCap people are drawn with the full rig
    if (nearCount > sim.nearCap) sim.farEff = Math.max(18, sim.farEff * 0.96); else if (nearCount < sim.nearCap * 0.85) sim.farEff = Math.min(sim.farR, sim.farEff * 1.02); nearCount = 0;
    const cx = camPos.x, cz = camPos.z, r2 = sim.renderR * sim.renderR, h2 = (sim.renderR + 25) * (sim.renderR + 25), f2 = sim.farEff * sim.farEff, g2 = (sim.farEff - 6) * (sim.farEff - 6);
    const camUnder = cam.position.y < -2;                                       // the metro platform people (a.ug) are drawn only while the camera is underground, the street people only above it
    for (const a of agents) {
      const ex = a.x - cx, ez = a.z - cz, dc = ex * ex + ez * ez;
      let out = a.hidden || dc > (a.shown ? h2 : r2) || (!!a.ug !== camUnder);
      if (!out && dc > 3600 && ex * camFwd.x + ez * camFwd.z < -0.3 * Math.sqrt(dc)) out = true;           // well behind the camera
      if (out) { if (a.shown) { crowd.hide(a.i); a.shown = false; } continue; }
      const isFar = dc > (a.far ? g2 : f2), lodChange = a.shown && isFar !== !!a.far; if (!isFar) nearCount++;
      if (a.shown && !lodChange) { if (a.speed < 0.05 && a.kind !== 'sit' && dc > 100 && (frame + a.i) % 4) continue; if (dc > 7225) { if ((frame + a.i) % 6) continue; } else if (dc > 2500) { if ((frame + a.i) % 3) continue; } else if (dc > 625) { if ((frame + a.i) % 2) continue; } }
      a.far = isFar;
      const alpha = clamp((t - a.tu) / STEP, 0, 1);
      S.x = a.px + (a.x - a.px) * alpha; S.z = a.pz + (a.z - a.pz) * alpha; S.y = a.py + (a.y - a.py) * alpha + 0.02;
      S.yaw = a.pyaw + wrap(a.yaw - a.pyaw) * alpha;
      if (isFar) { crowd.renderFar(a.i, S); a.shown = true; continue; }
      S.speed = a.pspeed + (a.speed - a.pspeed) * alpha; S.dist = a.pdist + (a.dist - a.pdist) * alpha; S.turn = a.turn;
      S.mode = a.kind === 'sit' ? MODE.SIT : a.spec.vehicle ? MODE.RIDE : MODE.WALK; S.seatH = a.seatH; S.gesture = a.g; S.gk = a.g === G.NONE ? 0 : a.gk; S.look = a.look; S.lookK = a.lookK;
      crowd.render(a.i, S, t); a.shown = true;
    }
    crowd.endFrame();
  };
  /** put an agent into a standing activity at (x, z): gestures list, duration, the goal it belongs to */
  sim.standAt = (a, x, z, yaw, gestures, dur, goal, t0 = 0, y = PAVE) => { place(a, x, z, yaw, y); a.kind = 'stand'; a.standG = gestures; a.until = t0 + dur; a.goal = goal || null; const n = nodeFor(a, 20); if (n >= 0) a.comp = nav.comp[n]; };
  sim.sitAt = (a, b, si, t0 = 0) => { a.goal = { type: 'bench', b, si }; b.seats[si].taken = a.i; a.hidden = false; a.comp = nav.comp[b.node]; sitDown(a, t0); a.until = t0 + rr(20, 220); };
  /** a bench was knocked over (core/knock.js): everybody sitting on it, and everybody walking to it, gets up / picks a new goal, and its seats are gone for good (taken = 1e9: no goal picks them, no scene seats anybody).
   *  The nav obstacle snapshot keeps the old bench collider (a ghost obstacle at the old spot): cosmetic. Returns how many agents were moved */
  sim.knockBench = (b) => {
    if (!b || b.knocked) return 0;
    b.knocked = true; let n = 0; const t = sim.t || 0;
    for (const a of agents) {
      const g = a.goal; if (!(a.seat && a.seat.b === b) && !(g && g.type === 'bench' && g.b === b)) continue;
      n++;
      if (a.kind === 'sit' && a.seat) { standUp(a, t); continue; }
      releaseGoal(a); a.seat = null; a.goal = null; a.rt = null;
      if (a.leader) a.kind = 'walk'; else if (!a.hidden) newGoal(a, t);
    }
    for (const s of b.seats) s.taken = 1e9;
    return n;
  };
  sim.playAt = (a, x, z) => { place(a, x, z, R() * TAU, PAVE); a.kind = 'play'; a.pt = null; a.until = 0; a.comp = nav.comp[nodeFor(a, 30)] ?? -1; };
  // ---- scripting API for the vignettes (vignettes.js): custom goals, vanishing into a train / taxi / door, standing for a while
  sim.routeTo = routeTo; sim.newGoal = newGoal; sim.nodeFor = nodeFor; sim.enterBuilding = enterBuilding; sim.leaveQueue = leaveQueue; sim.hooks = [];
  /** walk to node; fn(a, t) is called on arrival (fn may call goTo / vanish / standFor again); false when there is no route */
  sim.goTo = (a, node, fn) => { if (node < 0 || !routeTo(a, node)) return false; a.goal = { type: 'custom', node, fn }; a.kind = 'walk'; return true; };
  /** hide the agent for dur seconds; it comes back at the emerge record { x, z, yaw, node, door: { visibleOK: true, y } } */
  sim.vanish = (a, t, dur, emergeAt) => { leaveQueue(a); releaseGoal(a); a.goal = null; a.rt = null; a.kind = 'inside'; hide(a); a.until = t + dur; a.emerge = emergeAt; };
  /** stand still for dur seconds doing gestures, then call fn(a, t) (default: the agent's script / a new goal) */
  sim.standFor = (a, t, dur, gestures, fn) => { a.kind = 'stand'; a.rt = null; a.standG = gestures; a.until = t + dur; a.goal = fn ? { type: 'custom', fn } : null; };
  /** walk straight to (x, z) (no routing: a few metres), then fn(a, t) */
  sim.approach = (a, x, z, fn) => { a.kind = 'approach'; a.tx = x; a.tz = z; a.rt = null; a.goal = { type: 'custom', fn }; };
  // initial goals: only the people that can be near the camera (render radius + 60 m) get their route at once (A* over the big graph costs ~2.5 ms each); the far ones stand for 0.2-10 s and
  // get theirs through the normal per-step route budget (nobody sees them: they are beyond the render radius)
  sim.init = (t) => {
    refreshCam(); const R2 = (sim.renderR + 60) * (sim.renderR + 60);
    if (mZones.length) for (const a of agents) if (!a.hidden && a.zHome === -2) a.zHome = nav.marsZone(a.x, a.z);
    for (const a of agents) {
      if (a.hidden || a.kind !== 'walk' || a.rt || a.leader) continue;
      const dx = a.x - camPos.x, dz = a.z - camPos.z;
      if (dx * dx + dz * dz < R2) { /* kind 'walk' without a route: the first step re-places it round the camera (mass) or routes it (stepRoute -> newGoal) */ } else { a.kind = 'stand'; a.until = t + rr(0.2, 10); a.standG = [G.NONE]; a.goal = null; }
    }
  };
  nav.activeFrac = 1;
  return sim;
}
