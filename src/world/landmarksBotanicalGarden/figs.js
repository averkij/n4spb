// landmarksBotanicalGarden/figs.js - the figures of the garden made with the shared kit (lib/figures.js): the THINKER (granite, 2014, A. Ishemgulov, OSM n13807794875: a seated nude athlete in Rodin's pose, the
// right elbow on the left knee and the chin on the right fist, built life-size 1.3 m seated) and the small DINOSAUR (OSM n13917693769 "Маленький динозавр": a 1 m stylised green-grey iguanodon-like
// statue on all fours with a long tail).  Pure geometry (figureMats keys: main / dark / accent).
import { human, cached, Sculpt } from '../lib/figures.js';

export function thinker() {
  return cached('lmbg-thinker', () => human({
    detail: 0.62, body: { muscle: 0.9, bulk: 1.06, shoulders: 1.04 },
    pose: {
      pelvis: [0, 0.5, -0.08], pelvisRot: [0.1, 0.1, 0], spine: [0.6, 0.25, 0.0], head: [0.5, -0.1, 0.0],
      legs: { L: { foot: [0.17, 0, 0.34], yaw: 0.2, pole: [0.1, 0.2, 1] }, R: { foot: [-0.17, 0, 0.12], yaw: -0.3, pole: [-0.2, 0.2, 1] } },
      arms: { R: { hand: [0.0, 0.84, 0.4], pole: [-0.2, -0.8, 0.1], grip: 'fist' }, L: { hand: [0.2, 0.56, 0.42], pole: [0.7, -0.3, -0.2], grip: 'flat' } },
    },
    outfit: { torso: 'nude' }, face: { age: 0.3, hair: 'short', beard: 'none', brow: 1.0, jaw: 1.0, mouth: 'stern', seed: 21 },
  }));
}

export function dinosaur() {
  return cached('lmbg-dino', () => {
    const S = new Sculpt({ detail: 0.8 }), w = (n) => S.seg(n);
    // body, neck + head, tail, four legs (+ a few back plates)
    S.blob('main', [0, 0.46, 0], [0.24, 0.26, 0.5], { w: w(14), h: w(10) });
    S.tube('main', [[0, 0.6, 0.38], [0, 0.82, 0.62], [0, 1.0, 0.78], [0, 1.05, 0.9]], [[0.1, 0.1], [0.08, 0.08], [0.07, 0.07], [0.06, 0.06]], { seg: w(10), per: 3 });
    S.blob('main', [0, 1.06, 0.98], [0.1, 0.1, 0.16], { w: w(10), h: w(8) });
    S.tube('main', [[0, 0.46, -0.4], [0, 0.4, -0.85], [0.05, 0.3, -1.3], [0.12, 0.2, -1.7]], [[0.17, 0.2], [0.11, 0.13], [0.06, 0.07], [0.015, 0.015]], { seg: w(10), per: 4 });
    for (const [x, z, fwd] of [[0.17, 0.3, 1], [-0.17, 0.3, 1], [0.17, -0.25, -1], [-0.17, -0.25, -1]]) {
      S.tube('main', [[x, 0.45, z], [x * 1.1, 0.25, z + 0.06 * fwd], [x * 1.1, 0.03, z + 0.12 * fwd]], [[0.085, 0.085], [0.055, 0.055], [0.05, 0.07]], { seg: w(8), per: 3 });
    }
    for (let i = 0; i < 6; i++) S.blob('accent', [0, 0.74 - i * 0.03, 0.22 - i * 0.17], [0.015, 0.075, 0.07], { w: 6, h: 5 });
    S.blob('dark', [0.075, 1.1, 1.04], [0.02, 0.02, 0.02], { w: 6, h: 4 }); S.blob('dark', [-0.075, 1.1, 1.04], [0.02, 0.02, 0.02], { w: 6, h: 4 });
    return S.finish();
  });
}
