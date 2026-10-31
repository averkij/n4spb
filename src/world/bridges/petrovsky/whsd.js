// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/whsd.js), for Dekabristov Island (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7):
// the deck is skyline scenery as in the source (no walk floor: deck.js `noWalk`), but its barriers and lamps are the breakable bays / knock posts of the shared deck builder (the source registered none: no colliders), the
// railing panels are knock bays of rails.js like everywhere. Solid on purpose: the pylons and the piers (structures; their footings stand in the water, the hull oracle counts the piers through bridges/piers.js).
// bridges/petrovsky/whsd.js - the WHSD (ЗСД) cable-stayed bridge over the Petrovsky fairway (Мост через Петровский фарватер, opened 2 Dec 2016): SKYLINE scenery in the Gulf west of Petrovsky / Krestovsky islands,
//   seen from the yacht-club piers and the Krestovsky shore about 1 km away (photos refs/petrovsky-zhdanovka-2026/misc m19 m20 m21, yacht y10).
//   Facts [W ru.wikipedia "Мост через Петровский фарватер"]: 580 m, five spans 60 + 110 + 240 + 110 + 60, 8 lanes (two carriageways 4 lanes each, 35 m), 50 m wide with the stay anchors, two white reinforced-concrete
//   pylons 124 m high (a 4 x 4.865 m shaft in the median, a slot window near the top, a slanted top), 120 stays in three planes (13 m pitch), steel-concrete box girder, built 2013-16.
//   Axis [OSM r8840605, w589047643 (south-bound, west) / w589047646 (north-bound, east)]: the midline of the two carriageways from (-7563, -4085) to (-7519, -3506); pylons 170 m and 410 m from the north end
//   = (-7548, -3918) and (-7527, -3676) [+-10 m].  Deck height [E from photos zs04 / zs05: soffit ~22 m over the water, the pylon above the deck 3.7 x the clearance]: 22 m over the street plane at the pylons, falling to 19 / 17 m at the ends; the end faces are closed (the viaduct continues beyond
//   the data).  NOT walkable, no colliders: only services.bridges.deckY (traffic) answers.  No flags / lights.
//   Own file: bridges/petrovsky/whsd.js.
import { profile } from '../long.js';
import { makeRoute } from './route.js';
import { buildDeck } from './deck.js';

export const WHSDP = {
  id: 'whsd-petrovsky', name: 'Мост через Петровский фарватер (ЗСД)', nameEn: 'WHSD cable-stayed bridge over the Petrovsky fairway (skyline)', ww: 'neva',
  ctrl: [[-7563.5, -4085], [-7548, -3913], [-7526, -3665], [-7519, -3578], [-7518.5, -3506]],
  spans: [60, 110, 240, 110, 60], pylonS: [170, 410], pylonH: 124, med: 3.4, road: 16.5, hw: 22.5,
  prof: [[0, 19], [60, 21], [170, 22], [300, 22.4], [410, 22], [520, 20], [580, 17]],
  osm: ['r8840605', 'w589047643', 'w589047646'],
};
export const whsdRoute = () => makeRoute(WHSDP.ctrl, 6);

