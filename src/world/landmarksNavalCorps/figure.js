// landmarksNavalCorps/figure.js - the bronze figure of ADMIRAL I. F. KRUSENSTERN (I. N. Schroder, unveiled 6 November 1873), built with the shared figure kit (lib/figures.js, docs/FIGURES.md).
// Dossier docs/research/navalcorps.md 5.5, photos refs/navalcorps b02 (profile) b03 b04 b05 b08 b09 b11: a young-looking admiral of 1830-40, 3.0 m with the hair, standing with his weight on the left leg and
// the right foot advanced, the head bowed (looking down at the Corps: the statue FACES THE CORPS, back to the Neva), the ARMS CROSSED on the chest, a rolled map held under the right forearm, a double-breasted
// tailcoat with a high stand collar and a white cravat, fringed epaulettes, three orders on the left breast, tails to the knee behind, long trousers over boots, a dirk on the left hip pointing back and down;
// curly short hair, long sideburns, clean-shaven, a mild frown.  Unit height 1.75 m (place at scale 1.71 = 3.0 m); the figure faces +z, stands on y = 0, +x is its LEFT.
import { human, extend, cached } from '../lib/figures.js';

const TAU = Math.PI * 2;
export const krusensternFig = () => cached('lmnaval-krusenstern', () => extend(human({
  detail: 1.0, body: { muscle: 0.2, bulk: 0.95, shoulders: 1.0 },
  pose: {
    pelvis: [0, 0.955, 0], pelvisRot: [0, 0.07, -0.05], spine: [0.06, -0.04, 0.04], head: [0.38, 0.22, 0.03],
    legs: { L: { foot: [0.095, 0, -0.015], yaw: 0.12, pole: [0.05, 0, 1] }, R: { foot: [-0.11, 0, 0.17], yaw: -0.3, pole: [-0.1, 0, 1] } },
    arms: {
      R: { hand: [0.085, 1.2, 0.175], pole: [-0.2, -1.0, 0.55], grip: 'relaxed', palm: [0, -0.4, 0.9] },
      L: { hand: [-0.115, 1.165, 0.13], pole: [0.2, -1.0, 0.3], grip: 'fist', palm: [0, 0.2, 0.9] },
    },
  },
  outfit: { torso: 'coat', hem: 0.3, flare: 0.04, folds: 0.025, open: 0.0, sleeves: 'long', trousers: 'long', boots: 0.28, collar: 'stand', epaulettes: true, buttons: true, medals: 3 },
  face: { age: 0.35, hair: 'short', beard: 'sideburns', brow: 0.9, jaw: 0.9, mouth: 'stern', seed: 31 },
}), (S, info) => {
  const J = info.j, py = J.pelvis[1];
  // ---- the tails of the tailcoat: a back sheet from the hips down to the knee (the front of the coat is cut away at the waist)
  S.tube('main', [[0, py - 0.1, -0.015], [0, py - 0.3, -0.02], [0, py - 0.52, -0.01]], [[0.205, 0.145], [0.215, 0.15], [0.205, 0.14]],
    { seg: 20, per: 4, cap: false, sector: [TAU * 0.75 - 1.0, TAU * 0.75 + 1.0], bump: (t, th) => 1 + 0.03 * Math.sin(9 * th + 3 * t) });
  // ---- the dirk: a short straight blade with a cross-guard and a grip, hanging on the left hip, pointing back and down
  const hip = [J.hipL[0] + 0.12, J.hipL[1] + 0.1, 0.0];
  const dv = [0.04, -0.6, -0.8], dl = Math.hypot(...dv), d = dv.map((x) => x / dl);
  const at = (t) => [hip[0] + d[0] * t, hip[1] + d[1] * t, hip[2] + d[2] * t];
  S.tube('accent', [at(-0.12), at(0), at(0.02)], [[0.014, 0.014], [0.013, 0.013], [0.012, 0.012]], { seg: 6, per: 2 });
  S.tube('accent', [at(0.02), at(0.42)], [[0.016, 0.006], [0.006, 0.0025]], { seg: 6, per: 2 });
  S.blob('accent', at(0.02), [0.06, 0.012, 0.012], { w: 6, h: 4 });
  // ---- the rolled map held in the left hand (the right forearm lies over it): a thin cylinder sticking out beside the right elbow
  const w = J.wristL;
  S.tube('accent', [[w[0] - 0.1, w[1] - 0.01, w[2] + 0.02], [w[0] + 0.13, w[1] + 0.012, w[2] + 0.03]], [[0.02, 0.02], [0.02, 0.02]], { seg: 8, per: 2, cap: true });
  // ---- the white cravat under the stand collar
  S.blob('accent', [0, J.neckBase[1] + 0.012, 0.085], [0.045, 0.028, 0.03], { dir: [0, -0.2, 1], w: 8, h: 6 });
}));
