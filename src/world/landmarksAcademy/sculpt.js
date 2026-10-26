// landmarksAcademy/sculpt.js - the statues ON the Academy building and in its court, built with the shared figure kit (lib/figures.js, docs/FIGURES.md); docs/research/academy.md 3.2, 3.6.
//   frontStatues()  HERCULES (the Farnese Hercules, 2.6 m, nude, leaning on the club with the lion skin) and FLORA (the Farnese Flora, 2.6 m, draped, a flower garland) in marble, standing on 0.3 m plinths
//                   on the balcony slab at u = -1.2 +- 3.9 (the outer intercolumniations), against the wall at v 61.0, facing the Neva; Prokofiev's copies.
//   minerva()       the bronze group "Минерва, коронующая искусства и науки" on the lantern of the dome (2003): MINERVA seated in a crested helmet and drapery, the laurel wreath in the raised right hand,
//                   a tablet in the left, THREE putti at her feet (compass, palette + mallet, one behind): gilded bronze `#a8793a`; total height 3.8 m on a round plinth.
//   shuvalov()      the monument to Count I. I. Shuvalov in the round court (Z. Tsereteli 2003): the seated figure 3.1 m on a bench, bronze.
// Figures face +z, stand on y = 0, +x is the figure's LEFT; placed in the academy frame (+z = toward the Neva).
import { human, extend, cached, figureMats, Sculpt, V } from '../lib/figures.js';
import { ACAD } from './frame.js';

const cap = (S, key, c, r, o = {}) => S.blob(key, c, r, { w: 8, h: 6, ...o });

/** Hercules: nude athlete, weight on the right leg, the left forearm on the club, the right arm behind the back */
const herculesFig = () => cached('lmacade-hercules', () => extend(human({
  detail: 0.8, body: { muscle: 1.0, bulk: 1.18, shoulders: 1.12 },
  pose: {
    pelvisRot: [0, -0.1, 0.08], spine: [0.03, 0.12, -0.08], head: [0.16, 0.3, 0],
    legs: { L: { foot: [0.2, 0, 0.1], yaw: 0.35, pole: [0.2, 0, 1] }, R: { foot: [-0.12, 0, -0.04], yaw: -0.2, pole: [-0.1, 0, 1] } },
    arms: { L: { hand: [0.3, 1.0, 0.12], pole: [1, -0.2, -0.6], grip: 'fist', palm: [0, 0, 1] }, R: { hand: [-0.13, 0.9, -0.2], pole: [-0.6, -0.5, -0.8], grip: 'hold', palm: [0, 0, 1] } },
  },
  outfit: { torso: 'nude' }, face: { age: 0.6, hair: 'curly', beard: 'full', mouth: 'stern', brow: 1.0, jaw: 1.1, seed: 4 },
}), (S, info) => {
  const J = info.j, hold = J.hands.L.hold || J.wristL;
  // the club: a thick tapering shaft from the ground to above the fist, the lion skin draped over its head
  S.tube('main', [[0.36, 0.0, 0.14], [0.35, 0.5, 0.13], [0.33, 0.95, 0.12], [0.3, 1.1, 0.11]], [[0.075, 0.075], [0.085, 0.085], [0.1, 0.1], [0.115, 0.115]], { seg: 10, per: 4 });
  S.tube('main', [[0.31, 1.09, 0.13], [0.34, 0.9, 0.2], [0.4, 0.6, 0.2], [0.38, 0.28, 0.16]], [[0.07, 0.17], [0.1, 0.2], [0.09, 0.22], [0.07, 0.2]], { seg: 10, per: 4, cap: false });
  S.blob('main', [0.28, 1.14, 0.1], [0.11, 0.08, 0.11], { w: 8, h: 6 });
  void hold;
}));
/** Flora: a draped standing woman with a garland of flowers */
const floraFig = () => cached('lmacade-flora', () => human({
  detail: 0.8, body: { sex: 'f', muscle: 0.1, bulk: 1.0 },
  pose: {
    pelvisRot: [0, 0.1, -0.05], spine: [0.0, -0.1, 0.05], head: [0.08, -0.25, 0],
    legs: { L: { foot: [0.1, 0, 0.0], yaw: 0.15, pole: [0.1, 0, 1] }, R: { foot: [-0.12, 0, -0.1], yaw: -0.15, pole: [-0.1, 0, 1] } },
    arms: { R: { hand: [-0.2, 0.98, 0.17], pole: [-0.5, -0.4, -0.7], grip: 'cup', palm: [0, 1, 0.2] }, L: { hand: [0.2, 1.12, 0.22], pole: [0.8, -0.2, -0.5], grip: 'relaxed', palm: [0, 0.3, 1] } },
  },
  outfit: { torso: 'dress', hem: 0.95, flare: 0.25, folds: 0.07, cape: 'back', capeLen: 0.55 }, face: { age: 0.15, hair: 'long', mouth: 'smile', seed: 6 },
}));

