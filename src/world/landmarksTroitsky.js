// landmarksTroitsky - the Troitsky (Trinity) Bridge (Троицкий мост) over the Neva with its OPENING BASCULE LEAF (docs/AREAS.md 13.8): the whole bridge from the Mars Field bank to Troitskaya Square (a port of the
// source project's bridges/troitsky.js, 554 m, the piers, the five steel spans, the granite viaduct, the candelabra, the lamps, the obelisks), and the one bascule leaf (43.2 m) that RISES on a schedule of the game
// clock: barrier arms drop and the NPC traffic and pedestrians stop short of the span (WARN), the leaf swings up about its hinge to 70 degrees with an easing (70 s), holds (25 s), and lowers (70 s). The leaf's deck
// is a MOVING, TILTING walkable / drivable surface: deckY(x, z) returns the live height, a body that stands on it is carried by it, and beyond 35 degrees (walker) / 25 degrees (car) it slips down toward the hinge.
// The player is NOT stopped by the barriers: he can step or drive onto the leaf while it opens.
// Files: landmarksTroitsky/frame.js (frame, profile, leaf kinematics, slip rule: pure) schedule.js (the clock: pure) service.js (the published service, ramps, dynamic boxes, stop lines, carry / slip: pure) bridge.js (the
// static bridge: Parts + colliders + knockable lamps) leaf.js (the moving group, its floor and dynamic colliders) gates.js (the barrier arms) groups.js (claims).
// Publishes ctx.services.landmarksTroitsky = { state(), deckY(x, z), deckLift(x, z), setMode(m), mode(), stop, theta, gates, stepBlocked(...), onLeaf(x, z), clock, stats ... } (also in HOOKS.deckServices: the cars and the
// walkers ask it first) and wraps services.bridges.deckY (traffic / parked cars see the deck too). Dev switch ?troitsky=open|closed|auto (auto = the schedule of schedule.js, the default).
// NO flags / flagpoles, no alarm sounds (user rules). Objects stay movable and breakable: the railings, parapets, barrier kerbs, candelabra, poles and lamps are knockable (bridge.js), the leaf's rail panels and kerb pieces too (leaf.js; obelisks are the only solid).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './bridges/kit.js';
import { makeMats } from './bridges/mats.js';
import { buildSpanWires } from './lib/bridge-wires.js';
import { makeRailBatch } from './bridges/rails.js';
import { WATER_Y } from './bridges/sites.js';
import { buildTroitsky } from './landmarksTroitsky/bridge.js';
import { buildLeaf } from './landmarksTroitsky/leaf.js';
import { buildGates } from './landmarksTroitsky/gates.js';
import { createService, addStopLines, stepWalker, stepCar, bodyState } from './landmarksTroitsky/service.js';
import { TROITSKY, toWorld, toUV, FR, LEN, HW, U_HINGE, U_TIP, leafFoot, GATE_S, WALK_SLIP_DEG, slips } from './landmarksTroitsky/frame.js';
import { WAY_IDS } from './landmarksTroitsky/groups.js';

const URLQ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const TOAST_R = 700;                     // m: the toast "the bridge is opening" is shown to a player within this distance of the bridge

