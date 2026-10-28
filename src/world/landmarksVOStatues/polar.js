// landmarksVOStatues/polar.js - the MONUMENT TO ALL POLAR EXPLORERS (B. M. Sergeev, O. N. Nikolaeva, 2017-09-09) on the plaza of the Arctic and Antarctic Research Institute (Beringa / Nalichnaya).  Photo
// n5102741821/c01 (opened): a bearded man, twice life-size (~2.3 m), in a thick shaggy fur parka with a fur ruff round the neck, fur trousers and big boots, wide stance, the right hand on a tall staff, looking ahead; he
// stands on one big smooth light grey-white granite boulder with sloped facets (about 3.5 x 2.5 m, 1.3 m high).  The two seated sled dogs at his feet come from the press descriptions (no photo of them) [W-web].
// The plaque carries the real dedication «Тем, кто шёл первым ...».  Collider: the boulder.
import { human, extend, cached, V } from '../lib/figures.js';
import { loft, ball } from './solids.js';
import { plateOn } from './plates.js';

/** a seated sled dog (husky): body, chest, haunch, forelegs, head with snout, ears, a curled tail; local +z = the way it looks; ~0.7 m high */
function dog(P, M, tint, x, y, z, rot) {
  P.push(x, y, z, rot);
  P.tint(tint);
  ball(P, M.vc, [0, 0.3, -0.06], [0.17, 0.2, 0.3], { w: 10, h: 8, dir: [0, 0.5, 1] });                       // the body, leaning back
  ball(P, M.vc, [0, 0.4, 0.14], [0.16, 0.2, 0.15], { w: 9, h: 7 });                                           // the chest
  ball(P, M.vc, [0, 0.12, -0.2], [0.19, 0.12, 0.22], { w: 9, h: 7 });                                         // the haunch
  for (const s of [-1, 1]) loft(P, M.vc, [[s * 0.09, 0.35, 0.16], [s * 0.09, 0.15, 0.24], [s * 0.09, 0.02, 0.26]], [[0.05, 0.045], [0.04, 0.035], [0.04, 0.045]], { seg: 6, per: 2 });
  loft(P, M.vc, [[0, 0.48, 0.2], [0, 0.6, 0.24], [0, 0.64, 0.32]], [[0.07, 0.08], [0.06, 0.07], [0.06, 0.06]], { seg: 7, per: 2 });                 // the neck
  ball(P, M.vc, [0, 0.66, 0.35], [0.09, 0.085, 0.11], { w: 9, h: 7 });                                        // the head
  ball(P, M.vc, [0, 0.62, 0.46], [0.045, 0.04, 0.07], { w: 7, h: 5 });                                        // the snout
  P.tint('#14110f'); ball(P, M.vc, [0, 0.64, 0.525], [0.017, 0.015, 0.015], { w: 5, h: 4 });
  P.tint(tint);
  for (const s of [-1, 1]) ball(P, M.vc, [s * 0.06, 0.76, 0.32], [0.022, 0.06, 0.03], { w: 6, h: 5, dir: [s * 0.2, 1, 0] });                    // the ears
  loft(P, M.vc, [[0, 0.1, -0.38], [0.14, 0.16, -0.48], [0.2, 0.3, -0.42], [0.14, 0.38, -0.34]], [[0.04, 0.04], [0.045, 0.045], [0.035, 0.035], [0.02, 0.02]], { seg: 6, per: 3 });   // the curled tail
  P.pop();
}

