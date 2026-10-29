// landmarksVOStatues/musa.js - the MONUMENT TO MUSA JALIL (Муса Джалиль) at Sredny pr. / Gavanskaya (A. Ziyakaev with Ya. Neiman, 2011-05-19, a gift of Tatarstan).  Photos n2101529725/c00 and c02 (opened):
// a bronze figure seated on the shaft top and leaning forward, a military tunic with a stand collar, the heavy overcoat slid off the shoulders and sliding down the front and the left side of the shaft, the hands
// clasped over a small notebook at the chest, the head turned to the side; a dark red-brown granite shaft (0.74 m square, ~2.0 m by the proportions of c02; the dossier's 1.3 m is the lowest collar), three stepped
// collars, and a low truncated pyramid slab (3.6 m square at the ground) on a round cobbled apron.  The plates: the dedication on the front, the Russian and the Tatar quatrains on the right face.
import { human, extend, cached, V } from '../lib/figures.js';
import { frustumBox, disc, clipBelow } from './solids.js';
import { plateOn } from './plates.js';

const SH = { w: 0.37, y0: 1.2, y1: 3.2 }, TOP = SH.y1;

function figure() {
  return cached('vos-musa', () => clipBelow(extend(human({
    detail: 0.55, body: { sex: 'm', muscle: 0.35, bulk: 1.12, shoulders: 1.1 },
    pose: { pelvis: [0, 0.12, 0], pelvisRot: [0.12, 0.3, 0], spine: [0.24, -0.3, 0.04], head: [0.06, 0.5, 0.04],
      legs: { L: { foot: [0.12, -0.8, 0.1], yaw: 0.1 }, R: { foot: [-0.12, -0.8, 0.1], yaw: -0.1 } },
      arms: { R: { hand: [-0.03, 0.46, 0.34], pole: [-0.7, -0.5, -0.4], grip: 'hold', palm: [0.4, 0.4, 0.5] }, L: { hand: [0.1, 0.42, 0.35], pole: [0.7, -0.6, -0.3], grip: 'hold', palm: [-0.4, 0.6, 0.4] } } },
    outfit: { torso: 'coat', hem: 0.62, flare: 1.0, folds: 0.22, sleeves: 'long', collar: 'stand', cape: 'none', buttons: true },
    face: { age: 0.25, hair: 'short', mouth: 'stern', seed: 14 },
  }), (S, info) => {
    const j = info.j;
    // the overcoat slid off the shoulders: thick cloth masses over the left hip (viewer's right) that pour down the shaft face
    for (let i = 0; i < 2; i++) {
      const x0 = 0.2 + i * 0.06;
      S.tube('main', [[x0 - 0.06, 0.34, -0.06 + i * 0.03], [x0, 0.06, 0.02 + i * 0.04], [x0 + 0.06 + i * 0.02, -0.25 - i * 0.1, 0.18 + i * 0.05]], [[0.14, 0.09], [0.16, 0.1], [0.08, 0.05]], { seg: 9, per: 3, ref: [0, 0, 1] });
    }
    S.tube('main', [[-0.22, 0.25, 0.1], [-0.3, 0.02, 0.16], [-0.32, -0.3, 0.2]], [[0.1, 0.07], [0.12, 0.08], [0.06, 0.05]], { seg: 9, per: 3, ref: [0, 0, 1] });
    const w = j.wristR; if (w) S.blob('main', V.add(w, [0.1, -0.02, 0.0]), [0.07, 0.014, 0.05], { w: 8, h: 6 });                         // the notebook
  }), -0.15));
}

export const PIECES = [{
  id: 'n2101529725', key: 'musa', name: 'Памятник Мусе Джалилю', x: -6258.3, z: 50.3, yaw: 'auto', h: 5.2, spot: 7, reach: 25,
  solid: [{ w: 3.3, d: 3.3, h: 0.5 }, { w: 1.2, d: 1.2, h: 3.4 }],
  build(P, M, K) {
    const G = M.PAL.graniteMusa;
    disc(P, M.cobble, 4.4, 0.035, 36, 2.2);
    P.tint(G);
    frustumBox(P, M.vc, 1.8, 1.8, 0.7, 0.7, 0, 0.42);                                  // the low pyramid slab
    P.tint('#6a4a42'); P.box(M.vc, -0.62, 0.62, 0.42, 0.62, -0.62, 0.62, 'b');          // collars
    P.tint(G); P.box(M.vc, -0.55, 0.55, 0.62, 0.84, -0.55, 0.55, 'b');
    P.tint('#6a4a42'); P.box(M.vc, -0.47, 0.47, 0.84, 1.04, -0.47, 0.47, 'b');
    P.tint(G); P.box(M.vc, -SH.w, SH.w, 1.04, TOP, -SH.w, SH.w, 'b');                // the shaft (0.74 m square)
    P.tint('#4a3230'); P.box(M.vc, -SH.w - 0.01, SH.w + 0.01, TOP, TOP + 0.04, -SH.w - 0.01, SH.w + 0.01, 'b');
    figure().place(P, M.bronzeBrownSet, 0.05, TOP + 0.04, 0.0, 0, 1.28);
    plateOn(P, M, K, 'musaShaft', 0.66, 0.33, 0, 2.25, SH.w + 0.012);
    plateOn(P, M, K, 'musaVerse', 0.66, 0.33, SH.w + 0.012, 2.45, 0, Math.PI / 2);
    plateOn(P, M, K, 'musaTatar', 0.66, 0.33, SH.w + 0.012, 2.02, 0, Math.PI / 2);
  },
}];
