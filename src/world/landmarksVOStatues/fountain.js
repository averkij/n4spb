// landmarksVOStatues/fountain.js - the SPbU fountain "ПЁТР ПЕРВЫЙ" (opened 2024-06-14; project T. Laska, S. Golubkov, architect M. Gusinskaya) on the plaza of Universitetskaya nab. near no. 13, with the bronze
// STUDENT (a cartoon figure after drawings by R. Shustrov).  Photos n12201012355/c00 c01 (opened): a shallow CURVED basin with a granite rim and thin jets (the water is a flat film at the rim level), a cobbled path
// curving round it, a raised wooden DECK on a granite wall behind it, a big faceted granite wedge at the end of the deck; the Student sits on the edge of the deck: a thin figure with a very long neck, a mortarboard
// with a tassel, a gown and a bow tie, the head thrown back with closed eyes and a smile, a pen in the raised right hand, a book in the left, the legs dangling over the granite, a stack of books and a small snail
// beside him.  The four mosaic panels (science, education, art, traditions) are on the granite wall.  The water is the Menshikov-fountain recipe (teal toon, silent jets as static tubes).  Solid: deck, wedge, basin.
import { human, Sculpt, V, face, hand, cached } from '../lib/figures.js';
import { loft, ball, prism } from './solids.js';
import { plateQuad } from './plates.js';

const DECK = { z0: -11.0, z1: -8.4, h: 0.5, x0: -3.6, x1: 3.6 };
const CX = 0, CZ = -12, R0 = 7.2, R1 = 5.0, A = 0.62;                 // the curved basin: an annulus sector round (CX, CZ), angles -A..A (0 = the +z direction)

function student() {
  return cached('vos-student', () => {
    const S = new Sculpt({ detail: 0.7 }), w = (n) => S.seg(n);
    // sitting on the deck edge at the origin (x = 0, y = 0 the deck top, z = 0 the edge), facing +z; the legs hang down in front
    const lean = -0.05;
    S.tube('main', [[0, 0.0, -0.18], [0, 0.06, 0.05], [0, 0.08, 0.2], [0, -0.1, 0.27], [0, -0.38, 0.28]], [[0.15, 0.15], [0.15, 0.14], [0.13, 0.12], [0.1, 0.09], [0.09, 0.085]], { seg: w(12), per: 3, ref: [1, 0, 0] });      // thighs and shins in the gown
    S.tube('main', [[0, 0.04, -0.2], [0, 0.3, -0.19 + lean], [0, 0.5, -0.17 + lean]], [[0.19, 0.14], [0.16, 0.11], [0.1, 0.08]], { seg: w(14), per: 3 });                                                     // the gown, upright torso
    S.blob('main', [0, 0.46, -0.17], [0.14, 0.04, 0.09], { w: 10, h: 6 });                                                                                                                                       // shoulders
    S.tube('main', [[0, 0.5, -0.17], [0, 0.78, -0.2], [0, 1.0, -0.26]], [[0.04, 0.04], [0.032, 0.032], [0.032, 0.032]], { seg: w(8), per: 4 });                                                                    // the very long neck, leaning back
    S.blob('dark', [0, 0.55, -0.12], [0.04, 0.012, 0.015], { w: 6, h: 4 });                                                                                                                                     // the bow tie
    for (const s of [-1, 1]) S.tube('main', [[s * 0.075, 0.08, 0.12], [s * 0.09, -0.4, 0.3], [s * 0.1, -0.5, 0.4]], [[0.04, 0.04]], { seg: 6, per: 2 });
    for (const s of [-1, 1]) { S.blob('dark', [s * 0.1, -0.46, 0.4], [0.06, 0.04, 0.12], { w: 8, h: 6 }); }                                                                                                    // the big shoes
    // the head: tilted back, a smile, curly hair
    const hc = [0, 1.1, -0.3], tilt = -0.6, cy = Math.cos(tilt), sy = Math.sin(tilt);
    const HF = { c: hc, x: [1, 0, 0], y: [0, cy, sy], z: [0, -sy, cy] };
    face(S, HF, { hair: 'curly', age: 0.1, mouth: 'smile', seed: 91, scale: 1.45, nose: 1.4 });
    // the mortarboard with its tassel
    S.blob('accent', V.add(hc, [0, 0.17, -0.01]), [0.15, 0.012, 0.15], { w: 8, h: 4, dir: [0, 1, 0.3] });
    S.blob('accent', V.add(hc, [0, 0.12, 0.0]), [0.09, 0.05, 0.09], { w: 8, h: 6 });
    S.tube('accent', [V.add(hc, [0.12, 0.16, 0.06]), V.add(hc, [0.17, 0.0, 0.08]), V.add(hc, [0.17, -0.1, 0.09])], [[0.006, 0.006], [0.008, 0.008], [0.018, 0.018]], { seg: 5, per: 3 });
    // the arms: the right (viewer's left) raised with a pen, the left holds an open book at the chest
    S.tube('main', [[-0.14, 0.45, -0.17], [-0.22, 0.34, -0.06], [-0.3, 0.46, 0.08], [-0.36, 0.56, 0.14]], [[0.04, 0.04], [0.045, 0.045], [0.04, 0.04], [0.032, 0.032]], { seg: 8, per: 3 });
    S.blob('main', [-0.38, 0.58, 0.17], [0.03, 0.03, 0.04], { w: 6, h: 5 }); S.tube('dark', [[-0.4, 0.6, 0.12], [-0.46, 0.62, 0.3]], [[0.008, 0.008], [0.004, 0.004]], { seg: 5, per: 2 });
    S.tube('main', [[0.14, 0.45, -0.17], [0.2, 0.3, -0.08], [0.12, 0.34, 0.06]], [[0.04, 0.04], [0.042, 0.042], [0.035, 0.035]], { seg: 8, per: 3 });
    S.blob('dark', [0.06, 0.4, 0.12], [0.07, 0.05, 0.015], { w: 7, h: 5, dir: [0, 0.3, 1] });                                                   // the book
    return S.finish({});
  });
}

