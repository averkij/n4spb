// bridges/kamenny.js - the bridges of Kamenny Island (docs/research/kamenny-bridges.md, task "bridges-kamenny" of the islands round 2): the Kamennoostrovsky Bridge over the Malaya Nevka (Kamenny - Aptekarsky),
// the Ushakovsky Bridge over the Bolshaya Nevka (Kamenny - Primorsky) and the twelve small canal / pond bridges of the Tikhy Otdykh park, the Bolshoy and Maly canals.
//   spec data       bridges/kamenny/spec.js (BIG, SMALL; frames measured from the OSM ways and the environment's water edge), claims bridges/kamenny/groups.js (imported by bridges/groups.js)
//   big bridges     bridges/kamenny/big.js (a cousin of long.js buildLong: the deck runs over the land stubs of the claimed OSM ways, tram rails, arcades, tower piers, columns, obelisks)
//   small bridges   bridges/kamenny/small.js (flat slab decks of surface strips, railing panels, pile rows, park lamps)
//   pieces          bridges/kamenny/pieces.js (lamp standards, the Ushakovsky column with its bronze trophy)
// Called once from bridges.js (one load line + one try block): buildKamenny({ ctx, M, rails, Parts, waterY (ww -> y), zones }) -> [{ id, name, nameEn, P, B }], the caller colliders / flushes / lists them like
// every other bridge.  Every bridge here is walkable bank to bank; the road bridges (Kamennoostrovsky, Ushakovsky, 9th / 11th / 14th / 19th / 20th and the service bridges) are asphalt and let the red car cross
// (deckY answers over the whole deck); NO flags / flagpoles, no alarm sounds (user rules).
import { BIG, SMALL } from './kamenny/spec.js';
import { makeKamMats } from './kamenny/mats.js';
import { buildBig } from './kamenny/big.js';
import { buildSmall } from './kamenny/small.js';

export { BIG, SMALL };
export function buildKamenny(env) {
  const { ctx, M, rails, Parts, waterY, zones } = env, K = makeKamMats(ctx, M), out = [];
  for (const sp of BIG) {
    const P = new Parts(), B = buildBig({ ctx, P, M, rails, waterY: waterY(sp.ww), zones }, sp, K);
    out.push({ id: sp.id, name: sp.name, nameEn: sp.nameEn, P, B });
  }
  for (const sp of SMALL) {
    const P = new Parts(), B = buildSmall({ ctx, P, M, rails, waterY: waterY('neva'), zones }, sp, K);
    out.push({ id: sp.id, name: sp.name, nameEn: sp.nameEn, P, B });
  }
  return out;
}
