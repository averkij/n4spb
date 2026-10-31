// bridges/krestAptek2.js - the second group of the Krestovsky / Kamenny / Aptekarsky bridge round (docs/research/bridges-krestovsky-aptekarsky.md, 2026-10-14): what the first group (krestAptek.js: Maly Krestovsky,
// Bychy, Grebnoy, Kantemirovsky) left unclaimed in the region and what the environment still closed with an invisible fallback deck or left open:
//   yachtny      the Yachtny Bridge (krestAptek2/yachtny.js): 585 m curved bridge over the Bolshaya Nevka, V piers, pedestrian / cycle / special-vehicle deck, chunked in world coordinates
//   krestpond    the road bridge over the pond neck of the Primorsky Victory Park (krestAptek2/pond.js)
//   ka-boardwalks the wooden boardwalks of the shore parks (krestAptek2/boardwalk.js)
//   ka-slits     six shore slits beside the decks of older bridges (krestAptek2/patches.js): Barochny, Aptekarsky, Bolshoy Krestovsky, Lazarevsky
// Dry "bridges" of OSM that need nothing (no water under them in the baked data, checked with tools/bridges-krestovsky-aptekarsky-wet.mjs): the 2nd / 3rd Parkovy bridges, the rowing-canal service decks of
// west Krestovsky (w374782419 .. 26, w450133075 / 76, w863721005), the service decks w82407394 / w157177329 / w563563572, the footways w201078818 / w201078824 and the stair deck r20005823: they keep the
// environment's invisible fallback boxes (street level, harmless on dry ground) and the streets' flat roads.
import { buildYachtny, YA, YACHTNY_LIST } from './krestAptek2/yachtny.js';
import { buildPond, PB } from './krestAptek2/pond.js';
import { buildBoardwalks, BOARDWALKS } from './krestAptek2/boardwalk.js';
import { buildSlits, KA_SLITS } from './krestAptek2/patches.js';

function buildSlitBridge(env) {
  const out = buildSlits(env), B = { id: 'ka-slits', x: -3500, z: -3900, at: [-3907, -3820], info: { rails: 0, colliders: 0, slits: out.items.length }, masts: [] };
  B.colliders = () => { const ph = env.ctx.physics; for (const b of out.boxes) { ph.addBox(...b); B.info.colliders++; } };
  return B;
}
export const KA2_BRIDGES = [
  { id: PB.id, name: PB.name, nameEn: PB.nameEn, ww: PB.ww, waterY: PB.waterY, spec: PB, build: buildPond },
  YACHTNY_LIST,
  { id: 'ka-boardwalks', name: 'Деревянные променады Крестовского и Елагина острова', nameEn: 'Boardwalks of the Krestovsky / Yelagin shore parks', ww: 'neva', build: buildBoardwalks },
  { id: 'ka-slits', name: 'Береговые швы мостов Карповки и Малой Невки', nameEn: 'Shore slits beside the older bridges (Karpovka, Malaya Nevka)', ww: 'neva', build: buildSlitBridge },
];
/** straight-frame specs for tools/bridges-krestovsky-aptekarsky-bridge-test.mjs / -cams.mjs */
export const TEST_SPECS = [PB];
export const CAM_SPECS = [{ sp: PB, p: 'kp' }];
export { YA, PB, BOARDWALKS, KA_SLITS };
