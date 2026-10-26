// landmarksAcademy/monuments.js - the three portrait statues of the module, built with the shared figure kit (lib/figures.js, docs/FIGURES.md); dossier docs/research/academy.md 5.3, 6.3.
//   klodtFig()       P. K. Klodt (V. Gorevoy, 2007): a slender man in a buttoned work smock, hair swept back, a long coat slung over the left forearm, the right hand resting on a tripod behind him that carries
//                    the bronze model of the Nicholas I monument (a horse and rider, 0.5 m); weight on the right leg, the left foot crossed in front.  2.10 m (kit scale 1.2); bronze #4e4a40.
//   khetagurovFig()  Kosta Khetagurov (V. Soskiev, 2009): an ELDERLY BEARDED man in a long coat, the head raised to the sky, the right hand on the chest; 1.7 m (the upper third of a 5 m monument).  The body
//                    pose and the dress are a default (no close photo exists); head, beard, age as documented.
//   treziniFig()     Domenico Trezzini (P. Ignatyev, 2013): a Petrine dress (open bear-fur coat, a doublet with a row of buttons, breeches, buckled shoes, a long curly wig), legs spread wide, the head thrown back,
//                    a broad grin; a rolled scroll of drawings in the right hand (the viewer's left), the left hand resting on a huge dividing compass (кронциркуль) standing on the ground.  3.2 m (kit scale 1.83).
// Figures face +z, stand on y = 0, +x is the figure's LEFT.
import { human, extend, cached, V } from '../lib/figures.js';

const hsh = (n) => { const s = Math.sin(n * 91.7 + 13.3) * 43758.5453; return s - Math.floor(s); };
/** the shaggy BEAR-FUR coat of the Trezzini monument (tm_003: heavy curls on the body, the lapels, the collar and the huge cuffs): deterministic lumps over the kit coat (review-academy 2026-10-08:
 *  the first figure read as a plain buttoned coat); about 150 small lumps, the open front (the doublet with its row of buttons) stays free */
function furCoat(S, J) {
  const px = J.pelvis[0], pz = J.pelvis[2], top = J.shoulderL[1] + 0.02;
  for (let i = 0; i < 120; i++) {                                                   // the body: round the back and the sides, wider toward the hem
    const y = 0.62 + (top - 0.62) * hsh(i * 3.1), th0 = hsh(i * 1.7) * 2 - 1, th = (th0 >= 0 ? 0.7 : -0.7) + th0 * (Math.PI - 0.7);
    const R = 0.2 + 0.1 * (top - y) / (top - 0.62) + 0.015, r = 0.048 + 0.03 * hsh(i * 5.3);
    S.blob('main', [px + Math.sin(th) * R * 1.12, y, pz + Math.cos(th) * R * 0.85 - 0.01], [r, r * 1.35, r], { w: 6, h: 5 });
  }
  for (const s of [1, -1]) {                                                         // the lapels: two shaggy strips down both edges of the open front
    const a = V.add(J.neckBase, [s * 0.1, -0.03, 0.1]), b = [px + s * 0.17, 0.66, pz + 0.19];
    for (let i = 0; i < 16; i++) { const p = V.mix(a, b, i / 15, [s * 0.015 * Math.sin(i), 0, 0.01 * Math.cos(i * 2.3)]); S.blob('main', p, [0.052 + 0.012 * hsh(i + s * 9), 0.065, 0.05], { w: 6, h: 5 }); }
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = J.neckBase; S.blob('main', [c[0] + Math.sin(a) * 0.17, c[1] + 0.0 + 0.02 * hsh(i), c[2] + Math.cos(a) * 0.14 - 0.02], [0.06, 0.055, 0.06], { w: 6, h: 5 }); }   // the collar
  for (const [sh, el, wr] of [[J.shoulderL, J.elbowL, J.wristL], [J.shoulderR, J.elbowR, J.wristR]]) {   // the sleeves and the big cuffs
    for (let i = 0; i < 22; i++) {
      const u = hsh(i * 2.3 + sh[0] * 7), first = u < 0.5, p = V.mix(first ? sh : el, first ? el : wr, first ? u * 2 : (u - 0.5) * 2), a = hsh(i * 7.7 + el[1] * 5) * 6.28, r = first ? 0.085 : 0.07;
      S.blob('main', [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r * 0.9, p[2] + Math.sin(a * 1.7) * r * 0.8], [0.05, 0.055, 0.05], { w: 6, h: 5 });
    }
    const d = V.unit(V.sub(wr, el));
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, c = V.add(wr, V.mul(d, -0.03)); S.blob('main', [c[0] + Math.cos(a) * 0.09, c[1] + Math.sin(a) * 0.08, c[2] + Math.sin(a * 2) * 0.05], [0.055, 0.055, 0.055], { w: 6, h: 5 }); }
  }
}

