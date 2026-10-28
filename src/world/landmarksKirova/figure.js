// landmarksKirova/figure.js - the two portrait figures of the module, built with the shared figure kit (lib/figures.js; docs/FIGURES.md); the user judges monuments at 1-3 m: no boxes.  No layout imports
// (the figure viewer tools/figures-view.mjs can load this file alone).
//   sobchakFig()  Anatoly Sobchak (1937-2000), a WAIST-LENGTH bronze portrait in the gown of an honorary doctor speaking from a tribune (Korneev, 2006; kirova.md 9.2, photo sm01): a man of about 55 with
//                 swept-back hair, long face, furrowed brow, the right hand on the tribune, the left arm stretched forward with the open palm; figure frame: feet y = 0 (the legs are hidden in the tribune),
//                 faces +z.  Placed at scale 1.9 (sobchak.js) with the pelvis at the top of the base block: the crown stands 1.86 m above the foot of the bronze.  The gown: a broad squared yoke over
//                 the shoulders, wide sleeves gathered at the wrist, a stand-up shirt collar (extend()).
//   roerichFig()  Nicholas Roerich (1874-1947), the granite monument of Zayko (2010; kirova.md 10.4, photos rr01 n10 n11): an old man in a long straight hooded cloak (a monolithic column), arms crossed on the
//                 chest holding a book (not modelled), a long forked beard falling on the chest, the hood drawn over the skull and shoulders; 2.05 m (scale 1.17); ONE material (grey granite): skin, hair and cloth are the same stone.
import { human, extend, cached, V } from '../lib/figures.js';

export const sobchakFig = () => cached('lmKir-sobchak2', () => {
  const fig = human({
    detail: 1.0,
    pose: {
      pelvis: [0, 0.98, 0], spine: [0.06, -0.12, 0], head: [-0.03, 0.1, 0],
      arms: { L: { hand: [0.46, 1.4, 0.58], pole: [0.5, -0.5, 0.1], grip: 'open', palm: [0, 0.2, 1] }, R: { hand: [-0.2, 1.0, 0.12], pole: [-0.5, -0.6, 0], grip: 'flat' } },
      legs: { L: { foot: [0.12, 0, 0] }, R: { foot: [-0.12, 0, 0] } },
    },
    body: { muscle: 0.3, bulk: 1.08, shoulders: 1.12 },
    outfit: { torso: 'coat', hem: 0.5, sleeves: 'long', collar: 'stand', cape: 'none', flare: 0.25, folds: 0.05 },
    face: { age: 0.7, hair: 'short', brow: 0.8, mouth: 'stern', jaw: 1.08, nose: 1.1, eyes: 'open' },
  });
  return extend(fig, (S, info) => {
    const J = info.j; if (!J || !J.chestFrame) return;
    const F = J.chestFrame, at = (o, a, b, c) => [o[0] + F.side[0] * a + F.up[0] * b + F.fwd[0] * c, o[1] + F.side[1] * a + F.up[1] * b + F.fwd[1] * c, o[2] + F.side[2] * a + F.up[2] * b + F.fwd[2] * c];
    // the yoke: a broad squared cape over the shoulders (the ribbed shoulder yoke of the gown, photo sm01)
    S.blob('main', at(J.neckBase, 0, -0.045, -0.005), [0.255, 0.06, 0.15], { dir: F.fwd, ref: F.side, w: 14, h: 8 });
    S.blob('main', at(J.neckBase, 0, -0.1, 0.0), [0.215, 0.07, 0.135], { dir: F.fwd, ref: F.side, w: 14, h: 8 });
    // wide sleeves, gathered at the wrist: a swelling along the forearm and a puffed cuff (the left arm points forward, the right hand lies on the tribune)
    for (const nm of ['L', 'R']) {
      const el = J['elbow' + nm], wr = J['wrist' + nm], sh = J['shoulder' + nm]; if (!el || !wr || !sh) continue;
      S.blobBetween('main', V.lerp(sh, el, 0.35), V.lerp(el, wr, 0.55), 0.072, 0.092, { w: 12, h: 8 });
      S.blobBetween('main', V.lerp(el, wr, 0.5), V.lerp(el, wr, 0.92), 0.092, 0.058, { w: 12, h: 8 });
    }
    // a stand-up shirt collar
    S.tube('main', [at(J.neckBase, 0, 0.0, 0.0), at(J.neckBase, 0, 0.05, 0.005)], [[0.066, 0.068], [0.06, 0.062]], { seg: 14, per: 2, cap: false, ref: F.side });
  });
});

export const roerichFig = () => cached('lmKir-roerich2', () => {
  const fig = human({
    detail: 1.0,
    pose: {
      pelvis: [0, 0.96, 0], spine: [0.04, 0, 0], head: [0.1, 0, 0],
      arms: { L: { hand: [-0.1, 1.27, 0.2], pole: [0.4, -0.7, 0.1], grip: 'hold' }, R: { hand: [0.11, 1.22, 0.23], pole: [-0.4, -0.7, 0.1], grip: 'hold' } },
    },
    body: { muscle: 0.15, bulk: 1.1, shoulders: 1.0 },
    outfit: { torso: 'coat', hem: 0.95, sleeves: 'long', collar: 'stand', cape: 'none', flare: 0.12, folds: 0.07 },
    face: { age: 1.0, hair: 'none', beard: 'full', brow: 0.75, mouth: 'stern', jaw: 0.95, nose: 1.1, eyes: 'open' },
  });
  return extend(fig, (S, info) => {
    const J = info.j; if (!J || !J.head || !J.chestFrame) return;
    const HF = J.head, F = J.chestFrame, h = J.headC, at = (o, a, b, c) => [o[0] + F.side[0] * a + F.up[0] * b + F.fwd[0] * c, o[1] + F.side[1] * a + F.up[1] * b + F.fwd[1] * c, o[2] + F.side[2] * a + F.up[2] * b + F.fwd[2] * c];
    const hp = (a, b, c) => [h[0] + HF.x[0] * a + HF.y[0] * b + HF.z[0] * c, h[1] + HF.x[1] * a + HF.y[1] * b + HF.z[1] * c, h[2] + HF.x[2] * a + HF.y[2] * b + HF.z[2] * c];
    // the cowl: a cap-like hood over the back, sides and top of the skull (the face stays open) ...
    S.blob('main', hp(0, 0.035, -0.058), [0.118, 0.125, 0.105], { dir: HF.z, ref: HF.x, w: 14, h: 10 });
    // ... falling in a thick fold round the neck and over the shoulders
    S.blob('main', at(J.neckBase, 0, 0.005, -0.012), [0.2, 0.065, 0.16], { dir: F.fwd, ref: F.side, w: 14, h: 8 });
    // the long beard: a tapered spade lying on the chest, forked at the end
    const c0 = hp(0, -0.1, 0.07), c1 = at(J.neckBase, 0, -0.07, 0.125), c2 = at(J.neckBase, 0, -0.2, 0.15);
    S.tube('main', [c0, c1, c2], [[0.04, 0.028], [0.066, 0.03], [0.04, 0.02]], { seg: 12, per: 4, ref: F.side });
    for (const s of [-1, 1]) S.blobBetween('main', at(J.neckBase, s * 0.012, -0.17, 0.15), at(J.neckBase, s * 0.035, -0.26, 0.152), 0.03, 0.014, { w: 8, h: 6 });
  });
});
