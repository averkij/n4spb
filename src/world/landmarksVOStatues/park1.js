// landmarksVOStatues/park1.js - the Park of Modern Sculpture of the Philological faculty of SPbU, court of the Palace of Peter II (Y1), part 1: the LONG FIGURES.  Little Prince, Bench of counsels, Pak Kyongni,
// Akhmatova, Blok, Gulliver, Madame Butterfly, Perekur, Pra Aphai Mani, Ho Chi Minh.  Photos (SP/refs/vo-garden): cw/268417 + 268430 (Little Prince), cw/268408 (Bench), ext/pk4_2 (Pak), the dossier
// docs/research/vo-statues-2026-garden.md for the rest.  Elongated expressive bronzes are built with the figure kit's Sculpt (tubes, blobs, faces); realistic ones with human().  The court is closed today (no entrance
// in landmarksUniversity/fronts.js): the pieces stand where OSM puts them and become visible when a passage opens (docs/research/islands2-requests-landmarksVOStatues.md R1).
import { human, extend, cached, addWing } from '../lib/figures.js';
import { HF, sculpt, limb, face, placeXYZ, V } from './sty.js';
import { plateOn } from './plates.js';
import { lathe, ball, loft, frustumBox } from './solids.js';

const limb2 = (P, M, path, r) => loft(P, M.vc, path, r.map((x) => [x, x * 0.8]), { seg: 7, per: 3 });
const perekur = () => cached('vos-perekur', () => human({
  detail: 0.26, body: { sex: 'm', muscle: 0.75, bulk: 1.05 },
  pose: { pelvis: [0, 0.0, 0], pelvisRot: [0.12, 0.0, 0], spine: [0.22, 0.05, 0], head: [0.05, 0.0, 0],
    legs: { L: { foot: [0.14, -0.5, 0.5], yaw: 0.1, pole: [0, 1, 0] }, R: { foot: [-0.14, -0.5, 0.5], yaw: -0.1, pole: [0, 1, 0] } },
    arms: { R: { hand: [-0.1, 0.62, 0.36], pole: [-0.5, -0.4, -0.5], grip: 'hold' }, L: { hand: [0.2, 0.36, 0.38], pole: [0.5, -0.5, -0.4], grip: 'relaxed' } } },
  outfit: { torso: 'nude' }, face: { age: 0.3, hair: 'short', mouth: 'smile', seed: 80 },
}));

const NEW = '#8a6a3e';                                                  // new golden-brown bronze (Pak, Pra)

