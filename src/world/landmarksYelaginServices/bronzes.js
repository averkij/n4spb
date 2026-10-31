// landmarksYelaginServices/bronzes.js - the two bronze sculptures by M. G. Manizer in the round court of the Stable (dossier KNOWN ERRORS 13, CRITIC LOG "what the researcher missed" 1): the DISCOBOLUS (Дискобол, the athlete at
// the end of the backswing, torso bent forward and twisted, weight on the right leg, the disc in the right hand swung back, the left hand on the right knee) and the DISCUS-THROWER (Метательница диска, a woman in the
// same wind-up, a more upright torso).  Bronze figures of the 1930s, installed 1936 on the Central Alley of the park, since the 1990s in the Stable court [Commons file descriptions + geotags]; no photograph of the two
// bronzes was opened, the poses are the classical wind-up [E].  Built with the shared figure kit (lib/figures.js): nude athletic bodies, ~1.9 m, on low granite plinths; poses tuned in tools/figures-view.mjs.
// Exports the two cached figures so that the figure viewer can show them without the city.
import { human, extend, cached } from '../lib/figures.js';

const disc = (S, info, side, off) => {
  const w = info.j['wrist' + side];
  S.blob('main', [w[0] + off[0], w[1] + off[1], w[2] + off[2]], [0.17, 0.022, 0.17], { w: 14, h: 6 });
};

/** the Discobolus: man, 1.9 m, backswing */
export const discobolusFig = () => cached('lmyesv-discobolus', () => extend(human({
  detail: 0.75, body: { muscle: 1.0, bulk: 1.12, shoulders: 1.1 },
  pose: {
    pelvis: [0, 0.80, -0.02], pelvisRot: [0.2, 0.35, 0.0], spine: [0.75, -0.95, 0.0], head: [-0.5, 0.75, 0.0],
    legs: { R: { foot: [-0.2, 0, 0.12], yaw: -0.5, pole: [-0.1, 0, 1] }, L: { foot: [0.2, 0, -0.55], yaw: 0.1, lift: 0.0, pole: [0.2, 0, 1] } },
    arms: { R: { hand: [-0.45, 1.05, -0.75], pole: [-0.6, 0.3, -0.5], grip: 'hold', palm: [0, 1, 0] }, L: { hand: [-0.35, 0.58, 0.32], pole: [0.8, 0.1, 0.2], grip: 'relaxed', palm: [0, 0, 1] } },
  },
  outfit: { torso: 'nude' }, face: { age: 0.2, hair: 'short', brow: 0.9, jaw: 1.0, seed: 11 },
}), (S, info) => { disc(S, info, 'R', [0.0, 0.05, -0.1]); }));

/** the Discus-thrower: woman, 1.75 m */
export const discusThrowerFig = () => cached('lmyesv-discusthrower', () => extend(human({
  detail: 0.75, body: { sex: 'f', muscle: 0.6, bulk: 1.05, shoulders: 1.0 },
  pose: {
    pelvis: [0, 0.84, 0.0], pelvisRot: [0.12, 0.3, 0.0], spine: [0.5, -0.85, 0.0], head: [-0.3, 0.7, 0.0],
    legs: { R: { foot: [-0.18, 0, 0.1], yaw: -0.5, pole: [-0.1, 0, 1] }, L: { foot: [0.2, 0, -0.45], yaw: 0.1, lift: 0.0, pole: [0.2, 0, 1] } },
    arms: { R: { hand: [-0.45, 1.15, -0.7], pole: [-0.6, 0.3, -0.5], grip: 'hold', palm: [0, 1, 0] }, L: { hand: [-0.3, 0.75, 0.3], pole: [0.8, 0.1, 0.2], grip: 'relaxed', palm: [0, 0, 1] } },
  },
  outfit: { torso: 'nude' }, face: { age: 0.1, hair: 'short', mouth: 'smile', seed: 12 },
}), (S, info) => { disc(S, info, 'R', [0.0, 0.05, -0.1]); }));
