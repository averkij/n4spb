// landmarksPalaceBridge - the OPENING MECHANISM of the Palace Bridge (Дворцовый мост, docs/AREAS.md 13.10): the central bascule span of the bridge is TWO LEAVES (~28.7 m each, hinged on the inner faces of the two bascule
// piers) that RISE about 70 degrees in opposite senses and leave a 38 m gap in the middle, on a schedule of the game clock: barrier arms drop and the NPC traffic and pedestrians stop short of the span (WARN), the leaves
// swing up about their hinges with an easing (70 s), hold (30 s), and lower (70 s). The deck of each leaf is a MOVING, TILTING walkable / drivable surface: deckY(x, z) returns the live height, a body that stands on it is
// carried by it, and beyond 35 degrees (walker) / 25 degrees (car) it slips down toward its hinge. The player is NOT stopped by the barriers: he can step or drive onto a leaf while it opens.
// The SPLIT: the `bridges` module (bridges/palace.js) still draws the whole bridge and every collider of it, EXCEPT the central span between the pier faces (u 96.5 .. 153.9) when this module is in the page's build list
// (`leaves`); this module draws and moves exactly that span. The strip (this module is not in its list) keeps the closed bridge, byte for byte.
// Files: landmarksPalaceBridge/frame.js (frame, profile, the leaf descriptions, the gates: pure) schedule.js (the clock constants) service.js (the bridge description for lib/bascule.js, the published service, the floor ramps,
// the bay layout: pure) leaf.js (the two moving groups, their floor and the breakable rail / kerb bays, lib/bascule-bays.js) gates.js (the barrier arms) groups.js (claims nothing); the generic kinematics / service / carry / NPC hooks are lib/bascule.js.
// Publishes ctx.services.landmarksPalaceBridge = { state(), deckY(x, z), deckLift(x, z), setMode(m), mode(), stop, theta, gates, stepBlocked(...), onLeaf(x, z), leafAt(x, z), clock, stats ... } (also in HOOKS.deckServices:
// the cars and the walkers ask it first; bridges/palace.js deckAt asks it for the central span, so services.bridges.deckY / traffic / parked cars see the live leaves too). Dev switch ?palacebridge=open|closed|auto
// (auto = the schedule of schedule.js, the default). NO flags / flagpoles, no alarm sounds (user rules). Objects stay movable and breakable: the fixed part of the bridge keeps its breakable railing bays; the rail panels and barrier kerb pieces of the
// MOVING leaves are breakable knock records too (13.10).
export const OWNS_GROUPS = [];

import { makeMats } from './bridges/mats.js';
import { buildSpanWires } from './lib/bridge-wires.js';
import { buildLeaves } from './landmarksPalaceBridge/leaf.js';
import { buildGates } from './landmarksPalaceBridge/gates.js';
import { createService, addStopLines, stepWalker, stepCar, bodyState } from './landmarksPalaceBridge/service.js';
import { WAY_IDS, SET_DOWN, UM, toWorld } from './landmarksPalaceBridge/frame.js';
import { WALK_SLIP_DEG, hookPeople, sweepPeople, spanClear } from './lib/bascule.js';

const URLQ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const TOAST_R = 700;                     // m: the toast "the bridge is opening" is shown to a player within this distance of the bridge

