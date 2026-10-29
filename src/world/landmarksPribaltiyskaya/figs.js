// landmarksPribaltiyskaya/figs.js - the bronze figures of the module, built with the shared figure kit (lib/figures.js, docs/FIGURES.md); every figure faces +z, stands on y = 0, +x is its LEFT, unit height 1.75 m.
//   peterFig()      PETER I (Z. K. Tsereteli, 2006): bare-headed, long curls to the shoulders, a knee-length buttoned coat (kaftan) with a flared skirt, belt, wide turned cuffs, an order star, jabot, breeches and
//                   high boots; the LEFT hand rests on the hilt of the sword that hangs along the left leg, the RIGHT hand holds the rolled top of the decree scroll (the scroll itself is drawn by peter.js with
//                   its text).  Dossier docs/research/pribaltiyskaya.md section 6 [C11] (photos n11 16 40 41 42 43); placed at scale ~2.65 (4.65 m + the 0.15 m bronze plinth = 4.8 m).
//   creatorsFigs()  the two nude bronze men of Agayan's "Создатели флота России" (the ship-bearer on the viewer's left, the cup-bearer on the right), rising from the wave; creatorsWave() the swirled wave, the ship and the cup.
//   nakhimovFig()   ADMIRAL NAKHIMOV (G. V. Lukyanov, 2012): forage cap with a small peak, epaulettes, a knee-length double-breasted frock coat, the spyglass held diagonally across the chest in both hands, the sabre
//                   at the left hip (dossier section 9.2, photo cw_nakh_268028); 3.6 m: scale 2.06.
import { human, extend, cached, Sculpt, V } from '../lib/figures.js';

// ------------------------------------------------------------------------------------------------ Peter I
export const peterFig = () => cached('lmprib-peter', () => extend(human({
  detail: 1.0, body: { muscle: 0.3, bulk: 1.05, shoulders: 1.05 },
  pose: {
    pelvis: [0, 0.955, 0], pelvisRot: [0, 0.07, -0.04], spine: [0, -0.05, 0.04], head: [-0.06, 0.02, 0.0],
    legs: { L: { foot: [0.115, 0, -0.01], yaw: 0.14, pole: [0.05, 0, 1] }, R: { foot: [-0.12, 0, 0.12], yaw: -0.17, pole: [-0.05, 0, 1] } },
    arms: {
      L: { hand: [0.30, 0.94, 0.075], pole: [1, -0.1, -0.8], grip: 'hold', palm: [0.1, 0.3, 1] },
      R: { hand: [-0.315, 0.86, 0.115], pole: [-0.6, -0.4, -0.6], grip: 'fist', palm: [0.3, 0.1, 0.9] },
    },
  },
  outfit: { torso: 'coat', hem: 0.64, flare: 0.3, folds: 0.05, open: 0.25, sleeves: 'long', trousers: 'breeches', boots: 0.5, collar: 'fall', buttons: true, belt: true, medals: 1 },
  face: { age: 0.5, hair: 'long', mouth: 'stern', brow: 0.9, jaw: 1.0, seed: 61 },
}), (S, info) => {
  const J = info.j, hold = J.hands.L.hold;
  // the sword: the grip + a knuckle bow in the left hand, the straight scabbard down the left thigh to just above the boot toe
  S.tube('accent', [[hold[0] - 0.005, hold[1] - 0.035, hold[2] - 0.01], [hold[0] + 0.01, hold[1] + 0.085, hold[2] + 0.0]], [[0.016, 0.016], [0.012, 0.012]], { seg: 6, per: 2 });
  S.blob('accent', [hold[0] + 0.012, hold[1] + 0.1, hold[2] + 0.0], [0.024, 0.024, 0.024], { w: 8, h: 6 });
  S.tube('accent', [[hold[0] - 0.05, hold[1] - 0.045, hold[2] + 0.02], [hold[0] + 0.045, hold[1] - 0.045, hold[2] - 0.03]], [[0.008, 0.008]], { seg: 5, per: 2 });
  S.tube('accent', [[hold[0] - 0.01, hold[1] - 0.05, hold[2] - 0.02], [0.255, 0.7, -0.06], [0.235, 0.35, -0.115], [0.215, 0.08, -0.17]], [[0.021, 0.014], [0.021, 0.014], [0.018, 0.012], [0.012, 0.008]], { seg: 8, per: 4 });
  // the order star on the left chest and the jabot ruffle
  const ch = J.chest, fw = J.chestFrame.fwd;
  S.blob('accent', [ch[0] + 0.07, ch[1] + 0.1, ch[2] + 0.125], [0.03, 0.03, 0.01], { dir: fw, w: 8, h: 4 });
  S.blob('accent', [0, J.neckBase[1] - 0.04, J.neckBase[2] + 0.12], [0.05, 0.045, 0.035], { dir: [0, -0.2, 1], w: 8, h: 6 });
  // the wide turned cuffs (a flared ring at each wrist)
  for (const nm of ['L', 'R']) { const w = J['wrist' + nm], e = J['elbow' + nm]; S.blobBetween('main', V.add(w, V.mul(V.unit(V.sub(e, w)), 0.035)), V.add(w, V.mul(V.unit(V.sub(e, w)), 0.1)), 0.05, 0.062); }
}));

