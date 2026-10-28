// landmarksVOStatues/monuments.js - three portrait monuments of the island: PAVLOV (A. G. Dema with V. F. Oneshko, arch. I. D. Bilibin, 2004-11-24, Tiflisskaya ul. / Makarova nab.: a bronze waist-length Pavlov in a
// mantle with a scroll on a red polished granite pedestal with a two-step base and the bronze plaque «1904 / Первому нобелевскому лауреату России Ивану Петровичу Павлову»; photo n4686521490/c00 opened; figure 1.6 m on a
// 2.1 m pedestal after the critic's correction), KOMITAS (L. Beibutyan, arch. M. Atayants, 2015-11-06, Kamsky garden: a GRANITE robed figure 3.3 m on a 1.7 m pedestal [OSM, W-web]; NO photo of the object: a generic
// robed priest-musician with the hands at the chest [?]), KARPINSKY (a bronze bust of the geologist on a red-grey granite block with the plaque КАРПИНСКИЙ АЛЕКСАНДР ПЕТРОВИЧ 1847-1936 at VSEGEI, Sredny pr.; a likeness
// photo of another Karpinsky bust only [?]).
import { human, bust, extend, cached, V } from '../lib/figures.js';
import { clipBelow, placeTinted } from './solids.js';
import { plateOn } from './plates.js';

const pavlovFig = () => cached('vos-pavlov', () => clipBelow(extend(human({
  detail: 0.55, body: { sex: 'm', muscle: 0.25, bulk: 1.08 },
  pose: { head: [0.04, 0.22, 0], spine: [0.03, 0.1, 0], arms: { R: { hand: [-0.1, 1.12, 0.22], pole: [-0.4, -0.6, -0.7], grip: 'hold' }, L: { hand: [0.2, 1.0, 0.14], pole: [0.5, -0.4, -0.8], grip: 'relaxed' } } },
  outfit: { torso: 'coat', hem: 0.3, flare: 0.1, folds: 0.08, sleeves: 'long', collar: 'fall', cape: 'none' },
  face: { age: 0.85, hair: 'short', beard: 'full', mouth: 'stern', seed: 77 },
}), (S, info) => { const w = info.j.wristR; if (w) S.tube('main', [V.add(w, [-0.06, -0.05, 0.0]), V.add(w, [0.1, 0.05, 0.02])], [[0.024, 0.024], [0.024, 0.024]], { seg: 7, per: 2 }); }), 0.86));

const komitasFig = () => cached('vos-komitas', () => extend(human({
  detail: 0.5, body: { sex: 'm', muscle: 0.2, bulk: 1.05 },
  pose: { head: [0.0, -0.1, 0], spine: [0.02, 0, 0], legs: { L: { foot: [0.09, 0, 0.0] }, R: { foot: [-0.09, 0, 0.0] } },
    arms: { R: { hand: [-0.05, 1.18, 0.26], pole: [-0.5, -0.4, -0.7], grip: 'hold', palm: [0.4, 0.4, 0.5] }, L: { hand: [0.07, 1.16, 0.27], pole: [0.5, -0.4, -0.7], grip: 'hold', palm: [-0.4, 0.4, 0.5] } } },
  outfit: { torso: 'robe', hem: 0.95, flare: 0.3, folds: 0.2, sleeves: 'long', collar: 'none', cape: 'none' },       // review: no cape (the thin 'back' ribbon read as a scarf, the 'mantle' sheet flares away from the body)
  face: { age: 0.6, hair: 'short', beard: 'full', mouth: 'stern', seed: 81 },
}), (S, info) => { const H = info.j.head; if (H) S.blob('main', V.add(V.add(H.c, V.mul(H.y, 0.06)), V.mul(H.z, -0.03)), [0.112, 0.085, 0.12], { dir: H.z, ref: H.x, w: 10, h: 7 }); }));        // a close skull-cap (clear of the brow, so that the beard reads)

const karpFig = () => cached('vos-karpinsky', () => bust({ detail: 0.5, style: 'civil', turn: 0.2, face: { age: 0.85, beard: 'full', hair: 'short', mouth: 'stern', seed: 93 } }));

export const PIECES = [
  {
    id: 'n4686521490', key: 'pavlov', name: 'Памятник И. П. Павлову', x: -2876.9, z: -1319.3, clear: { r: 1.5 }, yaw: 'auto', h: 3.7, spot: 6, reach: 20,
    solid: [{ w: 2.3, d: 2.3, h: 2.4 }],
    build(P, M, K) {
      P.tint('#8e4a45'); P.box(M.vc, -1.1, 1.1, 0, 0.15, -1.1, 1.1, 'b'); P.box(M.vc, -0.95, 0.95, 0.15, 0.3, -0.95, 0.95, 'b');
      P.tint(M.PAL.graniteRed); P.box(M.vc, -0.62, 0.62, 0.3, 0.55, -0.62, 0.62, 'b'); P.box(M.vc, -0.5, 0.5, 0.55, 1.95, -0.5, 0.5, 'b');
      P.tint('#a45650'); P.box(M.vc, -0.6, 0.6, 1.95, 2.2, -0.6, 0.6, 'b'); P.tint('#7b3b37'); P.box(M.vc, -0.52, 0.52, 2.2, 2.3, -0.52, 0.52, 'b');
      plateOn(P, M, K, 'pavlov', 0.78, 0.39, 0, 1.25, 0.512);
      pavlovFig().place(P, M.bronzeMono, 0, 2.3 - 0.86 * 1.2, 0, 0, 1.2);
    },
  },
  {
    id: 'n4461490397', key: 'komitas', name: 'Памятник Комитасу', x: -5017.3, z: -1745.1, yaw: 'auto', h: 5.0, spot: 7,
    solid: [{ w: 2.0, d: 1.5, h: 5.0 }],
    build(P, M, K) {
      const G = '#9a9a96';
      P.tint('#85857f'); P.box(M.vc, -1.05, 1.05, 0, 0.25, -0.8, 0.8, 'b');
      P.tint(G); P.box(M.vc, -0.8, 0.8, 0.25, 1.45, -0.55, 0.55, 'b'); P.tint('#8c8c87'); P.box(M.vc, -0.9, 0.9, 1.45, 1.7, -0.65, 0.65, 'b');
      plateOn(P, M, K, 'komitas', 0.7, 0.35, 0, 0.8, 0.562);
      placeTinted(P, komitasFig(), M.vc, { main: G, dark: '#50504c', accent: G }, 0, 1.7, 0, 0, 1.88);
    },
  },
  {
    id: 'n8089429889', key: 'karpinsky', name: 'Бюст А. П. Карпинского', x: -4974.1, z: -503.2, clear: { r: 1.0 }, yaw: -60 * Math.PI / 180,   /* faces the 20-21 lines, the VSEGEI building is behind */ h: 2.0, spot: 4, reach: 15,
    solid: [{ w: 0.8, d: 0.8, h: 2.0 }],
    build(P, M, K) {
      P.tint('#7c615b'); P.box(M.vc, -0.38, 0.38, 0, 0.12, -0.38, 0.38, 'b');
      P.tint(M.PAL.graniteKarp); P.box(M.vc, -0.3, 0.3, 0.12, 1.35, -0.3, 0.3, 'b'); P.tint('#7c615b'); P.box(M.vc, -0.34, 0.34, 1.35, 1.42, -0.34, 0.34, 'b');
      plateOn(P, M, K, 'karpinsky', 0.46, 0.23, 0, 0.8, 0.312);
      karpFig().place(P, M.bronzeMono, 0, 1.42, 0, 0, 1.1);
    },
  },
];