// ------------------------------------------------------------------------------------------------ the Little Prince
const prince = () => sculpt('prince', (S) => {
  // origin: the top of the book stack, facing +z; a long-limbed jester reading
  S.blob('main', [0, 0.1, -0.02], [0.15, 0.1, 0.15], { w: 10, h: 7 });
  limb(S, [[0, 0.1, -0.02], [0, 0.34, 0.0], [0, 0.58, 0.03]], [[0.14, 0.11], [0.11, 0.09], [0.13, 0.08]], { seg: 10 });
  S.blob('main', [0, 0.56, 0.03], [0.2, 0.05, 0.08], { w: 10, h: 6 });
  limb(S, [[0, 0.58, 0.03], [0, 0.68, 0.08]], 0.04);
  const hf = HF([0, 0.8, 0.12], 0.45, 0.22, -0.18);
  face(S, hf, { hair: 'bald', mouth: 'smile', age: 0.15, scale: 1.25, seed: 5 });
  // the jester's cap: two long lobes with leaf veins, one falling to the left, one to the right
  limb(S, [[-0.04, 0.9, 0.1], [-0.22, 1.0, 0.04], [-0.42, 0.95, -0.1], [-0.5, 0.82, -0.2]], [[0.1, 0.035], [0.1, 0.03], [0.08, 0.025], [0.03, 0.015]], { seg: 8, per: 4, ref: [0, 1, 0] });
  limb(S, [[0.04, 0.9, 0.12], [0.24, 1.0, 0.12], [0.44, 0.96, 0.24], [0.5, 0.8, 0.34]], [[0.1, 0.035], [0.1, 0.03], [0.08, 0.025], [0.03, 0.015]], { seg: 8, per: 4, ref: [0, 1, 0] });
  // arms: the right (our left) props the head, the left holds an open book on the lap
  limb(S, [[-0.19, 0.55, 0.03], [-0.3, 0.3, 0.26], [-0.14, 0.62, 0.22], [-0.1, 0.76, 0.2]], [[0.05, 0.05], [0.045, 0.045], [0.04, 0.04], [0.03, 0.03]], { seg: 7, per: 4 });
  limb(S, [[0.19, 0.55, 0.03], [0.32, 0.32, 0.1], [0.24, 0.2, 0.36]], [[0.05, 0.05], [0.042, 0.042], [0.03, 0.03]], { seg: 7, per: 3 });
  S.sheet('dark', [[0.22, 0.18, 0.42], [0.52, 0.2, 0.4], [0.5, 0.32, 0.18], [0.2, 0.3, 0.2]], 0.012);              // the open book: two leaves
  S.sheet('dark', [[0.22, 0.18, 0.42], [-0.04, 0.2, 0.4], [-0.02, 0.32, 0.2], [0.2, 0.3, 0.2]], 0.012);
  // legs: the left folded up with the shin down the stack, the right crossed forward with a long pointed shoe
  limb(S, [[0.1, 0.1, 0.05], [0.16, 0.4, 0.36], [0.2, 0.05, 0.5], [0.22, -0.38, 0.52]], [[0.09, 0.09], [0.07, 0.07], [0.06, 0.06], [0.05, 0.05]], { seg: 8, per: 4 });
  limb(S, [[0.2, -0.38, 0.52], [0.26, -0.44, 0.7], [0.3, -0.42, 0.95]], [[0.045, 0.035], [0.04, 0.025], [0.012, 0.01]], { seg: 6, per: 3 });
  limb(S, [[-0.1, 0.1, 0.05], [-0.18, 0.3, 0.3], [0.0, 0.2, 0.55], [0.3, 0.12, 0.7]], [[0.09, 0.09], [0.07, 0.07], [0.055, 0.055], [0.045, 0.04]], { seg: 8, per: 4 });
  limb(S, [[0.3, 0.12, 0.7], [0.5, 0.14, 0.86], [0.78, 0.16, 1.0]], [[0.045, 0.04], [0.04, 0.03], [0.01, 0.008]], { seg: 6, per: 3 });
}, 0.6);

// ------------------------------------------------------------------------------------------------ the Bench of counsels: an angel and a devil
const leaning = (S, side, devil) => {
  const x = side * 0.98, c = -side;                                               // c = direction toward the middle
  limb(S, [[x, 0, 0], [x + c * 0.03, 0.25, 0.02], [x + c * 0.1, 0.55, -0.02], [x + c * 0.22, 0.85, 0.0]], [[0.11, 0.08], [0.06, 0.05], [0.07, 0.05], [0.09, 0.07]], { seg: 8, per: 4 });                    // the swirl of cloth / legs
  limb(S, [[x + c * 0.22, 0.85, 0.0], [x + c * 0.4, 1.15, 0.02], [x + c * 0.55, 1.38, 0.04]], [[0.12, 0.09], [0.11, 0.08], [0.06, 0.05]], { seg: 9, per: 4 });                                           // the torso, leaning in
  S.blob('main', [x + c * 0.5, 1.33, 0.03], [0.13, 0.05, 0.08], { w: 9, h: 6, dir: [c, 0.3, 0] });
  limb(S, [[x + c * 0.55, 1.38, 0.04], [x + c * 0.64, 1.46, 0.05]], 0.035);
  const f = HF([x + c * 0.74, 1.54, 0.05], -0.2, c * 1.35, 0.1);
  face(S, f, devil ? { hair: 'bald', beard: 'goatee', mouth: 'smile', age: 0.6, nose: 1.5, jaw: 1.2, scale: 1.1, seed: 9 } : { hair: 'curly', mouth: 'smile', age: 0.1, scale: 1.1, seed: 3 });
  limb(S, [[x + c * 0.5, 1.33, 0.05], [x + c * 0.72, 1.12, 0.12], [x + c * 0.9, 1.4, 0.1]], [[0.045, 0.045], [0.04, 0.04], [0.032, 0.03]], { seg: 7, per: 4 });                                        // the arm to the middle
  S.blob('main', [x + c * 0.93, 1.46, 0.1], [0.04, 0.05, 0.02], { w: 7, h: 5 });
  limb(S, [[x + c * 0.4, 1.2, -0.04], [x + c * 0.2, 1.05, -0.18], [x + c * 0.1, 0.9, -0.16]], [[0.04, 0.04], [0.035, 0.035], [0.025, 0.025]], { seg: 6, per: 3 });                                    // the other arm hangs back
  if (devil) { for (const s of [-1, 1]) limb(S, [[x + c * 0.7 + s * 0.04, 1.66, 0.07 + s * 0.06], [x + c * 0.7 + s * 0.06, 1.8, 0.1 + s * 0.08], [x + c * 0.72 + s * 0.04, 1.84, 0.1 + s * 0.12]], [[0.025, 0.025], [0.015, 0.015], [0.004, 0.004]], { seg: 5, per: 3 }); }
  else addWing(S, { root: [x + c * 0.45, 1.3, -0.08], side: -c, pose: 'half', span: 0.55, key: 'accent' });
};
const counsel = () => sculpt('counsel', (S) => { leaning(S, -1, false); leaning(S, 1, true); }, 0.55);