export function frontStatues(K, { CU }) {
  const { ctx, P, M } = K, fm = figureMats(ctx), mk = { main: M.marble, dark: fm.dark, accent: M.marble };
  const y = 7.0 + 0.3;
  for (const [u, fig, nm] of [[CU - 3.9, herculesFig(), 'hercules'], [CU + 3.9, floraFig(), 'flora']]) {
    P.box(M.marble, u - 0.7, u + 0.7, 7.0, y, 60.5, 61.7, 'b', 1);                                    // the plinth
    fig.place(P, mk, u, y, 61.6, 0, 1.6);
    K.extraTris = (K.extraTris || 0) + 0;
    void nm;
  }
}

// ---------------------------------------------------------------------------------------------------- Minerva
const minervaFig = () => cached('lmacade-minerva', () => extend(human({
  detail: 0.75, body: { sex: 'f', muscle: 0.15, bulk: 1.05 },
  pose: {
    pelvis: [0, 0.5, 0], pelvisRot: [0.03, 0, 0], spine: [-0.06, 0, 0], head: [-0.04, 0.08, 0],
    legs: { L: { foot: [0.14, 0, 0.42], yaw: 0.1, pole: [0.1, 0.1, 1] }, R: { foot: [-0.14, 0, 0.34], yaw: -0.1, pole: [-0.1, 0.1, 1] } },
    arms: { R: { hand: [-0.31, 1.28, 0.2], pole: [-0.8, 0.3, -0.3], grip: 'hold', palm: [0, 0.5, 0.8] }, L: { hand: [0.22, 0.74, 0.34], pole: [0.8, -0.2, -0.3], grip: 'hold', palm: [0, 1, 0] } },
  },
  outfit: { torso: 'dress', hem: 0.5, flare: 0.65, folds: 0.07, cape: 'mantle', capeLen: 0.5, hat: 'roman', hatKey: 'accent' },
  face: { age: 0.2, hair: 'none', mouth: 'stern', brow: 0.8, seed: 12 },
}), (S, info) => {
  const J = info.j;
  // the laurel wreath in the raised right hand (a ring of leaves) and the tablet in the left
  const h = J.wristR, ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([h[0] - 0.04 + Math.cos(a) * 0.1, h[1] + 0.12 + Math.sin(a) * 0.1, h[2] + 0.05]); }
  S.tube('accent', ring, [[0.014, 0.014]], { closed: true, seg: 5, per: 1, rings: 12 });
  const w = J.wristL; S.sheet('accent', [[w[0] - 0.12, w[1] + 0.02, w[2] + 0.1], [w[0] + 0.12, w[1] + 0.04, w[2] + 0.1], [w[0] + 0.12, w[1] + 0.2, w[2] + 0.02], [w[0] - 0.12, w[1] + 0.18, w[2] + 0.02]], 0.012);
  // the aegis: a scaled breastplate and a small Gorgon disc
  S.blob('accent', [0, 1.0, 0.115], [0.06, 0.06, 0.02], { dir: [0, 0, 1], w: 8, h: 6 });
}));
const puttoFig = (key, pose) => cached('lmacade-putto-' + key, () => human({
  detail: 0.5, body: { muscle: 0.0, bulk: 1.5, shoulders: 1.0 }, pose, outfit: { torso: 'nude' }, face: { age: 0.0, hair: 'curly', mouth: 'smile', seed: 20 },
}));