export async function build(ctx) {
  const M = makeMats(ctx), rails = makeRailBatch(ctx), P = new Parts();
  const env = ctx.services && ctx.services.environment;
  const e = env && env.waterways && env.waterways.neva, waterY = e && Number.isFinite(e.y) ? e.y : WATER_Y.neva;
  const root = new THREE.Group(); root.name = 'landmarks-troitsky';

  // ---- the static bridge (everything but the leaf), its colliders and the knockable lamps
  const B = buildTroitsky({ ctx, P, M, rails, waterY });
  B.colliders();
  const meshes = P.build(root, { name: 'troitsky', waterY, sub: (m) => ctx.noOutline(m) });      // (the piers under the water: colour only, no contour lines through the river, docs/AREAS.md 15.z)
  for (const m of meshes) if (M.decalMats.has(m.material)) ctx.noOutline(m);
  rails.flush(root);
  ctx.addStatic(root);
  const lamps = B.buildKnockables();
  P.b.clear();

  // ---- the schedule and the published service
  const mode = URLQ.get('troitsky'), svc = createService({ mode: mode === 'open' || mode === 'closed' ? mode : 'auto' });
  const leaf = buildLeaf({ ctx, M });
  leaf.colliders(); leaf.set(0);
  const wires = buildSpanWires(ctx, 'troitsky');               // the contact wires of the leaf span: the streets module cut them out; drawn here only while the leaf is down (lib/bridge-wires.js)
  const gv = buildGates({ ctx, M, gates: svc.gates });
  svc.wires = wires;
  svc.barriers = gv;
  svc.leaf = leaf; svc.frame = { toWorld, toUV, FR, TROITSKY };
  svc.stats = { tris: P.tris + leaf.tris, staticTris: P.tris, leafTris: leaf.tris, rails: B.info.rails + leaf.info.rails, colliders: B.info.colliders, lamps: lamps.records.filter(Boolean).length, arms: gv.arms,
    candelabra: B.candelabra.reduce((n, r) => n + r.records.filter(Boolean).length, 0), poles: B.poles ? B.poles.records.filter(Boolean).length : 0, kerbBays: B.kerbs ? B.kerbs.records.filter(Boolean).length : 0,
    leafBays: leaf.bays.filter((b) => b.rec).length };
  svc.deckAt = svc.deckY;
  Object.defineProperty(svc.stats, 'swept', { get: () => swept, enumerable: true });      // NPC people set down off a steep leaf (see the frame loop)
  ctx.services.landmarksTroitsky = svc;

  // ---- the NPC traffic: stop lines on the lanes of the bridge ways (streets is built before this module), the signal answers red while the flag is up
  svc.stats.stopLines = addStopLines(ctx.services.streets, svc, WAY_IDS);

  // ---- the traffic / parking read services.bridges.deckY: wrap it (as bridges.js wraps landmarksC's) and give the traffic prefilter (190 m round a list entry) anchors along the 554 m deck
  const br = ctx.services.bridges;
  if (br && typeof br.deckY === 'function' && !br.deckY.__troitsky) {
    const orig = br.deckY, wrapped = (x, z) => { const y = svc.deckY(x, z); return y !== null ? y : orig(x, z); };
    wrapped.__troitsky = true; br.deckY = wrapped;
    if (Array.isArray(br.list)) for (const u of [60, 180, 300, 420, 520]) { const w = toWorld(u, 0); br.list.push({ id: 'troitsky', name: 'Троицкий мост', nameEn: 'Troitsky Bridge', x: w.x, z: w.z, part: true }); }
  }
  const S = (ctx.services.landmarks ||= {});
  { const w = toWorld(272, -10.9); S.photoSpots = (S.photoSpots || []).concat([{ x: w.x, z: w.z, yaw: 0, name: 'Троицкий мост' }]); }
  if (Array.isArray(br && br.masts)) for (const m of B.masts) br.masts.push({ id: 'troitsky', ...m });
  // the pedestrians' long-bridge logic (people/nav.js nav.longs: a node chain on each pavement, joined to the banks, the pavement band LBAND.troitsky) reads the axis of the span
  if (Array.isArray(br && br.spans)) br.spans.push({ id: 'troitsky', a: toWorld(0, 0), b: toWorld(LEN, 0), hw: HW });

  // ---- the leaf starts only when nothing of the NPC world stands on the span (the warning lasts at least WARN, at most WARN_MAX seconds)
  svc.clock.setReady(() => {
    const tr = ctx.services.traffic, pe = ctx.services.people;
    if (tr && tr.vehicles) for (let i = 0; i < tr.vehicles.length; i++) if (svc.inSpan(tr.vehicles[i].x, tr.vehicles[i].z)) return false;
    if (pe && pe.sim && pe.sim.agents) for (const a of pe.sim.agents) if (!a.hidden && svc.inSpan(a.x, a.z)) return false;
    return true;
  });

  // ---- the frame loop: the clock, the leaf transform and floor, the barriers, the toast, the people hooks, the carry / slip of the player or his car
  const walk = bodyState(), car = bodyState(), pp = ctx.player && ctx.player.position;
  let peopleHooked = false, first = true, sweep = 0, swept = 0;
  const hookPeople = () => {
    const nav = ctx.services.people && ctx.services.people.sim && ctx.services.people.sim.nav;
    if (!nav || nav.__troitsky) { peopleHooked = !!nav; return; }
    nav.__troitsky = true; peopleHooked = true;
    const fn = nav.fenceNear, sb = nav.segBlocked, ry = nav.reliefY, df = nav.densityFactor;
    // while the flag is up the span is a THINNED zone (factor 0): nobody is placed there, an agent inside it picks goals outside it (people/sim.js: `inZone` = densityFactor < 0.9), so the span drains by itself
    if (typeof df === 'function') nav.densityFactor = (x, z) => (svc.stop && svc.inGated(x, z) ? 0 : df(x, z));
    if (typeof fn === 'function') nav.fenceNear = (x, z) => fn(x, z) || svc.nearGate(x, z);                                  // (the walker's step test only runs near a fence)
    if (typeof sb === 'function') nav.segBlocked = (ax, az, bx, bz, pad) => sb(ax, az, bx, bz, pad) || svc.stepBlocked(ax, az, bx, bz);      // a step into the closed span is a wall
    if (typeof ry === 'function') nav.reliefY = (x, z) => {                                                                       // people ride the moving leaf (their route heights are the closed deck's)
      const r = ry(x, z); if (r != null) return r;
      if (svc.theta > 0.002 && svc.onLeaf(x, z)) { const y = svc.deckY(x, z); return y === null ? null : y + svc.deckLift(x, z); }
      return null;
    };
  };
  // the shade the water shader lays under the deck (environment/water.js, zone 'troitsky') is cut where the leaf stands up: the open water between the leaf's foot and the pier it rests on is no longer under a deck (docs/AREAS.md 15.z)
  const shadeGap = (th) => {
    const sh = ctx.shared && ctx.shared.bridgeShade; if (!sh || !sh.setGap) return;
    const far = leafFoot(th, {}).u1;
    if (th < 0.01 || far >= U_TIP - 0.5) { sh.setGap('troitsky'); return; }
    const a = toWorld(far, 0), b = toWorld(U_TIP, 0); sh.setGap('troitsky', a.x, a.z, b.x, b.z);
  };
  ctx.onUpdate((dt, t) => {
    const night = ctx.shared && ctx.shared.uNight ? ctx.shared.uNight.value : 0;
    const r = svc.advance(dt > 0 ? Math.min(dt, 5) : 0, night);
    if (first || r.th1 !== r.th0) { leaf.set(r.th1); if (wires) wires.set(r.th1); shadeGap(r.th1); }
    gv.set(svc.clock.barrier, t);
    for (const ev of r.events) {
      if (ev === 'warn') gv.restore();      // the booms that a car broke in the last cycle stand again (docs/AREAS.md 13.11)
      if (ev === 'warn' && pp) { const w = toWorld(180, 0); if (Math.hypot(pp.x - w.x, pp.z - w.z) < TOAST_R && ctx.ui && ctx.ui.toast) ctx.ui.toast('Троицкий мост разводят · The Troitsky Bridge is opening'); }
    }
    if (!peopleHooked) hookPeople();
    // a straggler of the NPC crowd still on the leaf when it is too steep to stand on (the WALK slip angle) is set down on the first pier: the slide of the player, without the slide (every half second, only while the leaf is steep)
    if (peopleHooked && (sweep -= dt) <= 0) {
      sweep = 0.5;
      const pe = ctx.services.people, sim = pe && pe.sim;
      if (sim && sim.agents && slips(WALK_SLIP_DEG, svc.theta) && svc.theta > 0.01) for (const a of sim.agents) {
        if (a.hidden || !svc.onLeaf(a.x, a.z)) continue;
        const q = toUV(a.x, a.z, {}), w = toWorld(GATE_S - 1.5, Math.max(-HW + 1, Math.min(HW - 1, q.v)));      // (outside the south gate: the closed gate keeps it out)
        sim.place(a, w.x, w.z, a.yaw, 0.12); a.rt = null; a.goal = null; a.kind = 'walk'; swept++;
      }
    }
    const d = ctx.drive, pl = ctx.playerObj, step = dt > 0 ? Math.min(dt, 0.1) : 0;
    if (d && d.active && d.car) { if (!d.car.floats) stepCar(d.car, r.th0, r.th1, step, car); }      // (a motor boat floats UNDER the span: the leaf neither carries nor pushes it, and the helmsman is not a walker on the leaf)
    else if (pl && !pl.fly && !pl.ride && pl.enabled !== false) stepWalker(pl, r.th0, r.th1, step, walk);
    first = false;
  });
}
