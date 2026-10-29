// landmarksVOStatues/lenin.js - the two LENIN statues of Vasilievsky Island, ONE modelled figure (cached) placed twice:
//  * Bolshoy pr. 55A (V. V. Kozlov and A. V. Kryzhanovskaya, arch. Ya. A. Kumpis, 1930-07-18): the standing bronze figure (jacket, waistcoat, trousers, bareheaded, hands at the sides, the head raised and turned) on a high
//    rough-faced pink-grey granite pedestal in the form of a TRIBUNE: footing of two granite courses, the main block, a wedge-shaped lectern slab with the slogan «ПРОЛЕТАРИИ ВСЕХ СТРАН СОЕДИНЯЙТЕСЬ», a cap block with the
//    word ЛЕНИН in the front.  In front a big flower bed.  Photos n2535435047/c00 c01 c03 (opened).
//  * the Pokrovskaya hospital (V. B. Pinchuk, 1934): the same figure on a pale block with a grey band and a two-step footing, in a round bed ringed with 24 iron stakes.  Photo n2535435041/c00.
// Content decision: statues only (the precedent of the Mining / ModernVO modules: no Lenin emblem), the pedestal texts are the real ones of the photographs.  The figure faces the street / the entrance.
import { human, extend, cached } from '../lib/figures.js';
import { plateOn, plateQuad } from './plates.js';
import { disc } from './solids.js';

function figure() {
  return cached('vos-lenin', () => extend(human({
    detail: 0.5, body: { sex: 'm', muscle: 0.35 },
    pose: { head: [-0.04, -0.12, 0.03], spine: [0, -0.06, 0], legs: { L: { foot: [0.1, 0, 0.02], yaw: 0.2 }, R: { foot: [-0.1, 0, -0.02], yaw: -0.2 } },
      arms: { R: { hand: [-0.27, 0.78, 0.04], pole: [-0.4, -0.3, -0.8], grip: 'relaxed' }, L: { hand: [0.26, 0.8, 0.04], pole: [0.4, -0.3, -0.8], grip: 'relaxed' } } },
    outfit: { torso: 'coat', hem: 0.3, flare: 0.05, folds: 0.03, sleeves: 'long', collar: 'fall', trousers: 'long', boots: 0.18 },
    face: { age: 0.55, hair: 'bald', beard: 'goatee', mouth: 'stern', seed: 30 },
  }), (S, info) => {
    const j = info.j;                                                                                        // the waistcoat edge and the lapels read as two thin folds
    for (const s of [1, -1]) S.tube('main', [[s * 0.03, j.neckBase ? j.neckBase[1] - 0.02 : 1.45, 0.12], [s * 0.06, 1.2, 0.147], [s * 0.04, 1.0, 0.15]], [[0.012, 0.008], [0.012, 0.008], [0.01, 0.007]], { seg: 6, per: 2 });
  }));
}

const MID = '#a98d84', DARK = '#8d7770', LIGHT = '#b89f97';