// ------------------------------------------------------------------------------------------------ Pak Kyongni, Akhmatova, Blok, Gulliver, Butterfly, Pra, Ho
const pak = () => cached('vos-pak', () => extend(human({
  detail: 0.5, body: { sex: 'f', muscle: 0.15 },
  pose: { head: [0.12, -0.12, 0], spine: [0.03, 0, 0], arms: { R: { hand: [-0.1, 1.08, 0.24], pole: [-0.4, -0.5, -0.7], grip: 'hold', palm: [0.4, 0.5, 0.3] }, L: { hand: [0.14, 1.04, 0.22], pole: [0.4, -0.5, -0.7], grip: 'hold', palm: [-0.4, 0.5, 0.3] } } },
  outfit: { torso: 'dress', hem: 0.96, flare: 0.15, folds: 0.07, sleeves: 'long', collar: 'fall' },
  face: { age: 0.8, hair: 'cap', mouth: 'smile', seed: 33 },
}), (S, info) => { const w = info.j.wristR; if (w) S.blob('dark', V.add(w, [0.11, 0.0, 0.04]), [0.09, 0.012, 0.07], { w: 8, h: 5, dir: [0, 0.4, 1] }); }));

const akhmatova = () => cached('vos-akhmatova', () => extend(human({
  detail: 0.5, body: { sex: 'f', muscle: 0.1, shoulders: 0.95 },
  pose: { head: [0.1, 0.18, 0.04], spine: [0.02, 0.03, 0], arms: { R: { hand: [0.12, 1.1, 0.2], pole: [-0.2, -0.6, -0.7], grip: 'relaxed', palm: [0, 0.3, 1] }, L: { hand: [-0.1, 1.07, 0.2], pole: [0.2, -0.6, -0.7], grip: 'relaxed', palm: [0, 0.3, 1] } } },
  outfit: { torso: 'dress', hem: 0.96, flare: 0.12, folds: 0.07, sleeves: 'long', collar: 'none' },
  face: { age: 0.45, hair: 'long', mouth: 'stern', nose: 1.4, seed: 14 },
}), (S, info) => { const j = info.j; S.tube('main', [V.add(j.shoulderR, [0.0, 0.02, 0.03]), V.add(j.chest, [0, 0.0, 0.14]), V.add(j.shoulderL, [0.0, 0.02, 0.03])], [[0.045, 0.03], [0.05, 0.034], [0.045, 0.03]], { seg: 8, per: 5 }); }));       // the shawl

const blok = () => cached('vos-blok', () => human({
  detail: 0.45, body: { sex: 'm', muscle: 0.2, bulk: 0.85 },
  pose: { head: [0.05, 0.2, 0.06], spine: [0.0, 0.05, 0], arms: { R: { hand: [-0.2, 0.8, 0.08], pole: [-0.4, -0.3, -0.8], grip: 'relaxed' }, L: { hand: [0.2, 0.82, 0.06], pole: [0.4, -0.3, -0.8], grip: 'relaxed' } } },
  outfit: { torso: 'coat', hem: 0.9, flare: 0.1, folds: 0.05, sleeves: 'long', collar: 'fall', trousers: 'long', boots: 0.2 },
  face: { age: 0.3, hair: 'curly', mouth: 'stern', seed: 21 },
}));