export function minerva(K, cu, y, cv) {
  const { ctx, P, M } = K, fm = figureMats(ctx), mk = { main: M.bronze, dark: fm.dark, accent: M.gold };
  const S = 2.4;
  // review-academy 2026-10-08: the 2.6 x 2.4 m gilt BOX under the figure read as a cube from the front (ac_115 shows a thin round bronze plate and the drapery falling over a small seat): a thin
  // round plate (r 2.0) on the lantern, a seat block that the drapery covers (1.9 x 1.7 m), the putti on the plate beside it
  P.cyl(M.bronze, [cu, y - 0.02, cv], [cu, y + 0.12, cv], 2.0, 2.04, 32, true);
  P.cyl(M.bronze, [cu, y + 0.12, cv], [cu, y + 0.2, cv], 2.04, 1.9, 32, true);
  P.box(M.bronze, cu - 0.95, cu + 0.95, y + 0.2, y + 0.58, cv - 0.8, cv + 0.9, 'b', 1);                     // the seat block under the drapery
  minervaFig().place(P, mk, cu, y + 0.04, cv, 0, S);
  // the three putti: left with a compass (standing), right with a palette and a mallet (sitting), one behind
  const standing = { pelvis: [0, 0.9, 0], legs: { L: { foot: [0.07, 0, 0.02] }, R: { foot: [-0.07, 0, -0.02] } }, arms: { R: { hand: [-0.25, 0.72, 0.1], pole: [-0.5, -0.3, -0.7], grip: 'hold' }, L: { hand: [0.24, 1.0, 0.12], pole: [0.6, -0.2, -0.6], grip: 'hold' } } };
  const sitting = { pelvis: [0, 0.5, 0], legs: { L: { foot: [0.1, 0, 0.36], pole: [0.1, 0.1, 1] }, R: { foot: [-0.1, 0, 0.3], pole: [-0.1, 0.1, 1] } }, arms: { R: { hand: [-0.2, 0.6, 0.3], grip: 'hold' }, L: { hand: [0.18, 0.62, 0.28], grip: 'hold' } } };
  puttoFig('stand', standing).place(P, mk, cu + 1.25, y + 0.2, cv + 0.95, -0.5, 0.62);
  puttoFig('sit', sitting).place(P, mk, cu - 1.25, y + 0.2, cv + 0.85, 0.5, 0.62);
  puttoFig('back', standing).place(P, mk, cu - 0.9, y + 0.2, cv - 0.85, 3.4, 0.55);
}

// ---------------------------------------------------------------------------------------------------- Shuvalov (round court)
const shuvalovFig = () => cached('lmacade-shuvalov', () => human({
  detail: 0.7, body: { muscle: 0.2, bulk: 1.1 },
  pose: {
    pelvis: [0, 0.5, 0], pelvisRot: [0.02, 0.1, 0], spine: [0.02, 0, 0], head: [0.05, 0.15, 0],
    legs: { L: { foot: [0.15, 0, 0.45], yaw: 0.15, pole: [0.1, 0.1, 1] }, R: { foot: [-0.15, 0, 0.35], yaw: -0.15, pole: [-0.1, 0.1, 1] } },
    arms: { R: { hand: [-0.25, 0.66, 0.34], pole: [-0.7, -0.3, -0.5], grip: 'relaxed', palm: [0, 1, 0] }, L: { hand: [0.28, 0.7, 0.3], pole: [0.8, -0.2, -0.4], grip: 'hold', palm: [0, 1, 0] } },
  },
  outfit: { torso: 'coat', hem: 0.62, flare: 0.3, folds: 0.05, sleeves: 'long', trousers: 'breeches', boots: 0.2, collar: 'fall', buttons: true, cape: 'back', capeLen: 0.5, hat: 'none' },
  face: { age: 0.55, hair: 'wig', mouth: 'closed', seed: 31 },
}));
export function shuvalov(K, u, v) {
  const { ctx, P, M } = K, fm = figureMats(ctx), mk = { main: M.bronzeMon || M.bronzeDark, dark: fm.dark, accent: M.gold };
  const y = 0.62;
  P.box(M.bronzeDark, u - 1.0, u + 1.0, y, y + 0.55, v - 0.55, v + 0.8, 'b', 1);                              // the bench
  shuvalovFig().place(P, mk, u, y, v, 0, 1.78);
}
