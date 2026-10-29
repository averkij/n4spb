// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/betancourt.js), for Dekabristov Island (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7):
//   * shore.js (the granite wall with a 1 m parapet along the bank line under the viaduct, a solid 0.5 m box 9 m tall) is NOT ported: the generic quay of the environment (knock bays, open quay edges) stands under the deck as under
//     every other bridge of the data rings; a wall of colliders along a bank is a wall at the water (the owner's rule: water is never a wall, every wall breakable)
//   * the barriers, the railing and the lamps of the deck are knock bays / knock posts (petrovsky/deck.js), the handrails and enclosures of the pylon stairs ghost bays (petrovsky/stair.js)
//   * solid on purpose (structures): the tulip piers (they stand in the water with a collar; the hull oracle counts them), the pylon legs and plinths, the slim columns under the stairs, the walk ramps (the floor of the deck)
// bridges/petrovsky/betancourt.js - the Betancourt Bridge (мост Бетанкура, 2018), complete: the approach viaduct on Petrovsky Island, the cable-stayed main span with its two pylon portals, the girder over Serny
// Island, the south channel and the ramp down to Dekabristov Island (Uralskaya street).  Dossier: docs/research/petrovsky-bridges-2026.md (ru.wikipedia "Мост Бетанкура", OSM r18260529 / w409159831 / w409159832 /
// w758386928 / w589195047 / w590176833 / w641971739 / w641971740, 12 Commons photos refs/petrovsky-bridges + refs/petrovsky-zhdanovka-2026/betancourt).
//   Facts [W]: 923 m (917 m along our axis), 37 m wide (6 lanes: two carriageways of three lanes, a median barrier, a 3.5 m cycle track and a 3 m footway), fixed S-shaped cable-stayed bridge, ONE pylon group of two
//   portals 44 m high (two legs each joined by seven ladder rungs; the legs stand on the outer edges of the deck, the left one curved, platform + helical stair below), 48 stays 31.7 - 99.3 m, navigation clearance
//   100 x 16 m, box girders with a curved soffit, white tube railings, pale grey cobra lamp standards, concrete barriers; the approaches stand on pale concrete tulip piers [V photos b01 b05 b09 b10 bt01 bt04 bt06].
//   Axis [OSM]: the middle line of the two one-way carriageways (way A w409159831 shifted 6.9 m to its left), 917 m from the Remeslennaya street (-4526, -3077) over Petrovsky Island, the pylon at the Petrovsky
//   shore (s 432, (-4801, -2774)), the Malaya Neva channel (s 434 - 586), Serny Island (586 - 742), the south channel (742 - 828) and Dekabristov Island to Uralskaya (-4735, -2318).  Heights [E from photos]: street
//   level at both ends, 5.4 m over the link roads, 18.6 m at the pylon (clearance 16 m over the water + girder 2.3 m), then a long descent to the south.
//   Own files: bridges/petrovsky/*.js + tools/petrovsky-bridge-*.mjs.  NO flags / flagpoles / beacons (user rules).
import { profile } from '../long.js';
import { makeRoute, leftOffset, clamp, smooth } from './route.js';
import { buildDeck } from './deck.js';
import { planStairs, drawStairs } from './stair.js';

/** way A of the OSM relation (w409159831, from the Petrovsky end to Dekabristov): the axis is this line shifted 6.9 m to its left */
export const A_NODES = [[-4530.2, -3082.4], [-4540.7, -3073.3], [-4558.6, -3059.7], [-4583, -3044.9], [-4617.9, -3030.5], [-4670.7, -3008.8], [-4694, -2993.9], [-4714.1, -2971.1], [-4729.1, -2951.5], [-4741.7, -2930.6], [-4754.9, -2900.4], [-4803.6, -2784.9], [-4822.5, -2736.3], [-4831.5, -2705.6], [-4836.4, -2676.3], [-4835.3, -2645], [-4828.4, -2609.2], [-4817.7, -2580.4], [-4800, -2547.9], [-4779.6, -2512.3], [-4760.6, -2480], [-4746.6, -2453], [-4736.7, -2426], [-4732.2, -2405.8], [-4730.1, -2391.3], [-4730, -2378.1], [-4734.6, -2350.1], [-4736.7, -2338.7], [-4739.1, -2328], [-4742, -2320.2]];
export const BETAN = {
  id: 'betancourt', name: 'мост Бетанкура', nameEn: 'Betancourt Bridge (cable-stayed, Petrovsky Island - Dekabristov Island)', ww: 'neva',
  off: 6.9, med: 1.4, road: 10.5, lanes: 3, bar: 0.5, barH: 0.8, hwR: 17.0, hwL: 19.6, endHw: 15.2, depth: 2.3, flat: 7.4, lip: 0.7,
  sP: 431.7,                                                                // the pylon: where the axis meets the Petrovsky shore (nearest to the platform steps w641971739 (-4817, -2770))
  prof: [[0, 0.05], [24, 1.2], [56, 4.8], [84, 6.6], [120, 8.0], [200, 10.9], [300, 14.6], [380, 17.5], [431.7, 18.6], [480, 18.9], [540, 18.4], [586, 17.4], [650, 14.8], [742, 10.8], [828, 6.8], [872, 3.4], [917.1, 0.05]],
  osm: ['w409159831', 'w409159832', 'w758386928', 'w589195047', 'w590176833', 'w641971736', 'w641971737', 'w641971739', 'w641971740'],
  pylonH: 25.5,                                                             // the top of the portals above the deck (44 m over the foot: 18.6 + 25.5 = 44.1)
};
export const betanRoute = () => makeRoute(leftOffset(A_NODES, BETAN.off), 4);