const gulliverBig = () => cached('vos-gulliver-big', () => human({
  detail: 0.4, body: { sex: 'm', muscle: 0.3 },
  pose: { head: [-0.05, -0.25, 0], spine: [0, -0.1, 0], legs: { L: { foot: [0.14, 0, 0.1], yaw: 0.3 }, R: { foot: [-0.16, 0, -0.1], yaw: -0.3 } },
    arms: { L: { hand: [0.34, 1.18, 0.28], pole: [0.5, -0.2, -0.8], grip: 'open', palm: [0, 1, 0] }, R: { hand: [-0.22, 0.85, 0.05], pole: [-0.5, -0.3, -0.8], grip: 'relaxed' } } },
  outfit: { torso: 'coat', hem: 0.5, flare: 0.3, folds: 0.1, sleeves: 'long', collar: 'fall', trousers: 'long', boots: 0.35, buttons: true },
  face: { age: 0.3, hair: 'long', mouth: 'smile', seed: 52 },
}));
// a tiny standing man for the nested Gullivers: tubes and blobs (~300 triangles); the left hand is stretched out palm up (the next Gulliver stands in it)
const mini = (key) => sculpt('gulliver-mini-' + key, (S) => {
  for (const x of [-0.07, 0.07]) limb(S, [[x, 0.0, 0.0], [x, 0.45, 0.02], [x, 0.9, 0.0]], [[0.045, 0.06], [0.05, 0.055], [0.07, 0.07]], { seg: 6, per: 2 });
  limb(S, [[0, 0.9, 0], [0, 1.15, 0.01], [0, 1.45, 0.0]], [[0.15, 0.1], [0.16, 0.11], [0.12, 0.08]], { seg: 8, per: 3 });
  S.blob('main', [0, 1.65, 0.02], [0.1, 0.12, 0.11], { w: 8, h: 6 });
  limb(S, [[-0.15, 1.42, 0], [-0.2, 1.1, 0.04], [-0.17, 0.85, 0.1]], 0.035, { seg: 5, per: 2 });
  limb(S, [[0.15, 1.42, 0], [0.3, 1.25, 0.1], [0.4, 1.12, 0.2]], 0.035, { seg: 5, per: 2 });
  S.blob('main', [0.43, 1.1, 0.22], [0.07, 0.025, 0.07], { w: 6, h: 4 });
}, 0.4);

const butterfly = () => cached('vos-butterfly', () => extend(human({
  detail: 0.45, body: { sex: 'f', muscle: 0.15 },
  pose: { head: [0.05, -0.3, 0.1], spine: [0.0, 0.18, 0.05], pelvisRot: [0, -0.1, 0.04], arms: { R: { hand: [-0.36, 1.5, 0.2], pole: [-0.6, 0.6, -0.4], grip: 'open', palm: [0, 0, 1] }, L: { hand: [0.2, 0.98, 0.16], pole: [0.6, -0.5, -0.6], grip: 'hold' } } },
  outfit: { torso: 'robe', hem: 0.95, flare: 0.7, folds: 0.18, sleeves: 'none', belt: true },
  face: { age: 0.15, hair: 'long', mouth: 'smile', seed: 43 },
}), (S, info) => { const H = info.j.head; if (H) S.blob('accent', V.add(V.add(H.c, V.mul(H.y, 0.09)), V.mul(H.z, -0.04)), [0.05, 0.05, 0.05], { w: 7, h: 6 }); }));    // the knot of hair

const pra = () => cached('vos-pra', () => extend(human({
  detail: 0.45, body: { sex: 'm', muscle: 0.25 },
  pose: { pelvis: [0, 0.2, 0], pelvisRot: [0.05, 0, 0], spine: [0.0, 0, 0], head: [0.1, 0, 0],
    legs: { L: { foot: [-0.18, 0.0, 0.34], yaw: -0.5, pole: [0.2, 1, 0] }, R: { foot: [0.18, 0.0, 0.34], yaw: 0.5, pole: [-0.2, 1, 0] } },
    arms: { R: { hand: [-0.08, 0.82, 0.3], pole: [-0.6, -0.3, -0.5], grip: 'hold' }, L: { hand: [0.2, 0.8, 0.3], pole: [0.6, -0.3, -0.5], grip: 'hold' } } },
  outfit: { torso: 'tunic', hem: 0.18, flare: 0.5, folds: 0.1, sash: true },
  face: { age: 0.15, hair: 'curly', mouth: 'smile', seed: 62 },
}), (S, info) => { const a = info.j.wristR, b = info.j.wristL; if (a && b) S.tube('main', [V.add(a, [-0.08, 0.0, 0.03]), V.add(b, [0.1, 0.02, 0.04])], [[0.014, 0.014], [0.014, 0.014]], { seg: 6, per: 3 }); }));   // the flute