export async function build(ctx) {
  const M = makeMats(ctx);
  const mode = URLQ.get('palacebridge'), svc = createService({ mode: mode === 'open' || mode === 'closed' ? mode : 'auto' });
  const leaf = buildLeaves({ ctx, M });
  leaf.colliders(); leaf.set(0);
  const wires = buildSpanWires(ctx, 'palace');                 // the contact wires of the span: the streets module cut them out; drawn here only while the leaves are down (lib/bridge-wires.js)
  const gv = buildGates({ ctx, M, gates: svc.gates });
  svc.barriers = gv;
  svc.leaf = leaf;
  svc.wires = wires;
  svc.stats = { spanWires: wires ? wires.lines : 0, tris: leaf.tris, leafTris: leaf.tris, rails: leaf.info.rails, kerbs: leaf.info.kerbs, arms: gv.arms, ramps: leaf.items().length };
  svc.deckAt = svc.deckY;
  Object.defineProperty(svc.stats, 'swept', { get: () => swept, enumerable: true });      // NPC people set down off a steep leaf (see the frame loop)
  ctx.services.landmarksPalaceBridge = svc;

  // ---- the NPC traffic: stop lines on the lanes of the bridge ways (streets is built before this module), the signal answers red while the flag is up
  svc.stats.stopLines = addStopLines(ctx.services.streets, svc, WAY_IDS);

  // ---- the leaves start only when nothing of the NPC world stands on the span (the warning lasts at least WARN, at most WARN_MAX seconds)
  svc.clock.setReady(() => spanClear(ctx, svc));

  // ---- the frame loop: the clock, the leaf transforms and floors, the barriers, the toast, the people hooks, the carry / slip of the player or his car
  const walk = bodyState(), car = bodyState(), pp = ctx.player && ctx.player.position;
  let peopleHooked = false, first = true, sweep = 0, swept = 0;
  const hook = () => { const nav = ctx.services.people && ctx.services.people.sim && ctx.services.people.sim.nav; peopleHooked = !!nav && hookPeople(nav, svc, 'palacebridge'); };
  // the shade the water shader lays under the deck (environment/water.js, zone 'palace-deck') is cut between the two tips while the leaves stand up: no deck over that water (docs/AREAS.md 15.z)
  const shadeGap = (th) => {
    const sh = ctx.shared && ctx.shared.bridgeShade; if (!sh || !sh.setGap) return;
    const A = svc.B.leaves[0], Bl = svc.B.leaves[1], fa = A.foot(th, {}).far, fb = Bl.foot(th, {}).far;
    if (th < 0.01 || fb - fa < 0.5) { sh.setGap('palace-deck'); return; }
    const a = toWorld(fa, 0), b = toWorld(fb, 0); sh.setGap('palace-deck', a.x, a.z, b.x, b.z);
  };
  ctx.onUpdate((dt, t) => {
    const night = ctx.shared && ctx.shared.uNight ? ctx.shared.uNight.value : 0;
    const r = svc.advance(dt > 0 ? Math.min(dt, 5) : 0, night);
    if (first || r.th1 !== r.th0) { leaf.set(r.th1); if (wires) wires.set(r.th1); shadeGap(r.th1); }
    gv.set(svc.clock.barrier, t);
    for (let i = 0; i < r.events.length; i++) {
      const ev = r.events[i];
      if (ev === 'warn') gv.restore();      // the booms that a car broke in the last cycle stand again (docs/AREAS.md 13.11)
      if (ev === 'warn' && pp) { const w = toWorld(UM, 0); if (Math.hypot(pp.x - w.x, pp.z - w.z) < TOAST_R && ctx.ui && ctx.ui.toast) ctx.ui.toast('Дворцовый мост разводят · The Palace Bridge is opening'); }
    }
    if (!peopleHooked) hook();
    // a straggler of the NPC crowd still on a leaf when it is too steep to stand on (the WALK slip angle) is set down outside the gate of its hinge side: the slide of the player, without the slide (every half second, only while steep)
    if (peopleHooked && (sweep -= dt) <= 0) {
      sweep = 0.5;
      const pe = ctx.services.people;
      if (pe && pe.sim && svc.theta > 0.01 && svc.leaves[0].slips(WALK_SLIP_DEG, svc.theta)) swept += sweepPeople(pe.sim, svc.B, svc, SET_DOWN);
    }
    const d = ctx.drive, pl = ctx.playerObj, step = dt > 0 ? Math.min(dt, 0.1) : 0;
    if (d && d.active && d.car) stepCar(d.car, r.th0, r.th1, step, car);
    else if (pl && !pl.fly && !pl.ride && pl.enabled !== false) stepWalker(pl, r.th0, r.th1, step, walk);
    first = false;
  });
}