// ------------------------------------------------------------------------------------------------ the Creators of the Fleet (the two figures are built apart, the wave carries the ship and the cup)
const nude = (key, seed, pose, face = {}) => cached(key, () => human({ detail: 0.85, body: { muscle: 0.9, bulk: 1.05, shoulders: 1.08 }, pose, outfit: { torso: 'nude' }, face: { age: 0.3, hair: 'short', mouth: 'stern', brow: 0.85, jaw: 0.95, seed, ...face } }));
/** index 0: the SHIP-bearer (the figure at the viewer's left = frame -x), index 1: the CUP-bearer (right = frame +x).  Photo 24: both swim / recline OUTWARD (placed rolled by about 52 deg by creators.js): the head thrown back,
 *  the inner arm raised toward the middle, the outer arm stretched out holding the ship / the cup, the legs trailing into the wave. */
export const creatorsFigs = () => [
  nude('lmprib-cr0', 31, {
    pelvis: [0, 0.8, 0], pelvisRot: [0.28, 0.3, 0.0], spine: [-0.18, 0.18, 0.05], head: [-0.3, 0.3, 0.12],
    legs: { L: { foot: [0.1, 0.12, -0.2], yaw: 0.2, pole: [0.2, 0.4, 1] }, R: { foot: [-0.12, 0.0, 0.3], yaw: -0.3, pole: [-0.1, 0.3, 1] } },
    arms: { L: { hand: [0.38, 1.8, 0.08], pole: [0.5, 0.3, -0.6], grip: 'open', palm: [0, 0.3, 1] }, R: { hand: [-0.78, 1.42, 0.16], pole: [-0.2, -0.8, -0.5], grip: 'hold', palm: [0, 1, 0.1] } },
  }),
  nude('lmprib-cr1', 47, {
    pelvis: [0, 0.8, 0], pelvisRot: [0.28, -0.3, 0.0], spine: [-0.18, -0.18, -0.05], head: [-0.3, -0.3, -0.12],
    legs: { L: { foot: [0.12, 0.0, 0.3], yaw: 0.3, pole: [0.1, 0.3, 1] }, R: { foot: [-0.1, 0.12, -0.2], yaw: -0.2, pole: [-0.2, 0.4, 1] } },
    arms: { R: { hand: [-0.38, 1.8, 0.08], pole: [-0.5, 0.3, -0.6], grip: 'open', palm: [0, 0.3, 1] }, L: { hand: [0.78, 1.42, 0.16], pole: [0.2, -0.8, -0.5], grip: 'cup', palm: [0, 1, 0.1] } },
  }),
];
/** the swirled wave 3.2 m wide: a flat foam base, a big spiral curl facing the plaza in the middle and two flowing ridges under the figures (group frame, metres) */
export const creatorsWave = () => cached('lmprib-wave', () => {
  const S = new Sculpt({ detail: 1 });
  S.blob('main', [0, 0.2, 0.1], [1.5, 0.22, 0.75], { w: 14, h: 8 });
  const sp = []; for (let i = 0; i <= 12; i++) { const ph = i / 12 * Math.PI * 1.65 + 0.4, r = 0.66 * (1 - 0.5 * i / 12); sp.push([r * Math.cos(ph) * 1.05, 0.98 + r * Math.sin(ph), 0.12 + 0.03 * i]); }
  S.tube('main', sp, sp.map((_, i) => { const w = 0.26 - 0.15 * i / 12; return [w, w * 0.9]; }), { seg: 14, per: 4, bump: (t, th) => 1 + 0.07 * Math.sin(11 * t + th * 3) });
  for (const sg of [-1, 1]) {
    S.tube('main', [[sg * 0.1, 0.5, 0.15], [sg * 0.65, 0.55, 0.25], [sg * 1.15, 0.62, 0.18], [sg * 1.55, 0.5, 0.0]], [[0.32, 0.27], [0.28, 0.24], [0.22, 0.2], [0.14, 0.12]], { seg: 12, per: 5, bump: (t, th) => 1 + 0.09 * Math.sin(8 * t + th * 2 + sg) });
    for (let i = 0; i < 4; i++) S.blob('main', [sg * (0.35 + i * 0.32), 0.78 + 0.1 * Math.sin(i * 1.7), 0.42 - 0.05 * i], [0.17, 0.13, 0.15], { w: 8, h: 6 });
  }
  return S.finish({});
});
export const creatorsShip = () => cached('lmprib-ship', () => {
  const S = new Sculpt({ detail: 1 });
  S.tube('main', [[0, 0, -0.3], [0, 0.0, 0.0], [0, 0.04, 0.28]], [[0.03, 0.03], [0.05, 0.045], [0.02, 0.03]], { seg: 6, per: 3 });
  for (const z of [-0.14, 0.02, 0.17]) { S.tube('main', [[0, 0.03, z], [0, 0.34, z]], [[0.006, 0.006]], { seg: 4, per: 2 }); S.blob('main', [0, 0.2, z + 0.02], [0.1, 0.12, 0.012], { w: 6, h: 4 }); }
  return S.finish({});
});
export const creatorsCup = () => cached('lmprib-cup', () => {
  const S = new Sculpt({ detail: 1 });
  S.tube('main', [[0, 0, 0], [0, 0.07, 0], [0, 0.13, 0], [0, 0.2, 0]], [[0.02, 0.02], [0.012, 0.012], [0.05, 0.05], [0.06, 0.06]], { seg: 10, per: 3 });
  return S.finish({});
});