export function buildWhsdPetrovsky(env) {
  const { ctx, P, M } = env, sp = WHSDP, R = whsdRoute(), yOf = profile(sp.prof), wires = ctx.wires;
  const B = { id: sp.id, info: { rails: 0, colliders: 0 }, masts: [], anchors: [] };
  const mats = { conc: M.whsdBarrier, fas: M.whsdConcrete, soff: M.whsdSoffit, pave: M.whsdConcrete, skirt: M.whsdConcrete };
  const D = buildDeck(env, R, {
    y: yOf, hwR: () => sp.hw, hwL: () => sp.hw, med: sp.med, road: sp.road, lanes: 4, bar: 0.5, barH: 0.95, mats, girder: { depth: 3.4, flat: 10.0, lip: 1.0 }, low: -1, endCaps: true, noWalk: !env.walkable,
    rail: { kind: 'hpipes', hex: '#e9ecee' }, lamps: { every: 55, h: 12, from: 30, to: R.len - 20, skip: (s) => sp.pylonS.some((p) => Math.abs(s - p) < 14) },
  }, B);
  // ---- piers under the deck: twin round columns at the ends and under the pylons (the 60 m end spans stand on pairs of columns on a pile cap in the water)
  const piers = [0, 60, 170, 410, 520, R.len];
  for (const s of piers) {
    const c = R.pos(s, 0), y = yOf(s), top = y - 3.4;
    const pr = (v) => R.pos(s, v);
    // n4spb: one 7 x 7 m pile cap under each column instead of the source's single 18 x 18 m cap under the pair: a block wider than 12 m is a wall of water for the boat oracle (boat-passage-test b: every solid cell of open water
    // within 6 m of a drawn wall), and the water between the two footings stays open (the columns stand 19 m apart)
    for (const v of [-9.5, 9.5]) { const p = pr(v); P.box(M.whsdConcrete, p.x - 3.5, p.x + 3.5, -4.7, -1.4, p.z - 3.5, p.z + 3.5, 'b', 6); P.cyl(M.whsdConcrete, [p.x, -1.4, p.z], [p.x, top - 0.05, p.z], 2.2, 1.9, 12, false); }      // the pile cap in the water + the column
    P.box(M.whsdConcrete, c.x - 3.0, c.x + 3.0, top - 2.0, top, c.z - 3.0, c.z + 3.0, 'b', 4);              // the cross-head (axis-aligned stub, hidden under the girder)
  }
  // ---- the two pylons: a white concrete shaft 4.0 x 4.9 m tapering upward, a slot window near the top, a slanted top
  const base = -4.7, top = sp.pylonH - 4.0, pylonPts = [];
  for (const sPy of sp.pylonS) {
    const c = R.pos(sPy, 0), ring = (t) => {
      const y = base + (top - base) * t, wA = 2.45 - 0.55 * Math.max(0, (t - 0.35) / 0.65), wB = 2.0 - 0.4 * Math.max(0, (t - 0.35) / 0.65), slant = t > 0.97 ? (t - 0.97) / 0.03 * 3 : 0;
      return [[-wA, -wB], [wA, -wB], [wA, wB], [-wA, wB]].map(([a, b], i) => [c.x + c.tx * a - c.tz * b, y - (i === 0 || i === 3 ? slant : 0), c.z + c.tz * a + c.tx * b]);
    };
    const n = 12; let prev = ring(0);
    for (let i = 1; i <= n; i++) {
      const cur = ring(i / n);
      for (let e = 0; e < 4; e++) { const e2 = (e + 1) % 4, mx = (prev[e][0] + prev[e2][0]) / 2 - c.x, mz = (prev[e][2] + prev[e2][2]) / 2 - c.z; P.quad(M.whsdConcrete, prev[e], prev[e2], cur[e2], cur[e], [mx, 0, mz]); }
      prev = cur;
    }
    P.quad(M.whsdConcrete, prev[0], prev[1], prev[2], prev[3], [0, 1, 0]);
    for (const sg of [-1, 1]) {                                                                // the slot window (dark) on the two long faces near the top
      const q = (bb, y) => [c.x + c.tx * (sg * 2.03) - c.tz * bb, y, c.z + c.tz * (sg * 2.03) + c.tx * bb];
      P.quad(M.darkGlass, q(-0.45, top - 8.5), q(0.45, top - 8.5), q(0.45, top - 3.0), q(-0.45, top - 3.0), [c.tx * sg, 0, c.tz * sg]);
    }
    pylonPts.push(c);
    // the stays: three planes (the middle one on the shaft axis, two outer ones at +-9 m on the deck edges), 10 per side per plane, 13 m pitch from 25 m to 142 m; they leave the shaft between 70 and 114 m
    for (const [pl, vPl] of [[0, 0], [1, 9.5], [-1, -9.5]]) for (const dir of [-1, 1]) for (let i = 0; i < 10; i++) {
      const dS = 26 + i * 13 * (dir > 0 ? 1.0 : 0.82), sA = sPy + dir * dS; if (sA < 0 || sA > R.len) continue;
      const yAtt = 72 + 4.5 * i, a = R.pos(sPy, vPl * 0.12 + (pl === 0 ? 0 : 0)), q = R.pos(sA, vPl + (pl === 0 ? 0 : pl * 9.8));
      wires.add([[a.x, yAtt, a.z], [q.x, yOf(sA) + 0.9, q.z]], { width: 0.14, color: '#f4f6f7' });
    }
  }
  const mid = R.pos(R.len * 0.5, 0);
  B.x = mid.x; B.z = mid.z; B.at = [mid.x, mid.z]; B.yDeck = yOf; B.bounds = D.bounds; B.deckAt = D.deckAt; B.route = R;
  for (let s = 100; s < R.len; s += 190) { const p = R.pos(s, 0); B.anchors.push({ x: p.x, z: p.z }); }
  B.info.buckets = P.b.size; B.info.tris = P.tris; B.info.stays = 120; B.info.len = +R.len.toFixed(1);
  if (ctx.services) ctx.services.whsdPetrovsky = { info: B.info, spec: sp, route: R };
  B.colliders = () => { D.colliders(ctx.physics); };      // n4spb: scenery without a walk floor (noWalk): the barrier bays and the lamp posts of the deck are registered (breakable); the car / traffic ride services.bridges.deckY
  void pylonPts;
  return B;
}
