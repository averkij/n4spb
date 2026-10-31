// bridges/yelaginMain.js - the 1st (steel, Kamenny side) and the 3rd (mint-green, Primorsky side) Yelagin bridges: the road bridges of the park (group "bridges-yelagin-main", dossier docs/research/bridges-yelagin-main.md).
//   1st  1-й Елагин мост  over the Srednyaya Nevka, 107.9 m, 11.5 m between the railings, nine spans with a single-leaf lift span, white steel truss piers, white rod railing with diamond medallions   -> yelaginMain/first.js
//   3rd  3-й Елагин мост  over the Bolshaya Nevka, 96.1 m, 12.6 m, three spans on granite piers with ice-breakers, haunched cream beams, mint-green railing with tumbas, five-globe candelabra         -> yelaginMain/third.js
//   (the 2nd Yelagin Bridge is bridges/yelagin.js and is not touched here.)  Both are ROAD bridges: the red car crosses them (deckY answers over the whole deck); the pond footbridges belong to bridges-yelagin-ponds.
// Hook: bridges.js loads this file and calls buildYelaginMain(env, sp) for every record of SPECS (one Parts collector each); the claim rows are in bridges/groups.js (keys yelagin1 / yelagin3).
import { buildFirst, Y1 } from './yelaginMain/first.js';
import { buildThird, Y3 } from './yelaginMain/third.js';

export { Y1, Y3 };
export const SPECS = [Y1, Y3];
export function buildYelaginMain(env, sp) {
  const t0 = performance.now(), B = sp.id === Y1.id ? buildFirst(env, sp) : buildThird(env, sp);
  B.info.ms = +(performance.now() - t0).toFixed(1);                     // build time of this bridge (ms), read by tools/bridges-yelagin-main-test.mjs / check
  return B;
}
