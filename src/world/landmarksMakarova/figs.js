// landmarksMakarova/figs.js - the statues of the module built with the shared figure kit (lib/figures.js): the ANGEL of the Catherine dome (adapted from landmarksG/angel.js, I. P. Prokofiev's angel with the cross,
// a copy of 2017; built at 1.75 m, the church scales it x 2.0) and the two APOSTLES (Peter and Paul, 2.0 m, bearded, with a book) of the Lutheran church of St Catherine.  Figures face +z, stand on y = 0, +x is the left.
import { human, extend, cached, addWing } from '../lib/figures.js';

/** the angel on the ball: a robed figure, wings half open, the left hand holds a tall Latin cross (2.45 units) */
export function angelFig() {
  return cached('lmMak-angel', () => {
    const base = human({
      detail: 0.5, body: { sex: 'f', bulk: 0.95, shoulders: 1.0 },
      pose: {
        pelvisRot: [0.03, 0.05, -0.03], spine: [0.06, -0.1, 0.04], head: [0.2, 0.2, 0.1],
        legs: { R: { foot: [-0.12, 0, 0.02], yaw: -0.15 }, L: { foot: [0.13, 0, -0.25], yaw: 0.1, toeUp: -0.06 } },
        arms: { R: { hand: [-0.22, 1.7, 0.1], pole: [-0.5, 0.0, -0.4], grip: 'open', palm: [0.3, 0.1, 1] }, L: { hand: [0.2, 0.8, 0.2], pole: [0.4, -0.4, -0.7], grip: 'hold', palm: [-0.6, 0.0, 0.7] } },
      },
      outfit: { torso: 'robe', hem: 0.95, flare: 0.45, folds: 0.07, sleeves: 'none', collar: 'none', cape: 'none' },
      face: { age: 0.12, hair: 'curly', mouth: 'closed', brow: 0.3, nose: 0.9, seed: 7 },
    });
    return extend(base, (S, info) => {
      const j = info.j;
      addWing(S, { root: [0.1, 1.42, -0.1], side: 1, pose: 'half', span: 0.95, key: 'main', boneKey: 'main', tilt: [0.1, 0.95, -0.05] });
      addWing(S, { root: [-0.1, 1.42, -0.1], side: -1, pose: 'half', span: 1.0, key: 'main', boneKey: 'main', tilt: [0.1, 0.8, 0.05] });
      const h = j.hands.L.hold, fx = h[0] + 0.03, fz = h[2] + 0.02;
      S.tube('accent', [[fx, -0.02, fz], [fx, 1.3, fz], [fx, 2.45, fz]], [[0.034, 0.034], [0.034, 0.034], [0.034, 0.034]], { seg: 6, per: 6, ref: [1, 0, 0], cap: false });
      S.tube('accent', [[fx - 0.3, 2.15, fz], [fx, 2.15, fz], [fx + 0.3, 2.15, fz]], [[0.034, 0.034], [0.034, 0.034], [0.034, 0.034]], { seg: 6, per: 3, ref: [0, 1, 0] });
    });
  });
}

/** an apostle for a niche of the stair wings: bearded, in a long robe with a mantle, a book in the left hand, the right hand at the chest (seed 0 = Peter, 1 = Paul) */
export function apostleFig(seed) {
  return cached('lmMak-apostle-' + seed, () => human({
    detail: 0.65, body: { sex: 'm', bulk: 1.05, shoulders: 1.05 },
    pose: { spine: [0.02, seed ? 0.12 : -0.12, 0], head: [0.1, seed ? -0.25 : 0.25, 0], arms: { R: { hand: [-0.12, 1.2, 0.2], pole: [-0.6, -0.5, -0.3], grip: 'open' }, L: { hand: [0.26, 1.0, 0.2], pole: [0.5, -0.5, -0.4], grip: 'hold' } } },
    outfit: { torso: 'robe', hem: 0.95, flare: 0.3, folds: 0.07, sleeves: 'long', collar: 'none', cape: 'mantle', capeLen: 0.95 },
    face: { age: seed ? 0.55 : 0.8, hair: seed ? 'short' : 'curly', beard: 'full', seed: 31 + seed },
  }));
}