export const PIECES = [{
  id: 'n12201012355', key: 'peterFountain', name: 'Фонтан «Пётр Первый» и скульптура «Студент»', x: -3006.6, z: -784, yaw: 'auto', h: 3.2, spot: 9, reach: 30, open: true,
  // n4spb (docs/AREAS.md 13.7, docs/vo-m3.md): the basin is shallow WATER to wade in (build() registers physics water), not six solid blocks; the deck on its granite wall and the wedge stay solid (structures, away from the river)
  solid: [{ w: 7.4, d: 2.7, h: 0.6, oz: -1.7 }, { w: 1.5, d: 3.1, h: 2.4, ox: 4.6, oz: -1.7 }],
  build(P, M, K) {
    const N = 20;
    if (K.ctx && K.ctx.physics && K.ctx.physics.addWater) {                          // the basin: the annulus sector R1 + 0.3 .. R0 - 0.3 round (CX, CZ + 8), the water film 0.22 m over the pavement
      const cs = Math.cos(K.yaw || 0), sn = Math.sin(K.yaw || 0), ring = [];
      const at = (r, a) => { const ox = CX + Math.sin(a) * r, oz = CZ + 8 + Math.cos(a) * r; return [K.x + ox * cs + oz * sn, K.z - ox * sn + oz * cs]; };
      for (let i = 0; i <= 8; i++) ring.push(...at(R0 - 0.3, -A + i / 8 * 2 * A));
      for (let i = 8; i >= 0; i--) ring.push(...at(R1 + 0.3, -A + i / 8 * 2 * A));
      K.ctx.physics.addWater({ ring, level: 0.22 });
    }
    P.push(0, 0, 8, 0);                                                           // the local origin is the middle of the composition
    // the granite rim of the basin (inner and outer edge) and the water film
    const arc = (r, a) => [CX + Math.sin(a) * r, CZ + Math.cos(a) * r];
    P.tint('#a3a29d');
    for (let i = 0; i < N; i++) {
      const a0 = -A + i / N * 2 * A, a1 = -A + (i + 1) / N * 2 * A;
      for (const [ra, rb] of [[R0, R0 - 0.3], [R1 + 0.3, R1]]) prism(P, M.vc, [arc(ra, a0), arc(ra, a1), arc(rb, a1), arc(rb, a0)], 0, 0.3);
    }
    const ring = []; for (let i = 0; i <= N; i++) ring.push(arc(R0 - 0.3, -A + i / N * 2 * A)); for (let i = N; i >= 0; i--) ring.push(arc(R1 + 0.3, -A + i / N * 2 * A));
    P.cap(M.water, ring, 0.22, true, 4);
    // six silent jets: slim plumes (a stem widening to a foam head)
    P.tint('#e8f1f4');
    for (let i = 0; i < 6; i++) { const a = -A * 0.8 + i / 5 * A * 1.6, [x, z] = arc((R0 + R1) / 2, a), h = 0.5 + 0.3 * (i % 3); P.cyl(M.vc, [x, 0.22, z], [x, 0.22 + h, z], 0.013, 0.034, 8, false); ball(P, M.vc, [x, 0.22 + h, z], [0.05, 0.02, 0.05], { w: 8, h: 4 }); }                // review: a pencil-thin spray slightly widening to a soft head (first build: uniform white poles read as lamp-posts; a 0.075 head read as an upside-down cone)
    // the deck on its granite wall
    P.tint('#a8a7a2'); P.box(M.vc, DECK.x0, DECK.x1, 0, DECK.h - 0.06, DECK.z0, DECK.z1, 'b');
    P.tint('#8a5a40'); P.box(M.vc, DECK.x0 - 0.05, DECK.x1 + 0.05, DECK.h - 0.06, DECK.h, DECK.z0 - 0.05, DECK.z1 + 0.05, 'b');
    // the mosaic panels on the granite wall (a 2 x 2 atlas, one quadrant each)
    for (let q = 0; q < 4; q++) {
      const x = -2.7 + q * 1.8, u0 = (q % 2) / 2, v0 = 1 - (Math.floor(q / 2) + 1) / 2;
      P.quad(M.mosaic, [x - 0.7, 0.1, DECK.z1 + 0.012], [x + 0.7, 0.1, DECK.z1 + 0.012], [x + 0.7, 0.4, DECK.z1 + 0.012], [x - 0.7, 0.4, DECK.z1 + 0.012], [0, 0, 1], [[u0, v0], [u0 + 0.5, v0], [u0 + 0.5, v0 + 0.5 * 0.3 / 0.5 * 0.5], [u0, v0 + 0.5 * 0.3 / 0.5 * 0.5]]);
    }
    // the granite wedge at the right end of the deck (faceted, slanted)
    P.tint('#b0a9a4');
    P.fan(M.vc, [[3.9, 0.0, -11.2], [5.3, 0.0, -11.2], [5.3, 2.5, -11.2], [3.9, 0.9, -11.2]], [0, 0, -1]);
    P.fan(M.vc, [[3.9, 0.0, -8.2], [3.9, 0.9, -8.2], [5.3, 2.5, -8.2], [5.3, 0.0, -8.2]], [0, 0, 1]);
    P.quad(M.vc, [3.9, 0.9, -11.2], [5.3, 2.5, -11.2], [5.3, 2.5, -8.2], [3.9, 0.9, -8.2], [-0.6, 0.8, 0]);
    P.quad(M.vc, [5.3, 0.0, -11.2], [5.3, 0.0, -8.2], [5.3, 2.5, -8.2], [5.3, 2.5, -11.2], [1, 0, 0]);
    P.quad(M.vc, [3.9, 0.0, -11.2], [3.9, 0.0, -8.2], [3.9, 0.9, -8.2], [3.9, 0.9, -11.2], [-1, 0, 0]);
    // the Student on the edge of the deck (left of the middle), books and a snail
    student().place(P, M.bronzeBrownSet, -1.3, DECK.h, DECK.z1 - 0.02, 0, 1.0);
    P.tint('#3b2a1c'); for (let i = 0; i < 4; i++) P.box(M.vc, 0.2 - i * 0.01, 0.5 + i * 0.01, DECK.h + i * 0.04, DECK.h + (i + 1) * 0.04, -9.05 - i * 0.01, -8.8 + i * 0.01, 'b');
    ball(P, M.vc, [0.62, DECK.h + 0.04, -8.9], [0.04, 0.035, 0.05], { w: 6, h: 5 });
    plateQuad(P, M, 'student', [0.85, DECK.h + 0.004, -8.62], [1.15, DECK.h + 0.004, -8.62], [1.15, DECK.h + 0.004, -8.76], [0.85, DECK.h + 0.004, -8.76]);
    P.pop();
    void human;
  },
}];