export const klodtFig = () => cached('lmacade-klodt', () => extend(human({
  detail: 0.8, body: { muscle: 0.2, bulk: 0.95, shoulders: 0.98 },
  pose: {
    pelvisRot: [0, 0.12, 0.06], spine: [0.04, -0.1, -0.05], head: [0.06, -0.22, 0.04],
    legs: { R: { foot: [-0.11, 0, -0.03], yaw: -0.2, pole: [-0.1, 0, 1] }, L: { foot: [-0.06, 0, 0.17], yaw: -0.45, pole: [0.2, 0, 1] } },
    arms: { R: { hand: [-0.31, 0.92, -0.22], pole: [-0.7, -0.4, -0.5], grip: 'hold', palm: [0, 0.5, 0.8] }, L: { hand: [0.26, 1.02, 0.22], pole: [0.7, -0.4, -0.7], grip: 'relaxed', palm: [0, 0.3, 1] } },
  },
  outfit: { torso: 'coat', hem: 0.42, flare: 0.1, folds: 0.04, sleeves: 'long', trousers: 'long', boots: 0.09, collar: 'fall', buttons: true },
  face: { age: 0.45, hair: 'short', beard: 'none', mouth: 'closed', brow: 0.7, seed: 41 },
}), (S, info) => {
  const J = info.j, w = J.wristL;
  // the long coat slung over the left forearm
  S.tube('main', [[w[0] + 0.02, w[1] + 0.06, w[2] + 0.04], [w[0] + 0.07, w[1] - 0.2, w[2] + 0.04], [w[0] + 0.08, w[1] - 0.6, w[2] + 0.02], [w[0] + 0.06, w[1] - 0.82, w[2]]], [[0.065, 0.05], [0.09, 0.06], [0.115, 0.07], [0.125, 0.07]], { seg: 10, per: 4, cap: true });
  // the tripod behind: three thin legs, a small platform with the horse-and-rider model
  const top = [-0.4, 1.12, -0.3];
  for (const [fx, fz] of [[-0.62, -0.62], [-0.18, -0.64], [-0.42, -0.1]]) S.tube('main', [top, [fx, 0, fz]], [[0.016, 0.016], [0.02, 0.02]], { seg: 5, per: 2 });
  S.blob('main', [top[0], top[1] + 0.02, top[2]], [0.1, 0.012, 0.1], { w: 8, h: 4 });
  S.blob('main', [top[0], top[1] + 0.12, top[2]], [0.05, 0.05, 0.09], { w: 8, h: 6 });
  S.blob('main', [top[0], top[1] + 0.2, top[2]], [0.03, 0.04, 0.03], { w: 6, h: 5 });
}));

export const khetagurovFig = () => cached('lmacade-khetagurov', () => human({
  detail: 0.8, body: { muscle: 0.1, bulk: 1.0 },
  pose: {
    pelvisRot: [0, 0.05, 0], spine: [-0.1, 0, 0], head: [-0.42, 0.12, 0],
    legs: { L: { foot: [0.1, 0, 0.0], yaw: 0.15, pole: [0.1, 0, 1] }, R: { foot: [-0.1, 0, 0.0], yaw: -0.15, pole: [-0.1, 0, 1] } },
    arms: { R: { hand: [-0.07, 1.2, 0.15], pole: [-0.6, -0.5, -0.6], grip: 'flat', palm: [0, 0, -1] }, L: { hand: [0.2, 0.62, 0.12], pole: [0.6, -0.3, -0.7], grip: 'relaxed', palm: [-1, 0, 0] } },
  },
  outfit: { torso: 'coat', hem: 0.78, flare: 0.25, folds: 0.05, sleeves: 'long', trousers: 'long', boots: 0.14, collar: 'stand', buttons: false },
  face: { age: 0.9, hair: 'short', beard: 'full', mouth: 'stern', brow: 1.0, jaw: 0.9, seed: 52 },
}));

export const treziniFig = () => cached('lmacade-trezzini', () => extend(human({
  detail: 0.85, body: { muscle: 0.3, bulk: 1.15, shoulders: 1.05 },
  pose: {
    pelvisRot: [0, -0.1, 0.04], spine: [-0.04, 0.2, -0.05], head: [-0.22, 0.25, 0],
    legs: { L: { foot: [0.24, 0, 0.05], yaw: 0.45, pole: [0.3, 0, 1] }, R: { foot: [-0.2, 0, -0.05], yaw: -0.4, pole: [-0.3, 0, 1] } },
    arms: { R: { hand: [-0.3, 1.0, 0.25], pole: [-0.8, -0.3, -0.5], grip: 'hold', palm: [0, 0, 1] }, L: { hand: [0.42, 1.15, 0.1], pole: [0.9, -0.2, -0.6], grip: 'fist', palm: [0, 1, 0] } },
  },
  outfit: { torso: 'coat', hem: 0.62, flare: 0.5, folds: 0.09, open: 0.8, sleeves: 'long', trousers: 'breeches', boots: 0.16, collar: 'fall', buttons: true, cape: 'back', capeLen: 0.7 },
  face: { age: 0.5, hair: 'long', beard: 'none', mouth: 'smile', brow: 0.8, seed: 63 },
}), (S, info) => {
  const J = info.j, r = J.wristR, l = J.wristL;
  furCoat(S, J);
  // the rolled scroll of drawings in the right hand
  S.tube('accent', [[r[0] - 0.02, r[1] - 0.1, r[2] + 0.02], [r[0] + 0.01, r[1] + 0.12, r[2] + 0.06], [r[0] + 0.03, r[1] + 0.3, r[2] + 0.1]], [[0.04, 0.04], [0.042, 0.042], [0.04, 0.04]], { seg: 8, per: 3 });
  // the huge dividing compass: the hinge above the left fist, two legs spread to the ground (standing on the ground at the figure's left)
  const hinge = [l[0] + 0.02, l[1] + 0.2, l[2] - 0.02];
  S.blob('accent', hinge, [0.045, 0.045, 0.045], { w: 8, h: 6 });
  S.tube('accent', [hinge, [l[0] - 0.02, 0.55, l[2] + 0.05], [l[0] - 0.12, 0.0, l[2] + 0.12]], [[0.026, 0.026], [0.024, 0.024], [0.012, 0.012]], { seg: 6, per: 4 });
  S.tube('accent', [hinge, [l[0] + 0.1, 0.55, l[2] - 0.02], [l[0] + 0.28, 0.0, l[2] - 0.05]], [[0.026, 0.026], [0.024, 0.024], [0.012, 0.012]], { seg: 6, per: 4 });
}));