export function buildBetancourt(env) {
  const { ctx, P, M } = env, L = ctx.L, sp = BETAN, TM = ctx.mat.toon, waterY = env.waterY;
  const R = betanRoute(), { pts, S, tan, N } = R, yOf = profile(sp.prof);
  const conc = TM('#c6c8c3', { paint: 0.06, name: 'brg-betan-concrete' });                // pale concrete: piers, barriers
  const soff = TM('#6a7278', { paint: 0.05, name: 'brg-betan-soffit' });
  const pyl = TM('#a5aeb6', { paint: 0.05, name: 'brg-betan-pylon' });                      // the faceted grey cladding of the pylon legs
  const mats = { conc, fas: M.fasLazarev, soff, pave: M.footAsphalt, skirt: M.graniteGrey };
  const B = { id: sp.id, info: { rails: 0, colliders: 0 }, masts: [], anchors: [] };
  const sP = sp.sP, yP = yOf(sP);
  // half widths to the railing axis: full out in the middle, tapering to the carriageway + barrier at both ends (the street continues there), the observation platforms bulge round the pylon legs
  const bump = (s) => 1 - smooth((Math.abs(s - sP) - 4.6) / 4.0);
  const taper = (s) => smooth(Math.min(s, R.len - s) / 24);
  const hw = (full, plat) => (s) => sp.endHw + (full + plat * bump(s) - sp.endHw) * taper(s);
  const hwR = hw(sp.hwR, 3.0), hwL = hw(sp.hwL, 3.0), plans = planStairs(R, hwR, hwL, yOf);       // the two diagonal stairs of the platforms open the deck railing where they land
  const D = buildDeck(env, R, {
    gaps: plans.filter((p) => p.gap).map((p) => ({ sg: p.sg, sa: p.gap[0], sb: p.gap[1] })), y: yOf, hwR, hwL, med: sp.med, road: sp.road, lanes: sp.lanes, bar: sp.bar, barH: sp.barH, mats, girder: { depth: sp.depth, flat: sp.flat, lip: sp.lip },
    low: 2.6, rail: { kind: 'hpipes', hex: '#d6dadd' }, lamps: { every: 36, h: 11, from: 20, to: R.len - 14, skip: (s) => Math.abs(s - sP) < 8 },
  }, B);
  const Y = D.Y;
  // ------------------------------------------------------------------ piers: pale concrete tulips (a round stem flaring under the soffit), two per cross-section; never on a carriageway or inside a building;
  // over water they stand on the bed with a collar at the water line
  // the street network also holds the two one-way carriageways of THIS bridge (w409159831 / w409159832, claimed: the module draws them); their asphalt is the deck above, not ground under it: skip both, or every pier
  // position under the viaduct reads as "on a carriageway" and the whole land approach stands without supports (review 2026-10-15: 9 of 46 piers were built)
  const net = ctx.services.streets && ctx.services.streets.net, own = net && net.ways ? ['409159831', '409159832'].map((id) => net.ways.find((w) => String(w.id).replace(/^w/, '') === id)) : [];
  const cover = net && typeof net.cover === 'function' ? (x, z) => net.cover(x, z, { skip: own[0], skip2: own[1] }) : null;
  const wet = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z));
  const cols = [], tulip = (x, z, yTop, v, w) => {
    const soffV = yTop - sp.depth + (Math.abs(v) > sp.flat ? (Math.abs(v) - sp.flat) / (sp.hwR + 0.12 - sp.flat) * (sp.depth - sp.lip) : 0);
    const yb = w ? -4.7 : 0, yFlare = soffV - 2.6;
    P.cyl(conc, [x, yb, z], [x, yFlare, z], 0.95, 0.95, 12, false);
    P.cyl(conc, [x, yFlare, z], [x, soffV + 0.05, z], 0.95, 2.9, 12, true);
    if (w) P.cyl(conc, [x, -3.9, z], [x, -3.2, z], 1.35, 1.2, 12, true);               // the footing collar at the water line
    cols.push({ x, z, y1: yFlare + 0.5, w });
  };
  const pierS = [];
  for (let s = 44; s < 416; s += 28) pierS.push(s);                                      // the land approach on Petrovsky Island
  for (const s of [598, 632, 666, 700, 735, 770, 800, 830, 856, 882]) pierS.push(s);      // Serny Island, the south channel, Dekabristov Island
  const free = (p, w) => w || !((cover ? cover(p.x, p.z) > -1.9 : false) || L.insideBuilding(p.x, p.z, 1.4));   // road integrity: a column keeps 1.9 m off every asphalt edge
  for (const s of pierS) {
    if (yOf(s) < 3.2) continue;
    for (const side of [-1, 1]) {                                                          // the nearest free spot: along the axis first (3 m steps), then across (8.4 / 6.4 / 10.4 m from the axis)
      let done = false;
      for (const ds of [0, 3, -3, 6, -6, 9, -9, 12, -12]) { for (const av of [8.4, 6.4, 10.4]) { const p = R.pos(s + ds, side * av), w = wet(p.x, p.z); if (!free(p, w)) continue; tulip(p.x, p.z, yOf(s + ds), side * av, w); done = true; break; } if (done) break; }
    }
  }
  // ------------------------------------------------------------------ the pylon: two portals on the outer edges of the deck; each portal = two legs (the back leg curved) joined by seven ladder rungs
  const pylonFeet = [], wires = ctx.wires;
  const portal = (vC, sgn) => {
    const ya = yP + 0.35, top = yP + sp.pylonH, legs = [], tDeck = (yP + 0.4) / (top + 0.4);
    // the legs flare out at the foot like the photo bt08 (the back leg strongly, concave, the front one a little) and thicken toward the foundation; the foot keeps off every asphalt edge (road integrity)
    for (const [k, ds, dirS, flare0] of [[0, -3.7, -1, 3.4], [1, 3.7, 1, 1.4]]) {
      let flare = flare0;
      for (let g = 0; g < 8 && flare > 0; g++) { const f0 = R.pos(sP + ds + dirS * flare, vC); if (!(cover && cover(f0.x, f0.z) > -2.4)) break; flare = Math.max(0, flare - 0.5); }
      const bendOf = (t) => dirS * flare * Math.pow(1 - t, 2.4);
      const ring = (t) => {                                                         // t 0 (foot) .. 1 (top): the section centre (s, v) and its half sizes along / across the deck
        const y = -0.4 + (top + 0.4) * t, bend = bendOf(t), wS = 1.2 - 0.35 * t + 0.9 * Math.pow(1 - t, 3), wV = 0.85 - 0.2 * t + 0.35 * Math.pow(1 - t, 3);
        const c = R.pos(sP + ds + bend, vC), cs = [[-wS, -wV], [wS, -wV], [wS, wV], [-wS, wV]];
        return cs.map(([a, b]) => [c.x + c.tx * a - c.tz * b, y, c.z + c.tz * a + c.tx * b]);
      };
      const n = 14; let prev = ring(0);
      for (let i = 1; i <= n; i++) {
        const cur = ring(i / n);
        for (let e = 0; e < 4; e++) { const e2 = (e + 1) % 4, mx = (prev[e][0] + prev[e2][0]) / 2 - (prev[0][0] + prev[2][0]) / 2, mz = (prev[e][2] + prev[e2][2]) / 2 - (prev[0][2] + prev[2][2]) / 2; P.quad(pyl, prev[e], prev[e2], cur[e2], cur[e], [mx, 0, mz]); }
        prev = cur;
      }
      P.quad(pyl, prev[0], prev[1], prev[2], prev[3], [0, 1, 0]);
      const c0 = R.pos(sP + ds + bendOf(0), vC), cd = R.pos(sP + ds + bendOf(tDeck), vC); legs.push({ x: c0.x, z: c0.z, ds }); pylonFeet.push({ x: c0.x, z: c0.z, xd: cd.x, zd: cd.z, tx: cd.tx, tz: cd.tz });
      void ya; void k;
    }
    // the seven ladder rungs: flat plates between the legs (0.45 m deep, 1.7 m across), tilted a little like the photos
    const pr = (c, v, y) => [c.x - c.tz * v, y, c.z + c.tx * v], dn = (p) => [p[0], p[1] - 0.45, p[2]];
    for (let r = 0; r < 7; r++) {
      const y = yP + 9.2 + r * 2.35, a = R.pos(sP - 2.5, vC), b = R.pos(sP + 2.5, vC), hv = 0.85;
      const A0 = pr(a, -hv, y), A1 = pr(a, hv, y), B0 = pr(b, -hv, y + 0.18), B1 = pr(b, hv, y + 0.18);
      P.quad(pyl, A0, B0, B1, A1, [0, 1, 0]); P.quad(pyl, dn(A1), dn(B1), dn(B0), dn(A0), [0, -1, 0]);
      P.quad(pyl, A0, A1, dn(A1), dn(A0), [-a.tx, 0, -a.tz]); P.quad(pyl, B1, B0, dn(B0), dn(B1), [b.tx, 0, b.tz]);
      P.quad(pyl, A1, B1, dn(B1), dn(A1), [-a.tz, 0, a.tx]); P.quad(pyl, B0, A0, dn(A0), dn(B0), [a.tz, 0, -a.tx]);
    }
    // the stays: 16 to the south (main span, 32 - 99 m from the pylon) and 8 to the north (back span), white strands from the legs to the outer edge of the deck
    const vEdge = vC > 0 ? sp.hwR + 0.2 : -(sp.hwL + 0.2);                          // the anchors sit on the girder lip OUTSIDE the railing (they stood 0.6 m inside it, in the walker's way: a pedestrian walked through the fat white strand)
    for (let i = 0; i < 16; i++) {
      const sA = sP + 31.7 + i * (99.3 - 31.7) / 15, aY = yOf(sA) + 0.35, att = R.pos(sP + 3.7, vC), at = R.pos(sA, vEdge), yy = yP + 11.5 + 1.0 * i;
      wires.add([[att.x, yy, att.z], [at.x, aY, at.z]], { width: 0.2, color: '#f1f1ee' });
    }
    for (let i = 0; i < 8; i++) {
      const sA = sP - 31.7 - i * 4.2, aY = yOf(sA) + 0.35, att = R.pos(sP - 3.7, vC), at = R.pos(sA, vEdge), yy = yP + 12.5 + 1.35 * i;
      wires.add([[att.x, yy, att.z], [at.x, aY, at.z]], { width: 0.2, color: '#f1f1ee' });
    }
    // the stay anchors: small grey blocks on the edge of the deck (every stay)
    return legs;
  };
  const portals = [portal(sp.hwR - 1.4, 1), portal(-(sp.hwL - 1.4), -1)];
  // the pylon feet: a plinth into the bed, so the legs stand on something at the shore
  for (const f of pylonFeet) P.cyl(conc, [f.x, -4.7, f.z], [f.x, 0.3, f.z], 2.3, 2.1, 12, true);
  // (n4spb: no shore wall under the deck, see the header)
  // the two long diagonal stairs from the pylon platforms to the ground (OSM w641971739 / w641971740, photo bt08): walkable, the deck railing is open exactly where they land
  const stairs = drawStairs(env, plans, { mats: { tread: conc, band: pyl, rail: TM('#d6dadd', { paint: 0.04, name: 'brg-betan-rail' }), col: conc }, wet }, B);
  // ------------------------------------------------------------------ list / services
  const mid = R.pos(sP, sp.hwR - 4);
  B.x = mid.x; B.z = mid.z; B.at = [mid.x, mid.z]; B.yDeck = yOf; B.bounds = D.bounds; B.deckAt = D.deckAt; B.route = R;
  for (const q of [0.1, 0.3, 0.5, 0.7, 0.9]) { const p = R.pos(R.len * q, 0); B.anchors.push({ x: p.x, z: p.z }); }
  B.info.buckets = P.b.size; B.info.tris = P.tris; B.info.stays = 48; B.info.piers = cols.length; B.info.lamps = D.lampPts.length;
  if (ctx.services) ctx.services.betancourt = { info: B.info, spec: sp, route: R };
  B.colliders = () => {
    const ph = ctx.physics; D.colliders(ph); stairs.colliders(ph, env.rails);
    for (const c of cols) { ph.addCylinder(c.x, c.z, 1.05, -6, c.y1); B.info.colliders++; }
    for (const f of pylonFeet) { ph.addCylinder(f.x, f.z, 2.1, -6, 4.5); ph.addBox(f.xd, f.zd, 2.6, 1.9, -Math.atan2(f.tz, f.tx), -6, yP + sp.pylonH); B.info.colliders += 2; }
  };
  void clamp; void waterY; void tan; void S; void N; void pts; void portals;
  return B;
}