function figure() {
  return cached('vos-polar', () => extend(human({
    detail: 0.5, body: { sex: 'm', muscle: 0.5, bulk: 1.18, shoulders: 1.1 },
    pose: { head: [0.0, -0.12, 0], spine: [0.0, -0.05, 0.03], legs: { L: { foot: [0.3, 0, 0.1], yaw: 0.35 }, R: { foot: [-0.28, 0, -0.06], yaw: -0.35 } },
      arms: { R: { hand: [-0.38, 1.04, 0.16], pole: [-0.6, -0.4, -0.7], grip: 'fist' }, L: { hand: [0.3, 0.78, 0.06], pole: [0.6, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { torso: 'coat', hem: 0.82, flare: 0.5, folds: 0.3, sleeves: 'long', collar: 'none', trousers: 'long', boots: 0.34 },
    face: { age: 0.5, hair: 'short', beard: 'full', mouth: 'stern', seed: 72 },
  }), (S, info) => {
    const j = info.j, nb = j.neckBase;
    // the fur ruff round the neck: a thick lumpy ring
    S.tube('main', [[nb[0] - 0.12, nb[1] + 0.0, nb[2] + 0.02], [nb[0], nb[1] + 0.01, nb[2] + 0.14], [nb[0] + 0.12, nb[1] + 0.0, nb[2] + 0.02], [nb[0], nb[1] + 0.02, nb[2] - 0.12], [nb[0] - 0.12, nb[1] + 0.0, nb[2] + 0.02]], [[0.05, 0.05]], { closed: true, seg: 8, rings: 28, bump: (t, th) => 1 + 0.25 * Math.sin(th * 3 + t * 40) });
    // shaggy tufts of fur hanging round the hem and the sleeves
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2, r = 0.3 + 0.05 * Math.sin(i * 1.7), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.78, y = 0.5 + 0.08 * Math.sin(i * 2.3);
      S.tube('main', [[x, y + 0.14, z], [x * 1.04, y, z * 1.04], [x * 1.06, y - 0.15, z * 1.06]], [[0.035, 0.03], [0.04, 0.03], [0.012, 0.01]], { seg: 5, per: 2 });
    }
    const w = j.wristR; if (w) S.tube('main', [V.add(w, [0.02, -1.1, 0.0]), V.add(w, [0.0, 1.3, 0.0])], [[0.02, 0.02], [0.02, 0.02]], { seg: 6, per: 4 });          // the staff, 2.4 m
  }));
}

// the boulder: three overlapping ellipsoids [centre, radii, dir]; topAt(x, z) = the highest surface height there (where the figure and the dogs stand)
const ROCK = [[[0, 0.25, 0], [1.9, 1.05, 1.35]], [[-0.5, 0.3, -0.2], [1.5, 0.95, 1.1]], [[0.7, 0.18, 0.4], [1.0, 0.7, 0.85]]];
const topAt = (x, z) => ROCK.reduce((m, [c, r]) => { const q = 1 - ((x - c[0]) / r[0]) ** 2 - ((z - c[2]) / r[2]) ** 2; return q > 0 ? Math.max(m, c[1] + r[1] * Math.sqrt(q)) : m; }, 0);

export const PIECES = [{
  id: 'n5102741821', key: 'polar', name: 'Памятник всем полярникам', x: -6686, z: -1607.2, yaw: 'auto', h: 4.0, spot: 8, reach: 30,
  solid: [{ r: 1.9, h: 1.3, ox: 0, oz: 0 }, { w: 0.9, d: 0.5, h: 0.4, oz: 1.8 }],
  build(P, M, K) {
    P.tint(M.PAL.boulder); ball(P, M.vc, ROCK[0][0], ROCK[0][1], { w: 12, h: 8 });
    ball(P, M.vc, ROCK[1][0], ROCK[1][1], { w: 10, h: 7, dir: [0.4, 0.1, 1] });
    P.tint('#b9bab5'); ball(P, M.vc, ROCK[2][0], ROCK[2][1], { w: 10, h: 7, dir: [-0.3, 0.1, 1] });
    figure().place(P, M.bronzeBrownSet, 0.05, topAt(0.05, -0.05) - 0.05, -0.05, 0, 1.3);
    dog(P, M, '#8d8a85', 0.9, topAt(0.9, 0.7) - 0.06, 0.7, -0.5);
    dog(P, M, '#4b4a48', -0.95, topAt(-0.95, 0.6) - 0.06, 0.6, 0.55);
    P.tint('#a8a8a2'); P.box(M.vc, -0.45, 0.45, 0, 0.36, 1.55, 2.05, 'b');
    plateOn(P, M, K, 'polar', 0.7, 0.35, 0, 0.18, 2.062);
  },
}];