const ho = () => cached('vos-ho', () => human({
  detail: 0.45, body: { sex: 'm', muscle: 0.15, bulk: 0.9 },
  pose: { pelvis: [0, 0.5, 0], pelvisRot: [0.04, 0.0, 0], spine: [0.04, 0, 0], head: [0.04, 0.0, 0],
    legs: { L: { foot: [0.14, 0.0, 0.42], yaw: 0.1, pole: [0, 1, 0] }, R: { foot: [-0.14, 0.0, 0.42], yaw: -0.1, pole: [0, 1, 0] } },
    arms: { R: { hand: [-0.16, 0.5, 0.34], pole: [-0.5, -0.5, -0.4], grip: 'relaxed' }, L: { hand: [0.16, 0.5, 0.34], pole: [0.5, -0.5, -0.4], grip: 'relaxed' } } },
  outfit: { torso: 'coat', hem: 0.35, flare: 0.1, folds: 0.05, sleeves: 'long', collar: 'stand', trousers: 'long', boots: 0.2 },
  face: { age: 0.9, hair: 'bald', beard: 'goatee', mouth: 'stern', seed: 71 },
}));

export const PIECES = [
  {
    id: 'n5808194411', key: 'prince', name: 'Размышление о Маленьком принце', x: -2910.6, z: -851.5, yaw: 'auto', h: 2.2, spot: 5, reach: 40,
    solid: [{ r: 0.85, h: 2.0 }],
    build(P, M, K) {
      P.tint('#b06a5c'); P.col(M.vc, 0, 0, 0, 0.5, 0.86, 0.84, 28, true);                           // the round pink-red granite drum
      plateOn(P, M, K, 'prince', 0.24, 0.12, 0.1, 0.25, 0.855, 0);
      const bk = [[0.62, 0.44, 0.11, 0.1], [0.56, 0.4, 0.1, -0.12], [0.6, 0.42, 0.12, 0.05], [0.5, 0.36, 0.09, -0.08], [0.42, 0.3, 0.13, 0.15], [0.46, 0.3, 0.1, -0.05], [0.48, 0.32, 0.1, 0.1]];
      let y = 0.5;
      bk.forEach(([w, d, h, yaw], i) => {
        P.push(0, y, 0, yaw); P.tint(['#3a5a4f', '#4d3e34', '#34504a', '#55453a', '#2f4a45', '#4a3a30', '#3a5a50'][i]);
        P.box(M.vc, -w / 2, w / 2, 0, h, -d / 2, d / 2, 'b');
        if (i < 5) P.quad(M.spines, [-w / 2 + 0.02, 0.01, d / 2 + 0.002], [w / 2 - 0.02, 0.01, d / 2 + 0.002], [w / 2 - 0.02, h - 0.01, d / 2 + 0.002], [-w / 2 + 0.02, h - 0.01, d / 2 + 0.002], [0, 0, 1], [[0, 1 - (i + 1) / 5 + 0.01], [1, 1 - (i + 1) / 5 + 0.01], [1, 1 - i / 5 - 0.01], [0, 1 - i / 5 - 0.01]]);
        P.pop(); y += h;
      });
      prince().place(P, { main: M.bronzeSet.main, dark: M.bronzeSet.dark, accent: M.bronzeSet.main }, 0, y, 0, 0, 1.0);
    },
  },
  {
    id: 'n5808194398', key: 'bench', name: 'Скамья советов', x: -2893, z: -874.4, yaw: 'auto', h: 1.9, spot: 5, reach: 40,
    solid: [{ w: 2.6, d: 0.7, h: 0.5 }],
    build(P, M, K) {
      P.tint('#8e8e88'); for (const s of [-1, 1]) P.box(M.vc, s * 0.9 - 0.32, s * 0.9 + 0.32, 0, 0.42, -0.24, 0.24, 'b');
      P.tint('#6e4a33'); P.box(M.vc, -1.3, 1.3, 0.42, 0.5, -0.26, 0.26, 'b');
      P.tint('#e6e3da'); for (const s of [-1, 1]) P.box(M.vc, s * 0.98 - 0.3, s * 0.98 + 0.3, 0.5, 0.52, -0.22, 0.22, 'b');
      counsel().place(P, M.bronzeMono, 0, 0.52, 0, 0, 1.0);
      plateOn(P, M, K, 'bench', 0.36, 0.18, 0.95, 0.46, 0.262, 0);
    },
  },
  {
    id: 'n5808194359', key: 'pak', name: 'Пак Кён Ри', x: -2928, z: -851.5, yaw: 'auto', h: 2.8, spot: 5, reach: 40,
    solid: [{ w: 1.1, d: 0.9, h: 2.8 }],
    build(P, M, K) {
      P.tint('#1c1d1f'); P.box(M.vc, -0.55, 0.55, 0, 0.12, -0.45, 0.45, 'b'); P.box(M.vc, -0.5, 0.5, 0.12, 0.85, -0.4, 0.4, 'b');
      plateOn(P, M, K, 'pak', 0.8, 0.4, 0, 0.45, 0.412, 0);
      P.tint(NEW); const g = pak(); for (const [k, geo] of Object.entries(g.geos)) { P.tint(k === 'dark' ? '#14110d' : NEW); P.geo(M.vc, geo, 0, 0.85, 0, 0, 0, 0, 1.05, 1.05, 1.05); }
    },
  },
  {
    id: 'n5808194374', key: 'akhmatova', name: 'Памятник А. А. Ахматовой', x: -2956.7, z: -874.3, yaw: 32 * Math.PI / 180,   /* the green wing is behind her (photos 268384 268383) */ h: 2.3, spot: 5, reach: 40,
    solid: [{ w: 0.8, d: 0.8, h: 2.2 }],
    build(P, M, K) {
      P.tint('#cdcbc4'); P.box(M.vc, -0.36, 0.36, 0, 0.1, -0.36, 0.36, 'b'); P.tint('#d8d6cf'); P.box(M.vc, -0.21, 0.21, 0.1, 1.2, -0.21, 0.21, 'b'); P.tint('#c4c2bb'); P.box(M.vc, -0.26, 0.26, 1.2, 1.26, -0.26, 0.26, 'b');
      plateOn(P, M, K, 'akhmatova', 0.34, 0.17, 0, 0.55, 0.212, 0);
      akhmatova().place(P, M.bronzeMono, 0, 1.26, 0, 0, 0.56);
    },
  },
  {
    id: 'n5808194403', key: 'blok', name: 'Памятник Александру Блоку', x: -2881.9, z: -850.2, yaw: 'auto', h: 2.4, spot: 4, reach: 40,
    solid: [{ w: 0.7, d: 0.7, h: 2.4 }],
    build(P, M, K) {
      P.tint('#85857f'); P.box(M.vc, -0.35, 0.35, 0, 0.12, -0.35, 0.35, 'b'); P.tint('#8e8e88'); P.box(M.vc, -0.22, 0.22, 0.12, 1.3, -0.22, 0.22, 'b');
      plateOn(P, M, K, 'blok', 0.34, 0.17, 0, 0.72, 0.232, 0);
      placeXYZ(P, blok(), M.bronzeMono, 0, 1.3, 0, 0, 0.42, 0.62, 0.42);                                   // 1.05 m, very thin (dossier correction: 1.05 m figure on a 1.3 m pedestal)
    },
  },
  {
    id: 'n5808194386', key: 'gulliver', name: 'Гулливер', x: -2910.6, z: -907.3, yaw: 'auto', h: 3.1, spot: 5, reach: 40,
    solid: [{ r: 0.42, h: 2.8 }],
    build(P, M, K) {
      P.tint('#e6e3da'); lathe(P, M.vc, [[0.38, 0], [0.38, 0.1], [0.3, 0.13], [0.26, 0.2], [0.26, 0.98], [0.3, 1.0], [0.33, 1.08], [0.33, 1.12], [0.05, 1.12]], 24, { bottom: false });   // the white fluted column: base, shaft, capital
      P.tint('#cfccc2'); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.box(M.vc, Math.sin(a) * 0.262 - 0.007, Math.sin(a) * 0.262 + 0.007, 0.22, 0.96, Math.cos(a) * 0.262 - 0.007, Math.cos(a) * 0.262 + 0.007, 'b'); }   // the flutes (thin ribs)
      plateOn(P, M, K, 'gulliver', 0.3, 0.15, 0, 0.5, 0.264, 0);
      // the giant open hand (palm and four fingers curling up), then Gulliver in the coat of the 18th century and the smaller Gullivers, each standing in the raised hand of the one before
      P.tint('#5a5a4c'); ball(P, M.vc, [0, 1.18, 0], [0.34, 0.07, 0.3], { w: 12, h: 6 });
      for (let i = 0; i < 4; i++) { const x = -0.24 + i * 0.16; limb2(P, M, [[x, 1.2, 0.16], [x * 1.1, 1.3, 0.4], [x * 1.2, 1.48, 0.5]], [0.05, 0.04, 0.025]); }
      limb2(P, M, [[0.28, 1.2, 0.0], [0.42, 1.3, 0.1], [0.46, 1.48, 0.2]], [0.06, 0.045, 0.03]);
      const big = gulliverBig(), sb = 0.8; big.place(P, M.bronzeMono, 0, 1.24, 0, 0, sb);
      let x = 0.34 * sb, y = 1.24 + 1.18 * sb, z = 0.28 * sb;
      for (const s of [0.28, 0.1, 0.036]) { mini('a').place(P, M.bronzeMono, x, y, z, 0.0, s); x += 0.43 * s; y += 1.1 * s; z += 0.22 * s; }
    },
  },
  {
    id: 'n5808194395', key: 'butterfly', name: 'Мадам Баттерфляй', x: -2900.7, z: -886.1, yaw: 'auto', h: 2.3, spot: 5, reach: 40,
    solid: [{ w: 0.8, d: 0.8, h: 2.6 }],
    build(P, M, K) {
      P.tint('#8e8e88'); P.box(M.vc, -0.36, 0.36, 0, 0.12, -0.36, 0.36, 'b'); P.tint('#9a9a94'); P.box(M.vc, -0.26, 0.26, 0.12, 0.9, -0.26, 0.26, 'b');
      plateOn(P, M, K, 'butterfly', 0.36, 0.18, 0, 0.5, 0.262, 0);
      butterfly().place(P, M.bronzeMono, 0, 0.9, 0, 0, 0.74);
    },
  },
  {
    id: 'n5808194371', key: 'perekur', name: 'Перекур', x: -2944.7, z: -855, yaw: 'auto', h: 2.3, spot: 5, reach: 40,
    solid: [{ r: 0.42, h: 2.2 }],
    build(P, M, K) {
      const TEAL = '#3d5f5f', TEAL2 = '#2d4a4d', COP = '#a06e3c', COP2 = '#76492a';
      P.tint('#b27a72'); P.col(M.vc, 0, 0, 0, 0.55, 0.34, 0.33, 24, true); P.tint('#a56d66'); P.col(M.vc, 0, 0, 0.55, 0.58, 0.36, 0.36, 24, true);   // the round pink granite drum
      plateOn(P, M, K, 'smoke', 0.34, 0.17, 0, 0.28, 0.335, 0);
      P.tint(TEAL); frustumBox(P, M.vc, 0.21, 0.19, 0.14, 0.14, 0.58, 0.95);                                              // the faceted crouching figure at the foot
      P.tint(COP2); lathe(P, M.vc, [[0.05, 0.95], [0.32, 0.97], [0.38, 1.02], [0.12, 1.1]], 20, { x: 0.05, sx: 1.0, sz: 0.85 });                         // its broad copper hat brim
      P.tint(COP); ball(P, M.vc, [0, 0.8, 0.15], [0.07, 0.09, 0.06], { w: 7, h: 6 });                                                                    // the copper face under the brim
      P.tint(TEAL2); frustumBox(P, M.vc, 0.2, 0.17, 0.13, 0.12, 1.1, 1.45, 0.02, 0);                                                                     // the column block above
      P.tint(TEAL); P.quad(M.vc2, [-0.2, 1.05, 0.02], [-0.1, 1.0, 0.2], [-0.06, 1.7, 0.14], [-0.26, 1.88, -0.02], [-1, 0, 0.3]);                          // the blue-green leaves of the drape (left)
      P.quad(M.vc2, [-0.2, 1.05, 0.02], [-0.3, 1.1, -0.1], [-0.34, 1.75, -0.08], [-0.26, 1.88, -0.02], [-1, 0, 0]);
      P.tint(COP); ball(P, M.vc, [0.08, 1.52, 0.02], [0.15, 0.11, 0.12], { w: 9, h: 7 }); ball(P, M.vc, [0.0, 1.68, 0.02], [0.105, 0.17, 0.085], { w: 9, h: 7 });   // the nude woman: hips, torso
      P.tint(COP2); loft(P, M.vc, [[0.07, 1.5, 0.04], [0.19, 1.4, 0.13], [0.08, 1.27, 0.18]], [[0.075, 0.07], [0.06, 0.06], [0.05, 0.05]], { seg: 7, per: 3 });   // the bent leg
      P.tint(COP); loft(P, M.vc, [[-0.06, 1.78, 0.02], [-0.17, 1.9, 0.07], [-0.1, 2.0, 0.1]], [[0.036, 0.036], [0.032, 0.032], [0.026, 0.026]], { seg: 6, per: 3 });   // the raised arm
      ball(P, M.vc, [0, 1.92, 0.0], [0.066, 0.082, 0.07], { w: 8, h: 6 });                                                                               // the head
      P.tint(COP2); P.cyl(M.vc, [0, 1.96, 0], [-0.09, 2.26, 0.04], 0.075, 0.012, 8, true);                                                               // the pointed jester's cap
    },
  },
  {
    id: 'n5808194324', key: 'pra', name: 'Пра Апхай Мани', x: -2916.3, z: -890.2, yaw: 'auto', h: 1.8, spot: 5, reach: 40,
    solid: [{ r: 0.5, h: 1.7 }],
    build(P, M, K) {
      lathe(P, M.gilt, [[0.5, 0.0], [0.5, 0.05], [0.42, 0.1], [0.38, 0.12], [0.34, 0.3], [0.27, 0.55], [0.19, 0.74], [0.09, 0.84], [0.02, 0.86]], 24);   // the gilded bell stands on the lawn, ~0.85 m
      P.tint('#3a2c20'); P.box(M.vc, -0.26, 0.26, 0.84, 0.94, -0.22, 0.22, 'b');                                                                       // the small bronze plinth under the figure
      plateOn(P, M, K, 'pra', 0.4, 0.2, 0, 0.89, 0.222, 0);
      P.tint(NEW); const g = pra(); for (const [k, geo] of Object.entries(g.geos)) { P.tint(k === 'dark' ? '#14110d' : NEW); P.geo(M.vc, geo, 0, 0.94, 0, 0, 0, 0, 0.82, 0.82, 0.82); }
    },
  },
  {
    id: 'n1681923234', key: 'ho', name: 'Хо Ши Мин', x: -2937.5, z: -881.1, yaw: 'auto', h: 1.9, spot: 5, reach: 40,
    solid: [{ w: 1.0, d: 1.0, h: 1.9 }],
    build(P, M, K) {
      P.tint('#c0233a'); P.box(M.vc, -0.5, 0.5, 0, 0.62, -0.5, 0.5, 'b'); P.tint('#a41d31'); P.box(M.vc, -0.54, 0.54, 0.62, 0.68, -0.54, 0.54, 'b');
      plateOn(P, M, K, 'ho', 0.44, 0.22, 0, 0.3, 0.512, 0);
      P.tint('#3a2f26'); P.box(M.vc, -0.3, 0.3, 0.68, 0.74, -0.3, 0.3, 'b'); P.box(M.vc, -0.3, 0.3, 0.74, 1.3, -0.34, -0.26, 'b');
      for (const s of [-1, 1]) P.box(M.vc, s * 0.28 - 0.02, s * 0.28 + 0.02, 0.74, 0.98, -0.3, 0.2, 'b');
      ho().place(P, M.bronzeMono, 0, 0.74 - 0.0, -0.05, 0, 1.0);
    },
  },
];