export const PIECES = [
  {
    id: 'n2535435047', key: 'lenin55a', name: 'Памятник В. И. Ленину (Большой пр. В.О., 55А)', x: -4437.2, z: -416.5, yaw: 31 * Math.PI / 180,   /* faces Bolshoy pr. (photos c01 c03 c04: the building is BEHIND the statue); the 'auto' nearest-footway rule turned it to the building */ h: 6.3, spot: 9,
    solid: [{ w: 3.0, d: 2.5, h: 4.4 }],
    build(P, M, K) {
      // the footing: two granite courses
      P.tint(DARK); P.box(M.vc, -1.5, 1.5, 0, 0.26, -1.25, 1.25, 'b');
      P.tint(MID); P.box(M.vc, -1.25, 1.25, 0.26, 0.52, -1.0, 1.0, 'b');
      // the block with the lectern: main block 1.5 x 1.2, rough courses (a seam every 0.5 m)
      P.tint(MID); P.box(M.vc, -0.75, 0.75, 0.52, 3.55, -0.55, 0.55, 'b');
      for (let y = 1.02; y < 3.5; y += 0.5) { P.tint(DARK); P.box(M.vc, -0.76, 0.76, y - 0.012, y + 0.012, -0.56, 0.56, 'b'); }
      // the lectern: a wedge, high at the block (y 2.9) and projecting 0.95 m at the foot (y 0.9)
      const z0 = 0.55, z1 = 1.5, yb = 0.9, yt = 2.9, hw = 0.95;
      P.tint(LIGHT);
      P.quad(M.vc, [-hw, yb, z1], [hw, yb, z1], [hw, yt, z0], [-hw, yt, z0], [0, 0.55, 0.83], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.fan(M.vc, [[-hw, yb, z1], [-hw, yt, z0], [-hw, yb, z0]], [-1, 0, 0]); P.fan(M.vc, [[hw, yb, z1], [hw, yb, z0], [hw, yt, z0]], [1, 0, 0]);
      P.quad(M.vc, [-hw, yb, z1], [-hw, yb, z0], [hw, yb, z0], [hw, yb, z1], [0, -1, 0]);
      const sl = (t, u) => [-hw + 2 * hw * u, yb + (yt - yb) * t, z1 + (z0 - z1) * t];                          // a point of the slanted face: t up the slope, u across
      const pad = 0.12;
      plateQuad(P, M, 'leninSlogan', sl(pad, 0.06), sl(pad, 0.94), sl(0.62, 0.94), sl(0.62, 0.06));
      // the cap with the name
      P.tint(DARK); P.box(M.vc, -0.9, 0.9, 3.55, 3.78, -0.7, 0.7, 'b');
      P.tint(MID); P.box(M.vc, -0.8, 0.8, 3.78, 4.28, -0.6, 0.6, 'b');
      plateOn(P, M, K, 'leninTop', 1.3, 0.48, 0, 4.03, 0.61);
      P.tint(DARK); P.box(M.vc, -0.65, 0.65, 4.28, 4.34, -0.5, 0.5, 'b');
      figure().place(P, M.bronzeMono, 0, 4.34, 0, 0, 1.12);
      // the flower bed in front (a red-and-green disc under the footing's fore edge, y 0.05)
      P.tint('#4f8a3a'); disc(P, M.vc, 2.0, 0.05, 28, 3, 0, 1.0);
      // the red salvia of the photo (c00): a dense carpet of 150 little tufts (red salvia, darker red and green foliage between), none inside the footing or under the lectern.
      // review: the first build used 0.14 m boxes that read as red cubes; hexagonal domed tufts, 0.11-0.14 m radius, merge into a flower bed
      for (let i = 0; i < 150; i++) {
        const a = i * 2.39996, r = 1.97 * Math.sqrt((i + 0.5) / 150), x = Math.cos(a) * r, z = 1.0 + Math.sin(a) * r;
        if (Math.abs(x) < 1.6 && z < 1.55) continue;
        const k = i % 5, rad = 0.11 + 0.03 * ((i * 7) % 3) / 2;
        P.tint(k === 0 ? '#3f7a34' : k === 1 ? '#d8452e' : '#c8232c');
        P.col(M.vc, x, z, 0.05, 0.13 + 0.04 * (k % 3), rad, rad * 0.6, 6, true);
      }
    },
  },
  {
    id: 'n2535435041', key: 'leninPokrovskaya', name: 'Памятник В. И. Ленину (Покровская больница)', x: -5442.5, z: 166.2, yaw: 28 * Math.PI / 180,   /* faces away from the hospital door toward Bolshoy pr. (photo c00) */ h: 4.3, spot: 7,
    solid: [{ w: 1.9, d: 1.7, h: 3.0 }],
    build(P, M, K) {
      P.tint('#4f8a3a'); disc(P, M.vc, 2.7, 0.05, 28, 3);
      P.tint('#9a9a96'); P.box(M.vc, -1.0, 1.0, 0, 0.2, -0.85, 0.85, 'b'); P.box(M.vc, -0.85, 0.85, 0.2, 0.4, -0.7, 0.7, 'b');
      P.tint('#d4d4cf'); P.box(M.vc, -0.62, 0.62, 0.4, 2.0, -0.5, 0.5, 'b');
      P.tint('#8e8f8c'); P.box(M.vc, -0.64, 0.64, 1.1, 1.24, -0.52, 0.52, 'b');                                  // the grey band
      P.tint('#a8a8a3'); P.box(M.vc, -0.7, 0.7, 2.0, 2.1, -0.56, 0.56, 'b');
      figure().place(P, M.bronzeMono, 0, 2.1, 0, 0, 1.12);
      // the ring of 24 iron stakes round the bed
      P.tint('#23282a');
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = Math.cos(a) * 2.7, z = Math.sin(a) * 2.7; P.col(M.vc, x, z, 0, 0.55, 0.035, 0.035, 5, true); }
    },
  },
];
