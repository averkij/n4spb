// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/pits.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/pits.js - PURE DATA (imports only the pure-data sites-vo2.js; runs in node and in the page): the STAIR PITS of the bridges of Vasilievsky Island, third pass (docs/research/vo-bridges-wave3.md).
// The wide granite corner stairs of Nalichny and Korablestroiteley and the stairs beside the abutments of the 3rd / 4th Smolensky bridges (photos refs/bridges2 n01 n02 k01 m01 m08 m09) lead from the street down to the
// water.  The quay beside them is the water owner's, so each flight stands in a PIT that the bridges module hands over through the owner API of environment/owners.js (groups.js re-exports WATER_RINGS /
// KEEP_OUT / PAVED_RINGS from here): the ring counts as water, the generic quay opens at it (0.5 m round it keeps only its wall face) and bridges/stairs.js draws the flight, the landing, the cheek walls and the colliders.
// FRAME of a pit = the frame of its bridge (u along the road, v to the right, origin = the middle of the deck polygon, sites-vo2.js).  A pit lies LANDWARD of the bank line on one side of the deck, d = the distance
// from the bank line (d < 0 = over the water): the flight descends from the street (y 0.05 at d = Lr) to the landing and the lower steps at d 0 .. 1 over the river.  OSM places the steps at the same spots
// (w1161949776 etc.: |v| 41.1 .. 42.4 at Nalichny, 45.3 .. 47.5 at Korablestroiteley, v -26.7 .. -39.1 at the mouth bridges): the lateral centre of each pit is the centre line of those ways, moved sideways
// where the drain culvert sprite of the generic quay (3.3 m beyond the end of every bridge opening: environment/quay.js) would stand on the steps (Nalichny 41.5 -> 42.6, mouth bridges -31 -> -34 / -32.5 -> -34.5).
// [E] = estimate.  The flight is 4.4 m wide ("wide granite stairs"), 14 steps of 0.38 x 0.17 m (Nalichny / Korablestroiteley: the landing 1.07 m over the river; Smolenka -3.4, street 0.05), 17 steps to the berm
// level (-2.8) at the mouth bridges.
import { VO2_SITES } from './sites-vo2.js';

const deg = Math.PI / 180;
/** geometry constants shared by the drawing code (stairs.js) and the ring maths */
export const PIT = { hw: 2.2, cheek: 0.5, run: 0.38, runLow: 0.35, riseLow: 0.3, landing: 1.25, top: 0.05, bed: -3.9, hWater: 1.05, hLand: 0.75, over: 0.3, pave: 1.6 };

/** per bridge: lateral centres v of the pits (both banks each), the landing level, the number of lower steps, the materials of bridges/mats */
export const PIT_SPECS = {
  nalichny: { vc: [-42.6, 42.6], yLand: -2.33, low: 3, mat: 'graniteNal', par: 'parapetPink', osm: ['w1161949776', 'w1540847454', 'w1540847455', 'w1102801990'] },
  korablestroiteley: { vc: [-46.4, 46.4], yLand: -2.33, low: 3, mat: 'graniteKor', par: 'parapetPink', osm: ['w1102801992', 'w1161949783'] },
  smol3: { vc: [-34.0], yLand: -2.8, low: 1, mat: 'graniteGrey2', par: 'parapetGrey', osm: ['w1286773458', 'w1286773733'] },
  smol4: { vc: [-34.5], yLand: -2.8, low: 1, mat: 'graniteGrey2', par: 'parapetGrey', osm: ['w532906970', 'w533214696'] },
};

/** all pits: { id, site, bank (0 | 1), s (+1 / -1 = landward direction along u), uB (bank line u), vc, n (steps of the flight), rise, low, yLand, Lr (ring length landward), ring [[x, z] x 4], c [x, z], spec } */
export const STAIR_PITS = (() => {
  const out = [];
  for (const site of VO2_SITES) {
    const spec = PIT_SPECS[site.id]; if (!spec) continue;
    const T = (site.b - 90) * deg, c = Math.cos(T), sn = Math.sin(T), W = (u, v) => [site.cx + u * c - v * sn, site.cz + u * sn + v * c];
    for (const bank of [0, 1]) for (const vc of spec.vc) {
      const s = bank === 0 ? -1 : 1, uB = site.bank[bank];
      const n = Math.round((PIT.top - spec.yLand) / 0.17), rise = (PIT.top - spec.yLand) / n;
      const Lr = spec.low * PIT.runLow + PIT.landing + n * PIT.run;
      const d0 = -PIT.over, d1 = Lr, v0 = vc - PIT.hw, v1 = vc + PIT.hw;
      const ring = [[d0, v0], [d1, v0], [d1, v1], [d0, v1]].map(([d, v]) => W(uB + s * d, v).map((q) => Math.round(q * 100) / 100));
      const cw = W(uB + s * Lr / 2, vc);
      out.push({ id: `${site.id}-${bank ? 'n' : 's'}${vc < 0 ? '-' : '+'}`, site: site.id, bank, s, uB, vc, n, rise, low: spec.low, yLand: spec.yLand, Lr, ring, c: cw, spec });
    }
  }
  return out;
})();

/** [{ id, ring }] for environment/owners.js (the hole + water of each pit) */
export const WATER_RINGS = STAIR_PITS.map((p) => ({ id: p.id, key: 'smolenka', ring: p.ring }));
/** no generated descent / landing stage / boat near a flight (the mouth arms generate 2.2 m descents at the OSM steps) */
export const KEEP_OUT = STAIR_PITS.map((p) => ({ id: p.id, c: p.c, r: Math.round(p.Lr / 2 + 3.5) }));
/** the ground the flights pave themselves (claim mask: no trunks, hedges, beds or grass tufts): the pit + the threshold + 1.6 m round the cheeks */
export const PAVED_RINGS = STAIR_PITS.map((p) => {
  const site = VO2_SITES.find((q) => q.id === p.site), T = (site.b - 90) * deg, c = Math.cos(T), sn = Math.sin(T), W = (u, v) => [site.cx + u * c - v * sn, site.cz + u * sn + v * c];
  const e = PIT.hw + PIT.cheek + PIT.pave, d0 = -PIT.over, d1 = p.Lr + PIT.pave;
  return { id: p.id, ring: [[d0, p.vc - e], [d1, p.vc - e], [d1, p.vc + e], [d0, p.vc + e]].map(([d, v]) => W(p.uB + p.s * d, v).map((q) => Math.round(q * 100) / 100)) };
});
/** the OSM step ways that the flights replace (streets draws them as flat strips: claimed in groups.js) */
export const PIT_OSM = Object.fromEntries(Object.entries(PIT_SPECS).map(([k, v]) => [k, v.osm]));