// ------------------------------------------------------------------------------------------------ Admiral Nakhimov
export const nakhimovFig = () => cached('lmprib-nakhimov', () => extend(human({
  detail: 1.0, body: { muscle: 0.25, bulk: 1.05, shoulders: 1.06 },
  pose: {
    pelvis: [0, 0.955, 0], pelvisRot: [0, 0.08, -0.03], spine: [0, -0.06, 0.03], head: [-0.05, 0.1, 0],
    legs: { L: { foot: [0.1, 0, 0.1], yaw: 0.12, pole: [0.05, 0, 1] }, R: { foot: [-0.11, 0, -0.04], yaw: -0.15, pole: [-0.05, 0, 1] } },
    arms: { R: { hand: [-0.075, 1.2, 0.2], pole: [-0.6, -0.5, -0.5], grip: 'fist', palm: [0.6, 0.2, 0.7] }, L: { hand: [0.085, 1.31, 0.205], pole: [0.7, -0.4, -0.6], grip: 'fist', palm: [-0.6, 0.2, 0.7] } },
  },
  outfit: { torso: 'coat', hem: 0.5, flare: 0.1, folds: 0.03, open: 0.12, sleeves: 'long', trousers: 'long', boots: 0.12, collar: 'stand', buttons: true, epaulettes: true, belt: false },
  face: { age: 0.6, hair: 'short', beard: 'sideburns', mouth: 'stern', brow: 0.9, jaw: 1.0, seed: 77 },
}), (S, info) => {
  const J = info.j, H = J.head, put = (a, b, c) => V.add(V.add(V.add(H.c, V.mul(H.x, a)), V.mul(H.y, b)), V.mul(H.z, c));
  // the forage cap: a flattened round crown, a band and a small flat peak
  S.blob('main', put(0, 0.088, 0.0), [0.128, 0.05, 0.128], { w: 14, h: 8 });
  S.tube('accent', [put(0.118, 0.052, 0.0), put(0, 0.052, 0.118), put(-0.118, 0.052, 0.0), put(0, 0.052, -0.118)], [[0.014, 0.014]], { closed: true, seg: 6, rings: 20, ref: H.y });
  S.blob('main', put(0, 0.046, 0.124), [0.075, 0.009, 0.05], { dir: V.mul(H.z, 1), w: 8, h: 4 });
  // the spyglass across the chest, both fists on it
  const r = J.hands.R.hold, l = J.hands.L.hold;
  S.tube('accent', [V.add(r, [-0.06, -0.08, -0.01]), V.lerp(r, l, 0.5), V.add(l, [0.08, 0.1, 0.01])], [[0.02, 0.02], [0.017, 0.017], [0.025, 0.025]], { seg: 8, per: 4 });
  // the sabre at the left hip: a hilt and the scabbard along the left thigh
  S.tube('accent', [[0.205, 0.97, 0.01], [0.235, 0.7, -0.05], [0.225, 0.35, -0.09], [0.205, 0.1, -0.14]], [[0.02, 0.014], [0.02, 0.014], [0.016, 0.012], [0.01, 0.007]], { seg: 8, per: 4 });
  S.tube('accent', [[0.2, 0.99, 0.0], [0.215, 1.07, 0.015]], [[0.014, 0.014]], { seg: 6, per: 2 });
}));
